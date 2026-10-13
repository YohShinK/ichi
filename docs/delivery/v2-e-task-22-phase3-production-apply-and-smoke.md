# TASK22 Phase3 生产接入与受控 smoke

> 2026-10-07 用户已确认人工核验通过；此文保留当时生产断点。最新人验/清理状态见 `docs/delivery/v2-e-task-22-phase3-human-acceptance-and-closure.md`。

2026-10-06。当前状态：**PRODUCTION_APPLIED / LIVE_SMOKE_PASS / PHONE_PENDING / AWAITING_REVIEW**。本轮明确授权的第 1—6 项已完成，第 7 项实际手机确认尚待设备证据。TASK22/V2-E 整体 IN_PROGRESS；Phase1/2 的 HUMAN_APPROVED 断点保持，Phase4—8 和正式微信发布未执行。

## 本轮新差异与生产回读

从当前环境 cloud1-d7gxqfwv783a1f131 的真实远端 ZIP/配置重新捕获五个函数基线，生成七份独立部署包及逐文件 exact diff。既有函数更新 query-public-map-leads、get-public-map-lead-detail、resolve-board-observation、reconcile-map-projection、process-map-source-bridge；新增 admit-official-network-source 与 maintain-official-network-sources。本轮生产授权与 Phase1/2 已消费授权分开保存。

首次受控未来时钟读取被入口字段白名单拒绝，未造成越权读取。从当时已经更新的 query/detail 远端基线再次捕获新 diff，仅在各自 shared/runtime 的 query/detail 字段白名单新增 networkSmokeRead 两行，新增入口级负测并验证后部署。没有重新 apply 索引、配置或此前函数部署；首次配置后短暂不能回读的两函数仅做回读恢复，没有重复写入。完整七函数最终 **186/186 源码文件 SHA 匹配**，全部 Active；原配置除 query/detail 增加独立 NETWORK 运维密钥外保留。

证据目录：`artifacts/task22/phase3-live-20261006/`。初次 `baselines.json`、`exact-diff-manifest.json`、`exact-diff/`、逐函数 `deployment-*.json`；两行修复单列 `read-clock-repair/`；最终 `final-production-readback.json`。原 Phase1/2 的 190 个 ZIP/资源清单 SHA 和此前 Phase3 本地 ZIP 均保持。

新增索引仅两个：publicMapLeads.network_public_deadline（kind/lifecycleState/sourceIcon/publicUntil）及 boardInstances.active_public_lead。均非唯一、无 TTL；公开到点隐藏与维护退役分开，私有来源/Observation/audit 历史保留。索引创建与回读在 `index-apply-readback.json`。

## 权威与关闭状态

全局 policy 仅追加 network-visibility-30d-v1、public-map-v4、30×24 小时及 curatorAuthorityIds。独立 global:network 控制和服务端 HMAC 运维能力绑定 `ichi-official-founder`，不创建 PLAYER Account/Profile，不替任何用户接受条例。决定保存在服务端 NETWORK_AUTHORIZED_DECISION，绑定 exact source/version/contentDigest、审核/rights 版本；最终准入事务重读该决定及 controlVersion。客户端声明不能替代决定。

常规 NETWORK admission/maintenance 的环境变量与数据库开关均 **false**。maintenance timer `network-maintenance-minute` 使用 `0 */1 * * * * *`，提供方触发器 **Enable=0 / CLOSE**，与函数、数据库双门同时关闭。配置方法参照[腾讯云 CreateTrigger 官方文档](https://cloud.tencent.com/document/product/583/18589)。签名 STATUS 确认关闭，普通 ADMIT 返回 NETWORK_SERVICE_DISABLED，伪造 Timer 事件返回 UNAUTHORIZED。`timer-closed.json` 和最终回读均确认未开启。

PLAYER features 与既有 global bridge 全字段回读一致，持续桥接仍按已验收配置运行。本轮未重放迁移/bridge batch、未调用旧逐条分享接口、未提交或推送 Git。

## 三条构造来源与全链

三条均是用户明确允许的人工构造 smoke，使用随机 canonical URL 形状作为内部来源身份，**没有抓取或声称审核真实小红书文章**。服务端决定标记 testOnly，独立 synthetic review/rights 证据仅适用于构造内容及这三个来源 ID，不是实际文章 Founder 审核或版权证明。常规准入保持关闭，仅专用签名、精确三来源 allowlist、指定验收账号和 24 小时窗口可运行。

| 条目 | 生产结果 | 当前状态 |
| --- | --- | --- |
| A：官方网络验证（人工构造） | NETWORK_SOURCE → 原子准入 → 新 PublicMapLead；真实小程序 SDK query/detail 返回 public-map-v4、网络上传、OFFICIAL_NETWORK、null contributor。签名精确期限读取 query 空、detail LEAD_UNAVAILABLE。 | 保留一条供手机验收，仅 ICHI-001 对应真实账号可见。 |
| B：30天到期验证（人工构造） | observedAt 设为 30 天前加 120 秒。2026-10-06 22:35:45 +08 真实 query/detail 可见；真实期限为 22:37:40.033 +08，22:37:57 +08 读取已排除、detail 不可用。维护结果 RETIRED；随后 TAKEDOWN，历史保留。 | 已撤下、noResurrection=true。 |
| C：混合 PLAYER 支撑 | 使用已存在真实 PLAYER 雪未来的同版面事实与位置，新增 NETWORK 独立支撑，Resolution=UNIQUE_MATCH，原 publicLeadId 保留。维护使用仅该来源允许的精确 deadline 时钟，NETWORK 到期后切回真实 PLAYER；公开 query/detail 的受控未来读取确认 PLAYER 仍可用。随后在真实时钟撤下构造 NETWORK，恢复正常 PLAYER 可见。 | 已撤下、noResurrection=true；PLAYER 原公开 ID、版面、贡献者资料、备注、首次上传时间、观察时间、位置、记录类型全字段一致；servedVersion 4→7。 |

时间验证如实区分：B 是实际时钟越过期限，A 的读取与 C 的维护/读取采用签名、限定账号/公开 ID、30 秒凭证和精确 deadline 的受控时钟；不是等待实际 30 天。未来时钟不写 PLAYER 来源或 V1，不使旧来源复活。第一次入口拒绝及补测证据单列，不能当成到期 PASS。

生产公开响应与原生渲染状态递归检查无 source URL/source ID、私有 account/owner/openid、lineage、rights evidence、curator、takedown、contentDigest 或密钥。读取仅安全公开投影，无请求时 private/source join。NETWORK 不借用 PLAYER 条例/身份，贡献人仍 null。

证据：`smoke-admit-{0,1,2}.json`，各时刻 `smoke-read-*.json`，`smoke-reconcile-*.json`、`smoke-takedown-*.json`、`fallback-history-final-audit.json`。

## 显示与实际手机待办

原生模拟器真实调用生产函数，Marker/完整详情 LOADED、网络上传标识、官方地球图标、公开字段检查通过。截图复查发现此前图标虽在 presentation 数据中，却因 PLAYER 头像数组为空未挂入 WXML；已补独立官方来源图标分支及界面回归。PLAYER 头像堆叠保持，未填造 NETWORK 贡献者。

已生成包含该修复的新预览；`preview-final.log` 编译/预览成功，包 1,052,851 字节。证据 `native-network-display.json`、`native-network-marker.png`、`native-network-detail.png`、`preview-qr.png`。**这些是模拟器证据，不是实际手机 PASS**。已向用户请求可用手机型号和扫码实测，尚未收到设备结果。

手机验收入口：扫码 `preview-qr.png`，使用相同 ICHI-001 账号，地图选择“显示全部”，查看杭州临平 30.397、120.304 的“官方网络验证（人工构造）”，打开并展开详情；确认官方地球图标/网络上传、正确赏级和空备注，无玩家身份/来源链接/内部字段。记录设备型号、系统/微信版本和真实操作结果；需要真实触摸及截图，不能用 Element.tap/模拟器替代。若手机登录到其他账号，先核实该账号，仅为同一构造条目调整验收可见范围，不扩大一般准入。

测试可见窗口在 **2026-10-07 22:22:46.460 +08** 结束，届时读取仍会隐藏构造 ID。常规 timer 关闭，所以到窗口末隐藏不等于自动退役；A 暂保留供本次实际手机验收，随后使用已授权维护入口 TAKEDOWN，并关闭 smokeEnabled，保留来源与审计。B/C 已清理，真实 PLAYER 已恢复常规可见。下一轮只补手机与 A 清理，不重新部署、重播或重复三条 smoke。

## 自动验证

- 实际初次七部署包 287 项集成测试通过；两行修复的实际两个包 84 项通过，含入口 allowlist/签名拒绝。
- 当前源码 Vitest **1353 PASS / 1 既有 SKIP / 0 FAIL**；类型检查、ESLint、Next build、Playwright **26/26**、原生新预览编译通过。
- 原生模拟器真实生产展示及公开字段扫描通过；实际手机验证 PHONE_PENDING。
- 工作流、上传分享防回退、相关合同、目标格式、差异检查及最终收口以 `final-validation.json` 为准。

Phase3 的自动及生产门已通过，人工/实际手机门尚未完成，不标 HUMAN_APPROVED，不解锁下一 Phase 或正式发布。
