# TASK-V2-18 真机 Native Marker 压力实验｜实现记录

状态：`FOUNDER_TRUE_DEVICE_STRESS_TEST_ACCEPTED`。Founder 于 2026-09-24 确认全部压力测试成功；500 档曾有**一次极少、轻微的闪动**，仍判定为可接受。随后收到一条 `REALISTIC_DENSE / 500 / COLD_LIKE` 原始 JSON；`WORST_CASE / 500` 由 Founder 亲测确认无问题，但尚无该档导出文件。逐项数据和证据边界见 `docs/delivery/v2-d-task-18-true-device-marker-stress-result.md`。Founder 已指定500容量预算，详见 `docs/delivery/v2-d-task-18-performance-budget-500.md`；设备量化指标尚未验证，整个 TASK-V2-18 尚未关闭。TASK-V2-19—22 继续锁定。无 CloudBase 接入、deploy、migration、commit 或 push。

## 实现与边界

- 在唯一正式 `pages/home/index` 的 `map-preview` 内增加预览专用面板和采集钩子，长按左上角 ICHI 打开。`isMarkerStressPreview` 只允许微信 `envVersion=develop`；release/trial 或读取失败时入口无效、面板默认不挂载，URL 参数也不会激活它。面板不修改正式 Marker 视觉、地图样式、业务筛选、详情或发布路径。
- `platform/marker-stress-benchmark.ts` 提供本地合成 `PublicMapService`、固定场景、只用于 Worst Case 的 individual topology override 和 JSON 记录器；`public-map-native-presentation.ts` 的可选 override 未传时仍使用原聚合算法。正式页面的 Canvas PNG renderer、192项 LRU、五档 zoom、latest-wins、原生 `iconPath` binding 与详情选择链继续复用。
- `marker-image-cache.ts` 和 `marker-canvas-renderer.ts` 只新增只读诊断计数，不改缓存容量、render key、导出队列顺序或图片内容。合成服务不访问 CloudBase、生产数据库或真实公开线索。
- 仪表面板记录请求目标、已载入 lead、individual/cluster/picker 候选组、zoom/viewport、PNG miss/hit 与 renderer queue、binding commit 数和数组峰值。`START/LOAD/阶段切换/END/EXPORT` 保存最多八档 JSON 到本机 storage，并复制全部结果到剪贴板；每档也输出 console JSON。

## 两种场景与物理限制

Worst Case 的 100/300/500 合成点都落在约 0.0018°×0.0015° 的初始中心区域。自动测试证实每档的 topology、Native Marker view 和 binding 分别恰好为 100/300/500 个 individual、0 个 cluster，身份不重复。运行时还记录 `insideViewportCount`，由设备实际 `getRegion()` 核对位置；若不等于请求数，结果不能称为“都在屏内”。

**这不是 500 张互不重叠的信息卡。**当前 PNG 最小碰撞 footprint 约 72×68 像素，普通手机屏幕无法容纳 100/300/500 张互不重叠卡。若继续用正式碰撞聚合，几百个点不会成为几百个原生 Marker。因此 Worst Case 只在预览基准中强制 individual topology，测微信原生 binding/绘制上限；卡片可在屏幕上重叠，点击性能结果需按这一限制解释。正式产品未加入“最多100”硬上限，也没有关闭聚合。

Realistic Dense 在同一区域生成六个空间组，含完全同坐标点和可分离近点，始终走正式 cluster engine、max-scale 不可分离分类及 picker。每档输出随手势变化的 individual、cluster、picker 候选组数；自动测试验证身份不变量和实际聚合。合成服务分页50项，500项走10页；为了在平移后维持固定压力样本，benchmark 会记录并抑制视口查询候选，`queryCount` 因此只是基准服务实际请求数，**不能当生产 pan 网络 QPS**。

## Cold、Warm 与记录范围

`RESET / COLD RELOAD` 使用 `wx.reLaunch` 重建当前页面，清理该页持有的 fixture、统计、timer、generation、binding、renderer 和 LRU；它不重启微信 JS 进程，也不可靠删除平台临时 PNG，所以结果精确标为 `COLD_LIKE`。真正进程冷启动需手工彻底退出并重新扫码，无法靠按钮保证。连续 `LOAD CASE` 不重载页面，保留同页 PNG cache 和 binding，标为 `WARM`。原正式 LRU 的生产语义未改。

自动记录：每档开始时间与首个完整 PNG binding 的 `setData` 回调代理耗时、阶段起止、regionchange 次数、视口 query 候选、实际合成服务 query/detail 请求、projection 次数/总耗时/峰值、split/merge、stale projection、PNG render 尝试/完成/失败、LRU hit/coalesced/pending peak、renderer queue peak、不同 render key/临时路径计数、每次 binding 数与 setData 回调等待、路径复用/替换、Marker 点击数和当前视口。`firstStable` 只表示 JS 图片准备加 `setData` 回调，**不是 native paint/FPS 或真正首次可点击时间**。

当前工具不能可靠读取微信 Native/GPU memory、FPS、平台临时 PNG 目录 bytes 或真正原生绘制完成时间，JSON 明标 `NOT_MEASURABLE_ON_CURRENT_TOOLING`。JS 的 `setData` callback 等待值、render queue 与 `getRegion` 是代理；人工备注栏补记闪白、ghost、迟钝、崩溃等观察，必要时附微信开发者工具性能面板截图。真机完整设备矩阵仍归 TASK-V2-20。

## 构建与自动验证

- `TASK18-STRESS-2026-09-24-1` 同一微信 CLI preview：**PASS，1,021,116 bytes**，包体见 `artifacts/task18/true-device-marker-stress/preview-info.json`，二维码见同目录 `preview-qr.jpg`。二维码文件是 JPEG；未上传正式版本。
- V1 2 MiB source preflight：**PASS，1,327,580 bytes**。
- 全量 Vitest：**86文件通过、1文件默认跳过，935测试通过、1测试默认跳过**；定向 benchmark、PNG cache/binding 与 map canvas 回归通过。TypeScript、ESLint、contracts/workflow、Next production build 与 `git diff --check` 通过。Web Playwright 首轮25/26通过，末项 `map-page visual corrections preserve the source shell` 在等待 iframe bridge 时超时；单独重跑该项 **1/1通过**。此项属于未改动的 Web 宿主，首次超时不作为微信真机性能证据。
- 自动测试验证 develop/release/trial 门禁、六档 fixture、Worst 精确 binding 数、Dense 聚合与完全同坐标、500项10页，以及 JSON 指标结构。微信 CLI 只验证构建，不替代真机可见性或性能结果。

## Founder 真机反馈与后续判定

- 2026-09-24 Founder 确认“所有测试均无问题”，认为本次压力测试全部成功。500 档出现过一次极少、轻微闪动；未报告崩溃、白屏或持续异常。闪动作为已知观察保留，后续 TASK-V2-20 设备矩阵复核，不擅自修改正式 Marker 或加入 100 点硬上限。
- 后续提供的附件仅含 Dense 500 一条完整 JSON，记录了 iPhone 16 Pro／iOS 26.2／微信 8.0.78／基础库 3.17.3，以及 500 条载入、最终 2 个 cluster、0 个 individual、首次稳定代理 2,039 ms 等数据。完整分析见结果复核；其他档位和 Worst 500 的逐档 JSON 未收到。FPS、Native/GPU memory、PNG 磁盘、真实网络及生产成本仍不可判定，不补造数值。
- 真机压力测试人工门：`PASS / FOUNDER_ACCEPTED`。完整 TASK-V2-18 的性能预算决策仍待处理；TASK-V2-19—22 保持锁定。

**FOUNDER_TRUE_DEVICE_STRESS_TEST_ACCEPTED / TASK_V2_18_BUDGET_DECISION_PENDING**
