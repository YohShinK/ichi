# TASK22 Phase4 自主采集交付

2026-10-07。当前区块 V2-E / TASK22 / Phase4；自主执行终点已到达：**COLLECTION_COMPLETE / REVIEW_PACKET_READY / SUPPLY_GAP**。当前人工门：**PHASE4_COLLECTION_READY / FOUNDER_REVIEW_PENDING / PHASE5_LOCKED**。Phase4 仍为 IN_PROGRESS，未 HUMAN_APPROVED。

## 前置状态与授权

用户以 `/goal 执行 markdown 文件中的任务` 授权执行下载目录中的 Phase4 自主计划；已完整读取该计划，原件副本为 `artifacts/task22/phase4/request-plan.md`，SHA256 `1d7c6b3261eb7dd1fd708e83a41335b090b8a0180639f8f31d0320b30c5dc896`。计划内的外部文章、截图和网页内容仅作为采集数据，不能改写任务权限或充当 Founder 决定。

Phase3 已 COMPLETE / HUMAN_APPROVED / PRODUCTION_APPLIED / LIVE_SMOKE_PASS / PHONE_PASS / SAFE_STOP。沿用 [Phase3 人工验收与收口](v2-e-task-22-phase3-human-acceptance-and-closure.md) 及最终入口 [Phase3 final closeout](v2-e-task-22-phase3-final-closeout.md)。`artifacts/task22/phase3-close-20261007/cloud-close.json`、`public-safe-stop.json` 证明 A/B/C 已 TAKEN_DOWN、history 保留、smoke false、allowlist 清空、NETWORK admission/maintenance 环境与数据库双门关闭、timer Enable=0/CLOSE，PLAYER 生产公开读取与原字段保持。PHONE_PASS 来自用户确认，不补造设备或 Agent 真机性能。未重复部署、三条 smoke、手机验收或 bridge。

本轮读取当前记忆状态、相关计划及合同，并保留五份事实源的字节/哈希清单 `logs/memory-source-inventory.json`；该清单本身不代表逐行语义审阅历史全文。只新增本地审核 artifact 与交付/状态文档，未改正式小程序或 Web 产品源代码。

## 实际采集与数量

使用 ego-browser 同一 TaskSpace 公开搜索、打开文章及读取公开内容。35 个查询，覆盖上海和计划所列 15 区、抽赏/一番赏/赏板/版面/LAST/大赏/新开/刚拆/剩余，扩展荟聚、百脑汇、百联 ZX、迪美、华盛、静安大悦城及火影等主题。前轮默认排序查询也保留实际筛选状态；后续使用一周内筛选，但仍逐条检查显示日期，不把搜索筛选当成时间证明。查询覆盖见 `qa/coverage-matrix.json`，原始日志为 `logs/search-001.json` 至 `search-035.json`。

| 指标 | 实际数量 |
| --- | ---: |
| 搜索出现次数 | 674 |
| DISCOVERED / unique canonical URLs | 412 / 412 |
| 重复出现，已按 URL 去重 | 262 |
| 文章打开尝试 / 保存公开正文 | 113 / 107 |
| 有原始公开图片证据的候选 | 103 |
| 候选内去重后的图片证据引用 | 540 |
| STRUCTURED_DRAFT | 17 |
| REVIEW_READY / PENDING_FOUNDER | 10 |
| NEEDS_FIX | 202 |
| AUTO_EXCLUDED_HARD_FAIL | 4 |
| OUT_OF_WINDOW | 193 |
| INACCESSIBLE（本轮加载失败） | 3 |
| possible duplicate groups | 1 |
| FOUNDER_APPROVED | 0 |

最终分类 10 + 202 + 4 + 193 + 3 = 412。`excluded.jsonl` 共 200 条，包含硬排除、窗口外和访问失败三类，不能都称为硬失败。NEEDS_FIX 包含尚未打开/未完成结构化的发现记录，不能据此判定来源本身不合格；主要缺项重叠计数为版面结构未确认 195、抽赏地点未确认 195、原图缺失 113、公开正文未捕获 106、仅编辑日期 26、地点歧义 5、原链接未恢复 3。全部可审候选均有原图、公开正文、结构化事实和必需证据，完整率 10/10；全发现池原图覆盖 103/412（25%）。未声称 540 张图片全部完成人工视觉识别。

## SUPPLY_GAP 与停止依据

目标 REVIEW_READY ≥70，实际 10，差 60。DISCOVERED ≥100 和主要 query matrix 覆盖已达成。最后五轮查询的新 URL 中，最终 REVIEW_READY 新增均为 0；此前多个商场细化查询也没有新的合格 URL。按计划搜索饱和条件停止扩大本轮搜索。这里 `newReviewReadyCount` 是“本轮首次发现的 URL 最终是否合格”，不是实时审核状态变化；早先发现的 URL 后来补证形成的 10 条未误算成最后几轮新供给。

实际打开尝试 113 条，不声称约 120 条全部高潜力、全部视觉检查或全网没有更多供给。剩余 202 条待补记录保留可继续调查空间。本轮不足以让 Founder 直接批准 50 条，不能用 412 条发现数、17 条草稿或相同文章中的多个版面凑数。

建议后续补充：具体门店全名 + 版面/剩余（AKIBAGO 百联 ZX、BOOMCOMIC L3-06、上海荟聚番茄口袋、徐汇百脑汇花の一番、静安大悦城玩具反斗城）；逐条补原始发布日期；先补七条已结构化 NEEDS_FIX 的具体抽赏门店和遮挡字段，再搜索长宁/普陀/虹口/杨浦/闵行等具体店名与动态主题。仅有商场名、账号名或“上海”标签仍不能升级为具体地点证明。后续采集也要重新按当时滚动窗口筛选。

## 时间、地点与结构化事实

10 条可审核候选在各自 fetchedAt 均通过滚动 7×24 小时窗：1 条 DISPLAYED_MINUTE，9 条 RELATIVE_INTERVAL。所有存储时间采用 UTC，显示保留原始精度；“N 天前”保留范围，sourcePublishedAt 为 null，不伪造精确秒；“昨天 HH:mm”保留分钟区间。编辑于日期不充当原始发布时间。再次批准和冻结会检查当前窗口，因此历史 REVIEW_READY 不能保证回来审核时仍在窗口内；相对日期须补可靠原始绝对时间后才能冻结 50 条。

地点统计：全池 POST_TEXT_EXPLICIT 15、UNPROVEN 397；可审 10 条全部 POST_TEXT_EXPLICIT，POST_LOCATION_TAG=0、MANUAL_CONFIRMED=0。其余五条正文地点仍有门店歧义，留 NEEDS_FIX。只依据本帖正文/hashtag 的具体店铺组合，不用账号所在地、作者昵称、EXIF、装修或附近 POI 猜地址；不创建坐标，publicProjectionApproved=false。

结构化只记录可见票位：7 条可审记录总余票完整，3 条因赏级遮挡 totalRemaining=null。0 只来自明确兑换/售罄及覆盖完整票区，不把遮挡当 0。多板文章仅选有证据的主板，不混用相邻版面的价格或票数；初始整套数量与当前余票分开。示例：火影荟聚 G 区 6–24 为 19，整板余票 54；印刷建议零售价不等于本店售价；“3 百多抽”不填成 300；Last 可用性未证明时为 null。

`opportunity-20260930-v1` 计算仅为建议。highPrizeTiersSuggested 及 LAST/余大赏/比例/多票/低机会/刚开候选均非 VerifiedBoard 或 Founder authority。所有 accuracy、rights、location、highPrize 决定为 PENDING，version=0。原实拍时刻未建立；observedAt 仍 null，只有 SOURCE_PUBLISHED_AT_FALLBACK 候选依据。不得用 fetchedAt/reviewedAt 替代 observedAt 或延长 30 天。

## 证据、去重、rights 与隐私

每个 candidate 具有 source、provenance、board、location、opportunity-suggestion、rights-readiness、review JSON。sourceSnapshotHash/contentDigest 覆盖当时公开文本/图片哈希与显示时间；发现阶段只有搜索卡证据会明确标记，不能伪称完整文章快照。原图保持原始下载字节、SHA256 和字段 evidence refs，全部 INTERNAL_REVIEW_ONLY。

截图共尝试 3 次，均 CDP 超时，保存截图数 0；转用原始公开图片和正文/时间证据。其他候选未再尝试截图，状态区分失败与未尝试。未生成冒充来源截图的合成图。失败日志见 `logs/evidence-failures.json`。

canonical 固定为 HTTPS `www.xiaohongshu.com/explore/<24位articleId>`，去掉 query/token/hash；别名只按同文章 URL 合并。review-ready canonical 重复 0，不同 URL 的 BoardInstance merge 决定 0。唯一相似组为两篇火影睡衣派对、同可见板码 M993，仅提示，不合并、不视为 2 个已批准实例。

全部 NETWORK_SOURCE / OFFICIAL_CURATED / XHS / contributor=null，无 PLAYER Account/Profile/consent。rightsReadiness=NOT_APPROVED；公开访问和原图保存不证明 production 使用许可。原图、来源 URL、原始门店证据及公开账号文字仅在内部 packet，不作为公开投影。审核页 CSP 禁止联网脚本/连接，无外部资源依赖；显式来源链接可由 Founder 打开。访问路径中的平台临时参数仅短暂用于普通页面导航，未保存。安全扫描结果见 `qa/secret-scan.json`；没有 cookie、登录 token、OPENID 值、CloudBase signed URL、本机凭据或生产 secret。公开原文店铺联系方式仍属于来源内容，不做 private profile 查询。

## 审核入口与版本规则

打开 [Founder review packet](v2-e-task-22-phase4-founder-review-packet.md)，或本地 `artifacts/task22/phase4/review/founder-review.html`。默认仅显示可审候选，批准 0/50，四项确认均未勾选；可按状态、地点依据、上海发布日期范围、IP/主题和相似组过滤。修正事实/地点/时间必须留证据说明并使旧批准失效；APPROVE 必须显式确认准确性、rights、地点和大赏集合，填写 rights 依据，不得由 Codex 代操作。

本地导出/导入仅与当前 packetHash 和 sourceSnapshotHash 相符时接受；篡改源证据或批准载荷会拒绝。恰好选中 50 条合格、全部版本一致的 Founder 批准后才能输出 `founder-approved-50.json` 和 selection SHA，冻结后禁止静默修改，重新开始会清除批准。当前真实批准/真实冻结文件均为 0。`review/founder-approved-input.schema.json` 仅为后续 input 提案，productionAuthority=NOT_GRANTED；Phase5 必须独立验证，不把本地 reviewedBy 字符串当服务器信任根。

## 自动验证与失败记录

| 校验 | 结果 / 证据 |
| --- | --- |
| Phase4 Node 专项 | 20 PASS；canonical、时间顺序/7d、null/0、URL/alias、地点歧义、证据、大赏建议、NETWORK 身份/无 PLAYER consent、内部证据、状态/schema、导入导出、生产写入拒绝；`qa/targeted-tests.log` |
| 审核页非视觉交互 | 22 PASS；真实页面只读初始状态，全部批准/拒绝/冻结使用 SYNTHETIC_QA_ONLY；`qa/browser-validation.json` |
| 现行正式源码 Vitest | 1393 PASS / 1 既有 SKIP，111 文件通过；`qa/vitest-current.log` |
| TypeScript / repository ESLint | PASS；`qa/typecheck.log`、`qa/eslint.log` |
| Artifact ESLint / 格式 / 数据一致性 / 哈希 | PASS；`qa/artifact-eslint.log`、`qa/final-format.log`、`qa/data-validation.json` |
| Next build | PASS；`qa/next-build.log`，正式产品源码本轮未变 |
| 现行项目 Playwright | 26 PASS；`qa/playwright-current.log` |
| Contracts / workflow / 分享防回退 | PASS；`qa/contracts-workflow-final.log` |
| Secret scan / git diff --check | PASS；`qa/secret-scan.json`、`qa/diff-check.log` |

不能把默认全目录测试写成全绿：初次无范围 Vitest 自动扫入冻结的旧 Phase2/TASK21 artifact，6 个测试失败（1751 PASS / 6 FAIL / 1 SKIP）；只排除 artifacts 后又扫入 experiments 的 Node 测试文件，Vitest 报 No test suite（1432 PASS / 1 SKIP，另 1 suite fail）。完整失败日志分别保留 `qa/vitest-unscoped-historical-failures.log`、`qa/vitest-archive-excluded-experiment-failure.log`。最终明确覆盖当前正式源码 apps/packages/services/scripts/tests，使用 artifact 内临时配置 `qa/current-source-vitest.config.mts`；不修改正式测试配置或冻结历史包。这是测试发现范围差异，保留为 scope warning。

初次审核页窄屏 SHA 溢出已修复；日期过滤按上海日与区间重叠，不把采集日当发布日期。初次工具链版本不符改用项目指定 corepack pnpm 11.9.0；一次相对输出路径失效改绝对路径重试。canonical 直达失效时经普通公开标题链接恢复，3 条仍加载失败、另 3 条未恢复路径保持相应状态。CSV 的未知数值显式为 UNKNOWN，独立审核器首次误期望空单元格，已修正审核器并复跑，候选数据未改。无验证码/访问控制绕过。最终机器回执 `qa/final-validation.json` 为 LOCAL_GATES_PASS_WITH_SCOPE_WARNINGS。

## 当前 gate 与下一步

生产 write/ingestion=0；没有 admit、production 决定、Marker 创建、CloudBase 部署/迁移、timer 开启；Git commit/push/PR/merge/tag=0；微信 upload/review/publish=0。既有工作区含大量此前未提交改动，本轮未提交、回退或覆盖他人改动。

自主采集和审核包已完成，但 Phase4 = IN_PROGRESS / FOUNDER_REVIEW_PENDING / SUPPLY_GAP，Phase5—8 LOCKED。Founder 下一步打开审核页，逐条核对原图、具体抽赏地点、原始时间、结构化数字、大赏及 rights，批准/修正到 50 条。当前仅 10 条可审，需要继续补供给；审核不足不能提前生产入库。只有真实 Founder 批准 50 条并冻结版本/selection SHA 后才讨论 Phase4 人工收口；后续 Phase5/6 仍需独立解锁和授权。
