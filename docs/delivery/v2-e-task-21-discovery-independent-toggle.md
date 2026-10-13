# TASK21 筛选项独立切换修复

2026-09-30 Founder确认当前全部截图无误，最新截图视觉门HUMAN_APPROVED；本报告中的截图视觉待审描述已由此覆盖，历史before/旧版本不恢复。该确认不替代端上交互或云端/性能/全回归/资源审批等其他门。完整范围见[视觉验收汇总](v2-e-task-21-founder-visual-acceptance.md)。

2026-09-30；IMPLEMENTED / AUTOMATED_PASS / AWAITING_FOUNDER_INTERACTION_REVIEW。

Founder指出全选时点击LAST会只剩LAST。根因是onMapToggleDiscoveryFilter在集合六项全选时清空全部并添加requested。现移除这个特殊分支，点击选中项只删除自身，点击未选中项只添加自身；其它项始终保留。“显示全部”仍全选六项并清空搜索，默认UPLOAD_ONLY不选与OR匹配不变。胶囊/Marker样式不变。

已更新既有page handler回归：全选点LAST仅取消LAST、再点恢复、逐个取消直到零项、零项点仅上传、显示全部清词/六项全选。旧代码复现1 FAIL/89 PASS，修复后4文件153项PASS；全量1047 PASS/1既有skip，TS/Lint/contracts/workflow/Next build/微信preview 1011337 bytes通过。原失败日志保留，最终证据artifacts/task21/discovery-independent-toggle-20260930。Founder真机/Agent浏览器视觉本轮NOT_RUN；既有Web25/26未通过未在本轮重跑，仍OPEN。

只改home点击handler及行为回归，并同步设计文档/计划/progress/架构。未部署或修改云数据；前轮report资源A段审批仍待，不因本修复而解锁。TASK21未闭合，TASK22锁定；未commit/push/upload/review/publish。此前upload-only-chip-default报告的“全选后改单项”行为记录由本修复覆盖，其历史验证文件不改。
