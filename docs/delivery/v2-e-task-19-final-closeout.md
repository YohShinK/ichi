# TASK-V2-19｜Final cleanup + closeout read-back

执行日期：2026-09-28。唯一云环境：`cloud1-d7gxqfwv783a1f131 / ap-shanghai`。本轮按 Founder 授权移除一次性测试入口、恢复一个 shadow 函数的正式可信身份路径并删除两项 enrollment-only config。**清理动作完成；TASK-V2-19 的全部技术验收未完成**，状态保持 `IN_PROGRESS / FINAL_CLEANUP_DONE_EVIDENCE_GAPS_REMAIN`。TASK-V2-20 未开始。

## 1. 正式小程序与本地清理

| 核对项 | 结果 |
| --- | --- |
| TASK18 develop 长按压力测试入口、Worst/Dense 面板、测试服务注入、force-individual override | 正式 `apps/client/miniprogram/` 源码定向搜索无命中；`scripts/audit-v2-map-package.mjs` 报 `devOrFixtureCount=0`。 |
| 正式预览编译 | 微信开发者工具 CLI `preview` PASS，包体 `1,005,810 bytes`；记录在 `artifacts/task19/final-closeout/preview-info.json`。未 upload 正式版本。 |
| 一次性 A/B 测试入口 | `tests/fixtures/v2-shadow-trusted-caller-miniapp/` 全目录已删除，不在正式小程序或仓库测试 fixture 中。 |
| 其他 synthetic/诊断代码 | 正式包仍有 V2 地图的合成服务与默认关闭的 TASK17 缩放诊断代码；它们不是 TASK18 长按压力测试注入或面板。本轮未扩展清理范围。 |

历史 TASK18/19 报告、原始记录、B2-R4 zip/manifest 与脚本保留，未删除整体 shadow candidate 资源。旧 enrollment 专项活动测试文件从当前测试集移除；新增安全回归证明即使请求携带旧 `ENROLL_TEST_CALLER` action 和旧 config 值，关闭的 HA 路径仍返回 `SHADOW_ASSISTANCE_DISABLED` 且不访问数据库。

## 2. 唯一 cloud code/config diff

- 只更新既有 `v2-shadow-get-my-assistance` 代码，使用原 B2-R1 已审核 zip：`packages/v2-map/resources/shadow-functions/artifacts/v2-shadow-get-my-assistance.zip`，SHA-256=`b6c00fbf455a4e0b54322e0afcfaca4dca887da67f290b67c72305eeed5eea13`。本地当前 `runtime.mjs` 与 `shared/security.mjs` 经部署路径改写后分别和该 zip 对应文件逐字节一致。
- 下载云端更新包，14 个源码文件与本地审核 zip 逐字节一致；云端整包 code SHA-256=`0dffc55f986d11b1f911916224960015867e46ae11399116ba28541aa7bf5b85`。`runtime.mjs` 不含 `ENROLL_TEST_CALLER`；`shared/security.mjs` 仍通过 CloudBase 服务端 `getWXContext()` 取得 APPID/OPENID，使用 shadow principal HMAC 与空 allowlist 做可信身份判定，不读取 V1 identity/profile，也不信任客户端 `callerDigest`。
- 仅从该函数的环境变量**物理删除** `ICHI_V2_SHADOW_CALLER_ENROLL_ENABLED` 和 `ICHI_V2_SHADOW_CALLER_ENROLL_EXPIRES_AT`。直接配置 API 回读为 7 个剩余 key；其 key/value 与操作前逐项一致，包括原 HMAC secret 绑定（仅比较，不回显值或摘要）。其他五个 shadow 函数代码/config 均未更新。
- 既有 9 个 shadow collection、15 个显式 index、6 个 shadow function、合成审计数据及 pending outbox 全部保留；没有删除或清理整体 candidate。没有 V1 collection/function/index/config/Storage/trigger/ACL 写入。

## 3. 完整自动回归

| 门禁 | 最终结果 |
| --- | --- |
| 全量 Vitest | 93 文件通过、1 文件既有 skip；986 项通过、1 项既有 skip。 |
| cleanup 定向安全测试 | `security.test.mjs` 5/5 PASS，含旧 enrollment action 被关闭的负测。 |
| ESLint / root + Web TypeScript | PASS。 |
| Web Playwright | 26/26 PASS。 |
| Next.js production build | PASS；第一次与 Playwright 共享 `.next` 并发运行时出现 `_document` 临时构建冲突，串行重跑通过。 |
| Shadow artifact 静态检查 | 六个历史审核包 SHA、固定 collection allowlist、V1/Storage/function-call 禁用扫描 PASS。 |
| 正式小程序包体审计 / 微信 CLI preview | PASS；`devOrFixtureCount=0`，预览包 `1,005,810 bytes`。 |
| Prettier（本轮触及的源码与报告） / workflow / `git diff --check` | PASS；另 `validate:contracts` 全部通过。 |

本轮没有把本地回归当作 R4 缺失的真实设备/远端正向路径证明。

## 4. 最终 cloud read-back

| 边界 | 只读结果 |
| --- | --- |
| Shadow 结构 | 9 collection 均存在、ACL 均 `ADMINONLY`；15 个显式 index 名称/字段/方向/unique 与 exact proposal 一致（另有平台 `_id_` 与 `_openid_1` 自动索引）。 |
| Shadow 函数 | 6 个均 `Active / Nodejs20.19 / index.main / timeout=3`、0 trigger；四个 `READ/RESOLVE/HUMAN_ASSISTANCE/PROJECTOR_ENABLED=false`，六函数测试 caller allowlist 全空；按原绑定关系确认 HMAC key 存在，不回显值。 |
| Get-my 一次性配置 | 两个 enrollment-only key 均不存在；原 7 个 key/value 完整保留。 |
| Shadow 停机控制 | `global:ha-pause.paused=true`，`global:read-stop.stopped=true`，`global:read-epoch.epoch=4`；公开 `PUBLIC=0`。 |
| V1 frozen production boundary | 13 collection、43 index 结构、13 ACL、19 function 稳定代码/配置字段及 trigger、环境级函数安全规则、2 个 Storage 根项与本轮写入前基线逐项一致：`V1_DIFF=0`。未读取 V1 业务记录。 |

六函数最终云端代码 SHA-256：

| Function | Code SHA-256 |
| --- | --- |
| `v2-shadow-query-public-map-leads` | `7ed613af2cc63be0f2d4d43401269f78d409b04c49932fb2cbcf4219dca2ecda` |
| `v2-shadow-get-public-map-lead-detail` | `fe54b0219d19c5611d27209663cc71d1d164cb419e3c788e51b3d384b80314aa` |
| `v2-shadow-resolve-observation` | `6f06005522022e894de9d831707d45ffecc396894926382775efeb46e41a2fda` |
| `v2-shadow-get-my-assistance` | `0dffc55f986d11b1f911916224960015867e46ae11399116ba28541aa7bf5b85` |
| `v2-shadow-answer-assistance` | `879a8de635c0354fa583000f5583d25307576ced7dffcb8592e4002fd3457d37` |
| `v2-shadow-reconcile-projection` | `01d146011971fc75a3e0ebe269f1ececdf22c063e18b6fb7ae079c3afb43cd65` |

## 5. TASK gate 与证据边界

Founder 在 B2-R4 指示结束测试并判断“全部通过”。历史报告 `v2-e-task-19-phase-b2-r4-trusted-caller-verification.md` 仍是该轮实际观察事实源：A/B 可信登记、双向跨账号拒绝、A 三类 HA 回答与 duplicate 已通过；`SKIP`、B 正向回答、真实小程序 public query/detail 未取得完成证据。最终 cleanup 不会补出这些远端证据，因此本报告不将 TASK-V2-19 写为 `COMPLETE / HUMAN_APPROVED / FROZEN`。若 Founder 以后要求把这些项标为技术 PASS，需要新的受控测试安排与授权；已删除的一次性登记入口不会在本轮重新开启。

当前：`TASK-V2-19 = IN_PROGRESS / FINAL_CLEANUP_DONE_EVIDENCE_GAPS_REMAIN`。`TASK-V2-20 = READY / NOT_STARTED`；不进行 migration、rollback mutation、shadow candidate cleanup、V1 mutation、正式发布、commit 或 push。
