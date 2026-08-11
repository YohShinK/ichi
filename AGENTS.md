# ICHI Agent Guidance

本项目使用 `vibe-coding-standard-workflow`。经用户明确授权，本项目将 Skill 默认的“单 step 人工门禁”调整为“区块人工门禁”：step 仍是细小、可验证的工作单元，V1-A、V1-B 等区块才是解锁、读写、联动和人工验收单元。此调整只作用于本项目，不修改 Skill 本身。`memory-bank/` 是长期事实源；历史 PRD、NeoPRD 和 Product Atlas 只作为研究资料，不再承担开发门禁。

## 开始任务

1. 非代码问答可先读取 `memory-bank/progress.md`，再按问题读取相关文档。
2. 写任何代码前必须完整读取：
   - `memory-bank/architecture.md`
   - `memory-bank/design-document.md`
   - `memory-bank/tech-stack.md`
   - `memory-bank/implementation-plan.md`
   - `memory-bank/progress.md`
3. 从 `progress.md` 确认当前唯一活动区块和区块内工作集；没有活动区块时，不自行解锁任何区块。
4. 只执行活动区块内的 step。区块内所有未完成 step 均可读写、互相引用并按依赖串行、交错或并行推进；不得实现后续锁定区块的产品能力。

## 产品与技术来源

- 产品范围、行为、边界和验收：`memory-bank/design-document.md`。
- 技术选择与平台边界：`memory-bank/tech-stack.md`。
- 区块顺序、step 范围、自动验证和区块验收：`memory-bank/implementation-plan.md`。
- 当前活动区块、区块内工作集和验证记录：`memory-bank/progress.md`。
- 已存在文件和职责：`memory-bank/architecture.md`。
- `PRD.md` 是便于人阅读的产品总览；发生冲突时以 design document 为准。
- `docs/references/`、`docs/methodology/`、`product-atlas/` 和 `canvas/` 是历史与研究资料，只有用户明确要求或正式文档引用时才读取。

## 执行与验收

- 用户默认是当前区块的人工验收门；用户明确授权时，Agent 才能代为完成端到端验收。
- 每个 step 必须完成自己的自动验证；自动验证通过后记为 `AWAITING_REVIEW`，但不会锁住同一区块的其他 step。只有区块内全部 step、区块级回归和人工验收通过后，才能解锁下一区块。
- 活动区块内可以使用同区块尚待人工验收的中间产物，但必须在 `progress.md` 标明其状态；锁定区块不得把这些产物当作已批准基线提前实施。
- 开放区块即同步开放为该区块服务的正式事实源和共享文件读写。权限按变更目的判断，不按文件路径冻结：产品行为先更新 `design-document.md`，技术选择先更新 `tech-stack.md`，真实结构同步更新 `architecture.md`，步骤与状态同步更新计划和 `progress.md`。
- 区块人工验收后，将本区块产生的已确认新认知简记到 `progress.md`；讨论中但未确认的想法可作为本区块工作假设，不得作为后续区块的已批准计划输入。
- 解锁下一区块前，Agent 自动执行一次“区块认知对齐”：比较已确认新认知与下一区块全部 step 的目标、输入、产物、依赖和验收，不要求用户手工逐步对照。
- 若无影响，整组解锁下一区块；若只是局部调整且不改变产品范围、平台、隐私、核心架构或区块顺序，Agent 只修改下一区块并告知用户后继续；若出现上述实质变化，Agent 暂停执行并提交精简修订供用户批准。
- 不批量改写远期区块；已知的远期影响只在 `progress.md` 留下目标区块和原因，解锁该区块前再处理。
- 产品行为变化先更新 `design-document.md`，再更新受影响的实施步骤。
- 技术选择变化先更新 `tech-stack.md`，重大文件职责变化同步更新 `architecture.md`。
- 重要结构变化发生时立即更新 `architecture.md`；step 状态和验证结果随时写入 `progress.md`。当前区块通过后，先完成两者的区块收口记录，再等待下一条指令或解锁下一区块。
- `implementation-plan.md` 只写任务、验证和验收，不写代码片段。
- 不自动提交或推送 Git；只有用户明确要求时执行。

## 浏览器与联网工具选择

- 通过终端、代码、API、专用联网工具或其他非浏览器界面方式查询信息时，可直接使用最合适的工具，不要求经过浏览器。
- 自 2026-08-11 起，用户负责 ICHI 网页的人工视觉检查；Agent 不再主动使用 `ego-browser` 或其他浏览器控制工具进行自动视觉验收。代码任务仍执行 Playwright、类型检查、Lint、构建和工作流校验等非人工视觉回归。
- 只有用户在后续指令中明确要求 Agent 实际打开、查看或操作浏览器界面时，才使用 `ego-browser` 及其对应 skill。
- 不得使用 Chrome 或 `chrome:control-chrome` 执行上述浏览器界面操作；即使 Chrome 中已有标签页或登录状态，也不得以此替代 `ego-browser`。

## 完成检查

- 文档或治理任务完成前运行 `node scripts/validate-workflow.mjs`。
- 代码任务还必须执行相关 step 指定的自动验证、Next.js 构建、真实浏览器测试和／或必要的平台适配验证，并在区块末尾执行集成回归。

## 重要提示

- 写任何代码前必须完整阅读 memory-bank/@architecture.md
- 写任何代码前必须完整阅读 memory-bank/@design-document.md
- 每完成一个重大功能或里程碑后，必须更新 memory-bank/@architecture.md
