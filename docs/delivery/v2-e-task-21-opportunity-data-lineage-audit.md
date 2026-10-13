# TASK-V2-21｜Opportunity 数据与规则来源审计

2026-09-30 当前实现补充：该报告下方是规则前只读审计；现已按Founder最终规则实现server evaluator/public-map-v3以及三消费点，SPLIT_SET=R≥60，不再需要原装基线。详见 opportunity-evaluation-and-filter-restore.md 与最终决定表。原字段来源/null/zero/privacy限制继续成立。cloud仅新增只读shadow preflight，无代码/配置/数据写入；实际云端旧合同仍未迁移。

日期：2026-09-30（Asia/Shanghai）。阶段：Pre-Pilot Closure A / READ_ONLY_AUDIT_COMPLETE。Pre-state：TASK20 待 final ack；TASK21 READY / NOT_STARTED。当前：TASK20 已依本次命令关闭；TASK21 `IN_PROGRESS / OPPORTUNITY_RULE_FOUNDER_DECISION_REQUIRED`。

## 结论

有 exact-version VerifiedBoard、评估结果模型和投影门，但**没有从真实 facts 计算机会结果的 authoritative evaluator**。`recordOpportunityEvaluation` 只验证并记录调用方给定结果；shadow projector 的 `candidateFromFixture` 读取 `fixture.opportunity` 的预设 level/reasons/PASS。该 synthetic 演练路径不能成为真实 pilot 的 Opportunity authority。

Marker wire 仅提供 `opportunity.level`；detail wire 已提供 `level / reasonCodes / evaluatedAt / policyVersion`。五个中文状态不是四级 level 的同义词，当前仅靠等级无法恢复五类 filter、Marker 主标签与详情 ICHI 对话。

## 已有字段，逐层可用范围

| 字段／事实 | 真实来源与核验边界 | 当前公开能力／限制 |
| --- | --- | --- |
| ipName / themeName | V1 用户核对 finalSnapshot；direct 要 recognition ACCEPTED，assisted 要 exact APPROVED submission；candidate 只用 SYNTHETIC_REHEARSAL fixture | marker boardShortLabel；detail IP/主题；不公开 raw OCR |
| tiers[].tierCode / rawLabel | 用户核对 snapshot，source adapter 验证非空／唯一 code，verifyBoard 验结构与 current observation version | detail tierCode / displayLabel；不带内部 recognition evidence |
| tiers[].remainingTickets | 核对后的当前每赏余票；V2 BoardFacts 接受非负整数或 null | detail 直接投影；null 未知、0 已确认零；不能缺值补零 |
| tiers[].initialRemainingTickets | V2 BoardFacts 已有，可为 null；来源 snapshot 的起始观察余量，字段本身不能证明“原装总票数”或拆套时间 | 当前 PublicBoardFacts／detail 不公开它；需要比例基线时先确认它的产品含义和 lineage，不把名称当事实 |
| tiers[].isGrandPrize | 最新 R2 由用户明确多选，不能由奖级字母／余票阈值重判；shadow 使用 fixture 中该事实 | detail 公开 boolean；机会 evaluator 只消费 verified 标记，不替用户分类 |
| totalRemaining | 服务端 public serializer 在所有 tiers.remainingTickets 已知时求和；任一未知为 null | marker/detail 已公开；全零为 0；不是新 Opportunity 规则 |
| grandPrizeRemaining | serializer 筛 isGrandPrize，非空且每项余票已知才求和；无标记项或任一未知为 null | detail 已公开，marker 无此字段；不能把无 Grand 标记当大奖 0 |
| pricePerDrawMinor | snapshot 规范化单抽价（最小货币单位），允许 null，source adapter 验非负整数 | detail 已公开；价格缺失不生成价格理由 |
| fullPackCostMinor | 服务端 totalRemaining × pricePerDrawMinor，任一未知则 null | detail 已公开；表示确定性剩余金额，不证明 LAST 存在、剩余或可获得 |
| LAST 事实 | 当前 V2 BoardFacts 没有 hasLast / lastAvailability / lastPrizeRemaining 等已核验字段；R2 prompt 的无独立兑奖区 LAST 不作为普通 tier 输出 | 现有 “LAST包套” 金额展示不等于 LAST 状态证据；规则若要求 LAST 实际存在／尚可获得，需要补 product/data-contract 决定 |
| 拆套／刚开箱证据 | 当前 BoardFacts 无 openedAt / splitAt / verifiedFreshPack 事实；BoardInstance NO_MATCH 或新建仅是身份关联结果 | observedAt 新、上传新、remaining==initial 都不能自行证明“刚刚拆套” |
| observedAt | source adapter 按 exact source version 传递；VerifiedBoard 保留；NETWORK_SOURCE 模型要求帖子发布时间而非抓取时间 | marker/detail freshness.observedAt；candidate 当前为 synthetic 时间，不是 participant 行为证据 |
| freshness | 公共服务按 observedAt 与 server asOf／versioned policy 产生 band | marker/detail 有 band/asOf/policyVersion；shadow 1h/24h 仅 v2-19-synthetic-freshness，不是批准的 pilot 阈值 |
| VerifiedBoard identity/version | verifyBoard 绑定 observation version/current version，校验结构；保留 private provenance | 不公开内部 ID、owner、raw location、verification provenance；结构校验不是新图片识别链实拍证据 |
| Opportunity result | recordOpportunityEvaluation 绑定同一 VerifiedBoard ID/version；接受 level/reasons/policy/evaluatedAt 和独立 publicGateDecision | 投影保存四个公开结果字段；不公开内部 evaluation identity／private evidence；缺确定性计算 policy |

V1 R2 正式最终 board schema 只接受已确认整数余票；V2 reference 的 nullable facts 和 recognition 中未知信息必须分层解释。未知识别不能在 adapter 中强行完成为零，也不能用客户端概率显示成为 public authority。

## Pipeline 现状

| 层 | 当前实际逻辑 | TASK21 必须补齐 |
| --- | --- | --- |
| source / verify | current publication → source-specific adapter → exact-version verifyBoard；shadow verifiedFromFixture 强制 synthetic origin | 真实获授权 pilot 输入需要独立 route/artifact/resource review；不能仅改 dataOrigin 标签 |
| evaluation | verification.ts 的 recordOpportunityEvaluation 是结果构造器 | 从当前 VerifiedBoard facts 执行 Founder 冻结的 deterministic、explainable、versioned policy；可重算 |
| eligibility / projection | buildPublicCandidate 拒绝缺评估、版本不匹配、独立 PASS 不成立；source/rights/consent/location/moderation/delete 各门仍独立 | 状态到 level 和独立 publicGateDecision 的精确规则；policy 变化的重算／失效传播 |
| public query | request.opportunityLevels 筛四级；marker 只 level | 若按多个 reason 状态筛，需要明确 reason-aware query/filter contract；不把五种 tag 静默映射成四级 |
| public detail | 返回完整 opportunity 四字段、Grand／total／price／fullPack | 固定 reason 文案映射和 policy lineage，不把未识别 reason 一律糊成中性说明 |
| client | candidate develop/trial 调固定 shadow query/detail；release/unknown fail closed；公开 clone/adapter allowlist | 三处共用 server result；late response、no-resurrection、public-only cache 保持 |

## 三个消费点与 synthetic 残留

1. 筛选：`pages/home/index.ts` 初始化 `mapDiscoveryChipsEnabled=false`；WXML 因而不展示。`toPublicMapPageData` 仍调用 discovery prototype 的过滤函数；所有选中时不限制 tag，少选／零选仍是历史代码路径。
2. Marker：`presentPublicMarker` 调用 `primaryDiscoveryTagForPublicLead/Id`，由历史 `lead-synthetic-001…010` 映射决定主标签和 tone；合法 candidate 的 32 位小写 hex 不命中这些键，回退四级机会文案／default tone。不是完全移除了函数调用，而是合法 candidate ID 不命中 fixture 键。
3. Detail：`presentPublicDetail.primaryDiscoveryTag` 同样查 leadId 映射；WXML ICHI 左侧对话只在该值非空时出现，正常 candidate 无此标签。`opportunityReasons` 虽由 reasonCodes 映射，当前对话没有绑定它。Picker 还调用 discoveryTagsForPublicLeadId。

正式 runtime 当前仍导入 prototype helper。规则获批后必须彻底使 leadId tag／synthetic alias 分支在正式 runtime 不可达，并测试任意 ID／fixture 伪装不会制造状态。仅保留 mapDiscoveryChipsEnabled=false 不等于清理完成。

## 批准证据与待决问题

后续 Founder 本次回复已经确定：五状态独立并存，无统一分数；大赏集合沿V1用户选择；大赏密度分母为当前总余票；低机会仅明确负向证据，unknown／无标签不触发；刚刚拆套表示早期消耗；Marker主状态建议顺序LAST→密度→存量→低→早期；详情多reason；Opportunity/Freshness分开。上述新增语义记录design-document与决策表。审计中的“分母／主顺序待决”是收到该回复前发现，现已得到语义答案；首版参数、负向条件、原装基线及公共四级／资格门仍未完整冻结。

`memory-bank/design-document.md` 明确等级≠PASS，精确映射待批准；正式引用的 `docs/research/v2-a/v2-information-expression-model.md` 第 4 节将 HIGH/MEDIUM/LOW 阈值、优先级和 PASS 映射标为 UNAPPROVED。其 ratio reason 还使用大奖剩余／初始数，与历史 chip 说明的大奖剩余／总余票不同。**比例分母必须 Founder 决定**。

已批准交互可沿用：多选 inclusive OR；搜索与筛选 AND；全部选中等价不限制，零选明确空态。Marker 主状态优先级仍 `PRIMARY_DISCOVERY_TAG_PRIORITY_GAP`。无已批准的 LAST 票数／金额、大赏数量／比例、拆套时间窗、状态过期参数可复用。决策表只问这些未决项。

## 本阶段执行记录

- Files changed：本审计、规则决策表和 current status 文档；没有实现 evaluator、serializer、UI 或 backend。
- Product decisions：未新冻规则；只确认当前缺口。Backend/frontend/data-contract changes=0。
- External actions/resources/config：0；`cloud1-d7gxqfwv783a1f131` 仅引用历史报告，未调用云端；未新增 collection/index/function/secret/trigger/ACL/Storage/bridge。
- Tests/builds：本轮文档 workflow／格式／差异及源文件不变核验见决策表；未把历史 995 测试和微信 preview 当本轮实现证据。
- Founder evidence：只有本次关闭 TASK20 的授权；机会规则、TASK21 真机、参与者证据=未取得。
- Failures/fixes/severity：未新增已确认运行缺陷；三个 pre-pilot 缺口开放；T20-P2-01 P2 开放；不凭只读审计宣称 TASK21 P0/P1=0。
- Privacy/security：未读 V1 private；只审公开字段结构／synthetic 来源，缺私有泄露不能外推为真实 pilot 全面 PASS。
- V1_DIFF：历史最终 0 / VERIFIED；本轮 local source 比对单独核验，不冒充 live 云差异。
- Rollback/cost/Git：无云变化／费用或账单；原 dirty 工作树保留，无 commit/push/发布。
- Current gate/next authorization：`OPPORTUNITY_RULE_FOUNDER_DECISION_REQUIRED`；Founder 填表后继续同一 TASK21，再产实现报告与 exact cloud diff（如需）。

## 源码定位

`packages/v2-map/src/{types,source-adapters,verification,projector,public-api}.ts`；`resources/shadow-functions/shared/{verified-fixture,public-read}.mjs`；`v2-shadow-reconcile-projection/runtime.mjs`；客户端 `platform/{public-map-contract,public-map-wire-adapter,public-map-candidate-service,public-map-presentation,public-map-discovery-prototype}.ts`；`pages/home/index.{ts,wxml}`。V1 R2 边界见 `services/cloudbase/contracts/board-record-r2.schema.json` 与 `data/recognition-contract/prompt/ichi-board-vlm-r2-direct-remaining-1.0.0.txt`。
