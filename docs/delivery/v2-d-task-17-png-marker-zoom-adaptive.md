# TASK-V2-17 PNG Marker Zoom Adaptive

状态：`implemented / AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`

## 范围与结论

依据 Founder 本轮 Markdown 总命令实施。固定 PNG 的视觉与稳定性已由 Founder 在任务背景中确认通过；此结论不自动延伸到本次自适应版本。仅在 TASK-V2-17 内工作，没有 commit、push、deploy，也没有开始 TASK-V2-18。

已实现：五档文字宽度、缩放期间限频重算屏幕聚合、结束后的最终校正、视觉缓存及过期任务合并。保留 Oswald 数字轮廓、等高青色背板、连续外描边及数字区下方黑色尾尖。没有重新设计 Marker，没有增加 stack 图标。

## 方案及取舍

采用有限视觉档位，而非连续 Canvas 出图。地图自身提供连续缩放与平移，Marker 的文字／聚合使用离散原子切换。

- 保留现有 cluster engine、屏幕 Mercator 投影、8px聚合滞回、stable numeric markerId、代表 Marker、exact-overlap／spiderfy。
- 优化 native presentation 的碰撞输入，按当前 PNG footprint 计算，而非旧 callout 尺寸。
- 替换实验模式下的“pinch只记录scale，之后Pan才更新”的旧 gate；关闭实验开关仍走原稳定路径。
- 保留单在途 setData、latest pending、binding/view signature 差分，以及已加载 PNG 等待新 PNG 的策略。
- 本轮不使用 translateMarker、不生成动画中间帧、不新增 Canvas overlay 或隐藏 marker pool。不是60fps平滑变形；它是稳定性优先的五档切换。只有真机证明图片替换稳定，才值得单独评估原生位移动画。

## 文字和几何

阈值为 scale `11.5 / 13.5 / 15.5 / 17.5`；跨档须越过边界额外 `0.12`，减少边界抖动。大步缩放可直接跳至最终档，不补播中间档。

| 档位 | 初始scale区间 | PNG logical尺寸 | 标题可用宽度 | 碰撞footprint |
| --- | --- | --- | --- | --- |
| 0 | <11.5 | 80×72 | 14 | 72×68 |
| 1 | 11.5–13.5 | 95×72 | 29 | 87×68 |
| 2 | 13.5–15.5 | 110×72 | 44 | 102×68 |
| 3 | 15.5–17.5 | 125×72 | 59 | 117×68 |
| 4 | ≥17.5 | 140×72 | 74 | 132×68 |

标题／状态分别使用 Canvas measureText 选择能容纳的真实前缀，不追加省略号；最窄至少保留一个字符。字符按 Unicode code point 分割，避免截断代理对。单个超宽字符用 fillText maxWidth 限制；空数据使用“—”。紧凑状态标签减少左右内边距，其余字体、颜色不变。不同文本的字符实际宽度不同，因此不承诺每跨一档恰好多一个字。

只有右边缘移动，数字区32px、卡片高48px、尾尖 `(28,66)` 不变。anchor 为 `{ x:28/PNG宽度, y:66/72 }`，并非固定0.2；各档宽度改变不移动地理落点。DPR仍取设备值并限制1–3。数量角标随右边缘移动，圆与描边始终位于透明padding内。footprint保守包含角标、尾尖、选中描边及少量阴影；不是把透明PNG整框当内容，也不是经纬度半径。

![五档实际生产绘制结果](../../artifacts/canvas-marker/adaptive-levels.png)

此图由实际生产 drawMarkerCanvas 在本机 Skia Canvas 上绘制，不是HTML仿制，也不是真机截图。已按 draw-ui 校准流程实际查看，确认首档“宝／刚”、连续尾尖、角标完整，以及全宽档继承已验收视觉。

## 聚合、身份与点击

缩放采样经过180ms尾随限频后读取最新observedScale，再生成当前档位对应的最终projection。正常缩放不再需要Pan解锁。结束采样及程序化camera settle同样请求最终projection。聚合engine内部算法未改，仅传入PNG尺寸；cluster tap的扩展scale搜索同步使用相同尺寸。

聚合仍是展示分组，不合并PublicMarker／publicLeadId／BoardInstance，不改真实坐标。每轮检查representation invariant，不缺失、不重复。已有最大scale下spiderfy和marker点击／详情业务保留。Search、Filters、Info Card、Bottom Nav、我的、V1、查询和CloudBase均未改。

## 调度、PNG缓存及降级

1. `MarkerZoomThrottle` 仅保留一个timer和最新回调，180ms处理一次；无scale动画队列。
2. `LatestMarkerProjectionResolver` 仅有一个活动准备批次与一个最新待处理批次。新请求覆盖旧待处理请求；活动批次最多完成当前一张PNG，随后停止。完成的有效图片仍可复用。
3. `MarkerImageCache` 沿用192条LRU，并合并相同key的在途任务。key增加离散detailLevel，仍不包含scale、坐标、viewport或帧号。
4. 全部binding的图片就绪后才提交，等待期间保留旧Marker；版本generation拒绝旧结果。签名未变不重写iconPath或native marker数组。
5. 生成失败且已有PNG时保留原画面并告警，不切成透明binding。首次出图失败仍遵守既有错误／开关回退路径，不声称该失败情形有可用新图。离开地图／卸载页面取消待处理任务。

没有全量预热所有5档：100个不同Marker会造成500张图片，超过当前缓存预算。本轮采用按需生成和往返命中；LRU淘汰后允许重新生成。相同档位中的scale变化不会导出新图片。没有新增持久文件清理；临时PNG仍由微信临时文件生命周期管理，LRU限制的是路径缓存条数，不是对平台磁盘／GPU占用的保证。

### 一键回退

将 `apps/client/miniprogram/platform/marker-zoom-adaptive.ts` 中 `PNG_MARKER_ZOOM_ADAPTIVE_ENABLED` 改为 `false`，重新编译。

保留 `CANVAS_MARKER_ENABLED = true`。这样回退的是已验收固定PNG及原deferred zoom路径，不是CSS。不要将这两个开关混淆。关闭后不会产生自适应key或档位宽度。

## 自动验证与性能证据

- 全量：82测试文件／896测试通过；TypeScript、ESLint、contracts、workflow、git diff check通过。
- Next.js production build通过。项目既有cloud function Node engine提示与Next ESLint插件提示不作为小程序真机结果。
- 定向测试覆盖五档／阈值滞回、至少一真实字符、anchor、badge边界、PNG足迹、zoom split/merge、exact-overlap／spiderfy、latest-wins、map exit取消、无需Pan的页面调度。
- 100次间隔10ms的模拟观察，限频产生6次回调，最后为最新值99；cancel后不再执行。稳态上限约5.6次projection请求/秒，实际native提交只在签名变化时发生。这不是实测手机帧率。
- 10／30／100个可见且不同视觉key的Marker，同档4次投影分别只生成10／30／100张，之后30／90／300次缓存命中。PNG导出使用mock，证明复用次数，不证明手机导出速度。

本机Node离线测量100次projection（CPU／非手机）：

| 输入点数 | P50 ms | P95 ms | 最大ms |
| --- | ---: | ---: | ---: |
| 10 | 0.073 | 0.128 | 7.920 |
| 30 | 0.340 | 0.493 | 1.193 |
| 100 | 3.039 | 3.809 | 4.055 |

五张DPR3图片绘制＋PNG编码＋文件写入约2.95–6.66ms/张；包含首次字体／引擎预热，不能外推微信canvasToTempFilePath。原始记录：`artifacts/canvas-marker/adaptive-offline-metrics.json`。基准脚本：`render-adaptive-check.mjs`，离线工具依赖放于/tmp，不改变项目package／lock。

## DevTools结果

微信开发者工具RC 2.02.2607271／基础库3.17.0，iPhone12/13(Pro)模拟器。首次自动化遇到开发者工具内部ReactiveCache未注册以及getCurrentPage rawPath错误；重开同一项目后恢复，未清除用户数据或改安全设置。

已实际查看地图PNG；控制观察测试中scale9→12→14→16→18→16→14→12→9的宽度依次80／95／110／125／140／125／110／95／80，所有采样PNG ready，10个lead始终被表示。相同topology返回16、14、9时复用相同临时iconPath。marker点击后详情卡OPEN。另用真实原生camera scale改变运行验证，记录见 `artifacts/canvas-marker/adaptive-devtools-results.json`；这是程序化缩放，不是双指pinch。

![DevTools原生地图](../../artifacts/canvas-marker/adaptive-devtools.png)

静态截图和自动化状态快照没有覆盖帧间空白／闪动；不能据此写“DevTools或真机完全不闪”。鼠标滚轮观察与程序化缩放同样不能代替iOS双指手势。

## 真机验收与尚未确认项

iOS／Android均未连接，本轮结果均为待Founder复验。请在两端各验证：

| 场景 | 检查点 |
| --- | --- |
| 慢速放大／缩小 | 自动split／merge，文字档位方向正确，不需要随后拖动 |
| 阈值附近反复缩放 | 不来回切图，字符不只剩省略号 |
| 快速pinch／pinch+pan | 不补播旧档，不回跳旧topology，松手后最终正确 |
| 单点／10／30／100可见点 | 冷启动出图延迟、首次换档延迟、图片空白、资源占用 |
| 多点重叠／exact-overlap | 不丢点不重复、最大缩放spiderfy可用 |
| 点击普通／聚合Marker | 普通详情正常、聚合扩展camera正常、选中描边连贯 |
| 开关关闭 | 回到固定PNG，仍可点击、查看详情 |

请记录机型、系统、基础库、录屏、首次／再次经过同一档位差异。日志 `NATIVE_BINDING_COMMIT`、`SET_DATA_SKIPPED` 可区分桥接更新与未改变；`public_map_canvas_marker_fallback` 指向PNG生成错误。

当前无法确认是否仍有闪动，也无法把未观测的闪动归因到某层。如果只在首次换档延迟，优先查Canvas导出／图片解码；缓存命中仍闪则重点查native iconPath replacement／地图SDK；仅split/merge闪则查marker数组topology替换。不要据此预先宣称已经定位。

## 下一步

先完成上述真机矩阵，再决定是否调整180ms、滞回阈值或192缓存预算。若首次换档延迟明显且内存有余量，再考虑小范围邻档预热；若拓扑替换闪，再单独评估stable pool或原生位移动画。当前先保留可回退实验，不扩大到后续任务。

主要变更：`marker-zoom-adaptive.ts`、`marker-canvas-renderer.ts`、`marker-binding-adapter.ts`、`marker-image-cache.ts`、`public-map-native-presentation.ts`、首页接入、相关测试与memory-bank事实记录。cluster engine、公开contract及后端没有修改。

最终状态：`TASK-V2-17 PNG Marker Zoom Adaptive implemented / AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`
