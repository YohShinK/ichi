# TASK-V2-18 真机 Marker 压测｜Founder 结果复核

2026-09-25 收口注记：Founder 已批准 TASK-V2-18 收口；以下仍是 2026-09-24 原始证据复核，不因任务关闭而补造 Worst JSON 或设备量化指标。缺口按 `docs/delivery/v2-d-task-18-closeout.md` 交由 V2-E 对应任务验证。

日期：2026-09-24。Founder 确认已完成全部档位，并认为压力测试全部成功；`Worst 500` 亲测无问题，500 档另有一次极少、轻微闪动，未影响其通过判断。此处把**人工体验结论**记为 `PASS / FOUNDER_ACCEPTED`，保留这一次闪动供后续设备矩阵复核。

后续 Founder 再次提供的 `/Users/cunfu/Downloads/[ 2/[.md` 与第一份附件在 JSON 内容上完全一致，仍是同一条 Dense 500；因此没有新增 Worst 数值。Founder 指定的 500 容量预算见 `docs/delivery/v2-d-task-18-performance-budget-500.md`。

## 已收到的原始记录

附件 `/Users/cunfu/Downloads/[/[.md` 可解析为 **1 条** JSON 结果，已原样按数据结构保存到 `artifacts/task18/true-device-marker-stress/dense-500-cold-founder.json`。该条是 `REALISTIC_DENSE / 500 / COLD_LIKE`，并非 `WORST_CASE / 500`。Founder 说明 Worst 500 也已测试且无问题；本轮未收到其 JSON，不补造该档数值。

设备：iPhone 16 Pro（`iPhone17,1`）、iOS 26.2、微信 8.0.78、基础库 3.17.3；预览构建 `TASK18-STRESS-2026-09-24-1`，`envVersion=develop`。这是单台较新 iPhone 的证据，不替代 TASK-V2-20 设备矩阵。

| Dense 500 导出字段 | 实际记录 | 解读 |
| --- | ---: | --- |
| 加载条目 / 查询 | 500 / 10 页 | 500 条合成数据成功载入。 |
| 最终视口内条目 | 167 | 结束时视口只覆盖部分条目；不能用它证明 500 条同时在屏内。 |
| 最终 individual / cluster | 0 / 2 | Dense 走聚合；这一条不测 500 个原生 individual Marker。 |
| 首次稳定 `setData` 回调代理 | 2,039 ms | 不是原生绘制耗时或首次可点击时间。 |
| projection | 64 次、总 3,772 ms、中位 64 ms、P95 93 ms、最大 108 ms | 其中 44 次同步计算超过 50 ms；不是 FPS 或系统 long-task 测量。 |
| binding | 14 次；数组峰值 2；最长一次回调 1,033 ms | 反映本条的两个聚合 Marker，并非 500 个 individual binding。 |
| PNG | 1,015 次尝试／完成、0 失败；结束时 pending 0 | 存在实际绘制工作量；不能推断 GPU／磁盘或“零开销”。 |
| 交互／状态 | marker tap 7、detail 请求 11、stale projection 26；split / merge 0 / 0 | 无导出错误；无法凭这一条证明每个手势阶段及拆合分支都已覆盖。 |

此条导出的 `phases` 只有 `COLD_LOAD`；`manualNotes` 为空。Founder 口头确认已完成全部操作，机器结果没有分阶段标记，因此分阶段时长和过程不能从该 JSON 单独核对。`insideViewportCount=167` 是结束时的视口，不等同于首次载入时的视口。

## 判定边界

- **已确认**：Founder 在该 iPhone 上的主观体验通过；Dense 500 数据完整载入、聚合与原生绑定有结果、PNG 导出无失败、结束时无待处理 PNG；Worst 500 由 Founder 亲测表示无问题。
- **没有被这份数据证明**：“完全不会卡顿／性能没有任何影响”这样的零影响结论、Worst 500 的实际 individual binding=500、真实 FPS／Native 或 GPU 内存、低端机与 Android 体验、生产网络与成本。导出的同步计算耗时和首次稳定代理已经表明存在工作量，但它们也不能反推用户一定感受到卡顿。
- 因而真机压力测试人工门可按 Founder 决定记为 `PASS / FOUNDER_ACCEPTED`；500容量预算已经定义，但 TASK-V2-18 整体仍待缺失的设备量化指标验证。TASK-V2-19—22 与 V2-E 保持锁定，不因这一条记录自动解锁。
