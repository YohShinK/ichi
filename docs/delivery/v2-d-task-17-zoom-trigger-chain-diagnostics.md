# TASK-V2-17 Zoom → Presentation 触发链诊断

日期：2026-09-21  
状态：`DIAGNOSTICS_COMPLETE / AWAITING_REPAIR_PLAN_CONFIRMATION`

## 结论先行

当前版本没有一条“DevTools 专用”和一条“真机专用”的业务链。用户手势均进入：

```text
regionchange / getScale
  → CameraScaleState
  → Presentation invalidation
  → projectNativeMapMarkers
  → NativeMapMarkerView
  → differential setData
  → map markers / custom callout
```

程序化聚合点放大额外经过 `targetScale + CAMERA_ANIMATING`，但进入的是同一个 Presentation、Projection 和 commit 管线。

本轮纯缩放实测证明 DevTools 会进入完整链路，并非必须先拖动地图才触发 Presentation。真正可复现的问题是：一次 scale `13 → 15` 的手势，在不足一秒内触发 9 次 Presentation、9 次 Projection、7 次实际 `setData`；scale 已连续三次稳定为 `15` 时，仍有三次 `shouldInvalidate=true`，导致三次无意义重投影，其中两次最终被 `NO_CHANGED_FIELDS` 拦下。这个 post-end settle 过度失效是已确认根因。

真机“能缩放但 Marker/底图闪烁”的高置信度原因，是同一提交突发在较慢的 native render/callback 节奏下，与 topology 切换时的整组 native binding replacement 叠加。真机未连接到本轮自动化会话，因此该段是依据用户已观察现象、共享代码路径和 DevTools 时序作出的因果推断，不冒充真机日志实测。

## 本轮诊断边界

- 只增加结构化诊断事件和静态回归，没有调整阈值、采样周期、Presentation 输出、cluster 算法或正式交互。
- 没有修改 Marker 架构、`publicLeadId`、真实经纬度、公开数据结构、Info Card 或 TASK-V2-18。
- `NATIVE_MAP_ZOOM_DIAGNOSTICS_ENABLED=true` 时输出 `[TASK-V2-17_ZOOM_TRACE]`；诊断状态保存在 page-owner WeakMap，页面卸载时清理。
- `<map bindupdated>` 是当前能观察到的 native map 更新信号；它不能证明普通 `cover-view` 子树的每一次绘制。因此 `NATIVE_MAP_RENDER` 只用于关联 native map/binding 更新，不能当作完整的逐帧 paint callback。

## 新增诊断事件

| 事件 | 记录内容 |
| --- | --- |
| `ZOOM_EVENT_RECEIVED` | scale、source、causedBy、settle sample |
| `SCALE_CHANGE_CHECK` | previous/current scale、0.005 阈值、是否真的跨阈值、是否仍触发 invalidation |
| `CAMERA_STATE_UPDATED` | target/observed/settled scale、gesture state |
| `PRESENTATION_INVALIDATE` | reason、scale、viewport、最近一秒 Presentation 次数 |
| `PRESENTATION_UPDATE_START` | 输入 Marker、当前 view/cluster、generation |
| `PROJECTION_REBUILD` | 输入/输出数量、topology/projection generation、最近一秒重建次数 |
| `MARKER_VIEW_GENERATED` | public lead IDs、native marker IDs、view/cluster 数 |
| `NATIVE_BINDING_COMMIT` | binding 数、changed IDs、commit reason、最近一秒 binding commit 数 |
| `SET_DATA_COMMIT/SKIPPED` | changed fields、是否写 binding、提交频率或跳过原因 |
| `NATIVE_MAP_RENDER` | `<map bindupdated>` 信号、binding/view 数、generation |

## DevTools：纯缩放、不拖动

环境：微信开发者工具 runtime=`devtools`，SDK=`3.17.0`。在已加载 10 条 synthetic lead 的地图上，通过模拟器内原生地图双击完成纯缩放，没有 pan。

实测序列：

1. `REGION_CHANGE_BEGIN`：scale 13，`causedBy=gesture`。
2. `REGION_CHANGE_END`：scale 14，`causedBy=scale`。
3. end resolved：14.02，立即进入 `SCALE_CHANGE_CHECK(true) → CAMERA_STATE_UPDATED → PRESENTATION_INVALIDATE → PRESENTATION_UPDATE_START → PROJECTION_REBUILD → MARKER_VIEW_GENERATED → SET_DATA_COMMIT`。
4. 80ms settle tail 继续得到 `14.39 → 14.72 → 14.89 → 14.97 → 15 → 15 → 15 → 15`。
5. Marker 右栏宽度从 scale 13 的 68.02px 更新到 scale 15 的 83.56px，证明纯缩放确实更新了 Presentation，不需要拖动补触发。
6. 本轮区间未跨过新的 cluster split/merge 边界，因此 topology 保持 8 views / 2 clusters，纯缩放期间没有 `NATIVE_BINDING_COMMIT`；提交只更新 view/progress，最后一次更新 interaction state。
7. 峰值为 9 Presentation/s、9 Projection/s、7 `setData` commits/s。
8. scale 已稳定为 15 后仍有三次 `scaleChangedByThreshold=false, shouldInvalidate=true`；它们继续进入 Presentation/Projection。前两次因字段无变化而跳过 `setData`，最后一次仅提交 `mapNativeInteractionState`。
9. 每个非空 projection 都完整代表 10 个 lead；没有 `publicLeadId` 丢失、重复或 cluster engine 计算错误证据。

截图证据：`artifacts/task17-presentation-diagnostics/devtools-pure-zoom.png`。结构化摘录：`artifacts/task17-presentation-diagnostics/diagnostic-summary.json`。

## DevTools：程序化聚合点放大

调用既有聚合点激活路径执行 scale `12 → 13`，没有 pan。该路径先使用目标 scale 驱动 Presentation，随后由 native observation/settle 收敛：

- region begin 已携带目标 13，但多次 region end 仍返回 12，首个 resolved 为 12.02；settle tail 为 `12.37 → 12.68 → 12.87 → 12.96 → 13 → 13 → 13 → 13`。
- 峰值为 9 Presentation/s、11 Projection/s、8 `setData` commits/s。
- topology 从 3 bindings 切换为 8 bindings，出现一次 `NATIVE_BINDING_COMMIT`，changed IDs 共 9 个；约 38ms 后收到一次 `NATIVE_MAP_RENDER`。
- 同样存在 scale 已稳定为 13、阈值判断为 false 但仍继续 invalidation 的尾部调用。

这证明 native binding replacement 与 native map updated 信号在链上可以一一关联；纯 view-only commit 则不会可靠触发 `<map bindupdated>`。

## DevTools / 真机对照

| 节点 | DevTools 本轮实测 | 真机当前证据与判断 |
| --- | --- | --- |
| Zoom 事件 | 纯缩放可收到 begin/end；有效连续 scale 主要由 end 后 settle 提供 | 用户已确认 zoom 可驱动变化；本轮没有接入设备 console，事件频率未量化 |
| Camera state | target/observed/settled 均进入同一状态机 | 无 runtime 条件分支；应进入同一状态机 |
| Presentation invalidation | 纯缩放立即触发；峰值 9/s，且 stable scale 仍重复触发 | 能看到 Marker 变化说明链未断；相同突发在设备端更容易积压 |
| Projection | 纯缩放 9/s；程序化放大 11/s | 同一同步函数，无平台分支；频率需真机日志确认 |
| Marker view | 纯缩放连续宽度更新，10 条 lead 始终完整 | 用户报告可更新但闪烁；没有 identity 丢失证据 |
| Native binding | 不跨 topology 时 0 次；跨 topology 时发生 3→8 replacement | binding replacement 是最可能导致 custom callout 短暂卸载/重挂的边界 |
| `setData` | 纯缩放 7 commits/s；程序化放大 8 commits/s | callback/native render 较慢时，同一 burst 更可能形成可见闪烁；待真机量化 |
| Native render | binding commit 后约 38ms 收到 map `updated`；view-only paint 不由该事件覆盖 | 真机底图/Marker 闪烁属于用户视觉事实；逐帧 native paint 尚无直接日志 |

### 是否存在不同代码路径

不存在按 `devtools/iOS/Android` 分叉的 Zoom → Presentation 业务代码。源码只把 `wx.getDeviceInfo().platform` 写入诊断和 render-error 元数据。差异来自微信原生组件暴露 scale 的时机、region event cadence、`setData` callback 与 native render 速度。

存在一种“交互来源”差异：

- 手势缩放：`regionchange + getScale sampler + post-end settle`；
- 点击聚合点：先设置 `targetScale/CAMERA_ANIMATING`，再走同一个 reconcile/presentation/projection/commit 管线。

## 根因定位

### 已确认根因 1：settle tail 无条件触发 Presentation

`scheduleNativeMapScaleSettle` 对每个合法 sample 都调用 `reconcileNativeMapCameraScale`。后者会记录阈值判断，但不会用判断结果中止；因此相同 scale 仍继续更新 camera、invalidate Presentation、重建 projection。日志中的 `15 → 15` 三连和 `shouldInvalidate=true` 是直接证据。

### 已确认根因 2：过度计算虽被差分提交部分吸收，仍形成突发

差分 commit 能把无变化结果变为 `SET_DATA_SKIPPED`，也能避免 view-only 更新重写 `mapNativeMarkers`；但它发生在 Projection 已完成之后，不能消除 9 次 Presentation/Projection。有效 view/progress 变化仍形成 7—8 次每秒 `setData`。

### 高置信度真机闪烁边界：burst + native binding replacement

当 scale 跨 topology 边界时，最新 topology barrier 最终仍需替换整组 native marker bindings。DevTools 证据显示 3→8 replacement 后触发 native map updated。设备端若此时还在处理高频 view/progress commits，custom callout 的卸载/重挂和 native map 重绘可能被肉眼看到。该判断不依赖空 projection、identity 或真实坐标变化。

### DevTools“拖动后才更新”的修正结论

当前构建无法复现“纯缩放完全不进入 Presentation”：原生地图双击纯缩放已完整更新。此前或特定触控板 pinch 中的“拖动后才补更新”，仍可由 native `getScale()` 在 begin/end 阶段返回旧值解释——下一次 region/pan 或 settle 才提供新 scale。异常在 native scale observation 的时机，不在 Presentation 是否存在。

## 修复方向（本轮未实施）

1. 让 settle sample 复用与 live sampler 相同的阈值门：scale 未跨阈值时不得 invalidate Presentation；最后一个 sample 只负责 settled/interaction state 收口。
2. 将 Camera state 收敛与 Presentation invalidation 分离，避免“状态需要结束”强迫“几何必须重算”。
3. 对同一 native callback 窗口内的 view/progress commit 做 latest-frame 合并；topology barrier 保持只提交最新 generation。
4. 真机日志门只需验证三项：`presentationsInLastSecond` 是否下降、stable-scale invalidation 是否为 0、topology replacement 前后是否仍出现可见空白/闪烁。

这些是下一轮修复方案，不属于本次诊断改动。

## 自动验证

- 定向 Vitest：3 files / 37 tests PASS；
- workspace Vitest：77 files / 844 tests PASS；
- TypeScript：PASS；
- ESLint：PASS；
- WXML/WXSS 原生编译：PASS；
- contracts/workflow、Next.js production build、V1-F preflight、scoped Prettier 与 `git diff --check`：PASS。

TASK-V2-17 Zoom → Presentation 触发链诊断完成，等待修复方案确认。
