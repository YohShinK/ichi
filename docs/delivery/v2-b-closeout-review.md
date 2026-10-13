# ICHI V2-B Closeout Review

> 日期：2026-09-12
>
> 结论：`PASS / COMPLETE / HUMAN_APPROVED`
>
> Frozen R2 hash reconciliation：`ERROR_FIXED / FROZEN_V1_ARTIFACT_DRIFT=NO`
>
> 分支／HEAD：`feature/v2-board-map@929d189a06e13010e50abf4927bfec3b1ebd49fc`
>
> Product/runtime implementation：`NOT_STARTED`

## 1. Scope summary

本次 Closeout 先应用 Founder 对 adjusted D08-01—18 的正式批准，再审查 TASK-V2-04—08、D04-A1 BoardInstance Resolution、D06-A1 Public Player Attribution、V1 Backend Field Inventory、V1→V2 Mapping、Product/Evidence Gates、后续 deferred ownership 与 current truth 一致性。

V2-B 已冻结“一条版面情报是什么、如何演化、谁有权公开、位置如何投影、地图服务可以返回什么”。没有创建或修改 runtime type、页面、API、Cloud Function、Collection/index、DB、Storage、provider、adapter/projector、migration 或生产配置。

### 1.1 Frozen R2 hash reconciliation

原 Closeout 把以下三个“任务开始前后未变化”的文件 SHA 写成 `V1 frozen recognition monitored SHA`，并据此连接到“未改 Prompt/Schema/Resolver”。该 task-boundary 监测本身能证明三个被选文件未变化，但选择的文件不是 canonical R2 Prompt、Provider Schema、Resolver，因此不能作为冻结 R2 本体校验。仓库没有 script、test 或 validation config 把这三个 SHA 定义为 frozen R2 artifacts；它们来自 Closeout 执行时的临时 `shasum`／Node SHA 检查并被手工写入报告。

| 原记录 SHA | 实际文件 | 文件职责 | 原 Closeout 监测原因与结论 |
| --- | --- | --- | --- |
| `26def148bf317f8011ef4136b92b16943ab40f7dcc9ef6007a62d204757175a5` | `docs/decisions/v1-board-recognition-prompt-contract.md` | 已显式标记 `HISTORICAL PRE-R2` 的 v3/T/P 识别协议演进文档 | 被临时选作识别相关文档 task-boundary monitor；不是 R2 Prompt，不能证明 R2 Prompt byte identity |
| `dc545508cf45c718fb2b431dec6ca272a868828d9f7095e8e077dec751e6638c` | `packages/recognition-contract/package.json` | `@ichi/recognition-contract` 包元数据与 exports 声明 | 被临时选作契约包 monitor；不是 R2 Provider Schema，不能证明 Schema byte identity |
| `650cbff21a850cd61905d42e077065ebec922c4709112afe4819b913b413c1d0` | `packages/recognition-contract/src/index.ts` | 通用 `RecognitionContract 1.0.0` version/status TypeScript 入口 | 被临时选作契约源码 monitor；不是 R2 resolver，不能证明 resolver byte identity |

canonical R2 路径由 `docs/delivery/v1-release-freeze-manifest.md`、current implementation plan、`data/recognition-contract/README.md`、recognize-board runtime/tests 共同确认；`services/cloudbase/shared/text-safety-review.test.ts` 使用 Node `createHash("sha256")` 对三个实际文件逐字节执行正式回归：

| Canonical artifact | Path | Current SHA-256 | Canonical expected SHA-256 | Match |
| --- | --- | --- | --- | --- |
| R2 Prompt | `data/recognition-contract/prompt/ichi-board-vlm-r2-direct-remaining-1.0.0.txt` | `c083066c80999722a2e3207f64654c598e418daf1c51dba35d57abf0291a3462` | `c083066c80999722a2e3207f64654c598e418daf1c51dba35d57abf0291a3462` | `YES` |
| R2 Provider Schema | `data/recognition-contract/schema/board-provider-r2-direct-remaining-1.0.0.schema.json` | `178c3fffb9ad74257ad6fb0123509beacbd011225eae2aa7eb2d648beb690722` | `178c3fffb9ad74257ad6fb0123509beacbd011225eae2aa7eb2d648beb690722` | `YES` |
| R2 Resolver | `services/cloudbase/functions/recognize-board/r2-direct-remaining-resolver.js` | `46ffebadc3094412c4beb9c8625acdf83346b496e382fe40a48083ff101411d8` | `46ffebadc3094412c4beb9c8625acdf83346b496e382fe40a48083ff101411d8` | `YES` |

没有正式批准的新 SHA，也不需要替代 release freeze 值。错误只在 Closeout 监测目标／记录，canonical artifacts 本体没有漂移；因此修正结果为：

`HASH_RECONCILIATION_RESULT = ERROR_FIXED`

`FROZEN_V1_ARTIFACT_DRIFT = NO`

## 2. TASK-V2-04—08 final status

| Task | Contract | Final status |
| --- | --- | --- |
| TASK-V2-04 | Domain Model + D04-A1 BoardInstance Addendum | `COMPLETE / HUMAN_APPROVED` |
| TASK-V2-05 | Lifecycle Semantics | `COMPLETE / HUMAN_APPROVED` |
| TASK-V2-06 | Source/Rights + D06-A1 Attribution Addendum | `COMPLETE / HUMAN_APPROVED` |
| TASK-V2-07 | Location Model | `COMPLETE / HUMAN_APPROVED` |
| TASK-V2-08 | Public Map Service + source-specific V1 mapping | `COMPLETE / HUMAN_APPROVED` |

## 3. Frozen decision index

| Decision set | Frozen result |
| --- | --- |
| D04-01—08 | Observation/VerifiedBoard 分离、immutable lineage、exact-version binding、Opportunity/Public PASS 分离、PublicCandidate 非核心、lineage `0..1` active derivation、CanonicalBoard DEFER、split authority |
| D04-A1 | `CONSERVATIVE_UNIQUE_CONTINUATION`；False Merge 优先避免；`UNIQUE_MATCH / NO_MATCH / AMBIGUOUS`；Human Assistance 只作 evidence |
| D05-01—09 | 正交 lifecycle、HYBRID Freshness、hide/retention/withdraw/delete/takedown/no-resurrection、public-affecting revision hide-old/re-evaluate-new |
| D06-01—10 | 四类 Source、versioned authorization、独立 Rights、NETWORK_SOURCE closed-batch seeding、withdraw/takedown、report auto-hide |
| D06-A1 | `PUBLIC_PLAYER_PROFILE_ATTRIBUTION`；首个授权 scope 包含合格历史+未来、PublicLocation、eligible venueNote、安全 nickname/avatar 与 delete hide-first |
| D07-01—10 | 四层 Location、declared CRS/GCJ-02 public、candidate-only identity、四种 precision 语义、least-precise-safe、conditional venueNote、no-location no-marker |
| D08-01—18 | opaque/stable active public identity、storage-agnostic、marker/detail split、record execution hierarchy、public allowlist、Opportunity/Freshness、public Profile、bounded viewport、silent Account、source-specific adapter input、no-location no-marker |

调整后的 D08-03/04/10/13/17 以 `APPROVED AS ADJUSTED` 冻结；其余 D08 决定以 `APPROVED` 冻结。完整逐项表见 `docs/delivery/v2-b-task-08-review-packet.md`。

## 4. Five-layer contract closure

| Layer | Closeout result |
| --- | --- |
| Domain | `BoardObservation/Version`、Verification、VerifiedBoard、BoardInstance、Opportunity、Freshness、Eligibility、Projection、PublicMapLead 职责与 identity/version/cardinality 分离；CanonicalBoard=`DEFER / NOT MVP` |
| Lifecycle | Verification、Opportunity、Freshness、Eligibility、Visibility 正交；hide/withdraw/takedown/delete/retire 分离；late result 与 retired-ID no-resurrection 完整 |
| Rights | 一次版本化授权覆盖已说明的合格历史+未来 scope；每条 provenance/Rights/delete/takedown/Eligibility 独立；NETWORK_SOURCE 只做一次性 seeding |
| Location | `ObservationLocation != LocationResolution != PublicLocationProjection != Venue`；Location 只生成 BoardInstance candidates；无 PublicLocation 无 marker |
| Public Map | PublicMapLead 是 storage-agnostic allowlist service boundary；marker/detail、bounded viewport/cursor、silent Account、错误／离线／late-response 语义完整 |

`CONTRACT_LAYERS_CLOSED = 5 / 5`

## 5. BoardInstance and stable public identity

BoardInstance Resolution 先用 verified structured facts、时间向前且 remaining 不增加的 state transition，以及只作 candidate generation 的 Location 判断现实连续性。只有 resolution 结果可以约束实例 current state；`publicLeadId` 绝不能反向证明相同 BoardInstance。

resolved BoardInstance 在连续 active public lifecycle 内最多一个 current public state。supporting Observation 可以 A→B，`publicLeadId` 保持、`servedVersion` 推进；A/B 的 provenance、Rights、owner 和撤回／删除状态仍独立。全部 eligible support 消失时 hide + RETIRE；未来重新公开使用新 ID。

`BOARD_INSTANCE_PUBLIC_IDENTITY_COMPATIBILITY = PASS`

## 6. D06-A1 and Source/Rights closure

`VERSIONED_MAP_CONTRIBUTION_AUTHORIZATION` 的首个真实版本明确包含：合格 V1_HISTORY、未来 PLAYER records、PublicLocation、eligible venueNote、安全昵称／头像 attribution，以及 My Uploads 删除后的 contribution hide-first。同一版本不逐条或每次上传重复弹窗；只有 material public-scope expansion 才新建授权版本。

PLAYER detail 只投影 public-safe `displayName/avatar + recordType`，无自定义 Profile 时使用“ICHI 玩家”与 ICHI fallback avatar。Profile 不作浏览或贡献 gate。NETWORK_SOURCE 显示“网络来源”，不伪造玩家 Profile，URL 默认 private。

## 7. V1 → V2 mapping conclusion

- `DRAW_RECORD / 抽赏记录`：未来 adapter 使用 P1 + exact current APPROVED drawSubmission 的 version-locked composite，禁止错版本 join。
- `UPLOAD_RECORD / 上传记录`：finalized direct P1 提供 user-confirmed/corrected snapshot、recognition/correction provenance、observedAt、private location、locationNote、source/status 与 current/delete state；不要求 assisted-specific submission。
- 两条路径都先进入共同 V2 Verification，再通过 Opportunity、authorization、Rights、Location、safety、moderation 与 Eligibility；都可以最终成为 VerifiedBoard/PublicMapLead，但都不是 automatic Public PASS。
- `null=unknown`、`0=confirmed zero`；V1 无可靠来源的字段保持 `UNAVAILABLE/DEFERRED`，不得猜测或默认 0。
- Freshness 是 `observedAt + asOf + policyVersion` 的 `DYNAMIC` 结果，不静态继承为永久事实。

映射已按 `DIRECT / NORMALIZE / DERIVED / DYNAMIC / V2_GENERATED / UNAVAILABLE-DEFERRED` 分类，未把 V1 schema 复制为 V2 schema。

## 8. Product Gates

| Gate | Final V2-B result |
| --- | --- |
| PDG-V2-01 | `PASS / CLOSED`：silent trusted Account；无显式登录、Phone、Profile gate；完全 anonymous API 不进 MVP |
| PDG-V2-02 | `PASS / CLOSED`：D06-A1 + D08-10 public-safe PLAYER attribution |
| PDG-V2-03 | `PASS / CLOSED`：versioned authorization 覆盖已说明的合格历史+未来 records，逐记录 Eligibility 独立 |
| PDG-V2-04 | `PASS / CLOSED`：MVP 无 public board/evidence image |
| PDG-V2-05 | `PASS / CLOSED`：D08 marker/detail explicit allowlist 与 forbidden list |
| PDG-V2-06 | `PASS / CLOSED AS DEFER`：CanonicalBoard 不进 MVP；BoardInstance 不演化成 canonical merge |
| PDG-V2-07 | `PASS / CLOSED`：core map + safe detail；提醒、海报与 richer sharing 不进 MVP |

`PRODUCT_GATES = 7 / 7 PASS`

## 9. Evidence Gates

| Gate | V2-B evidence | Closeout result | Required future revalidation |
| --- | --- | --- | --- |
| EDG-V2-01 | 四来源、D06 rights/withdraw/takedown、D06-A1、seeding contract | `PASS_FOR_V2_B_CONTRACT` | TASK-V2-10—12/21 |
| EDG-V2-02 | V2-A native map/device evidence、bounded synthetic benchmark、D08 query contract | `PASS_FOR_V2_B_CONTRACT` | TASK-V2-09/13/17—21 |
| EDG-V2-03 | V2-A cost/package feasibility | `PASS_FOR_V2_B_CONTRACT / PILOT_RECHECK_REQUIRED` | TASK-V2-09/18/21 |
| EDG-V2-04 | V2-A expression scenarios + D08 no-recommendation contract | `PASS_FOR_V2_B_CONTRACT / LOWER_CONFIDENCE` | TASK-V2-16/20—21 |
| EDG-V2-05 | V2-A geo evidence + D07 location contract + D08 no-location/no-marker | `PASS_FOR_V2_B_CONTRACT` | TASK-V2-09/17/20—21 |
| EDG-V2-06 | D05 lifecycle + D06 withdrawal/moderation table-tops + D08 unavailable semantics | `PASS_FOR_V2_B_CONTRACT` | TASK-V2-10—12/19—21 |

后续复验是已分配的 implementation/pilot gate，不是 V2-B 未决 Founder 决策。

`EVIDENCE_GATES = 6 / 6 PASS_FOR_V2_B_CONTRACT`

## 10. Cross-contract contradiction review

| Check | Result |
| --- | --- |
| C1 anonymous-only attribution | `PASS`：current truth 均标明被 D06-A1 supersede；历史记录有 historical 标记 |
| C2 Direct cannot become VerifiedBoard/PublicMapLead | `PASS`：已统一为 source-specific Verification input |
| C3 new Observation always changes publicLeadId | `PASS`：连续 active BoardInstance lifecycle 稳定 ID；retire 后新 ID |
| C4 recordType equals trust | `PASS`：recordType 只表示 product execution path |
| C5 Opportunity automatically weighted by recordType | `PASS`：三维正交；UPLOAD+HIGH 与 DRAW+LOW 合法 |
| C6 Freshness equals Verification/truth | `PASS`：Freshness 只表达 action-reference age |
| C7 fully anonymous read | `PASS`：MVP 固定 silent trusted Account，无 Profile gate |
| C8 venueNote private-only | `PASS`：符合 exact safety provenance/authorization/Rights/Eligibility 时 detail-only |
| C9 Tencent POI core dependency | `PASS`：仅 Optional Location Enhancement |
| C10 Venue proves BoardInstance identity | `PASS`：Location/Venue 仅候选／弱辅助，不是 proof |
| C11 publicLeadId used as resolver evidence | `PASS`：resolution 单向先于 public projection |
| C12 private-field leakage | `PASS`：allowlist serializer；private IDs/raw geo/accuracy/evidence/account identity forbidden |

`CROSS_CONTRACT_CONTRADICTIONS = 0`

## 11. Deferred-items ownership matrix

“主 owner”负责冻结／实现该项；“复验 owner”只负责在集成、真机或 pilot 中验证，不构成冲突认领。

| Deferred item | Primary owner | Revalidation/consumer |
| --- | --- | --- |
| PublicMapLead materialized/request-time/hybrid strategy | TASK-V2-09 冻结 physical strategy；TASK-V2-11 实现 projector | 13、19、21 |
| DB/resource/index/query/cursor/cache/rate/cost architecture | TASK-V2-09 | 13、18—21 |
| PublicLocation numeric policy carrier/coordinate transform/error budget | TASK-V2-09 | 17、20—21 |
| Direct/Draw source-specific Verification adapter and exact-version guard | TASK-V2-10 | 11、19、21 |
| BoardInstance candidate/signature/transition/association correction | TASK-V2-10 | 11、16、19—21 |
| authorization write/applicability/owner commands | TASK-V2-10 | 15、19—21 |
| PublicMapLead monotonic projection/stable ID/hide/retire/tombstone | TASK-V2-11 | 13、19—21 |
| public Profile current/snapshot/hybrid and avatar delivery projection | TASK-V2-11 | 13、16、19—21 |
| Freshness compute persistence/scheduling | TASK-V2-11 | 14、18、21 |
| retention implementation, takedown SLA/runbook, moderation state | TASK-V2-12 | 19—21 |
| distinct-report policy implementation and moderation anti-abuse | TASK-V2-12 | 13、19—21 |
| viewport/detail API, silent Account guards and public serializer | TASK-V2-13 | 14、16—21 |
| client query generation/cache/stale/offline state | TASK-V2-14 | 18、20—21 |
| MapContributionAuthorization/owner-control UX | TASK-V2-15 | 20—21 |
| marker icon/color/size/z-index and recordType/Opportunity/Freshness visual encoding | TASK-V2-16 | 18、20—21 |
| overlap/cluster/detail/callout/map-list-filter UX | TASK-V2-16 | 18、20—21 |
| bounded Human Assistance comparison UX | TASK-V2-16；write evidence contract 由 TASK-V2-10 | 20—21 |
| exact precision mode per UX/policy scenario | TASK-V2-16 | TASK-V2-21 pilot calibration |
| 微信原生 map、permission、regionchange、manual city、deep link | TASK-V2-17 | 20—21 |
| scale/clustering threshold/performance/weak network/package budget | TASK-V2-18 | 19—21 |
| cross-layer security/migration/rollback gates | TASK-V2-19 | 20—21 |
| iOS/Android true-device matrix | TASK-V2-20 | 21 |
| Freshness/report/PublicLocationCoverage threshold tuning | TASK-V2-21 | 22 release gate |
| NETWORK_SOURCE three-stage Initial Data Seeding evidence execution | TASK-V2-21 | 22 release gate |
| closed pilot and RC decision | TASK-V2-21 | 22 |
| actual deploy/review/publication/tag | TASK-V2-22 | final closure |

明确排除的非 MVP 能力不是 unowned implementation decision：CanonicalBoard、public board/evidence image、ongoing NETWORK_SOURCE scraper、completely unauthenticated Web/API、retained image fingerprint、rich sharing/reminder/poster、merchant/staff identity 与 complex appeal 均需未来新 Gate 才能进入计划。

`UNOWNED_DEFERRED_DECISION = 0`

`CONFLICTING_DEFERRED_OWNER = 0`

## 12. Validation and repository boundary

- D04-A1 S1—S10、D05 lifecycle、D06 R1—R14/R-A—R-J、D06-A1 S-A—S-B、D07 L1—L16/L-A—L-F、D08 M1—M18/M-A—M-N：完整。
- V1 inventory 由 current runtime/schema/tests 只读证据支撑；Direct 与 Assisted mapping 均具有明确 source/version guard。
- public forbidden-field negative review：`PASS / LEAKAGE=0`。
- 22-task / 28-field consistency、D04—D08 decisions、scenarios、Gates、mapping 与 deferred ownership：`119/119 PASS`。
- `CURRENT_PLAN_ENTRY_COUNT = 1`：`memory-bank/implementation-plan.md` 为唯一 current plan；其他计划文件已标记 historical/non-executable。
- workflow：`PASS（8 required files）`；V2-A evidence regression：`PASS（10 scenarios）`；Prettier：`PASS`；`git diff --check`：`PASS`。
- 17 份 current truth／technical contract 文档的 C1—C12 专项复核：`12/12 PASS`；allowlist forbidden leakage：`[]`。
- Frozen R2 reconciliation 复验：正式 Vitest SHA assertion `1 file / 16 tests PASS`；V1-F automated preflight `PASS`；canonical hash/current truth/V2-B plan/production-boundary 专项检查 `56/56 PASS`。
- production runtime/backend/Cloud Functions/DB/Collection/Storage/API/provider/config task-scope diff：`0`。
- 原 task-boundary monitored files：`26def148… / dc545508… / 650cbff…` 对应 historical pre-R2 doc、package manifest 与通用 TS contract；它们与任务开始时相同，但不是 frozen R2 artifact verification target。
- Canonical R2 Prompt/Provider Schema/Resolver：`c083066c80999722a2e3207f64654c598e418daf1c51dba35d57abf0291a3462` / `178c3fffb9ad74257ad6fb0123509beacbd011225eae2aa7eb2d648beb690722` / `46ffebadc3094412c4beb9c8625acdf83346b496e382fe40a48083ff101411d8`，实测与 release freeze、current plan 和正式 Vitest hash assertion 完全一致；artifact drift=`NO`。
- commit/push/deploy/migration/upload/publish：`NO`。

当前中文人工阅读入口为本 Closeout、`memory-bank/implementation-plan.md` 与 `memory-bank/progress.md`。英文 Public Map contract、V1 inventory/mapping 与 TASK-V2-08 approval packet 已显式标为 technical contract/evidence appendix；TASK-V2-04—07 和 V2-A/entry packets 已标为 historical approval evidence，不得覆盖当前状态。

## 13. Readiness verdict

没有新的 Founder 决策缺口、跨合同矛盾、unowned deferred item 或 missing V2-B evidence。

`UNRESOLVED_FOUNDER_DECISIONS = 0`

`HASH_RECONCILIATION_RESULT = ERROR_FIXED`

`FROZEN_V1_ARTIFACT_DRIFT = NO`

`TASK_V2_04_TO_08 = COMPLETE / HUMAN_APPROVED`

`V2_B = COMPLETE / HUMAN_APPROVED`

`TASK_V2_09 = READY / NOT_STARTED`

`TASK_V2_10_TO_22 = LOCKED / NOT_STARTED`

`V2_IMPLEMENTATION_STARTED = NO`

本次 Closeout 当时到此停止，未执行 TASK-V2-09。后续状态（2026-09-12）：TASK-V2-09 与 D09-01—13 已 `COMPLETE / HUMAN_APPROVED`；Founder 预授权的 TASK-V2-10—13 本地安全批次也已执行完成，四项当前分别为 `AWAITING_REVIEW`。这不改变本文件记录的 V2-B closeout 结论，也不解锁 TASK-V2-14—22。
