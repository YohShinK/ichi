# ICHI Architecture

> 本文件只记录真实存在的文件和职责，不把计划目录写成已实现架构。

## 当前状态

仓库的 V1-A 工程基线和 V1-B 计算内核已经用户验收。V1-C 会话、Storage、随包版面兼容和识别 QA 已完成自动验证，当前等待统一人工验收；真实产品页面、V1-D 组件、云环境和部署配置尚未实施。

## 当前核心结构

```text
AGENTS.md
PRD.md
README.md
.github/workflows/quality.yml
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
project.config.json
tsconfig.base.json
tsconfig.json
eslint.config.mjs
apps/client/
  package.json
  miniprogram/
    app.json
    app.ts
    app.wxss
    sitemap.json
    pages/bootstrap/
    platform/
      storage.ts
      storage-smoke.ts
      storage.test.ts
packages/
  core/src/
    combinatorics.ts
    comparison.ts
    constrained-plan.ts
    errors.ts
    fraction.ts
    integer.ts
    money.ts
    multi-target.ts
    probability.ts
    result.ts
    types.ts
    validation.ts
    *.test.ts
  board-layout/
  recognition-contract/
  session/src/
    calculation.ts
    copy-session.ts
    errors.ts
    session.ts
    types.ts
    *.test.ts
  storage/src/
    board-compatibility.ts
    codec.ts
    repository.ts
    types.ts
    *.test.ts
services/cloudbase/
  functions/recognize-board/
tests/
  fixtures/
  e2e/
  recognition/
  visual/
memory-bank/
  design-document.md
  tech-stack.md
  implementation-plan.md
  progress.md
  architecture.md
docs/
  decisions/
  delivery/
  methodology/
  references/
data/
  calculation-baseline/
    glossary.json
    vectors.json
  toolchain-baseline/
    versions.json
  board-layout/
    README.md
    registry/
      saturated-component-registry.json
    schema/
      board-layout.schema.json
  recognition-contract/
    README.md
    fixtures/
      complete-board.json
      handwritten-price.json
      inconsistent-slots.json
      partial-board.json
    registry/
      issue-actions.json
    schema/
      recognition-contract.schema.json
  recognition-evaluation/
    README.md
    manifest.json
    tier-label-coverage.json
  render-contract/
    README.md
    fixtures/
      complete-render-plan.json
      partial-retake-plan.json
    registry/
      render-policy.json
    schema/
      render-plan.schema.json
product-atlas/
canvas/
scripts/
  validate-board-layout.mjs
  validate-recognition-contract.mjs
  validate-render-contract.mjs
  validate-v1a-baseline.mjs
  validate-v1c-baseline.mjs
  validate-workflow.mjs
  verify-quality-gate.mjs
```

## 文件职责

| 路径 | 当前职责 |
| --- | --- |
| `AGENTS.md` | Codex 的区块解锁、区块验收、上下文读取和文件联动规则 |
| `PRD.md` | 面向人阅读的 V1/V2/V3 产品总览 |
| `memory-bank/design-document.md` | 正式产品行为、边界、数据与验收事实源 |
| `memory-bank/tech-stack.md` | 当前技术决策和分版本架构边界 |
| `memory-bank/implementation-plan.md` | 唯一区块顺序；定义各区块状态、step 范围、自动验证和统一人工验收 |
| `memory-bank/progress.md` | 当前活动区块、区块内工作集、历史完成和验证记录 |
| `memory-bank/architecture.md` | 当前真实仓库与未来代码职责地图 |
| `package.json`、`pnpm-workspace.yaml`、`pnpm-lock.yaml` | V1-A workspace、精确包管理器入口、统一质量命令和已解析依赖锁 |
| `tsconfig.base.json`、`tsconfig.json`、`eslint.config.mjs` | TypeScript 6 与 ESLint 10 的共享静态检查基线 |
| `.github/workflows/quality.yml` | 在 Node 24.11 与 pnpm 11.9 上执行统一质量门的 CI |
| `project.config.json` | 真实小程序 AppID、`miniprogramRoot`、CloudBase 函数根和基础库 3.17.0 配置；不含 AppSecret |
| `apps/client/miniprogram/` | 可由微信开发者工具编译的最小小程序壳；`pages/bootstrap/` 当前只承担 V1-C Storage 工程验证，不实现产品能力 |
| `packages/core/src/types.ts`、`errors.ts`、`result.ts` | 票池、奖项、目标、预算、结果、公式版本、稳定错误和成功／错误联合类型 |
| `packages/core/src/fraction.ts`、`integer.ts`、`combinatorics.ts` | 约分 `bigint` 分数、整数边界和稳定组合数基础能力 |
| `packages/core/src/probability.ts`、`multi-target.ts` | 单抽、至少一次、超几何分布、目标期望、首次命中期望和多目标指定数量精确计算 |
| `packages/core/src/money.ts` | 计划／累计成本、剩余预算、最大可抽数、包套与直接购买现金差；金额均为最小单位整数 |
| `packages/core/src/validation.ts` | 将原始输入归类为可计算、信息不足或存在矛盾，阻止非法状态进入方案计算 |
| `packages/core/src/comparison.ts` | 组合抽取、包套、直接购买和停止的并列解释数据；抽取同时输出达成与未达成概率，不输出排名、价值期望或推荐分 |
| `packages/core/src/constrained-plan.ts` | 用户明确预算、最大抽数和最低概率后的最少抽数证明；缺约束、无解、固定安全披露和 Last 仅包套保证均为稳定结果 |
| `packages/core/src/*.test.ts` | 10 个批准向量、组合数、概率、枚举、金额、校验、四方案、约束最小性、Last 边界和确定性性质回归 |
| `packages/board-layout/` | 版面契约版本和本地注册表标识的类型化入口骨架 |
| `packages/recognition-contract/` | 识别契约版本、响应状态和问题严重度的类型化入口骨架 |
| `packages/session/src/types.ts`、`errors.ts` | 会话／票池／单张轮次／版面快照类型、schema 版本与稳定会话错误 |
| `packages/session/src/session.ts`、`calculation.ts` | 纯状态机、单奖项草稿、原子确认、最近轮撤销、修订保护与即时公式快照 |
| `packages/session/src/copy-session.ts` | 以当前票池创建新身份，保留目标／预算／确认草稿但清空历史、花费和活动状态 |
| `packages/storage/src/codec.ts`、`repository.ts` | Storage V1 JSON 信封、`bigint` 十进制编码、V0 迁移、失败回退、单会话／全部 ICHI 数据删除和容量状态 |
| `packages/storage/src/board-compatibility.ts` | 随包版面 schema、组件注册表、识别契约检查，V0 包装迁移及最近可用快照回退 |
| `apps/client/miniprogram/platform/storage.ts` | `wx.*` 的最小 Storage 驱动与容量状态适配，不把平台 API 放进会话领域层 |
| `apps/client/miniprogram/platform/storage-smoke.ts`、`pages/bootstrap/` | V1-C 开发验证入口；验证保存、重开恢复、删除和容量，不是 V1-E 产品页面 |
| `services/cloudbase/functions/recognize-board/` | V1 唯一云能力的安全失败代理骨架；未配置环境密钥时返回稳定错误，不调用识别提供方 |
| `tests/{fixtures,e2e,recognition,visual}/` | 后续区块测试资产的已建立职责目录；V1-A 只含边界说明 |
| `docs/references/project/` | 旧 PRD 和三阶段研究原文，不直接驱动开发 |
| `docs/delivery/` | Figma、小程序和旧 Harness 交付参考 |
| `docs/decisions/v1-board-catalog-coverage.md` | 已被取代的 V1-01A 产品目录覆盖决策，仅保留历史审计 |
| `data/board-layout/README.md` | V1 版面语法、组件边界、计数规则和验证入口 |
| `data/board-layout/registry/saturated-component-registry.json` | A—Z 奖级、固定辅助组件、布局区域、推导门禁、人工退路和远程代码禁令 |
| `data/board-layout/schema/board-layout.schema.json` | 识别与校正后的版面草稿、券位观察、二维排布和推导结果 JSON Schema 1.0.0 |
| `data/recognition-contract/README.md` | V1 识别交换边界、响应状态、推导规则、人工动作和图片处理说明 |
| `data/recognition-contract/schema/recognition-contract.schema.json` | 识别请求／响应信封、稳定状态、原因码、动作和临时图片边界 JSON Schema 1.0.0 |
| `data/recognition-contract/registry/issue-actions.json` | 18 个稳定问题原因码及其默认人工动作和阻塞语义 |
| `data/recognition-contract/fixtures/` | 完整图、缺图、手写价格和券位计数矛盾四条不含原图的固定数据案例 |
| `data/render-contract/README.md` | 二维只读预览、手机重排、缺图降级、本地组件和安全拒绝规则说明及版面示意 |
| `data/render-contract/schema/render-plan.schema.json` | 本地组件实例、二维源位置、手机流组、问题引用和安全声明 JSON Schema 1.0.0 |
| `data/render-contract/registry/render-policy.json` | 识别状态到渲染状态、16 类本地 renderer、断点、顺序、未知降级和拒绝策略 |
| `data/render-contract/fixtures/` | 完整版面双视图计划与缺边版面只读重拍计划 |
| `data/calculation-baseline/glossary.json` | V1 六个计算术语的输入、输出、限制和示例机器基线 |
| `data/calculation-baseline/vectors.json` | V1 公式、边界、多目标和非法输入的 10 个固定向量 |
| `data/toolchain-baseline/versions.json` | V1-A 精确工具版本、CloudBase 运行时与 OCR 超时、费用和图片边界 |
| `data/recognition-evaluation/` | V1-C QA-only 结构化合成案例；覆盖 A—Z／OTHER 与失败退路，不含真实图片、不声明模型准确率 |
| `docs/decisions/v1-calculation-glossary.md` | V1 计算文案、人可读含义与误解防护决策 |
| `docs/decisions/v1-toolchain-and-recognition.md` | 工具链兼容性、微信测试 AppID、CloudBase 与识别隐私决策 |
| `docs/decisions/v1-session-and-storage.md` | V1-C 纯状态机、Storage、版面兼容、复制会话与识别 QA 边界决策 |
| `docs/methodology/` | 泛化工作流与 NeoPRD 方法论研究 |
| `product-atlas/` | 已结束的 NeoPRD/Product Atlas 实验产物，非正式需求源 |
| `canvas/` | Cowart 无限画布历史可视化资产，非正式需求源 |
| `scripts/validate-workflow.mjs` | 检查标准工作流必需文件、所有区块状态、活动区块无锁定 step，以及计划／进度／README／架构联动 |
| `scripts/validate-board-layout.mjs` | 检查 A—Z 完整性、唯一通用奖级组件、辅助组件、排布区域、计数排除项、人工退路和安全边界 |
| `scripts/validate-recognition-contract.mjs` | 检查请求响应关联、原因码与动作、坐标、券位守恒、推导门禁、状态路由和图片不持久化边界 |
| `scripts/validate-render-contract.mjs` | 检查 A—Z 本地映射、二维位置保留、手机阅读顺序、断点列数、问题继承、未知降级和远程代码拒绝 |
| `scripts/validate-v1a-baseline.mjs` | 检查六个术语、10 个固定向量、独立组合数结果和工具链／识别隐私决策完整性 |
| `scripts/validate-v1c-baseline.mjs` | 检查 5 个受控识别案例、A—Z／OTHER、授权元数据、人工退路和不得声明真实准确率 |
| `scripts/verify-quality-gate.mjs` | 先跑清洁质量门，再注入临时 TypeScript 错误验证失败，清理后复跑并证明恢复 |

## 已废弃的活动机制

- `memory-bank/current.json` 已归档到 `docs/references/harness/current-atlas-01.json`；
- `scripts/validate-harness.mjs` 已移除；
- Product Atlas revision 不再控制设计或代码门禁；
- Cowart 页面可以继续查看，但更新不会自动改变正式需求。

## 区块与文件写入边界

- 文件权限按变更目的和活动区块判断，不按路径整体冻结；同一文件未来还会被后续区块扩展，不妨碍当前区块写入当前范围。
- V1-A 已通过人工验收，其版面、识别、术语、向量、工具链和工程骨架可作为批准基线。
- V1-B 已通过人工验收，`packages/core` 的确定性事实、并列方案与约束内最少抽数证明成为批准基线。
- V1-C 的 `packages/session`、`packages/storage`、微信 Storage 验证入口和识别 QA 当前为 `AWAITING_REVIEW`，可以在本区块内联动修正。
- 产品行为、技术选择、实际文件职责和执行状态分别联动到 `design-document.md`、`tech-stack.md`、本文件、`implementation-plan.md` 与 `progress.md`，不得只改计划状态而保留冲突的冻结说明。
- V1-C 已开放会话、存储、版面兼容和识别 QA 文件；V1-D 及后续区块仍受门禁约束，不得借共享路径提前实现组件或页面范围。

## 规划但尚未创建或尚未实现

以下是跨多个区块的规划结构。当前只允许创建或修改直接服务 V1-C 的会话、存储、兼容和识别 QA 部分：

```text
packages/design-tokens/
packages/ui/
docs/qa/
apps/client/miniprogram/pages/<product-pages>/
services/cloudbase/<deployed-environment>/
```

已建骨架和未建模块的后续职责根据 V1 待验收基线调整：

- `apps/client/` 只交付微信小程序手机端，内置通用版面组件和饱和注册表；
- `packages/board-layout/` 承载版面语法、A—Z 标签、二维排布和本地条件渲染定义；
- `packages/recognition-contract/` 承载图像请求、字段置信、券位观察和校正草稿契约；
- `packages/session/` 承载平台无关的会话状态机、原子轮次、最近轮撤销和复制规则；
- `packages/storage/` 承载版本化会话存储、迁移、失败回退与随包版面兼容，微信 API 只在客户端适配层出现；
- `services/cloudbase/` 在 V1 只允许识别代理，不允许产品目录、用户公共写入、账号或会话云同步；
- `tests/recognition/` 承载经授权的版面样本、字段标注和识别回归。

V2 线索数据、V3 公共贡献、公共写入、账号和审核端仍不能在对应决策门前初始化。

## 更新规则

- 创建、移动、删除或改变重要文件职责后更新本文件；
- 只记录已发生的结构变化；
- 计划中的目录保留在“规划但尚未创建”；
- 重要结构变化发生时立即与 `progress.md` 联动更新；区块通过人工验收时再做一次收口核对；
- 重大架构选择在 `docs/decisions/` 增加决策记录。
