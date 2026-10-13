# TASK-V2-18 真机 Marker 压力测试｜Founder 操作清单

**测试版本**：`TASK18-STRESS-2026-09-24-1`。使用同一张 [预览二维码](../../artifacts/task18/true-device-marker-stress/preview-qr.jpg) 完成全部档位。请先用手上的 iPhone；Android 可随后补测。此预览只用于压力实验，不是真实地图数据。

## 开始前

1. 用微信扫描二维码，进入「好版地图」。**长按左上角 ICHI 字样**打开测试面板。正式 release 环境不会打开该面板。
2. 在面板选择 `Worst` 或 `Dense`，再选 `100`、`300` 或 `500`。
3. 记下设备型号、iOS/Android 版本、微信版本和基础库版本；JSON 会自动附带可读取的设备信息，请同时在人工备注里写明不能自动读到的版本。

## 每档固定流程

1. 点 **RESET / COLD RELOAD**。页面重进后面板保留本档选择，当前统计清零。此操作只重建页面和页面缓存，结果标为 `COLD_LIKE`；微信进程和临时 PNG 文件并未真正清空。
2. 点 **START MEASURE**，紧接着点 **LOAD CASE**。等页面数字稳定后静置 5 秒。确认面板的 `lead` 为目标数；Worst 的 `individual` 应为目标数、`cluster` 应为 0。若不符，记录异常并继续导出，不要猜测它已经通过。
3. 点 **Pan**，在地图上左右、上下交替明显平移，共 10 次。
4. 点 **Slow Zoom**，慢速放大到高档，再慢速缩回；观察 Dense 的 split/merge。
5. 点 **Fast Pinch**，快速缩放 5 次，包含反向动作。
6. 点 **Pan+Zoom**，交替平移与缩放 5 轮。
7. 点 **Tap**，点击至少 10 个可辨认的 Marker，测试详情打开、A→B 快切；Dense 的 cluster 和选择列表也要点。拖动 Marker 所在区域，观察是否误开详情。Worst 高密度信息卡会重叠，无法辨认时如实记在备注里。
8. 点 **Idle 10s**，静置 10 秒；在备注栏写下掉帧、晚出现、闪白、ghost/重复、迟钝、短暂失响应、崩溃或白屏等观察。点 **END MEASURE**。结果立即保存到本机并尝试复制到剪贴板；也会以 `TASK_V2_18_MARKER_STRESS_RESULT` 打到调试 console。
9. 点 **EXPORT / COPY RESULT** 可再次复制本会话保存的最多 8 档 JSON。把文本粘贴给 Codex/ChatGPT 审核；如果单档崩溃，前面已点 END 的档位仍在本机保存。

## 顺序

先做六个独立冷重载：Worst 100 → 300 → 500，再 Dense 100 → 300 → 500。每档都按上面的 RESET 开始。然后各做一条连续 warm 序列：Worst 100 → 300 → 500、Dense 100 → 300 → 500；warm 序列内**不点 RESET**，每档仍重新点 START、LOAD、END。由于本机只保留最近 8 档，完成六个 cold 后先复制一次 JSON，再做 warm。

如果 `insideViewportCount` 小于请求数，说明有点不在实际设备视口；请把这一项和截图一起交回。面板 `individual` 是实际原生 binding 数，不能用总 lead 数替代。内存、FPS、GPU 和 PNG 磁盘若开发者工具无法可靠读取，保留 JSON 中的 `NOT_MEASURABLE_ON_CURRENT_TOOLING`，另附可获得的性能面板截图。
