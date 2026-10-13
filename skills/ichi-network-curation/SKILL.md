---
name: ichi-network-curation
description: 持续采集和自动录入 ICHI 官方网络版面；完整可识别证据自动核验并入图，遮挡、未知余量、地点冲突等疑点集中交给 Founder。用于 ICHI 的采集、版面识别、待确认处理、发布恢复和纠错撤回，不用于其他项目。
---

# ICHI 官方网络版面

在 ICHI 项目根目录工作。先读 `memory-bank/progress.md`，只执行当前已授权范围；用户新指令优先。当前方向为 **AUTO_CLEAR_ESCALATE_UNCERTAIN**：完整证据自动处理，不要求每张再点击批准；有疑点才提交 Founder。自动执行者记为 `AGENT_USER_DELEGATION`，不得冒充 Founder。

## 工作流

1. 按 [采集与证据](references/collection.md) 保存公开原帖、全部图片、真实源发布时间、地点依据及实际搜索覆盖。原有搜索/图片/准入证据不覆盖。浏览器任务使用已授权的 Ego 和同一个 TaskSpace；读其 skill 后操作。
2. 使用 [命令与合同](references/workflow.md) 创建独立批次，逐赏检查票沿和未抽票；同帖多板用独立 `boardEvidenceKey`。先 `collect`，再 `auto-review`。已见 URL 是提示，不代替同板判断；不主动合并实例。
3. 能完整确认的候选自动形成 exact 委托决定。无法识别、剩余数未知、遮挡、时间/地点冲突者留 `NEEDS_FOUNDER`，生成 `founder-pending.html`，一次展示原图、问题和待填字段。null 保持 null，不能填零通过门。
4. Founder 回复绑定原图 SHA、版面键和 exact 版本。修正先 `edit` 生成新版本，旧批准失效，再 `review` 或携带真实人工确认图证据 `auto-review`。没有新疑点时不重复询问。
5. `publish` 默认仅计划；已获用户自动录入授权并绑定独立工作流委托时，可 `--execute --grant` 或 `run`。仍经过当前官方 Source → Verification → Resolution → Projection，并真实公开回读。部署须使用新鲜实际基线、独立具体授权；旧50条授权和部署不重放。
6. 中断先 `resume` 只读回查，不盲目再提交。已入图修正走 `correct` 的独立 exact 计划；撤回走 `withdraw`，保持历史和不复活。每批结束核对双门关闭、维护 timer=0、PLAYER及其他配置保持。

## 决定边界

- 原帖上传时间是缺乏更早可信实拍依据时的观察时间。抓取、审核、修正均不刷新观察时钟或30天期限；7天窗口绑定原首次发现。
- 公开备注来自原图/正文已安全核验的内容；地点单独展示。不把店铺地址冒充备注，不猜价格、赏级或数量。
- 原图、文章URL、账号、rights和私有定位依据仅保留在内部证据。公开投影按现有 allowlist；允许的结构化事实使用依据与许可类别照实记录，不伪造作者许可。
- 准入不把相似提示当作 merge。证据不足只留本地；不绕过共享验证、位置绑定、大赏/备注安全、隐藏/撤回/到期等门。
- 不新增数量目标、全国300、持续维护timer、正式微信发布或Git提交。当前Phase6并行验收与本工作流协调，以最终实际版本集成结果为准。

先运行 `node scripts/ichi-network.mjs help` 查看当前命令。合同和机器 schema 在 `scripts/network-workflow/schemas.json`；技能通过项目源码路径调用这些工具，避免复制第二份后端规则。
