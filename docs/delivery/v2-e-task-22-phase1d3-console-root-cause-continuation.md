# TASK22 Phase1-D3｜控制台断点续查报告

日期：2026-10-03，Asia/Shanghai。用户已登录后授权继续原任务，范围为只读查看 D2/D3 两条失败操作记录。本轮不重复离线请求重放、日志搜索、函数列表、完整云端 postflight 或旧测试。

## 结果：原始事件已取到，具体缺失字段仍未确证

| 原请求 | 时间（+08:00） | RequestId | 审计结果 |
|---|---|---|---|
| D2 | 2026-10-03 00:43:05 | ed7e1ff4-fcac-4cc3-8937-c2e0605188d4 | apiErrorMessage=MissingParameter |
| D3 | 2026-10-03 01:21:05 | e9762b39-752e-4c1f-a522-a583e9fb8134 | apiErrorMessage=MissingParameter |

两个事件均为 CreateFunction，来源 scf.tencentcloudapi.com，地域 ap-shanghai；RequestId 和时间精确对应原失败回执。操作审计页面在“只写”筛选下未显示，选择“全部”操作类型、近7天、指定 RequestId 后各返回一条匹配事件。空筛选结果已被这一直接事件证据替代。

安全回执：[D2](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d3-root-cause-check/d2-audit-safe-record.json>)、[D3](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d3-root-cause-check/d3-audit-safe-record.json>)。未保存完整审计原文、用户身份值、凭据、Environment 或代码正文。

事件中的 CAM 字段为 errorCode="0" / errorMessage="permission verify"；不能将这一字段解释为 SCF 缺失参数说明，也不能把 apiErrorCode=0 单独解释为创建成功，实际 apiErrorMessage 为 MissingParameter。

两条事件的 requestParameters 和 responseElements 经过 JSON 解码后均为空对象。D3 responseElements 需要两层 JSON 解码；只解第一层会得到字符串，已纠正安全回执中的类型说明。事件没有保存 Error.Message、字段名或校验分支。控制台已取得原始事件，仍不能恢复未记录的错误正文。

## 新增线索：当前官方 SDK 的创建路由已变化

只读查看官方 NPM 发布包 @cloudbase/manager-node 5.9.0 的 package/lib/function/index.js：createFunction 使用 tcbService.request('CreateFunction', params)，EnvId 放入 baseParams；本地冻结 bundled SDK 使用 scfService.request('CreateFunction', params) 与 Namespace。5.9.0 仍将 base64Code 转为 Code.ZipFile，目录默认路径仍使用 COS。记录见 [SDK 对比证据](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d3-root-cause-check/published-sdk-transport-comparison.json>)，来源为 [官方 NPM 发布包](https://registry.npmjs.org/@cloudbase/manager-node/-/manager-node-5.9.0.tgz)。

这只证明当前发布代码与本地创建路由存在差异，没有证明旧 SCF 路由不支持本环境、没有定位缺失字段、没有证明新 TCB 路由会通过。[SCF 官方 CreateFunction 接口](https://cloud.tencent.com/document/api/583/18586)仍列 CodeSource 为可选、支持 ZipFile/Cos/Demo；文档也未提供此次 MissingParameter 的具体说明。不得据此升级包、改冻结请求或重新发探针。

## 供平台按 RequestId 取证的最小材料（未发送）

环境/Namespace：cloud1-d7gxqfwv783a1f131；地域：ap-shanghai；函数：query-public-map-leads。

请求：SCF CreateFunction，版本 2018-04-16；D2/D3 RequestId 与时间见上表。两条原始审计事件确认 MissingParameter，但 requestParameters/responseElements 均为空对象，未返回具体缺失字段。

请平台仅返回：

1. 两条请求的原始 Error.Code / Error.Message，以及具体缺失字段名。
2. 产生该错误的参数校验分支：Code.ZipFile、COS/TempCosObjectName，或其它分支。
3. 本环境在上述时刻是否要求 TCB CreateFunction/EnvId 而不能使用 SCF CreateFunction/Namespace；如有要求，请提供对应说明。

不提供业务 secret、Environment 值、登录 token、签名、ZIP base64 或完整请求体。没有向腾讯云支持或任何人发送消息。

## 状态与验证

ROOT_CAUSE_INVESTIGATION=INCOMPLETE / EXACT_CAUSE_NOT_IDENTIFIED；EXACT_SERVER_ERROR=WAITING_PLATFORM_PARAMETER_DETAIL。控制台读取成功不等于根因确证。

本轮 CREATE、部署、secret 生成/读取/绑定/修改、业务写入均为 0；不改函数运行状态、审计设置、权限或资源。Phase1-D 继续 STOP_PROBE_FAILED / NOT_DEPLOYED，Phase2 LOCKED。旧 identity 风险决策继续 RISK_ACCEPTED_BY_FOUNDER / SECRET_UNCHANGED / ROTATION_WAIVED。

ego-browser 使用原 TaskSpace 1 / p1，读取两条指定事件后 finish 一次完成本次浏览器查询。未新增 TaskSpace。无 Git 提交/推送。

四份事实源和根因排查总报告同步当前证据缺口；冻结输入和受保护历史文件 hash 校验、workflow、diff-check 结果记录于 console-continuation-verification.json。这些本地验证不证明平台根因或部署成功。
