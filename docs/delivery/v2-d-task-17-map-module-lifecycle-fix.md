# TASK-V2-17 地图模块级生命周期修复

状态：`IMPLEMENTED / AUTOMATED_GATES_PASS / AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`

## 1. 根因

此前 `pages/home/index.wxml` 使用 `wx:if="{{true}}"` 全局常驻原生 `<map>`，离开地图后仅通过 `visibility:hidden`、`opacity:0` 和负层级隐藏。iOS 真机仍会让该 Native Map 参与 WebView 同层合成；地图外的普通搜索、筛选、品牌、Info Card 和 Bottom Nav 与动态 customCallout 同时存在时，触发 `not support mixed rendering`，Native Map 回退为独占层，导致普通 UI 全部消失。

开发者工具使用 Web 组件模拟原生地图，未复现 iOS 的同层渲染失败；因此“工具正常、iOS 只剩地图”符合原生组件回退表现。

## 2. 修改方案

地图从全局常驻调整为地图模块级挂载：

```text
进入 map-preview
  -> 挂载 <map>
  -> 恢复 camera snapshot / viewport / stable marker / PublicMapClient

离开 map-preview
  -> 卸载 <map>
  -> 停止 Native Map context、scale sampling、transition timer、pending native commit
  -> 保留 Page 级数据和查询状态
```

返回地图不会重新创建 PublicMapClient，不会清空 Marker，不会重建 cluster，也不会改变 publicLeadId、BoardInstance 或真实坐标。

## 3. 修改文件

- `apps/client/miniprogram/pages/home/index.wxml`
  - 将地图根节点改为 `currentView === 'map-preview'` 条件挂载。
  - 删除 retained hidden 地图样式依赖。
- `apps/client/miniprogram/pages/home/index.ts`
  - 新增 `PublicMapCameraSnapshot` 页面级快照。
  - 新增 `activateNativeMapSurface()` / `deactivateNativeMapSurface()` 生命周期边界。
  - 在 region end、程序化 camera 和定位完成时保存中心点、scale 与 viewport。
  - 离开地图时停止原生 context 与采样调度，保留业务 client、Marker projection 和查询状态。
- `apps/client/miniprogram/pages/home/index.wxss`
  - 移除不再使用的 `.page--map-retained-hidden` 规则。
- `apps/client/miniprogram/pages/home/index.v2-map-deferred-presentation.test.ts`
- `apps/client/miniprogram/pages/home/index.v2-map-discovery.test.ts`
- `apps/client/miniprogram/pages/home/index.v2-map-first-layout.test.ts`
- `apps/client/miniprogram/pages/home/index.v2-map-structural-layout.test.ts`
  - 更新地图模块挂载和生命周期回归断言。
- `memory-bank/architecture.md`
- `memory-bank/tech-stack.md`
- `memory-bank/implementation-plan.md`
- `memory-bank/progress.md`

未修改 Marker 数据结构、`publicLeadId`、cluster engine、Info Card、Search、Filter、Bottom Nav、“我的”业务、CloudBase、后端或 TASK-V2-18。

## 4. 状态保存方式

状态分为两层：

- Page 级现有状态：`PublicMapClient`、`mapMarkers`、`mapNativeMarkers`、`mapNativeMarkerViews`、stable marker snapshot、projection、query phase 和 viewport。
- 新增 `PublicMapCameraSnapshot`：保存最近有效 `latitude`、`longitude`、`scale` 和 `PublicMapBounds`，供下一次 `<map>` 挂载恢复。

卸载只释放 Native Map 运行时对象和异步采样，不删除业务状态。`onUnload` 才清理 Page 级 WeakMap，避免 Tab 切换造成数据丢失。

## 5. 自动验证

- 定向地图生命周期/结构回归：`4 files / 63 tests PASS`
- 全量 Vitest：`78 files / 856 tests PASS`
- TypeScript：PASS
- ESLint：PASS
- contracts/workflow：PASS
- 触及文件 Prettier：PASS
- `git diff --check`：PASS
- 微信开发者工具 CLI `preview`：PASS，AppID `wx4e40b1657ca4563d`，包大小 `942.5 KB`

`wxa-skills-validate` 已按项目要求检查；该 Skill 只适用于 `agent.skills`/`skills/` AI Skill 分包，本项目主包没有该结构，因此主包编译使用微信官方 CLI 验证。

## 6. 真机验证结果

本轮未代替 Founder 操作 iOS 真机，不能宣称 `not support mixed rendering` 已在设备上消失。请在 iOS 真机执行：

1. 打开地图，确认地图、搜索、筛选、Logo、Info Card、定位/刷新和 Bottom Nav 同时可见。
2. 切换到识别页和“我的”，确认页面正常且地图不再参与合成。
3. 返回地图，确认 camera 中心点、scale、viewport 和 Marker snapshot 保留。
4. 连续切换 5 次，确认没有白屏、UI 消失或 `public_map_native_render_error`。
5. 拖动、缩放、split/merge 后再切换 Tab，确认返回地图仍能正常渲染。

最终状态：

`TASK-V2-17 Map Module Lifecycle Fix implemented / AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`

未 commit、push、deploy。
