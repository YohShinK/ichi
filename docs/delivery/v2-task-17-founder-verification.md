# TASK-V2-17 Native Map Founder 真机验收与收口

状态：`COMPLETE / HUMAN_APPROVED`。2026-09-24，Founder 在本任务中明确回复“人工验收通过 V2-17 进行收口。并且解锁 V2-18。”该直接确认是本次人工门的批准来源。没有收到逐机型、逐场景的单独记录；下列原验收清单保留为验收范围，不把未提供的设备数据补写成实测日志。TASK-V2-18=`READY / NOT_STARTED`，19—22 与 V2-E 仍锁定。

人工批准后，按此前清单约定移除了旧 CSS customCallout 视觉分支、触摸 handler 和尾部资源；固定 PNG 回退仍由 `PNG_MARKER_ZOOM_ADAPTIVE_ENABLED=false` 提供。此项默认生产 PNG 路径的清理通过 TypeScript、Lint、83 文件／916 项全量测试、Next 构建及微信 CLI preview（993,453 字节），没有新增真机运行记录。

## 本次收尾

- 审计了当前实施计划、TASK-V2-17 交付记录和首页地图链路。当前唯一架构为公开 Board 数据 → Marker presentation → PNG Canvas renderer → 微信原生 Marker `iconPath`。普通、选中、聚合均用 PNG；不可自然分离的聚合选择项使用同一 renderer 的 `PICKER` surface。图片 key 由视觉内容、surface、离散档位等组成，不含真实坐标、连续 scale 或 viewport；设备 DPR 限制在 1–3，原生 anchor 指向 PNG 黑色短尾尖端。
- 五档自适应 PNG 的观察、限频、出图和最终提交保持分层；新图片准备为 latest-wins，旧结果不能覆盖较新投影。聚合按真实坐标在最大 scale 判断：可自然分离则相机放大，不可分离则保持原位并显示可滚动选择列表。列表选择复用现有详情链。
- 本轮关闭生产 zoom 诊断日志，移除 WXML 已无引用的 synthetic Marker 和散点烟花 WXSS。PNG 模式下地图手势开始及结束增加原生 `markertap` 抑制窗口，避免拖动 Marker 后误开详情；程序化相机不进入该窗口。没有调整 Marker 视觉、地图底图样式、公开数据模型或后端。
- Founder 批准后，旧 CSS customCallout 视觉分支已移除；固定 PNG 仍可通过关闭 `PNG_MARKER_ZOOM_ADAPTIVE_ENABLED` 回退。
- 当前实施计划 TASK-V2-17 条款已按 2026-09-23 的聚合选择决策校正；历史 spiderfy 条款不再作为本次验收标准。

## 自动验证（2026-09-24）

| 验证 | 结果 |
| --- | --- |
| 地图／Marker 定向测试 | 清理前 9 文件、103 项通过；清理后纳入全量回归 |
| 全量 Vitest | 关闭前 83 文件、918 项通过；CSS 清理后 83 文件、916 项通过 |
| 根项目与 Web TypeScript | 通过 |
| ESLint | 通过 |
| Workflow validation | 通过 |
| Web Playwright 回归 | 26 项通过；这是 Web 回归，不是真机地图手势测试 |
| Next.js production build | 通过；首次与 Playwright 开发服务并发写 `.next` 导致 manifest 冲突，串行重跑通过 |
| 微信开发者工具 CLI preview | 编译通过，包体 关闭前 1,002,244 字节；CSS 清理后 993,453 字节；二维码见 `artifacts/task17-closeout/preview-qr.png` |
| 触及文件 Prettier、`git diff --check` | 通过 |

既有自动测试覆盖缓存去重、render key、DPR、iconPath／anchor、普通／选中／聚合、五档与滞回、split／merge、两点及 20 点聚合 fixture、列表选择与详情竞态。自动测试和开发者工具预览无法证明真机帧间无闪烁、Native Map 命中区或跨层级合成正确。

## Founder iOS 真机（原验收清单）

请用本次预览构建，在同一台设备完成并记录机型、iOS／微信／基础库版本、结果与必要录屏。

- [ ] 地图可打开；允许定位与拒绝定位后均可浏览，返回地图时状态正常。
- [ ] 普通、选中、聚合 Marker 均显示为 PNG；数字、文字、状态、数量角标完整，没有旧 CSS callout 重影或短暂空白。
- [ ] 慢速双向 pinch、快速 pinch、连续 zoom、zoom + pan 后，五档文字收展方向正确；松手后不需额外拖动即可更新，不回跳旧档，不闪烁或丢 Marker。
- [ ] cluster 的 split／merge 与相机放大正常；缩回可归并，每个公开点只表示一次。
- [ ] A：两个完全同坐标，保留原位并打开选择列表。B：两个近距离可分时相机放大并自然分离；不可分时进入列表。
- [ ] C：20 个同坐标，列表可滚动到第 20 条并打开其详情。D：20 个混合距离，能分离的真实子组放大，最终不可分的组进列表。E：多个 IP／主题、多个状态标签能逐项辨认；未知主题不显示内部 fixture 名称。
- [ ] 聚合列表与详情可同时浏览；点 A 后直接点 B 能切换详情，外侧点击仅关闭详情，关闭按钮退出列表。详情卡、赏级横向滚动正常。
- [ ] 轻点 Marker 打开详情；拖图和从 Marker 上滑动不会误开详情；地图空白关闭选择；A Marker → B Marker 可快速切换。
- [ ] 搜索与筛选正常；空筛选弹窗的“显示全部”可恢复全部条件；无匹配提示不误进入聚合列表。
- [ ] Bottom Nav、定位／刷新按钮正常；详情、聚合 picker、modal、空态遮罩打开时地图按钮不盖住内容，关闭后按钮恢复可点；页面切换到“我的”等页面后地图不透出或遮挡。

## Founder Android 真机（原验收清单）

请在 Android 真机重复上述核心流程，并记录机型、Android／微信／基础库版本及结果：

- [ ] 地图打开、允许／拒绝定位、页面切换与 Bottom Nav。
- [ ] 普通／选中／聚合 PNG Marker 显示、点击详情和 A→B 快切。
- [ ] 慢速／快速／连续 zoom、pan、zoom + pan；五档文字、split／merge、无空白帧。
- [ ] 两点同坐标、近点可分／不可分、20 点同坐标和混合距离、多个 IP／主题。
- [ ] 20 条列表滚动到底、连续选择详情、关闭与空白手势。
- [ ] 筛选、空筛选弹窗、定位／刷新按钮、详情／picker／modal 原生层级。

## 视觉确认与关闭条件

对照已批准的 PNG 视觉，在 iOS 和 Android 分别检查 Marker 字体尤其 Oswald 数字、数字区内位置、等高青色结构、数字区下方黑色短尾及其地理落点、状态标签颜色与文字、聚合数量角标、PICKER 列表样式和窄屏排版。检查 Marker 可点区域是否与看到的卡片一致。

Founder 已于 2026-09-24 明确确认人工验收通过，TASK-V2-17 现为 `COMPLETE / HUMAN_APPROVED`。本文件未收到可逐项勾选的真机明细，因此清单保留原始未勾选格式，仅以 Founder 的整体批准作为人工门依据。TASK-V2-18 已解锁为 `READY / NOT_STARTED`；其实施与验收另按当前计划执行。
