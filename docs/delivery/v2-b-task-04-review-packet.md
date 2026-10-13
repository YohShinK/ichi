# V2-B TASK-V2-04 Review Packet

> `HISTORICAL APPROVAL EVIDENCE / SUPERSEDED FOR CURRENT STATUS BY docs/delivery/v2-b-closeout-review.md / NOT EXECUTABLE`

> Status: `COMPLETE / HUMAN_APPROVED`
>
> Scope: `DOMAIN_MODEL_CONTRACT_ONLY`
>
> Runtime/API/DB implementation: `NOT_STARTED`

## Review outcome

TASK-V2-04 已形成可人工审阅的 Domain Model Contract。合同冻结候选覆盖：

- BoardObservation、Verification、VerifiedBoard、OpportunityEvaluation、FreshnessEvaluation、PublicEligibilityDecision、PublicProjection 与 PublicMapLead 的职责；
- identity、immutable revision、exact-version binding、cardinality 与 ownership；
- private、service-only、public 三层边界；
- V1 P1/exact approved Submission 到 BoardObservation 的只读 adapter 映射；
- 迟到结果、撤回、重复、位置不足与 no-resurrection 场景；
- EDG/PDG 当前状态及后续任务 owner。

PublicMapLead 只作为公开服务边界，不预设物化、动态或混合实现。Lifecycle 未建立生产枚举；Location 未建立具体米级策略。

## Founder decision record

用户于 2026-09-11 批准 `D04-01—08 AS RECOMMENDED`：

| ID | Recommended decision |
| --- | --- |
| `D04-01` | Observation 与 VerifiedBoard 保持独立对象 |
| `D04-02` | stable lineage 下使用 immutable observation versions |
| `D04-03` | OpportunityEvaluation 绑定精确 VerifiedBoard version |
| `D04-04` | Opportunity level 与 Public Eligibility PASS 分离 |
| `D04-05` | PublicCandidate 只作为可选 service workflow concept，不进入核心 entity 链 |
| `D04-06` | 一个 observation lineage 同时最多 `0..1` active PublicMapLead |
| `D04-07` | CanonicalBoard 在 V2 MVP 中 `DEFER` |
| `D04-08` | contributor 控制来源贡献与撤回；ICHI 管理派生验证、评估和公开 visibility |

人工决定：`TASK-V2-04 = CONTINUE / HUMAN_APPROVED`。

## BoardInstance Resolution Addendum

用户随后通过执行命令批准非破坏性补充：

| ID | Approved decision |
| --- | --- |
| `D04-A1` | `BOARD_INSTANCE_RESOLUTION_MODEL = CONSERVATIVE_UNIQUE_CONTINUATION` |

该补充定义 BoardInstance、结构化事实匹配、唯一继承、歧义保留、可纠错 association 与稀缺 Human Assistance evidence；不重开 D04-01—08，不实现 resolver，也不改变 `CanonicalBoard = DEFER`。

## Gate effect

- TASK-V2-04：workflow、format、diff、22-task/28-field、状态、D04/invariant/boundary、D04-A1/S1—S10 与 production-scope 自动检查全部 PASS，现为 `COMPLETE / HUMAN_APPROVED`。
- TASK-V2-05：Lifecycle Semantics 合同与 D05-01—09 已 `COMPLETE / HUMAN_APPROVED`。
- TASK-V2-06：统一版本化地图贡献授权、Source/Rights 与 D06-01—10 已 `COMPLETE / HUMAN_APPROVED`；TASK-V2-07 Location Model 与 D07-01—10 已 `COMPLETE / HUMAN_APPROVED`，TASK-V2-08 为 `READY / NOT_STARTED`。
- V2-C—E 与 TASK-V2-09—22：保持 `LOCKED / NOT_STARTED`。
- 未创建或修改 runtime、backend、Cloud Functions、DB、Storage、API implementation 或 production config。

## References

- `docs/research/v2-b/v2-domain-model-contract.md`
- `docs/research/v2-b/v2-board-instance-resolution-contract.md`
- `memory-bank/implementation-plan.md`
- `docs/research/v2-a/v2-information-expression-model.md`
- `docs/research/v2-a/v2-data-source-verification-freshness-lifecycle.md`

`V2_IMPLEMENTATION_STARTED = NO`
