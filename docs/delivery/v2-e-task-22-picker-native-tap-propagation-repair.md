# TASK22 重叠列表原生点击传播修复

2026-10-06，V2-E/TASK22，CLIENT_IMPLEMENTED + NATIVE_POINTER_VERIFIED / AWAITING_REVIEW。正式开发工作区及官方新版预览已搭载，尚未正式微信发布，真机人工验收待用户完成。

## 根因与修复

真实OS鼠标输入进入微信开发者工具模拟器时，点击行内Marker图片仅触发外层touchstart/end，未触发行选择及详情调用；直接Element.tap却成功。前轮自动化注入tap绕过完整触摸生命周期，没有揭示这一问题。

picker/detail外层的catchtouchstart/end会截断子元素tap。外部scrim同样使用catchtouchstart，导致其关闭tap也被吞掉。本轮仅修改home/index.wxml共7处事件绑定：两种overlay的start/end/cancel和scrim start改为bind观察。catchtouchmove/catchtap、原WeakMap内部泄漏护栏、选中详情与公开读取逻辑保持。未改JS、样式、分享、准入、定位或后端。

## 验证

- 修复前实际指针点击记录：native-physical-tap-before.json，只有start/end，详情CLOSED/IDLE。Element.tap成功仅作逻辑对照。
- 最终实际指针依次点击43抽与57抽行：native-physical-final-first-after.json、native-physical-final-second-after.json；均OPEN/LOADED，publicLeadId及备注正确，切换正常。对应截图native-real-final-first-after.png、native-real-final-second-after.png。
- 实际详情按钮展开：native-physical-expanded-after.json；实际外部点击关闭最终7处绑定版本：native-physical-final-outside-tap.json，picker=false/card=CLOSED/sheet=CLOSED/detail=IDLE。
- 平台touchstart/move/end回归：native-real-two-parallel-touch-qa.json；picker、组合详情、独立详情内部拖动不关闭，原生map泄漏事件被护栏挡住；外部tap/drag关闭。下拉刷新正确、失败保留已读行、赏级横移58px。此项是平台事件回归，不冒充物理手机测试。
- SDK恢复、方法包装撤除、无夹具残留，真实生产公开结果仍2条。native-restoration.json及native-real-two-parallel-touch-qa.json.restoration。
- 新增4项结构/行为防回退；全套1299 PASS、0失败、1已有skip；26 Playwright、类型、Lint、Next构建、分享/workflow、格式/差异门通过。

测试时编辑小程序源文件引发工具热重载，使旧Page及截图连接失效；重新打开工具后完成最终原生输入验收，没有根据这一测试环境错误扩大产品修改。此前CUA模拟器拖动只观察到start/end，未用它证明touchmove；内部移动边界由明确平台touch事件及行为测试覆盖。

## 交付

证据目录：artifacts/task22/phase2-picker-tap-20261006/。官方预览成功，包1041414B，二维码native-preview-qr.png、包信息native-preview-info.json、日志native-preview.log。截图为原生模拟器与真实公开数据，未声称物理iPhone验收。

全局事实源五份memory-bank文档及AGENTS防回退约束已同步。业务数据写入、后端部署、迁移、重复桥接、条例接受、举报、Git提交推送和正式发布均0。后续Phase及正式发布保持原门禁。
