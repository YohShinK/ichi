# TASK22 Phase1-D4｜9个Production Functions最终部署收口

执行日期：2026-10-03，Asia/Shanghai。最终状态：**9/9 DEPLOYED / REMOTE_READBACK_PASS / SECRET_BINDINGS_READY / DISABLED_SMOKE_PASS**。

## 最终结果

| 检查 | 结果 |
|---|---|
| Production functions | 9/9 Active，Nodejs20.19、index.main |
| Remote source/config read-back | 9/9 PASS；每函数17个批准文件逐SHA一致 |
| Secret bindings | 20/20 BOUND：identity9 / authority9 / cursor2 |
| Function flags / production controls | ENABLED=false；read-stop=true；所有feature=false；HA paused=true；epoch1 |
| Business rows / PUBLIC | 前后13个业务集合全部0 / PUBLIC0 |
| V1 structural diff | 0 |
| Shadow | UNCHANGED / SAFE_STOP；epoch41、PUBLIC0、flags=false、callers空 |
| Secret persisted / Git diff matches | 0 / 0；当前实际值及编码变体扫描1026个文件 |
| Frozen / protected files | 9ZIP及source/manifest/proposal/batch未改；1176个受保护文件最终drift0 |
| Git commit / push / WeChat publish | 0 / 0 / 0 |

## 授权、初始状态与范围

Founder明确要求执行本轮“自主解决部署问题直到9函数全部完成”总命令，覆盖旧D4失败即停止及禁止普通工程重试的限制。允许部署通道、非业务runtime/network参数和本轮新增目标的修复性更新；核心产品、数据、隐私及业务合同不变。旧D2/D3字段恢复已由Founder关闭，不回填为已定位。

初始14/14 production collections、23/23 explicit non-TTL indexes、14 ADMINONLY；业务数据0、PUBLIC0、controls4关闭行、9目标ABSENT。历史D4首函数因缺EipConfig拒绝，外层c8b395fe-ca1a-46ba-afa5-6297ca555ebc、内层09fcb6a8-d0d0-4d76-80de-8318ca2b79c0。初次本轮完整preflight PASS后创建首函数；恢复验证时再做完整preflight，2026-10-03T06:50:27.752Z，118只读回执，首函数当时已存在且归属本轮；其余目标未创建。

全过程不启动continuous bridge、historical migration/backfill、NETWORK/XHS、50/300、client release binding或正式微信发布。无删除、enable、control修改、业务数据写入。

## 问题、根因与自主处理

| 阶段/问题 | 根因与证据 | 处理与结果 |
|---|---|
| 历史D4 MissingParameter: EipConfig | 高层SDK递归映射公网配置，原输入只有PublicNetStatus=ENABLE，缺少嵌套EIP配置；平台完整message明确缺EipConfig | 新部署输入补齐publicNetConfig.eipConfig.eipStatus=DISABLE；高层真实TCB请求接受，远端回读DISABLE |
| 首次smoke本地误判失败 | 已返回SERVICE_UNAVAILABLE；旧判定强制Result.RetCode===0，但真实返回字段为Result.InvokeResult | allowlist诊断调用确认字段；改为InvokeResult===0，恢复内存绑定并重验首函数，PASS后自动余8。没有业务artifact改动 |
| 新执行器非TTY stdin关闭 | 默认命令输入结束导致进程READY后退出，无preflight/deploy动作 | 使用持续TTY会话，命令排队执行 |
| 离线SDK ABI脚本首次缺路径 | 原验证脚本要求隔离runtimeRoot，第一次未传 | 隔离安装wx-server-sdk4.0.2并传路径，ABI PASS/external requests0 |
| ABI验证覆盖历史证据中的Node版本 | 验证器写固定历史路径；本次Node24.15.0与历史Node20.19.5不同 | 新结果另存本轮目录；历史文件精确恢复到会话前SHA，最终protected drift0 |

本轮Cloud CREATE拒绝0，创建接受9，创建重试0；验证恢复1（不重复创建首函数），额外诊断invoke1。历史D4拒绝不混计为本轮写入。失败记录保留在execution.failures，最终status已被真实完成状态覆盖。

## 实际部署通道与运行配置

官方@cloudbase/manager-node5.9.0 functions.createFunction({func,base64Code,force:false})，实际TCB CreateFunction / 2018-06-08 / EnvId路径。SDK提供Stamp/CLS与Role映射；冻结ZIP精确base64输入。无需切换CREATE到SCF，也未使用temporary function root、COS上传、force覆盖、自动cleanup或UpdateCode/UpdateConfiguration。SCF只读GetFunction/GetFunctionAddress和关闭态Invoke用于核对。SDK自动删除、更新、非目标创建、非空trigger被护栏阻断。

最终PublicNetConfig结构：

```json
{"PublicNetStatus":"ENABLE","EipConfig":{"EipStatus":"DISABLE","EipAddress":[]}}
```

EipAddress为空是远端回读字段；请求只携带PublicNetStatus及EipStatus。TCB顶层EipConfig.EipFixed是不同接口字段，本轮无需它。官方依据：[CloudBase FunctionPublicNetConfig/FunctionEipConfig](https://cloud.tencent.com/document/api/876/34822)、[SCF PublicNetConfigIn](https://cloud.tencent.com/document/api/583/17244)。

Runtime Nodejs20.19，Handler index.main，Memory256MB，前6Timeout10s/后3Timeout20s，InitTimeout65s，DiskSize512MB，InstallDependency=TRUE，Role=TCB_QcsRole，layers/triggers均空。SDK不透传diskSize，平台实际默认512满足合同；远端实测通过，未追加低层参数。

## 每函数最终回读

| Function | 状态 | Approved source | Secret bindings | Disabled smoke | CREATE RequestId | 最终Invoke RequestId |
|---|---|---|---|---|---|---|
| query-public-map-leads | Active / PASS | 17/17 exact / PASS | 3 BOUND | SERVICE_UNAVAILABLE / InvokeResult0 | e0203ea6-aa79-4289-a806-7f8b5456c97b | 7026be42-adbb-4985-8814-9672e7b3ff23 |
| get-public-map-lead-detail | Active / PASS | 17/17 exact / PASS | 3 BOUND | SERVICE_UNAVAILABLE / InvokeResult0 | 693a0354-678b-4103-b95f-535110458bca | f9d6903f-9e27-404a-b57c-22f5ee39a8b0 |
| get-my-map-assistance | Active / PASS | 17/17 exact / PASS | 2 BOUND | SERVICE_UNAVAILABLE / InvokeResult0 | 142a20ad-48cc-4b63-a36a-001d52010a10 | 064c1ea5-e378-4e54-8539-dc770ba52965 |
| manage-map-contribution-consent | Active / PASS | 17/17 exact / PASS | 2 BOUND | SERVICE_UNAVAILABLE / InvokeResult0 | c45feff2-3bb0-4906-bfe1-b7efecd18549 | dd16c923-0f6c-4a59-9f9a-8c8457aefbed |
| manage-map-contribution | Active / PASS | 17/17 exact / PASS | 2 BOUND | SERVICE_UNAVAILABLE / InvokeResult0 | 6705bda3-a956-43a9-9f47-7354130843f4 | b399486d-436d-49b2-8402-230c1a753b04 |
| report-public-map-lead | Active / PASS | 17/17 exact / PASS | 2 BOUND | SERVICE_UNAVAILABLE / InvokeResult0 | 344dc4ae-61b0-4f5f-ac4e-f07877bc461a | 6fb9acc6-607c-4b2f-a676-6c53826d737f |
| answer-map-assistance | Active / PASS | 17/17 exact / PASS | 2 BOUND | SERVICE_UNAVAILABLE / InvokeResult0 | 6e446efc-3919-4ba0-ac88-82258297870c | 80eac8d9-c26c-4a7c-ad2f-71191c3171b7 |
| resolve-board-observation | Active / PASS | 17/17 exact / PASS | 2 BOUND | SERVICE_UNAVAILABLE / InvokeResult0 | ef9ed80c-8d8d-4e5b-bf14-6ad09ee760ee | 38f2a559-da02-4abe-a07d-4dee7cca75da |
| reconcile-map-projection | Active / PASS | 17/17 exact / PASS | 2 BOUND | SERVICE_UNAVAILABLE / InvokeResult0 | f791b8f0-24e8-47f9-9688-8e7822d69945 | 5bfd8eca-6780-4d59-a392-a745de8464d2 |

最终逐文件expected/actual SHA、remote package SHA、平台CodeSha256、config及secret logical presence/memory-match分别保存于execution.finalFunctionReadbacks。平台安装依赖产生node_modules，每个批准文件仍逐SHA匹配；只有依赖内容作为platformDependencyFiles单独记录，没有未批准应用文件。整个远端ZIP SHA与平台CodeSha256相同，因依赖安装而不同于本地冻结ZIP SHA是预期。

## Artifact与SHA

没有业务源码、artifact或合同修改；旧SHA→新SHA全部相同，业务修复/重打包0。

| Function | 旧/新 frozen ZIP SHA-256（相同） | 平台/下载package SHA-256（相同） |
|---|---|---|
| query-public-map-leads | a7ca4714578fedaef5533e85f55772fd96f95f48fc2540cfbdec3edf1b88f8d4 | 7d838ed5211306c8be1a68fe28763cae35717866e96aef8317198e6434e95d0c |
| get-public-map-lead-detail | e0bfac1f1615d6990281c3b7f95e50e1c0b524ed64b5829eaed9da4ef0327aeb | d4a708b3596e2d48cec5f76226f1ec2ab757e1cbd67281b837029accf537cb41 |
| get-my-map-assistance | a166ebc1a7b880d638b96c0777476d176bb99fb9208e2319db79670f1f49f66e | 9937b7cfe004a23ba1d3730b9a8c2ddd103388488f6336f4a3eddc51a2fb49e9 |
| manage-map-contribution-consent | 71b78cdb1c2b2a79d4bd32441d746fb5ff76af9d0ba57b5c188abf6087cb89a1 | 4418306e0c810b27f24979f749f3baaea452d2356bf35dfd5b8d7af2cdf88764 |
| manage-map-contribution | b36a4d9b2af5f4e19ab4ba2ae71a2a16172e6ef0720a9c3ae560f1b082123450 | 12c8b46d6e993be0e88861ec93abf1825511e31bfff434c088ffe1393fc5a7fb |
| report-public-map-lead | ece369e73dd6778f497954710876aea2290109da675dcfe2f2258aedd5dffafb | fa8cd739fc6838dcb1b11759925f6954393cb227adc18b83614ba354ad93265a |
| answer-map-assistance | 22082e1fd47e8fef52a4b4efcb4768c1287e520f715169930192839d2107dc14 | a05c8d4f02dcac98863a98c690958fd82100d135267eb9ecb44e1685d952fd3c |
| resolve-board-observation | 192300bd89c159e36d6a84ab146a9e05d9601e81131242f1da1b0a526279e2b2 | 0e1e57f386cef29699ab776478bda985775e0eaf7be17d246364555c93e1f013 |
| reconcile-map-projection | f1d4adbba248d665e86c29a0eb1fe1caff6c915da52c3f1e5508471dbd3a5a6f | 23b4e231b783fee62c3cef13fa7915d88081d5ec32e46293b96d17cd9bc139f2 |

proposal SHA=0940d1b322566c11df46898994a87c8effea5b1fa79a261711a44eec2a345f41；manifest SHA=e36b4caff11aa2886c1150d17c2250926049f779945f94286e55302a7d6c41da；batch SHA=ccc61b45a42a54f137ae599b682c37fa9300bc3f70a5d219255365d3619dbb08。

## Secrets与扫描

IDENTITY_HMAC_KEY从13个V1消费者内存回读一致并复用，9个新目标最终BOUND。新ICHI_V2_ACCOUNT_AUTHORITY_HMAC_KEY一次32bytes随机生成并绑定9；独立ICHI_V2_CURSOR_HMAC_KEY一次32bytes随机生成并绑定query/detail2。互不相同，不复用shadow。验证恢复时只从本轮已创建首函数读回现有binding到内存，没有再次生成、换key或修改旧消费者。

记录仅logical name、PRESENT/BOUND及内存比较布尔；值、新真实key hash、签名下载URL不保存至source/Git/Markdown/artifact/log/chat。扫描包含actual values及base64/hex/URL/JSON编码，tracked source、全部task22证据、docs/delivery、memory-bank及完整Git diff，最终0。已有Founder RISK_ACCEPTED_BY_FOUNDER / SECRET_UNCHANGED / ROTATION_WAIVED保持，不将旧identity暴露写成修复。

## 云端回归、不变量与V1/shadow

最终postflight：2026-10-03T06:54:54.037Z，118只读回执，structuralDiffs=[]。首次query前后各完整结构回查、余8前后quick invariant、最终完整postflight及9个最终source/config回读全部PASS。

40个既有集合结构、index/ACL、Storage完整metadata、function/storage规则与环境资源结构未变。V1 13集合/43历史索引口径/13ACL/19稳定函数以及9shadow完整config/layer/trigger均无结构差异；13既有identity consumers未修改。V1正常Count/Size增长仅记录，不是本轮业务写入。Shadow read-stoptrue/HApausedtrue/epoch41/PUBLIC0/flagsfalse/callers空。

Production14集合/23显式nonTTL/14ADMINONLY；13业务集合前后全部0，mapControlState4原行完整不变；read-stoptrue/all featuresfalse/HApausedtrue/epoch1/PUBLIC0。每个函数smoke前均核对冻结ENABLED=false在auth/DB之前拒绝；每个真实invoke返回SERVICE_UNAVAILABLE，最终9函数均InvokeResult0。累计invoke=11（query首次业务返回正确但本地旧检查误判1、诊断1、恢复后query与余8共9）。

## 本地验证

| 验证 | 结果 |
|---|---|
| 当前Manager参数映射 | 9 frozen包 / Eip递归结构 / 无network PASS |
| 合成secret编码脱敏 | 5类 PASS |
| 安全mutation护栏 | 8检查 PASS，network0/secret0 |
| Frozen artifact validator | 9包 PASS |
| Resource/schema/API dry-run | 6检查 PASS，无remote |
| SDK offline ABI | wx4.0.2/database1.4.3 PASS，external0 |
| 全量Vitest | 103 passed / 1 skipped文件，1140 passed / 1既有skip tests |
| Next.js production build | PASS |
| Playwright真实浏览器回归 | 26/26 PASS（非人工视觉验收） |
| Workflow / git diff --check | PASS |

未操作浏览器UI或真机，不将关闭态服务部署验收扩展为生产客户端/桥接/发布真机验收。各log与机器证据位于artifacts/task22/phase1d4-final。

## External writes与RequestIds

accepted CreateFunction=9（包含9代码部署与20环境secret bindings）；UpdateFunctionCode=0、UpdateFunctionConfiguration=0、Delete=0、DB/control写=0、Storage上传/删除=0、enable/bridge=0。所有创建都为本轮9个明确目标；原28函数未更新。

创建和最终smoke RequestIds见上表；首次smoke5ee7a113-8c65-4c55-850f-3d0cc9e48911、诊断c834839d-46ad-494c-b6ec-d43c00ae530a。源回读/完整结构/quick invariant已保存的全部请求编号见[cloud-request-id-inventory.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d4-final/cloud-request-id-inventory.json>)。SDK内部轮询请求编号未导出，不把库存称为每个底层HTTP请求的完整审计。

## Git与当前Gate

Branch `feature/v2-board-map`，HEAD `929d189a06e13010e50abf4927bfec3b1ebd49fc`；现有工作树包含273项已修改/未跟踪状态，继承历史工作不回退。本轮只改四个正式memory-bank文件、新执行证据及本独立报告；最终受保护输入1176文件drift0。未commit/push/PR/merge/tag。

`TASK22=IN_PROGRESS / PHASE1_D_COMPLETE / PRODUCTION_DISABLED / PHASE2_LOCKED`。本轮9函数部署、绑定、远端回读、关闭态验收目标已达成；这不表示TASK22整体/V2/生产发布完成。V2-E仍活动；Phase2、NETWORK、50/300、client binding/正式发布保持LOCKED。

下一步：Founder审阅本收口后再明确授权TASK22 Phase2的Unified Source Schema与V1→V2 Continuous Bridge；先做Phase2认知对齐与范围确认，不自动执行桥接或迁移。

主要证据：[result-summary.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d4-final/result-summary.json>)、[execution.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d4-final/execution.json>)、[postflight.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d4-final/postflight.json>)、[secret-leakage-scan.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d4-final/secret-leakage-scan.json>)。
