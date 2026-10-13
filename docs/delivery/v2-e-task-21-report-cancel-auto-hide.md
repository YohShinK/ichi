# TASK21 report / cancel / auto-hide 本地候选

2026-09-30 Founder确认当前全部截图无误，最新截图视觉门HUMAN_APPROVED；本报告中的截图视觉待审描述已由此覆盖，历史before/旧版本不恢复。该确认不替代端上交互或云端/性能/全回归/资源审批等其他门。完整范围见[视觉验收汇总](v2-e-task-21-founder-visual-acceptance.md)。

> 2026-09-30；PERSISTENT_RUNTIME_LOCAL_PASS / NOT_DEPLOYED，旧unavailable路径已由固定candidate command替代。

## 权威生命周期与交互

详情按钮直接REPORT；成功横条“你已举报这条信息”+右侧“取消举报”，按钮进入已举报状态再点也同一CANCEL_REPORT。无需category/reason modal，新合同不要求它们。失败为“举报失败，请重试”/“取消失败，请重试”。GET_STATE从server读本人active状态；selection generation隔离迟到状态。快速重复tap在途去重，模糊网络失败重试沿用actionId，旧已处理动作迟到时返回当前状态，不回放旧写入。

trusted WXContext APPID/OPENID经existing shadow principal HMAC产生跨设备稳定主体digest；ReporterAuthority仅ADMINONLY服务端记录，必须active、非spam、未过期，REPORT还须eligible。签名capability是另一路server-only synthetic演练，subject来自audience/purpose/env/expiry/nonce绑定的签名payload及SYNTHETIC_TEST_PRINCIPAL authority，不能客户端自报或冒充真实pilot。正常客户端不发送capability、identity/eligibility/threshold/moderator。

policy v2-21-report-policy-1固定10。每target+trusted reporter+policy一个report current state，ACTIVE/CANCELLED；计数、audit、active state、hidden serving row、BoardInstance moderation latch、read epoch由同一CloudBase事务原子写入。重复举报/取消不改变count；取消后可重报只计1。达到10即隐藏，非delete。取消只降数，HIDDEN保持；投影器之后推进outbox但不会重新生成/公开该实例lead。恢复必须trusted moderation/re-review或合法新lifecycle，本轮不新增自动恢复或管理员UI。

## 本地矩阵与云端缺口

| 要求 | 当前结果 |
| --- | --- |
| 1次=1/同账号重复/跨设备=1 | PASS（序列化事务test double） |
| 9公开/第10隐藏 | PASS |
| hidden后query不返回/detail unavailable | PASS（真实candidate query/detail factory） |
| epoch/cursor失效 | PASS |
| hidden后cancel=9且仍隐藏 | PASS |
| 立即cancel/重复cancel/re-report | PASS |
| forgery/未知policy/ineligible/expiry/rate/stop | PASS / fail closed |
| retired/deleted不可举报 | PASS |
| policyVersion audit隔离 | 版本参与所有ID；未知版本拒绝，旧审计不改 |
| PRIVATE_LEAKAGE=0/no destructive delete | PASS（本地serializer/资源allowlist/负断言） |
| 后继projection/outbox no-resurrection | PASS |
| server-signed10合成主体、不需要10台设备 | PASS（本地）；remote NOT_RUN |
| 阈值事务失败原子回滚 | PASS（test double）；CloudBase真实冲突/事务回读NOT_RUN |
| V1 source diff | 0；full V1 live diff未重复 |

## Founder B/C组（云批准后）

B：打开详情→举报→看到横条→右侧取消→再举报→通过详情按钮取消。Agent逐步回读active/audit/distinct count；失败不能以本地弹窗替代。

C：server-side signed synthetic principals演练9→10，无须Founder凑10设备；Founder只确认auto-hidden后Marker/Detail消失。真实普通Account桥、caller/authority注册、fixture、window/stop/cost必须先获具体批准，当前不执行。

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
