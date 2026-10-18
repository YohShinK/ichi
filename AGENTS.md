# ICHI Agent Guidance

> 当前地图分享约束：`UPLOAD_CONFIRMATION_MAP_SHARING_V2`。原上传确认即分享意愿；核验后进入V1（不依赖条例），同意条例后通过V1→V2准入门；V2已准入数据自动生成Marker，不设二次审核或授权。当前条例覆盖本人此前及以后已上传V1记录。本人记录只显示V1“已上传”，禁止二次分享按钮。现行规范：`docs/decisions/map-upload-sharing-contract.md`。

2026-10-18 当前版本状态：用户明确要求GitHub上的2.0.1→2.0.0→main合并，并更新项目状态、收口2.0.0。当前唯一工作集V2-GITHUB-ARCHIVE-CLOSEOUT，GitHub操作尚在执行。微信开发版本2.0.1已上传（1,060,430字节），线上2.0.0由用户确认；不将2.0.1开发上传冒称正式发布，不补造真机/人工验收，不解锁V3或重放生产部署。最终合并回执与收口以docs/delivery/v2.0.0-closeout-and-v2.0.1-github-merge.md及progress顶部为准。 下方早期日期段及状态是历史快照。

2026-10-09修复版预览后用户明确“人工验收完毕”，本次跨城市修复PHONE_REPAIR_USER_CONFIRMED_PASS、Phase6 COMPLETE/HUMAN_APPROVED；当前最终1481/1 skip/0 fail。用户已接受的未测范围保持，独立Phase7工具新测试使用现有解码Python后通过，后端及修复客户端SHA保持；不冒充未知版本/全生命周期/性能。

2026-10-09 Phase6已按本人明确接受未测边界与“修复后收口”授权完成。MAP_PICKER_RENDERED_LEAD_REVALIDATION_V1防回退：已呈现Marker在视口加载或分页概要缺席时仍通过安全公开detail按8行/2并发重核；不得把缺席当删除/不可用删成0。仅明确不可用/本人删除/已知到期移除，全失效关闭空壳恢复控件；生命周期/政策/版本/准备区与分享门保持。当前1474/1 skip、26 Playwright、真实杭州剩1/已删不可用/跨城50+1、原生受控回放与1054089字节预览PASS，旧六项手机PASS不伪装新手机验收。报告docs/delivery/v2-e-task-22-cross-city-picker-revalidation-repair.md；TASK22整体IN_PROGRESS，Phase7独立聊天授权保持，不重放部署/旧准入或正式发布。

2026-10-07 TASK22 Phase3已收口：COMPLETE / HUMAN_APPROVED / PRODUCTION_APPLIED / LIVE_SMOKE_PASS / PHONE_PASS / SAFE_STOP。用户人工确认作为PHONE_PASS依据，不补造设备信息或性能。三构造NETWORK已TAKEN_DOWN且历史保留，smokeEnabled=false/来源与新ID能力清空、未来时钟viewer撤销，常规NETWORK双门false/timer Enable=0；真实公开无构造、PLAYER及既有bridge保持。报告docs/delivery/v2-e-task-22-phase3-human-acceptance-and-closure.md和progress顶部。下一步Phase4仅待明确指令；不得重复部署/索引/桥接/smoke/手机验收，不自行采集50/300或正式发布。

2026-10-06 TASK22 Phase3：用户已明确授权继续，本地官方NETWORK模型、独立rights/Founder exact-version准入、共享投影、30天deadline、v4公开与客户端缓存清理及自动验证已实现，LOCAL_GATES_PASS / AWAITING_REVIEW / CLOUD_NOT_APPLIED。Phase1/2 HUMAN_APPROVED与已消费部署/bridge保持；190旧artifact SHA未变，不重做。当前入口docs/delivery/v2-e-task-22-phase3-official-network-source.md及progress顶部。Phase4—8/实际网络采集入库/生产接点/timer/正式发布未执行；下方“Phase3未开始”仅为上一轮历史快照。

2026-10-06 Phase3生产1—6已完成：新远端基线exact diff、两非TTL索引/policy、七函数及186源码回读、独立curator和提供方Enable=0/CLOSE的maintenance timer、三人工构造smoke、实际到期与受控deadline/真实PLAYER fallback已验证。普通NETWORK准入/维护环境+数据库双门关闭；A仅ICHI-001验收可见至2026-10-07 22:22:46+08，B/C已撤下且历史保留。模拟器官方图标/详情/隐私PASS，实际手机PHONE_PENDING。下一轮只补手机与A撤下/关闭smoke，不重新部署或重复smoke；当前报告docs/delivery/v2-e-task-22-phase3-production-apply-and-smoke.md及progress顶部。

2026-10-06：用户已确认TASK22当前Phase1/2及地图修复人工验收完成（HUMAN_APPROVED）；TASK22八Phase总计划仍IN_PROGRESS，下一步Phase3官方网络来源，Phase3—8及正式发布未执行。当前入口为docs/delivery/v2-e-task-22-report-and-human-acceptance.md及progress顶部。历史AWAITING_REVIEW不要求重复验收或重做部署；本次报告/执行说明不启动Phase3。

2026-10-04用户明确保留微信模糊定位：CURRENT_LOCATION_APPROXIMATE_ALLOWED_V1取代前轮个人定位≤100米/精确权限硬门。合法GCJ02回执可供浏览，模糊/低精度/未知精度标明大致位置，已知有效accuracy绘制误差圆；不得要求开启精确权限或用历史marker冒充本人位置。个人点/圆独立于公开计数，点/相机同回执，前台刷新不移动浏览相机、后台清点并取消旧响应；公开准入精度与网格不变。最新状态以progress顶部为准，前轮定位修复报告只作历史追溯。 已在正式开发工作区/新版预览搭载，1208测试及原生验证PASS，尚未正式发布；证据docs/delivery/v2-e-task-22-approximate-location-support.md。

2026-10-05地图恢复入口：MAP_RECOVERY_CONTROLS_ALWAYS_AVAILABLE_V1要求普通浏览时定位/刷新cover-view持续可用；筛空/搜索空/零筛选/加载/错误/模糊定位不得卸载。只在实际详情壳、重叠列表或modal覆盖时暂时隐藏，关闭后恢复；cardPhase遗留但sheet CLOSED/detail IDLE不得隐藏。旧条件或旧结构断言不能作为恢复依据。正式工作区与预览已搭载，1252回归及原生20状态/真实点击PASS；尚未正式发布，报告docs/delivery/v2-e-task-22-map-controls-availability-repair.md。

2026-10-04直接上传备注安全门已回查在线；DIRECT_UPLOAD_NOTE_RETRY已在正式开发工作区及新版预览包补齐。真实微信备注pass才创建完成V1记录；拒绝/异常留本机待上传，在“我上传的版面”修改备注后恢复同一识别任务，复用原快照/位置/上传分享确认，不重新识别、追加位置核验或二次授权。成功只显示已上传，条例及既有全局bridge自动处理后续。证据见docs/delivery/v2-e-task-22-direct-upload-note-review-and-retry.md；客户端尚未正式发布。

本项目使用 `vibe-coding-standard-workflow`。经用户明确授权，本项目将 Skill 默认的“单 step 人工门禁”调整为“区块人工门禁”：step 仍是细小、可验证的工作单元，V1-A、V1-B 等区块才是解锁、读写、联动和人工验收单元。此调整只作用于本项目，不修改 Skill 本身。`memory-bank/` 是长期事实源；历史 PRD、NeoPRD 和 Product Atlas 只作为研究资料，不再承担开发门禁。

## 开始任务

1. 非代码问答可先读取 `memory-bank/progress.md`，再按问题读取相关文档。
2. 写任何代码前必须完整读取：
   - `memory-bank/architecture.md`
   - `memory-bank/design-document.md`
   - `memory-bank/tech-stack.md`
   - `memory-bank/implementation-plan.md`
   - `memory-bank/progress.md`
3. 从 `progress.md` 确认当前唯一活动区块和区块内工作集；没有活动区块时，不自行解锁任何区块。
4. 只执行活动区块内的 step。区块内所有未完成 step 均可读写、互相引用并按依赖串行、交错或并行推进；不得实现后续锁定区块的产品能力。

## 地图分享防回退

2026-10-06 MAP_DETAIL_READY_REUSE_V1已工作区/生产query应用：首次根query可选带回同次安全公开core的最多2条完整详情；客户端2分钟/16项内存准备区和同ID在途合并，选择立即填有效详情并后台复核，失败/撤回/版本策略不符清除。首页不另发详情RPC；前台地图最多准备首2可见ID，列表2并发/8行，手动forceRefresh与query/hide/unload/退出失效保持。不得恢复picker丢弃已读详情后选择再等重复RPC、无限期详情缓存或绕过公开安全门。原生tap/内外触摸规则不改。生产query仅真实远端基线两文件更新一次，17/17源码/配置回读PASS；不得重复该已消费部署或桥接。最终模拟器普通OS点击7ms/8ms到完整状态，不等于真机P95。报告docs/delivery/v2-e-task-22-detail-ready-reuse-and-first-click-latency.md，最新预览与验收以progress顶部为准。

2026-10-06 MAP_PICKER_NATIVE_TAP_PROPAGATION_V1已工作区/预览搭载：picker/detail外层start/end/cancel与scrim start只能观察bind，不得恢复会取消子tap的catchtouchstart/end；保留catchmove/catchtap与现有内部泄漏护栏。子行/图片普通点击必须打开对应详情，内部滚动不关、外部点击/拖动才关闭。直接Element.tap绕过触摸生命周期，不得单独作为普通点击验收；须补实际OS指针或真机完整输入证据。当前1299回归及真实两条OS点击/外部关闭通过，报告docs/delivery/v2-e-task-22-picker-native-tap-propagation-repair.md，最新状态以progress顶部为准。未正式微信发布。

2026-10-06 PUBLIC_MAP_READ_CONCURRENCY_50_V1已生产应用：公开query/detail限流改为条件原子inc、唯一初始化和换分钟CAS，保留30/60每分钟额度及其他写命令事务。禁止以恢复全局详情串行队列替代后端并发能力；列表仍最多2并发/可视8行。真实50原始SDK突发50/50成功（2实际记录交替，无应用排队/重试），50独立样例后端集成和原生全读取/正确选中通过。生产两个远端ZIP最小更新及17/17源码/配置回读PASS；最新预览/最终验证见progress顶部和docs/delivery/v2-e-task-22-public-read-concurrency-50.md。不等于50人pilot/正式微信发布。


2026-10-06 MAP_PICKER_METADATA_RECOVERY_AND_OVERLAY_TOUCH_BOUNDARY_V1已工作区/预览搭载：生产公开query/detail由原子数据库计数消除事务热点，临时detail RPC全局串行已撤除；列表最多2并发、瞬时失败仅有界重试一次；列表内下拉重读可视8行，视窗起点夹紧、失败保留已读有效行、明确失效移除、关闭取消迟到提交。列表窗口/详情卡片内部点击和拖动禁止关闭或透传地图，外部点击/拖动及原关闭按钮才关闭；内部空白不得绑定outside关闭，map gesture不得无视内部touch起止护栏。原行选择、展开收起、赏级横滑/备注滚动、筛选/定位/分享不改。证据以progress顶部及docs/delivery/v2-e-task-22-picker-metadata-recovery-and-overlay-touch-boundary.md为准。

当前地图详情赏级布局为MAP_DETAIL_COLUMN_FIRST_TIERS_V1：两排按列先上后下，第一列A/B、第二列C/D，横向继续；奇数末项在上排。源数组保持自然顺序，旧地图详情row-major排版已废止。V1设定大赏布局不受此规则影响。

MAP_MARKER_COMPACT_TAGS_AND_PICKER_METADATA_V1：地图单点/聚合/重叠列表标签随文字收紧，禁止恢复64px等宽或占满整行的框；列表首行IP/主题+分析标签同基线，超长省略，次行安全公开备注+可信首次上传时间。只在列表打开时有界读取既有公开详情，最多2个并发读、初始及滚动8行、去重/生命周期取消，不改变选中详情；缺上传时间显示未知，禁止拿observedAt或桥接更新时间替代。当前证据见progress顶部。

`UPLOAD_CONFIRMATION_MAP_SHARING_V2`是当前用户确认的流程约束。禁止把“地图分享选择”“我确认有权分享，并分享至地图”或等价二次发布流程重新加到正常上传、成功弹窗或记录列表。server SHARE/rights仍由原上传确认取得；旧文档、旧候选ZIP、V1网页演示不能作为恢复旧UI的依据。每次相关修改须执行`node scripts/validate-upload-sharing-flow.mjs`；validate-workflow自动包含此门。新版生产条例、V1原上传意图持久化和worker读取意图已应用；V2_ADMISSION_AUTO_MAP_V1使审核/授权全部在V1→V2准入完成，正式V2与地图投影同事务提交。条例/迟到意图的持久唤醒及真实非空drain→worker已补齐验证，旧逐条选择服务disabled且ownerEntryEnabled=false。UPLOADED_V1_ACCOUNT_CONSENT_V1规定本人真实当前v3条例同意覆盖此前及以后完成上传记录，历史缺少逐条字段或原设备送达不得形成额外门；私有保存/未核验/删除仍排除。2026-10-04本人真实v3接受、CUFZBP真实小批量/Marker及每分钟全局continuous已验证并开启，暂停门已由用户恢复指令取代；不得重复已消费部署/迁移或逐账号配置。所有账号通过同一全局后端，本人接受仅覆盖本人记录，不替他人接受。不得恢复或启用旧选择接口，不得让用户再点分享按钮代替后台接点。生产证据以`memory-bank/progress.md`顶部为准，旧暂停/v2报告仅作追溯；正式微信发布及后续Phase仍须独立解锁。

2026-10-04地图资料接点：生产已绑定当前本人安全昵称、独立公开头像副本、真实核验备注及首次上传时间。旧direct备注仅在本人当前条例已接受后由客户端自动后台补审，使用当次临时OpenID并只存exact-hash安全证明；没有新授权或分享按钮。V2详情只读公开投影，Freshness仍用observedAt。正常active账号举报、封禁/异常/受限制不计数，10个不同合格用户隐藏。最新证据与状态见progress顶部及docs/delivery/v2-e-task-22-map-display-and-public-metadata-audit.md。

## 产品与技术来源

- 产品范围、行为、边界和验收：`memory-bank/design-document.md`。
- 技术选择与平台边界：`memory-bank/tech-stack.md`。
- 区块顺序、step 范围、自动验证和区块验收：`memory-bank/implementation-plan.md`。
- 当前活动区块、区块内工作集和验证记录：`memory-bank/progress.md`。
- 已存在文件和职责：`memory-bank/architecture.md`。
- `PRD.md` 是便于人阅读的产品总览；发生冲突时以 design document 为准。
- `docs/references/`、`docs/methodology/`、`product-atlas/` 和 `canvas/` 是历史与研究资料，只有用户明确要求或正式文档引用时才读取。

## 执行与验收

- 用户默认是当前区块的人工验收门；用户明确授权时，Agent 才能代为完成端到端验收。
- 每个 step 必须完成自己的自动验证；自动验证通过后记为 `AWAITING_REVIEW`，但不会锁住同一区块的其他 step。只有区块内全部 step、区块级回归和人工验收通过后，才能解锁下一区块。
- 活动区块内可以使用同区块尚待人工验收的中间产物，但必须在 `progress.md` 标明其状态；锁定区块不得把这些产物当作已批准基线提前实施。
- 开放区块即同步开放为该区块服务的正式事实源和共享文件读写。权限按变更目的判断，不按文件路径冻结：产品行为先更新 `design-document.md`，技术选择先更新 `tech-stack.md`，真实结构同步更新 `architecture.md`，步骤与状态同步更新计划和 `progress.md`。
- 区块人工验收后，将本区块产生的已确认新认知简记到 `progress.md`；讨论中但未确认的想法可作为本区块工作假设，不得作为后续区块的已批准计划输入。
- 解锁下一区块前，Agent 自动执行一次“区块认知对齐”：比较已确认新认知与下一区块全部 step 的目标、输入、产物、依赖和验收，不要求用户手工逐步对照。
- 若无影响，整组解锁下一区块；若只是局部调整且不改变产品范围、平台、隐私、核心架构或区块顺序，Agent 只修改下一区块并告知用户后继续；若出现上述实质变化，Agent 暂停执行并提交精简修订供用户批准。
- 不批量改写远期区块；已知的远期影响只在 `progress.md` 留下目标区块和原因，解锁该区块前再处理。
- 产品行为变化先更新 `design-document.md`，再更新受影响的实施步骤。
- 技术选择变化先更新 `tech-stack.md`，重大文件职责变化同步更新 `architecture.md`。
- 重要结构变化发生时立即更新 `architecture.md`；step 状态和验证结果随时写入 `progress.md`。当前区块通过后，先完成两者的区块收口记录，再等待下一条指令或解锁下一区块。
- `implementation-plan.md` 只写任务、验证和验收，不写代码片段。
- 不自动提交或推送 Git；只有用户明确要求时执行。

## 浏览器与联网工具选择

- 通过终端、代码、API、专用联网工具或其他非浏览器界面方式查询信息时，可直接使用最合适的工具，不要求经过浏览器。
- 自 2026-08-11 起，用户负责 ICHI 网页的人工视觉检查；Agent 不再主动使用 `ego-browser` 或其他浏览器控制工具进行自动视觉验收。代码任务仍执行 Playwright、类型检查、Lint、构建和工作流校验等非人工视觉回归。
- 只有用户在后续指令中明确要求 Agent 实际打开、查看或操作浏览器界面时，才使用 `ego-browser` 及其对应 skill。
- 不得使用 Chrome 或 `chrome:control-chrome` 执行上述浏览器界面操作；即使 Chrome 中已有标签页或登录状态，也不得以此替代 `ego-browser`。

## 完成检查

- 文档或治理任务完成前运行 `node scripts/validate-workflow.mjs`。
- 代码任务还必须执行相关 step 指定的自动验证、Next.js 构建、真实浏览器测试和／或必要的平台适配验证，并在区块末尾执行集成回归。

## 重要提示

- 写任何代码前必须完整阅读 memory-bank/@architecture.md
- 写任何代码前必须完整阅读 memory-bank/@design-document.md
- 每完成一个重大功能或里程碑后，必须更新 memory-bank/@architecture.md
