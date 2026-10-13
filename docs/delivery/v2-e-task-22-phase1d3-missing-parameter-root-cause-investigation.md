# TASK22 Phase1-D3｜MissingParameter 根因排查记录（未完成）

检查日期：2026-10-03，Asia/Shanghai。用户本轮请求是“检查根因”；本轮没有沿用历史部署授权发起新部署，也没有重新生成或读取业务 HMAC secret。

## 状态纠正：根因定位任务未完成

用户指出“没有确证怎么算根因检查”。此前将本地排查与记录验证完成表述为根因检查已收口，并把 READ_ONLY_ROOT_CAUSE_CHECK 标为完成，范围判断不准确，现予纠正。当前 `ROOT_CAUSE_INVESTIGATION=INCOMPLETE / EXACT_CAUSE_NOT_IDENTIFIED`。只有取得并核实具体缺失参数、解释历史成功与当前失败的机制差异，才可宣告根因定位完成；本地 PASS 不达到这一标准。

继续只读补查：新的 CloudAudit `DescribeEvents` 精确请求查询仍返回 `AuthFailure.UnauthorizedOperation`；环境 `SearchClsLog` 在覆盖 UTC 与 +08:00 时间段的窗口中按两条 RequestId 搜索，READ_PASS / Results0。这说明这些入口尚未提供所需错误详情，不证明没有错误或根因已排除。auth(status) 为账号级 READY，但不代表有操作审计读取权限。回执见 [error-detail-recovery.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d3-root-cause-check/error-detail-recovery.json>)。本次继续检查 cloud writes0 / CREATE0 / secret generation0。

缺口是两条原始 CREATE 对应的服务器 Error.Message，或平台按 RequestId 返回的具体字段与校验分支；当前授权可用的只读入口均未取得该信息。保留任务未完成状态，不将这个缺口转化为新的 CREATE 试错。

## 最新断点续查：两条原始审计事件已取得，字段仍未记录

用户登录后继续原 TaskSpace，只读取得 D2/D3 指定请求事件，时间与 RequestId 匹配，均确认 MissingParameter。两条审计事件的请求/响应正文解码均为空对象，没有 Error.Message 或具体缺失字段。当前 EXACT_SERVER_ERROR=WAITING_PLATFORM_PARAMETER_DETAIL，根因仍未确证；此前 WAITING_USER_LOGIN 已解除。

官方当前 manager-node 5.9.0 的 CREATE 路由为 TCB/EnvId，而本地冻结 SDK 为 SCF/Namespace。这是新的来源差异，不是精确根因或新路径成功证明。未升级依赖、修改冻结请求或重试 CREATE。

详见 [独立控制台续查报告](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1d3-console-root-cause-continuation.md>)，含安全回执、差异证据和供平台按 RequestId 查询的最小材料（未发送）。本轮未重复旧离线检查或完整 postflight；cloud writes0 / secret operations0。

## 结论

**具体触发 CREATE 拒绝的缺失字段仍未确证。** 已确认本地发送链路没有丢失冻结请求字段；已确定原诊断记录存在覆盖缺口；历史成功路径与 D2/D3 的代码上传模式仍有差异。此前 API 凭据无法读取 CloudAudit；最新登录控制台已读取对应事件，但错误正文未记录，不能用猜测替代服务器错误详情，也不能写成已修复。

| 判断 | 结果 | 依据与限制 |
|---|---|---|
| `commonService` 参数容器写错 | 本地排除 | 实际方法接收 `Action`、`Param`，两轮用法正确 |
| SDK/JSON 序列化丢失 FunctionName、Code 或 Environment | 本地重放排除 | 在 Node HTTP 请求边界截获完整正文，字段及类型保持 |
| ZIP base64 损坏或包字节偏移 | 本地重放排除 | 解码后 SHA 与冻结 query ZIP 相同，包大小 35,184 bytes |
| Action / Version / Region / Content-Type / 正文长度错误 | 本地重放排除 | CreateFunction / 2018-04-16 / ap-shanghai / application/json，声明长度等于正文长度 |
| D2 缺 Stamp/CLS 就是完整根因 | 不成立为已证结论 | D3 补齐后仍被拒绝；此前 HIGH 判断过早，维持撤回 |
| 缺 `CodeSource` 必然导致拒绝 | 未确证 | CloudBase builder 没有强制生成；官方 SCF 类型为可选，不能据此补参试错 |
| ZIP 与 CloudBase 当前创建路径不兼容 | 待验证假设 | 历史成功目录路径走 COS；D2/D3 用内嵌 ZIP；公开 SDK 支持 ZIP，不能直接认定不支持 |
| `parameterNames=[]` 说明服务器没有指明字段 | 不成立 | 白名单遗漏 COS 字段且区分大小写，已用实际历史 extractor 离线复现 |
| 精确服务器根因 | `NOT_CONFIRMED` | 原 Error.Message 未保留，CloudAudit 查询被拒绝 |

上述“本地排除”仅适用于当前安装的 SDK、冻结 ZIP 与非 secret 占位值的重放。它不是历史请求的真实网络抓包，也不能证明代理或平台实际接收的正文与重放完全相同。

## 1. 从调用参数检查到 HTTP 正文边界

使用 D2/D3 执行器相同的 bundled Manager/CommonService/CloudService 类。初始化与函数列表使用只读接口；模拟 CREATE 使用明确的 dummy signing credentials 和非 secret Environment 占位值，在 `http.request` / `https.request` 边界替换为本地 Writable，截获正文后终止，未建立 socket。

| 非 secret 检查 | D2 重放 | D3 重放 |
|---|---|---|
| 完整 JSON 正文 bytes | 47,596 | 47,723 |
| Content-Length 匹配正文 | PASS | PASS |
| Namespace / FunctionName 匹配批准目标 | PASS | PASS |
| Code.ZipFile 解码精确匹配冻结 ZIP | PASS | PASS |
| Environment.Variables[{Key,Value}] 与逻辑 key names | PASS | PASS |
| request body fields 与构造输入匹配 | PASS | PASS |
| Action / Version / Region / Content-Type | PASS | PASS |
| CREATE 网络发送 | 0 | 0 |

D3 构造器的 `L5Enable:null` 被 `deepRemoveVoid` 正常移除；其它已提供字段保留。报告只记录签名/会话 header 是否存在和 header names，不记录签名、token、Authorization 值或正文全文。正文长度来自占位值，不能冒充历史真实 secret 请求长度。

实际 CommonService.call：读取 `{Action, Param={}}`，再调用 `commonService.request(Action, {...Param})`；CloudService 将 data 清理 null/undefined 后 JSON.stringify，生成 TC3 签名并交给 node-fetch。SDK CloudBaseError 保留 `message`、`original`、`code`、`requestId`；这里没有发现统一吞掉服务器 Message 的 SDK 逻辑。

可复核证据：[investigate.cjs](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d3-root-cause-check/investigate.cjs>)、[investigation.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d3-root-cause-check/investigation.json>)。HTTP 检查完成前有两次本地断言失败，原因是 Node header 值为数组，检查器按字符串比较；调整本地读取后通过。这两次没有 CREATE 网络发送，不属于平台探针。

## 2. 尚未复现的历史成功代码上传方式

TASK19 历史调用证据已保存在原 D3 溯源报告；本轮不改写该历史。历史 manageFunctions 从 `functionRootPath` 调用 Manager，未传 `base64Code` / `deployMode:zip`。当前同一 bundled SDK 对该路径默认打包后 COS 上传，最终 Code 为 `CosBucketRegion` + `TempCosObjectName`。D2/D3 则是 `base64Code` / `Code.ZipFile`。

因此“共用同一 request builder”没有证明“复现全部历史成功传输路径”。COS 上传方式是剩余明确差异，仍不能推断为具体服务器根因。历史 CREATE 的原始 HTTP 请求与 RequestId 未保存；这部分代码来源模式是历史调用参数结合 SDK 源码得到的推断，不是原始 wire receipt。

[CloudBase Manager 官方函数文档](https://docs.cloudbase.net/en/api-reference/manager/node/function)列出 `base64Code` 与 `deployMode:zip/cos`；本地 SDK 同样支持这些输入。[腾讯云官方 SCF 类型定义](https://raw.githubusercontent.com/TencentCloud/tencentcloud-sdk-nodejs/master/src/services/scf/v20180416/scf_models.ts)将 `CodeSource` 定义为可选且支持 ZipFile/Cos/Demo。文档支持不等于本环境这次 CREATE 已验证通过。

本轮没有调用 GetTempCosInfo、上传 COS、更换代码来源或发 CREATE 来验证该假设。

## 3. 已复现的诊断覆盖缺口

D2 执行器只保留 code/RequestId；D3 的 `safeErrorParameters` 读取 `e.message` 后，仅用 21 个字段名的白名单提取参数名，并没有保存已脱敏的完整 Message。白名单没有 `TempCosObjectName`、`CosBucketRegion`、`CosBucketName`、`CosObjectName`、`CosTimestamp`，匹配也区分大小写。

本轮只截取并运行历史纯 extractor，不执行旧部署器。16 个 synthetic 参数案例通过：11 个已列字段能正常提取，5 个遗漏 COS 字段均返回空列表；额外小写 `runtime` 同样返回空列表。正则边界本身正常，问题是字段覆盖和大小写范围，以及 Message 未保留。

这证明诊断能力不足，**没有证明真实 D3 Message 一定含 COS 字段**。`parameterNames=[]` 不能再当成“原 Message 没有具体字段”的证据。原进程已经结束，本轮无法从已保存的 JSON 恢复被丢弃的文字。

证据：[check-error-extractor.cjs](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d3-root-cause-check/check-error-extractor.cjs>)、[error-extractor-validation.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d3-root-cause-check/error-extractor-validation.json>)。没有修改历史 D2/D3 执行器。任何未来执行器的诊断候选应在内存中先按实际 secret 值及编码形式脱敏，再保留有长度限制的 Message、original.Message 和不依赖固定名单的字段定位；必须离线验证后审阅，不能为了采集错误再盲发 CREATE。

## 4. 只读 CloudAudit 查询被拒绝

使用腾讯云已公开的 [LookUpEvents 接口](https://cloud.tencent.com/document/api/629/35344)，按两次失败 RequestId 精确筛选，时间窗口各 ±300 秒；返回内容只允许输出参数名和结构，禁止保存原始审计事件中的 Environment、凭据或用户身份字段。

| 原 CREATE | 原 RequestId | 最终只读审计回执 |
|---|---|---|
| D2，2026-10-03 00:43:05 +08:00 | `ed7e1ff4-fcac-4cc3-8937-c2e0605188d4` | `AuthFailure.UnauthorizedOperation` |
| D3，2026-10-03 01:21:05 +08:00 | `e9762b39-752e-4c1f-a522-a583e9fb8134` | `AuthFailure.UnauthorizedOperation` |

本轮累计 4 次精确只读审计查询（第一次检查及完善函数列表分页后的重放各 2 次），全部拒绝；最终两个只读请求的 RequestId 保存于 investigation.json。该错误属于本轮审计读取，不能混同为历史 CREATE 的根因。没有改权限、登录方式、凭据或审计配置。

当前可行的下一诊断步骤是：以有 CloudAudit 读取能力的现有身份读取上述两个事件，或向平台支持提供这两个 RequestId，请其仅返回缺失参数名及代码来源校验分支。不得交付 secret、完整 Environment、auth token 或 ZIP base64。以下最小诊断信息可供审阅，尚未发送给任何人：

```text
Environment/Namespace: cloud1-d7gxqfwv783a1f131
Region: ap-shanghai
Action/Version: CreateFunction / 2018-04-16
FunctionName: query-public-map-leads
Error.Code: MissingParameter
D2 RequestId: ed7e1ff4-fcac-4cc3-8937-c2e0605188d4
D3 RequestId: e9762b39-752e-4c1f-a522-a583e9fb8134
Code source: Code.ZipFile，frozen ZIP 35,184 bytes
D3 Stamp/ClsTopicId/ClsLogsetId: PRESENT
Question: 此请求具体缺少哪个字段？是否进入 COS/TempCosObjectName 校验分支？
```

## 5. 状态与边界

本轮分页只读列出 28 个既有函数，全部 9 个 production 目标仍 ABSENT。没有重新执行 full structural postflight：V1/Storage/数据库/shadow 停机完整状态仍引用此前 D3 postflight，不能标成本轮新验证。

本轮 cloud writes / CREATE network attempts / invokes / secret generation / secret bindings / business writes 均为 0。没有读取或记录业务 HMAC 值，没有轮换 identity key。Founder 风险记录保持 `RISK_ACCEPTED_BY_FOUNDER / SECRET_UNCHANGED / ROTATION_WAIVED`，不宣称暴露已修复。

维持 `PHASE1_D_PRODUCTION_FUNCTIONS=STOP_PROBE_FAILED / FIRST_CREATE_REJECTED / NOT_DEPLOYED`、production functions 0/9、Phase2 LOCKED。本地排除检查与诊断覆盖检查通过；根因定位任务未完成，精确服务器根因追踪目前停在已取到审计事件但 Error.Message 未记录的证据缺口，不把本地 PASS 改写成平台通过。

四份正式事实源新增本轮检查记录；冻结 proposal/manifest/batch/9 ZIP/源代码及历史报告保持原样。完成校验见 [verification.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d3-root-cause-check/verification.json>)。未提交或推送 Git。
