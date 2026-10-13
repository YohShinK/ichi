# TASK-V2-20｜最终 Device A 补测与接受缺口

## 最终结论（2026-09-30）

**TASK-V2-20 = TRUE_DEVICE_GATES_PASS_WITH_FOUNDER_ACCEPTED_GAPS / AWAITING_FOUNDER_FINAL_ACK**。

本轮按 Founder 最终命令完成可安全执行的 Device A 补测。没有把未测设备、身份、网络或真实实拍链路写为 PASS。TASK21 = READY / NOT_STARTED；TASK22 未开始。以下“执行过程”部分保留各阶段真实快照，其旧 pending／开关状态不代表当前结果。

| 必需项 | 最终结果与证据 |
| --- | --- |
| M1 hidden 消费 | PASS；7→0，epoch21→22；刷新有加载态，pan/zoom 后全部消失、不回来、原详情不能再开；真实微信 query 成功0项 |
| LOCATION_DENY_MANUAL_BROWSE | PASS；真实关闭权限仍可拖缩／刷新；定位给出手动浏览提示 |
| LOCATION_REENABLE | PASS；恢复真实权限后能回到当前位置；无重复授权／相机误提示 |
| F1 失败→重试 | DEVICE_SYNTHETIC_CONTRACT_PASS；现有独立diagnostic首次VERIFICATION_FAILED，端上显示建立失败，新upload=0；恢复条件重试后1条VERIFIED SHARE upload、1个STATE、1个ACTIVATE_EVENT、1个outbox；不等于三项照片实拍正式链 |
| F3 本人贡献删除 | PASS；Founder确认专用卡片消失、原卡保留；upload与STATE均DELETED、noResurrection=true，STATE eligible=false |
| F3 stale event/no-resurrection | PASS；删除后处理旧激活outbox(seq1)与删除outbox(seq2)，均APPLIED / NO_PUBLIC_SUPPORT；再重放seq1为duplicate=true；STATE保持DELETED且PUBLIC=0 |
| P2 详情轻量复核 | PASS；三次有loading、最终成功、无白屏；延迟问题仍OPEN / ACCEPTED_FOR_TASK21_OPTIMIZATION |
| V1_DIFF | V1_DIFF=0 / VERIFIED；最后完整重新read-back，非沿用preflight |
| PRIVATE_LEAKAGE / 未修复P0/P1 | 0 / 0 / 0；限已执行与审查范围，不扩写未测矩阵 |
| 安全停机 | PASS；8函数全部ENABLED=false、实际caller DIGESTS空、环境变量完整恢复；read-stop=true、epoch25、HA pause=true、PUBLIC=0 |

### 最终接受的证据缺口

| 项目 | 结论 |
| --- | --- |
| Device B／第二平台／低端机 | NOT_RUN / FOUNDER_ACCEPTED_EVIDENCE_GAP |
| 第二账号B本轮新隔离／跨账号落地 | NOT_RUN / FOUNDER_ACCEPTED_EVIDENCE_GAP；只引用TASK19历史A/B可信caller与拒绝证据 |
| 真实Slow Network J3 | NOT_RUN / FOUNDER_ACCEPTED_EVIDENCE_GAP |
| 500 Device numeric | NOT_RUN / FOUNDER_ACCEPTED_EVIDENCE_GAP；TASK18_SYNTHETIC_CAPACITY_PASS + DEVICE_A_NORMAL_PATH_PASS + 500_DEVICE_NUMERIC_NOT_RUN；没有恢复已删除压力UI／force-individual |
| F2 未同意→首次ACCEPT→历史SHARE重新投影 | FOUNDER_ACCEPTED_LIMITED_E2E_GAP；无现成未同意可信身份，A的不可逆consent不重置；分层引用TASK19首次真实ACCEPT、现有合同测试与TASK20未同意UI演示 |
| Multi-contributor delete on device | FOUNDER_ACCEPTED_LIMITED_E2E_GAP；本轮仅真机单贡献删除，已有多贡献者自动测试保留；未以本轮无公开投影的fixture声称last-marker retire真机通过 |
| 真实三项实拍失败及对应重传 | COVERED_BY_EXISTING_NEGATIVE_TESTS / NO_SAFE_DEVICE_INJECTION；现有diagnostic只覆盖synthetic提交核验，不新增正式故障注入或云架构 |

### 外部写入与停止后的数据

仅现有shadow资源：query/detail、submit/manage/resolve短时开关与A白名单；删除后projector仅短时按server capability处理**精确两个本轮outbox及一次duplicate重放**。源fixture b2r4临时revision930／FAILED→ACCEPTED、独立坐标与新观察版本，结束已逐字段还原，并以整个文档同形比较确认与原值相同。没有修改A consent或TASK19 b2r5原上传。

新记录由真实微信submit创建，STATE／association／BoardInstance／outbox由真实resolver创建，墓碑由真实微信delete创建；没有管理员伪造用户身份或手写伪造成功STATE。保留1条DELETED upload、1条DELETED STATE、ACTIVATE／DELETE审计及2条APPLIED outbox。处理旧事件未建立任何公开lead；停机时仅把本轮独立BoardInstance管理端标为RETIRED，不能将该动作冒充用户删除自动退役Marker的证据。7条UI测试行HIDDEN／HIDDEN，历史audit行保留；无V1 cleanup。全部8函数环境配置精确恢复到preflight，误加unused ALLOWLIST键已物理移除。

### 最终自动验证

15:15结束窗口后重跑：full Vitest 995 passed / 1 skipped（98文件通过／1跳过）；shadow targeted 26/26；ESLint、root/Web TypeScript、contracts/workflow、Next build、v3 artifact7项/static allowlist均PASS。正式微信CLI preview 999617 bytes，最终码preview-qr-final-formal-closeout-20260930.jpg；未包含diagnostic入口。包体sourceBytes=1307148、devOrFixtureCount=0。Touched Prettier／git diff --check／文档workflow收口检查均PASS。Web Playwright本轮无产品源改动未重跑；历史V1左滑flaky 25/26保留，不写全绿。

Git仍保留feature/v2-board-map的既有大量未提交／未跟踪工作；本轮只改文档／证据，无产品源码变更，无commit/push/PR/merge/tag或正式发布。二维码为验收preview，非上传审核／production publication。

### TASK21_PRE_PILOT_INPUTS

- OPPORTUNITY_EVALUATION_AND_FILTER_RESTORE_REQUIRED：接入真实评估与规则，恢复筛选、Marker状态及详情ICHI对话状态；目前Opportunity chip继续隐藏。
- MAP_STATE_UI_POLISH_REQUIRED：改善Empty／Search-no-result／Service-unavailable视觉，现有状态仍有基本说明与恢复路径。
- T20-P2-01 OPEN / ACCEPTED_FOR_TASK21_OPTIMIZATION：首次详情延迟保留，未升级P1。

本轮只登记输入，不实施TASK21。未写HUMAN_APPROVED／FROZEN；最终人工确认待Founder。

证据：final-v1-diff-and-stop-state-20260930.json、final-m1-query-evidence-20260930.json；独立完整V1报告见v2-e-task-20-final-v1-diff-verification.md。

## 执行过程（以下为历史阶段记录）

日期：2026-09-30（Asia/Shanghai）。当前状态：`IN_PROGRESS / FINAL_DEVICE_A_GAP_CLOSURE`。唯一活动工作集为 V2-E／TASK-V2-20；TASK21=`READY / NOT_STARTED`，实施未解锁；TASK22 未开始。

## Founder 本轮矩阵裁定

执行依据：`/Users/cunfu/Downloads/ICHI_TASK-V2-20_最终补测与收口总命令.md`，由 Founder 明确要求执行。它重新要求 P2B 真实定位关闭／恢复测试，覆盖 2026-09-29 的跳过决定；下方接受缺口只适用于本次 TASK20。

| 项目 | 本轮结论 |
| --- | --- |
| Device B／第二平台／低端 | NOT_RUN / FOUNDER_ACCEPTED_EVIDENCE_GAP |
| 第二账号 B 新隔离复测／跨账号落地 | NOT_RUN / FOUNDER_ACCEPTED_EVIDENCE_GAP；TASK19 历史可信 A/B 与拒绝证据仅作历史引用 |
| 真实 Slow Network J3 | NOT_RUN / FOUNDER_ACCEPTED_EVIDENCE_GAP |
| 500 Device numeric 无现成安全诊断路径 | NOT_RUN / FOUNDER_ACCEPTED_EVIDENCE_GAP；压力面板与 force-individual 已退役 |

这些均非 PASS，按本轮明确指令不再阻断 TASK20。M1 真机隐藏消费、拒绝定位／恢复定位、完整 V1_DIFF 与最终安全停机必须通过。P2 详情延迟只轻量复核，未升级 P1 时接受进入 TASK21 优化。

## Preflight

2026-09-30 只读回查：唯一环境 nosql backend、27 函数含 8 shadow；8 shadow Active／Available、0 trigger、flags=false／allowlist 空；read-stop=true、epoch=20、HA pause=true、PUBLIC=0。正式地图 service factory 在 develop／trial 走 CandidatePublicMapService，release／unknown fail closed。7 条原有 TASK20 UI 行均 SYNTHETIC_REHEARSAL／HIDDEN。V1 同形基线比对已得 `V1_DIFF=0 / VERIFIED`，独立报告见 `v2-e-task-20-final-v1-diff-verification.md`。

Device A 为 iPhone 16 Pro／iOS 26／已接受条例的账号 A；Founder 已确认本轮可操作且 A 登录。微信应用版本未提供；本轮微信客户端日志记录 SDK 3.17.3，仅按 SDK 版本记录，不当作微信应用版本。project.config 3.17.0 为构建配置。Preflight 时未开放窗口或新增资源。

## 必须补测

| 项目 | 当前结果 |
| --- | --- |
| M1 可见 → HIDDEN／epoch → 刷新／pan／zoom／详情不可再开 | USER_REPORTED_TRUE_DEVICE_PASS；7→0，epoch 21→22，无重新出现 |
| 定位关闭 → manual browse → 恢复定位 | USER_REPORTED_TRUE_DEVICE_PASS；无重复授权／相机误提示 |
| 详情冷首次 → 重复两次／loading／最终成功／无白屏 | USER_REPORTED_TRUE_DEVICE_PASS；三次成功、有 loading、无白屏，P2 留存 |

F1—F4 安全可执行性检查、自动门、外部写入、最终停机与 Founder 结果随执行追加。最终不得自行写 HUMAN_APPROVED／FROZEN。

## 2026-09-30 Device A M1 与详情轻量复核

Founder 确认账号 A 已登录、可操作。正式预览码为 `artifacts/task20/preview-qr-final-gap-20260930.jpg`，微信 CLI 编译 999,617 bytes。首进显示“地图服务暂时不可用”是本轮测试配置失误：误写未被代码使用的 caller ALLOWLIST 字段，并将 PUBLIC／VISIBLE 写到相反字段。已修正为实际 `ICHI_V2_SHADOW_TEST_CALLER_DIGESTS` 与 `lifecycleState=PUBLIC / visibility=VISIBLE`；没有修改客户端或函数代码。修正后 Founder 报告“恢复；三次均成功，有加载提示、无白屏”。T20-P2-01 保留 `OPEN / ACCEPTED_FOR_TASK21_OPTIMIZATION`。

随后精确隐藏原有 7 条 TASK20 synthetic UI 行，matched=modified=7，read epoch 21→22。公开可服务数量按服务器合同 **lifecycleState=PUBLIC AND visibility=VISIBLE** 查询为 0；另外 20 条历史 synthetic 行是 HIDDEN／VISIBLE，服务器合同拒绝它们，不属于可服务 PUBLIC；本轮未修改这些历史行。不得用单字段 visibility=PUBLIC 的查询代替此合同。

Founder 第一次感到刷新没有反应，随后拖动／缩放后标记全部消失、详情不可打开；再次单独点击刷新明确出现“正在载入地图信息”，Founder 确认是刷新状态。对应真实微信 query 在 14:35:12 和 14:38:37 成功返回 0 项，无 private fallback；后一次 request `aabc4bbc-5bd5-4925-8be1-7507674b92e6`。综合回报记 `DEVICE_M1_CONSUMPTION=PASS / NO_RESURRECTION=PASS`，限本次设备操作序列；未故意安排迟到响应竞态。定位关闭／恢复仍待真实操作，整任务尚未收口。

F1 安全注入检查：现有 candidate submit 在验证失败时不插入上传，没有正式的可控设备故障入口；不新增接口。现有失败、幂等、删除防复活与投影持久化定向 Vitest 4 文件／26 测试通过（14:40）。曾直接用 Node test 启动失败，因为源文件导入的 .js 由构建／Vitest 转换；按项目 Vitest 路径复跑通过，非产品测试失败。F1 拟按命令记录 `COVERED_BY_EXISTING_NEGATIVE_TESTS / NO_SAFE_DEVICE_INJECTION`。

## F1—F4 的证据边界

| 项目 | 结论／依据 |
| --- | --- |
| F1 真实失败核验／重试 | COVERED_BY_EXISTING_NEGATIVE_TESTS / NO_SAFE_DEVICE_INJECTION；不把 synthetic verified fixture 当三项实拍验收 |
| F2 未同意／首次同意／历史 SHARE 再投影 | FOUNDER_ACCEPTED_LIMITED_E2E_GAP；本轮只有已永久同意的 A，无可复用未同意可信微信身份。TASK19 真实首次 ACCEPT、当前合同／投影测试和 TASK20 未同意界面演示作为分层证据；不重置 A、不重建 enrollment、不把本地演示视作持久化链路 |
| F3 单贡献删除／防复活 | PENDING；既有上传删除 UI 证据未包含 STATE contribution，不能直接补写 PASS。准备复用已有独立诊断副本与 synthetic fixture，明确可删除卡片，再测已关联 STATE 的真实微信删除 |
| F3 多贡献者设备删除 | FOUNDER_ACCEPTED_LIMITED_E2E_GAP；本轮不新建复杂双账号数据／设备流程；自动多贡献者测试单独记录 |
| F4 500 Device numeric | TASK18_SYNTHETIC_CAPACITY_PASS + DEVICE_A_NORMAL_PATH_PASS + 500_DEVICE_NUMERIC_NOT_RUN / FOUNDER_ACCEPTED_EVIDENCE_GAP；现有源仅保留离线测试 fixture，正式压力 UI 已移除，无现成设备诊断副本；不恢复 force-individual |

14:43 最终回归首组：full Vitest 98 文件通过／1 跳过，995 测试通过／1 跳过；ESLint 与 Next build 通过。其他自动门及窗口最终回读继续追加，不能将此时测试成功当作 TASK20 收口。

## 本窗口外部写入与最终安全停机

仅 query/detail 两个既有 shadow 函数临时 READ_ENABLED=true，实际 caller DIGESTS 限 A；其余六个关闭，HA 始终暂停。先前误加的 unused ALLOWLIST 键已用完整环境配置更新物理移除。7 条原有 UI synthetic 行短时 PUBLIC／VISIBLE 后精确 HIDDEN／HIDDEN；read epoch 20→21（开放）→22（隐藏）→23（停机），read-stop 最后 true。没有新增 collection/index/function/secret/Storage/trigger，没有部署函数代码、读写 V1 private record 或修改 A 的 consent。

最后逐项回读 8 函数：Active／Available、0 trigger、全部 ENABLED=false、实际 caller DIGESTS 空；read-stop=true、HA pause=true、epoch=23、可服务 PUBLIC=0。20 条历史 HIDDEN／VISIBLE 证据行也不满足服务器公开合同；无批量 cleanup。完整 V1 新回读再次 `V1_DIFF=0 / VERIFIED`，见独立 V1 报告与 `artifacts/task20/final-v1-diff-after-m1-20260930.json`。M1 精简查询证据为 `artifacts/task20/final-m1-query-evidence-20260930.json`，没有身份或密钥值。

定位权限已交 Founder 操作，截至本次停机未收到结果；关闭和恢复都维持 PENDING_TRUE_DEVICE。F3 复用已有独立诊断副本重新生成二维码 `artifacts/task20/preview-qr-final-contribution-delete-20260930.jpg`，1000414 bytes；未发送操作步骤、未建立新贡献、未改旧 fixture、未删除任何记录。该副本不进入正式源码。下一窗口需先完成定位，再准备可明确识别的本轮 STATE contribution 并验证真实删除／防复活。不能因为已有上传卡片删除证据将 F3 记 PASS。

## 自动门、缺陷与 Git

| 门禁 | 本次结果 |
| --- | --- |
| Full Vitest | 995 passed / 1 skipped；98 文件通过 / 1 跳过 |
| Shadow/candidate targeted | 4 文件 / 26 项 PASS |
| ESLint、root/Web TypeScript | PASS |
| contracts/workflow | PASS |
| Next build | PASS |
| 微信 CLI preview | 正式 999617 bytes；独立既有删除诊断 1000414 bytes；均成功 |
| v3 artifact/static allowlist | 7 artifacts PASS |
| Package audit | sourceBytes=1307148；devOrFixtureCount=0 |
| CloudBase read-back | SAFE_STOP_VERIFIED；V1_DIFF=0 / VERIFIED |
| Touched Prettier / diff check | 待文档更新后执行 |
| Web Playwright | 本次无产品代码变更未重跑；历史 V1 左滑 timing-sensitive flaky 25/26 原样保留，不写全绿 |

本次已执行路径未见新 P0/P1，既有三项 P1 受影响真机修复结果保留；P2 详情延迟 OPEN / ACCEPTED_FOR_TASK21_OPTIMIZATION，原上传呈现 P2 已获界面复测。刷新初次“无反应”经再次单独点击和成功空 query 澄清为刷新加载态，不新增已确认 P1；具体端上时长未测。无新 P3。PRIVATE_LEAKAGE=0 限本次已检查 synthetic 公开响应／路径，未把未测第二身份扩写为本轮覆盖。

Git 保留 feature/v2-board-map 上既有大量未提交／未跟踪工作；本轮仅增加／更新 TASK20 文档、报告及本地验证证据，无产品源代码修改，无 commit/push/PR/merge/tag。正式 preview 是验收构建，不是正式版本发布；未执行 production migration、上传审核或 publication。

当前结论仍是 `IN_PROGRESS / FINAL_DEVICE_A_GAP_CLOSURE`，而非最终 gates pass：定位两项与 F3 单贡献删除仍待真实设备证据。TASK21=`READY / NOT_STARTED`，TASK22 未开始。

## 定位窗口重新开放（覆盖前述停机快照）

Founder 在定位测试中看到服务暂不可用并要求重新开放；该提示对应 Agent 先前主动关闭测试窗口，不是定位拒绝引发的产品错误。已重新只对 A 开放 query/detail 两函数 READ_ENABLED=true，实际 DIGESTS限A，read-stop=false，epoch23→24；其余六函数仍关闭，HA暂停、可服务PUBLIC=0。7条已隐藏marker保持隐藏。Founder点重试恢复后继续真实定位关闭／手动浏览；此窗口还未结束，前述epoch23停机快照不是当前状态。结束仍必须finally停机并完整回读。

定位关闭后 Founder 报告仍可拖动／缩放；定位显示“定位不可用，仅可手动浏览地图”；刷新触发且保持空地图。空地图来自已隐藏的7条UI行，不把它误判为拒绝定位导致公开marker消失。恢复权限与无重复授权／相机误提示的确认待下一条回报。

随后Founder恢复真实位置信息权限，重新进入地图点击定位，确认“可以回到当前定位，没有反复弹授权以及相机权限”。记 LOCATION_DENY_MANUAL_BROWSE=PASS / LOCATION_REENABLE=PASS；源码当前使用wx.getLocation(type=gcj02)，设备位置只改变浏览camera，不进入cluster/search/opportunity authority。这里的协议接线是源码／合同证据，未把设备地理坐标导出作遥测。

F3 已开始安全数据准备：复用旧独立删除 diagnostic，不改其源代码；旧 b2r4 synthetic fixture 临时切到新的 correctionVersion=930／新 observationVersionId，并把 synthetic坐标移到独立测试区域。旧 fixture 原始字段保存在本次执行内存，窗口结束必须恢复；旧候选删除墓碑保持 DELETED，TASK19 b2r5原上传不动。尚未建立新的上传或贡献。仅 submit/manage/resolve 三既有函数加上A限定的临时开关，projector仍关闭、HA仍暂停。发现该现有diagnostic按钮可安全呈现验证失败：先令本轮 synthetic recognition.status=FAILED，首次提交应VERIFICATION_FAILED且不插入upload，然后恢复ACCEPTED重试。故F1原“无安全注入”暂定结论撤回，转PENDING_DEVICE_SYNTHETIC_FAILURE_RETRY；此仍不代表真实三项照片核验验收。此时不能用旧停机快照作为当前安全状态。

15:02首次实际微信提交返回VERIFICATION_FAILED（request c0a4f260-3de3-4352-ad2d-ff79bbd239fb）；新observation的upload数量0，A名下唯一ACTIVE行仍为9月28日TASK19 b2r5原行。Founder所见“合成版面上传”是旧行因manage重新开放而重新呈现，不是失败提交插入新行。已恢复本轮recognition为ACCEPTED，等待重复按钮重试与端上失败提示回忆；不能仅凭后台失败将端上状态理解判PASS。

Founder随后明确确认端上“显示测试记录建立失败”；F1首次失败界面／不伪成功已获真实操作与云端0新增交叉证据。恢复条件后的重试结果仍待回报。

恢复ACCEPTED后Founder再次点击，确认出现“本轮可删除测试记录”。新观察版本仅有1条ACTIVE／VERIFIED／SHARE upload；用既有server rehearsal capability调用resolver，返回NO_MATCH并建立独立BoardInstance（prepared坐标250m内原有23个ACTIVE synthetic instance均不相邻）。真实runtime写入1个ACTIVE eligible STATE contribution、1个ACTIVATE_EVENT、1个sequence=1 PENDING outbox；未手写伪造STATE，没有duplicate贡献／outbox，没有投影到地图（projector关闭）。已关闭submit，随后仅让Founder删除该明确标记卡片。F1=DEVICE_SYNTHETIC_CONTRACT_PASS，范围是既有diagnostic提交失败／重试，不替代正式照片三项核验；F3本人删除仍待回报和云端墓碑／stale重放核对。

## TASK21_PRE_PILOT_INPUTS

- MAP_STATE_UI_POLISH_REQUIRED：Empty／Search-no-result／Service-unavailable 视觉质量待改善，当前仍需解释状态并提供基本恢复路径。
- OPPORTUNITY_EVALUATION_AND_FILTER_RESTORE_REQUIRED：OpportunityEvaluation 接入、规则核对、筛选／Marker 状态及详情 ICHI 对话状态恢复；本轮 chip 继续隐藏，不造 synthetic 或 leadId 假状态。
- T20-P2-01：OPEN / ACCEPTED_FOR_TASK21_OPTIMIZATION；本轮轻量复核后补结果。

以上只记录为 TASK21 开始前的输入，本轮不实施。
