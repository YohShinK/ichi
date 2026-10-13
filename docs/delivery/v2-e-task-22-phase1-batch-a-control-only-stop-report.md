# TASK22 Phase1 第一批控制资源：执行前 STOP 报告

结果：`STOP_PRE_APPLY_V1_METADATA_DIFF`。本批已获 Founder 明确授权，但在任何云端写入前触发差异检查，未创建资源。`CloudBase external writes = 0`；`CLOUD_NOT_APPLIED / PRODUCTION_NOT_ACTIVE`。本次结果不是批次 apply PASS，也不是生产部署或人工验收通过。

## 授权和执行边界

用户本轮明确批准仅执行 [minimum-external-action-batch.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/minimum-external-action-batch.json>)，SHA-256 `3b8978d8007bc16c8f822462c4ced8e3bcd198024f54f832b62b77bd11848813`；批次 `PHASE1-A-CONTROL-ONLY`，环境 `cloud1-d7gxqfwv783a1f131`，NoSQL / ap-shanghai / NORMAL。

唯一允许动作：创建 `mapControlState`；ACL `ADMINONLY`；创建 `kind_expiry` 非 TTL 索引（kind 1 / expiresAt 1、非唯一）；写入冻结的 4 条安全 control rows。用户同时要求：“若资源已存在或实际diff不符立即STOP，不覆盖。”

授权文件未改动。未运行任何云端写工具；没有集合创建、ACL 修改、索引创建或 control row 写入。9 个新函数未部署，secret 未绑定或轮换，服务未开启，业务数据未写，Phase2 / NETWORK / 50 / 300 未开始；没有 Git 或微信发布动作。

## 执行前差异及 STOP 原因

本次检查时间：2026-10-02 15:09:01 Asia/Shanghai（JSON 使用 UTC）。对照上次本地收口只读证据 [live-final-readback.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/live-final-readback.json>)，其时间为 2026-10-02 03:39:05 Asia/Shanghai。

全部集合名称一致、26 个集合的索引定义与 ACL 一致；19 个 V1 函数完整稳定配置 SHA 一致，排除 API RequestId，使用顶层字段排序后 JSON 的 SHA-256，与既有算法保持一致。28 个既有函数均建立本次只读快照；entry source SHA 和 Environment 值哈希核对没有差异。

但是 9 个 V1 集合的 Count / Size 已变化：

| 集合 | 文档数：上次 → 本次 | 容量 bytes：上次 → 本次 |
| --- | --- | --- |
| accounts | 118 → 119 | 17818 → 17969 |
| auditEvents | 337 → 344 | 94831 → 96916 |
| dailyQuotas | 28 → 30 | 32253 → 33353 |
| ichiIds | 119 → 120 | 16261 → 16397 |
| observationCandidates | 17 → 19 | 51267 → 57285 |
| profiles | 118 → 119 | 36861 → 37172 |
| recognitionJobs | 74 → 76 | 767944 → 797272 |
| recordCodes | 39 → 41 | 7449 → 7831 |
| wechatIdentities | 118 → 119 | 23836 → 24038 |

这些是业务数量和容量元数据的变化，不是 schema、索引、ACL 或函数配置变化，且在本 Agent 任何云端写入之前已经存在。可能来自正常线上活动，但没有读取业务正文或审计日志来确定原因，不能把这一推测写成已验证事实。

本批读取范围包含 V1 元数据，用户未明确允许忽略该类漂移。依据严格 STOP 条件，保守停止，未将 `V1 metadata diff = 0` 或整批 `V1_DIFF = 0` 写成 PASS。资源配置比较本身为 0；该结论不等于用户业务记录正文相同。

## 目标资源及安全状态回查

| 检查 | 结果 |
| --- | --- |
| mapControlState 执行前存在性 | false |
| STOP 后只读存在性回查 | false |
| 目标 schema / indexes / ACL | NOT_CREATED；没有可验收的新增资源 |
| 4 条冻结 control rows | NOT_WRITTEN；未调用写工具，不以期望值冒充回读值 |
| 冻结文件及 proposal SHA | 未变化 |
| V1 配置差异 | 13 集合 / 43 索引 / 13 ACL / 19 完整稳定函数配置：0 |
| V1 元数据差异 | 9 集合 / 18 个 Count、Size 字段；执行前已存在 |
| shadow read-stop | true |
| shadow HA pause | true |
| shadow read-epoch | 41 |
| shadow PUBLIC 数量 | 0 |
| shadow 服务开关 | 9 个函数的 ENABLED 变量全部 false |
| Storage / 环境安全规则 | 与既有记录一致；存储只读取 2 项对象元数据，不下载内容 |
| 云端写入 | 0 |

NoSQL 是无固定字段 schema 的文档库，本次没有创建集合，因此不能报告新增字段、索引和 ACL 的远端验收。预期 4 条 control rows 仍以原始授权 JSON 为唯一事实源。

## 配置检查中的密钥输出事件

在读取 `bootstrap-account` 的既有配置时，Agent 错误输出了包含 `IDENTITY_HMAC_KEY` 值的工具响应。已向 Founder 说明该事件，后续仅输出和保存哈希。本报告和新证据文件均不包含该密钥值；没有将它写入函数包、代码或业务数据。不能宣称本次没有密钥输出事件。

本批授权不含 secret 轮换或绑定，Agent 未自行轮换。该值已出现在会话工具输出中，本报告不声称已清除该输出。后续如何处理该事件需独立确定；不在本批扩大权限或隐瞒事件。

另有三个只读参数／名称错误：先查询不存在的 `ensure-user`，随后按实际函数列表纠正；函数环境权限查询的空／省略 resourceId 被工具拒绝，改为 `*` 后成功。所有失败均在写入前，未造成云端 mutation。完整函数 SHA 初次使用递归字段排序与旧算法不同，随后按既有顶层排序重算，19 个 V1 SHA 全部匹配；该算法差异不计为云端配置变更。

## 证据、治理更新与当前 Gate

脱敏执行前快照和字段级差异：[batch-a-control-only-preflight.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/batch-a-control-only-preflight.json>)。包括 26 集合元数据／索引／ACL、28 函数完整稳定配置哈希、环境变量哈希、层与触发器、shadow 状态和权限规则；不保存原始函数 secret 或真实用户业务正文。

本批只增加独立报告、脱敏证据，并在 architecture / progress / implementation-plan / tech-stack 增加当前 STOP 记录；不改产品行为、冻结 core、V1／客户端代码、9 包及其 manifest 或授权 JSON。文档工作流验证与差异空白检查通过后记录为已完成 STOP 交付，不重复冒充运行新的全量代码回归。

TASK22 保持 `IN_PROGRESS / PHASE_1_PRODUCTION_BACKEND_CONVERGENCE_IMPLEMENTED / LOCAL_GATES_PASS / EXTERNAL_ACTION_APPROVAL_REQUIRED`。本批子状态为 `PHASE1_A_CONTROL_ONLY_AUTHORIZED / STOP_PRE_APPLY_V1_METADATA_DIFF / NOT_EXECUTED`；仅本批已授权，其余外部动作仍未批准。原本地收口报告保留历史事实，本报告是较新的外部批次执行记录。

继续此批前需要明确 V1 Count / Size 漂移的处理口径，不能自行忽略 STOP 条件或重置基线后继续；授权 JSON、目标集合不存在和其他禁止范围仍持续生效。后续如允许以本次快照作执行前基线，仍须立即检查目标不存在、严格单批执行及完整只读回查。当前没有批次 rollback 可执行，因为没有新增云端资源。
