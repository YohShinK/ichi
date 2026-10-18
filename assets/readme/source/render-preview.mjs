import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
const root = fileURLToPath(new URL("../../../", import.meta.url));
const out = path.resolve(
  process.argv[3] || path.join(root, "artifacts/readme-redesign-preview"),
);
const runtime = process.argv[2] || process.env.ICHI_README_TOOL_MODULES;
if (!runtime)
  throw new Error(
    "Pass the authoring-tools node_modules directory (marked + sharp); no product dependency is added.",
  );
const require = createRequire(path.join(runtime, "package.json"));
const { chromium } = createRequire(path.join(root, "apps/web/package.json"))(
  "@playwright/test",
);
const sharp = require("sharp");
const { marked } = await import(
  pathToFileURL(path.join(runtime, "marked/lib/marked.esm.js"))
);
const prettier = createRequire(path.join(root, "package.json"))("prettier");
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1200, height: 670 },
  deviceScaleFactor: 1,
});
await page.goto(
  pathToFileURL(path.join(root, "assets/readme/source/hero-layout.svg")).href,
);
await page.evaluate(() => document.fonts.ready);
await page.locator("svg").screenshot({ path: path.join(out, "hero.png") });
await sharp(path.join(out, "hero.png"))
  .webp({ quality: 93, effort: 6 })
  .toFile(path.join(root, "assets/readme/hero.webp"));
const manifestPath = path.join(
  root,
  "assets/readme/source/asset-manifest.json",
);
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const heroBytes = await fs.readFile(path.join(root, "assets/readme/hero.webp"));
manifest.assets = manifest.assets.filter((a) => a.file !== "hero.webp");
manifest.assets.push({
  file: "hero.webp",
  source: "source/hero-layout.svg",
  sourceSha256: createHash("sha256")
    .update(
      await fs.readFile(
        path.join(root, "assets/readme/source/hero-layout.svg"),
      ),
    )
    .digest("hex"),
  inputs: ["logo.png", "ui-capture.webp", "ui-map.webp"],
  outputSize: [1200, 670],
  sha256: createHash("sha256").update(heroBytes).digest("hex"),
  bytes: heroBytes.length,
  note: "Deterministic SVG layout composed with sanitized original project assets; published raster needs no external SVG resources",
});
await fs.writeFile(
  manifestPath,
  await prettier.format(JSON.stringify(manifest), {
    ...(await prettier.resolveConfig(manifestPath)),
    parser: "json",
  }),
);
const svgBounds = await page.evaluate(() =>
  [...document.querySelectorAll("text")].map((n) => {
    let b = n.getBBox();
    return {
      text: n.textContent,
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height,
    };
  }),
);
const md = await fs.readFile(path.join(root, "README.md"), "utf8");
let html = marked.parse(md);
const slug = (text) =>
  text
    .replace(/<[^>]+>/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replace(/\s/g, "-");
html = html.replace(
  /<h([1-6])>(.*?)<\/h\1>/gs,
  (_, level, text) => `<h${level} id="${slug(text)}">${text}</h${level}>`,
);
const document = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ICHI README · 本地审阅</title><base href="${pathToFileURL(root + "/").href}"><style>
:root{color-scheme:light;--bg:#fff;--fg:#1f2328;--muted:#59636e;--line:#d1d9e0;--code:#f6f8fa;--link:#0969da}
@media(prefers-color-scheme:dark){:root{color-scheme:dark;--bg:#0d1117;--fg:#e6edf3;--muted:#9198a1;--line:#3d444d;--code:#151b23;--link:#4493f8}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei','Noto Sans CJK SC',sans-serif}.markdown-body{max-width:964px;margin:0 auto;padding:32px}h1,h2,h3{line-height:1.3;font-weight:650}h1{font-size:32px;border-bottom:1px solid var(--line);padding-bottom:8px;margin:0 0 16px}h2{font-size:24px;margin:30px 0 16px;padding-bottom:8px;border-bottom:1px solid var(--line)}h3{font-size:20px;margin:24px 0 16px}p{margin:0 0 16px}a{color:var(--link);text-decoration:none}a:hover{text-decoration:underline}img{max-width:100%;height:auto;vertical-align:top}code,pre{font-family:ui-monospace,'SFMono-Regular',Menlo,Consolas,monospace;font-size:85%}code{background:var(--code);padding:.2em .4em;border-radius:5px}pre{background:var(--code);padding:16px;border-radius:6px;overflow:auto;line-height:1.5}pre code{padding:0;font-size:100%}table{border-collapse:collapse;max-width:100%;display:block;overflow:auto;margin-bottom:16px}th,td{border:1px solid var(--line);padding:6px 13px;text-align:left}tr:nth-child(2n){background:var(--code)}ul,ol{padding-left:2em}li+li{margin-top:.25em}summary{cursor:pointer;color:var(--link)}details{margin-bottom:16px}details[open] summary{margin-bottom:16px}@media(max-width:767px){.markdown-body{padding:24px 16px}h1{font-size:26px}h2{font-size:22px}h3{font-size:19px}}
</style></head><body><article class="markdown-body">${html}</article></body></html>`;
await fs.writeFile(path.join(out, "preview.html"), document);
const qa = [];
for (const width of [964, 360])
  for (const mode of ["light", "dark"]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme: mode });
    await page.goto(pathToFileURL(path.join(out, "preview.html")).href);
    await page.evaluate(() => document.fonts.ready);
    await page
      .locator("details")
      .evaluateAll((nodes) => nodes.forEach((n) => (n.open = true)));
    const data = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      viewport: innerWidth,
      images: [...document.images].map((i) => ({
        src: i.getAttribute("src"),
        complete: i.complete,
        naturalWidth: i.naturalWidth,
        width: i.getBoundingClientRect().width,
      })),
      headingIds: [...document.querySelectorAll("h1,h2,h3")].map((n) => n.id),
      brokenAnchors: [...document.querySelectorAll('a[href^="#"]')]
        .filter(
          (a) => !document.getElementById(decodeURIComponent(a.hash.slice(1))),
        )
        .map((a) => a.hash),
    }));
    const tag = `${width === 964 ? "desktop-900" : "mobile-360"}-${mode}`;
    await page.screenshot({
      path: path.join(out, tag + ".png"),
      fullPage: true,
    });
    await page.screenshot({
      path: path.join(out, tag + "-first-screen.png"),
      fullPage: false,
    });
    qa.push({ tag, ...data });
  }
await page.setViewportSize({ width: 1200, height: 390 });
await page.goto(
  pathToFileURL(path.join(root, "assets/readme/sharing-flow.svg")).href,
);
await page
  .locator("svg")
  .screenshot({ path: path.join(out, "sharing-flow.png") });
qa.push({ heroTextBounds: svgBounds });
await fs.writeFile(
  path.join(out, "render-checks.json"),
  JSON.stringify(qa, null, 2),
);
await browser.close();
console.log(
  JSON.stringify(
    qa.map(({ tag, scrollWidth, viewport, images, brokenAnchors }) => ({
      tag,
      scrollWidth,
      viewport,
      images: images?.length,
      brokenImages: images?.filter((i) => !i.complete || !i.naturalWidth),
      brokenAnchors,
    })),
    null,
    2,
  ),
);
console.log(out);
