# TASK22：V2 准入即自动地图与生产接点收口

> 后续替代（2026-10-03）：本报告的实际源码/SDK回执保留追溯；v2条例范围、原设备补送前提及旧授权解释已由UPLOADED_V1_ACCOUNT_CONSENT_V1取代。当前规则是本人当前v3条例覆盖此前及以后完成上传记录；旧逐条字段缺失不再拦截。最新状态见memory-bank/progress.md顶部与docs/delivery/v2-e-task-22-uploaded-v1-account-consent-correction.md。

2026-10-03；唯一活动区块 V2-E。状态：`PRODUCTION_APPLIED / SYNTHETIC_LIVE_ADMISSION_AND_RPC_VERIFIED / AWAITING_DEVICE_INTENT_AND_REAL_BATCH`。这不是实际用户历史链路的 `LIVE_BRIDGE_VERIFIED`，没有开启 continuous 或正式微信发布。

## 最终行为

`原上传确认与核验 → V1 → 当前条例及全部准入条件 → V2 + 地图投影 → Marker`。

原上传确认取得分享意愿与有权分享的确认，V1 上传不依赖条例。账号同意条例后，可信 V1 来源在准入前完成来源、位置、安全、权限、当前性和实例关联判断。合格正式 V2 来源、实例、关联、贡献及 PublicMapLead 在一个 CloudBase 事务提交，进入 V2 后不再要求审核、逐条授权或发布操作。尚未满足准入条件的新输入留在 V1 或私有工作队列，不能先写正式 V2 再等待二审。任务表、控制表不是正式地图来源。

删除、注销、过期、失效和安全撤除继续自动传播。这些是数据生命周期维护，不是新增授权。本人记录只显示 V1“已上传”，Marker 只消费 V2 的安全投影。

## 已完成的生产修复

| 接点 | 结果 |
| --- | --- |
| 原子 V2 准入 | 私有预计算复用原算法，最终事务重验控制和逐文档读集，失败无半套正式 V2 |
| 条例接受 | 与真实 consent 同事务登记持久 CONSENT_EVENT；每次扫描两条本人记录，游标越过未通过或缺证明记录 |
| 原意愿迟到 | 按服务端 confirmedAt 幂等登记 UPLOAD_INTENT，重复送达不重复入队 |
| 既有已接受条例账号 | 补登记 1 个私有扫描任务；没有执行用户 ACCEPT，没有改写 consent，没有迁移来源 |
| 后台互调 | 实际 CloudBase 会附加 tcbContext，兼容其传输格式；不使用 metadata 授权，签名、时限和域隔离保留 |
| 旧逐条选择服务 | manage-map-player-source 的源码保留，函数 disabled，ownerEntryEnabled=false，关闭态 smoke 通过 |

四个函数均以各自当前真实远端 ZIP 为基线更新并逐文件回读：finalize-board-observation 8 文件、manage-map-contribution-consent 18 文件、process-map-source-bridge 21 文件、drain-map-source-bridge 21 文件。原同名函数间的历史源码差异保留。诊断与修复增量均独立留证，最终批准应用清单是 `artifacts/task22/phase2-admission-auto-map/manifest-production-current.json`。

条例仍为已应用的 map-contribution-20261003-v2，scope 不变；此次调整准入边界，不增加公开范围，不要求已接受用户重新同意。位置仍为 0.001° 网格、原定位误差≤100米，原坐标私有。原资源、索引、Phase1/Phase2 冻结 ZIP 和历史验收证据没有重建覆盖。

## 全局同步与防回退

现行合同为 `UPLOAD_CONFIRMATION_MAP_SHARING_V2` 与 `V2_ADMISSION_AUTO_MAP_V1`。已同步 AGENTS、README、PRD、五份 memory-bank 当前入口、现行决策和 Phase2 README。旧生命周期探索中的“待发布审核”“exact preview Consent”已加最终替代说明；旧候选包和历史演示不得作为恢复旧产品流程的依据。

正式小程序扫描旧文字、按钮、弹窗、事件以及 GET/SET_INITIAL_CHOICE 调用为零。工作流自动调用防回退门；它检查全局当前入口、原子准入路径、条例及原意愿持久唤醒。测试包含故意恢复旧按钮、旧全局认知、取消原子准入的失败案例。NETWORK/HA 等后续区块解锁前必须认知对齐，不提前实现锁定能力。

## 验证与最终启停

真实 CloudBase 非空 drain→worker、一次原子 V2 与公开投影、无二次选择、幂等重放：4/4 通过。额外真实 SDK 复验条例扫描、公平游标、不制造 SHARE、迟到意愿持久唤醒及重复送达：8/8 组合验收通过。只操作隔离账号及来源，样本全部清理。

早期互调被拒绝的诊断回执保留；第一次诊断后的公开投影清理遗漏已按唯一合成来源恢复精确清理并独立留证，不能把原失败回执改为成功。最后两次平台验收均正常清理，最终回读要求正式 V2 域数据与 PUBLIC 均为零。

当前全套 Vitest 1233 PASS、1 个既有 SKIP；独立 Node 原生测试 12 PASS。原生测试按其 runner 单独运行，不交给 Vitest；第一次混跑造成的“无 Vitest suite”回执也保留。类型检查、Next 构建、CloudBase 本地构建/校验在本轮通过，平台修复后的相关 Lint、桥接回归和全套回归通过。UI 没有再修改，既有页面 26/26 和 WXML 验收不重复充当新的平台证据。最终工作流、防回退、远端源代码/配置/控制/清理均PASS；实际密钥值及变体扫描0匹配。最终V1记录26、consent2不变，私有CONSENT_EVENT为1条，全部正式V2域/权限/sourceState/PUBLIC为0。独立机器回执已保存。

worker/drain disabled，processor=false，四个 V1 producer flag 默认 false，public read=false，timer CLOSE；旧选择服务 disabled。真实当前账号的 CONSENT_EVENT 保持私有待处理，不在尚未批准实际批次时调度。条例服务保持可用；read-stop=false 服务于条例入口，不表示已开放地图。恢复 continuous 时先启正式 V1 producer，再启动处理，避免扫描完成后意愿迟到没有唤醒。

## 仍需原设备与真实批次的部分

最新只读 26 条实际 V1 记录，合格 0：22 条缺精确 APPROVED 的赏票提交依据，4 条缺服务器可核实的原上传分享证明。缺少证明不能推断用户选择“不分享”，也不能由账号同意条例代造历史 SHARE。

CUFZBP 已满足直接上传核验、当前条例和位置条件，只差原设备已有上传确认意愿补送。服务器接收与本地公平重试接点已就绪；原设备打开上一报告提供的新版预览后，已有队列可自动补送，不需二次分享按钮。Agent 无法读取原手机的私有存储，也没有替用户制造意愿。

剩余顺序是原设备补送 → 只读具体合格批次 → 按原门批准真实小批量 → 验证实际 V1→V2→Marker → 开启 continuous。没有具体合格批次，所以本轮没有执行真实历史迁移，也没有用隔离样本替代实际用户验收。Git 提交/推送均为零。

## 证据

- `artifacts/task22/phase2-admission-auto-map/manifest-production-current.json`、四函数 deployment/readback 回执及分次修复回执。
- `retire-legacy-choice.json`、`existing-consent-wakes.json`。
- `live-atomic-admission-platform-context.json`、`live-atomic-admission-wake-delta.json`。
- `diagnosis-owned-cleanup-recovery.json`；早期 STOP 回执原样保留。
- `history-preview-current.json`、`final-readback.json`、`full-production-current-tests.json`、`native-node-tests.log`、最终 workflow/sharing-flow 回执。
- 原设备新版预览与前次修复：`docs/delivery/v2-e-task-22-upload-state-repair.md`。
