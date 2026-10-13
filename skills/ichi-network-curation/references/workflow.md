# 命令和 exact 合同

Node 24.11+；从项目根目录运行，`--batch` 是独立本地目录。

```sh
node scripts/ichi-network.mjs collect --batch BATCH --manifest MANIFEST.json
node scripts/ichi-network.mjs auto-review --batch BATCH --recognition RECOGNITION.json --grant GRANT.json
node scripts/ichi-network.mjs review --batch BATCH
node scripts/ichi-network.mjs review --batch BATCH --pending
node scripts/ichi-network.mjs fix --batch BATCH --fixes FOUNDER_NUMBER_FIXES.json
node scripts/ichi-network.mjs edit --batch BATCH --id SOURCE_ID --replacement REPLACEMENT.json
node scripts/ichi-network.mjs review --batch BATCH --decisions FOUNDER_DECISIONS.json
node scripts/ichi-network.mjs publish --batch BATCH --config CONFIG.json
node scripts/ichi-network.mjs publish --batch BATCH --config CONFIG.json --execute --grant GRANT.json
node scripts/ichi-network.mjs resume --batch BATCH --config CONFIG.json
node scripts/ichi-network.mjs correct --batch BATCH --config CONFIG.json --ids SOURCE_ID
node scripts/ichi-network.mjs withdraw --batch BATCH --config CONFIG.json --ids SOURCE_ID
```

`run` 串行 collect → auto-review → 本地疑点页 → 发布已批准候选，仅用于已授权自动录入范围。`correct/withdraw` 默认计划；执行额外传 `--execute --authorization FILE`。授权文件包含 USER、实际用户指令引用、环境、操作、planDigest和期限；修改计划必须重新绑定。不要由Agent自称USER给外部动作新增授权。

机器 schema：`scripts/network-workflow/schemas.json`。批次目录保存HEAD/immutable snapshots/内容寻址evidence；`.lock` 防并发，`recover-lock` 仅能确认原进程已退出时使用。审计hash链及所有图SHA每次操作复验。

候选输入 `ichi-network-collect-v1` 每项含 record、evidence、firstDiscoveredAt，可含similarityHints；搜索记录query/coverage/coverageStatus。每批最多50。record仍受官方 NETWORK_SOURCE schema校验。缺字段可以保留疑点；非canonicalURL或证据漂移停止导入。

识别包 `ichi-network-recognition-v1` 的每项绑定候选 `binding`（record/evidence/revision/firstDiscoveredAt摘要），包括：complete、boardImageSha256、各赏tiers、locationEvidenceSha256/locationDigest/locationConfirmed、大赏确认、备注安全和独立rights。各赏必须有相同图片SHA、明确票区region和剩余数字；method取VISIBLE_UNDRAWN_TICKETS（唯一ticketIds）、PRINTED_REMAINING（明确余量labelConfirmed）、FULL_UNDRAWN（印刷初始数、全部票在场），或HUMAN_CONFIRMATION（本地原始回复SHA、同图/版面键/赏级数字）。置信度数字不替代证据。

自动授权 `ichi-network-auto-delegation-v1` 必须是实际用户方向的记录：scope=ICHI_NETWORK_PHASE5、mode=AUTO_CLEAR_ESCALATE_UNCERTAIN、environment、authorizationRef、authorizedAt、userInstructionRef、curatorAuthorityId、maxBatchSize≤50、operations=[PUBLISH]。不是原50委托续用。后台独立workflow登记上限1000是容量护栏，不是采集目标；满了交维护，不截断或删旧历史。

Founder决定 `ichi-network-review-v1` 绑定batchRevision、userInstructionRef、每项id/revision/binding。批准需真实reviewedBy/reviewedAt/reviewVersion、准确性/地点/大赏、curatorAuthorityId、独立rights及安全备注证明。仅疑点需人工；原图变更或字段变更令旧决定失效。

生产配置保存环境/region、managerModule/sdkRoot/publicReaderModule的绝对路径、wsEndpoint及已部署network模块SHA。不得保存凭据、token、HMAC或完整Environment。真实微信SDK回读来自当前本机开发工具；连接失败不得以DB读取冒充公开回读。

近似地点的LOCATION证明保存location、sourceUrl、boardEvidenceKey、venueBindingText、postOrProfileSha256及poiEvidenceSha256；对应CAPTURE/PROFILE和POI证据必须在本候选SHA集合。POI文件包含实际providerUrl和GCJ02 latitude/longitude，与record一致。不能只给任意一张地点截图然后勾locationConfirmed。

Founder疑点页可直接补剩余数字并导出 `ichi-network-founder-fixes-v1`，或在聊天回复数字由Agent照原话绑定。`fix` 校验原批次版本、图SHA和binding后生成新sourceVersion，保留原观察时间并使旧批准失效；真实回复作为HUMAN_RECOGNITION证据供后续auto-review使用。只改数字不能自动补出缺失地点、大赏、价格或原时间。

大赏集合须由grandPrizeEvidence绑定原图SHA和奖品区域region，tierCodes与record大赏集合完全一致，method为VISIBLE_PRIZE_CLASSIFICATION或绑定实际人工确认的HUMAN_CONFIRMATION。只给highPrizeTiersConfirmed=true或整体置信度不能通过；无法确认奖品分类交Founder。
