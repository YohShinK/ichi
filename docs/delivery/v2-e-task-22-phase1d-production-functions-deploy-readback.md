# TASK22 Phase1-D｜Production Function Deploy Preflight / Secret Gate STOP

`STOP_SECRET_BINDING_APPROVAL_REQUIRED / STOP_BEFORE_FIRST_DEPLOY`；0/9 functions DEPLOYED，0 code upload/config mutation/secret binding，0 cloud invokes，0 business writes，0 external write calls，partial deploy=false，create retries=0。

## Task、授权与 pre-state

Founder明确要求执行 [ICHI_TASK-V2-22_Phase1-D_9-Production-Functions_Deploy_Disabled-State-Readback-Smoke_总命令 (1).md](</Users/cunfu/Downloads/ICHI_TASK-V2-22_Phase1-D_9-Production-Functions_Deploy_Disabled-State-Readback-Smoke_总命令 (1).md>)。本命令授权冻结9函数CREATE/DEPLOY和关闭态回查，但第2节明确不授权新secret创建/绑定，第6节D要求在deploy前检查required secrets。当前命令原文：

> 若 frozen production function 需要某个尚不存在的新 production-only secret：DO NOT GENERATE / DO NOT BIND / DO NOT SUBSTITUTE；在对应函数部署前：STOP_SECRET_BINDING_APPROVAL_REQUIRED。

这一门在第一个函数 query-public-map-leads 之前触发，按命令停止，没有用技术上可行的无secret关闭态部署绕过授权条件。没有生产源码改动、重新构建、函数参数修复或部分部署。

环境 cloud1-d7gxqfwv783a1f131 / ap-shanghai / NoSQL NORMAL；Phase1-A APPLIED_READBACK_PASS，Phase1-B CLOSED_BY_FOUNDER_WAIVER，Phase1-C APPLIED_READBACK_PASS。pre/post总40集合、28既有函数；14/14production集合、23/23explicit non-TTL索引、14/14ADMINONLY已应用，13业务集合Count0、mapControlState仅4行、read-stop=true、flagsfalse/haPausedtrue/epoch1、PUBLIC0。production functions仍0/9，Phase2 LOCKED。

## Frozen inputs / batch / deploy order

- Frozen proposal SHA-256 `0940d1b322566c11df46898994a87c8effea5b1fa79a261711a44eec2a345f41`：[cloudbase-production-resource-proposal.json](</Users/cunfu/Documents/ichi 2/packages/v2-map/resources/production/cloudbase-production-resource-proposal.json>)。
- Frozen artifact manifest SHA-256 `e36b4caff11aa2886c1150d17c2250926049f779945f94286e55302a7d6c41da`：[cloudbase-production-artifacts.json](</Users/cunfu/Documents/ichi 2/packages/v2-map/resources/production/cloudbase-production-artifacts.json>)。
- Deployment batch [phase1-d-production-functions-deploy-batch.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d/phase1-d-production-functions-deploy-batch.json>)；SHA-256 `ccc61b45a42a54f137ae599b682c37fa9300bc3f70a5d219255365d3619dbb08`。
- [batch-validation.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d/batch-validation.json>)：9名字/ZIP/source manifests/每个source字节/allowlist/non-secret config精确匹配，9包artifact validator PASS。
- Exact-diff为函数清单，没有强制部署依赖序；依第6节fallback形成read-only → owner/read commands → HA → resolver → projector顺序。下表为计划顺序，实际部署调用0。

| order / function | frozen ZIP SHA-256 | source read-back |
| --- | --- | --- |
| 1. query-public-map-leads | a7ca4714578fedaef5533e85f55772fd96f95f48fc2540cfbdec3edf1b88f8d4 | NOT_RUN / TARGET_ABSENT |
| 2. get-public-map-lead-detail | e0bfac1f1615d6990281c3b7f95e50e1c0b524ed64b5829eaed9da4ef0327aeb | NOT_RUN / TARGET_ABSENT |
| 3. get-my-map-assistance | a166ebc1a7b880d638b96c0777476d176bb99fb9208e2319db79670f1f49f66e | NOT_RUN / TARGET_ABSENT |
| 4. manage-map-contribution-consent | 71b78cdb1c2b2a79d4bd32441d746fb5ff76af9d0ba57b5c188abf6087cb89a1 | NOT_RUN / TARGET_ABSENT |
| 5. manage-map-contribution | b36a4d9b2af5f4e19ab4ba2ae71a2a16172e6ef0720a9c3ae560f1b082123450 | NOT_RUN / TARGET_ABSENT |
| 6. report-public-map-lead | ece369e73dd6778f497954710876aea2290109da675dcfe2f2258aedd5dffafb | NOT_RUN / TARGET_ABSENT |
| 7. answer-map-assistance | 22082e1fd47e8fef52a4b4efcb4768c1287e520f715169930192839d2107dc14 | NOT_RUN / TARGET_ABSENT |
| 8. resolve-board-observation | 192300bd89c159e36d6a84ab146a9e05d9601e81131242f1da1b0a526279e2b2 | NOT_RUN / TARGET_ABSENT |
| 9. reconcile-map-projection | f1d4adbba248d665e86c29a0eb1fe1caff6c915da52c3f1e5508471dbd3a5a6f | NOT_RUN / TARGET_ABSENT |

每个entry=index.main、runtime=Nodejs20.19、memory256MB；timeout10s（resolve/project/answerAssistance为20s）、trigger/layer空。固定non-secret config仅 ICHI_V2_BACKEND_MODE=production、ICHI_V2_FUNCTION_ENABLED=false；installDependency=true / init65s / disk512MB / TCB_QcsRole / PublicNetENABLE均沿用proposal。rollbackArtifact=null（新函数从未部署）；完整allowlist/包内文件列表/source SHA在batch。

## Cloud preflight / postflight

本轮preflight 2026-10-02T12:37:16.311Z、postflight 2026-10-02T12:38:44.831Z（UTC）；各117次只读管理工具调用，另1次auth status，共235次读取。无读取错误、无配置结构差异；所有9目标名字在完整分页function list中不存在。完整证据：[preflight.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d/preflight.json>)、[postflight.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d/postflight.json>)、[read-request-ledger.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d/read-request-ledger.json>)（CloudBase只读RequestIds）。

V1_STRUCTURAL_DIFF=0：13collections / 43indexes按既有基线口径 / 13ACL / 19完整stable config（除API RequestId）/triggers/layers/Storage根规则/环境规则与此前基线及本轮pre/post一致。全部40当前集合结构/ACL与14production精确索引合同检查通过，28既有函数稳定配置不变；正常Count/Size只记录，无异常删除/清空，不读真实业务正文或OPENID。

Phase1-A四条control rows完整canonical字段比较不变；shadow read-stop=true / HA pause=true / epoch41 / PUBLIC0，9shadow function所有enablefalse、caller allowlists空。新production服务未开启。

## Secret binding blocker（仅逻辑名／存在性）

| logical name | observed existence | required targets | authorization / status |
| --- | --- | --- | --- |
| IDENTITY_HMAC_KEY | PRESENT in 13 existing V1 bindings | query-public-map-leads, get-public-map-lead-detail, get-my-map-assistance, manage-map-contribution-consent, manage-map-contribution, report-public-map-lead, answer-map-assistance, resolve-board-observation, reconcile-map-projection | EXISTING_REUSE; targets absent / NOT_BOUND; no reuse performed |
| ICHI_V2_ACCOUNT_AUTHORITY_HMAC_KEY | MISSING in all 28 audited function bindings | query-public-map-leads, get-public-map-lead-detail, get-my-map-assistance, manage-map-contribution-consent, manage-map-contribution, report-public-map-lead, answer-map-assistance, resolve-board-observation, reconcile-map-projection | NEW_CREATION_AND_BINDING_NOT_AUTHORIZED |
| ICHI_V2_CURSOR_HMAC_KEY | MISSING in all 28 audited function bindings | query-public-map-leads, get-public-map-lead-detail | NEW_CREATION_AND_BINDING_NOT_AUTHORIZED |

存在性范围是本环境28函数的绑定逻辑名与冻结secretPlan（两个production-only key标NEW、此前未生成）；没有审计外部secret vault，不能宣称所有外部位置不存在同名secret。当前没有已批准的production secret来源或绑定可复用证据，禁止以shadow HMAC代替。IDENTITY_HMAC_KEY在13既有V1consumer中PRESENT；将其扩展到9个新consumer仍为绑定动作，本轮未读取/复制/绑定其明文。冻结exact-diff明确列有reuse logical target，不提供绕过新production-only key gate的权限。

绑定存在性不是新密钥安全性验证。工具返回的完整函数配置在编排内瞬时计算与旧stable SHA的布尔匹配，并提取逻辑名存在性；不向模型工具输出打印Environment、secret值/摘要，不写入报告、artifact、日志或命令文本。`RISK_ACCEPTED_BY_FOUNDER / SECRET_UNCHANGED / ROTATION_WAIVED`保持；原明文输出CONFIRMED / NOT_REMEDIATED，不实施轮换、dual-key、lazy migration、alias或V1身份迁移。

## 启动与 disabled-only 技术兼容性

冻结 runtime 的 createMain 在 shared/runtime.mjs:1210—1216 检查ICHI_V2_FUNCTION_ENABLED；false返回SERVICE_UNAVAILABLE，早于cloud.database、trustedAccount、rate/transaction/mutation。9包当前artifact validator均验证disabled路径不触DB。两个新key是启用后身份authority/query cursor路径的required contract；它们对仅返回关闭响应的路径不是技术必需。因此**技术上可以仅部署代码＋冻结non-secret disabled config并暂不绑定任何secret**，但本命令要求在缺新required secret时deploy前STOP，当前并未授权该例外，实际未部署。

代码检查仍保留per-entry fixed collection capabilities（V1 accounts/wechatIdentities只有doc.get）、无private Storage/画像join、domain public allowlist/未知字段私有、no-resurrection（domain.mjs:343、runtime.mjs:355及582等）与null单独合法而不转0（domain.mjs:16）。冻结SHA未变；旧Phase1的44定向/full回归是历史证据，不把它们写成本轮重新跑过。

## Function read-back / smoke / receipts

[function-readback.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d/function-readback.json>)：9/9目标ABSENT，remote status/runtime/codeSha/source comparison均NOT_APPLICABLE，不声称9/9部署或远端source PASS；所有required target bindings MISSING_TARGET_ABSENT。没有远端下载包、平台安装node_modules或codeSha证据，差异比较NOT_RUN。

[disabled-smoke.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d/disabled-smoke.json>)：9/9 NOT_CALLED / TARGET_NOT_DEPLOYED_SECRET_GATE_STOP；cloud invokes0，live smoke PASS不能成立。没有构造synthetic production输入或开任何flag。pre/post 13业务Count0、PUBLIC0、四control rows/epoch1不变、V1和shadow关闭态不变。

[apply-receipts.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d/apply-receipts.json>)：receipts=[]，external writes0、partial deploy=false、CREATE失败0/重试0；没有deploy RequestId，不编造。只读RequestIds留在read-request-ledger。无自动cleanup或rollback。

## 自动验证与本地保护

production artifact validator PASS（9包）；resource/schema/API contract dry-run PASS（6项，remote access0）；live production resource validator PASS（14/23/14ACL/13Count0/4control rows）。workflow与diff-check PASS；899个受保护本地文件仅四份指定事实源变更，生产源、design-document、历史Phase1-A/B/C报告、Phase1-C证据、冻结9包和manifest均未改动。[local-verification.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d/local-verification.json>)记录全部校验结果；不重跑或冒充full Vitest/Playwright/Next/微信preview。本轮只生成治理报告及machine batch，不改生产源码、design-document、历史A/B/C报告，不构建新ZIP。

## 回滚／Git／Current gate

云端修改0，无需线上回滚；现有空ADMINONLY资源和shadow证据保留，不能自动delete或清理。Git `feature/v2-board-map @ 929d189a06e13010e50abf4927bfec3b1ebd49fc`；既有dirty工作树保留，无commit/push/PR/merge/tag或微信上传审核发布。

`TASK22 = IN_PROGRESS / PHASE_1_PRODUCTION_BACKEND_CONVERGENCE_IMPLEMENTED / LOCAL_GATES_PASS / EXTERNAL_ACTION_APPROVAL_REQUIRED`；子状态 `PHASE1_D = STOP_SECRET_BINDING_APPROVAL_REQUIRED / NOT_DEPLOYED`。不写DEPLOYED/DISABLED_STATE_READBACK_PASS、PRODUCTION_ACTIVE、Phase1/TASK22 COMPLETE、HUMAN_APPROVED或Phase2 UNLOCKED。

## 最小下一条 Founder 决策

优先独立明确授权两把新production-only key的受控生成及精确consumer binding：authority key→9批准函数、cursor key→query/detail 2函数，并确认复用当前不轮换的IDENTITY_HMAC_KEY→9批准函数；共20个逻辑绑定。只采用受控secret通道，保持所有函数flagfalse/controls不变，不输出值；以新preflight通过为前置恢复本冻结9包部署与disabled-state回查。此处是可审阅的logical scope建议，不是本轮执行授权或实际API写调用计数。

若Founder坚持暂不生成/绑定secret，可另行明确批准“9冻结ZIP仅代码＋原non-secret false配置部署，required secret bindings全部延期”的预部署门例外；需另冻结该scope，保持不可正向调用。该路径也未获本命令授权。本轮已经STOP，不进入任何下一批。

独立secret blocker：[v2-e-task-22-phase1d-secret-binding-blocker.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1d-secret-binding-blocker.md>)；机器可读边界：[secret-binding-blocker.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d/secret-binding-blocker.json>)。
