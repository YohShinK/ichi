# TASK22 Phase1｜Production Migration Dry-run

Migration / Promotion Dry-run PASS（LOCAL_SCHEMA_API_ONLY_NO_CONTINUOUS_BRIDGE）。测试实际最终packaged production entry，不导入shadow endpoint；测试库只用于离线，独立于ZIP，事务doc-only、原子失败rollback、唯一索引模拟。真实用户records读取0、remote writes0、shadow rows migrated0。

| Scenario | Result |
| --- | --- |
| production empty initialization / safe controls / independent epoch | PASS |
| per-record plan/idempotency/no duplicate observation/contribution/source immutable | PASS |
| packaged production entry remains stopped before initialization authority | PASS |
| actual packaged resolver transaction crash/retry/resume/receipt/source preservation | PASS |
| missing consent/eligibility fail closed; no public source promotion | PASS |
| local stop-write/read/pause/epoch rollback preserves private source | PASS |


## Disposition / initialization

13 shadow集合全部KEEP_SHADOW_FOR_EVIDENCE_ONLY / DO_NOT_MIGRATE；fixtures/candidate upload/tester receipts/consent/reports/HA/projections均不可成为production authority或业务数据。未来只有单独cleanup批次可移除，不在本轮执行。14 production新集合中仅mapControlState带四条exact初始control，其他业务数据为空、PUBLIC0、flags=false/read-stop=true/HApaused=true。初始epoch1+revision0，不复制shadowepoch41；futuremigration写源/投影变化必须invalidat e epoch并更新domainrevision。

Control exact：
[
  {
    "_id": "global:read-stop",
    "kind": "READ_STOP",
    "stopped": true
  },
  {
    "_id": "global:read-epoch",
    "kind": "READ_EPOCH",
    "epoch": 1,
    "mutationRevision": 0
  },
  {
    "_id": "global:features",
    "kind": "FEATURES",
    "readEnabled": false,
    "resolverEnabled": false,
    "projectorEnabled": false,
    "ownerEnabled": false,
    "consentEnabled": false,
    "reportEnabled": false,
    "haEnabled": false,
    "haPaused": true
  },
  {
    "_id": "global:policy",
    "kind": "POLICY",
    "policyVersion": "map-production-phase1-v1",
    "projectionVersion": "map-projection-phase1-v1",
    "verificationVersion": "verification-v2-10",
    "resolverVersion": "resolver-v2-11",
    "opportunity": {
      "policyVersion": "opportunity-20260930-v1",
      "lastMaxRemaining": 12,
      "grandMinRemaining": 3,
      "highGrandRatio": 0.08,
      "lowGrandRatio": 0.03,
      "splitMinRemaining": 60
    },
    "freshness": {
      "policyVersion": "freshness-production-v1",
      "recentMaxAgeMs": 3600000,
      "agingMaxAgeMs": 86400000
    },
    "terms": null,
    "ha": null,
    "report": {
      "policyVersion": "v2-21-report-policy-1",
      "autoHideDistinctEligibleReports": 10
    },
    "publicAvatarOrigins": []
  }
]

## Phase2 readiness（schema/API only）

source-dry-run.mjs无SDK/DB/网络，纯逐记录plan gate：AUTHORITATIVE_PLAYER、CURRENT/VERIFIED/SHARE/authorization/rights，记录DRAW_RECORD或UPLOAD_RECORD，private source identity与exactSourceVersion派生稳定lineage/observation/contributionIDs。相同version重试IDEMPOTENT_NO_WRITE；tombstone后新版本TOMBSTONED_NO_WRITE；SYNTHETIC_REHEARSAL INELIGIBLE_NO_WRITE。不是V1批量reader，也不把该plan标成已经取得真实V1verification。

实际packaged resolver注入transaction crash，事务全回滚；重试同action能成功，receipt replay不重复observation/contribution/outbox，原source SHA保持 691264856489e5fee9b576da2ca1be4a45ce81f021e526ba16102bfc84de385f，after同值。缺terms/consent/eligibility不public。SOURCE删除/withdraw/minimal tombstone/lateoutbox/newaction/旧publicID不复活已在44项定向覆盖；多个owner授权与支持独立。下一Phase必须为真实P1+exactAPPROVEDsubmission的映射、版本变更、source删除、account删除、hide-first/revisionfence、crash-resume与生产权限另做验收；当前没有continuous writer或V1 pipeline hook。

local rollback先closeflags/read、pause/epoch；源保持immutable，不用“逆迁移”覆盖真实source。独立生产命名和新资源的rollback见runbook，真实rollback=NOT_RUN(未apply)。

证据：[scripts/dry-run-v2-production-phase1.mjs](</Users/cunfu/Documents/ichi 2/scripts/dry-run-v2-production-phase1.mjs>)、[packages/v2-map/resources/production/source-dry-run.mjs](</Users/cunfu/Documents/ichi 2/packages/v2-map/resources/production/source-dry-run.mjs>)、[artifacts/task22/phase1/migration-dry-run.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/migration-dry-run.json>)、[artifacts/task22/phase1/dry-run-delivery.log](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/dry-run-delivery.log>)。6 checks全PASS；mock不能替代liveCloudbase/真机/真实业务数据验收。

## 执行记录与永久证据

- Phase / task：TASK-V2-22 / PHASE_1_PRODUCTION_BACKEND_CONVERGENCE；日期 2026-10-02，Asia/Shanghai。证据 JSON 中时间为 UTC，另有本地日志时间。
- Pre-state：TASK21 COMPLETE / HUMAN_APPROVED / PRE_PILOT_PASS / CLOSED_PILOT_WAIVED_BY_FOUNDER / EVIDENCE_GAPS_ACCEPTED；TASK22 READY / NOT_STARTED / PRODUCTION_CONVERGENCE_AND_HOT_START_DIRECTION_APPROVED。
- 本轮批准来源：Downloads `ICHI_TASK-V2-22_Phase1_Production-Backend-Convergence_正式执行总命令.md`；用户明确要求执行。它批准本地实现与只读审计，未批准云端 apply。
- Authoritative inputs：[memory-bank/implementation-plan.md](</Users/cunfu/Documents/ichi 2/memory-bank/implementation-plan.md>), [memory-bank/design-document.md](</Users/cunfu/Documents/ichi 2/memory-bank/design-document.md>), [memory-bank/architecture.md](</Users/cunfu/Documents/ichi 2/memory-bank/architecture.md>), [memory-bank/tech-stack.md](</Users/cunfu/Documents/ichi 2/memory-bank/tech-stack.md>), [memory-bank/progress.md](</Users/cunfu/Documents/ichi 2/memory-bank/progress.md>), [docs/decisions/v2-production-hot-start-direction.md](</Users/cunfu/Documents/ichi 2/docs/decisions/v2-production-hot-start-direction.md>), [docs/delivery/v2-e-task-21-22-knowledge-alignment.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-21-22-knowledge-alignment.md>), [docs/delivery/v2-e-task-21-22-plan-revision.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-21-22-plan-revision.md>), [docs/delivery/v2-e-task-19-minimal-real-wechat-rehearsal-closeout.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-19-minimal-real-wechat-rehearsal-closeout.md>), [docs/delivery/v2-e-task-20-founder-final-closeout.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-20-founder-final-closeout.md>), [docs/delivery/v2-e-task-21-pre-pilot-final-closure.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-21-pre-pilot-final-closure.md>), [docs/research/v2-b/v1-backend-field-inventory.md](</Users/cunfu/Documents/ichi 2/docs/research/v2-b/v1-backend-field-inventory.md>), [docs/research/v2-b/v1-to-v2-map-field-mapping.md](</Users/cunfu/Documents/ichi 2/docs/research/v2-b/v1-to-v2-map-field-mapping.md>), [docs/research/v2-b/v2-domain-model-contract.md](</Users/cunfu/Documents/ichi 2/docs/research/v2-b/v2-domain-model-contract.md>), [docs/research/v2-b/v2-board-instance-resolution-contract.md](</Users/cunfu/Documents/ichi 2/docs/research/v2-b/v2-board-instance-resolution-contract.md>), [docs/research/v2-b/v2-lifecycle-semantics-contract.md](</Users/cunfu/Documents/ichi 2/docs/research/v2-b/v2-lifecycle-semantics-contract.md>), [docs/research/v2-b/v2-source-rights-model-contract.md](</Users/cunfu/Documents/ichi 2/docs/research/v2-b/v2-source-rights-model-contract.md>), [docs/research/v2-b/v2-location-model-contract.md](</Users/cunfu/Documents/ichi 2/docs/research/v2-b/v2-location-model-contract.md>), [docs/research/v2-b/v2-public-map-service-contract.md](</Users/cunfu/Documents/ichi 2/docs/research/v2-b/v2-public-map-service-contract.md>), [packages/v2-map/src/verification.ts](</Users/cunfu/Documents/ichi 2/packages/v2-map/src/verification.ts>), [packages/v2-map/src/opportunity.ts](</Users/cunfu/Documents/ichi 2/packages/v2-map/src/opportunity.ts>), [packages/v2-map/src/projector.ts](</Users/cunfu/Documents/ichi 2/packages/v2-map/src/projector.ts>), [packages/v2-map/src/authorization.ts](</Users/cunfu/Documents/ichi 2/packages/v2-map/src/authorization.ts>), [packages/v2-map/src/moderation.ts](</Users/cunfu/Documents/ichi 2/packages/v2-map/src/moderation.ts>), [packages/v2-map/src/public-api.ts](</Users/cunfu/Documents/ichi 2/packages/v2-map/src/public-api.ts>)。当前正式文件优先，历史 dated 状态保留为历史。
- Inspected surfaces：V1/shadow NoSQL 结构与 ACL、28 个函数配置/触发器/层、Storage 根目录元数据/规则、环境规则、源代码/客户端绑定、合同、产物、自动测试。只查询控制状态与 PUBLIC 数量；未读取真实用户版面/图片/备注/Profile 正文，未下载 Storage 对象。真实用户业务正文读取=0。
- Files changed：`packages/v2-map/resources/production/**`, `scripts/build-v2-production-phase1-artifacts.mjs`, `scripts/validate-v2-production-phase1-artifacts.mjs`, `scripts/validate-v2-production-phase1-sdk.mjs`, `scripts/dry-run-v2-production-phase1.mjs`, `docs/delivery/v2-e-task-22-phase1-*.md`, `memory-bank/architecture.md`, `memory-bank/tech-stack.md`, `memory-bank/implementation-plan.md`, `memory-bank/progress.md`, `artifacts/task22/phase1/**`。既有 728 个文件的会话 SHA 基线中仅上述四个 memory-bank 正式文件被本轮改动；design-document 和 TASK01—20/V1/client/core 保持字节一致。
- Architecture change：新增私有 source → 共享 verification/resolution/evaluation → materialized public-safe serving 的独立 production candidate；query/detail 的 V1 identities/accounts 只用于认证，绝不拼接私有版面/Profile/raw location。
- Schema/resource change：14 个 CREATE proposal / 23 个显式非 TTL index / 全部 ADMINONLY / 初始 4 control rows，其余空 / PUBLIC=0；9 个新增函数；V1_MUTATION=NONE。
- Function change：9 个本地生产 entry 与 shared security/domain/runtime；复用冻结 core 算法，无 tester allowlist/enrollment/synthetic authority；默认全部关闭。NETWORK 只冻结接口与 verification variant，正式 serving/ingestion 未实现。
- External actions：CloudBase 只读，external writes=0；无 deploy、ACL/config/secret/index/business mutation、migration、cleanup、public enable、Phase2 bridge、NETWORK 采集、50/300、Git commit/push/PR/merge/tag 或微信版本上传/审核/发布。CLI preview 成功，仅预览产物，未构成发布。SDK npm 依赖下载仅本地验证。
- Tests：新增 44 项定向 PASS；full Vitest 1140 PASS / 1 existing SKIP，103 文件 PASS / 1 SKIP；root+Web TypeScript、ESLint、contracts/workflow、Next production build、Web Playwright 26/26、WeChat CLI preview、package audit、artifact validator 9/9、Node20.19.5+SDK4.0.2 offline ABI、migration dry-run 6/6、git diff --check PASS。跳过项保留 SKIP，不算 PASS；具体日志见 closeout。
- Failures/fixes：首轮 tombstone 错误优先级、Lint 14 错误已修复；首次 Next 与 Playwright 并行共用构建目录导致 ENOENT，保留失败并串行重跑完整 Next+26 项 Playwright。SDK 事务核对后改为事务外查询、事务内 doc 复核/共享 revision/95 次预算；保留中途 V1 set 暴露断言与 race 测试包装错误日志，修复后完整回归。补齐唯一索引、有限 rate/snapshot、note 省略与缺 Profile 默认值、旧状态 hide-first、举报人数不出响应、同优先级 HA 不询问、lineage/verification policy 绑定。中断后临时 Node20 路径消失的 127 日志保留，恢复离线运行时并验证最终产物。
- Security/privacy：PRIVATE_LEAKAGE=0 / unresolved P0=0 / P1=0，限本地实现、静态和自动验证；无新增线上接受结论。未知字段默认私有，嵌套 allowlist、public avatar CDN origin 白名单默认空；私有临时头像/URL/图像/OPENID/Account/lineage/source IDs 不返回。真实 secret 值不写报告、包或日志。
- V1 regression：LOCAL_V1_RUNTIME_DIFF=0，保护源文件 SHA 对比；LIVE_V1_RESOURCE_DIFF=0 VERIFIED，13 collections/43 indexes/13 ACL/19 functions 完整稳定配置（除 API RequestId）+triggers/layers/Storage/rules，会话 pre/post 只读比对。远端完整 ZIP 未下载，不把配置/entry SHA 比对冒充远端全包 SHA 或真机行为验收。
最终收口只读复核：2026-10-02 03:39:05 Asia/Shanghai / 2026-10-01 19:39:05 UTC，86只读操作覆盖全部26collection/28function及Storage/rules；13V1/43indexes/13ACL/19完整stableconfigs、layers/triggers/rules差异0；新production资源不存在，shadowread-stop=true/HApaused=true/epoch41/PUBLIC0，CloudBasewrites=0。最新脱敏证据：[live-final-readback.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/live-final-readback.json>)、[live-final-comparison.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/live-final-comparison.json>)、[live-final-stable-config-hashes.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/live-final-stable-config-hashes.json>)。

- Cloud read-back：[artifacts/task22/phase1/live-preflight.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/live-preflight.json>)、[artifacts/task22/phase1/live-postflight.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/live-postflight.json>)、[artifacts/task22/phase1/live-v1-comparison.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/live-v1-comparison.json>)、[artifacts/task22/phase1/live-v1-stable-config-hashes.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/live-v1-stable-config-hashes.json>)；中途完整比对 2026-10-02 02:19:52 Asia/Shanghai / 2026-10-01 18:19:52 UTC。shadow read-stop=true、HA paused=true、epoch41、PUBLIC0；所有函数 enabled=false、tester allowlists 空。
- Artifact SHA：proposal SHA256 `0940d1b322566c11df46898994a87c8effea5b1fa79a261711a44eec2a345f41`；[packages/v2-map/resources/production/cloudbase-production-artifacts.json](</Users/cunfu/Documents/ichi 2/packages/v2-map/resources/production/cloudbase-production-artifacts.json>)（9 ZIP 与每源文件/包内文件 SHA；详表见 artifact-validation）。
- Git state：`feature/v2-board-map @ 929d189a06e13010e50abf4927bfec3b1ebd49fc`；初始 236 行既有 dirty/untracked 保留；未提交/推送/PR/合并。报告对本轮增量负责，不将 Git HEAD 当作用户既有 dirty 源码的基线。
- Remaining risks：Cloud SDK ABI 是离线传输替身，不是 live DB 操作验收；真实 100-operation/事务并发/延迟和费用未测，超过95调用 fail closed。共同 revision fence 有吞吐代价；Phase2 所有 source/eligibility/lifecycle writer 必须遵守。Freshness1h/1d 与 HA most-recent-unique-v1 为待审生产候选，terms/HA binding=null；publicAvatarOrigins=[]；retention/TTL 清理、NETWORK v4/30d serving、真实 delete propagation/continuous bridge、正式客户端替换、真机/平台验收未进行。Cloud cost=NOT_MEASURED / REQUIRES_ACCOUNT_BILLING_READBACK，不编造金额。
- Rollback：见 [docs/delivery/v2-e-task-22-phase1-production-rollback-runbook.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1-production-rollback-runbook.md>)；stop writes → stop reads → pause → epoch → hide → artifact/config restore → V1/source verify；本轮未真实 rollback。
- Current gate：`IN_PROGRESS / PHASE_1_PRODUCTION_BACKEND_CONVERGENCE_IMPLEMENTED / LOCAL_GATES_PASS / EXTERNAL_ACTION_APPROVAL_REQUIRED`；LOCAL_IMPLEMENTED / ARTIFACT_FROZEN / CLOUD_NOT_APPLIED / PRODUCTION_NOT_ACTIVE。TASK22 未 COMPLETE，Phase2 未解锁。
- Next Founder decision：审核 exact diff/矩阵/9 ZIP SHA/dry-run/runbook；最小下一批仅 mapControlState CREATE+ADMINONLY+kind_expiry index+4 exact safe control rows，详见冻结 batch JSON。此报告不是执行授权，未执行此批。
