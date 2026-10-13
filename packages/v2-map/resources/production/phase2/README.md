# TASK22 Phase2 PLAYER source bridge

当前合同：UPLOAD_CONFIRMATION_MAP_SHARING_V2 / V2_ADMISSION_AUTO_MAP_V1 / UPLOADED_V1_ACCOUNT_CONSENT_V1。原上传确认及核验→V1（不依赖条例）→本人当前v3条例统一覆盖此前及以后所有完成上传记录→全部准入条件→正式V2与PublicMapLead同事务提交→Marker。不设逐条分享按钮或V2二次审查/授权；旧manage-map-player-source disabled且ownerEntryEnabled=false。

shared/uploaded-v1-consent.mjs绑定当前真实账号接受、terms/scope及明确全历史范围/rights。source.mjs按服务器finalized direct / exact APPROVED draw判定完成上传，再派生有效V2权限；不要求旧V1有逐条技术字段或原设备补交。CONSENT_EVENT持久扫描本人全部来源，每次2条；未核验/私有保存跳过并继续游标，不阻塞已上传记录。设备意图字段/队列仅溯源兼容，不能恢复成历史转换前提。新v3范围不自动套用旧v2接受。

当前正式条例map-contribution-20261003-v3；公开位置0.001°/accuracy≤100m。2026-10-04已PRODUCTION_APPLIED / LIVE_BRIDGE_VERIFIED / GLOBAL_CONTINUOUS_ENABLED：本人真实接受、CUFZBP实际准入/原生Marker及43抽详情通过；四V1 producer、worker/drain/processor、resolver/projector及公开query/detail/read已开启，全局每分钟timer OPEN，连续9次成功。所有账号共用一套后端，各自当前接受自动扫描本人历史并接入以后完成上传，不需逐账号配置。旧选择disabled/ownerEntry=false保持。

本轮只补真实批次/启用与query旧并行控制读取造成的TransactionBusy；以真实query ZIP最小替换现行顺序readControl，17文件与配置回读/45项回归/实际SDK通过。此前已应用资源、19/22/22和冻结证据不重做；最新证据artifacts/task22/phase2-production-resume-20261004、progress顶部及独立closeout报告。未替用户ACCEPT，不把其他账号未同意当桥接缺口；NETWORK及正式微信发布属后续Phase。下方旧授权/阶段落库/未验timer描述只作历史，不能恢复正常旧流程。

## 地图资料与举报接点（当前）

2026-10-04地图资料接点：生产已绑定当前本人安全昵称、独立公开头像副本、真实核验备注及首次上传时间。旧direct备注仅在本人当前条例已接受后由客户端自动后台补审，使用当次临时OpenID并只存exact-hash安全证明；没有新授权或分享按钮。V2详情只读公开投影，Freshness仍用observedAt。正常active账号举报、封禁/异常/受限制不计数，10个不同合格用户隐藏。最新证据与状态见progress顶部及docs/delivery/v2-e-task-22-map-display-and-public-metadata-audit.md。

metadata.mjs负责头像安全副本与清理；source.mjs只允许精确安全proof的备注，pipeline.mjs保存support首次uploadedAt。V1 map-note-metadata.js使用本人当次WXContext而非从哈希identity还原；失败deferred后自动重试，不阻塞已合格板面。新候选从各自真实远端ZIP最小更新，worker/drain24、bind8、detail/report17文件；冻结core/entry保持原SHA，旧冻结manifest/ZIP不覆盖。

## 原冻结算法与平台基线（历史）

下文仅保留原阶段算法与历史验收来源。当前SOURCE/RESOLVE/PROJECT仅在准入内存预计算中运行；正常worker只一次事务提交正式V2和地图投影。原独立owner选择接口现已disabled且ownerEntryEnabled=false，不得恢复接入。

### 来源与授权

`source.mjs` 将服务端 V1 私有来源归一为 `map-player-source-phase2-v1`。共同字段为 recordId、ownerAccountId、lineageId、sourceVersion、fingerprint、recordType、originSourcePath、observedAt/observedAtBasis、location、boardFacts、verificationId/verifiedAt、note/safetyProvenance。归一结果只是私有核验输入。

- DRAW：按 P1 的 `publishedSubmissionVersion` 精确读取 `prize-ticket:<recordId>:<boardId>:<version>`；必须同时匹配 owner、record、board、version，状态 APPROVED、照片与位置通过。根据原始 P1 计数及唯一 authoritativeDrawEvents 验证 finalSnapshot 减法、IP/主题/价格/赏级身份。新 pending version 不替代当前已批准版本。
- UPLOAD：只接受 `clue_submitted` 的 finalized direct P1、用户确认 snapshot、recognitionJobId、correctionSummary、服务端接收时间。不制造 draw submission。
- R2 不含制造商初始票位。原始 P1 计数只用于抽赏减法；`initialRemainingTickets=null`，不把第一张观察截图的余票冒充初始总量。legacy 缺明确大赏分类、完整计数或安全证据则跳过，不猜测。
- 原 `observedAt` 与其来源依据保留。处理、审核与重试时间不会成为新的观察时间。坐标系不明、位置依据缺失、未来时间或非法计数均拒绝。
- 私有定位 consentVersion 不是地图授权。必须同时有该记录显式 SHARE、followCurrentVersion、rightsAttested，以及账号对当前生产 termsVersion/scopeDigest 的适用接受。旧历史不默认 SHARE，不导入 shadow consent。
- DRAW note 只在当前 exact hash 对应 NOTE_PASSED 且 reviewedAt 有效时进入允许的备注字段。direct 私有 locationNote 不自动公开；不安全备注省略。
- 公共位置只使用明确绑定的版本化 APPROXIMATE grid policy。默认 locationPolicy=null；数值需在真实上线前独立审阅绑定。原坐标和 accuracy 保持私有。公开贡献者使用安全 fallback，不要求 Profile 补全。

`manage-map-player-source` 通过可信 WXContext→现有 V1 identity→当前 active Account 处理 GET / SET_INITIAL_CHOICE。客户端只提交记录引用、当前 fingerprint、actionId、初始分享选择和本人 rights attestation；不能提交事实、位置、owner、审核状态。它仅保留旧服务端兼容；当前正式客户端通过V1原上传确认取得分享意图，不调用这个逐记录选择入口，也不提供独立publish/withdraw操作。记录已有选择后不通过此入口改选，删除仍走 V1 原始记录。

## 写入、恢复与公开读

V1 finalized upload、draw APPROVED、note 进入重新审核、record delete 都在原成功事务内写 source dirty outbox；既有 lead 先隐藏、lineage head 先失效、read epoch 与 mutation revision 同步增加。开关默认 false，关闭时不访问任何 V2 集合。开启后若 outbox/失效写入失败，原事务整体回滚。

worker 使用短时、域隔离 HMAC 系统请求，依次处理 SOURCE→RESOLVE→PROJECT→APPLIED。所有阶段重新读取当前 source、权限、删除状态，事务重检 shared mutation revision 和选择前 control snapshot。查询仅在事务外有界进行；事务内仅 doc 操作，读写缓存、95 操作上限，超限失败并保留隐藏态。

`pipeline.mjs` 由冻结 Phase1 runtime 的 SHA 派生，只改变 imports 与导出私有 pipeline helpers；Verification、Resolution、Opportunity、Freshness、Eligibility、Projection 算法原样复用。首次关联仍要求保守唯一匹配；同一私有 lineage 的后续版本只有在位置、事实身份和单调余票一致时延续已建立关联。hard conflict 不自动搬到另一个实例，而进入 MANUAL_REVIEW。歧义保留冻结 domain 的 HA 决定。

记录删除是永久 latch，并设置 contribution noResurrection。迟到 revision 被丢弃，重放仍服从 latch。多人支持通过原 projector 重算；其他 eligible owner 可以继续支持同一版面。无支持时退休旧公开 ID，后继不会复活旧 ID。

账号删除可能超过单事务预算：先在 V1 删除事务写 Account tombstone 并全局 read-stop，再每次扫一个已桥接 source head。worker 不自行解除全局屏障。操作者须确认 owner 支持、pending stage 与全部公开读安全后另行批准恢复；可能暂时影响全地图可用性。

`drain-map-source-bridge` 每次最多处理 20 个到期事件。一分钟 timer 提案默认 CLOSE，且需要平台环境和可信第二参数 invocation environment 的 TRIGGER_SRC=timer、无 WX/UID/TCB_UUID principal；事件中的 Type/TriggerName 不能充当权限。非 timer 使用短时 DRAIN HMAC。真实平台的 context 形态尚未验证，验证前不启用；缺可信 context 时拒绝，不退化为相信事件。

事务错误指数退避，最多 8 次进入 DEAD_LETTER；保留 stage 和原因，不自动清除。短时签名 REPLAY 创建新 revision，原事件保存 replayedAs 幂等回执。恢复不得清除删除 latch 或恢复旧 public ID。

`previewHistorical` 只读、最多 100 个明确引用，报告仅记录 record digest、fingerprint、skip reason。`enqueueHistoricalBatch` 必须有独立历史批次授权，并在每个事务重新核验当前许可；重复 pending batch 返回 ALREADY_QUEUED，已应用且当前输入与授权 projection 相同返回 UNCHANGED。缺授权逐条跳过；不 bulk-public。

公开 query/detail 继续使用 Phase1 已物化 publicMapLeads；不在请求时 join V1 record、draw、Profile 或 permission 集合。

## 资源、构建与验证

资源提案见 `resource-proposal.json`：4 个新 ADMINONLY 集合、4 个非 TTL 索引、1 行全关闭控制。3 个新入口默认 disabled；4 个 V1 函数候选基于各自真实远端 rollback ZIP 仅增加对应钩子与 producer 文件。原远端包存在不同历史版本，不能用当前本地 shared runtime 全量替换。

构建：`node scripts/build-v2-production-phase2-artifacts.mjs`。验证：`node scripts/validate-v2-production-phase2.mjs <wx-server-sdk-package-path>`。两者仅生成/校验本地独立 Phase2 产物。SDK ABI 与本地事务 fixture 不代替真实 CloudBase 事务、timer 信任上下文或生产客户端验收。

独立产物在 `artifacts/task22/phase2/`；部署与恢复步骤见 `docs/delivery/v2-e-task-22-phase2-local-implementation-and-external-action-review.md`。禁止改变历史 Phase1 的 manifest、ZIP、proposal、source 或验收证据。
