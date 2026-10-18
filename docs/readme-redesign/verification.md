# ICHI README 本地交付与验证

日期：2026-10-19。制作与文案调整完成，自动检查通过。用户随后明确授权将 README、配套资产与本目录说明提交并推送至 main；下文保留制作阶段的验证记录。

## 提交与推送授权

重新 fetch 后，本地 main 与 origin/main 均为 `3c6931cbb2b3bffc013353f0d494fe000e470bb1`，远端已包含 2.0.0 的合并记录。本次新增提交范围为 `README.md`、`assets/readme/` 与 `docs/readme-redesign/`，共 25 个文件。两份原有 memory-bank 修改、独立视觉原件与 output 资料保持本机状态。推送回执由本次 Git 提交、远端分支及关联 Actions 记录确认。

## 安装与实际调用

- 技能实际位置：`~/.codex/skills/beautify-github-readme/`；其 `SKILL.md` 与 references、scripts 均存在。
- 前一轮已由 Codex 的 `skill-installer/scripts/install-skill-from-github.py` 成功安装，本轮检查后复用，没有重复安装。
- 本轮显式读取 `SKILL.md` 并实际按 `$beautify-github-readme` 的 README mode 完成审计、视觉决定、资产制作、正文重构、渲染、审计和交付。
- 实际读取并应用的指引：`content-architecture.md`、`visual-direction.md`、`project-native-hero.md`、`github-readme-canvas.md`、`svg-production.md`。没有调用 AI 生图、动效或 Skill 宣传署名流程。
- 用户任务已指定整份重构与“静态 SVG 排版 + 真实原始资产”，因此没有重复询问模式与实现选择。PDF 技能只读核对了原合并文件的页数与元数据；实际裁切优先使用完整九张 PNG。

## 修改范围

| 文件组 | 内容 |
| --- | --- |
| `README.md` | 首屏身份、微信入口、真实功能、上手路径、三项技术决策、技术栈、开发命令、版本与许可 |
| `assets/readme/` 的 17 个视觉资产 | Hero、九个手机 UI 局部、理念短句、REMAIN 对比、桥接图、原生 Marker、压测局部、小程序码、同源 Logo |
| `assets/readme/source/` 的 5 个文件 | 可编辑 Hero SVG、逐图来源清单、裁切脚本、离线渲染脚本与维护说明 |
| `docs/readme-redesign/asset-plan.md` | 先行内容/品牌/素材审计与当前事实依据 |
| 本文件 | 最终验证与交付边界 |

制作阶段修改 1 个已有文件，新增 24 个文件。新增 README 资产及其可编辑源合计约 **0.80 MiB**，未把九张 A4 原图或 12.9 MB 合并 PDF 填入 Git。随后按用户要求清理正文中的防御性表达，并更新四组离线预览。

开始时的 `memory-bank/architecture.md`、`memory-bank/implementation-plan.md` 修改以及原有未跟踪设计资料均保持。对开始时 1,123 个本地文件的内容哈希比对，唯一变化是授权重写的根 README；九页原图、原合并 PDF、小程序码及其余原件均未修改。业务源码、配置、依赖清单与锁文件没有改动。

## 素材来源与隐私

每张图的源文件、页号对应、原始像素裁切框、具体遮挡、输出尺寸与 SHA-256 见 `assets/readme/source/asset-manifest.json`，九页总映射见 `asset-plan.md`。

- 拍摄 / 核对 / 抽赏：原说明书第 3 页 `01.PNG` 的真实手机界面。
- 地图 / 详情 / 重叠列表 / 观察窗口 / 抽取记录 / 上传记录：第 4 页 `02.PNG` 的真实手机界面。
- 理念短句：第 6 页 `04.PNG`；REMAIN 对比与原始箭头：第 7 页 `05.PNG`，排除准确率、耗时约值。
- 500 Marker 局部：第 8 页 `06.PNG`，并由仓库已有真实压测原图与 provenance 清单交叉支持。数字与标签均未改写，不推导 FPS、所有设备表现或线上用户量。
- Logo：原客户端 `ichi-avatar.png`；Marker 样例：现有 Canvas 产物 `marker-visual-sample.png`。没有创造新角色、产品 UI 或地图点位。
- 桥接图：依据当前 `map-upload-sharing-contract.md` 的确定性 SVG 简化图；完整语义保留在 Markdown。
- 小程序码：桌面九图文件夹的完整 1280×1280 原图，仅无损转 PNG；解码后的所有 RGB 像素与原始 JPEG 解码结果一致，未裁切静区。

地图底图隐私模糊，原 Marker 相对位置及原始像素保留；头像/上传者或地点标识、精确街道、地点备注与记录码不进入公开副本。PNG/WebP 均重新检查解码和元数据，未携带 EXIF、XMP 或注释。原文件不受这些处理影响。

完整 PDF 含参赛个人履历，保留本地审阅，未加公开下载链接。第 5 页的第三方商品与人群拼贴未采用。没有未补齐的必需九页素材。

## 自动检查

| 检查 | 结果 |
| --- | --- |
| Skill `scripts/audit_readme.py README.md` | PASS，16 个本地图片引用，SVG 基础检查通过 |
| 本地 Markdown 文档链接 | PASS，19 个目标均存在 |
| 页内导航与图片加载 | PASS，四种预览无断链、缺图 |
| 900px 内容宽度 / 360px 视口 | PASS，均无整页横向溢出；手机截图自然换行 |
| 浅色 / 深色环境 | PASS，四组离线预览和最终截图；图片有安全底色 |
| SVG 与 Hero | PASS，viewBox、title、desc、系统字体；无脚本、foreignObject、远程图像/字体或动画；Hero 文本边界在画布内 |
| 图像及来源完整性 | PASS，17 个视觉资产输出哈希、源文件哈希、解码、元数据与引用检查通过，无遗留未用根资产 |
| 原件及改动范围 | PASS，1,123 文件基线比对，除 README 外原有文件不变；新增文件仅 README 专属目录 |
| `node scripts/validate-workflow.mjs` | PASS |
| `node scripts/validate-upload-sharing-flow.mjs` | PASS，未回退二次分享流程 |
| `corepack pnpm --filter @ichi/web build` | PASS，Next.js 15.5.6 实际生产构建成功 |
| 新增制作脚本 / JSON 格式、`git diff --check` | PASS |

构建有既有的云函数 Node 20 engine 提示与 Next ESLint plugin 提示，未阻断构建；本轮没有改动相关设置。安装、开发、测试等命令与当前各 package.json/CI 核对，未为文档重跑全套产品 Vitest 或真机测试，也未调用模型或写入生产数据。

离线预览模拟 GitHub 内容宽度与常用 Markdown 样式；尚未发布到 GitHub，因此不冒称完成线上 GitHub 页面验收。四组截图为审阅展开了历史压测折叠项。实际字体回退仍由阅读设备决定，未冒称 Windows/Android 真机逐一验收。

## 事实校正

- 2.0.0 是已确认线上版本；2.0.1 仅开发上传，系统体验草稿与默认地图主页不混写为线上能力。
- 原上传确认表达分享意愿，V1 保存独立于条例；当前账号条例同意覆盖其此前及以后合格已上传记录，Bridge 准入 V2 后自动生成地图，不增加二次分享操作。
- 同版面关联按源码采用唯一无冲突规则，歧义不强并；用户协助判断也不能绕过冲突校验。九页“轻量确认”不扩写成每条上传的新门禁。
- 模型提取余票信息，代码归一并确定性计算；不承诺中奖率提升、全网实时覆盖或未经支持的识别性能。
- 没有新增项目 LICENSE，不将私有工程或公开代码展示擅自宣称为 MIT / 免费商用。

## 本地预览与 diff

以下为本机忽略目录内的交付，不被根 README 当成公开链接引用：

```text
artifacts/readme-redesign-20261019/
  preview.html                         离线 README，直接打开即可审阅
  desktop-900-light.png / dark.png      桌面完整截图
  mobile-360-light.png / dark.png       手机完整截图
  *-first-screen.png                   四种首屏截图
  review.diff                          README diff + 新增文本 diff / 二进制资产清单
  git-diff-readme.txt                   原始 git diff -- README.md assets/readme/
  render-checks.json                    四种宽度/主题的加载与布局回执
  integrity-checks.json                 来源、范围、元数据与哈希回执
  README.before.md                     修改前备份
```

新增资产尚未跟踪，因此普通 `git diff` 本身只显示 README；`review.diff` 补充了所有新增文本的 diff 与二进制资产清单，没有为了展示 diff 而暂存文件。

小程序码未代做微信实机扫码；必需制作素材齐全。用户已在后续指令中授权本组 README 文件提交与推送，按本页顶部的范围执行。
