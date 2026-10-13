# TASK-V2-20｜最终验收记录

## Founder final acknowledgement｜2026-09-30（最新有效状态）

**TASK-V2-20 = COMPLETE / HUMAN_APPROVED / FROZEN**。Founder本次要求执行总命令，第0节明确已阅读本报告并确认可以彻底完结；独立批准／关闭记录见 `v2-e-task-20-founder-final-closeout.md`。本ack保留下方最终设备结论、accepted gaps、P2与历史evidence，不新增测试PASS。TASK21已进入 `IN_PROGRESS / PRE_PILOT_CLOSURE`，当前 `OPPORTUNITY_RULE_FOUNDER_DECISION_REQUIRED`；TASK22=`LOCKED / NOT_STARTED`。本次文档增补没有云端动作。下方“待final ack／不启动21”只描述本ack前时点。

## 最终技术结论｜2026-09-30（final ack 前的技术收口快照）

**TASK-V2-20 = TRUE_DEVICE_GATES_PASS_WITH_FOUNDER_ACCEPTED_GAPS / AWAITING_FOUNDER_FINAL_ACK**。

本轮可安全执行的Device A补测已完成。TASK-V2-21=`READY / NOT_STARTED`，TASK22未开始；最终人工确认待Founder，不标`HUMAN_APPROVED / FROZEN`。

### 验收结果

| 项目 | 最终结果 |
| --- | --- |
| M1隐藏／回滚消费 | DEVICE_M1_CONSUMPTION=PASS / NO_RESURRECTION=PASS；7→0，刷新有加载态、拖缩后不复活、无法再开原详情；真实微信query返回0。未专门制造迟到响应竞态 |
| 真实关闭／恢复定位 | LOCATION_DENY_MANUAL_BROWSE=PASS / LOCATION_REENABLE=PASS；仍可拖缩刷新、恢复后能回到当前位置，无重复授权或相机误提示 |
| F1核验失败→重试 | DEVICE_SYNTHETIC_CONTRACT_PASS；首次明确失败且无新增，重试后1条VERIFIED SHARE upload及1条STATE／ACTIVATE_EVENT／outbox，无重复。仅现成独立diagnostic synthetic合同链 |
| F3贡献删除 | PASS；Founder“删除后消失 合成版面上传保留”；新upload／STATE均DELETED、noResurrection=true；旧激活事件、删除事件与一次duplicate重放未复活 |
| 首次详情轻量复核 | 三次有加载提示、最终成功、无白屏；T20-P2-01继续OPEN / ACCEPTED_FOR_TASK21_OPTIMIZATION，未宣称延迟修复 |
| 完整V1冻结结构 | V1_DIFF=0 / VERIFIED；preflight、M1结束、最终窗口结束分别完整同形重新回读 |
| 缺陷／隐私 | 未修复P0=0、P1=0、PRIVATE_LEAKAGE=0，限已执行和审查范围；既有三项P1已修复并真机确认，P2详情延迟仍开放。无新增P3阻断项 |
| 最终安全停机 | SAFE_STOP_VERIFIED=true；epoch25，8函数全部临时ENABLED=false、caller DIGESTS空、完整环境恢复；read-stop=true、HA pause=true、PUBLIC=0 |

### Founder接受的缺口

| 项目 | 最终结论 |
| --- | --- |
| Device B／第二平台／低端机 | NOT_RUN / FOUNDER_ACCEPTED_EVIDENCE_GAP |
| 第二账号B本轮新隔离／跨账号落地 | NOT_RUN / FOUNDER_ACCEPTED_EVIDENCE_GAP；TASK19历史证据仅作历史引用 |
| 真实Slow Network J3 | NOT_RUN / FOUNDER_ACCEPTED_EVIDENCE_GAP |
| 500设备数值 | NOT_RUN / FOUNDER_ACCEPTED_EVIDENCE_GAP；TASK18_SYNTHETIC_CAPACITY_PASS + DEVICE_A_NORMAL_PATH_PASS + 500_DEVICE_NUMERIC_NOT_RUN；不恢复已删除压力面板 |
| F2未同意→持久同意→历史SHARE重新投影 | FOUNDER_ACCEPTED_LIMITED_E2E_GAP；没有现成安全未同意身份，不重置A consent |
| 多贡献者删除真机 | FOUNDER_ACCEPTED_LIMITED_E2E_GAP；本轮单贡献删除未形成公开marker，不冒充最后公开marker退役通过 |
| 真实三项照片失败／对应重传 | COVERED_BY_EXISTING_NEGATIVE_TESTS / NO_SAFE_DEVICE_INJECTION；F1已有synthetic提交失败重试设备证据，未扩建正式故障入口 |

上述缺口按Founder最终命令不阻断本轮，不写PASS。完整范围与理由见[独立Device A补测报告](v2-e-task-20-final-device-a-gap-closure.md)。

### 数据、外部操作与回归

仅使用已批准shadow资源和合成数据，无新增collection/index/function/secret/trigger/Storage。临时source b2r4整个文档已恢复；原b2r5合成上传ACTIVE保留；保留新DELETED upload／STATE、ACTIVATE／DELETE审计和2条APPLIED outbox。7条UI行HIDDEN／HIDDEN。后台最后将本轮独立BoardInstance标为RETIRED，不能将此管理员动作冒充真机删除最后公开Marker证据。全部8函数环境变量与原preflight逐值一致，unused ALLOWLIST错键已物理移除。未访问／清理V1私有业务记录。

最终自动门：Vitest995 passed/1 skipped，shadow定向26/26，ESLint、root/Web TypeScript、contracts/workflow、Next build、v3 artifact7项／static allowlist、正式微信CLI preview999617 bytes与包体审计（sourceBytes1307148／devOrFixtureCount=0）通过。触及Prettier、git diff --check、最终文档workflow收口检查通过。Web Playwright本轮无产品代码变更未重跑，历史V1左滑flaky25/26保留。本轮只修改文档／证据，未commit/push/PR/merge/tag或正式upload/review/publish；预览码不是正式发布。

完整核验见[最终V1差异报告](v2-e-task-20-final-v1-diff-verification.md)，最终安全与零差异JSON：[最终回读证据](../../artifacts/task20/final-v1-diff-and-stop-state-20260930.json)。

### TASK21_PRE_PILOT_INPUTS

- OPPORTUNITY_EVALUATION_AND_FILTER_RESTORE_REQUIRED：真实评估、筛选恢复、Marker状态和详情ICHI对话状态；当前Opportunity chip继续隐藏。
- MAP_STATE_UI_POLISH_REQUIRED：Empty／Search-no-result／Service-unavailable等状态页视觉；当前仍能解释状态并提供基本恢复路径。
- T20-P2-01 OPEN / ACCEPTED_FOR_TASK21_OPTIMIZATION：首次详情延迟保留，进入TASK21优化输入。

以上只登记，不启动TASK21。Founder阅读最终结果后再做TASK20最终人工确认。

## 历史执行快照（下方日期中的“当前／实时／最新”仅指当时）

## 2026-09-30 M1 与定位补测进度（实时）

Device A 已完成可见7个marker→HIDDEN／epoch21→22→刷新／拖动／缩放后全消失、无再次出现且详情不可打开；刷新单独复查出现加载态，真实微信query成功0项，M1=PASS／NO_RESURRECTION=PASS。详情冷首次与连续两次都有loading并最终成功、无白屏，P2仍 OPEN / ACCEPTED_FOR_TASK21_OPTIMIZATION。上一窗口关闭epoch23后，完整V1所有冻结结构字段／Storage hash再次0diff，证据见 final-v1-diff-after-m1-20260930.json。

定位窗口应Founder要求重开epoch24：query/detail仅A开放，7个marker仍隐藏、HA暂停。关闭定位后Founder仍可手动拖动／缩放，定位提示仅可手动浏览、刷新正常；恢复定位及无重复授权／相机误提示待回报。本轮F1/F3现复用已有独立删除diagnostic（源码不改）准备失败重试和STATE contribution删除：旧synthetic source临时新观察版本／独立坐标，首次recognition设FAILED；必须在结束恢复原source字段。仅A的submit/manage/resolve临时开启，projector关闭，未建新upload/contribution。此前F1无安全注入暂定结论撤回，转等待这条已有诊断路径；不能把它冒充三项实拍正式验收。

当前仍 IN_PROGRESS / FINAL_DEVICE_A_GAP_CLOSURE；定位恢复、F1/F3设备结果与本窗口最终finally停机／完整V1回读未完成。下方停机状态均为对应历史时点，不是当前实时状态。TASK21 READY / NOT_STARTED，TASK22未开始。

## 2026-09-30 最终补测命令（当前）

状态：`IN_PROGRESS / FINAL_DEVICE_A_GAP_CLOSURE`。Founder 新命令重新要求 M1 真机隐藏消费和关闭定位／手动浏览／恢复定位；Device B、第二账号 B 新隔离复测、真实慢网明确接受为 `NOT_RUN / FOUNDER_ACCEPTED_EVIDENCE_GAP`，本轮不阻断，500 数值只复用现成安全 diagnostic。P2 详情延迟接受进入 TASK21 优化；OpportunityEvaluation／筛选恢复和地图状态页视觉只记录为 TASK21 pre-pilot 输入，本轮不返工。

完整 V1 frozen structural baseline 已同形回读 `V1_DIFF=0 / VERIFIED`：19 函数环境、4 trigger、43 index 归一化表示差异后精确一致；Storage root 与 CUSTOM rule 按原 CLI 输出重建 bytes 的 hash 均与 TASK19 基线匹配。QPS／套餐动态字段按命令排除。8 shadow 关闭态、read-stop=true、epoch=20、HA pause=true、PUBLIC=0；最终设备窗口结束后须再次读回。M1／定位补测及 F1—F4 结果以 `v2-e-task-20-final-device-a-gap-closure.md` 为准；完整 V1 证据见 `v2-e-task-20-final-v1-diff-verification.md`。未标最终通过或 Founder 人工验收，TASK21 READY / NOT_STARTED，TASK22 未开始。

`TASK21_PRE_PILOT_INPUTS`：`OPPORTUNITY_EVALUATION_AND_FILTER_RESTORE_REQUIRED`、`MAP_STATE_UI_POLISH_REQUIRED`、`T20-P2-01 OPEN / ACCEPTED_FOR_TASK21_OPTIMIZATION`。下方各节为历史时点记录。

## 2026-09-29 Device A 补测与执行范围（当前判定）

Founder 明确本轮不做第二台设备，Device B、第二平台／低端、账号 B 隔离与跨账号分享均记 `NOT_RUN / FOUNDER_SKIPPED / EVIDENCE_GAP`；P2B 拒绝定位也按先前指示跳过。当前没有稳定可复现的弱网，P5/J3 记 `NOT_RUN / NO_REPRODUCIBLE_NETWORK`。这些项目均不算通过，TASK21/22 未解锁。

Device A 使用正式预览码 `artifacts/task20/preview-qr-m1-20260929.jpg`（999,617 bytes）补测：Founder 确认上海 7 个合成标记出现、无匹配搜索提示正确、清空搜索后标记恢复；此前搜索恢复缺口已补齐。标记详情仍是首次慢、重复快、无白屏；本轮 CLS 首次 detail 函数 2,972 ms，随后三次 289/346/361 ms。`T20-P2-01` 保持 `OPEN / REPRODUCED`，服务端耗时不代表端上完整等待时间。

M1 的远端隐藏消费检查已将 7 条合成标记精确设为 `HIDDEN / HIDDEN` 并回读，read epoch 18→19；尚未收到 Founder 对刷新、拖缩后的真机结果，不能写设备通过。窗口已安全停机：read-stop=true、epoch=20、HA pause=true，8 个 shadow 函数 flags=false/allowlist 空、`PUBLIC=0`。本地 migration/rollback 合同回归已通过，但真机迟到响应与完整迁移回滚消费仍缺证据。

停机后与 TASK19 只读基线比较：V1 13 collection、43 index、13 ACL、19 函数版本／运行时／触发器无差异；18 个函数环境原始 hash 相同，另一个空变量在 API 中由 `null` 序列化为 `[]`；存储根目录 2 个对象的 Key/LastModified/ETag/Size/StorageClass 与历史快照一致，函数调用规则内容一致。已重新读到当前存储桶权限规则，但历史基线只留规则 hash，缺少同形原始返回，环境 QPS／套餐细项也未重取，故完整 `V1_DIFF=0` 仍待证实。自动门已重跑 Vitest 995 passed/1 skipped、ESLint、双 TypeScript、contracts/workflow、Next build、v3 artifact、包体审计 sourceBytes 1,307,148/devOrFixtureCount 0、触及文档 Prettier、workflow 和 `git diff --check`，均通过。

当前 `TASK-V2-20 = IN_PROGRESS / EVIDENCE_GAPS`。三项 P1 受影响界面路径已有 Founder 真机通过；剩余真实核验失败重试、未同意后的持久同意与自动投影、贡献删除链、M1 设备消费、500 点设备数值及完整 V1 差异门仍缺证据。Founder 尚未做最终人工验收；不得标记 `TRUE_DEVICE_GATES_PASS` 或 `HUMAN_APPROVED / FROZEN`。下方各节保留对应时点的阶段记录。

## 2026-09-29 P3 上传列表语义修正（最新）

Founder 澄清分享选择、三项核验、“已上传”与地图条例之间的关系后，正式 candidate 上传列表仅显示 `ACTIVE + SHARE`，排除“暂不分享”合成行和计数，卡片不再展示逐记录分享意图。新版正式预览码 `artifacts/task20/preview-qr-p3-share-semantics-20260929.jpg` 编译包体 999,617 bytes；Founder 在账号 A 的 iPhone 16 Pro / iOS 26 报告云端列表位置、“已上传”徽标及去除错误文案均“全部正常”，记 `T20-P2-03 RESOLVED_UI / USER_REPORTED_TRUE_DEVICE_PASS`。诊断 `DO_NOT_SHARE` 行已软退役且 no-resurrection，TASK19 `SHARE` 行保持 ACTIVE。短时 manage/consent 测试窗口已关闭并回读 8 函数 flags=false/allowlist 空、read-stop=true、epoch=17、HA pause=true、PUBLIC=0。自动门 Vitest 995 passed/1 skipped、ESLint、双 TS、contracts/workflow、Next build、v3 artifact、包体审计 sourceBytes 1,307,148/devOrFixtureCount 0、Prettier/diff check 通过。真实失败核验重试、未同意→同意后的地图自动投影、真机删除、M1 消费、Device B 与完整 V1 diff 仍缺证据；TASK20 维持 `IN_PROGRESS / EVIDENCE_GAPS`，不标最终通过。下方旧阶段状态按其当时时点解释。

P3 本人删除已随后用独立 `DIAGNOSTIC_ONLY` 合成 `SHARE` 行完成：Founder 左滑专用标记卡片并确认，回报该卡片消失、TASK19 原卡片仍在；云端回读本轮行 `DELETED / noResurrection=true`，原行 ACTIVE，仅产生 `DELETE_EVENT` 而没有 `STATE` contribution。submit/manage 入口再次关闭，8 函数 flags=false/allowlist 空、read-stop=true、epoch=17、HA pause=true、PUBLIC=0；窗口后 V1 13 collection、43 index、13 ACL、19 function 结构子集与 TASK19 基线一致，完整配置/Storage hash 未重算。故本人 candidate 删除和列表更新已真机通过；多贡献者保留、最后贡献者地图退役、真实三项实拍核验与未同意后自动投影仍缺端到端证据。诊断码 `artifacts/task20/preview-qr-p3-share-delete-diagnostic-20260929.jpg`，1,000,414 bytes，不是正式发布包。

## 2026-09-29 P4—P6 最新状态

Founder 在正式预览版确认好友分享、朋友圈分享后的同账号“我的”页落地均正常；彻底关闭并重开微信后从文件传输助手打开卡片，第一屏仍到“我的”。进入 My Upload 所见“条例状态暂不可用”与候选 consent 函数关闭状态一致。P5 飞行模式下标记保留、失败提示可理解，恢复后加载正常；Wi‑Fi/蜂窝切换后的拖动、刷新、详情均正常。P6 后台返回、Tab 往返、锁屏解锁后地图/标记/详情正常且无重复提示。以上为 Founder 真机文字回报，未替代跨账号、弱网、迟到响应日志或 listener 数量测量。两个只读窗口已安全停机：8 函数 flags=false/allowlist 空、read-stop=true、HA pause=true、epoch=17、PUBLIC=0。停机后重新只读对照 TASK19 基线：V1 13 collection 存在、43 index/13 ACL/19 函数 ModTime/CodeSize/runtime/trigger 无差异，云存储根项数 2 与函数调用规则也一致；完整环境变量和 Storage 内容 hash 未重算，故不声称完整 `V1_DIFF=0`。P3 新合成上传的真实删除与 projection/no-resurrection、M1 消费、Device B 和最终人工验收仍未完成，故 TASK20 继续 `IN_PROGRESS / EVIDENCE_GAPS`，不达到 TRUE_DEVICE_GATES_PASS。

本次收尾自动门：Vitest 994 passed/1 skipped、ESLint、根与 Web TypeScript、contracts/workflow、Next build、v3 候选 artifact 静态校验、触及文档 Prettier、`git diff --check`、小程序包体审计（sourceBytes 1,307,066；dev/fixture 0）均通过。正式微信 CLI preview 999,576 bytes；这些结果不替代剩余真机证据。

M1 已批准 candidate/synthetic migration/rollback 的本地合同和集成回归包含 per-record 授权/位置/隐藏门、`null → 0`、deleted stale version 不复活、hidden 后详情/刷新不可见与 read-stop 无私有回退；本轮远端停机也实际设置了 read-stop 与 epoch 并隐藏 7 条测试行。没有在设备上验证 migration/rollback 的迟到响应消费，因此 M1 保持 `LOCAL_REGRESSION_PASS / DEVICE_CONSUMPTION_EVIDENCE_GAP`；没有执行任何 V1 private production backfill。

## 2026-09-29 最新判定

P3 T20-P1-03 的账号 A 已同意路径经 Founder 真机复测恢复；未同意状态的独立 `DIAGNOSTIC_ONLY` 界面预览由 Founder 确认卡片、弹窗、按钮及本地点击变化全部正常，但真实新账号持久同意仍无证据。T20-P2-02 的统一云端列表、卡片、左滑垃圾桶和删除确认均获 Founder 真机确认；删除确认已取消，P3 删除及投影/no-resurrection 未执行，TASK19 既有合成上传保留。测试入口已关闭：8 函数 flags=false/allowlist 空、read-stop=true、ha-pause=true、epoch=13、PUBLIC=0。V1 结构子集无差异，完整配置/Storage hash 未重做。TASK20 继续 `IN_PROGRESS / DEVICE_A_REMAINING_MATRIX`；P4—P7、Device B 和最终完整 V1 差异门未通过。

## 2026-09-29 当前结论（覆盖下方早期快照）

P2A 的 T20-P1-01/02 已由 Founder 真机确认受影响路径恢复；P2B 拒绝定位按 Founder 指示 `NOT_RUN / FOUNDER_SKIPPED`。P3 截图发现 T20-P1-03：已同意账号误显未同意、条例弹窗按钮错位且无效。本地修复与自动门通过（Vitest 993 passed/1 skipped；ESLint、双 TS、contracts/workflow、Next build、微信 CLI preview 997,330 bytes、包体审计 dev/fixture=0）。仅对 A 短时开放 P3 候选函数，未收到复测结果后已关闭；回读 8 函数 flags=false/allowlist 空、`read-stop=true`、epoch=13、`ha-pause=true`、`PUBLIC=0`。V1 结构子集 13 collection、43 index、13 ACL、19 函数无差异；完整 Storage/环境配置 hash diff 未重做。P3 真机复测尚未通过。TASK20 仍 `IN_PROGRESS / P1_REPAIR_AND_RETEST`，不能标最终验收；Device B 缺席、P4—P7 未执行。

日期：2026-09-29。状态：`IN_PROGRESS / P1_REPAIR_AND_RETEST`；**尚未达到验收门**。

## 证据与停止门

| 条件 | 当前结果 |
| --- | --- |
| TASK19 pre-state | `COMPLETE / HUMAN_APPROVED / FROZEN`；历史 stop-state 有记录，本轮只读 preflight 进行中 |
| Device A 全矩阵 | P1A—1D 地图、聚合/Picker、Tab 与无匹配搜索已由 Founder 分段报告；P2A 两项 P1 经两轮修复后，Founder 确认空地图连续拖缩正常、无全屏误报。P2B 拒绝定位由 Founder 明确跳过，记 NOT_RUN；P3 My Upload 只读核对进行中，删除未执行。P4—P7 未执行；微信/基础库、权限和网络信息仍未齐 |
| Device B 第二平台/低端 | EVIDENCE_GAP：Founder 当前只有主力机 |
| P0/P1 | T20-P1-01/02 受影响 P2A 路径均由 Founder 真机确认修复；另有 1 项 P2 详情延迟。全矩阵未完成，不能写最终 P0/P1=0 |
| candidate/synthetic migration/rollback 消费 | NOT_RUN；禁止 V1 private production backfill |
| 自动回归 | P1 修复后全量 Vitest 992/1、Lint、双 TS、合同/workflow、Next build、微信 CLI preview 与包体审计通过；不能替代真机。Web Playwright 首轮 25/26，历史 V1 左滑 flaky 失败照实保留 |
| candidate stop-state | P2A 首次修复版复测后立即停机；read-stop=true、ha-pause=true、epoch=11、PUBLIC=0，8 函数 flags=false/allowlist 空。第二次修复版测试窗口尚未开启 |
| V1 | 最终停机后再读回 13 collection 名称、43 index、13 ACL、19 函数 ModTime/CodeSize/runtime/4 trigger，与 TASK19 基线一致；环境变量值/Storage 完整 hash diff 未重做，未读取 V1 业务记录 |
| Founder 最终人工验收 | PENDING |

本轮报告：`v2-e-task-20-true-device-preflight-and-matrix.md`、`v2-e-task-20-device-a-session.md`、`v2-e-task-20-defect-log.md`；Device B 真正执行时另建低端 session。每段记录实际结果、证据路径、缺陷、文件、CloudBase/config/data 动作、自动门、修复、V1、停机与 Git 状态。

当前不写 `TRUE_DEVICE_GATES_PASS / AWAITING_FOUNDER_REVIEW`，不写 `HUMAN_APPROVED / FROZEN`，不开始 TASK21/22。未 commit/push/PR/merge/tag/upload/review/publish。下一步先对 Device A 重新打开受控窗口，只重测 P2A；通过后继续剩余 Phase。第二平台/低端仍为证据缺口。
