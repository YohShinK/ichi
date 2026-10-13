# TASK-V2-19｜最终验收前 candidate runtime 接线阻断

日期：2026-09-28。按 Founder 提供的《TASK-V2-19 最终收口 → TASK-V2-20 True-Device Validation Matrix 执行总命令》A.1—4 先审计正式小程序与既有 shadow function 合同。**停止结论：`TASK_V2_19_CANDIDATE_RUNTIME_BINDING_BLOCKED`。**A.2 要求的正常产品路径不能仅凭当前已冻结的四个 shadow 函数安全完成；不得将本地 synthetic/disabled 路径当成真实 candidate 真机路径。此报告是 exact blocker/diff，**不是最终验收报告或部署授权**。

## 1. 当前正式 runtime binding

| 产品宿主 | 当前实际绑定 | 对 TASK20 的影响 |
| --- | --- | --- |
| `pages/home/index.ts` 的 `ensurePublicMapClient()` | `new SyntheticPublicMapService()`，没有任何 `v2-shadow-query-public-map-leads` / `v2-shadow-get-public-map-lead-detail` 的 `wx.cloud.callFunction` transport | 正常地图 query/detail 仍为本机 fixture；真机观测不能证明 candidate 网络、分页或公开数据。 |
| `humanAssistanceClient` | `disabledHumanAssistanceService`，固定返回空请求／回答失败 | 上传成功态与「我的 → 我上传的版面」UI 已存在，但真实 HA 请求永远不会出现。 |
| `ensurePublicMapAuthorizationClient()` | `new SyntheticPublicMapAuthorizationService()`；accept、withdraw、delete 只改变本机内存状态及示例 lead | consent 与 owner command 会产生虚假的正向结果，无法证明 CloudBase 持久授权、hide-first 或 no-resurrection。 |
| `ensurePublicMapReportClient()` | `new SyntheticPublicMapReportService()`，本机 Set 记录 action | 在 candidate 正常路径会显示本机成功；至少需要 fail-closed，不能把它作为云端举报成功。 |
| 地图定位 | `requestNativeMapLocation()` 实际调用 `wx.getSetting`／`wx.authorize`／`wx.getLocation(type=gcj02)`，失败后提示手动浏览 | 此部分可供 TASK20 真机验证，但地图内容仍来自本机 fixture。 |

正式小程序没有 TASK18 长按压测入口、压测面板、force-individual override。TASK17 的 `NATIVE_MAP_ZOOM_DIAGNOSTICS_ENABLED=false` 是默认关闭的代码内测量，不存在对应 UI／长按触发入口。独立 R4 测试小程序和远端 `ENROLL_TEST_CALLER` 已按前次 cleanup 删除；本轮不恢复。

## 2. 既有四函数不能直接填补的合同缺口

1. 现有 query/detail 两函数可作为 public read transport；正式页面仍需一个以 `wx.cloud.callFunction` 调用它们、经 `public-map-wire-adapter.ts` 验证 detail 并将失败映射到 frozen `PublicMapService` 错误的 candidate-only adapter。develop/trial 才能选择此路径；release 与未知 `envVersion` 必须 fail-closed。当前这只是**本地未实施差异**。
2. `v2-shadow-get-my-assistance` 当前返回 `{requestId, expiresAt, currentCard, comparisonCard}`；前端 `HumanAssistanceRequestView` 必须有 `recordId`、`submissionVersion`、两个 label，并在 `HumanAssistanceClient.refresh(recordVersions)` 中与现有 V1 cloud records／local drafts 逐版本匹配。云端 HA request 只有 `observationVersionId`／`observationVersion`／`fixtureId`，没有前端所需的可信 record/version 关联。直接套类型、伪造 V1 recordId 或让客户端自报 owner/version 均不安全；保持现状会把请求全部过滤掉。安全接线需要**修改已冻结的 shadow resolver/get-my 输出和 synthetic upload record lineage 合同**，或新增同等可信的 candidate record ledger。不得读取 V1 identity/profile/私有版面来补映射。
3. 六个已部署 `v2-shadow-*` 函数均无 consent `getStatus/accept`、owner `WITHDRAW/DELETE` 或 report 接口。`SyntheticPublicMapAuthorizationService` 是本机假实现，不能成为 TASK20 的真实 consent/withdraw/delete 正测。最低限度需要一个受 `getWXContext()`／shadow principal HMAC／空起始 allowlist 约束的 **shadow-only authorization/owner command 云端入口**，持久化授权版本和 owner 命令，并原子地产生 hide-first/outbox 与 no-resurrection 结果。这改变已冻结 6-function、9-collection 资源/安全边界；不能在本轮擅自把权限数据写入现有控制 collection，也不能改用 V1 资源。
4. 当前 shadow `PUBLIC=0`、read-stop 与 HA pause 均关闭，六函数四 flag=false、allowlist 空。即使只完成 public adapter，也没有可见 candidate 数据。TASK20 启动前需要在上述合同获批并验证后，用现有 shadow 资源准备**新** synthetic/approved test data，并按测试窗口短时开启入口；不能复活已退休公开行。

只读核对现有 `v2ShadowControlState` 中保留 2 条 R4 服务端可信登记审计行，均为 synthetic、含有效格式的不同 principal digest；登记票据已过期。可作为未来 A/B allowlist 绑定的候选来源，但本轮没有输出 OpenID、完整 digest 或 secret，也没有绑定 allowlist。复用前仍须核对当前 HMAC key 与测试账号/窗口，不重建 enrollment 入口。

## 3. 待 Founder 单独批准的最小差异范围（未实施）

| 层 | 需要的确切变化 | 资源/安全边界 |
| --- | --- | --- |
| 小程序 public read | 新增 candidate `PublicMapService` transport；`pages/home/index.ts` 的 `ensurePublicMapClient()` 改为 develop/trial 选真实 `wx.cloud.callFunction`，release/未知环境直接关闭；正式路径不再实例化 `SyntheticPublicMapService`。 | 只读现有 query/detail 函数，客户端不传可信 caller digest；需响应形状、错误、cursor、late response 本地/真机测试。 |
| 小程序 HA | 新增 candidate `HumanAssistanceService` transport；develop/trial 才绑定；release/未知环境继续空状态。同步修改前端版本过滤与服务端返回合同，使 shadow synthetic record/version 由服务端签发、可与候选上传记录核对。 | 至少更新既有 `v2-shadow-get-my-assistance`、可能更新 resolver 与合成 fixture/request schema；重新打包、hash、静态 allowlist 与云端源码 read-back。不得读 V1 private records。 |
| Candidate consent／owner | 提交**新的 exact resource contract** 后再授权：至少一个新 shadow-only authorization/owner command 函数、持久授权状态存放处及独立 fail-closed flag；该函数从服务端 WXContext 识别 owner，只操作 synthetic shadow resources，执行授权版本校验、幂等、hide-first/no-resurrection。 | 当前 frozen 6-function/9-collection/13-config diff 没有此入口或专用状态；是否新增 collection/index/config 与命名必须先冻结并独立批准，不可借用 V1、不可偷偷扩充既有 `v2ShadowControlState` 用途。 |
| Candidate report | 先让本机 synthetic report success 在 candidate 路径 fail-closed；若 TASK20 需要正向举报，则另提 shadow-only 持久接口的 exact diff。 | 不允许本机成功冒充云端成功。 |
| 试验数据/开关 | 完成上方接线与安全测试后，才用 existing shadow 资源准备新 synthetic candidate leads/HA/consent 数据；在单次设备窗口短时开启所需 flag、read-stop、HA pause 和 A/B allowlist，结束全恢复 false/空、PUBLIC=0、V1_DIFF=0。 | 本轮没有 config/data 写入，也没有正式 upload/review/publish。 |

上述表是**阻断差异范围**，不是可直接 apply 的最终云资源清单；其中新 authorization 函数/状态的名称、字段、索引、ACL、成本和 rollback 仍须形成 exact resource contract 并由 Founder 另行批准。若不批准这些变化，另一选择是明确缩小 TASK20 真机矩阵及候选授权/HA 目标；这会改变本轮命令要求，也需 Founder 决策。

## 4. 门禁与实际动作

- 当前 `TASK-V2-19 = IN_PROGRESS / CANDIDATE_RUNTIME_BINDING_BLOCKED`；**未** `COMPLETE / HUMAN_APPROVED`。`TASK-V2-20 = READY / NOT_STARTED`，TASK-V2-21—22 未开始。
- 本轮仅做代码/合同/CloudBase shadow 审计与文档记录；CloudBase 写操作=0，未打开 flag、未绑定 allowlist、未写 synthetic data、未部署函数、未做 migration/rollback/cleanup、未读 V1 private record、未改 V1 resource。
- TASK19 B2-R3 的 migration rehearsal/rollback、GEO/unique/outbox/安全负测与 B2-R4 Founder 接受的证据边界，仍分别以 `v2-e-task-19-phase-b2-r3-synthetic-rehearsal.md`、`v2-e-task-19-phase-b2-r4-trusted-caller-verification.md`、`v2-e-task-19-final-closeout.md` 为事实源；`SKIP`、B 正向回答、R4 真实 caller public query/detail 不改写成技术 PASS。
- A.5 的完整回归、六函数／9 collection／15 index／V1_DIFF 新一轮 read-back，以及 B 节真机矩阵均**未启动**：A.2 安全接线前置条件尚未满足。本轮无 commit/push/PR/merge/tag。
