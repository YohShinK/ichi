import { chromium } from "/Users/cunfu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = import.meta.dirname;
const ids = ["N2", "E1", "E2", "O1", "O2"];
const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
});

const strings = (value) => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
};

let failed = false;
const reports = [];
try {
  for (const id of ids) {
    const lower = id.toLowerCase();
    const htmlPath = path.join(root, `${lower}-visual-v3.html`);
    const screenshotPath = path.join(root, `${lower}-visual-v3.png`);
    const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifests", `${id}.json`), "utf8"));
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
    await page.keyboard.press("b");
    await page.waitForTimeout(180);
    const report = await page.evaluate(() => {
      const visible = [...document.querySelectorAll(".atlas-page *")].filter((el) => {
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      });
      const overflows = visible.map((el) => {
        const rect = el.getBoundingClientRect();
        return { tag: el.tagName, cls: el.className, text: (el.textContent || "").trim().slice(0, 60), left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
      }).filter((x) => x.left < -1 || x.top < -1 || x.right > innerWidth + 1 || x.bottom > innerHeight + 1);
      const leafText = visible.filter((el) => (el.textContent || "").trim() && !el.children.length);
      const fontSizes = leafText.map((el) => parseFloat(getComputedStyle(el).fontSize)).filter(Number.isFinite);
      return {
        slides: document.querySelectorAll("section.slide").length,
        overflowCount: overflows.length,
        overflows: overflows.slice(0, 8),
        minimumTextPx: Math.min(...fontSizes),
        titlePx: parseFloat(getComputedStyle(document.querySelector(".atlas-title")).fontSize),
        pageText: document.querySelector(".atlas-page").innerText.replace(/\s+/g, " ").trim()
      };
    });
    const required = strings(manifest).filter((x) =>
      x.length >= 3 &&
      ![manifest.layout, manifest.theme, manifest.id].includes(x) &&
      !/^[A-Z0-9]+-[A-Z0-9-]+$/.test(x)
    );
    const missing = required.filter((x) => !report.pageText.includes(x.replace(/\s+/g, " ").trim()));
    await page.screenshot({ path: screenshotPath, fullPage: false });
    await page.close();
    const summary = { id, slides: report.slides, overflowCount: report.overflowCount, minimumTextPx: report.minimumTextPx, titlePx: report.titlePx, missingManifestStrings: missing, screenshotPath };
    reports.push(summary);
    if (report.slides !== 1 || report.overflowCount || report.minimumTextPx < 14 || missing.length) failed = true;
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify(reports, null, 2));
if (failed) process.exitCode = 2;
