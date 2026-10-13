# TASK-V2-19｜V2 Runtime Routing Matrix（审计快照）

> 2026-09-28 多贡献者／上传 lineage 修订：本文件原审计快照及其末尾的单 owner 授权 binding 已被 Founder 新语义覆盖。当前本地候选改为 `candidate-upload-service.ts` → 服务端 `candidateRecordRef` → resolver/HA → 逐 upload `v2ShadowContributionLedger` → contribution-aware projector → detail；“我上传的版面”只列本人记录与删除。旧 `ACCEPT/WITHDRAW` 与 `v2ShadowContributionAuthority` 不得部署。当前准确资源／路由证据见 `v2-e-task-19-candidate-resource-exact-diff-v2.md`、`v2-e-task-19-candidate-upload-lineage-revision.md`。下方旧矩阵是修订前快照，不代表当前部署；候选代码也尚未云端部署。

日期：2026-09-28。状态：`CANDIDATE_RUNTIME_BINDING_BLOCKED / EXTERNAL_ACTION_APPROVAL_REQUIRED`。下面 55 行是**改代码前的审计快照**，逐项列出当时正式小程序的真实绑定；它们不应被误读为文末列出的当前本地接线状态。审计时地图数据来自 `SyntheticPublicMapService`，授权和举报来自本地 synthetic，HA disabled；真实原生定位属于设备数据。Founder 随后决定保留已批准单地图/单信息卡交互，并暂停机会 chip，本地候选接线的增量与仍缺的正向证据见文末。

状态缩写：`S` = candidate 正常路径可达本地 synthetic；`D` = disabled/fail closed；`R` = 已真实绑定但仅 V1 或设备功能；`M` = 缺前端；`B` = 缺后端；`X` = 与 Founder 批准的 16-A 最终地图交互图冲突；`T` = 仅测试/历史代码；`P22` = 生产迁移延后 TASK22。表内“写入目标”中的 `—` 表示只读或本机展示状态。

## Runtime Routing Matrix（改代码前快照）

| Surface ID | 页面/弹窗/控件 | 可见条件 | 展示字段 | 用户动作 | Client handler | Client service/adapter | Cloud Function/API | DB/authority source | 写入目标 | public/private boundary | 当前真实绑定 | synthetic/mock 是否可达 | 状态 | 缺口 | 修复方案 | 测试 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| M01 | 地图 Tab / map-preview | 选地图 Tab | 地图底图、公开 marker | 进入 | `onSelectTab` | `ensurePublicMapClient` | 无 | `SyntheticPublicMapService` | — | map 应只消费 public | 本机服务 `loadInitial` | 是 | S | query 未接 shadow | candidate transport；release 关闭 | `index.v2-map-shell.test.ts`、新 adapter test 待补 |
| M02 | 首屏 loading | `INITIAL_LOADING` | 正在载入 | 等待 | client subscription | `PublicMapClient` | 同 M01 | client phase | — | 无 private | 本机状态 | 是 | S | 云端响应未验证 | M01 接线 | `public-map-client.test.ts` |
| M03 | 空范围 | `EMPTY` + 无 marker | 空态、刷新 | 刷新 | `onMapRefresh` | `PublicMapClient.refresh` | 同 M01 | public query | — | 无 private | 本机 fixture 空态 | 是 | S | 云端空态未验证 | M01 接线 | `public-map-client.test.ts` |
| M04 | 首屏 error | initial error | 错误、重试 | 重试 | `onMapRetry` | `PublicMapClient.retry` | 同 M01 | error code | — | 错误不泄漏内部事实 | 本机错误映射 | 是 | S | CloudBase error envelope 未适配 | 稳定 error adapter | `public-map-client.test.ts` |
| M05 | 刷新/区域刷新 | `REFRESHING/VIEWPORT_REFRESHING` | retained data、提示 | 等待/刷新 | `onMapRefresh`/`onMapNativeRegionChange` | generation guard | 同 M01 | query identity | — | 仅 public cache | 本机服务 | 是 | S | 真实网络晚到未验证 | CloudBase transport + race test | `public-map-client.test.ts` |
| M06 | 分页/更多 | `LOADED` + `nextCursor` | 加载更多 | 点击 | `onMapLoadMore` | `loadNextPage` | 同 M01 | opaque cursor | shadow query snapshot | cursor 不由客户端解析 | 本机 cursor | 是 | S | 云端 cursor 未接 | 原样透传并校验响应 | `public-map-client.test.ts` |
| M07 | 分页错误/恢复 | `PAGINATION_ERROR/CURSOR_RECOVERY` | 错误、重试/首屏重载 | 点击 | `onMapRetry` | `PublicMapClient` | 同 M01 | cursor error | — | 旧页仅 public | 本机模拟 | 是 | S | 真实 cursor tamper/epoch 未测 | query adapter + 云端 rehearsal | `public-map-client.test.ts` |
| M08 | stale cache | `STALE_CACHE`/过期 | 过期提示、发布时间 | 刷新 | `onMapRefresh` | memory cache | 同 M01 | `asOf`、cache clock | — | 不把本机时钟当 freshness authority | 本机缓存 | 是 | S | 云端 asOf 未接 | 响应校验 | `public-map-client.test.ts` |
| M09 | 限流/服务不可用/未授权/schema | 对应 phase | 安全错误文案 | 重试/恢复 | `onMapRetry` | `mapPublicMapError` | 同 M01 | 服务 error code | — | 不显示内部安全原因 | 本机可模拟 | 是 | S | CloudBase 错误未正规化 | transport error mapping | `public-map-client.test.ts` |
| M10 | 搜索框/清空 | 地图 | 搜索文字 | 输入/清除 | `onMapSearchInput`/`onMapClearSearch` | discovery prototype filter | 无实际 search API | 本机 marker labels/tags | 本机 state | 不能请求 private search | 仅过滤本机 fixture | 是 | S | frozen public API 无关键词搜索合同 | 保持明确本机筛选或提新合同，不能伪称云搜 | `index.v2-map-discovery.test.ts` |
| M11 | 正向机会 chips/显示全部 | 地图 | 固定 emoji/label、选中态 | 切换/重置 | `onMapToggleDiscoveryFilter`/`onMapResetDiscoveryFilters` | `public-map-discovery-prototype` | query 的 opportunity filter 未直接绑定这些 tag | tag 基于 leadId 的 synthetic 映射 | 本机 state | 不能由 opaque ID 推断 opportunity | 当前 tag 由 fixture/leadId 派生 | 是 | S | `UNROUTED_DATA`：真实 tag authority 缺失 | 需 frozen public tag 字段/规则决策后接线 | `public-map-discovery-prototype.test.ts` |
| M12 | recordType/Freshness/Opportunity 原始筛选 | 当前 WXML 无独立控件 | 无 | 无 | 旧合同代码 | `PublicMapQuery` | query 支持部分字段 | public service | — | 只限公开字段 | 不可见 | 测试可达 | T/X | 总命令要求“所有筛选”，UI 图仅 chips | 不增加新控件，先作合同决策 | `public-map-client.test.ts` |
| M13 | LIST/MAP 切换及 list item | 当前 WXML 不存在 | 无 | 无 | 历史 handler/测试 | 旧 16-A 原型 | 无 | — | — | — | Founder 最终 16-A 删除 LIST transition | 不可见 | X | 与 `v2-interaction-map.md` 冲突 | 等 Founder 明确是否修订交互图 | `index.v2-map-discovery.test.ts` 历史测试不作当前验收 |
| M14 | 前台定位/回中 | 点击定位 | loading、位置状态 | 请求权限/定位 | `onMapRecenter` | `wx.getSetting/authorize/getLocation(gcj02)` | 微信设备 API | 设备前台位置 | 本机 camera | 设备坐标不等于 public location | 真正设备路径 | 否 | R | 真机仍需验证 | 保留 | `index.v2-map-canvas-marker.test.ts` + TASK20 真机待做 |
| M15 | 拒绝定位/手动浏览 | 权限拒绝 | 手动浏览文案 | 平移地图 | `onMapRecenter`/regionchange | native map | 微信设备 API | 设备权限 | — | 不 gate browse | 已有恢复 | 否 | R | 地图数据仍 synthetic | M01 接线 | `index.v2-map-canvas-marker.test.ts` |
| M16 | 当前位置蓝点 | `mapNativeLocationGranted` | 原生位置 | 浏览 | native map | `show-location` | 微信 map | 微信设备 | — | 不上传为 public lead | 真机 native | 否 | R | 真机校验 | TASK20 | TASK20 真机待做 |
| M17 | pan/zoom/regionchange | 原生手势 | viewport/zoom | 拖动缩放 | `onMapNativeRegionChange` | query identity + zoom settle | 同 M01 | public bbox + native scale | — | 真实坐标不偏移 | 本机数据 | 是 | S | 真实云 bbox 未接 | M01 接线 | `marker-zoom-adaptive.test.ts`、page tests |
| M18 | 前后台/Tab 返回 | `onShow`/Tab | retained map state | 离开/返回 | `onShow`/`onSelectTab` | client lifecycle | 同 M01 | public cache | — | 切换账号不得串数据 | map client 生命周期已在页内 | 是 | S | candidate auth/session 变更未验证 | 重新校验并失效 cache | `index.v2-map-shell.test.ts` |
| K01 | 单 marker/选中态 | 有 PublicMarker | icon、数字、状态 | 点击 | `onMapNativeMarkerTap` | `presentPublicMarker`→native projection | query/detail 待接 | public lead | — | 无 private record/account ID | 本机 fixture lead | 是 | S | 公共 field wire 未接 | M01 transport + validator | `public-map-native-presentation.test.ts` |
| K02 | cluster/count | 同屏近点 | count、PNG | 点击 | `onMapNativeMarkerTap` | screen-space cluster | 无 | public markers | — | 只聚合展示，不合并身份 | 本机 public marker 集合 | 是 | S | 真云点集未接 | M01 接线，保持坐标 | `public-map-cluster-engine.test.ts` |
| K03 | 最大倍率 picker | 不可自然分离 | 成员列表/数量 | 选成员 | `onMapNativeMarkerTap`/picker handlers | cluster picker | detail 待接 | 各自 publicLeadId | — | 不伪造坐标 | 本机 fixture | 是 | S | 真云成员未接 | 保持 identity，接 M01 | `public-map-cluster-picker.test.ts` |
| K04 | Canvas→PNG `iconPath` | marker 可见 | board presentation | 缩放/选中 | render scheduler | marker renderer/cache | 无 | public presentation | 本机临时 PNG | 图片不得带私有数据 | 当前本机 fixture 输入 | 是 | S | 输入未由真实 public wire 保证 | M01 + 私有字段静态/动态校验 | `marker-binding-adapter.test.ts` |
| K05 | marker 数字/档位 | marker 可见 | remaining/zoom tier | 浏览 | native projection | presentation+zoom adaptive | query 待接 | totalRemaining、public location | — | `null ≠ 0` | fixture marker | 是 | S | 服务端输入未验证 | strict public marker parser | `public-map-presentation.test.ts` |
| K06 | 聚合分裂/选择详情 | cluster tap | 成员 identity | 点击 | `onMapNativeMarkerTap` | picker/camera expansion | detail 待接 | distinct `publicLeadId` | — | 不使用 BoardInstance 内部 ID | fixture | 是 | S | 云端读未接 | detail adapter | `index.v2-map-canvas-marker.test.ts` |
| D01 | 卡片 loading | 选 lead | 读取提示 | 等待 | `onMapNativeMarkerTap` | `PublicMapClient.select` | detail 待接 | publicLeadId | — | opaque ID only | fixture | 是 | S | 真 detail 未接 | detail transport | `public-map-client.test.ts` |
| D02 | 信息卡基本字段 | detail loaded | IP/theme、总剩余、单价、LAST、tiers | 展开 | `onMapToggleDetailInfo` | `presentPublicDetail` | detail 待接 | PublicDetail allowlist | — | 无私有图片/权益 | synthetic detail | 是 | S | CloudBase wire/schema 未接 | detail adapter 严格解析 | `public-map-presentation.test.ts` |
| D03 | 现场备注/玩家/时间 | detail loaded | venueNote、contributor、observedAt | 展开/收起 | `onMapToggleDetailInfo` | public presentation | detail 待接 | public safe projection | — | no request-time private join | synthetic detail | 是 | S | 真 authority 未验证 | server serializer+adapter | `public-map-presentation.test.ts`；wire adapter test 待补 |
| D04 | 头像错误 fallback | 图片失败 | 默认头像 | 无 | `onMapContributorAvatarError` | local asset | 无 | asset fallback | — | 不暴露 private fileID | 本机 fallback | 否 | R | 云端 avatar URL 安全仍待验证 | strict wire avatar allowlist | `public-map-presentation.test.ts`；wire adapter test 待补 |
| D05 | detail unavailable/hidden/deleted | detail error | 不可用、重试 | 重试/关闭 | `onMapRetryDetail` | `PublicMapClient` | detail 待接 | current public lifecycle | — | 不解释内部 takedown 原因 | fixture error | 是 | S | 云端 visibility race 未测 | detail recheck + rehearsal | `public-map-client.test.ts` |
| D06 | close/back/切换 | card open | 原卡/新卡 | 关闭或选 B | `onMapCloseDetail` 等 | selection generation | detail 待接 | opaque lead | — | A 晚到不盖 B | 本机测试 | 是 | S | 网络实测未做 | transport race test | `public-map-client.test.ts` |
| D07 | 来源与非实时说明 | detail expanded | network source、非实时 disclaimer | 浏览 | presentation | `PublicDetail` | detail 待接 | public projection | — | 不作库存保证 | 文案+fixture | 是 | S | 来源 authority 未验证 | serializer 校验 | `public-map-presentation.test.ts` |
| D08 | report/点赞图标 | expanded card | `举报`、`—` | 点击 | `onMapIgnoreDetailControl` | 无 | 无 | 无 | 无 | 不得伪成功 | 明确占位，点击无效果 | 否 | D/X | 总命令要求 report 正向，但冻结图写“no action” | 先保持占位；修订交互图需 Founder 决策 | `index.v2-gemini-info-card.test.ts` |
| D09 | expanded detail / preview / list detail | 当前仅一个信息卡与备注展开 | 当前卡字段 | 点击详情信息 | `onMapToggleDetailInfo` | sheet state | detail 待接 | PublicDetail | — | 仅 public | 不是历史独立 expanded/list flow | 是 | X | 总命令命名与冻结 UI 不一致 | 以当前卡+备注展开为准；不新增旧流程 | `index.v2-gemini-info-card.test.ts` |
| A01 | 我的→我上传的版面 | 点击菜单 | 云端 V1 记录、贡献状态 | 进入 | `onOpenMyPage` | `loadMyCloudRecords`+auth client | V1 `list-my-records`；V2 无 | V1 private owner records；V2 synthetic status | — | V1 UI 可读本人记录，但不能 join 到 shadow | V1 真数据 + V2 本机假状态并排 | 是 | S/R | 授权状态会伪成功 | shadow auth endpoint；不复制 V1 | `index.v2-map-authorization.test.ts` |
| A02 | 授权范围/状态 | contributions | scope、版本、昵称头像 | 查看 | `onOpenMapAuthorization` | synthetic auth service | 无 | 本机常量+假状态 | — | Profile 不 gate，真实身份服务端 | 本机 snapshot | 是 | S/B | 没有权威持久状态 | 新 candidate auth function/ledger exact diff | `public-map-authorization-client.test.ts` |
| A03 | accept once/reauthorize | 未接受/版本变化 | 按钮/结果 | 接受 | `onAcceptMapAuthorization` | synthetic auth service | 无 | 客户端 version/digest + 本机状态 | 本机内存 | 不可自报 trusted owner | 本机成功 toast | 是 | S/B | 伪成功 | 服务端版本校验、幂等、持久化 | `public-map-authorization-client.test.ts` |
| A04 | 拒绝/稍后 | modal open | 不同意/关闭 | 点击 | `onDeclineMapAuthorization`/dismiss | client state | 无 | 本机展示状态 | 本机 state | 不影响 browse | 本机 | 否 | R | 无云写入本属预期 | 保留 | `index.v2-map-authorization.test.ts` |
| A05 | owned contribution/capability | status loaded | title/lifecycle/按钮 | 浏览 | auth subscription | synthetic snapshot | 无 | 本机示例 lead | — | 不能 client 推断 owner | 本机假 capability | 是 | S/B | 真实 owner authority 缺失 | 服务端 WXContext + shadow ledger | `public-map-authorization-client.test.ts` |
| A06 | withdraw/hide-first | capability true | 撤回反馈 | 点击 | `onWithdrawMapContribution` | synthetic service + local suppress | 无 | 本机 snapshot | 本机内存 | 真实读必须立即隐藏 | 本机 toast/局部隐藏 | 是 | S/B | 云端仍可返回 | 服务端原子 hide intent/outbox/read recheck | `public-map-authorization-client.test.ts` |
| A07 | delete 双重确认/no-resurrection | capability true | 确认弹窗 | 确认 | `onRequestDeleteMapContribution`/confirm | synthetic service | 无 | 本机示例 | 本机内存 | tombstone 阻止复活 | 本机成功 | 是 | S/B | 无持久 tombstone | shadow owner command + projection guard | `public-map-authorization-client.test.ts` |
| A08 | 授权 error/retry/account change | action fail | 错误、重试 | 点击 | `onRetryMapAuthorizationAction` | client retry | 无 | 本机服务 | — | A/B 不得串权 | 本机错误可模拟 | 是 | S/B | 真实账号切换和错误未接 | candidate transport+cache reset | `public-map-authorization-client.test.ts` |
| H01 | 上传成功轻量入口 | 有 `humanAssistanceCurrent` | 可选按钮 | 点击 | `onOpenHumanAssistance` | disabled HA client | 无 | 无 | — | 上传成功不依赖 HA | 永远无请求 | 否 | D/M | 缺可信候选 lineage | shadow 服务端签发 record/version ref | `human-assistance-client.test.ts` |
| H02 | 我的上传 pending 列表 | requests 非空 | 本次版面 label | 打开 | `refreshHumanAssistance`/open | disabled HA + V1 recordVersions | 无 | V1 private record IDs 用于本地过滤 | — | 不得拿 V1 recordId 伪装 shadow ID | 永远为空 | 否 | D/M | shadow 返回不含匹配字段 | 候选专用版本视图，禁止 V1 join | `human-assistance-client.test.ts` |
| H03 | 两卡比较/四回答 | 选 pending | 两 label、四按钮 | SAME/DIFFERENT/CANNOT_TELL/SKIP | `onAnswerHumanAssistance` | HA client | `v2-shadow-answer-assistance` 尚未绑定 | synthetic request/card | evidence collection | 回答只是 evidence | disabled，不能成功 | 否 | D/M | wire contract、lineage 缺失 | get-my/answer 可信 adapter | `human-assistance-client.test.ts`、B2-R4 historical |
| H04 | duplicate/expiry/answered/withdrawn/version change | request lifecycle | 安全消失 | 再提交/返回 | HA client prune | local generation/idempotency | shadow answer 未绑定 | request/version | evidence | no stale submit | 本地逻辑通过，云端未连 | 测试可达 | T/M | 版本权威不匹配 | server ref + caller check | `human-assistance-client.test.ts` |
| H05 | no request/budget/cooldown/network fail | 空/错误 | 无入口或失败提示 | 跳过/重试 | `refreshHumanAssistance` | disabled service | shadow resolver/get-my 未绑定 | 测试 policy | — | HA 失败不影响 V1 upload | 空/失败 | 否 | D/M | 云端可用性与 policy 未接 | policy 保持 candidate test only，网络失败空态 | `human-assistance-client.test.ts` |
| H06 | A/B 跨账号隔离 | 两账号 | 仅本人请求 | 列表/回答 | HA client | 无身份参数 | shadow get-my/answer | `getWXContext` digest | HA evidence | 禁止 callerDigest 客户端自报 | R4 独立测试曾通过，正式 app 未接 | 否 | M | 正式 app transport 缺失 | WXContext server-only | B2-R4 historical + 新端到端待做 |
| R01 | 举报四类/原因/modal | 当前 WXML 无 modal | 无 | 无 | `onOpenMapReport` 等死 handler | synthetic report client | 无 | 本机 Set | 本机内存 | 不得伪成功 | 举报图标只 `onMapIgnoreDetailControl` | 测试/死代码可达 | T/X/B | 冻结 UI 无入口；后端也无 | 保留禁用；UI 决策后接新函数 | `public-map-report-client.test.ts` 仅本地 |
| R02 | 提交/幂等/审核阈值/隐藏 | 当前不可见 | 无 | 无 | `onSubmitMapReport` 死 handler | synthetic report | 无 | 无持久审核 ledger | 本机内存 | reporter 必须 WXContext、hide-first | 本机模拟 | 测试/死代码可达 | T/B/X | 真实 moderation authority 缺失 | exact resource diff，先不启用 UI | `public-map-report-client.test.ts` 仅本机 |
| S01 | 好友/朋友圈分享 | tab | tab route | 微信分享 | `onShareAppMessage`/`onShareTimeline` | `home-sharing` | 无 detail call | tab allowlist | — | 不含 private ID | V1/tab share | 否 | R | 尚无 publicLeadId deep link | 不加未批准分享入口；若启用需真实 detail | `home-sharing.test.ts` |
| S02 | 复制链接/落地 | tab/deeplink | tab | copy/open | sharing handlers/`onLoad` | `parsePublicShareTab` | 无 | tab allowlist | — | 不泄露 private record/account/location | 仅 tab landing | 否 | R/P22 | lead-specific landing 不存在 | 新 public route 合同及 detail adapter 后实现 | `home-sharing.test.ts` |
| U01 | V1 finalized upload/draw | 上传/抽赏完成 | 已提交 | 上传 | `onConfirmGrandPrizes`/`onSubmitEvidence` | V1 recognition/upload functions | V1 functions | V1 private records | V1 collection | 候选不能读复制 V1 private | V1 真实链，未触发 shadow resolver | 否 | R/B | candidate source bridge 未批准 | server synthetic lineage；production bridge P22 | V1 upload tests + B2-R3 historical |
| U02 | Verification→BoardInstance→HA | synthetic fixture | 无直接 UI | 服务端生成 | 无正式 handler | shadow resolver | `v2-shadow-resolve-observation` | `v2ShadowSourceFixtures`→instance/decision/request | shadow 3 collections | synthetic_only | 仅管理端 rehearsal，非正式 upload | 否 | B | 缺受信入口/record ref | 服务端候选 ledger + exact diff | B2-R3 canonical 12 |
| U03 | projector→public query/detail | eligible synthetic | marker/card | 浏览 | map client | synthetic service | shadow projector/query/detail 独立存在 | outbox→public leads | shadow leads | hide/read-stop | 云端曾演练，正式 app 未接 | 是 | S/M | 前端无真实 binding | candidate read adapter | B2-R3 + 新端到端待做 |
| U04 | V1 record delete→V2 hide | 删除本人 V1 记录 | 删除提示 | 删除 | `onDeleteCloudRecord` | V1 delete + HA invalidate | V1 delete function | V1 private record | V1 collection | 不能把 V1 delete 当 shadow hide 已完成 | V1 真删除，shadow 无 propagation | 否 | B/P22 | production bridge 未设计/批准 | 仅 synthetic candidate owner command；生产迁移 TASK22 | V1 delete tests，candidate 待测 |

## V2 Data Lineage Matrix

| 用户看到的字段 | presentation field | client model | wire response | Cloud Function serializer | DB/service authority | source lifecycle/version | 当前结论 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| marker/详情身份 | `publicLeadId` | PublicMarker/PublicDetail | `publicLeadId` | public API/query/detail | `v2ShadowPublicMapLeads` | servedVersion + public lifecycle | S；正式 app 未接 wire |
| BoardInstance identity | 不公开 | 无 | 无 | resolver internal only | `v2ShadowBoardInstances` | decision/instance version | 合同正确；不可把 ID 暴露给 marker |
| 地点/精度 | native marker position | `publicLocation` | GCJ02 location | `publicCore`→public API | shadow public leads projection | locationPolicyVersion/projectionRuleId | S；真实 wire 未接 |
| 观察时间 | `observedAtLabel/ClockLabel` | PublicFreshness | `observedAt/freshnessAsOf` | public API | projection snapshot | observedAt + policyVersion | S；不能用客户端钟作权威 |
| Freshness | 时间相关标签 | PublicFreshness | band/policyVersion | public API freshness policy | projection/read service | asOf/policy | S；待真实响应 |
| Opportunity level/reason | marker tag/卡片 | PublicMarker/PublicDetail | level/reasonCodes | public API | projection policy | evaluatedAt/policyVersion | **UNROUTED_DATA**：当前正向 chip 由 leadId synthetic 映射，不是权威 level |
| recordType | marker/card | PublicMarker/PublicDetail | DRAW/UPLOAD/null | public API | source fixture→projection | source version | S；当前 UI 不是独立筛选 |
| IP/theme | `displayIpTheme` | PublicDetail | board.ipName/themeName | detail serializer | public leads board snapshot | servedVersion | S；detail wire 未接 |
| 剩余总数 | `totalRemainingValueLabel` | PublicDetail | board.totalRemaining | detail serializer | public leads board | servedVersion | S；严格保留 `null ≠ 0` |
| tiers/零/未知 | `tiers[].remainingLabel/isSoldOut/isUnknown` | PublicDetail | remainingTickets | detail serializer | public leads board.tiers | servedVersion | S；0=完售，null=未知 |
| 单价/LAST | `priceLabel/fullPackAmountLabel` | PublicDetail | pricePerDrawMinor/fullPackCostMinor | detail serializer | public leads board | servedVersion | S；LAST 不在客户端推导 |
| 玩家昵称/头像 | `contributorName/AvatarUrl` | PublicDetail | public contributor avatar union | detail serializer | approved public contributor projection | authorization+servedVersion | S；不得 request-time join V1 profile |
| 来源 | `sourceLabel` | PublicDetail | sourceLabel | detail serializer | approved projection | source version | S；待真实 wire |
| 备注 | `venueNotePreview/Body` | PublicDetail | venueNote | detail serializer | approved public projection | content safety+authorization | S；不得读 V1 raw note |
| 授权版本/适用性 | auth status/scope copy | authorization snapshot | 当前无真实 wire | **不存在** | **无 shadow auth ledger** | authorization version/scope digest | **UNROUTED_DATA**；本机伪状态 |
| owner capability | ownedContributions | owner snapshot | 当前无真实 wire | **不存在** | **无受信 owner ledger** | per-lead lifecycle | **UNROUTED_DATA**；本机示例 |
| HA request/两卡/version | request labels | HumanAssistanceRequestView | 云端仅 requestId/expiresAt/cards | get-my serializer | HA request + synthetic fixture | observationVersionId/observationVersion | **CONTRACT_MISMATCH**：前端需 recordId/submissionVersion；不可借 V1 ID |
| HA 回答状态 | pending/error | HA client | answer result | answer function | shadow HA evidence | request+action id | 正式 app 未接；R4 独立测试非正式 binding |
| report state | 当前仅禁用图标 | dead report client | 无 | **不存在** | **无 shadow report ledger** | category/reporter/policy | **UNROUTED_DATA/CONTRACT_CONFLICT** |
| hidden/withdrawn/deleted | unavailable/owner status | map/auth client | public query/detail + owner snapshot | query/detail publicCore | public leads lifecycle/tombstone | servedVersion/outbox epoch | 正式 app 本机假 hide；shadow rehearsal 曾验证 read-stop |
| 分页/asOf | 更多/刷新/错误 | map client state | nextCursor/asOf/queryEcho | query function | query snapshots + HMAC | snapshot expiry/read epoch | S；正式 app 未接，cursor 不能解析 |
| marker/cluster identity | icon/member list | public marker + cluster projection | distinct publicLeadId | query function | public leads | servedVersion | 本机聚合不改 identity；真实输入待接 |

## Founder 决策与审计后的当前 binding

Founder 明确保留现行冻结交互：LIST 切换、独立 expanded detail、可提交举报、lead-specific share landing 均为**当前产品不可达路径**，不新增入口，也不把不可达记作正向 PASS。机会 chip 暂停展示；`publicLeadId` 及本地 synthetic 标签不能充当筛选 authority。`memory-bank/design-document.md` 与两张地图合同图已记录此决定。

| Surface / lineage | 当前本地 binding | 证据和边界 |
| --- | --- | --- |
| M01–M22、K01–K10、D01–D07 | `pages/home/index.ts` → `CandidatePublicMapService` → 固定 shadow query/detail；公开字段经严格 schema/private-field 校验进入现有 map/Marker/cluster/单卡 presentation | 仅 develop/trial 可调用，release/未知 fail closed；现有 CloudBase read flag=false，尚无正式小程序真实正向响应。分页、late response、`null != 0` 由既有 client/adapter 本地测试覆盖。 |
| Opportunity chip/本地 tag | WXML `mapDiscoveryChipsEnabled=false`；真正 candidate leadId 需 32 位 hex，旧 synthetic alias 仅测试 fixture 可匹配 | **已停用**，不能把芯片筛选记作正向验证。公开 opportunity level/reason 仍由 public API 返回；旧 chip 标签不参与正式 candidate 展示。 |
| A01–A08 | 正式 page → `CandidatePublicMapAuthorizationService` → 待批准 `v2-shadow-manage-contribution`；服务端草案持久 consent/owner ledger | 云端未建新 collection/function，当前 accept/withdraw/delete 均 fail closed；本人当前 synthetic fixture 最多 20 条的历史补 outbox 已本地测试，真实云端未验证。 |
| H01–H06 | 正式 page → `CandidateHumanAssistanceService` → 既有 shadow get-my/answer；本地新版 get-my 返回可信 candidate record/version | 「我的」pending 可用本地测试验证；**真实 V1 上传成功态不能与 synthetic candidate ref 同源匹配**，未达全链 PASS。四类答案/过期/重复等本地合同与旧 R4 历史证据不可替代新真机验证。 |
| R01–R02 | 当前 UI 举报图标仍无动作；page 的 report service 改为 unavailable | synthetic report 本地成功不在正式 page 可达，但没有正向 report backend；依 Founder 决策属不可达。 |
| S01–S02 | 现有 tab 分享和安全落地维持；没有 lead-specific 详情分享 | 不将纯 tab share 冒充 lead-specific public detail share。 |
| U01–U04 | V1 上传/识别链维持原系统；candidate resolver/projector 仍仅 synthetic fixture | 新 projector 本地代码需部署批准；V1 private records 不作为 rehearsal data。生产 migration 仍在 TASK22。 |

## Data lineage 修正与未路由字段

上表前的 lineage matrix 记录改代码前状态。当前公开 `publicLeadId`、地点、观察时间、Freshness、Opportunity level/reason、recordType、余量/价格、contributor、source、pagination、marker member identity 均由 shadow public query/detail 的 serializer 与候选 adapter 绑定，**但尚无真机正向 read-back**。HA request 的 candidate record/version 已由服务端 synthetic fixture 派生；V1 上传成功态同源匹配仍未路由。Consent/owner 的本地 authority 设计已形成 exact diff，尚未云部署；本人当前 synthetic fixture 的 history 补投影仅有本地有限上限测试。Report state 因当前 UI 不可达而不作为正向字段；机会 chip 的 synthetic 标签因控件停用而不可见。没有任何 private V1 record/account/location request-time join 被新增。

## 只读 preflight、测试和当前 gate

- CloudBase 只读认证 READY，环境 `cloud1-d7gxqfwv783a1f131 / ap-shanghai`：22 collection（13 V1 + 9 shadow）、25 function（19 V1 + 6 shadow）。九个 shadow ACL=`ADMINONLY`，15 个显式 index 与合同一致；六函数 Active/Nodejs20.19/timeout 3s/0 trigger，四 flag=false、allowlist 空。HMAC 仅核对存在，不回显值。未读取 V1 private record。本轮未做完整 V1 资源新基线 diff，不能宣称本轮 `V1_DIFF=0`；既往 closeout 的 diff=0 为历史证据。
- 本地 root/Web TypeScript、ESLint、全量 Vitest `998 passed / 1 skipped`、新贡献函数 5/5、三包静态校验、合同/workflow、Next production build、Web Playwright 26/26、微信 CLI preview 1,008,183 bytes、包体审计 dev/fixture=0 与 `git diff --check` 通过。每项旧审计测试引用只说明对应局部行为覆盖，**不等于 55 项都完成新候选端到端测试**。真实 CloudBase smoke、V1 read-back、微信真机仍未完成。
- 本轮 CloudBase external writes=0；三包及 1 collection/1 index/1 新函数/2 更新函数 exact diff 见 [独立清单](./v2-e-task-19-candidate-resource-exact-diff.md)。`TASK-V2-19 = IN_PROGRESS / CANDIDATE_RUNTIME_BINDING_BLOCKED / EXTERNAL_ACTION_APPROVAL_REQUIRED`；未 COMPLETE/HUMAN_APPROVED/FROZEN，TASK-V2-20 未开始。
