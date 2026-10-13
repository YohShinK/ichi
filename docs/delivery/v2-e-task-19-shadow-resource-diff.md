# TASK-V2-19｜同环境 V2 shadow candidate 确切资源差异

原始合同日期：2026-09-25。当前回读日期：2026-09-26。状态：`PHASE_B1_SHADOW_PROVISIONED_READBACK_COMPLETE / TASK_V2_19_SHADOW_PROVISIONING_READBACK_REQUIRED`。Founder 已单独授权并完成本文件第 2—4 节范围内的 **9 collection、15 index、6 function、9 个已允许的函数级配置／secret 名称**；HA policy/cooldown/budget 4 个名称仍未配置。第 1—8 节保留执行前冻结合同与当时的待批状态，当前云端事实及证据以第 9 节为准。机器可读原始提案 `packages/v2-map/resources/cloudbase-shadow-resource-proposal.json` 仍 `autoApply=false`，不是 V1 deploy manifest。TASK-V2-19=`IN_PROGRESS`，TASK-V2-20 未开始。

## 1. 目标与零变更边界

唯一目标环境：`cloud1-d7gxqfwv783a1f131`，`ap-shanghai`。不新建环境。远端只读基线是 **13 个现有 V1 collection、19 个 Active V1 函数**；目标差异是 **+9 collection、+15 显式索引（另有各 collection 自动 `_id_`）、+6 函数、+13 个仅新函数可见的配置／密钥名称、+0 trigger、+0 Storage 前缀、+0 环境级规则**。应用后理论资源总数为22 collection／25函数，实际配额是否允许仍须只读／创建前核对。V1 原有集合、函数、索引、配置、密钥、安全规则、Storage/ACL、触发器、业务记录与 V1 小程序线上入口均冻结：`ADD_NEW_SHADOW_ONLY`。

全阶段只准写入**本地明确生成并标记的 synthetic rehearsal fixtures**及其 shadow 派生物。不得读取、复制、索引、回填或以演练数据使用 V1 的 `observationCandidates`、`drawSubmissions`、`accounts`、`wechatIdentities`、`profiles` 或其他现有13个 collection；不得调用现有19个 V1 函数。测试调用者身份仅从 CloudBase 可信调用上下文派生 opaque digest，并以单独的测试名单校验；不使用 V1 Account/Profile 作为候选数据。即使资源获批，最初 read/resolve/assistance/projector 全部关闭。

## 2. Collection 与显式索引：最终 exact resource contract

下表 9 个 collection 均为**拟新增**；每个目标数据库 ACL 均为 `ADMINONLY / SERVER_ONLY`，小程序客户端直接读写均拒绝，候选函数还受第3节的静态 collection allowlist 约束。`V1 production read=NO` 对每一行分别成立，包括只读查询、复制真实私有记录、引用 V1 Storage 与调用 V1 函数；同环境共享管理员权限是必须在候选代码和负面测试中另行验证的残余风险。`v2ShadowSourceFixtures` 只能接收本地生成、显式标记的 synthetic/rehearsal data，不能从 V1 private collection 导出、复制或去标识化后灌入。

| 新 collection | 用途 | 数据类别／唯一来源 | 目标 ACL | V1 production read |
| --- | --- | --- | --- | --- |
| `v2ShadowSourceFixtures` | 模拟 current publication、APPROVED submission、授权与位置事实 | `SYNTHETIC_FIXTURE_ONLY`；本地生成的 rehearsal fixture，禁止复制任何真实 V1 private record | `ADMINONLY / SERVER_ONLY` | `NO` |
| `v2ShadowBoardInstances` | 候选版面实例与最近结构化事实；位置只生成候选 | `SYNTHETIC_DERIVED_PRIVATE`；由 synthetic VerifiedBoard 推导 | `ADMINONLY / SERVER_ONLY` | `NO` |
| `v2ShadowAssociationDecisions` | 版本化 LINK／UNLINK／RELINK，不改写原 Observation | `SYNTHETIC_DERIVED_PRIVATE_AUDIT`；synthetic Observation 的决策事件 | `ADMINONLY / SERVER_ONLY` | `NO` |
| `v2ShadowHumanAssistanceRequests` | 一次 synthetic upload 最多一次主动询问，保存 owner digest、版本、候选引用与状态 | `SYNTHETIC_DERIVED_PRIVATE`；synthetic 歧义与候选测试策略 | `ADMINONLY / SERVER_ONLY` | `NO` |
| `v2ShadowHumanAssistanceEvidence` | SAME／DIFFERENT／CANNOT_TELL 的追加式答复证据；SKIP 仅更新 request 状态 | `SYNTHETIC_TEST_ANSWER_PRIVATE_AUDIT`；测试 caller 对 synthetic request 的答复 | `ADMINONLY / SERVER_ONLY` | `NO` |
| `v2ShadowControlState` | 公开读取停止、持久 rate、HA 测试预算／冷却账本 | `SYNTHETIC_OPERATIONAL_PRIVATE`；仅 shadow 函数生成 | `ADMINONLY / SERVER_ONLY` | `NO` |
| `v2ShadowProjectionOutbox` | 顺序投影、重试、hide-first 与 no-resurrection | `SYNTHETIC_DERIVED_PRIVATE_AUDIT`；仅 synthetic 事件生成 | `ADMINONLY / SERVER_ONLY` | `NO` |
| `v2ShadowPublicMapLeads` | allowlisted 公开投影与最小 retired tombstone | `SYNTHETIC_PUBLIC_PROJECTION`；仅 shadow outbox 派生，不含 raw location／owner／evidence | `ADMINONLY / SERVER_ONLY` | `NO` |
| `v2ShadowPublicMapQuerySnapshots` | 50/page、最多500引用、120秒有效的 opaque snapshot/cursor 元数据 | `SYNTHETIC_EPHEMERAL_QUERY_STATE`；仅 shadow 公开查询生成 | `ADMINONLY / SERVER_ONLY` | `NO` |

下表为全部 **15 个显式索引**；`1`＝升序、`-1`＝降序、`2dsphere`＝GEO。每行的 `TTL-or-normal=NORMAL` 表示只申请普通索引，**不申请数据库自动 TTL 删除**；过期由获批的 shadow 代码按保留策略处理。平台自动 `_id_` 不计入15项。表中字段顺序与唯一性必须原样核对；真实 CloudBase Geo/unique 语法和套餐能力在任何 apply 前仍需只读／创建前核实，不得悄悄替换。

| Collection | Index name | Exact fields / order-or-GEO | Unique | TTL-or-normal | Purpose |
| --- | --- | --- | --- | --- | --- |
| `v2ShadowSourceFixtures` | `owner_observedAt` | `ownerSubjectDigest:1, observedAt:-1` | `NO` | `NORMAL` | 限测试 owner 的观察时间序读取 |
| `v2ShadowBoardInstances` | `candidate_point_geo` | `candidatePoint:2dsphere` | `NO` | `NORMAL` | 仅生成附近候选，不能凭坐标判同板 |
| `v2ShadowBoardInstances` | `state_lastObservedAt` | `lifecycleState:1, lastObservedAt:-1` | `NO` | `NORMAL` | 按生命周期读取最近候选 |
| `v2ShadowAssociationDecisions` | `observation_decisionVersion` | `observationVersionId:1, decisionVersion:1` | `YES` | `NORMAL` | 同一 observation 的同一决策版本幂等 |
| `v2ShadowAssociationDecisions` | `instance_decisionVersion` | `boardInstanceId:1, decisionVersion:-1` | `NO` | `NORMAL` | 回放实例的最新决策历史 |
| `v2ShadowHumanAssistanceRequests` | `observation_once` | `observationVersionId:1` | `YES` | `NORMAL` | 一次 synthetic observation 最多一条主动询问 |
| `v2ShadowHumanAssistanceRequests` | `owner_state_expiresAt` | `ownerSubjectDigest:1, state:1, expiresAt:1` | `NO` | `NORMAL` | 测试 owner 的待答与过期过滤；不自动删除 |
| `v2ShadowHumanAssistanceEvidence` | `action_once` | `actionId:1` | `YES` | `NORMAL` | 回答双击／重试幂等 |
| `v2ShadowControlState` | `kind_subject_window` | `kind:1, subjectDigest:1, windowKey:1` | `YES` | `NORMAL` | rate、read-stop 与 HA 测试账本的窗口唯一性 |
| `v2ShadowControlState` | `expiresAt` | `expiresAt:1` | `NO` | `NORMAL` | 找到过期的运行窗口；不自动删除审计事实 |
| `v2ShadowProjectionOutbox` | `instance_eventSequence` | `boardInstanceId:1, eventSequence:1` | `YES` | `NORMAL` | 同一实例投影事件顺序与幂等 |
| `v2ShadowProjectionOutbox` | `status_nextAttemptAt` | `status:1, nextAttemptAt:1` | `NO` | `NORMAL` | 选取到期的待重试事件 |
| `v2ShadowPublicMapLeads` | `public_location_point_geo` | `publicLocation.point:2dsphere` | `NO` | `NORMAL` | 公开精度下的 viewport 地理查询 |
| `v2ShadowPublicMapLeads` | `publicLeadId_servedVersion` | `publicLeadId:1, servedVersion:-1` | `YES` | `NORMAL` | 同一公开 ID 的服务版本唯一与回读 |
| `v2ShadowPublicMapQuerySnapshots` | `expiresAt` | `expiresAt:1` | `NO` | `NORMAL` | 找到过期 cursor/snapshot；由 shadow 代码清理 |

D09 逻辑映射为 `publicMapLeads → v2ShadowPublicMapLeads`、`publicMapQuerySnapshots → v2ShadowPublicMapQuerySnapshots`，两者原有三个索引语义保留，仅物理名称隔离。其余七个 collection 是 TASK-V2-19 的持久 authority、BoardInstance 和 Human Assistance **新增待批提案**，不是把它们伪称为 D09 已批准资源。若任一索引能力／配额不支持，停止并重新提交资源 diff；不能动 V1 collection 上的索引作为替代。

## 3. 函数与访问白名单

全部是**新增** `v2-shadow-...` 函数名；Nodejs20.19 候选运行时、无 trigger、无 V1 dependency layer 绑定、无 Storage 读写、无 V1 函数调用。每个函数的数据库 adapter 固定以下 allowlist，禁止用户输入决定 collection 名。`SERVER_REHEARSAL_ONLY` 还需要单独的签名 rehearsal capability；`OWNER_TEST_ALLOWLIST` 必须从 CloudBase 调用上下文派生可信 subject、验证测试名单，忽略客户端传来的 account ID。六个本地 artifact 已生成并在第8节记录 hash，但**本清单不是部署授权**。

| 新函数 | 唯一职责 | 可访问的新 collection |
| --- | --- | --- |
| `v2-shadow-query-public-map-leads` | 测试名单内公开 viewport/page，持久 rate/read-stop、allowlist 输出 | `v2ShadowPublicMapLeads`、`v2ShadowPublicMapQuerySnapshots`、`v2ShadowControlState` |
| `v2-shadow-get-public-map-lead-detail` | 测试名单内详情，当前可见性复核 | `v2ShadowPublicMapLeads`、`v2ShadowControlState` |
| `v2-shadow-resolve-observation` | 只对 synthetic fixture 做 VerifiedBoard→candidate→保守 resolution；`AMBIGUOUS` 可产生一次请求 | `v2ShadowSourceFixtures`、`v2ShadowBoardInstances`、`v2ShadowAssociationDecisions`、`v2ShadowHumanAssistanceRequests`、`v2ShadowControlState`、`v2ShadowProjectionOutbox` |
| `v2-shadow-get-my-assistance` | 测试 caller 自己的 My Uploads assistance 安全投影，无原始 ID/坐标/evidence | `v2ShadowSourceFixtures`、`v2ShadowHumanAssistanceRequests`、`v2ShadowControlState` |
| `v2-shadow-answer-assistance` | 同一 caller 的 opaque action + SAME／DIFFERENT／CANNOT_TELL／SKIP；幂等、过期与版本硬门 | `v2ShadowSourceFixtures`、`v2ShadowBoardInstances`、`v2ShadowAssociationDecisions`、`v2ShadowHumanAssistanceRequests`、`v2ShadowHumanAssistanceEvidence`、`v2ShadowControlState`、`v2ShadowProjectionOutbox` |
| `v2-shadow-reconcile-projection` | synthetic outbox 重放、公开行单调投影与隐藏／快照失效 | `v2ShadowSourceFixtures`、`v2ShadowBoardInstances`、`v2ShadowAssociationDecisions`、`v2ShadowProjectionOutbox`、`v2ShadowPublicMapLeads`、`v2ShadowPublicMapQuerySnapshots`、`v2ShadowControlState` |

现有环境的**环境级函数安全规则不在本次 diff**。CloudBase 规则是环境级文件，改动可能影响 V1；在其只读 read-back 与两账号验证前，所有新函数必须凭内部关闭开关、测试身份白名单和签名 capability 失败闭合。若当前规则令候选函数不能安全完成必要测试，先报告阻塞并提交新的独立评审，不可顺手修改 V1 共享规则。

## 4. 函数级配置与 secret 名称

只允许给六个**新函数自身**设置以下键；不修改环境全局配置、V1 函数、`cloudbaserc.json` 或 V1 deploy manifest。`UNSET_FAIL_CLOSED` 是本地提案状态，**不是要写入云端的字面值**。四个 `*_ENABLED` shadow feature flag 初始均为布尔 `false`，且缺失、格式错误或未知值也必须按 `false` 处理。任何必需键未获批准或不存在时，候选请求拒绝。密钥仅报告生成／存在／校验状态，绝不回显密钥值、摘要或可恢复材料。

| 键名 | 初始值类别／状态 | 用途与放行边界 |
| --- | --- | --- |
| `ICHI_V2_SHADOW_BOUNDARY` | `FIXED_ENUM: synthetic_only` | 固定拒绝真实 V1 source ID、V1 resource name 和非 rehearsal 数据 |
| `ICHI_V2_SHADOW_READ_ENABLED` | `BOOLEAN_FLAG: false / FAIL_CLOSED` | query/detail 默认关闭 |
| `ICHI_V2_SHADOW_RESOLVE_ENABLED` | `BOOLEAN_FLAG: false / FAIL_CLOSED` | resolver 默认关闭 |
| `ICHI_V2_SHADOW_HUMAN_ASSISTANCE_ENABLED` | `BOOLEAN_FLAG: false / FAIL_CLOSED` | owner assistance 读取／回答默认关闭 |
| `ICHI_V2_SHADOW_PROJECTOR_ENABLED` | `BOOLEAN_FLAG: false / FAIL_CLOSED` | 投影写入默认关闭 |
| `ICHI_V2_SHADOW_TEST_CALLER_DIGESTS` | `UNSET_FAIL_CLOSED: EMPTY_ALLOWLIST` | 仅纳入经单独批准的测试主体 digest；不信任客户端 account ID |
| `ICHI_V2_SHADOW_CURSOR_HMAC_KEY` | `SECRET_ABSENT_FAIL_CLOSED` | 仅 shadow cursor 签名；不复用 V1 secret |
| `ICHI_V2_SHADOW_PRINCIPAL_HMAC_KEY` | `SECRET_ABSENT_FAIL_CLOSED` | 可信测试身份 digest；不读 V1 identity collection |
| `ICHI_V2_SHADOW_REHEARSAL_HMAC_KEY` | `SECRET_ABSENT_FAIL_CLOSED` | 仅 server rehearsal capability；不开放普通客户端调用 |
| `ICHI_V2_SHADOW_HA_POLICY_VERSION` | `UNSET_FAIL_CLOSED: CANDIDATE_TEST_ONLY / PILOT_CALIBRATION_REQUIRED` | 未批准测试 policy version 时不发起 HA 请求 |
| `ICHI_V2_SHADOW_HA_COOLDOWN_SECONDS` | `UNSET_FAIL_CLOSED: CANDIDATE_TEST_ONLY / PILOT_CALIBRATION_REQUIRED` | 测试冷却时长须另批；不冻结产品数值 |
| `ICHI_V2_SHADOW_HA_BUDGET_WINDOW_SECONDS` | `UNSET_FAIL_CLOSED: CANDIDATE_TEST_ONLY / PILOT_CALIBRATION_REQUIRED` | 测试预算窗口须另批；不冻结产品数值 |
| `ICHI_V2_SHADOW_HA_BUDGET_MAX` | `UNSET_FAIL_CLOSED: CANDIDATE_TEST_ONLY / PILOT_CALIBRATION_REQUIRED` | 测试次数上限须另批；不冻结产品数值 |

三个 HMAC secret 的本轮状态分别相同：`generation=NOT_GENERATED`、`existence=NOT_BOUND_TO_NEW_FUNCTIONS`、`validation=NOT_RUN`。这是提案／部署状态，不宣称已盘点环境内其他密钥。未来分别生成并绑定后，只能回报生成、存在和签名校验是否通过；不得记录或展示值。HA cooldown／budget 的任何候选测试数值必须另行申请，试验结果交 TASK-V2-21 pilot 校准后才可能提出产品参数。

最初没有配置写入、secret 绑定或开关开启；后续每类写入单独批准。公开 query/detail 的30/60每分钟 pilot 预算继续沿用既有参考合同，须由持久 control state 在实际候选代码中落实和测试，不在 V1 `dailyQuotas` 或 `systemSettings` 记账。头像测试只用默认图，不触及 V1 `profile-avatars/`，也不新增 Storage 资源。腾讯 POI／reverse geocoding 仍非 MVP 依赖。

### Human Assistance 前端 coverage correction

TASK-V2-19 的 Human Assistance 修正同时覆盖两处**现有小程序宿主内**的入口，不以新建后端 collection/function 代替用户流程：① 上传成功态，在服务端确实返回该次 synthetic upload 对应、可回答的 assistance request 时，展示一次可跳过的双卡比较入口；②「我的 → 我上传的版面」，进入／刷新列表时按可信 owner 查询仍有效的本人 request，并可进入同一回答流程。两处均须支持 `SAME_BOARD / DIFFERENT_BOARD / CANNOT_TELL / SKIP`、过期／已答／撤回／版本变化后的安全消失、重复提交幂等，以及没有 request 时不展示；不得让测试问题出现在 V1 线上用户的真实上传成功态或真实列表中。当前小程序尚无这两处 HA 接线，状态为 `TASK_V2_19_LOCAL_COVERAGE_REQUIRED / NOT_IMPLEMENTED`；候选功能及测试身份未获批前不得打开入口，不能把本次资源合同记作前端验收通过。两处本地接线及行为测试属于 V2-19 coverage correction，之后才可做获批的 candidate rehearsal 与 V2-20 真机门。

## 5. V1 禁止访问边界与预检查

远端现有13个 V1 collection 的**全部名称**、19个现有函数的**全部名称**，以及 `services/cloudbase/database/resources.json`、`services/cloudbase/deploy/manifest.json`、`cloudbaserc.json` 的当前内容均作为不可修改的基线。批准之后，任何脚本也必须先比较环境 ID=`cloud1-d7gxqfwv783a1f131`、资源名严格属于本清单且**尚不存在**、目标 collection 不在 V1 名单中；不使用 `--all`、通配符或默认环境隐式选择。操作前后只读比对 V1 collection／index／function hash/ModTime/config-key names/ACL/trigger/Storage，差异非零即停止。候选函数源码扫描静态 collection allowlist、禁止动态 collection 名／V1 函数调用／V1 Storage 路径；运行时再次拒绝越界。共享管理员权限和套餐容量仍是方案②的残余风险，不能称为物理隔离。

执行申请前的缺口：该个人版的真实剩余额度、Geo/unique 索引实际创建可用性、候选资源的远端 ACL／部署 read-back 和 secret 绑定状态仍未确认。**不能把本次命名确认或本地 artifact hash 视为自动通过这些门。**

## 6. Rollback、cleanup 与 TASK-V2-22

候选 rollback 顺序（仅在另获 mutation 授权后演练）：关闭全部 shadow 函数级开关 → 停 shadow resolver/projector → 对 shadow 公共行 hide-first、使 shadow snapshot 失效 → 只读验证候选查询均 fail closed，V1 快照和行为保持不变。若候选函数或索引失败，只能对清单内 shadow 名称作定点处理，不停全环境、不更新 V1 规则、不回写 V1 文档。保留最小 no-resurrection/versioned audit 到获批的保留期结束。

Cleanup 是**再一次单独授权**：先确认 synthetic fixture、未完成 outbox、应保留审计／墓碑、实际存储量，再定点删除 shadow 数据、索引、六个函数和九个 collection，并读回这些名称已消失；对 V1 名称、Storage、配置和触发器零操作。若安全删除条件不明，保持关闭状态并延后删除。

TASK-V2-22 的正式路径仍需全新批准：在 V2-19/20/21 gate 通过后，为正式发布另建正式 `publicMap...` 资源／函数及必要持久 authority，按当时当前有效、已授权的 V1 record **逐条重新生成**公开投影，canary/read-back 后才开放正式入口；synthetic shadow 行不复制、不改名上线。之后单独清理 shadow。此路径不提前实施 V2-20/21/22。

## 7. 成本与批准范围

方案②新增环境基础费 **¥0**，但 shadow 与 V1 **共用同一环境配额、并发与数据库容量**。只读 `env usage/info` 明确返回“not in resource-point billing mode”，因此[官网当前资源点个人版价格](https://cloudbase.cloud.tencent.com/pricing)不能直接换算本环境余量；[腾讯云配额制套餐说明](https://cloud.tencent.com/document/product/876/39093)指出集合数、调用量和计算资源超限可能导致资源限制，开启按量付费的环境才可能产生超额账单。当前账号是否开启按量、实际套餐配额／余量／账单尚无证据。本清单不提出升级、续费或计费模式切换。

增量计量项：9个集合及15个索引的存储，synthetic fixture/BoardInstance/association/HA/outbox/public row/snapshot 的数据库读写，6个函数的 invocation+compute，日志及可能的索引读放大。**零请求的创建本身是否收费、配置的数量配额与实际增量 ¥ 均待账单/控制台核对**；不能以 V2-18 的约 ¥11.02/月条件估算替代。Rehearsal 数据条数、AMBIGUOUS 比例、HA 回答率、每请求读写和失败重试上限须随实际演练批次单独批准，并以100/1,000/10,000 upload 的 LOW/MID/HIGH 假设敏感性表复核；本次不请求执行任何规模演练。V1 用量和延迟一旦受影响立即停止候选操作。

为审查资源量，先给一个**未实测的运算口径**：设 U 为 synthetic uploads、A 为 AMBIGUOUS 且 policy 允许的请求、B 为其中保存非 SKIP 回答的次数。假设每次 upload 各触发一次 resolver 和 projector、每个 A 读一次本人 assistance、每个 B 提交一次 answer，则函数调用代理数 `F=2U+A+B`；仅 fixture／request／evidence／request-state 的数据库写入**下界**是 `Wmin=U+A+2B`。这两个数都排除地图 query/detail、association/outbox/public row/snapshot、control 账本、重试和清理，**不是账单上限**。假设回答率 B/A=50% 仅用于敏感性，不是已观察数据，也不冻结 cooldown/budget：

| 假设 AMBIGUOUS 且可询问率 | U=100：A/B、F、Wmin | U=1,000：A/B、F、Wmin | U=10,000：A/B、F、Wmin |
| --- | --- | --- | --- |
| LOW 10% | 10/5；215；120 | 100/50；2,150；1,200 | 1,000/500；21,500；12,000 |
| MID 30% | 30/15；245；160 | 300/150；2,450；1,600 | 3,000/1,500；24,500；16,000 |
| HIGH 60% | 60/30；290；220 | 600/300；2,900；2,200 | 6,000/3,000；29,000；22,000 |

实际增量成本仍须用本账号的配额制单价/账单与候选实测 `F、DB reads/writes、index/storage、logs` 重新计算；若个人版超限会停止服务或产生按量账单，须先确认当前按量开关和可承受停止阈值。TASK-V2-21 pilot 再用真实 AMBIGUOUS／回答率替换假设。上表是资源申请的敏感性草算，不授权这些规模的演练。

**以上 9 collection／15 index／6 function／13 config 名称与合同构成供 Founder 一次性确认的最终资源范围 diff。**在 Founder 明确授权前，不 create、不建索引、不部署函数、不写配置／secret。资源范围确认也不能替代候选资源的远端 ACL／部署 read-back、密钥值、实际套餐余量、synthetic 数据数量与 rollback/cleanup 动作；这些内容在对应执行前必须成为可审阅的确切动作和证据，不能借本清单自动扩大授权。当前停止码：`TASK_V2_19_EXTERNAL_ACTION_APPROVAL_REQUIRED`。

## 8. 执行前冻结阶段只读 preflight 与 artifact 证据

只读核对时间：2026-09-25；环境：`cloud1-d7gxqfwv783a1f131`，region `ap-shanghai`。CloudBase CLI 只读返回 `baas_personal`／个人版、预付费、到期 `2026-10-28 23:59:59`、`EnableOverrun=false`、QPS quota `500`。当前环境不在 resource-point billing mode，CLI 无法返回真实 resource-point usage；账号剩余存储、调用、容量额度及按量计费开关没有可引用的读回证据，不能声称“剩余额度已确认”。

远端基线为：13 个 V1 collection（`accounts`、`wechatIdentities`、`profiles`、`ichiIds`、`accountRoles`、`dailyQuotas`、`recognitionJobs`、`observationCandidates`、`drawSubmissions`、`recordCodes`、`deletionJobs`、`systemSettings`、`auditEvents`）、`DescribeTables` 返回 43 个 index（含各表平台自动 `_id_`，不是本次 15 个显式 index）、19 个 Active V1 function、4 个 V1 trigger；Storage root 只读列出 2 个根项；CloudBase policy list 为 0 条。13 个 V1 collection 的 ACL read-back **全部为 `ADMINONLY`**。环境级 function security rule read-back 为：

```json
{
  "*": {
    "invoke": "auth != null && auth.loginType != 'ANONYMOUS'"
  }
}
```

公开规格只读核对：每环境最多 300 collections、每 collection 最多 20 indexes、`baas_personal` function limit 150；按数量粗算新增后为 22 collections／25 functions，处于公开上限内，15 个 index 也分散为每个新 collection 不超过 2 个。GEO 与 unique 的文档能力已确认，现有 V1 `wechatIdentities.accountId` unique index 也已读回；但本环境实际创建可用性没有通过 create 实测，仍必须在另获授权后按 exact diff 单独验证。没有把公开上限当作剩余额度或写入授权。

V1 diff=0 证据：本轮只读快照比较 collection 名／index 元数据／ACL、function 名／状态、trigger、Storage root、环境函数规则和 V1 manifest/config hash；没有发现 V2 shadow 名称已存在，也没有对任何 V1 collection、function、index、config、Storage、trigger 或规则执行 mutation。该证据只证明本轮 mutation diff 为 0，不替代后续每次候选动作前后的 read-back。

### 六个本地 function artifact

artifact 是可部署的函数包。本地静态验证器为 `scripts/validate-v2-shadow-artifacts.mjs`，逐个检查 runtime/dependency、literal `v2Shadow...` collection、function allowlist、禁止动态 collection、V1 function／Storage API、无候选写操作，以及缺失／false feature flag 的 fail-closed guard。生成 manifest：`packages/v2-map/resources/cloudbase-shadow-function-artifacts.json`。所有项均 `staticValidation=PASS`、`deployed=false`、`cloudWrite=false`：

| Function | Local artifact | SHA-256 |
| --- | --- | --- |
| `v2-shadow-query-public-map-leads` | `packages/v2-map/resources/shadow-functions/artifacts/v2-shadow-query-public-map-leads.zip` | `136baafd9e15a3e2e784a4e0eeb3e6bac2423eb073029d33355f7b21736e5918` |
| `v2-shadow-get-public-map-lead-detail` | `packages/v2-map/resources/shadow-functions/artifacts/v2-shadow-get-public-map-lead-detail.zip` | `34baaa7637a5246384922a5128b78ba85be2d70a84368edcfbc416c1e9e8b2c7` |
| `v2-shadow-resolve-observation` | `packages/v2-map/resources/shadow-functions/artifacts/v2-shadow-resolve-observation.zip` | `343f0ad3a623ebc7ee828fa7154a2001c2f7f18c62cb6d0a8ffb527627c6f899` |
| `v2-shadow-get-my-assistance` | `packages/v2-map/resources/shadow-functions/artifacts/v2-shadow-get-my-assistance.zip` | `fce1041972e77b87de65172bc463e0183c49337e266032e31a28b1f4660e5e7b` |
| `v2-shadow-answer-assistance` | `packages/v2-map/resources/shadow-functions/artifacts/v2-shadow-answer-assistance.zip` | `8f2c014f5275c2d1de8546d2726f1182d10a818e0b62aa5ff7672275c0600482` |
| `v2-shadow-reconcile-projection` | `packages/v2-map/resources/shadow-functions/artifacts/v2-shadow-reconcile-projection.zip` | `db949195d67e6c3374e22c4ffdfbf713cc4669d8a327496c78ca047623752f04` |

### Exact cloud actions still awaiting separate authorization

1. Create the 9 named shadow collections with `ADMINONLY / SERVER_ONLY` ACL.
2. Create the 15 exact indexes from section 2, including the two normal `expiresAt` indexes on `v2ShadowControlState` and `v2ShadowPublicMapQuerySnapshots`.
3. Deploy the 6 named functions from the local artifact manifest, with no V1 dependency or Storage access.
4. Bind the 13 function-local configuration names; keep every feature flag false／fail-closed and keep HA cooldown/budget `CANDIDATE_TEST_ONLY / PILOT_CALIBRATION_REQUIRED`.
5. Generate and bind the three HMAC secrets without returning their values; record only generation／existence／validation status.
6. After a separate synthetic-data authorization, write only locally generated rehearsal fixtures and perform the approved rehearsal; no V1 record copy.
7. If separately approved, execute disable→hide/invalidate→read-back rollback and later定点 cleanup only for shadow names.

None of these actions has been executed in this phase.

## 9. Phase B1 Shadow Provisioning：2026-09-26 云端逐项回读

Founder 本轮批准**仅** `cloud1-d7gxqfwv783a1f131 / ap-shanghai` 的 shadow provisioning。写入前重新确认远端恰有 13 个 V1 collection、43 个 V1 index（含平台索引）、19 个 Active V1 function／4 个 trigger，六个 shadow 函数与九个 shadow collection 均不存在；13 个 V1 collection ACL 全为 `ADMINONLY`。六个本地 zip 的 SHA-256 与第 8 节报告逐项完全一致，随后才逐项部署。

### 9.1 Collection 与 index read-back

第 2 节列出的 9 个 `v2Shadow*` collection 已全部创建且逐个 ACL read-back=`ADMINONLY / SERVER_ONLY`、文档数均为 `0`。平台新建时默认 ACL 为 `PRIVATE`；本轮只对九个**新 shadow collection**设置 `ADMINONLY` 并立刻复核，没有触碰任何 V1 ACL。第 2 节的 15 个显式索引逐项创建后均回读了 `collection / name / exact keys + order-or-2dsphere / unique / non-TTL`，结果全部一致；两项 GEO 和六项 unique 在本环境真实创建成功，没有降级、替换或借用 V1 index。`v2ShadowControlState.expiresAt` 与 `v2ShadowPublicMapQuerySnapshots.expiresAt` 均为普通索引，不启用自动 TTL。平台另为每个 shadow collection 自动创建 `_id_`、`_openid_1`，不计入已批准的 15 项。写入后环境合计 22 collections／25 functions。

### 9.2 Function artifact 与 config/secret read-back

六个函数均回读为 `Active / Available`、`Nodejs20.19`、Event、`index.main`、0 trigger、0 layer。CloudBase 安装了 `wx-server-sdk` 依赖，因此远端整包包含 `node_modules`，其 SHA-256 不等于部署前两文件 zip 的 SHA-256。对每个函数，从 CloudBase 下载代码包，只读验证远端整包 SHA-256 与平台 `codeSha256` 相等，且包根目录 `index.js`、`package.json` 与对应冻结 zip **逐字节相等**：

`packages/v2-map/resources/cloudbase-shadow-function-artifacts.json` 保留为 **Phase A 部署前 hash 快照**；其中 `deployed=false`、`cloudWrite=false` 只描述 2026-09-25 的快照状态，不能当作 2026-09-26 的云端现状。当前部署与回读状态以本节为准，重新运行本地 artifact validator 也不得覆写这份历史快照。

| Function | 部署前冻结 zip SHA-256 | 远端整包 codeSha256 | 根文件匹配 |
| --- | --- | --- | --- |
| `v2-shadow-query-public-map-leads` | `136baafd9e15a3e2e784a4e0eeb3e6bac2423eb073029d33355f7b21736e5918` | `2473139972f7dd0b65a3aa17f04c7ea657332bf26e8363defe45d8a023e5069e` | `index.js` + `package.json` PASS |
| `v2-shadow-get-public-map-lead-detail` | `34baaa7637a5246384922a5128b78ba85be2d70a84368edcfbc416c1e9e8b2c7` | `6b1e33406bae29556d873e3ea72b7e877d825b78d1d1fab2f3691eb343d2c8cc` | PASS |
| `v2-shadow-resolve-observation` | `343f0ad3a623ebc7ee828fa7154a2001c2f7f18c62cb6d0a8ffb527627c6f899` | `65516abea27ed67900940766e934385d92aa53bb3249ab05befe71fe9c2867dd` | PASS |
| `v2-shadow-get-my-assistance` | `fce1041972e77b87de65172bc463e0183c49337e266032e31a28b1f4660e5e7b` | `f4cb0465db90bc6690dd9b1ef382aabcf049b79c40dfcd66a222a7ce33b0421a` | PASS |
| `v2-shadow-answer-assistance` | `8f2c014f5275c2d1de8546d2726f1182d10a818e0b62aa5ff7672275c0600482` | `4b99fe71fbd871f09567ac573475b63f51b70aa2f0eaa9d6e1f1b4ec8cdf9f57` | PASS |
| `v2-shadow-reconcile-projection` | `db949195d67e6c3374e22c4ffdfbf713cc4669d8a327496c78ca047623752f04` | `6cc68306d6c808efdb46774cb85ad9c411912fe857d5923c6939120dcd7373af` | PASS |

全部六个函数的 `ICHI_V2_SHADOW_BOUNDARY=synthetic_only`，`ICHI_V2_SHADOW_READ_ENABLED=false`、`ICHI_V2_SHADOW_RESOLVE_ENABLED=false`、`ICHI_V2_SHADOW_HUMAN_ASSISTANCE_ENABLED=false`、`ICHI_V2_SHADOW_PROJECTOR_ENABLED=false`，`ICHI_V2_SHADOW_TEST_CALLER_DIGESTS` 为空；逐函数 read-back PASS。三个新 shadow-only HMAC secret 已在内存生成并绑定：cursor→query，principal→get-my-assistance／answer-assistance，rehearsal→resolve-observation／reconcile-projection。回读仅校验密钥存在及与刚生成值匹配，**不记录、回显密钥值或摘要**；本机 MCP 调试日志中的 5 项密钥参数已脱敏。`ICHI_V2_SHADOW_HA_POLICY_VERSION`、`ICHI_V2_SHADOW_HA_COOLDOWN_SECONDS`、`ICHI_V2_SHADOW_HA_BUDGET_WINDOW_SECONDS`、`ICHI_V2_SHADOW_HA_BUDGET_MAX` 全部未配置，数值仍为 `CANDIDATE_TEST_ONLY / PILOT_CALIBRATION_REQUIRED`，未冻结产品参数。

### 9.3 V1 frozen production boundary 与停止点

写入后对 V1 的 13 collection ACL／43 index 定义、19 function 的代码元数据／配置值／状态／ModTime／trigger（共4项）、环境级函数调用规则及 Storage 根项（2项的路径、ETag、大小、修改时间）逐项与写入前只读基线比较，`V1_DIFF=0`。九个 shadow collection 仍为空；未写 synthetic fixture、production data，未做 migration rehearsal、rollback mutation 或 cleanup；未改 V1 collection/function/index/config/Storage/trigger/ACL，也未改 `cloudbaserc.json` 或 V1 deploy manifest。

本轮 provisioning read-back 已完成，但不代表 TASK-V2-19 完成，也不授权下一阶段。当前停止码严格保持 `TASK_V2_19_SHADOW_PROVISIONING_READBACK_REQUIRED`；TASK-V2-19=`IN_PROGRESS`，未 `COMPLETE/HUMAN_APPROVED/FROZEN`，TASK-V2-20 未开始。
