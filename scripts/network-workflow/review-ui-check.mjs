import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { check, json, atomic } from "./store.mjs";

const require = createRequire(
  new URL("../../apps/web/package.json", import.meta.url),
);
const { chromium } = require("@playwright/test");
const pageFile = path.resolve(process.argv[2]),
  output = path.resolve(process.argv[3]);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  await page.goto(pathToFileURL(pageFile).href);
  const cards = await page.locator("article").count();
  check(cards > 0, "NO_FOUNDER_CARDS_RENDERED");
  const images = await page.locator("article img").evaluateAll((items) =>
    items.map((i) => ({
      loaded: i.complete && i.naturalWidth > 0,
      inline: i.src.startsWith("data:image/"),
    })),
  );
  check(
    images.length >= cards && images.every((i) => i.loaded && i.inline),
    "ORIGINAL_FOUNDER_IMAGES_NOT_RENDERED",
  );
  check(
    (await page.locator('input[type="checkbox"]:checked').count()) === 0,
    "UNCONFIRMED_CHECKS_PRESELECTED",
  );
  await page
    .locator("#instruction")
    .fill("SYNTHETIC_UI_ONLY_NO_FOUNDER_AUTHORIZATION");
  await page.locator(".count").first().fill("3");
  const download = page.waitForEvent("download");
  await page.locator("#fix-export").click();
  const downloaded = await download,
    temp = output + ".download.json";
  await downloaded.saveAs(temp);
  const packet = json(temp);
  fs.unlinkSync(temp);
  check(
    packet.schemaVersion === "ichi-network-founder-fixes-v1" &&
      packet.items.length === 1 &&
      Object.values(packet.items[0].remaining).includes(3) &&
      packet.items[0].binding &&
      packet.items[0].imageSha256,
    "FOUNDER_FIX_EXPORT_NOT_EXACT",
  );
  // Clicking approval after a numeric change must never export the old facts.
  await page.locator("article .decision").first().selectOption("APPROVE");
  await page.locator("#export").click();
  check(
    (await page.locator("#notice").innerText()).includes("数字已修改"),
    "CHANGED_COUNTS_APPROVED_AS_OLD_VERSION",
  );
  check(pageErrors.length === 0, "FOUNDER_PAGE_SCRIPT_ERROR");
  const videoCover = page
    .locator("article")
    .filter({ hasText: "视频封面：需补真实播放帧" });
  if (await videoCover.count()) {
    await page.locator(".count").first().fill("");
    await videoCover.first().locator(".count").first().fill("1");
    await page.locator("#fix-export").click();
    check(
      (await page.locator("#notice").innerText()).includes(
        "需要先补真实版面照片",
      ),
      "VIDEO_COVER_EXPORTED_AS_COUNT_EVIDENCE",
    );
  }
  atomic(output, {
    status: "HEADLESS_FOUNDER_REVIEW_RENDER_AND_EXPORT_PASS",
    at: new Date().toISOString(),
    pageFile,
    cards,
    inlineImages: images.length,
    unselectedChecks: true,
    exactNumberExport: true,
    changedNumberApprovalBlocked: true,
    videoCoverCountExportBlocked: (await videoCover.count()) > 0,
    syntheticExportNotImported: true,
    productionWrites: 0,
  });
} finally {
  await browser.close();
}
