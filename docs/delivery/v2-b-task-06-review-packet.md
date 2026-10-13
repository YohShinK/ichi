# V2-B TASK-V2-06 Review Packet

> `HISTORICAL APPROVAL EVIDENCE / SUPERSEDED FOR CURRENT STATUS BY docs/delivery/v2-b-closeout-review.md / NOT EXECUTABLE`

> Status: `COMPLETE / HUMAN_APPROVED`
>
> Scope: `SOURCE_RIGHTS_CONTRACT_ONLY`
>
> Runtime/API/DB implementation: `NOT_STARTED`

## Review outcome

TASK-V2-06 已完成人工调整与批准。四类 Source 的 provenance 与 public-rights 合同保持；D06-01/02 从逐记录授权改为统一 `VERSIONED_MAP_CONTRIBUTION_AUTHORIZATION`，D06-09 改为只在实质扩大公开范围时重新授权。Source 只回答数据从哪里来，不产生 trust score；每个 exact Observation/source version 的 rights applicability、withdrawal/delete、takedown 与 Public Eligibility 仍独立于 Verification、Opportunity、Freshness 与 BoardInstance association。

合同覆盖：

- `PLAYER_DIRECT / PLAYER_ASSISTED / V1_HISTORY / NETWORK_SOURCE` 的 observedAtBasis、owner、steward、authorization、withdrawal、takedown 和标签；
- 历史 + 未来玩家记录共用版本化地图贡献授权，同一版本不逐条重复弹窗；
- V1_HISTORY 在 owner 接受当前授权版本后逐记录自动进入 Eligibility，而不是批量自动公开；
- NETWORK_SOURCE curated allowlist、item-level evidence、URL/attribution 与三阶段 closed-batch seeding；
- “我的上传”云端来源记录删除后对应地图 hide-first，只留最小 no-resurrection fact；
- `10_DISTINCT_ELIGIBLE_REPORTS → AUTO_HIDE + MODERATION_REVIEW`，不直接 destructive delete 或改写 Verification；
- accepted rights notice hide-first、material-scope-change reauthorization 和最小 evidence retention；
- BoardInstance association 不合并／转移 Source 和 Rights lineage；
- R1—R14 与 R-A—R-J tabletop scenarios。

## Final founder decisions

| ID | Final decision | Status |
| --- | --- | --- |
| `D06-01` | `VERSIONED_MAP_CONTRIBUTION_AUTHORIZATION` covering eligible history | `ADJUSTED / HUMAN_APPROVED` |
| `D06-02` | `VERSIONED_MAP_CONTRIBUTION_AUTHORIZATION` covering eligible future records | `ADJUSTED / HUMAN_APPROVED` |
| `D06-03` | `SOURCE_LABEL_ONLY_ANONYMOUS` | `HISTORICAL / SUPERSEDED PRE-LAUNCH BY D06-A1` |
| `D06-04` | `CURATED_ALLOWLIST_ITEM_LEVEL_RIGHTS` | `APPROVED AS RECOMMENDED` |
| `D06-05` | `PRIVATE_DEFAULT_CONDITIONAL_ATTRIBUTION` | `APPROVED AS RECOMMENDED` |
| `D06-06` | `PUBLIC_VISIBILITY_NOT_SUFFICIENT_FAIL_CLOSED` | `APPROVED AS RECOMMENDED` |
| `D06-07` | `OWNER_WITHDRAW_ICHI_HIDE_FIRST + SEPARATE_DELETE` | `APPROVED WITH UNIFIED AUTHORIZATION CLARIFICATION` |
| `D06-08` | `AUTHORIZED_OR_CREDIBLE_NOTICE_HIDE_FIRST` | `APPROVED AS RECOMMENDED` |
| `D06-09` | `REASSESS_ON_MATERIAL_SCOPE_CHANGE` | `ADJUSTED / HUMAN_APPROVED` |
| `D06-10` | `POLICY_BOUNDED_MINIMAL_EVIDENCE` | `APPROVED AS RECOMMENDED` |

Founder 另批准：`MY_UPLOADS_CLOUD_DELETE → MAP_HIDE_FIRST` 与 `10_DISTINCT_ELIGIBLE_REPORTS → AUTO_HIDE + MODERATION_REVIEW`。

TASK-V2-08 Founder 调整形成不重开 TASK-V2-06 的批准附录：`D06-A1 = PUBLIC_PLAYER_PROFILE_ATTRIBUTION / FOUNDER_ADDENDUM / HUMAN_APPROVED`。首版 `MapContributionAuthorization` 范围包含合格历史与未来玩家贡献的安全昵称、受控头像、公开位置和 `venueNote`；Profile 缺失时使用 `ICHI 玩家` 与 ICHI fallback avatar，不形成公开资格门禁。该附录替代 D06-03 的匿名公开展示结论，但不改变 Source 只用于溯源、不产生可信度等级，以及每条 Observation 的 Rights/Eligibility 独立判定。TASK-V2-06 状态保持 `COMPLETE / HUMAN_APPROVED`。

## Important boundary

本文是产品／系统权利合同，不是对特定网络内容能否合法再发布的结论。具体来源仍须逐条 evidence 和适用 policy review；缺失时 fail closed。

## Gate effect

- TASK-V2-04—05：`COMPLETE / HUMAN_APPROVED`。
- TASK-V2-06：最终调整、自动验证与 founder 人工审核均已完成，当前为 `COMPLETE / HUMAN_APPROVED`。
- TASK-V2-07：Location Model 合同、L1—L16、L-A—L-F 与 D07-01—10 已 `COMPLETE / HUMAN_APPROVED`。
- TASK-V2-08：Founder 调整已写入合同与二次验收包，当前为 `AWAITING_REVIEW`。
- TASK-V2-09—22 与 V2-C—E：`LOCKED / NOT_STARTED`。
- runtime/backend/Cloud Functions/DB/Storage/API implementation/production config changes：`0`。

自动检查结果：workflow、Prettier、diff whitespace、V2-A evidence、22-task/28-field/state、D06-01—10、R1—R14、R-A—R-J、四来源/标签、rights-lifecycle-BoardInstance contradiction check 与 production-scope diff 均为 `PASS`；V1 frozen recognition contract 三个监测文件哈希保持 `26def148… / dc545508… / 650cbff…`。

## References

- `docs/research/v2-b/v2-source-rights-model-contract.md`
- `docs/research/v2-b/v2-lifecycle-semantics-contract.md`
- `docs/research/v2-b/v2-board-instance-resolution-contract.md`
- `docs/research/v2-a/v2-data-source-verification-freshness-lifecycle.md`
- `memory-bank/implementation-plan.md`

`V2_IMPLEMENTATION_STARTED = NO`
