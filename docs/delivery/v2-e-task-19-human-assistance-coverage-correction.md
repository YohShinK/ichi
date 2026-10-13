# TASK-V2-19｜Human Assistance coverage correction

日期：2026-09-25。状态：`LOCAL_IMPLEMENTATION / TASK_V2_19_EXTERNAL_ACTION_APPROVAL_REQUIRED`。
本文件记录本地前端／客户端候选接线和测试，不代表 CloudBase 创建、部署、配置或数据写入授权。

2026-09-26 状态补记：Founder 授权的 Phase B1 shadow resources 已创建并完成只读回读，详见 `v2-e-task-19-shadow-resource-diff.md` 第 9 节。本文件的两处前端入口仍连接 disabled service，未接入真实 CloudBase、未写 synthetic data、未做 Human Assistance rehearsal；下方 2026-09-25 的“没有创建／部署”陈述仅指本地 coverage correction 阶段。当前停止码为 `TASK_V2_19_SHADOW_PROVISIONING_READBACK_REQUIRED`。

## 覆盖范围

本轮 correction 同时覆盖两个前端入口：

1. **上传成功态**：仅当本地候选 service 返回当前 synthetic upload 对应的有效 request 时，上传完成态显示 Human Assistance 入口；用户可打开比较并选择回答或跳过。
2. **「我的 → 我上传的版面」**：进入／刷新上传列表时按可信 owner 查询当前仍有效的 request，显示入口并复用同一回答流程。

回答集合固定为 `SAME_BOARD`、`DIFFERENT_BOARD`、`CANNOT_TELL`、`SKIP`。没有 request 时不显示；`expired`、`answered`、`withdrawn` 或 submission version 已变化的 request 在刷新和回答前均安全消失。record withdraw/delete 会立即从本地状态移除。

重复提交按 `requestId + submissionVersion + answer` 形成 action id，并由客户端 busy guard 保证同一 request 只有一次进行中的提交；完成后移除 request。列表失败、回答失败或跳过只显示不可用／提示状态，不回滚或阻断 V1 upload success。

## 本地实现

- `apps/client/miniprogram/platform/human-assistance-client.ts`：owner request 过滤、版本／过期裁剪、竞态刷新、重复提交幂等和 fail-closed service。
- `apps/client/miniprogram/pages/home/index.ts`、`index.wxml`、`index.wxss`：上传成功态与「我的」入口、四类回答、失败提示和关闭返回。
- `disabledHumanAssistanceService` 默认返回空列表／失败，当前不访问 CloudBase；真实 shadow transport 仍需单独授权。

## 自动验证

- `apps/client/miniprogram/platform/human-assistance-client.test.ts`：过期／已答／撤回／版本变化、无 request、四种回答、重复提交、失败不影响上传状态。
- `apps/client/miniprogram/pages/home/index.behavior.test.ts`：上传成功态入口、失败／跳过提示、「我的 → 我上传的版面」入口和回答后移除。
- 本轮定向结果：**2 个测试文件，92 项通过**（含已有页面行为回归）。

## CloudBase 边界

本轮没有连接真实 shadow CloudBase，没有创建 collection／index，没有部署 function，没有写 config／secret，没有写 synthetic data，也没有执行 migration rehearsal 或 rollback mutation。六个候选 artifact 仍由缺失／false feature flags fail closed；三个 HMAC secret 只保留生成／绑定／校验状态，不回显值。HA cooldown/budget 仍为 `CANDIDATE_TEST_ONLY / PILOT_CALIBRATION_REQUIRED`，未冻结产品参数。

`TASK-V2-19 = IN_PROGRESS`；当前停止码：`TASK_V2_19_EXTERNAL_ACTION_APPROVAL_REQUIRED`。
