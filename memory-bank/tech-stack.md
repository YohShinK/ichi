# ICHI 技术栈

> 当前地图分享约束：`UPLOAD_CONFIRMATION_MAP_SHARING_V2`。原上传确认即分享意愿；核验后进入V1（不依赖条例），同意条例后通过V1→V2准入门；V2已准入数据自动生成Marker，不设二次审核或授权。当前条例覆盖本人此前及以后已上传V1记录。本人记录只显示V1“已上传”，禁止二次分享按钮。现行规范：`docs/decisions/map-upload-sharing-contract.md`。


## 2026-10-13 Phase8 扫描与备案技术边界

敏感扫描采用校验官方发行包SHA256后的Gitleaks8.30.1，目录/全部Git历史及提交候选分开扫描，日志与报告脱敏；依赖缓存不作为自有源码扫描。密钥名称/配置fingerprint/合成测试不得误称凭据，真实凭据、内部取证和私人材料不入Git。忽略不删除本地文件，已跟踪构建缓存需解除跟踪。Vitest排除历史artifact/部署复制品，不能排除失败的当前源码测试。

备案编号是公开展示配置，必须使用本人提供的当前有效完整小程序编号，查询网址固定https://beian.miit.gov.cn/。微信复制适配隔离平台API，网页使用官方HTTPS链接；不为未核实的外部业务域名增加web-view，不将复制入口写作已通过全部备案展示规则。真实编号、后台主体/隐私声明、必要新手机smoke仍为上传前独立门。

上线归档发现网页预览三个API仍依赖本人Downloads。原批准HTML及两个公开UI原图逐字节归档为apps/web/source/，三个API改读仓库路径；SHA与原文件相同，无视觉素材重绘。此目录是历史V1网页基线，不冒充V2生产地图；原本机文件保留。

## 2026-10-10 Phase7 图片证据取得边界

沿用Ego同一TaskSpace1与当前公开DOM资源，Node正常下载及浏览器支持的页面fetch/可见下载/完整大图截图作有界后备。解码使用现有bundled Python/Pillow，必须显式decoderPython绝对路径；真实加载或截图清晰度仍需逐赏视觉核验。每方法一次、失败保留、原capture不改，旧链接重新取当前有效URL不能刷新源观察时间。真实403案例3张补取/解码通过；保存被禁止时的真实截图案例及新视频仍按实际遇到记录，不冒充已测。没有新技术平台或服务器改动。

## 2026-10-09 Phase6 修复版人工验收完成（最新）

用户在修复版1054089字节二维码后明确“人工验收完毕”，本次跨城市修复PHONE_REPAIR_USER_CONFIRMED_PASS；iPhone16Pro/一个账号沿用，系统/微信版本未知，已接受未测边界保持。Phase6=COMPLETE / HUMAN_APPROVED / CROSS_CITY_FIX_PHONE_ACCEPTED / CURRENT_INTEGRATION_PASS / PREVIEW_READY / SAFE_STOP。本次最终集成1481 PASS/1既有SKIP/0 FAIL、types/Lint、Next/26 Playwright及原生/真实SDK地图门通过；仅Phase7新增媒体测试初次缺解码Python环境失败，使用项目现有Pillow运行时后通过且保留失败。

MAP_PICKER_RENDERED_LEAD_REVALIDATION_V1为当前防回退门，杭州真实剩1/另一条已删不可用；旧手机六项与本次修复人工反馈分别绑定，不扩大到新上传/辅助抽赏、全生命周期、未知版本或性能。Phase5后端三文件SHA保持；独立Phase7四份工具源码变更另记，不声称旧28源仍全部相同。收口报告docs/delivery/v2-e-task-22-cross-city-picker-revalidation-repair.md，人工phone-repair-human-acceptance.json与当前final-state.json；TASK22整体IN_PROGRESS，独立Phase7授权保持，Phase8/正式发布未由本聊天解锁，无本轮部署/旧准入/生产来源配置写入/Git。

## 2026-10-09 Phase6 跨城市列表安全重核

技术栈、50条/页和500快照合同不变。已呈现Marker的ID可在概要暂空或分页尚未包含时经现有安全公开detail重核；客户端不再把缺席当删除。仅明确LEAD_UNAVAILABLE、本人删除或已知到期移除；瞬时失败保留有效行，空壳关闭后恢复原控件，generation/关闭/后台迟到响应仍拒绝。2并发/8行、2分钟/16项且仅当前成员的准备区保持；没有整图详情请求或自动扩大缓存。

本轮1474 PASS/1既有SKIP/0 FAIL，types/Lint/Next与26 Playwright通过。真实微信SDK杭州当前1条、另一条LEAD_UNAVAILABLE；大范围同快照两页50+1，当前客户端无杭州概要仍能读取/选中真实剩余详情。原生已编译页面用历史paint状态进行受控回放，安全公开读取、行移除/正确选中/全失效关闭与控件恢复通过，不充当物理手机新验收或P95。初次自动化超时及本地加载器/旧临时SDK路径失败保留，官方auto恢复后通过；未改变用户代理/网络设置，无生产来源/配置写入或重复部署。修复预览1054089字节成功并已提供，Phase6按已接受边界收口。

## 2026-10-09 Phase6 并行验证技术边界

沿用当前Node24/pnpm11.9、生产CloudBase管理读取和原生开发工具真实wx.cloud SDK；不引入新框架或生产服务。本轮只读管理核对50个exact来源/决定/观察/ACTIVE实例与公开投影，实际SDK覆盖50NETWORK+2PLAYER详情、六组按reasonCodes匹配的筛选、低新鲜度开关及五页LIST去重。公开读取仍有正常原子限流计数/分页快照写入，不写来源或配置。

50个不同真实网络公开ID在一个账号中原始SDK突发50/50返回，应用层无排队/重试，P50=4116ms/P95=6629ms/max=6714ms。首次单个App.evaluate等待整批返回超时，不归因为后端失败；改为开发工具逐响应binding传输并逐项核对原版面/时间/身份后通过。此轮仅SDK往返样本，不是物理手机P95、50用户pilot或50个实际SCF实例并发；查询30/min、详情60/min及产品列表2并发/8行保持。

1429/1 skip为初始并行基线；当前最终版本1462 PASS/1既有SKIP/0 FAIL，25证据/28源码SHA保持，七实际回读完整包42025文件与候选一致。Phase6对同一最终network源码的50真实来源exact批准/digest兼容及最终50NETWORK+2PLAYER保持通过，182客户端与配置SHA保持。源码包体1394665 bytes、余量702487、dev/fixture=0属于静态源审计；r3实际微信预览1053453字节，用户先确认正常打开、再确认六项地图真机全部通过。iPhone16Pro/一个账号，系统/微信版本未知，无新上传/抽赏/删除或真机P95反馈。环境计费仍仅全环境累计量，不推算隔离成本。初次Timeout、DNS失败/旧码失效和新成功证据保留；最终范围接受前不标整体完成或发布。



## 2026-10-09 Phase5 工具技术边界（当前已解锁）

沿用Node ESM、现有NETWORK schema/validators、CloudBase管理认证及签名admission/maintenance端口。复用服务器shared Verification/Resolution/projector，不在采集工具复制公共投影算法。CLI为scripts/ichi-network.mjs，模块归scripts/network-workflow/；原日期绑定的Phase4脚本与输入保持历史，不作为可编辑运行底座。

本地批次按版本快照、SHA证据副本、原子HEAD及进程锁保存；审核、修改、操作attempt和恢复结果形成hash-chain audit。命令分离collect/auto-review/review/fix/edit/publish/resume/correct/withdraw/status；publish/correct/withdraw默认只形成计划，execute消费限定操作与环境授权。既有记录通过resume只读恢复，不另设import-existing命令。CloudBase适配器依赖显式配置的现有manager/SDK运行时路径，运行时认证从登录端口读取，不保存密钥或完整环境变量。没有新云资源/公开管理接口/浏览器CMS/自动采集定时器。

Skill仓库源在skills/ichi-network-curation/，以受限项目说明安装到用户Codex技能目录；只有处理本项目官方网络来源时触发，遵循Ego采集授权和handoff规则。候选审核HTML内嵌本地证据，只供Founder核对和导出exact决定，初始确认均未勾选，不读取生产库。

## 2026-10-08 50条目标的限定准入协议（当前实现中）

沿用现有CloudBase运维签名端口、事务准入和public-map-v4。保留旧venueApproximation原10项及其投影规则，新增独立collection50VenueApproximation注册表；两表合计最多50项且sourceId不交叠，仍绑定sourceVersion/locationDigest，避免改全局rule导致旧10条失效。新增可选reviewDelegation，绑定本次用户授权引用/授权时间及每条sourceId/sourceVersion/contentDigest；只有注册表精确匹配才接受reviewedBy=AGENT_USER_DELEGATION，FOUNDER原协议继续有效，独立rights不变。

同帖多块实体板使用私有可选boardEvidenceKey（image序号＋板型/板号）派生独立sourceId；canonical sourceUrl仍保留原帖，不伪造文章链接。旧无该字段的sourceId完全保持；同一实体板的历史照片仍须在本地证据及Resolution中关联，不能用不同键重复计数。新增字段只进入私有原始来源与摘要，不加入公开详情。

当前仅本地实现/验证准备，生产policy、准入和公开数量未改变。新部署必须基于新鲜远端最小差异，保留既有原始包和历史回执；PLAYER、维护/smoke/timer及正常上传分享流程不改。

## 2026-10-07 NETWORK 人工纠正与列表内容复用（当前）

沿用现有CloudBase可信运维SDK和共享验证／投影，内部correction.mjs以暂存读写集和数据库事务CAS执行版本化事实纠正，没有新公网端口或云函数部署。原公开安全门、限定地点allowlist及独立exact-version决定保持；NETWORK展示层共用展开内容和原observedAt，玩家真实首次上传时间不变。已执行5条真实纠正，10条实际query/detail、原生文本和10个Canvas信息条通过，2条PLAYER保持；正常NETWORK准入／维护／smoke／timer未开启。回执artifacts/task22/phase4/remaining-correction-20261007/，官方预览1053453字节，尚未正式微信发布。

## 2026-10-07 NETWORK 地点展示文案简化（当前）

沿用既有public-map-v4、PublicMapClient和原生详情卡片，无技术栈或生产协议变更。NETWORK_VENUE_NAME_ONLY_DISPLAY_V1只在客户端presentation转换时移除已定义的地点描述前缀；原publicLocation.areaLabel/precisionMode及后台null误差、地点证据和准入规则均保留。该展示规定取代下方本批要求显示“大致位置／位置误差未知”的旧文案。原生模拟器真实10条的折叠／展开文本均通过；新官方预览1053152字节，未正式发布。报告docs/delivery/v2-e-task-22-network-venue-label-simplification.md。

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

本轮内部工具采用现有 Node、SHA256、JSONL/JSON/CSV、自包含静态 HTML 及原图相对路径，无新框架/云服务/生产接点；CSP connect-src none，来源链接只由用户显式打开。UTC 保存、上海日期过滤、分钟/范围精度明确，本地导出/导入和 localStorage 不承担服务器信任。本地 schema 不构成 Phase5 技术实现或准入授权。

## 2026-10-07 TASK22 Phase3 已收口（当前断点）

TASK22 Phase3 = **COMPLETE / HUMAN_APPROVED / PRODUCTION_APPLIED / LIVE_SMOKE_PASS / PHONE_PASS / SAFE_STOP**。用户明确“人工核验通过，Phase3 收口”，并指定上述最终状态；PHONE_PASS依据用户确认，设备型号/系统/微信版本/性能未提供，不补造Agent真机实测。当前报告`docs/delivery/v2-e-task-22-phase3-human-acceptance-and-closure.md`，收口证据`artifacts/task22/phase3-close-20261007/`；人验与安全停机均已完成，无Phase3待清理项。

最后构造来源A已通过既有签名维护端口TAKEDOWN；三构造来源均TAKEN_DOWN/noResurrection，Observation/history/audit保留。global:network.smokeEnabled=false、来源allowlist及新Marker ID能力清空；验收账号未来时钟能力撤销，原测试公开ID隔离仍保留。普通NETWORK admission/maintenance环境与数据库双门false，提供方maintenance timer Enable=0/CLOSE。真实生产query无构造条目、两构造detail不可用、原PLAYER详情正常；已签名smoke读取UNAUTHORIZED、已签名旧来源ADMIT返回NETWORK_SERVICE_DISABLED。PLAYER原版面/观察时间/首次上传时间/位置/贡献者/备注等10字段及全局features/bridge回读一致。登录一度失效，用户恢复后完成清理；失败尝试单列保留，不作为成功证据。

工程验收沿用1353PASS/1既有SKIP、七包287/修复两包84、类型/Lint/Next/Playwright26、七函数186源码与190旧artifact保持的已通过证据；本轮只运行清理、真实公开读取、关闭/隐私回读和文档治理，无新部署/索引apply/bridge重放/采集/Git提交。Phase3来源图标与独立rights/Founder/30天/PLAYER fallback确认事实已收口。

Phase4认知对齐已完成：既定本地候选/Review Card/Founder终审的目标、输入、产物、依赖与验收无实质冲突；构造smoke决定不得用于真实文章，独立rights、exact版本、原观察时间及不同URL分别Resolution继续成立。不改写远期计划。本次不启动Phase4—8/50/300/常规NETWORK continuous/正式微信发布；V2-E/TASK22整体仍IN_PROGRESS，后续待明确执行指令。不得重复Phase1/2或Phase3已消费部署/三条smoke/手机验收。

SAFE_STOP技术边界：不关闭已验收PLAYER读/持续桥接，不删除历史；仅撤销NETWORK临时smoke能力，常规NETWORK服务与timer仍关。旧签名具备正确密钥也不能重新准入这些来源，保留权威配置供后续明确解锁。

## 2026-10-06 Phase3 生产断点（历史快照；当前人验/收口见上节）

当前状态PRODUCTION_APPLIED / LIVE_SMOKE_PASS / PHONE_PENDING / AWAITING_REVIEW；V2-E/TASK22仍IN_PROGRESS，Phase1/2及既有地图修复HUMAN_APPROVED断点保留。用户本轮明确授权七项生产动作，1—6已完成，7尚缺实际手机证据。报告：`docs/delivery/v2-e-task-22-phase3-production-apply-and-smoke.md`；证据：`artifacts/task22/phase3-live-20261006/`。不重做已消费Phase1/2部署/bridge，不启动Phase4—8、50/300、实际文章采集或正式微信发布。

从当前真实远端捕获新基线，更新五现有函数、新建admit-official-network-source与maintain-official-network-sources，apply两个非TTL索引和独立network policy/control/curator。普通NETWORK准入与维护环境/数据库双开关false，提供方maintenance timer Enable=0/CLOSE；PLAYER features和bridge全字段保持。签名运维、exact决定最终事务重读及受控读取隔离验证通过。受控时钟字段首次被白名单拒绝后，从刚部署远端再次生成仅两行的新diff修复query/detail；未复用旧授权或重复配置。最终七函数186/186源码及配置回读PASS，190旧artifact和此前Phase3本地ZIP保持。

三条用户授权人工构造NETWORK在production准入/公开/期限验证PASS，不声称真实文章Founder审核或rights。B实际时钟跨30天边界后隐藏并退役；C限定deadline维护和未来读取确认真实PLAYER fallback、原publicLeadId及版面/备注/贡献者/首次上传时间/位置保持，随后撤下构造NETWORK；B/C审计保留、禁止复活。A仅指定真实ICHI-001验收账号可见，测试窗口2026-10-07 22:22:46.460+08截止，待实际手机后TAKEDOWN并关闭smoke；期限隐藏不等于timer自动退役。下一轮只补手机/A清理，不重复部署或smoke。

当前源码1353PASS/1既有SKIP、类型/Lint/Next、Playwright26、实际七包287及修复两包84测试PASS。原生模拟器真实生产Marker/详情及私有字段扫描PASS；发现官方图标未挂WXML后补独立来源图标分支并生成新预览，不填造PLAYER头像数组。实际手机PHONE_PENDING，禁止用模拟器充当真机PASS；后续状态以本节和新报告为准。

技术接点：继续CloudBase NoSQL/Nodejs20.19，不引入新数据库。独立NETWORK HMAC凭证仅云端环境与工作区外受控运维材料保存；30秒全payload签名、指定账号/公开ID/有效窗口限制受控未来时钟。timer提供方关闭、环境和database双门关闭；不启一般NETWORK continuous。

## 2026-10-06 TASK22 Phase3 本地断点（历史快照；当前生产状态见上节）

用户明确授权从已人工验收Phase2继续执行Phase3。唯一活动区块V2-E / TASK22仍IN_PROGRESS；Phase1/2及地图修复COMPLETE / HUMAN_APPROVED，旧部署和桥接已消费，不重做。Phase3已LOCAL_IMPLEMENTED / LOCAL_GATES_PASS / AWAITING_REVIEW / CLOUD_NOT_APPLIED；Phase4—8、网络采集、真实网络入库、生产新部署及正式微信发布未执行。当前报告：`docs/delivery/v2-e-task-22-phase3-official-network-source.md`，证据：`artifacts/task22/phase3-network-20261006/`；该入口取代下方历史“Phase3未开始”的当前状态描述，不改写旧部署回执。

认知对齐通过：NETWORK_SOURCE保留枚举，sourceMode=OFFICIAL_CURATED、XHS、网络上传、贡献人null；不创建PLAYER Account/Profile，不依赖PLAYER条例。Founder审核只确认准确性，独立item-level rights证明及版本、可信curator/takedown责任和共用公开安全门均须成立。来源使用canonical HTTPS www.xiaohongshu.com/explore/文章ID，无token/query/hash/别名；sourceId由canonical URL派生，不同URL仍分别Resolution。Founder决定、rights、非空备注exact safety来自内部可信决策端口，绑定sourceVersion/contentDigest/reviewVersion/rightsDecisionVersion，并在最终事务复读；未准入/歧义/拒绝留本地，不生成正式V2半成品。

时间政策network-visibility-30d-v1：有可信实拍依据时observedAt取该时刻，否则SOURCE_PUBLISHED_AT_FALLBACK取sourcePublishedAt并保留依据；实拍≤文章发布时间≤fetchedAt≤reviewedAt≤当前时间，均使用规范UTC时间。抓取、审核和验证不刷新observedAt。publicUntil=observedAt+30×24小时，now>=publicUntil时query不返回、detail不可用，history/provenance/audit不删除；新Observation重走门，不改旧时间续命。已准入相同时间版本不能借Founder复审强行relink；纠错工作流留Phase5，不绕过共享Resolution。

公开NETWORK使用public-map-v4的网络上传标签、OFFICIAL_NETWORK图标及期限字段；PLAYER旧v3客户端/后端兼容。实时期限作用于cursor/asOf/includeLowFreshness、离线缓存、准备详情及已经渲染的卡片。网络支撑独立到期，内部有界到期维护复用同一projector；仍有效PLAYER支撑保留原publicLeadId，客户端允许同ID更高servedVersion的PLAYER继续显示；全部支撑退出后新生命周期使用新ID。公开query/detail不join private/source。网络policy版本不匹配时fail closed。

自动验证：当前源码范围Vitest 1347 PASS / 1既有SKIP、Phase3后端37+客户端12专项、旧production集成60；root/Web TypeScript、ESLint、Next build、Playwright26/26、独立compiled ZIP真实Node ESM准入/公开/到期链路通过。190个既有ZIP/资源manifest SHA保持；云端写入、部署、迁移、bridge replay、Git commit/push均0。workflow、上传分享防回退、相关contracts、格式与diff检查均PASS，机器收口回执final-validation.json。未把本地fixture称为真实小红书或生产网络数据，也未制造真机/人工验收证据。

技术接点：schema map-network-source-phase3-v1；network政策network-visibility-30d-v1；公开additive v4协商，既有v3 PLAYER保留。结构事实仍复用player-board-facts-phase2-v1的canonical BoardFacts schema（该版本名是事实格式，不引入PLAYER身份），保证PLAYER/NETWORK共用board identity。来源原版本+内容hash+审核/rights版本派生observation sourceVersion，兼容既有kind/lineage/version唯一索引。最终准入复用Phase2内存read/write-set staging与CloudBase事务CAS，decisions.read须由未来同一事务的可信决定存储实现，不接受客户端证明。到期按公开期限有界选择→内部实例反查→共享projector；查询端只验证安全公开core。Phase3两个索引expireAfterSeconds=null，禁止TTL删除历史。生产端口/timer/SDK/index接入尚未执行，后续exact diff单独推进。

## 2026-10-06 TASK22 已完成阶段人工验收与下一步

用户明确“22 人工验收完成”。当前已交付Phase1生产后端、Phase2玩家全局持续桥接及截至本日的地图/上传修复记为COMPLETE / HUMAN_APPROVED。下方历史AWAITING_REVIEW是当时快照，由本次明确人工确认取代；原始测试和部署回执不改写。用户未提供设备型号或新的性能数值，不补造人工实测。

TASK22原计划含八Phase，Phase3—8未执行，故TASK22/V2-E整体仍IN_PROGRESS。下一步Phase3为NETWORK_SOURCE / OFFICIAL_CURATED模型、来源权利/审核版本、30天公开期限与统一投影的本地实现和测试；用户当前要求说明执行方法，尚未要求实施Phase3。不重复Phase1/2部署、桥接、迁移或timer开启，不提前采集50/300或执行正式发布。报告：`docs/delivery/v2-e-task-22-report-and-human-acceptance.md`；人工记录：`artifacts/task22/human-acceptance-20261006/acceptance.json`。

## 2026-10-06 完整详情就绪优化

MAP_DETAIL_READY_REUSE_V1实现：PublicMapClient增加2分钟/16项内存公开准备区，根查询代次、准备代次、当前marker、servedVersion、schema/projection/policy、suppression及非负age联合验证；公开预读/picker/selection同ID在途请求合并。选中有效准备结果同步LOADED并后台复核；缺准备或过期正常读RPC，不永久缓存详情。根刷新、手动forceRefresh、查询变化及home hide/unload/退出按各自生命周期取消迟到提交。普通详情RPC的独立选择代次保留，视窗刷新不破坏仍有效的选择。

PublicViewportResponse新增向后兼容可选preparedDetails（最多2、首根页），candidate适配器按现有完整详情及独立公开头像规则校验，拒绝重复/非本页/旧版本/错policy或projection/私有身份字段。public-map-v3不改。生产query在原账号/control/policy/epoch终检之后，复用已读safe public cores用现有公开detail投影，不增加DB读；补上该query真实远端历史domain所缺的可信uploadedAt安全投影。未改detail函数、security频控、数据库配置或桥接。

真实热接口基线752ms/581ms；客户端单独提前预读仍出现6801/7302ms RPC，浏览2秒后需5281ms完整显示。没有平台ColdStart证据，不归因于确定的冷启动占比。最终query646ms同时带回2条完整资料，立即选择状态7ms/6ms，后台RPC2963/2903ms仍正常成功；实际OS点击状态7ms/8ms。该样本证明消除了首2条独立详情网络等待，不构成真实物理机P95。最初15秒TTL不足以覆盖浏览时间，最终采用已有列表2分钟TTL，仍选中重验、失效清理且不落盘。当前自动验证1338通过/0失败/1既有跳过；后续正式发布仍锁定。

## 2026-10-06 重叠列表原生点击传播

MAP_PICKER_NATIVE_TAP_PROPAGATION_V1已CLIENT_IMPLEMENTED + NATIVE_POINTER_VERIFIED / AWAITING_REVIEW。修复前真实OS点击仅到达外层onMapOverlayTouchStart/End，子行select/openSelected为0，而Element.tap直接注入可成功。根因为catchtouchstart/end取消子tap；picker/detail生命周期使用bindtouchstart/end/cancel、scrim start使用bind，保留catchtouchmove/catchtap和现有350ms尾事件护栏。最终两条真实ID普通点击/切换正确，外部真实点击关闭；平台touchstart/move/end回归验证picker/组合与独立detail内部保持，外部tap/drag关闭、刷新失败保留、横滚58px。未改JS或后端原子计数。1299回归/26 Playwright/type/lint/Next/分享/workflow通过，预览1041414B；未正式发布或验证物理手机。报告docs/delivery/v2-e-task-22-picker-native-tap-propagation-repair.md。

## 2026-10-06 公开读取50并发可靠性

PUBLIC_MAP_READ_CONCURRENCY_50_V1已应用：仅query/detail限流使用mapControlState既有rate行原子where+inc，_id唯一定位；首次add唯一ID、换分钟比较旧window/count再CAS重置，竞争败者有界重读。count<limit条件和inc同一次数据库update，避免共享事务热点并保留query30/min/detail60/min硬上限；其他写命令继续原事务。真实wx-server-sdk@4.0.2已验证首次50/换窗50无异常、100详情60放行40限流，3条自有隔离计数器精确清理。客户端生产RPC全局串行补偿已撤除，列表最多2并发/可视8行保持，卡片不等待共享队列。真实生产50原始SDK请求50/50，无应用排队/重试，p50 3324ms/p95 5541ms/max5775ms；原生50独立运输样例全部读取并正确选择。无新collection/index/规则，来源各自远端ZIP最小补丁/配置不变/回读通过。50测试不是50人pilot，网络及平台内部实际调度未测量；报告docs/delivery/v2-e-task-22-public-read-concurrency-50.md。

## 2026-10-06 重叠列表信息恢复与地图窗口触摸边界（串行措施已被顶部后端修复取代）

MAP_PICKER_METADATA_RECOVERY_AND_OVERLAY_TOUCH_BOUNDARY_V1已CLIENT_IMPLEMENTED + REAL_PUBLIC_NATIVE_VERIFIED / AWAITING_REVIEW。生产适配器将picker和selected detail共用同一FIFO队列，实际RPC并发1，避免同账号detail rate事务争用；query不排此队列、candidate路由不变。picker仅SERVICE_UNAVAILABLE/网络失败重试一次，不重试限流/身份/失效/版本拒绝；保留终检，不用缓存代替选中详情。初始/滚动/刷新最多8行、最多2个逻辑读，视窗起点夹紧；失败保留已读有效行，明确失效移除，onIdle收刷新态，关闭取消提交。overlay catchtouch与起止/350ms尾事件护栏，不拦程序化update；外部触摸清护栏。1282现行测试/26 Playwright及类型/Lint/Next/原生/分享/workflow通过，预览1041933B；未部署/迁移/正式发布。报告docs/delivery/v2-e-task-22-picker-metadata-recovery-and-overlay-touch-boundary.md。

## 2026-10-05 Marker标签收紧与重叠列表两行信息

MAP_MARKER_COMPACT_TAGS_AND_PICKER_METADATA_V1已CLIENT_IMPLEMENTED + NATIVE_VERIFIED / AWAITING_REVIEW。沿用Canvas measureText与原生PNG Marker；框宽为实际可显示文字宽+必要内边距并受当前档位限制，PICKER首行用省略号，不修改外壳/anchor/真实坐标/聚合判定。Canvas缓存v8及picker-v2将公开备注/上传时间纳入图像键。metadata使用既有production detail服务，初始8行、scroll窗口8行、最多2并发、同次列表ID去重、不缓存详情或等待全列表；可信uploadedAt缺失显示未知，不借observedAt补造。generation/ID/请求/version/隐藏终检及page生命周期取消防止串记录和复活。1269现行回归、75最终定向、类型/Lint/Next/原生/分享/workflow通过，官方预览1038468B；没有生产函数/配置/协议/数据迁移变更，未正式发布。报告docs/delivery/v2-e-task-22-marker-compact-tags-and-picker-metadata.md。

## 2026-10-05 详情卡片赏级按列正序

MAP_DETAIL_COLUMN_FIRST_TIERS_V1已CLIENT_IMPLEMENTED + NATIVE_VERIFIED / AWAITING_REVIEW，V2-E/TASK22仍IN_PROGRESS。沿用原生scroll-view和CSS Grid：grid-auto-flow=column，固定两排54px、自然源序、动态ceil(count/2)列；不转置DTO、不依赖JS重排。真实19赏级元素几何确认第一列A/B、第二列C/D，634px横移可达末列S，奇数尾项处于上排；隔离5项夹具亦通过。343相关回归、type/lint/Next、分享与工作流门PASS，官方预览1030941B。没有平台、生产函数或数据变更，正式发布与后续Phase未解锁。报告docs/delivery/v2-e-task-22-map-detail-column-first-tier-layout.md。

## 2026-10-05 地图定位与刷新入口恢复

MAP_RECOVERY_CONTROLS_ALWAYS_AVAILABLE_V1已CLIENT_IMPLEMENTED + NATIVE_VERIFIED / AWAITING_REVIEW，V2-E/TASK22唯一活动区块仍IN_PROGRESS。原WXML把筛空/搜索空/零选、首次加载、服务错误和native渲染错误耦合到浮动控件的卸载条件，当前已解耦；大致位置本身不是根因。现在只有实际详情壳、重叠列表或modal覆盖时暂时隐藏，关闭后恢复；陈旧cardPhase但sheet CLOSED/detail IDLE不再误隐藏。保留map内原生cover-view及原按钮几何/绑定、重复请求保护、模糊定位和分享合同。34新用例/295home/1252现行PASS、0FAIL/1已有pending，type/lint/Next/分享/工作流/差异及原生20状态/真实定位与刷新点击/详情关闭恢复PASS；SDK恢复、fixture清除、点圆0。正式开发工作区和预览已搭载，包1030938B；本轮无生产部署、配置或用户记录变更，不重复此前部署或桥接，正式微信发布/后续Phase仍锁定。报告docs/delivery/v2-e-task-22-map-controls-availability-repair.md；证据artifacts/task22/phase2-map-controls-20261005/。 native coverView配置保持true，普通页面“重新载入”保留原生渲染失败恢复通道。

## 2026-10-04 生产桥接恢复（当前）

MAP_FIRST_OPEN_AND_DETAIL_LATENCY_V1生产query/detail已最小UPDATE_CODE：各自真实远端ZIP为基线，仅shared/runtime/security改动，各17源码及配置hash回读一致。首屏无nextCursor不持久化未使用快照，有分页仍保持原安全协议；事务外readControl四项并行、末次账号与控制并行，初次仍先认证，CloudBase事务内控制读串行。stop/epoch/policy/account/rate终检不变。首页预加载沿用PublicMapClient与120000ms内存快照TTL、Page生命周期generation及身份恢复，不预定位/持久化个人坐标/无限缓存详情。真实RPC时序不能当平台ColdStart或真机P95；证据见本轮latency报告。

CURRENT_LOCATION_APPROXIMATE_ALLOWED_V1沿用GCJ02并尝试微信当前权限允许的最佳结果，不请求或引导升级系统精确权限。requestCurrentMapLocation只拒绝非法坐标/API失败/超时；有限正数accuracy保留，缺失/无效精度归null，approximate由模糊权限、accuracy>100米或null决定。原生map使用同次结果个人binding与误差circles；不改上传及V1→V2公开准入precision policy。 当前已实现并通过1208回归及原生定位验证，状态AWAITING_REVIEW；报告docs/delivery/v2-e-task-22-approximate-location-support.md。

DIRECT_UPLOAD_NOTE_RETRY沿用现有微信security.msgSecCheck（version=2、scene=2、可信WXContext OpenID），只接受明确pass，拒绝/review/错误均在direct完成V1事务前失败。客户端pendingFinalization持久化原确认和识别幂等key，token仅当次内存；reserve-recognition恢复recognized_released并复用已有识别结果，审核成功后原子finalize与额度提交，幂等重放不重复计数。未通过记录只在本机待上传列表，复用现有修改备注弹窗；原位置复用、无新双位置审核。1158回归及官方小程序预览/隔离平台验证通过，未引入新平台或服务；现有生产门一致故不重复部署。

地图资料接点已生产应用并真实验证：CUFZBP公开昵称001、头像副本与本人原头像字节一致、备注“测试”、剩余43抽，uploadedAt=2026-10-03T09:55:25.907Z（北京时间17:55），observedAt=09:54:23.351Z（17:54）保持Freshness依据。本人实际调用安全核验得到NOTE_PASSED后，仅既有全局timer处理LEGACY_NOTE_AUDITED事件APPLIED/admitted=true；手动worker/drain=0，真实ACCEPT=0，V1原记录未改。详情只消费公开投影。证据artifacts/task22/phase2-map-display-audit-20261004/owner-notes-timer.json与native-real-metadata-qa.json；独立报告docs/delivery/v2-e-task-22-map-display-and-public-metadata-audit.md。

地图备注当前修正（取代本轮早期worker补审假设）：真实V1 identity只存OpenID哈希，不可从timer还原；新增V1 bind-wechat-profile内部sync-map-metadata action，使用本人实际WXContext的临时OpenID，当前v3条例服务器校验后每批2条只读旧direct文本，实际msgSecCheck、exact-hash proof写入ADMINONLY mapSourceBridgeState并同事务source唤醒。production-map-service仅在GET/ACCEPT验证当前accepted后自动有界分页，无新UI/分享授权/ACCEPT重试，不储存raw OpenID、不改V1原数据；失败deferred，后续onShow再试。worker仅准备头像并消费现成安全proof；尚无proof时板面可准入、备注省略。新direct继续V1首次上传原安全检查，正常后续不依赖设备意图。生产早期rev2/3头像/昵称/时间通过但note未贯通的诊断回执保留，本轮最终以owner补审及最终timer验证为准。


本轮用户已确认举报资格：正常active账号可举报；封禁/异常/受限制账号、显式后台资格禁用或无效/过期资格记录不计数。既有10个不同合格账号自动隐藏不变，不授予普通账号维护角色。生产report API必须返回active/hidden/policyVersion并保持幂等、取消、隐藏不可自动复活；实际验证只GET_STATE，不制造真实举报。


地图资料修复：桥接在V1→V2预计算前读取本人可信profiles；已接受当前条例的客户端自动调用bind-wechat-profile/sync-map-metadata，使用当前本人临时OpenID为旧direct locationNote实际msgSecCheck补审，exact hash证明留在ADMINONLY mapSourceBridgeState；不改写V1或把私有文本直接展示。头像只把本人已绑定profile-avatars对象复制到独立public-map-avatars不透明版本路径，逐对象public-read，白名单为本环境COS origin，绝不改整个Bucket ACL；SDK调用凭据仅来自当前函数角色上下文、不持久化。缓存版本和源profile/record参与准入CAS。profile更新同原事务持久唤醒本人当前条例扫描；账号删除worker清理公开副本。uploadedAt来自服务端首次接收（DRAW精确已批准submission首次提交），PublicDetail可选字段，Freshness仍是observedAt。COS依赖固定cos-nodejs-sdk-v5@2.15.4及@cloudbase/node-sdk@3.17.2；每次调用从getCloudbaseContext读取角色凭据。头像存储临时失败省略该头像字段，不阻断合格版面准入；仅新worker/drain候选注入，不重建冻结旧产物。


四V1 producer、桥接processor、worker/drain及resolver/projector已开启；真实批次与客户端链路通过后，query/detail/readEnabled和既有每分钟timer已开启。全局单timer服务全部账号，各自当前v3同意决定本人历史与未来来源范围，无逐账号部署。旧逐条选择disabled/ownerEntry=false，HA/NETWORK边界保持；已应用资源与19/22/22部署不重复。

实际query暴露CloudBase事务并行读取控制后TransactionBusy/-501001；仅以query当前真实ZIP为基线替换shared/security.mjs的readControl为已验证的顺序读取，单次UPDATE_CODE后17文件/原启用配置回读通过，45/45回归及真实SDK只读事务通过。实际微信query/detail/原生Marker通过；CLS返回嵌套转义JSON，观察器解析后取得连续9次timer成功回执，failed=0，timer保持OPEN。独立证据artifacts/task22/phase2-production-resume-20261004。

## 2026-10-03 条例覆盖已上传V1（范围仍现行；暂停状态已被顶部恢复取代）

现行v3 terms增加uploadSharingScope=UPLOADED_V1_RECORDS、rightsAttestationIncluded=true并绑定新版正文scope；服务器ACCEPT派生同范围及rightsAttested记录，client不能自报已接受。旧v2不能代替明确覆盖此前已上传记录的v3同意。三个函数按各自真实当前ZIP增量更新；新版client policy对应v3，原子准入、100米位置和删除/currentness保持。 三函数19/22/22真实源码/配置回读及v3政策CAS通过；完整历史只读准入使用admissionPreviewDatabase内存写集与禁止真实写入的底层代理，cloudWrites=0，不假设已取得用户同意。

## 2026-10-03 V2准入即自动地图（历史；v3范围及状态以顶部为准）

V2_ADMISSION_AUTO_MAP_V1使用现有ADMINONLY source outbox/state，不新建资源。预计算仅内存，commit受共享mutationRevision、逐doc快照和95操作预算约束；失败不留下半套正式V2数据。生产后端四函数最小UPDATE_CODE，最终稳定配置与暂停开关保持；manage-map-player-source只将启用flag关闭并关闭ownerEntry。平台tcbContext/userInfo不参与身份/授权，只验证六个签名字段与域/时限。真实非空RPC与原子准入及SDK唤醒验证通过；旧冻结构建证据不重写。

## 2026-10-03 V1 上传／V2 转化修复（历史；以本页顶部最新记录为准）

V1确认披露版本upload-confirmation-map-sharing-20261003-v2，不依赖terms／scope或V2控制行；账号条例仍由可信服务器绑定map-contribution-20261003-v2和scope 4bbd5de5b49d44a5eb11e4e3c96e77194ab48e06cdfdb4b7ec2319af2ef82230。直接上传复用微信服务端文本安全检查，失败拒绝终结提交；V2公开定位保持0.001°／accuracy≤100米。部署仅使用当前真实远端ZIP做最小UPDATE_CODE，不统一覆盖历史差异。

上述V1、条例和worker最小更新已生产回读；官方微信权限配置已应用security.msgSecCheck。条例事务控制记录顺序读取，实际微信GET连续3/3 PASS；读请求只在瞬时SERVICE_UNAVAILABLE/null时重试一次，不自动重试ACCEPT。生产控制开关保持暂停，条款接受后的持久重入队与真实非空bridge仍未验证。当前固定工具链通过corepack pnpm调用；冻结旧构建器/候选仅供历史复现，不能重建覆盖旧证据或恢复旧分享选择API。详见当前独立报告。下方旧GET证明/政策/设备接点描述为修复前历史。

## 2026-10-03 TASK22 分享接点补齐与现行约束（历史；生产状态与实现以本页顶部为准）

授权队列每次实际批次至多20项，串行后续触发，共享同批触发但重新读取核验状态；未授权项队尾轮转并持久保存。直接上传先持久意图再写本地显示缓存；刷新云端记录后重试只处理已有意图，不由历史读取推导SHARE。production-map-service的通用选择接口已改为private上传接收实现，仅写SHARE/rights，不提供产品“是否发布”操作。

现有SHARE回执增加严格证明门：termsVersion/scopeDigest必须与当前v2一致，rightsAttested/followCurrentVersion为true。现有生产GET只返回shareIntent/fingerprint，尚不能给此证明；缺字段时不确认旧授权。恢复需最小服务端响应适配及适用授权更新，不能放宽此门。

设备队列保留重启重试能力，但服务器在上传时接收意图的接点仍未完成，不能宣称用户关闭后自动授权已保证。v2正式政策、非空worker运输与真实marker仍在原暂停任务；此次cloud写0，冻结runtime/ZIP不改。

防回退门scripts/validate-upload-sharing-flow.mjs由工作流校验自动运行：扫描正式客户端旧UI／事件／通用选择接口、要求全局当前入口引用UPLOAD_CONFIRMATION_MAP_SHARING_V2。1213 PASS/1既有SKIP、页面26/26，Lint/types/构建及其它最终证据见artifacts/task22/phase2-sharing-audit。

## 2026-10-03 TASK22 Phase2 上传时分享授权（本地修订）

既有两条上传路径记录本条分享意图：辅助抽赏在实际确认赏票上传时记录，直接上传在原确认上传取得真实recordId后记录；不增加V1请求字段、不修改云函数。ProductionContributionService以当前正式consent及服务端读取上传分享状态返回的可信fingerprint自动调用现有SET_INITIAL_CHOICE(SHARE, rightsAttested=true)，不把本地队列当服务端授权。私有退出/继续抽赏/旧历史遍历不产生授权，已有DO_NOT_SHARE不覆盖。

新增map-upload-sharing.ts保存版本/scope隔离的显式上传意图，最多250条，每次flush最多20条、并发合并、写入失败保留重试；核验未完成、未同意当前条例或服务不可用时待恢复。onShow、同意条例后、实际上传完成和核验完成均重试。服务端确认接收分享后成功弹窗显示“本条记录已提交地图，核验通过后会自动展示”；没有回执显示同步待恢复，公共可见性不由本地确认推断。

本次正文修订形成map-contribution-20261003-v2与新scope候选，独立保存artifacts/task22/phase2-sharing-flow/formal-policy-candidate.json，LOCAL_CANDIDATE_NOT_APPLIED。production旧v1条例未改，客户端严格版本匹配；正式条例真实微信入口尚待TASK22恢复验证，不能称生产条例已可用。0.001°网格/accuracy≤100m公开位置policy不变。

验证：1193 PASS+1既有SKIP、Next构建、Playwright26/26及官方WXML编译通过。UI截图采用隔离的微信开发者工具预览，原始WXML/WXSS/初始data来自当前源码、仅注入演示状态、无cloud对象和请求，不能替代真机授权或真实地图桥接验证。此次cloud写入/真实迁移/Git提交推送0，production桥接仍在用户指定断点暂停。

## 2026-10-03 TASK22 Phase2 production 应用

正式public-location policy参数经Founder确认：APPROXIMATE / gridDegrees=0.001 / maxAccuracyMeters=100，版本化写入mapSourceBridgeControl，初始仍关闭。Phase2 cloud apply采用冻结资源批次和7候选ZIP；4 V1按各自真实远端基线最小UPDATE_CODE，保留原配置/密钥/layers/triggers。真实SDK事务、并发及平台timer来源必须实际验证后开启continuous bridge；历史先只读preview并另批具体小批量。

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

## 2026-10-03 TASK22 Phase1-D4｜9/9部署、回读与关闭态验收完成（当前权威状态）

Founder《自主解决部署问题直到9函数全部完成总命令》已执行完毕。9/9 production functions Active，最终9/9 source/config回读PASS，每个17个批准文件逐SHA一致，20/20 logical secret bindings READY/BOUND，9/9 disabled smoke SERVICE_UNAVAILABLE / InvokeResult0。官方Manager5.9.0高层→TCB CreateFunction/EnvId；补齐PublicNetConfig={PublicNetStatus:ENABLE,EipConfig:{EipStatus:DISABLE}}，普通公网保留、固定EIP关闭。业务源码/9ZIP/proposal/manifest/batch及SHA均未改；平台安装依赖与下载包CodeSha一致，批准应用文件全部一致。

本轮accepted CREATE9/rejected0/CREATE retry0/UpdateCode0/UpdateConfig0/Delete0，20bindings随创建完成；invoke11（初次smoke本地字段误判1、只读结构诊断1、恢复后9个正式验证）。旧执行器检查不存在的RetCode，已确认实际InvokeResult并修正；首函数业务响应一直正确。恢复只在内存读取本轮首函数现有binding，2把新key各仅生成一次，不重新生成/轮换。旧IDENTITY及13V1消费者一致/未改，Founder RISK_ACCEPTED_BY_FOUNDER / SECRET_UNCHANGED / ROTATION_WAIVED不变。

最终postflight 2026-10-03T06:54:54.037Z / 118只读回执PASS：production14集合/23explicit nonTTL/14ADMINONLY、13业务集合全部0、controls4完整不变/read-stoptrue/featuresfalse/HApausedtrue/epoch1/PUBLIC0；V1 STRUCTURAL_DIFF0、shadow UNCHANGED/SAFE_STOP/read-stoptrue/HApausedtrue/epoch41/PUBLIC0/flagsfalse/callers空，Storage/rules/环境结构不变。9函数ENABLED=false。实际secret值及编码变体扫描项目source/artifacts/docs/memory-bank/完整Git diff，落盘0；1176受保护输入最终drift0。离线ABI验证曾重写历史Node版本字段，已精确恢复会话前SHA，本轮结果另存，不留历史证据漂移。

本地Manager9包/5类脱敏/8护栏检查、artifact9、dry-run6、SDK ABI、全量1140PASS+1既有SKIP、Next构建、Playwright26/26、workflow/diff-check均PASS。没有操作浏览器UI或真机，不宣称生产客户端、桥接或正式发布验收。Git commit/push0。

TASK22=IN_PROGRESS / PHASE1_D_COMPLETE / PRODUCTION_DISABLED / PHASE2_LOCKED；V2-E仍唯一活动区块。当前授权工作集全部完成；Phase2/continuous bridge/historical migration/NETWORK/XHS/上海50/全国300/client release/正式微信发布保持LOCKED，等待下一条明确指令，不自动解锁。独立报告：docs/delivery/v2-e-task-22-phase1d4-production-functions-final-deploy-closeout.md；机器证据：artifacts/task22/phase1d4-final。下一步建议Founder审阅收口后明确授权Phase2，再执行该Phase认知对齐；9函数部署gate已通过，不把TASK22整体标COMPLETE。

以下旧STOP/未部署/secret另批文字均为被本轮执行承接的历史，不覆盖本段。

平台认知：SDK publicNetConfig递归PascalCase转换可传嵌套EipConfig，diskSize未透传但远端512默认吻合；TCB/SCF不同API响应字段应以真实回执判定。仅限部署适配，不扩大后续Phase技术范围。

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

无技术栈或平台变更。使用原bundled SDK进行dummy-only离线HTTP边界检查；未升级SDK/切换COS/改secret或cloud config。公开SDK能力与本环境成功验证分开记录。

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

继续NoSQL与现有single-key V1身份namespace；两个production-only key为冻结合同required但未提供批准来源，本轮不选择替代secret、不变更runtime/config、不重打包。

## 2026-10-02 TASK22 Phase1-C｜剩余 Production 资源 APPLIED / READBACK_PASS（当前权威状态）

Founder明确授权执行Phase1-C总命令，按冻结production proposal SHA `0940d1b322566c11df46898994a87c8effea5b1fa79a261711a44eec2a345f41`派生本轮batch SHA `3ec4a6431151789261a3161216caa44193814cf9387d370f23596bcb83cfb918`；13 collection CREATE / 13 ADMINONLY SET / 22 explicit non-TTL index CREATE串行成功，48次外部写调用，0写重试/0partial apply。每个目标创建前再次确认不存在，ACL/index/Count0即时回读通过后才进入下一个集合；117次完整postflight实际结构diff0。正常V1 Count/Size增长仅记录，无异常删除/清空。

`PHASE1_C_REMAINING_PRODUCTION_RESOURCES=APPLIED / READBACK_PASS`；`PRODUCTION_COLLECTIONS=14/14 APPLIED`、`PRODUCTION_EXPLICIT_INDEXES=23/23 APPLIED`、全部14集合ADMINONLY（本轮13/13），13业务集合全部Count0。mapControlState仍只4冻结control rows且完整字段未变，原kind_expiry非TTL索引不变；生产read-stop=true/所有flagsfalse/haPausedtrue/epoch1/PUBLIC0，production services enabled=false / NOT_ACTIVE。本轮22显式索引之外平台自动_id_/_openid_1只记录、不计入、不删除。

V1 13集合/43既有基线索引/13ACL/19完整stable configs及全部27既有集合/28既有函数、layers/triggers/Storage根与rules/env函数rules不变；`V1_STRUCTURAL_DIFF=0`。shadow read-stop=true / HA pause=true / epoch41 / PUBLIC0 / 9函数flagsfalse / tester allowlists空。production functions=0/9 DEPLOYED；无secret/control row/业务/身份写、无V1或shadow变更、无服务开启、无Git/微信发布。本轮新报告仅保存完整config与既有基线匹配的布尔结果，不输出真实secret或新增真实key摘要。

Phase1-B `RISK_ACCEPTED_BY_FOUNDER / SECRET_UNCHANGED / ROTATION_WAIVED`、rotation blocker CLOSED_BY_FOUNDER_WAIVER持续；暴露事件CONFIRMED / NOT_REMEDIATED，继续旧密钥，不实施dual-key/lazy migration/alias/历史身份迁移，不改wechatIdentities或V1身份语义。

当前活动区块V2-E / IN_PROGRESS、唯一工作集TASK22 Phase1；总体门仍 `IN_PROGRESS / PHASE_1_PRODUCTION_BACKEND_CONVERGENCE_IMPLEMENTED / LOCAL_GATES_PASS / EXTERNAL_ACTION_APPROVAL_REQUIRED`。Phase1-A与Phase1-C批次授权均已消费，禁止重跑/覆盖。下一建议Phase1-D｜9 Production Functions Deploy + Disabled-State Read-back/Smoke，尚未授权；本轮停止，不写Phase1/TASK22 COMPLETE/HUMAN_APPROVED/PRODUCTION ACTIVE，Phase2/NETWORK/50/300仍LOCKED/NOT_STARTED。

自动验证PASS：production artifact 9包、resource/schema/API contract 6项、batch与live resource exact-match、workflow、diff-check及836受保护文件检查；仅四份事实源变更，生产源/设计/历史报告/冻结产物不变，Phase1-A四行SHA匹配。未重跑full Vitest/Playwright或业务正向测试。

独立报告：[v2-e-task-22-phase1c-remaining-production-resources-apply-readback.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1c-remaining-production-resources-apply-readback.md>)；batch：[phase1-c-remaining-collections-indexes-batch.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1c/phase1-c-remaining-collections-indexes-batch.json>)；执行与回查：[execution-summary.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1c/execution-summary.json>)。下方dated未应用/13资源待批状态均为此前历史，以本节为准；历史报告原文不改写。

production资源后端仍为NoSQL，全部ADMINONLY/SERVER_ONLY、显式索引non-TTL，无新增技术或secret binding。空资源read-back只证明配置到位，不代替live SDK事务/并发/费用/业务验收。

## 2026-10-02 TASK22 Phase1-B｜Founder 风险接受与轮换豁免（当前权威状态）

授权来源是 Founder 在本会话中的明确决策及随后继续指令，覆盖此前 Phase1-B 附件要求的轮换路线。记录 `RISK_ACCEPTED_BY_FOUNDER / SECRET_UNCHANGED / ROTATION_WAIVED`；`IDENTITY_HMAC_KEY_TOOL_OUTPUT_EXPOSURE=CONFIRMED`、`OLD_KEY_STILL_ACTIVE=true`、`SECURITY_INCIDENT_REMEDIATED=false`。本次明文输出的风险已由 Founder 接受，安全事件没有修复；不重述密钥值，不把风险接受写成技术修复或安全验证通过。

停止 IDENTITY_HMAC_KEY 轮换方案，继续使用当前旧密钥；dual-key、lazy migration、identity alias、历史身份迁移均不实施，不为此创建新 Account，不修改 wechatIdentities schema/index，不改变 V1 身份语义。Phase1-B rotation blocker=`CLOSED_BY_FOUNDER_WAIVER`；此前 `IDENTITY_ROTATION_OFFLINE_EXIT_POLICY_DECISION_REQUIRED` 已由本决策替代，不再阻塞 Phase1。Phase1-B compatibility implementation 仍为 NOT_IMPLEMENTED，历史分析不构成可执行候选。

TASK22 恢复正常 Phase1 路线：`IN_PROGRESS / PHASE_1_PRODUCTION_BACKEND_CONVERGENCE_IMPLEMENTED / LOCAL_GATES_PASS / EXTERNAL_ACTION_APPROVAL_REQUIRED`；这里 LOCAL_GATES_PASS 仅沿用此前 Phase1 本地实现的验证结论。Phase1-A=`CONTROL_ONLY_APPLIED_READBACK_PASS`，其冻结批次授权已消费，禁止重跑或覆盖；其余 13 个 production 集合和 9 个 production 函数未应用/部署，`PRODUCTION_NOT_ACTIVE`，Phase2/NETWORK/50条采集仍未开始且锁定。本决策只授权本地治理收口，不新增 CloudBase 写入、secret 变更、函数部署或服务开启权限。

独立决策报告：[v2-e-task-22-phase1b-founder-risk-acceptance-closeout.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1b-founder-risk-acceptance-closeout.md>)。下方同日 STOP、待决策和 ROTATION_REMEDIATION=IN_PROGRESS 均为本决策前历史记录，不覆盖本节。

当前技术选择继续采用既有单 IDENTITY_HMAC_KEY。PREVIOUS_KEY_SUPPORT=NOT_IMPLEMENTED；NEW_KEY=NOT_GENERATED。Phase1-B 兼容草案、fixture 可行性脚本与 analysis manifest 仅留作历史审计，不能作为部署、绑定 secret 或迁移输入。

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

9Nodejs20.19EventFunctions、SDK4.0.2精确（offlineABI依赖node-sdk3.17.2/database1.4.3）、memory256MB/init65s/disk512MB/installDependency=true/no trigger/no layer；14ADMINONLYcollections/23显式非TTLindexes，自动索引待live确认。productionauthority/cursor两个独立>=32bytesecret仅提案，复用精确V1IDENTITY_HMAC_KEY不旋转，生成/绑定0。
ES2022NodeNext编译冻结core，fixedmtime/chmod/sortedzip-X独立包，source与unziphash/两次构建一致。平台安装SDK后整包SHA不同于上传ZIP，后续entry/files反向核验。Node20.19.5离线真实SDKABI，非liveDB验收。transactiondoc-only95预算/快照及自身写cache/共同revision；ratequery30/detail60/others30每分钟、固定key；cursor120s/Account/epoch绑定、128slots。
四control初始化read-stoptrue/epoch1/revision0/flagsfalse/HApausedtrue/termsnull/HAnull/publicAvatarOrigins[]/PUBLIC0。Opportunity保持approved20260930；Freshness1h/1d与HAmost-recent-unique-v1待审候选，未生产绑定或批准测量。客户端candidate/releasefailclosed，Phase2bridge/NETWORKv4/30d/正式client未开始。

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

### 当前生产技术规划与待实现边界

复用已测试domain source code，不提升shadow synthetic/rehearsal rows或临时authority；Phase 1逐项分类production function/collection、testing-only资源、ACL/index/config/secret、durable rate、read-stop与rollback，形成exact diff/artifact/SHA及apply后read-back方案。生产身份复用V1 trusted WeChat Account/Profile，NETWORK curator authority为独立可信server port，不能伪造普通用户；公开read仍需trusted silent Account，无Profile完成门。

保留D09 materialized public-safe core + request-time envelope及server-only查询，禁止请求时join private Source/Verification/Rights/Profile/evidence。新增continuous bridge处理历史逐记录eligible与未来成功upload/draw，以及delete/current/version传播；重跑/断点/rollback/hide-first和tombstone同源，不bulk-public历史。

现有types/source-adapters仍有PLAYER owner/path字段假设，projector/public-api/client parser仍接受旧“网络来源”；它们是TASK22的versioned NETWORK variant/serving compatibility实现缺口，非已经支持OFFICIAL_CURATED。30d必须是独立public visibility policy，query/detail/cursor/cache不能靠includeLowFreshness绕过；用injected/asOf clock、policyVersion验证临界点，保留history与实例独立support，时间basis缺失fail closed，不伪造观察时间。50条前为provisional可测试contract，50条整体验收PASS后才最终冻结再扩展300。

Codex Skill/workflow规划collect/review/publish，候选证据本地留档，publish输入必须绑定Founder明确reviewDecision/reviewVersion/reviewedAt及最终大赏集合。无CMS、无本轮Skill创建或自动化设置。生产UI标签和图标需版本化适配；public board/evidence images仍禁止，review screenshots为本地私有审核材料。

> 以下为既有阶段记录；状态以本文件上方2026-10-02当前决策与当前正式章节为准，历史结论不回填。

2026-10-01 最终人工收口：Founder最后真实微信query/detail检查反馈“符合预期”，随后明确“测试全部关闭，V2-21 全部结束人工验收通过”。TASK-V2-21 = COMPLETE / HUMAN_APPROVED / PRE_PILOT_CLOSURE_PASS / TESTS_CLOSED，完成范围为本轮已授权Pre-Pilot与举报修复真机工作集；UPLOAD_ONLY_AND_REPORTING_PRE_PILOT_CLOSURE=PASS。全部9函数Active且flag=false/caller allowlist空、完整关闭配置回读一致，read-stop=true/HA pause=true/read-epoch41/PUBLIC0，12authority accountActive=false且过期。唯一report输入ZIP SHA 9a9a96a14e3ed314bae6147094fa26539f055239bf6c185039a79253c0c5c6cd未变，16/16 source/config部署回读PASS、远端归档ea132及其它8函数代码SHA最终匹配。真实Founder A举报→取消→再举报→再取消、紧凑按钮灰色已举报/再次点击和状态条取消联动、7请求幂等均PASS（新增AUDIT3/duplicate1，同actionId replay无额外审计，最终CANCELLED/count0）。本轮10合成合格主体9 PUBLIC→10 HIDDEN/唯一AUTO_HIDE，取消count9仍隐藏；迟到sequence2保持原10秒配置，首次超时后一次重试APPLIED/MODERATION_HIDDEN；最后真实query items=[]/detail LEAD_UNAVAILABLE，全部不复活。最终ledger71（22 STATE/3 TARGET/46 AUDIT）保留；20公开响应PRIVATE_LEAKAGE0，49项云端V1与149本地保护文件diff0，P0=0/P1=0。完整回归1096 PASS/1既有SKIP、Lint/双TS/合同/Next/9包validator PASS，最终Web26/26 PASS。Device B/低端及未补齐设备元信息仍EVIDENCE_GAP；CLOSED_PILOT=NOT_RUN/PILOT_PROTOCOL_APPROVAL_REQUIRED、RC=NOT_APPROVED，TASK22=LOCKED/NOT_STARTED，不开启新窗口/发布/commit/push。正式报告docs/delivery/v2-e-task-21-pre-pilot-final-closure.md与独立修复报告v2-e-task-21-report-tcb-context-repair-deploy-closure.md；以下阶段记录均为历史，不能覆盖本段最终状态。

2026-10-01 Founder回复“OK 5 项测试通过”：举报按钮紧凑靠右、灰色已举报与再次点击/状态条取消联动真机PASS。云记录核对可信WXContext Founder A、CANCELLED/active=false/distinct count0、10条交替REPORT/CANCEL审计及18条公开成功响应无私有字段。当前暂停正式地图窗口后继续既有部署授权的真实幂等：隔离6文件一次性miniapp仅调用唯一report函数，7请求包含同actionId重放和新actionId重复，预期新audit3/duplicate1/count0；不进入正式应用、不改后端/资源定义。仅为Founder A开report最小窗口，rehearsal=false，其余8函数关闭/caller空、HA pause=true，E唯一PUBLIC1保留后续threshold；真实幂等及本轮9→10/最终safe-stop/full V1尚待，不记总门PASS。TASK21 IN_PROGRESS / PRE_PILOT_CLOSURE，TASK22 LOCKED；下方窗口和待UI验收文字为历史。

2026-10-01 举报按钮局部修复LOCAL_VERIFIED/AWAITING_FOUNDER_DEVICE_REVIEW：两处详情模板补传mapReportActive/mapReportBusy；举报按钮靠右按图标/文字+左右8px自适应、已举报灰暗含图标并显示“已举报”、按钮再次点击与状态条取消均共用既有cancel。48定向、1069全量+1skip、Lint/双TS/contracts/workflow/Next PASS；Web25/26，保留已接受的V1草稿左滑删除flake，149个V1保护文件hash0diff；正式preview1012639bytes。冻结report ZIP9a9与runtime源码未变，已部署16/16 source/config/SHA PASS。仅为Founder A重开query/detail/report最小窗口、rehearsal=false、其它6函数flag=false/caller空、HA pause=true/read-epoch34；仅正式合成投影测试E 举报按钮PUBLIC1，旧D及旧退休/threshold-hidden均未恢复。等待A新版按钮四命令复测，再完成真实幂等与本轮threshold/最终safe-stop/full V1；不提前记总门PASS/P1清零，不启动TASK22。独立报告docs/delivery/v2-e-task-21-report-button-state-and-width.md及report-tcb-context-repair-deploy-closure.md。以下阶段记录为历史，当前测试窗口以本段为准。

2026-10-01 当前活动区块V2-E、唯一工作集TASK21。Founder已批准并部署唯一report函数tcbContext冻结包SHA 9a9a96a14e3ed314bae6147094fa26539f055239bf6c185039a79253c0c5c6cd；远端16/16 source/config/SHA read-back通过，其它函数代码不变。真实微信已观测REPORT→CANCEL_REPORT→REPORT→CANCEL_REPORT均成功、trusted WXContext为Founder A、最终CANCELLED/count0；Founder明确确认D第一组通过，但反馈按钮状态和宽度。该前端补充由Founder另行明确授权：详情右侧举报按钮按图标+文字+少量内边距自适应宽度，不拉长；已举报时灰暗并显示“已举报”，再次点击或状态条取消均恢复亮色“举报”，在途禁用。当前模板漏传mapReportActive/mapReportBusy，控制器已有正确共享状态和命令；只修两处模板传参与局部WXSS，不扩大云函数冻结diff。已暂停真机窗口：所有相关flag=false/caller空，read-stop=true/HA pause=true/epoch33，Founder authority失效，D临时HIDDEN，按正确lifecycleState=PUBLIC核对PUBLIC0。真实幂等、新版按钮复测及本轮threshold/auto-hide/no-resurrection尚待完成；总closure仍IN_PROGRESS，不记P1清零/整体PASS，TASK22 LOCKED。历史未部署文字以下保留为当时记录，以本段为最新状态。

2026-10-01 TASK21唯一tcbContext修复已获本地构建授权并冻结验证：业务校验前同时剥离userInfo/tcbContext，身份仅可信getWXContext，其它未知字段仍拒绝；举报产品规则、资格/count/audit/幂等/threshold=10与不可自动复活语义不变。独立ZIP SHA 9a9a96a14e3ed314bae6147094fa26539f055239bf6c185039a79253c0c5c6cd，定向50/实际包34/全量1068+1skip等PASS。仅本函数runtime变更，本轮CloudBase部署和管理写入0，当前LOCAL_VERIFIED_FROZEN_NOT_DEPLOYED_STOPPED；未把本地修复当新真机PASS，P1仍1、closure NOT_PASS、TASK22锁定。详见docs/delivery/v2-e-task-21-report-tcb-context-repair-build-validation.md。

2026-10-01 TASK21单次结构诊断已完成：Founder明确批准b10054298bfc04d81318935750084675b3876dc82ec689b325911f3818908962，仅更新report；远端16/16源码与配置PASS、其它8函数SHA不变、资源新增0。独立检测预览只发1次GET_STATE，真实请求f52f2d7b-5ef9-4983-b8e5-1005ca5351c0为BUSINESS_FIELDS/额外键tcbContext，三个业务格式条件均true，Founder反馈读取invalid_request，当前共同入口拒绝根因已确认。取得日志后立即关闭；最终9函数全部flag=false/caller空、read-stop=true/HA pause=true/read-epoch31/PUBLIC0，12authority失效，24ledger结构/active不变且B=0，SAFE_STOP=PASS。再次49项云V1与149本地文件0diff、PRIVATE_LEAKAGE0；P1仍1，真实举报/取消链未通过。拟议修复仅将tcbContext与userInfo一并剥离，不信任字段内容；超出诊断授权，已STOP提交新的拟议exact diff，未改源码/构建/部署修复。已有仅上传/完整气泡/刷新/C隐藏消费和无影响threshold PASS保留。独立报告docs/delivery/v2-e-task-21-report-structure-diagnostic-result.md；建议docs/delivery/v2-e-task-21-report-tcb-context-repair-exact-diff.md。总门NOT_PASS / REPORT_ROOT_CAUSE_CONFIRMED_REPAIR_REQUIRED，TASK21 IN_PROGRESS / PRE_PILOT_CLOSURE，TASK22 LOCKED，不开启Pilot/commit/push。

以下记录保留先前阶段事实；本轮诊断状态以上段为准。

2026-10-01 TASK21批准的单一report envelope修复已部署，ZIP SHA cd4c6366c4a659a978452a91a0b88b391f24e4bbc09f3db1baba49a7d9dada25一致，远端16/16文件与配置核对PASS，其余8函数代码SHA未变，资源新增0。Founder A对独立B举报仍显示“举报失败请重试”，两次真实请求INVALID_REQUEST、B ledger0，P1=1，后续取消/再举报/再取消STOP，不扩大授权。原userInfo冲突为局部复现原因，不再认定完整根因。既有仅上传mandatory筛选/有序自适应粉色气泡/刷新状态条/C threshold及隐藏消费PASS无影响保留。最终9函数flag=false/caller空、read-stop=true/HA pause=true/read-epoch31/PUBLIC0，12authority失效、原24ledger保留、新B退役；SAFE_STOP PASS；49项最终云V1比对及149个本地文件hash均0diff，5条本轮真实公开响应PRIVATE_LEAKAGE0。UPLOAD_ONLY_AND_REPORTING_PRE_PILOT_CLOSURE=NOT_PASS / REPORT_REPAIR_TRUE_DEVICE_FAILED；TASK21 IN_PROGRESS / PRE_PILOT_CLOSURE / REPORT_REPAIR_TRUE_DEVICE_FAILED；TASK22 LOCKED。部署/SHA通过不等于真机链通过，P0/P1/P2/P3=0/1/1/0。独立报告docs/delivery/v2-e-task-21-report-envelope-repair-true-device-retest.md与更新后的pre-pilot-final-closure为最新事实，不开启Pilot、不commit/push。

2026-09-30 Founder新总命令授权TASK21最终Pre-Pilot exact Apply及仅上传/举报真机与threshold rehearsal：仅1 ledger/2非unique非TTL索引/1新函数+3既有函数替换/0新secret，所有入口默认关闭；三组明确synthetic lineage、受信Founder A与10合成report principals、最后safe stop/full V1 diff，独立四报告。只闭合Pre-Pilot；TASK22锁定、不得TASK21整体HUMAN_APPROVED/FROZEN/RC/Pilot启动。执行前冻结包/回滚包SHA一致，V1完整基线0diff与8函数关闭/epoch25/PUBLIC0回读已通过。当前PHASE_A_APPLY_IN_PROGRESS，真机结果待Founder。

## 2026-09-30 TASK21 report candidate 技术补充

继续WX原生map/Canvas PNG/TypeScript/Vitest/既有CloudBase Nodejs20.19 + wx-server-sdk4.0.2，无新dependency。举报权威来自server WXContext principal + ADMINONLY ReporterAuthority（不读V1 private account），server-signed capability仅独立synthetic rehearsal；10 distinct active eligible冻结policy v2-21-report-policy-1。新ADMINONLY moderation ledger保存report/current active aggregate/policy audit，CloudBase transaction原子hide/instance latch/epoch。report/cancel既有global stop+flag+allowlist+30/min/account shared rate fail closed；新secret=0，只拟绑定现有shadow principal/rehearsal HMAC。所有新collection/index/function/config/data actions待Founder external approval，当前本地候选与云只读，不是真实pilot。


2026-09-30 当前TASK21技术差量：无平台/资源类别/SDK变更。Nodejs20.19 / wx-server-sdk4.0.2 / 原8shadow函数保持；规则权威在server，public-map-v3 wire只透传五状态及reason/policy/evaluatedAt。共享opportunity-policy配置可选完整JSON必须同版不可变、版本变化 coordinated projector/query/detail；readers拒绝superseded policy，更新须停机重投影后协调恢复。客户端仅映射文案，未知不反推低。微信network API只作离线提示，不参与资格；地图状态native截图必须区分模拟器与真机；localUI运行依赖miniprogram-automator0.12.1仅安装临时目录，不加工程dependency。详情读并行保留stop/epoch双侧核验，无新增缓存、request-time private join或冷启动阈值。尚未部署。

## 2026-09-30 TASK21 最终 Opportunity 规则（Founder 已决定）

当前工作集为 TASK21 Pre-Pilot，规则门已通过，继续本地实现；TASK22 仍锁定。五状态独立可并存，不统一评分。R=所有赏级当前 remaining 合计；G=V1 上传中用户选择的 isGrandPrize 集合当前 remaining 合计。任何必要项 null 保留 unknown；空大赏集合不假定为已确认零。首版 LAST_CHANCE：R≤12；GRAND_PRIZE_REMAINS：G≥3；GRAND_PRIZE_RATIO：R>0 且 G/R≥8%；SPLIT_SET（刚刚拆套）：R≥60，覆盖此前 initialTotal/85% 延后方案。LOW_OPPORTUNITY：已知 R>12 且（G=0 或有效 G/R≤3%），以及必要事实完整但没有命中任何正向状态时的默认状态。最新 Founder 的“未命中标签就等于低机会信息”覆盖此前禁止完整事实无标签回落的限制；缺失数据不得产生低机会。主状态顺序 LAST > 密度 > 存量 > 拆套 > 低。所有阈值进入版本化可调 policy。年龄不改变 Opportunity，Freshness 独立。

低机会可上图并可筛选；各 source/current、verification、授权、rights、位置、moderation、删除和安全门仍独立成立。移除公开 HIGH/MEDIUM/LOW/INSUFFICIENT，更新为 public-map-v3 的 primaryStatus（unknown 为 null）、reasonCodes、policyVersion、evaluatedAt；不从 leadId 或 synthetic alias 推状态。信息不足不反推低机会，已有独立公开门保持。旧 serving 合同不能静默转换成新结果。


2026-09-28 TASK-V2-19 多贡献者／上传 lineage 技术合同修订：本地候选新增 `v2ShadowCandidateUploads` 与 `v2ShadowContributionLedger`（均拟 `ADMINONLY / SERVER_ONLY`），由独立 `v2-shadow-submit-candidate-upload` 在可信 `getWXContext()` 主体和 synthetic fixture 核验后以新 shadow-only HMAC 签发 `candidateRecordRef`，再由 resolver、HA、projector 共享同一 observation/version lineage。贡献 ledger 以每条 upload 为权威，多个 ACTIVE+eligible+SHARE 贡献可共同支撑一个 BoardInstance/PublicMapLead；删除仅 tombstone 本人 upload/contribution，重投影保留其他人，最后一人删除才 hide/retire。`v2-shadow-manage-contribution` 只提供本人列表与删除；不再使用单 owner、`ACCEPT/WITHDRAW` 或第二次地图授权。候选七包与精确资源合同见 `docs/delivery/v2-e-task-19-candidate-resource-exact-diff-v2.md`，全部仅本地，CloudBase mutation=0；下方旧 ContributionAuthority 段落只记载已作废历史提案。

2026-09-28 TASK-V2-19 candidate runtime 技术选择：小程序适配器仅在 `envVersion=develop|trial` 使用 `wx.cloud.callFunction`，固定函数名并校验 public schema/opaque ID/不含 private 字段；release/未知版本拒绝调用。HA 的候选 record/version reference 由 shadow get-my 服务端从 synthetic observation 派生，可信 APPID/OPENID 仅由函数 `getWXContext()` 获取并用既有 shadow principal HMAC 派生 digest。拟议的贡献授权持久化独立 `v2ShadowContributionAuthority`，`ADMINONLY`；新增函数 config 默认关闭、caller allowlist 空，禁止 V1 private join。当前仅本地代码/zip，CloudBase 六函数和配置未改。

2026-09-27 TASK-V2-19 Phase B2-R1 本地候选技术边界：六个 `v2-shadow-*` replacement 使用 Nodejs20.19／`wx-server-sdk@4.0.2`，运行时调用 `cloud.getWXContext()` 获取小程序 `APPID/OPENID`，server-side HMAC 派生 opaque 测试主体；管理端无该上下文时 fail closed。独立 rehearsal HMAC 验签、事务 nonce 防重放，独立 cursor HMAC 签名；三把 shadow-only key 不进源码/日志。CloudBase `runTransaction` 仅固定 doc ID 读写，GEO 以 `Geo.Polygon([Geo.LineString])` 查询再做 bbox 精检。reference TypeScript 由本地打包脚本编译为 zip 内 ESM core，六函数 CommonJS `index.main` 异步加载；不引入 V1 deploy manifest。此为未部署候选，远端仍 B1 旧包、四 flag=false；B2-R2 需另获授权并验证真实上下文／事务／GEO 能力。HA cooldown/budget 只作 candidate test mechanism，数值 `PILOT_CALIBRATION_REQUIRED`。

2026-09-25 TASK-V2-19 Founder candidate 隔离决策：采用现有 CloudBase `cloud1-d7gxqfwv783a1f131`（`ap-shanghai`）内**仅新增、前缀隔离的 V2 shadow resources**作为 candidate isolation boundary，不新建第二环境。此为技术边界选择，非资源创建／部署授权。V1 的13个 collection、19个线上函数、既有索引、Storage/ACL、环境级规则、配置、密钥、触发器和业务文档均为 frozen production boundary；候选演练只用明确生成的 synthetic 数据。拟议的物理资源和函数级默认关闭配置见 `docs/delivery/v2-e-task-19-shadow-resource-diff.md`；独立本地 proposal JSON 不进入 V1 deploy manifest。现有个人版不是资源点计费模式，shadow 与 V1 共享配额，实际套餐余量、计费和物理索引支持仍待只读/授权后读回。任何 CloudBase mutation 均需 Founder 对确切 diff 单独批准，TASK-V2-19 继续 `IN_PROGRESS`。

2026-09-25 TASK-V2-19 本地 Phase A：沿用 TypeScript/Vitest、既有原生微信地图和 `PublicMapClient`，新增轻量 client wire adapter 将服务端公开 contributor `avatar` 显式转换为现有客户端 `avatarUrl`，拒绝非 HTTPS 私有引用；不引入新依赖或 CloudBase 资源。公开缓存只增加 `truncated` 元数据并保留50／500／120秒既有合同。candidate 传输、持久 rate/read-stop、索引、迁移与 rollback 仍待独立授权和远端证据。

2026-09-25 V2-D 收口：Founder 批准 TASK-V2-18 的500容量与分层性能预算，V2-D `COMPLETE / HUMAN_APPROVED`，V2-E `READY / NOT_STARTED`。当前小程序使用原生 `<map>`、Canvas PNG `iconPath`、真实坐标聚合、50条分页／500快照／120秒合同；压测面板与强制 individual override 已移出包体。继续使用 TypeScript、Vitest、Next.js、微信 CLI 和2 MiB源码门，无新增依赖、SDK、CloudBase 部署或资源变更。FPS／内存／PNG磁盘等设备数值及真实账单未被本次批准证明，保留给 V2-20／21。

2026-09-24 TASK-V2-18 500 容量预算：Founder 指定 500 为压力目标，撤回先前约100个可见 individual 的未批准候选；保留原生 `<map>`、正式聚合、Canvas PNG、192项 LRU、每页50条／500 snapshot／120秒合同，不新增 runtime density cap。回归预算按层区分 Node root／cluster CPU、JSON bytes、真机 `setData` 首次稳定代理、逐帧 FPS、包体与成本；完整阈值及证据见 `docs/delivery/v2-d-task-18-performance-budget-500.md`。当前工具不能可靠测 Native/GPU memory、PNG 磁盘或 native paint，不能用 Node proxy 冒充真机结论。

2026-09-24 TASK-V2-18 真机压测准备：使用现有微信开发者工具 CLI 生成单个 develop 预览构建，原生 `<map>`、Canvas PNG `iconPath`、192项 LRU、Vitest 与 2 MiB preflight 不变；无新 runtime 依赖、地图 SDK 或 CloudBase。基准模式只在 `envVersion=develop` 可打开，`wx.reLaunch` 是页面级 `COLD_LIKE`，保留进程级和平台临时文件的不确定性。`setData` callback、缓存与 renderer queue 可量，FPS、Native/GPU memory、真正 native paint 和临时 PNG 目录 bytes 在当前工具链不可可靠自动读取，须真机/DevTools人工补证。

2026-09-24 TASK-V2-18 性能基准补充：沿用 Vitest/Node 与微信开发者工具 CLI，新增手动启用的固定规模基准，不增加生产依赖或地图 SDK。Node 假 2D Canvas 测真实 JS draw 命令和 cache/binding 决策，但不执行微信 raster、PNG 文件导出、原生 `setData` 或 GPU 合成；这些指标及低端真机帧率留给 TASK-V2-20 设备证据。本地 200/300/500 不同 key 重访的192项 LRU 抖动通过复用上一份已提交 binding 的 `iconPath` 消除；产品行为、视觉和批准预算均不因此改变。

2026-09-24 TASK-V2-18 本地证据：继续使用原生微信 `<map>`、Canvas PNG `iconPath`、Vitest、现有 V1 2 MiB preflight 与微信 CLI preview；无新依赖、地图 SDK、服务端部署或共享 response cache。客户端 page 50 对齐 D09 pilot default；聚合历史以 O(n) lead→cluster 映射取代 O(n²) pair Set，500 点本机 split/merge CPU proxy 从约130ms降至约19ms（非真机帧率）。脚本扫描生产主包资产并输出哈希／引用候选清单；正式延迟、帧率与 marker/bytes 预算仍缺已批准阈值。

2026-09-24 TASK-V2-17 Founder 收口：原生微信 `<map>` Marker 的唯一视觉路径为离屏 Canvas PNG → 本地 `iconPath`；五档自适应仍开启，固定 PNG 为其安全回退。旧 CSS `customCallout` 和 `CANVAS_MARKER_ENABLED` 开关已经移除；下方 2026-09-22—24 的相关描述保留为实验历史。Canvas DPR、LRU／latest-wins 队列、真实坐标聚合和 PICKER surface 不变，无新增依赖或地图服务。TASK-V2-18 `READY / NOT_STARTED`。

2026-09-24 TASK-V2-17 收尾：`CANVAS_MARKER_ENABLED=true` 是默认 Marker visual binding，五档 PNG 自适应开关仍开启；固定 PNG 是自适应开关关闭后的安全回退，旧 CSS customCallout 仅保留为独立显式手工回退，待当前版本 iOS／Android 真机通过再评估删除。已无模板引用的 synthetic Marker／烟花 WXSS 删除，临时 zoom trace 默认关闭。PNG 模式的 map gesture begin/end 抑制伴随原生 `markertap`，程序化 camera 不参与。无新增依赖或地图服务。

2026-09-23 TASK-V2-17 弹窗密度与数字：Presenter 输出两位起步的 Marker余量文案；Canvas 对直接输入的个位数字也规范化，使同一视觉状态使用同一 render key。PICKER 标签使用64 logical px等宽胶囊、4px间距，覆盖最长已知标签的54px测量字面宽与8px内边距，并留2px光栅余量；附加标签写入仅PICKER的缓存键。弹窗外壳延续V1，标题副文案采用同排底对齐及窄屏字号调整。不改地图PNG尺寸/DPR/anchor或额外引入运行时依赖。

2026-09-23 TASK-V2-17 选择弹窗视觉修正：列表采用共享 Canvas Renderer 的 PICKER 输出，不再用 CSS 仿画数字与青色背板；Oswald 700 继续使用内置矢量轮廓。列表 PNG 60 logical px 高，宽度按 V1 弹窗可用空间确定；`picker-v1-{width}` 隔离于原地图缓存键，共用 DPR、LRU 与串行队列。异步提交有页面令牌校验，失败保留可选择的文本并提供重试。V1 外壳与关闭 SVG 原样复用，不引入运行时依赖。

2026-09-23 TASK-V2-17 unresolved cluster picker：页面点击层调用纯 `classifyClusterAtMaxScale`，复用既有 `createNativeMapClusterTopology`、真实 GCJ-02 坐标、scale 18 与最大档 PNG footprint，无旧 topology 滞回；不可分组只开普通页面表层 scroll-view，不创建 spiderfy 绑定。分组可拆时沿用 camera expansion。`PublicMapMarkerPresentation` 增加可选 `displayIpTheme` 预览字段，详情 `displayIpTheme` 由 `board.ipName + board.themeName` formatter 得到；synthetic 无主题改为 null。Canvas 只局部升级角标圆／胶囊及 v7 cache key，999 封顶，不改卡体、DPR、anchor 或 renderer queue。20点 fixture 仅测试导入，正式 app 不导入。

2026-09-23 PNG Zoom Adaptive：5个文字宽度档位，scale阈值11.5／13.5／15.5／17.5及0.12滞回；180ms尾随限频，PNG全量就绪后一次提交。footprint随档位同步，anchor以固定尾尖反算，render key仅增加离散视觉档位，不含scale或坐标。沿用LRU并增加串行latest-wins投影准备，过期请求在单张出图后停止；不使用translateMarker或中间PNG。固定PNG开关回退保留。

2026-09-23 TASK-V2-17：Canvas 数字改用随代码打包的 Oswald 700 二次曲线路径及 OFL 许可，替代不可靠的字体名称 fallback；不增加运行时依赖。字体生成器使用离线 fontTools，图片检查直接调用生产 drawMarkerCanvas。DPR 导出与 LRU 队列保持现状，render key v6 隔离旧图片；native anchor 跟随数字区下方尾尖。

## 2026-09-22 TASK-V2-17 Canvas Marker visual v5

- 聚合视觉恢复现有业务逻辑：与普通 Marker 共用实体主体，只绘制红色数量 badge；不使用 Gemini 的 stack 图标或多层聚合背板。
- 青色底板调整为 `(3,10,140,50)`，白卡保持 `(10,7,140,50)`，使底板在左侧露出约 7px、下沿露出约 3px；数字使用 `Oswald 700`、手动 `-0.05em` tracking 和基线下压 2px。
- render key 从 `v4` 升级为 `v5`；Canvas、DPR、anchor、cache、cluster engine、camera 和点击逻辑保持不变。

## 2026-09-22 TASK-V2-17 Canvas Marker visual v4

- `marker-canvas-renderer.ts` 只负责 Canvas visual contract：固定 `160×70` logical px；青色底板位于 `(5,9)`、尺寸 `140×50`，白色主体卡位于 `(10,7)`、尺寸 `140×50`，尾尖中心 `(80,64)`，native anchor `{x:0.5,y:64/70}`。
- 绘制顺序固定为 shadow → cyan backing plate → white foreground card → black number field／cluster stack glyph → title → status pill → foreground tail → cluster count badge；青色不是 border 或装饰线。
- 聚合使用两层灰色叠放背板、stack glyph 和红色数量 badge；普通 Marker 使用接近满高的系统窄体数字。所有元素均在 Canvas 中绘制，不依赖 CSS、DOM、border triangle 或 cover-view。
- 版本 key 从 `v3` 升级到 `v4`，避免旧临时 PNG 与新层级几何混用；renderer queue、LRU、DPR 上限 3、cluster、camera、点击和详情逻辑不变。

## 2026-09-22 TASK-V2-17 Canvas Marker visual v3

- `marker-canvas-renderer.ts` 只负责 Canvas visual contract：固定 `136×66` logical px，主卡 `126×48` 位于 `(5,6)`，底部尖尾基线 `y=54`、尖端 `(68,61)`，透明 padding 让 native anchor 指向尾尖而非卡体角落。
- 导出时把 logical size 乘以设备 DPR（上限 3），native binding 继续消费 logical `width/height` 与 `anchor={x:0.5,y:61/66}`；缩放、拖动和经纬度不进入 PNG 视觉 key。
- 普通与聚合共享同一主体绘制分支。聚合只额外显示完整红色数量角标，不生成多层背板、stack 图形或特殊文案；状态色由 Canvas palette 映射，`split` 使用蓝色系，`last` 为 ICHI 玫红，`grand` 为绿色，`low` 为琥珀，default 为中性灰。
- 版本 key 从 `v2` 升级到 `v3`，避免旧临时 PNG 与新几何混用。仅修改 renderer、binding adapter 的视觉输入和对应测试，不修改 cluster engine、数据、camera、详情或后端。

## 2026-09-22 TASK-V2-17 Canvas Marker visual v2

- `marker-canvas-renderer.ts` 只负责 Canvas visual contract：固定 `176×82` logical px，主卡 `164×56` 位于 `(6,7)`，底部尖尾基线 `y=63`、尖端 `(88,76)`，透明 padding 让 native anchor 指向尾尖而非卡体角落。
- 导出时把 logical size 乘以设备 DPR（上限 3），native binding 继续消费 logical `width/height` 与 `anchor={x:0.5,y:76/82}`；缩放、拖动和经纬度不进入 PNG 视觉 key。
- 普通与聚合使用不同绘制分支。聚合拥有两层偏移背板、stack 图形和数量角标；状态色由 Canvas palette 映射，`split` 使用参考图的蓝色系，`last` 为 ICHI 玫红，`grand` 为绿色，`low` 为琥珀，default 为中性灰。
- 版本 key 从 `v1` 升级到 `v2`，避免旧临时 PNG 与新几何混用。仅修改 renderer、binding adapter 的视觉输入和对应测试，不修改 cluster engine、数据、camera、详情或后端。

## 2026-09-22 TASK-V2-17 详情卡与赏级轨道交互边界

地图详情卡主体使用普通 WXML view + 固定高度/`overflow:hidden`，不使用纵向 scroll-view，避免 Native Map 表层中的整卡上下拖动。局部内容继续按职责隔离：赏级使用微信原生 enhanced 横向 scroll-view 并开启 bounces，presentation 以两行 CSS grid 和动态列数承载未来数量；展开备注保留独立纵向 scroll-view。该实现不新增依赖、地图 SDK、数据字段或后端接口。

## 2026-09-22 TASK-V2-17 Selection dismissal 与 gesture arbitration

- `pages/home/index.ts` 以单一 `dismissNativeMapSelection` 收口空白点击和真实地图手势：同步清除 PublicMapClient detail、详情 shell、普通／Canvas Marker selected visual，并取消进行中的 lead camera tween。
- `regionchange begin` 优先使用微信 `causedBy=gesture|update` 区分用户手势与程序化相机；显式 `gesture` 可抢占 active camera。缺少 `causedBy` 时，现有 animation、pending cluster 与 programmatic gesture session 作为程序化来源保护。
- Marker 后继 surface tap 使用短窗口、单次消费的事件抑制，不再以 900ms 长 guard 或 `OPENING/CAMERA_ANIMATING` 状态阻断真实空白点击。
- 不新增依赖、WXML 节点、地图 SDK、后端字段或 TASK-V2-18 能力；真机仍需验证 iOS／Android 的事件顺序。

## 2026-09-22 TASK-V2-17 Detail/viewport ownership 与 camera easing

- `PublicMapClient` 的 root generation 与 detail selection generation 分离：viewport/query refresh 只替换地图集合状态，不再取消或清空独立的 detail request；显式 `selectLead/clearSelection` 和不可用结果仍是 detail generation 的唯一 owner。
- 普通 Marker camera 不再依赖不暴露 duration/easing 参数的 `MapContext.moveToLocation`。页面用可取消的低频受控中心帧执行确定性 cubic ease-in-out（慢起步、中段快、末段减速），从实际／最近 camera snapshot 插值到 display-only target；每帧只更新中心坐标，不改 scale、Marker binding 或业务坐标。
- camera animation generation、timer 与 programmatic gesture session 保持 page-owned；A→B 取消旧 generation 并从当前中心重基准。动画期间 viewport query debounce 被抑制，最终帧后由稳定 `regionchange` 复用既有 bbox containment gate。
- 不新增运行时依赖、地图 SDK、后端字段或平台分支；真机帧感与触摸仍需 iOS／Android 设备验收。

## 2026-09-22 TASK-V2-17 Canvas Marker 实验技术边界

- 继续使用微信原生 `<map>`、现有 presentation／cluster／camera／detail 链路；`CANVAS_MARKER_ENABLED` 只切换 visual binding，不引入第二地图 SDK、后端字段或数据请求。
- 使用页面内离屏 `type="2d"` Canvas、受限 DPR 与 `wx.canvasToTempFilePath` 生成本地 PNG。逻辑尺寸和尾尖 anchor 固定，Native Map 只接收 `iconPath + width + height + anchor`。
- `marker-canvas-renderer` 负责确定性绘制和导出，`marker-image-cache` 负责 render-key 复用与同 key 并发合并，`marker-binding-adapter` 只把既有 `NativeMapMarkerView` 适配成图片 binding。render key 不含经纬度、scale 或 viewport。
- `CANVAS_MARKER_ENABLED=true` 时不挂载 custom callout，直接观察 native PNG binding；`false` 时完整恢复旧 custom callout。Canvas 生成失败记录 fallback 日志并保留旧 binding 数据，但实验模式不再用 CSS 覆盖失败，便于识别 Canvas 未接通。scale observation、pan sample 和每帧 transition 均不得直接调用 renderer。
- 不增加 runtime dependency。旧 customCallout WXML/WXSS 与 fallback presentation 继续保留；自动门只能证明编译和合同，iOS／Android 真机合成稳定性仍需真实设备验收。

2026-09-22 TASK-V2-17 Marker detail/camera stability（已被上方 Detail/viewport ownership 与 camera easing 修正）：上一版使用 `MapContext.moveToLocation` 和 surface-tap guard；真机回归证明详情闪退的确定性来源是 viewport root query 重置 detail generation，原相机命令也无法提供指定 easing。保留此条作为历史记录，不再作为当前技术合同。

2026-09-22 TASK-V2-17 Native Marker 箭头渲染修正：动态数字、中文、状态与点击仍保留在微信原生 `<map>` 的 custom callout `cover-view` 树中；不把整张 Marker 移到 `iconPath`，因为动态文字与 cluster/selected 状态会要求运行时 Canvas 栅格化、临时文件缓存和新的异步生命周期。真机不稳定的零尺寸 CSS border triangle 改为两个确定性 4× RGBA PNG，由 `cover-image` 显示普通／玫红选中轮廓；卡体仍由 WXML/WXSS 绘制。callout 根节点移除额外 `translate(-50%, -50%)`，只保留 `visualOffsetX/Y`，原生 `anchorX=0 / anchorY=-30` 成为唯一静态定位合同。详情 camera offset 收敛为 0；无新增 runtime dependency、远程资源、Canvas 或平台分支。

2026-09-22 TASK-V2-17 Native Marker hit arbitration and cluster expansion：custom-callout touch cancellation 只有在确认移动后才抑制 native `markertap` fallback，避免平台手势仲裁把静止短按吞掉；详情打开期间的 cluster tap 可抢占 `CAMERA_ANIMATING`，同步清除 PublicMapClient selection 与详情 shell，再用一次无旧拓扑滞回的 expansion target 搜索首个可分离 scale。聚合展开仍复用原生 map camera／cluster engine，不增加第二地图 SDK、Canvas、后端或数据字段。

2026-09-22 TASK-V2-17 Native Marker 字体合同修正：微信开发者工具 WebView 可加载页面 `@font-face` 可变 WOFF2，但 iOS Native Map 的 `customCallout + cover-view` 真机证据出现字体 fallback 与 baseline 差异，因此原生 Marker 不把 webfont 作为跨渲染器依赖。数字限定为系统 `Helvetica Neue / Arial` 并在固定 glyph box 内做确定性 `scaleX`；中文限定为 `PingFang SC` 固定行盒；Badge 使用 border-box + nested glyph box。该选择只作用于 Native Marker，同页其他普通 WebView UI 可继续使用既有 Montserrat/Marker Jakarta。没有新增依赖、远程字体、运行时下载、Canvas rasterization 或平台分支。

## 2026-09-22 TASK-V2-17 Marker interaction optimization

- 继续使用微信原生 `<map>`、custom callout `cover-view` 和透明 1×1 native anchor；不引入第二地图 SDK、Canvas Marker、图片化动态文字或新 runtime dependency。
- 真机一致性通过显式像素合同实现：88×40px 主卡、92×50px shell、30px 数字列、58px文案列、`customCallout.anchorY=-25` 和双层 CSS border triangle。数字使用打包 `Marker Jakarta` 优先、系统 condensed fallback，并通过固定 40px line-height 消除 flex/font baseline 差异。
- Marker 命中使用 cover-view touch 事件的 8px/350ms tap classifier，并保留 native `markertap/callouttap` 作为平台回退；120ms marker-id 去重阻止同一物理点击重复执行。
- 详情定位复用 cluster engine 的 Web Mercator `offsetPublicMapCoordinate`，只计算 camera center，不修改真实坐标或 contract。筛选与状态色仍在现有 presentation/synthetic adapter 层，不新增 schema、CloudBase 或 production adapter。

## 2026-09-21 TASK-V2-17 地图原生层与页面表层边界

- 微信原生 `<map>` 内保留 custom callout Marker 与定位／刷新 `cover-view`；跨原生层交互的控件不得移到普通 sibling。
- 搜索、品牌、筛选、状态、详情卡使用独立的绝对定位 `map-surface-layer` 普通 WXML 表层，`pointer-events:none` 由子控件恢复交互；Bottom Nav 保持页面根级并使用高于地图表层的固定 z-index。
- 启动路由继续由 `parsePublicShareTab` 控制：空 query 默认 `recognize`，只有明确 `tab=map` 的分享／启动参数才进入地图；不通过 UI 层级修复改变分享 deep-link 语义。

## 2026-09-21 TASK-V2-17 Native Map cover-view 配置

- 根项目 `project.config.json` 必须显式保持 `setting.coverView=true`；本机 `project.private.config.json` 不得以 `false` 覆盖该值。
- 地图 custom callout Marker、定位／刷新控件依赖原生 `cover-view` 渲染；关闭该开发工具配置会在真机调试中退化为仅剩 Native Map surface。
- 该配置修复不改变 Marker、cluster、viewport query、Loading phase 或地图生命周期。

## 2026-09-21 TASK-V2-17 地图模块级生命周期

- 原生 `<map>` 只在 `currentView === "map-preview"` 时挂载；识别和“我的”页面不让 Native Map 参与 WebView 同层合成。
- Page 级 `PublicMapClient`、camera/viewport snapshot、stable marker 与查询状态继续复用；切出地图只释放 Native Map context、采样和过渡调度，切回时恢复 snapshot，不重建 Marker 或 cluster。

## 2026-09-21 TASK-V2-17 Viewport Revalidation Phase

- `PublicMapPhase` 新增 `VIEWPORT_REFRESHING`，只表达已进入地图后的 bbox/query 后台刷新；`INITIAL_LOADING` 继续专属于首次无数据加载。
- `VIEWPORT_REFRESHING` 复用现有 TypeScript/Vitest、stable marker snapshot、native transient-empty projection guard 和 WXML 顶部状态 slot，不新增依赖、服务、schema 或平台能力。
- 地图 retained node、MapContext、Marker/cluster/Zoom presentation、public contract、CloudBase 与 TASK-V2-18 均不变。

## 2026-09-21 TASK-V2-17 Zoom Deferred Presentation 调度边界

- `public-map-render-scheduler.ts` 的 Camera state 现在显式区分 `observedScale / settledScale / presentationScale / targetPresentationScale`；原生 `getScale()` 与 `regionchange` 只写 observation，不能直接触发 Marker Projection。
- `public-map-native-presentation.ts` 以纯函数生成 240ms `easeOutCubic` deferred reconcile plan，默认 7 个候选视觉帧；topology unchanged、split、merge 分别固定为零 binding replacement、动画前一次 replacement、动画后一次 replacement。
- `pages/home/index.ts` 继续拥有微信 MapContext、gesture source、generation cancellation 与 `setData` 背压。Pan 通过既有 `regionchange + getScale + getRegion` 判断真实中心移动；programmatic cluster camera 只在 settle 后触发一次 reconcile。提交仍为单在途和 latest-frame-wins，不引入 60fps JS bridge 或 post-zoom timeout refresh。
- 平台、依赖和服务端均无变化：继续使用微信原生 `<map>` / custom callout、TypeScript、Vitest 与现有 CloudBase/public contract；没有新增动画库、后端、集合、查询 schema 或 TASK-V2-18 能力。

## 2026-09-21 TASK-V2-17 Zoom 同步与稳定投影调度

- 新增 `platform/public-map-render-scheduler.ts`，以纯 TypeScript 管理 `targetScale / observedScale / settledScale`、新鲜 region observation 的短期保护，以及 revalidation 期间的 stale-while-revalidate Marker 选择；不新增 runtime dependency。
- 程序化 cluster camera command 先写 target scale；`regionchange`、串行 `getScale()` sampler、post-end settle 和 fallback 分别更新 observed/settled。Presentation 在 `CAMERA_ANIMATING / CLUSTER_TRANSITION` 期间优先 target，其余阶段使用 observed，最终 settle 清除 target。
- `pages/home/index` 对 Native Marker binding 增加 120ms topology commit barrier。内部 projection 可连续计算，但 binding 变化只保留最新 generation；稳定窗口内继续用最后已提交 topology 的 rescaled views 更新连续宽度，settled/IDLE 可立即提交最终 topology。
- query 的 `INITIAL_LOADING / REFRESHING / CURSOR_RECOVERY` 若临时返回 0 个可见 Marker，继续使用上一份稳定 presentation；`LOADED / EMPTY` 终态正常替换。提交层另拒绝 revalidation 期间的 transient empty projection，形成双层保护。
- 诊断日志继续开启，并同时记录 target/observed/settled、projection/topology/barrier generation 与 marker binding commit；cluster engine、public contract、坐标、identity、Info Card 和 TASK-V2-18 不变。

## 2026-09-20 TASK-V2-17 真机渲染调度

- Native marker binding 在 split/merge 中间帧保持稳定，连续运动由 custom callout 的 `transform` 承担；禁止恢复 `toScreenLocation + left/top ghost` 或逐帧经纬度插值。
- 页面使用单在途 `setData`、latest-frame coalescing 和 binding/view 差分签名形成渲染背压；`getScale()` 请求串行化并带 watchdog。
- Map custom callout 使用一个官方 slot 容器，`cover-view` 子树只依赖其稳定支持的布局与 transform/opacity，badge 不越界；map 内 `cover-image` 运行时资源用 PNG，不用 SVG。
- 支持同层渲染时，复杂 input/scroll/button UI 保持普通 WXML；监听 `rendererror` 记录设备／基础库证据并提供恢复态。

## 2026-09-20 TASK-V2-17 interaction rebuild baseline

- 继续使用微信原生 `<map>`、GCJ-02 和既有 TypeScript/WXML/WXSS；聚合点导航以一次原子 center + target-scale native command 驱动，不引入 Leaflet、Supercluster、DOM、第二地图 SDK 或 runtime dependency。Leaflet.markercluster/Mapbox 只提供 screen-space clustering、camera expansion 与 spiderfy 的行为参考。
- `platform/public-map-interaction.ts` 只保留连续 `scale ↔ progress`、clamp 和 smoothstep presentation easing，不再输出产品可见的 `LEVEL_0/1/2`。
- `platform/public-map-cluster-engine.ts` 在每个采样到的 exact scale 使用 Web Mercator world-pixel 投影、完整 Marker footprint、确定性 `publicLeadId` 排序和 8px 滞回生成 topology；旧 topology 只提供防抖 pair history，不固定未来层级。它同时提供 expansion scale 搜索与 representation invariant 检查。
- `platform/public-map-native-presentation.ts` 把 topology 投影为 stable native marker IDs、连续 48—96px 右栏、camera-direction transition progress、Web Mercator 空间插值和最大倍率按需 spiderfy。fan-out display coordinate 与 `realLatitude/realLongitude` 分离，不写回 contract、cache 或业务对象；平台必需的 marker iconPath 以 `alpha:0` 作为不可见锚点，不再露出头像图层。
- `pages/home/index` 在原生 `regionchange` 只给 begin/end 的约束下，用 40ms `MapContext.getScale()` sampler 追踪手势和 cluster camera command，并在 end 后继续有限 settle tail。每帧执行 scale、连续宽度、碰撞和 split/merge 插值；反向／新手势按 region generation 取消或重基准。旧约 220ms ghost 不再驱动 zoom topology。settled output 不按旧 viewport 过滤已加载 eligible leads；marker bindings 只有 identity/display coordinate 变化时才 `setData`。
- 地图模块现在只在 `map-preview` 挂载；离开 Tab 后释放 Native Map context、采样与过渡调度，但 Page 级 client subscription、projection、stable marker 和缓存继续复用。纯 zoom-in/presentation 若新 viewport 仍包含于已加载 bbox，不触发 query；zoom-out/pan 超出 bbox 后才通过既有 180ms settled debounce 查询。

## 2026-09-19 TASK-V2-17 Leaflet 行为适配边界（历史，已被 2026-09-20 重建取代）

- `platform/public-map-cluster-engine.ts` 是纯 TypeScript 的 hierarchy/reference layer，不引入 Leaflet 或 DOM；它跨 scale 保存 stable cluster identity、parent/children、bounds、exact-overlap 和 next split scale。
- `platform/public-map-native-presentation.ts` 把 hierarchy 投影为 stable native marker IDs，使用 rendered footprint、viewport buffer 和 semantic zoom；前后 projection 规划 split/merge，优先调用 `translateMarker`，失败时采用 camera settle + final replacement fallback。
- cluster click 使用 children bounds + `MapContext.includePoints()`；max scale 或 exact overlap 使用 circle/spiral spiderfy，real coordinate 与 display coordinate 分离，polyline 只表达临时 spider leg。`regionchange` 只在 end 阶段读取最终 viewport/scale 并触发一次 query，避免受控 scale feedback loop。
- `<map>` 通过 `wx:if="{{true}}" + hidden` 保活，Tab 切换复用 map context、hierarchy、projection、viewport 与 query cache。以上均为客户端展示／交互适配，不新增 runtime dependency、route、backend、DB、contract 或 production adapter。

## 2026-09-19 TASK-V2-17 native interaction correction

- `<map scale="{{mapNativeScale}}">` 只接受初始化、定位和聚合放大等明确命令；`regionchange` 的移动阶段不再 `setData(scale)`，结束阶段只把最终 scale 保存到页面外的 observed-state，并重投影 Marker。这样消除手势事件与受控属性互相驱动的反馈循环。
- 原生 `markertap`、`callouttap` 与 custom-callout 内部 `catchtap` 统一归一到 numeric marker ID；120ms 去重和短时 map-tap guard 防止同一次触摸既打开 Marker 又触发底图 outside-dismiss。cluster 通过 `MapContext.includePoints()` 或 exact-overlap spiderfy 处理。
- 定位／刷新使用 `<map>` 内直接 `cover-view` + `cover-image`，绕开原生组件层级对普通 sibling view/button 的触摸拦截；当普通 WXML 详情卡或弹窗出现时条件卸载原生按钮，防止真机 cover 层压在弹层上方，不能仅靠 CSS z-index 调整。地图 stage 仍是唯一尺寸 owner；页面用 8px top extension 扩大底图，但 overlay 通过反向 offset 保持原坐标。
- 没有新增 runtime dependency、route、backend、DB、public contract 或 production adapter。

## 2026-09-13 TASK-V2-16-A structural layout repair

- 小程序原生按钮使用 scoped `.map-control-button` 完整归一化 `display/box-sizing/width/min/max/height/margin/padding/border/background/font/line-height/flex/white-space`，并由更具体 selector 给 refresh、mode、filter、marker 等组件确定几何；这中和基础库 3.17.0 的 `wx-button:not([size=mini]) { width:184px }`，不扩大为全局 button reset。
- `map-content-stage` 是 MAP/LIST 共用的单一 Flex allocator 与 `position:relative` containing block：`flex:1 1 0; min-height:0; overflow:hidden`；map surface 同样 `flex:1 1 0; min-height:0`，detail/status overlay 绝对定位在 stage 内。此最小 hardening 保留现有 `100vh + topSafePx + fixed nav + env(bottom safe)` 模型，但把剩余空间 ownership 集中到一处并消除固定 190px map。
- retained-data banner 在 WXML 使用 `wx:if/wx:elif` 单链互斥，MAP 采用最高 56px stage overlay，LIST 使用单条 normal-flow 行。真实 WeChat DevTools computed geometry 与五设备静态模型共同作为 structural evidence；语义测试不能替代 Founder screenshot review。
- 未新增 runtime dependency、asset、route、native `<map>` 或 production adapter；当前 gate 是 `16A_LAYOUT_REPAIRED / AWAITING_FOUNDER_STRUCTURAL_VISUAL_REVIEW`，16-B/16-C/17 继续锁定。

## 2026-09-13 TASK-V2-16-A Mini Program spatial audit

- 当前 home page 使用 `navigationStyle: custom` + `disableScroll:true`；V1 通过 `getWindowInfo()` 与 `getMenuButtonBoundingClientRect()` 计算单一 `topSafePx=max(40,statusBarHeight,safeArea.top,menuButton.bottom+12)`，页面高度仍由 WXSS `100vh`、CSS `env(safe-area-inset-bottom)` 和 fixed 64px nav 组合。当前模拟器计算一致，但跨设备窗口模型仍需在 16-A 结构修复中集中验证。
- 微信基础库 3.17.0 的渲染层注入 `wx-button:not([size=mini]) { width:184px }`。现有 `button { margin:0; padding:0; border:0; font:inherit }` 没有重置 width/display/line-height；map-specific selector 多数只声明 `min-width`，refresh 的 class width 也未赢得 computed result。真实 WXML inspector 已证实这条注入样式是 refresh、mode switch、filter 和 marker 尺寸失控的直接技术根因。
- horizontal `map-filter-scroll` 在当前渲染中实际为 `334×34`，并非无界 scroll-view；LIST 的 `min-height:0; flex:1 1 auto` 是正确模式。MAP surface 的 `flex:0 0 190px` 才是不能填满剩余高度的直接原因。
- `index.wxss` 以及 map block 均使用 0 个 `rpx`，因此 `VERTICAL_RPX_RISK=NO`。本轮不改 runtime/dependency；只记录下一轮必须使用 computed layout gate，而不能由 semantic source tests 代替。

## 2026-09-13 TASK-V2-16-A client prototype（16A_COMPLETE / AWAITING_FOUNDER_16A_REVIEW）

- 继续复用 `PublicMapClient` 的 query identity、generation/cursor/stale/detail race 与 TASK 15 visibility port；map/list/filter/detail 不另建状态架构。
- surface 仍为 WXML/CSS synthetic placeholder；viewport change 只由本地交互模拟，禁止 `<map>`、MapContext、`regionchange`、`wx.getLocation` 与生产 API。
- 新增的 report boundary 只允许 public target/category/reason/action ID；trusted reporter eligibility、credible notice、moderator role 与 threshold 不进入 client request。
- `public-map-presentation.ts` 集中处理 public marker/detail 文案、RecordType/Opportunity/Freshness、重叠 key、null/zero 和 avatar fallback；WXML 不读取 private contract。
- 16-A 的测试与文档产物不增加 runtime dependency、图片或最终视觉库；native map/cover-view 风险只记录到 Blueprint，留给 TASK 17。

## 2026-09-13 TASK-V2-15 client boundary（COMPLETE / HUMAN_APPROVED）

- TASK-V2-14 已 `COMPLETE / HUMAN_APPROVED`。TASK-V2-15 使用真实 V1 `pages/home/index` 既有 **我的上传** 页面作为授权/owner-control placement，并复用同页 `map-preview` 的 TASK 14 `PublicMapClient`；不新增 page/route、登录/Profile gate 或生产 adapter。
- Client request 只允许 authorization version、server-issued scope digest、idempotency/action key、publicLeadId 与动作；trusted owner/account/capability/status 由 synthetic trusted service boundary 提供。该 adapter 明确为 `NOT_PRODUCTION_EVIDENCE`，生产 binding 仍归 TASK-V2-19/22。
- Delete client tombstone 仅作为 late/stale-response no-resurrection guard，并从 memory cache/state 移除 public lead；不冒充 server lifecycle truth，也不触碰 V1 Local Board/P1。

## 2026-09-13 TASK-V2-14 client runtime（IMPLEMENTATION_COMPLETE / AWAITING_FOUNDER_REVIEW）

- TASK-V2-14 的正式宿主是现有 `apps/client/miniprogram/pages/home/index` 内 `map-preview` 分支。V1 的 **地图** 自定义导航、`tab=map` 分享落地和页面注册保持不变；不新增 page/route、hidden/dev entry、feature flag 或 release redirect。当前分支不部署，生产 exposure 由 TASK-V2-21/22 管理。
- client runtime 新增 public contract mirror、canonical query identity、monotonic root generation、独立 detail selection generation、opaque cursor recovery、public-only in-memory cache 和 deterministic synthetic service。synthetic fixture 明确为 `NOT_PRODUCTION_EVIDENCE`；不存在 CloudBase/network production adapter。
- cache TTL 默认 120 秒，以 canonical query identity 隔离；过期 snapshot 可作为 `STALE_CACHE` 浏览，但 cursor 立即失效。显式 allowlist clone 丢弃 runtime extra fields，并禁止 private ID、private avatar fileID、Verification/Rights/moderation evidence、raw ObservationLocation 和 cursor secret 进入 state/cache。
- native `<map>`、GCJ-02 viewport event、`wx.getLocation`、location permission、real marker binding 和 `regionchange` 继续属于 TASK-V2-17；TASK-V2-14 只使用现有 `map-placeholder.svg` 的 synthetic surface。

## 2026-09-13 V2-C 收口与 V2-D 技术入口

- V2-D 正式前端载体冻结为现有真实 V1 小程序工程；正式低保真交互原型与后续批准视觉都必须在其中实现并验证 V1 路由、全局样式、资产、Profile、导航、页面栈、安全区与微信交互环境。现有 `spikes/v2-a-map-device/` 的角色调整为 `TECHNICAL_SPIKE_ONLY`，只承担 native `<map>`、layer/cover-view、marker density、`regionchange`、权限、极端 case 与性能 benchmark；它不再定义产品页面、导航、组件树、V1 integration 或视觉 truth。完整约束见 `docs/delivery/v2-d-frontend-execution-strategy-addendum.md`。
- V2-D 的工程交付原则为 `LOW-FIDELITY VISUAL + HIGH-FIDELITY INTERACTION + COMPLETE PRODUCT LOGIC`。Codex 负责 engineering、interaction、structure、V1 integration、state/data/error/recovery 与设计交接，不拥有最终视觉设计权；Founder 批准外部视觉方案后才允许执行 TASK-V2-16-C。TASK-V2-14 现按上方最新约束复用既有地图入口；production deploy、pilot 与 release 仍未获授权。
- Founder 已于 2026-09-13 明确批准 TASK-V2-10—13 reconciliation 与 V2-C；TASK-V2-09—13、V2-C=`COMPLETE / HUMAN_APPROVED`。批准对象仍只涉及 `packages/v2-map/` 的本地 server-side reference implementation、合同和验证证据，不代表 CloudBase production deploy。
- V2-D=`READY / NOT_STARTED`，仅 TASK-V2-14=`READY / NOT_STARTED`；TASK-V2-15—22 与 V2-E=`LOCKED / NOT_STARTED`。客户端只消费批准的 public service contract；synthetic allowlisted PublicMapLead fixtures 可以用于确定性开发测试，但不能替代真实 API、真机或 Pilot 证据。
- TASK-V2-14 必须继承 schema/query/account/asOf/cursor/generation 绑定、分页错误保留已加载 public data、runtime Opportunity/mode allowlist 与 public-only cache。TASK-V2-15 不得假设 backend 已部署。
- TASK-V2-18 继续拥有真实 scale/latency/density/package/cost 复验。生产 Cloud Function、collection/index/resource、migration/backfill 与 deploy 仍需独立授权；TASK-V2-19—22 与 V2-E 保持锁定。

## 2026-09-11 V2-A Evidence 技术结论

- TASK-V2-03 已 `COMPLETE / HUMAN_APPROVED`；用户确认 iOS、Android 与腾讯位置服务控制台 Evidence 全部 PASS，V2-A 外部证据不再待补。
- TASK-V2-03 测试号已恢复，地图验证保持独立可删除工程 `spikes/v2-a-map-device/`：使用与 V1 正式 AppID 不同的测试 AppID、自有 `miniprogramRoot`、30 个上海 synthetic markers、本地 mock loading/fault/race、权限／viewport／前后台／列表 fallback 与可见日志；源码不含 CloudBase、DB、Storage 或生产 API 调用。静态 validator、`wcc/wcsc` compile、开发者工具 simulator、iOS 与 Android 验收均 PASS。
- 信息表达合同只存在于 `docs/research/v2-a/`；不创建 runtime type、production score、ranking、AI 或 PASS mapping。
- Freshness 推荐以连续指数半衰期作为后续校准起点，但真实参数、隐藏阈值和生产算法均未冻结。
- V2 地图数据核心为 ICHI 自有数据库；四类来源统一写入同一版面模型，`sourceType` 只承担 provenance，不允许 source trust score/tier/weight。
- 当前NETWORK_SCOPE见2026-10-02决定：OFFICIAL_CURATED、上海50→全国300热启动与上线后Codex审核式持续补充。此处原一次性约20条路线已SUPERSEDED；不改变统一Verification、rights、隐私和no-resurrection语义。
- 跨来源 Verification 统一为 `NOT_VERIFIED / VERIFIED`；所有来源只有完成 ICHI Recognition、Structured Extraction、Board Validation 才能成为 VERIFIED 并进入地图 Public Eligibility。
- 地图技术方向为微信原生 `<map>`：负责基础底图、markers、callout、pan/zoom、`regionchange` 与 viewport。viewport 只查询未来 ICHI Map Query API 返回的 bounded `PublicMapLead`；地图打开后不依赖腾讯地点搜索、POI 数据或店铺数据库。定位使用 `wx.getLocation(type=gcj02)` 与微信权限声明。腾讯位置服务降为 `Optional Location Enhancement`，只用于未来地址解析、POI 辅助、用户主动地点搜索或地理信息增强。CloudBase geo 查询要求 geo index，public API 仍须 service-only bounded query，现有 13 个 `ADMINONLY` 集合保持不变。
- V1 mini-program source 仍为 908,347 bytes，2 MiB gate PASS；独立 spike 不在 V1 `miniprogramRoot`，package delta=0。没有 upload／publish／deploy；完成取证后可整体删除 spike。
- CloudBase 官方 2026-09 资源点定价支持小规模请求侧成本低于 20 元/月的初步推断；腾讯位置服务控制台 key／许可／配额与 iOS/Android 真机方向已人工验收 PASS。用户确认腾讯地点搜索当前约 200 次／日；因 MVP 浏览链路不调用地点搜索，该额度不阻塞 V2。真实生产流量和 geo index 仍由后续 Gate 复验。

V2-B/C 与 TASK-V2-09—13 已 `COMPLETE / HUMAN_APPROVED`。hybrid materialized public core/request-time envelope、Cloud Function logical transport、geoWithin plan、snapshot cursor、no shared MVP response cache、source adapters、resolver、authorization、projector、moderation 和 public service 均由 `packages/v2-map` 的本地 reference implementation 表达。它未接入 V1 runtime、CloudBase deploy manifest 或 production resources；V2-D 只解锁 TASK-V2-14，TASK-V2-15—22 与 V2-E 继续锁定。

2026-09-13 Completion Reconciliation 技术边界：`VerificationInput` 只能经 `verifyBoard()` 形成 branded `VerifiedBoard`；BoardInstance resolver 拒绝 raw/stale input；`OpportunityEvaluation` 必须绑定同一 VerifiedBoard/version，独立 `publicGateDecision=PASS` 后才可由 `buildPublicCandidate()` 创建 branded candidate，Opportunity level 不映射 PASS。V1 `profiles.avatarFileId` 保持 private/stable，V2 仅通过 trusted `PrivateAvatarUrlIssuer` 签发短时 allowlisted HTTPS locator，禁止放宽 `profile-avatars/` ACL。Public API client request 不携带可信 account/rate/global-stop/HMAC；production adapter 必须绑定 server-derived Account、跨 serverless instance 的 durable `RateLimitStore`、server-controlled `PublicMapReadControl` 和 server-only `CursorSecretSource`。local in-memory adapters 只作 reference test。历史shadow wiring/resource/index/migration rehearsal由TASK19记录、真机由TASK20/21记录；Closed Pilot/旧RC前置门已豁免，生产提升、continuous bridge、50/300与production smoke、actual deploy/migration/secret binding现由TASK22负责。

## 2026-09-10 V2 Planning Reconstruction 技术边界

当前分支为 `feature/v2-board-map`，精确基于 `origin/main@929d189a06e13010e50abf4927bfec3b1ebd49fc`。V1 Current Truth 已作为规划基线，唯一 current plan 是 `memory-bank/implementation-plan.md`，审核包是 `docs/delivery/v2-planning-reconstruction-review-packet.md`。全部技术选择仍受 Product/Evidence Gates 和人工解锁约束；本轮没有 V2 运行时代码、CloudBase、数据库、Storage、测试或生产配置变更。V1.0.1 已上传微信并审核通过，实际发布仍未确认；不得创建 `v1.0.1` 标签或 Release。

- 身份：继续使用 CloudBase 云函数 `getWXContext()` 静默建立 Account；Profile optional，不以 `wx.login` UI 或头像昵称授权作功能 gate。
- 私有事实：继续使用 Local Board / Upload Submission / Current Cloud Publication；P1 是轻量 `publishedSubmissionVersion` pointer，完整事实来自 exact APPROVED Submission。
- 公开读取：V1 没有 public serving read model 或 API。已冻结边界仍是不允许客户端直接读 private collection，也不把 P1 直接改成 public collection。D09 已批准 hybrid：未来 projector materialize allowlist-only public core，query service request-time 生成 Freshness/asOf/envelope。`publicMapLeads/publicMapQuerySnapshots` 仅存在于 local unapplied candidate；生产资源未创建。
- 查询：必须先冻结 bbox/zoom/filter/cursor/limit、marker density/clustering、cache/asOf/stale、rate limiting 与 abuse budget，再决定 indexes 与实现。
- Location：V1 GCJ-02 device snapshot/accuracy 仍只作私有 `captureGeo`。当前合同强制分开 Observation Location、Location Resolution、Public Location Projection 与 query viewport；Venue/POI 不是核心实体。V2-B 只冻结 exact/approximate/area/not-public 等精度语义，具体米级、rounding、修改／迁移与 geospatial index 留待后续实现阶段决定。venueNote 的既有 V1 安全 PASS 只按 exact content/version provenance 复用，不新增 V2 重审调用；文本变化或 NETWORK_SOURCE/provider/admin 新文本需要未来等价安全门，当前不实现该门或其持久化。
- Storage：V1 CUSTOM rule、`recognition-temp/` 和 `profile-avatars/` frozen；V2 默认无 public image。图片需求必须单独解锁、单独 prefix/rule/lifecycle/CDN/privacy design。
- Recognition：R2 Prompt/Schema/Resolver frozen，V2 只消费批准后的结构化事实；`null=unknown`、`0=confirmed zero`。
- Map/platform：微信原生 map 方向已通过 V2-A。TASK-V2-09 推荐 public GCJ-02 Geo Point + geo index + exact bbox filter、page 50/snapshot 500/TTL 120s、Account-bound rate limit 与 global cost stop；这些是 versioned pilot defaults，尚待 founder 批准及 TASK-V2-18/19 的真实 index/load/read-back。V2 MVP 读取方向继续为 silent trusted Account，不是 completely anonymous API。
- Deployment：single worktree；latest main → feature/version branch → development → PR → merge main → actual WeChat publication → immutable tag。CloudBase 仍要求函数目录内部署、配置 merge/read-back、线上反向 hash 和 black-box smoke。

下方所有 dated V1 技术条目是当时的演进/事故证据，只有被 V1 Current Truth Registry 确认的最终状态才是 current；较早 V2 表格中的 `wx.login`、未来新建 Account/Profile、直接 `ContributionDraft` 覆盖、图片保留、已选 map/provider、提醒和海报等内容只作历史研究。2026-09-08 的完整 V2 技术草案仍是 blocked historical candidate，不能视为已选型；其内容已逐项映射到 current plan。本 planning pass 明确 `commit = NO`。

2026-08-31 V1.0.1 THREE TAB SPLIT SHARE IMAGE 技术边界：现有 `pages/home/index` 的 `onShareAppMessage`、`onShareTimeline`、单次 `wx.showShareMenu`、单一 `wx.onCopyUrl` listener 与 `recognize|map|my` allowlist 均保持。`platform/home-sharing.ts` 分离 `FRIEND_SHARE_IMAGE_URL` 与 `TIMELINE_SHARE_IMAGE_URL`：好友使用 `/assets/share/ichi-share-message.png`，该 RGB PNG 每次都从 320×320 默认头像直接重采样到 520×520，再居中补白为 800×640；相对上一版 400×400 主体的线性缩放系数为 1.30，最终左右各 140px、上下各 60px。朋友圈直接指向既有 `/assets/v1-29/ichi-avatar.png`，原文件不修改、不复制；复制链接只使用 query。上一轮 1254×1254 分享图已移除。后端、CloudBase、数据库迁移、Storage、V2 API、自建 H5／短链服务和 HTTPS 分享图均为零变更。

2026-08-29 `WECHAT_PREMATURE_PROFILE_AUTH_GATE` REVIEW_BLOCKER 技术修订（当前最高事实源）：复用现有 `bootstrap-account` 的 `cloud.getWXContext()` 可信 identity mapping 与事务内 find-or-create，不新增 Guest／Anonymous／临时游客模型、collection 或客户端 owner identity。Account/session readiness 只由这条可信服务端链决定；`profiles.profileState`、`nickname`、`avatarFileId` 仅是展示资料，不得作为首页或功能入口 gate。新 profile 继续由服务端写入 `nickname="ICHI 玩家"`；没有 `avatarFileId` 时客户端使用 `/assets/v1-29/ichi-avatar.png` fallback，不上传默认头像、不做生产 migration。

可选资料更新继续复用 `bind-wechat-profile`、`profile-avatars/` owner-only Storage 与本地 `USER_DATA_PATH` 展示缓存。客户端只把 `chooseAvatar` 临时 path 交给 `wx.cloud.uploadFile`，服务端数据库只接收稳定 `cloud://.../profile-avatars/...` fileID；昵称-only 与头像-only 主动更新都必须由 owner-scoped 服务端按现有 profile 合并，昵称始终经过共享 `PROFILE_NICKNAME`/`msgSecCheck scene=1` 安全检查。bootstrap 网络／函数失败映射为技术失败 UI，不得降级为资料授权请求。

2026-08-30 V1.0.0 technology closure：微信小程序已正式发布，线上源码固定为 `03942f2067959a4b8b0eb6223c949e51e768587d`。V1 生产技术栈、识别 R2 Prompt／Schema／resolver、CloudBase 19 函数边界、Storage CUSTOM 与 1 天临时对象 lifecycle、13 个私有集合及 fail-closed 安全边界全部 `FROZEN / CLOSED`，V1 active plans=`0`。好友／朋友圈分享、分享落地页 bootstrap、组件按需注入与三张 PNG 优化转入 V1.0.1 backlog；CanonicalBoard／跨用户匹配／contributors／merge-unmerge／canonical version／协作地图转入 V2 backlog。

2026-08-29 V1 Current Publication 大字段回归收口栈：`observationCandidates` 的稳定 P1 只原子保存 `publishedSubmissionVersion`、批准状态和可信时间等小型发布指针，不再复制 `drawSubmissions` 内的 `finalSnapshot`／`authoritativeDrawEvents`，避免重现生产已证实的 CloudBase `-502001` 大型 observation 更新失败。`get-my-records` 按 P1 的 owner、board 和精确 published version 读取已批准 submission，并把 snapshot、draw events、note 与 location 投影到返回记录；更新但失败的 attempt 只提供核验状态与重试上下文，不能覆盖当前发布内容。核验诊断在 AJV 后继续记录 normalize、reconcile、note review 和 publication transaction checkpoint，并兼容读取 CloudBase SDK 的 `code`／`errCode`。

2026-08-29 V1 PHOTO 可恢复性栈：`recognize-draw-tickets` 的 Provider 调用以 `REQUEST_STARTED → HTTP_RESPONSE → RESPONSE_BODY_PARSED → CONTENT_PRESENT → OUTPUT_JSON_PARSED → AJV_PASSED` 非敏感 checkpoint 诊断技术失败；非 2xx、transport、JSON/AJV 和后续基础设施异常统一保持 attempt 为 `PROVIDER_FAILED`，不清空当前 Storage fileID、不触发即时终态删除。客户端既有 `provider-failed → 核验异常 + 重新核验` 投影和 same-version pending identity 继续复用；50 分钟 cleanup job 与平台 1 天 lifecycle 仍封住临时图片上限。Provider 正常输出才进入实体证据 normalize 与 exact reconciliation，未改模型、Prompt、Schema 或核验强度。

2026-08-28 V1 Current Publication 收口栈：本机版本化 Storage 的 `boardId` 继续承载 Local Board；CloudBase `observationCandidates` 复用为每个 `ownerAccountId + boardId` 最多一条当前发布 P1，稳定 `recordId` 不因重新上传变化；`drawSubmissions` 以递增 `submissionVersion` 承载每次上传尝试。submit／PENDING／FAILED 只写 attempt，不写 P1；只有 LOCATION／PHOTO／NOTE 全部通过后的 APPROVED 事务才推进 P1 的 `publishedSubmissionVersion` 与必要轻量状态，可信 snapshot、draw events、location 和 note 继续保存在对应版本的 submission 中。`get-my-records` 由服务端按 owner+board、批准状态、发布版本和服务端时间选择唯一 current publication，并精确投影该 approved submission；客户端只做防御性去重。未来 MAP 若解锁也只能消费同一 current-only 投影，本轮不新增公共集合或地图端点。

显式云端删除继续复用 `delete-my-record` 与 `deletionJobs` 墓碑，并在小程序 Local Board 中持久化 `pendingCloudDeletion`。只有 owner-scoped 删除明确受理后才删除当前设备 B1；网络失败、未知响应和普通 404 均保留 B1，重启后按 marker 幂等续跑。`recordCode` 仍只是 `^[A-Z0-9]{6}$` 展示码，`cloudRecordId` 只是 P1 reference；二者都不替代 `boardId`／`recordId` 的领域身份。生产只更新 `finalize-board-observation`、`finalize-draw-update`、`get-my-records`、`recognize-draw-tickets` 四个受影响函数，保留 Nodejs20.19、入口、环境配置和依赖层。

2026-08-28 历史客户端边界说明：早先按 `recordId` 展示同 Board 多条 Observation 的临时投影已由上方 Current Publication 栈取代。`onDeleteDraft` 仍只操作本机 repository；`onConfirmDeleteUploadedBoard` 仍调用 owner-scoped `delete-my-record`，但成功后按最终合同级联删除当前设备 B1。

2026-08-28 V1 六位记录码兼容边界：服务端 `newRecordCode` 使用大写字母数字字符集随机生成六位 display code，客户端持久化 validator 必须接受完整 `^[A-Z0-9]{6}$`，不得添加“至少一个字母且至少一个数字”的额外约束。本机 `deriveRecordCode` 可以为可读性继续保证混合字符，但服务端返回码是规范值；任一合法码都不能影响 Local Board 可恢复性、后台 verify 或 ownership。

2026-08-28 历史 identity-recovery 说明：较早通过派生链为每次上传建立新 Observation 的做法已废止。当前 `prepare-new-upload` 对 owner+board 复用稳定 P1；显式删除墓碑返回删除终态且不得派生新 P1，never-uploaded／非显式 legacy stale 仍可安全绑定或首次建立 P1。客户端继续从不可变初始基线与完整 draw-event batch构建 attempt；NEW upload note 清空，NOTE_FAILED 同版本编辑保留原文。

> 状态：APPROVED
>
> 版本：1.24
>
> V1-A 精确依赖版本已于 2026-08-05 锁定；后续升级必须更新决策记录和锁文件。

2026-08-28 Storage Closure 栈：生产 Storage 使用传统模式 `CUSTOM` 客户端规则；`profile-avatars/` 仅 owner 可读写／删除，以兼容跨设备头像缓存，`recognition-temp/` 客户端读取恒拒绝且仅 owner 可写入／删除，其他路径客户端恒拒绝。规则只约束客户端，控制台和可信服务端仍可签发短时 URL及执行清理。应用层以 `deletionJobs targetType=storage-object` 统一承载头像、版面和赏票补偿，现有每 10 分钟／每日 maintenance 复用 `status_nextAttemptAt` 索引，不新增 scheduler。底层 COS lifecycle 以 Prefix `recognition-temp/` 和 `Expiration.Days=1` 启用并读回，只兜底临时对象；最短 1 天规则按日异步执行，不承诺精确 24 小时删除，也不命中 `profile-avatars/`。

## 1. 选型原则

2026-08-27 V1-F 上线配置与呈现边界：生产 `recognize-draw-tickets` 的位置半径由 CloudBase 函数环境变量 `PRIZE_TICKET_LOCATION_RADIUS_METERS=200` 提供，Haversine evaluator 保持 `distanceMeters <= configuredRadiusMeters` 的既有比较语义，缺失、非数值或非正值返回 review-unavailable。客户端把 `latestPrizeTicketSubmission.result.status/status` 作为优先 machine-readable 事实源，并在 `cloud-records.ts` 与 `local-draw-drafts.ts` 两个既有 presentation adapter 中统一投影状态文案和操作；WXML 只消费 `recordStateLabel/verificationAction`，不解析错误消息。

2026-08-27 用户文本安全栈：CloudBase 共享 CommonJS module 统一封装 `cloud.openapi.security.msgSecCheck`，只接受内部 `PROFILE_NICKNAME`／`MAP_NOTE` usage，并在服务端固定映射 scene 1／2；未知 usage、非明确 pass、响应畸形和调用异常一律返回 `{passed:false}`。`bind-wechat-profile` 与 `recognize-draw-tickets` 都从 `cloud.getWXContext()` 使用可信 OPENID，不接收客户端 openid/scene。两个实际调用 OpenAPI 的部署函数都必须声明 `security.msgSecCheck` 权限；共享 module 不承担资料写入、NOTE 状态、retry 或任何 LOCATION/PHOTO 逻辑。

2026-08-27 R2 抽取与送审加固栈：逐抽继续只写本机 history；`finalize-draw-update` 在拍摄赏票送审时以 CloudBase 数据库事务接收完整 authoritative event batch，以稳定 `eventId` 做批内唯一性、以 submission version 做跨请求幂等和冲突检测，并在同一事务内执行初始 R 上界校验与 `finalSnapshot` 重建，不能让并发客户端数组覆盖已提交事实。`recognize-draw-tickets` 以 `recordId + boardId + submissionVersion` 作为不可变送审版本边界，并在服务端持久化 LOCATION／PHOTO／NOTE／APPROVED 有限状态机。地点距离使用 Haversine 纯函数和显式 `PRIZE_TICKET_LOCATION_RADIUS_METERS` 配置；配置缺失或无效时返回稳定的 review-unavailable 结果，不进入下一门。GPS accuracy 作为结构化审计事实保存，本阶段不擅自把精度估计加减进产品阈值。

备注安全检查通过 CloudBase OpenAPI `cloud.openapi.security.msgSecCheck` 的适配器调用；云函数部署包必须声明 `security.msgSecCheck` 权限。适配器只把明确 `suggest=pass` 解释为通过，risky／review／未知响应和技术异常均 fail closed，且不得用本地关键字或固定通过伪装线上审核。赏票 Storage fileID 只保留到本次核验终态，数据库不再保存新的长期 `originalEvidenceFileId`；历史字段仅兼容读取。未来地图投影必须额外要求正式记录 `verificationStatus=APPROVED`，仍不在 V1-F 创建公共集合或开放公共读权限。

2026-08-27 R2 第二阶段业务栈：冻结的 Provider/RecognitionContract 输入继续由 `board-recognition.ts` 适配，但页面之后使用独立 `board-record-r2-1.0.0` 判别版本。R2 recognition draft 只携带 nullable `remainingTickets` 和视觉标签，确认后生成含 `isGrandPrize` 的不可变业务快照；本机持久化以新 schema 保存每赏 `initialRemainingTickets/isGrandPrize`，当前亮球由初始数减去 draw event 数量确定性投影。旧 schema v1 的 `total/remaining/targetTiers` 只通过 legacy read adapter 暴露为统一运行时视图，不原地重写。CloudBase `observationCandidates` 继续复用既有 owner、recordCode、幂等 recognition job 与 GCJ-02 location，对 R2 保存结构化 `initialSnapshot/finalSnapshot`，服务端用可信时间写 `createdAt/updatedAt`；R2 snapshot validator 与 draw derivation 不接收或生成 T/P 字段，旧 validator 保留给 H0/R1 历史记录。

R2 Grand／Normal 是持久化业务事实而非版面算法结果：新记录只读取 `isGrandPrize`，旧记录才在 legacy adapter 中保留历史 `classifyPrize(total)`／`targetTiers` 表现。状态恢复采用 draw events 作为事实源的确定性投影，并继续把同一组事件交给现有赏票核验与观察窗口；不通过重新识别或修改初始 R 重写历史。地图复用仅增加正式 R2 record 的只读投影和索引可行性，不创建 V2 公共集合、发布事务或地图 UI。

本阶段不新增版面图片 Storage 前缀。`recognition-temp/` 仍为 ephemeral、完成即删且 `persistReference=false`；因此不能保存会失效的 `boardImageFileID`。若未来批准长期版面原图，必须先单独更新隐私披露、私有对象规则、owner read/delete、容量生命周期与历史删除语义。

2026-08-27 R2 第一阶段生产栈：`recognize-board` 新增并默认使用 `r2_direct_remaining`，固定 Prompt `ichi-board-vlm-r2-direct-remaining-1.0.0`、Provider Schema `board-provider-r2-direct-remaining-1.0.0` 与独立 deterministic resolver；H0 `hybrid_semantic` 是唯一 rollback，R1 仍打包用于历史回归但不再是默认。模型与传输参数保持 `qwen3.7-flash`、`enable_thinking=false`、`temperature=0`、`response_format=json_object`、fileID→短时 HTTPS URL、单图且不使用 Buffer/Base64/Data URL。resolver 对非 null Provider R（含零）优先，否则按 observation object 数量回退，不执行 R1 的 T/P/U、序列或守恒推理。第一阶段沿用 `RecognitionContract 1.0.0` 的 nullable T/P，仅作客户端 direct-R 兼容，不扩展数据库或版面业务。

2026-08-27 R1.1 诊断补充：`r1_remaining` 继续使用既有模型参数、图片 URL 链和确定性 resolver，只把 Provider Prompt/Schema 固定到 1.1.0。授权 internal smoke 可在调用响应中携带 raw Provider content、Provider RequestId、parse/AJV 完整取证和已到达的 resolver/contract；该能力由至少 32 字节服务端临时令牌保护，不写普通响应或日志，部署验证结束后必须移除令牌。

2026-08-27 V1-F R1 生产识别栈：`recognize-board` 运行时白名单只保留 `r1_remaining` 与冻结 H0 `hybrid_semantic`；前者是生产默认，后者是唯一 rollback，`v4 / LEGACY_V4_ROLLBACK` 不再打包或可选。两栈继续共用 `qwen3.7-flash`、`enable_thinking=false`、`response_format=json_object`、`temperature=0`、单图 fileID→短时 HTTPS URL、`max_pixels=6291456`、配额事务、图片生命周期和 `RecognitionContract 1.0.0`。R1 Provider Schema 只接受可见事实：身份／价格、视觉赏级分段、`visibleNumberRuns`、`totalTicketsObserved`、`pastedTicketsObserved` 及必要的可见奖品名；禁止 canonical T/P/U 和分析字段。独立 R1 resolver 依次执行标签与运行规范化、occurrence 提取、方向／序列诊断、候选生成和约束消解；权威字段为 T/U，P 仅由 `T-U` 派生。候选不能唯一闭合时输出 partial/null 与固定 reason code；`visible=[]` 不产生零，耗尽零必须通过独立保守证据门。A1/A2 原始身份保留在 trace、业务输出按既有父级聚合，SP1—SP4 保持独立。Provider raw 与 resolver trace 只记录结构化非敏感事实，不记录图片 URL、请求体、Prompt、Header、Workspace 或密钥。

2026-08-26 V1-F H0 生产识别栈（历史基线，已由 2026-08-27 R1 规则覆盖）：`recognize-board` 曾以服务端 `BOARD_RECOGNITION_MODE` 提供 `hybrid_semantic` 与 `v4` 双栈；H0 的冻结 Prompt、模型参数、Schema 与 normalizer 仍保持不变，但 `v4` 已不再是运行时回滚路径。

2026-08-25 V1-F 配额提交边界：`reserve-recognition` 只占用并发名额，Provider 成功只产生 `recognized` 结构化草稿；正式消费必须延迟到 `finalize-board-observation`，并与可恢复观察记录持久化在同一 CloudBase 事务内完成。客户端先以不可变快照构建、校验并完整写入本地 draft，再请求 finalize；Provider、Schema、Normalize、无可用票池、本地落盘或生成失败均 release，重试沿用 recognition job 与结构化结果且不再发起模型调用。`recognized` 预占带租约，由定时任务释放过期任务；commit/release/finalize 均保持幂等。

2026-08-22 V1-F 图片链路覆盖规则：小程序不再执行四角检测、吸附、透视校正或另一套客户端视觉算法。用户对冻结照片点击对勾后，复用既有轻量裁切／Resize／JPEG preparation，随后执行唯一一次权威配额预占并把二进制上传到私有 `recognition-temp/`；云函数事件仍只传任务绑定 `fileID` 与元数据。原始照片在撤回、识别完成或明确退出时清理，不恢复 Buffer／Base64／Data URL。新辅助抽赏流程不要求或写入目标赏级，旧草稿字段仅兼容读取。

2026-08-23 V1-F 真实 Provider 基线：保持 `qwen3.7-flash` 浮动别名、`enable_thinking=false`、`response_format=json_object`、`temperature=0`、单图 fileID→5 分钟 URL 和 `max_pixels=6291456`；当前 Prompt 为 `ichi-board-vlm-4.0.3-rc1`，Provider Schema 仍为 `board-provider-extraction-4.0.0-rc1`。6.29MP 是本轮真实控制变量后的生产性能参数，不是 Storage／callFunction 硬限制；官方单图硬上限为 16MP。附加分块图片会让模型在其他赏级发生注意力混淆，已否决；CloudBase/COS 数据万象裁剪可能引入额外付费能力，未启用。真实四图证明当前别名即使零温度仍会产生 Schema／视觉结果波动，模型版本 A/B 必须另行明确批准，不能静默切换。

Provider 协议升级为单一显式语义表示：`ticketPattern` 只接受 `empty/prefix/full/irregular/unknown`，pattern 专属证据使用严格 integer 或 null，禁止数字字符串和 `Number(null)`。CloudBase 在 raw tier 层先求 pasted，再执行 NFKC／trim／标签规范、字母编号父级求和和特殊赏视觉顺序编号。`RecognitionContract` 若发生不兼容变化必须升版并保留旧草稿／记录解析；不得静默重解释旧字段。性能诊断记录校正尺寸／字节、上传、临时 URL、provider request/total、JSON parse、AJV、normalize、云函数 total、prompt/model/max_pixels 与 Provider usage，不记录密钥或图片。

1. V1 使用最小可运行架构，并接入支撑可信身份、每日识别配额、本人私有版面候选和删除所需的 CloudBase 后端；公共地图、来源审核和发布仍留在 V2。
2. V1-26 最初以低保真启动，但 V1-29 验收后的 Next.js 手机优先网页现为完整页面、行为、内容、组件、视觉和动效基线；微信小程序是最终产品交付端，必须整套一比一照搬到 WXML/WXSS、TypeScript 与微信平台能力，只允许必要的语法和 API 平台适配。
3. 确定性计算独立于页面和平台，能够单独测试。
4. 平台能力通过适配层封装，不在页面散落 `wx.*`、`window` 或 `document`。
5. V1 引入微信身份映射、服务端会话、原子每日配额、识别网关、初始结构化版面快照、抽赏事实和最终推导快照；完整工作台跨设备同步与公共地图写入不进入 V1。
6. 版面照片和赏票照片均以二进制写入私有对象目录，同步云函数事件只传任务绑定 `fileID`；云函数用 `getTempFileURL` 取得短时 HTTPS URL并直接作为百炼 `image_url`，不下载 Buffer、不转 Base64／Data URL。新版面照片和新赏票证据均按临时对象策略清理，不保存新的长期 `originalEvidenceFileId`；历史记录中的既有引用只由兼容读取与删除链处理，不进入公共地图。
7. 版本号、依赖和云资源必须在实施步骤中形成可复现锁文件和决策记录。
8. ICHI 账号只服务认证、配额、记录归属、私有状态、撤回／删除和审计；V1／V2 都不建设论坛、发帖、评论、关注、私信、群组或用户动态流。

## 2. 仓库与工具链

| 层 | 选择 | 理由 |
| --- | --- | --- |
| 工作区 | pnpm workspace | 共享计算包、客户端和测试配置，依赖边界清晰 |
| 语言 | TypeScript strict | 领域模型、计算、版面定义、网页与平台适配接口共享 |
| 代码质量 | ESLint + Prettier | 统一静态检查和格式化 |
| 单元测试 | Vitest | 适合纯 TypeScript 计算和状态模块 |
| 提交策略 | 区块人工验收后的检查点提交 | step 保持小而可验证，区块统一收口；仅在用户要求时提交 |

V1-A 锁定 Node.js 24.11、pnpm 11.9.0、TypeScript 6.0.3、Vitest 4.1.10、ESLint 10.8.0、Prettier 3.9.6 与 typescript-eslint 8.66.0。TypeScript 暂不采用 7.x，因为当前 typescript-eslint 的 peer 范围仍小于 6.1；版本证据与升级条件见 `docs/decisions/v1-toolchain-and-recognition.md`。

## 3. V1 客户端

| 层 | 选择 | 职责 |
| --- | --- | --- |
| 完整设计基线 | Next.js App Router + React + TypeScript | 承载已经验收的全部小程序页面、内容、组件、响应式布局、视觉、动效和交互 |
| 最终客户端 | 微信小程序 TypeScript + WXML/WXSS | 一比一照搬完整网页基线，接入微信平台能力并完成最终真机验证 |
| 视图与样式 | 网页 HTML/CSS/Design Tokens + 小程序 WXML/WXSS | 按整页结构、字体、字号、图标、字符样式、间距、布局、色彩和动效一比一照搬；不把 Figma 或截图当作 UI，也不在旧小程序壳上二次设计 |
| 状态 | 纯 reducer／状态机 | V1-C 已确认 reducer 足以承载单奖项草稿、原子确认和最近轮次撤销，不引入 Zustand |
| 计算 | 独立 `packages/core` | 概率、期望、成本、守恒、预算、四方案比较和用户硬约束下的最少抽数证明；`board-outlook-v1.1.0` 还以固定事件目录和精确不放回概率生成版面特化的局面可能性。网页只读复用其精确概率与整数金额，不做概率最大化或促抽推荐。Next.js 将该工作区包随应用编译，并将源码 ESM 的 `.js` 引用解析回 TypeScript 源文件 |
| 本地存储 | 版本化 JSON 信封 + 浏览器／微信 Storage 适配层 | 网页用浏览器会话缓存验证流程；小程序 Storage 保存可离线恢复的完整抽赏会话、草稿与本机状态。云端状态只以规范 `recordId` 与同步游标映射，不覆盖本机工作台事实。六位码只作人类可读观察记录码；联网确认后以服务端分配为准，同草稿和重试保持稳定。继续草稿的会话用起始历史数判断是否新增抽取，只有新增后暂存退出才刷新抽赏记录时间 |
| 账号与配额 | CloudBase 微信身份上下文 + 云函数会话 + 文档数据库事务 | 在首次模型识别前建立可信内部 `accountId`，昵称／头像不参与鉴权；普通账号按北京时间每天 5 次可恢复识别结果，使用 `reserve → processing → recognized → committed／released`、一次性任务令牌、幂等键和全项目费用熔断。Provider 成功只保留结构化识别结果；客户端已持久化可恢复 board draft 后，`finalize-board-observation` 才在同一事务内提交预占并增加 used。提供方、Schema、Normalize、无可用票池、本地持久化或生成失败均释放，崩溃由租约回收；客户端 Storage 不承担配额事实 |
| 版面语法 | 随包发布的 TypeScript／JSON Schema 注册表 | 预置 A—Z 与 SP1—SP4 奖级、券位、价格、特殊项、辅助区块和二维排布；所有单字母赏级的编号款式均归入所属字母，其他特殊赏级保留原标签供用户确认。`derivePrizeClassification` 以本地已核对总券位派生大／中／小赏三档互斥分类，不依赖产品数据或模型结论 |
| 版面识别 | CloudBase 云函数代理 + 阿里云百炼 `qwen3.7-flash` 单次整版多模态识别 | P0 生产回滚后使用已验证的 `ichi-board-vlm-4.0.3-rc1` + `board-provider-extraction-4.0.0-rc1`；v5 因普通真实版面在严格 mode-dependent Provider Schema 上系统性 AJV 失败而退出线上请求路径。模型只返回显式视觉事实，Provider JSON 经严格 AJV 后由 CloudBase 做 tier 数学、A1/A2 合并与 SP 编号。保持 `qwen3.7-flash`、non-thinking `json_object`、temperature 0、单次调用和 `max_pixels=6291456`。v5 Normalize 仅保留兼容读取，不代表线上 Prompt/Schema；NIKKE 实验停止，不以业务 heuristic 补偿模型计数 |
| V1 私有观察 | CloudBase 文档数据库 | 用户确认后幂等保存初始版面快照、模型原始结构化输出、字段修订差异、模型／提示／Schema／归一化版本、来源路径、`observedAt`、`serverReceivedAt`、位置快照、`recordId`、`boardId` 与服务端六位码；辅助抽赏再保存抽取历史、赏票结构化事实和确定性最终快照。两条入口都写入本人私有候选，不提供公共查询 |
| 位置 | 微信前台定位适配层 + CloudBase `GeoPoint`／地理位置索引 | 首次进入版面拍摄前检查并请求前台位置权限；已授权时直接复用且不重复弹出系统授权。拒绝或关闭权限时给出明确设置入口，不开始新的版面拍摄，也不消耗识别额度。成功后获取 GCJ-02 坐标、精度、获取时间、来源路径和同意版本；位置作为结构化字段保存，不嵌入图片 EXIF |
| 识别校正草稿 | 可空 T/U 编辑态 + P 派生 + 提交时领域校验 | 小程序输入阶段以 `null` 明确表示用户已清空的总票数／未贴票数，保留“先删除、再重填”的原生输入习惯；已贴票数只读且仅在 T/U 合法时派生为 `T-U`。空值可写入本机临时识别快照但不能进入 `LocalPrizeState`。只有总票数为正整数、未贴票数为含 `0` 的非负整数且不超过总票数时，才允许生成或上传版面；旧 T/P 草稿仅在守恒合法时迁移为 U |
| 版面渲染 | 网页 React/HTML/CSS 完整页面 + 小程序本地 WXML/WXSS renderer | 识别只返回数据；小程序一比一照搬网页页面并按相同 schema 条件显示随包组件，不下载或执行远程 UI 代码 |
| 图标 | 可访问的 HTML/SVG 本地资源 | 避免不可换色的 AI PNG 图标 |
| 网页基线测试 | Playwright + Vitest + 真实浏览器视口 | 锁定已验收页面行为、交互、视觉和状态，作为小程序照搬的比较基线 |
| 小程序平台测试 | 微信开发者工具 + automator + 真机抽查 | 验证 WXML/WXSS、微信 API、Storage 和最终端行为与完整网页基线一致 |

微信头像的稳定展示使用 `FileSystemManager.saveFileSync` 保存到小程序 `USER_DATA_PATH`，并以云端 `avatarFileId` 作为缓存一致性键；昵称与 ICHI ID 仅作为首帧展示副本写入本地 Storage，随后仍由 `get-my-profile` 覆盖核对。不得把本地缓存用于鉴权、记录归属或配额判断。

V1-A 锁定微信基础库 3.17.0；根仓库、CI 和本地开发保持 Node 24.11。目标 CloudBase 环境的实际函数创建接口不接受 `Nodejs24.11`，用户于 2026-08-18 明确批准把 V1 事件云函数运行时改为平台推荐且实测支持的 `Nodejs20.19`。工程绑定用户提供的小程序 AppID；AppSecret 只允许存在于受控服务端环境变量，不进入仓库或客户端。

V1-F 采用后端优先集成：先在仓库完成资源清单、事件函数和自动验证，再部署 CloudBase 环境并独立调用后端。云函数通过 `cloud.getWXContext()` 取得可信 `APPID/OPENID`，`bootstrap-account` 在事务内静默 find-or-create Account；客户端不要求资料授权即可进入首页和两个新版面入口。用户主动编辑资料时使用当前微信支持的 `button open-type="chooseAvatar"` 与 `input type="nickname"`，不依赖 `wx.getUserProfile` 自动取回资料。资料更新函数为 owner-scoped 接口，支持 nickname-only 与 avatar-only 合并更新；内部 `accountId`、ICHI ID、记录归属和配额不随资料改变。头像显示优先使用同一 owner 的私有 CloudBase `avatarFileId`，不存在时使用包体默认头像；短时 HTTPS URL 仅作兼容回退。配额摘要由 `get-quota-status` 返回 `limit/used/reserved/remaining/dateKey/resetAt`；两个新版面入口先执行该只读检查，只有冻结照片确认后才由 `reserve-recognition` 预占，最终 `used` 仍只由成功建立可恢复版面后的 `finalize-board-observation` 提交。

2026-08-22 当前运行补充：冻结照片对勾只执行 `get-quota-status` 只读可用性检查并进入独立校正页；本地校正输出成功后才执行唯一一次 `reserve-recognition`。客户端终态失败通过 `release-recognition` 只释放仍为 `reserved` 的任务，重复调用幂等；云函数仍在处理时，客户端等待调用 Promise 真正结束后再补删 Storage 对象。版面 Prompt／Provider Schema 已部署为 `4.0.0-rc1` ticketPattern 单一语义协议，特殊赏支持 SP1—SP32。以下 3.0、2400px 与多版面模型选择段落只记录旧运行基线；当前模型输入是约 1800px／JPEG 82 的本地透视校正单版面，模型不再搜索或选择多版面。

小程序一番赏赏票不引入 React 或 `react-spring` 运行时，也不恢复真机曾失效的 WXS／3D Page Curl。`platform/ticket-peel-motion.ts` 以纯 TypeScript 复刻用户指定 React Spring 教程的运动语义：按滑动速度投影水平位移，并以教程未覆写的 React Spring 默认 `tension: 170 / friction: 26` 生成阻尼弹簧回弹／甩出帧；`pages/home/index.ts` 的页面级捕获触摸链负责喂入位移、速度和松手状态。WXML/WXSS 使用教程同构的裁切窗口、纸背和前纸三层插值；外层轨道把视觉限制在当前赏票范围，不提升活动票卡层级或覆盖相邻奖票。完整甩出后才原子提交票池并显示轻提醒，纸背随即在 `80ms` 内淡出并清理。该实现不新增第三方依赖，保持可单测、可随包发布，并继续让局面可能性、撤回和抽取记录独立可点击。

版面识别的已批准主模型为阿里云百炼 `qwen3.7-flash`。一次请求只发送一张完整照片的 CloudBase 短时 HTTPS URL与 `ichi-board-vlm-3.0.0-rc1` 固定 User Message，设置 `enable_thinking=false`、`temperature=0`、提供方 `json_object` 模式、`max_pixels=4194304`，并关闭工具与联网，不设置可能截断 JSON 的 `max_tokens`。小程序只提供页内相机；传感器输出先按当前取景框宽高比做同中心 `aspect-fill` 裁切，再把最长边控制在约 `2400px`、JPEG quality 约 `85`，文件仍超过约 `8 MiB` 性能目标才降到 `2048px/82`，不得把 6MB 当作 Storage 硬限制。第一次快门冻结裁切后的所见图，第二次对勾才上传，撤回会删除临时图并恢复相机。云函数通过 `getTempFileURL(maxAge=300s)` 只传 URL 字符串，不下载 Buffer、不转 Base64／Data URL。模型返回由服务端 AJV 以 `board-provider-extraction-3.0.0-rc1` 拒绝额外或非法字段，再经提供方适配层 Normalize 为小程序 `RecognitionContract 1.0.0`。每赏草稿携带 `totalSlotsEvidence` 与守恒的 `slotRows`；确定性代码优先汇总逐排总数／已贴／空位／unknown。空的 `openPositions` 不代表没有空位，`physical_ticket_count` 只代表容量证据，除非完整逐排证据明确没有 open／unknown，否则不得自动令 `pasted=total`。代码继续执行中文 IP 别名规范、可选主题拆分、A—Z 编号分层合并、SP1—SP4、类型／坐标、票位状态、计数守恒、IP／价格问题和领域派生；缺失已贴数必须转 null，不能静默当成零；已确认的 `pastedTickets` 在计数守恒时始终映射到可编辑草稿，`unknownSlots>0` 只让余票保持未决并降低置信。CloudBase 仍以函数 `60s`、模型 `45s`、客户端 `55s` 作为失败闭合上限，性能目标为端到端 `P50<5s / P90<8s / P95<10s`，并分别记录 claim、临时 URL、provider、JSON parse、schema、normalize、persist 和 total 的纯数字耗时及 token。`qwen3.7-plus` 的严格结构兜底只有在图像 strict Schema 接口、黄金样本收益、费用门和用户批准全部完成后才可开启；当前正常链最多调用一次模型。图片只存在于客户端临时文件、私有 `recognition-temp/` 对象、5 分钟签名 URL和提供方调用链，不写数据库、日志、审计或备份，响应后立即双删。日志禁止响应正文、图片 URL、签名、提示、请求体、Header、Workspace 或密钥，只允许请求 ID、固定错误分类、版本、阶段耗时和 token。长期保存的只有模型结构化结果、用户修订差异和守恒结果。

当前执行补充：上一段中的图片性能边界已经明确为“约 8 MiB 性能目标、20 MiB Provider 硬边界，超过即拒绝”；任何仍写作“超 6 MiB 才是平台硬失败”的旧段落均为历史记录，不能用于实现或验收。识别事件、共享位置领域和 `recognition-contract` image acquisition 均为 camera-only，生产输入拒绝 album。

赏票真实性核验复用已验证可启动的 `recognize-draw-tickets` CloudBase 函数身份与 Nodejs20.19／依赖层配置，但其旧聚合协议已被完整替换。独立 `prize-ticket-verification-v1` Prompt 和 `PrizeTicketVerificationProviderV1` Schema 不复用版面识别或旧赏票聚合协议。客户端仅上传 camera-only 临时图、`recordId`、`boardId` 与单调 `submissionVersion`；Qwen `qwen3.7-flash`（non-thinking、temperature 0、json_object）只枚举每张物理票的 `tickets[]` 与可空 tier，绝不接收 expected counts、抽取历史或业务通过条件。CloudBase 从已持久化的 authoritative draw events 重建 expected，NFKC/空白/大小写规范化 observed ticket item 后自行计数并 exact reconcile；unknown → `NEEDS_REVIEW`，未见有效票 → `INVALID_EVIDENCE`，技术故障 → `PROVIDER_FAILED`，只有 total、所有 tier 和无额外 tier 均 exact 才为 `VERIFIED`。每个 `recordId + boardId + submissionVersion` 为不可变幂等版本；新版本可并行提交，旧版本完成只保存 `SUPERSEDED` 结果，不能覆盖新版。v1 原始 camera evidence 与首次可信 metadata 保留；v2+ gallery evidence 只作重试且不得覆盖原始地点／网络／capturedAt，完成后可按临时证据策略清理。

多版面照片仍保持单次模型调用。模型先返回所有物理版面的透视四角、完整度与细节，并按固定优先级只细读一个主版面；服务端用透视多边形占图面积、中心距离、完整度和细节按 `40%／35%／20%／5%` 重新评分，最低面积 `0.12`、最低总分 `0.55`、第一候选领先差 `0.10`。不足门槛、选择不一致或主版面不完整时要求裁切／重拍，不追加第二次模型调用，也不把邻版或货架信息并入结果。

票位识别同时返回逐槽 `open／covered／unknown` 与独立 `sequenceEvidence`。后者记录可见印刷序号、编号方向、槽位坐标、覆盖是否连续和边界序号，只能作为逐槽视觉结果的辅助校验。服务端至少要求两个一致序号或明确说明、可靠槽位对齐、连续可见覆盖和 `0.85` 置信度；单一序号不得生成已贴数量，序号与逐槽状态冲突时保留原观察并要求人工校正。

特殊赏在版面 Schema、旧代理兼容提示、OCR 标签回填和小程序数据链中统一规范化为 `SP1`—`SP4`，顺序依据版面中赏级声明边界框的上沿、再按左沿，不允许折叠为 `S`。A1／A2 等编号款式归入同一个 A 赏；第 5 个及后续独立特殊赏使用 `OTHER`、保留 `rawLabel` 并进入人工核对。小程序的识别校正、目标多选、工作台、抽取、撤销和本机记录继续使用规范化 tier 字符串，无需为 SP 新建页面组件；SP1—SP4 与用户确认后的其他特殊赏级按已核对总票位应用 `≤5／6—9／≥10` 阈值，分别进入大／中／小赏，其中只有大赏进入 `GRAND PRIZES`，其余进入 `NORMAL PRIZES`。G—Z 继续固定为小赏。

字母编号规范化优先于空间分区：所有 `A1…Z9…` 形式都先归入所属字母赏级；即使 D1／D2 分别拥有独立奖品面板和票区，也只形成一个 D 赏，多个票区使用同一 owner 并对可靠 open／covered／unknown 槽位分别求和。只有不匹配字母编号款式的独立特殊赏才能占用 SP1—SP4。

小程序开发／体验／正式环境统一调用真实识别代理，均不提供固定票池回退。照片以二进制直传私有 `recognition-temp/{jobId}/`，事件只携带与一次性任务绑定的 `fileID`、尺寸和媒体元数据，从而绕开同步事件上限。客户端对长边超过 `2400px` 的照片使用 quality `85` 轻处理，仍超过约 `8 MiB` 性能目标时才用 `2048px/82` 兜底；压缩后仍超过 `20 MiB` Provider 硬边界即拒绝，不得把 6 MiB 云函数事件限制套到 Storage 上传。云函数以 `getTempFileURL(maxAge=300s)` 取得 HTTPS URL并直接交给百炼，不读取图片字节。千问视觉输入使用 `max_pixels=4194304`，JSON Object 请求不设置会截断完整 JSON 的 `max_tokens`；客户端和云函数在 `finally` 双删本机／云端临时文件，`recognition-temp/` 再配置 COS 支持的最短 `1` 天过期删除兜底。该规则按日异步执行，不得写成精确 24 小时删除承诺。

生产关键维护由 CloudBase 定时触发云函数承担：过期配额预占释放每 `5` 分钟、卡住识别／保存任务协调每 `10` 分钟、私有 V2 资格报告每小时生成、结构化删除重试每日执行。配额使用北京时间 `dateKey`，不需要在午夜遍历所有账号“重置次数”。Codex 定时任务中的 Luna 只作为 V2 可选治理复核器：影子运行阶段只读受限队列并写建议，不发布、不修改公共事实；即使 Codex 未运行，CloudBase 的配额、删除和确定性队列也必须正常工作。

V1-C 锁定 Storage schema 1、会话 schema 1 与版面快照 schema 1。当前版面快照只接受随包的版面 schema 1.0.0、组件注册表 `v1-saturated-board-components` 和识别契约 1.0.0；支持旧 V0 本地包装迁移，未知版本或迁移失败时保留最近可用内存／版面快照，不联网拉取兼容代码。

生产锁定前必须按 `docs/decisions/v1-board-ocr-model-selection.md` 与 `docs/decisions/v1-board-recognition-prompt-contract.md` 跑同一授权黄金样本；当前 `qwen3.7-flash`、`ichi-board-vlm-3.0.0-rc1` 和 `board-provider-extraction-3.0.0-rc1` 是单模型生产候选，开发环境临时 URL真实烟测已经通过，仍待授权黄金样本准确率和 P95 门。

V1-F 当前识别与送审技术覆盖规则：

- 版面模型协议升级为 `ichi-board-vlm-3.0.0-rc1` 与 `board-provider-extraction-3.0.0-rc1`，新增直接的 `ipName/ipRawText/themeName` 与 `pastedSlots`。提供方输出的完整 `slotRows` 是唯一生产计数证据；不再要求空位坐标，`openPositions: []` 不参与推导，`physical_ticket_count` 也不再自动令 `pastedSlots = totalSlots`。只有完整逐行计数明确全覆盖时才接受全贴满。
- 相机拍摄采用“实时预览 → 冻结可见裁切图 → 撤回或二次确认”的确认态流程；生产入口不调用 `wx.chooseMedia`。“进入辅助抽赏／仅上传版面”点击后先刷新账号与只读额度，耗尽时不请求位置／相机权限且不挂载拍摄页；额度可用才继续位置与相机门禁。冻结照片对勾创建唯一权威 reservation 并进入 fileID 识别链。识别页使用真实事件门控的四段确定型环形进度：照片准备、请求发出、云端返回、本地契约与票池草稿完成；阶段内平滑增长只能到本段上限。
- 赏票取证使用独立固定协议和唯一生产入口 `recognize-draw-tickets`，不复用版面提示。客户端把 v1 相机原图保存到系统相册，同时按约 `2048px` 长边／JPEG 82 的性能预算生成识别图并上传 Storage；相册保存尝试与传输预处理并行，但前者必须结束后才允许离开拍摄页，同步事件只传 `fileID` 与元数据。服务端幂等建立 PENDING 后页面立即进入“我上传的版面”；可信抽赏事件同步以及短时 HTTPS URL、`qwen3.7-flash` 非思考 JSON Object、AJV 与 exact reconciliation 均在可恢复后台核验中完成。AI 只产生“一张物理票一个 item”的 `tickets[]` 视觉证据；服务端以 `recordId + boardId + submissionVersion` 校验归属和幂等，从 authoritative draw events 重建 expected 后自行 canonicalize、count 与 exact reconcile。v1 首次 evidence 保留用于恢复；观察记录只让当前版本更新当前状态，旧版本完成时不得覆盖新版本。
- `recognize-draw-tickets action=submit` 是赏票证据的单一 durable PENDING 边界：同一 `drawSubmissions` 版本文档保存 Storage fileID、authoritative draw events、确定性 `finalSnapshot`、备注与 `submittedAt`，避免把大型 observation 再次扩写或依赖 `finalize-draw-update` 前置成功。`action=verify` 从该版本文档读取 expected 后才签发临时 URL并调用 Provider；同版本重试幂等，旧 PENDING 可携本机历史补齐缺失权威事实。`get-my-records` 将 observation 的位置／身份／初始版面与当前 draw submission 的最终版面／上传时间／核验状态合并为私有记录投影。
- 记录状态从存储位置与业务阶段解耦：本地未提交为 `local`／“待上传”，真实送审为 `pending-review`／“待核对”，核对完成为 `uploaded`／“已上传”。CloudBase 私有保存本身不等于用户已经上传版面证据。

### 3.1 V1 不使用

- 完整抽赏会话、逐抽历史和赏票取证的跨设备云同步；
- 地图和外部内容聚合；
- 商家 API、库存、订单或支付；
- 产品样本目录、用户上传的照片库或公共版面库；V1 私有结构化候选不能被公共读取；
- 远程组件、远程脚本／样式、运行时下载可执行 UI 代码；
- 大型跨端 UI 框架；Figma 作为运行时 UI 或验收唯一载体。

## 4. 设计与视觉流程

| 工具 | 职责 |
| --- | --- |
| Next.js 网页 | V1 及后续 UI 的页面行为、组件、响应式布局和视觉基线的可运行实现 |
| Figma | 可选的设计参考或网页 UI 辅助，不是交付物或门禁 |
| GPT Image / image2 | 基于 HTML 布局的视觉方向探索、插画、背景、纹理和非交互素材；产出必须转译为真实 React/HTML/CSS，不直接作为交互组件 |
| Playwright | 浏览器交互、固定视口截图、视觉回归和控制台检查 |
| 微信开发者工具 | 已完成的小程序平台 API、Storage 和真机验证资产的维护 |

V2 的共享核对继续在 Next.js 网页中先实现和验收：先完成收手、同意、相机框、赏票构图引导、地点／备注和提交核对的可验收 UI，不调用真实相机、识别、定位或上传。用户提交后不显示独立的核对结果或待发布预览页面，而是在一番赏版面显示中央“已提交／后台正在核对本次提交”状态框；用户可继续留在版面，或主动退出返回导入版面。真实链路复用 V1 的临时图片多模态识别，只保存用户确认的结构化赏票事实、抽取历史、差异、位置和推导结果；不新增照片对象存储。V2-A 仍负责合法供给、后台任务和审核队列。

网页代码和测试是运行事实；Figma 若被使用，只作为可选参考，不能覆盖已批准产品需求或浏览器行为。image2 的输出是视觉设计输入，不是运行时代码或交互组件来源。V1-29 当前不以 image2 作为视觉基线：用户提供的 `网页 ui.html` 是唯一页面壳，并已形成完整 Next.js 页面基线。跨页面的参数化设计规则由 `docs/design/v1-29-ui-design-tokens.md` 管理，并通过原壳响应注入层复用；它不引入新的 UI 运行时或组件库。V1-E 不在旧小程序壳上继续设计，不得以平台适配为由重排、简化或替换任何已验收视觉元素；只进行 HTML/CSS/JavaScript 到 WXML/WXSS/TypeScript 的语法级映射及浏览器 API 到微信 API 的必要适配。

V1-E 的版面拍摄页和共享取证“拍摄赏票”页均使用微信原生 `<camera>` 作为各自既有取景区的实时后置摄像头渲染层；进入对应页面／模态即由相机组件申请 `scope.camera`，拍摄操作统一通过 `wx.createCameraContext().takePhoto()` 在当前页面内完成。产品流程不调用 `wx.chooseMedia`，不提供相册输入。相机错误以本次挂载代际为边界，只有当前代际的真实失败才显示恢复入口，后到的 ready 必须清除过期错误。`takePhoto` 的传感器输出通过页面 `type="2d"` 隐藏画布，按实时取景节点的宽高比和同一中心做 `aspect-fill` 裁切，输出 JPEG 最长边不超过 `2400px`，保证上传内容不超出用户所见取景范围。版面照片第一次快门后只冻结并显示裁切结果，第二次对勾只读检查额度并进入校正页；撤回删除冻结图并恢复实时相机。实时与冻结状态使用同一固定三槽控制几何，左侧撤回槽始终存在、只切换可用性，中心快门／对勾不得位移。裁切成功立即尝试删除原始传感器临时图；识别 finally 删除裁切图，云函数 finally 删除临时对象。页面业务仍只依赖平台适配层，不散落拍摄 API。版面取景区的四个构图角标必须直接使用 `<camera>` 内的四个独立 `cover-image`，每个本地透明 PNG 固化自己的弧线方向并以 `48×48px` 盒子显示；不依赖真机原生覆盖层对 SVG 的解码，也不以嵌套 `cover-view` 的方向性边框、多值圆角或中间自适应容器构造角标。
相机 `loading` 期间拍摄按钮保持可接收事件：第一次点击写入一次性待拍意图，`bindinitdone` 到达后自动调用 `takePhoto`；只有正在实际拍摄或相机明确拒绝／不可用时才禁用。新版面入口首击立即导航并挂载相机，同时记录 tap、navigation request、页面 onLoad、camera init 与 ready 的开发时序；账号／额度预取可并行但不得阻塞相机，位置不在识别入口请求。

V1-E 的赏票撕揭由页面逻辑层处理触摸，避免原生 `scroll-view` 与 WXS 捕获链在真机上争抢手势。高频跟手直接同步教程的 `right / width / left` 三个水平插值；松手动画由纯函数一次生成阻尼弹簧帧，再以约 `16ms` 定时推进。速度只增强向右揭开，不放大回滑；阈值使用最终触点与最终速度重新投影，避免用户减速停在半程时沿用旧速度误抽。弹簧甩出到 `145%` 并完整露出 `OPENED` 后才提交抽取，回弹路径不改变领域状态。

## 5. V2 增量技术（当前草案，受门禁约束）

V2 只有合法数据源、用户价值、地图／CloudBase 可行性和产品决策全部通过对应 Evidence/Product Gates 后才锁定云资源。

下表复用 V1 的微信身份、账号、私有观察和删除基础；它是方向清单，不代表资源已存在或已选型。提醒、订阅消息、结果海报、公开图片／自由文本和自动 CanonicalBoard 默认延后，不属于当前 V2 completion scope。

| 层 | 首选方向 | 说明 |
| --- | --- | --- |
| 服务端 | 复用 V1 CloudBase 云函数与受控治理接口 | V2 规划 service-only consent、PublicMapLead projector、minimal moderation 和 bounded API；客户端与模型不能直接写公开 read model |
| 认证 | 复用 V1 `getWXContext()` 静默 Account 与 ICHI 服务端会话 | Profile optional；V1 已有公开 `ICHI ID` 与资料编辑，V2 只决定最小 public exposure；所有地图贡献由服务端可信身份确定 `ownerAccountId` |
| 数据库 | CloudBase 文档数据库；新增资源未批准 | 复用 V1 private resources；`PublicMapLead`、consent、moderation/takedown 与 query resources 都只是 blocked draft 候选。CanonicalBoard、WatchRule、NotificationDelivery 均未批准 |
| 对象存储 | V1 只使用私有 `recognition-temp/` 临时传输前缀，不建立版面图片资产库；V2 是否需要非版面资产另行评审 | 临时对象正常链路立即删除，异常孤儿对象使用 COS 最短 `1` 天过期删除且没有数据库引用；V2 地图默认只显示结构化文字、数值和确定性图表，不因为地图发布而补存 V1 原照片 |
| 地图 | Provider 未选；先做目标环境 spike | 必须验证许可、坐标系、geo/index、viewport limits、clustering、成本、包体和降级；不得把候选 provider 写成既定选型 |
| 提醒 | `UNPLANNED` | 旧草案曾建议延后；是否进入未来 V2 由完整 planning 决定，并需要权限、模板、频控、真机和运营任务 |
| 分享 | V1 三 Tab 分享可复用；地图详情分享未规划 | 路由、公开 ID 和 allowlist 均待完整 V2 planning；结果海报不是当前已批准范围 |
| 公开资格 | Source-specific rights + common Public Eligibility | V1 私有 APPROVED 不授予公开权利；玩家来源仍需 owner authorization，NETWORK_SOURCE 仍需使用依据、网络来源标签与 takedown；所有来源共用 Verification/Freshness/field/venue/privacy/moderation gate，不做 bulk auto-publication |
| Location | V1 只有私有 device evidence | 设备坐标不能直接作为公开地点；venue/POI、公开坐标/精度和迁移均待完整 V2 planning |
| 后台 | 最小 eligibility/review/hide/audit operation | 结构化无图无备注 MVP 不预建 advanced appeal/SLA；公开字段变丰富时再扩展 |
| 监控 | 云函数日志、错误告警、删除任务审计 | 重点监控来源、时效、下线和抽取失败 |
| 社交能力 | 不引入 | V2 不建立帖子、评论、关注、私信、群组、动态流或社交图谱；已有点赞计数只保留数据占位，真实互动需另行批准 |

## 6. V3 增量技术

V3 对事务、审计和证据存储要求显著提高，启动前重新做架构评审。

| 层 | 推荐方向 | 说明 |
| --- | --- | --- |
| 身份扩展 | 复用 V2 `accountId` 与会话体系 | V3 不重新发明账号；只增加多人票池绑定、证据等级、版本权限和治理角色 |
| 事件存储 | PostgreSQL 优先评估 | 版本链、并发控制、审核状态和可重放事件更适合事务数据库 |
| 对象存储 | 私有原图桶 + 公开脱敏图桶 | 生命周期、权限和删除策略分离 |
| 异步任务 | 队列／任务系统 | 图片识别、脱敏、重复检测、审核和版本重放 |
| 图片处理 | OCR／视觉识别 + 敏感信息检测 + 感知哈希 | 模型只生成审核草稿，不直接改变公共状态 |
| 审核 | 机器规则 + 内部人工台 + 可选社区复核 | 高影响提交提高门槛 |
| 可观测 | 审核漏斗、冲突、重放、删除和滥用告警 | 所有公共变更可审计 |

CloudBase 是否继续承担 V3 数据层，不预先决定；在 V3 架构步骤用并发、回退和成本基准评估。

## 7. 规划代码结构

```text
apps/
  web/                    Next.js 完整页面与交互批准基线
  client/                 微信小程序最终客户端基座
  review-console/         V2/V3 才创建的内部审核端
packages/
  core/                   领域模型与确定性计算
  session/                票池会话、轮次和撤销规则
  storage/                平台无关存储核心与浏览器／微信适配接口
  board-layout/           版面语法 schema、饱和组件注册表和推导门禁
  recognition-contract/   图像识别请求、字段置信、二维区块和校正草稿契约
  design-tokens/          预留给跨应用设计参考的共享 Token；V1-D 使用 `apps/web/app/tokens.css`
  ui/                     预留跨应用组件包；V1-D 使用 `apps/web/app/ui/` 的 Next.js 网页内置基础与版面组件
services/
  cloudbase/              V1 提供身份、配额、识别和私有观察；V2/V3 公共治理能力仍受决策门限制
tests/
  fixtures/               公式与票池固定测试向量
  e2e/                    Next.js 网页核心流程
  recognition/            经授权版面样本、字段标注和评估基线
  visual/                 网页多视口视觉回归基线
docs/
  decisions/              架构和平台决策记录
  qa/                     人工验收证据
```

这里只是规划，不代表目录已经存在。真实状态以 `memory-bank/architecture.md` 为准。

## 8. 发布策略

### V1

- Next.js 手机优先网页已经交付并通过整套页面验收，后续将全部页面一比一照搬为微信小程序；
- 在微信开发者工具／真机逐页验证结构、视觉、动效、交互和状态与网页批准基线一致；
- 版面语法发布需要 schema、A—Z／SP1—SP4 注册表、编号款式合并、特殊赏级原文保留、推导门禁和回退验证；
- 最小微信账号、每日 5 次有效识别配额、初始／最终结构化观察、抽赏差量、服务端六位码、本人查询和删除必须通过权限、并发、幂等和真机验证；
- 识别服务失败不影响已建会话的本地记录、撤销和删除；开发／体验／正式环境均失败闭合到“无法建立票池”，不允许固定测试票池替代真实响应。

### V2

- 当前路线为TASK21 Pre-Pilot closure + Founder Closed Pilot waiver → TASK22生产后端整合/统一PLAYER+NETWORK pipeline/50上海/300全国/最终生产回归与actual publication。
- PLAYER保持trusted owner、SHARE、适用地图条例、独立逐记录门；NETWORK不套用PLAYER consent，但须Founder review、item-level rights/provenance/curator/takedown与共用public eligibility。
- 生产资源、deploy、bridge/migration/data ingestion、Git PR/merge、微信upload/review/publish及tag各自独立授权；必须有exact diff、artifact/SHA、read-back和rollback。实际PUBLISHED后才可建immutable tag。
- 原封闭试验不再是mandatory gate；waiver不替代生产security/privacy/true-device/smoke/cost证据。

### V3

- 先白名单贡献与人工审核；
- 证明身份绑定、冲突和回退可靠后再扩大范围。

## 9. 需要在后续区块锁定的决策（V1 条目为历史）

> 本节的 V1-E/F 未决项及后续 V2 gates 都是历史快照；当前只执行 `implementation-plan.md` 的 V1 truth human-review gate。

- V1-E/F 锁定完整网页基线到小程序的一比一照搬、平台映射和验证边界；
- 取得经授权真实版面图片后，锁定 OCR 的真实准确率基线，以及是否需要更换或增加多模态服务；V1-C 合成契约基线不替代此评估；
- V1-F 已锁定账号先于识别、两条入口都要求本次位置、照片绝不持久化、初始结构化快照与抽赏后差量推导、账号／记录删除级联，以及“我的记录／我上传的版面”的待上传／待核对／已上传状态文案；百炼凭据已经在开发环境完成，具体费用熔断线仍需用户批准；
- V2 锁定 public audience/fields、location/precision、供给 tranche、versioned historical+future map authorization、completion scope、map provider、geo/index、API/query/rate/cost/package 和 release privacy boundary；
- 订阅消息、海报、公开图片／自由文本与额外模型默认延后，只有 scope gate 明确恢复后再选型；
- V3 是否迁移到 PostgreSQL 与独立对象存储；
- Next.js 完整网页基线与识别服务的验证、构建和回归流程；微信小程序一比一照搬、构建、真机验证和发布流程在 V1-E/F 完成。
# 2026-09-19 TASK-V2-17 地图实现基线（历史，已被 2026-09-20 重建取代）

微信原生 `<map>` 继续负责 camera、地理坐标和手势；聚合使用本地固定三级 hierarchy，不引入 Leaflet、Supercluster 或新的地图 SDK。`regionchange` 只在 end 阶段读取 scale/region 并触发一次投影。split/merge 过渡使用 map 内 `cover-view` layer 的 CSS transition ghost；不使用 requestAnimationFrame、setInterval 或 `translateMarker` 作为核心动画。最大 zoom 的相同坐标 marker 使用稳定的 overlap stack + 业务选择器，真实经纬度永不被视觉布局改写。
