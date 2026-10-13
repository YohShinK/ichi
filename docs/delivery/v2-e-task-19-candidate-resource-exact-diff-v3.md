# TASK-V2-19 Candidate Resource Exact Diff v3

**状态：`CANDIDATE_APPLIED_READBACK_COMPLETE_REHEARSAL_BLOCKED`**  
**CloudBase mutation：已按 Founder 授权完成；rehearsal 未完成**  
**环境：`cloud1-d7gxqfwv783a1f131` / `ap-shanghai`**

## Founder 决策边界

v3 恢复“地图贡献条例”为用户级、版本化 consent。上传记录的 `SHARE` 仍只是本条记录的分享意图；不新增逐条 `ACCEPT`、`WITHDRAW`、发布或撤回。公开 eligibility 必须同时满足：`shareDecision=SHARE`、当前条例已同意、verification/location/note/UGC safety gates PASS、`contribution.lifecycle=ACTIVE`。关闭条例会让该用户全部 contribution 失去公开资格并投影重算；同一 BoardInstance 其他用户的 contribution 记录不被删除或撤销。

v2 的 diff、proposal、manifest 和七个 zip 均为 `SUPERSEDED_DO_NOT_DEPLOY`。v2 从未应用到 CloudBase，因此本轮没有 cleanup 或 rollback。

## v2 → v3 Delta

| 项目 | v2 | v3 | 变化 |
| --- | --- | --- | --- |
| 用户级 consent | 无 | `v2ShadowMapContributionConsent`，版本与 scope digest 由服务端策略提供 | 新增 |
| 公开 eligibility | SHARE + source/public gates | v2 条件 + 当前用户 consent | 新增 consent gate |
| consent API | 无 | `GET_MAP_CONTRIBUTION_CONSENT`、`ACCEPT_MAP_CONTRIBUTION_TERMS` | 新增于 `v2-shadow-manage-contribution` |
| consent 传播 | 无 | 首次 ACCEPT 为已有 SHARE uploads 创建当前审核链的重新投影 outbox | 一次性同意；没有 disable/withdraw |
| collection | 11 shadow | 12 shadow | `+1` |
| explicit index | 18 | 21 | `+3` |
| function 数量 | 8 | 8 | 不变；manage/projector allowlist 更新 |
| artifact 数量 | 7 v2 | 7 v3 | v2 全部废止，v3 全部重新生成 |
| feature flags | 既有 flags false | 增加 `ICHI_V2_SHADOW_CONSENT_ENABLED=false`；既有 flags 继续 false | fail-closed |
| HMAC | v2 secret contract | 不回显值；v3 未新增 secret | 不变 |

## Exact collection diff

新增 `v2ShadowMapContributionConsent`：`ADMINONLY / SERVER_ONLY`，client read/write=`false`，V1 production read=`NO`，仅 `SYNTHETIC_REHEARSAL`。状态文档保存 `ownerSubjectDigest`、不可逆 `accepted=true`、`acceptedTermsVersion`、`acceptedScopeDigest`、`acceptedAt`、`firstActionId`、`auditVersion`；事件文档只允许 append-only `ACCEPT_EVENT`。没有 `enabled=false`、disable、withdraw 或 per-record 发布/撤回字段。

现有 v2 collection `v2ShadowContributionLedger` 增加 owner fanout index；其余 v2 collection 结构不变。所有 V1 collection、function、index、config、Storage、trigger、ACL 保持 diff=`0`。

## Exact index diff

| collection | exact fields / order | unique | TTL-or-normal | purpose |
| --- | --- | --- | --- | --- |
| `v2ShadowMapContributionConsent` | `ownerSubjectDigest: 1, dataOrigin: 1` | `false` | `NORMAL_NO_AUTO_TTL` | trusted caller consent read and owner fanout |
| `v2ShadowMapContributionConsent` | `acceptedTermsVersion: 1, acceptedAt: -1` | `false` | `NORMAL_NO_AUTO_TTL` | versioned consent audit/read-back |
| `v2ShadowContributionLedger` | `ownerSubjectDigest: 1, kind: 1, dataOrigin: 1` | `false` | `NORMAL_NO_AUTO_TTL` | bounded fanout of one user's consent change |

v2 的原有 18 个 explicit index 保留在候选合同中；v3 新增以上 3 个。CloudBase automatic `_id_` unique index 仍不是显式 index action。

## Exact function contract

`v2-shadow-manage-contribution` 增加服务端身份派生的 consent GET/ACCEPT。ACCEPT 只接受服务端当前 `termsVersion` 与 `scopeDigest`，以 `commandId` 幂等；客户端 callerDigest、owner、OpenID 均不作为 authority。已接受主体不会返回任何关闭/撤回 API。`v2-shadow-reconcile-projection` 对每条 ledger STATE 读取对应 user consent，并要求当前版本匹配后才进入 `projectContributions`。所有函数继续固定 literal collection allowlist、无 V1 function call、无 Storage access、boundary/flag/secret/caller 条件缺失时 fail-closed。

## v3 artifact manifest

| function | artifact | SHA-256 |
| --- | --- | --- |
| `v2-shadow-submit-candidate-upload` | `packages/v2-map/resources/shadow-functions/artifacts/candidate-runtime-v3/v2-shadow-submit-candidate-upload.zip` | `f9424e56736eb49755e3062366982893b896776e8235d4ae580d393adcba50f8` |
| `v2-shadow-resolve-observation` | `packages/v2-map/resources/shadow-functions/artifacts/candidate-runtime-v3/v2-shadow-resolve-observation.zip` | `75cb5f946f050c93c4fbd9fdba9492a936f301f7c308e8ba98557ed364c87229` |
| `v2-shadow-answer-assistance` | `packages/v2-map/resources/shadow-functions/artifacts/candidate-runtime-v3/v2-shadow-answer-assistance.zip` | `1356ba91a2aeb4ec57cb9cd685c8102dac2feb4dc524b1c397eef8e03cb0eb3a` |
| `v2-shadow-get-my-assistance` | `packages/v2-map/resources/shadow-functions/artifacts/candidate-runtime-v3/v2-shadow-get-my-assistance.zip` | `4b635d9c2d16d7feb955097166f5c554ad4e3502d737ea58d5e9fd488bb30b22` |
| `v2-shadow-reconcile-projection` | `packages/v2-map/resources/shadow-functions/artifacts/candidate-runtime-v3/v2-shadow-reconcile-projection.zip` | `ef74a7671babd78c513ba1a4b24cc60554007e0f0dc3bffc87e9e1a6bd3ea098` |
| `v2-shadow-manage-contribution` | `packages/v2-map/resources/shadow-functions/artifacts/candidate-runtime-v3/v2-shadow-manage-contribution.zip` | `e32b947155fc93b106c16475fbb0ae2f3e7ae80a0f9ee7aaace460b756e52a7c` |
| `v2-shadow-get-public-map-lead-detail` | `packages/v2-map/resources/shadow-functions/artifacts/candidate-runtime-v3/v2-shadow-get-public-map-lead-detail.zip` | `205f0244de750449cdba807f24013fe38eb2785484fa42e9c8b888cfc9dadab5` |

The current deployable manifest is only `packages/v2-map/resources/cloudbase-candidate-runtime-artifacts-v3.json`; it contains no `candidate-runtime-v2` path. v2 zip bytes remain as historical evidence and are listed only in `cloudbase-candidate-runtime-artifacts-v2-superseded.json` with `SUPERSEDED_DO_NOT_DEPLOY`.

## Configuration and action gate

Initial v3 candidate values are `ICHI_V2_SHADOW_BOUNDARY=synthetic_only`, all existing shadow flags `false`, `ICHI_V2_SHADOW_CONSENT_ENABLED=false`, empty caller allowlist, and candidate policy version/digest bound only to shadow functions. HMAC values are not generated, printed, or placed in source; only future existence/binding checks are allowed. HA cooldown/budget remain `CANDIDATE_TEST_ONLY / PILOT_CALIBRATION_REQUIRED`.

## Applied CloudBase read-back

Founder 已授权并完成本轮 candidate apply。实际写入严格限于本合同：创建
`v2ShadowCandidateUploads`、`v2ShadowContributionLedger`、
`v2ShadowMapContributionConsent` 三个 `ADMINONLY` collection；创建上表 6 个显式
normal index；部署并更新 v3 manifest 的 7 个函数；生成并绑定 1 把
`ICHI_V2_SHADOW_UPLOAD_REF_HMAC_KEY`。7 个函数均回读 `Active / Nodejs20.19 /
index.main`，依赖安装已启用，关闭态调用能够加载运行时并 fail-closed。

三项新 collection 当前 count 均为 0，15 个既有 shadow explicit index 和 V1
资源未被修改。所有 shadow feature flag 为 `false`，caller allowlist 为空；HMAC
secret 仅核对存在，不记录值、摘要或身份原文。远端总量为 25 collection、27
function；没有新增 trigger、Storage 前缀或环境级规则。

v3 zip SHA-256 与 manifest 仍逐项相等；当前可部署清单只包含
`candidate-runtime-v3`。v2 manifest、proposal、zip 和 superseded manifest 继续
标记 `SUPERSEDED_DO_NOT_DEPLOY`。

真实 candidate rehearsal 仍未完成：CloudBase CLI 管理调用没有真实微信
`getWXContext()`，无法安全证明 trusted caller、consent GET/ACCEPT、HA 正向回答
及 public query/detail。没有用客户端伪造身份、V1 identity/profile 或管理员请求
冒充该证据。当前停机状态为 `PUBLIC=0`、`global:read-stop=true`、
`global:ha-pause=true`；不 cleanup、不 rollback、不开始 TASK-V2-20。
