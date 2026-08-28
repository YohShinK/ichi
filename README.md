# ICHI

ICHI 是面向一番赏玩家的用户侧产品，按照三个独立决策门逐步发展：V1 即时计算、V2 好版线索地图、V3 可信票池社群。Next.js 手机优先网页已经完成并通过整套页面人工验收，是小程序全部页面、内容、组件、视觉、动效与交互的批准基线；最终产品交付为微信小程序，后续只做一比一照搬及必要的平台语法／API 适配。

## 当前状态

- 当前活动区块：无。V1 development blocks 已全部 `COMPLETED / CLOSED`；当前唯一活动计划是 `V1.0.0 WECHAT SUCCESSFUL PUBLICATION`，checkpoint 为等待微信审核。V1.0.1 与 V2 仅为 backlog，尚未启动。
- 最近完成区块：V1-F｜跨端质量与小程序发布门；开发、自动验证、真机 blocker、release candidate、release commit、备案／上架准备和微信送审均已完成。
- 下一门禁：等待微信审核；通过后由用户正式发布并完成最小线上确认，随后关闭 V1 milestone。V1.0.1 与 V2 不自动解锁。
- 应用代码：V1.0.0 source 已冻结在 `release/v1-freeze-20260828@f6aa06fca21104a0a406823e5e8c6cc4ab493ab7`。版面识别 R2、Local Board／Upload Submission／Current Cloud Publication、账号／位置／每日配额、照片临时使用后删除、私有结构化记录、CloudBase 定时维护与删除链路均已完成；公共地图、现实版面合并、治理和多人协作仍属于 V2 backlog。

## 独立延后分区

[`apps/xhs-local-tool/`](apps/xhs-local-tool/) 是小红书笔记可挂载的纯本地小工具分区，状态为 `POST-V1 / DEFERRED / USER_DECISION`。它不属于微信小程序 V1 successful publication、V2 或 V3，也不会因 V1 开发完成而自动启动。

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
