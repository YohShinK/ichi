# ICHI README 内容与素材审计

日期：2026-10-19。制作范围：`README.md`、`assets/readme/` 与本目录的审计交付。分支 `main`。用户在本地制作及文案调整后，明确授权将本组文件提交并推送至 main。开始时已有两份 memory-bank 修改及视觉资料、output 等未跟踪文件，继续保留在本机。

## Skill 与设计决定

已安装并显式读取个人技能目录 `~/.codex/skills/beautify-github-readme/SKILL.md`，实际按 `$beautify-github-readme` 的 README mode 工作。使用 `content-architecture.md`、`visual-direction.md`、`project-native-hero.md`、`github-readme-canvas.md`、`svg-production.md`；安装已在前一轮成功，本轮不重复安装。PDF 技能仅用于检查九页合并文件，不改原 PDF。

- 读者：希望看清现场版面、发现附近线索的抽赏玩家，其次是开发者。
- 一句话价值：拍照识别抽赏版面，附近好版有迹可循。
- 主要证据：九页成品中的真实小程序手机界面，以及 REMAIN 对比和真实压力测试局部。
- 第一次成功操作：微信搜索「ICHI 一奇抽赏助手」，拍摄或导入版面并核对识别结果。
- 视觉主题：白底、黑色赏级结构、少量玫红、原生 Marker 与真实小 ICHI；静态 SVG 排版加原图裁切。无 AI 生图、GIF、外部图库或附加宣传署名。

## 现有 README 与阅读顺序

现有 70 行 README 以内部合同、历史状态和开发门禁开头，没有实际产品截图、微信使用入口或用户操作路径；多段旧「尚未发布」与当前 2.0.0 上线事实并置，容易混淆。保留当前分享合同、2.0.0 / 2.0.1 发布区别、正式文档入口、开发命令、图片测试依赖与 Agent 纪律；历史阶段链接移到开发与文档部分，不继续占据首屏。

成品顺序：产品身份与微信入口 → 为什么需要 ICHI → 三组真实功能 → 最短上手 → 三项技术决策 → 小表格技术栈 → 开发验证 → 文档与许可。关键文字、步骤和命令继续使用 Markdown，图片失效时仍能理解与操作。

## 已核实事实与证据

| 事实 | 证据 | README 表述边界 |
| --- | --- | --- |
| 正式产品为微信小程序，线上 2.0.0 | `memory-bank/progress.md` 顶部、统一版本收口报告 | 可写 V2.0 已上线、好版地图已上线；不把 package.json 的工程版本当产品版本 |
| 2.0.1 已开发上传、未正式发布 | 同上；`apps/client/README.md` | 默认地图首页与系统体验不宣传为线上 2.0.0 能力 |
| 拍摄/导入、识别校正、大赏设定、抽赏记录 | `pages/home/index.ts` / WXML；`platform/draw-session.ts` | 用户必须核对识别；概率不改变随机结果 |
| 观察窗口按当前余票计算 | `platform/board-outlook.ts`、`packages/core/src/probability.ts` | 确定性计算，不承诺提高中奖率 |
| 附近地图、IP 检索、状态标签、详情和重叠列表 | `platform/public-map-*`、当前正式文档及成品第 4 页 | 记录有来源和现场时间，可能滞后；不声称实时或全店覆盖 |
| REMAIN / R2 默认、百炼 qwen3.7-flash | `services/cloudbase/functions/recognize-board/index.js`、同目录 `.env.example` | 模型提取余票，代码校验/归一并计算；不采用设计稿回顾中的准确率与耗时约值 |
| 状态前进、轻量确认与受控共享 | `packages/v2-map/src/board-instance.ts`、production phase2、现行分享合同 | 继承确认和条例准入分开；不增加逐条二次分享动作 |
| Canvas PNG → 缓存 → 原生 iconPath、聚合 | `platform/marker-canvas-renderer.ts`、`public-map-cluster-engine.ts` 等 | 黑色数字是代表版面余票；玫红角标是聚合数；不调换含义 |
| 历史真实 500 Marker 压测截图 | `docs/visual/ichi-map-mechanisms-a2/assets/source-manifest.json` 与原图 | 仅作为当时测试画面，不宣称所有设备不卡、FPS、P95 或线上用户规模 |
| 原生客户端 / 网页验证 / 云服务分工 | project.config、各 package.json、成品第 9 页 | Next.js 15 / React 19 是网页验证，不是小程序运行框架 |

当前无产品开发区块；本任务只执行用户新授权的 README 文档制作，不重开 V2 历史任务或解锁 V3。

继承说明以真实实现校正：`board-instance.ts` 与 production `phase2/pipeline.mjs` 对唯一无冲突候选建立关联；歧义保持待判断，人工回答也重新通过冲突校验。九页的“轻量确认”不扩写为每条上传都必须再点一次确认，也不与地图条例准入混为一谈。

## 九页原件映射

源目录：桌面 `9 图/`；九张均为 2480×3508 PNG。合并文件 `ICHI 一奇抽赏助手小程序说明文档.pdf` 为 9 页，图片页，无可提取正文。原件不写入、不移动、不覆盖。

| PDF 页 | PNG | 内容 | 选材与限制 |
| --- | --- | --- | --- |
| 1 | `首页.PNG` | 封面 / 品牌 | 参考品牌语法；Logo 优先采用仓库同源原始头像素材，不缩贴 A4 |
| 2 | `目录.PNG` | 目录 / 项目信息 | 核对真实小程序码；姓名、教育资料、AppID、个人履历不裁入 README |
| 3 | `01.PNG` | 定位 / 拍摄识别抽赏 | 下半部三张真实手机界面，裁掉页眉页脚；原拍摄画面已模糊 |
| 4 | `02.PNG` | 功能 / 地图 | 上半部观察窗口、抽取记录、上传记录；下半部地图、详情、重叠列表。遮挡账号、记录码和精确位置 |
| 5 | `03.PNG` | 场景 | 可用上部票位机制局部；本轮以第 6 页理念短句代替，避开下方第三方商品与人群拼贴 |
| 6 | `04.PNG` | 理念 / 反馈循环 | 只裁顶部产品理念短句；密集全图不压入 README |
| 7 | `05.PNG` | HYBRID → REMAIN | 只取第 04 阶段的票位和箭头对比，排除 50%→90% 与 20s→10s 回顾约值 |
| 8 | `06.PNG` | Marker / 继承 / 桥接 | 采用真实压测局部与原生 Marker 资源；桥接重排为简洁 SVG，Markdown 说明条例和自动准入 |
| 9 | `07.PNG` | 架构 / 技术栈 | 核对技术关系；README 用精简表格与数据路径，不再贴整页小字表格 |

最终逐图源文件、原始像素裁切框 `[left, top, right, bottom]`、遮挡区域和 SHA-256 记录在 `assets/readme/source/asset-manifest.json`。所有裁切均为非破坏性新副本。

## 品牌与隐私

| 资产 / 颜色 | 真实来源 | 使用 |
| --- | --- | --- |
| Logo | `apps/client/miniprogram/assets/v1-29/ichi-avatar.png` | 从原始白底中裁出原 Logo，不重画角色 |
| 小 ICHI 表情 | 同目录 `ichi-recognition-mascot.png` / `ichi-mascot-small.png` | 只使用现有角色；按实际排版选择，不强加装饰 |
| Marker | `docs/visual/ichi-map-mechanisms-a2/assets/marker-visual-sample.png` | 真实 Canvas 产物，明确为渲染样例 |
| 主玫红 `#E014A0` | 正式小程序 `pages/home/index.wxss` 的主按钮 | 标题关键字和少数技术重点；旧网页 Token 的橙色不采用 |
| 薄荷青 `#20D0B6` | `platform/marker-canvas-renderer.ts` | 仅保留原 Marker 组件颜色 |
| 白 `#FFFFFF` / 黑 `#111111` / 灰 `#687386` | 正式页面与 Marker | 白底与黑色结构，灰用于辅助信息 |

使用系统无衬线及等宽字体回退，不复制字体。截图只裁切、缩放、隐私遮挡与压缩，不新增 UI、点位、角色或数据。地图底图及街道进行隐私模糊处理，保留原截图中真实 Marker 的相对位置与原貌；用户头像、昵称、备注个人指代、记录码与具体位置不公开。

完整九页 PDF 含个人履历与部分历史截图文字，本轮不复制到公开资产目录，也不在 README 中添加公开下载链接；原 PDF 继续仅作本地审阅。小程序码使用同文件夹已有完整 1280×1280 原图，保留全部定位图案与白色静区，不声称已做微信实机扫码验证。

## 验证计划

生成 900px / 360px、浅色 / 深色环境的离线 README 预览和截图；检查图片换行、SVG 文字边界、中文回退和链接。使用 Skill 自带 `audit_readme.py`，另核查本地 Markdown 链接、PNG/WebP 解码、文件体积、SVG 无脚本/外链/foreignObject、隐私遮挡和原件 SHA。执行 `node scripts/validate-workflow.mjs` 与分享流程防回退校验。仅文档与资产变更，不以旧产品测试冒充本轮真机验收。
