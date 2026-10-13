# TASK22 Phase1-B｜Founder 风险接受与轮换豁免决策收口

日期：2026-10-02（Asia/Shanghai）。授权来源：本会话 Founder 明确决策，随后指令从断点继续。本决策覆盖此前 Phase1-B Markdown 总命令中的轮换实现要求；不授权新的云端动作。

## 决策与关闭方式

`RISK_ACCEPTED_BY_FOUNDER / SECRET_UNCHANGED / ROTATION_WAIVED`。

Founder 停止 IDENTITY_HMAC_KEY 轮换方案，继续当前旧密钥；不实施 dual-key、lazy migration、identity alias 或历史身份迁移，不因此创建新 Account、修改 wechatIdentities schema/index 或改变 V1 身份语义。Phase1-B rotation blocker 以 `CLOSED_BY_FOUNDER_WAIVER` 关闭，离线身份／旧键退出政策不再是当前 Phase1 门禁。

明文输出事件仍为 `IDENTITY_HMAC_KEY_TOOL_OUTPUT_EXPOSURE=CONFIRMED`；`SECRET_UNCHANGED`、`OLD_KEY_STILL_ACTIVE=true`、`SECURITY_INCIDENT_REMEDIATED=false`。Founder 接受了暴露后继续使用旧密钥的残留风险。该决定没有使已暴露密钥重新保密，也没有形成轮换或技术修复证据；不得写成“安全事件已修复”、PRIVATE_LEAKAGE=0 或 rotation remediation PASS。本报告不保存密钥值或新增真实密钥摘要。

## 本地收口结果

Phase1-B 此前在审计阶段 STOP：未实现 production 身份兼容代码、未生成新函数 ZIP、未生成新密钥、未做身份迁移。本次没有代码需要回滚。既有单密钥 V1 身份映射、accountId unique、Account/ICHI ID/Profile/ownership/quota/role/delete 合同保持原样。

四份事实源已更新当前决策、唯一活动工作集和外部门：

- [implementation-plan.md](</Users/cunfu/Documents/ichi 2/memory-bank/implementation-plan.md>)：移除当前轮换／迁移执行要求，恢复 TASK22 Phase1 正常路线及下一批独立授权门。
- [progress.md](</Users/cunfu/Documents/ichi 2/memory-bank/progress.md>)：记录风险接受、豁免关闭、执行边界与历史证据。
- [architecture.md](</Users/cunfu/Documents/ichi 2/memory-bank/architecture.md>)：确认既有单密钥身份链路及 schema/index/身份语义未变。
- [tech-stack.md](</Users/cunfu/Documents/ichi 2/memory-bank/tech-stack.md>)：继续旧密钥，不引入 dual-key、alias 或迁移机制。

七份 Phase1-B 审计报告均增加历史／不可执行标识；原报告正文与审计证据保留，旧 STOP 和路线建议不再是当前门禁。fixture 可行性脚本及 analysis manifest 只保留为历史分析；不得作为继续轮换或可部署候选使用。Phase1-B 为决策豁免收口，不能称为 PHASE1_B_IMPLEMENTED 或 Phase1-B LOCAL_GATES_PASS。

## TASK22 恢复路线与停止点

当前唯一活动区块 V2-E / IN_PROGRESS，唯一工作集 TASK22 Phase1。总体门为 `IN_PROGRESS / PHASE_1_PRODUCTION_BACKEND_CONVERGENCE_IMPLEMENTED / LOCAL_GATES_PASS / EXTERNAL_ACTION_APPROVAL_REQUIRED`；LOCAL_GATES_PASS 沿用此前 Phase1 本地实现，非本次轮换实现验收。Phase1-B blocker 已关闭，TASK22 整体仍未完成或人工验收。

Phase1-A 的 mapControlState / ADMINONLY / kind_expiry 非 TTL 索引 / 4 条冻结安全控制行已应用并完整回查通过。冻结 batch SHA-256 `3b8978d8007bc16c8f822462c4ced8e3bcd198024f54f832b62b77bd11848813` 的授权已消费，其原 JSON 字节保留，禁止重跑、覆盖或把本次恢复指令当成再次 apply 许可。其余 13 个 production 集合和 9 个 production 函数仍未应用／部署，PRODUCTION_NOT_ACTIVE。

下一执行点是准备／审核其余 production 外部批次的精确 diff、冻结产物与回滚边界，并等待独立授权。本次不执行 CloudBase 写入、secret 变更、函数部署、业务／身份写入或服务开启；不进入 Phase2、NETWORK 或 50 条采集。未来如批准外部动作，仍须重新只读 preflight：正常 V1 Count/Size 为记录项；collection/index/ACL/function stable config/trigger/layer/Storage/rules 等结构配置及异常删除／突变为 hard stop。15:09 基线规则不等于免除未来 preflight。

## 验证与证据边界

本次 cloud reads/writes=0，secret 操作=0，function deployments=0，business/identity writes=0，production code changes=0，Git commit/push=0。没有新 live 状态证明；云端事实引用此前证据：

- [Phase1-A apply/read-back](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1-batch-a-control-only-apply-readback.md>)：2026-10-02 15:23:18 完整 93 次只读回查；4/4 控制行一致，V1 结构配置 diff=0，shadow 停读／HA pause／epoch41／PUBLIC0。
- [Phase1-B preflight](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1b/live-preflight.json>) 与 [postflight](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1b/live-postflight.json>)：此前审计前后结构 diff=0、控制资源保持；未实施轮换。
- [机器可读决策](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1b/founder-risk-acceptance-decision.json>)：本次当前授权、风险和门禁事实。

本次本地治理校验 PASS：工作流校验（8 份必需文件）、diff-check、四份事实源当前状态一致性、七份历史报告标识及独立报告链接检查。817 个受保护本地文件中仅四份指定事实源变化，生产源与 design-document 未变；首批冻结 JSON 的 SHA 和 9 个函数 ZIP SHA 全部保持一致。[独立本地验证记录](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1b/founder-decision-local-verification.json>)。此前 65 项 V1 身份测试及完整 Phase1 回归仅作为历史证据；本次文档收口不冒充新代码回归或事故修复验证。
