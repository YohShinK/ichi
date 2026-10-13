# TASK22 Phase1-A｜IDENTITY_HMAC_KEY 暴露影响与轮换兼容性只读分析

结论：这是已确认的密钥明文输出事件，影响共享该键的身份映射命名空间。**禁止直接替换或仅改 bootstrap-account 的环境变量**：现有实现不支持双键兼容，替换会使原用户映射失配。此次只读分析未轮换、绑定、生成或测试任何真实新密钥，未部署函数、迁移身份或调用生产业务函数。分析完成后可继续用户已批准的独立控制资源批次；本报告不是轮换许可或事故已解决证明。

## 已确认事件与取证范围

上一轮配置核对中 Agent 把 bootstrap-account 的既有 IDENTITY_HMAC_KEY 值输出至工具响应。已告知 Founder；本报告不复制明文，也不声称会话输出已删除。新报告与脱敏证据仅保留密钥存在性、长度和 SHA-256，不保存值。实际哪些人或系统读取了会话输出、是否复制或滥用，未取得证据；不能报告无第三方接触或无滥用。

本轮用户明确要求先只读分析、禁止直接轮换，并指定 2026-10-02 15:09 preflight 为基线。证据：[batch-a-control-only-preflight.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/batch-a-control-only-preflight.json>)、[batch-a-control-only-resume-preflight.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1/batch-a-control-only-resume-preflight.json>)。本次完整稳定配置哈希与该基线一致，说明没有观察到配置更换，不能证明密钥没有被外部复制。

只检查本地已存在源码／合同与远端配置、ACL、索引、层、触发器及安全控制；不读取真实 identities／Account／Profile／版面正文、不读生产执行日志，不调用函数，不下载私有对象或远端完整 ZIP。远端 entry source／完整配置 SHA 一致，不等价于下载验证了整个远端代码包。

## 密钥用途与影响范围

- [domain.js](</Users/cunfu/Documents/ichi 2/services/cloudbase/shared/domain.js>) 的 hashIdentity：HMAC-SHA256(key, APPID + ':' + OPENID) → hex identityId。
- [runtime.js](</Users/cunfu/Documents/ichi 2/services/cloudbase/shared/runtime.js>)：trustedIdentity 从 cloud.getWXContext 获取 APPID/OPENID；accountForCaller 以 identityId 读取 wechatIdentities.accountId，再检查 Account active；bootstrapAccount 未命中时分配新 Account、ICHI ID 和默认 Profile，并写 identity mapping。
- 写入的 identity mapping 包含 accountId / appId / createdAt；该写路径没有保存原始 OPENID。既有存量正文未读取，不把该代码事实扩大为所有历史数据都不存在原始 OPENID 的证明。
- [resources.json](</Users/cunfu/Documents/ichi 2/services/cloudbase/database/resources.json>) 及 live 索引：wechatIdentities.accountId 为 unique。这会影响将两个 identityId 同时绑定同一 Account 的直接双别名方案。
- [index.js](</Users/cunfu/Documents/ichi 2/services/cloudbase/functions/verify-prize-tickets/index.js>) 的来源核验逻辑同样使用 hashIdentity；实际远端函数 recognize-draw-tickets 的配置使用该键，本地职责与远端 entry/config 元数据需在未来变更中再次逐包核实。
- [security.mjs](</Users/cunfu/Documents/ichi 2/packages/v2-map/resources/production/shared/security.mjs>) 的待部署 production 认证复用 V1 identity namespace；另有独立 ICHI_V2_ACCOUNT_AUTHORITY_HMAC_KEY。9 个 production 包仍未部署，控制集合创建不会改变认证路径。

本次 28 个函数只读配置显示以下 **13 个既有函数使用相同 IDENTITY_HMAC_KEY 哈希**：

- assign-special-ichi-id
- bind-wechat-profile
- bootstrap-account
- delete-my-account
- delete-my-record
- finalize-board-observation
- finalize-draw-update
- get-my-profile
- get-my-records
- get-quota-status
- get-recognition-job
- recognize-draw-tickets
- reserve-recognition

其它 15 个既有函数未发现同名环境变量；这不证明它们不存在其它间接依赖。shadow 使用独立 authority/test 配置且全部关闭；本次不改任何 secret。

## 安全影响：已知事实与条件性判断

| 项目 | 判断与限制 |
| --- | --- |
| 密钥保密性 | 已受损；会话工具输出构成明文暴露，应按已暴露处理，不能写 PRIVATE_LEAKAGE=0 来掩盖此事件。 |
| 身份标识隐私 | 持有密钥和具体 APPID/OPENID 者可计算相应 identityId，可能用于关联或验证身份映射；不能据此反推出任意未知高熵 OPENID，不能把哈希当加密可解密。 |
| 直接数据库管理权限 | 此键是应用 HMAC 键，源码未把它用作腾讯云 API credential；持有该值本身不等价于取得 CloudBase 管理凭证。wechatIdentities 为 ADMINONLY，客户端不能靠该键直接改映射。 |
| 正常微信调用冒充 | 在可信微信调用上下文下，事件字段中的 APPID/OPENID 不被 accountForCaller 用作身份，因此仅持有该键不足以通过该路径冒充其他微信用户；这不是全调用入口安全认证结论。 |
| 混合调用来源风险 | [CloudBase 官方实例复用说明](https://docs.cloudbase.net/cloud-function/instance)提示，getWXContext 在小程序／Web／HTTP 混合调用时可能残留身份上下文。本轮未做混合来源真实攻击验证，不能仅以密钥不是登录 token 就排除所有越权风险。 |
| 微信上下文来源 | [官方微信调用说明](https://docs.cloudbase.net/recipes/add-cloud-function-wechat-miniprogram)支持正常 wx.cloud.callFunction 链路中的身份来自调用上下文，而非业务请求字段。分析仍需遵守上述调用来源限制。 |
| 实际攻击或业务损失 | 未读取生产日志／业务正文、未攻击验证，没有证据判定已经发生或未发生滥用。 |

## 直接轮换的兼容性风险

1. **只改 bootstrap-account**：它会计算新 identityId，原 mapping 不命中，并走新 Account 创建路径。其它仍用旧键的函数继续查旧 Account，产生调用间账户分裂，原 Profile、记录、额度、角色、删除语义失配。
2. **同时改所有消费者但不迁移 mapping**：旧 identityId 全部无法命中；非 bootstrap 接口可能返回 ACCOUNT_REQUIRED，bootstrap 可给旧用户创建新的 Account／ICHI ID。旧业务引用 ownerAccountId 不会随 HMAC 改变自动迁移。
3. **批量将旧 HMAC 转成新 HMAC**：无法仅由旧 identityId 和两把键计算新 identityId；必须取得对应可信 APPID/OPENID 或可信的恢复通道，不能遍历猜测 OPENID 或伪造用户身份。
4. **简单添加新旧双 mapping**：当前 accountId unique 索引禁止两条独立 identity 文档绑定同一 Account。不能为迁移擅自 drop unique index；需要独立评审 schema／身份查找合同，或者可回滚的单文档迁移策略。
5. **旧键长期 fallback**：短期降低断链风险，但保留暴露键的关联能力和攻击面；需要限时、可测、可回滚的过渡设计，不能当作永久解决方案。

搜索已检查的 runtime / domain / verification 与 production security 未发现 previous-key、keyVersion 或 dual-read 轮换协议；本报告没有实现这类能力。

## 后续安全轮换的候选路线（仅分析，未批准／未执行）

- 独立确定事故处置权限与受影响消费者清单，保存脱敏取证，限制会话／日志的额外传播；不声称能从这里撤销已经输出的内容。
- 先设计并验证兼容读取、可信登录时迁移、原 Account 保持、唯一索引冲突和并发／幂等／回滚，禁止新建替代旧 Account 来完成迁移。
- 根据已验证的可信上下文，仅在真实用户重新访问时由旧映射建立新映射；是否迁移单文档、使用新别名结构及如何支持离线用户须独立冻结 exact diff。未获得原始可信身份的历史用户不能假称已完成转换。
- 所有实际消费者分阶段一致升级；Account/ICHI ID/Profile/记录/额度/删除状态和未来 V2 owner 归属必须连续。测新旧版本交叉调用、并发首次访问、部分部署、重试、回滚以及未迁移用户。
- 独立批准新键生成／安全绑定、兼容代码部署、schema/index 变更和身份数据写入；设置旧键退出条件、窗口及证据。当前只有配置更新无法安全做到这些。

以上涉及 V1 生产合同、代码、配置及身份数据，超出 Phase1-A frozen batch，全部未执行。既有身份映射继续使用原键并不是事故已关闭，只是在用户禁止直接轮换的前提下保持兼容性。

## 本次决策与状态

只读分析完成；新 preflight 结构配置 diff=0，V1 Count/Size 按 Founder 最新指令仅记录正常 volume 元数据，异常删除／突变仍检查。本次 volume 与 15:09 基线也无变化。用户批准的 mapControlState / ADMINONLY / kind_expiry / 4 safe rows 与此身份键无读写或消费者依赖，可按原冻结批次继续；不构成任何 secret 修改许可。

当前风险标签：IDENTITY_HMAC_KEY_TOOL_OUTPUT_EXPOSURE_CONFIRMED / ROTATION_COMPATIBILITY_NOT_IMPLEMENTED / SECRET_UNCHANGED。不把这份只读报告写成 live security remediation PASS。
