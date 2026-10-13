# TASK21 仅上传筛选胶囊与默认选择修订

2026-09-30 Founder确认当前全部截图无误，最新截图视觉门HUMAN_APPROVED；本报告中的截图视觉待审描述已由此覆盖，历史before/旧版本不恢复。该确认不替代端上交互或云端/性能/全回归/资源审批等其他门。完整范围见[视觉验收汇总](v2-e-task-21-founder-visual-acceptance.md)。

2026-09-30；LOCAL_AUTOMATED_PASS / AWAITING_FOUNDER_VISUAL_REVIEW。Founder本轮截图与文字要求覆盖此前筛选项灰色/默认六项全选方案。

“仅上传”Marker主标签仍使用灰色/default tone，Opportunity与Freshness原因不变。顶部筛选项显示“📤 仅上传”，删除专用灰底灰字覆盖，复用其它筛选项的白底黑字、999px圆角及选中描边。初始page data与缺省client subscriber统一采用DEFAULT_PUBLIC_DISCOVERY_TAG_IDS（五个Opportunity项），UPLOAD_ONLY未选中，固定显示全部按钮未标记六项全选。用户主动点“仅上传”可加入选中集合；显示全部仍清空搜索并全选六项。保持OR，因此同时拥有机会标签的upload记录仍可由其它已选机会项匹配，不新增排除条件。

默认/添加仅上传/全选后改单项/显示全部清词与六项全选经page handler回归验证；已有Marker与report测试保留。定向6文件209项通过；全量Vitest 1047通过/1既有skip，TS、Lint、contracts/workflow、Next build和微信preview 1011405 bytes通过。证据在artifacts/task21/upload-only-chip-default-20260930/verification.json。未进行Agent浏览器视觉或Founder真机验收。既有上轮网页全套25/26未通过仍记录为OPEN，本轮仅小程序筛选修改不重复跑Web，也不把本轮门扩大为完整TASK21自动门。

修改discovery默认常量/emoji、home初始化及subscriber fallback、WXML公共class与WXSS灰色override；同步设计文档、计划、架构和progress。无后端/云资源/权限/公开数据变更，cloud writes=0；上一轮A段云资源审批仍待，当前修改不构成该审批。TASK21未闭合，TASK22锁定；无commit/push/upload/review/publish。
