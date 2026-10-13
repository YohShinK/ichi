# TASK-V2-17 真机渲染修复

日期：2026-09-20  
状态：`IMPLEMENTED / AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`

## 平台结论

微信原生组件在受支持基础库中使用同层渲染，因此搜索、品牌、筛选、Info Card 与 Bottom Nav 不应为规避一个未经证实的层级假设而迁入能力受限的 `cover-view`。地图控件和 Marker custom callout 继续使用 map 内 cover 结构；`bindrendererror` 负责暴露不支持、内核缺失或节点树异常等真实平台失败。

`cover-view` 只依赖稳定支持的布局、transform 与 opacity。运行时 `cover-image` 不再使用真机支持不一致的 SVG，而使用 PNG。

## 已实施

- `public-map-native-presentation.ts`：split children 固定在目标 native binding，merge children 固定在来源 binding；中间帧只计算 `visualOffsetX/Y`。真实坐标、display coordinate、stable marker id、cluster topology 与 representation invariant 保持原语义。
- `pages/home/index.ts`：移除 `toScreenLocation` transition ghost；非 camera transition 与 camera-progress transition 共用 stable-anchor projection。`setData` 只有一个提交在途，pending 始终覆盖为最新帧；binding 与 view 独立签名，避免 unchanged marker array 写回。`getScale()` 只在上一调用完成或 watchdog 到期后继续。
- `pages/home/index.wxml`：custom callout 使用单一 slot 容器；增加 `bindrendererror` 和恢复态；定位／刷新 icon 改为 PNG。
- `pages/home/index.wxss`：badge、stack 和 tail 收进 Marker shell；移除负溢出、shadow、单边 border 与不受支持的 transition；Marker 字重收敛到已打包范围 800。

## 保持不变

cluster 核心算法、`publicLeadId`、真实经纬度、公开数据结构、Info Card、搜索／筛选语义、Bottom Nav、TASK 14/15 保证和 TASK 18 均未改变。

## 验收边界

自动验证负责 projection invariant、源码结构、类型、lint、build、WXML/WXSS 编译与模拟运行。最终仍需 Founder 在 iOS/Android 真机检查：全部 overlay、慢速 pinch、split/merge、badge、exact-overlap spiderfy、定位允许／拒绝，以及 console 中是否出现 `rendererror`。

已通过：targeted `2 files / 30 tests`、workspace `76 files / 837 tests`、TypeScript、ESLint、contracts/workflow、Next.js production build、V1-F preflight、WXML/WXSS 原生编译。复用现有微信开发者工具实例的非视觉运行时检查得到 `8 views / 10 represented leads`、settled offsets 全部为 0、native anchors `alpha=0`、`mapNativeRenderError=""`，console 无 error/warn/fail。
