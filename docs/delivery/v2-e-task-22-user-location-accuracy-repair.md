# TASK22 当前位置偏移排查与修复

> 现行覆盖：用户后续明确保留微信模糊定位。本文个人定位≤100米硬门、模糊权限阻断及开启精确位置提示已由 CURRENT_LOCATION_APPROXIMATE_ALLOWED_V1 取代；当前行为见 `docs/delivery/v2-e-task-22-approximate-location-support.md`。本文仅用于追溯前轮排查与证据，不得恢复已被取代的权限要求。

日期：2026-10-04。活动区块：V2-E / TASK22，整体仍 IN_PROGRESS。本项状态：LOCAL_IMPLEMENTED / NATIVE_ISOLATED_VERIFIED / AWAITING_REVIEW。修复已进入正式开发工作区与当前微信官方预览包，尚未正式发布。

## 已证实的原因与排查边界

原地图定位和上传定位均只请求 GCJ02，没有启用高精度。地图定位收到成功回执后丢弃 accuracy，未检查误差或 iOS 模糊位置权限；同时，地图开启独立 show-location，蓝点来自原生组件自己的定位结果，页面另用 wx.getLocation 的结果移动相机。蓝点与相机没有统一到同一份经过检查的位置，粗定位也会被视为成功。

相机中心与 show-location 是不同的地图能力，见 [腾讯地图小程序官方组件指南](https://github.com/TencentLBS/tencentmap-miniprogram-skill/blob/main/references/map_component_guide.md)。本地微信 API 类型也提供 isHighAccuracy、highAccuracyExpireTime 和 locationReducedAccuracy。

只读核对真实 CUFZBP：上传坐标系为 GCJ02，定位 accuracy 为 12.587 米；原上传坐标到公开 0.001° 网格坐标的距离为 32 米。当前 GCJ02 请求与公开坐标路径一致，这个网格偏移无法解释截图中远距离的个人蓝点偏移。没有修改真实上传或公开数据，也没有保存原始坐标。

上述代码缺口已经证实并修复。截图没有设备原始定位回执，无法据此确定该次物理偏移究竟来自模糊权限、低精度定位、设备环境或其他系统因素。已询问截图来自手机还是模拟器，暂未收到回答。Agent 本地验证环境为微信开发者工具；不得把这个环境当作用户截图的设备环境。

## 当前实现

- 上传和地图定位均明确请求 GCJ02 高精度，等待高精度结果 8 秒；地图请求另设 12 秒客户端超时。
- 地图只接受合法有限坐标，以及有限、正数、≤100 米的 accuracy。低精度、缺失精度或无效回执不会画出个人点，已有公开 marker 和浏览相机保持可用。
- iOS 模糊位置权限显示“微信仅允许模糊定位，请在系统设置中开启精确位置”；低精度回执显示重新定位提示。
- 关闭独立 show-location，以同一份已检查结果绘制个人蓝点和定位按钮的相机中心。个人点不会吸附到历史 marker。
- 个人点使用独立 ID 2000000001、24px 居中图标；公开 lead 数量、聚合、筛选、详情与公开 DTO 均不包含个人点。
- 定位后仅在前台地图每 60 秒刷新个人点，不移动用户正在浏览的相机。离开地图、进入后台或卸载页面时取消刷新，使迟到回执失效并清除个人点；浏览相机快照仍保留。当前个人定位不写入本地 storage 或服务器。
- 上传仅增强既有定位请求，没有新增 V1 位置比对审核；原备注安全门、上传分享确认、条例、V1→V2 门与 production continuous bridge 保持现行合同。

原生验证同时发现筛选仅更新页面数据而未立即更新原生标记；已补上原生重绘与筛选后稳定缓存更新。明确筛选为零条时，刷新期间的“保留旧标记”保护不再误留已被筛掉的 marker。网络刷新暂时为空时，原有防闪烁保护仍保留。

主要职责：`platform/public-map-location.ts` 封装位置请求和个人点绑定；`pages/home/index.ts` 管理权限、位置生命周期、原生展示数组和筛选接点；WXML 使用 `mapNativeDisplayMarkers`，公开投影仍使用 lead-only `mapNativeMarkers`。新增蓝点 SVG/PNG 与单元、页面行为回归。

## 验证

| 验证 | 结果 |
| --- | --- |
| 完整自动测试 | 1175/1175 PASS，失败 0 |
| 类型检查、Lint、Next.js 构建 | PASS |
| 当前微信官方预览 | PASS，包体 1,029,137 字节 |
| 真实公开 marker | 1 条，读取真实生产服务 |
| 隔离低精度 1800 米回执 | LOW_ACCURACY，无个人点，原公开 marker 不变 |
| 隔离精确 18 米回执 | READY，蓝点与相机均严格匹配该回执；公开 marker 1、个人点 1 |
| 筛选关闭 / 恢复 | 公开数量与原生 lead 均 0 / 1，个人点始终 1 |
| iOS 模糊权限 | 明确提示，无个人点，无额外定位请求 |
| 后台迟到响应 | 不恢复个人点 |
| 测试恢复 | 定位 API 恢复，隔离 fixture 移除，个人点清除，真实云端记录仍 1 |
| 生产写入 | 0；无部署、迁移、上传、接受条例或举报操作 |

单元测试另覆盖每分钟前台刷新不重新居中、隐藏取消定时器、无效精度/坐标、权限/API 错误、超时、个人点独立绑定，以及明确筛空与暂时为空的不同处理。当前客户端修改已通过必要原生平台适配验证；Next.js 构建在没有网页源码后续变化的情况下沿用本轮通过结果。

证据目录：`artifacts/task22/phase2-user-location-20261004/`。最终汇总为 `final-validation.json`；真实坐标只读摘要为 `upload-projection-readonly.json`；原生验证为 `native-location-qa.json`；完整测试为 `full-tests-final.json`。原始个人设备精确坐标未留存。

## 截图与预览

以下截图来自微信原生开发者工具：公开 marker 为真实生产数据，当前定位回执为隔离测试样本。它们证明显示逻辑和拒绝策略，不是手机现场 GPS 准确性的证据。

- [精确位置与真实公开 marker](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase2-user-location-20261004/screenshots/isolated-precise-location-and-marker.png>)
- [低精度定位提示](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase2-user-location-20261004/screenshots/isolated-coarse-location-rejected.png>)
- [iOS 模糊权限提示](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase2-user-location-20261004/screenshots/isolated-ios-precise-permission.png>)
- [当前微信预览二维码](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase2-user-location-20261004/native-preview-qr.png>)

现场确认方式：在原地点用当前预览进入地图，点击定位。精确权限开启且回执误差≤100米时显示个人点；若仍收到粗定位，页面会提示重试。公开 marker 有约100米网格处理，也代表历史上传地点，不要求其与当前个人点完全重合。手机现场结果仍待用户确认，正式发布门未执行。

AGENTS、README、PRD 与五份 memory-bank 当前入口已同步此定位约束，防止后续恢复未检查精度的独立蓝点。当前地图分享合同保持不变。
