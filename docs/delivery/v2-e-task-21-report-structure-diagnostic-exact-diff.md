# TASK21 举报请求结构诊断确切差异

2026-10-01：APPROVED / DEPLOYED_SOURCE_CONFIG_VERIFIED / ONE_TRUE_DEVICE_DIAGNOSTIC_COMPLETE / SAFE_STOP_PASS。Founder本轮已明确批准本文件与b100 SHA，仅允许1次GET_STATE；唯一请求确认额外键tcbContext为结构拒绝原因。取得原因立即关闭，独立结果见[v2-e-task-21-report-structure-diagnostic-result.md](v2-e-task-21-report-structure-diagnostic-result.md)。下文保留确切诊断包边界和执行协议；不授权后续业务修复。

## 部署前已确认及当时尚缺证据

批准的 cd4c6366 修复已经真实部署，远端16/16文件与配置一致。但 Founder A 的“测试B 举报复测”仍提示举报失败，两条真实调用 ce22a657-8bb2-456b-a57d-1be9f979fe7e、995196d2-5ad1-4128-bd51-19cac0c4635b 均 INVALID_REQUEST，B ledger0。错误发生在事务写入前；现有日志无法区分 event 形态、额外字段、publicLeadId 格式、command 或 actionId 条件。userinfo 局部红测不能充当完整真机根因。只读检查客户端发送构造和微信开发工具内置 SDK 序列化，未发现业务字符串被改变的证据，不猜测缺失平台字段。

## 唯一候选部署

仅 updateFunctionCode `v2-shadow-report-public-map-lead`，不更新其余8函数；0 collection/index/new function/secret/trigger/layer/Storage/V1。Nodejs20.19/index.main/256MB/10s 配置和 secret bindings不变。没有改变请求允许项、可信身份、资格、rate、count、audit、幂等、threshold、投影或返回 contract。

runtime.mjs 在 INVALID_REQUEST 的三个入口增加受控结构诊断：EVENT_SHAPE、CAPABILITY_POLICY、BUSINESS_FIELDS。只有 synthetic_only 且 report flag=true 时，通过既有 wx-server-sdk cloud.logger().warn 记录 stage、字段类型、长度、格式条件布尔值和额外键名（最多16个，每个48字符以内、危险／不规范键名脱敏）。不记录业务字段值、userInfo内容、OpenID/APPID、digest、capability、secret、note、location或完整event。诊断失败不会改变请求拒绝或数据库持久化；普通日志／原始console被现有静态检查拒绝，最终包使用SDK结构化logger。

| 项目                 | SHA / 值                                                         |
| -------------------- | ---------------------------------------------------------------- |
| 上次批准 ZIP         | cd4c6366c4a659a978452a91a0b88b391f24e4bbc09f3db1baba49a7d9dada25 |
| 本次诊断 ZIP         | b10054298bfc04d81318935750084675b3876dc82ec689b325911f3818908962 |
| 原 runtime           | 494aae10d6cc1429633b6617dc5c53b45fccb07ab7a2bfa1b9b4cfda6a7d1d4d |
| 新 runtime           | c4be1cf64ce4f584ad6116d0daf57bfa31681c2fcef120dc41c727afa14d32c6 |
| 批准文件             | 16，只有runtime变化，其余15逐字节一致                            |
| 本地测试文件         | 新增结构日志隐私与logger故障/关闭无输出测试，不入部署包          |
| 原冻结包／上次修复包 | 均不覆盖                                                         |

artifact、manifest、runtime-exact.diff 与独立9包 candidate-manifest 位于 `artifacts/task21/final-cloud-rehearsal-20260930/repair-apply-retest-20261001/structure-diagnostic/`。部署前重算 SHA、实际源码差异超过本表即STOP；部署后立即反向下载16文件/config/read-back，确认实际与此包一致。

## 受控诊断协议

保持 global:read-stop=true、HA pause=true、PUBLIC=0，所有 reporter authority保持失效；只临时开启 report flag、caller仅既有 Founder A，report-rehearsal flag保持false。调用最终都会在请求验证或全局read-stop处拒绝，不能写举报state/count/audit。不启用 query/detail/resolver/projector/HA，不重新公开任何退役Marker。

使用独立 /tmp DIAGNOSTIC_ONLY 小程序副本，正式客户端无改动，既有同一AppID和CloudBase环境。依照Founder最终明确授权，将原草案三次调用收窄为一次：扫码并仅点一次“开始检测”，只发送 GET_STATE 到已退役B的现有 publicLeadId，参数使用正式发送的同名字段，不含客户端身份断言。无启动自动调用；检测按钮首次点击即永久禁用，不能重复点击。收集结构诊断及response，随即关闭 report flag、清空caller、确认所有9函数关闭/read-stop/HA/PUBLIC0，保持V1_DIFF0。

诊断构建和诊断拒绝不是真实举报PASS。真实诊断结果、恢复关闭与新的拟议差异已单独交付。本次只能定位结构拒绝原因，确认后再形成最小修复确切差异／SHA并请求相应部署授权；不自行把本协议扩成其它代码部署、不启动TASK22。

## 自动验证与停止状态

定向report/projector/security/public-read32 PASS；全量1050 PASS/1既有SKIP；全仓Lint、双TS、contracts/workflow、Next build、独立9包SHA/源码/allowlist/关闭态validator PASS。诊断包已按最终授权部署，部署请求 e2c0c2c5-a3f3-4957-a864-21e2e11eeffb，远端下载代码SHA 4b12e258e6866eecea1ac1c4d6a877fd9e5a84c1d714d434d45f4445e4764ef4与下载包一致，批准源码16/16与全部配置保持一致（云端SDK安装使压缩包SHA不同于批准ZIP，以16文件逐字节回核为准）。仅有临时诊断客户端收窄为1次GET_STATE，preview3881bytes，本地并发/再次点击验证仅1次请求。真机诊断已执行1次GET_STATE，BUSINESS_FIELDS/extraKeys=[tcbContext]，业务格式条件均通过；取得原因已立即关闭。最终停机epoch31、PUBLIC0、9关闭、12authority失效，V1远端49项与本地149文件0diff，5条真实公开response PRIVATE_LEAKAGE0；P1=1，总门NOT_PASS。设备信息缺口保留。

用户先前原话：“如果实际修复差异超出 report-envelope-repair-exact-diff.md，或部署前重新计算 SHA 与该文件不一致，立即 STOP，不得自行扩大授权。”新增SDK结构诊断超出该四行差异，Founder已于本轮对此份独立诊断及SHA明确批准；仅本次诊断成立，后续业务修复仍需新的exact diff和授权。无SKILL额外approval推断。
