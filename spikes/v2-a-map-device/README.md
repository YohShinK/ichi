# ICHI TASK-V2-03 Independent Map Device Spike

## 状态

- `RUNNABLE_MAP_SPIKE_EXISTS = YES`
- `SPIKE_EXECUTION_MODE = INDEPENDENT_WECHAT_TEST_PROJECT`
- `TEST_ACCOUNT_RESTORED = YES`
- `WECHAT_SIMULATOR_INITIAL_RENDER_VERIFIED = YES`
- `WECHAT_SIMULATOR_INTERACTION_MATRIX_COMPLETE = NO`
- `IOS_TRUE_DEVICE_EVIDENCE = PASS / HUMAN_APPROVED`
- `ANDROID_TRUE_DEVICE_EVIDENCE = PASS / HUMAN_APPROVED`
- `TENCENT_LOCATION_SERVICE_CONSOLE = PASS / HUMAN_APPROVED`
- `TRUE_DEVICE_EVIDENCE_COMPLETE = YES`
- `PRODUCTION_CONNECTIONS = 0`
- `V2_IMPLEMENTATION_STARTED = NO`

这是 TASK-V2-03 的完全独立、可删除微信小程序验证工程。测试号已恢复，因此无需把验证页放入 ICHI V1 小程序包体。工程拥有独立 `miniprogramRoot`，不引用 `apps/client/miniprogram`，不调用 CloudBase、数据库、Storage、私有集合或生产 API，也不包含真实位置 fixture。

## 已实现验证面

- 微信原生 `<map>`；
- 上海 30 个 `SYNTHETIC_ONLY` markers；
- 手势和按钮 pan/zoom、`regionchange` viewport；
- marker updated/tap 日志；
- `wx.authorize + wx.getLocation(type=gcj02)` 的允许／拒绝／设置恢复；
- 定位失败后的手选上海与列表 fallback；
- Page `onHide/onShow` 的页面内存快照恢复和在途 generation 失效；
- 正常、2.6 秒弱网和断网 mock 模式；
- mock 数据加载错误；
- 慢响应／快响应倒序与 stale response 丢弃；
- viewport、marker 数量、权限、generation、discard 和 lifecycle 可见日志。

所有“请求”都是页面内的定时 mock；系统网络状态只作诊断显示，不触发网络访问。页面不读写本机或云端 Storage。

## 导入微信开发者工具

1. 打开微信开发者工具，选择“导入项目”。
2. 项目目录选择：`/Users/cunfu/Documents/ichi 2/spikes/v2-a-map-device`。
3. 使用已恢复的测试号。`project.config.json` 已由开发者工具写入该测试项目配置；不要替换成 V1 正式 AppID，也不要提交 AppID、key 或私有配置。
4. 只使用“编译”“预览”“真机调试”；真机调试会传输临时调试包，但不要点击版本“上传”，不要发布或部署。
5. 编译后首页应显示原生地图、`Markers 30 / 30`、状态卡、列表与诊断日志。

本轮已在微信开发者工具 RC 2.02.2607271／基础库 3.17.2 打开成功并观察到：腾讯地图底图、`30 / 30` markers、`scale=11`、有效 viewport、`generation=1`、`discarded=0`、`READY` 和 `map updated=1`；开发者工具 Problems 为 0。首次模拟器检查发现 map update/regionchange 日志回写造成 generation 循环，现已加入单次 updated 日志、仅手势触发 viewport reload 与 programmatic transition guard，关闭并重开后稳定。其余模拟器交互和真机矩阵仍按清单执行。

模拟器截图还确认 SVG marker 没有实际渲染；现已改为独立随包 `44×52 RGBA PNG`。validator 检查 PNG signature，关闭／重开工程后已视觉确认全部 30 个 marker 可见。

## 自动验证

在仓库根目录运行：

```bash
node spikes/v2-a-map-device/validate-spike.mjs
```

校验覆盖：独立文件完整性、测试 AppID 与 V1 AppID 分离、30 个上海合成点、显式 synthetic 标签、零 Storage／CloudBase／请求／私有集合代码，以及关键 map/权限/fallback/generation handler。

校验器同时限制 `scope.userLocation` 用途说明不超过微信的 30 字符上传门。当前说明为“用于地图真机验证，不保存或上传位置”（17 字符）。

## 真机证据

2026-09-11 用户按 `docs/research/v2-a/v2-map-device-true-device-checklist.md` 确认 iOS、Android 与腾讯位置服务控制台整体人工验收 PASS。设备型号、系统／微信版本和逐项截图未在对话中提供，因此证据文档保留 `NOT_RECORDED`，不伪造元数据。

## 清理

整个 `spikes/v2-a-map-device/` 可删除。它没有云端资源、数据库记录或 Storage 对象需要清理；`project.private.config.json` 是开发者工具生成并被 Git 忽略的本机配置。
