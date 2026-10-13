# TASK-V2-19｜Phase B2-R2 pre-deploy gate

执行时间：2026-09-27，目标环境 `cloud1-d7gxqfwv783a1f131`。以下三项均为**部署前本地**门禁；本报告不把本地结果冒充真实 CloudBase synthetic rehearsal。场景名称逐字采用 canonical `docs/delivery/v2-e-task-19-phase-b2-synthetic-rehearsal.md` §7。

## Gate 1：12 个冻结场景逐项映射 — PASS（本地）

| # | Canonical 冻结场景 | 实际测试与断言 | 本地 |
| --- | --- | --- | --- |
| 1 | 同板连续 Observation 唯一安全延续 | `shared/persistence.test.mjs` 的 no-match→unique-match 持久 instance／association／outbox；`task-v2-10.test.ts` 的唯一延续 | PASS |
| 2 | 换箱/换套不错误延续 | `shared/board-instance-matrix.test.mjs` 同名测试：旧箱 0→新箱 2 返回 NO_MATCH | PASS |
| 3 | 同店不同版面不 merge | 同文件同名测试：同地不同 IP 的 verified facts 返回 NO_MATCH | PASS |
| 4 | 同店两张同款版面不按位置 merge | `shared/persistence.test.mjs` 同地同款两个独立 instance→第三次 Observation 保持 AMBIGUOUS；`task-v2-19-layered.integration.test.ts` 同地歧义 | PASS |
| 5 | 长期 AMBIGUOUS 保持不确定 | `shared/persistence.test.mjs` 同名补测：重复 resolver 后仍 AMBIGUOUS、无 association、仅一个 HA request | PASS |
| 6 | 后续证据自动消歧 | `shared/board-instance-matrix.test.mjs` 同名补测：后续 verified count 使原两候选只剩唯一兼容者；`shared/persistence.test.mjs` DIFFERENT 证据后自动重跑 resolver 写 versioned LINK | PASS |
| 7 | SAME_BOARD / DIFFERENT_BOARD / CANNOT_TELL / SKIP | `shared/persistence.test.mjs` 的四答案与 duplicate 测试；SAME hard-conflict 负测 | PASS |
| 8 | HA budget / cooldown / once-per-upload | `shared/persistence.test.mjs` 的 cooldown／budget policy 负测与“长期 AMBIGUOUS”一次上传仅一请求 | PASS |
| 9 | late/stale 不覆盖新状态 | `shared/projector-persistence.test.mjs` 的 sequence gap／late duplicate／retry；`task-v2-11.test.ts` late event；`shared/persistence.test.mjs` withdrawn/expired answer 拒绝 | PASS |
| 10 | retired/deleted/withdrawn 不 resurrection | `shared/projector-persistence.test.mjs` 的 withdrawn→retire、hide-first、旧 ID 碰撞拒绝；`task-v2-11.test.ts` 删除后保留其他 support、全部消失后退休且不复用 ID | PASS |
| 11 | `null != 0` | `shared/board-instance-matrix.test.mjs` 的 null→0 与 0→1；`task-v2-10.test.ts` source adapter 与 transition | PASS |
| 12 | Location 仅生成 candidate，不作为 identity truth | `shared/board-instance-matrix.test.mjs` 的同地不同 IP／同地双候选；`shared/persistence.test.mjs` 同地点两 instance 不 merge | PASS |

本次定向复跑：6 个测试文件、50 个测试全部通过。此前按一般边界条件命名的 12 条参考测试不能替代上述 canonical 12 场景；本表按 canonical 原名映射，并针对第 2、3、5、6 项补充了同名本地测试。上述 `PASS` 只表示本地测试覆盖，不是 CloudBase 远端 12 场景演练通过。

## Gate 2：最终本地检查 — PASS

- `npx prettier --check packages/v2-map/resources/shadow-functions scripts/build-v2-shadow-artifacts.mjs scripts/validate-v2-shadow-artifacts.mjs packages/v2-map/resources/cloudbase-shadow-function-artifacts-b2-r1.json`：PASS。
- `node scripts/validate-workflow.mjs`：PASS，8 个 required files。
- `git diff --check`：PASS。
- `node scripts/validate-v2-shadow-artifacts.mjs`：六包 static allowlist／forbidden API／解包 import 检查 PASS。

## Gate 3：六个 B2-R1 zip 与冻结报告逐项 SHA-256 — PASS

对每个 zip 重新计算 SHA-256，并同时与 `cloudbase-shadow-function-artifacts-b2-r1.json` 和 `v2-e-task-19-phase-b2-r1-shadow-function-remediation.md` §14 的报告值作三方相等比较：六项全部 PASS。确切 hash 与路径见该 manifest 和 B2-R1 报告；任何部署前再次计算不一致，必须立即停止。

**Pre-deploy gate 总结：三项全部 PASS，可以进入 Founder 本次授权的六函数更新部署与 shadow-only HMAC 轮换/绑定。**当前仍未部署 B2-R1、未写 synthetic data，四个 feature flag 远端保持 false、测试 caller allowlist 为空。下一步先做只读远端基线，再执行限定写入与下载回读。
