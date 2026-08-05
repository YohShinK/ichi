# ICHI

ICHI 是面向一番赏玩家的用户侧产品，按照三个独立决策门逐步发展：V1 即时计算、V2 好版线索地图、V3 可信票池社群。最终客户端目标为微信小程序与同功能 H5 网页。

## 当前状态

- 当前活动区块：无。V1-B｜计算内核已于 2026-08-06 通过用户统一人工验收。
- 最近完成：V1-07—V1-17（含 V1-16A）全部转为 `COMPLETED`。
- 下一候选区块：V1-C｜会话、状态与本地数据，仍为 `LOCKED`；等待用户明确开始指令后再执行认知对齐并整组解锁。
- 应用代码：已批准的计算内核提供确定性事实、四方案比较、用户硬约束下的最少抽数、显著失败概率、无解保护和 Last 仅包套保证。

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
