# TASK22 Phase2：真实生产桥接与全局持续处理

2026-10-04，当前活动区块V2-E。Phase2达到 **PRODUCTION_APPLIED + LIVE_BRIDGE_VERIFIED + GLOBAL_CONTINUOUS_ENABLED**，工程验证通过，人工审阅状态AWAITING_REVIEW。TASK22及V2-E整体仍IN_PROGRESS；Phase3/NETWORK/50/300/正式微信新版发布未解锁，Git提交/推送0。

用户明确“已同意，恢复此前暂停的生产桥接”，本轮从该断点继续。原13资源动作、7函数部署、现行v3政策和19/22/22源码部署均沿用已通过证据，不重复执行。独立当前证据目录为`artifacts/task22/phase2-production-resume-20261004/`；旧暂停报告与冻结ZIP仅供追溯。

## 当前产品路径

原上传确认及核验→V1（不依赖条例）→本人当前v3条例统一覆盖本人此前及以后完成上传→V1到V2准入→正式V2与PublicMapLead同事务提交→Marker。没有逐条分享按钮、V2二次授权或二次审查。私有保存、未完成核验、删除/注销及位置/安全/有效性不合格仍排除。

后端是一套全局服务；每个账号本人接受当前条例后，自动扫描本人历史并持续接入新上传、更新和删除，无需逐账号配置或人工桥接。新版条例`map-contribution-20261003-v3`及`UPLOADED_V1_RECORDS`不把旧v2同意自动升级；Agent没有替任何真实用户调用ACCEPT。

## 本次真实批次

实际微信GET确认当前账号accepted=true。只读26条当前V1：合格1条CUFZBP，skip25。此前3条direct实际属于另外3个不同账号，均没有各自v3接受；一位用户的同意不能覆盖它们。这是账号授权范围隔离，不是需要逐账号部署。另22条assisted缺exact APPROVED完成依据，不能因为位于V1表中就称为已完成上传。

旧v2 CONSENT_EVENT按当前范围不匹配SKIPPED；真实当前v3扫描APPLIED并queued1。通过实际远端非空drain→worker，CUFZBP的SOURCE事件APPLIED、admitted=true，完整链路读取一致：

`V1 record → boardObservation → BoardInstance → contribution → PublicMapLead(PUBLIC) → native Marker`

该记录为UPLOAD_RECORD，地图详情43抽；公开位置使用0.001°近似网格，原坐标与定位误差未返回公开接口。没有补造旧V1原上传证明、修改所属或将先前4条what-if当作4条真实迁移。本轮实际桥接1条，原V1记录保持26条。

## 生产接点与查询修复

| 接点 | 最终状态 |
| --- | --- |
| 四V1函数producer | enabled=true，原上传/核验/删除事务写事件 |
| worker / drain / bridge processor | enabled=true |
| resolver / projector | 功能控制true，由worker原子准入复用 |
| query / detail / read | enabled=true / readEnabled=true |
| 全局timer | `ichi-player-source-bridge-v1` OPEN，60秒一次 |
| 旧逐条选择服务 / ownerEntry | disabled / false |
| HA / owner / report控制 | 沿用原关闭状态，未扩展本轮范围 |

真实query最初返回SERVICE_UNAVAILABLE。独立只读诊断确认geo查询已有1条PUBLIC，实际CloudBase事务在旧并行readControl后读epoch时返回TransactionBusy/-501001。仅基于query当前真实远端ZIP，将`shared/security.mjs`内readControl替换为现行已验证的顺序读取；其他16文件逐SHA保持，单次UPDATE_CODE后17文件与原启用配置回读通过。没有统一重建覆盖线上历史差异。

## 实际小程序与timer验证

- 真实生产query返回1条并包含目标；detail返回目标及43抽；公开接口禁止私有字段扫描0。
- 正式工作区实际小程序接入生产函数，未注入fixture；服务items1、原生marker1/nativeView1、真实Marker点击详情LOADED、43抽。
- UPLOAD_ONLY为既有地图显示筛选，默认关闭。本次通过真实筛选事件打开后验证；这是展示筛选，不是第二次分享授权，没有更改默认值。
- timer开启后没有再手动调用DRAIN。平台CLS记录连续9次实际调度成功，failed=0；当时队列已无待处理任务，processed=0符合预期，非空处理已由上面的真实批次证明。
- 初次观察器遗漏CLS嵌套转义JSON中的结果；修正只读解析后得到上述回执。初次诊断文件保留，不据此重复开启timer或迁移数据。

![真实生产地图Marker](../../artifacts/task22/phase2-production-resume-20261004/screenshots/real-production-marker.png)

![真实生产Marker详情](../../artifacts/task22/phase2-production-resume-20261004/screenshots/real-production-marker-detail.png)

## 验证与证据

query针对回归45/45 PASS、实际SDK顺序控制读取事务PASS；真实微信query/detail/Marker及timer通过。完整1239 PASS/1既有SKIP、类型/Lint/Next构建沿用前轮相同现行源码的已通过结果；本轮不重复无变化的全套测试。

最终回读核对10个相关函数源代码SHA、稳定配置/其他绑定、启用flag、timer、v3政策、账号权限及V1原数据；工作流和上传分享防回退通过。证据入口：

| 内容 | 当前证据文件 |
| --- | --- |
| 实际接受与26条只读批次 | preflight.json / wechat-consent-get-recheck.json |
| producer与处理启用 | processing-enable.json |
| 真实非空桥接与业务链 | live-batch.json |
| query诊断、最小包与部署 | query-diagnosis.json / query-repair-manifest.json / deployment-query-public-map-leads.json |
| query本地及实际SDK回归 | query-regression.json / query-repair-platform-test.json |
| 实际小程序query/detail/Marker | production-client-verification-complete.json |
| 全局timer启用及实际运行 | continuous-enable.json / continuous-observation-verified.json |
| 最终生产/泄漏回读与本地门 | final-readback.json / final-validation.json |

当前逻辑已同步AGENTS、README、PRD及五份memory-bank入口、现行地图分享合同与Phase2 README。旧暂停和旧逐条规则标为历史；防回退门继续阻止旧UI/事件/选择接口。下一开发范围仍按TASK22后续Phase独立解锁；后端全局启用不等于已向所有用户正式发布新版小程序。
