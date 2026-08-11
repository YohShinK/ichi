import { expect, test, type Locator, type Page } from "@playwright/test";

const views = [
  "start",
  "camera-capture",
  "recognizing",
  "draft",
  "target",
  "draw",
  "storage",
  "local-records",
  "contributions",
  "map-reminder",
  "method",
  "map-preview",
  "my",
  "cannot-build-pool",
];
const iframe = "iframe[title='ICHI V1-29 网页 UI']";
const gotoView = async (page: Page, view: string) => {
  await page.goto(`/?view=${view}`, { waitUntil: "domcontentloaded" });
  await page
    .frameLocator(iframe)
    .locator(`body[data-ichi-page="${view}"][data-ichi-bridge-ready="true"]`)
    .waitFor({ state: "attached", timeout: 60_000 });
  await page.waitForTimeout(300);
};

test("the original 网页 ui.html shell is served for every page", async ({
  page,
}) => {
  for (const view of views) {
    await gotoView(page, view);
    const shell = page.frameLocator(iframe);
    await expect(
      shell.getByText("ICHI", { exact: true }).first(),
    ).toBeVisible();
    await expect(shell.locator("body")).not.toContainText("Application error");
  }
});

test("source navigation synchronizes to the ICHI URL", async ({ page }) => {
  await gotoView(page, "start");
  const shell = page.frameLocator(iframe);
  await expect(
    shell.getByRole("heading", { name: "导入版面照片" }),
  ).toBeVisible();
  await shell.getByRole("button", { name: "拍摄版面", exact: true }).click();
  await expect(page).toHaveURL(/view=camera-capture/);
});

test("recognition navigation restores the latest stable recognition page", async ({
  page,
}) => {
  await gotoView(page, "draft");
  let shell = page.frameLocator(iframe);
  await expect(shell.getByRole("heading", { name: "识别结果" })).toBeVisible();

  await shell
    .locator("#nav-btn-camera")
    .evaluate((element: HTMLAnchorElement) => element.click());
  await expect(page).toHaveURL(/view=draft/);

  await shell
    .locator("#nav-btn-my")
    .evaluate((element: HTMLAnchorElement) => element.click());
  await expect(page).toHaveURL(/view=my/);
  shell = page.frameLocator(iframe);
  await expect(shell.getByRole("heading", { name: "ICHI 玩家" })).toBeVisible();

  await shell
    .locator("#nav-btn-camera")
    .evaluate((element: HTMLAnchorElement) => element.click());
  await expect(page).toHaveURL(/view=draft/);
  shell = page.frameLocator(iframe);
  await expect(shell.getByRole("heading", { name: "识别结果" })).toBeVisible();
  await shell.locator("body").evaluate(() => {
    window.location.hash = "#draw";
  });
  await expect(page).toHaveURL(/view=draw/);
  const savedScroll = await shell.locator("body").evaluate(() => {
    window.scrollTo(0, 300);
    return window.scrollY;
  });
  expect(savedScroll).toBeGreaterThan(0);
  await shell
    .locator("#nav-btn-map")
    .evaluate((element: HTMLAnchorElement) => element.click());
  await expect(page).toHaveURL(/view=map-preview/);
  await shell
    .locator("#nav-btn-camera")
    .evaluate((element: HTMLAnchorElement) => element.click());
  await expect(page).toHaveURL(/view=draw/);
  expect(await shell.locator("body").evaluate(() => window.scrollY)).toBe(
    savedScroll,
  );
});

test("transient capture and recognizing views return to the import page", async ({
  page,
}) => {
  await gotoView(page, "draw");
  let shell = page.frameLocator(iframe);
  await expect(shell.locator("#draw-remaining")).toBeVisible();

  await gotoView(page, "camera-capture");
  shell = page.frameLocator(iframe);
  await shell
    .locator("#nav-btn-map")
    .evaluate((element: HTMLAnchorElement) => element.click());
  await expect(page).toHaveURL(/view=map-preview/);
  shell = page.frameLocator(iframe);
  await shell
    .locator("#nav-btn-camera")
    .evaluate((element: HTMLAnchorElement) => element.click());
  await expect(page).toHaveURL(/view=start/);

  await gotoView(page, "recognizing");
  shell = page.frameLocator(iframe);
  await shell
    .locator("#nav-btn-my")
    .evaluate((element: HTMLAnchorElement) => element.click());
  await expect(page).toHaveURL(/view=my/);
  shell = page.frameLocator(iframe);
  await shell
    .locator("#nav-btn-camera")
    .evaluate((element: HTMLAnchorElement) => element.click());
  await expect(page).toHaveURL(/view=start/);
  await expect(
    shell.getByRole("heading", { name: "导入版面照片" }),
  ).toBeVisible();
});

test("recognition, correction, target and board pages remain reachable", async ({
  page,
}) => {
  const shell = page.frameLocator(iframe);
  await gotoView(page, "recognizing");
  await expect(
    shell.getByRole("heading", { name: "正在提取版面" }),
  ).toBeVisible();
  await gotoView(page, "draft");
  await expect(shell.getByRole("heading", { name: "识别结果" })).toBeVisible();
  await expect(shell.locator(".ichi-prize-form-card")).toHaveCount(6);
  await expect(shell.getByLabel("A赏总票数")).toBeVisible();
  await expect(shell.getByLabel("A赏已贴的票数")).toBeVisible();
  await expect(
    shell.getByRole("button", { name: "确认并生成版面" }),
  ).toBeVisible();
  await gotoView(page, "target");
  await expect(
    shell.getByRole("heading", { name: "选择目标奖" }),
  ).toBeVisible();
  await expect(shell.locator(".ichi-target-option")).toHaveCount(6);
  const bTarget = shell.locator('.ichi-target-option[data-tier="B"]');
  await bTarget.click();
  await expect(bTarget).toHaveAttribute("aria-pressed", "true");
  await gotoView(page, "draw");
  await expect(shell.locator("#draw-remaining")).toBeVisible();
});

test("route changes keep one page visible and do not reload the source shell", async ({
  page,
}) => {
  await gotoView(page, "draft");
  const shell = page.frameLocator(iframe);
  await shell.locator("body").evaluate(() => {
    (
      window as typeof window & { __ichiRouteMarker?: string }
    ).__ichiRouteMarker = "preserved";
  });
  for (const view of ["target", "map-preview", "my", "start"]) {
    await shell
      .locator(`#desktop-nav-links a[href="#${view}"]`)
      .evaluate((element: HTMLAnchorElement) => element.click());
    await expect(page).toHaveURL(new RegExp(`view=${view}`));
    await expect(
      shell.locator("#pages-container > .page-view:not(.hidden)"),
    ).toHaveCount(1);
    await expect(shell.locator(`#page-${view}`)).toBeVisible();
  }
  const marker = await shell
    .locator("body")
    .evaluate(
      () =>
        (window as typeof window & { __ichiRouteMarker?: string })
          .__ichiRouteMarker,
    );
  expect(marker).toBe("preserved");
});

test("recognizing progress panel uses the shared visual center", async ({
  page,
}) => {
  await gotoView(page, "recognizing");
  const shell = page.frameLocator(iframe);
  const mascot = shell.locator("#page-recognizing .ichi-recognition-mascot");
  await expect(mascot).toBeVisible();
  await expect(mascot).toHaveAttribute(
    "src",
    "/v1-29/ichi-recognition-mascot.png",
  );
  await expect(shell.locator("#page-recognizing .ph-scan")).toHaveCount(0);
  const mascotState = await mascot.evaluate((element: HTMLImageElement) => ({
    animationName: getComputedStyle(element).animationName,
    complete: element.complete,
    naturalWidth: element.naturalWidth,
  }));
  expect(mascotState).toEqual({
    animationName: "none",
    complete: true,
    naturalWidth: 832,
  });
  await expect(
    shell.locator("#page-recognizing div.animate-spin").first(),
  ).not.toHaveCSS("animation-name", "none");
  const position = await shell
    .locator("#page-recognizing > div > div")
    .evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const root = getComputedStyle(document.documentElement);
      return {
        centerY: rect.top + rect.height / 2,
        expectedY:
          window.innerHeight / 2 +
          Number.parseFloat(
            root.getPropertyValue("--ichi-visual-center-shift-y"),
          ),
      };
    });
  expect(Math.abs(position.centerY - position.expectedY)).toBeLessThan(1);
});

test("board confirmation overlay uses the pencil mascot", async ({ page }) => {
  await gotoView(page, "draft");
  const shell = page.frameLocator(iframe);
  await shell.getByRole("button", { name: "确认并生成版面" }).click();
  const overlay = shell.locator("#generating-overlay");
  await expect(overlay).toBeVisible();
  await expect(
    overlay.getByRole("heading", { name: "版面已确认" }),
  ).toBeVisible();
  const mascot = overlay.getByRole("img", { name: "版面已确认" });
  await expect(mascot).toBeVisible();
  await expect(mascot).toHaveAttribute(
    "src",
    "/v1-29/ichi-board-confirmed-mascot.png",
  );
  await expect(overlay.locator(".ph-magic-wand")).toHaveCount(0);
  const mascotState = await mascot.evaluate((element: HTMLImageElement) => ({
    animationName: getComputedStyle(element).animationName,
    complete: element.complete,
    naturalWidth: element.naturalWidth,
  }));
  expect(mascotState.complete).toBe(true);
  expect(mascotState.naturalWidth).toBe(895);
  expect(mascotState.animationName).not.toBe("none");
  await expect(page).toHaveURL(/view=target/);
  await expect(overlay).toBeHidden();
});

test("draw controls preserve their source positions and callbacks", async ({
  page,
}) => {
  await gotoView(page, "draw");
  const shell = page.frameLocator(iframe);
  await expect(shell.locator("#draw-grand-grid")).toContainText("A");
  await expect(
    shell.locator("#draw-grand-grid [onpointerdown]").first(),
  ).toBeVisible();
  await expect(
    shell.locator(
      'button[onclick*="modal-probability"][onclick*="classList.remove"]',
    ),
  ).toBeVisible();
  await expect(shell.locator("button[onclick*='undoLastDraw']")).toBeVisible();
  await expect(
    shell.locator(
      'button[onclick*="modal-history"][onclick*="classList.remove"]',
    ),
  ).toBeVisible();
  await expect(shell.getByRole("button", { name: "决定收手" })).toBeVisible();
});

test("prize tickets use a compact two-column grid and black grand covers", async ({
  page,
}) => {
  await page.setViewportSize({ width: 397, height: 697 });
  await gotoView(page, "draw");
  const shell = page.frameLocator(iframe);
  const first = shell.locator("#draw-grand-grid > .ichi-prize-ticket").first();
  const second = shell.locator("#draw-grand-grid > .ichi-prize-ticket").nth(1);
  const firstBox = await first.boundingBox();
  const secondBox = await second.boundingBox();
  expect(firstBox).not.toBeNull();
  expect(secondBox).not.toBeNull();
  if (firstBox && secondBox) {
    expect(Math.abs(firstBox.y - secondBox.y)).toBeLessThan(1);
    expect(firstBox.width).toBeLessThan(180);
  }
  await expect(first.locator("[onpointerdown] > .ichi-peel-surface")).toHaveCSS(
    "background-color",
    "rgb(10, 10, 10)",
  );
  const grandLetter = first.locator(
    "[onpointerdown] > .ichi-peel-surface span.text-\\[40px\\]",
  );
  await expect(grandLetter).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(grandLetter).toHaveCSS("background-image", "none");
  await expect(grandLetter).toHaveCSS("animation-name", "none");
  await expect(grandLetter).toHaveCSS(
    "-webkit-text-fill-color",
    "rgb(255, 255, 255)",
  );
  await expect(
    shell.locator("#draw-normal-list > .ichi-prize-ticket").first(),
  ).not.toHaveClass(/ichi-prize-ticket--grand/);
});

test("prize peel curls toward the viewer and flies outward", async ({
  page,
}) => {
  await page.setViewportSize({ width: 397, height: 697 });
  await gotoView(page, "draw");
  const shell = page.frameLocator(iframe);
  const cover = shell.locator("#draw-grand-grid [onpointerdown]").first();
  const peelState = await cover.evaluate((element) => {
    const event = { pointerId: 1, clientX: 0 } as PointerEvent;
    element.setPointerCapture = () => undefined;
    element.releasePointerCapture = () => undefined;
    (
      window as unknown as {
        startSwipe: (event: PointerEvent, element: HTMLElement) => void;
      }
    ).startSwipe(event, element as HTMLElement);
    (
      window as unknown as {
        moveSwipe: (event: PointerEvent, element: HTMLElement) => void;
      }
    ).moveSwipe({ clientX: 100 } as PointerEvent, element as HTMLElement);
    const surface = element.querySelector<HTMLElement>(
      ":scope > .ichi-peel-surface",
    );
    const flap = element.querySelector<HTMLElement>(":scope > .ichi-peel-flap");
    const moveTransform = flap?.style.transform ?? "";
    const moveOrigin = flap ? getComputedStyle(flap).transformOrigin : "";
    const edgeDecoration = flap
      ? getComputedStyle(flap, "::after").backgroundImage
      : "";
    const moveEdge = (element as HTMLElement).style.getPropertyValue(
      "--ichi-peel-edge",
    );
    (
      window as unknown as {
        endSwipe: (
          event: PointerEvent,
          element: HTMLElement,
          prizeIndex: number,
        ) => void;
      }
    ).endSwipe(
      { pointerId: 1, clientX: 100 } as PointerEvent,
      element as HTMLElement,
      0,
    );
    return {
      hasSurface: Boolean(surface),
      hasFlap: Boolean(flap),
      moveOrigin,
      moveEdge,
      moveTransform,
      edgeDecoration,
      endTransform: flap?.style.transform ?? "",
      endOrigin: flap?.style.transformOrigin ?? "",
    };
  });
  expect(peelState.hasSurface).toBe(true);
  expect(peelState.hasFlap).toBe(true);
  expect(peelState.edgeDecoration).toBe("none");
  expect(Number.parseFloat(peelState.moveOrigin)).toBeGreaterThan(0);
  expect(Number.parseFloat(peelState.moveEdge)).toBeGreaterThan(0);
  expect(peelState.moveTransform).toContain("translate3d(");
  expect(
    Number(peelState.moveTransform.match(/rotateY\(([-\d.]+)/)?.[1]),
  ).toBeGreaterThan(0);
  expect(peelState.endOrigin).toBe("right center");
  expect(peelState.endTransform).toContain("360px");
  expect(peelState.endTransform).toContain("rotateY(122deg)");
  expect(peelState.endTransform).toContain("scale(1.2)");
});

test("each draw re-evaluates reminders and allows unexpected grand prizes", async ({
  page,
}) => {
  await gotoView(page, "draw");
  const shell = page.frameLocator(iframe);
  const message = shell.locator("#toast-message .flex-grow .text-zinc-500");
  await shell.locator("body").evaluate(() => {
    const bridgeWindow = window as typeof window & {
      handleDraw: (prizeIndex: number, slotIndex: number) => void;
    };
    bridgeWindow.handleDraw(0, 0);
  });
  await expect(message).toContainText("一发入魂");
  await shell.locator("body").evaluate(() => {
    const bridgeWindow = window as typeof window & {
      handleDraw: (prizeIndex: number, slotIndex: number) => void;
    };
    bridgeWindow.handleDraw(1, 0);
  });
  await expect(message).toContainText("意外之喜");
  await expect(message).toContainText("累计 ¥1,300");
});

test("toast mascot switches between large, medium, and small prize faces", async ({
  page,
}) => {
  await gotoView(page, "draw");
  const shell = page.frameLocator(iframe);
  const mascot = shell.locator("#toast-mascot");

  await shell.locator("body").evaluate(() => {
    const bridgeWindow = window as typeof window & {
      handleDraw: (prizeIndex: number, slotIndex: number) => void;
    };
    bridgeWindow.handleDraw(0, 0);
  });
  await expect(mascot).toHaveAttribute("data-presentation", "large");
  await expect(mascot.locator(".ichi-toast-mascot-image--large")).toBeVisible();

  await shell.locator("body").evaluate(() => {
    const bridgeWindow = window as typeof window & {
      drawEngine: {
        prizeData: Array<{ total: number; slots: boolean[] }>;
      };
      handleDraw: (prizeIndex: number, slotIndex: number) => void;
      undoLastDraw: () => void;
    };
    bridgeWindow.undoLastDraw();
    bridgeWindow.drawEngine.prizeData[3]!.total = 8;
    bridgeWindow.drawEngine.prizeData[3]!.slots = Array(8).fill(false);
    bridgeWindow.handleDraw(3, 0);
  });
  await expect(mascot).toHaveAttribute("data-presentation", "medium");
  await expect(mascot.locator(".ichi-toast-mascot-face")).toHaveCSS(
    "display",
    "flex",
  );

  await shell.locator("body").evaluate(() => {
    const bridgeWindow = window as typeof window & {
      drawEngine: {
        prizeData: Array<{ total: number; slots: boolean[] }>;
      };
      handleDraw: (prizeIndex: number, slotIndex: number) => void;
      undoLastDraw: () => void;
    };
    bridgeWindow.undoLastDraw();
    bridgeWindow.drawEngine.prizeData[3]!.total = 12;
    bridgeWindow.drawEngine.prizeData[3]!.slots = Array(12).fill(false);
    bridgeWindow.handleDraw(3, 0);
  });
  await expect(mascot).toHaveAttribute("data-presentation", "small");
  await expect(mascot.locator(".ichi-toast-mascot-image--small")).toBeVisible();
  const verticalAlignment = await shell.locator("body").evaluate(() => {
    const status = document.querySelector(".ichi-draw-status");
    const toast = document.getElementById("toast-message");
    if (!status || !toast) return Number.POSITIVE_INFINITY;
    const statusRect = status.getBoundingClientRect();
    const toastRect = toast.getBoundingClientRect();
    return Math.abs(
      statusRect.top +
        statusRect.height / 2 -
        (toastRect.top + toastRect.height / 2),
    );
  });
  expect(verticalAlignment).toBeLessThan(1);
});

test("draw workspace controls stay fixed while prize tickets scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 397, height: 697 });
  await gotoView(page, "draw");
  const shell = page.frameLocator(iframe);
  const status = shell.locator(".ichi-draw-status");
  const quickActions = shell.locator(".ichi-draw-quick-actions");
  const stop = shell.locator(".ichi-draw-stop-wrap");
  await expect(status).toHaveCSS("position", "fixed");
  await expect(quickActions).toHaveCSS("position", "fixed");
  await expect(stop).toHaveCSS("position", "fixed");
  const before = {
    status: await status.boundingBox(),
    quickActions: await quickActions.boundingBox(),
    stop: await stop.boundingBox(),
  };
  await shell.locator("body").evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(100);
  const after = {
    status: await status.boundingBox(),
    quickActions: await quickActions.boundingBox(),
    stop: await stop.boundingBox(),
  };
  expect(after).toEqual(before);
});

test("draw ticket edges fade into the fixed status and bottom navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 397, height: 697 });
  await gotoView(page, "draw");
  const shell = page.frameLocator(iframe);
  const status = shell.locator(".ichi-draw-status");
  const topFade = shell.locator(".ichi-draw-edge-fade--top");
  const bottomFade = shell.locator(".ichi-draw-edge-fade--bottom");
  await expect(topFade).toBeVisible();
  await expect(bottomFade).toBeVisible();
  await expect(topFade).toHaveCSS("pointer-events", "none");
  await expect(bottomFade).toHaveCSS("pointer-events", "none");
  await expect(topFade).toHaveCSS("position", "fixed");
  await expect(bottomFade).toHaveCSS("position", "fixed");
  const statusBox = await status.boundingBox();
  const topFadeBox = await topFade.boundingBox();
  expect(statusBox).not.toBeNull();
  expect(topFadeBox).not.toBeNull();
  if (statusBox && topFadeBox) {
    const statusBottom = statusBox.y + statusBox.height;
    const topFadeBottom = topFadeBox.y + topFadeBox.height;
    expect(Math.abs(topFadeBox.y)).toBeLessThan(1);
    expect(Math.abs(topFadeBottom - statusBottom)).toBeLessThan(1);
  }
  const before = await topFade.boundingBox();
  await shell.locator("body").evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(100);
  expect(await topFade.boundingBox()).toEqual(before);
});

test("outlook and history share the visual-center modal geometry", async ({
  page,
}) => {
  await page.setViewportSize({ width: 397, height: 697 });
  await gotoView(page, "draw");
  const shell = page.frameLocator(iframe);
  await shell.getByRole("button", { name: "局面可能性" }).click();
  const outlook = shell.locator(
    "#modal-probability > .ichi-workspace-modal-card",
  );
  await expect(outlook).toBeVisible();
  await expect(outlook).toContainText("3 抽内至少一张目标");
  await expect(outlook).toContainText("3 抽内至少一张大赏");
  await expect(outlook).toContainText("3 抽内至少一张非小赏");
  await expect(outlook).toContainText("3 抽内两张或以上小赏");
  await expect(outlook).toContainText("3 抽累计成本");
  const outlookGeometry = await outlook.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const root = getComputedStyle(document.documentElement);
    return {
      centerY: rect.top + rect.height / 2,
      expectedY:
        window.innerHeight / 2 +
        Number.parseFloat(
          root.getPropertyValue("--ichi-visual-center-shift-y"),
        ),
      radius: getComputedStyle(element).borderRadius,
    };
  });
  expect(
    Math.abs(outlookGeometry.centerY - outlookGeometry.expectedY),
  ).toBeLessThan(1);
  expect(outlookGeometry.radius).toBe("32px");
  await shell.locator("#modal-probability button").click();

  await shell.getByRole("button", { name: "抽取记录" }).click();
  const history = shell.locator("#modal-history > .ichi-workspace-modal-card");
  await expect(history).toBeVisible();
  const historyGeometry = await history.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const root = getComputedStyle(document.documentElement);
    return {
      centerY: rect.top + rect.height / 2,
      expectedY:
        window.innerHeight / 2 +
        Number.parseFloat(
          root.getPropertyValue("--ichi-visual-center-shift-y"),
        ),
      radius: getComputedStyle(element).borderRadius,
    };
  });
  expect(
    Math.abs(historyGeometry.centerY - historyGeometry.expectedY),
  ).toBeLessThan(1);
  expect(historyGeometry.radius).toBe(outlookGeometry.radius);
});

test("decide-to-stop requires a one-second hold with reversible fill", async ({
  page,
}) => {
  await page.setViewportSize({ width: 397, height: 697 });
  await gotoView(page, "draw");
  const shell = page.frameLocator(iframe);
  const stop = shell.getByRole("button", { name: "长按决定收手" });
  const share = shell.locator("#modal-share-1");
  const box = await stop.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(450);
  await expect(share).toBeHidden();
  const partial = Number(await stop.getAttribute("aria-valuenow"));
  expect(partial).toBeGreaterThan(20);
  expect(partial).toBeLessThan(80);
  await page.mouse.up();
  await expect(stop).toHaveAttribute("aria-valuenow", "0");
  await expect(share).toBeHidden();

  await page.mouse.down();
  await page.waitForTimeout(1100);
  await expect(share).toBeVisible();
  await expect(shell.locator("body > nav")).toHaveCSS("pointer-events", "none");
  await expect(shell.locator("body")).toHaveAttribute(
    "data-ichi-modal-open",
    "true",
  );
  await page.mouse.up();
});

test("share capture and submitted overlays follow the blocking modal lifecycle", async ({
  page,
}) => {
  await page.setViewportSize({ width: 397, height: 697 });
  await gotoView(page, "draw");
  const shell = page.frameLocator(iframe);
  const share = shell.locator("#modal-share-1");
  await share.evaluate((element) => element.classList.remove("hidden"));
  await share.getByRole("button", { name: "愿意并拍摄赏票" }).click();
  const capture = shell.locator("#modal-share-2");
  await expect(capture).toBeVisible();
  await expect(capture.getByRole("button", { name: "拍摄赏票" })).toBeVisible();
  await expect(
    capture.getByRole("button", { name: "返回分享选择" }),
  ).toBeVisible();
  await expect(capture.getByRole("button", { name: "重拍赏票" })).toBeVisible();
  const confirmShare = capture.getByRole("button", {
    name: "确认地点与备注并提交",
  });
  const noteInput = capture.locator(".ichi-share-meta input");
  await expect(confirmShare).toBeDisabled();
  await expect(confirmShare).toHaveCSS(
    "background-color",
    "rgb(233, 235, 239)",
  );
  await expect(capture.getByRole("button", { name: "拍摄赏票" })).toHaveCSS(
    "background-color",
    "rgb(233, 235, 239)",
  );
  await expect(capture.getByRole("button", { name: "重拍赏票" })).toHaveCSS(
    "background-color",
    "rgb(233, 235, 239)",
  );
  const captureFrame = capture.locator(".ichi-share-camera-frame");
  const captureAction = capture.locator(".ichi-share-capture-action-panel");
  const captureMeta = capture.locator(".ichi-share-meta");
  const backBox = await capture
    .getByRole("button", { name: "返回分享选择" })
    .boundingBox();
  const frameBox = await captureFrame.boundingBox();
  const actionBox = await captureAction.boundingBox();
  const metaBox = await captureMeta.boundingBox();
  expect(backBox).not.toBeNull();
  expect(frameBox).not.toBeNull();
  expect(actionBox).not.toBeNull();
  expect(metaBox).not.toBeNull();
  if (backBox && frameBox && actionBox && metaBox) {
    expect(frameBox.y).toBeGreaterThanOrEqual(backBox.y + backBox.height);
    expect(actionBox.y).toBeGreaterThanOrEqual(frameBox.y + frameBox.height);
    expect(metaBox.y).toBeGreaterThanOrEqual(actionBox.y + actionBox.height);
  }
  const nav = shell.locator("body > nav");
  await expect(nav).toHaveCSS("pointer-events", "none");
  const navBox = await nav.boundingBox();
  const captureActionBox = await capture
    .locator(".ichi-share-capture-action")
    .boundingBox();
  const captureActionRowBox = await capture
    .locator(".ichi-share-capture-action-row")
    .boundingBox();
  const retakeBox = await capture
    .getByRole("button", { name: "重拍赏票" })
    .boundingBox();
  expect(navBox).not.toBeNull();
  expect(captureActionBox).not.toBeNull();
  expect(captureActionRowBox).not.toBeNull();
  expect(retakeBox).not.toBeNull();
  if (
    navBox &&
    captureActionBox &&
    captureActionRowBox &&
    retakeBox &&
    frameBox
  ) {
    expect(captureActionBox.y + captureActionBox.height).toBeLessThan(navBox.y);
    expect(captureActionBox.width).toBeLessThanOrEqual(176);
    expect(
      Math.abs(
        (captureActionBox.x + retakeBox.x + retakeBox.width) / 2 -
          (frameBox.x + frameBox.width / 2),
      ),
    ).toBeLessThan(1);
  }
  await noteInput.fill("秋叶原本店，A赏已被抽走");
  await expect(confirmShare).toBeDisabled();
  await capture.getByRole("button", { name: "拍摄赏票" }).click();
  await expect(confirmShare).toBeEnabled();
  await expect(confirmShare).toHaveCSS("background-color", "rgb(17, 17, 17)");
  await expect(confirmShare).not.toHaveCSS("box-shadow", "none");
  await capture.getByRole("button", { name: "重拍赏票" }).click();
  await expect(confirmShare).toBeDisabled();
  await expect(capture.getByRole("button", { name: "拍摄赏票" })).toBeVisible();
  await capture.getByRole("button", { name: "拍摄赏票" }).click();
  await expect(confirmShare).toBeEnabled();
  await confirmShare.click();
  const submitted = shell.locator("#overlay-submitted");
  await expect(submitted).toBeVisible();
  const center = await submitted
    .locator(":scope > .ichi-workspace-modal-card")
    .evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.top + rect.height / 2;
    });
  const expectedCenter = await shell.locator("body").evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    return (
      window.innerHeight / 2 +
      Number.parseFloat(root.getPropertyValue("--ichi-visual-center-shift-y"))
    );
  });
  expect(Math.abs(center - expectedCenter)).toBeLessThan(1);
  await submitted.getByRole("button", { name: "退出回首页" }).click();
  await expect(page).toHaveURL(/view=start/);
  await expect(submitted).toBeHidden();
});

test("stop choices continue the board or save a resumable local draft", async ({
  page,
}) => {
  await page.setViewportSize({ width: 397, height: 697 });
  await gotoView(page, "draw");
  const shell = page.frameLocator(iframe);
  await shell.locator("body").evaluate(() => {
    const bridgeWindow = window as typeof window & {
      handleDraw: (prizeIndex: number, slotIndex: number) => void;
    };
    bridgeWindow.handleDraw(0, 0);
  });

  const share = shell.locator("#modal-share-1");
  await share.evaluate((element) => element.classList.remove("hidden"));
  await expect(share).toBeVisible();
  const shareGeometry = await share
    .locator(":scope > .ichi-workspace-modal-card")
    .evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const root = getComputedStyle(document.documentElement);
      return {
        centerY: rect.top + rect.height / 2,
        expectedY:
          window.innerHeight / 2 +
          Number.parseFloat(
            root.getPropertyValue("--ichi-visual-center-shift-y"),
          ) +
          Number.parseFloat(
            root.getPropertyValue("--ichi-share-center-offset-y"),
          ),
      };
    });
  expect(
    Math.abs(shareGeometry.centerY - shareGeometry.expectedY),
  ).toBeLessThan(1);

  await share.getByRole("button", { name: "继续抽赏" }).click();
  await expect(share).toBeHidden();
  await expect(page).toHaveURL(/view=draw/);

  await share.evaluate((element) => element.classList.remove("hidden"));
  await share.getByRole("button", { name: "暂不分享并退出" }).click();
  await expect(page).toHaveURL(/view=start/);
  await expect(
    shell.getByRole("heading", { name: "导入版面照片" }),
  ).toBeVisible();
  await expect(shell.getByText("只保存在这台设备")).toHaveCount(0);
  const drafts = shell.locator("#ichi-start-drafts");
  await expect(drafts).toBeVisible();
  await expect(drafts).toContainText("抽赏草稿");
  await expect(drafts).toContainText("已抽 1");
  await expect(drafts).toContainText("累计 ¥650");
  await expect(shell.locator("#ichi-start-draft-list")).toHaveCSS(
    "overflow-y",
    "auto",
  );

  await drafts.getByRole("button", { name: "继续抽赏草稿" }).click();
  await expect(page).toHaveURL(/view=draw/);
  await expect(shell.locator("#draw-remaining")).toHaveText("64");
  await shell.getByRole("button", { name: "抽取记录" }).click();
  await expect(shell.locator("#history-list")).toContainText("A赏");
  await expect(shell.locator("#history-list")).toContainText("¥650");
  await shell.locator("#modal-history button").click();
  await share.evaluate((element) => element.classList.remove("hidden"));
  await share.getByRole("button", { name: "暂不分享并退出" }).click();
  await expect(page).toHaveURL(/view=start/);
  await expect(
    shell.locator("#ichi-start-draft-list .ichi-start-draft-card"),
  ).toHaveCount(1);
});

test("unverified local drafts can be swipe-deleted from both ledgers", async ({
  page,
}) => {
  await page.setViewportSize({ width: 397, height: 697 });
  await gotoView(page, "start");
  let shell = page.frameLocator(iframe);
  await shell.locator("body").evaluate(() => {
    const prizeData = [
      { id: "A", type: "grand", total: 2, slots: [true, false] },
      { id: "B", type: "grand", total: 3, slots: [false, false, false] },
    ];
    localStorage.setItem(
      "ichi:v1-29-local-draw-drafts:v1",
      JSON.stringify([
        {
          boardId: "swipe-start-draft",
          prizeData,
          history: [{ pIndex: 0, sIndex: 0 }],
          cost: 650,
          savedAt: Date.now(),
        },
        {
          boardId: "swipe-record-draft",
          prizeData,
          history: [],
          cost: 0,
          savedAt: Date.now() - 1_000,
        },
      ]),
    );
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page
    .frameLocator(iframe)
    .locator('body[data-ichi-page="start"][data-ichi-bridge-ready="true"]')
    .waitFor({ state: "attached", timeout: 60_000 });
  shell = page.frameLocator(iframe);

  const swipeLeft = async (content: Locator) => {
    const box = await content.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;
    await page.mouse.move(box.x + box.width - 18, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 104, box.y + box.height / 2, {
      steps: 6,
    });
    await page.mouse.up();
  };

  const startRow = shell.locator(
    '#ichi-start-draft-list .ichi-swipe-row[data-board-id="swipe-start-draft"]',
  );
  await swipeLeft(startRow.locator(".ichi-swipe-content"));
  await expect(startRow).toHaveAttribute("data-swipe-open", "true");
  await startRow.getByRole("button", { name: "删除这次抽赏草稿" }).click();
  await expect(startRow).toHaveCount(0);

  await shell.locator("body").evaluate(() => {
    window.location.hash = "#local-records";
  });
  await expect(page).toHaveURL(/view=local-records/);
  const recordRow = shell.locator(
    '#ichi-local-record-list .ichi-swipe-row[data-board-id="swipe-record-draft"]',
  );
  await swipeLeft(recordRow.locator(".ichi-swipe-content"));
  await expect(recordRow).toHaveAttribute("data-swipe-open", "true");
  await recordRow.getByRole("button", { name: "删除这次抽赏草稿" }).click();
  await expect(recordRow).toHaveCount(0);
  await expect(
    shell.locator(
      '#ichi-local-record-list [data-record-id="v1-29-uploaded-preview"]',
    ),
  ).toBeVisible();
  await expect(
    shell.locator(
      '#ichi-local-record-list .ichi-swipe-row[data-board-id="v1-29-uploaded-preview"]',
    ),
  ).toHaveCount(0);
  expect(
    await shell
      .locator("body")
      .evaluate(() =>
        JSON.parse(
          localStorage.getItem("ichi:v1-29-local-draw-drafts:v1") || "[]",
        ),
      ),
  ).toEqual([]);
});

test("the import hero stays fixed while saved drafts own the scroll region", async ({
  page,
}) => {
  await page.setViewportSize({ width: 397, height: 697 });
  await gotoView(page, "start");
  const shell = page.frameLocator(iframe);
  const hero = shell.locator("#page-start > div:first-child");
  await expect(hero).toBeVisible();
  await expect(shell.locator("#page-start")).toHaveCSS("overflow", "hidden");
  const documentHeight = await shell.locator("body").evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
  }));
  expect(documentHeight.scrollHeight).toBeLessThanOrEqual(
    documentHeight.viewportHeight,
  );
});

test("share and 我的 entry points remain inside the unchanged source shell", async ({
  page,
}) => {
  const shell = page.frameLocator(iframe);
  await gotoView(page, "draw");
  await expect(shell.locator("#modal-share-1")).toHaveCount(1);
  await expect(shell.locator("#modal-share-2")).toHaveCount(1);
  await gotoView(page, "my");
  await expect(shell.getByRole("heading", { name: "ICHI 玩家" })).toBeVisible();
  await expect(
    shell.locator("#page-my").getByText("本地记录", { exact: true }),
  ).toBeVisible();
  await expect(
    shell.locator("#page-my").getByText("我的贡献", { exact: true }),
  ).toBeVisible();
});

test("local records are the full ledger and contributions are its uploaded subset", async ({
  page,
}) => {
  await gotoView(page, "local-records");
  let shell = page.frameLocator(iframe);
  const localCards = shell.locator("#ichi-local-record-list .ichi-record-card");
  await expect(localCards).toHaveCount(2);
  await expect(
    shell.locator(
      '#ichi-local-record-list [data-upload-status="not-uploaded"]',
    ),
  ).toContainText("未核对 / 未上传");
  const uploadedLocal = shell.locator(
    '#ichi-local-record-list [data-upload-status="uploaded"]',
  );
  await expect(uploadedLocal).toContainText("已核对 / 已上传");
  const uploadedRecordId = await uploadedLocal.getAttribute("data-record-id");

  await gotoView(page, "contributions");
  shell = page.frameLocator(iframe);
  const contributionCards = shell.locator(
    "#ichi-contribution-list .ichi-record-card",
  );
  await expect(contributionCards).toHaveCount(1);
  await expect(
    shell.locator(
      '#ichi-contribution-list [data-upload-status="not-uploaded"]',
    ),
  ).toHaveCount(0);
  await expect(contributionCards).toHaveAttribute(
    "data-record-id",
    uploadedRecordId ?? "",
  );
  await expect(contributionCards).toContainText("已核对 / 已上传");
  await expect(contributionCards.getByLabel("点赞数 0")).toBeVisible();
  await expect(contributionCards).toContainText("V2 接入后显示其他用户点赞");
});

test("record page header and stats remain fixed while the record list scrolls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 397, height: 697 });
  await gotoView(page, "local-records");
  const shell = page.frameLocator(iframe);
  const header = shell.locator("#page-local-records .ichi-my-subpage-header");
  const stats = shell.locator("#ichi-local-record-summary");
  const scroll = shell.locator("#page-local-records .ichi-my-subpage-scroll");
  await expect(header).toBeVisible();
  await expect(stats).toContainText("全部有");
  await expect(stats).toContainText("现在已上传有");
  await expect(stats).toContainText("未上传有");
  await shell.locator("#ichi-local-record-list").evaluate((list) => {
    const first = list.firstElementChild;
    if (!first) return;
    for (let index = 0; index < 8; index += 1) {
      list.append(first.cloneNode(true));
    }
  });
  const before = {
    header: await header.boundingBox(),
    stats: await stats.boundingBox(),
  };
  await scroll.evaluate((element) => element.scrollTo(0, element.scrollHeight));
  await page.waitForTimeout(100);
  const after = {
    header: await header.boundingBox(),
    stats: await stats.boundingBox(),
  };
  expect(after).toEqual(before);
  await expect(scroll).toHaveCSS("overflow-y", "auto");
});

test("my subpages provide a top return and repeated 我的 returns to the root", async ({
  page,
}) => {
  const subpages = [
    "storage",
    "local-records",
    "contributions",
    "map-reminder",
    "method",
  ];

  for (const view of subpages) {
    await gotoView(page, view);
    let shell = page.frameLocator(iframe);
    const back = shell.locator(`#page-${view} .ichi-my-back-button`);
    const title = shell.locator(
      `#page-${view} .ichi-my-subpage-titleline strong`,
    );
    const subtitle = shell.locator(
      `#page-${view} .ichi-my-subpage-titleline span`,
    );
    await expect(back).toBeVisible();
    await expect(title).toBeVisible();
    await expect(title).toHaveCSS("color", "rgb(17, 17, 17)");
    await expect(title).toHaveCSS("font-size", "24px");
    await expect(subtitle).toBeHidden();
    await page.waitForTimeout(500);
    await expect(back).toHaveAttribute("aria-label", "返回我的");
    await expect(back).toHaveCSS("width", "52px");
    await expect(back).toHaveCSS("box-shadow", "none");
    const topPosition = await back.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const root = getComputedStyle(document.documentElement);
      return {
        actual: rect.top,
        expected: Number.parseFloat(
          root.getPropertyValue("--ichi-top-safe-area"),
        ),
      };
    });
    expect(Math.abs(topPosition.actual - topPosition.expected)).toBeLessThan(1);

    await back.click();
    await expect(page).toHaveURL(/view=my/);
    shell = page.frameLocator(iframe);
    await expect(
      shell.getByRole("heading", { name: "ICHI 玩家" }),
    ).toBeVisible();

    await gotoView(page, view);
    shell = page.frameLocator(iframe);
    await shell
      .locator("#nav-btn-my")
      .evaluate((element: HTMLAnchorElement) => element.click());
    await expect(page).toHaveURL(/view=my/);
  }
});

test("map-page visual corrections preserve the source shell", async ({
  page,
}) => {
  await gotoView(page, "map-preview");
  const shell = page.frameLocator(iframe);
  await expect(shell.locator("#global-header")).toBeHidden();
  await expect(
    shell.getByText("好版地图会汇总用户核对并贡献的版面记录"),
  ).toBeVisible();
  await expect(shell.locator("#nav-btn-my i")).toHaveClass(/ph-user-circle/);
  await expect(shell.locator("#page-map-preview .rounded-bl-sm")).toHaveCount(
    0,
  );
  await expect(shell.locator("#nav-btn-map .icon-container")).toHaveCSS(
    "flex-direction",
    "row",
  );
  await expect(shell.locator("#nav-btn-camera .label-text")).toBeHidden();
});
