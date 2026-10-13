# TASK22 Phase3 官方网络来源本地实现与自动验证

2026-10-06。状态：`LOCAL_IMPLEMENTED / LOCAL_GATES_PASS / AWAITING_REVIEW / CLOUD_NOT_APPLIED`。唯一活动区块仍为 V2-E / TASK22，八 Phase 总任务仍 `IN_PROGRESS`。本轮从已人工验收的 Phase2 断点继续；Phase1/2 部署、资源、桥接、timer 与既有预览包均未重复执行。

## 已交付行为

- 保留 `NETWORK_SOURCE` 枚举，新增 `OFFICIAL_CURATED / XHS` 私有来源 variant。公开详情显示“网络上传”和官方网络图标，`recordType=null`、`contributor=null`、`contributors=[]`；不创建普通玩家 Account/Profile，也不要求 PLAYER 条例。
- 来源记录、Founder 准确性审核、独立 item-level rights、备注 exact safety 分开验证。决定绑定同一 `sourceId/sourceVersion/contentDigest`，同时保留 `reviewVersion/rightsDecisionVersion`、可信 curator 与下架责任。Founder 必须确认大赏集合；公开网页本身不构成 rights。来源记录中的自述备注证明不足以准入。
- 使用内部可信 `decisions.read(sourceId, sourceVersion, tx)` 端口；暂存前、提交前和最终事务内复读决定。未来生产实现必须使用同一事务的权威决定存储，不能把客户端字段或模型自批当成可信决定。Phase3 没有公开 collect/review/publish API。
- 来源首先进入内存暂存，复用现行 Verification → VerifiedBoard → Resolution → Opportunity/Freshness → Eligibility → Projection。只有安全 PUBLIC 投影成立，source/domain/public/audit 才一次事务提交。歧义、过期、拒绝或旧版本不留正式 V2 半成品。
- 同 URL 规范化为 `https://www.xiaohongshu.com/explore/文章ID` 后派生 sourceId；不接受 query/token/hash/别名。不同 URL 分别建立 Observation，再由共享 Resolution 判断板实例。null 余票保持未知，0 保持售罄；不改变既有五状态 Opportunity、位置网格或公开精度。

## 时间与生命周期

`network-visibility-30d-v1` 将公开上限固定为 `publicUntil = observedAt + 30 × 24 小时`。

存在可信来源实拍证据时，`observedAtBasis=SOURCE_PHOTO_TIMESTAMP`，observedAt 使用该时间；否则 `SOURCE_PUBLISHED_AT_FALLBACK` 使用文章 sourcePublishedAt，并保留实际依据。实拍时间 ≤ 文章发布时间 ≤ fetchedAt ≤ reviewedAt ≤ 当前时间；使用规范 UTC 时间，拒绝无效日期。fetchedAt、reviewedAt、verifiedAt 均不刷新 Freshness anchor 或公开上限。

在 `now >= publicUntil` 时，query 不返回，detail 为 `LEAD_UNAVAILABLE`。该判断使用实时执行时钟，旧 cursor/asOf、includeLowFreshness、离线或过期缓存、准备详情和已经打开的卡片都不能延长期限。客户端使用到期计时器通知现有页面清除信息；后到的旧版本响应不能恢复已到期网络信息。

内部 `reconcileDueNetworkSources` 按默认 20、最大 50 个到期公开条目有界处理，通过后台实例反查进入同一 projector；公开 query/detail 不读取 source/private。到期网络支撑独立退出，仍合格的 PLAYER 支撑保持原公开 ID；客户端也允许该 ID 更高 servedVersion 的 PLAYER 后继。全部支撑退出后新 Observation 必须重走门，并使用新的 publicLeadId，旧 ID 保持 RETIRED。下架保留原 source、provenance、历史和审计，禁止重放复活。

已准入来源的同时间修订不能通过重新审核强制 relink，旧事实与时间保持。专门的纠错、撤销与持续审核工作流属于 Phase5，本轮没有绕过共享关联约束实现它。

## 兼容性与私有字段

新增暂定公开 `public-map-v4`：网络条目只携带安全事实、官方来源标签/图标和期限/政策版本。PLAYER 的 v3 客户端与 v3 后端兼容路径保留；仅支持 v3 的请求不返回 v4 网络条目。既有首页 query 准备最多两条详情、客户端 2 分钟/16 项准备区、列表最多 2 并发/8 行和原生触摸规则保持。

source URL、版权证据、curator、审核/rights 版本、实拍证据、原始精确位置和账号身份不进入公开 DTO。query/detail 只使用既有安全公开 core；新版本的安全检查在网络政策不匹配时关闭公开。

## 自动验证

| 验证 | 结果与证据 |
| --- | --- |
| Phase3 后端模型/准入/期限/事务 | 37 项，覆盖未审核、伪审核、缺 rights、旧版本、审核竞态、grand tiers、精度、备注、安全 URL/日期、歧义、null≠0、回滚重试、审计、到期、旧 cursor、PLAYER 支撑、新 ID 与下架；`network.test.mjs` |
| Phase3 客户端协议/缓存/展示 | 12 项，包括 v4/v3、官方图标、null contributor、期限与隐私负测、已渲染卡片到期、有效 PLAYER 后继；`public-map-network.test.ts` |
| 当前项目源码回归 | 1,347 PASS / 1 既有 SKIP；`project-vitest.log` |
| root/Web TypeScript、ESLint | PASS；`typecheck.log`、`lint.log` |
| Next.js 构建 | PASS；`next-build.log` |
| Playwright 实际 Chromium 回归 | 26/26 PASS；`playwright.log`，自动浏览器回归，没有新增人工视觉验收 |
| 独立编译 ZIP 的实际 Node ESM 链路 | PASS；解压后执行准入→query/detail→30 天临界→内部到期维护→历史保留，`packaged-validation.json` |
| 既有部署/资源证据保留 | 190 个既有 ZIP/资源 manifest 哈希一致；`preserved-artifacts-before.json` 与上述机器回执 |
| 工作流/上传分享防回退/相关 contracts | PASS；`final-validation.json` 与对应日志 |

无范围限制的 `vitest run` 会拾取历史部署 candidate/source-before 和 Node 专用实验测试；旧快照与现行模块混跑产生归档兼容错误。首次运行中的一条现行旧 NETWORK 断言也已修正，随后现行 production 集成 60 项全部通过。它们未被改写来适配新代码。当前源码 `apps/client packages services tests` 全部通过；历史第一次运行输出保留在 `full-vitest.log`，不将它称作通过。

本地包 `phase3-local-runtime.zip` 只用于独立验证，没有 cloud deploy entry、wx-server-sdk、云端 apply 或 bridge 操作。当前 SHA256：`fb5a4d660d9450e9bcacb5d33fe8cc6c559a8cdbed6a653ceffa7399f53f8362`；以 `artifact-manifest.json` 的最新源码/文件 SHA 为准。

## 文件与后续边界

主要实现：`packages/v2-map/resources/production/phase3/{types.ts,network.mjs,admission.mjs}`；共享 domain/runtime、Phase2 pipeline 与 core types/projector/public-api；客户端 public-map contract/candidate/cache/client/presentation 和官方网络 SVG。构建/验证入口为 `scripts/build-v2-production-phase3-artifacts.mjs`、`scripts/validate-v2-production-phase3.mjs`。五份 memory-bank 与 AGENTS 当前入口已同步，P3-A—P3-F 记为 AWAITING_REVIEW。

`phase3/resource-proposal.json` 是未应用的增量草案：复用现有 collection、source/audit kinds，两个无 TTL 索引支持到期选择与后台实例反查。网络政策模板的 curatorAuthorityIds 为空，不能直接启用。后续真实部署须从实际当前远端基线形成新的 exact diff，并验证真实权限/事务端口、SDK、索引、政策和维护 timer；不能再次消费 Phase1/2 的旧部署授权或桥接批次。

本轮云端写入、部署、迁移、桥接重放、Git commit/push、微信上传/发布均为 0。未采集真实小红书记录，未制造真实 rights/Founder 决定、上海 50/全国 300、真机或人工验收证据；测试数据均为隔离 fixture。生产维护 timer 尚未连接：未来上线时应配置它，以便到期后及时切换到仍有效的 PLAYER 支撑；即使维护未执行，公开读取也会即时排除已到期网络 core。Phase4—8 未执行，Phase3 也未标 HUMAN_APPROVED 或 production applied。
