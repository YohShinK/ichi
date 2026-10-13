# V2 Source / Rights Model Contract

> Task: `TASK-V2-06`
>
> Status: `COMPLETE / HUMAN_APPROVED`
>
> Scope: `SOURCE_PROVENANCE_AND_PUBLIC_RIGHTS_SEMANTICS_ONLY`
>
> Runtime/API/DB changes: `0`

## 1. Purpose and boundary

本合同定义 `PLAYER_DIRECT / PLAYER_ASSISTED / V1_HISTORY / NETWORK_SOURCE` 的 provenance、observedAtBasis、source subject owner、operational steward、authorization/consent basis、withdrawal authority、takedown owner 与 rights evidence/version。

它只冻结产品／系统合同，不判断某一外部内容的具体法律结论，也不替代后续 privacy/rights review。缺少明确依据时 Public Eligibility 必须 fail closed。

本任务不创建 source enum、runtime type、数据库、Collection、API、crawler、scheduler、seeding job、Storage 或生产配置，也不读取、回填或公开 V1 生产记录。

## 2. Approved inputs

继承以下已批准事实：

- Source 只用于溯源，不产生 trust score、tier、weight、Verification 豁免或 Opportunity 加权。
- 四类 Source 均进入相同 `NOT_VERIFIED → ICHI Recognition/Extraction/Board Validation → VERIFIED` 流程。
- `Freshness != truth`；observedAt basis 按来源确定，但 fetchedAt/verifiedAt 不得冒充 observedAt。
- D05-04—07 已冻结 withdraw/delete/takedown/no-resurrection：hide-first、delete 独立、retired identity 不复用。
- D05-09 已冻结 public-affecting provenance revision 立即隐藏旧 current lead并重新评估。
- D04-A1 已冻结跨来源 BoardInstance association 不合并 Observation、Source 或 Rights lineage。
- NETWORK_SOURCE 只用于 V2 首次上线前的三阶段 Initial Data Seeding，不是持续自动采集系统。
- Founder 已批准 `VERSIONED_MAP_CONTRIBUTION_AUTHORIZATION`：用户明确接受当前授权版本后，该版本范围内符合条件的历史与未来玩家记录持续适用，不做逐记录 consent。
- Founder 已批准 `10_DISTINCT_ELIGIBLE_REPORTS → AUTO_HIDE + MODERATION_REVIEW`；阈值是可版本化 MVP policy，不是不可变领域常量，也不替代可信高风险 notice 的独立 hide-first。

## 3. Source provenance contract

以下为语义字段组，不是 runtime schema：

| Field group | Required meaning | Public boundary |
| --- | --- | --- |
| source identity | sourceType、opaque internal sourceRecordRef、sourceVersion | private；不得派生 publicLeadId |
| source/record label | 已批准的稳定 public-facing record type 或 network label | conditional public；不编码 private owner identity；PLAYER contributor 另由 public-safe Profile projection 表达 |
| observation time | observedAt、observedAtBasis、原始时间证据 ref | observedAt 可条件公开；basis/evidence private |
| ingestion | ingestedAt、ingestion method、seedingBatchRef | private/service-only |
| source subject owner | 控制 ICHI 内来源记录／授权的主体；不表示拥有实体版面、IP 或地点 | private |
| operational steward | 负责处理、rights review、withdraw/takedown propagation 的 ICHI role | service-only |
| authorization basis | consent、permission、licence 或经批准的其他明确 basis | basis class/version service-only；不得公开敏感 evidence |
| rights evidence | evidenceRef、evidenceVersion、capturedAt、policyVersion、review actor/decision | private/service-only |
| withdrawal authority | 谁可撤销当前公开授权，以及 authority evidence | private/service-only |
| takedown owner | 负责接收、裁决、hide-first 和后续处置的 ICHI role | service-only |
| public eligibility ref | exact source/version、rights assessment version、reason codes | service-only |

`sourceSubjectOwner` 表示谁控制 ICHI 内的来源贡献或授权，不构成其拥有实体版面、角色 IP、店铺或第三方内容权利的声明。

## 4. Source-specific responsibility matrix

| Source | observedAtBasis | Source subject owner | Operational steward | Authorization basis | Withdrawal authority | Takedown owner | Public label |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `PLAYER_DIRECT` | `CAPTURED_AT`；缺可信拍摄时间时允许 `SUBMITTED_AT_FALLBACK` 并明确 basis | 上传者 ICHI Account，private | ICHI contribution/public-data operations | accepted current `MapContributionAuthorization` version 覆盖的玩家未来贡献与 public Profile attribution | contribution owner；ICHI admin/rights process 可独立下架 | ICHI public-data operations | `UPLOAD_RECORD / 上传记录` + public-safe contributor |
| `PLAYER_ASSISTED` | 产生当前结构化状态的权威 draw/event time | 抽赏会话 owner，private | ICHI contribution/public-data operations | accepted current `MapContributionAuthorization` version 覆盖的玩家未来贡献与 public Profile attribution | contribution owner；ICHI admin/rights process 可独立下架 | ICHI public-data operations | `DRAW_RECORD / 抽赏记录` + public-safe contributor |
| `V1_HISTORY` | exact source-specific version 可追溯的 capture/submission time | V1 ownerAccountId，private | ICHI history/public-data operations | accepted current `MapContributionAuthorization` version 明确覆盖历史上传与 public Profile attribution；不要求逐条 re-consent | accepting owner；ICHI admin/rights process 可独立下架 | ICHI public-data operations | 继承 origin path 为 `DRAW_RECORD` 或 `UPLOAD_RECORD` + public-safe contributor |
| `NETWORK_SOURCE` | 原公开帖子发布时间；fetchedAt 单独保存 | `NONE_IN_ICHI`；外部 author/publisher/rightsholder ref 仅在必要时私有记录 | 指定 ICHI seeding curator + public-data takedown owner | item-level rights assessment + evidence/version；公开可见本身不充分 | 无 ICHI owner withdrawal；外部权利主张方通过 takedown 流程 | ICHI public-data operations | 网络来源 |

任一来源缺 operational steward、rights basis/version 或 takedown owner 时，都只能保留在合法的内部处理范围，不得通过 rights eligibility。

## 5. Rights layers and exact-version binding

Rights 与其他结论分层：

1. `SourceProvenance` 回答来源与时间。
2. `Verification` 回答结构化事实是否被 ICHI 核对。
3. `SourceRightsAssessment` 候选语义回答 exact source/observation version 是否具备进入公开资格评估的依据。
4. `PublicEligibilityDecision` 综合 Rights、Consent、Location、Fields、Privacy、Moderation 和 Visibility。
5. `PublicProjection` 只投影最终通过的 allowlist。

`SourceRightsAssessment` 只是合同概念，不是本轮创建的 runtime type。它至少绑定 exact sourceVersion、observationVersion、适用的 authorizationVersion/scope、rightsEvidenceVersion、rightsPolicyVersion、reviewedAt/actor 与 reason codes。

每条 Observation/source version 仍独立判断授权适用性、rights、withdraw/delete、takedown 与 Public Eligibility。统一授权只回答“该用户是否允许授权范围内这类记录进入地图流程”，不把多条记录或多位用户的 Rights lineage 合并。

内部 schema、backend、API、storage、projector、Opportunity/Freshness 算法或不扩大公开范围的 policy 变化，可以重新做 Eligibility/policy assessment，但不自动使用户授权失效。只有图片、位置精度、个人信息、贡献者信息、用途或其他用户合理预期发生实质性公开范围扩大时，才必须发布新授权版本。venueNote 是否需要新授权取决于当前 authorization version 的明确 scope：已覆盖“公开安全审核后的备注”时不逐条重签；未覆盖时属于 material public-scope expansion。用户未接受新增范围时 fail closed，旧范围是否继续适用由版本间 scope compatibility contract 决定。

TASK-V2-07 的 `PUBLIC_FROM_SAFETY_VERIFIED_SOURCE` 不改变上述 Rights 边界：可验证的 V1 `MAP_NOTE` / `msgSecCheck` PASS 只随 exact content/version provenance 继承，不能随字段名、Source 类型或 BoardInstance association 继承；安全 PASS 也不能替代 authorization、Rights 或 Public Eligibility。文本变化及 NETWORK_SOURCE/provider/admin 新文本必须通过等价的新安全门，失败时只省略 venueNote，合格 PublicLocation marker 可以保留。

## 6. Versioned Map Contribution Authorization

`D06-01 / D06-02` 共同冻结 `VERSIONED_MAP_CONTRIBUTION_AUTHORIZATION`：用户在 V2 地图上线后的首次“我的”页面或首次需要地图贡献授权的入口，明确接受当前 `MapContributionAuthorization` 版本。一次接受覆盖该版本已说明范围内符合条件的历史与未来玩家记录；同一版本不在每次打开、每次上传、每条记录或 BoardInstance association/correction 时重复弹窗。

授权版本至少说明：历史与未来合格记录可能进入地图；地图只展示结构化公开投影、observedAt/Freshness 和处理后的公开位置；不是实时库存或消费保证；玩家安全昵称和头像会随获准 contribution 展示；用户可删除自己的云端上传，删除后地图 hide-first；举报、权利通知、安全审核或平台治理可能触发隐藏／下架；PublicMapLead 不等于原始上传；BoardInstance association 不合并不同用户的 Source/Rights lineage。

该授权不绕过每条记录独立的 Verification、Opportunity、Rights、Location、Safety、Moderation、Public Eligibility 或生命周期判断。用户未接受当前适用授权版本时，其历史与未来玩家记录均不得进入该版本新增的 V2 公开范围。

`ownerAccountId`、openid、account/profile internal IDs、phone、auth/session state 与 private avatar Storage metadata 不进入 public payload。PLAYER detail 可通过独立 public Profile projection 返回安全 displayName 和 public-safe avatar reference；缺自定义资料时使用 `ICHI 玩家` 与 ICHI fallback avatar，Profile completion 不作地图门禁。具体法务文本、页面排版、checkbox 文案、授权事实存储、public avatar delivery 和 Profile snapshot/current strategy留到后续任务。

## 7. V1_HISTORY rights boundary

V1 Current Publication 的 exact APPROVED Submission 只提供私有事实和 owner lineage，不授予 V2 public rights。

批准规则：

- owner 接受当前 `MapContributionAuthorization` 版本后，该版本明确覆盖的历史记录无需逐条 re-consent，可自动进入逐记录 Public Eligibility；
- 只有仍存在、未被用户删除、owner binding 与 exact approved source truth 可追溯、Verification 可用且 Rights/Location/Safety 等当前门禁通过的记录才能进入 Public Projection；
- 不把账号继续使用、V1 上传或旧 consent 当作新 V2 授权；未接受当前授权版本时全部历史记录保持 private/non-public；
- 统一授权不等于 bulk-public PASS；每条记录仍保留独立 lineage、eligibility、withdraw/delete 与 takedown state；
- owner withdraw/delete、account delete 或 material public-scope expansion 时按 D05/D06 重新评估和 hide-first；
- 本任务不扫描、迁移、回填或写入 V1 数据。

## 8. NETWORK_SOURCE Initial Data Seeding rights

NETWORK_SOURCE 固定为人工策展、批次有界、首次上线前的一次性导入准备：

### Stage 1

单一区域约 20 条样本逐条建立 source URL/ref、publishedAt、fetchedAt、rights basis/evidence/version、curator、batch、Verification 与失败原因。只有 item-level rights assessment 和全部 Public Eligibility 门禁通过的数据才可形成公开候选。

### Stage 2

只有 Stage 1 经人工批准后才扩大。扩大前必须冻结 source allowlist、batch cap、rights review owner、stop conditions、cost 和 takedown path；仍不得创建持续 crawler/scheduler。

### Stage 3

只导入处理完成的统一版面事实；公开投影继续逐条评估。完成后关闭 batch，迟到任务不得写入新 current state 或复活 retired lead。

推荐网络来源范围采用 `CURATED_ALLOWLIST_ITEM_LEVEL_RIGHTS`：来源域／类型需经批准，每一条仍必须有独立、版本化 rights evidence。仅能访问、可搜索、未登录可见或带原图的帖子都不自动构成再发布许可。依据不足的样本只能用于获准的内部研究或直接排除，不能进入 PublicMapLead。

NETWORK_SOURCE 永远显示“网络来源”，不得伪装成 PLAYER_DIRECT/ASSISTED。source URL 默认 private；只有 attribution/rights policy 明确要求或允许、URL 经安全审核且不会泄漏 private context 时才可作为条件公开字段。TASK-V2-08 最终冻结 public allowlist。

## 9. Withdrawal, takedown and account deletion

| Event | Authority | Immediate effect | Later processing |
| --- | --- | --- | --- |
| player record withdrawal | exact contribution owner | exact record authorization applicability invalid + public hide | private facts 按 policy 保留；可另提 delete |
| My Uploads cloud-source record delete | authenticated record owner | exact source authorization applicability invalid；对应 public lead/projection hide-first，不再返回 | scoped delete/anonymize；只留 minimal retirement fact；late async 不得复活 |
| player/account delete | authenticated owner/account process | authorization invalid + active leads hide/retire | scoped delete/anonymize；只留 minimal retirement fact |
| ICHI admin takedown | authorized ICHI role | public hide，不等待清理 | review、audit、retention 按 policy |
| credible external rights notice | validated claimant/source/platform notice，ICHI takedown owner 接管 | accepted notice 后 hide-first | 调查、恢复或退休按版本化 decision 处理 |
| 10 distinct eligible ordinary reports | policy-qualified、去重后的 authenticated reporters | auto-hide + moderation review；不改写 Verification | moderation 决定 restore/takedown/delete；阈值由 policyVersion 控制 |
| network source removed/changed | seeding/public-data steward | re-evaluate rights；依据失效时 hide | 最小 evidence retention 由 policy 决定 |
| material public-scope expansion | ICHI policy owner | 新增范围等待新 authorization version；未接受时 fail closed | 旧范围按 scope compatibility contract 决定是否继续 |

“立即”冻结为不等待异步 evidence cleanup、cache TTL 或后台删除才停止公开返回的产品语义，不在 V2-B 写死具体分钟级 SLA。实际 operational target、告警和演练由 V2-C/E 冻结并验证。

普通举报按 distinct authenticated/eligible reporters 去重；同一账号重复请求只计一次，已判定 spam/abuse 的举报不计。9 个有效举报不触发该数字阈值，达到第 10 个才触发 auto-hide；无论是否达到阈值都不得直接物理删除或把 Verification 改为 false。具体 anti-abuse、rate limit、账号资格和设备风控 deferred。可信权利、隐私、安全或平台高风险 notice 不等待普通举报阈值，继续按 D06-08 hide-first。

## 10. BoardInstance Resolution compatibility

- 所有四类 Source 的 VERIFIED Observation 都可参与候选生成和 BoardInstance Resolution。
- association 到同一 BoardInstance 不转移、合并或共享 consent、rights basis、owner、source label 或 takedown state。
- 同一实例的一条 NETWORK_SOURCE 因 rights 失效而隐藏，不自动删除或撤回同实例的合法 PLAYER observation；反向同理。
- current-state selection 只能从同时满足自身 exact Rights/Eligibility 的 Observation 产生公开结果。
- Human Assistance evidence 保存 private source user/reference、comparison refs、createdAt、answer 和 resolver context/version；它不是 public attribution，也不能改变来源权利。
- BoardInstance inherit/split/correction/unlink/relink 不要求重复地图贡献授权，除非公开 scope 本身发生 material expansion。
- D05-09 继续适用：public-affecting Source provenance revision 使对应旧 current lead hide；AMBIGUOUS 不足以证明继承，不误隐藏其他实例。

## 11. Public record type, source labels and attribution

Founder Addendum `D06-A1` 调整公开 attribution：

| Source | Required public semantics | Contributor/profile | URL |
| --- | --- | --- | --- |
| PLAYER_DIRECT | `UPLOAD_RECORD / 上传记录` | detail 返回安全 displayName + public-safe avatar；无自定义 Profile 使用默认语义 | 不适用 |
| PLAYER_ASSISTED | `DRAW_RECORD / 抽赏记录` | detail 返回安全 displayName + public-safe avatar；无自定义 Profile 使用默认语义 | 不适用 |
| V1_HISTORY | 按实际 origin path 映射 `UPLOAD_RECORD` 或 `DRAW_RECORD` | 仅在当前 MapContributionAuthorization 适用时投影安全 Profile | 不适用 |
| NETWORK_SOURCE | 网络来源 | 不伪造 ICHI contributor | 默认不公开；只在获批 attribution policy 下条件公开 |

Record type 只表示产品流程执行路径，public contributor 只表示获准的安全 Profile 投影。二者都不表示 Verification 强弱、Opportunity 高低、Freshness、实时性、推荐程度或 trust score。

## 12. Tabletop validation matrix

| ID | Scenario | Expected result |
| --- | --- | --- |
| R1 | V1 exact APPROVED record 只有旧 consent，owner 尚未接受当前地图授权 | V2 public rights fail closed；保持 private/non-public |
| R2 | owner 已接受当前地图授权，PLAYER_DIRECT 新记录通过 Verification | 不重复弹窗；自动进入逐记录 Eligibility，但不自动 PASS |
| R3 | PLAYER_ASSISTED owner 撤回 | hide-first；Verification 不变；delete 独立 |
| R4 | NETWORK_SOURCE 帖子公开可见但无明确 rights evidence | 不公开；公开可见不等于可再发布 |
| R5 | allowlisted network item 有版本化 permission/licence/evidence | 可进入其余 Eligibility gates；固定标注“网络来源” |
| R6 | network URL 含不安全参数或 attribution 未批准 | URL private，不阻塞合法结构化事实按其他门禁评估 |
| R7 | NETWORK_SOURCE 与 PLAYER_DIRECT 关联同一 BoardInstance | 两条 Source/Rights lineage 独立；一方失效不传播给另一方 |
| R8 | Initial Data Seeding batch 已关闭后迟到任务完成 | 不进入新 current state，不复活 retired lead |
| R9 | player account delete | consent 全部失效，公开 hide/retire，按范围删除／匿名化 |
| R10 | policy/version 只做内部技术变化且公开 scope 不变 | 可重做 assessment，但用户授权不自动失效 |
| R11 | credible rights notice 被受理 | public hide-first；调查和 evidence retention 后续处理 |
| R12 | Human Assistance 回答 SAME_BOARD | evidence 保留 private provenance；不转移 rights 或直接 merge |
| R13 | sourceType 从 NETWORK_SOURCE 更正为 PLAYER_DIRECT | 创建 affected version、旧 public state hide；不得只改 label |
| R14 | source label 相同但 Verification/Freshness 不同 | label 不产生 trust/weight；各结论按自身 exact versions |

### Founder adjustment tabletop

| ID | Scenario | Expected result |
| --- | --- | --- |
| R-A | 用户有 20 条合格 V1_HISTORY，首次接受 MapContributionAuthorization v1 | 不逐条弹授权；逐记录自动进入 Eligibility；各自 lineage 独立，不合格记录 fail closed |
| R-B | 用户已接受 v1，之后上传新记录并通过审核 | 不再次弹 consent；自动进入 Eligibility，通过全部门禁后才进入地图 |
| R-C | 用户在“我的上传”删除一条已公开云端记录 | 对应地图状态立即 hide；其他记录不受影响；只留 minimal retirement fact；late async 不复活 |
| R-D | A/B Observation 关联同一 BoardInstance，A 删除 | A lineage 退出；B 不退出；B 仍 eligible 时可继续支撑 current map state |
| R-E | 9 个 distinct eligible ordinary reports | 不触发 10-report auto-hide；不得 destructive delete；是否提前 review 由 policy 决定 |
| R-F | 第 10 个 distinct eligible ordinary report | auto-hide + moderation review；不物理删除；Verification truth 不改写 |
| R-G | 同一账号重复举报 10 次 | 只计 1 个 distinct reporter，不触发阈值 |
| R-H | 只有 1 条但属于可信高风险 rights notice | 直接 hide-first，不等待普通举报阈值 |
| R-I | authorization v1 → v1.1 仅内部 schema/backend 技术变化 | 不要求用户重新授权；必要时只重做 Eligibility/policy assessment |
| R-J | 新版本拟公开图片、更精确位置、新增个人字段，或首次把未被当前 scope 覆盖的 venueNote 纳入公开 | 发布新 authorization version；未重新确认时对新增 scope fail closed；已明确覆盖的 exact safety-passed note 不逐条重签 |

### D06-A1 public Profile authorization tabletop

| ID | Scenario | Expected result |
| --- | --- | --- |
| S-A | 首次 V2 MapContributionAuthorization 明确覆盖合格历史+未来记录、PublicLocation、获准 venueNote、玩家安全昵称/头像展示，以及 My Uploads 删除后的 hide-first | 用户一次接受当前版本，不逐条 consent；因为 V2 尚未上线，这是初始公开 scope，不是 retroactive expansion |
| S-B | 玩家未接受当前 V2 MapContributionAuthorization | PLAYER records 不进入新增地图公开范围，public Profile 也不投影；私有 Profile 与记录不因此删除 |

## 13. Founder decisions approved

| Decision | Final approved result | Approval record |
| --- | --- | --- |
| `D06-01` V1_HISTORY public rights | `VERSIONED_MAP_CONTRIBUTION_AUTHORIZATION` covering eligible history | `ADJUSTED / HUMAN_APPROVED`；取消逐条 re-consent |
| `D06-02` PLAYER contribution consent scope | `VERSIONED_MAP_CONTRIBUTION_AUTHORIZATION` covering eligible future records | `ADJUSTED / HUMAN_APPROVED`；取消逐条 exact-preview consent |
| `D06-03` player public attribution | historical `SOURCE_LABEL_ONLY_ANONYMOUS` | `SUPERSEDED BEFORE V2 LAUNCH BY D06-A1`；不重开 TASK-V2-06 |
| `D06-04` NETWORK_SOURCE allowed scope | `CURATED_ALLOWLIST_ITEM_LEVEL_RIGHTS` | `APPROVED AS RECOMMENDED` |
| `D06-05` network URL in public payload | `PRIVATE_DEFAULT_CONDITIONAL_ATTRIBUTION` | `APPROVED AS RECOMMENDED` |
| `D06-06` network rights sufficiency | `PUBLIC_VISIBILITY_NOT_SUFFICIENT_FAIL_CLOSED` | `APPROVED AS RECOMMENDED` |
| `D06-07` player withdrawal/delete | `OWNER_WITHDRAW_ICHI_HIDE_FIRST + SEPARATE_DELETE` | `APPROVED WITH UNIFIED AUTHORIZATION CLARIFICATION` |
| `D06-08` takedown handling | `AUTHORIZED_OR_CREDIBLE_NOTICE_HIDE_FIRST` | `APPROVED AS RECOMMENDED`；分钟级 SLA deferred |
| `D06-09` authorization/policy version change | `REASSESS_ON_MATERIAL_SCOPE_CHANGE` | `ADJUSTED / HUMAN_APPROVED` |
| `D06-10` network evidence after takedown | `POLICY_BOUNDED_MINIMAL_EVIDENCE` | `APPROVED AS RECOMMENDED`；期限 deferred |

`D06-A1 = PUBLIC_PLAYER_PROFILE_ATTRIBUTION / FOUNDER_ADDENDUM / HUMAN_APPROVED`：V2 尚未上线，因此首个实际 MapContributionAuthorization 版本直接把安全昵称、头像、record type 和删除 hide-first 写入初始 scope，不构成上线后的 retroactive expansion。Attribution 不改变 Rights lineage、Verification、Opportunity、Freshness 或 BoardInstance association；NETWORK_SOURCE 仍不伪造玩家 Profile。

其他 founder-approved policy 保持：`MY_UPLOADS_CLOUD_DELETE → MAP_HIDE_FIRST + MINIMAL_NO_RESURRECTION_FACT`；`10_DISTINCT_ELIGIBLE_REPORTS → AUTO_HIDE + MODERATION_REVIEW`。TASK-V2-06 保持 `COMPLETE / HUMAN_APPROVED`；TASK-V2-07 保持 `COMPLETE / HUMAN_APPROVED`；TASK-V2-08 已正式批准 D06-A1 对 public detail/authorization scope 的继承，当前为 `COMPLETE / HUMAN_APPROVED`。

## 14. Deferred implementation and policy details

- runtime schema、enum、indexes、Collection、API 和 jobs；
- exact public field allowlist 的 runtime encoding 与 PublicMapLead source object；
- consent UI copy、authorization acceptance storage、scope compatibility implementation 和 account actions；
- 具体 source domain allowlist、外部协议逐条法律判断和复核流程；
- retention durations、分钟级 takedown SLA、告警和复原条件；
- report anti-abuse、rate limit、reporter eligibility、设备风控、moderation workflow 与阈值调整实现；
- seeding batch 规模、真实数据导入与生产发布；
- 持续 NETWORK_SOURCE ingestion；该能力需新 Gate，当前禁止。

## 15. Validation record

- 四类 Source 均有 observedAtBasis、owner/steward、authorization、withdrawal/takedown 与 public label 语义。
- Source 不产生 trust score，Rights PASS 不替代 Verification/Opportunity/Freshness/Public Eligibility。
- D06-A1 已在 V2 首次上线前替代 D06-03 的匿名 attribution：PLAYER detail 可显示安全 nickname/avatar 与 record type，private account/profile identity 仍禁止；S-A—S-B 通过。
- V1 旧 consent 不自动继承；用户接受版本化地图贡献授权后，授权范围内合格历史与未来记录不逐条重复 consent；每条记录仍独立 Eligibility/Rights lineage。
- NETWORK_SOURCE 仍为三阶段一次性 Initial Data Seeding，不创建持续采集。
- BoardInstance association 不合并或转移 Source/Rights lineage。
- withdraw/takedown/account delete、policy change、late batch 和 no-resurrection 与 D05 一致。
- My Uploads 云端来源记录删除 hide-first；10 distinct eligible reports 只触发 auto-hide/moderation，不直接 delete 或改写 Verification。
- 非实质技术变化不要求重新授权；material public-scope expansion 必须新授权版本，未接受时对新增范围 fail closed。
- 未定义法律结论、生产 enum、schema、API、crawler、job 或 storage implementation。
- runtime/backend/Cloud Functions/DB/Collection/Storage/API implementation/production config changes=`0`。

`TASK_V2_06_AUTOMATED_DOCUMENT_REVIEW = PASS`

`TASK_V2_06_HUMAN_REVIEW = PASS / HUMAN_APPROVED`

`V2_IMPLEMENTATION_STARTED = NO`
