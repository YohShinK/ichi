# ICHI 极简联动 Harness 使用说明

> **已归档。** 项目自 2026-08-05 起改用 `vibe-coding-standard-workflow`。当前使用说明见根目录 `README.md`、`AGENTS.md` 和 `memory-bank/progress.md`；本文只保留旧机制的设计记录。

## 1. 它解决什么问题

Harness 是项目的导航与门禁系统。它让 Agent 在每次任务中只读取真正相关的内容，同时保证产品定义、设计和代码不会互相脱节。

你不需要先研究文件目录再下指令。日常使用方式仍然是直接告诉 Agent 要完成什么；Agent 会先读取当前任务卡，再按引用寻找所需信息。

```text
你的指令
   ↓
AGENTS.md：判断该走哪条路线
   ↓
current.json：确认当前阶段、目标、引用和门禁
   ↓
目标 Atlas / Figma / 工程文件：只读取任务所需部分
   ↓
执行、验证，并在关键状态变化时更新 current.json
```

## 2. 五个核心组成

| 组成 | 作用 | 何时读取 |
|---|---|---|
| `AGENTS.md` | 长期有效的路由、门禁和更新规则 | Agent 自动读取 |
| `memory-bank/current.json` | 当前任务卡，说明现在做到哪一步、该读什么、能否写代码 | 每个新任务默认读取 |
| `product-atlas/` | 项目的正式产品定义，即新型 PRD | 产品行为相关任务按节点读取 |
| `memory-bank/` 其他文件 | 架构、技术栈和实施计划等工程事实 | 仅在相应工程任务中读取 |
| `docs/` | 方法论、历史资料和交付参考 | 用户明确要求或 Atlas 明确引用时读取 |

可以把它们理解为：

- Product Atlas 决定“为什么做、为谁做、做什么、如何判断有效”；
- Figma 和 Design Tokens 决定“界面应该长什么样”；
- 代码与测试记录“软件现在实际上怎样运行”；
- `current.json` 把当前任务精确地连接到这些信息。

## 3. 你平时怎样使用

### 继续已有工作

直接说：

> 继续当前任务。

Agent 默认只读取 `current.json`，恢复当前阶段和步骤。只有任务真正需要时，才展开其中的引用。

### 开始一个明确步骤

例如：

> 开始编写 N1 场景图纸，只读取场景相关资料；完成后更新当前状态。

> 开始 Figma 首页低保真，依据 E1、E2 和 O1，不进入代码开发。

> 实现扫描确认页，并按当前验收引用完成测试。

Agent 会在步骤开始时更新任务状态，在完成、阻塞或验收时再次更新；不会把每条命令都写入进度文件。

### 修改界面

例如：

> 把拍照按钮改成黄色，其他视觉不变。

这是纯视觉任务。Agent 应读取当前 Figma Frame 和 Tokens，不需要重新读取用户场景、问题图纸或历史 PRD。

### 修改产品行为

例如：

> 拍照识别改为最多支持三张图片。

这会改变交互和系统边界。Agent 应检查 E2、O1 和 AI-01；若结论被接受，先更新相关 Atlas 节点及 revision，再修改设计或代码。

### 修复问题

例如：

> 期望值结果的小数位不正确，修复并补测试。

如果预期规则已经明确，Agent 只需查看相关规则、测试和目标代码，不重新阅读完整 Product Atlas。

## 4. `current.json` 怎么看

通常不需要手动编辑它。你可以让 Agent：“把当前步骤切换为 `ATLAS-02`，并更新 `current.json`。”

| 字段 | 含义 |
|---|---|
| `stage` | 当前所处阶段，如产品定义、设计、Demo 或正式软件 |
| `activeStep` | 当前唯一活动步骤 ID |
| `lastCompletedStep` | 最近完成的步骤 |
| `status` | 当前步骤状态，如 `READY`、`IN_PROGRESS`、`BLOCKED`、`STALE`、`COMPLETED` |
| `objective` | 当前步骤要达成的结果 |
| `productAtlas` | 当前依赖的 Atlas 版本和批准状态 |
| `requiredRefs` | 必须读取的 Atlas 节点及其 revision |
| `designRefs` | 当前 Figma Frame、Token 或设计版本 |
| `codeTargets` | 本步骤允许触及的代码区域 |
| `acceptanceRefs` | 用于判断完成的验收项 |
| `blockers` | 阻止任务继续的明确问题 |
| `codeImplementationAllowed` | 是否已解锁设计与 Demo 代码实现 |

典型任务卡示例：

```json
{
  "stage": "DEMO",
  "activeStep": "DEMO-04",
  "status": "READY",
  "productAtlas": {
    "version": "0.2",
    "status": "APPROVED"
  },
  "requiredRefs": [
    { "id": "E2", "revision": 3 },
    { "id": "O1", "revision": 2 },
    { "id": "AI-01", "revision": 1 }
  ],
  "designRefs": ["FIGMA:SCAN_CONFIRM:v4"],
  "codeTargets": ["apps/miniapp/src/pages/scan"],
  "acceptanceRefs": ["O2:SCAN-01"],
  "blockers": [],
  "codeImplementationAllowed": true
}
```

## 5. Product Atlas 怎样与项目联动

Product Atlas 由六张核心图纸和一个默认扩展组成：

| ID | 图纸 | 回答的问题 |
|---|---|---|
| N1 | Situation | 谁在什么时间、地点和情境下遇到问题？ |
| N2 | Problem | 用户真正要解决的问题、现有替代方案和风险是什么？ |
| E1 | Direction & Scope | 产品方向、V1 范围和明确不做什么是什么？ |
| E2 | Experience | 核心用户旅程、状态和交互怎样发生？ |
| O1 | System | 规则、数据、能力边界和系统约束是什么？ |
| O2 | Outcome & Validation | 怎样证明方案有效，当前步骤如何验收？ |
| AI-01 | AI Contract | 图片识别的输入、输出、置信度、失败和隐私规则是什么？ |

每个节点使用整数 `revision`。当节点内容发生有效变更时：

1. 修改节点并将 revision 加一；
2. 更新 `product-atlas/index.json` 中的摘要和状态；
3. 找出 `current.json` 中引用旧 revision 的步骤；
4. 只将受影响步骤标记为 `STALE`；
5. 不受影响的设计和代码继续有效。

这样，“按钮换颜色”不会让产品定义失效，而“三图识别”会精准触发体验、系统和 AI 契约的更新。

## 6. 四个阶段的使用方式

### 产品定义

```text
历史 PRD / 研究材料
→ 编写 N1、N2、E1、E2、O1、O2
→ 补充 AI-01
→ 人工确认
→ Product Atlas 标记 APPROVED
```

这是唯一允许较多读取历史产品材料的阶段。传统 PRD 只是迁移来源，不是最终产品事实。

### 设计

```text
E1 范围 + E2 体验 + O1 边界
→ Figma 低保真
→ 视觉资产与高保真
→ Design Tokens
→ 将 Frame 版本写入 designRefs
```

设计任务默认不读取 N1/N2。只有流程无法解释或范围发生冲突时才回退到上游节点。

### Demo

```text
current.json
→ 当前 Figma Frame
→ 一个相关系统契约
→ 一个目标代码区域
→ 当前验收条件
```

Demo 只证明核心场景成立，不提前加载正式软件阶段的全部工程要求。

### 正式软件

Demo 通过后，再按步骤补充错误状态、图片隐私与清理、性能、兼容性、监控、限流、重试、可访问性、发布和回滚。每项仍按需读取，不重新加载完整 Atlas。

## 7. 门禁和冲突怎样处理

- `codeImplementationAllowed` 为 `false`：不得初始化 Figma 设计或 Demo 代码；先完成当前产品定义步骤。
- Atlas 不是 `APPROVED`：历史 PRD 不能被当成正式范围。
- 功能不在 E1 范围：Agent 停止实现并报告冲突，由你决定修改范围还是放弃需求。
- 引用 revision 过期：只重新读取发生变化的节点，并把受影响步骤标记为 `STALE`。
- Atlas 没有答案：把问题标记为 `UNKNOWN`；最多检查一次索引和一个最相关节点，之后提出一个精准问题。
- 视觉与描述冲突：已批准的 Figma/Tokens 是视觉事实。
- 代码与文档冲突：先以运行结果和测试定位事实，再判断应该修代码还是回写上游定义。

## 8. 推荐指令模板

你可以直接复制这些句式：

```text
继续当前任务，并告诉我当前门禁和下一步。

开始编写 N1，只读取场景相关资料；不要扩展到完整历史文档。

新增成就系统。先检查它是否属于 E1 范围，不要直接写代码。

把拍照按钮改成黄色。只处理当前 Figma Frame 和 Tokens。

修复概率计算错误。读取相关规则、测试和目标代码，不回看无关 Atlas 节点。

检查千问图片识别失败。只读取 O1、AI-01、识别测试和相关代码。

验证当前步骤。只使用 acceptanceRefs 和运行证据。

告诉我本次任务读取了哪些上下文，以及为什么需要它们。
```

## 9. 完成任务前怎样校验

在仓库根目录执行：

```bash
node scripts/validate-harness.mjs
```

校验器会检查：

- Harness 必需文件和 JSON 是否有效；
- Atlas 节点、扩展和画布引用是否存在；
- `current.json` 与 Atlas 的状态、版本、revision 是否一致；
- Atlas 未批准时是否错误解锁代码；
- `AGENTS.md` 和 `current.json` 是否超过轻量限制；
- Markdown 本地链接是否失效；
- 项目文件中是否残留不应提交的 `.DS_Store`。

校验通过只代表 Harness 结构一致，不代表产品、视觉或代码本身已经验收。

## 10. 使用时避免什么

- 不要默认要求 Agent “先阅读全部项目文件”；只有全局审计或产品重定义才需要 L3 阅读。
- 不要把 Product Atlas 内容复制进 `AGENTS.md` 或 `memory-bank`，否则会产生多个事实源。
- 不要在 Atlas 未批准时手动把 `codeImplementationAllowed` 改为 `true`。
- 不要因为普通视觉调整增加 Atlas revision。
- 不要为每条命令更新 `current.json`，只记录步骤级状态变化。
- 不要让历史 PRD 自动参与开发；需要使用时应由用户或 Atlas 节点明确引用。

## 11. ICHI 当前处于哪里

当前 Harness 已建立，活动步骤是 `ATLAS-01`：编写并人工确认六张 Product Atlas 核心图纸。Atlas 状态仍是 `NOT_STARTED`，所以设计和 Demo 代码门禁保持关闭。

下一阶段的正确动作是从 N1 场景图纸开始构建 ICHI Product Atlas，而不是直接初始化页面代码。
