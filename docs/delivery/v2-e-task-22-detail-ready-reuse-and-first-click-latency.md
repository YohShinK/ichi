# TASK22 首次完整详情加载优化交付

日期：2026-10-06。约束：`MAP_DETAIL_READY_REUSE_V1`。状态：`CLIENT_IMPLEMENTED + PRODUCTION_QUERY_APPLIED + NATIVE_READY_DETAIL_VERIFIED / AWAITING_REVIEW`。唯一活动区块V2-E/TASK22仍IN_PROGRESS；客户端尚未正式微信发布，后续Phase未解锁。

## 结果与根因

完整详情已在点击时就绪，后台复核继续执行。正式开发工作区及最新官方预览搭载；生产仅更新query函数一次。两条实际公开记录在开发工具模拟器中，地图查询646ms同时返回完整资料，查询完成后不等待浏览时间直接选择，完整状态7ms/6ms就绪；普通OS指针输入两条分别7ms/8ms，实际详情头像、昵称、备注、赏级及剩余数量正常渲染。

此前picker已读取完整公开详情，却只保留备注/时间文案；选择又调用独立详情函数。首页公开预热也只持有概要。原方案提前展示骨架，完整资料仍等待网络。真实热接口样本普通点击752ms、列表点击581ms；只补客户端预读后的首请求RPC仍达6801/7302ms，浏览2秒后首次选择仍等5281ms。本轮未获得平台ColdStart信号，不能把这些时间直接归因为函数冷启动或计算冷启动占比。

最终实现复用地图查询已经读取、通过原公开安全门的资料，把首根页最多两条完整公开详情随同marker返回，客户端先准备再通知UI。点击立即填入有效资料并后台复核。最终后台复核RPC2963/2903ms成功，已不会挡住上述两条首次完整展示。保留此前50并发原子频控修复，未恢复全局串行。

## 实施与防回退

- `public-map-client.ts`：2分钟/16项仅内存公开详情准备区，根/准备代次、当前marker、schema/policy/projection/servedVersion和失效联合检查；同ID预读、picker和选择共享在途请求。选中有效结果立即LOADED，仍重验；明确失效、拒绝或复核失败清除详情。
- `public-map-contract.ts`、`public-map-candidate-service.ts`：可选preparedDetails最多2条，仅本页正确版本；沿用安全公开详情和独立头像规则，拒绝重复、错政策/投影及私有身份字段。public-map-v3保持兼容，旧客户端可忽略，旧服务器省略时仍能正常读取。
- `home/index.ts`：只有实际前台map-preview/LOADED准备首2可见ID；首页不额外请求详情。根查询/切换/离开/后台/卸载清理准备并阻止回调重新发起预读。手动下拉forceRefresh仍实际读取，列表2并发/8可视行不变。
- 生产runtime在原账号/control/epoch/policy最终检查后，从同次已读安全公开core生成首根页最多2条详情，不增加数据库读取。历史query domain补可信首次上传时间投影；不以observedAt或桥接更新时间代替首次上传时间。

初始准备期15秒会在用户浏览及普通输入等待中提前失效，最终与已有公开列表TTL统一为2分钟。没有永久详情缓存或落盘。过期、缺准备或超过首2条的记录仍走真实详情读取；本轮不承诺每条记录都瞬时加载。每次选中仍复核，查询与生命周期清理正常。

WXML、样式及此前修好的原生tap绑定本轮未修改。地图分享、条例、模糊定位、举报、筛选和桥接规则不变。认知已同步到五份memory-bank及AGENTS.md顶部，历史“picker丢弃详情/每次点击只等新RPC”不再是现行等待约束。

## 生产应用

以`query-public-map-leads`各自当前真实远端ZIP为基线，仅修改shared/runtime.mjs和shared/domain.mjs。其余15/17源码文件保持（含原atomic security频控）；17/17源码及原配置回读PASS。未用统一本地版本覆盖远端历史差异。

本轮只接受一次UpdateFunctionCode，requestId：`a4fb1b02-5c92-4ee1-a90b-5fbfffbaa763`，2026-10-06T06:56:58.043Z。detail函数未部署；资源、配置、数据库迁移、continuous bridge均未重复执行。用户业务数据、真实条例/举报写入0；Git提交/推送0。公开读取依原规则维护限流等运行计数，不归类为用户业务写入。

回执：[部署及源码回读](../../artifacts/task22/phase2-detail-ready-20261006/deployment-query-public-map-leads.json)、[精确远端候选清单](../../artifacts/task22/phase2-detail-ready-20261006/manifest.json)。

## 验证

| 验证 | 结果 |
| --- | --- |
| 当前apps/packages/services/tests/scripts全套 | 1338通过、0失败、1既有跳过；新增39项 |
| canonical/client定向 | 150通过 |
| 精确远端query候选 | 19通过、41明确未选；未选项不计通过 |
| typecheck、lint、最终Next构建 | PASS |
| 最终Playwright、分享/workflow、格式/diff | 26通过；其余PASS |
| 原生真实两条、普通OS点击与完整卡片 | PASS，状态7ms/8ms |
| 列表打开无需另发detail RPC | 0次；query已提供两条完整资料 |
| 下拉重读 | 2次实际RPC；失败保留有效行 |
| 内部列表/详情拖动、外部点击/拖动 | 内部保持，外部关闭；独立详情同样通过 |
| 赏级横滑 | 58px，通过 |
| SDK/Page临时包装恢复 | PASS，未保留fixture |

自动测试覆盖准备过期/容量、当前查询/版本/政策/投影、撤回/失败、同ID请求合并、不同选择归属、刷新及hide/unload/退出迟到、wire私有字段、query最终安全门。针对当前源文件运行全套，历史冻结artifact中的旧测试不属于当前源码测试集，不为通过它们而恢复旧实现。

第一次网页全组为25通过/1原有识别滚动恢复超时，该单项重跑已通过；最终全组26通过，结果已在final-validation.json记录。无网页产品改动、无放宽断言或修改无关交互。

## 证据与预览

证据目录：`artifacts/task22/phase2-detail-ready-20261006/`。

- [最终即刻点击耗时及真实查询](../../artifacts/task22/phase2-detail-ready-20261006/native-final-ready.json)：query646ms、完整状态7ms/6ms、后台2963/2903ms。
- [普通第一条](../../artifacts/task22/phase2-detail-ready-20261006/native-physical-final-first.json)、[普通第二条](../../artifacts/task22/phase2-detail-ready-20261006/native-physical-final-second.json)：完整状态7ms/8ms及选择归属。
- [真实读取、刷新及触摸边界](../../artifacts/task22/phase2-detail-ready-20261006/native-real-two-parallel-touch-qa.json)、[Page恢复](../../artifacts/task22/phase2-detail-ready-20261006/native-restoration.json)。
- [第一条完整卡片截图](../../artifacts/task22/phase2-detail-ready-20261006/native-real-final-first.png)、[第二条完整卡片截图](../../artifacts/task22/phase2-detail-ready-20261006/native-real-final-second.png)、[独立详情截图](../../artifacts/task22/phase2-detail-ready-20261006/native-final-ready-standalone.png)。
- [官方预览二维码](../../artifacts/task22/phase2-detail-ready-20261006/native-preview-qr.png)、[预览信息](../../artifacts/task22/phase2-detail-ready-20261006/native-preview-info.json)：包1048085字节，客户端未正式发布。
- [最终验证回执](../../artifacts/task22/phase2-detail-ready-20261006/final-validation.json)。

上述耗时是微信开发工具模拟器实际公开请求和Page完整状态提交/实渲染证据，不是物理手机帧提交时间、强制冷启动或P95。当前实际公开数据为2条，未伪造50条生产记录。Founder真机人工验收仍属于当前区块收口。
