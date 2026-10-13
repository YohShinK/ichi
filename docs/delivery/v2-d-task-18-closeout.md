# TASK-V2-18／V2-D 收口与 V2-E 认知对齐

日期：2026-09-25。Founder 先确认压力测试结果与性能预算工作完成，随后明确指示“现在对 V2-18 进行收口”。据此将 TASK-V2-18 的人工门记为 `COMPLETE / HUMAN_APPROVED`，V2-D 全部任务完成并收口。该批准接受下表的证据边界，不把未采集的设备数值或生产账单写成通过。

| 范围 | 收口事实 | 后续验证 |
| --- | --- | --- |
| 容量与展示 | 500 条 lead 是预算容量；Worst 500 强制 individual 只用于历史压力实验。正式地图仍按真实坐标和屏幕碰撞聚合，不增加 100／500 个可见 Marker 硬截断。 | TASK-V2-20 在正常产品聚合路径做设备矩阵；如需重测强制 500 individual，单独制作一次性诊断构建，不回填正式包。 |
| 本地预算 | 50 条／页、500 条快照、120 秒 TTL；响应体、本地 root/page、聚合/split、2 MiB 源码门与条件成本估算的现有回归均在已定义预算内，原始数值见性能预算与基准报告。 | TASK-V2-19／21 复核真实 index、传输、网络、账单和成本停止门。 |
| 真机体验 | Founder 接受 Worst 500 的多次完整交互和本次压力测试；一次极轻微闪动作为观察保留。唯一收到的原始 JSON 是 Dense 500：500 条载入、最终 2 cluster／0 individual、首次稳定代理 2,039 ms、PNG 失败 0。 | TASK-V2-20 复核低端 iOS／Android、FPS／帧间隔、Native/GPU 内存、临时 PNG 磁盘和持续稳定性。Worst 真机逐档 JSON 缺失，不标记其数值 binding／latency 通过。 |
| 工具收尾 | develop 长按入口、面板、合成服务注入和强制 individual override 已移出小程序包；离线 fixture／回归、报告及原始结果留在仓库。清理后的微信预览包 995,146 bytes，源码审计 1,291,586 bytes。 | 下一预览使用清理后的构建；历史压力二维码仍指向旧构建。 |

V2-D 的区块回归已完成：TypeScript、ESLint、Vitest 86 文件／934 测试、Next production build、Web Playwright 26/26、微信 CLI preview、workflow、包体审计与 `git diff --check` 通过。清理后的新版真机视觉未重新采集；本次不据此宣称新的设备视觉验收。

收口文档与本轮触及文件的 Prettier 检查通过。全仓 `corepack pnpm quality` 在首项 `format:check` 停止，原因是 43 个既有历史产物／配置文件（如 `artifacts/canvas-marker/`、`exports/`、`project.config.json`）不符合格式；本轮新生成的预览信息已单独格式化。质量命令的其余分项已分别运行：Lint、双 TypeScript、全量 Vitest 与全部合同／workflow 校验均通过。未批量改写无关历史产物。

## V2-E 整组认知对齐

- TASK-V2-19：继续执行 layered integration、security、resource/index 与 migration rehearsal。500 快照／50 分页／120 秒和批准的本地预算是输入；真实 index、延迟、响应体、durable rate/read-stop、avatar、secret、rollback 仍需候选环境证据。资源／迁移／回滚计划及任何候选部署仍受独立授权门约束。
- TASK-V2-20：将尚无量化证据的帧间隔、低端设备、内存、PNG 磁盘和一次闪动纳入正常产品聚合路径的真机矩阵。历史 Worst 500 是压力容量证据，不替代产品路径；专门复测强制 individual 时只能用独立一次性诊断构建。
- TASK-V2-21：在封闭试验中复核真实请求、索引读量、响应体、网络延迟、月变量成本与 ≤¥20 运营目标，不把本地 ¥11.02 估算当账单。
- TASK-V2-22：维持实际部署、迁移、微信审核／发布、Git merge 和 tag 的独立授权与 release gate；本次收口不批准这些外部动作。

上述是既有任务的证据位置与测试方式澄清，不改变产品范围、平台、隐私、核心架构或区块顺序。V2-E 可整组解锁为 `READY / NOT_STARTED`，19→20→21→22 的输入依赖仍须满足后才能进入相应验收。没有自动开始 V2-E 实施，也没有 deploy、migration、commit 或 push。
