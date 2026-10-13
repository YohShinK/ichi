# ICHI V2 规划重构审核包

## 2026-09-12 V2-B Closeout Addendum（当前）

V2-B 已完成并通过人工验收；本补充取代本文下方所有关于 V2-A/V2-B 活动状态、TASK-V2-04—08 等待执行或 TASK-V2-09—22 全部锁定的历史描述。当前唯一计划仍为 `memory-bank/implementation-plan.md`，当前收口证据为 `docs/delivery/v2-b-closeout-review.md`：TASK-V2-04—08=`COMPLETE / HUMAN_APPROVED`，仅 TASK-V2-09=`READY / NOT_STARTED`，TASK-V2-10—22=`LOCKED / NOT_STARTED`，`V2_IMPLEMENTATION_STARTED=NO`。

## 2026-09-10 V2-A Execution Addendum（历史）

用户已批准 Revised V2-A Execution Plan，并在 Evidence 形成后对 TASK-V2-01—03 全部给出 `Continue`。本补充取代本文下方关于 V2-A “全部锁定／尚未开始”或“等待人工验收”的历史状态：TASK-V2-01—02 已人工批准，TASK-V2-03 技术方向已批准但三项外部证据待补；V2-A 进入 Final Closeout，V2-B—E 与 TASK-V2-04—22 继续 `LOCKED / NOT_STARTED`，生产实现仍未开始。

- TASK-V2-01 已改为定义 `VerifiedBoard + Freshness + OpportunityReason` 信息表达模型，不再比较方案 C 是否比方案 B 更有价值。
- `HIGH/MEDIUM/LOW/INSUFFICIENT` 是待人工批准的信息等级；score、weight、ranking、AI 和 PASS 映射未批准。
- TASK-V2-02 已重构为统一数据供给模型：ICHI 自有数据库承载 `V1_HISTORY/PLAYER_DIRECT/PLAYER_ASSISTED/NETWORK_SOURCE`；Source 只用于溯源，可信度只由 ICHI `NOT_VERIFIED→VERIFIED` 处理链决定，Freshness 统一从 observedAt 计算。
- NETWORK_SOURCE 仅是首次上线前的一次性三阶段 Initial Data Seeding：单区域约 20 条链路验证 → 扩大样本 → 处理后导入与发布；不代表上线后的持续自动采集。
- 上海／14 天／30 条合格记录／10 个 Confirmed Venue／两条玩家路线各至少 5 条是 `PILOT_READINESS_TARGET`，不是 V2-A 完成条件。
- 当前证据入口为 `docs/research/v2-a/`；production runtime/resource/config diff 必须保持 0。

> 状态：`V2-A FINAL_CLOSEOUT / OPEN_EXTERNAL_EVIDENCE`
>
> 日期：2026-09-10
>
> 唯一 current plan：`memory-bank/implementation-plan.md`
>
> 当前工作集：TASK-V2-01—02 `COMPLETE / HUMAN_APPROVED`；TASK-V2-03 `CONTINUE_APPROVED / EXTERNAL_EVIDENCE_PENDING`；TASK-V2-04—22 `LOCKED / NOT_STARTED`
>
> `V2_PRODUCTION_IMPLEMENTATION_STARTED = NO`

本审核包只解释当前计划的推导、旧任务去向、Gate、领域边界与依赖。它不拥有独立执行权；任务状态始终以唯一 current plan 为准。

## A. 当前基线

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| 工作区 | `/Users/cunfu/Documents/ichi 2`；single worktree | `git rev-parse --show-toplevel` |
| 分支 | `feature/v2-board-map` | `git branch --show-current` |
| HEAD / origin/main / merge-base | `929d189a06e13010e50abf4927bfec3b1ebd49fc` | fetch 后三者一致 |
| V1 truth | 37 条 Current Truth 已完成 code/test/contract/Git/release 校验 | 三份 V1 truth 文档 |
| V1.0.0 | `PUBLISHED / FROZEN`；tag → `03942f…` | Git/release evidence |
| V1.0.1 | `UPLOADED=YES`、`APPROVED=YES`、`PUBLISHED=UNCONFIRMED`、无 tag | 用户状态 + Git |
| 当前改动 | Markdown/docs/Memory Bank only | status/name-status/scope check |
| V2 runtime | `0 / NOT_STARTED` | runtime/backend diff=0 |
| Frozen R2 | Prompt/Schema/Resolver 三 SHA 精确匹配 | sha256 read-back |
| Historical stash | 两个保留，未恢复／删除 | `git stash list` |
| Planning validation | workflow PASS；quality PASS；57 files / 571 tests；22/22 tasks × 28 fields | local validation |

结论：`V2_PLANNING_RECONSTRUCTION_BASE_SAFE = YES`。

## B. `V2_CAPABILITY_DELTA`

### 产品概念修正

好版地图不是“哪里有一番赏”的普通地点地图，而是“哪里存在经过验证、具有抽赏决策价值的版面机会”。其闭环固定为：

```text
用户拍摄版面
→ V1 Recognition / Board Data / Draw Events / Submission Verification
→ Current Publication
→ Verified Board
→ Opportunity Evaluation
→ Public Candidate
→ V2 Public Eligibility Check（可停在 PENDING_CONSENT）
→ exact public preview Consent
→ Public Eligibility 最终通过
→ Projection → PublicMapLead
→ 地图展示 Verified Board Opportunity
→ 帮助其他用户到场核对并作抽赏决策
```

地图最小价值单位是 `Verified Board Opportunity`，不是店铺、marker 或普通地点。它至少共同表达 IP／赏种、剩余状态、观察时间、抽赏价值、venue、public location 与 freshness，并明确不是实时库存。`真实性 ≠ 机会／推荐价值`，两者又都不等于公开安全；“抽赏价值”是基于真实数据的独立、可解释判断，不改变 Verified Board 事实，也不是中奖保证或实时库存结论。

第一阶段只定义 `Rule-based Opportunity Evaluation` 的信息表达方向：候选输入包括大奖剩余数／比例、总余票、单抽价、确定性包套总价、观察时间和 freshness；候选输出研究 `HIGH / MEDIUM / LOW / INSUFFICIENT`。当前不决定 score 公式、阈值、权重、ranking、推荐排序或 AI／黑盒评分，也不预先决定哪些离散状态映射为 Opportunity PASS。

### `ALREADY_EXISTS_AND_REUSE`

Account/Identity/ICHI ID/ownership、optional Profile/default fallback/stable avatar fileID/nickname safety/no-phone、quota、camera/private image transport、R2/manual fields/null semantics、Local Board/boardId/events/storage/My Records、probability Core/Board Outlook/reminder subset、versioned Submission/LOCATION/PHOTO/NOTE、P1/recordId/recordCode/publishedSubmissionVersion/Seven Rules/failed isolation/delete/no-resurrection/My Uploads、private text/location/ACL/Storage、三 Tab sharing、package/quality/true-device/deploy/Git gates。

### `NEEDS_V2_EXTENSION`

public contributor policy、optional Profile disclosure、public detail sharing、venue/public precision、private-to-public consent/eligibility/projection/moderation、public field safety、hide-first deletion、viewport/filter/detail/location stale guards。

### `NET_NEW_V2`

VerifiedBoard、OpportunityEvaluation 方向、Verified Board Opportunity value/supply/platform Evidence、Opportunity-pass PublicCandidate、public scope/consent/preview、Candidate/ConfirmedVenue、PublicMapLead/publicLeadId/projector/tombstone/moderation、bounded viewport/detail API、geo/index/rate/abuse/cache、map client state/UX/SDK/deep link/clustering，以及 V2-specific security/true-device/pilot/release。

## C. 旧 V2 → 新 V2 Mapping

### C1. Historical V2-00—V2-20 完整映射

| OLD_TASK_ID | OLD_TITLE | OLD_GOAL | CURRENT_V1_TRUTH_IMPACT | DECISION | WHY | NEW_TASK_ID / TARGET | NEW_DEPENDENCIES | PRODUCT_IMPACT | ARCHITECTURE_IMPACT |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `V2-00` | 公开账号／贡献／提醒／分享范围 | 冻结 V2 账号与公共增量 | Account/Profile/sharing 已由 V1 完成；提醒未验证 | `SPLIT / MODIFY / ALREADY_COMPLETED_IN_V1 / DEFER` | 不重做账号，公开披露与 extras 必须分门 | 04、07、15、17；提醒/海报 DEFER | 01—03 | Profile 不 gate；extras 不进入默认完成 | public policy 与 consent 独立于 private identity |
| `V2-01` | 公开案例研究 | 研究好版线索发现 | 仍未由 V1 验证 | `KEEP / MOVE / MODIFY` | 应成为第一阶段 Evidence | 01 | plan approval | 明确 discovery value | 无 runtime |
| `V2-02` | 用户访谈 | 验证非实时理解 | 仍未由 V1 验证 | `KEEP / MERGE` | 与案例研究共同产出 EDG-04 | 01 | plan approval | 建立 misunderstanding stop rule | 无 runtime |
| `V2-03` | 合规与平台评审 | 条款、隐私、缓存、登录、提醒、分享 | V1 已解决 login/profile；public/geo 仍新增 | `SPLIT / MODIFY` | legal supply、platform、privacy、release 依赖不同 | 02、03、04、07、22 | 01—03 | 移除旧 login 假设 | provider/resource/privacy 分层 |
| `V2-04` | 合法供给路线 | 证明可持续可下线供给 | V1 private data 没有 public rights | `KEEP / MOVE / MODIFY` | 必须前置为 Evidence Gate | 02 | plan approval | 无供给则 Stop | 无 public write |
| `V2-05` | 大型 V2 数据字典 | Account/Profile/Contribution/Board/Watch 等模型 | 账号、Submission、P1 已存在；Canonical/Watch 未获批 | `SPLIT / MODIFY / DEFER` | 只规划真实 public delta | 05—08；Canonical/Watch DEFER | 04 | 减少无证据 scope | private truth、consent、venue、public model 分离 |
| `V2-06` | 公共 CloudBase 资源 | 建集合、审核、快照、提醒资源 | V1 13 集合全部 private，无 public API | `SPLIT / MOVE` | contract 必须先于 resource | 09、11—13 | 05—08 | 只服务 core map | resource/index/projector/API/ops 分离 |
| `V2-06A` | 公开 ICHI ID 与账号扩展 | 公开资料、贡献状态、账号删除 | identity/Profile edit 已完成；公开展示未决定；delete UI 不存在 | `ALREADY_COMPLETED_IN_V1 / MODIFY` | 不重做账号，只处理 disclosure/control | 04、07、15 | 01、04—07 | contributor 可隐藏 | private account 与 public identity policy 分离 |
| `V2-06B` | 账号资料页 | ICHI ID、昵称、头像、默认资料 | Profile 页／编辑基础已完成 | `ALREADY_COMPLETED_IN_V1 / DELETE / MODIFY` | 旧实现任务删除；仅 public disclosure 仍需决定 | 07、15 | 04—07 | Profile 完整度不阻塞地图 | 无新 Profile storage |
| `V2-07` | 玩家／门店上传 | 建 private draft、位置与证据上传 | 玩家 private submission/verification 已完成；public consent/venue 未实现 | `ALREADY_COMPLETED_IN_V1 / SPLIT / MODIFY` | 复用 intake，不复制旧 ContributionDraft | 02、05、06、10、15 | 01—09 | 首发 supply 由 Evidence 决定 | P1 lineage + new consent，不按 boardId 覆盖草稿 |
| `V2-08` | 赏票 OCR 评估 | OCR 与本机抽取比对 | LOCATION/PHOTO/NOTE exact verification 已在 V1 完成 | `ALREADY_COMPLETED_IN_V1 / DELETE` | 不把已完成 private verify 当 V2 新功能 | 07、12 仅消费结果 | 04—07 | 不增加 OCR scope | private APPROVED 不等于 public moderation |
| `V2-09` | 贡献状态／审核／发布隔离 | 本人列表、审核、地图发布 | My Uploads/P1/failed isolation 已完成；public lifecycle 未完成 | `SPLIT / MODIFY` | private 与 public 状态必须独立 | 05、10—12、15 | 04—14 | 明确 pending/public/withdrawn | consent/projector/moderation 分层 |
| `V2-10` | 历史观察时间 | freshness 与非实时展示 | observedAt 已有 private fact；public copy 未实现 | `KEEP / MODIFY / MOVE` | 进入 field/model/API/UI contract | 07、08、13、16 | 05—14 | 不声称实时库存 | freshness 作为 public contract |
| `V2-11` | 下线与删除 | 删除、售罄、权利人下线 | V1 durable private delete 已完成 | `NEEDS_V2_EXTENSION / SPLIT / MOVE` | public hide/tombstone/deep-link 需新增 | 05、11、12、17 | 04—16 | owner 可撤回，公开先隐藏 | public tombstone + no-resurrection |
| `V2-12` | Next.js 地图低保真 | 先画地图／列表／详情 | UI 不得先于 public contract/API | `MODIFY / MOVE` | 去除 page-first 顺序 | 16 | 01、07—14 | 聚焦 core discovery | 只消费 public API |
| `V2-13` | 地图服务与地点置信度 | provider、location、permission | V1 location 只是 private capture geo | `SPLIT / MODIFY` | platform spike、venue、query、真机分开 | 03、06、09、17、20 | 01—16 | manual/city fallback 必须存在 | 四层 location + bounded geo |
| `V2-14` | 地图／列表／系列／时间筛选 | 实现筛选 | null/zero 与 bounded query 必须先冻结 | `MODIFY / MOVE / SPLIT` | contract/state/UI/scale 分层 | 09、13、14、16、18 | 05—15 | filter 只含获批字段 | server bounded + queryKey |
| `V2-15` | 详情与来源回链 | 展示来源和非实时提示 | 分享只允许 public-safe query；无 public detail API | `MODIFY / MOVE / SPLIT` | field/API/UI/deep link 分层 | 07、13、16、17 | 05—16 | withdrawn landing 明确 | detail by publicLeadId only |
| `V2-16` | 双端核心流程验证 | Next.js 与平台差异 | V1 已确立分层测试和真机独立 Gate | `SPLIT / MOVE` | 自动、真机、pilot 不能混为一项 | 19、20、21 | 10—18 | 真实设备是发布前门 | 独立 evidence matrices |
| `V2-16A` | 关注规则 | 地点／半径提醒 | V1 没有 map watch；价值未证明 | `DEFER` | 非 core map critical path | DEFERRED | future PDG | 不纳入 V2 完成 | 无 WatchRule resource |
| `V2-16B` | 订阅消息 | 微信提醒许可与投递 | 模板／运营／许可未验证 | `DEFER` | 先验证供给与地图价值 | DEFERRED | future PDG | 不纳入 V2 完成 | 无 NotificationDelivery |
| `V2-16C` | 地图详情分享 | public lead deep link | V1 general share 已完成，可扩展 | `MODIFY / NEEDS_V2_EXTENSION` | 只新增 publicLeadId allowlist 与失效态 | 17 | 07、13—16 | 保留最小安全分享 | 不携带 private IDs |
| `V2-16D` | 抽赏结果海报 | Canvas 海报与社交分享 | V1 package lesson显示资产成本；非地图依赖 | `DEFER` | 无 core supply/value 依赖 | DEFERRED | future PDG | 不纳入 V2 完成 | 无 poster assets/runtime |
| `V2-17` | 全面运营监控 | 登录、提醒、审核、分享、删除监控 | login/reminder scope 已变化 | `SPLIT / MODIFY` | 只保留 public map 必需 ops/perf/release | 09、12、18、19、21—22 | 05—18 | 最小运营边界 | audit/takedown/perf/release evidence |
| `V2-18` | 封闭试验 | 授权样本验证产品 | 仍必要，但须在安全／真机后 | `KEEP / MOVE / MODIFY` | pilot 必须后置且可撤回 | 21 | 19—20 | Continue/Adjust/Stop | bounded deployment |
| `V2-19` | 修复与公开发布检查 | 合规、隐私、双端回归 | 应拆成自动、真机、pilot、release、publication | `SPLIT / MODIFY` | 防止 tag/release 混在实现 Gate | 19—22 | 10—21 | 独立 release authority | staged candidate→production |
| `V2-20` | V3 决策 | V2 后决定社群 | 不属于 V2 实现／完成 critical path | `DEFER / MOVE` | 实际 V2 发布后另开决策 | post-V2；22 只记录 Evidence | 22 complete | 不自动启动 V3 | 无当前 V3 resource |

### C2. 2026-09-08 blocked draft 完整映射

| OLD_TASK_ID | OLD_TITLE / GOAL | CURRENT_V1_TRUTH_IMPACT | DECISION | NEW_TASK_ID / TARGET | NEW_DEPENDENCIES | PRODUCT / ARCHITECTURE IMPACT |
| --- | --- | --- | --- | --- | --- | --- |
| old `TASK-V2-01` | value/comprehension | 仍为 net-new Evidence | KEEP | 01 | plan approval | 明确 EDG-04 |
| old `TASK-V2-02` | supply/takedown | 仍为 net-new + P1 extension | KEEP/MODIFY | 02 | plan approval | 新增 EDG-06 |
| old `TASK-V2-03` | platform/geo/cost/package | 仍为 net-new | KEEP/MODIFY | 03 | plan approval | 同时产出 EDG-02/03/05 |
| old `TASK-V2-04` | gate closure | 仍必要 | KEEP/MODIFY | 04 | 01—03 | 7 PDG + 6 EDG，无循环 |
| old `TASK-V2-05` | consent/location/lifecycle | location 风险需独立 | SPLIT | 05、06、07 | 04 | consent、venue、fields 分离 |
| old `TASK-V2-06` | PublicMapLead | 仍为 net-new | KEEP/MOVE | 08 | 05—07 | 完整 field/location 前置 |
| old `TASK-V2-07` | API/resource contract | 仍为 net-new | KEEP/MODIFY | 09 | 03、08 | 明确 migration/rollback |
| old `TASK-V2-08` | owner backend | 仍为 extension | KEEP/MOVE | 10 | 05—09 | no-profile gate |
| old `TASK-V2-09` | projector | 仍为 net-new | KEEP/MOVE | 11 | 08—10 | monotonic/no-resurrection |
| old `TASK-V2-10` | moderation ops | 仍为 net-new | KEEP/MOVE | 12 | 07、10—11 | MVP minimal moderation |
| old `TASK-V2-11` | public API | 仍为 net-new | KEEP/MOVE | 13 | 09、11—12 | PublicMapLead-only |
| old `TASK-V2-12` | client state | 仍为 extension | KEEP/MOVE | 14 | 13 | request identity/generation |
| old `TASK-V2-13` | consent UX | 仍为 net-new | KEEP/MOVE | 15 | 10、12—14 | venue/precision explicit |
| old `TASK-V2-14` | combined map/platform | 过度合并 UI/SDK/perf | SPLIT | 16—18 | 13—17 | UI、platform、scale 分开 |
| old `TASK-V2-15` | combined quality/device/pilot | 三类 Gate 不可互相替代 | SPLIT | 19—21 | 10—20 | automated、true-device、pilot 分开 |
| old `TASK-V2-16` | release/publication/tag | release candidate 与 actual publication 顺序需明确 | KEEP/MODIFY | 22 | 21 + authority | publication-before-tag |

## D. 被删除／已完成旧任务

`ALREADY_COMPLETED_IN_V1`：

- 旧 V2 Account/login/ICHI ID 基础；
- Profile 默认资料、头像昵称编辑、stable fileID 与 nickname safety；
- recognition、quota、camera/private image transport、R2/manual fields；
- Local Board/My Records/draw events/core probability/Board Outlook；
- private Submission、LOCATION/PHOTO/NOTE verification、P1/My Uploads/failed isolation；
- durable private delete/no-resurrection；
- general three-tab friend/Timeline/copy sharing；
- package/quality/true-device/deploy/Git 基础门禁。

明确删除或延后：

- 旧 V2-08 “重做赏票 OCR”删除为实现任务，只把 V1 verify 当 private input；
- V2-16A/B/D reminders/subscription/poster 延后；
- CanonicalBoard、rich note/image、heavy appeal/SLA、merchant/staff 正式身份延后；
- 旧 Profile 页面重建删除，只保留 public disclosure/consent extension。

## E. Product Decision Gates

| Gate | 人工问题 | 推荐 | 当前状态 | Blocked |
| --- | --- | --- | --- | --- |
| `PDG-V2-01` | anonymous browse 或 Account required | anonymous minimal read；contribute 需 Account | OPEN | 05—22 |
| `PDG-V2-02` | contributor 是否／如何展示 | MVP 不展示 Profile | OPEN | 05、07—22 |
| `PDG-V2-03` | V1 history re-consent | 不自动回填，owner 逐条重新同意 | OPEN | 05、10—12、15、19—22 |
| `PDG-V2-04` | public image 是否首发 | NO；YES 需 explicit unlock | OPEN | 07—13、16—22 |
| `PDG-V2-05` | exact public fields | structured/minimal；no note/image/Profile | OPEN | 05—22 |
| `PDG-V2-06` | CanonicalBoard | DEFER | OPEN | 08—22 |
| `PDG-V2-07` | completion extras | core map + safe link only | OPEN | 04、16—22 |

## F. Evidence Gates

| Gate | Evidence | Producer | 当前状态 |
| --- | --- | --- | --- |
| `EDG-V2-01` | lawful/sustainable/removable supply | 02；21 revalidate | OPEN |
| `EDG-V2-02` | geo/index/bounded query feasibility | 03 | OPEN |
| `EDG-V2-03` | cost/package/query/ops budget | 03；18/21 revalidate | OPEN |
| `EDG-V2-04` | VerifiedBoard、Freshness 与 OpportunityReason 的组合可理解，能识别观察时间、非实时边界、事实理由和非推荐性质；外部用户价值与行动证据由 21 revalidate | 01；21 revalidate | OPEN |
| `EDG-V2-05` | venue/public precision feasibility | 03；06/21 revalidate | OPEN |
| `EDG-V2-06` | withdrawal/takedown operational feasibility | 02；12/21 revalidate | OPEN |

## G. V2 产品范围

### `IN_SCOPE`

Evidence-first Verified Board Opportunity value/Opportunity Model/supply/platform、Verified Board、Opportunity Evaluation、Opportunity-pass Public Candidate、explicit consent、Candidate/Confirmed Venue 与 public geo/precision、minimal structured allowlist、PublicMapLead/projector/moderation、bounded API、map/list/filter/detail、foreground location/manual fallback、safe detail link、scale/package/security/true-device/pilot/release。

### `OUT_OF_SCOPE`

实时库存保证、促抽排名、论坛社群、直接 private DB read/public write、R2/Storage frozen change、automatic cross-owner canonicalization、V3 version consensus。

### `DEFERRED`

reminders/subscription/poster、public image/rich note、CanonicalBoard/merge、heavy appeal/SLA、merchant/staff full identity、V3。

## H. 新 V2 Domain Model

| 对象 | 角色 | Authority / Visibility |
| --- | --- | --- |
| private P1 + exact APPROVED Submission | 私有权威事实 | private |
| `VerifiedBoard` | 经 V1 验证的可信版面事实；只回答 truth | private/service-only derived truth |
| `OpportunityEvaluation` | 判断真实版面是否具有机会价值；第一阶段只冻结 rule-based 方向 | private/service-only evaluation |
| `PublicCandidate` | 仅由 Opportunity PASS 的 Verified Board 派生、等待 public eligibility/consent | private/service-only |
| `PublicConsent` | exact preview/version/venue/precision 的 owner consent | private/auditable |
| `ConfirmedVenue` | 与 capture geo 分离的 venue/POI | private input；approved projection only |
| `PublicEligibilityDecision` | public rules/review result | private operations |
| `VerifiedBoardOpportunity` | Verified Board 经 Opportunity Evaluation 后形成的地图价值语义，不是普通地点或评分 | product/public semantics |
| `PublicMapLead` | Verified Board Opportunity 的 sanitized/query-optimized serving projection | public through API |
| `PublicLeadTombstone` | retire/no-resurrection | service-only |
| `PublicModerationAudit` | approve/reject/hide/withdraw/takedown audit | privileged |

## I. Public Source of Truth

- Authoritative Private Domain Truth：`P1 → publishedSubmissionVersion → exact APPROVED Submission`。
- V1 Verification 回答“这个版面数据是否真实”，产出 `VerifiedBoard`；Verified Board 可以是真实但 Opportunity LOW，也不授予公开权。
- Opportunity Evaluation 独立回答“这个真实版面是否具有抽赏机会价值”；只有满足后续获批 PASS 规则的 Verified Board 才生成 private/service-only `PublicCandidate`。
- V2 Public Authorization 回答“这个 exact public preview 是否适合公开”；完整流程为 `Current Publication → V1 Verification → Verified Board → Opportunity Evaluation → Public Candidate → Public Eligibility Check → Consent → final eligibility → Projection`。
- Public Eligibility 必须核对 Verified Board、Opportunity PASS、consent、public field allowlist、venue validity、public geo validity、freshness、privacy、moderation 与 withdrawal/delete propagation；consent 未完成时只能停在 `PENDING_CONSENT`。
- Public Serving Read Model：`PublicMapLead`，只含 allowlist、独立 consent/eligibility/moderation 与 servedVersion。
- Public API Read Source：只读 `PublicMapLead`；不读 Local Board、Submission history、private P1、PublicCandidate、recordCode、capture geo、private note/evidence。

## J. Consent / Venue / Privacy 方案

- 公开不是 `Submission APPROVED` 的副作用。进入公开地图必须同时满足：exact publication version 可解析、owner explicit consent、ConfirmedVenue 合法、字段 allowlist 通过、public eligibility/moderation 通过。
- consent 绑定 owner、publication lineage、exact `publishedSubmissionVersion`、公开预览、venue、public precision、policy version；任一关键输入改变都使旧 consent 失效。
- V1 历史 publication 不自动公开。是否允许逐条 re-consent 由 `PDG-V2-03` 决定；默认不批量迁移。
- `captureGeo`、`selectedVenue`、`publicGeo`、`queryGeo` 是四种不同语义。设备上传位置不得直接当店铺位置，精确 venue 不必等于公开精度，服务端查询点不对客户端公开。
- venue 流程是 `Capture Location → Candidate Venue → Confirmed Venue → Public Venue Label → Public Geo`；reverse geocode 只能提出候选，不能自动确认为店铺。
- nickname/avatar/phone/Profile completion 均不是 browse 或 contribution gate。`Public Contribution Attribution Policy` 由 `PDG-V2-02` 单独决定 anonymous、ICHI ID、nickname 或可选展示；V2 MVP 不把贡献者身份作为核心价值。
- 首发 public allowlist 的建议下限是：opaque public ID、公开 venue label、降低精度后的 geo、结构化 IP/theme/tier/freshness、明确的 non-real-time 文案；note、evidence、image、private IDs、recordCode、owner identity 默认不公开。

## K. `PublicMapLead` / `publicLeadId` Contract

`PublicMapLead` 是 `Verified Board Opportunity` 的派生、可撤回、可更新、可审核、可删除、查询优化公开读模型，不是 private publication 或 Public Candidate 的替代 authority。`publicLeadId` 是随机不透明公开标识，至少 128-bit entropy，不编码 `recordId`、`boardId`、`recordCode`、owner 或地理信息。

- 同一 publication lineage 同时最多 `0..1` active lead；不同 owner 不自动合并为 CanonicalBoard。
- projector 只接受比 `servedVersion` 更新且仍满足 consent/eligibility/moderation 的事件；乱序或迟到事件不得降级、复活或覆盖新状态。
- owner withdraw、private cloud publication delete、account delete、永久 takedown：先隐藏，再 retire `publicLeadId`，写 tombstone，公开 detail 返回统一失效态。
- 重新公开必须重新 consent、重新 eligibility/moderation，并生成新的 `publicLeadId`；旧 deep link 不复活。
- 临时管理员 hide 可在无公开 payload 状态下保留同一 ID 以便复核；解除前必须重验当前 exact version。
- public API 只能返回 `PublicMapLead` allowlist，不得 fallback private collections。

## L. 生命周期矩阵

| 事件 | Private truth | PublicMapLead 行为 | ID / stale 规则 | 地图可见性 |
| --- | --- | --- | --- | --- |
| local board created/updated | 仅 local/private | 无投影 | 无 `publicLeadId` | 不出现 |
| submission created/pending | versioned private candidate | 保持已有 current lead，不读 pending | 旧 servedVersion 不变 | 旧 lead 如仍有效则继续 |
| submission failed | failure isolated | 不更新 lead | failed version 永不推进 pointer | 不消失、不半更新 |
| submission approved but not current | private approved history | 无自动公开 | 不能仅凭 APPROVED 投影 | 不变化 |
| publication/current version verified | P1 指向 exact approved version | 生成 Verified Board，不自动生成 candidate | 尚无 public ID | 不出现 |
| opportunity evaluated LOW/不满足 PASS | Verified Board 仍可信 | 不生成 Public Candidate，保留可解释 evaluation | 尚无 public ID | 不出现 |
| opportunity evaluated PASS | Verified Board 仍是 truth | 生成 private Public Candidate | 尚无 public ID | 不出现 |
| candidate eligibility/consent incomplete | private truth 不变 | 停在 reasoned pending/rejected state | 尚无 public ID | 不出现 |
| candidate + all public gates pass | exact version、venue、consent、eligibility 可解析 | 创建 sanitized lead | 分配新 opaque ID | 出现 |
| newer publication approved/current + fresh consent | P1 单调推进 | 原子更新 served fields/version | 同 lineage 保持 active ID；拒绝迟到写 | 更新为新版本 |
| newer submission failed | P1 仍指旧 current | 保持旧 lead | 不推进 servedVersion | 旧内容继续 |
| consent withdrawn | private publication 可继续 | hide → retire + tombstone | 旧 ID 永不复活 | 立即移除 |
| cloud publication deleted | durable private deletion | hide → retire + tombstone | stale local/event 不得 resurrect | 移除 |
| local board deleted | 不等于 cloud delete | 无动作 | public lifecycle 不跟随 local delete | 保持当前状态 |
| moderation temporary hide | private truth 不变 | 去除公开 payload，保留审计 | ID 可暂留；恢复前重验 | 隐藏 |
| permanent takedown | private truth 可保留审计 | retire + tombstone | ID 永久失效 | 移除 |
| republish after withdraw/delete | 新 consent + current exact version | 创建新 lead | 新 `publicLeadId` | 作为新公开项出现 |
| account delete | durable owner cleanup | hide → retire all owned leads | 全部旧 ID tombstone | 全部移除 |
| late async response/event | 不改变 authoritative current | generation/version/tombstone guard 拒绝 | 不覆盖新 query/selection，不复活 | 无可见倒退 |

## M. Public API / Query 方案

- `viewport query`：输入 bounded viewport、zoom、稳定 filter、cursor/limit；服务端执行 allowlist、rate limit、abuse guard、结果上限和一致 pagination，返回精简 marker/list DTO 与 `queryGeneration`/freshness metadata。
- `detail query`：只接受 `publicLeadId`，返回 public detail allowlist；retired/hidden/not-found 使用不泄漏原因的统一不可用响应。
- 不允许客户端直接读 private DB，不允许 public write，不允许用 `recordCode`、`recordId` 或 `boardId` 查询 public detail。
- geo/index/provider 选择必须由 `EDG-V2-02/03/05` 证据和 TASK-V2-09 contract 收口；在此前不创建集合、索引或 endpoint。
- cache key 必须包含 viewport bucket、zoom、filters、contract version；TTL、stale-while-refresh 与失效规则需要有上限，撤回/删除不能只依赖 TTL。
- migration 默认是 empty-start，不把 V1 历史 publication 自动回填。任何 backfill 都要求 `PDG-V2-03`、逐条 consent 和可回滚 dry-run。

## N. Client State / Async 方案

客户端状态至少分开：permission、location source、viewport、filters、request identity/generation、marker/list result、selected lead、detail、cache freshness、loading/empty/error/offline/withdrawn。

- 每次 viewport/filter refresh 分配 generation；只有当前 generation 可提交结果。
- detail response 必须同时匹配当前 `publicLeadId` 和 request token；关闭或切换详情后，迟到响应不得重开旧详情。
- permission denied、device location failure、manual city fallback 是显式状态，不是异常兜底。
- cache 可显示带 stale 标识的最近公开结果，但 tombstone/withdrawal 事件优先清除，且不得从 private local data 补 marker。
- active board/draw session 与 map state 独立；后台 recovery 或 map refresh 不得覆盖用户当前 board。

## O. Map UX 方案

核心体验按 contract 后置实现：地图与列表同步、bounded viewport、marker density、基础结构化筛选、public detail、freshness/non-real-time 提示、permission/manual fallback、empty/loading/error/offline/withdrawn 状态。

公开贡献 UX 必须先展示 exact public preview、venue、precision、字段 allowlist、撤回入口与后果；不得以 Profile、头像、昵称或手机号为门槛。首发 safe deep link 只携带 `publicLeadId` 与 public-safe route allowlist；分享 extras 不属于默认完成定义。

## P. Performance / Package 方案

- TASK-V2-03 先给出成本、包体与 provider feasibility budget；TASK-V2-18 用真实规模、弱网和真机结果复核。
- viewport result 有硬 limit，禁止一次加载全域；高密度区域启用 server aggregation 或 client clustering 的证据化选择。
- marker icon、thumbnail、static dataset、地图 SDK 与分包均计入 package budget；任何 public image unlock 还需单独 CDN/Storage/security/cost 方案。
- 观察 cold/warm latency、query count、payload bytes、cache hit、cluster cost、render frame pressure、retry amplification 与 daily/monthly cost ceiling。
- 超预算时 rollback 顺序：缩小字段/limit/viewport → 降低 refresh/禁用非核心筛选 → 回退列表优先；不通过扩大 public DB/Storage 权限解决。

## Q. Moderation / Operations 方案

- private verification 与 public moderation 分开：V1 `msgSecCheck`/exact verification 只覆盖其既有字段，不自动证明新增 venue label、public note/image 或 contributor disclosure 可公开。
- MVP 需要 eligibility reason、approve/reject/hide/withdraw/takedown、actor/time/reason、owner control、audit trail 与 emergency hide-first path。
- abuse prevention 至少覆盖 query rate limiting、enumeration resistance、malformed viewport/filter、deep-link probing、重复 contribution、location poisoning 和 unauthorized moderation。
- 操作目标由 `EDG-V2-06` 验证：从请求到公开隐藏的可执行流程、责任人、证据、审计与恢复边界。无法证明可撤回供给时 STOP。

## R. 新 V2 Task List

完整 28-field task contract 只在 `memory-bank/implementation-plan.md` 维护；这里提供审核索引。

| Order | TASK_ID | Title | Dependencies | Key Gate / Output | Status |
| --- | --- | --- | --- | --- | --- |
| 01 | `TASK-V2-01` | Dynamic Board Opportunity 信息表达模型 | plan approval | `V2_INFORMATION_EXPRESSION_MODEL` + `OPPORTUNITY_MODEL_DIRECTION` / `EDG-V2-04` | COMPLETE / HUMAN_APPROVED |
| 02 | `TASK-V2-02` | 动态版面地图的数据来源、统一验证流程与 Freshness 生命周期 | plan approval | `V2_DYNAMIC_BOARD_DATA_SOURCE_AND_FRESHNESS_REPORT` / `EDG-V2-01/06` | COMPLETE / HUMAN_APPROVED |
| 03 | `TASK-V2-03` | 平台、Geo、成本与包体可行性 Spike | plan approval | `V2_PLATFORM_FEASIBILITY_REPORT` / `EDG-V2-02/03/05` | CONTINUE_APPROVED / EXTERNAL_EVIDENCE_PENDING |
| 04 | `TASK-V2-04` | Evidence 与 Product Gate 收口 | 01—03 | 7 PDG + 6 EDG closure | LOCKED / NOT_STARTED |
| 05 | `TASK-V2-05` | Private → Public Consent 与 Lifecycle Contract | 04 | consent/lifecycle | LOCKED / NOT_STARTED |
| 06 | `TASK-V2-06` | Venue / POI 与 Public Geo Contract | 03—05 | four location semantics | LOCKED / NOT_STARTED |
| 07 | `TASK-V2-07` | Public Field、Privacy 与 Moderation Policy | 04—06 | allowlist/moderation | LOCKED / NOT_STARTED |
| 08 | `TASK-V2-08` | `PublicMapLead` / `publicLeadId` Contract | 05—07 | public read model | LOCKED / NOT_STARTED |
| 09 | `TASK-V2-09` | Query、Security、Resource 与 Migration Contract | 03、08 | resource/index/API contract | LOCKED / NOT_STARTED |
| 10 | `TASK-V2-10` | Owner Consent 与 Public Candidate Write Path | 05—09 | owner-controlled write | LOCKED / NOT_STARTED |
| 11 | `TASK-V2-11` | Monotonic `PublicMapLead` Projector | 08—10 | projector/tombstone | LOCKED / NOT_STARTED |
| 12 | `TASK-V2-12` | Minimal Moderation 与 Operations | 07、10—11 | operational controls | LOCKED / NOT_STARTED |
| 13 | `TASK-V2-13` | Public Viewport 与 Detail API | 09、11—12 | bounded public API | LOCKED / NOT_STARTED |
| 14 | `TASK-V2-14` | Client Map State、Cache 与 Stale Guard | 13 | client state contract | LOCKED / NOT_STARTED |
| 15 | `TASK-V2-15` | Consent 与 Owner-Control UX | 10、12—14 | explicit preview/control | LOCKED / NOT_STARTED |
| 16 | `TASK-V2-16` | Map、List、Filter 与 Detail UX | 13—15 | core discovery UX | LOCKED / NOT_STARTED |
| 17 | `TASK-V2-17` | WeChat Map、Location 与 Safe Deep Link | 13—16 | device/platform integration | LOCKED / NOT_STARTED |
| 18 | `TASK-V2-18` | Scale、Clustering、Weak Network 与 Package | 03、13—17 | budget/performance gate | LOCKED / NOT_STARTED |
| 19 | `TASK-V2-19` | Layered Integration、Security 与 Migration Gate | 10—18 | automated release evidence | LOCKED / NOT_STARTED |
| 20 | `TASK-V2-20` | True-Device Validation Matrix | 15—19 | independent true-device evidence | LOCKED / NOT_STARTED |
| 21 | `TASK-V2-21` | Closed Pilot 与 Release Candidate Gate | 01—20 | Continue/Adjust/Stop | LOCKED / NOT_STARTED |
| 22 | `TASK-V2-22` | Actual Publication 与 Immutable Tag Closure | 21 + explicit authority | publication evidence then tag | LOCKED / NOT_STARTED |

## S. Critical Path

`human plan approval → 01 Verified Board Opportunity value + OPPORTUNITY_MODEL_DIRECTION / 02 supply / 03 platform Evidence → 04 Gate closure → 05 Verified Board/Opportunity/Candidate/eligibility/consent lifecycle → 06 Candidate/Confirmed Venue → 07 fields/opportunity eligibility/attribution/moderation → 08 PublicMapLead → 09 resource/query contract → 10 owner opportunity-pass candidate/consent write → 11 projector → 12 moderation → 13 public API → 14 client state → 15/16 UX → 17 platform integration → 18 scale/package → 19 automated gates → 20 true-device → 21 pilot/release candidate → 22 actual publication → immutable tag`。

并行支线只能在依赖满足后进行；Evidence、privacy、public lifecycle、true-device 与 actual publication 不能被 UI demo 替代。

## T. 风险分级

### HIGH

- 合法、可持续且可撤回的首发供给不足，导致地图没有真实价值。
- 用户把历史观察误解为实时库存；若 `EDG-V2-04` 失败必须 Stop/Adjust。
- private truth/owner/location 泄漏，或公开字段越过 allowlist。
- venue 与 capture geo 混用，产生错误地点或过度精确公开。
- withdrawal/delete/account delete 被 stale projector、cache 或 deep link 复活。
- provider/CloudBase geo/index/rate/cost 不支持 bounded MVP，或错误边界被混淆。

### MEDIUM

- marker density、刷新频率、payload 与 clustering 导致性能、费用或包体超预算。
- moderation/takedown 操作能力跟不上公开供给，无法满足 hide-first 目标。
- anonymous browse、contributor disclosure、public image 等 Product Gate 被实现者偷偷默认。
- 真机定位、权限、地图 SDK、分享与前后台切换行为偏离模拟器。
- migration/backfill 绕过 re-consent，或乱序事件污染 servedVersion。

### LOW

- 非核心筛选、视觉 marker 资产或 sharing extras 延后影响体验完整感，但不应扩大首发安全边界。
- 历史文档中的旧任务编号被误当 current plan；唯一入口和 mapping 可降低此风险。

## U. V2 Completion Definition

V2 只有在以下全部满足后才算完成：`V2_INFORMATION_EXPRESSION_MODEL` 经 V2-A 人工批准，TASK-V2-21 再以真实用户复验外部价值、非实时理解和行动证据，`OPPORTUNITY_MODEL_DIRECTION` 经人工批准；所有 Product/Evidence Gates 有明确结论；22 个任务及各自分层测试通过；Verified Board、Opportunity Evaluation、Public Candidate 与 Public Authorization 分层、public lifecycle、withdrawal/no-resurrection、security/privacy、performance/package、true-device、pilot、CloudBase deployed version/DB index/migration、WeChat privacy/review 均有证据；GitHub 同步到 actual online source；实际微信发布已确认；最后才创建 immutable V2 tag。

在此之前，页面出现 marker、模拟器可用、CloudBase 已部署、PR 已合并或候选版本已上传都不等于 V2 发布完成。

## V. 剩余人工决定

1. 审核并批准／修订本 22-task planning reconstruction；批准前没有 active V2 block。
2. 在 TASK-V2-01—03 产生证据后，逐项决定 `PDG-V2-01`—`PDG-V2-07`；当前推荐值不是已批准产品事实。
3. `EDG-V2-01`—`EDG-V2-06` 必须由指定 producer 产生可复核证据；不得由 Product Gate 的偏好代替。
4. 人工明确解锁第一个区块后，才可开始 TASK-V2-01；本轮不会代为解锁。

## W. Files Modified

当前 working tree 保留了前序已授权 V1 truth/document closeout 的未提交 Markdown，并叠加本轮 planning reconstruction；没有恢复、覆盖或丢弃用户／前序改动。最终 docs-only 集合为：

- current entry：`PRD.md`、`README.md`；
- Memory Bank：`memory-bank/architecture.md`、`memory-bank/design-document.md`、`memory-bank/implementation-plan.md`、`memory-bank/progress.md`、`memory-bank/tech-stack.md`；
- V1/V2 delivery：`docs/delivery/v1-current-truth-registry.md`、`docs/delivery/v1-truth-reconciliation-review-packet.md`、`docs/delivery/v1-validated-product-system-baseline.md`、`docs/delivery/v2-planning-reconstruction-review-packet.md`、`docs/delivery/v2-pre-development-review-packet-initial-draft-history.md`、`docs/delivery/v2-pre-development-review-packet.md`；
- historical plan archive：`memory-bank/implementation-plan-history.md`、`memory-bank/v2-planning-draft-pre-v1-truth-review.md`；
- 已由前序 V1 truth closeout 同步的 decisions：`docs/decisions/account-and-my-panel-proposal.md`、`docs/decisions/v1-board-ocr-model-selection.md`、`docs/decisions/v1-board-recognition-prompt-contract.md`、`docs/decisions/v1-session-and-storage.md`、`docs/decisions/v1-toolchain-and-recognition.md`、`docs/decisions/v2-contribution-verification-lifecycle.md`；
- 已由前序 V1 truth closeout 同步的 specs：`specs/v1-cloudbase-backend/design.md`、`specs/v1-cloudbase-backend/requirements.md`、`specs/v1-cloudbase-backend/tasks.md`。

不修改 runtime、pages、components、cloud functions、database/storage rules、recognition、V2 tests、production configuration 或 frozen V1 contracts。

## X. Final Status

```text
V1_CURRENT_TRUTH_USED_AS_BASELINE = YES
OLD_V2_PLAN_FULLY_MAPPED = YES
ALREADY_COMPLETED_IN_V1_TASKS_REMOVED_FROM_V2 = YES
V2_CAPABILITY_DELTA_FINALIZED = YES
PRODUCT_DECISION_GATES_REBUILT = YES
EVIDENCE_GATES_REBUILT = YES
V2_PUBLIC_BOUNDARY_DEFINED = YES
V2_CONSENT_AND_VENUE_PLAN_DEFINED = YES
V2_PUBLICMAPLEAD_LIFECYCLE_DEFINED = YES
V2_API_AND_CLIENT_STATE_PLAN_DEFINED = YES
V2_IMPLEMENTATION_PLAN_REBUILT = YES
IMPLEMENTATION_PLAN_CANONICAL_PATH = memory-bank/implementation-plan.md
CURRENT_PLAN_ENTRY_COUNT = 1
ACTIVE_MARKDOWN_READABLE_TEXT_CHINESE = YES
V2_A_HUMAN_REVIEW_APPROVED = YES
V2_A_FINAL_CLOSEOUT_ENTERED = YES
V2_A_EXTERNAL_EVIDENCE_PENDING = YES
V2_PRODUCTION_IMPLEMENTATION_STARTED = NO
V2_PRODUCT_CONCEPT_UPDATED = YES
VERIFIED_BOARD_OPPORTUNITY_DEFINED = YES
V1_VERIFICATION_AND_V2_PUBLIC_AUTHORIZATION_SEPARATED = YES
PUBLIC_CANDIDATE_FLOW_DEFINED = YES
PUBLIC_ELIGIBILITY_FLOW_DEFINED = YES
VENUE_AND_PUBLIC_GEO_BOUNDARY_DEFINED = YES
PUBLICMAPLEAD_ARCHITECTURE_PRESERVED = YES
V2_TASK_COUNT_CHANGED = NO
V2_OPPORTUNITY_EVALUATION_CONCEPT_UPDATED = YES
VERIFIED_BOARD_DEFINED = YES
OPPORTUNITY_EVALUATION_LAYER_DEFINED = YES
TRUTH_AND_RECOMMENDATION_SEPARATED = YES
PUBLIC_CANDIDATE_FLOW_UPDATED = YES
PUBLICMAPLEAD_ELIGIBILITY_UPDATED = YES
TASK_COUNT_CHANGED = NO
TASK_ORDER_CHANGED = NO
commit = NO
push = NO
PR = NO
merge = NO
tag = NO
deploy = NO
```

立即停止点：完成 V2-A Final Closeout 记录，保留 TASK-V2-03 三项外部证据为 OPEN；TASK-V2-04—22 与 V2-B—E 保持 `LOCKED / NOT_STARTED`，不开始生产实现。
