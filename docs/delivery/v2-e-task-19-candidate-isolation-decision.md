# TASK-V2-19｜Candidate 隔离方案决策材料

日期：2026-09-25。状态：`FOUNDER_SELECTED_OPTION_2 / RESOURCE_APPROVAL_PENDING`。本表保留两路比较证据；Founder 随后明确选择在现有 V1 CloudBase 环境内新增严格隔离的 V2 shadow resources，未批准任何云端写入。canonical implementation plan 已仅将 candidate 环境边界修订为 candidate isolation boundary，其他 V2-19—22 Gate 不变。确切待批资源见 [`v2-e-task-19-shadow-resource-diff.md`](./v2-e-task-19-shadow-resource-diff.md)。TASK-V2-19 继续 `IN_PROGRESS`，TASK-V2-20 未开始。

## 已核实的基线

- Founder 确认 `cloud1-d7gxqfwv783a1f131` 是 ICHI V1 正式环境，当前没有独立 V2 candidate 环境。CloudBase CLI 3.8.4 在 `ap-shanghai` 的只读 `env list` 只列出这一环境；`env detail` 显示它是 `baas_personal`／个人版、预付费、状态 `NORMAL`、到期时间 **2026-10-28 23:59:59**。CLI 的区域列表本身只证明上海区域；“没有其他 candidate”另由 Founder 确认。
- 只读数据库 `listCollections` 返回 13 个 V1 collection，与仓库 V1 manifest 名单一致；逐个 `listIndexes` 返回这些 collection 的现有索引。未发现 `publicMapLeads`、`publicMapQuerySnapshots` 或任何 V2 shadow collection。只读 `fn list` 返回 19 个 Active 的 V1 函数，未发现 V2 query/detail 或 Human Assistance 函数。没有读取业务文档、凭据值或用户数据。`env usage/info` 明确提示**现有环境不处于资源点计费模式**，因此 CLI 未返回资源点／用量细项；官网新套餐的 40,000 点不能直接套算这份现有 V1 账单。远端 collection ACL、函数调用规则、真实账单和账号的新环境购买资格尚未读回；仓库的 13 个 `ADMINONLY` 是本地声明，不能冒充远端 ACL 复验。
- D09 本地未应用候选只有两项 collection：`publicMapLeads`（`publicLocation.point` 地理索引、`publicLeadId + servedVersion` 唯一索引）和 `publicMapQuerySnapshots`（`expiresAt` 索引）；两项函数：`query-public-map-leads`、`get-public-map-lead-detail`。TASK-V2-19 主报告另提出持久限流／读停止、projection outbox；Human Assistance 的请求、证据、association 与候选查找持久化仍需精确设计和审批。这些均未创建。

## 两条可选路径

| 比较项 | ① 新建独立 CloudBase candidate 环境 | ② 在现有 V1 环境内使用严格隔离的 V2 shadow 资源 |
| --- | --- | --- |
| 当前账号可行性 | 环境是 CloudBase 的独立资源及计费单位，技术路径成立；但本账号是否仍有免费环境资格、可新购的套餐／地区、订单价格和支付资格未核实。当前已见一个个人版环境，**不能推断**第二环境能免费创建或一定可购买。须先只读取得下单报价和资格，再单独授权创建。 | 已有上海个人版环境且 13 collection／19 函数正常运行；逻辑上可在同环境增设不同名资源。但 collection／函数上限、可用资源点余量、现有函数安全规则和 V1 峰值容量未读回，不能宣称可直接实施。无需第二环境购买资格。 |
| 额外成本 | 若账号仍有可用免费名额且候选所需能力适用，环境基础费可能为 ¥0；否则官方公开个人版显示 **¥19.9/月限时优惠**，实际以本账号下单页为准。候选环境的函数、数据库、日志、存储等消耗其独立配额，超出套餐可能另计费；创建后到清理前基础费持续。 | 无第二环境基础套餐费；候选读写、函数、索引、日志仍消耗**现有 V1 环境共享配额／计费资源**并可能引起超额费用或挤占 V1 容量。CLI 提示该环境不是资源点计费模式，不能用官网 40,000 点计算余量；需以现有套餐用量/账单页核实。V2-18 的约 ¥11.02/月是条件性的变量成本估算，不能作为任一路径的真实报价。 |
| 资源和索引 | 可在新环境保留 D09 原始 `publicMapLeads`／`publicMapQuerySnapshots` 和两个函数名；候选限流／读停止、projection outbox、BoardInstance 关联及 Human Assistance 持久资源使用该环境自己的命名空间。每个索引在新环境中创建和读回。客户端必须显式指向候选 env ID，默认公开读取关闭。 | 必须采用与 V1 和未来正式资源均不冲突的 `v2Shadow...` collection、候选专用函数名和索引命名；严禁在 V1 collection 加 V2 字段／索引作为隔离捷径。D09 名称在此方案下需**单独批准的映射清单**，不能把现有候选 JSON 直接 apply。函数权限规则是环境级配置，任何新增规则需精确 diff 和 V1 函数回归。默认关闭所有入口。 |
| Human Assistance 资源 | 两路都需要最小的 owner-scoped request／answer／budget/cooldown 持久状态、append-only association decision、候选查找及 My Uploads 安全投影；可复用已批准的 candidate 资源时优先复用。若新增 collection／索引／函数，其物理名称、唯一键、过期和权限须另作精确候选 diff。 | 同左，但所有物理资源必须有 shadow 前缀和独立 feature flag，不得让 V1 `get-my-records`、`observationCandidates` 或 `systemSettings` 默默承载 V2 判定；候选函数不能读取真实 V1 记录。 |
| 数据和权限隔离 | 环境间数据库、函数、身份和配额独立；只放 synthetic／rehearsal 数据。跨环境的微信身份、客户端初始化和 owner 双账号测试需要专门验证，不能直接沿用 V1 身份断言。 | 只有**逻辑隔离**，不是独立安全边界：同环境服务端凭据、管理员权限、日志、资源点和部分配置共享。所有 shadow collection 均须服务端独占、客户端直读写拒绝；函数内部再次校验可信身份。仅 synthetic／rehearsal 数据，不查询或复制真实 V1 文档。 |
| V1 风险 | 低于同环境方案：candidate 失败原则上不影响 V1 数据面。主要风险是错误 env ID／默认 `cloudbaserc` 指向 V1、客户端错误切换、账号级费用和后续跨环境迁移失误；每个命令要拒绝 V1 env ID。 | 较高：命名、索引、函数安全规则、环境配置、共享资源点或误用管理员 SDK 都可能波及 V1。即便 feature flag 默认关闭，资源争用与误操作残余风险仍在；必须有精确 allowlist、命令级 env/资源名双校验、V1 前后清单与功能回归，不能声称“完全物理隔离”。 |
| TASK-V2-19 rehearsal／rollback | 环境内 synthetic 迁移、故障注入和 rollback 可整体限定到候选 env；停止读取→停 projector→隐藏／失效快照→读回，再经单独清理批准删除 synthetic 数据或环境。独立环境销毁可能是不可逆动作，须单独授权。 | 每步只能操作列明的 shadow 资源；关闭候选函数和 flag、停 shadow projector、失效 shadow 快照／隐藏 shadow rows，再逐项读回。不能用 wildcard 删除、全环境停服或改 V1 规则回滚。清理粒度更细、误删风险更高；同环境配置 diff 的恢复要额外验证 V1。 |
| TASK-V2-22 正式合并路径 | 在 V2-19/20/21 全门通过后，另行授权把**已审查的函数构建物、schema、索引和安全规则**部署到 V1 正式环境；从 V1 当前且获授权的记录按行重建正式投影，不直接复制候选 synthetic 行；切换正式 read flag 前做 canary/read-back，候选环境之后独立清理。 | 在 V2-19/20/21 全门通过后，另行授权于同一环境建立正式 `publicMap...` 资源和正式函数，或经 Founder 审核明确允许的资源升级路径；从 V1 当前且获授权的记录重建，绝不把 synthetic shadow 行直接改成正式行。完成双清单对比、canary、正式 flag 切换后，再单独清理 shadow 资源。多一轮同环境资源迁移，不能简单“改前缀上线”。 |

上表是 Founder 作隔离策略选择时的比较，不是可执行资源清单。方案②的物理名称、索引和配置提案已另列于 shadow resource diff；函数 artifact/哈希、账号配额与实际计费仍未冻结，不能据此执行创建或部署。

## 费用与清理的决策口径

官方当前公开定价为每账号一个免费环境、免费版每月 3,000 资源点；个人版限时 ¥19.9/月、每月 40,000 资源点，1,000 点约 ¥1。该页面提示新购付费环境进入独立下单页，故不能把官网标价当作本账号订单；现有 V1 环境经 CLI 确认**不在资源点计费模式**，其实际超额规则须从现有套餐/账单页单独核实。现有环境个人版的到期时间也意味着任何长周期 candidate 测试前需核对续费/停服安排。路径 ① 的保守增量表达式为 `实际第二环境基础报价 + 候选超额消耗 + 清理前持续费用`；路径 ② 为 `V1 环境增加的资源消耗及可能超额费用 + V1 性能/隔离风险`。两者实际用量、账单及 Human Assistance 的 AMBIGUOUS 率均无实测，不提供虚假的精确金额。

无论选择哪条路径，清理前均需只读确认 synthetic 行数、保留期、待处理 outbox、审计与 no-resurrection tombstone；执行删除另获批准，清理后读回资源和账单状态。特别是路径 ②，清理范围不能包含任何 V1 collection、函数、索引、Storage 前缀或共享设置。

## Founder 决策与后续门禁

Founder 已选择②，不创建第二环境。选择路径只确定隔离策略；9 collection／15索引／6函数的具体清单、函数 artifact、secret/config、synthetic rehearsal 和 rollback mutation 仍须逐项明确授权。当前 `TASK_V2_19_EXTERNAL_ACTION_APPROVAL_REQUIRED`；TASK-V2-19 不标 `COMPLETE/HUMAN_APPROVED/FROZEN`，V2-20 未开始。

## 依据

- 仓库：`packages/v2-map/resources/cloudbase-resource-candidate.json`、`services/cloudbase/database/resources.json`、`services/cloudbase/deploy/manifest.json`、TASK-V2-19 主报告与 candidate resource plan。CLI 只读返回：`env list/detail`、`fn list`、NoSQL `listCollections` 和 13 个 `listIndexes`（2026-09-25；未读取业务文档）。
- [CloudBase 官方定价](https://cloudbase.cloud.tencent.com/pricing)：免费名额、个人版标价与资源点；实际订单仍须以账号购买页核对。
- [CloudBase 环境介绍](https://docs.cloudbase.net/quick-start/env-overview)：环境的资源与计费隔离。
- [CloudBase 云函数安全规则](https://docs.cloudbase.net/cloud-function/security-rules)：函数级规则在环境级配置，不能替代函数内部的 owner 判断。
- [CloudBase 数据库安全规则](https://docs.cloudbase.net/database/security-rules)：collection/文档权限模型；远端实际权限仍待只读核验。
