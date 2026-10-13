# V2 Lifecycle Semantics Contract

> Task: `TASK-V2-05`
>
> Status: `COMPLETE / HUMAN_APPROVED`
>
> Production state enum: `NOT_DEFINED`
>
> Runtime/API/DB changes: `0`

## 1. Purpose and approved inputs

本合同冻结一条版面情报在 observation、verification、evaluation、eligibility 与 public visibility 五个正交维度上的状态语义、事件和转换约束。它不建立单一总状态，也不冻结完整生产枚举、数据库字段或 API 状态码。

继承 TASK-V2-04 已批准事实：

- BoardObservation 与 VerifiedBoard 分离。
- stable lineage 下 revision 使用 immutable versions。
- Evaluation 绑定精确 VerifiedBoard version。
- Opportunity level 与 Public Eligibility PASS 分离。
- PublicCandidate 只可作为可选 service workflow concept。
- 一个 observation lineage 同时最多 `0..1` active PublicMapLead。
- CanonicalBoard 在 V2 MVP 中 `DEFER`。
- contributor 控制来源贡献与撤回，ICHI 管理派生验证、评估和 public visibility。
- `D04-A1` 已通过非破坏性 Addendum 冻结 BoardInstance 的保守唯一继承；CanonicalBoard 继续 `DEFER`。

## 2. Orthogonal semantic dimensions

下表中的词只用于解释语义，不是生产 enum：

| Dimension | Required questions | Candidate explanatory labels |
| --- | --- | --- |
| Observation | 是否已接收、可处理、当前、被修订、被拒绝 | received / accepted / current / superseded / rejected |
| Verification | 是否开始、处理中、成功、可重试失败或终止失败 | not-started / processing / verified / retryable-failure / terminal-failure |
| Evaluation | 是否有充分输入、对应哪个 policy/version、是否已被替代 | not-evaluated / sufficient / insufficient / superseded |
| Eligibility | 哪些公开门禁已满足、缺失或失效 | not-checked / pending-requirement / eligible / ineligible |
| Public visibility | 是否从未公开、可见、暂时隐藏、被撤回、被下架或永久退休 | never-public / visible / hidden / withdrawn / taken-down / retired |

实现阶段可以选择不同命名或拆分字段，但必须保持五个维度可以独立变化。任何 UI 聚合状态都只能是这些事实的派生展示，不能反向成为领域 truth。

## 3. Lifecycle invariants

1. `observedAt` 是事实时间；Freshness 是以 `observedAt + asOf + policyVersion` 产生的评估。
2. Freshness 降低不修改 Observation、Verification 或 VerifiedBoard。
3. `Expired` 不作为真实性、删除或唯一总状态。
4. revision 创建新 BoardObservationVersion；旧版本通过 supersedes relation 退出 current，但不原地覆盖。
5. Verification/Evaluation 结果只对其精确输入版本有效。
6. Public Eligibility 任一相关输入版本或 policy 变化时必须重新评估，旧 Eligibility PASS 不自动继承；但用户地图贡献授权只在实质扩大公开范围时需要新授权版本。
7. hide 只改变 public visibility；withdraw 撤销来源拥有者的公开授权；takedown 是 ICHI/权利流程的公开下架；delete 处理数据本体；retention 决定合法保留期限。
8. 所有 withdraw、takedown、delete 和 account-delete 先执行 public hide，不等待后台清理完成。
9. retired public identity 不得由迟到事件、重试或 republish 复活。
10. `null=unknown` 与 `0=confirmed zero` 在 revision、evaluation 和 public visibility 变化中保持不变。

### 3.1 Founder-approved closure checklist

1. `Freshness != truth`。
2. `Freshness != real-time accuracy guarantee`。
3. `hide != delete`。
4. `withdraw != delete`。
5. `takedown != verification failure`。
6. revision 使用 immutable Observation versions，不原地覆盖事实。
7. Verification/Evaluation 只对精确输入版本有效。
8. old Eligibility PASS 不自动继承新的 version/policy；同一 `MapContributionAuthorization` scope 可持续适用，只有 material public-scope expansion 才要求重新授权。
9. withdrawal、takedown、delete、account-delete 均 hide-first。
10. retired public identity no-resurrection。
11. late async result 不得覆盖 current pointer 或 public visibility。
12. `null = unknown`。
13. `0 = confirmed zero`。
14. Observation 永远独立保留，不做 destructive merge。
15. 同一 BoardInstance 的历史 Observation 不等于多条 current-map state。
16. `AMBIGUOUS` 是合法 resolution 语义，不能为了地图整洁强行合并。
17. Human Assistance evidence 不能单独覆盖 hard conflict。

## 4. Event and transition semantics

| Event | Observation | Verification/Evaluation | Eligibility | Public visibility |
| --- | --- | --- | --- | --- |
| source accepted | 创建 immutable version，标记当前候选 | 尚未开始 | not checked | never public |
| verification starts | 不变 | 产生绑定该 version 的 attempt | 不变 | 不变 |
| verification succeeds | 不变 | 产生 VerifiedBoardVersion | 可开始后续 evaluation | 不变 |
| verification retryable failure | 不变 | attempt 失败但允许新 attempt | 不得通过 | 不变 |
| verification terminal failure | version 可内部保留 | 不产生 VerifiedBoard | ineligible for this version | 不变 |
| opportunity evaluation created | 不变 | 绑定精确 VerifiedBoardVersion 和 policyVersion | 只提供一个 gate 输入 | 不变 |
| freshness evaluated/re-evaluated | 不变 | 新评估绑定 observedAt/asOf/policyVersion | 根据获批 freshness policy 重审 | 可能可见、低新鲜度隐藏或维持历史可见 |
| versioned map authorization accepted / per-record rights applicable | 不变 | 不变 | 更新对应 requirement，不自动 PASS | 不变 |
| all eligibility gates pass | 不变 | 不变 | eligible for exact version set | 允许 Public Projection，不自动假设已发布 |
| public-affecting observation revision | 新 immutable version 成为 current，旧 version 被 supersede | 新版本重新验证；旧结果仍归旧版本 | 旧 eligibility 不适用于新版本 | 旧 lead 立即退出 current map；新版本通过全部门禁后才可重新出现 |
| internal technical policy/schema change without public-scope expansion | 不变 | 可触发新 evaluation | 重新评估 Eligibility；现有授权不自动失效 | 只按新 Eligibility 结果变化 |
| material public-scope expansion | 不变 | 可触发新 evaluation | 新增范围必须绑定新 authorization version；未接受时 fail closed | 旧范围按 scope compatibility contract 决定是否继续 |
| owner withdraws | 私有事实按 retention policy 处理 | ICHI 派生事实不被改写 | public authorization 失效 | hide-first → withdrawn semantic |
| admin/rights takedown | 私有事实按 rights/retention policy 处理 | 不改写历史 Verification | eligibility 失效 | hide-first → taken-down semantic |
| owner deletes source record | 删除／匿名化范围按 policy 执行 | 派生事实按合法保留范围处理 | 失效 | hide-first → retired；写最小 no-resurrection fact |
| account deletion | account-bound ownership/PII 删除或匿名化 | 不把删除误写成 verification failure | 所有关联 consent 失效 | hide-first；active leads retire |
| republish after correction | 必须使用 current immutable version | 重新使用精确 evaluations | 新 eligibility、适用的授权版本和 moderation | retired publicLeadId 不复用 |
| 10 distinct eligible ordinary reports | 不变 | 不改写 Verification/Evaluation | moderation pending/ineligible for current public return | auto-hide + moderation review；不直接 delete |
| late async result | 不改变 current version | 只归属原输入版本 | 不得恢复失效 PASS | 不得覆盖 current/retired visibility |

## 5. Freshness semantics candidates

Source truth 只保存可追溯 `observedAt`；FreshnessEvaluation 必须可由 `observedAt + asOf + policyVersion` 重现。

| Model | Benefit | Risk |
| --- | --- | --- |
| dynamic | 查询时接近当前时点 | 重现历史页面和审计较难，可能增加查询成本 |
| snapshot | 结果稳定、易审计 | 需要明确刷新触发，否则展示可能过旧 |
| hybrid semantic | 规则可重算，同时公共结果携带明确 asOf snapshot | 实现阶段需设计刷新策略，但不要求 V2-B 选择存储方式 |

已批准 `HYBRID_SEMANTIC`：合同同时要求 deterministic recomputation 和带 asOf 的可复现结果；何时计算、是否持久化、如何调度全部留到后续技术设计。

低 Freshness 不删除记录。已批准在未来获批阈值下退出“当前机会”默认地图，并通过历史入口继续展示 observedAt、asOf 和低参考程度说明；具体小时／天数阈值不在 V2-B 冻结。

## 6. Retention, hide and delete semantics

| Concept | Changes | Does not imply |
| --- | --- | --- |
| Freshness decline | current reference value | false data、delete、rights loss |
| hide | public visibility | private truth deletion |
| owner withdrawal | public authorization | automatic erasure of all lawful audit/derived facts |
| admin takedown | public availability | verification was false |
| delete | specified source/personal data scope | reuse of old public identity |
| retention expiry | removal/anonymization under policy | Opportunity/Verification conclusion rewrite |
| tombstone/retirement fact | minimal no-resurrection control | full private payload retention |

已批准 `POLICY_BOUNDED_LAYERED` retention：

- structured observation facts：在合法基础和明确 policy 下保留；owner delete/rights loss 时按批准范围删除或匿名化；
- temporary image/evidence：继续遵守最短必要周期和 V1 frozen storage boundary；
- authorization/rights/moderation audit：只保留证明决策所需的最小字段和期限；
- public payload/cache：hide-first 后按短周期清理；
- retirement fact：只保存 opaque public identity、retiredAt 和 reason class 等最小 no-resurrection 信息。

具体期限、法律依据和物理删除机制不在 TASK-V2-05 冻结。

## 7. Revision and conflict rules

- 修改 observed board facts、observedAt、Source provenance 或 Observation Location，必须创建新 BoardObservationVersion。
- 仅 Opportunity/Freshness policy 改变时，创建新 Evaluation，不创建虚假 observation revision。
- public field policy、location projection 或公开 scope 改变时，创建新 Eligibility/Projection version，不覆盖历史决策；只有 material scope expansion 要求新 MapContributionAuthorization version。
- venueNote 的 exact content/version safety provenance 失效、缺失、待审或失败时，公开投影只省略该字段；若 PublicLocation 与其余 Eligibility 仍有效，不自动隐藏 marker。venueNote 内容发生变化时旧 safety PASS 不得沿用，并按新 content version 重新评估。
- 同 lineage current version 只由单调、可比较的版本关系推进。
- 无法证明 supersedes relation 的输入保持独立 lineage，进入 duplicate/conflict review。
- late result 只能完成其原始 attempt/evaluation 记录，不能更新 current pointer 或 public visibility。
- 只要 revision 涉及 board facts、observedAt、会影响公开或 rights 的 Source provenance、Observation Location，或任何会改变 public board state、public location、Public Eligibility/current-map interpretation 的事实，旧 PublicMapLead 必须立即退出 current map。
- 新版本必须重新通过适用的 Verification、Evaluation、Eligibility 和 Public Projection；不得为了地图不断档继续展示已知可能过时的旧状态。
- 完全不影响 Observation truth 或公开 payload 的内部 metadata／技术信息变化不创建 BoardObservationVersion，改由对应 metadata 或 derived-object version 表达。

## 8. BoardInstance association lifecycle addendum

BoardInstance association 是独立、可纠错的 service relationship lifecycle，不是 Observation/Verification/Evaluation/Eligibility/Public Visibility 五个维度中的生产总状态，也不增加完整 runtime enum。

`UNIQUE_MATCH / NO_MATCH / AMBIGUOUS` 只冻结 resolution 语义：

| Resolution event | Association effect | Current-map effect |
| --- | --- | --- |
| verified Observation enters resolution | 以精确 Observation/VerifiedBoard/resolver context 建立候选集 | 不因候选存在自动公开或隐藏 |
| exactly one compatible candidate | 新增 accepted association，旧 Observation 保持历史 | 新 Observation 成为该 BoardInstance 的 latest trusted state candidate |
| no compatible candidate / hard conflict | 创建新 BoardInstance，不连接旧实例 | 同位置／同 IP 可以作为不同实例并存 |
| multiple equally compatible candidates | 保持 unresolved candidates，不形成 accepted association | 不隐藏其他实例，不折叠为一个已确认 current state |
| human `SAME_BOARD` | 只新增 evidence；hard conflict 仍阻止 association | 不直接触发 merge 或 projection |
| human `DIFFERENT_BOARD` | 新增 conflict evidence，提高后续自动关联门槛 | 不执行不可逆 split 或 destructive rewrite |
| human `CANNOT_TELL` | 不形成正／负 identity 结论 | 保持 AMBIGUOUS |
| correction / unlink / relink | 追加版本化 decision，原 Observation/evidence 不变 | 重新评估 current pointer、Eligibility 与 Projection |
| late resolver/human result | 只归属原 context/version | 不覆盖新 association，不恢复旧 lead |

当新 Observation 已安全解析到同一 BoardInstance，并足以证明旧公开状态已经过时，旧 current lead 必须先退出 current map；新 Observation 尚未通过 Public Eligibility 时允许出现暂时空档，不以“不断档”为理由继续展示已知过时状态。

Human Assistance 受 budget/cooldown/skip 约束：一次上传最多一次 comparison，用户可以跳过，不回答不降低正常功能；多候选没有单一高价值比较时不询问。精确频率和视觉表现留给 V2-D/pilot。

Freshness 仍只表达 Observation 距离 asOf 的时间，不保证 BoardInstance 现实状态未变化，也不替代 association resolution。

## 9. Approved visibility precedence

多个语义同时存在时，已批准按安全优先决定公开结果：

`DELETE/RETIRED > TAKEDOWN > WITHDRAWN > INELIGIBLE > HIDDEN_BY_FRESHNESS > VISIBLE`

该顺序只定义“是否可以公开返回”的裁决优先级，不是生产状态枚举。高优先级原因不能被低优先级刷新、re-evaluation 或 retry 覆盖。

## 10. Founder decisions approved

| Decision | Approved result | Frozen meaning |
| --- | --- | --- |
| `D05-01` Freshness semantics | `HYBRID_SEMANTIC` | observedAt 为事实时间；支持确定性重算和带 asOf 的可复现结果；持久化、调度和技术实现 deferred |
| `D05-02` low Freshness visibility | `HIDE_CURRENT_KEEP_HISTORY` | 达到未来批准阈值后退出 current map，但历史入口保留；Freshness 不触发 delete |
| `D05-03` lawful structured-fact retention | `POLICY_BOUNDED_LAYERED` | structured facts、temporary evidence、audit、public cache 和 minimal retirement fact 分层；具体期限 deferred |
| `D05-04` owner withdrawal | `HIDE_AND_SEPARATE_DELETE` | 撤回先使 public authorization 失效并 hide；删除／匿名化是独立请求 |
| `D05-05` owner/account delete | `SCOPED_DELETE_MINIMAL_RETIREMENT` | 删除或匿名化该 owner/source lineage 的批准范围与 active derivation，只保留最小 no-resurrection fact；仅当没有其他 eligible support 时整个 BoardInstance public lead retire |
| `D05-06` admin/rights takedown | `HIDE_FIRST_POLICY_RETENTION` | 公开先下架；不改写 Verification；evidence retention 由后续 policy 决定 |
| `D05-07` republish after retirement | `NEW_PUBLIC_LEAD_ID` | retired identity 永不复用；correction/republish 使用新 publicLeadId |
| `D05-08` visibility precedence | `SAFETY_PRECEDENCE` | `DELETE/RETIRED > TAKEDOWN > WITHDRAWN > INELIGIBLE > HIDDEN_BY_FRESHNESS > VISIBLE`；只用于 public-return 裁决，不是生产总状态 |
| `D05-09` public-affecting revision/current map | `HIDE_OLD_CURRENT_REEVALUATE_NEW` | 影响公开事实的 immutable revision 使旧 lead 立即退出 current map；新版本完整重走门禁；内部 metadata 变化不得伪造 Observation revision；AMBIGUOUS 不得误隐藏独立实例 |

用户通过 `TASK-V2-05_Founder_Review_Approval_Command.md` 批准 D05-01—08，并按上述更严格语义批准 D05-09。`D04-A1` 保持固定输入，不增加新的 D05 编号。TASK-V2-06 后续批准的统一版本化授权、My Uploads cloud-source delete hide-first 与举报 auto-hide 只补充 Source/Rights/Moderation 输入，不重开 D05-01—09。

TASK-V2-08 Founder 调整只补充 D05-07 的适用边界，不重开或改写该决定：只要 resolved BoardInstance 在连续 active public lifecycle 中始终至少有一个 eligible supporting Observation，supporting Observation、来源或贡献者可以变化，`publicLeadId` 保持稳定并仅递增 `servedVersion`；各 Observation 的 Rights 与 provenance lineage 仍分别判定。若所有 eligible support 消失，则必须先 hide 并 `RETIRE`；之后重新公开属于新的 lifecycle，必须使用新的 `publicLeadId`。

### 10.1 TASK-V2-06 approved compatibility

- `VERSIONED_MAP_CONTRIBUTION_AUTHORIZATION` 可覆盖同一用户授权范围内的合格历史与未来记录，但每条 Observation/source version 仍独立通过 Eligibility 并保留 withdraw/delete/takedown lifecycle。
- My Uploads 中云端来源记录删除继续使用 D05-05：该 contribution derivation 立即 hide/retire，不等待物理清理，只留最小 no-resurrection fact；纯本地 Local Board 删除不自动等同于云端来源删除。若另一条独立 eligible Observation 已持续支撑同一 BoardInstance，BoardInstance public lifecycle 可继续并保持 publicLeadId；Rights/owner lineage 不转移。
- `10_DISTINCT_ELIGIBLE_REPORTS` 只触发 auto-hide + moderation review；不直接 delete，也不将 Verification 改为 false。可信权利／隐私／安全 notice 不等待该阈值。
- D06-09 `REASSESS_ON_MATERIAL_SCOPE_CHANGE` 区分 Eligibility 重评与授权重签：内部技术变化可重评但不自动使授权失效，实质扩大公开范围才要求新授权版本。

## 11. Validation record

- 五个正交维度均可独立变化，不存在单一总状态。
- 候选标签明确不是 runtime enum。
- Freshness、retention、hide、withdraw、takedown 和 delete 已分层。
- revision、policy change、late result 和 no-resurrection 有明确约束。
- 统一版本化授权、material-scope reauthorization、My Uploads cloud-source delete 与 report-threshold hide 均与五维生命周期兼容。
- BoardInstance association 采用保守唯一继承；歧义不自动 merge/hide；human evidence 不具有最终裁决权。
- `Freshness != truth`、`Freshness != real-time accuracy guarantee`、`hide != delete`、`withdraw != delete`、`takedown != verification failure` 均保持。
- public-affecting revision 立即移除旧 current lead；完全内部 metadata 变化不创建 Observation revision。
- PublicMapLead storage strategy、Freshness storage/scheduling 和所有具体 retention duration 均未实现或提前冻结。
- 未创建数据库、API、runtime type、Cloud Function、Storage 或生产配置。

`TASK_V2_05_AUTOMATED_DOCUMENT_REVIEW = PASS`

`TASK_V2_05_HUMAN_REVIEW = APPROVED`

`TASK_V2_05_STATUS = COMPLETE / HUMAN_APPROVED`

`V2_IMPLEMENTATION_STARTED = NO`
