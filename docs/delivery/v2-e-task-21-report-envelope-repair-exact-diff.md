# TASK21 举报真机 userInfo 修复确切差异

状态（2026-10-01）：FOUNDER_APPROVED / DEPLOYED / SOURCE_CONFIG_READBACK_PASS / TRUE_DEVICE_RETEST_FAILED / SAFE_STOP_PASS。Founder 本轮明确批准本文件的单一举报函数 artifact 更新及既有受控 B 复测；原批准27cabecc包的首次真机 GET_STATE/REPORT 曾返回 INVALID_REQUEST。

## 原因与修复

CloudBase官方说明微信调用会自动附带event.userInfo（https://docs.cloudbase.net/cloud-function/how-use）。业务请求禁止附加字段的检查因此拒绝真机调用。云日志请求0ac1c474-8fde-4465-ba75-20a9c3376480等与本地带userInfo红测共同支持根因；未记录其原始OpenID值。

仅runtime.mjs新增4行：从event中移除userInfo再验证业务字段。userInfo内容完全忽略，不作为可信身份；原getWXContext→principal HMAC→caller allowlist→server-only reporter authority完整保留。其他未知字段仍INVALID_REQUEST，伪造userInfo不能越过WXContext身份/allowlist/authority。

## 可批准的云端变更

唯一updateFunctionCode：v2-shadow-report-public-map-lead。0 collection/index/new function/secret/trigger/Storage/V1变更，其余8个shadow函数不更新。Nodejs20.19/index.main/256MB/10s/0 trigger/layer，同4 collection allowlist，同policy和配置。部署前必须关闭report两flag/caller空/read-stop=true；反向下载逐文件核对，随后仅复用既有Founder A window做B真实举报取消重测，完成必须safe stop/V1 diff=0。

| 项目 | 值 |
| --- | --- |
| 原批准 ZIP SHA | 27cabeccdda5d50d670fb108c991299122d69f31308b1e619842460557e25526 |
| 独立修复 ZIP SHA | cd4c6366c4a659a978452a91a0b88b391f24e4bbc09f3db1baba49a7d9dada25 |
| 修复ZIP | artifacts/task21/final-cloud-rehearsal-20260930/report-envelope-repair/v2-shadow-report-public-map-lead.zip |
| 唯一变更文件 | runtime.mjs |
| 其余批准文件 | 15/15字节一致 |
| 资源差异 | 全部0 |
| 原冻结九包 | 9/9原SHA未变 |

现存四函数批准包/九包manifest不覆盖；独立repair-candidate-manifest.json复用原8包，只换report包，原validator全流程运行9包PASS。原九包validator对当前源码指出唯一report runtime drift，明确属于未批准修复，不将它伪记原批准包PASS。

## 验证

带平台envelope真实GET_STATE→REPORT→CANCEL本地红后绿；伪造userInfo不会冒充另外账号；非allowlisted WXContext拒绝；其它未知身份字段拒绝。report/projector/security/public-read 4文件30项PASS；整仓1048 PASS+1既有SKIP；Lint/root/Web TS PASS；客户端A修复94定向PASS、Founder复测PASS；C阈值10隐藏、取消到9保持隐藏、迟到projector MODERATION_HIDDEN，以及Founder4动作PASS。B真实举报取消尚未完成，P1=1，总门NOT_PASS。

本轮批准来源为 Founder 2026-10-01 明确消息，授权边界与本文件一致。部署前重新计算修复 ZIP SHA 与本表一致，唯一 runtime.mjs 差异、其余15文件一致；updateFunctionCode 请求 00b03588-e4e9-4c3f-b19b-d884190e8c49。远端反向下载 archive SHA a0d718ecdd9d7ca6092602c50a0ae7732dbd4583da9e09fe8bf8dcf9c0b0fb14（包含平台安装依赖），16/16批准文件字节一致；部署前后配置完全一致且关闭，source/config/read-back PASS。独立证据见 artifacts/task21/final-cloud-rehearsal-20260930/repair-apply-retest-20261001/cloud-source-config-readback.json。本轮Founder举报仍失败，两次真实请求INVALID_REQUEST、B ledger0；四步链STOP，总门NOT_PASS/P1=1。最终safe-stop/read-epoch31/PUBLIC0/V1_DIFF0通过。userinfo局部修复不足以解释完整真机根因，新的结构诊断另列确切差异并等待独立批准；TASK22仍锁定。
