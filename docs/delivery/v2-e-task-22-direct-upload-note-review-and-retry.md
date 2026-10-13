# TASK22 直接上传备注审核与失败重试

日期：2026-10-04。状态：LOCAL_IMPLEMENTED / PRODUCTION_GATE_READBACK_VERIFIED / NATIVE_ISOLATED_VERIFIED / AWAITING_REVIEW。V2-E/TASK22 仍为唯一活动区块；本轮没有正式微信发布。

用户确认：直接上传版面的备注也要经过微信安全审核，通过后才完成 V1 上传；不通过时可以在“我上传的版面”修改备注并重试。原上传确认即分享，当前条例负责 V1→V2 准入，已准入 V2 自动显示地图，不增加二次分享授权。

## 生产门及本次修复

实际生产 `finalize-board-observation` 已经在新 direct 记录的 V1 完成事务之前调用 `security.msgSecCheck`，参数为 version=2、scene=2，使用可信 WXContext 的临时 OpenID。只接受明确 pass，并保存 NOTE_PASSED 与原文 SHA-256 证明；risky、review、空回复或接口异常均拒绝完成上传。生产函数处于 Active，安全 helper 与当前源码一致，权限声明和原分享 producer 已启用。远端 ZIP 8 文件只读回查，V1 仍为 26 条，本轮云写入为 0。因此没有重复部署已在线的安全门。

此前缺口在客户端：失败后的确认快照及恢复 key 没有作为 direct pending payload 保留，且备注编辑仅连接辅助抽赏。现已补齐：

- 本地待上传保留原确认快照、备注、首次位置及识别幂等 key，不持久化 job token。
- “我上传的版面”显示本机失败卡片、“备注未通过”和“修改备注”，数量分别显示云端与待上传，不能把本机失败记录计为 V1 已上传。
- 复用现有修改备注弹窗；提交后恢复原识别任务并重试同一上传，复用已识别结果和原位置，不重跑照片识别或增加位置比较。
- 成功后清理 pending、刷新云端并按 boardId 去重，只显示“已上传”；原上传分享确认和后续全局 bridge 接点保留。
- 重启不会自动再次送审同一拒绝备注。首次上传期间从位置权限页返回，也不会另启一次后台提交。

涉及 `local-draw-drafts.ts`、`home/index.ts`、`index.wxml` 及相关行为/布局回归；复用现有样式与后端，不新增函数或集合。

## 验证

153 项针对测试及最终 1158 项全量回归通过。后端回归覆盖 risky/review/空回复/异常无 V1 完成记录、释放后恢复原 job、修改备注通过、幂等重放只消耗一次识别额度；客户端回归覆盖重启、首次提交并发保护、同一快照/位置、分享接点和辅助抽赏保持。

TypeScript、Lint、Next.js 构建、CloudBase 构建校验通过。官方微信开发者工具生成新版预览包，大小 1,024,005 B。防分享回退、workflow 与差异检查结果见同目录 `final-validation.json`。

原生开发者工具使用隔离输入验证“拒绝→修改备注→重试通过”：失败时云端 0、待上传 1；通过后云端 1、待上传 0，卡片显示已上传。重试没有新的定位调用。隔离函数响应未写生产记录，未代用户接受条例；原本地 Storage 已原样恢复，并重新读到真实云端 1 条记录。截图是明确标注的隔离平台测试，不能替代用户实机验收。

| 界面 | 截图 |
| --- | --- |
| 备注不通过、修改入口 | [失败卡片](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase2-direct-note-retry-20261004/screenshots/isolated-direct-note-failed.png>) |
| 修改备注、重新核验 | [修改弹窗](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase2-direct-note-retry-20261004/screenshots/isolated-direct-edit-note.png>) |
| 重试通过、已上传 | [成功卡片](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase2-direct-note-retry-20261004/screenshots/isolated-direct-note-retry-uploaded.png>) |

证据目录：`artifacts/task22/phase2-direct-note-retry-20261004/`，包括 `production-note-gate-readback.json`、`targeted-tests-final.json`、`full-tests-final.json`、`native-note-retry-qa.json`、构建日志和官方预览二维码。

## 全局认知与范围

五份 memory-bank、AGENTS、README、PRD 和地图分享合同已同步直接上传审核/失败重试规则。正常路径仍禁止“地图分享选择”及等价二次发布按钮。既有旧 direct 备注补审与本人当前条例历史覆盖规则继续有效；CUFZBP 的旧备注已真实补审通过，不重新上传或迁移。

现有生产桥接、公开资料与全局每分钟 timer 沿用已完成证据，没有重复资源声明、部署、迁移或逐账号配置。新版客户端已写入正式开发工作区并生成预览包，尚未正式发布。后续 Phase、NETWORK 和正式发布保持原独立边界。
