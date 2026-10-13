import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { retrieveImage } from "../../skills/ichi-network-curation/scripts/media-evidence.mjs";
const python = process.env.ICHI_IMAGE_DECODER_PYTHON;
const dirs = [];
afterEach(async () => {
  for (const dir of dirs.splice(0))
    await fs.rm(dir, { recursive: true, force: true });
});
async function fixture() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ichi-media-test-"));
  dirs.push(dir);
  const image = path.join(dir, "fixture.png");
  execFileSync(python, [
    "-c",
    "from PIL import Image;import sys;Image.new('RGB',(800,900),'white').save(sys.argv[1])",
    image,
  ]);
  return {
    dir,
    bytes: await fs.readFile(image),
    python,
    index: 1,
    image: { url: "https://example.test/stale", width: 2400, height: 2700 },
    binding: {
      articleId: "test",
      canonicalUrl: "https://example.test/post",
      sourcePublishedAt: "2026-10-09T00:00:00.000Z",
    },
    openFullImage: async () => ({ loaded: true }),
    refreshImage: async () => ({ url: "https://example.test/fresh" }),
  };
}
describe("bounded real-image evidence retrieval", () => {
  it("rejects an HTML body returned as successful image and refreshes the actual resource", async () => {
    const f = await fixture();
    const urls = [];
    const result = await retrieveImage({
      ...f,
      fetchResource: async (url) => {
        urls.push(url);
        return new Response(
          url.endsWith("stale") ? "<html>error</html>" : f.bytes,
        );
      },
    });
    expect(urls).toEqual([f.image.url, "https://example.test/fresh"]);
    expect(result.attempts[0].status).toBe("FAILED");
    expect(result.attempts[0].rejectedSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.evidence.width).toBe(800);
    expect(result.evidence.height).toBe(900);
    expect(result.evidence.clarityStatus).toBe("AWAITING_VISUAL_TICKET_REVIEW");
  });
  it("falls back to a bound complete screenshot when public save and requests fail", async () => {
    const f = await fixture();
    const result = await retrieveImage({
      ...f,
      fetchResource: async () => new Response("", { status: 403 }),
      pageFetch: async () => ({ ok: false, status: 403 }),
      browserDownload: async () => {
        throw Error("AUTHOR_SAVE_DISABLED");
      },
      screenshot: async (_, file) => {
        await fs.writeFile(file, f.bytes);
        return {
          completeImage: true,
          width: 800,
          height: 900,
          visibleScale: 1,
        };
      },
    });
    expect(result.evidence.evidenceKind).toBe("SCREENSHOT");
    expect(result.evidence.articleId).toBe("test");
    expect(result.evidence.index).toBe(1);
    expect(result.evidence.screenshotGeometry.completeImage).toBe(true);
    expect(result.attempts.filter((x) => x.status === "FAILED")).toHaveLength(
      4,
    );
  });
  it("queues a cropped or small screenshot and limits each recovery method to one attempt", async () => {
    const f = await fixture();
    let count = 0;
    const result = await retrieveImage({
      ...f,
      fetchResource: async () => {
        count++;
        return new Response("", { status: 403 });
      },
      screenshot: async (_, file) => {
        await fs.writeFile(file, f.bytes);
        return { completeImage: false, width: 300, visibleScale: 0.2 };
      },
    });
    expect(count).toBe(2);
    expect(result.evidence).toBeNull();
    expect(result.pending.status).toBe("NEEDS_MEDIA_RETRIEVAL");
  });
  it("stops for user control without requesting another resource", async () => {
    const f = await fixture();
    let refresh = 0;
    await expect(
      retrieveImage({
        ...f,
        fetchResource: async () => new Response("", { status: 403 }),
        openFullImage: async () => {
          throw Error("TaskSpace delegated to user");
        },
        refreshImage: async () => {
          refresh++;
        },
      }),
    ).rejects.toThrow("delegated");
    expect(refresh).toBe(0);
  });
  it("keeps a changed image or source time pending without taking screenshot evidence", async () => {
    const f = await fixture();
    let screens = 0;
    const result = await retrieveImage({
      ...f,
      fetchResource: async () => new Response("", { status: 403 }),
      refreshImage: async () => {
        throw Error("REFRESH_SOURCE_OR_IMAGE_CHANGED");
      },
      screenshot: async () => {
        screens++;
      },
    });
    expect(result.pending.status).toBe("SOURCE_OR_IMAGE_CHANGED_NEEDS_REVIEW");
    expect(screens).toBe(0);
  });
});
