import fs from "node:fs";
import path from "node:path";

const skillRoot = "/Users/cunfu/.codex/skills/guizang-ppt-skill";
const templatePath = path.join(skillRoot, "assets/template-swiss.html");
const outputPath = path.join(import.meta.dirname, "n1-visual-v3.html");

let html = fs.readFileSync(templatePath, "utf8");

const customCss = String.raw`
  /* ICHI Product Atlas · N1 single-board projection */
  .n1-page{--n1-gap:clamp(10px,1.15vh,16px)}
  .n1-page .canvas-card{padding:3.2vh 4vw 4.8vh}
  .n1-page .chrome-min{margin-bottom:1.8vh}
  .n1-layout{flex:1;min-height:0;display:grid;grid-template-rows:auto auto minmax(150px,18vh) auto auto minmax(150px,17vh);gap:var(--n1-gap)}
  .n1-head{display:grid;grid-template-columns:minmax(0,7fr) minmax(320px,5fr);gap:3vw;align-items:end;border-top:12px solid var(--accent);padding-top:1.7vh}
  .n1-title{font-family:var(--sans),var(--sans-zh);font-weight:200;font-size:min(4.15vw,7.35vh);line-height:.98;letter-spacing:-.035em;color:var(--text-primary)}
  .n1-thesis{font-family:var(--sans),var(--sans-zh);font-size:clamp(18px,1.12vw,22px);line-height:1.48;font-weight:400;color:var(--text-secondary);border-left:3px solid var(--accent);padding-left:1.2vw}
  .n1-context{display:grid;grid-template-columns:repeat(3,1fr);gap:1.1vw}
  .n1-context-card{border-top:1px solid var(--ink);padding:1vh 1vw 0;min-width:0}
  .n1-context-card:first-child{padding-left:0}
  .n1-label{font-family:var(--mono);font-size:14px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:var(--text-helper);margin-bottom:.55vh}
  .n1-copy{font-family:var(--sans),var(--sans-zh);font-size:clamp(16px,.9vw,18px);font-weight:500;line-height:1.42;color:var(--text-primary)}
  .n1-flow{min-height:0!important;flex:none!important;border-top:1px solid var(--border-subtle);border-bottom:1px solid var(--border-subtle)}
  .n1-flow .tl-row{grid-template-columns:repeat(4,1fr)!important}
  .n1-flow .th-node .label{width:19vw!important;gap:.45vh!important}
  .n1-flow .th-node.up .label{bottom:calc(50% + 14px)!important}
  .n1-flow .th-node.down .label{top:calc(50% + 14px)!important}
  .n1-flow .th-node .name{font-family:var(--sans),var(--sans-zh);font-size:clamp(18px,1.14vw,22px)!important;font-weight:500!important}
  .n1-flow .th-node .desc{font-size:16px!important;font-weight:500!important;line-height:1.24!important;color:var(--text-secondary)!important}
  .n1-flow .th-node .yr{font-size:14px!important;font-weight:600!important}
  .n1-flow .th-node .dot{border-radius:0!important;width:10px!important;height:10px!important}
  .n1-mid{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:1.2vw;min-height:0}
  .n1-info{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--grey-2)}
  .n1-panel{background:var(--grey-1);padding:1.25vh 1.15vw;min-width:0}
  .n1-panel.accent{background:var(--accent);color:var(--accent-on)}
  .n1-panel.accent .n1-label,.n1-panel.accent .n1-copy{color:var(--accent-on)}
  .n1-lines{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:.45vh .9vw}
  .n1-lines li{font-family:var(--sans),var(--sans-zh);font-size:clamp(16px,.82vw,17px);font-weight:500;line-height:1.35;padding-left:.9em;position:relative}
  .n1-lines li::before{content:"";position:absolute;left:0;top:.62em;width:6px;height:1px;background:currentColor}
  .n1-decisions{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--grey-2)}
  .n1-decision{background:var(--paper);padding:1.25vh 1vw;display:flex;flex-direction:column;justify-content:space-between;min-width:0}
  .n1-decision strong{font-family:var(--sans),var(--sans-zh);font-size:clamp(18px,1.2vw,23px);font-weight:400;line-height:1.15;color:var(--text-primary)}
  .n1-decision p{font-family:var(--sans),var(--sans-zh);font-size:clamp(16px,.78vw,16px);font-weight:500;line-height:1.38;color:var(--text-secondary);margin-top:.75vh}
  .n1-consequence{display:flex;align-items:center;justify-content:space-between;gap:2vw;background:var(--ink);color:var(--paper);padding:1.05vh 1.15vw}
  .n1-consequence .n1-label{color:rgba(255,255,255,.62);margin:0;white-space:nowrap}
  .n1-consequence p{font-family:var(--sans),var(--sans-zh);font-size:clamp(16px,.91vw,18px);font-weight:500;line-height:1.35;text-align:right}
  .n1-bottom{display:grid;grid-template-columns:minmax(0,6fr) minmax(260px,3fr) minmax(300px,3fr);gap:1.2vw;min-height:0}
  .n1-evidence{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--grey-2)}
  .n1-evidence-item{background:var(--grey-1);padding:1vh 1vw;min-width:0}
  .n1-evidence-item strong{display:block;font-family:var(--mono);font-size:14px;font-weight:600;letter-spacing:.12em;color:var(--accent);margin-bottom:.4vh}
  .n1-evidence-item p,.n1-question p{font-family:var(--sans),var(--sans-zh);font-size:clamp(16px,.78vw,16px);font-weight:500;line-height:1.38;color:var(--text-secondary)}
  .n1-question{border-top:3px solid var(--accent);padding:1.1vh 1vw;background:var(--paper)}
  .n1-question.primary{background:var(--grey-1)}
  .n1-question.primary p{font-size:clamp(17px,.92vw,18px);line-height:1.45;color:var(--text-primary)}
  .n1-checks{list-style:none;display:flex;flex-direction:column;gap:.55vh}
  .n1-checks li{font-family:var(--sans),var(--sans-zh);font-size:clamp(16px,.76vw,16px);font-weight:500;line-height:1.34;color:var(--text-secondary);padding-left:1.5em;position:relative}
  .n1-checks li::before{position:absolute;left:0;font-family:var(--mono);font-weight:600;color:var(--accent)}
  .n1-checks li:nth-child(1)::before{content:"01"}.n1-checks li:nth-child(2)::before{content:"02"}.n1-checks li:nth-child(3)::before{content:"03"}
  @media(max-width:1100px){.n1-page .canvas-card{padding:2.4vh 3vw 5vh}.n1-title{font-size:min(4.8vw,8.3vh)}.n1-head{grid-template-columns:6fr 5fr}.n1-bottom{grid-template-columns:5fr 3fr 4fr}.n1-flow .th-node .label{width:21vw!important}}
`;

html = html.replace("</style>", `${customCss}\n</style>`);
html = html.replace("[必填] 替换为 PPT 标题 · Deck Title", "ICHI Product Atlas · N1 问题现场");

const slide = String.raw`
<section class="slide light n1-page" data-layout="S11" data-animate="timeline-walk">
  <div class="canvas-card">
    <div class="chrome-min tight">
      <div class="l">ICHI · PRODUCT ATLAS / NEO CORE</div>
      <div class="r">N1 · APPROVED · REV 2 · 01 / 01</div>
    </div>

    <main class="n1-layout">
      <header class="n1-head" data-anim="head">
        <div>
          <div class="t-meta" style="margin-bottom:.8vh;color:var(--accent)">SITUATION · 付款之前，决定已经开始</div>
          <h1 class="n1-title">问题现场：付款前的 3 分钟</h1>
        </div>
        <p class="n1-thesis">一个有目标奖和预算的人，在变化中的票池前，需要判断：<strong style="color:var(--text-primary);font-weight:600">抽 / 包 / 买 / 走</strong>。</p>
      </header>

      <section class="n1-context" data-anim="context" aria-label="场景上下文">
        <article class="n1-context-card"><div class="n1-label">Person · 谁</div><p class="n1-copy">明确目标奖、追 Last，或预算有限的一番赏用户</p></article>
        <article class="n1-context-card"><div class="n1-label">Place · 哪里</div><p class="n1-copy">门店 / 快闪 / 线上页面；奖项板、进度表、聊天图分散</p></article>
        <article class="n1-context-card"><div class="n1-label">Time · 何时</div><p class="n1-copy">付款前几分钟；票池继续变化，时间压力上升</p></article>
      </section>

      <section class="timeline-h n1-flow" data-anim="timeline" aria-label="现场分镜">
        <div class="tl-row">
          <article class="th-node up accent"><span class="dot"></span><div class="label"><span class="yr">01 · TRIGGER</span><strong class="name">看到目标奖</strong><span class="desc">看到余票或 Last One<br>“现在值不值得参与？”</span></div></article>
          <article class="th-node down"><span class="dot"></span><div class="label"><span class="yr">02 · CHECK</span><strong class="name">核对现场信息</strong><span class="desc">奖项板 + 余票 + 单抽价<br>信息散落在不同介质</span></div></article>
          <article class="th-node up"><span class="dot"></span><div class="label"><span class="yr">03 · GAP</span><strong class="name">信息无法对上</strong><span class="desc">完整性 / 守恒 / 概率 / 成本<br>无法快速确认</span></div></article>
          <article class="th-node down"><span class="dot"></span><div class="label"><span class="yr">04 · DECIDE</span><strong class="name">必须做出选择</strong><span class="desc">手数、询问、搜索计算器<br>或继续凭感觉</span></div></article>
        </div>
      </section>

      <section class="n1-mid" data-anim="decision">
        <div class="n1-info">
          <article class="n1-panel"><div class="n1-label">Known · 已知</div><ul class="n1-lines"><li>单抽价格</li><li>肉眼可见奖项</li><li>部分剩余信息</li><li>自己的愿望与预算</li></ul></article>
          <article class="n1-panel accent"><div class="n1-label">Unknown · 阻碍决定</div><ul class="n1-lines"><li>录入是否完整</li><li>奖项余票是否守恒</li><li>真实命中概率</li><li>直购是否更合理</li></ul></article>
        </div>
        <div class="n1-decisions" aria-label="四种决策输出">
          <article class="n1-decision"><div class="n1-label">01 · DRAW</div><strong>抽 N 次</strong><p>控制投入，接受未命中</p></article>
          <article class="n1-decision"><div class="n1-label">02 · PACK</div><strong>包套</strong><p>用确定成本换取剩余奖项</p></article>
          <article class="n1-decision"><div class="n1-label">03 · BUY</div><strong>直接买</strong><p>比较二手价与期望成本</p></article>
          <article class="n1-decision"><div class="n1-label">04 · LEAVE</div><strong>离开</strong><p>信息不足或风险超预算</p></article>
        </div>
      </section>

      <aside class="n1-consequence" data-anim="consequence"><div class="n1-label">错误代价 · CONSEQUENCE</div><p>超预算 ｜ 错过目标 ｜ 为 Last 支付过高成本 ｜ 因信息不足留下不信任</p></aside>

      <section class="n1-bottom" data-anim="evidence">
        <div class="n1-evidence" aria-label="证据状态">
          <article class="n1-evidence-item"><strong>REPORTED</strong><p>公开讨论集中于余票不一致、Last、包套和直购。</p></article>
          <article class="n1-evidence-item"><strong>CALCULATED</strong><p>余票与目标数量成立时，可计算概率与成本。</p></article>
          <article class="n1-evidence-item"><strong>ASSUMED</strong><p>用户愿意拍照、确认字段并设置预算。</p></article>
          <article class="n1-evidence-item"><strong>UNKNOWN</strong><p>可接受拍摄张数、确认时长、最低信息量。</p></article>
        </div>
        <article class="n1-question primary"><div class="n1-label">当前最大未知</div><p>用户是否愿意为了更可靠的决定，完成一次结构化确认，而不是继续依赖直觉？</p></article>
        <article class="n1-question"><div class="n1-label">0.1 场景裁决</div><ol class="n1-checks"><li>线下付款前为主，线上截图兼容</li><li>目标奖与 Last 共用主流程</li><li>确认时长由原型测试验证</li></ol></article>
      </section>
    </main>

    <div class="t-meta" style="position:absolute;left:4vw;bottom:1.65vh;color:var(--text-helper)">AFFECTS → N2 / E1 / E2 / O2</div>
  </div>
</section>
`;

const startMarker = "<!-- ============ 示例:第 1 页";
const start = html.indexOf(startMarker);
const end = html.indexOf("\n</div>\n\n<div id=\"nav\">", start);
if (start < 0 || end < 0) throw new Error("Could not locate template slide region");
html = `${html.slice(0, start)}${slide}${html.slice(end)}`;
html = html.replaceAll("[必填]", "");
fs.writeFileSync(outputPath, html, "utf8");
console.log(outputPath);
