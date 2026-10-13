# TASK-V2-19｜Phase B2-R3 Synthetic Rehearsal

执行日期：2026-09-27。唯一环境：`cloud1-d7gxqfwv783a1f131 / ap-shanghai`。本报告只记录已在现有 `v2Shadow*` 资源上执行的 synthetic/rehearsal 演练及其证据边界。**总体状态：PARTIAL / TRUSTED_CALLER_REQUIRED**，不能据此验收 TASK-V2-19。

## 1. 范围与阶段顺序

执行前回读 9 个 shadow collection 为空、六个 B2-R2 函数代码 hash 未变化、四个 feature flag 为 false、测试 caller allowlist 为空。仅向 `v2Shadow*` 写入合成 fixture、resolver 决策、HA request、outbox、公开投影与控制状态；没有读取或复制 V1 private record。依次开启 resolver → HA → projector → read；最后又以单独合成 fixture 补测 HA 限制与 deleted 退役，并再次关闭测试入口。每一步只修改对应现有 shadow 函数的配置，未创建资源或部署代码。结束时六个函数的四个 flag 全部回读 `false`，caller allowlist 仍为空，测试超时恢复为 3 秒；`global:read-stop.stopped=true`，读取 epoch 为 3。

本轮留下合成演练数据作为审计证据，**未 cleanup**：`v2ShadowSourceFixtures` 28、`v2ShadowBoardInstances` 17、`v2ShadowAssociationDecisions` 21、`v2ShadowHumanAssistanceRequests` 5、`v2ShadowProjectionOutbox` 24、`v2ShadowPublicMapLeads` 22、`v2ShadowControlState` 91。以上七表回读记录均为 `SYNTHETIC_REHEARSAL`；公开行中 `PUBLIC` 为 0，退休 tombstone 为 2。HA 五条 request 均为 PENDING，不能把它们视为已获真实用户回答。其余两张 shadow 表未用于证明这些计数。

## 2. Canonical 12 冻结场景逐项结果

名称逐字沿用 B2-R2 pre-deploy gate。`云端 PASS` 表示本轮真实 CloudBase shadow 路径验证；`本地 PASS` 只表示 B2-R2 的本地 6 文件／50 测试覆盖，不能替代远端。

| # | Canonical 冻结场景 | B2-R3 CloudBase 证据 | 远端状态 |
| --- | --- | --- | --- |
| 1 | 同板连续 Observation 唯一安全延续 | s1a `NO_MATCH`，s1b `UNIQUE_MATCH`；instance、association、outbox 持久化；首次 s1b 受 3 秒冷启动超时影响，调至测试 30 秒后同一 token 成功。 | PASS |
| 2 | 换箱/换套不错误延续 | s2a 箱 0、s2b 箱 2，均 `NO_MATCH`。 | PASS |
| 3 | 同店不同版面不 merge | s3a/s3b 同坐标但 IP 不同，均 `NO_MATCH`。 | PASS |
| 4 | 同店两张同款版面不按位置 merge | s4a/s4b 各建 instance；s4c 为 `AMBIGUOUS`。 | PASS |
| 5 | 长期 AMBIGUOUS 保持不确定 | s5c 连续三次 `AMBIGUOUS`；首次产生一条 HA request，再次请求为 false。 | PASS |
| 6 | 后续证据自动消歧 | s6c `AMBIGUOUS`，s6d 增加区分证据后 `UNIQUE_MATCH`。 | PASS |
| 7 | SAME_BOARD / DIFFERENT_BOARD / CANNOT_TELL / SKIP | 本地四答案、幂等及冲突负测 PASS。远端管理员调用没有可信 WeChat `APPID/OPENID`，伪造请求体身份被 `UNAUTHORIZED` 拒绝；四类正向回答均未执行。 | BLOCKED：可信测试账号/调用路径缺失 |
| 8 | HA budget / cooldown / once-per-upload | s5c、s4c 重复请求均无第二条 HA request。补测四条新合成 fixture：同 owner、候选测试 cooldown=60 秒时，首条 `assistanceRequested=true`、紧随第二条为 false；另一个合成 owner、同一 3600 秒窗口、budget max=1 且 cooldown=1 秒时，首条 true，等待超过 1 秒后第二条 false。均由真实 shadow resolver 持久化执行。参数仅为候选测试值，结束清空。 | PASS |
| 9 | late/stale 不覆盖新状态 | event sequence 4 在已应用 sequence 2 后返回 `EVENT_GAP`；退休后重投 sequence 2 返回 `LATE_EVENT_DISCARDED`，tombstone 不变。 | PASS |
| 10 | retired/deleted/withdrawn 不 resurrection | s1b 合成 fixture 置 `WITHDRAWN`，sequence 3 投影返回 `RETIRED`；旧版本隐藏、退休版本保留、epoch 0→1；迟到旧事件不能复活。另将 s2a 合成 fixture 的 public gate `deleted=true`，下一序列投影也返回 `RETIRED`，epoch 2→3，`PUBLIC` 仍为 0。 | PASS |
| 11 | `null != 0` | s11a 的 null 与 s11b 的 0 唯一延续；s11c 的 1 不延续。 | PASS |
| 12 | Location 仅生成 candidate，不作为 identity truth | s12a/s12b 同坐标不同 IP，仍为不同 instance；GEO 查询候选成功。 | PASS |

## 3. 其他安全与持久化验证

- **GEO / unique**：对已建立的 shadow instance 执行实际 `geoNear` 查询成功。尝试向 `v2ShadowAssociationDecisions` 写入重复 `(observationVersionId, decisionVersion)` 的新 `_id`，实际 unique index 返回 `E11000`，探针记录未落库；没有降级或替换索引。
- **Outbox / retry / failure injection**：19 条正常 outbox 按 instance 和 sequence 投影，全部 `APPLIED`。合成 s8a outbox 设为 `RETRY` 且未到时返回 `OUTBOX_NOT_DUE`，到时后 `APPLIED / CREATED`。额外 sequence gap 返回 `EVENT_GAP`，无公开行变化；该 gap outbox 留为 PENDING，projector flag 已关闭。未把这项测试说成 catch-path 自动 `scheduleRetry` 全覆盖。
- **Public projection**：s1a/s1b 分别 `CREATED / ADVANCED`，前一版隐藏，新版 `PUBLIC / VISIBLE`；回读公开行只有白名单字段，未含 owner、fixture 私有内容或精确识别事实。公开 query/detail 管理员请求在空 allowlist 下返回 `UNAUTHORIZED`；**真实可信 caller 的正向 query/detail、分页/cursor 与跨账号 A/B 仍未验证**。
- **身份伪造**：向 get-my、answer、query、detail 传入伪造 `callerDigest/accountId` 均未越过服务端身份门。管理员调用不能提供可信 `getWXContext()` 的小程序主体，因此不能把这一负测冒充跨账号 A/B 正测。
- **Migration rehearsal / 幂等**：同一合成 fixture 再次 resolver 得到 duplicate，同一已应用 outbox 再次 projector 得到 `APPLIED / duplicate=true`；这是 synthetic 数据的最小迁移重放，不是 V1 production migration。未读取或改写 V1 数据。
- **Rollback / no-resurrection**：把 shadow `read-stop` 置 true、epoch 1→2，并将 15 条仍为 `PUBLIC` 的 synthetic 公开行逐条置 `HIDDEN`；补测 deleted 退役使 epoch 再增至 3。最终回读 `PUBLIC=0`、两条退休 tombstone 仍在、迟到旧事件已 `DISCARDED`。没有删除 shadow 数据、资源或 V1 数据。

## 4. 结束配置与已知限制

六函数逐项回读：`BOUNDARY=synthetic_only`；`READ/RESOLVE/HUMAN_ASSISTANCE/PROJECTOR_ENABLED=false`；caller allowlist 为空；timeout 为原 3 秒；三类 shadow-only HMAC secret 仅检查存在，**未记录或回显值/摘要**；六个远端 `codeSha256` 与 B2-R2 执行前基线一致。resolver 的四个 HA 候选测试参数经配置 API 清空为**空字符串**，有效 policy 不成立，入口因 flag=false 关闭；CloudBase MCP 的 `updateFunctionConfig` 对省略 key 采用合并语义，不能声称这些 key 已从远端物理删除。候选值仍仅属 `CANDIDATE_TEST_ONLY / PILOT_CALIBRATION_REQUIRED`，未冻结为产品参数。

3 秒冷启动造成若干调用超时；测试期间 resolver/projector/query 临时调至 30 秒，结束已恢复 3 秒。关闭态六函数探针中三次立即返回 disabled，三次先遇冷启动超时；其中 answer/query 重试后返回 disabled，resolver 重试仍超时。配置 read-back 证明 resolver flag=false，但其运行时关闭响应在最终 3 秒限额内未取得，需单列性能/冷启动问题。

## 5. V1 frozen production boundary

演练结束后的最终只读对照：13 个 V1 collection 的 43 个索引结构和 ACL 一致；19 个 V1 function 的 runtime、代码信息、配置、trigger、修改时间等稳定字段一致；V1 function 名单与 collection 名单不变；环境函数安全规则的实际权限文本一致；Storage 根目录 2 项的 key/size/ETag 一致。`V1_DIFF=0`。六个 shadow 代码 hash 亦与执行前一致。未创建 collection/index/function/trigger/layer，未部署代码，未改 V1 collection/function/index/config/Storage/trigger/ACL，未调用真实 V1 private record。无 cleanup、commit、push。

本地复跑：BoardInstance、resolver/HA persistence、projector persistence、public read 和 Task-V2-10/11 的 6 个测试文件／46 测试 PASS；该结果不填补可信小程序主体的远端正测。报告及同步的事实源文档通过 Prettier；`node scripts/validate-workflow.mjs`（8 required files）PASS；`git diff --check` PASS。

## 6. 停止状态与剩余门

由于缺少可验证的真实小程序测试 caller A/B，远端四种 HA 正向回答、跨账号 A/B、public query/detail 正向路径均未完成。故 **Phase B2-R3 未达到全量验收**，不能写为 12/12 云端 PASS；canonical #7 仅有本地与云端负测，其余 11 项的对应远端路径已覆盖。下一轮如有可信测试 caller，应重新做目标明确的受控演练，并再次保证 flags 结束全 false、V1_DIFF=0；不得把请求体身份或管理员调用当作可信主体。

当前：`TASK-V2-19 = IN_PROGRESS / PHASE_B2_R3_PARTIAL_TRUSTED_CALLER_REQUIRED`；未 `COMPLETE / HUMAN_APPROVED / FROZEN`；TASK-V2-20 未开始。
