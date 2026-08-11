# V1 本地版面渲染契约

本目录定义“识别数据如何变成本地组件计划”。Next.js 网页先用 React/HTML/CSS 中间组件验证 schema、顺序和降级；最终产品再把同一计划转译为微信小程序的 WXML/WXSS。本目录不是任一端的页面实现。

## 两种同时存在的视图

1. `sourceMap`：只读二维预览，按照识别到的 0—1 坐标还原元素在原版面中的相对位置。
2. `mobileFlow`：手机可读、可编辑的线性／双列重排，严格保留识别给出的阅读顺序和原始坐标引用。

完整版面的示意关系如下，实际视觉样式尚未设计：

```text
┌──────────────────────┐
│ 标题             价格 │
│               总抽数 │
│ A 赏             B 赏 │
│ C 赏                  │
│ Last             说明 │
│                 二维码 │
└──────────────────────┘
```

窄手机会按同一阅读顺序折成单列；普通与宽手机只允许同一原始行内的安全组件组成双列，避免缩成不可读的海报。

## 安全边界

- 组件类型只能查找随包注册表中的本地 renderer；识别响应不能指定 renderer。
- `unknown_block` 只能映射到不可执行的 `UnknownBlock` 占位组件。
- 未注册组件类型拒绝整份渲染计划并保留上一个可用状态。
- 远程 WXML、脚本、样式、HTML 或 renderer URL 永不接受；网页和小程序都只能使用随包本地 renderer。
- `retake_required` 只展示只读局部预览和重拍动作，不生成可保存票池。

## 文件

- `schema/render-plan.schema.json`：渲染计划结构；
- `registry/render-policy.json`：状态、组件映射、顺序、断点、降级和安全规则；
- `fixtures/complete-render-plan.json`：完整图的二维预览与手机重排计划；
- `fixtures/partial-retake-plan.json`：缺图时的只读预览和重拍计划；
- `scripts/validate-render-contract.mjs`：验证 A—Z、映射、顺序、坐标、响应式、安全拒绝和固定计划。

## 验证

```bash
node scripts/validate-render-contract.mjs
```
