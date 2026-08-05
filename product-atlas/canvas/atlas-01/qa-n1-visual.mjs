import { chromium } from "/Users/cunfu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = import.meta.dirname;
const htmlPath = path.join(root, "n1-visual-v3.html");
const screenshotPath = path.join(root, "n1-visual-v3.png");
const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
});

try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
  await page.keyboard.press("b");
  await page.waitForTimeout(250);
  const report = await page.evaluate(() => {
    const viewport = { width: innerWidth, height: innerHeight };
    const visible = [...document.querySelectorAll(".n1-page *")].filter((el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    });
    const overflows = visible.map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        cls: el.className,
        text: (el.textContent || "").trim().slice(0, 50),
        left: Math.round(rect.left), top: Math.round(rect.top),
        right: Math.round(rect.right), bottom: Math.round(rect.bottom)
      };
    }).filter((x) => x.left < -1 || x.top < -1 || x.right > viewport.width + 1 || x.bottom > viewport.height + 1);
    const textNodes = visible.filter((el) => (el.textContent || "").trim() && !el.children.length);
    const fontSizes = textNodes.map((el) => parseFloat(getComputedStyle(el).fontSize)).filter(Number.isFinite);
    const semanticCount = document.querySelectorAll(".n1-context-card,.th-node,.n1-panel,.n1-decision,.n1-evidence-item,.n1-question,.n1-consequence").length;
    return {
      viewport,
      slides: document.querySelectorAll("section.slide").length,
      semanticCount,
      overflowCount: overflows.length,
      overflows: overflows.slice(0, 12),
      minimumTextPx: Math.min(...fontSizes),
      bodyTextPx: getComputedStyle(document.querySelector(".n1-copy")).fontSize,
      titlePx: getComputedStyle(document.querySelector(".n1-title")).fontSize,
      pageTextLength: document.querySelector(".n1-page").innerText.length
    };
  });
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(JSON.stringify({ ...report, screenshotPath }, null, 2));
  if (report.overflowCount) process.exitCode = 2;
  if (report.minimumTextPx < 14) process.exitCode = 3;
} finally {
  await browser.close();
}
