# TASK22 保留微信模糊定位

日期：2026-10-04。用户明确选择“希望保留模糊定位，不要求开启精确位置”。本项在 V2-E/TASK22 活动区块内，现行约束为 CURRENT_LOCATION_APPROXIMATE_ALLOWED_V1。

此决定取代前轮个人地图浏览要求 accuracy≤100 米、模糊权限阻断和引导开启精确位置的行为。前轮坐标检查、同结果蓝点/相机、前台刷新、生命周期取消、公开数量隔离和筛选同步继续有效。前轮报告和截图仅保留为历史证据。

## 当前行为

- 微信允许模糊定位时，继续请求并使用其允许提供的位置，不请求或引导升级系统精确权限。
- 合法 GCJ02 坐标可用于本人浏览。模糊权限、accuracy>100 米或未知精度均进入 APPROXIMATE，显示“当前位置为大致位置，可能与实际位置有偏差”。100 米仅用于区分显示说明，不是个人定位准入门。
- 有效正数 accuracy 绘制对应半径的淡蓝色误差圆。缺失、零、负数或无效 accuracy 记为未知，不伪造半径，也不把它当成精确位置。
- 个人点与相机使用同一回执，不向历史 marker 吸附。模糊定位可能离实际地点较远，不能在保留系统模糊权限的同时承诺手机精确坐标。
- 大致位置说明独立于查询、筛选和网络状态；无匹配线索时也不会被另一条提示遮住。
- 个人点和误差圆不计入公开 marker 数量，不参与聚合或详情。前台每分钟只更新本人位置，后台/离开/卸载清点、清圆、取消刷新和迟到回执，不持久化个人定位。
- wx.getLocation 仍尝试当前权限允许的最佳 GCJ02 回执；高精度请求参数不会在代码中更改用户的系统权限。非法坐标、真实权限拒绝、API 失败和超时仍进入原有不可用处理。

这项变更针对个人地图浏览。原上传安全审核、分享合同、公开位置 0.001° 网格和 V1→V2 准入精度规则保持现行状态；没有放宽真实记录的公开准入，也没有生产部署、迁移或数据重写。

## 验证与证据

针对测试 145 PASS；现行源码及测试夹具 1208 PASS、失败 0，类型检查、Lint、Next.js 构建与官方微信预览通过。测试入口显式包含 apps/packages/services/scripts/tests，避免将 artifacts 内历史源码快照当作当前测试；一次默认发现误纳入的旧 markers 断言失败已保留在诊断日志，未改写历史快照。

单元/页面测试覆盖：模糊权限仍调用定位并显示个人点；1800 米回执可用且圆半径一致；未知精度可用但无伪造圆；精确回执无误差圆；非法坐标、权限错误、超时；后台迟到回执和定时器清理；点、公开计数及筛选投影隔离。

清理原生编译缓存并重新加载后，原生隔离验证使用真实生产公开 marker（LOADED=1）与模拟定位回执，分别检查粗定位、精确回执、iOS 模糊权限、未知精度、后台迟到响应及恢复。详见 `artifacts/task22/phase2-approximate-location-20261004/native-location-qa.json`。它验证产品行为，不证明手机现场定位精度。旧页面缓存下尝试沿用筛选运输脚本的等待条件未稳定收口；清理编译缓存后最终定位与截图均通过。本项现行筛选回归包含在1208项测试中，旧等待诊断不作为当前失败结论。

最终状态、包体、源码摘要、恢复结果及门禁见同目录 `final-validation.json`。测试恢复后没有隔离 API、个人点或误差圆遗留，真实本人云端记录仍 1 条；生产记录写入 0。

- [模糊定位与误差圆截图](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase2-approximate-location-20261004/screenshots/isolated-ios-approximate-permission-allowed.png>)
- [普通粗定位截图](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase2-approximate-location-20261004/screenshots/isolated-approximate-location.png>)
- [新版预览二维码](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase2-approximate-location-20261004/native-preview-qr.png>)

修复进入正式开发工作区及新版预览，尚未正式发布。状态 LOCAL_IMPLEMENTED / NATIVE_ISOLATED_VERIFIED / AWAITING_REVIEW；V2-E/TASK22 整体仍 IN_PROGRESS。AGENTS、README、PRD 与五份 memory-bank 当前入口已同步，不得依据旧报告恢复精确权限硬门。
