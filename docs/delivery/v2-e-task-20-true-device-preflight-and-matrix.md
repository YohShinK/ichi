# TASK-V2-20｜真机 Preflight 与执行矩阵

## 2026-09-30 最终补测结果（覆盖下方历史状态）

TASK20=`TRUE_DEVICE_GATES_PASS_WITH_FOUNDER_ACCEPTED_GAPS / AWAITING_FOUNDER_FINAL_ACK`。M1隐藏消费、关闭定位手动浏览及恢复定位均真机PASS；synthetic核验失败重试、真实单贡献删除与后台旧事件防复活已完成。原合成上传保留。完整V1_DIFF=0 / VERIFIED，安全停机epoch25。Device B、第二账号B新隔离、真实慢网和无安全路径的500数值记NOT_RUN / FOUNDER_ACCEPTED_EVIDENCE_GAP；F2及多人删除仍为accepted limited gaps。详情首次慢保持P2，交TASK21优化。TASK21 READY / NOT_STARTED。

完整最新矩阵及证据范围见 [最终Device A报告](v2-e-task-20-final-device-a-gap-closure.md)、[完整V1核验](v2-e-task-20-final-v1-diff-verification.md)与[最终验收](v2-e-task-20-final-acceptance.md)。下方均保留为历史，不以旧pending或epoch代替最终结论。

## 2026-09-29 Device A 补测与范围裁定（当前）

Founder 明确不做第二台设备；Device B、第二平台／低端、账号 B 隔离和跨账号分享均为 `NOT_RUN / FOUNDER_SKIPPED / EVIDENCE_GAP`。P2B 拒绝定位按先前要求跳过；没有可稳定复现的弱网，J3 为 `NOT_RUN / NO_REPRODUCIBLE_NETWORK`。Device A 正式预览码 `artifacts/task20/preview-qr-m1-20260929.jpg`（999,617 bytes）下，Founder 确认上海 7 个合成标记、无匹配提示与清空后标记恢复都正常；P1D 搜索恢复缺口关闭。首次标记详情仍慢、重复打开快、无白屏，`T20-P2-01` 保持 OPEN；本轮 CLS detail 函数首次 2,972 ms，后三次 289/346/361 ms，不能由此推断端上完整耗时。

7 条测试标记随后精确改为 `HIDDEN / HIDDEN`，read epoch 18→19，服务端只读回查无公开标记。Founder 刷新／拖缩后的真机结果尚待回报，M1 隐藏消费不标 PASS。候选读窗口已关闭并回读 read-stop=true、epoch=20、HA pause=true、8 函数 flags=false/allowlist 空、`PUBLIC=0`。V1 集合／索引／ACL／函数版本与基线一致，存储根两项对象元数据与历史快照一致；完整规则／环境套餐比对未完成，完整 `V1_DIFF=0` 不成立为已证事实。本轮结论为 `IN_PROGRESS / EVIDENCE_GAPS`，详见 Device A session 和最终验收记录。下方矩阵为各阶段历史快照。

## 2026-09-29 P3 上传列表语义修正与真机复测补记

Founder 确认正式预览版中合成测试上传仍在“云端”列表、徽标为“已上传”，且不再出现“已分享至地图／暂不分享”文案；新码见 `artifacts/task20/preview-qr-p3-share-semantics-20260929.jpg`，缺陷 `T20-P2-03` 记受影响界面路径真机通过。真实失败核验重试、未同意后同意带来的自动地图投影仍待取证。测试窗口结束回读 8 函数 flags=false/allowlist 空、read-stop=true、epoch=17、HA pause=true、PUBLIC=0。此补记不改变下方原始矩阵未执行项，也不作为全 TASK20 验收。

随后专用诊断预览副本建立 A 本轮 `SHARE` 合成记录，Founder 左滑删除后确认专用卡片消失、TASK19 原卡片仍在；后端新行 `DELETED / noResurrection=true`，只有 `DELETE_EVENT`，无 `STATE` contribution 和地图投影。故本人上传删除 UI 已获真机证据，删除对多贡献者或最后贡献者 Marker 的影响仍未取证。submit/manage 入口再次关闭，8 函数 flags=false/allowlist 空，PUBLIC=0。

## 2026-09-29 P4—P6 真机结果与 stop-state（最新）

正式版新码 `artifacts/task20/preview-qr-p4-20260929-172505.jpg`（999,576 bytes）下，Founder 确认好友和朋友圈分享卡片均同账号落到“我的”页；同账号冷启动从文件传输助手打开卡片也到“我的”；跨账号仍待验证。My Upload 显示“条例状态暂不可用”时，candidate consent 服务正按安全态关闭。P5 飞行模式下原有标记保留、提示清楚、联网后恢复；Wi‑Fi/蜂窝切换后拖动/刷新/详情正常。P6 后台返回、Tab 往返、锁屏解锁后地图/标记/详情正常且无重复提示。P5 真实弱网与 late-response 竞态无设备证据；P6 listener 数量未测、账号 B 不可用。仅 A 的 query/detail 与 7 条 synthetic UI fixture 曾在两个短窗口开放；最后停机回读 8 函数 flags=false/allowlist 空、`read-stop=true`、epoch=17、`ha-pause=true`、`PUBLIC=0`。P3 删除/投影、M1、Device B、完整 V1 diff 与最终人工验收仍未完成。

## 2026-09-29 P3 条例已同意路径与统一列表修正（最新）

Founder 扫 16:37 新码确认账号 A 的条例读取态约 1–2 秒后消失，已同意卡片不再出现；T20-P1-03 的 A 路径 `USER_REPORTED_TRUE_DEVICE_PASS`。同屏候选上传另列于云端滚动区上方的交互不符合 Founder 要求，记 `T20-P2-02`；已在当前 TASK20 修为同一“云端”列表、同卡片/左滑垃圾桶/确认删除，计数和空态合并，后端 candidate ref 与 V1 recordId 仍各自可信。定向 32/32、全量 Vitest 994/1、ESLint、双 TS、contracts/workflow、Next build、包体审计 sourceBytes=1,307,066/devOrFixtureCount=0、微信 preview 999,576 bytes 均通过。Founder 扫 16:47 新码确认位置、样式、左滑垃圾桶及删除确认弹窗均正常，并取消删除；T20-P2-02 受影响路径真机通过。P3 测试入口已关闭并回读 8 函数 flags=false/allowlist 空、`read-stop=true`、epoch=13、`ha-pause=true`、`PUBLIC=0`；V1 结构子集 19 函数/43 index/13 ACL 与 TASK19 基线相同，完整配置/Storage hash 未重做；现有 TASK19 合成上传未删。下方旧记录为阶段快照。

## 2026-09-29 P3 条例卡片修复状态（最新）

Founder 截图 `/Users/cunfu/Downloads/IMG_2930.PNG` 显示账号 A 在“我上传的版面”被误标“未同意”，条例弹窗按钮错位且无效，记 `T20-P1-03`。候选 manage/consent 函数关闭使客户端得到未知状态，旧 WXML 把未知当未同意；通用绝对定位按钮与后置固定高度弹窗规则造成视觉错位。已先更新产品事实源，随后修客户端状态和局部 WXSS；定向 10/10、全量 Vitest 993 passed/1 skipped、ESLint、双 TypeScript、contracts/workflow、Next build、微信 CLI preview 997,330 bytes、包体审计 dev/fixture=0 通过。预览码 `artifacts/task20/preview-qr-p3-fix-20260929.png`。仅对 A 短时开放 P3 manage/consent 候选函数，未收到复测结果后重新关闭；回读 8 函数 flags=false/allowlist 空，`read-stop=true`、epoch=13、`ha-pause=true`，7 条测试行 HIDDEN，`PUBLIC=0`。V1 结构子集回读 13 collection 存在、43 index、13 ACL、19 函数版本结构无差异；完整 Storage/环境配置 hash diff 未重做。P3 真机复测仍待执行。P2A 两项 P1 已获 Founder 受影响路径真机通过；P2B 按 Founder 指示记 `NOT_RUN / FOUNDER_SKIPPED`。下方早期阶段记录保留作历史快照。

## 2026-09-29 P2A 第二次修复状态（最新）

Founder 用首次修复版确认空地图可见、定位/刷新按钮可见、拖动和缩放均生效，但空地图手势后短暂出现“地图状态需要恢复”的全屏误报。记 `T20-P1-02`；P2B 及后续阶段继续暂停。候选窗口已安全关闭：8 shadow 函数所有 flags=false/allowlist 空，`read-stop=true`、epoch=11、`ha-pause=true`，7 条 UI fixture HIDDEN、`PUBLIC=0`。第二次源码修复只在实际 `mapErrorMessage` 存在时显示恢复遮罩；定向 46/46、全量 Vitest 992/1、ESLint、双 TypeScript、contracts/workflow、Next build、Prettier、微信 CLI preview 996,167 bytes、包体审计 dev/fixture=0 通过。新二维码为 `artifacts/task20/preview-qr-p1-retest-v2-20260929.png`，尚未开启新真机窗口或获得第二次修复版设备结果。下方 epoch=9 描述为此前阶段历史快照。

日期：2026-09-29。状态：`IN_PROGRESS / P1_REPAIR_AND_RETEST`。唯一环境：`cloud1-d7gxqfwv783a1f131 / ap-shanghai`。本文件只记录 TASK20 的当前证据；`docs/delivery/v2-e-task-19-minimal-real-wechat-rehearsal-closeout.md` 是 TASK19 历史证据，不替代本轮真机结果。

## 前置状态与边界

- TASK19=`COMPLETE / HUMAN_APPROVED / FROZEN`；TASK20=`IN_PROGRESS / TRUE_DEVICE_VALIDATION`；TASK21/22 未开始。
- Founder 可用 Device A：iPhone 16 Pro / iOS 26；微信版本、基础库版本、账号 A 当前登录状态、定位权限及当前网络待现场记录。Device B 暂不可用；`SECOND_PLATFORM / LOW_END = EVIDENCE_GAP`。
- 仅候选／开发版或体验版、`SYNTHETIC_REHEARSAL` 数据。不得读取 V1 private record；不得新增 collection/index/function/secret/trigger/Storage，不做 production backfill、pilot 或发布。
- 当前正式小程序 `map-preview` 建立 `CandidatePublicMapService`，develop/trial 调用 `v2-shadow-query-public-map-leads` 与 `v2-shadow-get-public-map-lead-detail`；release/unknown fail closed。“我上传的版面”使用 candidate upload/consent service。此为源码接线证据，真机调用仍需本轮日志验证。
- 已批准产品语义：一次性 `NOT_ACCEPTED → ACCEPTED`，无关闭/撤回；My Upload 删除本人原始记录；原生地图、Canvas PNG marker、连续 zoom、聚合与滚动 Picker；当前 tab share/landing。旧 spiderfy、LIST toggle、lead 专属分享和 Opportunity chip 不作为本轮可达功能。

## CloudBase 只读 preflight

| 项目 | 2026-09-29 读回 | 判定 |
| --- | --- | --- |
| 登录/环境 | account scope、ap-shanghai、目标 env `READY` | PASS |
| 资源数 | 25 collections（13 V1 + 12 shadow）、27 functions（19 V1 + 8 shadow） | 与 TASK19 stop-state 一致 |
| Shadow 函数 | 8 个 `Active / Available / Nodejs20.19 / index.main / 10s / 0 trigger`；依赖安装启用 | PASS |
| Shadow 配置 | 所有读取的 `*_ENABLED=false`、8 个 caller allowlist 空、boundary=`synthetic_only`；HMAC 仅确认绑定存在，未读取/记录值 | 安全关闭 |
| 控制状态 | `global:ha-pause=true`、`global:read-stop=true`、epoch=5 | 安全关闭 |
| 公开候选 | `v2ShadowPublicMapLeads` 当前 `PUBLIC=0`；已有 synthetic hidden/retired evidence 保留 | 安全关闭 |
| V1 结构 | 13 collection 名称、43 index 定义、13 ACL、19 function 的 ModTime/CodeSize/runtime/trigger 数与 `/tmp/ichi-task19-v1-readonly-baseline.json` 一致；环境函数调用规则一致；Storage 根项计数=2。Phase 1 窗口开启后再次只读对照，以上各项 `issues=[]` | 本轮结构子集无差异；完整停机后 `V1_DIFF=0` 待复核 |
| Shadow collection/index | 12 collection 可见，21 个显式 index（另有平台自动 index）；12 个 ACL 均 `ADMINONLY` | PASS |

未读取 V1 业务记录。上表描述写入测试 fixture 和开启窗口前的只读 preflight；此后仅改动已批准的 shadow 测试数据与两个只读函数的开关/allowlist。

## Fixture 与测试窗口

| 需求 | 当前可用证据 | 本轮准备/限制 |
| --- | --- | --- |
| 普通 marker + detail | TASK19 曾在真实微信看到 1 个 synthetic marker/detail；该 row 当前 HIDDEN | 已另建 1 条 HIDDEN 的 TASK20 UI 测试行；窗口内才公开，真机待验证 |
| 可自然 cluster/split 的区域 | TASK18 本地正常 product-path fixture | 已另建 3 条 HIDDEN 的 TASK20 UI 测试行，三点经纬度相近而不同；真机待验证 |
| 最大 useful zoom 重叠 Picker | TASK17 本地 20 点 fixture | 已另建 3 条 HIDDEN 的 TASK20 UI 测试行，三点完全同坐标；真机待验证 |
| contributor/public-safe note | TASK19 synthetic detail 有 contributor；当前 HIDDEN | TASK20 单点行带合成公开备注；真机 detail 待验证 |
| hidden/unavailable stale/late | 已有 HIDDEN/RETIRED synthetic row | 待在本轮 live query/late 场景验证 |
| My Upload 删除 | 1 条 ACTIVE synthetic candidate upload；账号 A 在 TASK19 已接受 consent | 删除为不可逆测试动作，先核对 A 当前可见性、必要时选择本轮专用记录 |

以上 7 条由 CloudBase 管理端写入现有 `v2ShadowPublicMapLeads`，`_id=lead:2020…01—07:1`，初始均为 `SYNTHETIC_REHEARSAL / HIDDEN / HIDDEN`。它们只用于地图 UI、cluster/Picker 和公开备注的候选测试，不代表真实 upload→consent→projector 资格链已经通过；该链由本轮 My Upload/consent 个案另测。没有读取或复制 V1 private records。Device A Phase 1—2A 短时窗口仅启用 query/detail 两个 shadow read 函数，caller allowlist 限账号 A 的服务端 consent digest；其余 6 函数关闭、allowlist 空，`global:ha-pause=true`。7 条 TASK20 UI fixture 转为 `PUBLIC / VISIBLE`，读回 `PUBLIC=7`；read epoch 5→6，`global:read-stop=false`。账号 digest/HMAC 值未写入本报告。首次微信 CLI preview 为 996,519 bytes。P2A P1 出现后已立即停机：先置 `read-stop=true` 并将 epoch 6→7，再关闭 query/detail flags、清空其 allowlist，最后将 7 条行改回 `HIDDEN / HIDDEN`；读回所有 8 个函数的 `*_ENABLED=false`/allowlist 空、`PUBLIC=0`、`ha-pause=true`、`read-stop=true`、epoch=7。测试数据保留作证据，未 cleanup。修复版 P2A 复测窗口再次短时开放：仅 query/detail 两函数 `READ_ENABLED=true`、限 A；7 条行读回 `PUBLIC=7`，`read-stop=false`、epoch=8，其他 6 函数仍关闭、HA 暂停。新预览包 996,237 bytes，二维码 `artifacts/task20/preview-qr-p1-fix.png`。由于窗口内未收到 Founder 结果，已再次停机，最终回读 8 函数全部 flags=false/allowlist 空、`read-stop=true`、`ha-pause=true`、epoch=9、`PUBLIC=0`。修复版真机结果仍待补。

## 真机矩阵

每个 Phase 单独交给 Founder，每次最多 3—6 个动作；实际设备结果写入独立 session 报告。

| Phase / case | Device A 目标 | 证据状态 |
| --- | --- | --- |
| P1 地图主链 | 首屏、pan、连续 zoom、cluster/split/merge、Picker 两成员、detail、Tab away/back；marker/PNG/setData、闪动、卡顿/崩溃 | 1A 地图/pan/zoom Founder 报告正常、7 marker；1B 自然分开、Picker scroll 与 Tab 正常，详情 4–5 秒冷/约 1 秒热见 T20-P2-01；1C Picker 详情切换及拖缩正常。筛选条按批准语义隐藏，N/A；无匹配词搜索显示正确空结果，清空恢复待确认。 |
| P2 定位 | 真系统 allow → deny → manual browse → 恢复；`wx.getLocation(gcj02)`、权限文案/循环 | 2A FAIL：无公开线索区域全屏遮罩阻断浏览，T20-P1-01；修复版真机复测待执行。2B NOT_RUN |
| P3 Consent/My Upload | A 的一次性 consent 持久、无 Profile gate；本人的 candidate upload 删除与 projection/no-resurrection | NOT_RUN |
| P4 分享 | 当前好友分享及若可达的 Timeline，冷/热启动落地与公开字段边界 | NOT_RUN |
| P5 网络 | 真实 offline、恢复、Wi-Fi/蜂窝切换、可复现弱网、late response | NOT_RUN |
| P6 生命周期/账号 | 前后台、锁屏、Tab 往返；账号隔离若有第二账号 | NOT_RUN |
| P7 第二平台/低端 | 第二设备缩短交互与性能矩阵 | EVIDENCE_GAP：暂无 Device B |
| M1 migration/rollback 消费 | TASK19 已批准 candidate/synthetic identity/version、hidden/deleted、`null != 0`、read-stop fail closed；无 V1 production backfill | NOT_RUN |

TASK18 已批准预算为参考：500 snapshot/50 页/120s、本地响应体与计算预算；设备侧 500 点首次稳定代理 Dense ≤3,000ms、Worst ≤5,000ms，帧间隔 P95 目标 ≤33.3ms，PNG 失败/结束 pending=0。当前正常产品路径不强制 500 个 individual；真实内存/PNG 磁盘缺可靠数值时记 `NOT_MEASURABLE`，不编造 FPS/内存或产品新阈值。

## 自动回归与安全停机清单

本轮首轮 full Vitest `991 passed / 1 skipped`、ESLint、root/Web TypeScript、contracts/workflow、v3 artifact validator、package audit（源码 1,302,372 bytes，dev/fixture count=0）、targeted shadow/candidate `52/52`、touched Prettier、`git diff --check`、Next build 与微信 CLI preview（996,519 bytes）通过。Web Playwright 25/26：唯一失败为既有 V1 草稿左滑 timing-sensitive 用例，单独重跑再次失败；见 `v2-e-task-19-local-validation-flake-acceptance.md` 的历史接受边界。本轮不将 Web Playwright 记作 PASS，也不修改冻结 V1 业务。P1 修复后 46 项定向测试、全量 Vitest `992 passed / 1 skipped`、ESLint、双 TypeScript、contracts/workflow、Next build、触及 Prettier、diff check、正式微信 CLI preview（996,237 bytes）和包体审计（源码 1,302,069 bytes，dev/fixture count=0）通过。修复只移除普通 `EMPTY` 全屏遮罩并允许 0 Marker 时显示地图操作按钮；搜索/筛选无结果提示、首次加载与错误恢复仍保留。自动门不替代修复版设备证据。

窗口结束必须记录：所有 shadow flags=false；8 个 caller allowlist 空；`global:ha-pause=true`、`global:read-stop=true`；candidate `PUBLIC=0` 且 hidden/tombstone evidence 保留；V1 13 collection/43 index/13 ACL/19 function/trigger/环境规则/Storage 对照 `V1_DIFF=0`。任一停机项失败立即记 TASK20 `BLOCKED`。

Git 起始状态：`feature/v2-board-map` 有大量既有未提交/未跟踪文件；本轮不 commit/push/PR/merge/tag。下一步仅重测 Device A P2A 修复版；通过后才继续其余 Phase。第二平台/低端机需另行补测，不能用本机代替。
