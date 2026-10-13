// Public note metadata and all publicly displayed note images, via Ego.
const fs = await import("node:fs/promises");
const crypto = await import("node:crypto");
const { retrieveImage } = await import("./media-evidence.mjs");
const config = JSON.parse(
  await fs.readFile(process.env.ICHI_COLLECTION_CONFIG, "utf8"),
);
if (
  !Number.isInteger(config.taskSpaceId) ||
  !/^p[0-9]+$/.test(config.pageLabel) ||
  !config.root?.startsWith("/")
)
  throw Error("EXPLICIT_CAPTURE_CONFIG_REQUIRED");
const root = config.root;
const queue = config.queue;
if (!config.decoderPython?.startsWith("/"))
  throw Error("EXPLICIT_IMAGE_DECODER_REQUIRED");
if (
  !Array.isArray(queue) ||
  queue.length > 50 ||
  queue.some(
    (q) =>
      !/^[a-f0-9]{24}$/.test(q.id) ||
      !q.href?.startsWith("https://www.xiaohongshu.com/"),
  )
)
  throw Error("INVALID_CAPTURE_QUEUE");
const task = await taskSpace(config.taskSpaceId),
  page = task.page(config.pageLabel);
const navigateNote = async (href, id, force = false) => {
  const matches = (value) => {
    const u = new URL(value);
    return (
      u.origin === "https://www.xiaohongshu.com" &&
      u.pathname.endsWith("/" + id)
    );
  };
  if (!force && matches(await page.url())) return "RESUMED_MATCHING_NOTE_PAGE";
  try {
    await page.goto(href, { waitUntil: "domcontentloaded", timeout: 15000 });
    return null;
  } catch (error) {
    if (
      error.executionStopped ||
      error.mayHaveLateEffects ||
      /TaskSpace|TASK_SPACE|delegated|unassigned|inactive|user.*control|control.*user|permission prompt/i.test(
        String(error.message),
      )
    )
      throw error;
    if (
      !/PageNavigationTimeout|page.goto timed out/.test(String(error)) ||
      !matches(await page.url())
    )
      throw error;
    return "COMMITTED_NOTE_WAIT_FOR_PUBLIC_CONTENT";
  }
};
for (const { id, href } of queue) {
  const dir = root + "/candidates/xhs-" + id;
  let originalCapture = null;
  try {
    const bytes = await fs.readFile(dir + "/capture.json");
    if (!config.retryPending) {
      console.log({ id, status: "EXISTING_FROZEN_CAPTURE_KEPT" });
      continue;
    }
    originalCapture = {
      data: JSON.parse(bytes),
      sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    };
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  const navigationRecovery = await navigateNote(href, id);
  await page.cdp("Emulation.setDeviceMetricsOverride", {
    width: 1100,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await page.waitForFunction(
    (id) =>
      !!window.__INITIAL_STATE__?.note?.noteDetailMap?.[id]?.note ||
      /笔记不存在|无法浏览/.test(document.body.innerText),
    id,
    { timeout: 15000 },
  );
  const data = await page.evaluate((id) => {
    const n = window.__INITIAL_STATE__?.note?.noteDetailMap?.[id]?.note;
    if (!n)
      return {
        articleId: id,
        captureStatus: "INACCESSIBLE",
        publicError: document.body.innerText.slice(-500),
      };
    return {
      articleId: id,
      canonicalUrl: "https://www.xiaohongshu.com/explore/" + id,
      captureStatus: "CAPTURED",
      title: n.title,
      text: n.desc,
      sourcePublishedAt: new Date(n.time).toISOString(),
      sourceUpdatedAt: new Date(n.lastUpdateTime).toISOString(),
      ipLocation: n.ipLocation,
      author: { name: n.user?.nickname, id: n.user?.userId },
      publicAuthorUrl: document.querySelector(
        'a[href*="/user/profile/"][href*="channel_type=web_note_detail"]',
      )?.href,
      images: n.imageList.map((x) => ({
        fileId: x.fileId,
        width: x.width,
        height: x.height,
        url: x.urlDefault || x.urlPre,
      })),
      publicDateText: [...document.querySelectorAll("[class*=date]")]
        .map((x) => x.textContent)
        .filter(Boolean),
    };
  }, id);
  const media = await page.evaluate(
    (id) => ({
      mediaKind:
        window.__INITIAL_STATE__?.note?.noteDetailMap?.[id]?.note?.type ?? null,
      videoElementPresent: !!document.querySelector("video"),
    }),
    id,
  );
  Object.assign(data, media);
  data.navigationRecovery = navigationRecovery;
  if (originalCapture) {
    const prior = originalCapture.data;
    if (
      prior.canonicalUrl !== data.canonicalUrl ||
      prior.sourcePublishedAt !== data.sourcePublishedAt ||
      prior.images?.length !== data.images?.length ||
      prior.images.some(
        (x, i) =>
          (x.fileId ?? x.url.split("/").slice(5).join("/").split("!")[0]) !==
          data.images[i].fileId,
      )
    )
      throw Error("RECOVERY_SOURCE_OR_IMAGE_CHANGED_NEEDS_REVIEW");
    data.originalCaptureSha256 = originalCapture.sha256;
    data.fetchedAt = prior.fetchedAt;
  }
  await fs.mkdir(dir, { recursive: true });
  const attemptId =
    Date.now().toString() + "-" + crypto.randomBytes(3).toString("hex");
  const mediaRelative = "retrieval-" + attemptId;
  const mediaDir = dir + "/" + mediaRelative;
  await fs.mkdir(mediaDir, { recursive: false });
  const fullImage = async (index) => {
    if (
      !(await page.evaluate(
        () => !!document.querySelector(".preview-interactive"),
      ))
    )
      await page.click(".note-slider .swiper-slide-active img", {
        label: "打开完整版面大图",
      });
    await page.waitForSelector(".preview-interactive", { timeout: 5000 });
    const current = await page.evaluate(() =>
      Number(
        document
          .querySelector(".preview-toolbar-pager-num")
          ?.textContent.split("/")[0],
      ),
    );
    if (!Number.isInteger(current)) throw Error("FULL_IMAGE_INDEX_UNAVAILABLE");
    for (let i = current; i !== index; i += index > current ? 1 : -1) {
      const label = index > current ? "下一张" : "上一张";
      await page.evaluate(
        (label) =>
          [
            ...document.querySelectorAll(
              ".preview-toolbar-pager .popover-container",
            ),
          ]
            .find((x) => x.textContent.trim() === label)
            ?.querySelector(".preview-toolbar-btn")
            ?.click(),
        label,
      );
      await page.waitForFunction(
        (expected) =>
          Number(
            document
              .querySelector(".preview-toolbar-pager-num")
              ?.textContent.split("/")[0],
          ) === expected,
        i + (index > current ? 1 : -1),
        { timeout: 5000 },
      );
    }
    const fileId = data.images[index - 1].fileId;
    await page.waitForFunction(
      (fileId) => {
        const img = document.querySelector(".preview-interactive");
        return (
          img?.complete &&
          img.naturalWidth > 0 &&
          img.currentSrc.includes(fileId)
        );
      },
      fileId,
      { timeout: 8000 },
    );
    return page.evaluate(() => {
      const img = document.querySelector(".preview-interactive");
      return {
        url: img.currentSrc,
        loaded: img.complete,
        width: img.naturalWidth,
        height: img.naturalHeight,
      };
    });
  };
  const results = [];
  for (let i = 0; i < (data.images || []).length; i++) {
    const result = await retrieveImage({
      image: originalCapture?.data.images[i] ?? data.images[i],
      index: i + 1,
      dir: mediaDir,
      python: config.decoderPython,
      binding: {
        articleId: id,
        canonicalUrl: data.canonicalUrl,
        sourcePublishedAt: data.sourcePublishedAt,
      },
      openFullImage: fullImage,
      refreshImage: async (index) => {
        await navigateNote(href, id, true);
        await page.waitForFunction(
          (id) => !!window.__INITIAL_STATE__?.note?.noteDetailMap?.[id]?.note,
          id,
          { timeout: 10000 },
        );
        const current = await page.evaluate(
          ({ id, index }) => {
            const n = window.__INITIAL_STATE__.note.noteDetailMap[id].note,
              x = n.imageList[index - 1];
            return {
              sourcePublishedAt: new Date(n.time).toISOString(),
              fileId: x?.fileId,
              url: x?.urlDefault,
            };
          },
          { id, index },
        );
        if (
          current.sourcePublishedAt !== data.sourcePublishedAt ||
          current.fileId !== data.images[index - 1].fileId
        )
          throw Error("REFRESH_SOURCE_OR_IMAGE_CHANGED");
        await fullImage(index);
        return current;
      },
      pageFetch: (url, saveAs) => page.fetch(url, { saveAs, timeout: 15000 }),
      browserDownload: async (index, file) => {
        await fullImage(index);
        const available = await page.evaluate(() => {
          const button = [
            ...document.querySelectorAll(".preview-toolbar .popover-container"),
          ]
            .find((x) => x.textContent.trim() === "下载")
            ?.querySelector(".preview-toolbar-btn");
          return !!button && !button.className.includes("disabled");
        });
        if (!available)
          throw Error("AUTHOR_SAVE_DISABLED_OR_DOWNLOAD_UNAVAILABLE");
        const waiting = page.waitForEvent("download", { timeout: 8000 });
        await page.evaluate(() =>
          [...document.querySelectorAll(".preview-toolbar .popover-container")]
            .find((x) => x.textContent.trim() === "下载")
            .querySelector(".preview-toolbar-btn")
            .click(),
        );
        const download = await waiting;
        await download.saveAs(file);
      },
      screenshot: async (index, file) => {
        await page.cdp("Emulation.setDeviceMetricsOverride", {
          width: 1400,
          height: 2200,
          deviceScaleFactor: 1,
          mobile: false,
        });
        await fullImage(index);
        const geometry = await page.evaluate(() => {
          const img = document.querySelector(".preview-interactive"),
            r = img.getBoundingClientRect();
          return {
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
            visibleScale: Math.min(
              r.width / img.naturalWidth,
              r.height / img.naturalHeight,
            ),
            completeImage:
              r.x >= 0 &&
              r.y >= 0 &&
              r.right <= innerWidth &&
              r.bottom <= innerHeight,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
          };
        });
        if (
          !geometry.completeImage ||
          geometry.width < 640 ||
          geometry.visibleScale < 0.8
        )
          throw Error("FULL_IMAGE_SCREENSHOT_INSUFFICIENT");
        await page.screenshot({
          path: file,
          clip: {
            x: geometry.x,
            y: geometry.y,
            width: geometry.width,
            height: geometry.height,
          },
        });
        return geometry;
      },
    });
    if (result.evidence && data.mediaKind === "video")
      result.evidence.evidenceKind = "VIDEO_COVER";
    if (result.evidence)
      result.evidence.path = mediaRelative + "/" + result.evidence.path;
    results.push(result);
    await fs.writeFile(
      mediaDir + `/retrieval-image-${i + 1}.json`,
      JSON.stringify(result, null, 2),
      { flag: "wx" },
    );
  }
  data.fetchedAt ??= new Date().toISOString();
  data.mediaRetrievedAt = new Date().toISOString();
  data.evidence = results.map((x) => x.evidence).filter(Boolean);
  data.imageFailures = results.map((x) => x.pending).filter(Boolean);
  data.retrievalAttempts = results.map((x, i) => ({
    index: i + 1,
    attempts: x.attempts,
  }));
  data.evidenceCompleteness = data.imageFailures.length
    ? "NEEDS_MEDIA_RETRIEVAL"
    : data.mediaKind === "video"
      ? "VIDEO_PLAYBACK_FRAMES_REQUIRED"
      : "ALL_MEDIA_DECODED_AWAITING_VISUAL_REVIEW";
  const captureFile = originalCapture
    ? "/capture-supplement-" + attemptId + ".json"
    : "/capture.json";
  await fs.writeFile(dir + captureFile, JSON.stringify(data, null, 2), {
    flag: "wx",
  });
  if (data.mediaKind === "video")
    await fs.appendFile(
      root + "/video-pending.jsonl",
      JSON.stringify({
        articleId: id,
        href,
        captureFile: dir + captureFile,
        captureSha256: crypto
          .createHash("sha256")
          .update(await fs.readFile(dir + captureFile))
          .digest("hex"),
        sourcePublishedAt: data.sourcePublishedAt ?? null,
        status: "ACTUAL_PLAYBACK_AND_CLEAR_TICKET_FRAMES_REQUIRED",
      }) + "\n",
    );
  if (data.imageFailures.length)
    await fs.appendFile(
      root + "/media-pending.jsonl",
      JSON.stringify({
        articleId: id,
        href,
        captureFile: dir + captureFile,
        originalCaptureSha256: data.originalCaptureSha256 ?? null,
        failures: data.imageFailures,
      }) + "\n",
    );
  console.log({
    id,
    title: data.title,
    published: data.sourcePublishedAt,
    author: data.author?.name,
    images: data.evidence.length,
    failures: data.imageFailures,
    status: data.captureStatus,
  });
}
