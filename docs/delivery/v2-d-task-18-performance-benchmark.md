# TASK-V2-18 Performance Benchmark 补充报告

2026-09-24 Founder 指定以 **500** 为压力容量标准，撤回本报告旧版“可见 individual 约100以内”候选；新的分层预算与验证边界见 `docs/delivery/v2-d-task-18-performance-budget-500.md`。Founder 确认真机交互成功，500 档仅一次极轻微闪动；两份附件语义完全相同，均只有一条 iPhone 16 Pro 的 Dense 500 JSON，Worst 500 为 Founder 亲测无问题但缺导出。详见 `docs/delivery/v2-d-task-18-true-device-marker-stress-result.md`。不可量化 FPS／内存或 Worst 500 原生 binding 数。

状态：`IMPLEMENTED / AUTOMATED_GATES_PASS / BUDGET_DEFINED / QUANTITATIVE_DEVICE_EVIDENCE_PENDING`。此报告补足本地可测数值；新的500容量预算见独立预算文档。本地数据不代表微信真机 FPS 或生产网络。TASK-V2-19 仍锁定；未 deploy、migration、commit 或 push。

## 1. 环境、方法与复现

- 2026-09-24，本机 Apple M1 Pro／8 CPU、macOS arm64、Node v24.15.0、Vitest 4.1.10。输出含机器及采样次数：`artifacts/task18/performance-benchmark.json`。
- 可重复命令：`ICHI_RUN_V2_MAP_BENCHMARK=1 corepack pnpm exec vitest run tests/benchmarks/v2-map-performance.test.ts --reporter=verbose --silent=false`。默认全量测试跳过这项耗时基准。固定 fixture 在同文件：10/30/50/100/200/300/500 个公开 lead；本地 reference service 使用正式 page 50／snapshot 500／TTL 120s；只为21次本地重复采样临时提高测试实例的账户限频，不改变产品配置。
- 直接调用正式 `PublicMapService`、`presentPublicMarker`、`projectNativeMapMarkers`、`MarkerCanvasRenderer`、`MarkerImageCache`、`resolveCanvasMarkerProjection` 与 `PublicMapClient`。每规模21次 root/presentation/projection/split-merge 采样，报告 min／median／P95。root 服务耗时不含网络、CloudBase、索引或 UI setData。
- Canvas 使用**假 2D context 和假 `canvasToTempFilePath`**执行真实 JS 绘制命令、排队、render key、LRU 与 binding 适配；不会做真实光栅化、PNG 编码或文件写入。因此下述 PNG 时间只能称 `DRAW_COMMAND_PROXY`，不能当微信出图时间。`firstStableNodeProxyMs` 是单次完整本地分页→presentation→projection→假 Canvas→binding 链路，不含网络、原生地图或用户交互。
- 修复前数据保存在 `artifacts/task18/performance-benchmark-before-reuse.json`，修复后原始采样在 `artifacts/task18/performance-benchmark.json`。机器时间有抖动；计数和身份不变量可复验，跨运行耗时比较仅供方向判断。

## 2. 固定规模矩阵

单位：时间 ms，bytes 为 JSON 响应原文；`root` 为 min/median/P95；`cluster` 是高 zoom 单次正式投影 median/P95；`split` 是低→高→低三次合计 median/P95。`PNG cold/warm` 与首次稳定均为上述 Node 假 Canvas proxy。

| 可见 lead | root ms | root bytes / 全页 bytes | presentation median | 坐标投影 median | cluster median/P95 | split median/P95 | PNG cold/warm | first stable proxy | 最大 binding |
| ---: | --- | --- | ---: | ---: | --- | --- | --- | ---: | ---: |
| 10 | 0.160/0.172/0.268 | 6,340 / 6,340 | 0.014 | 0.003 | 0.044/0.091 | 0.111/0.798 | 1.640/0.104 | 0.715 | 10 |
| 30 | 0.409/0.443/0.593 | 18,081 / 18,081 | 0.032 | 0.003 | 0.084/0.133 | 0.193/0.337 | 0.631/0.184 | 1.264 | 30 |
| 50 | 0.620/0.661/0.808 | 29,837 / 29,837 | 0.031 | 0.004 | 0.117/0.295 | 0.291/0.619 | 0.710/0.227 | 2.311 | 50 |
| 100 | 0.671/0.699/0.919 | 29,904 / 59,777 | 0.061 | 0.007 | 0.360/0.875 | 0.826/1.595 | 1.619/0.517 | 4.316 | 100 |
| 200 | 0.742/0.814/1.001 | 29,904 / 119,732 | 0.129 | 0.014 | 0.949/1.557 | 2.237/2.929 | 2.670/1.124 | 7.932 | 200 |
| 300 | 0.773/0.790/1.086 | 29,904 / 180,912 | 0.174 | 0.022 | 2.087/2.860 | 4.930/6.505 | 3.979/1.226 | 12.369 | 300 |
| 500 | 0.936/1.475/2.333 | 29,904 / 301,747 | 0.271 | 0.034 | 6.170/6.712 | 12.374/14.646 | 5.762/2.164 | 21.683 | 500 |

100/300/500 的 JS 内存快照见第7节。7档均保持 `publicLeadId` 表示不变量，无重复、ghost 或漏点。高 zoom 的可见 Marker 数等于表中 lead 数；低 zoom 可聚成更少节点。表格是本机 CPU/JS 证据，不能从 21.683ms 推算微信首次可点击时间。

## 3. Query、pagination 与 rapid pan

- 500 snapshot 连续10页，每页50；每页 bytes 依次为 `29,902 / 29,938 / 29,963 / 29,988 / 30,588 / 30,588 / 30,588 / 30,263 / 29,988 / 29,922`，合计 **301,728 bytes**。分页本地服务 latency min/median/P95 = **0.765/0.842/1.318ms**；末页 cursor 为 `null`，500个身份唯一。root 各规模数据见上表；50项以后的 root bytes 约29.9KB，新增规模主要增加页数和总 bytes。
- 12次快速改变 bbox 的**直接 PublicMapClient 压力测试**发出12次请求、11个迟到响应被 generation 丢弃、仅最新一次终态提交；本机调度 CPU/微任务耗时约0.6ms。它有意绕过页面的 `regionchange end` 180ms debounce，故不能写成正式 `map-preview` 每次 pan 发12个请求。正式宿主代码有180ms debounce、已加载 bbox 跳过请求及 zoom 180ms限频；**真实宿主请求数与取消数尚未在微信运行时计数**，记 `NOT_MEASURABLE_WITH_LOCAL_NODE`。
- 相同视口二次 PNG 投影：修复后10/30/50/100/200/300/500档分别复用当前已提交绑定10/30/50/100/200/300/500个，新增 PNG 导出0、图标路径替换候选0。正式页面的 no-change signature 守卫可跳过无变化 native binding 写入，但本地测试没有测 `setData` 耗时。
- 这组独立 reference service 采样不含共享响应缓存；正式产品也未设置共享 server response cache。因而本报告的 cache hit/miss 是图片 LRU 与已提交 binding 的诊断，不能当网络响应 cache hit ratio。

## 4. Cluster、zoom、dense 与 picker

21轮高 zoom cluster median 从10点0.044ms升至500点6.170ms，P95从0.091ms升至6.712ms；低→高→低三次 median 从0.111ms升至12.374ms。200点后耗时开始明显加速：100→200 高 zoom median约2.6倍，200→500约6.5倍。仍保持所有 lead 身份。

高密度近点：100/300/500点分别为1个 cluster、0个 individual marker，单次 Node 投影 **0.221/1.039/2.668ms**；20个完全同坐标保持1组并触发既有不可分离 picker 规则，20个混合位置得到4组。`clusterStressFixture` 及既有 picker 回归验证选择仍按每个 `publicLeadId`，没有合并 BoardInstance。

100点的 slow-in/out、fast-pinch、reverse-pinch、zoom+替换25个可见 lead 的本地完整序列分别耗 **5.836/4.629/1.959/3.780/5.070ms**；500点分别 **49.061/50.656/14.607/36.907/31.379ms**（单轮代理）。对应序列的 binding 变化候选为5/5/2/5/4次，最大数组长度100或500；全程 identity invariant PASS。序列每个观测都计算，**没有模拟页面真实 pinch 限频或 native setData**，故次数是上界候选，不能写成实际设备提交次数。多档首次生成模拟 PNG：500点 slow-in 1,022次导出调用；这是因低 zoom 的 cluster 与高 zoom 的不同可见 lead/视觉档位，不是同视口重复渲染。

## 5. PNG renderer/cache、修复前后

`MarkerCanvasRenderer` 的绘图命令、render key、串行队列和 `MarkerImageCache` 为真实代码，2D 绘图方法和临时文件导出由 Node 假接口替代。单张首次绘图命令耗时的 median 在多数档约0.008–0.014ms（10点首轮受预热影响 median 0.046ms）；不包含真实 raster/PNG 编码。500个不同 key 的冷投影调用500次导出，LRU只保存192条，观测 pending peak=1。Node 假导出不落盘，不能测真实临时 PNG 个数、目录体积或平台清理时间。

修复前同序重访超过192个 key 时发生 LRU 扫描淘汰：200/300/500个 key 的第二次分别再 miss **200/300/500**，对应图标路径替换候选 **200/300/500**。原始 warm proxy 分别约 **3.102/3.464/5.364ms**。修复后 `resolveCanvasMarkerProjection` 优先使用已提交投影中相同 `nodeId + renderKey` 的 PNG 路径；正式页面只在 Canvas 已就绪时提供该投影。200/300/500 的第二次导出均为 **0**、图标路径替换候选 **0**，warm proxy 约 **1.124/1.226/2.164ms**；选中状态改变仍生成新 key/PNG，回归测试验证200个唯一 key、192项 LRU与单条选中变化。此策略复用已经显示的绑定，不扩大192项 LRU，不改 Marker 视觉、坐标或合同。

修复后 cache 诊断的二次 `hits=0` 是因为复用发生在 LRU 查询之前；**有效视觉复用率为100%**，不要把该计数误读为零复用。跨视觉档位仍需新出图，500点五档序列产生大量模拟导出；实际微信 PNG 编码、磁盘增长和 GPU/Native 内存均为 `NOT_MEASURABLE_WITH_LOCAL_NODE`。

## 6. Native binding 可测边界

本地能得到 binding 数组大小、`iconPath` 路径是否变化和按正式页面签名规则推导的**提交候选**；相同视口重访后0个图标路径变化。首次高 zoom 10/30/50/100/200/300/500档分别有相同数量 binding，500为本轮最大。真实 `setData` 回调耗时、微信 native Marker 实例化、帧间卡顿和 FPS：**`NOT_MEASURABLE_WITH_LOCAL_NODE`**。CLI 编译不会提供这些运行指标。建议 TASK-V2-20 真机／DevTools性能面板记录 setData次数、每次数组长度、长任务、FPS/jank及首次可交互时间。

## 7. JS heap、process RSS 与临时文件

同一 Vitest worker 的观察值，单位 MiB：

| 阶段 | JS heap used | process RSS |
| --- | ---: | ---: |
| benchmark 前 | 15.0 | 73.5 |
| 100 marker 后 | 21.2 | 100.3 |
| 300 marker 后 | 22.7 | 147.5 |
| 500 marker 后 | 55.7 | 223.9 |
| pagination／zoom／100次500点投影后 | 66.1 | 212.4 |

单独100次500点交替投影前/后为 heap **51.8→66.1 MiB**、RSS **236.8→212.4 MiB**；最后 identity invariant PASS。该进程还保留测试服务的多轮 snapshots、结果数组、假 Canvas 输出与 Vitest 自身数据，且没有强制 GC，故不能把整体增长归因于产品内存泄漏，也不能据此宣布无泄漏。真实微信 JS heap、Native/GPU memory 和临时 PNG 目录占用：`NOT_MEASURABLE_WITH_LOCAL_NODE`，留给 TASK-V2-20。假 `canvasToTempFilePath` 返回虚拟路径且不写文件，因此不存在可诚实报告的真实磁盘 bytes。

## 8. 微信构建、包体与性能拐点

微信开发者工具 CLI 对当前正式 `map-preview` 工程 preview **PASS：994,294 bytes**；V1 2 MiB source gate **PASS：1,290,399 bytes，余806,753 bytes**。编译未提供可自动提取的100/300/500点 FPS 或原生绑定耗时；本轮不将预览包体误称为真机性能。

- **10–50**：本地 high cluster median≤0.117ms，1页以内、≤29,837 bytes、PNG cold proxy≤1.640ms；属于此测试机上的低计算量区间。
- **100**：2页59,777 bytes，high cluster median0.360ms、split median0.826ms、首次稳定代理4.316ms；本机 JS 仍平稳，但100个 native Marker 的设备表现待测。
- **200**：4页119,732 bytes，high cluster median0.949ms、split2.237ms、首次稳定代理7.932ms；这里是原192项 LRU thrash的明确拐点。已修复同视口重访，但冷启动和跨档仍要生成200张不同视觉图。
- **300**：6页180,912 bytes，high cluster median2.087ms、split4.930ms、首次稳定代理12.369ms；300 binding/图像及内存成本需要设备证据。
- **500**：10页301,747 bytes，high cluster median6.170ms、split12.374ms、首次稳定代理21.683ms；主要剩余风险是500个 Native Marker、跨档 PNG 编码/临时文件、实际网络和 GPU/setData，而不是本机单次 query。高密度恰好聚成1个可见 Marker 时成本较低，但不能假设所有500点都会聚合。

## 9. 自动验证

- 固定矩阵 benchmark 显式运行通过；全量 Vitest **85文件通过／1文件默认跳过，926测试通过／1测试默认跳过**。默认跳过项就是需显式开启的性能基准。
- TypeScript、ESLint（含 benchmark 文件）、合同与 workflow validator、触及文件 Prettier、`git diff --check`、Next production build 均通过；Web Playwright **26/26** 通过。
- 微信开发者工具 CLI preview 与 V1 2 MiB source preflight 通过，数值见第8节。CLI 证明编译与包体，不证明真机性能。

## 10. 给 Founder 的性能预算候选与结论

以下是形成 v2 预算前的**历史候选**；其中第1项的约100个 individual 建议已由 Founder 指定的500容量目标取代，当前执行口径只看 `docs/delivery/v2-d-task-18-performance-budget-500.md`：

1. 历史候选：首发优先把**同时可见的 individual Native Marker 控制在约100个以内**。**已撤回，不得实施为产品硬上限。**
2. 每页响应 JSON 的规划候选约 **≤32KB/50项**、500项完整分页约 **≤320KB**；本地 fixture 最大单页30,588 bytes、全页301,728 bytes。正式字段和传输开销需接入后重新测。
3. 本机 JS cluster 的参考候选：100点 high zoom P95≤1ms、500点 P95≤10ms；这是**本机回归预算候选**，不能当低端设备帧预算。真机 FPS、长任务、PNG磁盘与内存必须另定数值。

**具备预算与本地回归证据**：固定规模矩阵、min/median/P95、分页 bytes、密集/重叠身份、快速请求 latest-wins、PNG LRU拐点及修复前后、JS内存代理、编译包体均可复现。**尚不足以证明 TASK-V2-18 所有性能验收已关闭**：实际 map-preview pan 请求数、Worst 500 原生绑定数／时间／FPS、真实 Canvas PNG 编码及磁盘、低端机内存仍缺可量化结果。预算已按500目标定义，状态为 `QUANTITATIVE_DEVICE_EVIDENCE_PENDING`，TASK-V2-19 不解锁。

**BUDGET_DEFINED / QUANTITATIVE_DEVICE_EVIDENCE_PENDING**
