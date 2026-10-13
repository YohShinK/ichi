# TASK-V2-17 Native Marker Stability Mode

状态：`IMPLEMENTED / AUTOMATED_GATES_PASS / AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`

## 1. 修改前问题

此前 Zoom deferred presentation 已停止 pinch 期间的 Marker projection，但 Pan 或程序化 camera settle 仍会启动约 240ms 的 reconcile。该 reconcile 会生成 7 个视觉帧，并连续提交 `mapNativeMarkerViews`；split/merge 还会在过程中重建 customCallout 子树或替换 native marker binding。Founder 反馈真机在首次拖动触发 reconcile 时仍明显闪烁，DevTools 相对自然。

## 2. 为什么关闭 Marker 动画

微信 Native Map 的 customCallout 不是普通 Web DOM。连续改变 width、transform、文本裁切或子树 topology 可能触发真机重新布局。此次实验把 Marker 降级为稳定地图实体：地图负责经纬度定位、平移与缩放；代码只在明确的最终状态变化时提交一次 binding/view projection，用于区分“连续 customCallout 更新”与“单次 native binding replacement”两类根因。

## 3. 修改文件

- `apps/client/miniprogram/platform/public-map-native-presentation.ts`
- `apps/client/miniprogram/platform/public-map-native-presentation.test.ts`
- `apps/client/miniprogram/pages/home/index.ts`
- `apps/client/miniprogram/pages/home/index.v2-map-deferred-presentation.test.ts`
- `apps/client/miniprogram/pages/home/index.v2-map-first-layout.test.ts`

未修改数据库、CloudBase、公开数据链、cluster engine、`publicLeadId`、BoardInstance、真实坐标、Info Card、Search、Filters、Bottom Nav 或 TASK-V2-18。

## 4. 删除的动态行为

- 移除 `easeOutCubic` 与 7 帧 deferred visual timeline。
- 移除 `interpolateNativeMapTopologyProjection` 驱动的连续 visual offset 更新。
- Marker 右侧宽度固定为 `72px`；total width、文本区域和 presentation progress 不再随 scale 变化。
- `visualOffsetX/Y` 固定为 `0`，不再通过 JS 插值移动 customCallout。
- Split 直接计算最终 children topology，一次提交最终 children binding。
- Merge 直接计算最终 cluster topology，一次提交最终 cluster binding。
- 保留单在途 `setData`、latest pending coalescing、差分 field signature 和 topology barrier；这些是 Native bridge 背压，不是视觉动画。

## 5. Marker 更新次数变化

| 场景 | 稳定模式行为 |
| --- | --- |
| 普通 Zoom | observation 更新；Marker commit `0` |
| Zoom 后普通 Pan | 计算最终投影；最多一次稳定提交；若签名不变则 `NO_CHANGED_FIELDS`，实际 `setData` 为 `0` |
| Split | 一次最终 children projection；一次 native binding replacement |
| Merge | 一次最终 cluster projection；一次 native binding replacement |
| Exact-overlap spiderfy | 仍保留 stable numeric marker id、真实坐标和 spiderfy 行为，按显式交互提交最终状态 |

## 6. Native binding replacement 次数

自动测试确认 Split 与 Merge planner 都只返回一个 `finalBindingProjection`，没有 initial/intermediate binding projection。页面 reconcile 不再启动 timer、requestAnimationFrame 或逐帧 `setData`。binding 是否实际写入仍由现有签名差分决定：topology 改变时为一次，topology 未改变时为零。

## 7. 自动测试结果

- Native marker stability targeted：`4 files / 42 tests PASS`
- Full workspace：`78 files / 849 tests PASS`
- TypeScript：PASS
- ESLint：PASS
- `node scripts/validate-workflow.mjs`：PASS
- `git diff --check`：PASS

## 8. DevTools 结果

本轮未由 Agent 启动或操作微信开发者工具；项目规则要求避免自动视觉验收，且不把源码测试冒充运行时证据。DevTools 结果待 Founder 按下述 Case 复核。

## 9. 真机测试结果

本轮未连接或操作 iOS/Android 真机，因此不能声称真机闪烁已消失。当前状态为 `AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`。请重点记录：

1. 只缩放：Marker 是否保持不闪、尺寸是否固定。
2. 缩放后拖动：Marker 是否只瞬间切换一次，是否仍闪。
3. Split：cluster → children 是否只发生一次替换。
4. Merge：children → cluster 是否只发生一次替换。

## 10. 下一步建议

如果真机拖动及 split/merge 均不闪，说明高概率根因是 JS 驱动的 customCallout 连续动画或高频 presentation 更新；后续再单独设计稳定动画。如果仍闪，则根因更接近 native marker binding replacement 本身，下一阶段再评估 Stable Native Marker Pool。本轮不提前实现该 Pool，也不解锁 TASK-V2-18。

最终状态：

`TASK-V2-17 Native Marker Stability Mode implemented / AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`
