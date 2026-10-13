# TASK-V2-20｜Device A 真机 Session

## 2026-09-30 最终补测结果（覆盖下方历史状态）

TASK20=`TRUE_DEVICE_GATES_PASS_WITH_FOUNDER_ACCEPTED_GAPS / AWAITING_FOUNDER_FINAL_ACK`。M1隐藏消费、关闭定位手动浏览及恢复定位均真机PASS；synthetic核验失败重试、真实单贡献删除与后台旧事件防复活已完成。原合成上传保留。完整V1_DIFF=0 / VERIFIED，安全停机epoch25。Device B、第二账号B新隔离、真实慢网和无安全路径的500数值记NOT_RUN / FOUNDER_ACCEPTED_EVIDENCE_GAP；F2及多人删除仍为accepted limited gaps。详情首次慢保持P2，交TASK21优化。TASK21 READY / NOT_STARTED。

完整最新矩阵及证据范围见 [最终Device A报告](v2-e-task-20-final-device-a-gap-closure.md)、[完整V1核验](v2-e-task-20-final-v1-diff-verification.md)与[最终验收](v2-e-task-20-final-acceptance.md)。下方均保留为历史，不以旧pending或epoch代替最终结论。

## 2026-09-29 Device A 补测与 Device B 执行范围（最新）

Founder 本轮明确“第二台设备测试不做”；当前只有 iPhone 16 Pro / iOS 26 / 账号 A，Device B、Android／低端表现、跨账号私有隔离与跨账号分享落地记 `NOT_RUN / FOUNDER_SKIPPED / EVIDENCE_GAP`，不以模拟器、同机或本地回归冒充。此前 P2B 拒绝定位已由 Founder 明确跳过；当前没有稳定可复现弱网，J3 真实慢网记 `NOT_RUN / NO_REPRODUCIBLE_NETWORK`。这两项不写 PASS。

正式工程新预览码 `artifacts/task20/preview-qr-m1-20260929.jpg`，微信 CLI 编译成功，999,617 bytes。仅账号 A 打开 query/detail 两个 read 函数，7 条原有 TASK20 合成 UI 线索短时切为 `PUBLIC / VISIBLE`，read-stop=false、epoch 17→18，HA pause=true，其他 6 函数仍关闭。Founder 扫码在上海报告 7 个标记出现、无匹配关键词提示、清空后标记恢复，“三步都正常”；此前待补的搜索清空恢复记 `USER_REPORTED_TRUE_DEVICE_PASS`。Founder 再测详情，回报“仍是首次慢、重复快，无白屏”；CLS 对应首个 detail 函数 Report Duration 2,972ms、access `timeCost=3,161ms`，随后三次函数 289/346/361ms，支持 T20-P2-01 的服务端冷热耗时差异，但不等于端上完整卡片耗时。

为补候选隐藏后的客户端消费，将精确 7 条 UI 线索改回 `HIDDEN / HIDDEN`，read epoch 18→19，保留 query/detail 短时开放，请 Founder 在上海刷新并拖缩，确认旧标记不复活。云端回读 7/7 均 HIDDEN；窗口内尚未取得这一步的设备结果，于是先安全停机：read-stop=true、epoch 19→20、query/detail flags=false/allowlist 空，最终 8 函数 flags=false/allowlist 空、HA pause=true、`PUBLIC=0`。因此隐藏／迟到响应的真机消费仍 `PENDING_FOUNDER_RESULT`，不能把服务端隐藏读回写作设备通过；收到结果后再补记。本轮未执行真实 V1 private backfill、正式迁移或新资源部署。

安全停机后的 V1 核对：13 collection/43 index/13 ACL 与 TASK19 基线逐项一致；19 个 V1 函数 ModTime、CodeSize、runtime、4 个 trigger 一致，18 个 environment 原始 hash 一致；`release-recognition` 的环境变量从基线 `Variables:null` 被 API 回读为 `Variables:[]`，两者均为空，属于序列化差异。存储根目录仍 2 项，与 2026-09-25 同一 CloudBase 只读快照的 Key/LastModified/ETag/Size/StorageClass 逐项哈希一致；函数调用规则内容一致。已通过 MCP 读到当前存储桶 `CUSTOM` 权限表达式，但基线仅保留 CLI 原返回 hash，不能做同形全文比对；CLI 凭据当前不可用，环境 QPS/套餐细项也未重取，故不声称完整 `V1_DIFF=0`。本轮没有触及 V1 资源或业务记录。

本轮最终自动门：Vitest 995 passed/1 skipped、ESLint、根与 Web TypeScript、contracts/workflow、Next build、7 个 v3 candidate artifact 的 hash/allowlist/fail-closed 校验、包体审计 sourceBytes 1,307,148/devOrFixtureCount 0、触及文档 Prettier、`validate-workflow` 与 `git diff --check` 均通过。现有测试二维码不等于正式发布，未 commit/push/publish。

## 2026-09-29 P3 分享语义修正及正式版复测（最新）

Founder 根据收手时的分享弹窗截图 `/Users/cunfu/Downloads/IMG_2933.PNG` 明确：暂不分享只留本机草稿；主动分享并提交核验后进入“我上传的版面”；核验通过显示“已上传”，失败留在列表提示失败项并允许重新提交；已上传记录在当前地图条例同意、既有公开安全资格均满足后自动进入地图，未同意时继续留在本人上传列表等待。此前专用诊断副本建立了一条 A 所属 `DO_NOT_SHARE / SYNTHETIC_REHEARSAL` 测试上传，暴露 candidate 列表错误呈现“暂不分享”行；该行已按精确归属和 ACTIVE 条件软退役，置 `noResurrection=true`，无 contribution/projection，TASK19 既有 `SHARE` 行保持 ACTIVE。诊断副本不是正式发布版本，其建立成功不计正式上传流程验收。

设计文档先更新，再修正式 candidate 列表投影为仅显示 `ACTIVE + SHARE`，删除卡片上的逐记录分享意图字样，徽标由核验状态决定。V1 的“暂不分享并退出”源码仅本机保存，真实上传列表保留核验失败的相应重试入口；本轮未以真实失败记录做端到端复测。自动门：Vitest 995 passed/1 skipped、ESLint、根/Web TypeScript、contracts/workflow、Next build、v3 artifact 校验、包体审计 sourceBytes 1,307,148/devOrFixtureCount 0、Prettier/diff check 均通过。新版正式微信 preview 编译成功，包体 999,617 bytes，二维码 `artifacts/task20/preview-qr-p3-share-semantics-20260929.jpg`。仅对账号 A 短时打开 candidate manage/consent 读写门供页面复测，submit 函数始终关闭；Founder 扫码后报告合成测试记录位于云端列表、显示“已上传”、不再显示“已分享至地图／暂不分享”，答复“全部正常”。候选 manage/consent 随即关闭。

关闭后只读回查：8 个 shadow 函数的所有 `*_ENABLED=false` 且 caller allowlist 为空，`global:read-stop=true`、epoch=17、`global:ha-pause=true`、`PUBLIC=0`；本轮 `DO_NOT_SHARE` 行为 `DELETED / noResurrection=true` 且归属 A，TASK19 `SHARE` 行仍为 ACTIVE 且归属 A。此轮没有执行真实失败核验重试、当前条例从未同意到同意后的自动投影、真机删除或 M1 消费；这些保持证据缺口。未 commit/push/publish。

随后按 P3 删除子项另建独立 `DIAGNOSTIC_ONLY` 预览副本，沿用正式版 candidate 列表与删除逻辑，只增加“仅测试：建立本轮可删除分享记录”按钮及本轮记录的标题标识；未把按钮放入正式源码。预览码 `artifacts/task20/preview-qr-p3-share-delete-diagnostic-20260929.jpg`，微信 CLI 编译成功，1,000,414 bytes。仅账号 A 的 submit/manage 短时开放。Founder 点一次后报告“已建立并出现”；云端只读核对新行属于 A、`SHARE / ACTIVE / VERIFIED / SYNTHETIC_REHEARSAL`，TASK19 `b2r5-a-map` 原行仍为 `SHARE / ACTIVE`。随即关闭 submit，Founder 仅左滑删除标题为“本轮可删除测试记录”的卡片并确认，报告“测试卡片消失，另一张仍在”。然后关闭 manage；云端回读新行 `DELETED / noResurrection=true`、删除命令留痕，TASK19 原行仍 ACTIVE，公开 `PUBLIC=0`。该新行没有产生 `STATE` contribution，只有 `DELETE_EVENT` 审计行，因此本次证明本人 candidate 上传删除与列表更新，不证明多贡献者保留／最后贡献者退役的地图投影；后者仍是 P3 证据缺口。最终再读 8 函数全部 flags=false/allowlist 空、read-stop=true、epoch=17、HA pause=true、PUBLIC=0；V1 只读对照 13 collection、43 index、13 ACL、19 function 的 ModTime/CodeSize/runtime/trigger 结构子集为 0 diff。完整环境变量值与 Storage 内容 hash 未重算，不能声称完整 `V1_DIFF=0`。诊断副本不是正式产品路径，也不证明三项实拍核验。

## 2026-09-29 P4 分享通过、P5 断网复测窗口开启（最新）

17:25 CST 重新用正式工程生成微信预览码 `artifacts/task20/preview-qr-p4-20260929-172505.jpg`，CLI 编译成功，包体 999,576 bytes；它不含此前的未同意条例诊断覆盖。源码分享参数仅允许 `tab=recognize|map|my`，好友分享路径为 `/pages/home/index?tab=<tab>`，Timeline query 也仅含 `tab`；这些属于源码核对，不能替代真机落地。Founder 报告好友分享卡片回到“我的”页，朋友圈选项可见且实际分享并点开后也正常回到“我的”；随后彻底关闭并重开微信，再点文件传输助手中的分享卡片，第一屏仍是“我的”，之后由 Founder 主动点入“我上传的版面”。同账号热态和冷启动 landing 均记 `USER_REPORTED_TRUE_DEVICE_PASS`；跨账号接收无证据。上传页仍看到“条例状态暂不可用”；只读核对候选 manage 函数 `ICHI_V2_SHADOW_CONSENT_ENABLED=false`、caller allowlist 为空，符合本阶段安全停机态，不将其误判为账号 A 未同意。第二设备/账号不可用，跨账号落地保持 `EVIDENCE_GAP`。

P5 断网/恢复复测短时窗口：只将 7 条 `SYNTHETIC_REHEARSAL` UI fixture 设为 `PUBLIC/VISIBLE`；仅 query/detail 两个只读函数 `READ_ENABLED=true` 且 caller allowlist 为 A；`global:read-epoch` 13→14、`global:read-stop.stopped=false`，`global:ha-pause.paused=true`，其他 6 函数维持 flags=false/allowlist 空。云端候选 consent/upload/manage 入口仍关闭。Founder 在真实设备飞行模式下刷新、拖动后报告“标记保留，提示清楚，恢复后正常”，记 `P5/J1 USER_REPORTED_TRUE_DEVICE_PASS`；Wi‑Fi/蜂窝切换后拖动、刷新、打开详情也报告“都正常，无明显异常”，记 `P5/J2 USER_REPORTED_TRUE_DEVICE_PASS`。未采集设备网络日志或迟到响应先后顺序，不宣称 late-response 已实测；真实慢网尚未复现。该窗口已停机并回读 `read-stop=true`、epoch=15、8 函数 flags=false/allowlist 空、HA pause=true、PUBLIC=0。

P6 前后台测试使用另一个短时窗口：仍只对 A 开放 query/detail 与 7 条合成公开标记，read epoch 15→16、read-stop=false，其他候选写入入口关闭。Founder 做后台 10–30 秒、底部 Tab 往返、锁屏解锁后报告“都正常，无重复提示”，记 `P6 USER_REPORTED_TRUE_DEVICE_PASS`；未取得设备 listener 计数，不能从视觉结果量化重复订阅。窗口已停机并回读 `read-stop=true`、epoch=17、8 函数 flags=false/allowlist 空、HA pause=true、PUBLIC=0。

收尾只读 V1 结构对照 `/tmp/ichi-task19-v1-readonly-baseline.json`：13 个集合仍在、13 集合的 43 个索引与 13 条 ACL 相同、19 个函数的 ModTime/CodeSize/runtime/trigger 相同；Storage 根项数仍为 2、函数调用规则相同。环境变量值 hash、Storage 内容 hash 未重算，不把子集检查称为完整 `V1_DIFF=0`。自动门：Vitest 994 passed/1 skipped、ESLint、根/Web TypeScript、contracts/workflow、Next build、v3 artifact 校验、触及文档 Prettier、diff check、包体审计 sourceBytes 1,307,066/devOrFixtureCount 0，均通过。没有 commit/push/publish；P3 本轮专用候选上传删除、M1、Device B、冷启动/跨账号分享、真实慢网/late-response 仍是证据缺口。

## 2026-09-29 未同意条例界面演示（诊断副本，待结果）

账号 A 的同意记录不可回退，且尚未确认可用的未同意账号 B。为检查 Founder 提出的卡片和点击效果，另建 `/tmp/ichi-task20-consent-demo-pKdiJc` 的 `DIAGNOSTIC_ONLY` 小程序副本：当前条例状态在副本内模拟为未同意，“暂不同意”关闭弹窗，“同意并开启”仅改变副本内存状态。候选 consent/list/submit/delete 云端操作在副本中被拦截，正式源码无诊断开关。微信 CLI 预览包 1,000,115 bytes，二维码 `artifacts/task20/preview-qr-consent-diagnostic-20260929-165622.jpg`；Founder 真机回报卡片、弹窗、按钮位置及点击后的变化“全部正常”，记 `UI_ONLY_USER_REPORTED_PASS`。该结果只证明界面呈现/本地点击，不证明真实持久同意。云端候选入口保持关闭。

## 2026-09-29 P3 复测与列表修正（最新）

Founder 用 16:37 新预览码在 iPhone 16 Pro / iOS 26 复测账号 A：条例状态约 1–2 秒后读出已同意，同意卡片随即消失，T20-P1-03 的已同意路径记 `USER_REPORTED_TRUE_DEVICE_PASS`；没有未同意账号 B 可验证弹窗真实布局。Founder 同时确认候选测试上传位于滚动列表上方独立区块，要求其与云端上传同属一个列表、同卡片样式、左滑垃圾桶删除，记 `T20-P2-02`。修正后 16:47 微信预览包 999,576 bytes，二维码 `artifacts/task20/preview-qr-p3-unified-20260929-164733.jpg`；Founder 真机确认位置、样式、左滑垃圾桶及删除确认弹窗全部正常，并点“取消”。本轮未删除；TASK19 既有 synthetic upload 保留。已关闭仅对 A 开放的 manage/consent 测试入口并回读 8 函数 flags=false/allowlist 空、`read-stop=true`、epoch=13、`ha-pause=true`、`PUBLIC=0`；V1 19 函数、13 集合的 43 index 和 13 ACL 与 TASK19 基线相同，完整配置/Storage hash 未重做。下方早期快照不代表最新状态。

## 2026-09-29 P3 截图、修复与复测状态（最新）

Founder 截图 `/Users/cunfu/Downloads/IMG_2930.PNG`：A 已在 TASK19 同意条例，但卡片误显“未同意”；同意弹窗主按钮被挪到顶部且不可用，记 `T20-P1-03 / P1`。现场候选 manage/consent 函数处于安全关闭态，旧客户端将未知状态当成未同意；全局按钮绝对定位与弹窗固定高度叠加造成错位。已修客户端状态与弹窗布局，自动门通过，预览二维码为 `artifacts/task20/preview-qr-p3-fix-20260929.png`。随后仅对 A 短时开放 manage/consent 函数，未收到受影响真机结果，已重新关闭；回读 8 函数 flags=false/allowlist 空、`read-stop=true`、epoch=13、`ha-pause=true`、7 条 UI fixture HIDDEN、`PUBLIC=0`。V1 结构回读：13 collection 存在、13 collection 共 43 index、13 ACL、19 函数 ModTime/CodeSize/runtime/trigger 与 TASK19 基线一致；完整 Storage/环境配置 hash 未重做，不宣称完整 `V1_DIFF=0`。受影响真机复测仍待进行。A 所属 1 条 TASK19 synthetic upload 保留，不删除。下方旧时间点记录为阶段历史，不代表当前云端状态。

日期：2026-09-29。状态：`PHASE_2A_P1_FOUND / FIX_READY_FOR_TRUE_DEVICE_RETEST`。前置状态见 `v2-e-task-20-true-device-preflight-and-matrix.md`。

Founder 已用首次修复版完成 P2A 复测：无标记区域地图、定位/刷新按钮可见，拖动与缩放都生效；手势后却短暂出现“地图状态需要恢复”全屏提示，记 T20-P1-02。窗口立即停机，read epoch 10→11、`read-stop=true`、8 函数 flags=false/allowlist 空、7 条测试行 HIDDEN、`PUBLIC=0`、HA pause=true。第二次源码修复与自动门通过，新的微信预览码在 `artifacts/task20/preview-qr-p1-retest-v2-20260929.png`（996,167 bytes）。修复版窗口以 epoch=12 重开后，Founder 确认连续拖动、缩放空地图时不再出现全屏恢复提示，地图正常；P2A 受影响路径已真机通过。当前进入 P2B 拒绝定位/手动浏览/恢复测试，窗口仍仅对 A 开放。

| 设备 | 系统 | 微信 / 基础库 | 账号角色 | 初始权限 | 初始网络 |
| --- | --- | --- | --- | --- | --- |
| iPhone 16 Pro | iOS 26（Founder 提供） | 待现场确认 | 曾在 TASK19 接受条例的 A；Founder 确认当前已登录 | 待现场确认 | 待现场确认 |

| Phase | 开始/结束时间 | 操作与实际结果 | 截图/视频/日志证据 | Defect/Severity | 状态 |
| --- | --- | --- | --- | --- | --- |
| P1A 地图打开、pan、zoom | 2026-09-29，约 01:05—01:07 CST | Founder 报告“没有问题”，上海区域读取到 7 个 marker；所选线索的加载提示感觉偏慢。尚无 FPS/帧间隔或完整首次交互计时。 | Founder 本会话文字；CLS 中 `v2-shadow-query-public-map-leads` 有真实 `wx_client` 请求，返回 `ok=true`；QR 只是入口 | T20-P2-01（暂定） | MAP/PAN/ZOOM USER_REPORTED_PASS；性能待复核 |
| P1B cluster、Picker、detail、Tab | 2026-09-29，约 01:07—01:15 CST | Founder 确认成员随放大自然分开、滚动 Picker 与底部 Tab 正常。首次/约两分钟未点详情等 4–5 秒；刚点过约 1 秒。Picker 两条详情切换尚待 1C 明确复核。 | Founder 本会话文字；CLS detail 函数 wx_client 正向日志 | T20-P2-01 | CLUSTER/PICKER_SCROLL/TAB USER_REPORTED_PASS；DETAIL_LATENCY_DEFECT |
| P1C 选择切换、搜索/筛选、拖缩闪烁 | 2026-09-29，约 01:15—01:20 CST | Founder 确认 Picker 连选两条详情正常、再次拖缩无问题；搜 `TASK20` 后现有版面仍在（全部测试版面均带该词），不能据此判搜索失效。筛选条和选项不可见。源码 `mapDiscoveryChipsEnabled` 门控与已批准“Opportunity chips 隐藏直到规则另行冻结”一致，筛选记当前 `NOT_APPLICABLE`，不临时造功能。 | Founder 本会话文字；小程序 WXML/状态门控只读核对 | — | PICKER_SELECTION/PAN_ZOOM USER_REPORTED_PASS；SEARCH 待无匹配词补测；FILTER N/A |
| P1D 无匹配搜索与清空 | 2026-09-29，约 01:22 CST | Founder 确认无匹配词出现“没有匹配此 IP 关键词的公开线索”；清空后恢复待 P2A 第一步确认。 | Founder 本会话文字 | — | SEARCH_NEGATIVE_RESULT USER_REPORTED_PASS；CLEAR_PENDING |
| P2A 定位允许 | 2026-09-29（具体时刻待补） | 初次定位到实际所在的无线索区域时，EMPTY 全屏遮罩阻断浏览；首次修复后地图/按钮可见且拖动、缩放生效，但每次手势后短暂出现恢复提示。第二次修复版连续拖动、缩放时 Founder 确认“没有，地图正常”；定位成功到真实所在区域。系统授权提示是否出现、清空搜索后的 Marker 恢复未获明确结果。 | Founder 本会话文字；WXML 两轮修正与微信 preview | T20-P1-01 / T20-P1-02 | AFFECTED_PATH_USER_REPORTED_PASS；权限细节仍待 P2B |
| P2B 拒绝定位/manual browse/恢复 | 2026-09-29（具体时刻待补） | Founder 表示一次授权后不希望再弹拒绝定位选项，并明确要求这段不用测试；未在系统/微信权限设置中执行拒绝与恢复。P2A 的手动浏览通过不能替代拒绝权限测试。 | Founder 本会话文字 | — | NOT_RUN / FOUNDER_SKIPPED |
| P3 Consent/My Upload/删除 | 2026-09-29（具体时刻待补） | 已请 Founder 打开“我的 → 我上传的版面”核对条例卡片、开关和候选列表；删除操作暂缓。只读 cloud 查询现有 1 条 A 归属的 `SYNTHETIC_REHEARSAL` candidate upload，是 TASK19 既有证据，不当作本轮专用可删除记录。 | Founder 待回报；shadow collection 只读元数据 | — | READ_ONLY_PHASE_IN_PROGRESS |
| P4 分享/landing | 2026-09-29，17:25 后 CST | 正式版好友卡片、朋友圈卡片打开均落到“我的”；彻底关闭并重开微信后再次打开文件传输助手卡片，第一屏仍到“我的”，再由 Founder 主动进入上传页。同机不能替代另账号接收。My Upload 的“条例状态暂不可用”与 consent flag=false/allowlist 空一致。 | Founder 本会话文字；正式预览码；分享源码 allowlist；候选函数配置只读回读 | — | FRIEND/TIMELINE HOT + FRIEND COLD SAME-ACCOUNT LANDING USER_REPORTED_PASS；CROSS-ACCOUNT_GAP |
| P5 Offline/网络切换/Slow/Late | 2026-09-29，约 17:34 CST 起 | Founder 飞行模式下刷新、拖动：原有标记保留，提示清楚；恢复网络再刷新正常。Wi‑Fi/蜂窝切换后拖动、刷新和详情均正常，无明显闪动/消失/错位。真实弱网与 late response 仍无单独设备证据。 | Founder 本会话文字；epoch=14 受控窗口 | — | J1/J2 USER_REPORTED_TRUE_DEVICE_PASS；J3/LATE EVIDENCE_GAP |
| P6 前后台/Tab/锁屏 | 2026-09-29，约 17:39 CST 起 | Founder 报告后台返回、底部 Tab 往返及锁屏解锁后地图位置、标记和已选详情正常，没有重复条例或全屏提示；未直接量化 listener 个数。 | Founder 本会话文字；epoch=16 窗口及 epoch=17 停机回读 | — | USER_REPORTED_TRUE_DEVICE_PASS；账号 B 隔离 EVIDENCE_GAP |
| M1 candidate migration/rollback 消费 | 2026-09-29 收尾 | 全量 Vitest 已重跑：dry-run migration 的授权/位置/隐藏门、hidden 后详情与刷新不可见、global read-stop 无 private fallback、`null → 0` 与 deleted stale version no-resurrection 均有本地测试覆盖；本轮只读窗口最终 read-stop/epoch/fixture 隐藏后完成云端停机。未在真机执行新的 migration/rollback 数据变更或验证客户端消费迟到旧响应，不能将本地覆盖写成真机 M1 PASS。 | `task-v2-19-layered.integration.test.ts`、`task-v2-10.test.ts`、`contribution-projection.test.ts`；CloudBase stop-state 回读 | — | LOCAL_REGRESSION_PASS / DEVICE_CONSUMPTION_EVIDENCE_GAP |

性能记录：Founder 报告地图呈现 7 个 marker，不等于原生 binding 峰值。CLS 有本窗口 query/detail `wx_client` 正向请求；detail access 两次约 6,584/8,294ms，后续一次约 626ms（CloudBase access `timeCost`，不是页面从点击到卡片可用的完整耗时）。Founder 重复观察页面首次/闲置约两分钟后 4–5 秒、刚点过约 1 秒；这支持冷热差异存在，但冷启动只是待验证假设。首次可交互、regionchange、visible native binding 数、PNG 生成/缓存/磁盘、setData 回调、帧间隔、Native/GPU/JS 内存与闪动/白屏/崩溃的设备数值仍待现场采集；无法采集者填写 `NOT_MEASURABLE` 与方法。

发现 P1 后已立即关闭首次 candidate read window：`read-stop=true`、epoch=7、全部 8 个 shadow 函数 flag=false/allowlist 空、7 条 UI fixture 隐藏、`PUBLIC=0`、`ha-pause=true`。源码移除普通无线索区域的全屏遮罩，定位/刷新按钮在 0 Marker 时保留；自动回归与微信 CLI preview 已通过。随后为修复版 P2A 复测短时重开：仅 A 的 query/detail read flag=true，7 条 synthetic UI fixture PUBLIC，`read-stop=false`、epoch=8、HA 仍暂停；修复版预览码在 `artifacts/task20/preview-qr-p1-fix.png`。窗口内未收到 Founder 真机结果，现已再次安全停机：`read-stop=true`、epoch=9、8 函数全部 flags=false/allowlist 空、7 条行 HIDDEN、`PUBLIC=0`、`ha-pause=true`。P2A 修复版真机复测仍待执行。Git 工作树已有未提交变更；本轮不 commit/push/PR/merge/tag/upload/review/publish。
