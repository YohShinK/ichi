# ICHI Architecture

> 本文件只记录真实存在的文件和职责，不把计划目录写成已实现架构。

## 当前状态

仓库目前是产品与工程规划项目。没有应用代码、依赖清单、构建产物、云环境或部署配置。

## 当前核心结构

```text
AGENTS.md
PRD.md
README.md
memory-bank/
  design-document.md
  tech-stack.md
  implementation-plan.md
  progress.md
  architecture.md
docs/
  delivery/
  methodology/
  references/
product-atlas/
canvas/
scripts/
  validate-workflow.mjs
```

## 文件职责

| 路径 | 当前职责 |
| --- | --- |
| `AGENTS.md` | Codex 的一步一验收、上下文读取和文档更新规则 |
| `PRD.md` | 面向人阅读的 V1/V2/V3 产品总览 |
| `memory-bank/design-document.md` | 正式产品行为、边界、数据与验收事实源 |
| `memory-bank/tech-stack.md` | 当前技术决策和分版本架构边界 |
| `memory-bank/implementation-plan.md` | 唯一执行顺序；每步包含自动验证和人工验收 |
| `memory-bank/progress.md` | 当前活动步骤、历史完成和验证记录 |
| `memory-bank/architecture.md` | 当前真实仓库与未来代码职责地图 |
| `docs/references/project/` | 旧 PRD 和三阶段研究原文，不直接驱动开发 |
| `docs/delivery/` | Figma、小程序和旧 Harness 交付参考 |
| `docs/methodology/` | 泛化工作流与 NeoPRD 方法论研究 |
| `product-atlas/` | 已结束的 NeoPRD/Product Atlas 实验产物，非正式需求源 |
| `canvas/` | Cowart 无限画布历史可视化资产，非正式需求源 |
| `scripts/validate-workflow.mjs` | 检查标准工作流必需文件和关键联动 |

## 已废弃的活动机制

- `memory-bank/current.json` 已归档到 `docs/references/harness/current-atlas-01.json`；
- `scripts/validate-harness.mjs` 已移除；
- Product Atlas revision 不再控制设计或代码门禁；
- Cowart 页面可以继续查看，但更新不会自动改变正式需求。

## 规划但尚未创建

只有实施计划对应步骤通过前置验收后，才允许创建：

```text
apps/client/
packages/core/
packages/session/
packages/storage/
packages/design-tokens/
packages/ui/
services/cloudbase/
tests/fixtures/
tests/e2e/
tests/visual/
docs/decisions/
docs/qa/
```

其中 `services/cloudbase/`、公共数据库和审核端不属于 V1，不能在 V2 决策门之前初始化。

## 更新规则

- 创建、移动、删除或改变重要文件职责后更新本文件；
- 只记录已发生的结构变化；
- 计划中的目录保留在“规划但尚未创建”；
- 当前步骤通过后，与 `progress.md` 同批更新；
- 重大架构选择在 `docs/decisions/` 增加决策记录。
