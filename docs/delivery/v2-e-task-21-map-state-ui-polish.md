# TASK21 Map State UI Polish

2026-09-30 Founder确认当前全部截图无误，最新截图视觉门HUMAN_APPROVED；本报告中的截图视觉待审描述已由此覆盖，历史before/旧版本不恢复。该确认不替代端上交互或云端/性能/全回归/资源审批等其他门。完整范围见[视觉验收汇总](v2-e-task-21-founder-visual-acceptance.md)。

2026-09-30 Founder最新确认：“ok，这部分做完了”。统一地图状态横条及紧凑首次loading的局部视觉修订已HUMAN_APPROVED；以下AWAITING为历史。不扩大为整体Pre-Pilot/Pilot/RC。新的条例/失败状态审查见[v2-e-task-21-uploaded-state-audit.md](v2-e-task-21-uploaded-state-audit.md)，临时UI示例未清理。

2026-09-30 最新07：首次loading说明已移除，卡片缩小、环上移。07以[最新加载弹窗修订](v2-e-task-21-initial-loading-compact.md)为准；以下原07保留为历史，其他状态不变。


2026-09-30 最新：Founder要求全部非首次loading状态统一为44px横条、右侧粉底白字按钮、短单行文案；搜索只显示全部且清关键词。已实现并取20组新图，几何/真实按钮tap与自动门通过，仍待Founder视觉确认。最新图集/矩阵见 [状态条统一报告](v2-e-task-21-map-state-bar-unification.md)。以下旧12组/旧分层规范是历史，不能作为当前样式。


日期：2026-09-30。状态：IMPLEMENTED / AWAITING_FOUNDER_VISUAL_REVIEW。Pre-state：正式地图状态仅文本/重试，保留数据的 status slot 缺实际定位；原空视野遮罩已在TASK20移除。本阶段复用既有ICHI圆眼/白色圆角胶囊，不生成品牌资产，不改Marker/Picker/Info Card已批准结构。

首次loading/服务失败使用可阅读主卡，解释失败不等于附近无版面；搜索/筛选无匹配使用底部小卡、清搜索/显示全部；成功空视野使用non-blocking提示，pan/zoom与定位/刷新保留；离线依据微信networkType=none或isConnected=false的明确信号，保留已有公开marker；定位拒绝保留手动浏览提示且不强迫授权。刷新/旧缓存/分页失败使用同一非全屏status banner。定位提示独立。status slot本轮实际取图发现缺定位，已修复为地图表层top108px；卡片接收操作，其余overlay不吞地图手势。

改动：pages/home/index.ts / index.wxml / index.wxss；network listener只作提示且onUnload按本handler移除；server freshness与public eligibility不由网络状态改变。详情展开区展示server全部reason，左侧ICHI与Marker同用primaryStatus。

以下为正式当前源码在微信开发者工具的十二组状态截图，390×844逻辑视口、DPR3、iPhone12/13(Pro)模拟器。状态通过本地setData注入，演示marker使用正式Canvas renderer；不是实际离线/定位拒绝/查询错误证据，不计真实参与者或真机PASS。截取后恢复原page数据与临时handler。native地图底图已载入后取图；capture.json记录场景与marker数量。

## Service unavailable

![Service unavailable](</Users/cunfu/Documents/ichi 2/artifacts/task21/map-state-screenshots/01-service-unavailable.png>)

## Search no result

![Search no result](</Users/cunfu/Documents/ichi 2/artifacts/task21/map-state-screenshots/02-search-no-result.png>)

## Filter no result

![Filter no result](</Users/cunfu/Documents/ichi 2/artifacts/task21/map-state-screenshots/03-filter-no-result.png>)

## Empty viewport

![Empty viewport](</Users/cunfu/Documents/ichi 2/artifacts/task21/map-state-screenshots/04-empty-viewport.png>)

## Offline retained data

![Offline retained data](</Users/cunfu/Documents/ichi 2/artifacts/task21/map-state-screenshots/05-offline-retained.png>)

## Location denied / manual browse

![Location denied / manual browse](</Users/cunfu/Documents/ichi 2/artifacts/task21/map-state-screenshots/06-location-denied.png>)

## Initial loading

![Initial loading](</Users/cunfu/Documents/ichi 2/artifacts/task21/map-state-screenshots/07-initial-loading.png>)

## Refreshing

![Refreshing](</Users/cunfu/Documents/ichi 2/artifacts/task21/map-state-screenshots/08-refreshing.png>)

## Stale retained data

![Stale retained data](</Users/cunfu/Documents/ichi 2/artifacts/task21/map-state-screenshots/09-stale-retained.png>)

## Pagination error

![Pagination error](</Users/cunfu/Documents/ichi 2/artifacts/task21/map-state-screenshots/10-pagination-error.png>)

## Cursor recovering

![Cursor recovering](</Users/cunfu/Documents/ichi 2/artifacts/task21/map-state-screenshots/11-cursor-recovering.png>)

## Refresh failure / retained data

![Refresh failure / retained data](</Users/cunfu/Documents/ichi 2/artifacts/task21/map-state-screenshots/12-refresh-failed-retained.png>)

正式微信preview QR与编译信息在artifacts/task21；预览非审核/上传发布，云函数仍未迁移到新合同。自动门见Opportunity实现报告与最终门禁JSON。最新微信preview=1002158 bytes，源包体1311367 bytes，production root dev/fixture=0。无新云资源，无管理云写入；本轮只读safe-stop回读确认epoch25、8flags=false/caller空、read-stop/HA pause=true、PUBLIC0；完整V1 cloud diff仍仅TASK20历史，本轮未重跑。P0/P1：本地回归未发现新的产品失败，不等于Pilot风险0；P2：首次详情待测/Founder风险决定。视觉Founder确认=待回报，不能写HUMAN_APPROVED；Pilot未执行，成本/rollback/真实设备均未取证。回退保留旧WXML/CSS来源与历史证据，不重新引入EMPTY全屏遮罩。Git无commit/push/merge/tag/publish。
