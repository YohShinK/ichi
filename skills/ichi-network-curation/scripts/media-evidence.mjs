import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const sha = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const preserveControlStop = (error) => {
  if (
    error.executionStopped ||
    error.mayHaveLateEffects ||
    /TaskSpace|TASK_SPACE|delegated|unassigned|inactive|user.*control|control.*user|permission prompt/i.test(
      String(error.message ?? error),
    )
  )
    throw error;
};
const decodeScript = `import json,sys
from PIL import Image
with Image.open(sys.argv[1]) as image:
 image.verify()
with Image.open(sys.argv[1]) as image:
 image.load()
 print(json.dumps({"width":image.width,"height":image.height,"format":image.format}))`;

export function decodeImage(file, python) {
  if (!path.isAbsolute(python ?? ""))
    throw Error("EXPLICIT_IMAGE_DECODER_REQUIRED");
  const value = JSON.parse(
    execFileSync(python, ["-c", decodeScript, file], {
      timeout: 15000,
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 8192,
    }).toString(),
  );
  if (
    value.width < 256 ||
    value.height < 256 ||
    !["PNG", "JPEG", "WEBP"].includes(value.format)
  )
    throw Error("IMAGE_TOO_SMALL_OR_UNSUPPORTED");
  return value;
}

// One attempt per method. Failure artifacts and resource provenance are retained.
// A successfully decoded image still requires visual ticket-area review.
export async function retrieveImage({
  image,
  index,
  dir,
  binding,
  python,
  fetchResource = globalThis.fetch,
  openFullImage,
  refreshImage,
  pageFetch,
  browserDownload,
  screenshot,
  prefix = "image",
}) {
  const attempts = [];
  let serial = 0;
  const attempt = async (method, resourceUrl, producer, extra = {}) => {
    const file = path.join(dir, `${prefix}-${index}-attempt-${++serial}.bin`);
    const entry = {
      method,
      at: new Date().toISOString(),
      resourceUrl: resourceUrl ?? null,
      ...extra,
    };
    attempts.push(entry);
    try {
      await producer(file, entry);
      const decoded = decodeImage(file, python),
        bytes = await fs.readFile(file);
      if (bytes.length > 40 * 1024 * 1024) throw Error("IMAGE_SIZE_LIMIT");
      const ext = { PNG: "png", JPEG: "jpg", WEBP: "webp" }[decoded.format];
      const final = file.replace(/\.bin$/, `.${ext}`);
      await fs.rename(file, final);
      entry.status = "SUCCESS";
      entry.path = path.basename(final);
      entry.sha256 = sha(bytes);
      Object.assign(entry, decoded, { bytes: bytes.length });
      return {
        path: entry.path,
        sha256: entry.sha256,
        bytes: bytes.length,
        ...decoded,
        index,
        method,
        resourceUrl: resourceUrl ?? null,
        ...binding,
        evidenceKind:
          method === "FULL_IMAGE_SCREENSHOT" ? "SCREENSHOT" : "PHOTO",
        clarityStatus: "AWAITING_VISUAL_TICKET_REVIEW",
        ...extra,
      };
    } catch (error) {
      preserveControlStop(error);
      entry.status = "FAILED";
      entry.error = String(error.message ?? error).slice(0, 180);
      try {
        const bytes = await fs.readFile(file);
        entry.rejectedPath = path.basename(file);
        entry.rejectedSha256 = sha(bytes);
        entry.rejectedBytes = bytes.length;
      } catch {}
      return null;
    }
  };
  const normal = (url) => url?.replace(/^http:/, "https:");
  const download = (url) => async (file, entry) => {
    if (!url || !/^https:\/\//.test(url))
      throw Error("PUBLIC_IMAGE_URL_MISSING");
    const response = await fetchResource(url, {
      signal: AbortSignal.timeout(15000),
    });
    entry.httpStatus = response.status;
    if (!response.ok) throw Error(`IMAGE_HTTP_${response.status}`);
    if (Number(response.headers.get("content-length")) > 40 * 1024 * 1024)
      throw Error("IMAGE_SIZE_LIMIT");
    const bytes = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(file, bytes);
  };
  await fs.mkdir(dir, { recursive: true });
  let url = normal(image.url),
    result = await attempt("NORMAL_DOWNLOAD", url, download(url));
  if (result) return { evidence: result, attempts };
  let visible;
  try {
    visible = await openFullImage(index);
    attempts.push({
      method: "OPEN_FULL_IMAGE",
      at: new Date().toISOString(),
      status: "SUCCESS",
      ...visible,
    });
  } catch (error) {
    preserveControlStop(error);
    attempts.push({
      method: "OPEN_FULL_IMAGE",
      status: "FAILED",
      error: String(error.message).slice(0, 180),
    });
  }
  // Reopen the original post to refresh a stale resource, without changing its observation time.
  try {
    const current = await refreshImage(index);
    url = normal(current.url);
    attempts.push({
      method: "REFRESH_PUBLIC_RESOURCE",
      at: new Date().toISOString(),
      status: "SUCCESS",
      ...current,
    });
  } catch (error) {
    preserveControlStop(error);
    attempts.push({
      method: "REFRESH_PUBLIC_RESOURCE",
      status: "FAILED",
      error: String(error.message).slice(0, 180),
    });
    if (String(error.message).includes("REFRESH_SOURCE_OR_IMAGE_CHANGED"))
      return {
        evidence: null,
        attempts,
        pending: {
          ...binding,
          index,
          status: "SOURCE_OR_IMAGE_CHANGED_NEEDS_REVIEW",
        },
      };
  }
  result = await attempt("REFRESHED_NORMAL_DOWNLOAD", url, download(url));
  if (result) return { evidence: result, attempts };
  if (pageFetch) {
    result = await attempt("BROWSER_PAGE_REQUEST", url, async (file, entry) => {
      const response = await pageFetch(url, file);
      entry.httpStatus = response.status;
      if (!response.ok) throw Error(`PAGE_IMAGE_HTTP_${response.status}`);
    });
    if (result) return { evidence: result, attempts };
  }
  if (browserDownload) {
    result = await attempt("VISIBLE_BROWSER_DOWNLOAD", url, (file) =>
      browserDownload(index, file),
    );
    if (result) return { evidence: result, attempts };
  }
  if (screenshot) {
    const geometry = {};
    result = await attempt(
      "FULL_IMAGE_SCREENSHOT",
      url,
      async (file) => {
        const actual = await screenshot(index, file);
        Object.assign(geometry, actual);
        if (
          !actual.completeImage ||
          actual.width < 640 ||
          actual.visibleScale < 0.8
        )
          throw Error("FULL_IMAGE_SCREENSHOT_INSUFFICIENT");
      },
      { screenshotGeometry: geometry },
    );
    if (result) return { evidence: result, attempts };
  }
  return {
    evidence: null,
    attempts,
    pending: {
      ...binding,
      index,
      status: "NEEDS_MEDIA_RETRIEVAL",
      originalResourceUrl: image.url,
      sourceDimensions: { width: image.width, height: image.height },
    },
  };
}
