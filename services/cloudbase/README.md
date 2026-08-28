# CloudBase

V1-F 的 CloudBase 源码采用仓库先行、后端先行：

- `contracts/`：结构化版面与函数响应契约；
- `shared/`：可信身份、内部账号、ICHI ID、北京时间配额、六位码、票级归一化、守恒与差量推导；
- `database/resources.json`：13 个私有 NoSQL 集合、索引、ADMINONLY 权限、非秘密种子，以及识别专用私有临时对象前缀的删除策略；
- `deploy/manifest.json`：目标环境、事件函数、定时触发器和必须由用户配置的秘密名；
- `deploy/build-functions.mjs`：生成每个事件函数的独立可部署目录；
- `deploy/manifest.json` 的 `dependencyLayer` 固定 Node.js 依赖层 `ichi-node-deps_cloud1-d7gxqfwv783a1f131` v1；部署时应在无空格的函数目录中执行 CLI 更新，避免 CloudBase CLI 把路径误解析为 ZipCode。
- `functions/recognize-board/`：`qwen3.7-flash` 单模型识别函数；以任务绑定 `fileID` 获取 5 分钟临时 HTTPS URL，直接作为百炼 `image_url`。生产函数由服务端 `BOARD_RECOGNITION_MODE` 控制 `r2_direct_remaining|r1_remaining|hybrid_semantic`：R2 是 direct-remaining 默认路径，冻结 H0 `hybrid_semantic` 是唯一回滚，R1 仅保留历史回归；已移除的 `v4` 失败闭合，客户端不能传 mode。部署期内部 override 令牌常态不存在。没有百炼凭据时失败闭合，只有持有服务端配额预占产生的一次性任务令牌才能发起正常模型调用。
- `release-recognition`：owner-scoped、任务令牌保护的显式释放入口；只释放尚处于 `reserved` 的任务，修复客户端在上传／调用前终态失败时等待租约过期的问题，重复调用幂等。
- `functions/recognize-draw-tickets/`：唯一赏票核验生产入口，复用已验证的 CloudBase 函数身份；旧聚合协议已停用。Qwen 只逐张返回实体票 visual evidence，服务端从 authoritative draw events 重建 expected，并以 `recordId + boardId + submissionVersion` 做确定性 exact reconciliation。同版本重试幂等，旧版本结果不得覆盖新版本。

运行 `corepack pnpm cloudbase:validate` 会重新生成 `.deploy/functions/` 并验证资源边界。生成目录不是事实源；任何云端修改都必须能从上述文件重建。

开发环境 `cloud1-d7gxqfwv783a1f131` 的仓库目标为 13 个 ADMINONLY 集合、17 个生成事件函数、`recognize-board` 与 `recognize-draw-tickets` 两个独立模型函数和 4 个维护触发器。V1 不创建公共集合、公共地图接口或版面／赏票长期图片资产目录；`profile-avatars/` 是唯一正式长期图片前缀。生产 Storage 已启用 `CUSTOM` 客户端规则：头像仅 owner 可读写，`recognition-temp/` 对客户端禁止读取且仅 owner 可写，其他前缀拒绝；控制台和服务端不受客户端规则约束。版面图片与赏票图片只允许短暂进入 `recognition-temp/` 并由正常链路清理；赏票从提交起建立 50 分钟 cleanup job，终态同步删除失败时由既有每 10 分钟／每日 maintenance 补偿，不保留长期文件引用。COS lifecycle `ichi-v1-recognition-temp-expire-24h` 已配置并读回 Prefix `recognition-temp/`、Expiration `1` 天，闭合服务端登记前崩溃孤儿对象窗口且不影响头像。图片正文不得写入日志、审计或备份。当前共 19 个函数；`recognize-board` 与 `recognize-draw-tickets` 已在线核验为 Nodejs20.19 `Active/Available` 并绑定依赖层 v1，临时 `verify-prize-tickets` 函数已在统一入口 smoke 通过后删除。`recognize-draw-tickets` 的生产 `PRIZE_TICKET_LOCATION_RADIUS_METERS` 固定为已批准的 `200` 米，缺失或非法时服务端保持 `LOCATION_PENDING`。
