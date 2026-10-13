# TASK22 Phase2｜分享授权合并至上传确认

> 后续接点审计已补并发／公平等待／云端复核接点，并把通用选择API改为内部上传实现。全局现行约束为`UPLOAD_CONFIRMATION_MAP_SHARING_V2`，见`docs/decisions/map-upload-sharing-contract.md`；尚未连接的生产项及最新验证以`v2-e-task-22-phase2-sharing-flow-connection-audit.md`为准。本文保留此次UI截图与当时验证证据。

2026-10-03，状态：LOCAL_IMPLEMENTED / LOCAL_GATES_PASS / AWAITING_REVIEW。此次是Founder明确授权的本地分享路径、条例和UI修订；Phase2生产迁移与continuous仍保持暂停。以下覆盖上一份报告中的独立地图分享按钮流程。

## 最终用户路径

| 路径 | 分享授权发生的位置 | 上传之后 |
| --- | --- | --- |
| 辅助抽赏 | 决定收手→原“分享本次记录？”弹窗→“愿意并拍摄赏票”→原确认上传 | 同意当前条例且核验及公开条件通过后，自动进入地图 |
| 直接上传版面 | 原“确认并上传版面”，说明确认上传即分享本条记录 | 成功弹窗说明已提交地图、核验后自动展示，只留“退出回首页” |
| 继续抽赏／暂不分享并退出 | 不产生新的地图分享授权 | 个人记录继续保留，不由账号同意自动公开 |

本人记录与“我上传的版面”不再提供“地图分享选择”；独立“我确认有权分享，并分享至地图”弹窗和控制器已移除。上传完成之后不需要再次点击地图发布。

辅助抽赏保留原有三个按钮，并增加：“同意地图贡献条例后，分享并上传的记录核验通过就会自动进入地图。”

直接上传确认页面增加分享说明。成功弹窗采用居中图标、标题、说明及单个主按钮，内容自适应高度、说明与按钮有固定间距。服务端接收分享后显示：“本条记录已提交地图，核验通过后会自动展示。回首页后可继续上传新的版面。”若服务未同步则显示：“本条记录已上传，地图同步尚未完成。恢复并通过核验后会自动展示，无需再次分享。”不会把服务关闭或待核验状态写成已经公开。

## 条例和实际授权

第一至三条明确两条上传路径、上传确认同时表达分享及有权公开、核验通过后自动展示、旧历史不因账号同意自动公开。现有公开位置、内容安全、权利、有效性与来源核验条件保留。

新增map-upload-sharing.ts仅持久保存明确的新上传意图，按正式条例版本和scope隔离；最多250条，每次处理20条，并发合并，失败保留重试。赏票提交先取得真实recordId并持久保存意图；直接上传从真实finalization取得recordId。onShow、同意条例、上传完成和核验完成会自动重试。

ProductionMapContributionService在当前正式consent通过后，读取服务端可信来源fingerprint，再调用既有SET_INITIAL_CHOICE写SHARE及rightsAttested；未核验、未同意或不可用时等待，不覆盖已有DO_NOT_SHARE。队列不是服务端授权证明。没有遍历历史，没有新增V1请求字段，也没有修改云函数或重建7个冻结ZIP。

新版条例为map-contribution-20261003-v2，候选保存于artifacts/task22/phase2-sharing-flow/formal-policy-candidate.json，LOCAL_CANDIDATE_NOT_APPLIED。production已部署旧v1未被覆盖，本地客户端严格匹配新版本，正式政策应用及真实微信调用仍需恢复TASK22后完成。本次不能宣布条例服务已可用或真实地图桥接已完成。

## UI截图

全部为隔离微信开发者工具预览，iPhone 12/13 (Pro)，390×844视口。使用当前源代码的WXML、WXSS、全局样式和初始data；仅注入演示状态，页面事件为空，预览app没有cloud对象或生产请求。它们证明UI样式，不证明真实用户授权、核验或PUBLIC Marker。

| 截图 | 展示内容 |
| --- | --- |
| [辅助抽赏分享弹窗](../../artifacts/task22/phase2-sharing-flow/screenshots/01-assisted-share-popup.png) | 保留三个原按钮，新增核验后上图说明 |
| [直接上传确认](../../artifacts/task22/phase2-sharing-flow/screenshots/02-direct-upload-confirm.png) | 原确认上传表达本条分享 |
| [直接上传成功](../../artifacts/task22/phase2-sharing-flow/screenshots/03-direct-upload-submitted.png) | 居中单按钮，已提交地图、等待核验 |
| [我上传的版面](../../artifacts/task22/phase2-sharing-flow/screenshots/04-my-uploads.png) | 移除地图分享选择 |
| [新版条例第一条](../../artifacts/task22/phase2-sharing-flow/screenshots/05-terms-intro.png) | 两条分享上传路径及自动进入地图 |
| [新版条例授权说明](../../artifacts/task22/phase2-sharing-flow/screenshots/06-terms-authorization.png) | 分享授权合并原上传确认，无需二次发布 |
| [直接上传待同步](../../artifacts/task22/phase2-sharing-flow/screenshots/07-direct-upload-pending-sync.png) | 不可用时如实提示，仍只有回首页 |

已逐张查看截图。直接成功弹窗自动几何检查：说明不与按钮重叠，按钮不超出卡片，弹窗只有一个按钮；上传列表不包含已移除分享文字。capture.json记录实际文本与元素尺寸，local-closeout-verification.json记录源文件和截图SHA。现有automator的版本检查依赖已废弃getSystemInfoSync字段，在预览脚本内跳过该检查，使用getWindowInfo/getDeviceInfo/getAppBaseInfo取得真实模拟器信息；没有修改安装包或产品运行代码。

## 自动验证

| 检查 | 结果 |
| --- | --- |
| 完整仓库测试 | 1193 PASS，1既有SKIP |
| 最终定向回归（最终条例文字与scope） | 5文件、138 PASS |
| Lint／最终修改文件Lint／修改的9个TS文件格式 | PASS |
| TypeScript（两项目） | PASS |
| Next.js构建 | PASS |
| Headless Playwright页面回归 | 26/26 PASS |
| 微信官方WXML编译 | 2文件，PASS |
| 地图包审计、工作流、差异空白检查 | PASS |
| 冻结输入保护 | 1199输入，授权客户端差异5，非授权drift0 |

证据保存在artifacts/task22/phase2-sharing-flow，既有phase2/phase2-live证据不覆盖。重大职责和状态已同步architecture、design-document、tech-stack、implementation-plan及progress。

## TASK22恢复断点

本次cloud写入0、真实历史迁移0、Git提交／推送0。尚未开启生产公开查询、processor、continuous或timer。

恢复时先应用独立v2条例/scope并解决真实微信条例调用，再验证正常上传自动落逐记录授权及非空drain→worker调用；取得真实合格记录后只读preview，提交具体小批量批准，再验证真实V1记录→boardObservation→BoardInstance→contribution→PublicMapLead→marker，最后开启continuous。已完成的13资源、7函数和事务／timer测试不重复。

Phase3、NETWORK、50／300及正式微信发布继续LOCKED；本地UI待Founder检查。
