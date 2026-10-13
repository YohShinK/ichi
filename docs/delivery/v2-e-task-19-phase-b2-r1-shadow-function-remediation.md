# TASK-V2-19｜Phase B2-R1 Shadow 函数本地修复与 artifact 审核包

状态：`IN_PROGRESS / PHASE_B2_R1_READY_FOR_ARTIFACT_DEPLOY_REVIEW`。目标环境只限 `cloud1-d7gxqfwv783a1f131`。本报告记录**本地候选**，不是远端部署或 synthetic rehearsal 的通过证据。

## 1. 阻断来源

Phase B2 只读 preflight 报告 `v2-e-task-19-phase-b2-synthetic-rehearsal.md` 发现：B1 已部署的六个函数仍是只读骨架；旧 Human Assistance／public read 从请求体 `callerDigest` 判断身份，可伪造。四个 shadow feature flag 远端仍为 `false`，九个 shadow collection 为空，因此没有开启不安全入口，也没有演练写入。

## 2. P0/P1 本地修复

P0 的新候选从 CloudBase `cloud.getWXContext()` 的 `APPID`、`OPENID` 派生主体，只接受服务器 HMAC digest 命中测试 allowlist；请求体的 callerDigest、accountId、ownerSubjectDigest 被忽略。server rehearsal capability 和公开 cursor 分别用独立 HMAC，比较使用时序安全函数。P1 的新候选包含持久 resolver、HA、outbox/projector、公开查询与详情，复用已批准的 BoardInstance、verification、projector 与 PublicMapService reference。**远端 P0/P1 在新包经单独授权部署与回读前仍未关闭。**

## 3. 修改文件和边界

六个源码目录位于 `packages/v2-map/resources/shadow-functions/v2-shadow-*/`；共用安全／DB／synthetic fixture／公开读取模块位于同目录 `shared/`。新增 `scripts/build-v2-shadow-artifacts.mjs` 与重写的 `scripts/validate-v2-shadow-artifacts.mjs`。新 hash 清单位于 `packages/v2-map/resources/cloudbase-shadow-function-artifacts-b2-r1.json`；原 `cloudbase-shadow-function-artifacts.json` 按 B1 回读报告恢复为 Phase A 历史 hash ledger。**zip 路径现已由 B2-R1 包占用，不能拿 Phase A ledger 的旧 hash 校验当前本地 zip**；B1 远端只读回执仍以 shadow resource diff 报告为准。本轮没有改 V1 manifest、CloudBase 资源或正式小程序后端绑定。

## 4. 可信 caller 与 capability

微信小程序调用 Cloud Function 的可信上下文使用平台提供的 `APPID`、`OPENID`；管理端或缺少该上下文的调用直接拒绝。主体 digest = shadow principal key 对带域分隔符的 APPID／OPENID 做 HMAC-SHA256；只保存/比较 opaque digest。独立 rehearsal token 带环境、purpose、函数 audience、nonce、签发和到期时间，HMAC 验签后在 `v2ShadowControlState` 原子消费 nonce；重放、过期、错 purpose、无密钥均拒绝。cursor 的 tag 使用另一把 HMAC key，失败时不访问快照。函数不记录 secret、原始可信身份或可恢复主体信息。依据 [CloudBase 小程序云函数上下文文档](https://docs.cloudbase.net/recipes/add-cloud-function-wechat-miniprogram)；真实调用上下文仍须 B2-R2 远端验证。

## 5. 六个函数实现

| 函数 | B2-R1 本地候选能力 |
| --- | --- |
| `v2-shadow-resolve-observation` | 只接受签名指向的 synthetic fixture；VerifiedBoard→GEO 候选→保守判定，候选满额／无效时拒绝；持久 instance、版本化 association、HA request 和 outbox。 |
| `v2-shadow-get-my-assistance` | 仅服务端派生 owner 可见的 pending/current/未过期请求；返回 request ID 与两张结构化比较卡，不输出内部 ID／坐标。 |
| `v2-shadow-answer-assistance` | 四类答案；ownership／版本／到期检查；SAME 重新运行单候选 resolver 且不越过硬冲突；DIFFERENT 留负向版本化 decision；CANNOT_TELL／SKIP 不捏造身份真相；重复回答幂等。 |
| `v2-shadow-reconcile-projection` | 签名 outbox ID、顺序检查、compare-and-advance、退避重试、迟到丢弃、公开字段白名单、hide-first、退休 ID 防复用、read epoch 快照失效。 |
| `v2-shadow-query-public-map-leads` | 服务端主体／持久 read-stop 与 rate、CloudBase GEO Polygon + 精确 bbox、50/页／500 快照／120s、HMAC cursor、当前可见性复查与 reference 公开序列化。 |
| `v2-shadow-get-public-map-lead-detail` | opaque publicLeadId、服务端主体／持久 rate 与 read-stop、最新版本可见性复查、reference detail 白名单；隐藏／退休返回不可用。 |

## 6. 写入、transaction 与幂等边界

只写 frozen allowlist 的 `v2Shadow*` collection。capability nonce、rate、HA budget/cooldown、association head、instance/outbox/projector 通过 `runTransaction` 的固定 `.doc()` ID 读写；不在 transaction 中做 `.where()`。`v2ShadowAssociationDecisions` 以 `observationVersionId + decisionVersion` 追加，`v2ShadowControlState` 的 head 只指向最新版本；已批准 unique index 与 transaction 一同约束并发。`v2ShadowHumanAssistanceRequests.observationVersionId` 的 unique index 与确定性 ID 限制 once-per-upload。地理位置只生成候选，绝不单独作为身份相等证明。GEO 候选读取与事务间的实际并发行为尚待远端故障注入；本地 mock 不构成 CloudBase 隔离级别证明。

## 7. Human Assistance behavior

no-request 返回空列表；expired、answered、withdrawn/deleted、version-changed 不展示/不接受。SAME、DIFFERENT、CANNOT_TELL、SKIP 与重复提交均有本地测试。cooldown／budget／窗口机制在 policy 缺失时 fail closed，数字仅为测试输入：`CANDIDATE_TEST_ONLY / PILOT_CALIBRATION_REQUIRED`，未冻结产品参数。正式小程序上传成功态及「我的 → 我上传的版面」入口沿用已完成的本地 coverage correction；HA 失败／跳过不影响 V1 upload success，仍未连真实 shadow 服务。

## 8. Projector／outbox

resolver 与 answer 使用相同的 `outbox:<40 hex>` ID 规则；projector 检查 `eventSequence` 连续与现有 instance 版本，迟到事件丢弃。创建／推进只写公开安全字段；退役先隐藏旧 serving row，再写 tombstone，并提升 `global:read-epoch` 使旧 cursor 无效。新 ID 若撞到历史 v1 serving row 即拒绝，不能复活已退休 ID。retry 使用有界指数退避；本地覆盖创建、顺序缺口、瞬时事务失败、退休、epoch、碰撞。

## 9. Public query／detail

公开读取必须看到显式 `global:read-stop.stopped=false` 与 `global:read-epoch`，缺失即关；每主体每分钟的 query/detail 预算在 ControlState 中持久计数。查询使用 CloudBase `Geo.Polygon([Geo.LineString([...])])` 与 `geoWithin`，再做精确 bbox 判断；该构造符合 [CloudBase GEO API](https://docs.cloudbase.net/api-reference/webv1/database)。快照保存最多 500 个公开引用，50 条／页、120 秒有效；每页重新查当前 serving row，epoch 或 read-stop 变化即拒绝。输出由现有 `PublicMapService` 白名单产生，不联查私有表。没有执行远端 GEO 运行时/索引性能测试。

## 10. 安全负测

已测 forged digest/account、A 读/答 B、缺失 secret/context/allowlist、无效签名、重放、错 purpose、过期 capability、损坏 cursor、过期／epoch 失效快照、read-stop、隐藏详情和私有字段泄漏；均 fail closed。静态扫描额外拒绝动态 collection 名、V1 资源、Storage API、函数调用和日志 API。测试没有把本地 mock 当作远端权限证明。

## 11. 12 个 BoardInstance 场景

独立 `board-instance-matrix.test.mjs` 12/12 通过：无候选、唯一延续、同地双实例歧义、不同 IP、数量增加、数量不变、null→0、0→1、同时间、迟到、schema 不同、VerifiedBoard 版本过期。持久层另测 NO_MATCH→UNIQUE_MATCH、同地歧义、Human DIFFERENT 后重新判定及 append-only decision；没有把位置当身份真相。

## 12. V1 regression

全量 Vitest 包括既有 V1／小程序／V2 测试；本轮没有修改 V1 CloudBase manifest、V1 函数、资源或正式后端绑定，也没有调用 CloudBase 写 API。远端 V1 read-back 仍以 B1 完成报告为历史基线，本轮没有新的云端 mutation，因此不声称新增远端 diff read-back。

## 13. 自动验证

ESLint 全仓 PASS（原 7 个 lint 问题清除）；根与 Web TypeScript PASS；全量 Vitest 93 文件／981 测试通过、1 文件／1 测试跳过；Next.js production build PASS。六包静态校验和 zip 内可执行模块 import PASS；Prettier／workflow／diff-check 在本报告最终修订后复跑。真实 CloudBase 函数调用、GEO/index、事务并发、正式小程序接线以及人工视觉验收未执行。

## 14. 六个新 artifact SHA-256

以下 hash 只对应**未部署的 B2-R1 zip**；部署前必须逐字复核，任何差异立即停止。运行时 Nodejs20.19，入口 `index.main`，源码版本 `v2-19-b2-r1-local`。

| Function / zip（相对 `packages/v2-map/resources/shadow-functions/artifacts/`） | SHA-256 |
| --- | --- |
| `v2-shadow-query-public-map-leads.zip` | `0e96dc89951cf425fd9f8f361f16c645c228a4f3a45f823120de4621ffc036bc` |
| `v2-shadow-get-public-map-lead-detail.zip` | `7cf7f42d3d23a18fc6429b4730a0ca69bf4ce6684bfa7ccaf640b73ba542a47a` |
| `v2-shadow-resolve-observation.zip` | `95434faa8422fb4709cb9482c0037d8e171f0950b14e0225f06636f1d1d0ce34` |
| `v2-shadow-get-my-assistance.zip` | `b6c00fbf455a4e0b54322e0afcfaca4dca887da67f290b67c72305eeed5eea13` |
| `v2-shadow-answer-assistance.zip` | `90b9ed7c91dec9385acb6d61bc5f560b28015800da411b3e979134165bc3b908` |
| `v2-shadow-reconcile-projection.zip` | `e040c45f8663fdfcbffcf4f18d00edcd6aed8ada1199ec74aef9f66f04b6c616` |

## 15. Static allowlist／leakage scan

`node scripts/validate-v2-shadow-artifacts.mjs` 对六包逐个验证 SHA-256、Node runtime/SDK、入口、feature flag 与 synthetic 边界、所有 `.collection()` 字面量在对应 function exact allowlist 内、无动态 collection／V1／Storage／跨函数调用／console 泄漏，并解包 import 编译后的 reference module。六包全 PASS；逐函数实际 collection 集合保存在 validator 输出，可由新 manifest 中的合同名单交叉核对。

## 16. 当前 P0/P1 与证据限度

本地源代码层 P0/P1 已修复并通过自动门；远端仍运行旧 B1 骨架、四个 flags=false、allowlist 空，**未**关闭真实 CloudBase P0/P1。事务冲突、GEO 排序/规模、函数环境身份字段、真实 secret binding、远端依赖安装与回读均需 B2-R2 授权后验证。任何一项不符即停，不打开入口。当前不宣称 B2 synthetic rehearsal、migration 或 rollback 通过。

## 17. 尚未执行的云端动作

本轮没有更新部署函数、没有 config/secret write、没有创建或写入 collection/index/fixture/control row、没有启用 flag/allowlist、没有 synthetic rehearsal、rollback mutation、cleanup 或 V1 资源变更；也没有 commit/push/PR/merge/tag。九个 shadow collection 仍以 B2 preflight 的空数据记录为最后一次远端证据，本轮未重查。

## 18. 下一步 exact deploy action list（待 Founder 单独批准）

1. 仅只读核对环境 ID、六个远端 B1 function 当前 hash/config、9 collection/15 index ACL 和 V1 13 collection／19 function 基线；偏差即停。
2. 对上表六个 zip 逐项重新计算 SHA-256 并与本报告、新 manifest 完全匹配；不匹配即停。
3. 仅对六个现有 `v2-shadow-*` function 执行代码更新部署，不添加 function/trigger/layer、collection/index/Storage，也不修改 V1。Nodejs20.19、`index.main` 保持。
4. 函数级 shadow-only secret binding 需覆盖：cursor→query/detail；principal→query/detail/get-my/answer；rehearsal→resolver/projector。B1 现有绑定不覆盖全部新依赖；R2 须单独授权**在内存轮换并重新绑定三把 shadow-only key**，只报告存在/校验状态、不回显值。四个 flags 仍 `false`、allowlist 仍空；HA policy/cooldown/budget 仍未配置。
5. 从远端只读下载六包，核对根入口／runtime／package 与审核 zip 一致、远端安装依赖后的整包 hash 与平台 codeSha256 一致；回读所有 flag=false、secret existence 与 V1 baseline diff=0。任何失败不启用入口。
6. 后续 synthetic fixture、read-stop/epoch/HA-pause control row、测试 allowlist、policy、capability 签发、真实调用、migration rehearsal、rollback mutation 均属**另行授权的 B2 rehearsal**，不由函数部署授权隐含。密钥若无法安全给 rehearsal issuer 使用，则 server-only 调用保持关闭，不以客户端自报 capability 替代。

本轮止于 `TASK-V2-19 = IN_PROGRESS / PHASE_B2_R1_READY_FOR_ARTIFACT_DEPLOY_REVIEW`；不得 `COMPLETE/HUMAN_APPROVED/FROZEN`，TASK-V2-20 未开始。等待 Founder 审核 artifact 与 SHA-256，再决定是否批准 B2-R2。
