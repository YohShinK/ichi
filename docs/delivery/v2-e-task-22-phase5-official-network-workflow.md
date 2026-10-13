# TASK22 Phase5 官方网络版面自动录入

Phase5 实现已完成：AUTOMATED_ACCEPTANCE_PASS / PRODUCTION_APPLIED / REAL_PUBLIC_READ_PASS / SAFE_STOP。用户授权的七函数能力更新已全部完成并实际回读；原50条NETWORK和2条PLAYER公开详情通过逐条检查，50私有来源行逐字段SHA保持（private-50-source-preservation.json）。此处不新增HUMAN_APPROVED或PHONE_PASS；TASK22整体仍在进行，Phase6真机与整体验收继续。

用户确定的方向是“自动录入，无法识别或者待确认交由 founder 处理”。采用 `AUTO_CLEAR_ESCALATE_UNCERTAIN`：Agent 核清完整证据后执行既有官方准入流程，审核身份为实际 `AGENT_USER_DELEGATION`；未知、遮挡、矛盾或缺失依据的候选集中交 Founder。没有默认勾选批准，也不把置信度分数当作事实证明。

## 已交付流程

`scripts/ichi-network.mjs` 是统一入口；`scripts/network-workflow/schemas.json` 是机器合同。collect 保存独立批次、原帖及图证据；auto-review 核对完整识别包与有效委托；review --pending 生成内嵌原图的集中确认页，普通review保留全批次查看。publish 默认显示计划，run 在已授权范围内串行执行采集输入、自动审核、疑点整理与合格项发布。每批最多 50 项，不新增采集数量目标。

各赏余量分别绑定图片 SHA、票区及计数方法：可见未抽票、明确印刷余量、完整未抽板，或确切人工确认。大赏集合另绑定奖品区域及同图证据。原帖、主页与实际 POI 对应地点摘要；分店不明就留待确认。公开备注来自原图/正文的安全内容，地点单独保留，未标价格保持 null。

同帖多板按 canonical 来源加 boardEvidenceKey 区分；同来源同板导入去重，不以同店或相似图强制合并。版本快照、证据副本、原子 HEAD、进程锁和 hash 审计链支持恢复；操作前重新核对所有摘要。修改事实或证据会使原批准失效。

Founder 可在页面补数字并导出补充文件，也可在聊天直接回复数字。fix 绑定批次版本、候选、图 SHA 和原问题，生成新版本及真实回复证据，再自动复核；不会补造其他缺失字段。修改数字后直接批准旧版的操作已阻止。

发布使用已有 Source → Verification → Resolution → Opportunity/Freshness → Eligibility → Projection；正式来源与公开投影仍走原事务链。中断先 resume 只读核对提交状态及实际公开详情，未知状态不盲重放。correct 对已发布的同一版面执行独立 exact 修正计划，保持实例/公开 ID 和原观察时间；withdraw 使用现有撤回/不复活机制。两者默认仅计划，实际执行须匹配具体操作授权。

原首次发现用于七天窗口；原帖上传作为缺乏更早可信实拍时间时的观察时间。采集、审核、补数及修正均不刷新 30 天期限。原图、账号、来源 URL、rights、原始地点依据和 curator 只在内部；公开投影继续使用原字段白名单。批次结束核对准入/维护双门关闭、smoke 关闭、maintenance timer=0，PLAYER bridge 保持。

## 可复用技能与实际证据

技能源在 `skills/ichi-network-curation/`，已安装到 `/Users/cunfu/.codex/skills/ichi-network-curation`。技能提供采集搜索/保存 helper、命令合同及识别边界，按用户授权与当前工作集执行；不创建后台自动化或打开维护 timer。浏览器收集仍遵循 Ego 的授权/移交规则；已结束的旧采集窗口不复用。

本轮没有新增或重放生产来源。原最后四条真实已入图记录导入独立本地批次后，resume 已实际读回四条 ADMITTED 及公开详情；证据 `real-collect.json`、`real-resume-r6.json`。旧问题包中余下 10 项已导入 `founder-pending-ten/`，实际自动审核全部进入 NEEDS_FOUNDER，没有入图；一张视频封面明确标出不能用于余量计数。原 Phase4 十份完成证据 SHA 保持，见 `phase4-evidence-preservation.json`。

集中确认页：`artifacts/task22/phase5-20261009/founder-pending-ten/founder-pending.html`。页面实际渲染十张内嵌图片、中文状态/原因、初始确认未勾选、数字导出包含 exact 绑定；变更数字后批准旧版被阻止，视频封面补数导出被阻止并提示补真实播放帧。UI 检查中的数字为隔离测试输入，未作为真实 Founder 回复导入。早先检查指向旧pending页，未覆盖新增封面提示；已用明确 --pending 重新生成并实测，最终证据为 founder-ui-check-final-r4.json。

## 部署范围与验收

用户已明确回复“允许这次部署”，绑定计划 `db74ecd8a6d4ce3284cb0fca811e932658672c8891a32c241bc118695da5e360`。实际于2026-10-09T14:31:22Z完成七份远端包逐文件回读，共42025文件（含vendor），每份仅变更 `phase3/network.mjs`；七函数配置、原policy/control/bridge/features及公开head保持。新增独立 workflow 委托与地点 exact 注册，旧 50 条注册/批准和 PLAYER 不变。模块 SHA：`0f3a782c1a27a8772b6a014ed7c4b869041973e621d9f007bd5499c9d64b91a0`。全包候选、rollback 与清单保留在 `production-r2/`，不覆盖已批准 manifest；成功回执为 deployment-receipt-r5.json，当前已部署配置为 config-deployed.json。

完整包超过 SDK 的 inline 上传限制，COS 临时上传连接超时；先确认原代码未变，改用平台增量接口传输从已授权候选提取的唯一模块。每次记录完整候选 SHA、传输 ZIP SHA 和平台请求 ID，更新后下载完整包，逐文件核对目标模块及所有其余文件，并核对配置。传输方式变化不改变已授权的最终文件内容、目标函数或资源范围。失败回执原样保留，未把失败尝试写成部署成功。

| 范围 | 当前证据 |
| --- | --- |
| 批次/自动审核/修正/发布/恢复/撤回 | `workflow-tests-r6.log`，28 项；隔离环境使用现有真实共享 pipeline，不在生产发布测试向量 |
| 新 registry/旧协议/委托 exact 防串用 | 当前 production Phase3 测试及 `production-r2/package-validation.json`；七编译包各通过新委托、错误授权拒绝及旧四条输入等价，共 28 次真实输入等价 |
| 当前源码全量回归 | `current-source-tests-final-r2.json`：1462 通过、1 既有跳过、0 失败 |
| 类型/Lint/网页构建 | `typecheck-final-r2.log`、`lint-final-r2.log`、`next-build-final-r2.log` |
| 网页既有行为 | `playwright-final.log`：26 通过；Founder 页另见 `founder-ui-check-final-r4.json` |
| 技能/分享流程 | `skill-validation-final.log`、`sharing-final.log` |
| 最终生产源码与公开回读 | `deployment-receipt-r5.json`：七函数完整文件/配置保持；`all-50-public-after-deploy.json`：实际SDK上海query恰好50网络ID，50NETWORK+2PLAYER详情余量/大赏/金额/备注/原观察与期限/公开身份保持，私有字段0，双门关闭/PLAYER bridge保持 |

上表证据都位于 `artifacts/task22/phase5-20261009/`。直接运行仓库默认未限定目录的测试会扫描历史 artifact，出现六项归档测试失败；其断言针对旧归档运行时，失败记录保留，未修改历史文件凑绿。当前源码验证明确限定 apps/packages/services/scripts/tests。网页构建与开发测试最初同时使用构建目录导致一次构建失败，测试完成后独立重建已通过，首次日志保留。

requirements-audit.json按P5-A—F绑定具体产物、实际检查和证据SHA；本轮仅更新代码能力，新增准入/修正/撤回的生产记录数为0。公开读有正常限流计数等运维写入，不把其笼统称作无云写入。独立workflow的首次新来源写入未在生产试投：共享pipeline隔离集成与七编译包能力检查通过，真实生产只读复用了原50条，不发布测试构造。

## Phase6 交接边界

Phase6 已由另一明确指令并行解锁；本轮最终源码/生产回读用于其最终集成。模拟器可信微信 SDK 读取不等于物理手机通过，也不等于 50 用户 pilot。既有一个账号/iPhone16Pro的手机验收及有效预览仍由 Phase6 完成；不在此报告补造设备/性能/PHONE_PASS。全国 300、Phase7/8、正式微信发布及 Git 提交/推送仍未执行。
