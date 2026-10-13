# TASK-V2-22 Phase1-D2｜First CREATE rejection blocker

`STOP_PARTIAL_DEPLOY / FIRST_CREATE_REJECTED / NOT_DEPLOYED`；partial deploy=false / production functions0/9。D2的secret授权已获得，不再是旧secret approval blocker。

首个 `query-public-map-leads` CREATE 在 2026-10-03T00:43:05+08:00 被拒绝：`MissingParameter`，RequestId `ed7e1ff4-fcac-4cc3-8937-c2e0605188d4`。外部write attempts1、accepted0、CREATE retry0，后8函数未尝试；9targets完整postflight仍ABSENT，bindings0/20、source9NOT_RUN、smoke9NOT_CALLED。错误message为避免请求内容泄漏没有保存，因此缺失字段尚未确证；不得把SDK/公开API参数差异候选写成已证明root cause。

命令第12节规定部署/binding失败立即STOP、不继续、不删、不重新生成或换值重试；写前参数修正例外不适用于已发起本次CREATE。故没有第二次CREATE或config更新。

两把32-byte高熵新key各只在进程内存生成一次；尚未绑定，值/可复用编码/真实key摘要没有保存。旧IDENTITY_HMAC_KEY及13V1consumer未修改，Founder原风险接受/轮换豁免继续有效。secret scan全范围PASS：`SECRET_VALUE_PERSISTED_IN_PROJECT_FILES=0`。

production14collections/23explicit indexes/14ADMINONLY/13Count0/control4原样/epoch1/read-stoptrue/featuresfalse/haPausedtrue/PUBLIC0；V1 structural diff0，shadowread-stoptrue/HApausedtrue/epoch41/PUBLIC0/flagsfalse/callers空，Storage/rules不变。无business/control/identity写入，无清理/启用/Phase2动作。

下一最小决策：审阅拒绝回执并确认参数修复依据后，是否另行授权一个新的单次CREATE；当前不重试。整体TASK22仍IN_PROGRESS / PHASE_1_PRODUCTION_BACKEND_CONVERGENCE_IMPLEMENTED / LOCAL_GATES_PASS / EXTERNAL_ACTION_APPROVAL_REQUIRED，Phase2LOCKED。

完整独立报告：[v2-e-task-22-phase1d2-secret-bindings-and-production-functions-deploy-readback.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1d2-secret-bindings-and-production-functions-deploy-readback.md>)。安全回执：[execution.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d2/execution.json>)；postflight：[postflight.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d2/postflight.json>)。
