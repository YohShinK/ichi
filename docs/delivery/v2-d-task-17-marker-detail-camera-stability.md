# TASK-V2-17 Marker 详情稳定与相机平移

状态：`ROOT_CAUSE_CORRECTED / AUTOMATED_GATES_PASS / AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`

## 2026-09-22 详情安全间距与相机帧调度补充

- Marker 详情相机目标增加 `72px` 的垂直安全间距，使 Marker 尖尾和卡体整体位于详情卡上方，避免卡片覆盖 Marker。
- 相机 tween 保持现有 cubic ease-in-out（慢起步、中段加速、末段减速），帧调度改为基于时间进度的约 `16ms` 高频提交，不再等待 `setData` 回调串行推进；旧动画仍可取消并由新 Marker 抢占。
- 更新静态回归以锁定 `NATIVE_MARKER_DETAIL_TARGET_OFFSET_Y_PX = 72`，并放宽 Fake Timer 对终点浮点舍入的断言，只验证相机不越过目标。

## 2026-09-22 详情卡固定与赏级横向滚动补充

- 详情卡主体由纵向 `scroll-view` 改为固定高度的普通 `view`，保留卡片内部展开备注的独立滚动，不再允许整张详情卡上下拖动。
- 赏级区块保持两行布局；`tierColumnCount = ceil(tierCount / 2)`，因此当前 A-F 仍是两行，未来超过当前列数的赏级会在同一横向 `scroll-view` 中继续排列并滚动。
- 赏级轨道继续使用 `enhanced`、`scroll-x` 和 `bounces=true`，保留微信原生横向滚动的边界弹性。

## 2026-09-22 地图手势／空白点击清除选择补充

普通 Marker 的选择态现在遵守统一 dismissal 规则：用户拖动／缩放地图的 `regionchange begin causedBy=gesture`，或点击独立空白区域时，同步关闭详情、清除 PublicMapClient selection、取消 lead camera tween，并把 customCallout／Canvas Marker selected visual 恢复为未选择态。程序化 `update`、active camera tween 与 cluster expansion 不会误关详情。

同一 Marker 触摸可能附带一个 native surface tap；该事件只在 160ms 短窗口内消费一次。旧 900ms guard 以及 `OPENING/CAMERA_ANIMATING` 全阶段阻断已移除，因此后续真实空白点击不会再被吞掉。

## 问题与根因

Founder 真机复验确认上一版根因判断不完整：surface tap 不是 A→B 必现闪退的主要路径。相机移动结束后，`regionchange` 会在视野超出已加载 bbox 时触发 `PublicMapClient.changeQuery()`；旧 `#loadRoot()` 无条件清空 detail 并递增 selection generation。页面订阅随即关闭卡片，而 B 正在返回的 detail response 也会因 generation 失效被丢弃，因此表现为“出现一下，立刻消失”。

上一版改用 `MapContext.moveToLocation` 后虽然避免一次性受控中心写入，但该接口不暴露 duration/easing，无法保证用户要求的慢起步—中段快—末段减速。

## 修正

- Root viewport query 不再递增 detail selection generation，也不再重置 detail；query 开始、成功、失败和竞态响应都保留当前详情选择。
- 显式 `selectLead/clearSelection`、suppression 与 `LEAD_UNAVAILABLE` 仍是详情 generation/lifecycle 的 owner，latest-selection-wins 不变。
- 普通 Marker camera 改为 420ms cubic ease-in-out，按约 16ms 的时间驱动帧形成慢—快—慢平移且无 overshoot。
- A→B 会取消旧动画 generation，并从最后一个已发布中心重基准到 B；旧 timer 不能再写回 A。
- 动画中间 region-end 不触发 viewport query；最终稳定视野继续走原 bbox containment gate。
- 160ms surface-tap guard 只消费同一物理 Marker 触摸的一个伴随事件，不再以相机阶段状态阻断独立 outside-dismiss。

## 自动验证

- 定向回归：`2 files / 111 tests PASS`
- 手势／空白点击定向回归：`3 files / 124 tests PASS`
- 全量 Vitest：`81 files / 879 tests PASS`
- TypeScript：PASS
- ESLint：PASS
- contracts/workflow：PASS
- V1-F preflight：PASS
- Next.js production build：PASS
- 微信官方 CLI `preview`：PASS；AppID `wx4e40b1657ca4563d`；包大小 `984307 bytes`
- 详情卡／赏级补充后的微信官方 CLI `preview`：PASS；包大小 `983529 bytes`

## 真机验收

1. 首次点击任意普通 Marker，详情不得闪现后消失。
2. A 详情打开后立即点击 B，B 详情保持显示，A 的残余事件不得关闭 B。
3. A→B 时地图应以慢—快—慢的缓入缓出曲线连续平移，不能瞬移或越过 B 后回弹。
4. camera 稳定后点击真实地图空白，详情仍应正常关闭。

本轮没有修改真实坐标、PublicLocation、`publicLeadId`、cluster engine、公开 contract、CloudBase 或后端；未 commit、push、deploy。上一版真机结论已明确标记为失败，不再以其自动门记录代表问题已解决。
