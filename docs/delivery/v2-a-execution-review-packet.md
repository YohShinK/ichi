# ICHI V2-A Execution Review Packet

> `HISTORICAL V2-A APPROVAL EVIDENCE / SUPERSEDED FOR CURRENT STATUS BY docs/delivery/v2-b-closeout-review.md / NOT EXECUTABLE`

> Date: 2026-09-10；external-evidence preparation updated 2026-09-11
>
> Block: `V2-A`
>
> Status: `COMPLETE / HUMAN_APPROVED`
>
> Production implementation: `NOT_STARTED`

> `V2_A_HUMAN_REVIEW_APPROVED = YES`
>
> `V2_A_FINAL_CLOSEOUT_ENTERED = YES`
>
> `V2_A_PLAN_UPDATED = YES`
>
> `V2_A_HOT_START_MODEL_SYNCED = YES`
>
> `V2_A_TASKS_AWAITING_REVIEW = NO`
>
> `V2_A_EXTERNAL_EVIDENCE_PENDING = NO`
>
> `V2_IMPLEMENTATION_STARTED = NO`

## A. Scope result

- TASK-V2-01—03 已完成自动验证并获用户人工批准；2026-09-11 iOS、Android 与腾讯位置服务控制台三项外部证据均由用户确认 PASS。
- 2026-09-11 区块认知对齐后 V2-B 已解锁；当前 TASK-V2-04—07=`COMPLETE / HUMAN_APPROVED`，TASK-V2-08=`READY / NOT_STARTED`；TASK-V2-09—22 与 V2-C—E 保持 `LOCKED / NOT_STARTED`。
- 未修改生产小程序、网页 runtime、packages、Cloud Functions、数据库、Storage、R2、API 或 production config；测试号恢复后地图验证完全位于独立 spike，未 upload／publish／deploy。
- 未 commit、push、PR、deploy、migration、upload、publish 或 tag。
- V1 frozen truth 和 V1.0.1 publication truth 未改变。

## B. Deliverables

| Task | Deliverable | Automated status | Manual gate |
| --- | --- | --- | --- |
| 01 | `docs/research/v2-a/v2-information-expression-model.md` + 10 fixtures | PASS | `CONTINUE / HUMAN_APPROVED` |
| 02 | `docs/research/v2-a/v2-data-source-verification-freshness-lifecycle.md` | Unified source/verification/freshness/seeding design PASS; production aggregate and seeding execution NOT RUN | `CONTINUE / HUMAN_APPROVED` |
| 03 | `docs/research/v2-a/v2-platform-geo-cost-package-spike.md` + `spikes/v2-a-map-device/` | Docs/synthetic/package/isolated harness/simulator/iOS/Android/腾讯控制台 PASS | `COMPLETE / HUMAN_APPROVED` |

## C. Verified evidence

- Expression scenarios: 10; levels=`HIGH/MEDIUM/LOW/INSUFFICIENT`; null/zero and prohibited-copy checks PASS.
- Fixture SHA-256: `d97518500ba03bdda9f816208a2baa92bf62f9a1ed3fecc5045eac7b2e6016b9`.
- Synthetic viewport: 30/1,000/10,000 points produced 5/108/1,013 matches; server limit returned 5/50/50; payload stayed 417/3,915/3,981 bytes.
- V1 package preflight: 908,347 bytes，2 MiB gate PASS；独立 spike 不在 V1 `miniprogramRoot`，package delta=0。
- `corepack pnpm quality`: PASS; 57 test files / 571 tests plus lint, typecheck, contracts and workflow.
- `node scripts/validate-workflow.mjs`: PASS.
- `corepack pnpm format:check`: PASS.
- `git diff --check`: PASS.
- Hot-start contract static check: PASS；四类 Source、`NOT_VERIFIED/VERIFIED`、单区域约 20 条、三阶段 seeding、非持续自动采集和 22 个任务状态均一致。
- V2-A final closeout state check（进入区块切换前）：PASS；当时 TASK-V2-01—03 已人工批准、V2-A 已完成，TASK-V2-04—22 与 V2-B—E 仍锁定；随后状态由本 packet 的 Scope result、V2-B entry packet 与 TASK-V2-04 review packet 覆盖。
- Independent map harness：12 个必需文件、30 Shanghai synthetic markers、production/Storage connections=0、V1 package delta=0、static validation 与 `wcc/wcsc` compile PASS。测试号下 simulator 已显示腾讯地图和 30 个实际可见的 PNG markers、有效 viewport、READY、generation=1/discarded=0，Problems=0；SVG marker 不渲染与 map event-loop 两项问题均已修复并在关闭／重开后复验。最终 bytes/hash 见平台报告。
- Production small-program/business/API/backend/CloudBase/DB/Storage/R2/config diff：`0`；允许的新增只位于独立 `spikes/v2-a-map-device/` 与 evidence 文档。

## D. Explicit evidence gaps

1. `EXTERNAL_USER_N=0 / LOWER_CONFIDENCE`: TASK-V2-01 只完成内部合同与合成理解检查，真实用户复验留到 TASK-V2-21。
2. `NOT_RUN_NO_SAFE_AGGREGATE_INTERFACE`: TASK-V2-02 没有连接生产私有集合；V1_HISTORY 数量、年龄、字段完整度和 Candidate Venue 分布为 UNKNOWN。
3. `INITIAL_DATA_SEEDING_NOT_EXECUTED`: NETWORK_SOURCE 当前只有三阶段计划；尚未选择单一区域、采集约 20 条样本或写入数据库。这不是生产实现。
4. 设备型号、系统／微信版本和逐项截图未在对话中提供；本轮只记录用户整体 human attestation，不伪造元数据。

这些保留项不会把 30/10/14 重新变成 V2-A 完成条件，也不推翻用户的 `Continue` 方向决定。EDG 已由 TASK-V2-04 按 contract-ready、lower-confidence 或 downstream-contract-pending 分层审阅；TASK-V2-04 已 `COMPLETE / HUMAN_APPROVED`。

## E. Approved decisions

- TASK-V2-01：用户批准 `Continue`；采用 Dynamic Board Opportunity Map 信息表达模型、Verified/Opportunity/Freshness 三层结构、reason codes 与 Freshness 方向。具体生产阈值或 PASS mapping 仍未批准。
- TASK-V2-02：用户批准 `Continue`；采用四类 Source、`NOT_VERIFIED/VERIFIED` 统一验证和 NETWORK_SOURCE 三阶段 Initial Data Seeding。NETWORK_SOURCE 仅用于初始化导入，不是上线后的持续自动采集系统。
- TASK-V2-03：用户批准 `Continue`，并确认 iOS、Android 与腾讯位置服务控制台验收 PASS；采用微信原生 `<map>` 负责基础地图，腾讯位置服务 key 只用于 POI／地址解析等扩展服务。

## F. Human decision record

2026-09-10 已收到 TASK-V2-01—03 的 `Continue`；2026-09-11 又收到 TASK-V2-03 三项外部证据 PASS。V2-A 最终收口完成。随后用户明确授权 V2-A → V2-B 认知同步与解锁，批准 Adjusted V2-B Execution Plan、TASK-V2-04 D04-01—08、D04-A1 BoardInstance Addendum、TASK-V2-05 D05-01—09 与 TASK-V2-06 D06-01—10 最终调整；TASK-V2-07 Location Model 合同已进入人工验收，TASK-V2-08 未开始，09—22 仍锁定。

## G. Hot-start model

- 核心数据源：ICHI 自有数据库。
- 统一模型：`Source + ICHI Verification + Freshness`，来源仅用于溯源。
- 地图前置：所有展示数据必须 `VERIFIED` 且通过 Public Eligibility。
- NETWORK_SOURCE：固定显示“网络来源”，不得伪装为 ICHI 用户上传。
- Initial Data Seeding：阶段 1 单区域约 20 条完整链路验证；阶段 2 人工批准后扩大一次性采集；阶段 3 导入处理后的统一数据并进入发布流程。
- 上线后：不运行 NETWORK_SOURCE 持续自动采集；如未来需要，必须新开 Gate 和人工批准。

## H. V2-B handoff knowledge

2026-09-11 区块切换前确认：ICHI V2 是版面机会情报地图，不是传统地图找店。主链路为 `BoardObservation → Verification → VerifiedBoard → OpportunityEvaluation → FreshnessEvaluation → Public Eligibility → Public Projection → PublicMapLead → 微信原生 <map>`。

微信原生 `<map>` 只负责地图渲染和 viewport 状态，marker 数据只来自 ICHI Map Query API 对自有 `PublicMapLead` 的 bounded query。地图打开后不依赖腾讯地点搜索／POI。腾讯位置服务降为 Optional Location Enhancement；用户确认的约 200 次／日地点搜索额度不阻塞 MVP。

Venue/POI 不再是核心实体。上传核心为拍摄／观察位置、版面信息和可选 `venueNote`；Public Location 需经独立 precision/consent/privacy 投影。该认知已传播到 V2-B TASK-V2-04—08，详见 `docs/delivery/v2-b-entry-review-packet.md`。
