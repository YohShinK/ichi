# TASK22 地图详情赏级按列正序

日期：2026-10-05。工作集 `MAP_DETAIL_COLUMN_FIRST_TIERS_V1` 已 CLIENT IMPLEMENTED + NATIVE VERIFIED / AWAITING_REVIEW；V2-E/TASK22 仍为唯一活动区块、整体 IN_PROGRESS。

详情卡片已改为第一列上 A 下 B、第二列上 C 下 D，依次向右。两排、横向滑动、86×54px 卡片和10px间距沿用；奇数个赏级的末项在最后一列上排，下排自然留空。

根因是 `map-info-tier-grid` 原用 `grid-auto-flow: row`，会先填满上排再填下排。现在改为 `column`。WXML 原循环、源数组自然正序以及 `ceil(tierCount / 2)` 列数保持，各赏级的剩余数量、概率与完售/未知状态仍绑定原字段；无需转置数据或改变后端。既有布局断言改为列填充，presentation测试名称改为自然源序，避免把数组顺序与视觉填充混为一谈。V1设定大赏的两列选项不属于此卡片，不修改。

## 验证

- 当前 home 和 public-map-presentation 共13文件、343项测试通过，包含1/5/6/8/11赏级源序与列数、零/未知/完售状态及已有地图控件相关回归。
- TypeScript、Lint、Next.js生产构建、上传分享合同、工作流与本轮差异检查通过。本轮未重复前轮1252项全库回归；此前证据保留，本轮报告仅将343项相关用例列作新验证。
- 清理小程序编译缓存后，实际读取正式公开记录，详情19个赏级源序一致。原生元素几何确认A/B同列、C/D同列，每列横距96px、上下纵距64px，全部卡片86×54px。
- 实际原生横向轨道内容宽950px、可视宽316px，横移634px可见末列S；S在上排，最后下排为空。奇数尾列同时由临时5项公开展示子集验证，无额外空赏级；这一子集仅属隔离UI夹具，不是新增或改写的用户记录。
- 已查看更新截图，实际A/C/E在上排、B/D/F在下排，末尾S及5项奇数夹具均与规则相符。没有使用浏览器控制工具。
- 初次平台QA在原生投影尚未提交时选点而停止。加入已就绪等待后完整通过，初次停止回执保留追溯；产品改动仍只有卡片填充方向。
- 临时展示夹具清除、原tab恢复，SDK未覆盖。没有部署云函数、修改配置或迁移用户数据，没有重复桥接。
- 正式工作区官方预览通过，包1030941字节；未正式微信发布，没有Git提交/推送或解锁后续Phase。

五份memory-bank当前事实与AGENTS规范已同步。旧地图详情的row-major文字仅保留在明确标注被取代的历史验证记录中，不能用于恢复当前排版。

## 截图与证据

- [正式记录：A/B、C/D按列正序](../../artifacts/task22/phase2-map-tier-columns-20261005/native-column-order.png)
- [横向滑至末尾：S位于最后上排](../../artifacts/task22/phase2-map-tier-columns-20261005/native-column-order-end.png)
- [隔离5项奇数尾列夹具](../../artifacts/task22/phase2-map-tier-columns-20261005/native-five-tier-fixture.png)
- [新版官方预览二维码](../../artifacts/task22/phase2-map-tier-columns-20261005/native-preview-qr.png)
- [原生验证回执](../../artifacts/task22/phase2-map-tier-columns-20261005/native-tier-columns-qa.json)

相关验证和预览证据集中于 `artifacts/task22/phase2-map-tier-columns-20261005/`。本工作集的自动门已通过，整个V2-E区块仍须原人工验收门。
