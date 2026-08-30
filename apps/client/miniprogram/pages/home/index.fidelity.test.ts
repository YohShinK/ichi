import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const pageRoot = "apps/client/miniprogram/pages/home";
const pageTs = readFileSync(`${pageRoot}/index.ts`, "utf8");
const wxml = readFileSync(`${pageRoot}/index.wxml`, "utf8");
const wxss = readFileSync(`${pageRoot}/index.wxss`, "utf8");
const directUploadIcon = readFileSync(
  "apps/client/miniprogram/assets/icons/arrow-circle-up-black.svg",
  "utf8",
);

describe("V1-31 approved web-shell fidelity", () => {
  it("keeps My Records local-only and My Uploads observation-only", () => {
    const myRecords = wxml.slice(
      wxml.indexOf("currentView === 'local-records'"),
      wxml.indexOf("currentView === 'contributions'"),
    );
    const myUploads = wxml.slice(
      wxml.indexOf("currentView === 'contributions'"),
      wxml.indexOf("currentView === 'map-reminder'"),
    );

    expect(myRecords).toContain("{{drafts.length}}");
    expect(myRecords).toContain('template is="record-row"');
    expect(myRecords).not.toContain("cloudRecords");
    expect(myRecords).not.toContain("onDeleteCloudRecord");

    expect(myUploads).toContain("{{cloudClues.length}}");
    expect(myUploads).toContain('wx:for="{{cloudClues}}"');
    expect(myUploads).toContain("onDeleteCloudRecord");
    expect(myUploads).not.toContain('wx:for="{{contributions}}"');
  });

  it("uses the resolved web avatar and icon assets instead of placeholders", () => {
    const expectedAssets = [
      "/assets/v1-29/ichi-camera-cutout.png",
      "/assets/icons/scan-white.svg",
      "/assets/icons/arrow-circle-up-black.svg",
      "/assets/icons/corners-out-gray.svg",
      "/assets/icons/map-pin-gray.svg",
      "/assets/icons/user-circle-gray.svg",
      "/assets/icons/gear-six-gray.svg",
      "/assets/icons/hard-drives-white.svg",
      "/assets/icons/hand-heart-pink.svg",
      "/assets/icons/bell-gray.svg",
      "/assets/icons/shield-check-gray.svg",
    ];

    for (const asset of expectedAssets) expect(wxml).toContain(asset);
    expect(wxml).toContain('src="{{accountAvatarUrl}}"');
    expect(pageTs).toContain(
      'const DEFAULT_ACCOUNT_AVATAR = "/assets/v1-29/ichi-avatar.png"',
    );
    expect(pageTs).toContain("accountAvatarUrl: DEFAULT_ACCOUNT_AVATAR");
    expect(wxml).not.toContain("profile-mark");
    expect(wxml).not.toContain("user-astronaut");
    expect(wxml).not.toContain("cloud-gray");
  });

  it("keeps the approved 390px web geometry and source glow recipe", () => {
    expect(wxss).toContain("padding: 16px 24px;");
    expect(wxss).toContain("width: 142px;");
    expect(wxss).toContain("max-width: 288px;");
    expect(wxss).toContain("radial-gradient(circle at 8% 42%, #e014a0");
    expect(wxss).toContain("radial-gradient(circle at 92% 85%, #5528c2");
    expect(wxss).toContain("filter: blur(2px);");
    expect(wxss).toContain("width: 288px !important;");
  });

  it("keeps the new import actions and recognition metadata in the approved component system", () => {
    expect(wxml).toMatch(
      /class="import-actions"[\s\S]*?进入辅助抽赏[\s\S]*?仅上传版面/,
    );
    expect(wxml).toMatch(
      /data-testid="direct-upload-board"[\s\S]*?arrow-circle-up-black\.svg[\s\S]*?仅上传版面/,
    );
    expect(wxss).toMatch(
      /\.import-actions\s*{[\s\S]*?max-width: 288px;[\s\S]*?gap: 12px;/,
    );
    expect(wxss).toMatch(
      /\.import-direct-button\s*{[\s\S]*?height: var\(--action-height\) !important;[\s\S]*?gap: 8px;/,
    );
    expect(directUploadIcon).toContain('stroke-width="24"');
    expect(directUploadIcon).toContain('stroke-linecap="round"');
    expect(directUploadIcon).toContain('<circle cx="128" cy="128" r="92"');
    expect(wxml).toMatch(
      /<text>IP<\/text>[\s\S]*?recognition-ip-main[\s\S]*?recognition-ip-divider[\s\S]*?recognition-theme-input[\s\S]*?<text>单抽价格<\/text>[\s\S]*?recognitionMode === 'direct-upload'[\s\S]*?<text>地点与备注<\/text>/,
    );
    expect(wxss).toMatch(
      /\.recognition-submit\[disabled\]\s*{[\s\S]*?background: #dfe2e7;[\s\S]*?color: #9a9da6;[\s\S]*?box-shadow: none;/,
    );
  });

  it("renders determinate four-stage recognition progress with distinct active and completed states", () => {
    for (const label of [
      "正在整理照片",
      "照片整理完成",
      "版面送去清点中",
      "版面已送去清点",
      "赏级与余票核算中",
      "赏级与余票已核好",
      "正在拼出版面结果",
      "版面结果已就绪",
    ])
      expect(wxml).toContain(label);
    expect(wxml).toContain('id="recognition-progress-ring"');
    expect(wxml).toContain(
      'aria-label="版面提取进度 {{recognitionProgress}}%"',
    );
    expect(wxml).toContain("recognition-step--active");
    expect(wxml).toContain("recognition-step--done");
    expect(wxml).toContain('wx:if="{{recognitionStage > 3}}"');
    expect(pageTs).toContain('context.lineCap = "round"');
    expect(pageTs).toContain('context.strokeStyle = "#e6e8ec"');
    expect(pageTs).toContain('context.strokeStyle = "#111111"');
    expect(wxss).toContain("@keyframes recognition-pulse");
    expect(wxss).toContain("background: #5528c2;");
    expect(wxml).not.toContain("recognition-step-glow");
    expect(wxss).toContain(
      "box-shadow: 0 0 0 5px rgba(85, 40, 194, 0.12), 0 0 14px rgba(85, 40, 194, 0.46);",
    );
    expect(wxss).toContain(
      "animation: recognition-pulse 1.6s ease-in-out infinite;",
    );
    expect(wxss).not.toContain(
      "conic-gradient(#111 var(--recognition-progress)",
    );
    expect(wxss).not.toContain("@keyframes ring-spin");
  });

  it("adds the large four-star mascot as a clipped white draft-card watermark", () => {
    expect(
      existsSync(
        "apps/client/miniprogram/assets/v1-29/ichi-mascot-large-watermark.png",
      ),
    ).toBe(true);
    expect(wxml).toMatch(
      /class="draft-card light-capsule swipe-content"[\s\S]*?class="draft-watermark" src="\/assets\/v1-29\/ichi-mascot-large-watermark\.png"[\s\S]*?class="draft-copy"[\s\S]*?class="draft-resume"/,
    );
    expect(wxss).toMatch(
      /\.draft-card\s*{[\s\S]*?position: relative;[\s\S]*?overflow: hidden;/,
    );
    expect(wxss).toMatch(
      /\.draft-watermark\s*{[\s\S]*?top: -30px;[\s\S]*?right: 2px;[\s\S]*?width: 180px;[\s\S]*?height: 143px;[\s\S]*?opacity: 0\.432;[\s\S]*?filter: drop-shadow\(0 4px 10px rgba\(17, 17, 17, 0\.08\)\);[\s\S]*?transform: rotate\(-40deg\);/,
    );
    expect(wxss).toMatch(
      /\.draft-copy\s*{[\s\S]*?position: relative;[\s\S]*?z-index: 1;/,
    );
    expect(wxss).toMatch(
      /\.draft-resume\s*{[\s\S]*?position: relative;[\s\S]*?z-index: 1;/,
    );
    expect(wxml).toMatch(
      /class="draft-card record-row-card light-capsule swipe-content"[\s\S]*?class="draft-watermark"/,
    );
    expect(wxml).toMatch(
      /class="draft-card contribution-card[^"]*light-capsule"[\s\S]*?class="draft-watermark"/,
    );
    expect(wxml).toContain(
      "class=\"record-state-badge status-pill {{item.recordStateLabel === '已上传' && !item.isDeleting ? 'status-pill--uploaded' : 'status-pill--dark'}}\"",
    );
    expect(wxml).toMatch(
      /class="draft-card record-row-card[^>]*>[\s\S]*?class="record-state-badge status-pill {{item\.recordStateLabel === '已上传' \? 'status-pill--uploaded' : 'status-pill--dark'}}"/,
    );
    expect(wxss).toMatch(
      /\.status-pill--uploaded\s*{[\s\S]*?background: #e014a0;/,
    );
    expect(wxml).toContain('class="record-verification-action"');
    expect(wxss).toMatch(
      /\.record-row-card \.record-state-badge,[\s\S]*?\.cloud-record-card \.record-state-badge,[\s\S]*?\.contribution-card \.record-state-badge\s*{[\s\S]*?top: 16px;[\s\S]*?right: 16px;/,
    );
    expect(wxss).toMatch(
      /\.record-verification-action\s*{[\s\S]*?right: 16px;[\s\S]*?bottom: 14px;[\s\S]*?min-width: 104px;/,
    );
    expect(wxss).toMatch(
      /\.record-card\s*{[\s\S]*?position: relative;[\s\S]*?overflow: hidden;/,
    );
  });

  it("uses the web border-box model so padding cannot inflate components", () => {
    expect(wxss).toMatch(/view,\s*text,\s*image,\s*button,\s*scroll-view\s*{/);
    expect(wxss).toContain("box-sizing: border-box;");
    expect(wxss).toContain("min-height: 55px;");
    expect(wxss).toContain("width: 40px;");
    expect(wxss).toContain("height: 40px;");
  });

  it("keeps the delete surface inset and invisible until the row is swiped", () => {
    expect(wxml).toContain("/assets/icons/trash-white.svg");
    expect(wxml).toContain("swipe-delete--visible");
    expect(wxss).toContain("width: 102px !important;");
    expect(wxss).toContain("padding: 14px 14px 14px 32px;");
    expect(wxss).toContain("top: 2px;");
    expect(wxss).toContain("right: 2px;");
    expect(wxss).toContain("bottom: 2px;");
    expect(wxss).toMatch(/\.swipe-delete\s*{[\s\S]*?opacity: 0;/);
    expect(wxss).toMatch(/\.swipe-row\s*{[\s\S]*?background: transparent;/);
  });

  it("dismisses an open draft action from the next screen tap", () => {
    expect(wxml).toMatch(
      /class="app-shell"[\s\S]*?bindtap="onDismissDraftSwipe"/,
    );
    expect(pageTs).toMatch(
      /onDismissDraftSwipe\(\)\s*{[\s\S]*?if \(suppressOpenBoardId\) return;[\s\S]*?draft\.swipeX < 0[\s\S]*?this\.setDraftSwipe\("", 0\);/,
    );
  });

  it("keeps the draft section header visible when there are no local drafts", () => {
    expect(wxml).toMatch(
      /<view class="start-drafts" data-testid="start-drafts">\s*<view class="drafts-header"><text>抽赏草稿<\/text><text>{{startDrafts\.length}} 份<\/text><\/view>/,
    );
    expect(wxml).not.toMatch(
      /<view wx:if="{{startDrafts\.length > 0}}" class="start-drafts"/,
    );
    expect(wxml).toMatch(
      /<scroll-view wx:if="{{startDrafts\.length > 0}}" class="draft-list" scroll-y enhanced="true" bounces="true" enable-flex="true"/,
    );
    const draftRowTemplate =
      wxml.match(/<template name="draft-row">([\s\S]*?)<\/template>/)?.[1] ??
      "";
    expect(draftRowTemplate).toContain('bindtouchmove="onTouchMove"');
    expect(draftRowTemplate).not.toContain('catchtouchmove="onTouchMove"');
    expect(wxml).toContain("每天有 5 次识别版面的权限");
    expect(wxml).not.toContain("照片会短暂上传到私有临时空间");
  });

  it("reserves the WeChat menu capsule and bottom safe area globally", () => {
    expect(wxml).toContain("--top-safe-px: {{topSafePx}}px;");
    expect(wxml).not.toContain("startTopSafePx");
    expect(wxss).toMatch(
      /\.page\s*{[\s\S]*?padding: var\(--top-safe-px\) var\(--page-gutter\) 0;/,
    );
    expect(wxss).toMatch(
      /\.app-shell\s*{[\s\S]*?--bottom-nav-offset: env\(safe-area-inset-bottom\);/,
    );
    expect(wxss).not.toContain(".app-shell--start");
    expect(wxss).not.toContain("--start-top-safe-px");
  });

  it("opens saved drafts directly in the draw workbench without a resume interstitial", () => {
    expect(wxml).toContain('data-testid="page-draw"');
    expect(wxml).toContain('class="draw-status light-capsule"');
    expect(wxml).not.toContain('data-testid="page-resume"');
    expect(wxml).not.toContain("找到上次的票池记录");
    expect(wxml).not.toContain("本机抽赏草稿");
  });

  it("keeps my-area secondary headers left aligned like the approved web shell", () => {
    expect(wxss).toMatch(
      /\.subpage-header\s*{[\s\S]*?width: 100%;[\s\S]*?justify-content: flex-start;[\s\S]*?gap: 12px;/,
    );
    expect(wxss).toMatch(
      /\.back-button\s*{[\s\S]*?width: 52px !important;[\s\S]*?margin: 0 !important;/,
    );
    expect(wxss).toMatch(/\.subpage-title\s*{[\s\S]*?margin: 0;/);
  });

  it("ports the approved reminder and storage exception pages", () => {
    expect(wxml).toContain('data-testid="page-map-reminder"');
    expect(wxml).toContain('data-testid="page-undo-protected"');
    expect(wxml).toContain('data-testid="page-storage-fallback"');
    expect(wxml).toContain("/assets/icons/map-pin-pink.svg");
    expect(wxml).toContain("/assets/icons/bell-pink.svg");
  });

  it("keeps the map placeholder watermark visibly present", () => {
    expect(wxml).toContain("/assets/v1-29/map-placeholder.svg");
    expect(wxss).toMatch(/\.map-watermark\s*{[\s\S]*?opacity: 0\.36;/);
  });

  it("matches the approved camera stage and control-deck geometry", () => {
    expect(wxml).not.toContain("guide-placeholder");
    expect(wxml).not.toContain("lightning-slash-gray.svg");
    expect(wxml).not.toContain('loading="{{mediaBusy}}"');
    expect(wxml).toContain("<camera");
    expect(wxml).toContain('device-position="back"');
    expect(wxml).toContain('bindinitdone="onCameraReady"');
    expect(wxml).toContain('binderror="onCameraError"');
    expect(wxml).toMatch(
      /camera-controls[\s\S]*?onBackToStart[\s\S]*?camera-shutter[\s\S]*?onCaptureBoardMedia[\s\S]*?boardCapturePath[\s\S]*?camera-undo-slot[\s\S]*?onUndoBoardCapture/,
    );
    expect(wxml).not.toContain("camera-side-spacer");
    expect(wxml).not.toContain("onChooseBoardMedia");
    expect(wxml).toContain("确认识别这张版面");
    expect(wxml).toContain("check-white.svg");
    expect(wxss).toMatch(
      /\.camera-stage\s*{[\s\S]*?position: absolute;[\s\S]*?top: var\(--top-safe-px\);[\s\S]*?bottom: calc\(var\(--bottom-nav-offset\) \+ var\(--bottom-nav-height\) \+ 102px\);/,
    );
    expect(wxml.match(/<cover-image class="guide-corner/g)).toHaveLength(4);
    expect(wxss).toMatch(/\.guide-corner--tl\s*{ top: 20px; left: 20px; }/);
    expect(wxss).toMatch(/\.guide-corner--tr\s*{ top: 20px; right: 20px; }/);
    expect(wxss).toMatch(/\.guide-corner--bl\s*{ bottom: 20px; left: 20px; }/);
    expect(wxss).toMatch(/\.guide-corner--br\s*{ right: 20px; bottom: 20px; }/);
    expect(wxss).toMatch(
      /\.camera-controls\s*{[\s\S]*?bottom: calc\(var\(--bottom-nav-offset\) \+ var\(--bottom-nav-height\) \+ 2px\);[\s\S]*?height: 100px;[\s\S]*?padding: 10px 32px;[\s\S]*?border-radius: 0;/,
    );
    expect(wxss).toMatch(
      /\.camera-shutter\s*{[\s\S]*?width: 72px !important;[\s\S]*?background: linear-gradient\(105deg, #e014a0, #5528c2\);/,
    );
    expect(wxss).toMatch(/\.camera-page\s*{[\s\S]*?background: #f0f2f5;/);
    expect(wxss).toMatch(/\.camera-stage\s*{[\s\S]*?background: #111;/);
    expect(wxss).toMatch(
      /\.camera-preview\s*{[\s\S]*?inset: 0;[\s\S]*?height: 100%;/,
    );
    expect(wxml).toContain("将版面放入框内");
    expect(wxml).not.toContain("将所需版面放在正中间");
    expect(wxml).not.toContain("并尽量铺满取景框");
    expect(wxss).toMatch(
      /\.camera-guide-label\s*{[\s\S]*?bottom: 18px;[\s\S]*?width: auto;[\s\S]*?min-height: 32px;[\s\S]*?padding: 6px 14px;[\s\S]*?transform: translateX\(-50%\);[\s\S]*?white-space: nowrap;/,
    );
    expect(wxss).toMatch(
      /\.camera-controls\s*{[\s\S]*?grid-template-columns: 52px minmax\(0, 1fr\) 52px;/,
    );
  });

  it("keeps the prize-ticket submit control black and animated while uploading", () => {
    expect(wxml).toContain("share-confirm--submitting");
    expect(wxml).toContain('wx:if="{{evidenceSubmitting}}"');
    expect(wxml).toContain("share-confirm-spinner");
    expect(wxss).toMatch(
      /\.share-confirm--submitting\[disabled\]\s*{[^}]*background: #111 !important;[^}]*opacity: 1;/,
    );
    expect(wxss).toMatch(
      /\.share-confirm-spinner\s*{[^}]*border-top-color: #fff;[^}]*animation: share-confirm-spin/,
    );
    expect(wxss).toContain("@keyframes share-confirm-spin");
  });

  it("renders stage-specific upload recovery without message-string guessing", () => {
    expect(wxml).toContain(">重新上传</button>");
    expect(wxml).toContain(">修改备注</button>");
    expect(wxml).toContain("item.verificationAction === 'reupload'");
    expect(wxml).toContain("item.verificationAction === 'edit-note'");
    expect(wxml).toContain("门店地点与备注（必填）");
    expect(wxml).toContain('placeholder="万达广场B1 XX店可以捡漏"');
    expect(wxml).toContain("只会重新核验备注，不会重复地点或照片核验。");
    expect(pageTs).toContain('result.status === "LOCATION_FAILED"');
    expect(pageTs).toContain('result.status === "PHOTO_FAILED"');
    expect(pageTs).toContain('result.status === "NOTE_FAILED"');
  });

  it("keeps the note-review modal compact and contains its reordered content", () => {
    expect(wxml).toMatch(
      /modalView === 'note-review'[\s\S]*?class="account-profile-nickname note-review-input"[\s\S]*?class="card-copy note-review-copy">只会重新核验备注，不会重复地点或照片核验。<[\s\S]*?class="action-wrap note-review-actions"/,
    );
    expect(wxss).toMatch(
      /\.modal-card--note-review\s*\{[\s\S]*?width:\s*calc\(100% - 48px\);[\s\S]*?max-width:\s*316px;[\s\S]*?height:\s*auto;[\s\S]*?padding:\s*24px 22px 28px;[\s\S]*?overflow:\s*visible;/,
    );
    expect(wxss).toMatch(
      /\.note-review-input\s*\{[\s\S]*?width:\s*calc\(100% - 8px\);[\s\S]*?max-width:\s*264px;[\s\S]*?margin:\s*0 auto;[\s\S]*?box-sizing:\s*border-box;/,
    );
    expect(wxss).toMatch(
      /\.note-review-copy\s*\{[\s\S]*?margin:\s*10px auto 0;[\s\S]*?text-align:\s*center;/,
    );
    expect(wxss).toMatch(/\.note-review-actions\s*\{\s*margin:\s*24px auto 0;/);
    expect(wxss).toMatch(
      /\.note-review-actions \.action-button\s*\{[\s\S]*?width:\s*100% !important;[\s\S]*?max-width:\s*100% !important;/,
    );
  });

  it("renders the uploaded-board delete confirmation as the standard exception modal", () => {
    expect(wxml).toContain(
      "wx:if=\"{{modalView === 'delete-uploaded-board'}}\"",
    );
    expect(wxml).toContain('role="dialog" aria-label="删除版面线索"');
    expect(wxml).toContain('<text class="state-title">删除版面线索</text>');
    expect(wxml).toContain(
      "删除后，该版面将从“我上传的版面”和“好版地图”中移除，相关上传数据也会从云端删除。此操作无法恢复。",
    );
    expect(wxml).toMatch(
      /modalView === 'delete-uploaded-board'[\s\S]*?warning-white\.svg[\s\S]*?class="action-button" bindtap="onConfirmDeleteUploadedBoard">删除<[\s\S]*?class="ghost-button" bindtap="onCancelDeleteUploadedBoard">取消</,
    );
  });

  it("keeps profile editing optional and never presents it as login", () => {
    expect(wxml).toContain('type="nickname"');
    expect(wxml).toContain('open-type="chooseAvatar"');
    expect(wxml).toContain('bindchooseavatar="onChooseWechatAvatar"');
    expect(wxml).not.toContain("使用微信登录");
    expect(wxml).toContain("更新个人资料");
    expect(wxml).toContain('class="profile-edit-back"');
    expect(wxml).toContain(
      'bindtap="onCloseWechatProfileAuthorization" aria-label="返回我的"',
    );
    expect(wxml).toContain('src="/assets/icons/arrow-left-gray.svg"');
    expect(wxml).toContain('bindtap="onOpenWechatProfileAuthorization"');
    expect(wxml).not.toContain("绑定微信资料");
    expect(wxml).not.toContain("选择微信头像");
    expect(wxml).not.toContain("微信头像与昵称已绑定");
    expect(wxml).not.toContain("微信身份由云函数可信上下文静默确认");
    expect(pageTs).toContain("bindWechatProfileFromSelection");
    expect(pageTs).toContain("getWxWechatProfileMediaAdapter");
    expect(pageTs).toContain(
      "profile.avatarFileId || profile.avatarUrl || fallback",
    );
    expect(pageTs).not.toContain("getUserProfile");
    expect(wxss).toMatch(
      /\.profile-edit-back\s*{[\s\S]*?top: 18px;[\s\S]*?left: 18px;[\s\S]*?width: 40px !important;[\s\S]*?height: 40px !important;/,
    );
    expect(wxss).toMatch(
      /\.profile\s*{[\s\S]*?display: grid;[\s\S]*?grid-template-columns: 80px minmax\(0, 1fr\);[\s\S]*?column-gap: 16px;/,
    );
    const profileRule = wxss.match(/\.profile\s*{([^}]*)}/)?.[1] ?? "";
    expect(profileRule).toContain("width: 100%");
    expect(profileRule).toContain("align-self: flex-start");
    expect(profileRule).toContain("justify-content: stretch");
    expect(profileRule).not.toContain("padding:");
    expect(wxss).toMatch(
      /button\.profile-avatar\s*{[\s\S]*?margin-right: 0 !important;[\s\S]*?margin-left: 0 !important;/,
    );
  });

  it("omits the reminder explanation card from privacy and data", () => {
    expect(wxml).not.toContain("提醒说明");
    expect(wxml).not.toContain("轻提醒只解释已经发生的抽取事实");
  });

  it("keeps source form padding, pink workbench tools and hero exception radii", () => {
    expect(wxss).toMatch(/\.recognition-prize\s*{[\s\S]*?padding: 14px;/);
    expect(wxml).toContain('class="recognition-tier"');
    expect(wxml).not.toContain('class="recognition-confidence"');
    expect(wxml).not.toContain("recognition-prize--low");
    expect(wxss).toMatch(
      /\.price-field input\s*{[\s\S]*?background: #f0f2f5;[\s\S]*?color: #111;/,
    );
    expect(wxss).not.toContain(".recognition-prize-head > text:last-child");
    expect(wxml).toContain("chart-pie-slice-white.svg");
    expect(wxml).toContain("arrow-u-up-left-white.svg");
    expect(wxml).toContain("clock-counter-clockwise-white.svg");
    expect(wxss).toMatch(
      /\.draw-quick-actions button\s*{[\s\S]*?background: #e014a0;/,
    );
    expect(wxml).toContain(
      "state-card state-card--hero exception-card light-capsule",
    );
    expect(wxss).toContain(
      ".state-card--hero { border-radius: var(--hero-radius); }",
    );
  });
});
