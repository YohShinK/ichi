# TASK-V2-17 Zoom Deferred Marker Presentation

## 交付状态

`TASK-V2-17 Zoom Deferred Marker Presentation implemented / AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`

本轮仍属于 `V2-D / TASK_V2_17_NATIVE_MAP` 活动区块，没有解锁 TASK-V2-18。
未执行 commit、push、deploy 或 publish。

## 1. 修改前问题

旧实现把原生地图的 scale observation 直接绑定到 Marker Presentation / Projection / Native Binding 链路。一次 Zoom 在不足一秒内可能连续触发 Presentation、Projection 和多次 `setData`；post-end settle tail 在 scale 已稳定后仍可能重算 Presentation；跨 topology 边界还会出现整组 native marker binding replacement。真机上这条高频提交链表现为 Marker 闪烁和重挂载压力。

现有诊断没有发现 `publicLeadId`、真实坐标、BoardInstance identity 或 cluster engine 核心判定错误。本轮因此只改变 Zoom 到 Marker Presentation 的调度边界。

## 2. 新交互策略

Camera 与 Marker Presentation 现在是两个独立状态层：

| 状态 | 作用 | Zoom / Pinch | Reconcile |
| --- | --- | --- | --- |
| `observedScale` | 原生地图真实观察到的 scale | 持续更新 | 作为最新目标 |
| `presentationScale` | 当前屏幕 Marker 外观对应的稳定 scale | 保持不变 | 按视觉帧推进 |
| `targetPresentationScale` | 当前一次 reconcile 的目标 | 不设置 | 开始时设为 `observedScale` |

Zoom / Pinch 只更新 `observedScale` 与 Camera 诊断，不触发 Marker Projection、Presentation 或 binding commit。下一次真实 Pan 只有在 `abs(observedScale - presentationScale) > epsilon` 时才启动一次 reconcile。普通 Pan 没有 scale gap 时是 no-op。程序化 cluster camera zoom 在 settle / fallback 后只启动一次同样的 reconcile。

## 3. 实际修改文件

- `apps/client/miniprogram/platform/public-map-render-scheduler.ts`
  - 拆分 `observedScale`、`presentationScale`、`targetPresentationScale`。
  - 提供 deferred reconcile 的 begin / complete / cancel 状态操作。
- `apps/client/miniprogram/platform/public-map-native-presentation.ts`
  - 新增 240ms `easeOutCubic` reconcile plan。
  - 固定 7 个候选视觉帧，拓扑方向只计算一次。
  - 明确 topology unchanged、SPLIT、MERGE 的 binding 顺序。
- `apps/client/miniprogram/pages/home/index.ts`
  - Pinch / regionchange / scale sampler 改为 observation-only。
  - 通过既有 regionchange、`getScale()`、`getRegion()` 判断 Pan。
  - 维护 reconcile generation、取消旧动画、单在途 `setData` 与 latest-frame-wins pending。
  - query revalidation 期间不让状态层直接刷新 Zoom-time Marker Presentation。
  - 程序化 cluster camera settle 只触发一次 reconcile。
- `apps/client/miniprogram/platform/public-map-render-scheduler.test.ts`
- `apps/client/miniprogram/platform/public-map-native-presentation.test.ts`
- `apps/client/miniprogram/pages/home/index.v2-map-deferred-presentation.test.ts`
- `apps/client/miniprogram/pages/home/index.v2-map-first-layout.test.ts`
  - 覆盖冻结、Pan、普通 Pan、topology unchanged、split、merge、取消、程序化 zoom 和“我的”页面隔离。
- `memory-bank/design-document.md`
- `memory-bank/tech-stack.md`
- `memory-bank/architecture.md`
- `memory-bank/implementation-plan.md`
- `memory-bank/progress.md`
  - 同步正式产品行为、技术边界、真实结构、实施状态和验收状态。

本轮没有修改 `index.wxml`，也没有修改 cluster engine、公开数据链、Info Card、Search / Filters、Bottom Nav、V1 或后端。

## 4. 数据流与 Zoom freeze

```text
native regionchange / getScale
        |
        +--> observedScale  ---- only Camera diagnostics
        |
        +--> presentationScale stays at last committed visual state

next real Pan with scale gap
        |
        +--> targetPresentationScale = observedScale
        +--> one deferred reconcile plan
        +--> bounded visual commits
        +--> presentationScale = targetPresentationScale
```

Zoom sampling、region end 和普通 settle tail 不调用 `projectNativeMapPresentationAtScale()`，也不提交 `mapNativeMarkerViews` 或 `mapNativeMarkers`。新的 scale observation 如果发生在 reconcile 中，会递增 generation、停止旧 timeline，并保留最后一次已经提交的 Projection 作为新的视觉起点。

## 5. Pan reconcile 动画

- 曲线：`easeOutCubic`。
- 时长：240ms。
- 默认视觉帧：7 个候选帧；split / merge 额外包含一次结构边界提交，但总量保持不超过 10 次。
- 提交背压：同一时刻最多一个 `setData` 在途；pending 只保留最新 Projection，旧中间帧不会排队补发。
- topology unchanged：只更新 view presentation，`mapNativeMarkers` 不写入。
- 动画完成后清理 `targetPresentationScale`，没有额外的 post-zoom timeout refresh。

## 6. Split / Merge 提交顺序

### Split: cluster -> children

1. 以最终 target scale 计算一次 children topology。
2. 等一次 `Cluster binding -> Child bindings` replacement 的 `setData` callback。
3. children 从 cluster 中心的 display-only offset 开始，使用有限视觉帧展开到最终位置。
4. 最后一帧完成后将 `presentationScale` 收口到 target；不产生中间 topology。

### Merge: children -> cluster

1. 暂时保留旧 child bindings。
2. 用 display-only offset 将 children 收拢到最终 cluster 中心。
3. 最后一帧 callback 后只做一次 `Child bindings -> Cluster binding` replacement。
4. 收口 `presentationScale`，不让 native marker 在收拢期间提前消失。

## 7. 提交数量约束

| 场景 | Projection rebuild | Presentation / visual commits | Native binding commits |
| --- | ---: | ---: | ---: |
| Zoom / Pinch observation | 0 | 0 | 0 |
| topology unchanged reconcile | 1 个最终 Projection | <= 10 | 0 |
| Split reconcile | 1 个最终 topology | <= 10 | 1 |
| Merge reconcile | 1 个最终 topology | <= 10 | 1 |

`mapNativeMarkers` 与 `mapNativeMarkerViews` 继续使用字段差分；没有变化的 binding array 不会写回。

## 8. 自动验证

本轮自动门禁结果：

- 定向 deferred / scheduler / presentation：`3 files / 23 tests PASS`。
- 地图相关套件：`15 files / 228 tests PASS`。
- workspace Vitest：`78 files / 855 tests PASS`。
- TypeScript（root + web）：PASS。
- ESLint：PASS。
- contracts / workflow：PASS。
- V1-F preflight：PASS。
- Next.js production build：PASS。
- WXML/WXSS 原生编译：PASS。
- scoped Prettier：PASS。
- `git diff --check`：PASS。

构建中仅保留已有环境提示：部分 CloudBase 包建议 Node 20，当前 workspace 使用 Node 24；Next.js ESLint 插件提示不影响构建结果。

## 9. WeChat DevTools 实测

复用已有微信开发者工具实例及单一 automator endpoint `ws://127.0.0.1:9423`，没有启动第二个 IDE。运行证据位于：

- `artifacts/task17-deferred-presentation/devtools-runtime-summary.json`
- `artifacts/task17-deferred-presentation/devtools-map.png`
- `artifacts/task17-deferred-presentation/devtools-my.png`

实测结果：

- Case 1（只 Zoom，不 Pan）：4 次 scale observation；Presentation commits `0`、Projection rebuilds `0`、Native binding commits `0`，Marker binding 保持稳定。
- Case 2（Zoom 后第一次 Pan）：启动 1 次 reconcile，提交 8 个视觉帧，发生 1 次 SPLIT binding replacement，最终完成。
- Case 3（连续 Zoom -> Pan -> Zoom -> Pan）：旧 generation 被取消且不再完成；新的 observed scale 重新 reconcile 并完成。
- 普通 Pan（无 scale gap）：`startNativeMapDeferredReconcile()` 返回 no-op，没有新增 reconcile。
- Case 4（cluster 程序化放大）：settle 后只启动 1 次 `PROGRAMMATIC_CAMERA_SETTLE` reconcile；本次运行无重复 binding commit。
- 页面回归：切换后 `activeTab="my"`、`currentView="my"`，My 页面可创建和显示；运行时 exception 数为 `0`。

开发者工具结果证明调度链和页面回归，不等价于 iOS / Android 真机原生 Map 与 custom callout 的绘制结论。

## 10. Founder 真机仍需检查的 6 个点

1. 慢速、快速和连续 pinch 时 Marker 是否稳定、不闪烁。
2. Zoom 后第一次拖动时，Marker 是否从旧表现平滑补到正确 scale。
3. split / merge 是否只发生一次，children 展开与收拢是否连贯。
4. 是否仍出现整组 Marker 消失后再出现、custom callout 重挂或空白帧。
5. cluster 程序化放大是否自然且不要求额外手拖；exact-overlap / spiderfy 规则是否保持。
6. My 页面、Bottom Nav、Search / Filters、Brand、Info Card、定位允许／拒绝和其他非地图内容是否正常。

## 11. 几何偏移与剩余风险

本轮没有重新设计 Marker 几何，也没有引入经纬度插值或 `toScreenLocation` ghost。DevTools 运行时没有抛出异常；但真机 custom callout 字体测量、原生 binding replacement 的卸载/重挂边界和设备渲染时序仍可能造成平台特有偏移或闪烁，必须由 Founder 真机确认。

如果真机仍在单次 split / merge replacement 处闪烁，当前判断应集中到 Native Map 整组 binding replacement / custom callout 卸载重挂边界，而不是重新增加 scale threshold、settle tail 或高频刷新。本轮不实现 Stable Native Marker Pool。

## 12. Founder 真机反馈与新的根因边界

Founder 已在真机确认：

- pinch 放大和缩小过程中没有闪动；
- 拖动地图触发从上一个缩放状态切换到下一个缩放状态时，Marker 变换阶段仍有强烈闪动。

这说明 Camera observation / Zoom freeze 已经解决了原来的高频 Zoom 闪动，但没有解决 Marker 变换自身的原生渲染稳定性。当前代码存在两个需要分离验证的重绘边界：

1. `startNativeMapDeferredReconcile()` 在 240ms 内连续提交 7—8 次 `mapNativeMarkerViews`；每帧同时改变 callout 根节点的 `transform`、`shellWidth`、卡片 `width` 和右栏 `width`。这些字段最终都进入同一个 `<map>` 的 `cover-view slot="callout"` 子树，微信 Native Map 可能把这种更新按 custom callout 重绘或重建处理。
2. split / merge 的拓扑边界会改变 `mapNativeMarkers` binding；WXML 中 `kind === 'CLUSTER'` 还会切换 stack、badge 等 `wx:if` 子树。即使 binding replacement 只有一次，真机原生 map 仍可能卸载并重挂整组 custom callout。

因此，“Zoom 不闪、Pan reconcile 闪”不是 scale 观察链再次失控，而是 Marker presentation 到 Native Map custom callout 的变换边界不稳定。下一步应先做 A/B：固定 binding 只更新 view，和固定 view 只做一次最终提交，分别确认每帧 callout 重绘与单次 binding replacement 哪一个是主因。若两者都能单独触发闪动，则需要进入 Stable Native Marker Pool 方案，保持 native marker identity 与 callout subtree 常驻，只更新 display-only state；本轮不盲目继续调 threshold 或 settle tail。

## 13. 范围声明

没有修改：

- V1、识别 Prompt / Schema / Resolver、H0 / R2 冻结内容；
- cluster engine 核心判定、`publicLeadId`、BoardInstance identity、真实经纬度；
- BoardObservation -> PublicMapLead 数据链、CloudBase、数据库、backend；
- Search / Filters 业务语义、Info Card、Bottom Nav、My 页面结构；
- TASK-V2-18—22。

最终状态：

`TASK-V2-17 Zoom Deferred Marker Presentation implemented / AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`
