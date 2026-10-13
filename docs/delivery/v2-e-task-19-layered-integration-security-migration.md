# TASK-V2-19｜Layered Integration, Security, Migration

Phase A date: 2026-09-25. Phase B1 read-back: 2026-09-26. Current status: `IN_PROGRESS / PHASE_B1_SHADOW_PROVISIONED_READBACK_COMPLETE / TASK_V2_19_SHADOW_PROVISIONING_READBACK_REQUIRED`. Sections 1—7 preserve Phase A evidence and its then-pending state; current cloud resource facts are in section 8 and the companion shadow resource diff section 9. This is **not** TASK-V2-19 completion or Human Approval.

## 1. Coverage matrix

| Requirement | Current implementation and test evidence | Missing integration / security risk | Migration or resource implication | Action |
| --- | --- | --- | --- | --- |
| V1 Observation and exact Verification | `source-adapters.ts`, `verification.ts`; V2-10 and V2-C integration tests | Production V1-to-V2 event/outbox wiring absent | Candidate rehearsal reads synthetic `v2ShadowSourceFixtures` only; no V1 production resource read | Build shadow adapter without changing frozen V1 contracts. |
| Authorization / consent / cross-account | `authorization.ts`, V2-10 and V2-C tests use trusted account and versioned scope | No CloudBase owner-scoped adapter or real cross-account candidate test | Candidate data must include two isolated account fixtures; no unauthorized backfill | Negative cross-account rehearsal. |
| D04-A1 BoardInstance resolution | `board-instance.ts`, V2-10 tests and this phase's same-place ambiguity test | Resolver reference exists; durable association/history and user assistance orchestration unconnected | Shadow migration must preserve `AMBIGUOUS`, corrections and budget | Test S1–S10 against actual candidate persistence. |
| Human Assistance two-surface coverage | Local correction now wires upload-success and「我的 → 我上传的版面」through `HumanAssistanceClient`; four answers, safe disappearance and failure isolation are covered by targeted tests | Real shadow transport, owner binding and end-to-end candidate evidence remain absent | Both surfaces remain synthetic-candidate-only, owner-scoped and fail closed; no V1 production binding | Candidate rehearsal only after separate resource approval. |
| Eligibility / Opportunity / Freshness | Branded VerifiedBoard and exact-version Opportunity gate; V2-C reconciliation tests | No production event transaction across these gates | Reject per-row before shadow projection | Inject partial/late failure. |
| Public projection / no-resurrection | Monotonic `projector.ts`; V2-11 tests | No durable outbox, sequence store or retry adapter | Candidate shadow rows and tombstones required | Implement and drill candidate state. |
| Moderation / hide / takedown | `moderation.ts`, V2-12 tests; V2-C integration hides repository row | No candidate moderation authority persistence or propagation SLA evidence | Hidden rows and snapshots must fail closed | Candidate read-during-hide injection. |
| Public query/detail allowlist | `public-api.ts`, V2-13 tests; new domain→API→client local test; client wire adapter explicitly maps structured public avatar and strips runtime extras | Cloud Function transport and candidate origin/read-back validation missing | Two candidate functions and explicit safe wire serializer | Exercise the adapter on candidate responses. |
| Pagination, truncation and dense coverage | V2-13 tests prove 50/page, 500 snapshot, 120s TTL and `truncated=true`; Phase A now exposes `加载更多`, carries truncation through cache/state and requeries an incomplete viewport when narrowed | Candidate transport and dense real-data behavior remain unverified; even a 500-ref snapshot is partial when `truncated=true` | No new cap; candidate load/index proof needed | Add dense candidate viewport and refinement evidence before gate. |
| PublicMapClient/cache/map-preview | Client latest-wins, cursor, stale-cache, suppression tests; Phase A adds unavailable-detail late-root no-resurrection regression | Formal page still injects `SyntheticPublicMapService`; no real CloudBase adapter. **P1** | Candidate endpoint/auth configuration needed | Integrate only candidate transport after approval; no parallel UI. |
| Owner withdrawal/delete/account deletion | Authorization/projector and client suppression tests; V1 release tests | No event-to-public-row candidate latency/read-back | Shadow sources must exclude withdrawn/deleted rows | Candidate hide-first + cache-lifetime test. |
| Cross-account private access | V1 CloudBase manifest `ADMINONLY`; local trusted port tests | Remote rules and owner adapters not read back in this phase | Candidate rules need exact diff | Read-only remote inventory, then two-account negative test. |
| Scraping, rate, read-stop, cursors | `public-api.ts` plus V2-13/reconciliation tests; Phase A guards malformed runtime values and throwing trusted ports without changing the V2-C valid-request/rate order; new client global-stop test | Candidate Cloud Function must reject unknown request fields and count malformed probes against durable abuse budget; durable rate state/global stop and real invocation limits absent | Server-only persistent controls and secret | Fail-closed candidate test including enumeration. |
| PublicLocation precision | Projection strips raw capture fields; new local client test checks `accuracyMeters`/`projectionRuleId` absent | Real geo index/query and policy transform not proven | Geo index and public point carrier | Read-back + private/public coordinate fixture. |
| Reviewer/log leakage | Public allowlists and V2-C negative fixtures | Production log policy and CloudBase logs not audited | No private payload in migration evidence/logs | Candidate log scan with redacted correlation IDs. |
| Avatar signing | Trusted issuer and expiry/fallback tests | Candidate issuer/security rule and client wire mapping absent | Candidate secret and private fixture approval | Test failure/fallback; no ACL relaxation. |
| Migration/idempotency | `dryRunPublicMapMigration` is local `DRY_RUN_ONLY`, `mutationCount=0` | No candidate resource/data rehearsal, partial retry/resume evidence | Candidate source/target/index plan required | Follow companion resource plan after authorization. |
| Rollback | D09 disable→hide→invalidate contract; local read-stop test | No actual candidate rollback drill/read-back | Candidate flag, projector stop and cleanup | Execute only after action approval. |
| V1 regression / package | V1 release and package scripts exist | Full phase quality results to be appended below | Candidate isolation must leave V1 untouched | Run V1 and workflow gates. |

## 2. New local integration evidence

Added `packages/v2-map/src/task-v2-19-layered.integration.test.ts` with seven scenarios: projected allowlisted lead reaches the real `PublicMapClient` without private lineage/location fields; a hidden lead returns unavailable and disappears after refresh; global public-read stop maps to the stable client error; same-place equally plausible boards stay `AMBIGUOUS`; invalid private avatar reference is rejected while extra private runtime fields are stripped; a per-record gated migration dry-run is deterministic with zero writes; malformed runtime API requests return stable errors. `apps/client/miniprogram/platform/public-map-wire-adapter.ts` now owns the explicit server `avatar` → client `avatarUrl` conversion for future candidate transport. It is exercised locally but is not yet connected to a deployed Cloud Function.

Existing tests already cover many single-layer D04-A1 and negative cases. The full 12-point D04-A1 matrix is **not yet proven across domain→projector→API→client→candidate migration/rollback**. In particular, human assistance cooldown/budget, misanswer correction, durable association history, later disambiguation and candidate rollback have no end-to-end evidence. Do not mark these PASS from the local resolver tests alone.

The HA coverage correction is explicitly **both** the upload-success state and「我的 → 我上传的版面」front-end entry, not just the HA functions or persistence collections. Local implementation and behavior tests now cover both surfaces, while the disabled service keeps them disconnected from CloudBase until separately authorized. Numeric HA cooldown/budget is `CANDIDATE_TEST_ONLY / PILOT_CALIBRATION_REQUIRED`, with no product setting frozen.

| D04-A1 scenario | Local evidence / current result | Missing candidate proof |
| --- | --- | --- |
| 1. Continuous observations | V2-10 resolver `UNIQUE_MATCH`; V2-11 A→B support keeps active public ID | Persisted association and ordered projector event |
| 2. Same shop replacement/new box | V2-10 transition/signature conflicts yield no continuation | Real source-version and replacement rehearsal |
| 3. Different boards at one shop | V2-10 identity signature rejects mismatch | Two independent current public rows |
| 4. Two identical boards at one shop | New layered test returns `AMBIGUOUS` for two equally compatible instances | Durable candidate set, no silent map merge |
| 5. Long-lived `AMBIGUOUS` | Resolver has explicit `AMBIGUOUS`; no forced association | Persistence across retry/restart and shadow migration |
| 6. Later disambiguation | V2-10 versioned link/unlink/relink unit coverage | New evidence replay and historical correction |
| 7. Three human answers / misjudgment | V2-10 evidence type and answer unit coverage | Wrong answer correction cannot bypass hard conflicts |
| 8. Assistance budget/cooldown | Local once-per-observation budget test | Cross-session/user cooldown and no repeated prompts |
| 9. Late/stale result | V2-11 discards lower event sequence; client latest-wins tests | Durable concurrent event ordering |
| 10. Retired/deleted/withdrawn | V2-11 no ID reuse; client suppression plus new unavailable-detail late-root regression | Candidate row/snapshot invalidation and rollback read-back |
| 11. `null != 0` | V2-10 source adapter and transition unit tests | Candidate migration and wire round trip |
| 12. Location only generates candidates | V2-10 resolver unit tests; new same-place ambiguity test | Geo query must not become identity decision |

No row is yet marked full candidate PASS. The local result is a bounded Phase A input, not a release verdict.

## 3. Security and negative result boundary

Local evidence: explicit API allowlists; branded candidate and contributor construction; trusted account/rate/read-stop/HMAC ports; current visibility recheck; cursor binding/expiry; client public-only cache clone and no-resurrection suppression tests. The new local test confirms no `private-observation-19`, account identifier, capture accuracy or projection rule in client marker/detail. Candidate/production `PRIVATE_LEAKAGE = 0` is **unverified** until transport, CloudBase resources, two-account access and logs are tested. No remote leakage count is asserted.

## 4. Candidate resources, migration and rollback

The reviewable local resource and rehearsal plan is `docs/delivery/v2-e-task-19-candidate-resource-migration-plan.md`. After Founder completed CLI login, CloudBase CLI v3.8.4 read-only inventory in `ap-shanghai` returned only `cloud1-d7gxqfwv783a1f131`, a Normal prepaid Personal V1 environment expiring 2026-10-28. The live inventory contains 13 V1 collections and 19 Active V1 functions, with no V2 collection/function; collection names and index metadata were read without business documents. Founder selected the **same-environment V2 shadow isolation boundary** and ruled out creating a second environment. The exact proposed delta—9 new shadow collections, 15 explicit indexes, 6 new functions, 13 function-local configuration/secret names, no new triggers/storage/global rules—is in `docs/delivery/v2-e-task-19-shadow-resource-diff.md`. This is still an unapproved resource proposal. Actual remote ACL, legacy-plan capacity and billing are unverified; `env usage/info` reports that the existing V1 environment is not in resource-point billing mode. No candidate deployment, migration, index mutation, secret write or rollback mutation was performed. Local dry-run functions, Human Assistance correction and six un-deployed artifacts are not a candidate rehearsal.

## 5. V1 / automated quality evidence

Final local gates: Vitest 87 files / 944 tests PASS (1 existing skipped file/test); ESLint PASS; root and Web TypeScript PASS; contracts/workflow PASS; V1-F preflight PASS at 1,294,803 mini-program source bytes; CloudBase local manifest validation PASS (13 private collections / 19 deployable functions); Next production build PASS; Web Playwright 26/26 PASS; WeChat CLI preview PASS at 995,975 bytes; package asset audit PASS with no development fixtures in the mini-program and 802,349 source bytes under the 2 MiB gate; targeted Prettier for all touched files and `git diff --check` PASS. Full-repository `format:check` fails on 43 pre-existing artifacts/config files, which were left untouched. The worktree already contained many unrelated uncommitted changes before this task; this phase does not revert them or attribute them to TASK-V2-19.

## 6. Open P0/P1 and readiness

Local audit count: `P0_DISCOVERED=0`, `P1_OPEN=3` (all require candidate transport/data evidence; P1-19-02/03 have local repairs). This is not a production defect count or `PRIVATE_LEAKAGE=0` release claim.

- **P1-19-01:** Formal map client still uses synthetic service; no candidate CloudBase transport, so real public records cannot be validated in map-preview.
- **P1-19-02 (local repair, candidate proof pending):** Phase A connected later-page loading, truncation guidance and incomplete-viewport refinement. Nearby or mall-area completeness cannot yet be promised without real candidate API, index and dense-data tests. A cluster can only group already fetched leads.
- **P1-19-03 (local repair, candidate proof pending):** Client wire adapter now owns the server `{avatar: {kind, url/path}}` → client `{avatarUrl}` mapping and rejects private/non-HTTPS avatar references; actual candidate transport invocation remains missing.
- **Gate-19-EXT:** Founder selected the same-environment shadow isolation strategy; the exact shadow resource proposal has no separate authorization, artifact/read-back or cloud mutation. Candidate integration, migration rehearsal and rollback are pending.

`TASK-V2-19` remains `IN_PROGRESS / SHADOW_RESOURCE_DIFF_AWAITING_FOUNDER_APPROVAL`. `TASK_V2_19_EXTERNAL_ACTION_APPROVAL_REQUIRED` applies before the first candidate mutation. Remote resource metadata inventory is complete for the visible Shanghai V1 environment; candidate transport, full D04-A1 persisted matrix, Human Assistance orchestration, exact resource **approval**, legacy-plan quota/billing read-back, migration rehearsal and rollback remain open. TASK-V2-20 stays unstarted; there is no production deployment, migration, commit, push or release.

## 7. 执行前冻结阶段补充证据

### 7.1 Read-only CloudBase preflight

2026-09-25 只读核对 `cloud1-d7gxqfwv783a1f131 / ap-shanghai`：`baas_personal` 个人版、预付费、到期 `2026-10-28 23:59:59`、`EnableOverrun=false`、QPS 500；环境不在 resource-point billing mode，因此真实 resource-point usage、剩余存储／调用／容量额度和按量开关均不可由本次 CLI read-back 证明。当前 live baseline 为 13 collections（`accounts`、`wechatIdentities`、`profiles`、`ichiIds`、`accountRoles`、`dailyQuotas`、`recognitionJobs`、`observationCandidates`、`drawSubmissions`、`recordCodes`、`deletionJobs`、`systemSettings`、`auditEvents`）、43 indexes（含自动 `_id_`）、19 Active functions、4 triggers、2 Storage roots，0 policy rows。

13 个 V1 collection ACL read-back 全部为 `ADMINONLY`。环境级 function invoke rule read-back 为 `auth != null && auth.loginType != 'ANONYMOUS'`。公开规格数量核对为 300 collections/environment、20 indexes/collection、150 functions/`baas_personal`；新增后理论 22 collections／25 functions，在公开数量上限内，但不是剩余额度证明。GEO／unique 文档能力已确认，实际 create 可用性仍未实测。V1 collection/function/index/config/Storage/trigger diff 本轮为 0。

### 7.2 Candidate function artifacts

六个 Node.js 20.19 artifact 已在本地生成并由 `scripts/validate-v2-shadow-artifacts.mjs` 静态验证；manifest 为 `packages/v2-map/resources/cloudbase-shadow-function-artifacts.json`。验证包含 exact collection allowlist、禁止动态 collection、禁止 V1 function／Storage API、候选源码无写操作，以及缺失／false feature flags 的 fail-closed guard。六个 zip 的 SHA-256 详见 `docs/delivery/v2-e-task-19-shadow-resource-diff.md`；manifest 全部标记 `deployed=false`、`cloudWrite=false`。

### 7.3 Human Assistance coverage correction

本地 correction 已覆盖上传成功态和「我的 → 我上传的版面」两个入口，支持 `SAME_BOARD`／`DIFFERENT_BOARD`／`CANNOT_TELL`／`SKIP`，并验证 no-request、expired、answered、withdrawn、version-changed 安全消失、duplicate submit 幂等，以及 HA 失败／跳过不影响 V1 upload success。`human-assistance-client` 与页面 behavior 定向测试结果为 2 files / 92 tests passed。当前 service disabled，不访问真实 shadow CloudBase；真实候选 transport、owner binding 和 end-to-end rehearsal 仍待批准。

### 7.4 No-cloud-write boundary

本阶段没有 create collection、create index、deploy function、config／secret write、synthetic data write、migration rehearsal 或 rollback mutation。三个 HMAC secret 只记录 `NOT_GENERATED / NOT_BOUND_TO_NEW_FUNCTIONS / NOT_RUN` 状态，不回显值；HA cooldown/budget 保持 `CANDIDATE_TEST_ONLY / PILOT_CALIBRATION_REQUIRED`，未冻结产品参数。最终停止码仍为 `TASK_V2_19_EXTERNAL_ACTION_APPROVAL_REQUIRED`，TASK-V2-19 保持 `IN_PROGRESS`。

## 8. Phase B1 provisioning read-back（2026-09-26）

Founder 已单独批准 `cloud1-d7gxqfwv783a1f131` 内 9 collection／15 index／6 function 的精确 shadow 范围，以及三类新 secret、`synthetic_only` 边界、四个关闭开关和空测试名单。逐项云端 read-back 的名称、ACL、索引字段／GEO／unique、部署前 zip SHA、远端代码包 SHA 与源文件字节比对，详见 `docs/delivery/v2-e-task-19-shadow-resource-diff.md` 第 9 节。9 个 shadow collection 全部为空；六个函数全部 `Active / Available`、无 trigger／layer、开关均为 `false`；HA policy/cooldown/budget 未配置。

写入前后 V1 的 13 collection／43 index／19 function／4 trigger、V1 function 配置和代码元数据、环境级函数调用规则、Storage 根项逐项只读比较，`V1_DIFF=0`。无 synthetic data write、migration rehearsal、rollback mutation、cleanup、V1 resource mutation。正式小程序仍使用 disabled Human Assistance service 与 synthetic map transport；Phase B1 的资源存在不构成已打通前端／后端或端到端候选证明。P1-19-01—03、完整 D04-A1 candidate matrix、实际安全负测与迁移／回滚证据仍开放。

停止码：`TASK_V2_19_SHADOW_PROVISIONING_READBACK_REQUIRED`。TASK-V2-19=`IN_PROGRESS`，未 `COMPLETE/HUMAN_APPROVED/FROZEN`，TASK-V2-20 未开始。
