# TASK22 Phase1-D4｜首函数部署阻断

当前官方Manager5.9.0 functions.createFunction调用的首函数query-public-map-leads被拒绝；TCB外层FailedOperation，内层MissingParameter明确指出EipConfig。完整脱敏错误与内外RequestId见独立执行报告及execution.json。

已按Founder指令STOP；其余8个NOT_RUN，无补参重试或覆盖/删除。全9目标ABSENT；函数0/9、bindings0/20、源码回查/disabled smoke NOT_RUN。生产业务数据0、PUBLIC0、controls4完整不变、V1 structural diff0、shadow停机不变；失败1/重试0。

D2/D3字段追踪CLOSED_BY_FOUNDER / EXACT_FIELDS_UNRECOVERABLE。本报告只确证D4的当前拒绝字段，不回填旧请求结论。EipConfig的下一候选参数结构与新CREATE均需后续明确授权，本轮不修改frozen ZIP/source/config/secret合同。Phase2 LOCKED。

详见 [独立执行报告](</Users/cunfu/Documents/ichi 2/docs/delivery/v2-e-task-22-phase1d4-official-manager-deploy-readback.md>)。
