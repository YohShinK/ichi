# V1 版面识别数据契约

本目录定义识别服务与微信小程序之间的数据边界。识别服务只返回数据、置信度、问题原因和建议人工动作；所有组件、样式和交互仍由小程序包内代码提供。

## 文件

- `schema/recognition-contract.schema.json`：一次识别请求与响应的 JSON Schema；
- `registry/issue-actions.json`：稳定问题原因码及允许的人工动作；
- `fixtures/complete-board.json`：完整图，抽数与余票可自动推导；
- `fixtures/partial-board.json`：缺边图，保留草稿但要求重拍；
- `fixtures/handwritten-price.json`：价格疑似手写，只补价格；
- `fixtures/inconsistent-slots.json`：券位不守恒，定位到具体奖级修正；
- `scripts/validate-recognition-contract.mjs`：验证路由、守恒、推导门禁、坐标、原因码和图片边界。

## 响应状态

| 状态 | 含义 | 是否可进入用户确认 |
| --- | --- | --- |
| `ready_for_confirmation` | 结构完整，自动推导通过 | 可以，但仍需用户确认 |
| `needs_user_input` | 草稿可用，但至少一个必填字段需要填写或修正 | 修正后可以 |
| `retake_required` | 图片缺边、模糊或无法证明结构完整 | 不可以，必须重拍或重新选图 |
| `service_error` | 超时或服务错误 | 不可以，可重试 |

## 推导与人工动作

1. `totalTickets = sum(tiers[*].slotObservation.totalSlots)`，仅在完整版面、所有普通奖级已检出、一券位一抽已确认、每级券位守恒时自动确认。
2. `remainingTickets = sum(tiers[*].slotObservation.openSlots)`，还要求没有未知券位状态。
3. Last、Double Chance 和所有辅助区块只保留位置与内容，不参与两项求和。
4. 手写、缺失或低置信价格只产生价格问题，不使已经可靠的奖级和抽数失效。
5. 原始图片不进入会话历史、不公开；具体临时保留时长在 V1-04 选择识别服务时锁定。

## 验证

```bash
node scripts/validate-recognition-contract.mjs
```
