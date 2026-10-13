# TASK21 tcbContext 最小举报修复构建与冻结报告

2026-10-01：LOCAL_VERIFIED / ARTIFACT_FROZEN / NOT_DEPLOYED / STOPPED。Founder 本轮只批准按唯一 exact diff 构建和验证，明确不包含 CloudBase 部署。所有要求的本地及实际解包函数回归完成后已冻结并停止；未发送新的真实微信请求，未开启测试入口。

## 唯一源码修改与授权边界

举报入口在业务字段校验前，同时剥离 `userInfo` 与 `tcbContext`。唯一产品代码差异位于 `packages/v2-map/resources/shadow-functions/v2-shadow-report-public-map-lead/runtime.mjs`；既有传输字段过滤增加 `key !== "tcbContext"`。身份仍只使用既有 `cloud.getWXContext()`，保留其它未知业务字段拒绝、资格、rate、所有事务/count/audit/幂等、policy及threshold语义。诊断 helper 和日志边界没有改变。

增加回归仅写入同目录 runtime.test.mjs，不入部署包；其它函数、共享实现、阈值实现、资源配置和 V1 源码未改。采用独立构建目录，原9个冻结 ZIP、b100诊断 ZIP和先前cd4修复包未覆盖。

## 新冻结 artifact

| 项目                              | 冻结结果                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| ZIP SHA-256                       | 9a9a96a14e3ed314bae6147094fa26539f055239bf6c185039a79253c0c5c6cd                      |
| 源码 runtime SHA-256              | 3a1da88252b1d3f129861e9738f7b005ffb7d695b251d1ff9f3fed466566b39e                      |
| 包内 runtime SHA-256              | 7e2e253bf390b628b6d73c8eef96cb1e5db2ba79b83b5e7d45ac21e8f686e2a1                      |
| 对比已批准 b100 包                | 16文件，只有runtime变化，另外15个逐字节一致                                           |
| 反向解包                          | 16/16与构建 stage 一致，文件列表没有增加                                              |
| 再次独立压缩                      | 相同固定时间、文件顺序和内容产生相同 ZIP SHA                                          |
| artifact validator                | 9/9包 hash、源码、collection allowlist、runtime/dependency、动态环境及关闭态检查 PASS |
| Runtime / Handler                 | Nodejs20.19 / index.main；原 package.json 与配置约束不变                              |
| 新资源 / CloudBase管理写入 / 部署 | 0 / 0 / 未部署                                                                        |

旧建议的 packaged runtime SHA `abf885...` 只是未冻结的文本推算，使用了不一致的缩进。首轮构建保护检查发现此差异后未生成包，重新逐字核对本轮批准的 diff 格式，仅规范该处缩进并重新计算实际 SHA；最终源码差异仍完全等于批准 diff。上述实测新 SHA 是唯一冻结对象；没有把旧推算或 b100 诊断 SHA 当修复包 SHA。runtime-exact.diff 保存完整实际差异。

ZIP和16个stage文件均设为只读；SHA256SUMS、manifest.json、artifact-validation-result.json 和 validation-summary.json 保留独立冻结及验证记录。冻结不代表已获部署授权。

## 必要回归与证据等级

采用上轮唯一真实微信诊断已确认的字段键结构：额外键 tcbContext，业务参数检查均通过。字段内容使用合成测试值；此前禁止记录的真实 tcbContext/userInfo 内容没有读取、保存或复制。本轮“真实结构回放”是本地回归，不是修复后新真机 PASS。

| 验证                                | 实际结果                                                                                                             |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 修复前故障复现                      | 三组传输字段用例失败；userInfo用例在后续同时带两字段的身份读取失败，tcbContext/两字段用例在首次读取即INVALID_REQUEST |
| 修复后定向集成回归                  | 4文件，50/50 PASS                                                                                                    |
| 新增用例                            | 18项：3传输字段组合、8未知/伪造业务字段、2不可信身份场景、5安全关闭门                                                |
| 举报运行时完整回归                  | 34/34 PASS                                                                                                           |
| 实际 ZIP 解包后运行同一完整举报回归 | 34/34 PASS；主函数来自解包后的runtime和core，其他依赖只读取原源文件                                                  |
| 全仓 Vitest                         | 1068 PASS、1既有SKIP；101文件PASS、1文件SKIP                                                                         |
| 全仓 Lint / Root与Web TypeScript    | PASS / PASS                                                                                                          |
| contracts / workflow / Next build   | PASS / PASS / PASS                                                                                                   |

三个组合分别是 userInfo、tcbContext、两者同时存在，均覆盖 GET_STATE、举报→取消→再举报→再取消。伪造的传输身份不能冒充另一可信账号；report state及每条 audit 都只属于实际 WXContext 主体，另一账号读取仍未举报。授权名单外或 WXContext获取失败时，伪造字段无法授权，数据库不被访问。

同 action replay 不新增 audit/count；新 action重复举报只记duplicate audit，不增distinct count；取消后延迟旧举报 action不能恢复 ACTIVE。四次本地语义转换保持 ACTIVE→CANCELLED→ACTIVE→CANCELLED，count为1→0→1→0。其它未知字段、伪造资格/threshold/角色/identity、近似拼写 tcbcontext及userInfoCopy仍 INVALID_REQUEST，无持久化变化。

全部既有 helper 举报调用也附带两种传输字段，因此原count、并发/跨设备同主体、audit、rate/资格、9→10 auto-hide、epoch、取消回9不恢复、query/detail隐藏、旧cursor失效、迟到projector不复活、失败回滚及signed rehearsal用例继续回归。没有只验证字符串剥离而跳过真实业务路径。关闭flag、read-stop、boundary、policy或allowlist五种门下，传输字段均不能绕过停机，ledger/audit/rate及所有mock表保持不变。

## 云端保持停机与 V1 保护

本轮只有只读 CloudBase 回核，没有 manageFunctions 或其它管理写调用、没有 invokeFunction、没有请求新真机测试。远端仍是批准的 b100诊断源码，code archive SHA `4b12e258e6866eecea1ac1c4d6a877fd9e5a84c1d714d434d45f4445e4764ef4`；另外8函数及report共9个远端代码摘要与诊断关闭时相同。

9函数均Active且全部临时flag=false、caller allowlist空；read-stop=true、HA pause=true、read-epoch31、PUBLIC=0，12authority全部inactive且expired。ledger仍24，结构/active与诊断停机时相同，测试B仍0。V1本地149文件hash再次0diff；远端完整49项核对为上一诊断关闭阶段的既有证据，本轮未冒称重做该完整核对。资源与V1管理写入0。

## 停止与下一阶段

本次授权的本地修复和验证已经完成，当前 AWAITING_REVIEW / SEPARATE_DEPLOYMENT_APPROVAL_REQUIRED。新的冻结差异和 SHA 见 [exact diff](v2-e-task-21-report-tcb-context-repair-exact-diff.md)。本次不请求扫码、不部署、不改其它函数或 threshold，也不启动TASK22。

真实微信举报／取消链尚未在新修复代码上测试，因此业务P1仍1，不能将 closure 改为PASS；`UPLOAD_ONLY_AND_REPORTING_PRE_PILOT_CLOSURE = NOT_PASS / REPORT_REPAIR_LOCAL_VERIFIED_DEPLOYMENT_APPROVAL_REQUIRED`，TASK21仍IN_PROGRESS / PRE_PILOT_CLOSURE，TASK22 LOCKED / NOT_STARTED。已有仅上传筛选、完整标签气泡、刷新状态条、C隐藏消费及既有真机threshold证据保留，没有重复人工验收。

证据根目录：`artifacts/task21/final-cloud-rehearsal-20260930/repair-apply-retest-20261001/tcb-context-repair-build/`。主要记录：manifest.json、SHA256SUMS、runtime-exact.diff、artifact-validation-result.json、validation-summary.json、red-reproduction.log、targeted-regression.log、packaged-runtime-regression.log、full-vitest.log、lint.log、typecheck-root.log、typecheck-web.log、contracts-validation.log、next-build.log、artifact-validator.log、remote-unchanged-safe-stop-readback.json、local-v1-invariance.json。未commit/push。
