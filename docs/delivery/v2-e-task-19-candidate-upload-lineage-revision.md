# TASK-V2-19｜Candidate Upload → HA 同源 lineage 修订

> 2026-09-28 后续验证：V1 草稿左滑 Playwright 8 次 3 PASS / 5 FAIL，V1 执行路径与 HEAD 一致；依 Founder 本轮门禁将该既有 flaky 测试列为 accepted exception，详见 [独立 trace 报告](v2-e-task-19-local-validation-flake-acceptance.md)。本轮触及文件 Prettier、workflow、diff-check PASS；下方 `LOCAL_VALIDATION_BLOCKED` 为当时快照，当前 gate 为 `MULTI_CONTRIBUTION_AND_LINEAGE_LOCAL_READY / EXTERNAL_ACTION_APPROVAL_REQUIRED`。

日期：2026-09-28。阶段：本地候选，尚未部署或真机验证。

## Pre-state 与废止合同

此前正式 V1 上传成功态不能与 shadow synthetic HA request 共享可信 record/version；旧 get-my 方案可从 fixture 推导一个 ref，却无法证明同一原始上传。客户端 V1 `recordId`、自报 owner/version 不可充当 shadow authority。旧单 owner／二次 `ACCEPT/WITHDRAW` 提案已作废。

## 本地链路与文件

`packages/v2-map/resources/shadow-functions/v2-shadow-submit-candidate-upload/{index.js,runtime.mjs}` 新增 candidate-only synthetic 上传：缺失/关闭 flag 直接拒绝；服务端 `getWXContext()` 经既有 principal HMAC 得到 subject digest，核对 fixture owner、origin、current version 和 VerifiedBoard，再用新的 shadow-only upload-ref HMAC 生成不含 V1 ID 的 `candidateRecordRef`。相同主体和版本重试返回同一记录；跨账号、改动分享决定、过期版本及伪造 ref 被拒绝。`v2ShadowCandidateUploads` 保存原始上传事实、版本、分享决定和删除 tombstone。

`v2-shadow-resolve-observation` 只接受当前 observation 对应的一条 server-issued upload，继而做 Verification→VerifiedBoard→BoardInstance；AMBIGUOUS request 携带同一 ref/version。`v2-shadow-get-my-assistance` 仅向可信本人返回仍当前的 ref/version；`v2-shadow-answer-assistance` 同时核对 request、upload、主体、ref、version、expiry、once-per-upload/idempotency，并把四种回答仅记为 evidence，不覆盖 hard conflict。SAME 消歧后可激活 contribution。`v2-shadow-reconcile-projection` 继续复验同一 fixture/upload/version，再按有效贡献集合投影。HA 失败或 SKIP 不回滚上传成功。

`apps/client/miniprogram/platform/candidate-upload-service.ts` 与 `pages/home/index.ts` 只在 develop/trial 测试路径使用固定 shadow function；release/未知环境 fail closed。上传成功态和「我的 → 我上传的版面」共享候选 ref/version；`human-assistance-client.ts` 仅在本机已知同一候选版本时展示 request，no-request/expired/answered/withdrawn/version-changed 安全消失。V1 正式上传、识别、删除继续使用原 V1 业务链，没有接读真实 V1 private data；production bridge 延后既有门禁。

## 验证、失败与修正

`v2-shadow-submit-candidate-upload/runtime.test.mjs` 测试 server ref、幂等和安全拒绝；`shared/persistence.test.mjs` 用真实候选 upload 启动 resolver→HA get-my/answer，覆盖 forged ref/version 与 stale；`candidate-upload-service.test.ts` 和 `index.v2-contribution-lineage.test.ts` 覆盖双入口匹配、V1 上传成功不受 HA 影响、release/unknown fail closed。项目范围 Vitest 为 987 passed/1 skipped（排除工作树外实验目录的 Node 专用文件）；root/Web TS、项目脚本范围 ESLint、Next build、微信 CLI preview、包体审计通过。无范围限制的 Vitest/ESLint 扫描拾取实验与历史产物而失败。Web Playwright V1 草稿左滑用例独立复跑仍失败（全量 25/26）；全仓 Prettier 历史/生成文件不合规，故完整本地 gate 未通过。没有 CloudBase/真机 lineage 正向证据，不能把本地模拟当端到端验收。

## 写入、状态及待批准动作

external writes=`0`，V1 云端资源 mutation=`0`，V1 private read=`0`；未执行新的 V1 baseline read-back。工作树已有未提交变更，本轮未 commit/push/PR/merge/tag。当前 `TASK-V2-19 = IN_PROGRESS / MULTI_CONTRIBUTION_AND_LINEAGE_LOCAL_VALIDATION_BLOCKED / EXTERNAL_ACTION_APPROVAL_REQUIRED`，未 COMPLETE/HUMAN_APPROVED/FROZEN，TASK20 未开始。先修复/解释回归门；Founder 下一步若要云端验证，须逐项批准 [新 exact cloud diff](v2-e-task-19-candidate-resource-exact-diff-v2.md) 中的两 collection、三 index、两新函数、五更新函数、配置和一把新 secret，且另行授权 synthetic rehearsal。当前均未执行。
