# TASK-V2-17 Map Loading Overlay Trigger Diagnosis

状态：`DIAGNOSIS_COMPLETE / NO_RUNTIME_CODE_CHANGED / AWAITING_FOUNDER_CONFIRMATION`

## 1. Loading UI 文件位置

Loading 文案位于：

- WXML：`apps/client/miniprogram/pages/home/index.wxml:187`
- 样式：`apps/client/miniprogram/pages/home/index.wxss:1697`

WXML 条件是：

```xml
<view wx:if="{{mapPhase === 'INITIAL_LOADING'}}" class="map-state-overlay">
  <view class="map-loading-dot"></view>
  <text>正在载入公开线索</text>
</view>
```

控制状态：

- 页面状态字段：`data.mapPhase`
- 页面初始值：`"INITIAL_IDLE"`，见 `pages/home/index.ts:1451`
- 页面映射：`toPublicMapPageData()` 直接将 `PublicMapClientState.phase` 映射到 `mapPhase`，见 `pages/home/index.ts:878-904`
- 真实状态 owner：`PublicMapClient.#state.phase`

显示条件：`mapPhase === "INITIAL_LOADING"`。

隐藏条件：`mapPhase` 变为除 `INITIAL_LOADING` 之外的任意 phase，通常是请求完成后的 `LOADED` / `EMPTY`，或错误态。

遮罩本身是全屏绝对定位层：`inset: 0`、`z-index: 3`、`background: rgba(255, 255, 255, 0.92)`。因此它会覆盖地图并产生用户看到的白色闪烁。

## 2. 所有 Loading 状态赋值位置

`PublicMapClient` 没有独立的 `loading: boolean`；Loading 由 `phase` 状态机表达。

### 初始状态

- `PublicMapClient` 构造函数将 phase 设为 `INITIAL_IDLE`，见 `platform/public-map-client.ts:195`。
- `loadInitial()` 只接受 `INITIAL_IDLE`，然后调用 `#loadRoot(..., "INITIAL")`，见 `platform/public-map-client.ts:251-254`。
- `#loadRoot()` 计算为 `INITIAL_LOADING` 的条件是没有可复用 retained data，见 `platform/public-map-client.ts:466-477`。

### 根查询加载阶段

`#loadRoot()` 统一处理以下原因：

- `INITIAL`
- `QUERY_CHANGE`
- `REFRESH`
- `CURSOR_RECOVERY`
- `IDENTITY_RECOVERY`

状态计算逻辑：

- `CURSOR_RECOVERY` → `CURSOR_RECOVERY`
- `REFRESH` / `IDENTITY_RECOVERY` 且有 retained data → `REFRESHING`
- `REFRESH` / `IDENTITY_RECOVERY` 且无 retained data → `INITIAL_LOADING`
- 其他根查询（包括 `INITIAL` 与 `QUERY_CHANGE`）且有 retained data → `REFRESHING` 或 `STALE_CACHE`
- 其他根查询且无 retained data → `INITIAL_LOADING`

随后通过 `#setState({ phase, ... })` 广播给页面订阅者，见 `platform/public-map-client.ts:479-499`。

### 其他 phase

- 分页：`loadNextPage()` 设置 `PAGINATING`，见 `platform/public-map-client.ts:280-287`。它不会触发全屏 Loading overlay。
- 游标失效：分页遇到 `CURSOR_INVALID` / `CURSOR_EXPIRED` 设置 `CURSOR_RECOVERY`，见 `platform/public-map-client.ts:308-316`。
- 请求成功：设置 `LOADED` 或 `EMPTY`，见 `platform/public-map-client.ts:423` 以及 root success 分支。
- 请求失败：有 retained data 时进入 `STALE_CACHE`，无 retained data 时进入对应 initial error phase。

## 3. 完整触发路径

### A. 首次进入地图

```text
onLoad(query.tab === "map")
↓
ensurePublicMapClient()
↓
client.subscribe(...)
↓
client.loadInitial()
↓
#loadRoot(query, "INITIAL")
↓
没有 retained data
↓
phase = INITIAL_LOADING
↓
页面订阅 setData({ mapPhase: "INITIAL_LOADING" })
↓
WXML 显示“正在载入公开线索”全屏 overlay
↓
query 完成
↓
phase = LOADED / EMPTY
↓
overlay 隐藏
```

对应代码：`pages/home/index.ts:1703`、`pages/home/index.ts:4754-4815`、`platform/public-map-client.ts:251-254`。

### B. Bottom Nav 首次切入地图

```text
onSelectTab(tab = "map")
↓
setData({ currentView: "map-preview" })
↓
ensurePublicMapClient()
↓
若 client 尚不存在：client.loadInitial()
↓
INITIAL_LOADING
↓
全屏 Loading overlay
```

若 client 已存在，则不会因为单纯 Tab 切换再次调用 `loadInitial()`。

### C. 地图拖动后的真实触发链

```text
用户拖动地图
↓
map bindregionchange
↓
onMapNativeRegionChange(type = "begin")
↓
记录 gesture = UNCLASSIFIED，启动 scale sampler
↓
用户松手
↓
onMapNativeRegionChange(type = "end")
↓
MapContext.getScale() + getRegion()
↓
识别 viewport 移动，gesture.kind = PAN
↓
Pan reconcile（只处理 Marker presentation，不控制 mapPhase）
↓
延迟 180ms 做 bbox containment 判断
↓
若新 viewport 超出当前 client.state.query.bbox
↓
client.changeQuery(next)
↓
#loadRoot(next, "QUERY_CHANGE")
↓
新 query 没有缓存 snapshot，sameQuery = false，hasRetainedData = false
↓
phase = INITIAL_LOADING
↓
页面 mapPhase 变为 INITIAL_LOADING
↓
WXML 全屏白色 Loading overlay 出现
↓
新 viewport request 完成后 phase = LOADED / EMPTY
↓
overlay 消失
```

关键代码：

- `onMapNativeRegionChange()` 的 end 处理：`pages/home/index.ts:5899-5967`
- bbox gate 与 `client.changeQuery(next)`：`pages/home/index.ts:5977-5999`
- `changeQuery()`：`platform/public-map-client.ts:256-258`
- `QUERY_CHANGE` 被归入 `INITIAL_LOADING` 的条件：`platform/public-map-client.ts:466-477`

这就是 Founder 看到“拖动后白闪约 1 秒”的直接触发链。约 1 秒对应新 viewport 根请求在真实环境中的等待时间；白闪来自全屏 overlay，不是 Marker binding commit 本身。

### D. 手动刷新

```text
onMapRefresh()
↓
client.refresh()
↓
#loadRoot(query, "REFRESH")
↓
有 retained data → REFRESHING（不显示全屏 INITIAL_LOADING overlay）
无 retained data → INITIAL_LOADING（会显示全屏 overlay）
```

代码：`pages/home/index.ts:6076-6080`、`platform/public-map-client.ts:260-267`。

### E. Retry / identity recovery

- `onMapRetry()` 会调用 `client.refresh()` 或 `client.recoverIdentity()`，见 `pages/home/index.ts:6083-6093`。
- `recoverIdentity()` 与 refresh 使用相同的 retained-data 分支；有数据时为 `REFRESHING`，没有数据时为 `INITIAL_LOADING`，见 `platform/public-map-client.ts:270-278` 与 `:466-477`。

### F. 分页、筛选、搜索、详情、重新激活

- `onMapLoadMore()` → `loadNextPage()` → `PAGINATING`，不是全屏 Loading。
- 搜索与 discovery filter 只调用 `updateMapDiscoveryPresentation()`，在当前 client state 上做本地展示过滤，不发 root query，不改变 `mapPhase`。
- Marker detail `selectLead()` 使用独立的 `detail.phase = LOADING`，不会触发地图 root `mapPhase` overlay。
- `onShow()` 只刷新草稿、账号和恢复任务，不调用地图 `refresh()`；页面重新激活本身不会触发地图 Loading。
- `onLoad()` 只有当入口 tab 是 map 时才创建 client 并启动首次加载。

## 4. 是否存在“清空 Marker 再请求”

需要区分两层：

### Client 逻辑层

存在短暂的逻辑空列表可能性：`#loadRoot()` 对 `QUERY_CHANGE` 使用新 query 的 cache；当新 bbox 没有 cache 时，`retainedItems` 为 `[]`，因此会在 state 中广播 `items: []`，见 `platform/public-map-client.ts:456-485`。

### 页面可见渲染层

当前实现有两道保留机制，所以通常不会把用户看到的 Marker 清空：

1. `ensurePublicMapClient()` 的订阅使用 `retainStablePublicMapMarkers()`，在 `INITIAL_LOADING` / `REFRESHING` / `CURSOR_RECOVERY` 期间复用上一次的稳定 Marker snapshot，见 `pages/home/index.ts:4769-4782`。
2. `commitNativeMapProjection()` 遇到 revalidation 阶段的空 binding 且已有 binding 时直接跳过，记录 `TRANSIENT_EMPTY_PROJECTION_RETAINED`，见 `pages/home/index.ts:4947-4960`。

因此当前白闪的主要表现不是“Marker 被清空后重新出现”，而是：逻辑 root query 进入 `INITIAL_LOADING`，WXML 的全屏 overlay 把仍应可见的地图和稳定 Marker 盖住。

## 5. Loading 的原始设计目的判断

结论：当前 WXML 的 `INITIAL_LOADING` overlay 原本设计目的应是 **A：首次进入地图初始化 Loading**，依据是：

- 文案是“正在载入公开线索”，没有刷新或后台同步语义。
- WXML 只绑定 `mapPhase === 'INITIAL_LOADING'`，没有区分 `QUERY_CHANGE` 原因。
- `REFRESHING`、`PAGINATING`、`CURSOR_RECOVERY` 已经有非阻断的顶部状态行，见 `index.wxml:204-208`。
- `PublicMapClient` 已经实现 retained data 与 `REFRESHING` 的 stale-while-revalidate 语义，说明后续刷新本来不应覆盖地图。
- `QUERY_CHANGE` 复用了 root phase 计算，但没有单独的 viewport revalidation phase，导致“后台换 bbox”落入首次加载状态。

所以问题不是设计上要让每次地图移动显示 Loading，而是 `QUERY_CHANGE + no cache` 错误复用了 `INITIAL_LOADING` 语义。

## 6. 推荐修改方案（本次未执行）

推荐将“首次进入地图”和“后续 viewport revalidation”拆开：

1. 首次 `loadInitial()` 且没有任何 retained data 时继续使用 `INITIAL_LOADING`，保留首次进入 Loading。
2. `changeQuery()` 用独立的非阻断 phase，例如 `VIEWPORT_REFRESHING`，或在页面层使用明确的 `isInitialMapLoad` gate；不再把新 bbox 无 cache 误判成首次加载。
3. `VIEWPORT_REFRESHING` 期间继续复用 stable marker snapshot 和 native binding，地图保持可见。
4. 只显示顶部轻量状态，不渲染 `.map-state-overlay` 全屏遮罩。
5. 请求成功后一次性替换最终 viewport 数据；请求失败时保留旧 Marker，并显示非阻断错误提示/重试入口。
6. 为以下路径增加测试：
   - 首次 `loadInitial()` → `INITIAL_LOADING`；
   - 已有 Marker 的 `changeQuery()` → 非阻断 viewport refresh；
   - 无 cache 的新 bbox 不清空可见 Marker；
   - 普通 pan 在当前 bbox 内不发 query；
   - 超出 bbox 的 pan 只触发后台请求，不显示全屏 overlay。

本次没有修改 `public-map-client.ts`、`pages/home/index.ts`、Marker presentation、cluster engine、publicLeadId、数据结构、CloudBase、Info Card、Bottom Nav、“我的”页面或 TASK-V2-18。

最终状态：

`TASK-V2-17 Map Loading Overlay Trigger Diagnosis complete / AWAITING_FOUNDER_CONFIRMATION`
