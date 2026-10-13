# TASK-V2-19｜Candidate runtime 前后端缺口与本地实现

日期：2026-09-28。状态：`IN_PROGRESS / CANDIDATE_RUNTIME_BINDING_BLOCKED / EXTERNAL_ACTION_APPROVAL_REQUIRED`。本报告承接 [55 项 runtime routing 审计](./v2-e-task-19-runtime-routing-matrix.md)，只描述本地代码与只读 preflight；**无 CloudBase 写入、部署或真实小程序正向验收**。

## Pre-state / inspected surfaces / Founder 决策

审计前正式地图 query/detail、授权、举报为本地 synthetic；HA disabled。Founder 现确认保留已批准单地图/单信息卡交互：LIST 切换、独立 expanded detail、可提交举报在本阶段**不可达**；机会 chip 缺公开权威字段，暂时停用。旧报告中的“等待 UI 决策”已由此回复解除，不能再将这些不可达路径当正向 PASS。已检查 WXML/TypeScript、地图/Marker/聚合/信息卡/授权/HA/分享/上传链路及现有 shadow query、detail、get-my、answer、projector、resolver。

## Files changed / 前端实现

- `apps/client/miniprogram/platform/public-map-candidate-service.ts` 与测试：develop/trial 才调用固定 query/detail shadow 函数；release/未知 env fail closed；严格校验 schema、requestId/generation、公开字段与私有字段禁入，延续现有分页、cursor 与 late-response client。
- `human-assistance-candidate-service.ts` 与 `human-assistance-client.ts`：本人 pending request 由真实 get-my 服务端返回，使用 server-derived `candidateRecordRef` 和 observation version，不把 V1 recordId 当 shadow 身份；四类回答传至既有 answer 函数。no-request/过期/已答/撤回/version changed 由服务端与客户端共同拒绝。HA 错误不改变 V1 upload success。
- `public-map-authorization-candidate-service.ts`：status/accept/owner command 指向待批准新函数；解析 server snapshot/capability，不能把本地模拟当成功。`pages/home/index.ts` 改为实例化三类 candidate service；举报 service 切换为 fail closed。WXML 隐藏机会 chip，已批准的地图卡/Marker/cluster/picker 结构未变。
- synthetic services 仍为单元测试 fixture；当前 page 没有实例化它们。正式 release 的三个 candidate adapter 均不发 CloudBase 请求。现有 V1 上传、识别、本人记录功能维持原服务。
- 本地集成核对修复一个 P1：旧 `ACCEPT` 幂等键把包含 `+` 的 scope digest 拼进键，候选服务端会拒绝。客户端现在只以受服务端验证的授权版本组成稳定键，并增加实际格式回归；候选授权 adapter 同时保留服务器 `UNAUTHORIZED/INVALID_REQUEST/ACTION_NOT_ALLOWED` 错误码。

## 后端本地实现 / resource diff

- 更新本地 `v2-shadow-get-my-assistance`：通过 `getWXContext()` 主体、HA request、当前 synthetic fixture/version 校验后返回 opaque candidate record/version；不读取 V1 identity/profile。
- 更新本地 `v2-shadow-reconcile-projection`：要求版本一致的 server-side consent，持久写 owner capability，拒绝其他 owner 覆盖和 deleted resurrection。
- 新增本地 `v2-shadow-manage-contribution`：可信主体只由 `getWXContext()` + 既有 principal HMAC + 测试 allowlist 派生。`GET_STATUS`、`ACCEPT` 和 owner `WITHDRAW/DELETE` 使用新的 server-only ledger；接受时为本人已处理的当前 synthetic history 补 outbox（最多 20 条，超限 fail closed）；撤回事务先把所有命中的公开 lead 版本设为 HIDDEN，再发 outbox；删除保留 no-resurrection tombstone，重复 command 返回 duplicate。
- 机器可读 proposal 为 `packages/v2-map/resources/cloudbase-candidate-runtime-resource-proposal.json`。精确新增 1 collection、1 index、1 function、更新 2 function，三包 SHA-256、config/secret/cost/rollback 在 [exact cloud diff](./v2-e-task-19-candidate-resource-exact-diff.md)。所有新 flag 初始 false、caller allowlist 空；不冻结 HA cooldown/budget 产品数值。

## External writes / tests / failures

CloudBase writes=0：没有 create collection/index、deploy function、config/secret 写入、synthetic data、migration rehearsal、rollback 或 cleanup。没有读取/复制 V1 private records；没有 V1 resource mutation。只读 preflight 见 exact diff；本轮未重新跑完整 V1 baseline diff，故不能报告本轮 `V1_DIFF=0`。此前 final-closeout 的 `V1_DIFF=0` 是历史证据。

最终本地验证：root/Web TypeScript PASS；ESLint PASS；全量 Vitest `97 passed / 1 skipped` 文件、`998 passed / 1 skipped` 测试；新贡献函数 Node 测试 5/5 PASS；合同与 workflow PASS；Next production build PASS；Web Playwright 26/26 PASS；微信 CLI preview PASS，1,008,183 bytes；包体审计 `devOrFixtureCount=0`，sourceBytes=1,325,563，距 2 MiB 门 771,589 bytes；`git diff --check` PASS。三份确定性 zip 的哈希、打包源码一致性、allowlist、fail-closed、禁 V1 function/Storage、禁动态 collection PASS。首次微信 preview 因 `/tmp` 二维码输出路径被 CLI 判为无效而失败；改用仓库 `artifacts/task19/candidate-routing/` 后预览成功，未上传正式版本。小程序用户视觉/真机验收仍需 Founder 实测，不能用 CLI 编译代替。

## Remaining blockers / current gate

1. 新增 collection/index/function 与两函数更新须 Founder 对 exact diff **单独批准**，之后才能 cloud apply/read-back/rehearsal。当前远端四 flag=false、allowlist 空，正常正向 CloudBase 数据路径无真机证据。
2. 授权 `history=true` 的本人当前 synthetic fixture 本地补 outbox 已实现，但仅限 20 条并未 CloudBase read-back；旧/撤回/未关联 fixture 不被伪发布。正式 V1 上传成功态与 synthetic candidate HA 的可信同源 lineage 尚未建立；本地「我的」pending 可展示，但上传成功态不能拿 V1 recordId 伪匹配。多人贡献同一公开 lead 的 owner 语义需合同复核。上述均须在云端演练前闭合，不能把 fail-closed 算正向通过。
3. Founder 冻结为不可达的 LIST、独立 expanded detail、report submit、lead-specific share landing 不建新入口；机会 chip 保持隐藏，待后续产品决定。report backend 本轮没有新建，历史 synthetic report client 仅供测试且当前 page 无本地成功绑定。
4. 本轮尚无新的真实 A/B candidate smoke、V1 全量 read-back diff 或包体/真机验收；TASK20 仍锁定。

**Founder 下一步 exact action：审阅 [exact cloud diff](./v2-e-task-19-candidate-resource-exact-diff.md)；资源写入授权仍需独立明确发出。即使批准，也须先闭合上述本地合同缺口并重新核对三个 zip SHA-256。`TASK-V2-19` 未 COMPLETE/HUMAN_APPROVED/FROZEN，未 commit/push/PR/merge/tag/publish。**
