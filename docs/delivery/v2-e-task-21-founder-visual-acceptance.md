# TASK21 Founder 全部截图视觉验收

2026-09-30。Founder 直接确认：“OK 现在所有截图都已确认无误”。当前已交付且对应最新实现的截图，视觉状态统一记为 **HUMAN_APPROVED**，关闭截图相关待审项。历史修改前、被新版覆盖的截图仍作为过程证据保存，不恢复其旧样式或旧规则。

| 视觉范围 | 当前依据 |
| --- | --- |
| 地图状态条、右侧操作及搜索无匹配 | [统一状态条](v2-e-task-21-map-state-bar-unification.md) |
| 首次加载弹窗 | [紧凑 loading](v2-e-task-21-initial-loading-compact.md) |
| Opportunity、Marker 及已交付详情呈现 | [机会呈现](v2-e-task-21-opportunity-evaluation-and-filter-restore.md)、[仅上传 Marker](v2-e-task-21-upload-only-marker-filter.md) |
| 仅上传筛选外观和默认展示 | [筛选样式](v2-e-task-21-upload-only-chip-default.md) |
| 本人上传状态、备注失败弹窗与条例入口 | [上传页核验](v2-e-task-21-uploaded-state-audit.md) |
| 条例正文、居中标题、三秒倒计时及无底无描边滚动区 | [条例最新呈现](v2-e-task-21-map-contribution-terms-modal.md) |
| 已交付举报及取消的界面截图 | [举报界面与候选实现](v2-e-task-21-report-cancel-auto-hide.md) |

九条临时示例、模拟条例状态和提交拦截已按此前授权清理，正式功能和截图／验证证据保留。清理结果见 `artifacts/task21/preview-cleanup-20260930/verification.json`。

本轮只有验收状态及报告同步，无产品代码、云资源／配置／数据写入、Git 提交或发布。文档 workflow 与触及格式检查通过；没有重新执行自动测试或取得新的真机证据。截图确认没有自动替代筛选点击的端上复测、真实账号同意／上传／举报／阈值核验、真实性能、Web 整套回归、云资源／窗口审批或 Pilot 协议。

当前 TASK21 仍为 IN_PROGRESS / PRE_PILOT_CLOSURE；其他门按各自最新记录继续，TASK22 仍锁定。视觉验收 JSON：`artifacts/task21/founder-visual-acceptance-20260930.json`。
