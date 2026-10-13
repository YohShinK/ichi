# TASK21 首次加载弹窗精简

2026-09-30 Founder确认当前全部截图无误，最新截图视觉门HUMAN_APPROVED；本报告中的截图视觉待审描述已由此覆盖，历史before/旧版本不恢复。该确认不替代端上交互或云端/性能/全回归/资源审批等其他门。完整范围见[视觉验收汇总](v2-e-task-21-founder-visual-acceptance.md)。

2026-09-30 Founder最新确认：“ok，这部分做完了”。统一地图状态横条及紧凑首次loading的局部视觉修订已HUMAN_APPROVED；以下AWAITING为历史。不扩大为整体Pre-Pilot/Pilot/RC。新的条例/失败状态审查见[v2-e-task-21-uploaded-state-audit.md](v2-e-task-21-uploaded-state-audit.md)，临时UI示例未清理。

日期：2026-09-30。阶段：Pre-Pilot Closure B 局部视觉修订。状态：IMPLEMENTED / AWAITING_FOUNDER_VISUAL_REVIEW。

Founder直接要求：07-initial-loading移除标题下“首次载入”说明，标题下面直接加载环，环上移，整卡适应剩余元素缩小。Pre-state：300×176.2px弹窗含吉祥物/标题/说明/加载环。现只保留吉祥物、标题、加载环，max-width240px、padding20px、gap10px，高度依内容自适应。微信DevTools390×844当前实测为240×133px，加载环中心上移17.6px；未使用负margin或固定高度补丁。16px环的动画旋转使几何外框大于16px，取center比对位置。说明节点及未使用的map-state-copy样式已移除。其他统一横条/按钮/搜索重置/机会规则/Marker/详情不改。

Files changed：home index.wxml/index.wxss，以及design-document/architecture/implementation-plan/progress、本报告和本地取证。没有TS/后端/合同变更、新云resource/config/flag/allowlist/data管理写入、Git commit/push或正式upload/review/publish。截图用setData注入INITIAL_LOADING，取图后恢复页面及临时native事件handler；不是实际首次请求耗时、真机或Pilot evidence。

本轮验证：Vitest1021 passed/1 skipped、root/Web TS、Lint、contracts/workflow、Next build、微信CLI preview 998940 bytes、包体audit通过。WXML/WXSS为工程Prettier忽略类型，scoped check按工程设置运行，语法由微信编译验证。未加镜像样式测试。本轮不重复无产品改动的Web26项流程，上一轮26/26证据保持为历史。原07与当前07均保留，before/after.json含原生尺寸和位置。实际打开新截图检查说明已去掉、环直接接标题、卡片缩小。未发现本轮本地P0/P1回归，不能冒充实际Pilot风险0；P2 T20-P2-01仍待真实cold/warm，P3无新设备结论。

## 修改前

![修改前](</Users/cunfu/Documents/ichi 2/artifacts/task21/loading-popup-compact-20260930/before.png>)

## 修改后

![修改后](</Users/cunfu/Documents/ichi 2/artifacts/task21/loading-popup-compact-20260930/after.png>)

当前gate：视觉仍等待Founder确认；原20组中的07由本报告新版替代，其他19组不变。真实性能/完整V1云diff/Pilot协议仍未闭合，TASK22锁定。V1 core/CloudBase backend/Web product本轮未改；完整V1 cloud diff未重跑，不冒充历史TASK20最终0为本轮回读。回退只恢复本轮WXML说明和card样式增量，不回退其他状态条或TASK20空视野修复。无新的真实账单/成本、云操作或rollback drill，本地evidence在artifacts/task21/loading-popup-compact-20260930/verification.json。
