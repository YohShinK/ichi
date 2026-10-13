# TASK-V2-21｜Closed Pilot Protocol（未批准草案）

2026-09-30 最新状态：规则已Founder确定并完成本地实现（含拆套R≥60、存量G≥3、完整事实无标签回落low/low可上图），三消费点/public-map-v3本地回归通过；Map十二组微信开发者工具截图待Founder视觉确认；详情重复请求合并与安全读并行已实施，真实cold/warm端上测量/RC风险接受仍未完成；当前只读shadow preflight安全关闭通过。Pre-Pilot整体未PASS，本协议仍DRAFT/未批准/未开跑。下方“代码0/规则未答”是草案首次产出历史，不是最新事实。人数/时间/地理/供给/stop/Freshness/coverage/cost/治理owner/NETWORK_SOURCE/report和实际写入窗口仍不得Agent填默认数字。

日期：2026-09-30（Asia/Shanghai）。阶段：Protocol preparation only。状态：`DRAFT / PRE_PILOT_CLOSURE_NOT_PASS / NOT_AUTHORIZED_TO_RUN`。这份草案不申请现在开跑；当前只提交 Opportunity 规则决定，pilot 参数到 pre-pilot 完成后一次确认。

## 目的与前置门

用有界、allowlisted、可撤回的供给检验真实 discovery value、Freshness／PublicLocation 理解、moderation／takedown／abuse、cost／scale 与 rollback；最终由 Founder Continue / Adjust / Stop 与 RC 决策。不是 public launch，不执行 TASK22 production migration、微信 upload/review/publish 或 Git merge/tag。

进入实际 pilot 必须先有：精确 Opportunity policy 获批并实现；同一 server result 驱动三处呈现；Map State UI 五组视觉确认；详情延迟优化或 Founder 明确接受 RC risk；相关全自动门、无 P0/P1、V1_DIFF=0、candidate safe-stop 成立。达成后才记 `PRE_PILOT_CLOSURE_PASS / PILOT_PROTOCOL_APPROVAL_REQUIRED`。当前全部尚未闭合。

## Founder 参数单页（待 pre-pilot 完成后确认）

| 参数组 | 需明确填写；Agent 不预设数字 |
| --- | --- |
| 参与者／范围 | 人数、具体受邀名单／allowlist 范围、Founder＋熟人或其他玩家、城市与地理边界 |
| 时间／供给 | 起止与时长；PLAYER／既有授权 candidate／synthetic 各自角色；NETWORK_SOURCE 每阶段最低供给及 batch 上限 |
| 停止门 | 哪些误解／故障／投诉／成本信号停机及判定值、谁有立即 stop 权限；P0/P1 或 rollback 失败按总命令停止 |
| Freshness／PublicLocation | 年龄阈值／unknown 口径；coverage 的去重单位与合格定义；不复用 30/10/14 readiness target 当批准门 |
| 成本 | 既有 ≤¥20/月目标如何折算本次调用量／时长、实际警戒线和暂停条件；含函数／DB／传输／头像等变动费用与共享配额边界 |
| 治理责任 | moderation/takedown/abuse owner、响应窗口、受邀者如何联系；是否需要可提交 report。当前图标无动作，不当成 report 产品 |
| NETWORK_SOURCE | 是否存在；明确来源域／类型、right owner、逐条权利／归因 evidence、takedown owner 与下架路径；每阶段 review owner |
| 窗口与恢复 | 哪些 data/flag/allowlist/config 写入允许、具体 batch／逐记录范围、到期停机；rollback 后是否恢复、谁批准恢复 |

## NETWORK_SOURCE 审计结论

已批准的是 `CURATED_ALLOWLIST_ITEM_LEVEL_RIGHTS` 方向和一次性三阶段流程，不是某个网站／社群的具体 source route。正式引用模型已有 Stage1 单区域约20的链路样本方向；明确不是 readiness 门槛，本次要求每阶段数字由 Founder 确认。没有发现批准到具体域／样本权利 evidence／owner／batch 的执行路线。

当前 `NETWORK_SOURCE = FOUNDER_DECISION_REQUIRED`。不抓网站、商店、第三方社群或“公开可见”内容。获批 PLAYER／synthetic 可做有限验证，但 synthetic 永不计真实 participant 发现价值，且不替代三阶段 NETWORK_SOURCE evidence。是否阻塞 RC 由 authoritative Evidence Gate＋Founder 判断，不由 Agent 豁免。

三阶段沿既有流程：单区域链路验证→Founder review→扩大获批批次→Founder review→处理后有界导入与投影。Stage3 在 TASK21 只限 pilot，正式生产发布归 TASK22。每阶段记录 source/right owner、consent/rights ref、record eligibility、location policy、freshness、takedown owner、batch ID、publish/hide count、cost/query impact、stop rule；关闭批次后迟到作业不得复活记录。

## 数据／资源与可回滚窗口

逐条要求 trusted source、适用 rights/consent、current record、Verification／Location／note safety PASS、PLAYER 当前一次性条例＋SHARE、current Opportunity、public eligibility PASS。不能批量迁移 V1 private、默认公开历史、request-time join V1、admin 写 PUBLIC 冒充流水线或合成记录冒充真实用户。

已有 candidate runtime 强制 `BOUNDARY=synthetic_only` 和 `dataOrigin=SYNTHETIC_REHEARSAL`，formal client 仅 develop/trial；这不是现在可承载真实 PLAYER／NETWORK_SOURCE pilot 的证明。若需要真实供给 adapter、policy 或新资源，先产可审阅 exact diff／artifact／SHA／rollback／cost，再独立批准。不能仅改 origin 或开 flag 承认真实数据已合规。

既有资源仅作准备引用：`cloud1-d7gxqfwv783a1f131 / ap-shanghai`；12 shadow collection、8 function。本草案不改 V1 frozen resources/private record、不新增 cloud resource。pilot protocol 批准后才允许按有界窗口写既有 pilot data／flag／allowlist／candidate config；新 collection/index/function/secret/trigger/Storage/ACL/production bridge 必须另批 exact diff。

## 用户任务与证据

在真正获批、同意参与的玩家上自然完成：理解近期线索而非实时库存；找目标区域；用机会 filter；理解 Marker 标签；看 ICHI 对话／余票／Freshness；区分零与未知；辨 PublicLocation 与确认店铺；理解上传／SHARE／条例；本人删除后的地图后果；异常／搜索无结果的下一步。

执行者只读任务提示，不提供“正确答案”。逐会话记录 consent evidence ref、匿名参与者编号、设备／网络、时间、原话误解、completion／discovery time、filter 使用、freshness/location／error 理解、defect 与证据路径。真实与 synthetic 分开。实际执行后产 `v2-e-task-21-pilot-session-log.md`，当前无会话日志可声称完成。

## 治理、账单与 rollback

先复核 owner delete、admin hide/takedown、note safety、audit、abuse/rate/read-stop 的实际可操作适配。完成一次 eligible lead→hide→query/detail 消失→cursor/epoch invalidation→no-resurrection→audit 保留的可回滚 drill。若 report 是强制前提而当前缺失，提交 exact product/resource diff 到 Founder 决策；不自行造举报系统。

成本证据必须来自本次真实 candidate/pilot：query/detail count、invocations、DB read/write、bytes、端上与函数 cold/warm、cache/retry、实际账单及月变量成本投影。无账单字段就写缺证据，不将 TASK18 本地 ¥估算替代账单。观察聚合／Marker／re-entry／PNG cache／包体／crash/P1。

真实 bounded rollback：暂停新增投影→hide 所有本批 pilot lead→read-stop／projector／endpoint 关→真机确认无 pilot lead→V1 可用→no-resurrection→audit/tombstone 保留；如获批再恢复。记录开始、公开消失 latency、errors、恢复、V1_DIFF、residue。失败则 TASK21 BLOCKED，不进入22。真实执行后分别产 cost-scale readback 和 rollback drill 报告。

## RC 与最终停止

P0 privacy/security/corruption/全面不可用；P1 核心严重失败；P2 有绕过的明显体验／性能；P3 轻微。P2 每项由 Founder 必修／接受 risk／延后决定。真实 evidence、rollback PASS、P0/P1=0、PRIVATE_LEAKAGE=0、V1_DIFF=0 和 Founder 决策缺一不可。最后交 RC report，不自行 HUMAN_APPROVED/FROZEN/RELEASE_CANDIDATE_APPROVED，不启动 TASK22；实际发布需要下一命令独立授权。

## 本草案执行记录

Pre-state：TASK21 未开始；本次仅解锁 pre-pilot 并停在规则门。Files changed：本协议与本次 audit／决策／current status 文档。Product decisions：上述参数均未批准；既有语义与本次边界照录。Backend/frontend/data-contract code changes=0；external actions=0；exact cloud resource/config mutation=NONE；未 seeding／迁移／participant 联系或开窗。

Tests/builds：本轮文档检查见 Opportunity 决策表；无 pilot 自动／设备 PASS。Founder evidence：TASK20 最终确认有，本协议／真正用户／RC=未取得。Failures/fixes：pre-pilot 三项开放，T20-P2-01 P2 OPEN；不宣称 TASK21 P0/P1/P3 的实际运行数。Privacy/security：未读 private、未收集参与者资料。V1_DIFF：TASK20 历史最终0，本轮不是 cloud read-back。Rollback：尚未 pilot drill，不以历史 M1 代替。Cost：无新云费用／真实账单。Git：原 dirty feature/v2-board-map 保留，无 commit/push/PR/merge/tag/upload/review/publish。

当前门：`OPPORTUNITY_RULE_FOUNDER_DECISION_REQUIRED`；下一决定先填 Opportunity 表，协议参数等 pre-pilot 完成后确认。余下实现／UI polish／session／cost／rollback／final RC 独立报告在相应阶段真实执行时生成，不预填 PASS。
