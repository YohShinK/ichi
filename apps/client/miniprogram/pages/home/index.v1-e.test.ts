import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const root = "apps/client/miniprogram/pages/home";
const ts = readFileSync(`${root}/index.ts`, "utf8");
const wxml = readFileSync(`${root}/index.wxml`, "utf8");
const wxss = readFileSync(`${root}/index.wxss`, "utf8");
const appJson = JSON.parse(
  readFileSync("apps/client/miniprogram/app.json", "utf8"),
) as { pages: string[] };
const designTokens = readFileSync(
  "docs/design/v1-29-ui-design-tokens.md",
  "utf8",
);

describe("V1-E native mini-program flow coverage", () => {
  it("contains every approved primary, secondary and exception view", () => {
    for (const marker of [
      "page-camera-capture",
      "page-recognizing",
      "page-recognition-result",
      "page-draw",
      "page-map",
      "page-my",
      "page-local-records",
      "account",
      "contributions",
      "page-map-reminder",
      "page-method",
      "method",
      "cannot-build-pool",
      "page-undo-protected",
      "page-storage-fallback",
      "schema-incompatible",
      "storage-warning",
    ]) {
      expect(wxml).toContain(marker);
    }
  });

  it("keeps both record pages elastic and refreshes only from the top pull gesture", () => {
    expect(
      wxml.match(/bindrefresherrefresh="onRecordsRefresherRefresh"/g),
    ).toHaveLength(2);
    expect(wxml.match(/refresher-enabled="true"/g)).toHaveLength(2);
    expect(wxml.match(/refresher-threshold="64"/g)).toHaveLength(2);
    expect(
      wxml.match(/refresher-triggered="{{recordsRefreshing}}"/g),
    ).toHaveLength(2);
    expect(
      wxml.match(/enhanced="true" bounces="true" enable-flex="true"/g),
    ).toHaveLength(3);
    expect(wxml).not.toContain("bindscrolltolower");
    expect(wxml).not.toContain("继续上滑刷新");
    expect(wxml.match(/class="records-refresh-surface"/g)).toHaveLength(2);
    expect(ts).toContain("async onRecordsRefresherRefresh()");
    expect(wxss).toMatch(
      /\.records-refresh-surface\s*\{[\s\S]*?min-height:\s*calc\(100vh - var\(--top-safe-px\) - var\(--bottom-clearance\) - 114px\);/,
    );
    expect(wxss).not.toContain(".records-refresh-footer");
  });

  it("renders nullable recognition counts as truly empty inputs", () => {
    expect(wxml).toContain('data-testid="recognition-ip-input"');
    expect(wxml).toContain('data-testid="recognition-remaining-{{item.tier}}"');
    expect(wxml).toContain(
      "value=\"{{item.remainingTickets === null ? '' : item.remainingTickets}}\"",
    );
    expect(wxml).not.toContain("item.totalTickets");
    expect(wxml).not.toContain("item.pastedTickets");
    expect(wxml).toContain('data-testid="recognition-submit"');
  });

  it("connects the draw workspace instead of leaving visual-only controls", () => {
    for (const handler of [
      "onTicketPeelStart",
      "onTicketPeelMove",
      "onTicketPeelEnd",
      "onTicketPeelCancel",
    ]) {
      expect(wxml).toContain(handler);
      expect(ts).toContain(`${handler}(`);
    }
    for (const handler of [
      "onOpenProbability",
      "onUndoDraw",
      "onOpenHistory",
      "onStopTouchStart",
      "onCaptureEvidence",
      "onSubmitEvidence",
    ]) {
      expect(wxml).toContain(handler);
      expect(ts).toContain(`${handler}(`);
    }
    expect(wxml).not.toContain('<wxs module="peel"');
    expect(wxml).toContain('class="ticket-peel-track"');
    expect(wxml).not.toContain("prize-ticket--peeling");
    expect(wxml).toContain('catchtouchstart="onTicketPeelStart"');
    expect(wxml).toContain('catchtouchmove="onTicketPeelMove"');
    expect(wxml).toContain('catchtouchend="onTicketPeelEnd"');
    expect(wxml).toContain('catchtouchcancel="onTicketPeelCancel"');
    expect(wxml).toContain('class="ticket-peel-swiper');
    expect(wxml).toContain('class="ticket-peel-back"');
    expect(wxml).toContain('class="ticket-cover ticket-peel-front"');
    expect(wxml).toContain(
      "right: -{{ticketPeelTier === prize.tier ? ticketPeelProgress : 0}}%;",
    );
    expect(wxml).toContain(
      "width: {{ticketPeelTier === prize.tier ? ticketPeelProgress : 0}}%;",
    );
    expect(wxml).toContain(
      "left: -{{ticketPeelTier === prize.tier ? ticketPeelProgress : 0}}%;",
    );
    expect(ts).toContain("TICKET_PEEL_DISTANCE_PX = 96");
    expect(ts).toContain("TICKET_PEEL_THRESHOLD_PERCENT = 50");
    expect(ts).toContain("TICKET_PEEL_EXIT_PERCENT = 145");
    expect(ts).toContain("TICKET_PEEL_SPRING_MS = 320");
    expect(ts).toContain("TICKET_PEEL_EXIT_FADE_MS = 80");
    expect(ts).toContain("projectPeelDistance(delta, ticketPeelVelocity)");
    expect(ts).toContain("createPeelSpringFrames({");
    expect(ts).toContain("progress > TICKET_PEEL_THRESHOLD_PERCENT");
    expect(ts).not.toContain('selectComponent(".draw-quick-actions")');
    expect(wxss).not.toContain("perspective: 820px");
    expect(wxss).not.toContain("ticket-peel-flap");
    expect(wxss).toMatch(
      /\.ticket-peel-track\s*{[\s\S]*?top: 22px;[\s\S]*?height: 52px;[\s\S]*?overflow: hidden;[\s\S]*?touch-action: none;/,
    );
    expect(wxss).not.toContain(".prize-ticket--peeling");
    expect(wxss).toMatch(
      /\.ticket-peel-swiper\s*{[\s\S]*?right: 0;[\s\S]*?overflow: hidden;/,
    );
    expect(wxml).toContain("ticket-peel-swiper--fading");
    expect(wxss).toMatch(
      /\.ticket-peel-swiper--fading\s*{[\s\S]*?opacity: 0;[\s\S]*?transition: opacity 80ms linear;/,
    );
    expect(wxss).toMatch(
      /\.ticket-peel-back\s*{[\s\S]*?left: 0;[\s\S]*?box-shadow: 4px 5px 15px -2px rgba\(0, 0, 0, 0\.4\);/,
    );
    expect(wxss).toMatch(
      /\.draw-content\s*{[\s\S]*?padding: 0 var\(--page-gutter\) 168px;/,
    );
    expect(wxss.lastIndexOf(".ticket-tier-letter--grand")).toBeGreaterThan(
      wxss.indexOf("color: #e5cb8d"),
    );
    expect(
      wxss.slice(wxss.lastIndexOf(".ticket-tier-letter--grand")),
    ).toContain("color: #fff");
    expect(ts).toContain("STOP_HOLD_DURATION_MS = 500");
    expect(ts).toContain("}, STOP_HOLD_DURATION_MS);");
    expect(wxss).toContain("animation: hold-fill 500ms linear forwards;");
  });

  it("uses exact approved mascot files and local Phosphor assets", () => {
    const assets = [
      "assets/v1-29/ichi-recognition-mascot.png",
      "assets/v1-29/ichi-mascot-large.png",
      "assets/v1-29/ichi-mascot-small.png",
      "assets/icons/chart-pie-slice-white.svg",
      "assets/icons/arrow-u-up-left-white.svg",
      "assets/icons/clock-counter-clockwise-white.svg",
      "assets/icons/share-network-black.svg",
      "assets/icons/calculator-pink.svg",
      "assets/icons/database-pink.svg",
    ];
    for (const asset of assets) {
      expect(wxml).toContain(`/${asset}`);
      expect(existsSync(`apps/client/miniprogram/${asset}`)).toBe(true);
    }
  });

  it("keeps all draw-toast mascots tilted and reserves three normal-prize slot rows", () => {
    expect(wxss).toMatch(
      /\.toast-mascot image\s*{[^}]*transform: rotate\(-3deg\);[^}]*transform-origin: center;/,
    );
    expect(wxss).toMatch(
      /\.toast-face\s*{[^}]*transform: rotate\(-3deg\);[^}]*transform-origin: center;/,
    );
    expect(wxml).toContain(
      "ticket-bottom {{prize.presentation !== 'large' ? 'ticket-bottom--normal' : ''}}",
    );
    expect(wxml).toContain(
      "ticket-slots {{prize.presentation !== 'large' ? 'ticket-slots--normal' : ''}}",
    );
    expect(wxss).toMatch(/\.ticket-bottom--normal\s*{[^}]*min-height: 56px;/);
    expect(wxss).toMatch(
      /\.ticket-slots--normal\s*{[^}]*min-height: 44px;[^}]*align-content: flex-start;/,
    );
    expect(ts).toContain("Array.from({ length: initialRemaining }");
    expect(ts).not.toContain("placeholderSlot");
  });

  it("keeps modal, camera, status and navigation layers fixed and blocking", () => {
    expect(wxss).toMatch(/\.modal-layer\s*{[\s\S]*?position: fixed;/);
    expect(wxss).toMatch(/\.camera-page,[\s\S]*?position: fixed;/);
    expect(wxss).toMatch(/\.draw-status\s*{[\s\S]*?position: fixed;/);
    expect(wxss).toMatch(/\.bottom-nav\s*{[\s\S]*?position: fixed;/);
    expect(wxml).toContain('catchtap="onBlockTap"');
  });

  it("keeps verification evidence ephemeral and recoverable by structured state", () => {
    expect(wxml).toContain("赏票照片只用于本次核验，核验终态后删除");
    expect(ts).toContain("createPendingDrawTicketVerification");
    expect(ts).toContain("runPendingDrawTicketVerification");
    expect(ts).toContain("evidenceSubmissionVersion");
  });

  it("adds the player on-site direct-upload branch with private cloud confirmation", () => {
    expect(wxml).toContain("进入辅助抽赏");
    expect(wxml).toContain("仅上传版面");
    expect(wxml).toContain("/assets/icons/arrow-circle-up-black.svg");
    expect(wxml).toContain('data-flow-mode="assist"');
    expect(wxml).toContain('data-flow-mode="direct-upload"');
    expect(wxml).toContain('bindinput="onRecognitionIpInput"');
    expect(wxml).toContain('bindinput="onRecognitionLocationInput"');
    expect(wxml).toContain('placeholder="待确认，可填 0"');
    expect(wxml).toContain("下一步：设定大赏");
    expect(wxml).toContain(
      "disabled=\"{{!recognitionValidation.canConfirm || generationState === 'generating'}}\"",
    );
    expect(wxml).toContain("recognitionValidation.unitPriceBlocking");
    expect(wxml).toContain("item.remainingTicketsBlocking");
    expect(wxml).toContain('class="recognition-input-glow" aria-hidden="true"');
    expect(wxml).toContain('aria-invalid="{{item.remainingTicketsBlocking}}"');
    expect(wxml).toContain("modalView === 'board-upload-submitted'");
    expect(
      wxml.match(/后台正在核对。本次提交退出后可导入新的版面。/g),
    ).toHaveLength(2);
    expect(wxml).toMatch(
      /modalView === 'board-upload-submitted'[\s\S]*?退出回首页[\s\S]*?<\/view><\/view>/,
    );
    expect(ts).toContain('recognitionMode === "direct-upload"');
    expect(ts).toContain('modalView: "board-upload-submitted"');
    expect(ts).toContain(
      'recordType: snapshot.mode === "direct-upload" ? "board-upload" : "draw"',
    );
    expect(ts).toContain('submissionState: "pending-review"');
    expect(ts).toContain("finalizeCloudObservation");
  });

  it("lays out Grand Prize options in row-major pairs without changing their data order", () => {
    expect(wxml).toContain('wx:for="{{grandPrizeOptions}}"');
    expect(wxml).toContain("请根据原始版面标注，自行勾选大赏");
    expect(wxss).toMatch(
      /\.grand-prize-list\s*\{[\s\S]*?display:\s*grid;[\s\S]*?width:\s*calc\(100% - 10px\);[\s\S]*?margin:\s*0 auto;[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);[\s\S]*?grid-auto-flow:\s*row;[\s\S]*?gap:\s*10px 8px;/,
    );
    expect(wxss).toMatch(
      /\.grand-prize-option\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?padding:\s*12px 10px;[\s\S]*?grid-template-columns:\s*24px minmax\(0, 1fr\);[\s\S]*?grid-template-rows:\s*auto auto;/,
    );
    expect(wxss).toMatch(/\.grand-prize-check\s*\{[\s\S]*?grid-row:\s*1 \/ 3;/);
  });

  it("contains both IP inputs on small screens and locks editing while generating", () => {
    expect(wxss).toMatch(
      /\.recognition-ip-field > view\s*\{[\s\S]*?width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?grid-template-columns:\s*minmax\(0, 1\.15fr\) auto minmax\(0, 0\.85fr\);[\s\S]*?box-sizing:\s*border-box;/,
    );
    expect(wxss).toMatch(
      /\.recognition-ip-field input\s*\{[\s\S]*?min-width:\s*0;[\s\S]*?box-sizing:\s*border-box;/,
    );
    expect(wxss).toMatch(
      /\.recognition-text-field input\s*\{[\s\S]*?width:\s*100%;/,
    );
    expect(wxss).toMatch(
      /\.recognition-input-glow\s*\{[\s\S]*?border-radius:\s*inherit;[\s\S]*?linear-gradient\(135deg, #e014a0[\s\S]*?#5528c2[\s\S]*?filter:\s*blur\(2px\);[\s\S]*?opacity:\s*0;[\s\S]*?pointer-events:\s*none;[\s\S]*?visibility:\s*hidden;/,
    );
    expect(wxss).toMatch(
      /\.recognition-input-shell\.is-required-missing > \.recognition-input-glow\s*\{[\s\S]*?opacity:\s*0\.85;[\s\S]*?visibility:\s*visible;/,
    );
    const inputGlowRule = wxss.match(
      /\.recognition-input-glow\s*\{([\s\S]*?)\n\}/,
    )?.[1];
    expect(inputGlowRule).toBeDefined();
    expect(inputGlowRule).not.toContain("radial-gradient");
    expect(inputGlowRule).not.toContain("transparent");
    expect(inputGlowRule).not.toContain("transition");
    expect(inputGlowRule).not.toMatch(/#fff|white/i);
    expect(wxml).not.toMatch(
      /wx:if="\{\{[^}]+Blocking\}\}" class="action-glow"/,
    );
    expect(wxss).toMatch(
      /\.action-glow\s*\{[\s\S]*?radial-gradient\(circle at 8% 42%, #e014a0 0%, #e014a0 18%, transparent 40%\),[\s\S]*?radial-gradient\(circle at 92% 85%, #5528c2 0%, #5528c2 25%, transparent 50%\);[\s\S]*?filter:\s*blur\(2px\);[\s\S]*?opacity:\s*0\.85;/,
    );
    expect(wxml).toContain(
      'disabled="{{generationState === \'generating\'}}" bindinput="onRecognitionIpInput"',
    );
    expect(wxml).toContain("正在生成版面");
    expect(ts).toContain("createRecognitionGenerationSnapshot");
    expect(ts).toContain("isActiveGeneration(generationId)");
  });

  it("keeps every approved my-area destination distinct and complete", () => {
    expect(wxml).toContain('data-view="map-reminder"');
    expect(wxml).toContain("好版地图会整理成可查看的线索");
    expect(wxml).toContain("它不是实时库存提醒");
    expect(wxml).toContain("隐私与数据</text>");
    expect(wxml).toContain("返回票池");
    expect(wxml).toContain("管理记录");
    expect(wxml).toContain("删除全部本地数据");
    expect(wxml).toContain('bindtap="onClearAllLocalData"');
    expect(ts).toContain("onClearAllLocalData()");
    expect(wxss).toMatch(/\.subpage-copy\s*{\s*display: none;/);
    expect(wxml).toContain('template name="record-row"');
    expect(wxml).toContain("{{item.identityMeta}}");
    expect(wxml).toContain("{{item.statsMeta}}");
    expect(wxml).toMatch(
      /template name="draft-row"[\s\S]*?{{item\.title}}[\s\S]*?{{item\.identityMeta}}[\s\S]*?{{item\.statsMeta}}/,
    );
    expect(wxss).toMatch(
      /\.record-card\s*{[\s\S]*?border-left: 4px solid #111;/,
    );
    expect(wxss).toMatch(
      /\.record-resume\s*{[\s\S]*?border-bottom: 1px dashed #111;/,
    );
  });

  it("keeps temporary recognition pages under the shared navigation", () => {
    expect(wxml).toContain(
      'wx:if="{{modalView !== \'share-capture\'}}" class="bottom-nav',
    );
    expect(wxss).toMatch(
      /\.camera-page,\s*\.fullscreen-state\s*{\s*z-index: 90;/,
    );
    expect(wxss).toMatch(/\.bottom-nav\s*{[\s\S]*?z-index: 110;/);
    expect(ts).toMatch(
      /if \(this\.data\.currentView === "recognizing"\) clearRecognitionTimers\(\);/,
    );
  });

  it("synchronizes draft swipe state across the start list and local ledger", () => {
    expect(ts).toContain('["drafts", "startDrafts"] as const');
    expect(ts).toContain("updates[`${key}[${index}].swipeX`]");
  });

  it("uses a camera-only freeze, undo and second-confirm flow", () => {
    expect(wxml).not.toContain('bindtap="onChooseBoardMedia"');
    expect(wxml).toContain('bindtap="onCaptureBoardMedia"');
    expect(wxml).toContain('bindtap="onUndoBoardCapture"');
    expect(wxml).toContain(
      "{{boardCapturePath ? '确认识别这张版面' : '拍摄版面'}}",
    );
    expect(wxml).toContain("<camera");
    expect(wxml).toContain('device-position="back"');
    expect(wxml).toContain('bindinitdone="onCameraReady"');
    expect(wxml).toContain('binderror="onCameraError"');
    expect(ts).toMatch(
      /onCaptureBoardMedia\(\)[\s\S]*?captureBoardImage\([\s\S]*?getWxBoardCameraApi\(this, "\.camera-preview"\)/,
    );
    expect(ts).not.toContain("chooseBoardImage");
    expect(ts).toContain("confirmBoardCapture");
    expect(ts).not.toContain("board-correction");
    expect(wxml).toContain("{{toast.message}} · 累计 ¥{{toast.cost}}");
  });

  it("routes frozen confirmation directly through authoritative recognition", () => {
    const confirmStart = ts.indexOf("async confirmBoardCapture()");
    const confirmEnd = ts.indexOf("async captureBoardMediaNow()", confirmStart);
    const frozenConfirm = ts.slice(confirmStart, confirmEnd);
    expect(frozenConfirm).toContain("await this.startRecognition()");
    expect(ts).toContain("reserveCloudRecognition(getWxCloudFunctionApi()");
    expect(frozenConfirm).not.toContain("navigateTo");
    expect(appJson.pages).not.toContain("pages/board-correction/index");
  });

  it("renders all four camera guides as stable native overlay images", () => {
    for (const corner of ["tl", "tr", "bl", "br"]) {
      expect(wxml).toContain(
        `<cover-image class="guide-corner guide-corner--${corner}" src="/assets/icons/camera-corner-${corner}.png" />`,
      );
      expect(
        existsSync(
          `apps/client/miniprogram/assets/icons/camera-corner-${corner}.png`,
        ),
      ).toBe(true);
    }
    expect(wxml).not.toContain('class="camera-board-guide"');
    expect(wxss).toMatch(/\.guide-corner--tl\s*{ top: 20px; left: 20px; }/);
    expect(wxss).toMatch(/\.guide-corner--tr\s*{ top: 20px; right: 20px; }/);
    expect(wxss).toMatch(/\.guide-corner--bl\s*{ bottom: 20px; left: 20px; }/);
    expect(wxss).toMatch(/\.guide-corner--br\s*{ right: 20px; bottom: 20px; }/);
    expect(wxss).not.toMatch(
      /\.guide-corner[\s\S]*?border-(?:top|right|bottom|left)-width/,
    );
  });

  it("keeps the approved flow-header and removes target-tier selection", () => {
    expect(wxss).toMatch(
      /\.flow-header\s*{[\s\S]*?height: 52px;[\s\S]*?flex: 0 0 52px;/,
    );
    expect(wxss).toMatch(/\.flow-title\s*{[\s\S]*?font-size: 22px;/);
    expect(wxss).toMatch(
      /\.fixed-primary\s*{[\s\S]*?position: fixed;[\s\S]*?bottom: calc\(var\(--bottom-nav-offset\) \+ var\(--bottom-nav-height\) \+ 12px\);/,
    );
    expect(wxml).not.toContain("page-target");
    expect(wxml).not.toContain("onToggleTarget");
    expect(wxml).not.toContain("选择目标奖");
    expect(wxss).not.toContain(".target-check");
  });

  it("keeps the approved compact ticket, edge fades and visual-center modals", () => {
    expect(wxml).toContain('class="draw-edge-fade draw-edge-fade--top"');
    expect(wxml).toContain('class="draw-edge-fade draw-edge-fade--bottom"');
    expect(wxss).toMatch(
      /\.ticket-slot\s*{[\s\S]*?width: 12px;[\s\S]*?height: 12px;/,
    );
    expect(wxss).toMatch(/\.ticket-cover\s*{[\s\S]*?padding: 0 12px 0 8px;/);
    expect(wxss).toMatch(
      /\.draw-quick-actions\s*{[\s\S]*?bottom: calc\(var\(--bottom-clearance\) \+ 72px\);/,
    );
    expect(wxss).toMatch(
      /\.modal-card\s*{[\s\S]*?top: calc\(50vh - 32px\);[\s\S]*?height: 420px;/,
    );
    expect(wxss).toMatch(
      /\.modal-head\s*{[\s\S]*?width: 100%;[\s\S]*?min-height: var\(--modal-header-height\);[\s\S]*?justify-content: flex-start;/,
    );
    expect(wxss).toMatch(
      /\.modal-head button\s*{[\s\S]*?position: absolute;[\s\S]*?top: 24px;[\s\S]*?right: 24px;[\s\S]*?margin: 0;[\s\S]*?flex: none;/,
    );
    expect(wxml).toContain('template name="ticket-cover-content"');
    expect(wxml).toContain("ticket-peel-track");
    expect(wxml).not.toContain("ticket-peel-flap");
    expect(wxml).not.toContain("prize-ticket--target");
    expect(ts).not.toContain('wx.vibrateShort({ type: "light" })');
  });

  it("copies the approved history row hierarchy and per-round facts", () => {
    expect(ts).toContain(
      "remaining: summary.remaining + draft.history.length - index - 1",
    );
    expect(wxml).toContain('class="history-index">#{{item.index}}');
    expect(wxml).toContain('class="history-tier">{{item.tier}}赏');
    expect(wxml).toContain('class="history-remaining">余 {{item.remaining}}');
    expect(wxml).toContain('class="history-cost">¥{{item.cost}}');
    expect(wxml).not.toContain("第 {{item.index}} 抽");
    expect(wxml).not.toContain('class="history-cost">累计');
    expect(wxss).toMatch(
      /\.history-row\s*{[^}]*border-bottom: 1px solid rgba\(0,0,0,\.05\);[^}]*background: transparent;/,
    );
    expect(wxss).not.toMatch(/\.history-row\s*{[^}]*background:\s*#f0f2f5;/);
    expect(wxss).toMatch(/\.history-tier\s*{[^}]*color: #111;/);
    expect(wxss).toMatch(/\.history-cost\s*{[^}]*color: #e014a0;/);
    expect(wxss).toMatch(/\.history-remaining\s*{[^}]*color: #a1a1aa;/);
  });

  it("keeps share evidence controls and exception symbols semantically correct", () => {
    expect(wxml).toContain(
      "{{shareImagePath ? '已拍摄' : pendingEvidenceCapture ? '准备拍摄' : '拍摄赏票'}}",
    );
    expect(wxml).toContain('class="share-camera-preview"');
    expect(wxml).toContain('aria-label="赏票实时取景"');
    expect(wxml).toContain('class="share-evidence-photo"');
    expect(wxml).toContain('mode="aspectFill"');
    expect(wxml).toContain('aria-label="撤回已拍摄赏票"');
    expect(wxml).toContain('disabled="{{!shareImagePath}}"');
    expect(wxml).toContain('disabled="{{!shareReady || evidenceSubmitting}}"');
    expect(ts).toContain('getWxBoardCameraApi(this, ".camera-preview")');
    expect(ts).toContain('getWxBoardCameraApi(this, ".share-camera-preview")');
    expect(wxml).toContain('id="camera-output-canvas"');
    expect(ts).not.toContain(
      'chooseBoardImage(getWxBoardMediaApi(), ["camera"])',
    );
    expect(wxss).toMatch(
      /\.share-evidence-photo,\s*\.share-camera-preview\s*{[\s\S]*?width: 100%;[\s\S]*?height: 100%;[\s\S]*?border-radius: 30px;/,
    );
    expect(wxss).toMatch(
      /\.capture-actions\s*{[\s\S]*?grid-template-columns: 52px minmax\(160px, 212px\) 52px;[\s\S]*?gap: 12px;/,
    );
    expect(wxss).toMatch(
      /\.capture-button\s*{[\s\S]*?width: 100% !important;[\s\S]*?height: 52px;[\s\S]*?align-items: center;[\s\S]*?justify-content: center;[\s\S]*?font-size: 15px;/,
    );
    expect(wxml).not.toContain("/assets/icons/info-outline-white.svg");
    expect(wxml.match(/\/assets\/icons\/warning-white\.svg/g)).toHaveLength(7);
    expect(wxml).toContain("/assets/icons/arrow-u-up-left-white.svg");
    expect(wxml).toContain("/assets/icons/database-white.svg");
    expect(wxml).toContain("/assets/icons/trash-white.svg");
    expect(wxss).toMatch(
      /\.round-symbol--exception\s*{[\s\S]*?width: var\(--exception-icon-size\);[\s\S]*?height: var\(--exception-icon-size\);[\s\S]*?background: #111;/,
    );
  });

  it("uses the cannot-build card as the exception vertical-rhythm baseline", () => {
    expect(wxml.match(/exception-card light-capsule/g)).toHaveLength(10);
    expect(wxml.match(/class="state-actions"/g)).toHaveLength(10);
    for (const token of [
      "--exception-card-padding-y: 40px;",
      "--exception-icon-title-gap: 24px;",
      "--exception-title-copy-gap: 10px;",
      "--exception-copy-actions-gap: 28px;",
      "--exception-action-gap: 12px;",
      "--exception-action-max-width: 288px;",
    ]) {
      expect(wxss).toContain(token);
    }
    expect(wxss).toMatch(
      /\.modal-card--exception\s*{[\s\S]*?height: auto;[\s\S]*?padding: var\(--exception-card-padding-y\) 40px;/,
    );
    for (const documentedValue of [
      "`24px`",
      "`10px`",
      "`28px`",
      "`12px`",
      "`40px`",
    ]) {
      expect(designTokens).toContain(documentedValue);
    }
  });

  it("uses native elastic overscroll and persists positions only after scrolling settles", () => {
    expect(wxml).not.toMatch(/<scroll-view[^>]*\senhanced(?:\s|>)/);
    expect(wxml).not.toContain('bindscroll="onRememberScroll"');
    expect(wxml.match(/bindscrollend="onRememberScrollEnd"/g)).toHaveLength(5);
    expect(ts).toContain("onRememberScrollEnd(");
    expect(ts).not.toContain("onRememberScroll(");
    expect(wxml).toContain('<scroll-view class="modal-scroll" scroll-y>');
  });
});
