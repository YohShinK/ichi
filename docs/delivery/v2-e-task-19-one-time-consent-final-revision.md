# TASK-V2-19 One-time Map Contribution Consent: Final Revision

日期：2026-09-28  
环境：`cloud1-d7gxqfwv783a1f131 / ap-shanghai`  
状态：`IN_PROGRESS / CANDIDATE_APPLIED_READBACK_COMPLETE_REHEARSAL_BLOCKED`

## Contract

Consent 是用户级、版本化、一次性事实：`NOT_ACCEPTED -> ACCEPTED`。服务端只通过
`getWXContext()` 派生 owner subject digest；客户端传入的 callerDigest、accountId、
OpenID 不具备授权意义。接口只有 `GET_MAP_CONTRIBUTION_CONSENT` 和
`ACCEPT_MAP_CONTRIBUTION_TERMS`，不存在 disable、withdraw 或逐条 publish/withdraw。

公开资格必须同时满足 `SHARE`、当前 consent、verification/location/note/UGC safety
gates、`ACTIVE` contribution 和当前 source/version。首次 ACCEPT 对同一用户已有的
SHARE synthetic upload 重新建立投影 outbox，不绕过当前审核链；DO_NOT_SHARE 永不
因 consent 自动公开；同一 BoardInstance 的其他用户 contribution 不受影响。

## Local changes

- `map-contribution-consent.mjs`：不可逆 STATE、append-only `ACCEPT_EVENT`、版本/scope 校验和幂等。
- manage/projector runtime：trusted owner、consent gate、历史 SHARE 重新投影。
- miniprogram：条例卡片仅在 NOT_ACCEPTED 显示；“了解并同意/同意并开启”；同意后永久隐藏；保留记录查看与删除，不提供逐条发布/撤回。
- `v2-e-task-19-candidate-resource-exact-diff-v3.md`、proposal/manifest v3 已同步实际 apply 状态。
- v2 proposal、manifest、artifact 和七个 zip 保持 `SUPERSEDED_DO_NOT_DEPLOY`；本次未使用任何 v2 artifact。

## Verification

- shadow persistence/consent tests：`43/43 PASS`。
- full Vitest：`98 files passed, 1 skipped; 991 passed, 1 skipped`。
- TypeScript、ESLint、contracts、workflow、touched-scope Prettier、`git diff --check`：PASS。
- Next production build：PASS；Web Playwright：`26/26 PASS`。
- v3 artifact validator：`7 candidate artifacts, hashes, allowlists and fail-closed guards PASS`。
- `pnpm audit --prod`：未通过，报告仓库既有 72 个依赖漏洞；本轮未升级依赖。

## External boundary

v3 apply 已创建 3 个 `ADMINONLY` collection、6 个显式 normal index，部署/更新 7 个
v3 functions，并生成绑定 1 把新的 upload HMAC。三项新 collection count=0；所有
shadow flags=false、caller allowlist 空；HA cooldown/budget 仍为
`CANDIDATE_TEST_ONLY / PILOT_CALIBRATION_REQUIRED`。HMAC 只报告存在性，不记录值、摘要或 OpenID。

部署初次使用 `install-dependency=false` 时关闭态探针暴露 `wx-server-sdk` 缺失；已用同一
SHA 核对的 v3 zip 重新部署并启用依赖安装。修复后 7 个函数均可加载且关闭态 fail-closed。

V1 read-back：13 collection、43 index、13 ACL、19 function、既有 trigger、Storage 根
项、环境规则和名称集合均与冻结 baseline 一致，`V1_DIFF=0`。未读取 V1 private records，
未写 V1 collection/function/index/config/Storage/trigger/ACL。

## Stop state

CloudBase CLI 管理调用没有真实微信 `getWXContext()`，因此本轮无法证明真实小程序的
trusted consent GET/ACCEPT、HA 正向回答或 public query/detail。未用管理员调用、客户端
身份字段或 V1 identity/profile 冒充证据。当前 `PUBLIC=0`、`global:read-stop=true`、
`global:ha-pause=true`；不 cleanup、不 rollback、不开始 TASK-V2-20。

`TASK-V2-19` 保持 `IN_PROGRESS`，不得标记 `COMPLETE/HUMAN_APPROVED/FROZEN`。
