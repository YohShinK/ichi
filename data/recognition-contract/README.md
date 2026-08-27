# Recognition contract

生产默认协议为 R2 direct-remaining：`prompt/ichi-board-vlm-r2-direct-remaining-1.0.0.txt` 与 `schema/board-provider-r2-direct-remaining-1.0.0.schema.json` 固定模型只返回身份、视觉赏级、直接 R 和可选可见数字对象。`recognize-board/r2-direct-remaining-resolver.js` 对非 null Provider R（包括 0）优先，否则只按 observation object 数量回退；不执行 T/P/U、序列或方向推理。第一阶段输出 `RecognitionContract 1.0.0` 时 T/P 保持 null。冻结 H0 `hybrid_semantic` 仍是唯一生产回滚，R1 Prompt/Schema/resolver 保留为历史回归；旧 v4 协议、Schema 与 adapter 只用于历史 fixture 迁移。

当前生产候选由三层组成：

1. `prompt/ichi-board-vlm-4.0.0-rc1.txt`：给 `qwen3.7-flash` 的单一语义机器 Prompt；直接要求 IP／原文／主题、价格、视觉顺序 raw tier、容量、`ticketPattern` 及该模式唯一需要的证据。
2. `schema/board-provider-extraction-4.0.0-rc1.schema.json`：与 Prompt 示例相同形状的 AJV Provider 边界；拒绝额外字段、遗漏的 null、错误类型和数字字符串。
3. CloudBase `recognize-board` 的 `normalizeExtraction`：逐 raw tier 确定性计算 pasted，再合并 A1/A2 等父字母、按视觉顺序分配 SP1—SP32，并转换成小程序稳定的 RecognitionContract 1.0.0。

旧 `ichi-board-vlm-1.x/2.x/3.x`、旧 Provider Schema 与 compact adapter 仅用于历史迁移／回归，不是当前生产请求格式。

生产请求固定为 `qwen3.7-flash`、`enable_thinking=false`、`response_format=json_object`、`temperature=0`、`max_pixels=6291456`。照片通过 CloudBase 私有临时 Storage 对象和 5 分钟 HTTPS URL传递；云函数不下载 Buffer、不转 Base64、不把图片或模型原文持久化。

`totalTickets` 与 pasted 独立：`empty → 0`、`prefix → firstOpen - sequenceStart`、`full → total`、`irregular → pastedDirect`、`unknown → null`。缺少证据保持 `null`，禁止以 total、physical ticket count 或空坐标数组补成全贴。

赏票送审使用独立的 `ichi-draw-ticket-vlm-1.0.0-rc1.txt` 与 `draw-ticket-provider-extraction-1.0.0-rc1.schema.json`；服务端按 `recordId + boardId + submissionVersion` 做增量、幂等与乱序保护。
