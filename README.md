# ICHI

> 当前地图分享约束：`UPLOAD_CONFIRMATION_MAP_SHARING_V2`。原上传确认即分享意愿；核验后进入V1（不依赖条例），同意条例后通过V1→V2准入门；V2已准入数据自动生成Marker，不设二次审核或授权。当前条例覆盖本人此前及以后已上传V1记录。本人记录只显示V1“已上传”，禁止二次分享按钮。现行规范：`docs/decisions/map-upload-sharing-contract.md`。

2026-10-13：当前工作集为V2-E/TASK22 Phase8上线准备，Phase7按本人修订范围收口为132NETWORK/133公开记录。敏感扫描、备案页脚及完整自动回归已执行；微信上传、审核与实际发布分别以progress顶部和Phase8报告为准。下方日期段为历史。

2026-10-06：用户已确认TASK22当前Phase1/2及地图修复人工验收完成（HUMAN_APPROVED）；TASK22八Phase总计划仍IN_PROGRESS，下一步Phase3官方网络来源，Phase3—8及正式发布未执行。当前入口为docs/delivery/v2-e-task-22-report-and-human-acceptance.md及progress顶部。历史AWAITING_REVIEW不要求重复验收或重做部署；本次报告/执行说明不启动Phase3。

2026-10-04用户明确保留微信模糊定位：CURRENT_LOCATION_APPROXIMATE_ALLOWED_V1取代前轮个人定位≤100米/精确权限硬门。合法GCJ02回执可供浏览，模糊/低精度/未知精度标明大致位置，已知有效accuracy绘制误差圆；不得要求开启精确权限或用历史marker冒充本人位置。个人点/圆独立于公开计数，点/相机同回执，前台刷新不移动浏览相机、后台清点并取消旧响应；公开准入精度与网格不变。最新状态以progress顶部为准，前轮定位修复报告只作历史追溯。 已在正式开发工作区/新版预览搭载，1208测试及原生验证PASS，尚未正式发布；证据docs/delivery/v2-e-task-22-approximate-location-support.md。

2026-10-04直接上传备注安全门已回查在线；DIRECT_UPLOAD_NOTE_RETRY已在正式开发工作区及新版预览包补齐。真实微信备注pass才创建完成V1记录；拒绝/异常留本机待上传，在“我上传的版面”修改备注后恢复同一识别任务，复用原快照/位置/上传分享确认，不重新识别、追加位置核验或二次授权。成功只显示已上传，条例及既有全局bridge自动处理后续。证据见docs/delivery/v2-e-task-22-direct-upload-note-review-and-retry.md；客户端尚未正式发布。

ICHI 是面向一番赏玩家的用户侧产品，按照三个独立决策门逐步发展：V1 即时计算、V2 好版线索地图、V3 可信票池社群。Next.js 手机优先网页是 V1 已批准的视觉与交互基线；V2 地图涉及新的公开数据、同意、位置、服务端读取和真机契约，现已基于验证后的 V1 Current Truth 重建完整计划并通过 Final Human Review，不能被解释为只做页面照搬。

## 当前状态

2026-10-04地图资料接点：生产已绑定当前本人安全昵称、独立公开头像副本、真实核验备注及首次上传时间。旧direct备注仅在本人当前条例已接受后由客户端自动后台补审，使用当次临时OpenID并只存exact-hash安全证明；没有新授权或分享按钮。V2详情只读公开投影，Freshness仍用observedAt。正常active账号举报、封禁/异常/受限制不计数，10个不同合格用户隐藏。最新证据与状态见progress顶部及docs/delivery/v2-e-task-22-map-display-and-public-metadata-audit.md。


- 当前活动区块：`V2-E / TASK-V2-22 IN_PROGRESS`。Phase2已`PRODUCTION_APPLIED / LIVE_BRIDGE_VERIFIED / GLOBAL_CONTINUOUS_ENABLED / PHASE1_2_HUMAN_APPROVED`；本人v3接受后CUFZBP实际转换为V2并生成原生Marker及43抽详情，全局每分钟timer连续9次成功。四V1 producer/worker/drain/公开query/detail已开启，所有账号共用后端，各自本人当前同意自动覆盖历史与未来完成上传，无需逐账号配置；旧逐条选择服务保持关闭。UPLOAD_ONLY为既有显示筛选，打开可见仅上传记录。最新报告`docs/delivery/v2-e-task-22-production-bridge-live-and-continuous-closeout.md`；正式微信新版发布、Phase3/NETWORK等仍未执行，以`memory-bank/progress.md`顶部为准。
- 微信小程序 ICHI V1.0.0 已于 `2026-08-30` 审核通过并正式上线，状态 `RELEASED / FROZEN`；`WECHAT_PREMATURE_PROFILE_AUTH_GATE` 已 `RESOLVED / CLOSED`。
- 应用代码：线上 V1.0.0 source 固定为 `release/v1-freeze-20260828@03942f2067959a4b8b0eb6223c949e51e768587d`。版面识别 R2、Local Board／Upload Submission／Current Cloud Publication、账号／位置／每日配额、照片临时使用后删除、私有结构化记录、CloudBase 定时维护与删除链路均已完成。
- V1.0.1 分享源码 `8d442aa7cc9f1921a9b9aade231b5884e8d2dd00` 已由合并提交 `929d189a06e13010e50abf4927bfec3b1ebd49fc` 进入 `main`；微信上传与审核均已完成（`UPLOADED=YES`、`APPROVED=YES`），实际发布仍未确认（`PUBLISHED=UNCONFIRMED`），因此不得创建 `v1.0.1` 标签或 Release。
- V1 Current Truth 已由代码、测试、Git 与发布证据验证，并作为 V2 planning baseline；`feature/v2-board-map` 精确基于上述最新 `main`。
- `memory-bank/implementation-plan.md` 是唯一 current plan，现含 22 个依赖驱动任务，且 `CURRENT_V2_PLAN_AUTHORITATIVE=APPROVED`。V2-C 提供本地 reference implementation；V2-E 负责生产 adapter、resource/index、设备矩阵、pilot 与发布门；Phase2真实用户链路与全局持续桥接已验证，NETWORK热启动与正式发布仍属后续工作。
- V2-B 收口证据入口为 `docs/delivery/v2-b-closeout-review.md`；历史计划、entry packet 和草案仅用于追溯。

## 独立延后分区

[`apps/xhs-local-tool/`](apps/xhs-local-tool/) 是小红书笔记可挂载的纯本地小工具分区，状态为 `POST-V1 / DEFERRED / USER_DECISION`。它不属于微信小程序 V1 successful publication、V2 或 V3，也不会因 V1 开发完成而自动启动。

## 正式入口

1. [PRD](PRD.md)
2. [产品设计文档](memory-bank/design-document.md)
3. [技术栈](memory-bank/tech-stack.md)
4. [当前实施门禁与 V2 完整重构计划](memory-bank/implementation-plan.md)
5. [当前进度](memory-bank/progress.md)
6. [仓库架构](memory-bank/architecture.md)

## 文档优先级

```text
design-document.md   产品行为与验收
        ↓
tech-stack.md        技术实现边界
        ↓
implementation-plan.md  区块顺序、step 范围与验收门
        ↓
progress.md          当前活动区块、工作集与验证记录
        ↓
architecture.md      已存在文件和代码职责
```

`docs/references/`、`docs/methodology/`、`product-atlas/` 和 `canvas/` 保留早期研究、NeoPRD 与无限画布实验，但不再作为正式开发依据。

已完成 V1、被替代的旧 V2 和延后 V3 任务保存在[实施计划历史](memory-bank/implementation-plan-history.md)；2026-09-08 的完整 V2 重建另保存在[V1 事实审阅前的 V2 草案](memory-bank/v2-planning-draft-pre-v1-truth-review.md)。两者仅供追溯，不可解锁任务或覆盖当前计划。

Agent 执行纪律见 [AGENTS.md](AGENTS.md)。

## Reproducing the checks

Install the locked Node/pnpm dependencies with `corepack pnpm install --frozen-lockfile`. Image-evidence tests additionally require Python with `Pillow==12.3.0` from `requirements-test.txt` and an absolute `ICHI_IMAGE_DECODER_PYTHON` path. The GitHub quality workflow prepares this dependency explicitly. The original approved web HTML and public images are archived in `apps/web/source/`; the web preview no longer requires files in a developer’s Downloads folder. Local evidence, credentials, exports and generated caches remain outside Git.
