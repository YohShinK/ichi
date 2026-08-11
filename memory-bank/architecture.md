# ICHI Architecture

> 本文件只记录真实存在的文件和职责，不把计划目录写成已实现架构。

## 当前状态

仓库的 V1-A 工程基线、V1-B 计算内核、V1-C 会话／Storage／随包版面兼容与识别 QA，以及 V1-D Next.js 手机优先完整页面实现均已完成自动验证和用户统一人工验收。V1-26 最初以低保真页面流启动，但经 V1-29 完整设计与实现后，Next.js 现为小程序全部页面、内容、组件、视觉、动效和交互的批准基线。V1-E 现为唯一活动区块：V1-31—V1-39 已整组解锁，目标是把用户提供的 `网页 ui.html`、`V1-29 UI Design Tokens` 及全部已验收页面一比一照搬为本地微信小程序 WXML/WXSS/TypeScript 和平台能力，不把网页 iframe、Tailwind 或远程 UI 运行时带入小程序。V1-E 只允许语法级映射和浏览器 API 到微信 API 的必要平台适配；不得在旧小程序壳上重新设计、重排、简化或补写另一套 UI。V1-D 批准基线包含情境提醒、局面可能性、连续撤销、共享取证前端框架、草稿与记录状态，以及 `packages/board-layout` 的奖级分类和 schema 约束。网页不接入真实图片导出、分享服务或云端记录；V2 真实账号、上传、OCR 核对和地图发布仍未创建。`apps/client/miniprogram/` 是最终客户端工程基座，当前 bootstrap 页面仍只承担平台验证，不是产品页面或视觉基线；V1-E 正式产品页面尚未照搬完成。

V1-D was closed by user acceptance on 2026-08-11. V1-E is active with V1-31—V1-39 `READY`; V1-F remains locked until the final mini-program pages pass block-level validation and user review.

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
apps/web/
  app/
    layout.tsx
    page.tsx
    prototype-frame.tsx
    api/v1-29-source/route.ts
    light-shell.tsx
    tokens.css
    styles.css
    ui/
      index.tsx
  tests/v1-26.spec.ts
  package.json
  playwright.config.ts
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
  情境提醒.md
  tech-stack.md
  implementation-plan.md
  progress.md
  architecture.md
docs/
  decisions/
  design/
    v1-26-figma-low-fi-brief.md
    v1-26-web-low-fi-brief.md
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
| `memory-bank/情境提醒.md` | 抽赏记录与版面快照驱动的情境分析、提示优先级和文案安全边界；每一抽独立产生最高优先级提示，不做跨抽取冷却去重；复用大／中／小赏三档分类；无成本节点和闲置提醒；V1-D 已批准认知 |
| `docs/decisions/account-and-my-panel-proposal.md` | 账号与“我的”面板的 V2 后端方案草案；记录状态、数据模型和待用户确认的登录选择 |
| `memory-bank/tech-stack.md` | 当前技术决策和分版本架构边界 |
| `memory-bank/implementation-plan.md` | 唯一区块顺序；定义各区块状态、step 范围、自动验证和统一人工验收 |
| `memory-bank/progress.md` | 当前活动区块、区块内工作集、历史完成和验证记录 |
| `memory-bank/architecture.md` | 当前真实仓库与未来代码职责地图 |
| `package.json`、`pnpm-workspace.yaml`、`pnpm-lock.yaml` | V1-A workspace、精确包管理器入口、统一质量命令和已解析依赖锁；网页依赖和 `test:web` 入口已加入 |
| `vitest.config.mts` | 根 Vitest 测试边界；排除由 Playwright 运行的 `apps/web/tests/` |
| `tsconfig.base.json`、`tsconfig.json`、`eslint.config.mjs` | TypeScript 6 与 ESLint 10 的共享静态检查基线 |
| `.github/workflows/quality.yml` | 在 Node 24.11 与 pnpm 11.9 上执行统一质量门的 CI |
| `project.config.json` | 真实小程序 AppID、`miniprogramRoot`、CloudBase 函数根和基础库 3.17.0 配置；不含 AppSecret |
| `apps/client/miniprogram/` | 微信小程序最终交付端的现有工程壳；`pages/bootstrap/` 当前只承担 V1-C Storage 工程验证，不是视觉基线；后续把已验收完整网页的全部页面、视觉、动效与行为一比一照搬进来 |
| `packages/core/src/types.ts`、`errors.ts`、`result.ts` | 票池、奖项、目标、预算、结果、公式版本、稳定错误和成功／错误联合类型 |
| `packages/core/src/fraction.ts`、`integer.ts`、`combinatorics.ts` | 约分 `bigint` 分数、整数边界和稳定组合数基础能力 |
| `packages/core/src/probability.ts`、`multi-target.ts` | 单抽、至少一次、超几何分布、目标期望、首次命中期望和多目标指定数量精确计算 |
| `packages/core/src/money.ts` | 计划／累计成本、剩余预算、最大可抽数、包套与直接购买现金差；金额均为最小单位整数 |
| `packages/core/src/validation.ts` | 将原始输入归类为可计算、信息不足或存在矛盾，阻止非法状态进入方案计算 |
| `packages/core/src/comparison.ts` | 组合抽取、包套、直接购买和停止的并列解释数据；抽取同时输出达成与未达成概率，不输出排名、价值期望或推荐分 |
| `packages/core/src/constrained-plan.ts` | 用户明确预算、最大抽数和最低概率后的最少抽数证明；缺约束、无解、固定安全披露和 Last 仅包套保证均为稳定结果 |
| `packages/core/src/*.test.ts` | 10 个批准向量、组合数、概率、枚举、金额、校验、四方案、约束最小性、Last 边界、局面可能性与确定性性质回归 |
| `packages/core/src/board-outlook.ts`、`board-outlook.test.ts` | `board-outlook-v1.1.0` 的平台无关局面可能性算法；固定最多 3 抽窗口，精确输出目标、大赏、非小赏与小赏事件，不排序、不推荐、不读取用户画像或外部数据 |
| `packages/board-layout/src/index.ts`、`index.test.ts` | 版面契约版本、注册表标识，以及 `derivePrizeClassification` 大／中／小赏本地派生算法；票数无效时返回未确认，单元测试覆盖 5 张与 10 张临界值、G—Z／OTHER 与非法票数 |
| `packages/recognition-contract/` | 识别契约版本、响应状态和问题严重度的类型化入口骨架 |
| `packages/session/src/types.ts`、`errors.ts` | 会话／票池／单张轮次／版面快照类型、schema 版本与稳定会话错误 |
| `packages/session/src/session.ts`、`calculation.ts` | 纯状态机、单奖项草稿、原子确认、最近轮撤销、修订保护与即时公式快照 |
| `packages/session/src/copy-session.ts` | 以当前票池创建新身份，保留目标／预算／确认草稿但清空历史、花费和活动状态 |
| `packages/storage/src/codec.ts`、`repository.ts` | Storage V1 JSON 信封、`bigint` 十进制编码、V0 迁移、失败回退、单会话／全部 ICHI 数据删除和容量状态 |
| `packages/storage/src/board-compatibility.ts` | 随包版面 schema、组件注册表、识别契约检查，V0 包装迁移及最近可用快照回退 |
| `apps/client/miniprogram/platform/storage.ts` | `wx.*` 的最小 Storage 驱动与容量状态适配，不把平台 API 放进会话领域层 |
| `apps/client/miniprogram/platform/storage-smoke.ts`、`pages/bootstrap/` | V1-C 开发验证入口；验证保存、重开恢复、删除和容量，不是 V1-E 产品页面 |
| `apps/web/app/page.tsx`、`prototype-frame.tsx` | Next.js 页面入口与 V1-29 原始页面壳容器；服务端只在首次进入时把 URL 的 `view` 参数传给原始网页 hash，内部路由后由同一 iframe 实例使用原生 history 同步父地址，避免 App Router 因查询参数变化重新挂载 iframe、闪现导入页或丢失运行状态；父层只接收当前 iframe 发出的路由消息 |
| `apps/web/app/api/v1-29-source/route.ts` | 读取用户提供的 `/Users/cunfu/Downloads/网页 ui.html` 并以不缓存 HTML 响应交给 V1-29 页面壳，确保字体、图标、类名、字符间距、布局与动效完全使用原文件；响应末尾的桥接层强制页面视图互斥，并负责 hash 路由同步、识别流程页面／滚动恢复、临时相机／加载状态回退、“我的”二级页统一返回与根标签复点、抽取／撤销会话缓存、三位小数概率、逐抽情境提醒、工作台固定层、统一阻塞式视觉中心模态框及“决定收手”长按确认。“正在提取版面”保留原深色旋转圆环，圆环内的旧扫描图标替换为静止的“单线眼睛＋放大镜”票根吉祥物透明素材；“版面已确认”生成状态层的黑色魔法棒旧图标替换为保留弹跳动效的“圆点眼睛＋铅笔”票根吉祥物透明素材。共享取证拍摄页在原始模态壳上保持灰色全屏、顶部安全区返回箭头、取景框—拍摄／重拍—地点备注的纵向顺序。轻提醒吉祥物按本轮奖级的本地大／中／小赏分类分别显示四芒星眼、原圆点眼和眯眼表情，提醒框的垂直中心与顶部状态栏中心对齐。桥接层还以 `ichi:v1-29-local-draw-drafts:v1` 管理用户主动保存的 `LocalDrawDraft`：按 `boardId` 覆盖写入 `localStorage`，在固定导入 Hero 下方渲染独立滚动列表并恢复同一版面状态；识别首页与本地记录共用 Swipe-to-Delete 层，只允许 `unverified + not-uploaded` 草稿按 `boardId` 删除并同步刷新两处列表。“本地记录”把这些草稿与已上传状态预览合并为同一记录总账，显式保存核对／上传双状态；“我的贡献”只过滤 `uploadStatus = uploaded` 的相同 `recordId`，并预留 `likeCount` 零值展示，不维护第二份记录副本。奖票撕揭使用未揭表面与同内容翻片双层结构，翻片围绕动态撕开边界沿正 Z 轴卷起并向观察者飞离，不生成黄色或其他有色卷边伪元素；A—F 字母统一为普通白色。该路由的同源 `POST` 只接收当前版面计数并调用 `apps/web/app/board-outlook.ts`，把 `board-outlook-v1.1.0` 的完整事件结果返回原壳，不在桥接脚本中复制概率公式 |
| `apps/web/app/api/v1-29-camera-icon/route.ts` | 原样输出用户提供的相机图标 PNG，供原始网页壳的导入卡片直接使用；不裁剪、滤镜、重绘或重新编码该图片内容 |
| `apps/web/public/v1-29/ichi-camera-cutout.png` | 用户授权的导入相机图标去背产物；保留黑白图标主体并移除外部白色画布，以透明通道直接贴入导入 Hero 卡，不改变按钮或业务交互 |
| `apps/web/public/v1-29/ichi-mascot-large.png`、`ichi-mascot-small.png` | 用户提供的轻提醒吉祥物四芒星眼与眯眼表情透明底 PNG；分别用于大赏与小赏，本地现有圆点眼 DOM 表情继续用于中赏 |
| `apps/web/public/v1-29/ichi-recognition-mascot.png` | 用户提供的“单线眼睛＋放大镜”票根吉祥物透明底 PNG；用于“正在提取版面”旋转圆环内的静止识别状态图形 |
| `apps/web/public/v1-29/ichi-board-confirmed-mascot.png` | 用户提供的“圆点眼睛＋铅笔”票根吉祥物透明底 PNG；用于点击“确认并生成版面”后的“版面已确认”生成状态层 |
| `apps/web/app/api/v1-29-avatar/route.ts` | 原样输出用户提供的 ICHI 头像 PNG，供“我的”页面的无边框圆形头像区域使用；不修改图片内容 |
| `apps/web/app/light-shell.tsx` | 上一轮手写 React/CSS 壳的功能迁移尝试；不再由页面入口挂载。后续 ICHI 算法与状态只允许逐项接入原始页面壳控件，不能用此文件改写页面外观 |
| `apps/web/app/page.tsx` V1-26 修订 | 拍摄版面改为手机相机式布局：上半屏为纵向全屏取景区域，下半屏为控制区，仅保留圆形拍摄和返回操作；当前仍是网页取景占位，不请求真实相机权限 |
| `apps/web/app/draw-cache.ts` | V1-26 当前浏览器会话缓存适配；以 `sessionStorage` 保存 `boardId`、版面 tiers、抽取记录、最近 50 抽撤销栈和同版面唯一的最新贡献快照，页面重新进入版面时恢复；缓存失败不阻断内存中的抽取流程，不宣称云端保存 |
| `apps/web/app/situation-reminder.ts`、`situation-reminder.test.ts` | V1-30B 的网页低保真情境分析纯函数与固定案例；只从已确认抽取记录、目标和票池快照产生优先级及大赏／中赏／小赏文案，每一抽都交由主版面显示本轮结果；不计算概率、不设置成本节点、不预测或推荐继续抽取 |
| `apps/web/app/board-outlook.ts`、`board-outlook.test.ts` | V1-30D 的网页局面可能性适配与固定案例；用本地大／中／小赏分类汇总当前余票，调用 `@ichi/core` 的 `board-outlook-v1.1.0`，将稳定事件 ID 转为视觉中心模态框文案与三位小数百分比；不排序、不推荐、不执行抽取 |
| `docs/decisions/v1-recognition-and-prize-presentation.md` | 固定模型识别字段表、券位本地求和和 A—F 大／中／小赏本地派生与版面呈现规则 |
| `docs/decisions/v1-board-outlook-algorithm.md` | `board-outlook-v1.1.0` 的独立规格：版面特化事件目录、固定 3 抽观察窗口、精确不放回公式、输入边界、版本与固定案例；由 `packages/core/src/board-outlook.ts` 实现并由网页适配层读取 |
| `docs/decisions/v2-contribution-verification-lifecycle.md` | `contribution-verification-v1.0.0` 的独立规格：提交后直接进入后台核对状态、私有证据与公开版面状态的分离、失败回退和幂等；真实服务尚未创建 |
| `apps/web/app/tokens.css` | V1-D 手机优先视觉 tokens：中性灰阶、间距、圆角、导航安全区高度和模态阴影；可由后续视觉探索替换，不承载业务状态 |
| `apps/web/app/v1-29.css` | 仅提供 V1-29 外层原始页面壳容器尺寸；实际视觉、字体、图标、间距与动效直接来自用户提供的 HTML |
| `apps/web/app/styles.css` | V1-D 中性灰阶低保真布局，以及大赏双列正方形、中赏／小赏横向票条、概率、状态浮层与圆形快捷按钮的响应式演示样式；390×844 下识别结果和一番赏版面压缩重复顶部信息，确保至少 5 个奖级完整位于底部导航上方；移动端“收手”固定在底部导航上方的屏幕中央；提交状态框和分享取证框使用当前视口居中的模态层，不固定在版面底部 |
| `apps/web/app/ui/index.tsx` | V1-D 随包 React 基础组件：`Button`、`StateLink`、`PrizeTile`、`TicketSlots`、`StatusNotice`、`Modal` 和 `BottomTabbar`；组件只渲染本地数据，不执行远程 UI 代码 |
| `apps/web/app/layout.tsx`、`next.config.ts`、`tsconfig.json` | Next.js App Router 最小运行壳和网页类型配置；`next.config.ts` 将 `@ichi/core` 随网页编译，并将其源码 ESM 的 `.js` 引用解析为 TypeScript 文件 |
| `apps/web/tests/v1-26.spec.ts`、`playwright.config.ts` | V1-26／V1-29 的 26 条 Playwright 回归：页面互斥与 iframe 不重载、识别页面／滚动恢复、识别圆环与版面确认状态的吉祥物资源和独立动效、导入至版面工作台、双列奖票与双层 Page Curl、抽取／撤销与逐抽情境提醒、提醒／状态栏垂直对齐、局面可能性完整事件与统一阻塞模态、工作台固定层、“决定收手”长按取消／完成、草稿双入口左滑删除、本地记录／贡献分层、二级页返回、异常回退和窄屏布局 |
| `services/cloudbase/functions/recognize-board/` | V1 唯一云能力的安全失败代理骨架；未配置环境密钥时返回稳定错误，不调用识别提供方 |
| `tests/{fixtures,e2e,recognition,visual}/` | 后续区块测试资产的已建立职责目录；V1-A 只含边界说明 |
| `docs/references/project/` | 旧 PRD 和三阶段研究原文，不直接驱动开发 |
| `docs/delivery/` | 历史 Figma／小程序交付参考；不再控制当前 Next.js 网页 UI |
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
| `docs/design/v1-26-figma-low-fi-brief.md` | 已废弃的 V1-26 Figma 低保真草案，仅保留历史审计 |
| `docs/design/v1-26-web-low-fi-brief.md` | V1-26 的历史低保真起点；其当前产品页面基线已被 V1-29 完整 Next.js 页面实现与验收结果取代 |
| `docs/design/v1-29-mobile-visual-direction.md` | V1-29 的唯一页面壳迁移规格，固定 `网页 ui.html` 的保真边界、功能映射、本地依赖边界和验收条件 |
| `docs/design/v1-29-ui-design-tokens.md` | V1-29 跨页面视觉参数事实源；定义顶部安全区、视觉中心、页面边距、间距尺度、卡片／Hero／操作尺寸、工作台固定层、长按确认、相机例外和页面族变体，供原始页面壳的响应注入层复用 |
| `docs/design/gemini-canvas-all-pages-spec.md` | 基于当前 `apps/web/app/page.tsx` 整理的 Gemini Canvas 单 HTML 全页面、跳转、弹层和按钮占位规格 |
| `docs/decisions/v1-web-ui-nextjs.md` | 记录 Next.js 从早期中间验证层演进为完整批准基线、微信小程序一比一照搬为最终交付端的架构决策 |
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
- V1-C 的 `packages/session`、`packages/storage`、微信 Storage 验证入口和识别 QA 已成为批准基线；V1-D 的完整 Next.js 页面与后续小程序一比一照搬都可引用这些行为与边界，但不得改写已批准的产品能力。
- 产品行为、技术选择、实际文件职责和执行状态分别联动到 `design-document.md`、`tech-stack.md`、本文件、`implementation-plan.md` 与 `progress.md`，不得只改计划状态而保留冲突的冻结说明。
- V1-D 的 Next.js 完整页面、tokens、组件和 V1-29 全局视觉层已完成自动验证与用户人工验收；V1-D 已收口，V1-E 已解锁并为唯一活动区块，V1-31—V1-39 均为 `READY`。

## 规划但尚未创建或尚未实现

以下是跨多个区块的规划结构。V1-D 的完整 Next.js 页面、tokens、组件和交互基线已经创建并通过验收；小程序产品页面将在 V1-E 按该基线一比一照搬，其余目录仍按后续区块门禁推进：

```text
packages/design-tokens/
packages/ui/
docs/qa/
apps/client/miniprogram/pages/<product-pages>/
services/cloudbase/<deployed-environment>/
```

已建骨架和未建模块的后续职责根据 V1 待验收基线调整：

- `apps/web/` 作为 Next.js 手机优先完整批准基线，承载全部页面、内容、行为、组件、视觉、动效、浏览器存储适配与回归；
- `apps/client/` 作为微信小程序最终交付端，一比一照搬网页页面并承载必要的 WXML/WXSS 语法映射、微信平台适配和最终真机验证；
- `packages/board-layout/` 承载版面语法、A—Z 标签、二维排布、大／中／小赏派生和本地条件渲染定义；
- `packages/recognition-contract/` 承载图像请求、字段置信、券位观察和校正草稿契约；
- `packages/session/` 承载平台无关的会话状态机、原子轮次、最近轮撤销和复制规则；
- `packages/storage/` 承载版本化会话存储、迁移、失败回退与随包版面兼容，微信 API 只在客户端适配层出现；
- `services/cloudbase/` 在 V1 只允许识别代理；V1 网页可以展示账号与贡献 UI 框架，但不允许真实账号、会话云同步、产品目录或用户公共写入；V2 再按批准方案接入；
- `tests/recognition/` 承载经授权的版面样本、字段标注和识别回归。

V2 线索数据、V3 公共贡献、公共写入、账号和审核端仍不能在对应决策门前初始化。

## 更新规则

- 创建、移动、删除或改变重要文件职责后更新本文件；
- 只记录已发生的结构变化；
- 计划中的目录保留在“规划但尚未创建”；
- 重要结构变化发生时立即与 `progress.md` 联动更新；区块通过人工验收时再做一次收口核对；
- 重大架构选择在 `docs/decisions/` 增加决策记录。
