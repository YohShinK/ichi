# TASK21 Opportunity 规则决定表（Founder 已确认）

日期：2026-09-30。阶段：Pre-Pilot规则冻结。状态：FOUNDER_DECISIONS_COMPLETE / IMPLEMENTED_LOCAL。依据本轮Founder直接答复：存量选择≥3；未命中标签即低机会且可上图；最新补充“刚刚拆套：总余票≥60，继续执行”。阈值不需要再次确认。

| 状态 | 首版准确条件 |
| --- | --- |
| LAST_CHANCE / LAST 机会 | 已知当前总余票R≤12 |
| GRAND_PRIZE_REMAINS / 大赏存量足 | 已知用户选择大赏余票G≥3 |
| GRAND_PRIZE_RATIO / 大赏占比高 | R>0且G/R≥8% |
| SPLIT_SET / 刚刚拆套 | 已知R≥60；覆盖先前原装基线/85%延后方案 |
| LOW_OPPORTUNITY / 低机会信息 | 已知R>12且(G=0或有效G/R≤3%)；或必需事实完整且未命中任何正向状态 |

R=sum全部tiers remaining；G=sum用户上传isGrandPrize=true集合remaining。null=unknown，0=confirmed zero；必要求和项unknown或空大赏定义不冒充0；R≤0不判比例。各状态独立，可共存。主优先级 LAST→密度→存量→拆套→低；Marker/ICHI只映射这个主状态，Picker与展开详情可展示全部reason。最新“完整事实无标签回落低机会”覆盖早前的“不能仅因没有其他标签判低”限制；数据缺失仍不得反推低。

低机会允许上图并可筛选，其他核验/current/授权/rights/location/moderation/deletion/safety门仍独立；既有unknown事实公开模式保留，unknown不伪装成low。Opportunity不统一分数/权重/推荐/排序，不因观察年龄或上传时间改变；Freshness独立。阈值进入server versioned policy，修改规则必须更换policyVersion并重算当前核验版，不改变BoardInstance身份。

公开四级已移除，public-map-v3包含primaryStatus(nullable)、reasonCodes、policyVersion、evaluatedAt；query可按多状态OR，详情/Marker同源。全选无约束，零选明确空态，搜索AND筛选；搜索仅使用公开label，不使用synthetic alias或ID事实表。旧public-map-v2请求与旧结果不能静默升为新评价。

Pre-state：规则冲突及拆套禁用；本次直接答复解决。Files：design/tech/plan/progress/architecture、server evaluator/projection/API、client wire/query/discovery/presentation/home以及边界/跨层测试。无新云resource/config/flag/data写入；只读shadow preflight确认epoch25、8函数全部关闭/caller空、read-stop/HA pause=true、PUBLIC=0。未管理读取V1私有记录；完整V1 diff保留TASK20最终0，本轮未重复全量配置/Storage对比。

自动证据与失败修复见实现报告及artifacts/task21/local-prepilot-verification-20260930.json；Founder真机新evidence=NOT_RUN，视觉待审；T20-P2-01仍待真实cold/warm复测或明确RC风险接受。Rollback/真实成本/真实用户pilot/RC尚未执行；没有伪造这些PASS。Git既有dirty tree保留，无commit/push/PR/merge/tag/正式upload/review/publish。TASK22锁定。
