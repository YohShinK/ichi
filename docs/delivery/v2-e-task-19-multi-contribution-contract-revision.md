# TASK-V2-19｜多贡献者合同修订（本地候选）

> 2026-09-28 后续验证：V1 草稿左滑 Playwright 8 次 3 PASS / 5 FAIL，V1 执行路径与 HEAD 一致；依 Founder 本轮门禁将该既有 flaky 测试列为 accepted exception，详见 [独立 trace 报告](v2-e-task-19-local-validation-flake-acceptance.md)。本轮触及文件 Prettier、workflow、diff-check PASS；下方 `LOCAL_VALIDATION_BLOCKED` 为当时快照，当前 gate 为 `MULTI_CONTRIBUTION_AND_LINEAGE_LOCAL_READY / EXTERNAL_ACTION_APPROVAL_REQUIRED`。

日期：2026-09-28。阶段：`MULTI_CONTRIBUTION_AND_LINEAGE_LOCAL_VALIDATION_BLOCKED`。此报告描述源码和本地测试，不构成 CloudBase 或真机验收。

## Pre-state 与废止合同

既有 candidate 提案把 `publicLeadId` 视为单个 owner 的资源，在 `v2ShadowContributionAuthority` 上使用 `owner:<publicLeadId>`、`ACCEPT/WITHDRAW` 和第二次地图发布状态。Founder 已冻结“上传时选择分享”即公开意图；旧提案及其 zip 不得部署。现有远端仍为此前六函数、九 collection、15 显式 index 的 shadow candidate；本轮未做远端 read-back，不把历史 `V1_DIFF=0` 冒充本轮证据。

## 修订后的合同与文件

- `memory-bank/design-document.md` 先记录新产品语义；`memory-bank/tech-stack.md`、`architecture.md`、`implementation-plan.md`、`progress.md` 同步技术、结构及 Gate。
- `packages/v2-map/src/contribution-projection.ts`：仅以 `ACTIVE + eligible + SHARE` 的逐上传贡献支撑同一 BoardInstance；按服务端 `observedAt`/版本选择最新合法备注；同一主体只显示一次 public-safe 头像，缺失时使用安全默认头像；不同 BoardInstance 不合并。
- `packages/v2-map/resources/shadow-functions/shared/contribution-ledger.mjs`：基于已验证 synthetic fixture 和可信 upload 激活逐条贡献；ledger 有不可逆删除 tombstone 与 `auditVersion=1` 的事件；不从 lead ID 推导 owner。
- `.../v2-shadow-manage-contribution/runtime.mjs`：服务端 `getWXContext()` 主体只能 `LIST_MY_UPLOADS`、`DELETE_MY_UPLOAD`；删除本人原始 upload/contribution 后重算同板其他有效贡献，最后一个删除时先隐藏公开版本、增加 read epoch、排入重投影；跨账号失败，重复命令幂等。
- `.../v2-shadow-reconcile-projection/runtime.mjs`、`.../shared/public-read.mjs`、`packages/v2-map/src/{projector,public-api}.ts`：投影和 detail 返回有效贡献者集合、最新安全备注；迟到事件和 tombstone 不复活删除项。
- `apps/client/miniprogram/pages/home/index.{ts,wxml,wxss}` 与 `platform/{public-map-contract,public-map-wire-adapter,public-map-presentation}.ts`：移除旧二次授权入口和状态，只显示上传事实/删除；既有信息卡内叠加有限头像并显示 `+N`，可见数量由 presentation 参数配置，未冻结产品 N 值；备注来自后端安全投影。LIST、独立详情、可提交举报、lead 专属分享和机会 chip 继续不可达。
- 旧 `public-map-authorization-*` 本地候选文件移除；旧 proposal/报告加 `SUPERSEDED_DO_NOT_DEPLOY`；新机器合同及七包见 [exact diff](v2-e-task-19-candidate-resource-exact-diff-v2.md)。

`packages/v2-map/src/authorization.ts` 中的早期 reference 类型作为历史研究代码仍存在，但没有进入七个候选包或正式小程序的 candidate runtime；其 `WITHDRAW` 不构成当前可调用产品动作。

## 本地验证与缺口

`contribution-projection.test.ts` 覆盖多人、同板、重复主体/版本、最新备注回退、安全头像/null；`shared/projector-persistence.test.mjs` 覆盖 A+B 同 lead、独立删除、最终退休和 no-resurrection；`v2-shadow-manage-contribution/runtime.test.mjs` 覆盖本人列表、A/B 隔离和重复删除；小程序 `index.v2-contribution-lineage.test.ts` 覆盖旧授权 UI 不可达。项目范围 Vitest 为 987 passed/1 skipped（排除工作树外实验目录的 Node 专用文件）、项目脚本范围 ESLint、root/Web TS、Next build、微信 CLI preview 和包体审计通过；七包静态校验见 exact diff。无范围限制的 Vitest/ESLint 扫描拾取实验与历史产物而失败。Web Playwright 全量 25/26，未改动的 V1 草稿左滑测试在独立复跑仍失败；全仓 Prettier 受 47 个既有生成文件/历史产物阻断。不能据此标记所有本地门通过。生产上传与 V2 同源桥、CloudBase 正向及真实设备仍未验证。

## 影响、Git 与下一门

本轮 external writes=`0`；V1 collection/function/index/config/Storage/trigger/ACL mutation=`0`，V1 private record read=`0`。本轮没有重新进行 V1 云端 baseline read-back，因此不能声明“本轮 V1_DIFF=0”。工作树含既有大量未提交变更及本轮改动；未 commit/push/PR/merge/tag。当前 `TASK-V2-19 = IN_PROGRESS / MULTI_CONTRIBUTION_AND_LINEAGE_LOCAL_VALIDATION_BLOCKED / EXTERNAL_ACTION_APPROVAL_REQUIRED`，未 COMPLETE/HUMAN_APPROVED/FROZEN，TASK20 未开始。下一步先解决 Web Playwright 门并重跑；随后 Founder 需按新 exact diff **单独**批准两个 collection、三个 index、两个新函数、五个更新函数、函数级 config 与一把新 shadow-only HMAC secret，方可考虑云端执行。此次未请求或执行该授权动作。
