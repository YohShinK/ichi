# TASK-V2-17 Map Loading Overlay Fix

状态：`IMPLEMENTED / AUTOMATED_GATES_PASS / AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`

## 1. 原 Loading 触发原因

地图拖动结束后，`onMapNativeRegionChange()` 读取最终 viewport；当新 viewport 超出当前 query bbox 时，180ms debounce 后调用 `client.changeQuery(next)`。原 `PublicMapClient.#loadRoot()` 将没有新 query cache 的 `QUERY_CHANGE` 归入 `INITIAL_LOADING`。页面把 `mapPhase === "INITIAL_LOADING"` 直接绑定到带 `rgba(255,255,255,.92)` 背景的全屏 `.map-state-overlay`，因此地图和稳定 Marker 被白色遮罩覆盖，直到请求完成。

## 2. 修改前后的 Phase 流程

修改前：

```text
首次 loadInitial + 无数据 → INITIAL_LOADING → 全屏 Loading
viewport QUERY_CHANGE + 新 bbox 无 cache → INITIAL_LOADING → 全屏 Loading
```

修改后：

```text
首次 loadInitial + 无数据 → INITIAL_LOADING → 全屏 Loading
viewport QUERY_CHANGE → VIEWPORT_REFRESHING → 地图保持可见 + 顶部轻量状态
请求完成 → LOADED / EMPTY → 最终 viewport 数据替换
```

## 3. 修改文件

- `apps/client/miniprogram/platform/public-map-client.ts`
- `apps/client/miniprogram/platform/public-map-client.test.ts`
- `apps/client/miniprogram/platform/public-map-render-scheduler.ts`
- `apps/client/miniprogram/platform/public-map-render-scheduler.test.ts`
- `apps/client/miniprogram/pages/home/index.wxml`
- `apps/client/miniprogram/pages/home/index.v2-map-shell.test.ts`
- `memory-bank/design-document.md`
- `memory-bank/implementation-plan.md`
- `memory-bank/architecture.md`
- `memory-bank/tech-stack.md`
- `memory-bank/progress.md`

没有修改 `public-map-cluster-engine.ts`、`public-map-native-presentation.ts`、Marker animation、Zoom Deferred Presentation、地图常驻结构、public contract、CloudBase 或 TASK-V2-18。

## 4. 为什么首次加载保留

首次创建 `PublicMapClient` 时 phase 初始为 `INITIAL_IDLE`；`loadInitial()` 在没有数据或缓存时仍进入 `INITIAL_LOADING`。此时用户尚无可浏览地图数据，全屏“正在载入公开线索”仍是准确的初始化反馈，所以 WXML 的 overlay 条件保持不变：只有 `mapPhase === "INITIAL_LOADING"` 才显示。

## 5. 为什么 Viewport Refresh 不再显示全屏 Loading

`QUERY_CHANGE` 现在固定进入新 phase `VIEWPORT_REFRESHING`。WXML 不把该 phase 纳入 `.map-state-overlay`，只复用已有 `.map-status-slot` 显示“正在加载此区域，已有结果保持可见”。

`VIEWPORT_REFRESHING` 同时加入 `isPublicMapRevalidatingPhase()`：

- query state 即使暂时产生 `items=[]`，`retainStablePublicMapMarkers()` 仍返回上一份 stable Marker snapshot；
- native commit 层继续拒绝 revalidation 期间的 transient empty projection；
- 请求成功后，`LOADED` / `EMPTY` 终态正常替换最终数据。

因此修复没有清空 Marker、重建地图或改变 Marker 生命周期。

## 6. 测试结果

- 定向测试：`4 files / 51 tests PASS`
- 全量测试：`78 files / 852 tests PASS`
- TypeScript：PASS
- ESLint：PASS
- Contracts / workflow：PASS
- Next.js production build：PASS
- `git diff --check`：PASS

新增/更新的覆盖：

1. 首次无数据 `loadInitial()` 仍为 `INITIAL_LOADING`。
2. 已加载地图后 `changeQuery()` 为 `VIEWPORT_REFRESHING`，不再是 `INITIAL_LOADING`。
3. 新 viewport 请求期间，逻辑 `items=[]` 时旧 stable Marker 仍保留。
4. WXML 全屏 overlay 仅绑定 `INITIAL_LOADING`；`VIEWPORT_REFRESHING` 只进入顶部轻量状态。
5. 请求完成后 phase 回到 `LOADED`，新 viewport Marker 数据正常替换。

## 7. 真机验证步骤

依项目规则，本轮未由 Agent 代替 Founder 执行真机视觉验收。请在真机验证：

1. 首次打开地图：无数据阶段应显示一次“正在载入公开线索”。
2. 首次加载完成后拖动到新区域。
3. 请求期间地图和旧 Marker 应持续可见，可出现顶部轻量状态。
4. 不应出现白色闪烁或全屏“正在载入公开线索”。
5. 请求完成后新区域 Marker 应正常替换。
6. 重复快速拖动，确认 latest-generation 响应不会恢复旧 viewport。

最终状态：

`TASK-V2-17 Map Loading Overlay Fix implemented / AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`
