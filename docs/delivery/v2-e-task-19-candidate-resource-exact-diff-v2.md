# TASK-V2-19｜Candidate runtime exact cloud diff v2（仅提案）

> **SUPERSEDED_DO_NOT_DEPLOY**：Founder v3 决策已取代本合同。v2 proposal、artifact manifest 与下列七个 zip 均为历史证据；v2 从未应用到 CloudBase，不执行 cleanup/rollback。当前唯一候选包清单为 `cloudbase-candidate-runtime-artifacts-v3.json`。

> 2026-09-28 local gate 更新：V1 草稿左滑 Playwright 8 次 3 PASS / 5 FAIL，已按 [独立 trace 报告](v2-e-task-19-local-validation-flake-acceptance.md) 接受为既有 timing-sensitive flake；本轮触及源码/报告 Prettier、workflow、git diff-check PASS。当前仅到 `MULTI_CONTRIBUTION_AND_LINEAGE_LOCAL_READY / EXTERNAL_ACTION_APPROVAL_REQUIRED`，资源清单与七包 SHA 未因该 gate 更新而改变。

日期：2026-09-28。环境限定 `cloud1-d7gxqfwv783a1f131 / ap-shanghai`。`autoApply=false`。机器合同为 `packages/v2-map/resources/cloudbase-candidate-runtime-resource-proposal-v2.json`，包清单为 `packages/v2-map/resources/cloudbase-candidate-runtime-artifacts-v2.json`。本报告**不是创建、部署、配置或 rehearsal 授权**。

## Pre-state、作废项和影响范围

此前已只读确认环境有 V1 13 collection／19 function、shadow 9 collection／15 显式 index／6 function；九个 shadow ACL=`ADMINONLY`，四个旧功能 flag=false、caller allowlist 空，PUBLIC=0 的证据属于此前 closeout，**本轮没有重做云端 read-back**。旧 `v2-e-task-19-candidate-resource-exact-diff.md` 和 `cloudbase-candidate-runtime-resource-proposal.json` 的 `v2ShadowContributionAuthority`、`owner:<publicLeadId>`、`ACCEPT/WITHDRAW`、单 owner capability、二次发布状态机全部作废，旧三包不得部署。本轮本地修订的源码、前端和验证见 [多贡献者合同报告](v2-e-task-19-multi-contribution-contract-revision.md) 与 [上传 lineage 报告](v2-e-task-19-candidate-upload-lineage-revision.md)。

## 新 collection、文档 schema 与索引

两个 collection 均为 `ADMINONLY / SERVER_ONLY`，client DB read/write=`NO`，V1 production resource read=`NO`，仅 synthetic/rehearsal data，所有索引为 `NORMAL_NO_AUTO_TTL`，无 TTL 自动清理；平台自动 `_id_` unique 不计入下列三个显式索引。

| Collection | `_id` / 文档 schema | 用途 |
| --- | --- | --- |
| `v2ShadowCandidateUploads` | `candidate:<server-HMAC-40hex>`；`candidateRecordRef`、`ownerSubjectDigest`、`fixtureId`、`observationVersionId`、`observationVersion`、`verifiedBoardId`、`verifiedBoardVersion`、`shareDecision=SHARE\|DO_NOT_SHARE`、`firstIdempotencyKey`、`validationState=VERIFIED`、`lifecycle=ACTIVE\|DELETED`、`boardInstanceId?`、`contributionId?`、`projectionState?`、`createdAt`、`deletedAt?`、`noResurrection?`、`dataOrigin=SYNTHETIC_REHEARSAL` | 服务端签发原始候选上传与不可歧义 ref/version；删除保留 tombstone。 |
| `v2ShadowContributionLedger` STATE | `contribution:<sha256(candidateRecordRef)-40hex>`；`kind=STATE`、`contributionId`、`candidateRecordRef`、`fixtureId`、`ownerSubjectDigest`、`boardInstanceId`、`observationVersionId`、`observationVersion`、`shareDecision=SHARE`、`validationState=VERIFIED`、`eligible`、`lifecycle=ACTIVE\|DELETED`、`observedAt`、`publicSafeNote?`、`contributor`（approved public-safe display/fallback avatar）、`sourceType`、`noResurrection?`、`createdAt/updatedAt/deletedAt?`、`dataOrigin` | 每条上传自己的贡献状态；多人共享 BoardInstance/lead。 |
| `v2ShadowContributionLedger` EVENT | `contribution-audit:<sha256(candidateRecordRef:action)-40hex>`；`kind=ACTIVATE_EVENT\|DELETE_EVENT`、`auditVersion=1`、`contributionId`、`candidateRecordRef`、`ownerSubjectDigest`、`boardInstanceId?`、`commandId?`、`at`、`dataOrigin` | 版本化追加审计，重复 action ID 幂等；无独立地图发布状态。 |

| Collection / exact index name | exact fields/order | unique | TTL | Purpose |
| --- | --- | --- | --- | --- |
| `v2ShadowCandidateUploads / ownerSubjectDigest_dataOrigin` | `ownerSubjectDigest:1, dataOrigin:1` | false | normal | 可信本人 My Uploads 有界查询。 |
| `v2ShadowCandidateUploads / observationVersionId_ownerSubjectDigest_lifecycle_dataOrigin` | `observationVersionId:1, ownerSubjectDigest:1, lifecycle:1, dataOrigin:1` | false | normal | resolver 找当前唯一 server-issued upload。 |
| `v2ShadowContributionLedger / boardInstanceId_kind_dataOrigin` | `boardInstanceId:1, kind:1, dataOrigin:1` | false | normal | 按同一 BoardInstance 聚合有效贡献。 |

新功能不需要 GEO 或显式 unique index；既有 GEO/unique 合同不改。若精确字段/顺序、ACL 或能力创建不支持，应停止，不用降级索引或 V1 资源替代。

## 函数 exact artifact 与 literal collection allowlist

七包均为 `Nodejs20.19`、`wx-server-sdk@4.0.2`、`index.main`、timeout `10s`、0 trigger、0 layer。打包路径共同前缀为 `packages/v2-map/resources/shadow-functions/artifacts/candidate-runtime-v2/`，下表列 zip 文件名和 SHA-256；每次获批部署前须重算逐项一致，否则停止。CloudBase 若重装 SDK，下载后的整包 hash 可能不同，read-back 要比较源文件、package/runtime/config 与远端代码 hash，不能把本地 zip hash 冒称远端安装后 hash。

| 动作 / function | Zip / SHA-256 | literal collection allowlist |
| --- | --- | --- |
| 新增 `v2-shadow-submit-candidate-upload` | `v2-shadow-submit-candidate-upload.zip` / `f9424e56736eb49755e3062366982893b896776e8235d4ae580d393adcba50f8` | `v2ShadowCandidateUploads`, `v2ShadowSourceFixtures`, `v2ShadowControlState` |
| 更新 `v2-shadow-resolve-observation` | `v2-shadow-resolve-observation.zip` / `030a6899d8a05947535929c21478c4e7c637e8d12b7a9182910cba64e2da2fe9` | `v2ShadowControlState`, `v2ShadowSourceFixtures`, `v2ShadowCandidateUploads`, `v2ShadowContributionLedger`, `v2ShadowBoardInstances`, `v2ShadowAssociationDecisions`, `v2ShadowProjectionOutbox`, `v2ShadowHumanAssistanceRequests` |
| 更新 `v2-shadow-answer-assistance` | `v2-shadow-answer-assistance.zip` / `92c3c84fc81d88a7674e05fef644ae5a4b19e98f6cd15c9f941c20d698af4755` | `v2ShadowControlState`, `v2ShadowCandidateUploads`, `v2ShadowContributionLedger`, `v2ShadowHumanAssistanceRequests`, `v2ShadowHumanAssistanceEvidence`, `v2ShadowSourceFixtures`, `v2ShadowBoardInstances`, `v2ShadowProjectionOutbox`, `v2ShadowAssociationDecisions` |
| 更新 `v2-shadow-get-my-assistance` | `v2-shadow-get-my-assistance.zip` / `4b635d9c2d16d7feb955097166f5c554ad4e3502d737ea58d5e9fd488bb30b22` | `v2ShadowControlState`, `v2ShadowHumanAssistanceRequests`, `v2ShadowSourceFixtures`, `v2ShadowCandidateUploads` |
| 更新 `v2-shadow-reconcile-projection` | `v2-shadow-reconcile-projection.zip` / `ccd54da5588b5c5574a06b66a655c0f59fd01b6e8e57fb1cc25899340a06bf1d` | `v2ShadowControlState`, `v2ShadowSourceFixtures`, `v2ShadowBoardInstances`, `v2ShadowAssociationDecisions`, `v2ShadowProjectionOutbox`, `v2ShadowPublicMapLeads`, `v2ShadowContributionLedger`, `v2ShadowCandidateUploads` |
| 新增 `v2-shadow-manage-contribution` | `v2-shadow-manage-contribution.zip` / `f6c60d2e5e9e5e8b596323bb66889f85b5712982393df936ce61443531ab4150` | `v2ShadowControlState`, `v2ShadowCandidateUploads`, `v2ShadowContributionLedger`, `v2ShadowSourceFixtures`, `v2ShadowBoardInstances`, `v2ShadowPublicMapLeads`, `v2ShadowProjectionOutbox` |
| 更新 `v2-shadow-get-public-map-lead-detail` | `v2-shadow-get-public-map-lead-detail.zip` / `205f0244de750449cdba807f24013fe38eb2785484fa42e9c8b888cfc9dadab5` | `v2ShadowControlState`, `v2ShadowPublicMapLeads` |

`scripts/build-v2-shadow-candidate-runtime-artifacts.mjs` 与 `scripts/validate-v2-shadow-candidate-runtime-artifacts.mjs` 构建／验证七包；禁动态 collection 名、V1 function call/Storage access，所有 shadow boundary/flag/secret/caller 条件缺失时 fail closed。所有包 `deployed=false / cloudWrite=false`。

## 配置、secret、容量与 rollback

若以后单独批准，新函数级配置只允许 `ICHI_V2_SHADOW_BOUNDARY=synthetic_only`、`ICHI_V2_SHADOW_CANDIDATE_UPLOAD_ENABLED=false`、`ICHI_V2_SHADOW_CONTRIBUTION_ENABLED=false`、`ICHI_V2_SHADOW_TEST_CALLER_DIGESTS=""`。旧四个 `RESOLVE/HUMAN_ASSISTANCE/PROJECTOR/READ_ENABLED` 保持 `false`；allowlist 保持空。新 `ICHI_V2_SHADOW_UPLOAD_REF_HMAC_KEY` 仅生成/绑定于 upload function，值不在源码、日志、报告回显；principal HMAC 仅给可信 caller 函数，rehearsal HMAC 仅给 resolver/projector，cursor HMAC 仅给公开读函数，既有三把 key 不轮换。HA policy/cooldown/budget 保持未配置：`CANDIDATE_TEST_ONLY / PILOT_CALIBRATION_REQUIRED`，不冻结产品数值。没有新增 Storage、trigger、环境级规则或 V1 config。

| Secret / flag exact binding | Function |
| --- | --- |
| `ICHI_V2_SHADOW_UPLOAD_REF_HMAC_KEY` 新 secret；`ICHI_V2_SHADOW_CANDIDATE_UPLOAD_ENABLED=false` | `v2-shadow-submit-candidate-upload` |
| `ICHI_V2_SHADOW_PRINCIPAL_HMAC_KEY` 既有 shadow-only secret；`ICHI_V2_SHADOW_CONTRIBUTION_ENABLED=false` | `v2-shadow-manage-contribution` |
| `ICHI_V2_SHADOW_REHEARSAL_HMAC_KEY` 既有；`ICHI_V2_SHADOW_RESOLVE_ENABLED=false` | `v2-shadow-resolve-observation` |
| `ICHI_V2_SHADOW_PRINCIPAL_HMAC_KEY` 既有；`ICHI_V2_SHADOW_HUMAN_ASSISTANCE_ENABLED=false` | `v2-shadow-answer-assistance`, `v2-shadow-get-my-assistance` |
| `ICHI_V2_SHADOW_REHEARSAL_HMAC_KEY` 既有；`ICHI_V2_SHADOW_PROJECTOR_ENABLED=false` | `v2-shadow-reconcile-projection` |
| `ICHI_V2_SHADOW_PRINCIPAL_HMAC_KEY` 与 `ICHI_V2_SHADOW_CURSOR_HMAC_KEY` 既有；`ICHI_V2_SHADOW_READ_ENABLED=false` | `v2-shadow-get-public-map-lead-detail`；未更新的既有 query 函数保持原绑定。 |

所有列出的函数还要求 `ICHI_V2_SHADOW_BOUNDARY=synthetic_only`；凡调用可信 caller 的函数还要求空的 `ICHI_V2_SHADOW_TEST_CALLER_DIGESTS`，即未建立测试主体前不开放。新 upload function 同时需要既有 principal HMAC 和新 upload-ref HMAC，两把仅核对绑定存在，不回显值。

相对当前 shadow 资源：`+2 collection / +3 显式 index / +2 function / 更新5 function / +1 shadow-only secret`；授权后预计 shadow 为 11 collection／18 显式 index／8 function，整个环境约 24 collection／27 function。先前公开个人版上限为每环境 300 collection、每 collection 20 index、150 function，数量上未触顶；实际存储、函数调用、索引写入、共享 V1 配额及账单增量本轮未读回，不能承诺具体成本。新索引和 ledger 每次上传/删除增加写入与存储；需获批后只读核实套餐容量与账单。

相对**已作废旧提案**则多 1 collection、2 index、1 新函数、3 个更新函数和 1 把新 secret；旧单 owner collection/function 行为全部删除，不按旧方案追加迁移。

将来若另获回滚授权：先令所有 shadow flag=false、allowlist 空；如已有 PUBLIC 候选数据，先 hide/read-stop 并提高 epoch，再恢复已审核的旧 shadow 包；保留 tombstone/audit/evidence，不能复活或删除 V1。**本轮不执行 rollback mutation 或 cleanup。** V1 collection/function/index/config/Storage/trigger/ACL/resource mutation 必须为 0；不读取/复制真实 V1 private record。

## 验证、Git、Gate 与 Founder 后续批准清单

本地七包构建完成，静态 hash/allowlist/fail-closed 检查；项目范围 Vitest 为 987 passed/1 skipped（排除工作树外实验目录的 Node 专用文件）、项目脚本范围 ESLint、root/Web TS、workflow/contracts、Next build、微信 CLI preview、包体审计通过。无范围限制的 Vitest/ESLint 扫描拾取实验与历史产物而失败。Web Playwright 全套此前 25/26；单 worker 八次复跑为 3 PASS / 5 FAIL，按独立报告记为 accepted pre-existing flake，**不把 Web Playwright 写成 PASS**。本轮触及文件 Prettier、workflow、git diff-check PASS；全仓 Prettier 的既有生成/历史文件不进入本轮门。工作树含未提交既有改动，本轮未 commit/push/PR/merge/tag。external writes=`0`；本轮无新云端 baseline，`V1_DIFF=0` 只能引用此前 closeout，不能当本轮 read-back。

当前 `TASK-V2-19 = IN_PROGRESS / MULTI_CONTRIBUTION_AND_LINEAGE_LOCAL_READY / EXTERNAL_ACTION_APPROVAL_REQUIRED`，未 COMPLETE/HUMAN_APPROVED/FROZEN，TASK20 未开始。Founder 下一步若决定进入云端，应在逐包 SHA 重算、preflight/read-back 后**单独批准**：①创建上述两 collection 并设 ACL；②创建上述三精确 index；③部署两新函数、更新五既有 shadow 函数；④绑定列出的默认关闭函数配置和一把新 shadow-only HMAC secret。当前没有授权任何一步，也未授权 synthetic fixture 写入、migration、rollback、cleanup 或生产发布。
