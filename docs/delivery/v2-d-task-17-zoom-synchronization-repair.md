# TASK-V2-17 Zoom 同步与空投影修复

状态：`IMPLEMENTED / AUTOMATED_GATES_PASS / AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`

## 修改内容

1. Camera Scale 拆分为 target、observed、settled 三态。cluster camera command 立即提供 target；regionchange/getScale 提供 observed；settle tail/fallback 形成 settled。程序化 camera 未稳定时由 target 驱动 Presentation，新鲜 region scale 不再被紧随的旧 native read 回退。
2. query revalidation 使用 stale-while-revalidate。`INITIAL_LOADING / REFRESHING / CURSOR_RECOVERY` 的临时 0-marker 输入保留上一份稳定 Marker；新数据进入 `LOADED / EMPTY` 后一次替换。projection commit 层对 transient empty binding 另有防线。
3. Native topology 使用 120ms commit barrier。内部可以连续计算多个 generation，但 binding 只提交稳定窗口内最新 generation；等待期间继续 rescale 已提交 topology 的 Marker 宽度，避免 `3→6→7→8` 每一步都替换 Native Marker 数组。
4. 临时诊断继续开启，新增 target/observed/settled、projection/topology/barrier generation 和 marker binding commit 字段。

## 根因对应关系

| 已确认问题 | 对应修复 |
| --- | --- |
| DevTools `getScale()` 在 zoom 后短时返回旧值 | target/observed/settled 分离；target 与新鲜 region observation 不再被旧 read 覆盖 |
| viewport query 出现 `LOADED(10) → INITIAL_LOADING(0) → LOADED(10)` | loading 期间保留稳定 Marker，终态才替换；提交层阻止 transient empty projection |
| 同一次 zoom 连续提交 3/6/7/8 个 native bindings | 120ms latest-generation topology commit barrier |
| setData callback 时序在真机上可能放大中间态 | 单在途背压继续保留，barrier 只允许最新稳定 topology 穿透 |

当前证据仍不支持 cluster engine、`publicLeadId`、真实坐标或 Marker identity 出错。

## 真机测试指导

在 iOS 与 Android 各执行以下动作，并在真机调试 console 过滤 `TASK-V2-17_ZOOM_TRACE`：

1. 慢速双指放大／缩小：Marker 文本宽度和 split/merge 应随 zoom 更新，不需要额外拖动。
2. 快速连续缩放：Marker 不应整体消失，不应出现空白帧或明显闪烁。
3. 缩放同时拖动：最终 Marker topology 应与最终 viewport 一致，不应被旧 generation 回写。
4. 点击聚合点执行程序化 zoom：日志应先出现 `targetScale`，即使 observed 仍旧，Presentation 也应使用 target；settled 后 target 变为 `null`。
5. 观察日志：revalidation 期间如计算出 0 view，应看到 `TRANSIENT_EMPTY_PROJECTION_RETAINED`，而不是 0 binding 的 `SET_DATA_COMMIT`；连续 topology 应看到 `TOPOLOGY_COMMIT_BARRIER`，最终 binding commit 只对应最新 generation。

若仍闪烁，请保存闪烁前后完整 trace，重点提供设备型号、系统版本、微信版本、基础库版本、`commitsInLastSecond`、`topologyBarrierGeneration` 与 `markerBindingCommit`。

## Marker 几何差异

本轮没有修改 Marker 字体、card 尺寸、anchor、badge、Web Mercator 坐标或 screen-space offset 公式。若不同真机仍存在文字基线、圆角或像素级偏移，那属于既有 Native custom-callout 几何／文字测量差异，不是本轮 Zoom 同步或空 projection 修复引入；需用真机截图单独确认，当前不能宣称已消除。

## 自动验证

- targeted：6 files / 99 tests PASS；
- workspace：77 files / 843 tests PASS；
- ESLint、TypeScript、contracts/workflow、V1-F preflight：PASS；
- Next.js production build、scoped Prettier、`git diff --check`：PASS；
- 未 commit、push、deploy 或开始 TASK-V2-18。
