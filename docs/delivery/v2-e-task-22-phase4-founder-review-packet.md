# TASK22 Phase4 Founder 审核入口

当前10条已由Founder对话批准并真实入图，BATCH10_COMPLETE / TEN_PRODUCTION_ADMITTED / PUBLIC_READ_VERIFIED / SAFE_STOP；无需网页逐条点击。原50条模板与以下采集交付计数保留为历史快照，未伪造50条冻结。当前报告：`docs/delivery/v2-e-task-22-phase4-batch10-human-approval-and-map-preparation.md`。

> 2026-10-07 后续更新：Founder 已通过聊天明确批准当前10条并授权入图，详见 `artifacts/task22/phase4/review/founder-approved-batch-10.json` 与 progress 顶部。以下 0/50、PENDING、Phase5锁定及网页操作说明保留为采集交付时快照；本批无需再次逐条点击。10条真实平台发布时间已补齐，8条已有命名POI点位候选；现行≤100米位置准入与未知误差的网络地点不兼容，具体修订提案见 `v2-e-task-22-phase4-batch10-human-approval-and-map-preparation.md`。当前仍未上图。

当前 **PHASE4_COLLECTION_READY / FOUNDER_REVIEW_PENDING / PHASE5_LOCKED**，SUPPLY_GAP。自主工作已交付，Phase4 人工验收尚未完成。412 个唯一 URL 中，可审核 10、待补 202、硬排除 4、窗口外 193、本轮加载失败 3；真实批准 **0/50**。

## 打开与审核

主入口：[Founder review HTML](../../artifacts/task22/phase4/review/founder-review.html)。请保留整个 `artifacts/task22/phase4/` 目录，图片路径相对该目录；本地浏览器打开页面即可，无服务器或账号配置。备用：[Markdown cards](../../artifacts/task22/phase4/review/founder-review.md)、[CSV](../../artifacts/task22/phase4/review/founder-review.csv)、[JSON index](../../artifacts/task22/phase4/review/founder-review-index.json)。完整执行说明见 [自主采集报告](v2-e-task-22-phase4-autonomous-collection.md)。

1. 默认审核 REVIEW_READY；打开来源和原图，核对这是实际当前剩余状态及具体抽赏地点。canonical 来源直达暂不可用时可使用卡片的公开标题搜索链接重新定位。
2. 核对每个赏级、票位计数、价格和遮挡字段；unknown 保持 null，初始数量不能冒充余票，相邻版面不混用。补原始发布日期和可信实拍依据；相对日期仅为范围，不能把采集或审核时间填成原时间。
3. 确认或修正大赏集合、地点，填写逐条 rights 使用依据。公开可见不等于许可；原图只用于内部审核，公开投影粒度未批准。四项确认默认均关闭。
4. 明确选择 APPROVE / REJECT / NEEDS_FIX；事实、时间、地点修正会取消旧批准。每次操作后建议导出本地审核备份，之后可导入恢复；同 packet/source hash 校验不通过则拒绝导入。
5. 计数达到真实 APPROVED 50，恰好选中 50 条且通过当前 7 天窗/精确源时间/全部决定版本检查后，冻结并导出 `founder-approved-50.json`。冻结包含逐条版本、批准 snapshot hash 和 selection SHA；修改必须重新开始审核。此文件仍是本地 input，不能自动写生产。

浏览器本地储存只辅助恢复；换浏览器/路径/清理储存可能丢失，导出的 JSON 是可携带备份。显示的旧 REVIEW_READY 是采集时判断，批准/冻结会重新检查时间窗；越过窗口应补新来源，不能改时间续期。

## 当前十条优先审核

| 文章 ID | 主题 | 正文地点依据 | 可见总余票 | 需留意 |
| --- | --- | --- | ---: | --- |
| 6ac4c4ec000000001a023a00 | 哀鸿 | 百联 ZX / AKIBAGO 上海 | 78 | 源 S 标签保留为 rawLabel；35 元/抽有本板证据 |
| 6ac37430000000000100b0a3 | 鬼灭上弦之贰 | 静安大悦城玩具反斗城潮趣店 | 70 | 相邻 JOJO 价格不属于本板 |
| 6ac3a7c8000000000a02563a | 火影睡衣派对 | 上海荟聚番茄口袋 | 54 | G 区 6–24=19；M993 仅相似提示 |
| 6ac3676e000000001303fc8b | HUNTER CHIMERA ANT | 徐汇百脑汇 4 楼花の一番 | unknown | A 遮挡，其他板价及“5发1抱”不混入 |
| 6ac08336000000001303e0a5 | 鬼灭 | 上海荟聚番茄口袋 | 23 | A/C/D 归零有兑换票区证据 |
| 6ac082bd00000000180129f7 | Pokémon 30th vol.2 | 上海荟聚番茄（原文简称） | 68 | 核对店铺完整名与原图范围 |
| 6abce159000000001303e663 | 鬼灭 | 南京东路 340 号百联 ZX L3-06 BOOMCOMIC | 70 | 6 天前；69 是建议零售标价 |
| 6abcda8b000000000a026fd5 | 火影睡衣派对 | 同上，本帖正文独立证明 | 68 | 6 天前；58 是建议零售标价 |
| 6abcb7810000000014003dc7 | 龙珠 Fantastic | 上海荟聚番茄口袋 | unknown | A 遮挡；本板 69 元证据 |
| 6abcb849000000001403bd03 | 龙珠 DAIMA 2 | 上海荟聚番茄口袋 | unknown | C 遮挡，E 明确兑换；6 天前 |

10 条地点均为 POST_TEXT_EXPLICIT，未代写 MANUAL_CONFIRMED。其中 9 条相对发布时间待确认绝对时间；3 条总余票未知仍可审核可见事实，不能凭常识补数。机会标签和大赏集合均仅为 Codex 建议。准确性、rights、地点、大赏及最终决定全部 PENDING。

## 待补与供给缺口

达到目标 70 可审尚差 60；本池不足以直接批准 50。NEEDS_FIX 可筛出 7 条已结构化记录，优先补门店、遮挡赏级或时间：早期荟聚火影、The Green Party 原神、无地点星铁、华盛原神、迪美自制混合板、BAZINGA NIKKE、多图荟聚非人哉。未完成结构化/尚未打开的记录仍是发现线索，不能批量批准。

相似组只提示 M993 两篇，不决定 BoardInstance 合并；不同 URL 保持独立。请拒绝纯海报/商品展示、外地或不能识别余票的候选，不能为凑数降门。

## 数据与审核边界

packetHash：`9dba192a5a4b2c5453a7412272feb14fd31e14068f4cfe474ebce21648fbc43b`。全部证据 INTERNAL_REVIEW_ONLY，未取得 production rights，未建立 PLAYER 账号/consent 或公开投影。实际原图/正文与来源哈希保存在候选子目录；截图接口超时没有成功截图，未用合成图伪装来源。

[approved-input schema 提案](../../artifacts/task22/phase4/review/founder-approved-input.schema.json) 只规定本地冻结结构，不赋予 production 权限。QA 中命名 SYNTHETIC-QA 的 50 条文件是模拟测试，不能算作真实批准、供给或 ingestion input。

Phase4 Node 20 项、审核页交互 22 项、现行源码 Vitest 1393 项及 Playwright 26 项通过；默认全目录误扫旧快照/实验的失败单列保留，详情见报告和 `qa/final-validation.json`。生产写入=0；Phase5—8、上海50生产热启动、全国300、正式微信发布及 Git 提交均未执行。Founder 只需开始审核/修正；补足 50 条并人工收口前，后续阶段保持锁定。
