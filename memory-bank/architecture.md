# ICHI Architecture

2026-08-28 V1 Release Source Freeze：`docs/delivery/v1-release-freeze-manifest.md` 是 V1 候选源码冻结清单，记录 parent HEAD、CloudBase/Storage 生产边界、R2/H0 冻结哈希、客户端发布状态和本轮禁止动作；manifest 所在提交自身就是 freeze revision，避免把提交 SHA 写回同一提交造成循环 amend。仓库外 `/tmp` 快照和 dirty-path classification 只承担恢复／审计，不进入发布源码。Release commit 允许工作树继续保留明确排除的 POST_V1、generated/temp、旁支工具和低置信文件，不以 `git status` 清零作为完成条件。

2026-08-28 V1 Storage 权限与 orphan-proofing 收口：生产 Storage 使用 `CUSTOM` 客户端规则。`profile-avatars/` 仅 object owner 可在小程序端读写／删除；`recognition-temp/` 客户端读取恒拒绝，仅 object owner 可写入／删除；其他路径客户端恒拒绝，CloudBase 控制台和服务端不受客户端规则约束。底层 COS lifecycle `ichi-v1-recognition-temp-expire-24h` 已启用并读回，Filter 仅为 `recognition-temp/`、Expiration 为最短 `1` 天，长期头像前缀不命中。正常链即时双删、失败持久化为 `storage-object` deletion job、10 分钟／每日补偿与平台 1 天兜底形成分层清理；上传成功但服务端尚未登记即崩溃的对象不再依赖人工审计发现。只读审计仍不自动删除未知对象，未引用头像无论年龄都归类 `UNKNOWN_DO_NOT_DELETE`。

2026-08-28 V1 Storage 生命周期：`profile-avatars/` 是正式长期资产前缀，`profiles.avatarFileId` 是持久事实；`get-my-profile` 由云函数签发 5 分钟 URL，同时小程序以 `avatarFileId` 为版本键将图片下载并保存到 `USER_DATA_PATH`，元数据写入现有 account display cache，切页／重启优先读本地文件。头像 object key 每次随机生成；新 profile 引用事务成功后才删除旧对象，失败以确定性 `storage-object` deletion job 补偿；未绑定上传和账号删除复用同一保护逻辑，清理器遇到仍被 profile 引用的头像只完成为 `ACTIVE_PROFILE_REFERENCE`，不会删除。`recognition-temp/` 的版面与赏票仍是临时传输资产：版面由客户端和 `recognize-board` 双重 finally 删除，双重删除失败时由 `recognize-board` 创建持久 cleanup job；赏票从 submit 起建立 50 分钟 retention job，终态同步删除或由每 10 分钟 `reconcile-stuck-jobs` 和每日 `retry-deletions` 补偿；正式 R2 observation/draw projection 不保存长期图片引用。`scripts/audit-cloudbase-storage.mjs` 只读关联 Storage、四类数据库引用、deletion job 与本地 Golden 来源，未知对象永不自动删除。生产遗留的两张 Golden crop 与一张无数据库关联的历史赏票 orphan 已定点删除，当前仅剩一张被 profile 正式引用的头像。平台级 1 天生命周期已在最终 Storage Closure 配置并 read-back，原结构缺口已关闭。

2026-08-28 V1 Closure Step 1 三函数生产制品追平：仅将当前生成部署物中的 `finalize-board-observation`、`delete-my-record`、`retry-deletions` 更新到 `cloud1-d7gxqfwv783a1f131`。部署前 action 独立复核纠正了整包审计口径：只有 `finalize-board-observation` 存在 R2 行为缺口；`delete-my-record` 的 action 函数体已与本地逐字节一致，`retry-deletions` 的 action 只存在无语义的格式换行差异。生产 `finalize-board-observation` 现支持 `board-record-r2-1.0.0` 的 owner-scoped 私有保存，保留 `remainingTickets=0` 与手动 `isGrandPrize`，新 R2 正式写入不含 T/P、Provider raw 或长期版面图片引用；三份生产反向下载目录均与本地 release artifact 逐文件一致，`retry-deletions` 的 `daily-deletion-retry` 每日触发器保持启用。`recognize-board` 的修改时间和生产包保持不变，冻结 R2 Prompt/Schema/Resolver SHA 保持不变，Storage 与小程序发布均未处理。

2026-08-27 V1-F 最终上线收口：`cloudbaserc.json` 现在把生产 `recognize-draw-tickets` 的 `PRIZE_TICKET_LOCATION_RADIUS_METERS` 声明为 `200`，部署校验固定核对该值；业务 evaluator 仍只读环境变量且缺失/非法 fail closed。小程序既有 `cloud-records.ts` 与 `local-draw-drafts.ts` presentation adapter 统一把 `LOCATION_FAILED` 投影为无操作的“核验失败”、`PHOTO_FAILED` 投影为“照片核验失败”+重新上传、`NOTE_FAILED` 投影为“备注未通过”+修改备注；WXML 只消费 view model。`finalize-draw-update`、`get-my-records`、`recognize-draw-tickets`、`bind-wechat-profile` 已作为兼容批次上线并反向下载哈希核对；两个文本审核入口的线上包均含 `security.msgSecCheck`，`recognize-board` 未部署且 hash/ModTime 保持不变。

2026-08-27 V1-F 用户文本安全共享边界：新增 `services/cloudbase/shared/text-safety-review.js`，只接受 `PROFILE_NICKNAME`／`MAP_NOTE` 并固定映射微信 `msgSecCheck scene=1/2`，业务层只读取 `{passed}`，任何非明确 pass 或异常都 fail closed。生成式 `bind-wechat-profile` 运行时使用可信 WXContext OPENID 在事务写入前审核昵称，失败返回 `PROFILE_NICKNAME_REVIEW_FAILED` 且不改变 `profiles`；赏票源码 `verify-prize-tickets/index.js` 的 NOTE gate 改为调用同一 helper，仍由线上 `recognize-draw-tickets` 承载，备注重试 checkpoint 不变。部署 manifest／builder 为 `bind-wechat-profile` 与 `recognize-draw-tickets` 分别生成 `security.msgSecCheck` 权限；没有新增线上函数，也没有改变 LOCATION、PHOTO、draw transaction、冻结 R2 或图片生命周期。

2026-08-27 V1-F R2 第二阶段业务适配：小程序识别结果的正式编辑模型收敛为 IP、可选主题、用户手填单抽价格和每赏级 nullable `remainingTickets`；`0` 是合法值，`null` 阻止确认。确认后进入复用页面状态实现的“设定大赏”，全部赏级（含 R=0）由用户手动写入 `isGrandPrize`，工作台不再按数量阈值分类。新本机草稿使用 `board-record-r2-1.0.0`，每赏级保存不可变 `initialRemainingTickets` 与 `isGrandPrize`；抽取只追加 history event，亮灯、剩余数和重进恢复均由基线减对应事件推导，旧 schema 1 仍由 legacy adapter 读取。`cloud-recognition-task.ts`、`shared/domain.js` 与 `runtime.js` 按版本校验并结构化保存 R2 的 `ipName/themeName/pricePerDraw/tiers/location/createdAt/updatedAt`，R2 正式 document 不保存 T/P 或 Provider raw；`cloud-records.ts` 恢复初始基线、手动分类和 authoritative events。`board-record-r2.ts` 只从用户确认后的正式记录投影未来地图字段，不解析 Provider JSON，也不解锁公共地图。版面原图继续遵守既有 ephemeral/no-photo-retention 契约，因此没有把 `boardImageFileID` 加入长期 BoardRecord；赏票 evidence 生命周期保持原样。

2026-08-27 V1-F R2 direct-remaining 第一阶段生产收口：`recognize-board` 的 `$LATEST` 已部署并反向下载验证，远端包含 `r2_direct_remaining` dispatcher、独立 R2 resolver 和固定 R2 Prompt/Schema；远端两项 hash 分别为 `c083066c80999722a2e3207f64654c598e418daf1c51dba35d57abf0291a3462`、`178c3fffb9ad74257ad6fb0123509beacbd011225eae2aa7eb2d648beb690722`。生产配置最终为 `BOARD_RECOGNITION_MODE=r2_direct_remaining`，函数 Nodejs20.19 Active、临时 internal smoke token 缺席；切回 `hybrid_semantic` 即为 H0 rollback。Pokémon 默认路径单次真实 smoke 的 Cloud RequestId 为 `4aaa9cd2-7763-4c10-9cba-50b052e14f4e`，Provider RequestId 为 `234f3f00-ad28-9382-9b03-57b76365ccae`：JSON parse、AJV、resolver、RecognitionContract 与计数不变量均通过，Provider latency 13132ms，A/B 两个直接零值保持存在。CloudBase CLI 日志查询已执行，但 CLS 对 RequestId 和最近 20 条均返回 0 行；调用信封、诊断与远端状态构成当前部署证据。

2026-08-27 V1-F R2 direct-remaining 第一阶段（本地结构）：新增冻结 Prompt `ichi-board-vlm-r2-direct-remaining-1.0.0.txt`、Provider Schema `board-provider-r2-direct-remaining-1.0.0.schema.json` 与独立 `r2-direct-remaining-resolver.js`。`recognize-board/index.js` 的运行时 dispatcher 现包含默认 `r2_direct_remaining`、历史 `r1_remaining` 和唯一回滚 `hybrid_semantic`；R2 Provider AJV 后只执行“非 null Provider R（含 0）优先，否则 observation object 数量回退，否则 null”，再以 nullable T/P 的 `RecognitionContract 1.0.0` 输出。CloudBase 部署构建同时打包 R2、R1 与 H0 固定契约。`platform/board-recognition.ts` 仅在 direct R 与 `slotObservation.openSlots` 一致且 T/P/slot total/covered/unknown 全为 null 时保留 R，避免结果页崩溃或零值丢失；确认门仍要求用户补齐总票数，不提前实现第二阶段业务重构。

2026-08-27 V1-F R1.1 Pokémon 生产验证收口：R1.1 代码已部署但默认生产最终恢复为冻结 H0 `hybrid_semantic`；R1.1 单板 Provider contract、AJV、resolver 和 RecognitionContract 到达成功，但准确率不满足长期上线条件。internal diagnostic 的 Provider RequestId 现在优先取响应 header，并在缺失时回退 provider envelope `id`；该补丁只在恢复 H0 后验证和部署，没有重跑 R1。最终函数 Active/Available、临时令牌缺席、旧 v4 runtime 缺席。

2026-08-27 V1-F R1.1 fixed-contract migration：R1 runtime mode 仍为 `r1_remaining`，但其 Provider-facing 固定契约升级到 `ichi-board-vlm-r1-visible-evidence-1.1.0`／`board-provider-r1-visible-evidence-1.1.0`；历史 R1 1.0 与冻结 H0 文件保持 byte-identical，resolver 与客户端均未改。授权 internal smoke 现在在 JSON parse 或 AJV 失败时也把 raw `message.content`、Provider RequestId、parse 结果、parsed JSON 和完整 AJV errors 返回给受令牌保护的调用方用于本地 artifact 持久化；普通生产请求仍只获得稳定错误信封，日志不记录 raw、签名 URL 或凭据。

2026-08-27 V1-F R1 migration 生产收口：双模式代码已经真实部署到 `recognize-board`，但 R1 在 Pokémon／明日方舟／世界之外三个生产默认烟测上均被 Provider Schema 边界拒绝，因此未形成可交付 R1 业务结果；按安全门实际回滚后，当前生产环境变量固定为 `BOARD_RECOGNITION_MODE=hybrid_semantic`。H0 默认路径已在回滚后重新通过 Provider、normalizer 与 RecognitionContract；临时诊断令牌已从函数环境删除。部署物的运行时 dispatcher 仍只允许 `r1_remaining` 与 `hybrid_semantic`，历史 v4 代码只可作为旧 fixture／迁移工具存在，不能作为 runtime mode。六图 production first pass、comparison 与 stability 没有在失败后继续，相关停止证据与最终状态保存在 `artifacts/r1-production-migration/2026-08-27/`。

2026-08-27 V1-F R1 Visible-Evidence production migration（本地结构已完成，生产状态另见 `progress.md`）：`recognize-board/index.js` 的生产模式白名单现在仅包含 `r1_remaining` 与冻结回滚基线 `hybrid_semantic`；环境变量缺失时默认 R1，任何历史 v4 模式请求均拒绝。R1 使用冻结 Prompt `ichi-board-vlm-r1-visible-evidence-1.0.0.txt` 和 Provider Schema `board-provider-r1-visible-evidence-1.0.0.schema.json`，Provider 只返回可见号码串、方向、出现次数和直接可见字段；`r1-visible-evidence-resolver.js` 作为独立确定性求解器执行号码归一化、候选约束、A1/A2 child-first 聚合、视觉顺序 SP 映射、冲突／未知闭合，并把权威字段定义为 `T=totalTickets`、`U=remainingTickets`，只派生 `P=T-U`。同一函数保留受至少 32 字节临时令牌保护的生产诊断烟测入口；它不能由普通客户端选择模式，部署结束必须移除令牌。小程序 `recognition-flow.ts`、`recognition-generation.ts`、页面 handler 与 WXML 已改为 T/U 可编辑、P 只读派生；旧 T/P 草稿只在本地恢复边界迁移，不再作为新结果的权威写入。

2026-08-26 V1-F 识别结果必填提示：`platform/recognition-flow.ts` 的 `validateRecognitionDraft` 现在是主 IP、单抽价格、直接上传地点备注和动态赏级总票数／已贴票数的字段级校验事实源；同一结果的 `blockingFields/tiers/canConfirm` 同时驱动输入框光晕与“确认并生成版面”门禁。`pages/home` 不再维护独立 `recognitionSubmitReady` 布尔值，价格输入与快照保留 `number | null`，清空不会经 `Number("")` 变成 `0`。原“进入辅助抽赏”继续使用 `.action-glow` 的双 radial renderer；Recognition Result 输入 wrapper 改用持久 `.recognition-input-glow` 闭合圆角矩形 renderer，并与 CTA 共享粉紫色、2px blur、0.85 opacity 和光晕强度。输入有效时同一次 validation render 直接隐藏该层，无 transition、白色 mask、布局占位或输入拦截。

2026-08-26 V1-43D Frozen H0 production：`recognize-board` 已在 `cloud1-d7gxqfwv783a1f131` 部署 byte-equivalent production Prompt `ichi-board-vlm-hybrid-semantic-1.0.0`（SHA-256 `0b4e572378fad8e445f63c6b67997415a1099a0c4ae4d968a6182b545b22226b`）、最小 `board-provider-hybrid-semantic-1.0.0` Schema、独立 `hybrid-semantic-normalize.js` 与 `BOARD_RECOGNITION_MODE=v4|hybrid_semantic` 服务端双栈。生产默认为 `hybrid_semantic`；Hybrid Provider 仅含 direct visual facts，normalizer 独立执行 null/range、child-first、duplicate conflict、SP 顺序、remaining／whole 和 RecognitionContract 1.0.0，未引用实验 transformer、Evidence Primitive 或 v4 `ticketPattern/evidence`。远程 v4 默认、Hybrid 内部三图、Hybrid 生产默认三图、真实 rollback 往返及删令牌后的默认 Hybrid 均通过；世界之外 raw/normalized SP 均为 4。部署期内部 override token 已删除，未授权 override 在 Provider／quota 前拒绝。v4 Prompt、Schema、adapter 与开关保留为 `LEGACY_V4_ROLLBACK`。

2026-08-26 V1-43D Evidence Primitive + Cloud Resolver 隔离实验：新增 `ichi-board-vlm-evidence-primitive-zh-1.0.0-exp`、`board-provider-evidence-primitive-1.0.0-exp`、`experiments/evidence-primitive/` resolver／20 项测试，以及独立 benchmark、processing replay 与报告脚本。Provider 只允许每个 raw tier 返回 `totalTickets` 和四选一 `stateEvidence`；实验 resolver 执行 evidence gate、NFKC／中日数字解析、range/null、child-first 聚合、SP 顺序映射与 RecognitionContract 1.0.0 构造。五图 H0/H1 Quick Pass 的 H1 tier exact 仅 5/58（H0 30/58），pasted coverage 50%（H0 100%），并出现 16 个 evidence conflict、Snow Miku printed-letter 与四 SP preservation regression，故按门禁停止 stability／production control／RC dual stack。生产 v4、客户端、CloudBase 与部署均未改变，实验 Storage 临时对象为 0。

> 本文件只记录真实存在的文件和职责，不把计划目录写成已实现架构。

## 当前状态

2026-08-26 V1-43D Hybrid Semantic Extraction 隔离实验：新增独立 EN／ZH／Frozen ZH Prompt、`board-provider-hybrid-semantic-1.0.0-exp` Schema、`experiments/hybrid-semantic/` adapter／deterministic transformer／9 项测试，以及分阶段 benchmark 和报告生成器。Hybrid Provider 只返回 identity、price 与每个视觉 tier 的 `rawLabel/prizeName/totalTickets/pastedTickets`；实验 transformer 在生产函数目录外负责 NFKC、child-first A1/A2 聚合、同名 SP 按视觉顺序稳定编号、range/conflict/null、remaining／whole 与 RecognitionContract 1.0.0 构造。Language Gate 选出中文后以 hash 冻结，正式 5 图 Quick Pass 的 tier exact 17/58→34/58，但 Pokémon、Snow Miku S 和世界之外共 8 个 production-correct tier regression，故未进入 stability。所有实验调用仍固定 `qwen3.7-flash`、non-thinking、temperature 0、json_object、`max_pixels=6291456`；临时 Storage 对象为 0，生产 Prompt／Schema／Normalize／Contract／客户端／CloudBase 部署均未改变。

2026-08-26 V1-43D Universal Scene Model 严格 A/B：新增独立 `ichi-board-vlm-4.1.0-scene-exp`、`experiments/universal-scene-model/`、`scripts/benchmark-universal-scene-model.mjs` 与报告生成器；实验复用生产 `board-provider-extraction-4.0.0-rc1`、AJV、`normalizeExtraction`、RecognitionContract 1.0.0、CloudBase 数学及同图临时 URL，只改变 Prompt。五张真实原图 Quick Pass 共 10 次 Provider 调用后，Scene 把 Snow Miku printed-letter false-pasted tiers 从 11 降到 1、巨人从 4 降到 3，但世界之外从 production B/C/D/E exact 退化为 Scene AJV failure，四个 SP raw items 仍被合并，NIKKE dense G—K 与 Pokémon vertical C—F 也未修复。按门禁停止 3-run stability；生产仍为 `ichi-board-vlm-4.0.3-rc1`，未部署或修改生产 Schema、Normalize、Contract、客户端与 CloudBase。

2026-08-25 V1-F 赏票核验 P0：赏票提交已拆为 durable PENDING 与后台 verification 两阶段。`platform/draw-ticket-recognition.ts` 并行保存 v1 相机原图到系统相册并执行约 2048px／JPEG 82 传输预处理，首次相册保存尝试结束且 Storage fileID 取得后，以 `action=submit` 幂等建立版本化 `drawSubmissions` PENDING；等待期间 `pages/home` 的黑色提交圆钮以真实 WXML 旋转加载指示器替代对勾。该文档同版本保存 evidence、来源、上传时间、备注、权威抽赏事件和由初始版面确定性推导的 finalSnapshot，拍摄页随后进入“我上传的版面”。`action=verify` 直接读取同版本事实并执行 getTempFileURL → qwen3.7-flash → Provider AJV → exact reconciliation，不再调用 `finalize-draw-update` 或向大型 observation 追加核验正文。Provider 的单一 `prize-ticket-verification-v2` 只返回 `evidenceType + tickets[]`，不接收期望答案；实体 Gate、逐赏级精确比较、版本门和终态持久化均在 CloudBase。`get-my-records` owner-scoped 合并 observation 与当前 submission，恢复位置、最新版面、上传／核验时间、备注、evidence 引用和权威抽赏引用；本机 draft 丢失时，云端卡仍能复用同版本图片重新核验，v2+ replacement 继承上一版本权威事实，旧版本结果不能覆盖当前版本。“我的记录”与“我上传的版面”共享卡片右上角状态徽标定位，并只将“已上传”渲染为 `#e014a0` 产品玫红色。

2026-08-25 V1-F 赏票真实记录链再次收口：真实记录 `record_611dfc8668a1ae185d6ddf39eec58f8b` 的 PENDING 已在线建立，但大型 observation 上追加 authoritative events／finalSnapshot 仍触发 CloudBase `-502001`，随后 verify 在 Provider 前以 `AUTHORITATIVE_DRAW_RECORD_UNAVAILABLE` 结束。现将权威抽取事件、最终版面、备注和上传时间归入既有版本化 `drawSubmissions`，`recognize-draw-tickets action=submit` 在同一 durable boundary 内完成保存，`action=verify` 直接消费同版本事实；`get-my-records` 合并 observation 与当前 submission 形成含位置、最新版面、上传时间、备注和核验结果的云端投影。`finalize-draw-update` 不再是赏票核验前置依赖，只保留其他既有抽赏确认职责。

2026-08-25 V1-F 识别进度与入口额度门禁：`pages/home` 的“进入辅助抽赏／仅上传版面”现在先通过 `loadCloudAccount → get-quota-status` 读取权威剩余额度；`remaining=0` 时停留首页并显示“无法建立票池／我知道了”，不请求位置、相机权限、不挂载拍摄页且不创建 reservation。额度可用才继续既有位置／相机门禁；冻结照片确认仍是唯一 reservation 时点，`used` 只在完整可恢复版面本地落盘后由 `finalize-board-observation` 提交。`platform/board-recognition.ts` 新增纯 UI 进度事件 `photo-prepared/request-dispatched/response-received/result-ready`；页面把它们门控到 `0—15/15—35/35—80/80—100` 四段确定型环形进度，阶段内计时平滑不越界，未收到真实事件的节点保持进行中而不提前打勾。`recognize-board` Prompt、Provider Schema、Normalize 与模型配置未改。

2026-08-25 V1-43K 赏票核验生产入口迁移：历史 `recognize-draw-tickets` 仅承担赏票识别，没有其他业务消费者；其线上 Nodejs20.19、`index.main`、512 MB、60 秒、依赖层 v1 与四项 DashScope 环境配置在迁移前均为 `Active/Available`，空请求能进入 handler 并返回受控错误。仓库与小程序现已把该既有函数身份作为唯一生产入口，旧的 expected tiers 输入／聚合 counts 协议被完整替换为 `prize-ticket-verification-v1`：Qwen 只返回逐张 `tickets[]`，CloudBase 从 authoritative draw events 重建 expected 并 exact reconcile。新版已真实部署；线上空请求 RequestId `95cddf01-4ec5-4cd5-b9d5-6ec122682a40` 返回 `RECORD_NOT_FOUND`，Duration 881 ms、InvokeResult 0，反向下载的 `index.js` SHA-256 与本地部署物一致。临时新建的 `verify-prize-tickets` 线上函数已在 smoke 通过、客户端切换且无剩余消费者后删除，部署清单不再声明它。

2026-08-25 V1-F 识别确认与配额事务收口：`recognize-board` 对可编辑结果只把任务推进为 `recognized` 并保留 reservation，不再增加 `dailyQuotas.used`；`finalize-board-observation` 在校验确认快照、完整可恢复本地版面已由客户端落盘后，于同一事务内提交 reservation、`used + 1`、观察记录和 job `committed`，重复 finalize 只返回既有记录。客户端 `platform/recognition-generation.ts` 负责不可变生成快照和 `BOARD_CONTRACT_MISMATCH` 守恒门；`pages/home` 在同一事件循环中冻结 snapshot、本地构建并持久化可恢复 draft，随后立即显示 draw，把幂等 finalize 移到可恢复后台。draft 的 `pendingFinalization` 保存 job、确认快照、来源和版本，`onShow`／记录恢复时重试；旧回调只能更新对应 draft，不能导航、覆盖新 generation 或再次调用模型。失败任务释放为 `recognized_released`；已经本地可恢复但 finalize 暂时失败的任务保留 reservation 等待幂等重试。`cloud-records.ts` 可由云端 assisted-draw `initialSnapshot` 重建丢失的本地草稿；空票池历史记录标记“无法恢复”且仍可删除。Normalize 对受支持根 IP 执行安全的“主 IP + 后缀主题”拆分，Provider evidence 新增原始 identity 结构化字段。

2026-08-25 V1-F 叠贴回收券协议与 NIKKE 诊断：当前模型请求固定 `qwen3.7-flash`、`ichi-board-vlm-5.0.1-rc1`、`board-provider-extraction-5.0.0-rc1`、non-thinking JSON Object、temperature 0、`max_pixels=6291456`。Provider 只输出 `boardCountStyle` 和逐 raw tier 的 `countMode + mode-specific evidence`；CloudBase 独占 numbered-prefix、pasted-plus-remaining、pasted-full、empty、unknown 的确定性数学，再执行父字母与 SP 聚合。Prompt 明确 exposed tier tab 与每段 terminal full-length ticket 都是一张实体已贴票，多行／多段必须合计。NIKKE 人工 80/78/2 deterministic fixture 已贯通 Provider AJV、Normalize、RecognitionContract、client parser 与 Board Builder；真实 1080×1440 图的当前 Qwen raw 仍漏数密集叠贴票，属于模型视觉计数限制，不能用业务 heuristic 伪装通过。

2026-08-23 V1-F 四图真实 Golden 诊断：`recognize-board` 当前生产代码固定 `qwen3.7-flash + ichi-board-vlm-4.0.3-rc1 + board-provider-extraction-4.0.0-rc1`、非思考 `json_object`、`temperature=0`、单图 `max_pixels=6291456`。`services/cloudbase/functions/recognize-board/fixtures/golden-four-board-expectations.json` 保存从四张原图独立核对的结构化真值；`protocol-v4.test.ts` 把它们经过真实 Provider Schema、Normalize、RecognitionContract 与客户端 parser。真实 Provider 证明 prefix 算术 `firstOpen-sequenceStart` 正确，首错发生在 Qwen raw 视觉抽取：世界之外 A 把部分遮挡的首空 12 读为 13，明日方舟 H 漏掉跨行续条。提高整图像素、Prompt 加码和附加细节分块均未同时修复四图，且会引入漏赏／错判；这些失败实验及临时 Golden 云函数入口已删除。线上 `recognize-board` 已恢复正常任务令牌／fileID 单图门禁，无图 smoke 返回 `IMAGE_INPUT_INVALID`；当前准确率门未通过，不能标为发布完成。

2026-08-23 V1-F “我的”资料首帧与定位收口：资料组改为固定 `80px + minmax(0, 1fr)` 两列网格，头像按钮左右原生外边距强制归零，头像、昵称和 ICHI ID 从与下方卡片相同的页面左沿开始排列。授权头像同时保存到微信小程序 `USER_DATA_PATH`，本地 Storage 只缓存 `ichiId/nickname/avatarFileId/avatarPath` 的展示副本；页面加载先同步恢复该副本，再由 CloudBase owner-scoped 资料校验并按 `avatarFileId` 更新缓存。云端仍是身份与资料事实源，本地缓存只用于消除页面切换时的空白首帧。

2026-08-23 V1-F 当前客户端已移除校正页和目标赏级中间层，冻结照片对勾直接进入既有 `reserve-recognition → fileID upload → recognize-board` 链，识别结果确认后直接创建草稿并进入 draw。识别首页的“抽赏草稿”使用启用原生增强／回弹的独立纵向 `scroll-view`；卡片先区分横纵手势，纵向不再截获，横向左滑只对当前卡片回写位移。导入卡仅显示每日额度短提示。首次启动或任一新版面入口在云端资料仍为 `incomplete` 时显示同一个“使用微信登录”阻塞引导，以 `chooseAvatar + nickname` 取得展示资料；任一路径完成后两条入口和“我的”页立即共享完成态，重开不重复提示。点击“我的”页头像或用户名打开带返回键的更新卡。`get-my-profile` 同时返回 owner-scoped 私有 `avatarFileId` 和尽力签发的短时 `avatarUrl`；客户端按稳定私有 fileID → 短时 URL → 默认头像选择显示源，避免页面重新挂载时重新签发 URL 造成头像闪动或丢失。`bind-wechat-profile` 允许 owner-scoped 展示资料更新，但不改变内部账号、ICHI ID、记录归属或额度。新版面入口现在先确认账号资料，再取得当次 GCJ-02 位置并检查相机授权；系统已授权时不重复弹窗，拒绝时不进入拍摄、不预占额度并提供设置恢复入口。`recognize-board` 的 `4.0.0-rc1` Prompt／Provider Schema、CloudBase Normalize 和 RecognitionContract 未因本轮账号／权限改版改变。

2026-08-21 V1-F 校正／识别重构正在实施：目标结构为 `pages/board-correction` 专门承载原始相机照片的四角校正与额度确认，`platform/board-correction` 承载缩略图检测、归一化几何、吸附、homography 与校正输出；既有 `board-recognition` 只上传校正后的临时文件。Provider wire format 将以 ticketPattern 显式语义协议替代当前逐排／聚合双重计数职责，CloudBase 在 raw tier 层确定性计算 pasted 后再合并父字母并分配特殊赏。以下 3.0 现状段落在代码完成前仍描述当前运行代码；本段描述已批准且正在落地的活动区块变更，不能被当作已经部署上线。

2026-08-21 V1-F 识别协议收口：当前生产协议已切换为 `ichi-board-vlm-3.0.0-rc1` + `board-provider-extraction-3.0.0-rc1`。Qwen 直接输出语义字段，不再以 compact key 作为生产 wire format；云函数先 JSON.parse/AJV，再通过一次性历史迁移兼容旧草稿。`totalTickets` 与 `pastedTickets` 独立，逐排 `slotRows` 与聚合冲突时置空并发出 `TICKET_COUNT_CONFLICT`，客户端严格保留 null，不使用 `Number(null)` 或 total fallback。小程序仍只把 fileID 交给云函数，图片经短时 HTTPS URL传给百炼，不经过 Buffer/Base64；约 8 MiB 是客户端性能目标，20 MiB 是 Provider 硬边界，超过即拒绝。识别事件、位置快照和交换契约的来源字段均为 camera-only，生产链拒绝 album。云函数额外记录 JSON parse、Provider Schema、Normalize 等分段耗时；真实准确率与 P95 仍需用户授权黄金样本验收。

2026-08-21 V1-F CloudBase 交付核验：13 个私有集合、18 个 Nodejs20.19 函数线上版本均为 `Deployment completed`。函数业务包不重复携带 AJV／CloudBase SDK 等运行时依赖，统一绑定 `ichi-node-deps_cloud1-d7gxqfwv783a1f131` v1 依赖层；CLI 更新必须以无空格暂存目录中的函数目录为工作目录，避免根路径加 `--dir` 触发 `InvalidParameter.ZipCodeFmt` 的旧代码假成功。`recognize-board`、`recognize-draw-tickets` 与共享运行时均已反向下载核对。当前只完成无身份稳定烟测，真实微信身份、临时图片与 Qwen 黄金样本仍属人工门。

下方早期段落与表格中保留的 2.x 协议、旧 `6 MiB` 压缩预算、旧压缩尺寸和旧超时仅作为历史记录，不代表当前输入边界；当前实现和部署事实以本段及 `progress.md` 的 2026-08-21 记录为准。

2026-08-18 `specs/v1-cloudbase-backend/requirements.md`、`design.md` 与 `tasks.md` 已获用户批准并进入实施。新增 `services/cloudbase/contracts/`、`shared/`、`database/` 和 `deploy/`：前两者承载响应／版面契约及可信身份、账号、配额、短号、六位码、归一化与差量核心；后两者承载 13 个私有集合／索引／种子清单和当前 16 个基础事件函数的可重复生成、校验与部署清单。`docs/delivery/v1-cloudbase-backend-guide.md` 是面向人的云端说明。`.deploy/functions/` 是机械生成的部署产物而非事实源；当前构建另生成 `recognize-board` 与 `recognize-draw-tickets` 两个携带机器协议的独立识别函数。账号运行时新增一次性 `bind-wechat-profile`：昵称／头像只作展示，首次授权后 V1 服务端锁定，不参与鉴权或所有权。云存储仍只允许 `recognition-temp/` 临时对象，V2 公共集合／函数／发布入口均未创建。

当前唯一活动区块：V1-F｜跨端质量与小程序发布门（`IN_PROGRESS`）；V1-40—V1-47 已因账号、位置、配额和私有观察进入 V1 的新范围而重新打开，V1-43A—V1-43J 已加入当前工作集，V1-48 保留为人工决策门。V1-43J 的开发环境后端已支持 V1-43G 前端联调；正式微信账号和创始人 `ICHI-001` 已真实建立，账号资料、权威配额摘要和识别前位置门禁已进入小程序，百炼模型凭据、私有观察全链路与真机 UI／权限验收仍是后续任务和人工门。

`apps/client/miniprogram/platform/cloud-account.ts` 是小程序唯一的账号／配额调用适配器：依次执行 `bootstrap-account`，再并行读取 `get-my-profile` 与 `get-quota-status`，校验响应信封后只向页面暴露公开资料和配额摘要，不暴露 OPENID 或内部 `accountId`；资料未完成时 `pages/home` 自动显示“使用微信登录”阻塞引导，使用 `chooseAvatar + nickname` 明确取值。头像或用户名后续可再次打开同一授权卡；`bindWechatProfile` 把本次明确授权的头像／昵称提交给 owner-scoped 更新函数，后端只更新展示资料并保持内部账号、ICHI ID、记录归属和配额不变。`cloud-records.ts` 只调用 owner-scoped 的 `get-my-records/delete-my-record`，把云端记录投影到既有三行卡片，并按 `boardId` 避免与 Storage 重复；本机和云端记录都通过同一左滑垃圾桶结构触发各自的删除适配器，客户端不直连数据库，也不能自报所有者。`app.globalData` 只短暂缓存当前公开资料、权威配额、一次识别所需的 GCJ-02 位置快照、微信临时照片路径与一次性任务令牌；令牌和照片不写入 Storage。`board-recognition.ts` 只以二进制短暂上传任务图片。`pages/home` 在新版面入口执行账号资料→本次位置→相机权限门禁；系统已授权时不重复弹窗，拒绝时不进入拍摄、不预占额度并提供恢复入口。第一次快门冻结取景框照片，第二次对勾再读取权威配额并预占识别；已有本机草稿不经过该门禁，门禁忙碌态阻止连点并发，相机 loading 期间的首击快门会排队到 `initdone` 后自动执行。

`apps/client/miniprogram/platform/cloud-recognition-task.ts` 固定识别编排的客户端边界：负责配额预占、任务查询、把用户已确认字段转换为 `board-snapshot-1.0.0`，以及调用私有观察确认；请求不含 `ownerAccountId` 或图片持久化字段。页面已经接入真实预占与确认保存：`reserve-recognition` 只向本次调用者返回一次性任务令牌；`recognize-board` 在事务内把任务从 `reserved` 抢占为 `processing` 后才允许单次模型调用，成功时立即把预占提交为已用并保存去除图片字段的结构化结果，提供方失败／超时／未配置时立即释放，崩溃则由既有 `processing` 租约协调器回收。用户校正并确认后，`finalize-board-observation` 只接受 `succeeded + committed` 任务，保存模型结构化结果、服务端差异摘要、位置和最终快照。识别失败在所有微信环境都明确失败闭合到“无法建立票池”；固定夹具仅属于自动测试，不能进入拍摄流程。

仓库的 V1-A 工程基线、V1-B 计算内核、V1-C 会话／Storage／随包版面兼容与识别 QA、V1-D Next.js 手机优先完整页面和 V1-E 最终小程序页面均已完成自动验证及用户统一人工验收。V1-F 已建立微信端临时图片适配、可信账号、权威配额、位置门禁、私有结构化观察／差量／本人记录／删除后端。当前 `recognize-board` 主链使用 `qwen3.7-flash`、`ichi-board-vlm-3.0.0-rc1`、非思考 JSON Object 和约 4MP 输入；模型草稿先由 `board-provider-extraction-3.0.0-rc1` 校验，再由 `normalizeExtraction` 转换为小程序稳定契约。它处理主版面、中文主 IP、可选主题、A—Z 编号款式合并、SP1—SP4、实体覆盖票、逐排票位证据和本赏容量。服务端优先复算守恒的逐排计数；空 `openPositions` 不再证明无空位，实体票容量证据也不再自动把已贴数补成总数。缺失计数保留为 null，但已确认 pasted 在守恒时仍进入可编辑草稿，不把提供方结果直接当业务事实。`recognize-draw-tickets` 使用独立赏票协议，只数实体票，再以同一 `recordId + boardId + submissionVersion` 与完整本机历史核对；较旧异步结果不得覆盖新版本，同版本重试幂等。版面和赏票图片都经临时 URL链后双删。版面拍摄页只保留微信原生 `<camera>`，不再提供相册；第一次快门冻结中心裁切后的所见图并显示对勾／撤回，第二次对勾才执行权威额度检查和识别。真实地图审核与公共发布继续受 V2 门禁约束。

V1-D was closed by user acceptance on 2026-08-11. V1-E was closed by user-authorized acceptance on 2026-08-13. The 2026-08-13 V1-F automatic evidence is retained as a reusable pre-backend baseline, but V1-F is no longer release-complete after the 2026-08-14 scope re-baseline.

2026-08-18 V1-F 范围再次对齐：正式事实源要求 V1 建立最小微信账号、在新识别前获取本次位置、执行北京时间每日 5 次有效识别配额、使用固定千问提示与刚性 JSON Schema。版面与赏票照片只存在于当次识别内存链路，绝不持久化；确认后保存初始结构化版面快照、模型/用户差异、位置和服务端六位码，辅助抽赏再保存确认抽赏事实并确定性推导最终快照。结构化删除和 CloudBase 生产定时维护的第一批服务端资源已经落地；小程序接入、真实微信账号／位置、千问协议迁移、黄金样本、真实 Codex 账号验证和发布门仍由 V1-43G—V1-47 承接。公共地图、现实版面自动合并、Luna 日常治理和公开发布仍属于锁定的 V2。

2026-08-13 V1-F 自动硬化：新增 `platform/board-recognition.ts`、真实 CloudBase 百炼代理、单次内存局部 OCR、隐私响应校验、六位码冲突写回迁移、V1-F 发布校验和跨域韧性测试。`tests/v1-f-release.test.ts` 覆盖双入口、无公共写入、500 条本机记录、50 抽／50 撤销、离线不污染与关键无障碍语义；`docs/delivery/` 固定自动证据、发布清单和人工门；`artifacts/v1-f-release-candidate/2026-08-13/simulator/` 保存 10 张微信模拟器原始截图。真实凭据、云函数部署、真机、多设备视觉、读屏、弱网和代表性用户理解度仍为人工门。

2026-08-12 阶段一撕拉结构重做：删除 `pages/home/peel.wxs`、WXS 测试、互补窗口、同内容翻片及所有 3D／阴影／飞离样式。`index.ts` 直接承载单层揭露状态机，黑色覆盖层按 `96px` 行程和当前手指相对起点距离连续设置 `translateX(0–100%)`；回滑自然重新覆盖。严格超过 `50%` 才在 `180ms` 自动完成揭露，随后调用既有 `commitDraw` 原子更新余票、历史、概率与本机 Storage，同时显示轻提醒，`220ms` 后恢复覆盖层；未超过阈值只复位。旧 WXS 对 `.draw-quick-actions` 的动态 `pointer-events` 写入被彻底移除，三个快捷操作不再受撕拉生命周期锁定。

2026-08-13 React Spring 撕纸模型移植：新增 `platform/ticket-peel-motion.ts`，以纯 TypeScript 提供教程中的速度加权位移和阻尼弹簧帧，不把 React／`react-spring` 引入小程序包。`index.wxml` 的赏票揭开层改为教程同构的 `ticket-peel-swiper / ticket-peel-back / ticket-peel-front`：窗口向右裁切，纸背同步增宽，前纸等量反移并保持在票面原位。页面级触摸链持续支持真机拖动与回滑，松手使用最终触点重新投影，未过半以 `320ms` 弹簧回到 `0%`，过半弹簧甩到 `145%`，完整露出 `OPENED` 后提交抽取并在 `120ms` 后复位。旧单层 `translateX` 揭露样式被替换，快捷操作和抽取领域状态保持独立。

2026-08-13 撕纸外层裁切定稿：用户真机复验跨卡片溢出效果后决定恢复裁切。`ticket-peel-track` 使用 `overflow: hidden` 把纸背限制在当前赏票的 52px 撕拉区域，奖票网格不再声明可见溢出，也不再创建 `prize-ticket--peeling` 提层；教程同构的内部前纸／纸背裁切和阻尼弹簧保持不变。

2026-08-13 撕纸离场与草稿时间收口：`pages/home/index.ts` 在纸背弹簧抵达 `145%` 后立即为同一 `ticket-peel-swiper` 打开 `80ms` 线性透明度淡出，淡出结束即清理撕纸状态，不再保留终点静止阶段。页面同时以 `drawSessionStartHistoryCount` 和 `drawSessionStartSavedAt` 记录进入／恢复工作台时的会话基线；只有本轮历史长度增加后执行“暂不分享并退出”才刷新 `savedAt`，原样退出恢复原时间。`platform/local-draw-drafts.ts` 对抽赏记录把 `savedAt` 解释为最后修改时间，对直接上传记录继续优先使用 `submittedAt`；整个过程不更换 `boardId`、六位编码或历史。

2026-08-13 识别计数编辑态收口：`platform/recognition-flow.ts` 的 `RecognitionPrizeDraft` 将总票数、已贴票数和剩余票数建模为可空编辑值，空字符串保持为 `null`，不再被 `Number('')` 与最小值钳制改写为 `1`。`pages/home/index.ts` 在 IP、价格和全部计数通过领域校验后才允许辅助抽赏提交；直接上传还要求地点与备注。已贴票数显式 `0` 合法，空值、负数、非整数、超过总票数或非正总票数均关闭按钮；`toLocalPrizeStates` 继续阻止临时空值进入正式票池。WXML 以显式空字符串呈现 `null`，使用户可按“清空后重填”的习惯编辑。

2026-08-12 玩家现场直传与记录身份收口，后由 V1-F 覆盖输入方式与命名：`pages/home/index.wxml` 的导入 Hero 以同一设计系统提供“进入辅助抽赏／仅上传版面”双入口，两者复用原生相机、提取进度和识别结果，不再提供相册。`platform/recognition-flow.ts` 的兼容快照保存流程模式、主 IP、可选主题、地点备注和拍摄时间，页面恢复后继续计算提交门禁。辅助抽赏在主 IP 非空后建立抽赏记录；仅上传要求主 IP 与地点备注同时非空，并在显示单操作提交终态前建立 `board-upload` 待核对记录，不建立抽赏会话。两类记录共用稳定六位大写字母数字编码、IP／主题和三行摘要；摘要只显示精确到分钟的单一时间，不再并列拍摄／上传日期，也不显示累计花费。抽赏记录使用最后修改时间，仅上传记录使用稳定提交时间。只有仅上传版面或提交赏票证据的记录才显示在“我上传的版面”。既有 schema 1 记录继续兼容并按 `boardId` 确定性派生编码。

2026-08-12 Page Peel 网页方法复刻收口：`pages/home/peel.wxs` 不再把接近不可见的翻片留在原位后推动外层空容器，而是让与网页相同的内容翻片从动态撕裂边开始连续承担揭起和飞离；`pages/home/index.ts` 新增 `onPeelOpened`，只在 `OPENED` 首帧生成本轮轻提醒，不更新 `activeDraft`，`onPeelCommit` 在飞离结束后再执行一次领域抽取并抑制重复提醒。对应 WXS 测试锁定网页拖动系数、正向旋转／正 Z 深度、五个定时阶段、外层零飞行与最终提交顺序，页面行为测试锁定轻提醒阶段票池不变。

2026-08-12 Page Peel 真机可见帧收口：`index.wxml` 在固定表面与同内容翻片外各增加一个互补的 `overflow: hidden` 窗口，`peel.wxs` 以实际票宽逐帧改变固定窗口左界和翻片窗口宽度，不再依赖真机未产生可见插值的动态 mask。拖动帧同时提供向上位移、正 Z 深度、透视旋转、缩放和投影；提交阶段由 `ComponentDescriptor.requestAnimationFrame` 显式产生揭开与飞离帧，飞离前半段保持完全不透明，完整飞离后才调用 `onPeelCommit`。WXS 测试桩新增真实帧队列，不再只断言终点样式字符串。

2026-08-12 双取景框结构收口，后由 V1-F 删除相册路径：版面拍摄与赏票取证都在各自既有取景区内挂载微信原生 `<camera>`，两处快门共用 `wx.createCameraContext().takePhoto()` 在当前页内拍照，不打开系统相机、文件选择器或相册。赏票拍摄结果以 `aspectFill` 等比裁切填满 `32px` 圆角取景框；操作区使用 `52px + 212px + 52px` 对称三列，使主胶囊独立对齐页面中线，右侧撤回按钮不再挤偏主按钮。版面取景额外使用隐藏 2D Canvas 把传感器输出裁切到实时取景框可见范围，第一次快门冻结、第二次对勾提交。

2026-08-12 版面相机构图角标真机收口：`pages/home/index.wxml` 不再把四个方向性边框角标放进中间 `camera-board-guide cover-view`，而是在原生 `<camera>` 下直接挂载四个独立 `cover-image`；`camera-corner-tl/tr/bl/br.png` 是由对应 SVG 源文件生成的 `96×96` 透明运行时资源，WXSS 以 `48×48px` 显示并只负责四边 `20px` 镜像定位。该结构绕开真机原生覆盖层对方向性边框、多值圆角、中间容器尺寸和 SVG 解码的非普通渲染差异，消除顶部完整圆形／方形伪影并恢复底部两角。

2026-08-12 工作台模态页头真机定位收口：“局面可能性”和“抽取记录”仍共用 `.modal-head`，但关闭按钮不再依赖微信 flex 对页头宽度的计算；两处按钮统一相对 `.modal-card` 以 `top: 24px; right: 24px` 绝对锚定，标题行为其预留 `52px` 水平空间，因此按钮的位置与标题长度、页头 flex 收缩无关。

2026-08-12 抽取记录行收口：`pages/home/index.ts` 的 `HistoryViewModel` 在不修改 Storage 历史结构的前提下，以当前总余票加该轮之后的抽数推导逐轮 `remaining`；`index.wxml`／`index.wxss` 依照网页源结构把每轮记录渲染为白底分隔行，左侧为灰色等宽序号和黑色赏级，右侧为灰色余票和玫红累计金额，不再使用灰色圆角记录卡。

2026-08-12 第二轮结构收口：`pages/home/index.ts` 的草稿刷新会从持久化导航读取活动 `boardId`，即使页面内存状态丢失也能恢复工作台；赏票由固定未揭表面与同内容翻片两个 WXML 层组成，仅翻片参与局部 Page Curl，抽取提交不再触发轻震动。第三轮触摸等价修订把 WXS 事件绑定到与网页一致的 52px `ticket-peel-cover`，由捕获式移动事件排除 `scroll-view` 竞争，并以网页同款 157px 票面宽度连续计算遮罩、透视、阴影、回弹和飞离。第二轮截图 16—21 暴露的通用信息 `i` 已被替换：`warning-white.svg` 用于警告／不兼容／容量不足，`arrow-u-up-left-white.svg` 用于撤销保护，`database-white.svg` 用于存储读取异常，`trash-white.svg` 用于记录清空；六个状态共享 `exception-card` 的 `24 / 10 / 28 / 12 / 40px` 垂直节奏。“局面可能性”和“抽取记录”继续共用单一 `modal-head` 结构，该页头显式占满卡片内容宽度，以左侧标题和固定 `40px` 右侧关闭按钮组成同一水平行，避免微信 flex 按内容收缩后把叉号留在卡片中部。第二轮 35 张模拟器截图位于 `artifacts/v1-e-ui-review/2026-08-12-round-2/`，第三轮 Page Curl 对照证据位于 `artifacts/v1-e-ui-review/2026-08-12-round-3/`；V1-E 继续等待用户统一人工验收。

## 当前核心结构

```text
AGENTS.md
PRD.md
README.md
.github/workflows/quality.yml
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
project.config.json
tsconfig.base.json
tsconfig.json
eslint.config.mjs
apps/client/
  package.json
  miniprogram/
    app.json
    app.ts
    app.wxss
    sitemap.json
    assets/
      fonts/
      icons/
      v1-29/
    pages/bootstrap/
    pages/home/
    platform/
      board-outlook.ts
      board-media.ts
      board-recognition.ts
      draw-session.ts
      local-draw-drafts.ts
      navigation-state.ts
      recognition-flow.ts
      storage.ts
      storage-smoke.ts
    storage.test.ts
apps/xhs-local-tool/
  AGENTS.md
  README.md
  docs/
    platform-rules.md
    development-plan.md
apps/web/
  app/
    layout.tsx
    page.tsx
    prototype-frame.tsx
    api/v1-29-source/route.ts
    light-shell.tsx
    tokens.css
    styles.css
    ui/
      index.tsx
  tests/v1-26.spec.ts
  package.json
  playwright.config.ts
packages/
  core/src/
    combinatorics.ts
    comparison.ts
    constrained-plan.ts
    errors.ts
    fraction.ts
    integer.ts
    money.ts
    multi-target.ts
    probability.ts
    result.ts
    types.ts
    validation.ts
    *.test.ts
  board-layout/
  recognition-contract/
  session/src/
    calculation.ts
    copy-session.ts
    errors.ts
    session.ts
    types.ts
    *.test.ts
  storage/src/
    board-compatibility.ts
    codec.ts
    repository.ts
    types.ts
    *.test.ts
services/cloudbase/
  contracts/
  database/
  deploy/
  functions/recognize-board/
  shared/
tests/
  fixtures/
  e2e/
  recognition/
  visual/
memory-bank/
  design-document.md
  情境提醒.md
  tech-stack.md
  implementation-plan.md
  progress.md
  architecture.md
docs/
  decisions/
  design/
    v1-26-figma-low-fi-brief.md
    v1-26-web-low-fi-brief.md
  delivery/
  methodology/
  references/
data/
  calculation-baseline/
    glossary.json
    vectors.json
  toolchain-baseline/
    versions.json
  board-layout/
    README.md
    registry/
      saturated-component-registry.json
    schema/
      board-layout.schema.json
  recognition-contract/
    README.md
    fixtures/
      complete-board.json
      handwritten-price.json
      inconsistent-slots.json
      partial-board.json
    registry/
      issue-actions.json
    schema/
      recognition-contract.schema.json
  recognition-evaluation/
    README.md
    manifest.json
    tier-label-coverage.json
  render-contract/
    README.md
    fixtures/
      complete-render-plan.json
      partial-retake-plan.json
    registry/
      render-policy.json
    schema/
      render-plan.schema.json
product-atlas/
canvas/
scripts/
  validate-board-layout.mjs
  validate-recognition-contract.mjs
  validate-render-contract.mjs
  validate-v1a-baseline.mjs
  validate-v1c-baseline.mjs
  validate-v1f-release.mjs
  validate-workflow.mjs
  verify-quality-gate.mjs
services/cloudbase/functions/recognize-board/
  index.js
  package.json
docs/delivery/
  v1-cloudbase-backend-guide.md
  v1-f-automated-evidence.md
  v1-f-human-gates.md
  v1-f-release-candidate-checklist.md
```

## 文件职责

| 路径 | 当前职责 |
| --- | --- |
| `AGENTS.md` | Codex 的区块解锁、区块验收、上下文读取和文件联动规则 |
| `PRD.md` | 面向人阅读的 V1/V2/V3 产品总览 |
| `apps/xhs-local-tool/` | 已建立但保持 `DEFERRED` 的小红书纯本地小工具独立分区；当前只包含范围、平台规则、粗粒度迁移计划和目录级执行门禁，不含应用入口、框架、依赖或产品代码。等待微信小程序 V1 全部完成并由用户明确解锁后，再按复用／替换／删除／新增盘点稳定 V1；固定排除账号、位置、网络、CloudBase、V2 地图和 V3 多人协作 |
| `memory-bank/design-document.md` | 正式产品行为、边界、数据与验收事实源 |
| `memory-bank/情境提醒.md` | 抽赏记录与版面快照驱动的情境分析、提示优先级和文案安全边界；每一抽独立产生最高优先级提示，不做跨抽取冷却去重；复用大／中／小赏三档分类；无成本节点和闲置提醒；V1-D 已批准认知 |
| `docs/decisions/account-and-my-panel-proposal.md` | V2 账号、提醒、分享与“我的”面板范围决策；三类能力进入 V2 和非社群边界已批准；微信登录、内部账号／公开 ICHI ID 分层、资料编辑、关注地点订阅消息、地图转发与抽赏海报为推荐基线，待 V2-00／V2-03 批准 |
| `docs/decisions/v1-v2-cloudbase-backend-governance-proposal.md` | V1 账号与位置先于识别、每日配额、结构化历史观察、删除级联和六位码边界的早期治理提案；其中压缩照片方案已被 2026-08-18 的“不持久化照片”决定取代，当前后端实施事实以 `specs/v1-cloudbase-backend/` 和正式 memory bank 为准 |
| `docs/decisions/v1-board-recognition-prompt-contract.md` | V1 固定多模态提问与输出职责：`qwen3.7-flash`、`ichi-board-vlm-3.0.0-rc1`、单图单调用、主版面、中文 IP／可选主题、票区空间归属、票位状态、赏票核对、提示注入、服务端 Normalize 和黄金样本门 |
| `data/recognition-contract/prompt/ichi-board-vlm-2.6.0-rc1.txt` | 历史提示版本，仅供迁移测试；当前生产提示为 `ichi-board-vlm-3.0.0-rc1`，直接抽取语义字段和独立总数／已贴数，不让模型决定业务状态 |
| `data/recognition-contract/schema/board-provider-extraction-2.2.0-rc1.schema.json` | 历史 Provider Schema，仅供迁移测试；当前生产 Schema 为 `board-provider-extraction-3.0.0-rc1`，要求逐排计数守恒并拒绝额外字段、错误类型和非法枚举 |
| `data/recognition-contract/prompt/ichi-draw-ticket-vlm-1.0.0-rc1.txt`、`schema/draw-ticket-provider-extraction-1.0.0-rc1.schema.json` | 赏票集中取证的独立机器协议；只数实体票并按 A—Z／SP1—SP4 汇总，不读取地图或历史，服务端负责版本化核对与最终快照 |
| `data/recognition-contract/schema/board-vlm-output-1.0.0-rc1.schema.json` | 待审核的模型原始观察结构；允许物理版面候选、焦点选择、图像质量、IP／系列证据候选、价格、赏级、票区逐行状态、可见印刷序号／编号方向／贴票边界辅助证据、辅助区块和问题码，不允许模型返回最终 IP、流程状态、动作或领域派生 |
| `data/recognition-contract/policy/board-vlm-policy-1.0.0-rc1.json` | 待审核的服务端确定性策略；固定单调用参数、主版面 `40/35/20/5` 评分与面积／总分／领先差门槛、IP 选择门槛、阻塞条件、问题码动作、仅服务端派生字段和失败退路 |
| `memory-bank/tech-stack.md` | 当前技术决策和分版本架构边界 |
| `memory-bank/implementation-plan.md` | 唯一区块顺序；定义各区块状态、step 范围、自动验证和统一人工验收 |
| `memory-bank/progress.md` | 当前活动区块、区块内工作集、历史完成和验证记录 |
| `memory-bank/architecture.md` | 当前真实仓库与未来代码职责地图 |
| `package.json`、`pnpm-workspace.yaml`、`pnpm-lock.yaml` | V1-A workspace、精确包管理器入口、统一质量命令和已解析依赖锁；网页依赖和 `test:web` 入口已加入 |
| `vitest.config.mts` | 根 Vitest 测试边界；排除由 Playwright 运行的 `apps/web/tests/` |
| `tsconfig.base.json`、`tsconfig.json`、`eslint.config.mjs` | TypeScript 6 与 ESLint 10 的共享静态检查基线 |
| `.github/workflows/quality.yml` | 在 Node 24.11 与 pnpm 11.9 上执行统一质量门的 CI |
| `project.config.json` | 真实小程序 AppID、`miniprogramRoot`、CloudBase 函数根和基础库 3.17.0 配置；不含 AppSecret |
| `apps/client/miniprogram/pages/home/` | V1-31—V1-39 的单页本地 WXML/WXSS/TypeScript 状态壳；使用网页计算后几何、Design Tokens 和批准素材，承载辅助抽赏与玩家现场直传双入口、无吉祥物水印的导入 Hero，以及由共享模板为抽赏草稿／抽赏记录稳定渲染的大赏四芒星眼白色 `-40deg` 背景水印；共用拍摄／提取／识别、IP／地点提交门禁、工作台、共享取证、记录页族、“我的”及异常恢复。直接上传建立本机待核对记录但不创建抽赏会话或执行云端写入；当前阶段的赏票揭露由 `index.ts` 页面逻辑层状态机执行，不再存在 `peel.wxs` |
| `artifacts/v1-e-ui-review/2026-08-12/` | 本轮 V1-E 人工验收交付；包含微信开发者工具模拟器输出的 35 张 532×1148 原始 PNG 与页面／状态清单，覆盖空态、数据态、左滑、忙碌、识别错误、生成、工作台模态、共享取证、“我的”页族和异常恢复，不作为 V1-F 多机型视觉回归基线 |
| `artifacts/v1-e-ui-review/2026-08-12-round-2/` | V1-E 第二轮人工验收交付；包含微信开发者工具模拟器输出的 35 张 532×1148 原始 PNG 与页面／状态清单，覆盖相机安全区、识别／目标选中态、工作台恢复与局部 Page Curl、共享取证、紧凑记录卡和异常统一图标，不作为 V1-F 多机型视觉回归基线 |
| `apps/client/miniprogram/assets/` | V1-29 已批准相机、头像、地图占位、Montserrat 字体与源图标的随包本地化资产；`ichi-mascot-large-watermark.png` 由批准的大赏吉祥物确定性派生为白色主体与透明四芒星眼镂空，原素材不覆盖；运行时 PNG 按页面实际显示尺寸保留足够像素密度并维持透明通道，以满足小程序包体限制；`assets/README.md` 记录网页类名经 bridge 解析后的真实映射，禁止字符占位与重新绘制 |
| `apps/client/miniprogram/platform/board-media.ts` | 隔离版面与赏票的平台图片输入：产品入口只使用 `wx.createCameraContext().takePhoto()` 返回当前原生 `<camera>` 的临时照片路径；版面传感器图按实时取景框同中心裁切，第一次快门冻结结果，撤回删除并重拍。遗留 `chooseBoardImage` 仅为平台适配回归，不在页面产品路径调用 |
| `apps/client/miniprogram/platform/board-recognition.ts` | 将微信临时图片以二进制上传到任务绑定的 `recognition-temp/{jobId}/`，只把 `fileID`、尺寸和媒体元数据交给 `recognize-board`；约 `8 MiB` 是上传性能目标，`20 MiB` 是 Provider 硬边界，超目标才尝试最长边 `2400px`／质量 `85` 和 `2048px`／质量 `82` 的轻压缩，压缩后仍超硬边界即拒绝。执行 55 秒客户端超时、契约版本与临时图片隐私声明校验，并在 `finally` 补删云端对象及全部本机临时文件；未知／不守恒计数映射为不可提交的可空编辑态，开发／体验／正式环境统一把失败交给“无法建立票池” |
| `apps/client/miniprogram/platform/local-draw-drafts.ts` | 版本化本机记录总账；R2 草稿以 `initialRemainingTickets + isGrandPrize + history events` 保存可恢复事实，摘要只显示“剩余 N 抽”；旧 schema 1 的 `total/remaining` 只在 legacy adapter 中保留。两代记录继续按 `boardId` 覆盖、生成六位辅助编码，并共享删除与上传状态生命周期 |
| `services/cloudbase/functions/recognize-board/` | `qwen3.7-flash` 单模型代理：加载 `4.0.0/4.0.0` ticketPattern Prompt 和 Provider Schema，使用 `json_object`、`enable_thinking=false`、`max_pixels=4194304` 且不设置 `max_tokens`。校验任务绑定 `fileID` 后调用 `getTempFileURL(maxAge=300s)`；AJV 后逐 raw tier 计算 pasted，再做 NFKC、A1/A2 父级求和、SP1—SP32 与 IP／主题规范。函数记录纯数字指标和 usage，不记录图片 URL或正文，并在 `finally` 删除对象 |
| `apps/client/miniprogram/platform/draw-ticket-recognition.ts`、`services/cloudbase/functions/recognize-draw-tickets/`、`services/cloudbase/functions/verify-prize-tickets/`、`data/prize-ticket-verification/` | 唯一生产入口为 `recognize-draw-tickets`；`verify-prize-tickets` 目录只保存共享源码，不是第二条生产调用路径。客户端仍在拍摄赏票时一次提交本机 draw history batch；服务端以稳定 event ID、确定性 submission key 和 transaction 建立 authoritative 边界。审核严格按 LOCATION→PHOTO→NOTE→APPROVED：位置只读显式半径配置，照片复用既有 v2 Qwen/AJV/exact reconciliation，备注调用真实 `security.msgSecCheck` 并 fail closed；各失败阶段只重跑自身及其后续阶段。赏票图片只作临时传输并在终态删除，不新增或返回长期 `originalEvidenceFileId`；该链不导入或修改 board recognition Prompt、Schema、Resolver 或 H0 fallback。 |
| `services/cloudbase/contracts/` | V1 私有后端机器契约；包含 legacy `BoardSnapshot`、`board-record-r2-1.0.0` 和统一函数信封 Schema。R2 contract 只有可查询业务字段，不包含 T/P、Provider raw 或图片 payload，也不构成 V2 公共发布契约 |
| `services/cloudbase/shared/` | V1 事件函数共享源码：可信身份、配额、位置、图片字段拒绝与版本化 snapshot validator。R2 validator 接受含 0 的直接 R 和手动 `isGrandPrize`，抽取差量只生成 final projection、不修改 `initialSnapshot`；legacy validator 继续承接 H0/R1 T/P 守恒。`runtime.js` 结构化保存 R2 顶层查询字段并省略 Provider raw，owner/openid 机制不变 |
| `services/cloudbase/database/resources.json` | 13 个 ADMINONLY NoSQL 集合、必要索引、无公共集合／无业务存储前缀声明、非秘密识别设置和 `ICHI-001—999` 保留范围的仓库事实源 |
| `services/cloudbase/deploy/` | 目标环境／AppID／Nodejs20.19／函数／触发器／秘密名和依赖层清单，以及把共享源码机械复制为 17 个无运行时依赖函数包、把两个模型函数及机器协议复制为 2 个独立部署包的构建和静态验证脚本；生成的 `.deploy/functions/` 只用于部署，不手工编辑 |
| `docs/delivery/v1-cloudbase-backend-guide.md` | 面向人的 V1 云端说明，解释后端先行顺序、双 ID 连接、每日配额、无照片结构化数据、资源、停止条件、回滚和人工门 |
| `scripts/validate-v1f-release.mjs`、`tests/v1-f-release.test.ts` | V1-F 发布候选自动门：检查 sitemap、源码包、识别隐私、依赖环境项、双入口、关键无障碍语义、500 条记录、50 抽／撤销、重启与离线不污染 |
| `docs/delivery/v1-f-*.md` | V1-F 自动证据、发布候选清单和需要用户／真实环境介入的门禁与前置条件 |
| `artifacts/v1-f-release-candidate/2026-08-13/simulator/` | 当前微信模拟器单设备自动取证，包含 10 张 532×1148 原始 PNG 和页面清单；不替代多真机人工视觉验收 |
| `apps/client/miniprogram/platform/navigation-state.ts` | 保存最近稳定识别页面和当前恢复草稿 ID，供一级导航离开后恢复及重开保持 |
| `apps/client/miniprogram/platform/recognition-flow.ts`、`recognition-generation.ts` | 冻结 RecognitionContract 到 R2 业务草稿的边界：新草稿只含 IP／主题／手填价格／nullable R，确认快照深冻结 R 与手动 Grand choices；schema 1 T/P 仅在读取时可靠换算为 R，新写入不带 T/P |
| `apps/client/miniprogram/platform/draw-session.ts` | 本地抽取领域适配：R2 的 Grand/Normal 只读取 `isGrandPrize`，抽取只追加 event 并以不可变初始 R 投影剩余和状态球，满额后返回 `EMPTY_TIER`；legacy 路径继续原有分类与字段语义，撤销、概率和提醒生命周期不变 |
| `apps/client/miniprogram/platform/board-record-r2.ts` | 未来地图的只读投影边界：从版本化正式 BoardRecord 读取位置、IP、主题、价格、tiers、创建时间，不读取 `visibleNumberRuns` 或其他 Provider diagnostic；当前不创建公共地图写入能力 |
| `apps/client/miniprogram/platform/board-outlook.ts` | `board-outlook-v1.1.0` 的小程序随包适配；固定最多三抽观察窗，输出目标／大赏／非小赏／小赏事件和累计成本，不排序、不推荐、不执行抽取 |
| `packages/core/src/types.ts`、`errors.ts`、`result.ts` | 票池、奖项、目标、预算、结果、公式版本、稳定错误和成功／错误联合类型 |
| `packages/core/src/fraction.ts`、`integer.ts`、`combinatorics.ts` | 约分 `bigint` 分数、整数边界和稳定组合数基础能力 |
| `packages/core/src/probability.ts`、`multi-target.ts` | 单抽、至少一次、超几何分布、目标期望、首次命中期望和多目标指定数量精确计算 |
| `packages/core/src/money.ts` | 计划／累计成本、剩余预算、最大可抽数、包套与直接购买现金差；金额均为最小单位整数 |
| `packages/core/src/validation.ts` | 将原始输入归类为可计算、信息不足或存在矛盾，阻止非法状态进入方案计算 |
| `packages/core/src/comparison.ts` | 组合抽取、包套、直接购买和停止的并列解释数据；抽取同时输出达成与未达成概率，不输出排名、价值期望或推荐分 |
| `packages/core/src/constrained-plan.ts` | 用户明确预算、最大抽数和最低概率后的最少抽数证明；缺约束、无解、固定安全披露和 Last 仅包套保证均为稳定结果 |
| `packages/core/src/*.test.ts` | 10 个批准向量、组合数、概率、枚举、金额、校验、四方案、约束最小性、Last 边界、局面可能性与确定性性质回归 |
| `packages/core/src/board-outlook.ts`、`board-outlook.test.ts` | `board-outlook-v1.1.0` 的平台无关局面可能性算法；固定最多 3 抽窗口，精确输出目标、大赏、非小赏与小赏事件，不排序、不推荐、不读取用户画像或外部数据 |
| `packages/board-layout/src/index.ts`、`index.test.ts` | 版面契约版本、注册表标识，以及 `derivePrizeClassification` 大／中／小赏本地派生算法；A—F、SP1—SP4 和已确认特殊赏级按数量阈值分类，G—Z 固定小赏，票数无效时返回未确认；单元测试覆盖 5 张与 10 张临界值、SP1—SP4／特殊赏级、G—Z 与非法票数 |
| `packages/recognition-contract/` | 识别契约版本、响应状态和问题严重度的类型化入口骨架 |
| `packages/session/src/types.ts`、`errors.ts` | 会话／票池／单张轮次／版面快照类型、schema 版本与稳定会话错误 |
| `packages/session/src/session.ts`、`calculation.ts` | 纯状态机、单奖项草稿、原子确认、最近轮撤销、修订保护与即时公式快照 |
| `packages/session/src/copy-session.ts` | 以当前票池创建新身份，保留目标／预算／确认草稿但清空历史、花费和活动状态 |
| `packages/storage/src/codec.ts`、`repository.ts` | Storage V1 JSON 信封、`bigint` 十进制编码、V0 迁移、失败回退、单会话／全部 ICHI 数据删除和容量状态 |
| `packages/storage/src/board-compatibility.ts` | 随包版面 schema、组件注册表、识别契约检查，V0 包装迁移及最近可用快照回退 |
| `apps/client/miniprogram/platform/storage.ts` | `wx.*` 的最小 Storage 驱动与容量状态适配，不把平台 API 放进会话领域层 |
| `apps/client/miniprogram/platform/storage-smoke.ts`、`pages/bootstrap/` | V1-C 开发验证入口；验证保存、重开恢复、删除和容量，不是 V1-E 产品页面 |
| `apps/web/app/page.tsx`、`prototype-frame.tsx` | Next.js 页面入口与 V1-29 原始页面壳容器；服务端只在首次进入时把 URL 的 `view` 参数传给原始网页 hash，内部路由后由同一 iframe 实例使用原生 history 同步父地址，避免 App Router 因查询参数变化重新挂载 iframe、闪现导入页或丢失运行状态；父层只接收当前 iframe 发出的路由消息 |
| `apps/web/app/api/v1-29-source/route.ts` | 读取用户提供的 `/Users/cunfu/Downloads/网页 ui.html` 并以不缓存 HTML 响应交给 V1-29 页面壳，确保字体、图标、类名、字符间距、布局与动效完全使用原文件；响应末尾的桥接层强制页面视图互斥，并负责 hash 路由同步、识别流程页面／滚动恢复、临时相机／加载状态回退、“我的”二级页统一返回与根标签复点、抽取／撤销会话缓存、三位小数概率、逐抽情境提醒、工作台固定层、统一阻塞式视觉中心模态框及“决定收手”长按确认。“正在提取版面”保留原深色旋转圆环，圆环内的旧扫描图标替换为静止的“单线眼睛＋放大镜”票根吉祥物透明素材；“版面已确认”生成状态层的黑色魔法棒旧图标替换为保留弹跳动效的“圆点眼睛＋铅笔”票根吉祥物透明素材。共享取证拍摄页在原始模态壳上保持灰色全屏、顶部安全区返回箭头、取景框—拍摄／重拍—地点备注的纵向顺序。轻提醒吉祥物按本轮奖级的本地大／中／小赏分类分别显示四芒星眼、原圆点眼和眯眼表情，提醒框的垂直中心与顶部状态栏中心对齐。桥接层还以 `ichi:v1-29-local-draw-drafts:v1` 管理用户主动保存的 `LocalDrawDraft`：按 `boardId` 覆盖写入 `localStorage`，在固定导入 Hero 下方渲染独立滚动列表并恢复同一版面状态；识别首页与本地记录共用 Swipe-to-Delete 层，只允许 `unverified + not-uploaded` 草稿按 `boardId` 删除并同步刷新两处列表。“本地记录”把这些草稿与已上传状态预览合并为同一记录总账，显式保存核对／上传双状态；“我的贡献”只过滤 `uploadStatus = uploaded` 的相同 `recordId`，并预留 `likeCount` 零值展示，不维护第二份记录副本。奖票撕揭使用未揭表面与同内容翻片双层结构，翻片围绕动态撕开边界沿正 Z 轴卷起并向观察者飞离，不生成黄色或其他有色卷边伪元素；A—F 字母统一为普通白色。该路由的同源 `POST` 只接收当前版面计数并调用 `apps/web/app/board-outlook.ts`，把 `board-outlook-v1.1.0` 的完整事件结果返回原壳，不在桥接脚本中复制概率公式 |
| `apps/web/app/api/v1-29-camera-icon/route.ts` | 原样输出用户提供的相机图标 PNG，供原始网页壳的导入卡片直接使用；不裁剪、滤镜、重绘或重新编码该图片内容 |
| `apps/web/public/v1-29/ichi-camera-cutout.png` | 用户授权的导入相机图标去背产物；保留黑白图标主体并移除外部白色画布，以透明通道直接贴入导入 Hero 卡，不改变按钮或业务交互 |
| `apps/web/public/v1-29/ichi-mascot-large.png`、`ichi-mascot-small.png` | 用户提供的轻提醒吉祥物四芒星眼与眯眼表情透明底 PNG；分别用于大赏与小赏，本地现有圆点眼 DOM 表情继续用于中赏 |
| `apps/web/public/v1-29/ichi-recognition-mascot.png` | 用户提供的“单线眼睛＋放大镜”票根吉祥物透明底 PNG；用于“正在提取版面”旋转圆环内的静止识别状态图形 |
| `apps/web/public/v1-29/ichi-board-confirmed-mascot.png` | 用户提供的“圆点眼睛＋铅笔”票根吉祥物透明底 PNG；用于点击“确认并生成版面”后的“版面已确认”生成状态层 |
| `apps/web/app/api/v1-29-avatar/route.ts` | 原样输出用户提供的 ICHI 头像 PNG，供“我的”页面的无边框圆形头像区域使用；不修改图片内容 |
| `apps/web/app/light-shell.tsx` | 上一轮手写 React/CSS 壳的功能迁移尝试；不再由页面入口挂载。后续 ICHI 算法与状态只允许逐项接入原始页面壳控件，不能用此文件改写页面外观 |
| `apps/web/app/page.tsx` V1-26 修订 | 拍摄版面改为手机相机式布局：上半屏为纵向全屏取景区域，下半屏为控制区，仅保留圆形拍摄和返回操作；当前仍是网页取景占位，不请求真实相机权限 |
| `apps/web/app/draw-cache.ts` | V1-26 当前浏览器会话缓存适配；以 `sessionStorage` 保存 `boardId`、版面 tiers、抽取记录、最近 50 抽撤销栈和同版面唯一的最新贡献快照，页面重新进入版面时恢复；缓存失败不阻断内存中的抽取流程，不宣称云端保存 |
| `apps/web/app/situation-reminder.ts`、`situation-reminder.test.ts` | V1-30B 的网页低保真情境分析纯函数与固定案例；只从已确认抽取记录、目标和票池快照产生优先级及大赏／中赏／小赏文案，每一抽都交由主版面显示本轮结果；不计算概率、不设置成本节点、不预测或推荐继续抽取 |
| `apps/web/app/board-outlook.ts`、`board-outlook.test.ts` | V1-30D 的网页局面可能性适配与固定案例；用本地大／中／小赏分类汇总当前余票，调用 `@ichi/core` 的 `board-outlook-v1.1.0`，将稳定事件 ID 转为视觉中心模态框文案与三位小数百分比；不排序、不推荐、不执行抽取 |
| `docs/decisions/v1-recognition-and-prize-presentation.md` | 固定模型识别字段表、A1／A2 编号款式合并、特殊赏 SP1—SP4 顺序映射、券位本地求和，以及 A—F／SP1—SP4／已确认特殊赏级的大／中／小赏本地派生与版面呈现规则 |
| `docs/decisions/v1-board-outlook-algorithm.md` | `board-outlook-v1.1.0` 的独立规格：版面特化事件目录、固定 3 抽观察窗口、精确不放回公式、输入边界、版本与固定案例；由 `packages/core/src/board-outlook.ts` 实现并由网页适配层读取 |
| `docs/decisions/v2-contribution-verification-lifecycle.md` | `contribution-verification-v1.0.0` 的独立规格：提交后直接进入后台核对状态、私有证据与公开版面状态的分离、失败回退和幂等；真实服务尚未创建 |
| `apps/web/app/tokens.css` | V1-D 手机优先视觉 tokens：中性灰阶、间距、圆角、导航安全区高度和模态阴影；可由后续视觉探索替换，不承载业务状态 |
| `apps/web/app/v1-29.css` | 仅提供 V1-29 外层原始页面壳容器尺寸；实际视觉、字体、图标、间距与动效直接来自用户提供的 HTML |
| `apps/web/app/styles.css` | V1-D 中性灰阶低保真布局，以及大赏双列正方形、中赏／小赏横向票条、概率、状态浮层与圆形快捷按钮的响应式演示样式；390×844 下识别结果和一番赏版面压缩重复顶部信息，确保至少 5 个奖级完整位于底部导航上方；移动端“收手”固定在底部导航上方的屏幕中央；提交状态框和分享取证框使用当前视口居中的模态层，不固定在版面底部 |
| `apps/web/app/ui/index.tsx` | V1-D 随包 React 基础组件：`Button`、`StateLink`、`PrizeTile`、`TicketSlots`、`StatusNotice`、`Modal` 和 `BottomTabbar`；组件只渲染本地数据，不执行远程 UI 代码 |
| `apps/web/app/layout.tsx`、`next.config.ts`、`tsconfig.json` | Next.js App Router 最小运行壳和网页类型配置；`next.config.ts` 将 `@ichi/core` 随网页编译，并将其源码 ESM 的 `.js` 引用解析为 TypeScript 文件 |
| `apps/web/tests/v1-26.spec.ts`、`playwright.config.ts` | V1-26／V1-29 的 26 条 Playwright 回归：页面互斥与 iframe 不重载、识别页面／滚动恢复、识别圆环与版面确认状态的吉祥物资源和独立动效、导入至版面工作台、双列奖票与双层 Page Curl、抽取／撤销与逐抽情境提醒、提醒／状态栏垂直对齐、局面可能性完整事件与统一阻塞模态、工作台固定层、“决定收手”长按取消／完成、草稿双入口左滑删除、本地记录／贡献分层、二级页返回、异常回退和窄屏布局 |
| `services/cloudbase/functions/recognize-board/` | V1 唯一云能力的安全失败代理骨架；未配置环境密钥时返回稳定错误，不调用识别提供方 |
| `tests/{fixtures,e2e,recognition,visual}/` | 后续区块测试资产的已建立职责目录；V1-A 只含边界说明 |
| `docs/references/project/` | 旧 PRD 和三阶段研究原文，不直接驱动开发 |
| `docs/delivery/` | 历史 Figma／小程序交付参考；不再控制当前 Next.js 网页 UI |
| `docs/decisions/v1-board-catalog-coverage.md` | 已被取代的 V1-01A 产品目录覆盖决策，仅保留历史审计 |
| `data/board-layout/README.md` | V1 版面语法、组件边界、计数规则和验证入口 |
| `data/board-layout/registry/saturated-component-registry.json` | A—Z 奖级、固定辅助组件、布局区域、推导门禁、人工退路和远程代码禁令 |
| `data/board-layout/schema/board-layout.schema.json` | 识别与校正后的版面草稿、券位观察、二维排布和推导结果 JSON Schema 1.0.0 |
| `data/recognition-contract/README.md` | V1 识别交换边界、响应状态、推导规则、人工动作和图片处理说明 |
| `data/recognition-contract/schema/recognition-contract.schema.json` | 识别请求／响应信封、稳定状态、原因码、动作和临时图片边界 JSON Schema 1.0.0 |
| `data/recognition-contract/registry/issue-actions.json` | 20 个稳定问题原因码及其默认人工动作和阻塞语义 |
| `data/recognition-contract/fixtures/` | 完整图、缺图、手写价格和券位计数矛盾四条不含原图的固定数据案例 |
| `data/render-contract/README.md` | 二维只读预览、手机重排、缺图降级、本地组件和安全拒绝规则说明及版面示意 |
| `data/render-contract/schema/render-plan.schema.json` | 本地组件实例、二维源位置、手机流组、问题引用和安全声明 JSON Schema 1.0.0 |
| `data/render-contract/registry/render-policy.json` | 识别状态到渲染状态、16 类本地 renderer、断点、顺序、未知降级和拒绝策略 |
| `data/render-contract/fixtures/` | 完整版面双视图计划与缺边版面只读重拍计划 |
| `data/calculation-baseline/glossary.json` | V1 六个计算术语的输入、输出、限制和示例机器基线 |
| `data/calculation-baseline/vectors.json` | V1 公式、边界、多目标和非法输入的 10 个固定向量 |
| `data/toolchain-baseline/versions.json` | V1-A 精确工具版本、CloudBase 运行时与 OCR 超时、费用和图片边界 |
| `data/recognition-evaluation/` | V1-C QA-only 结构化合成案例；覆盖 A—Z／OTHER 与失败退路，不含真实图片、不声明模型准确率 |
| `docs/decisions/v1-calculation-glossary.md` | V1 计算文案、人可读含义与误解防护决策 |
| `docs/decisions/v1-toolchain-and-recognition.md` | 工具链兼容性、微信测试 AppID、CloudBase 与识别隐私决策 |
| `docs/decisions/v1-session-and-storage.md` | V1-C 纯状态机、Storage、版面兼容、复制会话与识别 QA 边界决策 |
| `docs/design/v1-26-figma-low-fi-brief.md` | 已废弃的 V1-26 Figma 低保真草案，仅保留历史审计 |
| `docs/design/v1-26-web-low-fi-brief.md` | V1-26 的历史低保真起点；其当前产品页面基线已被 V1-29 完整 Next.js 页面实现与验收结果取代 |
| `docs/design/v1-29-mobile-visual-direction.md` | V1-29 的唯一页面壳迁移规格，固定 `网页 ui.html` 的保真边界、功能映射、本地依赖边界和验收条件 |
| `docs/design/v1-29-ui-design-tokens.md` | V1-29 跨页面视觉参数事实源；定义顶部安全区、视觉中心、页面边距、间距尺度、卡片／Hero／操作尺寸、工作台固定层、长按确认、相机例外和页面族变体，供原始页面壳的响应注入层复用 |
| `docs/design/gemini-canvas-all-pages-spec.md` | 基于当前 `apps/web/app/page.tsx` 整理的 Gemini Canvas 单 HTML 全页面、跳转、弹层和按钮占位规格 |
| `docs/decisions/v1-web-ui-nextjs.md` | 记录 Next.js 从早期中间验证层演进为完整批准基线、微信小程序一比一照搬为最终交付端的架构决策 |
| `docs/methodology/` | 泛化工作流与 NeoPRD 方法论研究 |
| `product-atlas/` | 已结束的 NeoPRD/Product Atlas 实验产物，非正式需求源 |
| `canvas/` | Cowart 无限画布历史可视化资产，非正式需求源 |
| `scripts/validate-workflow.mjs` | 检查标准工作流必需文件、所有区块状态、活动区块无锁定 step，以及计划／进度／README／架构联动 |
| `scripts/validate-board-layout.mjs` | 检查 A—Z 完整性、唯一通用奖级组件、辅助组件、排布区域、计数排除项、人工退路和安全边界 |
| `scripts/validate-recognition-contract.mjs` | 检查请求响应关联、原因码与动作、坐标、券位守恒、推导门禁、状态路由和图片不持久化边界 |
| `scripts/validate-render-contract.mjs` | 检查 A—Z 本地映射、二维位置保留、手机阅读顺序、断点列数、问题继承、未知降级和远程代码拒绝 |
| `scripts/validate-v1a-baseline.mjs` | 检查六个术语、10 个固定向量、独立组合数结果和工具链／识别隐私决策完整性 |
| `scripts/validate-v1c-baseline.mjs` | 检查 5 个受控识别案例、A—Z／OTHER、授权元数据、人工退路和不得声明真实准确率 |
| `scripts/verify-quality-gate.mjs` | 先跑清洁质量门，再注入临时 TypeScript 错误验证失败，清理后复跑并证明恢复 |

## 已废弃的活动机制

- `memory-bank/current.json` 已归档到 `docs/references/harness/current-atlas-01.json`；
- `scripts/validate-harness.mjs` 已移除；
- Product Atlas revision 不再控制设计或代码门禁；
- Cowart 页面可以继续查看，但更新不会自动改变正式需求。

## 区块与文件写入边界

- 文件权限按变更目的和活动区块判断，不按路径整体冻结；同一文件未来还会被后续区块扩展，不妨碍当前区块写入当前范围。
- V1-A 已通过人工验收，其版面、识别、术语、向量、工具链和工程骨架可作为批准基线。
- V1-B 已通过人工验收，`packages/core` 的确定性事实、并列方案与约束内最少抽数证明成为批准基线。
- V1-C 的 `packages/session`、`packages/storage`、微信 Storage 验证入口和识别 QA 已成为批准基线；V1-D 的完整 Next.js 页面与后续小程序一比一照搬都可引用这些行为与边界，但不得改写已批准的产品能力。
- 产品行为、技术选择、实际文件职责和执行状态分别联动到 `design-document.md`、`tech-stack.md`、本文件、`implementation-plan.md` 与 `progress.md`，不得只改计划状态而保留冲突的冻结说明。
- V1-D 的 Next.js 完整页面、tokens、组件和 V1-29 全局视觉层，以及 V1-E 的最终小程序页面均已完成自动验证与用户人工验收；V1-31—V1-39 已全部收口。V1-F 当前为 `IN_PROGRESS`：账号、位置、每日配额、一次性识别任务令牌、私有结构化保存、本人记录／删除、维护函数及小程序编排均已实现并部署；真实千问成功调用、黄金样本、赏票二次识别、费用阈值、真机隔离／删除／弱网和最终发布仍受人工门禁约束。

## 规划但尚未创建或尚未实现

以下是跨多个区块的规划结构。V1-D 的完整 Next.js 页面、tokens、组件和交互基线，以及 V1-E 的最终小程序页面已经创建并通过验收；其余目录仍按后续区块门禁推进：

```text
packages/design-tokens/
packages/ui/
docs/qa/
apps/client/miniprogram/pages/<product-pages>/
services/cloudbase/<deployed-environment>/
```

已建骨架和未建模块的后续职责根据 V1 待验收基线调整：

- `apps/web/` 作为 Next.js 手机优先完整批准基线，承载全部页面、内容、行为、组件、视觉、动效、浏览器存储适配与回归；
- `apps/client/` 作为微信小程序最终交付端，一比一照搬网页页面并承载必要的 WXML/WXSS 语法映射、微信平台适配和最终真机验证；
- `packages/board-layout/` 承载版面语法、A—Z 标签、二维排布、大／中／小赏派生和本地条件渲染定义；
- `packages/recognition-contract/` 承载图像请求、字段置信、券位观察和校正草稿契约；
- `packages/session/` 承载平台无关的会话状态机、原子轮次、最近轮撤销和复制规则；
- `packages/storage/` 承载版本化会话存储、迁移、失败回退与随包版面兼容，微信 API 只在客户端适配层出现；
- `services/cloudbase/` 已具备并部署 V1 私有后端契约、资源清单、共享核心和事件函数；版面识别代理已部署为 `qwen3.7-flash` 临时 URL链，并完成真实拉图、模型计费调用、Provider Schema、Normalize、失败闭合和临时对象清除烟测。共享文档读取层会剥离 CloudBase `_id` 等服务端元数据，禁止在配额和任务的整文档事务写入中回写只读系统字段。尚未完成的是赏票识别契约与真实黄金样本／弱网／隔离／删除验收。它不增加照片长期存储、完整工作台跨设备同步或用户公共写入；V2 再按批准方案接入现实版面合并、审核与地图发布；
- `tests/recognition/` 承载经授权的版面样本、字段标注和识别回归。

V2 公开账号资料、现实版面合并、单次地图贡献发布、线索查询、公共写入与审核端，以及 V3 多人版本协作，仍不能在各自决策门前初始化。

## 更新规则

- 创建、移动、删除或改变重要文件职责后更新本文件；
- 只记录已发生的结构变化；
- 计划中的目录保留在“规划但尚未创建”；
- 重要结构变化发生时立即与 `progress.md` 联动更新；区块通过人工验收时再做一次收口核对；
- 重大架构选择在 `docs/decisions/` 增加决策记录。

## 2026-08-25 Simple Semantic 隔离实验

- `data/recognition-contract/prompt/ichi-board-vlm-simple-1.0.0-exp.txt` 与 `data/recognition-contract/schema/board-provider-simple-1.0.0-exp.schema.json` 是独立的 Prompt 大减法实验协议；它们不被生产 `recognize-board/index.js` 引用。
- `experiments/simple-semantic/` 只为离线 A/B 保存最小 Provider 调用、严格 null／整数处理、A1/A2 确定性合并、SP 顺序映射、RecognitionContract 构造、Golden manifest 与定向测试；它位于 `services/cloudbase/functions/` 外，不是 CloudBase handler，也不进入部署清单。
- `scripts/benchmark-simple-semantic.mjs` 使用同一真实图片 URL、同一 `qwen3.7-flash`、non-thinking、temperature 0 与 `max_pixels=6291456` 对照生产 v4 和 Simple；临时对象测试后删除，原始响应与指标只写入 `artifacts/simple-semantic-experiment/2026-08-25/`。
- 首轮结果为 `MIXED RESULT`，因此没有追加稳定性或 Thinking A/B，也没有切换或部署实验。生产入口仍固定 `ichi-board-vlm-4.0.3-rc1` + `board-provider-extraction-4.0.0-rc1` → `normalizeV4Extraction`。

## 2026-08-26 Remaining Observation R0 隔离实验

- `data/recognition-contract/prompt/ichi-board-vlm-remaining-observation-zh-r0-1.0.0-exp.txt` 与 `data/recognition-contract/schema/board-provider-remaining-observation-r0-1.0.0-exp.schema.json` 定义仅输出 `rawLabel/openOrdinals/observationComplete` 的纯余票位观察协议；它不进入 `recognize-board`，也不改变 RecognitionContract 1.0.0。
- `experiments/remaining-observation-r0/remaining-observation-resolver.js` 只做 NFKC 标签、正整数校验、ordinal 去重、complete 门禁、child-first 聚合和 SP 视觉顺序映射；不会补连续区间、读取 Golden 或计算 total/pasted。
- `scripts/benchmark-remaining-observation-r0.mjs` 与 `scripts/report-remaining-observation-r0.mjs` 固定六张原图 SHA-256、Prompt/Schema hash、同一 Provider 配置、逐请求原子落盘、Frozen H0 artifact 对照、离线评分和 Gate 报告。完整 raw、AJV、resolver、baseline、comparison 与报告位于 `artifacts/remaining-observation-r0-experiment/2026-08-26/`。
- First pass 结论为 `R0 PROMISING BUT NOT SAFE`：JSON/AJV 6/6，remaining exact 49/66（74.2%），相对 H0 +27.3pp，但 live recall 82.6%、decision set 3/6、false zero 6。Hard Gate 失败后未运行 stability、未创建 R1、未部署；生产仍为 Frozen H0 `hybrid_semantic`。
2026-08-25 V1-F 识别进度动画收口：新增 `platform/recognition-progress.ts`，把 CloudBase／Provider 真实事件形成的 `targetProgress` 与 Canvas 实际绘制的 `displayProgress` 分离；控制器通过页面 Canvas `requestAnimationFrame`（测试／无 Canvas 时使用 16ms 帧调度）动态缓动，但在下一真实事件前分别停在 `15/35/80/100` 边界内。`pages/home` 只在整数显示值或阶段事实变化时 `setData`，每一帧直接复用同一 Canvas 上下文绘制完整浅灰底环和 `lineCap=round` 黑色弧，避免低频状态更新造成跳动。进行中节点使用单个清晰的紫色中心点与柔和单色呼吸光，避免误呈现为单选框。成功链显式等待 `finishProgressAnimation()`，显示进度到 `100` 且 stage 4 后通过 `consumeCompletion()` 一次性进入识别结果；失败结果不再发出 `result-ready`，离页／卸载统一取消帧、轮询与 Canvas 引用。识别 Prompt、Provider Schema、CloudBase 业务算法和 Qwen 配置未改。
2026-08-25 V1-F P0 识别服务回滚恢复：v5 部署后的真实 `assisted-draw` 任务已在私有 `recognitionJobs` 中确认以 `RECOGNITION_SCHEMA_INVALID` 失败，证明客户端 `RecognitionContract 1.0.0`、任务认领、临时 URL 与 Provider 请求均已通过，首错位于 v5 Provider AJV 边界。线上 `recognize-board` 已只回滚模型面对的协议为 `qwen3.7-flash + ichi-board-vlm-4.0.3-rc1 + board-provider-extraction-4.0.0-rc1`，保留 v5 Normalize 作为非生产兼容输入，也保留 immutable snapshot、Board 守恒门、本地快速确认、pending finalization 与配额提交边界。反向下载确认线上常量与回滚版本一致；女神异闻录 30 周年普通编号版面经真实 Provider、v4 AJV、Normalize、RecognitionContract 和客户端 parser 得到可编辑结果，A—H 计数与既有 Golden exact 一致。临时 Golden Storage 对象已删除。
2026-08-27 V1-F R2 上传审核链路收口：抽取仍以本机 history 为事实输入，在拍摄赏票时一次提交稳定 `eventId` 的完整 batch；服务端用 CloudBase transaction 读取同一 observation 的不可变 `initialSnapshot` 和已持久化 authoritative events，校验同版本 payload 一致性、跨请求 event 幂等与 `drawnCount <= initialRemainingTickets` 后原子写入 authoritative events 和派生 `finalSnapshot`。赏票生产入口继续复用 `recognize-draw-tickets`，按 LOCATION→PHOTO→NOTE→APPROVED 顺序执行：位置半径只读显式 `PRIZE_TICKET_LOCATION_RADIUS_METERS`，缺失保持 `LOCATION_PENDING`；PHOTO 复用冻结的 `prize-ticket-verification-v2` Qwen 协议；NOTE 只接受 CloudBase `security.msgSecCheck` 明确 pass，未知或异常 fail closed。PHOTO retry 继承已通过位置，NOTE retry 继承位置和照片；备注文本变化先撤销旧 approval。确定性 `recordId + boardId + submissionVersion` attempt 防止重复正式记录。APPROVED 仍写入 owner-scoped `observationCandidates`，保存最终 `userNote`、稳定 `ownerAccountId`、结构化 location、R2 baseline tiers、authoritative events 和派生 snapshot；不写新 T/P、Provider raw 或长期图片引用。未来地图只允许从 APPROVED observation 投影结构化位置与业务字段；公开作者投影只含 nickname/avatar，当前未创建公开地图或公开 profile lookup。部署清单新增位置半径必填配置与 `security.msgSecCheck` OpenAPI 权限校验；因生产阈值尚未提供，本次业务函数部署保持阻塞。
