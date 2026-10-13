# TASK21 举报按钮状态与紧凑宽度修复

2026-10-01：LOCAL_VERIFIED / FOUNDER_DEVICE_REVIEW_PASS。Founder明确追加：已举报按钮灰暗、文字“已举报”，再次点击或状态条取消后恢复亮色“举报”；按钮靠详情卡片右侧，仅容纳图标、文字和少量内边距，宽度随两种文字自然变化。

根因：两个map-detail-card调用均未传mapReportActive/mapReportBusy，模板内动态文字、灰色样式与在途禁用无法接收现有共享控制器状态。已在两处补齐绑定。按钮采用inline-flex、width:auto、flex不拉伸、单行文字和左右8px内边距；父操作区靠右，图标不收缩，已举报时图标同时灰暗。未增加固定按钮宽度，控制器命令和云函数不改。

源码仅pages/home/index.wxml、index.wxss；必要绑定回归写index.v2-map-discovery.test.ts。新回归先红（缺mapReportActive），修复后3文件48 PASS；全仓1069 PASS/1既有SKIP、Lint、双TS、contracts/workflow、Next build PASS。整套Web25 PASS/1 FAIL，失败为此前已接受的V1草稿左滑删除不稳定（v1-26.spec.ts:879，按钮不稳定/重建）；保留本次失败，不把单项复测代替整套结果，不修改V1。149个V1保护文件hash0diff。

正式微信preview已生成，包体1012639 bytes；二维码与info在artifacts/task21/final-cloud-rehearsal-20260930/repair-apply-retest-20261001/tcb-context-repair-deploy-closure/report-button-ui。Founder本轮明确“OK 5 项测试通过”：紧凑靠右宽度、举报灰色已举报、按钮再次点击取消、再次举报、状态条取消联动均真机PASS。云ledger对应可信Founder A，最终CANCELLED/active=false/distinct count0，观测10条交替REPORT/CANCEL AUDIT（多次操作均保留，不把重复点击当actionId replay）。

后端继续使用唯一已批准冻结ZIP SHA 9a9a96a14e3ed314bae6147094fa26539f055239bf6c185039a79253c0c5c6cd，未改报告函数runtime、其它函数代码、threshold语义、V1或资源定义。后续真实幂等/threshold/no-resurrection/最后query-detail、最终safe-stop和完整云V1已全部通过，Founder明确本轮人工验收通过并关闭全部测试。最终完整回归1096 PASS/1既有SKIP、网页26/26 PASS；原按钮阶段25/26结果保留为历史。TASK21已按授权工作集收口，TASK22 LOCKED。详见v2-e-task-21-report-tcb-context-repair-deploy-closure.md。
