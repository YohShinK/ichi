# TASK22 Phase2 分享接点与全局认知审计

2026-10-03。结论：正式开发工作区已移除旧分享UI，本地恢复接点已补齐；生产完整上图链路仍有明确缺口，不能标成完成。现行约束：`UPLOAD_CONFIRMATION_MAP_SHARING_V2`，见[地图分享现行约束](../decisions/map-upload-sharing-contract.md)。状态LOCAL_GATES_PASS / AWAITING_REVIEW；生产保持Founder指定暂停。

## 本次发现并修复

| 发现 | 修复后的行为 |
| --- | --- |
| 云端记录重试核验、补传照片及备注重审完成后没有立即重试分享授权 | refreshCloudRecords完成后统一处理已有待授权意图；读取或审核历史记录不会创建新意图 |
| 核验在旧请求进行中完成时，新flush被旧未核验结果合并掉 | 并发触发串行排入下一批，重新读取权威状态，同批触发合并 |
| 前20条长时间待核验会永久挡住后面的合格记录 | 每批最多20项，等待项移至队尾；轮转次序持久保留，重启后也能处理后续项 |
| 直接上传已被云端接收后，本地显示缓存失败可能丢失分享意图 | 原上传确认的意图在本地显示缓存写入前保存，不依赖缓存成功 |
| 任意已有SHARE被当成当前条例授权，没有验证版本与rights | 必须取得当前termsVersion/scopeDigest/rightsAttested/followCurrentVersion证明，旧版或缺字段保留等待，禁止假确认 |
| 通用公共选择API仍容易被重新用于独立授权UI | 移除MapSourceChoice导出和公共getSourceChoice/setInitialChoice；内部实现仅为原上传确认写SHARE/rights，已有DO_NOT_SHARE仍不覆盖 |
| 全局README与旧暂停段仍存在过时当前描述 | 更新当前状态，明确旧按钮已被否定／移除，旧历史不能作为实施依据 |

正式客户端非测试源码中，“地图分享选择”“我确认有权分享，并分享至地图”、map-source-choice、旧事件控制器及通用选择API扫描结果为0。辅助抽赏原分享弹窗继续保留，它是现行路径的一部分。后台现有GET/SET_INITIAL_CHOICE协议保留，用于从原上传确认保存授权凭证；没有增加核验后的用户发布操作。

## 尚未连接的生产接点

以下由实际当前本地代码及已保存的生产部署断点得出；本轮没有云端写入、invoke或新线上回读。

| 接点 | 现状／恢复TASK22必做 |
| --- | --- |
| 正式条例和scope | 客户端期待独立v2候选，原生产仍为v1；需应用一致政策并修复真实微信条例调用，不能把匿名请求smoke当真机PASS |
| 上传确认时的服务器意图落库 | 现行待处理意图仍先保存在设备，owner入口只有来源通过后才能写初始授权。用户关闭／卸载／换设备，不能保证服务器自行取得尚未交付意图。需服务器在原上传确认时持久接收，仅在核验及公开条件成立后处理；禁止新增补救分享按钮 |
| 已有授权证明及版本续认 | 已部署并回读的冻结GET只返回fingerprint/shareIntent，不返回适用条例／scope／rights证明；SET遇到既有选择拒绝覆盖。需最小响应适配，并只针对明确新上传意图处理适用授权续认，不由一次账号同意遍历历史续认，不覆盖DO_NOT_SHARE |
| 后台实际运输 | 非空drain→worker真实互调尚未验证；直接signed Invoke和暂停态timer不能代替它 |
| 真实记录到Marker及以后自动传播 | 新微信客户端尚未上传／发布，真实合格记录需只读preview、具体批次批准及真实完整链路验证；公开查询、processor、V1 producer flags、timer和continuous按原断点尚未全开 |

这些是恢复TASK22的必要工作，不是缺少一个用户分享选择按钮。先前已完成的13资源、7函数和事务／timer证据不重复。历史私人记录不批量公开；Phase3/NETWORK/50/300/正式微信发布仍LOCKED。

## 全局同步与防回退

AGENTS.md、README.md、PRD.md及五份memory-bank当前入口都引用同一现行约束，明确原上传确认取得授权、无二次分享按钮、历史状态不得恢复旧流程。历史概念文档和V1网页演示继续只供追溯；已冻结ZIP及生产证据不改。

新增scripts/validate-upload-sharing-flow.mjs扫描整个正式小程序非测试源码，旧文字／视图／事件／通用选择入口一旦重新加入即FAIL；同时要求全局当前入口引用现行约束。validate-workflow.mjs自动包含它。

新增9项治理回归：实际工作区通过、历史引用与负面测试不误报、故意在任意新页面植入旧入口会FAIL、只在历史段引用规则也会FAIL。静态检查之外，两条正常上传及恢复路径均有行为回归；以后即使用不同文案重新添加等价二次发布UI，也违反现行规范，仍须按用户路径验收。

## 验证与保护

- 完整仓库：1213 PASS，1既有SKIP；本次定向4文件126 PASS。
- Lint、最终修改测试Lint、双TypeScript、工作流和防回退门PASS。
- Headless Playwright 26/26 PASS；Next.js独立构建PASS。初次与页面测试共用缓存造成构建类型文件竞争，已保留失败日志并独立重跑通过，没有改产品代码来绕过检查。
- 地图包审计PASS，新增证据输出在本次目录；已有历史输出恢复前次值。原7张截图对应的WXML/WXSS/条例源SHA未变，本次未改UI视觉。
- 1199受保护输入，非授权drift0；授权差异单列，验证重新生成的apps/web/tsconfig.tsbuildinfo另列为类型缓存，不作产品源码／部署输入，也未用HEAD覆盖原有缓存；此次云端写／invoke／真实历史迁移／Git提交推送0。

独立证据：[audit-verification.json](../../artifacts/task22/phase2-sharing-audit/audit-verification.json)、[完整测试](../../artifacts/task22/phase2-sharing-audit/full-test-results.json)、[定向测试](../../artifacts/task22/phase2-sharing-audit/targeted-test-results.json)。本地修复文件为home/index.ts、production-map-service.ts及map-upload-sharing.ts；测试包含云端重试／重传／备注成功、历史复核不生成授权、本地缓存失败、晚到核验、25条队列公平处理和旧scope拒绝确认。
