# ICHI

ICHI 是面向一番赏玩家的用户侧产品，按照三个独立决策门逐步发展：V1 即时计算、V2 好版线索地图、V3 可信票池社群。最终客户端目标为微信小程序与同功能 H5 网页。

## 当前状态

- 当前活动区块：V1-C｜会话、状态与本地数据，状态为 `AWAITING_REVIEW`。
- 区块内工作集：V1-18—V1-25 自动验证、微信开发者工具验证和区块回归均已通过。
- 下一门禁：用户统一验收 V1-C；V1-D 及以后保持 `LOCKED`。
- 应用代码：已增加纯会话状态机、版本化 Storage、随包版面兼容、复制规则和受控识别 QA；bootstrap 仍只是工程验证入口，不是产品页面。

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
