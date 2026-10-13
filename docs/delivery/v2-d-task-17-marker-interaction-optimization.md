# TASK-V2-17 Marker 与交互体验优化交付报告

状态：`IMPLEMENTED / AUTOMATED_GATES_PASS / AWAITING_FOUNDER_TRUE_DEVICE_REVIEW`

## 修改文件

- `apps/client/miniprogram/platform/public-map-native-presentation.ts`
- `apps/client/miniprogram/platform/public-map-discovery-prototype.ts`
- `apps/client/miniprogram/platform/public-map-presentation.ts`
- `apps/client/miniprogram/pages/home/index.ts`
- `apps/client/miniprogram/pages/home/index.wxml`
- `apps/client/miniprogram/pages/home/index.wxss`
- 上述模块对应的 6 个地图/presentation 回归测试
- `memory-bank/architecture.md`
- `memory-bank/design-document.md`
- `memory-bank/tech-stack.md`
- `memory-bank/implementation-plan.md`
- `memory-bank/progress.md`

## 根因分析

开发者工具以 WebView 模拟地图覆盖层，iOS 真机的 custom callout 则经过 Native Map 的 `customCallout + cover-view` 同层合成。预览可以加载 `marker-font.wxss` 中的 `Marker Jakarta` 可变 WOFF2，真机证据显示原生覆盖层没有稳定复用该 webfont，因而进入后续 `DIN Alternate / Arial Narrow / sans-serif` fallback。不同字形的 ascent、descent、字宽和合成字重不同，直接造成预览与真机数字外观和 baseline 不一致。

旧实现同时把数字与 Badge 字符直接放在 cover-view 文本节点中，依赖 flex/line-height 对字体 baseline 做隐式居中；Badge 又使用 content-box 的 `17×17px + 2px border`，实际外尺寸为 21×21px。字体 fallback 与额外边框尺寸叠加后，角标位置和角标字符分别漂移。青色装饰是 3px 实心竖条，也不符合参考图的左侧弧形描边。

首次点击偶发无响应的链路同时依赖 custom-callout `catchtap`、native `markertap/callouttap` 与地图手势状态；缺少 touch end 的确定性入口，也没有用位移/时长明确排除从 Marker 起手的拖动。单点激活仅打开详情，没有同步下发 camera center，因此 Marker 与底部详情卡的关系随原位置变化。

## 实施结果

- 真机回归后的最终主卡为 118×48px；数字区 36px、文案区 82px，shell 122×60px，可完整显示状态文案。
- `customCallout.anchorY` 最终为 `-30`；数字不再依赖 Marker webfont，使用 `Helvetica Neue / Arial` 固定 38px glyph box 与确定性横向压缩；中文标题／状态使用 `PingFang SC` 固定行盒。
- Badge 使用 18×18px border-box 和独立 14×14px glyph box；边框不再扩大实际尺寸，字符不再直接依赖容器 baseline。
- 青色装饰改为左上、左边、左下连续的 2px 弧形轮廓；选中 Marker 恢复 `#f20aa4` 玫红整卡描边。
- 真机不稳定的 CSS border triangle 已替换为普通／选中两张本地 4× RGBA PNG；白色箭头与卡体连续，选中资源把玫红轮廓延伸到箭头侧边。
- Marker touch classifier 使用 8px 位移阈值与 350ms 时长阈值；tap 在 touch end 激活，drag/long press 抑制随后 native tap；120ms marker-id 去重保留。
- custom callout 根节点移除与原生 anchor 重复的 `translate(-50%, -50%)`，只保留 display-only transition offset。单点激活同时打开既有 Info Card，并以 0px extra Y offset 把 Marker 箭头尖端移动到详情卡上沿中央附近。PublicLocation、`publicLeadId` 与真实经纬度不变。
- 已打开详情或旧 camera move 尚未 settle 时，点击不同普通 Marker 会抢占旧选择：清理旧 sampling/fallback/pending transition，立即切换 Marker 描边和 camera target，并请求新详情。PublicMapClient 的 selection generation 丢弃迟到的旧响应，保证 A→B latest-selection-wins。
- cluster click 继续使用既有 expansion scale/center/spiderfy，仅增加立即可见的卡片放大与后层扇开展开反馈。
- 顶部固定“🔥 显示全部”，其余五项横向滚动；“拆套”更名为“刚刚拆套”。选择“显示全部”时五项筛选也全部呈现 selected；横向 viewport 增高并增加上下 padding，青绿色高亮描边／阴影不再被裁切。
- Marker 状态色：LAST 玫红、大赏青绿、低机会灰蓝、拆套琥珀。

## 自动验证

- 本轮真机回归定向测试：`7 files / 88 tests PASS`
- Marker A→B 切换定向测试：`2 files / 96 tests PASS`
- 全量 Vitest：`78 files / 859 tests PASS`
- TypeScript：PASS
- ESLint：PASS
- Next.js production build：PASS
- workflow validation：PASS
- 触及文件 Prettier：PASS
- `git diff --check`：PASS
- 微信开发者工具 CLI 最终 `preview`：PASS；AppID `wx4e40b1657ca4563d`；包大小 `948.0 KB / 970706 bytes`

## 真机验证结果

本轮没有代替 Founder 操作 iOS 真机，因此真机状态为 `PENDING`，不能写成通过。建议按以下顺序验收：

1. 对照参考图检查 118×48px Marker、窄体数字/垂直居中、18px 角标、左侧青色弧形轮廓、卡底尖尾和四类状态色；预览与 iOS 真机的字形和位移应一致。
2. 首次轻点普通 Marker：详情应同时打开，Marker 应移动到详情卡上沿正中上方，箭头尖端与卡片上沿近乎贴合。
3. 从 Marker 内开始拖动地图：不得打开详情；短按 Marker 周围地图也不得误触 Marker。
4. 连续轻点不同 Marker，确认每次首次触摸即响应，旧详情响应不会覆盖新选择。
5. 点击 2 个及 10 个成员的 cluster，确认主卡立即放大/扇开，随后镜头放大并拆分；最大倍率同坐标点继续 spiderfy。
6. 检查固定“显示全部”、横向滚动、五项 emoji 文案、“刚刚拆套”、全部筛选同步高亮、描边不裁切、Marker 玫红选中描边与零选择空态。

## 未解决问题

- iOS 真机最终像素仍需人工验收；Native Marker 已主动移除可变 webfont fallback 依赖，改为开发者工具与 iOS 共用的系统字体栈和固定 glyph box，但 Agent 不能把未执行的真机复测写成通过。
- Android 真机未验证。
- 筛选标签仍是 synthetic/public-only prototype；当前 public query contract 没有对应 reason-code 字段。本轮没有为视觉需求扩张数据结构或后端。

未修改 cluster engine、`publicLeadId`、真实坐标、数据结构、CloudBase 或后端；未 commit、push、deploy。
