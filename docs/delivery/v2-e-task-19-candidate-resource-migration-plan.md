# TASK-V2-19｜Shadow candidate migration 与 rollback 计划

状态：`LOCAL_PLAN_ONLY / TASK_V2_19_EXTERNAL_ACTION_APPROVAL_REQUIRED`（2026-09-25）。Founder 已选择现有 `cloud1-d7gxqfwv783a1f131` 内的 V2 shadow isolation boundary；不创建第二环境。确切待批的9 collection／15索引／6函数／13配置键、用途与权限见 [`v2-e-task-19-shadow-resource-diff.md`](./v2-e-task-19-shadow-resource-diff.md) 和本地 `packages/v2-map/resources/cloudbase-shadow-resource-proposal.json`。D09 `cloudbase-resource-candidate.json` 仍是未应用逻辑基线，不可直接对 V1 环境 apply。

## 冻结的 V1 边界

CloudBase CLI 只读盘点发现现有13 collection、19 Active 函数，未发现 V2 shadow 名称。V1 collection、函数、索引、环境／函数配置、密钥、Storage、ACL、安全规则、触发器与真实业务记录全部不可作为本次 rehearsal 的读写目标。`cloudbaserc.json` 默认指向该环境，不能仅凭环境 ID 判定命令安全；每个未来 mutation 命令必须同时校验**资源名称属于 shadow allowlist 且此前不存在**。同环境共享配额／管理员能力造成的残余风险由 TASK-V2-19 负面、安全和 V1 回归门承担。

## 分阶段、分别授权的动作

1. **当前本地阶段（无云端写入）：** 用 synthetic fixture 跑 `dryRunPublicMapMigration` 和 domain→API→client／Human Assistance 合同；Human Assistance coverage correction 必须同时补齐上传成功态与「我的 → 我上传的版面」前端入口、本人状态／回答／跳过／过期测试，且只在候选测试身份和 synthetic request 下展示，不能向 V1 真实上传或线上列表注入问题。当前两处入口尚未实现。只输出聚合 reason/count，`mutationCount=0`，不包含 private rows。准备函数 artifact、静态 collection allowlist 和 SHA-256，但 artifact 尚未冻结。此阶段不修改小程序线上绑定。
2. **资源创建阶段（待首次具体授权）：** 在只读预检确认个人版9个新增 collection、15个索引和6函数的配额、Geo/unique 索引能力、远端 V1 ACL／规则、实际计费后，仅创建获批的空 shadow collection/index。每步读回名称、索引键、唯一性和 `ADMINONLY` 权限；任何 V1 名称或全局规则变化为停止条件。函数部署、secret 和开关不随集合批准自动获批。
3. **函数／配置阶段（另行授权）：** 六个新函数的 reviewed artifact、hash、runtime、函数级键名和所有值逐项批准后才部署。read/resolve/assistance/projector 默认 `false`，缺测试 caller digest、cursor/principal/rehearsal HMAC 或 HA policy 参数则 fail closed。HMAC 仅报告生成／存在／校验状态，不回显值；HA cooldown/budget 只设 `CANDIDATE_TEST_ONLY / PILOT_CALIBRATION_REQUIRED`，不冻结产品数值。不得覆盖环境级规则或既有 V1 函数配置。只读读回 artifact/hash、权限、键名、关闭态及 V1 前后对比。
4. **Synthetic rehearsal 数据阶段（另行授权）：** 只写 `v2ShadowSourceFixtures` 的本地生成 fixture 和九个 shadow collection 的派生行，不读取 V1 `observationCandidates`、`drawSubmissions`、`accounts` 等真实文档。按预先批准的 fixture ID／数量执行版面连续、同地不同板、双同款歧义、三类 Human answer、SKIP、预算／cooldown、late/stale、hide/delete/no-resurrection、`null != 0`、分页／密集点等矩阵。每次可重试操作使用固定 idempotency/version；输出 aggregate/hash，不打印私有事实或身份。
5. **候选 failure injection 与 rollback drill（各自另行授权）：** 在指定 synthetic fixture 上模拟部分失败、过期、双击、跨测试账号、权限拒绝、投影迟到和公开读取停止。先关闭全部 shadow 入口，停止 shadow projector，再仅隐藏 shadow serving row／失效 shadow snapshot，读回候选 fail-closed 与 V1 不变。不得停止整个环境或调用 V1 删除／恢复流程。

任一阶段失败或读回不一致即停在本阶段；后续阶段不自动解锁。TASK-V2-19 全部门通过后仍只能 `AWAITING_FOUNDER_REVIEW`，不能自动批准 V2-20。

## Rollback、cleanup 与长期身份

Rollback 的对象只限九个 `v2Shadow...` collection、六个 `v2-shadow-...` 函数及其**函数级**配置。操作顺序：关入口→停写入→hide-first→快照失效→只读核对；append-only association／Human evidence 不因错误回答而直接改写，no-resurrection tombstone 保留到获批保留期。禁止 `--all`、通配符删表、恢复整个数据库或改 V1 环境级安全规则。

Cleanup 不是 rollback 的隐含步骤，须另获批准。先盘点 synthetic 行数、待处理 outbox、保留期、审计／墓碑与费用；定点删 synthetic 行、shadow 索引／函数／collection，读回 shadow 名称消失并核对 V1 13 collection、19函数及其索引/配置/行为无变化。若 retention 或删除范围不确定，保持关闭态而不删除。

TASK-V2-22 的正式合并是另一次资源／数据／发布授权：新建正式资源和函数，从届时仍有效且获授权的 V1 record 按行重建，canary/read-back 后开启正式入口。Synthetic shadow 数据永不升格为正式记录，也不通过改名上线。TASK-V2-20/21 的真机、pilot、成本与人工门保持原顺序和标准。

## 成本与停止门

第二环境基础费为 **¥0**；但同环境新增9 collection、15显式索引、6函数及 synthetic 读写会占用 V1 共用配额，带来性能与可能计费风险。现有环境只读 `env usage/info` 提示“不处于资源点计费模式”，不能按[官网新资源点定价](https://cloudbase.cloud.tencent.com/pricing)计算本环境余量。[腾讯云配额制说明](https://cloud.tencent.com/document/product/876/39093)显示集合／容量与调用／计算资源有独立超限行为；实际套餐上限、剩余额度、按量开关和账单尚未读回。当前不承诺增量金额，不请求扩容或计费模式切换。资源配额或 V1 延迟无法证明安全时，不进入首次 mutation。

首次外部动作前必须提供：目标 env ID 和 `ap-shanghai`、精确 shadow 名单、将执行的命令／artifact hash、synthetic 数据数量上限、预期额外费用／超限停止阈值、V1 前后基线摘要、rollback 与 cleanup 命令及读回方式，然后由 Founder 对该动作单独批准。当前没有 CloudBase candidate mutation、生产 deploy、真实迁移、rollback mutation、commit 或 push。
