# V2-B TASK-V2-07 Review Packet

> `HISTORICAL APPROVAL EVIDENCE / SUPERSEDED FOR CURRENT STATUS BY docs/delivery/v2-b-closeout-review.md / NOT EXECUTABLE`

> Status: `COMPLETE / HUMAN_APPROVED`
>
> Scope: `LOCATION_MODEL_CONTRACT_ONLY`
>
> Runtime/API/DB implementation: `NOT_STARTED`

## Review outcome

TASK-V2-07 已形成四层 Location Model 合同：内部 Observation Location、derived Location Resolution、公开 Public Location Projection 和非核心 Optional Location Enhancement 完全分层。

合同已经验证：

- `Observation Location != Public Location != Venue`；
- Location 只生成 BoardInstance candidates，不能单独证明 identity；
- 同一 Location cluster 可以有多个 BoardInstance；
- public precision 只定义 EXACT/APPROXIMATE/AREA/NOT_PUBLIC 语义，不冻结具体米数、网格或偏移；
- 未知坐标系、定位拒绝、provider unavailable 和无安全公开位置均 fail closed；
- 腾讯 POI／腾讯位置服务不成为 MVP core dependency；
- venueNote 采用 `PUBLIC_FROM_SAFETY_VERIFIED_SOURCE`：exact content 可继承可验证的 V1 `MAP_NOTE` / `msgSecCheck` PASS，但字段名不能继承安全结论；
- 新内容及 NETWORK_SOURCE/provider/admin 文本需要等价的新安全门，未通过时只省略 note，合格 marker 可保留；
- L1—L16 与 L-A—L-F tabletop 覆盖 candidate-not-proof、multi-instance、precision、revision、authorization、safety provenance 与 fallback。

## Founder decisions

| ID | Final decision |
| --- | --- |
| `D07-01` | `FOUR_LAYER_LOCATION_MODEL` |
| `D07-02` | `DECLARED_PRIVATE_CRS_GCJ02_PUBLIC` |
| `D07-03` | `CANDIDATE_ONLY_NOT_IDENTITY_PROOF` |
| `D07-04` | `MULTIPLE_BOARD_INSTANCES_ALLOWED` |
| `D07-05` | `EXACT_APPROXIMATE_AREA_NOT_PUBLIC` |
| `D07-06` | `LEAST_PRECISE_SAFE_PROJECTION`；数值参数 deferred |
| `D07-07` | `PUBLIC_FROM_SAFETY_VERIFIED_SOURCE` — `ADJUSTED / HUMAN_APPROVED` |
| `D07-08` | `INTERNAL_ONLY_NO_MARKER` when no eligible Public Location |
| `D07-09` | `MANUAL_CONFIRMED_PROVIDER_ADVISORY` |
| `D07-10` | `PUBLIC_LOCATION_COVERAGE_UNIT`；去重参数 deferred |

D07-01—06、D07-08—10 均 `APPROVED AS RECOMMENDED`；D07-07 按上述方案调整并批准。

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

规范句：`Safety Review is inherited by content provenance, not by field name.`

### Additional acceptance scenarios

| ID | Expected result |
| --- | --- |
| L-A | V1 exact note 有可验证 safety PASS + authorization/Rights/PublicLocation 有效：公开 note，不重复审核 |
| L-B | V1 note 缺 safety provenance：省略 note，合格 marker 保留 |
| L-C | NETWORK_SOURCE 新 note：不得继承玩家 V1 PASS，等待等价新安全门 |
| L-D | 同 cluster 两实例有相同 note：不据此 merge |
| L-E | provider 与 manual confirmed 冲突：manual confirmed 优先，provider advisory |
| L-F | 有 note 但无 PublicLocation：internal only，无 marker |

## Important boundaries

- `EXACT` 是精度语义，不代表默认公开精确位置；仍需 authorization、privacy、safety 和逐记录 Eligibility。
- `LEAST_PRECISE_SAFE_PROJECTION` 不在 V2-B 写死米数、网格或算法。
- `PublicLocationCoverageUnit` 替换旧 Confirmed Venue readiness 口径，但仍只是未来 Pilot Readiness Target。
- venueNote 仍不是 Venue identity、BoardInstance identity proof 或坐标来源；最多是弱辅助上下文。
- TASK-V2-08 已把 D07 决定作为 frozen input 完成 document-only public map contract，当前等待 D08 founder review。

## Gate effect

- TASK-V2-04—06：`COMPLETE / HUMAN_APPROVED`。
- TASK-V2-07：`COMPLETE / HUMAN_APPROVED`。
- TASK-V2-08：`AWAITING_REVIEW`；D08-01—18 未批准前不关闭 V2-B。
- TASK-V2-09—22 与 V2-C—E：`LOCKED / NOT_STARTED`。
- runtime/backend/Cloud Functions/DB/Storage/API/provider implementation/production config changes：`0`。

自动检查结果：workflow、Prettier、diff whitespace、V2-A evidence、22-task/28-field/state、D07-01—10、L1—L16、L-A—L-F、四层 Location、candidate-not-proof、same-cluster multi-instance、precision/privacy/rights/lifecycle consistency 与 production-scope diff 均为 `PASS`；V1 frozen recognition contract 三个监测文件哈希不变。

## References

- `docs/research/v2-b/v2-location-model-contract.md`
- `docs/research/v2-b/v2-domain-model-contract.md`
- `docs/research/v2-b/v2-board-instance-resolution-contract.md`
- `docs/research/v2-b/v2-lifecycle-semantics-contract.md`
- `docs/research/v2-b/v2-source-rights-model-contract.md`
- `memory-bank/implementation-plan.md`

`V2_IMPLEMENTATION_STARTED = NO`

`TASK_V2_07 = COMPLETE / HUMAN_APPROVED`

`TASK_V2_08 = AWAITING_REVIEW`
