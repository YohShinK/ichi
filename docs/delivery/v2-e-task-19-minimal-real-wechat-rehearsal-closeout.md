# TASK-V2-19｜极简真实微信 Rehearsal 收口

执行日期：2026-09-29。环境：`cloud1-d7gxqfwv783a1f131 / ap-shanghai`。本报告记录一次最小真实微信 rehearsal、地图失败根因修复和安全停机；不开始 TASK-V2-20。

## 1. 结论

本轮三条必需正向链均有证据：

1. 账号 A 的地图贡献条例 GET/ACCEPT 已由服务端持久化为当前 v3 terms，重复 ACCEPT 保持幂等。
2. 真实微信 `wx.cloud.callFunction` 已成功完成 candidate map query 和 detail；用户确认“地图显示并可打开详情”。
3. 一次代表性 Human Assistance 正向回答和重复提交幂等复用 B2-R4 的真实 caller 证据，答案持久化且不影响上传成功。

Founder 于 2026-09-29 完成最终人工验收：`TASK-V2-19 = COMPLETE / HUMAN_APPROVED / FROZEN`；`TASK-V2-20 = READY / NOT_STARTED`。人工验收不改变下文对未重跑项目的技术证据边界。

## 2. Founder 操作与结果

### 2.1 地图贡献条例

A 在“我的 → 我上传的版面”完成条例同意。`v2-shadow-manage-contribution` 日志返回 `accepted=true`、`status=ACCEPTED`、terms 为 `candidate-map-contribution-v3`；`v2ShadowMapContributionConsent` 保留 consent ledger 与 event 两条 synthetic audit 行。服务端没有读取 V1 identity/profile。

### 2.2 地图 query/detail

首次真实 query 返回 `ok=true`，但小程序仍显示不可用。根因是唯一 synthetic PUBLIC row 的 `publicLeadId` 实际为 **38 位**，而 [candidate adapter](../../apps/client/miniprogram/platform/public-map-candidate-service.ts) 严格要求 **32 位小写 hex**，所以成功响应在客户端被安全地转换成 `SERVICE_UNAVAILABLE`。

修复只更新了 `v2ShadowPublicMapLeads` 这一条 synthetic row 的 `publicLeadId` 字段为合法 32 位 hex；没有改函数源码、V1 资源或正式业务数据。修复后：

- query：真实微信调用，`status=200`、`ok=true`、返回 1 个 marker；
- detail：真实微信调用，`status=200`、`ok=true`、返回 1 个 detail；
- 用户复试结果：**地图显示并可打开详情**；
- query/detail 日志均来自微信客户端路径，非管理员伪造调用；
- 公开响应只含 allowlist 字段，`PRIVATE_LEAKAGE=0`。

### 2.3 Human Assistance

复用 B2-R4 的真实 A caller 证据：`SAME_BOARD` 已回答并持久化，重复提交返回 `duplicate=true`；此前 `DIFFERENT_BOARD`、`CANNOT_TELL` 也各有一条 evidence。`SKIP` 和 B 的正向回答不在本次最小窗口重跑，按命令复用历史 R4 边界，不把它们写成新正向 PASS。

## 3. 临时动作与数据边界

- 临时启用的入口仅限 candidate upload、consent、resolve、HA、projector、read；测试 caller allowlist 仅在窗口内存在，结束时清空。
- 本轮修复写入：1 条 `v2ShadowPublicMapLeads` synthetic row；控制状态 `global:ha-pause`、`global:read-stop` 和 `global:read-epoch`；各 shadow function 的临时 flag/allowlist。
- 未创建 collection/index/function/Storage/trigger；未执行 migration、rollback、cleanup；未复制、读取或修改 V1 private record。
- HMAC secret 只核对存在和绑定关系，未回显值；principal digest 仅在云端 allowlist/ledger 内使用，报告不回显。
- 所有数据均为 `SYNTHETIC_REHEARSAL`，保留作为 evidence/tombstone。

## 4. 最终安全停机 read-back

- 8 个现有 v3 shadow function 均 `Active / Available / Nodejs20.19 / index.main / timeout=10s / 0 trigger`。
- 所有 `*_ENABLED=false`，包括 candidate upload、resolve、HA、projector、consent、contribution、read；所有 `ICHI_V2_SHADOW_TEST_CALLER_DIGESTS` 为空。
- `global:ha-pause.paused=true`；`global:read-stop.stopped=true`；`global:read-epoch.epoch=5`。
- `v2ShadowPublicMapLeads` 中 `lifecycleState=PUBLIC` 数量为 `0`；测试 row 保留为 hidden audit row。
- 12 个 shadow collection、显式 indexes、8 个 shadow function、HMAC bindings 保留；不删除 candidate 资源。
- V1 13 collection、43 index、19 function、ACL、Storage、trigger、环境规则结构与既有 baseline 一致，`V1_DIFF=0`。本轮没有任何 V1 mutation。

## 5. P0/P1 与证据边界

本次限定窗口：`P0=0`、`P1=0`、`PRIVATE_LEAKAGE=0`、`V1_DIFF=0`。未重跑的完整矩阵仍按历史报告保留边界：B 账号正向回答、SKIP、完整四答案矩阵和后续 migration 不属于本轮证明范围。V1 草稿左滑 Playwright 的历史 timing-sensitive flake 继续按 accepted pre-existing flake 记录，不修改 V1 业务。

## 6. 自动门

- `corepack pnpm test`：991 passed / 1 skipped；
- `corepack pnpm lint`：PASS；
- `corepack pnpm typecheck`：PASS；
- `node scripts/validate-workflow.mjs`：PASS；
- touched-scope Prettier：PASS；
- `git diff --check`：PASS；
- CloudBase function/config/collection/control/public read-back：PASS。

TASK-V2-20 未开始。本轮最终验收记录仅更新本地文档，未执行新的 CloudBase mutation、commit 或 push。
