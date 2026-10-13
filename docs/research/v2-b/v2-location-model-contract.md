# V2 Location Model Contract

> Task: `TASK-V2-07`
>
> Status: `COMPLETE / HUMAN_APPROVED`
>
> Scope: `LOCATION_SEMANTICS_PRECISION_AND_PRIVACY_ONLY`
>
> Runtime/API/DB changes: `0`

## 1. Purpose and boundary

本合同定义 `ObservationLocation → LocationResolution → PublicLocationProjection` 与 `OptionalLocationEnhancement` 四层位置语义，使内部真实观察位置、BoardInstance 候选生成和地图公开位置互不混用。

核心不变量：

- `Observation Location = 内部真实观察位置及其证据`。
- `Public Location = 给地图用户看的、经过授权／隐私／安全规则处理的位置投影`。
- `Location != Venue`。
- Location 可以生成 BoardInstance 候选，但不能单独证明两条记录属于同一版面。
- 同一 Location cluster 可以存在多个 BoardInstance。
- 腾讯 POI／腾讯位置服务不是 MVP 核心依赖。

本任务不创建 runtime type、位置 enum、数据库字段、geo index、API、Cloud Function、provider adapter、坐标转换代码、页面、marker 或生产配置；也不冻结具体公开米数、网格大小、rounding、offset 或聚类阈值。

## 2. Approved inputs

继承以下已批准事实：

- D04-A1 使用 `CONSERVATIVE_UNIQUE_CONTINUATION`；Location 只产生附近候选，identity 仍需 verified Board Identity Signature 与物理合理的 Board State Transition。
- 同地点、同坐标、同 IP 或同款版面都可能同时存在多个 BoardInstance；歧义必须保留为 `AMBIGUOUS`。
- D05-09 要求会改变 Observation Location 或 current-map interpretation 的事实修订 hide old、re-evaluate new；完全内部 derived metadata 变化不伪造 Observation revision。
- D06 采用 `VERSIONED_MAP_CONTRIBUTION_AUTHORIZATION`；授权范围内记录仍逐条通过 Location/Privacy/Safety Eligibility。提高公开位置精度属于 material public-scope expansion，必须使用新授权版本。
- V1 玩家来源中与 exact content version 绑定、可验证为既有 `MAP_NOTE` / `msgSecCheck` PASS 的备注可以继承该安全结论；安全结论随内容 provenance 继承，不随字段名继承。新内容或无法证明 exact version 的内容不得借用旧结论。
- 微信原生 `<map>` 是展示层；公开地图只消费 ICHI 的 PublicMapLead。腾讯位置服务仅为可选增强，地图打开后不依赖腾讯 POI 搜索取数。
- V1 `captureGeo`、accuracy 和 location evidence 保持私有，不因 V1 APPROVED 自动公开。

## 3. Four-layer location model

以下是语义字段组，不是 runtime schema：

| Layer | Responsibility | Required semantic inputs | Must not do |
| --- | --- | --- | --- |
| `ObservationLocation` | 保存一次 Observation 对现实观察位置的私有事实／断言与证据 | source observation version、coordinate/value、declared coordinate system、captured/assertedAt、acquisition basis、accuracy/uncertainty、private evidence ref | 不直接成为 marker；不生成 Venue；不因有坐标而证明 BoardInstance identity |
| `LocationResolution` | 把可用位置证据解析为可比较的城市、区域、候选坐标／范围和 BoardInstance candidate search input | exact ObservationLocation version、resolver/manual basis、resolverVersion、candidate set、ambiguity/review result | 不覆盖原始证据；不把 provider POI 当真相；不直接公开；不作最终 same-board 决策 |
| `PublicLocationProjection` | 按 authorization、privacy、safety 和 public-field policy 生成地图可展示的位置及可选安全备注 | exact observation/location-resolution versions、authorization version/scope、precision mode、projectionPolicyVersion、projectedAt/actor；可选 venueNote content version 与 safety provenance | 不泄露原始 accuracy/evidence；不反推 private coordinate；不生成 Venue identity；不把字段名当作安全证明 |
| `OptionalLocationEnhancement` | 提供地址解析、POI 辅助、地点搜索或地理信息补充候选 | provider、request/result ref、providerVersion、queriedAt、review status | 不成为 MVP 上图依赖；不可用时不阻塞 core；结果不能自动升级为 Public Location 或 Confirmed Venue |

任一 PublicLocationProjection 必须能回溯到精确的内部输入和政策版本，但公开 payload 只能包含 TASK-V2-08 最终批准的字段。

## 4. Observation Location by Source

| Source | Preferred observed location basis | Allowed fallback | Boundary |
| --- | --- | --- | --- |
| `PLAYER_DIRECT` | 拍摄／提交时明确获取的 device coordinate、coordinate system、capturedAt 与 accuracy | 用户主动 manual pin 或 city/area assertion，并明确其 basis | 定位拒绝不阻止私有上传；不得静默使用旧定位或默认店铺 POI |
| `PLAYER_ASSISTED` | 产生对应版面状态的事件现场位置证据 | 用户主动 manual pin 或 city/area assertion | event time 与 location evidence 必须绑定到对应 Observation version |
| `V1_HISTORY` | exact approved version 内可追溯的既有 private location evidence | 只使用可证明属于该 exact version 的 manual/city/area 信息 | 缺坐标系、accuracy 或 lineage 时不得伪造 exact location；读取时间不是 observed location time |
| `NETWORK_SOURCE` | 原公开内容明确声明的位置及其 private source evidence | curator 建立的 manual candidate／city/area resolution，并记录推断依据 | 地址文本、POI 搜索或 geocode 结果只是 resolution candidate；不得伪装成 device-captured exact coordinate |

Source 类型不改变 Location 证据强度、Verification、Opportunity 或公开排序。每条记录按自身证据与 policy 评估。

## 5. Coordinate-system semantics

- 所有 private coordinate 必须声明其来源坐标系；未知坐标系不得静默当作 GCJ-02。
- 微信原生 `<map>` 消费的公开 coordinate 必须是微信地图兼容的 GCJ-02 语义，或明确为不携带点坐标的 area-only projection。
- WGS-84、GCJ-02、BD-09 或其他系统之间的转换必须形成版本化 derived result，保留 input system、transform policy/version 和执行时间；转换结果不覆盖原始 ObservationLocation。
- 坐标系未知、转换不确定或 evidence 不足时，允许降级为 area/not-public；不得为了生成 marker 猜测坐标。
- accuracy/uncertainty 属于 private evidence。PublicMapLead 不公开原始 accuracy，也不得让公开点位精度超过批准的 PublicLocationProjection。

具体转换库、公式、数值误差预算和测试向量留到 V2-C 实现设计。

## 6. BoardInstance candidate-only boundary

LocationResolution 可以按未来批准的空间策略返回 `0..N` 个 BoardInstance candidates，但不能产生最终 identity 结论：

1. `0 candidates`：按 D04-A1 创建新实例候选，不表示 Location 错误。
2. `1 candidate`：仍须通过 verified Board Identity Signature 与 observedAt 顺序下的 Board State Transition；Location 单独不能产生 `UNIQUE_MATCH`。
3. `2+ candidates`：保留 `AMBIGUOUS` 或由结构化事实排除；不能用最近距离强行合并。
4. 同一 Location cluster 可同时包含多个 active/historical BoardInstance；地图层必须允许 overlap/aggregate，而不是将位置 cluster 当成一个 Venue 或一个实例。
5. PublicLocationProjection 的模糊化结果不得反向用于证明两个 private Observation 属于同一 BoardInstance。

cluster、candidate radius、distance function、index 和 ranking 全部 deferred。

## 7. Public precision semantics

冻结四种语义，不冻结数值参数：

| Precision mode | User-facing meaning | Contract requirement |
| --- | --- | --- |
| `EXACT` | marker 表示批准公开的精确观察点语义 | 必须落在已接受 authorization scope 内，并通过 privacy/safety/rights；仍不表示 Venue 或实时库存 |
| `APPROXIMATE` | marker 表示经过模糊化、只用于附近探索的位置 | 必须明确“附近／约略”语义；公开点不可用于恢复原始 coordinate |
| `AREA` | 只表达城市、行政区或批准的区域范围 | 可以用 area label/centroid 等未来展示策略，但不得伪装成精确观察点 |
| `NOT_PUBLIC` | 内部可保留合法位置事实，但不向地图公开 | 不生成 marker；可否进入无地图历史入口由 TASK-V2-08 决定 |

推荐 MVP 使用 `LEAST_PRECISE_SAFE_PROJECTION`：在授权、privacy、safety 和产品用途允许的模式中选择足以表达机会情报的最低必要精度。`EXACT` 只作为条件模式，不是所有玩家记录的默认承诺。具体哪个场景用何种模式、米级阈值、网格、rounding 和 offset 仍需后续 policy/实现验证。

地图与 callout 必须携带与模式一致的精度语义，不能只显示一个看似精确的 marker 而隐藏其 approximate/area 性质。

## 8. Authorization, privacy and safety

- 当前 `MapContributionAuthorization` 必须说明地图会展示“经过公开规则处理的位置”。若未来从 APPROXIMATE/AREA 提升到更精确位置，属于 D06-09 material scope expansion，需要新授权版本。
- 同一授权版本不要求每条记录重新弹窗，但每条 PublicLocationProjection 仍独立检查 authorization applicability、privacy、safety、rights、moderation 和 current lifecycle。
- exact coordinate、原始 accuracy、capture evidence、source URL、owner identity、resolver candidates 和 provider raw results 保持 private/service-only。
- location safety 风险、证据不足、授权不适用或政策不明确时 fail closed 到更低精度；若没有任何安全公开模式，则 `NOT_PUBLIC`。
- owner withdraw/delete、account delete、takedown 或 material location revision 必须按 D05/D06 hide-first；迟到 resolver/projection 不得恢复已退休 marker。
- 一个用户的位置授权不能替代另一用户；同一 BoardInstance association 不传播 location authorization 或 public precision。
- venueNote 的公开资格与 Public Location 的公开资格分别判断；备注缺失、待审或失败时只省略备注，只要 Public Location 与其他门禁仍有效，marker 可以继续存在。

## 9. `venueNote` and Venue boundary

`venueNote` 是用户或 curator 提供的可选上下文文本，不是 Venue identity、POI record 或位置证据的自动替代物。

公开职责分工是：PublicLocation 把地图用户带到安全投影的附近，合格 venueNote 帮助用户在现实环境中进一步找到版面。

D07-07 已调整并批准为 `PUBLIC_FROM_SAFETY_VERIFIED_SOURCE`：

- 玩家来源的 exact venueNote content 若可回溯到可信 V1 字段及对应 content/version 的 `MAP_NOTE` / `msgSecCheck` PASS，可继承该安全结论，无需在 V2 对完全相同文本重复审核；
- 继承还要求 source record 当前有效、适用的 MapContributionAuthorization scope 覆盖公开安全审核后的 venueNote、Rights/Public Eligibility 有效，且没有 withdraw/delete/takedown 使其失效；
- 若当前授权版本未覆盖 venueNote，新增公开范围仍按 D06-09 处理为 material scope expansion；不能用安全 PASS 代替授权；
- 文本发生任何改变即形成新 content version，旧安全 PASS 不适用；仅字段改名、复制或重新映射也不能凭字段名继承；
- `NETWORK_SOURCE`、provider、admin 或其他新文本不得借用玩家 V1 的安全结论，必须通过等价的新安全门；通过前或失败时只从公开投影省略 venueNote；
- note 中出现店名／楼层／地址不自动创建 Venue，也不能覆盖坐标证据、证明 BoardInstance identity 或迫使记录生成 marker；它最多是弱辅助上下文。

规范句：`Safety Review is inherited by content provenance, not by field name.`

## 10. Permission, manual and provider fallback

- 定位允许：只产生 private ObservationLocation evidence，仍需后续 projection。
- 定位拒绝／不可用：不得反复强迫授权；允许用户手选城市、区域或主动 manual pin，也允许记录保持无位置、仅作 private/internal fact。
- manual confirmed input 优先于未确认 provider suggestion，但不能覆盖原始 device/source evidence；二者分别版本化。
- OptionalLocationEnhancement 不可用、额度耗尽或返回冲突时，core path 继续使用 private evidence + manual/city/area resolution；无法安全解析则 fail closed。
- 腾讯 POI 不提供地图主数据，不参与 Opportunity，不能自动生成 Venue、BoardInstance 或 PublicMapLead。

## 11. Revision and lifecycle

| Change | Required version effect | Public effect |
| --- | --- | --- |
| observed coordinate、coordinate system、capturedAt、acquisition basis 或真实 location assertion 改变 | 新 immutable BoardObservationVersion | D05-09 hide old；新版本重新 Verification/Resolution/Eligibility/Projection |
| 只修正 derived transform、area mapping 或 provider result | 新 LocationResolution version，不伪造 Observation revision | 受影响 PublicLocationProjection 重新评估 |
| public precision mode／projection policy 改变但不扩大授权 scope | 新 PublicLocationProjection/Eligibility version | 按 current policy 重评；不自动要求新用户授权 |
| public precision 提高，或当前授权 scope 未覆盖 venueNote | 新 authorization version + 新 projection/eligibility | 未接受新版本时对新增范围 fail closed；既有位置字段不因此自动隐藏 |
| exact venueNote content 具有可验证的 V1 safety PASS 且授权 scope 已覆盖 | 复用 content/version-bound safety provenance；不重复审核 | 仍逐条通过 Rights/Eligibility/lifecycle；只投影获准字段 |
| venueNote 文本改变或来自 NETWORK_SOURCE/provider/admin/new input | 新 content version + 等价的新 safety decision | 审核通过前省略 note；合格 Public Location marker 可继续 |
| owner delete/withdraw 或 safety takedown | 不改写 location truth | hide-first；retired lead no-resurrection |
| late provider/resolver/projection result | 只归属原 input/context version | 不覆盖 current，不复活旧 marker |

## 12. Pilot Readiness location unit

旧“10 个 Confirmed Venue”不符合非 Venue 核心模型。推荐改为：

`10 PUBLIC_LOCATION_COVERAGE_UNITS`

一个 `PublicLocationCoverageUnit` 表示在当前批准的 precision policy 下、可形成至少一个安全 PublicLocationProjection 的独立空间覆盖单元。它用于衡量首轮地图是否有基本空间分布，不是 Venue、BoardInstance 或 marker 数量：

- 同一 coverage unit 可以有多个 BoardInstance；
- 一个 BoardInstance 的多条历史 Observation 不应虚增空间覆盖；
- 具体去重网格、距离、行政区规则和“10”是否适合真实 pilot，留给 TASK-V2-08/21 校准；
- 该指标仍只是 `PILOT_READINESS_TARGET`，不是 V2-B 或 V2-A PASS 条件。

## 13. Tabletop validation matrix

| ID | Scenario | Expected result |
| --- | --- | --- |
| L1 | PLAYER_DIRECT 具有 GCJ-02 device coordinate 与 accuracy | 保存 private ObservationLocation；不得直接公开 raw coordinate/accuracy |
| L2 | 用户拒绝定位但选择城市／区域 | 可建立明确 basis 的 LocationResolution；允许 AREA projection，不伪造 exact capture |
| L3 | 同一精确坐标有两张相同 IP 版面 | 返回多个 candidates；不得仅凭坐标 merge；允许多个 BoardInstance |
| L4 | 只有一个附近 candidate，但 structured state hard conflict | `NO_MATCH`；Location 不覆盖 hard conflict |
| L5 | 两条 Observation 的 public approximate marker 重合 | 不证明 private observations 同一实例；地图后续使用 overlap/aggregate contract |
| L6 | V1_HISTORY 有坐标但 coordinate system 未知 | 不作 silent GCJ-02；降级 resolution/AREA 或 NOT_PUBLIC |
| L7 | NETWORK_SOURCE 只有帖子中的商场文字 | 保存 private source assertion；geocode/POI 只作 candidate，不冒充 device exact point |
| L8 | 腾讯位置服务不可用或额度耗尽 | core Location/Eligibility 不被 provider availability 阻断；manual/city/area fallback 或 fail closed |
| L9 | exact Public Location 在当前 authorization scope 且 safety PASS | 可以进入 EXACT projection candidate；仍需其他 Eligibility gates，且不生成 Venue |
| L10 | authorization 只覆盖 approximate，政策拟提高为 exact | material scope expansion；新授权版本前 exact fail closed |
| L11 | `venueNote` 写有具体店名与楼层 | 只有 exact content 具可验证 safety PASS、授权 scope 覆盖且 Rights/Eligibility 有效时才可条件公开；始终不生成 Venue、不证明 BoardInstance identity |
| L12 | 没有任何可安全公开的位置模式 | 内部 Observation 可保留；PublicLocation=`NOT_PUBLIC`，不生成 marker |
| L13 | 原始观察坐标被用户修正 | 新 immutable ObservationVersion；旧 current lead hide，新版本重走门禁 |
| L14 | 只更新 derived 行政区映射 | 新 LocationResolution version；不伪造 Observation revision；重评投影 |
| L15 | A/B 记录同一 BoardInstance，A 删除 | A 的位置投影退出；B 的独立 eligible projection 可继续；不删除实例或传播授权 |
| L16 | 迟到 provider 结果指向已退休 lead | 丢弃 public advance；只记录原 context 结果，不复活 marker |

### Additional venueNote safety-provenance scenarios

| ID | Scenario | Expected result |
| --- | --- | --- |
| L-A | V1 玩家 note 的 exact content 已通过 `MAP_NOTE` / `msgSecCheck`，authorization、Rights、PublicLocation 均有效 | venueNote 可进入 public projection；继承原 content/version 的 safety provenance，不重复审核 |
| L-B | V1 note 无法证明对应 exact content/version 的 safety PASS | 省略 venueNote；若 PublicLocation 与其他门禁有效，marker 保持 |
| L-C | NETWORK_SOURCE 带来新的 venueNote | 不继承玩家 V1 审核；通过等价的新 safety gate 前省略 note |
| L-D | 同一 Location cluster 的两个 BoardInstance 都写“收银台旁” | note 不能证明 identity；保留多个实例及各自 lineage |
| L-E | provider suggestion 与 manual confirmed location 冲突 | provider 仅为 advisory；不得覆盖已确认 manual evidence |
| L-F | 只有 venueNote、没有合格 PublicLocation | 记录只保留内部事实，不生成 marker；note 不能制造坐标 |

## 14. Founder decisions approved

| Decision | Final approved result | Approval record |
| --- | --- | --- |
| `D07-01` location layers | `FOUR_LAYER_LOCATION_MODEL` | `APPROVED AS RECOMMENDED` |
| `D07-02` public coordinate semantics | `DECLARED_PRIVATE_CRS_GCJ02_PUBLIC` | `APPROVED AS RECOMMENDED` |
| `D07-03` Location in BoardInstance Resolution | `CANDIDATE_ONLY_NOT_IDENTITY_PROOF` | `APPROVED AS RECOMMENDED` |
| `D07-04` same Location cluster cardinality | `MULTIPLE_BOARD_INSTANCES_ALLOWED` | `APPROVED AS RECOMMENDED` |
| `D07-05` public precision modes | `EXACT_APPROXIMATE_AREA_NOT_PUBLIC` | `APPROVED AS RECOMMENDED` |
| `D07-06` MVP precision selection | `LEAST_PRECISE_SAFE_PROJECTION`；数值参数 deferred | `APPROVED AS RECOMMENDED` |
| `D07-07` venueNote | `PUBLIC_FROM_SAFETY_VERIFIED_SOURCE` | `ADJUSTED / HUMAN_APPROVED` |
| `D07-08` no eligible Public Location | `INTERNAL_ONLY_NO_MARKER` | `APPROVED AS RECOMMENDED` |
| `D07-09` manual/provider relationship | `MANUAL_CONFIRMED_PROVIDER_ADVISORY` | `APPROVED AS RECOMMENDED` |
| `D07-10` pilot location coverage | `PUBLIC_LOCATION_COVERAGE_UNIT`；具体去重参数 deferred | `APPROVED AS RECOMMENDED` |

D07-01—10 已形成 frozen contract input。TASK-V2-08 已正式批准这些语义在 public map contract 中的继承：`NOT_PUBLIC` 不生成 marker，venueNote 为 detail-only 条件字段，same-location multi-instance 保持独立；仍未创建 API、runtime、DB 或生产实现。

最终 founder decision 记录：

- `D07-01 = APPROVED / FOUR_LAYER_LOCATION_MODEL`
- `D07-02 = APPROVED / DECLARED_PRIVATE_CRS_GCJ02_PUBLIC`
- `D07-03 = APPROVED / CANDIDATE_ONLY_NOT_IDENTITY_PROOF`
- `D07-04 = APPROVED / MULTIPLE_BOARD_INSTANCES_ALLOWED`
- `D07-05 = APPROVED / EXACT_APPROXIMATE_AREA_NOT_PUBLIC`
- `D07-06 = APPROVED / LEAST_PRECISE_SAFE_PROJECTION`
- `D07-07 = ADJUSTED / HUMAN_APPROVED / PUBLIC_FROM_SAFETY_VERIFIED_SOURCE`
- `D07-08 = APPROVED / INTERNAL_ONLY_NO_MARKER`
- `D07-09 = APPROVED / MANUAL_CONFIRMED_PROVIDER_ADVISORY`
- `D07-10 = APPROVED / PUBLIC_LOCATION_COVERAGE_UNIT`

## 15. Deferred implementation and policy details

- runtime types、field names、enum、schema、Collection、geo index、API 和 client state；
- concrete meter、grid、rounding、offset、cluster radius、distance function 和 coordinate transform implementation；
- 各场景允许 EXACT/APPROXIMATE/AREA 的最终 policy table；
- location authorization UI copy、privacy declaration 和微信审核材料；
- venueNote 的 public allowlist/rendering、新来源 safety gate 实现、safety provenance persistence 与审核 UI；
- provider selection、key、quota、adapter、cache、licence 与费用；
- marker overlap/aggregate、viewport query 和无 marker 历史入口的实现；TASK-V2-08 已冻结服务语义，具体 UI/index/runtime 留到 TASK-V2-09/13/14/16/18；
- PublicLocationCoverageUnit 的去重参数和真实 pilot target 校准。

## 16. Validation record

- 四层位置职责无重叠，private evidence 与 public projection 明确分离。
- Location 只生成 BoardInstance candidates，同 cluster 多实例合法。
- `Location != Venue`；venueNote/POI 不成为 identity 或上图前置。
- public precision 只冻结四种语义，未冻结任何米级／网格／偏移参数。
- 微信原生 `<map>` 消费 GCJ-02-compatible public projection；腾讯位置服务保持 Optional Enhancement。
- permission denied、provider unavailable、unknown CRS 和 no-safe-location 均有 fail-closed fallback。
- material precision expansion 与 D06 authorization contract 一致；revision/hide/no-resurrection 与 D05 一致。
- venueNote 只可从 exact content/version 的安全 provenance 继承；字段名、来源类型或 BoardInstance association 均不能传播安全 PASS。
- venueNote fail closed 为字段级省略，不会在 PublicLocation 仍有效时自动移除 marker。
- L1—L16 与 L-A—L-F tabletop 全部具有确定 expected result。
- 未创建 runtime、backend、Cloud Function、DB/Collection、Storage、API、provider adapter 或生产配置。

`TASK_V2_07_AUTOMATED_DOCUMENT_REVIEW = PASS`

`TASK_V2_07_HUMAN_REVIEW = PASS / HUMAN_APPROVED`

`V2_IMPLEMENTATION_STARTED = NO`
