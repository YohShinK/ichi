# TASK-V2-21 tcbContext 修复部署与真机复测收口报告

2026-10-01 最终结论：**修复、真机复测、Pre-Pilot 收口 PASS；Founder 人工验收通过，全部测试入口关闭。**

Founder 最后一次只读检查反馈“符合预期”，随后明确：“测试全部关闭，V2-21 全部结束人工验收通过”。本报告记录已授权工作集的实际完成结果。闭环结束后未开启 Pilot、未启动 TASK22，未提交或推送 Git。

## 根因、授权差异与部署一致性

真实微信请求在业务字段以外附带 `tcbContext`；前一次仅剥离 `userInfo` 的修复仍被严格字段校验拒绝，返回 `INVALID_REQUEST`。单次结构诊断只记录键名和校验布尔，确认额外键 `tcbContext`，未记录身份值或请求字段值，也未产生举报记录。

最终修复仅在业务字段校验前剥离 `userInfo` 与 `tcbContext`。身份继续仅取 `cloud.getWXContext()`，其它未知字段仍严格拒绝。资格、ledger、count、audit、actionId 幂等和 threshold=10 语义均未改变。

| 项目 | 最终结果 |
| --- | --- |
| 唯一更新函数 | `v2-shadow-report-public-map-lead` |
| 唯一批准输入 ZIP SHA-256 | `9a9a96a14e3ed314bae6147094fa26539f055239bf6c185039a79253c0c5c6cd` |
| 本地源 runtime SHA-256 | `3a1da88252b1d3f129861e9738f7b005ffb7d695b251d1ff9f3fed466566b39e` |
| 包内 runtime SHA-256 | `7e2e253bf390b628b6d73c8eef96cb1e5db2ba79b83b5e7d45ac21e8f686e2a1` |
| 云端含安装依赖归档 SHA-256 | `ea132abf4ac5e93e28b341a62fa3111b08a54b7f897a8b27d62a42b85a41de99` |
| 部署请求 | `33918ffa-a3c2-4c37-bac0-4b3ea8146d25` |
| 部署后 source/config read-back | 16/16 批准源码逐字节一致；Nodejs20.19/index.main/256MB/10s，配置未扩大 |
| 最终代码回读 | 本地 ZIP 与源 runtime 无漂移；云端 report 归档 SHA 相同；其它 8 函数代码 SHA 不变 |
| 资源与 V1 | 无新增 collection/index/function/secret/trigger/Storage，无 V1 变更 |

云端归档包含平台安装的依赖，不能与批准的输入 ZIP SHA 混为同一个校验值。部署前冻结校验、部署后源码回读及最终归档校验分别保留。

## 真实微信举报、取消与按钮验收

Founder A 真实微信执行举报→取消→再次举报→再次取消成功；D 云审计实际观测两组四命令，8 条 AUDIT，均匹配 trusted WXContext Founder A，最终 CANCELLED/active=false/distinct count=0。身份仅留匹配布尔，原始身份数据不落盘。

Founder 另行授权的按钮修订已完成：两处详情模板补传共享举报状态，按钮靠右、按图标和文字自适应宽度；举报后灰暗显示“已举报”，再次点击或状态条取消均恢复“举报”，请求在途禁用。Founder“OK 5 项测试通过”，E 对应10条交替审计及最终未举报状态通过。独立记录见 [按钮状态与宽度报告](v2-e-task-21-report-button-state-and-width.md)。

真实微信一次性幂等验证共 7 个请求：读取未举报→REPORT→同 actionId REPORT 重放→新 actionId 重复 REPORT→CANCEL→同 actionId CANCEL 重放→读取未举报。Founder 反馈“验证通过，已恢复未举报，我觉得可以收口了”。

| 核验 | 结果 |
| --- | --- |
| 7 次公开状态序列 | false、true、true、true、false、false、false |
| 新增 ledger/audit | 3 条 AUDIT：REPORT、重复 REPORT、CANCEL_REPORT |
| 新 actionId 重复举报 | duplicate=true 仅1条，不增加 distinct count |
| 相同 actionId 重放 | 无额外 AUDIT、无额外计数 |
| 身份与最终状态 | trusted Founder A 匹配；1条 REPORT_STATE，CANCELLED/active=false/count=0 |

## 修复后的 threshold、取消与 no-resurrection

复用了10个已有、受控且符合资格的合成主体；此部分为真实云端 synthetic rehearsal，未冒充10个真实微信用户。

| 阶段 | 云端事实 |
| --- | --- |
| 第1—9个 distinct eligible REPORT | count=9，PUBLIC/VISIBLE |
| 第10个 REPORT | count=10，HIDDEN/HIDDEN，AUTO_HIDE AUDIT仅1，read-epoch失效 |
| 第10个主体取消 | count=9、active=false，仍 HIDDEN，moderationThresholdHidden=true |
| 迟到 outbox event sequence=2 | 最终 APPLIED/MODERATION_HIDDEN，lastAppliedEventSequence=2，PUBLIC=0 |
| 隐藏后真实微信 query/detail | query ok=true/items=[]；detail LEAD_UNAVAILABLE；Founder“符合预期” |

迟到投影首次在既有10秒平台限制下超时，outbox仍PENDING且PUBLIC=0；保持原代码和配置，重试一次成功。未调整 timeout、threshold 或隐藏锁。该超时记录保留，不能把第一次调用写成成功。

最后只读二维码过期后，先关闭旧窗口，再重新生成隔离验证页；只为 Founder A 开 query/detail 读取，report 始终关闭。成功请求为 query `b6fa648b-97d6-45ba-9a40-5ab4c3976795`、detail `e8c79de9-0cb3-44f5-802f-666740a412a3`。取得反馈后立即 read-stop=true 并关闭两读取入口，不产生举报写入。

既有仅上传 mandatory 筛选、普通项独立 toggle、完整有序玫红气泡、刷新文字及加载环、C隐藏消费的 Founder PASS 保留；本次未重复无影响的已验收项目。

## 最终 safe-stop、隐私与 V1

| 最终检查 | 结果 |
| --- | --- |
| 9个函数 | 全部 Active，全部临时 *_ENABLED=false，caller allowlist为空，完整关闭配置匹配 |
| 全局控制 | read-stop=true；HA pause=true；read-epoch=41 |
| 公开数据 | 按 lifecycleState=PUBLIC 正确查询，PUBLIC=0 |
| 举报资格 | 12条 authority 均 accountActive=false 且已过期 |
| 隐藏目标 | HIDDEN/HIDDEN；moderationThresholdHidden=true；event sequence=2，不复活 |
| 审计保留 | 总 ledger=71：22 REPORT_STATE、3 TARGET_POLICY_STATE、46 AUDIT；未删除历史审计 |
| 停机后入口拒绝 | REPORT_DISABLED、SHADOW_READ_DISABLED |
| V1 云端 | 49项只读核验：13集合、43索引、13ACL、19函数配置/代码元数据/环境/触发器、Storage根项和规则、函数权限均一致 |
| V1 本地 | 149个保护文件 SHA 无差异 |
| 公开响应隐私 | 本轮7真机幂等+11合成threshold+2真机隐藏读取，共20条响应递归检查，PRIVATE_LEAKAGE=0 |
| 缺陷门 | 已执行修复与复测范围 P0=0、P1=0，V1_DIFF=0 |

未保存原始CLS日志、身份值、secret或带签名下载链接；落盘仅公开业务响应和匹配布尔。历史按钮阶段18条公开响应隐私检查通过的证据仍保留。

## 完整自动回归

最终全仓单元测试1096 PASS、1既有SKIP（102文件PASS、1文件SKIP）；Lint、root/web类型检查、5项合同、Next构建、9包artifact validator均PASS。最终完整网页回归26/26 PASS。按钮阶段原25/26、既有V1左滑删除flake记录保留为当时结果；本轮完整26/26的结果单独记录，不覆盖历史。

实际冻结ZIP的34项举报回归、18个新增envelope/安全用例、定向50项及16文件校验已在独立构建报告通过，本轮ZIP未变。最终文档workflow检查结果写入 `final-regression-summary.json`。

## 人工决定、剩余边界与证据

`UPLOAD_ONLY_AND_REPORTING_PRE_PILOT_CLOSURE = PASS`

`TASK-V2-21 = COMPLETE / HUMAN_APPROVED / PRE_PILOT_CLOSURE_PASS / TESTS_CLOSED`

`COMPLETION_SCOPE = APPROVED_PRE_PILOT_AND_REPORTING_REPAIR_WORKSET`

`CLOSED_PILOT = NOT_RUN / PILOT_PROTOCOL_APPROVAL_REQUIRED`

`RELEASE_CANDIDATE = NOT_APPROVED`

`TASK-V2-22 = LOCKED / NOT_STARTED`

Founder 最新明确人工收口覆盖本轮已授权工作集；不把它扩写成未发生的真实供给 Pilot、NETWORK_SOURCE seeding、实际成本/规模/多设备证据或 RC/发布批准。Device B/低端及本轮未补齐的设备版本/网络元信息仍保留 EVIDENCE_GAP；此前 Founder 接受的覆盖缺口不改为 PASS。

证据根目录：`artifacts/task21/final-cloud-rehearsal-20260930/repair-apply-retest-20261001/tcb-context-repair-deploy-closure`。

- `deployed-source-config-sha-readback.json`：立即反向源码/配置校验。
- `true-wechat-idempotency/regenerated-20261001-094658/true-wechat-idempotency-pass.json`：可信身份布尔、审计与幂等。
- `fresh-threshold-and-no-resurrection.json`：9→10、取消后隐藏、迟到投影。
- `true-wechat-hidden-read/true-wechat-hidden-read-pass.json`：最后真实query/detail与Founder最终验收。
- `final-safe-stop-readback.json`、`final-public-response-privacy.json`：全部关闭、20条公开响应审查。
- `v1-cloud-final-readback.json`、`v1-local-final-hashes.json`：云端49项与本地149文件零差异。
- `final-regression-summary.json`、`final-web-regression.log`：最终全量回归。

[Pre-Pilot正式收口](v2-e-task-21-pre-pilot-final-closure.md)为整体门状态；本报告为独立修复/真机复测证据。所有测试窗口已关闭，等待后续独立指令。
