# TASK-V2-17｜原生地图操作按钮层级修复

用户 iOS 真机截图 `IMG_2823.PNG` 显示定位、刷新两个圆形按钮压在 Marker 详情卡右侧；开发者工具截图则显示详情卡盖过按钮。原因不是详情卡 CSS 必须改写，而是按钮作为 `<map>` 内原生 `cover-view`，与 map 外普通 WXML 详情不共享可靠的 CSS 层叠顺序。单纯把按钮 `z-index` 调低不能保证真机顺序。

本次保持按钮在原生地图内及原定位／刷新 handler，以免改变空闲态真机点击路径。只给按钮外层增加 `wx:if`：详情卡、聚合选择、任一页面 modal、地图空筛选提示、初次加载、无数据和地图渲染错误时卸载按钮子树；上层界面退出后恢复。详情卡模板、CSS 与进入／退出动画未修改。这个实现使按钮在有上层界面时不可能穿到详情卡前面，视觉结果等价于地图底层控件被弹层覆盖，同时避免普通 WXML 按钮被 native map 拦截点击的已知风险。

开发者工具自动化验证：地图空闲有按钮；打开详情后按钮节点不存在；关闭详情后恢复；打开 V1 弹窗后再次不存在。截图已目视检查。83文件／917测试、TypeScript、定向ESLint、Prettier、workflow、`git diff --check`、Next production build、微信CLI preview（1,012,114 bytes）通过。**这不是 iOS 真机验收**；请扫码在原设备核对按钮不会再压住详情，且关闭详情后定位、刷新仍能点击。

![空闲态按钮](../../artifacts/map-control-layer/idle.png)

![详情态按钮卸载](../../artifacts/map-control-layer/detail.png)
