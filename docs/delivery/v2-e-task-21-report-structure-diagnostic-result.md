# TASK21 举报请求结构诊断报告

2026-10-01：DIAGNOSTIC_COMPLETE / ROOT_CAUSE_CONFIRMED / SAFE_STOP_PASS。已完成 Founder A 唯一一次真实微信请求检测；只定位结构拒绝，不代表举报／取消举报链通过。最小业务修复超出本次诊断授权，已停止并提交新的拟议 exact diff，未修改或部署该修复。

## 已确认的拒绝根因

真实微信请求中出现额外键名 `tcbContext`，而举报入口只允许 `publicLeadId`、`command`、`actionId` 三个业务字段。之前的修复仅剥离 `userInfo`，仍留下 `tcbContext`，于是 `extraKeys.length > 0` 在事务开始前返回 INVALID_REQUEST。

本轮诊断客户端只主动提交 publicLeadId 和 GET_STATE 两项；没有提交 tcbContext，也没有伪造身份。服务端结构摘要确认仅有这一额外键，lead/command/action 三个条件均通过。因此此轮读取请求的直接拒绝原因已经确定。结合之前两个真实举报也返回同一事务前错误，这一共同入口缺陷解释当前举报失败；REPORT 专属 actionId 和后续写入链仍必须在修复后真实复测，不能提前声称所有后续错误均已排除。

| 唯一真实请求证据                        | 实际结果                             |
| --------------------------------------- | ------------------------------------ |
| RequestId                               | f52f2d7b-5ef9-4983-b8e5-1005ca5351c0 |
| Founder 原反馈                          | 读取 invalid_request                 |
| 公共返回                                | ok=false，code=INVALID_REQUEST       |
| stage                                   | BUSINESS_FIELDS                      |
| extraKeyCount / extraKeys               | 1 / [tcbContext]                     |
| leadValid / commandValid / actionValid  | true / true / true                   |
| leadType / leadLength                   | string / 32                          |
| commandType / actionType / actionLength | string / undefined / null            |
| 真机请求数                              | 1；无 REPORT 或 CANCEL_REPORT 请求   |

这里只保存结构类型、长度、格式布尔值及额外键名；没有保存字段值、tcbContext 内容、身份信息、OpenID/APPID、digest、secret、完整 event 或 CLS 平台元信息。GET_STATE 不要求 actionId，所以 actionType=undefined 同时 actionValid=true 是正确结果。

## 本次批准与部署核验

唯一代码更新为既有 `v2-shadow-report-public-map-lead`。部署前重算批准 ZIP SHA-256：`b10054298bfc04d81318935750084675b3876dc82ec689b325911f3818908962`；与批准文件一致。部署请求 e2c0c2c5-a3f3-4957-a864-21e2e11eeffb。

远端反向下载后的代码包 SHA 为 `4b12e258e6866eecea1ac1c4d6a877fd9e5a84c1d714d434d45f4445e4764ef4`，与 CloudBase 下载摘要一致。云端安装 SDK 后的 archive 与批准 ZIP 内容范围不同；已对批准的16个文件逐字节比较，16/16一致。runtime 为 `c4be1cf64ce4f584ad6116d0daf57bfa31681c2fcef120dc41c727afa14d32c6`。Runtime/Handler/内存/超时/trigger/layer/完整环境配置与部署前一致；其余8函数代码摘要未变。

没有新增 collection/index/function/secret/trigger/layer/Storage，没有修改 V1。诊断代码按批准包保留，最终通过关闭 flag 和清空 caller 使诊断失效；没有擅自回滚或部署业务修复。

## 一次请求窗口与立即关闭

遵从最终授权，将原草案三次调用收窄为一次 GET_STATE。独立 DIAGNOSTIC_ONLY 预览3881bytes，正式客户端未变；启动不发请求，点击立即禁用按钮，本地并发点击及再次点击验证总调用数仅1。

2026-10-01 01:36:17.843（Asia/Shanghai）只临时开启 report flag，caller 仅既有 Founder A，report-rehearsal=false。其余8函数继续关闭，12个 reporter authority 全部失效。全程 global:read-stop=true、HA pause=true、read-epoch=31、PUBLIC=0，未开启 query/detail/resolver/projector 或重新公开退役 Marker。

从云日志取得唯一请求及结构诊断后，于01:38:23.484立即提交关闭；关闭配置请求 1c630b64-9380-455d-9d52-fee827928339。随后回读9函数均 Active，全部临时 enabled=false、caller allowlist空；report 完整环境恢复部署前值。

| 最终关闭与数据核对           | 结果                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| read-stop / HA pause / epoch | true / true / 31                                                                   |
| PUBLIC                       | 0                                                                                  |
| 9函数 / 12authority          | 全部关闭且名单空 / 全部 inactive 且 expired                                        |
| ledger 总数                  | 检测前24，检测后24                                                                 |
| ledger kind 分布             | 10 REPORT_STATE、1 TARGET_POLICY_STATE、13 AUDIT，前后一致                         |
| ledger 结构与 active 状态    | 与检测前一致                                                                       |
| 测试 B ledger                | 0，未产生举报／取消／audit 记录                                                    |
| V1 只读回核                  | 49项全部一致：13集合、43索引、13ACL、19函数及环境/触发器、Storage根/规则与函数权限 |
| V1 本地文件                  | 149文件 hash 一致，V1_DIFF=0 / VERIFIED                                            |
| 本轮诊断结构及公共返回       | PRIVATE_LEAKAGE=0                                                                  |

## 下一步最小修复建议与停止边界

仅在举报入口已有的传输字段剥离处，将 `userInfo` 例外扩展到 `tcbContext`。继续拒绝其余未知业务字段；不读取或信任 tcbContext/userInfo 内容，不用它们提供 reporter authority，身份仍由既有 cloud.getWXContext 与可信资格决定。业务参数、事务/count/audit/幂等/threshold/public contract 不变。

新的拟议差异见 [tcbContext 最小修复 exact diff](v2-e-task-21-report-tcb-context-repair-exact-diff.md)。该文件是停止后的确切修改建议，未改生产源码、未打包、未冻结可部署 ZIP SHA、未部署；不能用诊断包的 b100 SHA 批准业务修复。后续需针对新候选完成验证和冻结，再取得对应 exact diff/SHA 的部署授权。

修复后应继续真实“举报→取消→再举报→再取消”，逐步核对 ACTIVE/CANCELLED、distinct count、audit 和 replay 幂等。仅当实际业务差异影响 threshold 链时重跑受影响项；已有仅上传筛选、有序自适应完整标签气泡、刷新状态条、C隐藏消费及未受影响 threshold PASS 保留。本轮没有重复这些验收。

诊断候选已执行的32项定向、1050 PASS/1既有SKIP、Lint/双TypeScript/contracts/workflow/Next/9包validator属于本包验证，不是拟议修复验证。新修复尚未执行。本轮机型/系统/微信版本/网络仍未补，保留 EVIDENCE_GAP。

`UPLOAD_ONLY_AND_REPORTING_PRE_PILOT_CLOSURE = NOT_PASS / REPORT_ROOT_CAUSE_CONFIRMED_REPAIR_REQUIRED`；`TASK-V2-21 = IN_PROGRESS / PRE_PILOT_CLOSURE / REPORT_ROOT_CAUSE_CONFIRMED_REPAIR_REQUIRED`。P0=0、P1=1，未将诊断成功改写成业务链 PASS；TASK22继续 LOCKED / NOT_STARTED，未开启 Pilot。

证据目录：`artifacts/task21/final-cloud-rehearsal-20260930/repair-apply-retest-20261001/structure-diagnostic/`。主要文件：diagnostic-deploy-source-config-readback.json、true-device-structure-evidence.json、single-request-protocol.json、preview-source-manifest.json、final-safe-stop-readback.json、v1-final-after-diagnostic.json、v1-local-final.json、minimal-repair-proposal.json。未 commit/push。
