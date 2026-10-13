# Phase1-B｜Exact Diff（无 Production Code/Resource Change）

> 2026-10-02 Founder 决策更新：本报告为决策前历史审计／草案，`HISTORICAL / NOT_EXECUTABLE`。当前为 `RISK_ACCEPTED_BY_FOUNDER / SECRET_UNCHANGED / ROTATION_WAIVED`，rotation blocker=`CLOSED_BY_FOUNDER_WAIVER`。停止轮换、dual-key、lazy migration、identity alias 与历史身份迁移；继续旧密钥，暴露仍 CONFIRMED，事件未修复。下文 STOP、待决策、路线建议、ROTATION_REMEDIATION=IN_PROGRESS 仅描述当时状态，不是当前门禁或执行授权。当前结论见 [v2-e-task-22-phase1b-founder-risk-acceptance-closeout.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1b-founder-risk-acceptance-closeout.md>)。

实际CODE diff：生产身份代码0；仅新增offline feasibility分析脚本、报告、证据与4份canonical状态。函数deploy=0，DB/index/config/secret/identity writes=0。

待决方向而非冻结方案：新增wechatIdentityAliases ADMINONLY，_id绑定version+current digest→canonical identity primary/原Account，拟非唯一accountId索引用于删除cleanup；原wechatIdentities.accountId unique绝不drop/alter。当前没有建立/实现该集合或schema。

拟current/previous key version/mode/migration window只为placeholder合同，不填value/hash；消费者为矩阵13 caller + retry-deletions，以及9待部署V2入口。13caller都需统一解析，retry-deletions需确保alias不会悬空；builder17 generated/2 standalone复制shared的实际包列表需在方案批准后逐包确认，不能先冻结不存在的新包。

迁移拟写仅私有alias，不建新Account/ICHI ID/Profile、不改owner/quota/role，基于可信回访，一次一identity、exact-version、同事务唯一binding冲突拒绝；bounded job不能从旧摘要批量制造新映射。R6后必须用兼容回滚包，原legacy包禁用；否则会破坏已迁移用户。

本轮不存在可以批准部署的13 function ZIP/source manifest；实际deploy exact diff保持NONE。其它13production集合/9V2部署/Phase2仍未解锁。
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
