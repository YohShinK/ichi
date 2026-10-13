# TASK22 地图展示、公开资料和举报接点修复

日期：2026-10-04（北京时间）。当前活动区块V2-E/TASK22；既有生产桥接和每分钟continuous保持开启。本报告覆盖本轮地图补充工作集，原资源声明、历史迁移及已完成部署不重复。

## 结果与原问题

CUFZBP卡片此前使用默认“ICHI玩家”及默认头像，缺少原备注；显示17:54的字段实际是观察时间。真实V1资料为昵称001、已绑定头像、备注“测试”；首次服务器接收时间为10月3日17:55:25，观察时间为17:54:23，后续更新不是新的上传时间。

已接入当前本人安全资料，单独发布不透明路径的头像安全副本；首次上传时间明确标记“上传”，观察时间继续控制新鲜度。真实备注通过微信安全核验，证明绑定原文本精确哈希，然后由全局timer自动更新公开投影。原V1记录未改，原上传确认/本人当前条例/原子V2准入流程保持。

举报采用Founder明确确认的正常活跃账号规则。封禁、异常、受限制账号及无效/过期/显式禁用的资格不计数，10个不同合格账号举报后自动隐藏；普通账号不获得维护角色。API响应补齐客户端所需active/hidden/policyVersion，取消与隐藏不可自动复活规则保留。

## 实现边界

- worker读取本人可信profile，复制私有已绑定头像至独立public-map-avatars版本对象，只授予该对象public-read；不改Bucket ACL，不公开私有fileID、原私有路径或签名链接。源版本、账号状态、删除及缓存版本参与CAS。头像临时失败使用安全fallback，不增设版面准入门；删除/注销清理副本。
- 历史V1 identity只保存OpenID哈希，timer无法还原原身份。生产客户端读取/接受当前条例并确认accepted后，自动调用原bind-wechat-profile的内部sync-map-metadata；使用真实WXContext临时OpenID，每批2条、有界分页及服务器游标。实际msgSecCheck后只写ADMINONLY精确proof与同事务持久source事件，不储存raw OpenID，不修改V1原记录。平台失败deferred，后续页面显示时自动续跑；没有新按钮，也没有代理接受条例。
- source和pipeline物化安全贡献者、精确审核备注及support首次uploadedAt；公开详情只读取已有公开投影，不在请求时拼接私有来源。Freshness及30天规则仍取observedAt。
- profile原绑定事务持久唤醒本人当前同意范围；新上传/修改备注继续原V1审核链。旧选择服务disabled，ownerEntryEnabled=false。正式V2与地图投影同事务完成，无第二次授权或审核。

## 生产应用与真实证据

五个函数均以各自当时真实远端ZIP为基线，冻结core/index保留SHA。最终worker/drain各24文件、bind8文件、detail/report各17文件。配置仅按本轮明确接点启用report/producer、增加公开头像Bucket/region及允许origin、举报资格规则；其他密钥/角色/稳定配置保持。依赖固定cos-nodejs-sdk-v5@2.15.4、@cloudbase/node-sdk@3.17.2，角色凭据取每次真实调用上下文。

早期rev2/3已正确映射昵称/头像/时间但备注仍缺，保留诊断回执；它们不作为最终成功证据。WeChat OpenAPI声明通过官方增量部署应用后，最终本人调用得到真实NOTE_PASSED，独立LEGACY_NOTE_AUDITED事件由既有timer处理APPLIED/admitted=true。没有手动worker或drain，没有再次历史批量迁移。

最终真实数据：

| 项目 | 核对结果 |
| --- | --- |
| 公开昵称 | 001，与本人当前profile一致 |
| 公开头像 | 匿名可读，字节SHA与本人已绑定头像一致 |
| 备注 | 测试，与原记录一致且精确安全proof通过 |
| 上传时间 | 2026-10-03T09:55:25.907Z，即北京时间17:55 |
| 观察时间 | 2026-10-03T09:54:23.351Z，即北京时间17:54；未改 |
| 余票 | 43，真实详情各赏级与公开源一致，零票明确售罄 |
| 原生Marker/筛选 | 真实1个；仅上传1/全不选0/恢复全部1 |
| 举报状态 | 真实GET_STATE known=true、active=false；未制造真实举报 |
| 持续桥接 | 每60秒全局timer保持OPEN，补审事件实际自动应用 |
| 用户原数据 | V1原记录SHA未改，原26条数量保持 |

真实平台主证据：[owner-notes-timer.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase2-map-display-audit-20261004/owner-notes-timer.json>)、[native-real-metadata-qa.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase2-map-display-audit-20261004/native-real-metadata-qa.json>)。

## UI截图与回归

以下是真实生产服务的微信开发者工具原生页面截图，不代表已正式发布或已完成实体手机人工验收：

- [真实Marker](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase2-map-display-audit-20261004/screenshots/real-production-marker.png>)
- [真实详情收起态](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase2-map-display-audit-20261004/screenshots/real-production-detail-collapsed.png>)
- [真实详情展开态](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase2-map-display-audit-20261004/screenshots/real-production-detail-expanded.png>)

重叠、搜索与举报/取消使用明确隔离的3条UI运输夹具，不写入生产库，也不提交真实举报。相同坐标无法拆分时列表显示3个独立Marker图标及8/20/72余票；点选第二项匹配20抽详情，A售罄0与B未知null区分；搜索1/清除3、仅上传2/全不选0/全部3。证据native-overlap-qa.json，隔离截图文件名前缀isolated-，不可当作3条真实迁移。

隔离测试截图：[重叠列表](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase2-map-display-audit-20261004/screenshots/isolated-overlap-picker.png>)、[选中详情](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase2-map-display-audit-20261004/screenshots/isolated-overlap-selected-detail.png>)。测试结束后真实服务与1个Marker已恢复，见native-restoration.json。

最终自动门和生产源码/配置只读回查已通过，见final-validation.json及final-readback.json。本工作集状态PRODUCTION_APPLIED / REAL_NATIVE_VERIFIED / AWAITING_REVIEW；1152项Vitest通过、0失败；类型/Lint/Next构建/CloudBase平台构建校验/分享防回退/工作流/差异检查均通过。生产V1=26、PUBLIC=1、pending=0、deadLetter=0，未授予普通账号后台角色；当前密钥实际值及变体扫描74809文件匹配0，公开DTO私有标识匹配0。全局8个当前入口与长期事实源已同步本轮认知；旧资料和冻结产物只作追溯。

正式微信新版发布、Git提交推送、Phase3/NETWORK/50/300未执行。本次未新增接受条例、第二次分享按钮、维护账号权限或真实举报。
