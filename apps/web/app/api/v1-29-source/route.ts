import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { buildBoardOutlook } from "../../board-outlook";

export const dynamic = "force-dynamic";

const sourcePath = "/Users/cunfu/Downloads/网页 ui.html";

const toastMascotMarkup = String.raw`<!-- 轻提醒吉祥物：大赏四芒星眼、中赏现有圆点眼、小赏眯眼 -->
                <div id="toast-mascot" class="ichi-toast-mascot relative flex justify-center items-center w-12 h-12 flex-shrink-0 mr-3" data-presentation="medium" aria-hidden="true">
                    <img class="ichi-toast-mascot-image ichi-toast-mascot-image--large" src="/v1-29/ichi-mascot-large.png" alt="" />
                    <div class="ichi-toast-mascot-face w-10 h-8 bg-black rounded-lg relative flex items-center justify-center shadow-md transform -rotate-3">
                        <div class="absolute right-[-4px] top-1/2 transform -translate-y-1/2 w-1.5 h-3 bg-[#f0f2f5] rounded-l-sm"></div>
                        <div class="flex gap-1.5">
                            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
                            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                    </div>
                    <img class="ichi-toast-mascot-image ichi-toast-mascot-image--small" src="/v1-29/ichi-mascot-small.png" alt="" />
                </div>`;

const mapReminderSection = String.raw`            <section id="page-map-reminder" class="page-view hidden">
                <h2 class="text-3xl font-black text-[#111] mb-2 tracking-tight">好版地图提醒</h2>
                <p class="text-xs text-zinc-500 font-medium mb-8 leading-relaxed">这是好版地图的 V2 功能预告。上线后，你可以关注自己在意的地点与版面变化。</p>

                <div class="flex flex-col gap-4 mb-10">
                    <div class="light-capsule p-6">
                        <h3 class="text-sm font-black text-[#111] mb-2 flex items-center"><i class="ph-fill ph-map-pin text-[#e014a0] mr-2 text-lg"></i> 会提醒什么</h3>
                        <p class="text-xs text-zinc-500 font-medium leading-relaxed">当关注地点出现新的、已核对的版面记录或状态更新时，好版地图会整理成可查看的线索。它不是实时库存提醒。</p>
                    </div>
                    <div class="light-capsule p-6">
                        <h3 class="text-sm font-black text-[#111] mb-2 flex items-center"><i class="ph-fill ph-bell text-[#e014a0] mr-2 text-lg"></i> 当前状态</h3>
                        <p class="text-xs text-zinc-500 font-medium leading-relaxed">V1 先保留这个说明入口。真实提醒设置、账号授权与通知能力将在 V2 的好版地图中接入。</p>
                    </div>
                </div>
                <a href="#my" class="ghost-button w-full">返回我的</a>
            </section>

`;

const bridgeStyle = String.raw`<style id="ichi-v1-29-fixes">
  :root {
    --ichi-page-gutter: 16px;
    --ichi-top-safe-area: 40px;
    --ichi-bottom-nav-offset: 20px;
    --ichi-bottom-nav-height: 64px;
    --ichi-bottom-nav-clearance: 104px;
    --ichi-visual-center-shift-y: -32px;
    --ichi-visual-center-y: calc(50dvh + var(--ichi-visual-center-shift-y));
    --ichi-space-2: 8px;
    --ichi-space-3: 12px;
    --ichi-space-4: 16px;
    --ichi-space-5: 20px;
    --ichi-space-6: 24px;
    --ichi-space-8: 32px;
    --ichi-space-10: 40px;
    --ichi-card-radius: 32px;
    --ichi-hero-radius: 40px;
    --ichi-action-height: 52px;
    --ichi-action-max-width: 288px;
    --ichi-copy-max-width: 290px;
    --ichi-page-max-width: 448px;
    --ichi-draw-status-height: 92px;
    --ichi-draw-edge-fade-size: 56px;
    --ichi-draw-bottom-fade-height: calc(var(--ichi-bottom-nav-height) + var(--ichi-bottom-nav-offset));
    --ichi-hold-duration: 1000ms;
    --ichi-share-center-offset-y: 24px;
  }
  #global-header { display: none !important; }
  .page-view.page-enter { animation: none !important; transform: none !important; }
  #mobile-bottom-nav .nav-item { flex-direction: row !important; }
  #mobile-bottom-nav .nav-item:not(.is-active) .label-text { display: none !important; }
  #mobile-bottom-nav .nav-item:not(.is-active) .icon-container { transform: none !important; }
  #mobile-bottom-nav .nav-item.is-active .icon-container { flex-direction: row !important; gap: 6px; transform: none !important; }
  #mobile-bottom-nav .nav-item.is-active .icon-container i { margin: 0 !important; font-size: 23px !important; }
  #mobile-bottom-nav .nav-item.is-active .label-text { position: static !important; display: block !important; margin: 0 !important; color: #fff !important; font-size: 10px !important; line-height: 1 !important; letter-spacing: .1em !important; white-space: nowrap !important; }
  body > nav { position: fixed !important; right: auto !important; bottom: var(--ichi-bottom-nav-offset) !important; left: 50% !important; margin: 0 !important; transform: translateX(-50%) !important; transition: none !important; }
  /* The map preview card establishes the shared top safe area for all page content. */
  body:not([data-ichi-page="camera-capture"]) #pages-container { padding-top: var(--ichi-top-safe-area) !important; }
  body[data-ichi-page="map-preview"] #page-map-preview > div:first-child { margin-top: 0 !important; }
  /* Shared V1-29 card geometry. Individual page families may choose their content density. */
  .light-capsule { border-radius: var(--ichi-card-radius) !important; }
  .action-button, .ghost-button { height: var(--ichi-action-height) !important; }
  .ichi-avatar-frame { width: 80px; height: 80px; flex: 0 0 80px; overflow: hidden; border: 0; border-radius: 50%; background: #fff; box-shadow: none; }
  .ichi-avatar-image { display: block; width: 100%; height: 100%; object-fit: cover; }
  .ichi-avatar-robot { position: relative; width: 54px; height: 42px; border-radius: 15px 15px 17px 17px; background: #000; box-shadow: inset -5px -2px rgba(255,255,255,.04); }
  .ichi-avatar-robot::before, .ichi-avatar-robot::after { content: ""; position: absolute; top: 15px; width: 10px; height: 10px; border-radius: 50%; background: #fff; }
  .ichi-avatar-robot::before { left: 13px; }.ichi-avatar-robot::after { right: 13px; }
  .ichi-toast-mascot-image { display: none; width: 40px; height: 32px; object-fit: contain; filter: drop-shadow(0 4px 6px rgba(0,0,0,.16)); transform: rotate(-3deg); }
  #toast-mascot[data-presentation="large"] .ichi-toast-mascot-image--large,
  #toast-mascot[data-presentation="small"] .ichi-toast-mascot-image--small { display: block; }
  #toast-mascot[data-presentation="large"] .ichi-toast-mascot-face,
  #toast-mascot[data-presentation="small"] .ichi-toast-mascot-face { display: none; }
  body[data-ichi-page="my"] { height: 100dvh; overflow: hidden !important; }
  body[data-ichi-page="my"] main { height: 100dvh !important; overflow: hidden !important; }
  body[data-ichi-page="my"] #pages-container { height: calc(100dvh - var(--ichi-bottom-nav-clearance)); padding: var(--ichi-top-safe-area) var(--ichi-page-gutter) 0 !important; overflow: hidden !important; }
  body[data-ichi-page="my"] #page-my { height: 100%; overflow: hidden; }
  body[data-ichi-page="my"] #page-my > div:first-child { margin: 0 0 16px !important; gap: 16px !important; }
  body[data-ichi-page="my"] #page-my .light-capsule { padding: 6px !important; gap: 0 !important; margin-bottom: 12px !important; }
  body[data-ichi-page="my"] #page-my a { min-height: 55px; padding: 10px 12px !important; }
  body[data-ichi-page="method"] { height: 100dvh; overflow: hidden !important; }
  body[data-ichi-page="method"] #pages-container { padding: var(--ichi-top-safe-area) var(--ichi-page-gutter) 0 !important; }
  body[data-ichi-page="method"] #page-method { height: calc(100dvh - 94px); overflow: hidden; }
  body[data-ichi-page="method"] #page-method > h2 { margin-bottom: 14px !important; font-size: 28px !important; }
  body[data-ichi-page="method"] #page-method > div:first-of-type { gap: 10px !important; margin-bottom: 14px !important; }
  body[data-ichi-page="method"] #page-method > div:first-of-type .light-capsule { padding: 16px !important; }
  body[data-ichi-page="method"] #page-method > div:first-of-type h3 { margin-bottom: 6px !important; }
  body[data-ichi-page="method"] #page-method > div:first-of-type p { font-size: 11px !important; line-height: 1.45 !important; }
  body[data-ichi-page="method"] #page-method > div:last-child .action-button, body[data-ichi-page="method"] #page-method > div:last-child .ghost-button { height: 44px !important; }
  .ichi-my-subpage { position: relative !important; padding-top: 0 !important; }
  .ichi-my-subpage > .ichi-my-back-button {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    display: flex !important;
    width: 52px !important;
    height: 52px !important;
    align-items: center !important;
    justify-content: center !important;
    border: 0 !important;
    border-radius: 999px !important;
    background: #e9ebef !important;
    color: #71717a !important;
    box-shadow: none !important;
    z-index: 60 !important;
  }
  .ichi-my-subpage > .ichi-my-back-button:active { transform: scale(.95); }
  .ichi-my-subpage > h2:first-of-type {
    display: flex !important;
    min-height: 52px !important;
    padding-left: 64px !important;
    align-items: center !important;
  }
  body[data-ichi-page="recognizing"] #page-recognizing { position: fixed !important; inset: 0 !important; margin: 0 !important; padding: 0 !important; transform: none !important; animation: none !important; z-index: 90 !important; }
  body[data-ichi-page="recognizing"] #page-recognizing > div:first-child { position: absolute !important; inset: 0 !important; align-items: center !important; justify-content: flex-start !important; }
  body[data-ichi-page="recognizing"] #page-recognizing > div:first-child > div:first-child { position: absolute !important; top: var(--ichi-visual-center-y) !important; transform: translateY(-50%) !important; }
  body[data-ichi-page="start"] { height: 100dvh; overflow: hidden !important; }
  body[data-ichi-page="start"] main { height: 100dvh !important; overflow: hidden !important; }
  body[data-ichi-page="start"] #pages-container { height: calc(100dvh - var(--ichi-bottom-nav-clearance)); padding: var(--ichi-top-safe-area) var(--ichi-page-gutter) 0 !important; overflow: hidden !important; }
  body[data-ichi-page="start"] #page-start { display: flex !important; height: 100%; min-height: 0; padding-top: 0 !important; flex-direction: column; overflow: hidden; }
  body[data-ichi-page="start"] #page-start > div:first-child { min-height: 0 !important; margin-bottom: var(--ichi-space-4) !important; padding: var(--ichi-space-4) var(--ichi-space-6) !important; flex: 0 0 auto; border-radius: var(--ichi-hero-radius) !important; }
  body[data-ichi-page="start"] #page-start > div:first-child > div:first-child { order: 1; width: 142px !important; height: 142px !important; margin-bottom: var(--ichi-space-3) !important; background: transparent !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
  body[data-ichi-page="start"] #page-start > div:first-child > h2 { order: 2; position: relative; z-index: 1; }
  body[data-ichi-page="start"] #page-start > div:first-child > h2 { margin-bottom: var(--ichi-space-2) !important; }
  body[data-ichi-page="start"] #page-start > div:first-child > p { order: 3; max-width: var(--ichi-copy-max-width) !important; margin-bottom: var(--ichi-space-4) !important; }
  body[data-ichi-page="start"] #page-start > div:first-child > .btn-wrapper { order: 4; width: 100% !important; max-width: var(--ichi-action-max-width) !important; }
  .ichi-source-camera-icon { display: block; width: 142px; height: 142px; object-fit: contain; }
  .ichi-recognition-mascot { position: relative; z-index: 20; display: block; width: 72px; height: auto; max-height: 64px; object-fit: contain; }
  .ichi-start-drafts { display: flex; min-height: 0; flex: 1 1 auto; flex-direction: column; overflow: hidden; }
  .ichi-start-drafts[hidden] { display: none !important; }
  .ichi-start-drafts-header { display: flex; padding: 0 4px 10px; align-items: center; justify-content: space-between; color: #71717a; font-size: 10px; font-weight: 900; letter-spacing: .12em; }
  .ichi-start-draft-list { display: flex; min-height: 0; padding: 0 2px 16px; flex: 1 1 auto; flex-direction: column; gap: var(--ichi-space-3); overflow-y: auto; overscroll-behavior: contain; }
  .ichi-start-draft-card { display: flex; width: 100%; min-height: 96px; padding: var(--ichi-space-4) var(--ichi-space-5); flex: 0 0 auto; align-items: center; justify-content: space-between; gap: var(--ichi-space-4); border: 0; color: #111; text-align: left; }
  .ichi-start-draft-card:active { transform: scale(.985); }
  .ichi-start-draft-copy { display: flex; min-width: 0; flex-direction: column; gap: 6px; }
  .ichi-start-draft-title { font-size: 15px; font-weight: 900; }
  .ichi-start-draft-meta { color: #71717a; font-size: 10px; font-weight: 700; line-height: 1.45; }
  .ichi-start-draft-resume { display: flex; flex: 0 0 auto; align-items: center; gap: 4px; color: #111; font-size: 11px; font-weight: 900; }
  .ichi-swipe-row { position: relative; width: 100%; flex: 0 0 auto; overflow: hidden; border-radius: var(--ichi-card-radius); background: #111; }
  .ichi-swipe-content { position: relative; z-index: 2; width: 100%; transition: transform .24s cubic-bezier(.2,.75,.2,1); touch-action: pan-y; }
  .ichi-swipe-delete { position: absolute; top: 0; right: 0; bottom: 0; z-index: 1; display: flex; width: 72px; align-items: center; justify-content: center; border: 0; background: #111; color: #fff; font-size: 22px; }
  .ichi-swipe-delete:active { background: #27272a; }
  .ichi-record-page-copy { max-width: var(--ichi-copy-max-width); margin: 0 0 var(--ichi-space-5); color: #71717a; font-size: 11px; font-weight: 700; line-height: 1.55; }
  .ichi-record-summary { display: flex; margin-bottom: var(--ichi-space-4); padding: 10px 14px; align-items: center; justify-content: space-between; border-radius: 18px; background: rgba(255,255,255,.68); color: #71717a; font-size: 10px; font-weight: 900; }
  .ichi-record-list { display: flex; margin-bottom: var(--ichi-space-5); flex-direction: column; gap: var(--ichi-space-3); }
  .ichi-record-card { display: flex; min-height: 92px; padding: var(--ichi-space-4); flex-direction: column; gap: 10px; border-left: 4px solid #111; }
  .ichi-record-card[data-upload-status="uploaded"] { border-left-color: #e014a0; }
  .ichi-record-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--ichi-space-3); }
  .ichi-record-card-title { color: #111; font-size: 15px; font-weight: 900; line-height: 1.25; }
  .ichi-record-card-time { flex: 0 0 auto; color: #a1a1aa; font-size: 9px; font-weight: 800; }
  .ichi-record-status { display: inline-flex; width: max-content; padding: 4px 9px; align-items: center; border-radius: 999px; background: #f0f2f5; color: #52525b; font-size: 9px; font-weight: 900; line-height: 1; }
  .ichi-record-card[data-upload-status="uploaded"] .ichi-record-status { background: #111; color: #fff; }
  .ichi-record-card-meta { color: #71717a; font-size: 10px; font-weight: 700; line-height: 1.45; }
  .ichi-record-card-actions { display: flex; padding-top: 2px; align-items: center; justify-content: space-between; gap: var(--ichi-space-3); }
  .ichi-record-resume { border: 0; background: transparent; color: #111; font-size: 10px; font-weight: 900; text-decoration: underline; text-decoration-style: dashed; text-underline-offset: 4px; }
  .ichi-contribution-likes { display: inline-flex; align-items: center; gap: 5px; color: #e014a0; font-size: 11px; font-weight: 900; }
  .ichi-contribution-note { margin-top: -2px; color: #a1a1aa; font-size: 9px; font-weight: 700; }
  .ichi-record-empty { padding: var(--ichi-space-6); color: #71717a; text-align: center; font-size: 11px; font-weight: 700; }
  body[data-ichi-page="draw"] #pages-container { padding-top: 0 !important; }
  body[data-ichi-page="draw"] #page-draw { padding: calc(var(--ichi-top-safe-area) + var(--ichi-draw-status-height) + var(--ichi-space-5)) var(--ichi-page-gutter) calc(var(--ichi-bottom-nav-clearance) + 84px) !important; animation: none !important; transform: none !important; }
  #page-draw > .ichi-draw-status {
    position: fixed !important;
    top: var(--ichi-top-safe-area) !important;
    right: auto !important;
    left: 50% !important;
    width: calc(100% - (2 * var(--ichi-page-gutter))) !important;
    max-width: calc(var(--ichi-page-max-width) - (2 * var(--ichi-page-gutter))) !important;
    height: var(--ichi-draw-status-height) !important;
    margin: 0 !important;
    z-index: 65 !important;
    transform: translateX(-50%) !important;
  }
  body[data-ichi-page="draw"] #toast-message { top: calc(var(--ichi-top-safe-area) + (var(--ichi-draw-status-height) / 2)) !important; transform: translate(-50%, -50%) !important; }
  /* Fade the scrolling ticket layer into the fixed status card and bottom nav. */
  .ichi-draw-edge-fade {
    position: fixed !important;
    right: 0 !important;
    left: 0 !important;
    display: block !important;
    pointer-events: none !important;
  }
  .ichi-draw-edge-fade--top {
    top: 0 !important;
    height: calc(var(--ichi-top-safe-area) + var(--ichi-draw-status-height)) !important;
    z-index: 64 !important;
    background: linear-gradient(
      to bottom,
      rgba(240, 242, 245, 1) 0,
      rgba(240, 242, 245, 1) 16px,
      rgba(240, 242, 245, .96) var(--ichi-top-safe-area),
      rgba(240, 242, 245, .72) calc(var(--ichi-top-safe-area) + var(--ichi-draw-edge-fade-size)),
      rgba(240, 242, 245, 0) 100%
    ) !important;
  }
  .ichi-draw-edge-fade--bottom {
    top: calc(100dvh - var(--ichi-bottom-nav-offset) - var(--ichi-bottom-nav-height)) !important;
    height: var(--ichi-draw-bottom-fade-height) !important;
    z-index: 49 !important;
    background: linear-gradient(to bottom, rgba(240, 242, 245, 0), rgba(240, 242, 245, .92) 72%, rgba(240, 242, 245, 1) 100%) !important;
  }
  #page-draw > .ichi-draw-quick-actions {
    position: fixed !important;
    right: max(6px, calc((100vw - var(--ichi-page-max-width)) / 2 + 6px)) !important;
    bottom: calc(var(--ichi-bottom-nav-clearance) + 72px) !important;
    gap: var(--ichi-space-3) !important;
    z-index: 66 !important;
  }
  #page-draw > .ichi-draw-quick-actions button { border: 0 !important; background: #e014a0 !important; color: #fff !important; box-shadow: 0 8px 22px rgba(224,20,160,.3) !important; }
  #page-draw > .ichi-draw-stop-wrap {
    position: fixed !important;
    bottom: calc(var(--ichi-bottom-nav-offset) + var(--ichi-bottom-nav-height) + 12px) !important;
    left: 50% !important;
    width: min(56vw, 220px) !important;
    max-width: 220px !important;
    transform: translateX(-50%) !important;
    z-index: 67 !important;
  }
  .ichi-hold-button {
    position: relative !important;
    overflow: hidden !important;
    border: 1px solid rgba(17, 17, 17, .08) !important;
    background: #fff !important;
    color: #111 !important;
    user-select: none !important;
    touch-action: none !important;
  }
  .ichi-hold-fill { position: absolute; inset: 0 auto 0 0; width: var(--ichi-hold-progress, 0%); background: #111; pointer-events: none; }
  .ichi-hold-content { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px; pointer-events: none; }
  .ichi-hold-content--base { color: #111; }
  .ichi-hold-content--active { color: #fff; clip-path: inset(0 calc(100% - var(--ichi-hold-progress, 0%)) 0 0); }
  .ichi-workspace-modal {
    position: fixed !important;
    inset: 0 !important;
    display: none;
    padding: 0 var(--ichi-page-gutter) !important;
    align-items: center !important;
    justify-content: flex-start !important;
    z-index: 300 !important;
  }
  .ichi-workspace-modal:not(.hidden) { display: flex !important; }
  .ichi-workspace-modal > .ichi-workspace-modal-card {
    position: absolute !important;
    top: var(--ichi-visual-center-y) !important;
    left: 50% !important;
    display: flex !important;
    width: calc(100% - (2 * var(--ichi-page-gutter))) !important;
    max-width: 340px !important;
    height: min(420px, calc(100dvh - var(--ichi-top-safe-area) - var(--ichi-bottom-nav-clearance) - 24px)) !important;
    max-height: calc(100dvh - var(--ichi-top-safe-area) - var(--ichi-bottom-nav-clearance) - 24px) !important;
    min-height: 0 !important;
    padding: var(--ichi-space-6) !important;
    flex-direction: column !important;
    overflow: hidden !important;
    border-radius: var(--ichi-card-radius) !important;
    background: #fff !important;
    box-shadow: 0 18px 50px rgba(0,0,0,.24) !important;
    transform: translate(-50%, -50%) !important;
  }
  .ichi-workspace-modal-scroll { min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
  body[data-ichi-modal-open="true"] > nav { pointer-events: none !important; filter: blur(2px); opacity: .58; }
  body[data-ichi-modal-open="true"] .ichi-draw-status,
  body[data-ichi-modal-open="true"] .ichi-draw-quick-actions,
  body[data-ichi-modal-open="true"] .ichi-draw-stop-wrap { pointer-events: none !important; }
  #overlay-submitted { z-index: 300 !important; }
  #overlay-submitted:not(.hidden) { display: flex !important; }
  #modal-share-1 > .ichi-workspace-modal-card, #overlay-submitted > .ichi-workspace-modal-card { padding: var(--ichi-space-5) !important; }
  #modal-share-1:not(.hidden) { display: flex !important; }
  #modal-share-1 > .ichi-workspace-modal-card { top: calc(var(--ichi-visual-center-y) + var(--ichi-share-center-offset-y)) !important; }
  .ichi-share-exit {
    display: inline-flex;
    margin: 2px auto 0;
    padding: 4px 0 2px;
    border: 0;
    border-bottom: 1px dashed #a1a1aa;
    background: transparent;
    color: #a1a1aa;
    font-size: 10px;
    font-weight: 800;
    line-height: 1.2;
  }
  #ichi-outlook-events { display: flex; flex-direction: column; gap: 10px; }
  .ichi-outlook-event { display: flex; min-height: 52px; padding: 12px 14px; align-items: center; justify-content: space-between; gap: 12px; border-radius: 18px; background: #f0f2f5; }
  .ichi-outlook-event span:first-child { color: #3f3f46; font-size: 12px; font-weight: 800; line-height: 1.35; }
  .ichi-outlook-event strong { color: #111; font-size: 18px; font-weight: 900; white-space: nowrap; }
  .ichi-outlook-cost { display: flex; margin-top: 10px; padding: 10px 14px; align-items: center; justify-content: space-between; border-top: 1px solid rgba(17,17,17,.08); color: #71717a; font-size: 11px; font-weight: 800; }
  /* Hero variants share copy/action cadence but retain different asset sizes by meaning. */
  body[data-ichi-page="map-preview"] #page-map-preview > div:first-child,
  body[data-ichi-page="cannot-build-pool"] #page-cannot-build-pool > div:first-child,
  body[data-ichi-page="deleted"] #page-deleted > div:first-child { border-radius: var(--ichi-hero-radius) !important; }
  body[data-ichi-page="map-preview"] #page-map-preview > div:first-child { padding: var(--ichi-space-10) var(--ichi-space-6) !important; }
  body[data-ichi-page="map-preview"] #page-map-preview > div:first-child > div:nth-child(2) { margin-bottom: var(--ichi-space-6) !important; }
  body[data-ichi-page="map-preview"] #page-map-preview > div:first-child > h3 { margin-bottom: var(--ichi-space-3) !important; }
  body[data-ichi-page="map-preview"] #page-map-preview > div:first-child > p { width: 100% !important; max-width: var(--ichi-copy-max-width) !important; margin: 0 auto !important; }
  body[data-ichi-page="map-preview"] #page-map-preview > div:first-child > div:last-child { width: 100% !important; max-width: var(--ichi-action-max-width) !important; margin: var(--ichi-space-6) auto 0 !important; gap: var(--ichi-space-4) !important; }
  body[data-ichi-page="map-preview"] #page-map-preview > div:first-child > div:last-child > * { width: 100% !important; }
  body[data-ichi-page="camera-capture"] { height: 100dvh; overflow: hidden !important; }
  /* The source main element is scrollable; release clipping only while the camera owns the screen. */
  body[data-ichi-page="camera-capture"] main { height: 100dvh !important; overflow: visible !important; }
  body[data-ichi-page="camera-capture"] > nav { display: flex !important; z-index: 110 !important; }
  /* Keep the capture shell outside the source page's padded/animated container. */
  #page-camera-capture { position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100dvh !important; margin: 0 !important; padding: 0 !important; transform: none !important; z-index: 90 !important; }
  #page-camera-capture > div { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100dvh !important; min-height: 100dvh !important; background: #f0f2f5 !important; z-index: 90 !important; }
  #page-camera-capture > div > div:first-child > a { display: none !important; }
  #page-camera-capture > div > div:first-child > div:nth-child(2) { position: fixed !important; top: auto !important; right: auto !important; bottom: 208px !important; left: 50% !important; display: flex !important; height: 44px !important; padding: 0 18px !important; align-items: center !important; justify-content: center !important; z-index: 101 !important; transform: translateX(-50%) !important; }
  #page-camera-capture > div > div:first-child > div:nth-child(2) > span { display: flex !important; width: 100% !important; align-items: center !important; justify-content: center !important; gap: 8px !important; line-height: 1 !important; }
  #page-camera-capture > div > div:first-child > div:nth-child(2) > span > i { display: block !important; margin: 0 !important; }
  #page-camera-capture > div > div:nth-child(2) { position: absolute !important; top: var(--ichi-top-safe-area) !important; right: 0 !important; bottom: 186px !important; left: 0 !important; min-height: 0 !important; height: auto !important; padding-bottom: 0 !important; background: #111 !important; }
  #page-camera-capture > div > div:nth-child(2) > div:first-child { display: none !important; }
  #page-camera-capture > div > div:nth-child(2) > div:nth-child(2) { position: absolute !important; top: 20px !important; right: 20px !important; bottom: 20px !important; left: 20px !important; display: block !important; width: auto !important; height: auto !important; max-width: none !important; aspect-ratio: auto !important; padding: 0 !important; border: 0 !important; box-shadow: none !important; }
  #page-camera-capture > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(5) { display: none !important; }
  #page-camera-capture > div > div:last-child { position: absolute !important; right: 0; bottom: 86px; left: 0; height: 100px !important; padding: 10px 32px !important; border-radius: 0 !important; background: linear-gradient(180deg, #d9dce1 0%, #ffffff 46%, #f1f2f4 72%, #d9dce1 100%) !important; z-index: 100 !important; }
  #page-camera-capture > div > div:last-child > div.absolute > button { background: #e9ebef !important; border: 0 !important; box-shadow: none !important; }
  #page-camera-capture .source-camera-shutter { width: 72px !important; height: 72px !important; padding: 3px !important; background: linear-gradient(105deg, #e014a0, #5528c2) !important; box-shadow: 0 8px 26px rgba(85, 40, 194, .28), 0 0 22px rgba(224, 20, 160, .2) !important; }
  .ichi-my-subpage { padding-top: 0 !important; }
  .ichi-my-subpage-header { display: flex; width: 100%; height: 52px; margin-bottom: var(--ichi-space-5); align-items: center; gap: var(--ichi-space-3); }
  .ichi-my-subpage-header .ichi-my-back-button {
    position: static !important;
    display: flex !important;
    width: 52px !important;
    height: 52px !important;
    flex: 0 0 52px;
    align-items: center !important;
    justify-content: center !important;
    border: 0 !important;
    border-radius: 999px !important;
    background: #e9ebef !important;
    color: #71717a !important;
    box-shadow: none !important;
  }
  .ichi-my-subpage-titleline { display: flex; min-width: 0; height: 52px; align-items: center; gap: 8px; color: #111; white-space: nowrap; }
  .ichi-my-subpage-titleline strong { color: #111; font-size: 24px; font-weight: 900; line-height: 1; letter-spacing: -.02em; }
  .ichi-my-subpage-titleline span { display: none !important; }
  .ichi-my-subpage-source-title, .ichi-my-subpage-source-copy { display: none !important; }
  body[data-ichi-page="storage"], body[data-ichi-page="local-records"], body[data-ichi-page="contributions"], body[data-ichi-page="map-reminder"], body[data-ichi-page="method"] { height: 100dvh; overflow: hidden !important; }
  body[data-ichi-page="storage"] main, body[data-ichi-page="local-records"] main, body[data-ichi-page="contributions"] main, body[data-ichi-page="map-reminder"] main, body[data-ichi-page="method"] main { height: 100dvh !important; overflow: hidden !important; }
  body[data-ichi-page="storage"] #pages-container, body[data-ichi-page="local-records"] #pages-container, body[data-ichi-page="contributions"] #pages-container, body[data-ichi-page="map-reminder"] #pages-container, body[data-ichi-page="method"] #pages-container { height: calc(100dvh - var(--ichi-bottom-nav-clearance)); padding: var(--ichi-top-safe-area) var(--ichi-page-gutter) 0 !important; overflow: hidden !important; }
  body[data-ichi-page="storage"] .ichi-my-subpage:not(.hidden), body[data-ichi-page="local-records"] .ichi-my-subpage:not(.hidden), body[data-ichi-page="contributions"] .ichi-my-subpage:not(.hidden), body[data-ichi-page="map-reminder"] .ichi-my-subpage:not(.hidden), body[data-ichi-page="method"] .ichi-my-subpage:not(.hidden) { display: flex !important; height: 100%; min-height: 0; flex-direction: column; overflow: hidden !important; }
  body[data-ichi-page="storage"] .ichi-my-subpage.hidden, body[data-ichi-page="local-records"] .ichi-my-subpage.hidden, body[data-ichi-page="contributions"] .ichi-my-subpage.hidden, body[data-ichi-page="map-reminder"] .ichi-my-subpage.hidden, body[data-ichi-page="method"] .ichi-my-subpage.hidden { display: none !important; }
  body[data-ichi-page="storage"] .ichi-my-subpage-header, body[data-ichi-page="local-records"] .ichi-my-subpage-header, body[data-ichi-page="contributions"] .ichi-my-subpage-header, body[data-ichi-page="map-reminder"] .ichi-my-subpage-header, body[data-ichi-page="method"] .ichi-my-subpage-header { position: relative; z-index: 5; flex: 0 0 52px; margin-bottom: var(--ichi-space-3) !important; background: #f0f2f5; }
  .ichi-my-subpage-stats { display: flex; min-height: 35px; padding: 9px 14px; flex: 0 0 auto; align-items: center; justify-content: space-between; gap: 8px; border-radius: 18px; background: rgba(255,255,255,.78); color: #71717a; font-size: 10px; font-weight: 900; line-height: 1.2; white-space: nowrap; }
  body[data-ichi-page="storage"] .ichi-my-subpage-scroll, body[data-ichi-page="local-records"] .ichi-my-subpage-scroll, body[data-ichi-page="contributions"] .ichi-my-subpage-scroll, body[data-ichi-page="map-reminder"] .ichi-my-subpage-scroll, body[data-ichi-page="method"] .ichi-my-subpage-scroll { min-height: 0; padding-bottom: calc(var(--ichi-bottom-nav-clearance) + var(--ichi-space-5)); flex: 1 1 auto; overflow-y: auto; overscroll-behavior: contain; }
  body[data-ichi-page="draft"] { height: 100dvh; overflow: hidden !important; }
  body[data-ichi-page="draft"] main { height: 100dvh !important; overflow: hidden !important; }
  body[data-ichi-page="draft"] #pages-container { height: calc(100dvh - var(--ichi-bottom-nav-clearance)); padding: var(--ichi-top-safe-area) var(--ichi-page-gutter) 0 !important; overflow: hidden !important; }
  .ichi-flow-page { display: flex !important; height: 100%; min-height: 0; flex-direction: column; overflow: hidden !important; }
  .ichi-flow-page.hidden { display: none !important; }
  .ichi-flow-header { display: flex; flex: 0 0 52px; align-items: center; gap: var(--ichi-space-3); }
  .ichi-flow-back { display: flex; width: 52px; height: 52px; flex: 0 0 52px; align-items: center; justify-content: center; border: 0; border-radius: 50%; background: #e9ebef; color: #71717a; }
  .ichi-flow-heading { min-width: 0; }
  .ichi-flow-heading h2 { color: #111; font-size: 22px; font-weight: 900; line-height: 1.1; }
  .ichi-flow-heading p { margin-top: 4px; color: #71717a; font-size: 10px; font-weight: 700; }
  .ichi-flow-scroll { min-height: 0; padding: var(--ichi-space-4) 2px calc(var(--ichi-action-height) + var(--ichi-space-6)); flex: 1 1 auto; overflow-y: auto; overscroll-behavior: contain; }
  .ichi-prize-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--ichi-space-3); }
  .ichi-prize-form-card { display: flex; min-width: 0; padding: 14px; flex-direction: column; gap: 10px; }
  .ichi-prize-form-card > strong { color: #111; font-size: 20px; font-weight: 900; }
  .ichi-prize-field-labels, .ichi-prize-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .ichi-prize-field-labels span { color: #a1a1aa; font-size: 9px; font-weight: 800; line-height: 1.3; text-align: center; }
  .ichi-prize-fields input { width: 100%; min-width: 0; padding: 8px 4px; border: 0; border-radius: 12px; background: #f0f2f5; color: #111; font-size: 13px; font-weight: 900; text-align: center; outline: 0; }
  .ichi-prize-fields input:last-child { background: #111; color: #fff; }
  .ichi-fixed-primary { position: fixed !important; bottom: calc(var(--ichi-bottom-nav-offset) + var(--ichi-bottom-nav-height) + 12px) !important; left: 50% !important; width: min(var(--ichi-action-max-width), calc(100vw - 96px)) !important; margin: 0 !important; transform: translateX(-50%) !important; z-index: 70 !important; }
  #draw-grand-grid, #draw-normal-list { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 12px !important; }
  .ichi-prize-ticket { min-width: 0 !important; margin-bottom: 0 !important; }
  .ichi-prize-ticket > div:first-child > div:first-child { height: 22px !important; padding: 0 8px !important; }
  .ichi-prize-ticket > div:first-child > div:nth-child(2) { height: 52px !important; }
  .ichi-prize-ticket > div:first-child > div:nth-child(3) { min-height: 38px !important; padding: 6px 8px !important; }
  .ichi-prize-ticket > [onpointerdown] { top: 22px !important; height: 52px !important; transform-style: preserve-3d; perspective: 820px; overflow: visible; }
  .ichi-prize-ticket > [onpointerdown] > div { padding-right: 12px !important; padding-left: 8px !important; }
  .ichi-prize-ticket > [onpointerdown] span.text-\[40px\] { font-size: 28px !important; }
  .ichi-prize-ticket .w-5.h-5 { width: 12px !important; height: 12px !important; }
  .ichi-prize-ticket--grand > [onpointerdown] > div { background: #0a0a0a !important; }
  .ichi-prize-ticket--grand > [onpointerdown] span.text-\[40px\] { color: #fff !important; background: none !important; -webkit-text-fill-color: currentColor !important; filter: none !important; animation: none !important; }
  .ichi-peel-surface, .ichi-peel-flap { will-change: transform, filter, opacity, -webkit-mask-image, mask-image; }
  .ichi-peel-surface { -webkit-mask-image: linear-gradient(90deg, transparent 0 var(--ichi-peel-edge, 0%), #000 var(--ichi-peel-edge, 0%) 100%); mask-image: linear-gradient(90deg, transparent 0 var(--ichi-peel-edge, 0%), #000 var(--ichi-peel-edge, 0%) 100%); }
  .ichi-peel-flap { position: absolute !important; inset: 0; z-index: 2; -webkit-mask-image: linear-gradient(90deg, #000 0 var(--ichi-peel-edge, 0%), transparent var(--ichi-peel-edge, 0%) 100%); mask-image: linear-gradient(90deg, #000 0 var(--ichi-peel-edge, 0%), transparent var(--ichi-peel-edge, 0%) 100%); transform-origin: var(--ichi-peel-edge, 0%) 50%; transform-style: preserve-3d; backface-visibility: visible; pointer-events: none; }
  #modal-share-2 { z-index: 300 !important; padding: 0 !important; background: #161719 !important; }
  #modal-share-2 > div:first-child { display: none !important; }
  #modal-share-2 > div:nth-child(2) { padding: var(--ichi-top-safe-area) var(--ichi-page-gutter) calc(var(--ichi-bottom-nav-clearance) + 12px) !important; }
  #modal-share-2 { background: #f0f2f5 !important; color: #111 !important; overflow: hidden !important; }
  #modal-share-2 > div:first-child { display: none !important; }
  #modal-share-2 > div:nth-child(2) { display: flex !important; min-height: 0 !important; padding: var(--ichi-top-safe-area) var(--ichi-page-gutter) calc(var(--ichi-bottom-nav-clearance) + 20px) !important; flex-direction: column !important; overflow-y: auto !important; }
  #modal-share-2 .ichi-share-capture-back { position: absolute; top: var(--ichi-top-safe-area); left: var(--ichi-page-gutter); z-index: 2; }
  #modal-share-2 .ichi-share-camera-frame { order: 1; flex: 0 0 auto; width: 100%; height: min(48dvh, 340px); min-height: 220px; margin-top: 64px !important; margin-bottom: var(--ichi-space-4) !important; aspect-ratio: auto !important; border-color: #b8bbc2 !important; background: #fff !important; }
  #modal-share-2 .ichi-share-capture-action-panel { order: 2; display: flex; margin: 0 0 var(--ichi-space-4); padding: 0; flex-direction: column; gap: 10px; }
  #modal-share-2 .ichi-share-capture-action-row { display: flex; width: 100%; align-items: center; justify-content: center; gap: 12px; }
  #modal-share-2 .ichi-share-capture-consent { order: 4; margin: 0 0 var(--ichi-space-4); }
  #modal-share-2 .ichi-share-meta { order: 3; display: grid; grid-template-columns: minmax(0, 1fr) 52px; gap: 10px; margin: 0 0 var(--ichi-space-3) !important; }
  #modal-share-2 .ichi-share-meta label { grid-column: 1 / -1; color: #71717a !important; }
  #modal-share-2 .ichi-share-meta input { min-width: 0; }
  #modal-share-2 .ichi-share-confirm, #modal-share-2 .ichi-share-retake { position: relative; display: flex; width: 52px; height: 52px; flex: 0 0 52px; align-items: center; justify-content: center; border: 0; border-radius: 50%; transition: background .2s ease, color .2s ease, box-shadow .25s ease, transform .2s ease; }
  #modal-share-2 .ichi-share-retake, #modal-share-2 .ichi-share-confirm:disabled { background: #e9ebef !important; color: #71717a !important; box-shadow: none !important; }
  #modal-share-2 .ichi-share-confirm:disabled { cursor: not-allowed; opacity: 1; }
  #modal-share-2 .ichi-share-confirm:not(:disabled) { background: #111 !important; color: #fff !important; box-shadow: 0 0 0 3px rgba(224,20,160,.2), -5px 0 18px rgba(224,20,160,.68), 6px 0 20px rgba(85,40,194,.72) !important; cursor: pointer; }
  #modal-share-2 .ichi-share-confirm:not(:disabled):active { transform: scale(.94); }
  #modal-share-2 .ichi-share-capture-action { width: clamp(148px, 42vw, 176px); flex: 0 0 clamp(148px, 42vw, 176px); margin: 0; }
  #modal-share-2 .ichi-share-capture-action > .btn-glow { display: none !important; }
  #modal-share-2 .ichi-share-capture-action > .action-button { width: 100%; border: 0 !important; background: #e9ebef !important; color: #71717a !important; box-shadow: none !important; }
</style>`;

const bridgeScript = String.raw`${bridgeStyle}<script>
(() => {
  const storageKey = "ichi:v1-29-source-shell:v1";
  const localDraftsKey = "ichi:v1-29-local-draw-drafts:v1";
  const recognitionResumeKey = "ichi:v1-29-recognition-resume:v1";
  const uploadedRecordPreview = Object.freeze({
    recordId: "v1-29-uploaded-preview",
    title: "秋叶原 0805",
    verificationStatus: "verified",
    uploadStatus: "uploaded",
    updatedLabel: "V2 结构预览",
    meta: "已完成核对并上传的版面记录",
    likeCount: 0,
    preview: true
  });
  const unuploadedRecordPreview = Object.freeze({
    recordId: "v1-29-local-preview",
    title: "大阪店现场",
    verificationStatus: "unverified",
    uploadStatus: "not-uploaded",
    updatedLabel: "V1 状态预览",
    meta: "尚未提交核对的本机抽赏记录",
    likeCount: 0,
    preview: true
  });
  const recognitionViews = new Set(["start", "draft", "draw", "cannot-build-pool"]);
  const recognitionTabViews = new Set([...recognitionViews, "camera-capture", "recognizing"]);
  const modalLayerIds = ["modal-probability", "modal-history", "modal-share-1", "modal-share-2", "overlay-submitted"];
  const scrollPositions = new Map();
  let lastView = location.hash.slice(1).split("?")[0] || "start";
  let lastObservedScrollTop = 0;
  const currentView = () => location.hash.slice(1).split("?")[0] || "start";
  const rememberRecognitionView = (view) => {
    if (view === "camera-capture" || view === "recognizing") {
      try { sessionStorage.setItem(recognitionResumeKey, "start"); } catch {}
      return;
    }
    if (!recognitionViews.has(view)) return;
    try { sessionStorage.setItem(recognitionResumeKey, view); } catch {}
  };
  const getRecognitionResumeView = () => {
    try {
      const saved = sessionStorage.getItem(recognitionResumeKey);
      if (saved === "target") return "draw";
      return saved && recognitionViews.has(saved) ? saved : "start";
    } catch { return "start"; }
  };
  const sendRoute = () => {
    const view = currentView();
    rememberRecognitionView(view);
    document.body.dataset.ichiPage = view;
    window.parent.postMessage({ type: "ichi:v1-29-route", view }, location.origin);
  };
  const mainScroller = () => document.scrollingElement || document.querySelector("main");
  const preservePageScroll = (nextView) => {
    const scroller = mainScroller();
    if (!scroller || nextView === lastView) return;
    scrollPositions.set(lastView, lastObservedScrollTop);
    const nextTop = scrollPositions.get(nextView) || 0;
    lastView = nextView;
    lastObservedScrollTop = nextTop;
    requestAnimationFrame(() => { scroller.scrollTop = nextTop; });
  };
  window.addEventListener("scroll", () => {
    if (currentView() !== lastView) return;
    const scroller = mainScroller();
    if (!scroller) return;
    lastObservedScrollTop = scroller.scrollTop;
    scrollPositions.set(lastView, lastObservedScrollTop);
  }, { passive: true });
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    if (!event.target.closest("#mobile-bottom-nav a")) return;
    const scroller = mainScroller();
    if (!scroller) return;
    lastObservedScrollTop = scroller.scrollTop;
    scrollPositions.set(currentView(), lastObservedScrollTop);
  }, true);
  const modalLayers = () => modalLayerIds.map((id) => document.getElementById(id)).filter(Boolean);
  const syncModalState = () => {
    const open = modalLayers().some((layer) => !layer.classList.contains("hidden"));
    document.body.dataset.ichiModalOpen = open ? "true" : "false";
  };
  const closeTransientLayers = () => {
    modalLayers().forEach((layer) => layer.classList.add("hidden"));
    syncModalState();
  };
  const connectModalLifecycle = () => {
    modalLayers().forEach((layer) => {
      if (layer.dataset.ichiModalObserved) return;
      layer.dataset.ichiModalObserved = "true";
      new MutationObserver(syncModalState).observe(layer, { attributes: true, attributeFilter: ["class"] });
    });
    syncModalState();
  };
  const cloneValue = (value) => JSON.parse(JSON.stringify(value));
  const createBoardId = () => {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
    return "board-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  };
  const ensureBoardId = () => {
    if (!window.__ichiBoardId) window.__ichiBoardId = createBoardId();
    return window.__ichiBoardId;
  };
  const currentSnapshot = () => {
    if (!window.drawEngine) return null;
    return {
      boardId: ensureBoardId(),
      prizeData: cloneValue(window.drawEngine.prizeData),
      history: cloneValue(window.drawEngine.history),
      cost: Number(window.drawEngine.cost) || 0
    };
  };
  const saveState = () => {
    const snapshot = currentSnapshot();
    if (!snapshot) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(snapshot));
    } catch {}
  };
  const restoreState = () => {
    if (!window.drawEngine) return;
    try {
      const value = JSON.parse(sessionStorage.getItem(storageKey) || "null");
      if (!value || !Array.isArray(value.prizeData) || !Array.isArray(value.history)) return;
      window.__ichiBoardId = typeof value.boardId === "string" && value.boardId ? value.boardId : createBoardId();
      window.drawEngine.prizeData = value.prizeData;
      window.drawEngine.history = value.history;
      window.drawEngine.cost = Number(value.cost) || 0;
      window.drawEngine.render();
    } catch {}
  };
  const readLocalDrafts = () => {
    try {
      const value = JSON.parse(localStorage.getItem(localDraftsKey) || "[]");
      if (!Array.isArray(value)) return [];
      return value.filter((draft) =>
        draft &&
        typeof draft.boardId === "string" &&
        Array.isArray(draft.prizeData) &&
        Array.isArray(draft.history)
      );
    } catch { return []; }
  };
  const writeLocalDrafts = (drafts) => {
    try { localStorage.setItem(localDraftsKey, JSON.stringify(drafts)); return true; }
    catch { return false; }
  };
  const removeLocalDraft = (boardId) => {
    const current = readLocalDrafts();
    const next = current.filter((draft) => draft.boardId !== boardId);
    if (next.length === current.length || !writeLocalDrafts(next)) return false;
    try {
      const active = JSON.parse(sessionStorage.getItem(storageKey) || "null");
      if (active && active.boardId === boardId) {
        sessionStorage.removeItem(storageKey);
        sessionStorage.setItem(recognitionResumeKey, "start");
      }
    } catch {}
    renderStartDrafts();
    connectRecordPages();
    return true;
  };
  const makeSwipeDeletable = (content, boardId, label) => {
    const row = document.createElement("div");
    row.className = "ichi-swipe-row";
    row.dataset.boardId = boardId;
    row.dataset.swipeOpen = "false";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "ichi-swipe-delete";
    remove.setAttribute("aria-label", label);
    remove.innerHTML = '<i class="ph-bold ph-trash"></i>';
    content.classList.add("ichi-swipe-content");
    row.append(remove, content);
    let startX = 0;
    let startY = 0;
    let startReveal = 0;
    let reveal = 0;
    let moved = false;
    let suppressClick = false;
    const settle = (value) => {
      reveal = value;
      content.style.transform = "translate3d(" + (-value) + "px, 0, 0)";
      row.dataset.swipeOpen = value > 0 ? "true" : "false";
    };
    content.addEventListener("pointerdown", (event) => {
      document.querySelectorAll(".ichi-swipe-row[data-swipe-open='true']").forEach((other) => {
        if (other === row) return;
        const otherContent = other.querySelector(".ichi-swipe-content");
        other.dataset.swipeOpen = "false";
        if (otherContent) otherContent.style.transform = "translate3d(0, 0, 0)";
      });
      startX = event.clientX;
      startY = event.clientY;
      startReveal = row.dataset.swipeOpen === "true" ? 72 : 0;
      reveal = startReveal;
      moved = false;
      suppressClick = false;
      content.setPointerCapture && content.setPointerCapture(event.pointerId);
      content.style.transition = "none";
    });
    content.addEventListener("pointermove", (event) => {
      if (!content.hasPointerCapture || !content.hasPointerCapture(event.pointerId)) return;
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      if (Math.abs(deltaX) <= Math.abs(deltaY) || Math.abs(deltaX) < 4) return;
      event.preventDefault();
      moved = true;
      reveal = Math.max(0, Math.min(72, startReveal - deltaX));
      content.style.transform = "translate3d(" + (-reveal) + "px, 0, 0)";
    });
    const finish = (event) => {
      if (content.hasPointerCapture && content.hasPointerCapture(event.pointerId)) {
        content.releasePointerCapture(event.pointerId);
      }
      content.style.transition = "transform .24s cubic-bezier(.2,.75,.2,1)";
      suppressClick = moved;
      settle(reveal >= 36 ? 72 : 0);
    };
    content.addEventListener("pointerup", finish);
    content.addEventListener("pointercancel", finish);
    content.addEventListener("click", (event) => {
      if (!suppressClick && row.dataset.swipeOpen !== "true") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!suppressClick) settle(0);
      suppressClick = false;
    }, true);
    remove.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      removeLocalDraft(boardId);
    });
    return row;
  };
  const resumeLocalDraft = (draft) => {
    if (!window.drawEngine || !draft) return;
    window.__ichiBoardId = draft.boardId;
    window.drawEngine.prizeData = cloneValue(draft.prizeData);
    window.drawEngine.history = cloneValue(draft.history);
    window.drawEngine.cost = Number(draft.cost) || 0;
    window.drawEngine.render();
    saveState();
    updateBoardOutlook();
    location.hash = "#draw";
  };
  const collectLocalRecords = () => {
    const drafts = readLocalDrafts().map((draft) => ({
      recordId: draft.boardId,
      title: "抽赏草稿",
      verificationStatus: "unverified",
      uploadStatus: "not-uploaded",
      updatedLabel: new Date(Number(draft.savedAt) || Date.now()).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      meta: "已抽 " + draft.history.length + " 抽 · 累计 ¥" + Number(draft.cost || 0).toLocaleString(),
      likeCount: 0,
      draft
    }));
    const pendingRecords = drafts.length ? drafts : [unuploadedRecordPreview];
    return [...pendingRecords, uploadedRecordPreview];
  };
  const recordStatusText = (record) =>
    (record.verificationStatus === "verified" ? "已核对" : "未核对") +
    " / " +
    (record.uploadStatus === "uploaded" ? "已上传" : "未上传");
  const createRecordCard = (record, contributionOnly) => {
    const card = document.createElement("article");
    card.className = "ichi-record-card light-capsule";
    card.dataset.recordId = record.recordId;
    card.dataset.verificationStatus = record.verificationStatus;
    card.dataset.uploadStatus = record.uploadStatus;
    const head = document.createElement("div");
    head.className = "ichi-record-card-head";
    const title = document.createElement("p");
    title.className = "ichi-record-card-title";
    title.textContent = record.title;
    const time = document.createElement("span");
    time.className = "ichi-record-card-time";
    time.textContent = record.updatedLabel;
    head.append(title, time);
    const status = document.createElement("span");
    status.className = "ichi-record-status";
    status.textContent = recordStatusText(record);
    const meta = document.createElement("p");
    meta.className = "ichi-record-card-meta";
    meta.textContent = record.meta;
    card.append(head, status, meta);
    const actions = document.createElement("div");
    actions.className = "ichi-record-card-actions";
    if (record.draft && !contributionOnly) {
      const resume = document.createElement("button");
      resume.type = "button";
      resume.className = "ichi-record-resume";
      resume.textContent = "继续抽赏";
      resume.addEventListener("click", () => resumeLocalDraft(record.draft));
      actions.append(resume);
    } else {
      const spacer = document.createElement("span");
      spacer.setAttribute("aria-hidden", "true");
      actions.append(spacer);
    }
    if (record.uploadStatus === "uploaded") {
      const likes = document.createElement("span");
      likes.className = "ichi-contribution-likes";
      likes.setAttribute("aria-label", "点赞数 " + record.likeCount);
      likes.innerHTML = '<i class="ph-fill ph-heart"></i><span>' + record.likeCount + '</span>';
      actions.append(likes);
    }
    card.append(actions);
    if (contributionOnly) {
      const note = document.createElement("p");
      note.className = "ichi-contribution-note";
      note.textContent = "V2 接入后显示其他用户点赞";
      card.append(note);
    }
    const canDelete =
      Boolean(record.draft) &&
      record.verificationStatus === "unverified" &&
      record.uploadStatus === "not-uploaded";
    return canDelete
      ? makeSwipeDeletable(card, record.recordId, "删除这次抽赏草稿")
      : card;
  };
  const connectRecordPages = () => {
    const localPage = document.getElementById("page-local-records");
    const contributionPage = document.getElementById("page-contributions");
    if (localPage && !localPage.dataset.ichiRecordShellReady) {
      localPage.dataset.ichiRecordShellReady = "true";
      localPage.innerHTML = '<h2 class="text-3xl font-black text-[#111] mb-2 tracking-tight">本地记录</h2><p class="ichi-record-page-copy">这里会保留全部本机记录，并分别标明是否已经核对、是否已经上传。</p><div id="ichi-local-record-summary" class="ichi-record-summary ichi-my-subpage-stats"></div><div id="ichi-local-record-list" class="ichi-record-list"></div>';
    }
    if (contributionPage && !contributionPage.dataset.ichiRecordShellReady) {
      contributionPage.dataset.ichiRecordShellReady = "true";
      contributionPage.innerHTML = '<h2 class="text-3xl font-black text-[#111] mb-2 tracking-tight">我的贡献</h2><p class="ichi-record-page-copy">这里只显示已经上传的记录。点赞功能将在 V2 接入真实账号与后台后启用。</p><div id="ichi-contribution-summary" class="ichi-record-summary ichi-my-subpage-stats"></div><div id="ichi-contribution-list" class="ichi-record-list"></div>';
    }
    const records = collectLocalRecords();
    const localSummary = document.getElementById("ichi-local-record-summary");
    if (localSummary) {
      const uploadedCount = records.filter((record) => record.uploadStatus === "uploaded").length;
      localSummary.innerHTML = '<span>全部有 ' + records.length + ' 个</span><span>现在已上传有 ' + uploadedCount + ' 个</span><span>未上传有 ' + (records.length - uploadedCount) + ' 个</span>';
    }
    const localList = document.getElementById("ichi-local-record-list");
    if (localList) localList.replaceChildren(...records.map((record) => createRecordCard(record, false)));
    const contributions = records.filter((record) => record.uploadStatus === "uploaded");
    const contributionSummary = document.getElementById("ichi-contribution-summary");
    if (contributionSummary) contributionSummary.innerHTML = '<span>已上传有 ' + contributions.length + ' 个</span><span>点赞总数 0</span>';
    const contributionList = document.getElementById("ichi-contribution-list");
    if (contributionList) {
      contributionList.replaceChildren(...contributions.map((record) => createRecordCard(record, true)));
      if (!contributions.length) {
        const empty = document.createElement("div");
        empty.className = "ichi-record-empty light-capsule";
        empty.textContent = "还没有已上传的贡献";
        contributionList.append(empty);
      }
    }
  };
  const renderStartDrafts = () => {
    const page = document.getElementById("page-start");
    if (!page) return;
    Array.from(page.children).forEach((child) => {
      if (child.textContent && child.textContent.includes("只保存在这台设备")) child.remove();
    });
    let region = document.getElementById("ichi-start-drafts");
    if (!region) {
      region = document.createElement("section");
      region.id = "ichi-start-drafts";
      region.className = "ichi-start-drafts";
      region.innerHTML = '<div class="ichi-start-drafts-header"><span>抽赏草稿</span><span id="ichi-start-draft-count"></span></div><div id="ichi-start-draft-list" class="ichi-start-draft-list"></div>';
      page.append(region);
    }
    const drafts = readLocalDrafts();
    region.hidden = drafts.length === 0;
    const count = document.getElementById("ichi-start-draft-count");
    const list = document.getElementById("ichi-start-draft-list");
    if (count) count.textContent = drafts.length ? drafts.length + " 份" : "";
    if (!list) return;
    list.replaceChildren();
    drafts.forEach((draft) => {
      const remaining = draft.prizeData.reduce((sum, prize) =>
        sum + (Array.isArray(prize.slots) ? prize.slots.filter((slot) => !slot).length : 0), 0);
      const total = draft.prizeData.reduce((sum, prize) => sum + (Number(prize.total) || 0), 0);
      const savedAt = Number(draft.savedAt) || Date.now();
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ichi-start-draft-card light-capsule";
      button.setAttribute("aria-label", "继续抽赏草稿");
      const copy = document.createElement("span");
      copy.className = "ichi-start-draft-copy";
      const title = document.createElement("span");
      title.className = "ichi-start-draft-title";
      title.textContent = "上次抽赏草稿";
      const meta = document.createElement("span");
      meta.className = "ichi-start-draft-meta";
      meta.textContent = "余 " + remaining + " / " + total + " · 已抽 " + draft.history.length + " · 累计 ¥" + Number(draft.cost || 0).toLocaleString() + " · " + new Date(savedAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
      copy.append(title, meta);
      const resume = document.createElement("span");
      resume.className = "ichi-start-draft-resume";
      resume.innerHTML = '继续抽赏 <i class="ph-bold ph-caret-right"></i>';
      button.append(copy, resume);
      button.addEventListener("click", () => resumeLocalDraft(draft));
      list.append(
        makeSwipeDeletable(button, draft.boardId, "删除这次抽赏草稿"),
      );
    });
  };
  const saveLocalDraftAndExit = () => {
    const snapshot = currentSnapshot();
    if (!snapshot) return;
    const draft = { ...snapshot, savedAt: Date.now() };
    const next = [draft, ...readLocalDrafts().filter((item) => item.boardId !== draft.boardId)];
    if (!writeLocalDrafts(next)) return;
    saveState();
    const modal = document.getElementById("modal-share-1");
    modal && modal.classList.add("hidden");
    try { sessionStorage.setItem(recognitionResumeKey, "start"); } catch {}
    renderStartDrafts();
    location.hash = "#start";
  };
  const selectedTargetTiers = () => {
    const selected = Array.isArray(window.__ichiSelectedTargetTiers)
      ? window.__ichiSelectedTargetTiers.filter(Boolean)
      : [];
    return selected;
  };
  const updateBoardOutlook = async () => {
    if (!window.drawEngine) return;
    const container = document.getElementById("ichi-outlook-events");
    const windowLabel = document.getElementById("ichi-outlook-window");
    const cost = document.getElementById("ichi-outlook-cost");
    if (!container || !windowLabel || !cost) return;
    try {
      const response = await fetch("/api/v1-29-source", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tiers: window.drawEngine.prizeData.map((prize) => ({
            tier: prize.id,
            total: prize.total,
            covered: prize.slots.filter(Boolean).length
          })),
          targetTiers: selectedTargetTiers(),
          unitPriceMinor: window.drawEngine.TICKET_PRICE
        })
      });
      const result = await response.json();
      if (!response.ok || result.status !== "available") {
        windowLabel.textContent = "当前版面";
        container.innerHTML = '<div class="ichi-outlook-event"><span>' + (result.reason || "当前版面暂时无法计算。") + '</span></div>';
        cost.textContent = "";
        return;
      }
      windowLabel.textContent = "观察窗口（接下来 " + result.windowDraws + " 抽以内）";
      container.innerHTML = result.events.map((event) =>
        '<div class="ichi-outlook-event"><span>' + event.label + '</span><strong>' + event.percentage + '%</strong></div>'
      ).join("");
      cost.innerHTML = '<span>' + result.windowDraws + ' 抽累计成本</span><strong>¥' + Number(result.cumulativeCost).toLocaleString() + '</strong>';
    } catch {
      windowLabel.textContent = "当前版面";
      container.innerHTML = '<div class="ichi-outlook-event"><span>当前版面暂时无法计算。</span></div>';
      cost.textContent = "";
    }
  };
  const updateToast = () => {
    const record = window.drawEngine && window.drawEngine.history.at(-1);
    if (!record) return;
    const all = window.drawEngine.history;
    const prize = window.drawEngine.prizeData[record.pIndex];
    const total = Number(prize && prize.total);
    const tier = String((prize && prize.id) || "").toUpperCase();
    const presentation =
      Number.isInteger(total) && total > 0
        ? /^[A-F]$/.test(tier) && total <= 5
          ? "large"
          : /^[A-F]$/.test(tier) && total <= 9
            ? "medium"
            : "small"
        : "medium";
    const mascot = document.getElementById("toast-mascot");
    if (mascot) mascot.dataset.presentation = presentation;
    const large = presentation === "large";
    const medium = presentation === "medium";
    const small = presentation === "small";
    const targets = selectedTargetTiers();
    const isTarget = targets.includes(tier);
    let message = "余票已更新";
    if (isTarget) message = all.length === 1 ? "一发入魂！" : "中！！！";
    else if (large) message = "意外之喜！";
    else if (all.length >= 2) {
      const previous = window.drawEngine.prizeData[all[all.length - 2].pIndex];
      const previousTier = String((previous && previous.id) || "").toUpperCase();
      const previousLarge = previous && /^[A-F]$/.test(previousTier) && Number(previous.total) <= 5;
      if (previousLarge && large) message = "连着出高赏";
    }
    if (message === "余票已更新" && small) {
      let count = 0;
      for (let index = all.length - 1; index >= 0; index -= 1) {
        const current = window.drawEngine.prizeData[all[index].pIndex];
        if (!current || current.total < 10) break;
        count += 1;
      }
      message = count === 1 ? "经典又时尚" : count === 2 ? "又是经典时尚" : count === 3 ? "又又又是经典时尚" : "还是经典时尚";
    }
    if (message === "余票已更新" && medium && all.length >= 3) {
      const sameTier = all.slice(-3).every((item) => window.drawEngine.prizeData[item.pIndex] && window.drawEngine.prizeData[item.pIndex].id === tier);
      if (sameTier) message = "又是这个";
    }
    if (message === "余票已更新" && all.length >= 5) {
      const noTargetInFive = all.slice(-5).every((item) => {
        const itemPrize = window.drawEngine.prizeData[item.pIndex];
        return !itemPrize || !targets.includes(String(itemPrize.id).toUpperCase());
      });
      if (noTargetInFive) message = "要不要收手？";
    }
    if (message === "余票已更新") {
      const appearedBefore = all.slice(0, -1).some((item) => {
        const itemPrize = window.drawEngine.prizeData[item.pIndex];
        return itemPrize && itemPrize.id === tier;
      });
      if (!appearedBefore) message = "新等级登场！";
    }
    const target = document.querySelector("#toast-message .flex-grow .text-zinc-500");
    if (target) target.textContent = message + " · 累计 ¥" + Number(record.cost).toLocaleString();
  };
  const decoratePrizeTickets = () => {
    const decorate = (containerId, grand) => {
      const container = document.getElementById(containerId);
      if (!container) return;
      Array.from(container.children).forEach((ticket) => {
        ticket.classList.add("ichi-prize-ticket");
        ticket.classList.toggle("ichi-prize-ticket--grand", grand);
        const cover = ticket.querySelector("[onpointerdown]");
        if (!cover) return;
        cover.classList.add("ichi-peel-cover");
        const surface = cover.firstElementChild;
        if (!surface) return;
        surface.classList.add("ichi-peel-surface");
        if (!cover.querySelector(":scope > .ichi-peel-flap")) {
          const flap = surface.cloneNode(true);
          flap.classList.remove("ichi-peel-surface");
          flap.classList.add("ichi-peel-flap");
          flap.style.removeProperty("transform-origin");
          flap.style.removeProperty("transition");
          flap.setAttribute("aria-hidden", "true");
          cover.appendChild(flap);
        }
      });
    };
    decorate("draw-grand-grid", true);
    decorate("draw-normal-list", false);
  };
  const connectPeelInteraction = () => {
    if (window.__ichiPeelReady) return;
    window.__ichiPeelReady = true;
    window.startSwipe = (event, element) => {
      if (window.isAnimating) return;
      element.setPointerCapture && element.setPointerCapture(event.pointerId);
      element.startX = event.clientX;
      element.isDragging = true;
      element.style.transition = "none";
      const surface = element.querySelector(":scope > .ichi-peel-surface");
      const flap = element.querySelector(":scope > .ichi-peel-flap");
      surface && (surface.style.transition = "none");
      if (flap) {
        flap.style.transition = "none";
        flap.style.transform = "none";
        flap.style.opacity = "1";
        flap.style.filter = "none";
      }
      element.style.setProperty("--ichi-peel-edge", "0%");
      element.style.setProperty("--ichi-peel-opacity", "0");
    };
    window.moveSwipe = (event, element) => {
      if (!element.isDragging) return;
      const delta = Math.max(0, event.clientX - element.startX);
      const progress = Math.min(delta / Math.max(element.offsetWidth * 0.72, 1), 1);
      const edge = progress * 78;
      const flap = element.querySelector(":scope > .ichi-peel-flap");
      element.style.setProperty("--ichi-peel-edge", edge + "%");
      element.style.setProperty("--ichi-peel-opacity", String(Math.min(progress * 1.8, 1)));
      if (flap) {
        flap.style.transform = "translate3d(" + (delta * .08) + "px, 0, " + (24 + delta * .74) + "px) rotateY(" + (progress * 78) + "deg) rotateZ(" + (-progress * 3) + "deg) scale(" + (1 + progress * .06) + ")";
        flap.style.filter = "drop-shadow(" + (-8 - progress * 22) + "px 8px " + (10 + progress * 18) + "px rgba(0,0,0,.4))";
      }
    };
    window.endSwipe = (event, element, prizeIndex) => {
      if (!element.isDragging) return;
      element.isDragging = false;
      element.releasePointerCapture && element.releasePointerCapture(event.pointerId);
      const delta = Math.max(0, event.clientX - element.startX);
      const threshold = Math.max(46, element.offsetWidth * .36);
      const surface = element.querySelector(":scope > .ichi-peel-surface");
      const flap = element.querySelector(":scope > .ichi-peel-flap");
      if (delta >= threshold) {
        window.isAnimating = true;
        element.style.setProperty("--ichi-peel-edge", "100%");
        element.style.setProperty("--ichi-peel-opacity", "1");
        surface && (surface.style.transition = "-webkit-mask-image .18s ease-out, mask-image .18s ease-out");
        if (flap) {
          flap.style.transition = "transform .54s cubic-bezier(.18,.72,.16,1), opacity .4s ease-in .12s, filter .42s ease";
          flap.style.transformOrigin = "right center";
          flap.style.transform = "translate3d(96px, -34px, 360px) rotateY(122deg) rotateZ(-16deg) scale(1.2)";
          flap.style.filter = "drop-shadow(-38px 16px 48px rgba(0,0,0,.48))";
          flap.style.opacity = "0";
        }
        const slotIndex = window.drawEngine.prizeData[prizeIndex].slots.findIndex((drawn) => !drawn);
        setTimeout(() => window.handleDraw(prizeIndex, slotIndex), 430);
      } else {
        element.style.transition = "--ichi-peel-edge .34s ease";
        element.style.setProperty("--ichi-peel-edge", "0%");
        element.style.setProperty("--ichi-peel-opacity", "0");
        if (flap) {
          flap.style.transition = "transform .38s cubic-bezier(.34,1.56,.64,1), opacity .3s, filter .3s";
          flap.style.transformOrigin = "var(--ichi-peel-edge, 0%) 50%";
          flap.style.transform = "none";
          flap.style.opacity = "1";
          flap.style.filter = "none";
        }
      }
    };
  };
  const connect = () => {
    if (!window.drawEngine || !window.handleDraw || window.__ichiBridgeReady) return;
    window.__ichiBridgeReady = true;
    window.__ichiDefaultPrizeData = cloneValue(window.drawEngine.prizeData);
    const nativeDraw = window.handleDraw;
    const nativeUndo = window.undoLastDraw;
    const nativeRender = window.drawEngine.render.bind(window.drawEngine);
    window.drawEngine.render = () => { nativeRender(); decoratePrizeTickets(); };
    window.handleDraw = (prizeIndex, slotIndex) => { nativeDraw(prizeIndex, slotIndex); updateToast(); saveState(); updateBoardOutlook(); };
    window.undoLastDraw = () => { nativeUndo(); saveState(); updateBoardOutlook(); };
    restoreState();
    ensureBoardId();
    decoratePrizeTickets();
    connectPeelInteraction();
    updateBoardOutlook();
  };
  const connectDrawWorkspace = () => {
    const page = document.getElementById("page-draw");
    if (!page || page.dataset.ichiDrawWorkspaceReady) return;
    page.dataset.ichiDrawWorkspaceReady = "true";
    const status = page.querySelector(":scope > .light-capsule");
    const fixed = page.querySelectorAll(":scope > .fixed");
    const quickActions = fixed[0];
    const stopWrap = fixed[1];
    status && status.classList.add("ichi-draw-status");
    quickActions && quickActions.classList.add("ichi-draw-quick-actions");
    stopWrap && stopWrap.classList.add("ichi-draw-stop-wrap");
    [
      ["top", "顶部固定栏渐隐"],
      ["bottom", "底部导航栏渐隐"],
    ].forEach(([edge, label]) => {
      const className = "ichi-draw-edge-fade--" + edge;
      if (page.querySelector("." + className)) return;
      const fade = document.createElement("div");
      fade.className = "ichi-draw-edge-fade " + className;
      fade.setAttribute("aria-hidden", "true");
      fade.setAttribute("data-edge-label", label);
      page.append(fade);
    });

    const probabilityModal = document.getElementById("modal-probability");
    const historyModal = document.getElementById("modal-history");
    [probabilityModal, historyModal].forEach((modal) => {
      if (!modal || !modal.firstElementChild) return;
      modal.classList.add("ichi-workspace-modal");
      modal.firstElementChild.classList.add("ichi-workspace-modal-card");
    });
    const probabilityCard = probabilityModal && probabilityModal.firstElementChild;
    const originalOutlook = probabilityCard && probabilityCard.querySelector(".light-capsule");
    if (originalOutlook) {
      originalOutlook.classList.add("ichi-workspace-modal-scroll");
      originalOutlook.innerHTML = '<p id="ichi-outlook-window" class="text-[11px] text-zinc-500 font-bold mb-3 uppercase tracking-widest">观察窗口</p><div id="ichi-outlook-events"></div><div id="ichi-outlook-cost" class="ichi-outlook-cost"></div>';
    }
    const historyList = document.getElementById("history-list");
    historyList && historyList.classList.add("ichi-workspace-modal-scroll");

    const buttons = quickActions && quickActions.querySelectorAll("button");
    if (buttons && buttons.length >= 3) {
      buttons[0].setAttribute("aria-label", "局面可能性");
      buttons[1].setAttribute("aria-label", "撤销");
      buttons[2].setAttribute("aria-label", "抽取记录");
      buttons[0].onclick = () => {
        updateBoardOutlook();
        probabilityModal && probabilityModal.classList.remove("hidden");
      };
      buttons[2].onclick = () => historyModal && historyModal.classList.remove("hidden");
    }
    updateBoardOutlook();

    const stopButton = stopWrap && stopWrap.querySelector("button");
    if (!stopButton) return;
    const content = stopButton.innerHTML;
    stopButton.classList.add("ichi-hold-button");
    stopButton.setAttribute("aria-label", "长按决定收手");
    stopButton.setAttribute("aria-valuemin", "0");
    stopButton.setAttribute("aria-valuemax", "100");
    stopButton.setAttribute("aria-valuenow", "0");
    stopButton.innerHTML = '<span class="ichi-hold-fill"></span><span class="ichi-hold-content ichi-hold-content--base">' + content + '</span><span class="ichi-hold-content ichi-hold-content--active">' + content + '</span>';
    stopButton.onclick = null;
    let startedAt = 0;
    let frame = 0;
    let holding = false;
    const holdDuration = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--ichi-hold-duration",
      ),
    ) || 1000;
    const setProgress = (progress) => {
      const value = Math.max(0, Math.min(1, progress));
      stopButton.style.setProperty("--ichi-hold-progress", (value * 100) + "%");
      stopButton.setAttribute("aria-valuenow", String(Math.round(value * 100)));
    };
    const reset = () => {
      holding = false;
      startedAt = 0;
      cancelAnimationFrame(frame);
      setProgress(0);
    };
    const complete = () => {
      const modal = document.getElementById("modal-share-1");
      reset();
      modal && modal.classList.remove("hidden");
    };
    const tick = (time) => {
      if (!holding) return;
      if (!startedAt) startedAt = time;
      const progress = (time - startedAt) / holdDuration;
      setProgress(progress);
      if (progress >= 1) complete();
      else frame = requestAnimationFrame(tick);
    };
    const start = (event) => {
      event.preventDefault();
      if (holding) return;
      holding = true;
      startedAt = 0;
      if (event.pointerId !== undefined) stopButton.setPointerCapture(event.pointerId);
      frame = requestAnimationFrame(tick);
    };
    const cancel = (event) => {
      if (!holding) return;
      event && event.preventDefault();
      reset();
    };
    stopButton.addEventListener("pointerdown", start);
    stopButton.addEventListener("pointerup", cancel);
    stopButton.addEventListener("pointercancel", cancel);
    stopButton.addEventListener("keydown", (event) => {
      if (event.key === " " || event.key === "Enter") start(event);
    });
    stopButton.addEventListener("keyup", (event) => {
      if (event.key === " " || event.key === "Enter") cancel(event);
    });
    stopButton.addEventListener("click", (event) => { event.preventDefault(); event.stopImmediatePropagation(); }, true);
  };
  const connectShareDecision = () => {
    const modal = document.getElementById("modal-share-1");
    if (!modal || modal.dataset.ichiShareReady || !modal.firstElementChild) return;
    modal.dataset.ichiShareReady = "true";
    modal.classList.add("ichi-workspace-modal", "ichi-share-decision-modal");
    const card = modal.firstElementChild;
    card.classList.add("ichi-workspace-modal-card");
    const actionGroup = card.querySelector(".flex.flex-col.gap-4");
    const continueButton = actionGroup && actionGroup.querySelector(".ghost-button");
    if (continueButton) {
      continueButton.textContent = "继续抽赏";
      continueButton.onclick = () => modal.classList.add("hidden");
    }
    if (actionGroup && !document.getElementById("ichi-share-exit")) {
      const exit = document.createElement("button");
      exit.id = "ichi-share-exit";
      exit.type = "button";
      exit.className = "ichi-share-exit";
      exit.textContent = "暂不分享并退出";
      exit.addEventListener("click", saveLocalDraftAndExit);
      actionGroup.append(exit);
    }
  };
  const connectDraftPage = () => {
    const page = document.getElementById("page-draft");
    if (!page || !window.drawEngine || page.dataset.ichiDraftReady) return;
    page.dataset.ichiDraftReady = "true";
    page.classList.add("ichi-flow-page");
    page.innerHTML = '<header class="ichi-flow-header"><a href="#start" class="ichi-flow-back" aria-label="返回导入版面"><i class="ph-bold ph-arrow-left text-[22px]"></i></a><div class="ichi-flow-heading"><h2>识别结果</h2><p>直接核对每一赏的总票数与未贴的票数</p></div></header><div class="ichi-flow-scroll"><div id="ichi-prize-form-grid" class="ichi-prize-form-grid"></div></div><div id="ichi-confirm-draft" class="btn-wrapper ichi-fixed-primary"><div class="btn-glow"></div><button class="action-button">确认并生成版面</button></div>';
    const grid = page.querySelector("#ichi-prize-form-grid");
    window.drawEngine.prizeData.forEach((prize) => {
      const card = document.createElement("article");
      card.className = "ichi-prize-form-card light-capsule";
      card.dataset.tier = prize.id;
      const covered = prize.slots.filter(Boolean).length;
      const remaining = prize.total - covered;
      card.innerHTML = '<strong>' + prize.id + ' 赏</strong><div class="ichi-prize-field-labels"><span>总票数</span><span>未贴的票数</span></div><div class="ichi-prize-fields"><input type="number" min="1" aria-label="' + prize.id + '赏总票数" value="' + prize.total + '"><input type="number" min="0" aria-label="' + prize.id + '赏未贴的票数" value="' + remaining + '"></div><div class="ichi-prize-derived"><span>已贴的票数</span><b>' + covered + '</b></div>';
      const inputs = card.querySelectorAll("input");
      inputs[0].addEventListener("change", () => {
        const nextTotal = Math.max(1, Number(inputs[0].value) || prize.total);
        const nextRemaining = Math.min(Number(inputs[1].value) || 0, nextTotal);
        const nextCovered = nextTotal - nextRemaining;
        prize.total = nextTotal;
        prize.slots = Array.from({ length: nextTotal }, (_, index) => index < nextCovered);
        prize.type = /^[A-F]$/.test(String(prize.id).toUpperCase()) && nextTotal <= 5 ? "grand" : "normal";
        inputs[0].value = String(nextTotal);
        inputs[1].value = String(nextRemaining);
        card.querySelector(".ichi-prize-derived b").textContent = String(nextCovered);
      });
      inputs[1].addEventListener("change", () => {
        const nextRemaining = Math.max(0, Math.min(Number(inputs[1].value) || 0, prize.total));
        const nextCovered = prize.total - nextRemaining;
        prize.slots = Array.from({ length: prize.total }, (_, index) => index < nextCovered);
        inputs[1].value = String(nextRemaining);
        card.querySelector(".ichi-prize-derived b").textContent = String(nextCovered);
      });
      grid.append(card);
    });
    page.querySelector("#ichi-confirm-draft").addEventListener("click", () => window.simulateConfirmDraft());
  };
  const connectStartPage = () => {
    const page = document.getElementById("page-start");
    if (!page) return;
    renderStartDrafts();
    const importAction = page.querySelector(":scope > div:first-child .btn-wrapper");
    if (!importAction || importAction.dataset.ichiNewBoardReady) return;
    importAction.dataset.ichiNewBoardReady = "true";
    const importButton = importAction.querySelector("button");
    importButton?.setAttribute("data-testid", "import-board");
    importAction.addEventListener("click", () => {
      if (!window.drawEngine || !Array.isArray(window.__ichiDefaultPrizeData)) return;
      window.__ichiBoardId = createBoardId();
      window.drawEngine.prizeData = cloneValue(window.__ichiDefaultPrizeData);
      window.drawEngine.history = [];
      window.drawEngine.cost = 0;
      window.drawEngine.render();
      saveState();
    }, true);
  };
  const connectCamera = () => {
    const page = document.getElementById("page-camera-capture");
    if (!page || page.dataset.ichiCameraReady) return;
    page.dataset.ichiCameraReady = "true";
    const shutter =
      page.querySelector(".source-camera-shutter") ||
      page.querySelector("a[href='#recognizing']");
    const controls = shutter?.parentElement;
    const buttons = controls?.querySelectorAll("button");
    if (!buttons || buttons.length < 2 || !shutter) return;
    buttons[0].setAttribute("aria-label", "返回");
    buttons[0].onclick = () => { window.parent.location.href = "/?view=start"; };
    const undo = buttons[1];
    const shutterFace = shutter.firstElementChild;
    const syncCaptureState = (frozen) => {
      page.dataset.ichiCaptureState = frozen ? "frozen" : "live";
      shutter.dataset.ichiCaptureState = frozen ? "frozen" : "live";
      shutter.setAttribute("aria-label", frozen ? "确认识别这张版面" : "拍摄版面");
      undo.disabled = !frozen;
      undo.setAttribute("aria-disabled", String(!frozen));
      if (shutterFace) {
        shutterFace.innerHTML = frozen
          ? '<i class="ph-bold ph-check text-2xl text-white" aria-hidden="true"></i>'
          : "";
      }
    };
    shutter.classList.add("source-camera-shutter");
    shutter.setAttribute("role", "button");
    shutter.setAttribute("data-testid", "board-camera-shutter");
    shutter.addEventListener("click", (event) => {
      event.preventDefault();
      if (page.dataset.ichiCaptureState === "frozen") {
        window.location.hash = "#recognizing";
        return;
      }
      syncCaptureState(true);
    });
    undo.setAttribute("aria-label", "撤回并重拍");
    undo.onclick = () => syncCaptureState(false);
    syncCaptureState(false);
  };
  const connectShareCapture = () => {
    const modal = document.getElementById("modal-share-2");
    if (!modal || modal.dataset.ichiShareCaptureReady) return;
    modal.dataset.ichiShareCaptureReady = "true";
    const content = modal.querySelector(":scope > div:nth-child(2)");
    if (!content) return;
    const back = document.createElement("button");
    back.type = "button";
    back.className = "ichi-flow-back ichi-share-capture-back";
    back.setAttribute("aria-label", "返回分享选择");
    back.innerHTML = '<i class="ph-bold ph-arrow-left text-[22px]"></i>';
    back.addEventListener("click", () => {
      modal.classList.add("hidden");
      document.getElementById("modal-share-1")?.classList.remove("hidden");
    });
    content.prepend(back);
    const cameraFrame = content.querySelector(":scope > div:not(.ichi-share-capture-back)");
    cameraFrame && cameraFrame.classList.add("ichi-share-camera-frame");
    const meta = Array.from(content.children).find((child) => child.querySelector && child.querySelector("input"));
    const noteInput = meta && meta.querySelector("input");
    let hasCaptured = false;
    let confirm = null;
    const syncConfirmState = () => {
      if (!confirm) return;
      const ready = hasCaptured && Boolean(noteInput && noteInput.value.trim());
      confirm.disabled = !ready;
      confirm.setAttribute("aria-disabled", String(!ready));
      confirm.dataset.ichiReady = String(ready);
    };
    if (meta) {
      meta.classList.add("ichi-share-meta");
      confirm = document.createElement("button");
      confirm.type = "button";
      confirm.className = "ichi-share-confirm";
      confirm.setAttribute("aria-label", "确认地点与备注并提交");
      confirm.innerHTML = '<i class="ph-bold ph-check text-xl"></i>';
      confirm.addEventListener("click", () => window.submitShare());
      meta.append(confirm);
      noteInput && noteInput.addEventListener("input", syncConfirmState);
      syncConfirmState();
      window.submitShare = () => {
        if (!confirm || confirm.disabled) return;
        confirm.disabled = true;
        confirm.innerHTML = '<i class="ph-bold ph-spinner animate-spin text-xl"></i>';
        setTimeout(() => {
          confirm.innerHTML = '<i class="ph-bold ph-check text-xl"></i>';
          hasCaptured = false;
          if (noteInput) noteInput.value = "";
          syncConfirmState();
          modal.classList.add("hidden");
          document.getElementById("overlay-submitted")?.classList.remove("hidden");
          syncModalState();
        }, 700);
      };
    }
    const submitWrap = document.getElementById("btn-submit-share-wrap");
    const submitButton = document.getElementById("btn-submit-share");
    if (submitWrap && submitButton) {
      const actionPanel = submitWrap.parentElement;
      const actionRow = document.createElement("div");
      actionRow.className = "ichi-share-capture-action-row";
      const retake = document.createElement("button");
      retake.type = "button";
      retake.className = "ichi-share-retake";
      retake.setAttribute("aria-label", "撤回已拍摄赏票");
      retake.innerHTML = '<i class="ph-bold ph-arrow-counter-clockwise text-xl"></i>';
      retake.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        cameraFrame && cameraFrame.classList.remove("border-[#e014a0]");
        hasCaptured = false;
        submitButton.innerHTML = "拍摄赏票";
        syncConfirmState();
      });
      actionPanel?.classList.add("ichi-share-capture-action-panel");
      if (actionPanel) {
        const consent = actionPanel.querySelector("p");
        consent?.classList.add("ichi-share-capture-consent");
        consent && actionPanel.removeChild(consent);
        actionPanel.insertBefore(actionRow, submitWrap);
        actionRow.append(submitWrap, retake);
        content.insertBefore(actionPanel, meta || null);
        if (consent) content.insertBefore(consent, meta ? meta.nextSibling : null);
      }
      submitWrap.classList.add("ichi-share-capture-action");
      submitWrap.onclick = null;
      submitButton.textContent = "拍摄赏票";
      submitWrap.addEventListener("click", () => {
        cameraFrame && cameraFrame.classList.add("border-[#e014a0]");
        hasCaptured = true;
        submitButton.innerHTML = '<i class="ph-bold ph-check mr-2"></i> 已拍摄';
        syncConfirmState();
      });
    }
  };
  const connectSubmittedOverlay = () => {
    const overlay = document.getElementById("overlay-submitted");
    if (!overlay || overlay.dataset.ichiSubmittedReady || !overlay.firstElementChild) return;
    overlay.dataset.ichiSubmittedReady = "true";
    overlay.classList.add("ichi-workspace-modal");
    overlay.firstElementChild.classList.add("ichi-workspace-modal-card");
    const exit = overlay.querySelector(".btn-wrapper");
    if (exit) {
      exit.onclick = null;
      exit.addEventListener("click", (event) => {
        event.preventDefault();
        overlay.classList.add("hidden");
        try { sessionStorage.setItem(recognitionResumeKey, "start"); } catch {}
        location.hash = "#start";
      });
    }
    const stay = Array.from(overlay.querySelectorAll("button")).find((button) => button.textContent && button.textContent.includes("留在当前版面"));
    if (stay) stay.addEventListener("click", () => overlay.classList.add("hidden"));
  };
  const connectRecognitionNavigation = () => {
    const button = document.getElementById("nav-btn-camera");
    if (!button || button.dataset.ichiRecognitionNavReady) return;
    button.dataset.ichiRecognitionNavReady = "true";
    button.addEventListener("click", (event) => {
      if (recognitionTabViews.has(currentView())) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      const destination = getRecognitionResumeView();
      if (currentView() === destination) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      location.hash = "#" + destination;
    }, true);
  };
  const connectMySubpages = () => {
    const labels = {
      storage: ["账号管理", "账号与设置"],
      "local-records": ["本地记录", "全部记录"],
      contributions: ["我的贡献", "已上传记录"],
      "map-reminder": ["提醒设置", "好版地图"],
      method: ["隐私与数据", "计算与隐私"]
    };
    ["storage", "local-records", "contributions", "map-reminder", "method"].forEach((view) => {
      const page = document.getElementById("page-" + view);
      if (!page || page.dataset.ichiMySubpageReady) return;
      page.dataset.ichiMySubpageReady = "true";
      page.classList.add("ichi-my-subpage");
      const header = document.createElement("header");
      header.className = "ichi-my-subpage-header";
      const back = document.createElement("a");
      back.href = "#my";
      back.className = "ichi-my-back-button";
      back.setAttribute("aria-label", "返回我的");
      back.innerHTML = '<i class="ph-bold ph-arrow-left text-[22px]"></i>';
      const titleline = document.createElement("div");
      titleline.className = "ichi-my-subpage-titleline";
      titleline.innerHTML = '<strong>' + labels[view][0] + '</strong><span>· ' + labels[view][1] + '</span>';
      header.append(back, titleline);
      page.prepend(header);
      const sourceTitle = page.querySelector(":scope > h2");
      const sourceCopy = page.querySelector(":scope > p");
      sourceTitle && sourceTitle.classList.add("ichi-my-subpage-source-title");
      sourceCopy && sourceCopy.classList.add("ichi-my-subpage-source-copy");
      const stats = page.querySelector(":scope > .ichi-my-subpage-stats");
      const scroll = document.createElement("div");
      scroll.className = "ichi-my-subpage-scroll";
      while (page.children.length > 1) {
        const child = page.children[1];
        if (child === stats) {
          page.removeChild(child);
        } else {
          scroll.append(child);
        }
      }
      page.append(scroll);
      if (stats) header.after(stats);
    });
  };
  const connectMyNavigation = () => {
    const button = document.getElementById("nav-btn-my");
    if (!button || button.dataset.ichiMyNavReady) return;
    button.dataset.ichiMyNavReady = "true";
    button.addEventListener("click", (event) => {
      if (currentView() === "my") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      location.hash = "#my";
    }, true);
  };
  const connectNavigation = () => {
    connectModalLifecycle();
    connectDrawWorkspace();
    connectShareDecision();
    connectShareCapture();
    connectSubmittedOverlay();
    connectStartPage();
    connectCamera();
    connectDraftPage();
    connectRecognitionNavigation();
    connectRecordPages();
    connectMySubpages();
    connectMyNavigation();
  };
  const initializeBridge = () => {
    if (typeof window.handleRoute === "function") window.handleRoute();
    if (window.drawEngine && typeof window.drawEngine.render === "function") window.drawEngine.render();
    connect();
    connectNavigation();
    sendRoute();
    const markReadyWhenStylesApply = () => {
      const hiddenView = document.querySelector(".page-view.hidden");
      if (hiddenView && getComputedStyle(hiddenView).display !== "none") {
        window.setTimeout(markReadyWhenStylesApply, 50);
        return;
      }
      document.body.dataset.ichiBridgeReady = "true";
    };
    markReadyWhenStylesApply();
  };
  window.addEventListener("hashchange", () => {
    const nextView = currentView();
    closeTransientLayers();
    preservePageScroll(nextView);
    connectNavigation();
    sendRoute();
  });
  initializeBridge();
  window.addEventListener("load", initializeBridge);
})();
</script>`;

type BoardOutlookRequest = {
  readonly tiers?: readonly {
    readonly tier?: unknown;
    readonly total?: unknown;
    readonly covered?: unknown;
  }[];
  readonly targetTiers?: readonly unknown[];
  readonly unitPriceMinor?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BoardOutlookRequest;
    const tiers = (body.tiers ?? []).map((tier) => ({
      tier: String(tier.tier ?? ""),
      total: Number(tier.total),
      covered: Number(tier.covered),
    }));
    const targetTiers = (body.targetTiers ?? []).map(String);
    const unitPrice = Number(body.unitPriceMinor);
    if (!Number.isSafeInteger(unitPrice) || unitPrice < 0) {
      return NextResponse.json(
        { status: "unavailable", reason: "当前版面暂时无法计算。" },
        { status: 400 },
      );
    }
    const result = buildBoardOutlook({
      tiers,
      targetTiers,
      unitPriceMinor: BigInt(unitPrice),
    });
    if (result.status === "unavailable") {
      return NextResponse.json(result);
    }
    return NextResponse.json({
      ...result,
      cumulativeCost: result.cumulativeCost.toString(),
    });
  } catch {
    return NextResponse.json(
      { status: "unavailable", reason: "当前版面暂时无法计算。" },
      { status: 400 },
    );
  }
}

export async function GET(request: Request) {
  const source = await readFile(sourcePath, "utf8");
  const requestedView = new URL(request.url).searchParams.get("initialView");
  const initialView =
    requestedView && /^[a-z0-9-]+$/.test(requestedView)
      ? requestedView
      : "start";
  const html = source
    .replace("</head>", `${bridgeStyle}</head>`)
    .replace("<body ", `<body data-ichi-page="${initialView}" `)
    .replace(
      /<div id="generating-overlay"[\s\S]*?<section id="page-draw"/u,
      '<section id="page-draw"',
    )
    .replace(
      /function simulateConfirmDraft\(\) \{[\s\S]*?\n {8}\}\n\n {8}function submitShare/u,
      "function simulateConfirmDraft() { window.__ichiSelectedTargetTiers = []; window.location.hash = '#draw'; }\n\n        function submitShare",
    )
    .replace("const drawEngine = {", "window.drawEngine = {")
    .replaceAll("toFixed(1)", "toFixed(3)")
    .replace("ph-user-astronaut", "ph-user-circle")
    .replace("ph-fill ph-cloud text-lg", "ph-fill ph-gear-six text-lg")
    .replace(
      '<i class="ph-bold ph-camera text-3xl text-zinc-400"></i>',
      '<img src="/v1-29/ichi-camera-cutout.png" alt="相机图标" class="ichi-source-camera-icon" />',
    )
    .replace(
      '<div class="relative z-20 w-14 h-14 bg-black rounded-[50%] rounded-bl-sm transform -rotate-[15deg] shadow-lg flex items-center justify-center">\n                                <i class="ph-fill ph-scan text-white text-xl transform rotate-[15deg]"></i>\n                            </div>',
      '<img src="/v1-29/ichi-recognition-mascot.png" alt="正在识别版面" class="ichi-recognition-mascot" />',
    )
    .replace(
      /<!-- 新吉祥物：源自赏票结构的迷你票根小精灵 -->[\s\S]*?<div class="flex-grow flex flex-col justify-center overflow-hidden">/,
      `${toastMascotMarkup}\n\n                <div class="flex-grow flex flex-col justify-center overflow-hidden">`,
    )
    .replace(
      "ph-fill ph-image text-[22px]",
      "ph-bold ph-arrow-left text-[22px]",
    )
    .replace(
      '<button class="w-[52px] h-[52px] bg-[#f0f2f5] rounded-full flex items-center justify-center text-zinc-500 shadow-inner border border-black/5 active:scale-95 transition-all hover:bg-[#e2e8f0]">\n                                <i class="ph-bold ph-arrow-left text-[22px]"></i>\n                            </button>',
      '<button onclick="window.parent.location.href=\'/?view=start\'" aria-label="返回导入版面" class="w-[52px] h-[52px] bg-[#f0f2f5] rounded-full flex items-center justify-center text-zinc-500 shadow-inner border border-black/5 active:scale-95 transition-all hover:bg-[#e2e8f0]">\n                                <i class="ph-bold ph-arrow-left text-[22px]"></i>\n                            </button>',
    )
    .replace(
      "ph-bold ph-lightning-slash text-[22px]",
      "ph-fill ph-image text-[22px]",
    )
    .replace(
      '<a href="#method" class="flex items-center justify-between p-4 bg-white hover:bg-[#f0f2f5] rounded-[24px] transition-colors">\n                        <div class="flex items-center gap-4">\n                            <div class="w-10 h-10 bg-[#f0f2f5] rounded-full flex items-center justify-center text-zinc-500"><i class="ph-fill ph-bell text-lg"></i></div>',
      '<a href="#map-reminder" class="flex items-center justify-between p-4 bg-white hover:bg-[#f0f2f5] rounded-[24px] transition-colors">\n                        <div class="flex items-center gap-4">\n                            <div class="w-10 h-10 bg-[#f0f2f5] rounded-full flex items-center justify-center text-zinc-500"><i class="ph-fill ph-bell text-lg"></i></div>',
    )
    .replace(
      '<section id="page-method" class="page-view hidden">',
      `${mapReminderSection}<section id="page-method" class="page-view hidden">`,
    )
    .replace(
      "'deleted', 'method', 'map-preview', 'my', 'cannot-build-pool',",
      "'deleted', 'map-reminder', 'method', 'map-preview', 'my', 'cannot-build-pool',",
    )
    .replace(
      "'my': 'my', 'storage': 'my', 'local-records': 'my', 'contributions': 'my', 'method': 'my', 'deleted': 'my'",
      "'my': 'my', 'storage': 'my', 'local-records': 'my', 'contributions': 'my', 'map-reminder': 'my', 'method': 'my', 'deleted': 'my'",
    )
    .replace(
      "relative flex items-center justify-center w-[84px] h-[84px]",
      "source-camera-shutter relative flex items-center justify-center w-[84px] h-[84px]",
    )
    .replace(
      '<div class="w-20 h-20 bg-black rounded-[50%] rounded-bl-sm transform -rotate-[15deg] shadow-xl flex items-center justify-center">\n                        <span class="text-3xl font-black text-white transform rotate-[15deg]">I</span>\n                    </div>',
      '<div class="ichi-avatar-frame" aria-label="ICHI 头像"><img class="ichi-avatar-image" src="/api/v1-29-avatar" alt="ICHI 头像" /></div>',
    )
    .replace(
      /(<section id="page-map-preview"[\s\S]*?w-24 h-24 bg-black )rounded-\[50%\] rounded-bl-sm transform -rotate-\[15deg\] shadow-xl/,
      "$1rounded-full shadow-xl",
    )
    .replace("text-4xl transform rotate-[15deg]", "text-4xl")
    .replace(
      "当前版本不展示门店线索或实时库存判断。我们希望先打磨好核心的核对和记录体验。",
      "好版地图会汇总用户核对并贡献的版面记录，帮助你按地点查看值得关注的票池线索与当前版面状态。",
    )
    .replace("</body>", `${bridgeScript}</body>`);
  return new NextResponse(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
