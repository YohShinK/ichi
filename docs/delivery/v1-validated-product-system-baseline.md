# ICHI V1 已验证产品与系统基线

> 状态：`VALIDATED / USED AS V2 PLANNING BASELINE（已验证／已作为 V2 规划基线）`
>
> 证据基线：`origin/main@929d189a06e13010e50abf4927bfec3b1ebd49fc`，2026-09-10。
>
> 权威方法：讨论形成的 Source A 与项目文档 Source B 都按候选处理；current runtime、tests/contracts、Git history 和 release evidence（Source C）负责最终裁决。

## A. V1 产品目标

V1 是服务现场一番赏玩家的微信小程序，覆盖版面识别、人工校正、确定性抽赏辅助、本机记录和私有证据上传。V1 明确没有发布公共地图。它的长期成果包括玩家工具，以及严格区分 Local Board、versioned Upload Submission、Current Cloud Publication 的私有数据底座。

## B. V1 最终用户功能

| 功能 ID | 用户行为 | 实现方式 | 状态 |
| --- | --- | --- | --- |
| `F-V1-01` | 切换识别／好版地图／我的 | 单一 Page route 与内部 Tab state；地图为占位 | `CONFIRMED_CURRENT` |
| `F-V1-02` | 进入辅助抽赏 | camera、recognition、editable result、Local Board、workbench、可选私有上传 | `CONFIRMED_CURRENT` |
| `F-V1-03` | 不抽赏直接上传版面 | 复用 identity/quota/location/camera/recognition，跳过 draw session | `CONFIRMED_CURRENT` |
| `F-V1-04` | 校正识别 | 修改 IP/theme/remaining，手填 price，标记 Grand Prize；unknown/invalid 阻止确认 | `CONFIRMED_CURRENT` |
| `F-V1-05` | 一抽一记 | draw event 驱动 current remaining/cost/history 投影并持久化 | `CONFIRMED_CURRENT` |
| `F-V1-06` | 查看概率与局面 | 小程序显示当前 per-tier probability、cost 与最多三抽 Board Outlook | `CONFIRMED_CURRENT / QUALIFIED`；core library 更完整 |
| `F-V1-07` | 撤销、收手、恢复 | 连续撤销最近 50 抽；`500ms` 长按收手；本机草稿离线恢复 | `CONFIRMED_CURRENT` |
| `F-V1-08` | 未完善 Profile 也可使用 | trusted WeChat identity silent find-or-create Account | `CONFIRMED_CURRENT` |
| `F-V1-09` | 主动修改头像昵称 | nickname 安全检查；avatar 写 stable cloud fileID | `CONFIRMED_CURRENT` |
| `F-V1-10` | 查看每日识别额度 | 两个入口共用 Asia/Shanghai 每日 5 次成功识别 | `CONFIRMED_CURRENT` |
| `F-V1-11` | 提交与核验赏票证据 | `LOCATION → PHOTO → NOTE → APPROVED`，按 failure class 重试 | `CONFIRMED_CURRENT` |
| `F-V1-12` | 查看我的记录 | 只列 Local Board | `CONFIRMED_CURRENT` |
| `F-V1-13` | 查看我上传的版面 | 每个 owner+board 最多一条 private Current Publication | `CONFIRMED_CURRENT` |
| `F-V1-14` | 删除本机或云端记录 | local delete 只删本机；accepted cloud delete durable 且在当前设备级联 | `CONFIRMED_CURRENT` |
| `F-V1-15` | 分享三个主 Tab | friend、Timeline、copy 使用 `tab`-only public allowlist | `CONFIRMED_CURRENT`；V1.0.1 已上传、审核通过，正式发布未确认 |

## C. 页面与主要用户流程

### C1. 路由与三个 Tab

小程序主页面为 `pages/home/index`。`recognize`、`map`、`my` 是内部状态，不是三个独立 Page route。`navigation-state.ts` 保存最近稳定的 recognition/draw view，capture/loading 等 transient view 返回时不会破坏 active state。V1 地图是明确占位，没有 public endpoint 或 marker。

证据：`apps/client/miniprogram/app.json`、`pages/home/index.*`、`platform/navigation-state.ts`、navigation/home behavior/fidelity tests。

### C2. 辅助抽赏全链路

```text
silent Account bootstrap
→ quota/location readiness
→ embedded camera capture 与可见范围裁切
→ private temporary object upload
→ fileID-only function event
→ short HTTPS URL 与 R2 Provider call
→ AJV + deterministic R2 resolver
→ editable recognition result
→ validated Local Board
→ draw session（events、current projection、probability/cost/outlook/reminders）
→ stop/save locally
→ optional private Upload Submission
→ LOCATION → PHOTO → NOTE → APPROVED
→ Current Publication 的 publishedSubmissionVersion 推进
```

Board 建立后，本机 workbench 可离线使用。Provider 与 cloud submission 是独立网络边界。上传永远不等于自动公开到地图。

### C3. 仅上传版面

仅上传版面复用 Account、quota、location、camera、R2 recognition 和 correction。确认后跳过 draw session，进入 versioned private upload chain；它不创建 public map record。

## D. 账号、身份与资料

`bootstrap-account` 信任 `getWXContext()`，不信任 client-supplied identity。transaction 幂等查找或创建 WeChat identity 与 Account。新用户取得 canonical ICHI ID、默认昵称 `ICHI 玩家`、nullable `avatarFileId` 和 incomplete Profile state，但仍可使用核心功能；existing Profile 字段保持不变。

Profile 只是展示资料：

- Profile completeness 不阻塞辅助抽赏或仅上传版面；
- 不要求手机号；
- 包内头像只是 UI fallback，不作为默认 DB avatar 上传；
- `chooseAvatar` temp path 上传到 `profile-avatars/` 后，只持久化 stable cloud fileID；
- nickname 经 server `PROFILE_NICKNAME` / `msgSecCheck` scene 1。

backend 存在 `delete-my-account`，但当前小程序没有用户可见的删除账号控件。这是 backend capability，不是已发布的 Account Management UI 功能。

## E. 识别

### E1. 图片获取与传输

生产版面输入为 camera-only。sensor output 按取景框中心 `aspect-fill` 裁切，最长边不超过 2400px，并进行 JPEG 处理。binary 上传到 owner-scoped `recognition-temp/`；function event 只携带 fileID 和 metadata，再生成 temporary HTTPS URL 交给 Provider。主链不存在 Buffer download、Base64 或 Data URL。

client 与 function 正常完成时都立即尝试清理。COS `Expiration.Days=1` 只是 orphan fallback，不是正常保留期。

### E2. 冻结的 R2 契约

生产设置：

- mode：`r2_direct_remaining`；
- model：`qwen3.7-flash`；
- `enable_thinking=false`、`temperature=0`、`response_format=json_object`；
- Provider fields：`ipName`、`themeName`、`tiers[]`，tier 包含 `tierCode`、`rawLabel`、`visibleNumberRuns`、`remainingTickets`；
- H0 `hybrid_semantic` 是唯一 frozen rollback。

Provider 只观察，deterministic code 负责 validate/normalize。price 和 `isGrandPrize` 由用户决定。`remainingTickets=null` 表示 unknown，`0` 表示 confirmed zero；visible runs 只作 deterministic fallback。R2 不恢复 R1 的 T/P/U inference。

### E3. 可编辑结果

IP 和 tier 可校正，theme optional，price 必须是用户输入的合法金额，每个正式 tier 必须有合法 remaining，Grand Prize 必须由用户明确设置。invalid 或 required-null 值可暂存在 editable draft，但不能建立正式 Board 或 Submission snapshot。

## F. 版面、抽赏与概率

### F1. 版面与事件模型

用户确认的 R2 remaining 是 immutable baseline R；每次实际抽赏是 authoritative event；current remaining 由 baseline 减去 event history 计算。该模型保证 traceability 与 deterministic undo。legacy record 只通过 compatibility path 读取，不重定义 R2。

### F2. 抽赏工作台

生产小程序实现 prize-ticket peel/commit、remaining/cost update、draw history、连续撤销最近 50 抽、本机保存/恢复，以及 `500ms` 长按收手。代码常量为 `STOP_HOLD_DURATION_MS = 500`；behavior test 已确认 `499ms` 松手不触发、`500ms` 达到触发条件。V1 不提供完整 active workbench 的跨设备实时 cloud sync。

### F3. 确定性引擎与可见界面

`packages/core` 实现并测试 single/multi-draw probability、hypergeometric distribution、multi-target exact probability、expected first hit/count、money/budget、buyout/direct-purchase comparison 和 constrained minimum draws。当前小程序没有暴露全部结果；其可见范围更窄，主要是 per-tier probability、cost 和 Board Outlook。因此 library 是已完成可复用能力，但“全部已在生产 UI 展示”被否决。

### F4. 局面观察

`board-outlook-v1.1.0` 以最多三张剩余抽数为固定观察窗，展示 event likelihood/cost，不排序版面、不保证中奖、不推荐继续投入，并明确停止仍可选。

### F5. 情境提醒

生产小程序的 `platform/draw-session.ts` 使用 deterministic local rules，包括 target hit、large/unexpected prize、small-prize streak、same medium-prize streak、five misses/stop、repeated/new tier；undo 使用 toast。web prototype 有更大的规则目录，但不能全部写成生产小程序 contract。

## G. 本机存储

Local Board 使用 stable `boardId` 与 versioned JSON storage envelope。draft、history、savedAt、restore 和 delete 属于本机 lifecycle。My Records 只列该 repository。主动打开 cloud record 可以 materialize `recoveryDraft`，但不构成隐式 cloud fallback listing。active identity/request generation 防止迟到 background work 覆盖较新的 active Board。

## H. 上传提交

`drawSubmissions` 按 `recordId + boardId + submissionVersion` 保存完整 immutable version facts，包括 checkpoint/failure state、location、技术重试窗内的 evidence reference、final snapshot、authoritative draw events、note 和 review result。较新 version 是新的 attempt，不是第二条 current publication。

## I. 赏票核验

部署函数名为 `recognize-draw-tickets`；仓库保留历史 source directory `verify-prize-tickets`。Provider 只返回 ticket observation。server 从 authoritative draw events 重建 expected tier counts，再 canonicalize/count Provider items 并 exact reconcile；expected counts 与 draw history 不发送给 Provider。

失败边界：

- Provider/transport/parse/schema technical failure：可在 retained-image window 内 same-version retry；
- mismatch：终态 evidence mismatch，不等于 Provider outage；
- NOTE safety failure：只重试 NOTE；
- explicit deletion 优先于 in-flight completion；
- terminal outcome 清理 temporary evidence，Days=1 仅作 orphan fallback。

## J. 当前云端发布

`observationCandidates` 是 private P1 Current Publication。`recordId` 是 stable identity；`recordCode` 是六位 display/query/support code；`cloudRecordId` 是 local reference；`submissionVersion` 标识 upload attempt/version，四者不得混用。

P1 lightweight 但不是字面上只有一个 pointer 字段：它保留 stable/queryable publication metadata 与 initial fields。冻结修复的关键是，APPROVED advancement 只推进 `publishedSubmissionVersion` 等轻量状态，不复制大型 `finalSnapshot + authoritativeDrawEvents`；`get-my-records` 读取精确 APPROVED Submission 投影完整事实。

## K. 我的记录、我的上传与七条规则

| # | 规则 | 代码路径 | 测试路径 | 已确认 |
| --- | --- | --- | --- | --- |
| 1 | `MY_RECORDS = Local Board` | local draft repository、home page | local-draft/home tests | YES |
| 2 | `MY_UPLOADS = Current Cloud Publication` | `get-my-records`、cloud-record adapter | runtime/cloud-record tests | YES |
| 3 | owner+board 最多一个 current P1 | shared runtime transaction | runtime tests | YES |
| 4 | APPROVED re-upload 推进同一个 P1 | publication transaction | runtime/ticket tests | YES |
| 5 | local delete 不删除 cloud P1 | local repository action | local/home tests | YES |
| 6 | accepted cloud delete 使用 durable semantics，并删除当前设备 matching Local Board | `delete-my-record`、deletion job、client cascade | runtime/cloud/home tests | YES |
| 7 | pending/failed/late attempt 不替换 current approved facts | monotonic version/status checks、exact approved join | runtime/cloud/ticket tests | YES |

My Uploads 可在旧 approved facts 仍为 current 时显示 latest attempt status。client dedupe 只是防御，server identity rule 才是 authority。

## L. 位置

V1 保存 private GCJ-02 latitude/longitude、accuracy、capture time、source 和 consent version。prize-ticket verification 使用 server-configured radius；release evidence 记录 production 为 200m，代码在配置缺失/非法时 fail closed。它不是 public venue、POI、merchant identity 或 public coordinate。

## M. 文本安全

shared server module 将 Profile nickname 映射 scene 1，将 map/upload note 映射 scene 2。只有明确 pass 才成功；unknown、risky、technical error 都 fail closed。V1 private `APPROVED` 只证明 private submission contract，未来 public fields 必须单独做 eligibility/moderation 决策。

## N. 存储、数据库与访问控制

### N1. 云存储

| Prefix | Client read | Client write/delete | Lifecycle | 职责 |
| --- | --- | --- | --- | --- |
| `profile-avatars/` | owner only | authenticated non-anonymous owner | durable，max 2 MiB | Profile avatar |
| `recognition-temp/` | denied | authenticated non-anonymous owner | 正常即时清理；`Days=1` orphan fallback；max 20 MiB | private Provider transport/retry evidence |

Storage 保持 `CUSTOM`，不是 public bucket。

### N2. 数据库集合

13 个 collection 全部为 `ADMINONLY`，`publicCollections=[]`：

`accounts`、`wechatIdentities`、`profiles`、`ichiIds`、`accountRoles`、`dailyQuotas`、`recognitionJobs`、`observationCandidates`、`drawSubmissions`、`recordCodes`、`deletionJobs`、`systemSettings`、`auditEvents`。

server function 强制 owner semantics，不存在 anonymous direct client collection query。

### N3. 云函数

CloudBase validation 生成 19 个可部署 Nodejs20.19 functions：

| Function | 职责 | 当前角色 |
| --- | --- | --- |
| `bootstrap-account` | trusted identity find-or-create | Account bootstrap |
| `get-my-profile` | owner Profile read | optional Profile |
| `bind-wechat-profile` | nickname/avatar update + safety/ownership | optional Profile edit |
| `get-quota-status` | read quota | preflight display |
| `assign-special-ichi-id` | controlled canonical ID assignment | identity maintenance |
| `reserve-recognition` | transactional quota reservation/token | shared recognition gate |
| `release-recognition` | release unclaimed/failed reservation | failure recovery |
| `get-recognition-job` | recover recognized job state | retry/recovery |
| `recognize-board` | temp URL、Provider、AJV、R2 resolver | board recognition |
| `finalize-board-observation` | persist Board observation 并 commit recognition | private observation |
| `finalize-draw-update` | authoritative event batch/submission version | private upload facts |
| `recognize-draw-tickets` | Provider ticket observation + exact reconcile | PHOTO checkpoint |
| `get-my-records` | current P1 + exact Submission projection | My Uploads/read recovery |
| `delete-my-record` | durable publication deletion request | private delete |
| `delete-my-account` | backend account deletion | backend capability；当前无 UI control |
| `release-stuck-reservations` | scheduled quota recovery | maintenance |
| `reconcile-stuck-jobs` | scheduled job recovery | maintenance |
| `retry-deletions` | durable deletion retry | maintenance |
| `prepare-v2-backfill` | private eligibility report，`publicWrites=0` | report only；不是 V2 public implementation |

deploy manifest 生成 17 个 shared-runtime function，两个 standalone recognition function 补足 19 个。

## O. V1.0.1 分享

`home-sharing.ts` 只允许 `recognize|map|my`，非法/缺失值 fallback `recognize`。friend share 使用 title `ICHI 一奇抽赏助手` 和 `/assets/share/ichi-share-message.png`（800×640，127,613 bytes）；Timeline 使用 `/assets/v1-29/ichi-avatar.png`（320×320，76,376 bytes）；copy 只分享 public-safe native route/query。allowlist 禁止 board、record、account、Profile、quota、history 等 private fields。“我的”接收者看到自己的 bootstrapped Profile。

source `8d442aa7cc9f1921a9b9aade231b5884e8d2dd00` 已由 `929d189a06e13010e50abf4927bfec3b1ebd49fc` merge main，true-device PASS 已记录。用户现已明确确认微信 `UPLOADED + APPROVED`；正式 `PUBLISHED` 仍 `UNCONFIRMED`，因此 `v1.0.1` tag 不允许创建。

## P. 包体与性能

当前 `validate-v1f-release` 报告 mini-program source 为 908,347 bytes。旧 1,254×1,254／约 782 KB sharing asset 已删除。最终 800×640 asset 在图标放大 30% 后从 113,632 增至 127,613 bytes，package 仍低于项目 2 MiB gate。Source A 的“最终约 113 KB”是 intermediate size，已被当前文件和 Git history 否决。

历史计划中的 recognition performance threshold 不在本文件转换为新的 production claim；只在其原始 release evidence/target 语境中保留。

## Q. 测试、质量与真机

2026-09-10 `corepack pnpm quality` 通过：

- Prettier；
- ESLint；
- root 与 web TypeScript project；
- 57 Vitest files / 571 tests；
- board layout、recognition、render、V1-A、V1-C、workflow contracts。

`corepack pnpm cloudbase:validate` 同样通过：13 private collections、19 functions、Storage CUSTOM owner rule 与一天 lifecycle read-back。微信 camera、location、permission、Profile avatar/nickname、share landing 与 actual publication 必须通过 true-device gate。repo 已记录 V1.0.0 publication/true-device closure 与 V1.0.1 sharing true-device PASS；用户又确认 V1.0.1 已上传并审核通过。

## R. 部署与运维

V1 production incident 固定了以下规则：

```text
scoped deploy
→ merge/preserve environment keys
→ read back target function/resource state
→ reverse source/tree hash（适用时）
→ black-box smoke
→ true-device verification（涉及微信行为时）
```

CLI success 或 documentation assumption 不能单独证明线上正确。maintenance functions 负责 stuck reservation/job 与 deletion retry，不依赖本地 Codex process。

## S. Git 与发布

- workspace：`/Users/cunfu/Documents/ichi 2`；
- current planning branch/base：`feature/v2-board-map@929d189a06e13010e50abf4927bfec3b1ebd49fc`，审计时等于 `origin/main`；
- V1.0.0 online source：`03942f2067959a4b8b0eb6223c949e51e768587d`；
- V1.0.0 publication closure：`62c02ab6bb16ad415a7a9034e41c28066bfe8af3`；
- `v1.0.0^{}` 指向 `03942f…`，GitHub Release 存在，微信已发布；
- V1.0.1 source：`8d442aa7cc9f1921a9b9aade231b5884e8d2dd00`；
- V1.0.1 main merge：`929d189a06e13010e50abf4927bfec3b1ebd49fc`；
- V1.0.1 微信已上传、审核通过，正式发布 `UNCONFIRMED`，无 tag；
- 普通版本使用 single worktree 与 branch switching。

## T. 主要问题与最终修复

| 认知 ID | 旧假设 | 真实失败 | 最终修复 | 最终认知 | V2 影响 |
| --- | --- | --- | --- | --- | --- |
| `K-V1-01` | 通过 function event 发送 image bytes/Base64 | Base64 膨胀和 request/latency 限制 | private object + fileID + short URL + cleanup | 大媒体使用受控 storage transport，不进 event JSON | 单独设计 media lifecycle |
| `K-V1-02` | 更复杂 Provider T/P/sequence inference 更准确 | H0/v4/R1 多轮实验脆弱且结果波动 | freeze minimal R2 + deterministic/user semantics | 模型只观察最小事实 | 地图不得重启 recognition redesign |
| `K-V1-03` | Profile authorization 可作 login gate | 微信审核拒绝与首用 UX 问题 | silent Account + optional Profile | identity 与 Profile 分离 | V2 不得恢复无关 gate |
| `K-V1-04` | local/cloud/current 可用一个对象 | delete/retry/ownership/history 语义冲突 | Local Board、Submission、Current Publication 分层 | 三个 lifecycle/identity 必须分开 | public serving 也须显式独立 |
| `K-V1-05` | 每次上传都可成为新 current observation | multiple card 和 current 不可靠 | owner+board 一个稳定 P1，仅 APPROVED version 推进 | attempt 是 history，current 是 monotonic pointer | 只投影 selected approved version |
| `K-V1-06` | background completion 可覆盖读取到的状态 | late recovery 覆盖 active draw UI | active identity/request-generation guard | stale response 不拥有较新 state | map async 同样处理 |
| `K-V1-07` | local/cloud delete 可 lazy inference | stale local reference 复活 deleted cloud data | pending marker、tombstone、durable job | explicit deletion 胜过 late write | public projector 必须 monotonic/hide-first |
| `K-V1-08` | generic Provider failure 足够 | Provider 成功但 P1 DB update 失败，错误归类 | stage-specific checkpoint/error | Provider/validation/DB/projection/UI 分层 | public pipeline 使用稳定错误边界 |
| `K-V1-09` | P1 可每次复制 full snapshot/events | CloudBase `-502001` 大字段 update failure | 完整事实留 Submission，P1 推进 `publishedSubmissionVersion` | P1 是 lightweight current index，不重复存事实 | public read model 只投影最小 allowlist |
| `K-V1-10` | 大分享图不会影响 package | 约 782 KB asset 明显增大包体 | 改为 800×640/127,613-byte asset + package gate | static media 必须有 release budget | marker/thumbnail/image 从一开始计预算 |
| `K-V1-11` | 普通版本默认额外 worktree | migration/residual 协调复杂 | single workspace + branch switching | single-worktree 是项目规则 | V2 必须遵守 |
| `K-V1-12` | deployment success message 证明目标正确 | wrong directory/env/version 与 key-loss 风险 | target read-back、env merge、reverse hash、smoke | target evidence 高于 assumption | capability/deploy gate 先于 release claim |

## U. 冻结契约

- R2 Prompt SHA-256：`c083066c80999722a2e3207f64654c598e418daf1c51dba35d57abf0291a3462`
- Provider Schema SHA-256：`178c3fffb9ad74257ad6fb0123509beacbd011225eae2aa7eb2d648beb690722`
- R2 Resolver SHA-256：`46ffebadc3094412c4beb9c8625acdf83346b496e382fe40a48083ff101411d8`
- Storage CUSTOM boundary 与 `recognition-temp/` 一天 orphan fallback
- R2 null/zero、manual price/Grand Prize、immutable baseline/event projection
- Local/Submission/Current Publication identity 与 seven rules

本轮没有修改任何 frozen runtime file。

## V. V1 明确未实现能力

以下全部为 `NOT_IMPLEMENTED_IN_V1`：

- public map serving read model / public marker collection；
- public viewport API / public detail API / anonymous map query；
- explicit private-to-public consent、versioned public-field preview、public withdrawal UX；
- public venue/POI confirmation、public location precision；
- independent public eligibility/moderation/takedown state；
- `publicLeadId` lifecycle；
- public image pipeline；
- private V1 submission contract 之外的 public note/image moderation；
- cross-owner `CanonicalBoard`、automatic merge/unmerge、collaborative public version chain；
- merchant/staff identity verification；
- public API rate limiting/abuse prevention；
- 用户可见 delete-account control；
- full cross-device active draw-session sync。

map page 和 cloud-delete modal 中存在未来导向的“好版地图”文案，但这不是 public map implementation evidence。因本轮禁止 runtime change，该 copy inconsistency 只记录、不修改。

## W. V2 复用与扩展边界

### `ALREADY_EXISTS_AND_REUSE（已存在，直接复用）`

Account/ownership/ICHI ID、optional Profile、quota、camera/private recognition transport、frozen R2、manual fields、Local Board/events/persistence、calculation library、Board Outlook、production reminder subset、versioned Submission、private Current Publication/seven rules、deletion/no-resurrection、My Records/My Uploads、private text-safety 基础、三 Tab sharing、quality/true-device/deploy/Git discipline。

### `NEEDS_V2_EXTENSION（需要 V2 扩展）`

explicit public consent/owner control；location→venue/public precision；public eligibility/moderation；delete propagation；public-safe sharing；public-specific tests/ops/release gate；map state stale-response guard。

### `NET_NEW_V2（V2 真正新增）`

supply/value proof；target geo/platform feasibility；minimal public serving projection/identity；bounded public viewport/detail API；map/list/filter/detail client/UI；clustering/cache/rate/abuse；public-map pilot 与 production closure。

这里只是 `PRELIMINARY_V2_CAPABILITY_DELTA`，人工审核前不授权 V2 task sequence。

## X. 证据附录

- client runtime/tests：`apps/client/miniprogram/pages/home/`、`apps/client/miniprogram/platform/`。
- deterministic calculation/tests：`packages/core/src/`。
- Account/domain/submission/publication/quota/delete：`services/cloudbase/shared/runtime.js`、`domain.js` 及 tests。
- Recognition：`services/cloudbase/functions/recognize-board/`、`data/recognition-contract/`。
- Ticket verification：`services/cloudbase/functions/recognize-draw-tickets/` 与 historical `verify-prize-tickets/`。
- Security/resources：`services/cloudbase/database/resources.json`、`services/cloudbase/deploy/manifest.json`、deploy validation。
- Release history：`memory-bank/progress.md`、Git graph/tags、GitHub Release list。
- normalized truth：`docs/delivery/v1-current-truth-registry.md`。

当前自动证据：`pnpm quality` PASS，57/57 files、571/571 tests；CloudBase validate PASS，13 private collections、19 functions；V1-F preflight PASS，908,347 source bytes。
