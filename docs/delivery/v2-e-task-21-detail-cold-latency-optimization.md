# TASK-V2-21｜T20-P2-01 首次详情延迟：基线与测量准备

## 2026-09-30 本地优化实施（最新；真实 cold/warm 仍待测）

状态：LOCAL_OPTIMIZATION_IMPLEMENTED / END_TO_END_MEASUREMENT_REQUIRED。Client同ID且LOADING中的重复点击复用同一Promise/请求；dismiss或A→B→A重新核验，selection generation、suppression、LEAD_UNAVAILABLE永不被迟到响应覆盖。未用detail cache冒充current，也未扩大缓存。添加可选request→receive/receive→state诊断回调，仅测客户端状态提交，不冒充native render。Shadow preparePublicRead与detail最终复查中的独立read-stop/epoch读取并行；仍有前置关闭态、可信caller/rate、current serving read、serialize和后置stop/epoch复查，不能为速度删安全门。

代码：platform/public-map-client.ts、shared/public-read.mjs、get-public-map-lead-detail/runtime.mjs。两项客户端合并/删除竞态新增测试，既有durable read/current/cursor/epoch/no-resurrection安全回归与全套自动门通过；三个候选函数包本地已备，无部署/config/data/flag写入。只读preflight确认epoch25安全关闭、PUBLIC0。为保持总命令第15节配置写入门，未主动开窗或制造请求量。

历史服务端首次2972ms、随后289/346/361ms仍只是TASK20函数时长；不证明cold start主因，不是tap→render。此次未运行新的远端cold/warm、CloudBase读/serialize分段或端上render采样。不得写实测提速百分比、硬threshold或RESOLVED。T20-P2-01保持OPEN / OPTIMIZATION_IMPLEMENTED_PENDING_MEASUREMENT；如果无法消除，则在RC前由Founder明确接受known risk，现尚未接受。Pre-Pilot整体尚未PASS。

下方基线/NOT_IMPLEMENTED内容是本地优化前记录，已由本节覆盖；保留原始时长和证据限制。

日期：2026-09-30（Asia/Shanghai）。阶段：Pre-Pilot Closure C。状态：`BASELINE_AUDIT_COMPLETE / OPTIMIZATION_NOT_IMPLEMENTED / END_TO_END_MEASUREMENT_REQUIRED`。**T20-P2-01 = OPEN**，尚未 RESOLVED，也未取得 RC known-risk 接受。

## Pre-state 与已证实范围

TASK20 Founder 报告首次详情明显慢、后续快；三次都出现 loading 并最终成功，无白屏。本次命令仅接受转入 TASK21 优化，不等于接受为 RC risk。

历史 2026-09-29 CLS 样本：首次函数 2,972 ms；后三次 289 / 346 / 361 ms。历史样本的冷／暖归类是“首次／后续”的现象代理，**没有平台 cold-start 标志或 tap-to-render 测量**；不能据此产 cold/warm P95、完整端上时长或确定根因。没有原始足量分布，不设置虚构硬阈值。

## 延迟分段与缺证据

| 分段 | 当前证据 | 后续测量方式 |
| --- | --- | --- |
| tap → client request | 无单调钟原始时间 | 同一端上 performance clock 记录 tap 与 request dispatch；保存随机 requestId，不记录身份／私有位置 |
| wx.cloud.callFunction 请求往返 | 当前 adapter 仅 await，没有 duration | 端上记录调用开始／收到；包含网络与平台边界，不能直接减不同机器 wall clock |
| function cold/warm | 历史函数总耗时，cold 指示未收集 | 按平台日志能证明的标志分别统计；无法证明就写首次／后续代理 |
| read-stop／epoch／rate transaction | shared/preparePublicRead 顺序读控制文档和限流 transaction；无每段耗时 | 服务端同钟分段，保留限流／read-stop 安全门 |
| CloudBase read | currentPublicRow 查询当前 serving 版本；成功后再次读取 stop/epoch | 分段记录 DB 耗时／读次数；绝不联查 private V1／profile |
| serializer / payload | PublicMapService.detail 同步 allowlist serialize；未量实际 bytes／耗时 | 量 serializer 时长和响应 bytes，保留 null/0、version 与披露 |
| receive → render | subscription/setData→单卡显示，没有端上完成测量 | adapter 收到、state accepted、setData callback／设备可观察渲染分层记录；setData 也不能冒充 GPU 可见时间 |

## 源码发现与有界优化候选

`PublicMapClient.selectLead` 每次新 selection 增加 generation、设置 LOADING/item=null，再 await service.detail；成功写 public-only memory detail cache。`PublicMapMemoryCache` 有 readDetail，但 selectLead 未用它，也没有基于 freshness/version 的 detail TTL authority。**不能为了速度直接启用无限期缓存并展示成 current**。

candidate detail function 顺序执行 preparePublicRead、current serving row read、serializer、post-read stop/epoch 核对。按序安全读是否可并行必须保持相同停止／epoch语义并用 race/no-resurrection 测试证明；只读审计不能证明 CloudBase I/O 就是瓶颈，也不能直接删除复验门。

规则决策后，在安全合成／获批 candidate 窗口测端上与服务端分布，再决定是否实施：已证实的重复请求去重；安全独立读并行；无意义依赖／payload 精简；有版本／失效条件的 public-only retained loading 呈现。现阶段不新增 prewarm、计时云函数、collection、cache policy 或真实数据 bridge；任何外部配置／代码部署仍按本次命令独立审批。

如果分段证明平台冷启动主导且无法在当前架构消除，保留数据真实性与可接受 loading，列精确 RC known risk，交 Founder 决定。不用函数内耗时取代端上等待，也不以 warm 成功掩盖 cold 问题。

## 执行记录与下一门

Files changed：仅本报告及 audit/protocol/current status 文档。Product decisions：无新 latency threshold、无 accepted RC risk。Backend/frontend/data-contract code changes=0。External actions=0；exact cloud resource/config diff=NONE；环境仅引用 `cloud1-d7gxqfwv783a1f131` 既有 detail function，未调用、部署或改 flag。

Tests/builds：本轮文档检查见 Opportunity 决策表；没有端上采样／性能实现测试／本轮 preview。Founder evidence：只引用 TASK20 文字回报；本阶段 NOT_RUN。Failures/fixes/severity：T20-P2-01 P2 OPEN，未修复，无新已确认 P0/P1/P3；不宣称 latency PASS。Privacy/security：未读 private DB／用户资料；future telemetry 仅 public-safe timing/count。V1_DIFF=TASK20 历史最终 0 / VERIFIED；本轮仅源文件不变核验。

Rollback：本地文档可撤回，未增加缓存／外部操作；cost：未产生云动作，无实账；Git：原 dirty `feature/v2-board-map` 保留，无 commit/push/发布。Current gate：Opportunity rules 待 Founder；本项 endpoint/tap-to-render 测量未完成。Next：规则完成后本地有界 timing／优化与回归，必要云 diff 获批后真实 candidate 采样，Founder 决定残余 RC risk。
