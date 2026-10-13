# TASK21 仅上传 V1→V2 lineage 审计

> 2026-09-30；SOURCE_LINEAGE_PROVEN / REAL_PILOT_ADMISSION_BLOCKED，非公开迁移完成。

## 实际字段与来源

V1实际持久字段是 `observationCandidates.sourcePath`，取值 `direct-upload | assisted-draw`，不是推测出来的recordType字段。`services/cloudbase/shared/runtime.js` 的finalize-board-observation在核对trusted owner、recognized job及相同sourcePath之后保存用户确认/修正snapshot；direct-upload写入initialSnapshot和finalSnapshot，抽赏路径保存initial并从已批准drawSubmission取得final。`packages/v2-map/src/source-adapters.ts` 的adaptDirectPublication / adaptAssistedPublication从该来源转换到provenance.recordType=UPLOAD_RECORD / DRAW_RECORD，再经Verification→VerifiedBoard→PublicCandidate→projector→query/detail→candidate客户端公开allowlist。

本轮管理端只读查询：direct-upload总数=2，两条实际行均 `status=clue_submitted`、`v2Eligibility=eligible_private`。脱敏证据 `v1-upload-only-live-field-audit.json`；没有把leadId、页面入口/文案或recordCode用作authority。

| 要核对的事实 | V1实际字段/状态 | 结论 |
| --- | --- | --- |
| 用户finalized确认/修正快照 | initialSnapshot/finalSnapshot、correctionSummary | 两条均存在；直接路径保存用户确认快照 |
| location | location | 两条存在；非公开投影，未落真实坐标到报告 |
| observedAt | observedAt；另有serverReceivedAt | 两条observedAt存在；不能升级为服务端可信时间 |
| current/delete | status、recordCodes.state、deletionJobs/observation删除路径 | 不能用clue_submitted单字段证明current；每次入pilot重新检查墓碑/版本/状态 |
| recognition/correction | recognitionJobId、promptVersion/schemaVersion/normalizationVersion、correctionSummary | 两条job/correction存在；入V2需exact-version Verification，不用字段存在性代替PASS |
| note safety | direct source adapter公开note=null | V1 locationNote不是安全公开note；未经content/version安全provenance不得公开 |
| consent/share | consentVersion=v1-private-observation-consent-1.0.0、disclosureVersion | 不是V2 map consent；SHARE缺失，不默认补 |
| verification/eligibility | v2Eligibility=eligible_private；无本行verificationStatus/SHARE | 仅私有ready，非public PASS |

## Pilot准入与缺口

当前两条private行不进入pilot、不复制进shadow fixture、不进行full backfill。准入必须逐项具备适用当前map consent、SHARE、current/version、Verification PASS、Rights、PublicLocation和note/UGC等gate PASS。候选synthetic链可通过受信fixture证明该来源转换与显示，但不能代替真实供给准入或把schema接口当现实门已完成。full backfill仍属TASK22。

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
