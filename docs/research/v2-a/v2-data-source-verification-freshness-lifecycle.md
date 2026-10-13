# V2_DYNAMIC_BOARD_DATA_SOURCE_AND_FRESHNESS_REPORT

> Task: `TASK-V2-02`
>
> Current title: 动态版面地图的数据来源、统一验证流程与 Freshness 生命周期
>
> Status: `COMPLETE / HUMAN_APPROVED / CONTINUE`
>
> Production read/write: `NO`

## 1. Decision summary

V2 地图的数据核心是 ICHI 自有数据库。热启动采用首次上线前的一次性 `Initial Data Seeding（初始数据填充）`，不依赖外部平台提供运行时数据，也不建立上线后的持续自动采集系统。

四类数据来源最终进入同一个统一版面数据模型：

| `sourceType` | 数据入口 | `observedAt` basis | 展示来源 |
| --- | --- | --- | --- |
| `V1_HISTORY` | V1 Current Publication 的 exact approved facts | 原版面拍摄／提交的可信时间 | ICHI 历史记录 |
| `PLAYER_DIRECT` | 用户现场直接上传版面 | 可信拍摄时间；缺失时使用服务端提交时间并标明 basis | 用户直接上传 |
| `PLAYER_ASSISTED` | 辅助抽赏产生的结构化最终版面 | 权威 draw/event 发生时间 | 辅助抽赏 |
| `NETWORK_SOURCE` | 首次上线前筛选的公开版面帖子 | 公开帖子发布时间 | 网络来源 |

`Source` 只回答“数据从哪里来”，不回答“数据是否可信”。不得建立 source confidence、source tier、source weight 或按来源降级／升级的设计。

## 2. Unified board data model

所有来源使用同一最小模型，差异只保存在 provenance：

| Field group | Required meaning |
| --- | --- |
| identity | ICHI 内部 board lineage/version；不从网络 URL 或用户短码推导 public ID |
| source provenance | `sourceType`、source reference、source label、captured/submitted/event/published/fetched timestamps、处理批次 |
| structured board | IP/theme、各赏 remaining、Grand Prize flags、price facts、结构化校验结果 |
| verification | `verificationState`、pipeline version、evidence references、verifiedAt、failure reasons |
| opportunity | Opportunity Evaluation version、候选 level 和 fact-based reasons |
| freshness | `observedAt`、`observedAtBasis`、`asOf`、continuous freshness value/version |
| eligibility | rights、field allowlist、venue/public geo、privacy、moderation、visibility、takedown reasons |

禁止字段：`sourceTrustScore`、`sourceConfidenceTier`、`networkIsLessTrusted`、`playerIsMoreTrusted` 以及任何来源权重。

## 3. Unified Verification

统一验证状态只有：

- `NOT_VERIFIED`：尚未完整通过 ICHI 系统处理；不得进入地图展示。
- `VERIFIED`：已完成图片识别、结构化提取和版面校验，并保存使用的 pipeline/version/evidence。

流程为：

`Source ingest → NOT_VERIFIED → Recognition → Structured Extraction → Board Validation → VERIFIED`

`Opportunity Evaluation` 建立在 VERIFIED 的结构化事实之上，但不负责决定真实性。它不代表推荐、中奖概率、到店建议或消费建议。任何来源只要完成同一 Verification，即进入统一可信数据体系；任何来源没有完成时都不能通过来源名称获得豁免。

## 4. Freshness lifecycle

所有记录统一由 `observedAt` 计算 Freshness：

1. `V1_HISTORY`：使用已保存的拍摄／提交观察时间及其 provenance。
2. `PLAYER_DIRECT`：优先可信拍摄时间；若只有提交时间，必须以 `SUBMITTED_AT_FALLBACK` 标记 basis。
3. `PLAYER_ASSISTED`：使用产生当前版面状态的最后一个权威事件发生时间。
4. `NETWORK_SOURCE`：使用公开帖子发布时间，不能使用采集时间冒充观察时间；`fetchedAt` 单独保存。

Freshness 回答“现在还有多少行动参考价值”，不回答“事实是否真实”。它必须连续衰减并保留 `asOf` 与算法版本；参数仍待后续校准。

- Freshness 低不会把 `VERIFIED` 改回 `NOT_VERIFIED`。
- Freshness 不等于 retention 或删除。
- 历史数据可以继续保存，并通过历史筛选查看。
- 默认地图是否隐藏低 Freshness 数据由 Public Eligibility／展示政策决定。
- `observedAt` 缺失或不可追溯时 Freshness=`UNKNOWN`，不能用 `fetchedAt` 或 `verifiedAt` 静默替代。

## 5. NETWORK_SOURCE Initial Data Seeding

NETWORK_SOURCE 只定位为 V2 首次上线前的初始数据导入机制。

### 阶段 1：单区域、约 20 条链路验证

选择一个明确区域，人工筛选约 20 条公开版面样本。逐条验证：

`Network Source → Recognition → ICHI Verification → Opportunity Evaluation → Freshness → ICHI Database → Map Display`

阶段 1 必须记录：公开来源 URL/标识、帖子发布时间、采集时间、图片使用依据、识别／提取／校验版本、失败原因、重复判定、Opportunity reasons、Freshness 和最终地图来源标签。约 20 条是链路验证样本，不是 V2-A PASS 数量门槛，也不等同 30/10/14 Pilot Readiness Target。

只有以下项目全部通过才进入阶段 2：

- 所有地图候选均为 `VERIFIED`；
- `observedAt` 来自帖子发布时间并可追溯；
- 来源固定显示“网络来源”，不存在用户贡献者身份；
- 重复／冲突记录不会静默覆盖；
- rights、venue、public fields、privacy、moderation 和 takedown 可由 Public Eligibility 独立判断；
- 失败样本留在非公开处理状态。

### 阶段 2：扩大网络样本采集

阶段 1 经人工批准后，才允许扩大公开网络样本采集。扩大规模前必须冻结批次上限、来源范围、重复策略、停止条件、运营 owner 和成本预算。仍是一次性上线准备，不创建 crawler、scheduler、持续同步或自动刷新系统。

### 阶段 3：导入与发布流程

只把处理完成且满足导入 contract 的数据写入 ICHI 数据库。数据库中的统一版面记录继续经过 Public Eligibility；只有 `VERIFIED + eligible` 的安全投影才能生成地图展示数据并进入发布流程。

Initial Data Seeding 结束后关闭导入批次。上线后的新增数据默认来自 `PLAYER_DIRECT` 和 `PLAYER_ASSISTED`；若未来要持续使用 NETWORK_SOURCE，必须建立新的 Product Gate、合法性／运营／成本方案和显式人工批准。

## 6. V1 history and future player contributions

### V1_HISTORY

V1 历史记录不因来源是 ICHI 就自动上图。只有能精确解析到 approved submission、字段完整、observedAt 可追溯并通过 V2 Public Eligibility 的记录，才可进入统一模型。历史 consent／private APPROVED 不等于 public permission。

### PLAYER_DIRECT / PLAYER_ASSISTED

两条未来玩家路径复用可信 Account ownership 和 V1 验证事实。它们遵守相同的 Verification、Freshness 和 Public Eligibility，不因“玩家来源”得到更高可信等级。Owner withdrawal、account delete 和 admin takedown 继续是公开生命周期能力，但不再作为 TASK-V2-02 的中心模型。

## 7. Public Eligibility

地图展示必须同时满足：

`VERIFIED + Opportunity contract + Freshness policy + rights/authorization + public-field allowlist + Confirmed Venue/Public Geo + privacy + moderation + not withdrawn/taken down`

Verification、Opportunity、Freshness 和 Public Eligibility 是四个独立结论：

- VERIFIED 不代表 Opportunity HIGH；
- Opportunity HIGH 不代表推荐；
- Freshness 低不代表不真实或应删除；
- NETWORK_SOURCE 公开可见不自动等于可再发布；
- Public Eligibility 失败不破坏 ICHI 保存的合法私有／内部事实。

## 8. Lifecycle and failure table

| Event | Verification | Freshness | Public result |
| --- | --- | --- | --- |
| source 刚进入 | `NOT_VERIFIED` | 可暂存 observedAt，不展示 | 不上图 |
| ICHI 全流程通过 | `VERIFIED` | 按 observedAt 计算 | 进入 eligibility，不自动公开 |
| Freshness 下降 | 不变 | 连续下降 | 可能从默认地图隐藏，历史仍保留 |
| 来源更正发布时间 | 重新审计 affected version | 重算 | 旧 projection 不得覆盖新版本 |
| owner withdrawal | private truth 不变 | 不变 | 玩家来源 hide-first |
| network takedown | internal evidence 按 policy 保留或删除 | 不变 | public payload hide-first |
| 迟到 seeding job | 不得覆盖新版本 | 使用对应 observedAt | closed batch 不得复活 retired lead |

## 9. Pilot readiness and current evidence gap

上海／14 天／30 条合格记录／10 个 Confirmed Venue／两条玩家入口各至少 5 条继续只是 `PILOT_READINESS_TARGET`。阶段 1 的单区域约 20 条 NETWORK_SOURCE 样本是 Initial Data Seeding 链路验证，两者不能互相替代。

当前没有获批的生产 aggregate-only 接口或 seeding write path，因此生产数量、年龄分布与字段完整度仍为 `UNKNOWN`。本报告没有读取或写入生产数据库，private-field leakage=`0`。

## 10. Human decisions

请批准或调整：

- 四类 `sourceType` 和统一版面模型；
- `NOT_VERIFIED / VERIFIED` 及 ICHI Verification 步骤；
- 各来源的 `observedAtBasis`；
- NETWORK_SOURCE 三阶段 Initial Data Seeding、单区域约 20 条样本和结束条件；
- Public Eligibility 对 network rights/label/takedown 的处理；
- `Continue / Adjust / Stop`。
