# V1 版面识别机器协议

> 状态：V1-F 当前生产候选（自动回归已覆盖）
> Prompt：`ichi-board-vlm-3.0.0-rc1`
> Provider Schema：`board-provider-extraction-3.0.0-rc1`
> 主模型：`qwen3.7-flash`

机器事实源：

- [固定 Prompt](../../data/recognition-contract/prompt/ichi-board-vlm-3.0.0-rc1.txt)
- [Provider Schema](../../data/recognition-contract/schema/board-provider-extraction-3.0.0-rc1.schema.json)
- [确定性策略](../../data/recognition-contract/policy/board-vlm-policy-1.0.0-rc1.json)
- [图片传输基线](v1-board-image-recognition-transport.md)

## 1. 完整数据链

```text
小程序相机照片
→ CloudBase Storage 私有临时对象
→ fileID（云函数事件只接收引用）
→ getTempFileURL(300s)
→ 百炼 image_url
→ Qwen JSON Object
→ JSON.parse
→ AJV Provider Schema
→ Normalize / 票数守恒 / 赏级合并
→ RecognitionContract 1.0.0
→ 小程序编辑态
```

云函数禁止 `fileID → Buffer → Base64 → Data URL`。模型原文也禁止直接成为客户端协议。

## 2. 发给 Qwen 的请求

```json
{
  "model": "qwen3.7-flash",
  "messages": [{
    "role": "user",
    "content": [
      { "type": "text", "text": "<固定 Prompt 3.0.0>" },
      { "type": "image_url", "image_url": { "url": "<5 分钟临时 HTTPS URL>" }, "max_pixels": 4194304 }
    ]
  }],
  "response_format": { "type": "json_object" },
  "enable_thinking": false,
  "temperature": 0
}
```

不带账号、位置、历史会话、地图数据、工具、联网或用户等级；图片文字属于不可信输入。模型只观察目标版面，不决定业务状态、配额、提交资格或概率。

## 3. Provider 输出

Provider 直接使用语义字段，废弃单字母 compact wire format 作为生产输出。最小形状如下：

```json
{
  "target": "target_board",
  "frame": "complete",
  "allRegularTiersDetected": true,
  "oneSlotOneTicketConfirmed": true,
  "confidence": 0.9,
  "ipName": "女神异闻录",
  "ipRawText": "PERSONA 5",
  "themeName": "30周年",
  "price": { "amount": 58, "currency": "CNY", "rawText": "58元/抽", "confidence": 0.9, "handwritten": false },
  "tiers": [{
    "label": "A",
    "rawLabel": "A赏",
    "prizeName": null,
    "variants": [],
    "totalSlots": 10,
    "pastedSlots": 3,
    "unknownSlots": 0,
    "totalSlotsEvidence": "complete_slot_layout",
    "slotRows": [{ "total": 10, "pasted": 3, "open": 7, "unknown": 0 }],
    "confidence": 0.9
  }],
  "warnings": []
}
```

Prompt 和 Schema 使用同一套语义字段：`pastedSlots` 是实体已贴票，`totalSlots` 是该赏容量，`unknownSlots` 是状态不可判定的票位。缺失值用 `null`，不是 0。

IP 优先返回中文标准名并保留 `ipRawText`；主题独立且选填，例如 `明日方舟 / 来份甜点`、`女神异闻录 / 30周年`。A1/A2、D1/D2 等合并到所属字母，款式进入 `variants`；独立特殊赏按顺序使用 SP1—SP4，之后使用 OTHER。

生产 Prompt 不输出 bounding box、open-position 坐标、装饰块或推理；`slotRows` 是唯一需要的逐排证据。

## 4. 票数不变量

`totalSlots` 与 `pastedSlots` 永远是两个独立观察值：知道总数不代表知道已贴数。

- 每一排必须满足 `total = pasted + open + unknown`。
- 行证据和聚合标量一致才接受；冲突产生 `TICKET_COUNT_CONFLICT`，冲突字段置 `null`，不静默覆盖。
- `openPositions=[]`、physical ticket count、最大序号都不能单独证明 `pastedSlots=totalSlots`。
- 只有完整票区逐排证据明确所有位置均已贴且无 unknown，才允许全贴满。
- `totalSlots` 已知而 `pastedSlots` 未知时，保持 `totalTickets=数值、pastedTickets=null`，交给用户核对。
- 局部遮挡仍保留可确定字段，进入 `needs_user_input`；不因单个字段为空丢弃整张版面。

## 5. 服务端 Normalize 与客户端映射

```text
JSON.parse → AJV（拒绝额外字段/非法类型）
→ 旧 compact/verbose 仅作一次性历史迁移
→ A-Z/SP 标签归一
→ slotRows 汇总与冲突检测
→ 生成 draft.ipName/themeName/tiers[].totalTickets/pastedTickets/remainingTickets
→ RecognitionContract 1.0.0
→ 客户端严格解析 null/整数
```

小程序识别页的“总票数”只读 `totalTickets`；“已贴票数”只读 `pastedTickets`；`remainingTickets` 仅在 total、pasted、unknown 均可靠且守恒时计算。客户端不把 `null` 转成 0，不从 remaining 反推并覆盖已贴数，不使用 total fallback。

## 6. 赏票核对

赏票提交使用独立 `ichi-draw-ticket-vlm-1.0.0-rc1` Prompt/Schema，只统计照片中实体票，并由 CloudBase 按 `recordId + boardId + submissionVersion` 做幂等、递增、乱序保护和历史累计。版面照片与赏票照片均为临时对象，完成或失败后双端删除。

## 7. 验收边界

自动回归覆盖 10/3、total 已知而 pasted=null、空 open 列表、冲突、Persona/Arknights 中文 IP、A1/A2、SP1—SP4、局部遮挡和旧数据迁移。真实照片准确率、真实 P50/P90/P95 与百炼成本仍需授权真机黄金样本验证；没有真实数据时不得声称已完成这些指标。
