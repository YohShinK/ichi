# TASK22 Phase2 本地实现与外部动作审阅

> 本文是已冻结Phase2本地候选的历史证据，不是现行客户端分享流程。当前执行以memory-bank/progress.md顶部、docs/decisions/map-upload-sharing-contract.md及分享接点审计报告为准；禁止据此恢复独立地图分享选择按钮。

状态：`LOCAL_IMPLEMENTED / LOCAL_GATES_PASS / AWAITING_REVIEW / CLOUD_NOT_APPLIED / PRODUCTION_DISABLED`。TASK22 整体仍 IN_PROGRESS，Phase3 未解锁。

Founder“执行TASK22 Phase2”已承接并解锁本地工作集。Phase1-D4 的九函数关闭态基线继续有效；本轮只有云端只读查询/代码下载，没有云资源写入、函数调用、真实迁移、服务开启或 Git 提交/推送。

## 已实现

| Step | 产物与验证 | 状态 |
| --- | --- | --- |
| P2-A | 两路径统一私有输入、exact APPROVED draw 减法、版本化 SHARE/consent/rights/location/备注门 | AWAITING_REVIEW |
| P2-B | V1 发布/备注重审/记录及账号删除原子 outbox、hide-first、revision/epoch fence | AWAITING_REVIEW |
| P2-C | 冻结 domain 派生 pipeline、三个受控入口、有界事务/重试/dead-letter/replay | AWAITING_REVIEW |
| P2-D | 只读历史预览、逐条适用授权重检、pending/applied 幂等、remote exact rollback | AWAITING_REVIEW |
| P2-E | 新增36项桥接测试；全量1176通过+1既有跳过；Lint/typecheck/contracts/Next构建；Playwright26/26 | AWAITING_REVIEW |
| P2-F | 四集合/四索引提案、七独立包、SHA/本地包演练、最小资源批次及runbook | AWAITING_REVIEW |

实现边界与安全策略：[源码合同](../../packages/v2-map/resources/production/phase2/README.md)。当前正式 frontend bindings 没有改变，真机视觉由 Founder 负责。

## 本轮确认的新认知

- 四个 V1 远端 shared runtime 并非同一历史版本；recognize-draw-tickets 的 index 与本地 prechange 一致，但其 shared/runtime 也较旧。候选 ZIP 因此以每个真实远端包为基线，只修改对应目标文件并新增 producer；无关包文件逐 SHA 保持原字节。不能用本地整包覆盖线上其他历史差异。
- R2 缺制造商初始票位，原 P1 计数仅验证减法，initialRemainingTickets 保持 null。重试或审核不增加 observedAt；同 lineage 兼容版本可延续原关联，hard conflict 转人工纠错。
- 账号删除先设置全地图读屏障，之后有界清理本账号支持。这个安全策略有可用性代价；需要逐条确认并另行解除屏障，worker 不自动恢复。
- 定时触发事件字段不足以证明调用来源。候选同时要求平台 env 与可信 invocation environment；真实 CloudBase timer context/事务并发尚未验证，不能凭本地 fixture 开启。

## 验证与限制

| 验证 | 结果 |
| --- | --- |
| Phase2 bridge tests | 36/36 PASS，含真实V1 finalize/note-review/delete钩子事务fixture |
| Full regression | 1176 PASS / 1 existing SKIP；104 suites PASS / 1 existing suite SKIP |
| Lint / typecheck / contracts / workflow | PASS |
| Next.js build / Playwright | PASS / 26 of 26 PASS |
| ZIP/file SHA + V1 无关远端文件保持 | 7 of 7 PASS |
| 实际打包 runtime 合成演练 | 5 of 5 PASS：direct、draw更新/delete/迟到、私有历史skip、多人支持、crash恢复 |
| wx-server-sdk 4.0.2 本地入口ABI | 7 of 7 PASS；3新入口关闭态smoke PASS，4既有V1仅加载不调用 |
| 新资源/函数只读preflight | 4新集合ABSENT、3新函数ABSENT；Phase1 9函数ENABLED=false |
| Live SDK transactions/concurrency / trusted timer / production client / real history | NOT_RUN，待明确外部动作与启用前验收 |

最终保护检查：[final-protection-and-secret-scan.json](../../artifacts/task22/phase2/final-protection-and-secret-scan.json)。本轮138个文件和110个ZIP内文件实际secret扫描匹配0；1199个受保护历史输入漂移0。只扫描当前Phase2交付、五份事实源及完整tracked Git diff，不据此宣称历史暴露事件已修复。验证汇总见 [verification-summary.json](../../artifacts/task22/phase2/verification-summary.json)。

本地 ABI 已在 Node v20.19.5 + wx-server-sdk 4.0.2 验证；目标平台为 Nodejs20.19。CloudBase 原V1依赖层保留，本地 Ajv 仅用于加载入口验证，不代表远端依赖层重新部署。合成数据通过不代表真实用户历史有授权。生产 terms 与 public location policy 仍未绑定；不得默认授权或直接开启。

## 七个候选部署包

| 函数 | 动作 | ZIP SHA-256 |
| --- | --- | --- |
| manage-map-player-source | CREATE | `d3f0f2db694a2aff59b5ae9ab486af97078fe9ff3d444241d55e459940f6e938` |
| process-map-source-bridge | CREATE | `a696389b4340a8b4030ad24779387ce410e021507a104276b2cf975791bdb6d5` |
| drain-map-source-bridge | CREATE | `61b36e486a6600f5548518d6db34ce9874b3aa296d4d866791aba34bade2312d` |
| finalize-board-observation | UPDATE_CODE | `dba4987fc2296a5857adca9d8b30e89f09580808e995b49ea0c6928cdb9a5fb0` |
| recognize-draw-tickets | UPDATE_CODE | `3a11eca07b1bd5ebe74468de8ab7281e6e439cb8dd5eae68891c785116997342` |
| delete-my-record | UPDATE_CODE | `19c30fe3f7c9a322565382495c57a37b0514134d88e56f1e110d961ee19b466e` |
| delete-my-account | UPDATE_CODE | `a449f0e48467c7f26532ad4fb94f6c4c2a7ac78e6fc2e430973fce6226058d5b` |

manifest：[artifact-manifest.json](../../artifacts/task22/phase2/artifact-manifest.json)。三个新函数 ENABLED=false；四个 V1 仅准备 producer=false 的最小候选，保持各自既有 runtime、timeout、memory、role、网络、层、权限、trigger 与所有旧secret bindings。身份 key 未轮换。

## 精确回滚

| V1函数 | 当前远端原始 ZIP SHA-256 |
| --- | --- |
| finalize-board-observation | `63b88f73f6c13caa7a37d2a77bfbfc748c7409a5f57e185754261941083b746d` |
| recognize-draw-tickets | `6fcf19cc99a8289639128f2aaad1d1aa8fdd7865063bd8abb416c021e67209c1` |
| delete-my-record | `65435cd6cc279b5d8eb4158a21a503ce6fda81c778f3a12a559f4273c0dd3a21` |
| delete-my-account | `8489423b5f553ea484f7c6cd8ac8d824fdd3e30570e361b490f120999767aa0a` |

真实回滚包及脱敏元数据：[cloud-readonly-preflight.json](../../artifacts/task22/phase2/cloud-readonly-preflight.json)，ZIP 位于 artifacts/task22/phase2/remote-rollback/。下载地址未记录，现有secret值未输出或保存。发布前必须重新检查远端 ZIP/config；已漂移时重新审阅，不覆盖后来合法更新。

## 下一批最小外部动作

仅审阅 [minimum-external-action-batch.json](../../artifacts/task22/phase2/minimum-external-action-batch.json)：`PHASE2-A-RESOURCE-ONLY`。四个新集合，全部ADMINONLY；四个明确非TTL索引；mapSourceBridgeControl/global:bridge 一行 producer/processor/ownerEntry 全 false、locationPolicy=null。共13个声明动作；业务行与public新增0。

本批不部署函数、不生成/绑定secret、不设置timer、不修改既有control、不迁移历史、不启用服务。batch SHA-256：`9e303fba542249e319f77ab9897bcc6d8af739edcba1e37e54c78e79ffee1d3e`。批准后必须fresh preflight→逐动作apply→逐项read-back；首个非预期差异/失败停止并报告精确partial state，不自行删除已创建资源。

后续另行审阅：3新函数disabled CREATE + 4 V1最小UPDATE_CODE及producer=false配置；一个CLOSE timer；source bridge新key仅内存生成、绑定worker/drain两处，owner entry复用既有identity/authority两处，不轮换旧key。控制/条例/数值位置policy/client绑定/真实历史清单/生产开启各取明确批准，不捆绑为资源批次默认权限。

## 部署、启用与恢复顺序

1. 审核资源批次后只创建闭合资源，核对ACL/索引/1control行/业务0，保存回执；Phase1 9包、V1结构、shadow safe-stop保持。
2. 单独批准七包SHA及secret逻辑bindings；先保存fresh远端四包/config，部署新函数disabled，再更新四个V1最小钩子producer=false；逐SHA/配置回读与关闭态smoke。保持当前V1平台设置，不套用新函数配置。
3. 只创建CLOSE timer；按腾讯[CreateTrigger](https://cloud.tencent.com/document/api/583/18589)初始关闭规范。timer真实来源依据参考[官方触发器文档](https://staticintl.cloudcachetci.com/doc/pdf/product/pdf/583_9206_zh.pdf)，但候选可信context合同须在真实平台单独验证；不能设置固定TRIGGER_SRC环境变量来绕过。
4. 经明确授权进行受控真实平台fixture事务/并发/失败与timer/client伪造演练，确认95操作budget、atomic outbox和实际SDK行为。fixture与业务域隔离，不凭本地ABI标记live PASS。
5. 在批准terms/scope与APPROXIMATE数值policy、production Account authority、初始分享选择客户端服务端接入后，逐记录历史只读预览。没有适用权限即SKIP；历史批次批准前真实迁移0。
6. 开启顺序必须另批：充分核对后设置closed窗口内policy/bridge control，启用worker/对应resolver/projector，再最后开启V1 producer和timer；公共读取仅在完整流水线与撤回/删除/read-back通过后恢复。不能留下producer=true而control/resources不可用的配置，否则原V1事务会安全回滚。
7. 停止/回滚：先全局read-stop并提高epoch，停timer、关闭V1 producer，再停新worker/owner入口。必要时按单独批准恢复四个真实原始ZIP及原配置；Phase1九包未修改。新集合保留ADMINONLY/tombstone/receipts，不删数据或恢复旧PublicMapLead，不解除账号删除屏障。修复后从当前source重新核验，再按explicit REPLAY产生新revision。

TASK22与Phase2尚未完成真实部署/历史/平台验收。Phase3及NETWORK、50/300、正式发布仍LOCKED。
