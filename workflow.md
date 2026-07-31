# ICHI 产品设计与跨端实现工作流

> 版本：v0.1  
> 适用范围：Figma 设计、Codex 实现、GPT Image 图像资产、H5 网页、微信小程序  
> 目标：用一套产品定义和尽可能共享的代码，交付同功能、同设计语言的 H5 网页与微信小程序。

---

## 1. 文档目的

本文档定义 ICHI 从产品想法到正式交付的完整流程，解决以下问题：

- 产品需求如何进入 Figma；
- 低保真框架如何演化为高保真页面；
- GPT Image 应该生成什么、不应该生成什么；
- Figma MCP 如何参与 design-to-code 和 code-to-design；
- Codex 如何将设计实现为可运行的跨端前端；
- 如何用浏览器和 Playwright 做视觉回归；
- H5 与微信小程序如何共享代码并处理平台差异；
- 每个阶段需要哪些输入、输出、验收标准和人工确认。

本文档既是项目工作流，也是后续给 Codex 的长期执行规范。流程发生变化时，应先更新本文档，再修改具体实现。

---

## 2. 最终交付目标

项目最终交付两个正式客户端：

1. 微信小程序；
2. H5 网页，可在手机浏览器中使用，并根据产品需要适配桌面浏览器。

两端应做到：

- 核心功能一致；
- 数据、业务规则和接口定义一致；
- 视觉语言、品牌、组件状态一致；
- 页面结构尽可能共享；
- 平台特有能力通过适配层实现；
- 允许导航、登录、支付、分享等平台交互存在合理差异；
- 不追求不同设备之间不合理的逐像素相同。

### 2.1 开发策略

采用“**H5 优先视觉迭代，小程序同步验证**”的策略：

- 使用 H5 进行快速预览、浏览器截图、Playwright 测试和 Figma 回写；
- 从第一行代码开始遵守小程序约束；
- 每完成一个页面或重要状态，都在微信开发者工具中验证；
- 不允许 H5 全部完成后再整体移植到小程序。

---

## 3. 核心原则

### 3.1 一套产品定义，两个运行端

产品需求、用户流程、文案、接口契约和设计 Token 只有一套来源。H5 与微信小程序是同一产品的两个运行端，不是两个独立项目。

### 3.2 真实 UI 必须由代码构建

下列元素必须优先使用真实组件和样式实现：

- 按钮；
- 输入框；
- Tab；
- 卡片；
- 导航栏；
- 列表；
- 弹窗；
- 表单；
- 状态提示；
- 普通图标；
- 文本内容。

不得把整张 AI UI 图直接作为页面背景，也不得把按钮或文本切成图片后伪装成交互控件。

### 3.3 GPT Image 负责视觉资产，不负责组件系统

GPT Image 适合：

- 品牌插画；
- 启动页或空状态插画；
- Hero 背景；
- 特殊纹理；
- 情绪化视觉；
- 活动氛围素材；
- 需要原创绘制的装饰元素；
- 视觉方向探索。

GPT Image 不作为以下内容的默认方案：

- 正文文字；
- 按钮文字；
- 表单控件；
- 基础图标全集；
- 需要动态换色的图标；
- 需要响应式重排的复杂页面；
- 承担业务交互的 UI 组件。

Codex 内置图像生成功能当前使用 `gpt-image-2`，官方建议它用于 UI 素材、横幅、背景、插画和占位素材；生产关键文字仍应在设计工具或代码中完成。参见 [OpenAI Image generation](https://learn.chatgpt.com/docs/image-generation)。

### 3.4 Figma 是设计源，代码是运行源

- Figma 保存设计意图、视觉规范、组件变体和评审结论；
- 代码保存真实交互、业务逻辑、可访问性和跨端行为；
- 两者需要往返同步，但不能假设任何一边会自动完美覆盖另一边；
- 当 Figma 与已确认的产品需求冲突时，以产品需求为准；
- 当 Figma 与真实平台能力冲突时，以平台约束为准，并回写设计。

### 3.5 小步闭环

每次迭代尽量限定为：

```text
一个页面或一个完整状态
→ 读取设计
→ 编码
→ 运行
→ 截图
→ 对比
→ 修正
→ 双端验收
→ 回写设计或记录差异
```

不要一次实现所有页面后才统一检查。

---

## 4. 已确认的工具能力与边界

### 4.1 Figma MCP 可以做什么

根据 Figma 官方文档，Figma MCP 可以：

- 读取 Frame、组件、变量、布局和设计上下文；
- 获取选区或节点截图；
- 下载或上传支持的图片资产；
- 创建或修改原生 Figma 内容；
- 将代码组件与 Figma 组件通过 Code Connect 建立映射；
- 将运行中的网页界面捕获为可编辑的 Figma 图层；
- 将 Figma 上的设计上下文提供给 Codex，由 Codex 适配为项目代码。

相关官方文档：

- [Figma MCP Introduction](https://developers.figma.com/docs/figma-mcp-server/)
- [Figma MCP Tools and prompts](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/)
- [Code to canvas](https://developers.figma.com/docs/figma-mcp-server/code-to-canvas/)
- [Code Connect integration](https://developers.figma.com/docs/figma-mcp-server/code-connect-integration/)

### 4.2 Figma MCP 不是什么

Figma MCP 不是“一键从设计生成生产级代码”的工具。它负责向智能体提供结构化设计上下文，最终代码仍需 Codex：

- 适配本项目技术栈；
- 复用现有组件；
- 补充真实交互；
- 接入数据接口；
- 处理响应式布局；
- 处理 H5 与微信小程序差异；
- 完成测试与视觉修正。

这一边界由 Figma 官方明确说明，参见 [What the MCP sends vs. what the agent does](https://developers.figma.com/docs/figma-mcp-server/mcp-vs-agent/)。

### 4.3 浏览器与 Playwright

浏览器或 Playwright 用于：

- 打开本地 H5；
- 设置固定视口；
- 进入指定路由和状态；
- 截取页面或组件截图；
- 检查控制台错误；
- 检查网络请求；
- 执行交互测试；
- 将实际截图与 Figma 参考图进行对比。

浏览器验证不能替代微信开发者工具。小程序的生命周期、组件、授权和平台 API 必须在小程序环境单独验证。

### 4.4 Taro 的跨端边界

建议使用 Taro + React + TypeScript。Taro 的组件和 API 以微信小程序规范为重要基础，同时提供 H5 端实现，适合本项目的双端目标。参见：

- [Taro React 概述](https://docs.taro.zone/docs/react-overall)
- [Taro 组件库说明](https://docs.taro.zone/docs/components-desc/)
- [Taro H5 标签与平台差异](https://docs.taro.zone/docs/use-h5/)

需要注意：

- 不依赖完整浏览器 DOM；
- 不默认使用仅支持 ReactDOM 的第三方组件；
- 图片必须明确尺寸和裁切方式；
- 平台 API 通过统一接口封装；
- 使用第三方库前必须核对 H5 和微信小程序兼容性；
- SVG、Portal、Canvas、Video 等能力使用前必须做双端验证。

---

## 5. 推荐技术架构

### 5.1 前端技术栈

默认方案：

```text
Taro
React
TypeScript
SCSS
状态管理：按项目复杂度选择轻量方案
请求层：统一封装
图标：跨端可用的图标组件或本地矢量/字体方案
H5 测试：Playwright
小程序测试：微信开发者工具 + 真机
```

未经记录和评审，不在同一项目中同时引入两套大型 UI 框架。

### 5.2 代码结构

建议结构：

```text
.
├── docs/
│   ├── product/
│   ├── design/
│   ├── decisions/
│   └── qa/
├── src/
│   ├── app.config.ts
│   ├── app.tsx
│   ├── assets/
│   │   ├── generated/
│   │   ├── icons/
│   │   └── images/
│   ├── components/
│   │   ├── base/
│   │   └── business/
│   ├── features/
│   ├── pages/
│   ├── platform/
│   ├── services/
│   ├── state/
│   ├── styles/
│   │   ├── tokens.scss
│   │   ├── mixins.scss
│   │   └── global.scss
│   ├── types/
│   └── utils/
├── tests/
│   ├── e2e/
│   ├── visual/
│   └── fixtures/
├── workflow.md
└── README.md
```

### 5.3 平台适配层

平台特有能力必须通过统一业务接口调用：

```text
src/platform/
├── auth.ts
├── payment.ts
├── share.ts
├── storage.ts
├── upload.ts
└── navigation.ts
```

每个模块对上层暴露一致的业务语义，例如：

```ts
interface AuthService {
  signIn(): Promise<UserSession>
  signOut(): Promise<void>
  getSession(): Promise<UserSession | null>
}
```

具体实现可以根据编译环境区分：

```text
auth.h5.ts
auth.weapp.ts
```

页面和业务组件不得直接散落调用 `window`、`document` 或 `wx.*`。必须调用平台层或经过评审的跨端封装。

---

## 6. Figma 文件组织规范

### 6.1 Page 分区

Figma 文件建议包含以下 Page：

```text
00_Cover
01_Product_Flow
02_Foundations
03_Components
10_Wireframes
20_Visual_Directions
30_H5_Mobile
31_H5_Desktop
32_WeApp
40_States_and_Edge_Cases
50_Prototype
90_Archive
```

说明：

- `00_Cover`：项目、版本、负责人和重要链接；
- `01_Product_Flow`：用户流程、页面关系和业务说明；
- `02_Foundations`：颜色、文字、间距、圆角、阴影、栅格；
- `03_Components`：组件和变体；
- `10_Wireframes`：低保真结构；
- `20_Visual_Directions`：AI 生成或人工探索的视觉方向；
- `30_H5_Mobile`：移动网页正式设计；
- `31_H5_Desktop`：桌面适配设计；
- `32_WeApp`：微信小程序正式设计及平台差异；
- `40_States_and_Edge_Cases`：空、错、加载、无权限等状态；
- `50_Prototype`：可点击交互流程；
- `90_Archive`：已废弃但需要保留的版本。

### 6.2 Frame 命名

统一使用：

```text
[端]/[页面]/[状态]/[视口]
```

示例：

```text
H5/Home/Default/390x844
H5/Home/Empty/390x844
H5/Home/Error/390x844
WeApp/Home/Default/375x812
H5/Profile/Loading/1440x900
```

### 6.3 图层与组件命名

使用语义名称：

```text
HomeHeader
PrimaryAction
ProductCard
EmptyState
AvatarImage
BottomNavigation
```

禁止在交付 Frame 中保留大量以下命名：

```text
Frame 128
Group 43
Rectangle 21
Copy 7
```

### 6.4 Auto Layout 与响应式

- 重复结构必须使用组件；
- 内容容器优先使用 Auto Layout；
- 使用 Hug、Fill、Min/Max Width 表达尺寸意图；
- 用约束和布局表达响应式，不依赖大量绝对坐标；
- 在交付前至少验证一个窄视口和一个宽视口；
- 重要元素补充行为注释，例如换行、截断、滚动和固定位置。

Figma 官方也建议使用组件、变量、语义命名、Auto Layout 和注释，以便 MCP 和代码生成理解设计意图。参见 [Structure your Figma file for better code](https://developers.figma.com/docs/figma-mcp-server/structure-figma-file/)。

---

## 7. Design Tokens 规范

### 7.1 Token 分类

Figma Variables 与代码 Token 应保持对应：

```text
color.brand.primary
color.brand.secondary
color.text.primary
color.text.secondary
color.surface.default
color.surface.elevated
color.border.default
color.status.success
color.status.warning
color.status.danger

space.0
space.1
space.2
space.3
space.4
space.6
space.8

radius.sm
radius.md
radius.lg
radius.full

font.size.caption
font.size.body
font.size.title
font.size.display

shadow.card
shadow.overlay
```

### 7.2 Token 使用原则

- 页面中不随意新增孤立颜色；
- 间距尽量来自固定刻度；
- 设计变量修改后同步更新代码 Token；
- 代码中避免重复硬编码品牌色；
- 视觉差异修正优先修改 Token 或组件，不逐页面打补丁；
- 平台字体渲染差异允许通过端级 Token 调整。

### 7.3 Token 同步记录

每次重要 Token 变化需记录：

```text
日期：
变更：
Figma Variable：
代码 Token：
影响组件：
影响页面：
是否需要视觉基线更新：
```

---

## 8. 完整实施流程

### 阶段 A：产品定义

#### 输入

- 产品目标；
- 用户类型；
- 核心问题；
- 业务限制；
- 平台要求；
- 参考产品或页面。

#### 工作

1. 写产品简介；
2. 定义目标用户和核心场景；
3. 列出 MVP 功能；
4. 列出非 MVP 功能；
5. 定义页面清单；
6. 定义用户流程；
7. 明确登录、支付、分享、上传等平台能力；
8. 定义数据需求和权限；
9. 定义成功指标。

#### 输出

```text
docs/product/product-brief.md
docs/product/requirements.md
docs/product/page-inventory.md
docs/product/user-flows.md
```

#### 阶段验收

- 每个页面有业务目的；
- 每个主要操作有成功和失败结果；
- MVP 边界清楚；
- H5 与微信小程序的能力差异已经标记；
- 未决问题有负责人或后续决策点。

---

### 阶段 B：Figma 低保真框架

#### 工作

1. 在 `01_Product_Flow` 绘制用户流程；
2. 在 `10_Wireframes` 建立页面 Frame；
3. 只处理信息层级、页面结构和主要交互；
4. 暂不投入大量品牌插画和装饰；
5. 补齐加载、空数据、错误和权限状态；
6. 用 Prototype 串联关键任务。

#### 低保真评审问题

- 用户是否知道当前在哪里；
- 首屏是否表达最重要的信息；
- 主操作是否明显；
- 页面之间是否存在死路；
- 返回、取消和重试是否明确；
- 无数据时用户下一步做什么；
- 登录是否被放在真正需要的位置；
- 小程序返回手势和 H5 浏览器返回是否合理。

#### 输出

- 低保真 Figma Frame；
- 可点击核心流程；
- 页面状态矩阵；
- 需要视觉素材的占位清单。

#### 阶段验收

产品结构通过人工确认后，才进入视觉方向生成。

---

### 阶段 C：GPT Image 视觉方向探索

#### 目标

生成多个视觉方向供人工选择，而不是直接生成最终前端。

#### 输入材料

- 已确认的低保真截图；
- 品牌关键词；
- 目标用户；
- 色彩偏好；
- 禁用风格；
- 参考图；
- 页面用途；
- 目标画幅。

#### 推荐生成方式

每次生成 2–4 个差异明显的方向，例如：

- 温暖生活化；
- 极简理性；
- 高级编辑感；
- 轻量游戏化。

#### Prompt 模板

```text
这是一个【产品类型】的移动端首页视觉方向稿。
以附件中的线框图为结构约束，保持信息层级和模块顺序不变。
目标用户是【用户】；品牌感受是【关键词】。
使用【色彩、材质、插画风格】。
重点探索背景、氛围、插画和卡片视觉，不要把正文文字烘焙进图片，
不要生成不可拆分的按钮或输入框。
画面尺寸为【尺寸】，为后续真实前端实现提供视觉参考。
```

#### 人工选择标准

- 是否符合产品定位；
- 信息层级是否仍然清楚；
- 是否能拆解成真实代码和独立素材；
- 是否存在大量无法响应式实现的装饰；
- 是否适合小屏幕；
- 是否可维护；
- 是否与已有品牌或第三方作品过度相似。

#### 输出

```text
src/assets/generated/directions/
docs/design/visual-direction-decision.md
```

保留：

- 原始 Prompt；
- 参考图说明；
- 生成日期；
- 选中版本；
- 未采用原因；
- 使用范围。

---

### 阶段 D：独立视觉资产生产

#### 资产拆分原则

选定视觉方向后，将页面拆分为：

1. 代码组件；
2. 普通图标；
3. AI 生成视觉资产；
4. 摄影或外部版权素材；
5. 不需要保留的装饰。

#### AI 资产生成清单

为每个资产记录：

```text
资产名称：
用途：
目标尺寸：
目标比例：
是否透明背景：
安全裁切区域：
深色/浅色版本：
H5 使用位置：
小程序使用位置：
压缩目标：
```

#### 图像生成 Prompt 模板

```text
为【页面/组件】生成一个独立的【插画/背景/纹理】资产。
主体是【主体】，风格为【风格】，配色使用【颜色】。
构图需要在【位置】留出安全空间，便于代码叠加真实文字和按钮。
输出【比例/尺寸】，背景【透明/纯色】。
不要包含文字、按钮、Logo、水印或额外图标。
```

#### 资产处理

- 裁切多余边缘；
- 检查透明通道；
- 移除错误文字和伪 UI；
- 输出合适尺寸；
- 进行 WebP/PNG/JPEG 选择；
- 控制文件大小；
- 检查浅色与深色背景；
- 必要时生成 2x 资源；
- 保留来源和生成记录。

#### 资产目录

```text
src/assets/generated/
├── backgrounds/
├── illustrations/
├── decorations/
└── states/
```

文件名使用：

```text
[用途]-[主题]-[变体]-[尺寸].[ext]
```

示例：

```text
home-hero-spring-light-1200x800.webp
empty-orders-warm-640x480.png
```

---

### 阶段 E：Figma 高保真与组件系统

#### 工作顺序

1. 建立 Foundations；
2. 建立基础组件；
3. 建立业务组件；
4. 将独立图像资产放入页面；
5. 完成高保真页面；
6. 补齐全部状态；
7. 检查响应式；
8. 完成交互原型；
9. 为复杂行为添加注释；
10. 标记 H5 和 WeApp 差异。

#### 基础组件建议

```text
Button
IconButton
Input
Textarea
Checkbox
Radio
Switch
Tabs
Tag
Badge
Avatar
Card
ListItem
Dialog
Toast
EmptyState
Loading
NavigationBar
BottomNavigation
```

#### 每个组件至少覆盖

- 默认；
- 按下或激活；
- 禁用；
- 加载；
- 错误；
- 不同尺寸；
- 文本溢出；
- 图标有无；
- 浅色和深色背景适配（如产品需要）。

#### Figma 交付检查

- Frame 和图层使用语义命名；
- 重复元素已经组件化；
- 使用 Auto Layout；
- 颜色与间距引用 Variables；
- 图片为独立图层；
- 文字不是图片；
- 组件状态齐全；
- 页面有视口尺寸；
- 滚动区域和固定区域明确；
- 页面有对应路由或页面 ID；
- 复杂交互有注释。

---

### 阶段 F：Figma → Codex → 代码

#### 前置条件

- Figma MCP 已连接并授权；
- 使用 Figma Remote MCP 时提供具体 Frame 或节点链接；
- 目标 Frame 已通过设计评审；
- 项目已有技术约束和组件目录；
- 页面对应需求和状态已明确。

#### 读取顺序

Codex 应按以下顺序读取：

1. 页面或节点元数据；
2. 目标 Frame 设计上下文；
3. Frame 截图；
4. 使用到的组件；
5. Variables 和样式；
6. 图片资产；
7. 交互和行为注释；
8. Code Connect 映射（存在时）。

大型页面应先读取结构，再按区域读取设计上下文，避免一次取回过多无关信息。

#### 给 Codex 的实现 Prompt 模板

```text
实现 Figma Frame：【URL】。

目标：
- 使用当前 Taro + React + TypeScript 项目；
- 同时兼容 H5 和微信小程序；
- 优先复用 src/components 中已有组件；
- 使用项目 Design Tokens；
- 不把整个页面实现成图片；
- 不直接复制不兼容的小程序 DOM 或浏览器 API；
- 补齐 loading、empty、error 和 success 状态；
- 保持现有业务逻辑和路由约定。

验证：
- 启动 H5 并使用指定视口截图；
- 与 Figma 截图对比；
- 修正布局、间距、字号、颜色和素材；
- 构建微信小程序；
- 报告仍存在的平台差异。
```

#### 实现顺序

1. 建立页面路由和最小骨架；
2. 实现或复用基础组件；
3. 实现业务组件；
4. 接入 Token；
5. 放置真实图像资产；
6. 完成静态布局；
7. 实现交互；
8. 接入数据接口；
9. 实现状态；
10. 完成双端构建；
11. 进行视觉对比；
12. 修复问题。

#### 代码实现规则

- 组件职责单一；
- 页面不重复定义基础视觉样式；
- 不为通过截图对比而使用大量无语义绝对定位；
- 不在页面中硬编码大段测试数据；
- mock 数据与生产接口分离；
- 图片有明确尺寸、比例和裁切策略；
- 列表项有稳定 key；
- 交互元素有禁用和加载保护；
- 请求失败可重试；
- 平台差异集中在适配层；
- 非必要不复制两份页面。

---

### 阶段 G：H5 浏览器与 Playwright 视觉验证

#### 固定测试条件

视觉对比必须固定：

- 浏览器版本；
- 视口宽高；
- device scale factor；
- 字体；
- 语言；
- 时区；
- 测试数据；
- 登录状态；
- 动画状态；
- 截图等待条件。

建议视口基线：

```text
移动 H5：390 × 844
窄屏移动端：360 × 800
桌面 H5：1440 × 900
小程序设计参考：375 × 812
```

最终尺寸应根据目标用户设备数据调整。

#### 页面状态矩阵

每个主要页面至少评估：

| 状态 | 是否需要设计 | 是否需要代码 | 是否需要截图 |
| --- | --- | --- | --- |
| 默认 | 是 | 是 | 是 |
| 加载 | 是 | 是 | 是 |
| 空数据 | 是 | 是 | 是 |
| 请求错误 | 是 | 是 | 是 |
| 无权限 | 视业务而定 | 视业务而定 | 视业务而定 |
| 长文本 | 是 | 是 | 是 |
| 极端数据 | 是 | 是 | 是 |
| 禁用操作 | 是 | 是 | 是 |
| 成功反馈 | 是 | 是 | 是 |

#### 对比顺序

按以下优先级修正：

1. 页面结构；
2. 容器尺寸；
3. 栅格和对齐；
4. 间距；
5. 字体和行高；
6. 颜色；
7. 圆角和阴影；
8. 图片裁切；
9. 图标；
10. 微小装饰。

先修正影响全局的 Token 和组件，再修正页面局部。

#### Playwright 测试建议

```text
tests/visual/
├── home.spec.ts
├── profile.spec.ts
├── fixtures/
└── snapshots/
```

每条视觉测试应：

- 使用固定数据；
- 直接进入目标路由；
- 等待字体、图片和请求完成；
- 关闭或冻结非关键动画；
- 截取目标页面或组件；
- 将差异结果作为评审证据；
- 由人工确认是否更新基线。

#### 视觉差异处理

不得为了让测试通过而直接覆盖基线。正确流程是：

```text
出现差异
→ 判断是预期设计变化还是回归
→ 回归则修代码
→ 预期变化则确认 Figma 和需求已更新
→ 人工批准
→ 更新截图基线
```

---

### 阶段 H：微信小程序验证

#### 每个页面完成后验证

- 编译是否成功；
- 页面是否正常注册；
- 路由是否正确；
- 导航栏和安全区是否正确；
- 图片是否显示；
- 字体和间距是否可接受；
- 滚动和吸顶是否正常；
- 列表性能是否可接受；
- 授权是否符合平台规则；
- 网络域名和请求是否正确；
- 分包和体积是否符合要求；
- 真机行为是否与开发者工具一致。

#### 平台特有能力清单

按产品需要逐项验证：

```text
微信登录
手机号授权
支付
转发
订阅消息
扫码
相册/相机
定位
文件上传
客服
小程序码
隐私授权
```

#### 小程序验收原则

- H5 已通过不等于小程序通过；
- 开发者工具通过不等于真机通过；
- iOS 和 Android 至少各验证一个真实设备；
- 平台能力必须有取消、拒绝和失败路径；
- 需要审核资质的能力应尽早确认。

---

### 阶段 I：运行页面回写 Figma

#### 适用场景

- 代码实现比原设计更接近真实约束；
- 需要在 Figma 中评审完整流程；
- 需要将多个运行状态并排比较；
- 需要设计师基于真实页面继续调整；
- 代码先行的实验需要沉淀为可编辑设计。

#### 操作流程

1. 启动本地 H5；
2. 准备稳定的测试数据；
3. 打开目标路由；
4. 使用 Figma MCP 的 `generate_figma_design`；
5. 捕获整个页面或选定元素；
6. 将多个状态放入同一 Figma 文件；
7. 检查生成图层、字体和变量绑定；
8. 在 Figma 中校准组件、Auto Layout 和 Variables；
9. 记录设计修改；
10. Codex 重新读取确认后的 Frame；
11. 将修改写回正式代码；
12. 重新进行 H5 和小程序验证。

Figma 官方说明，`generate_figma_design` 可把实时网页 UI 捕获到新文件、现有文件或剪贴板，并生成标准可编辑设计图层。它只适用于受支持的 MCP 客户端和远程 MCP。参见 [Code to canvas](https://developers.figma.com/docs/figma-mcp-server/code-to-canvas/)。

#### 回写注意事项

- 回写结果不是自动成为设计源；
- 捕获后需要整理图层和组件；
- 已有 Variables Library 应在捕获前加入目标文件；
- 每次回写标注来源路由、版本和日期；
- 不直接覆盖已确认设计，先放入待评审区域；
- 设计确认后再进入下一轮代码修改。

---

### 阶段 J：功能、质量与发布验收

#### 功能测试

- 主要用户流程；
- 表单校验；
- 登录和退出；
- 网络失败；
- 重复提交；
- 权限拒绝；
- 弱网；
- 空数据；
- 长文本；
- 多次返回和恢复；
- 数据刷新。

#### 视觉测试

- 关键视口截图；
- 深浅背景；
- 安全区；
- 键盘弹起；
- 横向溢出；
- 文本截断；
- 图片加载失败；
- 不同像素密度。

#### 工程测试

- TypeScript 检查；
- lint；
- 单元测试；
- H5 构建；
- 微信小程序构建；
- Playwright E2E；
- 资源体积检查；
- 控制台错误检查。

#### 发布前检查

- 环境变量不包含密钥；
- 开发、测试和生产接口已区分；
- 隐私政策和用户协议可访问；
- 微信平台要求的域名和资质已配置；
- 埋点事件定义一致；
- 错误监控可用；
- 版本号和变更记录已更新；
- 回滚方案明确。

---

## 9. 日常迭代工作流

每个功能或页面按以下步骤执行：

```text
1. 确认需求和验收条件
2. 确认 Figma Frame 与状态
3. 确认需要生成的图像资产
4. 获取设计上下文和截图
5. 制定最小实现计划
6. 实现共享组件或页面
7. 运行 H5
8. Playwright 截图对比
9. 修复视觉与交互差异
10. 构建微信小程序
11. 开发者工具和真机验证
12. 记录平台差异
13. 必要时回写 Figma
14. 人工确认
15. 合并并更新文档
```

### 9.1 单次任务应提供给 Codex 的信息

```text
任务目标：
需求文档：
Figma Frame：
目标路由：
目标平台：
目标视口：
需要覆盖的状态：
允许修改的文件：
禁止修改的行为：
参考截图：
验收命令：
```

### 9.2 单次任务的最小交付

- 可运行代码；
- 受影响文件说明；
- H5 验证结果；
- 微信小程序构建结果；
- 截图或视觉差异说明；
- 尚未解决的问题；
- 是否需要更新 Figma。

---

## 10. 设计与代码的来源优先级

出现冲突时按以下顺序判断：

1. 已确认的产品需求和法律/平台约束；
2. 最新批准的 Figma Frame 和交互注释；
3. Design Tokens 与共享组件；
4. 当前生产代码的有效业务行为；
5. AI 视觉方向图；
6. 临时截图和旧版本参考。

AI 视觉方向图只表达视觉意图，不自动覆盖已确认的产品结构和业务规则。

---

## 11. 人工确认点

以下节点必须由产品负责人或指定人员确认：

- MVP 功能范围；
- 用户流程；
- 低保真结构；
- GPT Image 视觉方向；
- 最终高保真页面；
- 重要交互变化；
- H5 与小程序平台差异；
- 视觉基线更新；
- Figma 回写内容进入正式设计区；
- 正式发布。

Codex 可以提出方案并执行技术工作，但不应自行决定品牌方向、删除核心功能或更改付费与隐私策略。

---

## 12. Definition of Done

一个页面只有同时满足以下条件才算完成：

- 需求和 Figma Frame 已确认；
- 默认、加载、空、错等需要的状态已实现；
- 使用共享 Token 和组件；
- H5 指定视口视觉对比通过；
- H5 无阻断性控制台错误；
- 微信小程序构建通过；
- 微信开发者工具验证通过；
- 关键平台能力经过真机验证；
- 图片已优化且来源已记录；
- 响应式和长文本经过检查；
- 可访问性基础要求已检查；
- 自动化测试已增加或说明不增加的理由；
- Figma 与代码的已知差异有记录；
- 相关文档已更新。

---

## 13. 常见错误与处理

### 错误：直接把 AI UI 图当成页面

处理：将其仅作为视觉参考，拆分为代码组件、图标和独立图像资产。

### 错误：网页完成后才第一次编译小程序

处理：每完成一个页面立即构建并检查小程序。

### 错误：Figma 图层全部是无语义 Frame

处理：先整理命名、组件、Variables 和 Auto Layout，再让 Codex读取。

### 错误：为了匹配截图大量绝对定位

处理：回到布局结构、容器尺寸和 Token，从根因修复。

### 错误：把 Figma MCP 输出直接当生产代码

处理：由 Codex 按项目组件、状态、接口和跨端约束重新实现。

### 错误：视觉回归失败后直接更新基线

处理：先判断是否为预期设计变化，只有经过人工确认才能更新基线。

### 错误：普通图标全部由 AI 生成 PNG

处理：优先使用一致的跨端图标组件；AI 只用于特殊、原创、不可替代的视觉资产。

### 错误：H5 与小程序强求所有交互完全相同

处理：保持业务目标和设计语言一致，允许平台导航、授权和支付流程采用原生方式。

---

## 14. 决策记录

影响技术架构、设计系统或平台体验的决策，应写入：

```text
docs/decisions/
```

记录模板：

```markdown
# 决策标题

日期：
状态：提议 / 已接受 / 已废弃

## 背景

## 备选方案

## 最终决定

## 原因

## 影响

## 后续复查条件
```

首批建议记录：

- 为什么选择 Taro + React；
- H5 与微信小程序的共享边界；
- Design Token 命名；
- 图标方案；
- 状态管理方案；
- API 与平台适配层；
- 视觉回归基线策略。

---

## 15. 当前项目下一步

本项目当前仍为空仓库，建议按照以下顺序开始：

1. 完成产品简介；
2. 整理 MVP 功能列表；
3. 建立页面清单和用户流程；
4. 创建 Figma 文件并按本文档分区；
5. 完成第一条核心流程的低保真设计；
6. 选择视觉方向；
7. 初始化 Taro + React + TypeScript；
8. 建立 Design Tokens 和基础组件；
9. 选择一个代表性页面跑通完整闭环；
10. 再扩展到其余页面。

第一条闭环应尽量选择同时包含以下元素的页面：

- 导航；
- 主内容；
- 列表或卡片；
- 一个主要操作；
- 一张视觉素材；
- 加载、空或错误状态中的至少一种。

跑通后，应能证明：

```text
Figma Frame
→ Codex 读取
→ Taro 页面实现
→ H5 运行
→ Playwright 截图验证
→ 微信小程序构建
→ 运行页面回写 Figma
→ 设计调整再次进入代码
```

---

## 16. 参考资料

- [OpenAI Image generation](https://learn.chatgpt.com/docs/image-generation)
- [OpenAI Image inputs](https://learn.chatgpt.com/docs/image-inputs)
- [Figma MCP Introduction](https://developers.figma.com/docs/figma-mcp-server/)
- [Figma MCP Tools and prompts](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/)
- [Figma Code to canvas](https://developers.figma.com/docs/figma-mcp-server/code-to-canvas/)
- [Figma MCP and agent responsibilities](https://developers.figma.com/docs/figma-mcp-server/mcp-vs-agent/)
- [Figma file structure guidance](https://developers.figma.com/docs/figma-mcp-server/structure-figma-file/)
- [Figma Code Connect integration](https://developers.figma.com/docs/figma-mcp-server/code-connect-integration/)
- [Taro React 概述](https://docs.taro.zone/docs/react-overall)
- [Taro 组件库说明](https://docs.taro.zone/docs/components-desc/)
- [Taro H5 标签与平台差异](https://docs.taro.zone/docs/use-h5/)
