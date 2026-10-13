# TASK22 地图定位与刷新按钮丢失修复

日期：2026-10-05。工作集 `MAP_RECOVERY_CONTROLS_ALWAYS_AVAILABLE_V1` 已 CLIENT IMPLEMENTED + NATIVE VERIFIED / AWAITING_REVIEW；V2-E/TASK22 仍为唯一活动区块，整体 IN_PROGRESS。

按钮丢失来自 WXML 条件卸载，而不是个人定位偏移或生产地图数据丢失。原 `map-floating-controls` 同时依赖 `!mapDiscoveryEmptyReason`、`!mapErrorMessage`、`mapPhase !== INITIAL_LOADING` 和 `!mapNativeRenderError`。因此截图中“所选状态暂无公开线索”会卸载两个按钮；“大致位置”只是同时出现，并非隐藏条件。项目和本机 coverView 均开启，未发现本次因配置关闭造成覆盖控件丢失。

## 已排查的情况

| 情况 | 原来 | 现在 |
| --- | --- | --- |
| 筛选无结果、搜索无匹配、所有筛选全不选 | 同时隐藏定位和刷新 | 两入口持续显示 |
| 首次公开数据加载 | 隐藏两个入口 | 显示，重复加载沿用原请求去重 |
| 服务失败、账号错误、频控提示、部分分页错误 | mapErrorMessage 非空即隐藏 | 保留定位与刷新入口及原状态提示 |
| 原生渲染错误 | 错误标志隐藏 cover controls | 不再由错误标志卸载；普通页面的“重新载入”仍保留作为恢复入口 |
| 卡片开关遗留 OPEN/OPENING，但实际 sheet 关闭或 detail 已 IDLE | 没有可见卡片也可能隐藏 | 根据实际详情壳的挂载条件恢复 |
| 详情加载/展开/关闭动画、重叠列表、全局弹窗确实打开 | 隐藏 native hit targets 防止触摸穿透 | 保留这一交互保护；关闭后恢复 |
| 大致位置、定位拒绝、定位失败、定位中、EMPTY、离线、stale、刷新、视野加载和 cursor recovery | 有些自身不隐藏，但与筛空/错误组合会隐藏 | 普通状态及组合均不卸载恢复入口 |

修复仅调整 map 内 cover-view 的显示条件：没有 modal 或 cluster overlay，并且没有实际挂载的详情壳时显示。它与详情模板的 CLOSED/sheet CLOSED/detail IDLE 条件一致，避免仅看 cardPhase 形成残留隐藏。两按钮仍在原生 map 内，原位置、尺寸、点击绑定和请求去重沿用；未移成普通页面覆盖按钮，未改变筛选、公开计数、个人模糊定位、地图分享或准入规则。

## 验证

- 新增 34 个用例直接执行当前 WXML 绑定，覆盖全部 15 个 public-map phase、截图组合、搜索/零筛选/错误/位置状态、真实详情壳与关闭恢复，以及 native 控件绑定。修正了旧结构测试中把“筛空/原生错误应隐藏”当成正确行为的断言。
- home 295 PASS；现行源码与测试夹具 1252 PASS、失败 0，保留 1 项已有 pending。类型检查、Lint、Next.js 构建、上传分享门、工作流门和本轮 diff check PASS。
- 真实微信开发者工具读取正式公开记录；隔离 UI 状态矩阵 20 项通过。真实过滤与无匹配搜索产生空结果，包含截图中筛空加大致位置组合；错误和加载状态为临时 UI fixture，未制造真实服务/地图引擎崩溃。
- 实际 Element.tap 定位一次，结果 APPROXIMATE、本人点 1；GPS为隔离合法粗精度 fixture，不作为真实手机定位测量。实际刷新点击产生 1 次新的正式公开查询，最终 LOADED；实际详情打开隐藏 native targets，关闭后两个入口恢复。
- 控件均 48×48；locate left/top=335/559、refresh=335/621，处于 390×844 可视窗口内。原生截图也确认两图标可见。
- 首次 QA 的刷新回执失败源于自动化 `:not` 选择器未选中预期刷新目标。改为选择已观察到的第二个控件并核对 aria-label=刷新当前地图后，真实点击与正式请求通过；初次失败回执保留追溯，没有因此修改业务刷新函数。
- 全部临时 SDK 包装恢复，fixtureInstalled=false，本人点/误差圆归零。不部署云函数、不改服务配置、不迁移或改写用户记录。
- 官方小程序新版预览 PASS，包体 1030938 字节；修复已搭载到正式开发工作区与预览。没有正式微信发布，没有解锁后续 Phase，也没有 Git 提交或推送。

## 截图与证据

- [筛选无结果与大致位置：两个入口均保留](../../artifacts/task22/phase2-map-controls-20261005/filter-empty-approximate-controls.png)
- [首次加载：入口保留](../../artifacts/task22/phase2-map-controls-20261005/initial-loading-controls.png)
- [服务错误：入口保留](../../artifacts/task22/phase2-map-controls-20261005/service-error-controls.png)
- [详情关闭：入口恢复](../../artifacts/task22/phase2-map-controls-20261005/controls-after-detail-close.png)
- [新版预览二维码](../../artifacts/task22/phase2-map-controls-20261005/native-preview-qr.png)

自动验证、原生状态/真实点击/SDK 恢复与预览证据集中于 `artifacts/task22/phase2-map-controls-20261005/`。旧文档与旧测试中的错误隐藏条件不得作为恢复依据；顶部状态提示无需拿走用户的恢复入口。
