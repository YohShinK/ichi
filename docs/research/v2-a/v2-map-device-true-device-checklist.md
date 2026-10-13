# TASK-V2-03 True-device Evidence Checklist

> 当前状态：`PASS / HUMAN_APPROVED`
>
> Spike：独立测试号工程 `spikes/v2-a-map-device/`
>
> 启动页：`pages/map/index`
>
> 禁止把账号、AppID、key、精确个人位置或控制台密钥写入本文件。

## Simulator precheck（2026-09-11）

| Check | Result | Evidence |
| --- | --- | --- |
| 独立测试号项目打开 | PASS | 微信开发者工具 RC 2.02.2607271，基础库 3.17.2 |
| 原生 `<map>` 与腾讯底图 | PASS | 页面 `pages/map/index` 可见地图与版权标识 |
| 30 个 synthetic markers | PASS | `Markers 30 / 30`，load state=`READY` |
| viewport / generation 稳定 | PASS | 有效 SW/NE；重开后 `generation=1`、`discarded=0`、`map updated=1` |
| Problems | PASS | 0 error / 0 problem；仅开发者工具自身 preload warning |
| 真机调试上传配置门 | PASS | `scope.userLocation.desc` 由 32 字符缩短至 17 字符；validator 固定 30 字符上限 |
| 完整交互矩阵 | PENDING | pan/zoom、权限、前后台、weak/offline/error/race/fallback 仍按下表执行 |

首次模拟器观察暴露 map update/regionchange 日志回写循环；加入 updated 单次日志、gesture-only reload 和 programmatic transition guard 后，关闭并重开工程复验稳定。该 precheck 不替代 iOS/Android 真机证据。

首次自动真机调试在临时调试包上传阶段返回微信错误码 `80058`：`scope.userLocation.desc` 为 32 字符，超过平台 30 字符限制。说明已缩短为 17 字符并加入静态回归门；未记录 AppID、OpenID 或个人位置。

## 设备信息

| Field                     | iOS     | Android |
| ------------------------- | ------- | ------- |
| 机型                      | NOT_RECORDED | NOT_RECORDED |
| 系统版本                  | NOT_RECORDED | NOT_RECORDED |
| 微信版本                  | NOT_RECORDED | NOT_RECORDED |
| 基础库版本                | NOT_RECORDED | NOT_RECORDED |
| 测试时间（Asia/Shanghai） | 2026-09-11 | 2026-09-11 |
| Tester                    | USER / HUMAN_ACCEPTANCE | USER / HUMAN_ACCEPTANCE |

## 地图与生命周期

| Case                         | iOS     | Android | 必要证据                                       |
| ---------------------------- | ------- | ------- | ---------------------------------------------- |
| 冷启动显示原生 `<map>`       | PASS | PASS | 用户整体人工验收确认                           |
| 初始 30 个 synthetic markers | PASS | PASS | 用户整体人工验收确认                           |
| marker 点击                  | PASS | PASS | 用户整体人工验收确认                           |
| 手势 pan                     | PASS | PASS | 用户整体人工验收确认                           |
| 手势／按钮 zoom              | PASS | PASS | 用户整体人工验收确认                           |
| 前后台恢复                   | PASS | PASS | 用户整体人工验收确认                           |

## 权限与 fallback

| Case           | iOS     | Android | 必要证据                                           |
| -------------- | ------- | ------- | -------------------------------------------------- |
| 定位允许       | PASS | PASS | 用户整体人工验收确认；未记录个人坐标                |
| 定位拒绝       | PASS | PASS | 用户整体人工验收确认                               |
| 拒绝后打开设置 | PASS | PASS | 用户整体人工验收确认                               |
| 手选上海       | PASS | PASS | 用户整体人工验收确认                               |
| 列表 fallback  | PASS | PASS | 用户整体人工验收确认                               |

## 弱网、错误与并发

| Case             | iOS     | Android | 必要证据                              |
| ---------------- | ------- | ------- | ------------------------------------- |
| 弱网 mock        | PASS | PASS | 用户整体人工验收确认 |
| 断网 mock        | PASS | PASS | 用户整体人工验收确认 |
| 数据加载错误     | PASS | PASS | 用户整体人工验收确认 |
| response 丢弃    | PASS | PASS | 用户整体人工验收确认 |
| 后台失效在途响应 | PASS | PASS | 用户整体人工验收确认 |

## 腾讯位置服务控制台（独立证据）

| Check                      | Result  | Evidence reference |
| -------------------------- | ------- | ------------------ |
| 测试 key 类目／API 权限    | PASS | 用户确认控制台可以加载 key 等 |
| 小程序 AppID／域名绑定要求 | PASS | 用户整体人工验收确认          |
| 日／月配额                 | PASS | 用户整体人工验收确认          |
| 商业使用许可与成本         | PASS | 用户整体人工验收确认          |
| POI／逆地址坐标系          | PASS | 用户整体人工验收确认          |

## 结论

- iOS：`PASS / HUMAN_APPROVED`
- Android：`PASS / HUMAN_APPROVED`
- 腾讯位置服务控制台：`PASS / HUMAN_APPROVED`
- TASK-V2-03 external evidence：`COMPLETE`
- V2-B unlock：`NO`

本轮通过依据是用户的整体人工验收确认；未提供的设备型号、系统／微信版本和逐项截图保持 `NOT_RECORDED`，不伪造细节，也不回退人工 PASS。
