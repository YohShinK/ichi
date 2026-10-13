# TASK22 Phase1-D｜Secret Binding Approval Blocker

`STOP_SECRET_BINDING_APPROVAL_REQUIRED / STOP_BEFORE_FIRST_DEPLOY`；0/9 functions DEPLOYED，0 code upload/config mutation/secret binding，0 cloud invokes，0 business writes，0 external write calls，partial deploy=false，create retries=0。

授权来源为Phase1-D总命令第2节和第6节D，缺required新production-only secret必须部署前STOP。不是artifact/config/resource异常，不是partial deploy。

- ICHI_V2_ACCOUNT_AUTHORITY_HMAC_KEY：28个既有function binding均MISSING；9/9 production函数required；NEW_CREATION/BINDING_NOT_AUTHORIZED。
- ICHI_V2_CURSOR_HMAC_KEY：既有binding均MISSING；query/detail两个函数required；NEW_CREATION/BINDING_NOT_AUTHORIZED。
- IDENTITY_HMAC_KEY：13个V1consumer中PRESENT，9个production target均ABSENT/NOT_BOUND；不轮换、不复制值，本轮未扩大consumer。

技术上的disabled-only代码部署不需要这些key才能返回SERVICE_UNAVAILABLE，但当前命令仍要求缺key先STOP；不能自行采用omit-secret例外。详见完整报告中的两种下一最小Founder决策及20个逻辑binding的精确目标。

[v2-e-task-22-phase1d-production-functions-deploy-readback.md](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1d-production-functions-deploy-readback.md>)

[secret-binding-blocker.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d/secret-binding-blocker.json>)
