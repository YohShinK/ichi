# TASK-V2-19 Phase B2 Synthetic Rehearsal｜执行前阻断记录

日期：2026-09-27。环境：`cloud1-d7gxqfwv783a1f131 / ap-shanghai`。本报告记录 Phase B2 的实际执行边界；**本轮尚未完成 synthetic rehearsal**，不得据此进入 `AUTOMATED_GATES_PASS`。

## 1. Phase、Task 与目标

`TASK-V2-19 / Phase B2` 的目标是在现有 shadow boundary 内，仅用 synthetic/rehearsal data，真实验证 CloudBase transport、BoardInstance resolution、Human Assistance、projection、public query/detail、failure injection、migration rehearsal 与 rollback drill。V1 production private records 与既有资源保持冻结。

## 2. 开始前状态

Phase B1 已创建 9 个 `v2Shadow*` collection、15 个显式 index、6 个 `v2-shadow-*` function。2026-09-27 只读回读显示 6 个函数均 `Active / Available`，全部四个 `*_ENABLED=false`，`BOUNDARY=synthetic_only`，测试 caller allowlist 为空，三个 HMAC key 仅确认相关函数中存在，未读取或回显其值。9 个 shadow collection 各取 `_id` 最多 1 条的只读检查均返回 0 条。

## 3. 实际修改文件

- 新增本报告。
- `memory-bank/progress.md` 增记 Phase B2 执行前阻断与证据。

本轮未修改小程序、V1 服务、六个已部署函数的源码或 artifact。

## 4. 实际 CloudBase 写操作

**0 项。**没有写 fixture、测试名单、HA policy、cooldown、budget、feature flag、secret、collection、index、function code、snapshot、projection 或 V1 资源。只执行只读资源回读，以及六次在开关关闭状态下的函数调用探针。

## 5. Synthetic fixtures

生成数 `0`，云端写入数 `0`。12 个场景的最小确定性 fixture 尚未进入实际 CloudBase 演练。

## 6. 测试 caller 与 HA policy

测试 caller allowlist 仍为空。HA policy/cooldown/budget 仍未配置；将来的测试值只可标记为 `CANDIDATE_TEST_ONLY / PILOT_CALIBRATION_REQUIRED`，不得冻结为产品参数。HMAC secret 仅记录存在状态，不在报告中记录值或摘要。

## 7. 12 个 BoardInstance 强制场景

| # | 场景 | 云端实测 |
| --- | --- | --- |
| 1 | 同板连续 Observation 唯一安全延续 | 未执行 |
| 2 | 换箱/换套不错误延续 | 未执行 |
| 3 | 同店不同版面不 merge | 未执行 |
| 4 | 同店两张同款版面不按位置 merge | 未执行 |
| 5 | 长期 AMBIGUOUS 保持不确定 | 未执行 |
| 6 | 后续证据自动消歧 | 未执行 |
| 7 | SAME_BOARD / DIFFERENT_BOARD / CANNOT_TELL / SKIP | 未执行 |
| 8 | HA budget / cooldown / once-per-upload | 未执行 |
| 9 | late/stale 不覆盖新状态 | 未执行 |
| 10 | retired/deleted/withdrawn 不 resurrection | 未执行 |
| 11 | `null != 0` | 未执行 |
| 12 | Location 仅生成 candidate，不作为 identity truth | 未执行 |

本地 reference/integration 测试不能替代上述远端结果。

## 8. Human Assistance

四类回答、once/budget/cooldown、跨账号 A/B、重复点击幂等与 hard conflict 的 **真实 shadow 后端测试均未执行**。本地 `human-assistance-client` 与页面 behavior 定向测试包含上传成功态和「我的 → 我上传的版面」入口、actionable-only、状态安全消失、duplicate submit，以及失败/跳过不影响 V1 upload success；这仍是 disabled local service，不是 CloudBase transport 通过证明。

## 9. GEO / unique / index

Phase B1 已对 15 个显式 index（含 GEO/unique）完成创建 read-back。本轮未插入 synthetic 行，因此 GEO 命中、unique 冲突与查询计划的真实行为未实测。

## 10. Projector / outbox / retry

未执行。已部署的 `v2-shadow-reconcile-projection` 当前只读查询并返回 `REHEARSAL_READY`，没有 projection 写入、outbox 状态推进、retry 或 hide-first 实现。

## 11. Migration rehearsal

未执行。未运行 synthetic fixture → shadow private authority → BoardInstance/association → projection → public read model，故幂等、部分失败恢复及 rollback 后重跑均无远端证据。

## 12. Failure injection

未执行。没有制造部分失败、迟到结果、版本冲突或重试路径。

## 13. Rollback drill

未执行 shadow row hide / snapshot invalidation 等变更。四个开关原本就是 `false`；六个关闭态函数探针均返回相应 `SHADOW_*_DISABLED`。这只能证明默认关闭，**不能**算作真实 rollback drill，也不能证明已有公开行会被隐藏或已签发 snapshot 会失效。

## 14. Public/private leakage

远端数据为空、读入口关闭，因此未观测到 private data 泄漏；`PRIVATE_LEAKAGE=0` 的完整跨账号/真实传输验收**未完成**。代码审计发现 `get-my-assistance`、`answer-assistance` 和 public read 函数使用请求体 `event.callerDigest` 与允许名单匹配，未从可信 CloudBase 身份上下文验证该主体；仅检查 principal HMAC key 的**存在性**，未验证签名。开启这些函数会让调用者冒用已允许的 digest，不能安全进行 A/B 负测。

## 15. V1 baseline diff

本轮 agent 对 CloudBase 的 mutation 为 0。只读回读为 22 collection（13 V1 + 9 shadow）、25 function（19 V1 + 6 shadow）；13 个 V1 collection ACL 均仍为 `ADMINONLY`。与 `/tmp/ichi-task19-v1-readonly-baseline.json` 中 Phase B1 前的只读快照比较：13 个 V1 collection 的 43 个 index 名称、字段顺序、方向、unique、TTL **逐项 0 diff**；19 个 V1 function 的 `ModTime`、`CodeSize`、runtime、trigger count **逐项 0 diff**。Phase B1 完整基线见 `v2-e-task-19-shadow-resource-diff.md` 第 9 节。本轮尚未重做 V1 函数配置值、环境规则、Storage 根项的完整逐项比较，故**不能把本次部分回读写成 Phase B2 完整 `V1_DIFF=0` Gate**。

## 16. 测试、构建与质量

- `task-v2-19-layered.integration.test.ts`、`human-assistance-client.test.ts`、`index.behavior.test.ts`：3 文件 / 99 测试通过。
- `scripts/validate-v2-shadow-artifacts.mjs`：通过；该校验显式要求六个 artifact 无数据库写操作，因此不证明 B2 功能完备。
- 六次远端关闭态函数探针：均 `InvokeResult=0`，业务响应均为 `ok=false / SHADOW_*_DISABLED`。RequestId：query `f1f4dd47-0ecd-40b3-a8d4-d807e1533204`；detail `d8f986fd-47ec-477b-bb4b-256d0bfdc097`；resolve `23efab50-fc51-4e8b-a53b-aac0d74508c2`；get HA `0521f099-a88e-46d9-8a54-9fdac8319f5b`；answer HA `828044a2-e486-4591-ab25-7210a790f143`；projector `5b5e826b-e1c5-4296-ae5c-268d31b230ee`。
- 根/Web TypeScript：通过。全量 Vitest：88 文件通过、1 文件跳过，952 测试通过、1 测试跳过；这属于本地回归，不是远端 B2 演练。
- `node scripts/validate-workflow.mjs`、本报告与 `progress.md` 的 Prettier、`git diff --check`：通过。
- 全仓 ESLint：未通过，7 项均位于此前 Phase B1 已存在的六个只读 artifact `require()` 写法和 `scripts/validate-v2-shadow-artifacts.mjs` 的无用转义；本轮未改这些文件。未来函数更新本地验证需一并清除这些问题。
- V1 专项回归、CloudBase 完整 read-back 未执行；不能冒称 B2 自动门通过。

## 17. P0 / P1

`P0 = 1`：当前身份/签名校验只看客户端给出的 digest 和 secret 是否存在，开启 HA 或 read flag 后存在跨账号冒用风险。`P1 = 至少 1`：六个已部署 artifact 是只读骨架，无法完成本轮真实写入、迁移、回滚。其余缺陷数待真实演练后评估；`P0=0 / P1=0` 目标尚未达到。

## 18. 未完成项与风险

Phase B2 文件的允许动作包括**调用已部署的六个函数**，未列出更新部署它们。当前已部署实现没有 `.add()`、`.update()`、`.set()`、`.remove()` 或等价 mutation；resolve 返回 `REHEARSAL_READ_ONLY`，answer 仅回显接受类型，projector 返回 `REHEARSAL_READY`。继续写 fixture 或开启 flag 不能完成 12 场景，反而扩大同环境 V1 production boundary 的风险。因此执行停在安全前置核验，没有写 synthetic data 或启用任何入口。

## 19. 当前 Gate

`TASK-V2-19 = IN_PROGRESS / PHASE_B2_PREFLIGHT_BLOCKED`。尚未 `IMPLEMENTED / AUTOMATED_GATES_PASS / AWAITING_FOUNDER_REVIEW`，也未 `COMPLETE / HUMAN_APPROVED / FROZEN`。TASK-V2-20 未开始。六个 shadow 函数仍默认关闭，九个 shadow collection 保留且为空；无 cleanup、commit、push、PR、merge 或 tag。

## 20. 下一步需 Founder 确认的具体动作

需单独确认 Phase B2 是否允许**仅更新部署现有六个 `v2-shadow-*` 函数**，以补齐可信 caller/capability 校验、持久 resolver/HA/projector/public read、幂等与 rollback；更新前须先给出新 artifact、SHA-256、静态 allowlist 与本地测试证据。若不授权函数更新部署，则本轮无法按现有 Phase B2 命令完成真实演练；可保留本报告为阻断记录。两种路径都不得触及 V1 或开启现有不安全的 HA/read 入口。
