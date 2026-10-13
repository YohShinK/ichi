# TASK21 OpportunityEvaluation 与三消费点恢复

2026-09-30 Founder确认当前全部截图无误，最新截图视觉门HUMAN_APPROVED；本报告中的截图视觉待审描述已由此覆盖，历史before/旧版本不恢复。该确认不替代端上交互或云端/性能/全回归/资源审批等其他门。完整范围见[视觉验收汇总](v2-e-task-21-founder-visual-acceptance.md)。

日期：2026-09-30。阶段：Pre-Pilot Closure A。状态：IMPLEMENTED_LOCAL / AUTOMATED_GATES_PASS；CLOUD_NOT_DEPLOYED，不代表云端接通或真实玩家通过。

Pre-state：recordOpportunityEvaluation只登记结果；shadow projector依赖fixture预设；Marker只level；formal chips关闭，呈现仍引用synthetic ID表。现从exact current VerifiedBoard生成deterministic、explainable、versioned五独立状态，首版policy opportunity-20260930-v1：LAST≤12，存量≥3，比例≥8%，拆套≥60，明确低证据及完整事实无正向命中回落低。null不当0、空大赏集合unknown、分母无效不判比例；没有统一分数、排名或AI。用户上传isGrandPrize直接沿用，不固定A/B/C；initialRemainingTickets、价格、ID、上传年龄不进入规则。

server src/opportunity.ts 是计算authority；projector/query/detail共用versioned policy解析，首版同version禁止改参数，query/detail只消费当前policyVersion；shadow reconcile-projection只消费current verified facts，忽略fixture.opportunity，即使预设FAIL/LOW/私有reason也不能篡改计算。绑定verifiedBoardId/version与current version；每次policy重算保留Observation/BoardInstance身份。其余公开门、多人contribution/consent、sequence/epoch/tombstone/no-resurrection未移除。

public-map-v3 query/detail均白名单投影同一primaryStatus/reasonCodes/policyVersion/evaluatedAt，旧四级字段不在公开输出；query按任何reason inclusive OR，snapshot/cursor/限额/可信身份规则保留。shadow publicCore和client candidate adapter拒绝旧level、畸形主状态、未知code、缺少有效policy/evaluatedAt。正式 public-map-discovery.ts 不再有ID映射或alias，synthetic定位适配移到tests/fixtures；home chips恢复，Marker主标签/色调、Picker所有状态、详情ICHI与展开解释均用server结果，客户端不算规则。

主要文件：packages/v2-map/src/{opportunity,verification,projector,public-api}.ts；shadow {reconcile-projection,shared/public-read,get-public-map-lead-detail}；client {contract,candidate-service,query,discovery,presentation,client}/home三文件；相关旧合同fixture/tests同步；新build/validate脚本与8包manifest独立，不覆盖历史v3。

验证：每状态正负/12-13/59-60/2-3/8%-3%/null-zero/multiple/policy重算/current version拒绝/user-defined grand集合/空集合/low可上图；真实runtime拒绝伪fixture评价；public API secondary reason OR/旧schema拒绝；原跨层privacy/分页/身份/current/迟到/删除/停机回归保留。最终Vitest1021 passed/1 skipped；TS/Lint/contracts/workflow、Next build、Web26/26、8包hash/解包import/allowlist/关闭态验证、微信正式preview和包体审计见最终门禁JSON。Web旧左滑25/26首次失败，单测复核失败后查明没有scrollIntoView；仅修测试真实gesture前置条件，单测和全套26/26通过。首次Next构建与Playwright争用.next导致失败，已串行构建通过。未改V1产品左滑逻辑。

外部动作：微信CLI preview/开发者工具状态截图；cloud只读环境/8函数元数据/shadow control/PUBLIC count preflight。target=cloud1-d7gxqfwv783a1f131/ap-shanghai；资源/代码/config/flag/allowlist/data实际写入=0，无V1管理私有数据读取，无新资源。SAFE_STOP回读成立，epoch25、8flags全false/caller空、HA pause/read-stop=true、PUBLIC=0；完整V1资源diff本轮未重跑，不把TASK20历史0冒充新回读。具体候选三个既有函数替换/ZIP SHA/rollback准备/cost边界见prepilot-candidate-exact-diff.md。旧后端仍public-map-v2，因此新客户端在部署前不会消费旧行。

Founder新真机/真实用户=NOT_RUN；Map视觉等待确认；P0/P1本地新增失败未发现，不能当实际Pilot P0/P1=0；P2 T20-P2-01本地优化实施而实际端上冷暖复测未完成，RC风险未获接受；P3未新增实测结论。Pilot protocol未批准，真实NETWORK_SOURCE route/权利/批次未批准。Rollback未做新drill，真实费用/端到端latency分布未取得。Git无commit/push/PR/merge/tag/正式upload/review/publish。TASK21仍Pre-Pilot，TASK22锁定。
