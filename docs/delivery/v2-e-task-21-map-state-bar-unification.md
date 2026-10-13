# TASK21 地图状态条统一修订

2026-09-30 Founder确认当前全部截图无误，最新截图视觉门HUMAN_APPROVED；本报告中的截图视觉待审描述已由此覆盖，历史before/旧版本不恢复。该确认不替代端上交互或云端/性能/全回归/资源审批等其他门。完整范围见[视觉验收汇总](v2-e-task-21-founder-visual-acceptance.md)。

2026-09-30 Founder最新确认：“ok，这部分做完了”。统一地图状态横条及紧凑首次loading的局部视觉修订已HUMAN_APPROVED；以下AWAITING为历史。不扩大为整体Pre-Pilot/Pilot/RC。新的条例/失败状态审查见[v2-e-task-21-uploaded-state-audit.md](v2-e-task-21-uploaded-state-audit.md)，临时UI示例未清理。

2026-09-30 最新07：首次loading说明已移除，卡片缩小、环上移。07以[最新加载弹窗修订](v2-e-task-21-initial-loading-compact.md)为准；以下原07保留为历史，其他状态不变。


2026-09-30。阶段：Pre-Pilot Closure B。状态：IMPLEMENTED / AWAITING_FOUNDER_VISUAL_REVIEW。依据Founder参考图及三次直接设定：除“正在寻找公开线索”保留中心卡，其余地图状态统一横条；可操作粉字改为条内最右侧粉底白字圆角按钮；文案过长精简；搜索无匹配只保留“显示全部”，点击同时清空关键词并恢复五状态全选。

Pre-state：首屏服务/地图渲染失败与搜索/筛选/零选各有独立卡/弹窗，empty/location在不同底部位置，banner操作只是粉字，显示全部还保留关键词。现同一个状态槽、共同358×44px（390px模拟视口）与11px/700/16px字体，按钮72×28px、圆角8px、#e014a0/白字，右缘固定在框内12px处。文案单行完整表达，未用截断或缩小字号；无操作的状态不加按钮。首次loading中心卡保持原结构。互斥状态链避免同位置提示叠盖，locating仍可手动浏览；公开Opportunity/Freshness/current/授权/删除/迟到响应/分页与重试安全门未改。

Files changed：home index.wxml/index.wxss/index.ts（仅增加公开error code用于精简错误文案、reset传空关键词）、受影响现有源码约束测试；Web现有回归手势测试辅助流程；canonical design/architecture/plan/progress与本报告。无后端/公开契约规则/云函数包变更，本轮不需重打cloud artifact。无云资源/flag/data/allowlist/config管理写入，无私有V1数据管理查询。没有Git commit/push、正式upload/review/publish。

正式微信preview=999132 bytes；根/Web TS、Lint、contracts/workflow、Next build、touched Prettier、Vitest1021 passed/1 skipped、Web26/26通过。首次Web25/26与孤立左滑用例失败：测试用裸坐标起拖；改为Playwright hover确认可操作后从中心真实鼠标横拖，单项及全套通过，V1 Web产品源码未改。旧单测的“零选modal/重置仍保留搜索”按最新Founder语义更新。初次UI取图被热重载打断，稳定项目后重取；演示Marker取图竞态已通过清理旧renderer状态后重取，全体retained场景markerCount=1。上一轮12图与既有验证日志保持原样；本轮初次失败见执行记录，本轮日志文件保存最终结果。

20组当前微信DevTools场景：19组横条实测同一left16/top195/358×44px（地图内部top108px），有按钮时均left290/top203/72×28px、粉底白字；首次loading无横条。搜索“显示全部”实际tap验证keyword/inputValue均空、五个tag全选true。场景通过setData注入，演示Marker由正式Canvas renderer生成；不是实际离线/权限拒绝/服务故障、真机或Pilot证据。实测元数据/capture脚本/参考图测量/全套日志在 artifacts/task21/state-bar-unification-20260930；verification.json汇总。

## 当前状态文案与操作

| 状态 | 横条文字 | 唯一右侧按钮 |
| --- | --- | --- |
| 01-service-unavailable | 服务暂不可用，不代表无版面。 | 重新载入 |
| 02-search-no-result | 没有匹配线索，试试显示全部。 | 显示全部 |
| 03-filter-no-result | 所选状态暂无公开线索。 | 显示全部 |
| 04-empty-viewport | 此视野暂无公开线索，可拖动查看。 | 无 |
| 05-offline-retained | 当前离线，保留上次公开线索。 | 重试连接 |
| 06-location-denied | 未开启定位，仍可手动浏览。 | 无 |
| 08-refreshing | 正在刷新，保留已有线索。 | 无 |
| 09-stale-retained | 缓存已过期，请刷新线索。 | 刷新缓存 |
| 10-pagination-error | 下一页载入失败，保留已有线索。 | 重试下一页 |
| 11-cursor-recovering | 分页已失效，正重新载入。 | 无 |
| 12-refresh-failed-retained | 刷新失败，保留上次线索。 | 重试 |
| 13-zero-filter | 未选择状态，请显示全部。 | 显示全部 |
| 14-native-render-error | 地图未载入，请重新载入。 | 重新载入 |
| 15-pagination-loading | 正在载入更多，保留已有线索。 | 无 |
| 16-more-results | 此区域还有公开线索。 | 加载更多 |
| 17-truncated | 结果较多，请放大地图。 | 无 |
| 18-unauthorized | 账号状态需恢复，请重试。 | 重新载入 |
| 19-rate-limited | 请求较多，请稍后重试。 | 重新载入 |
| 20-schema-unsupported | 版本不支持，请更新后再试。 | 重新载入 |

## 当前截图

### 01-service-unavailable

![01-service-unavailable](</Users/cunfu/Documents/ichi 2/artifacts/task21/state-bar-unification-20260930/screenshots/01-service-unavailable.png>)

### 02-search-no-result

![02-search-no-result](</Users/cunfu/Documents/ichi 2/artifacts/task21/state-bar-unification-20260930/screenshots/02-search-no-result.png>)

### 03-filter-no-result

![03-filter-no-result](</Users/cunfu/Documents/ichi 2/artifacts/task21/state-bar-unification-20260930/screenshots/03-filter-no-result.png>)

### 04-empty-viewport

![04-empty-viewport](</Users/cunfu/Documents/ichi 2/artifacts/task21/state-bar-unification-20260930/screenshots/04-empty-viewport.png>)

### 05-offline-retained

![05-offline-retained](</Users/cunfu/Documents/ichi 2/artifacts/task21/state-bar-unification-20260930/screenshots/05-offline-retained.png>)

### 06-location-denied

![06-location-denied](</Users/cunfu/Documents/ichi 2/artifacts/task21/state-bar-unification-20260930/screenshots/06-location-denied.png>)

### 07-initial-loading

![07-initial-loading](</Users/cunfu/Documents/ichi 2/artifacts/task21/state-bar-unification-20260930/screenshots/07-initial-loading.png>)

### 08-refreshing

![08-refreshing](</Users/cunfu/Documents/ichi 2/artifacts/task21/state-bar-unification-20260930/screenshots/08-refreshing.png>)

### 09-stale-retained

![09-stale-retained](</Users/cunfu/Documents/ichi 2/artifacts/task21/state-bar-unification-20260930/screenshots/09-stale-retained.png>)

### 10-pagination-error

![10-pagination-error](</Users/cunfu/Documents/ichi 2/artifacts/task21/state-bar-unification-20260930/screenshots/10-pagination-error.png>)

### 11-cursor-recovering

![11-cursor-recovering](</Users/cunfu/Documents/ichi 2/artifacts/task21/state-bar-unification-20260930/screenshots/11-cursor-recovering.png>)

### 12-refresh-failed-retained

![12-refresh-failed-retained](</Users/cunfu/Documents/ichi 2/artifacts/task21/state-bar-unification-20260930/screenshots/12-refresh-failed-retained.png>)

### 13-zero-filter

![13-zero-filter](</Users/cunfu/Documents/ichi 2/artifacts/task21/state-bar-unification-20260930/screenshots/13-zero-filter.png>)

### 14-native-render-error

![14-native-render-error](</Users/cunfu/Documents/ichi 2/artifacts/task21/state-bar-unification-20260930/screenshots/14-native-render-error.png>)

### 15-pagination-loading

![15-pagination-loading](</Users/cunfu/Documents/ichi 2/artifacts/task21/state-bar-unification-20260930/screenshots/15-pagination-loading.png>)

### 16-more-results

![16-more-results](</Users/cunfu/Documents/ichi 2/artifacts/task21/state-bar-unification-20260930/screenshots/16-more-results.png>)

### 17-truncated

![17-truncated](</Users/cunfu/Documents/ichi 2/artifacts/task21/state-bar-unification-20260930/screenshots/17-truncated.png>)

### 18-unauthorized

![18-unauthorized](</Users/cunfu/Documents/ichi 2/artifacts/task21/state-bar-unification-20260930/screenshots/18-unauthorized.png>)

### 19-rate-limited

![19-rate-limited](</Users/cunfu/Documents/ichi 2/artifacts/task21/state-bar-unification-20260930/screenshots/19-rate-limited.png>)

### 20-schema-unsupported

![20-schema-unsupported](</Users/cunfu/Documents/ichi 2/artifacts/task21/state-bar-unification-20260930/screenshots/20-schema-unsupported.png>)

## 验收与后续门

新版需Founder视觉确认；此前12组待审图已被本修订替代，保留为历史，不视为批准。P0/P1：本地最终回归无新增失败，不冒充真实Pilot风险0。P2 T20-P2-01仍OPEN/本地优化待真实cold-warm测量；P3无新增实测结论。完整V1云diff本轮未重跑，TASK20历史最终0不能冒充新回读；本轮V1 core/CloudBase backend/Web product无修改。回退只撤本轮状态WXML/WXSS与reset增量，不重新引入TASK20的EMPTY整屏拦截，不撤销其关闭记录。无真实费用/rollback新drill/参与者采样。TASK21仍Pre-Pilot，TASK22锁定；云端有界窗口/协议、真实性能复测与视觉批准仍待，不因本次本地完成写整体PASS或RC批准。
