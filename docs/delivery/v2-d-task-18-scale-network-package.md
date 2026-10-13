# TASK-V2-18 Scale / Weak Network / Package 交付报告

2026-09-24 预算更新：Founder 指定500为容量标准，撤回约100个可见 individual 的历史候选；分层阈值与尚缺真机数值见 `docs/delivery/v2-d-task-18-performance-budget-500.md`。本报告以下 `MISSING_APPROVED_BUDGET` 仅反映编写时的旧状态，不再是当前预算入口。

2026-09-24 性能补充：固定规模基准、192项 LRU 重访抖动修复与修复前后原始数据见 `docs/delivery/v2-d-task-18-performance-benchmark.md`。本报告以下包体和规模数值是此前一轮基线；补充后的微信 CLI preview 为994,294 bytes，source preflight 为1,290,399 bytes。性能预算仍须 Founder 决定。

状态：`IMPLEMENTED / AUTOMATED_GATES_PASS / AWAITING_FOUNDER_REVIEW`。结论是本地合同、规模、弱网与包体证据已足够进入 Founder 审核；正式延迟／帧率／可见 Marker／响应 bytes 数值预算尚未获批，不能据此宣称这些指标达标。TASK-V2-19—22 仍锁定。无 CloudBase deploy、migration、commit、push、PR、merge 或 tag。

## 1. 实现与文件

- `apps/client/miniprogram/platform/public-map-client.ts`：客户端默认 page 50；root、pagination、detail 的 Promise 拒绝转稳定、无内部报错文本的 `SERVICE_UNAVAILABLE`，保留已有 root/page 数据，恢复仍由用户显式触发，不做无限自动重试。
- `apps/client/miniprogram/pages/home/index.ts`：唯一正式 `map-preview` 宿主请求 page 50。
- `apps/client/miniprogram/platform/public-map-cluster-engine.ts`：把前一 topology 的所有成员两两关系改为 lead→cluster 映射。碰撞滞回、真实坐标、cluster identity 与选择规则不变；历史集合空间由最坏 O(n²) 降至 O(n)。
- `packages/v2-map/src/avatar-projection.ts`：签名 URL issuer 抛错时回退本地默认头像；已有过期、非法 URL、未授权回退保持。
- 新增 `apps/client/miniprogram/platform/public-map-scale-network.test.ts`、`packages/v2-map/src/avatar-projection.scale.test.ts`；扩展 `packages/v2-map/src/task-v2-13.test.ts`；更新既有客户端和页面测试。20点聚合 fixture 从小程序生产目录迁至 `tests/fixtures/public-map-cluster-picker.fixture.ts`。
- 新增 `scripts/audit-v2-map-package.mjs` 和输出 `artifacts/task18/package-asset-audit.json`；同步更新 architecture、tech-stack、implementation-plan、progress。本报告是本任务交付记录。

## 2. 批准预算、依据和缺口

| 项目 | 已批准值／来源 | 本轮证据 |
| --- | --- | --- |
| 每页 | 50；`memory-bank/implementation-plan.md` TASK-V2-18 / D09-07，`packages/v2-map/src/public-api.ts` | 正式客户端、server、测试一致 |
| snapshot | 500；同上 | 650 candidates → 500 refs，10页后无 cursor |
| TTL | 120s；同上、`public-map-cache.ts` | server cursor 过期及 client stale cache 测试 |
| query/detail 账户限频 | 30/60 次每分钟 pilot default；`D09_PILOT_DEFAULTS` | rate/global read-stop 既有 contract tests |
| PNG 缓存 | 192 条 LRU；已批准 TASK-V2-17 基线 | 500个视觉 key 后仍为192条；复访192次命中 |
| package | <2 MiB；V1 preflight 与 TASK-V2-18 | 源码1,289,563 bytes、微信 preview 约0.99 MB |
| V2 增量月变量成本 | ≤¥20；D09-11 operational target | 第10节的参数化计划估算；无实际账单 |
| latency、QPS、payload bytes、native binding、可见 Marker、帧率、内存、临时 PNG 磁盘占用 | `MISSING_APPROVED_BUDGET`；现有权威文档只要求复验，未给可判定数值 | 本轮提供相对基线、计数和 CPU proxy；需 Founder 批准预算后判定 |

## 3. Viewport、density、cluster 和大结果集

本地 reference service 用 650 条公开 lead 构造一个 viewport，返回 `truncated=true`、`serverCap=500`，每页50，共10个请求、500个唯一 `publicLeadId`，响应 JSON 合计304,980 bytes，平均30,498 bytes/请求。第10页 `nextCursor=null`；客户端没有全表拉取路径。服务返回 `density.returnedCount/serverCap/overlapPresent/aggregationAvailable/removedSinceSnapshot`；它足够提示截断与重叠，但还没有批准的客户端 marker 阈值。

同一正式 cluster 算法用10/30/100/500点做 scale 10→18→10 的 split/merge；每轮 marker 数≤输入点数，`inspectPublicMapRepresentation` 检查每个 lead 恰好一次、无 ghost/漏点/重复。500点测试的低／高／回低节点数为1/500/1。20个同坐标、20个混合近点及 picker 的既有定向测试仍通过；不可分离列表继续保持真实身份和原详情链。没有修改 BoardInstance/PublicMapLead 合并语义、Marker 视觉或地图样式。

本机 Node/Vitest 同进程 CPU proxy：500点 split/merge 在优化前约130.2ms，改为 lead→cluster 映射后约19.0ms（单次观测，约6.9×；不是稳态 P95、低端机帧率或微信 native commit 时间）。在高档500点可产生500个 native Marker；因缺批准上限，本报告不能认定这种密度可发布。

## 4. Pagination、cache、latest-wins

正式页面和类默认均为50；测试专用旧两项分页 fixture 显式用2，不改变生产合同。opaque cursor 由服务端 HMAC 绑定账户／查询／asOf，过期或不匹配拒绝并 fresh-root 恢复；客户端分页 in-flight 只允许一个，同代且同 cursor 才提交。120秒缓存仅保存公开 allowlist；root query identity 包含 bbox、zoom、mode、筛选和 schema，详情选择有独立 generation。已有测试覆盖 query/filter key 隔离、迟到 A/B/C root、迟到 detail、删除后 root/page/detail 不复活、失效 cursor 与分页重试。页面 viewport `regionchange end` 后180ms debounce，并在已载入 bbox 内跳过请求；zoom 视觉采样另用180ms限频及最新任务覆盖。搜索/展示标签变化为本地 presentation 更新，不发全表请求。

## 5. 弱网、重试和恢复

慢响应／乱序、stale cache、分页失败与同 cursor 显式重试、detail A→B latest-wins、rate limit、global read-stop 已由客户端/服务端既有 contract tests 覆盖。本轮补足网络 Promise 直接拒绝的 root/detail 场景：刷新失败进入 `STALE_CACHE` 并保留50条已稳定 Marker；没有定时自动重试，用户刷新后恢复 `LOADED`；内部异常文字不会进入 UI。分页与详情拒绝分别走稳定错误。首次无缓存失败仍为 unavailable/error 空态；不会伪造旧数据。网络断开和 timeout 在本地以服务拒绝／稳定 `SERVICE_UNAVAILABLE` 代理，未测真实无线电链路。

当前 signed avatar 路径在本地 reference service 的 `projectPublicContributor` 中存在：过期 URL、签发失败和签发抛错均回退本地默认头像；后续重新投影拿到有效签名 URL 可恢复。小程序 `<image binderror>` 对显示期 URL 失效使用默认头像；客户端没有自动重签接口或无限 retry，生产签名服务接入和真实过期刷新属于后续集成风险。客户端收到的 public detail 无私有 fileID。

## 6. PNG、picker 与低端设备代理

正式链仍为 presentation → Canvas PNG renderer → 微信原生 `iconPath`。10/30/100点同档重复投影、快速 pinch+pan 的180ms限频、废弃 PNG 批次退出、exact-overlap picker、PICKER surface 缓存隔离和 latest binding 提交由 TASK-V2-17 自动回归覆盖。本轮另用500个不同 key 验证192条 LRU、500 miss、192 hit、0 pending。该缓存上限约束 JS 路径索引，不约束微信临时 PNG 文件总磁盘大小。未在低端真机测 `canvasToTempFilePath`、native binding 更新次数、GPU 内存或帧率；TASK-V2-20 承担正式设备矩阵。

## 7. Package 与资产

- V1-F 2 MiB source preflight：1,289,563 bytes，余807,589 bytes，PASS。
- 微信官方 CLI preview：993,842 bytes，PASS；二维码与 info 在 `artifacts/task18/`。此为微信编译包体；源码 preflight 是更保守的项目 hard gate。
- `artifacts/task18/package-asset-audit.json`：68个静态资产／466,789 bytes；精确哈希重复0；测试 fixture/debug/source map 在生产扫描集合中0。11个 basename 静态引用候选包括 README、字体和若干 SVG；动态引用与 WXSS font URL 可能造成假阳性，故未直接删除。
- Oswald glyphs/marker font 仍是 Canvas PNG 的生产路径；既有 CSS customCallout 已在 TASK-V2-17 移除，固定 PNG 回退仍在。无本轮新增图片、字体或 SDK。

## 8. Cost read-back

`docs/research/v2-c/v2-query-security-resource-migration-contract.md` 第11节使用每月100,000个 public 请求、1次 public DB 调用/请求、至多1.5次 snapshot 调用/请求、平均0.25GB存储、既有函数配置和¥3监控预留作为**规划情景**，不是已批准 DAU 或真实账单。本轮最大页 fixture 平均响应30,498 bytes：100,000请求约3.05GB/月，按 V2-A 历史估价¥0.8/GB 约¥2.44 出流量；¥2.00 public DB + ¥3.00 snapshot + ≤¥0.31存储 + 约¥0.27函数调用/算力 + ¥2.44流量 + ¥3.00预留 ≈ **¥11.02/月**。这是基于既有单价和本地 JSON payload 的条件估算，低于≤¥20 target；没有生产 DAU、索引读量、实际压缩、平台账单或基础套餐升级成本，不能宣布运营成本门已最终通过。参数化关系为 `月响应流量GB = 月请求数 × 平均bytes/请求 ÷ 10^9`；若每次 session 拉满500项，则每10个请求产生约305KB JSON。本地 reference 的 `listVisibleWithin` 会枚举候选并排序，生产 geo index 执行计划/账单仍需 TASK-V2-19/21 read-back。

## 9. 自动验证

| 门 | 结果 |
| --- | --- |
| 全量 Vitest | 85文件／925项通过（最终复验记录） |
| TASK-V2-18/13 定向 | 650→500分页、10/30/100/500聚合、缓存、弱网、signed avatar 通过 |
| TypeScript、ESLint、contracts/workflow、Prettier、`git diff --check` | 通过 |
| Next.js production build | 通过 |
| V1 Web Playwright | 26/26通过；这是浏览器功能回归，非小程序地图真机性能 |
| V1-F 2 MiB preflight、资产审计、微信 CLI preview | 通过；数值见第7节 |

## 10. 未关闭风险、Founder Review 与解锁

1. `MISSING_APPROVED_BUDGET`：latency/P95、frame/jank、native marker/density、响应 bytes/QPS、内存/PNG磁盘均无已批准数值；Founder 应先批准可量化预算，再由后续设备和 pilot 门验证。
2. 本轮 CPU proxy 和微信预览无法证明低端 iOS/Android 实际帧率、500 native markers 可用性或弱无线电恢复。正式设备矩阵在 TASK-V2-20；生产索引、真实资源和账单在 TASK-V2-19/21。
3. 当前正式客户端仍使用本地 synthetic service；真实 CloudBase adapter 未接入。签名头像显示期失效只回退默认图，不自动重签。服务端本地候选枚举成本不能代表生产 geo index。
4. 11个可能未引用资产需人工核对引用路径后再决定是否清理；当前2 MiB门有余量，无必要冒险删除回退资源。

本轮**没有**触发 Founder Review 的 UI、隐私或数据合同变更；50页是向已批准合同对齐。TASK-V2-19 **不满足解锁前提**：TASK-V2-18 尚未 `HUMAN_APPROVED`，V2-D 区块人工门未关闭。

**READY_FOR_FOUNDER_REVIEW**
