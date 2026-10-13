# TASK21 仅上传 Marker / filter

2026-09-30 Founder确认当前全部截图无误，最新截图视觉门HUMAN_APPROVED；本报告中的截图视觉待审描述已由此覆盖，历史before/旧版本不恢复。该确认不替代端上交互或云端/性能/全回归/资源审批等其他门。完整范围见[视觉验收汇总](v2-e-task-21-founder-visual-acceptance.md)。

> 2026-09-30；LOCAL_IMPLEMENTED / TARGETED_AUTOMATED_PASS / WEB_FULL_SUITE_NOT_PASS / AWAITING_CLOUD_AND_FOUNDER_TRUE_DEVICE。

## 最终行为

新增第六个灰色chip“仅上传”，authority仅为marker.recordType===UPLOAD_RECORD。它与5个Opportunity chip走现有多选OR，搜索仍是额外AND；显示全部选择六项、清空搜索并恢复全量，零选择仍为零筛选结果。

UPLOAD_RECORD的普通/选中/聚合代表Marker主label为灰色“仅上传”，优先于LAST→大赏占比→大赏存量→刚拆套→低；Opportunity.primaryStatus/reasonCodes原样保留。详情展示原有机会reason与Freshness；picker同源标签保留其它成立reason。BoardInstance/publicLeadId/真实坐标/公开资格未变化。

正式详情互动移除点赞icon/UI/count占位与unused样式/asset；不存在点赞state、handler、service、analytics或backend。本轮审计检索正式小程序路径，测试只保留“不出现”的负断言；旧report synthetic client已搬离正式包，没有旧modal冒充成功。

## Founder A组（批准资源和有界窗口后）

准备DRAW_RECORD、UPLOAD_RECORD、UPLOAD_RECORD+多个Opportunity reason三条合法候选样本，必须标注测试性质。Founder看灰标签、点详情查看其它机会状态、单选仅上传、和一个机会条件组合OR、显示全部恢复。当前三组真机结果=NOT_RUN，不因单元测试/preview而PASS。

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
