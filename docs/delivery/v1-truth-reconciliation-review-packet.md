# ICHI V1 认知对齐审核包

> 审核状态：`V1 TRUTH HUMAN REVIEW PASS（V1 事实人工审核阶段）`
>
> 日期：2026-09-10
>
> Runtime implementation：未修改。V2 implementation：未开始。

> 后续状态说明（2026-09-10）：本包已完成其 V1 truth baseline 职责；当前用户命令已明确要求以该已验证事实继续重建 V2 planning。唯一 V2 current plan 与新审核入口分别为 `memory-bank/implementation-plan.md`、`docs/delivery/v2-planning-reconstruction-review-packet.md`。本包内“不得继续规划 V2”的文字只描述上一轮停止点，不再是当前命令的执行门；`V2_IMPLEMENTATION_STARTED=NO` 仍成立。

## A. 基线

| 检查项 | 结果 | 证据 |
| --- | --- | --- |
| Workspace | `/Users/cunfu/Documents/ichi 2` | `git rev-parse --show-toplevel` |
| Branch | `feature/v2-board-map` | `git branch --show-current` |
| Branch HEAD | `929d189a06e13010e50abf4927bfec3b1ebd49fc` | `git rev-parse HEAD` |
| `origin/main` | fetch 后为 `929d189a06e13010e50abf4927bfec3b1ebd49fc` | `git rev-parse origin/main` |
| 精确 base | branch HEAD 等于 origin/main，merge-base 相同 | Git audit |
| 包含 V1.0.0 source | `03942f2067959a4b8b0eb6223c949e51e768587d` | main history |
| 包含 V1.0.0 closure | `62c02ab6bb16ad415a7a9034e41c28066bfe8af3` | main history |
| 包含 V1.0.1 source | `8d442aa7cc9f1921a9b9aade231b5884e8d2dd00` | main history |
| V1.0.1 merge | current HEAD `929d189…` | main history |
| V2 runtime 是否开始 | NO | status/diff 只有 planning/Memory Bank Markdown |
| 本轮 runtime/backend 修改 | 0 | final scope validation |
| Stash | 两个 historical stash 保持未动 | `git stash list` |
| 安全结论 | `V1_TRUTH_AUDIT_BASE_SAFE = YES` | 以上全部通过 |

## B. V1 功能清单

| 功能 ID | 用户行为 | 实现方式 | 状态 |
| --- | --- | --- | --- |
| `V1-FN-01` | 三个内部 Tab | 单一 home Page；recognize/map/my；map placeholder | `CONFIRMED_CURRENT` |
| `V1-FN-02` | 辅助抽赏 | camera → R2 → correction → Local Board → workbench → optional private upload | `CONFIRMED_CURRENT` |
| `V1-FN-03` | 仅上传版面 | 复用 identity/quota/location/camera/R2，跳过 draw session | `CONFIRMED_CURRENT` |
| `V1-FN-04` | Camera capture | embedded camera-only、visible crop、JPEG preparation | `CONFIRMED_CURRENT` |
| `V1-FN-05` | 私有图片传输 | `recognition-temp` → fileID → short HTTPS URL → Provider → cleanup | `CONFIRMED_CURRENT` |
| `V1-FN-06` | 版面识别 | frozen R2 direct remaining；H0 rollback | `CONFIRMED_CURRENT / FROZEN` |
| `V1-FN-07` | Editable result | manual price/Grand Prize、严格 null/zero 与 validation | `CONFIRMED_CURRENT` |
| `V1-FN-08` | Local Board | versioned local Storage、stable boardId、save/restore/delete | `CONFIRMED_CURRENT` |
| `V1-FN-09` | Draw workbench | events、peel/commit、cost/history、50 次 undo、`500ms` stop hold、resume | `CONFIRMED_CURRENT` |
| `V1-FN-10` | Probability/cost library | exact core algorithms；小程序只展示 subset | `CONFIRMED_CURRENT / QUALIFIED` |
| `V1-FN-11` | Board Outlook | v1.1.0、最多三抽观察窗、不推荐 | `CONFIRMED_CURRENT` |
| `V1-FN-12` | Context reminder | 生产小程序本地较小规则集；web rules 不全是 production | `CONFIRMED_CURRENT / QUALIFIED` |
| `V1-FN-13` | Silent Account | trusted WeChat context、idempotent find-or-create | `CONFIRMED_CURRENT` |
| `V1-FN-14` | Identity/ICHI ID | server-owned internal accountId、canonical ICHI ID | `CONFIRMED_CURRENT` |
| `V1-FN-15` | Optional Profile | default nickname/avatar fallback、主动编辑、无手机号 | `CONFIRMED_CURRENT` |
| `V1-FN-16` | Account deletion backend | server handler 存在；当前小程序无 UI action | `CONFIRMED_CURRENT / QUALIFIED` |
| `V1-FN-17` | Recognition quota | Asia/Shanghai 每日 5 次，reserve/commit/release/recovery | `CONFIRMED_CURRENT` |
| `V1-FN-18` | Private location evidence | GCJ-02 device/capture evidence，不是 venue/POI | `CONFIRMED_CURRENT` |
| `V1-FN-19` | Versioned Submission | LOCATION/PHOTO/NOTE、snapshot/events/version status | `CONFIRMED_CURRENT` |
| `V1-FN-20` | Ticket PHOTO verification | Provider observation + server exact reconciliation | `CONFIRMED_CURRENT` |
| `V1-FN-21` | Text safety | nickname scene 1、note scene 2、server fail-closed | `CONFIRMED_CURRENT` |
| `V1-FN-22` | Current Publication | owner+board 一条 private P1、exact approved-version join | `CONFIRMED_CURRENT / QUALIFIED` |
| `V1-FN-23` | Failed upload isolation | 新 failure/status 不替换旧 approved facts | `CONFIRMED_CURRENT` |
| `V1-FN-24` | Durable delete | job/tombstone/pending marker/no-resurrection | `CONFIRMED_CURRENT` |
| `V1-FN-25` | My Records | local Board only | `CONFIRMED_CURRENT` |
| `V1-FN-26` | My Uploads | current private publication only | `CONFIRMED_CURRENT` |
| `V1-FN-27` | Storage security | owner-scoped CUSTOM 与 private temp lifecycle | `CONFIRMED_CURRENT / FROZEN` |
| `V1-FN-28` | Private database | 13 ADMINONLY collections，public collection 为 0 | `CONFIRMED_CURRENT / FROZEN` |
| `V1-FN-29` | Server functions | 19 deployable event functions | `CONFIRMED_CURRENT` |
| `V1-FN-30` | 三 Tab sharing | friend/Timeline/copy、tab-only allowlist | `CONFIRMED_CURRENT V1.0.1 SOURCE` |
| `V1-FN-31` | Quality/release operations | 57/571 quality、CloudBase read-back、true-device、publication 后 tag | `CONFIRMED_CURRENT` |

完整端到端说明见 `docs/delivery/v1-validated-product-system-baseline.md`。

## C. Source A 高置信候选

输入文件 `ICHI_V1_Authoritative_Implementation_Truth.md` 在本轮只叫 `HIGH_CONFIDENCE_V1_CANDIDATE`。其候选分组如下：

| Source A ID | 候选事实 |
| --- | --- |
| `SA-01` | V1 是现场识别/抽赏工具与私有数据底座，不是公共地图 |
| `SA-02` | recognize/map/my 共用单页；V1 map 是 placeholder |
| `SA-03` | 辅助抽赏与仅上传版面是共享识别基础的两条流程 |
| `SA-04` | camera-only 与 fileID/temp-URL Provider chain 替代 Base64 |
| `SA-05` | R2 Direct Remaining/qwen3.7/H0 rollback/frozen hashes |
| `SA-06` | null ≠ 0；price/Grand Prize manual |
| `SA-07` | immutable baseline 与 authoritative draw events |
| `SA-08` | deterministic calculation library 与 Board Outlook |
| `SA-09` | local contextual reminders |
| `SA-10` | Local Board / Submission / Current Publication 分层 |
| `SA-11` | seven rules 与 no-resurrection deletion |
| `SA-12` | silent Account、identity/ICHI ID、optional Profile/no phone |
| `SA-13` | daily quota 与 private location evidence |
| `SA-14` | LOCATION → PHOTO → NOTE → APPROVED 与 failure boundary |
| `SA-15` | server text safety、private Storage、13 private collections |
| `SA-16` | My Records local-only；My Uploads current-only |
| `SA-17` | stale async protection 与 WeChat review lesson |
| `SA-18` | V1.0.1 sharing 与 package-size fix |
| `SA-19` | quality/deployment read-back 与 single-worktree |
| `SA-20` | V1 未实现 public map 能力列表 |

Source A 大部分被确认，但没有被盲目接受：share bytes、生产 reminder coverage、core algorithm 的 UI exposure、P1 的字面 pointer 描述、account deletion 可见性都经过了修正或限定。

## D. Source B 项目认知

| Source B ID | 项目认知 | 验证后状态 |
| --- | --- | --- |
| `SB-01` | `progress.md` 的 V1 release closure | `CURRENT RELEASE EVIDENCE` |
| `SB-02` | Memory Bank 的 R2/Storage/Publication current sections | `CURRENT`，已按 code/hash/resources 验证 |
| `SB-03` | dated V1 implementation/incident timeline | `HISTORICAL EVIDENCE`，不是 current instruction |
| `SB-04` | 旧 V2 Account/Profile tasks | `SUPERSEDED` |
| `SB-05` | 旧 multiple/current Observation architecture | `SUPERSEDED` |
| `SB-06` | 旧 no-cloud-photo/Base64/one-hour lifecycle | `SUPERSEDED` |
| `SB-07` | 旧 H0/v4/R1 provider experiments | `HISTORICAL`；R2 为 current |
| `SB-08` | 2026-09-08 完整 V2 plan | `HISTORICAL / BLOCKED DRAFT — NOT EXECUTABLE` |
| `SB-09` | active PRD 的 camera/album 与 no-cloud wording | `STALE`，已修复 |
| `SB-10` | WXML cloud-delete 文案提到地图 | `KNOWN RUNTIME-COPY INCONSISTENCY`，不构成 implementation evidence |
| `SB-11` | `systemSettings` seed 仍提 prompt v3 | `INERT LEGACY SEED METADATA`；runtime R2 为 authority |
| `SB-12` | `prepare-v2-backfill` function name | V1 private report only，`publicWrites=0` |

## E. 冲突矩阵

### V1_KNOWLEDGE_COMPARISON_MATRIX

| 认知 ID | 领域 | Source A 候选 | Source B 状态 / 冲突 | Source C 证据 | 最终裁决 | V2 影响 |
| --- | --- | --- | --- | --- | --- | --- |
| `KM-01` | Share asset | 最终约 113 KB | progress 记录 113,632→127,613；冲突 | current file 127,613 bytes、Git history | 127,613 `CONFIRMED_CURRENT` | 使用真实 package budget |
| `KM-02` | Algorithms | 全部都是 V1 产品功能 | core/UI 描述混合；冲突 | core 全部通过 tests，小程序 UI 更窄 | library confirmed，UI claim qualified | 复用 engine，UI 另定 |
| `KM-03` | Reminders | broad trigger list 在 production | web/mini-program 混合；冲突 | production `draw-session.ts` 规则更少 | production subset confirmed | 不假定已存在 map subscription |
| `KM-04` | P1 | pointer-only | current docs 写 lightweight；部分冲突 | P1 仍有 metadata/initial fields，但不复制 large facts | advancement pointer confirmed，字面 only qualified | public model 不直读/复制 private facts |
| `KM-05` | Capture | camera-only | active PRD 曾写 camera/album | runtime/tests | Source A confirmed，PRD fixed | 保持 capture contract |
| `KM-06` | Image | private temp object chain | PRD 曾写照片完全不进 cloud | uploadFile/fileID/temp URL/cleanup | current code confirmed，PRD fixed | public image 单独设计 |
| `KM-07` | Account | V1 已完成 | old docs 写 V2 Account | bootstrap/client/tests/release evidence | V1 Account confirmed | 不列为 V2 从零任务 |
| `KM-08` | Profile | optional/no gate/no phone | historical Profile-login task | client/server/tests、WeChat closure | confirmed | Profile 不阻塞 map |
| `KM-09` | Account delete | Account management 隐含已完成 | backend/UI 不同 | handler 存在、client control 不存在 | backend-only confirmed | UI 仍需产品决定 |
| `KM-10` | Location | private capture evidence | old text 混同 public POI | domain/runtime/tests、无 public resources | confirmed | venue/precision 为 V2 新问题 |
| `KM-11` | Publication | exact approved pointer join | old snapshot-copy scheme | runtime/tests、`-502001` incident | current advancement confirmed | public projection 分离 |
| `KM-12` | Failure | failed attempt isolated | old generic current observation | runtime/cloud/ticket tests | confirmed | monotonic projector |
| `KM-13` | Deletion | tombstone/no-resurrection | old lazy reconstruction | runtime/client tests | confirmed | public hide/delete 优先 |
| `KM-14` | Approval | private APPROVED 不等于 public-safe | future-map prose 曾过度复用 | 无 public consent/moderation resources | confirmed boundary | public gate 为 net-new |
| `KM-15` | DB/public map | 13 private collections、无 public API | V2 draft 有 future resources | resources/manifest/validate | `NOT_IMPLEMENTED_IN_V1` | 不直读 P1 |
| `KM-16` | Quality | 57 files/571 tests | current progress 一致 | 2026-09-10 `pnpm quality` | confirmed | 复用 quality gate |
| `KM-17` | V1.0.1 | source merged、true-device；publication 未确认 | repo 无 tag | 用户确认 uploaded+approved；仍无 published evidence | `UPLOADED + APPROVED`，`PUBLISHED=UNCONFIRMED` | 等用户明确发布 |
| `KM-18` | Git | single worktree | old migration 不同 | workspace/branch/stash/history | confirmed | 不建额外 worktree |
| `KM-19` | Direct upload | 复用 recognition、跳过 draw session | old local-only 与后期 private upload 并存 | home/recognition/cloud-record tests | current private flow confirmed | 扩展 consent，不重做 intake |
| `KM-20` | Null/zero | null unknown、zero confirmed | old T/P/U/falsy 描述 | R2 resolver/board-record/domain tests | frozen current | public filter/stat 保留 |
| `KM-21` | Baseline/events | immutable + projection | legacy mutable shape | draw/record runtime/tests | R2 confirmed，legacy qualified | 投影 exact approved facts |
| `KM-22` | Quota | daily five/shared/recoverable | old client/pre-account states | runtime/client reservation tests | confirmed | public rate limit 分离 |
| `KM-23` | PHOTO | Provider observes、server reconstructs | old generic PHOTO_FAILED | runtime/tests/incident | staged retry confirmed | 分开 failure domains |
| `KM-24` | Text safety | scene 1/2 | future public moderation 过度延伸 | adapter/tests，无 public fields | private base confirmed | public fields 新 policy |
| `KM-25` | My Records | local-only | old cloud fallback | local repo/page/tests | confirmed | 永不作为 map source |
| `KM-26` | My Uploads | current-only | old per-attempt/multiple observation | get-my-records/adapter/tests | confirmed | public browse 独立 |
| `KM-27` | Storage | owner CUSTOM/一天 fallback | old read blocker/一小时 promise | resources + validate read-back | confirmed | 不扩大 public read |
| `KM-28` | Functions | 19 current | dated 15/16/17/18 | current manifest/build/validate | 19 confirmed | 复用现有职责 |
| `KM-29` | Sharing privacy | tab-only/receiver-own Profile | current docs 一致 | runtime/tests/merge | confirmed | deep link 新 allowlist |
| `KM-30` | Public map | 无 model/API/consent/venue/moderation | V2 draft 容易看似已实现 | resource/function/page absence | 全部 `NOT_IMPLEMENTED_IN_V1` | 仍是 V2 planning input |

未发现影响 current truth 的 runtime-vs-test conflict：`IMPLEMENTATION_EVIDENCE_CONFLICT = 0`。

## F. 代码验证台账

| 台账 ID | 领域 | Runtime | Test/Contract | Git/Release | 等级 | 结果 |
| --- | --- | --- | --- | --- | --- | --- |
| `CV-01` | Tabs/map placeholder | home/navigation | navigation/home tests | V1 source | A | PASS |
| `CV-02` | Assist/direct flows | home/platform | home/flow tests | V1 source | A | PASS |
| `CV-03` | Camera/media | board-media/page | board-media/home tests | V1 source | A | PASS |
| `CV-04` | Temp URL recognition | client + function | client/function tests | production timeline | A+D | PASS |
| `CV-05` | R2 contract | prompt/schema/resolver/runtime | resolver/contracts | SHA evidence | A+D | PASS |
| `CV-06` | Null/manual semantics | client/domain/resolver | board/domain tests | V1 source | A | PASS |
| `CV-07` | Local Board/stale guard | storage/navigation | platform tests | incident evidence | A+D | PASS |
| `CV-08` | Draw/events/undo/stop hold | draw/page | draw/home tests 含 499/500ms | V1 source | A | PASS |
| `CV-09` | Core algorithms | `packages/core` | core tests | V1 source | A | PASS，UI qualified |
| `CV-10` | Board Outlook | mini-program module | outlook/home tests | V1 source | A | PASS |
| `CV-11` | Reminder subset | mini-program draw | draw tests | V1 source | A | PASS，candidate qualified |
| `CV-12` | Account/identity | runtime/client | account/home tests | publication evidence | A+D | PASS |
| `CV-13` | Profile/text safety | runtime/client/safety | corresponding tests | true-device | A+D | PASS |
| `CV-14` | Quota | runtime/client | reservation tests | deploy evidence | A+D | PASS |
| `CV-15` | Location | domain/runtime/client | corresponding tests | prod config | A+D | PASS |
| `CV-16` | Submission | shared runtime | runtime/function tests | timeline | A+D | PASS |
| `CV-17` | PHOTO | ticket function | function/runtime tests | incident/retry | A+D | PASS |
| `CV-18` | Publication/seven rules | runtime/client | runtime/cloud/local tests | P1 fix | A+D | PASS |
| `CV-19` | Deletion | runtime/client | corresponding tests | closure evidence | A+D | PASS |
| `CV-20` | Storage/ACL | resources/runtime | CloudBase validation | read-back docs | B+C+D | PASS |
| `CV-21` | Function inventory | manifest/runtime | build/validate | deploy evidence | B+C+D | PASS |
| `CV-22` | Sharing | runtime/assets | sharing tests | source/merge/true-device | A+D | PASS |
| `CV-23` | Package | asset/source | preflight | Git history | B+C+D | PASS |
| `CV-24` | Quality | scripts/config | 57/571 + contracts | current run | C | PASS |
| `CV-25` | Git/release | Git objects | n/a | tag/release/history/user status | D | PASS |
| `CV-26` | Public-map absence | 无 runtime/resource | validate/home tests | current main | B+C+D | PASS（`NOT_IMPLEMENTED`） |

## G. 被拒绝 / 淘汰认知

### 被拒绝或限定的 Source A 候选

| ID | 候选 | 裁决 | 原因 |
| --- | --- | --- | --- |
| `RJ-A-01` | 最终 friend image 约 113 KB | `REJECTED_BY_IMPLEMENTATION` | 113,632 是放大前；current 为 127,613 bytes |
| `RJ-A-02` | core 全部计算已在小程序显示 | `QUALIFIED` | algorithms 存在且有 tests，但 UI 更窄 |
| `RJ-A-03` | broad web reminder catalog 是 production | `REJECTED_BY_IMPLEMENTATION` | mini-program 规则集更小 |
| `RJ-A-04` | P1 字面上只有 pointer | `QUALIFIED` | approval advancement 不复制 large facts，但 P1 仍有 metadata/initial fields |
| `RJ-A-05` | Account Management 已有可见账号删除 | `QUALIFIED` | backend handler 有，UI control 无 |

### ALREADY_DONE_BUT_STILL_LISTED_AS_FUTURE

| 能力 | 旧 future 认知 | 当前实现证据 | 处理 |
| --- | --- | --- | --- |
| WeChat Account/silent bootstrap/accountId/ICHI ID | V2 建账号 | shared runtime/client/tests | V2 直接复用 |
| Profile/default avatar/edit | V2 建资料 | current profile runtime/tests | 复用，Profile optional |
| Text safety | future moderation base | shared scenes 1/2 | 复用基础，public fields 扩展 |
| Recognition quota | future cloud quota | reserve/commit/release/recovery | 复用；public rate limit 另算 |
| Recognition/Local Board | future pipeline/records | frozen R2 + local repository | 复用 |
| Submission/Current Publication | future contribution/current | versioned Submission + P1 join | 复用 private domain；另建 public boundary |
| My Records/My Uploads | future history/list | local-only/current-only | 复用 |
| Delete/no-resurrection | future lifecycle | durable job/tombstone | 扩展到 public projection |
| Location evidence | future capture location | private GCJ-02 evidence | 只复用私有证据 |
| Ticket verification | future OCR | LOCATION/PHOTO/NOTE current | 复用 private approval |
| Sharing | future general share | V1.0.1 runtime/tests/true-device | 复用 general share |

旧 Account-in-V2、Profile gate、album input、Base64、one-hour lifecycle、H0/v4/R1 current、multiple current observation、large P1 copy、failed replacement、lazy reconstruction、extra-worktree 都只保留在明确标注的历史上下文中。

## H. 当前事实登记表

完整 37 条事实位于 `docs/delivery/v1-current-truth-registry.md`，覆盖导航/流程/识别、Board/draw/algorithm、Account/Profile/quota/location、Submission/PHOTO/Publication/delete、Storage/DB/functions/sharing/package/quality/deployment/Git，以及 public-map absence。

每条均包含：当前事实、用户行为、技术实现、主要代码证据、test/Git evidence、置信度、状态、V2 复用规则和已淘汰认知。全部为 `CONFIRMED_CURRENT`，必要处明确 `QUALIFIED` 或 `NOT_IMPLEMENTED_IN_V1`。

## I. 问题 → 修复 → 最终认知

| ID | 问题/旧假设 | 修复 | 最终认知与 V2 后果 |
| --- | --- | --- | --- |
| `PFK-01` | Base64/event payload 膨胀 | private object/fileID/temp URL | media transport 有独立 lifecycle |
| `PFK-02` | Provider protocol 复杂且不稳定 | minimal frozen R2 | 地图工作不重启 recognition redesign |
| `PFK-03` | Profile gate 导致微信拒审 | silent Account + optional Profile | V2 不恢复无关 gate |
| `PFK-04` | Local/cloud/current 混同 | B1/Sx/P1 分层 | public serving 也应独立 |
| `PFK-05` | 每次 upload 都 current | stable P1 + approved pointer | attempt 不等于 current |
| `PFK-06` | late recovery 覆盖 active Board | identity/generation stale guard | 所有 map async state 继承 |
| `PFK-07` | cloud delete 后复活 | durable marker/job/tombstone | delete 胜过 stale update |
| `PFK-08` | Provider success + DB failure 错归类 | stage checkpoint/error | 分离 Provider/validation/DB/projection/UI |
| `PFK-09` | P1 large update `-502001` | facts 留 Submission，P1 pointer advancement | minimal read model + exact provenance |
| `PFK-10` | oversized share image | 800×640/127,613-byte asset | package budget 是 release gate |
| `PFK-11` | extra worktree complexity | single worktree | V2 不新建默认 worktree |
| `PFK-12` | deploy success message 不足 | read-back/reverse hash/smoke | target evidence 优先 |

## J. V1 未实现能力

以下全部是 `NOT_IMPLEMENTED_IN_V1`：public map read model、public viewport/detail API、public marker/anonymous query、explicit private-to-public consent、public venue/POI、public precision、public eligibility/moderation/takedown、`publicLeadId`、public image pipeline、merchant/staff verification、public rate/abuse control、map/list/filter/detail runtime UI、`CanonicalBoard`、用户可见 delete-account control、完整跨设备 active draw sync。

future-facing docs 与 map placeholder 不等于 implementation。cloud-delete modal 的“好版地图”措辞是 known runtime-copy inconsistency；本轮禁止 runtime change，因此只记录不修改。

## K. V2 初步能力差异

### ALREADY_EXISTS_AND_REUSE

silent Account/ownership/ICHI ID、optional Profile、quota、camera/private temp-image/R2、manual fields、Local Board/events/persistence、core/Board Outlook/production reminder subset、Submission/PHOTO/NOTE/private P1/seven rules/delete、My Records/My Uploads、text-safety base、general sharing、quality/true-device/deployment/Git discipline。

### NEEDS_V2_EXTENSION

private-to-public consent/owner control、location→venue/public precision、public field eligibility/moderation、public delete propagation、public-safe share、map async guard、public-specific tests/ops/release gates。

### NET_NEW_V2

supply/value 与 target-platform feasibility、minimal public serving projection/opaque ID、bounded public viewport/detail API、public rate/abuse control、map/list/filter/detail client/UI、clustering/cache、public-map pilot/production closure。

本节不授权 ordering、task ID、dependency 或 implementation step。

## L. 当前文档矛盾

### ACTIVE_DOC_CONTRADICTION_REPORT

| ID | 文件/位置 | 旧描述 | 已验证事实 | 修复 |
| --- | --- | --- | --- | --- |
| `DC-01` | `PRD.md` V1 input | camera/album | production camera-only | 已替换 active line |
| `DC-02` | `PRD.md` 图片 | “照片完全不进 cloud” | private temporary object + no long-term retention | 已替换 active line |
| `DC-03` | `implementation-plan.md` | 完整 V2 task sequence 看似可执行 | V2 planning 等 V1 truth human review | full draft 归档；current plan 只保留 delta |
| `DC-04` | README/Memory Bank current entry | 2026-09-08 V2 packet 是 current review | current review 是 V1 truth closeout | 已同步 current wording |
| `DC-05` | V1 baseline/workbench | one-second long-press stop | `STOP_HOLD_DURATION_MS = 500`，499/500ms tests | 已同步为 `500ms` |
| `DC-06` | V1.0.1 status | uploaded/approved/published 全部未确认 | uploaded=YES、approved=YES、published=UNCONFIRMED | 已同步；tag 仍禁止 |

dated historical statement 明确保留为 history，不拥有执行权。`ACTIVE_V1_TRUTH_CONTRADICTIONS = 0`。

## M. 更新文件

- `docs/delivery/v1-validated-product-system-baseline.md`：完整中文 V1 基线，修正 `500ms` 与 V1.0.1 状态。
- `docs/delivery/v1-current-truth-registry.md`：37 条事实中文化，技术裁决不变。
- `docs/delivery/v1-truth-reconciliation-review-packet.md`：本审核包中文化并加入 closeout 状态。
- `memory-bank/implementation-plan.md`：恢复为唯一 current plan，保留执行协议、V1 摘要和 preliminary delta。
- `memory-bank/implementation-plan-history.md`、`memory-bank/v2-planning-draft-pre-v1-truth-review.md`：历史、不可执行警告中文化。
- `README.md`、`PRD.md`、`memory-bank/architecture.md`、`design-document.md`、`tech-stack.md`、`progress.md`：current active section 同步。
- preceding planning pass 已有 docs-only 变更继续保留，并在需要处标为 historical/superseded。

没有删除历史证据。

## N. 验证

最终 closeout 记录：

- `corepack pnpm quality`：PASS；
- Prettier：PASS；
- ESLint：PASS；
- root + web TypeScript：PASS；
- Vitest：57/57 files、571/571 tests PASS；
- board-layout/recognition/render/V1-A/V1-C/workflow contracts：PASS；
- `corepack pnpm cloudbase:validate`：PASS，13 private collections、19 deployable functions；
- Storage CUSTOM owner rule 与 `recognition-temp` 一天 lifecycle read-back：PASS；
- `node scripts/validate-v1f-release.mjs`：PASS，908,347 mini-program source bytes；
- R2 Prompt/Schema/Resolver hash：与 frozen values 精确一致；
- runtime/backend/Cloud Functions/DB/Storage/R2/production config modified：0；
- deploy/migration/commit/push/PR/merge/tag：0。

最终 `git diff --check`、workflow validation、status/name-status/stat 与 scope checks 在格式化后重新运行。

## O. 人工问题

唯一仍需用户明确确认的 release fact：V1.0.1 是否已经在微信正式 `PUBLISHED`。当前已固定 `UPLOADED=YES`、`APPROVED=YES`，但不能从“审核通过”推断“正式发布”。用户明确说“1.0.1 已正式发布”前，`PUBLISHED=UNCONFIRMED`，不得创建 tag 或 GitHub Release。

该问题不改变已验证 V1 implementation truth，也不授权 V2 planning/implementation。

## P. 状态

`V1_FUNCTION_INVENTORY_COMPLETE = YES`

`SOURCE_A_AND_B_COMPARED = YES`

`V1_CODE_VERIFICATION_COMPLETE = YES`

`V1_CURRENT_TRUTH_REGISTRY_BUILT = YES`

`HIGH_CONFIDENCE_CANDIDATE_NOT_BLINDLY_ACCEPTED = YES`

`REPOSITORY_OLD_KNOWLEDGE_NOT_BLINDLY_ACCEPTED = YES`

`ACTIVE_V1_TRUTH_CONTRADICTIONS = 0`

`V1_VALIDATED_BASELINE_READY_FOR_HUMAN_REVIEW = YES`

`V1_DOCUMENT_CORRECTION_READY_FOR_HUMAN_REVIEW = YES`

`V1_LONG_PRESS_STOP_DURATION_MS = 500`

`WECHAT_V1_0_1_UPLOADED = YES`

`WECHAT_V1_0_1_APPROVED = YES`

`WECHAT_V1_0_1_PUBLISHED = UNCONFIRMED`

`V1_0_1_TAG_ALLOWED = NO`

`V2_IMPLEMENTATION_STARTED = NO`

`commit = NO` · `push = NO` · `PR = NO` · `merge = NO` · `tag = NO` · `deploy = NO`

完成本审核包后立即停止。不要重建完整 V2 plan，不要开始 `TASK-V2-01`。
