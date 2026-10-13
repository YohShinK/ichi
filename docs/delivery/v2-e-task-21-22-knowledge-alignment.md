# TASK21/22 Knowledge Alignment｜Production Convergence + Hot-start

日期：2026-10-02（Asia/Shanghai）。结论：`ALIGNMENT_COMPLETE / NO_UNRESOLVED_UPSTREAM_HARD_CONTRACT_CONFLICT`。

Founder决定源：[v2-production-hot-start-direction.md](../decisions/v2-production-hot-start-direction.md)。唯一实施计划：[implementation-plan.md](../../memory-bank/implementation-plan.md)。修订/pre-state/验证：[Plan Revision](v2-e-task-21-22-plan-revision.md)。本报告在完成计划修订后立即执行跨仓库认知对齐，不把代码可扩展性判断当作运行PASS。

## 1. 审阅范围与证据层级

| Topic / 审阅输入 | 使用方式 |
| --- | --- |
| 五份memory-bank | 当前状态/依赖/产品/技术/真实结构及completion；只更新受影响区段 |
| TASK19有效验收 | minimal-real-wechat-rehearsal-closeout、progress 2026-09-29 final ack；早期final-acceptance/final-closeout仅作pre-state时间线 |
| TASK20有效验收 | founder-final-closeout、最终acceptance/gap/V1 diff证据入口；保留accepted gaps，不新增真机PASS |
| TASK21有效验收与旧协议 | pre-pilot-final-closure、upload-only-v1-to-v2-audit、当前Opportunity决定/报告入口、closed-pilot-protocol；最终报告优先，旧协议不再执行 |
| Source / Rights与NETWORK research | v2-source-rights-model-contract、v2-data-source-verification-freshness-lifecycle；item-level rights/observedAtBasis/curator/takedown及旧一次性约20条差异 |
| V1→V2 mapping | v1-to-v2-map-field-mapping与TASK21 direct-upload实际字段审计；DRAW exact APPROVED组合、UPLOAD finalized direct快照，旧private consent不等于地图授权 |
| Domain / lifecycle / Resolution | v2-domain-model-contract、v2-lifecycle-semantics-contract、v2-board-instance-resolution-contract；source/observation/verified/instance分层、unique continuation、hard conflict、current支持/retire与late guard |
| PublicMapLead / PublicLocation | v2-public-map-service-contract、v2-location-model-contract、canonical D08/D09继承；marker/detail allowlist、private URL、四层位置、no public evidence image |
| Production serving / migration / release | v2-query-security-resource-migration-contract、TASK19资源/运行路由报告入口、canonical Critical Path/Completion/22；hybrid public-safe core、独立外部授权、read-back/rollback/publication-before-tag |
| Contribution / Consent / Moderation | TASK19 one-time-consent-final-revision、minimal-real-wechat closeout、TASK12 review packet、TASK21最终report/no-resurrection证据；PLAYER同意与NETWORK独立rights、10 distinct eligible reports |
| TASK08—18批准链与Client Map | canonical任务段落、TASK11/12 reference review、TASK18 closeout/500-budget边界、client public-map-contract/candidate-service；历史批准语义保留 |
| 当前代码兼容性读源 | packages/v2-map/src/types.ts、source-adapters.ts、verification/projector/public-api/authorization/migration；shadow submit/reconcile/public-read与client契约/parser定位；只读，未实现/运行云端 |

上述是合同/代码读源审计；Pre-Pilot/真机/云read-back/P0/P1结论只继承各报告实际执行范围。本轮没有live CloudBase核对、浏览器/设备验收或生产性能/成本结果。

## 2. Alignment Matrix

以下每行包含要求的七个维度；“兼容”表示保留语义可延伸，不表示production已经实现。D=design-document，T=tech-stack，A=architecture，P=implementation-plan，G=progress，F=本次Founder decision；“上游”均指保留原文的合同/报告。

| TOPIC | OLD_CANONICAL_ASSUMPTION | NEW_FOUNDER_DECISION | CURRENT_CODE/ARCHITECTURE_COMPATIBILITY | AFFECTED_DOCS | ACTION_TAKEN | REMAINING_IMPLEMENTATION_WORK |
| --- | --- | --- | --- | --- | --- | --- |
| 1 TASK21 Closed Pilot requirement | 真实bounded pilot/用户任务后才RC | 明确waiver，NOT_RUN/gap accepted | 属于产品/证据门变更，无需改变domain硬语义 | P/D/T/A/G/F；旧protocol | current gate重写；旧协议历史保留并supersede | 不运行旧Pilot；生产可验证证据转22 |
| 2 TASK21 current status | Pre-Pilot complete但Pilot/RC未批、22锁定 | 决策收口COMPLETE/HUMAN_APPROVED/PRE_PILOT_PASS/WAIVER/GAPS | 2026-10-01最终Pre-Pilot有限PASS已存在，非新empirical证据 | 五份current docs/F；最终delivery | 同步状态并保留NOT_RUN、safe-stop历史范围 | 无21实现；继续保留设备/行为缺口 |
| 3 TASK22 scope | 最后发布/tag，无feature expansion | production convergence/PLAYER-NETWORK/50-300/release八Phase | reference/source code可复用，production未连通 | P/D/T/A/G/F | 重写22完整职责/产物/验收，不新建ID | 按八Phase实现并分别验收 |
| 4 TASK22 dependency | 21 Closed Pilot gates/Founder RC approval | 19/20 accepted+Pre-Pilot PASS+waiver/gap/direction | 输入门改变，既有19/20批准不变 | P/G/F；旧21/20报告 | READY/NOT_STARTED，废止旧RC前置 | 下一实现命令/各外部动作授权 |
| 5 Critical Path | 19→20→21 pilot/RC→22 publish | 21 closure/waiver→22 convergence→50→300→production smoke→publish/tag | 技术依赖链可保持，Phase内串行证据门 | P/D/T/G/F | 重写critical path | 后续实际完成生产链与release |
| 6 V2 Completion Definition | bounded pilot供给成立、真实用户复验、不得绕过pilot | 显式waiver+production supply/50/300/真机/安全/rollback/发布 | 不削弱公开安全/平台门 | P/D/T/F | 重写completion并分开真实行为缺口 | 实际生产PASS与Founder剩余gap接受 |
| 7 EDG/PDG handling | all EDG实测/21 pilot closure，PDG已关闭 | Pilot独占项WAIVED/NOT_RUN/GAP，production项22重验 | contract-level PASS与empirical证据可分别保留 | P/F/G；上游gate记录 | 6项EDG逐项改owner/证据语义，已有PDG硬语义保留 | 冻结生产HA/rate/Freshness/cost/stop参数并实测 |
| 8 One ICHI Backend/layered boundary | shadow与V1生产隔离验证，尚未生产提升 | 私有源/Domain-Projection/PublicMapLead统一后端分层 | 与D04 split authority及D09 hybrid一致 | D/T/A/P/F；domain/query合同 | 解释后端合并含义并区分现状与规划 | 接线真实生产source/domain/public ports |
| 9 shadow→production promotion | 已测试shadow resources/synthetic only | 源码复用、资源审计/提升，测试数据不复制 | shadow authority/caller/dataOrigin不能原样生产化 | T/A/P/F；19resource reports | 新Phase1 promotion matrix/exact diff/runbook | function/collection/disposition/config/ACL/index/secret/rollback命名，artifact/SHA/授权/read-back |
| 10 PLAYER DRAW_RECORD | P1→exact current APPROVED submission/private draw事实 | 保持同一authority进入生产链 | adaptAssistedPublication已有版本/owner/status检查；production port未连接 | D/P/T/A/F；mapping/source-adapters | 明确复用而非重建或读取任意history | trusted private adapter/current/delete/安全provenance验证、实时桥事件 |
| 11 PLAYER UPLOAD_RECORD | finalized direct P1、无assisted submission；候选已测 | direct snapshot/correction来源正式进V2，保持仅上传显示 | adaptDirectPublication/reference及candidate已有；实际旧行缺map SHARE/consent不能默认补 | D/P/T/A/F；direct audit/mapping | 保留private authority与common gates | production直接路径、记录级公开门、note新安全/省略 |
| 12 NETWORK OFFICIAL_CURATED | 枚举存在，但provenance/VerificationInput假设player owner/path | 独立NETWORK variant/platform/official curator | NEEDS_VERSIONED_EXTENSION；不能用虚构owner凑现有interface | 五份/F；types/rights | 规划source variant，示例不强行替换枚举 | 审计schema/owner-null/时间/rights并构建server ingestion |
| 13 网络上传public representation | projector/public-api/client literal=网络来源 | UI网络上传+官方/网络图标，contributor为空 | 已有network sourceLabel/null recordType概念；新literal/parser/视觉尚不兼容 | D/T/A/P/F；D08/public/client | current决策supersede旧文案，指出未实现 | versioned serving/projection/client/parser与图标，安全回归，不静默放宽enum |
| 14 NETWORK不走PLAYER consent | Source/Rights已分来源，但参考输入owner-centered | 不依赖PLAYER条例/Account/Profile，独立curator/rights/eligibility | 产品rights合同本来允许NONE_IN_ICHI；runtime需分支 | D/T/A/P/F；rights/authorization | 明确只豁免PLAYER consent，不豁免rights/safety | 独立可信curator authority/rights assessment，防伪PLAYER |
| 15 Founder sole review authority | 原批次策展/rights review，未完整准确性审批workflow | Founder唯一准确性/入库终审且确认大赏 | 不是修改Verification truth，审批仍非public PASS/rights许可 | D/P/T/F；rights/opportunity | APPROVE/FIX_AND_APPROVE/REJECT与exact reviewVersion绑定 | 审批记录/失效规则/最终highPrizeTiers、server schema和验证 |
| 16 rejected candidate local-only | 旧internal研究/候选描述可能允许候选库 | PENDING/REJECTED/NEEDS_FIX仅本地，不进production | 可在ingestion前加独立边界，无上游技术冲突 | D/T/A/P/F | 明确review workspace与production分离 | 本地artifact布局/拒绝证据与publish whitelist负测 |
| 17 Codex Skill | 一次性network seeding；禁止持续ingestion需新Gate | collect/review/publish支持上线后持续补充 | 新Gate由本次显式方向决定打开，非自动crawler已实现 | 五份/F；旧source research | 纳入22 Phase5，仅规划 | 后续创建审计workflow/skill、幂等/review/version/read-back |
| 18 no backend CMS | moderation ops未来admin UI可能性 | 默认无Web CMS/小程序管理页 | ops authority/API与CMS界面可分离 | D/T/A/P/F；12review | 当前范围不纳入CMS | 用Codex artifacts/skill与trusted server操作支持治理 |
| 19 source URL dedupe | provenance有URL，local reviewed index未实现 | 同URL不重复采集/审核 | 与source identity、private URL边界相容 | D/P/T/F；rights/mapping | 明确source-level dedupe | URL规范化/已见索引/重试与review batch去重 |
| 20 BoardInstance Resolution | D04-A1 conservative unique continuation | 不同URL独立Observation，Location候选、hard conflict不可覆盖 | 完全继承上游；不按同店/图相似自动merge | D/A/P/F；resolution/board-instance | 保留语义与01—20 task block原文 | NETWORK版面输入接resolver、同款多板/歧义/Founder误判回归 |
| 21 NETWORK30-day expiry | Freshness age band/低时效过滤，非硬public expiry | 达30天退出地图，history/provenance保留，新Observation可更新 | 生命周期允许HIDDEN_BY_FRESHNESS且hide≠delete；现代码无该硬门 | 五份/F；lifecycle/projector/public-api | 新来源visibility policy待实现，明确时间basis不能伪造 | sourcePublishedAt/observedAt/anchor/timezone/边界、query/detail/cursor/cache/支持集/新ID/asOf测试 |
| 22 Shanghai50 rehearsal | 单区域约20条initial seeding及pilot目标 | 最近7天上海50个Founder-approved全链真机/后端验收 | 扩大验证路线，核心domain无需改语义 | D/T/A/P/G/F；network research | 22 Phase6及细项验收，provisional→最终freeze | 审核到50、独立生产写入许可、PLAYER/NETWORK/shared/expiry/regression/rollback实证 |
| 23 Nationwide300 hot-start | 扩大样本没有本次精确300目标 | 同标准全国300个approved且成功ingestion的合格版面 | Resolution会影响current lead数，不可用搜索篇数/强造Marker凑数 | 五份/F | Phase7、计数和一致性/性能/成本/smoke | batch target/50纳入计数、approved-ingested-eligible-current counts与instance audit |
| 24 V1→V2 continuous bridge | mapping/reference dry-run，旧计划偏migration | 历史eligible可重跑+每次未来success/version/delete传播 | source adapter/migration.ts只是reference，不是durable event bridge | 五份/F；mapping/migration/current audit | Phase2显式历史/未来两路径与防复活 | production event/reconcile/checkpoint/replay/idempotency/delete/rollback wiring |
| 25 no request-time private join | D09 materialized core+request envelope | 延续这一公开边界 | public-read/public-api支持独立public core；不能将production truth查询放到公开request | D/T/A/P/F；D09/public-read | 重申公开只读PublicMapLead | read-side ACL/index/visibility/RateLimit/secret绑定与负测 |
| 26 production deploy/read-back | 最后22deploy，资源边界候选已测 | convergence/seeding/release每个apply exact diff/artifact/SHA/单独授权/read-back | 现manifest为shadow candidate，不能当production清单 | T/A/P/G/F；19resource/runbook | 外部门与promotion/read-back/rollback职责扩写 | 构建生产制品、资源清单/config合并、apply/read-back/reverse hash/smoke |
| 27 WeChat release | 21 RC之后upload/review/publish | 50/300及production门后actual publication | 复用V1 release discipline，waiver不等于平台审核 | D/T/P/G/F；release/completion | Phase8与online source明确 | 隐私申明、最终真机/回归、各upload-review-publish独立授权/真实状态证据 |
| 28 Git/tag gate | 明确PR/merge/actual publication/tag门 | 保留独立授权，PUBLISHED后immutable tag | 无变化，规划不授权Git动作 | P/T/G/F；release基线 | 写明本轮0与未来门，no new TASK_ID | 明确授权PR/merge及tag；tag target匹配实际online commit |

## 3. 矛盾发现与处理

1. canonical TASK21 STATUS是Pre-Pilot COMPLETE，但TITLE/GOAL/ACCEPTANCE仍要求未运行的Closed Pilot/RC；TASK22又LOCKED。现已统一为21决策闭合/明确waiver、22 READY/NOT_STARTED。
2. plan §0/§1还停在TASK19 candidate binding blocked，§15/最新验收已经19/20冻结。现当前入口全部按最终有效报告对齐；不重写早期报告。
3. Critical Path、Completion、EDG和product验收仍要求真实pilot。现Closed Pilot独占项标waiver/gap、生产可验证项迁22；不声称all empirical EDG PASS。
4. Source/Rights/NETWORK research的“一次性约20条/不得持续采集需新Gate”、D08/mapping的“网络来源”是旧产品路线。Founder本次已显式打开持续curator workflow并改为50/300及“网络上传”。通过新decision/current docs建立有范围的supersession；上游原文保留，rights/隐私/Verification/Resolution硬语义继续有效。
5. D09-10历史流程第6步limited pilot不再强制，但shadow-first/no bulk-public、逐记录资格、read enablement fail closed、read-back和rollback不取消；生产50/300与smoke承担技术验证，用户行为缺口明确接受。
6. “网络不走玩家同意”可能被误读为无需权利门。现明确NETWORK独立item-level rights/provenance/curator/takedown/public eligibility；Founder准确性批准不自动授予外部内容再发布权。
7. 当前types.SourceProvenance/VerificationInput要求player-shaped owner/path、旧literal parser只接“网络来源”，不能直接装入NETWORK/新label。归类为版本化实现缺口，保留PLAYER exact authority，不用虚构Account消除类型差异。
8. 当前LOW Freshness可由includeLowFreshness返回，不能等同NETWORK30d隐藏。独立visibility ceiling覆盖query/detail/deep-link/旧cursor/cache/late projector，hide与history retention继续分开，PLAYER独立eligible support不能连带失效。
9. “冻结合同后入库”与“50条验收后才冻结”需区分。Phase1—5建立provisional contract以安全测试；50条全部验收后最终冻结，随后300沿用。未用规划冻结伪造production验证。

没有发现必须改变TASK01—20已批准技术语义的真实hard conflict。本次显式产品调整与未来版本化schema扩展不会否定immutable lineage、exact Verification、source-specific rights、public allowlist、保守Resolution、hide/retire/no-resurrection或分层serving。因此TASK22不标BLOCKED；若后续promotion设计确实需要突破任一hard contract，则按BLOCKED/KNOWLEDGE_ALIGNMENT_CONFLICT交exact conflict。

## 4. 历史文档保护与当前文档更新

本轮只更新五份memory-bank及新增本报告、Plan Revision、Founder decision；具体区段见Plan Revision。上游合同/01—20任务块/历史报告不是本轮重写目标。

以下历史原文故意不修改：

- TASK19旧final-acceptance/final-closeout、各阶段resource/rehearsal/read-back和最终minimal-real-wechat报告。
- TASK20 device/session/final acceptance/gap/V1 diff/founder closeout。
- TASK21 pre-pilot-final-closure、reporting/Opportunity/UI/latency各报告、closed-pilot-protocol；其中“Closed Pilot is next / TASK22 locked / RC未批准”保留当时事实，路线已由本次decision supersede。
- Source/Rights、V1→V2 mapping、D04—D09、NETWORK source/freshness research及TASK08—18 review/closeout；旧路线/文案按本次有范围的supersession读取，其余批准技术语义继续继承。
- V1 Current Truth、R2 prompt/schema/resolver、Storage/private schema、生产发布证据、旧规划副本；不retroactively修改任何PASS/GAP。

验证采用本轮pre-state逐字hash：1686个既有文件只有五份memory-bank变化；20个TASK01—20 canonical段落SHA完全一致；新增仅三份Markdown，所有历史delivery/research/已有decision/code/config/resource/artifact未变。没有通过Git HEAD diff把原有dirty修改算作本轮。

## 5. 架构与data lineage兼容性结论

One ICHI Backend复用V1 private truth/identity并接入生产domain；PLAYER不同origin和NETWORK各自Source/Observation/Rights lineage不合并。统一Verification生成exact VerifiedBoard，Resolution只关联实体连续性；Opportunity/Freshness/公开资格独立裁决，PublicMapLead不是private truth。

历史桥接和新成功记录两条路径均在可信private端处理，公开端只读sanitized serving core。source URL只去重采集，不等于BoardInstance identity；跨URL/贡献者/来源更新可在同实例连续eligible support下保持public ID，全部support消失则hide/retire，新公开生命周期用新ID。NETWORK30d对过期support生效，不能续改旧时间或复活deleted/hidden/retired记录；有效新Observation或PLAYER support按现有current-state合同独立判断。

官方review材料的article screenshot/board crop只在本地私有审核区，不改变public image禁止或V1照片Storage/retention。新NETWORK note需要等价安全门；未PASS只省略字段，不借玩家V1 note安全结论。NETWORK地点原文/解析不冒充device-captured精确点，PublicLocation继续单独批准。

## 6. 未决实现选择与停止点

后续TASK22必须冻结并验证：production function/collection promotion与testing-only清单、ACL/index/config/secret/rate/read-stop/rollback、NETWORK schema variant与server curator authority、review exact version/批准失效/大赏/rights绑定、URL规范化与seen index、本地review artifact布局、observedAt/sourcePublishedAt/basis/anchor及30d边界、PLAYER continuous event/checkpoint/reconcile/delete路径、50/300计数/重复实例规则、实际cost/latency/HA与安全stop政策、版本化serving/parser/UI升级、migration/rollback/release runbook。

这些是获批方向内的后续设计/实现工作，当前不虚构数值、观察时间、真实供给或运行证据，不将它们误标upstream contract conflict。50/300批准与成功ingestion目标尚未发生；remaining user-behavior/device等缺口按原报告和release时Founder明确接受管理。

本轮workflow/触及8份文档格式/diff/链接/28项coverage/上游任务与历史保护核对PASS；产品代码回归/设备/云测试未重跑。**implementation/deploy/scrape/migration/ingestion/CloudBase mutation/Skill创建运行/Git mutation/WeChat发布/tag=0**。没有以本轮规划授权执行任何外部动作。

最终TASK21为COMPLETE/HUMAN_APPROVED/PRE_PILOT_PASS/CLOSED_PILOT_WAIVED_BY_FOUNDER/EVIDENCE_GAPS_ACCEPTED；TASK22为READY/NOT_STARTED/PRODUCTION_CONVERGENCE_AND_HOT_START_DIRECTION_APPROVED。当前V2-E仍IN_PROGRESS，生产实现未启动。

下一Codex从**修订后的TASK22 Phase 1｜Production Backend Convergence**开始，先production promotion/provisional contract与exact resource/bridge/rollback方案；不从旧Closed Pilot协议开始。本轮等待Founder下一条命令。
