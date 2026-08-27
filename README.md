# ICHI

ICHI 是面向一番赏玩家的用户侧产品，按照三个独立决策门逐步发展：V1 即时计算、V2 好版线索地图、V3 可信票池社群。Next.js 手机优先网页已经完成并通过整套页面人工验收，是小程序全部页面、内容、组件、视觉、动效与交互的批准基线；最终产品交付为微信小程序，后续只做一比一照搬及必要的平台语法／API 适配。

## 当前状态

- 当前活动区块：V1-F｜跨端质量与小程序发布门（`IN_PROGRESS`）；已按 2026-08-14 新范围重新打开 V1-40—V1-47，并新增 V1-43A—V1-43I，V1-48 保留为人工决策门。
- 最近完成区块：V1-E｜最终小程序页面实现；V1-31—V1-39 已于 2026-08-13 完成自动验证与用户授权的统一人工验收。
- 下一门禁：V1-F 完成并由 V1-48 明确批准后，才能解锁 V2-A。
- 应用代码：Next.js 页面壳、`V1-29 UI Design Tokens` 和全部已验收交互构成批准基线；微信小程序已覆盖 V1-31—V1-39。V1-F 当前使用千问 `qwen3.7-flash` 单模型、单次整版多模态识别，按 `ichi-board-vlm-3.0.0-rc1` 与 `board-provider-extraction-3.0.0-rc1` 抽取中文主 IP、原始 IP 文本、可选主题和逐排票位证据；赏票核对使用独立的版本化协议。账号与位置先于识别、每日 5 次有效识别配额、照片临时使用后删除、本人私有结构化记录、服务端六位码、CloudBase 定时维护和删除链路均属于本区块。公共地图、现实版面合并、Luna 实际治理、审核和发布仍锁定在 V2。

## 独立延后分区

[`apps/xhs-local-tool/`](apps/xhs-local-tool/) 已建立为小红书笔记可挂载的纯本地小工具分区。该目标不属于微信小程序 V2／V3，不含账号、位置、网络、CloudBase、地图或多人协作；当前只记录平台规则和粗粒度迁移计划。必须等待微信小程序 V1 全部开发并通过验收后，再以稳定 V1 为输入做复用、替换、删除和新增，不提前选择框架或编写代码。

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
