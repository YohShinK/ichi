# V2 BoardInstance Resolution Contract

> Tasks: `TASK-V2-04 ADDENDUM / TASK-V2-05 INPUT`
>
> Status: `HUMAN_APPROVED ADDENDUM / DOCUMENTED`
>
> Decision: `D04-A1 BOARD_INSTANCE_RESOLUTION_MODEL = CONSERVATIVE_UNIQUE_CONTINUATION`
>
> Runtime/API/DB changes: `0`

## 1. Purpose

本合同补充“多个独立观察是否指向现实中的同一张具体实体版面”的领域语义。它不重开 TASK-V2-04，不撤销 D04-01—08，也不实现 resolver、schema、Collection、API、Cloud Function、Storage 或生产配置。

V2 MVP 采用 `Conservative Unique Continuation`（保守唯一继承）：只有在结构化事实无硬冲突且仅存在一个合理候选时，才允许建立同一 BoardInstance 的连续关系。`False Merge` 的成本高于 `False Split`，因此无法唯一辨认时保持拆分或歧义。

## 2. BoardInstance definition

`BoardInstance` 表达现实世界中某一地点、某一时间连续存在的一张具体实体版面实例。它回答不同来源、不同用户、不同时间产生的 Observation 是否观察了现实中的同一张持续版面。

固定边界：

- `BoardObservation` 是独立、不可变、可追溯的观察事实。
- 多个不同 lineage 的 BoardObservation 可以关联同一个 BoardInstance。
- 关联不物理合并、覆盖或删除 Observation，也不抹除 Source/Rights lineage。
- BoardInstance 只表达现实实体连续性，不承担 Verification、Opportunity、Freshness、Rights 或 Public Eligibility。
- 关联必须允许后续 correction、unlink 与 relink；原始 Observation 保持不变。

## 3. Concept separation

| Concept | Answers | Explicit non-equivalence |
| --- | --- | --- |
| BoardObservation | 谁在何时、何地观察到什么 | 不等于 BoardInstance 或公开 current state |
| VerifiedBoard | 哪个精确 Observation version 的结构化版面事实已被 ICHI 核对 | 不等于现实连续性 identity |
| BoardInstance | 多个已核对 Observation 是否属于同一张持续存在的实体版面 | 不等于 Observation、VerifiedBoard、Venue、PublicMapLead 或 CanonicalBoard |
| PublicMapLead | 公开地图可读取的 storage-agnostic 服务结果 | 不能反向成为 BoardInstance truth |
| CanonicalBoard | 更高层跨来源／跨记录的规范化对象 | 继续 `DEFERRED`；本合同不重启自动 canonical merge |

BoardInstance 只解决“这次持续存在的具体实体版面是不是同一张”。它不把相同 IP、主题或结构的所有记录规范化为同一个全局对象。

## 4. Relationship, cardinality and authority

| From | Relationship | To | Invariant |
| --- | --- | --- | --- |
| BoardInstance | `1:N` | resolved BoardObservationVersion | 每个 Observation 保持独立历史；实例只组织连续性 |
| BoardObservationVersion | `0..1 resolved at a resolution version` | BoardInstance | `AMBIGUOUS` 时没有 accepted association |
| BoardObservationVersion | `0:N candidates` | BoardInstance | candidate relation 不等于 accepted identity |
| resolution attempt/context | `1:N` | candidate/evidence records | 必须保存输入版本、resolver context/version 与结论依据 |
| BoardInstance association | versioned/correctable | unlink/relink decision | 纠错新增决定，不改写原始 Observation |
| resolved BoardInstance | `0..1 current map state` | PublicMapLead service result | 历史 Observation 默认不重复成为 current marker；存储策略仍 deferred |

ICHI resolver/审核域管理 association decision 和 current-state selection；来源 owner 仍管理其贡献与授权，不能直接命令 destructive merge。Human Assistance 只提交 evidence，不能覆盖 hard conflict。

## 5. Candidate generation

Location 只用于缩小候选集合：同一商场、附近坐标、location cluster 或可选地点描述都可以形成候选，但不能单独证明 identity。

固定规则：

`Location = candidate generation signal, NOT identity proof`

原因包括同店多板、同店多张同款板、室内 GPS 漂移和街区店铺聚集。`Location != Venue` 继续成立；腾讯 POI 不进入 BoardInstance identity 核心链路。

## 6. Board Identity Signature

第一核心判断是两个 Observation 是否至少属于同一种结构化版面。候选 signature 只能引用已验证、稳定、可重现的结构化版面事实，例如：

- IP、Theme；
- 赏级组成与 tier structure；
- Grand Prize 结构；
- 已核对的初始／结构化票位信息；
- 后续合同确认实际存在的其他稳定字段。

具体字段集合由 TASK-V2-08 和后续 schema contract 冻结。本轮不定义权重、阈值或算法。

禁止把 Opportunity、Freshness、包套金额或 venueNote 作为 identity 证明；它们最多是辅助解释。即使两个实例具有完全相同且安全审核通过的 venueNote，也不能覆盖 identity signature/state transition 冲突或把同一 Location cluster 强制合并。若 identity signature 明显不同，结果为 `NO_MATCH`。

## 7. Board State Transition

第二核心判断是新 Observation 是否可能是候选 BoardInstance 随时间推进后的物理合理状态：

- 以 `observedAt` 排序，新 Observation 必须晚于候选前序；
- 总余票和各赏级 remaining 原则上只减少或保持；
- 已确认 `0` 的赏不能在未识别重置的同一连续实例中恢复为正数；
- 变化必须具有物理可解释性；
- `null=unknown` 不能当成 `0`，也不能作为单调下降证明；
- 总余票或多个赏级明显回升默认表示补货、换箱或新板，结论为 `NO_MATCH / NEW_INSTANCE`。

未来如存在明确验证的特殊业务规则，必须版本化并重新通过合同门；本轮没有此类例外。

## 8. Conservative Unique Continuation

以下术语只冻结语义，不要求成为 runtime enum：

| Resolution result | Required conditions | Effect |
| --- | --- | --- |
| `UNIQUE_MATCH` | identity compatible、state transition 合理、且只有一个无冲突候选 | 关联既有 BoardInstance；新 Observation 成为最新可信状态候选，旧 Observation 保留历史 |
| `NO_MATCH` | 没有合理候选、identity 不同或存在 hard transition conflict | 创建新 BoardInstance；同位置／同 IP 不得强制继承 |
| `AMBIGUOUS` | 两个或更多候选同样合理，或证据不足以唯一确认 | 不自动 merge、不强选；保留完整 Observation 和候选关系，允许长期存在 |

`False Split` 可由未来 evidence 纠正；`False Merge` 会隐藏真实实例并错误继承状态，因此 resolver 必须以避免 False Merge 为优先。

## 9. Multi-identical-board extreme case

同店、同位置附近可以同时存在两张或更多完全相同系列版面，即使 IP、Theme、结构、GPS 和 remaining 都很接近。此时“当前无法辨认”是合法结论：

- 不猜测、不为了地图整洁合并；
- 保持多个 BoardInstance 或 `AMBIGUOUS`；
- 等待后续状态轨迹或额外 evidence 自然消歧。

## 10. Image-independent MVP

BoardInstance Resolution 必须能只用 verified structured board facts 工作，不依赖长期保留版面图片。

- V2 MVP 不要求 thumbnail、image hash 或 visual physical fingerprint。
- 不修改 V1 图片 retention，也不重新引入原图长期依赖。
- `Image / Physical Fingerprint = OPTIONAL / DEFERRED`，不得成为 MVP blocker。

## 11. Human Assistance Budget

Human Assistance 是稀缺辅助证据，不是上传、审核或记录生成的必经步骤：

- 用户可以跳过；`无法辨认` 是合法答案；不回答不降低正常功能。
- 一次上传流程最多出现一次 comparison interaction，不允许 A→B→C 连续询问。
- 近期已帮助的用户应进入 cooldown。
- 只有真实、高价值且会影响当前地图继承的 `AMBIGUOUS`，现场用户可能知情、存在一个最值得比较候选且未超预算时，才有资格询问。
- 多个几乎等价候选无法形成单一高价值比较时不询问，继续保持 `AMBIGUOUS`。

精确频率、每日上限和 cooldown 时长由 V2-D／pilot 调整，本轮不冻结。

## 12. Structured comparison-card semantics

MVP comparison UI 必须可以完全基于结构化信息工作：左侧“之前的记录”，右侧“你刚上传的记录”。候选字段包括观察时间、IP/Theme、总余票、各赏级 remaining、Grand Prize remaining、稳定版面结构和可用店内位置备注。

Opportunity、包套金额和 Freshness 只能作为次级理解信息，不能伪装成 identity 证据。

固定回答语义为：

- `SAME_BOARD`：是同一张；
- `DIFFERENT_BOARD`：不是同一张；
- `CANNOT_TELL`：无法辨认。

这些只冻结交互语义，不冻结最终文案、视觉或 runtime enum。

## 13. Human evidence boundary

回答只产生 `BoardInstanceResolutionEvidence`，不是 merge command。至少记录：

- evidence type；
- private source user/reference；
- 被比较的 Observation/candidate references；
- createdAt；
- answer semantic；
- 当时的 resolver context/version。

约束：

- `SAME_BOARD` 不能覆盖 identity/state hard conflict。
- `DIFFERENT_BOARD` 提高再次自动关联门槛，但单次回答不能造成不可逆 split 或 destructive rewrite。
- `CANNOT_TELL` 不产生正／负 identity 结论。
- evidence 可追溯、可由后续 evidence 重新评估。

## 14. Map current-state semantics

- `UNIQUE_MATCH`：旧 Observation 保留历史；新 Observation 成为实例最新可信状态候选；同一 resolved BoardInstance 在当前地图语义下最多暴露一个 current state。
- 如果新 Observation 已足以证明旧公开状态过时，即使新状态尚未完成 Public Eligibility/Projection，旧 current lead 也先退出 current map；新 lead 等门禁完成后再出现。
- `NO_MATCH`：保留不同 BoardInstance，同位置、同 IP 可以同时显示多个实例。
- `AMBIGUOUS`：不自动继承、不隐藏其他实例、不折叠成一个已确认事实；地图合同必须支持多实例、重叠／聚合和历史入口。

PublicMapLead 的 identity、物化、request-time 或 hybrid storage strategy 继续 `DEFERRED`。

## 15. Freshness versus real-time accuracy

Freshness 只表达距离最近一次可信观察过去多久，不保证现实状态未发生变化：

`Freshness != real-time accuracy guarantee`

`observedAt` 是事实时间；Freshness 由 `observedAt + asOf + policyVersion` 推导。地图必须显示非实时边界。新的 ICHI Observation 只有在被安全解析到某 BoardInstance 后，才能成为该实例的新 current state。

## 16. Correction, unlink and relink

- association decision 必须版本化并记录 actor/policy/resolver context。
- correction 追加新决定，不修改原始 Observation 或旧 evidence。
- unlink 只解除错误连续性关系，不删除两端 Observation。
- relink 必须重新通过当前 hard-conflict 与 unique-continuation 规则。
- current pointer、Public Eligibility 和 Public Projection 必须对关联变化重新评估。
- 迟到 resolver/human evidence 只能归属原始 context/version，不得覆盖新的 association 或复活 retired public identity。
- 用户接受统一版本化地图贡献授权后，BoardInstance inherit/split/correction/unlink/relink 不触发逐条重复授权；但 association 永远不能把 A 用户的授权传给 B 用户，也不能替代每条 Observation/source version 的独立 Eligibility、withdraw/delete 或 takedown state。

## 17. Future implementation boundary

V2-C 才允许在另行批准后设计／实现 resolver、candidate lookup、BoardIdentitySignature、BoardStateTransition checker、association persistence、correction/unlink/relink、projector behavior 和 V1→V2 adapter。V2-D 才实现 structured comparison、budget/cooldown/skip 和多实例地图交互。V2-E 才用完整自动／真机／pilot 场景验证。

本轮不创建任何 runtime type、数据库 schema、Collection、API、Cloud Function、Storage、后台任务或生产配置。

## 18. Scenario matrix

| ID | Scenario | Expected contract result |
| --- | --- | --- |
| S1 | 50 分钟前 A=1/B=2/total=32；新观察 A=0/B=2/total=27；identity 一致且唯一候选 | `UNIQUE_MATCH`；旧 Observation 留历史，新 Observation 成为 current candidate |
| S2 | 同店旧 A=0/total=15；新 A=3/total=80 | `NO_MATCH / NEW_BOARD_INSTANCE` |
| S3 | 同店两张同款板；identity/location 一致且两个候选都能解释新状态 | `AMBIGUOUS`；禁止自动 merge |
| S4 | 同店但 identity signature 不同 | `NO_MATCH`；地图允许并存 |
| S5 | 旧观察 50 分钟前 A=1，中间由非 ICHI 用户抽取；新观察 A=0 且变化合理 | 可 `UNIQUE_MATCH`；Freshness 不宣称期间实时准确 |
| S6 | 状态存在 hard conflict，用户回答 `SAME_BOARD` | 不 merge；human evidence 不能覆盖 hard conflict |
| S7 | resolver 强烈支持唯一继承，用户回答 `DIFFERENT_BOARD` | 不执行不可逆 split；进入 evidence conflict/conservative handling |
| S8 | 用户回答 `CANNOT_TELL` | 保持 `AMBIGUOUS` |
| S9 | 多个同样合理候选且没有唯一高价值 comparison | 不连续询问；不触发 Human Assistance |
| S10 | 旧 A=`null`，新 A=`0` | 不把 unknown 当作此前 confirmed zero；保持 `null != 0` |

## 19. Downstream inheritance

| Scope | Required inheritance |
| --- | --- |
| TASK-V2-05 | association lifecycle、三种 resolution 语义、current-state safety、human evidence、correction/no-resurrection |
| TASK-V2-06 | 所有 Source 可参与 resolution；Source 不作 trust score；统一版本化授权不因 association 重复弹窗，也不跨用户／记录转移；关联不抹除 provenance/rights；human evidence 有 provenance |
| TASK-V2-07 | Location 只生成候选；同 cluster 可有多个实例；私有 location evidence 不进入公开投影；POI 非 identity |
| TASK-V2-08 | `COMPLETE / HUMAN_APPROVED`：resolved instance 最多一个 current state；连续 active 且始终有 eligible support 时 supporting Observation 可切换、`publicLeadId` 稳定而 `servedVersion` 更新；全部 support 消失则 hide + RETIRE，后续 lifecycle 使用新 ID；不同实例可同地点并存；AMBIGUOUS 不伪装确认；支持 overlap/density/history，绝不 auto-merge。publicLeadId 绝不能反向作为 resolver evidence |
| V2-C / TASK-V2-09—13 | resolver/resource/projector/API 设计须处理候选、关联纠错、current-state hide-first、multi-instance 与 late-result safety |
| V2-D / TASK-V2-14—18 | structured comparison、budget/cooldown/skip、multi-instance/overlap UX 和非实时表达 |
| V2-E / TASK-V2-19—22 | 覆盖 S1—S10、误判、长期歧义、自动消歧、骚扰预算、late/no-resurrection 与 `null != 0` |

## 20. Validation record

- `D04-01—08` 保持不变；`CanonicalBoard = DEFER`。
- `D04-A1` 只补充受限的现实实体连续性解析，不引入 canonical merge。
- 五维 Lifecycle、hide/delete、Freshness/truth、immutable Observation 和 no-resurrection 均保持。
- PublicMapLead storage strategy、production enum、identity signature 字段、算法权重／阈值、位置米级策略与 Human Assistance 频率全部 deferred。
- V1 frozen recognition contract 未修改。
- runtime/backend/Cloud Functions/DB/Collection/Storage/API implementation/production config changes=`0`。

`D04_A1_FOUNDER_APPROVAL = APPROVED_BY_EXECUTION_COMMAND`

`BOARD_INSTANCE_RESOLUTION_CONTRACT = DOCUMENTED`

`BOARD_INSTANCE_RESOLUTION_AUTOMATED_DOCUMENT_REVIEW = PASS`

`V2_IMPLEMENTATION_STARTED = NO`
