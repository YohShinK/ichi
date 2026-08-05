import fs from "node:fs";
import path from "node:path";

const root = import.meta.dirname;
const manifestDir = path.join(root, "manifests");
const templatePath = "/Users/cunfu/.codex/skills/guizang-ppt-skill/assets/template-swiss.html";
const ids = ["N2", "E1", "E2", "O1", "O2"];

const esc = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");
const list = (items, cls = "atlas-list") => `<ul class="${cls}">${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
const label = (text) => `<div class="atlas-label">${esc(text)}</div>`;

const css = String.raw`
  /* Product Atlas single-page projections · Swiss IKB */
  .atlas-page .canvas-card{padding:3.2vh 4vw 4.8vh}
  .atlas-page .chrome-min{margin-bottom:1.6vh}
  .atlas-head{display:grid;grid-template-columns:minmax(0,7fr) minmax(340px,5fr);gap:3vw;align-items:end;border-top:12px solid var(--accent);padding-top:1.55vh}
  .atlas-title{font-family:var(--sans),var(--sans-zh);font-weight:200;font-size:min(4.25vw,7.55vh);line-height:.98;letter-spacing:-.035em;color:var(--text-primary)}
  .atlas-contract{font-family:var(--sans),var(--sans-zh);font-size:clamp(18px,1.05vw,21px);line-height:1.48;font-weight:400;color:var(--text-secondary);border-left:3px solid var(--accent);padding-left:1.2vw}
  .atlas-label{font-family:var(--mono);font-size:14px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--text-helper);margin-bottom:.55vh}
  .atlas-label.accent{color:var(--accent)}
  .atlas-copy{font-family:var(--sans),var(--sans-zh);font-size:clamp(16px,.9vw,18px);font-weight:500;line-height:1.42;color:var(--text-primary)}
  .atlas-list{list-style:none;display:flex;flex-direction:column;gap:.48vh}
  .atlas-list li{font-family:var(--sans),var(--sans-zh);font-size:clamp(16px,.78vw,16px);font-weight:500;line-height:1.34;color:var(--text-secondary);padding-left:.95em;position:relative}
  .atlas-list li::before{content:"";position:absolute;left:0;top:.62em;width:6px;height:1px;background:currentColor}
  .atlas-panel{background:var(--grey-1);padding:1.1vh 1vw;min-width:0}
  .atlas-panel.white{background:var(--paper);border-top:1px solid var(--ink)}
  .atlas-panel.ink{background:var(--ink);color:var(--paper)}
  .atlas-panel.ink .atlas-label,.atlas-panel.ink .atlas-list li,.atlas-panel.ink .atlas-copy{color:var(--paper)}
  .atlas-panel.accent{background:var(--accent);color:var(--accent-on)}
  .atlas-panel.accent .atlas-label,.atlas-panel.accent .atlas-list li,.atlas-panel.accent .atlas-copy{color:var(--accent-on)}
  .atlas-foot{position:absolute;left:4vw;right:4vw;bottom:1.55vh;display:flex;justify-content:space-between;color:var(--text-helper)}

  /* N2 · S08 */
  .n2-layout{flex:1;min-height:0;display:grid;grid-template-rows:auto minmax(310px,34vh) minmax(250px,29vh) auto;gap:1.15vh}
  .n2-mapping{display:grid;grid-template-rows:repeat(4,1fr);border-top:1px solid var(--ink);border-bottom:1px solid var(--ink)}
  .n2-pair{display:grid;grid-template-columns:1fr 42px 1.35fr;gap:1vw;align-items:center;border-bottom:1px solid var(--border-subtle);padding:.8vh 0}
  .n2-pair:last-child{border-bottom:0}.n2-surface,.n2-task{font-family:var(--sans),var(--sans-zh);font-size:clamp(17px,1vw,20px);font-weight:500;line-height:1.35}.n2-task{color:var(--text-primary)}
  .n2-arrow{font-family:var(--mono);font-size:20px;color:var(--accent);text-align:center}
  .n2-columns{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--grey-2)}
  .n2-columns .atlas-panel{padding:1.15vh 1vw}
  .n2-unknown{background:var(--accent);color:var(--accent-on);padding:1vh 1vw;display:flex;align-items:center;justify-content:space-between;gap:2vw}
  .n2-unknown .atlas-label{color:rgba(255,255,255,.72);margin:0}.n2-unknown p{font-size:clamp(17px,.95vw,19px);font-weight:500}

  /* E1 · S13 */
  .e1-layout{flex:1;min-height:0;display:grid;grid-template-rows:auto minmax(340px,38vh) minmax(255px,29vh);gap:1.35vh}
  .e1-main{display:grid;grid-template-columns:minmax(320px,4fr) minmax(0,8fr);gap:1.2vw}
  .e1-hero{background:var(--accent);color:var(--accent-on);padding:2vh 1.5vw;display:flex;flex-direction:column;justify-content:space-between}
  .e1-hero .big{font-family:var(--sans);font-size:min(7vw,12vh);font-weight:200;line-height:.86;letter-spacing:-.05em}.e1-hero .selected{font-family:var(--mono);font-size:14px;font-weight:600;letter-spacing:.16em}
  .e1-directions{display:grid;grid-template-rows:repeat(3,1fr);gap:1px;background:var(--grey-2)}
  .e1-direction{background:var(--grey-1);padding:1.2vh 1.15vw;display:grid;grid-template-columns:1.1fr 1.45fr 1.45fr auto;gap:1vw;align-items:center}
  .e1-direction.is-selected{background:var(--paper);border-left:6px solid var(--accent)}
  .e1-direction strong{font-size:clamp(18px,1.12vw,22px);font-weight:500}.e1-direction p{font-size:clamp(16px,.78vw,16px);line-height:1.35;font-weight:500;color:var(--text-secondary)}
  .e1-direction .decision{font-family:var(--mono);font-size:14px;font-weight:600;color:var(--accent);text-align:right}
  .e1-bottom{display:grid;grid-template-columns:4.5fr 3.2fr 4.3fr;gap:1px;background:var(--grey-2)}
  .e1-loop{display:grid;grid-template-columns:1fr 1fr;gap:.45vh .8vw;counter-reset:step}.e1-loop div{font-size:16px;font-weight:500;line-height:1.35;padding-left:1.7em;position:relative}.e1-loop div::before{counter-increment:step;content:counter(step,decimal-leading-zero);position:absolute;left:0;color:var(--accent);font-family:var(--mono);font-size:14px;font-weight:600}

  /* E2 · S11 */
  .e2-layout{flex:1;min-height:0;display:grid;grid-template-rows:auto minmax(190px,21vh) minmax(250px,28vh) minmax(235px,27vh);gap:1.2vh}
  .e2-flow{min-height:0!important;flex:none!important;border-top:1px solid var(--border-subtle);border-bottom:1px solid var(--border-subtle)}
  .e2-flow .tl-row{grid-template-columns:repeat(4,1fr)!important}.e2-flow .th-node .label{width:20vw!important;gap:.35vh!important}.e2-flow .th-node.up .label{bottom:calc(50% + 14px)!important}.e2-flow .th-node.down .label{top:calc(50% + 14px)!important}.e2-flow .th-node .name{font-family:var(--sans),var(--sans-zh);font-size:clamp(18px,1.08vw,21px)!important;font-weight:500!important}.e2-flow .th-node .desc{font-size:16px!important;font-weight:500!important;line-height:1.24!important}.e2-flow .th-node .dot{border-radius:0!important;width:10px!important;height:10px!important}
  .e2-states{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(2,1fr);gap:1px;background:var(--grey-2)}
  .e2-state{background:var(--grey-1);padding:1vh 1vw}.e2-state strong{font-family:var(--mono);font-size:14px;color:var(--accent);letter-spacing:.08em}.e2-state p{font-size:16px;font-weight:500;line-height:1.34;color:var(--text-secondary);margin-top:.45vh}.e2-state p b{color:var(--text-primary);font-weight:600}
  .e2-bottom{display:grid;grid-template-columns:4fr 4fr 4fr;gap:1px;background:var(--grey-2)}

  /* O1 · S05 */
  .o1-layout{flex:1;min-height:0;display:grid;grid-template-rows:auto minmax(300px,34vh) minmax(315px,36vh);gap:1.35vh}
  .o1-layers{display:grid;grid-template-columns:repeat(3,1fr);gap:1.2vw}
  .o1-layer{background:var(--grey-1);padding:1.6vh 1.25vw;display:flex;flex-direction:column}.o1-layer.ai{background:var(--accent);color:var(--accent-on)}.o1-layer.ai .atlas-label,.o1-layer.ai li,.o1-layer.ai .not{color:var(--accent-on)}
  .o1-layer h2{font-family:var(--sans);font-size:min(3vw,5.3vh);font-weight:200;line-height:1;margin-bottom:1vh}.o1-layer .not{border-top:1px solid currentColor;margin-top:auto;padding-top:1vh;font-size:16px;font-weight:500;line-height:1.35;color:var(--text-secondary)}
  .o1-bottom{display:grid;grid-template-columns:2.6fr 2.8fr 3.1fr 3.5fr;gap:1px;background:var(--grey-2)}
  .o1-stack{display:flex;flex-direction:column;gap:1vh}.o1-sub{border-top:1px solid var(--border-subtle);padding-top:.75vh}

  /* O2 · S15 */
  .o2-layout{flex:1;min-height:0;display:grid;grid-template-rows:auto minmax(550px,61vh) minmax(92px,10vh);gap:1.2vh}
  .o2-matrix{display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(3,1fr);gap:1px;background:var(--grey-2)}
  .o2-cell{background:var(--grey-1);padding:1vh .9vw;min-width:0}.o2-cell.accent{background:var(--accent);color:var(--accent-on)}.o2-cell.ink{background:var(--ink);color:var(--paper)}.o2-cell.accent .atlas-label,.o2-cell.accent p,.o2-cell.ink .atlas-label,.o2-cell.ink p{color:inherit}
  .o2-cell h3{font-size:clamp(18px,1.08vw,21px);font-weight:500;line-height:1.2;margin-bottom:.5vh}.o2-cell p{font-size:16px;font-weight:500;line-height:1.34;color:var(--text-secondary)}
  .o2-thresholds{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:var(--grey-2)}.o2-threshold{background:var(--paper);padding:.75vh .75vw;font-size:16px;font-weight:500;line-height:1.3;color:var(--text-primary)}
  @media(max-width:1100px){.atlas-page .canvas-card{padding:2.5vh 3vw 5vh}.atlas-title{font-size:min(4.8vw,8.4vh)}.atlas-head{grid-template-columns:6fr 5fr}.atlas-foot{left:3vw;right:3vw}}
`;

function head(m, contract) {
  return `<header class="atlas-head" data-anim="head"><div><div class="t-meta" style="margin-bottom:.7vh;color:var(--accent)">${esc(m.kicker)}</div><h1 class="atlas-title">${esc(m.title)}</h1></div><p class="atlas-contract">${esc(contract)}</p></header>`;
}

function chrome(m) {
  return `<div class="chrome-min tight"><div class="l">ICHI · PRODUCT ATLAS / NEO CORE</div><div class="r">${m.id} · ${esc(m.status)} · REV ${m.revision} · 01 / 01</div></div>`;
}

function foot(m) {
  return `<div class="atlas-foot t-meta"><span>${esc(m.question)}</span><span>SWISS IKB · ${m.layout}</span></div>`;
}

function renderN2(m) {
  const pairs = m.mappings.map((x, i) => `<article class="n2-pair"><div>${label(`0${i + 1} · 用户会说`)}<p class="n2-surface">“${esc(x.surface)}”</p></div><div class="n2-arrow">→</div><div>${label("真实任务")}<p class="n2-task">${esc(x.task)}</p></div></article>`).join("");
  const columns = [["支持判断", m.support, "white"], ["反证与替代", m.counterEvidence, ""], ["明确不解决", m.nonGoals, "ink"], ["核心假设", m.hypotheses, ""]].map(([t, items, cls]) => `<section class="atlas-panel ${cls}">${label(t)}${list(items)}</section>`).join("");
  return `<section class="slide light atlas-page" data-layout="S08" data-animate="duo-mirror"><div class="canvas-card">${chrome(m)}<main class="n2-layout">${head(m, m.contract)}<section class="n2-mapping" data-anim="mapping">${pairs}</section><section class="n2-columns" data-anim="evidence">${columns}</section><aside class="n2-unknown" data-anim="unknown">${label("当前最大未知")}<p>${esc(m.criticalUnknown)}</p></aside></main>${foot(m)}</div></section>`;
}

function renderE1(m) {
  const dirs = m.directions.map((d, i) => `<article class="e1-direction ${i === 1 ? "is-selected" : ""}"><strong>${esc(d.name)}</strong><p>${esc(d.answer)}</p><p>${esc(d.gap)}</p><div class="decision">${esc(d.decision)}</div></article>`).join("");
  const loop = `<div class="e1-loop">${m.loop.map((x) => `<div>${esc(x)}</div>`).join("")}</div>`;
  return `<section class="slide light atlas-page" data-layout="S13" data-animate="three-forces"><div class="canvas-card">${chrome(m)}<main class="e1-layout">${head(m, m.coreValue)}<section class="e1-main" data-anim="directions"><aside class="e1-hero"><div><div class="selected">APPROVED SELECTED</div><div class="big">B</div></div><p class="atlas-copy" style="color:var(--accent-on)">${esc(m.coreValue)}</p><div><div class="selected">0.1 SCOPE DECISION</div><p class="atlas-copy" style="color:var(--accent-on);margin-top:.5vh">${esc(m.scopeDecision)}</p></div></aside><div class="e1-directions">${dirs}</div></section><section class="e1-bottom" data-anim="scope"><div class="atlas-panel white">${label("0.1 核心闭环 · 6 STEP")}${loop}</div><div class="atlas-panel">${label("支撑能力")}${list(m.supportingCapabilities)}<div style="margin-top:1.2vh">${label("停止条件")}${list(m.stopConditions)}</div></div><div class="atlas-panel ink">${label("明确不做")}${list(m.nonGoals)}</div></section></main>${foot(m)}</div></section>`;
}

function renderE2(m) {
  const phases = m.phases.map((p, i) => `<article class="th-node ${i % 2 ? "down" : "up"} ${i === 0 ? "accent" : ""}"><span class="dot"></span><div class="label"><span class="yr">${esc(p.number)}</span><strong class="name">${esc(p.name)}</strong><span class="desc">${p.steps.map(esc).join("<br>")}</span></div></article>`).join("");
  const states = m.states.map((s) => `<article class="e2-state"><strong>${esc(s.state)}</strong><p><b>${esc(s.meaning)}</b><br>${esc(s.action)}</p></article>`).join("");
  return `<section class="slide light atlas-page" data-layout="S11" data-animate="timeline-walk"><div class="canvas-card">${chrome(m)}<main class="e2-layout">${head(m, m.criticalUnknown)}<section class="timeline-h e2-flow" data-anim="timeline"><div class="tl-row">${phases}</div></section><section class="e2-states" data-anim="states">${states}</section><section class="e2-bottom" data-anim="rules"><div class="atlas-panel white">${label("必须出现的确认点")}${list(m.confirmations)}</div><div class="atlas-panel">${label("异常与降级")}${list(m.fallbacks)}</div><div class="atlas-panel ink">${label("体验原则")}${list(m.principles)}<div style="margin-top:1.1vh">${label("最大待验证点")}<p class="atlas-copy">${esc(m.criticalUnknown)}</p></div></div></section></main>${foot(m)}</div></section>`;
}

function renderO1(m) {
  const layers = m.layers.map((l, i) => `<article class="o1-layer ${i === 1 ? "ai" : ""}">${label(`LAYER 0${i + 1}`)}<h2>${esc(l.name)}</h2>${list(l.does)}<p class="not"><b>不负责：</b>${esc(l.doesNot)}</p></article>`).join("");
  return `<section class="slide light atlas-page" data-layout="S05" data-animate="stack-build"><div class="canvas-card">${chrome(m)}<main class="o1-layout">${head(m, "人负责确认与决策；AI 只提取草稿；确定性逻辑负责计算、边界与降级。")}<section class="o1-layers" data-anim="layers">${layers}</section><section class="o1-bottom" data-anim="contracts"><div class="atlas-panel white o1-stack"><div>${label("输入契约")}${list(m.inputs)}</div><div class="o1-sub">${label("输出契约")}${list(m.outputs)}</div></div><div class="atlas-panel">${label("确定性规则")}${list(m.rules)}</div><div class="atlas-panel white o1-stack"><div>${label("AI 契约草案")}${list(m.aiContract)}</div></div><div class="atlas-panel ink o1-stack"><div>${label("架构边界")}${list(m.boundaries)}</div><div class="o1-sub">${label("Bad Cases")}${list(m.badCases)}</div></div></section></main>${foot(m)}</div></section>`;
}

function renderO2(m) {
  const cells = [];
  m.validationLayers.forEach((x, i) => cells.push(`<article class="o2-cell ${i === 0 ? "accent" : ""}">${label(`LAYER 0${i + 1} · ${x.name}`)}<h3>${esc(x.question)}</h3><p>${esc(x.signal)}</p></article>`));
  m.testTasks.forEach((x, i) => cells.push(`<article class="o2-cell">${label(`TEST 0${i + 1}`)}<h3>代表性任务</h3><p>${esc(x)}</p></article>`));
  m.gates.forEach((x, i) => cells.push(`<article class="o2-cell ${i === 2 ? "ink" : ""}">${label(x.name)}<h3>${esc(x.name)}</h3><p>${esc(x.definition)}</p></article>`));
  cells.push(`<article class="o2-cell">${label("CURRENT UNKNOWNS")}${list(m.unknowns)}</article>`);
  cells.push(`<article class="o2-cell">${label("APPROVAL GATE")}${list(m.approvalCriteria)}</article>`);
  const thresholds = m.thresholds.map((x, i) => `<div class="o2-threshold"><span class="atlas-label" style="color:var(--accent)">T${i + 1}</span>${esc(x)}</div>`).join("");
  return `<section class="slide light atlas-page" data-layout="S15" data-animate="matrix-fill"><div class="canvas-card">${chrome(m)}<main class="o2-layout">${head(m, m.coreOutcome)}<section class="o2-matrix" data-anim="matrix">${cells.join("")}</section><section><div class="atlas-label">ASSUMED THRESHOLDS · 初始阈值，不是已验证事实</div><div class="o2-thresholds">${thresholds}</div></section></main>${foot(m)}</div></section>`;
}

const renderers = { N2: renderN2, E1: renderE1, E2: renderE2, O1: renderO1, O2: renderO2 };

for (const id of ids) {
  const manifest = JSON.parse(fs.readFileSync(path.join(manifestDir, `${id}.json`), "utf8"));
  let html = fs.readFileSync(templatePath, "utf8");
  html = html.replace("</style>", `${css}\n</style>`);
  html = html.replace("[必填] 替换为 PPT 标题 · Deck Title", `ICHI Product Atlas · ${id}`);
  const start = html.indexOf("<!-- ============ 示例:第 1 页");
  const end = html.indexOf("\n</div>\n\n<div id=\"nav\">", start);
  if (start < 0 || end < 0) throw new Error("Could not locate template slide region");
  html = `${html.slice(0, start)}${renderers[id](manifest)}${html.slice(end)}`.replaceAll("[必填]", "");
  const output = path.join(root, `${id.toLowerCase()}-visual-v3.html`);
  fs.writeFileSync(output, html, "utf8");
  console.log(output);
}
