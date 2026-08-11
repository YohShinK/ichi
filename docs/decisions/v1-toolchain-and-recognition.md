# V1 工具链、CloudBase 与识别服务决策

> 状态：APPROVED
>
> 日期：2026-08-05
>
> 机器可读基线：`data/toolchain-baseline/versions.json`

## 锁定组合

V1-A 使用 Node.js 24.11、pnpm 11.9.0、TypeScript 6.0.3、Vitest 4.1.10、ESLint 10.8.0、Prettier 3.9.6 和 typescript-eslint 8.66.0。pnpm 11.9.0 是本机已安装并用于生成锁文件的验证版本；TypeScript 不采用当日最新 7.0.2，因为当前 typescript-eslint 8.66.0 的官方 peer 范围为 `<6.1.0`，6.0.3 是可安装且仍在该兼容范围内的最新 6.0 版本。

微信小程序基础库锁定 3.17.0，开发者工具已在 2.02.2607271 验证。工程绑定用户提供的小程序 AppID；AppSecret 不进入仓库、客户端或开发者工具项目配置，只能在确有服务端调用需求时通过受控环境变量提供。

CloudBase 普通云函数运行时锁定 `Nodejs24.11`，入口保持 CommonJS。V1 云端仍只允许 `recognize-board` 识别代理，不接入真实账号、数据库或会话同步；V1 网页可先搭建账号与贡献 UI 框架，V2 再按批准方案接入后端。

## 识别候选与边界

用户指定阿里云百炼 `qwen3.5-flash` 作为 V1 整版识别主模型，地域使用华北 2（北京），通过 OpenAI 兼容 Chat Completions API 接收一张图片与版面 schema 提示，使用非思考模式和 JSON 结构化输出。对主模型标记为低置信的价格、短标签或小字，只裁剪对应局部并调用同一服务方的 `qwen3.5-ocr` 一次；OCR 不负责判断整版结构、券位占用或完整性。两类模型能力声明均不等于 V1-25 的实测准确率，输出仍必须经过 ICHI 已冻结的 schema、原因码、守恒检查和人工确认。

- 客户端总超时：8 秒；上游模型超时：5 秒；超时返回稳定 `service_error`，不伪造草稿；
- Base64 字符串上限 10 MB，建议原图小于 7 MB；超限在代理前拒绝；
- 主模型最多调用一次；仅低置信文字局部可补充一次 `qwen3.5-ocr`，总调用不超过两次，均不自动重试；最大输出 4096 tokens；按华北 2 公开价设置 0.03 元/版成本警戒线；
- ICHI 不把图片写入 CloudBase Storage、数据库、函数日志或会话，仅在单次内存请求中处理，函数结束即释放本地引用；
- 阿里云官方隐私说明承诺调用数据不用于模型训练且传输数据加密，但同时说明会依法律法规存储模型调用数据，未公开统一保留时长或即时删除 API；因此上传前必须明确披露服务方与这一边界，V1 发布前还需在 V1-25／隐私验收中确认适用协议和删除请求路径；
- ICHI 只记录请求 ID、耗时、错误码和费用分类，不记录图片、Base64、识别全文或用户标识；
- 客户端在上传前展示用途、服务方、短期处理、失败退路和撤回路径；无网络或识别失败不影响已保存本地会话；
- 密钥只通过云函数环境变量提供，客户端与仓库不包含 SecretId／SecretKey。

## 官方来源（2026-08-05 查询）

- 微信基础库更新日志：<https://developers.weixin.qq.com/miniprogram/dev/framework/release/>
- 微信项目配置：<https://developers.weixin.qq.com/miniprogram/dev/devtools/projectconfig.html>
- TypeScript 6.0：<https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html>
- pnpm 安装与 Node 兼容：<https://pnpm.io/installation>
- Vitest 指南：<https://vitest.dev/guide/>
- CloudBase 运行时支持：<https://docs.cloudbase.net/cloud-function/runtime-support>
- CloudBase 云函数编码：<https://docs.cloudbase.net/cloud-function/how-coding>
- qwen3.5-flash 模型能力与价格：<https://help.aliyun.com/zh/model-studio/qwen3-5-flash>
- Qwen-OCR 选型与限制：<https://help.aliyun.com/zh/model-studio/qwen-vl-ocr>
- 百炼视觉理解与图片限制：<https://help.aliyun.com/zh/model-studio/vision/>
- 千问结构化输出：<https://help.aliyun.com/zh/model-studio/qwen-structured-output>
- 百炼合规与隐私说明：<https://help.aliyun.com/zh/model-studio/privacy-notice>
