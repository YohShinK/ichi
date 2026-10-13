# TASK22 Phase1-C｜Remaining Production Resources Apply / Read-back

日期：2026-10-02（Asia/Shanghai）。`PHASE1_C_REMAINING_PRODUCTION_RESOURCES = APPLIED / READBACK_PASS`。

## Founder 授权与 pre-state

Founder 在本会话明确要求执行 Downloads 中 Phase1-C 总命令。其第1—2节授权从当前冻结 proposal 精确派生本批并继续执行，无需对新生成 batch 再次确认；仅授权 13 CREATE / 13 ADMINONLY SET / 22 explicit non-TTL index CREATE。其余写入／部署／secret／enable／业务数据／Phase2 均未授权。此前 Phase1-A 已应用，Phase1-B 已由 Founder 风险接受与豁免关闭；本轮不讨论或实施轮换。

环境 `cloud1-d7gxqfwv783a1f131` / `ap-shanghai` / NoSQL NORMAL；实例 `tnt-ate1395ci`。Pre-state：27 个既有集合、28 个既有函数，mapControlState 为 ADMINONLY / Count4，13 个目标逐一 exists=false，9 个 production 函数未部署。

## 冻结输入与 exact batch

- Proposal：[cloudbase-production-resource-proposal.json](</Users/cunfu/Documents/ichi 2/packages/v2-map/resources/production/cloudbase-production-resource-proposal.json>)；SHA-256 `0940d1b322566c11df46898994a87c8effea5b1fa79a261711a44eec2a345f41`。
- Batch：[phase1-c-remaining-collections-indexes-batch.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1c/phase1-c-remaining-collections-indexes-batch.json>)；SHA-256 `3ec4a6431151789261a3161216caa44193814cf9387d370f23596bcb83cfb918`。
- Exact-match：[batch-validation.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1c/batch-validation.json>)；13 collection CREATE / 13 ADMINONLY ACL SET / 22 index CREATE，48 写调用。逐项 frozenCollection（含 schema/documentContract）与 frozenIndex 原字段精确一致，方向按工具 string 参数表达，unique 不变；sparse=false、partial空、TTL=null 为冻结 proposal 缺省语义，回读亦一致。
- 明确排除 mapControlState 及其 kind_expiry；不写 control rows、placeholder、seed、fixture、时间戳、业务数据或 _openid；平台自动索引只记录。

## Preflight 与边界核查

完整 preflight 开始于 2026-10-02T17:58:06.689000+08:00。所有 27 个既有集合 index/ACL、28 个既有函数完整 stable config（除 API RequestId）、layers/triggers、Storage 根元数据／规则、环境函数规则与 Phase1-A 基线对比 PASS。V1 13 集合 / 43 索引 / 13 ACL / 19 稳定函数结构差异 0；43 使用既有基线口径，包含平台自动索引，不能与本次22个explicit混算。

5 个 V1 集合正常 live volume metadata 增长：accounts 119→120、auditEvents 344→345、ichiIds 120→121、profiles 119→120、wechatIdentities 119→120；Size 相应小幅增长，记录为业务活动，不触发 metadata hard stop。没有集合减少、异常清空或结构配置突变。具体 Size 和前后元数据见 [preflight-comparison.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1c/preflight-comparison.json>)。

Phase1-A 四行按 canonical 全字段逐行精确比较且SHA逐行匹配此前证据；[4行hash比较](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1c/phase1-a-control-row-hash-comparison.json>)。shadow read-stop=true / HA pause=true / epoch41 / PUBLIC0，9 个 shadow function flags 均 false、caller allowlists 全空。13 个目标独立 checkCollection 均不存在；每个 CREATE 前再次检查不存在。

## 13 个集合创建结果

| collection | CREATE | ACL | explicit indexes | Count |
| --- | --- | --- | --- | --- |
| boardObservations | PASS | ADMINONLY | 2 | 0 |
| boardInstances | PASS | ADMINONLY | 2 | 0 |
| boardAssociations | PASS | ADMINONLY | 1 | 0 |
| mapContributions | PASS | ADMINONLY | 3 | 0 |
| mapContributionConsents | PASS | ADMINONLY | 1 | 0 |
| mapProjectionOutbox | PASS | ADMINONLY | 2 | 0 |
| publicMapLeads | PASS | ADMINONLY | 3 | 0 |
| publicMapQuerySnapshots | PASS | ADMINONLY | 2 | 0 |
| mapModerationLedger | PASS | ADMINONLY | 1 | 0 |
| mapAuditEvents | PASS | ADMINONLY | 1 | 0 |
| mapAssistanceRequests | PASS | ADMINONLY | 2 | 0 |
| mapAssistanceEvidence | PASS | ADMINONLY | 1 | 0 |
| mapAccountPolicies | PASS | ADMINONLY | 1 | 0 |

## 22 个 explicit index 精确定义

| collection | index | ordered fields / direction | unique | sparse / partial / TTL |
| --- | --- | --- | --- | --- |
| boardObservations | lineage_version | kind:1, lineageId:1, sourceVersion:1 | true | false / empty / null(non-TTL) |
| boardObservations | location_current | locationKey:1, lifecycleState:1 | false | false / empty / null(non-TTL) |
| boardInstances | candidatePoint | candidatePoint:2dsphere | false | false / empty / null(non-TTL) |
| boardInstances | instance_state | lifecycleState:1, boardInstanceId:1 | false | false / empty / null(non-TTL) |
| boardAssociations | observation_version | kind:1, observationVersionId:1, decisionVersion:1 | true | false / empty / null(non-TTL) |
| mapContributions | lineageId | lineageId:1 | true | false / empty / null(non-TTL) |
| mapContributions | instance_lifecycle | boardInstanceId:1, lifecycle:1 | false | false / empty / null(non-TTL) |
| mapContributions | owner_lifecycle | ownerAccountId:1, lifecycle:1 | false | false / empty / null(non-TTL) |
| mapContributionConsents | owner_version | ownerAccountId:1, termsVersion:1 | true | false / empty / null(non-TTL) |
| mapProjectionOutbox | instance_sequence | boardInstanceId:1, eventSequence:1 | true | false / empty / null(non-TTL) |
| mapProjectionOutbox | status_createdAt | status:1, createdAt:1 | false | false / empty / null(non-TTL) |
| publicMapLeads | public_point | publicLocation.point:2dsphere | false | false / empty / null(non-TTL) |
| publicMapLeads | lead_kind_version | publicLeadId:1, kind:1, servedVersion:1 | true | false / empty / null(non-TTL) |
| publicMapLeads | public_lifecycle | kind:1, lifecycleState:1 | false | false / empty / null(non-TTL) |
| publicMapQuerySnapshots | expiresAt | expiresAt:1 | false | false / empty / null(non-TTL) |
| publicMapQuerySnapshots | snapshotId | snapshotId:1 | true | false / empty / null(non-TTL) |
| mapModerationLedger | lead_kind | publicLeadId:1, kind:1 | false | false / empty / null(non-TTL) |
| mapAuditEvents | createdAt | createdAt:-1 | false | false / empty / null(non-TTL) |
| mapAssistanceRequests | owner_state | ownerAccountId:1, state:1 | false | false / empty / null(non-TTL) |
| mapAssistanceRequests | observationVersionId | observationVersionId:1 | true | false / empty / null(non-TTL) |
| mapAssistanceEvidence | requestId | requestId:1 | true | false / empty / null(non-TTL) |
| mapAccountPolicies | accountId | accountId:1 | true | false / empty / null(non-TTL) |

每个 index CREATE 后单独读取定义，并比较当前全部 explicit indexes；每个集合 ACL 回读与全部 index 回读通过、Count0 后才进入下一个集合。13 个集合均有平台正常自动生成 `_id_`、`_openid_1`，共26个；不计入22个 explicit indexes、不删除。14个production集合总物理索引51 = 23 explicit + 28 platform automatic。

## 每次写入回执与 RequestId

串行 apply：2026-10-02T18:03:24.004000+08:00 → 2026-10-02T18:04:17.517000+08:00。外部写调用精确48次，全部成功：13 CREATE + 13 ACL + 22 index CREATE。业务／身份／control row 写入0，secret／function／trigger／layer／Storage／rules 变更0。

| seq | collection | action / index | outcome | CloudBase RequestId |
| --- | --- | --- | --- | --- |
| 1 | boardObservations | CREATE collection | SUCCESS | f74fbb57-38ba-4222-8da7-52dd896b7223 |
| 2 | boardObservations | ACL ADMINONLY | SUCCESS | 18137766-4980-44bc-ac76-6dd150a02db0 |
| 3 | boardObservations | CREATE lineage_version | SUCCESS | 7fa99571-cc60-4f64-8fc6-837f88ea5c7e |
| 4 | boardObservations | CREATE location_current | SUCCESS | ea42e627-23a3-4c83-95ce-d8c547fb8c8c |
| 5 | boardInstances | CREATE collection | SUCCESS | 93f518e4-2e94-4305-a2bd-448b8a512859 |
| 6 | boardInstances | ACL ADMINONLY | SUCCESS | d69583a7-6f49-43d5-afe9-3c6338997d5d |
| 7 | boardInstances | CREATE candidatePoint | SUCCESS | 44231e02-eed1-4e8a-9010-f8c4161c5380 |
| 8 | boardInstances | CREATE instance_state | SUCCESS | 55b62edc-e782-4342-a53b-88080373424e |
| 9 | boardAssociations | CREATE collection | SUCCESS | 2498acb3-c2ef-4842-9739-d2601e8cab41 |
| 10 | boardAssociations | ACL ADMINONLY | SUCCESS | 47c600c3-8d37-460c-a2d3-9605fa6fc8c8 |
| 11 | boardAssociations | CREATE observation_version | SUCCESS | 157a2751-2d9a-4084-8113-be1b9c2fb7da |
| 12 | mapContributions | CREATE collection | SUCCESS | f4d44199-9bc7-44e8-94ae-d262995822f5 |
| 13 | mapContributions | ACL ADMINONLY | SUCCESS | 69b14388-2f2d-4627-89bb-7352dadb03eb |
| 14 | mapContributions | CREATE lineageId | SUCCESS | f037447a-3e78-488a-922b-5752740a68a4 |
| 15 | mapContributions | CREATE instance_lifecycle | SUCCESS | b052bbce-b7f0-4c68-8a20-b5955f35d96d |
| 16 | mapContributions | CREATE owner_lifecycle | SUCCESS | 915172df-da36-4351-887c-47912e3f4933 |
| 17 | mapContributionConsents | CREATE collection | SUCCESS | 0c03d5a2-1462-467b-8876-2803af6fff0f |
| 18 | mapContributionConsents | ACL ADMINONLY | SUCCESS | 7d23835c-5f01-474f-86ec-899b95dd97fe |
| 19 | mapContributionConsents | CREATE owner_version | SUCCESS | e13b33ae-fcd7-4e94-b99b-1f0d215bbd59 |
| 20 | mapProjectionOutbox | CREATE collection | SUCCESS | a6e45cf6-52c2-4ba1-be55-633c6426c1a2 |
| 21 | mapProjectionOutbox | ACL ADMINONLY | SUCCESS | be90041d-0727-4d6e-9ebc-826ee6b5e8a5 |
| 22 | mapProjectionOutbox | CREATE instance_sequence | SUCCESS | af7a69a3-0fc8-403f-b1c6-fa603082a77b |
| 23 | mapProjectionOutbox | CREATE status_createdAt | SUCCESS | b273c743-34c3-4756-8731-d6aff4af86c7 |
| 24 | publicMapLeads | CREATE collection | SUCCESS | 9df60af5-67ba-4931-a06f-b5a998a45e00 |
| 25 | publicMapLeads | ACL ADMINONLY | SUCCESS | cf6c07e6-da46-4f11-b19b-ecaac495cca9 |
| 26 | publicMapLeads | CREATE public_point | SUCCESS | d21155bc-7e91-4375-b24d-e04e1720f9e8 |
| 27 | publicMapLeads | CREATE lead_kind_version | SUCCESS | f354fb09-fecc-4e8e-9f40-c82c88d7d788 |
| 28 | publicMapLeads | CREATE public_lifecycle | SUCCESS | 5fb0c9c9-13c3-41c9-ab27-ff705c138a6b |
| 29 | publicMapQuerySnapshots | CREATE collection | SUCCESS | 81f86d5b-602f-47c7-9594-76203a105e57 |
| 30 | publicMapQuerySnapshots | ACL ADMINONLY | SUCCESS | 4c81aca5-a505-420a-b0b8-670aa367fdc3 |
| 31 | publicMapQuerySnapshots | CREATE expiresAt | SUCCESS | 33fbedec-30ce-4560-9fff-1a091b6e179e |
| 32 | publicMapQuerySnapshots | CREATE snapshotId | SUCCESS | a4ed479a-9a48-4534-bb35-385ba9b4e662 |
| 33 | mapModerationLedger | CREATE collection | SUCCESS | 7348af8a-f1e5-47e6-97e5-d166328a10da |
| 34 | mapModerationLedger | ACL ADMINONLY | SUCCESS | 79ee893a-b4a4-4750-823a-9d24a450c98e |
| 35 | mapModerationLedger | CREATE lead_kind | SUCCESS | 951e3662-d4ec-4887-94e3-0ff3f5897d36 |
| 36 | mapAuditEvents | CREATE collection | SUCCESS | 8b6dfdfb-5a43-456c-959a-9040d478bc6b |
| 37 | mapAuditEvents | ACL ADMINONLY | SUCCESS | 188bfbd3-87b4-459c-a7cd-59bb64a454df |
| 38 | mapAuditEvents | CREATE createdAt | SUCCESS | 412ec2ab-b1fb-439b-93ab-8087faec4e48 |
| 39 | mapAssistanceRequests | CREATE collection | SUCCESS | bedf2a65-77dc-4502-8083-543c5ea86c6f |
| 40 | mapAssistanceRequests | ACL ADMINONLY | SUCCESS | 7a0ffe20-5b2b-4966-81a5-4b8841ea4024 |
| 41 | mapAssistanceRequests | CREATE owner_state | SUCCESS | 3b274cb7-8031-4f6e-8d88-4ff3b05f604c |
| 42 | mapAssistanceRequests | CREATE observationVersionId | SUCCESS | e22f27de-51c9-4548-81e4-2c23caaf7149 |
| 43 | mapAssistanceEvidence | CREATE collection | SUCCESS | 035afe51-efb8-4d60-a182-2e3b4cf97018 |
| 44 | mapAssistanceEvidence | ACL ADMINONLY | SUCCESS | 17bbcf8d-de5e-4bff-a71c-2160ff9d6c98 |
| 45 | mapAssistanceEvidence | CREATE requestId | SUCCESS | f2b161b3-3ad6-4957-8be4-0583775e89cd |
| 46 | mapAccountPolicies | CREATE collection | SUCCESS | 8f271929-403c-4efd-8f2d-e54eeb9b6db7 |
| 47 | mapAccountPolicies | ACL ADMINONLY | SUCCESS | 28db40b2-3360-42fe-9739-85c0e065bba2 |
| 48 | mapAccountPolicies | CREATE accountId | SUCCESS | 8965c227-444a-4aab-a86b-06f437c424a2 |

完整回执及精确请求参数：[apply-receipts.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1c/apply-receipts.json>)；每次另存 receipt-01.json…receipt-48.json。每个集合的即时回查：[collection-completion.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1c/collection-completion.json>)。只读请求记录：[read-request-ledger.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1c/read-request-ledger.json>)（共293次管理工具读取尝试，含未发出有效云API的输入校验失败；不是底层 Cloud API 请求数）。

## Apply 后完整 Read-back

完整 postflight 开始于 2026-10-02T18:04:45.770000+08:00，117次管理工具只读调用，无错误。最终总集合40（原27+本轮13），既有函数28，production functions=0/9 DEPLOYED。

| result | read-back |
| --- | --- |
| production collections | 14/14 APPLIED |
| production explicit indexes | 23/23 APPLIED（本轮22，Phase1-A kind_expiry 1） |
| production ACL | 14/14 ADMINONLY；本轮13/13 |
| 13 business collections | 全部Count0 / business rows0 |
| mapControlState | Count4 / four full rows unchanged / kind_expiry exact / ADMINONLY |
| V1 | 13 collections / 43 indexes / 13 ACL / 19 full stable function configs；V1_STRUCTURAL_DIFF=0 |
| existing resources overall | 全部27既有集合结构及28既有函数配置/layers/triggers不变 |
| Storage / environment rules | 根元数据、规则及环境函数规则与基线一致 |
| shadow | read-stop=true / HA pause=true / epoch41 / PUBLIC0 / all flagsfalse / caller allowlists empty |
| production safety | read-stop=true / flagsfalse / haPausedtrue / epoch1；PUBLIC0 / PRODUCTION_SERVICES_ENABLED=false / NOT_ACTIVE |
| Phase2 | LOCKED / NOT_STARTED |

完整证据：[live-postflight.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1c/live-postflight.json>)、[postflight-comparison.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1c/postflight-comparison.json>)。V1 Count/Size 为记录项，postflight 与本轮 preflight无变化；不声称所有真实业务行内容已逐条比较。

## Secret handling、失败与重试

本轮未请求明文 secret 输出；完整函数配置仅在工具内存瞬时计算旧 full stable SHA 比较，落盘仅布尔结果、非secret flags及层/触发器定义；不新增真实密钥值或密钥摘要，不生成／绑定／轮换密钥。`RISK_ACCEPTED_BY_FOUNDER / SECRET_UNCHANGED / ROTATION_WAIVED` 保持；明文暴露事件仍 CONFIRMED / NOT_REMEDIATED。

partial apply=false；写入失败0；写入重试0；自动cleanup/rollback0。Preflight曾有2次function-rules查询输入校验失败（getResourcePermission要求resourceId），改用只读listResourcePermissions后规则匹配；这不是失败写入或CREATE重试。比较器曾有3类归一化假阳性：EnableOverrun位于BillingInfo、Phase1-A index/ACL基线位于target、shadow基线是字段投影；修正取值／投影后实际结构diff0，并在任何云写入前通过preflight。初始诊断保留于 [preflight-comparator-diagnostics.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1c/preflight-comparator-diagnostics.json>)，不把比较器错误伪装成云资源被修复。

## 自动验证、回滚和 Git

Production artifact validator PASS（9包）；production resource/schema/API contract dry-run PASS（6项、无remote access）；batch/resource exact-match及live resource validator PASS。workflow validator与git diff --check均PASS；836个受保护本地文件中仅四份指定事实源变化，生产源、design-document、历史报告、冻结proposal/batch/9包未变，48个回执逐请求参数及RequestId全部精确匹配本批。完整记录：[local-verification.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1c/local-verification.json>)。没有本轮full Vitest/Playwright/真机地图/public query positive smoke；Phase1 closeout 的完整回归仅为历史证据。

回滚边界：本轮仅新增空 ADMINONLY 集合/index，无消费者和业务数据；任何删除、drop index或rollback须Founder另行明确授权。本轮不自动回滚、清理或删资源，也不复用/重跑已消费batch；后续动作必须重新preflight。已有dirty工作树保留，无Git commit/push/PR/merge/tag、微信上传审核发布。

Git：`feature/v2-board-map @ 929d189a06e13010e50abf4927bfec3b1ebd49fc`。生产代码、V1身份schema/index/13consumers、客户端和design-document未修改。

## Current gate 与停止点

`TASK-V2-22 = IN_PROGRESS / PHASE_1_PRODUCTION_BACKEND_CONVERGENCE_IMPLEMENTED / LOCAL_GATES_PASS / EXTERNAL_ACTION_APPROVAL_REQUIRED`。本轮子状态 APPLIED / READBACK_PASS，授权已消费；不能写 Phase1 COMPLETE、TASK22 COMPLETE、PRODUCTION ACTIVE、HUMAN_APPROVED 或 Phase2 UNLOCKED。

下一建议：**Phase1-D｜9 Production Functions Deploy + Disabled-State Read-back/Smoke**。本命令不授权Phase1-D，完成Phase1-C后已停止；不部署函数、绑定secret、启用服务、写数据或进入Phase2/NETWORK/50/300/client release。
