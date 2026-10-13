# ICHI TASK-V2-22 Phase1-D2｜Secret bindings + production functions deployment readback

执行日期：2026-10-03（Asia/Shanghai）。结果：`STOP_PARTIAL_DEPLOY / FIRST_CREATE_REJECTED / NOT_DEPLOYED`。**首个 CREATE 被平台拒绝，0/9 函数存在；未完成部署。** 这是执行失败后的独立收口报告；历史 Phase1-A/B/C/D 报告与证据保留原样。

## 授权、secret 与冻结边界

本轮来源：`/Users/cunfu/Downloads/ICHI_TASK-V2-22_Phase1-D2_Production-Secrets_9-Functions-Deploy_Disabled-Smoke_总命令.md`。Founder 批准 frozen 9 CREATE、exact 20 logical bindings、关闭态 readback/smoke；未授权启用、业务写入、V1→V2 bridge、迁移、Phase2、NETWORK、上海50/全国300、client binding/release、Git/微信发布或 cleanup。第12节要求任何部署/binding失败立即 STOP，不续后续、不换key重试、不删函数。

IDENTITY_HMAC_KEY = PRESENT / REUSED_IN_MEMORY / VALUE_NOT_RECORDED；13 existing V1 consumers一致，9新增目标实际NOT_BOUND。两个新的production-only key各由密码学安全随机32bytes独立生成一次，值只在受控进程内存中，互不相同、不复用identity/shadow，尚未成功绑定；SECRET_VALUES_OR_REAL_KEY_HASHES_RECORDED=NONE。没有 secret manager/vault 资源创建，不能把内存生成写成云端密钥创建成功。Founder旧风险为 `RISK_ACCEPTED_BY_FOUNDER / SECRET_UNCHANGED / ROTATION_WAIVED`；旧明文输出风险没有被修复。

内存执行通道直接使用已安装 CloudBase Manager 的 commonService，不调用会输出原始 Environment 的工具，不写env/temp/value/fixture，不把key作为shell参数，不记录请求body或错误message。所有SDK stdout/stderr输出被关闭；证据只允许逻辑名/布尔状态/RequestId。新secret只随首个 CREATE 的 Environment 在受控请求内发送，平台拒绝后没有持久化binding；读取后验证13个旧consumer保持原值。最终覆盖式扫描匹配实际三把值及其常用可复用编码，但只输出命中数量，结束进程释放引用。

冻结输入逐字节核验，无重建/替换：

| Input | SHA-256 |
|---|---|
| production proposal | `0940d1b322566c11df46898994a87c8effea5b1fa79a261711a44eec2a345f41` |
| production artifact manifest | `e36b4caff11aa2886c1150d17c2250926049f779945f94286e55302a7d6c41da` |
| Phase1-D batch | `ccc61b45a42a54f137ae599b682c37fa9300bc3f70a5d219255365d3619dbb08` |

## Pre-state 与完整 postflight

preflight：2026-10-03T00:42:21+08:00；postflight：2026-10-03T00:44:03+08:00。两次完整比较 PASS / structuralDiffs=[]：40 collections集合与所有schema/index/ACL基线精确相同，production 14/14 collections、23/23 explicit nonTTL indexes、14/14 ADMINONLY、13业务空集合、mapControlState4 exact rows；28既有functions（19 V1+9shadow）的完整stable config匹配冻结基线，trigger/layer不变，Storage两对象metadata/根目录、Storage/function rules和environment既有资源结构不变。每次保存108项API读回执，另读取Storage完整metadata；不把未保存RequestId的SDK隐式请求计成精确总读数。

V1 13 collections / 43 indexes（含既有自动索引的历史统计口径）/ 13 ACL / 19 functions均回查不变。V1正常Count/Size变化仅记录；异常清空/显著删除与结构差异才触发hard stop。与Phase1-D历史基线的正常变化见下表；本次pre→post所有集合Count/Size相同，V1_STRUCTURAL_DIFF=0。

| V1 collection | 历史 Count / Size | 本次 Count / Size |
|---|---:|---:|
| `accounts` | 121 / 18271 | 123 / 18573 |
| `auditEvents` | 346 / 97426 | 362 / 102195 |
| `dailyQuotas` | 30 / 33353 | 32 / 35474 |
| `ichiIds` | 122 / 16669 | 124 / 16941 |
| `observationCandidates` | 19 / 57285 | 23 / 70765 |
| `profiles` | 121 / 37794 | 123 / 38416 |
| `recognitionJobs` | 76 / 797272 | 81 / 873611 |
| `recordCodes` | 41 / 7831 | 45 / 8595 |
| `wechatIdentities` | 121 / 24442 | 123 / 24846 |

Production schema为CloudBase NoSQL文档contract，无独立DDL字段schema操作；实际index/ACL与冻结proposal逐项比较。自动 `_id_`/`_openid_1` 不计入23个explicit indexes。

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

control4包含read-stop=true、epoch=1/mutationRevision0、features全部false/haPaused=true、冻结policy完全相同；publicMapLeads PUBLIC=0。shadow read-stop=true、HA paused=true、epoch41、PUBLIC0、9函数enable flags全false、caller allowlists空；完整stable config及相关schema/index/ACL/rules与基线一致。

证据：[preflight.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d2/preflight.json>)、[postflight.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d2/postflight.json>)、[production-resource-validation.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d2/production-resource-validation.json>)。

## 9 functions / ZIP / 实际部署与远端source

所有函数预期 frozen non-secret config为 `ICHI_V2_BACKEND_MODE=production` / `ICHI_V2_FUNCTION_ENABLED=false`。runtime Nodejs20.19、entry index.main、memory256；前6timeout10，后3timeout20；triggers/layers空，dependency install TRUE、role TCB_QcsRole、public network ENABLE、initTimeout65、disk512，均来自 frozen batch，没有更改。

| Order | Function | Frozen local ZIP SHA-256 | Deploy | Remote source |
|---|---|---|---|---|
| 1 | `query-public-map-leads` | `a7ca4714578fedaef5533e85f55772fd96f95f48fc2540cfbdec3edf1b88f8d4` | REJECTED / MissingParameter | ABSENT / NOT_RUN |
| 2 | `get-public-map-lead-detail` | `e0bfac1f1615d6990281c3b7f95e50e1c0b524ed64b5829eaed9da4ef0327aeb` | NOT_ATTEMPTED | ABSENT / NOT_RUN |
| 3 | `get-my-map-assistance` | `a166ebc1a7b880d638b96c0777476d176bb99fb9208e2319db79670f1f49f66e` | NOT_ATTEMPTED | ABSENT / NOT_RUN |
| 4 | `manage-map-contribution-consent` | `71b78cdb1c2b2a79d4bd32441d746fb5ff76af9d0ba57b5c188abf6087cb89a1` | NOT_ATTEMPTED | ABSENT / NOT_RUN |
| 5 | `manage-map-contribution` | `b36a4d9b2af5f4e19ab4ba2ae71a2a16172e6ef0720a9c3ae560f1b082123450` | NOT_ATTEMPTED | ABSENT / NOT_RUN |
| 6 | `report-public-map-lead` | `ece369e73dd6778f497954710876aea2290109da675dcfe2f2258aedd5dffafb` | NOT_ATTEMPTED | ABSENT / NOT_RUN |
| 7 | `answer-map-assistance` | `22082e1fd47e8fef52a4b4efcb4768c1287e520f715169930192839d2107dc14` | NOT_ATTEMPTED | ABSENT / NOT_RUN |
| 8 | `resolve-board-observation` | `192300bd89c159e36d6a84ab146a9e05d9601e81131242f1da1b0a526279e2b2` | NOT_ATTEMPTED | ABSENT / NOT_RUN |
| 9 | `reconcile-map-projection` | `f1d4adbba248d665e86c29a0eb1fe1caff6c915da52c3f1e5508471dbd3a5a6f` | NOT_ATTEMPTED | ABSENT / NOT_RUN |

首个部署前再次确认目标ABSENT、ZIP与源清单hash匹配。首个 CREATE 请求 2026-10-03T00:43:05+08:00，RequestId `ed7e1ff4-fcac-4cc3-8937-c2e0605188d4`，返回 `MissingParameter`。实际请求的非secret结构由受控executor可审阅；Environment只包含两项冻结config和该函数获批3项secret，Code.ZipFile来自冻结ZIP。**写调用已发起，因此不使用“可修正写前参数”的例外重试。** 其余8 CREATE均NOT_ATTEMPTED，无config UPDATE、无secret再生成、无删除、无invoke。

postflight ListFunctions完整28/28名单确认9目标全ABSENT；所有status/runtime/entry/config/trigger/layer/secret readback目标均不存在。9个远端源比较NOT_RUN / TARGET_ABSENT，remote download0；platform codeSha为N/A，不能用本地ZIP SHA冒充remote source PASS或平台安装依赖后codeSha。

[Tencent Cloud CreateFunction API](https://cloud.tencent.com.cn/document/api/583/18586)列出必填Code与FunctionName等及可选CodeSource；当前保留的安全回执只有错误码和RequestId，没有保留可能带请求内容的错误message，无法从该码独立确认缺失字段。CloudBase Manager创建路径默认加入Stamp与CLS参数的差异只属只读候选依据，未证明它们就是本次缺失原因，未拿云端重试验证。

执行回执：[execution.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d2/execution.json>)；各目标的ABSENT、binding与smoke状态：[target-function-readback.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d2/target-function-readback.json>)。

## 20 logical secret binding matrix（授权 → 实际）

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

授权TOTAL20，实际BOUND0/20。未多绑/少绑成功资源，9 targets全ABSENT；旧13 consumers值一致且未改。本次两个新key已经内存生成但未被保存或成功绑定，不能声称SECRET_BINDINGS_READY。最终 `SECRET_VALUE_PERSISTED_IN_PROJECT_FILES=0`，扫描实际值而非仅搜索key名称，覆盖全部tracked source、untracked task artifacts、docs/delivery、phase1d*、memory-bank和完整Git diff（包括已有变更）。见 [secret-leakage-scan.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d2/secret-leakage-scan.json>)；未记录匹配值、可复用编码或真实keyhash。

## Disabled smoke / side effects

9/9 NOT_CALLED / TARGET_ABSENT，smoke invoke0，不声称SERVICE_UNAVAILABLE remote PASS。静态 frozen createMain 在shared/runtime.mjs:1210—1216执行关闭检查，先于cloud.database、trustedAccount、rate/transaction；artifact validator对9包关闭路径的无DB调用验证PASS。没有开flag、写fixture、业务row或synthetic data；13业务Count0、PUBLIC0、control4完整不变，business/control/identity writes=0。生产服务继续停止。

## 失败、重试、写入精确计数与回滚

- External write attempts：**1**（CreateFunction）；accepted：**0**；confirmed successful function/config/binding mutations：**0**。
- Deployment failures：**1**（MissingParameter），CREATE retries：**0**，config updates：**0**，后续8函数：NOT_ATTEMPTED。
- partial deploy：**false**（postflight9targets均ABSENT）；按命令归入STOP_PARTIAL_DEPLOY门禁，不意味着已存在部分函数。
- Read-only channel validation diagnostics：4（2个Storage API InvalidParameter、1个SDK空function-resource本地校验、1个误写shadow collection名导致ResourceNotFound），均在首写前修正，new secret generation0/write0。见 [pre-write-read-errors.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d2/pre-write-read-errors.json>)。
- 本地泄漏扫描初次Git diff超过默认1MiB缓冲，出现ENOBUFS；仅在同一进程内把child-process缓冲上限扩至64MiB后完成全量扫描。短暂localhost debugger只用于修补缓冲设置，没有读取密钥，已关闭；没有cloud retry。最终scanner成功独立记录。
- 本轮新随机key生成次数2（各一次），失败后没有重新生成或换值；最终结束进程，不以temp/ignored文件保存。
- 无函数/数据可回滚，未自动删除或清理；未来必须单独批准新的写尝试，绝不覆写既有V1/shadow。executor持久化write-attempt存在时再次启动会STOP，防止默认重跑。

## 验证、Git与当前gate

production artifact validator9 PASS；独立production resource validator pre/post14/23/14ACL/13empty/control4 PASS；resource/schema/API contract dry-run6 PASS（remote access0）；workflow validator PASS；git diff --check PASS；secret leakage scanPASS。frozen source未改，不重跑或冒充本轮full Vitest/Playwright/Next/微信验收。942-file prestate比对仅四份指定memory-bank有意变更，生产源码、ZIP/proposal/manifest/batch、design-document、历史A/B/C/D报告及证据不变。既有Git工作区变更保留，commit/push/PR/tag/merge0。

当前 `PHASE1_D_PRODUCTION_FUNCTIONS=STOP_PARTIAL_DEPLOY / FIRST_CREATE_REJECTED / NOT_DEPLOYED`；`TASK-V2-22=IN_PROGRESS / PHASE_1_PRODUCTION_BACKEND_CONVERGENCE_IMPLEMENTED / LOCAL_GATES_PASS / EXTERNAL_ACTION_APPROVAL_REQUIRED`。Phase2 LOCKED；不是PRODUCTION_ACTIVE/PHASE1_COMPLETE/TASK22_COMPLETE/HUMAN_APPROVED。

下一最小Founder decision：审阅 [v2-e-task-22-phase1d2-partial-deploy-blocker.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1d2-partial-deploy-blocker.md>) 与参数修复依据后，决定是否单独授权新的单次CREATE（secret仍只能内存处理）。MissingParameter字段尚未确证；不能自动把本轮失败当作继续写入许可。当前任务在只读回查和证据收口后STOP。
