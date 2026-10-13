# TASK-V2-22 Phase1-D3｜CreateFunction format root cause

执行日期2026-10-03（Asia/Shanghai）。当前结果：`STOP_PROBE_FAILED`；`ROOT_CAUSE_CONFIDENCE=NOT_CONFIRMED_AFTER_REJECTED_PROBE`。D2绕过历史CloudBase wrapper并缺少Stamp/CLS映射这一差异已确认，本地9包SDK构造合同验证PASS；但D3补齐该差异后的首个CREATE仍返回MissingParameter，因此不能将这组字段缺失认定为完整根因。

本报告最初在本轮CREATE之前保存，当时把总命令§3条件3/5的本地成功路径合同验证评为HIGH；实际探针已否证“该修复足以解决MissingParameter”，本轮收口撤回完整根因HIGH判断。D2与D3的服务器具体缺失字段尚未确证，不编造字段或已修复结论。

D3 probe RequestId `e9762b39-752e-4c1f-a522-a583e9fb8134`，CREATE REJECTED / MissingParameter；后8函数NOT_ATTEMPTED，0/9部署、bindings0/20，partial deploy=false，CREATE retry0。实际请求结构保存于 `artifacts/task22/phase1d3/execution.json`，完整字段名/类型/存在性、Code来源、Environment key names均保留，不含values或ZIP base64全文。safe error字段含完整code、RequestId、parameterNames=[]；未从安全错误捕获中取得具体parameter name，记录为诊断缺口，不能宣称已定位某一字段。

没有自动继续或第二次CREATE，没有换key重试、删除、enable或业务数据写入。失败后完整postflight PASS，9 targets全ABSENT；后续任何新写动作需Founder另行指令。

## TASK19实际成功路径

主要证据是本项目历史执行记录与交付报告，不仅是公开API文档：

- `/Users/cunfu/.codex/sessions/2026/09/25/rollout-2026-09-25T00-19-37-01a0d437-20f8-7881-b1b9-72a61be2ec22.jsonl:3763`：2026-09-25T17:30:43.623Z，callId `call_o2JH1hYgxVVr9rfYGBHfFcAV`，真实调用 `tools.mcp__cloudbase__manageFunctions(action=createFunction, functionRootPath=.../shadow-functions, func.name=v2-shadow-query-public-map-leads, runtime=Nodejs20.19, handler=index.main, timeout=3, envVariables=<key names>)`。3766行回执success=true；3789行按同样wrapper创建其余5个函数。该批CREATE RequestId没有被当时精简输出保存，记录为`NOT_RECORDED`，不编造。
- 同一执行记录9193→9196：`manageFunctions(action=updateFunctionCode, functionName=v2-shadow-get-my-assistance, functionRootPath=<staging>)`成功，RequestId `d7d215d8-c856-435d-9fbf-c2414f5f132c`；后续按远端包逐文件比较。create与update确为不同Manager方法。
- [TASK19 B2-R2部署报告](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-19-phase-b2-r2-shadow-function-deploy.md>)明确记录：MCP曾忽略zipFile并打包functionRootPath源码；后来将批准ZIP解包到独立root/name后部署，6包的14个批准文件逐字节匹配，含安装依赖远端整包hash等于平台codeSha。
- [TASK19 B2-R4报告](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-19-phase-b2-r4-trusted-caller-verification.md>)确认上述单函数update及14文件回读。历史CREATE accepted证明的是transport格式成功，不把早期包路径错误写成批准ZIP部署成功。

安装的CloudBase MCP `2.28.1`，Manager bundled源为 `/Users/cunfu/.cache/npm/_npx/88d9f76c32260533/node_modules/@cloudbase/cloudbase-mcp/dist/index.cjs`。MCP handleManageFunctions create分支调用`cloudbase.functions.createFunction`；Manager内部`configToParams`完成name/handler/envVariables/memory等转换，再补Namespace、Role、Stamp、ClsTopicId、ClsLogsetId，`getCodeParams`生成Code。历史MCP代码目录部署与本轮内存base64Code共用同一Manager request builder；本轮不使用会忽略ZIP的旧MCP zipFile入口。

## V1溯源

完整读取`services/cloudbase/**`的manifest、build-functions、validate、19个function源及相关部署配置。仓库可恢复Nodejs20.19/index.main/层/timeout等合同，以及真实存在的19函数readback；deploy脚本负责构建和校验，没有保存可复用的最初19函数CREATE请求/CLI创建回执。`V1_CREATE_FORMAT=NOT_RECOVERABLE_FROM_REPO`。不把manifest、现有function detail或构建成功冒充首次CREATE格式。

## A/B/C逐字段对比（不含secret值）

A=TASK19成功MCP→Manager路径及同一SDK构造；B=V1仓库证据；C=D2失败手写SCF请求。

| Field | A location/type/presence | B | C location/type/presence | Difference / evidence |
|---|---|---|---|---|
| `FunctionName` | func.name → request.FunctionName:string | 未恢复request；manifest/config只有部分配置 | request.FunctionName:string | 同合同映射/来源差异；不单独认定必填根因 |
| `EnvId` | Manager cloudBaseOptions.envId（context）；不是SCF body字段 | 未恢复request；manifest/config只有部分配置 | Manager context；raw body未传 | 同合同映射/来源差异；不单独认定必填根因 |
| `Code` | getCodeParams → Code:object | 未恢复request；manifest/config只有部分配置 | request.Code:object | 同合同映射/来源差异；不单独认定必填根因 |
| `Code.ZipFile` | 历史MCP首次源码目录路径走packer；SDK另支持base64Code → Code.ZipFile:string | 未恢复request；manifest/config只有部分配置 | request.Code.ZipFile:string；冻结ZIP base64内存 | 同合同映射/来源差异；不单独认定必填根因 |
| `CodeSource` | SDK不强制生成；未从历史调用恢复显式值 | 未恢复request；manifest/config只有部分配置 | ABSENT | 同合同映射/来源差异；不单独认定必填根因 |
| `Handler` | func.handler → Handler:string | 未恢复request；manifest/config只有部分配置 | Handler:string | 同合同映射/来源差异；不单独认定必填根因 |
| `Runtime` | func.runtime → Runtime:string | 未恢复request；manifest/config只有部分配置 | Runtime:string | 同合同映射/来源差异；不单独认定必填根因 |
| `MemorySize` | SDK默认256；func.memorySize可覆盖 | 未恢复request；manifest/config只有部分配置 | MemorySize:number | 同合同映射/来源差异；不单独认定必填根因 |
| `Timeout` | func.timeout → Timeout:number | 未恢复request；manifest/config只有部分配置 | Timeout:number | 同合同映射/来源差异；不单独认定必填根因 |
| `InstallDependency` | Node package installDependency → TRUE:string | 未恢复request；manifest/config只有部分配置 | InstallDependency:TRUE:string | 同合同映射/来源差异；不单独认定必填根因 |
| `Environment` | func.envVariables → Environment.Variables[{Key,Value}] | 未恢复request；manifest/config只有部分配置 | Environment.Variables[{Key,Value}] | 同合同映射/来源差异；不单独认定必填根因 |
| `Role` | SDK默认TCB_QcsRole:string | 未恢复request；manifest/config只有部分配置 | Role:string | 同合同映射/来源差异；不单独认定必填根因 |
| `PublicNetConfig` | 未显式传；SDK可映射func.publicNetConfig | 未恢复request；manifest/config只有部分配置 | PublicNetConfig.PublicNetStatus:string | 同合同映射/来源差异；不单独认定必填根因 |
| `InitTimeout` | 历史未显式传；SDK支持func.initTimeout | 未恢复request；manifest/config只有部分配置 | InitTimeout:number | 同合同映射/来源差异；不单独认定必填根因 |
| `DiskSize` | 历史未显式传；SDKfunc白名单不透传DiskSize | 未恢复request；manifest/config只有部分配置 | DiskSize:number | 同合同映射/来源差异；不单独认定必填根因 |
| `Stamp` | SDK自动补MINI_QCBASE:string | 未恢复request；manifest/config只有部分配置 | ABSENT | 缺失历史CloudBase wrapper metadata；本轮由SDK补齐 |
| `ClsLogsetId` | SDK从环境既有CLS自动补:string | 未恢复request；manifest/config只有部分配置 | ABSENT | 缺失历史CloudBase wrapper metadata；本轮由SDK补齐 |
| `ClsTopicId` | SDK从环境既有CLS自动补:string | 未恢复request；manifest/config只有部分配置 | ABSENT | 缺失历史CloudBase wrapper metadata；本轮由SDK补齐 |
| `Namespace` | SDK从DescribeEnvs.Functions[0]自动补:string | 未恢复request；manifest/config只有部分配置 | request.Namespace:string | 同合同映射/来源差异；不单独认定必填根因 |
| `Region` | Manager cloudBaseOptions/context → HTTP X-TC-Region | 未恢复request；manifest/config只有部分配置 | Manager context → HTTP X-TC-Region | 同合同映射/来源差异；不单独认定必填根因 |
| `functionRootPath` | MCP必需string；packer按root/name打包 | 未恢复request；manifest/config只有部分配置 | ABSENT；raw ZIP无需packer | 同合同映射/来源差异；不单独认定必填根因 |
| `base64Code` | 历史MCP未直接传；Manager SDK支持（已本地截获验证） | 未恢复request；manifest/config只有部分配置 | 未作为SDK参数；直接Code.ZipFile | 同合同映射/来源差异；不单独认定必填根因 |

D2 CreateFunction RequestId `ed7e1ff4-fcac-4cc3-8937-c2e0605188d4`，MissingParameter，accepted0。失败请求来源：[D2 executor](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d2/controlled-execution.cjs>)的deploy/scf/api路径。它已提供FunctionName、Code.ZipFile及Environment正确形状，不能无证据写成“没有Code”或“缺FunctionName”。

## 本地证明、修复与写入前门禁

[本地SDK捕获器](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d3/validate-request-builder.cjs>)初始化Manager只读环境后，将scfService.request临时替换为捕获边界；调用真实`manager.functions.createFunction`并在任何CREATE网络请求前抛出LOCAL_CAPTURE_ONLY。9个函数全部PASS：name/ns/runtime/handler/memory/timeout/install/role/network/init映射精确，Environment key names与批准matrix精确，Code.ZipFile解码字节hash与冻结ZIP精确；Stamp/ClsLogsetId/ClsTopicId存在。捕获器没有持久化Environment原值或base64 ZIP。

由于Manager func白名单不透传DiskSize，本轮仅在捕获到的SCF请求上显式补入冻结DiskSize512；这是transport mapping，未改变artifact/runtime contract。实际CREATE使用捕获到的同一request骨架，并保留历史wrapper已有的MINI_QCBASE和现有环境CLS元数据；不创建CLS资源、不上传COS、不创建trigger/layer。底层发送一次CreateFunction，禁止高级wrapper自动清理/递归重建/force覆盖。

SDK本地构造证明已恢复的本地请求合同，未证明云端问题修复；证据：[request-builder-validation.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d3/request-builder-validation.json>)。其`remoteCreateRequests=0`，9个requestShape只存字段名、类型、存在性及Environment key names，不存值。本地合同初评HIGH已由失败探针撤回；实际完成完整preflight和单函数CREATE尝试，探针未通过，因此剩余8个不继续。

冻结proposal `0940d1b322566c11df46898994a87c8effea5b1fa79a261711a44eec2a345f41`、manifest `e36b4caff11aa2886c1150d17c2250926049f779945f94286e55302a7d6c41da`、batch `ccc61b45a42a54f137ae599b682c37fa9300bc3f70a5d219255365d3619dbb08`；9 ZIP/production source/V1/shadow source均未修改。运行结果另写独立deploy/readback报告，不把本地schema PASS冒充云端PASS。

## 当前结论与下一边界

LOCAL_REQUEST_CONTRACT=9_PASS，HISTORICAL_CREATE_PATH=RECOVERED；Stamp/CLS omission=CONFIRMED_DIFF，COMPLETE_MISSING_PARAMETER_ROOT_CAUSE=NOT_CONFIRMED。公开文档、当前SDK构造、本地field映射不能替代这次云端拒绝的具体字段诊断。当前门禁STOP_PROBE_FAILED；优先只读定位上述RequestId对应的具体缺失字段并提交transport修复候选，不再发CREATE试错。执行收口见独立Phase1-D3 deploy/readback报告与blocker。
