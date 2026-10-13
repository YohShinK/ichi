# TASK21 举报 runtime 精确资源差异（待外部批准）

> 2026-09-30；EXTERNAL_ACTION_APPROVAL_REQUIRED / NOT_APPLIED。

## 审计结论

只读现状：25 collections（13 V1、12 shadow）、27 functions（19 V1、8 shadow）；无moderation ledger、新report function/ReporterAuthority适配的物理持久链。TASK12已有TrustedModerationService/dedup/threshold/audit/hide≠delete reference，本轮复用visibilityAfterActiveReports规则并为cancel加入server-authoritative lifecycle；未另造点赞系统。schema/索引/manifest机器版：`artifacts/task21/upload-only-reporting-20260930/resource-exact-diff.json`。

## A段：资源/代码/默认关闭配置（请求Founder批准）

| Resource | 精确动作/规格 |
| --- | --- |
| v2ShadowModerationLedger | 新NoSQL集合，ADMINONLY；report-ledger-v1；无client read/write、无TTL/清理trigger |
| kind_target_policy_time | 新ledger显式非unique非TTL复合索引：kind ASC, publicLeadId ASC, policyVersion ASC, createdAt DESC |
| active_public_lead | 既有v2ShadowBoardInstances新显式非unique非TTL索引：activePublicLeadId ASC |
| v2-shadow-report-public-map-lead | 新Event Function，Nodejs20.19、index.main、256MB、10s、wx-server-sdk4.0.2；0trigger/0layer |
| v2-shadow-reconcile-projection | 替换为本轮冻结包，增加BoardInstance threshold latch/outbox no-resurrection，并包含此前TASK21 opportunity-policy候选 |
| v2-shadow-query-public-map-leads / get-public-map-lead-detail | 使用同批public-map-v3/versioned Opportunity readers，与projector兼容；原source已有候选更新，未在本轮修改逻辑 |
| HMAC binding | 仅新report function绑定既有shadow PRINCIPAL与REHEARSAL HMAC；新secret=0、不轮换既有key、不输出secret |
| New config | REPORT_ENABLED=false、REPORT_REHEARSAL_ENABLED=false、REPORT_POLICY_VERSION=v2-21-report-policy-1、BOUNDARY=synthetic_only、TEST_CALLER_DIGESTS空 |
| 保持closed | 8既有flags保持false/allowlist空；global read-stop=true、epoch25、PUBLIC0；不写source/upload/consent/authority/rehearsal数据，不开始pilot |

新9包是完整检查集，A段只部署表中1新+3 replacement。其余5包不因manifest存在而自动部署。预览不是微信正式upload/review/publish。本轮所有上述CloudBase mutation均0。

## Schema与唯一性

ledger以确定性doc ID实现唯一，不将reporter/account暴露公开：

- REPORT_STATE：`report:sha256(publicLeadId,subjectDigest,policyVersion)`；kind、target、policy、reporterSubjectDigest、principalClass、active、state=ACTIVE/CANCELLED、eligible=true（trusted intake快照）、updatedAt、dataOrigin。
- TARGET_POLICY_STATE：`state:sha256(publicLeadId,policyVersion)`；activeDistinctEligibleReporters，不能客户端更新。
- command audit：`command:sha256(target,subject,policy,actionId)`；command=REPORT/CANCEL_REPORT、createdAt、active/duplicate、principalClass，重复command只回当前状态，历史不删。
- AUTO_HIDE audit：`hide:sha256(target,policy)`；threshold count/reviewRequired/noResurrection/createdAt。
- 既有BoardInstance增moderationThresholdHidden/policyVersion/hiddenAt；公开serving row置HIDDEN；global:read-epoch事务+1。
- 既有ControlState新增REPORTER_AUTHORITY与REPORT_RATE记录：authority doc=reporter:digest，kind/subjectDigest/windowKey=current/accountActive/eligible/spamOrInvalid/principalClass/expiry/dataOrigin；复用现有kind_subject_window unique索引，rate有30/min/account上限。审计无expiry；新TTL=0。

public JSON只ok/active/hidden/policyVersion；默认函数/集合ADMINONLY及WXContext allowlist，客户端不能控制Account/eligibility/threshold/moderator。私有V1 join=0。未来资格撤销需要trusted re-review/reclassification，本候选不把客户端请求变为eligibility来源。

## Function contracts

Client：`{publicLeadId:32hex, command:GET_STATE|REPORT|CANCEL_REPORT, actionId?:8..128 allowed chars}`；非GET必需actionId，未知field直接拒绝；server-time是audit authority，不用client timestamp。

Server rehearsal：仅`{capability}`，独立REPORT_REHEARSAL_ENABLED才开放；签名purpose=report-rehearsal、audience=固定函数、env固定、maxAge5min、nonce一次；signed payload含policy/subjectDigest/target/command/actionId，authority必须SYNTHETIC_TEST_PRINCIPAL。该链不自报真实用户、不接V1私有供给、不进入真实pilot metrics。

RATE=30/min/trusted subject，跨实例持久；重复动作也受限；global stop/unknownboundary/unknownpolicy/unavailableauthority/expired/spam/retired/deleted fail closed。CloudBase真实transaction retry/concurrency验证待B段，不能用test double证明云事务。

## B段：本次尚未授权的数据/窗口动作

须另定受信Founder测试WX caller、server-only 10 synthetic principals、expiry、3 gated DRAW/UPLOAD/UPLOAD+multi-reason fixtures、逐条SHARE/适用consent/Verification/current/location/note/rights/UGC、操作起止、stop负责人和预算。不得将2条V1 private direct上传默认公开；不得full backfill。建议窗口只操作shadow测试供给；身份/ fixture exact清单冻结后再批准enable/report/nonce/audit/query写入。B未执行，当前不得发起数据演练。

## Rollback / cost

先关闭report/rehearsal/read/projector等flags和caller，global stop=true，隐藏测试PUBLIC并推进epoch；禁止取消report自动恢复。保留ledger/report/cancel/hide审计与threshold latch（不删数据），新函数保留关闭，不删除新集合/索引。3既有函数用已下载/核对CloudCodeSha的rollback ZIP恢复；恢复旧projector前保持所有投影/读取关闭，不能在旧projector缺latch保护时再enable。rollback包在本轮rollback/manifest.json，每包与云端codeSha一致；真正rollback演练未做。

成本：新常驻资源是1小集合/2索引/1Event Function，无定时任务、Qwen/msgSecCheck/Storage成本；实际账号套餐和账单边际费用须窗口前核对。建议B上限≤12 trusted subjects、≤500总report/state/cancel commands、30/min/subject，按最坏每command20数据库操作估计≤10,000基础读写（事务重试额外）；≤¥20只是stop预算目标，不是当前真实账单或价格保证。达到请求/成本门立即停；A阶段不生成业务请求，实际cloud成本证据待批准apply/演练。

## 冻结候选与回滚SHA


| Function | Candidate SHA256 | Artifact |
| --- | --- | --- |
| v2-shadow-report-public-map-lead | `27cabeccdda5d50d670fb108c991299122d69f31308b1e619842460557e25526` | `packages/v2-map/resources/shadow-functions/artifacts/task21-reporting/v2-shadow-report-public-map-lead.zip` |
| v2-shadow-submit-candidate-upload | `5f3e45c0dd60bd3cfc36bb2b4c353c1b28ecbbf00966fdcb6a7496b2182e9fe2` | `packages/v2-map/resources/shadow-functions/artifacts/task21-reporting/v2-shadow-submit-candidate-upload.zip` |
| v2-shadow-resolve-observation | `27b752e5213ec4a488ef367aa7ff30dd27b892f4dda211e62dc67e5679de4ae4` | `packages/v2-map/resources/shadow-functions/artifacts/task21-reporting/v2-shadow-resolve-observation.zip` |
| v2-shadow-answer-assistance | `d4ace265fa950dd5136be5b8a7550cb93c57d72fceef51a8e9258cb44b5ec138` | `packages/v2-map/resources/shadow-functions/artifacts/task21-reporting/v2-shadow-answer-assistance.zip` |
| v2-shadow-get-my-assistance | `dda6c36b806002a00bcb79d3534f316115a815c44a85b4d0c0578e953f9dddd3` | `packages/v2-map/resources/shadow-functions/artifacts/task21-reporting/v2-shadow-get-my-assistance.zip` |
| v2-shadow-reconcile-projection | `8fbbbe0dbc49d37625ba97fe2cd74d4c9547c2614fe8076d65e756c7ab11688f` | `packages/v2-map/resources/shadow-functions/artifacts/task21-reporting/v2-shadow-reconcile-projection.zip` |
| v2-shadow-manage-contribution | `bde1747e1a8fc7760996ef7d3110d6964202223f3f54951eaed7864acd6d92ac` | `packages/v2-map/resources/shadow-functions/artifacts/task21-reporting/v2-shadow-manage-contribution.zip` |
| v2-shadow-get-public-map-lead-detail | `b1eda2c1a3e533c63a69352021ec8aa0f5f19baad109addeec9d795988a4d810` | `packages/v2-map/resources/shadow-functions/artifacts/task21-reporting/v2-shadow-get-public-map-lead-detail.zip` |
| v2-shadow-query-public-map-leads | `de61d13bcc6cfb39257c8ea857ec175a03308bffa29fc9a18e0368f271177291` | `packages/v2-map/resources/shadow-functions/artifacts/task21-reporting/v2-shadow-query-public-map-leads.zip` |

| Remote rollback | SHA256（已核对CloudCodeSha） |
| --- | --- |
| v2-shadow-reconcile-projection | `fae54e1a5c0c67dbc7df02406072fe15eae576f644a7492a5efd719da62897bd` |
| v2-shadow-query-public-map-leads | `7ed613af2cc63be0f2d4d43401269f78d409b04c49932fb2cbcf4219dca2ecda` |
| v2-shadow-get-public-map-lead-detail | `9b73612711e4b1ab24865ddc7782efba9ba95cf9224ca94576214d4d1ace5af5` |

所有SHA来自本轮本地manifest/远端只读下载，不使用历史包冒充当前可回滚源。

## 状态、验证与边界

- Pre-state：活动 V2-E，仅 TASK21；TASK20冻结，TASK22锁定；上一轮地图44px横条/紧凑loading只获得其局部视觉批准。旧 report 是不可用占位，详情有点赞占位。
- Product semantics：RecordType=执行、Opportunity=机会、Freshness=时效、Moderation=可见/安全，四者独立；仅上传不是低可信/低机会/审核状态，不改变BoardInstance或eligibility。
- 前端/后端/数据变更：本文相关实现详见上文和下方文件清单；新持久资源均是本地候选，线上数据未改。
- Exact resource/config actions：实际 cloud create/deploy/config/ACL/index/data/trigger/secret/storage actions=0；拟增1 ADMINONLY集合、2非unique非TTL索引、1默认关闭函数、3既有函数replacement，详见 report-runtime-exact-diff。新secret=0，拟绑定现有shadow key，不保存/展示密钥。
- Tests/builds：当前工作树全量Vitest 1046 PASS/1既有skip；新report runtime13 PASS，上传/客户端9 PASS；TS/Lint/contracts/workflow/9包SHA/解包import与静态allowlist PASS；Next串行构建PASS。Web先前多轮25/26（不同case），失败单项复测PASS，原日志保留；侧滑测试仅修准备阶段：300ms路由transition后再scroll/readiness，重绘时仅重试准备、不重放手势/delete；最终production-server全套25 PASS/1 FAIL（prize grid首张票boundingBox=null，v1-26.spec.ts:289），WEB_FULL_SUITE=NOT_PASS；整体本地回归门未全绿，不能用此前单项复测替代全套。verification.json与web-final-gate.log保存最终结果。微信最终preview PASS 1,011,434 bytes。无人工浏览器视觉验收。
- Cloud read-back：真实2条V1 direct-upload的字段存在性只读审计已落脱敏JSON；8既有shadow函数全部flags=false、caller空、boundary=synthetic_only、trigger/layer0；最终read-stop=true/epoch25/PUBLIC_VISIBLE=0，新ledger不存在。report active/audit/distinct count 的云端回读=NOT_RUN。
- Founder真机 evidence：仅上传A组、举报B组与threshold C组均NOT_RUN；当前候选停止在云资源审批，不给synthetic/local测试标记真机PASS。
- Threshold/cancel：本地9/10门、ACTIVE→CANCELLED→ACTIVE、同账号重复/跨设备/重试、隐藏后cancel降数不恢复、query/detail/cursor门、投影outbox不复活均PASS；签名合成主体明确SYNTHETIC_TEST_PRINCIPAL，云端演练未执行。
- Privacy/security：公开响应只ok/active/hidden/policyVersion；无reporter/count/audit/raw note/private lineage字段。客户端不能声明eligibility/threshold/account/moderator；ADMINONLY/签名capability/nonce/rate/allowlist/expiry/stop fail closed。本地PRIVATE_LEAKAGE=0，云端举报链privacy gate尚待验证。
- V1_DIFF：本轮services/cloudbase递归源码pre/post差异=0，云写入=0；本轮home只修改V2 map/report呈现；Web测试只修改side-swipe准备步骤，不修改Web/V1产品runtime。本轮未重复完整V1云配置/索引/Storage同形diff，不能把历史full V1_DIFF=0当本轮full门。工作树原有/并行修改保留，当前全量测试数属于当前工作树，不归功于本轮单独产生。
- Safe stop：读停机true、epoch25、公开0与8flags关闭/caller空有只读证据；未开真实Pilot，未执行新功能write window。
- Git state：起始dirty tree保留；无commit/push/PR/merge/tag/upload/review/publish，只有小程序CLI preview编译；git-before/git-after另存。本地回滚包下载是read-only。
- Current gate：TASK21=IN_PROGRESS / PRE_PILOT_CLOSURE；UPLOAD_ONLY_AND_REPORTING_PRE_PILOT_CLOSURE=NOT_PASS / EXTERNAL_ACTION_APPROVAL_AND_CLOUD_TRUE_DEVICE_EVIDENCE_REQUIRED。
- Next Founder authorization：先批准精确资源与闭合配置部署A段；B段须确认caller/供给/操作与有界真机/合成演练窗口再enable。即便补充闭合，也仅恢复原TASK21流程，不自动HUMAN_APPROVED/FROZEN/开启TASK22。

## Files changed

- `apps/client/miniprogram/platform/public-map-discovery.ts`、`public-map-presentation.ts`、新增 `public-map-reporting.ts` 与测试。
- `apps/client/miniprogram/pages/home/index.ts/.wxml/.wxss` 和对应呈现断言；移除点赞图标，旧 report synthetic adapter/test 移到 `tests/fixtures/`。
- `packages/v2-map/src/moderation.ts`；新增 `resources/shadow-functions/v2-shadow-report-public-map-lead/`、更新 `v2-shadow-reconcile-projection/runtime.mjs`。
- `apps/web/tests/v1-26.spec.ts`：既有V1回归准备步骤的route/scroll稳定等待，无产品代码修复。
- 新 `scripts/build-v2-task21-reporting-artifacts.mjs` / `validate-v2-task21-reporting-artifacts.mjs`，独立9包 manifest；五份报告、`memory-bank` 五文件联动与本轮证据目录。

## Evidence

本轮证据集中在 `artifacts/task21/upload-only-reporting-20260930/`；`verification.json` 汇总最终结果，失败日志保持原文件。公开记录审计只保存字段存在性，不保存真实 owner、坐标、记录ID或快照正文。任务原文只留作本轮执行依据，见目录中 founder-command.md。
