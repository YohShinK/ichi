# TASK22 重叠列表信息恢复与地图窗口触摸边界

2026-10-06，`MAP_PICKER_METADATA_RECOVERY_AND_OVERLAY_TOUCH_BOUNDARY_V1` 已 CLIENT IMPLEMENTED + REAL PUBLIC NATIVE VERIFIED / AWAITING_REVIEW。正式开发工作区和官方新版预览已搭载；V2-E/TASK22仍唯一活动区块、整体IN_PROGRESS，未正式微信发布。

两条实际公开记录的备注和首次上传时间都存在。修复后列表连续三轮读取均正确显示：女神异闻录 / 30周年，备注“中顺新澜悦测试”，上传10/06 03:26；雪未来 / SNOW MIKU ALL STARS，备注“测试”，上传10/03 17:55。窗口内部点击/拖动保持打开，列表下拉可重读，外部点击/拖动关闭。

## 根因与修复

1. **读取失败与永久去重叠加。** 原列表同时发两个详情请求。真实生产并发对照三轮，各有一条SERVICE_UNAVAILABLE，失败对象交替；顺序对照两条均成功。生产详情入口的consumeRate为同账号detail使用同一事务计数行，代码与真实对照支持并发争用判断；未取得内部TransactionBusy日志，不能声称具体内部错误码已验证。客户端生产适配器现在让列表和选中卡片共用串行RPC队列，实际请求并发1；普通query和候选环境路由保持。picker仅对瞬时服务/网络失败再试一次，限流、身份、版本和明确失效不自动重试。旧失败行永久去重问题由有界自动重试及下拉重新加载当前窗口解决。
2. **内部手势泄漏给地图关闭逻辑。** 原picker和detail根没有touch隔离；map用户region begin无条件dismiss全部选择。picker内部空白又绑定了“关闭详情”处理。现在两种窗口内部catch触摸，标记起止并保护350ms尾事件，忽略内部泄漏的map tap/region；程序化update保持。picker空白仅阻断tap，真实外部触摸清内部护栏，再走原地图关闭逻辑；scrim外部tap/drag关闭窗口和卡片。
3. **刷新接点缺失。** 原scroll-view没有refresher。现在原生下拉刷新接到当前可视8行读取，视窗起点夹紧，空队列/读完结束刷新态；不会重新查询所有记录或改变选中详情。瞬时失败保留同记录已读有效元数据，明确LEAD_UNAVAILABLE移除，仍终检ID/request/generation/version/当前成员/隐藏状态。

原行选择、详情展开收起、赏级按列布局和横向滚动、备注滚动、坐标/聚合/筛选/计数/个人模糊定位/分享准入均保持。无新增二次分享或授权，无生产函数部署、配置变更、用户记录改写、迁移或重复桥接。公开请求仍使用正常后端限流计数。

## 验证与限度

- 当前源码/夹具1282测试通过，1个原有skip；最后114个page行为用例通过，types/Lint/Next build/分享防回退/workflow/差异检查通过。
- 26项Playwright回归通过。按项目规则未用浏览器控制进行人工视觉验收。
- 原生开发者工具使用真实生产公开数据：三轮6/6读取成功，实际RPC并发峰1；下拉事件确实重新读取两条；隔离运输层模拟四次瞬时失败后，已读两行仍保留、刷新结束。
- picker内部触摸及迟到地图事件、picker与详情组合内部触摸、独立详情内部拖动均不关闭。外部tap/drag关闭；独立详情外部地图drag关闭并保持GESTURE；赏级原生横移58px通过，真实57抽/备注归属正确。
- 原生测试初期刷新断言在事件送达前读取、跨evaluate使用外部闭包变量，以及scrim.tap默认中心落在卡片内部，是测试时序/目标问题；已修正为等待请求开始和实际外部点事件后通过，保留初次STOP回执。不据此修改其他产品交互。
- SDK全部恢复，运输层夹具清除，真实公开2条。没有代用户同意条例、举报或上传数据。官方预览包1041933字节。原生证据来自开发者工具和真实公开RPC，手机手势最终体验仍交由用户验收；本工作集自动门通过不等于整个区块人工验收。

现行design、tech-stack、architecture、implementation-plan、progress及AGENTS已同步。旧单次失败永久去重、内部空白关闭详情和不区分触摸来源的关闭行为不可作为恢复依据。

## 证据

- [真实并发/顺序读取对照](../../artifacts/task22/phase2-picker-recovery-touch-20261006/real-read-diagnosis.json)
- [原生最终回执](../../artifacts/task22/phase2-picker-recovery-touch-20261006/native-recovery-touch-qa.json)
- [真实两条信息修复截图](../../artifacts/task22/phase2-picker-recovery-touch-20261006/native-real-two-records-restored.png)
- [真实详情内部拖动后截图](../../artifacts/task22/phase2-picker-recovery-touch-20261006/native-real-detail-internal-drag.png)
- [新版预览二维码](../../artifacts/task22/phase2-picker-recovery-touch-20261006/native-preview-qr.png)
