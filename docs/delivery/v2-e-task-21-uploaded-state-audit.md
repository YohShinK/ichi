# TASK21 已上传页面、条例与核验失败示例

2026-09-30 Founder确认当前全部截图无误，最新截图视觉门HUMAN_APPROVED；本报告中的截图视觉待审描述已由此覆盖，历史before/旧版本不恢复。该确认不替代端上交互或云端/性能/全回归/资源审批等其他门。完整范围见[视觉验收汇总](v2-e-task-21-founder-visual-acceptance.md)。

2026-09-30 Founder确认预览通过并授权清理。本局部视觉状态HUMAN_APPROVED；临时9条UI行/模拟consent/提交拦截已清除，原页面数据、真实读取/提交方法和Marker投影已恢复。一次性capture脚本已删除，以下“保留待审”文字/脚本路径为历史记录；截图和验证日志保留。当前清理证据：artifacts/task21/preview-cleanup-20260930/{before,after,removed-files}.json。未修改真实账号同意或云端上传，不扩大为整个TASK21/Pilot/RC通过。

2026-09-30。当前状态：`AWAITING_FOUNDER_VISUAL_REVIEW / TEMP_UI_FIXTURES_RETAINED`。按本轮上下文，将“条例未统一”理解为“条例未同意”，同时检查样式是否统一。Founder 本轮“ok，这部分做完了”确认上一轮地图状态横条与紧凑 loading 的视觉修订；不扩大为整个 Pre-Pilot、Opportunity 全部视觉点、Pilot 协议或 RC 通过。

## 核验结论

“我上传的版面”在条例未同意时显示条例说明卡、右上“未同意”和“了解并同意”入口。条例状态未知走“条例状态暂不可用”，不冒充未同意。已同意后隐藏入口。卡片目前为 358×162px、灰色入口按钮，**没有采用地图 44px 横条及粉底白字按钮**，这是本轮发现的样式差异；本轮只检查和展示，未擅自改造条例组件。

实际点击“了解并同意”后打开条例详情：340×427px，包含公开范围、版本、同意不可撤回说明；292×52px 主按钮和“暂不同意”均在弹窗内，未发现文字截断、按钮错位或溢出。弹窗有较大留白，仍采用既有固定上限的滚动说明区，并非最新 loading 弹窗的紧凑排版。关闭详情后保留未同意，不保存拒绝或同意。这里的“详情”指条例详情；上传记录卡目前没有另一个可点击的记录详情页。

备注未通过点击“修改备注”后打开现有 316×256px 弹窗；输入框、解释文字和“重新核验备注”完整可见。解释清楚仅重验备注，不重复地点或照片核验。失败卡片采用既有黑色状态胶囊、黑底白字操作按钮；没有改成地图状态横条，供 Founder 检查是否需要进一步统一。

Marker 上方出现“· 状态”的原因是上一轮取图脚本把“演示 IP · 状态预览”写进了演示 `boardShortLabel`。正式 presenter 没有追加机会状态。当前演示数据改为“演示 IP”，由正式 presenter、native projection 和 Canvas renderer 生成截图；下方独立蓝色标签仍为“刚刚拆套”。未对真实 IP 做删字猜测，也未改变公开数据合同。旧图及旧 capture 脚本作为历史证据保留，新演示以本报告为准。

## 临时示例

通过正式 `loadMyCloudRecords` 适配器消费本地 fake transport，生成 7 个失败／异常和 2 个对照。没有直接伪造 UI 状态映射，也没有创建云端上传记录、真实核验任务或 Storage 文件。

| 示例 | 服务状态 | 页面状态 | 现有操作 |
| --- | --- | --- | --- |
| N0T001 备注示例 | NOTE_FAILED | 备注未通过 | 修改备注 |
| PH0002 照片示例 | PHOTO_FAILED | 照片核验失败 | 重新上传 |
| RV0003 核验异常 | NEEDS_REVIEW | 核验异常 | 重新核验 |
| ER0004 服务异常 | PROVIDER_FAILED | 核验异常 | 重新核验 |
| LC0005 地点不符 | LOCATION_FAILED | 核验失败 | 无 |
| MM0006 内容不符 | MISMATCH | 核验失败 | 无 |
| IV0007 证据无效 | INVALID_EVIDENCE | 核验失败 | 无 |
| OK0008 已上传对照 | APPROVED | 已上传 | 无 |
| PD0009 待核对对照 | PROCESSING | 待核对 | 无 |

明确失败的最后三种状态目前没有重新核验入口，符合最新 V1-F 状态机。若希望用户从这些情况恢复，需要另外确定地点／内容／证据各自如何修正，不能仅把原来的失败任务重复提交当作恢复。本轮未改变这一产品规则。

## 当前小程序中的保留状态

当前微信开发者工具停在“我上传的版面”，展示 9 条临时记录，列表可滚动，“了解并同意”和“修改备注”可以实际打开。刷新保留这 9 条。临时同意、提交备注、重传、重新核验及删除确认都被本地预览保护拦截，点击只给临时提示，避免把测试数据送入真实服务或保存不可撤回的条例选择。保留原页面数据和方法的备份仅在运行时内存；没有将本人原有数据写入证据文件。

用户明确要求核对通过后再删除，所以本轮**没有清理**。仅在 Founder 之后确认通过并要求清理时，运行独立 capture 工具的 `restore` 路径，恢复原页面数据、方法与原生 Marker 投影缓存。它不是数据库删除。重新编译／关闭开发者工具后这些内存示例会自然消失，需要重新注入；它们不会随二维码进入手机预览或正式包。脚本位于 `artifacts/task21/uploaded-state-audit-20260930/capture.cjs`，不在 `miniprogramRoot` 内。

## 截图

模拟视口 390×844、DPR 3；实际 DevTools PNG 为 532×1148。这是开发者工具注入页面的视觉证据，不是真实后台核验失败、手机验收或 Pilot 证据。

### 未同意与失败列表

![未同意与失败列表](</Users/cunfu/Documents/ichi 2/artifacts/task21/uploaded-state-audit-20260930/01-not-accepted-list.png>)

### 条例详情

![条例详情](</Users/cunfu/Documents/ichi 2/artifacts/task21/uploaded-state-audit-20260930/02-terms-detail.png>)

### 修改备注

![修改备注](</Users/cunfu/Documents/ichi 2/artifacts/task21/uploaded-state-audit-20260930/03-edit-note.png>)

### 照片失败与重新核验

![照片失败与重新核验](</Users/cunfu/Documents/ichi 2/artifacts/task21/uploaded-state-audit-20260930/04-photo-and-retry.png>)

![两种核验异常](</Users/cunfu/Documents/ichi 2/artifacts/task21/uploaded-state-audit-20260930/04b-technical-retries.png>)

### 地点、内容及证据失败

![明确失败](</Users/cunfu/Documents/ichi 2/artifacts/task21/uploaded-state-audit-20260930/05-terminal-failures.png>)

### 已上传与待核对对照

![对照状态](</Users/cunfu/Documents/ichi 2/artifacts/task21/uploaded-state-audit-20260930/06-invalid-and-controls.png>)

### Marker 仅显示 IP

![Marker 仅显示 IP](</Users/cunfu/Documents/ichi 2/artifacts/task21/uploaded-state-audit-20260930/07-marker-ip-only.png>)

## 验证与边界

现有 cloud-records、contribution-lineage、public-map-presentation 3 个测试文件共 78 项通过；workflow 8 个必需文件、8 份触及 Markdown 格式、独立 fixture 语法和 scoped diff 检查通过。正式适配器确认 9 种状态／操作；实际点击条例入口、关闭、备注修改；提交与重传／重试点击均命中预览保护；刷新后卡片数量和“云端 9 个”一致。当前 Marker 的 IP 为“演示 IP”，独立状态为“刚刚拆套”，原生 Marker 数量为 1。证据：capture.json、verification.json、targeted-tests.log 和本报告截图。

首次本地注入遇到 DevTools evaluate 数组跨上下文序列化问题，视图层缺少 length、计数出现 NaN；改用 automation setData 序列化、刷新时保留既有预览数组，补验实际计数后全部重取图。这是预览工具问题，未修改正式计数逻辑；错误不记为产品核验通过。

本轮产品 TS/WXML/WXSS、后端、公开合同变更为 0。fixture 和治理文档单独验证；沿用上一轮正式构建证据，不将 1021 测试／26 Web 流程／微信 preview 记为本轮重跑。没有云资源、配置、数据、flag、allowlist 管理写入或部署，也没有重新执行完整 V1 cloud diff。没有 Git commit/push/PR 或正式发布。当前 TASK21 继续 Pre-Pilot；T20-P2-01 真实性能与其余平台／协议门未关闭，TASK22 仍锁定。
