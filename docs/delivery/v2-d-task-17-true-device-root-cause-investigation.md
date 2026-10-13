# TASK-V2-17 真机渲染根因调查报告

日期：2026-09-20  
范围：`apps/client/miniprogram/pages/home` 原生地图运行时  
状态：`SUPERSEDED_BY_PLATFORM_VERIFICATION / REPAIR_IMPLEMENTED`

> 2026-09-20 更正：后续对微信官方组件文档的核验确认，现代基础库的原生组件支持同层渲染，普通 WXML sibling 并非“必然被 map 覆盖”。本报告中把该推断列为 P0 高置信度以及建议把搜索、筛选、Bottom Nav 全部迁入 `cover-view` 的结论已撤回。真实高置信度根因是 transition 中逐帧改写 native marker 经纬度、并发／高频 `getScale → setData` 压力、`cover-view` 不支持的负溢出／阴影／非 transform transition，以及 map 内 SVG 的真机兼容风险。修复与当前权威结论见 `docs/delivery/v2-d-task-17-true-device-render-repair.md`。

## 调查边界

本报告执行 `/Users/cunfu/Downloads/ICHI_TASK-V2-17_真机渲染根因确认.md` 中的调查要求。只做源码、运行时证据和平台边界确认，不修改 cluster 算法、identity、数据结构、Info Card 或 TASK-V2-17 已完成交互，也不开始 TASK-V2-18。

现有微信开发者工具证据证明了桌面预览中的布局、Marker representation invariant 和 camera-progress 插值；当前工作区没有 Founder 真机日志或真机帧率采样，因此真机部分按“源码已确认”“高概率平台差异”“仍需真机复现”分级，不把模拟器结果冒充真机通过。

## 结论摘要

1. 真机 UI 消失的首要根因是原生 `<map>` 与普通 WebView sibling 的渲染层边界：地图顶部的搜索、品牌、筛选和 Bottom Nav 是普通 `view`，而 Marker、红色角标和浮动地图按钮才是 `<map>` 内的 `cover-view`。开发者工具对 z-index 的容忍度不能代表真机 Native Map Layer 行为。
2. Marker 闪烁的首要高风险根因是 camera scale 采样期间每 40ms 调用一次 `setData` 更新 `mapNativeMarkerViews`；split/merge 中间帧又会改变每个 binding 的经纬度，触发整组 `mapNativeMarkers` 替换和 Native Map 重绘。
3. 数字偏移和字体差异更可能来自 `cover-view` 的原生文字测量与自定义字体权重，而不是 rpx 换算：地图 Marker 使用 px，但 `@font-face` 只声明 500—800，Marker 文本却请求 `font-weight: 900`。
4. 红色提醒角标已经在正确的 Native cover 层，但使用嵌套 `cover-view`、负 `top/right`、`overflow:visible` 和 z-index；真机若缺失，优先怀疑 cover-view 的裁剪/布局限制或高频重绘丢帧，而不是普通 WebView 被地图盖住。
5. 当前 pinch 链路没有再把观测 scale 回写到 `mapNativeScale`，所以旧的 `regionchange → setData(scale) → regionchange` 反馈循环已被拆开；但 `regionchange` 仍只有 begin/end，40ms `getScale()` 轮询和 end 后 settle tail 仍构成较高的真机更新压力。

## 证据与根因分类

### A. Native Map 渲染问题

**问题：** 真机上顶部搜索框、品牌图标、筛选按钮或 Bottom Nav 消失；Marker 与地图仍存在。

**可能原因：** `<map>` 是 Native Component，普通 sibling `view` 位于 WebView Layer，真机上 Native Map Layer 会覆盖其 z-index；开发者工具可能没有完全复现该层级规则。

**证据：** `index.wxml:170-187` 中 `<map>` 包含 Marker callout、红色 badge 和浮动按钮；`index.wxml:188-205` 的 edge fade、状态、搜索、品牌和筛选位于 `</map>` 之后，是普通 `view`。Bottom Nav 在 `index.wxml:351` 也位于 map 外。`index.wxss:958-965` 给顶部 overlay `z-index:30`，但 z-index 不能把普通 WebView sibling 提升到 Native Map Layer 之上。

**验证方式：** 真机开启地图页后固定相机，分别只显示一个普通 sibling、一个 map 内 `cover-view`，记录两者是否都可见；再对比开发者工具。若 sibling 消失而 cover-view 可见，即可确认 Native Map Layer 覆盖。

**结论：** 高置信度，属于微信平台渲染层限制，不是地图数据或筛选状态问题。

### B. cover-view 层级与角标问题

**问题：** 叠加态 Marker 的红色提醒角标在真机缺失。

**可能原因：** 角标虽然属于正确的 cover 层，但它是嵌套 `cover-view`，使用 `top:-9px/right:-9px`、`z-index:6` 和父节点 `overflow:visible`。部分真机版本对 Native cover 子树的负溢出、层叠和重排支持不等同于开发者工具。

**证据：** `index.wxml:173-177` 中 badge 由 `wx:if` 条件渲染的 `<cover-view class="native-marker-badge">` 构成；`index.wxss:1147-1154` 的 callout 为 `overflow:visible`，`index.wxss:1294-1312` 的 badge 使用负偏移、圆形 border、box-shadow 和 z-index。它不属于普通 WebView，因此“被 map 盖住”不是首要解释，但 Native cover 的裁剪和条件重排仍是平台风险。

**验证方式：** 真机临时将角标改为父卡体内部、零负偏移、无 box-shadow 的静态 cover-view；若出现则逐项恢复负偏移、z-index、条件渲染，定位是裁剪还是重排。保持 `mapNativeMarkerViews` 不更新时再测试一次，以排除采样压力。

**结论：** 中置信度平台限制，需真机最小复现确认；代码层级归属本身正确。

### C. Marker 更新问题

**问题：** Marker 在真机闪烁、短暂消失或排版在缩放时跳变。

**可能原因：** 40ms scale 采样导致约 25Hz 的 `setData`；每次都会更新 `mapNativeMarkerViews`。在 split/merge 中间帧，插值后的经纬度发生变化，binding signature 也随之变化，`mapNativeMarkers` 整体被替换，促使 Native Map 重建 marker。

**证据：**

- `index.ts:4774-4800` 在手势期间用 `setTimeout(sample, 40)` 调用 `context.getScale()`。
- `index.ts:4515-4539` 的每帧 `commitNativeMapProjection()` 都写入 `mapNativeMarkerViews`。
- 同一函数的 binding signature 包含 `id:latitude:longitude`（`index.ts:4521-4530`）；只要插值坐标变化就把完整 `mapNativeMarkers` 写回 `setData`。
- `index.ts:4710-4717` 在 camera transition 每个样本生成插值 frame；因此 split/merge 期间同时存在 cover-view 重排和 Native marker binding 替换。
- `index.wxss:1153`、`1190-1193`、`1250` 的 CSS transition 只有 60—120ms，不能抵消 Native marker 数组重建的成本。

**验证方式：** 增加开发模式计数器记录 gesture duration、`getScale` 调用数、`mapNativeMarkerViews` 写入数、`mapNativeMarkers` 写入数和每次写入耗时；真机以 40ms、80ms、仅 settle 三组运行，记录掉帧、闪烁和丢 Marker 的关联。若 `mapNativeMarkers` 写入与闪烁同步，即可确认。

**结论：** 高置信度性能根因，尤其影响 split/merge；不表示 cluster 算法错误。

### D. Camera 状态问题

**问题：** 真机缩放结束时 Marker 状态滞后、出现二次跳变或手势结束后仍有短暂闪烁。

**可能原因：** 微信 `regionchange` 只提供 begin/end；中间 camera 状态必须通过 `getScale()` 轮询。end 回调还会立即读取 scale/region，并继续 8 次、每次 80ms 的 settle tail；它与 900ms cluster camera fallback、Native Map 自身动画收敛可能重叠。

**证据：** `index.ts:5007-5060` 只对 begin/end 分支处理；`index.ts:4774-4800` 以 40ms 轮询 scale；`index.ts:5069-5107` 在 end 时再次调用 `getScale()`/`getRegion()` 并安排 settle；`index.ts:4803-4849` 的 settle tail 最多覆盖 640ms。cluster 点击还在 `index.ts:4987-5004` 写入目标 `mapNativeScale` 并保留 900ms fallback。

**当前已排除：** pinch 期间没有把观测 scale 回写到 `mapNativeScale`；`reconcileNativeMapCameraScale()` 只更新呈现，因此旧的 `regionchange → setData(scale) → regionchange` 反馈循环不再成立。

**验证方式：** 真机记录带时间戳的 `regionchange begin/end`、`getScale` 回调、`setData`、fallback 和 settle 完成顺序；检查一次手势是否有多个并行 generation、是否在最后一个 native scale 稳定前提交了 topology。

**结论：** 反馈循环已修复；更新压力和结束阶段竞态仍是中高风险的 Camera 状态问题。

### E. CSS / 字体问题

**问题：** 少数数字偏移、字体粗细不同、Marker 文字宽度与开发者工具不一致。

**可能原因：** `cover-view` 使用原生文字排版，真机字体测量、DPR、字体加载时机和 variable font weight 支持可能与开发者工具不同；当前自定义字体权重声明与实际使用不一致。

**证据：** `index.wxss:1221-1236` 的数字使用 `font-family: "Marker Jakarta", "Arial Black", sans-serif` 和 `font-weight:900`；`marker-font.wxss:4-9` 的 `@font-face` 只声明 `font-weight:500 800`。Marker 的尺寸、padding、line-height 均以 px 定义（`index.wxss:1147-1280`），目标路径没有 rpx Marker 尺寸；因此没有直接的 rpx→px 根因证据。`transform:translate(-50%,-50%)` 以及 stack/selected transform 仍属于 Native cover 的平台兼容风险。

**验证方式：** 真机分别使用系统 sans-serif、已声明范围内的 700、当前 900 三组截图；记录 `cover-view` 数字左右边界和 baseline。若仅 900 或自定义字体出现差异，根因是字体权重/测量，不是 DPR 换算。

**结论：** 高概率字体测量/权重问题；直接 rpx/DPR 错误为低概率。

### F. 微信平台限制

**问题：** 开发者工具正常，真机出现层级、字体、闪烁差异。

**可能原因：** Native Map Layer、cover-view 子树、WebView CSS、DPR/字体栈和地图内部重绘在开发者工具中不是同一个渲染实现；平台版本还可能对 `cover-view` 的 overflow、z-index、transform 和自定义字体有差异。

**证据：** 当前页面同时使用 Native `<map>`、map 内 `cover-view/cover-image`、map 外普通 `view/input/button`，并且在 camera 采样期间持续变更这些节点的数据；这是最容易出现工具/真机分叉的组合。

**验证方式：** 以同一 commit、同一账号、同一 viewport，至少在 iOS/Android 各一台真机运行静态地图、慢速 pinch、cluster split/merge、角标和顶部 overlay 五个用例；每个用例保存截图和 console/performance 日志。

**结论：** 平台差异是放大器；主因仍按上述 A—E 排序处理。

## 根因排序

| 优先级 | 问题 | 置信度 | 主要证据 | 影响 |
| --- | --- | --- | --- | --- |
| P0 | 普通 WebView sibling 被 Native Map Layer 覆盖 | 高 | map 外的普通 view 与 map 内 cover-view 分离 | 顶部搜索、品牌、筛选、Bottom Nav 真机消失 |
| P0 | 40ms `getScale` + 高频 `setData`，split/merge 时整组 markers 重写 | 高 | `index.ts:4515-4539, 4710-4717, 4774-4800` | Marker 闪烁、丢帧、短暂消失 |
| P1 | `font-weight:900` 超出自定义字体 500—800 声明范围 | 高 | `index.wxss:1231-1235`, `marker-font.wxss:4-9` | 数字宽度、baseline、粗细与工具/真机不一致 |
| P1 | badge 的负偏移、嵌套 cover-view 和 overflow/z-index | 中 | `index.wxml:173-177`, `index.wxss:1294-1312` | 红色角标在部分真机裁剪或丢失 |
| P1 | end + settle tail + camera fallback 的状态竞态 | 中 | `index.ts:4803-4849, 4987-5004, 5069-5107` | 结束后二次跳变、状态短暂错误 |
| P2 | 直接 rpx/DPR 换算错误 | 低 | Marker 路径统一使用 px，无 rpx 尺寸 | 不应作为首要修复方向 |

## 开发者工具与真机差异表

| 问题 | 开发者工具 | 真机 | 可能层级/原因 |
| --- | --- | --- | --- |
| Marker 字体与数字 | 通常稳定 | 少数数字偏移、粗细/宽度不同 | Native cover text、字体权重 900、DPR/字体加载 |
| 红色提醒角标 | 可见 | 可能缺失或被裁剪 | Native cover 子树、负偏移、overflow/z-index |
| 顶部搜索/品牌/筛选 | 可见 | 可能消失 | 普通 WebView sibling 被 Native Map Layer 覆盖 |
| Bottom Nav | 可见 | 可能被地图层盖住 | map 外普通 `view`，不是 cover-view |
| Marker 闪烁 | 桌面帧率足够时不明显 | 更明显 | 40ms `getScale` + setData，topology 帧替换 markers |
| cluster split/merge | 逻辑正确、动画连续 | 可能重绘/跳变 | Native marker array 重写叠加 camera settle |
| pinch 状态回弹 | 当前工具复核已无旧反馈循环 | 仍需慢速真机确认 | 观测 scale、native camera 收敛和 settle tail 时序 |

## 下一步修复建议（不在本任务实施）

| 文件 | 修改方向 | 风险 | 对 TASK-V2-17 已完成部分的影响 |
| --- | --- | --- | --- |
| `apps/client/miniprogram/pages/home/index.wxml` | 将必须覆盖地图的品牌/搜索/筛选/Bottom Nav 重新放入可在 Native Map Layer 上方工作的原生覆盖结构；保留现有 data-testid、事件和 Info Card 结构 | cover-view 支持的 CSS/交互能力更窄，需要逐项回归输入、滚动和点击 | 不应改变 cluster、identity、Info Card 或真实坐标；需 Founder 真机验收 |
| `apps/client/miniprogram/pages/home/index.ts` | 将“原生 marker binding 更新”和“callout 视觉更新”拆开；对 40ms 样本做帧合并/节流，拓扑只在稳定提交点替换 `mapNativeMarkers`；保留 generation guard | 过度节流会让缩放视觉滞后；必须以真机帧率和 representation invariant 共同验收 | 只应改善渲染调度，不改聚合算法和交互语义 |
| `apps/client/miniprogram/platform/public-map-native-presentation.ts` | 保持 stable native binding/anchor；让中间帧尽量只更新可见 callout，避免每帧变更 marker 经纬度；继续保留真实坐标与 display 坐标分离 | 可能影响 split/merge 的空间连续性，需要保留插值公式和每个 lead 恰好一次 | 不应改变已完成的 split/merge 方向、spiderfy、identity 和真实坐标 |
| `apps/client/miniprogram/pages/home/index.wxss` 与 `marker-font.wxss` | 把 Marker 文本权重收敛到字体实际声明范围，或提供真机可验证的明确 900 字体；减少 cover-view 对负 overflow、复杂 transform 和不必要 shadow 的依赖 | 视觉粗细和尺寸会改变，必须与 Founder reference 对照 | 只影响 Marker 渲染，不影响数据/交互契约 |
| `apps/client/miniprogram/pages/home/index.ts` | 增加 dev-only 渲染诊断：采样频率、`setData` 次数/耗时、marker array replacement 次数、regionchange/getScale/fallback 顺序 | 日志本身增加少量开销，必须可关闭且不进入生产噪声 | 不改变业务行为；用于真机 Evidence Gate |

## 真机确认矩阵

在任何修复方案确认前，需要 Founder 或授权测试者在真机完成：

1. 静态地图：顶部搜索、品牌、筛选、Bottom Nav、定位/刷新按钮同时可见且可点击。
2. 慢速双指缩放：Marker 宽度、数字 baseline、标签裁切连续，无闪烁、空洞或回弹。
3. cluster split/merge：每一帧没有重复/丢失 lead，结束后无二次跳变。
4. 叠加态 Marker：红色角标在不同 DPR 和 iOS/Android 上均可见且不被裁剪。
5. 精确重叠 spiderfy：子 Marker identity、真实坐标和 Info Card 仍保持现有 TASK14/15 语义。

TASK-V2-17 真机渲染根因调查完成，等待修复方案确认。
