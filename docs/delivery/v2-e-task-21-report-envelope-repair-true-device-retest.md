# TASK21 举报 envelope 修复部署与真机复测

2026-10-01 后续单次诊断最新结论：真实请求额外含tcbContext，触发BUSINESS_FIELDS严格未知字段拒绝，lead/command/action条件均通过；独立报告[v2-e-task-21-report-structure-diagnostic-result.md](v2-e-task-21-report-structure-diagnostic-result.md)。诊断入口已关闭、PUBLIC0、ledger24/B0未变。业务修复超出本轮诊断授权，STOP并提交拟议exact diff；P1仍1、closure NOT_PASS。下文为前一修复阶段记录。

2026-10-01 最终：DEPLOYED / SOURCE_CONFIG_READBACK_PASS / TRUE_DEVICE_RETEST_FAILED / SAFE_STOP_PASS。批准包落地通过，真实举报未修复；P1=1，总门NOT_PASS。后续根因定位由 Founder 新消息授权继续，新的结构诊断 artifact 已本地准备，尚待独立部署批准。

## 批准差异与远端证据

唯一 updateFunctionCode：v2-shadow-report-public-map-lead，请求00b03588-e4e9-4c3f-b19b-d884190e8c49。0 collection/index/new function/secret/trigger/Storage/V1 变更，其余8函数最终下载代码SHA与部署前相同。部署前重新计算 ZIP SHA cd4c6366c4a659a978452a91a0b88b391f24e4bbc09f3db1baba49a7d9dada25，与 Founder 批准值一致；runtime.mjs唯一4行差异，其余15文件相同。userinfo不供身份，原getWXContext/HMAC/allowlist/server-only authority保留。

远端含安装依赖 archive SHA a0d718ecdd9d7ca6092602c50a0ae7732dbd4583da9e09fe8bf8dcf9c0b0fb14；反向下载16/16批准文件字节一致。Nodejs20.19/index.main/256MB/10s/0 trigger/layer；部署前后完整配置相同且全部入口关闭，secret只记录PRESENT。证据 cloud-source-config-readback.json、sha-exact-gate.json。

## 独立 B 供给与窗口

原 A/B/C 均保持退役，没有复活旧数据。新合成 fixture/candidate 明确 SYNTHETIC_REHEARSAL，经正式source adapter核验→resolver NO_MATCH→contribution/outbox→projector APPLIED/CREATED，唯一PUBLIC；未复制V1私有记录、未admin直接写PUBLIC、不代表真实玩家供给。publicLeadId=32f5507cf61cb5f54f2e1742507c853d，标签“测试B 举报复测”，GCJ02 31.2316/121.4737。

本地初始版本校验失败，使用正式adapter返回的observationVersionId更新fixture和candidate后通过；错误非现存collection写请求被平台拒绝，没有新增collection，正式candidate写入既有v2ShadowCandidateUploads。resolver/projector短开后即关闭；只复用Founder A已可信登记的digest和authority，query/detail/report名单仅A，无ENROLL，HA始终暂停。read epoch写请求曾使用不存在的global:shadow-epoch，匹配0条，实际窗口仍30；停机按正确global:read-epoch更新至31，之前“窗口31”草稿不作事实。微信正式preview1012206 bytes，正式客户端本轮无源修改。

## 真机失败与ledger回读

Founder扫新版、进入“测试B 举报复测”举报后反馈原文：“显示举报失败请重试”。同期真实report函数请求：

| RequestId                            | 返回                       |
| ------------------------------------ | -------------------------- |
| ce22a657-8bb2-456b-a57d-1be9f979fe7e | ok=false / INVALID_REQUEST |
| 995196d2-5ad1-4128-bd51-19cac0c4635b | ok=false / INVALID_REQUEST |

B ledger为0：REPORT_STATE0、TARGET_POLICY_STATE0、AUDIT0，未生成ACTIVE/CANCELLED，distinct count无增量。其余“取消→再举报→再取消”和真实幂等NOT_RUN / STOP_AFTER_P1；不能将synthetic或本地成功替代。原24条C ledger保留，10REPORT_STATE、1TARGET_POLICY_STATE、13AUDIT，不删除、不补造Founder成功记录。

完整根因尚未确认。带userinfo本地复现和四行修复是局部原因；远端已含此修复而真实仍被拒绝，故不再声称它解释全部真实失败。现有ret_msg只有INVALID_REQUEST，未记录完整event或身份字段。未继续部署超出批准差异的代码，实际SHA/diff没有漂移。

## 无影响范围与验证

修复没有更改policy、transaction/count/audit/idempotency、threshold latch或projector；本轮独立9包validator与report/projector/security/public-read30项再次PASS。因此不重跑无影响的9→10/auto-hide/cancel-to9/no-resurrection、仅上传mandatory筛选、全部标签气泡、刷新状态条和C隐藏消费；这些既有PASS保持。

此前全量1048PASS/1既有SKIP、Lint/双TS/contracts/Next/Web26/26为此前证据。本次部署阶段没有冒充新全量；后续本地结构诊断阶段的1050PASS/1SKIP等属于新候选验证，分开记录。未commit/push/PR/merge/tag或production publish。

## 最终safe-stop与V1

本轮9函数最终Active/全部flag=false/caller空/无ENROLL；global:read-stop=true、global:ha-pause=true、global:read-epoch31、PUBLIC0。原A/B/C与新B全部HIDDEN/HIDDEN/retiredAt；12authority全部accountActivefalse且过期。停机后GET_STATE返回REPORT_DISABLED，请求28c3b90b-4447-429c-a0e0-f33452b863b5，无举报写入。

完整49项只读V1回核：13集合/43索引/13ACL/19函数runtime/codeSize/modTime/env/triggers/Storage两根项与规则/函数权限规则均一致；本地149文件hash无差异，V1_DIFF=0/VERIFIED。本轮真实public query2/detail1/report error2共5响应，按公开合同及身份/ledger扩展字段递归审计PRIVATE_LEAKAGE0。原CLS平台元信息、OpenID/digest/签名凭证没有写入证据。P0/P1/P2/P3=0/1/1/0，P2为本轮机型/系统/微信版本/网络未补，不以历史设备冒充。

## 新根因定位工作

Founder新请求“查找无法举报根因并修复”。已检查客户端请求构造、已部署入口与本地微信SDK序列化，没有直接观察到导致真实拒绝的具体结构。准备了仅runtime字段结构诊断：保持原身份、严格校验、所有count/hide行为和返回值；SDKlogger仅写stage/键名/类型/长度/格式布尔值，不写参数值或完整event。独立SHA b10054298bfc04d81318935750084675b3876dc82ec689b325911f3818908962，15其余文件一致；定向32/全量1050+1skip/Lint/双TS/contracts/Next/独立9包validator PASS。DIAGNOSTIC_ONLY预览4714bytes与正式客户端分离；计划read-stop持续true/PUBLIC0/authority失效，仅report临时允许A，防止真实举报写入。

确切差异：[report-structure-diagnostic-exact-diff](v2-e-task-21-report-structure-diagnostic-exact-diff.md)。此为该报告形成时的准备状态；随后Founder独立批准b100诊断SHA，本轮只开1次GET_STATE入口并已立即关闭，根因证据与当前停止状态以上方独立诊断报告为准。

总门仍UPLOAD_ONLY_AND_REPORTING_PRE_PILOT_CLOSURE=NOT_PASS / REPORT_REPAIR_TRUE_DEVICE_FAILED；TASK21 IN_PROGRESS / PRE_PILOT_CLOSURE，TASK22 LOCKED / NOT_STARTED，不开启Pilot，不HUMAN_APPROVED/FROZEN/RC。

证据根目录：artifacts/task21/final-cloud-rehearsal-20260930/repair-apply-retest-20261001。关键文件cloud-source-config-readback.json、safe-stop-and-real-device-failure.json、true-device-public-responses.json、v1-final-after-safe-stop.json、v1-local-final.json、final-retirement-resource-readback.json；后续诊断候选位于structure-diagnostic子目录。
