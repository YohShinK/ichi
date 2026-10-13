# TASK-V2-19 Final Consolidated Report

日期：2026-09-28  
环境：`cloud1-d7gxqfwv783a1f131 / ap-shanghai`  
最终状态：`IN_PROGRESS / AWAITING_FOUNDER_REHEARSAL_DECISION`  
TASK-V2-20：`READY / NOT_STARTED`

## 1. 一次性地图贡献条例

Consent 是用户级、版本化、不可撤回的状态机：`NOT_ACCEPTED -> ACCEPTED`。
服务端通过 CloudBase `getWXContext()` 派生 owner subject digest；客户端传入的
`callerDigest`、`accountId`、OpenID 不具备授权意义。

唯一接口：`GET_MAP_CONTRIBUTION_CONSENT`、`ACCEPT_MAP_CONTRIBUTION_TERMS`。不存在
disable、withdraw 或逐条 publish/withdraw。公开资格必须同时满足：

`SHARE + 当前 consent + verification/location/note/UGC safety gates PASS + ACTIVE contribution`。

首次 ACCEPT 会让已有 SHARE synthetic upload 重新进入当前审核/投影链；DO_NOT_SHARE
不会因 consent 自动公开；同一 BoardInstance 的其他用户 contribution 不受影响。

## 2. 本地产品与运行时变更

- 新增 consent ledger、版本/scope 校验、ACCEPT 幂等和 append-only `ACCEPT_EVENT`。
- projector 增加当前 consent gate。
- “我上传的版面”仅在未同意时显示条例卡片；同意后永久隐藏。
- 记录列表仅查看和删除云端记录，不提供逐条发布/撤回。
- v2 proposal、manifest、artifact 和七个 zip 均标记 `SUPERSEDED_DO_NOT_DEPLOY`。
- 当前可部署清单只包含 v3 artifact。

## 3. CloudBase Candidate Apply

Founder 授权后，实际云端写入严格限定为：

1. 新增 3 个 `ADMINONLY / SERVER_ONLY` collection：`v2ShadowCandidateUploads`、
   `v2ShadowContributionLedger`、`v2ShadowMapContributionConsent`。
2. 新增 6 个显式 normal、non-unique、non-TTL index：
   - CandidateUploads：`ownerSubjectDigest:1,dataOrigin:1`；
     `observationVersionId:1,ownerSubjectDigest:1,lifecycle:1,dataOrigin:1`
   - ContributionLedger：`boardInstanceId:1,kind:1,dataOrigin:1`；
     `ownerSubjectDigest:1,kind:1,dataOrigin:1`
   - MapContributionConsent：`ownerSubjectDigest:1,dataOrigin:1`；
     `acceptedTermsVersion:1,acceptedAt:-1`
3. 部署/更新 7 个 v3 function：

| Function | SHA-256 |
| --- | --- |
| `v2-shadow-submit-candidate-upload` | `f9424e56736eb49755e3062366982893b896776e8235d4ae580d393adcba50f8` |
| `v2-shadow-resolve-observation` | `75cb5f946f050c93c4fbd9fdba9492a936f301f7c308e8ba98557ed364c87229` |
| `v2-shadow-answer-assistance` | `1356ba91a2aeb4ec57cb9cd685c8102dac2feb4dc524b1c397eef8e03cb0eb3a` |
| `v2-shadow-get-my-assistance` | `4b635d9c2d16d7feb955097166f5c554ad4e3502d737ea58d5e9fd488bb30b22` |
| `v2-shadow-reconcile-projection` | `ef74a7671babd78c513ba1a4b24cc60554007e0f0dc3bffc87e9e1a6bd3ea098` |
| `v2-shadow-manage-contribution` | `e32b947155fc93b106c16475fbb0ae2f3e7ae80a0f9ee7aaace460b756e52a7c` |
| `v2-shadow-get-public-map-lead-detail` | `205f0244de750449cdba807f24013fe38eb2785484fa42e9c8b888cfc9dadab5` |

4. 生成并绑定 1 把 `ICHI_V2_SHADOW_UPLOAD_REF_HMAC_KEY`；secret 只核对存在，未记录值、摘要或 OpenID。
5. 保持 `synthetic_only`、所有 feature flags=false、caller allowlist 为空；HA cooldown/budget 仍为 `CANDIDATE_TEST_ONLY / PILOT_CALIBRATION_REQUIRED`。

部署过程中发现依赖未安装会导致 `wx-server-sdk` 缺失，随后使用同一份已核对 SHA 的
v3 zip 以 `install-dependency=true` 重新部署。修复后 7 个函数均能加载运行时并在关闭态 fail-closed。

## 4. CloudBase Read-back

- 总资源：25 collections、27 functions；shadow boundary 为 12 collections、8 functions。
- 3 个新 collection count 均为 0，ACL 均为 `ADMINONLY`。
- 7 个 v3 function 和既有 query function 均为 `Active / Nodejs20.19 / index.main`，依赖安装启用，0 trigger。
- 所有 shadow flags=false，caller allowlist 为空；HMAC 仅确认存在。
- `PUBLIC=0`、`global:read-stop=true`、`global:ha-pause=true`。
- 未写 synthetic fixture、未执行 migration、cleanup 或 rollback。

V1 frozen boundary read-back：13 collection、43 index、13 ACL、19 function、既有
trigger、Storage 根项、环境规则和名称集合均与 baseline 一致，`V1_DIFF=0`。
未读取或修改 V1 private records、collection、function、index、config、Storage、trigger 或 ACL。

## 5. 自动验证

- Full Vitest：98 files，991 passed，1 skipped。
- Shadow persistence/consent：43/43 passed。
- ESLint、root/Web TypeScript、contracts、workflow：PASS。
- Touched-scope Prettier、`git diff --check`：PASS。
- Next production build：PASS。
- Web Playwright：26/26 PASS。
- v3 artifact validator：7 artifacts、hash、allowlist、fail-closed guard PASS。
- `pnpm audit --prod`：报告仓库既有 72 个依赖漏洞；本轮未升级依赖。

## 6. Rehearsal 阻断

本轮没有完成真实小程序正向 rehearsal。CloudBase CLI/admin invocation 不携带真实微信
`getWXContext()`，因此无法安全证明：

- trusted consent GET/ACCEPT；
- `SAME_BOARD / DIFFERENT_BOARD / CANNOT_TELL / SKIP` 的远端正向回答；
- A/B 跨账号拒绝与伪造身份负测；
- 真实 `wx.cloud.callFunction` 的 public query/detail。

没有使用管理员调用、客户端身份字段、V1 `wechatIdentities`、V1 profile 或 V1 private
record 填补证据缺口，也没有把本地 synthetic 测试冒充远端 PASS。

## 7. 停止状态

候选资源和历史 rehearsal evidence 保留；没有 cleanup、rollback、migration、正式发布或
TASK-V2-20。当前保持：

`TASK-V2-19 = IN_PROGRESS / AWAITING_FOUNDER_REHEARSAL_DECISION`

不得标记 `COMPLETE`、`HUMAN_APPROVED` 或 `FROZEN`。

过程证据：

- `v2-e-task-19-one-time-consent-final-revision.md`
- `v2-e-task-19-candidate-cloud-apply-and-rehearsal.md`
- `v2-e-task-19-candidate-resource-exact-diff-v3.md`
- `v2-e-task-19-versioned-map-contribution-consent-v3.md`
