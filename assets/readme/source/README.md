# README 专属资产来源

`asset-manifest.json` 逐项记录原件 SHA-256、像素裁切框、遮挡、输出尺寸与哈希。`@nine/` 对应用户提供的桌面 `9 图/`，原件不随公开 README 分发。公开资产不依赖这个本机路径。

- `hero-layout.svg`：可编辑排版源，使用相邻资产目录的原 Logo 与隐私处理后的真实 UI；最终嵌入 README 的是 `hero.webp`，不依赖 SVG 内的相对图像引用。
- `../sharing-flow.svg`：依据当前分享合同绘制的简化技术关系图，正文保留完整门禁语义。
- `build-assets.py`：只读九页原件和仓库品牌资产，生成新裁切副本；需要 Pillow。
- `render-preview.mjs`：使用仓库已有 Playwright 生成离线预览与 900px / 360px、浅色 / 深色截图；Marked 和 Sharp 仅用作本地文档制作工具，不新增产品依赖。

维护者重建示例：

```bash
python3 assets/readme/source/build-assets.py --nine-dir /path/to/nine-pages
node assets/readme/source/render-preview.mjs /path/to/authoring/node_modules artifacts/readme-redesign-preview
python3 /path/to/beautify-github-readme/scripts/audit_readme.py README.md
node scripts/validate-workflow.mjs
```

提供给第二条命令的工具目录需有 `marked` 与 `sharp`。Playwright 使用仓库 `apps/web` 已有版本与配套的本地浏览器；没有浏览器时命令会明确失败，不启动交互式浏览器或控制用户已有标签页。

截图没有新增角色、假地图、假点位或业务数据。地图底图隐私模糊，Marker 与 UI 从原图恢复，个人标识和地点备注遮挡；小程序码保留原图全部像素和静区，仅转换为无元数据 PNG。完整 PDF 含个人履历，未复制进本目录。
