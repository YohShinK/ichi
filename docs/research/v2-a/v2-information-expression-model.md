# V2_INFORMATION_EXPRESSION_MODEL

> Task: `TASK-V2-01`
>
> Status: `COMPLETE / HUMAN_APPROVED / CONTINUE`
>
> Confidence: `EXTERNAL_USER_N=0 / LOWER_CONFIDENCE`
>
> Runtime type created: `NO`

## 1. Outcome

`ICHI Dynamic Board Opportunity Map` 应把同一条版面机会表达为三个相互独立的层次：

`VerifiedBoard（事实核对） → Freshness（当前参考程度） → OpportunityReason（等级与事实解释）`

地图只负责发现和展开信息。它不核对版面、不计算事实，也不把等级转成到店或消费建议。

## 2. 研究合同

`VerifiedBoardOpportunityExpression` 只是一份 V2-A 研究合同，不是 runtime type：

| 层 | 必需信息 | 回答的问题 | 明确不回答 |
| --- | --- | --- | --- |
| `VerifiedBoard` | `verified=yes`、IP/主题、各赏 `remaining`、Grand Prize 标记、核对版本 | 版面结构化事实是否已完成 V1 核对 | 新鲜度、机会等级、公开资格 |
| `Freshness` | `observedAt`、`asOf`、连续衰减结果或 unknown | 这次观察距当前时点多久、参考程度如何 | 数据是否真实、是否应删除、是否值得消费 |
| `OpportunityReason` | `level`、`reasonCodes[]`、每条 reason 引用的事实 | 为什么显示此候选等级 | 推荐排序、中奖保证、到店或购买建议 |

组件化摘要还必须包含统一披露：

> 这是最近一次核对后的结构化观察，不是实时库存、中奖保证或消费建议。到场后请重新核对版面。

## 3. 候选最小输入集

用于产生非 `INSUFFICIENT` 等级的推荐最小输入为：

- `VerifiedBoard = YES`；
- 可解析的 `observedAt`；
- 各赏当前余票，并保持 `null=unknown`、`0=confirmed zero`；
- 至少一个由用户明确标记的 Grand Prize，及其当前余票；
- 当前总余票。

单抽价和确定性包套总价是可选解释事实。价格缺失不会单独把完整版面降为 `INSUFFICIENT`，但不能生成任何价格 reason。任何必需输入缺失、未核对或相互不守恒时 fail closed 为 `INSUFFICIENT`。

## 4. Opportunity level 目录

这些是信息表达等级，不是 production PASS、score 或 ranking：

| Level | 研究语义 | 最低披露要求 |
| --- | --- | --- |
| `HIGH` | 在当前可用观察中，多项已核对机会事实同时突出 | 列出事实、年龄和非推荐说明 |
| `MEDIUM` | 已核对事实完整，但机会事实混合或不突出 | 不把“中”等同一般建议 |
| `LOW` | 已核对事实显示大奖为零、参考程度很低或其他弱机会事实 | 明确 `Verified=YES` 仍可 `LOW` |
| `INSUFFICIENT` | 缺少核对、观察时间或核心余票事实，不能形成等级 | 列出缺失项，不用默认值补齐 |

`HIGH / MEDIUM / LOW` 的阈值、组合优先级和到 Opportunity PASS 的映射全部保持 `UNAPPROVED`。

## 5. Reason-code 目录

| Code | 只允许引用的事实 |
| --- | --- |
| `VERIFIED_BOARD_REQUIRED` | 未形成 VerifiedBoard |
| `GRAND_PRIZE_REMAINING` | 已确认大奖剩余数大于 0 |
| `NO_GRAND_PRIZE_REMAINING` | 已确认大奖剩余数为 0 |
| `GRAND_PRIZE_REMAINING_UNKNOWN` | 大奖余量为 `null` |
| `GRAND_PRIZE_RATIO_VISIBLE` | 可显示大奖剩余数／初始数；不暗示优劣阈值 |
| `TOTAL_REMAINING_VISIBLE` | 已确认总余票 |
| `TOTAL_REMAINING_ZERO` | 已确认总余票为 0 |
| `TOTAL_REMAINING_LOW_CANDIDATE` | 命中尚待批准的“较少”参数，仅用于敏感性研究 |
| `SINGLE_DRAW_PRICE_KNOWN` / `PRICE_UNKNOWN` | 单抽价事实存在／未知 |
| `BUYOUT_TOTAL_KNOWN` / `BUYOUT_TOTAL_UNKNOWN` | 确定性包套总价可由 `R × c` 得出／不能得出 |
| `OBSERVATION_RECENT` / `OBSERVATION_AGED` / `OBSERVED_AT_UNKNOWN` | 观察年龄的候选表达 |
| `FRESHNESS_LOW_CANDIDATE` / `FRESHNESS_UNKNOWN` | 连续 Freshness 候选低值／不可计算 |
| `DATA_INSUFFICIENT` | 一个或多个核心输入缺失或不合法 |

所有 reason 必须携带被引用字段和值；禁止仅输出“系统判断”。

## 6. Freshness 连续衰减候选

V2-A 推荐以指数半衰期曲线作为后续校准起点：`f(age)=2^(-age/halfLife)`。它连续、单调、容易解释“每经过一个半衰期参考程度减半”，且不会把数据在某个小时突然变成零。

对照候选为双曲线 `1/(1+age/scale)` 和 Logistic 曲线。前者尾部过长，后者需要额外拐点参数。当前没有真实观察年龄分布，因此 `halfLife`、默认隐藏阈值和等级联动全部不冻结。

低 Freshness 记录不删除。推荐交互方向是：默认“当前机会”层可在未来获批阈值下隐藏，历史筛选仍可找到，并同时展示 observedAt、年龄和低参考程度说明。Retention 与 Freshness 必须分别决策。

## 7. 合成场景与理解检查

固定 fixture 位于 `verified-board-opportunity-scenarios.json`，覆盖 10 个场景：大奖充足、大奖较少、大奖为零、总余票较少、旧观察、大奖未知、观察时间未知、余票确认归零、价格未知和未核对输入。

自动检查结果：

- 10/10 场景包含非空 reason trace；
- 等级只使用 `HIGH/MEDIUM/LOW/INSUFFICIENT`；
- `null` 与 `0` 分别触发 unknown 与 confirmed-zero 语义；
- fixture 未出现“建议去／建议抽／建议包套／容易中奖／价格极低”；
- 统一披露包含观察、非实时和非消费建议边界；
- fixture SHA-256：`d97518500ba03bdda9f816208a2baa92bf62f9a1ed3fecc5045eac7b2e6016b9`。

内部 walkthrough 只能证明合同自洽和文案可审阅，不能证明外部用户真实理解。外部样本数固定为 0，TASK-V2-21 必须以真实用户复验误解率和行动理解。

## 8. EDG-V2-04 修订建议

EDG-V2-04 在 V2-A 只判断：用户能否区分事实核对、参考程度与机会理由；能否识别观察时间、非实时边界和非推荐性质。它不再比较方案 C 与方案 B 的相对价值。外部用户价值与行动证据在 TASK-V2-21 复验。

## 9. 人工决定

请在 V2-A 验收时批准或调整：三层层级、四等级枚举、reason-code 目录、指数半衰期研究方向、低 Freshness 默认表达、统一披露，以及 `Continue / Adjust / Stop`。
