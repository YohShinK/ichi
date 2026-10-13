# ICHI V2-B Entry Review Packet

> `HISTORICAL ENTRY SNAPSHOT / SUPERSEDED BY docs/delivery/v2-b-closeout-review.md / NOT EXECUTABLE`

> Date: 2026-09-11
>
> Active block: `V2-B / IN_PROGRESS`
>
> Active task: `TASK-V2-08 / AWAITING_REVIEW`
>
> Phase: `DOMAIN_MODEL_AND_SYSTEM_CONTRACT`
>
> `V2_IMPLEMENTATION_STARTED = NO`

## 1. Confirmed V2-A → V2-B knowledge

ICHI V2 是版面机会情报地图，不是传统地图找店。地图读取 ICHI 自有数据库中经过 Verification、Opportunity 和 Freshness 处理的版面观察公开投影；外部 POI 不提供地图主数据。

确认的核心链路：

`BoardObservation → Verification → VerifiedBoard → OpportunityEvaluation → FreshnessEvaluation → Public Eligibility → Public Projection → PublicMapLead → 微信原生 <map>`

微信原生 `<map>` 负责地图渲染、marker、callout、pan/zoom、`regionchange` 与 viewport。用户移动地图后，由 viewport 调用未来 ICHI Map Query API，bounded 返回 `PublicMapLead`。地图打开后不得调用腾讯地点搜索构造 marker。

腾讯位置服务是 `Optional Location Enhancement`，未来可用于地址解析、POI 辅助、用户主动地点搜索和地理信息增强。用户确认其地点搜索当前额度约为 200 次／日；MVP 浏览链路不调用该能力，因此不构成 blocker。

Venue/POI 不是核心实体。BoardObservation 可包含拍摄／观察坐标、版面信息和可选 `venueNote`；PublicMapLead marker 表达“这里曾出现过具有价值的版面”，不表达“这里是经确认店铺”。

## 2. V2-B knowledge alignment result

| Task | Alignment result | Status |
| --- | --- | --- |
| TASK-V2-04 | Domain Model、System Contract、V1 adapter 与 Gate review；D04-01—08 及非破坏性 D04-A1 已批准 | `COMPLETE / HUMAN_APPROVED` |
| TASK-V2-05 | 已冻结正交 Lifecycle 状态语义、BoardInstance association lifecycle、D05-01—09 和转换约束，不冻结完整生产 enum | `COMPLETE / HUMAN_APPROVED` |
| TASK-V2-06 | 已批准四类 Source、统一版本化历史 + 未来授权、withdraw/delete、report moderation、R1—R14、R-A—R-J、D06-01—10 与 pre-launch D06-A1 public player attribution addendum | `COMPLETE / HUMAN_APPROVED` |
| TASK-V2-07 | 已批准四层 Location/precision model、candidate-only identity boundary、content-provenance-bound venueNote safety、L1—L16、L-A—L-F 与 D07-01—10 | `COMPLETE / HUMAN_APPROVED` |
| TASK-V2-08 | 已完成 storage-agnostic PublicMapLead、source-specific V1 inventory/mapping、map query/display/error 合同；D08-03/04/10/13/17 已纳入 founder 调整，其余 recommendation 延续，D08-01—18 等待二次 founder Review | `AWAITING_REVIEW` |

`D04-A1` 冻结 BoardInstance Conservative Unique Continuation：不同 Observation 可关联同一现实实例，但不合并原始记录；Location 只生成候选；多候选保持 AMBIGUOUS；CanonicalBoard 继续 DEFER。完整合同见 `docs/research/v2-b/v2-board-instance-resolution-contract.md`。TASK-V2-09—22 已在 current plan 登记分区继承约束，仍保持 LOCKED，解锁对应区块前再细化实现任务。

## 3. TASK-V2-04 initial domain questions

以下入口问题已转化为 `docs/research/v2-b/v2-domain-model-contract.md`、D04-01—08 与 D04-A1 人工决定。已批准部分是 frozen input；仍开放的 lifecycle/rights/location/public-field 问题由 TASK-V2-05—08 继续裁决。

### BoardObservation

- V1 P1／exact approved Submission 与概念 BoardObservation 是一对一、一对多，还是只是一种 source adapter？
- BoardObservation 的稳定 identity、source identity、revision 和 duplicate boundary 分别是什么？
- `observedAt`、location、structured board 和 `venueNote` 哪些属于同一不可变 observation version？

### Verification 与 VerifiedBoard

- Verification 失败、待处理、重试和版本替换如何关联原 BoardObservation？
- 一个 BoardObservation 是否最多产生一个 active VerifiedBoard version？
- VerifiedBoard 如何保存 verification evidence lineage，同时不复制或公开 private evidence？

### OpportunityEvaluation

- Evaluation 绑定 VerifiedBoard version 还是 observation lineage？
- `HIGH/MEDIUM/LOW/INSUFFICIENT` 与未来 Public Eligibility 的 PASS 条件是否分离，以及 reason-code version 如何演进？
- evaluation 重算是否创建新版本，旧结果如何避免覆盖更新结果？

### FreshnessEvaluation

- Freshness 是按请求动态计算，还是保存带 `asOf` 的可复现 evaluation snapshot？
- 哪个时点触发重新计算、降级、隐藏或历史展示？
- Freshness 下降如何只改变行动参考价值，而不改变 VerifiedBoard truth 或删除数据？

### Source

- 四类 Source 的最小 provenance 字段、source record identity 和 rights/takedown owner 分别是什么？
- Source 如何保持只用于溯源，不进入信任分数、Opportunity 权重或地图排序？

### Location

- 玩家、辅助抽赏、V1_HISTORY 与 NETWORK_SOURCE 各自如何确定 Observation Location 和 coordinate system？
- 哪些原始定位字段永不公开，Public Location 采用 exact、rounding、approximate 还是 city-level precision？
- TASK-V2-08 如何把 D07-07 的条件公开 venueNote 落到 allowlist、field omission 与 marker/callout 合同？
- 没有 Venue/POI 时，什么条件足以让 observation location 进入 Public Projection？

### Public Projection 与 PublicMapLead

- D04-05 已决定 PublicCandidate 只可作为可选 service workflow concept，不进入核心 entity 链；TASK-V2-08 只需确保服务合同不依赖它存在。
- 一个 BoardObservation lineage 同时允许多少 active PublicMapLead；更新、隐藏、撤回和重新发布如何改变 publicLeadId？
- Public Projection 的最小 allowlist、location precision、freshness/asOf、source label 和 non-recommendation disclosure 是什么？
- viewport query 的 bbox/cell、limit、cursor、density、dedupe、cache/asOf 和 late-response contract 如何保持稳定？

### Pilot readiness wording

- 旧 `PILOT_READINESS_TARGET` 中“10 个 Confirmed Venue”已不符合非 Venue 核心模型，应替换为哪一种可测的 public-location coverage unit？

## 4. Entry gate

- V2-A TASK-V2-01—03：`COMPLETE / HUMAN_APPROVED`
- V2-A：`COMPLETE / HUMAN_APPROVED`
- iOS／Android／腾讯位置服务控制台：`PASS / HUMAN_APPROVED`
- V2-B：`IN_PROGRESS / TASK-V2-08_AWAITING_REVIEW`
- TASK-V2-04：`COMPLETE / HUMAN_APPROVED`
- TASK-V2-05：`COMPLETE / HUMAN_APPROVED`
- TASK-V2-06：`COMPLETE / HUMAN_APPROVED`
- TASK-V2-07：`COMPLETE / HUMAN_APPROVED`
- TASK-V2-08：`AWAITING_REVIEW`
- TASK-V2-09—22：`LOCKED / NOT_STARTED`
- Production/runtime/backend/Cloud Functions/DB/Storage/API implementation changes：`0`
- Commit/push/deploy/migration：`NO`

结论：TASK-V2-04、D04-A1 Addendum、TASK-V2-05 D05-01—09、TASK-V2-06 D06-01—10 + D06-A1 与 TASK-V2-07 D07-01—10 已完成人工批准；TASK-V2-08 已完成 founder adjustments 的 document-only 合同同步并等待 D08-01—18 二次人工批准。开始任何 runtime 或生产实现的条件仍未满足。
