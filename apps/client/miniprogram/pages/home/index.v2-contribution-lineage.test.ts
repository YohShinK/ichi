import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const read = (name: string): string =>
  fs.readFileSync(path.join(process.cwd(), name), "utf8");
const ts = read("apps/client/miniprogram/pages/home/index.ts");
const wxml = read("apps/client/miniprogram/pages/home/index.wxml");
const wxss = read("apps/client/miniprogram/pages/home/index.wxss");

describe("candidate upload lineage in the existing My Uploads and map card", () => {
  it("contains no second publication/withdrawal control", () => {
    for (const name of [
      "onAcceptMapAuthorization",
      "onWithdrawMapContribution",
      "onConfirmDeleteMapContribution",
      "map-contribution-authorization",
      "map-contribution-delete",
      "地图贡献未开启",
      "重新发布",
    ])
      expect(ts + wxml).not.toContain(name);
  });

  it("shows a user-level versioned terms card without per-record publication controls", () => {
    expect(wxml).toContain('data-testid="map-contribution-consent-card"');
    expect(wxml).toContain("地图贡献条例");
    expect(wxml).toContain("了解并同意");
    expect(ts).toContain("refreshMapContributionConsent");
    expect(ts).toContain("acceptMapContributionTerms");
    expect(ts).not.toContain("SET_MAP_CONTRIBUTION_CONSENT");
    expect(wxml).not.toContain("关闭地图贡献条例");
    expect(wxml).not.toContain("发布此记录");
    expect(wxml).not.toContain("撤回此记录");
  });

  it("keeps unavailable consent honest and the terms action inside its modal flow", () => {
    expect(wxml).toContain("mapContributionConsentPhase === 'UNAVAILABLE'");
    expect(wxml).toContain("条例状态暂不可用");
    expect(wxml).toContain(
      "mapContributionConsent && !mapContributionConsent.accepted",
    );
    expect(ts).toContain('mapContributionConsentPhase: "LOADING"');
    expect(wxss).toMatch(
      /\.modal-card\.map-authorization-modal\s*\{[^}]*height:\s*auto/u,
    );
    expect(wxss).toMatch(
      /\.map-authorization-actions\s*>\s*\.action-button\s*\{[^}]*position:\s*static/u,
    );
  });

  it("places candidate uploads in the same cloud list with the same swipe-delete card", () => {
    const myUploads = wxml.slice(
      wxml.indexOf("currentView === 'contributions'"),
      wxml.indexOf("currentView === 'map-reminder'"),
    );
    const scrollStart = myUploads.indexOf('class="records-scroll"');
    const candidateRow = myUploads.indexOf('wx:for="{{candidateUploads}}"');
    expect(myUploads).toContain(
      "云端 {{cloudClues.length + candidateUploads.length}} 个",
    );
    expect(myUploads).toContain(
      "{{cloudClues.length || candidateUploads.length || pendingDirectUploads.length}}",
    );
    expect(candidateRow).toBeGreaterThan(scrollStart);
    expect(myUploads).not.toContain("候选测试上传记录");
    const candidateMarkup = myUploads.slice(candidateRow);
    expect(candidateMarkup).toContain('class="swipe-row"');
    expect(candidateMarkup).toContain(
      "draft-card contribution-card swipe-content",
    );
    expect(candidateMarkup).toContain('bindtouchmove="onTouchMove"');
    expect(candidateMarkup).toContain('catchtap="onDeleteCandidateUpload"');
    expect(candidateMarkup).not.toContain("删除上传记录</button>");
    expect(candidateMarkup).not.toContain("已选择分享至地图");
    expect(candidateMarkup).not.toContain("暂不分享");
    expect(candidateMarkup).toContain("validationState === 'VERIFIED'");
    expect(ts).toContain("candidateUploads[${candidateIndex}].swipeX");
    expect(ts).toContain("candidateUploadService.deleteMyUpload(");
  });

  it("deletes the candidate original upload by server-issued ref", () => {
    expect(wxml).toContain('data-testid="candidate-my-uploads"');
    expect(wxml).toContain('catchtap="onDeleteCandidateUpload"');
    expect(ts).toContain("candidateUploadService.deleteMyUpload(");
    expect(ts).toContain("candidateRecordRef");
    expect(ts).not.toContain("owner:<publicLeadId>");
  });

  it("uses upload confirmation for sharing without a second publication control", () => {
    expect(ts).toContain("createWxProductionContributionService()");
    expect(ts).toContain(
      "candidateUploadService.rememberSharedUpload(recordId)",
    );
    expect(ts).toContain("candidateUploadService.flushSharedUploads()");
    expect(ts).not.toContain("candidateUploadService.submitSynthetic(input)");
    expect(wxml).toContain("分享并上传的记录核验通过就会自动进入地图");
    for (const label of [
      "地图分享选择",
      "我确认有权分享，并分享至地图",
      "map-source-choice",
      "onOpenMapSourceChoice",
    ])
      expect(wxml + ts).not.toContain(label);
  });

  it("keeps the direct-upload result centered with exactly one return button", () => {
    const modal = wxml
      .split("modalView === 'board-upload-submitted'")[1]!
      .split("modalView === 'human-assistance'")[0]!;
    expect(modal.match(/<button\b/g)).toHaveLength(1);
    expect(modal).toContain("退出回首页");
    expect(modal).toContain("{{mapUploadSharingMessage}}");
    expect(ts).toMatch(/sharedUploadAcknowledged\(\s*recordId,?\s*\)/u);
    expect(ts).toContain("本条记录已上传。");
    expect(wxss).toMatch(/\.modal-card--submitted\s*\{[^}]*height:\s*auto/u);
    expect(wxss).toMatch(
      /\.modal-layer--submitted \.card-copy\s*\{[^}]*display:\s*block/u,
    );
  });

  it("renders an adjustable avatar stack within the existing single card", () => {
    expect(wxml).toContain("mapDetail.contributorAvatars");
    expect(wxml).toContain("mapDetail.contributorOverflowLabel");
    expect(wxml).not.toContain("独立公开详情");
  });

  it("restores server-driven opportunity chips", () => {
    expect(ts).toContain("mapDiscoveryChipsEnabled: true");
  });
});
