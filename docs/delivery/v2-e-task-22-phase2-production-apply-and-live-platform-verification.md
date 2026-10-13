# TASK22 Phase2 production 应用与暂停断点

> 当前分享流程受`UPLOAD_CONFIRMATION_MAP_SHARING_V2`约束（docs/decisions/map-upload-sharing-contract.md）。2026-10-03接点审计见v2-e-task-22-phase2-sharing-flow-connection-audit.md；旧独立按钮不能恢复，production暂停保持。

2026-10-03，Founder 要求在当前断点暂停。TASK22 为 IN_PROGRESS / PAUSED_BY_FOUNDER；已应用 production 资源和函数，平台及合成链路通过，但真实玩家历史链路与持续桥接尚未通过。不得把本报告解释为 Phase2 COMPLETE 或真实历史 LIVE BRIDGE VERIFIED。

## 已完成，恢复时不重复

- `PHASE2-A-RESOURCE-ONLY`：4个ADMINONLY集合、4个非TTL索引、1个初始关闭bridge control row，共13声明动作，apply/readback通过。
- 3个bridge函数创建：manage-map-player-source、process-map-source-bridge、drain-map-source-bridge。4个V1函数仅更新代码：finalize-board-observation、recognize-draw-tickets、delete-my-record、delete-my-account；分别从自己的真实远端ZIP最小补丁，保留历史差异与配置。7/7批准应用源码回读一致，原4个回滚ZIP保留。
- 正式地图条例 `map-contribution-20260930-v1`、scopeDigest `3831ff8e88228682262520b94ffc50ee4bafa6f9640e52d166bb94a3ce49a95a` 已绑定。Founder选择0.001°近似网格、原始定位误差≤100米；原始坐标保持私有。
- 真实CloudBase SDK原子回滚、8并发显式冲突/重试、合成来源上传→boardObservation→BoardInstance→contribution→PublicMapLead、重放幂等、向前更新、删除隐藏/防复活等10项通过，临时夹具24条已清理。Marker验证使用实际投影结果及受测读端口的安全DTO，不能等同真实微信用户地图展示PASS。真实用户历史迁移0。
- timer创建关闭；伪造事件冷/热拒绝、真实timer可信入口返回BRIDGE_PAUSED的3项通过，最终CLOSE。CLS时间按上海时区查询修正，未因第一次查询无日志而重复开启测试窗口。
- production client本地接正式查询、详情、举报、条例与逐记录分享函数。全量1184 PASS/1既有SKIP、Lint/TypeScript、Next构建、Playwright26/26、地图包审计、官方WXML编译通过。未发布微信版本，未代用户完成视觉验收。

独立证据均在 `artifacts/task22/phase2-live/`：resource-apply/resource-readback、deployment、formal-policy、policy-and-timer-apply、live-sdk-tests、timer-provenance、history-preview、consent-intake、final-audit。冻结的本地Phase2 ZIP、Phase1及四V1回滚包不覆盖。

## 云端当前入口

| 项目 | 状态 |
| --- | --- |
| manage-map-contribution-consent / manage-map-player-source | Active，enabled=true |
| 账号条例接受 / 本人首次逐记录分享选择 | 配置开放，真实微信调用未通过 |
| bridge producerEnabled / ownerEntryEnabled | true / true |
| bridge processorEnabled / worker / drain | false / disabled / disabled |
| timer | CLOSE |
| 四V1 producer flag | 未开启，默认false |
| query/detail函数 / readEnabled | disabled / false |
| resolver/projector/HA | 关闭 |
| global:read-stop.stopped | false，仅让条例入口具备控制读取条件；公共读取由上述独立门关闭 |
| 真实历史迁移 / continuous | 0 / 未启用 |
| 最近全量audit PUBLIC / shadow PUBLIC | 0 / 0 |

Founder反馈地图和条例均显示不可用。地图查询被关闭，符合当前部署状态；条例函数虽然已开启，真实微信请求失败原因尚未定位。此前只验证无微信主体的请求被拒绝，不能由此声称条例已可用。恢复时先解决这项，不再要求用户通过不可用入口来补授权。

## 历史23条的实际含义

只读preview为23条、可迁移0、skip23。首个失败原因20条EXACT_APPROVED_SUBMISSION_REQUIRED、3条SHARE_AUTHORIZATION_REQUIRED；重叠检查确认23条均缺适用正式条例接受、逐记录SHARE及rights。

暂停后的只读状态明细确认：

- 20条为assisted-draw/private_saved：只是个人版面保存；未有当前公开赏票版本指针、APPROVED标记及对应核验记录。全库drawSubmissions=0，所以不是“审核依据少几个字段”，而是没有赏票提交核验链可供桥接。
- 3条为direct-upload/clue_submitted：完成“仅上传版面”的最终提交。此路径不需要赏票审核，故通过来源完整性检查；它们仍缺地图授权，不能直接迁移。

没有替玩家生成同意、权利确认或分享选择。历史小批量必须先形成具体合格preview与批次，再取得Founder批准。

## 分享交互已完成本地修订（2026-10-03）

Founder后续明确授权合并既有上传确认与地图分享授权。现已保留辅助抽赏分享弹窗并补充核验后自动上图说明；直接上传由原确认上传表达分享，成功弹窗只留“退出回首页”、间距居中；移除本人记录列表和独立modal的地图分享选择。当前条例与任务路径已同步，旧独立按钮流程不再适用。

两条正常上传路径会持久记录实际本条上传意图，在服务端来源核验及当前正式consent通过后自动写SHARE/rights。继续抽赏、私人退出和既有历史没有本条新上传意图时不自动分享。成功弹窗仅在服务端接收回执后显示“已提交地图”，待同步时据实说明，不把待核验/processor关闭当已公开。

本次LOCAL_IMPLEMENTED / LOCAL_GATES_PASS / AWAITING_REVIEW。新版terms/scope是独立v2候选，尚未应用production；真实微信服务可用性及公开链路仍未验收。详见v2-e-task-22-phase2-sharing-upload-flow-simplification.md及artifacts/task22/phase2-sharing-flow；整体production暂停保持。

## 恢复位置

1. 同步v2正式条例/scope、解决真实微信调用，补服务端上传时意图落库、GET当前授权证明及旧scope续认接点；必须不依赖额外分享按钮，不能把设备待处理队列等同纯后台完成。
2. 补实际有队列的drain→worker云函数互调测试；现有直接signed Invoke和暂停态timer不覆盖这条RPC运输链。安全恢复所有临时测试门并清理仅测试夹具。
3. 收到真实合格玩家记录后，重新只读preview并提交具体历史小批量批准。
4. 经批准验证真实记录→观察→实例→贡献→公开线索→Marker，最后才启用continuous。

Phase3/NETWORK/上海50/全国300/正式微信发布仍锁定。没有Git提交/推送。

## 密钥事件

一次不当触发器查询返回了原始配置，造成新bridge key出现在工具响应。已立即替换这把key并确认worker/drain两处绑定一致；后续仅用筛选输出。原IDENTITY key保留Founder既有风险接受/不轮换决定。最近全量audit对实际当前secret及编码变体扫描项目601文件/110 ZIP entries匹配0、1199冻结输入未经授权drift0；这项结果不抹去工具响应暴露事实。

本报告是暂停记录，后续应用、测试及授权状态必须从此断点续写，不重复已通过部署或把未测项补写为PASS。
