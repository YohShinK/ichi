# TASK-V2-18｜500 点性能预算 v2

2026-09-25 收口注记：Founder 已确认本轮测试结果与性能预算工作完成，并明确要求收口 TASK-V2-18。预算阈值与本地回归证据按本文批准为 V2-E 输入；下文的 `QUANTITATIVE_DEVICE_EVIDENCE_PENDING` 是此前记录的证据状态，Worst 真机 JSON、FPS、内存／PNG 磁盘及真实账单仍无数值结论，分别交 TASK-V2-20／21。完整收口与认知对齐见 `docs/delivery/v2-d-task-18-closeout.md`。

日期：2026-09-24。Founder 明确要求以本次压力实验的最大档 **500** 为性能预算标准，并确认已多次操作 Worst 500，交互能够完整、流畅地完成。此前“同时可见 individual Native Marker 约 100 个以内”只是未经批准的候选，本预算撤回该候选；**不在正式产品加入 100 或 500 个 Marker 的新硬截断**。现有 500 snapshot 上限仍由已批准的公开读取合同约束。

本预算区分**容量目标**、**数值回归门**和**尚无可靠测量的设备指标**。Founder 的人工体验通过是真实证据，但不转换成 FPS、内存或零耗时数值。Worst 500 的导出尚未收到；两份所称 Worst 的附件经 JSON 对比实为同一条 Dense 500 记录。自动测试证明 Worst topology 能生成 500 个 individual binding，但不冒充真机提交记录。

## 1. 预算表

| 项目 | v2 预算／目标 | 本轮证据与判定 |
| --- | --- | --- |
| 规模与原生标记 | 500 条公开 lead 为压力容量；Worst 测试目标为同一视口内 500 个 individual native binding；Dense 正式聚合语义保持 | **Founder 指定容量目标**。自动 topology 测试达到 500；真机 Worst 500 由 Founder 人工接受，缺逐档 JSON 的实际 binding/视口计数，记 `DEVICE_COUNT_UNVERIFIED`。不得把 Dense 的 2 个 cluster 算作 500 个原生 Marker。 |
| 分页／快照／有效期 | 50 条／页、500 条／snapshot、120 秒 TTL；最多 10 页 | 已批准合同；本地 500 条／10 页通过。 |
| 响应体 | 每页 JSON ≤32,768 bytes；500 条完整分页合计 ≤327,680 bytes | **本地回归预算**。固定 fixture 最大页 30,588 bytes、合计 301,728 bytes，通过；正式字段和传输开销由 TASK-V2-19/21 复测。 |
| 本地 reference 查询 | 500 点 root P95 ≤3 ms；50 条 page P95 ≤2 ms | **同机 Node 回归预算**。21 轮 root P95 2.333 ms、分页 P95 1.318 ms，通过；不代表生产网络或 CloudBase。 |
| 本地聚合计算 | 500 点 high zoom P95 ≤10 ms；低→高→低三次合计 P95 ≤20 ms | **同机 Node 回归预算**。21 轮分别 6.712 ms、14.646 ms，通过；不替代真机页面完整投影。 |
| 500 点首次稳定代理 | Dense 单次目标 ≤3,000 ms；Worst 单次目标 ≤5,000 ms，均从 `START` 到首个完整 `setData` 回调 | **设备测试目标**，并非原生绘制或可点击 SLA。Dense 一次记录 2,039 ms，单次达到目标；Worst 缺导出，不能判定。正式验收需同设备重复记录，避免一次结果冒充 P95。 |
| 500 点持续手势流畅度 | 目标：采样帧间隔 P95 ≤33.3 ms（约 30 FPS）、无持续冻结／白屏／崩溃；Marker 无持续丢失或重复 | **后续设备门**。Founder 在 iPhone 16 Pro 主观验收通过，仅一次极轻微闪动；现有 JSON 没有 FPS 或逐帧时间，不能标数值通过。TASK-V2-20 低端 iOS／Android 矩阵再测。 |
| `setData` 与 PNG | 结束时 PNG 失败 0、pending 0；每档记录实际 native array 峰值、callback 时长与路径复用；不得按总 lead 数冒充 native 数 | Dense 500 为 0 失败、0 pending、array 峰值 2；Worst 原生数组峰值及回调仍缺真机导出。Dense 1,015 次 PNG 完成属于真实工作量，不得写为“无性能开销”。 |
| 包体 | 小程序源码 <2 MiB（2,097,152 bytes） | 最新压力版 preflight 1,327,580 bytes，通过，余 769,572 bytes；微信预览包 1,021,116 bytes。 |
| 增量月变量成本 | ≤¥20／月的已批准运营目标；沿用 100,000 次公开请求／月的条件情景 | 本地参数估算约 ¥11.02／月，低于目标；真实索引读量、压缩与账单由 TASK-V2-19/21 复核，不记为生产成本通过。 |
| 内存／GPU／临时 PNG 磁盘 | 设备矩阵中不得崩溃、被回收或无界增长；MiB／bytes 阈值待可靠采集后制定 | 当前微信 JSON 明确 `NOT_MEASURABLE_ON_CURRENT_TOOLING`；不虚构数值预算。属于 TASK-V2-20 的测量与停止门。 |

这些阈值是**不同测量层**：Node 回归毫秒不能与微信真机完整 projection 的 64 ms 中位／93 ms P95 直接比较；`setData` 回调不能当 FPS；主观流畅不能当内存证明。任何后续真实数据超出设备目标，应复核原因与用户可见影响，不通过调大阈值或强加 100 个 Marker 上限使报告“通过”。

## 2. 现有真机证据及导出核对

唯一收到的 JSON 为 `REALISTIC_DENSE / 500 / COLD_LIKE`：iPhone 16 Pro、iOS 26.2、微信 8.0.78、基础库 3.17.3；500 条载入、结束时 2 个 cluster／0 individual、首次稳定代理 2,039 ms、PNG 1,015 次完成／0 失败。其 64 次页面完整投影中有 44 次同步耗时 >50 ms；没有 FPS／内存指标。Founder 确认 Worst 500 多次操作均能完整完成，作为人工体验门通过；无法从该 Dense JSON 回填 Worst 的 native marker 峰值、首次稳定或 FPS。

导出路径审计：`START` 按当前面板 scenario 创建记录；`LOAD` 用同一 fixture 创建合成服务；仅 `WORST_CASE` 注入 individual topology。`END` 将结果保存到本机最近 8 条并立即复制当前存储数组；再次 `EXPORT` 也复制最近 8 条。代码没有把 Worst 记录重命名为 Dense 的转换。但面板在 `START` 后仍可切换场景，活动记录器继续使用 `START` 时冻结的 fixture；若此时将显示选择改为 Worst 再点 `LOAD`，面板选择与实际运行场景可能不一致。两份附件语义完全相同、均只含一条 Dense 500；不能断言这就是用户操作路径，也不能据此确定先前 Worst 记录为何未进入附件。最近 8 条裁剪和每次 `END` 更新剪贴板也会影响最终拿到的内容。

## 3. 状态与使用范围

- `500_CAPACITY_TARGET = FOUNDER_DIRECTED`；`100_VISIBLE_MARKER_CANDIDATE = WITHDRAWN`。这是容量和回归设计目标，不是正式产品新增的 density cap，也不改变身份、聚合或视觉。
- 本地规模、bytes、CPU、包体与成本**条件估算**已有可复现证据；Founder 真机交互体验门已通过。Worst 500 的真实 binding 数、FPS、Native/GPU memory、PNG 磁盘和生产账单仍不可量化判定。
- TASK-V2-18 保持 `BUDGET_DEFINED / QUANTITATIVE_DEVICE_EVIDENCE_PENDING`，不把“用户感觉流畅”写成所有数值门已通过；TASK-V2-19—22 与 V2-E 在现有区块门禁下保持锁定。TASK-V2-20/21 分别接设备矩阵与生产式网络／成本复核。
