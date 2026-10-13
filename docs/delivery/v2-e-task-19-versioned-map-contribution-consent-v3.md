# TASK-V2-19 v3 Versioned Map Contribution Consent

本报告记录 Founder 将候选合同从 v2 改为 v3 后的本地实现、candidate apply 与 read-back。v2 从未部署；v3 已在
`cloud1-d7gxqfwv783a1f131` 完成受限 shadow apply，TASK20 未开始。

## 本地实现

- 服务端新增 `map-contribution-consent.mjs`，以 `getWXContext()` 派生的 trusted principal digest 作为 owner key。
- `v2-shadow-manage-contribution` 提供 `GET_MAP_CONTRIBUTION_CONSENT` 与一次性 `ACCEPT_MAP_CONTRIBUTION_TERMS`；命令幂等、版本/ scope digest 过期即拒绝，不信任客户端 callerDigest，不读取 V1 `wechatIdentities` 或 profile。不存在 disable/withdraw consent API。
- projector 只在 `SHARE + current consent + verification/location/note/UGC gates PASS + ACTIVE` 时创建公开支持。
- 首次同意会为该用户已有 SHARE contribution 的 BoardInstance 建立 outbox，重新走当前审核/投影链；暂不同意不持久化 DENIED，其他用户的 ledger 不修改。
- “我上传的版面”恢复地图贡献条例卡片和“了解并同意”；记录列表保留查看/删除云端记录，不提供逐条发布/撤回。

## 验证

- targeted Vitest：4 files / 15 tests passed，覆盖前端条例入口、trusted consent GET/SET、stale version rejection、projector consent gate 和既有多贡献者删除路径。
- v3 build：7 个 Nodejs20.19 / `index.main` zip 生成。
- v3 static validator：`PASS: 7 candidate artifacts, hashes, allowlists and fail-closed guards`。
- v2→v3 exact delta 已写入 [v2 exact diff v3](v2-e-task-19-candidate-resource-exact-diff-v3.md)。当前 v3 manifest 不含任何 v2 artifact path；v2 manifest、proposal、七个 zip 均显式标记 `SUPERSEDED_DO_NOT_DEPLOY`。
- CloudBase read-back：新增 3 个 consent/lineage 相关 collection 中，v3 新增的 3 个 collection 均 `ADMINONLY`、count=0；6 个 consent/lineage explicit index 均存在，非 TTL、非 unique。7 个 v3 函数均为 `Active / Nodejs20.19 / index.main`，依赖安装启用；所有 flags=false、caller allowlist 为空，HMAC 只核对存在。V1 13 collection、43 index、19 function、ACL、Storage 与安全规则结构 diff=0。
- 真实 candidate rehearsal 尚未完成：CLI 没有可信微信 `getWXContext()`，不能用管理员调用或客户端字段替代。当前 shadow 停机为 `PUBLIC=0`、read-stop=true、HA pause=true；不把本地测试或关闭态探针写成远端正向 PASS。

## 最终状态

## Exact cloud action list (executed)

1. Create `v2ShadowMapContributionConsent` with `ADMINONLY / SERVER_ONLY` ACL.
2. Create the three v3 explicit indexes listed in the exact diff, while retaining the v2 candidate indexes.
3. Deploy the seven v3 artifacts from the v3-only manifest; do not use any v2 zip.
4. Bind `ICHI_V2_SHADOW_CONSENT_ENABLED=false`, current candidate terms version/scope policy, and keep every existing shadow flag false and caller allowlist empty.
5. Verify V1 diff remains zero and read back collection ACL, index support, function source/runtime/hash, config existence, and secret existence only.

These actions were executed under Founder approval. No synthetic fixture was written in this v3 apply, no migration rehearsal, cleanup, rollback, or production data access was performed. The next permitted step is a separately controlled rehearsal window with real trusted WeChat context; until then all flags remain fail-closed.

`TASK-V2-19 = IN_PROGRESS / CANDIDATE_APPLIED_READBACK_COMPLETE_REHEARSAL_BLOCKED`。

不得 COMPLETE、HUMAN_APPROVED、FROZEN，不开始 TASK-V2-20。下一步若获批仍需逐项 preflight、创建 v3 collection/index、部署 v3 包和 read-back；本报告不构成云端写入授权。
