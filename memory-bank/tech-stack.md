# ICHI Technology Stack

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

## 5. V2 增量技术

V2 只有合法数据源通过决策门后才锁定云资源。

下表复用 V1 的微信身份、账号、私有观察和删除基础；公开资料、地图贡献、提醒与分享仍是待 V2-00／V2-03 人工批准的增量技术基线。

| 层 | 首选方向 | 说明 |
| --- | --- | --- |
| 服务端 | 复用 V1 CloudBase 云函数与受控治理接口 | V2 增加现实版面候选匹配、来源核验、审核、版本、公共快照和地图查询；不能让客户端、千问或 Luna 直接写公共集合 |
| 认证 | 复用 V1 `wx.login` 身份映射与 ICHI 服务端会话 | V2 增加可复制的公开 `ICHI ID` 和可编辑资料；内部 `accountId` 继续不可枚举且不公开，所有地图贡献由服务端会话确定 `ownerAccountId` |
| 数据库 | CloudBase 文档数据库 | 复用 V1 Account、WeChatIdentity、Session、RecognitionJob、ObservationCandidate 与 DrawSubmission，增加 ContributionDraft、BoardInstance、BoardVersion、BoardSnapshot、WatchRule、NotificationDelivery、审核和删除状态；`recordId` 保留每位贡献者的观察，多个六位码可以关联同一 `boardInstanceId`，但不参与鉴权或现实版面去重 |
| 对象存储 | V1 只使用私有 `recognition-temp/` 临时传输前缀，不建立版面图片资产库；V2 是否需要非版面资产另行评审 | 临时对象正常链路立即删除，异常孤儿对象使用 COS 最短 `1` 天过期删除且没有数据库引用；V2 地图默认只显示结构化文字、数值和确定性图表，不因为地图发布而补存 V1 原照片 |
| 地图 | 腾讯位置服务／小程序地图能力 | 中国大陆双端一致性优先，必须单独评审许可与隐私 |
| 提醒 | 服务端空间匹配 + 微信小程序订阅消息 + 应用内提醒 | 只匹配用户明确保存的关注地点／半径，不依赖小程序关闭后的持续定位；订阅许可、模板类目、发送去重、频控、静默、失效和降级必须可验证 |
| 分享 | 小程序原生转发 + Canvas 分享海报 + `wx.showShareImageMenu`／保存相册 | 地图分享使用可撤销公开链接；抽赏海报默认只在本地生成，微信图片面板用于好友／群、朋友圈、收藏或下载；小红书等第三方平台通过保存相册后由用户手动发布 |
| 观察上传 | 浏览器 MediaDevices／相册输入 + 临时多模态识别 | 照片只服务当次抽取，用户同意并最终确认后只保存结构化观察、位置、时间、修订和版本 |
| 内容抽取 | 仅对合法取得内容调用多模态模型 | 候选模型在 V2 实施时基于成本、准确率和合规重新评估 |
| 后台 | 最小内部审核页 | 只服务来源审核、字段修正和下线，不建设商家后台 |
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

- 先使用授权样本或人工策展做封闭试验；
- 任何可能进入地图的个人提交必须绑定认证账号；地图浏览和 V1 本机抽赏保持游客可用；
- 删除、下线和来源审计通过后才能公开地图。

### V3

- 先白名单贡献与人工审核；
- 证明身份绑定、冲突和回退可靠后再扩大范围。

## 9. 需要在后续区块锁定的决策

- V1-E/F 锁定完整网页基线到小程序的一比一照搬、平台映射和验证边界；
- 取得经授权真实版面图片后，锁定 OCR 的真实准确率基线，以及是否需要更换或增加多模态服务；V1-C 合成契约基线不替代此评估；
- V1-F 已锁定账号先于识别、两条入口都要求本次位置、照片绝不持久化、初始结构化快照与抽赏后差量推导、账号／记录删除级联，以及“我的记录／我上传的版面”的待上传／待核对／已上传状态文案；百炼凭据已经在开发环境完成，具体费用熔断线仍需用户批准；
- V2 锁定地图公开贡献者标识、订阅消息类目／模板资格、目标基础库的分享能力、地图服务、数据许可和历史候选启用规则；
- V2 多模态模型及成本上限；
- V3 是否迁移到 PostgreSQL 与独立对象存储；
- Next.js 完整网页基线与识别服务的验证、构建和回归流程；微信小程序一比一照搬、构建、真机验证和发布流程在 V1-E/F 完成。
