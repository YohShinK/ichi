# ICHI Progress

2026-08-29 V1.0.0 PLAN FINAL CLOSURE：当前权威项目状态为 `V1 DEVELOPMENT=COMPLETE`、`V1 ARCHITECTURE=FROZEN`、`V1 RELEASE CANDIDATE=COMPLETE`、`V1 RELEASE COMMIT=COMPLETE`、`V1 WECHAT SUBMISSION=COMPLETE`、`V1 FILING/LISTING PREPARATION=COMPLETE`、`V1 SUCCESSFUL PUBLICATION=PENDING`。release branch 为 `release/v1-freeze-20260828`，release source commit 为 `f6aa06fca21104a0a406823e5e8c6cc4ab493ab7`（`release: finalize ICHI v1.0.0`），保持不变。用户已明确微信小程序 V1.0.0 完成 upload／送审，备案、隐私与其他上架准备全部完成；尚无审核通过或正式发布事实。

V1 唯一活动计划为 `V1.0.0 WECHAT SUCCESSFUL PUBLICATION`，checkpoint=`PENDING_WECHAT_REVIEW`。DONE：feature/architecture freeze、56 files／541 tests full regression、TypeScript、ESLint、contracts、workflow/V1-F、19 CloudBase functions validation、Next.js build、same-version v3 真机 APPROVED、release commit、微信 upload／送审、备案／隐私／上架准备。PENDING：审核通过、用户正式发布、后台确认 `1.0.0` 正式版、最小线上启动 smoke、关闭 successful publication 与整个 V1 milestone。审核拒绝时只开一个基于真实拒绝原因的最小 `REVIEW_BLOCKER`，不重开全部 V1；审核通过后转 `READY_TO_PUBLISH`，正式发布与最小 smoke 均通过后才标记 V1 `CLOSED`。

计划审计口径：11 个 V1 major plan groups `CLOSED`，8 个中间方案 `SUPERSEDED`，V1.0.1 与 V2 共 2 个 plan groups／11 个具体事项转为 `BACKLOG / NOT_STARTED`，V1 `ACTIVE` count=`1`。下方所有较早日期中的 `READY`、`IN_PROGRESS`、`AWAITING_REVIEW`、`BLOCKED`、待真机、待部署或待发布均为历史证据快照，状态已归档，不再构成当前计划。V1 source 在审核期间冻结；普通优化进入 V1.0.1 backlog。push release branch 与 optional tag 属于 post-publication source-control housekeeping，由用户另行决定，不是微信发布 blocker。

2026-08-29 V1.0.0 最终产品冻结 `PASS`：用户真机确认原 `recordId`、原 submission v3 与原 `imageFileId` 的 same-version retry 直接进入 `APPROVED`，没有重新上传、创建新 submissionVersion、重复 draw 或重复 quota；DRAW SESSION blocker 未再复现。用户据此明确批准 V1.0.0 完全冻结，当前只组装并人工审阅 staged release candidate，不再开发新功能。微信开发者工具的组件按需注入与随包图片／音频累计大小两项均为 recommendation-only，不构成上传或审核 blocker；V1.0.0 `SHIP_AS_IS`，`lazyCodeLoading: requiredComponents` 以及 `ichi-camera-cutout.png`、`ichi-avatar.png`、`ichi-recognition-mascot.png` 优化统一 `DEFER_TO_1_0_1`。本轮不修改 `app.json`、不压缩／迁移 PNG、不进入 V2，不执行 commit、push、tag、微信上传、提审或发布。

2026-08-29 V1 FRESH PROVIDER FAILURE FORENSICS / publication blocker 自动收口完成，状态 `READY_FOR_PROVIDER_RETRY_TRUE_DEVICE`：只读锁定真机最新 `record_b329…23a1 / board-…d999 / v3`，图片约 `215.62`（CLI unit）JPEG 仍在 Storage，attempt 与 P1 均未被调查／部署改写。链路证据为 getTempFileURL 成功并提供有效 HTTPS、Provider request 已发送、HTTP 200／2170ms／RequestId `chatcmpl-005d…07ce`、body/envelope/content/JSON/AJV 全通过、`physical_tickets` 五票；draw facts 为 `A/B/B/C/D`、expected `A1/B2/C1/D1`。generic failure 发生于 AJV 后，结合专用 normalize error code、fail-closed note adapter 和历史 observation 大字段 `-502001`，根因锁定为 APPROVED publication transaction 再次复制 snapshot/events 到 P1。

先补两条红灯：CloudBase 拒绝 observation 大字段更新时核验从 APPROVED 退化为 PROVIDER_FAILED；更新 attempt 失败时读取层没有从 published version 恢复 P1 内容。最小修复改为 P1 只存单调 `publishedSubmissionVersion` 小型指针，`get-my-records` 精确合并对应 APPROVED submission；新增 AJV 后五级 checkpoint 和 `errCode` 兼容。定向四文件 135 项与整库 56 文件／541 项、TypeScript、ESLint、contracts/workflow、V1-F、19 函数 build/static、Next build、diff check 均通过；本轮文件 Prettier 全绿，全仓格式门仅被既有未跟踪 `artifacts/.../production-smoke.json` 挡住且未改用户残留。仅 code-update `recognize-draw-tickets`、`get-my-records`，生产运行时／入口／Active/Available／layer v1 与环境键完整，反向树 hash 为 `7095d04d…397b`、`96b059ff…02ff`。Qwen/msgSecCheck 自动调用 0、quota 额外消耗 0、stage/commit/push 均 0；下一步由用户点击“重新核验当前照片”，不得新建 submission 或重新上传。

2026-08-29 V1 PHOTO production forensics 根因已确认：CloudBase CLI 单次授权成功后，全程只读锁定最近两条真实 failure——脱敏 `record_b329…23a1 / board-…d999 / v1` 与 `record_6ebb…fd2a / board-…62ce8 / v5`。两者 submit、当前 Sx identity、LOCATION PASS（3.30m／1.72m）、Storage fileID 版本路径、五条 `A/B/B/C/D` authoritative events 和 expected `A1/B2/C1/D1` 均一致；对应 deletion job 证明图片在错误终态后立即完成删除。第二块 Board 的 v1-v5 加第一块 v1 共六次连续在约四分钟内以 `PRIZE_TICKET_PROVIDER_FAILED` 结束，均无 result/photoReview/provider diagnostics；CLS 返回空，旧实现又未持久化 HTTP/checkpoint，因此 raw response 与更细 provider 子原因不可恢复，明确为 `PROVIDER_RAW_EVIDENCE_UNAVAILABLE`。同模型／Prompt／Schema 在约七小时前存在同样五票 expected 的 HTTP 200、AJV PASS、VERIFIED 生产对照。

真实 release blocker 是 Provider 技术失败被错误映射为业务终态 `PHOTO_FAILED`，清空并即时删除 evidence，使客户端显示“照片核验失败”且不能 same-version retry；不是照片 reconciliation mismatch。新增生产等价红灯准确得到 PHOTO_FAILED、HTTP null 与删除图片，最小修复后为 `PROVIDER_FAILED`、保留当前 image、保存 stage/HTTP 诊断并允许同版本重试；正确 `A1/B2/C1/D1` fixture 继续 VERIFIED，错误赏级继续 MISMATCH。生产两条 draw facts 均为五抽而非四抽；自动 A/D→reset→B/C 四抽 fixture 只证明 UI exit invariant，不能替代生产事实。A/B correlation 最终为 `INDEPENDENT`：UI state exit 不改 history/boundary/version，PHOTO 六次失败跨两个 Board 且统一发生在 Provider 技术层。

最终定向 10 文件／213 项、整库 56 文件／539 项、TypeScript、ESLint、Prettier、contracts/workflow、V1-F preflight、19 函数 CloudBase build/static validation、Next.js production build 与 diff check 全绿。只部署 `recognize-draw-tickets`；code deploy 曾把未声明的 5 个既有环境变量移除，反向配置门立即发现后使用部署前只读值 merge 恢复，仓库 `cloudbaserc.json` 无密钥差异。最终线上 6 个环境键完整，函数 Nodejs20.19、`index.main`、Active/Available、layer v1，反向 7 文件树 hash 与本地均为 `54285603ac7be8072bc822bca06efdf2b93d5b8961ea8f41eb66a839bbc3d4e1`，action `index.js` hash 均为 `4aec1842c4b9742e47127aca7cdf159ff5c7dee21580857ac492d6dd4cc7b0b8`。未调用 Qwen/msgSecCheck、未重置或消耗 quota、未改 Storage CUSTOM／Days=1／DB ACL／Frozen R2／7 rules，未 commit/push。状态 `READY_FOR_DRAW_SESSION_AND_PHOTO_TRUE_DEVICE_RETEST`。

2026-08-29 V1 DRAW SESSION EXIT + PHOTO VERIFICATION 联合收口历史阻塞快照 `BLOCKED_PRODUCTION_EVIDENCE`（已由上方取证解除）：BLOCKER A 已确认是 `LATE_ASYNC_OVERWRITE / UI_STATE_EXIT`，不是小程序进程 crash、navigation 或 runtime exception。ACTIVE_DRAW 中两次 draw 已从 Storage read-back 确认持久化；`refreshCloudRecords` 完成后的 pending-deletion recovery 无条件传入 null active identity，触发 `refreshDrafts` 将 draw fallback 到 start/import。红灯 1/1 精确失败后，最小改为恢复／后台完成链使用当前 active identity；组合回归确认重进前 A/D、重进后 A/D、继续抽后 A/D/B/C，不覆盖 remaining，不推进 upload boundary，submit 与 verify 使用同一 board、version 1 和 current image，四条 authoritative events全部进入本次 NEW upload。

该历史快照中的 PHOTO production evidence 缺口、`NOT_PROVEN` correlation 与授权阻塞均已由上方最新记录取代。

2026-08-28 V1 Current Publication 架构自动收口完成，状态 `READY_FOR_V1_PUBLICATION_ARCHITECTURE_TRUE_DEVICE_RETEST`：最终领域模型为 Local Board B1（本机 `boardId`）、Upload Submission S1/S2…（云端 attempt + `submissionVersion`）和 Current Cloud Publication P1（owner+board 最多 0/1，稳定 `recordId`）。首次通过建立 P1；后续只有完整 APPROVED 才原子覆盖同一 P1，pending／failed／Provider 或网络异常及迟到旧版本均不改变上一版可信 P1。MY_RECORDS 只显示 B1，MY_UPLOADS 只显示 current P1；未来 MAP 也只能消费 current-only 投影，但 V2 公共地图仍锁定。删除 B1 不动 P1；明确删除 P1 后当前设备才级联删 B1，网络／未知响应保留 B1，持久 marker 支持崩溃后幂等续跑，显式墓碑阻止 lazy recovery。

红灯测试先准确暴露“失败 attempt 提前覆盖 publication”及删除恢复缺口，最小修复后定向 5 文件／152 项与整库 56 文件／534 项 Vitest、TypeScript、相关 ESLint／Prettier、contracts、workflow、V1-F preflight、19 函数 CloudBase build/static validation、Next.js production build、Playwright 26/26 和差异检查全部通过。Frozen R2 Prompt／Schema／resolver SHA-256 仍为 `c083066c80999722a2e3207f64654c598e418daf1c51dba35d57abf0291a3462`、`178c3fffb9ad74257ad6fb0123509beacbd011225eae2aa7eb2d648beb690722`、`46ffebadc3094412c4beb9c8625acdf83346b496e382fe40a48083ff101411d8`。

生产仅代码更新 `finalize-board-observation`、`finalize-draw-update`、`get-my-records`、`recognize-draw-tickets`，四者均为 Nodejs20.19 `Active/Available`、`index.main`，环境与依赖层保持；反向下载树哈希依次为 `eea84abd934a110db8af6346d470fd883917449b5a63c14a7eda788e89453e7b`、`370fbab9f1a53d1b9c8514de474a633c66c29f7508c0fb7632b57f07f9d5e69a`、`c4ab06aa549a57f4a599e3b0216bc44680a9f44e606a49aafa89775a054ad3e9`、`47699adf926ab49a96c190fb6cf8916f3ab43b5fa60b01f037d3b53913a810aa`。部署后只读回读确认 5 条历史 publication 全部为 `deleting`，同 Board 的两条也均非 active，故 active duplicate=0、无需迁移；当前测试账号当日额度仍为 `limit=5/used=0`，未再次重置。未调用 Qwen/msgSecCheck，未改 Storage／ACL／Frozen R2／H0，未上传微信小程序，未 commit/push/merge/tag；唯一剩余门是用户真机按本任务 7 组生命周期场景复测。

2026-08-28 V1 MY_RECORDS projection ownership + recognition quota blocker 历史收口：三次删除根因、MY_RECORDS local-only、repository-only 删除、额度快拒绝与 stale-zero 失效继续有效；其中“MY_UPLOADS 展示同 Board 多 Observation、云端删除不删 B1”的中间结论已由上方 Current Publication 最终收口替代。额度生产快照从 `limit=5/used=5` 只重置当前测试账号到 `limit=5/used=0`，历史 reservations 保留；本轮最终回读仍为 `5/0`。

2026-08-28 V1-F 三项界面交互修订 `AWAITING_REVIEW`：NOTE_FAILED“修改备注”点击“重新核验备注”后立即关闭弹窗、保持在“我上传的版面”并先投影为 `note-pending`，后台 `review-note` 结果不再通过弹窗或结果 Toast 阻塞用户；用户可通过列表下拉刷新或再次进入查看终态，技术失败仍投影为 `provider-failed` 并保留提示。赏票拍摄备注标题改为“门店地点与备注（必填）”，placeholder 改为“万达广场B1 XX店可以捡漏”；“设定大赏”说明改为“请根据原始版面标注，自行勾选大赏”，不再暗示以当前未贴票数自动判断。未修改赏票核验协议、服务端审核规则、识别链或大赏选择业务。定向 3 文件／97 项、整库 56 文件／526 项 Vitest、根 TypeScript、相关 ESLint／Prettier、Next.js production build、contracts/workflow 与差异检查通过；未部署，微信开发者工具与真机未运行。

2026-08-28 V1 Release Source Freeze `PASS`：从 `main@f3bcbe2d0fc490f705e87b65ff64d39e1810bbf3` 建立本地 `release/v1-freeze-20260828`，先在仓库外保存 tracked／staged binary patch、完整 status、全部 untracked 清单与归档并校验只读快照。按展开文件粒度分类原始 441 个 dirty paths，只将 V1 runtime／release source、长期维护测试与构建源、必要 fixture／协议资产和正式发布文档纳入 freeze；POST_V1、generated/temp、旁支工具、secret 和低置信历史／未引用文件均不提交、不删除。生产只读复核确认 19 个 CloudBase 函数均为 Nodejs20.19 `Deployment completed`，最近关键函数整包或 action-specific 与本地 release artifact 一致，无 `LOCAL_V1_BEHAVIOR_NOT_DEPLOYED`；Storage `CUSTOM` 与 `recognition-temp/ Expiration.Days=1` 保持，Frozen R2 三 SHA 保持。正式 manifest 为 `docs/delivery/v1-release-freeze-manifest.md`，其所在 Git commit 即 freeze revision；本轮未部署、未调用 Qwen/msgSecCheck、未上传微信小程序、未 push、未创建正式 tag。

2026-08-28 V1-F 记录列表下拉刷新 `AWAITING_REVIEW`（纠正上一版上拉语义）：“我的记录”和“我上传的版面”已在进入时主动刷新本机／云端数据；两页 `scroll-view` 启用增强滚动与双向 `bounces`，内容面保持比可视区多 1px，因此记录不足一屏或为空时也能在顶部下拉、底部上滑越界后回弹。只有顶部 64px `refresher` 触发互斥刷新，完成后关闭 triggered 状态并回弹到顶部；底部不再绑定 `scrolltolower`、不发刷新请求。刷新前收起 swipe delete，既有列表滚动位置记忆、记录业务字段与草稿滑动删除保持不变。定向 2 文件／65 项及集成 3 文件／87 项、整库 56 文件／513 项 Vitest、根 TypeScript、相关 ESLint／Prettier、Next.js production build、contracts/workflow 和差异检查通过；未修改 CloudBase、识别模型或记录业务协议，未部署。微信开发者工具与真机未运行，等待用户确认短列表／空列表的顶部下拉刷新、刷新后顶部回弹及底部纯回弹手感。

2026-08-28 V1 Storage Closure 最终权限与 orphan-proofing `PASS`（取代下方专项 `PARTIAL` 快照）：生产 Storage 已从 `PRIVATE` 切换为 `CUSTOM`，等待生效窗口后再次读回且表达式完全一致。客户端规则只允许本人读取／写入／删除 `profile-avatars/`，`recognition-temp/` 对所有客户端禁止读取、只允许本人写入／删除，其他前缀全部拒绝；CloudBase 控制台与服务端继续绕过客户端规则。服务端临时对象烟测完成上传、逐字节下载、未签名读取 `403` 和删除，结束后 `recognition-temp/` 仍为 0；生产总对象清单仍只有一张被 profile 引用的 2861-byte 头像。底层 COS bucket 已配置并再次读回唯一启用规则 `ichi-v1-recognition-temp-expire-24h`：只匹配 `recognition-temp/`，`Expiration.Days=1`，明确排除长期 `profile-avatars/`；平台按日异步处理，因此口径是“1 天到期兜底”，不是精确到上传后第 24 小时删除。应用层即时双删、持久 deletion job、每 10 分钟／每日补偿保持不变，登记前崩溃窗口现由平台 lifecycle 闭合；不新增 maintenance scheduler。仓库新增客户端权限行为矩阵，orphan audit 将 `recognition-temp/` 安全删除阈值统一为 24 小时，并明确任何未引用头像仍为 `UNKNOWN_DO_NOT_DELETE`。专项 2 文件／19 项与整库 56 文件／511 项 Vitest、双 TypeScript、相关 ESLint／Prettier、19 函数 CloudBase build/static validation、contracts、V1-F preflight、workflow 和差异检查全绿；Frozen R2 Prompt／Schema／resolver SHA-256 分别为 `c083066c80999722a2e3207f64654c598e418daf1c51dba35d57abf0291a3462`、`178c3fffb9ad74257ad6fb0123509beacbd011225eae2aa7eb2d648beb690722`、`46ffebadc3094412c4beb9c8625acdf83346b496e382fe40a48083ff101411d8`，本轮未修改。未调用 Qwen/msgSecCheck，未发布小程序，未部署云函数，未修改数据库 ACL、冻结 R2/H0 或 V2，未 commit/push。

2026-08-28 V1 Closure Storage 专项 `PARTIAL`：生产对象逐项关联审计后，安全删除 `recognition-temp/` 中两张无生产／测试／benchmark 依赖且本地原图仍在的 Golden diagnostic crop，以及一张已无 `observationCandidates`／`drawSubmissions` 引用、对应 deletion job 已完成而正式机制无法再触达的历史赏票 orphan；没有删除任何头像。复审时 Storage 只剩一张 `2861` bytes、`132×132` JPEG 的当前头像，且唯一被 `profiles.avatarFileId` 引用；审计期间曾出现的一张近期版面临时图随后由正常双重清理链自行消失。新增只读 `scripts/audit-cloudbase-storage.mjs`，固定输出 `ACTIVE_TEMP / REFERENCED_LEGACY / EXPECTED_PROFILE_ASSET / GOLDEN_DEV_ASSET / ORPHAN_SAFE_TO_DELETE / UNKNOWN_DO_NOT_DELETE`，默认不删除。头像更新改为新引用提交后再删旧图，失败进入 `deletionJobs`；昵称审核／绑定失败的新上传图走客户端删除并回退服务端持久清理；账号删除先清头像。赏票提交创建 50 分钟到期的 Storage cleanup job，终态同步删除成功即完成，失败由既有 `reconcile-stuck-jobs` 每 10 分钟接管并继续复用 `retry-deletions`；`recognize-board` 的双重删除若仍失败也会写同类 job；未新增 scheduler。部署 `bind-wechat-profile`、`delete-my-account`、`retry-deletions`、`reconcile-stuck-jobs`、`recognize-draw-tickets`、`recognize-board`，六者均 Active/Available、Nodejs20.19、`index.main`，触发器／环境变量键／权限配置保持且反向下载逐文件一致；`recognize-board` 新 ModTime 为 `2026-08-28 01:03:43`，改动仅为删除失败入队。专项 5 文件／76 项、整库 55 文件／496 项、Playwright 26/26、类型、Lint、格式、Next build、19 函数构建静态校验、contracts/workflow 全绿，冻结 R2 三 SHA 未变；未调用 Qwen/msgSecCheck，未发布小程序，未 commit/push。ACL 仍为 PRIVATE、rule 为空；旧 CUSTOM `read:false` 在当前套餐仍不可用，而且直接套用会阻断当前 owner 头像下载路径，因此改判为升级后的 defense-in-depth，不是 V1 blocker。唯一未闭合项是平台级 `recognition-temp/` 24 小时 lifecycle 尚无生产 read-back 证据：上传成功但在登记／调用前崩溃的版面图仍只能由人工审计发现，故 Storage Closure 不能记 PASS。

2026-08-28 V1-F 小程序布局收口 `AWAITING_REVIEW`：设定大赏的两列网格改为容器内缩 10px、列间距 8px，卡片维持响应式等分并收紧水平 padding，避免右列及选中描边贴边裁切；NOTE_FAILED“修改备注”弹窗改为紧凑自适应高度，备注输入框以 `border-box` 限宽居中，说明文字移到输入框下方，主操作与说明增加 24px 间距。真机后续确认通用 `.action-button` 的 288px 固定宽度超过弹窗内 272px 的居中光晕容器，已为备注操作局部改为继承 wrapper 的 100% 宽度，使按钮与光晕共用中心轴和左右边界。未修改识别、赏票核验、数据映射或云端逻辑。定向 2 文件／44 项 Vitest、相关 ESLint、Prettier、workflow 与差异检查通过；微信开发者工具与真机未运行，等待用户检查右列安全边距和弹窗实际尺寸。

2026-08-28 V1 Closure Step 1 完成并纠正原审计口径：部署前反向下载的整包 hash 显示三个目标均与本地不同，但 action 独立哈希证明只有 `finalize-board-observation` 存在 R2 行为缺口；`delete-my-record` action 已逐字节一致，`retry-deletions` action 仅有格式换行差异、去空白后一致。4 个定向测试文件／51 项 Vitest与整库 54 文件／485 项 Vitest、19 函数 CloudBase build/static validation、contracts/workflow、根与 Web TypeScript、相关 ESLint、Node 语法和 `git diff --check` 通过。随后按用户批准名单只更新这三个函数代码，生产反向下载的确定性目录 hash 分别与本地完全一致：`19f5765f6e3440fd557e8297092ff66f5f4e6e450e133788c946f18ce8e33109`、`68823c896d703f8dcbecbc0f3422714ac4484cf8273fcb0c13c6530cdbcf4fd8`、`8566c9698a23b5875ef5afbe146c01c9172af8569fdb3319139aae4a7e4e6e41`。三者均为 Nodejs20.19 `Active/Available`、`index.main`；`daily-deletion-retry` 仍以 `0 20 3 * * * *` 启用。无身份/无维护令牌 smoke 分别稳定返回 `TRUSTED_IDENTITY_UNAVAILABLE` 与 `MAINTENANCE_TRIGGER_REQUIRED`，未调用 Qwen/msgSecCheck、未创建或删除数据。`recognize-board` 修改时间仍为 `2026-08-27 15:39:59`，冻结 R2 三 SHA 未变；`recognition-temp/` 三个遗留对象清单 byte-identical，profile avatar、Storage ACL/生命周期及微信小程序均未处理。V1 后端 action-specific 生产部署完成度应由 18/19 修正为 19/19，而不是原审计报告的 16/19；V1-F 总区块仍等待 Storage、真机/人工验收和微信正式发布收口。

2026-08-27 V1-F 最终上线收口 `AWAITING_REVIEW`：生产 `recognize-draw-tickets` 已用 merge 方式配置 `PRIZE_TICKET_LOCATION_RADIUS_METERS=200`，线上回读保留原 5 项变量并新增半径为第 6 项。小程序按 machine-readable status 投影三态：LOCATION 无操作“核验失败”、PHOTO “照片核验失败”+重新上传、NOTE “备注未通过”+修改备注，PHOTO/NOTE retry 继续继承已通过 checkpoint。前端定向 4 文件/107 项、LOCATION 1 文件/26 项、文本安全 3 文件/43 项、submission 4 文件/49 项、整库 54 文件/484 项均通过；TypeScript、ESLint、相关 Prettier、19 函数 CloudBase build/static validation、contracts/workflow、V1-F preflight、Next.js build 与差异检查通过。`finalize-draw-update`、`get-my-records`、`recognize-draw-tickets`、`bind-wechat-profile` 已部署，均 Active/Available、Nodejs20.19，反向下载与本地发布物哈希一致；两个审核函数线上包均含 `security.msgSecCheck`。无身份启动 smoke 全部 `InvokeResult=0` 且只返回受控错误，未调用 Qwen。`recognize-board` 未部署，ModTime/hash 保持不变；Storage 线上仍为 PRIVATE，13 集合 ADMINONLY 目标与既有线上事实未改，无迁移、未 commit/push。地点配置 blocker 已解除；仍待用户真机完成三态与昵称安全审核验收，项目既有免费套餐无法应用目标 Storage CUSTOM `read:false` 的治理缺口仍保留。

2026-08-27 V1-F 用户文本安全统一 `AWAITING_REVIEW`：新增唯一共享 `msgSecCheck` 边界，将 `PROFILE_NICKNAME` 固定映射 scene 1、`MAP_NOTE` 固定映射 scene 2，调用方不能传 scene；仅显式 `pass` 返回 `{ passed: true }`，风险、复核、拒绝、未知、异常、超时和畸形响应均 fail closed。`bind-wechat-profile` 使用服务端可信 OPENID 先审昵称后开事务写资料，失败保留原昵称和头像；`verify-prize-tickets` 的既有 NOTE gate 改为复用同一 helper，备注变化仍只从 NOTE 断点继续。部署清单为实际生产身份 `bind-wechat-profile` 与 `recognize-draw-tickets` 准备 `security.msgSecCheck` 权限，但未部署。定向 6 文件／126 项、整库 54 文件／476 项 Vitest、根与 Web TypeScript、ESLint、Prettier、CloudBase 13 私有集合／19 函数构建校验、contracts/workflow 与差异检查通过；源码直接 OpenAPI 调用仅剩共享 helper 一处，冻结 R2 hashes 通过。未修改 R2 Prompt／Schema／resolver、H0、recognize-board、LOCATION、PHOTO、抽赏事务／幂等／状态机、按钮生命周期、T/P 或位置半径；未 commit/push。

2026-08-27 V1-F 微信资料更新脏状态修复：保留微信官方 `input type="nickname"`，更新弹窗以打开时的昵称作为不可变初始快照；“确认更新”仅在昵称与原值不同或重新选择头像、且昵称仍有效时激活，昵称改回原值且未换头像会重新禁用。首次登录仍要求昵称与头像同时齐全；只改昵称时复用当前云端 `avatarFileId/avatarUrl`，只改头像时沿用原昵称，不再强制两项同时重选。相关行为用例 1/1、资料 fidelity／平台绑定 33/33、ESLint 与 Prettier 通过；根 TypeScript 仍被本轮未修改的 `draw-ticket-recognition.test.ts` 既有 `locationNote` 类型错误阻断，同一页面文件的既有赏票备注用例也继续因缺少 `locationNote` 失败，均未在本次账户资料范围内改动。未部署、未使用微信开发者工具或真机、未 commit/push。

2026-08-27 V1-F R2 第二阶段送审与并发加固 `IN_PROGRESS`：本地实现与自动门已收口。R2 `initialSnapshot.tiers[].remainingTickets` 保持不可变历史基线，当前状态只由稳定 event ID 的 authoritative batch 投影；CloudBase transaction 原子校验同版本 payload、跨请求幂等和不得 overdraw。赏票链按 LOCATION→PHOTO→NOTE→APPROVED 执行，PHOTO／NOTE 重试继承前序通过事实，备注变化先撤销旧 approval；正式 observation 只在服务端 APPROVED 后保存最终 userNote、ownerAccountId、结构化 location、R2 tiers、authoritative events 与派生 snapshot，不新增 T/P 或长期图片引用。客户端按 LOCATION 终止、PHOTO 重新上传、NOTE 修改备注分流。定向 9 文件／147 项、整库 53 文件／460 项 Vitest、TypeScript、ESLint、定向 Prettier、CloudBase 13 私有集合／19 函数打包校验、contracts/workflow、Next.js build 与 `git diff --check` 全部通过；冻结 R2 Prompt／Provider Schema／resolver hashes 与 phase-1 artifact 一致。生产尚未部署：远端只读配置核验确认 `recognize-draw-tickets` 当前没有 `PRIZE_TICKET_LOCATION_RADIUS_METERS`，且产品尚未给出获批值；缺失时必须 `LOCATION_PENDING`，不能猜测。为避免形成混合版本，`finalize-draw-update`、`get-my-records` 和 `recognize-draw-tickets` 均保持待部署，`recognize-board` 未触碰／未重部署。未 commit/push。

2026-08-27 V1-F “设定大赏”两列布局修订：赏级选项保持 `grandPrizeOptions` 原有顺序与同一 `onToggleGrandPrize` 交互，仅将小程序列表改为 row-major 两列 Grid，因此依次显示 A/B、C/D，奇数末项自然留在左列。半宽卡内部使用左侧复选框跨两行、右侧赏级与未贴票数上下排列，`minmax(0, 1fr)`／`min-width: 0` 防止小屏撑出；Grand/Normal 业务、R2 数据、识别链和生成按钮均未修改。相关 2 文件／63 项、整库 53 文件／434 项 Vitest、根与 Web TypeScript、ESLint、Prettier、workflow 和差异检查通过；微信开发者工具与真机未运行，最终两列间距和触摸体验由用户真机验收。

2026-08-27 V1-F R2 第二阶段业务适配已完成自动门，状态 `AWAITING_REVIEW`：识别结果页只保留 IP／主题／手填单抽价格／nullable R，价格默认空，R=0 全流程保留，R=null 阻止继续；确认后进入“设定大赏”，Grand/Normal 完全由用户勾选的 `isGrandPrize` 决定。R2 本机版面以不可变 `initialRemainingTickets` 加 draw events 投影状态球、剩余数和重进恢复，满额后不能继续抽；旧 H0/R1 记录仍由 schema 分流 adapter 读取。CloudBase `board-record-r2-1.0.0` validator/runtime 结构化保存 R2 查询字段，正式写入不含 T/P、Provider raw 或 JSON-stringified 大对象；未来地图投影只读正式 BoardRecord。既有版面图 ephemeral/no-photo-retention 决策优先，因此未新增长期 `boardImageFileID`，赏票／观察窗口生命周期未重写。针对性 24 项已由页面、领域、runtime、legacy 与地图回归覆盖；当前整库自动门为 53 文件／433 项 Vitest、根与 Web TypeScript、ESLint、全部 contract/workflow、CloudBase 13 集合／19 函数本地构建校验、V1-F preflight、Next.js production build 和差异检查通过。仓库没有独立无 GUI 微信小程序 build script，本轮以 TypeScript、WXML/WXSS 静态/行为测试和 V1-F 源码预检完成非 GUI 平台门；微信开发者工具／真机编译与视觉由用户按项目约定验收。本轮未部署、未迁移数据库、未 commit/push；V1-F 总区块仍为 `IN_PROGRESS`。

2026-08-27 V1-F R2 direct-remaining 第一阶段子任务 `COMPLETED`：精确 R2 Prompt/Provider Schema、独立 direct-R resolver、`recognize-board` 三模式接线、最小客户端 nullable T/P + direct R 兼容、14 类 resolver 门与 H0/R1 回归均完成。定向 97 项、整库 52 文件／434 项 Vitest、TypeScript、ESLint、契约、workflow、CloudBase 19 函数构建校验、Next.js build 和格式检查通过。`recognize-board` 已部署并反向下载核对 R2 hash；Pokémon 生产默认路径只调用一次模型，JSON/AJV/resolver/RecognitionContract PASS，Provider latency 13132ms，A/B 的 R=0 均保留。函数最终 Active，`BOARD_RECOGNITION_MODE=r2_direct_remaining`，internal smoke token 缺席；H0 rollback 为将该服务端功能开关切回 `hybrid_semantic`。CLI 已检查 RequestId 与最近日志，但 CLS 返回 0 行；未追加模型调用。第二阶段 UI、数据库与版面业务改造未开始，未 commit/push；V1-F 总区块仍按其余门保持 `IN_PROGRESS`。

2026-08-27 R1.1 Pokémon 单板生产测试已完成：历史 R1 1.0 Prompt/Schema 哈希仍为 `9abd4aa2…859`／`5c4822c0…eac`，R1.1 冻结哈希为 `756adbef…283e`／`387cf2fc…25d2`。H0 pre-smoke PASS 后，exact Pokémon 原图（`6ffb93c4…2097`）只执行了一次无 mode override 的 production-default R1 调用；JSON parse、R1.1 AJV、既有 resolver 与 RecognitionContract 均 PASS，结论为 A，但准确率只有 total 8/10、remaining 5/10、derived pasted 5/10，且 FINAL/LAST ONE 被额外映射成 SP1，不能视为 production-safe。该次 Provider 未返回受支持的 RequestId header，单次 artifact 中 Provider RequestId 如实为 null；随后仅在 H0 下补齐 payload `id` fallback 并部署，未重跑 R1。生产已恢复 `BOARD_RECOGNITION_MODE=hybrid_semantic`，最终 H0 smoke PASS，临时令牌已删除，旧 v4 runtime 仍缺席；完整证据在 `artifacts/r1-provider-1.1-pokemon-smoke/2026-08-27/`。客户端未改，release 状态仍为 `BLOCKED_NO_NON_GUI_PATH`。

2026-08-27 R1.1 fixed Prompt/Schema + Pokémon single-board production test：`V1-F / V1-43D` 范围内任务正在执行。用户给定的 1.1.0 Prompt/Schema 已逐字落盘并冻结；历史 R1 1.0 与 H0 哈希保持不变。R1 mode 名仍为 `r1_remaining`，resolver 与客户端未改；授权 internal diagnostic failure capture 已补齐 raw Provider content、Provider RequestId、parse/parsed JSON 与完整 AJV errors。本地定向测试 46/46、全量 Vitest 418/418、Prettier、TypeScript、contracts、workflow、CloudBase build/validate 和 V1-F preflight 已通过；首次全量命令因全局 pnpm 11.19.0 与锁定 11.9.0 不符而在执行前被拦截，随后用 Corepack 锁定版本重跑。ESLint 首轮发现新增测试的两个 unused destructuring 变量，已修复，待最终重跑后进入部署。

2026-08-27 V1-F R1 visible-evidence production migration 已按安全门回滚收口：从“本地实现与完整门禁已通过、即将 Predeploy Closure”的断点继续；最后加入的受令牌保护生产默认诊断通道使整库门禁补跑为 51 文件／415 项 Vitest、ESLint、Prettier、双 TypeScript、全部契约／workflow、CloudBase 13 集合／19 函数、V1-F preflight、Next build 与 Playwright 26/26 全通过。新 `recognize-board` 代码先在生产默认 `hybrid_semantic` 下上线；H0 Pokémon 真实默认烟测 Cloud RequestId `ffbe73b4-6b4d-4482-b13f-1c5b8e968356`、Provider RequestId `b195df47-7dfd-9357-b771-162200cd4a93` 通过，旧 `v4 / LEGACY_V4_ROLLBACK` 远程请求以 `INTERNAL_SMOKE_MODE_INVALID` 在 Provider 前拒绝。生产随后实际切到 `r1_remaining`，但 Pokémon、明日方舟、世界之外三个必跑默认路径分别以 Cloud RequestId `83b9b39f-63fb-4303-b6eb-4b7e9e6c7755`、`4fccb687-77b0-4d1c-8354-92db4233b2eb`、`7279db04-9d7a-4074-a59e-12b9124a796c` 全部返回 `RECOGNITION_SCHEMA_INVALID`，构成 systemic Provider Schema failure。按 Critical Safety Gate 立即实际回滚 H0 并停止六图 first pass／comparison／stability；回滚后 H0 默认烟测 Cloud RequestId `b35cf9f9-b41f-4cdf-8fca-ea07d6862199`、Provider RequestId `1a14a54c-769a-910f-8f54-bac01fbdb3c4` 通过，H0 Prompt SHA-256 仍为 `0b4e572378fad8e445f63c6b67997415a1099a0c4ae4d968a6182b545b22226b`。最终线上函数为 Active／Nodejs20.19／512 MB／60 秒／`index.main`，`BOARD_RECOGNITION_MODE=hybrid_semantic`，临时内部 smoke token 已删除；运行时代码只允许 R1 与 H0，旧 v4 不可运行。R1 Prompt／Schema 保持冻结且未创建 R1.1。客户端 T/U 实现与自动构建证据通过，但正式发布为 `BLOCKED_NO_NON_GUI_PATH`。最终决策：`R1 DEPLOYED, FAILED SAFETY GATE, ROLLED BACK TO H0`；完整证据位于 `artifacts/r1-production-migration/2026-08-27/`。

2026-08-27 V1-F R1 visible-evidence production migration 启动：用户明确授权在当前 V1-F 区块执行生产快照、旧 P4 模式移除、R1 Provider/Cloud resolver、客户端 T/U 编辑、分阶段部署、生产 smoke、H0 rollback drill 与六图真实实验。只读审计确认线上 `recognize-board` 为 Nodejs20.19、`BOARD_RECOGNITION_MODE=hybrid_semantic`，固定模型参数与 H0 Prompt SHA-256 `0b4e572378fad8e445f63c6b67997415a1099a0c4ae4d968a6182b545b22226b` 一致，内部 smoke token 缺席；实际旧别名是 `v4 / LEGACY_V4_ROLLBACK`。迁移期 H0 保持不可修改且是唯一回滚；客户端不能选择模式。当前状态 `IN_PROGRESS`，先完成正式事实源对齐和本地自动门，未通过前不切换生产默认。

2026-08-26 V1-F 识别结果必填缺失光晕自动验收收口：字段级校验、页面实时绑定、动态／SP 赏级、价格 `null`／已贴 `0` 语义和 `.action-glow` 同源复用已完成。定向 3 文件／72 项、整库 49 文件／411 项 Vitest、根／Web TypeScript、ESLint、Recognition／Render／Board 契约、workflow、Next.js production build 与 Playwright 26/26 通过；本轮变更文件 Prettier 全通过。全仓 Prettier 唯一失败仍是本任务外既有 `artifacts/h0-production-migration/2026-08-26/predeploy-smoke.json`，未越界重写该诊断产物。微信开发者工具与真实设备本轮未运行，缺失字段光晕形状、滚动跟随、输入即时消失和原辅助抽赏光晕的最终视觉一致性仍需真机人工检查。

2026-08-26 V1-F 识别结果必填缺失光晕实现：小程序把原先分散的 `recognitionSubmitReady` 收敛为 `validateRecognitionDraft` 字段级结果，主 IP、有效单抽价格、每个动态赏级的总票数／已贴票数，以及仅上传模式的地点备注与 Confirm 共用同一 `blockingFields/canConfirm`；主题保持选填。价格清空现在持久化为 `null`，不再被 `Number("")` 静默改成 `0`；合法的已贴票数 `0` 不发光。识别结果输入框以不参与布局的 wrapper 直接复用既有 `.action-glow` 两层粉紫径向渐变、2px blur 和 0.85 opacity，仅随输入框改变圆角和尺寸，并设置 pointer-events none；原“进入辅助抽赏”视觉未改。定向单元／页面行为／静态视觉 3 文件 72 项与根／Web TypeScript 首轮通过；完整质量门与真机视觉仍待本轮收口。

2026-08-26 V1-43D Frozen Hybrid Direct-Pasted H0 正式工程任务在部署前 Gate 停止：冻结源 Prompt hash 与预期完全一致，production copy byte-equivalent；新增正式最小 Schema、pure deterministic normalizer、服务端 `v4|hybrid_semantic` 双栈、可观测性、20 项 H0 测试及独立 parity/predeploy 工具。旧实验 raw→新 production normalizer 的五图 tier/count/SP parity 5/5；同一五张原图 hash 复核后真实 predeploy Provider JSON/AJV/Normalize/RecognitionContract 5/5，Provider 4465—12299ms，Cloud deterministic 0—3ms，世界之外 raw 4 SP→normalized 4 SP。ESLint、TypeScript、49 文件/406 项 Vitest、RecognitionContract、render contract、workflow、CloudBase 13 集合/19 函数构建校验、Next build 均通过；但全仓 Prettier 因 11 个本任务外既有脏文件失败，Playwright 25/26，既有“拍摄版面”按钮导航测试在独立复跑和 retry 中均 60s 超时。因用户同时冻结客户端且要求全部 repository tests 通过后才部署，本轮未修改客户端、未部署 `recognize-board`、未执行远程 H0／promotion／rollback smoke；线上 default 保持 v4，quota、数据和客户端不变。状态：`H0 HYBRID PRODUCTION MIGRATION = FAILED`，失败 Gate 为 repository regression/format，不是 H0 Schema、Normalize、Contract 或五图迁移 parity。

2026-08-26 V1-43D Evidence Primitive + Cloud Resolver 隔离实验完成并停止：新增独立中文 Evidence Prompt、严格 Provider Schema、evidence gate／NFKC 中日数字 parser／四路 deterministic resolver、child-first／SP mapper、20 项测试及 benchmark/report；五张原图 hash 全部复核一致，H0/H1 每图共享同一临时 URL，固定 `qwen3.7-flash`、non-thinking、temperature 0、json_object、`max_pixels=6291456`，完成 10 次 Provider Quick Pass。H0→H1 的 total exact 为 45/58→12/58、pasted 38/58→12/58、remaining 30/58→9/58、tier exact 30/58→5/58；双方 JSON/AJV 5/5，但 H1 pasted coverage 100%→50%，16 个 raw tier 同时返回多种 evidence，firstOpen/openCount 单独使用均为 0，Snow Miku printed-letter false-pasted 0→11，巨人 1→4，世界之外四 SP 合并为一项。平均 latency 7728.0→9834.8ms，总 API tokens +7.2%；Cloud local replay AJV／resolver 远低于 1ms，首错仍在 Qwen visual。Quick gate 失败，未进入 stability、production v4 final control、RC dual stack或部署；结论 `A. EVIDENCE PRIMITIVE FAILED — KEEP V4`。生产 v4、客户端、CloudBase 与配额均未改变，临时 Storage 对象为 0；完整 raw／RequestId／usage／report 位于 `artifacts/evidence-primitive-experiment/2026-08-26/`。

2026-08-26 V1-43D Hybrid Semantic Extraction 隔离实验完成并停止：先以 NIKKE、Snow Miku、世界之外各 1 次对照英文／中文 Scene；6/6 JSON/AJV 通过，中文 tier exact 25/39、英文 8/39，中文虽为 867 text tokens/call（英文 803），仍按预设准确率优先门禁胜出并冻结为 `ichi-board-vlm-hybrid-semantic-zh-1.0.0-frozen-exp`，SHA-256 `0b4e572378fad8e445f63c6b67997415a1099a0c4ae4d968a6182b545b22226b`。随后 5 张同源原图各跑 production v4／Frozen Hybrid 1 次；10/10 JSON/AJV 通过，Production→Hybrid 的 total exact 为 35/58→52/58、pasted 17/58→35/58、remaining 26/58→36/58、tier exact 17/58→34/58，full-board 均 0/5。Hybrid 将 Snow Miku printed-letter false pasted 11→0、NIKKE tier exact 4→7、巨人 0→5，并保留 4 个独立 SP raw items；但 Pokémon 6→3、世界之外 5→2，另有 Snow Miku S regression，共 8 个 production-correct tier 退化，巨人 A—D 与 NIKKE G—J 仍错误。实际 text tokens 总量减少 21.1%、总 API tokens 减少 14.8%，平均 Provider latency 12075.6→7304.4ms；9 项确定性 transformer 测试全部通过，首错均在 Qwen visual。因 SP／vertical／baseline regression 未通过预设 stability gate，不追加 3-run、不调参、不部署；结论 `B. HYBRID PROMISING — NEEDS ANOTHER ISOLATED EXPERIMENT`。临时 Storage 前缀复核为 0，生产继续 v4；完整 raw、RequestId、usage 与报告位于 `artifacts/hybrid-semantic-experiment/2026-08-26/`。

2026-08-26 V1-43D Universal Scene Model A/B 完成并停止：以五张用户指定真实原图严格绑定 Ground Truth，A/B 共享同一原始文件／临时 URL、`qwen3.7-flash`、non-thinking、temperature 0、json_object、`max_pixels=6291456`、生产 v4 Provider Schema/AJV/Normalize、RecognitionContract 1.0.0 与 CloudBase counting，仅把 B Prompt 改为先建立通用物理场景模型。Quick Pass 10 次调用 JSON 均为 5/5，AJV 均为 4/5；Production/Scene 的 tier exact 为 12/58→15/58、pasted exact 12/58→26/58，但 total exact 27/58→22/58，full-board exact 均为 0/5。Scene 将 Snow Miku printed-letter false pasted 从 11 降到 1、巨人从 4 降到 3，并使巨人 E—I empty exact；但 Pokémon C—F 不变，NIKKE dense G—K 仍严重漏数，世界之外 Scene 因非法 warning 触发 AJV failure，导致 production 原本 exact 的 B/C/D/E 全部构成 regression，四个 SP raw items 仍被合并。Prompt 4744→5377 chars、Provider text tokens 1099→1245；平均单轮 latency 8890.0→8307.4ms。按实验停止规则不追加 stability、不调 Prompt、不部署；结论 `C. NO BENEFIT / REGRESSION`，生产继续 `ichi-board-vlm-4.0.3-rc1`，V1-F/V1-43D 准确率门保持 `IN_PROGRESS`。完整 raw/parsed/normalized/usage 与报告位于 `artifacts/universal-scene-model-experiment/2026-08-26/`。

2026-08-25 V1-43K 赏票核验闭环线上收口：真实首错层确认是 `finalize-draw-update → CloudBase -502001 → authoritative facts 未建立 → AUTHORITATIVE_DRAW_RECORD_UNAVAILABLE`，Provider 未被调用。现由 `recognize-draw-tickets action=submit` 把 evidence fileID、来源、上传时间、备注、权威抽赏事件和确定性 finalSnapshot 一次写入同版本 `drawSubmissions` PENDING；verify 直接读取该版本，不再依赖大型 observation 写入。赏票 Provider 协议升级为单一 `prize-ticket-verification-v2`，同一次 qwen3.7-flash 调用返回 `evidenceType + tickets[]`；电子／屏幕证据永不 VERIFIED，不确定证据进入 NEEDS_REVIEW，且 payload 不含期望总数、赏级计数或抽赏历史。真实记录 `record_611dfc8668a1ae185d6ddf39eec58f8b` 的 1079×991／约 219KB 相机 evidence 已在线贯通：CloudBase RequestId `fc2268fc-81dc-4a07-88ac-dab853e9f2f2`，Provider RequestId `chatcmpl-e56b6bd2-30e0-9bee-936e-d824e62442a5`，HTTP 200／2103ms／AJV PASS／`physical_tickets`／5 张，observed 与 authoritative `C1/A1/B2/D1` 精确一致并持久化 VERIFIED；`get-my-records` 回读位置、世界之外／此间即无问、版本 1、上传时间、备注、finalSnapshot、原始／当前 evidence ref 和 authoritative reference。客户端已把待核对／核验异常／核验失败／已上传 badge 统一固定到卡片右上，独立大按钮置右下；本机和仅云端记录都支持同版本重新核验，v2+ 重新上传由服务端继承上一版本权威事实。最终整库 45 文件／347 项 Vitest、根与 Web TypeScript、Next.js 生产构建、CloudBase 13 集合／19 函数构建校验及 workflow 全部通过；`recognize-draw-tickets` 与 `get-my-records` 已于 20:57／20:58 部署到 `cloud1-d7gxqfwv783a1f131` 并显示 Nodejs20.19 `Deployment completed`。部署后同版本幂等复核 RequestId `9b493fb7-8c50-4b9d-a9ba-377644976baf` 保持 VERIFIED 且未重复调用 Provider，云端重读 RequestId `91e72a89-8be0-47f3-91a0-5c2a0bfd5a7f` 再次确认 `uploadedAt`、`verifiedAt`、位置、IP／主题、最新版面、备注、原始／当前 evidence 和权威抽赏引用均持久存在。剩余仅为真机新客户端 T0—T6 体验耗时、状态 badge 布局、后台自动刷新和 v2 相册重新上传的人工验收。

2026-08-25 V1-43K 赏票真机“上传失败”二次修复：最新三次真机请求 `4245c059-3ebe-4b99-b459-5c95c285f38b`、`a296194d-6fc0-480a-aec9-a4ac6f06f2b1`、`d6e02b01-c3bd-4a24-be28-977c7c74ebf2` 均在图片保存／预处理／Storage 上传之前调用 `finalize-draw-update`，该前置调用以 CloudBase `platformCode=-502001`／`INTERNAL_ERROR` 失败，故没有 imageFileId、没有 `recognize-draw-tickets`、没有 Qwen；客户端通用 catch 将其误报为“上传失败”，也解释了原图未进入系统相册。链路现调整为：先尽力保存 v1 相机原图，再将长边超过 2048px 或超过 8 MiB 性能目标的图片压到约 2048px／JPEG 82，只上传派生图并取得 Storage fileID；随后幂等持久化 PENDING、立即进入“我上传的版面”，可信抽赏事件准备和核验均在可恢复后台执行。`finalizeDrawUpdate` 的抽赏事实准备已移出故障的跨集合事务并增加 submissionVersion 门，核验端拒绝使用旧版本 authoritative facts。`finalize-draw-update` 与 `recognize-draw-tickets` 已部署为 Nodejs20.19 Active/Available；真实登录身份准备 smoke RequestId `967b8bb8-5851-4649-8a6a-6a56da333fd3` 成功返回 `verification_prepared`，合成记录及审计已删除。最终整库 44 文件／338 项 Vitest、根与 Web TypeScript、Next.js 生产构建、CloudBase 13 集合／19 函数构建校验、workflow 和定向差异检查通过；无需重复线上 smoke，剩余仅为真机确认原图进相册、提交后进入待核对及后台状态更新。

2026-08-25 V1-43K 赏票核验 P0 修复与真实在线链：真机失败记录 `record_f38b0fefbee08a72de930135ff6f387b` 已证明原图成功上传（257116 bytes），但 CloudBase RequestId `6d5ffdc2-ef4b-4f2a-b158-54bd0d46a6f2` 在可信身份层返回 `TRUSTED_IDENTITY_UNAVAILABLE`，没有进入 authoritative record lookup 或 Qwen；线上函数配置确实缺 `IDENTITY_HMAC_KEY`。客户端旧 handler 又同步等待整个核验并把所有异常 toast 成“赏票核对失败，请重新拍摄”。本轮将链路拆为 authoritative history preparation → evidence upload → durable PENDING → 立即进入“我上传的版面” → 可恢复后台 verify，补齐 PENDING／核验成功／核验失败／核验异常与重新上传／重新核验映射、v1 原图保留、v2 版本和 stale callback 门。`finalize-draw-update` 与 `recognize-draw-tickets` 已部署到 `cloud1-d7gxqfwv783a1f131`，后者补齐身份环境变量后为 Active。安全开发记录真实 submit RequestId `a397d291-abe1-436d-9df7-ddad398543d9` 在 1355ms 内持久化 PENDING；首次 verify RequestId `d5683b44-f34b-4ee1-b309-37e3f6746125` 实际调用 qwen3.7-flash（Provider 200 / 4418ms），并暴露赏票 Prompt 缺 Schema 必填 `protocolVersion/evidenceStatus`。最小协议文案修复并重部署后，第二次 verify RequestId `cdd56040-fae6-4984-a5f8-59d1bd0e99f4` 实际 Provider 200 / 2731ms、AJV 通过并确定性落为 MISMATCH（expected 11，observed 10，F 少 1），随后 `get-my-records` 返回同版本 MISMATCH 且 originalEvidenceFileId 保留；合成烟测记录和复制证据已删除。识别准确率不属本 P0，未修改 `recognize-board`、版面 Prompt 或模型配置。定向 7 文件／92 项、整库 44 文件／336 项 Vitest、ESLint、根／Web TypeScript、Next.js 生产构建、Prettier 与 workflow 校验全部通过；只剩真机提交后立即进入待核对、状态自动刷新和 v2 操作需要人工复测。

2026-08-25 V1-F 识别结果／生成竞争／配额修复完成自动门及开发环境部署：生产 Prompt 原本已明确 root IP 与 theme 分离，但历史 `providerEvidence` 未保存 identity，无法从旧 NARUTO 任务取得 raw `message.content`；确定性 Normalize 已补受支持根别名与后缀主题的安全拆分，并为后续任务保存结构化 raw identity evidence。识别结果页改为自适应双输入网格；确认时冻结不可变 snapshot、锁定编辑并以 generationId 丢弃 stale callback，过期失败回调也不能释放当前新任务，完整草稿先落盘后才 finalize，失败保留可重试识别结果。CloudBase 配额从 Provider 成功点后移到 observation finalize 事务；失败或离开未确认结果时 release、重试复用结构化结果、重复 commit 幂等。云端 assisted-draw orphan 可由 initialSnapshot 恢复，缺少最低恢复数据的记录明确标记“无法恢复”且仍可删除。定向 12 文件／165 项、最终整库 42 文件／304 项 Vitest、ESLint、根/Web TypeScript、Next.js 生产构建、RecognitionContract、workflow、CloudBase 20 函数构建／校验及差异检查通过。开发环境 `recognize-board`、`reserve-recognition`、`release-recognition`、`get-recognition-job`、`finalize-board-observation`、`release-stuck-reservations` 已部署；反向下载与本地包逐文件一致，六者均为 Nodejs20.19 `Active/Available` 并绑定 Active 依赖层 v1。无输入 smoke 以 `InvokeResult=0` 受控返回 `CONTRACT_VERSION_UNSUPPORTED`，未调用 Provider 或配额事务。部署核验期间 CloudBase CLI `fn detail` 再次在工具输出中暴露现有 DashScope API Key；不得复述该值，必须在百炼侧轮换并更新函数环境变量后再做真实识别。真机交互与额度行为仍待用户验收。

2026-08-23 V1-F “我的”资料左沿与头像首帧缓存修复：真机截图确认头像按钮的原生布局行为把资料组撑开并使文字向右溢出；现改为固定两列网格，强制清除头像按钮左右外边距，使头像与下方卡片共用左沿。授权头像保存到 `USER_DATA_PATH`，本地展示缓存同步保留昵称、ICHI ID、`avatarFileId` 和本地路径，页面首帧先恢复本地资料，再以云端 owner-scoped 资料静默核对；缓存不参与鉴权、归属或额度。自动回归待本次修订验证后补记。

2026-08-23 V1-F “我的”资料区与原生相机闪动修订：资料区撤销额外的全宽、内边距和拉伸规则，恢复头像、昵称及 ICHI ID 的原始自然宽度排列；资料头像显示改为稳定私有 `avatarFileId` 优先，避免每次进入“我的”切换短时 URL。云端记录异步刷新在版面相机或赏票相机原生表面已挂载时不再触发页面 `setData`，避免无关数据更新使原生相机发生重绘闪动。定向 5 文件／76 项以及整库 40 文件／281 项 Vitest、ESLint、TypeScript、全部契约、Next.js 生产构建、CloudBase 19 函数构建／校验、V1-F preflight、格式、工作流与差异检查通过；本轮无云函数改动，不重复部署。真机页面切换和两条相机入口仍待用户验收。

2026-08-23 V1-F 微信资料跨入口与头像持久显示修复：辅助抽赏、仅上传版面和首次启动继续共用云端 `profileState` 首次授权门，任一路径完成后立即更新“我的”页并阻止另一入口重复索权；后续点击头像／用户名打开的更新卡新增左上返回键，首次阻塞卡仍不可跳过。`get-my-profile` 现在把 owner-scoped 私有 `avatarFileId` 与尽力签发的短时 HTTPS URL 一并返回，小程序按 URL → 私有 fileID → 默认头像选择显示源，修复更新头像后切换页面只剩昵称、头像恢复默认的问题。隐私与数据页的“提醒说明”卡保持删除。定向 4 文件／69 项与整库 40 文件／280 项测试、ESLint、TypeScript、全部契约、Next.js 生产构建、CloudBase 19 函数构建／校验、V1-F preflight、格式、工作流和差异检查通过；`bind-wechat-profile` 与 `get-my-profile` 已部署为 Nodejs20.19 `Deployment completed`，反向下载的入口与共享运行时 hash 均和本地构建一致，无身份烟测都以 `InvokeResult=0` 受控返回 `TRUSTED_IDENTITY_UNAVAILABLE`。V1-F 保持 `IN_PROGRESS`，等待真机首次授权、页面切换和系统相机／位置授权验收。

2026-08-23 V1-F 识别首页草稿滚动与额度提示收口：导入卡删除临时上传链路说明，改为“每天有 5 次识别版面的权限”。“抽赏草稿”列表启用原生增强纵向滚动与边界回弹；草稿和云端记录卡的左滑由先判定方向的非截获触摸处理承接，纵向拖动完全交回滚动容器，横向时只更新当前卡片的 `swipeX`，不再每帧回写所有草稿。定向页面行为／结构回归通过；真机仍需确认长列表滚动与系统回弹手感。

2026-08-23 V1-F “隐私与数据”页面内容减法：按用户要求删除整张“提醒说明”卡片及其说明文字，只保留计算方式、照片用途、记录存放、非官方声明和本地数据删除入口；轻提醒本身的抽取反馈行为未改变。静态回归同步禁止旧卡片文案重新进入页面。

2026-08-23 V1-F 首次微信登录与拍摄权限改版完成自动验收及开发环境部署：资料状态为 `incomplete` 的首次启动会自动显示阻塞式“使用微信登录”引导，用户通过微信 `chooseAvatar + nickname` 明确授权后，“我的”页立即显示头像和昵称；资料状态完成后重开不重复提示，点击“我的”页头像或用户名可再次打开同一授权卡更新展示资料。账号管理和页面已删除独立绑定／选头像控件、可信上下文实现说明及“已绑定”状态说明。`bind-wechat-profile` 改为 owner-scoped 展示资料更新，内部账号、ICHI ID、记录归属和额度保持不变，旧私有头像在新资料落库后尽力清理。新版面入口在挂载相机前依次确认资料、获取当次 GCJ-02 位置并检查相机权限；首次未决定时触发微信系统授权，已授权时直接复用，拒绝不进入拍摄、不预占额度并提供设置入口。定向 5 文件／85 项及后端关键路径 2 文件／37 项通过；最终整库 40 文件／276 项 Vitest、ESLint、TypeScript、Next build、contracts、CloudBase build/validate、V1-F preflight、Prettier、workflow 与差异检查通过。开发环境 `bind-wechat-profile` 已于 `2026-08-23 00:27:42` 更新并显示 Nodejs20.19 `Deployment completed`；无身份烟测以 `InvokeResult=0` 受控返回 `TRUSTED_IDENTITY_UNAVAILABLE`，反向下载的 `shared/runtime.js` 与本地产物 SHA-256 均为 `49ff68a134aa7491d8e6bb01584a02690b5eb920e08dd2e00fddafa143fd338a`。Storage CUSTOM `read:false` 仍受免费套餐阻断；首次授权、权限拒绝／恢复及重开不重复提示仍需真机人工验收，V1-F 保持 `IN_PROGRESS`。

2026-08-23（同日较早基线，账号与权限结论已被上方记录取代）V1-F 产品减法实现与自动门完成：小程序删除 `pages/board-correction`、`platform/board-correction` 及四角检测／拖动／吸附／放大镜／遮罩／WebGL warp 的 route、状态、样式和专属测试；冻结照片对勾直接进入既有 `reserve-recognition → fileID upload → recognize-board` 幂等链，撤回不预占。目标赏级选择页、生成中间层和对应 state／guard 同步从小程序与网页基线移除；识别结果继续可编辑，确认后直接创建草稿并进入 draw。新识别快照不写 `selectedTargets`，新草稿不写 `targetTiers`；旧快照、旧草稿字段与旧 `target` 导航值继续兼容读取并迁移到 draw。新版面入口先挂载 Camera，仅异步预取账号，不再由账号资料、位置或相机预授权阻塞；位置只在最终私有保存时按真实需要获取。相机保持短提示、当前代 error 过滤和固定三槽控制栏。微信资料改用平台支持的 `chooseAvatar + nickname` 显式首次绑定，客户端与 CloudBase 均保持一次绑定后不可自由修改。定向回归 8 文件／110 项、资料绑定 2 文件／20 项、最终整库 40 文件／276 项 Vitest 通过；TypeScript、ESLint、Next build、Playwright 26 项（首次 24 项通过，修复 2 条旧目标赏级断言后该 2 项通过）、contracts／workflow、CloudBase build/validate、V1-F preflight 与差异检查通过。CloudBase 本轮未部署；资料绑定函数与私有头像资源规则仍需单独发布并在线核验，Storage CUSTOM `read:false` 仍受免费套餐阻断。

2026-08-22 V1-F 版面校正与识别职责重构已完成代码、自动门与开发环境部署：小程序新增独立 `pages/board-correction`，使用 `platform/board-correction` 在不超过 768px 的缩略图上给出四角建议、以归一化坐标支持手工拖动与方向一致的滞回吸附，并在“确认并识别”时才执行一次 WebGL homography、约 1800px／JPEG 82 输出。冻结照片确认只调用 `get-quota-status`；校正输出成功后才调用一次 `reserve-recognition`，客户端在未被云函数认领的终态失败上调用新 `release-recognition`，超时中的云函数尚未结束时不提前删除 Storage 对象。Provider 已部署为单一显式语义 `ichi-board-vlm-4.0.0-rc1`／`board-provider-extraction-4.0.0-rc1`：模型只返回 IP／原文／主题／价格、视觉顺序 raw tier、容量、ticketPattern 及模式所需证据；CloudBase 逐 raw tier 计算 pasted，再执行 A1/A2 父字母求和与 SP1—SP32 顺序分配，严格保留 null。E/F/G/H fixture 经 Qwen content JSON、AJV、Normalize、完整 RecognitionContract／board-layout 和客户端解析得到 `8/2、13/2、26/6、13/3`；但缺少该真机照片的 Qwen raw 与逐层日志，A/B/C 首错层仍不能据实分类。Reviewer 指出的 `board_theme`／问题码／无 tier 重拍 Schema 不可表示、配额泄漏、临时对象抢删和 WebGL 异常清理均已修复。修复后定向 6 文件／46 项、契约回归 4 文件／37 项和整库 43 文件／283 项 Vitest 通过；TypeScript、ESLint、Next build、board-layout／RecognitionContract、CloudBase build/validate、V1-F preflight 与差异检查通过。开发环境线上 `recognize-board`、`release-recognition` 均为 Nodejs20.19 `Active/Available` 并绑定依赖层 v1；无身份烟测受控返回 `CONTRACT_VERSION_UNSUPPORTED`，未调用 Provider。Storage 仍为 `PRIVATE + rule:null`，CUSTOM `read:false` 继续受免费套餐阻断；真实 E/F/G/H 分层取证、4.19MP 对 2.62MP 黄金集、真机 WebGL／旋转／内存／交互仍属人工门。CloudBase CLI 详情调用曾把 DashScope 环境密钥写入本次工具输出，必须轮换该凭据后再做真实样本验收。

2026-08-21 V1-F 版面校正与观察职责重构启动：只读探索已核对现有 fileID→Qwen→JSON.parse/AJV→Normalize→RecognitionContract→客户端→页面链路、相机临时图生命周期和配额事务。架构冻结为“小程序选择／校正，模型只观察，CloudBase 做业务确定性”：新增独立校正页、归一化四角、本地缩略图建议、方向一致吸附、确认时单次透视与约 1800px／JPEG 82 输出；冻结照片确认后只读检查额度，校正页确认时才执行唯一一次权威预占。Provider 改为单一显式语义 ticketPattern 协议，逐 raw tier pasted 后再聚合。E/F/G/H 当前只有 UI 期望，没有对应 Qwen raw／逐层日志，故 A/B/C 暂不能据实分类；本轮先补端到端 fixture 与诊断再用真实样本判定。CloudBase 本轮尚未独立在线核验，本机未发现可用 CLI／凭据入口，历史“18 函数已部署”暂按仓库声明而非新事实处理。

2026-08-21 V1-F 本地自动验收与事实源收口：在不部署 CloudBase 的前提下，完成最终工作树的跨端协议与发布前自动门复核。生产识别链继续保持 `ichi-board-vlm-3.0.0-rc1` + `board-provider-extraction-3.0.0-rc1`；云函数事件、共享位置领域和 `recognition-contract` image acquisition 均只接受 camera，`album` 只保留在显式反例／历史材料中。客户端约 `8 MiB` 为上传性能目标，`20 MiB` 为 Provider 硬边界，压缩后超限拒绝；“仅上传版面”术语已统一。全量 Vitest 通过 39 个测试文件／251 项，`corepack pnpm lint`、`corepack pnpm run typecheck`、`corepack pnpm validate:contracts`、`corepack pnpm cloudbase:build`、`corepack pnpm cloudbase:validate`、`corepack pnpm validate:v1f`、`corepack pnpm --filter @ichi/web build`、`node scripts/validate-workflow.mjs` 和 `git diff --check` 均通过；CloudBase build/validate 仅生成并校验本地产物，未部署。CloudBase 仍受既有 Storage 门阻断：免费套餐拒绝 CUSTOM `read:false` 规则，当前 `PRIVATE` ACL 仍允许创建者读取临时对象；升级套餐／取得平台支持并完成真实非管理员读写隔离验证前，V1-F、V1-43G、V1-43J 与发布候选保持 `IN_PROGRESS`。全库 `prettier --check .` 仍失败于并发／历史生成的 7 个文件（`pages/home/index.ts`、`cloudbaserc.json`、赏票函数 package 与 `tmp/` 产物），本轮协议与事实源文件的定向 Prettier 检查通过；不在本轮重排无关文件。Web build 仅有已知 Node engine 与 Next ESLint plugin 提示，未影响构建。

2026-08-21 V1-F CloudBase 存储权限只读复核：目标环境 `cloud1-d7gxqfwv783a1f131` 的 `storage rules get` 返回基础 ACL `PRIVATE`（仅创建者及管理员可读写）和 `rule: null`；`recognition-temp/` 列表为 0 对象。尝试将 V1 目标 CUSTOM 规则（`read:false`、仅非匿名创建者写入 `recognition-temp/`）应用到当前免费套餐，平台返回 `OperationDenied.FreePackageDenied`，故该规则未上线。`PRIVATE` 不能作为 `read:false` 的替代，因为创建者仍可读取自己的临时对象。资源清单和部署校验现将其标为 `BLOCKED_FREE_PACKAGE`，不再把目标表达式当作已生效规则。V1-43／V1-43J 与发布候选继续 `IN_PROGRESS`；发布前须人工升级至支持 CUSTOM 规则的套餐或取得平台支持，应用后读取回规则并以真实非管理员客户端完成上传允许、本人读取拒绝、跨前缀／跨所有者拒绝的验证。

> 更新时间：2026-08-23

## 当前状态

- 2026-08-23 四图真实 Provider Golden：已独立建立 4 张原图的 tier／total／pattern／firstOpen／pasted／remaining 真值，并使用 CloudBase 私有临时 fileID、线上 `recognize-board`、真实 `qwen3.7-flash`、生产 Prompt/Schema/Normalize/RecognitionContract 检查 raw 与最终结果。确定性 prefix 公式正确，最初“少 1/少 2”不是 `firstOpen-sequenceStart` 算术重复，而是 Qwen raw 将被宽票部分遮挡的首空序号跳到下一张、或漏读跨行续条。相同配置的完整四图轮次中 Golden #2/#4 exact PASS，Golden #1/#3 FAIL；后续提高像素、加强 Prompt、整板裁剪和附加底部细节图均未形成四图通用修复，并分别引入 tier omission、全贴误判或其他赏级回归。临时诊断 token/raw 回传/多图入口已删除，清理后线上函数列表可见 `recognize-board`，无图 smoke 为 `IMAGE_INPUT_INVALID`。当前生产保持 `qwen3.7-flash + ichi-board-vlm-4.0.3-rc1 + provider schema 4.0.0-rc1 + max_pixels 6291456`；识别定向 5 文件／60 项和整库 40 文件／284 项 Vitest、根/Web TypeScript、Next.js 生产构建、全部契约与工作流均通过。V1-F 识别准确率门仍 `IN_PROGRESS`，不得声称 TASK COMPLETE。

- 2026-08-23 当前 Provider JSON 协议仍为 `4.0.0-rc1`，生产 Prompt 已迭代为 `ichi-board-vlm-4.0.3-rc1`；严格 null、raw tier 确定性 pasted／父级聚合和 SP1—SP32 均保持。开发环境 19 个 Nodejs20.19 函数已重新列举核验，`recognize-board` 清理版已在线 smoke；真实四图准确率未通过，Storage CUSTOM 规则、资料绑定后端发布和真机端到端仍待完成。

- 当前活动区块：无
- 区块状态：V1-E `COMPLETED`；V1-F `COMPLETED / CLOSED`
- 区块内工作集：V1-40—V1-47 已按新后端范围重新打开；V1-43 保留既有识别代理实现并继续进行，V1-43A—V1-43J 覆盖账号／位置／配额／刚性识别契约／私有观察／六位码／开发环境后端先行部署／客户端同步／V2 预检与真实 Codex 账号验证，V1-48 保留为人工决策门
- 最近完成：V1-E 已于 2026-08-13 完成全部自动验证、区块级回归及用户授权的统一人工验收，V1-31—V1-39 全部为 `COMPLETED`
- 下一候选区块：无；当前只执行 `V1.0.0 WECHAT SUCCESSFUL PUBLICATION` 外部发布计划。V1.0.1 与 V2 均为 `BACKLOG / NOT_STARTED`，不得自动解锁。
- 代码状态：CloudBase 开发环境当前有 13 个 ADMINONLY 集合、19 个 Nodejs20.19 私有事件函数、4 个维护触发器和 0 个已知云存储文件。17 个生成函数与 2 个独立模型函数统一绑定 `ichi-node-deps_cloud1-d7gxqfwv783a1f131` v1 依赖层；新增 `release-recognition` 为校正确认后的客户端终态失败显式释放尚未认领的配额预占。版面识别主链已部署为 v4 单一语义 Provider 协议，仍保持 `qwen3.7-flash`、非思考 JSON Object、`max_pixels=4194304` 与 fileID／临时 URL；旧 Buffer／Base64／Data URL 方案未恢复。授权黄金样本、赏票二次识别、真机跨账号／删除／弱网、2.62MP 对照、性能分位与费用熔断阈值仍属人工门，V2 公共地图继续锁定。

2026-08-25 V1-F 版面识别进度动画二次收口：`platform/recognition-progress.ts` 现独立维护真实事件许可的 `targetProgress` 与逐帧显示的 `displayProgress`，四段等待不越过 `15/35/80/100` 边界；结果就绪后以最长 `420ms` 的快速 ease-out 完成最后一段，只有显示 `100%`、第四节点“版面结果已就绪”并成功消费一次性完成门后才进入结果页。小程序改用复用 Canvas 上下文的浅灰底环与圆头黑弧，当前节点改为 `#5528c2` 的 `1.6s` 柔和呼吸点，并使用进行中／已完成动态文案。Provider 失败不再发出 `result-ready`，页面失败、返回和卸载统一停止帧并清理引用。定向 4 文件／75 项、全量 44 文件／318 项 Vitest、根与 Web TypeScript、Next.js 生产构建和工作流校验通过。全量 ESLint 被本轮范围外已有的 3 项问题拦截：`pages/home/index.ts` 的 `_pendingFinalization` 未使用，以及 `recognize-board/protocol-v5.test.ts` 两处 `no-explicit-any`；本轮未越界修改。Canvas 圆头、呼吸节奏和完成帧仍待用户真机视觉确认。

2026-08-25 V1-F 识别节点光晕回退：按用户视觉反馈移除按钮式粉紫渐层光晕层，恢复为单个紫色中心点、柔和单色 `box-shadow` 与 `1.6s` 呼吸；进度、圆环、阶段语义和识别业务未变。页面视觉／行为定向 2 文件／54 项 Vitest 和根 TypeScript 通过；仍待真机确认实际光晕尺寸与强度。

2026-08-19 V1-F 取景所见即所得与已贴票修复：真机照片证明微信 `<camera>` 预览裁切与 `takePhoto` 传感器输出范围不一致，版面拍摄现通过页面隐藏 2D Canvas，按实时取景节点宽高比和同一中心执行 `aspect-fill` 裁切，最长边不超过 `2400px`；裁切成功立即清理原始传感器临时图，识别 finally 清理裁切图。CloudBase 最近一次真实任务进一步证明模型并非没有返回已贴数，而是小程序旧映射在 `unknownSlots>0` 时把同赏已确认的 `coveredSlots` 清空；现改为守恒时始终显示 covered，unknown 只降低置信并让余票保持待核对。固定提示升级为 `ichi-board-vlm-2.2.0-rc1`，用短优先级表达实体贴票、先找连续首空序号 `N→N-1`、完全无空位才判贴满和本赏容量，不引入长推理。用户提供的明日方舟单版面最终云端烟测返回 E 已确认 14、F 13、G 13、H 14，并保留未决格供人工校正；F 的第 14 张首空证据已正确产生 13。最终烟测总管线约 `10.04s`、模型约 `8.97s`，只能视为单样本证据，不能替代 P50／P90／P95 黄金集。新版 `recognize-board` 与线上 `systemSettings/recognition` 已同步到 2.2；三组诊断任务／配额已删除，临时对象由函数 finally 删除并复核为空。收口回归通过 35 个测试文件／213 项 Vitest、ESLint、TypeScript、Prettier、全部契约、CloudBase 13 集合／16 函数部署包、V1-F 647145-byte 预检、Next.js 生产构建、工作流与差异检查。

2026-08-19 V1-F qwen3.7 临时 URL 链路重置：用户明确推翻现有 qwen3.6 Buffer／Base64／Data URL 方案，批准 `qwen3.7-flash` 主链。仓库已改为客户端长边约 `2400px`、JPEG quality `85`（仍超 `6 MiB` 才用 `2048px/82`），二进制直传私有 `recognition-temp/`；`recognize-board` 只以 `getTempFileURL(maxAge=300s)` 获取 HTTPS URL并作为百炼 `image_url`，固定 `enable_thinking=false`、`json_object`、`temperature=0`、`max_pixels=4194304`，不设置 `max_tokens`。新增 `ichi-board-vlm-2.0.0-rc1` 和 `board-provider-extraction-2.0.0-rc1`；提供方草稿经 AJV 后由 Normalize 转为现有小程序契约，缺少 covered 计数时转 unknown。函数新增 claim／临时 URL／provider／normalize／persist／total 与 token 埋点，目标为端到端 P50<5s、P90<8s、P95<10s。`qwen3.7-plus strict` 兜底因图像 strict 接口和费用门尚未完成官方与真实请求双重验证而保持关闭，不伪装为已启用。新版 `recognize-board` 已部署至 `cloud1-d7gxqfwv783a1f131`，线上 `systemSettings/recognition` 已同步模型／提示／Schema 版本；真实多版面样图烟测完整穿过私有对象、临时 URL、百炼拉图、AJV、Normalize 与对象删除并按规则返回 `retake_required`，未落入服务错误。三次模型段分别约 `10.51s`、`7.59s`、`17.17s`，最终一次端内管线 `18.27s`，因此只确认功能链路已打通，不能据此宣称达到性能分位目标；授权单版面黄金集与真机 P50／P90／P95 仍是人工验收门。

2026-08-19 V1-F qwen3.7 链路自动收口：线上配置更新与诊断清理后，`recognition-temp/` 复核为 0 文件；生产识别目录静态扫描确认不存在 `downloadFile`、`Buffer`、Base64、Data URL 或 `data:image`。整库 35 个测试文件／208 项 Vitest、ESLint、TypeScript、Prettier、版面／识别／渲染契约、V1-A／V1-C 基线、CloudBase 13 集合／16 函数部署包、V1-F 640516-byte 预检、Next.js 生产构建、工作流和差异检查全部通过。当前仅保留授权黄金样本、真机端到端性能分位、弱网／删除／跨账号及控制台存储规则等人工门。

2026-08-19 V1-F 可编辑草稿宽容边界修复：真机调用 `503c9d73-7ff2-4d9d-86e5-6457253b800a` 已证明 CloudBase、临时 URL、`qwen3.7-flash`、AJV 和 Normalize 全部成功，模型返回 IP、价格及 SP1／A—E，但旧规则把 `uncertain`／`multiple_boards` 一律覆盖成重拍，导致“未能生成可核对票池”。用户明确确认 V1 允许人工修改后，新增 `ichi-board-vlm-2.1.0-rc1`：有连贯主版面和至少一个有效赏级就必须保留为可编辑草稿，缺边、低置信、计数或赏级不完整进入核对；只有非版面、无候选、无有效赏级或不可读才重拍。提供方适配层同步仅在 IP／价格身份信号与聚焦几何成立时接纳 `uncertain`／`multiple_boards`，并把完整性问题转为 `needs_user_input` 而非丢弃。新版完整部署包已上线；同一 `2693.JPG` 多版面样图真实复验返回 `ready_for_confirmation`，总管线 `9.45s`、模型 `8.29s`，临时对象和诊断任务已清空。该结果只证明可核对路径恢复，票数准确度仍待真机黄金样本人工核验。

2026-08-19 V1-F 开发环境识别部署与无需人工工作收口：用户批准 `ichi-board-vlm-1.0.0-rc1` 后，新版 `recognize-board` 已作为第 16 个私有事件函数部署到 `cloud1-d7gxqfwv783a1f131`。部署后安全审查补齐“配额预占不等于模型调用授权”的缺口：`reserve-recognition` 只向本次客户端返回一次性任务令牌，云端仅保存 SHA-256 摘要；识别函数必须以有效任务和令牌原子抢占 `reserved → processing`，成功后一次性提交配额并保存去图片化结构化结果，未配置／超时／上游／Schema 失败立即释放，异常中断交给既有租约协调；伪造任务在线烟测被 `RECOGNITION_JOB_AUTH_INVALID` 拒绝。小程序补齐账号→配额→位置→内嵌相机→预占→识别→任务恢复→用户确认→私有保存编排，直接线索与辅助抽赏分别复用服务端 `recordId/boardId/recordCode`，本机不保存任务令牌。CloudBase 复核确认 16 个函数均为 Active、Nodejs20.19，13 个集合仍为 ADMINONLY，云存储根目录 0 文件，无 V2 公共写入口。完整自动门通过 35 个测试文件／193 项 Vitest、TypeScript、ESLint、Prettier、故障注入质量门、全部契约／工作流、CloudBase 13 集合／16 函数部署包校验、V1-F 631112 bytes 预检、Next.js 生产构建和微信开发者工具项目重新打开编译；网页 Playwright 的滚动恢复断言改为等待既有下一帧恢复后重跑。尚不能自动完成的项目集中在 `docs/delivery/v1-f-human-gates.md`：百炼凭据与真实样本、赏票识别协议、资料字段和费用阈值决策、真机／跨账号／删除／定时任务、视觉／无障碍／弱网、代表用户、Codex 治理自动化及最终预览／发布批准。

2026-08-18 小红书纯本地小工具分区登记：新增 `apps/xhs-local-tool/`，记录其独立产品边界、小红书小工具创建／笔记挂载流程、离线 Web 沙箱可用与禁用能力、随包资源规则，以及等待微信小程序 V1 全部完成后的粗粒度迁移计划。该分区固定不属于 V2／V3，不含账号、位置、配额、网络、CloudBase、地图、审核或多人协作；当前状态为 `DEFERRED`，没有框架、依赖、应用入口或实现代码，不改变 V1-F 的唯一活动区块。后续由用户明确解锁后，先以稳定微信 V1 做复用／替换／删除／新增盘点，再执行真实小红书容器 PoC、版面识别路线和技术栈决策。

2026-08-18 V1-F 特殊赏编号规则即时兼容：实体样本确认同一版面可能存在多个独立特殊赏。当前规则不采用裸 `SP`：按赏级声明边界框上沿、再按左沿的几何阅读顺序规范化为 `SP1`—`SP4`；A1／A2 等编号款式仍合并在同一个 A 赏内；第 5 个及后续特殊赏进入 `OTHER`、保留原始标签并要求人工核对。小程序演示识别数据已加入 SP1，识别校正、目标多选、工作台、撕拉抽取、概率、撤销和本机记录继续用规范化 tier 字符串贯通；旧 CloudBase 代理与待审核 `rc1` 提示、Schema、局部 OCR 回填及随包注册表同步支持该规则。A—F、SP1—SP4 和用户确认后的特殊赏级按已核对票位 `≤5／6—9／≥10` 派生大／中／小赏，G—Z 继续固定小赏。相关自动验证正在执行；运行代理仍未部署。

2026-08-18 V1-F 字母编号款式聚合加固：用户确认 D1／D2 等编号赏即使各自拥有独立奖品区和票位区，也必须合并为一个 D 赏；该规则适用于 A—Z，且优先级高于几何分区，只有非字母编号的独立特殊赏才映射 SP1—SP4。`rc1` 提示现要求多个编号款式进入同一 `prizeVariants`、各票区共享 canonical owner；服务端对分离票区的可靠 total／covered／unknown 分别求和。旧代理兼容层同步修复；D1 两票与 D2 三票合并为 D 五票的回归通过，整库 30 文件 172 项 Vitest、TypeScript、ESLint、全部契约、Next.js 生产构建、工作流与差异检查全部通过。

2026-08-18 V1-F 开发测试票池回退恢复（已于 2026-08-19 废止）：接入 `recognize-board` 后，原先“任意照片进入演示票池”的调试路径被真实识别失败闭合替代，导致用户无法继续测试抽赏界面。曾以 `wx.getAccountInfoSync().miniProgram.envVersion` 隔离恢复：仅 `develop` 环境在代理未配置、调用失败、服务错误或要求重拍时载入本地固定票池并显示提示；`trial/release` 继续禁止普通照片生成假票池。用户在开始真实云端识别后要求移除该回退；当前所有环境统一失败闭合。

2026-08-18 V1-F 特殊赏编号自动验证：定向 5 文件 40 项与整库 30 文件 170 项 Vitest、TypeScript、ESLint、版面／识别／渲染契约、V1-A／V1-C 基线、Next.js 生产构建、工作流、目标文件格式和差异检查全部通过。旧 CloudBase 兼容层另覆盖所有单字母赏级编号款式归并、SP1—SP4 顺序占位和第 5 个特殊赏失败闭合；运行代理尚未部署，真实模型输出仍属于 V1-43D 人工门。

2026-08-18 V1-F 票位序号辅助证据补充：用户指出实体版面上的贴票可能歪斜、不规则，但空置票位常印有“第几张”序号，贴票区域右侧／下侧的首个可见序号可以帮助复核已贴数量。V1-43D `rc1` 现为每个票区增加 `sequenceEvidence`，独立返回编号存在性、方向、逐个可见序号及坐标、连续／跳号／不规则覆盖模式和覆盖边界标记。序号仅为第二证据源：至少两个一致序号或明确说明、可靠槽位对齐、连续可见边界和 `0.85` 置信度才能佐证逐槽状态；单个数字不得直接变成已贴数，序号与视觉状态冲突时保留视觉观察并要求用户校正。机器 JSON、目标文件格式、工作流和差异检查通过；运行代理尚未迁移。

2026-08-18 V1-F 多版面目标选择与取景引导修订：实体门店照片确认同一画面会同时出现中央主版面、邻近被裁切版面、另一张完整／半完整版面、货架价签和商品包装，也确认同一物理版面可能含多个内部栏目。V1-43D `rc1` 机器协议现先返回全部物理版面的矩形框、透视四角、外框／核心内容完整度和细节，再只细读一个主版面；服务端以透视面积、中心度、完整度、细节按 `40%／35%／20%／5%` 复算，面积至少 `0.12`、总分至少 `0.55`、领先第二候选至少 `0.10` 才接受。多版面不再自动失败，但候选接近、主版面过小／不完整或模型与服务端选择不一致时要求裁切／重拍；邻版、货架与包装永不补入主版面。协议同步补入内部栏目不误拆、多款奖品、票条重复赏级字符、版面局部票位图例、跨版面价格隔离和 Last／Double Chance 排除规则。小程序相机提示改为 `252×≥52px` 两行胶囊“将所需版面放在正中间／并尽量铺满取景框”。机器 JSON 可解析；定向 15 项与整库 166 项 Vitest、TypeScript、ESLint、契约／工作流、Next.js 生产构建、目标文件格式和差异检查均通过。微信开发者工具 WXML／WXSS 编译调用仍在等待本机 IDE 授权；运行中的 CloudBase 识别代理仍未迁移。

2026-08-18 V1-F 多模态机器协议待审：用户明确希望每次版面识别只接入一种模型，并要求机器之间以最精准、高效的方式交换，不需要把自然语言说明当作运行提示。V1-43D 现拆成三个互锁的 `rc1` 机器事实源：固定提示 `prompt/ichi-board-vlm-1.0.0-rc1.txt`、模型原始观察 Schema `schema/board-vlm-output-1.0.0-rc1.schema.json` 和确定性策略 `policy/board-vlm-policy-1.0.0-rc1.json`；审阅文档只按发送、返回和后处理三部分解释。纸面首选仍是 `qwen3.6-flash-2026-04-16` 单图单调用、非思考、零温度、关闭工具与联网。模型只返回图片事实和候选，不再返回最终 IP、阻塞状态、人工动作或任何领域派生；服务端执行引用／坐标、逐票位重算、印刷／视觉冲突、IP 选择、问题动作和领域计算。低置信进入用户校正或重拍，不调用第二模型。机器文件已通过 JSON 语法与格式检查；提供方 Structured Output 子集、真实准确率、时延和费用仍待用户批准后以授权样本验证，现有代码未迁移。

2026-08-17 V1-F OCR 模型选型与供应链修订：用户取消“`qwen3.5-flash` 整版主识别、`qwen3.5-ocr` 局部补充”方案，批准级联识别新方向：阿里云百炼 `qwen3.5-ocr` 作为整版主识别首选，只在 IP、价格、赏级标签或奖品名等纯文字字段低置信时，将最小必要裁片交给腾讯云 OCR 复核。纸面选型同时确定百度 PaddleOCR-VL 1.6 是授权黄金样本的主要挑战者，`qwen3.5-flash` 只作非文字视觉状态对照，Mistral OCR 4 只在另行批准跨境处理时作研究对照。最终生产锁定仍须比较完整正确率、字段准确率、漏赏率、票位状态、人工修正量、备援净改正率、耗时与成本。因千问 OCR 官方不保证通用 Structured Output，其输出必须通过本地解析、版本化 Schema、范围和票数守恒校验，且仍只是用户可编辑草稿。现有代码尚未迁移，V1-F 继续 `IN_PROGRESS`。

2026-08-14 V1-F 账号、位置、历史观察与治理调度认知冻结：用户确认首次微信账号建立必须发生在任何新识别之前；辅助抽赏和提交版面线索都必须取得本次位置，保存 GCJ-02 坐标、精度、时间、来源与同意版本，相机／相册分别表达为拍摄时／导入时位置。界面术语改为“提交版面线索”“我的记录”“我的版面线索”以及“草稿·仅本机／待同步／私有已保存／线索已提交／待核对／已公开”，不再用“未上传／已上传”。私有证据固定最长边 `1600px`、JPEG 初始质量 `84`、目标 `≤800KB`、压缩图保留 `180` 天；临时原图最迟 `24` 小时清理，记录／账号删除分别在 `24` 小时／`7` 天内完成。V2 把所有记录表述为带 `observedAt` 的历史现场观察，不因较早自动归档，必须按小时／天／精确日期展示并提示不代表当前库存。生产关键维护改由 CloudBase 定时触发函数承担，Codex／Luna 只作可缺席的影子建议；新增 V1-43I，在用户真实 Codex 账号验证定时任务、实际模型、MCP、凭据、无人值守、审批、最小权限、日志和失败通知。

2026-08-14 V1-F 正式重排：用户要求结合既有工作、新认知和 V1 尚需开发内容重新整理实施计划。正式范围已从“V1 只临时识别、账号与云端保存进入 V2”调整为“V1 建立最小微信账号、普通账号每日 5 次有效识别、千问最小固定提示词与刚性 JSON Schema、用户确认后把压缩版面证据与最终结构化观察保存到本人 CloudBase 私有域，并为 V2 地图冷启动保留可重放资格字段”。V1 仍不实现公共地图、现实版面自动合并、Luna 定时治理、来源审核或公开发布。V1-F 新增 V1-43A—V1-43I，并把 V1-40—V1-42、V1-44—V1-47 重新置为 `READY`；既有跨端、相机、Storage、识别代理、六位码迁移、性能与发布证据继续复用，但必须在新账号／配额／私有保存范围完成后重跑。需要人工批准或外部条件的事项集中为：CloudBase 环境与费用授权、百炼凭据和授权真实样本、真实 Codex 账号验证、真机权限、代表性用户测试和最终发布批准。

2026-08-13 V1—V2 CloudBase 后端与数据治理提案：用户提出把账号基础、普通账号每日 5 次识别、高质量贡献者认证、千问固定提问、同地点版面更新、多人贡献归因、防污染与大批量信息整理统一纳入腾讯云开发方案。新增 `docs/decisions/v1-v2-cloudbase-backend-governance-proposal.md` 作为待批准提案：模型只生成版本化结构化草稿，不管理账号、配额或公共数据库；确定性规则负责身份、原子配额、守恒、地点／版面候选匹配、版本与冲突门禁；公共地图使用不可变观察、可回滚版本、多人归因和人工审核后的当前快照。该提案尚未改变 `design-document.md`、`tech-stack.md` 或 `implementation-plan.md`，V1-F 继续为当前活动区块，V2 保持锁定；若用户批准账号前移，需先正式修订版本范围、架构与发布门再实施。

2026-08-13 V1 私有数据积累方向确认：用户纠正“V1 照片只临时识别并留在本地”的提案假设，明确 V1 必须把每次完成并确认的版面识别以压缩照片和结构化版面信息沉淀到云后端，用于 V2 地图上线时的历史数据启动。后端提案已改为“V1 私有积累、V2 审核后批量启用”：辅助抽赏与直接上传都进入私有候选池，后者包含地点备注，前者缺少地点时保持待补充；V1 不开放地图公共查询，V2 只发布满足账号／授权、地点、完整度、去重、冲突与审核条件的结构化快照，压缩证据图默认不公开。模型协议同步收敛为最小提示词 + 刚性 JSON Schema，计算与发布资格仍由确定性代码负责。当前只修订待批准提案，不提前改写正式 V1-F／V2 门禁；账号前移、保留期限、上传披露、删除路径与批量发布审核方式仍需整体批准后再修订正式事实源并实施。

2026-08-13 定时治理、六位码与方案一致性复核：用户确定日常 AI 治理采用 Codex 定时任务中的 GPT-5.6 Luna，并要求把千问提示协议、V1 后端私有沉淀和六位码问题统一写回 CloudBase 数据治理提案。方案现采用三通道：CloudBase 确定性规则直通低风险数据，Luna 通过 ICHI 专用窄治理 MCP 处理有限常规复核并只能请求 `publish-if-eligible`，用户／指定负责人只处理冲突、申诉和高影响异常；原始 CloudBase 管理 MCP 与公共集合直接写权限不交给定时任务。六位码被固定为每次“新识别并确认”的观察记录码，同一草稿／重试保持原码；多人拍同版面保留多个记录码并归入同一 `boardInstanceId`，编码作为可搜索溯源别名而不进入现实版面指纹。复核同时登记十一类关键边界：双入口都会云端私有沉淀导致“直接上传”和“本地记录”文案可能误导、辅助抽赏缺地点、V1 账号成为可靠归因前置、V2 首发必须处理历史数据新鲜度、Codex 本地任务不能替代 CloudBase 关键定时函数、模型输入需防提示注入、六位码不可承担私有访问权限，以及实际 Codex 账号是否能在定时任务中选择 Luna 并携带 MCP 凭据仍需验证等。当前仍只修订待批准提案，不提前实施锁定能力。

2026-08-13 V1-F 无需人工介入工作完成：CloudBase `recognize-board` 已从桩替换为工作区专属百炼代理，整版 `qwen3.5-flash` 使用非思考 JSON，低置信价格／短赏级只在主模型提供合法边界框时用 `sharp` 内存裁出一个区域并最多追加一次 `qwen3.5-ocr`；客户端执行 8 秒总超时、10 MiB Base64 上限、版本与临时图片隐私声明校验，提供方未配置／超时／异常均失败闭合。识别原图和裁片不写 CloudBase Storage、数据库、函数日志、会话、贡献或地图；开始页新增实际可见的临时传输披露。六位码冲突迁移会确定性消解并尽力写回，写回因容量失败时仍可读取旧记录。新增 V1-F 发布校验、关键无障碍语义、500 条记录、连续 50 抽／50 撤销、重启与离线不污染测试。整库 30 文件／166 项 Vitest、Playwright 26 项、TypeScript、ESLint、Prettier、故障注入质量门、全部契约／工作流、Next.js 生产构建、V1-F 源码 594565 bytes、小程序 WXML 155895／WXSS 51450 编译、模拟器刷新、10 张原始 PNG 及 console／network 错误关键词检查全部通过。自动证据、人工门与前置条件分别冻结在 `docs/delivery/v1-f-automated-evidence.md`、`v1-f-human-gates.md` 和发布候选清单；模拟器证据位于 `artifacts/v1-f-release-candidate/2026-08-13/simulator/`。V1-40—V1-42、V1-44—V1-45 转为 `AWAITING_REVIEW`；V1-43 因缺 `DASHSCOPE_API_KEY`、`DASHSCOPE_WORKSPACE_ID`、CloudBase 环境和授权真实样本保持 `IN_PROGRESS`，V1-46 等待代表性用户测试，V1-47 等待全部门禁与用户批准，V1-48 保持 `READY`，V2 继续锁定。

2026-08-13 V1-F 自动工作启动：用户授权连续跑完 V1-40—V1-47 所有无需人工介入的任务，并要求把真机权限、外部凭据、发布授权、主观视觉与可用性判断等人工项连同各自前置条件集中交付。V1-40—V1-47 进入当前工作集，V1-48 保持 `READY`。初步审计确认 V1-E 页面与本机领域基础可复用，但 V1-F 仍需独立补齐双入口跨端回归、可访问性、百炼识别代理、隐私隔离、记录身份冲突、性能／弱网／恢复、发布候选证据和人工验收清单；当前环境未配置 `DASHSCOPE_API_KEY`、`DASHSCOPE_WORKSPACE_ID` 或 `TCB_ENV_ID`，真实提供方调用与云函数部署将保留为人工前置项，其余实现和模拟验证继续推进。

2026-08-13 V1-E 统一验收完成与 V1-F 解锁：识别结果页最后缺口已按“宽松输入、严格提交校验”收口。两条路径均允许把总票数或已贴票数完全删除为空，空值不再被钳制为 `1`；任一计数为空或不合法时主按钮禁用，总票数重填为正整数且已贴票数显式填 `0` 时可正常激活。空值可进入临时识别快照但不能转换为正式票池。定向 3 个测试文件／41 项 Vitest、整库 27 个测试文件／147 项 Vitest、TypeScript、ESLint、全部契约／工作流、Next.js 生产构建、WXML／WXSS 微信编译、仓库格式检查（排除既有 `project.config.json`）与差异检查全部通过；微信模拟器真实控件验收覆盖辅助抽赏和直接上传的清空、空白显示、重填、已贴 `0` 与按钮禁用／激活。用户在本轮明确授权完成后确认人工验收并解锁 V1-F，因此 V1-31—V1-39 与 V1-E 统一转为 `COMPLETED`。区块认知对齐确认新增可空编辑态只需补入 V1-40 双入口全链路回归，不改变产品范围、平台、隐私、核心架构或区块顺序；V1-40—V1-48 已整组转为 `READY`，但尚未开始实施，V2 保持锁定。

2026-08-13 V1-32 识别票数宽松编辑／严格提交修订启动：用户确认两条识别结果路径都应支持先把“总票数”或“已贴的票数”完全删除，再输入新数字；总票数空值不得强制停在 `1`，已贴票数显式 `0` 合法。正式规则改为可空编辑草稿与严格提交门禁分离：任一票数字段为空、总票数非正整数、已贴票数为负／非整数／超过总票数时，辅助抽赏与直接上传的主按钮均禁用；直接上传继续额外要求地点与备注。空值只允许进入本机临时识别快照，不得进入正式票池。V1-32 与 V1-E 转为 `IN_PROGRESS`，V1-F 保持锁定。

2026-08-13 V1-31 导入水印移除与抽赏记录水印增强待复验：用户否决“导入版面照片”Hero 的中赏吉祥物水印，现已删除对应 WXML、WXSS 与静态断言，双按钮、相机资产和卡片布局不变。大赏四芒星眼白色水印改由共享卡片模板覆盖每张抽赏草稿及后续抽赏记录，直接上传记录不渲染；透明度由 `0.36` 相对提高 `20%` 至 `0.432`，相对 `180×143px` 水印向左移动 `36px`、向下移动 `14px`，并从 `-45deg` 顺时针旋转 `5deg` 至 `-40deg`。定向 3 个测试文件／46 项 Vitest、TypeScript、ESLint、工作流、WXML／WXSS 微信编译和差异检查均通过；V1-31 与 V1-E 保持待人工视觉复验，V1-F 保持锁定。

2026-08-13 V1-34 撕纸恢复裁切完成待复验：用户真机查看跨卡片溢出与终点表现后明确决定恢复“跟刚才一样”的裁切方案。外层 `.ticket-peel-track` 已改回 `overflow: hidden`，删除奖票网格的可见溢出和活动奖票 `z-index` 提层，纸背到达本卡边缘后不会覆盖其他赏票。内部 React Spring 三层揭开、`145%` 离场、完整 `OPENED` 后单次提交及新加入的 `80ms` 快速淡出保持；同时补齐模板对 `ticketPeelFading` 的传参，确保淡出在真机实际生效。最终通过 27 个测试文件／144 项 Vitest、TypeScript、ESLint、全部契约／工作流、Next.js 生产构建、WXML／WXSS 微信编译、Prettier、差异检查和模拟器刷新。V1-34、V1-37、V1-38 与 V1-E 转回 `AWAITING_REVIEW`，等待用户真机复验，V1-F 保持锁定。

2026-08-13 V1-34／V1-37／V1-38 撕纸离场与抽赏记录时间修订待复验：跨卡片溢出后的纸背不再在 `145%` 终点静止 `120ms`，改为到达后立即在 `80ms` 内线性渐隐并清理，同时保留完整 `OPENED`、单次抽取提交和轻提醒。抽赏草稿的第二行时间现定义为最后修改时间：进入或恢复工作台时记录历史数和旧保存时间；原样退出沿用旧时间，新增抽取后再次“暂不分享并退出”才用退出时刻刷新 `savedAt`，并保持同一 `boardId`、六位编码与历史。直接上传记录仍固定使用 `submittedAt`。定向 4 个测试文件／40 项 Vitest 已通过；V1-34、V1-37、V1-38 与 V1-E 保持 `IN_PROGRESS`，等待完整自动回归和用户真机复验，V1-F 保持锁定。

2026-08-13 V1-31 草稿卡大赏水印镂空修订：用户指出直接反色后白色主体融入白卡，只剩四芒星眼可见，且星眼内部白色像素未被真正抠除。新增确定性派生脚本与 `ichi-mascot-large-watermark.png`：原黑色主体转白，原白色四芒星眼像素转为透明镂空，原轻提醒资产保持不变；草稿卡改用派生 PNG 并仅保留极淡轮廓投影，位置、`-45deg`、`180×143px`、`opacity: 0.36`、裁切和前景交互层级不变。V1-31 与 V1-E 保持待人工视觉复验，V1-F 保持锁定。

2026-08-13 V1-31 草稿卡大赏吉祥物水印待复验：用户要求在“抽赏草稿”胶囊卡片的右侧“继续”区域加入轻提醒大赏四芒星眼吉祥物。直接复用 `/assets/v1-29/ichi-mascot-large.png`，以 `invert(1)` 转为白色、`opacity: 0.36` 与地图水印一致，逆时针 `45deg` 旋转并以约 `180×143px` 大小从卡片右上侧压入；卡片自身 `overflow: hidden` 裁切不可见溢出，标题／摘要／“继续”保持前景层级与可点击性。新增静态回归覆盖资产、尺寸、位置、透明度、旋转、裁切和层级；V1-31 与 V1-E 保持待人工视觉复验，V1-F 保持锁定。

2026-08-13 V1-31 导入卡中赏吉祥物水印待复验：用户要求在“导入版面照片”卡片偏右侧增加轻提醒中赏吉祥物水印，并将水印本体改为白色。实现复用中赏状态的圆角票根脸、票口和圆点眼构成，作为卡片背景层以 `45deg` 旋转、低透明度和轻投影呈现；标题、说明与双按钮保持前景层级，卡片裁切右侧溢出。新增静态回归锁定结构、右侧定位、旋转与白色本体；V1-31 与 V1-E 保持待人工视觉复验，V1-F 保持锁定。

2026-08-13 V1-38 地图占位水印增强待复验：用户要求把地图卡片内的 `Map` 背景水印增强 20%。按相对增幅将 `.map-watermark` 不透明度由 `0.30` 调整为 `0.36`，不改变占位图、卡片布局、前景文字或 V2 地图能力边界；新增静态回归锁定本地占位资产与透明度。V1-38 与 V1-E 保持待人工视觉复验，V1-F 保持锁定。

2026-08-13 V1-36 长按阈值修订完成待复验：用户要求把工作台“决定收手”的长按进程缩短一半。实际触发定时器与黑色填充动画由 `1000ms` 同步调整为 `500ms`；`499ms` 内松开或取消仍归零且不打开共享选择，读满 `500ms` 才触发。定向 2 个测试文件／30 项 Vitest、整库 26 个测试文件／138 项 Vitest、Prettier、ESLint、TypeScript、全部契约／工作流、Next.js 生产构建及 WXML／WXSS 微信编译均通过。V1-36 与 V1-E 保持 `IN_PROGRESS`，等待用户真机手感复验，V1-F 保持锁定。

2026-08-13 V2 账号阶段前移认知：用户确认真实账号必须在 V2 随好版地图上线，因为任何进入地图的玩家／门店／店员版面都需要与提交者账号保持稳定、可审计的归属关系；账号不后置到 V3。V2 最小账号范围固定为登录／退出、稳定 `accountId`、服务端会话、本人贡献、审核状态、撤回／删除和审计；地图浏览与 V1 本机抽赏保持游客可用，未登录本机草稿不会丢失，但创建服务端贡献草稿前必须登录。归属由服务端认证会话写入 `ownerAccountId`，客户端短码、`boardId` 或自报字段不能改变拥有者。V2 明确不建设论坛、发帖、评论、关注、私信、群组、用户动态流或公开消费档案；既有点赞位置只保留未来扩展，不是 V2 账号上线门槛。登录提供方、跨端账号映射和地图公开贡献者标识留在 V2-00 冻结。V1-E 仍为唯一活动区块，V1-F 与全部 V2 区块保持锁定。

2026-08-13 V2 账号、提醒与分享计划对齐：用户确认账号管理、地图提醒和分享能力都需要进入 V2，且不扩张为论坛式社群。本轮形成待 V2-00／V2-03 人工批准的推荐基线：小程序以 `wx.login` 一次性 code 经可信服务端建立 ICHI 会话；服务端使用不可公开或编辑的内部 `accountId`，另发放可复制且 V2 不可编辑的公开 `ICHI ID`，昵称和头像可编辑但不参与身份认证或贡献归属。账号和关注规则进入服务端数据库，头像与证据按权限进入对象存储。地图提醒按用户保存的目标 IP／系列、关注地点和半径匹配新版面，通过主动授权的微信订阅消息发送，不承诺关闭后的实时位置追踪。地图详情可原生转发；抽赏结果可生成本地 Canvas 海报，微信好友／群与朋友圈使用微信图片分享面板，小红书等第三方平台通过保存相册后由用户手动发布。具体跨端映射、公开资料、订阅模板／类目与分享可用性仍需对应门禁批准。V1-E 仍为唯一活动区块，V1-F 与全部 V2 区块保持锁定。

2026-08-13 V1-34 工作台视觉修订完成待复验：用户要求大赏与小赏轻提醒吉祥物沿用中赏的倾斜角度，并要求 `NORMAL PRIZES` 状态球区域即使真实票位只有两行也保留至少三行版式。实现统一使用中心 `-3deg` 倾角；普通赏仅通过 `44px` 状态球容器和 `56px` 底栏最小高度补足空白，不扩充真实票位数组或伪造青色状态球。定向 2 个测试文件／30 项 Vitest、整库 26 个测试文件／138 项 Vitest、Prettier、ESLint、TypeScript、全部契约／工作流、Next.js 生产构建及 WXML／WXSS 微信编译均通过。V1-34 与 V1-E 保持 `IN_PROGRESS`，等待用户真机确认三种轻提醒倾角、普通赏三行版式和阶段一撕拉，V1-F 保持锁定。

2026-08-13 V1-34 React Spring 撕纸教程重做完成待复验：用户指定 Medium《Creating a Realistic Paper Tearing Animation using React Spring》为最终动效参考。文章确认模型由右移裁切窗口、随位移增宽的浅色纸背、等量反移并保持原位的前纸组成，拖动距离按速度加权，松手后由弹簧回弹或甩出。小程序不引入 React／`react-spring`，新增纯 TypeScript 运动模块并复用已经能在真机收到事件的页面级触摸链；结构按教程映射为 `right / width / left` 三个插值，弹簧对齐教程未覆写的 React Spring 默认 `tension 170 / friction 26`，最终触点重新计算门禁，`320ms` 回到 `0%` 或甩至 `145%`，完整 `OPENED` 后提交一抽并保留 `120ms` 后复位。定向 3 个测试文件／33 项 Vitest、整库 27 个测试文件／142 项 Vitest、Prettier、ESLint、TypeScript、全部契约／工作流、Next.js 生产构建及 WXML／WXSS 微信编译均通过。V1-34 与 V1-E 保持 `IN_PROGRESS`，等待用户真机动效复验，V1-F 保持锁定。

2026-08-13 V1-34 撕纸跨卡片裁切修订：用户确认纸张移动到当前卡片边缘后不再可见，无法覆盖其他奖票。根因是移植时在教程的内部 `.swiper` 裁切之外，又给 `.ticket-peel-track` 增加了外层 `overflow: hidden`，且活动票卡没有提升层级。现只保留内部裁切；外层轨道与网格允许溢出，当前撕拉票临时使用 `z-index: 20`，使原有同一纸背层从跟手阶段到弹簧甩出全程跨过相邻奖票，不创建松手时突现的飞行克隆。V1-34 与 V1-E 保持 `IN_PROGRESS`，等待自动验证和用户真机复验，V1-F 保持锁定。

2026-08-12 V1-E → V1-F 预解锁认知对齐：V1-E 仍是唯一活动区块，V1-34 等待用户真机复验，V1-F 未提前解锁。本轮以当前实现、正式事实源和 V1-E 全部新增认知重写 V1-F：核心回归改为覆盖“进入辅助抽赏／直接上传版面”双入口，删除旧计划中的主路径预算／四方案比较和 V1 贡献上传暗示；增加本机待核对提交隔离、E 区最终获验收的撕拉交互、三行记录卡、50 抽撤销、相机／相册权限与恢复、记录身份契约、真实版面识别代理和发布候选硬化。真实版面图片可以按已批准隐私边界短暂传给 V1 识别服务，但不进入 ICHI 持久存储；该传输不等于把贡献证据上传到后台或地图。六位辅助编码被确认是当前记录域内稳定的人类可读查找码与未来贡献归因入口，不是鉴权凭证，也不等于现实版面的排他所有权；`boardId` 负责一次版面链路及草稿幂等覆盖，未来 `recordId` 负责规范记录，账号归属必须由已认证服务端会话绑定。未来成就／奖励和点赞可引用同一规范记录与创建者归属，但规则尚未批准，不进入 V1。好版地图防污染不能只靠短码，必须组合来源身份、证据、字段守恒、重复检测、审核、新鲜度、版本和冲突处理；该影响先登记到 V2 对齐事项，不提前实施公共写入。

2026-08-12 V1-34 真机触摸链路重新打开：用户确认赏票当前完全无法滑动和抽取。静态诊断确认 WXS 无运行时异常，但架构中要求的捕获式触摸没有落实到 WXML：撕拉层只有普通 `bindtouchstart` 与冒泡阶段 `catchtouchmove`，位于原生纵向 `scroll-view` 内时，真机可能在起始阶段先取得整段手势控制，导致 WXS 收不到后续移动。V1-34 与 V1-E 转为 `IN_PROGRESS`；本轮只恢复撕拉根节点对开始／移动／结束／取消的捕获阻断，不改变已确认的 Page Peel 参数、动画阶段或抽取逻辑，V1-F 保持锁定。

2026-08-12 V1-34 真机触摸链路修复完成待复验：撕拉根节点的开始／移动／结束／取消现全部使用捕获阶段 `capture-catch` 交给 WXS，`touchStart` 成功建立拖动状态后明确返回拦截信号，避免父级纵向 `scroll-view` 抢走同一触摸序列。用户补充“无法撕拉后误开抽取记录”，因此 WXS 在手势开始时暂时关闭右侧快捷操作的命中能力，仅在低于阈值回弹或完整飞离复位后恢复，避免横向拖动的落点触发记录按钮。动画参数、揭开／飞离阶段和抽取原子逻辑均未改变。定向 3 个测试文件／32 项 Vitest、整库 27 个测试文件／140 项 Vitest、Prettier、ESLint、TypeScript、全部契约／工作流、Next.js 生产构建及 WXML／WXSS 微信编译均通过；V1-34 与 V1-E 保持 `IN_PROGRESS`，等待用户真机确认可连续撕拉、完成抽取且不再误开记录，V1-F 保持锁定。

2026-08-12 V1-34 分阶段撕拉重做启动：用户确认捕获式 WXS 修复后真机仍完全无法撕拉，要求删除现有黑色撕拉区块的全部动效并从最小可用交互重新建立。当前阶段改为复用草稿左滑已验证的页面逻辑层触摸链：单层黑色覆盖层按约 `96px` 手势行程连续向右揭露，回滑重新覆盖；松手不超过一半零抽取并复位，超过一半则自动完成揭露、完整显示 `OPENED` 后提交一抽与轻提醒，并在极短停留后复位。V1-34 与 V1-E 保持 `IN_PROGRESS`，后续拟物化效果须在本阶段真机验收后再增加，V1-F 保持锁定。

2026-08-12 V1-34 阶段一撕拉实现完成待真机复验：已删除 `peel.wxs`、WXS 测试、互补裁切窗口、翻片、3D、阴影、抬升、飞离以及对 `.draw-quick-actions` 的动态 `pointer-events` 写入。单层黑色覆盖层现使用与草稿左滑相同的页面级 `catchtouchstart/move/end/cancel` 链，按 `96px` 行程连续映射 `translateX(0–100%)`，回滑会立即降低进度并重新覆盖；严格超过 `50%` 后才以 `180ms` 自动完成揭露，完整 `OPENED` 后调用既有 `commitDraw` 写入余票、历史、概率与 Storage并显示轻提醒，`220ms` 后黑层复位，不超过一半则零抽取复位。行为回归同时验证局面可能性、抽取记录和撤回均可执行，历史与余票同步。定向 2 个测试文件／29 项 Vitest、整库 26 个测试文件／137 项 Vitest、Prettier、ESLint、TypeScript、全部契约／工作流、Next.js 生产构建及 WXML／WXSS 微信编译均通过；刷新后 console 未匹配到 WXS／peel／touch／error／exception／fail。V1-34 与 V1-E 保持 `IN_PROGRESS`，等待用户真机确认这一最小链路，V1-F 保持锁定。

2026-08-12 V1-38 记录卡首行去重：识别首页“抽赏草稿”、本地记录与我的贡献的共享摘要第一行统一收敛为“抽赏记录／上传记录 + 六位编码”，不再在编码后重复 IP；第二行继续完整显示 `IP: … · M/D HH:mm`，第三行余票与抽取统计、状态、恢复和删除行为均未改变。定向 3 个测试文件／35 项 Vitest、整库 27 个测试文件／139 项 Vitest、Prettier、ESLint、TypeScript、全部契约／工作流、Next.js 生产构建及 WXML／WXSS 微信编译均通过。V1-38 与 V1-E 继续保持 `AWAITING_REVIEW`，V1-F 保持锁定。

2026-08-12 V1-31 直接上传图标视觉重量修订：导入 Hero 的“圆环内向上箭头”从约 `16/256` 的细线改为 `24/256` 圆角描边，在 `20px` 显示尺寸下等效约 `1.875px`，与上方“进入辅助抽赏”扫描图标的主体线宽一致；按钮尺寸、图标尺寸、间距、位置和流程均未改变。SVG XML 校验、定向 2 个测试文件／30 项 Vitest、整库 27 个测试文件／139 项 Vitest、Prettier、ESLint、TypeScript、全部契约／工作流、Next.js 生产构建及 WXML／WXSS 微信编译均通过。V1-31 与 V1-E 继续保持 `AWAITING_REVIEW`，V1-F 保持锁定。

2026-08-12 V1-37／V1-38 记录卡时间与三行摘要统一：识别首页“抽赏草稿”、本地记录与我的贡献现统一使用同一摘要模型。第一行显示记录类型、六位编码和 IP；第二行只显示 `IP: … · M/D HH:mm` 的稳定记录产生时间，删除“拍摄日期／上传日期”标签；第三行显示余票，抽赏记录追加已抽数量，上传记录到余票结束，记录卡不再显示累计花费。抽赏记录以首次建档时间、直接上传记录以提交生成时间作为稳定时间来源，后续保存、恢复或状态更新不会改用新的保存时间。定向 3 个测试文件／36 项 Vitest、整库 27 个测试文件／139 项 Vitest、Prettier、ESLint、TypeScript、全部契约／工作流、Next.js 生产构建及 WXML／WXSS 微信编译均通过。V1-37、V1-38 与 V1-E 继续保持 `AWAITING_REVIEW`，V1-F 保持锁定。

2026-08-12 V1-31 直接上传前置图标补齐：导入 Hero 的“直接上传版面”次胶囊现与“进入辅助抽赏”保持同一图文组合规则，新增 `20px` 本地黑色描线“圆环内向上箭头”SVG，图标与文字间距为 `8px`；按钮尺寸、灰色底板、流程模式、路由和下方草稿区均未改变。规则已同步到产品事实源、V1-29 UI Design Tokens 与 V1-31 计划。定向 2 个测试文件／30 项 Vitest、整库 27 个测试文件／139 项 Vitest、Prettier（SVG 无对应 parser，单独以 XML 静态资产管理）、ESLint、TypeScript、全部契约／工作流、Next.js 生产构建、WXML／WXSS 微信编译和模拟器刷新均通过。V1-31 与 V1-E 继续保持 `AWAITING_REVIEW`，V1-F 保持锁定。

2026-08-12 V1-E 记录身份与直传生命周期补充完成：玩家现场直传在通过 IP／地点门禁后，以同一版本化本机总账创建 `board-upload` 待核对记录；记录保持 `unverified + not-uploaded`，不会混入开始页可继续抽赏的草稿，也不会被误列为贡献，未来只有同一记录同时变为 `verified + uploaded` 才进入“我的贡献”。抽赏与上传记录均保存稳定六位大写字母数字编码、IP、拍摄／提交日期和记录类型；旧记录按内部 `boardId` 确定性派生编码。两类本地记录共用三行卡片，上传记录不显示抽数或累计花费。工作台状态栏在 `REMAINING` 上方显示 `IP:: …`，直接上传提交弹窗正文精确统一为“后台正在核对。本次提交退出后可导入新的版面。”。原生相机四个构图角标改为四张 `96×96` 透明 PNG，由四个 `48×48px cover-image` 对称显示；SVG 源文件继续保留。定向 5 个测试文件／55 项 Vitest、整库 27 个测试文件／139 项 Vitest、ESLint、TypeScript、全部契约／工作流、Next.js 生产构建、WXML／WXSS 微信编译和模拟器刷新均通过。V1-32、V1-34、V1-37、V1-38 与 V1-E 转为 `AWAITING_REVIEW`，V1-F 保持锁定。

2026-08-12 V1-E 提交文案统一补充：辅助抽赏共享取证和“直接上传版面”两条路径的“已提交”状态卡现使用同一正文“后台正在核对。本次提交退出后可导入新的版面。”；静态回归要求该精确文案在两个状态卡各出现一次。V1-E 继续保持 `AWAITING_REVIEW`。

2026-08-12 V1-E 记录身份与玩家现场直传生命周期重新打开：用户确认“直接上传版面”提交后也必须生成本地待核对记录，核对并上传完成后由同一记录进入“我的贡献”。每张确认版面新增稳定六位大写字母数字辅助编码，抽赏记录与上传记录共用“类型＋编码／IP＋拍摄与上传日期／余票＋对应统计”的三行卡片；上传记录不显示抽数和累计花费。工作台状态栏在 `REMAINING` 上方增加 `IP:: …`。直接上传的“已提交”正文统一为“后台正在核对。本次提交退出后可导入新的版面。”，但 V1-E 仍只建立本地待核对状态，不伪造真实云端核对。真机未显示四个相机构图角标，现有 SVG `cover-image` 将改为透明 PNG，以绕开原生相机覆盖层的 SVG 解码差异。V1-32、V1-34、V1-37、V1-38 与 V1-E 转为 `IN_PROGRESS`，V1-F 保持锁定。

2026-08-12 V1-31／V1-32 玩家现场直传前端分支完成：导入 Hero 现按同一视觉系统提供“进入辅助抽赏”和“直接上传版面”两个入口，并完整保留流程模式经过页内相机／相册、提取进度与识别结果。识别结果固定增加可手填或供未来 API 预填的 IP 字段；辅助抽赏仅在 IP 非空后激活“确认并生成版面”，直接上传另显示地点与备注，并只在两项均非空后激活“上传版面”。直接提交只打开带“退出回首页”单一操作的本机“已提交”终态，不写 `LocalDrawDraft`、不进入目标奖／工作台，也不调用云端。识别流程快照兼容保存模式、IP 与地点备注，辅助抽赏草稿仅增加可选 IP，既有 schema 1 数据仍可读取。定向 5 个测试文件／53 项 Vitest、整库 27 个测试文件／137 项 Vitest、变更文件 Prettier、ESLint、TypeScript、全部契约／工作流、Next.js 生产构建、WXML／WXSS 微信编译和模拟器刷新通过。V1-31、V1-32 与 V1-E 转为 `AWAITING_REVIEW`，与 V1-34 真机 Page Peel 一并等待用户复验；V1-F 保持锁定。

2026-08-12 V1-31／V1-32 玩家现场直传分支重新打开：用户要求在导入 Hero 内把“拍摄版面”改为“进入辅助抽赏”，并增加“直接上传版面”。两条路径复用页内相机、相册、提取进度和识别结果；识别结果固定增加 IP，直接上传再增加地点与备注。辅助抽赏以 IP 非空为提交门禁，直接上传以 IP 与地点备注同时非空为门禁；直接上传提交后只显示带“退出回首页”的“已提交”弹窗，不建立抽赏会话。该能力作为 V2 玩家现场直传的 V1-E 本机前端演示，不接入真实上传、审核、账号或地图发布。V1-E、V1-31、V1-32 转为 `IN_PROGRESS`，V1-34 保持 `AWAITING_REVIEW`，V1-F 保持锁定。

2026-08-12 V1-34 真机 Page Peel 可见逐帧动画修订完成：WXML 将固定表面和同内容翻片分别包入互补 `overflow: hidden` 窗口，WXS 按真实票宽同步推进固定窗口左界与翻片窗口宽度，完全移除动态 `mask-image`。跟手帧除正 Z 深度和 `rotateY` 外增加真实向上位移、缩放和随高度加深的投影，即使设备弱化 3D 仍存在可见的 2.5D 抬升线索；越阈值后用 `requestAnimationFrame` 产生约 `150ms` 十余帧完整揭开，在 `OPENED` 首帧触发轻提醒，停留 `24ms`，再用约 `480ms` 三十余帧把同一完整翻片向右上飞出，前 58% 保持完全不透明，后段才渐隐，飞离完成后才调用 `onPeelCommit`。WXS 测试桩现真实推进帧队列并断言揭开／飞离的多个不同中间位置、透明度变化和飞离前零提交，不再把终点字符串当成动画证据。定向 3 个测试文件／29 项 Vitest、整库 27 个测试文件／134 项 Vitest、WXS／变更文件 Prettier、ESLint、TypeScript、全部契约／工作流、Next.js 生产构建、WXML／WXSS 微信编译和模拟器刷新通过。V1-34 与 V1-E 转回 `AWAITING_REVIEW`；其余 V1-E 已由用户确认，当前只等待真机撕揭复验，V1-F 保持锁定。

2026-08-12 V1-34 真机 Page Peel 可见动画再次打开：用户明确确认 V1-E 其余内容均已核验通过，唯一问题不是撕揭参数“不够好”，而是真机完全没有网页参考图中的前半段票面抬升和后半段整片飞离。两张 HEIC 参考图确认：跟手阶段应保留同内容票面并围绕撕裂边形成向观察者抬升的折面；提交阶段应让同一可见票面在 `OPENED` 暴露后继续向右上飞出。代码审计发现网页用固定面与同内容翻片持续渲染，现有小程序测试却只记录 WXS `setStyle` 的终点字符串，不执行渲染帧；实现同时依赖动态 `mask-image` 与同次写入 transition／终点样式，真机没有产生可见中间态。本轮改用互补 `overflow` 裁切窗口和 WXS `requestAnimationFrame`，逐帧更新撕裂边、位移、旋转、缩放、阴影与透明度，飞离完成后才提交数据。

2026-08-12 地图一手供给角色补充：用户确认好版地图不只由抽赏玩家在决策工具中产生版面贡献；持有一番赏授权的线下门店，以及已核验与该门店任职／上传关系的店员，也可以直接拍摄店内完整当前版面，经识别校正、来源身份、地点、观察时间、版面证据和发布审核后，以“门店直传”或“已核验店员直传”成为一手现场来源。该路径不需要先建立玩家抽赏会话或提供已抽赏票；但门店身份未核验时不得使用直传标记，已核验来源仍只表示拍摄时点的现场版面，不是实时库存或品牌方保证。本轮已先同步 `design-document.md`，再修订 PRD；V1-E 当前工作集与 V1-F 锁定状态不变。文档格式、差异空白和 `node scripts/validate-workflow.mjs` 工作流校验均通过。

2026-08-12 V1-32 真机相机构图角标修订完成：删除会在真机扩张成完整圆形／方形的方向性边框和没有稳定底部定位的中间 `cover-view`，改为 `<camera>` 直属的四个 `48×48px cover-image`；四张透明 SVG 分别固化左上、右上、左下、右下弧角，WXSS 只负责相对取景区四边 `20px` 镜像定位。相机实时预览、页内快门、相册入口、权限恢复、提示胶囊和控制区均未改动。定向 2 个测试文件／27 项 Vitest、整库 27 个测试文件／134 项 Vitest、变更文件 Prettier、ESLint、TypeScript、全部契约／工作流、Next.js 生产构建、WXML／WXSS 微信编译和模拟器刷新通过。全库格式检查仍报告用户已有 `project.config.json` 格式差异，本轮未修改该无关文件。V1-32 与 V1-E 转回 `AWAITING_REVIEW`，等待用户真机复验；V1-F 保持锁定。

2026-08-12 V1-32 真机相机构图角标修订重新打开：用户真机截图显示左上角标扩张为完整圆环、右上角标扩张为完整方框，底部两角完全消失。代码审计确认四角使用嵌套 `cover-view` 的方向性边框与多值圆角，并依赖仅由 `top/right/bottom/left` 撑开的中间覆盖容器；该组合在真机原生相机覆盖层没有按普通 WXSS 盒模型渲染。V1-32 与 V1-E 转回 `IN_PROGRESS`；本轮改为四个相机直属、各自带确定方向矢量图的 `cover-image`，保持相对取景区四边 `20px` 镜像内距，不改变实时相机、快门、相册或权限行为。

2026-08-12 产品核心叙事与差异化修订：用户明确 ICHI 不应只被表达为一番赏版面决策工具，而应突出同一类玩家的两个连续场景：出发前在地图发现附近的目标 IP／版面，到店后根据真实版面做概率与成本决策。版面拍摄、校正和后续状态更新先为当前用户产生个人价值，只有经主动授权、集中举证、隐私处理、核对与审核的当前版面状态才反哺好版地图，形成“发现→到店核对→决策与记录→可选贡献→新发现”的效用驱动数据闭环。该闭环是待 V2 实证的产品假设，不改变 V1 必须独立成立、私人数据不自动公开、地图不是实时库存的边界。本轮已先更新 `design-document.md`，再同步 PRD；V1-E 活动工作集与 V1-F 锁定状态不变。文档格式、差异空白和 `node scripts/validate-workflow.mjs` 工作流校验均通过。

2026-08-12 V1-37 抽取记录行视觉修订完成：记录模态不再使用灰色圆角卡片或“第 N 抽／累计金额”的旧排版；每行改为网页批准的白底分隔结构，左侧依次为灰色等宽 `#序号` 与黑色粗体赏级，右侧为灰色该轮“余 N”和玫红累计金额。视图模型以“当前总余票 + 该轮之后发生的抽数”恢复每轮余票，既有抽取历史和 Storage schema 均未改动。定向 2 个测试文件／26 项 Vitest、整库 27 个测试文件／133 项 Vitest、Prettier、ESLint、TypeScript、Next.js 生产构建、全部契约／工作流、WXML／WXSS 微信编译和模拟器刷新通过。V1-37 与 V1-E 转回 `AWAITING_REVIEW`，等待用户真机视觉复验；V1-F 保持锁定。

2026-08-12 V1-37 抽取记录行视觉修订重新打开：用户以网页截图确认小程序每条抽取记录的金额与赏级位置／颜色相反，并完全遗漏该轮余票。批准网页的真实结构为白底分隔行：左侧灰色等宽 `#序号` 加黑色粗体赏级，右侧上方灰色“余 N”、下方玫红累计金额；不使用灰色圆角卡片。现有 Storage 历史无需迁移，每轮余票可由“当前总余票 + 该轮之后发生的抽数”精确回推。V1-37 与 V1-E 转回 `IN_PROGRESS`，V1-F 保持锁定。

2026-08-12 V1-34 网页 Page Peel 方法复刻完成：网页实现归纳为三点：固定表面层和克隆翻片用互补线性遮罩共享动态撕裂边；手指阶段由同一翻片按 `0.72` 宽度归一化并使用正向 `rotateY`、正 Z 位移、轻微缩放和反向投影向观察者抬升；越阈值后仍由该内容翻片而非外层空容器完成飞离。小程序 WXS 已恢复网页的拖动系数与 `78deg` 最大转角，移除外层容器飞行；提交阶段用 `120ms` 完整揭开、`32ms` `OPENED` 停留和 `430ms` 同内容翻片飞离，`OPENED` 完全露出的首帧只更新轻提醒，飞离结束后 `16ms` 才原子更新票池，随后 `20ms` 清理视图状态。新增／更新 WXS 与页面行为断言，锁定前半段深度方向、五个时序点、外层容器零飞行、轻提醒不改变活动票池和飞离后单次提交。最终通过 27 个测试文件／132 项 Vitest、ESLint、TypeScript、全部契约／工作流、Next.js 生产构建、26 项 Playwright、WXML／WXSS 微信编译、模拟器刷新及 console 检查；V1-34 与 V1-E 转回 `AWAITING_REVIEW`，等待用户真机物理手感复验，V1-F 保持锁定。

2026-08-12 V1-34 网页 Page Peel 方法复刻重新打开：用户真机确认前半段仍像平面消失、没有从左侧向观察者揭起，后半段完全看不到整票飞离，且 `OPENED` 停留和轻提醒时机偏晚。代码对照确认批准网页以互补遮罩拆出固定表面与同内容揭起克隆层，揭起层围绕动态撕裂边执行正向 `rotateY`、正 Z 位移、缩放和投影，提交时仍由该可见克隆层飞出；小程序旧实现则先把克隆层转到近侧面，再移动已无可见内容的外层容器。V1-34 与 V1-E 转回 `IN_PROGRESS`；本轮按网页参数恢复连续可见克隆层，把轻提醒放到 `OPENED` 完全露出的首帧，停留缩短到约 `32ms`，飞离后再提交数据并快速复位，V1-F 保持锁定。

2026-08-12 V1-35／V1-37 模态关闭按钮真机定位修订完成：`.modal-head button` 现在相对已定位的 `.modal-card` 使用 `position: absolute; top: 24px; right: 24px`，标题行增加按钮宽度与 `12px` 间隔的右内边距；“局面可能性”和“抽取记录”共用该结构，因此两处同步修复。相关 2 个测试文件／25 项定向 Vitest、27 个测试文件／132 项整库 Vitest、ESLint、TypeScript、Next.js 生产构建、全部契约／工作流校验、WXML／WXSS 微信编译与差异检查全部通过。V1-35、V1-37 与 V1-E 转回 `AWAITING_REVIEW`，等待用户真机复验；V1-F 保持锁定。

2026-08-12 V1-35／V1-37 模态关闭按钮定位再次打开：用户真机截图确认“局面可能性”的叉号仍停在标题后方而非卡片右上角，同结构的“抽取记录”同样受影响。既有 `width: 100% + margin-left: auto` 结构回归只验证了声明存在，没有锁定关闭按钮相对整张卡片的几何锚点。V1-35、V1-37 与 V1-E 转回 `IN_PROGRESS`；本轮以卡片 `24px` 内边距的 `top: 24px; right: 24px` 绝对定位为唯一实现，V1-F 保持锁定。

2026-08-12 V1-32／V1-36 双取景框与赏票操作区修订完成：共享取证页已删除 `wx.chooseMedia(["camera"])` 路径，改为进入时在现有取景框直接挂载后置 `<camera>`，快门调用当前页 `CameraContext.takePhoto()`；版面拍摄保持相同页内机制，`wx.chooseMedia` 仅剩版面相册入口。拍完的赏票照片以等比裁切填满整个 `32px` 圆角取景框；操作行改为 `52px + 212px + 52px` 对称三列，主胶囊和其 `15px` 文字保持页面水平居中，右侧常驻撤回不再挤偏主按钮。27 个测试文件／132 项 Vitest、ESLint、TypeScript、Next.js 生产构建、全部契约／工作流校验、WXML／WXSS 微信编译与模拟器刷新均通过。V1-32、V1-36 与 V1-E 转回 `AWAITING_REVIEW`，等待用户真机验收；模拟器无法代替真实相机画面与权限弹窗，V1-F 保持锁定。

2026-08-12 V1-32／V1-36 双取景框相机修订重新打开：真机反馈确认版面拍摄仍需继续复验，而“拍摄赏票”明确通过 `wx.chooseMedia` 打开了新的系统相机页，未在既有取景框显示实时画面。产品与技术规则现统一为两个取景框都直接挂载原生 `<camera>`，所有拍摄按钮只调用当前页 `CameraContext.takePhoto()`；`wx.chooseMedia` 仅保留版面页的相册入口。赏票照片必须以等比裁切铺满 `32px` 圆角取景框，主胶囊扩大为 `212×52px` 并独立对齐页面中线，右侧常驻撤回按钮不参与主胶囊居中计算。V1-32、V1-36 与 V1-E 转回 `IN_PROGRESS`，V1-F 保持锁定。

2026-08-12 V1-35／V1-37 模态页头定位修订完成：`.modal-head` 现显式使用 `width: 100%` 与 `40px` 最小高度，标题保持左对齐，关闭按钮以 `margin-left: auto` 和固定 `40px` flex 基准锚定到卡片内容区最右侧；“局面可能性”和“抽取记录”继续复用同一 WXML／WXSS 结构。相关结构回归、27 个测试文件／131 项 Vitest、ESLint、TypeScript、工作流校验、Next.js 生产构建、WXML／WXSS 微信编译和模拟器刷新通过。V1-35、V1-37 与 V1-E 转回 `AWAITING_REVIEW`，等待用户视觉复验；V1-F 保持锁定。

2026-08-12 V1-35／V1-37 模态页头定位修订重新打开：第二轮截图确认“局面可能性”和“抽取记录”的关闭按钮停在卡片中部。根因是 `.modal-head` 没有显式占满卡片内容宽度，微信 flex 布局按标题和按钮的内容宽度收缩后，`space-between` 只在短行内分配。产品规则补充为页头使用完整宽度与 `40px` 最小高度，标题在左、`40px` 圆形关闭按钮以自动左外边距锚定最右侧并保持垂直居中。V1-35、V1-37 与 V1-E 转回 `IN_PROGRESS`，V1-F 保持锁定。

2026-08-12 V1-39 异常卡片视觉修订完成：16—21 恢复为警告、撤回、数据库、警告、垃圾桶和容量警告六个原始状态语义，统一使用 `80px` 黑色圆形底板与 `36px` 白色描线图标，不再引用通用信息 `i`。六张异常页面／弹窗统一进入 `exception-card`，图标到标题、标题到说明、说明到第一按钮、按钮间以及最后按钮到底边分别固定为 `24 / 10 / 28 / 12 / 40px`；单按钮卡省略不存在的按钮间距，存储不足弹窗取消固定 `420px` 高度并由内容自然撑开。数值与语义规则已沉淀到 `V1-29 UI Design Tokens`。27 个测试文件／131 项 Vitest、ESLint、TypeScript、全部契约／工作流、Next.js 生产构建、WXML／WXSS 微信编译和模拟器刷新通过；V1-39 与 V1-E 转回 `AWAITING_REVIEW`，等待用户视觉复验，V1-F 保持锁定。

2026-08-12 V1-39 异常卡片视觉修订重新打开：用户指出第二轮截图 16—21 虽统一为黑底白图标，却错误地把所有状态替换成同一个信息 `i`，并且各卡片的图标、标题、说明、动作与底边间距仍不一致。原始状态语义已从第一轮截图复核为警告、撤回、数据库、警告、垃圾桶、容量警告；本轮仅统一其黑色圆形容器和白色描线风格，不改变图标含义。异常卡片的五段垂直节奏以“无法建立票池”的实际实现 `24 / 10 / 28 / 12 / 40px` 为唯一基准，并先写入 `V1-29 UI Design Tokens`；V1-39 与 V1-E 转回 `IN_PROGRESS`，V1-F 保持锁定。

2026-08-12 V1-32 真机内嵌相机修订完成：拍摄页在菜单胶囊下方的既有取景区内挂载后置 `<camera>`，四角构图标和底部对齐提示作为原生覆盖层保留；进入页面即由组件申请相机权限，中央快门通过 `wx.createCameraContext().takePhoto()` 页内生成临时图片并直接进入识别，右侧 `wx.chooseMedia` 只允许 `album`。权限拒绝、设备不可用、前往设置和重试均留在取景区内，快门在相机未就绪或拍摄中保持禁用且几何不变。新增适配器和页面行为／结构回归，最终通过 27 个测试文件／130 项 Vitest、TypeScript、ESLint、全部契约／工作流、Next.js 生产构建、WXML／WXSS 微信编译和模拟器刷新；console 未匹配到 error／exception／fail／camera。模拟器不能代替真机摄像头与权限弹窗，V1-32 与 V1-E 转回 `AWAITING_REVIEW`，等待用户真机验证；千问真实提供方和图片上传仍留在 V1-F/V1-43。

2026-08-12 V1-32 真机内嵌相机重新打开：用户确认中央快门仍由 `wx.chooseMedia({ sourceType: ["camera"] })` 跳转手机系统相机，既有取景区没有实时画面。产品行为修订为进入拍摄页即挂载微信原生 `<camera>` 并申请 `scope.camera`，中央快门通过 `CameraContext.takePhoto()` 在当前页拍照，右侧 `wx.chooseMedia` 只保留相册来源；权限拒绝和设备不可用在取景区内恢复。当前千问链路只是技术决策、识别契约和返回 `RECOGNITION_PROVIDER_NOT_CONFIGURED` 的服务骨架，页面识别仍为本地定时 fixture；真实提供方、图片上传与发布门统一留在 V1-F/V1-43，不在本次相机适配中提前实现。

2026-08-12 V1-34 真机 Page Peel 两段式物理动画修订完成：根因确认是旧 WXS 在 430ms 调用 `onPeelCommit`，逻辑层 `setData` 先于 560ms 飞离完成而重渲染票卡，造成“撕到一半复位并提前成功”。现将交互固定为 WXS 视图层阶段状态机：跟手拖动使用正 Z 轴抬升、动态 `rotateY`／缩放和随进度加深的投影；越阈值后用 150ms 完成揭开并移除固定右尾，完整 `OPENED` 保持 70ms，再用 520ms 将整个未揭票面向右上方和观察者方向飞出；飞离结束 80ms 后才进入逻辑层原子抽取和轻提醒，100ms 后清理视图层状态。新增 `peel.wxs.test.ts` 执行真实 WXS 模块并锁定抬升深度、四个时序点、整面飞离变换和飞离前零提交。最终通过 27 个测试文件／128 项 Vitest、TypeScript、ESLint、全部契约／工作流、Next.js 生产构建、变更文件 Prettier、WXML／WXSS 微信编译和模拟器刷新；刷新后 console 未匹配到 error／exception／fail／WXS。V1-34 与 V1-E 转回 `AWAITING_REVIEW`，等待用户真机连续撕取复验，V1-F 保持锁定。

2026-08-12 V1-34 真机 Page Peel 物理动画重新打开：用户确认现有小程序拖动阶段缺少向屏幕外抬升的物理感，越过阈值后又在半途复位并提前显示抽取成功，没有完成整张未揭票面飞出。现有 WXS 虽复用了网页变换参数，但在 430ms 飞离尚未结束时就调用逻辑层 `onPeelCommit`，其 `setData` 会重渲染票卡并截断 560ms 飞行动画。V1-34 与 V1-E 转回 `IN_PROGRESS`；本轮在 WXS 内重做“跟手抬升 → 完整揭开／固定尾段退出 → 短暂 `OPENED` → 整票飞离 → 原子提交”的连续时序，并增加不依赖纯 Z 轴的 2.5D 深度线索，V1-F 保持锁定。

2026-08-12 V1-E 真机纵向滚动回弹修订完成：开始页草稿、识别结果、目标选择、一番赏工作台、本地记录、我的贡献、提醒设置、隐私与数据以及两个工作台正文弹层均统一使用“局面可能性”已有的原生 `scroll-view` 边界弹性；移除普通正文的 `enhanced`，并把六个需要恢复位置的页面从逐帧 `bindscroll` 回写改为 `bindscrollend` 后保存稳定 `scrollTop`，不再在越界拖动发生时立即用 `setData` 钳制回正。固定页头、底部导航和 Page Curl 横向手势未改。新增结构回归，最终通过 26 个测试文件／126 项 Vitest、TypeScript、ESLint、Next.js 生产构建、工作流校验、WXML／WXSS 微信编译和差异检查。V1-31—V1-34、V1-37、V1-38 与 V1-E 转回 `AWAITING_REVIEW`，等待用户真机确认阻尼和回弹手感；V1-F 保持锁定。

2026-08-12 V1-E 真机纵向滚动回弹重新打开：用户在真实设备确认普通页面触及上下边界后立即被拉回，缺少“局面可能性”正文已有的舒适弹性延迟。代码审计定位为普通 `scroll-view` 开启增强滚动后又在每一帧 `scroll` 事件中回写并把 `scrollTop` 钳制为非负值，形成与原生过拖竞争的受控反馈回路。V1-31—V1-34、V1-37、V1-38 与 V1-E 转回 `IN_PROGRESS`；本轮统一采用原生边界弹性，只在惯性与回弹完全结束后保存稳定位置，固定页头／导航与 Page Curl 手势边界不变，V1-F 保持锁定。

2026-08-12 V1-E 小程序 PNG 包体优化：仅对 6 张被 WXML 直接引用的运行时 PNG 按实际显示尺寸降低源分辨率，保留原文件名、引用路径、透明通道和约 3—4 倍屏幕像素密度；未修改 WXML、WXSS、TypeScript 或业务行为。头像由 1254×1254 调整为 320×320，导入相机图调整为 512×512，识别／确认吉祥物最长边调整为 256px，两张轻提醒吉祥物最长边调整为 160px；小程序 PNG 总量由约 1918 KiB 降至约 284 KiB，完整 `miniprogramRoot` 由约 2480 KiB 降至约 848 KiB。6 张 PNG 格式／透明通道检查、WXML／WXSS 编译和 2 个相关测试文件／24 项 Vitest 均通过；V1-E 保持 `AWAITING_REVIEW`。

2026-08-12 V1-E 真机调试 Sitemap 上传修复：真机调试在包体检查通过后返回 `-80055 Invalid SiteMap`，原因是 `sitemap.json` 的 `rules` 为空数组，当前上传校验没有识别到有效规则。补入 `page: "*"` 的全局 `disallow` 规则，避免 V1-F 发布门前的本地工具页被微信搜索索引；该配置不影响页面路由或真机调试访问。等待重新上传验证。

2026-08-12 V1-34 Page Curl 真实运行态等价修订完成：以真实浏览器和微信模拟器同为 390×844 逻辑视口逐帧对照，将小程序手势从整张 114px 票卡收窄到网页同款 52px 未揭层，并用捕获式 `touchmove` 与 `touch-action: none` 排除纵向 `scroll-view` 的滚动竞争；移除网页不存在的 6px 方向锁。工作台滚动内容补回网页原壳的第二层 16px 内边距，使两端票面均为 157px 宽并使用相同实际宽度归一化。拖动 71px 时两端得到相同 `translateZ(76.54px)`、`rotateY(48.9915deg)`、`rotateZ(-1.88429deg)`、`scale(1.03769)` 和 `drop-shadow(-21.8181px 8px 21.3057px)`；模拟器斜向移动期间票卡坐标保持不变，回弹后变换恢复为 `none`，console 无 WXS／运行时错误。WXML／WXSS 编译、26 个测试文件／125 项 Vitest、TypeScript、ESLint、全部契约／工作流、Next.js 生产构建、网页 Playwright 回归、Prettier 和差异检查通过。关键截图位于 `artifacts/v1-e-ui-review/2026-08-12-round-3/`。V1-34 与 V1-E 转回 `AWAITING_REVIEW`，V1-F 保持锁定。

2026-08-12 V1-34 Page Curl 第三次复验重新打开：用户明确指出小程序撕拉票动效越改越偏离批准网页，并再次要求完全一致。真实浏览器 390×844 运行态取证确认网页手势只命中 52px 未揭层、用 `touch-action: none` 排除滚动竞争、按命中层实际宽度连续归一化进度，并以双层线性遮罩、动态边界支点、正 Z 位移、36%／46px 阈值和 430ms 提交点完成飞离。小程序当前虽然复用了轨迹常量，但把手势绑定到整张 114px 票卡、保留额外方向锁且未阻止 `scroll-view` 与横向撕揭竞争，运行语义仍不等价。V1-34 与 V1-E 转回 `IN_PROGRESS`，本轮按真实运行态修订并重新自动验证；V1-F 保持锁定。

2026-08-12 V1-34 Page Curl 视图层迁移与反馈时序修复：新增 `pages/home/peel.wxs`，把高频 touchmove 的遮罩、卷曲、阴影和正 Z 轴飞离全部放到微信视图层直接更新，不再对每一帧调用逻辑层 `setData`；恢复批准网页的票宽比例进度、连续浮点边界、820px 透视、动态阴影、36%／46px 提交阈值、430ms 数据提交点和 540ms 飞离轨迹。抽取提交改为先同帧更新版面与顶部轻提醒，再于下一事件循环写入 Storage 并刷新派生列表，写入失败时回滚票池并显示存储警告。26 个测试文件／125 项 Vitest、TypeScript、ESLint、全部契约／工作流、Next.js 生产构建、WXML／WXSS 编译和差异检查通过；模拟器控制台无 WXS／运行时错误，自动化合成触摸不进入 WXS 视图层事件，最终物理手感按项目规则交由用户真机人工验收。V1-34 与 V1-E 回到 `AWAITING_REVIEW`，V1-F 保持锁定。

2026-08-12 V1-34 Page Curl 复验重新打开：用户确认小程序工作台的抽赏滑动仍与批准网页不一致，且撕飞完成后到顶部轻提醒出现之间存在明显停顿。V1-34 从 `AWAITING_REVIEW` 退回 `IN_PROGRESS`，本轮直接以网页的揭开比例、透视、变换轨迹、阈值和飞离时序为基线做微信语法／API 适配，并把轻提醒首帧从同步本地持久化工作中解耦；V1-E 转回 `IN_PROGRESS`，V1-F 继续锁定，最终物理手感仍由用户人工验收。

2026-08-12 V1-E 第二轮视觉修订与截图交付：按用户编号完成 03、05、07、08、08E、08F、08G、12A、13A 与 16—21 页修订。相机黑色取景区从菜单胶囊安全区下方开始，四角左右对称；识别低置信不再显示紫框或“请核对”，价格字段改为灰底黑字；目标选中态只以勾选框区分，工作台目标赏不再有紫边。工作台增加从持久化活动 `boardId` 恢复的兜底，撕票改为固定表面与同内容局部翻片并移除抽取轻震动。共享取证常驻右侧撤回按钮，拍摄后主按钮显示“已拍摄”，确认勾仅在照片和非空备注同时存在时启用；已提交卡片收紧按钮间距。本地记录继续入口回到左侧，我的贡献数据卡压缩高度，六个异常／恢复状态统一为 `80px` 黑底白色描线信息图标。自动验证通过 TypeScript、ESLint、26 个测试文件／125 项 Vitest、全部契约／工作流、Next.js 生产构建、WXML／WXSS 编译、差异检查和模拟器 console；微信开发者工具输出 35 张 532×1148 原始 PNG，清单位于 `artifacts/v1-e-ui-review/2026-08-12-round-2/README.md`。V1-31—V1-39 与 V1-E 转回 `AWAITING_REVIEW`，V1-F 保持锁定。

2026-08-12 V1-E 全页面重新复刻与截图交付：按用户人工视觉反馈重新审计完整网页源、最终 bridge、V1-29 tokens 与小程序全部页面。拍摄页已恢复左返回／中快门／右相册，移除四角框内灰色版面占位和完整边框，取景区黑色不再覆盖灰白控制台、底部导航及其下方；快门移除微信原生 `loading` 布局，忙碌态尺寸与黑色内核保持不变，避免按下位移、露出渐变底层和边缘闪烁。识别结果卡补回源网页 `14px` 内边距，并用显式奖级／低置信类名消除单一子节点同时命中 `:last-child` 后被压成 8px 的问题；工作台右侧三项工具恢复最终 bridge 的玫红底与白色 Phosphor 图标；异常页恢复 40px 版式节奏、80px 状态图标和 Hero 圆角，“记录已清空”主行动重新进入 288px 按钮／光晕包装层，不再出现文字逃出胶囊。共享取证拍摄按钮也移除原生 `loading` 位移。完整回归通过 26 个测试文件／123 项 Vitest、TypeScript、ESLint、全部契约／工作流校验、Next.js 生产构建、WXML／WXSS 编译与差异检查。微信开发者工具自动遍历输出 35 张 532×1148 原始 PNG，覆盖空态、数据态、左滑、忙碌、识别错误、生成、工作台、轻提醒、全部阻塞模态、共享取证、地图、“我的”全部二级页及异常恢复；清单位于 `artifacts/v1-e-ui-review/2026-08-12/README.md`。V1-31—V1-39 与 V1-E 再次转为 `AWAITING_REVIEW`，V1-F 保持锁定。

2026-08-12 V1-E 人工视觉验收重新打开：用户对比当前小程序与已批准 Next.js 拍摄页，确认小程序漏搬了最终 bridge 的左返回／中快门／右相册、隐藏灰色版面占位、灰白控制台与导航底色等规则；同时指出按下快门位移、边缘闪烁，以及识别、确认、目标、异常和“我的”页族仍存在字体、字号、按钮包裹、圆角与图标偏差。V1-31—V1-39 全部从 `AWAITING_REVIEW` 退回 `IN_PROGRESS`，本轮必须重新对照完整网页与 tokens 复刻全部 UI，并在自动回归后生成全页面和关键状态截图包供用户逐页人工验收。微信开发者工具没有真机摄像头时可把 `wx.chooseMedia` 的 camera 来源替代为桌面文件选择器；真机仍必须走相机来源，右侧相册入口独立。V1-F 继续锁定。

2026-08-12 V1-E 缺口收口与区块自动回归：完成 V1-31—V1-39 的再次逐项审计与补齐。识别确认保留全部 A—F 及扩展奖级、同一 `boardId` 与已选目标；大赏进入 `GRAND PRIZES`，中赏和小赏共同进入 `NORMAL PRIZES`。开始页零草稿标题、草稿直达工作台、双入口左滑同步和任意下一次独立点击复位均已覆盖；工作台的双层 Page Curl、逐抽提醒、三位小数概率、局面可能性、抽取／撤销、1 秒长按、共享取证与本机保存生命周期均有页面行为测试；地图、“我的”全部二级页、真实本地删除和异常恢复路径均可达。修复最终 WXSS 末尾游离 `padding: 14px` 导致的整页编译白屏，直接编译器定位为 `unexpected token 14px`；用户已确认修复后页面真实挂载。Montserrat 从微信不支持的本地 `@font-face` 路径改为随包 WOFF2 data URI，刷新后未再产生字体代理错误。最终验证通过 26 个测试文件／122 项 Vitest、TypeScript、ESLint、全部契约／工作流、Next.js 生产构建、WXML／WXSS 编译、变更文件 Prettier 和差异检查；微信开发者工具自动挂载检查覆盖 17 个页面／状态节点并在结束后回到无草稿 `start`，模拟器控制台无业务错误。V1-31—V1-39 与 V1-E 转为 `AWAITING_REVIEW`；真机相机权限、撕揭手感、一秒长按反馈和完整页面人工视觉仍由用户执行，V1-F 保持锁定。

2026-08-12 V1-E 全步骤实现与自动验证：完成 V1-31—V1-39 的本地 WXML/WXSS/TypeScript 页面和平台适配。主流程现覆盖相机式取景、`wx.chooseMedia`、识别进度、`recognition-contract-v1.0.0` 四状态路由、低置信人工校正、价格／券位守恒门禁、版面确认吉祥物与生成时序、识别奖级多选和草稿直达工作台；工作台接入双层撕揭、三位小数概率、Last 包套、`board-outlook-v1.1.0`、逐抽轻提醒、抽取记录、连续撤销最近 50 抽及一秒长按收手。共享选择、继续、暂不分享保存退出、赏票拍摄／重拍、地点备注门禁和本机“已提交”状态均已实现，并明确 V1 无云端写入。地图占位、“我的”主页、账号管理、本地记录、我的贡献、提醒／计算与隐私以及 schema、识别、存储容量等异常页均可达。用户补充确认：领域仍区分大赏／中赏／小赏，但工作台只有 `GRAND PRIZES` 与 `NORMAL PRIZES` 两区；大赏进入前者，中赏和小赏共同进入后者，该映射已进入产品事实源、代码与单测。最终自动验证通过根 TypeScript、ESLint、25 个测试文件／103 项 Vitest、全部契约／工作流、Next.js 生产构建、WXML/WXSS 编译和微信开发者工具模拟器流程；变更文件 Prettier 与差异检查通过，仓库全量 Prettier 仍仅被本轮未修改的 `project.config.json` 既有格式差异拦截。模拟器验证了 `camera-capture → recognizing → recognition-result → target → draw`、抽取／撤销、1 秒长按、5 个“我的”入口和二级页节点。测试生成的临时票池和旧 `automation-board-v1-31` 不完整草稿均已清理，模拟器回到无草稿的开始页。V1-31—V1-39 转为 `AWAITING_REVIEW`；用户要求跳过的人工视觉、真机相机权限和触摸手感检查尚未执行，V1-E 仍为 `IN_PROGRESS`，V1-F 保持锁定。

2026-08-12 V1-E 赏位完整性与二级页头修订：用户截图中的工作台只显示 A、G，确认来源是此前自动化遗留的 `9 / 12` 不完整测试草稿，而当前确认链路本身没有主动过滤奖级。已删除该测试草稿，并将小程序默认识别基线对齐批准网页 A—F 六级；识别确认统一通过无筛选转换函数把全部识别奖级写入草稿，额外的 G—Z／`OTHER` 也不会丢失。模拟器实测识别、目标和工作台依次保持 A—F，工作台为 A／B／C 三个 `GRAND PRIZES` 与 D／E／F 三个 `NORMAL PRIZES`，总数 65、余票 63。二级页头同步清除微信原生 `button` 自动外边距，并固定 `358×52px` 页头从 `x=16px` 左起：返回键 `52×52px` 位于 `x=16px`，标题紧随 12px 间距位于 `x=80px`；账号管理、本地记录、我的贡献及计算／隐私共用该结构。WXML/WXSS 编译、TypeScript、ESLint 与 25 个测试文件／102 项 Vitest 通过；本轮仍待用户人工视觉复验。

2026-08-12 V1-31 零草稿分区页头修订：用户确认“没有本地草稿”是正常空状态，但开始页的草稿分区页头不能随列表一起消失。产品事实源与实施步骤已改为“页头稳定、列表条件渲染”：开始页始终显示“抽赏草稿”和数量，零条时显示 `0 份`，仅不创建下方滚动列表。微信模拟器在 `startDrafts=[]` 时实测页头文字为“抽赏草稿0 份”、分区宽度 358px 且当前页为 `start`；WXML/WXSS 编译、TypeScript、ESLint 与 25 个测试文件／103 项 Vitest 通过。V1-31 继续为 `AWAITING_REVIEW`，等待用户人工视觉复验。

2026-08-11 V1-31 开始页与一级导航启动：新增小程序 `pages/home/`、微信媒体选择适配、本机草稿仓库和稳定识别状态存储，并接入开始／继续、好版地图、我的、本地记录和三项固定导航。用户首轮检查指出原实现存在二次设计：导入卡内容拥挤、主按钮把粉紫光晕做成硬色块且与黑色胶囊错位、图标／头像使用了手绘或旧占位、字体和菜单盒模型未沿用网页、直接尺寸搬运造成页面比例失衡、自动化状态又使导入页草稿区暂时不可见。当前已按 390px 网页计算后尺寸和 `V1-29 UI Design Tokens` 修订：导入卡 358×333、相机资产 142×142、主按钮 288×52、网页原配方光晕 292×56；本地化 Montserrat、批准头像、Phosphor `scan/corners-out/map-pin/user-circle/gear-six/hard-drives/hand-heart/bell/shield-check/caret/trash` 资产和源地图占位，不再用字符或重绘图标；补齐全局 `border-box` 后“我的”三行卡恢复 358×192、单行 346×60。开始页有草稿时下方分配 310px 独立浏览区，96px 草稿卡可恢复稳定识别状态并按同一 `boardId` 左滑删除。WXML/WXSS 编译、5 个测试文件／15 项 Vitest、根 TypeScript 与客户端 ESLint 已通过；模拟器留有一条 `automation-board-v1-31` 验证草稿并停在开始页供用户继续检查。V1-31 保持 `IN_PROGRESS`，尚未通过人工验收。

2026-08-11 V1-E 照搬基线澄清：用户确认 V1-26 最初虽以低保真页面流启动，但后续已在 Next.js 通过 V1-29 完成并验收整套小程序页面设计。因此 V1-E 不是参考网页重新设计，也不是在旧小程序壳上继续编写 UI，而是把 Next.js 的全部页面、内容、字体、字号、图标、字符样式、间距、布局、色彩、动效、交互和状态一比一照搬到微信小程序。只允许 HTML/CSS/JavaScript 到 WXML/WXSS/TypeScript 的语法级映射，以及浏览器 API 到微信 API 的必要平台适配；不得以平台差异为由重排、简化、替换或二次创作。该约束已同步到产品、技术、实施计划、架构、设计 token 与 UI 决策，实施计划升至 1.8；V1-E 仍为唯一活动区块，V1-31—V1-39 保持 `READY`，尚未开始页面实现。

2026-08-11 V1-E 识别加载吉祥物基线修订：用户要求将“正在提取版面”旋转圆环中的旧扫描图标替换为“单线眼睛＋放大镜”票根吉祥物。新素材已生成 RGBA 透明 PNG，四角透明且无不透明绿色残留；Next.js 原壳保留深色圆环的旋转动效和视觉中心，吉祥物自身静止。本轮 25 项 Playwright、20 个测试文件／76 项 Vitest、Prettier 变更文件检查、ESLint、TypeScript、全部契约／工作流校验与 Next.js 生产构建通过。统一 `pnpm quality` 只因本轮未修改的 `project.config.json` 存在既有 Prettier 格式差异而提前退出；本轮不擅自格式化该用户文件。V1-32 保持 `READY`，后续小程序照搬必须同步该素材、内外层级和独立动效；网页视觉结果交由用户人工检查。

2026-08-11 V1-E 版面确认吉祥物基线修订：用户要求将点击“确认并生成版面”后“版面已确认”状态层的旧魔法棒图标替换为“圆点眼睛＋铅笔”票根吉祥物。新素材已生成 RGBA 透明 PNG，四角透明且无不透明绿色残留；状态层保留原文案、进度、弹跳动效、时序与路由。用户已于当日完成网页人工视觉检查，确认识别加载和版面确认两个图标均替换成功。合并回归通过 26 项 Playwright、20 个测试文件／77 项 Vitest、Prettier 变更文件检查、ESLint、TypeScript、全部契约／工作流校验、Next.js 生产构建与最终差异检查。V1-32 保持 `READY`，后续小程序一比一照搬必须同步两个素材及其各自动效分工。

2026-08-10 V1-29 轻提醒触发诊断与吉祥物表情：确认生产原壳的 `updateToast()` 未调用 `apps/web/app/situation-reminder.ts` 完整规则，只硬编码 A 赏目标反馈和小赏连抽；原壳历史也未提供连续抽取所需时间戳等完整字段。即使接入纯规则，现有单条最高优先级策略和默认版面无 6—9 张中赏仍会让多项低优先级情境被覆盖或不可达。本轮按用户明确范围只完成诊断，不擅自重排优先级或接入完整提醒规则。两张用户提供表情已生成透明通道并写入 `apps/web/public/v1-29/`；轻提醒按本地大／中／小赏分类分别显示四芒星眼、原圆点眼和眯眼。17 文件／67 项 Vitest、16 项 Playwright、ego-browser 真实页面 DOM／图片解码核验、Prettier、ESLint、TypeScript、全部契约与工作流校验、Next.js 生产构建和差异检查通过；V1-29 仍为 `IN_PROGRESS`，等待用户继续人工验收与后续提醒规则修复指令。

2026-08-10 V1-29 一番赏工作台固定层与长按确认：余票／Last 状态栏固定在顶部安全区，局面可能性／撤销／抽取记录固定在视口右侧，“决定收手”固定在底部导航上方；滚动奖级票面 900px 前后三组控件坐标保持一致。“决定收手”改为 1000ms 按住确认，黑色由左向右填充并用同宽遮罩反转已覆盖文字／图标，提前释放归零且不打开共享选择。局面可能性不再使用底部平边抽屉，与抽取记录共同使用中心对齐 `--ichi-visual-center-y` 的 32px 完整圆角卡片；原壳通过同源接口复用 `board-outlook-v1.1.0`，完整显示目标、大赏、非小赏、两张或以上小赏和 3 抽累计成本，不在桥接脚本复制概率公式。Prettier、ESLint、TypeScript、17 文件／67 项 Vitest、13 项 Playwright、Next.js 生产构建、工作流校验和差异检查通过；重启后 3000 返回 200。ego-browser 在 397×697 视口确认固定控件滚动前后坐标不变，局面可能性卡中心 `316.5px` 与视觉中心完全一致，四类事件均可见。V1-29 仍为 `IN_PROGRESS`，V1-26 仍为 `AWAITING_REVIEW`，等待用户继续人工视觉与交互验收。

2026-08-10 V1-29 “我的”二级导航修订：账号管理、本地记录、我的贡献、提醒设置和隐私与数据统一在顶部安全区使用 52px 灰色圆形返回按钮，并与页面标题组成同一页头；任一二级页再次点击底部“我的”会直接回到“我的”主页。识别标签继续恢复最近稳定识别页面，地图标签行为不变。Prettier、ESLint、TypeScript、Next.js 生产构建、10 项 V1-26／V1-29 Playwright 回归、工作流校验和差异检查通过；ego-browser 在 397×697 视口确认返回键最终稳定在 `y=40px`、标题无重叠且方法页不压住底部导航。V1-29 仍为 `IN_PROGRESS`，等待本轮人工视觉与交互验收。

2026-08-10 V1-29 视觉中心 token：在 `docs/design/v1-29-ui-design-tokens.md` 定义 `--ichi-visual-center-shift-y` 与 `--ichi-visual-center-y`，将视觉中心固定为扣除顶部安全区与底部导航避让区后的可用内容中心。识别加载卡改以自身中心对齐该 token；后续用户要求组件位于“视觉中心”时复用同一定位规则。V1-29 仍为 `IN_PROGRESS`。

2026-08-10 V1-26 识别导航恢复：底部“识别”不再总是重开拍摄页，而是恢复最近一个稳定的识别流程页面（导入、识别结果、目标选择、一番赏版面或统一失败恢复页）；拍摄取景与识别加载页均按其上一级稳定页面回退，当前导入流程中即返回导入页。该恢复只使用本机会话页面标记，既有版面缓存继续负责已生成版面与抽取记录，未引入后台识别或上传状态。V1-26／V1-29 仍待人工验收。

2026-08-10 V1-29 设计参数归一化进行中：用户要求为现有原始网页壳补齐跨页面的设计规则，而非把所有控件做成同一尺寸。新增 `docs/design/v1-29-ui-design-tokens.md`，以地图主卡为普通 Hero 的基准，固定顶部安全区、页面边距、间距尺度、卡片／操作／正文宽度、排版层级、菜单行、工作台与相机例外；导入图标、地图标识和异常状态保留有理由的语义尺寸变体。原壳响应注入层开始改用这些变量校正导入与地图的 Hero 节奏。V1-29 仍为 `IN_PROGRESS`，待跨页视觉与交互回归及用户验收。

2026-08-10 V1-29 导入图标去背：按用户要求对导入 Hero 相机图标生成透明通道，保留黑白图标主体、移除外部白色画布；页面继续使用原有 162px 资产画布，但可见主体约与地图标识相当。该变更只影响导入页图标的视觉合成，不改变源页面文字、按钮、路由或交互。V1-29 保持 `IN_PROGRESS`。

2026-08-10 V1-26 相机取景框顶部对齐：构图辅助框的上方两个角标与所有页面共用的 `40px` 顶部安全区对齐；左右仍留 `20px`、底部仍与控制台保持 `20px` 间隔。相机可使用全屏画布，但取景框不再绕开全局顶部起点；V1-26 与 V1-29 的人工验收状态不变。

2026-08-09 Gemini Canvas 全页面规格：根据当前 `apps/web/app/page.tsx`、样式和自动化路径整理 `docs/design/gemini-canvas-all-pages-spec.md`，覆盖 19 个视图、版面工作台内弹层、页面跳转、全局视觉沿用、动效边界和算法按钮占位规则；未改动网页代码。工作流校验与 diff 检查通过。

2026-08-09 V1-29 全局视觉转译第一轮完成：以用户提供的 `code_artifact.html` 实际 HTML/CSS/交互结构为参考，新增本地 `v1-29.css`，全局替换导入、拍摄、识别、识别结果、目标奖、我的、记录、地图占位、异常和弹层的深色票券式视觉；不引入 Tailwind CDN、Font Awesome、Google Font 或其他远程运行时资源。一番赏工作台新增 REMAINING／Last 状态卡、票面盖板与深色票位底板、可拖动的撕票阈值、轻提示进入动画和活动胶囊导航；原有页面 URL、数据、抽取、撤销、情境提醒、局面可能性和贡献占位逻辑保持不变。390px 截图覆盖主界面、导入、拍摄、识别结果、我的和异常页；TypeScript、14 项 Playwright 与生产构建通过。V1-29 保持 `IN_PROGRESS`，等待用户人工验收视觉方向。

2026-08-09 V1-29 直接转译修订：用户明确 `code_artifact.html` 不是风格参考而是唯一视觉基线。网页工作台已按源代码的两列紧凑票券、42px 白色异形票头、深酒红票仓、橙色圆形票位、顶部白色状态卡、`Normal Prizes` 分区、撕票阈值和 260px 胶囊导航重新组织；旧方形大赏卡不再作为视觉基线。导入、识别、账户、记录和异常页共享同一票头／票仓／橙色操作语法；其中源代码没有提供的表单、相机和记录状态仍由真实 HTML 控件补齐。17 个 Vitest、14 个 Playwright、Prettier、ESLint、根与网页 TypeScript、工作流校验、差异检查与 Next.js 生产构建通过；ego-browser 390px 实测状态卡 358px、紧凑大赏票券 167×94px、白色票头高 42px、普通横向票券 350×94px、胶囊导航 260×52px，且无横向溢出。V1-29 仍为 `IN_PROGRESS`，等待用户人工验收，V1-D 不收口。

2026-08-08 V1-26 首屏奖级密度修订：手机端“识别结果”和“一番赏版面”压缩重复的流程栏、应用栏和页面标题留白，不改变大赏双列方形或中赏／小赏横向票条。新增 390×844 回归：以底部导航上缘为可见下界，两页均至少完整显示 5 个奖级，且不发生横向溢出。页面自动验证、生产构建、类型、Lint、格式、工作流校验和差异检查通过；V1-26 继续保持 `AWAITING_REVIEW`，V1-D 不关闭。

2026-08-08 V1-26 收手入口修订：手机端“收手”改为固定悬浮在屏幕底部中央、底部导航上方，不再随 F 赏或版面内容滚动。新增 390×844 回归，验证滚动前后按钮保持水平居中且不遮挡导航；共享取证流程与 V2 后端边界不变。14 项网页回归、Next.js 生产构建、TypeScript、ESLint、Prettier、工作流校验和差异检查通过；V1-26 继续保持 `AWAITING_REVIEW`，V1-D 不关闭。

2026-08-08 V1-26 本地记录信息架构修订：本地记录只突出待核对、待审核和本机草稿，移除泛化的“贡献状态”入口；新增独立“我的贡献”页面承载已提交版面和后台状态，旧 `my&contribution` 路径兼容到该页面。新增页面分工与手机入口回归；14 项网页回归、Next.js 生产构建、TypeScript、ESLint、Prettier、工作流校验和差异检查通过；V1-26 继续保持 `AWAITING_REVIEW`，V1-D 不关闭。

2026-08-08 平台边界同步：确认 Next.js 只承担网页中间验证层，用于验证行为、组件和视觉；微信小程序是最终产品交付端。后续 V1-E 将把网页验收结果转译为 WXML/WXSS 和微信平台能力，V1-F 同时回归网页基线与小程序最终端；该认知已同步至设计文档、技术栈、实施计划、架构、README、PRD 和相关决策／设计说明。

当时状态记录：V1-C 的自动验证、开发者工具验证、区块回归与用户统一人工验收均已通过；V1-D 当时仍处于 `IN_PROGRESS`，V1-E 当时仍锁定。该状态已由 2026-08-11 的 V1-D 人工验收、V1-E 解锁与照搬基线澄清取代。

2026-08-06 用户批准新的 UI 架构认知：所有 UI 相关任务以 Next.js 可运行网页交付，Figma 不再承担低保真、组件、高保真或验收门禁。该变更影响产品平台与核心前端架构，但不改变计算、会话、识别、隐私边界或区块顺序；V1-D 保持活动，V1-26 进入 `AWAITING_REVIEW`。

2026-08-06 V1-26 自动验证完成：Next.js 生产构建、网页 TypeScript、ESLint、Prettier 通过；Playwright 通过全部页面状态、主流程到停止路径和 390px 无横向溢出；ego-browser 桌面与手机语义检查通过。随后用户要求修订文案并增加手机端三入口底部导航，V1-26 回到 `IN_PROGRESS`。

2026-08-07 V1-26 修订自动验证完成：克制、有一番赏语境的页面文案已替换；手机端 `识别／好版地图／我的` 底部导航可达。好版地图只显示 V2 占位，`我的` 当时只呈现本机记录与设置入口，不新增真实账号。Next.js build、TypeScript、ESLint、Prettier、Playwright、既有 Vitest 和所有契约校验通过，V1-26 转回 `AWAITING_REVIEW`。

2026-08-07 用户继续修订 V1-26 主流程：导入后直达识别；识别结果确认后多选目标奖并进入一番赏版面工作台；票位用空／实心格表示总票数／已贴票数，A—F 显示三位小数概率，Last 在左上角显示包套成本；抽取记录、撤销和提示浮层均在工作台内完成，取消独立的建池、比较、确认结果、历史、撤销与复制页面；本地记录集中到“我的 → 账号管理”。本轮正在验证。用户提出的“保存图片／创建分享链接”涉及版面照片导出、链接权限、远程服务与删除边界，登记为 V1-E／V1-F 的待批准产品与架构修订，当前不实现。

2026-08-07 用户确认 V2 共享取证采用“前端先行”顺序：先完成收手、同意、赏票取证相机框、OCR 核对结果、位置／备注和待发布预览的网页流程，再接入真实相机、OCR、位置、私有证据包、审核和地图发布。计划新增 V1-30A 作为无网络写入的前端低保真，新增 V2-00 作为真实接入前的数据最小化／隐私对齐，并修订 V2-B 的数据、上传、OCR 与审核步骤。核对成功也只能生成待审核草稿，用户最终确认和服务端审核前不得公开。

2026-08-07 用户新增“情境提醒”认知：提示系统以抽赏记录为唯一业务输入，分析目标命中、意外高奖、连续低关注奖、连续多抽、目标达成、撤销和数据不足等情境，在一番赏主界面用可关闭、自动消失的浮层提醒；提示不羞辱、不制造焦虑、不预测中奖，也不推动继续消费。已建立 `memory-bank/情境提醒.md`，并新增 V1-30B 作为 V1-D 的规则文档与低保真状态门禁。

2026-08-07 用户修订概率反馈：一番赏版面奖级下方去掉“下一抽”前缀，只显示百分比，并固定精确到小数点后三位；每次抽取后按最新余票重新计算，确保界面有可见变化。

2026-08-07 用户提出新增账号体系：需要“我的”面板、头像、用户 ID、账号管理、登录和后端存储；本地记录只有在用户主动分享并完成取证核对后，才升级为可提交到好版地图的真实贡献记录。该请求会改变当前 V1 的账号、存储、隐私和区块范围，已创建待批准方案 `docs/decisions/account-and-my-panel-proposal.md`；未获确认前不修改已批准 V1 基线、不接入真实后端。

2026-08-07 用户进一步确认：真实账号与云端保存放到 V2，但 V1 网页先搭好“我的”面板和账号管理框架，供 V2 直接接入。V1-26 已加入头像、用户 ID、账号状态、本地记录、我的贡献、提醒设置、隐私与关于入口；V1-30C 作为独立框架门禁，真实登录、后端存储和同步仍未实现。

2026-08-07 用户简化识别失败路径：原“没有识别成功”“信息不完整”“暂时无法建立”三个页面统一为“无法建立票池”，集中说明可能原因并提供重新导入、返回核对和返回首页。旧 URL 自动兼容到统一页，页面索引只保留一个异常状态。

2026-08-07 用户修订抽取成本反馈：轻提示和抽取记录不再重复单抽价格，统一显示截至本轮的累计花费；金额在每抽后递增，撤销最近一抽后与记录同步恢复。

2026-08-07 用户明确版面识别和奖级呈现：模型固定输出奖级、每级总／空／已贴／未知票位、票位排布、价格、Last、完整度、置信度和问题；票池总数与余票由本地券位求和。大／中／小赏不由 AI 判断：A—F 的总票数 `≤ 5` 为大赏、`6—9` 为中赏、`≥ 10` 为小赏，G—Z／OTHER 为小赏；大赏占更大版面、使用更大图标与票位，中赏和小赏使用紧凑、可换行票位。已新增对应决策表并纳入 V1-26 低保真和 V1-30 基础组件计划。

2026-08-07 V1-26 大中小赏低保真验证完成：Prettier、工作流校验、TypeScript、ESLint、Playwright 4 项和差异检查通过；浏览器实测 390px 无横向溢出，大赏逐行显示、中赏和小赏横向排列，1440px 下三个大赏可同列显示。奖级抽取后的新票、概率与累计花费提示保持正常；V1-26 转为 `AWAITING_REVIEW`，等待用户验收。

2026-08-07 用户确认大中小赏必须是正式认知与程序算法，而非单页视觉约定。V1-30 开始执行：`packages/board-layout` 新增 `derivePrizeClassification`，只以已核对的奖级标签和正整数总票位返回大赏／中赏／小赏；无效票数返回未确认，禁止静默分类。规则覆盖 5 张与 10 张临界值、A—F、G—Z 与 `OTHER`，识别模型没有该输出字段。

2026-08-07 V1-30 大中小赏算法子产物验证完成：`packages/board-layout` 单元测试覆盖 5 张与 10 张临界值、G／OTHER 与无效票数，3 项全部通过；TypeScript、ESLint、网页 Playwright 4 项、版面契约、识别契约、工作流校验和差异检查通过。V1-30 仍待完成 Tokens、通用组件和 schema 渲染约束。

2026-08-07 用户修订《情境提醒》：统一用大赏／中赏／小赏；总票位 `≤ 5` 为大赏、`6—9` 为中赏、`≥ 10` 为小赏，G—Z／OTHER 为小赏。成本仅持续展示，不设阈值或用户配置；移除长时间未操作提醒。连续小赏采用“经典又时尚／又是经典时尚／又又又是经典时尚／还是经典时尚”四档文案；V1-30B 在后续进入正式实现前须按此规则编写固定案例。

2026-08-07 V1-30B 规则文档验证完成：必需文案、连续小赏四档、无成本节点与无闲置提醒的静态断言通过；分类算法单元测试 4 项、TypeScript、ESLint、网页 Playwright 4 项、版面与识别契约、工作流校验和差异检查通过。V1-30B 转为 `AWAITING_REVIEW`，等待用户审阅提示语气与分类边界。

2026-08-07 用户修订版面排版认知：大赏每行两个正方形区块，第 3 个起换行；小赏各自独占一条横向票条，票位从左到右排列，空间不足时才换行。网页低保真、版面规则、产品定义与架构须按此对齐。

2026-08-07 大中小赏版面排版验证完成：TypeScript、ESLint、网页 Playwright 5 项、工作流校验和差异检查通过；浏览器实测桌面与 390px 手机均为 A／B 同行、C 换行，大赏保持方形，中赏和小赏独占横向票条，16 个小赏票位仅在手机端因空间不足自然换行，未出现横向溢出。

2026-08-07 用户确认《情境提醒》其余场景与防沉迷边界通过，要求修正奖项术语后直接接入网页：奖项数量标签只保留大赏、中赏和小赏三类互斥分类，不使用“普通赏”等未定义形容；V1-30B 重新进入实现与验证，网页轻提示将从抽取记录的纯规则分析中产生。

2026-08-07 V1-30B 网页轻提示验证完成：`apps/web/app/situation-reminder.ts` 以纯规则分析抽取记录并输出同一抽内的优先级和文案；每次新抽取独立生成本轮最高优先级提示，不使用跨抽取冷却。主版面将抽取事实与情境文案置于同一可关闭、自动消失的浮层。单元测试覆盖三类分类、目标命中、小赏连续 1／2／3／4+ 和无成本触发；网页测试覆盖首抽目标、关闭浮层和小赏四档。类型、Lint、61 项 Vitest、6 项 Playwright、工作流校验和浏览器实测均通过；V1-30B 转为 `AWAITING_REVIEW`。

2026-08-07 用户确认不使用 AI 或“推荐抽选”，改为展示可复核的抽数事实：方案说明只比较当前目标在 1／2／3 抽下的命中概率、未命中概率与累计成本，并固定说明不保证、停止仍可选。该行为与现有计算内核和反促抽边界一致，作为 V1-D 的 V1-30D 网页低保真实现；真实会话接入仍在后续 V1-E。

2026-08-07 V1-30D 方案说明验证完成：网页通过 `plan-options` 适配层直接复用 `packages/core` 的精确不放回概率和整数金额，Next.js 随包编译该工作区模块，不引入 AI、网络请求或复制公式。工作台在撤销上方提供同页抽屉，展示 1／2／3 抽的命中、未命中与累计成本，并固定显示结果不保证和停止仍可选；目标奖无余票时不产生方案。格式、Lint、类型、63 项 Vitest、全部契约与工作流校验、7 项 Playwright 及桌面／390px 浏览器实测均通过；V1-30D 转为 `AWAITING_REVIEW`。

2026-08-07 用户确认轻提醒信息合并：每次抽取后的抽到什么赏、剩余票数、累计花费与情境提醒必须同框显示，并共同支持手动关闭和自动消失；不得拆为多个提示框。该行为属于 V1-30B 的现有网页轻提示范围；已补充端到端断言，格式、Lint、类型、工作流校验、7 项 Playwright 和实际浏览器核验均通过。

2026-08-07 用户修订撤销与情境提醒：网页低保真支持连续撤销最近 50 抽，不支持跳过中间轮次；正式会话状态机的对应接入保留给 V1-E 的 V1-37。连续小赏第 4 次及以后保持“还是经典时尚”，每次新抽取都必须触发，不受历史提示状态影响。63 项 Vitest、7 项 Playwright、格式、Lint、类型、工作流校验和实际浏览器的连续小赏／连续撤销核验均通过。

2026-08-07 计划粒度对齐：方案说明没有新增通用概率或金额算法，只读复用 V1-B 已验收的精确内核，因此保留为 V1-D 的独立网页接入步骤 V1-30D，而非回写旧算法步骤。将 50 步连续撤销、抽取事实与情境同框、以及连续小赏不得被同文案冷却压制，单列为 V1-30E；不改变区块顺序、平台、隐私或计算内核边界。

2026-08-07 V1-30A 前端流程验证完成：一番赏工作台底部已提供“收手”入口；同页依次展示是否共享、赏票取证构图框、地点与备注、演示核对结果和待发布预览。流程不请求相机、OCR、位置或网络，预览固定声明未上传、不会公开。格式、Lint、类型和 8 项 Playwright 通过；等待用户审阅交互与文案。

2026-08-08 情境提醒送达修复：移除跨抽取的 30 秒情境冷却表。每次新抽取均展示本轮最高优先级情境，仍只保留同一抽内的优先级选择；连续小赏第 4 次以后也会逐抽显示。新增“同一 B 赏情境在撤销后再次触发仍显示”的网页回归，63 项 Vitest、9 项 Playwright、格式、Lint 和类型检查通过。

2026-08-08 V1-30A 弹窗布局修订：手机视口不再把收手分享流程固定在屏幕底部。是否分享、拍摄赏票及地点与备注、核对结果和待发布预览均覆盖在当前一番赏版面工作区中央；保持版面内相对定位与可滚动高度，不改变前端演示、无相机／OCR／定位／上传的边界。格式、Lint、类型、9 项 Playwright、工作流校验和浏览器 DOM 定位检查通过。

2026-08-08 用户认为现有“方案说明”只给目标奖的一至三抽概率，缺少针对上传版面的信息价值。已将 V1-30D 重新开放为“局面可能性”网页接入，并新增 V1-30F：先独立冻结局面可能性的事件、固定观察窗口、精确公式、版本和固定案例，再由网页读取结果。算法不使用 AI、用户画像、历史投入或市场信息；只展示版面特有事件概率，不排序、不推荐、没有执行抽取入口。独立规格位于 `docs/decisions/v1-board-outlook-algorithm.md`，待用户验收事件目录与语气后实施。

2026-08-08 用户修订收手共享流程：用户提交赏票照片后不再查看独立的核对结果或待发布预览；用户只完成分享意愿、赏票拍摄、地点备注与提交核对。服务端在最多 8 秒前台等待预算内返回时只给短提示，否则转为“我的贡献”的后台核对状态；核对通过只保存核对后的当前版面状态，地图不公开逐抽记录、抽中赏级或赏票原图。已建立 `contribution-verification-v1.0.0` 独立规格，并将 V1-30A 与 V2-00／V2-07—V2-09 对齐；V1 不伪造相机、OCR、云端保存或上传。

2026-08-08 用户进一步简化共享流程：取消任何前台 OCR 等待。用户提交后立即进入“我的贡献”的“后台核对中”；后台完成后才显示“需要重拍”或“核对通过，待发布审核”。V1-30A 以本地状态占位演示该跳转，真实 OCR 时延仅用于 V2 后台任务的监控与重试，不改变用户路径。

2026-08-08 V1-30A 后台核对跳转验证完成：提交核对后立即进入 `/?view=my&contribution=verifying`，显示“后台正在核对本次提交／核对中”，不显示“核对结果”或“待发布预览”，且“我的 → 我的贡献”入口回到同一状态区。真实相机、OCR、位置、上传、取消、重拍和审核结果仍由 V2 后端状态驱动，不在 V1 伪造。Prettier、ESLint、TypeScript、9 项 Playwright、工作流校验、差异检查和 ego-browser 路径检查通过；V1-30A 转为 `AWAITING_REVIEW`。

2026-08-08 V1-30D／V1-30F 局面可能性网页接入完成：新增 `packages/core/src/board-outlook.ts`，将固定 3 抽观察窗口、事件顺序与精确不放回概率实现为平台无关纯函数；网页使用本地奖级分类汇总大赏、小赏与目标余票，替换旧“方案说明”为版面内“局面可能性”抽屉。每次抽取或撤销都会按当前余票重算，目标耗尽只隐藏目标事件，其他事件继续显示；不提供推荐、排序或执行抽取。贡献 UI 同步补上“需要重拍 → 重新拍摄／取消”及“核对通过，待发布审核”的状态框架。68 项 Vitest、TypeScript、ESLint、9 项 Playwright 和 ego-browser 路径检查通过；V1-30D／V1-30F 转为 `AWAITING_REVIEW`。

2026-08-08 用户修订提交后交互：提交核对后必须仍停留在一番赏版面，不自动跳转“我的”；版面中央显示“已提交／后台正在核对本次提交／可在‘我的 → 我的贡献’里面查看”，用户可点“继续”关闭提示并继续留在版面，或点“退出”进入“我的贡献”的后台核对状态。识别完成后先显示“核对中”，提供“继续”进入识别结果和“退出”返回导入页。

2026-08-08 V1-26 会话缓存与弹层修订完成：新增 `apps/web/app/draw-cache.ts`，仅使用当前浏览器 `sessionStorage` 保存版面、抽取记录和最近 50 抽撤销栈，离开再回到版面可恢复，不宣称云端保存；提交状态框和分享取证框改为当前视口居中的模态层，避免长版面滚动时落在视口之外，仍不固定在版面底部。Prettier、ESLint、TypeScript、66 项 Vitest、10 项 Playwright、工作流校验和 diff 检查全部通过；ego-browser 已核验“核对中 → 继续”、提交后仍为 `view=draw`、中央“已提交”状态、退出到 `view=my&contribution=verifying` 以及离开后缓存恢复。V1-26／V1-30A 保持 `AWAITING_REVIEW`。

2026-08-08 V1-26 异常路由收敛：移除“当前条件下没有可行方案”和“Last 条件还不完整”两个独立页面及页面索引入口；旧 URL 兼容映射到统一的“无法建立票池”恢复页。共享异常页、TypeScript、ESLint、66 项 Vitest、10 项 Playwright、工作流校验和 diff 检查通过。

2026-08-08 V1-26 导入流程修订：开始页点击“导入版面照片”先进入“拍摄版面”取景框，以虚线版面和角标辅助完整构图；点击“拍摄版面”后才进入“正在识别版面”。已删除旧“确认照片用途”页面并将历史 `source` URL 兼容到取景框。当前仅实现网页取景与流程，真实相机权限、相册选择和上传仍按 V1-E／V2 门禁后置。Prettier、ESLint、TypeScript、66 项 Vitest、10 项 Playwright、工作流校验和 diff 检查通过；ego-browser 确认取景框与构图提示在当前视口可见。

2026-08-08 V1-26 识别反馈修订：识别页改为照片接收、奖级／余票读取、价格／Last 整理的逐项勾选进度；完成后自动进入识别结果，识别失败自动进入“无法建立票池”，移除“核对中”的继续／退出手动选择。新增成功与失败自动路由的 Playwright 回归；Prettier、ESLint、TypeScript、66 项 Vitest、11 项 Playwright、工作流校验和 diff 检查通过，ego-browser 已确认中段进度勾选与识别结果自动跳转。

2026-08-08 V1-26 识别结果编辑修订：移除独立“核对票池信息”页，识别结果改为一番赏式可编辑版面。每个奖级按本地总票数派生大赏、中赏和小赏视觉布局，并同时显示“总票数－已贴票数”、空／实心票位，以及可直接修改的两个数字输入框；例如 `1 - 0` 表示总共 1 张、版面已贴 0 张。点击“确认”会将校正后的数据写入当前浏览器会话缓存，并作为后续目标奖选择和一番赏工作台的初始票位。Prettier、ESLint、TypeScript、66 项 Vitest、12 项 Playwright、工作流校验和 diff 检查通过；浏览器实测确认 A 显示 `1 - 0`，且把 B 总票数改为 3 后进入工作台仍显示 3 个票位。

2026-08-08 V1-26 版面生成状态修订：识别结果确认后不立即切换页面，而是在当前可编辑版面中央显示“正在生成版面”的进度框；生成期间锁定票数输入和确认按钮，完成后自动进入已生成的一番赏主版面。校正后的票位仍先写入当前浏览器会话缓存；目标奖多选页面保留为可访问预留，不插入这条快捷主路径。生成进度与自动进入工作台的 Playwright 回归已通过；Prettier、ESLint、TypeScript、66 项 Vitest、12 项 Playwright、工作流校验、diff 检查和 ego-browser 实测均通过，继续保持 V1 不接入真实生成服务或云端写入。

2026-08-08 V1-26 “我的”信息架构修订：账号管理与本地记录不再复用同一页面。账号管理只保留账号与设置入口；本地记录独立承载本机抽赏草稿、抽取记录、待核对、待发布审核和“已上传”的 V2 预留位置。提交后的“退出”与旧的“我的贡献”链接均兼容进入“我的 → 本地记录”的贡献核对状态；V1 明确不伪造实际云端上传。

2026-08-08 V1-26／V1-30A 提交后退出路径修订：提交核对后中央“已提交”状态仍停留在一番赏版面，“继续”关闭提示并留在版面；“退出”不再跳转“我的 → 本地记录”，而是返回“导入版面”，方便直接开始下一张版面。真实后台核对与贡献状态仍留待 V2 实现。

2026-08-08 V1-26／V1-30A 版面身份与重复提交认知：识别确认时为本机版面生成稳定 `boardId`。用户在“已提交”提示点“继续”后继续抽取，再次提交时以同一 `boardId` 记录最新票位、完整抽取记录、备注和提交时间，覆盖原待核对快照；重新导入并确认的版面才生成新 ID。V1 只在浏览器会话缓存演示该覆盖语义；V2 服务端将以 `boardId` 作为贡献草稿的幂等更新键。

2026-08-08 《情境提醒》文案同步：以文档第 4 节为网页唯一来源，非首抽目标命中改为“中！！！”，连续小赏四档改为“经典又时尚／又是经典时尚／又又又是经典时尚／还是经典时尚”；文档验收案例、网页纯规则、单元测试与端到端断言均已同步。67 项 Vitest、12 项 Playwright、格式、Lint、类型与工作流校验通过。

2026-08-08 奖级认知修订：奖项数量标签统一为大赏、中赏、小赏三类互斥分类。A—F 的总票位 `≤ 5` 为大赏、`6—9` 为中赏、`≥ 10` 为小赏；G—Z／`OTHER` 为小赏。移除旧的第三层子集标签语义；识别结果与主版面保留大赏方形、中赏／小赏横向票条，情境提醒与局面可能性改按小赏统计。局面可能性算法因事件 ID 与文案语义变更升级为 `board-outlook-v1.1.0`。

## 已确认新认知

- 账号管理、地图提醒和分享都进入 V2；具体微信登录、账号标识、提醒触发和分享实现方案按本轮推荐基线在 V2-00／V2-03 再批准；
- 真实账号在 V2 与好版地图同时上线，承担个人地图贡献的认证、服务端归属、状态查询、撤回／删除与审计；它不是论坛或通用社群系统；
- 主界面已经从单一辅助抽赏入口扩展为“进入辅助抽赏／直接上传版面”双入口；两者复用版面拍摄、相册、提取、识别与人工校正，直接上传不创建抽赏会话，V1 只建立本机待核对记录；
- 记录身份必须分层：`boardId` 是一次版面确认链路和幂等覆盖键，未来 `recordId` 是规范记录 ID，六位辅助编码是人类可读查找码，账号归属由服务端认证身份绑定；同一现实版面可以存在多个时间点、多个观察者的合法观察，不能把短码解释为排他所有权；
- 六位辅助编码为未来贡献归因、成就／奖励资格和点赞归集提供可见入口，但实际结算与授权必须使用规范记录 ID、账号 ID 和可审计事件；V1 不实现奖励或真实点赞；
- 好版地图的信息池治理属于数据来源与审核问题：编码只能减少记录混淆，不能独立防止脏信息；公共进入门必须组合来源身份、证据、守恒、重复检测、审核、新鲜度和版本冲突规则；
- ICHI 的产品差异化是用同一个真实版面数据对象连接“出发前发现”与“到店后决策”两个场景，并以“工具效用驱动的玩家数据闭环 + 经核验门店／店员一手现场直传”两条主路径支撑地图供给；决策工具必须先为玩家独立产生价值，门店直传必须核验来源身份，两类版面数据均只有经证据核对和发布审核后才能进入地图；
- V1 不再采集产品版面目录或依赖运行时样本；改用随包发布的通用版面语法；
- A—Z 由同一个奖级组件承载，识别到哪级才显示哪级；特殊标签使用 `OTHER` 保留原文并确认；
- 每级券位总数代表该级初始数量；只有完整版面和一券位一抽规则均确认时才自动求总抽数；
- 价格无法识别或疑似手写时局部要求用户补填，不丢弃其他识别结果；
- Last、Double Chance 和所有辅助区块不计入普通总抽数；所有组件随包预置，不下发远程代码；
- 项目开发步幅改为区块：同区块 step 一并解锁、共享中间产物并统一人工验收，只有整区块通过后才解锁下一区块；
- 正式文件按活动区块的变更目的联动开放，不因未来 step 仍会使用同一路径而冻结。
- V1 金额统一以最小货币单位整数处理；停止与抽、包、买同级展示，期望抽数不得表达为保证或推荐抽数；
- V1-A 工具链锁定 Node.js 24.11、pnpm 11.9.0、TypeScript 6.0.3、Vitest 4.1.10 和微信基础库 3.17.0；工程已获得真实小程序 AppID，AppSecret 不进入仓库或客户端；
- 用户指定阿里云百炼 `qwen3.5-flash` 作为整版识别主模型，低置信文字局部用同服务方 `qwen3.5-ocr` 补充；客户端／单次上游超时为 8／5 秒，两类调用各最多一次，最大输出 4096 tokens、费用警戒线 0.03 元；图片不由 ICHI 持久化，提供方保留期与删除路径需在发布前确认。
- V1-B 概率统一使用约分后的 `bigint` 有理数，金额统一使用 `bigint` 最小货币单位；公开入口不返回 NaN、近似伪精确值、市场价或神秘推荐分；
- V1-B 输入先进入“可计算／信息不足／存在矛盾”三态校验，抽、包、买、停输出并列解释数据，停止始终可用且保留会话语义。
- V1-B 允许增加“约束内方案”：仅在用户明确设置预算、最大抽数和最低目标概率后，返回满足全部条件的最少抽数；成功与失败概率同时显示，无解不放宽约束，Last 只在规则确认且包套全部余票时表达保证。

## 区块对齐事项

- V2-A／V2-B／V2-C 账号、提醒与分享对齐：V2-00 冻结微信身份映射、内部 `accountId`／公开 `ICHI ID`、资料、跨端映射、提醒订阅和分享字段；V2-B 增加微信登录、资料管理及服务端关注／投递数据；V2-C 增加关注规则、订阅消息、地图转发和抽赏海报，同时保持无用户主页或社交入口。V2 仍锁定，当前不创建账号代码、消息模板或云资源；
- V1-F 预解锁对齐完成：V1-40—V1-47 已按 V1-E 当前双入口、原生相机、记录总账、六位编码、三行记录卡、E 区最终获验收的撕拉交互、50 抽撤销和真实版面识别代理重写；V1-48 的 V1 决策门保持不变。V1-E 人工验收通过前整区块继续 `LOCKED`，通过后再执行正式区块认知对齐并整组转为 `READY`；
- V2-A／V2-B／V2-C 远期身份与数据治理事项：服务端需把规范 `recordId` 与认证账号归属绑定，点赞附着于同一已上传贡献，未来奖励以可审计事件结算；六位辅助编码不参与鉴权、排他所有权或公共去重。地图入池需增加来源身份、证据、重复检测、新鲜度、审核与版本冲突门禁。当前 V2 仍锁定，不提前展开数据表或奖励规则；
- V2-A／V2-B／V2-C 远期对齐事项：解锁 V2 时将供给主路径对齐为“决策工具→玩家本人授权贡献→核对审核→地图”和“授权门店／经核验店员直接拍摄→识别校正→来源与版面审核→地图”；数据模型需增加来源类型、门店／任职关系核验状态与观察时间，并区分门店直传和品牌官方来源；验收需按来源分别补充玩家贡献转化、门店覆盖／更新频率、供给密度、发现到到店核对转化与闭环回流。官方 API、平台合作和人工策展保持为可选补充。目前 V2 仍锁定，不提前批量改写实施步骤；
- V1-01C 启动对齐通过：目标、输入、依赖和验收与 V1-01B 一致；已有版面草稿 schema 直接复用，避免重复建模。
- V1-01D 启动对齐通过：沿用 V1-01B 的本地组件注册表和 V1-01C 的识别契约；增加可检查的二维预览与手机重排计划，回应“版面在哪”，但不扩大为页面实现。
- V1-A 门禁调整已对齐：V1-01D—V1-06 处于同一活动区块，可联动修改正式文件和共享产物；V1-B 及以后保持锁定。
- V1-B 启动对齐通过：金额整数、期望非保证和多目标精确计算分别直接约束 V1-13、V1-12、V1-11；不改变区块范围、架构或顺序，V1-07—V1-17 整组解锁。
- V1-B 验收修订已批准：新增 V1-16A，重新开放 V1-17 回归；不改变平台、隐私、核心架构或区块顺序。V1-E 的目标／预算和方案比较页面需要在解锁前吸收对应文案与交互保护。
- V1-C 启动对齐通过：采用纯 reducer／状态机，不引入 Zustand；`bigint` 金额与分数以版本化十进制字符串持久化；版面兼容只接受随包已知 schema／注册表，失败保留最近可用会话；识别 QA 使用项目自建合成资产或显式授权资产，不声明真实版面准确率。
- V1-D 启动对齐通过：V1-C 已批准的本地会话、单抽撤销、存储／删除、随包 schema 兼容与 QA 边界直接约束 V1-26 的页面流和异常状态；不改变产品范围、平台、隐私、核心架构或区块顺序。
- V1-D UI 架构修订已批准：Next.js 手机优先网页承担行为、组件和视觉的中间验证；微信小程序是最终产品交付端，V1-E/F 负责把网页验收结果转译为 WXML/WXSS 和微信平台能力；Figma 仅作可选参考，V1-26—V1-30 先在网页执行，后续区块再做小程序实现与跨端回归。
- V1-26 主工作台认知：识别出的版面是后续抽取、概率、撤销和记录的中心；每级用票位表达空／已贴状态，抽取后局部更新票位和概率，状态提示以可关闭的短暂浮层呈现；预算、计划抽数和最低概率不再是进入工作台的必填项。
- 情境提醒认知：抽赏记录经过纯规则分析后，每次新抽取独立生成本轮最高优先级提示，主界面只展示事实型、可关闭、自动消失的提示；不使用跨抽取冷却，奖励与防沉迷提示不能单独推动继续投入。
- 概率显示认知：主版面只展示三位小数百分比，不再显示“下一抽”；每次抽取后所有奖级按最新余票刷新。
- 账号框架认知：V1 先完成“我的”网页信息架构和未登录占位，V2 再接入真实账号、后端私有记录和贡献同步；本地草稿、待审核贡献和已发布地图记录必须分层。
- 识别与奖级呈现认知：识别模型只返回可核对的版面事实；票池总数／余票和大／中／小赏由本地券位派生。A—F 中总票数 `≤ 5` 为大赏、`6—9` 为中赏、`≥ 10` 为小赏，G—Z／OTHER 为小赏；三档只改变版面视觉密度，不改变计算或抽取语义。
- V2 共享取证认知：前端可先验证意愿、构图引导、核对和备注负担，但真实相机、OCR、位置、上传和好版地图发布必须后置到合法供给、私有证据存储、删除权和审核状态完成后；公共地图只接收最终确认且审核通过的证据包，不存在“拍完自动公开”。
- image2 视觉环节已完成代码级第一轮转译但尚未人工验收：以 HTML 布局和用户提供的网页代码作为视觉输入，image2 只产出视觉方向和非交互素材，最终组件回到真实 React/HTML/CSS；V1-29 的全局票券式视觉与动效已写入本地 CSS 和 React 组件，等待用户验收。
- V1-B 及以后受影响的远期区块在解锁前仍按执行协议整区块复核。

## 已完成

### 2026-08-06｜V1-B 计算内核

- 用户统一验收 V1-07—V1-17（含 V1-16A）通过；计算内核与计算展示边界成为已批准基线；
- 精确有理数概率、组合与多目标计算、金额整数、输入三态校验和抽／包／买／停并列解释均完成；
- “约束内方案”只在用户明确预算、最大抽数和最低概率后返回满足硬约束的最少抽数，同时显示失败概率；无解不放宽约束，停止始终可选；
- Last 只在规则确认且包套全部余票时表达保证；V1-C 保持锁定，等待新的开始指令。

### 2026-08-06｜V1-C 会话、状态与本地数据

- 用户统一验收 V1-18—V1-25 通过；一抽一记与最近轮撤销、复制会话不继承历史、本地恢复／删除／容量提示、未知版面版本回退和受控识别 QA 边界成为批准基线；
- V1-D 启动认知对齐无实质调整，V1-26—V1-30 整组解锁；V1-26 已交付低保真页面流，尚未进入 tokens、正式组件或高保真页面。

### 2026-08-05｜V1-A 产品基线与工程准备

- 用户以“开始 V1-B”确认 V1-A 统一人工验收通过；
- 六个计算术语、10 个固定向量、工具链与识别决策、workspace、小程序骨架和统一质量门成为已批准基线；
- V1-B 启动认知对齐无实质调整，V1-C 及以后保持锁定。

### 2026-08-05｜V1-01D 本地版面渲染契约

- 用户明确授权 Agent 先完成本 step 的端到端验收；
- 确认识别只提供结构化数据，A—Z 奖级与全部 renderer 均从随包本地注册表解析；
- 确认原版二维只读预览保留坐标与层级，手机流保持阅读顺序并在窄屏折为单列；
- 确认缺边版面只提供只读局部预览和重拍动作，未知可执行类型与远程代码均被拒绝。

### 2026-08-05｜V1-01C 版面识别数据契约

- 用户人工验收通过；
- 确认完整版面进入用户确认，缺边版面保留草稿但必须重拍；
- 确认手写价格只补价格，券位不守恒只修正对应奖级；
- 确认识别只返回结构化草稿、原因码和人工动作，不生成或下载组件代码。

### 2026-08-05｜V1-01B 版面语法与饱和组件注册表

- 用户人工验收通过；
- 确认不收集产品版面目录，A—Z 由同一个通用奖级组件承载；
- 确认每级券位用于表达该级数量，满足完整性门禁后才推导总抽数；
- 确认价格识别失败时局部手填，Last、Double Chance 和辅助区块不计入普通总抽数；
- 确认所有组件随小程序包预置，识别只输出数据、置信度和二维排布。

### 2026-08-05｜V1-01A 版面目录覆盖政策

- 用户人工验收通过；
- 以 `BoardEdition` 作为可计数的目录分母；
- 冻结 P0／P1／P2 覆盖集合、S1／S2／S3 来源等级、未知字段状态、覆盖指标和复核责任；
- 决策文件 `docs/decisions/v1-board-catalog-coverage.md` 当时转为 `APPROVED`；2026-08-05 后续新认知将其标记为 `SUPERSEDED`，历史验收事实保留。

### 2026-08-05｜V1-01 产品基线

- 用户人工验收通过；
- V1 仅交付微信小程序手机端；
- 新建票池最初限定为未抽版面；后续确认可读取完整进度版面的券位占用，但不读取已使用奖券内容；
- 最初采用产品目录匹配；后续改为直接识别通用版面语法并由小程序内置组件数据驱动渲染；
- 抽取记录只支持一抽一记，V1 不提供个人价值模块。

### 2026-08-05｜工作流迁移

- 安装 `WoodyXu/vibe-coding-standard-workflow` 到全局 Codex Skills；
- 读取 Skill、Codex 专项说明和提示词模板；
- 审计历史 PRD、V1/V2/V3 产品计划、跨端交付流程和旧 Harness；
- 建立正式 `PRD.md`；
- 建立 `design-document.md`、`tech-stack.md`、`implementation-plan.md`；
- 将 V1 收敛为本地即时计算，将地图延后到 V2，将可信社群延后到 V3；
- 用 `progress.md` 替代 `current.json` 作为进度事实源；
- 更新 `AGENTS.md`、`README.md` 和 `architecture.md`；
- 保留 NeoPRD、Product Atlas 与 Cowart 画布为历史研究资料。

## 验证记录

| 日期 | 对象 | 结果 |
| --- | --- | --- |
| 2026-08-05 | Skill 安装 | 已安装到 `/Users/cunfu/.codex/skills/vibe-coding-standard-workflow` |
| 2026-08-05 | 产品来源合并 | 新三阶段计划优先；旧 PRD 补充功能、风险和验收细节 |
| 2026-08-05 | 工作流文件 | `node scripts/validate-workflow.mjs` 通过；7 个必需文件齐全 |
| 2026-08-05 | Implementation Plan | V1—V3 当前共 102 个细分步骤，每步包含自动验证和人工验收 |
| 2026-08-05 | V1-01 人工验收 | 通过；PRD、设计文档、技术栈和实施计划转为 `APPROVED` |
| 2026-08-05 | V1-01A 覆盖政策 | 19 项可计数性要求通过；P0／P1／P2、BoardEdition、S1／S2／S3、字段状态、指标和复核周期齐全 |
| 2026-08-05 | V1-01A 工作流 | `node scripts/validate-workflow.mjs` 和 `git diff --check` 通过 |
| 2026-08-05 | V1-01A 人工验收 | 通过；覆盖政策转为 `APPROVED`，实施步骤转为 `COMPLETED` |
| 2026-08-05 | 下一步自动认知对齐 | 已写入 `AGENTS.md` 与实施协议；只自动检查紧接的下一步，实质变化仍由用户批准 |
| 2026-08-05 | V1-01B 计划对齐 | 拆分为 schema 与种子快照、P0/P1 采集、识别与本地组件契约三个步骤 |
| 2026-08-05 | V1-01B 目录校验 | `node scripts/validate-board-catalog.mjs` 通过：4 条中日代表记录、5 个来源、11／24 个已验证核心字段 |
| 2026-08-05 | V1-01B 工作流 | `node scripts/validate-workflow.mjs` 和 `git diff --check` 通过 |
| 2026-08-05 | V1-01B 产品认知修正 | 取消至少 20 份产品样本和 P0／P1 目录依赖；改为 A—Z 奖级、券位与辅助区块组成的饱和本地语法 |
| 2026-08-05 | V1-01B 版面语法校验 | `node scripts/validate-board-layout.mjs` 通过：26 个奖级标签、16 个组件类型、8 个布局区域、2 条带门禁推导规则 |
| 2026-08-05 | V1-01B 人工验收 | 通过；用户确认版面语法、券位计数、价格手填与排布语义，步骤转为 `COMPLETED` |
| 2026-08-05 | V1-01C 启动对齐 | 通过；复用 V1-01B 的 `BoardDraft` schema，仅新增识别信封、原因码、人工动作和固定案例 |
| 2026-08-05 | V1-01C 契约校验 | `node scripts/validate-recognition-contract.mjs` 通过：4 个固定案例、18 个问题原因码、10 个用户动作；完整图、缺图、手写价格和券位矛盾路由确定 |
| 2026-08-05 | V1-01C 回归校验 | `node scripts/validate-board-layout.mjs`、`node scripts/validate-workflow.mjs` 和 `git diff --check` 通过 |
| 2026-08-05 | V1-01C 人工验收 | 通过；完整图、缺图、手写价格和券位矛盾的处理路径获用户确认，步骤转为 `COMPLETED` |
| 2026-08-05 | V1-01D 启动对齐 | 通过；复用本地组件注册表和识别契约，增加可检查的二维预览与手机重排计划，不进入页面实现 |
| 2026-08-05 | V1-01D 渲染契约校验 | `node scripts/validate-render-contract.mjs` 通过：26 个奖级标签、16 个本地组件映射、3 个手机断点、2 个固定渲染计划；二维位置、手机顺序和远程代码拒绝均确定 |
| 2026-08-05 | V1-01D 回归校验 | 识别契约、版面语法、工作流与 `git diff --check` 全部通过 |
| 2026-08-05 | V1-01D 端到端验收 | 用户授权 Agent 代验收；二维预览、手机重排、缺边只读、本地 renderer 和远程代码拒绝语义均通过 |
| 2026-08-05 | V1-02 术语校验 | 6 个术语均具备输入、输出、限制和示例；金额最小单位、期望非保证、停止同级展示已固定 |
| 2026-08-05 | V1-03 向量校验 | 10 个固定向量通过独立组合数复核，覆盖普通、零目标、零抽数、抽完、多目标、预算和非法输入 |
| 2026-08-05 | V1-04 工具链与识别决策 | 官方来源、精确版本、CloudBase 运行时、`qwen3.5-flash` 主识别与 `qwen3.5-ocr` 低置信补识、超时、费用和图片边界已记录；版本组合安装成功，API Key 未写入仓库 |
| 2026-08-05 | V1-05 workspace 验证 | pnpm 11.9.0 安装 164 个包成功；TypeScript 6.0.3 类型检查与 Vitest 空测试入口通过 |
| 2026-08-05 | V1-05 微信开发者工具 | 项目以真实 AppID 导入成功；模拟器刷新成功；`pages/bootstrap/index.wxml` 与 `.wxss` 编译成功 |
| 2026-08-05 | V1-06 统一质量门 | `pnpm quality` 通过格式、ESLint、类型、测试和全部契约／工作流校验 |
| 2026-08-05 | V1-06 故障注入 | `pnpm quality:prove` 证明故意 TypeScript 错误会被拒绝，清除后完整质量门恢复通过 |
| 2026-08-05 | V1-A 区块回归 | 版面语法、识别、渲染、计算与工具链基线、工作流和代码质量全绿；V1-A 转为 `AWAITING_REVIEW`，V1-B 保持 `LOCKED` |
| 2026-08-05 | V1-A 人工验收 | 用户指示“开始 V1-B”，视为 V1-A 统一验收通过；V1-01—V1-06 全部转为 `COMPLETED` |
| 2026-08-05 | V1-B 启动认知对齐 | 无范围、平台、隐私、核心架构或区块顺序变化；V1-07—V1-17 整组转为 `READY` |
| 2026-08-05 | V1-07 领域模型 | 严格类型检查通过；票池、奖项、目标、计划、预算、结果、稳定错误和三态输入均有类型边界 |
| 2026-08-05 | V1-08 组合数 | `bigint` 组合数通过 0、对称性、C(100,50) 和非法参数测试 |
| 2026-08-05 | V1-09—V1-12 概率与期望 | 单抽、至少一次、超几何分布、多目标指定数量、期望数量和首次命中期望通过固定向量与独立枚举 |
| 2026-08-05 | V1-13—V1-14 金额比较 | 计划／累计／预算／包套／最大可抽数及直接购买现金差通过零价、预算不足、抽完和非整数拒绝测试 |
| 2026-08-05 | V1-15 输入校验 | 可计算、信息不足、存在矛盾三类案例通过；无商家作弊、藏票或风险结论 |
| 2026-08-05 | V1-16 四方案解释 | 抽、包、买、停均含组成项、限制和状态；无排名或推荐分，停止始终可用 |
| 2026-08-05 | V1-17 性质与回归 | 10 个批准向量、约 9,000 组小票池穷举性质检查、500 组确定性随机输入和多目标枚举对照通过 |
| 2026-08-05 | V1-B 区块回归 | `pnpm quality` 全绿：7 个测试文件、22 项测试、类型、Lint、格式、全部契约与工作流校验通过 |
| 2026-08-06 | V1-B 验收反馈 | 用户要求概率陈述之外提供极保守的优化方案，并明确不能把概率结果表达为中奖保证或促抽建议 |
| 2026-08-06 | V1-16A 产品修订批准 | 用户确认采用“用户约束内最少抽数”：无默认门槛、显著失败概率、无解不放宽、停止始终可选、Last 仅包套保证 |
| 2026-08-06 | V1-16A 保守方案验证 | 50% 门槛固定案例返回 3 抽、成功 8/15、失败 7/15；缺约束、预算／抽数／概率无解、零门槛和多目标精确案例通过 |
| 2026-08-06 | V1-16A Last 边界 | 只有规则确认且包套全部余票时返回确定保证与成本；部分抽数概率始终为空，预算可执行／不可执行／未知均有固定结果 |
| 2026-08-06 | V1-17 修订性质测试 | 新增 1,496 组小票池约束方案检查；每个可行结果满足门槛、前一抽数不满足、成功与失败合计为 1 且不越硬限制 |
| 2026-08-06 | V1-B 修订区块回归 | `pnpm quality` 全绿：8 个测试文件、32 项测试、类型、Lint、格式、全部契约与工作流校验通过 |
| 2026-08-06 | V1-B 人工验收 | 用户确认修订后的保守约束方案和计算内核；V1-B 与 V1-07—V1-17（含 V1-16A）全部转为 `COMPLETED` |
| 2026-08-06 | V1-B 收口回归 | `pnpm quality` 全绿：格式、Lint、类型、8 个测试文件／32 项测试和全部契约／工作流校验通过；V1-C 保持 `LOCKED` |
| 2026-08-06 | V1-C 启动认知对齐 | 纯 reducer 足以承载一抽一记；`bigint` 采用版本化十进制字符串持久化；识别 QA 不用未授权真实图片；无范围、平台、隐私或区块顺序变化 |
| 2026-08-06 | V1-18—V1-21 会话验证 | 单奖项选择／更换／清空、连续三轮原子确认、失败不变、最近轮撤销、重复撤销和基线变更拒绝均通过 |
| 2026-08-06 | V1-22—V1-23 存储与兼容 | Storage V1 bigint 往返、V0 迁移、损坏／未来版本回退、写失败保留内存、随包 schema／注册表兼容与失败回退通过 |
| 2026-08-06 | V1-24 微信 Storage | WXML/WXSS 编译通过；模拟器写入后重开与 refresh 均恢复，删除后为空，容量状态正常；console 无 error／exception／fail，smoke key 已清除 |
| 2026-08-06 | V1-25 识别 QA 与复制 | 5 个项目自建结构化案例覆盖 A—Z／OTHER、手写价格、缺边、低置信和券位矛盾；不声明真实准确率；复制会话生成新身份且不继承历史／花费 |
| 2026-08-06 | V1-C 区块回归 | `pnpm quality` 全绿：13 个测试文件、53 项测试、格式、Lint、类型、全部契约和工作流校验通过 |
| 2026-08-06 | V1-C 人工验收 | 用户确认一抽一记、最近轮撤销、复制边界、Storage 恢复／删除／容量、未知版面回退及 QA 准确率边界；V1-C 与 V1-18—V1-25 全部转为 `COMPLETED` |
| 2026-08-06 | V1-D 启动认知对齐 | 无范围、平台、隐私、核心架构或区块顺序变化；V1-26—V1-30 转为开放工作集，V1-26 开始执行 |
| 2026-08-06 | V1-D UI 架构修订 | 用户批准所有 UI 任务改为 Next.js 网页；Figma 不再是交付门禁，V1-26 改为可运行 HTML 低保真；正式产品、技术、计划和架构文件已联动 |
| 2026-08-06 | image2 视觉工作流认知 | 用户确认 HTML 布局先作为 image2 的视觉探索输入，生成结果再转译回真实网页组件；仅完成 V1-29 的计划与边界同步，未执行 image2 视觉设计或验收 |

2026-08-09 V1-29 视觉基线重置与原始壳托管：用户指定 `/Users/cunfu/Downloads/网页 ui.html` 为唯一网页壳，要求原样迁入 Next.js 并将既有 ICHI 路由、算法和交互接到其对应控件。此前 V1-29 的 image2、深色票券、颜色与动效描述均被替代，不得再作为实现或验收标准。用户进一步拒绝任何手写 JSX/CSS 的视觉近似：`page.tsx` 现仅挂载原始网页 iframe，`api/v1-29-source` 直接托管该 HTML，其字体、字号、图标、字符样式、间距、布局和动效均使用原文件；该网页已有的 Tailwind、Phosphor、Font Awesome 与 Google Font 作为本轮用户批准的保真运行时输入。原有 ICHI 功能绑定须在此原壳控件上逐项完成，不能再通过 `light-shell.tsx` 改写页面外观。V1-29 仍为 `IN_PROGRESS`，等待用户对原始壳验收后继续绑定功能，V1-E/V2 继续锁定。

2026-08-09 V1-29 原始壳视觉人工确认与功能桥接完成：用户确认原始 `网页 ui.html` 的视觉方向可继续。已在不改变其 HTML、字体、图标、字符样式、间距或动效的前提下完成功能桥接：iframe 内部 hash 与 ICHI URL 同步，源工作台抽取／撤销状态按本机会话缓存恢复，抽取后保留三位小数概率、累计金额和情境提醒文案；识别、核对、生成、目标、工作台、局面可能性、记录、收手提交和“我的”入口均由原壳控件承载。原始壳页面／路由／控件浏览器回归、网页 TypeScript、ESLint、67 项 Vitest、格式、工作流与差异检查通过；V1-29 变更为 `AWAITING_REVIEW`，等待用户最终人工验收，V1-D 不收口。

2026-08-08 V1-D 手机 UI 与基础层自动验证：移动端隐藏桌面页面索引，使用全宽 App 壳、紧凑顶部状态栏和带安全区的 `识别／好版地图／我的` 底部导航；一番赏版面在 390px 下移除桌面外框，大赏保持两列方形区块，中赏／小赏保持独占横向票条并允许票位换行。新增 `apps/web/app/tokens.css` 与 `apps/web/app/ui/`，组件覆盖按钮、状态链接、奖级格、票位、状态提示、模态层和底部导航；新增 `docs/design/v1-29-mobile-visual-direction.md` 记录 HTML → image2 → React/HTML/CSS 回译边界。Prettier、ESLint、TypeScript、12 项 Playwright、工作流校验和差异检查通过；390px ego-browser DOM 检查确认页面索引隐藏、导航可见、版面不溢出。该记录为历史低保真基础层记录，已不再代表 V1-29 的视觉基线；V1-D 仍保持 `IN_PROGRESS`，V1-E/V2 继续锁定。

2026-08-08 V1-26 拍摄版面修订：手机端改为相机式全屏布局，上部为纵向版面取景区，下部为深色控制区，仅保留圆形拍摄与圆形返回按钮；取景提示保留在取景区内，仍不请求真实相机权限。Next.js 构建、12 项 Playwright、390px ego-browser 视口 DOM 检查和拍摄／返回路径验证通过；V1-26 标记 `AWAITING_REVIEW`，V1-D 保持 `IN_PROGRESS`，等待本轮人工验收后继续接受后续修改。
| 2026-08-06 | V1-26 自动验证 | Next.js build、TypeScript、ESLint、Prettier、Playwright（26 状态、主流程／停止路径、390px 溢出）和 ego-browser 桌面／手机检查通过；V1-26 转为 `AWAITING_REVIEW` |
| 2026-08-07 | V1-26 文案与导航修订 | 用户确认文案改为克制、有一番赏语境的表达，并要求手机端固定 `识别／好版地图／我的` 三入口；当时地图仅作 V2 占位，我的保持无真实账号的本机记录与设置入口 |
| 2026-08-07 | V1-26 修订验证 | Next.js build、TypeScript、ESLint、Prettier、Playwright（三入口、主流程、停止路径、窄屏无横向溢出）、Vitest 53 项和全部既有契约校验通过；V1-26 回到 `AWAITING_REVIEW` |
| 2026-08-07 | V1-26 工作台修订 | 用户确认一番赏版面为主工作台；导入直达识别，目标奖多选、票位／概率／Last 成本、版面内抽取／撤销／记录浮层取代多页中间流程；复制页移除，本地记录归入“我的 → 账号管理”；自动验证进行中 |
| 2026-08-07 | V2 共享取证前端先行 | 用户确认先做可验收的网页前端流程，再接入受控相机、OCR、位置、证据包、审核和好版地图；新增 V1-30A／V2-00 并修订 V2-B，未实现真实上传 |
| 2026-08-05 | 开发步幅调整 | 用户明确将门禁从单 step 调整为区块；V1-A 未完成 step 一并解锁，V1-B 保持锁定，正式文件按区块目的联动开放 |
| 2026-08-05 | 区块门禁工作流校验 | `node --check scripts/validate-workflow.mjs`、`node scripts/validate-workflow.mjs` 和 `git diff --check` 通过；8 个正式入口及活动区块状态联动一致 |

2026-08-10 V1-29 收手分支与可恢复草稿：共享选择卡按视觉中心规则下移，保留“愿意并拍摄赏票”，将原次按钮改为“继续抽赏”，并增加灰色虚线下划线操作“暂不分享并退出”。继续路径仅关闭卡片并留在当前一番赏版面；退出路径按稳定 `boardId` 把版面票位、抽取历史和累计花费覆盖写入版本化本机草稿，再返回识别首页。识别首页移除泛化的“只保存在这台设备”说明卡，收窄固定导入卡，并在下方提供独立滚动的抽赏草稿区；点击草稿可恢复原版面，同一版面反复暂存只保留一条。原始 `网页 ui.html` 的外部样式与图标加载顺序保持不变，功能桥只在源样式和 ICHI 状态都就绪后暴露可操作状态。格式、ESLint、TypeScript、17 个 Vitest 文件／67 项测试、契约／工作流校验、Next.js 生产构建、ego-browser 页面几何检查与 Playwright 16／16 浏览器回归通过。V1-29 继续保持 `IN_PROGRESS`，等待用户继续视觉与交互验收；V1-D 不收口。

2026-08-10 V1-29 页面崩坏与路由状态回归修复：修正流程页 `display` 规则覆盖 `hidden` 导致识别结果、目标奖、地图等多个页面同时堆叠的问题，规定 `#pages-container` 任意时刻只显示一个页面；父层只接收当前 iframe 的路由消息，并使用同一 iframe 实例同步地址栏，消除切换时导入页闪现。识别流程现保存最近稳定页面和实际滚动位置，地图／我的返回后恢复原处；相机和识别加载等临时页按规则回到导入页。同步修正“我的”二级页 `52px` 页头安全区、统一阻塞式模态、A—F 识别／目标双列卡、双列紧凑赏票、逐抽情境提醒和本地记录／贡献派生分层。`V1-29 UI Design Tokens` 已记录页面互斥、稳定路由、阻塞模态、固定动作宽度与状态恢复规则。格式、ESLint、TypeScript、17 个 Vitest 文件／67 项测试、全部契约／工作流校验、Next.js 生产构建、ego-browser 397×697 单页几何检查和 Playwright 21／21 完整回归通过；生产构建后重启开发服务器的复跑为 20 项直接通过、1 项首次页面载入偶发超时，单独重跑该项 5.4 秒通过。V1-29 继续保持 `IN_PROGRESS`，等待用户视觉与交互复验；V1-D 不收口。

2026-08-11 V1-29 工作台固定区渐隐修订：顶部渐隐遮罩改为覆盖顶部安全区与状态栏固定区域（`y=0..top safe area + draw status height`），不再落入状态栏下方的赏票滚动区；底部遮罩仍从导航上沿向下覆盖导航与底部安全距离。两段遮罩均为 `pointer-events: none`，固定状态栏、导航和赏票操作不受拦截。新增窄屏 Playwright 几何回归通过；V1-29 与 V1-D 继续保持 `IN_PROGRESS`，等待人工视觉验收。
2026-08-11 V1-29 顶部遮罩增强：顶部遮罩在视口 `y=0` 处改为完全不透明，前 16px 保持实体背景，随后在顶部安全区与状态栏范围内逐步退回透明；遮罩仍不延伸到状态栏下方，底部导航渐隐保持不变。浏览器几何检查确认顶部 `y=0..132`、`pointer-events: none`，窄屏 Playwright 回归通过；V1-29 与 V1-D 继续保持 `IN_PROGRESS`，等待人工视觉验收。
2026-08-11 V1-29 大赏撕拉票颜色对齐：移除 A/B/C 撕拉层的香槟金背景和棕色文字覆盖，统一恢复原始 D/E/F 的黑色 `#0a0a0a` 撕拉层与原文字色；仅 A/B/C 奖级字母使用 `#e5cb8d` 金色强调。新增颜色回归通过；V1-29 与 V1-D 继续保持 `IN_PROGRESS`，等待人工视觉验收。
2026-08-11 V1-29 “我的”子页面页头层级调整：账号管理、本地记录、我的贡献、提醒设置和隐私与数据统一隐藏灰色说明副标题，将主标题设为黑色 `24px` 粗体；返回按钮和页头安全区保持原规则。Playwright 与 ego-browser 397×697 几何／样式检查通过；V1-29 与 V1-D 继续保持 `IN_PROGRESS`，等待人工视觉验收。

2026-08-11 V1-29 共享取证拍摄页布局修订：将 `modal-share-2` 统一为灰色全页背景并移除重复顶部标题栏；返回箭头固定在顶部安全区，取景框下移至箭头下缘之后。拍摄赏票操作紧接取景框，新增同一操作行的圆形“重拍赏票”按钮；地点与备注及确认勾选移动到拍摄操作之后，保持取景框—拍摄—备注的纵向信息层级。新增 Playwright 几何回归，验证三个区域顺序、返回安全区和重拍入口；23 项 V1-26 回归、TypeScript、ESLint、工作流和差异检查通过。V1-29 与 V1-D 继续保持 `IN_PROGRESS`，等待人工视觉验收。

2026-08-11 V1-29 拍摄操作颜色对齐：将“已拍摄／拍摄赏票”和“重拍赏票”统一改为既有 `#e9ebef` 灰色控件，文字／图标使用 `#71717a`，移除粉紫外缘与内阴影；新增颜色回归断言，目标流程测试、TypeScript、ESLint、工作流和差异检查通过。V1-29 与 V1-D 继续保持 `IN_PROGRESS`，等待人工视觉验收。

2026-08-11 V1-29 撕拉票方向与大赏字母修订：撕揭拖动改为 `left center` 支点、正向 `rotateY` 与正向 `translateZ`，卷曲朝屏幕外；完成撕离时加入 `translateZ(150px)` 并反转旋转方向，使票向屏幕外飞出。大赏 A/B/C 字母从金色改为高饱和玫红—紫色渐变。新增 Playwright 动效方向与渐变文字断言，相关回归通过；V1-29 与 V1-D 继续保持 `IN_PROGRESS`，等待人工视觉验收。

2026-08-12 V1-29 撕拉票空间方向纠正：浏览器实测确认此前 `left center + rotateY(+33°)` 会把撕起部分压向负 Z 轴，且完成阶段的 `rotateY(+95°) + scale(.72)` 形成向屏幕后方缩小的观感。本轮将拖动阶段改为负向 `rotateY`、更强的正向 `translateZ` 与轻微放大；完成阶段改为 `translateZ(280px) + rotateY(-108deg) + scale(1.16)`，使卷曲和飞离都朝观察者方向。A/B/C 字母同步增加高亮白色扫光、240% 渐变流动和双层玫红／紫色辉光。新增空间方向和闪耀效果回归；V1-29 与 V1-D 继续保持 `IN_PROGRESS`，等待人工视觉验收。

2026-08-12 V1-29 共享取证提交门禁与操作组修订：“拍摄赏票”主按钮收窄为 `148–176px` 并与 `52px` 重拍按钮组成水平居中的紧凑操作组。确认地点与备注按钮改为条件启用：只有拍摄状态完成且备注非空时，才从灰色原生禁用态切换为黑底白勾和玫红／紫色双侧辉光；重拍会清除拍摄状态并立即再次禁用确认。新增未拍摄、仅填写、拍摄加填写、重拍四种状态以及操作组居中／宽度回归；V1-29 与 V1-D 继续保持 `IN_PROGRESS`，等待人工视觉验收。

2026-08-11 V1-29 固定记录页头与草稿删除：本地记录、我的贡献及其余“我的”二级页使用固定返回／标题页头与独立滚动正文；本地记录统计栏固定显示全部、已上传和未上传计数。识别首页草稿和本地记录中的 `unverified + not-uploaded` 草稿共用 Swipe-to-Delete：左滑揭示 `72px` 黑底白色垃圾桶，按同一 `boardId` 删除并同步刷新两处列表；已核对或已上传记录不生成删除入口。新增固定页头和双入口真实指针左滑回归。

2026-08-11 V1-29 撕拉分层、白字与轻提醒对位：用户提供的 HEIC 中间帧确认旧实现只是单层裁切，无法显示向观察者隆起的卷边；现改为未揭表面与同内容翻片双层 Page Curl，翻片以动态撕开边为支点沿正 Z 轴卷起，完成后以 `translateZ(360px) + rotateY(122deg) + scale(1.2)` 向观察者飞离。A—F 奖级字母统一回归普通白字，无渐变、彩金、辉光或字母动画。轻提醒保持水平居中，并将垂直中心与顶部状态栏中心对齐。25 项 Playwright、TypeScript、ESLint、Next.js 生产构建、工作流和差异检查通过；构建后开发服务器已重启，`start`／`draw` 均为 HTTP 200。按用户最新规则，后续视觉由用户人工检查，Agent 不再主动运行 ego-browser。V1-29 与 V1-D 继续保持 `IN_PROGRESS`，等待人工验收。

2026-08-11 V1-29 卷边有色高光移除：用户提供的 JPG 中间帧确认双层 Page Curl 物理方向已正确，但翻片边界的黄色渐变伪元素形成不需要的模糊色带。仅删除 `.ichi-peel-flap::after` 边缘高光，不修改拖动阶段的动态撕开边、正向 `rotateY`／正 Z 位移、遮罩、阴影或完成飞离参数；新增伪元素背景必须为 `none` 的回归断言。V1-29 与 V1-D 继续保持 `IN_PROGRESS`，等待用户人工视觉验收。

2026-08-11 V1-D 人工验收与 V1-E 解锁：用户明确确认 V1-29 人工验收完成并要求解锁 V1-E，该指令作为 V1-D 统一区块验收门通过，V1-26—V1-30F 全部转为 `COMPLETED`。区块认知对齐发现旧 V1-E 仍包含已从网页主流程移除的预算／计划抽数／四方案比较，属于不改变范围、平台、隐私、核心架构或区块顺序的相邻区块局部漂移；已将 V1-31—V1-39 改写为对 `网页 ui.html`、`V1-29 UI Design Tokens` 与完整 Next.js 批准页面的一比一小程序照搬，覆盖识别确认、目标多选、一番赏 Page Curl 工作台、局面可能性、收手／本机草稿、50 抽撤销与恢复、我的／记录／隐私及异常状态，并整组转为 `READY`。V1-E 成为唯一活动区块，V1-F 保持 `LOCKED`。

2026-08-11 V1-31 小程序草稿入口与安全区视觉修订：根据用户验收反馈，识别首页只在自身页面试行微信右上角胶囊安全区，主内容上沿改为 `wx.getMenuButtonBoundingClientRect().bottom + 12px`，底部导航利用原有底部冗余下移 `20px`；本轮不把该偏移扩散到地图、“我的”或工作台，等待用户先做视觉检查。草稿左滑层改为透明闭合背景与内缩 `70px` 黑色删除面，闭合时不渲染黑边或淡色垃圾桶，展开时使用本地化 Phosphor 白色垃圾桶图标；并抑制滑动结束后的误点击。删除“找到上次的票池记录／本机抽赏草稿”中转页，草稿卡片与历史 `resume` 存储值均直接进入同一 `boardId` 的 `draw` 工作台；首屏从本机草稿构造余票／包套顶栏、双列赏票、原版图标快捷操作和决定收手按钮。WXML/WXSS 编译、21 个测试文件／84 项测试、TypeScript、ESLint、工作流校验和 diff 检查通过；微信模拟器确认 390×844 下菜单胶囊底部为 `83px`、开始页上沿为 `95px`，闭合／展开删除层均正确，草稿点击与地图往返后均直接恢复 `automation-board-v1-31` 的 `draw` 状态。V1-31 保持 `IN_PROGRESS`，等待用户检查本次首页安全区试行后再决定是否推广至全部页面。

2026-08-11 V1-31 全局胶囊安全区与删除层覆盖确认：用户确认按开始页试行方式把整体下移推广到全部页面。共享页面壳移除 `startTopSafePx` 与 `.app-shell--start` 特例，统一以菜单胶囊底部加 `12px` 计算 `topSafePx`，并在全部页面使用设备底部安全区作为导航下沿；后续 V1-E 页面也必须继承该规则。模拟器 390×844 下胶囊底部为 `83px`，首页 Hero、地图卡、“我的”资料区、本地记录页头和工作台固定状态栏的上沿均为 `95px`，底部导航上沿均为 `746px`。根据新增视觉反馈，删除黑层由仅可见 `70px` 扩展为 `102px`，其中 `32px` 藏在左滑后白色卡片的右圆角下方；垃圾桶增加 `32px` 左内边距，继续居中于实际露出的操作区。WXML/WXSS 编译、21 个测试文件／84 项测试、TypeScript、ESLint、工作流校验和 diff 检查通过；V1-31 保持 `IN_PROGRESS`，等待继续人工视觉验收。

2026-08-11 V1-31 草稿删除操作点击外部复位：共享 `app-shell` 新增冒泡点击处理器；任一草稿左滑展开后，下一次独立点击无论落在页面空白、普通按钮或底部标签，都会把全部草稿 `swipeX` 归零并重新遮住垃圾桶。左滑移动超过 `8px` 后保留手势抑制标记到下一事件循环，草稿自身点击和页面壳同轮冒泡均不会让删除层一闪即收。微信模拟器验证构造的左滑结束同轮复位请求保持 `-72px`，随后点击草稿区空白、页面空白或地图标签均复位为 `0px`；按钮原行为仍执行，地图标签正常进入 `map-preview`。WXML/WXSS 编译、21 个测试文件／85 项测试、TypeScript、ESLint、工作流和差异检查通过；V1-31 保持 `IN_PROGRESS`。

## 下一步

V1-F 已由用户明确启动并处于 `IN_PROGRESS`。当前先完成仓库内需求、技术设计、任务拆分、可部署代码与自动验证；在用户批准精确变更清单前不向 CloudBase 写入集合、索引、权限、函数、触发器或密钥。V2 继续保持锁定，直至 V1-F 完成并通过 V1-48 决策门。
2026-08-18 正式小程序与 CloudBase 开发环境已建立绑定：`project.config.json` 使用正式 AppID `wx4e40b1657ca4563d`，`apps/client/miniprogram/app.ts` 的 `wx.cloud.init` 显式使用环境 `cloud1-d7gxqfwv783a1f131`。该步骤只完成客户端环境选择；云函数部署、数据库集合／权限规则、百炼凭据和真实账号验证仍未执行。
2026-08-18 V1-F CloudBase 仓库先行规格启动：用户明确要求先在项目内规整全部云端逻辑，分别形成面向人的说明和可部署代码，通过本地验证后再整体部署 CloudBase，不在控制台即兴编写。已将 `specs/v1-cloudbase-backend/requirements.md` 重写为中文，并新增 `design.md` 与 `tasks.md`，覆盖内部 `accountId`／公开 `ICHI ID`、`ICHI-001` 创始人保留号、特殊号审计、账号、微信身份、每日配额、识别任务、观察候选、抽赏提交、六位码、删除、审计、集合、索引、函数和整体部署顺序。用户最新决定取代先前压缩照片方案：版面与赏票照片只用于当次识别，绝不进入 CloudBase 数据库、云存储、日志或备份；直接上传保存用户确认的初始结构化快照，辅助抽赏另外保存抽赏事实并按奖级确定性相减生成最终快照。A1/A2 等归并到基础奖级，SP1—SP4 保持独立，冲突与不守恒必须人工确认。正式设计、技术栈、实施计划和架构已同步；CloudBase 环境仍为零集合、零函数、零文件，等待用户审阅规格后继续本地实现。
2026-08-18 V1-F 后端先行顺序批准：用户确认先完成并部署 CloudBase 开发环境后端，再补小程序前端账号与配额界面。微信身份由小程序云函数可信上下文静默建立；点击头像只用于建立／完善昵称、头像等可选资料，动态 ICHI ID 和每日 5 次进度环随后接入，资料字段不参与鉴权。新增权威只读配额摘要接口和稳定 `QUOTA_EXHAUSTED` 错误码；开发环境后端独立部署／验证 V1-43J 成为 V1-43G 前置，真实 OpenID、`ICHI-001`、位置／相机与模型凭据仍保留为人工门。
2026-08-18 V1-F CloudBase 第一批本地后端完成：新增 `BoardSnapshot`／函数信封 Schema、13 个 ADMINONLY NoSQL 集合和 17 个索引清单、无公共集合／无业务图片存储声明、非秘密识别设置、ICHI 保留号策略、可信微信身份 HMAC、内部账号、普通／特殊 ICHI ID、北京时间每日 5 次配额摘要与事务预占、确定性观察记录 ID、六位记录码、A1—Z 编号款式归并、SP1—SP4 独立、位置／无图片字段校验、结构化观察确认、抽赏差量、本人记录／删除和 15 个独立事件函数生成器。面向人的说明位于 `docs/delivery/v1-cloudbase-backend-guide.md`。定向 3 文件 15 项、Node 语法、ESLint、部署产物和工作流校验通过。CloudBase 只读核对确认目标环境为正式 AppID 绑定的上海 NoSQL 个人版，状态正常、0 集合、0 函数、0 文件；环境有效期显示至 2027-02-18，Nodejs24.11 官方仍标记公测。当前没有执行云端写入；旧识别代理、赏票识别、真实维护处理、密钥、真机账号和前端接入仍未完成。
2026-08-18 V1-F CloudBase 第一批写入部分完成并安全停止：用户明确批准写入并接受 Nodejs24.11 公测后，目标开发环境成功创建 13 个集合、17 个业务索引，逐项应用 ADMINONLY 权限，并写入 `systemSettings/recognition` 与 `ichiIds/ICHI-001` 两条非秘密种子；只读复核为 13 集合、2 文档、0 文件。首个 `bootstrap-account` 创建前，实际 CloudBase 函数接口返回“不支持 Nodejs24.11”，只接受 Nodejs20.19／18.15 等运行时；因此函数、触发器和秘密环境变量均未创建，其余部署立即停止。下一步必须由用户批准把正式技术基线与函数包 engines 改为 CloudBase 推荐且实测支持的 Nodejs20.19，或选择等待 Nodejs24.11 管控面开放。
2026-08-18 V1-F CloudBase 函数运行时切换获批：用户明确批准把目标环境事件云函数从无法创建的 Nodejs24.11 切换到 CloudBase 推荐且实测支持的 Nodejs20.19，并继续第一批写入。该变化只作用于 `services/cloudbase/` 函数包和部署清单；根仓库、CI 与本地开发仍保持 Node 24.11。正式技术栈、生成器、既有识别函数包 engines、部署说明和架构职责已同步，函数部署前重新执行自动验证。
2026-08-18 V1-F CloudBase Nodejs20.19 第一批部署完成：目标开发环境现有 13 个 ADMINONLY 集合、17 个业务索引、2 条非秘密种子、15 个 Active Nodejs20.19 事件函数、4 个定时触发器和 0 个云存储文件；未创建 V2 公共集合、公共快照或发布接口。部署后管理详情响应意外回显环境变量值，已立即轮换全部身份与维护密钥，并停止使用会展示环境变量的详情／触发器读取路径。首次维护黑盒调用定位到共享 `nowIso` 把毫秒时间戳误作函数调用的 TypeError；修复后补充固定时钟回归和无维护令牌失败闭合测试，4 个维护入口真实调用均成功，`prepare-v2-backfill` 返回 `publicWrites=0`。缺少可信微信上下文的 `bootstrap-account` 返回 `TRUSTED_IDENTITY_UNAVAILABLE`，证明管理端伪造身份失败闭合。V1-43J 保持 `IN_PROGRESS`：资源层与维护层已完成，真实 OPENID 下的账号、配额、观察、本人隔离和删除链路仍需小程序前端接入与真机验收。
2026-08-18 V1-F CloudBase 第一批部署自动收口：CloudBase 专项语义审查确认原生小程序身份使用 `getWXContext`、动态环境使用 `DYNAMIC_CURRENT_ENV`，函数响应不回显 event/context/headers/process.env，服务器端诊断只记录动作、错误码、类型和栈帧；密钥扫描未发现真实凭据进入仓库。整库 32 文件／181 项 Vitest、Prettier、ESLint、根与 Web TypeScript、全部契约／工作流、Next.js 生产构建、CloudBase 13 集合／15 函数部署产物、V1-F 发布校验和差异检查全部通过。Next.js 构建仅出现预期的 Node 引擎提示：根开发环境保持 Node 24，而 CloudBase 函数包刻意锁定 Nodejs20.19。V1-43G 前端接入现在可开始，但 V1-43J 的真实微信身份业务链仍等待同一前端与真机验证。
2026-08-18 V1-F 首个真实微信账号建立：正式小程序通过 `bootstrap-account` 的可信微信上下文成功建立云端账号，初始公开号为 `ICHI-KM3QT`，未向客户端暴露 OPENID 或内部 `accountId`。管理端按该公开号唯一定位私有账号，确认环境中不存在其他有效 founder 后写入唯一 `founder` 角色及 `role.granted` 审计；内部账号标识未写入文档说明或对话结果。下一步由同一微信调用已部署的 `assign-special-ichi-id`，把规范展示号改为保留号 `ICHI-001`，旧号只降为 alias，账号、配额与记录归属不变。
2026-08-19 V1-F 创始人账号真实验收：同一正式微信身份通过已部署的 `assign-special-ichi-id` 成功把规范展示号从 `ICHI-KM3QT` 改为 `ICHI-001`。服务端复核确认 profile 规范号为 `ICHI-001`、当前登记为 active、旧号为 alias、全环境只有一个有效 founder、`ichi_id.assigned` 审计存在，并且五处私有归属指向同一内部账号；复核结果未输出内部 `accountId`。创始人首次登录与保留号领取人工门完成，V1-43J 仍等待配额、观察、本人隔离和删除的真实身份链路验收。

2026-08-19 V1-F 小程序账号／配额／位置第一段接入：用户在正式微信上下文真实确认 `get-my-profile` 返回 `ICHI-001`，`get-quota-status` 返回北京时间当日 `5/5`。新增 `cloud-account` 适配器，小程序“我的”动态显示昵称与规范 ICHI ID，导入 Hero 使用服务端 `used + reserved` 绘制每日 5 次进度环；新版面识别按账号、额度、GCJ-02 位置顺序门禁，额度耗尽或位置拒绝均不进入相机且不在客户端扣次，已有本机草稿继续可用。入口与记录术语改为“提交版面线索／我的记录／我的版面线索”，记录卡开始使用六态单一标签；新增 `cloud-records` 适配器，经本人云函数读取／删除规范记录并按 `boardId` 避免与 Storage 重复，不接触数据库或所有者字段。定向 6 文件／67 项及首轮整库 33 文件／187 项测试通过；CloudBase 部署校验、V1-F 校验、契约、工作流和 Web 构建通过。V1-43G 转为 `IN_PROGRESS`，仍待配额预占／识别任务／确认保存全链路、真机位置声明与视觉验收。

2026-08-19 V1-F 识别任务客户端边界预接：新增 `cloud-recognition-task`，固定 `reserve-recognition/get-recognition-job/finalize-board-observation` 的调用形状，并只允许把全部经用户确认且守恒的 A—Z／SP1—SP4 字段转换为 `board-snapshot-1.0.0`；适配器请求不包含所有者或图片持久化字段。旧 `recognize-board` 仍是 `qwen3.5-flash + 可选 qwen3.5-ocr` 双调用实现，和已批准的 rc1 单模型候选不一致，因此本轮没有把页面切到真实配额预占，避免形成无法由旧代理闭合的预占任务。下一步必须先完成人工提示／Schema 批准、百炼密钥配置和新代理部署，再启用页面编排。

2026-08-19 V1-F 账号／配额前端段自动收口：正式微信返回再次确认 `ICHI-001`、默认资料状态和北京时间每日 5 次权威配额；整库 35 文件／192 项 Vitest、ESLint、TypeScript、Prettier 与故障注入质量门通过。网页批准基线连续运行完成 24 项后开发服务器退出，未执行到断言的最后 2 项隔离复跑均通过；Next.js 生产构建、版面／识别／渲染契约、CloudBase 13 集合／15 函数部署产物、V1-F 预检、工作流和差异检查通过，小程序源码为 620354 bytes。发布校验已移除旧 `qwen3.5-flash + qwen3.5-ocr` 双模型作为成功条件，改为校验 `qwen3.6-flash-2026-04-16` rc1 单模型机器协议；旧代理仍未接入页面，V1-F 保持 `IN_PROGRESS`，等待用户批准机器协议、配置百炼凭据后迁移代理并完成真实全链路。

2026-08-19 V1-F 票位序号辅助计数补强：rc1 机器提示与确定性策略明确把贴票边界后的首个空位“第几张”作为第二证据源；只有编号起点、编号方向、槽位对齐、全部中间槽位和连续覆盖边界都可见时，才用边界编号与起始编号的序数距离复核已贴张数（明确从 1 开始时为 `N - 1`）。该结果不能独立成为最终计数，也不能覆盖冲突的逐槽 `open／covered／unknown` 数组；跳贴、歪斜跨槽、遮挡或仅看见一个编号继续进入人工校正。

2026-08-19 V1-F 千问 rc1 协议批准与代理迁移：用户明确批准 `ichi-board-vlm-1.0.0-rc1` 的固定提示、严格返回 Schema 和确定性策略。仓库 `recognize-board` 已迁移为单次 `qwen3.6-flash-2026-04-16` 整版多模态请求，移除旧 `qwen3.5-flash + qwen3.5-ocr` 二次调用、Sharp 裁片与 OCR 环境变量；服务端严格拒绝 Schema 外字段，复算主版面分数并阻止目标版面外证据串入，确定性选择 IP／单抽价格，按多个票区聚合规范赏级并在图例不足时转 unknown。CloudBase 构建现生成 15 个基础函数和 1 个携带 rc1 机器协议的独立识别函数；暂定客户端／上游超时为 `25s／18s`、输出上限 `12000` tokens，等待黄金样本 p95 最终锁定。整库 35 文件／191 项、Lint、TypeScript、契约、Next.js 生产构建、CloudBase 13 集合／16 函数部署包、620355-byte V1-F 预检、工作流与差异检查通过。CloudBase 专项审查确认无数据库／对象存储写入、无图片／提示日志、无 event／context／headers／环境变量回显，密钥只用于服务器端 Authorization。真实百炼凭据、函数部署与授权黄金样本仍是下一人工门；页面尚未启用配额预占。
2026-08-19 V1-F 真实识别失败闭合修订：用户确认开始使用云端真实识别；小程序已移除开发环境下把失败结果替换为“开发测试版面”及固定票数的静默回退。现在模型未配置、上游失败／超时、响应不合法、低质量要求重拍或网络异常都会进入“无法建立票池”并保留失败原因，固定夹具仅用于自动测试；V1-43G 的真机全链路验证需以真实结果继续。

2026-08-19 V1-F 首次真实识别入口失败修复：CloudBase 私有 `recognitionJobs` 证据显示失败任务始终停在 `reserved`、未进入 `processing`，证明请求在 `recognize-board` 处理器之前被拒绝；客户端此前允许 `10 MiB` Base64，而腾讯云同步事件请求上限为 `6 MB`，高质量相机原图经 Base64 膨胀后可直接触发 `RequestTooLarge`。客户端现以 `5 MiB` 为安全预算，小图保留原始内容，超限时依次尝试长边 `3000px`／质量 `90` 与 `2400px`／质量 `85` 的临时轻压缩；云端入口同步收紧为 `5 MiB`，函数代码已于 `18:02` 部署完成且模拟器已刷新。旧失败任务及其配额预占已精确标记为 `expired/released`，当日 `used` 仍为 `0`。开发测试票池正式废止，正式文档内残留的两处回退描述已清理；下一次真机拍摄将首次进入千问真实调用与严格协议验收。

2026-08-19 V1-F 临时对象识别链路取代 Base64：用户批准改为“原图短暂上传、模型读取短时 URL、识别完即弃”。小程序现先把照片二进制上传到任务绑定的私有 `recognition-temp/{jobId}/`，同步云函数事件只传 `fileID` 与尺寸元数据；低于千问 URL 单图 `20 MiB` 上限保留原图，超限才尝试最长边 `4500px／quality 92` 与 `3600px／quality 90` 两级轻压缩。`recognize-board` 校验文件路径属于本任务，生成短时 URL，以 `max_pixels=8388608` 交给千问，并在成功或失败 `finally` 删除云端对象；客户端同时删除云对象和微信本机临时文件，数据库、日志、审计、备份和长期任务不保存图片引用。35 文件／196 项测试、TypeScript、ESLint、Prettier、CloudBase 13 集合／16 函数部署包、V1-F 预检、全部契约／工作流和 Next.js 生产构建通过。新版函数于 `18:38` 在 `cloud1-d7gxqfwv783a1f131` 更新完成，无图烟测返回新版 `IMAGE_INPUT_INVALID`，`recognition-temp/` 当前为空，开发者工具已重新打开工程。平台核对进一步确认 COS 过期删除最短为 `1` 天且按日异步执行，因此撤销不可落地的“1 小时生命周期”承诺，改为正常链路立即双删、异常孤儿对象使用最短 `1` 天过期删除兜底；CloudBase 客户端存储安全规则和该 COS 规则保留为人工控制台门，完成前 V1-43G、V1-43J 与发布候选继续 `IN_PROGRESS`。

2026-08-19 V1-F 重复识别 `INTERNAL_ERROR` 根因与修复：自动真机调试确认当前包已进入 `reserve-recognition`，但第二次识别在创建任务前返回 `INTERNAL_ERROR`；云端只留下首次已释放配额记录且没有新任务。根因是 CloudBase `doc().get()` 给既有配额附加只读 `_id`，共享运行时随后把整条配额对象通过 `set` 回写，触发系统字段不可改写并被失败信封折叠为 `INTERNAL_ERROR`。共享运行时与独立 `recognize-board` 任务结算读取层现统一剥离 `_id`，并增加回归测试；`reserve-recognition` 与 `recognize-board` 已重新部署到 `cloud1-d7gxqfwv783a1f131`。同时客户端云调用异常改为不泄露平台文本的稳定参考码。定向 4 文件／37 项测试及 TypeScript、CloudBase 13 集合／16 函数部署校验通过；仍需下一次自动真机识别验证模型返回和配额成功提交。

2026-08-19 V1-F CloudBase 部署产物反向核验：启用不额外计费的 CLS 日志后，自动真机调用获得 `reserve-recognition` 平台码 `-501007 / INVALID_PARAM`，且线上下载代码证明此前在仓库根目录配合绝对 `--dir` 的 CLI 更新虽然报告成功，实际仍保留旧 `shared/runtime.js`，因此 `_id` 修复并未上线。现改为分别以生成函数目录作为工作目录部署 `reserve-recognition` 与 `recognize-board`，随后反向下载线上代码并核对 SHA-256；两者均与本地部署产物逐字节一致，线上代码已确认包含 `stripDatabaseMetadata`。失败调用未创建任务、未上传图片、未消耗配额。后续函数更新必须执行“函数目录内部署 + 线上下载哈希核验”，不得仅采信 CLI 成功文案。
2026-08-19 V1-F 首次真实千问调用复盘：真机重试已通过账号、位置、配额预占、临时对象上传和 `recognize-board` 任务抢占，并在约 `2.5s` 后以 `RECOGNITION_PROVIDER_ERROR` 失败；配额自动释放、`used` 保持 `0`，临时图片目录为空，故障已排除 CloudBase 上传、配额和清理链。对照百炼官方接口确认当前请求错误使用 OpenAI `response_format.type=json_schema`，千问兼容接口要求 `json_object`。仓库现改为固定提示后附同版本机器 Schema、提供方只保证 JSON 对象、服务端 AJV 继续执行严格 Schema 接纳；新增脱敏上游错误分类与日志，只记录阶段、HTTP 状态、白名单提供方错误码和响应类型。定向测试通过，等待重建部署并进行下一次真实调用确认。

2026-08-19 V1-F 千问权限对照诊断：兼容请求修复版 `recognize-board` 已从函数目录重新部署，反向下载线上 `index.js` 与本地产物 SHA-256 一致。使用云端同一密钥、同一完整提示／Schema 和阿里云官方公开图片做无用户数据烟测：固定快照 `qwen3.6-flash-2026-04-16` 在业务空间专属端点返回 `403 access_denied`，在 DashScope 端点返回 `403 Model.AccessDenied`；仅把模型名改为该密钥已授权的浮动别名 `qwen3.6-flash` 后立即成功并返回符合严格 Schema 的 `not_target_board`。因此当前唯一阻塞是 API Key／业务空间未授权固定快照，不是 CloudBase、图片、端点、提示、Schema 或代码。保持批准的固定快照基线不静默改模；下一人工选择为在百炼给当前 Key／空间授权该快照，或明确批准改用浮动别名并同步模型治理事实源。

2026-08-19 V1-F 固定快照权限恢复：用户已为当前百炼业务空间授权全部模型；随即使用云端同一 API Key、Workspace 专属北京端点、固定快照 `qwen3.6-flash-2026-04-16`、完整 rc1 提示／Schema 和阿里云官方公开图片复测成功，模型返回 `board-vlm-output-1.0.0-rc1` 且通过服务端严格 Schema，非目标图稳定判为 `not_target_board`。这证明固定快照鉴权、端点、多模态输入、JSON Object 兼容参数、提示内 Schema 与本地校验链全部可工作。尚待用户用真实版面做小程序全链路准确度验收；无需重新打包客户端。

2026-08-19 V1-F 真实版面超时诊断：权限恢复后的两次真机任务均进入 `processing`，分别在约 `19.6s` 与 `20.9s` 以 `RECOGNITION_PROVIDER_TIMEOUT` 失败并释放配额，证明复杂真实版面超过原纸面暂定的 `18s` 上游窗口，而不是再次发生鉴权、上传或 Schema 错误。开发环境 `recognize-board` 实际配置为 Nodejs20.19、`512MB`、`60s`。现把预算调整为千问 `45s`、客户端 `55s`、云函数 `60s`，保持模型先失败闭合并给数据库结算、双端图片清理留下余量；部署清单同步真实 `60s`。该数值仍是黄金样本 p95 前的临时运行基线。

2026-08-19 V1-F 快速协议修订：45 秒版本真机任务仍在约 `48s` 以 `RECOGNITION_PROVIDER_TIMEOUT` 失败，说明不能继续只扩大等待时间。V1 运行提示现去除建票池不用的二维码、法律文字、装饰、说明、奖品媒体、Last／Double Chance 转录，要求 `blocks=[]/issues=[]`，IP 候选最多 2 个，序号只保留判断方向与边界所需的 2—4 个最强标记；视觉输入上限由 `8388608` 降至 `4194304` 像素，最大输出由 `12000` 降至 `8000` tokens。主版面、IP、价格、全部赏级／款式、A1/A2 等归并、SP1—SP4、票区归属、逐槽状态与序号复核仍保留，服务端严格 Schema 和确定性复算不变。

2026-08-19 V1-F 快速协议真实样张烟测：使用用户先前提供的 `2693.JPG`（`1280×1707`、同图多版面）经私有临时对象调用同一固定快照和完整严格 Schema，约 `9.2s` 成功返回 `target_board`，枚举 2 个物理版面候选，返回 5 个赏级并通过 Schema。该测试证明减少非建池区块扫描和冗余序号输出可把同类真实图从超过 45 秒降到约 10 秒级；测试对象随后从 `recognition-temp/diagnostic-v1-f/2693.jpg` 精确删除，云端确认 `deletedCount=1`。准确率仍需用户以实际拍摄版面核对赏级、票区和票位。

2026-08-19 V1-F 千问真实连接与 Token 证据：使用 CloudBase `recognize-board` 当前环境变量向业务空间专属北京 OpenAI 兼容端点发送最小多模态请求，HTTP `200`，响应明确回报模型 `qwen3.6-flash-2026-04-16`、提供方 Request ID 存在、`prompt_tokens=223`、`completion_tokens=6`、`total_tokens=229`，耗时约 `0.8s`。因此 CloudBase 中配置的 API Key／Workspace／固定快照已真实连通千问，不是本地或云端夹具。百炼普通用量聚合为小时级延迟、账单通常分钟级延迟，且免费额度可能抵扣金额；超时中断请求也不能用“客户端未收到 usage”推断未到达模型。快速协议已部署并反向哈希核对，开发者工具已刷新。
2026-08-25 V1-43K 实体赏票真实性核验开发中：新增与 recognize-board 完全分离的 `verify-prize-tickets`、`prize-ticket-verification-v1` Prompt 和 Provider Schema。请求固定 qwen3.7-flash/non-thinking/temperature 0/json_object，只可观察每张物理票；客户端不发送 expected counts、draw history、location note 或任何“通过”提示。CloudBase 只从 authoritative draw events 得 expected，再对 `tickets[]` 做 NFKC/空白/大小写 canonicalization、count 与 exact reconciliation；`VERIFIED/MISMATCH/NEEDS_REVIEW/INVALID_EVIDENCE/PROVIDER_FAILED` 不再折叠。版本键为 recordId+boardId+submissionVersion，旧 completion 返回 SUPERSEDED 且不能回写 newer status。当前 39 项定向测试通过；真实实体赏票照片与 production-equivalent Qwen 调用尚未执行，明确为 REAL PRIZE TICKET IMAGE VALIDATION PENDING；尚未部署 CloudBase。

2026-08-25 V1-43K 生产入口迁移与线上 smoke：调查确认旧 `recognize-draw-tickets` 仓库实现仅承担赏票真实性核验，当前没有客户端调用方或其他不可兼容职责；线上旧壳在迁移前为 Nodejs20.19／`index.main`／60 秒／512 MB／依赖层 v1／`Active/Available`，安全空请求可正常进入 handler。现保留该 CloudBase 函数身份和配置，完整替换旧 expected-tiers／aggregated-counts 协议为当前 `PrizeTicketVerificationProviderV1`；客户端、部署清单及所有 retry／gallery v2 流统一调用 `recognize-draw-tickets`，`verify-prize-tickets` 不再是 active production path。42 项定向测试、296 项全量测试、typecheck、Next.js build、CloudBase build/validate 与 workflow 校验通过。新版已真实部署；线上空请求 RequestId `95cddf01-4ec5-4cd5-b9d5-6ec122682a40` 返回受控 `RECORD_NOT_FOUND`，Duration 881 ms、InvokeResult 0，反向下载源码 hash 与本地部署物一致。确认调用切换和 smoke 后，远端 `verify-prize-tickets` 已删除；函数列表只保留 `recognize-draw-tickets`，状态 `Deployment completed`。真实赏票照片 + production-equivalent Qwen 验证仍为 `REAL PRIZE TICKET IMAGE VALIDATION PENDING`，真机 camera v1／album-save warning／原图重试／gallery v2／卡片恢复入口与 VERIFIED publication gate 仍待用户验收。

2026-08-25 V1-F 识别进度与额度入口体验收口：小程序“正在提取版面”从无限旋转与固定延迟假节点改为四段确定型环形进度；`photo-prepared/request-dispatched/response-received/result-ready` 四个客户端可观察真实事件分别推进到 `15/35/80/100`，阶段内每 `180ms` 平滑增长但封顶于 `14/34/79/99`，未收到下一事件时保持当前呼吸点，不提前显示勾。最终文案为“照片整理完成／版面已送去清点／赏级与余票核算中／正在拼出版面结果”。“进入辅助抽赏／仅上传版面”点击后先通过 `get-quota-status` 只读检查；额度耗尽停留首页并显示“无法建立票池／我知道了”，不请求位置、相机权限、不进入拍摄且不创建 reservation。额度可用才继续既有门禁；冻结照片确认才预占，Provider／Schema／Normalize／本地生成失败仍释放，只有完整可恢复版面落盘并由 finalize 成功才增加 used。最终定向 4 文件 88 项通过；整库在产品代码完成后为 42 文件 298 项通过，随后新增的静态三态渲染断言已由定向套件覆盖；ESLint、TypeScript、Next.js production build、Prettier 与 workflow 校验通过。`recognize-board` Prompt、Provider Schema 和模型配置未改。仍待用户真机检查约 15 秒链路中的环形填充、呼吸点、长等待封顶与两个额度耗尽入口。
2026-08-25 V1-F NIKKE 叠贴计数、Board 一致性与确认关键路径专项：Provider 协议升级为唯一语义 `boardCountStyle + countMode/evidence` v5，Prompt 5.0.1 明确每个 exposed tier tab 与每段 terminal full-length ticket 都是实体已贴票、跨行／跨段合计、剩余标签不是编号空位；CloudBase 独占 numbered-prefix、pasted-plus-remaining、pasted-full、empty、unknown 数学。NIKKE 80/78/2 fixture 已经 Provider AJV → Normalize → RecognitionContract → client parser → immutable snapshot → Board Builder exact 通过，G/H 均 LEFT 1；不守恒 snapshot 以 `BOARD_CONTRACT_MISMATCH` 拒绝。确认后本地构建／持久化完成即显示 draw，网络 finalize 保存为 `pendingFinalization` 后台幂等重试，不阻塞版面、不重调 Qwen／reserve。真实 NIKKE 1080×1440／488154B 在固定 `qwen3.7-flash`、non-thinking、temperature 0、json_object、`max_pixels=6291456` 下实际调用：Prompt 5.0.1 请求 `chatcmpl-d51301b8-f007-9783-b75b-747975e35bcc` 用时 13433ms，AJV 通过，但 raw 仍把 F/G/H/I/J/K 分别读成 `4+1/6+1/7+1/6+1/6+1/7+1`，Normalize 得到 5/4、7/6、8/7、7/6、7/6、8/7，未达到人工 5/5、15/14、18/17、13/13、8/8、14/14；首错明确在模型视觉层，记为 `MODEL VISUAL COUNT LIMITATION`，未写业务特例。定向 10 文件／134 项、整库 44 文件／318 项、ESLint、根/Web TypeScript、全部契约与 workflow、19 函数 CloudBase 构建／校验、V1-F preflight、Next.js production build 与 diff check 通过。`recognize-board` 已部署到开发环境，线上 Nodejs20.19 状态 `Deployment completed`、修改时间 17:36:10；空事件 smoke RequestId `211b6516-d5ab-411f-be75-ab09b0227635` 以 InvokeResult 0／5ms 受控返回 `CONTRACT_VERSION_UNSUPPORTED`，未调用 Provider 或配额事务。Golden 临时 Storage 图片与本地含凭据诊断目录已删除。真机 T0—T5、版面首次渲染与后台 finalize 恢复仍待用户验证，V1-F 准确率门保持 `IN_PROGRESS`。
2026-08-25 V1-F P0 `recognize-board` 普通图片不可用已恢复：线上最近三次真实 `assisted-draw` 均为 failed，最新任务 `09:46:56Z—09:47:08Z` 的持久化错误码是 `RECOGNITION_SCHEMA_INVALID`；客户端实际仍发送 RecognitionContract `1.0.0`，服务端也接受 `1.0.0`，故非 client/server version mismatch。首错确认在 v5 Provider AJV，客户端随后把该 service_error 映射为“识别服务暂时不可用，请稍后重试”。已仅回滚 Provider-facing 生产版本到 `ichi-board-vlm-4.0.3-rc1`／`board-provider-extraction-4.0.0-rc1`，保留 v5 Normalize 兼容入口以及 immutable snapshot、Board Builder、快速确认、pendingFinalization 和配额事务修复。定向 3 文件／54 项、CloudBase build/validate、V1-A/V1-F preflight 通过；`recognize-board` 于 18:04:07 部署完成并反向下载确认线上版本。真实女神异闻录 30 周年 1080×1920／497511B smoke 使用固定 qwen3.7-flash、non-thinking、temperature 0、json_object、6291456 max_pixels：Provider 8087ms、AJV 2ms 通过，Normalize 产出可编辑 RecognitionContract，A—H total/pasted/remaining 与既有 Golden exact，客户端 parser 返回 recognized。临时 Storage 图片已删除；真机重新拍摄进入结果页仍待用户复测。

2026-08-25 V1-43D Simple Semantic Prompt 大减法实验：以 HEAD `f3bcbe2d0fc490f705e87b65ff64d39e1810bbf3` 和原有脏工作树为隔离基线，不触碰生产 v4 指针。新增独立 `ichi-board-vlm-simple-1.0.0-exp`／`board-provider-simple-1.0.0-exp`、实验 Normalize、Golden manifest、测试与 benchmark。六张真实 Golden 均以同一临时 URL、`qwen3.7-flash`、non-thinking、temperature 0、json_object、6291456 max_pixels 各跑 production v4 ×1 与 Simple ×1：Simple JSON/AJV 为 6/6、平均 Provider 5843ms（v4 8880ms），并把空位印刷 A 的 pasted 从错误 1 修为 0；但崩铁 E/F/G/H 从正确 2/2/6/3 退化为 1/1/1/1，世界之外和明日方舟 pasted 也明显退化，NIKKE 仅 F 达到 5/5，G—K 仍错误。结论 `MIXED RESULT`，未触发额外两轮稳定性、Thinking A/B 或生产部署。线上反向下载仍为 v4.0.3/v4.0.0，函数 `Active/Available`，实验临时 Storage 对象为 0；生产准确率门继续 `IN_PROGRESS`。完整 raw/parsed/normalized/usage 报告位于 `artifacts/simple-semantic-experiment/2026-08-25/`。
2026-08-25 V1-43K 赏票相册保存、提交等待态与记录徽标修订：真机反馈确认上一轮把 `saveImageToPhotosAlbum` 移出提交关键路径后，页面可能在相册保存完成前离开，无法保证首次相机原图已经进入用户相册。现恢复为相册保存尝试与 2048px/JPEG 82 预处理、Storage 上传并行，但 `uploadDrawTicketEvidence` 必须等待相册结果后才返回；相册失败仍以 `albumSaveWarning` 进入可恢复 PENDING，不伪装成核验失败。提交中的圆形按钮保持黑底，以真实 WXML 旋转加载指示器替换白色对勾，直到进入“我上传的版面”。“我的记录”的本机／云端卡与“我上传的版面”统一把状态徽标固定在右上角，只有“已上传”使用 `#e014a0` 玫红色，待处理与异常状态保持黑色。定向 4 文件／70 项 Vitest、TypeScript 与工作流校验通过；真机仍需确认相册写入、等待动画、跳转时点和两页徽标最终视觉位置。

2026-08-25 V1-F 云端版面删除确认弹窗回归修复：`pages/home/index.ts` 的 `delete-uploaded-board` 状态、取消／确认处理器和 owner-scoped `delete-my-record` 链仍完整，但对应 WXML 渲染分支曾被整页模板改动覆盖，导致左滑垃圾桶只能设置不可见状态。现恢复标准异常卡弹窗：白色感叹号黑圆、标题“删除版面线索”、明确说明同时从“我上传的版面”和“好版地图”移除、黑底白字删除与灰色取消；按钮直接复用既有处理器，不新增删除入口。定向 UI、交互、客户端适配与 CloudBase 权限／幂等 5 文件／103 项 Vitest 通过。
2026-08-26 V1-43D Frozen Hybrid Direct-Pasted H0 生产迁移完成：继承已全绿的 26/26 Playwright、全仓 Prettier、408/408 Vitest、契约／CloudBase／Next build、五图 parity 与五图 predeploy，不重复消耗 Provider。Resume audit 反向下载确认双栈已部署且默认 v4；随后远程 v4 默认调用、内部授权 Hybrid 三图、配置式 promotion、无 override 的 Hybrid 三图、真实 `hybrid_semantic → v4 → hybrid_semantic` rollback 往返全部通过。世界之外远程 raw 4 SP→normalized SP1—SP4；Provider 成功后 quota 仍为 used 0／reservation reserved，提交语义未变。生产最终 `BOARD_RECOGNITION_MODE=hybrid_semantic`，Frozen Prompt SHA-256 为 `0b4e572378fad8e445f63c6b67997415a1099a0c4ae4d968a6182b545b22226b`，RecognitionContract 1.0.0；部署期内部 smoke token 已删除，未授权 override 在 1ms 内于 Provider／quota 前拒绝，删令牌后的默认 Hybrid + SP smoke 再次通过。v4 源码／Prompt／Schema／adapter 保留为 `LEGACY_V4_ROLLBACK`，客户端与生产数据零迁移；真实微信设备本轮未执行，既有 Web/E2E 相机→快门→冻结→确认链 26/26 作为非真机证据。
2026-08-26 V1-F Required Field Glow UI 几何修复：确认原 `.action-glow` 是为 288×52 胶囊设计的左右双 radial 局部光源，缩放到 82×38／动态半卡宽输入后透明中段会露出 `.light-capsule` 近白背景。Recognition Result 现使用持久 `.recognition-input-glow`：同源 `#e014a0`／`#5528c2`、2px blur、0.85 opacity 与强度，独立 linear rounded-rectangle + dual shadow 闭合 renderer；validation class 直接切换 opacity/visibility，无 transition、timer、白色 mask、布局占位或点击拦截。原 Assist CTA `.action-glow` 声明保持不变，识别数据／validator／H0 均未修改。定向 4 文件／92 项 Vitest、根／Web TypeScript、ESLint、本轮文件 Prettier 与 Playwright 26/26 通过；微信开发者工具与真机未运行，闭合光晕最终视觉仍需用户真机确认。

2026-08-26 V1-F Remaining Observation R0 独立实验：Frozen H0 source／production copy SHA-256 均保持 `0b4e572378fad8e445f63c6b67997415a1099a0c4ae4d968a6182b545b22226b`，线上只读确认 `BOARD_RECOGNITION_MODE=hybrid_semantic`，未部署、未改配置、客户端、RecognitionContract、quota 或 Board Builder。新增纯 `rawLabel/openOrdinals/observationComplete` Prompt/Schema、实验 resolver、12 项 deterministic tests、六图 Golden、benchmark 和报告；前五图 SHA-256 与既有实验一致，明日方舟原图固定为 `efa5f55c667a4212b0bfc083e0734bea5d5c85da1ada6cacc3ccbae6a274ee1a`。首轮 Provider JSON/AJV 6/6，remaining exact 49/66（74.2%，较 Frozen H0 +27.3pp）、coverage 92.4%、resolved precision 80.3%、live recall 82.6%、live precision 97.4%、decision set 3/6、full board 2/6；但 NIKKE G/H 与巨人 A-D 共 6 个 false zero，世界之外 4 SP 被合并为 1，且所有返回 tier 都过度标记 complete=true。明日方舟 C/D/E/F/G 的 open ordinals 与 remaining 全部 exact，live set 被修复，但 A/B 被漏掉。Hard Gate 失败，结论 `R0 PROMISING BUT NOT SAFE`，未执行 stability、未创建 R1。
2026-08-28 V1 release blocker 自动修复与必要生产部署完成，状态 `READY_FOR_TRUE_DEVICE_RETEST`：根因确认是稳定 Local Board `boardId` 错误依赖可删除 Observation `recordId/cloudRecordId`。删除上传现在只重置本机送审状态并保留最近 reference；NEW upload 会在上传证据前通过 `finalize-board-observation prepare-new-upload` owner-scoped 复用有效未送审 Observation，或为 null/stale/已送审/已删除引用确定性创建一条新 Observation；连续遇到 submission 或删除墓碑会继续派生，任何旧 recordId 都不复活。新记录保持同一 `boardId`、新 `recordId/recordCode`，不新增 cloud Board anchor/collection/recovery job、不重新识别或消费 quota；本机 immutable baseline 与 history 分离，后者仍只在赏票 submit 时作为完整 authoritative batch 发送一次。NEW upload note 进入时清空，NOTE_FAILED edit 仍保留同一 submission 原文。回归先红后绿；定向 9 文件／173 项与整库 56 文件／518 项 Vitest、根／Web TypeScript、ESLint、相关文件 Prettier、Next.js production build、19 函数 CloudBase build/static validation、contracts/workflow、V1-F preflight、`git diff --check` 均通过；Frozen R2 Prompt／Schema／Resolver SHA 未变，Qwen/msgSecCheck 调用均为 0。只部署 `finalize-board-observation`；第一次 CLI 错误工作目录的假成功由反向下载发现，正确重部署后生产 `$LATEST` 与本地发布物逐文件一致，树哈希双方均为 `a1671fa2c7f5bb9bec9f90d3627e09429a20318f278ebad913a72e673c2a6a27`，线上为 Nodejs20.19、Active/Available、`index.main`、依赖层 v1。只读 V2 audit 判定 `V2_READINESS=READY`：正式 Observation 与关联 submission 已保存独立 record/source boardId、可信 owner、location、客户端 occurred time 与独立 serverReceived/created/updated time、initial/final snapshot、tiers、authoritative draw events、userNote、verification checkpoints/status、submission/schema/protocol versions，足以作为未来 canonicalization 原始事实输入；客户端 observedAt 不升级为可信服务端时间。未补 V2 字段，也未实现 canonicalBoardId、跨用户匹配、contributors、current projection、canonical version、merge/unmerge、review queue 或地图；这些未来推断与迁移设计不构成 V1 结构 blocker。真机 PASS 仍待用户。
2026-08-28 V1 UPLOAD_STUCK_PENDING blocker 自动修复完成，状态 `READY_FOR_PENDING_BUG_TRUE_DEVICE_RETEST`：生产只读审计锁定同一 owner 最新失败 case（脱敏 `record_408f…41a6`、`board-178785…202de`、submission v1）。Observation、drawSubmission 与 cleanup job 全部绑定同一新 O2，无 old/new ID 漂移；图片上传与 submit 成功，LOCATION_PASS 后于 `2026-08-28T07:08:49.694Z` 写入 `PHOTO_PENDING`，此后 PHOTO/NOTE 未运行。SCF 60 秒 Invocation 指标确认该窗口 `recognize-draw-tickets` 只有一次调用，即 submit，没有 verify；cleanup 的 nextAttempt 在 50 分钟后，不是 race。真实 O2 的合法全字母 display code `LXZDNB` 揭示客户端 `RECORD_CODE_PATTERN` 错误要求同时含字母和数字，导致 pending draft 写入后即被本地 decoder 丢弃，`runTicketVerification` 版本 guard 找不到 draft 而 early return。先加真实码 Storage 回读与 O2 submit→verify 同 ID 红测，复现 2 项失败后把客户端 validator 与正式 `^[A-Z0-9]{6}$` 契约统一；两项转绿，扩展 7 文件／165 项与整库 56 文件／519 项 Vitest、TypeScript、ESLint、contracts/workflow、V1-F preflight、Next.js build 通过。纯客户端修复，不部署 CloudBase，不调用 Qwen/msgSecCheck，不修改 BUG-1 identity recovery、BUG-2 note reset、Storage rule、Days=1 lifecycle、Database ACL 或 Frozen R2。
2026-08-28 V1 BOARD / OBSERVATION LIFECYCLE CLOSURE 自动修复完成，状态 `READY_FOR_BOARD_LIFECYCLE_TRUE_DEVICE_RETEST`：完整调用链和全仓隐式删除审计确认两处 violation——云端列表按 `boardId` 吞掉同 Board 的旧 Observation，以及本机 Board 删除反向调用 `delete-my-record`。回归先以两项精确红灯锁定，再把 projection dedupe 改为 `recordId`、把本机删除收敛为 repository-only；未发现第三处生产 violation。新增 7 个 lifecycle case 覆盖 O1/O2/O3、same-record projection、APPROVED/LOCATION_FAILED/PHOTO_FAILED/NOTE_FAILED、Observation 删除、restart/hydrate、Board 独立删除，以及 O1 删除后继续两次 draw 并 NEW O2；扩展定向 7 文件／155 项、整库 56 文件／526 项、TypeScript、ESLint、Prettier、contracts/workflow、V1-F preflight、Next.js production build、19 函数 CloudBase build/static validation 和 diff check 全绿。B1 的 boardId、初始基线、remaining、history 与 stale reference 保留；O2 使用 fresh recordId，submit/verify 同一 O2，O1 不复活，draw/remaining 不重复。纯客户端 lifecycle 修复，未部署 CloudBase、未调用 Qwen/msgSecCheck、未新增 collection/anchor，未修改 Storage CUSTOM rule、recognition-temp Days=1、数据库 ACL、Frozen R2 或 V2；V2 readiness 仍为 READY，真机 PASS 待用户。
2026-08-28 V1 Local Board 删除入口真机回归自动修复完成，状态 `READY_FOR_LOCAL_BOARD_DELETE_UI_TRUE_DEVICE_RETEST`：根因不是 swipe/button/handler 被删，而是冻结基线已有 `canDelete = submissionState === local`，使 ACTIVE_BOUND Board 的垃圾桶在 `wx:if` 阶段不渲染；上一轮 repository-only handler 修复只暴露了该旧条件冲突，没有引入它。先补 unbound/bound/stale 三态 behavior 红测，53 项中仅新增 bound case 失败；把 Local Board summary 的 `canDelete` 固定为 true 后，原 `record-row` swipe、`-72px` action 和 `onDeleteDraft` 恢复，点击只删本机 Storage，零 `delete-my-record` 调用，云端 Observation 刷新后仍存在。定向 2 文件／77 项和整库 56 文件／527 项通过；TypeScript、ESLint、Prettier、diff check 与 Frozen R2 校验通过。纯客户端一行生产修复，CloudBase deployment、Qwen、msgSecCheck 均为 0，未改 Storage、ACL 或 V2；等待用户只复测此 UI 入口。
