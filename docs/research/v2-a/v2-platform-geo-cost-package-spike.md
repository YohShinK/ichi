# V2_PLATFORM_FEASIBILITY_REPORT

> Task: `TASK-V2-03`
>
> Status: `COMPLETE / HUMAN_APPROVED`
>
> Production deploy/resource change: `NO`
>
> `RUNNABLE_MAP_SPIKE_EXISTS = YES`
>
> `SPIKE_EXECUTION_MODE = INDEPENDENT_WECHAT_TEST_PROJECT`
>
> `WECHAT_SIMULATOR_INITIAL_RENDER_VERIFIED = YES`

## 1. Recommendation

用户已批准“微信原生 `<map>` + ICHI Map Query API + service-only CloudBase bounded query”方向，并于 2026-09-11 确认 iOS、Android 与腾讯位置服务控制台验收全部 PASS：

- 客户端不得直接读取现有 13 个 private collections；
- public query 只能在未来读取独立、allowlist-only 的 `PublicMapLead` projection；
- bbox/cell、server maximum limit、opaque cursor 和 density cap 必须同时存在；
- 地图主数据只来自 ICHI 自有数据库处理后的 `PublicMapLead`；地图打开后不调用腾讯地点搜索／POI 获取 marker；
- 微信原生 `<map>` 负责底图、markers、pan/zoom 和 viewport，不需要把腾讯位置服务 WebService key 作为基础地图显示前置条件；腾讯 key 只用于未来 POI、地点搜索、地址／逆地址解析或个性化地图等扩展能力。
- TASK-V2-03 只产出 EDG-V2-02/03/05 证据；Gate 的正式关闭仍由锁定中的 TASK-V2-04 处理，本轮不解锁或执行该任务。

## 2. 官方资料矩阵

| Topic | 官方文档事实 | V2-A 结论 |
| --- | --- | --- |
| 微信定位 | `wx.getLocation` 需在 `app.json` 声明并取得 `scope.userLocation`；`gcj02` 可用于微信地图位置能力；高频定位有耗电风险 | 地图浏览必须有拒绝权限后的列表／手选城市 fallback；只在用户动作需要时定位 |
| 微信地图 | 原生 map 可承载中心点、缩放、markers、视野变化等基础交互；具体真机差异不能由文档替代 | 首选原生组件，iOS/Android 分别验收 pan/zoom/marker/恢复 |
| 腾讯位置服务 | WebService 提供地址解析、逆地址、输入提示与地点搜索，调用受 key 权限和配额限制 | 控制台验收 PASS；降为 Optional Location Enhancement，不属于 MVP 浏览链路。key 不嵌入公开客户端，由未来受控服务端调用 |
| 坐标 | 微信定位可请求 GCJ-02；V1 私有 capture evidence 已使用 GCJ-02 | Observation Location、private evidence 和 Public Location Projection 必须显式标坐标系；禁止默认互换 WGS84/GCJ-02 |
| CloudBase geo | 文档数据库支持 `geoNear/geoWithin/geoIntersects`；地理位置查询必须建立 geo index | geo index 是必要前提，但最终选 geoWithin 还是 cell/geohash 要由真实数据基准决定 |
| CloudBase paging | query 支持 `limit` 和分页；平台能力本身不会替应用设置 public density cap | 服务端固定 `limit≤50`，客户端参数不能扩大；游标必须 opaque |
| CloudBase 计费 | 2026-09-08 资源点价格：文档数据库调用 0.2 元/万次、云函数调用 0.0133 元/万次、云函数资源 0.00011108 元/GBs、外网出流量 0.8 元/GB | 小规模 pilot 的 CloudBase 增量有机会低于 20 元/月；provider 商业授权和基础套餐另行核对 |
| 包体 | 项目自动门是单包 2 MiB；V1 frozen baseline 为 908,347 bytes | 测试号恢复后 spike 保持独立 `miniprogramRoot`，V1 package delta=0；以后 production map 页面、marker 资产和 SDK 每次变更都重测 |

官方参考：

- [微信小程序 Location API](https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.getLocation.html)
- [微信小程序 map 组件](https://developers.weixin.qq.com/miniprogram/dev/component/map.html)
- [腾讯位置服务 WebService API](https://lbs.qq.com/service/webService/webServiceGuide/webServiceOverview)
- [CloudBase Database API / geospatial query](https://docs.cloudbase.net/api-reference/webv3-pg/database)
- [CloudBase 地理位置索引](https://docs.cloudbase.net/database/data-index)
- [CloudBase 资源点价格](https://cloud.tencent.com/document/product/876/127357)

## 3. Synthetic bounded-query benchmark

隔离脚本 `scripts/v2-a/validate-evidence.mjs` 只在内存中生成上海矩形内的 synthetic points，不连接网络、CloudBase 或生产资源。固定 viewport 为 `lat 31.15—31.30 / lng 121.35—121.62`，server page limit 为 50。

| Generated | Viewport matches | Returned | Pages at 50 | JSON payload |
| ---: | ---: | ---: | ---: | ---: |
| 30 | 5 | 5 | 1 | 417 bytes |
| 1,000 | 108 | 50 | 3 | 3,915 bytes |
| 10,000 | 1,013 | 50 | 21 | 3,981 bytes |

结论仅限算法形态：结果可以被固定上限约束，数据密度增加不会扩大单响应 payload。它没有测量 CloudBase 网络延迟、geo index 执行计划、marker 渲染帧率或 provider quota。

## 3.1 Independent runnable map test harness

测试号已恢复，因此不再把 spike 放入 V1 小程序包体。`spikes/v2-a-map-device/` 是独立、可删除的小程序工程，使用自己的测试 AppID 与 `miniprogramRoot`，不引用 `apps/client/miniprogram`。它实现微信原生 `<map>`、30 个上海 synthetic markers、pan/zoom、`regionchange` viewport、marker updated/tap、定位允许／拒绝、手选上海与列表 fallback、页面内存前后台恢复、正常／弱网／断网 mock、受控加载错误，以及 generation/stale-response 丢弃日志。

静态 validator 已确认 12 个必需文件、测试 AppID 与 V1 AppID 分离、30 个唯一上海合成点、显式 `SYNTHETIC_ONLY` 标签、production connections=`0`、Storage connections=`0` 和 V1 package delta=`0`。源码中不存在 `wx.cloud`、`wx.request`、WebSocket、远程 URL、collection 或 Storage access；微信自带 `wcc/wcsc` 对 WXML/WXSS 的源码编译 PASS。开发者工具 CLI 已成功打开独立项目；模拟器观察到腾讯地图底图、30 个实际可见的 PNG markers、`30 / 30`、有效 viewport、`generation=1`、`discarded=0`、`READY`、`map updated=1` 且 Problems=0。首次观察发现两项 spike 问题：SVG marker 不渲染，以及 map update/regionchange 日志回写导致 generation 循环；前者已替换为 `44×52 RGBA PNG`，后者已加入 updated 单次日志、gesture-only reload 和 programmatic transition guard，关闭／重开项目后复验可见且稳定。其余交互矩阵和 iOS/Android 仍必须独立取证。

首次自动真机调试的临时包上传还暴露微信配置校验错误 `80058`：`scope.userLocation.desc` 原为 32 字符，超过平台 30 字符限制。说明已缩短为 17 字符，validator 新增长度回归门；修复后本地配置验证 PASS，重新发起真机调试仍需用户在开发者工具中完成。该记录不包含 AppID、OpenID 或个人位置。

## 4. Cost sensitivity

研究预算模型采用每月 100,000 次 viewport/detail 请求、每请求一次云函数和一次数据库调用、128 MiB/100 ms 函数执行、25 MB 外网响应作为偏保守 pilot 假设：

| Item | Assumption | Estimated incremental cost |
| --- | ---: | ---: |
| Database calls | 100,000 | ¥2.00 |
| Function invocations | 100,000 | ¥0.133 |
| Function compute | 1,250 GBs | ¥0.139 |
| Outbound traffic | 0.025 GB | ¥0.020 |
| CloudBase subtotal | — | about ¥2.29/month |

该估算不含既有基础套餐、超免费配额、告警/日志额外用量或真实流量突增。腾讯位置服务控制台的 key、许可与配额方向已人工验收 PASS；用户确认地点搜索额度当前约 200 次／日。MVP 地图浏览不调用地点搜索，因此该额度不影响当前成本或可行性。真实生产流量仍需后续 Gate 复验。V2-A 结论是“微信原生地图和 CloudBase 请求侧可行，当前没有证据推翻 `≤¥20/month` 目标”。

## 5. Package measurement

- V1 frozen automated baseline：908,347 source bytes；2 MiB gate PASS。
- 测试号恢复后 spike 位于独立 `miniprogramRoot`；V1 automated preflight 仍为 908,347 bytes，package delta=`0 bytes`。
- 非生产 evidence script 3,586 bytes、fixture 5,016 bytes，都位于生产小程序包之外。
- 独立 map device spike（不含 Git-ignored 的开发者工具私有配置）总计 39,039 bytes；它不属于 V1/V2 production package。
- 后续若引入 marker PNG、聚类实现或 provider SDK，必须以微信开发者工具实际上传包为最终事实，不能用源目录字节替代。

## 6. True-device checklist

2026-09-11 用户确认 iOS 与 Android 整体人工验收通过。下表记录本轮 human attestation；机型、系统、微信版本和逐项截图未在对话中提供，因此不伪造设备元数据。

| Case | iOS | Android | Pass evidence |
| --- | --- | --- | --- |
| 原生地图冷／热加载 | PASS | PASS | 用户整体人工验收确认 |
| pan/zoom + viewport change | PASS | PASS | 用户整体人工验收确认 |
| 30 markers / density fallback | PASS | PASS | 用户整体人工验收确认 |
| 定位允许 | PASS | PASS | 用户整体人工验收确认 |
| 定位拒绝 | PASS | PASS | 用户整体人工验收确认 |
| 前后台恢复 | PASS | PASS | 用户整体人工验收确认 |
| 弱网／断网 | PASS | PASS | 用户整体人工验收确认 |
| 手选上海 + 列表 fallback | PASS | PASS | 用户整体人工验收确认 |

## 7. Fallback 与 Stop 条件

超预算、超密度或平台不稳定时依次：减少返回字段／limit／刷新频率 → 列表优先 → 手选城市 → Stop。

任一条件触发核心地图 `Adjust/Stop`：Observation/Public Location 坐标不能稳定追溯；CloudBase 查询必须直读 private collection；真实包体超过 2 MiB 且无法安全分包；任一目标设备无法可靠拒绝定位后 fallback；完整月增量超过 20 元。腾讯位置服务授权或配额不足只关闭 Optional Location Enhancement，不停止 MVP 地图。

## 8. Spike isolation and cleanup

- script SHA-256：`645244fed090696150e43a2eff317544e76e774f8f7e9c04c8523a3bf7d5d744`；
- 独立 map device spike：39,039 bytes；sorted per-file SHA list digest=`5c582e24cda8c0a7d967e2fcd448f97861a212b292ea0e0945344b57f00087c3`；
- validator SHA-256：`21c840db65231ab5a8697c29ed70e635a496ea7ff96a3aae98ca75630ac08e85`；
- 输入只有 checked-in synthetic fixture；没有 key、owner、照片、精确生产坐标或私有记录；
- 无 CloudBase collection/index/function、Storage/R2、域名或生产配置创建；
- 独立 project config 使用已恢复测试号，validator 强制它不能等于 V1 正式 AppID；`project.private.config.json` 由开发者工具本机生成并被 Git 忽略；
- 清理方式是在 V2-A 证据不再需要时删除 `spikes/v2-a-map-device/`；算法证据若同时不再需要，再删除 `scripts/v2-a/` 与对应 `docs/research/v2-a/`。当前保留用于人工复核和复现。
