# V2 Domain Model Contract

> Task: `TASK-V2-04`
>
> Status: `COMPLETE / HUMAN_APPROVED`
>
> Contract implementation: `NO`
>
> Runtime/API/DB changes: `0`

## 1. Purpose and fixed boundaries

本合同定义一条版面观察从私有输入到公开地图服务边界的职责、identity、version、cardinality、ownership 与 failure boundary。它不创建 runtime type、数据库、Collection、Cloud Function、API 或生产配置。

固定链路为：

`BoardObservation → Verification → VerifiedBoard → OpportunityEvaluation → FreshnessEvaluation → Public Eligibility → Public Projection → PublicMapLead`

以下边界已经由用户批准，不再作为 TASK-V2-04 的开放问题：

- ICHI V2 是版面机会情报地图，不是店铺／POI 数据库。
- 微信原生 `<map>` 只消费 ICHI 公开服务边界的数据。
- 腾讯位置服务仅为 `Optional Location Enhancement`。
- `PublicMapLead` 只冻结为服务边界和数据契约；物化、动态或混合实现全部 `DEFERRED`。
- Lifecycle 只冻结状态语义和转换约束，不冻结完整生产枚举。
- Location 只冻结精度模型，不冻结具体米级、网格或偏移参数。
- Freshness 不改变真实性，也不自动触发删除。

## 2. Domain glossary and classification

| Concept | Classification | Authority and responsibility |
| --- | --- | --- |
| `BoardObservationLineage` | private entity identity | 将同一来源记录的不可变修订串联起来；不是公开 identity |
| `BoardObservationVersion` | private immutable entity version | 一次可追溯的版面观察输入；关联 Source、observedAt、结构化输入、Observation Location 与可选 venueNote |
| `SourceProvenance` | private value object | 只回答来源、时间依据、权利依据和运营责任；不产生可信度等级 |
| `VerificationAttempt` | service-only process record | 记录一次 ICHI Recognition、Structured Extraction 与 Board Validation 尝试及其 pipeline version |
| `VerifiedBoardVersion` | service-only immutable fact snapshot | 只表达已核对的结构化版面事实；不表达机会、Freshness 或公开资格 |
| `BoardInstance` | private/service reality-continuity identity | 表达某地点、某时间连续存在的一张具体实体版面；可关联多个独立 Observation，但不合并或覆盖它们 |
| `BoardInstanceResolutionEvidence` | private/service evidence record | 记录 resolver 或稀缺 human assistance 对候选连续性的可追溯证据；不是直接 merge command |
| `OpportunityEvaluation` | service-only decision record | 对精确 VerifiedBoard version 执行版本化、可解释的机会判断 |
| `FreshnessEvaluation` | service-only evaluation record | 以 observedAt、asOf 与 policyVersion 表达当前参考程度；不改变 VerifiedBoard |
| `PublicEligibilityDecision` | service-only decision record | 对精确输入版本执行 rights、consent、location、field、privacy、moderation 与 visibility 门禁 |
| `PublicProjection` | deterministic service transformation | 把已通过 Eligibility 的精确版本转换为 allowlist-only 公开数据；不是独立私有 truth |
| `PublicMapLead` | storage-agnostic public service-boundary contract | 微信地图可读取的版面机会情报；不预设存储方式，不允许反向覆盖私有领域事实 |
| `PublicLeadTombstone` | service-only retirement fact | 防止已撤回、删除或下架的公开 identity 被迟到任务复活；具体 lifecycle 由 TASK-V2-05 冻结 |

`PublicCandidate` 不进入固定核心链路。D04-05 已批准其只可保留为可选的 service workflow 概念，而不是新的权威 entity。

## 3. Relationship and cardinality proposal

| From | Relationship | To | Invariant |
| --- | --- | --- | --- |
| BoardObservationLineage | `1:N` | BoardObservationVersion | revision 只新增不可变版本，不原地覆盖 |
| BoardObservationVersion | `1:1` | SourceProvenance | 每个版本必须能解释来源、observedAtBasis 和 rights owner |
| BoardObservationVersion | `1:N` | VerificationAttempt | 重试保留独立 attempt，迟到 attempt 不覆盖新 observation version |
| successful VerificationAttempt | `0..1:1` | VerifiedBoardVersion | 一个成功 attempt 产生一个精确事实快照；失败不产生 VerifiedBoard |
| BoardInstance | `1:N` | resolved BoardObservationVersion | 多个不同 lineage 的 Observation 可以属于同一实体实例，但每条 Observation 继续独立保存 |
| BoardObservationVersion | `0..1 resolved / 0:N candidates` | BoardInstance | 只有保守唯一匹配才能形成 accepted association；AMBIGUOUS 只保留候选关系 |
| VerifiedBoardVersion | `1:N` | OpportunityEvaluation | 按 evaluationPolicyVersion 版本化；任何 level 都不改变 truth |
| BoardObservationVersion | `1:N` | FreshnessEvaluation | observedAt 固定，asOf/policyVersion 可产生多个可复现评估 |
| exact input-version set | `1:N` | PublicEligibilityDecision | 决策必须锁定 Board、Opportunity、Freshness、Rights、Location 和 policy versions |
| eligible input-version set | `1:1` | PublicProjection result | 相同输入与 policy version 必须产生确定性相同的公开结果 |
| BoardObservationLineage | `0..1 active` | public derivation relationship | 同一 lineage 不产生多个 simultaneous active contributions；不要求 public identity 属于 lineage |
| resolved BoardInstance | `0..1 current map state` | PublicMapLead service result | 连续 active public lifecycle 内稳定 publicLeadId；全部 support 消失并 retire 后新 lifecycle 使用新 ID；不预设物化方式 |

CanonicalBoard 与更高层跨来源／跨记录规范化继续 `DEFERRED`。受限的 BoardInstance 连续性关系由 `docs/research/v2-b/v2-board-instance-resolution-contract.md` 补充：它只回答多个 Observation 是否属于同一张持续存在的实体版面，不静默合并 lineage、Observation、Source 或 rights，也不建立全局 CanonicalBoard。

## 4. Identity and version proposal

| Layer | Identity/version requirement |
| --- | --- |
| Observation lineage | ICHI 内部 opaque identity；不得从公开 URL、坐标、recordCode 或用户资料推导 |
| Observation version | lineage 内单调版本或等价不可变 version identity；必须记录 createdAt、source version 和 supersedes relation |
| Verification | 独立 attempt identity + pipelineVersion；结果绑定精确 observation version |
| VerifiedBoard | 独立内部 identity/version；保存 observationVersionRef 和 successfulVerificationRef |
| Opportunity | evaluation identity + policyVersion；绑定 verifiedBoardVersionRef |
| Freshness | evaluation identity + observedAt + asOf + policyVersion；不得用 fetchedAt/verifiedAt 静默替代 observedAt |
| Eligibility | decision identity + exact input digest/version set + reason codes + actor/policy version |
| Public service boundary | map-only opaque publicLeadId + servedVersion；连续 BoardInstance public lifecycle 内 ID 稳定，retire 后不复用；private/storage IDs 不进入公开 payload |

`publicLeadId` 的生成、持久化与更新机制尚未实现。TASK-V2-04 只冻结其为不可从 private identity 或 location 推导的公开 identity，并要求 retired identity no-resurrection。

## 5. Ownership and authority boundary

| Boundary | May read/write | Must not do |
| --- | --- | --- |
| Private source domain | 保存 BoardObservation、Source evidence、owner、精确位置和原始备注 | 不因 V1 APPROVED、来源类型或坐标存在而自动公开 |
| ICHI verification domain | 产生 VerificationAttempt 与 VerifiedBoardVersion | 不写 Opportunity、Freshness 或公开资格结论到 VerifiedBoard truth |
| ICHI BoardInstance resolution domain | 以 verified structured facts 产生候选、association decision 与可纠错 evidence | 不靠 Location 单独证明 identity，不接受 destructive merge，不让 human answer 覆盖 hard conflict |
| ICHI evaluation domain | 产生 Opportunity/Freshness evaluations | 不把等级表达成推荐、中奖概率或消费建议 |
| ICHI eligibility/projection domain | 读取精确版本并产生 eligibility/projection | 不绕过 rights、consent、location、allowlist、privacy 或 moderation |
| Public map boundary | 只返回 PublicMapLead allowlist | 不返回 private IDs、原始位置/evidence、内部审核数据或完整 draw events |

玩家账号可以控制其来源贡献的授权与撤回，但不能修改 ICHI 已记录的 Verification/Evaluation 事实。NETWORK_SOURCE 没有玩家 owner，必须由明确的 operational steward 和 takedown owner 管理。PublicMapLead 的 visibility 由 ICHI 服务控制，并受来源对应的撤回或下架权约束。

## 6. V1 Current Publication mapping

V1 私有权威链保持不变：

`Current Cloud Publication P1 → publishedSubmissionVersion → exact APPROVED Upload Submission`

建议的只读映射合同：

1. `recordId + boardId` 只作为 private adapter 输入，用于定位一个 V1 observation lineage；二者永不公开。
2. 每个 exact APPROVED submission version 映射为一个 immutable BoardObservationVersion。
3. P1 只指出当前 published version，不复制完整 snapshot，也不成为 PublicMapLead 读取源。
4. sourceType 固定为 `V1_HISTORY`，ownerAccountId 继续保持私有。
5. observedAt 必须来自 exact approved version 可追溯的拍摄／提交事实；缺失时不得用读取时间补齐。
6. V1 verification 事实可以作为 adapter evidence，但仍需按 V2 contract 形成明确 VerifiedBoardVersion。
7. FAILED、pending、superseded attempt 不映射为可公开 observation version。
8. V1 旧 consent 不授予 V2 公开权；Public Eligibility 继续 fail closed。

本任务不执行历史扫描、迁移、回填或数据库写入。

## 7. Cross-layer invariants

1. `VERIFIED=YES + Freshness=LOW` 仍是已核对历史事实。
2. Source 类型不能改变 Verification 结论、Opportunity 权重或公开排序。
3. Opportunity level 不等于 Public Eligibility PASS。
4. Freshness 下降不修改 VerifiedBoard，也不自动删除 BoardObservation。
5. Location 不生成 Venue；Venue/POI 不进入核心 identity 或 cardinality。
6. Eligibility 必须引用精确输入版本；任一输入变化都使旧决策不可用于新 projection。
7. PublicProjection 只做单向、allowlist-only 转换；PublicMapLead 不能回写私有 truth。
8. 迟到 attempt/evaluation/projection 不覆盖更新版本。
9. retired public identity 不得复活。
10. `null=unknown` 与 `0=confirmed zero` 跨层保持不变。

## 8. Scenario verification matrix

| Scenario | Required result |
| --- | --- |
| verified board becomes old | VerifiedBoard 不变；新增或重算 FreshnessEvaluation；公开 visibility 由后续 policy 决定 |
| old verification finishes after revision | 结果只绑定旧 observation version，不得成为新版本的 VerifiedBoard |
| Opportunity policy changes | 创建新 evaluation version；不修改 VerifiedBoard |
| player withdraws | 私有事实与验证结论按 retention policy 处理；公开路径 hide-first，具体终态由 TASK-V2-05 决定 |
| network rights missing | 可以保留合法内部处理事实，但 Public Eligibility fail closed |
| observation has location but no venue | 可继续进入 location eligibility；不得创建 Venue identity |
| location cannot be made public | 保留内部 observation；不产生地图 marker |
| network 与 player observations 可能观察同一实体板 | 保持两个 lineage 和各自 Source/Rights；只有保守唯一匹配可关联同一 BoardInstance，不静默合并 |
| public schema expands | 旧 consent/eligibility 不自动覆盖新增字段，必须重新决策 |
| late projection targets retired lead | 丢弃并记录 no-resurrection 结果 |

## 9. Gate review

### Evidence Gates

| Gate | TASK-V2-04 review state | Reason |
| --- | --- | --- |
| EDG-V2-01 | `PASS_FOR_CONTRACT / HUMAN_APPROVED` | TASK-V2-06 已批准四来源、统一版本化地图贡献授权、rights/takedown 与 D06-01—10；具体外部 item 仍逐条 fail closed review |
| EDG-V2-02 | `PASS_FOR_CONTRACT` | 原生地图、bounded query 与设备 spike 已通过 |
| EDG-V2-03 | `PASS_FOR_CONTRACT / PILOT_RECHECK_REQUIRED` | 成本与包体方向可行，真实规模留待后续复验 |
| EDG-V2-04 | `PASS_FOR_CONTRACT / LOWER_CONFIDENCE` | 信息表达合同通过；外部用户样本仍留到 TASK-V2-21 |
| EDG-V2-05 | `PASS_FOR_CONTRACT / HUMAN_APPROVED` | TASK-V2-07 已批准四层 Location、公开精度、privacy、venueNote safety provenance 与 D07-01—10；数值策略仍 deferred |
| EDG-V2-06 | `PASS_FOR_CONTRACT / HUMAN_APPROVED` | lifecycle、withdraw/delete/takedown、My Uploads hide-first 与 report auto-hide 语义已由 TASK-V2-05/06 批准；生产演练留后续 |

### Product Gates

| Gate | Current state | Owning task |
| --- | --- | --- |
| PDG-V2-01 map read identity | `CLOSED / HUMAN_APPROVED / SILENT_ACCOUNT_NO_PROFILE_GATE` | TASK-V2-08 D08-13 |
| PDG-V2-02 attribution | `CLOSED / D06-A1 PUBLIC_PLAYER_PROFILE_ATTRIBUTION` | PLAYER detail 可投影安全 nickname/avatar + recordType；NETWORK 无玩家 Profile |
| PDG-V2-03 V1 history publication | `CLOSED / VERSIONED_MAP_CONTRIBUTION_AUTHORIZATION` | TASK-V2-06 approved；逐记录 Eligibility 保持 |
| PDG-V2-04 public image | `CLOSED / HUMAN_APPROVED / NO BOARD OR EVIDENCE IMAGE IN MVP` | TASK-V2-08 D08-15 |
| PDG-V2-05 public fields | `CLOSED / HUMAN_APPROVED / EXPLICIT ALLOWLIST` | TASK-V2-08 D08-04/06—10/15/17/18；location/rights 输入来自 06/07 |
| PDG-V2-06 CanonicalBoard | `CLOSED / DEFER` | TASK-V2-04 D04-07；D04-A1 不重开 |
| PDG-V2-07 completion extras | `CLOSED / HUMAN_APPROVED / CORE MAP + SAFE DETAIL` | TASK-V2-08；提醒、海报与 richer sharing 继续 deferred |

## 10. Founder decisions approved for TASK-V2-04

| Decision | Approved result | Meaning |
| --- | --- | --- |
| `D04-01` | `SEPARATE` | Observation 与 VerifiedBoard 分离，输入与已核对事实不混用 |
| `D04-02` | `IMMUTABLE_VERSIONED_LINEAGE` | stable lineage 下 revision 只新增版本 |
| `D04-03` | `EXACT_VERSION_BINDING` | Evaluation 绑定精确 VerifiedBoard version |
| `D04-04` | `SEPARATE` | Opportunity level 与 Public Eligibility PASS 分离 |
| `D04-05` | `OPTIONAL_SERVICE_WORKFLOW_CONCEPT` | PublicCandidate 不进入核心 entity 链 |
| `D04-06` | `0..1 ACTIVE PER LINEAGE` | 一个 lineage 同时最多一个 active PublicMapLead |
| `D04-07` | `DEFER` | CanonicalBoard 不进入 V2 MVP |
| `D04-08` | `SPLIT_AUTHORITY` | contributor 控制来源与撤回，ICHI 管理派生事实与 visibility |

用户于 2026-09-11 回复 `TASK-V2-04 = CONTINUE / APPROVE D04-01—08 AS RECOMMENDED`。上述决定现为 V2-B 已冻结输入。

## 11. BoardInstance Resolution Addendum

用户通过本轮执行命令批准 `D04-A1 BOARD_INSTANCE_RESOLUTION_MODEL = CONSERVATIVE_UNIQUE_CONTINUATION`。本 Addendum 不重开 D04-01—08，只补充以下已确认边界：

- `BoardInstance` 是现实实体连续性关系，且与 Observation、VerifiedBoard、Venue、PublicMapLead、CanonicalBoard 均不等价。
- Location 只生成候选；verified Board Identity Signature 与按 observedAt 排序的物理合理状态变化共同约束匹配。
- 只有唯一无冲突候选形成 accepted association；没有候选创建新实例；多候选保持 `AMBIGUOUS`。
- 原始 Observation、Source 和 Rights lineage 永远不因 association 被合并、覆盖或删除。
- MVP 不依赖原图、thumbnail、image hash 或 visual fingerprint。
- Human Assistance 受 budget/cooldown/skip 约束，回答只形成可重评估 evidence，不能覆盖 hard conflict。
- association correction、unlink、relink 和迟到结果遵守 immutable evidence 与 no-resurrection。

完整合同和 S1—S10 tabletop matrix 见 `docs/research/v2-b/v2-board-instance-resolution-contract.md`。

## 12. Validation record

- Domain objects、关系、identity、version、cardinality、ownership 和 boundary 均有明确候选合同。
- V1 mapping 保持 private P1/exact approved Submission truth，不修改 V1 frozen contracts。
- PublicMapLead storage strategy 明确为 `DEFERRED`。
- Lifecycle production enum 和 Location 米级策略没有被提前冻结。
- 本文未定义数据库 collection、API route、runtime type、Cloud Function 或生产配置。
- `D04-A1` 已作为非破坏性 Addendum 冻结 BoardInstance、保守唯一继承、歧义保留、结构化事实匹配与 human-evidence boundary；D04-01—08 未重开。
- `CanonicalBoard = DEFER` 保持；BoardInstance 不等于 CanonicalBoard。

`TASK_V2_04_AUTOMATED_DOCUMENT_REVIEW = PASS`

`TASK_V2_04_HUMAN_REVIEW = APPROVED`

`D04_A1_BOARD_INSTANCE_RESOLUTION_MODEL = CONSERVATIVE_UNIQUE_CONTINUATION / HUMAN_APPROVED`

`V2_IMPLEMENTATION_STARTED = NO`
