# V1-F 自动化证据

> 2026-08-21 重跑。以下证据覆盖当前仓库内已完成范围，但不替代真实模型黄金样本、真机、跨账号隔离、视觉判断或发布授权。当前人工门见 `v1-f-human-gates.md`。

| 范围 | 命令／证据 | 状态 |
| --- | --- | --- |
| 领域、页面、账号、配额、云端记录、识别边界、Storage、性能与隐私 | `CI=1 corepack pnpm test` | 38 个文件／231 项通过；含语义版面 Provider 3.0、独立总数／已贴数、null 保留、端到端客户端映射、账号／位置门禁、权威配额、一次性识别任务令牌、成功原子扣次／失败即时释放、任务绑定临时 `fileID`、客户端／云函数双删、本人云端记录、严格确认快照、500 条记录、50 抽／50 撤销与离线不污染 |
| 网页批准基线 | `corepack pnpm test:web` | 26 项连续通过；滚动恢复断言改为等待产品既有的下一帧恢复，不再把请求动画帧前的瞬时 `0` 误判为回归 |
| TypeScript／ESLint／格式与故障注入 | `corepack pnpm quality:prove` | 前后两轮完整质量门通过；故意 TypeScript 错误被拒绝 |
| 契约与工作流 | `corepack pnpm cloudbase:validate`、`node scripts/validate-recognition-contract.mjs`、`node scripts/validate-v1f-release.mjs`、`node scripts/validate-workflow.mjs` | 版面、识别、渲染、V1-A／C、CloudBase 13 集合／18 函数部署产物、依赖层元数据、Provider 3.0 端到端夹具与工作流预检通过；不表示授权黄金样本准确率已接通 |
| Next.js 生产构建 | `corepack pnpm --filter @ichi/web build` | 通过，4 个页面生成完成 |
| CloudBase 开发环境 | CLI 代码更新、18 个线上版本状态复核、反向下载关键函数、无身份烟测 | 13 个 ADMINONLY 集合、18 个 Nodejs20.19 私有事件函数均为 `Deployment completed`；反向下载确认 `recognize-board` 使用 3.0 Prompt／Schema、Qwen3.7 Flash 非思考 JSON Object，`recognize-draw-tickets` 使用独立赏票协议，共享运行时使用直接语义字段；无身份调用分别稳定返回 `IMAGE_INPUT_INVALID`、`TRUSTED_IDENTITY_UNAVAILABLE`，未触发模型。客户端存储安全规则、COS 过期删除和授权真实图片调用仍属人工门，未以仓库声明冒充已生效配置 |
| 微信账号／配额真实黑盒 | 正式微信上下文调用 `bootstrap-account`、`assign-special-ichi-id`、`get-my-profile`、`get-quota-status` | 同一内部账号稳定显示 `ICHI-001`；2026-08-19 权威配额为 `limit=5, remaining=5, used=0, reserved=0`；未向客户端返回 OPENID 或内部账号 ID |
| 源码包 | `node scripts/validate-v1f-release.mjs` | 686827 bytes，低于 2 MiB；sitemap 含非空 `rules` |

历史模拟器截图目录：`artifacts/v1-f-release-candidate/2026-08-13/simulator/`。账号、配额与位置新界面仍等待本轮真机视觉验收。

自动通过不替代真实密钥、真机、代表性用户、视觉判断或发布授权。
