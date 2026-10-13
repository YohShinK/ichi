# TASK-V2-19｜Phase B2-R4 Trusted Caller Verification：测试结束报告

执行日期：2026-09-27—28。唯一环境：`cloud1-d7gxqfwv783a1f131 / ap-shanghai`。Founder 批准本报告原第 2 节 exact diff 和第 3 节测试序列；A/B 两名真实微信测试账号通过独立开发版入口完成服务端登记，未手工提供 OpenID。Founder 于 2026-09-28 指示结束本轮，并表示认为测试可鉴别为全部通过。**技术证据结论为 `TEST_CLOSED / PARTIAL_VERIFICATION`**：已完成可信 caller 建立、A/B 各自可见请求、双向跨账号拒绝及 A 的三类正向回答；`SKIP`、B 的正向回答、projector 和 public query/detail 尚无完成证据，不能写作远端 PASS。结束时全部 shadow 入口已关闭，`V1_DIFF=0`；TASK-V2-19 仍 `IN_PROGRESS`。

第 1—4 节保留为 Founder 批准前的冻结差异和只读基线，文字中的“待授权／未执行”只描述当时状态。实际执行和最终 read-back 见第 5—8 节。

## 1. 只读 preflight 与停止原因

现有六个 `v2-shadow-*` 函数均回读 `BOUNDARY=synthetic_only`、四个 `*_ENABLED=false`、`ICHI_V2_SHADOW_TEST_CALLER_DIGESTS` 为空、timeout=3 秒。`v2-shadow-get-my-assistance` 的远端 `codeSha256=1ac84721b6e8e32c8511484ab365f7032a1cfede71ca593dbcc8bb0ba0ce4ad0`，与 B2-R2 报告一致。shadow `global:read-stop.stopped=true`、`global:read-epoch.epoch=3`，`global:ha-pause` 尚不存在；B2-R3 结束时公开 `PUBLIC=0`。

身份链现状：`shared/security.mjs` 仅在云函数内读取 CloudBase `getWXContext()` 的 `APPID/OPENID`，用既有 principal HMAC key 得到 digest，再与函数级 allowlist 逐项常数时间比较。客户端传入的 `callerDigest/accountId` 不被用作授权。`get-my` 在 HA flag 为 false 时直接拒绝；即使打开 HA flag，只要 allowlist 为空，也只能得到 `SHADOW_TEST_CALLER_DENIED`。当前六个函数均没有可供 A/B **先登记其可信 digest** 的受控入口。小程序客户端无法调用服务端 `getWXContext()`，也不能由请求体自称 OpenID。不得借用 V1 identity/profile collection 或 V1 function 建立映射。

因此，仅新增本地 UI、扫码、打开现有 flags 均不能建立 A/B allowlist。Founder 已明确要求不由 A/B 手工提供 OpenID，也不从 V1 数据反查。最小受控路径是在现有 shadow 函数增加短时 enrollment 分支：**服务端**从 `getWXContext()` 取得 APPID/OPENID、计算 digest、写入既有 `v2ShadowControlState`，仅向当前小程序返回随机登记票据；管理员凭票据只读回查 shadow 控制记录，再把服务端 digest 绑定至既有 allowlist。客户端和测试人员都不提供或接收 OpenID/digest。这改变了已冻结的函数代码/安全边界和 13 项 config contract。根据 Founder 的明确停止条件，**本轮先提交以下 exact diff，未执行变更**。

## 2. 已获 Founder 授权的 exact local/code/config diff（批准前快照）

| 类别 | 精确变更 | 初始/结束状态 | 安全约束 |
| --- | --- | --- | --- |
| 现有函数代码 | 仅 `v2-shadow-get-my-assistance` 新增 `event.action === "ENROLL_TEST_CALLER"` 分支；普通 HA 路径保持原先 fail-closed 行为。候选源为 `packages/v2-map/resources/shadow-functions/v2-shadow-get-my-assistance/runtime.mjs`。 | 未构建／未部署；部署前须生成 zip、记录 SHA-256、与待批准 artifact 逐项比对。 | 分支只能在 `BOUNDARY=synthetic_only`、新 enrollment flag 为 `true`、未到期、CloudBase `getWXContext()` 的 `APPID=wx4e40b1657ca4563d` 且 `OPENID` 有效时，计算当前 caller digest 并写入既有 shadow control collection；只返回随机票据，不返回 APPID/OPENID/digest，不读 V1 数据。 |
| 共用安全源码 | `packages/v2-map/resources/shadow-functions/shared/security.mjs` 抽出复用现有 HMAC derivation 的可信 digest helper；`deriveTrustedCaller` 的 allowlist 授权结果与错误语义不变。 | 只进入上述一个新 artifact；其余五个云端函数不更新。 | 不能采用请求体 `callerDigest`、不能改 allowlist 比较或 principal HMAC key。 |
| 既有 shadow 数据 | `v2ShadowControlState` 为 A/B 分别新增 `kind=TEST_CALLER_ENROLLMENT`、`subjectDigest=<服务端 HMAC digest>`、`windowKey=phase-b2-r4`、`expiresAt=<短时截止>`、`dataOrigin=SYNTHETIC_REHEARSAL` 的管理端可读记录，`_id=caller-enroll:<随机票据>`。 | 测试结束标记过期并保留审计，不 cleanup；现有 `kind_subject_window` unique 与 `expiresAt` 普通索引不变。 | collection 仍 `ADMINONLY / SERVER_ONLY`；客户端只能得到票据，无法直接读行或列举 digest；同一可信 caller 的重复登记按现有 unique index 幂等处理，其他票据不自动进入 allowlist。 |
| 新函数级 config ① | `ICHI_V2_SHADOW_CALLER_ENROLL_ENABLED`，仅绑定 `v2-shadow-get-my-assistance`。 | 初始及结束 `false`；测试收集 A/B digest 时短时 `true`。 | 缺失/空/false 一律拒绝。 |
| 新函数级 config ② | `ICHI_V2_SHADOW_CALLER_ENROLL_EXPIRES_AT`，仅绑定 `v2-shadow-get-my-assistance`，UTC ISO 8601。 | 初始及结束空；测试期间设置不超过 10 分钟的到期时间。 | 缺失、无效或过期一律拒绝；由云端时间判断，不信任客户端时间。 |
| 本地独立测试入口 | 新建 `tests/fixtures/v2-shadow-trusted-caller-miniapp/` 下的独立 WeChat mini-program 测试工程（`project.config.json`、`app.ts`、`app.json`、`pages/rehearsal/index.ts/.wxml/.wxss/.json`、README）。使用同一 AppID 与既有 CloudBase env。 | 只构建/扫码开发版或体验版；不修改正式 `apps/client/miniprogram/app.json`，不进入正式小程序包。 | 客户端仅在 `envVersion=develop/trial` 显示并调用入口；release 一律拒绝。此客户端限制不作为服务端身份凭据。 |

新增云端资源：**0 collection / 0 index / 0 function / 0 Storage / 0 trigger / 0 ACL / 0 环境级规则**。新增函数级 config：**2 个**；仅更新**一个既有 shadow 函数代码**。沿用现有 principal HMAC key，不生成/回显新 secret；也不变更其他五个函数代码或 V1 资源。代码变更仍属于安全边界变更，需要 Founder 单独批准。

## 3. Founder 批准的精确测试序列（批准前快照）

1. 在本地实现并测试上述独立入口、enrollment 分支、fail-closed/过期/错 APPID/缺 OPENID/伪造 digest/重复登记负测，重跑 artifact 静态 allowlist、包内文件/hash、Prettier、workflow、TypeScript 与相关 Vitest。先采集 V1/六函数只读基线。只部署获批的 **一个**新 `get-my` artifact，初始 enrollment flag=false、其余四 flag=false、allowlist 空；下载包回读并核对源码/runtime/package/hash。
2. 仅短时设置 enrollment flag=true 与 UTC 到期时间。A/B 分别用真实微信账号扫码独立开发/体验测试工程，调用 `ENROLL_TEST_CALLER`；服务端从真实 `APPID/OPENID` 计算 digest 并写入两条 `v2ShadowControlState` 登记记录，只把各自的随机票据返回设备。管理员按设备票据只读回查这两条 shadow 记录，确认两个不同 digest；不读取 V1 identity/profile，不向客户端或报告输出 OpenID、HMAC key 或完整 digest。收齐后立即关闭 enrollment flag、清空到期时间。
3. 管理端将两条服务端 digest **仅**写入 `v2-shadow-get-my-assistance`、`v2-shadow-answer-assistance`、`v2-shadow-query-public-map-leads`、`v2-shadow-get-public-map-lead-detail` 的既有 `ICHI_V2_SHADOW_TEST_CALLER_DIGESTS`。resolver/projector 不开放 caller allowlist。创建/更新已有 `v2ShadowControlState` 的 `global:ha-pause` 为 synthetic `paused=false`；为 read 正测将 `global:read-stop` 暂设 `stopped=false` 并更新 epoch。只用新合成 fixture 为 A 建立四个有效 HA request，另为 B 建立隔离请求；只用新合成投影产生公开 lead，不重开 B2-R3 已隐藏/退休的行。
4. 分阶段打开现有 HA/read flags。A 分别完成 `SAME_BOARD / DIFFERENT_BOARD / CANNOT_TELL / SKIP` 正测与 duplicate 幂等；B 对 A request 应返回拒绝，A 对 B request 同理。A/B 的 query/detail 正向调用必须来自真实 `wx.cloud.callFunction`。在请求体加入伪造 `callerDigest/accountId`，确认服务端仍只按各自真实 WXContext 授权；核对公开字段白名单、分页/cursor、无 V1 数据访问。所有观察仅限 synthetic shadow。
5. `finally` 停机：四 flag 全 false、四函数 allowlist 清空、enrollment flag=false/到期时间清空、`global:ha-pause.paused=true`、`global:read-stop.stopped=true`、公开 synthetic 行 `PUBLIC=0`、epoch 增量、无 resurrection；回读六函数/配置/代码 hash、shadow 资源和 `V1_DIFF=0`。不 cleanup、不开始 TASK-V2-20。

第 3—5 步涉及**现有** shadow function config 和 synthetic control/data 的临时写入，是 R4 已请求的测试动作；第 2 节的两个新 config、现有 control collection 的 enrollment 写入能力及代码安全边界变更仍需先获 Founder 单独授权。A/B digest、随机票据、fixture ID、过期时间和最终新 artifact hash 必须在真实身份建立/本地构建后才会产生，不能预先编造。本轮不产生这些值。

## 4. 本轮证据与状态

只读复核 V1 13 collection／43 index 的结构与 ACL、19 function 的稳定字段、环境函数规则、Storage 根 2 项以及 collection/function 名单。一次并行函数详情比较短暂报告 `delete-my-account` 不一致；随即对该函数单独及全部 19 个函数重读，均与 B2-R3 基线完全一致。最终稳定 read-back 为 `V1_DIFF=0`，本轮 CloudBase 写操作=0。

本节是 2026-09-27 批准前状态记录。最终状态以第 8 节为准。

## 5. 本地 artifact、部署与真实账号登记

仅更新现有 `v2-shadow-get-my-assistance`。本地可部署包为 `packages/v2-map/resources/shadow-functions/artifacts/b2-r4/v2-shadow-get-my-assistance.zip`，SHA-256 为 `ad193cbc00074ef5500643b1b46430ceb574bf012e6e634e4c7711c94f228681`。部署前再次计算并与 manifest 完全一致；静态扫描固定三个允许的 shadow collection、禁止动态 collection／V1 function／Storage／日志泄露，且 enrollment 与原 HA 入口均 fail-closed。两项定向测试共 8 个用例通过，最终 shadow shared 测试为 6 文件／37 用例通过；独立小程序 TypeScript、相关 ESLint、Prettier、workflow、`git diff --check` 通过。微信开发者工具 CLI 生成开发预览包；它不进入正式小程序包。

首次 `updateFunctionCode` 因本地 staging 目录少函数名子目录而在打包前失败；修正 staging 路径后，只对该一个现有函数成功更新。远端 `Active / Nodejs20.19 / index.main / timeout=3`，下载包中的 14 个批准源码文件与本地 zip 逐字节一致；平台含依赖整包 `codeSha256=971a49b6236694f539befbf51addc1d695f8c64303e0623c65a5f3f41abfcc38`。只在该函数新增 `ICHI_V2_SHADOW_CALLER_ENROLL_ENABLED` 和 `ICHI_V2_SHADOW_CALLER_ENROLL_EXPIRES_AT`；初始值分别为 `false`、空字符串。其余五个函数未部署新代码。

短时开启登记后，A/B 分别在真实微信账号的开发预览小程序调用 `ENROLL_TEST_CALLER`。服务端 `getWXContext()` 得到 APPID/OPENID 并用既有 shadow-only principal HMAC 生成两个**不同**的 digest；两条 `TEST_CALLER_ENROLLMENT` 记录保存在既有 `v2ShadowControlState`。客户端仅收到随机票据；管理员按票据读 shadow 控制记录绑定 digest 到四个现有 shadow 函数的测试 allowlist。未从请求体、V1 `wechatIdentities`、V1 profile 或其他 V1 private record 获取身份；未在报告中记录 OpenID、完整 digest 或 HMAC secret。登记结束立即将新 flag 设回 `false`、到期配置清空。

一次管理端伪造事件调用返回 B 的重复登记票据，说明该调用具有不能独立归类的 CloudBase WXContext；**不将它记为无身份负测通过**。可信主体证明仅采用 A/B 实际小程序调用、服务端记录和跨账号探针的联合证据。

## 6. 合成数据和实际测试结果

只向既有 shadow collection 写入 10 条全新合成 fixture、5 个对应合成 board instance、5 条 HA request，以及既有控制状态；隔夜会话过期后，仅对这 5 条请求和 10 条 fixture 延长测试到期时间。另一个用于补测 `SKIP` 的本地候选 fixture **未写入云端**。没有复制或读取真实 V1 private record。

| 检查 | 证据 | 结果 |
| --- | --- | --- |
| A/B 可信登记 | 两张随机票据只读回查到两条 `SYNTHETIC_REHEARSAL` shadow 记录，digest 不同；登记后 flag 关闭 | PASS |
| 本人请求隔离 | A/B 从开发预览小程序分别报告 `A=4`、`B=1`；对应五条 shadow request 的 owner digest 分属 A/B | PASS，设备回报 + 服务端数据 |
| 跨账号与请求体身份伪造 | A/B 各输入对方合成 request ID，客户端同时附带伪造 `callerDigest/accountId`，两人均报告 `REQUEST_UNAVAILABLE` | PASS，设备回报；没有将管理端调用代替此证据 |
| A 的 `SAME_BOARD` | request `ha:cb415d5117c7f9613e847add3410e7d91f4d7626` 回读 `ANSWERED`，证据和 `PENDING` outbox 存在 | PASS |
| A 的 `DIFFERENT_BOARD` | request `ha:3fd91a8b3d4ffb692ea99c78423bc64e50b38751` 回读 `ANSWERED`，证据存在 | PASS |
| A 的 `CANNOT_TELL` | request `ha:494f56d19ef8e1a99597f3c75da3aa220e2989f7` 回读 `ANSWERED`，证据存在 | PASS |
| 重复提交幂等 | A 在测试入口看到 `duplicate=true`；CloudBase request/证据只有各答案对应的一份 | PASS，设备回报 + 持久化回读 |
| `SKIP` | 预留的 A-skip 卡片实际被回答为第二条 `CANNOT_TELL`；补测候选未上云 | **NOT RUN** |
| B 的正向回答 | B 的隔离 request 结束时仍 `PENDING` | **NOT RUN** |
| projector、public query/detail、GEO、cursor | A 的 `SAME_BOARD` 产生 `PENDING` outbox；projector/read flag 未开启，`PUBLIC=0`，没有客户端公开读取 | **NOT RUN in B2-R4**；B2-R3 历史演练证据不能替代本轮真实 caller 正测 |

Founder 指示在上述状态结束并表达“本测试可鉴别为全部通过”。这是一项 Founder 判断；本报告的技术 PASS 仅用于表中已实际观测的检查，不把未运行项改写为已验证。

## 7. 停机与 V1 零差异 read-back

结束后六个函数逐项回读 `BOUNDARY=synthetic_only`、四个 `READ/RESOLVE/HUMAN_ASSISTANCE/PROJECTOR_ENABLED=false`、caller allowlist 空、`Active / Nodejs20.19 / index.main / timeout=3`；get-my 新 enrollment flag=`false`、expiry 为空。三个 shadow-only HMAC secret 仅确认在应绑定函数中**存在**，不回显值或摘要。六个函数均无 trigger；新增 collection/index/function/Storage/trigger/ACL/环境级规则为 0。

`global:ha-pause.paused=true`、`global:read-stop.stopped=true`、`global:read-epoch.epoch=4`（从 3 增量）；公开 `PUBLIC=0`。A 的 outbox 保留 `PENDING` 作为合成审计数据，projector 关闭，未做 migration、rollback mutation 或 cleanup。新测试数据和历史 rehearsal 数据均未删除。

| Shadow function | 最终远端平台 `codeSha256` |
| --- | --- |
| `v2-shadow-get-my-assistance` | `971a49b6236694f539befbf51addc1d695f8c64303e0623c65a5f3f41abfcc38` |
| `v2-shadow-answer-assistance` | `879a8de635c0354fa583000f5583d25307576ced7dffcb8592e4002fd3457d37` |
| `v2-shadow-query-public-map-leads` | `7ed613af2cc63be0f2d4d43401269f78d409b04c49932fb2cbcf4219dca2ecda` |
| `v2-shadow-get-public-map-lead-detail` | `fe54b0219d19c5611d27209663cc71d1d164cb419e3c788e51b3d384b80314aa` |
| `v2-shadow-resolve-observation` | `6f06005522022e894de9d831707d45ffecc396894926382775efeb46e41a2fda` |
| `v2-shadow-reconcile-projection` | `01d146011971fc75a3e0ebe269f1ececdf22c063e18b6fb7ae079c3afb43cd65` |

最终与执行前基线比较：V1 13 collection／43 index 的**结构定义**、13 ACL、19 function 的稳定配置/代码字段、V1 collection/function 名单、环境函数安全规则及 2 个 Storage 根项均相同。索引使用计数、占用大小和列表顺序是动态统计，已从结构比较中剔除；`V1_DIFF=0`。未读取 V1 业务记录，未修改 V1 collection/function/index/config/Storage/trigger/ACL。

## 8. 状态与后续边界

`TASK-V2-19 = IN_PROGRESS / PHASE_B2_R4_TEST_CLOSED_PARTIAL_VERIFICATION`。本轮按 Founder 指示停止，不继续补测，不自行标 `COMPLETE/HUMAN_APPROVED/FROZEN`，不开始 TASK-V2-20。`SKIP`、B 正向回答和真实小程序 public query/detail 仍缺技术证据；如以后需要把这些检查标成 PASS，须在新的授权测试窗口完成并重新执行全套停机与 `V1_DIFF=0` 回读。
