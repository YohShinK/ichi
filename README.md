# ICHI

ICHI 是面向一番赏玩家的用户侧产品，按照三个独立决策门逐步发展：V1 即时计算、V2 好版线索地图、V3 可信票池社群。Next.js 手机优先网页已经完成并通过整套页面人工验收，是小程序全部页面、内容、组件、视觉、动效与交互的批准基线；最终产品交付为微信小程序，后续只做一比一照搬及必要的平台语法／API 适配。

## 当前状态

- 当前活动区块：V1-E｜最终小程序页面实现（`IN_PROGRESS`）；V1-31—V1-39 全部为 `READY`。
- 最近完成区块：V1-D｜产品设计与组件；V1-26—V1-30F 已于 2026-08-11 通过用户统一人工验收。
- 下一门禁：完成 V1-E 的逐页一比一照搬、平台自动验证和人工验收后，才解锁 V1-F。
- 应用代码：Next.js 的 `网页 ui.html` 页面壳、`V1-29 UI Design Tokens`、局面可能性、情境提醒和全部已验收交互构成完整批准基线；微信小程序壳及 Storage 适配器只提供工程与平台验证基础，不是视觉基线。真实账号、云同步、OCR 核对和上传仍未接入。

## 正式入口

1. [PRD](PRD.md)
2. [产品设计文档](memory-bank/design-document.md)
3. [技术栈](memory-bank/tech-stack.md)
4. [V1—V3 实施计划](memory-bank/implementation-plan.md)
5. [当前进度](memory-bank/progress.md)
6. [仓库架构](memory-bank/architecture.md)

## 文档优先级

```text
design-document.md   产品行为与验收
        ↓
tech-stack.md        技术实现边界
        ↓
implementation-plan.md  区块顺序、step 范围与验收门
        ↓
progress.md          当前活动区块、工作集与验证记录
        ↓
architecture.md      已存在文件和代码职责
```

`docs/references/`、`docs/methodology/`、`product-atlas/` 和 `canvas/` 保留早期研究、NeoPRD 与无限画布实验，但不再作为正式开发依据。

Agent 执行纪律见 [AGENTS.md](AGENTS.md)。
