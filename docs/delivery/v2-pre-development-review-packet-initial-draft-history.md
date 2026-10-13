# ICHI V2 开发前审阅包——初始草案历史

> **历史归档，仅用于追溯。不得覆盖 `memory-bank/implementation-plan.md` 中的当前计划，也不得作为当前任务自动执行。**
>
> 本文件是第一次 planning pass 的审计快照，已由同路径的新 reconciliation Review Packet 取代；不得用其中旧 DG、旧 task 顺序或旧完成定义解锁实施。

> 状态：`DRAFT / HUMAN REVIEW REQUIRED`
>
> 审计日期：2026-09-08
>
> planning branch：`feature/v2-board-map`
>
> 基线：`origin/main@929d189a06e13010e50abf4927bfec3b1ebd49fc`
>
> 本文件只记录审计、认知同步、范围、决策门和计划；没有开始 V2 功能实现。

## A. MAIN BASELINE

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| initial local main | `3256b2d2c9106ce134bf72530c8ddd516ed9c818` | 初始只读检查；working tree clean |
| current local main / branch base | `929d189a06e13010e50abf4927bfec3b1ebd49fc` | `git pull --ff-only origin main` 后与远端一致 |
| origin/main | `929d189a06e13010e50abf4927bfec3b1ebd49fc` | fetch tags/prune 后复核 |
| V1.0.0 online source contained | YES | `03942f2067959a4b8b0eb6223c949e51e768587d` 是 origin/main ancestor；`v1.0.0^{commit}` 指向同一提交 |
| V1.0.0 publication closure contained | YES | `62c02ab6bb16ad415a7a9034e41c28066bfe8af3` 是 origin/main ancestor |
| V1.0.1 source contained | YES | `8d442aa7cc9f1921a9b9aade231b5884e8d2dd00` 是 origin/main ancestor |
| 必要 branch-only commit | NONE FOUND | 所有本地／远端 release、feature 分支相对 origin/main 均无未合入提交 |
| frozen R2 | PASS | Prompt/Schema/Resolver 实算 SHA 与冻结值一致；V1.0.1 diff 未修改 |
| Storage frozen boundary | PASS | `services/cloudbase/database/resources.json` 相对 V1.0.0 online source 未修改 |
| current quality baseline | PASS | `pnpm quality`：57 test files / 571 tests、format、lint、双 TypeScript、全部 contract/workflow 通过 |
| stash safety | PRESERVED | `PRE_V1_0_1_MAIN_WORKTREE_RESIDUAL` 与 `MIGRATION_V1_0_1_SHARING_TO_MAIN_WORKTREE` 未恢复、删除或修改 |

结论：`MAIN_VALID_AS_V2_BASE = YES`。`feature/v2-board-map` 从上述 main 精确创建；无额外 worktree。

## B. V1_LESSONS_REGISTER

分类：`GLOBAL_INVARIANT` 适用于所有版本；`V1_SPECIFIC_DECISION` 只保护冻结 V1；`V2_MUST_RE_EVALUATE` 必须在 V2 重新决策，不能机械复制。

| KNOWLEDGE_ID / 分类 | 原假设 | 实际发现与导致问题 | 最终解决方案 | 文档同步 | V2 影响 / task IDs | 需改 V2 task |
| --- | --- | --- | --- | --- | --- | --- |
| K-V1-01 `GLOBAL_INVARIANT` | 首启或核心功能先要求头像昵称 | 微信审核与真机证明资料授权墙阻断正常使用；Profile 被误当 login | WXContext 静默 find-or-create Account；默认昵称与 UI avatar fallback；资料可选且不参与鉴权 | 已进入 V1 顶层事实；旧 V2 账号段仍需纠正 | 地图浏览、贡献、审核不可依赖 Profile 完整度；01、03、08、10、12 | YES |
| K-V1-02 `GLOBAL_INVARIANT` | Local、上传、云端记录可以按一个对象处理 | 删除、失败重试和列表投影互相污染 | 分离 Local Board、Upload Submission、Current Cloud Publication | 已同步顶层设计／架构 | 地图不能读 Local 或 submission history；02、04、07、10、14 | YES |
| K-V1-03 `GLOBAL_INVARIANT` | `boardId`、`recordId`、六位码可以互换去重 | 同现实版面、同 Board、多次 Observation 与短码校验产生身份漂移和卡死 | `boardId`=本机链；`recordId`=云记录；`recordCode`=公开客服查询码；`submissionVersion`=attempt 版本 | V1 顶层已同步；旧计划仍有混用 | Public ID、projection key、API cursor 都不能用 recordCode；02、04、05、06、07 | YES |
| K-V1-04 `GLOBAL_INVARIANT` | Current Publication 可复制完整 snapshot/events | CloudBase 大字段更新失败，却被错误归类为 Provider 失败 | P1 只保留轻量 `publishedSubmissionVersion` pointer；完整事实读精确 APPROVED Submission | 已同步 | V2 私有输入需 join pointer+version；公开端必须另投影最小字段；02、04、07 | YES |
| K-V1-05 `GLOBAL_INVARIANT` | 新 attempt 开始即可替换当前云记录 | 新提交失败导致旧可信版本消失或半更新 | 只有完整 APPROVED 原子推进 pointer；FAILED/PENDING/迟到版本不动旧 publication | 已同步 | 地图保持旧公开点，不能显示 failed draft；02、04、07、10、14 | YES |
| K-V1-06 `GLOBAL_INVARIANT` | 删除后可由本地 stale reference lazy-create | 显式云删除后发生 resurrection；本机删除还曾误删云端 | durable tombstone/deletion job；Local delete 与 Cloud delete 分离 | 已同步 | withdrawal 必须从公开读模型删除且防重生；02、06、07、09、14 | YES |
| K-V1-07 `GLOBAL_INVARIANT` | 后台 refresh/recovery 可无条件写当前页面状态 | 迟到 refresh 把 ACTIVE_DRAW 清回首页并覆盖新状态 | 绑定 active identity/request generation；迟到结果忽略 | 已同步 | viewport、筛选、详情、定位与恢复都需 stale-response guard；10、11、12、14 | YES |
| K-V1-08 `GLOBAL_INVARIANT` | 远程流水线失败可归为一个 Provider error | Provider 200/AJV pass 后 DB 大字段写失败仍显示 Provider failed，证据被错误删除 | provider、parse/schema、normalize、DB、projection、UI 分阶段 checkpoint 与稳定错误码 | 已同步 V1 运行事实；旧 V2 计划不足 | projector/query/moderation/UI 各自失败，不互相伪装；05、07、08、09、10、14 | YES |
| K-V1-09 `V1_SPECIFIC_DECISION` | V2 可以顺便调整识别字段或重算基线 | 多轮识别实验证明模型语义变化风险高 | R2 IP/theme/tiers/remaining frozen；price、grand prize manual；baseline immutable；draw facts event-based | SHA 与契约已冻结 | V2 只消费已批准事实，不修改 R2 或派生新识别语义；02、04、06、14 | YES |
| K-V1-10 `GLOBAL_INVARIANT` | 空值可用 falsy/`Number()` 统一处理 | `Number(null)` 与 falsy 把 unknown 变成 confirmed zero | `null=unknown`、`0=confirmed zero`，显式判定 | 已同步 | 地图筛选、聚合、marker、详情均保留三态；04、05、08、10、11、13、14 | YES |
| K-V1-11 `V2_MUST_RE_EVALUATE` | 为公开地图可直接放开现有 bucket | 会突破 `recognition-temp`/`profile-avatars` 的已冻结隐私与 owner 边界 | V1 Storage CUSTOM 保持；任何公开图片使用新前缀、新规则、新生命周期和显式解锁 | V1 已同步；V2 尚无决定 | 默认 V2 公开读模型无图片；若需要走 DG-V2-09；03、04、06、14 | YES |
| K-V1-12 `GLOBAL_INVARIANT` | 登录/资料 gating 有助于审核 | 与功能无关的资料索权反而触发审核与 UX 问题 | 最小授权、按需索权、功能与 Profile 解耦 | 顶层已同步 | 匿名地图浏览不索取头像昵称手机号；贡献只需可信 Account；01、03、08、12、15 | YES |
| K-V1-13 `GLOBAL_INVARIANT` | 分享 query 可携带内部状态方便落地 | 公共 URL 会扩散内部 tab、身份或私有记录 | tab-only/public allowlist；非法 query fail closed | V1.0.1 已同步 | 地图 deep link/share 只含 public lead ID 与允许参数；05、08、12、14 | YES |
| K-V1-14 `GLOBAL_INVARIANT` | DevTools、单测可替代设备验收 | 相机、权限、滚动、分享、上传、网络和审核多次只在真机暴露 | 与微信 API 相关 task 明确 TRUE_DEVICE_GATE | 已同步 | 定位、地图、分享、权限、弱网、发布均有真机矩阵；12、15、16 | YES |
| K-V1-15 `GLOBAL_INVARIANT` | 少量图片不会显著影响包体 | 分享图与运行时 PNG 曾明显推高主包 | 资产实测、显示尺寸降采样、2 MiB 门与 requiredComponents 建议 | 部分同步 | marker icon、缩略图、静态地理数据必须纳入 budget；11、12、13、16 | YES |
| K-V1-16 `GLOBAL_INVARIANT` | CLI “部署成功”即等于线上一致 | 错误工作目录曾产生假成功，环境变量 merge 也曾丢键 | 函数目录内部署、反向下载 hash、配置 merge/read-back、黑盒 smoke | 已同步 | 所有 V2 CloudBase 部署必须反向核验；07、08、09、14、16 | YES |
| K-V1-17 `GLOBAL_INVARIANT` | CloudBase 文档/API 的能力与目标环境完全一致 | Nodejs24.11 实际不可创建，COS 删除为按日异步而非精确 24h | 以目标环境 read-back 为准；Nodejs20.19；eventual consistency 写进契约 | 已同步 | 地理索引、匿名 API、TTL、限流必须先做 capability spike；05、06、08、16 | YES |
| K-V1-18 `GLOBAL_INVARIANT` | 同一工作可用额外 worktree 隔离更安全 | 项目长期约束与历史残留管理要求 single worktree | latest main → feature/version branch；只用 branch switching | 本轮同步 | V2 计划与 release 流程不得创建 worktree；全部 task | YES |

## C. STALE_ASSUMPTIONS

| ID | OLD | CURRENT_TRUTH | SOURCE OF CURRENT TRUTH | FILES_TO_SYNC | V2_IMPACT |
| --- | --- | --- | --- | --- | --- |
| SA-01 | 账号与公开 ICHI ID 到 V2 才实现 | Account、ICHI ID、默认资料、可选 profile edit 已在 V1 完成 | V1 online source、architecture top、CloudBase guide | PRD、design、tech、plan、progress、README | 删除重复账号任务；只规划 public exposure |
| SA-02 | `wx.login`/头像授权是登录入口 | 云函数 `getWXContext()` 静默 bootstrap；头像昵称非鉴权 | V1 release fix `03942f2` | design、tech、old proposal | 地图与贡献不得 Profile gate |
| SA-03 | 同 Board 重传覆盖一条 `ContributionDraft` | 每次 attempt 是版本化 Submission；P1 只在 APPROVED 时推进 | Current Publication closure | lifecycle decision、plan | 改为 Submission/Publication lifecycle |
| SA-04 | P1 保存完整 `finalSnapshot + events` | P1 是 `publishedSubmissionVersion` pointer，完整事实在 APPROVED Submission | architecture/progress closure | plan、architecture V2 overlay | 公共地图需独立最小 projection |
| SA-05 | 六位 `recordCode` 可作为版面 identity/去重键 | 只供公开查询和客服溯源，不证明 owner 或现实版面 | V1 requirements/design/tests | old plan/data model | 新 public ID 与 internal lineage 分离 |
| SA-06 | `Submission APPROVED` 自动等于 public-safe | V1 APPROVED 只证明现有 LOCATION/PHOTO/NOTE/checkpoints；未来公开字段需独立审核 | V1 text safety + publication contract | design、plan | 新增 moderation/publication eligibility gate |
| SA-07 | 地图可直接读取私有 P1/Observation collection | V1 所有业务集合 ADMINONLY，且 P1含 owner/private lineage | Storage/DB freeze | architecture、tech、plan | 必须建立 public read model + API |
| SA-08 | V1 长期保存初始／赏票图片供 V2 复核 | 正常链路即时双删，`recognition-temp` 仅 Days=1 orphan 兜底 | release manifest/CloudBase guide | lifecycle decision、old requirements wording | 历史 V1 只能用结构化溯源评估 |
| SA-09 | 当前识别仍是 v4/H0 或 T/U 语义 | 生产冻结为 R2 direct remaining；T/P 不进入 V2 | R2 hashes/release manifest | tech historical paragraphs | V2 不重算冻结识别事实 |
| SA-10 | `null` 可转 0 或按 falsy 过滤 | `null=unknown`、`0=confirmed zero` | R2 tests/progress | plan/data/API contracts | 查询、统计与 UI 必须三态 |
| SA-11 | V1-F 或 V1.0.1 sharing 仍是当前开发区块 | V1.0.0 closed；V1.0.1 source 已 merge main，仅 publication/tag 待确认 | Git main `929d189` | plan、progress、README、architecture | 当前无实现区块；V2 plan 待审 |
| SA-12 | V2-A 仍等待 V1-48 是否启动研究 | 用户已明确启动本 planning pass；实现仍待本轮 human review | 当前用户指令 | plan/progress | 重建计划但不解锁 TASK-V2-01 |
| SA-13 | 匿名地图、定位精度、门店供给、提醒分享可同时默认进入首发 | 文档只给方向，缺少精度、审核、运营、许可和首发切片决定 | PRD/design/old plan | design、plan/review packet | 设 DG-V2-01—10 |
| SA-14 | 开发可以通过额外 worktree 隔离 | 项目永久 single worktree | AGENTS + 当前用户指令 | plan/progress/tech | 所有 V2 task 使用 branch switching |

## D. DOC_CONTRADICTIONS

| ID | 矛盾 | 修复 |
| --- | --- | --- |
| DC-01 | plan 顶部把 V1.0.1 sharing 标为当前唯一活动区块，但 Git 已 merge main | plan/progress/README 改为 historical merged，publication/tag 未确认 |
| DC-02 | architecture 说当前无活动区块但仍把 V1.0.1 当未建分支 backlog | architecture/README 更新为 V2 planning branch、无 implementation block |
| DC-03 | design/tech 的 V2 登录写 `wx.login`、资料未完成引导 | 增加 V2 authoritative overlay：WXContext silent Account、Profile optional |
| DC-04 | old V2 lifecycle 以 `boardId` 覆盖 ContributionDraft，与最终 Submission versioning 冲突 | lifecycle 加 superseded notice；新 plan 使用 B/S/P 三层 |
| DC-05 | old V2 lifecycle 声称保留图片引用，V1 最终为不长期保存图片 | 新 V2 默认无公开图片；历史图不可用；图片需求走 DG-V2-09 |
| DC-06 | tech/历史 plan 把 public ICHI ID/profile 当 V2 新建 | 标为 V1 already completed；V2 只决定公开披露 |
| DC-07 | old plan 没有独立 public API/read model，却安排地图 UI | 新 plan 先做 public contract、projection、query API，再做 client/UI |
| DC-08 | old plan 的地图来源可被理解为 private collection/current record | architecture/design 明确 Map source of truth=`PublicMapLead` sanitized projection |
| DC-09 | 历史识别段落仍描述 v4/H0/T/U | 顶层明确为 historical superseded；冻结 R2 不改 |
| DC-10 | progress 较早“已确认认知”仍把 account、真实识别、V1 发布写作未来 | progress 顶部追加 2026-09-08 authoritative status，不删除历史 |
| DC-11 | old roadmap 把证据化公共贡献主要放 V3，而 current PRD 已把核对式共享放 V2 | 保留历史研究角色；新 V2 切片允许单次审核线索，跨用户协同版本链仍延后 V3 |

## E. V2_PRODUCT_SCOPE

### IN_SCOPE

- 在地图／列表中发现带明确来源、观察时间、地点精度和“非实时库存”提示的结构化好版线索。
- 公开读取只经受控 API；默认允许不完成 Profile 的用户浏览，是否完全匿名由 DG-V2-01 最终确认。
- V1 私有 Current Publication 的某个精确 APPROVED Submission 经独立公开资格、隐私与审核后，投影为最小 `PublicMapLead`。
- viewport 查询、分页／limit、marker density、clustering、refresh/cache/stale response、弱网与大结果集策略。
- IP／主题、时间、地点范围和公开安全的版面摘要筛选；`null` 与 `0` 保持不同。
- 发布、更新、失败 submission 隔离、withdrawal/deletion、历史版本、eventual consistency 和 durable no-resurrection。
- 玩家抽赏核对、玩家现场直传、门店／店员直传作为产品目标中的候选供给类型；首发启用哪些由 DG-V2-03 决定。
- moderation、rate limiting、abuse prevention、owner privacy、下线与审计。

### OUT_OF_SCOPE

- 实时库存承诺、店铺信用／黑名单、促抽排行。
- 论坛、帖子、评论、私信、群组、动态流、公开消费档案。
- 客户端直接读取私有 CloudBase 集合或直接写公开集合。
- 把 Local Board、Submission history、FAILED draft 或 `recordCode` 当地图事实／身份。
- 修改冻结 R2 Prompt、Schema、Resolver、Storage CUSTOM 或把现有 bucket public。
- V3 的跨用户可信票池版本演算、自动 canonical merge/unmerge 和社区复核。

### DEFERRED

- 订阅消息／关注半径、结果海报、非核心地图社交分享：推荐延后到地图核心供给与读取成立后，见 DG-V2-08。
- 外部平台自动聚合：没有明确授权 API/合作前不进入实现。
- 公开图片：默认不做；见 DG-V2-09。
- 跨端账号恢复、手机号／邮箱、可编辑 ICHI ID：不属于地图首发。

### PRODUCT_DECISION_REQUIRED

1. 匿名读取还是仅 silent Account 读取；地图是否展示任何贡献者资料。
2. location 表示店铺 POI、拍摄点还是用户选择地点；精度、编辑、公开和迁移规则。
3. 首发供给切片：仅已存在玩家 Publication，还是同时建设玩家直传、门店／店员身份运营。
4. public-safe 字段、moderation SLA、位置备注／店名／昵称是否公开。
5. 同现实版面多条线索是并列展示、人工归并，还是建设 CanonicalBoard。
6. V1 历史记录是否逐条重新同意并 backfill，还是只接收 V2 新发布。
7. fresh/aging/stale/archived 阈值和地图默认可见范围。
8. 提醒、地图分享、海报是否进入 V2 首发。

## F. DECISION_GATES

| Gate | QUESTION / WHY | OPTIONS | BLOCKED TASKS | RECOMMENDED DECISION | USER_DECISION_REQUIRED |
| --- | --- | --- | --- | --- | --- |
| DG-V2-01 | 地图读取是否匿名；决定审核与账号数据暴露 | anonymous public API / silent Account only / mixed | 03、05、08、11、12、15 | 匿名读最小字段；贡献需 silent Account；Profile 永不 gate | YES |
| DG-V2-02 | Location 到底描述什么以及公开精度 | verified POI / rounded capture point / user-selected venue | 02—08、11—15 | 优先用户确认的店铺 POI；设备点只作私有核对证据；公开坐标按批准精度降级 | YES |
| DG-V2-03 | 首发供给来源决定身份、运营与审核成本 | existing player publications only / +direct player / +verified merchant-staff / all | 01—09、15、16 | 先上线已存在玩家路径的小范围试验；门店／店员做后续同 V2 tranche | YES |
| DG-V2-04 | 哪些字段可公开、哪些需 msgSecCheck/人工审查 | strict structured allowlist / allow note/store name / richer UGC | 03、04、07、09、14 | 先用结构化 allowlist；备注默认不公开；新 UGC 独立审核 | YES |
| DG-V2-05 | 同现实版面如何处理 | separate leads / human link / automatic CanonicalBoard | 02、04、06、07、11 | V2 首发 separate leads + 可审计人工关联；自动 merge/unmerge 延后 | YES |
| DG-V2-06 | V1 历史 publication 是否进入地图 | no backfill / explicit re-consent / policy-based bulk | 02、06、07、14、16 | 默认不自动公开；仅 explicit re-consent 且重新审核 | YES |
| DG-V2-07 | freshness 阈值与默认展示策略 | fixed 2/12/24h / evidence-calibrated / source-specific | 04、05、08、11、13、16 | 先用研究/封闭试验校准；未批准前不硬编码 | YES |
| DG-V2-08 | 提醒、地图分享、海报是否首发 | core map only / map share only / all old-plan extras | 01、12、13、16 | core map only；公开 deep link 作为 release requirement，提醒/海报 deferred | YES |
| DG-V2-09 | 是否需要公开图片 | no images / generated structured card / new public image pipeline | 03、04、06、07、11、13、14 | no images；若选图片，创建 `EXPLICIT_V2_UNLOCK_DECISION`，不得改 V1 Storage boundary | YES |
| DG-V2-10 | 地图 provider、地理查询和预算边界 | Tencent native / server tile-geohash abstraction / validated alternative | 05、06、08、12、13、16 | 先做 target-environment capability/cost spike，再冻结 provider 与阈值 | YES |

所有 blocked task 在对应 gate 关闭前保持 `LOCKED`。

## G. OLD_PLAN_TO_V2_PLAN_MAPPING

| 旧 task | 分类 | 新归属 | 原因 |
| --- | --- | --- | --- |
| V2-00 | SPLIT / MODIFY | 01、03、04 | Account/Profile 已在 V1；只保留 public exposure、状态与范围决定 |
| V2-01 | KEEP / MOVE | 01、16 | 机会样本仍需要，但服务于 scope/pilot，不先于全部 V1 事实审计 |
| V2-02 | KEEP / MOVE | 01、16 | 用户理解研究保留，绑定产品门和封闭试验 |
| V2-03 | SPLIT | 01、03、05、12、16 | 合规、隐私、地图平台、分享/订阅、release gate 不能混成一个 task |
| V2-04 | KEEP / BLOCKED_BY_DECISION | 01、03 | 合法供给仍是启动门，受 DG-V2-03 |
| V2-05 | SPLIT / MODIFY | 02、04、06 | 改用最终 B/S/P 语义；CanonicalBoard 不再默认创建 |
| V2-06 | SPLIT / MODIFY | 03—09 | 资源、权限、读模型、API、moderation、withdrawal 分开 |
| V2-06A | ALREADY_COMPLETED_IN_V1 / MODIFY | 01、03 | silent Account、ICHI ID、资料编辑已完成；只评审公开披露 |
| V2-06B | ALREADY_COMPLETED_IN_V1 / MODIFY | 03 | Profile 页能力已完成；不重复实现，公开字段另审 |
| V2-07 | SPLIT / MODIFY | 01、02、07、09 | V1 已有玩家上传链；新来源与 public projection 分开 |
| V2-08 | ALREADY_COMPLETED_IN_V1 / MODIFY | 02、09、14 | 赏票核对已在 V1；V2 只验证 public eligibility/moderation，不重做 OCR |
| V2-09 | SPLIT | 07、09、10 | publication、审核、本人状态与 client state 分层 |
| V2-10 | KEEP / MOVE | 04、11 | 时间语义进入 contract，展示在 UI |
| V2-11 | MOVE / MODIFY | 02、07、09 | withdrawal/deletion 是 lifecycle 主链，不是尾部功能 |
| V2-12 | MODIFY / MOVE | 11 | UI 必须在 contract/API/client state 后 |
| V2-13 | SPLIT / BLOCKED_BY_DECISION | 02、05、12 | location semantics、provider、permission 是不同依赖 |
| V2-14 | MODIFY | 05、10、11 | 筛选先定义 null/query/cursor，再实现 |
| V2-15 | MODIFY | 04、08、11 | 详情只读 public allowlist 与当前审核状态 |
| V2-16 | MERGE / MOVE | 14、15 | 双端自动/真机验证统一进分层 gate |
| V2-16A | DEFER_TO_LATER_VERSION / BLOCKED_BY_DECISION | 01、17 | 提醒不是 core map critical path，受 DG-V2-08 |
| V2-16B | DEFER_TO_LATER_VERSION / BLOCKED_BY_DECISION | 01、17 | 订阅消息需模板/许可/运营，先验证供给 |
| V2-16C | MODIFY / DEFER | 12、17 | 只保留 public-safe deep link 基础；社交优化后置 |
| V2-16D | DEFER_TO_LATER_VERSION | 17 | 海报与地图核心供给无依赖价值，且增加包体/隐私成本 |
| V2-17 | SPLIT / MODIFY | 09、13、16 | 运营、性能、发布可观测性分开 |
| V2-18 | KEEP / MOVE | 16 | 封闭试验保留，必须在真机与生产候选前置门后 |
| V2-19 | SPLIT / MODIFY | 14—17 | 测试、真机、release、publication/tag 分开 |
| V2-20 | KEEP / MOVE | 17 | V2 实际发布和复盘后再决定 V3 |

旧 V1 tasks 全部保留为 `COMPLETED / HISTORICAL BASELINE`，没有删除。

## H. NEW V2 PLAN SUMMARY

完整历史任务字段见 `memory-bank/implementation-plan-history.md`。此处仅保留当时的审阅顺序，不得作为当前任务执行：

| Order | TASK_ID | TITLE | DEPENDENCIES | KEY WORK | TEST / TRUE DEVICE GATE | ACCEPTANCE / PROPAGATION |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | TASK-V2-01 | Product scope & decision closure | human review | 关闭 DG、首发 supply 与公开范围 | docs/decision trace；TD NO | 用户批准；任何 scope 知识更新全部 downstream |
| 2 | TASK-V2-02 | Domain source-of-truth & lifecycle | 01 | B/S/P→public eligibility、全部生命周期 | domain/contract matrix；TD NO | failed/local/delete/old version 语义无歧义；更新 03—17 |
| 3 | TASK-V2-03 | Public fields, privacy & moderation | 01–02 | allowlist、匿名、owner privacy、abuse | negative/security contract；TD NO | 私有字段不可达；更新 04—17 |
| 4 | TASK-V2-04 | PublicMapLead contract | 02–03 | sanitized projection、ID/null/version/tombstone | schema compatibility；TD NO | source of truth 冻结；更新 05—17 |
| 5 | TASK-V2-05 | Query/security/performance contract | 03–04 | viewport/cursor/limit/cluster/cache/rate limit | query/abuse property tests；TD NO | 大结果与 stale 明确；更新 06、08、10—16 |
| 6 | TASK-V2-06 | Resource/index/migration plan | 04–05 | CloudBase capability、index、backfill、rollback | dry-run/no-write diff；TD NO | 精确资源计划获批；更新 07—09、14—16 |
| 7 | TASK-V2-07 | Publication projector lifecycle | 04–06 | APPROVED→projection、monotonic update、withdrawal | integration/idempotency/failure injection；TD NO | failed attempt 不动 current；更新 08—16 |
| 8 | TASK-V2-08 | Public viewport/detail API | 05–07 | anonymous/auth policy、allowlist、pagination、rate limit | contract/cloud/security；TD NO | 不直接读 private DB；更新 10—16 |
| 9 | TASK-V2-09 | Moderation & operations | 03、06–08 | review queue、rejection、takedown、abuse、SLA | negative/cloud/ops drills；TD NO | 下线 durable 且可审计；更新 10—17 |
| 10 | TASK-V2-10 | Client map state | 05、08–09 | request generation、cache、stale/error/refresh | reducer/race/integration；TD NO | 迟到响应不覆盖当前状态；更新 11—15 |
| 11 | TASK-V2-11 | Map/list/filter/detail UX | 04–05、08、10 | source/time/non-real-time、null-safe display | component/e2e/accessibility；TD NO | 用户不误解库存；更新 12—16 |
| 12 | TASK-V2-12 | WeChat map/location/deep-link integration | 01、05、08、10–11 | map API、permission、public-safe link | platform + TD YES | 真机定位/拒绝/弱网/链接通过；更新 13—16 |
| 13 | TASK-V2-13 | Scale/package resilience | 05、08、11–12 | marker density、cluster、cache、asset budget | load/package/network；TD YES | 阈值与 2 MiB budget 通过；更新 14—16 |
| 14 | TASK-V2-14 | Layered integration & security gate | 06–13 | unit/contract/integration/cloud/migration/negative | full automated matrix；TD conditional | 所有自动门绿；更新 15—17 |
| 15 | TASK-V2-15 | True-device matrix | 12–14 | 微信 API、定位、地图、权限、分享、弱网 | TD YES | 批准设备矩阵无 P0/P1；更新 16—17 |
| 16 | TASK-V2-16 | Closed pilot & release candidate | 09、13–15 | supply/理解/下线、Cloud deploy、privacy/review/rollback | production smoke + TD YES | 用户批准发布；更新 17 |
| 17 | TASK-V2-17 | Publication & immutable release closure | 16 | upload/review/publish/GitHub/online source/tag | production smoke；TD YES | 实际发布后才 tag；知识进入 V3 decision |

当前全部 task：`LOCKED / NOT_STARTED`。本轮结束后不得自动开始 TASK-V2-01。

## I. CRITICAL PATH

```text
Human review + DG-V2-01..10
→ TASK-V2-01 scope closure
→ TASK-V2-02 domain/lifecycle
→ TASK-V2-03 public privacy/moderation
→ TASK-V2-04 PublicMapLead contract
→ TASK-V2-05 query/performance contract
→ TASK-V2-06 CloudBase/index/migration approval
→ TASK-V2-07 projector
→ TASK-V2-08 public API
→ TASK-V2-09 moderation/withdrawal operations
→ TASK-V2-10 client state
→ TASK-V2-11 UI
→ TASK-V2-12 platform integration
→ TASK-V2-13 scale/package
→ TASK-V2-14 automated release gate
→ TASK-V2-15 true device
→ TASK-V2-16 pilot/release approval
→ TASK-V2-17 actual publication then immutable tag
```

并行余量：01 内的用户研究／合法供给调查可并行；03 的 policy 研究可与 02 的 lifecycle matrix 交错；11 的文案/低保真只能在 04 后开始，真实 UI 仍等待 08/10；release 不可绕过 15。

## J. V2 RISKS

### HIGH

- Location 含义／精度未决，错误公开可能造成个人轨迹或店铺归因风险。
- 把 private P1/Submission 直接暴露、或把 V1 APPROVED 当 public-safe，会形成越权与内容污染。
- 多来源供给不足或核验成本过高，地图即使技术完成也没有产品价值。
- withdrawal/deletion 与 stale projector 不一致会导致已下线内容复活。
- CloudBase 匿名 query、地理索引、限流或成本能力若不满足，需要调整架构。

### MEDIUM

- 大 viewport、marker density、缓存和弱网造成卡顿、陈旧或跳点。
- note/store/profile 等未来 UGC 超出现有 msgSecCheck 覆盖。
- V1 历史记录无图片且缺重新同意，不适合自动 backfill。
- marker/地图 SDK/图片资源推高小程序包体。
- 微信审核对定位、隐私声明、匿名/登录行为的要求可能改变 release path。

### LOW

- 旧文档历史段落仍可能被脱离顶层 overlay 误读。
- recordCode/publicLeadId 命名相近造成工程误用。
- V1.0.1 尚未确认实际 publication/tag，虽不阻塞 V2 base，但 release ledger 需继续保持独立。

## K. FILES MODIFIED

本轮实际只修改：

- `docs/delivery/v2-pre-development-review-packet.md`
- `PRD.md`
- `memory-bank/implementation-plan.md`
- `memory-bank/design-document.md`
- `memory-bank/tech-stack.md`
- `memory-bank/architecture.md`
- `memory-bank/progress.md`
- `README.md`
- `docs/decisions/v2-contribution-verification-lifecycle.md`（只加 superseded/compatibility note）

没有 runtime、pages、components、cloud functions、database logic、Storage rule、recognition pipeline、V2 test 或 production configuration 变更。

## L. IMPLEMENTATION STATUS

- `V2_IMPLEMENTATION_STARTED = NO`
- `commit = NO`
- `push = NO`
- `PR = NO`
- `merge = NO`
- `tag = NO`
- `CloudBase deploy = NO`
- `WeChat upload/review/publication = NO`

## STOP MARKERS

- `MAIN_VALID_AS_V2_BASE = YES`
- `V1_KNOWLEDGE_SYNC_COMPLETE = YES`
- `V2_IMPLEMENTATION_PLAN_REBUILT = YES`
- `V2_PLAN_READY_FOR_HUMAN_REVIEW = YES`
- `V2_IMPLEMENTATION_NOT_STARTED = YES`
