# ICHI 当前实施计划

> 当前地图分享约束：`UPLOAD_CONFIRMATION_MAP_SHARING_V2`。原上传确认即分享意愿；核验后进入V1（不依赖条例），同意条例后通过V1→V2准入门；V2已准入数据自动生成Marker，不设二次审核或授权。当前条例覆盖本人此前及以后已上传V1记录。本人记录只显示V1“已上传”，禁止二次分享按钮。现行规范：`docs/decisions/map-upload-sharing-contract.md`。


## 2026-10-14 Phase8 主分支归档已按本人指令完成

P8-G=MAIN_ARCHIVE_COMPLETE / PRIVACY_RECHECK_PASS。本人明确授权V2→main合并并推送、推送前隐私处理；953文件源码与全部Git历史扫描/模式复核、28图片元数据核查及私有文件忽略边界完成。main从929d189快进至V2源码990ef9a，实际push成功/远端main回读一致，130微信源文件SHA保持。归档说明追加提交不改代码，不需重新上传。正式微信提审/实际发布/tag及手机/平台声明仍按各自待办与授权处理，不升级TASK22整体完成。

## 2026-10-13 最终唯一工作集：P8-F 移除ICP并重新上传2.0

本人取消地图首页/定位/自动视野设计修订，保持现状。此前P8-F1—F4未实施，不再执行。当前活动区块仍V2-E/TASK22 Phase8；备案展示旧候选由无ICP新包取代，微信版本沿用2.0.0，备注“2.0 版本更新”。

| Step | 本轮目标 | 必须验证/状态 |
| --- | --- | --- |
| P8-F1 | 删除小程序和网页ICP编号/查询及无消费者配置/适配 | 运行时无残留引用；差异只含ICP移除，地图实现与初始入口保持；PASS |
| P8-F2 | 当前源码和必要平台回归 | 1520/1SKIP、26网页复查、类型/Lint/contracts/workflow/分享门/格式/Next/微信编译；PASS |
| P8-F3 | 重新上传2.0.0开发版本 | 备注“2.0 版本更新”，实际上传成功/1054310字节/130源文件SHA绑定；PASS |
| P8-F4 | 按原授权归档GitHub | 候选/新提交敏感扫描PASS；130源文件与4ba6071逐SHA匹配，分支实际推送成功；PASS |

无新生产部署/准入/桥接、提审、正式发布、main合并或tag。此前源码67260be和1056256字节含ICP上传确已成功，当前新包替代该开发候选。

## 2026-10-13 Phase8 自动回归与公开smoke通过（当前）

P8-A=PASS（候选Gitleaks零凭据；内部证据/凭据/缓存忽略并保留）；P8-B=IMPLEMENTED / NATIVE_LAYOUT_PASS / AWAITING_HUMAN_REVIEW，最后编号“浙ICP备2026084653号-1”按本人更正；P8-C=PASS（1520/1SKIP、146定向、26网页、Lint/TS/contracts/workflow/Next/format/微信预览）；P8-D=PUBLIC_SDK_AND_CONTROL_READ_PASS / PHONE_AND_PLATFORM_DECLARATIONS_PENDING（133/132公开及闭门保持）；P8-E=IN_PROGRESS（本人授权新分支codex/v2-release-2.0.0及2.0.0开发上传/随后GitHub归档）。

云trigger只读工具曾在聊天原样返回一项NETWORK运维密钥，未入源码/Git；后续只保留脱敏摘要，双门false/timer0。轮换是新的外部配置动作，尚未授权执行，需在再次开放NETWORK写操作前处理。实际提审/发布、main合并/tag不提前记完成；V3锁定。报告docs/delivery/v2-e-task-22-phase8-pre-release-and-archive.md。

## 2026-10-13 TASK22 Phase8 已由本人启动（当前唯一工作集）

V2-E/TASK22 IN_PROGRESS / PHASE8_PRE_RELEASE_IN_PROGRESS。本人明确授权敏感信息扫描及忽略、备案展示、上线前回归、完成后创建V2分支及上传微信，再归档代码到既有GitHub仓库。既有Phase7版面修订收口为输入；原300要求不恢复，已消费生产部署/bridge不重放。下方旧聊天停止/Phase8锁定为历史，不覆盖本窗口新指令。

| Step | 工作与产物 | 必须验证与当前状态 |
| --- | --- | --- |
| P8-A | 全项目及Git历史敏感信息扫描，源码/本地证据归档边界，忽略真实凭据/私人取证/构建缓存 | 只输出脱敏报告；提交候选再次扫描、已跟踪忽略文件解除跟踪；IN_PROGRESS |
| P8-B | “我的”底部真实小程序备案号及工信部查询入口、用途文案准确 | 完整编号、字号/安全区/小屏可达、微信编译与复制成功/失败；当前真实编号待本人提供，不以网站号或示例替代；IN_PROGRESS |
| P8-C | 当前源码完整单元/负测、Lint、双TS、contracts/workflow/分享门、Next、Playwright、包体/原生适配 | 失败必须修复或明确记录；历史artifact测试副本排除，当前源码测试保留；READY |
| P8-D | 当前生产配置/桥接/闭门/公开隐私只读核对、release/rollback/隐私声明与必要手机smoke清单 | 只读不重放部署；未测手机/成本/主体后台项不补PASS；READY |
| P8-E | 新V2分支、合格候选微信上传与GitHub代码归档 | 执行实际已授权动作并保存回执，源码SHA与上传内容绑定；备案/强制回归失败不上传；上传不等于审核/发布；WAITING_FOR_P8_A_TO_D |

Git PR/merge main、审核提交、实际发布及immutable tag只在已明确授权且对应门通过时执行；本次“上传推送”先按微信开发版本上传处理，不冒称已正式发布。

## 2026-10-13 Phase7 版面修订工作集 COMPLETE（本窗口收口；上线准备在其他窗口）

P7-D已完成实际Founder52使用及完整来源入图，15疑点补齐真实发布；P7-E全国/20公开城市query、3页全国/2页上海、133详情及132实例/原50/PLAYER/私有事实/公开隐私保持通过；P7-F已记录真实SDK往返、图片补取/解码/照片处置、累计成本和Phase6已接受未测边界，并完成数量账/城市地点CSV/恢复入口/安全关闭。132合格NETWORK含原50、新82，133公开含PLAYER1；300门由本人撤销，不改写为300完成。所有现有不完整待办已关闭保留原证据，不伪造未知事实或本人不可用。最终闭门管理只读回查PASS，原SDK超时回执保持。

状态COMPLETE_FOR_USER_AMENDED_BOARD_SCOPE / REAL_PUBLIC_READ_PASS / SAFE_STOP；TASK22整体IN_PROGRESS。交付`docs/delivery/v2-e-task-22-phase7-board-scope-closeout-132.md`和progress顶部。本窗口不执行本人指定的其他窗口上线准备/文件忽略/GitHub上传/上线前回归，不把当前数据收口作为全部发布门已通过或actual PUBLISHED证据。

## 2026-10-13 Phase7 现有库存收口授权（历史过程）

用户明确取消全国300份要求，要求现有待确认/正在确认版面完成处理、合格项入图、报告实际数量并收口，随后进入上线前最后阶段。P7-D继续处理已保存完整来源及本人实际52项回复，不重复旧准入；未补齐必要事实的本地排除且留原因，未知不能自动批准。P7-E在采集终止后一次核对全国公开query/detail、分页、独立实例、地点及原50/PLAYER保持；P7-F记录真实性能/隐私/成本与已接受手机边界，完成恢复入口和最终交付。停止新的数量驱动搜索；未检查搜索结果继续标未检查，不算无效或合格。

本人最新明确：Phase8上线准备、文件忽略、GitHub上传及上线前回归在别的窗口执行。本聊天止于P7-D/E/F现有库存入图及一次完整收口，不执行P8-PREP或发布动作。刚开始且已结束的本地检查保留实际回执，不追加上线前全量回归；只补本部分必要的真实公开数据/隐私/闭门验证。

## 2026-10-09 Phase7 全国300授权与准备（历史，数量目标已由10-13指令替代）

本聊天执行用户已授权Phase7采集准备与图片补取。P7-A核对原50当前生产/公开/独立实例；P7-B先补强图片补取并真实失败验证、建立全国商圈覆盖；P7-C先3—5新合格来源生产链路验证；P7-D每批10—25、最多50逐批新委托/exact准入及公开回读/闭门；P7-E全国300去重与query/detail分页/位置/PLAYER保持；P7-F性能/隐私/必要真机/成本证据及交付。Phase6已接受边界并完成跨城市缺陷修复/验证/预览与收口；P7-E沿用MAP_PICKER_RENDERED_LEAD_REVALIDATION_V1，不把加载/分页概要缺席当不可用。其余Phase7工作集及独立授权保持。Phase8/正式发布/维护timer/Git禁止；新部署另需具体授权。

## 2026-10-09 Phase5 工作集收口（最新）

P5-A—F工具实现与本轮授权自动端到端验证均完成，状态COMPLETE / AUTOMATED_ACCEPTANCE_PASS / PRODUCTION_APPLIED / REAL_PUBLIC_READ_PASS / SAFE_STOP。当前方向AUTO_CLEAR_ESCALATE_UNCERTAIN：Agent核清完整证据自动处理，仅疑点交Founder。报告docs/delivery/v2-e-task-22-phase5-official-network-workflow.md及requirements-audit.json为当前入口；不新增HUMAN_APPROVED/PHONE_PASS，V2-E/TASK22整体仍IN_PROGRESS。

| Step | 完成产物与验证 | 状态 |
| --- | --- | --- |
| P5-A | 机器schema、版本化批次collect/去重、原七天/30天/图片与真实播放帧绑定、未知保留 | COMPLETE / AUTOMATED_PASS |
| P5-B | exact自动委托、独立大赏/地点/rights/备注证据、中文疑点页/fix补数、新版本失效、锁和SHA审计 | COMPLETE / AUTOMATED_PASS；真实10项NEEDS_FOUNDER仍未准入 |
| P5-C | 官方适配、计划/授权、共享事务准入、有界重试/只读恢复/闭门；本次获具体授权的七函数各单模块更新，42025文件及配置实际回读 | COMPLETE / PRODUCTION_CAPABILITY_APPLIED / SAFE_STOP |
| P5-D | 同板修正、撤回不复活、共享PLAYER/观察时钟/公开白名单保持 | COMPLETE / AUTOMATED_PASS；生产无新增修正/撤回 |
| P5-E | 安装ICHI技能、原真实四条本地/公开恢复4/4、原50来源字段保持、50NETWORK+2PLAYER真实公开详情保持 | COMPLETE / REAL_PUBLIC_READ_PASS |
| P5-F | 当前源码1462/1 skip、28 workflow、七编译包、26 Playwright、types/Lint/Next、Skill/分享/治理、requirements审计与交付 | COMPLETE / AUTOMATED_ACCEPTANCE_PASS |

本次部署授权已消费，不作为重复动作授权；已成功更新不重放，旧50条不重放。Phase6另获并行授权，其最终自动集成证据可复用本轮，实际手机/整体用户验收仍独立完成；Phase7/8、全国300、正式发布和Git未解锁。下方初始Phase5 IN_PROGRESS/不部署/默认逐条Founder及唯一Phase5限定按历史读取。


## 2026-10-09 Phase6 修复版人工验收完成（最新）

用户在修复版1054089字节二维码后明确“人工验收完毕”，本次跨城市修复PHONE_REPAIR_USER_CONFIRMED_PASS；iPhone16Pro/一个账号沿用，系统/微信版本未知，已接受未测边界保持。Phase6=COMPLETE / HUMAN_APPROVED / CROSS_CITY_FIX_PHONE_ACCEPTED / CURRENT_INTEGRATION_PASS / PREVIEW_READY / SAFE_STOP。本次最终集成1481 PASS/1既有SKIP/0 FAIL、types/Lint、Next/26 Playwright及原生/真实SDK地图门通过；仅Phase7新增媒体测试初次缺解码Python环境失败，使用项目现有Pillow运行时后通过且保留失败。

MAP_PICKER_RENDERED_LEAD_REVALIDATION_V1为当前防回退门，杭州真实剩1/另一条已删不可用；旧手机六项与本次修复人工反馈分别绑定，不扩大到新上传/辅助抽赏、全生命周期、未知版本或性能。Phase5后端三文件SHA保持；独立Phase7四份工具源码变更另记，不声称旧28源仍全部相同。收口报告docs/delivery/v2-e-task-22-cross-city-picker-revalidation-repair.md，人工phone-repair-human-acceptance.json与当前final-state.json；TASK22整体IN_PROGRESS，独立Phase7授权保持，Phase8/正式发布未由本聊天解锁，无本轮部署/旧准入/生产来源配置写入/Git。

## 2026-10-09 Phase6 并行工作集（当前授权）

用户已明确“接受这些未测边界，收口Phase6”，又报告跨上海/杭州缩放时列表0→2及本人删除一条，并授权修复后收口。P6-G范围门已获接受，P6-E本次缺陷修复、当前全量/原生/真实公开读回及修复预览均通过，Phase6已收口；新增P6-E内工作是MAP_PICKER_RENDERED_LEAD_REVALIDATION_V1，已复现缺失概要被当不可用，完成有界公开核验、真实删除不复活与当前源码/平台/包体预览回归。原六项通过留作当时证据，不用其盖掉新缺陷。

用户明确“Phase5 在进行中，这边同时进行Phase6”。活动区块仍V2-E/TASK22；旧“唯一Phase5/Phase6 LOCKED”按历史读取。当前Phase5最终产物/生产接点集成和六项地图手机验收已通过，Phase6本轮合同按用户已接受边界冻结，P6-G完成；Phase7独立聊天另获授权，本聊天不授予Phase8/正式发布。

| Step | 目标与验证 | 当前状态 |
| --- | --- | --- |
| P6-A | 复用已入图50条，真实读回来源/决定/rights/exact版本、观察、独立BoardInstance和公开ID；逐条核对原7天窗口及30天期限，不重审/重放已有入库 | EXISTING_50_EXACT_PROVENANCE_PASS / COMPLETE_WITH_ACCEPTED_GAPS；50来源/观察/决定/实例/网络公开ID，31文章，10本人+40受托核验 |
| P6-B | 当前真实SDK query/detail、公开备注/赏级/价格/Opportunity/Freshness/PublicLocation、筛选/分页/公开字段隔离与50不同ID突发读取 | REAL_PUBLIC_READ_PASS / COMPLETE_WITH_ACCEPTED_GAPS；删除前50NETWORK+2PLAYER，修复当前杭州1/已删不可用及跨城50+1；六筛选、五页、50/50突发通过 |
| P6-C | 现行上传确认/本人条例覆盖/本机私有保存、删除/更新/防复活、Resolution歧义/冲突/多贡献、null≠0、30天/历史/PLAYER支撑、原子回滚及全量回归 | COMPLETE / FINAL_AUTOMATED_GATES_PASS；修复当前版本1474/1 skip/0 fail、28 workflow、七编译包、26 Playwright、types/Lint/Next，25证据/28源码SHA保持；原初始1429为历史 |
| P6-D | 包体源审计、当前SDK往返性能与真实环境计费周期用量；区分设备P95、隔离批次成本和环境累计量 | SOURCE_PACKAGE_AND_SDK_SAMPLE_PASS / COMPLETE_WITH_ACCEPTED_GAPS；批次成本/设备性能无实测结论 |
| P6-E | 用户一个账号/iPhone16Pro完成真实触摸、50条区域浏览、重叠列表/详情、筛选/恢复控件、前后台与可安全执行的V1上传/抽赏/自有记录删除 | COMPLETE / CROSS_CITY_FIX_PHONE_ACCEPTED / PRIOR_PHONE_SIX_PASS；修复预览1054089字节、当前SDK杭州1与已删不可用、原生回放通过，r3历史实际1053453字节、用户先“正常”再“全部通过”确认六项；版本未知，新上传/辅助抽赏/删除未明确反馈，最终未测边界在P6-G已接受 |
| P6-F | 对接Phase5最终schema/审核委托/发布/恢复/撤回合同及适用部署，核对原50和PLAYER保持；补最终版本集成门 | COMPLETE / PHASE5_FINAL_VERSION_BOUND_INTEGRATION_PASS；七实际回读完整包42025文件与候选一致、25证据/28源码SHA及50真实来源exact本地兼容、50NETWORK+2PLAYER保持；不重复部署/准入。Phase4七函数186回读亦已补齐 |
| P6-G | 汇总每项真实/本地/历史证据与单账号等未测缺口，用户整体验收后最终冻结合同；再评估Phase7解锁 | COMPLETE / HUMAN_APPROVED / ACCEPTED_GAPS / CONTRACT_FROZEN；scope-human-acceptance.json绑定直接接受与修复后收口指令，修复/预览通过；旧六项手机PASS不冒充修复后新手机PASS。独立Phase7另获授权，Phase8/正式发布不由此解锁 |

本轮证据目录`artifacts/task22/phase6-shanghai50-20261009/`，报告`docs/delivery/v2-e-task-22-phase6-shanghai50-parallel-rehearsal.md`。原查询/详情限额30/60每分钟、列表2并发/8行、分享流程、生产安全门不改；当前工作以只读生产和本地验证为主，来源/配置 mutation、真实删除/到期注入及部署须各自确切范围授权。



## 2026-10-09 Phase5 工作集修订（最新）

用户明确“自动录入，无法识别或者待确认交由founder处理”。P5-A—F继续推进，默认review改为AUTO_CLEAR_ESCALATE_UNCERTAIN：完整证据自动委托核验/入图，未知、遮挡或冲突才集中Founder确认；所有审核绑定exact事实与图证据，保留独立rights/安全与当前服务器Verification/Projection。新增独立workflow委托/地点注册，不借旧50授权批准未来来源。

P5-C增加当前七函数的最小network.mjs能力候选、真实远端fresh baseline/包SHA/配置回读/旧50与PLAYER保持检查；外部部署在具体候选准备完成后按既有独立授权门处理。无新的采集数量目标，无Phase6—8/300或正式发布解锁。

## 2026-10-09 当前Phase5工作集

用户目标“完成Phase5”解锁本工作集；唯一活动区块V2-E/TASK22，Phase4补采50条真实完成作为输入。先完成Phase4→5认知对齐：现有委托50条不重审，新候选默认Founder exact决定，只有服务器独立exact委托注册表支持时才复用该授权；Phase6—8仍锁定。

- P5-A：冻结可复用批次schema、collect/review/publish命令与证据目录；验证本地去重、7天原窗口、同帖多板、未知/不完整候选、截图/视频证据绑定。状态IN_PROGRESS。
- P5-B：实现本地审核卡、明确决定导入、修正失效、独立rights/备注/大赏检查、持久版本/进程锁/hash审计。状态IN_PROGRESS。
- P5-C：实现官方ingestion适配器、默认计划和exact外部授权、前后read-back、幂等、中断恢复、有界重试和闭门。状态IN_PROGRESS。
- P5-D：实现撤回及不复活、同板/新观察交接边界，验证共享pipeline、PLAYER保持、时间不续期和公开字段安全。状态IN_PROGRESS。
- P5-E：创建并安装ICHI采集Skill，使用真实既有证据进行本地完整演练及50条生产只读回查，不重复入库。状态IN_PROGRESS。
- P5-F：完成自动回归、Skill校验、工作流治理、requirements逐项审计与交付说明。状态IN_PROGRESS。

本次指令授权完成Phase5工具与自动端到端验收；不执行新的生产数据写入/撤回/部署，不开启维护timer或Phase6—8，不commit/push。

## 2026-10-08 当前Phase4补采至50条工作集

用户明确授权补采至地图总计50条；证据清楚的记录由Agent受委托核验后直接准入，不要求用户逐条Founder识别，无法判断的最后集中交审。本节取代旧本轮不扩大10条或不采集50条的限制，V2-E/TASK22仍为唯一活动区块。

- 补核205条积压及同帖全部图片，先核对已有板号与观察版本，保留原始窗口、位置和票位证据。
- 以门店、具体IP系列、版面同义词执行站内搜索，采用最新或综合排序并核对一周内；记录滚动覆盖和正文核验，未检查不计无效或饱和。
- 为已确定的新独立版面建立exact版本、委托核验与独立rights决定，必要的限定策略仅扩展到总计50条，先完成自动验证及新鲜远端最小差异核对，再受控准入；旧10条不重放。
- 实际query/detail逐条核对总数、赏级、备注、原观察时间/期限、同板关联及PLAYER保持；每次批次关闭准入门，维护/smoke/timer保持关闭。
- 未确定记录统一生成照片与疑点清单；50条真实入图核验通过才完成目标。无Git提交或微信正式发布。

状态COMPLETE / REAL_PUBLIC_READ_PASS / SAFE_STOP；原10条加新增40条，最终实际公开query50NETWORK及50NETWORK+2PLAYER详情通过；末4条按用户识别为56/35/37/50抽，剩余10项疑点原图保留未准入。83组搜索仍部分覆盖，不声称205积压全部审完或饱和。当前补采目标完成，TASK22整体仍IN_PROGRESS，Phase5—8及正式发布锁定。证据见progress顶部及docs/delivery/v2-e-task-22-phase4-collection50-progress.md。

## 2026-10-07 当前Phase4采集复核与补核队列

- 已完成原412条、35轮搜索与时间/处理阶段对账、原图片SHA复验及497张缩略图分流复查；撤回旧搜索饱和判断。
- 已将202待补和3加载失败重列补核，生成10条优先清单、28组站内搜索修订矩阵及可复算笔记；矩阵状态未执行，不把补核线索计为新增已合格版面。
- 后续在当前Phase4范围补核原始时间、逐帖全部版面图片与真实地点，识别同帖多板及同板较早观察；未检查候选不得参与无效率或饱和停止判断。
- 10条已有真人批准及生产事实保持；新增候选不继承旧批次授权，不扩大限定位置policy；Phase5—8仍未解锁。
- 验证：412唯一URL/状态数量、192/193/27时间区间、540图片SHA、末5轮36/4/32处理进度及治理/分享门；完整回执见collection-audit-20261007。用户当前要求是纠正采集判断与策略，不伪称新增独立版面数量已确定。

## 2026-10-07 NETWORK 余量纠正与列表详情共享内容（当前）

当前活动V2-E/TASK22工作集按用户补充要求完成：①原图逐票位复核和3项用户确认，最终10总数78/70/55/23/68/68/69/80/41/50；②先更新产品规则，实现内部当前批次版本化纠正库及权限／时钟／历史／回滚／并发拒绝测试；③复用原验证和投影完成5条实际纠正，不重复ADMIT，其他5条不写，normal门始终关闭；④NETWORK列表与展开备注共用安全内容，UI上传时间取原observedAt，PLAYER保留；⑤真实公开和原生文本／Canvas核验及新预览；⑥文档治理。状态PRODUCTION_CORRECTED / REAL_PUBLIC_VERIFIED / NATIVE_TEXT_AND_CANVAS_VERIFIED / PREVIEW_READY。全源1415通过／1既有跳过，后加2项回滚／并发拒绝在最终NETWORK专项通过，类型／Lint／Next／Playwright26通过；治理与分享流见最终回执。正式发布／后续Phase仍锁定；不要求重审已批准的10条，也不声称新增真机视觉验收。报告docs/delivery/v2-e-task-22-network-count-and-picker-metadata-correction.md。

## 2026-10-07 NETWORK 地点展示文案简化（当前）

当前V2-E/TASK22工作集内的用户补充要求“去除大致、未知等描述”已完成。步骤：产品展示规则先更新→网络详情折叠／展开地点名统一转换→验证公开元数据及PLAYER展示保留→真实10条原生文本回读→生成官方预览→文档治理。状态CLIENT_IMPLEMENTED / NATIVE_TEXT_VERIFIED / PREVIEW_READY；人工视觉仍由用户负责，不声称新真机验收。源回归1406通过／1既有跳过，最终NETWORK14项复跑、类型／Lint／Next构建通过；治理结果见progress与交付报告。无生产函数部署、10条准入重放或后续Phase解锁。新预览1053152字节，证据artifacts/task22/phase4/network-venue-label-20261007/。本节取代下方本批旧的详情描述展示要求。

## 2026-10-07 当前10条 NETWORK 近似地点准入（已入图并收口）

用户在已批准10条版面全部入图后，明确回复“允许”，批准仅当前10条NETWORK使用可追溯门店／原帖明确商场范围的近似位置。该决定取代下方本批次 LOCATION_PRECISION_POLICY_BLOCKED / PENDING_USER_APPROVAL；不整体解锁Phase5—8或50/300目标。

产品规则 NETWORK_BATCH10_VENUE_APPROXIMATION_V1：米级误差未知保留accuracyMeters=null，不伪造0/100米。命名门店吻合时使用APPROXIMATE，原帖明确商场但具体门店未证实则使用AREA；公开点仍按0.001°网格，详情明确展示“大致位置／位置误差未知”及安全地点名。原帖、命名POI、查询时间及地点摘要只作后台证据，不公开原图、原文或内部来源标识。PLAYER原≤100米准入和个人模糊定位流程保持。

技术边界：network policy新增可选、本批次最多10项的sourceId/sourceVersion/locationDigest绑定；只有allowlist精确匹配且真实公开地点证据完整的NETWORK允许null误差。Founder及独立rights继续绑定最终record内容摘要，最终事务复读决定／policy；非本批次及PLAYER未知误差仍拒绝。使用现有public-map-v4的precisionMode/areaLabel承载安全地点提示，客户端详情显式展示，不新增公开私有证据字段。不同文章按既有Resolution分别核验，不以同一商场合并。原sourcePublishedAt决定Freshness及30天publicUntil，不用此次地点补证、审核或入库时间续期。

当前工作集：补齐公开地点证据→实现限定准入及详情提示→自动回归→新鲜远端最小差异部署→现有正常签名准入端口处理10条→真实公开读取及关闭临时准入门。维护/timer/smoke保持关闭，既有PLAYER/Phase1/2桥接及历史Phase3部署不重放；不创建新资源，不自动Git提交或微信正式发布。当前批次 BATCH10_COMPLETE / HUMAN_APPROVED / TEN_PRODUCTION_ADMITTED / PUBLIC_READ_VERIFIED / SAFE_STOP：10个真实NETWORK来源、10个独立BoardInstance/publicLeadId，真实SDK query/detail全部可读；7条门店APPROXIMATE、3条原帖明确商场AREA，米级误差均未知且详情明确提示。原有2条PLAYER公开事实及位置门保持。新鲜远端7函数各只改network/domain两文件，186源码与原配置回读PASS；准入环境及数据库双门已关闭，维护/smoke/timer关闭。先准入8条再准入剩余2条，前8条无重放；原50条目标不伪造达成。自动回归1406通过/1既有跳过、实际七包373通过/5不适用公开入口跳过、Playwright26、类型/Lint/Next/治理/分享门通过；原生模拟器10条与位置提示文本PASS，不充当新增真机人验。官方预览1053042字节已生成；未微信正式发布或Git提交。初次准入未启用、最后两条配置Updating/恢复失败均留原回执，后续仅等待Active及恢复/正常准入，最终关闭回读PASS。证据与批量人工授权位于artifacts/task22/phase4/review/，生产包／准入／公开回执位于artifacts/task22/phase4/map-admission-20261007/。

## 2026-10-07 当前10条 Founder 批量人工通过与入图授权

用户明确“我看过了，全部通过，都可以放置到地图中”，当前 REVIEW_READY 的10个 canonical URL 已由 Founder 批量人工通过；准确性、已展示地点、大赏建议按本批原快照确认，无需重复逐条点击。收口记录 `artifacts/task22/phase4/review/founder-approved-batch-10.json`，绑定原 packetHash、每条 sourceSnapshotHash/contentDigest 和展示事实；此前采集 packet 中 PENDING/0 批准为当时快照，不能覆盖这次真人决定。

用户补充“不需要权利依据，因为是公众平台分享，本质上是用户希望分享”。本批仅使用提取后的公开结构化版面事实及既有安全近似地图投影，采用现有 `PERMITTED_STRUCTURED_FACTS` 依据，保留 Founder 本条政策决定为 evidence；不宣称取得作者/门店许可，不将作者第三方意图当已核验事实，不公开原图/原文或内部来源证据，不移除后端独立rights/exact版本门。

当前 BATCH10_HUMAN_APPROVED / MAP_ADMISSION_AUTHORIZED / LOCATION_PRECISION_POLICY_BLOCKED。10条平台公开time元数据全部已补，标题/原日期范围/各自原采集时7天窗均一致；当前4条略超7天，保留原时间及30天期限，不用抓取/审核续期。三个高德命名POI提供8条点位候选，其中番茄口袋/暴蒙7条正文门店与地址吻合；AKIBAGO 1条无地址且分类异常，仍需核对。静安玩具反斗城检索返回北座六楼，潮趣店关联未证实；花の一番未检到具体门店点，二者仍待匹配。所有POI均未返回米级误差，accuracy保留null，不能填0/100通过现行≤100米准入。Ego定位提示已由用户允许，TaskSpace 3控制恢复，不保存本人位置。生产写入/ingestion仍0，ordinary admission/maintenance及smoke均false；CloudBase读回正常。已整理10条board facts、真实sourcePublishedAt、原fetchedAt及待入图位置候选：`artifacts/task22/phase4/review/batch-10-map-admission-preparation.json`（NOT_PRODUCTION_INPUT），时间/POI证据及机器检查同目录。提出仅当前10条NETWORK使用可追溯门店/明确商场范围近似位置、米级误差未知明确标注的规则修订，PLAYER≤100门保持；该提案PENDING_USER_APPROVAL_NOT_IMPLEMENTED，不作为已批准基线，不修改现有公开安全门。报告 `docs/delivery/v2-e-task-22-phase4-batch10-human-approval-and-map-preparation.md`。原批量人工通过/入图授权保留，无需逐条重审；完整Phase5—8/50/300/微信发布/Git外部动作不整体解锁，旧Phase3部署/smoke/bridge不重放。

## 2026-10-07 TASK22 Phase4 自主采集（交付快照，当前人工决定见上节）

唯一活动区块 V2-E / TASK22 / Phase4。用户 `/goal 执行 markdown 文件中的任务` 授权自主执行下载目录 Phase4 计划；Phase3 COMPLETE / HUMAN_APPROVED / PRODUCTION_APPLIED / LIVE_SMOKE_PASS / PHONE_PASS / SAFE_STOP 已核对，既有部署、三条 smoke、手机验收及 PLAYER bridge 不重复。

自主部分 COLLECTION_COMPLETE / REVIEW_PACKET_READY / SUPPLY_GAP，当前门 PHASE4_COLLECTION_READY / FOUNDER_REVIEW_PENDING / PHASE5_LOCKED。**Phase4 仍 IN_PROGRESS，未 HUMAN_APPROVED**。35 个公开搜索查询，412 个唯一 canonical URL；打开尝试 113 / 保存正文 107 / 原图候选 103 / 图片证据引用 540；17 条结构化草稿，10 REVIEW_READY、202 NEEDS_FIX、4 硬排除、193 OUT_OF_WINDOW、3 本轮加载失败；相似组 1，仅提示不合并。目标 70 可审差 60；最后五轮新 URL 最终合格数均 0，按搜索饱和停止本轮扩大，未声称 120 条全部高潜力已视觉检查。

可审 10/10 在各自采集时点通过滚动 7 天窗；1 分钟精度、9 相对时间范围，后者 sourcePublishedAt=null，冻结前须补可信原始绝对时间，批准/冻结重新检查当前窗口。地点全池 POST_TEXT_EXPLICIT 15 / UNPROVEN 397，可审全为 POST_TEXT_EXPLICIT 10；未代写 MANUAL_CONFIRMED。未知不是 0，7 条可审总余票完整、3 条遮挡未知；初始数量/邻板价格不冒充剩余/本板价格，大赏与 Opportunity 仅建议。observedAt 仍未建立，不用 fetchedAt/reviewedAt 续期。

全部真实 Founder accuracy/rights/location/highPrize/最终决定 PENDING、version=0、批准 0/50；rights NOT_APPROVED，内部原图不做公开投影。审核页明确确认、修正使批准失效、同 packet/source hash 导入导出、恰好 50 条版本冻结及 selection SHA；QA 批准全部 SYNTHETIC_QA_ONLY。生产 write/ingestion=0，普通 NETWORK 准入/维护双门与 timer 保持关闭；Git commit/push/PR/merge/tag=0，微信 upload/review/publish=0，Phase5—8 LOCKED。

本地证据 `artifacts/task22/phase4/`；ego-browser 单 TaskSpace 公开采集，3 次截图 CDP 超时/成功 0，以原图+公开文本 SHA 继续留证，不绕过访问控制。专项 Node 20、审核页交互 22、现行正式源码 Vitest 1393 PASS/1 既有 SKIP、项目 Playwright 26 PASS；类型/Lint/Next/contracts/workflow/分享防回退/数据哈希/安全扫描/格式/diff PASS。默认全目录拾取旧冻结 artifact 6 失败、排除 artifact 后又拾取实验 Node 文件 1 suite fail 均保留；正式源码范围 apps/packages/services/scripts/tests 通过，未修改冻结历史包或正式 Vitest 配置。机器回执 `qa/final-validation.json` = LOCAL_GATES_PASS_WITH_SCOPE_WARNINGS。

入口 `docs/delivery/v2-e-task-22-phase4-autonomous-collection.md`、`docs/delivery/v2-e-task-22-phase4-founder-review-packet.md` 和 `artifacts/task22/phase4/review/founder-review.html`。下一步仅 Founder 审核/修正与补供给，直到真实批准 50；本轮不足 50 不提前入库或解锁后续阶段。收口新认知：搜索命中/图片数量不等于合格版面；相对日期可作为带精度的采集窗口证据，但不能伪造生产时间；具体正文门店与内部原图不能代替 rights 或公开投影决定。

| Phase4 step | 工作与验证 | 当前状态 |
| --- | --- | --- |
| P4-A | Phase3 safe-stop、当前范围与计划对齐 | AUTO_PASS / AWAITING_REVIEW |
| P4-B | 地理/意图/主题查询，412 URL 去重、饱和证据 | AUTO_PASS / AWAITING_REVIEW / SUPPLY_GAP |
| P4-C | 原图/正文/hash，17 草稿/10 可审，未知与地点证据 | AUTO_PASS / AWAITING_REVIEW |
| P4-D | 数据/身份/时间/rights/去重安全门与 Node 20 项 | AUTO_PASS / AWAITING_REVIEW |
| P4-E | 本地审核页/MD/CSV/JSON/schema；22 交互项 | AUTO_PASS / AWAITING_REVIEW |
| P4-F | 现行回归、报告/记忆/机器回执与 Founder handoff | AUTO_PASS / AWAITING_REVIEW |

Founder 实际决定及批准 50 仍未完成；以上自动 PASS 不解锁 Phase5—8。

## 2026-10-07 TASK22 Phase3 已收口（当前断点）

TASK22 Phase3 = **COMPLETE / HUMAN_APPROVED / PRODUCTION_APPLIED / LIVE_SMOKE_PASS / PHONE_PASS / SAFE_STOP**。用户明确“人工核验通过，Phase3 收口”，并指定上述最终状态；PHONE_PASS依据用户确认，设备型号/系统/微信版本/性能未提供，不补造Agent真机实测。当前报告`docs/delivery/v2-e-task-22-phase3-human-acceptance-and-closure.md`，收口证据`artifacts/task22/phase3-close-20261007/`；人验与安全停机均已完成，无Phase3待清理项。

最后构造来源A已通过既有签名维护端口TAKEDOWN；三构造来源均TAKEN_DOWN/noResurrection，Observation/history/audit保留。global:network.smokeEnabled=false、来源allowlist及新Marker ID能力清空；验收账号未来时钟能力撤销，原测试公开ID隔离仍保留。普通NETWORK admission/maintenance环境与数据库双门false，提供方maintenance timer Enable=0/CLOSE。真实生产query无构造条目、两构造detail不可用、原PLAYER详情正常；已签名smoke读取UNAUTHORIZED、已签名旧来源ADMIT返回NETWORK_SERVICE_DISABLED。PLAYER原版面/观察时间/首次上传时间/位置/贡献者/备注等10字段及全局features/bridge回读一致。登录一度失效，用户恢复后完成清理；失败尝试单列保留，不作为成功证据。

工程验收沿用1353PASS/1既有SKIP、七包287/修复两包84、类型/Lint/Next/Playwright26、七函数186源码与190旧artifact保持的已通过证据；本轮只运行清理、真实公开读取、关闭/隐私回读和文档治理，无新部署/索引apply/bridge重放/采集/Git提交。Phase3来源图标与独立rights/Founder/30天/PLAYER fallback确认事实已收口。

Phase4认知对齐已完成：既定本地候选/Review Card/Founder终审的目标、输入、产物、依赖与验收无实质冲突；构造smoke决定不得用于真实文章，独立rights、exact版本、原观察时间及不同URL分别Resolution继续成立。不改写远期计划。本次不启动Phase4—8/50/300/常规NETWORK continuous/正式微信发布；V2-E/TASK22整体仍IN_PROGRESS，后续待明确执行指令。不得重复Phase1/2或Phase3已消费部署/三条smoke/手机验收。

## 2026-10-06 Phase3 生产断点（历史快照；当前人验/收口见上节）

当前状态PRODUCTION_APPLIED / LIVE_SMOKE_PASS / PHONE_PENDING / AWAITING_REVIEW；V2-E/TASK22仍IN_PROGRESS，Phase1/2及既有地图修复HUMAN_APPROVED断点保留。用户本轮明确授权七项生产动作，1—6已完成，7尚缺实际手机证据。报告：`docs/delivery/v2-e-task-22-phase3-production-apply-and-smoke.md`；证据：`artifacts/task22/phase3-live-20261006/`。不重做已消费Phase1/2部署/bridge，不启动Phase4—8、50/300、实际文章采集或正式微信发布。

从当前真实远端捕获新基线，更新五现有函数、新建admit-official-network-source与maintain-official-network-sources，apply两个非TTL索引和独立network policy/control/curator。普通NETWORK准入与维护环境/数据库双开关false，提供方maintenance timer Enable=0/CLOSE；PLAYER features和bridge全字段保持。签名运维、exact决定最终事务重读及受控读取隔离验证通过。受控时钟字段首次被白名单拒绝后，从刚部署远端再次生成仅两行的新diff修复query/detail；未复用旧授权或重复配置。最终七函数186/186源码及配置回读PASS，190旧artifact和此前Phase3本地ZIP保持。

三条用户授权人工构造NETWORK在production准入/公开/期限验证PASS，不声称真实文章Founder审核或rights。B实际时钟跨30天边界后隐藏并退役；C限定deadline维护和未来读取确认真实PLAYER fallback、原publicLeadId及版面/备注/贡献者/首次上传时间/位置保持，随后撤下构造NETWORK；B/C审计保留、禁止复活。A仅指定真实ICHI-001验收账号可见，测试窗口2026-10-07 22:22:46.460+08截止，待实际手机后TAKEDOWN并关闭smoke；期限隐藏不等于timer自动退役。下一轮只补手机/A清理，不重复部署或smoke。

当前源码1353PASS/1既有SKIP、类型/Lint/Next、Playwright26、实际七包287及修复两包84测试PASS。原生模拟器真实生产Marker/详情及私有字段扫描PASS；发现官方图标未挂WXML后补独立来源图标分支并生成新预览，不填造PLAYER头像数组。实际手机PHONE_PENDING，禁止用模拟器充当真机PASS；后续状态以本节和新报告为准。

本轮生产工作集逐项：P3-PA新exact diff、P3-PB两个索引/policy、P3-PC七函数部署、P3-PD关闭的authority/timer、P3-PE三构造smoke、P3-PF公开→期限→真实PLAYER全链均自动验证通过/AWAITING_REVIEW；P3-PG实际手机展示/隐私PHONE_PENDING。各项证据见新报告；仅PG和A清理保留为未完成工作。人工门未通过，不解锁下一阶段。

## 2026-10-06 TASK22 Phase3 本地断点（历史快照；当前生产状态见上节）

用户明确授权从已人工验收Phase2继续执行Phase3。唯一活动区块V2-E / TASK22仍IN_PROGRESS；Phase1/2及地图修复COMPLETE / HUMAN_APPROVED，旧部署和桥接已消费，不重做。Phase3已LOCAL_IMPLEMENTED / LOCAL_GATES_PASS / AWAITING_REVIEW / CLOUD_NOT_APPLIED；Phase4—8、网络采集、真实网络入库、生产新部署及正式微信发布未执行。当前报告：`docs/delivery/v2-e-task-22-phase3-official-network-source.md`，证据：`artifacts/task22/phase3-network-20261006/`；该入口取代下方历史“Phase3未开始”的当前状态描述，不改写旧部署回执。

认知对齐通过：NETWORK_SOURCE保留枚举，sourceMode=OFFICIAL_CURATED、XHS、网络上传、贡献人null；不创建PLAYER Account/Profile，不依赖PLAYER条例。Founder审核只确认准确性，独立item-level rights证明及版本、可信curator/takedown责任和共用公开安全门均须成立。来源使用canonical HTTPS www.xiaohongshu.com/explore/文章ID，无token/query/hash/别名；sourceId由canonical URL派生，不同URL仍分别Resolution。Founder决定、rights、非空备注exact safety来自内部可信决策端口，绑定sourceVersion/contentDigest/reviewVersion/rightsDecisionVersion，并在最终事务复读；未准入/歧义/拒绝留本地，不生成正式V2半成品。

时间政策network-visibility-30d-v1：有可信实拍依据时observedAt取该时刻，否则SOURCE_PUBLISHED_AT_FALLBACK取sourcePublishedAt并保留依据；实拍≤文章发布时间≤fetchedAt≤reviewedAt≤当前时间，均使用规范UTC时间。抓取、审核和验证不刷新observedAt。publicUntil=observedAt+30×24小时，now>=publicUntil时query不返回、detail不可用，history/provenance/audit不删除；新Observation重走门，不改旧时间续命。已准入相同时间版本不能借Founder复审强行relink；纠错工作流留Phase5，不绕过共享Resolution。

公开NETWORK使用public-map-v4的网络上传标签、OFFICIAL_NETWORK图标及期限字段；PLAYER旧v3客户端/后端兼容。实时期限作用于cursor/asOf/includeLowFreshness、离线缓存、准备详情及已经渲染的卡片。网络支撑独立到期，内部有界到期维护复用同一projector；仍有效PLAYER支撑保留原publicLeadId，客户端允许同ID更高servedVersion的PLAYER继续显示；全部支撑退出后新生命周期使用新ID。公开query/detail不join private/source。网络policy版本不匹配时fail closed。

自动验证：当前源码范围Vitest 1347 PASS / 1既有SKIP、Phase3后端37+客户端12专项、旧production集成60；root/Web TypeScript、ESLint、Next build、Playwright26/26、独立compiled ZIP真实Node ESM准入/公开/到期链路通过。190个既有ZIP/资源manifest SHA保持；云端写入、部署、迁移、bridge replay、Git commit/push均0。workflow、上传分享防回退、相关contracts、格式与diff检查均PASS，机器收口回执final-validation.json。未把本地fixture称为真实小红书或生产网络数据，也未制造真机/人工验收证据。

P3-A—P3-F均AWAITING_REVIEW：A联合来源与时间模型，B独立rights/Founder/备注安全exact-version门，C共享domain原子准入，D网络期限/支撑/新ID/下架，E公开v4与客户端缓存/图标兼容，F编译包/哈希保留/集成回归与治理收口。Phase3未解锁collect/review/publish实际workflow、50/300或生产apply。

## 2026-10-06 TASK22 已完成阶段人工验收与下一步

用户明确“22 人工验收完成”。当前已交付Phase1生产后端、Phase2玩家全局持续桥接及截至本日的地图/上传修复记为COMPLETE / HUMAN_APPROVED。下方历史AWAITING_REVIEW是当时快照，由本次明确人工确认取代；原始测试和部署回执不改写。用户未提供设备型号或新的性能数值，不补造人工实测。

TASK22原计划含八Phase，Phase3—8未执行，故TASK22/V2-E整体仍IN_PROGRESS。下一步Phase3为NETWORK_SOURCE / OFFICIAL_CURATED模型、来源权利/审核版本、30天公开期限与统一投影的本地实现和测试；用户当前要求说明执行方法，尚未要求实施Phase3。不重复Phase1/2部署、桥接、迁移或timer开启，不提前采集50/300或执行正式发布。报告：`docs/delivery/v2-e-task-22-report-and-human-acceptance.md`；人工记录：`artifacts/task22/human-acceptance-20261006/acceptance.json`。

## 2026-10-06 完整详情就绪优化

V2-E/TASK22工作集MAP_DETAIL_READY_REUSE_V1：实现、生产query最小应用及原生验证已完成，相关step为AWAITING_REVIEW；当前区块仍IN_PROGRESS，等待Founder真机人工验收。后续Phase和正式微信发布不解锁。

已完成：真实基线/客户端预读不足的耗时取证；2分钟/16项公开准备区和同ID在途合并；首根query可选2条完整安全详情；选中重验/失效/身份/版本/策略/生命周期回归；真实远端query基线最小代码更新一次及17/17源码与配置回读；1338通过/0失败/1既有跳过，typecheck/lint/Next构建通过；原生实际OS两行点击完整资料、手动刷新/失败保留、内外拖动和赏级横滑通过。最终官方预览1048085字节、Playwright全组26通过，分享/workflow/目标格式/diff检查PASS；截图、二维码与最终回执见progress顶部。

验收看实际首选完整内容是否及时、切换记录归属是否正确、下拉能否重读、内部拖动是否保持窗口，以及失效时是否清除详情。2条实际模拟器结果不扩张为全50条秒开或真机P95结论；过期或未准备记录仍走真实详情读取。此轮不重复桥接/迁移、不新建资源、无用户业务数据写入、无Git提交/推送。

## 2026-10-06 重叠列表原生点击传播

V2-E/TASK22工作集MAP_PICKER_NATIVE_TAP_PROPAGATION_V1已CLIENT_IMPLEMENTED + NATIVE_POINTER_VERIFIED / AWAITING_REVIEW。已定位完整触摸路径无row tap，完成两种overlay六处生命周期绑定及外部scrim一处start绑定最小修复；新增4项防回退测试，既有逻辑/内部护栏不变。自动门：1299 PASS/0FAIL/1已有skip、26 Playwright、types/lint/Next、分享/workflow/差异检查。平台门：实际OS点击真实两条对应详情/切换、详情按钮、外部关闭；补充原生事件内部拖动/下拉刷新/失败保留/赏级横滚/外部拖动与独立详情边界。测试方法/SDK已恢复、真实公开记录仍2条，业务数据写入0。正式工作区与官方新版预览1041414B已搭载；人工真机验收待用户，整区块仍IN_PROGRESS，不解锁后续Phase或正式发布。报告docs/delivery/v2-e-task-22-picker-native-tap-propagation-repair.md。

## 2026-10-06 公开读取50并发可靠性

V2-E/TASK22补充PUBLIC_MAP_READ_CONCURRENCY_50_V1已PRODUCTION_APPLIED + FIFTY_RAW_READS_VERIFIED / AWAITING_REVIEW。完成真实SDK初始化/换窗/限额验证、13新增后端回归、50独立记录集成、两个远端候选26定向测试、各自远端ZIP仅consumeRate最小UPDATE_CODE/17源码及配置最终回读。真实生产2条交替50原始SDK突发50/50成功，无应用排队/重试；独立50样例原生列表首8/滚动全50/最多2并发/第50行详情归属通过。临时客户端全局串行已撤除，触摸边界与有界重试保留。1295现行测试PASS/1已有skip、26 Playwright、types/lint/Next通过；分享/workflow及预览最终状态见progress顶部。无业务数据写入/新资源/重复桥接，不解锁50人pilot或后续Phase。报告docs/delivery/v2-e-task-22-public-read-concurrency-50.md；证据artifacts/task22/phase2-read-concurrency-50-20261006/。

## 2026-10-06 重叠列表信息恢复与地图窗口触摸边界（串行措施已被顶部后端修复取代）

V2-E/TASK22补充工作集MAP_PICKER_METADATA_RECOVERY_AND_OVERLAY_TOUCH_BOUNDARY_V1已CLIENT_IMPLEMENTED + REAL_PUBLIC_NATIVE_VERIFIED / AWAITING_REVIEW：生产详情RPC共享串行/瞬时有界重试、可视列表下拉刷新/失败保留与失效移除、地图overlay内部触摸隔离和外部关闭均完成。1282现行测试/1已有skip、types/lint/Next/26 Playwright/分享/workflow/差异及原生真实两条三轮读取、失败刷新、组合/独立详情内外触摸、原赏级滚动通过。官方预览1041933B/工作区搭载，区块整体仍IN_PROGRESS，未正式发布或部署/迁移。报告docs/delivery/v2-e-task-22-picker-metadata-recovery-and-overlay-touch-boundary.md；证据artifacts/task22/phase2-picker-recovery-touch-20261006/。

## 2026-10-05 Marker标签收紧与重叠列表两行信息

V2-E/TASK22当前补充工作集MAP_MARKER_COMPACT_TAGS_AND_PICKER_METADATA_V1已CLIENT_IMPLEMENTED + NATIVE_VERIFIED / AWAITING_REVIEW：共同Canvas标签随文字收紧，列表首行主题/标签同基线且超长省略，次行安全公开备注与可信首次上传时间；既有公开详情有界可视行加载、生命周期隔离和图片缓存键已接通。1269现行回归/75最终针对、类型/Lint/Next/分享/workflow/差异门通过；真实公开记录备注时间、隔离3行选择及20行滚动/2并发/关闭迟到验证通过，截图与官方预览1038468B完成。工作区已搭载，无生产部署或历史迁移，未正式发布；区块仍IN_PROGRESS。报告docs/delivery/v2-e-task-22-marker-compact-tags-and-picker-metadata.md；证据artifacts/task22/phase2-marker-picker-20261005/。

## 2026-10-05 详情卡片赏级按列正序

当前V2-E/TASK22附加工作集MAP_DETAIL_COLUMN_FIRST_TIERS_V1已CLIENT_IMPLEMENTED + NATIVE_VERIFIED / AWAITING_REVIEW：原生详情赏级网格按列先上后下填充；既有布局断言及自然顺序测试表述同步；343相关回归、类型/Lint/Next构建、分享/工作流门与原生实际19赏级几何、横向滑动、奇数尾列及隔离5项验证通过；更新截图和正式工作区预览1030941B已完成。保留现有赏级字段、两排尺寸和服务端数据。区块仍IN_PROGRESS，不解锁后续Phase或正式发布。报告docs/delivery/v2-e-task-22-map-detail-column-first-tier-layout.md；证据artifacts/task22/phase2-map-tier-columns-20261005/。

## 2026-10-05 地图定位与刷新入口恢复

MAP_RECOVERY_CONTROLS_ALWAYS_AVAILABLE_V1已CLIENT_IMPLEMENTED + NATIVE_VERIFIED / AWAITING_REVIEW，V2-E/TASK22唯一活动区块仍IN_PROGRESS。原WXML把筛空/搜索空/零选、首次加载、服务错误和native渲染错误耦合到浮动控件的卸载条件，当前已解耦；大致位置本身不是根因。现在只有实际详情壳、重叠列表或modal覆盖时暂时隐藏，关闭后恢复；陈旧cardPhase但sheet CLOSED/detail IDLE不再误隐藏。保留map内原生cover-view及原按钮几何/绑定、重复请求保护、模糊定位和分享合同。34新用例/295home/1252现行PASS、0FAIL/1已有pending，type/lint/Next/分享/工作流/差异及原生20状态/真实定位与刷新点击/详情关闭恢复PASS；SDK恢复、fixture清除、点圆0。正式开发工作区和预览已搭载，包1030938B；本轮无生产部署、配置或用户记录变更，不重复此前部署或桥接，正式微信发布/后续Phase仍锁定。报告docs/delivery/v2-e-task-22-map-controls-availability-repair.md；证据artifacts/task22/phase2-map-controls-20261005/。 本工作集自动门通过，不代替整个V2-E区块的人工验收。

## 2026-10-04 生产桥接恢复（当前）

MAP_FIRST_OPEN_AND_DETAIL_LATENCY_V1工作集已完成自动与原生验证，AWAITING_REVIEW，V2-E/TASK22仍IN_PROGRESS：基线已读、两精确候选公共读取用例22PASS、现行回归1218PASS/0FAIL/1已有pending、最后home261PASS、type/lint/Next/平台/分享与工作流门PASS；两次最小production UPDATE_CODE已消费且17源码及配置回读PASS，不得重做。原生首页预加载、顶部初始状态、真实markertap即时概要、完整真实详情、SDK恢复及预览PASS。正式微信发布和后续Phase没有解锁，报告docs/delivery/v2-e-task-22-map-first-open-and-detail-latency-repair.md。

CURRENT_LOCATION_APPROXIMATE_ALLOWED_V1追加工作集在同活动V2-E/TASK22内已完成自动验证、AWAITING_REVIEW（区块整体IN_PROGRESS）：按用户保留模糊定位要求移除个人地图精确权限/≤100米硬门，增加大致位置说明与有效误差圆，保持非法坐标/API错误/生命周期/独立计数防护；验证模糊权限仍可定位、粗定位圈、未知精度不伪造范围、精确回执与清理。当前145针对/1208回归、types/lint/Next/官方预览及原生模糊/粗/精确/未知/迟到定位PASS；前轮1175证据保留为历史，当前报告docs/delivery/v2-e-task-22-approximate-location-support.md。

DIRECT_UPLOAD_NOTE_RETRY补充工作集（本活动区块AWAITING_REVIEW）：生产真实备注API与V1完成态前门已只读回查，无重复部署；direct确认快照/原位置/恢复key、失败本地卡片、既有备注弹窗分流、同job重试和首次提交onShow并发保护已实现。153项定向及最终1158项全回归通过，覆盖risky/review/空回复/接口异常无V1完成记录、释放后同job重试、只消耗一次额度、重启不重发旧备注、sharing接点不改。types/lint/Next/CloudBase和正式原生编译通过；三态隔离原生UI/数量/失败修改重试通过，fixture生产写入0并恢复原storage及真实云端读取。交付docs/delivery/v2-e-task-22-direct-upload-note-review-and-retry.md，客户端正式发布及后续Phase未解锁。

地图资料接点已生产应用并真实验证：CUFZBP公开昵称001、头像副本与本人原头像字节一致、备注“测试”、剩余43抽，uploadedAt=2026-10-03T09:55:25.907Z（北京时间17:55），observedAt=09:54:23.351Z（17:54）保持Freshness依据。本人实际调用安全核验得到NOTE_PASSED后，仅既有全局timer处理LEGACY_NOTE_AUDITED事件APPLIED/admitted=true；手动worker/drain=0，真实ACCEPT=0，V1原记录未改。详情只消费公开投影。证据artifacts/task22/phase2-map-display-audit-20261004/owner-notes-timer.json与native-real-metadata-qa.json；独立报告docs/delivery/v2-e-task-22-map-display-and-public-metadata-audit.md。

MAP_DISPLAY_AND_METADATA_AUDIT补充（本活动区块，PRODUCTION_APPLIED / REAL_NATIVE_VERIFIED / AWAITING_REVIEW）：本人当前profile安全投影、独立头像副本、旧direct备注实际补审、uploadedAt明确标签、profile变更持久唤醒和账号删除副本清理；举报按用户已确认active普通账号规则，显式封禁/异常不计数，10不同合格用户隐藏。五函数各自真实ZIP最小更新，冻结core/entry不变；实际CUFZBP卡片及GET_STATE/隔离重叠测试，真实举报0。自动门：防分享回退/workflow、全Vitest、types/lint/Next、原生小程序编译/真实平台接点。不得解锁Phase3或替用户接受条例。


当前同区块附加步骤：只读比较真实V1/profile与安全公开投影；检查全部Marker/筛选/数量/重叠列表与卡片字段；补可信资料与安全头像副本、direct exact备注审核读取、可信上传时间显示及元数据持久刷新；针对上述隐私/错归属/旧审核/时间不续命/删除回归，按实际远端ZIP最小应用并读回；实际生产1条与隔离重叠样本平台验证分别标注；完整必要回归/构建/工作流收口。举报资格已按Founder确认的正常active账号规则实施，不为测试写真实用户举报。

V2-E/TASK22 Phase2当前恢复工作集已工程闭合：真实v3接受/只读26条具体preview、producer先启、有界consent/source处理、真实V1→正式V2→PUBLIC、生产query/detail/client Marker、全局每分钟timer回读和连续9次运行均通过。新增query顺序事务读取修复45/45回归及SDK验收通过；最终源码/配置/控制回读与工作流证据见本轮报告。Phase2记PRODUCTION_APPLIED / LIVE_BRIDGE_VERIFIED / GLOBAL_CONTINUOUS_ENABLED / AWAITING_REVIEW；用户本轮恢复指令已授权具体合格小批量，不重复审批。

P2-A—P2-F原本地/资源/部署门沿用已通过证据；本轮仅补实际历史1条、Marker与continuous生产门，不重做13动作或7候选部署。桥接适用全体账号，不需要逐账号配置；必须是各账号本人真实当前同意。Phase3/NETWORK/50/300/正式微信发布未解锁，TASK22及V2-E整体仍IN_PROGRESS。解锁后续区块前对旧SHARE/DO_NOT_SHARE及逐条流程引用认知对齐，统一使用账号当前范围派生权限、V2准入即投影。

## 2026-10-03 条例覆盖已上传V1（范围仍现行；暂停状态已被顶部恢复取代）

当前TASK22同一区块补正工作集：先明示条例覆盖本人此前及以后已上传记录；修正账号级同意与旧V1准入、条例扫描；增加无逐条字段的合格上传转换、旧同意不升格、private_saved/删除/错误账号拒绝的回归；新v3正文/scope本地绑定、三函数真实ZIP增量部署、政策CAS、实际平台隔离样本与只读preview。无新分享按钮，不执行真实用户ACCEPT，不重做已完成资源，不启历史批次/continuous。

上述工作集自动验证及正式三函数/政策增量已完成，状态AWAITING_REVIEW；1239 PASS/1 SKIP、19/22/22源码配置回读、实际隔离6/6和真实完成上传的全链路只读假设4/4通过。未执行真实用户接受或迁移；后续恢复顺序以progress顶部为准，原设备补送不再作为历史完成上传的前置门。

## 2026-10-03 V2准入即自动地图（历史；v3范围及状态以顶部为准）

本轮TASK22工作集：审计当前正常路径及历史冲突；将SOURCE/RESOLVE/PROJECT合成为V1→V2准入预计算并在最终事务重新验证快照，一次提交合格V2来源及地图投影；为真实条例接受注册有界持久来源扫描；为迟到的原上传意图连接幂等source事件；扩充防回退与语义回归；按当前各函数真实ZIP最小部署、回读及只读preview。不得伪造设备意图、自动批准历史具体批次、解除既有持续桥接/公开启停门。

本轮工程修复PRODUCTION_APPLIED，四函数8/18/21/21文件回读、旧选择服务关闭、真实非空RPC及原子准入4项、SDK持久唤醒与公平扫描8项、全套1233 PASS/1 SKIP均已通过。真实26条只读合格0，原设备意图补送/具体真实批次/实际Marker/continuous仍按原断点推进；本区块不解锁后续Phase。

## 2026-10-03 V1 上传／V2 转化修复（历史；以本页顶部最新记录为准）

TASK22当前局部修复：先统一V1上传成功及V2转化定义；补V1原上传原子意图保存、设备重试和直接备注安全检查；同步正式条例版本；验证无consent仍能V1成功、真实consent后V2转化、拒绝风险备注、核验恢复／公平队列、防旧按钮回退。最小生产部署、政策CAS及读回记录独立归档。原真实历史小批量、continuous与微信正式发布门不因修复解锁，真实非空桥接端到端不能以本地测试替代。

本轮上述代码/政策最小生产应用及源码/配置回读已PASS，实际条例连续3/3、CUFZBP已上传显示、微信当前预览及1219自动测试通过。后续按顺序：原设备自动补送已有意图并只读复查；合格具体小批量预览与Founder批准；补账号条例接受/意图迟到后的持久重入队；验证非空drain→worker及真实全链路；最后按原门开启continuous。当前26条只读preview合格0，不执行无合格输入的迁移。下方未接通状态和逐记录GET证明要求为本轮前历史，正式客户端已由V1持久意图接点替代。

## 2026-10-03 TASK22 分享接点审计（历史；生产状态与实现以本页顶部为准）

当前授权仅核查并修复本地接点、全局认知与防回退，不恢复生产历史迁移或continuous。已补云端核验重试／照片重传／备注重审后的既有授权重试、并发新触发串行后续批次、等待队列公平轮转、直接上传本地缓存失败不丢已确认意图；没有从旧列表新增授权。已有SHARE必须证明当前条例与权利，不再通过公开通用选择API驱动产品。

自动门：完整测试1213 PASS/1既有SKIP、26项页面回归、新治理门及其故意回退失败测试；构建／Lint／types／包审计／保护核查以本次审计报告为准。局部状态AWAITING_REVIEW，不替代production/真机总门。

恢复TASK22必须完成：v2正式条例/scope及真实微信调用；在服务器上传确认时持久接收本条明确意图，核验后不依赖客户端重开即可处理；GET返回当前授权证明及仅对明确新上传意图的旧scope续认路径；非空drain→worker、真实具体preview／批次批准与完整链路、最后continuous。不得用独立分享选择或二次发布按钮弥补任何后台接点。不得重做已通过资源/七函数/事务timer充当新证据。

## 2026-10-03 TASK22 Phase2 分享上传路径局部修订

当前仅执行Founder授权的本地分享流程修订，生产迁移/continuous保留暂停断点。路径：决定收手→现有分享弹窗→拍摄赏票→原上传确认记录本条SHARE/rights意图→权威核验通过且当前条例/公开门成立→自动投影；仅上传由原确认上传同样记录意图。本人列表和成功弹窗不再提供独立地图分享按钮。暂不分享/继续抽赏不产生授权，账号同意不批量公开历史。

本地工作与自动验证：条例/弹窗文案；隐藏额外入口并移除相关控制器；仅明确上传才入持久待授权队列、核验/同意/重启后自动重试，网络失败保留、已有私有选择不得覆盖、旧scope不冒充当前授权；DRAW/UPLOAD两路径与V1回归、WXML平台编译、Next构建及Playwright。条例v2/scope候选独立保存，production仍使用先前v1，不能覆盖冻结artifact或认为已部署。

恢复生产任务时先修条例真实调用并应用批准的新条例/scope，验证正常上传自动落逐条授权及drain→worker transport，再取得具体真实preview/批次批准。无需要求用户再点“我确认有权分享，并分享至地图”；历史20条private_saved仍不默认公开。局部自动门通过记AWAITING_REVIEW，不替代微信/历史桥接总门。

局部验证状态：LOCAL_GATES_PASS / AWAITING_REVIEW，1193 PASS+1既有SKIP、Next构建、Playwright26/26、官方WXML编译；单按钮成功弹窗包含服务端回执/待同步两状态。新版条例与scope为独立未应用候选，production验证及历史/continuous暂停。UI截图使用隔离开发者工具本地状态，验收与下一恢复位置见docs/delivery/v2-e-task-22-phase2-sharing-upload-flow-simplification.md。

## 2026-10-03 TASK22 Phase2 当前执行门

P2-A—P2-F在V2-E活动区块内继续生产应用。Founder已解锁13资源动作、3新函数CREATE/4 V1最小UPDATE_CODE、关闭timer与CloudBase真实事务/并发/provenance验证、正式terms/scope/公开位置与production client、真实历史只读preview；continuous bridge在验证通过后开启。公开定位参数0.001°网格、accuracy≤100米已确认。历史迁移具体批次仍为后续人工门：先形成preview/skip清单与精确batch，再批准执行。Phase3/NETWORK/50/300/微信发布不得提前实施。cloud readback和live验证证据存artifacts/task22/phase2-live，旧本地证据保持。

## 2026-10-03 TASK22 Phase2｜统一PLAYER来源与持续桥接（当前活动工作集）

Founder明确指令“执行TASK22 Phase2”。唯一活动区块仍V2-E；TASK22 = IN_PROGRESS / PHASE2_LOCAL_IMPLEMENTED / LOCAL_GATES_PASS / AWAITING_REVIEW / CLOUD_NOT_APPLIED / PRODUCTION_DISABLED。P2-A—P2-F均为AWAITING_REVIEW；已完成当前授权的本地实现、独立部署候选、回归与只读审计，真实资源apply/部署/历史迁移/平台验收/开启尚未执行，不能标Phase2/TASK22 COMPLETE。Phase3及NETWORK/采集/50/300/release继续LOCKED。

认知对齐：Phase1-D4的InvokeResult、嵌套EipConfig、512disk与依赖安装差异仅影响部署适配，不改变产品/隐私/identity合同；旧key不轮换，Founder既有风险接受/轮换豁免仍有效。V1实际四个远端函数保留不同历史shared runtime；本轮仅基于各自原始远端ZIP加入目标hook和producer，无关文件逐SHA不变，不能把当前本地shared runtime全量覆盖线上。

实施：P2-A服务端当前PLAYER归一、exact APPROVED draw/finalized direct、SHARE+current terms/scope+rights+APPROXIMATE policy门；P2-B发布/note重审/删除同V1事务dirty outbox、hide-first/revision fence；P2-C SOURCE→RESOLVE→PROJECT复用冻结domain、95 doc budget/8次有界retry/dead-letter/签名replay；P2-D只读historical preview及逐条授权重检/pending-applied幂等；P2-E全量隐私/V1/平台包回归；P2-F4集合/4非TTL索引/1关闭control、7独立ZIP、4真实remote rollback包与最小外部动作清单。

来源规则：DRAW只读P1发布指针对应exact prize-ticket APPROVED版本，核验owner/record/board/version、照片/位置、唯一draw events减法和事实身份；UPLOAD不用伪造draw。R2无制造商初始票位，initialRemainingTickets=null，首次P1余票只用于私有减法。observedAt保留原证据，不由verifiedAt/ingest/retry续命；非事实图片清理/诊断字段不制造新sourceVersion。历史没有每记录SHARE/适用地图条例/rights就SKIP；私有定位consent不是地图授权。默认公共数值位置policy=null，不默认EXACT，不复制shadow consent或假Profile。

生命周期：同lineage兼容location/identity/单调余票延续已建立关联，hard conflict需人工纠错；多人支持复用原projector，旧公开ID不复活。账号删除在原V1事务设置Account tombstone及全局read-stop，然后有界扫支持；worker不自动解除屏障，恢复须另批。timer事件字段不作为授权，候选要求平台env和可信invocation environment两者TRIGGER_SRC=timer、无client principal；live形态未验证前拒绝并保持CLOSE。drain最多20项且45秒停止调度更多调用，未完成事件保留。

验证：新增36/36桥接测试；full Vitest1176PASS+1既有SKIP；Lint/typecheck/contracts/workflow PASS；Next build PASS；Playwright26/26 PASS。7/7artifact逐文件SHA/V1无关文件保持；实际packaged runtime合成5/5；Node20.19.5+wx-server-sdk4.0.2入口ABI7/7，新3函数disabled smoke PASS。SDK本地ABI/fixture不代替live事务并发、timer、客户端与真实历史授权验收。

本轮云端写0/函数invoke0/真实迁移0/新secret生成绑定0/Git提交推送0。只读确认4新集合ABSENT、3新函数ABSENT、Phase1九函数ENABLED=false；4 V1原始ZIP已下载并实际secret扫描0，原secret值/下载URL不记录。Phase1与其他既有基线保持。独立报告：docs/delivery/v2-e-task-22-phase2-local-implementation-and-external-action-review.md；证据：artifacts/task22/phase2。下一最小审批为minimum-external-action-batch.json / PHASE2-A-RESOURCE-ONLY：仅4ADMINONLY集合、4非TTL索引、1全关闭control行，共13声明动作、业务/public新增0；其它外部动作独立审批。

最终保护与泄漏检查：本轮138文件/110ZIP内文件实际secret匹配0，1199受保护历史输入drift0；详情artifacts/task22/phase2/final-protection-and-secret-scan.json。历史identity风险接受记录不改，不宣称此前暴露事件已修复。

以下Phase2 LOCKED或Phase1 current文字为本轮指令前历史，以本节为当前入口。

### Phase2工作集与门禁

| Step | 自动验证 | 当前状态 |
| --- | --- | --- |
| P2-A source/schema/authorization | exact version/身份/减法/R2未知/SHARE/consent/rights/location/note反例 | AWAITING_REVIEW |
| P2-B V1原子producer | finalize/note/delete真实handler fixture、关闭态V1全回归、事务crash | AWAITING_REVIEW |
| P2-C worker/domain/recovery | hide-first/续版本/冲突/多人/tombstone/late/replay/签名与预算 | AWAITING_REVIEW |
| P2-D历史候选 | dry-run写0、缺授权skip、pending/applied幂等、回滚SHA | AWAITING_REVIEW |
| P2-E集成回归 | 1176PASS+1既有SKIP、Next/Playwright26、Lint/types/contracts | AWAITING_REVIEW |
| P2-F候选交付 | 7artifact/5packaged cases/Node20 SDKABI、4remote原包、13动作资源清单 | AWAITING_REVIEW |
| P2-EXTERNAL资源/部署/真实迁移/启用 | fresh preflight + exact批准 + live read-back/平台验收 | NOT_STARTED / EXTERNAL_ACTION_APPROVAL_REQUIRED |

区块仍未完成，当前不进行下一个Phase认知传播/解锁。与后续相关的新认知仅记录在本轮：原始V1版本异构、R2初始票位未知、same-lineage保留原观察时间、账号删除读屏障、timer真实context待验；Phase6整体验收前候选合同不标最终冻结。

## 2026-10-03 TASK22 Phase1-D4｜9/9部署、回读与关闭态验收完成（当前权威状态）

Founder《自主解决部署问题直到9函数全部完成总命令》已执行完毕。9/9 production functions Active，最终9/9 source/config回读PASS，每个17个批准文件逐SHA一致，20/20 logical secret bindings READY/BOUND，9/9 disabled smoke SERVICE_UNAVAILABLE / InvokeResult0。官方Manager5.9.0高层→TCB CreateFunction/EnvId；补齐PublicNetConfig={PublicNetStatus:ENABLE,EipConfig:{EipStatus:DISABLE}}，普通公网保留、固定EIP关闭。业务源码/9ZIP/proposal/manifest/batch及SHA均未改；平台安装依赖与下载包CodeSha一致，批准应用文件全部一致。

本轮accepted CREATE9/rejected0/CREATE retry0/UpdateCode0/UpdateConfig0/Delete0，20bindings随创建完成；invoke11（初次smoke本地字段误判1、只读结构诊断1、恢复后9个正式验证）。旧执行器检查不存在的RetCode，已确认实际InvokeResult并修正；首函数业务响应一直正确。恢复只在内存读取本轮首函数现有binding，2把新key各仅生成一次，不重新生成/轮换。旧IDENTITY及13V1消费者一致/未改，Founder RISK_ACCEPTED_BY_FOUNDER / SECRET_UNCHANGED / ROTATION_WAIVED不变。

最终postflight 2026-10-03T06:54:54.037Z / 118只读回执PASS：production14集合/23explicit nonTTL/14ADMINONLY、13业务集合全部0、controls4完整不变/read-stoptrue/featuresfalse/HApausedtrue/epoch1/PUBLIC0；V1 STRUCTURAL_DIFF0、shadow UNCHANGED/SAFE_STOP/read-stoptrue/HApausedtrue/epoch41/PUBLIC0/flagsfalse/callers空，Storage/rules/环境结构不变。9函数ENABLED=false。实际secret值及编码变体扫描项目source/artifacts/docs/memory-bank/完整Git diff，落盘0；1176受保护输入最终drift0。离线ABI验证曾重写历史Node版本字段，已精确恢复会话前SHA，本轮结果另存，不留历史证据漂移。

本地Manager9包/5类脱敏/8护栏检查、artifact9、dry-run6、SDK ABI、全量1140PASS+1既有SKIP、Next构建、Playwright26/26、workflow/diff-check均PASS。没有操作浏览器UI或真机，不宣称生产客户端、桥接或正式发布验收。Git commit/push0。

TASK22=IN_PROGRESS / PHASE1_D_COMPLETE / PRODUCTION_DISABLED / PHASE2_LOCKED；V2-E仍唯一活动区块。当前授权工作集全部完成；Phase2/continuous bridge/historical migration/NETWORK/XHS/上海50/全国300/client release/正式微信发布保持LOCKED，等待下一条明确指令，不自动解锁。独立报告：docs/delivery/v2-e-task-22-phase1d4-production-functions-final-deploy-closeout.md；机器证据：artifacts/task22/phase1d4-final。下一步建议Founder审阅收口后明确授权Phase2，再执行该Phase认知对齐；9函数部署gate已通过，不把TASK22整体标COMPLETE。

以下旧STOP/未部署/secret另批文字均为被本轮执行承接的历史，不覆盖本段。

## 2026-10-03 TASK22 Phase1-D4｜自主修复直到9函数完成（本轮授权记录，已执行）

Founder本轮明确要求执行《Phase1-D4自主解决部署问题直到9函数全部完成总命令》。该新授权覆盖此前单次失败即STOP、禁止重试/补参/切换部署通道/修复性更新的阶段限制；旧D4及D2/D3报告保留为历史，不回填未恢复的旧错误。唯一活动区块仍V2-E / TASK22 Phase1；当前工作集为部署执行器修复、query首函数验证、余8函数连续部署、全部remote source/config/20 logical bindings回读、关闭态smoke、数据与V1/shadow不变量、secret扫描及独立收口。普通工程错误自主修复和安全重试；仅总命令列明的破坏性资源/核心合同/真实泄漏/数据丢失或无可行替代的权限配额限制才停止。

只调整部署/打包/运行参数，优先9个frozen ZIP，不改产品语义。公网ENABLE、固定出口EIP DISABLE；官方Manager高层优先，必要时可TCB/SCF通道补齐合法参数。允许本轮新production目标的Create/UpdateCode/UpdateConfiguration及绑定修复，禁止删除既有资源。IDENTITY_HMAC_KEY复用旧值；新authority→9/cursor→2随机key仅内存生成/注入，20bindings只记录logical name与PRESENT/BOUND；Founder既有identity风险接受与不轮换决定不变。

IN_PROGRESS / DEPLOYMENT_REPAIR；最终完成标准9/9 DEPLOYED + readback PASS + disabled smoke PASS。全过程ENABLED=false/read-stop=true/features=false/business rows0/PUBLIC0，Phase2/bridge/NETWORK/50/300/client release/正式微信发布LOCKED；Git commit/push0。新操作证据artifacts/task22/phase1d4-final；最终独立报告docs/delivery/v2-e-task-22-phase1d4-production-functions-final-deploy-closeout.md。以下STOP/尚未授权文字均为被本轮授权承接的历史状态。

## 2026-10-03 TASK22 Phase1-D4｜官方高层首函数拒绝 / EipConfig明确 / STOP（当前状态）

Founder停止D2/D3具体字段恢复，记CLOSED_BY_FOUNDER / EXACT_FIELDS_UNRECOVERABLE，不回填旧根因。最新授权已执行：隔离官方@cloudbase/manager-node5.9.0 functions.createFunction({func,base64Code,force:false})实际TCB/EnvId创建首函数query-public-map-leads一次，未用commonService/scfService CREATE或Namespace创建。TCB外层FailedOperation，完整脱敏message包含SCF内层MissingParameter“请求缺少必要参数：EipConfig。”；外层RequestId=c8b395fe-ca1a-46ba-afa5-6297ca555ebc、内层=09fcb6a8-d0d0-4d76-80de-8318ca2b79c0。本轮具体缺失字段EipConfig确证，问题未修复；首函数STOP_PROBE_FAILED，其余8未执行，重试0，不补参/覆盖/删除。

pre2026-10-03T14:26:36+08:00/post14:27:54+08:00各118只读回查PASS：生产14集合/23explicit非TTL/14ADMINONLY/13业务Count0/controls4完整不变/read-stoptrue/featuresfalse/HApausedtrue/epoch1/PUBLIC0。28既有函数完整config/trigger/layer回读，19V1稳定配置与9shadow历史结构/环境摘要、本轮pre/post完整稳定一致；V1 structural diff0，shadow停机/HA pause/epoch41/PUBLIC0/flagsfalse/callers空，Storage/rules/environment结构不变，正常Count/Size增长仅记录。9production targets全ABSENT，functions0/9、accepted bindings0/20、源码回查与disabled smoke因CREATE拒绝NOT_RUN。新SDK高层9包离线参数映射/脱敏5编码/禁止重复CREATE及自动删除更新护栏PASS。

本轮CREATE1/rejected1/accepted0/invoke0/业务写0/其它修改0/重试0；2把新key各一次32bytes随机仅内存生成且未绑定，旧identity与13V1消费者未改；实际secret扫描0，报告后再次扫描并释放进程引用。Founder RISK_ACCEPTED_BY_FOUNDER / SECRET_UNCHANGED / ROTATION_WAIVED不变。748受保护文件drift0、frozen9ZIP/source/proposal/manifest/batch与历史证据不变，四份正式事实源已同步；Git commit/push0。TASK22=IN_PROGRESS / PHASE1_D_STOP_PROBE_FAILED / PRODUCTION_NOT_ACTIVE；Phase2/NETWORK/50/300LOCKED。

独立执行报告：docs/delivery/v2-e-task-22-phase1d4-official-manager-deploy-readback.md；blocker：docs/delivery/v2-e-task-22-phase1d4-probe-blocker.md；新操作产物artifacts/task22/phase1d4。下一候选只涉及隔离脚本的EipConfig必需结构，尚未实现/授权新CREATE；不得因具体字段已取得自动补参重试。下方D3与本轮授权准备为历史记录。

## 2026-10-03 TASK22 Phase1-D4｜当前官方 Manager 高层创建授权（当前工作集）

Founder明确停止继续追查D2/D3具体MissingParameter，旧字段恢复任务记CLOSED_BY_FOUNDER / EXACT_FIELD_UNRECOVERABLE，不宣称根因已确证。新授权覆盖：隔离安装当前官方@cloudbase/manager-node5.9.0，实际调用functions.createFunction({func,base64Code,force:false})；禁止commonService/scfService直调CreateFunction与Namespace创建路径。只部署原frozen9ZIP/config与20secret binding合同；先query完整CREATE/binding/source read-back/disabled smoke/数据不变量通过后自动串行其余8，不再询问。首函数失败保存完整脱敏Error.Code/Error.Message/字段名并STOP；任何后续失败STOP，不覆盖/删除/重试。

唯一活动仍V2-E/TASK22 Phase1，当前PHASE1_D4=IN_PROGRESS / ISOLATED_EXECUTOR_PREPARATION。当前官方SDK创建自动EnvId/Stamp/CLS字段转换；其DiskSize不在透传白名单，提供frozen diskSize=512并要求实际read-back=512，禁止自加低层参数或改变合同。SDK自动清理/覆盖/递归重建必须由只允许一次CREATE的只读监测护栏阻断；护栏不改SDK创建payload。secret内存读取/生成/注入，值及其hash不输出、不落盘。身份旧key与13V1consumer不变，Founder风险接受记录不变；函数ENABLED=false/control不改/业务写0/Phase2LOCKED。无Git提交/推送。独立产物：artifacts/task22/phase1d4；独立报告：docs/delivery/v2-e-task-22-phase1d4-official-manager-deploy-readback.md。

## 2026-10-03 TASK22 Phase1-D3｜根因排查未完成 / 精确服务器字段未取得（当前补充）

2026-10-03登录后断点续查：ego-browser只读取得D2/D3两条指定CreateFunction审计事件，RequestId/时间匹配、apiErrorMessage=MissingParameter；两条requestParameters/responseElements解码均为空对象，未保存具体字段或Error.Message。CAM errorMessage="permission verify"不能作为CREATE错误说明。EXACT_SERVER_ERROR=WAITING_PLATFORM_PARAMETER_DETAIL，根因仍未确证。官方manager-node5.9.0新增线索为TCB CreateFunction/EnvId，而本地冻结SDK为SCF/Namespace；此差异不证明根因或新路径成功，不升级/改请求/发探针。原TaskSpace1只读查询结束已finish；本轮cloud writes0/CREATE0/secret操作0，不重复旧离线/云端回归。独立报告：docs/delivery/v2-e-task-22-phase1d3-console-root-cause-continuation.md；安全证据：artifacts/task22/phase1d3-root-cause-check/d2-audit-safe-record.json、d3-audit-safe-record.json。

用户明确纠正：没有确证不能视为根因任务收口。此前“READ_ONLY_ROOT_CAUSE_CHECK完成”撤回，当前 `ROOT_CAUSE_INVESTIGATION=INCOMPLETE / EXACT_CAUSE_NOT_IDENTIFIED`；只保留本地wire和诊断覆盖校验PASS。续查CloudAudit DescribeEvents仍AuthFailure.UnauthorizedOperation，TCB SearchClsLog按2条失败RequestId精确查找READ_PASS/Results0；两条原始CREATE Error.Message仍未恢复。任务未完成，不以本地PASS替代根因确证，不新增CREATE或secret操作。续查证据：artifacts/task22/phase1d3-root-cause-check/error-detail-recovery.json。

用户本轮仅要求“检查根因”。D2/D3离线HTTP正文重放PASS（dummy signing credentials / 非secret占位值 / socket0 / CREATE network0）：Param容器、字段序列化、冻结ZIP字节、Action/Version/Region/Content-Type/Content-Length正确。此证明仅限本地重放，不是历史真实wire或平台接收证明。Stamp/CLS补齐后仍失败，不能认定完整根因；历史成功目录路径默认COS，与D2/D3内嵌ZIP仍有未验证差异，SDK公开支持ZIP，不能无证据改称不支持。

历史D3纯error extractor的16例离线验证PASS：白名单缺5个COS字段且区分大小写，`parameterNames=[]`不能证明原Message无字段；原Error.Message未保存，无法从旧回执恢复。按2个失败RequestId进行精确CloudAudit只读查询共4次，均AuthFailure.UnauthorizedOperation；此是审计读取限制，不是CREATE失败根因。`EXACT_SERVER_ROOT_CAUSE=NOT_CONFIRMED / AUDIT_READ_REJECTED`，先获取现有事件具体Error.Message/参数名再评审修复候选，不盲发CREATE。

分页只读函数列表28个既有函数/9production targets全ABSENT；本轮不重做V1/数据库/Storage/shadow full postflight，完整结构与停机状态仍引用上轮D3证据。本轮cloud writes0/CREATE attempts0/invokes0/new secrets0/bindings0/business writes0；旧identity secret未读取或改动，Founder RISK_ACCEPTED_BY_FOUNDER / SECRET_UNCHANGED / ROTATION_WAIVED继续有效。PHASE1_D_PRODUCTION_FUNCTIONS=STOP_PROBE_FAILED / FIRST_CREATE_REJECTED / NOT_DEPLOYED，Phase2LOCKED；不新增解锁或部署授权。

本地排除项已完成自动验证；根因定位任务未完成，不能据此通过验收。后续证据任务只读取得2个既有RequestId的具体错误描述，验证脱敏诊断候选；精确根因与候选通过前维持STOP，不安排新的CREATE试错。

[独立根因检查报告](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1d3-missing-parameter-root-cause-investigation.md>)；本轮机器证据见artifacts/task22/phase1d3-root-cause-check/。自动验证：workflow/diff-check/离线诊断覆盖/脚本语法PASS；732受保护文件drift0、12冻结输入（含9ZIP）hash精确。此验证不代表服务器根因已确证或部署成功。

## 2026-10-03 TASK22 Phase1-D3｜Probe rejected / STOP（当前权威状态）

Founder授权本轮溯源历史真实成功transport、修复调用映射、重新生成两把production-only key、复用旧identity key，并在query单函数CREATE/binding/source/smoke/数据不变量全PASS后自动续余8个。已恢复TASK19真实MCP→Manager create/update记录，明确历史zipFile被忽略和staging修复；V1最初CREATE格式不能从仓库恢复。当前SDK本地截获9包request构造PASS（CREATE network0），确认D2绕过wrapper遗漏Stamp/CLS映射。初评HIGH限本地成功路径合同；补齐后的云端probe仍失败，完整MissingParameter根因HIGH已撤回，当前`ROOT_CAUSE_CONFIDENCE=NOT_CONFIRMED_AFTER_REJECTED_PROBE`，不得写成根因修复。

D3 preflight 2026-10-03T01:20:22+08:00完整PASS：production14/23explicit nonTTL/14ADMINONLY/13业务Count0/control4/read-stoptrue/featuresfalse/haPausedtrue/epoch1/PUBLIC0；9targets全ABSENT。V1 13collections/43indexes（历史含auto统计）/13ACL/19stable functions、所有既有28函数完整config/trigger/layer、40集合index/ACL、Storage/rules/environment资源结构均不变；正常Count/Size仅记录。13V1 identity consumers内存值一致，旧密钥/V1消费者未改，Founder `RISK_ACCEPTED_BY_FOUNDER / SECRET_UNCHANGED / ROTATION_WAIVED`继续有效，暴露未被写成修复。

2026-10-03T01:21:05+08:00首个query CREATE仍被拒绝：MissingParameter，RequestId `e9762b39-752e-4c1f-a522-a583e9fb8134`。保存了脱敏field/type/presence、Code来源、Environment key names、完整error code/RequestId；未提取到具体parameter name，记录为诊断缺口。按probe failure门立即STOP，剩余8NOT_ATTEMPTED，未续写/force/清理/修改artifact/再生成或换key。外部写attempt1/accepted0、functions0/9、bindings0/20、partial deploy=false、remote source9NOT_RUN、smoke9NOT_CALLED、invokes0、business/control/identity writes0。

postflight 2026-10-03T01:22:49+08:00完整PASS：9targets仍全ABSENT，production14collections/23explicit indexes/14ADMINONLY/13empty/control4完整不变/epoch1/PUBLIC0；V1 structural diff0，shadowread-stoptrue/HApausedtrue/epoch41/PUBLIC0/flagsfalse/callers空，Storage/rules不变。artifact validator9 PASS、resource/schema/API dry-run6 PASS、独立pre/post resource validator PASS、workflow/diff-check PASS。实际值扫描覆盖tracked source/task artifacts/docs/delivery/phase1d*/memory-bank/完整Git diff，`SECRET_VALUE_PERSISTED_IN_PROJECT_FILES=0`。两把本轮新key各只在进程内存生成一次，未绑定/持久化，最终结束进程释放引用。955受保护文件只有四份正式事实源改变；frozen source/9ZIP/proposal/manifest/batch/design-document、历史A/B/C/D/D2报告与证据保持字节不变，Git commit/push0。

`PHASE1_D_PRODUCTION_FUNCTIONS=STOP_PROBE_FAILED / FIRST_CREATE_REJECTED / NOT_DEPLOYED`；`TASK-V2-22=IN_PROGRESS / PHASE_1_PRODUCTION_BACKEND_CONVERGENCE_IMPLEMENTED / LOCAL_GATES_PASS / EXTERNAL_ACTION_APPROVAL_REQUIRED`，Phase2LOCKED。当前工作集：FORMAT_TRACE/LOCAL_REQUEST_CONTRACT=PASS / AWAITING_REVIEW；PROBE=FAILED / STOP；REMAINING8/REMOTE_SOURCE/SMOKE=NOT_RUN。下一最小Founder decision：先只读定位具体缺失字段并审阅transport修复候选，再决定是否另行授权新的单函数尝试；本轮不再发CREATE试错，不启用/bridge/业务写入/Phase2/NETWORK/50/300/clientrelease/cleanup。

独立溯源：[v2-e-task-22-phase1d3-createfunction-format-root-cause.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1d3-createfunction-format-root-cause.md>)；执行报告：[v2-e-task-22-phase1d3-production-functions-deploy-readback.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1d3-production-functions-deploy-readback.md>)；blocker：[v2-e-task-22-phase1d3-partial-deploy-blocker.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1d3-partial-deploy-blocker.md>)；机器回执：[execution.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d3/execution.json>)、[preflight.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d3/preflight.json>)、[postflight.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d3/postflight.json>)、[secret-leakage-scan.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d3/secret-leakage-scan.json>)。

## 2026-10-03 TASK22 Phase1-D2｜First CREATE rejected / STOP（历史断点，已由本页D3授权承接）

Founder 的 Phase1-D2 命令已批准 20 个 exact logical bindings：既有 IDENTITY_HMAC_KEY → 9、新 production authority key → 9、新独立 cursor key → query/detail 2；Phase1-D 的 secret authorization blocker 已由此承接关闭。IDENTITY_HMAC_KEY 的 13 个现有 V1 consumers 在内存中证明值一致，旧密钥及 V1 consumers 均未修改；Founder 风险记录继续为 `RISK_ACCEPTED_BY_FOUNDER / SECRET_UNCHANGED / ROTATION_WAIVED`，暴露风险没有被写成已修复。

新的 preflight（2026-10-03T00:42:21+08:00）PASS：production 14 集合 / 23 显式非TTL索引 / 14 ADMINONLY / 13 业务集合 Count0 / control4 原样 / read-stoptrue / featuresfalse / haPausedtrue / epoch1 / PUBLIC0，全部 9 targets ABSENT；V1 19函数及所有既有28函数 stable config/trigger/layer、40集合index/ACL、Storage/rules/environment结构不变，shadow停机不变。Count/Size 正常 live 增长仅记录。

首个 `query-public-map-leads` CREATE 在 2026-10-03T00:43:05+08:00 被平台拒绝：`MissingParameter`，RequestId `ed7e1ff4-fcac-4cc3-8937-c2e0605188d4`。按总命令第12节立即 STOP，未修参重试、未继续后8函数、未重新生成密钥。外部 write attempts=1 / accepted=0；postflight 确认 production functions=0/9，partial deploy=false、20bindings=0/20、remote source9 NOT_RUN、smoke9 NOT_CALLED，invokes0、business/control/identity写0、PUBLIC0。两个32-byte随机 key只曾在受控进程内存中生成一次，未绑定、未记录值或真实key摘要；完成扫描后结束进程释放引用。

postflight（2026-10-03T00:44:03+08:00）完整 PASS；resource validator PASS、frozen9包artifact validator PASS、resource/schema/API dry-run6 PASS、workflow/diff-check PASS；本轮secret leakage scan覆盖tracked source、task artifacts、docs/delivery、phase1d*、memory-bank及完整Git diff，`SECRET_VALUE_PERSISTED_IN_PROJECT_FILES=0`。本轮只改四份正式事实源与新增D2操作证据/报告，冻结输入/ZIP/production source/design-document/历史A/B/C及D报告均不变；未提交或推送。

`PHASE1_D_PRODUCTION_FUNCTIONS=STOP_PARTIAL_DEPLOY / FIRST_CREATE_REJECTED / NOT_DEPLOYED`；`TASK-V2-22=IN_PROGRESS / PHASE_1_PRODUCTION_BACKEND_CONVERGENCE_IMPLEMENTED / LOCAL_GATES_PASS / EXTERNAL_ACTION_APPROVAL_REQUIRED`。Phase2 LOCKED；不得 enable、bridge、业务写入、NETWORK/50/300、client binding/release、shadow cleanup。下一最小 Founder decision：审阅首个拒绝及参数修复依据后，是否单独批准新的单次 CREATE；本轮不执行重试，不宣称部署/Phase1/TASK22完成或人工验收通过。

独立报告：[v2-e-task-22-phase1d2-secret-bindings-and-production-functions-deploy-readback.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1d2-secret-bindings-and-production-functions-deploy-readback.md>)；blocker：[v2-e-task-22-phase1d2-partial-deploy-blocker.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1d2-partial-deploy-blocker.md>)；机器证据：[execution.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d2/execution.json>)、[preflight.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d2/preflight.json>)、[postflight.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d2/postflight.json>)、[secret-leakage-scan.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d2/secret-leakage-scan.json>)。

## 2026-10-02 TASK22 Phase1-D｜Secret Binding Gate STOP / NOT_DEPLOYED（历史断点，已由本页D2授权承接）

Founder已授权执行Phase1-D冻结9函数部署总命令（非secret新建/绑定授权）。已从production proposal/manifest精确派生9函数batch，SHA `ccc61b45a42a54f137ae599b682c37fa9300bc3f70a5d219255365d3619dbb08`；所有ZIP/source/allowlist/non-secret config和本轮artifact validator9包PASS。pre/post各117只读完整回查PASS：14/14production集合、23/23explicit nonTTL索引、14/14ADMINONLY，13业务Count0、mapControlState4行完整不变/read-stoptrue/flagsfalse/haPausedtrue/epoch1/PUBLIC0；9production targets全部ABSENT。

部署前触发总命令第2节与第6节D的 `STOP_SECRET_BINDING_APPROVAL_REQUIRED`：ICHI_V2_ACCOUNT_AUTHORITY_HMAC_KEY在既有28函数bindings均MISSING，9函数required；ICHI_V2_CURSOR_HMAC_KEY同样MISSING，query/detail required。IDENTITY_HMAC_KEY在13V1consumer中PRESENT，9新target尚无binding。只记录逻辑名/布尔存在性，不输出secret值或新真实key摘要，不生成/绑定/替代key。当前只读绑定审计不代表外部secret vault全局库存证明。

`PHASE1_D_PRODUCTION_FUNCTIONS=STOP_SECRET_BINDING_APPROVAL_REQUIRED / NOT_DEPLOYED`；functions=0/9 DEPLOYED、remote source comparison NOT_RUN、smoke9/9 NOT_CALLED（无部署target）。CloudBase外部写0、invokes0、生产代码改动0、business/control/identity写0、partial deploy=false、CREATE retry0。技术上原false配置能在DB/identity前返回SERVICE_UNAVAILABLE，但当前命令不授权缺required secret时绕过predeploy gate的code-only例外；未自行部署。

`V1_STRUCTURAL_DIFF=0`（13collections/43既有基线indexes/13ACL/19稳定functions，以及40当前collections/28既有functions/layers/triggers/Storage根规则/envrules），shadowread-stoptrue/HApause true/epoch41/PUBLIC0/flagsfalse/allowlists空。Phase1-A/C应用状态不变；Phase1-B RISK_ACCEPTED_BY_FOUNDER / SECRET_UNCHANGED / ROTATION_WAIVED保持，旧暴露CONFIRMED / NOT_REMEDIATED，不重新打开rotation方案。

唯一活动区块V2-E / IN_PROGRESS、工作集TASK22 Phase1-D预部署门；总体TASK22仍 `IN_PROGRESS / PHASE_1_PRODUCTION_BACKEND_CONVERGENCE_IMPLEMENTED / LOCAL_GATES_PASS / EXTERNAL_ACTION_APPROVAL_REQUIRED`。下一最小Founder决策：独立批准2把production-only key受控生成及authority→9/cursor→2/既有不轮换IDENTITY→9的20个逻辑binding，或明确批准暂不绑定secret的code-only disabled deploy例外；两者当前均未执行。Phase2/enable/bridge/NETWORK/50/300/release继续LOCKED。

本轮治理验证PASS：artifact9包、contract dry-run6项、live resource exact-match、workflow、diff-check及899受保护文件检查；仅四份事实源变化，历史A/B/C报告和C证据/设计/生产源码/冻结ZIP/manifest不变。此PASS不代表部署或live smoke完成。

独立报告：[v2-e-task-22-phase1d-production-functions-deploy-readback.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1d-production-functions-deploy-readback.md>)；blocker：[v2-e-task-22-phase1d-secret-binding-blocker.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1d-secret-binding-blocker.md>)；batch：[phase1-d-production-functions-deploy-batch.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d/phase1-d-production-functions-deploy-batch.json>)。下方Phase1-C中“Phase1-D尚未授权”是此次命令前历史；本次部署授权已到位但required secret门仍STOP，不能写部署成功或Phase1完成。

当前执行停止于第一个函数query-public-map-leads的required-secret检查，未调用CREATE；不调整远期任务或解锁Phase2。

## 2026-10-02 TASK22 Phase1-C｜剩余 Production 资源 APPLIED / READBACK_PASS（当前权威状态）

Founder明确授权执行Phase1-C总命令，按冻结production proposal SHA `0940d1b322566c11df46898994a87c8effea5b1fa79a261711a44eec2a345f41`派生本轮batch SHA `3ec4a6431151789261a3161216caa44193814cf9387d370f23596bcb83cfb918`；13 collection CREATE / 13 ADMINONLY SET / 22 explicit non-TTL index CREATE串行成功，48次外部写调用，0写重试/0partial apply。每个目标创建前再次确认不存在，ACL/index/Count0即时回读通过后才进入下一个集合；117次完整postflight实际结构diff0。正常V1 Count/Size增长仅记录，无异常删除/清空。

`PHASE1_C_REMAINING_PRODUCTION_RESOURCES=APPLIED / READBACK_PASS`；`PRODUCTION_COLLECTIONS=14/14 APPLIED`、`PRODUCTION_EXPLICIT_INDEXES=23/23 APPLIED`、全部14集合ADMINONLY（本轮13/13），13业务集合全部Count0。mapControlState仍只4冻结control rows且完整字段未变，原kind_expiry非TTL索引不变；生产read-stop=true/所有flagsfalse/haPausedtrue/epoch1/PUBLIC0，production services enabled=false / NOT_ACTIVE。本轮22显式索引之外平台自动_id_/_openid_1只记录、不计入、不删除。

V1 13集合/43既有基线索引/13ACL/19完整stable configs及全部27既有集合/28既有函数、layers/triggers/Storage根与rules/env函数rules不变；`V1_STRUCTURAL_DIFF=0`。shadow read-stop=true / HA pause=true / epoch41 / PUBLIC0 / 9函数flagsfalse / tester allowlists空。production functions=0/9 DEPLOYED；无secret/control row/业务/身份写、无V1或shadow变更、无服务开启、无Git/微信发布。本轮新报告仅保存完整config与既有基线匹配的布尔结果，不输出真实secret或新增真实key摘要。

Phase1-B `RISK_ACCEPTED_BY_FOUNDER / SECRET_UNCHANGED / ROTATION_WAIVED`、rotation blocker CLOSED_BY_FOUNDER_WAIVER持续；暴露事件CONFIRMED / NOT_REMEDIATED，继续旧密钥，不实施dual-key/lazy migration/alias/历史身份迁移，不改wechatIdentities或V1身份语义。

当前活动区块V2-E / IN_PROGRESS、唯一工作集TASK22 Phase1；总体门仍 `IN_PROGRESS / PHASE_1_PRODUCTION_BACKEND_CONVERGENCE_IMPLEMENTED / LOCAL_GATES_PASS / EXTERNAL_ACTION_APPROVAL_REQUIRED`。Phase1-A与Phase1-C批次授权均已消费，禁止重跑/覆盖。下一建议Phase1-D｜9 Production Functions Deploy + Disabled-State Read-back/Smoke，尚未授权；本轮停止，不写Phase1/TASK22 COMPLETE/HUMAN_APPROVED/PRODUCTION ACTIVE，Phase2/NETWORK/50/300仍LOCKED/NOT_STARTED。

自动验证PASS：production artifact 9包、resource/schema/API contract 6项、batch与live resource exact-match、workflow、diff-check及836受保护文件检查；仅四份事实源变更，生产源/设计/历史报告/冻结产物不变，Phase1-A四行SHA匹配。未重跑full Vitest/Playwright或业务正向测试。

独立报告：[v2-e-task-22-phase1c-remaining-production-resources-apply-readback.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1c-remaining-production-resources-apply-readback.md>)；batch：[phase1-c-remaining-collections-indexes-batch.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1c/phase1-c-remaining-collections-indexes-batch.json>)；执行与回查：[execution-summary.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1c/execution-summary.json>)。下方dated未应用/13资源待批状态均为此前历史，以本节为准；历史报告原文不改写。

Phase1-C外部资源单元已执行并完整回查；Phase1-D函数部署与secret绑定/disabled-state smoke须下一条独立授权，后续区块未解锁。

## 2026-10-02 TASK22 Phase1-B｜Founder 风险接受与轮换豁免（当前权威状态）

授权来源是 Founder 在本会话中的明确决策及随后继续指令，覆盖此前 Phase1-B 附件要求的轮换路线。记录 `RISK_ACCEPTED_BY_FOUNDER / SECRET_UNCHANGED / ROTATION_WAIVED`；`IDENTITY_HMAC_KEY_TOOL_OUTPUT_EXPOSURE=CONFIRMED`、`OLD_KEY_STILL_ACTIVE=true`、`SECURITY_INCIDENT_REMEDIATED=false`。本次明文输出的风险已由 Founder 接受，安全事件没有修复；不重述密钥值，不把风险接受写成技术修复或安全验证通过。

停止 IDENTITY_HMAC_KEY 轮换方案，继续使用当前旧密钥；dual-key、lazy migration、identity alias、历史身份迁移均不实施，不为此创建新 Account，不修改 wechatIdentities schema/index，不改变 V1 身份语义。Phase1-B rotation blocker=`CLOSED_BY_FOUNDER_WAIVER`；此前 `IDENTITY_ROTATION_OFFLINE_EXIT_POLICY_DECISION_REQUIRED` 已由本决策替代，不再阻塞 Phase1。Phase1-B compatibility implementation 仍为 NOT_IMPLEMENTED，历史分析不构成可执行候选。

TASK22 恢复正常 Phase1 路线：`IN_PROGRESS / PHASE_1_PRODUCTION_BACKEND_CONVERGENCE_IMPLEMENTED / LOCAL_GATES_PASS / EXTERNAL_ACTION_APPROVAL_REQUIRED`；这里 LOCAL_GATES_PASS 仅沿用此前 Phase1 本地实现的验证结论。Phase1-A=`CONTROL_ONLY_APPLIED_READBACK_PASS`，其冻结批次授权已消费，禁止重跑或覆盖；其余 13 个 production 集合和 9 个 production 函数未应用/部署，`PRODUCTION_NOT_ACTIVE`，Phase2/NETWORK/50条采集仍未开始且锁定。本决策只授权本地治理收口，不新增 CloudBase 写入、secret 变更、函数部署或服务开启权限。

独立决策报告：[v2-e-task-22-phase1b-founder-risk-acceptance-closeout.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1b-founder-risk-acceptance-closeout.md>)。下方同日 STOP、待决策和 ROTATION_REMEDIATION=IN_PROGRESS 均为本决策前历史记录，不覆盖本节。

唯一工作集仍为 V2-E / TASK22 Phase1；下一执行点是准备/审核剩余 production 外部批次的精确 diff、冻结产物及回滚边界，然后等待单独授权。轮换与身份迁移从当前执行工作集中移除；本次不执行任何剩余外部动作，也不解锁后续区块。

## 历史｜2026-10-02 TASK22 Phase1-B Identity Rotation 审计 STOP / 离线退出口径待决

Founder授权执行Phase1-B本地兼容总命令、CloudBase只读。13caller+间接retry-deletions依赖审计完成；single mapping/accountId unique确认，3条最小真实shape仅记录类型存在性、无OPENID/真实身份值输出。新增12项fixture可行性反例；原V1身份3 suites/65tests PASS。未回访历史身份在移除old key后不能从old digest制造new digest，miss无法区分fresh，盲建号会Account split；同表dual primary受unique限制，rename破坏mixed旧代码。alias+trusted revisit是条件安全方向，但R6须逐身份全覆盖+write barrier，未回访可能使旧暴露key无法保证退出日期。按总命令第4/15节在方案冻结前STOP，提交offline exit政策决策；未修改V1/V2production身份代码，未生成functionZIP/真实key，不写PHASE1_B_IMPLEMENTED/LOCAL_GATES_PASS。当前TASK22=IN_PROGRESS / PHASE1_B_DESIGN_AUDIT_STOPPED / IDENTITY_ROTATION_OFFLINE_EXIT_POLICY_DECISION_REQUIRED；Phase1-A=APPLIED_READBACK_PASS、Phase2=LOCKED。pre92/post90只读检查结构diff0，mapControlState4safe rows/ADMINONLY不变，shadow停读/HA pause/epoch41/PUBLIC0；本轮CloudBase写0，无secret新摘要/配置变更/身份写/部署/Git/发布。IDENTITY_HMAC_KEY_TOOL_OUTPUT_EXPOSURE=CONFIRMED；ROTATION_REMEDIATION=IN_PROGRESS；SECRET_UNCHANGED；OLD_KEY_STILL_ACTIVE。详情docs/delivery/v2-e-task-22-phase1b-closeout.md及identity-rotation-blocker.md；下方是此前阶段历史。


## 2026-10-02 TASK22 Phase1-A｜控制资源已应用、完整回查 PASS

Founder 批准以15:09 preflight为新基线，V1 Count/Size为记录项，hard stop只检查结构配置及异常删除/突变；先完成只读密钥分析、禁止直接轮换。执行严格冻结 batch SHA `3b8978d8007bc16c8f822462c4ced8e3bcd198024f54f832b62b77bd11848813`：mapControlState CREATE / ADMINONLY / kind_expiry非TTL显式索引 / 4冻结safe rows；4云端写调用，业务数据写0。2026-10-02 15:23:18 Asia/Shanghai 完整93只读回查PASS，精确4/4行一致、总Count4；平台自动_id_/_openid_1加显式kind_expiry共3索引。V1结构配置diff0（13集合/43索引/13ACL/19完整稳定函数SHA），全部既有26集合/28函数、layers/triggers/Storage/rules/env配置未变；shadow read-stop=true / HA pause=true / epoch41 / PUBLIC0，新control epoch1、所有flagsfalse。没有部署9函数、改secret、写业务数据或Phase2；其它13production集合/9包未apply，PRODUCTION_NOT_ACTIVE。密钥暴露事件仍未修复，不能写本次PRIVATE_LEAKAGE=0；安全兼容性仅只读分析，禁止直接换key，13消费者及identity映射兼容需另议。独立报告：[v2-e-task-22-phase1-batch-a-control-only-apply-readback.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1-batch-a-control-only-apply-readback.md>)；安全分析：[v2-e-task-22-phase1-identity-hmac-exposure-analysis.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1-identity-hmac-exposure-analysis.md>)。总体TASK22 Gate保持IN_PROGRESS / PHASE_1_PRODUCTION_BACKEND_CONVERGENCE_IMPLEMENTED / LOCAL_GATES_PASS / EXTERNAL_ACTION_APPROVAL_REQUIRED；子状态PHASE1_A_CONTROL_ONLY_APPLIED_READBACK_PASS，仅此批授权已消费。下方pre-state/STOP/CLOUD_NOT_APPLIED记录均为此前阶段，不覆盖本节；冻结JSON保持原字节且不可重复执行。


## 2026-10-02 TASK22 Phase1 第一批控制资源｜已授权、执行前 STOP

Founder 已明确批准批次 PHASE1-A-CONTROL-ONLY，唯一授权 JSON SHA-256 `3b8978d8007bc16c8f822462c4ced8e3bcd198024f54f832b62b77bd11848813`：仅 mapControlState CREATE / ADMINONLY / kind_expiry 非TTL索引 / 4冻结安全control rows；其余动作未批。2026-10-02 15:09:01 Asia/Shanghai 执行前检查发现与上次收口相比9个V1集合Count/Size变化（配置/索引/ACL/19完整稳定函数SHA差异0），按用户“实际diff不符立即STOP”保守停止；本批未执行，CloudBase写入0，mapControlState前后均不存在。shadow read-stop=true / HA pause=true / epoch41 / PUBLIC0；不解锁Phase2。本轮配置检查误将一个既有函数密钥值输出至工具响应，已告知用户，后续仅哈希且报告不保存值，未自行轮换。独立报告：[v2-e-task-22-phase1-batch-a-control-only-stop-report.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1-batch-a-control-only-stop-report.md>)；脱敏证据：[batch-a-control-only-preflight.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/batch-a-control-only-preflight.json>)。TASK22总体Gate维持本地门通过、后续外部门；本批子状态STOP_PRE_APPLY_V1_METADATA_DIFF / NOT_EXECUTED。下方日期相同的本地收口是此前阶段事实，不覆盖本节。


## 2026-10-02 TASK22 Phase1 本地收口｜外部动作待独立批准

最终收口只读复核：2026-10-02 03:39:05 Asia/Shanghai / 2026-10-01 19:39:05 UTC，86只读操作覆盖全部26collection/28function及Storage/rules；13V1/43indexes/13ACL/19完整stableconfigs、layers/triggers/rules差异0；新production资源不存在，shadowread-stop=true/HApaused=true/epoch41/PUBLIC0，CloudBasewrites=0。最新脱敏证据：[live-final-readback.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/live-final-readback.json>)、[live-final-comparison.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/live-final-comparison.json>)、[live-final-stable-config-hashes.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/live-final-stable-config-hashes.json>)。

当前活动区块：V2-E / IN_PROGRESS；唯一工作集 TASK-V2-22 Phase1。TASK22 = IN_PROGRESS / PHASE_1_PRODUCTION_BACKEND_CONVERGENCE_IMPLEMENTED / LOCAL_GATES_PASS / EXTERNAL_ACTION_APPROVAL_REQUIRED。Founder执行Downloads正式总命令仅授权本地实现/构建/测试/dry-run与CloudBase只读审计。LOCAL_IMPLEMENTED / ARTIFACT_FROZEN / CLOUD_NOT_APPLIED / PRODUCTION_NOT_ACTIVE。无HUMAN_APPROVED/TASK22 COMPLETE/Phase2解锁；下方原READY/NOT_STARTED是本次pre-state，dated历史继续保留。

收口与八份独立报告：docs/delivery/v2-e-task-22-phase1-closeout.md；audit/matrix/resource contract/exactdiff/artifactvalidation/dryrun/rollback全部完成。Proposal SHA256 0940d1b322566c11df46898994a87c8effea5b1fa79a261711a44eec2a345f41；9ZIP/source manifest冻结于packages/v2-map/resources/production/cloudbase-production-artifacts.json；hash变化需重校验并重新外部授权。

44项production定向PASS；fullVitest1140PASS/1既有SKIP（103文件PASS/1SKIP）；Root+WebTS/Lint/contracts/workflow/Nextproductionbuild/Playwright26/26/微信CLIpreview（1012639bytes）/packageaudit/9artifacts/Node20.19.5+SDK4.0.2offlineABI/6dryrun/diffcheck PASS。SKIP非PASS，自动测试/preview不冒充视觉/真机/平台发布；首次Next并行缓存冲突日志保留，串行完整Next+Playwright重跑通过。

LOCAL_V1_RUNTIME_DIFF=0（执行前728文件hash，除本轮四份canonical状态文件）；LIVE_V1_RESOURCE_DIFF=0 VERIFIED，13collection/43index/13ACL/19fn完整stableconfig除APIRequestId、triggers/layers/storage/envrules会话pre/post只读比对；远端完整ZIP未下载，不冒充remote整包SHA或真机行为。PRIVATE_LEAKAGE=0/P0=0/P1=0限本地自动审查。CloudBaseexternalwrites=0；现有shadowread-stop=true/HApaused=true/epoch41/PUBLIC0、flagsfalse/allowlist空，没有新production部署。

后续须Founder审核matrix/exactdiff/9ZIP SHA/dryrun/runbook并单独批准最小externalbatch：artifacts/task22/phase1/minimum-external-action-batch.json，仅mapControlState CREATE/ADMINONLY/kind_expiry非TTLindex/4exactsafecontrols，无function/secret/enable/business/source写。其他provisioning/真实SDK事务并发与费用验证/terms与HApolicy/正式client替换/Phase2PLAYERbridge/NETWORKv4及30d/50→300/release未执行、不自行解锁。费用/资源上限NOT_MEASURED / REQUIRES_ACCOUNT_BILLING_READBACK，apply前审核，不编造金额。

Phase1 steps全部本地门完成，外部门停止：

| Step | 验证 / 产物 | 状态 |
| --- | --- | --- |
| 1A audit | fullV1/shadow/Storage/rules/client脱敏prepost | PASS |
| 1B matrix | 每组件18字段action/trust/deps/rollback | FROZEN |
| 1C resource | 14集合/23显式index/9fn/4safecontrols/interfaces | FROZEN_LOCAL_ONLY |
| 1D-G backend/control | 真实Account/roles/publicserving/owner/consent/report/HA | LOCAL_IMPLEMENTED / 44targetedPASS |
| 1H-I diff/artifact | actualLive→proposal/9ZIP/sourceSHA/SDKABI/2build | ARTIFACT_FROZEN |
| 1J-K dryrun/rollback | schemaAPI6checks/5类rollback | PASS / READY |
| fullregression/V1/governance | 1140+1skip/26web/preview/completeV1diff0 | LOCAL_GATES_PASS |
| externalapply/Phase2/release | 未授权，逐batch exactdiff/hash独立批准 | EXTERNAL_ACTION_APPROVAL_REQUIRED / NOT_STARTED |

只完成Phase1本地单元，不改变后继产品范围/顺序；mock/SDKABI不代替live验收，acceptedgaps不补PASS。后续provision前确认资源上限/费用；enable前验证真实事务/并发/terms/roles/client/source生命周期。Phase2新增revisionfence/hide-first依赖只记录影响，不实施/批量改写远期。

## 2026-10-02 当前决策｜Production Convergence + Hot-start

本节及修订后的 canonical TASK21/22 是当前路线。Founder 明确授权执行总命令，决定源为 `docs/decisions/v2-production-hot-start-direction.md`；认知对齐见 `docs/delivery/v2-e-task-21-22-knowledge-alignment.md`。旧 Closed Pilot/旧 RC 前置门、一次性约20条 NETWORK seeding 和 TASK22 锁定文字均 `SUPERSEDED BY FOUNDER DECISION 2026-10-02`；下方 dated 阶段记录保留当时事实，不得恢复旧执行路线。

- `TASK-V2-21 = COMPLETE / HUMAN_APPROVED / PRE_PILOT_PASS / CLOSED_PILOT_WAIVED_BY_FOUNDER / EVIDENCE_GAPS_ACCEPTED`。
- `PRE_PILOT_CLOSURE = PASS / HUMAN_APPROVED / FROZEN`；技术证据限2026-10-01最终已授权工作集，测试入口已关闭。
- `CLOSED_PILOT = WAIVED_BY_FOUNDER / NOT_RUN`；`CLOSED_PILOT_EVIDENCE = GAP_ACCEPTED_BY_FOUNDER`，没有真实多用户 Pilot/RC PASS。
- TASK-V2-22当前状态见顶部Phase1收口；原READY/NOT_STARTED/directionapproved为本次pre-state。任何cloud/data/deploy/Git/微信发布动作仍独立授权。
- One ICHI Backend 保持 Private/Source → V2 Domain/Projection → PublicMapLead；PLAYER（DRAW_RECORD/UPLOAD_RECORD）与 NETWORK_SOURCE/OFFICIAL_CURATED共用验证/解析/机会/时效/公开链路，公开查询不得request-time private join。
- NETWORK UI label=“网络上传”、官方/网络图标、无PLAYER Account/Profile/contributor；不走PLAYER consent，仍须Founder唯一准确性/入库终审、item-level rights/provenance、curator与public eligibility；拒绝/待审/待修候选local-only。
- 规划Codex Skill/workflow collect/review/publish持续补充，默认无后台CMS。先上海50个Founder-approved版面production seeding rehearsal，PASS后最终冻结合同，再全国300个Founder-approved成功ingestion并通过PublicMapLead链路的合格版面。
- NETWORK 30-day public expiry为待实现/验证政策；退出地图而非删历史，不修改旧观察时间续命。sourcePublishedAt/observedAt/basis/anchor关系与版本化schema、生产资源exact diff均待TASK22冻结；不把这些写成已实现。
- TASK01—20技术语义及历史报告原文保留；既有设备/账号/慢网/成本/真实行为缺口不补PASS。可由50/300生产seeding、真机、read-back/smoke/rollback提供的EDG证据转TASK22；仅Closed Pilot证据项WAIVED_BY_FOUNDER/EVIDENCE_GAP_ACCEPTED。
- 本轮cloud/data/code deployment=0；实现/采集/迁移/Skill创建运行/Git提交推送/微信发布/tag=0。历史停机证据仍是read-stop=true、HA pause=true、epoch41、PUBLIC0；本轮未做live回读。

> 以下为既有阶段记录；状态以本文件上方2026-10-02当前决策与当前正式章节为准，历史结论不回填。

2026-10-01 最终人工收口：Founder最后真实微信query/detail检查反馈“符合预期”，随后明确“测试全部关闭，V2-21 全部结束人工验收通过”。TASK-V2-21 = COMPLETE / HUMAN_APPROVED / PRE_PILOT_CLOSURE_PASS / TESTS_CLOSED，完成范围为本轮已授权Pre-Pilot与举报修复真机工作集；UPLOAD_ONLY_AND_REPORTING_PRE_PILOT_CLOSURE=PASS。全部9函数Active且flag=false/caller allowlist空、完整关闭配置回读一致，read-stop=true/HA pause=true/read-epoch41/PUBLIC0，12authority accountActive=false且过期。唯一report输入ZIP SHA 9a9a96a14e3ed314bae6147094fa26539f055239bf6c185039a79253c0c5c6cd未变，16/16 source/config部署回读PASS、远端归档ea132及其它8函数代码SHA最终匹配。真实Founder A举报→取消→再举报→再取消、紧凑按钮灰色已举报/再次点击和状态条取消联动、7请求幂等均PASS（新增AUDIT3/duplicate1，同actionId replay无额外审计，最终CANCELLED/count0）。本轮10合成合格主体9 PUBLIC→10 HIDDEN/唯一AUTO_HIDE，取消count9仍隐藏；迟到sequence2保持原10秒配置，首次超时后一次重试APPLIED/MODERATION_HIDDEN；最后真实query items=[]/detail LEAD_UNAVAILABLE，全部不复活。最终ledger71（22 STATE/3 TARGET/46 AUDIT）保留；20公开响应PRIVATE_LEAKAGE0，49项云端V1与149本地保护文件diff0，P0=0/P1=0。完整回归1096 PASS/1既有SKIP、Lint/双TS/合同/Next/9包validator PASS，最终Web26/26 PASS。Device B/低端及未补齐设备元信息仍EVIDENCE_GAP；CLOSED_PILOT=NOT_RUN/PILOT_PROTOCOL_APPROVAL_REQUIRED、RC=NOT_APPROVED，TASK22=LOCKED/NOT_STARTED，不开启新窗口/发布/commit/push。正式报告docs/delivery/v2-e-task-21-pre-pilot-final-closure.md与独立修复报告v2-e-task-21-report-tcb-context-repair-deploy-closure.md；以下阶段记录均为历史，不能覆盖本段最终状态。

2026-10-01 18:08（上海时间）Founder回复真实微信幂等“验证通过，已恢复未举报，我觉得可以收口了”。云核对新增AUDIT3（REPORT/重复REPORT/CANCEL，duplicate仅1），同actionId重放0额外审计、报告STATE仅1/CANCELLED/count0、trusted Founder A匹配；真实举报修复与紧凑按钮/联动验收PASS。剩余既有授权阈值已重跑：10个已有合成合格主体，9 PUBLIC/VISIBLE→10 HIDDEN/count10/AUTO_HIDE仅1、epoch失效→取消count9仍HIDDEN/latch；迟到event2首次平台10秒超时且PUBLIC0，保持原配置重试成功MODERATION_HIDDEN，lastAppliedEventSequence2/不复活。所有举报资格已关闭、report及rehearsal=false；当前只为Founder A开query/detail读取最小窗口、PUBLIC0/HA pause=true/read-epoch39，等最后真实微信query无此lead/detail LEAD_UNAVAILABLE确认。完整V1只读与全回归、最终全部关闭尚在进行，不提前把总门PASS/P1零写成已完成；TASK22 LOCKED。

2026-10-01 17:50（上海时间）Founder要求重新生成二维码做一次真实微信幂等测试。CloudBase管理会话失效后，Founder完成重新登录并绑定原环境；只读确认旧一次性验证未执行（E audit仍10/count0/CANCELLED），旧authority已过期，举报函数远端归档SHA ea132abf4ac5e93e28b341a62fa3111b08a54b7f897a8b27d62a42b85a41de99与已批准部署一致，本地9a9冻结ZIP未变。已复制隔离6文件验证页，生成新actionId/cacheKey和新二维码，preview5772bytes/语法检查PASS；旧二维码与证据保留。重新核验9函数Active：仅report开启且rehearsal=false/仅Founder A，其余8全部flag=false/caller空；HA pause=true/read-epoch36，E唯一PUBLIC1。最小authority窗口有效至2026-10-01 18:04:37，当前read-stop=false仅用于7请求的一次验证；等待Founder单击开始后反馈，不记真机幂等PASS。后续9→10/auto-hide/no-resurrection与最终safe-stop/full V1仍待，TASK21 IN_PROGRESS，TASK22 LOCKED。证据true-wechat-idempotency/regenerated-20261001-094658，旧OPEN/PASS快照以下均为历史。

2026-10-01 Founder回复“OK 5 项测试通过”：举报按钮紧凑靠右、灰色已举报与再次点击/状态条取消联动真机PASS。云记录核对可信WXContext Founder A、CANCELLED/active=false/distinct count0、10条交替REPORT/CANCEL审计及18条公开成功响应无私有字段。当前暂停正式地图窗口后继续既有部署授权的真实幂等：隔离6文件一次性miniapp仅调用唯一report函数，7请求包含同actionId重放和新actionId重复，预期新audit3/duplicate1/count0；不进入正式应用、不改后端/资源定义。仅为Founder A开report最小窗口，rehearsal=false，其余8函数关闭/caller空、HA pause=true，E唯一PUBLIC1保留后续threshold；真实幂等及本轮9→10/最终safe-stop/full V1尚待，不记总门PASS。TASK21 IN_PROGRESS / PRE_PILOT_CLOSURE，TASK22 LOCKED；下方窗口和待UI验收文字为历史。

2026-10-01 举报按钮局部修复LOCAL_VERIFIED/AWAITING_FOUNDER_DEVICE_REVIEW：两处详情模板补传mapReportActive/mapReportBusy；举报按钮靠右按图标/文字+左右8px自适应、已举报灰暗含图标并显示“已举报”、按钮再次点击与状态条取消均共用既有cancel。48定向、1069全量+1skip、Lint/双TS/contracts/workflow/Next PASS；Web25/26，保留已接受的V1草稿左滑删除flake，149个V1保护文件hash0diff；正式preview1012639bytes。冻结report ZIP9a9与runtime源码未变，已部署16/16 source/config/SHA PASS。仅为Founder A重开query/detail/report最小窗口、rehearsal=false、其它6函数flag=false/caller空、HA pause=true/read-epoch34；仅正式合成投影测试E 举报按钮PUBLIC1，旧D及旧退休/threshold-hidden均未恢复。等待A新版按钮四命令复测，再完成真实幂等与本轮threshold/最终safe-stop/full V1；不提前记总门PASS/P1清零，不启动TASK22。独立报告docs/delivery/v2-e-task-21-report-button-state-and-width.md及report-tcb-context-repair-deploy-closure.md。以下阶段记录为历史，当前测试窗口以本段为准。

2026-10-01 当前活动区块V2-E、唯一工作集TASK21。Founder已批准并部署唯一report函数tcbContext冻结包SHA 9a9a96a14e3ed314bae6147094fa26539f055239bf6c185039a79253c0c5c6cd；远端16/16 source/config/SHA read-back通过，其它函数代码不变。真实微信已观测REPORT→CANCEL_REPORT→REPORT→CANCEL_REPORT均成功、trusted WXContext为Founder A、最终CANCELLED/count0；Founder明确确认D第一组通过，但反馈按钮状态和宽度。该前端补充由Founder另行明确授权：详情右侧举报按钮按图标+文字+少量内边距自适应宽度，不拉长；已举报时灰暗并显示“已举报”，再次点击或状态条取消均恢复亮色“举报”，在途禁用。当前模板漏传mapReportActive/mapReportBusy，控制器已有正确共享状态和命令；只修两处模板传参与局部WXSS，不扩大云函数冻结diff。已暂停真机窗口：所有相关flag=false/caller空，read-stop=true/HA pause=true/epoch33，Founder authority失效，D临时HIDDEN，按正确lifecycleState=PUBLIC核对PUBLIC0。真实幂等、新版按钮复测及本轮threshold/auto-hide/no-resurrection尚待完成；总closure仍IN_PROGRESS，不记P1清零/整体PASS，TASK22 LOCKED。历史未部署文字以下保留为当时记录，以本段为最新状态。

2026-10-01 Founder明确批准唯一tcbContext修复仅本地构建验证，不包含CloudBase部署。report runtime在业务校验前剥离userInfo和tcbContext，其它未知字段拒绝、身份只用getWXContext、count/audit/幂等/threshold语义不变；仅本函数runtime和测试修改。独立ZIP SHA 9a9a96a14e3ed314bae6147094fa26539f055239bf6c185039a79253c0c5c6cd已冻结：16文件只有runtime变化，15其它文件一致、解包16/16与复现SHA一致、原9包和b100包不覆盖。真实观察键结构以合成值本地回放，18新增用例/定向50/实际包34/全量1068+1既有skip全部PASS，Lint/双TS/contracts/workflow/Next/9包validator PASS。当前LOCAL_VERIFIED_FROZEN_NOT_DEPLOYED_STOPPED / AWAITING_REVIEW；云写入0、远端9函数代码SHA不变、全部flag=false/caller空、read-stop=true/HA pause=true/epoch31/PUBLIC0、12authority失效、ledger24/B0未变；V1本地149文件hash0diff。新修复真机未跑，P1仍1；总门NOT_PASS / REPORT_REPAIR_LOCAL_VERIFIED_DEPLOYMENT_APPROVAL_REQUIRED，TASK21 IN_PROGRESS / PRE_PILOT_CLOSURE，TASK22 LOCKED。报告docs/delivery/v2-e-task-21-report-tcb-context-repair-build-validation.md及冻结exact-diff为本轮记录，按要求冻结后停止，不部署/不开窗口/不commit/push。

以下保留之前诊断和修复阶段记录，最新构建状态以上段为准。

2026-10-01 TASK21单次结构诊断已完成：Founder明确批准b10054298bfc04d81318935750084675b3876dc82ec689b325911f3818908962，仅更新report；远端16/16源码与配置PASS、其它8函数SHA不变、资源新增0。独立检测预览只发1次GET_STATE，真实请求f52f2d7b-5ef9-4983-b8e5-1005ca5351c0为BUSINESS_FIELDS/额外键tcbContext，三个业务格式条件均true，Founder反馈读取invalid_request，当前共同入口拒绝根因已确认。取得日志后立即关闭；最终9函数全部flag=false/caller空、read-stop=true/HA pause=true/read-epoch31/PUBLIC0，12authority失效，24ledger结构/active不变且B=0，SAFE_STOP=PASS。再次49项云V1与149本地文件0diff、PRIVATE_LEAKAGE0；P1仍1，真实举报/取消链未通过。拟议修复仅将tcbContext与userInfo一并剥离，不信任字段内容；超出诊断授权，已STOP提交新的拟议exact diff，未改源码/构建/部署修复。已有仅上传/完整气泡/刷新/C隐藏消费和无影响threshold PASS保留。独立报告docs/delivery/v2-e-task-21-report-structure-diagnostic-result.md；建议docs/delivery/v2-e-task-21-report-tcb-context-repair-exact-diff.md。总门NOT_PASS / REPORT_ROOT_CAUSE_CONFIRMED_REPAIR_REQUIRED，TASK21 IN_PROGRESS / PRE_PILOT_CLOSURE，TASK22 LOCKED，不开启Pilot/commit/push。

以下记录保留先前阶段事实；本轮诊断状态以上段为准。

2026-10-01 TASK21批准的单一report envelope修复已部署，ZIP SHA cd4c6366c4a659a978452a91a0b88b391f24e4bbc09f3db1baba49a7d9dada25一致，远端16/16文件与配置核对PASS，其余8函数代码SHA未变，资源新增0。Founder A对独立B举报仍显示“举报失败请重试”，两次真实请求INVALID_REQUEST、B ledger0，P1=1，后续取消/再举报/再取消STOP，不扩大授权。原userInfo冲突为局部复现原因，不再认定完整根因。既有仅上传mandatory筛选/有序自适应粉色气泡/刷新状态条/C threshold及隐藏消费PASS无影响保留。最终9函数flag=false/caller空、read-stop=true/HA pause=true/read-epoch31/PUBLIC0，12authority失效、原24ledger保留、新B退役；SAFE_STOP PASS；49项最终云V1比对及149个本地文件hash均0diff，5条本轮真实公开响应PRIVATE_LEAKAGE0。UPLOAD_ONLY_AND_REPORTING_PRE_PILOT_CLOSURE=NOT_PASS / REPORT_REPAIR_TRUE_DEVICE_FAILED；TASK21 IN_PROGRESS / PRE_PILOT_CLOSURE / REPORT_REPAIR_TRUE_DEVICE_FAILED；TASK22 LOCKED。部署/SHA通过不等于真机链通过，P0/P1/P2/P3=0/1/1/0。独立报告docs/delivery/v2-e-task-21-report-envelope-repair-true-device-retest.md与更新后的pre-pilot-final-closure为最新事实，不开启Pilot、不commit/push。

2026-10-01 Founder真机C四动作全部通过：刷新/拖动缩放后C不再出现，旧详情关闭后不可从原区域重开；A/B仍可见。新局部要求：按刷新按钮进入REFRESHING时，筛选器下方状态条显示准确文本“正在刷新，保留已有线索”，右侧显示主题玫红加载环；刷新状态优先于旧举报提示/空筛选提示，成功或失败结束后按现有状态呈现。举报真实请求INVALID_REQUEST为已复现P1：微信注入userInfo被严格业务字段guard拒绝；本地修复仅忽略userInfo，身份仍可信getWXContext，新独立包未批准/未部署，原冻结SHA不覆盖。

2026-09-30 TASK21真机A修订工作单元：先实现UPLOAD_ONLY独立显示门，再按全部实际标签优先级串成详情气泡并按整行内容自然宽度伸长；覆盖upload多reason且仅上传未选必须隐藏、仅上传单选显示、普通记录机会OR、无标签不造标签、显示全部、独立toggle；全量Vitest/TS/Lint/contracts/Next/微信preview与平台复测。当前窗口关闭/read-stop=true，threshold9仍PUBLIC且不可读，修复后复用既有授权窗口继续A/B/C；无云包或exact diff扩展，TASK22锁定。

2026-09-30 Founder新总命令授权TASK21最终Pre-Pilot exact Apply及仅上传/举报真机与threshold rehearsal：仅1 ledger/2非unique非TTL索引/1新函数+3既有函数替换/0新secret，所有入口默认关闭；三组明确synthetic lineage、受信Founder A与10合成report principals、最后safe stop/full V1 diff，独立四报告。只闭合Pre-Pilot；TASK22锁定、不得TASK21整体HUMAN_APPROVED/FROZEN/RC/Pilot启动。执行前冻结包/回滚包SHA一致，V1完整基线0diff与8函数关闭/epoch25/PUBLIC0回读已通过。当前PHASE_A_APPLY_IN_PROGRESS，真机结果待Founder。

2026-09-30 Founder明确“OK 现在所有截图都已确认无误”：当前已交付、对应最新实现的全部截图通过人工视觉验收，VISUAL_REVIEW=HUMAN_APPROVED。包括地图状态横条/紧凑loading、Marker与Opportunity/仅上传呈现、筛选样式、本人上传状态、条例十五条/倒计时/无底滚动区及已交付详情截图。旧before/被新版覆盖的历史样式仍为历史，不恢复。临时预览已清理。此确认只关闭截图视觉待审项，筛选点击等真实端上交互、真实账号/云核验与report/threshold、详情latency、Web整体失败、云A段资源/窗口审批和Pilot协议按各自既有状态继续；不记手机/云链路PASS，不解锁TASK22，不标TASK21整体HUMAN_APPROVED/FROZEN。汇总见v2-e-task-21-founder-visual-acceptance.md。

2026-09-30 TASK21筛选点击修复：移除全选时清空集合/只选点击项的分支，六项全部独立toggle；全选点LAST只取消LAST且其它五项保持，再点恢复；仅显示全部清词并全选六项，默认仅上传未选/OR不变。旧行为回归先红1项，再绿153项定向/1047全量+1既有skip，TS/Lint/contracts/Next/微信preview1011337 bytes通过。证据discovery-independent-toggle-20260930与报告v2-e-task-21-discovery-independent-toggle.md；Founder端上复测待验。未改云/部署/commit/push，TASK21未闭合，TASK22锁定；既有Web25/26与云资源审批门保留。

2026-09-30 TASK21仅上传筛选补充：按Founder截图/文字，将筛选项改为📤白底黑字公共胶囊、初始默认不选UPLOAD_ONLY，保留Marker灰色、OR与显式显示全部六项；定向209/全量1047/1skip、TS/Lint/contracts/workflow/Next/微信preview通过，视觉待Founder确认。上轮Web25/26未闭合/云A段待批准仍有效，不解锁TASK22。

2026-09-30 条例弹窗与相关临时状态预览已获Founder确认，局部视觉门HUMAN_APPROVED；按授权清理UI注入及临时工具，正常页面和handler已恢复。截图/验证留档。此项不再AWAITING_FOUNDER_REVIEW，不扩大为TASK21整体closure或云端/手机同意验收；其余cloud/report/Pilot门仍待，TASK22锁定。

2026-09-30 TASK21条例局部视觉补充：滚动正文无白底、无描边，直接使用弹窗背景。验证微信编译/实际滚动区和按钮；不改正文、倒计时或账号同意，不自动清理九条临时失败示例，TASK22锁定。

2026-09-30 TASK21条例弹窗修订自动门通过，进入AWAITING_FOUNDER_VISUAL_REVIEW：十五条滚动全文/居中标题与间距、三秒UI和submit双重门、账号accepted不重现；定向104/全量1045+1skip及平台编译/Next/TS/Lint/contracts通过。旧9条临时失败示例保留，下一步仅收本局部视觉确认，不自动清理、不把真实consent/云端验证记通过，不解锁22。详见map-contribution-terms-modal报告。

2026-09-30 TASK21新增条例弹窗修订工作单元：使用Founder十五条正文，居中标题/正文间距/可滚动文本框；三秒前UI与提交禁用，关闭/离开/重开计时清理；保留既有服务端账号同意记录与accepted隐藏入口。验证真实时间边界、失败不保存、账号重新读取与隔离、全量本地回归/微信编译和DevTools滚动与倒计时截图。旧九条临时失败示例继续保留；本轮不写真实consent或开云窗口。完成后AWAITING_FOUNDER_VISUAL_REVIEW，仍TASK21，TASK22锁定。

## 2026-09-30 TASK21 Pre-Pilot 补充工作集

本轮属于既有 TASK-V2-21，仍 IN_PROGRESS / PRE_PILOT_CLOSURE；先完成仅上传 V1→V2 审计、Marker/filter与详情点赞移除、report/cancel 持久候选与10 distinct eligible threshold/no-resurrection 测试矩阵。独立五报告、资源 exact diff/artifact/SHA、cloud read-back/Founder真机证据及V1 diff/safe stop 均为 closure 输入。新资源 apply 必须 Founder external-action approval；未获批准只本地实现/测试和只读审计，不启动 bounded pilot。TASK22不改/不解锁。


2026-09-30 Founder确认地图统一横条与紧凑loading修订完成（HUMAN_APPROVED，仅该视觉范围）。TASK21继续检查条例未同意列表/详情及失败状态，新增7失败/异常+2对照的DevTools临时示例，等Founder确认后才恢复。条例入口仍说明卡/灰按钮，与地图44px横条样式不同；不擅自改造条例或V1-F失败恢复规则。演示Marker只显示IP，状态独立。其余Opportunity视觉/平台/真实详情测量/Pilot协议门仍待，TASK22锁定。证据和当前临时保留状态见v2-e-task-21-uploaded-state-audit.md。

2026-09-30 首次loading精简（最新）：TASK21 Closure B最新07验收以无说明的紧凑loading卡片为准：环直接在标题下，240px最大宽/20px留白/10px元素间距，自动高度。实现、微信preview和本地回归完成，视觉人工门保留；其他状态20组中19组沿用。


2026-09-30 地图状态条统一（最新）：TASK21 Pre-Pilot Closure B视觉以Founder最新状态横条规范为准：首次loading保留中心卡，其余统一横条/单右侧粉底白字按钮/短单行文案；search无匹配show-all须同时清空搜索与全部状态。本地实现/20组DevTools尺寸与tap验证/自动门完成，视觉人工门尚未通过。既有Pre-Pilot平台/协议门继续保留，不解锁22。


## 2026-09-30 TASK21 最终 Opportunity 规则（Founder 已决定）

当前工作集为 TASK21 Pre-Pilot，规则门已通过，继续本地实现；TASK22 仍锁定。五状态独立可并存，不统一评分。R=所有赏级当前 remaining 合计；G=V1 上传中用户选择的 isGrandPrize 集合当前 remaining 合计。任何必要项 null 保留 unknown；空大赏集合不假定为已确认零。首版 LAST_CHANCE：R≤12；GRAND_PRIZE_REMAINS：G≥3；GRAND_PRIZE_RATIO：R>0 且 G/R≥8%；SPLIT_SET（刚刚拆套）：R≥60，覆盖此前 initialTotal/85% 延后方案。LOW_OPPORTUNITY：已知 R>12 且（G=0 或有效 G/R≤3%），以及必要事实完整但没有命中任何正向状态时的默认状态。最新 Founder 的“未命中标签就等于低机会信息”覆盖此前禁止完整事实无标签回落的限制；缺失数据不得产生低机会。主状态顺序 LAST > 密度 > 存量 > 拆套 > 低。所有阈值进入版本化可调 policy。年龄不改变 Opportunity，Freshness 独立。

低机会可上图并可筛选；各 source/current、verification、授权、rights、位置、moderation、删除和安全门仍独立成立。移除公开 HIGH/MEDIUM/LOW/INSUFFICIENT，更新为 public-map-v3 的 primaryStatus（unknown 为 null）、reasonCodes、policyVersion、evaluatedAt；不从 leadId 或 synthetic alias 推状态。信息不足不反推低机会，已有独立公开门保持。旧 serving 合同不能静默转换成新结果。


2026-09-30 Founder 执行 `ICHI_TASK-V2-20关闭_TASK-V2-21_PrePilot与ClosedPilot_总命令.md`：TASK-V2-20=`COMPLETE / HUMAN_APPROVED / FROZEN`；TASK-V2-21 已进入 `IN_PROGRESS / PRE_PILOT_CLOSURE`，Opportunity 只读审计确认精确规则未冻结，当前门为 `OPPORTUNITY_RULE_FOUNDER_DECISION_REQUIRED`；TASK-V2-22=`LOCKED / NOT_STARTED`。最终关闭依据与 accepted gaps 见 `docs/delivery/v2-e-task-20-founder-final-closeout.md`；TASK21 数据来源与未决规则见独立 audit／decision sheet。Map State UI 源码审计、详情 latency 基线和 pilot protocol 仅为准备记录，未实现、未通过视觉门、未开跑 pilot。不得自填机会阈值／优先级／PASS 映射；既有资源 data/flag/allowlist/config 写入等 protocol 单独获批，新 cloud resources 仍需 exact diff 独立批准。没有 CloudBase mutation／产品代码改动／正式发布。下方 dated entry 仅保留历史阶段。

2026-09-29 TASK-V2-20 Founder 根据收手分享弹窗与真机上传列表补充语义：暂不分享并退出只保存本机草稿，不进入“我上传的版面”；主动分享提交后才进入该列表，以可信核验状态显示待核对／失败与重试／已上传，不显示逐记录“已选择分享至地图”或“暂不分享”。当前 TASK20 内先修候选 synthetic 列表投影：只呈现 `SHARE` 的 ACTIVE 行，`DO_NOT_SHARE` 不计数、不露出卡片；正式 V1 收手与上传路径保持已有门禁。新增本轮诊断创建的 `DO_NOT_SHARE` 测试行已软退役且保留 tombstone；候选入口关闭。Founder 已明确核验通过后显示“已上传”；同意当前地图条例且公开安全资格通过时自动投影，未同意则留在本人上传列表等待，日后同意后自动进入资格判断。不加逐条发布操作，也不绕过既有安全门。修正后完成定向测试、自动门与正式微信预览，再交 Founder 验证受影响页面。

2026-09-29 TASK-V2-20 Phase 3 Founder 真机复测确认：账号 A 已同意条例，短暂“正在核验”后同意卡片消失；独立候选上传区块不符合统一云端记录交互。当前活动 TASK20 内修订 My Upload UI：候选记录移入“云端”滚动列表、复用云端卡片/左滑垃圾桶/删除确认，计数及空态合并；后端可信 ref 与删除入口仍独立。先做定向行为和布局回归、全量自动门及微信预览，再交 Founder 真机复测。P3 窗口已关闭，8 个 shadow 函数 flags=false/allowlist 空、read-stop=true、ha-pause=true、PUBLIC=0；不删除 TASK19 既有合成上传，不进入 TASK21/22。

2026-09-29 TASK-V2-20 Phase 2A 两项空地图 P1 经修复已获 Founder 真机确认；P2B 拒绝定位按 Founder 决定 NOT_RUN。Phase 3 发现 P1：条例卡片误显、弹窗主按钮错位且不可操作。测试窗口只开启 query/detail，manage-contribution 关闭，导致 consent 状态未知；客户端错误显示“未同意”并允许打开禁用弹窗，CSS 又使主按钮绝对定位。窗口已安全关闭；先修正未知状态/弹窗布局，再为 A 开启所需候选入口并重测。TASK-V2-20=`IN_PROGRESS / P1_REPAIR_AND_RETEST`，真机矩阵、区块验收与下一任务均未完成。TASK19 的历史验收记录如下。

2026-09-29 TASK-V2-19 Founder 最终验收：`TASK-V2-19 = COMPLETE / HUMAN_APPROVED / FROZEN`，`TASK-V2-20 = READY / NOT_STARTED`。验收以 `docs/delivery/v2-e-task-19-minimal-real-wechat-rehearsal-closeout.md` 的真实微信 query/detail、consent、历史 HA 证据和最终安全停机回读为界；未重跑项目不补记为新 PASS。下文 19 的旧阶段状态均为历史记录，19→20→21→22 的后续 Gate 不变；本轮不开始 20，也不执行 CloudBase mutation。

2026-09-28 TASK-V2-19 local validation gate 更新：V1 草稿左滑 Playwright 单 worker 八次中 3 PASS / 5 FAIL、trace 保存，且 V1 Web 页面／测试／配置／package 与 Git HEAD 完全一致，V2 diff 对该路径直接影响=0。按 Founder 限定将此项记录为 accepted pre-existing flake，保留失败事实，不改 V1 业务；本轮触及文件 Prettier、workflow、git diff-check PASS。下方 `LOCAL_VALIDATION_BLOCKED` 为复核前历史状态；当前 `TASK-V2-19 = IN_PROGRESS / MULTI_CONTRIBUTION_AND_LINEAGE_LOCAL_READY / EXTERNAL_ACTION_APPROVAL_REQUIRED`，仍不 COMPLETE/HUMAN_APPROVED/FROZEN，TASK20 未开始。独立报告 `docs/delivery/v2-e-task-19-local-validation-flake-acceptance.md`；云端 exact diff v2 待 Founder 另行批准，本轮 CloudBase mutation=0，19/20/21/22 Gate 不变。

2026-09-28 TASK-V2-19 多贡献者／上传 lineage：Founder 新产品语义废止旧单 owner `v2ShadowContributionAuthority`、`ACCEPT/WITHDRAW`、二次发布状态机。当前仅本地修订 candidate upload→HA 同源 ref/version、逐上传 contribution ledger、多人聚合与删除传播、详情 presentation，并生成新 exact diff；没有 CloudBase create/deploy/config/data/migration/rollback/cleanup。本地 Web Playwright 25/26（V1 草稿左滑可重复失败），全仓 Prettier 含既有生成文件告警，故 `TASK-V2-19 = IN_PROGRESS / MULTI_CONTRIBUTION_AND_LINEAGE_LOCAL_VALIDATION_BLOCKED / EXTERNAL_ACTION_APPROVAL_REQUIRED`；不可标 COMPLETE/HUMAN_APPROVED/FROZEN，TASK-V2-20 未开始。19/20/21/22 Gate 不变，新资源与函数动作必须 Founder 按 `docs/delivery/v2-e-task-19-candidate-resource-exact-diff-v2.md` 单独批准。

2026-09-28 TASK-V2-19 最终验收前集成核对：Founder 本轮授权在 candidate 正常路径安全接入后将 19 标 COMPLETE/HUMAN_APPROVED 并立即开始 20；实际审计发现正式 `map-preview` 仍用本机 synthetic map，HA 为 disabled service，consent/owner/report 为本机 synthetic。既有四个 shadow 函数不能提供前端 HA 所需的可信 record/version 关联，六函数也没有持久 consent/owner command 入口。按本轮命令 A.2 停止，exact blocker/diff 见 `docs/delivery/v2-e-task-19-final-acceptance-blocker.md`。`TASK-V2-19 = IN_PROGRESS / CANDIDATE_RUNTIME_BINDING_BLOCKED`，`TASK-V2-20 = READY / NOT_STARTED`，TASK21—22 未开始；未改 19/20/21/22 Gate、未云端写入。

2026-09-28 TASK-V2-19 final cleanup：按 Founder 授权移除一次性 trusted-caller 小程序、get-my 函数 enrollment 分支和两项 enrollment-only 配置，保留 `getWXContext()` 信任链与全部 shadow candidate/evidence。正式小程序 TASK18 压测入口/面板/注入/force-individual override 不存在；全量自动回归与正式 CLI preview 通过。六函数四 flag=false、allowlist 空、PUBLIC=0、V1_DIFF=0 已回读。B2-R4 的 `SKIP`、B 正向回答、真实小程序 public query/detail 尚无技术完成证据；因此 `TASK-V2-19 = IN_PROGRESS / FINAL_CLEANUP_DONE_EVIDENCE_GAPS_REMAIN`，不自行 COMPLETE/HUMAN_APPROVED/FROZEN，TASK-V2-20 未开始，19→20→21→22 Gate 不变。独立报告：`docs/delivery/v2-e-task-19-final-closeout.md`。

2026-09-28 TASK-V2-19 Phase B2-R4：Founder 批准原第 2 节 exact diff／第 3 节测试序列后，仅更新一个 get-my shadow function 并用独立开发预览小程序完成 A/B 可信服务端登记；A/B 本人请求隔离、双向跨账号拒绝、A 的 SAME_BOARD／DIFFERENT_BOARD／CANNOT_TELL 和一次 duplicate 已验证。Founder 指示结束本轮；SKIP、B 正向回答和真实小程序 public query/detail 未完成技术验证，不能作为 TASK-V2-19 完成门。停机回读六函数四 flag=false、allowlist 空、enrollment 关闭、read-stop=true、PUBLIC=0、V1_DIFF=0；合成数据保留，不 cleanup。TASK-V2-19=`IN_PROGRESS / PHASE_B2_R4_TEST_CLOSED_PARTIAL_VERIFICATION`，不标 COMPLETE/HUMAN_APPROVED/FROZEN，TASK-V2-20 未开始；19/20/21/22 Gate 不变。独立证据见 `docs/delivery/v2-e-task-19-phase-b2-r4-trusted-caller-verification.md`。

2026-09-27 TASK-V2-19 Phase B2-R4 批准前记录：Founder 要求真实小程序 A/B trusted caller、HA 四答案、跨账号拒绝与 public query/detail；两名账号已确认可扫码。现有六函数没有在 allowlist 为空时受控取得自身可信 HMAC digest 的入口，且不得读取 V1 identity/profile。按要求先停在 `PHASE_B2_R4_SECURITY_BOUNDARY_DIFF_APPROVAL_REQUIRED`，提交独立 exact diff：只更新既有 get-my shadow 函数的短时 enrollment 分支，新增两项 fail-closed 函数级 config，另建不进入正式包的本地开发/体验测试入口；无新增 cloud collection/index/function/Storage/trigger/ACL。待 Founder 单独批准边界变更前不实施或部署。本段仅为历史门禁记录。

2026-09-27 TASK-V2-19 Phase B2-R3：Founder 授权既有 shadow 资源 synthetic rehearsal；实际远端 resolver/HA/projector/read 分阶段执行，canonical 12 场景中 1—6、8—12 的对应远端路径通过，7 因缺少可信小程序测试 caller A/B 未完成远端四答案。GEO/unique、HA cooldown/budget/once-per-upload、outbox retry/gap、合成重放幂等、withdrawn/deleted→retired/no-resurrection 与 read-stop rollback 已验证；可信 caller 的 public query/detail 和跨账号正测仍待完成。六函数四 flag=false、allowlist 空、read-stop=true、V1_DIFF=0，保留合成证据不 cleanup。`TASK-V2-19 = IN_PROGRESS / PHASE_B2_R3_PARTIAL_TRUSTED_CALLER_REQUIRED`，不标 COMPLETE/HUMAN_APPROVED/FROZEN；TASK-V2-20 未开始。独立报告见 `docs/delivery/v2-e-task-19-phase-b2-r3-synthetic-rehearsal.md`，19/20/21/22 Gate 不变。

2026-09-27 TASK-V2-19 Phase B2-R1：只在本地修复已部署 B1 骨架的 P0 caller/capability 与 P1 持久功能缺口，生成六个**未部署** replacement zip／SHA-256 和独立审核报告 `docs/delivery/v2-e-task-19-phase-b2-r1-shadow-function-remediation.md`；本地安全负测、12 BoardInstance 场景、全量自动门与静态 allowlist 检查通过。当前 `TASK-V2-19 = IN_PROGRESS / PHASE_B2_R1_READY_FOR_ARTIFACT_DEPLOY_REVIEW`，远端仍为默认关闭的 B1 旧包。B2-R2 六函数更新部署及 secret 轮换/绑定、之后的 synthetic rehearsal／rollback 各自需要 Founder 单独授权；V1 frozen production boundary、19/20/21/22 Gate 和 TASK-V2-20 未开始状态不变。

2026-09-26 TASK-V2-19 Phase B1：Founder 单独授权的同环境 shadow provisioning 已完成并逐项 read-back：9 个 `ADMINONLY` 空 collection、15 个精确非 TTL index、6 个默认关闭的 Event Function，三个 shadow-only HMAC secret 仅报告绑定状态。V1 13 collection／43 index／19 function／4 trigger、配置／规则／Storage 前后 diff=0。TASK-V2-19 仍 `IN_PROGRESS / PHASE_B1_SHADOW_PROVISIONED_READBACK_COMPLETE`，停止码 `TASK_V2_19_SHADOW_PROVISIONING_READBACK_REQUIRED`；synthetic data、rehearsal、rollback、cleanup 和 V2-20 均未开始，19/20/21/22 Gate 不变。完整只读证据见 `docs/delivery/v2-e-task-19-shadow-resource-diff.md` 第 9 节。

2026-09-25 TASK-V2-18／V2-D 收口：Founder 明确确认压力测试结果与500点性能预算工作完成，并要求 TASK-V2-18 收口。将已通过的本地数值门、包体门和 Founder 真机体验门记为 `COMPLETE / HUMAN_APPROVED`；Worst 真机逐档 JSON、FPS、Native/GPU memory、PNG磁盘及真实生产账单仍无量化通过结论，按 `docs/delivery/v2-d-task-18-closeout.md` 交 TASK-V2-20／21 验证。V2-D 全部 TASK-V2-14—18 已批准，区块认知对齐未发现产品范围、平台、隐私、核心架构或顺序变化；V2-E 整组解锁为 `READY / NOT_STARTED`，19→20→21→22 的依赖和每个外部动作的独立授权仍生效。未开始 V2-E 实施，未 deploy、migration、commit、push。


2026-09-25 TASK-V2-18 压测工具退役：Founder 指出真机压测及性能预算工作结束后，测试面板不应继续进入后续预览包。本区块内移除 develop 长按入口、WXML/WXSS 面板、测试服务注入和 Worst 强制 individual topology；将原 fixture／记录器及对应测试移到 `tests/fixtures/`，保留离线基准与历史结果。验证生产投影对 Worst 500 坐标执行正常聚合、包体不含测试模块，并执行 TypeScript、Lint、Vitest、Next build、微信预览编译与 workflow。此清理不改变正式地图产品行为，也不以清理动作补写缺失的真机量化证据；TASK-V2-19—22 与 V2-E 维持锁定。


2026-09-24 TASK-V2-18 性能预算 v2：Founder 指定以500档为容量标准并确认 Worst 500 多次交互流畅，撤回约100 individual 的旧候选，不加正式产品硬截断。预算分层定义500 lead／Worst 500 native binding 目标、每页50条／500 snapshot／120s、≤32,768 bytes/页与≤327,680 bytes/全量、同机 Node root／page／cluster／split P95、Dense≤3s/Worst≤5s首次稳定代理、帧间隔P95≤33.3ms、<2MiB、≤¥20/月；各层证据与待测项详见 `docs/delivery/v2-d-task-18-performance-budget-500.md`。本地回归通过，Founder 真机人工体验通过；Worst 500 binding 数、FPS、内存／PNG磁盘及生产成本仍缺数值验证。TASK-V2-18=`BUDGET_DEFINED / QUANTITATIVE_DEVICE_EVIDENCE_PENDING`，TASK-V2-19—22 与 V2-E 保持锁定；无生产代码、deploy、migration、commit、push。

2026-09-24 TASK-V2-18 真机 Marker 压测人工门：Founder 确认本次测试全部成功；500 档仅有一次极少、轻微闪动，作为已知观察交 TASK-V2-20 复核。压力测试标记 `PASS / FOUNDER_ACCEPTED`。收到一条 iPhone 16 Pro／iOS 26.2 的 Dense 500 `COLD_LIKE` JSON：500 条载入、最终 2 cluster／0 individual、首次稳定代理 2,039 ms、PNG 导出 1,015 次／0 失败；Worst 500 由 Founder 亲测无问题但未收到该档 JSON。完整证据边界见 `docs/delivery/v2-d-task-18-true-device-marker-stress-result.md`。FPS／内存和数值性能预算仍 `PROPOSED / NOT YET APPROVED`，TASK-V2-18 整体状态为 `AWAITING_FOUNDER_PERFORMANCE_BUDGET_DECISION`，不提前解锁 TASK-V2-19—22 或 V2-E。无产品代码、deploy、migration、commit 或 push。

2026-09-24 TASK-V2-18 真机 Marker 压测准备：同一 develop 预览构建提供 Worst/Dense ×100/300/500 六档、页面级 `COLD_LIKE` 重载、连续 `WARM`、JSON/剪贴板/console 导出。Worst 在仅基准 topology override 下精确提交 individual 100/300/500；由于 PNG footprint 和手机屏幕几何限制，不能宣称全部信息卡互不重叠。Dense 继续正式 cluster/picker。自动门通过，Founder iPhone 真机结果待交回，性能预算仍未批准；状态 `READY_FOR_FOUNDER_TRUE_DEVICE_STRESS_TEST`，TASK-V2-19—22 锁定。详见 `docs/delivery/v2-d-task-18-true-device-marker-stress-implementation.md` 与操作清单；无 deploy、commit、push。

2026-09-24 TASK-V2-18 性能基准补充：在已完成的规模／弱网／包体自动门上新增固定 10/30/50/100/200/300/500 点可重复基准与修复前后证据；报告 `docs/delivery/v2-d-task-18-performance-benchmark.md`，原始采样在 `artifacts/task18/`。192项 LRU 在200点以上同视口重访的重复导出已用已提交 binding 复用修复，相关回归与自动门通过。可见 Marker、payload、JS cluster 的数值建议仍为 `PROPOSED / NOT YET APPROVED`，正式预算保持 `MISSING_APPROVED_BUDGET`；微信 native/FPS/PNG磁盘、真实网络和低端内存不由 Node 基准冒充。TASK-V2-18=`IMPLEMENTED / AUTOMATED_GATES_PASS / AWAITING_FOUNDER_PERFORMANCE_BUDGET_DECISION`，TASK-V2-19—22 与 V2-E 继续锁定；无 deploy、commit、push。

2026-09-24 TASK-V2-18 已完成本地规模、弱网、资产及成本证据和自动门：`IMPLEMENTED / AUTOMATED_GATES_PASS / AWAITING_FOUNDER_REVIEW`。50/500/120s 合同、500 点聚合身份、2 MiB 门通过；延迟、帧率、marker/bytes 的批准阈值仍为 `MISSING_APPROVED_BUDGET`，真机与生产账单不在本任务内宣称通过。交付报告 `docs/delivery/v2-d-task-18-scale-network-package.md`。TASK-V2-19—22 与 V2-E 继续锁定；无 deploy、commit、push。

2026-09-24 TASK-V2-17 Founder 人工验收通过，状态转为 `COMPLETE / HUMAN_APPROVED`。按已确认的 PNG 生产路径移除旧 CSS customCallout 运行时代码，固定 PNG 回退保留；自动验证通过。区块认知对齐确认 V2-18 沿用同一 `map-preview`、五档 PNG footprint／缓存／latest-wins、真实坐标聚合和不可分离选择列表进行规模／弱网／包体证据，不改变产品范围、平台、隐私、核心架构或区块顺序。TASK-V2-18 解锁为 `READY / NOT_STARTED`，本次不实施；19—22 与 V2-E 保持锁定。

2026-09-24 TASK-V2-17 地图原生按钮层级修复：保留 map 内 `cover-view` 定位／刷新及原 handler，在详情、聚合选择、任何 modal 和地图空态遮罩打开时条件卸载按钮，关闭后恢复。验证 WXML 条件、详情／弹窗切换与按钮回归；微信开发者工具截图和预览编译通过后，必须由 Founder 在 iOS 真机确认按钮不会盖住详情、空闲态仍可点击，不以模拟器层级结果替代真机。

2026-09-24 TASK-V2-17 地图空筛选弹窗：将“未选择筛选条件”状态迁至页面根层的 V1 light-capsule 弹窗，保留原显示全部 handler；无匹配搜索与无结果筛选继续走已有 map-state 提示。验证弹窗出现、主按钮恢复全部并关闭、其它空状态不回归；微信开发者工具截屏检查尺寸、字级、按钮和原生地图遮罩。完成后与聚合选择持续浏览一同做自动回归，等待 Founder 真机验收，不解锁18—22。

2026-09-23 TASK-V2-17 聚合选择持续浏览：选择成员时保持Picker列表和滚动状态，复用既有详情选择链；详情卡前置于Picker并让两者同时可触达，外侧点击只关闭详情，直接选择另一行切换详情，关闭按钮退出Picker和详情。副标题做视觉底沿校准。自动验证覆盖连续A→B、外侧关闭、显式退出、20条滚动及异步详情竞态；微信DevTools截图检查列表与详情并存及点击行为。等待Founder真机验收，不解锁18—22。

2026-09-23 TASK-V2-17 选择版面弹窗补充修订：标题与数量说明同排底对齐，取消独立副标题行；弹窗可用发现标签绘制等宽紧凑胶囊，地图主标签规则不变；抽赏剩余0—9在地图和弹窗补零。验证0／8／9／10／未知数字、标签等宽与多标签、20条面板可见高度和滚动、原生地图 PNG 预览；截图核对后等待 Founder 真机验收，不解锁18—22。

2026-09-23 TASK-V2-17 选择弹窗视觉返修：复用 V1 弹窗外壳和生产 Marker Canvas 信息条，去掉 CSS 仿画。验证地图与列表缓存／几何隔离、原地图 PNG 输出不变、20 条加载与滚动、关闭交互，截取 V1 参考及新版顶部／底部作对照；执行全量测试及平台编译。仍等待 Founder 真机验收，不解锁18—22。

2026-09-23 TASK-V2-17 不可自然分离 Cluster 子步：确认 max-scale screen-space collision 后，让可自然分离的聚合继续 camera expansion；不可自然分离的真实位置组进入可滚动选择面板并复用现有详情。测试 A 两同坐标、B 两近点可分／不可分、C 20同坐标、D 20混合子组、E 20真实可分、F IP/主题与关闭手势，并复验 1—999 badge。完成定向／全量测试、TypeScript、Lint、微信 DevTools 编译和可见截图检查；报告 `docs/delivery/v2-d-task-17-unresolved-cluster-picker.md`。状态等待 Founder 真机验收，不解锁 TASK-V2-18。

2026-09-23 TASK-V2-17 PNG Zoom Adaptive：实现五档文字收展、PNG footprint碰撞、缩放限频及最终校正、latest-wins图片准备和固定版回退；验证慢速双向缩放、快速pinch、pan、单点／重叠／split／merge／exact-overlap、点击详情、10／30／100点负载。完成交付报告与平台检查后等待Founder iOS／Android真机验收。不解锁TASK-V2-18。

2026-09-23 TASK-V2-17 v6：完成等高青色背板、统一描边轮廓、数字区下方黑色短尾和内置 Oswald 700 轮廓。验证几何、尾尖连续路径、数字不调用系统 fillText、缓存及绑定回归；检查生产函数导出的普通／选中／聚合 PNG 并校准字体。仅本活动 step，后续18—22不解锁。真机重新验收描边、字体、点击落点与拖缩稳定性。

2026-09-22 TASK-V2-17 Canvas Marker visual v5：根据 Founder 截图检查结果移除聚合 stack 图标和多层背板，恢复代表性普通 Marker + 红色数量标识；青色底板增加左侧／下沿露出量。数字使用 `Oswald 700`、`tracking-tighter` 等效手工字距和基线下压 2px。重新编译并截图检查普通、选中、聚合三种状态后，再进入真机验收；不修改 cluster、camera、详情、后端或旧 CSS 回退。

2026-09-22 TASK-V2-17 Canvas Marker visual v4：按 Founder 最新正确截图与 Gemini Marker 结构重构 Renderer，不再沿用旧 CSS Marker 的左边框语义。定义 shadow／cyan backing plate／white card／black number field／text／status／tail 的 Canvas 层级；普通数字区采用接近满高的粗字形，聚合增加叠放背板、stack glyph 和数量 badge。自动验证覆盖层级常量、160×70 logical canvas、中心 anchor、badge 边界、DPR 导出和 render key v4；真机复验 PNG 稳定性、落点、点击区域、聚合视觉和视觉接近度，不修改 cluster、camera、详情、后端或旧 CSS 回退。

2026-09-22 TASK-V2-17 Canvas Marker visual v3：依据 Founder 三张截图重新校准 PNG，不复用旧 WXSS Marker 的尺寸／布局，也不采用多版面聚合样式。重定义 `136×66` logical canvas、`(68,61)` 尖尾 anchor、7px 尾尖、透明 padding、数字／标题 baseline、状态 palette；普通与聚合共享白色圆角主体，聚合只保留红色数量角标。自动验证覆盖 render key 版本、箭头中心几何、badge 边界、DPR 导出参数和聚合视觉输入；真机复验 PNG 稳定性、落点、点击区域、角标完整性及视觉接近度，不修改 cluster、camera、详情、后端或旧 CSS 回退。

2026-09-22 TASK-V2-17 Canvas Marker visual v2：依据 Gemini Marker HTML 与 Founder 截图重新绘制 PNG，不复用旧 WXSS Marker 的尺寸／布局。重定义 `176×82` logical canvas、`(88,76)` 尖尾 anchor、透明 padding、数字／标题 baseline、状态 palette；普通 Marker 采用白色圆角主体，聚合 Marker 采用独立叠层背板和 stack 主体。自动验证覆盖 render key 版本、箭头中心几何、DPR 导出参数、普通／聚合绘制分支和新状态色；真机复验 PNG 稳定性、落点、点击区域及视觉接近度，不修改 cluster、camera、详情、后端或旧 CSS 回退。

2026-09-22 TASK-V2-17 详情卡固定与赏级横向滚动：在既有 `map-preview` 详情卡内移除主体纵向 `scroll-view`，使用固定高度普通 view 和隐藏溢出保持卡片位置稳定；保留展开备注的局部滚动。赏级继续使用两行 row-major presentation，`tierColumnCount = ceil(tierCount / 2)`，通过原生 `enhanced + scroll-x + bounces` 轨道承载超过可视列数的未来赏级。自动验证覆盖固定卡片结构、两行列数推导、横向滚动属性和 1/5/6/8/11 个赏级的顺序；不修改 public contract、cluster、camera、后端或 TASK-V2-18。 【历史排版；已由2026-10-05 MAP_DETAIL_COLUMN_FIRST_TIERS_V1按列先上后下取代，不作为当前布局依据。】

2026-09-22 TASK-V2-17 地图手势／空白点击清除选择：在当前活动区块内新增统一 selection dismissal，真实 `regionchange begin causedBy=gesture` 与独立 map surface tap 都要立即关闭详情、清除 PublicMapClient selection、取消玫红 selected visual 和 lead camera tween；程序化 camera/cluster regionchange 不关闭详情，同一 Marker 触摸的伴随 surface tap 只短时消费一次。自动验证覆盖空白点击、拖动开始、程序化 regionchange、伴随 tap 和 selected Canvas/custom-callout view 清理；完成后保持 `IMPLEMENTED / AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`，不修改真实坐标、publicLeadId、cluster engine、后端或 TASK-V2-18。

2026-09-22 TASK-V2-17 详情选择跨视口刷新与缓入缓出相机：在当前活动区块内分离 `PublicMapClient` 的 root query generation 与 detail selection generation，确保相机触发的 `changeQuery` 不清空或作废当前 A→B detail selection；同时以可取消的 cubic ease-in-out 受控 camera tween 取代无 easing 参数的 `moveToLocation`。自动验证覆盖 query 开始／成功／失败期间详情保持、迟到 detail latest-wins、A→B 动画抢占、缓动端点／中点和动画期间不产生中间 viewport query；完成后保持 `IMPLEMENTED / AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`，不修改真实坐标、publicLeadId、cluster engine、后端或 TASK-V2-18。

2026-09-22 TASK-V2-17 Canvas PNG Marker A/B 实验：在当前活动区块内新增 renderer、render-key cache 与 binding adapter，只把 native Marker visual layer 从透明 icon + customCallout 切为 Canvas PNG `iconPath`，并以 `CANVAS_MARKER_ENABLED` 保留完整旧链路。第一阶段只覆盖普通／聚合／选中静态状态；缓存键禁止包含经纬度和 scale，拖动／缩放不得逐帧生成。自动验证覆盖 key 稳定性、缓存去重、binding 适配、fallback 与页面接线；微信 CLI 通过后状态保持 `AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`，不修改 cluster engine、请求、详情、后端或 TASK-V2-18。

2026-09-22 TASK-V2-17 Marker 详情稳定与相机平移（已被上方根因修正覆盖）：上一轮的 surface-tap guard 与 `MapContext.moveToLocation` 自动门已通过，但真机证明没有覆盖 viewport query 重置 detail generation 的实际闪退路径；本条保留为历史验证记录。

2026-09-22 TASK-V2-17 Marker 箭头与详情卡贴合修正：Founder 的预览／iOS 真机证据确认零尺寸 CSS border triangle 在 Native Map custom callout 合成层会退化为矩形，且根节点额外 `translate(-50%, -50%)` 与 76px camera offset 叠加造成 Marker 不在详情卡上沿正中。当前活动区块内改为普通／玫红选中 4× RGBA PNG 箭头，移除根节点二次居中，只保留 display-only visual offset，并把详情 target offset 调整为 0。自动门通过后继续为 `IMPLEMENTED / AUTOMATED_GATES_PASS / AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`；动态文字与交互仍在 custom callout，不引入运行时 Canvas，不修改 cluster engine、publicLeadId、detail contract、后端或 TASK-V2-18。

2026-09-22 TASK-V2-17 Marker 点击仲裁与聚合首击展开：修复 Native Map stationary touch 被 `touchcancel` 无条件抑制、详情已开时 `CAMERA_ANIMATING` 守卫拒绝 cluster，以及目标 scale 带旧 topology hysteresis 导致一次点击只放大不分离。当前活动区块内仅对确认拖动设置 native-tap suppression；cluster tap 可抢占普通 Marker camera，立即清除 detail shell，并按无旧 topology 滞回搜索第一次可分离 scale。自动门通过后继续为 `IMPLEMENTED / AUTOMATED_GATES_PASS / AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`；不修改 cluster engine 数据合同、publicLeadId、后端或 TASK-V2-18。

2026-09-22 TASK-V2-17 Marker 真机字体回归修正：Founder 的开发者工具／iOS 真机对照证据表明 custom callout 的 webfont fallback、直接文本 baseline 与 content-box Badge 边框造成字体和角标漂移。当前活动区块内把原生 Marker 改为显式系统字体栈 + 固定 glyph box，几何调整为 118×48px 主卡／122×60px shell／`anchorY=-30`，恢复玫红选中描边、左侧青色弧形轮廓、完整筛选状态和 76px 详情目标位；“显示全部”时全部筛选项同步 selected，并扩大 scroll viewport 防止描边裁切。“拆套”改为“刚刚拆套”。自动门通过后继续为 `IMPLEMENTED / AUTOMATED_GATES_PASS / AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`；cluster engine、publicLeadId、数据结构、后端与 TASK-V2-18 保持不变。

2026-09-22 TASK-V2-17 Marker selection preemption：修复旧 Marker camera move 的 `CAMERA_ANIMATING` guard 吞掉第二个 Marker 点击。不同普通 Marker 的点击现在可取消旧 camera/transition session，立即更新选中态、76px camera target 与 detail request；当前 Marker 重复点击和 cluster transition 仍保留保护。自动验证覆盖运行时 A→B 切换和静态调用顺序，状态保持 `AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`，不修改 cluster engine、publicLeadId、detail contract、后端或 TASK-V2-18。

2026-09-22 TASK-V2-17 Marker 与交互优化（已被上方真机字体回归修正覆盖）：在当前 V2-D 活动区块内，按 Founder 命令与四张参考／真机图修复 custom callout 固定几何、数字基线、anchor、尖尾、实际命中区、tap/drag 消歧、详情安全区 camera offset、cluster 即时视觉反馈、固定显示全部与五项 emoji 筛选及状态色。自动门通过后状态为 `IMPLEMENTED / AUTOMATED_GATES_PASS / AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`；cluster engine、publicLeadId、数据结构、后端与 TASK-V2-18 保持不变。

2026-09-21 TASK-V2-17 地图页面层级修复：在当前 V2-D 活动区块内，固定普通地图控件的显式 `map-surface-layer`，保持定位／刷新为 map 内 `cover-view`，并保持 Bottom Nav 在 map 分支外的页面根层。自动验证覆盖 WXML 闭合关系、层级 CSS、原生控件位置、Bottom Nav 层级与默认启动 tab；不改变 Marker、cluster、Zoom、Loading、数据或生命周期，不开始 TASK-V2-18。

2026-09-21 TASK-V2-17 Native Map cover-view 配置修复：保持当前活动区块不变，在根项目配置显式启用 `setting.coverView=true`，并通过静态回归阻止本机私有配置再次以 `false` 覆盖，恢复真机调试中的 custom callout Marker、地图 cover controls 与覆盖 UI；不改 Marker/cluster/query/lifecycle，不开始 TASK-V2-18。自动门通过后状态为 `IMPLEMENTED / AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`。

2026-09-21 TASK-V2-17 地图模块级生命周期修复：在当前 V2-D 活动区块内，将原生 `<map>` 从全局常驻调整为仅 `map-preview` 挂载；保留 Page 级 PublicMapClient、camera/viewport snapshot、stable marker 与查询状态，切出地图释放 Native Map context/采样调度，切回恢复 snapshot。自动验证覆盖地图模块条件挂载、独立 My 分支、snapshot 生命周期边界与微信 CLI 编译；不改变 Marker、cluster、Search、Filter、Info Card、Bottom Nav、后端或 TASK-V2-18。

2026-09-21 TASK-V2-17 Map Loading Overlay Fix：在同一活动区块内将 `QUERY_CHANGE` 从 `INITIAL_LOADING` 拆为非阻断 `VIEWPORT_REFRESHING`，复用既有 stable Marker snapshot、transient-empty guard 和顶部轻量状态。首次无数据加载仍使用全屏 overlay；自动门通过后状态为 `IMPLEMENTED / AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`，不改变地图生命周期、Marker/cluster、Zoom Deferred Presentation 或 TASK-V2-18。

2026-09-21 TASK-V2-17 Zoom Deferred Marker Presentation：在同一活动区块内将 Zoom observation 与 Marker Presentation 解耦；pinch 只更新 `observedScale`，下一次真实 pan 或 programmatic cluster camera settle 才以 240ms easeOutCubic、最多 8 次 Marker 视觉提交和最多 1 次 binding replacement 协调到 `targetPresentationScale`。自动门通过后状态保持 `IN_PROGRESS / ZOOM_DEFERRED_PRESENTATION_IMPLEMENTED / AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`，不解锁 TASK-V2-18。

2026-09-21 TASK-V2-17 Zoom synchronization repair：在同一活动区块内实施 Camera Scale 三态调度、query revalidation 稳定 projection 保留和 120ms latest-generation topology commit barrier；自动门通过后状态保持 `IN_PROGRESS / REPAIR_IMPLEMENTED / AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`，不提前解锁 TASK-V2-18。

2026-09-19 TASK-V2-16 closeout / TASK-V2-17 start：Founder 明确声明 TASK 16-B 与 TASK 16-C 已完成并通过人工验收；该声明作为本轮 approval source，不重新打开已批准的 marker、Info Card 或交互视觉。`TASK_V2_16 = COMPLETE / HUMAN_APPROVED`。TASK-V2-17 已解锁并进入 `IN_PROGRESS`，范围限定为既有 `pages/home/index` / `map-preview` 内的微信原生 `<map>`、GCJ-02 定位、regionchange、响应式 Marker、cluster 与 exact-overlap spiderfy；TASK-V2-18—22 继续锁定。

2026-09-19 TASK-V2-16-C follow-up：移除聚合点击后的横向 marker 选择条，新增 `CLOSED → ZOOMING → SCATTERED` 展示状态。聚合点击先驱动 synthetic map surface zoom，再从原聚合坐标用 staggered radial transforms 散开独立信息 Marker；子 Marker 直接打开详情，地图空白处关闭展开。只改既有 map-preview 展示状态、WXML/WXSS 与测试，不改变 PublicLocation、identity、backend、DB 或 production adapter。

2026-09-19 TASK-V2-16-C follow-up：Founder 授权 `public-map-v2` Marker public view 增加由公开 tier facts 确定性推导的 `totalRemaining`，并把全部单点／fan-out 子点替换为“余抽数字 + IP + 标签”的代码绘制卡片 marker。重叠点增加两层无尖尾轮廓、粉色数量 Badge 与 hover／press 扇形反馈，点击仍复用既有 distinct-`publicLeadId` fan-out。范围只含 marker public presentation、合成 fixture、既有 map-preview WXML/WXSS 和相应合同／测试；不改 DB、Cloud Function、生产 adapter、其他页面或导航，不 deploy/commit/push。

2026-09-18 TASK-V2-16-C follow-up：单 marker 信息卡继续限定为本轮唯一实现范围；新增代码绘制圆眼 mascot、与标签解耦的装饰定位、draw-status 风格 summary header 迁移和 bottom-origin 卡片进入动画。自动验证后保持 `AWAITING_FOUNDER_VISUAL_REVIEW`，不解锁其他页面或后续任务。

2026-09-18 TASK-V2-16-C follow-up：在单 marker 信息卡内补齐公开余票推导的赏级概率标签、两行 row-major 赏级网格的弹性横向滚动，以及本地文件文本图标；自动验证后仍保持 `AWAITING_FOUNDER_VISUAL_REVIEW`，不解锁 16-B、其余 16-C 或 TASK-V2-17—22。 【历史排版；已由2026-10-05 MAP_DETAIL_COLUMN_FIRST_TIERS_V1按列先上后下取代，不作为当前布局依据。】

2026-09-19 TASK-V2-17 native map interaction closeout draft：在既有 `map-preview` 宿主完成原生 `<map>` 的稳定 cluster hierarchy、parent/child lineage、viewport buffer、semantic zoom、bounds-based cluster camera、split/merge topology transition 和最大 zoom circle/spiral spiderfy。手势期间不重建 topology，`regionchange end` 才执行一次最终投影与 viewport query；地图 Tab 保持原生节点挂载并复用 context/cache。当前自动验证已通过，TASK-V2-17 仍等待 Founder 的单实例运行／真机人工门，不解锁 TASK-V2-18。

## 0. 权威入口与当前状态

> 状态日期：2026-10-04
>
> 当前活动区块：V2-E；区块状态：IN_PROGRESS。TASK01—20保留已批准结论；TASK21 COMPLETE/HUMAN_APPROVED/PRE_PILOT_PASS/CLOSED_PILOT_WAIVED_BY_FOUNDER/EVIDENCE_GAPS_ACCEPTED；TASK22 IN_PROGRESS / PHASE1_D_COMPLETE / PHASE2_PRODUCTION_APPLIED / LIVE_BRIDGE_VERIFIED / GLOBAL_CONTINUOUS_ENABLED / AWAITING_REVIEW。
>
> CURRENT_V2_PLAN_AUTHORITATIVE=APPROVED；CURRENT_PLAN_ENTRY_COUNT=1；V2_PLAN_HUMAN_REVIEW_APPROVED=YES；V2_PRODUCTION_IMPLEMENTATION_READY=PHASE2_PRODUCTION_APPLIED / LIVE_BRIDGE_VERIFIED / GLOBAL_CONTINUOUS_ENABLED。

`memory-bank/implementation-plan.md` 是长期唯一CURRENT_IMPLEMENTATION_PLAN；忽略implementation-plan(1).md等副本。旧完整草案与implementation-plan-history仍HISTORICAL/NOT_EXECUTABLE。

基线为V1 Current Truth Registry、已批准TASK01—20合同及最终delivery；新方向由 `docs/decisions/v2-production-hot-start-direction.md` 明确批准。TASK19最终有效验收是minimal-real-wechat-rehearsal-closeout及progress中的2026-09-29 final ack，不采用较早final-acceptance/final-closeout的阶段阻断覆盖它；TASK20为founder-final-closeout；TASK21 Pre-Pilot为2026-10-01 pre-pilot-final-closure。

Phase1-D既有14集合/23显式索引/9函数及20bindings关闭态验收保持历史证据；Phase2资源及桥接已部署，2026-10-04恢复授权后真实CUFZBP转换/Marker及全局continuous通过并开启。Phase1-B既有identity风险接受/轮换豁免保持。NETWORK与正式微信发布LOCKED；本轮最终事实以progress顶部及独立closeout报告为准。

## 1. 当前版本状态

- V1.0.0：`PUBLISHED / FROZEN`；线上源码为 `03942f2067959a4b8b0eb6223c949e51e768587d`，`v1.0.0^{}` 精确指向该提交。
- V1.0.1：源码 `8d442aa7cc9f1921a9b9aade231b5884e8d2dd00` 已由合并提交 `929d189a06e13010e50abf4927bfec3b1ebd49fc` 进入 `main`；`UPLOADED=YES`、`APPROVED=YES`、`PUBLISHED=UNCONFIRMED`，因此 `V1_0_1_TAG_ALLOWED = NO`。该状态不阻塞 V2 规划。
- V1 Current Truth：37 条事实已由 runtime、tests/contracts、Git 与 release evidence 校验，`V1_VALIDATED_BASELINE_READY_FOR_HUMAN_REVIEW = YES`。
- 当前分支：`feature/v2-board-map`，HEAD 与 `origin/main`、merge-base 均为 `929d189a06e13010e50abf4927bfec3b1ebd49fc`。
- V2：V2-A/B/C/D与TASK01—20已人工批准，TASK19/20冻结；TASK21=`COMPLETE / HUMAN_APPROVED / PRE_PILOT_PASS / CLOSED_PILOT_WAIVED_BY_FOUNDER / EVIDENCE_GAPS_ACCEPTED`；TASK22=`IN_PROGRESS / PHASE1_D_COMPLETE / PHASE2_PRODUCTION_APPLIED / LIVE_BRIDGE_VERIFIED / GLOBAL_CONTINUOUS_ENABLED / AWAITING_REVIEW`；V2-E=IN_PROGRESS。shadow/candidate与Pre-Pilot历史证据保留、测试关闭；生产PLAYER真实桥接与continuous当前运行，NETWORK hot-start/actual release仍未开始。

## 2. 执行与认知传播协议

### 2.1 单工作树与版本流程

长期唯一工作区为 `/Users/cunfu/Documents/ichi 2`。只使用分支切换，不创建额外 worktree：

`latest validated main → feature/version branch → development → PR → merge main → actual WeChat publication → immutable tag`

### 2.2 区块、任务与人工门禁

1. 只有本文件明确标为 `READY` 的当前区块和任务才可执行。
2. 区块解锁时，区块内所有未完成 step 一并转为 `READY`。若 Founder 为特定区块另行批准显式顺序门禁，以该特例为准；V2-D 的 `14 → 15 → 16 → 17 → 18` 已完成。V2-E按19→20→21→22输入依赖推进；当前19/20已冻结、21决策关闭、22 Phase1本地自动门通过并等待外部动作批准，内部Phase依赖顺序与外部动作门生效。
3. 每个 step 完成自动验证后只能进入 `AWAITING_REVIEW`；自动通过不等于人工批准。
4. 区块内全部 step、区块级回归和人工验收通过后，才可关闭区块并进行下一次“区块认知对齐”。
5. TASK-V2-01—18 与 V2-A/B/C/D 已由 Founder 人工批准；V2-E 是当前就绪区块。任何候选／生产部署、资源创建、secret binding、迁移和发布都须在对应任务内单独获得授权。

### 2.3 Knowledge Propagation Protocol（认知传播协议）

当 `TASK-X` 产生新认知 `K-X`，且改变产品假设、数据语义、系统边界、API、privacy、state machine、平台能力、成本、性能、供给、moderation、测试或依赖时，必须在继续下游任务前：

1. 在 `progress.md` 记录 Knowledge Entry、证据、置信度和首次影响点；
2. 沿 `DEPENDENCIES`、`BLOCKS` 与 `DOWNSTREAM_TASKS_TO_UPDATE_IF_KNOWLEDGE_CHANGES` 找到全部未开始受影响任务；
3. 把任务标为 `AFFECTED_BY_K-X`，停止使用已失效假设；
4. 更新 assumptions、`DATA_CONTRACT`、`SECURITY / PRIVACY`、实现步骤、测试与验收；
5. 产品行为同步 `design-document.md`，技术选择同步 `tech-stack.md`，真实结构同步 `architecture.md`；
6. 必要时重新打开或新建 Product Decision Gate / Evidence Gate；
7. 重新通过 workflow/contracts 与人工审核后，才允许继续。

不得只更新当前任务，也不得明知认知变化仍按旧计划执行。

### 2.4 停止条件

出现任一情况立即停止：

- workspace、branch、base、当前区块或 current-plan 入口不一致；
- working tree 出现无法安全区分的非文档改动；
- V1 frozen contract 或 Storage boundary 被未授权修改；
- 高影响产品、隐私、位置、公开字段、架构、平台、成本或供给问题未关闭；
- 当前强制Evidence Gate没有足够证据；仅本次Founder明确豁免的Closed Pilot项按NOT_RUN/EVIDENCE_GAP_ACCEPTED记录，不恢复为TASK22前置门；
- 需要 deploy、migration、release、tag 或外部发布但缺少明确授权；
- 新认知使当前任务或下游验收失效。

### 2.5 质量、真机与发布门禁

- 文档任务运行 `node scripts/validate-workflow.mjs`、格式检查和 `git diff --check`；无生产副作用时运行 `corepack pnpm quality`。
- 涉及微信 camera、location、permission、sharing、upload、map SDK 或弱网恢复的任务必须有 `TRUE_DEVICE_GATE`；模拟器和单测不能替代真机。
- CloudBase 变更必须定点部署、merge/preserve env、read-back、必要时 reverse hash，并完成 black-box smoke。
- Release Gate 必须覆盖 quality、contracts、security negative、package size、CloudBase deployed version、DB/index/migration、privacy declaration、WeChat review、true-device matrix、rollback、GitHub sync 与 online-source commit。
- immutable tag 只能在用户确认微信实际 `PUBLISHED` 后创建。

## 3. V1 已验证能力摘要

详细事实以 `docs/delivery/v1-current-truth-registry.md` 为准：

- Account / Identity：可信微信上下文静默 find-or-create；内部 `accountId`、ICHI ID、ownership 已存在。
- Profile：nickname/avatar optional；默认资料只是 UI fallback；不要求手机号，不参与核心功能 gate。
- Recognition / Quota：camera-only、私有临时对象 → `fileID` → temp HTTPS URL → Bailian、冻结 R2 Direct Remaining、每日 5 次配额。
- Board / Draw：稳定 `boardId`、Local Board、不可变 baseline、authoritative draw events、本机恢复、确定性概率库、Board Outlook、生产提醒子集；`STOP_HOLD_DURATION_MS = 500`。
- Submission / Verification：版本化 Upload Submission，`LOCATION → PHOTO → NOTE → APPROVED`，Provider/validation/DB/projection/UI 错误边界分离。
- Current Publication：P1 保存轻量 metadata 与 `publishedSubmissionVersion`；完整事实来自精确 APPROVED Submission，不复制大型 snapshot/events。
- Seven Rules / Delete：owner+board 最多一个 current，FAILED attempt 隔离，本机／云端删除分离，durable tombstone/job 与 no-resurrection。
- Client：My Records 为 local-only，My Uploads 为 current-private-publication-only；异步响应受 identity/generation guard 保护。
- Security：私有 GCJ-02 capture evidence；13 个集合均 `ADMINONLY`；Storage `CUSTOM`，无 public collection/API。
- Sharing / Ops：V1.0.1 三 Tab 分享只允许 `tab`；friend image 127,613 bytes；2 MiB package gate、true-device、部署 read-back/reverse verification 与 single-worktree Git 规则已建立。

冻结契约保持：

- R2 Prompt SHA-256：`c083066c80999722a2e3207f64654c598e418daf1c51dba35d57abf0291a3462`
- R2 Provider Schema SHA-256：`178c3fffb9ad74257ad6fb0123509beacbd011225eae2aa7eb2d648beb690722`
- R2 Resolver SHA-256：`46ffebadc3094412c4beb9c8625acdf83346b496e382fe40a48083ff101411d8`
- Storage：现有 owner-scoped `CUSTOM` boundary 与 `recognition-temp/` 一天 orphan fallback

## V1

V1 为 `COMPLETED / FROZEN（已完成／已冻结）`。历史 task timeline 仅用于追溯，不是当前指令。

## V2

### V2 产品概念修正（2026-09-10）

好版地图不是普通的一番赏地点目录，也不是以店铺、marker 或地点本身为最小价值单位。它把 V1 历史、未来玩家贡献与 NETWORK_SOURCE/OFFICIAL_CURATED 热启动及审核式持续补充 形成的统一版面事实，经 ICHI Verification、来源对应的权利依据、Public Eligibility 与安全投影后，转化为帮助其他用户决策的可信版面机会地图。

```text
用户拍摄版面
→ V1 Recognition / Board Data / Draw Events / Submission Verification
→ Current Cloud Publication
→ Verified Board
→ Opportunity Evaluation
→ Public Candidate
→ V2 Public Eligibility Check（可先进入 PENDING_CONSENT）
→ 用户对 exact public preview 明确 Consent
→ Public Eligibility 最终通过
→ Projection
→ PublicMapLead
→ 地图展示 Verified Board Opportunity
→ 帮助其他用户判断是否值得到场核对与抽赏
```

地图最小价值单位定义为 `Verified Board Opportunity（已验证版面机会）`。它不是店铺、POI、marker 或普通地点；至少要把同一公开机会中的 IP／赏种、经过验证的剩余状态、观察时间、抽赏价值信息、Public Location Projection 与 freshness 一起表达，并始终说明这是最近观察结果而非实时库存。这里的“抽赏价值”指这些可信事实能帮助用户自行核对和决策，不是系统推荐、促抽排名、中奖保证或实时库存结论。

`Verified Board` 是任何来源经过 ICHI 图片识别、结构化提取和版面校验后形成的统一可信版面事实，回答“这个版面数据是否已由 ICHI 系统验证”。V1 的 Recognition、Board Data、Draw Events、Submission Verification 与 Current Publication 是 V1_HISTORY 的复用证据；来源本身不改变可信等级。Verified Board 不表示值得推荐、适合公开或应在地图展示。

`Opportunity Evaluation` 建立在 Verified Board 之上，单独回答“这个真实版面是否具有抽赏机会价值”。`真实性 ≠ 机会／推荐价值`：例如大奖已为 0 但低价值奖仍大量存在的版面可以 `Verified=YES`、`Opportunity=LOW`；大奖仍存在且高价值奖剩余比例较高的版面可以 `Verified=YES`、`Opportunity=HIGH`。该层不改变 private truth。

V2 Public Authorization 再回答“这个 exact public preview 是否适合公开”。只有 Opportunity Evaluation 满足后续获批的 PASS 规则，才可进入 Public Eligibility；D04-05 已批准 `PublicCandidate` 只可作为可选 service workflow concept，不进入固定核心链路。通过 consent、field allowlist、public location projection、freshness、privacy、moderation 与 operations eligibility 后，才可形成 `PublicMapLead` 服务结果。Venue/POI 不是必需 Gate。任何 Verified Board 都不能自动成为 PublicMapLead。

Opportunity Evaluation 第一阶段只定义 `Rule-based Opportunity Evaluation` 的信息表达方向，不实现算法。候选输入可讨论大赏剩余数量／比例、总剩余票、单抽价格、确定性包套总价、观察时间和 freshness；候选输出固定研究 `HIGH / MEDIUM / LOW / INSUFFICIENT`。当前不决定 score 公式、阈值、权重、ranking、推荐排序或 AI／黑盒评分；离散状态与 `Opportunity Evaluation = PASS` 的映射必须等待后续 Gate 和真实用户证据。

`Public Contribution Attribution Policy` 已由 D06-A1 调整为 PLAYER detail 展示获准的安全 nickname/avatar；没有自定义资料时使用 `ICHI 玩家` 和 ICHI fallback avatar。Attribution 不改变 Verification、Opportunity、Freshness、Rights 或 BoardInstance identity，Profile completion 也不成为浏览/贡献门禁。NETWORK_SOURCE当前显示“网络上传”，不伪造玩家Profile；旧文案及一次性采集限制由2026-10-02 Founder decision显式取代，runtime须版本化适配。

## 4. `V2_CAPABILITY_DELTA`

### `ALREADY_EXISTS_AND_REUSE（已存在，直接复用）`

- silent WeChat Account bootstrap、`accountId`、ICHI ID、ownership、optional Profile、默认 nickname/avatar fallback、stable avatar fileID、nickname `msgSecCheck`、no-phone。
- recognition quota、camera-only recognition、Storage → `fileID` → temp HTTPS URL → Bailian、冻结 R2、manual price、manual Grand Prize、`null != 0`。
- Local Board、`boardId`、draw events、baseline/event projection、Local Storage、My Records、deterministic core、Board Outlook、production reminder subset。
- versioned Upload Submission、LOCATION/PHOTO/NOTE、private Current Publication、`recordId`、`recordCode`、`publishedSubmissionVersion`、Seven Rules、failed isolation、durable delete/no-resurrection、My Uploads。
- private text-safety/location evidence、Storage CUSTOM/private ACL、V1.0.1 general sharing、package/quality/true-device/deploy/Git gates。

以上能力不得作为 V2 “从零实现”任务；对应旧任务统一标记 `ALREADY_COMPLETED_IN_V1` 或只保留明确的 V2 extension。

### `NEEDS_V2_EXTENSION（已有基础，需要 V2 扩展）`

- Account/Identity → owner public control、silent trusted Account read、rate/abuse/reporter/Human Assistance guards；完全 unauthenticated map read 不在 MVP。
- Profile → public-safe displayName/avatar projection、默认 fallback、资料变化如何影响已发布线索；private IDs/fileID 不公开，Profile completeness 仍不得 gate。
- Sharing → public detail deep link、`publicLeadId` allowlist、withdrawn/deleted fallback。
- Location → observation location、private capture evidence、public location projection、precision、manual/city fallback、edit/migration；venue/POI 仅可选增强。
- Private Publication → explicit public consent、eligibility、projection、moderation、withdrawal/deletion propagation。
- Text safety → 每个新 public field 的独立 safety/moderation/takedown/abuse policy。
- Delete / Async → public hide-first/tombstone/no-resurrection/deep-link invalidation，以及 viewport/filter/detail/pagination/location race guard。

### `NET_NEW_V2（V2 真正新增）`

- `Verified Board`、`Rule-based Opportunity Evaluation` 方向、`Verified Board Opportunity` 的地图价值、非实时理解、行动意愿、合法稳定供给和 target-platform/cost feasibility。
- Opportunity PASS 后的 eligibility workflow、explicit public consent、field preview、Observation/Public Location、public precision、public eligibility/privacy allowlist；PublicCandidate 仅为待决定的可选 workflow concept。
- storage-agnostic `PublicMapLead` 服务边界、opaque `publicLeadId`、public moderation/takedown/audit；物化、request-time 或 hybrid strategy 后续决定。
- bounded viewport/detail API、geo/index、rate limit/abuse、cache/freshness。
- map/list/filter/detail client state/UX、WeChat map SDK、permission/manual browse、clustering、safe deep link。
- V2-specific security/integration/true-device/pilot/privacy/review/release。

## 5. V2 产品范围

### `IN_SCOPE`

- 已批准信息表达与当前versioned Opportunity规则；Closed Pilot外部用户价值/行动证据明确豁免、缺口接受，生产供给/安全/时效/真机证据转TASK22。
- 至少建立一条合法、稳定、可撤回／下线的首发供给路线。
- private → public 的版本化地图贡献授权、eligibility/moderation、publish、edit、withdraw 与 delete；同一授权版本覆盖已说明范围内的合格历史 + 未来玩家记录，不逐条重复 consent。
- observation location／public location projection、最小 public read model、bounded API、map/list/filter/detail、safe deep link。
- freshness/cache/stale、marker density/clustering、weak network、rate/abuse、package/performance。
- 分层测试、生产真机、PLAYER continuous bridge、NETWORK OFFICIAL_CURATED审核式持续补充、50上海/300全国热启动、微信隐私/审核、生产回滚和actual publication。

### `OUT_OF_SCOPE`

- 实时库存保证、促抽排名、商家信用分、黑名单、论坛、帖子、评论、私信、feed 或公开消费档案。
- 客户端直接读 private DB、直接写 public collection，或把 Local Board/Submission history/P1/`recordCode` 当公共 source/identity。
- 修改冻结 R2/H0 或放宽现有 Storage bucket。
- destructive 跨 owner 记录合并、多人共识版本链和 V3 社群治理；D04-A1 只允许可纠错的 BoardInstance association，不合并 Observation/Source/Rights lineage。

### `DEFERRED`

- CanonicalBoard 与高层规范化 merge/unmerge、复杂 appeal/SLA、rich public note/photo；BoardInstance association correction/unlink/relink 不属于 CanonicalBoard merge。
- watch rules、订阅消息、后台提醒、抽赏结果海报和 package-heavy 社交资产。
- 门店／店员正式身份系统；首轮只允许作为 Evidence/Pilot 候选。
- public image；除非 `PDG-V2-04` 明确为 YES 且建立 `EXPLICIT_V2_UNLOCK_DECISION`。

## 6. Product Decision Gates

Product Gate 已由 TASK-V2-04—08 分批关闭；`DEFER` 是明确的 MVP 范围决定，不是未决 Founder Gate。后续任务只能按 frozen decision 实现或在发现新证据时按认知传播协议重开。

| Gate | 问题 | 选项 | 推荐决定 | 阻塞任务 |
| --- | --- | --- | --- | --- |
| `PDG-V2-01` | 地图浏览身份边界 | unauthenticated / silent Account / explicit login | `CLOSED / HUMAN_APPROVED`：复用 trusted silent Account，无显式登录／Phone／Profile gate；完全匿名不进 MVP | 05—22 |
| `PDG-V2-02` | `Public Contribution Attribution Policy` 如何展示贡献者 | anonymous / ICHI ID / nickname/avatar | `CLOSED / HUMAN_APPROVED ADDENDUM D06-A1`：PLAYER detail 显示 public-safe nickname/avatar + record type；NETWORK 不伪造 Profile | 05、07—22 |
| `PDG-V2-03` | V1 历史 Publication 是否进入 V2 | 不进入 / 逐条 consent / 版本化范围授权 | `CLOSED / HUMAN_APPROVED`：接受当前 `MapContributionAuthorization` 后，合格历史记录逐记录进入 Eligibility，不逐条弹窗且不自动 bulk-public | 05、10—12、15、19—22 |
| `PDG-V2-04` | 首发是否包含 public image | NO / YES + unlock | `CLOSED / HUMAN_APPROVED / NO`：MVP 无 public board/evidence image；获准 contributor avatar 是独立 Profile projection | 07—13、16—22 |
| `PDG-V2-05` | 首发 public fields 是什么 | 逐字段 PUBLIC/CONDITIONAL/PRIVATE/NEVER_PUBLIC | `CLOSED / HUMAN_APPROVED`：D08 explicit marker/detail allowlist；recordType + detail-only public Profile/venueNote；无 board/evidence image | 05—22 |
| `PDG-V2-06` | CanonicalBoard 是否进入 V2 | DEFER / manual link / automatic merge | `CLOSED / HUMAN_APPROVED / DEFER`；Source/Observation lineage 保持独立，即使关联同一 BoardInstance | 08—22 |
| `PDG-V2-07` | V2 完成是否包含提醒／海报等 extras | core map / +reminder / +poster / richer sharing | `CLOSED / HUMAN_APPROVED`：core map + safe detail link；其余 DEFER | 04、16—22 |

## 7. Evidence Gates

Evidence Gate不阻塞其自身证据产出任务。V2-B contract-level PASS和既有有限执行证据保留；本次waiver不制造empirical PASS。PDG-01—07的技术/隐私语义不变，Founder明确关闭Closed Pilot/旧RC前置Product Gate并批准NETWORK持续curator路线、50/300与“网络上传”；无新canonical TASK_ID。

| Gate | 保留证据 | Closed Pilot独占缺口 | TASK22必须实际复验 |
| --- | --- | --- | --- |
| EDG-V2-01 | PASS_FOR_V2_B_CONTRACT；TASK19—21有限链路证据 | 真实多用户稳定供给/discovery行为：WAIVED_BY_FOUNDER / NOT_RUN / EVIDENCE_GAP_ACCEPTED | PLAYER历史eligible/未来continuous bridge；NETWORK rights/审核/50与300成功ingestion/public lineage/可下线 |
| EDG-V2-02 | contract/本地500预算/已记录设备与shadow证据 | 未运行Pilot规模不补PASS | production geo/index/bounded query、50/300性能/read-back、true-device smoke |
| EDG-V2-03 | contract与条件估算，不等于实际账单 | pilot cost/scale：WAIVED_BY_FOUNDER / NOT_RUN / EVIDENCE_GAP_ACCEPTED | production查询/识别/审核/存储/流量/package预算、50/300成本与stop阈值冻结；不能把旧¥20目标当新实测 |
| EDG-V2-04 | contract LOWER_CONFIDENCE；EXTERNAL_USER_N=0；既有Founder视觉/Device A有限证据 | 真实多用户非实时理解/discovery-value/行动任务：WAIVED_BY_FOUNDER / NOT_RUN / EVIDENCE_GAP_ACCEPTED | 50/300展示正确、非实时/非推荐说明、Founder production真机验收；不替代真实用户研究 |
| EDG-V2-05 | approved四层location与已记录定位门 | Pilot用户位置理解/专用coverage校准：WAIVED_BY_FOUNDER / NOT_RUN / EVIDENCE_GAP_ACCEPTED | NETWORK地点原文/解析依据、公私精度/coverage、PLAYER定位及query/detail消费 |
| EDG-V2-06 | 已批准rights/moderation/hide-first及19—21举报/防复活有限证据 | Pilot真实运营/多用户abuse观察：WAIVED_BY_FOUNDER / NOT_RUN / EVIDENCE_GAP_ACCEPTED | production删除/下架/report/30d/迟到/current多贡献支持、运营owner与rollback实证 |

TASK22 release报告必须逐项区分既有证据、新production PASS、NOT_RUN与Founder accepted gaps；不得写“all EDG empirical PASS”。候选HA/rate/Freshness/cost参数仍需在TASK22冻结生产policy并实测；Pilot calibration requirement迁移到production validation，不照搬测试参数。

## 8. Public Source of Truth 与领域模型

### 8.1 Source-specific Authoritative Private Inputs

- `DRAW_RECORD`：`Current Cloud Publication P1 → publishedSubmissionVersion → exact current APPROVED drawSubmission` 的版本锁定组合。
- `UPLOAD_RECORD`：finalized direct P1 中的 user-confirmed/corrected board snapshot、recognition/correction provenance、observedAt、private location、locationNote、source/status 与 deletion/current state。

两条路径都是未来 V2 Verification 的私有 source-specific input，不是公共读取模型或 automatic Public PASS。Local Board、任意 Submission history、FAILED attempt 和 `recordCode` 都不是地图读取源；Direct 不因缺 assisted-specific submission 而永久失去进入 VerifiedBoard 的资格。

V2 地图的数据核心继续是 ICHI 自有数据库。NETWORK采用OFFICIAL_CURATED：上海50条production rehearsal后全国300条热启动，并以Codex审核式workflow持续补充；所有候选本地review、Founder批准后才可official ingestion，地图运行继续只读ICHI数据库，不依赖外部平台实时取数。

统一来源枚举为 `V1_HISTORY / PLAYER_DIRECT / PLAYER_ASSISTED / NETWORK_SOURCE`。`Source` 只记录来源和溯源证据，不产生可信度等级。统一验证状态只有：未完成 ICHI 图片识别、结构化提取和版面校验的 `NOT_VERIFIED`，以及完成全部 ICHI 验证步骤的 `VERIFIED`。地图展示必须以 `VERIFIED` 为前置。

Freshness继续以observedAt/basis与asOf/policyVersion确定，PLAYER使用可信capture/submission/draw依据；NETWORK必须冻结sourcePublishedAt/observedAt/basis/anchor关系，不把发表时间冒充已证明拍摄时间，fetchedAt不能续命。NETWORK新增30天public ceiling（待实现验证），只退出公开、不删除历史，不改变Verification。

### 8.2 Planned Public Domain（规划对象，尚未实现）

- `BoardObservation`：一次可追溯的版面观察输入；关联 `Source`、结构化版面信息、`observedAt`、拍摄／观察位置与可选 `venueNote`。它不是公开 marker，也不因来源或坐标存在而自动可信／公开。
- `VerifiedBoard`：从四类来源的统一 ICHI Verification 结果解析出的可信版面事实；V1_HISTORY 可复用符合条件的 exact approved version，其他来源完成同一 Recognition/Extraction/Board Validation；只表达 truth，不表达机会价值或公开资格。
- `BoardInstance`：现实中某地点、某时间连续存在的一张具体实体版面；多个独立 Observation 可以在保守唯一匹配后关联到同一实例，但 Observation、Source 与 Rights lineage 永不被物理合并、覆盖或删除。它不等于 VerifiedBoard、Venue、PublicMapLead 或 CanonicalBoard。
- `BoardInstanceResolutionEvidence`：resolver 或稀缺 Human Assistance 对候选连续性的版本化 evidence；用户回答不是 merge command，不能覆盖结构化 hard conflict。
- `OpportunityEvaluation`：基于 Verified Board 的独立、版本化、可解释机会价值判断；第一阶段只有 rule-based 产品方向，没有已批准算法、分数或排序。
- `FreshnessEvaluation`：统一基于 `observedAt` 和评估时点 `asOf` 产生的时效性判断；影响行动参考价值，不改变 Verification，也不触发删除。
- `PublicCandidate`：D04-05 已批准的可选 service workflow concept；不属于固定核心链路或权威 entity，也绝不自动公开。
- `MapContributionAuthorization`：玩家 owner 对版本化地图公开用途与范围的明确授权事实；同一版本可覆盖已说明范围内的合格历史与未来记录，material public-scope expansion 才要求新版本。每条记录仍独立判断 applicability、Rights、Eligibility、withdraw/delete 与 takedown；NETWORK_SOURCE 使用独立 rights/attribution/takedown eligibility，不伪造 owner authorization。
- `Location`：BoardObservation 的拍摄／观察坐标及其公开投影边界；marker 表达“这里曾出现版面机会”，不表达“这里是经确认店铺”。
- `Venue/POI`：非核心、可选增强信息；可协助地址解释或主动地点搜索，但不是 PublicMapLead、marker 或 MVP 上图的必需实体。
- `PublicEligibilityDecision`：规则／人工审核决定及 reason/version/actor/audit。
- `VerifiedBoardOpportunity`：Verified Board 经 Opportunity Evaluation 证明具有机会价值后的地图产品语义，由可公开的 IP／赏种、remaining、observedAt、机会理由、public location 与 freshness 共同构成；不是独立 private truth、普通地点、店铺 POI 或黑盒推荐分数。
- `PublicMapLead`：`VerifiedBoardOpportunity` 的 sanitized、allowlist-only、public-eligible、independently moderated、versioned public service boundary；不预设物化、request-time 或 hybrid 实现。
- `PublicLeadTombstone`：withdraw/delete/account-delete 后防 resurrection 的退休事实。
- `PublicModerationAudit`：approve/reject/hide/takedown/owner-withdraw 的最小审计。

### 8.3 Public API Read Source

public viewport/detail API 只读 `PublicMapLead`。禁止直接读取 Local Board、`drawSubmissions`、private P1、`PublicCandidate`、`recordCode`、private location/note/evidence。

### 8.4 Public Eligibility 流程

`BoardObservation → Verification → VerifiedBoard → OpportunityEvaluation → FreshnessEvaluation → V2 Public Eligibility → Public Projection → PublicMapLead` 仍是公开资格主链。BoardInstance Resolution 在 Verified structured facts 可用后独立回答跨 Observation 的现实连续性，并在 Public Projection 前决定实例 current-state 选择；它不是新的真实性或公开资格 Gate。真实性、连续性、机会表达、时效性与公开安全是独立结论：`VerifiedBoard = YES` 不推出 `UNIQUE_MATCH` 或 `Opportunity = PASS`，Freshness 下降不改变 Verification，以上结论也不推出 `Public Eligibility = PASS`。玩家来源缺 consent 时可停在 `PENDING_CONSENT`；NETWORK_SOURCE 缺使用依据、网络来源标签或 takedown owner 时 fail closed。最终 PASS 还必须满足 public field allowlist、public location/precision、privacy、moderation 与 withdrawal/delete/takedown propagation；Venue/POI 不是必需 Gate。任何一项失败都只影响 candidate/lead，不得破坏合法保存的统一数据事实。

### 8.5 BoardInstance Resolution 与后续继承

`D04-A1 BOARD_INSTANCE_RESOLUTION_MODEL = CONSERVATIVE_UNIQUE_CONTINUATION / HUMAN_APPROVED`。Location 只生成候选；identity signature 只用 verified structured facts；state transition 按 observedAt 检查物理合理性；只有唯一无冲突候选形成 `UNIQUE_MATCH`，无候选形成新实例，多候选保持 `AMBIGUOUS`。这些词只冻结语义，不是 runtime enum。MVP 不依赖原图、thumbnail、image hash 或视觉 fingerprint。

| 下游范围 | 必须继承的约束 |
| --- | --- |
| TASK-V2-06 | Source 只作 provenance；所有来源可参与 resolution；关联不抹除各自 Rights lineage；Human evidence 必须有 provenance |
| TASK-V2-07 | Location 只作 candidate generation，不能单独证明 identity；同 location cluster 可有多个 BoardInstance；POI 非核心依赖 |
| TASK-V2-08 | 已解析实例最多一个 current map state；同地点不同实例可并存；AMBIGUOUS 不伪装确认；合同支持重叠、聚合和历史入口 |
| TASK-V2-09—13 / V2-C | 后续才设计 resolver、candidate lookup、signature/transition checker、association persistence、纠错和 projector/API 语义 |
| TASK-V2-14—18 / V2-D | 后续才实现 structured comparison、Human Assistance Budget/cooldown/skip 和 multi-instance UX |
| TASK-V2-19—22 / V2-E | 必须验证正常继承、换箱、同店同款多板、长期歧义、自动消歧、human 误判、budget、late/no-resurrection 与 `null != 0` |

association correction/unlink/relink 必须新增版本化决定而不修改原 Observation。新 Observation 已安全解析到同一实例并足以证明旧状态过时时，旧 current lead 先退出地图，即使新状态尚未完成公开门禁。PublicMapLead storage strategy 与 CanonicalBoard 继续 `DEFERRED`。

## 9. `PublicMapLead` / `publicLeadId` 服务边界候选合同

本节定义已由 D08-01—18 人工批准的服务语义，不冻结 storage/resource/projector implementation。物化、request-time 或 hybrid strategy 均由 TASK-V2-09/11 接管。

- `publicLeadId` 由服务端生成，opaque、不可枚举、不从 private ID/location/version 推导，目标熵至少 128 bits。
- 一个 private Observation lineage 同时最多有 `0..1` 个 active public derivation relationship；一个 public lead 属于一个 resolved BoardInstance 的连续 active public lifecycle，并引用当前 exact supporting Observation/version。support 从 A 切换到 B 不合并两条 lineage 或 Rights。
- 一个已解析 BoardInstance 在 current-map 服务语义下最多有 `0..1` 个 current state；该约束不决定 PublicMapLead 的物化或 identity 存储方式。
- 在已接受 authorization scope 未发生 material expansion 且其余 Eligibility 继续通过时，approved update 可保留同一 `publicLeadId` 并单调推进 `servedVersion`。
- withdrawal/delete/account deletion 立即移除受影响 contribution derivation。若仍有另一 eligible Observation 连续支撑同一 BoardInstance，current lead 可保持 ID 并推进 servedVersion；若全部 support 消失则永久 retire 当前 ID，未来重新公开使用新 ID。
- admin temporary hide 可保留 ID，但 viewport/detail/deep link 必须返回无 public payload 的稳定 unavailable 状态。
- 旧版本、迟到 projector、FAILED submission 不得覆盖新 served version，也不得复活 retired ID。

## 10. Location Projection 与 Public Field Classification

### 10.1 Observation Location 与 Public Location

1. `Observation Location`：BoardObservation 的拍摄／事件／网络观察位置，核心字段为可追溯坐标与 coordinate system；玩家还可提供可选 `venueNote`，例如楼层或附近描述。
2. `Private Capture Evidence`：设备 accuracy、原始定位上下文和验证证据保持私有，不能直接投影为 public payload。
3. `Location Resolution`：记录城市、区域、手动 pin 或可选解析结果及其依据；不等于 Venue truth。
4. `Public Location Projection`：按批准的 precision/consent/privacy 语义从合格 Observation Location 派生，用于 `PublicMapLead` marker 与 viewport query；V2-B 不冻结具体米级、网格或偏移参数。
5. `Optional Venue/POI Enhancement`：未来可通过地址解析、POI 辅助或用户主动地点搜索丰富描述，但不是地图核心实体，不阻塞 MVP 上图。

`observation coordinate = confirmed shop/POI coordinate` 永远不是合法推断；marker 的语义是“这里曾出现过具有价值的版面”，不是“这里存在某家已确认店铺”。

### 10.2 `PUBLIC_FIELD_CLASSIFICATION` frozen contract

未知字段默认 `PRIVATE / NOT_PUBLIC`；最终 public allowlist 已由 `PDG-V2-05` 与 TASK-V2-08 冻结，Location/venueNote 输入边界由 TASK-V2-07 提供。

| 字段 | 最终合同分类 | 说明 |
| --- | --- | --- |
| `publicLeadId` | PUBLIC | opaque public lookup key |
| IP、theme | CONDITIONAL | 只来自 served approved version |
| remaining | CONDITIONAL | 保持 `null=unknown`、`0=confirmed zero` |
| observedAt、publishedAt、freshness | CONDITIONAL | 必须配合非实时说明 |
| public location、coordinate precision | CONDITIONAL | 只来自合格 Observation Location 的批准投影与 consent |
| venueNote | CONDITIONAL | 仅在 exact content/version 具有可验证 safety PASS、authorization scope 覆盖且 Rights/Eligibility/lifecycle 有效时公开；否则只省略字段 |
| recordType / source label | CONDITIONAL | PLAYER 为 `DRAW_RECORD/抽赏记录` 或 `UPLOAD_RECORD/上传记录`；NETWORK当前显示“网络上传”（版本化实现待TASK22）；不泄露internal source enum/private owner |
| contributor | CONDITIONAL / DETAIL_ONLY | PLAYER detail 仅 public-safe displayName/avatar；fallback 为“ICHI 玩家”与 ICHI avatar；NETWORK 不伪造玩家资料 |
| board/evidence image | NOT_PUBLIC / MVP_EXCLUDED | D08-15 已批准；如未来新增必须显式 scope/version/privacy/storage unlock |
| `recordCode`、`recordId`、`accountId` | NEVER_PUBLIC | private/support/ownership identifiers |
| draw events、full snapshot | NEVER_PUBLIC | public lead 只保留最小投影 |
| private capture geo、PHOTO evidence | NEVER_PUBLIC | 私有核验证据 |

## 11. Public Query 与 Client State 基线

Viewport Query contract 必须包含 bbox/cell、zoom、filters、limit、opaque cursor、`requestId`、`asOf`、cache/freshness metadata、max result/density，并由服务端限制。Detail API 只能通过 `publicLeadId` 返回 allowlist。

客户端必须维护 `queryKey`、request generation、viewport/filter/cursor/detail identity、`asOf`、stale indicator、cache TTL 和 late-response ignore。请求 A 后发生请求 B，B 先返回而 A 后返回时，A 不得覆盖 B；同样适用于 filter、pagination、detail、location、manual city、refresh 和 deep link。

## 12. 依赖顺序 V2 任务计划

### V2-A｜Discovery / Supply / Platform Feasibility

> 区块状态：COMPLETED
>
> 人工验收：HUMAN_APPROVED
>
> 收口子状态：COMPLETE
>
> 解锁条件：`SATISFIED`；Final Human Review 已通过，用户已明确解锁 `V2-A`。本区块只产出 Evidence，不创建 production V2 能力。

#### TASK-V2-01｜Dynamic Board Opportunity 信息表达模型

| 字段 | 计划 |
| --- | --- |
| TASK_ID | `TASK-V2-01` |
| TITLE | 定义 Dynamic Board Opportunity 信息表达模型与 Opportunity Model 方向 |
| STATUS | `COMPLETE / HUMAN_APPROVED` |
| CAPABILITY_DELTA_CATEGORY | `NET_NEW_V2` |
| OLD_V2_TASK_MAPPING | Historical `V2-01/V2-02`；2026-09-08 draft `TASK-V2-01` |
| GOAL | 定义 VerifiedBoard、Freshness 与 OpportunityReason 如何组合，使用户理解版面事实是否已核对、情报距观察时点多久、当前机会等级及其事实理由，并明确这不是实时库存、中奖保证或消费建议。不得再比较方案 C 是否比方案 B 更有价值。 |
| WHY_NOW | 在供给、架构和 UI 投入前先建立职责不重叠、可解释且不诱导消费的信息表达基线。 |
| WHY_NET_NEW_OR_EXTENSION | V1 只验证私有现场决策与版面真实性，没有验证经 public authorization 后的机会发现价值。 |
| EXISTING_V1_CAPABILITIES_REUSED | V1 术语、地图占位、经脱敏的合成版面摘要；不公开真实私有记录。 |
| INPUTS / PRECONDITIONS | 人工批准研究方案、代表性样本与隐私处理；不得使用未经同意的生产私有数据。 |
| AFFECTED_DOMAIN | `VerifiedBoard`、`Freshness`、`OpportunityReason`、`VerifiedBoardOpportunityExpression`、文案、等级、reason codes、理解风险。 |
| ARCHITECTURE_DECISION | 研究只定义 rule-based 方向，不实现算法，不批准 score/weight/ranking/AI；研究结果不能直接创建 runtime 架构承诺。 |
| DATA_CONTRACT | 研究合同 `VerifiedBoardOpportunityExpression`；`V2_INFORMATION_EXPRESSION_MODEL` 与 `OPPORTUNITY_MODEL_DIRECTION`：VerifiedBoard/Freshness/OpportunityReason 分层、`HIGH/MEDIUM/LOW/INSUFFICIENT`、稳定 reason-code 目录、连续 Freshness 候选、组件字段和待决 PASS 映射，不创建 runtime type。 |
| SECURITY / PRIVACY | 研究材料最小化；无 owner/private ID、照片或精确位置。 |
| FILES / MODULES EXPECTED | `docs/research/`、decision/delivery 文档；无业务代码。 |
| DEPENDENCIES | 本计划人工批准。 |
| BLOCKS | 04、07、16、20—22。 |
| PRODUCT_DECISION_GATES | informs `PDG-V2-01/02/05/07`。 |
| EVIDENCE_GATES | produces `EDG-V2-04`。 |
| IMPLEMENTATION_STEPS | 定义三层职责和最小输入；建立至少 8 个脱敏合成场景；输出组件化版面摘要、等级与事实 reason codes；比较连续 Freshness 衰减候选；检查 null/0、低 freshness、非实时与非推荐表达；完成 founder/internal walkthrough，并标记 `EXTERNAL_USER_N=0 / LOWER_CONFIDENCE`。 |
| TEST_STRATEGY | 合成 fixture schema、reason trace、null/zero、禁止建议文案、观察时间和连续衰减敏感性自动检查；内部理解检查；真实用户复验留到 21。 |
| TRUE_DEVICE_REQUIRED | `NO`；若使用真实小程序原型另设后续真机任务。 |
| CLOUD_DEPLOY_REQUIRED | `NO` |
| MIGRATION_REQUIRED | `NO` |
| ACCEPTANCE_CRITERIA | 三层职责不重叠；每个等级有可追溯事实和稳定 reason code；null/0 正确；全部合成场景识别观察时间与非实时边界；无消费／中奖／到店建议；未批准 score/ranking/AI/PASS 映射；用户批准信息层级、枚举、reason codes、Freshness 方向、披露文案及 Continue/Adjust/Stop。 |
| ROLLBACK / FAILURE_BOUNDARY | 无生产写入；失败只导致缩小／停止 V2。 |
| KNOWLEDGE_THAT_MAY_INVALIDATE_THIS_TASK | 目标用户不代表实际用户、用户持续混淆 Verification/Freshness/Opportunity、误解实时库存或推荐语义、候选输入不可解释或信息表达单位不成立。 |
| DOWNSTREAM_TASKS_TO_UPDATE_IF_KNOWLEDGE_CHANGES | 04、07、16、20—22，以及 PRD/design/completion definition。 |

#### TASK-V2-02｜动态版面地图的数据来源、统一验证流程与 Freshness 生命周期

| 字段 | 计划 |
| --- | --- |
| TASK_ID | `TASK-V2-02` |
| TITLE | 动态版面地图的数据来源、统一验证流程与 Freshness 生命周期 |
| STATUS | `COMPLETE / HUMAN_APPROVED` |
| CAPABILITY_DELTA_CATEGORY | `NET_NEW_V2 + NEEDS_V2_EXTENSION` |
| OLD_V2_TASK_MAPPING | Historical `V2-03/V2-04/V2-07/V2-18`；draft `TASK-V2-02` |
| GOAL | 定义 ICHI Dynamic Board Opportunity Map 的统一数据供给模型：接入 V1 历史、未来玩家直接贡献、辅助抽赏贡献，以及首次上线前一次性 NETWORK_SOURCE Initial Data Seeding；冻结 Source、ICHI Verification、observedAt/Freshness 与 Public Eligibility 的职责边界。 |
| WHY_NOW | 地图必须先有可持续且可追溯的 ICHI 自有数据池；热启动不能被误解为运行时依赖外部平台，也不能以来源替代系统验证。 |
| WHY_NET_NEW_OR_EXTENSION | V1 有私有 P1 与玩家路径，但没有统一 V2 来源枚举、NETWORK_SOURCE 初始填充、跨来源 Verification/Freshness 生命周期或 public eligibility。 |
| EXISTING_V1_CAPABILITIES_REUSED | private Current Publication、图片识别、结构化提取、版面校验、ownership、删除链、时间事实与只读聚合能力。 |
| INPUTS / PRECONDITIONS | 只读／聚合方法获批；NETWORK_SOURCE 只使用合规公开信息并保存溯源；不自动公开或批量迁移 V1 数据。 |
| AFFECTED_DOMAIN | Initial Data Seeding、source provenance、unified board model、verification、observedAt、freshness、retention、public eligibility、takedown、pilot readiness。 |
| ARCHITECTURE_DECISION | ICHI database 是地图数据核心；Source 与可信度解耦。统一状态为 `NOT_VERIFIED / VERIFIED`，只有完成 ICHI 图片识别、结构化提取和版面校验才可 VERIFIED；所有来源最终进入同一版面模型，地图只展示 VERIFIED + public-eligible projection。 |
| DATA_CONTRACT | `sourceType=V1_HISTORY/PLAYER_DIRECT/PLAYER_ASSISTED/NETWORK_SOURCE`、source provenance、verificationState/version/evidence、observedAt/observedAtBasis、freshness(asOf/value/version)、Opportunity Evaluation ref、Public Eligibility state/reasons；不含 source trust score/tier。 |
| SECURITY / PRIVACY | Source 只用于溯源；NETWORK_SOURCE 必须标注“网络来源”且不得伪装为 ICHI 用户上传。历史／网络内容的使用依据、字段 allowlist、public location、privacy、moderation、withdrawal/takedown 继续由 Public Eligibility 独立裁决；Venue/POI 仅是可选增强。 |
| FILES / MODULES EXPECTED | research/compliance/decision/delivery 文档、统一数据模型和只读审计／seeding 说明；无 production write。 |
| DEPENDENCIES | 本计划人工批准。 |
| BLOCKS | 04—05、07、10—12、20—22。 |
| PRODUCT_DECISION_GATES | informs `PDG-V2-02/03/05/06/07`。 |
| EVIDENCE_GATES | produces `EDG-V2-01/06`；21 复验。 |
| IMPLEMENTATION_STEPS | 定义四类 Source 与统一版面模型；设计 V1_HISTORY 只读接入与两条玩家未来贡献；NETWORK_SOURCE Initial Data Seeding 分三阶段：单一区域约 20 条验证 Network Source→Recognition→Opportunity Evaluation→Freshness→Database→Map Display 完整链路，通过后才扩大网络样本采集，最终只把处理后的数据导入数据库并进入发布流程；明确这不是上线后的持续自动采集；定义跨来源 `NOT_VERIFIED→VERIFIED`、各来源 observedAt basis、连续 Freshness/retention/Public Eligibility；完成 provenance、错误时间、重复、撤回/takedown/no-resurrection tabletop；保留 `PILOT_READINESS_TARGET` 仅评估 gap。 |
| TEST_STRATEGY | source/provenance schema、跨来源同一 Verification fixture、observedAt basis、Freshness 单调性、source-trust 字段禁用、NETWORK_SOURCE 标签、duplicate/idempotency、撤回 tabletop、只读查询与隐私审阅。 |
| TRUE_DEVICE_REQUIRED | `NO` |
| CLOUD_DEPLOY_REQUIRED | `NO` |
| MIGRATION_REQUIRED | `NO` |
| ACCEPTANCE_CRITERIA | 四类来源进入统一版面模型；没有来源可信度 score/tier；所有地图数据均 VERIFIED；observedAt basis 可追溯且 Freshness 不改变真实性／retention；NETWORK_SOURCE 只在首次上线前一次性 seeding 并显示“网络来源”；Public Eligibility 独立覆盖 rights/fields/public location/privacy/moderation/takedown；Venue/POI 不作为上图前置；30/10/14 仅为 readiness；用户选择 Continue/Adjust/Stop。 |
| ROLLBACK / FAILURE_BOUNDARY | 无 production/public write；单个来源或 seeding 不可行时可停用该入口，不影响 V1 private truth 或其他来源。 |
| KNOWLEDGE_THAT_MAY_INVALIDATE_THIS_TASK | 公开网络使用依据、V1 字段完整度、observedAt 可追溯性、Verification 一致性、重复冲突、供给量、freshness、删除责任或成本不足。 |
| DOWNSTREAM_TASKS_TO_UPDATE_IF_KNOWLEDGE_CHANGES | 04—12、15—16、20—22，以及 privacy/release/supply 文档。 |

#### TASK-V2-03｜平台、Geo、成本与包体可行性 Spike

| 字段 | 计划 |
| --- | --- |
| TASK_ID | `TASK-V2-03` |
| TITLE | CloudBase、map provider、geo/index、成本、限制和 package read-only spike |
| STATUS | `COMPLETE / HUMAN_APPROVED` |
| CAPABILITY_DELTA_CATEGORY | `NET_NEW_V2` |
| OLD_V2_TASK_MAPPING | Historical `V2-03/V2-13/V2-16/V2-17`；draft `TASK-V2-03` |
| GOAL | 验证目标环境的微信原生 map、坐标系、bounded query/index、anonymous/auth read、rate limit、延迟、成本、包体和 fallback，并确认腾讯 POI 只作为可选增强。 |
| WHY_NOW | 这些事实可能推翻 location projection、API、资源、客户端与 release 设计。 |
| WHY_NET_NEW_OR_EXTENSION | V1 无 public geo/query/provider 生产能力。 |
| EXISTING_V1_CAPABILITIES_REUSED | CloudBase Nodejs20.19、ADMINONLY pattern、部署 read-back、2 MiB gate。 |
| INPUTS / PRECONDITIONS | 只读官方文档／目标环境检查；用户已批准可删除、与生产隔离的 local spike。 |
| AFFECTED_DOMAIN | platform、geo、coordinate、cost、package、network、privacy declaration。 |
| ARCHITECTURE_DECISION | Spike 只产出 Evidence；不建 production resource，不改 frozen boundary。地图显示、marker、pan/zoom 与 viewport 采用微信原生 `<map>`；`wx.getLocation(type=gcj02)` 独立处理用户定位权限；腾讯位置服务 key 只用于后续 POI／地址解析等扩展服务，不是原生底图和基础 marker 的前置条件。 |
| DATA_CONTRACT | synthetic bbox/PublicMapLead query fixtures、optional POI capability/limit/cost matrix。 |
| SECURITY / PRIVACY | 不使用 production private location；记录 provider 数据处理和保留。 |
| FILES / MODULES EXPECTED | `docs/research/v2-a/v2-platform-geo-cost-package-spike.md`、`scripts/v2-a/validate-evidence.mjs`、测试号下独立可删除的 `spikes/v2-a-map-device/`；不修改 V1 `miniprogramRoot`，无 production artifact。 |
| DEPENDENCIES | 本计划人工批准。 |
| BLOCKS | 04、06、09、13、17—22。 |
| PRODUCT_DECISION_GATES | informs `PDG-V2-01/04/05/07`。 |
| EVIDENCE_GATES | produces `EDG-V2-02/03/05`。 |
| IMPLEMENTATION_STEPS | 仅依据执行时微信／腾讯位置服务／CloudBase 官方资料建立 matrix；以 30/1,000/10,000 个上海 synthetic points 测 bbox/cell bounded result、分页、密度、payload 与 package delta；测试号恢复后，在独立可删除微信项目验证原生 map、30 markers、pan/zoom、regionchange、权限、前后台、mock weak/offline/error、列表／手选城市 fallback 与 response generation，工程不接 V1 包体、首页、用户流程、CloudBase、DB、Storage 或生产 API；验证 Observation/Private/Public Location 边界；完成 iOS/Android 真机清单和腾讯位置服务控制台证据；估算 20 元/月增量预算和 Stop 条件。 |
| TEST_STRATEGY | 可重复 capability matrix、synthetic bounded-query benchmark、fixture/hash/package measurement；官方事实、合成事实、推断与真机事实分栏。 |
| TRUE_DEVICE_REQUIRED | `YES`；微信原生 map/location permission 的设备事实必须形成 Evidence；optional POI 只需控制台能力证据，不得作为 production deploy。 |
| CLOUD_DEPLOY_REQUIRED | `NO`；禁止 production deploy。 |
| MIGRATION_REQUIRED | `NO` |
| ACCEPTANCE_CRITERIA | iOS/Android 完成地图、权限允许／拒绝和 fallback 检查；四层位置不混用；查询始终 bounded 且不直读 private collections；成本 ≤20 元/月或明确 Adjust/Stop；2 MiB gate 可行；用户批准推荐方向或明确改变／停止 V2。 |
| ROLLBACK / FAILURE_BOUNDARY | disposable artifact 可删除且不触达 production/frozen resources。 |
| KNOWLEDGE_THAT_MAY_INVALIDATE_THIS_TASK | provider、coordinate、CloudBase limits、cost、package 或 target-device 不可行。 |
| DOWNSTREAM_TASKS_TO_UPDATE_IF_KNOWLEDGE_CHANGES | 04、07—09、13、17—22，以及 tech/architecture。 |

### V2-B｜Product Decisions 与 Public Domain Contracts

> 区块状态：COMPLETED
>
> 人工验收：HUMAN_APPROVED
>
> 人工验收：`COMPLETE / HUMAN_APPROVED`
>
> 收口结果：TASK-V2-04—08、D04-A1、D06-A1、Product/Evidence Gates、跨合同与 deferred ownership review 全部通过；详见 `docs/delivery/v2-b-closeout-review.md`。

#### TASK-V2-04｜Domain Model、System Contract 与 Gate 收口

| 字段 | 计划 |
| --- | --- |
| TASK_ID | `TASK-V2-04` |
| TITLE | 冻结版面机会情报地图 Domain Model、System Contract、Evidence Gates 与 V2 completion scope |
| STATUS | `COMPLETE / HUMAN_APPROVED` |
| CAPABILITY_DELTA_CATEGORY | `NET_NEW_V2` |
| OLD_V2_TASK_MAPPING | Historical `V2-00/V2-03/V2-04`；draft `TASK-V2-04` |
| GOAL | 以 01—03 的 Evidence 提交 `BoardObservation → Verification → VerifiedBoard → OpportunityEvaluation → FreshnessEvaluation → Public Eligibility → Public Projection → PublicMapLead` 的职责、identity、version、cardinality、ownership 与 failure boundary 合同供 founder 冻结；审阅 EDG/PDG 并明确后续 owner，不要求本任务提前关闭所有后续 Product Gate。 |
| WHY_NOW | audience、fields、source、observation location、supply、history、image、canonical 与 scope 决定所有下游；Venue/POI 已从核心实体降为可选增强，必须先消除旧“地图找店”假设。 |
| WHY_NET_NEW_OR_EXTENSION | V1 从未批准 public map MVP。 |
| EXISTING_V1_CAPABILITIES_REUSED | V1 Current Truth、隐私／发布契约和已验证 release evidence。 |
| INPUTS / PRECONDITIONS | 01—03 完成；V2-A 人工验收 PASS；地图核心为 ICHI BoardObservation/PublicMapLead，微信原生 `<map>` 只消费 viewport bounded query；腾讯位置服务为 Optional Location Enhancement。 |
| AFFECTED_DOMAIN | BoardObservation、Verification、VerifiedBoard、BoardInstance/Resolution Evidence、OpportunityEvaluation、FreshnessEvaluation、Source、Location、Public Eligibility、Public Projection、PublicMapLead，以及整个 V2 产品、架构、测试与发布定义。 |
| ARCHITECTURE_DECISION | 只冻结领域／系统边界和决策，不创建 runtime。PublicMapLead 只作为公开服务边界，不冻结物化、动态或混合实现；地图打开后不得依赖腾讯 POI 搜索取数；Venue/POI 不得成为 PublicMapLead identity 或上图前置。D04-A1 以非破坏性 Addendum 冻结 BoardInstance 的保守唯一继承，不重启 CanonicalBoard。 |
| DATA_CONTRACT | approved entity relations、identity/cardinality/version/lineage、ownership、authority、private/service/public boundaries、V1 adapter mapping；D04-01—08 与 `D04-A1` 已人工批准。 |
| SECURITY / PRIVACY | 最小披露、禁止字段、权限、provider 和审核义务均显式记录。 |
| FILES / MODULES EXPECTED | design、tech、architecture、plan、progress、`docs/research/v2-b/v2-domain-model-contract.md`、`docs/research/v2-b/v2-board-instance-resolution-contract.md`、`docs/delivery/v2-b-task-04-review-packet.md`；无 runtime 文件。 |
| DEPENDENCIES | 01—03；EDG evidence 可审阅。 |
| BLOCKS | 05—22。 |
| PRODUCT_DECISION_GATES | reviews/assigns `PDG-V2-01—07`；仅 D04-01—08 由本任务冻结，其他 Gate 留给 05—08。 |
| EVIDENCE_GATES | reviews `EDG-V2-01—06`；记录 PASS_FOR_CONTRACT、LOWER_CONFIDENCE 或 CONTRACT_PENDING，不伪造最终生产证据。 |
| IMPLEMENTATION_STEPS | 建立 Domain glossary、关系/cardinality/version/ownership/boundary matrix；定义 V1 P1/exact approved Submission 的只读 adapter；验证迟到结果、重复、withdraw/location/public projection 场景；审阅 Evidence/Product Gates；冻结 D04-01—08；追加 `D04-A1` BoardInstance Resolution Addendum，不实现 resolver。 |
| TEST_STRATEGY | domain invariant matrix、lineage/cardinality/version/failure scenarios、BoardInstance S1—S10 tabletop、viewport query trace、public projection allowlist、workflow、跨文档 contradiction、decision-to-task trace、scope diff。 |
| TRUE_DEVICE_REQUIRED | `NO` |
| CLOUD_DEPLOY_REQUIRED | `NO` |
| MIGRATION_REQUIRED | `NO` |
| ACCEPTANCE_CRITERIA | `PASS / HUMAN_APPROVED`：核心对象、V1 mapping 与 cross-layer invariants 完整；PublicMapLead storage strategy=`DEFERRED`；未冻结生产 lifecycle enum 或 Location 米级策略；自动验证 PASS；D04-01—08 与 D04-A1 已批准。 |
| ROLLBACK / FAILURE_BOUNDARY | 文档可回退；Evidence 不足则不进入 contract/implementation。 |
| KNOWLEDGE_THAT_MAY_INVALIDATE_THIS_TASK | 任一 Evidence 不足、互相冲突或用户改变核心 scope。 |
| DOWNSTREAM_TASKS_TO_UPDATE_IF_KNOWLEDGE_CHANGES | 05—22 及所有 current docs。 |

#### TASK-V2-05｜Lifecycle Semantics Contract

| 字段 | 计划 |
| --- | --- |
| TASK_ID | `TASK-V2-05` |
| TITLE | 正交生命周期语义、版本、隐藏、撤回、删除与 retention 契约 |
| STATUS | `COMPLETE / HUMAN_APPROVED` |
| CAPABILITY_DELTA_CATEGORY | `NEEDS_V2_EXTENSION` |
| OLD_V2_TASK_MAPPING | Historical `V2-05/V2-07/V2-09/V2-11`；draft `TASK-V2-05` |
| GOAL | 冻结 observation、verification、evaluation、eligibility 与 public visibility 的正交状态语义、事件和转换约束，并纳入独立、可纠错的 BoardInstance association lifecycle；不冻结完整生产状态枚举。 |
| WHY_NOW | public model、projector、API 和 UX 都依赖无歧义生命周期。 |
| WHY_NET_NEW_OR_EXTENSION | V1 APPROVED 只代表私有契约，不含 public consent。 |
| EXISTING_V1_CAPABILITIES_REUSED | P1 → approved Submission、stable IDs、owner binding、failed isolation、tombstone/jobs。 |
| INPUTS / PRECONDITIONS | 04 的 D04-01—08 与 D04-A1 已人工批准；相关 Product Gates 继续由 05—08 按 owner 冻结。 |
| AFFECTED_DOMAIN | observation revision、verification/evaluation semantics、BoardInstance association/evidence、consent、eligibility、visibility、retention、delete、account changes。 |
| ARCHITECTURE_DECISION | 使用正交状态语义而非单一总状态；候选标签只用于解释，不成为 runtime enum。BoardInstance association 是独立可纠错关系；AMBIGUOUS 不自动 merge/hide，human answer 不是 merge command。D05-01—08 已按推荐方案批准；D05-09 冻结 `HIDE_OLD_CURRENT_REEVALUATE_NEW`：public-affecting revision 立即移除旧 current lead，内部 metadata 变化不创建 Observation revision。Freshness 不是真实性／删除状态；owner withdraw 与 admin takedown hide-first；private P1 不自动 public。 |
| DATA_CONTRACT | approved semantic dimensions、transition/event/reason、exact version refs、timestamps/actor、HYBRID_SEMANTIC freshness、HIDE_CURRENT_KEEP_HISTORY、POLICY_BOUNDED_LAYERED retention、withdraw/delete/takedown/no-resurrection、BoardInstance UNIQUE_MATCH/NO_MATCH/AMBIGUOUS、association correction/unlink/relink、human evidence 与 `HIDE_OLD_CURRENT_REEVALUATE_NEW`。 |
| SECURITY / PRIVACY | 无默认勾选或 implicit consent；显式版本化授权可以覆盖已说明范围内的历史 + 未来记录；Profile/phone 不 gate；material public-scope expansion 需要新授权版本。 |
| FILES / MODULES EXPECTED | `docs/research/v2-b/v2-lifecycle-semantics-contract.md`、`docs/delivery/v2-b-task-05-review-packet.md`、design/architecture/plan/progress；无 runtime files。 |
| DEPENDENCIES | 04。 |
| BLOCKS | 06—08、10—22。 |
| PRODUCT_DECISION_GATES | lifecycle/consent semantics informs `PDG-V2-03/05`；最终 audience/fields 由 06/08 冻结。 |
| EVIDENCE_GATES | `EDG-V2-01/06`。 |
| IMPLEMENTATION_STEPS | 画正交 lifecycle 语义图；定义 transition/event/reason 与不变量；比较 Freshness dynamic/snapshot/hybrid；区分 hide/withdraw/takedown/delete/retention；补充 BoardInstance association、current-state safety、human evidence 与 false-merge-safe semantics；覆盖 late/failure/account-delete/republish；不输出完整生产 enum。 |
| TEST_STRATEGY | state-transition、BoardInstance S1—S10、human evidence conflict/budget、negative consent、stale digest、version race、delete/resurrection matrix。 |
| TRUE_DEVICE_REQUIRED | `NO` |
| CLOUD_DEPLOY_REQUIRED | `NO` |
| MIGRATION_REQUIRED | `NO`；本任务只冻结 contract。 |
| ACCEPTANCE_CRITERIA | `PASS / HUMAN_APPROVED`：所有 lifecycle 事件有确定 private/public 语义；候选标签不是生产枚举；Freshness/retention/delete 分离；D05-01—09 与 BoardInstance compatibility 已批准；自动验证 PASS。 |
| ROLLBACK / FAILURE_BOUNDARY | 未批准契约不得创建 public resource。 |
| KNOWLEDGE_THAT_MAY_INVALIDATE_THIS_TASK | consent、ownership、schema evolution、history、withdraw/delete 或 account-delete 改变。 |
| DOWNSTREAM_TASKS_TO_UPDATE_IF_KNOWLEDGE_CHANGES | 06—22 与 design/tech/architecture/privacy。 |

#### TASK-V2-06｜Source / Rights Model Contract

| 字段 | 计划 |
| --- | --- |
| TASK_ID | `TASK-V2-06` |
| TITLE | 四类 Source 的 provenance、rights、authorization、withdrawal 与 takedown 契约 |
| STATUS | `COMPLETE / HUMAN_APPROVED` |
| CAPABILITY_DELTA_CATEGORY | `NEEDS_V2_EXTENSION` |
| OLD_V2_TASK_MAPPING | Historical `V2-00/V2-05/V2-07/V2-09/V2-11`；V2-A `TASK-V2-02` rights/freshness follow-up。 |
| GOAL | 对 `PLAYER_DIRECT / PLAYER_ASSISTED / V1_HISTORY / NETWORK_SOURCE` 冻结 provenance、observedAtBasis、subject owner、operational steward、authorization/consent basis、withdrawal authority、takedown owner 与 rights evidence/version。 |
| WHY_NOW | Public Eligibility、withdrawal、history、seeding 和运营责任都依赖来源对应的权利合同，但来源不能承担可信度判断。 |
| WHY_NET_NEW_OR_EXTENSION | V1 private ownership/consent 不覆盖 V2 public rights；NETWORK_SOURCE 没有玩家 owner。 |
| EXISTING_V1_CAPABILITIES_REUSED | ownerAccountId、sourcePath、consentVersion、approved Submission、delete/tombstone/audit。 |
| INPUTS / PRECONDITIONS | 02、04（含 D04-A1）与 05 已 `COMPLETE / HUMAN_APPROVED`；本任务最终调整和人工批准均已完成。 |
| AFFECTED_DOMAIN | source provenance、owner/steward、public consent、network rights、history、withdrawal、takedown、seeding batch、BoardInstance association/human evidence provenance。 |
| ARCHITECTURE_DECISION | Source 只作 provenance，不作 trust score；所有来源 Observation 均可参与 BoardInstance Resolution，但关联不抹除各自 Source/Rights lineage。玩家来源采用 `VERSIONED_MAP_CONTRIBUTION_AUTHORIZATION` 覆盖已说明范围内的合格历史 + 未来记录，不逐条弹 consent；material public-scope expansion 才要求新版本。NETWORK_SOURCE 固定“网络来源”且只用于三阶段 Initial Data Seeding，不创建持续采集。 |
| DATA_CONTRACT | sourceType/ref/label、observedAtBasis、ingestedAt/batch、rightsBasis/version/evidenceRef、subjectOwner、operationalSteward、withdrawalAuthority、takedownOwner/state；MapContributionAuthorization version/scope/applicability；My Uploads cloud-source delete hide-first；10 distinct eligible reports auto-hide/moderation policyVersion；Human Assistance evidence 保留 private provenance 和 resolver context。D06-01—10 已人工批准。 |
| SECURITY / PRIVACY | private source URL/ref、owner identity 和 rights evidence 默认不公开；公开可见不等于允许再发布；缺 rights/takedown owner fail closed。 |
| FILES / MODULES EXPECTED | `docs/research/v2-b/v2-source-rights-model-contract.md`、`docs/delivery/v2-b-task-06-review-packet.md`、design/architecture/plan/progress；无 crawler、job、DB 或 runtime。 |
| DEPENDENCIES | 04—05 已批准。 |
| BLOCKS | 08、10—22。 |
| PRODUCT_DECISION_GATES | `PDG-V2-02/03/05`。 |
| EVIDENCE_GATES | `EDG-V2-01/06`。 |
| IMPLEMENTATION_STEPS | 已形成四来源 provenance/rights、跨来源 association no-collapse、统一历史 + 未来授权、network item-level rights/URL/attribution、Human evidence provenance、withdraw/delete/takedown responsibility、举报 auto-hide 与三阶段 seeding 契约；R1—R14 和 R-A—R-J tabletop 已通过；D06-01—10 已人工批准。 |
| TEST_STRATEGY | missing-rights、wrong-label、historical/future authorization、material-scope change、My Uploads delete、distinct/repeated/high-risk reports、cross-source same-instance、association-without-rights-collapse、human-evidence provenance、network-takedown、closed-batch、late-event 与 leakage matrices。 |
| TRUE_DEVICE_REQUIRED | `NO`；本任务只冻结 contract。 |
| CLOUD_DEPLOY_REQUIRED | `NO` |
| MIGRATION_REQUIRED | `NO`；只定义 V1_HISTORY 是否／如何进入 V2，不读取或回填生产记录。 |
| ACCEPTANCE_CRITERIA | `PASS / HUMAN_APPROVED`：四来源均有可追溯 rights/owner/steward/takedown 语义；统一版本化授权不合并记录 Rights lineage；My Uploads delete 和举报 hide-first 不触发 destructive delete；NETWORK_SOURCE 不冒充玩家且不是持续采集；D06-01—10、R1—R14 与 R-A—R-J 已通过。 |
| ROLLBACK / FAILURE_BOUNDARY | rights 不足只阻止公开；不破坏合法内部事实；任何持续 NETWORK_SOURCE 能力需新 Gate。 |
| KNOWLEDGE_THAT_MAY_INVALIDATE_THIS_TASK | consent、版权／平台政策、history 范围、attribution、withdrawal/takedown 或 seeding 运营变化。 |
| DOWNSTREAM_TASKS_TO_UPDATE_IF_KNOWLEDGE_CHANGES | 07—22 与 privacy/schema/release docs。 |

#### TASK-V2-07｜Location Model Contract

| 字段 | 计划 |
| --- | --- |
| TASK_ID | `TASK-V2-07` |
| TITLE | Observation Location、Location Resolution、Public Location Projection 与 Optional Enhancement 契约 |
| STATUS | `COMPLETE / HUMAN_APPROVED` |
| CAPABILITY_DELTA_CATEGORY | `NEEDS_V2_EXTENSION` |
| OLD_V2_TASK_MAPPING | Historical `V2-03/V2-13`；previous TASK-V2-06 location scope。 |
| GOAL | 冻结 ObservationLocation、LocationResolution、PublicLocationProjection 与 OptionalLocationEnhancement 四层精度模型和隐私边界；不冻结具体公开米数、网格或偏移参数。 |
| WHY_NOW | location 是地图 marker 与 consent/privacy 的共同前提，但 Location 不等于 Venue，腾讯 POI 也不是核心依赖。 |
| WHY_NET_NEW_OR_EXTENSION | V1 只有 private GCJ-02 capture evidence，没有公开位置投影合同。 |
| EXISTING_V1_CAPABILITIES_REUSED | private lat/lon/accuracy/capturedAt/source/consentVersion、radius verification、manual note。 |
| INPUTS / PRECONDITIONS | 03—06 已完成；04 identity/boundary 与 D04-A1、05 lifecycle、06 rights 均为批准输入；D07-01—10 已人工批准。 |
| AFFECTED_DOMAIN | observation location、BoardInstance candidate generation、coordinate system、resolution、precision semantics、venueNote、public projection、optional provider、privacy、fallback。 |
| ARCHITECTURE_DECISION | 四层位置模型；内部 Location 只生成 BoardInstance candidates，不能单独证明 identity，同一 cluster 允许多个实例；公共坐标采用微信地图兼容坐标系；公开精度只冻结 exact/approximate/area/not-public 语义，不冻结数值；Venue/POI 不成为 identity 或上图前置。D07-07=`PUBLIC_FROM_SAFETY_VERIFIED_SOURCE`：Safety Review 随 exact content provenance 而非字段名继承。 |
| DATA_CONTRACT | observationLocation/source CRS/evidence、locationResolution/basis/candidates/version、publicLocationProjection/precisionMode/authorization/policy version、可选 venueNote content/version/safety provenance、optionalEnhancement/provider/ref/version、PublicLocationCoverageUnit；具体 meter/grid/offset/cluster 参数 deferred。 |
| SECURITY / PRIVACY | resolver 可使用的 raw accuracy/capture context 仍属私有且 NEVER_PUBLIC；exact location 需明确授权；venueNote 只有在 authorization scope、Rights/Eligibility/lifecycle 与 exact content safety provenance 均有效时可条件公开；新内容/NETWORK_SOURCE/provider/admin note 需等价新安全门，失败只省略 note；位置不足 fail closed。 |
| FILES / MODULES EXPECTED | `docs/research/v2-b/v2-location-model-contract.md`、`docs/delivery/v2-b-task-07-review-packet.md`、design/architecture/plan/progress；无 provider adapter/runtime。 |
| DEPENDENCIES | 04；与 05/06 对齐后完成。 |
| BLOCKS | 08—22。 |
| PRODUCT_DECISION_GATES | `PDG-V2-05`。 |
| EVIDENCE_GATES | `EDG-V2-02/05`。 |
| IMPLEMENTATION_STEPS | 已形成并批准四层模型、coordinate semantics、source/resolution basis、BoardInstance candidate-only boundary、precision modes、content-provenance-bound venueNote safety inheritance、manual/city fallback、optional enhancement 与 PublicLocationCoverageUnit；L1—L16、L-A—L-F tabletop 已记录；具体数值策略 deferred。 |
| TEST_STRATEGY | L1—L16 与 L-A—L-F：candidate-not-proof、same-cluster multi-instance、exact/approximate/area/not-public、unknown CRS、manual pin、permission denied、note safety provenance/inheritance/field omission、provider unavailable、edit/version、authorization expansion、late/no-resurrection 与 private leakage matrices。 |
| TRUE_DEVICE_REQUIRED | `NO` |
| CLOUD_DEPLOY_REQUIRED | `NO` |
| MIGRATION_REQUIRED | `NO` |
| ACCEPTANCE_CRITERIA | `PASS / HUMAN_APPROVED`：四层模型及精度语义无歧义；没有冻结米级参数；Location≠Venue；Location 不能单独证明 BoardInstance；同 cluster 多实例合法；无合格 Public Location 时不生成 marker；venueNote safety 只按 exact content provenance 继承且失败时字段级省略；D07-01—10 已批准。 |
| ROLLBACK / FAILURE_BOUNDARY | location 无法安全投影时只保留内部 observation；Optional enhancement 不可用不阻塞核心合同。 |
| KNOWLEDGE_THAT_MAY_INVALIDATE_THIS_TASK | coordinate、privacy、consent、precision、manual fallback、venueNote 或平台位置政策变化。 |
| DOWNSTREAM_TASKS_TO_UPDATE_IF_KNOWLEDGE_CHANGES | 08—22 与 API/client/release docs。 |

#### TASK-V2-08｜Public Map Service Contract

| 字段 | 计划 |
| --- | --- |
| TASK_ID | `TASK-V2-08` |
| TITLE | 微信原生地图的 PublicMapLead identity、record execution、public Profile、viewport 与错误语义契约 |
| STATUS | `COMPLETE / HUMAN_APPROVED` |
| CAPABILITY_DELTA_CATEGORY | `NET_NEW_V2` |
| OLD_V2_TASK_MAPPING | Historical `V2-05/V2-06`；draft `TASK-V2-06` |
| GOAL | 冻结微信原生 `<map>` 消费的逻辑 PublicMapLead、public-field allowlist、viewport query/pagination、marker/callout、Freshness/Opportunity 展示和错误状态；不创建 API，也不冻结 PublicMapLead 物化／动态／混合实现。 |
| WHY_NOW | resource、projector、API、client、moderation 共用该契约。 |
| WHY_NET_NEW_OR_EXTENSION | V1 没有 public map service boundary、query contract 或 public identity。 |
| EXISTING_V1_CAPABILITIES_REUSED | V1 不存在单一 canonical record。DRAW_RECORD 使用 P1 + exact current `APPROVED drawSubmissions`；UPLOAD_RECORD 使用 finalized direct P1 的用户确认/修正 snapshot、recognition/correction provenance、observedAt/location/source/delete state进入共同 V2 Verification。复用 silent Account、safety-reviewed nickname、private avatar source 与默认 Profile fallback，但不直接公开 private fileID。 |
| INPUTS / PRECONDITIONS | 05—07 人工批准；D04-A1 为固定输入；`OPPORTUNITY_MODEL_DIRECTION` 已批准；D08-01—18 已由 Founder 按 adjusted proposal 批准。 |
| AFFECTED_DOMAIN | public service boundary、stable BoardInstance public lifecycle identity、source-specific input、recordType/visual hierarchy、public Profile、fields、viewport/pagination、multi-instance overlap/history、freshness、offline/error/compatibility。 |
| ARCHITECTURE_DECISION | PublicMapLead 保持 storage-agnostic。一个 resolved BoardInstance 最多一个 current public state；连续 active lifecycle 内 publicLeadId 稳定，所有 support 消失后 retire 且 later lifecycle 使用新 ID。recordType/Opportunity/Freshness 三维独立；同地点不同实例可并存，AMBIGUOUS 不合并。MVP read 使用 silent trusted Account，无 Profile gate。 |
| DATA_CONTRACT | opaque publicLeadId/servedVersion、public board/opportunity/freshness/location/disclosure、PLAYER `DRAW_RECORD/UPLOAD_RECORD`、detail-only contributor displayName/avatar、NETWORK label、可选 venueNote、stable-active-ID/current-state/multi-instance semantics；bbox/cell/zoom/filter/limit/cursor/requestId；items/nextCursor/asOf/schemaVersion/density/truncation；error/unavailable semantics。 |
| SECURITY / PRIVACY | allowlist-only；公开 contributor 只含安全 displayName/avatar reference，不含 openid/account/profile ID/phone/private avatar fileID/session/evidence。Record type 不是 trust score；不新增 screen-recapture/liveness/anti-spoofing。venueNote 继续按 D07-07 字段级 fail closed。 |
| FILES / MODULES EXPECTED | `docs/research/v2-b/v2-public-map-service-contract.md`、`v1-backend-field-inventory.md`、`v1-to-v2-map-field-mapping.md`、`docs/delivery/v2-b-task-08-review-packet.md`；无 API/runtime/schema deployment。 |
| DEPENDENCIES | 05—07。 |
| BLOCKS | 09—22。 |
| PRODUCT_DECISION_GATES | `PDG-V2-01/02/04/05/06/07`。 |
| EVIDENCE_GATES | `EDG-V2-02/04/05/06`。 |
| IMPLEMENTATION_STEPS | `DONE / DOCUMENT-ONLY / HUMAN_APPROVED`：修订 source-specific V1 mapping、stable active publicLeadId、marker/detail + record execution hierarchy、public Profile、silent Account read、allowlist与 D06-A1；D08-03/04/10/13/17 按调整批准，其余 D08 decisions 按推荐批准。 |
| TEST_STRATEGY | 既有 M1—M18 + 新增 M-A—M-N；D06 S-A—S-B；覆盖 draw/upload style×Opportunity 独立、Profile fallback/leakage、stable ID/support transfer/retirement、Direct mapping、silent Account、venueNote、multi-instance、cursor/density、offline/late/no-resurrection。 |
| TRUE_DEVICE_REQUIRED | `NO` |
| CLOUD_DEPLOY_REQUIRED | `NO` |
| MIGRATION_REQUIRED | `NO` |
| ACCEPTANCE_CRITERIA | `PASS / HUMAN_APPROVED`：服务边界、fields、viewport、pagination、marker/callout、freshness/opportunity 和 error semantics 已冻结；storage strategy 仍 deferred；forbidden private fields 不得出现；D08-01—18 已批准。 |
| ROLLBACK / FAILURE_BOUNDARY | breaking public contract 必须重新审核；本任务未创建 API/resource/runtime。 |
| KNOWLEDGE_THAT_MAY_INVALIDATE_THIS_TASK | field/location/cardinality/identity/freshness/moderation/lifecycle 变化。 |
| DOWNSTREAM_TASKS_TO_UPDATE_IF_KNOWLEDGE_CHANGES | 09—22 与所有 public API/UI acceptance。 |

### V2-C｜Resources、Write Path、Projection 与 Public API

> 区块状态：COMPLETED
>
> 区块子状态：`COMPLETE / HUMAN_APPROVED`
>
> Reconciliation 日期：`2026-09-13`
>
> 最终工作集：`TASK-V2-09—13 / COMPLETE / HUMAN_APPROVED`
>
> Founder approval record：2026-09-13 `V2-C_to_V2-D_Knowledge_Alignment_State_Transition.txt` 明确批准 TASK-V2-10—13 `APPROVE AS RECONCILED` 与 `V2_C_RECONCILIATION=PASS`。这取代此前“待最终验收”的 current 状态，但不把 production deploy/migration/resource obligations 写成已完成。
>
> `AFFECTED_BY_K-V2B-BOARD-OPPORTUNITY-MAP`：V2-C 使用 BoardObservation/Public Location/PublicMapLead 语义；Venue/POI 和腾讯地点搜索不作为 MVP 核心依赖。V2-D 尚未解锁。
>
> `INHERITS_D04-A1_BOARD_INSTANCE_RESOLUTION`：TASK-V2-10 的本地 resolver、candidate lookup、BoardIdentitySignature、BoardStateTransition、association correction/unlink/relink 与 TASK-V2-11/13 current-state behavior 已批准。False Merge 优先于 False Split；AMBIGUOUS 不得物化成已确认 merge。

#### TASK-V2-09｜Query、Security、Resource 与 Migration Contract

| 字段 | 计划 |
| --- | --- |
| TASK_ID | `TASK-V2-09` |
| TITLE | bounded viewport/detail、geo/index、rate/cache、resource 与 rollback 架构 |
| STATUS | `COMPLETE / HUMAN_APPROVED` |
| CAPABILITY_DELTA_CATEGORY | `NET_NEW_V2` |
| OLD_V2_TASK_MAPPING | Historical `V2-06/V2-13/V2-17`；draft `TASK-V2-07` |
| GOAL | 在实现前冻结 PublicMapLead physical storage/materialization choice、API shape、index、limits、cursor、cluster、cache、cost、resource diff、migration 与 rollback。 |
| WHY_NOW | backend 与 client 不能各自发明 query semantics。 |
| WHY_NET_NEW_OR_EXTENSION | V1 无 public endpoint/geo index/rate boundary。 |
| EXISTING_V1_CAPABILITIES_REUSED | function envelope/error codes、CloudBase manifest、read-back/reverse verification。 |
| INPUTS / PRECONDITIONS | 03、08 已完成；EDG-V2-02/03 已达到 V2-B contract-stage PASS，PDG-V2-01/05 已关闭；用户已于 2026-09-12 明确授权开始 TASK-V2-09。 |
| AFFECTED_DOMAIN | PublicMapLead materialized/request-time/hybrid decision、public API、DB/index、performance、abuse、cache、deployment。 |
| ARCHITECTURE_DECISION | `D09-01—13 / HUMAN_APPROVED`：materialized public-safe core + request-time service envelope；Cloud Function logical service + silent trusted Account；server-only resource、geo index、snapshot-backed opaque cursor、no shared MVP response cache。API 只读 PublicMapLead；无 client DB access；server-bounded bbox/cursor/limit/rate。publicLeadId 不能反向作为 BoardInstance resolver evidence。 |
| DATA_CONTRACT | bbox/cell、zoom、filters、limit、opaque cursor、requestId、asOf、cache/freshness、detail ID、stable errors。 |
| SECURITY / PRIVACY | precision enforcement、enumeration/scraping budget、no private lineage/owner fields。 |
| FILES / MODULES EXPECTED | 本任务已产出 `docs/research/v2-c/v2-query-security-resource-migration-contract.md` 与 `docs/delivery/v2-c-task-09-review-packet.md`；未来 contracts/functions/resources/deploy manifests 仍锁定。 |
| DEPENDENCIES | 03、08。 |
| BLOCKS | 10—14、16—22。 |
| PRODUCT_DECISION_GATES | `PDG-V2-01/05/06/07`。 |
| EVIDENCE_GATES | `EDG-V2-02/03/05`。 |
| IMPLEMENTATION_STEPS | 已完成：比较 materialized/request-time/hybrid 并推荐 hybrid；定义 query/detail、geo/index、snapshot cursor、density、cache/rate/cost、PublicLocation policy carrier、resource diff、migration dry-run 与 rollback。D09-01—13 已 founder 冻结；没有实施资源。 |
| TEST_STRATEGY | contract/property/security/load plans；invalid bbox/cursor/limit；resource diff 和 cost review。 |
| TRUE_DEVICE_REQUIRED | `NO`；本任务只冻结 contract。 |
| CLOUD_DEPLOY_REQUIRED | `NO` |
| MIGRATION_REQUIRED | `NO`；本任务只产出 migration contract。 |
| ACCEPTANCE_CRITERIA | `PASS / HUMAN_APPROVED`：D09-01—13 全部按推荐批准；D09-07 仅是 pilot default，D09-11 仅是 operational target，TASK-V2-18/21 必须复验且不得牺牲 correctness/security。 |
| ROLLBACK / FAILURE_BOUNDARY | 无 resource deploy；不可行则回到 03/04/08。 |
| KNOWLEDGE_THAT_MAY_INVALIDATE_THIS_TASK | platform limits、field/precision、load、cost、rate、cache 或 abuse 改变。 |
| DOWNSTREAM_TASKS_TO_UPDATE_IF_KNOWLEDGE_CHANGES | 10—14、16—22 与 tech/architecture。 |

TASK-V2-09 Founder Decision Set：D09-01 hybrid serving；D09-02 Cloud Function + silent Account；D09-03 public GCJ-02 geo retrieval；D09-04 snapshot cursor；D09-05 no server identity merge；D09-06 two server-only logical resources；D09-07 page/snapshot/TTL pilot limits；D09-08 no shared MVP response cache；D09-09 account/global rate budget；D09-10 Public Location policy carrier；D09-11 ≤¥20 monthly incremental variable-cost gate；D09-12 shadow-first migration；D09-13 disable/hide-first rollback。当前全部为 `COMPLETE / HUMAN_APPROVED`；D09-07/11 的 pilot/operational 限定不变。

#### TASK-V2-10｜Map Contribution Authorization 与 Public Candidate Write Path

| 字段 | 计划 |
| --- | --- |
| TASK_ID | `TASK-V2-10` |
| TITLE | versioned map authorization、Public Candidate、eligibility applicability、withdraw/delete 与 owner-control backend |
| STATUS | `COMPLETE / HUMAN_APPROVED` |
| CAPABILITY_DELTA_CATEGORY | `NEEDS_V2_EXTENSION` |
| OLD_V2_TASK_MAPPING | Historical `V2-07/V2-09/V2-11`；draft `TASK-V2-08` |
| GOAL | 实现 owner-scoped Opportunity-pass Public Candidate、版本化历史 + 未来地图贡献授权、逐记录 applicability 与 withdraw/delete commands，不改变 V1 private publication semantics。 |
| WHY_NOW | projector 发布前必须有 durable authorization version/scope 与逐记录 applicability facts。 |
| WHY_NET_NEW_OR_EXTENSION | V1 ownership/function 基础存在，但没有 public consent command。 |
| EXISTING_V1_CAPABILITIES_REUSED | silent Account、source-specific P1/approved Submission、owner functions、audit/delete jobs、Profile optional。 |
| INPUTS / PRECONDITIONS | 05—09；implementation block 获批。 |
| AFFECTED_DOMAIN | source-specific Direct/Draw Verification adapter、BoardInstance candidate/resolution/association、authorization command/scope compatibility、owner state、per-record applicability、audit、history/future records、account deletion。 |
| ARCHITECTURE_DECISION | DRAW_RECORD 使用 P1 + exact current APPROVED drawSubmission；UPLOAD_RECORD 使用 finalized direct P1，共同进入 V2 Verification，禁止错版本 join。BoardInstance resolver 只用 verified facts + time-forward transition，Location 只生成候选，publicLeadId 不能作为 evidence。一份显式 `MapContributionAuthorization` version 覆盖其声明范围内的合格历史 + 未来记录及安全 Profile attribution；逐记录仍独立 Eligibility/Rights；material scope expansion 才 re-authorize；withdraw/delete 先同步 hide intent 再 cleanup。 |
| DATA_CONTRACT | source-specific authoritative refs、VerifiedBoard ref、BoardIdentitySignature/transition/resolution/association version、Human Assistance evidence context、OpportunityEvaluation ref/pass、PublicCandidate、MapContributionAuthorization version/scope（含 PublicLocation、eligible venueNote、safe nickname/avatar）/acceptedAt、owner、record applicability、precision policy、eligibility state/reason/time、actor/audit ID。 |
| SECURITY / PRIVACY | trusted owner binding、replay/stale digest protection；不要求 Profile/phone。 |
| FILES / MODULES EXPECTED | 已新增 `packages/v2-map` 的 types、source adapters、`verification.ts`、BoardInstance resolver、authorization/owner command reference implementation 与 TASK10/reconciliation tests；未接入 production Cloud Functions/resources/deploy。 |
| DEPENDENCIES | 05—09。 |
| BLOCKS | 11—12、15、19—22。 |
| PRODUCT_DECISION_GATES | `PDG-V2-01—05`。 |
| EVIDENCE_GATES | `EDG-V2-01/05/06`。 |
| IMPLEMENTATION_STEPS | 本地参考实现完成：source-specific Direct/Draw adapter 只生成 `VerificationInput`；`verifyBoard()` 生成 immutable exact-version `VerifiedBoard`；BoardInstance resolver 只接受 branded VerifiedBoard/current version，拒绝 raw/stale facts；`recordOpportunityEvaluation()` 与 `buildPublicCandidate()` 强制 exact-version binding，Opportunity level 与独立 public gate PASS 分离；另含 association correction/unlink/relink、bounded Human Assistance、authorization/applicability 与 owner hide-first。未发明 Opportunity 算法；CloudBase persistence/account-delete wiring 等待 production gate。 |
| TEST_STRATEGY | unit/contract/integration、cross-account、accept-once/no-repeat、history/future applicability、material-scope reauthorization、record delete hide-first、replay、unknown response。 |
| TRUE_DEVICE_REQUIRED | `NO`；由 20 覆盖真机。 |
| CLOUD_DEPLOY_REQUIRED | `NO_FOR_LOCAL_COMPLETION`；CloudBase adapter/resource 集成由 TASK-V2-19 复验，actual deploy 由 TASK-V2-22 执行。 |
| MIGRATION_REQUIRED | `NO_FOR_LOCAL_COMPLETION`；authorization/applicability migration 由 TASK-V2-19 rehearsal、TASK-V2-21 pilot/RC 验证并由 TASK-V2-22 实际应用；禁止在 owner 未接受当前版本或逐记录 Eligibility 未通过时 bulk-public。 |
| PRODUCTION_OWNER | TASK-V2-19=`integration/security/migration rehearsal gate`；TASK-V2-21=`pilot/RC validation`；TASK-V2-22=`actual deploy/migration/publication`。 |
| ACCEPTANCE_CRITERIA | `PASS / HUMAN_APPROVED AS RECONCILED`：无适用 authorization 不得 eligibility；同一版本不逐记录重复弹窗；owner actions 授权、幂等、可审计且 withdraw/delete hide-first。 |
| ROLLBACK / FAILURE_BOUNDARY | feature flag 禁止新 consent write；V1 private data 保持不变。 |
| KNOWLEDGE_THAT_MAY_INVALIDATE_THIS_TASK | consent/version、owner、history、account delete、venue 或 lifecycle 变化。 |
| DOWNSTREAM_TASKS_TO_UPDATE_IF_KNOWLEDGE_CHANGES | 11—12、15、19—22 与 privacy/release。 |

#### TASK-V2-11｜Monotonic `PublicMapLead` Projector

| 字段 | 计划 |
| --- | --- |
| TASK_ID | `TASK-V2-11` |
| TITLE | public projection、version advancement、hide-first 与 no-resurrection |
| STATUS | `COMPLETE / HUMAN_APPROVED` |
| CAPABILITY_DELTA_CATEGORY | `NET_NEW_V2` |
| OLD_V2_TASK_MAPPING | Historical `V2-06/V2-09/V2-11`；draft `TASK-V2-09` |
| GOAL | 只把 Verified Board、Opportunity PASS、source-current、authorization-applicable、public-eligible、moderated 的 Public Candidate 投影为承载 Verified Board Opportunity 的 PublicMapLead，并实现 BoardInstance 连续 active lifecycle 的稳定 publicLeadId。 |
| WHY_NOW | public API 必须依赖可信 serving projection。 |
| WHY_NET_NEW_OR_EXTENSION | V1 P1 没有 public projector。 |
| EXISTING_V1_CAPABILITIES_REUSED | publishedSubmissionVersion、monotonic submission、tombstone、maintenance retry。 |
| INPUTS / PRECONDITIONS | 08—10。 |
| AFFECTED_DOMAIN | projection、BoardInstance current support、public Profile projection、eventual consistency、failure、delete。 |
| ARCHITECTURE_DECISION | Provider/validation/DB/projection 分 checkpoint；FAILED/late private attempt 不改变 served lead。连续 eligible support 切换保持 publicLeadId 并推进 servedVersion；全部 support 消失才 retire。Profile current/snapshot/hybrid 与 public avatar delivery strategy 在此冻结并服从 D06-A1。 |
| DATA_CONTRACT | verifiedBoardVersion、opportunityEvaluationVersion/pass、candidateId、sourceVersion、BoardInstance/current support ref、servedVersion、authorizationVersion/applicability、eligibility/moderation/freshness、public contributor projection、publicLeadId、visibility/tombstone。 |
| SECURITY / PRIVACY | server-only write、strict allowlist、retired ID 不可 resurrection。 |
| FILES / MODULES EXPECTED | 已新增 `packages/v2-map/src/avatar-projection.ts`、`projector.ts` 与 TASK11/reconciliation tests；未接入 production resource/deploy。 |
| DEPENDENCIES | 08—10。 |
| BLOCKS | 12—22。 |
| PRODUCT_DECISION_GATES | `PDG-V2-02—06`。 |
| EVIDENCE_GATES | `EDG-V2-05/06`。 |
| IMPLEMENTATION_STEPS | 本地参考实现完成：private stable `avatarFileId` 只通过 trusted server issuer 转为短时 allowlisted HTTPS locator，invalid/missing/expired/deleted 均 fallback 且 private fileID 不序列化；PublicCandidate 只能由 branded VerifiedBoard + matching OpportunityEvaluation builder 生成；另含 create/advance/support-switch/retire、late sequence discard、retired-ID collision guard、dynamic Freshness 与 reconciliation。持久 outbox/retry、CloudBase compare-and-advance/avatar issuer wiring 等待 TASK-V2-19/22 production gate。 |
| TEST_STRATEGY | contract/integration/failure injection/concurrency/late/failed/delete/resurrection。 |
| TRUE_DEVICE_REQUIRED | `NO` |
| CLOUD_DEPLOY_REQUIRED | `NO_FOR_LOCAL_COMPLETION`；持久 projector/outbox adapter 由 TASK-V2-19 集成复验，actual deploy 由 TASK-V2-22 执行。 |
| MIGRATION_REQUIRED | `NO_FOR_LOCAL_COMPLETION`；projection migration 由 TASK-V2-19 rehearsal、TASK-V2-21 pilot/RC 验证并由 TASK-V2-22 实际应用；禁止未授权或未通过门禁的自动 public backfill。 |
| PRODUCTION_OWNER | TASK-V2-19=`integration/security/migration rehearsal gate`；TASK-V2-21=`pilot/RC validation`；TASK-V2-22=`actual deploy/migration/publication`。 |
| ACCEPTANCE_CRITERIA | `PASS / HUMAN_APPROVED AS RECONCILED`：lifecycle matrix 通过；旧/失败 attempt 不覆盖；withdraw/delete 不复活。 |
| ROLLBACK / FAILURE_BOUNDARY | 禁用 projector 并 hide public reads；无需回滚 private P1。 |
| KNOWLEDGE_THAT_MAY_INVALIDATE_THIS_TASK | cardinality、version、consent、tombstone、consistency 或 failure boundary 变化。 |
| DOWNSTREAM_TASKS_TO_UPDATE_IF_KNOWLEDGE_CHANGES | 12—22 与 architecture/ops。 |

#### TASK-V2-12｜Minimal Moderation 与 Operations

| 字段 | 计划 |
| --- | --- |
| TASK_ID | `TASK-V2-12` |
| TITLE | MVP eligibility、approve/reject、admin hide、owner withdrawal、takedown 与 audit |
| STATUS | `COMPLETE / HUMAN_APPROVED` |
| CAPABILITY_DELTA_CATEGORY | `NET_NEW_V2 + NEEDS_V2_EXTENSION` |
| OLD_V2_TASK_MAPPING | Historical `V2-09/V2-11/V2-17`；draft `TASK-V2-10` |
| GOAL | 运营选定的 structured MVP，同时保证 unauthorized action fail closed 和可下线。 |
| WHY_NOW | 无 moderation/takedown 就不能开放 public API。 |
| WHY_NET_NEW_OR_EXTENSION | V1 private verification/text-safety 不是 public moderation。 |
| EXISTING_V1_CAPABILITIES_REUSED | LOCATION/PHOTO/NOTE 作为 private input、roles/audit/delete jobs。 |
| INPUTS / PRECONDITIONS | 07、10—11；exact public fields fixed。 |
| AFFECTED_DOMAIN | eligibility、moderation、abuse、takedown、audit。 |
| ARCHITECTURE_DECISION | no-board-image MVP 采用 rule eligibility + explicit approval/hide/withdraw/audit；eligible venueNote 按 D07/D08 字段级门禁。`10_DISTINCT_ELIGIBLE_REPORTS` 作为 policyVersion 控制的 auto-hide + moderation trigger，不直接 delete；可信高风险 notice 独立 hide-first；heavy SLA defer。 |
| DATA_CONTRACT | reason/version/actor/audit event、review decision、distinct eligible reporter count/policyVersion、hidden/withdrawn/takedown state。 |
| SECURITY / PRIVACY | least privilege；hidden payload 不可 public read；owner precedence 与 reviewer separation。 |
| FILES / MODULES EXPECTED | 已新增 `packages/v2-map/src/moderation.ts`、`TrustedModerationService` ports 与 TASK12/reconciliation tests；physical functions/resources/admin tooling 未创建。 |
| DEPENDENCIES | 07、10—11。 |
| BLOCKS | 13、15—22。 |
| PRODUCT_DECISION_GATES | `PDG-V2-02/04/05/07`。 |
| EVIDENCE_GATES | `EDG-V2-01/06`。 |
| IMPLEMENTATION_STEPS | 本地参考实现完成：production-facing `ClientReportRequest` 不含 identity/eligibility/spam/moderator/credible flags；`ReporterAuthorityPort`、`ModeratorAuthorityPort`、`OwnerAuthorityPort` 从 server-trusted authority 构造 domain command；同一可信 account 跨 device 去重，客户端 spoof 字段无效；另含 threshold auto-hide、credible-notice hide-first、owner precedence、structured audit/minimal retention。physical role/resource/admin tooling 等待 production gate。 |
| TEST_STRATEGY | negative/security/role/idempotency、9/10 distinct reports、duplicate reporter、credible notice、hide latency、no-destructive-delete、audit completeness/fail-closed drills。 |
| TRUE_DEVICE_REQUIRED | `NO` |
| CLOUD_DEPLOY_REQUIRED | `NO_FOR_LOCAL_COMPLETION`；physical role/resource/admin adapter 由 TASK-V2-19 集成复验，actual deploy 由 TASK-V2-22 执行。 |
| MIGRATION_REQUIRED | `NO`；禁止 bulk migration。 |
| PRODUCTION_OWNER | TASK-V2-19=`integration/security/resource gate`；TASK-V2-20/21=`true-device/pilot ops validation`；TASK-V2-22=`actual deploy/publication`。 |
| ACCEPTANCE_CRITERIA | `PASS / HUMAN_APPROVED AS RECONCILED`：unauthorized decisions fail；public access 在批准时限内消失；审计完整。 |
| ROLLBACK / FAILURE_BOUNDARY | disable public endpoint/projector，保留 private V1 data。 |
| KNOWLEDGE_THAT_MAY_INVALIDATE_THIS_TASK | fields、review obligations、roles、abuse、hide SLA、owner precedence 变化。 |
| DOWNSTREAM_TASKS_TO_UPDATE_IF_KNOWLEDGE_CHANGES | 13、15—22 与 privacy/release docs。 |

#### TASK-V2-13｜Public Viewport 与 Detail API

| 字段 | 计划 |
| --- | --- |
| TASK_ID | `TASK-V2-13` |
| TITLE | 只读 PublicMapLead 的 bounded viewport/list/detail API |
| STATUS | `COMPLETE / HUMAN_APPROVED` |
| CAPABILITY_DELTA_CATEGORY | `NET_NEW_V2` |
| OLD_V2_TASK_MAPPING | Historical `V2-06/V2-14/V2-15`；draft `TASK-V2-11` |
| GOAL | 以稳定 paging、limit、cache、rate 和 hidden/deleted 语义提供 allowlisted public reads。 |
| WHY_NOW | client state 和 UI 必须消费真实 contract-backed API。 |
| WHY_NET_NEW_OR_EXTENSION | V1 无 public map endpoint。 |
| EXISTING_V1_CAPABILITIES_REUSED | function envelope/error code、deployment verification。 |
| INPUTS / PRECONDITIONS | 09、11—12。 |
| AFFECTED_DOMAIN | public read、geo filter、cache、error、abuse。 |
| ARCHITECTURE_DECISION | PublicMapLead-only；使用 D08-13 silent trusted Account guard、无 Profile gate；no client DB access。 |
| DATA_CONTRACT | viewport/list/detail request/response、cursor、limits、cluster/lead union、asOf/cache、stable unavailable errors。 |
| SECURITY / PRIVACY | output allowlist、precision、enumeration/rate control；marker 无 Profile，detail 只允许 D08-10 public-safe displayName/avatar，不含 internal Profile/account/private facts。 |
| FILES / MODULES EXPECTED | 已新增 `packages/v2-map/src/public-api.ts`、trusted account/shared rate/read-control/cursor-secret ports、local reference adapters、CloudBase geo query plan、TASK13/reconciliation tests 与 local-only resource candidate；未创建／部署 production Cloud Function/API/resource。 |
| DEPENDENCIES | 09、11—12。 |
| BLOCKS | 14、16—22。 |
| PRODUCT_DECISION_GATES | `PDG-V2-01/02/05/06`。 |
| EVIDENCE_GATES | `EDG-V2-02/03/05/06`。 |
| IMPLEMENTATION_STEPS | 本地参考实现完成：client request 不含可信 account/global-stop/rate/secret；`TrustedPublicAccountPort`、durable-capable `RateLimitStore`、`PublicMapReadControl`、`CursorSecretSource` 全部 fail closed，HMAC secret 至少 32 chars 且 server-only；local in-memory rate adapter 只能作为可共享注入的测试 reference，不是 production authority。另含 validation、geoWithin、exact bbox、allowlist、snapshot/cursor、visibility recheck、Freshness、stable errors、late generation。D09 的 no shared response cache 不变。 |
| TEST_STRATEGY | unit/contract/integration/cloud/load/negative/security/allowlist snapshot。 |
| TRUE_DEVICE_REQUIRED | `NO` |
| CLOUD_DEPLOY_REQUIRED | `NO_FOR_LOCAL_COMPLETION`；Cloud Function/public resource adapter 由 TASK-V2-19 集成复验，actual deploy 由 TASK-V2-22 执行。 |
| MIGRATION_REQUIRED | `NO_FOR_LOCAL_COMPLETION`；resource/index rehearsal 由 TASK-V2-19、candidate/pilot validation 由 TASK-V2-20/21、actual apply 由 TASK-V2-22 执行，且仅限已批准 resources/indexes。 |
| PRODUCTION_OWNER | TASK-V2-19=`integration/security/resource/index/migration rehearsal gate`；TASK-V2-20/21=`candidate/production-like validation`；TASK-V2-22=`actual deploy/migration/publication and secret binding`。 |
| ACCEPTANCE_CRITERIA | `PASS / HUMAN_APPROVED AS RECONCILED`：local contract tests、private leakage=0 与 hidden/deleted fail closed 已通过；实际 latency/result/cost production-like 复验仍归 TASK-V2-18/21。 |
| ROLLBACK / FAILURE_BOUNDARY | endpoint feature flag off、cache invalidation、private resources untouched。 |
| KNOWLEDGE_THAT_MAY_INVALIDATE_THIS_TASK | audience、allowlist、index/viewport/density/cache/rate/cost/freshness 变化。 |
| DOWNSTREAM_TASKS_TO_UPDATE_IF_KNOWLEDGE_CHANGES | 14、16—22 与 client/architecture。 |

### V2-D｜Client State、Consent UX 与 Map Experience

> 区块状态：COMPLETED
>
> 实现状态：`TASK-V2-14—18 / COMPLETE / HUMAN_APPROVED`；Founder 于 2026-09-25 指示 TASK-V2-18 收口。
>
> 收口依据：TASK-V2-18 本地自动门、包体门与 Founder 真机压力体验通过，500容量与分层预算已批准；缺失的设备数值和真实生产账单按既有 V2-E 任务承接，不伪记为量化通过。完整记录见 `docs/delivery/v2-d-task-18-closeout.md`。
>
> 顺序门禁：`TASK-V2-14 HUMAN_APPROVED → 15 → 16 → 17 → 18`。同一区块后续任务不会随 V2-D READY 一次性解锁。
>
> `INHERITS_D04-A1_BOARD_INSTANCE_RESOLUTION`：TASK-V2-14—18 必须支持 structured two-card comparison、一次上传最多一次询问、skip/cooldown/budget、SAME/DIFFERENT/CANNOT_TELL evidence 语义、同地点多实例与 marker overlap/aggregate/history。精确频率和视觉参数留到真机/pilot，不在 V2-B 写死。

> `V2-D FRONTEND EXECUTION STRATEGY ADDENDUM`：TASK-V2-14—18 的正式前端宿主冻结为现有真实 V1 小程序工程；V2-A spike 仅为 `TECHNICAL_SPIKE_ONLY`。V2-D 使用 `LOW-FIDELITY VISUAL + HIGH-FIDELITY INTERACTION + COMPLETE PRODUCT LOGIC`，Codex 负责工程／交互／结构／V1 integration 与 design handoff，不拥有最终视觉设计权。TASK-V2-16 内部强制执行 16-A／16-B／16-C，但三者不是新 canonical tasks；16-C 只有 Founder 明确提供或批准外部视觉方案后才能开始。完整共同约束见 `docs/delivery/v2-d-frontend-execution-strategy-addendum.md`。本 Addendum 不改变 V2-C frozen contracts、V2-D 产品范围、task 顺序或当前锁定状态。

#### TASK-V2-14｜Client Map State、Cache 与 Stale Guard

| 字段 | 计划 |
| --- | --- |
| TASK_ID | `TASK-V2-14` |
| TITLE | viewport/filter/pagination/detail/location 的 query identity、cache 与 race safety |
| STATUS | `COMPLETE / HUMAN_APPROVED` |
| CAPABILITY_DELTA_CATEGORY | `NEEDS_V2_EXTENSION` |
| OLD_V2_TASK_MAPPING | Historical `V2-09/V2-10/V2-14/V2-15`；draft `TASK-V2-12` |
| GOAL | 在真实 V1 小程序工程中建立低保真 V2 Map Page Structural Skeleton 与 deterministic client state；迟到响应不得覆盖当前 viewport/filter/detail 或 active V1 board。 |
| WHY_NOW | UI 之前必须确定异步 ownership、缓存和 error semantics。 |
| WHY_NET_NEW_OR_EXTENSION | V1 有 active-board guard，但没有 public map concurrency/cache。 |
| EXISTING_V1_CAPABILITIES_REUSED | platform adapters、navigation state、request generation/stale callback lesson。 |
| INPUTS / PRECONDITIONS | 08—09、13；必须只读检查真实 V1 code/assets，并在正式实现前或早期完成 V1 Frontend Design Inventory。 |
| AFFECTED_DOMAIN | client reducer/state machine、cache、refresh、recovery、errors。 |
| ARCHITECTURE_DECISION | 正式宿主为真实 V1 小程序既有 **地图** Tab 与 `pages/home/index` / `map-preview`，保持 `data-tab="map" → onSelectTab → map-preview` 与分享落地关系不变；不复制 V1 到长期 spike，不新增第二地图 page/route，不做 release redirect。只消费 V2-C public service contract；queryKey + request generation + viewport/filter/cursor/detail identity；late ignore。当前分支不部署，实际 exposure/release 控制属于 TASK-V2-21/22。客户端不解析 opaque cursor、不计算 authoritative eligibility，也不把本机 clock 当 Freshness truth。 |
| DATA_CONTRACT | schemaVersion、servedVersion、queryKey、viewport/filter、generation、server asOf、cache timestamp/TTL、opaque cursor/expiry、selected publicLeadId、initial loading/loaded/pagination/empty/error/stale、page-error-retains-data、stable service errors。 |
| SECURITY / PRIVACY | 只缓存 public-safe data；不持久化 private location/owner/evidence；按 policy 过期清理。 |
| FILES / MODULES EXPECTED | real V1 miniprogram 内 future public-map state/API adapters/page shell/tests；`docs/design/v2-map/` inventory、inheritance matrix、structural skeleton/state matrix 交付。 |
| DEPENDENCIES | 13。 |
| BLOCKS | 15—22。 |
| PRODUCT_DECISION_GATES | `PDG-V2-01/05/07`。 |
| EVIDENCE_GATES | `EDG-V2-02/03`。 |
| IMPLEMENTATION_STEPS | 从真实 V1 code/assets 提取至少 30 项 V1 Frontend Design Inventory；建立 V1→V2 `REUSE/ADAPT/NEW_REQUIRED` Design Inheritance Matrix；读取并锁定既有地图按钮/route/page/placeholder 行为，在真实 V1 `map-preview` 分支内部建立 page shell、V1 layout/assets/styles integration、state rendering shell、synthetic/local public service binding 与 low-fi controls；实现 reducer、ignore-late、cache/refresh/paging、initial-vs-page error、stale disclosure、tab/share/recovery integration。只允许 deterministic mocks/synthetic allowlisted fixtures 作为本地证据，不把它们记为 production API 证据；不做新 route、release redirect、final marker/card/visual system/map styling。 |
| TEST_STRATEGY | unit/race/property/integration：rapid pan/filter/tab、A/B inversion、offline/timeout/partial/stale。 |
| TRUE_DEVICE_REQUIRED | `NO`；本任务只验证 state contract。 |
| CLOUD_DEPLOY_REQUIRED | `NO` |
| MIGRATION_REQUIRED | `LOCAL_CLIENT_CACHE_SCHEMA_ONLY`；不构成 production migration，生产 migration 仍由 TASK-V2-19 rehearsal、TASK-V2-22 actual apply 管理。 |
| ACCEPTANCE_CRITERIA | 全 race matrix 通过；A 晚于 B 返回时 A 永不覆盖 B；V1 Frontend Design Inventory、V1→V2 Design Inheritance Matrix、V2 Map Page Structural Skeleton、V2 State Matrix v1 齐全；真实 V1 integration shell 自动验证通过并进入 Founder Review。TASK-V2-15 保持锁定直到 `COMPLETE / HUMAN_APPROVED`。 |
| ROLLBACK / FAILURE_BOUNDARY | 仅撤回 `map-preview` 分支内部 TASK-V2-14 shell，恢复原 V1 map placeholder；不改变既有导航关系或 active draw state。 |
| KNOWLEDGE_THAT_MAY_INVALIDATE_THIS_TASK | API paging/freshness/cache、platform lifecycle、navigation/query identity 变化。 |
| DOWNSTREAM_TASKS_TO_UPDATE_IF_KNOWLEDGE_CHANGES | 15—22 与 architecture/client contracts。 |

#### TASK-V2-15｜Map Authorization 与 Owner-Control UX

| 字段 | 计划 |
| --- | --- |
| TASK_ID | `TASK-V2-15` |
| TITLE | versioned map authorization、scope explanation、status、edit、withdraw/delete 与 reauthorization UX |
| STATUS | `COMPLETE / HUMAN_APPROVED` |
| CAPABILITY_DELTA_CATEGORY | `NET_NEW_V2 + NEEDS_V2_EXTENSION` |
| OLD_V2_TASK_MAPPING | Historical `V2-07/V2-09/V2-11`；draft `TASK-V2-13` |
| GOAL | 让 owner 一次明确接受当前地图贡献授权版本、理解历史 + 未来适用范围并控制每条 public state；private APPROVED 不被误写为 public。 |
| WHY_NOW | supply 需要可理解、可撤销的用户流程。 |
| WHY_NET_NEW_OR_EXTENSION | V1 My Uploads 只有 private publication controls。 |
| EXISTING_V1_CAPABILITIES_REUSED | My Uploads、owner actions、silent Account、optional Profile、durable delete UI pattern。 |
| INPUTS / PRECONDITIONS | 05—07、10、12—14。 |
| AFFECTED_DOMAIN | authorization UI、scope/version、owner status、venue/precision explanation、error/retry、historical/future records。 |
| ARCHITECTURE_DECISION | 在真实 V1 app 既有页面栈实现完整交互骨架，授权状态/owner controls 放在既有 **我的上传** surface，并与同页 `map-preview` TASK 14 state engine 联动；不得创建独立 V2 auth route，进入或浏览地图不构成贡献授权 gate。尽量复用 V1 modal/card/button；首次需要时显式接受 versioned scope，覆盖合格历史+未来记录、PublicLocation、eligible venueNote、safe nickname/avatar attribution 与删除 hide-first；同版本不重复弹窗；material public-scope expansion 才 reauthorize；Profile completeness 不 gate；withdraw/delete 为 immediate-hide intent。允许低保真，不做最终视觉 polish。 |
| DATA_CONTRACT | authorization scope/version/acceptance、public field/location/Profile attribution policy summary、record applicability、pending/rejected/public/hidden/withdrawn/deleted/re-authorization。 |
| SECURITY / PRIVACY | 无预选 consent；无无关 Profile/phone/permission；错误信息不泄漏审核细节。 |
| FILES / MODULES EXPECTED | future home/My Uploads views、WXML/WXSS、adapters/state/tests。 |
| DEPENDENCIES | 10、12—14；TASK-V2-14 必须已 `COMPLETE / HUMAN_APPROVED`。 |
| BLOCKS | 16—22；此门已由 TASK-V2-15 Founder 人工验收解除，但 TASK-V2-16 仍按 16-A/B/C 内部门禁推进。 |
| PRODUCT_DECISION_GATES | `PDG-V2-01—05/07`。 |
| EVIDENCE_GATES | `EDG-V2-01/04—06`。 |
| IMPLEMENTATION_STEPS | authorization placement/scope preview；explicit accept once；history/future applicability；public nickname/avatar disclosure；status/edit；My Uploads cloud-source withdraw/delete；hide-first feedback；适用时 double-confirm；loading/success/failure；material-scope reauthorization；retry/recovery；no Profile gate。 |
| TEST_STRATEGY | component/behavior/a11y/contract/integration、accept-once/no-repeat、negative authorization、history/future records、record delete hide-first、material-scope change、stale response。 |
| TRUE_DEVICE_REQUIRED | `DOWNSTREAM_TASK-V2-20`；本任务先完成 deterministic client/contract evidence，不把模拟结果当真机证据。 |
| CLOUD_DEPLOY_REQUIRED | `NO`；只使用 V2-C local reference service/deterministic public fixtures，生产 adapter/deploy 仍归 TASK-V2-19/22。 |
| MIGRATION_REQUIRED | `NO` |
| ACCEPTANCE_CRITERIA | `PASS / HUMAN_APPROVED`：用户无需 Profile 即可解释公开字段、历史+未来授权范围、状态和撤回／删除后果并完成控制；低保真交互骨架在真实 V1 app 中通过自动验证并完成 Founder Review。 |
| ROLLBACK / FAILURE_BOUNDARY | 禁用 public entry；V1 private upload/My Uploads 仍可用。 |
| KNOWLEDGE_THAT_MAY_INVALIDATE_THIS_TASK | consent copy、lifecycle、venue、owner controls、review/a11y findings 变化。 |
| DOWNSTREAM_TASKS_TO_UPDATE_IF_KNOWLEDGE_CHANGES | 16—22 与 design/privacy/release。 |

#### TASK-V2-16｜Map、List、Filter 与 Detail UX

| 字段 | 计划 |
| --- | --- |
| TASK_ID | `TASK-V2-16` |
| STATUS | `COMPLETE / HUMAN_APPROVED` |
| TITLE | 核心好版地图发现体验与非实时信息表达 |
| CAPABILITY_DELTA_CATEGORY | `NET_NEW_V2` |
| OLD_V2_TASK_MAPPING | Historical `V2-12/V2-14/V2-15/V2-16`；draft `TASK-V2-14` split |
| GOAL | 实现 map/list/filter/detail、source/time/freshness/precision、empty/error/stale 和非实时提示。 |
| WHY_NOW | UI 只能在 domain、API、client state 稳定后开始。 |
| WHY_NET_NEW_OR_EXTENSION | V1 map 只是 placeholder。 |
| EXISTING_V1_CAPABILITIES_REUSED | approved visual shell/navigation、null/zero、general tab sharing pattern。 |
| INPUTS / PRECONDITIONS | 01、07—09、13—15；TASK-V2-15 已人工批准。 |
| AFFECTED_DOMAIN | discovery UX、record execution visual hierarchy、Opportunity/Freshness encoding、same-location overlap、filters、detail/callout、copy、a11y。 |
| ARCHITECTURE_DECISION | TASK-V2-16 仍是一个 canonical task，内部强制门为 16-A `INTERACTION-COMPLETE LOW-FI PROTOTYPE`、16-B `DESIGN HANDOFF PACKAGE`、16-C `APPROVED VISUAL INTEGRATION`。设计上下文固定为真实 V1 既有导航与同一 `pages/home/index` / `map-preview` host；Gemini/外部视觉流程不得重新设计地图入口、主导航语义或页面 host 关系，只设计 host 内部的 V2 discovery UI。只消费 public service contract，绝不直读 private DB；V2-C local reference service/deterministic allowlisted fixtures 只作 client evidence，不作 production API evidence。Profile 不 gate browse。抽赏记录高执行度、上传记录低饱和／较低权重，但 recordType 不表达 trust 或改变 Opportunity/Freshness；客户端不把 Opportunity level 当 public gate。Codex 不拥有最终视觉设计权。 |
| DATA_CONTRACT | PublicMapLead marker/detail allowlist、DRAW_RECORD/UPLOAD_RECORD、Opportunity/Freshness 独立视觉、public-safe contributor、filter tri-state、same-location multi-item/overlap/density/callout、freshness/unavailable/non-realtime/non-recommendation copy；无 public board image。 |
| SECURITY / PRIVACY | 不显示 private IDs/evidence；contributor 只按 PDG-02；unknown field 不渲染。 |
| FILES / MODULES EXPECTED | real V1 miniprogram 内 future map views/components/styles/state tests；`docs/design/v2-map/v1-frontend-design-inventory.md`、`v1-to-v2-design-inheritance.md`、`v2-ui-structure-blueprint.md`、`v2-state-matrix.md`、`v2-interaction-map.md`、`v2-data-binding-map.md`、`v2-gemini-design-handoff.md`（实际命名可按 repo 规范）。 |
| DEPENDENCIES | 13—15；01 comprehension evidence；TASK-V2-15 必须已 `COMPLETE / HUMAN_APPROVED`。 |
| BLOCKS | 17—22。 |
| PRODUCT_DECISION_GATES | `PDG-V2-01/02/05/06/07`。 |
| EVIDENCE_GATES | `EDG-V2-04/05`。 |
| IMPLEMENTATION_STEPS | `16-A`：在真实 V1 environment 完成 map/list/filter/detail 信息架构、marker selection、bottom sheet、recordType/Opportunity/Freshness、contributor、overlap/multi-item、全部 required states 与 V1 visual-language reuse，输出 V2 UI Structure Blueprint；视觉低保真、交互高保真。`16-B`：输出按页面／区域／element 记录 component type、position/hierarchy、interaction、state、backend binding、V1 equivalent、reuse/adapt/new、visual redesign permission、immutable semantics、WeChat constraints、public/private restrictions 及可用截图的 Design Handoff Package；完成后必须停下等待 Founder/Design Review。`16-C`：只有 Founder 明确提供或批准 Gemini／其他视觉流程方案后，才在不改变交互、信息架构、data binding 与 frozen semantics 的前提下套用视觉并做 regression。不得因缺少方案自行完成 16-C。 |
| TEST_STRATEGY | unit/component/e2e/a11y/contract；误解测试用文案与任务回归；16-A 另设不可由 semantic tests 替代的 `STRUCTURAL_VISUAL_REVIEW`，必须以微信开发者工具/真机 computed spatial evidence 与 Founder review 验证。 |
| TRUE_DEVICE_REQUIRED | `DOWNSTREAM_TASK-V2-20`；本任务完成 component/platform-contract evidence，真机验收由 TASK-V2-20 固定。 |
| CLOUD_DEPLOY_REQUIRED | `NO` additional |
| MIGRATION_REQUIRED | `NO` |
| ACCEPTANCE_CRITERIA | 16-A 必须同时满足 `LOGIC_INTERACTION_GATE=PASS` 与 Founder 批准的 `STRUCTURAL_VISUAL_GATE=PASS`：所有页面／交互／状态结构完整、用户可完成发现任务、不把线索理解为实时库存，且 `MAP IS THE PAGE`、safe/nav 各只计算一次、地图视觉延伸到 Bottom Nav 后方、交互控件使用统一 bottom inset、map controls/marker/sheet 满足 spatial invariants。历史结构视觉 gate 失败已保留；RC1—RC5 与 Map-first refinement 已实现并形成自动测试及真实微信开发者工具截图证据。当前只可标 `16A_MAP_FIRST_REFINEMENT_COMPLETE / AWAITING_FOUNDER_STRUCTURAL_VISUAL_REVIEW`，Founder visual gate 未通过前不得进入 16-B。IP 搜索与正向标签若缺 public contract，只能明确标为 synthetic-only/gap，不得 private join 或静默扩约。16-B Design Handoff Package 覆盖 addendum 的完整 element checklist；Founder 批准视觉提案后才允许执行并验收 16-C。16-A/B/C 均属于 TASK-V2-16 内部门禁，不增加 canonical task。 |
| ROLLBACK / FAILURE_BOUNDARY | feature flag 回到 map placeholder/list-safe fallback。 |
| KNOWLEDGE_THAT_MAY_INVALIDATE_THIS_TASK | fields、comprehension、API、filters、freshness、contributor 或 a11y 变化。 |
| DOWNSTREAM_TASKS_TO_UPDATE_IF_KNOWLEDGE_CHANGES | 17—22 与 product/design。 |

#### TASK-V2-17｜WeChat Map、Location 与 Safe Deep Link

| 字段 | 计划 |
| --- | --- |
| TASK_ID | `TASK-V2-17` |
| TITLE | 微信原生 map、前台定位、连续屏幕空间聚合与 public deep link |
| STATUS | `COMPLETE / HUMAN_APPROVED` |
| CURRENT_EXECUTION_OVERRIDE | `PNG_CANVAS_DEFAULT / ZOOM_ADAPTIVE_ENABLED / FOUNDER_APPROVED`。Marker 以公开 Board presentation 生成 PNG，作为原生 map marker `iconPath`；普通、选中、聚合共用 renderer，聚合选择列表使用 PICKER surface。五档 zoom 只在限频／settle 后更新展示，不逐帧导出图片。无法在最大 scale 按真实坐标分离的成员保留原坐标并进入可滚动选择列表；可自然分离的成员继续 camera expansion。固定 PNG 是自适应开关关闭时的安全回退；Founder 批准后旧 CSS customCallout 运行时分支已移除，固定 PNG 回退保留。诊断日志默认关闭。 |
| CAPABILITY_DELTA_CATEGORY | `NET_NEW_V2 + NEEDS_V2_EXTENSION` |
| OLD_V2_TASK_MAPPING | Historical `V2-13/V2-16/V2-16C`；draft `TASK-V2-14` split |
| GOAL | 在既有地图宿主接入原生 map/location，并让聚合、分裂、归并、最大 zoom 重叠和详情跳转保持稳定的空间连续性。 |
| WHY_NOW | platform integration 在核心 UX 和 contract 后实施。 |
| WHY_NET_NEW_OR_EXTENSION | map/location public UX 新增；friend/Timeline/copy 基础复用。 |
| EXISTING_V1_CAPABILITIES_REUSED | 三 Tab sharing、tab allowlist、foreground location permission pattern、silent Account。 |
| INPUTS / PRECONDITIONS | 03、06、09、13—16。 |
| AFFECTED_DOMAIN | native map、permission、location、PNG Marker、zoom adaptive、screen-space clustering、unresolved cluster picker、sharing/deep link、landing state。 |
| ARCHITECTURE_DECISION | 基于 TASK-V2-16 已获 Founder 批准的既有 `map-preview` 宿主，使用微信原生 `<map>` 和真实 GCJ-02 PublicLocation；设备定位只作前台便捷入口，拒绝定位仍可浏览。Board data → marker presentation → PNG Canvas renderer → native Marker `iconPath` 为默认视觉链。zoom observation 与 presentation 分离，五档图片及 screen-space footprint 经限频、滞回与 settle 校正后提交；缓存 key 不含经纬度、连续 scale 或 viewport，过期出图不得覆盖较新结果。聚合仅是展示分组，按真实坐标判断最大 scale 可否自然分离：可分离则 camera expansion，不可分离则页面层可滚动选择列表；不移动真实坐标、不制造假地点或 spiderfy 展示点。Marker tap 打开既有详情，手势开始关闭选择，程序化 camera 不误关详情。Bottom Nav 与普通页面弹层由既有层级承载，map 内 cover-view 按钮在详情／picker／modal／遮罩期间卸载。分享和 deep link 仅用 allowlisted opaque publicLeadId／公开参数；腾讯位置服务仍为可选增强，不进入本任务。 |
| DATA_CONTRACT | public GCJ-02 coordinate/precision semantics、location permission/manual city state、public route allowlist、hidden/deleted/unavailable landing errors；无 PublicLocation 时不生成 marker。 |
| SECURITY / PRIVACY | 无 private coordinate/record/account ID；拒绝定位仍可 browse；按用户动作索权。 |
| FILES / MODULES EXPECTED | future platform map/location/share adapters、page handlers、tests/assets。 |
| DEPENDENCIES | 13—16；TASK-V2-16 必须已 `COMPLETE / HUMAN_APPROVED`。 |
| BLOCKS | 18—22。 |
| PRODUCT_DECISION_GATES | `PDG-V2-01/04/05/07`。 |
| EVIDENCE_GATES | `EDG-V2-02/04/05`。 |
| IMPLEMENTATION_STEPS | 保留原生 map、GCJ-02 定位与手动浏览恢复；通过公开 presentation、cluster topology、五档 PNG Canvas renderer、render key/LRU、latest-wins 出图与 native `iconPath` binding 形成默认 Marker 链；维持单在途 setData 和稳定 projection。处理普通／选中／聚合、zoom+pan、split/merge、最大倍率真实坐标分类与不可分离选择列表、连续选择详情、空白点击及 map gesture 仲裁；地图按钮、Bottom Nav、详情和 modal 层级按既有宿主工作。清理无模板引用的旧 synthetic Marker／烟花 WXSS；Founder 批准后移除旧 CSS customCallout，固定 PNG 保留为 zoom 自适应回退。关闭临时 zoom trace；完成自动门并生成 Founder 真机清单。 |
| TEST_STRATEGY | PNG render key／DPR／iconPath／anchor／点击；五档阈值、滞回、慢速／快速／连续 pinch、zoom+pan、settle latest-wins、split/merge；两点同坐标、两点近距离可分与不可分、20点同坐标、20点混合距离、IP/主题／多标签选择；真实坐标／identity invariant、列表20条滚动和详情；Marker tap 与拖动消歧、空白关闭、A→B 快切；cover-view、Bottom Nav、按钮、详情、modal／picker 层级；TypeScript、Lint、workflow、地图／Marker 测试、构建和 Founder iOS／Android 真机矩阵。 |
| TRUE_DEVICE_REQUIRED | `TASK-V2-17 FOUNDER GATE = PASS`：Founder 于 2026-09-24 明确批准人工验收；逐项设备日志未随批准提供。TASK-V2-20 后续仍有发布前平台验收。 |
| CLOUD_DEPLOY_REQUIRED | `NO` additional |
| MIGRATION_REQUIRED | `NO` |
| ACCEPTANCE_CRITERIA | 允许／拒绝定位均可浏览；默认 PNG 路径显示普通、选中和聚合 Marker，列表使用同一 renderer 的 PICKER 输出；五档 zoom 在 settle 后正确更新，pinch 时不逐帧导出，split/merge 不丢点或重影；每个 eligible lead 恰好表示一次，真实 GCJ-02 坐标不被展示偏移；可自然分离的聚合执行 camera expansion，不可分离的聚合保留原位并开启可滚动选择列表，20条可逐项打开详情；拖图／Marker 上滑动不误开详情，空白关闭选择，A→B 可快速切换；map 按钮、Bottom Nav、详情和 modal／picker 的真机层级正确；搜索、筛选、分享、V1 和公开合同不回归。自动验证及 Founder 人工门已通过，状态为 `COMPLETE / HUMAN_APPROVED`；TASK-V2-18 可解锁，但本次不实施。 |
| ROLLBACK / FAILURE_BOUNDARY | provider/permission failure 降级 list/manual city，不影响 V1 tabs。 |
| KNOWLEDGE_THAT_MAY_INVALIDATE_THIS_TASK | SDK/base-library、permission/review、routing、anonymous behavior、share policy 变化。 |
| DOWNSTREAM_TASKS_TO_UPDATE_IF_KNOWLEDGE_CHANGES | 18—22 与 tech/privacy/release。 |

#### TASK-V2-18｜Scale、Clustering、Weak Network 与 Package

| 字段 | 计划 |
| --- | --- |
| TASK_ID | `TASK-V2-18` |
| TITLE | viewport budget、marker density、clustering、cache、低端机／弱网和 2 MiB package hardening |
| STATUS | `COMPLETE / HUMAN_APPROVED`；设备数值与真实账单仍由 V2-E 验证 |
| CAPABILITY_DELTA_CATEGORY | `NET_NEW_V2 + NEEDS_V2_EXTENSION` |
| OLD_V2_TASK_MAPPING | Historical `V2-14/V2-16/V2-17`；draft `TASK-V2-07/TASK-V2-14/TASK-V2-15` split |
| GOAL | 在首发规模和低端设备下证明 query/render/network/package budgets。 |
| WHY_NOW | “能显示 marker”不是可发布完成标准。 |
| WHY_NET_NEW_OR_EXTENSION | V1 package gate 可复用，但 map scale/density/cache 新增。 |
| EXISTING_V1_CAPABILITIES_REUSED | 2 MiB gate、asset audit、weak-network/true-device discipline。 |
| INPUTS / PRECONDITIONS | 09、13—17；TASK-V2-17=`COMPLETE / HUMAN_APPROVED`；approved scale/cost budgets。同一正式 `map-preview` 的五档 PNG Marker、192项 LRU／latest-wins 出图、真实坐标 cluster 与不可分离选择列表为已批准输入。 |
| AFFECTED_DOMAIN | performance、package、network、cache、clustering。 |
| ARCHITECTURE_DECISION | 所有性能、聚合、弱网、包体、signed avatar 与成本验证均针对同一个正式 V1 `map-preview` host，不建立第二套 benchmark product page。server bounded result + evidence-gated cluster threshold；no unbounded client table pull；density/cluster 不能合并 BoardInstance/PublicMapLead identity；MVP 无 shared server response cache。TASK-V2-18 不负责大规模 UI redesign；优化不得移除 required states/disclosure、改变批准视觉语义或制造 trust-score visual implication。明显改变批准 UI 的性能要求必须停下进入 Founder Review。 |
| DATA_CONTRACT | page default 50、snapshot cap 500、TTL default 120s、max markers/results、density metadata、latency/QPS/bytes、public-only cache、signed-avatar expiry、rate/read-stop、retry/backoff、asset/package budget 与 ≤¥20/month target。 |
| SECURITY / PRIVACY | density/precision 不形成额外 location inference；cache 仍 public-only。 |
| FILES / MODULES EXPECTED | performance tests/fixtures、client/API tuning、asset manifest、delivery evidence。 |
| DEPENDENCIES | 09、13—17；TASK-V2-17 必须已 `COMPLETE / HUMAN_APPROVED`。 |
| BLOCKS | 19—22。 |
| PRODUCT_DECISION_GATES | `PDG-V2-04/05/07`。 |
| EVIDENCE_GATES | `EDG-V2-02/03`。 |
| IMPLEMENTATION_STEPS | 代表数据规模；performance-oriented interaction adjustment；pan/zoom/cluster/overlap；pagination/public cache；loading strategy/timing；weak-network recovery；signed-avatar expiry/retry；rate/global-stop UX；map/list/marker render 与低端机；package/assets；cost read-back。 |
| TEST_STRATEGY | load/property/network/device/package regression；large result set 与 rapid pan。对五档 PNG 首次导出／缓存命中、scale settle、split/merge、20点不可分离列表、真实坐标与 `publicLeadId` 表示不变量、临时 PNG 资源及固定 PNG 回退作规模证据；不重新设计已批准视觉或更改聚合交互规则。 |
| TRUE_DEVICE_REQUIRED | `DOWNSTREAM_TASK-V2-20`；本任务完成 synthetic/load/network/package evidence，低端真机矩阵由 TASK-V2-20。 |
| CLOUD_DEPLOY_REQUIRED | `NO`；本任务只做 client/local reference service 的 scale、network、package 与 cost 证据。CloudBase candidate integration/tuning 归 TASK-V2-19，pilot/production-like 复验归 TASK-V2-21。 |
| MIGRATION_REQUIRED | `NO`；不超出已批准 indexes。 |
| ACCEPTANCE_CRITERIA | Founder 批准500容量和分层性能预算；本地 latency/bytes/cluster、分页、弱网、包体与条件成本估算在预算内，2 MiB gate 通过，真机压力体验获人工接受；BoardInstance identity、required states/disclosures、approved visual semantics 与无 trust-score implication 保持。Worst 真机逐档 JSON、FPS/帧间隔、Native/GPU 内存、PNG 磁盘和真实生产账单无量化通过结论，TASK-V2-20／21 必须重新验证并作为 pilot/release 停止门。`COMPLETE / HUMAN_APPROVED`。 |
| ROLLBACK / FAILURE_BOUNDARY | 降低 result/precision、关闭 assets/features 或回退 list-only，不扩大 budget。 |
| KNOWLEDGE_THAT_MAY_INVALIDATE_THIS_TASK | scale、provider limits、asset choice、cluster UX、cost/latency 变化。 |
| DOWNSTREAM_TASKS_TO_UPDATE_IF_KNOWLEDGE_CHANGES | 19—22 与 API/client/release。 |

### V2-E｜Layered Gates、True Device、Production Convergence、Hot-start 与 Release

> 区块状态：IN_PROGRESS（TASK-V2-19／20 已 `COMPLETE / HUMAN_APPROVED / FROZEN`；TASK-V2-21 为 `COMPLETE / HUMAN_APPROVED / PRE_PILOT_CLOSURE_PASS / TESTS_CLOSED`（完成范围为已授权Pre-Pilot工作集；Pilot/RC未运行）；TASK-V2-22=`LOCKED / NOT_STARTED`）
>
> 解锁依据：`V2-D` 已 `COMPLETE / HUMAN_APPROVED`，2026-09-25 区块认知对齐通过；TASK19 于 2026-09-29、TASK20 于 2026-09-30 经 Founder 最终确认。当前仅 TASK21 pre-pilot 工作集可执行；19→20→21→22 输入依赖、规则／视觉／protocol／RC 人工门与每个外部动作的独立授权继续生效。TASK22 不执行。2026-09-30 对齐只增加当前 TASK21 的指定前置门，不重构远期任务。
>
> 2026-09-25 Founder 决定 V2-19 candidate isolation boundary 采用现有 `cloud1-d7gxqfwv783a1f131` 内**仅新增的 V2 shadow resources**，不创建第二环境。下文 `candidate only` 均指获批的 shadow isolation boundary，不授权修改、删除或以 rehearsal data 使用 V1 既有 collection/function/index/config/secret/ACL/Storage/trigger/业务文档；所有入口默认关闭，只允许 synthetic rehearsal。此为隔离策略批准，具体 collection/index/function/config/secret 和每次外部 mutation 仍须 Founder 单独批准；19/20历史隔离/技术门保留；21 Closed Pilot/旧RC前置门已由2026-10-02 Founder decision豁免，22 production convergence/hot-start/最终发布与各外部授权门生效。确切待批资源清单见 `docs/delivery/v2-e-task-19-shadow-resource-diff.md`。
>
> `INHERITS_D04-A1_BOARD_INSTANCE_RESOLUTION`：TASK-V2-19—22 必须覆盖同板连续观察、换箱、同店不同板、同店两张同款板、长期 AMBIGUOUS、后续消歧、三类 human answer/误判、Human Assistance Budget、late result、no-resurrection 与 `null != 0`；生产阶段复验失败即阻塞production release；Closed Pilot已明确NOT_RUN/waived。

#### TASK-V2-19｜Layered Integration、Security 与 Migration Gate

| 字段 | 计划 |
| --- | --- |
| TASK_ID | `TASK-V2-19` |
| TITLE | unit → contract → integration → cloud → migration → negative/security → release regression |
| STATUS | `COMPLETE / HUMAN_APPROVED / FROZEN`；2026-09-29 Founder 最终验收；证据边界见 `docs/delivery/v2-e-task-19-minimal-real-wechat-rehearsal-closeout.md`；后续外部动作仍受独立授权约束。 |
| CAPABILITY_DELTA_CATEGORY | `NEEDS_V2_EXTENSION` |
| OLD_V2_TASK_MAPPING | Historical `V2-16/V2-17/V2-19`；draft `TASK-V2-15` split |
| GOAL | 证明 domain、consent、projection、moderation、API、client 和 rollback 的跨层一致性。 |
| WHY_NOW | 真机和 pilot 前必须先清除可自动发现的 P0/P1。 |
| WHY_NET_NEW_OR_EXTENSION | V1 quality 可复用，但 public geo/consent/moderation/migration coverage 新增。 |
| EXISTING_V1_CAPABILITIES_REUSED | pnpm quality、contracts、CloudBase validate、release preflight、V1 regression。 |
| INPUTS / PRECONDITIONS | 10—18 complete；candidate resource/migration/rollback plan approved。 |
| AFFECTED_DOMAIN | 全栈 quality、security、resource、migration、rollback。 |
| ARCHITECTURE_DECISION | 任一层失败都阻塞；自动测试不替代 true-device/production smoke。 |
| DATA_CONTRACT | 固定 lifecycle/query/security/migration/failure matrix 与 evidence IDs。 |
| SECURITY / PRIVACY | cross-account、scraping、precision、consent、hidden/deleted/cache/reviewer/log leakage。 |
| FILES / MODULES EXPECTED | tests/fixtures/scripts/delivery/runbooks；只限获批实现范围。 |
| DEPENDENCIES | 10—18。 |
| BLOCKS | 20—22。 |
| PRODUCT_DECISION_GATES | all closed；scope 不得漂移。 |
| EVIDENCE_GATES | revalidates `EDG-V2-02/03/05/06`。 |
| IMPLEMENTATION_STEPS | 运行并补齐各层矩阵；Human Assistance coverage correction 同时补齐上传成功态和「我的 → 我上传的版面」前端入口、本人状态／回答／跳过／过期行为与本地测试（候选测试身份及 synthetic data only）；migration dry-run；failure injection；rollback drill；V1 release regression。HA cooldown／budget 数值仅为 `CANDIDATE_TEST_ONLY / PILOT_CALIBRATION_REQUIRED`，不冻结产品参数。 |
| TEST_STRATEGY | unit、contract、integration、cloud/backend、migration、negative/security、load/package、release regression。 |
| TRUE_DEVICE_REQUIRED | `NO`；由 20 独立执行。 |
| CLOUD_DEPLOY_REQUIRED | `YES`；仅 Founder 已选的 candidate isolation boundary（同一 CloudBase 环境内新增的 V2 shadow resources），须在具体资源 diff 单独获批后执行；V1 frozen production boundary 不可变更。 |
| MIGRATION_REQUIRED | `YES`；仅批准的 dry-run/rehearsal。 |
| ACCEPTANCE_CRITERIA | 所有自动门绿、private leakage=0、rollback 可复现、无 P0/P1。 |
| ROLLBACK / FAILURE_BOUNDARY | 任一失败即停止；disable public read/write 并按 runbook 回滚 resource/data。 |
| KNOWLEDGE_THAT_MAY_INVALIDATE_THIS_TASK | 任一测试、migration、security、deploy read-back 或 rollback 发现改变 contract。 |
| DOWNSTREAM_TASKS_TO_UPDATE_IF_KNOWLEDGE_CHANGES | 受影响的 05—22 与相关 docs，修复后重跑。 |

#### TASK-V2-20｜True-Device Validation Matrix

| 字段 | 计划 |
| --- | --- |
| TASK_ID | `TASK-V2-20` |
| TITLE | 微信地图、定位、权限、consent、分享、弱网与低端机真机矩阵 |
| STATUS | `COMPLETE / HUMAN_APPROVED / FROZEN`；2026-09-30 Founder 本次总命令完成 final ack，独立关闭记录 `docs/delivery/v2-e-task-20-founder-final-closeout.md`。M1 隐藏消费／no-resurrection、关闭定位手动浏览／恢复定位、synthetic 核验失败重试与真实单贡献删除 PASS 保留；完整 V1_DIFF=0 / VERIFIED、SAFE_STOP_VERIFIED=true（最终 epoch25）、未修复 P0/P1=0、PRIVATE_LEAKAGE=0 均限历史最终执行与审查范围。Device B／第二平台／低端、第二账号 B 新复测、真实慢网、500设备数值仍 NOT_RUN / FOUNDER_ACCEPTED_EVIDENCE_GAP；F2真实同意重投影／多人删除仍 accepted limited gaps，不补 PASS。T20-P2-01 转入 TASK21，OPEN / ACCEPTED_FOR_TASK21_OPTIMIZATION。历史 evidence 不改写。 |
| CAPABILITY_DELTA_CATEGORY | `NEEDS_V2_EXTENSION` |
| OLD_V2_TASK_MAPPING | Historical `V2-13/V2-16/V2-16C/V2-19`；draft `TASK-V2-15` split |
| GOAL | 在批准设备矩阵上验证平台 API、权限、真实网络、生命周期和用户理解。 |
| WHY_NOW | V1 已证明 simulator/local tests 不能替代真机。 |
| WHY_NET_NEW_OR_EXTENSION | true-device discipline 复用；map/geo/deep-link/consent 场景新增。 |
| EXISTING_V1_CAPABILITIES_REUSED | 真机 gate 模板、sharing/camera/location 经验、package preflight。 |
| INPUTS / PRECONDITIONS | 15—19 通过；candidate deployment 可控；用户安排设备/账号。 |
| AFFECTED_DOMAIN | WeChat platform、permission、network、UX、privacy、performance。 |
| ARCHITECTURE_DECISION | 真机 evidence 独立记录；不能用 DevTools PASS 替代。 |
| DATA_CONTRACT | device/base-library/network/account/permission/test case/result/evidence/defect severity。 |
| SECURITY / PRIVACY | silent Account/no-Profile-gate、拒绝权限、precision、share、一次性 consent 持久化、My Upload 删除、account change 全覆盖；不恢复已废止的 withdraw 开关。 |
| FILES / MODULES EXPECTED | true-device checklist、evidence、defect log、progress/review docs。 |
| DEPENDENCIES | 15—19。 |
| BLOCKS | 21—22。 |
| PRODUCT_DECISION_GATES | `PDG-V2-01—05/07`。 |
| EVIDENCE_GATES | revalidates `EDG-V2-02/04—06`。 |
| IMPLEMENTATION_STEPS | 执行允许／拒绝定位、manual browse、pan/filter/detail、一次性 consent 持久化与 My Upload 删除、当前可达 share/landing、offline/slow/late；只验证 TASK19 已批准 candidate/synthetic migration 与 rollback 消费，不做 V1 private backfill。2026-09-30 最终矩阵：必须补 M1 hidden／epoch 后刷新、拖缩和详情失效，以及真实关闭／恢复定位；F1 失败重试和 F2 未同意自动投影只有现成安全路径才补，缺安全注入／身份机制时按 Founder accepted limited gap 记录；F3 优先已有合成单贡献删除和 no-resurrection，多贡献准备复杂则接受有限缺口；F4 500 数值只有现成不进入正式包的 diagnostic 可复用才测，压力面板／force-individual 已删除则不恢复，记录 accepted gap。Device B／第二账号 B／真实慢网均 NOT_RUN，不冒充 PASS。 |
| TEST_STRATEGY | approved true-device matrix + production-like black-box checks；记录视频/截图/log，并核对 V2-18 尚缺的帧间隔、Native/GPU memory、临时 PNG 磁盘、持续冻结／白屏／崩溃及低端 iOS/Android。 |
| TRUE_DEVICE_REQUIRED | `YES` |
| CLOUD_DEPLOY_REQUIRED | `YES`；candidate only。 |
| MIGRATION_REQUIRED | `YES`；验证已批准 migration。 |
| ACCEPTANCE_CRITERIA | M1 真机隐藏消费、定位关闭／恢复、可安全补的 Device A 链、完整 V1零差异、隐私／P0/P1与安全停机门已按最终证据成立；Founder 本次命令最终确认关闭。未测设备／身份／慢网／500数值和真实同意重投影／多人删除保留 accepted evidence gaps，非 PASS。TASK21 pre-pilot 继续处理 Opportunity／三处状态恢复、Map State UI 和 T20-P2-01；它们不回填为 TASK20 已修复事实。 |
| ROLLBACK / FAILURE_BOUNDARY | failed case 阻塞 pilot；关闭 public feature，不改变 V1。 |
| KNOWLEDGE_THAT_MAY_INVALIDATE_THIS_TASK | 平台差异、权限审核、设备性能、弱网、分享、consent comprehension 发现。 |
| DOWNSTREAM_TASKS_TO_UPDATE_IF_KNOWLEDGE_CHANGES | 受影响的 06、09、13—22 与 privacy/release。 |

#### TASK-V2-21｜Pre-Pilot Closure、Closed Pilot Waiver 与 Production Direction Gate

| 字段 | 计划 |
| --- | --- |
| TASK_ID | `TASK-V2-21` |
| TITLE | Pre-Pilot收口、Founder Closed Pilot豁免与生产整合/热启动方向批准 |
| STATUS | `COMPLETE / HUMAN_APPROVED / PRE_PILOT_PASS / CLOSED_PILOT_WAIVED_BY_FOUNDER / EVIDENCE_GAPS_ACCEPTED`；PRE_PILOT_CLOSURE=PASS/HUMAN_APPROVED/FROZEN；CLOSED_PILOT=WAIVED_BY_FOUNDER/NOT_RUN；证据缺口接受；测试关闭。 |
| CAPABILITY_DELTA_CATEGORY | NET_NEW_V2 / DECISION_CLOSURE |
| OLD_V2_TASK_MAPPING | 原Closed Pilot/RC task保留编号；旧协议/原计划由2026-10-02决定supersede，历史delivery不改写。 |
| GOAL | 收口已完成Pre-Pilot，记录显式waiver与accepted evidence gaps，冻结One ICHI Backend、PLAYER/NETWORK统一、50上海→300全国热启动路线，解锁22。 |
| WHY_NOW | Founder已判断既有Pre-Pilot/真机/举报/Opportunity/Map UI与candidate证据足够进入生产整合，不再要求Closed Pilot。 |
| WHY_NET_NEW_OR_EXTENSION | 决策与证据边界收口；不实现新能力。 |
| EXISTING_V1_CAPABILITIES_REUSED | V1私有源/身份与release discipline，仅作后续生产输入。 |
| INPUTS / PRECONDITIONS | TASK19/20当前有效最终验收；2026-10-01 Pre-Pilot final closure；本次Founder命令。 |
| AFFECTED_DOMAIN | 产品门、供给方向、计划依赖、completion、EDG与架构认知。 |
| ARCHITECTURE_DECISION | One ICHI Backend分层；shadow不拷贝为production，公开层只读PublicMapLead。 |
| DATA_CONTRACT | 保留当前versioned Opportunity/public-map-v3与UPLOAD_RECORD权威lineage/独立筛选/举报10阈值/防复活；NETWORK schema与production bridge在22实现冻结。 |
| SECURITY / PRIVACY | 不扩公开字段、不写数据库；rights/consent/location/safety/moderation语义不豁免。 |
| FILES / MODULES EXPECTED | plan-revision、knowledge-alignment、Founder decision与五份memory-bank；历史reports原文保留。 |
| DEPENDENCIES | 19—20已满足；不以旧Closed Pilot/RC为后继前置门。 |
| BLOCKS | 本次决策收口后22 READY。 |
| PRODUCT_DECISION_GATES | Founder显式waiver Closed Pilot并批准production convergence/hot-start；已有PDG语义保留。 |
| EVIDENCE_GATES | Pre-Pilot PASS有限范围保留；Closed Pilot独占项WAIVED_BY_FOUNDER/NOT_RUN/EVIDENCE_GAP_ACCEPTED，生产可验证项迁22，不补all EDG PASS。 |
| IMPLEMENTATION_STEPS | 建pre-state；更新产品/技术/计划/状态；认知对齐；保护TASK01—20与历史报告；运行文档治理门。此任务不含后端实现。 |
| TEST_STRATEGY | workflow、触及文档格式、diff/链接/范围/状态/上游合同与历史文件hash核对；不把历史自动回归写为本轮重跑。 |
| TRUE_DEVICE_REQUIRED | NO_NEW_RUN；复用Pre-Pilot最终有限证据。 |
| CLOUD_DEPLOY_REQUIRED | NO |
| MIGRATION_REQUIRED | NO |
| ACCEPTANCE_CRITERIA | Pre-Pilot PASS、Closed Pilot NOT_RUN/Founder explicit waiver/accepted gaps、production方向与22解锁一致；认知对齐无未解决硬合同冲突；文档验证PASS。 |
| ROLLBACK / FAILURE_BOUNDARY | 文档局部回退；无外部状态变化。真实upstream hard conflict则22 BLOCKED/KNOWLEDGE_ALIGNMENT_CONFLICT，不修改上游技术语义。 |
| KNOWLEDGE_THAT_MAY_INVALIDATE_THIS_TASK | waiver范围/技术证据被误读，或新路线真实违背上游hard contract。 |
| DOWNSTREAM_TASKS_TO_UPDATE_IF_KNOWLEDGE_CHANGES | 仅22与current design/tech/architecture/progress/completion；远期仅记录影响，不批量改写。 |

#### TASK-V2-22｜Production Backend Convergence、Unified Source Projection、Official NETWORK Hot-start Seeding 与 Production Release Closure

| 字段 | 计划 |
| --- | --- |
| TASK_ID | `TASK-V2-22` |
| TITLE | 生产后端整合、PLAYER/NETWORK统一投影、50/300热启动与实际发布收口 |
| STATUS | IN_PROGRESS / PHASE1_COMPLETE / PHASE2_COMPLETE / PRODUCTION_APPLIED / LIVE_BRIDGE_VERIFIED / GLOBAL_CONTINUOUS_ENABLED / PHASE1_2_HUMAN_APPROVED；2026-10-06 Phase1/2与地图修复人工验收通过；PHASE3_COMPLETE / HUMAN_APPROVED / PRODUCTION_APPLIED / LIVE_SMOKE_PASS / PHONE_PASS / SAFE_STOP；PHASE4_COLLECTION_READY / SUPPLY_GAP / FOUNDER_REVIEW_PENDING；Phase5—8 LOCKED。 |
| CAPABILITY_DELTA_CATEGORY | NEEDS_V2_EXTENSION |
| OLD_V2_TASK_MAPPING | 原Actual Publication/tag职责保留为最后Phase，新增生产整合/持续桥接/官方热启动职责，不新增TASK_ID。 |
| GOAL | One ICHI Backend正式提升、PLAYER历史eligible与未来continuous bridge、NETWORK OFFICIAL_CURATED Founder审核入库、50上海rehearsal、300全国热启动、production release/tag闭环。 |
| WHY_NOW | TASK19/20 accepted、21 Pre-Pilot PASS、Closed Pilot明确waiver/gaps accepted及production方向已批准。 |
| WHY_NET_NEW_OR_EXTENSION | V1 private truth/identity与V2已测domain复用，production wiring/NETWORK variant/审核workflow/30d政策及供给验收仍待实现。 |
| EXISTING_V1_CAPABILITIES_REUSED | trusted微信Account/Profile、recognition/P1/exact APPROVED draw facts、删除/墓碑、single-worktree release/deploy/read-back/hash discipline。 |
| INPUTS / PRECONDITIONS | 19/20当前有效验收；21 Pre-Pilot PASS；Founder waiver/accepted gaps/production direction；本轮9函数部署授权已完成；后续各外部动作另取exact diff/artifact/SHA授权。不要要求旧21 Closed Pilot gates PASS或旧RC批准。 |
| AFFECTED_DOMAIN | production backend/source/domain/public、schema、bridge、NETWORK review/ingestion、freshness、security/privacy/ops、release/Git。 |
| ARCHITECTURE_DECISION | Private/Source→Domain/Projection→PublicMapLead分层；hybrid public-safe core/request envelope；禁止request-time private join、shadow synthetic复制、V1/V2全库扁平化与NETWORK直写PublicMapLead。 |
| DATA_CONTRACT | 保留PLAYER DRAW/UPLOAD authority；新增版本化NETWORK OFFICIAL_CURATED/provenance/rights/Founder review/null contributor/网络上传，具体schema按现有风格审计；统一VerifiedBoard/Resolution/Opportunity/Freshness/Eligibility/Projection。 |
| SECURITY / PRIVACY | PLAYER原上传确认及本人当前v3条例覆盖本人此前及以后完成上传；准入前派生SHARE/rights，不恢复旧DO_NOT_SHARE或逐条选择模型；NETWORK独立rights/curator/approval/public eligibility，不伪造PLAYER；rejects local-only；URL/rights/private geo/owner/evidence不得泄漏，note exact safety，不新增public image。 |
| FILES / MODULES EXPECTED | production promotion/resource diff、schema/source/bridge/ingestion/review workflow、policy/contract/tests、migration/rollback/release runbook、50/300 evidence、memory-bank；仅在后续获准实现时创建。 |
| DEPENDENCIES | 19/20/21已满足；Phase内部前置证据与独立外部动作授权。 |
| BLOCKS | V2 completion；不自动解锁V3。 |
| PRODUCT_DECISION_GATES | 本次direction已批准；production contract/参数/公开兼容性按Phase冻结；缺具体外部批准不能apply。 |
| EVIDENCE_GATES | 生产可证明的EDG-01—06项在50/300/最终smoke实际重验；Closed Pilot独占项保持waiver/accepted gap，不改PASS。 |
| IMPLEMENTATION_STEPS | 按下列八Phase依赖顺序推进；Phase不是新task ID。 |
| TEST_STRATEGY | source/exact-version/rights/security负测、domain/current/multiple support/no-resurrection、continuous bridge重放/恢复/rollback、30d deterministic clock、50/300 read-back/count/performance/cost、V1/V2回归及production真机。 |
| TRUE_DEVICE_REQUIRED | YES；50条整体真机/后端验收与300/final production smoke，缺口明确登记。 |
| CLOUD_DEPLOY_REQUIRED | YES；每次外部动作单独批准、apply后read-back。 |
| MIGRATION_REQUIRED | YES；historical eligible bridge与future continuous path分开，禁止bulk-public与synthetic提升，dry-run/retry/rollback须验证并获准。 |
| ACCEPTANCE_CRITERIA | 50上海全链PASS后最终合同冻结；300全国Founder-approved合格版面成功ingestion/PublicMapLead链路、counts/一致性/性能/成本/隐私/真机PASS；production bridge/delete/30d/rollback完整；剩余真实行为缺口Founder接受；实际PUBLISHED确认、online source/Git同步与授权immutable tag精确匹配。 |
| ROLLBACK / FAILURE_BOUNDARY | 任一Phase强制门失败停止晋级；disable reads→stop writes→hide/invalidate→read-back→保留audit/tombstone/V1 truth；destructive cleanup另授权，不建tag。 |
| KNOWLEDGE_THAT_MAY_INVALIDATE_THIS_TASK | production schema/资源/identity/rights/time/expiry/bridge/性能成本/read-back/设备/审核或publication证据冲突。 |
| DOWNSTREAM_TASKS_TO_UPDATE_IF_KNOWLEDGE_CHANGES | 22 Phase、current事实源、completion/release registry；真实upstream hard conflict先BLOCKED再提交exact conflict。 |

##### Phase 1｜Production Backend Convergence

研究并准备production promotion matrix：每个shadow-tested function/collection→production function/collection或testing-only/transient disposition；可复用source code与不可保留的shadow/synthetic contract；config/secret/ACL/index/rate/read-stop/rollback命名与边界；production resource exact diff、artifact/SHA、migration/bridge/rollback runbook。不复制synthetic/rehearsal rows，不让地图直读V1 private，不flatten全库。输出可审核provisional contract与分项授权包；先验证本地/dry-run，任何create/deploy/config/index/ACL/secret/data apply单独Founder授权，apply后read-back。

##### Phase 2｜Unified Source Schema + V1→V2 Continuous Bridge

DRAW_RECORD使用P1→exact current APPROVED drawSubmissions及authoritative finalSnapshot/draw facts、observedAt/location/current/delete/note provenance；UPLOAD_RECORD使用finalized direct P1用户确认/修正snapshot、recognition/correction/observedAt/location/source/current/delete。本人真实当前v3条例覆盖本人此前及以后完成上传，服务端在V1→V2准入派生SHARE/rights；旧逐条字段或原设备补送不是历史完成上传的额外门。private_saved/未完成/删除与位置/安全/有效性不合格排除。SOURCE/RESOLVE/PROJECT在准入内存预计算，正式V2与PublicMapLead同事务提交，V2不设二次审查/授权。未来成功上传、version/current/delete变化由原V1事务持久事件自动传播，hide-first/tombstone/迟到防复活保持；公开read不得request-time private join。

2026-10-04当前Phase2生产门已通过：真实CUFZBP完整转换/Marker与43抽详情、全局producer/processing/read开启、每分钟timer连续9次成功；2026-10-06当前已交付Phase1/2人工验收HUMAN_APPROVED，后续Phase待执行。旧部署/资源动作不重做，后端共用全局服务，无需逐账号配置。

##### Phase 3｜NETWORK_SOURCE / OFFICIAL_CURATED

审计现有enum/schema风格，设计NETWORK variant：语义sourceMode=OFFICIAL_CURATED、平台XHS、UI网络上传、contributor=null、official curator；不把示例sourceType=NETWORK强加为替代现有NETWORK_SOURCE枚举，不创建普通网络上传Account。NETWORK不依赖PLAYER条例/Profile consent，保留item-level rights evidence/version、Founder review/curator/provenance/public eligibility与takedown owner；VerifiedBoard后复用同一domain/policy。冻结sourcePublishedAt/observedAt/observedAtBasis/Freshness anchor deterministic关系，不伪造实拍时间；30天public visibility ceiling达到期限query不返回/detail unavailable，history/provenance保留；新Observation重走门而非改旧时间续命。inject/asOf+policyVersion测试临界点、旧cursor/cache/includeLowFreshness、防复活与独立support生命周期。

2026-10-07用户确认Phase3人工核验通过，P3-A—P3-F均HUMAN_APPROVED；生产七项中的第7项USER_CONFIRMED_PASS，已有自动/部署证据沿用。最后A撤下及smoke/未来时钟能力关闭已完成并回读，Phase3最终状态COMPLETE / HUMAN_APPROVED / PRODUCTION_APPLIED / LIVE_SMOKE_PASS / PHONE_PASS / SAFE_STOP；不重复旧部署或重新验收。详见本节上方当前入口。

| Step | 目标与产物 | 自动验证与状态 |
| --- | --- | --- |
| P3-A | NETWORK_SOURCE联合模型、canonical URL、时间/身份/私有字段边界 | enum/schema/null identity/时间负测通过；COMPLETE / HUMAN_APPROVED |
| P3-B | 独立Founder、rights、grand tiers和备注安全决定绑定exact source/version/digest | 未审批/伪审核/缺rights/旧版本/审批竞态不写正式V2；COMPLETE / HUMAN_APPROVED |
| P3-C | 复用现行Verification→Resolution→Opportunity/Freshness→Eligibility→Projection，同事务准入 | 歧义/硬冲突/回滚/重试/幂等/无private join集成通过；COMPLETE / HUMAN_APPROVED |
| P3-D | 30天deadline、有界内部维护、独立支撑/新ID/下架及保留历史 | before/at/after、旧cursor、低新鲜度、PLAYER支撑、防复活/审计通过；COMPLETE / HUMAN_APPROVED |
| P3-E | v4公开协议与v3 PLAYER兼容、缓存/卡片期限和官方来源显示 | v4校验、官方图标、null contributor、离线/准备详情/已打开卡片/PLAYER后继通过；COMPLETE / HUMAN_APPROVED |
| P3-F | 独立编译验证包、保留旧artifact SHA、区块回归和五事实源收口 | 当前源码1353/1 skip、Playwright26、types/lint/Next、七函数186源码及190旧artifact通过；三构造已下架、smoke/读取时钟关闭、PLAYER保持，workflow/分享防回退/格式/diff通过；COMPLETE / HUMAN_APPROVED |

##### Phase 4｜Founder 审核式网络采集

2026-10-07 用户明确授权自主采集，当前 COLLECTION_COMPLETE / REVIEW_PACKET_READY / SUPPLY_GAP / FOUNDER_REVIEW_PENDING，Phase4 IN_PROGRESS。发现 412 个唯一 URL、17 结构化草稿、10 REVIEW_READY；35 查询覆盖主要矩阵，最后多轮无新合格 URL，按计划饱和停止本轮扩大，70 可审目标差 60。Step 与验证见顶部 P4-A—F；报告和本地审核入口已生成，真实批准 0/50，不能从发现数或模拟 QA 凑数。

从小红书收集上海滚动 7 天内、真实可识别版面、具体抽赏地点与可结构化公开信息。同 URL 本地 dedupe，不同 URL 只给相似提示，不做 BoardInstance merge。PENDING/REJECTED/NEEDS_FIX 只在内部本地 artifact；Founder 逐条确认准确性、rights、地点、大赏集合及原始时间，修正使旧批准失效。Review Card 保留原图/正文/hash、canonical 来源、日期精度、地点依据、各赏可见 remaining/null、建议与不确定项。截图超时使用原始公开图和文本留证，不冒充成功截图。

本地页面可过滤、导入导出与统计批准；真实 50 条全部通过当前窗口/精确源时间/exact 决定版本时，冻结 `founder-approved-50.json` 和 selection SHA 后再请求 Phase4 人工收口。未达成维持 IN_PROGRESS；rights/时间/地点不清者补证，不降门凑数。机器 approved-input schema 仅提案，不赋予 production authority，Phase5—8 LOCKED，不执行 ingestion。

##### Phase 5｜Codex Skill / Official Network Source Ingestion

实现简单可审计collect/review/publish workflow（命令名/目录届时冻结），用于上线后持续补充；collect筛选/去重/截图/提取/review batch而不写production；review取得Founder显式决定；publish仅消费APPROVED+reviewedBy FOUNDER+reviewVersion+reviewedAt及已确认大赏集合，再schema validation→official ingestion→server Verification→projection→read-back。Codex不自动审批，不默认Web CMS/小程序管理员页。候选本地布局、URL去重/本地已见索引、审批失效/重试/idempotency/撤销/audit与rights/takedown治理在本Phase验证。

##### Phase 6｜上海50条 Production Seeding Rehearsal

2026-10-09已获用户明确授权与Phase5并行，复用原50条真实生产入链结果及原批次本人/受托核验，不重新入库。独立后端/公开读与自动验证先推进；Phase5最终产物、适用生产接点、真机整体验收和用户收口仍为最终冻结/进入全国的前置门。原7天窗口按原首次发现和补证依据核对，不要求已入图旧记录以当前日期重新取时间，也不延长30天期限。

覆盖PLAYER DRAW/UPLOAD、原上传确认即分享意愿、当前本人条例覆盖此前及以后完成上传、本机私有保存/未核验排除、delete/update/no-resurrection；NETWORK50全部metadata/provenance/网络上传图标/无伪玩家、Marker/Detail/Opportunity/Freshness/PublicLocation/Filters/note/allowlist无泄漏；shared同板更新/同店不同板/同店两张同款/AMBIGUOUS/null≠0/multiple contributor/latest valid state/hidden-deleted-expired不复活；30天query退出/detail不可用/history保留/新Observation；V1识别抽赏记录/V2生产PublicMapLead/no private join、full regression/security/privacy/rollback。现行AUTO_CLEAR_ESCALATE_UNCERTAIN及本人/受托决定身份保持，逐条Founder默认和旧SHARE/DO_NOT_SHARE选择UI不恢复。新生产来源/配置写入、部署、真实删除/到期注入按确切动作独立授权。PASS后才最终冻结NETWORK schema、ingestion、Freshness/30d、UI、审核委托与production bridge/migration合同，再进入全国。当前细分P6-A—G及验证见顶部。

##### Phase 7｜全国版面热启动与本人修订的现有库存收口

上海50全闭合后取消上海地域限制，最近7天绑定首次发现、图/地点/结构化/实际Founder回复或独立Agent委托/local-only rejects/rights/统一pipeline/30d/Resolution/eligibility/下架审计保持。2026-10-13本人明确撤销300数量门，改为已有证据库存收口：完整项实际入图，必要事实未补齐项本地关闭保留理由，数量按当前公开合格独立实例报告。分别记录候选、核验/历史准入、当前合格、独立板与公开记录，不以文章/照片或旧修订凑数，不续原观察时钟。全国query/detail、数量与分页、实例去重、位置/原50/PLAYER/隐私及关闭态技术门实证；SDK/成本/真机按实际或已接受边界记载，不补造PASS。当前版面修订范围132合格/133公开已收口，上线前最终工作在本人指定的其他窗口完成。

##### Phase 8｜Actual Publication

原50及本人修订的Phase7实际版面范围收口后，依实际生产技术门和本人明确授权在其他窗口处理：final full regression→production CloudBase必要差异deploy/read-back→migration/continuous bridge status→privacy declarations→production真机smoke→rollback ready→Git PR/merge main→微信upload→review/actual publish→online source commit→实际PUBLISHED后immutable tag。300数量门已由本人撤销，不要求继续凑数；已经消费的部署/bridge不重放。每次deploy/migration/data/PR/merge/upload/review/publish/tag单独授权，规划批准不代替任何外部许可；无actual PUBLISHED证据不建tag，V3仍未解锁。本次版面聊天不执行Phase8准备、Git或上线前回归。

## 13. Critical Path

已批准上游01—18合同与实现 → 19 layered gate → 20 true-device → 21 Pre-Pilot closure + Founder Closed Pilot waiver/accepted evidence gaps + production-direction approval → 22 Production Backend Convergence → PLAYER V1 continuous bridge + NETWORK OFFICIAL_CURATED unified pipeline → Founder collect/review/publish workflow → Shanghai50 production seeding rehearsal → Nationwide actual-count hot-start（2026-10-13本人撤销300门，132合格版面收口）→ 其他窗口 final production regression/read-back/true-device smoke → WeChat actual publication → immutable tag。

Phase全部属于TASK22，不创建新TASK_ID。Closed Pilot NOT_RUN/waived不再阻塞22；source/rights/consent/location/field/model/query/API/security/privacy/production真机与actual publication仍不得绕过。

## 14. `V2_COMPLETION_DEFINITION`

V2只有以下条件全部满足才完成：

- TASK21 Pre-Pilot PASS/HUMAN_APPROVED/FROZEN；Closed Pilot明确WAIVED_BY_FOUNDER/NOT_RUN，真实多用户理解、discovery-value/行动及pilot cost/scale缺口接受，不制造PASS；已有PDG语义保留，EDG按本计划第7节分证据/waiver/production重验。
- 至少一条production supply route实际成立；TASK22既定PLAYER continuous bridge与NETWORK OFFICIAL_CURATED能力及各自门都需验收，不以其中一条免除另一条计划职责。
- Source-specific DRAW/UPLOAD与NETWORK Source经统一Verification→VerifiedBoard→Resolution→Opportunity→Freshness→Eligibility→Projection→PublicMapLead；保持exact版本、当前五状态Opportunity/低机会可上图、null≠0、rights/PLAYER SHARE+适用consent/NETWORK官方review、public allowlist/location/privacy/moderation独立门。
- conservative unique continuation、hard-conflict不可覆盖、不同URL独立Observation、AMBIGUOUS、多实例/多贡献/latest valid state及continuous active ID/retire新ID/no-resurrection实际通过；CanonicalBoard仍DEFER。
- 上海50个Founder-approved版面production seeding rehearsal PASS，后端/真机/shared domain/V1-V2/security/privacy/rollback及NETWORK30d query/detail退出、history保留、新Observation全部验证后，最终冻结schema/ingestion/time-policy/UI/review/bridge合同。
- 全国300个Founder-approved合格版面成功production ingestion并通过PublicMapLead链路；approved/ingested/public-eligible/current-lead count、dup/BoardInstance、PublicLocation、read-back/一致性、性能/package/cloud cost/隐私安全/真机smoke有证据；不以抓到300篇文章代替。
- PLAYER历史eligible/future成功upload/draw/delete/version/current连续传播与恢复/重跑/回滚成立，不bulk-public private history、不提升shadow synthetic rows、不request-time private join；NETWORK候选审核前/拒绝后只在本地，Founder确认大赏、exact reviewVersion才可publish，不伪造PLAYER。
- bounded viewport/detail/rate/abuse/cache/freshness/cluster/弱网/package预算、无Profile完成门、manual browse/safe link、非实时/非推荐说明与production true-device/security/privacy/operations/rollback/final smoke通过；保留已批准能力的有限证据与未测coverage gap，不以模拟或waiver代替生产门。
- Founder明确接受release时剩余evidence gaps，全部未通过mandatory production门仍阻塞release；actual CloudBase部署/read-back/DB-index/bridge-migration/隐私/微信审核/Git main/online source/rollback完整。
- 微信实际PUBLISHED确认；immutable V2 tag经独立授权且精确指向online source commit。

提醒/订阅/海报/public board-evidence image/CanonicalBoard/复杂appeal-SLA/门店店员正式身份/CMS不纳入本轮完成定义；只有Founder未来显式批准才改范围，不自动解锁V3。

## 15. 当前停止点

- 唯一当前区块V2-E / TASK22整体IN_PROGRESS。Phase1生产基础与Phase2玩家桥接、当前地图修复已COMPLETE / HUMAN_APPROVED，依据2026-10-06用户明确人工验收确认。
- 生产九基础函数已部署回读；Phase2资源/bridge/四V1最小更新已应用。真实玩家V1→V2→Marker及全局continuous已验证开启。旧Phase1 secret STOP/0函数和旧Phase2暂停不再是当前门。
- 当前Phase3 NETWORK_SOURCE / OFFICIAL_CURATED已COMPLETE / HUMAN_APPROVED / PRODUCTION_APPLIED / LIVE_SMOKE_PASS / PHONE_PASS / SAFE_STOP，现行1353回归及清理/关闭回读通过。Phase4 本地自主采集已交付、SUPPLY_GAP / FOUNDER_REVIEW_PENDING；Phase5 官方持续工作流 LOCKED，后续按既定门推进。
- Phase3人工验收、生产接入、A清理/smoke关闭/最终回读均完成；Phase4 Founder 最终批准未完成；Phase5—8、上海50/全国300、实际微信发布和tag未执行。50原始并发读取通过不等同50条生产热启动；当前人工确认不制造后续阶段完成证据。
- 已消费资源、部署及真实桥接保持，不重复应用；本轮为 Phase4 公开采集、本地审核 artifact/文档/验证，云端写入、部署、迁移、Git提交/推送或正式发布均 0。报告与证据见顶部入口。

## V3

V3 保持 `DEFERRED / NOT PLANNED（延后／未规划）`；V2 完成不会自动解锁 V3。
# 2026-09-20 TASK-V2-17 结构重建修订

TASK-V2-17 的 fixed LEVEL hierarchy、overlap selector 与 topology-first output 已由 exact-scale screen-space collision、continuous Marker presentation、hysteresis、generation-cancelable transition 和 max-scale deterministic spiderfy 取代。保留原生 map、真实 GCJ-02 坐标、单次 center + target-scale camera command、TASK 14/15 状态保证、Tab 常驻和 settled viewport debounce。Runtime refinement 完成后状态只能为 `IN_PROGRESS / RUNTIME_INTERACTION_REFINEMENT_IMPLEMENTED / AWAITING_FOUNDER_RUNTIME_REVIEW`，TASK-V2-18 继续锁定。

Runtime refinement 进一步确认原生 `regionchange` 仅凭 begin/end 无法提供持续呈现帧；TASK-V2-17 因此以只读 `getScale()` sampler 和有限 settle tail 驱动宽度、碰撞、split/merge，空间位移由 camera scale progress 决定，反向手势取消／重基准。native icon anchor 透明化，避免额外 ICHI avatar 图层。状态保持 `IN_PROGRESS / RUNTIME_INTERACTION_REFINEMENT_IMPLEMENTED / AWAITING_FOUNDER_RUNTIME_REVIEW`，不得标 COMPLETE 或开始 TASK-V2-18。

True-device rendering repair 将 sampler 串行化、`setData` 设为单在途并合并到最新帧；split/merge 中间帧不再更新 native 经纬度，而以稳定地理锚点 + callout transform 保留连续性。旧 left/top ghost、cover-view 负溢出／阴影／非 transform transition 与 map 内 SVG 已移除，新增 `rendererror` 诊断。状态为 `IN_PROGRESS / TRUE_DEVICE_RENDER_REPAIR_IMPLEMENTED / AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`，不得标 COMPLETE 或开始 TASK-V2-18。

2026-09-21 只启用临时 Zoom Trigger Chain instrumentation，不实施修复：结构化记录 event、camera、presentation、marker generation、actual/coalesced setData 及 generation/rate。DevTools 证据已确认 end scale 滞后、post-end settle 驱动、每秒 8 次提交、native binding 3→6→7→8，以及 query change 的瞬时 0-marker projection；等待修复方案确认，TASK 18 继续锁定。
> 2026-09-28 TASK-V2-19 canonical delta: Founder superseded the no-consent v2 candidate contract with v3 user-level, versioned map-contribution consent. Current exact diff is `docs/delivery/v2-e-task-19-candidate-resource-exact-diff-v3.md`; v2 proposal/manifest/seven zips are `SUPERSEDED_DO_NOT_DEPLOY`. This local revision does not alter TASK-V2-20/21/22 gates and performs no CloudBase mutation.
