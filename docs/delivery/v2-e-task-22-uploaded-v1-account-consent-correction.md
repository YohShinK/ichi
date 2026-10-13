# TASK22：已上传 V1 的账号条例覆盖修正

> 本报告保留2026-10-03修正时点事实。v3范围仍现行；接受/真实批次/continuous的暂停状态已由2026-10-04恢复与实际验证取代，见[v3生产桥接与全局continuous收口](v2-e-task-22-production-bridge-live-and-continuous-closeout.md)。本报告的0真实迁移/未接受不代表当前状态；冻结证据不改写。

2026-10-03；唯一活动区块 V2-E。状态：`PRODUCTION_APPLIED / REAL_ISOLATED_SCOPE_SWEEP_AND_ADMISSION_VERIFIED / AWAITING_OWNER_V3_ACCEPT_AND_REAL_BATCH`。真实历史迁移与 continuous 仍按原断点暂停。

## 当前行为

服务器完成态“已上传”代表原上传已完成并表达分享确认。本人接受当前条例后，授权统一覆盖该账号此前及以后完成上传的记录。服务器通过持久账号扫描为合格来源派生 SHARE／rights／follow-current 权限，再以一个事务写入正式 V2 和 PublicMapLead；Marker 只取 V2。历史缺少逐条分享字段或原设备队列，不再是额外门槛；不伪造、补写旧 V1 的原始上传证明。

原先“必须原设备补送旧意图，否则历史已上传不能转换”的判断已纠正。设备队列仍可用于原上传溯源及兼容送达，不控制旧完成上传的准入。没有二次分享按钮、单独发布或 V2 二次授权。

“在 V1 表里”不等于完成上传：该表也含 private_saved、待核验及失败记录。服务器以 finalized direct / exact APPROVED draw 判定完成态。未完成、删除、注销及不满足位置／安全／有效性条件的输入保持排除。

## 正式应用

新版条例 `map-contribution-20261003-v3`，范围 `player-public-scope-20261003-v3`，明确“本人此前及以后完成上传、核验通过的记录”，并包含有权分享这些安全信息的确认。服务器绑定 `UPLOADED_V1_RECORDS` 与 rightsAttestation；客户端不能自报接受。旧 v2 正文没有这项全历史范围，既有同意没有被自动升级，仍由本人实际接受新版。

| 正式函数 | 应用文件数 | 增量 |
| --- | --- | --- |
| manage-map-contribution-consent | 19 | 当前 scope 接受与服务端范围标记 |
| process-map-source-bridge | 22 | 历史完成上传授权派生与公平账号扫描 |
| drain-map-source-bridge | 22 | 对应后端调度运行时 |

三个 ZIP 都以各自当前真实远端包为基线，逐文件源码与稳定配置回读通过；无关文件与关闭的旧 owner API 实现保持。正式政策只 CAS 修改 terms 并递增 epoch／mutationRevision；原控制、位置 0.001°／误差≤100米和删除保护不变。finalize-board-observation 8 文件与已关闭旧选择函数未再次覆盖。原资源、索引和冻结证据没有重做。

## 验证

- 本地完整回归 1239 PASS／1 个既有 SKIP；针对本次改动 112 PASS；类型、Lint、Next 构建通过。
- 实际 CloudBase 6 项通过：前置两条私有保存不阻塞历史上传；旧已上传没有逐条字段也被当前同意扫描入队；真实非空 drain→worker；V2 与 PUBLIC 投影原子提交；无需第二次分享；相同事件重放幂等。测试只使用隔离账号及来源，18 条自有合成数据清理完成，实际用户迁移 0，公开读始终关闭，处理控制已恢复暂停。
- 真实历史只读预览 26 条，其中 4 条 finalized direct 已完成上传，包括此前 3 条与 CUFZBP。当前实际账号尚未接受 v3，当前合格 0；假设本人明确接受当前范围并恢复批准的处理，4 条均通过完整 SOURCE／RESOLVE／PROJECT／原子准入并形成 PUBLIC 投影的只读内存预演，实际云写 0。另 22 条缺 exact APPROVED 完成依据，不冒充“已上传”。
- 实际微信 GET 返回当前 v3、accepted=false；条例状态 READY，CUFZBP 显示“已上传”，新正文第二条实际渲染。没有替真实用户调用 ACCEPT。
- 官方当前工作区小程序预览编译成功，993.0 KB；新版二维码与真实开发者工具截图保存于本轮证据目录。

## 全局同步与断点

AGENTS、README、PRD、五份 memory-bank 当前入口、现行合同及 Phase2 README 已同步账号覆盖范围。旧报告和旧规则标为历史／被替代，不能恢复旧门。工作流防回退检查全局覆盖声明、旧 UI／事件／选择接口、当前准入路径及持久扫描；包含故意恢复旧认知的失败回归。

正式共享范围已部署，但真实账号 v3 同意尚未取得；worker／drain／processor／公开读／timer 及四 V1 continuous producer 保持原暂停状态。此前 v2 的私有扫描工作不会被当成 v3 同意，恢复处理时按 scope 不匹配跳过。下一断点是本人接受当前条例，重新只读形成具体真实批次，按原批准门执行真实 V1→V2→Marker，之后开启 continuous。原设备補送不再是历史完成上传的必要断点。

本次没有真实用户 ACCEPT、实际用户迁移、微信正式发布、Git 提交或推送。Phase3／NETWORK 等后续能力不解锁。

证据：`artifacts/task22/phase2-uploaded-v1-consent/` 下 manifest、三部署回执、policy-repair、live-atomic-admission、history-preview-current、history-admission-what-if、wechat-ui-coverage-verification、wechat-preview-info 及 final-readback。最终工作流检查以 final-validation.json 为准。
