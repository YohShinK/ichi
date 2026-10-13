# TASK21 Pre-Pilot candidate exact diff（本地，未应用）

日期：2026-09-30。阶段：Pre-Pilot implementation。状态：LOCAL_ARTIFACTS_READY / CLOUD_NOT_APPLIED。任务总命令第15节要求既有 candidate config/flag/data/allowlist 实际写入等 Founder 批准的有界协议；本报告准备可审阅变更，不申请或执行 Closed Pilot。

只需替换下列三个既有 Nodejs20.19 / index.main 函数代码：projector 从 exact current VerifiedBoard 计算 Opportunity；query/detail 升级 public-map-v3 并拒绝旧结果；detail 的独立 stop/epoch 读取并行、前后校验不删除。其余五包因共享 reference 编译生成，保留为匹配本地源码的完整回归包，不需要为该差量部署。runtime/dependency 保持 wx-server-sdk 4.0.2。完整8包及逐包 allowlist、SHA 见 packages/v2-map/resources/cloudbase-task21-prepilot-artifacts.json；旧 v3 zip/manifest 原样保留，不能覆盖历史部署证据。

| 既有函数 | 候选 ZIP SHA256 |
| --- | --- |
| v2-shadow-reconcile-projection | `67ecbbd79305eaccacf01ea0e677c44ff2dcfb84e1b4b5db36a55ebb85860dd6` |
| v2-shadow-get-public-map-lead-detail | `23debd42b08297a17b453c8c9226e809558f1fb0d80104846c5a60157cd422b8` |
| v2-shadow-query-public-map-leads | `177da3f03ecfd74d8a0dcca265067e72f04945983cebaabe77edeca6e6e14708` |

资源新增=0：无 collection/index/function/secret/trigger/Storage/ACL/production bridge。当前实际 config/data/flag/allowlist/deploy 写入=0，V1 资源和私有数据无管理访问或修改。新增可选配置项 ICHI_V2_SHADOW_OPPORTUNITY_POLICY 由 projector 与 query/detail 共用 shared/opportunity-policy.mjs 读取：缺省使用已批准 opportunity-20260930-v1；若后续设置，必须提交完整 versioned JSON，必须在三个函数保持完全相同的新版本 JSON，经 policy validation，错误时 fail closed。首版 version 参数不可静默修改；reader 拒绝 superseded policy row，参数调整必须提高版本并正常重投影。此次没有写这个环境字段，也没有打开任何 flag。

配套 public-map-v3 客户端必须与三个函数协调更新。旧 serving row 缺 primaryStatus 或仍含 level 时拒绝；禁止简单改 schema 字符串或 fixture 评价字段。后续重投影须从当时 current verified source 经正常 contribution/consent/rights/moderation/location pipeline；不直接 admin 写 PUBLIC，不复活退休实例。停止态维护 read-stop=true、caller 空、flags=false、PUBLIC=0，本轮只读回读已确认 epoch25、8 flags=false、caller空、read-stop/HA pause=true、PUBLIC0；部署前仍须重新回读。完整V1云资源diff本轮未重跑。

Rollback：在批准窗口前先下载当前三个远端包并核验逐文件/包 SHA 与环境配置备份，冻结 rollback manifest；尚未获取当前远端包，故回滚准备不是已验证。先停 endpoint/projector、设置 read-stop 并增加 epoch，再隐藏本批数据、保留 tombstone/audit；旧 serving 行不提供给v3客户端。恢复须成组恢复代码/客户端/配置，不将旧缓存伪装新合同。无 rollback drill 执行。

成本：此次本地编译/验证无云调用费或真实账单证据；无新增常驻资源。部署和实际函数/DB调用成本需在有界窗口计量，不填虚假 ¥ 数值或 latency 阈值。≤¥20/月仍是既有目标，Pilot 警戒线由 Founder 确认。

验证：8包解包import/hash/allowlist/default-closed验证结果见最终门禁记录；代码变更已验证于本地，不等于云端可消费或真实用户验收。Founder设备证据=NOT_RUN。T20-P2-01 仍需端上 cold/warm 测量，RC 风险尚未批准。Git未commit/push/merge/tag/upload/review/publish；TASK22锁定。
