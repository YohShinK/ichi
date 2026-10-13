# TASK21 tcbContext 最小修复确切差异与冻结 SHA

2026-10-01 后续独立授权部署已执行：唯一9a9冻结ZIP未变、report远端16/16 source/config/SHA回读PASS，真实微信D命令链已成功观测；另行授权的按钮前端修订及后续真机/幂等/threshold/最终safe-stop正在推进。最新状态见v2-e-task-21-report-tcb-context-repair-deploy-closure.md；下方NOT_DEPLOYED为本地冻结阶段历史，不代表当前远端状态。

2026-10-01：LOCAL_VERIFIED / ARTIFACT_FROZEN / NOT_DEPLOYED / STOPPED。Founder 已批准本文件唯一差异的本地构建和验证；本次明确不包含 CloudBase 部署。原拟议未构建状态由此轮实测冻结结果取代，诊断及已部署旧包不覆盖。

## 确定触发条件与唯一代码差异

上轮 Founder A 唯一真实 GET_STATE 请求 f52f2d7b-5ef9-4983-b8e5-1005ca5351c0：BUSINESS_FIELDS，extraKeyCount=1、extraKeys=[tcbContext]，leadValid/commandValid/actionValid 均 true。诊断客户端没有发送该字段，入口只剥离 userInfo，导致剩余传输字段被当未知业务字段拒绝。证据见 [独立诊断报告](v2-e-task-21-report-structure-diagnostic-result.md)。

唯一产品源码文件：`packages/v2-map/resources/shadow-functions/v2-shadow-report-public-map-lead/runtime.mjs`。相对批准、已部署的 b100诊断 runtime，唯一差异：

```diff
     event = Object.fromEntries(
-      Object.entries(event).filter(([key]) => key !== "userInfo"),
+      Object.entries(event).filter(
+        ([key]) => key !== "userInfo" && key !== "tcbContext",
+      ),
     );
```

身份仍只来自既有 cloud.getWXContext；这两个字段的内容不提供身份或资格。其余未知字段仍严格拒绝。诊断 helper、能力令牌、业务格式、资格/rate、transaction/count/audit、幂等、policy、threshold=10及hidden latch、public contract和projector不改。

新增18项必要回归只写入同目录 runtime.test.mjs，测试文件不入 ZIP。唯一候选 artifact 为既有举报函数，16文件仅runtime变化，15其它文件逐字节等同b100包；0 collection/index/new function/secret/trigger/layer/Storage/V1 变更。其它8函数源实现和冻结artifact不改。

## 实测冻结边界

| 项目                        | 实测值                                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 基线已批准诊断 ZIP          | b10054298bfc04d81318935750084675b3876dc82ec689b325911f3818908962                                                                           |
| 基线 packaged runtime       | c4be1cf64ce4f584ad6116d0daf57bfa31681c2fcef120dc41c727afa14d32c6                                                                           |
| 新修复 ZIP SHA-256          | 9a9a96a14e3ed314bae6147094fa26539f055239bf6c185039a79253c0c5c6cd                                                                           |
| 新 packaged runtime SHA-256 | 7e2e253bf390b628b6d73c8eef96cb1e5db2ba79b83b5e7d45ac21e8f686e2a1                                                                           |
| 新 source runtime SHA-256   | 3a1da88252b1d3f129861e9738f7b005ffb7d695b251d1ff9f3fed466566b39e                                                                           |
| 反向解包／复现压缩          | 16/16一致／相同ZIP SHA                                                                                                                     |
| 新 ZIP 路径                 | artifacts/task21/final-cloud-rehearsal-20260930/repair-apply-retest-20261001/tcb-context-repair-build/v2-shadow-report-public-map-lead.zip |
| 状态                        | LOCAL_VERIFIED_FROZEN_NOT_DEPLOYED_STOPPED                                                                                                 |

旧建议 abf885 packaged runtime SHA 是未冻结推算，其缩进与批准diff格式不一致；首轮构建保护检查阻止打包后，按批准diff逐字核对并实测更正为上表。业务差异没有增加。旧推算、原b100及cd4均不能当新修复部署SHA。

构建 stage、ZIP及manifest.json、SHA256SUMS、runtime-exact.diff、artifact-validation-result.json、validation-summary.json 独立保存。ZIP和16个stage文件只读，原9包和已批准b100/CD4包均不覆盖。实际验证详情见 [构建与冻结报告](v2-e-task-21-report-tcb-context-repair-build-validation.md)。

## 已完成回归

真实观察到的传输键结构以合成字段值回放：userInfo、tcbContext、两者同时存在，覆盖读取／举报→取消→再举报→再取消、ACTIVE/CANCELLED、distinct count、audit、replay及迟到action；其它未知/伪造字段拒绝，不可信 WXContext无法借传输字段授权。flag/read-stop/boundary/policy/allowlist五关闭门都无数据库写入。全部既有举报helper附带两种字段，9→10自动隐藏、取消回9不恢复、公开读取隐藏、cursor失效、projector不复活及回滚等完整回归通过。

定向4文件50 PASS；举报运行时34 PASS，实际解包runtime复跑34 PASS；全仓1068 PASS/1既有SKIP；Lint、双TS、contracts/workflow、Next build、9包validator、解包/hash/源码allowlist/关闭态检查PASS。用户真实字段值未记录；这些是本地及包级自动验证，修复后新真机链尚未执行。

## 明确停止，不包含部署

本轮 CloudBase管理写入0，未invokeFunction、未开真机窗口；只读确认9函数全部关闭/caller空且远端代码SHA不变、read-stop=true、HA pause=true、epoch31、PUBLIC0、12authority失效、ledger24/B0未变，V1本地149文件hash0diff。

按用户要求，新ZIP和校验结果冻结后已停止并回报，不自行部署、不请求扫码、不扩展其它函数、资源、V1或threshold语义。若之后有新的独立部署授权，审批对象必须是本文件差异与上表新ZIP SHA；部署后需要立即source/config/read-back及真实举报→取消→再举报→再取消复测，最后恢复safe-stop。本文件本身不授予该云端行动。

当前真实业务P1仍1，closure NOT_PASS / REPORT_REPAIR_LOCAL_VERIFIED_DEPLOYMENT_APPROVAL_REQUIRED；TASK21 IN_PROGRESS / PRE_PILOT_CLOSURE，TASK22 LOCKED / NOT_STARTED。
