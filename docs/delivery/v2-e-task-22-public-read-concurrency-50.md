# TASK22：公开读取50并发可靠性

2026-10-06，工作集 `PUBLIC_MAP_READ_CONCURRENCY_50_V1`，V2-E/TASK22。

状态：`PRODUCTION_APPLIED + FIFTY_RAW_READS_VERIFIED / AWAITING_REVIEW`。正式工作区及官方新版预览1041421B已搭载；未正式微信发布。当前状态以 `memory-bank/progress.md` 顶部为准。

## 问题与修复

前轮真实两条详情并行三次，各有一条 `SERVICE_UNAVAILABLE`，失败对象交替；顺序读取两条均成功。记录没有消失。公开读取的限流实现每次用事务改写同一个账号、同一操作的计数行，形成共享事务争用点。客户端串行是临时恢复措施，不能证明后端并发可靠性。

此次将公开 `query/detail` 的计数改为数据库条件原子增量：同一分钟在 `count < limit` 条件下执行 `inc(1)`；首次创建使用唯一ID；换分钟使用旧窗口及旧计数比较更新，竞争失败者有界重读。其他写命令保持原事务。腾讯云说明 `inc` 可用于并发安全的原子增量，实际SDK测试同时验证了本项目的初始化和换窗竞争。[腾讯云更新数据文档](https://cloud.tencent.com/document/product/876/19366)

每个账号仍有 query 30次/分钟、detail 60次/分钟额度。超过额度返回 `RATE_LIMITED`，不会无限放行。50条记录存在与每分钟读取次数是不同指标。

客户端撤掉 `CandidatePublicMapService` 临时全局详情串行队列。重叠列表继续可视8行、最多2并发、去重、瞬时错误仅重试一次、生命周期取消；卡片不再等待该共享队列。原触摸边界、地图分享、定位、排序及标签逻辑保持。

## 生产应用

`query-public-map-leads`、`get-public-map-lead-detail` 分别以自身当前真实远端ZIP为基线，每个只修改 `shared/security.mjs` 中的 `consumeRate` 片段，另外16个源码完全保留。未用统一本地版本覆盖线上历史差异。各执行一次 `UPDATE_CODE`，没有配置更新；部署及最终只读回查均确认17/17源码哈希匹配、稳定配置不变。

未新增collection/index/权限，未重做桥接、资源声明或历史迁移。真实用户记录、条例接受及举报写入均为0。测试创建的3条私有隔离计数器已经精确清理并确认不存在。

## 验证

| 验证层 | 结果 |
| --- | --- |
| 实际 wx-server-sdk 4.0.2，首次50并发 | 50放行、0异常、计数50 |
| 同一计数器换分钟50并发 | 50放行、0异常、计数50 |
| 100详情并发安全额度 | 正好60放行、40正常限流、0异常 |
| 50查询并发安全额度 | 正好30放行、20正常限流、0异常 |
| 本地后端50独立公开记录 | 查询50；50并行详情归属、备注和可信上传时间正确；额外请求正常限流 |
| 各自远端候选 | 26个定向测试PASS；未选中的106个测试不计作通过 |
| 原生50独立运输样例 | 首批只读8；滚动全部50正确；并发峰2；第50行详情正确；SDK和真实2条恢复 |
| 真实生产50原始SDK请求同时发出 | 50/50成功，应用排队0、应用重试0，错误0 |
| 真实两条当前应用并行三轮 | 6/6正确，真实并发峰2；刷新/失败保留/内外touch/赏级横移58px通过 |
| 全工作区现行回归 | 1295 PASS、0失败、1已有skip |
| 页面回归及构建 | 26 Playwright PASS、类型/Lint/Next构建PASS |

真实生产测试交替读取目前实际存在的两条记录，各25次；50个独立requestId、generation及返回ID均逐项匹配，备注和首次上传时间正确。p50 3324ms、p95 5541ms、最大5775ms。50条不同记录是在后端集成及原生运输隔离样例中验证，未向生产写入50条假用户数据。50个客户端在途SDK请求不等于测得50个物理SCF实例同时运行，平台内部调度未测量；本次结果不构成所有网络条件下的无限并发保证。

首次把50个Promise放在一次自动化evaluate中等待，工具触发30秒等待超时。随后仅修正测试记录方式：evaluate启动全部请求并立即返回，逐项结果存入临时Page对象供读取，最终50请求在约5.8秒完成。未据工具超时判定服务器失败，也未给请求增加应用重试。

开发者工具后续补测曾发生项目文件缓存误报（app.json实际存在）及自动化超时；没有把退出码0当编译成功。reset-fileutils仍未恢复，重新打开项目后真实并行/触摸复测和官方预览均通过。初期超时回执及编译错误日志保留，未因此改动产品代码。

## 证据

目录：`artifacts/task22/phase2-read-concurrency-50-20261006/`。

- `sdk-atomic-rate.json`：真实SDK、初始化/换窗/限额及清理。
- `manifest.json`、`candidate-tests.json`：远端基线最小补丁与定向测试。
- `deployment-*.json`、`final-readback.json`：两次代码应用及最终源码/配置回查。
- `native-production-burst-50.json`：50原始SDK请求逐项回执与时延。
- `native-fifty-records-qa.json`：50独立原生样例、列表窗口/详情归属/恢复。
- `native-real-two-parallel-touch-qa.json`：真实两条应用并发三轮与交互回归，SDK恢复。
- `native-preview-info.json`、`native-preview-qr.png`：官方预览1041421B。
- `full-tests-final.json`、`playwright-final.log`、类型/Lint/构建日志：当前自动回归。
- `final-validation.json`：最终验证、预览状态和范围汇总。

现行认知同步到AGENTS及五份memory-bank事实源，前轮全局串行标为历史临时措施。[真实两条备注和时间截图](../../artifacts/task22/phase2-read-concurrency-50-20261006/native-real-two-records-restored.png)，[新版预览二维码](../../artifacts/task22/phase2-read-concurrency-50-20261006/native-preview-qr.png)。

没有Git提交/推送；未进行正式微信发布，也未解锁50人pilot、Phase3或后续区块。
