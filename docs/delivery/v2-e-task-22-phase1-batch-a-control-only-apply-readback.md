# TASK22 Phase1-A｜控制资源 apply 与完整只读回查

结果：**PHASE1_A_CONTROL_ONLY_APPLIED_READBACK_PASS**。严格完成原 frozen batch 的 4 个云端写调用：1 个集合创建、1 次 ACL 设置、1 个显式非 TTL 索引创建、1 次插入 4 条冻结控制记录。没有业务数据写入。该结果仅是第一批控制资源 apply 验证，不是整个 Phase1 production apply、生产服务开启、TASK22 完成或人工验收通过。

## 本次授权与执行前基线

Founder 本轮批准继续 Phase1-A，先只读分析 IDENTITY_HMAC_KEY 暴露影响与轮换兼容性；禁止直接轮换。新基线为 2026-10-02 15:09 preflight，V1 Count/Size 仅作正常 live business-volume metadata 记录；结构配置差异和异常删除／突变仍 hard stop。

唯一可写范围为 [minimum-external-action-batch.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/minimum-external-action-batch.json>)，SHA-256 `3b8978d8007bc16c8f822462c4ced8e3bcd198024f54f832b62b77bd11848813`；proposal SHA `0940d1b322566c11df46898994a87c8effea5b1fa79a261711a44eec2a345f41`。两者及 9 个函数包／manifest 保持冻结。JSON 的历史 NOT_EXECUTED 状态未改写，当前实际执行事实以本报告和 receipts 为准；不得因为冻结文件仍写 NOT_EXECUTED 而重复创建或覆盖。

目标环境 `cloud1-d7gxqfwv783a1f131` / ap-shanghai / NoSQL / NORMAL；数据库实例 `tnt-ate1395ci`。当前活动区块 V2-E / IN_PROGRESS，唯一工作集仍 TASK22 Phase1-A。

顺序：只读源码／配置安全分析 → 保存 [v2-e-task-22-phase1-identity-hmac-exposure-analysis.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1-identity-hmac-exposure-analysis.md>) → 复核结构配置 → 最终确认目标不存在 → CREATE → ADMINONLY 回读确认 → non-TTL index 回读确认 → 集合总 Count=0 且 4 个目标 ID 不存在 → insert 4 frozen rows → 精确行回读 → 全量只读回查。存在性检查至创建之间无法声明平台提供原子 CAS；create 正式返回创建成功，没有采用 overwrite / upsert。

新 preflight 时间 2026-10-02 15:20:51 Asia/Shanghai；对 15:09 基线结构配置差异 0，volume 变化也为 0；没有发现异常减少或资源删除。原 STOP 报告保留此前事实；本轮按 Founder 新指令继续，不将原 STOP 伪造为已成功 apply。

## 云端实际动作与 receipts

| 动作 | 完成时间 Asia/Shanghai | RequestId | 证据 |
| --- | --- | --- | --- |
| create | 2026-10-02 15:22:06 | c43eeec1-e4bd-4c00-932a-21921ab8852d | [batch-a-control-only-create-receipt.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/batch-a-control-only-create-receipt.json>) |
| acl | 2026-10-02 15:22:14 | 7fed9392-bd67-4952-9722-b6449ff6466a | [batch-a-control-only-acl-receipt.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/batch-a-control-only-acl-receipt.json>) |
| index | 2026-10-02 15:22:25 | f574e240-111e-43f7-9f5a-96644943d8f4 | [batch-a-control-only-index-receipt.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/batch-a-control-only-index-receipt.json>) |
| rows | 2026-10-02 15:22:38 | 4779748a-a1d7-44b6-887e-68b81b222e89 | [batch-a-control-only-rows-receipt.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/batch-a-control-only-rows-receipt.json>) |

4 个写工具调用全部成功，未重试任何写入，未删除或纠正远端记录。写入数据直接取冻结 JSON rows，未添加 _openid / 时间戳 / owner / 测试主体／其它字段。ADMINONLY 设置并回查成功后才插入数据。

## schema / 索引 / ACL / 4 行完整 read-back

最终回查时间：2026-10-02 15:23:18 Asia/Shanghai；完整 read-back 为 93 个只读操作，无失败。

| 检查 | 实际结果 |
| --- | --- |
| 集合 | mapControlState exists=true；总 Count=4 |
| Schema | NoSQL 无固定表字段 schema；实际 4 个 document 的全部字段、类型、null、数值和嵌套对象与 frozen rows 完全一致，没有额外字段 |
| ACL | ADMINONLY；客户端不得直接读写 |
| 显式索引 | kind_expiry：kind ↑ / expiresAt ↑；unique=false，sparse=false，partial 空，无 expireAfterSeconds，即非 TTL |
| 平台自动索引 | _id_、_openid_1，随新集合自动产生；未调用额外索引创建／删除。这两个已计入远端 IndexCount=3 |
| READ_STOP | global:read-stop：kind=READ_STOP、stopped=true |
| READ_EPOCH | global:read-epoch：kind=READ_EPOCH、epoch=1、mutationRevision=0 |
| FEATURES | global:features：read/resolver/projector/owner/consent/report/haEnabled 全 false、haPaused=true |
| POLICY | global:policy：policyVersion=map-production-phase1-v1；projectionVersion=map-projection-phase1-v1；verificationVersion=verification-v2-10；resolverVersion=resolver-v2-11 |
| POLICY opportunity | opportunity-20260930-v1；lastMaxRemaining=12、grandMinRemaining=3、highGrandRatio=0.08、lowGrandRatio=0.03、splitMinRemaining=60 |
| POLICY freshness | freshness-production-v1；recentMaxAgeMs=3600000、agingMaxAgeMs=86400000 |
| POLICY binding | terms=null、ha=null、publicAvatarOrigins=[] |
| POLICY report | v2-21-report-policy-1；autoHideDistinctEligibleReports=10 |
| 精确行比对 | 4/4 PASS；按 _id 排序及递归 key 排序的紧凑 JSON SHA-256：c6c24b0613949a6f8ba392b07ed67f4b2aece3455f3c5ed8207e9e394021703e |

四行正文只按 4 个已授权 ID 读取，集合元数据总 Count=4 确认没有其它记录；没有扩展读取真实用户业务正文。expiresAt 未出现在这些冻结行中，不改为 TTL 或擅自补清理字段。上述初始化不能代替后续 policy／terms／HA 功能批准；全部服务关闭，没有消费者调用。

## V1_DIFF、shadow 与完整边界复核

| 范围 | 结果与证据边界 |
| --- | --- |
| V1 collections / indexes / ACL | 13 / 43 / 13，结构配置 diff=0 |
| V1 functions | 19 个完整 stable config SHA diff=0；包含 Environment 值哈希、trigger、layer、entry source／配置元数据，排除 API RequestId |
| 既有全部资源 | 26 集合索引／ACL、28 个函数配置及名称均未变；集合列表只增加 mapControlState，总数 27 |
| Storage / rules / environment | 2 项存储对象元数据哈希、存储规则、函数环境规则、环境后端／区域／资源配置 pre/post 一致 |
| business-volume metadata | Count/Size 仅记录，不作为一般 hard stop；本次新基线 → pre → post 无变化，未发现异常减少 |
| shadow | read-stop=true / HA pause=true / read-epoch=41 / PUBLIC=0；默认关闭状态未变 |
| 新 production control | epoch=1，独立于 shadow epoch41；没有修改旧控制集合 |
| 本地 V1／冻结核心 | 未改生产代码、客户端、TASK01—20 核心合同或旧交付文件 |
| 部署／secret／业务数据 | 0 / 0 / 0 |

完整稳定函数配置使用原基线算法：仅排除 API RequestId，顶层 key 排序后 JSON SHA-256；不采用递归排序假称与旧完整配置 hash 相等。实际 28 函数 pre/post SHA 全一致；没有打印原始 Environment／CodeInfo。没有下载远端完整 ZIP，不把配置／entry SHA 比对写成远端全包字节或真机行为验收。未运行新的业务功能、真实设备验收或费用负载测量。

证据：[batch-a-control-only-preflight.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/batch-a-control-only-preflight.json>)（Founder 新基线）、[batch-a-control-only-resume-preflight.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/batch-a-control-only-resume-preflight.json>)、[batch-a-control-only-readback.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/batch-a-control-only-readback.json>)、[batch-a-control-only-comparison.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/batch-a-control-only-comparison.json>)。

## 密钥事件与未执行动作

先行安全报告确认：既有密钥明文曾输出；13 个既有消费者使用相同键；直接轮换会改变 identityId，现有代码缺少新旧兼容，wechatIdentities.accountId unique 又限制简单双 mapping，故不能仅改环境变量。密钥本轮未改；事故仍未修复，不能把本批操作 PASS 写成该事件已解决或 PRIVATE_LEAKAGE=0。

本批不存在函数／secret／身份映射／Account／Profile／版面／PUBLIC 业务写入，也没有 9 production 函数部署、其它 13 production 集合创建、服务开启、源迁移、清理、NETWORK、50／300、Phase2、Git commit/push/PR/merge/tag 或微信发布。此前初次检查的工具输出事件保留，当前报告和新证据不保存任何密钥明文。

## 治理、验证、回滚与停止点

同步 architecture / progress / implementation-plan / tech-stack 当前状态，原历史报告和 frozen batch 不改。文档治理完成前运行 workflow 与 git diff --check；本轮只有授权云操作与报告／状态更新，未改应用代码，不将上一轮 1140 PASS／Playwright26 当作本轮新运行结果。

仅本批 control resource 已应用；其余资源和 9 包仍 CLOUD_NOT_APPLIED / PRODUCTION_NOT_ACTIVE。总体 TASK22 仍 IN_PROGRESS / PHASE_1_PRODUCTION_BACKEND_CONVERGENCE_IMPLEMENTED / LOCAL_GATES_PASS / EXTERNAL_ACTION_APPROVAL_REQUIRED；子状态 PHASE1_A_CONTROL_ONLY_APPLIED_READBACK_PASS。没有 TASK22 COMPLETE / HUMAN_APPROVED / Phase2 解锁。

本轮未执行 rollback。按 frozen runbook，未来只有另获授权且确认新增集合仍只有这 4 条原始关闭状态、没有消费者或其它数据时，才可考虑删除新增集合；否则保持关闭并 STOP。不得动 V1 / shadow，不擅自删除或修改本次 control rows。

下一停止点：等待 Founder 独立决定其它资源批次及密钥兼容迁移的处理；没有自动解锁或请求打包扩大授权。

最终本地交付校验：workflow PASS（8 required files）、git diff --check PASS；728个既有文件保护比较仅4份canonical状态文件变化，V1/client/core diff0；frozen batch/proposal/9 ZIP SHA未变；新报告及证据实际密钥值扫描PASS。前两次扫描的长输出超出长度限制，未将截断结果作为PASS，已逐文件分段完整重查；分段保留足够重叠避免漏掉跨段密钥。校验依据：[batch-a-control-only-apply-local-verification.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/batch-a-control-only-apply-local-verification.json>)。
