# Phase1-B｜Rotation State Machine 与未决退出门

> 2026-10-02 Founder 决策更新：本报告为决策前历史审计／草案，`HISTORICAL / NOT_EXECUTABLE`。当前为 `RISK_ACCEPTED_BY_FOUNDER / SECRET_UNCHANGED / ROTATION_WAIVED`，rotation blocker=`CLOSED_BY_FOUNDER_WAIVER`。停止轮换、dual-key、lazy migration、identity alias 与历史身份迁移；继续旧密钥，暴露仍 CONFIRMED，事件未修复。下文 STOP、待决策、路线建议、ROTATION_REMEDIATION=IN_PROGRESS 仅描述当时状态，不是当前门禁或执行授权。当前结论见 [v2-e-task-22-phase1b-founder-risk-acceptance-closeout.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1b-founder-risk-acceptance-closeout.md>)。

方案状态：DRAFT / BLOCKED，尚未冻结或实施。

| route | compatibility | schema/index impact | mixed deployment | offline users | fresh users | duplicate risk | rollback | old-key exit | complexity |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A dual-read | 有旧键时可找原Account | 同表双primary违反accountId unique；不写双primary可只读 | 旧primary保留则安全 | 离线保留旧fallback | fresh仍以old primary | 误将new miss当fresh可split | 旧映射保留可回滚 | 需要覆盖库存，不能直接退出 | 中 |
| B trusted revisit | 回访用户可以迁移 | 必须决定alias/primary方案 | 配合旧primary可保持 | 不回访者没有新digest | 兼容期fresh必须原namespace | 若offline没alias而退出则split/拒绝登录 | 部分迁移需保留原映射 | 未知回访时间，退出不保证有界 | 中 |
| C separate alias/version | 可保留单一canonical Account | 新增ADMINONLY alias集合/索引；不drop原unique | dual期fresh保留旧primary可兼容 | 仍须回访或其它可信恢复 | R6后fresh用current mapping | 覆盖验证/冲突拒绝可控制 | R6后不能回到不懂alias旧包 | pending=0 + writer fence才能退出 | 较高 |
| D single-doc rename | 迁移后Account可相同 | 同表delete旧doc+create新doc | 旧代码查old digest失败 | 没回访不能生成new digest | 混合namespace不安全 | 旧bootstrap可新建第二Account | partial后旧包无法访问已改名primary | 不解决离线库存 | 高/不选 |
| E 保存OPENID/恢复标识 | 可能提供不同恢复索引 | 改变身份隐私/数据合同 | 必须单独设计 | 可改变离线恢复能力 | 须重新验证 | 不得从HMAC逆推/猜测 | 取决于新合同 | 需独立产品/隐私批准 | 超出本命令 |

条件性最小方向是C+B：新增私有alias而保留原primary与unique。它可以在“所有历史身份实际迁移”后退出旧键；它不是保证永不回访者仍能在旧键退出后无损识别的方案。本轮没有把这个未确认前提代替命令中的旧键最终退出目标。

| stage | precondition | allowed future writes | read-back | failure | rollback | next gate |
| --- | --- | --- | --- | --- | --- | --- |
| R0 | 当前single key/mapping | 无新写 | 现状baseline | 保持原code/key | 当前无需rollback | 只读设计 |
| R1 | 退出政策先明确；兼容代码本地验证 | 以后另批兼容部署，旧key current不变 | 至少13 caller + deletion维护包SHA一致 | 未齐全保持旧行为 | 回原包/key，不写alias | R2单独批准 |
| R2 | 全部消费者/最低回滚版本兼容 | 另批alias资源/控制；原unique不变 | 所有资源/ACL/版本/清理支持确认 | 缺消费者STOP | 保持old mapping并停alias写 | R3单独secret批准 |
| R3 | 资源与代码已验收，新key独立生成/绑定 | 另批dual config；旧key保留 | current/previous versions/窗口精确匹配 | missing/invalid/conflict fail closed | 撤dual使用旧primary，保留alias证据 | R4 migration另批 |
| R4 | 可信真实WXContext revisits | 另批bounded、幂等alias写；一次/一身份 | 逐一alias→原Account→ownership | 失败事务撤回，不bootstrap第二Account | 停止alias写，旧primary不变 | R5覆盖证明 |
| R5 | 全库存与新写屏障可证 | 无自动批量身份迁移 | 不仅counts，要逐identity正确覆盖；含删除状态 | 任何offline pending阻止R6 | 回dual兼容版，旧key保留 | Founder确认R6前置口径 |
| R6 | pending=0、无legacy实例、新代码写屏障、回滚版本冻结 | 另批旧key撤出/current-only | 所有消费者与future V2同Account | 不能用时间到期替代覆盖；禁止漏人 | 只能兼容包；原legacy包被禁止 | 独立实际old-key-exit验收 |

本报告将命令的“old key最终可以退出”保守解释为不能悄悄降级为可能永久保留暴露密钥。若Founder接受R6覆盖完备门、允许未回访者导致退出无限期延迟，则该技术方向可继续本地实现；这里不是断言alias方案在所有条件下不可行。

没有原始输入时不能从HMAC旧摘要计算新摘要；现有映射写路径不存OPENID，受限live sample不增加身份恢复事实源。请求body身份字段不可信。[官方实例复用说明](https://docs.cloudbase.net/cloud-function/instance)要求注意混合来源残留WXContext，未来兼容代码仍须核实可信微信来源。
## 本轮执行记录与边界

- Pre-state：TASK22 IN_PROGRESS；Phase1-A control-only APPLIED_READBACK_PASS；9 production functions NOT_DEPLOYED；Phase2 NOT_STARTED。
- 批准来源：用户要求执行 Downloads 的 Phase1-B 总命令。只授权本地候选及云端只读；该命令第4/15节要求不能安全满足身份／旧键退出门时 STOP。
- 当前结果：STOP / IDENTITY_ROTATION_OFFLINE_EXIT_POLICY_DECISION_REQUIRED。方案未冻结、production compatibility implementation NOT_STARTED；不是 PHASE1_B_IMPLEMENTED / LOCAL_GATES_PASS。
- Files changed：`scripts/dry-run-v2-identity-rotation-feasibility.mjs`, `artifacts/task22/phase1b/**`, `docs/delivery/v2-e-task-22-phase1b-*.md`, `memory-bank/architecture.md`, `memory-bank/tech-stack.md`, `memory-bank/implementation-plan.md`, `memory-bank/progress.md`；生产 runtime/domain/13 functions/V2 security、客户端、Account/ICHI ID/Profile/ownership/quota/role/delete合同保持原字节。
- Implementation：仅只读依赖审计、路线评估、12项fixture反例／条件门演示，未实现迁移、双键或新身份集合。
- Tests：本轮原V1 identity相关3个suite/65 tests PASS；offline feasibility12项确认；新分析脚本 ESLint与格式检查PASS；workflow/diff-check在交付前执行。原有full Vitest/TS/contracts/Next/Web Playwright/微信preview/package audit不作为本轮通过结果；生产代码方案在冻结前已触发STOP，完整候选回归NOT_RUN。
- Failures/fixes：第一次比较mapControlState时从旧26集合字段读取基线而非baseline.target，出现两个比较器假阳性；修正基线路径后实际结构diff0，未作为真实cloud变更。不是生产功能缺陷修复。官方transaction文档本次联网读取超时，未冒充新的live事务验证；本地反例不依赖该页面。
- Cloud actions：preflight92只读查询、postflight90只读查询，cloud writes=0；不调用生产函数，不生成/绑定/轮换secret，不改DB/index/schema/identity rows，不部署13V1或9V2函数，不改mapControlState，不做Phase2/NETWORK/50/300/Git/发布。
- V1 regression：19完整稳定函数配置、13集合/43索引/13ACL、既有27集合/28函数及Storage/rules前后无结构变化；业务Count/Size记录且本次无变化。受限真实document shape仅3条，projection排除_id/OPENID，只有accountId/appId/keyVersion，报告只保存存在性与类型，不保存值；不是全存量alias/keyVersion审计。
- Identity rows：Agent写入0；没有逐条真实identity内容hash/对比，不声称外部所有行内容没有变化；有限元数据与sample不能替代完整迁移库存证明。
- Secret handling：CURRENT_KEY_EXISTS=true；PREVIOUS_KEY_SUPPORT=NOT_IMPLEMENTED；NEW_KEY=NOT_GENERATED。只用固定fixture strings，本轮不新增任何真实key value/hash；配置一致性在工具内存用既有完整config摘要比较，仅落盘布尔匹配。暴露=CONFIRMED、ROTATION_REMEDIATION=IN_PROGRESS、SECRET_UNCHANGED、OLD_KEY_STILL_ACTIVE。禁止写事故已解决或PRIVATE_LEAKAGE=0。
- Rollback：本轮无部署/数据迁移，线上无需回滚。本地只有新增分析文件与治理状态；保留全部用户既有dirty工作树。未来R6后原legacy包不能作为通用回滚包，需最低兼容版本另审。
- Git state：feature/v2-board-map @ 929d189a06e13010e50abf4927bfec3b1ebd49fc；未commit/push/PR/merge/tag。
- Current gate：TASK22 IN_PROGRESS / PHASE1_B_DESIGN_AUDIT_STOPPED / IDENTITY_ROTATION_OFFLINE_EXIT_POLICY_DECISION_REQUIRED；Phase1-A保持APPLIED_READBACK_PASS，Phase2 LOCKED。
- Next Founder decision：确认离线／未回访用户与old-key退出的口径。建议允许新增私有alias路线，并以“全部历史身份逐条覆盖且写入屏障成立”作为R6不可绕过的前置门；未回访者存在则继续保留旧键且不能承诺退出日期。若必须有界退出，需要另批准可靠恢复通道或产品身份合同修订，不能靠新建Account解决。此项是方案安全目标的决策，不是本轮云端执行授权。
- Evidence：[live-preflight.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1b/live-preflight.json>)、[live-postflight.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1b/live-postflight.json>)、[identity-feasibility-dry-run.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1b/identity-feasibility-dry-run.json>)、[v1-identity-baseline-regression.log](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1b/v1-identity-baseline-regression.log>)。
