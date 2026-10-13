import fs from "node:fs";
import path from "node:path";
import { binding, candidateIssues, boardImageEvidence } from "./workflow.mjs";
import { preview } from "./preview.mjs";
const issueText = (code) =>
  ({
    RECORD_NEEDS_FIX: "版面信息尚未补齐",
    TIER_REMAINING_UNRESOLVED: "部分赏级剩余数待确认",
    SOURCE_TIME_UNPROVEN: "原始发布时间需要核对",
    OUTSIDE_ORIGINAL_SEVEN_DAY_WINDOW: "原首次发现超出七天采集窗口",
    OBSERVATION_EXPIRED: "已超出地图展示期限",
    BOARD_IMAGE_MISSING: "缺少能计数的版面照片或播放帧",
    PUBLIC_CAPTURE_MISSING: "缺少原帖内容依据",
    LOCATION_EVIDENCE_MISSING: "还需核对门店或商场",
    LOCATION_UNCONFIRMED: "地点与版面对应关系待确认",
    RECOGNITION_CONTENT_CHANGED: "原图或版面版本已变化，需要重新核对",
    RECOGNITION_INCOMPLETE: "照片信息尚未完整识别",
    HIGH_PRIZE_UNCONFIRMED: "大赏集合待确认",
    HIGH_PRIZE_EVIDENCE_INCOMPLETE: "大赏奖品信息需要核对",
    NOTE_UNCONFIRMED: "公开备注内容还需核验",
    RIGHTS_UNPROVEN: "结构化事实使用依据还需核验",
    CURATOR_UNPROVEN: "审核负责人尚未绑定",
  })[code] ??
  (/^TIER_.+_EVIDENCE_INCOMPLETE$/u.test(code)
    ? "有赏级余量证据待确认"
    : "有信息需要进一步核对");
const escape = (s) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const display = (s) => (s === null || s === undefined ? "待确认" : escape(s));
const statusText = (status) =>
  ({
    NEEDS_FOUNDER: "待你确认",
    PENDING: "等待识别",
    NEEDS_FIX: "需要补充",
    NEEDS_REVIEW: "等待核验",
    PUBLISHED_REVISION_NEEDS_REVIEW: "修改后等待核验",
    APPROVED: "证据核验通过",
    PUBLISHED: "已入图",
    TAKEN_DOWN: "已撤回",
  })[status] ?? "等待处理";
export const renderReview = (store, onlyPending = false, policy) => {
  const state = store.read(),
    candidates = Object.values(state.candidates).filter(
      (c) =>
        !onlyPending ||
        c.status === "NEEDS_FOUNDER" ||
        [
          "NEEDS_FIX",
          "NEEDS_REVIEW",
          "PUBLISHED_REVISION_NEEDS_REVIEW",
          "PENDING",
        ].includes(c.status),
    );
  for (const c of candidates) store.verify(c);
  const cards = candidates
    .map((c) => {
      const r = c.record,
        f = r.boardFacts ?? { tiers: [] };
      const images = c.evidence
        .filter((e) =>
          ["PHOTO", "VIDEO_FRAME", "VIDEO_COVER", "SCREENSHOT"].includes(
            e.kind,
          ),
        )
        .map((e) => {
          const ext = path.extname(e.path).toLowerCase(),
            mime =
              ext === ".png"
                ? "image/png"
                : ext === ".webp"
                  ? "image/webp"
                  : "image/jpeg";
          return `<figure><img src="data:${mime};base64,${fs.readFileSync(store.inside(e.path)).toString("base64")}" alt="${escape(f.ipName)} 原始证据">${e.kind === "VIDEO_COVER" ? '<figcaption class="issues">视频封面：需补真实播放帧，不能用于剩余数计数。</figcaption>' : ""}</figure>`;
        })
        .join("");
      const analysis = preview(c, policy);
      const issues = [...new Set([...candidateIssues(c), ...(c.issues ?? [])])];
      const tiers = (f.tiers ?? [])
        .map(
          (t) =>
            `<tr><td>${escape(t.rawLabel ?? t.tierCode)}</td><td><input class="count" data-tier="${escape(t.tierCode)}" type="number" min="0" step="1" value="${t.remainingTickets ?? ""}" placeholder="待确认" aria-label="${escape(t.rawLabel ?? t.tierCode)}剩余数"></td><td>${t.isGrandPrize === null || t.isGrandPrize === undefined ? "待确认" : t.isGrandPrize ? "是" : "否"}</td></tr>`,
        )
        .join("");
      return `<article data-id="${c.id}"><h2>${escape(f.ipName)} / ${escape(f.themeName)}</h2><p>状态：${escape(statusText(c.status))} · 版本 ${c.revision}</p>${(
        c.similarityHints ?? []
      )
        .filter((h) => h.question)
        .map((h) => `<p class="issues">${escape(h.question)}</p>`)
        .join(
          "",
        )}<div class="columns"><div>${images}</div><div><p>原帖：<a href="${escape(r.sourceUrl)}" target="_blank" rel="noreferrer">查看原帖</a></p><p>原帖上传：${escape(r.sourcePublishedAt)}<br>原采集：${escape(r.fetchedAt)}</p><p>地点：${escape(r.location?.venueReference?.venueName ?? "待确认")}<br>备注：${display(r.note?.text)}<br>单抽价：${f.pricePerDrawMinor === null ? "未标明" : f.pricePerDrawMinor / 100 + "元"}</p><table><tr><th>赏级</th><th>剩余数</th><th>大赏</th></tr>${tiers}</table><p>本地规则预览（字段待核对，不代表已入图）：${analysis.pending ? "待确认" : escape(analysis.opportunity.join(" / ") || "暂无分析标签")} · ${analysis.pending ? "待确认" : escape(analysis.freshness.freshnessBand)}<br>原观察期限：${escape(analysis.publicUntil ?? "待确认")}</p><p class="issues">${issues.length ? "待确认：" + [...new Set(issues.map(issueText))].map(escape).join("；") : "结构与证据完整"}</p><label>处理决定 <select class="decision"><option value="">暂不决定</option><option value="APPROVE">确认通过</option><option value="NEEDS_FIX">需要补充或修正</option><option value="REJECT">拒绝入图</option></select></label><div class="checks">${["数量准确", "地点对应", "大赏集合", "公开备注安全"].map((x) => `<label><input type="checkbox">${x}</label>`).join("")}</div><label>结构化事实使用依据 <select class="basis"><option value="">未确认</option><option value="PERMITTED_STRUCTURED_FACTS">仅使用允许的结构化事实</option><option value="OWNER_PERMISSION">门店或作者许可</option><option value="LICENSE">已有许可</option></select></label><label>依据记录 <input class="rights-ref" type="text"></label><p>修改数字或证据后需生成新版本，再确认该版本。照片与来源只保存在本地审核包。</p></div></div></article>`;
    })
    .join("");
  const data = candidates.map((c) => ({
    id: c.id,
    revision: c.revision,
    binding: binding(c),
    noteSafety: c.record.note?.safetyProvenance ?? null,
    imageSha256: c.evidence.find(boardImageEvidence)?.sha256,
    remaining: Object.fromEntries(
      (c.record.boardFacts?.tiers ?? []).map((t) => [
        t.tierCode,
        t.remainingTickets,
      ]),
    ),
  }));
  const scriptData = JSON.stringify({
    revision: state.revision,
    data,
  }).replaceAll("<", "\\u003c");
  const file = path.join(
    store.dir,
    onlyPending ? "founder-pending.html" : "review.html",
  );
  fs.writeFileSync(
    file,
    `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ICHI 版面集中确认</title><style>body{font:16px/1.6 system-ui;margin:0;background:#f7f5ee;color:#193e33}header{padding:24px;background:#193e33;color:white}main{max-width:1200px;margin:auto;padding:20px}article{background:white;border-radius:16px;padding:24px;margin:20px 0}.columns{display:grid;grid-template-columns:1fr 1fr;gap:24px}img{width:100%;height:auto;margin-bottom:12px}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left}label{display:block;margin:12px 0}input,select,button{font:inherit;padding:8px;max-width:100%}.checks{display:flex;flex-wrap:wrap;gap:12px}.issues{color:#8d4811}@media(max-width:720px){.columns{grid-template-columns:1fr}}</style><header><h1>ICHI · Founder 集中确认</h1><p>证据清楚的由自动流程处理。此页集中保留需要你判断的版面；确认项初始均未勾选。</p></header><main><label>本次确认记录（例如本聊天中的回复）<input id="instruction" type="text"></label><label>审核负责人标识<input id="curator" type="text"></label><button id="fix-export">导出数字补充</button><button id="export">导出本次决定</button><p id="notice"></p>${cards || "<p>当前没有待确认版面。</p>"}</main><script>const packet=${scriptData};document.getElementById('fix-export').onclick=()=>{const ref=document.getElementById('instruction').value.trim();if(!ref){document.getElementById('notice').textContent='请填写本次确认记录';return}const items=[];for(const c of packet.data){const el=document.querySelector('[data-id="'+c.id+'"]'),remaining={};for(const input of el.querySelectorAll('.count')){if(input.value==='')continue;const n=Number(input.value);if(!Number.isSafeInteger(n)||n<0){document.getElementById('notice').textContent='剩余数须为非负整数';return}if(n!==c.remaining[input.dataset.tier])remaining[input.dataset.tier]=n}if(Object.keys(remaining).length){if(!c.imageSha256){document.getElementById('notice').textContent='这项只有视频封面，需要先补真实版面照片或播放帧';return}items.push({id:c.id,revision:c.revision,binding:c.binding,imageSha256:c.imageSha256,remaining})}}const result={schemaVersion:'ichi-network-founder-fixes-v1',batchRevision:packet.revision,userInstructionRef:ref,items};const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='founder-number-fixes.json';a.click();URL.revokeObjectURL(url);document.getElementById('notice').textContent='已导出 '+items.length+' 项数字补充；原批准失效，完整证据重新自动核验。'};document.getElementById('export').onclick=()=>{const now=new Date().toISOString(),decisions=[];const ref=document.getElementById('instruction').value.trim(),curator=document.getElementById('curator').value.trim();if(!ref){document.getElementById('notice').textContent='请填写本次确认记录';return}for(const c of packet.data){const el=document.querySelector('[data-id="'+c.id+'"]'),decision=el.querySelector('.decision').value;if(!decision)continue;if(decision==='APPROVE'&&[...el.querySelectorAll('.count')].some(x=>x.value!==''&&Number(x.value)!==c.remaining[x.dataset.tier])){document.getElementById('notice').textContent='数字已修改，请先导出数字补充，再核验新版本';return}const checked=[...el.querySelectorAll('input[type=checkbox]')].every(x=>x.checked),basis=el.querySelector('.basis').value,evidenceRef=el.querySelector('.rights-ref').value.trim();if(decision==='APPROVE'&&(!checked||!basis||!evidenceRef||!curator)){document.getElementById('notice').textContent='通过前请确认数量、地点、大赏、备注及使用依据';return}decisions.push({...c,decision,reviewedBy:'FOUNDER',reviewedAt:now,reviewVersion:'founder-'+now,curatorAuthorityId:curator,accuracyConfirmed:checked,locationConfirmed:checked,highPrizeTiersConfirmed:checked,rights:{decision:'PASS',basis,evidenceRef,decisionVersion:'founder-rights-'+now,decidedAt:now}})}const result={schemaVersion:'ichi-network-review-v1',batchRevision:packet.revision,userInstructionRef:ref,decisions};const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='founder-decisions.json';a.click();URL.revokeObjectURL(url);document.getElementById('notice').textContent='已导出 '+decisions.length+' 项决定，交回本流程后按版本核对处理。'};</script></html>`,
  );
  return { file, cards: candidates.length, cloudWrites: 0 };
};
