# ICHI Agent Guidance

本项目使用 `vibe-coding-standard-workflow`。`memory-bank/` 是长期事实源；历史 PRD、NeoPRD 和 Product Atlas 只作为研究资料，不再承担开发门禁。

## 开始任务

1. 非代码问答可先读取 `memory-bank/progress.md`，再按问题读取相关文档。
2. 写任何代码前必须完整读取：
   - `memory-bank/architecture.md`
   - `memory-bank/design-document.md`
   - `memory-bank/tech-stack.md`
   - `memory-bank/implementation-plan.md`
   - `memory-bank/progress.md`
3. 从 `progress.md` 确认当前唯一活动步骤；没有活动步骤时，不自行选择下一步。
4. 一次只执行 `implementation-plan.md` 中的一个步骤，不提前实现后续步骤。

## 产品与技术来源

- 产品范围、行为、边界和验收：`memory-bank/design-document.md`。
- 技术选择与平台边界：`memory-bank/tech-stack.md`。
- 步骤顺序和每步验收：`memory-bank/implementation-plan.md`。
- 当前进度和验证记录：`memory-bank/progress.md`。
- 已存在文件和职责：`memory-bank/architecture.md`。
- `PRD.md` 是便于人阅读的产品总览；发生冲突时以 design document 为准。
- `docs/references/`、`docs/methodology/`、`product-atlas/` 和 `canvas/` 是历史与研究资料，只有用户明确要求或正式文档引用时才读取。

## 执行与验收

- 用户默认是当前步骤的人工验收门；用户明确授权时，Agent 才能代为完成端到端验收。
- 自动测试通过不等于步骤完成。用户确认前不得开始下一步。
- 产品行为变化先更新 `design-document.md`，再更新受影响的实施步骤。
- 技术选择变化先更新 `tech-stack.md`，重大文件职责变化同步更新 `architecture.md`。
- 当前步骤通过后，先更新 `progress.md` 和 `architecture.md`，再等待下一条指令。
- `implementation-plan.md` 只写任务、验证和验收，不写代码片段。
- 不自动提交或推送 Git；只有用户明确要求时执行。

## 完成检查

- 文档或治理任务完成前运行 `node scripts/validate-workflow.mjs`。
- 代码任务还必须执行当前步骤指定的自动验证、H5 测试和／或微信开发者工具验证。

## 重要提示

- 写任何代码前必须完整阅读 memory-bank/@architecture.md
- 写任何代码前必须完整阅读 memory-bank/@design-document.md
- 每完成一个重大功能或里程碑后，必须更新 memory-bank/@architecture.md
