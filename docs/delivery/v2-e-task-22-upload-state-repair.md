# TASK22：V1 上传状态、条例与上传意图生产修复

2026-10-03。唯一活动区块V2-E。状态：`PRODUCTION_REPAIR_APPLIED / REAL_WECHAT_CONSENT_READ_VERIFIED / AWAITING_DEVICE_INTENT_RECOVERY_AND_BATCH_REVIEW`。Phase2整体仍未达到`LIVE_BRIDGE_VERIFIED`。

当前用户确认的合同为`UPLOAD_CONFIRMATION_MAP_SHARING_V2`：原上传确认表达分享意愿；核验通过后完成V1上传，与条例无关；真实当前账号同意条例后，合格V1来源转为V2；只有V2形成地图Marker。本人记录只显示V1“已上传”。完整行为见[现行约束](../decisions/map-upload-sharing-contract.md)。

## 修复结果

| 接点 | 实现与生产证据 | 当前结论 |
| --- | --- | --- |
| 原上传确认 | 两条路径提交披露版本/rights；V1事务保存`observationCandidates.uploadSharingAuthorization`，不查询V2条例作为上传前提 | 正式工作区和生产finalize函数已接通 |
| 设备旧意图 | 原持久队列调用V1的`confirm-upload-sharing`，服务器确认同一recordId的ACK后才移除；失败保留、公平轮转、并发后续批次 | 不增加分享按钮；真实原设备补送待验证 |
| 直接上传核验 | 服务端同步备注安全检查；拒绝不安全备注。复用既有识别/版面确认，不启动赏票及双位置比较核验 | 新提交逻辑与微信`security.msgSecCheck`权限已应用；本轮未代替用户上传新记录 |
| 已上传显示 | direct `clue_submitted`按V1终态显示“已上传”，不依赖条例、V2 permission、Marker回执 | 实际小程序CUFZBP已上传 |
| 条例 | 正式政策CAS切换为`map-contribution-20261003-v2`及匹配scope；epoch/mutationRevision各加1，其他控制保持 | 政策应用/回读通过 |
| 条例服务读 | 失败定位于`COMMAND_READ_CONTROL`、CloudBase `-501001`；控制记录改顺序读取，保留阶段/错误码诊断，不记录正文/身份；客户端只对瞬时失败重试GET一次 | 修复后真实微信GET连续3/3成功；不是用匿名smoke替代 |
| V1→V2授权 | worker读取可信V1上传意图，必须另外验证真实当前账号条例及公开门，才在事务写V2权限。DO_NOT_SHARE、删除/注销不能覆盖或复活 | 生产源码已应用，processor保持关闭，真实迁移未执行 |
| 旧分享流程 | 正式客户端删除旧选择UI、modal、事件及manage-map-player-source/SET_INITIAL_CHOICE调用；旧服务器入口只为兼容 | 防回退校验通过 |

三项最小代码更新全部以各自当前真实远端ZIP为基线，未用统一本地runtime覆盖线上历史差异。最终回读finalize-board-observation 8、manage-map-contribution-consent 17、process-map-source-bridge 20个应用源码文件一致，三函数稳定配置不变。get-my-records及manage-map-player-source源码、环境保持原样。先前条例诊断包更新及最终顺序读取修复各自有独立回执，失败定位没有被写成“诊断日志本身修好了问题”。

条例scope为`4bbd5de5b49d44a5eb11e4e3c96e77194ab48e06cdfdb4b7ec2319af2ef82230`；正文SHA256为`dbf65cf2d6ef1aa60af836109508421b0279e25f7cf0920224b2722b2f5ebefd`。公开定位仍为GCJ02、0.001°网格、accuracy≤100米；原始坐标保持私有。

## 当前真实断点

实际工作区/真实微信模拟器读取：条例`READY`、当前账号新版consent为`ACCEPTED`；Agent没有执行ACCEPT，也未注入fixture模拟此状态。本人列表1条CUFZBP显示“已上传”，没有旧分享按钮。账号已接受所以条例接受弹窗不会再次打开；`real-terms-readable.png`仅为尝试打开后的当前页截图，不能声称它是未接受条例弹窗截图。

最新只读全量preview为26条、合格0条、SKIP26条：22条缺当前版本精确APPROVED的draw submission，4条缺服务器分享授权证明。原先23条/20条/3条是先前时点快照，不覆盖当前新增真实记录。账号条例同意不会给旧记录制造SHARE。

CUFZBP的权威来源核验、当前账号条例、位置精度均满足；仅服务器上传分享意图缺失，因此`SHARE_AUTHORIZATION_REQUIRED`。这不改变它的V1“已上传”状态。已提供原上传设备新版预览码，打开新版并刷新列表将自动补送该设备上已有明确意图；未读取/伪造其他设备的私有存储。队列已被清除或设备更换时，不能凭账号同意批量补造历史意图；需另行核实具体记录的原始确认依据。

当前生产回读：V1记录26；条例记录2；V2 permission、source state、source outbox、boardObservation、BoardInstance、contribution、PublicMapLead均0；PUBLIC0。worker/drain函数disabled、bridge.processorEnabled=false、公共readEnabled=false、四个V1 producer flag默认false、timer CLOSE。consentEnabled=true、read-stop=false用于条例服务，不能称所有safe-stop全关闭。历史迁移0、continuous未启用、Git提交/推送0。

剩余顺序：原设备旧意图补送→只读回查并形成具体合格小批量→Founder批准具体批次→非空drain→worker及真实`V1→boardObservation→BoardInstance→contribution→PublicMapLead→Marker`→最后按原门开启continuous。持续桥接前还须完成账号接受条例/意图迟到后的持久source重入队，不能把“worker能读取证明”说成“所有旧事件会自动再次处理”。这些后台接点不能用再次分享按钮替代。Phase3/NETWORK/50/300/微信正式发布继续LOCKED。

## 验证与可回查产物

本轮全套1219 PASS、1既有SKIP；单独原生Node测试PASS。类型/Lint通过固定版本`corepack pnpm`执行；直接系统pnpm版本不匹配的失败日志保留，随后固定工具链检查成功，没有改动全局工具链。Next构建、26/26页面回归、CloudBase本地构建/配置检查通过。新增条例事务回归会在模拟事务不允许并发doc读取时验证GET正常返回。微信官方CLI最新预览成功：1016416字节（992.6KB），不是正式上传审核或发布；早期preview缓存失败及修复前UI不可用结果保留，不充当通过证据。

工作流与防回退最终校验均PASS，结果见`artifacts/task22/phase2-upload-state-repair/final-workflow.log`及`final-sharing-flow.log`。当前修复产物独立保存，未重建或替换原冻结Phase1/Phase2 ZIP、manifest、proposal及验收证据；旧构建器SHA保护不应放宽以覆盖历史。

- [V1最小部署回执](../../artifacts/task22/phase2-upload-state-repair/deployment-repair.json)
- [正式条例政策CAS回执](../../artifacts/task22/phase2-upload-state-repair/policy-repair.json)
- [微信安全接口权限回执](../../artifacts/task22/phase2-upload-state-repair/wechat-permission-receipt.json)
- [条例最终顺序读取部署回执](../../artifacts/task22/phase2-upload-state-repair/consent-sequential-repair-deployment.json)
- [worker V1意图部署回执](../../artifacts/task22/phase2-upload-state-repair/worker-v1-intent-deployment.json)
- [最终源码/配置/控制回读与实际secret扫描0](../../artifacts/task22/phase2-upload-state-repair/final-readback.json)
- [真实微信条例连续读取](../../artifacts/task22/phase2-upload-state-repair/wechat-consent-stability.json)
- [真实小程序UI回执](../../artifacts/task22/phase2-upload-state-repair/wechat-ui-verification.json)
- [最新只读26条预览](../../artifacts/task22/phase2-upload-state-repair/history-preview-current.json)
- [完整测试结果](../../artifacts/task22/phase2-upload-state-repair/full-final-tests.json)
- [真实本人列表截图](../../artifacts/task22/phase2-upload-state-repair/screenshots/real-my-uploads.png)
- [当前新版预览码](../../artifacts/task22/phase2-upload-state-repair/current-preview-qr.png)

当前事实已同步AGENTS、README、PRD、五份memory-bank、现行合同及Phase2源码README；早期“政策未应用”“服务器意图未接通”“逐记录GET证明待适配”等明确标为历史。
