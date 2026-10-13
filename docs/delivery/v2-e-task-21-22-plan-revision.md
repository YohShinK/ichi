# TASK21/22 Plan Revision｜Production Convergence + Hot-start

日期：2026-10-02（Asia/Shanghai）。结论：`DOCUMENT_REVISION_COMPLETE / KNOWLEDGE_ALIGNMENT_COMPLETE`。本报告是修订证据，唯一 canonical plan 仍为 `memory-bank/implementation-plan.md`。

## 1. 授权与当前事实快照

Founder 要求执行 Downloads 总命令；其最高优先级已批准输入是取消 Closed Pilot、接受缺口、进入生产整合/热启动，而执行范围仅本地规划/决策/架构认知/状态。独立 [Founder decision](../decisions/v2-production-hot-start-direction.md) 记录批准来源与边界。原命令路径 `/Users/cunfu/Downloads/ICHI_TASK-V2-21及后续任务重构_热启动路线_认知对齐_总命令.md`，SHA-256 `942b0f717e1045b000b042f20928d1fa9adc0efbbb008bea2cff1b14dc729dd7`。

修改前先保存五份 canonical 文件原文及工作树文件 SHA 清单；本报告永久记录 pre-state、旧任务职责与原文件 hashes。临时逐字备份路径为 `/var/folders/87/jt5z4q1154s308w9hl1h29ww0000gn/T/ichi-task21-22-20261001-cy8sw6fo`，只是本轮核对材料，不是新 authoritative plan，也不作为后续唯一依赖。

| Pre-state 项 | 仓库当时事实 |
| --- | --- |
| Workspace / branch / HEAD | `/Users/cunfu/Documents/ichi 2` / `feature/v2-board-map` / `929d189a06e13010e50abf4927bfec3b1ebd49fc` |
| 工作树 | 已有大量 tracked dirty 与 untracked code/docs/artifacts；不 reset、stash、覆盖、提交或推送 |
| 活动区块 | V2-E / IN_PROGRESS；progress 最上方无可执行工作集、TASK22 LOCKED |
| TASK19 最终有效门 | COMPLETE / HUMAN_APPROVED / FROZEN；`v2-e-task-19-minimal-real-wechat-rehearsal-closeout.md` 与 progress 2026-09-29 final ack。早期 final-acceptance/final-closeout 中的阻断是阶段历史 |
| TASK20 最终有效门 | COMPLETE / HUMAN_APPROVED / FROZEN；`v2-e-task-20-founder-final-closeout.md`；未测 Device B/低端/第二账号/慢网/500数值及有限E2E缺口保留 |
| TASK21 实际完成 | 2026-10-01 Pre-Pilot PASS / HUMAN_APPROVED / TESTS_CLOSED；UPLOAD_ONLY_AND_REPORTING_PRE_PILOT_CLOSURE=PASS，限最终授权工作集 |
| TASK21 原 canonical 目标 | 授权供给封闭试验、理解/下线/成本复验与 RC 决策；目标为 bounded rollout、真实用户任务、Freshness/PublicLocation、运营/成本与 RC |
| TASK21 原状态边界 | COMPLETE / HUMAN_APPROVED / PRE_PILOT_CLOSURE_PASS / TESTS_CLOSED，但 Closed Pilot NOT_RUN / PILOT_PROTOCOL_APPROVAL_REQUIRED，RC未批准 |
| TASK22 原 canonical | Actual Publication 与 Immutable Tag Closure；LOCKED / NOT_STARTED，依赖 TASK21 Founder RC approval，仅 final regression/deploy/read-back/发布/tag |
| 原供给路线 | NETWORK_SOURCE 一次性三阶段、单区域约20条、旧公开label“网络来源”，未实施生产持续 NETWORK ingestion |
| 历史最终停机 | 9函数flag=false/allowlist空、read-stop=true/HA pause=true、epoch41、PUBLIC0、12authority inactive；是2026-10-01报告证据，本轮未live核对 |
| 历史自动验证 | Pre-Pilot 1096 PASS/1既有SKIP、Web26/26及TS/Lint/contracts/build等；本轮未重跑产品回归，不宣称production PASS |

| Canonical pre-state 文件 | SHA-256（修改前） |
| --- | --- |
| memory-bank/implementation-plan.md | `af6ff910222279bd532fd04015eca44751f76c8507879137e53bf4ad5b1d5c41` |
| memory-bank/design-document.md | `a4f8320a00d1cc473552563e9ce3692a78292c1a777c1e4876d5e8b2356eecff` |
| memory-bank/architecture.md | `30ec45bb88c7534fefe47aab938d84801f7dc8166bf4c5ebba4d7fe0474967fb` |
| memory-bank/tech-stack.md | `fd57bef53d90c24c17a3369a1cb5ad5b0fd0441e8b545f5928be23e705814780` |
| memory-bank/progress.md | `e407a30cb62512a3db658227c631f3e4d9e92e61675b779f8193f6b71b605543` |

## 2. Founder 最新决定与新 TASK21

TASK21 保留编号并成为 Pre-Pilot Closure、Closed Pilot Waiver 与 Production Direction Gate。新目标是收口已完成 Pre-Pilot、记录 explicit waiver/accepted gaps、冻结后端正式整合与 PLAYER/NETWORK 统一、50上海→300全国热启动方向，解锁 TASK22。

- `PRE_PILOT_CLOSURE = PASS / HUMAN_APPROVED / FROZEN`。
- `CLOSED_PILOT = WAIVED_BY_FOUNDER / NOT_RUN`。
- `CLOSED_PILOT_EVIDENCE = GAP_ACCEPTED_BY_FOUNDER`。
- `TASK-V2-21 = COMPLETE / HUMAN_APPROVED / PRE_PILOT_PASS / CLOSED_PILOT_WAIVED_BY_FOUNDER / EVIDENCE_GAPS_ACCEPTED`。

不执行 participant allowlist / bounded gray user test、discovery time/value、真实多用户误解、pilot cost、自然用户任务、pilot-specific Freshness/PublicLocation 校准或旧 Closed Pilot RC 决策。它们不再阻塞 TASK22，但原计划/旧协议保留可追溯出处；不把未运行试验写 PASS。

## 3. 新 TASK22 职责与内部 Phase

`TASK-V2-22 = READY / NOT_STARTED / PRODUCTION_CONVERGENCE_AND_HOT_START_DIRECTION_APPROVED`。既有 TASK_ID 不变，无 22A/22B/23 等新任务。

| TASK22 Phase | 目标/产物 | 晋级门 |
| --- | --- | --- |
| Production Backend Convergence | One ICHI Backend分层、function/collection promotion matrix、testing-only资源处置、provisional production contract、config/secret/ACL/index/rate/read-stop/rollback exact diff/artifact/SHA及runbook | 本地/dry-run验证；外部apply单独授权后read-back；禁止synthetic rows提升 |
| Unified Source Schema + V1→V2 Continuous Bridge | exact DRAW P1/APPROVED drawSubmissions与direct finalized UPLOAD inputs；历史逐记录eligible桥接及未来success/version/current/delete连续传播 | 不bulk-public、不公开DO_NOT_SHARE；PLAYER当前consent/SHARE、fail closed/replay/recovery/rollback/no-resurrection；无request-time private join |
| NETWORK_SOURCE / OFFICIAL_CURATED | NETWORK variant/provenance/rights/official curator/null contributor、“网络上传”及30d visibility政策、published/observed/basis/anchor关系 | 保留统一Verification/Resolution/Eligibility；不伪造PLAYER、不套PLAYER consent、不伪造时间；injected clock/版本化合同 |
| Founder-reviewed Collection | 小红书上海最近7天、可识别版面图、可确定地点/结构化；本地候选与并排review card、URL dedupe | 直到Founder批准50个合格版面；PENDING/REJECTED/NEEDS_FIX local-only，Founder确认大赏集合，Codex不审批 |
| Official Network Source Ingestion Skill/workflow | 简单collect/review/publish、exact reviewVersion/actor/time绑定、schema/official ingestion/server Verification/projection/read-back | 无CMS；上线后持续补充；publish只消费显式Founder-approved输入并受外部写入授权约束 |
| Shanghai50 Production Seeding Rehearsal | 50条获准production-like全链、PLAYER+NETWORK+shared domain+30d+V1/V2/security/privacy/rollback/真机证据 | 全部闭合PASS后才最终冻结schema/ingestion/time/UI/review/bridge合同，再全国扩展 |
| Nationwide300 Hot-start | 同标准扩展全国，300个Founder-approved合格版面成功ingestion/PublicMapLead链路，count/dup-instance/coverage/性能/成本/privacy/真机 | 不是找到300篇文章；counts与BoardInstance关系可核对，不强造重复Marker；完整read-back/smoke |
| Actual Publication | full regression、production deploy/read-back、bridge/migration、privacy、真机/rollback、PR/merge、微信upload/review/publish、online source/tag | 每项外部动作独立授权；实际PUBLISHED确认之后才可建immutable tag |

Phase1—5 的合同为可测试 provisional contract；Phase6全闭合后最终冻结，避免把“先有入库规则”和“50条通过后最终冻结”误写为互相矛盾。

## 4. Critical Path 与 Completion Definition

旧：19 layered gate → 20 true-device → 21 Closed Pilot/RC → 22 actual publication/tag。

新：19 layered gate → 20 true-device → 21 Pre-Pilot closure + Founder waiver/accepted gaps + production direction → 22生产整合 → PLAYER continuous bridge + NETWORK unified pipeline/Founder workflow → 上海50 → 全国300 → final production regression/read-back/smoke → actual WeChat publication → immutable tag。

完成定义现在要求 Pre-Pilot PASS及Closed Pilot waiver明确、production supply route实际成立、50条整体验收/合同最终冻结、300条成功production ingestion/PublicMapLead、production true-device/security/privacy/rollback/release smoke、剩余缺口Founder明确接受、actual publication与授权tag。PLAYER与NETWORK两条既定计划职责均须验收，不能用“至少一条route成立”免除另一条；真实多用户理解/行为/Pilot成本缺口仍不称PASS。

保持独立Source/Observation/Rights lineage、conservative Resolution、null≠0、五状态Opportunity与公开安全独立、no-resurrection、opaque/stable continuous ID/retire新ID、四层Location、no public board/evidence image、trusted Account/no Profile gate及hybrid public-safe serving。

## 5. EDG/PDG 处理

- PDG-01—07批准的技术/公开安全语义保留；本次 Founder 明确关闭旧Closed Pilot/RC前置Product Gate并批准新的 NETWORK 持续curator范围、文案与50/300路线。
- EDG-01—06原V2-B contract-level PASS与TASK19/20/21有限证据保留，不抹去LOWER_CONFIDENCE、EXTERNAL_USER_N=0或设备覆盖缺口。
- 只能由Closed Pilot产出的真实多用户理解、discovery-value/行动、pilot cost/scale及pilot专用校准标 `WAIVED_BY_FOUNDER / NOT_RUN / EVIDENCE_GAP_ACCEPTED`。
- 可实测的production供给、index/query、成本/stop参数、PublicLocation、治理/下架/删除/expiry、rollback与真机迁TASK22 50/300/final smoke，不用waiver替代。
- 新schema/文案/30d需versioned implementation；现有候选参数不直接作为production冻结值，也不把旧¥20目标当新账单结果。Knowledge Alignment中的兼容性是读源审计结论，不是新运行验证。

## 6. Exact Sections Changed / Files Changed

| 文件 | 具体修订区段/职责 |
| --- | --- |
| memory-bank/design-document.md | 新2026-10-02当前决定/当前产品验收来源政策；V2-C继承入口中的NETWORK范围/label、外部复验、20条与30/10/14旧目标；3.2当前入口；5.8新增NETWORK30d优先语义；8.2当前人工验收 |
| memory-bank/tech-stack.md | 新当前决定与production技术规划；V2-A技术结论中的旧一次性NETWORK路线明确superseded；Completion Reconciliation下游owner；8/发布策略V2重写 |
| memory-bank/implementation-plan.md | 新当前决定；0/权威入口；1/V2状态；2.2/当前依赖、2.4/waived gate停止条件；V2概念与供给范围、IN_SCOPE；7/EDG；8.1/NETWORK与时间；10.2/NETWORK label；V2-E共享路线说明；canonical TASK21/22及八Phase；13/Critical Path；14/Completion；15/Stop Point |
| memory-bank/architecture.md | 新当前决定、真实结构vs未来production职责/代码缺口；文件职责表新增3份文档，不宣称production结构已实现 |
| memory-bank/progress.md | 新当前决定/active workset/Knowledge Entry/本轮验证与下一门；旧2026-10-01锁定停止点明确为历史 |
| docs/decisions/v2-production-hot-start-direction.md | 新建Founder决策事实源、批准来源/SHA、来源/审核/50-300/30d/EDG/历史supersession与外部动作边界 |
| docs/delivery/v2-e-task-21-22-plan-revision.md | 本报告，新建pre-state与精确变更/验证/停止点记录 |
| docs/delivery/v2-e-task-21-22-knowledge-alignment.md | 新建28项alignment matrix、冲突分类、上游/历史保护、剩余实现工作 |

TASK01—20 canonical任务段落及历史delivery/research/decision不修改。Source/Rights/mapping/D08/D09的旧路线差异在新decision/current docs显式supersede，技术语义继续继承，不回写成“当时已执行新路线”。README/PRD/implementation-plan历史副本及远期V3未改。

## 7. 文档验证、Git 与副作用

本轮文档治理验证：

- `node scripts/validate-workflow.mjs`：PASS（8 required files）。
- 8份触及Markdown Prettier格式检查：PASS。
- 本轮逐文件diff/本地链接/28项matrix/状态/禁新TASK_ID与上游task block/hash核对：PASS。
- 全工作树 `git diff --check`：PASS；没有将既有dirty内容归功于本轮。
- 修改前1686个tracked/non-ignored untracked文件逐字SHA清单对比：只有五份memory-bank发生变化；新增仅三份Markdown。代码、历史delivery/research、既有artifact、资源manifest及配置未变；20个TASK01—20任务段落SHA完全一致。
- branch/HEAD不变；本轮commit/push/PR/merge/tag=0。没有运行产品quality/build/浏览器/设备/云测试；既有Pre-Pilot测试结果只作历史证据引用。

本轮 cloud/data/code deployment = 0。CloudBase resource/config/secret/ACL/index/function/data动作=0；migration/bridge实现=0；小红书采集/50或300候选生成/正式ingestion=0；Skill创建运行/CMS/自动化=0；微信upload/review/publish=0。

Rollback限本轮8份文档：使用pre-state局部恢复/删除本轮新Markdown，不回退原有dirty代码；本轮无云状态需要回滚。

## 8. Remaining Implementation Work / Next Task Gate

当前无未解决 upstream hard contract conflict。现有PLAYER-shaped provenance/VerificationInput、旧network label serving/parser、未实现NETWORK30d visibility、reference migration dry-run及shadow synthetic authority均不能视为production能力；它们需要在TASK22扩展/连接并验证，详见 [Knowledge Alignment](v2-e-task-21-22-knowledge-alignment.md)。

下一阶段建议：**TASK22 Phase 1｜Production Backend Convergence**。先审计并交production promotion matrix、provisional schema/resource exact diff、artifact/SHA与migration/continuous bridge/rollback runbook，之后逐项请求外部apply授权。

本轮在文档重构与认知对齐完成处停止；TASK22 READY代表方向与依赖已解锁，NOT_STARTED代表实现未开始。下一Codex不得恢复旧Closed Pilot protocol；等待Founder下一条命令。
