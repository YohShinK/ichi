# TASK-V2-17｜不可自然分离 Cluster 选择面板

状态：`IMPLEMENTED / AUTOMATED_AND_DEVTOOLS_PASS / AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`。TASK-V2-18—22 仍锁定。未 commit、push 或 deploy。

## 原问题与新决策

原点击链：Cluster 到 `PUBLIC_MAP_MAX_SCALE=18` 仍重叠 → 页面设置 `publicMapNativeSpiderfyClusters` → native presentation 的 `spiderfyNode` 用 `offsetPublicMapCoordinate` 产生 display-only 经纬度 → 成员看起来位于不真实的周边位置。真实经纬度虽保存在 `realLatitude/realLongitude`，地图上的展示位置仍会误导，20 点时尤甚。

现在点击 Cluster 后，仅取当前 Cluster 的成员，以真实坐标在 scale 18 重建无旧 topology 滞回的 screen-space 碰撞，并使用最大档 PNG 的 `132×68` footprint。若得到多个 node，沿原有 camera expansion 放大，让真实子组自然分开；若仍只有一个 node，则保持一个原位 Cluster，打开选择面板。判断依据不是成员数，也不使用固定经纬度阈值。当前点击路径不再设置 spiderfy key；旧投影代码保留以便安全回退。已在最大 scale 的可分离边界会无旧滞回重建一次，避免历史拓扑暂时锁住分组。

## 面板与数据

经 Founder 视觉复核，面板改为页面根层的 V1 `modal-layer / modal-card light-capsule`，直接复用原标题、渐变浅色底框、阴影动效及灰底关闭 SVG。条目不再使用 CSS 模拟 Marker，而由生产 Canvas Renderer 的 PICKER surface 绘制：保留弧形青色底板、黑色余量区、内置 Oswald 700、标题和状态色，扩展右侧文字区且不画地理箭头。默认 PNG 为308×60 logical px，宽度随弹窗可用空间变化；缓存与地图隔离并共用串行出图队列，关闭／退出会令迟到结果失效。出图失败保留可点击文本与重试。原生 `scroll-view` 限高，可浏览 20 条。2026-09-24 交互补充：选择条目按 `publicLeadId` 调用既有 `openSelectedMapLead` → `PublicMapClient.selectLead` → 原详情卡，列表与滚动状态继续保留；直接点另一个条目可切换详情。详情打开时面板移至上部以同时露出列表与详情，点详情外区域只收起详情；仅右上角关闭按钮退出列表并清除选择。详情卡通过 WXML 模板在普通地图／选择弹窗两处复用，不创建第二条详情链。真实坐标传给既有详情相机。面板打开时原生 map tap/marker tap 被守卫；关闭操作短时消费伴随底图 tap。

20 点 fixture 仅由测试导入，不进入 app bundle、正式数据、CloudBase 或数据库。A：20 个完全相同坐标保持单 Cluster；B：9+1+6+4 的近点组合在最大 scale 得到 4 个真实子组（其中 9/6/4 各自仍为 Cluster）；C：20 个同街区但足够分开的点在最大 scale 得到 20 个真实 node。两点同坐标、两点近而可分、两点近而不可分均有测试；页面测试验证第 13 条会请求对应 `publicLeadId`，关闭不触发选择，且不生成 spiderfy view。

## 聚合角标

保留已验收的代表 Marker 主体，只局部调整红色数量标识：1 位数为直径 16px 圆形，2 位数为 `23×16px` 胶囊，3 位数为 `30×16px` 胶囊。右边缘固定于原圆形右边缘；顶部 4px，描边和图片透明边距足够，999 可完整显示。1000 及以上明确封顶显示 `999`，且相同可见状态共用 render key。缓存版本 `v7-cluster-badge-999`，不改卡体、DPR、anchor 或 cluster engine。

## IP/主题修复

原 synthetic detail 把 `TASK-V2-14 synthetic fixture` 错放进 `board.themeName`，详情模板再无条件拼接 `ipName / themeName`，所以内部任务名露出。现 synthetic 无主题置为 `null`；统一 `formatPublicIpTheme(ipName, themeName?)`：有真实主题显示 `IP / 主题`，无主题只显示 IP；详情模板消费 `displayIpTheme`，不消费 sourceLabel、debug ID 或假主题。Marker 与列表共同使用 presentation 的公开 `boardShortLabel` 预览并经同一 formatter 规范化，避免列表另取内部字段。**当前 PublicMarker 合同只提供 `boardShortLabel`，不提供分离的真实 themeName；在不修改合同/后端的本轮范围内，Marker 与列表无法补出未公开的主题，也不能保证短标签与详情长标题逐字一致。**

## 验证与截图

- 全量 Vitest：83 文件／905 项通过；包含 A/B/C 的 20 点 fixture、两点自然分离/不可分、页面选择/关闭、IP/主题、1/9/10/20/99/100/999/1000 badge。
- 根项目与 Web TypeScript、定向 ESLint、workflow、`git diff --check`、Next.js production build 与微信开发者工具 CLI preview：通过；最终 preview 包 1,008,343 bytes（984.7 KB）。微信开发者工具自动化只用临时 `setData` 截图，不保存 fixture 到正式数据。
- 初次截图发现关闭按钮拉成长胶囊且标题换行；修正为固定 34px 圆形后复截图。滚动至末尾可见第 20 条，没有误露出列表外内容。离线调用生产 `drawMarkerCanvas`、DPR 3 的 9/20/999 对比图显示圆形/胶囊边界完整；这不是 iOS/Android 真机证据。

### V1 视觉返修复核

此前 CSS 列表数字实际为系统字体，青色为平直色条，部分状态色也不同。此次移除该实现，直接共享 Canvas 绘制。开发者工具实际截图对照 V1，20/20 条 PNG 加载、滚动末尾和关闭按钮通过。重新生成地图9／20／999角标对比图，SHA-1与修改前完全相同（`82e005b4c6c442bf2c08f515605990f42a507bda`），地图视觉未受影响。这些证据不替代 iOS／Android 真机验收。

返修后全量83文件／906测试、TypeScript、定向ESLint、Next production build与微信CLI preview通过；新版预览包1,008,100 bytes（984.5 KB）。上方905项及旧包大小为初版历史验证记录。

![V1弹窗参考](../../artifacts/cluster-picker/v1-modal-reference.png)

![开发者工具新版面板顶部](../../artifacts/cluster-picker/v1-picker-top.png)

![开发者工具新版滚动至第20条](../../artifacts/cluster-picker/v1-picker-bottom.png)

![生产Canvas角标9、20、999对比](../../artifacts/cluster-picker/badge-9-20-999.png)

## Founder 真机验收

### 2026-09-23 弹窗信息密度补充

标题行现在同时显示“选择版面”与“此位置有 XX 个版面”，两者底沿对齐；删除原独立说明行。开发者工具同尺寸截图中可完整看见5个信息条。PICKER Canvas标签从卡片通栏改为64px等宽短胶囊，标签之间隔4px；当前有公开给页面的已有 synthetic 多标签时逐个显示，其他数据仅显示主标签。最长已知文字“机会信息未知”在9px PingFang字面宽54px，64px包括两侧各4px内边距和2px安全量。地图依然只用主标签。

地图与弹窗的 Marker余量0—9统一显示00—09；未知值仍为“—”，10及以上原样。Presenter和Canvas直接输入均做规范化，render key使用显示后的文案。生产Canvas绘制的地图08与弹窗08、双标签样图已目视核对。20/20条PNG加载、滚动末尾及关闭交互在开发者工具通过；全量83文件／914测试、TypeScript、定向ESLint、Prettier、workflow、`git diff --check`、Next production build及微信CLI preview（1,009,668 bytes）通过。地图9／20／999对比图SHA-1仍为`82e005b4c6c442bf2c08f515605990f42a507bda`。真机稳定性与窄屏排版仍待Founder核验。

![紧凑标题、等宽多标签及08](../../artifacts/cluster-picker/picker-compact-top.png)

![滚动末尾](../../artifacts/cluster-picker/picker-compact-bottom.png)

![生产Canvas地图与弹窗08样图](../../artifacts/cluster-picker/leading-zero-map-picker.png)

在 iOS/Android 依次复验：两点同坐标；两点极近且可自然分离/不可分离；20 点完全同坐标；20 点 9+1+6+4 混合子组；点击第 1/中间/最后一条；打开和关闭详情后继续拖图；快速重复开关面板；滚动 20 条；9/20/999 角标是否完整。重点看是否出现假位置、地图误触/穿透、列表滚动牵动底图、真机角标裁切、IP/主题错误及原 PNG 拖缩稳定性。本轮没有真机人工结果，不能宣称真机通过。

未修改：cluster engine、PublicMarker/publicLeadId/BoardInstance 合同、数据请求、正式 CloudBase、相机主流程、详情卡业务结构、搜索／筛选业务逻辑、Bottom Nav、V1、TASK-V2-18—22。

### 2026-09-24 连续浏览与空筛选弹窗复核

开发者工具实测临时20条列表 PNG 20/20加载，点第1条保持列表并打开详情，点第2条直接切换为对应详情；点标题空白区域仅关闭详情、列表恢复原位，显式关闭后普通地图 Marker 详情仍可打开。标题副说明底沿和主标题视觉对齐。这里的20条仅为选择列表压力测试注入，**不代表地图出现20个真实点**。

“未选择筛选条件”单独改为页面根层 V1 `light-capsule` 弹窗。截图首轮发现继承通用弹窗固定高度，改成特异性更高的局部规则后得到紧凑卡片；黑色“显示全部”按钮实测恢复全部筛选并关闭弹窗。搜索无结果状态未改，仍显示原有地图提示。自动验证：83文件／916测试、TypeScript、定向ESLint、Prettier、workflow、Next build、微信CLI preview 1,011,923 bytes、`git diff --check` 通过。开发者工具并非 iOS／Android 真机，真机仍待 Founder 复验。

![聚合列表与详情并存](../../artifacts/cluster-picker/picker-with-detail.png)

![聚合列表直接切换另一条详情](../../artifacts/cluster-picker/picker-switched-detail.png)

![地图空筛选 V1 弹窗](../../artifacts/map-discovery/zero-filter-modal.png)

![点击显示全部后](../../artifacts/map-discovery/after-show-all.png)
