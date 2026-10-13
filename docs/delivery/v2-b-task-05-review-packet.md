# V2-B TASK-V2-05 Review Packet

> `HISTORICAL APPROVAL EVIDENCE / SUPERSEDED FOR CURRENT STATUS BY docs/delivery/v2-b-closeout-review.md / NOT EXECUTABLE`

> Status: `COMPLETE / HUMAN_APPROVED`
>
> Scope: `LIFECYCLE_SEMANTICS_ONLY`
>
> Production state enum/runtime implementation: `NOT_STARTED`

## Review outcome

TASK-V2-05 已形成正交生命周期语义合同，分别处理 Observation、Verification、Evaluation、Eligibility 和 Public Visibility。候选状态词只用于解释，不是生产 enum。

合同已覆盖：

- immutable revision 与 exact-version binding；
- Freshness 可复现语义；
- hide、withdraw、takedown、delete、retention 与 retirement 的区别；
- owner/account delete、policy/schema change、republish 和迟到任务；
- safety-first visibility precedence；
- no-resurrection。
- BoardInstance association 的 `UNIQUE_MATCH / NO_MATCH / AMBIGUOUS` 语义；
- 新 Observation 对实例 current state 的安全影响，以及 correction/unlink/relink；
- Human Assistance Budget、structured comparison 与“回答只是 evidence”的边界；
- Location 只生成候选、hard conflict 优先和 False-Merge-safe 规则。

`D04-A1` 已由执行命令批准，因此上述 BoardInstance 语义是本轮 D05 审核的固定输入，不新增待决定编号，也不重开 D04-01—08。

## Founder approval record

| ID | Approved decision |
| --- | --- |
| `D05-01` | `HYBRID_SEMANTIC` Freshness；不决定存储或调度 |
| `D05-02` | `HIDE_CURRENT_KEEP_HISTORY` |
| `D05-03` | `POLICY_BOUNDED_LAYERED` |
| `D05-04` | `HIDE_AND_SEPARATE_DELETE` |
| `D05-05` | `SCOPED_DELETE_MINIMAL_RETIREMENT` |
| `D05-06` | `HIDE_FIRST_POLICY_RETENTION` |
| `D05-07` | `NEW_PUBLIC_LEAD_ID` |
| `D05-08` | `SAFETY_PRECEDENCE` |
| `D05-09` | `HIDE_OLD_CURRENT_REEVALUATE_NEW` |

### D05-09 approved semantics

- board facts、observedAt、公开／rights 相关 Source provenance、Observation Location，或其他会改变 public board state、public location、eligibility/current-map interpretation 的 revision，立即使旧 PublicMapLead 退出 current map。
- 旧 Observation 和历史事实继续保留，不等于 delete。
- 新 immutable version 必须重新经过适用的 Verification、Evaluation、Eligibility 和 Public Projection。
- 完全不影响公开事实的内部 metadata／技术信息变化不得创建 BoardObservationVersion，应使用对应 metadata/derived-object version。
- 同一 BoardInstance 的 `UNIQUE_MATCH` 后继若证明旧状态过时，执行 hide-old；`AMBIGUOUS` 不得被误当成继承关系，不隐藏仍可能独立存在的实例。

## Gate effect

- TASK-V2-04：`COMPLETE / HUMAN_APPROVED`。
- TASK-V2-05：合同、自动验证和 founder 人工审核均已完成，当前为 `COMPLETE / HUMAN_APPROVED`。
- TASK-V2-06：统一版本化地图贡献授权、Source/Rights、R1—R14、R-A—R-J 与 D06-01—10 已 `COMPLETE / HUMAN_APPROVED`。
- TASK-V2-07：Location Model 合同、L1—L16、L-A—L-F 与 D07-01—10 已 `COMPLETE / HUMAN_APPROVED`。
- TASK-V2-08：`READY / NOT_STARTED`。
- TASK-V2-09—22 与 V2-C—E：`LOCKED / NOT_STARTED`。
- runtime/backend/Cloud Functions/DB/Storage/API implementation/production config changes：`0`。

自动检查结果：workflow、Prettier、diff whitespace、V2-A evidence、22-task/28-field/state、五维语义、17 条最终 invariants、D04-A1/S1—S10 compatibility、D05-01—09、no-production-enum、下游 06—22 继承与 production-scope diff 均为 `PASS`；V1 frozen recognition contract 监测哈希不变。

## References

- `docs/research/v2-b/v2-lifecycle-semantics-contract.md`
- `docs/research/v2-b/v2-domain-model-contract.md`
- `docs/research/v2-b/v2-board-instance-resolution-contract.md`
- `memory-bank/implementation-plan.md`

`V2_IMPLEMENTATION_STARTED = NO`

`TASK_V2_05_HUMAN_REVIEW = APPROVED`
