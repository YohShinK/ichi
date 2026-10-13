# TASK-V2-19｜Candidate runtime exact cloud diff（待 Founder 单独批准）

> **SUPERSEDED / DO NOT DEPLOY（2026-09-28）**：本文件的单 owner `v2ShadowContributionAuthority`、`owner:<publicLeadId>`、`ACCEPT`、`WITHDRAW` 提案已被 Founder 的多贡献者／上传 lineage 决策废止。仅作历史证据；新的待批合同见 `v2-e-task-19-candidate-resource-exact-diff-v2.md`。

日期：2026-09-28。环境仅限 `cloud1-d7gxqfwv783a1f131 / ap-shanghai`。本文件是**本地候选提案，不是云端写入授权**；`autoApply=false`。机器可读合同为 `packages/v2-map/resources/cloudbase-candidate-runtime-resource-proposal.json`，可部署包清单为 `packages/v2-map/resources/cloudbase-candidate-runtime-artifacts.json`。

## Pre-state / 本轮只读核对

- 当前 13 个 V1 + 9 个 `v2Shadow*` collection，19 个 V1 + 6 个 `v2-shadow-*` function；九个 shadow ACL 均 `ADMINONLY`，15 个显式 shadow index 与既有合同一致。六函数 `Active / Nodejs20.19 / timeout 3s / 0 trigger`。现有四个 shadow feature flag=false，测试 caller allowlist 为空；HMAC 只核对绑定存在，不读取或回显值。
- 现有 source fixture 仅 synthetic/rehearsal。正式小程序的本地候选接线尚未在真实 CloudBase 演练。本轮没有 CloudBase mutation；本轮尚未重新生成完整 V1 baseline diff，因此 `V1_DIFF=0` 仅有此前 final-closeout 历史证据，不能当作本轮 read-back。

## 精确新增资源

| 类型 | exact name / field | 用途与边界 |
| --- | --- | --- |
| Collection | `v2ShadowContributionAuthority` | `ADMINONLY / SERVER_ONLY`；只存 synthetic/rehearsal 的授权版本、服务器派生 owner digest 与公开贡献控制状态；客户端 DB 读写禁止，V1 production resource read=`NO`。无 TTL。 |
| 文档 A | `_id=authorization:<server-derived-principal-HMAC-digest>`；`kind=AUTHORIZATION`、`ownerSubjectDigest`、`acceptedVersion`、`acceptedScopeDigest`、`acceptedAt`、`firstActionId`、`dataOrigin=SYNTHETIC_REHEARSAL` | 只由 `getWXContext()` 可信调用身份建立；记录当前授权版本和一次性操作审计。 |
| 文档 B | `_id=owner:<opaque 32-hex publicLeadId>`；`kind=OWNER`、`ownerSubjectDigest`、`publicLeadId`、`boardInstanceId`、`observationVersionId`、`fixtureId`、`title`、`lifecycle=ACTIVE\|WITHDRAWN\|DELETED`、`noResurrection`、`publicHideIntent`、`lastCommandId`、`updatedAt`、`dataOrigin=SYNTHETIC_REHEARSAL` | 服务端签发 owner capability 与撤回/删除 tombstone；`title` 仅公开安全的 boardShortLabel。 |
| 显式 index | `v2ShadowContributionAuthority / kind:1, ownerSubjectDigest:1 / ORDERED / unique=false / NORMAL_NO_AUTO_TTL`，name=`kind_ownerSubjectDigest` | 按可信主体列出本人 owner capability；不得查询 V1 identity/profile。 |
| Function | `v2-shadow-manage-contribution`；`Nodejs20.19`、`index.main`、timeout 10s、0 trigger/layer | `GET_STATUS / ACCEPT / OWNER_COMMAND`。固定 collection allowlist：`v2ShadowControlState`、`v2ShadowContributionAuthority`、`v2ShadowSourceFixtures`、`v2ShadowAssociationDecisions`、`v2ShadowBoardInstances`、`v2ShadowPublicMapLeads`、`v2ShadowProjectionOutbox`。无 V1 function call / V1 Storage access。 |

新函数仅配置：`ICHI_V2_SHADOW_BOUNDARY=synthetic_only`；`ICHI_V2_SHADOW_CONTRIBUTION_ENABLED=false`（缺失亦 fail closed）；`ICHI_V2_SHADOW_TEST_CALLER_DIGESTS=""`；`ICHI_V2_SHADOW_PRINCIPAL_HMAC_KEY` 只绑定**现有 shadow-only secret**，不生成新 secret、不回显值。现有四个 flag 继续 false，现有函数配置不改。HA policy/cooldown/budget 不新增或冻结数值，仍为 `CANDIDATE_TEST_ONLY / PILOT_CALIBRATION_REQUIRED`。

## 精确更新的现有 shadow function 与 artifact

| 操作 | Function / local zip | SHA-256 | 变化 |
| --- | --- | --- | --- |
| 更新 | `v2-shadow-get-my-assistance`：`packages/v2-map/resources/shadow-functions/artifacts/candidate-runtime/v2-shadow-get-my-assistance.zip` | `3de2485254ed4b4425a11580137a988ae48d712b3ff36791b3e548b597a64c1d` | 只在通过可信 caller、request、当前 synthetic fixture/version 检查后返回 server-derived `candidateRecordRef` 与 `observationVersion`；固定既有 collection allowlist。 |
| 更新 | `v2-shadow-reconcile-projection`：`packages/v2-map/resources/shadow-functions/artifacts/candidate-runtime/v2-shadow-reconcile-projection.zip` | `4fab3b8323913f0de5a7789677fb4d49a354e9aab82dfeec119dc1cbaad7d67a` | 额外读取授权 ledger 才允许候选公开投影；写 owner capability，阻止 owner 冲突和已删除贡献复活。新增访问的唯一 collection 是上述新 shadow collection。 |
| 新增 | `v2-shadow-manage-contribution`：`packages/v2-map/resources/shadow-functions/artifacts/candidate-runtime/v2-shadow-manage-contribution.zip` | `56f72569982e4b69544875e846485ac27838f8cf17e8f56898fd6dc4d1cbc38b` | 可信授权状态、接受、本人当前 synthetic fixture 的历史补投影 outbox、owner 撤回/删除候选实现；默认关闭。 |

部署前必须逐包重算 SHA-256 并与本表及 manifest 一致；不一致立即停止。CloudBase SDK 安装可能使下载整包字节不同，read-back 须比较源码、runtime、package、函数 config、secret **存在状态**与 SDK 安装后包的可解释差异，不能把预上传 zip SHA 冒称远端整包 SHA。

## Resource / config / secret / V1 diff

- 新增 **1 collection + 1 显式 index + 1 function**；更新 **2 现有 shadow function**；新函数绑定 **1 把既有 shadow-only secret**。新增 secret=0，Storage=0，trigger=0，环境级规则=0，V1 collection/function/index/config/Storage/trigger/ACL mutation=0。
- 若获批，shadow 资源计数变为 10 collection / 16 显式 index / 7 function，环境总 collection 23、function 26；数量低于此前只读确认的个人版公开上限 300 collection、每 collection 20 index、150 function。实际剩余存储/调用额度与增量计费无法由当前 CLI 确认；同环境与 V1 共用配额，故真实成本与容量仍需 CloudBase read-back 和账单核实。
- 新 collection 建立失败、index 能力不支持、函数或 config/secret 绑定失败时立即停止，不降级为不同资源、不改 V1。回退顺序：新 flag=false、全部临时 flag=false、allowlist 空、read-stop=true，先隐藏任何 candidate PUBLIC row 并保留 tombstone/evidence，再按获批差异恢复旧 shadow 包；**本轮不执行 rollback mutation/cleanup**。

## 本地验证与未完成门

`node scripts/build-v2-shadow-candidate-runtime-artifacts.mjs` 生成确定性 zip；`node scripts/validate-v2-shadow-candidate-runtime-artifacts.mjs` 检查哈希、打包源码一致性、literal collection allowlist、禁动态 collection、V1 function/Storage 禁访和 flag/boundary fail-closed。当前仅证明本地构建。授权接受时对最多 20 条本人当前 synthetic fixture 扫描，并为已处理的最新 BoardInstance 补 outbox；超过上限拒绝接受、不写不完整成功。真实 V1 上传后与 synthetic candidate HA 的可信同源匹配、多人贡献同一公开 lead 的 owner 语义仍未完成正向端到端证据；云端演练及本轮 V1 baseline diff 亦未执行。不能以此文件宣称 TASK19 验收通过。

**当前 gate：`TASK-V2-19 = IN_PROGRESS / CANDIDATE_RUNTIME_BINDING_BLOCKED / EXTERNAL_ACTION_APPROVAL_REQUIRED`；TASK-V2-20 未开始。Founder 下一步如授权，需逐项批准本文件的 1 collection、1 index、1 新函数、2 更新函数和新函数四项配置/secret 绑定；当前一项也未执行。**
