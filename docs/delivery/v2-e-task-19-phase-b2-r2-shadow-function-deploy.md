# TASK-V2-19｜Phase B2-R2 Shadow Function Deploy 与 Read-back

执行时间：2026-09-27；唯一目标环境：`cloud1-d7gxqfwv783a1f131 / ap-shanghai`。Founder 本轮仅批准现有六个 `v2-shadow-*` 函数更新与三把 shadow-only HMAC key 轮换／绑定。本报告记录已执行的云端动作；不表示 synthetic rehearsal 或 TASK-V2-19 验收完成。

## 1. Pre-deploy gate：PASS

独立门禁见 [Phase B2-R2 pre-deploy gate](./v2-e-task-19-phase-b2-r2-predeploy-gate.md)：canonical TASK-V2-19 的 **12 个冻结场景按原名逐项**映射到真实本地测试，缺项已补测，定向 6 文件／50 测试 PASS；Prettier、`node scripts/validate-workflow.mjs`、`git diff --check` 均 PASS；六个 zip SHA-256 分别与 B2-R1 manifest 和报告 §14 完全一致，静态 artifact validator PASS。全部门禁在云端写入前完成。

部署前只读核对：环境 ID／region 正确；六个现有函数的 B1 远端整包 `codeSha256` 与 Phase B1 报告一致，均为 `Active / Nodejs20.19 / index.main`，无 trigger／layer；9 个 shadow collection 均为 0 文档、ACL=`ADMINONLY`，15 个显式索引的 exact keys/order-or-GEO、unique、非 TTL 与冻结 resource contract 逐项一致。13 个 V1 collection／43 个索引、19 个 V1 函数、环境函数规则和 Storage 根项已建立本轮只读基线。

## 2. 六个函数代码部署与下载回读：PASS

首次对 `v2-shadow-query-public-map-leads` 的 MCP 更新调用因缺少 `functionRootPath` 在参数校验阶段失败，**无云端写入**。补入源码根目录后的调用成功，但只读下载发现工具忽略 `zipFile`、实际打包了源码目录，`runtime.mjs` 的 import 路径与批准 zip 不一致。其余五个函数当时尚未更新。四个 feature flag 仍为 false，caller allowlist 仍为空；未打开入口。

随后将六个**已通过 SHA-256 门禁的批准 zip**仅在本机解包到独立临时函数根目录，以该目录更新六个既有函数；没有修改包内代码或增加云端资源。首个函数重部署后逐文件核对通过，才继续其余五个。CloudBase 安装依赖后下载的整包包含 `node_modules`，所以整包 hash 与部署前 zip 不相同。每个下载包的批准 zip 所含 **14 个文件均逐字节一致**，且下载包 SHA-256 等于平台 `codeSha256`：

| 现有函数 | 批准 zip SHA-256（部署前） | 远端下载包／平台 `codeSha256` | 14 文件／runtime／package |
| --- | --- | --- | --- |
| `v2-shadow-query-public-map-leads` | `0e96dc89951cf425fd9f8f361f16c645c228a4f3a45f823120de4621ffc036bc` | `7ed613af2cc63be0f2d4d43401269f78d409b04c49932fb2cbcf4219dca2ecda` | PASS |
| `v2-shadow-get-public-map-lead-detail` | `7cf7f42d3d23a18fc6429b4730a0ca69bf4ce6684bfa7ccaf640b73ba542a47a` | `fe54b0219d19c5611d27209663cc71d1d164cb419e3c788e51b3d384b80314aa` | PASS |
| `v2-shadow-resolve-observation` | `95434faa8422fb4709cb9482c0037d8e171f0950b14e0225f06636f1d1d0ce34` | `6f06005522022e894de9d831707d45ffecc396894926382775efeb46e41a2fda` | PASS |
| `v2-shadow-get-my-assistance` | `b6c00fbf455a4e0b54322e0afcfaca4dca887da67f290b67c72305eeed5eea13` | `1ac84721b6e8e32c8511484ab365f7032a1cfede71ca593dbcc8bb0ba0ce4ad0` | PASS |
| `v2-shadow-answer-assistance` | `90b9ed7c91dec9385acb6d61bc5f560b28015800da411b3e979134165bc3b908` | `879a8de635c0354fa583000f5583d25307576ced7dffcb8592e4002fd3457d37` | PASS |
| `v2-shadow-reconcile-projection` | `e040c45f8663fdfcbffcf4f18d00edcd6aed8ada1199ec74aef9f66f04b6c616` | `01d146011971fc75a3e0ebe269f1ececdf22c063e18b6fb7ae079c3afb43cd65` | PASS |

六个函数最终回读均为 `Active / Available`、`Nodejs20.19`、`index.main`、目标 namespace 正确、0 trigger、0 layer。首个函数曾有一次短暂的非批准 runtime 版本，已由批准包覆盖并通过最终下载回读；该事件不被隐去或计作首次部署成功。

## 3. Shadow-only config 与 HMAC：PASS

在内存中生成并轮换三把新的高熵 shadow-only key。逐函数函数级环境变量回读，只比较本轮生成值与远端值是否一致，**不记录、不回显密钥值或摘要**：

| Secret 名称 | 最终绑定函数 | 回读 |
| --- | --- | --- |
| `ICHI_V2_SHADOW_CURSOR_HMAC_KEY` | query、detail | 存在且匹配 |
| `ICHI_V2_SHADOW_PRINCIPAL_HMAC_KEY` | query、detail、get-my、answer | 存在且匹配 |
| `ICHI_V2_SHADOW_REHEARSAL_HMAC_KEY` | resolver、projector | 存在且匹配 |

六个函数均回读 `ICHI_V2_SHADOW_BOUNDARY=synthetic_only`、`ICHI_V2_SHADOW_READ_ENABLED=false`、`ICHI_V2_SHADOW_RESOLVE_ENABLED=false`、`ICHI_V2_SHADOW_HUMAN_ASSISTANCE_ENABLED=false`、`ICHI_V2_SHADOW_PROJECTOR_ENABLED=false`、`ICHI_V2_SHADOW_TEST_CALLER_DIGESTS` 为空。HA policy、cooldown、budget 四项均未配置；候选测试参数继续标记 `CANDIDATE_TEST_ONLY / PILOT_CALIBRATION_REQUIRED`，不是产品数值冻结。

## 4. V1 frozen production boundary 与停止点

前后只读比较：13 个 V1 collection 的 43 个索引结构及 ACL 完全一致；19 个 V1 函数的完整 detail（排除每次查询自然变化的 `RequestId`）没有任何字段差异，包含代码、runtime、配置、修改时间和 4 个既有 trigger；环境级函数安全规则一致；Storage 根项 2 个的元数据一致；collection／function 名单一致。`V1_DIFF=0`。九个 shadow collection 在部署后仍均为 0 文档。

本轮云端写入**仅**六个既有 shadow function 的代码更新，以及其函数级三类 HMAC binding／默认关闭配置。没有创建 collection/index/function/trigger/layer，没有写 synthetic fixture、control row 或 production data，没有 migration rehearsal、rollback mutation、cleanup、V1 collection/function/index/config/Storage/trigger/ACL mutation，也没有调用新函数进行 rehearsal。没有 commit/push。

停止状态：`TASK-V2-19 = IN_PROGRESS / Phase B2-R2 read-back complete`，等待 Founder 下一步指令。未 `COMPLETE / HUMAN_APPROVED / FROZEN`；TASK-V2-20 未开始。后续 synthetic rehearsal、测试 caller allowlist、启用任一 flag、HA 数值配置、migration、rollback 与 cleanup 均须另行授权和验证。
