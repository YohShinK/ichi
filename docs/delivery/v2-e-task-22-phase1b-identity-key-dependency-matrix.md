# Phase1-B｜完整 Identity Dependency Matrix（审计完成、实现停门）

> 2026-10-02 Founder 决策更新：本报告为决策前历史审计／草案，`HISTORICAL / NOT_EXECUTABLE`。当前为 `RISK_ACCEPTED_BY_FOUNDER / SECRET_UNCHANGED / ROTATION_WAIVED`，rotation blocker=`CLOSED_BY_FOUNDER_WAIVER`。停止轮换、dual-key、lazy migration、identity alias 与历史身份迁移；继续旧密钥，暴露仍 CONFIRMED，事件未修复。下文 STOP、待决策、路线建议、ROTATION_REMEDIATION=IN_PROGRESS 仅描述当时状态，不是当前门禁或执行授权。当前结论见 [v2-e-task-22-phase1b-founder-risk-acceptance-closeout.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1b-founder-risk-acceptance-closeout.md>)。

| consumer | current key | current lookup rule | reads/writes identities | creates Account | identityId as _id | identityId elsewhere | mixed-version risk | rotation requirement | rollback requirement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assign-special-ichi-id | IDENTITY_HMAC_KEY（value不记录） | WXContext→HMAC→shared accountForCaller/bootstrap | 读 | 否 | 是，查找key | 无其它持久用途；Account承载ownership | new key miss；bootstrap split / others ACCOUNT_REQUIRED | 共用版本化解析；bootstrap旧映射优先不建第二Account | 迁移期保留旧primary；R6后只兼容包 |
| bind-wechat-profile | IDENTITY_HMAC_KEY（value不记录） | WXContext→HMAC→shared accountForCaller/bootstrap | 读 | 否 | 是，查找key | 无其它持久用途；Account承载ownership | new key miss；bootstrap split / others ACCOUNT_REQUIRED | 共用版本化解析；bootstrap旧映射优先不建第二Account | 迁移期保留旧primary；R6后只兼容包 |
| bootstrap-account | IDENTITY_HMAC_KEY（value不记录） | WXContext→HMAC→shared accountForCaller/bootstrap | 读/创建 | 是 | 是，查找key/创建primary | 无其它持久用途；Account承载ownership | new key miss；bootstrap split / others ACCOUNT_REQUIRED | 共用版本化解析；bootstrap旧映射优先不建第二Account | 迁移期保留旧primary；R6后只兼容包 |
| delete-my-account | IDENTITY_HMAC_KEY（value不记录） | WXContext→HMAC→shared accountForCaller/bootstrap | 读 | 否 | 是，查找key | 无其它持久用途；Account承载ownership | new key miss；bootstrap split / others ACCOUNT_REQUIRED | 共用版本化解析；bootstrap旧映射优先不建第二Account | 迁移期保留旧primary；R6后只兼容包 |
| delete-my-record | IDENTITY_HMAC_KEY（value不记录） | WXContext→HMAC→shared accountForCaller/bootstrap | 读 | 否 | 是，查找key | 无其它持久用途；Account承载ownership | new key miss；bootstrap split / others ACCOUNT_REQUIRED | 共用版本化解析；bootstrap旧映射优先不建第二Account | 迁移期保留旧primary；R6后只兼容包 |
| finalize-board-observation | IDENTITY_HMAC_KEY（value不记录） | WXContext→HMAC→shared accountForCaller/bootstrap | 读 | 否 | 是，查找key | 无其它持久用途；Account承载ownership | new key miss；bootstrap split / others ACCOUNT_REQUIRED | 共用版本化解析；bootstrap旧映射优先不建第二Account | 迁移期保留旧primary；R6后只兼容包 |
| finalize-draw-update | IDENTITY_HMAC_KEY（value不记录） | WXContext→HMAC→shared accountForCaller/bootstrap | 读 | 否 | 是，查找key | 无其它持久用途；Account承载ownership | new key miss；bootstrap split / others ACCOUNT_REQUIRED | 共用版本化解析；bootstrap旧映射优先不建第二Account | 迁移期保留旧primary；R6后只兼容包 |
| get-my-profile | IDENTITY_HMAC_KEY（value不记录） | WXContext→HMAC→shared accountForCaller/bootstrap | 读 | 否 | 是，查找key | 无其它持久用途；Account承载ownership | new key miss；bootstrap split / others ACCOUNT_REQUIRED | 共用版本化解析；bootstrap旧映射优先不建第二Account | 迁移期保留旧primary；R6后只兼容包 |
| get-my-records | IDENTITY_HMAC_KEY（value不记录） | WXContext→HMAC→shared accountForCaller/bootstrap | 读 | 否 | 是，查找key | 无其它持久用途；Account承载ownership | new key miss；bootstrap split / others ACCOUNT_REQUIRED | 共用版本化解析；bootstrap旧映射优先不建第二Account | 迁移期保留旧primary；R6后只兼容包 |
| get-quota-status | IDENTITY_HMAC_KEY（value不记录） | WXContext→HMAC→shared accountForCaller/bootstrap | 读 | 否 | 是，查找key | 无其它持久用途；Account承载ownership | new key miss；bootstrap split / others ACCOUNT_REQUIRED | 共用版本化解析；bootstrap旧映射优先不建第二Account | 迁移期保留旧primary；R6后只兼容包 |
| get-recognition-job | IDENTITY_HMAC_KEY（value不记录） | WXContext→HMAC→shared accountForCaller/bootstrap | 读 | 否 | 是，查找key | 无其它持久用途；Account承载ownership | new key miss；bootstrap split / others ACCOUNT_REQUIRED | 共用版本化解析；bootstrap旧映射优先不建第二Account | 迁移期保留旧primary；R6后只兼容包 |
| recognize-draw-tickets | IDENTITY_HMAC_KEY（value不记录） | WXContext→HMAC→verify-prize直接get | 读 | 否 | 是，查找key | 无其它持久用途；Account承载ownership | new key miss；bootstrap split / others ACCOUNT_REQUIRED | 共用版本化解析；bootstrap旧映射优先不建第二Account | 迁移期保留旧primary；R6后只兼容包 |
| reserve-recognition | IDENTITY_HMAC_KEY（value不记录） | WXContext→HMAC→shared accountForCaller/bootstrap | 读 | 否 | 是，查找key | 无其它持久用途；Account承载ownership | new key miss；bootstrap split / others ACCOUNT_REQUIRED | 共用版本化解析；bootstrap旧映射优先不建第二Account | 迁移期保留旧primary；R6后只兼容包 |
| prepare-v2-backfill | 无同名key binding | shared/domain间接import；不直接HMAC认证 | 无直接caller lookup | 否 | 无直接HMAClookup | Account关联／维护路径 | 依赖被复制helper，不能误认全部无间接依赖 | 打包import扫描/最小回归 | 按实际依赖基线 |
| recognize-board | 无同名key binding | shared/domain间接import；不直接HMAC认证 | 无直接caller lookup | 否 | 无直接HMAClookup | Account关联／维护路径 | 依赖被复制helper，不能误认全部无间接依赖 | 打包import扫描/最小回归 | 按实际依赖基线 |
| reconcile-stuck-jobs | 无同名key binding | shared/domain间接import；不直接HMAC认证 | 无直接caller lookup | 否 | 无直接HMAClookup | Account关联／维护路径 | 依赖被复制helper，不能误认全部无间接依赖 | 打包import扫描/最小回归 | 按实际依赖基线 |
| release-recognition | 无同名key binding | shared/domain间接import；不直接HMAC认证 | 无直接caller lookup | 否 | 无直接HMAClookup | Account关联／维护路径 | 依赖被复制helper，不能误认全部无间接依赖 | 打包import扫描/最小回归 | 按实际依赖基线 |
| release-stuck-reservations | 无同名key binding | shared/domain间接import；不直接HMAC认证 | 无直接caller lookup | 否 | 无直接HMAClookup | Account关联／维护路径 | 依赖被复制helper，不能误认全部无间接依赖 | 打包import扫描/最小回归 | 按实际依赖基线 |
| retry-deletions | 无同名key binding | shared/domain间接import；按Account清理identities | 删除mapping | 否 | 无直接HMAClookup | Account关联／维护路径 | 新alias若未清理会dangling | retry-deletions须纳入alias生命周期 | 与alias cleanup一致 |
| v2-shadow-answer-assistance | 无同名key binding | 独立shadow runtime/authority；不使用V1 IDENTITY_HMAC_KEY | 无直接caller lookup | 否 | 无直接HMAClookup | Account关联／维护路径 | 独立authority/test边界；当前关闭 | 打包import扫描/最小回归 | 按实际依赖基线 |
| v2-shadow-get-my-assistance | 无同名key binding | 独立shadow runtime/authority；不使用V1 IDENTITY_HMAC_KEY | 无直接caller lookup | 否 | 无直接HMAClookup | Account关联／维护路径 | 独立authority/test边界；当前关闭 | 打包import扫描/最小回归 | 按实际依赖基线 |
| v2-shadow-get-public-map-lead-detail | 无同名key binding | 独立shadow runtime/authority；不使用V1 IDENTITY_HMAC_KEY | 无直接caller lookup | 否 | 无直接HMAClookup | Account关联／维护路径 | 独立authority/test边界；当前关闭 | 打包import扫描/最小回归 | 按实际依赖基线 |
| v2-shadow-manage-contribution | 无同名key binding | 独立shadow runtime/authority；不使用V1 IDENTITY_HMAC_KEY | 无直接caller lookup | 否 | 无直接HMAClookup | Account关联／维护路径 | 独立authority/test边界；当前关闭 | 打包import扫描/最小回归 | 按实际依赖基线 |
| v2-shadow-query-public-map-leads | 无同名key binding | 独立shadow runtime/authority；不使用V1 IDENTITY_HMAC_KEY | 无直接caller lookup | 否 | 无直接HMAClookup | Account关联／维护路径 | 独立authority/test边界；当前关闭 | 打包import扫描/最小回归 | 按实际依赖基线 |
| v2-shadow-reconcile-projection | 无同名key binding | 独立shadow runtime/authority；不使用V1 IDENTITY_HMAC_KEY | 无直接caller lookup | 否 | 无直接HMAClookup | Account关联／维护路径 | 独立authority/test边界；当前关闭 | 打包import扫描/最小回归 | 按实际依赖基线 |
| v2-shadow-report-public-map-lead | 无同名key binding | 独立shadow runtime/authority；不使用V1 IDENTITY_HMAC_KEY | 无直接caller lookup | 否 | 无直接HMAClookup | Account关联／维护路径 | 独立authority/test边界；当前关闭 | 打包import扫描/最小回归 | 按实际依赖基线 |
| v2-shadow-resolve-observation | 无同名key binding | 独立shadow runtime/authority；不使用V1 IDENTITY_HMAC_KEY | 无直接caller lookup | 否 | 无直接HMAClookup | Account关联／维护路径 | 独立authority/test边界；当前关闭 | 打包import扫描/最小回归 | 按实际依赖基线 |
| v2-shadow-submit-candidate-upload | 无同名key binding | 独立shadow runtime/authority；不使用V1 IDENTITY_HMAC_KEY | 无直接caller lookup | 否 | 无直接HMAClookup | Account关联／维护路径 | 独立authority/test边界；当前关闭 | 打包import扫描/最小回归 | 按实际依赖基线 |
| shared hashIdentity | 继承原绑定 | 纯helper | 无DB | 否 | 输出lookup digest | 不公开；算法不是可逆加密 | 不可混用身份namespace | 统一兼容解析／Account不变 | 保持原Account及最低兼容代码 |
| trustedIdentity | 继承原绑定 | 读取WXContext与key | 间接读mapping | 否 | identity.identityId | openId只在请求内用于msgSecCheck，不落映射 | 不可混用身份namespace | 统一兼容解析／Account不变 | 保持原Account及最低兼容代码 |
| accountForCaller | 继承原绑定 | mapping.accountId→active Account | 读 | 否 | doc.get | 返回Account authority | 不可混用身份namespace | 统一兼容解析／Account不变 | 保持原Account及最低兼容代码 |
| bootstrap create path | 继承原绑定 | legacy miss就创建 | 读/写 | 是 | primary _id | 新号/Profile/ICHI ID风险源 | 不可混用身份namespace | 统一兼容解析／Account不变 | 保持原Account及最低兼容代码 |
| profile path | 继承原绑定 | get-my-profile/bind-wechat-profile | 读 | 否 | 间接 | msgSecCheck使用可信OPENID；绝不存原始身份作迁移依据 | 不可混用身份namespace | 统一兼容解析／Account不变 | 保持原Account及最低兼容代码 |
| quota path | 继承原绑定 | get-quota-status/reserve-recognition | 读 | 否 | 间接 | quota/idempotency以Account为主 | 不可混用身份namespace | 统一兼容解析／Account不变 | 保持原Account及最低兼容代码 |
| special ICHI ID path | 继承原绑定 | assign-special-ichi-id | 读 | 否 | 间接 | server role+Account不变 | 不可混用身份namespace | 统一兼容解析／Account不变 | 保持原Account及最低兼容代码 |
| delete path | 继承原绑定 | delete-my-account + retry-deletions | 读/后续删除 | 否 | cleanup按accountId查询 | scheduled消费者无key也必须计入 | 不可混用身份namespace | 统一兼容解析／Account不变 | 保持原Account及最低兼容代码 |
| verify-prize recognition | 继承原绑定 | standalone verify-prize-tickets→recognize-draw-tickets | 直接get | 否 | 是 | 双身份owner校验需同一Account | 不可混用身份namespace | 统一兼容解析／Account不变 | 保持原Account及最低兼容代码 |
| V2 trustedAccount/shared runtime | legacy shared key；V2另有独立authority key | V1 identity key + separate authority key | doc.get only | 否 | 是 | 9待部署入口；V1仅get的capability边界 | 不可混用身份namespace | 统一兼容解析／Account不变 | 保持原Account及最低兼容代码 |
| future PLAYER bridge | 继承原绑定 | 规划Account authority | 未实现 | 否 | 待冻结 | 不得在本轮实施bridge | 不可混用身份namespace | 统一兼容解析／Account不变 | 保持原Account及最低兼容代码 |
| owner/contribution/consent/report/HA | 继承原绑定 | V2 trustedAccount + policy | 当前candidate get | 否 | 间接 | owner digest/角色/举报资格基于Account，不改ownership | 不可混用身份namespace | 统一兼容解析／Account不变 | 保持原Account及最低兼容代码 |

13个直接消费者之外，retry-deletions必须计入未来别名清理；builder会复制shared到17 generated + 2 standalone包。仅统计13个env key会漏掉该间接依赖。3条最小shape样本为accountId/appId string、keyVersion未出现；不能据此证明所有历史行都相同。live accountId unique确认，不能直接创建两条同Account primary。
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
