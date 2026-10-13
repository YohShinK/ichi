# V2 Production Hot-start Direction｜Founder Decision

日期：2026-10-02（Asia/Shanghai）。状态：`FOUNDER_APPROVED / PLANNING_DIRECTION_FROZEN`。唯一实施计划仍为 `memory-bank/implementation-plan.md`。

批准来源：Founder 在本聊天明确要求“执行 markdown 文件中的任务”，指向 `/Users/cunfu/Downloads/ICHI_TASK-V2-21及后续任务重构_热启动路线_认知对齐_总命令.md`。输入 SHA-256：`942b0f717e1045b000b042f20928d1fa9adc0efbbb008bea2cff1b14dc729dd7`。本文件记录该命令已确定的产品决定，不把附件中的示例字段当作已冻结 runtime schema。

## 1. TASK21 决策收口

- `PRE_PILOT_CLOSURE = PASS / HUMAN_APPROVED / FROZEN`；技术证据来自 2026-10-01 [最终收口](../delivery/v2-e-task-21-pre-pilot-final-closure.md)，本轮不重跑、不扩大其范围。
- `CLOSED_PILOT = WAIVED_BY_FOUNDER / NOT_RUN`。
- `CLOSED_PILOT_EVIDENCE = GAP_ACCEPTED_BY_FOUNDER`。
- `TASK-V2-21 = COMPLETE / HUMAN_APPROVED / PRE_PILOT_PASS / CLOSED_PILOT_WAIVED_BY_FOUNDER / EVIDENCE_GAPS_ACCEPTED`。
- Closed Pilot 的 participant allowlist、bounded user gray test、discovery time/value、真实多用户误解、自然用户任务、pilot cost/scale、pilot 专用 Freshness/PublicLocation 校准与 RC 决策不再是 TASK22 前置门。
- waiver 是 Product Gate 的显式关闭，不是 empirical evidence。历史 `EXTERNAL_USER_N=0 / LOWER_CONFIDENCE` 和未测设备、账号、慢网、规模数值、端上完整 latency 等缺口按原始报告保留；不补 PASS。
- 不要求取得旧 Closed Pilot RC approval 后才进入 TASK22；最终生产 release readiness 由新版 TASK22 验证并由 Founder 验收。

## 2. TASK22 方向与任务边界

`TASK-V2-22 = READY / NOT_STARTED / PRODUCTION_CONVERGENCE_AND_HOT_START_DIRECTION_APPROVED`。

TASK22 负责 Production Backend Convergence、Unified Source Projection、Official NETWORK Hot-start Seeding 与 Production Release Closure。仅在 TASK22 内使用 Phase 名称，不创建 22A/22B/23 等 canonical TASK_ID。

进入条件为 TASK19/20 当前有效人工验收、TASK21 Pre-Pilot PASS、本次 Closed Pilot waiver/缺口接受及生产方向批准。生产实现仍待 Founder 下一条命令，本次只完成规划与认知对齐。CloudBase、部署、数据写入/迁移、Git 与微信发布各项外部动作不因方向批准获得授权。

## 3. One ICHI Backend 与生产提升

One ICHI Backend 保持三层：

| 层 | 职责 |
| --- | --- |
| Private / Source | V1 Account/WeChat identity/Profile、recognition/upload source records、raw/private board facts 与 provenance |
| V2 Domain / Projection | Verification、VerifiedBoard、BoardInstance Resolution、OpportunityEvaluation、FreshnessEvaluation、Public Eligibility、Moderation、Projector |
| Public Map | sanitized PublicMapLead 驱动 Marker、Filters、Detail |

shadow/candidate 是已验证的参考实现与测试资源，不能把 synthetic/rehearsal rows 复制为 production。不得把全部 V1/V2 数据扁平化到一个 collection；小程序地图不得直读 V1 private collection。

TASK22 Phase 1 审计 shadow-tested function/collection 的 production 对应、可复用源码、transient/testing-only 资源与禁止提升数据，准备 production resource exact diff、config/secret/ACL/index/rate/read-stop/rollback 命名边界、artifact/SHA、migration/bridge/rollback runbook。每次外部 apply 前单独获准，之后 read-back；不沿用 synthetic caller/authority contract 作为 production 身份依据。

继续继承 D09 hybrid materialized public-safe core + request-time envelope；公开查询不在 request time join private Source/Verification/Rights/Profile/evidence。

## 4. PLAYER 持续桥接

PLAYER_SOURCE 是产品来源分组，保留既有 `V1_HISTORY / PLAYER_DIRECT / PLAYER_ASSISTED` provenance，不在本轮替换源码枚举。

- DRAW_RECORD：P1 lineage + exact current APPROVED drawSubmissions、authoritative finalSnapshot/draw facts、observedAt/location、delete/current state、note/safety provenance。
- UPLOAD_RECORD：finalized direct P1 用户确认/修正 snapshot、recognition/correction provenance、observedAt/location/source、delete/current state；不要求虚构 assisted submission。
- 历史桥接只处理当前 authorization/share/public eligibility 合格记录，DO_NOT_SHARE 不公开，不 bulk-public private history；逐记录 fail closed，支持恢复、重跑与回滚。
- 新 upload/draw success 自动进入 production domain pipeline；后续 version/current/delete 变化必须传播，hide-first/tombstone/late-event guard 防止 V1 删除后 public resurrection。
- PLAYER 继续要求 SHARE、当前地图贡献条例同意和全部逐记录门禁；不改变一次性、版本化同意及无逐条 publish/withdraw 的已批准产品行为。

## 5. NETWORK OFFICIAL_CURATED

正式产品来源为 `NETWORK_SOURCE / OFFICIAL_CURATED`，UI label 为“网络上传”，使用 ICHI 官方/网络来源图标，contributor 为空，不建立 username=“网络上传”的普通 Account，也不伪造 PLAYER/Profile。

命令中的 sourceType=NETWORK、sourcePlatform=XHS、sourceLabel、curationOwner 等为语义示例；Phase 1—3 按现有 schema 风格审计，冻结可兼容 PLAYER 的 NETWORK variant 和版本升级方案。具体枚举/字段尚未实现。

NETWORK 不走 PLAYER 地图贡献条例或 Account/Profile consent；必须有官方 curator review、独立 item-level rights basis/evidence/version、provenance、takedown owner 与 Public Eligibility。Founder 准确性/入库批准不自动等于外部内容权利许可，公开可见不自动等于 rights PASS。source URL/rights evidence 默认 private，公开 board/evidence image 仍不进入 MVP。

PLAYER 与 NETWORK 都必须经过 Source Record → BoardObservation → Verification → VerifiedBoard → BoardInstance Resolution → OpportunityEvaluation → FreshnessEvaluation → Public Eligibility → Public Projection → PublicMapLead。从 VerifiedBoard 起复用同一 domain/policy，不允许 NETWORK 直接写 PublicMapLead；来源不产生 trust score 或 Opportunity 权重。

## 6. Founder 审核与 Codex workflow

后续先采集上海、小红书、文章发布时间最近 7 天、有可识别版面图、正文或地点标注足以确定抽赏地点、可结构化的候选；持续寻找直到 Founder APPROVE 50 个合格版面，不以找到 50 篇文章作为完成。

候选只进入本地 review artifact，例如 `artifacts/network-source/review-batch-YYYYMMDD/`；article screenshot、board crop、extracted data、source metadata、review decision 等文件布局在实现阶段冻结。PENDING/REJECTED/NEEDS_FIX 不写 production DB；只有显式 FOUNDER_APPROVED structured record 才可进入官方 ingestion 的验证门。

Review Card 必须并排展示原文证据与将入库数据，包含原文章/版面截图、source URL、文章发布时间/采集时间、地点原文/解析地点、IP/系列、各赏 remaining/总余票、大赏候选、提取备注、Opportunity/Freshness 预览及缺失/不确定项。Founder 是唯一准确性与入库终审人，决策 APPROVE / FIX_AND_APPROVE / REJECT。Codex 可建议 highPrizeTiers，必须由 Founder 确认/修正后才进入 Opportunity；模型不得自行批准。

规划仓库外观简单、可审计的 Codex Skill/workflow，支持 collect / review / publish：collect 去重、截图、提取并生成本地 batch；review 接收 Founder 明确决定；publish 只消费 APPROVED、reviewedBy=FOUNDER、reviewVersion/reviewedAt 绑定的 exact candidate，再做 schema validation、official ingestion、server Verification、projection、read-back。修正需重绑 review version；不允许批准旧版本后静默发布新内容。

该 workflow 支持上线后持续补充；不是地图管理功能，默认不做 Web CMS、小程序管理员页面或用户可见管理页。本轮不创建/运行 Skill，不设置采集自动化，也不抓取。

## 7. Dedupe、Resolution 与时间

- 相同 source URL：本地 source-level dedupe，不重复审核；URL 规范化规则待实现冻结。
- 不同 URL：独立 BoardObservation，即使同店/近坐标/同 IP/相似图片也不自动合并。Location 仅生成候选；唯一无 hard conflict 才 continue，无候选 new instance，多候选/不确定 AMBIGUOUS；Founder/human evidence 不覆盖 hard conflict。
- NETWORK 30 天是 public visibility ceiling，达到期限退出公开地图，query 不返回、detail/deep link unavailable；保留合规 Source/Observation/BoardInstance history/provenance，不 destructive delete。
- sourcePublishedAt、observedAt/observedAtBasis 与 Freshness anchor 的 deterministic 关系在实现阶段冻结。既有 published-time fallback 可作为明确标注的时间依据；不能把 sourcePublishedAt 写成已证明拍摄时刻，fetchedAt/verifiedAt 不能冒充观察时间。
- 禁止修改旧 Observation 时间续命；新的有效 Observation 可形成新 current state。期限按 NETWORK support 独立裁决，不误隐藏仍 eligible 的 PLAYER support；全部 support 消失则继承 hide/retire、新生命周期新 publicLeadId 规则。
- 用 injected/asOf clock + policyVersion 验证 30 天边界，无需真实等待 30 天；includeLowFreshness/缓存/旧 cursor 不得绕过 expiry。

## 8. 50 → 300 → actual publication

八个 Phase 的顺序为：Production Backend Convergence → Unified Source Schema + V1→V2 Continuous Bridge → NETWORK_SOURCE/OFFICIAL_CURATED → Founder-reviewed Collection → Official Network Source Ingestion Skill/workflow → Shanghai 50 Production Seeding Rehearsal → Nationwide 300 Hot-start Seeding → Actual Publication。

50 条只在 Founder 审核及各外部动作授权后 ingestion。验收覆盖 PLAYER 两路径、SHARE/DO_NOT_SHARE/consent/delete/update/no-resurrection；NETWORK metadata/标签/图标/无伪玩家、Marker/Detail/Opportunity/Freshness/PublicLocation/Filters/note/allowlist；同板更新/同店不同板/同店同款多板/AMBIGUOUS/null≠0/multiple contributor/latest valid state/hidden-deleted-expired；30 天 query/detail 退出、历史保留和新 observation；V1/V2/security/privacy/performance/rollback/真机。此前 provisional contract 只有在 50 条整体验收 PASS 后最终冻结。

随后按相同最近 7 天、照片/地点/结构化、Founder review、local-only rejects、rights/Verification/Resolution/expiry/takedown 标准扩展全国，目标为 300 个 Founder-approved、成功 ingestion 并通过 PublicMapLead 链路的合格版面。记录 approved/ingested/public-eligible/current-lead counts 与 BoardInstance 关系，不把重复 URL、历史修订或多个 Observation 强造为新实例凑数。全国 300 的首批 50 计数纳入方式在批次清单明确；不把目标静默改成“额外 300”。

300 条之后复核 consistency/read-back/count/schema/duplicate-BoardInstance/PublicLocation coverage/query-detail performance/package-cloud cost/privacy-security/true-device smoke，再 final regression、production deployment/read-back、bridge/migration status、privacy declarations、rollback、Git PR/merge main、微信 upload/review/actual publish、online source commit。每项外部动作独立授权；实际 PUBLISHED 确认之后才可授权创建 immutable tag。

## 9. Evidence Gate 与 supersession

EDG-01—06 的 V2-B contract-level PASS 与 TASK19/20/21 既有有限证据保留。仅能通过 Closed Pilot 取得的多用户理解/discovery-value/行动及 pilot cost/scale 证据标记 `WAIVED_BY_FOUNDER / NOT_RUN / EVIDENCE_GAP_ACCEPTED`，不能写 all EDG empirical PASS。可由生产验证取得的供给、geo/index、成本、位置、安全治理、rollback、真机证据迁至 TASK22 50/300 与最终 smoke 重验；生产技术门不得用 waiver 代替。

PDG-01—07 已批准语义保留。本次显式决定只 supersede Closed Pilot/旧 RC 前置门、NETWORK 一次性约 20 条路线及旧公开文案“网络来源”；NETWORK label/schema 变更须版本化实现，不静默放宽 allowlist。新增持续 curator workflow 由本次 Founder 决定开放，未修改 TASK01—20 原始合同/任务记录。

旧 TASK21 closed-pilot protocol、TASK19/20/21 delivery、Source/Rights/mapping/public service/network research 中的旧路线文字是历史依据：`SUPERSEDED BY FOUNDER DECISION 2026-10-02 / v2-production-hot-start-direction.md`，仅上述路线差异被取代，其余技术语义继续继承。认知对齐明细见 [Knowledge Alignment](../delivery/v2-e-task-21-22-knowledge-alignment.md)。

本轮 implementation/deploy/scrape/ingestion/migration/CloudBase mutation/Git mutation/WeChat release/tag 均为 0；只更新规划、决策、架构认知及当前状态文档。
