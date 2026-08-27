# V1 版面识别图片传输与性能基线

> 状态：APPROVED FOR INTEGRATION
> 日期：2026-08-19
> 主模型：`qwen3.7-flash`

## 1. 最终链路

```text
微信小程序拍照
→ 客户端长边 2400px、JPEG quality 85 的轻量处理
→ wx.cloud.uploadFile 直传私有 recognition-temp/
→ 小程序只把任务绑定 fileID 和图片元数据交给 recognize-board
→ 云函数 getTempFileURL(fileID, maxAge=300s)
→ 临时 HTTPS URL 作为百炼 image_url
→ qwen3.7-flash（enable_thinking=false、json_object、4MP）
→ JSON.parse
→ AJV Provider Schema
→ Normalize / 领域守恒
→ ICHI RecognitionContract 1.0.0
→ 小程序生成可编辑版面
```

生产链路禁止重新引入：

```text
fileID → downloadFile → Buffer → Base64 → Data URL → 百炼
```

云函数不读取图片字节、不做 Base64 转码，也不把提供方原文直接返回小程序。

## 2. 客户端图片处理

- 支持 JPEG、PNG、WEBP；相机照片优先转为 JPEG。
- 原图长边不超过 `2400px` 且文件不超过约 `8 MiB` 性能目标时不重复压缩；这不是 Storage 的硬限制。
- 长边超过 `2400px` 时使用 `quality=85` 缩至 `2400px`。
- 第一遍仍超过性能目标时才使用 `quality=82`、长边 `2048px` 的兜底。
- 预处理后的尺寸、字节数和 MIME 只作为请求元数据；同步云函数事件不承载图片字节。
- 可选裁剪和透视矫正必须以后用真实样本证明提升准确率后再加入，不能自动裁掉赏级或票位。

## 3. CloudBase 对象与临时 URL

- 对象路径必须绑定服务端预占任务：`recognition-temp/{recognitionJobId}/{requestId}.{ext}`。
- 存储、数据库和云函数默认私有；客户端不能用任意 fileID 冒充任务输入。
- 云函数只调用 `getTempFileURL`，签名 URL 有效期 `300s`，只在函数内存中存在。
- 完成、失败或超时后，客户端和云函数均尝试删除对象；COS 最短可执行生命周期 `1 天` 只兜底异常孤儿。
- 不记录完整 fileID、临时 URL、签名参数、图片字节、Data URL 或模型原文。
- 临时 URL 是一次性的传输凭证，不是长期业务数据，也不能写入审计集合。

## 4. 百炼请求

```json
{
  "model": "qwen3.7-flash",
  "response_format": { "type": "json_object" },
  "enable_thinking": false,
  "temperature": 0
}
```

图片作为 `image_url` 输入，并显式设置 `max_pixels=4194304`。不设置可能截断 JSON 的 `max_tokens`。固定提示必须包含 JSON 输出要求；不开工具、不联网、不带历史会话。

主模型只调用一次。`qwen3.7-plus` 只作为未来困难样本兜底候选；在“图像输入 + strict JSON Schema”的确切官方接口、费用门和真实样本均验证前，生产中保持关闭，不能静默产生第二次费用。

## 5. 契约边界

提供方输出先通过 [`board-provider-extraction-3.0.0-rc1.schema.json`](../../data/recognition-contract/schema/board-provider-extraction-3.0.0-rc1.schema.json)。该 Schema 直接使用语义字段，允许 `totalSlots/pastedSlots/unknownSlots` 为 `null`，接纳中文主 IP、原始 IP 文本、可选主题、逐排票位与总数证据来源，但拒绝额外字段、错误类型和非法枚举。

云函数再完成：

- A1/A2、B1/B2……合并到所属 A—Z 赏；
- 独立特殊赏映射为 SP1—SP4；
- 票位 open／covered／unknown 守恒；
- 缺失已贴数时不得把全部票静默当成已贴或未抽；
- IP、单抽价格、完整度和低置信问题转为稳定业务字段；
- 统一输出 `RecognitionContract 1.0.0`。

这层是提供方适配层（anti-corruption layer）：以后更换 Qwen、Gemini 或其他模型时，小程序契约不变。

## 6. 性能与诊断

目标是端到端：`P50 < 5s`、`P90 < 8s`、`P95 < 10s`，不是保证每次硬性小于 10 秒。每次只记录纯数字和无敏感枚举：

- `claimMs`
- `imageUrlMs`
- `providerMs`
- `jsonParseMs`
- `providerSchemaMs`
- `normalizeMs`
- `persistMs`
- `totalMs`
- 输入字节／像素
- prompt／image／completion／total token
- 输出字符数

如果 P95 超标，必须按阶段定位上传、函数冷启动、临时 URL、百炼拉图、模型首 token 或生成耗时，不能只调大总超时。

## 7. 失败闭合

- 获取临时 URL 失败：释放预占并返回服务暂不可用；
- 百炼无法拉图：记录固定类别 `image_download_failed`，不记录 URL；
- JSON.parse 或 AJV 失败：返回 `RECOGNITION_SCHEMA_INVALID`；
- 目标版面不唯一、缺边或细节不足：要求重拍；
- 关键数量不确定：保留可编辑字段并阻止直接确认；
- 所有失败路径继续执行双端删除和配额释放／对账。

## 8. 验收

- 静态测试证明请求只有 HTTPS URL，不含 `data:image`、Base64 或 Buffer；
- 云端真实调用证明百炼可下载 5 分钟临时 URL并返回 JSON；
- 真实照片覆盖中日文小字、多版面、SP、A1/D1 分支和不规则贴票；
- CloudBase 日志证明阶段耗时可观测且无敏感 URL；
- 调用结束后对象不可继续访问；
- 真机 P50/P90/P95、准确率、用户修正量和单次成本由用户最终验收。
