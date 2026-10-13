# TASK-V2-19｜V1 草稿左滑 Playwright 波动复核与本地门结论

日期：2026-09-28。范围仅限 TASK19 local validation blocker；没有修改 V1 业务、测试用例、Playwright 配置或 CloudBase。

## 测试复跑

先前全量 Web Playwright 为 `25 passed / 1 failed`，唯一失败为 `apps/web/tests/v1-26.spec.ts:816` 的 `unverified local drafts can be swipe-deleted from both ledgers`。本轮执行：

```text
cd apps/web
pnpm exec playwright test -g 'unverified local drafts can be swipe-deleted from both ledgers' --workers=1 --repeat-each=8 --retries=0 --trace=on --output=../../artifacts/task19/local-validation-flake-traces
```

结果：**8 次中 3 次通过、5 次失败**。第 1 次失败在第二条记录的删除按钮点击：Playwright 报告 `.ichi-swipe-content` 拦截 pointer event，最终 60 秒超时；第 2、4、5、8 次失败在第一条草稿滑动后 `data-swipe-open` 仍为 `false`；第 3、6、7 次完整通过。失败不是固定重现，不能把全量回归写成 PASS。抽查通过与失败 trace，第一条滑动的 `mouseMove(361,462) → mouseDown → mouseMove(275,462, steps=6) → mouseUp` 坐标与步骤相同；差异发生在页面接收／处理该手势和后续可点击状态，符合时序敏感的 flaky 行为。该观察不能代替 V1 真机手势验收。

八个 `trace.zip` 均保存于 `artifacts/task19/local-validation-flake-traces/`：目录后缀为无 `repeat`、`repeat1`、…、`repeat7`，对应第 1—8 次；通过的第 3、6、7 次分别为 `repeat2`、`repeat5`、`repeat6`。失败目录同时保存 `error-context.md`。trace SHA-256 依次为：

| 次数 / 结果 | trace 目录后缀 | SHA-256 |
| --- | --- | --- |
| 1 / FAIL | 无 repeat | `0daf8b13121b7fd2bcba0ffa1bdbaea9c7d6a30dce178753b0edc63684114907` |
| 2 / FAIL | `repeat1` | `d8fd088597cafe73cf1dce4f28f7e43c03591ce24235811b005b829060824746` |
| 3 / PASS | `repeat2` | `3364ac2d1033c93ff2d0cd00c6ddb5304441d3ce9bd3d5cbe02ca3827e9ee3d4` |
| 4 / FAIL | `repeat3` | `376b4381f97b95272779fc38c1942d89a35f91998ff813bcb126553eb63c499d` |
| 5 / FAIL | `repeat4` | `cb005ff683a4bff2f10fbde2e19a8af2afd6b88e9db756b7c54c76737f56b6d9` |
| 6 / PASS | `repeat5` | `fd5b52a3d17d43466fd2cb93bc024a7463f6660099e021e8983a3a92a20781d0` |
| 7 / PASS | `repeat6` | `fddeee39cb0f6af15fb64a9c10126a424d2b90df03569c6a44e274020718cbed` |
| 8 / FAIL | `repeat7` | `7e267fc9510235a9716fcf6c6a7473497173f078fcb0adbd43f2063cbb8149cf` |

## 本轮 V2 diff 对该路径的影响

`git hash-object` 与 `git rev-parse HEAD:<path>` 逐项一致：

| V1/Web 路径 | 工作树与 HEAD 相同的 Git blob |
| --- | --- |
| `apps/web/app/api/v1-29-source/route.ts` | `3267ba6193aad9a09a64a92eaab5d21d0dd02275` |
| `apps/web/tests/v1-26.spec.ts` | `ed5e785f9f97bab437a70dcc38c76c2e4c79eb72` |
| `apps/web/playwright.config.ts` | `ef6dc06bc8d0306c94f3f8f94865eb20a23b63e5` |
| `apps/web/package.json` | `18fbe7580bc2a2552049758158545d1ae0bc4e46` |

`git diff --name-only -- apps/web` 仅有生成缓存 `tsconfig.tsbuildinfo`；`pnpm-lock.yaml` 唯一差异是新增空的 `packages/v2-map` workspace importer，没有 Web 依赖版本变动。V1/Web 页面与测试代码没有从 `packages/v2-map` 或小程序 candidate 代码导入运行时模块。此前 TASK19 runtime routing 审计也记录过同一 Web Playwright 套件 `26/26` 通过；本轮相同 V1 文件可通过也可失败。因此本轮 V2 源码差异对**这条 V1 草稿左滑执行路径**的直接影响为 0，可将该项记为 `ACCEPTED_PRE_EXISTING_V1_PLAYWRIGHT_FLAKE`。这不是 V1 左滑功能本身的合格结论，也不掩盖本次 5 次失败；V1 手势若要独立收口应另行处理。

## TASK19 local gate 与停止点

按 Founder 本轮限定，Prettier 仅核对本轮触及的源码、候选合同和报告；不格式化既有 generated/history 文件。项目脚本范围 ESLint、root/Web TypeScript、987 passed/1 skipped 的项目范围 Vitest、合同/workflow、Next build、微信 CLI preview、包体审计、七个 zip 的 hash/allowlist/fail-closed 静态校验及 `git diff --check` 维持此前 PASS。上述 Web Playwright 项作为明确记录的 accepted pre-existing flake，不写为 PASS。最终 scoped Prettier `PASS`（本轮源码／合同／报告路径），`node scripts/validate-workflow.mjs` `PASS`（8 required files），`git diff --check` `PASS`，七包静态 validator `PASS`。未批量格式化既有 generated/history 文件。

本轮 CloudBase mutation=`0`、V1 业务代码变更=`0`、commit/push/PR/merge/tag=`0`；没有新 CloudBase read-back，不能以此报告声称本轮 `V1_DIFF=0`。三项本地门已 PASS，停止在 `TASK-V2-19 = IN_PROGRESS / MULTI_CONTRIBUTION_AND_LINEAGE_LOCAL_READY / EXTERNAL_ACTION_APPROVAL_REQUIRED`。Founder 下一步仍需按 [exact cloud diff v2](v2-e-task-19-candidate-resource-exact-diff-v2.md) 单独批准：2 collection、3 index、2 新函数、5 更新函数、默认关闭配置及 1 把新 shadow-only HMAC secret；本轮不执行任何一项，不开始 TASK20。
