# ICHI TASK-V2-22 Phase1-D3｜Production functions deploy/readback

日期2026-10-03（Asia/Shanghai）。`STOP_PROBE_FAILED / FIRST_CREATE_REJECTED / NOT_DEPLOYED`，production functions0/9，partial deploy=false。单函数probe被平台拒绝；本轮未完成部署，未继续余8个。

## 授权、pre-state和根因溯源

来源：`/Users/cunfu/Downloads/ICHI_TASK-V2-22_Phase1-D3_溯源成功部署格式_单函数探针通过后自动全量部署_总命令.md`。Founder授权修复transport、重生本轮两把secret、复用旧IDENTITY_HMAC_KEY、首先CREATE query并完成binding/source/smoke/invariants，全部通过才自动继续8个。probe任一失败立即STOP；不启用服务、写业务数据、改control/schema/index、V1→V2 bridge、迁移、Phase2、NETWORK/50/300、clientrelease、Git/微信发布或cleanup。

完整读取D2报告/回执、frozen batch/proposal/artifact manifest、exact diff/artifact validation/rollback、A/B/C closeout、TASK19报告与真实历史执行记录、services/cloudbase与shadow-functions源码树、五份memory-bank。历史transport证据和22字段A/B/C比较见 [v2-e-task-22-phase1d3-createfunction-format-root-cause.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1d3-createfunction-format-root-cause.md>)。

根因范围：D2确实绕过历史CloudBase Manager wrapper并缺少Stamp/CLS映射；本地9包SDK request builder截获与冻结参数/ZIP验证PASS。但本轮补齐后的probe仍MissingParameter，**完整服务器缺失参数根因未确认**；本地合同初评HIGH已经被失败probe否证，当前ROOT_CAUSE_CONFIDENCE=NOT_CONFIRMED_AFTER_REJECTED_PROBE。不把Stamp/CLS候选差异写成已证实完整根因或已修复。V1_CREATE_FORMAT=NOT_RECOVERABLE_FROM_REPO；TASK19 CREATE RequestId历史精简输出未记录，实际update成功RequestId已恢复，均在独立报告注明，不编造。

preflight：2026-10-03T01:20:22+08:00。9targets全ABSENT，完整schema/index/ACL/config/rules/Storage不变量PASS。历史D2有1个失败write attempt，本轮新的授权允许1个probe，不把旧失败请求算成本轮retry，也不假设D2内存key仍存在。

## Frozen输入、9函数与顺序

proposal SHA `0940d1b322566c11df46898994a87c8effea5b1fa79a261711a44eec2a345f41`；manifest SHA `e36b4caff11aa2886c1150d17c2250926049f779945f94286e55302a7d6c41da`；batch SHA `ccc61b45a42a54f137ae599b682c37fa9300bc3f70a5d219255365d3619dbb08`。每包部署前重新计算，全部源文件/ZIP/manifest/proposal原样；没有重建或改业务合同。

全部预期Nodejs20.19 / index.main / memory256 / trigger0 / layer0；前6timeout10、后3timeout20，installDependencyTRUE、initTimeout65、disk512、roleTCB_QcsRole、public networkENABLE。环境非secret仅backend_mode=production、function_enabled=false；targets不存在，不能写成在线config readback PASS。

| Order | Function | Frozen local ZIP SHA-256 | CREATE | Remote source | Smoke |
|---|---|---|---|---|---|
| 1 | `query-public-map-leads` | `a7ca4714578fedaef5533e85f55772fd96f95f48fc2540cfbdec3edf1b88f8d4` | REJECTED | ABSENT / NOT_RUN | NOT_CALLED |
| 2 | `get-public-map-lead-detail` | `e0bfac1f1615d6990281c3b7f95e50e1c0b524ed64b5829eaed9da4ef0327aeb` | NOT_ATTEMPTED | ABSENT / NOT_RUN | NOT_CALLED |
| 3 | `get-my-map-assistance` | `a166ebc1a7b880d638b96c0777476d176bb99fb9208e2319db79670f1f49f66e` | NOT_ATTEMPTED | ABSENT / NOT_RUN | NOT_CALLED |
| 4 | `manage-map-contribution-consent` | `71b78cdb1c2b2a79d4bd32441d746fb5ff76af9d0ba57b5c188abf6087cb89a1` | NOT_ATTEMPTED | ABSENT / NOT_RUN | NOT_CALLED |
| 5 | `manage-map-contribution` | `b36a4d9b2af5f4e19ab4ba2ae71a2a16172e6ef0720a9c3ae560f1b082123450` | NOT_ATTEMPTED | ABSENT / NOT_RUN | NOT_CALLED |
| 6 | `report-public-map-lead` | `ece369e73dd6778f497954710876aea2290109da675dcfe2f2258aedd5dffafb` | NOT_ATTEMPTED | ABSENT / NOT_RUN | NOT_CALLED |
| 7 | `answer-map-assistance` | `22082e1fd47e8fef52a4b4efcb4768c1287e520f715169930192839d2107dc14` | NOT_ATTEMPTED | ABSENT / NOT_RUN | NOT_CALLED |
| 8 | `resolve-board-observation` | `192300bd89c159e36d6a84ab146a9e05d9601e81131242f1da1b0a526279e2b2` | NOT_ATTEMPTED | ABSENT / NOT_RUN | NOT_CALLED |
| 9 | `reconcile-map-projection` | `f1d4adbba248d665e86c29a0eb1fe1caff6c915da52c3f1e5508471dbd3a5a6f` | NOT_ATTEMPTED | ABSENT / NOT_RUN | NOT_CALLED |

本轮没有远端package下载、没有platform codeSha；9source comparison均NOT_RUN / TARGET_ABSENT。本地ZIP SHA和本地SDK参数构造PASS不能冒充remote source PASS、平台安装依赖后codeSha或runtime在线readback。

## Request mapping、receipt与parameter诊断

使用真实`manager.functions.createFunction`构造请求：envId/region在Manager context，func.name/handler/envVariables/memorySize等映射到SCF字段，Namespace/Stamp/CLS由已存在环境注入，base64Code来自冻结ZIP。为避免SDK未透传DiskSize，在transport上补冻结512。构造阶段scfService.request被本地捕获边界截断，不发送CREATE；恢复服务后将该骨架通过commonService(scf).call只发送一次CreateFunction，不使用force或可能自动删除/递归create的高级执行分支。没有COS上传、CLS资源创建或trigger/layer动作。

唯一网络CREATE：2026-10-03T01:21:05+08:00，function query-public-map-leads，RequestId `e9762b39-752e-4c1f-a522-a583e9fb8134`；result `REJECTED / MissingParameter`。method、field/type/presence、Environment key names、Code来源、RequestId/result已永久保存于 [execution.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d3/execution.json>)。

| Request builder field | Type | Present |
|---|---|---|
| `Handler` | string | True |
| `Runtime` | string | True |
| `MemorySize` | number | True |
| `InstallDependency` | string | True |
| `Namespace` | string | True |
| `Role` | string | True |
| `Stamp` | string | True |
| `ClsTopicId` | string | True |
| `ClsLogsetId` | string | True |
| `FunctionName` | string | True |
| `Timeout` | number | True |
| `Type` | string | True |
| `PublicNetConfig` | object | True |
| `InitTimeout` | number | True |
| `L5Enable` | null | True |
| `Environment` | object | True |
| `Code` | object | True |
| `DiskSize` | number | True |

Code={ZipFile:string}，内容NOT_CAPTURED；Code来源=Manager base64Code / frozen ZIP。Environment.Variables是数组、每项字段Key/Value；只记录逻辑名 `ICHI_V2_BACKEND_MODE`、`ICHI_V2_FUNCTION_ENABLED`、`IDENTITY_HMAC_KEY`、`ICHI_V2_ACCOUNT_AUTHORITY_HMAC_KEY`、`ICHI_V2_CURSOR_HMAC_KEY`，所有values NOT_CAPTURED。L5Enable为SDK默认null，属于构造器形状；底层会移除null/undefined，不把它记成实际非空HTTP字段。

完整error code=MissingParameter、RequestId已记录；safe parameter-name extractor返回空数组，没有取得具体缺失字段。`PARAMETER_NAME=NOT_AVAILABLE_IN_CAPTURED_SAFE_ERROR`是诊断缺口，不声称平台已明确指向Code/FunctionName/Stamp/CLS。没有保存可能含请求值的message/原始Environment、secret/hash/base64 ZIP、OpenID或私有Account数据。

## Probe门禁与20 logical bindings

probe CREATE未accepted，所以ACTIVE/config/binding/remote source/smoke/invariants联合门未通过：`STOP_PROBE_FAILED`。自动续8个的条件未满足，全部NOT_ATTEMPTED。未换key、重生key、修改包、enable、删除或发第二次CREATE。

| Function | IDENTITY_HMAC_KEY | ICHI_V2_ACCOUNT_AUTHORITY_HMAC_KEY | ICHI_V2_CURSOR_HMAC_KEY |
|---|---|---|---|
| `query-public-map-leads` | YES → NOT_BOUND | YES → NOT_BOUND | YES → NOT_BOUND |
| `get-public-map-lead-detail` | YES → NOT_BOUND | YES → NOT_BOUND | YES → NOT_BOUND |
| `get-my-map-assistance` | YES → NOT_BOUND | YES → NOT_BOUND | NO → ABSENT |
| `manage-map-contribution-consent` | YES → NOT_BOUND | YES → NOT_BOUND | NO → ABSENT |
| `manage-map-contribution` | YES → NOT_BOUND | YES → NOT_BOUND | NO → ABSENT |
| `report-public-map-lead` | YES → NOT_BOUND | YES → NOT_BOUND | NO → ABSENT |
| `answer-map-assistance` | YES → NOT_BOUND | YES → NOT_BOUND | NO → ABSENT |
| `resolve-board-observation` | YES → NOT_BOUND | YES → NOT_BOUND | NO → ABSENT |
| `reconcile-map-projection` | YES → NOT_BOUND | YES → NOT_BOUND | NO → ABSENT |

授权20，实际BOUND0/20。IDENTITY_HMAC_KEY = PRESENT / REUSED_IN_MEMORY / VALUE_NOT_RECORDED，旧13consumers内存比较一致并保持未修改。本轮authority与cursor各由32bytes密码学随机独立生成一次，互不相同、不复用identity/shadow，只进入受控内存与唯一CREATE请求；平台拒绝，没有成功binding，没有secret vault资源创建，不能写成云端key已建立。

旧身份密钥风险接受持续 `RISK_ACCEPTED_BY_FOUNDER / SECRET_UNCHANGED / ROTATION_WAIVED`；未轮换、dual-key/lazy/alias/identity migration，未把暴露写成已修复。

## Pre/post DB、V1、shadow与smoke

postflight：2026-10-03T01:22:49+08:00。production14/14collections、23/23explicit nonTTL indexes、14/14 ADMINONLY、13业务Count0、control4完全不变，所有既有40集合index/ACL结构精确匹配基线。V1 13collections/43indexes（含自动索引历史口径）/13ACL/19functions完整stable字段不变，所有既有28函数trigger/layer/code/config均匹配，Storage2对象元数据、Storage/function rules及environment已有资源结构不变：V1_STRUCTURAL_DIFF=0。

| Production collection | Pre Count | Post Count |
|---|---:|---:|
| `boardAssociations` | 0 | 0 |
| `boardInstances` | 0 | 0 |
| `boardObservations` | 0 | 0 |
| `mapAccountPolicies` | 0 | 0 |
| `mapAssistanceEvidence` | 0 | 0 |
| `mapAssistanceRequests` | 0 | 0 |
| `mapAuditEvents` | 0 | 0 |
| `mapContributionConsents` | 0 | 0 |
| `mapContributions` | 0 | 0 |
| `mapControlState` | 4 | 4 |
| `mapModerationLedger` | 0 | 0 |
| `mapProjectionOutbox` | 0 | 0 |
| `publicMapLeads` | 0 | 0 |
| `publicMapQuerySnapshots` | 0 | 0 |

control4全量比较PASS：read-stoptrue、epoch1/mutationRevision0、features全false/haPausedtrue、policy冻结值全相同，PUBLIC0。shadow read-stoptrue、HApausedtrue、epoch41、PUBLIC0，9函数enable flags全false、caller allowlists空；相关schema/index/ACL与完整stable config全不变。没有触碰测试停机状态。

正常live volume漂移仅记录，结构配置及异常删除才hard stop；与D2基线比较：

| Existing collection | D2 Count/Size | D3 Count/Size |
|---|---:|---:|
| 无 | — | — |

9/9 disabled smoke NOT_CALLED / TARGET_ABSENT，invoke0；本地artifact validator证实关闭路径在DB/auth/rate/tx/write前返回SERVICE_UNAVAILABLE，但无云端响应可写为PASS。production business/control/identity writes0，PUBLIC0，未写fixture/PLAYER/NETWORK数据。

## 验证、泄漏扫描、失败/重试、回滚及Git

artifact validator9 PASS；resource/schema/API dry-run6 PASS（remote access0）；本地SDK request builder capture9 PASS（CREATE network0）；独立resource validator pre/post14/23/14ACL/13empty/control4 PASS；workflow validator与git diff --check PASS。冻结production源码未改，本轮不重跑或冒充完整Vitest/Playwright/Next/微信验收。

实际三把secret及常用可复用编码的内存匹配扫描覆盖tracked files、untracked task artifacts、docs/delivery、phase1d*、memory-bank与完整Git diff，`SECRET_VALUE_PERSISTED_IN_PROJECT_FILES=0`；只记录命中数量，不保存值或真实keyhash。进程最后再次扫描包含最终报告的完整范围并结束，释放本轮key引用；失败后没有重新生成。见 [secret-leakage-scan.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d3/secret-leakage-scan.json>)。

- 本轮Cloud external write attempts=**1**，accepted=**0**，confirmed function/config/secret mutations=**0**。
- Probe CREATE failures=**1**；CREATE retries=**0**；config UPDATE=**0**；subsequent CREATE=**0**；invoke=**0**。
- productionFunctions0/9 / logicalBindings0/20 / partialDeploy=false；没有任何已创建函数需要回滚或清理。
- 保留不存在目标的证据与拒绝回执；禁止自动delete/cleanup；持久化write-attempt存在时executor再次启动默认STOP，防止误重跑。
- 955文件prestate仅四份指定memory-bank变更，design-document、frozen source/9 ZIP/proposal/manifest/batch、V1/shadow源、历史A/B/C/D/D2报告及证据字节不变；已有Git变更保留，commit/push/PR/merge/tag0。

## Current gate / 下一最小决策

`PHASE1_D_PRODUCTION_FUNCTIONS=STOP_PROBE_FAILED / FIRST_CREATE_REJECTED / NOT_DEPLOYED`；`TASK-V2-22=IN_PROGRESS / PHASE_1_PRODUCTION_BACKEND_CONVERGENCE_IMPLEMENTED / LOCAL_GATES_PASS / EXTERNAL_ACTION_APPROVAL_REQUIRED`；Phase2LOCKED，不是PRODUCTION_ACTIVE/PHASE1_COMPLETE/TASK22_COMPLETE/HUMAN_APPROVED。

下一最小Founder decision：先只读定位RequestId对应具体缺失字段、审阅transport修复候选，再决定是否另行授权新的单函数尝试。当前不再发CREATE试错，不恢复余8部署，继续保持停机。独立blocker：[v2-e-task-22-phase1d3-partial-deploy-blocker.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1d3-partial-deploy-blocker.md>)；前后回查与各目标状态：[preflight.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d3/preflight.json>)、[postflight.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d3/postflight.json>)、[target-function-readback.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d3/target-function-readback.json>)。
