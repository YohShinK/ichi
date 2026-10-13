# TASK21 地图贡献条例弹窗修订

2026-09-30 Founder确认当前全部截图无误，最新截图视觉门HUMAN_APPROVED；本报告中的截图视觉待审描述已由此覆盖，历史before/旧版本不恢复。该确认不替代端上交互或云端/性能/全回归/资源审批等其他门。完整范围见[视觉验收汇总](v2-e-task-21-founder-visual-acceptance.md)。

2026-09-30 Founder确认预览通过并授权清理。本局部视觉状态HUMAN_APPROVED；临时9条UI行/模拟consent/提交拦截已清除，原页面数据、真实读取/提交方法和Marker投影已恢复。一次性capture脚本已删除，以下“保留待审”文字/脚本路径为历史记录；截图和验证日志保留。当前清理证据：artifacts/task21/preview-cleanup-20260930/{before,after,removed-files}.json。未修改真实账号同意或云端上传，不扩大为整个TASK21/Pilot/RC通过。

2026-09-30 最新视觉补充：按Founder直接要求，正文滚动区已移除独立白底、描边和圆角底面，直接沿用弹窗底色。当前实测background=transparent、borderTopWidth=0px；15章可滚动，九条临时失败示例仍保留。局部8项、微信preview1011360 bytes和Next构建通过，workflow/触及文档格式校验通过；TS/交互逻辑未改，不重复上一轮全量1045/1skip与计时行为检查。新图/元数据在terms-modal-plain-20260930，下方有白框截图为历史。

![最新无底无描边正文](</Users/cunfu/Documents/ichi 2/artifacts/task21/terms-modal-plain-20260930/01-plain-terms.png>)

2026-09-30。状态：`IMPLEMENTED / LOCAL_VALIDATION_PASS / AWAITING_FOUNDER_VISUAL_REVIEW`。本轮直接采用 Founder 提供的十五条正文，完成弹窗排版、3 秒同意倒计时及账号绑定检查。旧核验失败示例继续保留，未获清理确认；TASK21 继续 Pre-Pilot，TASK22 保持锁定。

## 当前呈现

标题“地图贡献条例”正中显示，与正文留出 24px 间距。正文采用有边框的独立滚动文本框，章节标题与段落分层排版，保留全部十五条及各项列表。滚动内容外的主按钮与“暂不同意”固定可见。移除原来的简略“候选测试”文案和内部版本编号展示，正文第十五条仍完整说明条例更新规则。

当前微信 DevTools 390×844、DPR3 实测：弹窗 340×570.6px；标题 292×32px、中心 x195；正文框 292×337.6px、滚动全文高度 5488px，全部 15 个章节可到达。标题中心与弹窗中心一致，正文间距 24px。实际 PNG 为 532×1148；这是 DevTools 页面视觉证据，未记为手机验收。

正文集中在 `apps/client/miniprogram/platform/map-contribution-terms.ts`，内容按 Founder 原文排版；Markdown 粗体与换行转为小程序章节／段落，不改变条例含义或扩充新条款。本文不是另外起草的法律文本。当前修订没有修改服务端公开规则、重新打开云窗口或重置已同意账号。

## 三秒交互

打开未同意弹窗时显示“同意并开启（3秒）”，随后为 2 秒、1 秒；期间按钮灰色且 disabled。满 3 秒后移除倒计时，恢复黑底白字主操作。这里只使用用户要求的三秒延时，没有添加“必须滚到底”条件。

提交方法独立检查页面真实 deadline，而非只依赖显示的秒数，因此提前调用或把显示数字改成 0 都不能提交。每个页面实例独立计时；关闭、离开页面或卸载会清理，重开重新等待 3 秒。正在保存时禁止重复操作；写入失败保持未同意并显示“选择未保存，请稍后重试。”，可以重试。

实际 DevTools 点击 disabled 按钮未触发 handler；满三秒后 disabled=false。原生属性接口将 disabled 返回为字符串，首次取证脚本误按 boolean 判断而退出；修正取证类型后全部重取图，未改产品行为。

## 账号绑定

沿用现有 `CandidateUploadService → v2-shadow-manage-contribution → v2ShadowMapContributionConsent` 账号持久化链路，服务端通过可信小程序上下文派生账号主体，客户端不传任意 owner 或用本机布尔值替代账号同意。用户确认成功后重新读取服务端状态并关闭弹窗；accepted 账号不再显示条例入口，直接调用打开方法也不会弹出。

这次只修正文呈现与阅读延时，没有更改现有 termsVersion／scopeDigest 或要求已同意账号重复确认。未来重大公开范围变化仍按第十五条及当时适用规则处理，不在本轮实施新的版本迁移。

自动行为检查验证成功提交、再次建立页面并读取同一账号状态、关闭重开、离开清理、提前提交拦截及失败不保存；现有服务端测试覆盖账户隔离和幂等同意。DevTools 的“已同意”截图为本地 UI 对照，取图后恢复未同意供 Founder 检查；未替真实账号点击不可撤回的同意，未执行本轮 live consent 写入。

## 截图

### 三秒前不可触发

![三秒倒计时](</Users/cunfu/Documents/ichi 2/artifacts/task21/terms-modal-20260930/01-countdown-disabled.png>)

### 倒计时结束

![倒计时结束](</Users/cunfu/Documents/ichi 2/artifacts/task21/terms-modal-20260930/02-countdown-enabled.png>)

### 正文可滚动至第十五条

![正文末尾](</Users/cunfu/Documents/ichi 2/artifacts/task21/terms-modal-20260930/03-terms-bottom.png>)

### 已同意后不再显示入口

![已同意对照](</Users/cunfu/Documents/ichi 2/artifacts/task21/terms-modal-20260930/04-accepted-hidden.png>)

## 验证与当前保留状态

定向 4 文件 104 项、全量 Vitest 1045 passed／1 skipped、根与 Web TypeScript、ESLint、contracts／workflow、Next.js 构建、微信正式 preview 编译通过。微信预览包 1011080 bytes；正式包扫描不含 DevTools fixture。实际滚动、倒计时 disabled→enabled、早期点击无触发、重开回到 3 秒和 accepted 隐藏均已取证。微信预览不是审核、正式发布或云端部署。

首轮全量有 1 项失败：既有 native-map 源码检查用全文件 `setTimeout(tick` 字符串排除动画轮询，误命中新增加的条例倒计时。将回调改为含义明确的 `updateConsentCountdown` 后全量通过，没有删除或弱化该检查。失败日志和最终日志均保留。Web 产品没有变化，本轮不重复上一轮 26 项 Web 流程；已执行本轮 Next 构建与必要的小程序平台编译／交互验证。

证据目录：`artifacts/task21/terms-modal-20260930/`，包含 capture.json、验证日志、微信 QR／包体信息及截图。所有代码编译完成后才重新注入九条原有临时失败示例，取图结束时停留在新版条例弹窗；同意、核验及删除提交均保持本地预览保护。重新编译会清除这些内存示例，当前已经重新安装；以后仅在 Founder 确认清理时恢复原页面。独立上传 preview 的 `install` 模式只恢复这些示例，不重新执行旧 Marker 取图。

本轮没有 CloudBase 资源／数据／config／flag／allowlist 管理写入或部署，没有 V1 私有记录管理端读取／变更，没有 commit、push 或正式发布。完整 live V1 diff、真实详情 latency、Pilot 协议等既有门不变；本轮不将 TASK21 整体标为通过。
