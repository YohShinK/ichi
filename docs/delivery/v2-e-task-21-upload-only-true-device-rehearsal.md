# TASK-V2-21 仅上传真机 Rehearsal

2026-10-01 最新：唯一举报 envelope 修复已获批准并部署，cd4c6366 修复 SHA/source/config16文件核对PASS；Founder B仍举报失败，真实调用两条INVALID_REQUEST、B ledger0，P1=1，举报四步停在第一步。已恢复9函数flag=false/caller空/read-stop=true/HA pause=true/read-epoch31/PUBLIC0、12authority失效，SAFE_STOP PASS；49项完整云V1及149本地文件0diff，5条本轮真实公开response PRIVATE_LEAKAGE0。其它既有仅上传/标签气泡/刷新/C threshold与隐藏消费PASS无影响保留。UPLOAD_ONLY_AND_REPORTING_PRE_PILOT_CLOSURE=NOT_PASS / REPORT_REPAIR_TRUE_DEVICE_FAILED，TASK22 LOCKED。最新依据为 [final-closure](v2-e-task-21-pre-pilot-final-closure.md) 和 [独立修复真机报告](v2-e-task-21-report-envelope-repair-true-device-retest.md)。下方为首次总命令演练的历史记录，未批准/未部署等旧状态不代表上述最新结果。

## 执行边界与当前状态

环境：cloud1-d7gxqfwv783a1f131。TASK20 COMPLETE / HUMAN_APPROVED / FROZEN；TASK21 IN_PROGRESS / PRE_PILOT_CLOSURE；TASK22 LOCKED / NOT_STARTED。仅执行Founder总命令和本轮真机反馈，不启动Closed Pilot/生产迁移，不提交或推送Git。本轮已安全停机；举报真实链路发现P1，独立修复包待批准更新，本轮总门不通过。

## Pre-state 与 exact resources applied

执行前13个V1集合、43索引、13 ACL、19函数（runtime/code稳定字段/env/triggers）、函数权限规则、Storage两根项和规则hash、环境稳定字段完整比对PASS。shadow epoch25、read-stop/HA pause=true、8函数flag=false/caller空、PUBLIC0、report ledger不存在。批准资源差异：+1 v2ShadowModerationLedger ADMINONLY；+2显式nonunique/nonTTL索引 kind_target_policy_time（kind ASC,publicLeadId ASC,policyVersion ASC,createdAt DESC）和v2ShadowBoardInstances.active_public_lead（activePublicLeadId ASC）；+1 v2-shadow-report-public-map-lead；替换v2-shadow-reconcile-projection、v2-shadow-query-public-map-leads、v2-shadow-get-public-map-lead-detail；+0 secret/trigger/Storage/V1资源。

批准artifact与云端反向下载如下，批准包路径均为packages/v2-map/resources/shadow-functions/artifacts/task21-reporting/<function>.zip：

| Function | 批准SHA-256 | 远端含依赖ZIP SHA-256 | 批准文件一致 |
| --- | --- | --- | --- |
| v2-shadow-report-public-map-lead | 27cabeccdda5d50d670fb108c991299122d69f31308b1e619842460557e25526 | 9b9bb4f36a2ae683b152a7a5afb4012c97a515a16763d0133d71b0ff0849967e | 16/16 byte-identical |
| v2-shadow-reconcile-projection | 8fbbbe0dbc49d37625ba97fe2cd74d4c9547c2614fe8076d65e756c7ab11688f | 72aae45ebead4ce49f8cfd71550124f33520e914f2eb645c47f3567bdb0d3b2f | 20/20 byte-identical |
| v2-shadow-get-public-map-lead-detail | b1eda2c1a3e533c63a69352021ec8aa0f5f19baad109addeec9d795988a4d810 | aa5d5b0d44aa9da78c8185b04f8ae882eeef296a8a7279e5885b60d7fd734811 | 18/18 byte-identical |
| v2-shadow-query-public-map-leads | de61d13bcc6cfb39257c8ea857ec175a03308bffa29fc9a18e0368f271177291 | 139ca2c6084966ed73ffc1968215e8e181158612082f44892b7844035d8e188f | 18/18 byte-identical |

云端ZIP因安装node_modules而SHA不同；逐一比对全部批准源文件与配置，不将ZIP hash不同误报源码漂移。Nodejs20.19/index.main/256MB/10s/Active/Available/0 trigger/0 layer。九包SHA/静态allowlist核验全PASS，其余五包未部署。rollback三个旧包已存既有审批证据，不受本轮客户端修改影响。

## Env/config 与 external writes

Phase A所有新入口关闭/caller空、read-stop=true/HA pause=true/PUBLIC0；secret只记录PRESENT，复用既有principal/rehearsal material。Phase B仅短开resolver用于三组synthetic source正常关联，再短开projector+consent正式投影，完成即恢复关闭；第一次在配置Updating时调用被关闭门拒绝，等待Active后重试三组均NO_MATCH，无代码修复。Phase C仅query/detail READ=true，report/report-rehearsal=true，三者caller=Founder A唯一可信既有WXContext登记主体；不恢复ENROLL、不开放HA。新增12条server-only reporter authority（Founder A+10 eligible synthetic+1 ineligible synthetic），有效期1小时；capability独立HMAC、一次性nonce、4分钟过期。账号/profile和V1私有业务数据未读取或写入。配置前后脱敏记录见phase-c-window-config.json。真机A反馈修复期间关闭窗口/epoch27；修复版重开epoch28，PUBLIC3；阈值隐藏epoch29，最终停机epoch30/PUBLIC0。最终safe stop已完成，epoch30。

## 三组供给 lineage

仅三组合成fixture/candidate upload和一条synthetic owner consent，明确SYNTHETIC_REHEARSAL；不是实际用户upload接口提交，不冒充真实玩家供给。不复制V1 private records。适配器Verification、SHARE/current/location/note/UGC/consent/public eligibility通过；既有resolver建立association/contribution/outbox，批准projector生成PUBLIC，未admin直接改PUBLIC。

| 组 | recordType | publicLeadId | servedVersion | 理由 |
| --- | --- | --- | --- |
| A | UPLOAD_RECORD | 25708cf94ec723a889205810f7eeebbe | 1 | LAST_CHANCE, GRAND_PRIZE_RATIO, GRAND_PRIZE_REMAINS |
| B | DRAW_RECORD | d4ed6aa1b4b41472c6d0a11df007e074 | 1 | LOW_OPPORTUNITY |
| C | UPLOAD_RECORD | 8e4627d92e103fddaedceca4351d35dc | 1 | LAST_CHANCE, GRAND_PRIZE_RATIO, GRAND_PRIZE_REMAINS |

源证据fixture-seed-synthetic-only.json、remote-source-resolution.json、remote-projection.json、public-projection-readback.json。Freshness/Opportunity均保留，灰色主标签来自recordType，公开lead ID为云端正常projection产生。

## Founder A/B/C 与 report/threshold

Founder确认继续TASK20账号A并现在测试。A首轮确认“仅上传”tag存在和其它交互无问题，明确新增两条：UPLOAD_ONLY未选时上传Marker必须隐藏；原玫红气泡显示全部实际筛选标签并按优先级排序/整行文本自然伸长。客户端已修复，A修复版Founder确认其它均无问题：强制仅上传筛选与完整有序气泡通过；C举报失败另列P1。机型/系统/微信版本/网络本轮尚未提供，不将TASK20历史iPhone16Pro/iOS26冒充本轮新确认。B真实GET_STATE/REPORT被INVALID_REQUEST拒绝，未写入ledger，不能记举报取消PASS；本地修复已红后绿并独立打包，未更新云端。C第10次隐藏及取消到9仍隐藏已完成；Founder四项隐藏消费全部通过。

C已完整执行9→10：九次仍PUBLIC，真机query/detail成功；第十次count10触发HIDDEN/visibility HIDDEN，epoch28→29；取消S1后count9且仍HIDDEN，无删除。迟到sequence2 projector返回MODERATION_HIDDEN，未复活；真实query仅返回A/B，Founder四项隐藏消费通过。同主体同action replay及新action重复举报均未增至10；ineligible=INELIGIBLE_REPORTER，wrong policy=INVALID_REQUEST，伪造额外身份字段=INVALID_REQUEST，正常管理员GET_STATE=UNAUTHORIZED。audit/report/state仅server ledger，身份以opaque主体处理不输出OpenID。缺失目标GET_STATE返回LEAD_UNAVAILABLE；hidden target取消成功且保持隐藏。普通hidden/retired目标额外远端失败用例未在窗口内单独完成，保留为剩余覆盖项；本地runtime合同已覆盖，不升级为云端已跑。最终保留24条ledger行：10 REPORT_STATE、1 TARGET_POLICY_STATE、13 AUDIT，不含Founder成功举报。

## Cloud read-back 与 public/private audit

Phase A cloud readback PASS，批准源文件逐字节相同。受信query真实返回三条public-map-v3（trusted-device-public-query.json），仅公开contract字段；原始CLS元信息不写入证据。公开API未出现reporter主体/内部ledger计数/审计/private lineage/原始note/private location。note为明确synthetic的批准公开备注，位置为APPROXIMATE。report仅active/hidden/policyVersion。14条真实公开query/detail响应递归字段审计PRIVATE_LEAKAGE=0；后台report内部主体未进入公开响应。云端C隐藏后的直接detail调用未单独重新发起，证据为服务端HIDDEN读合同/本地测试、真实query移除和Founder无法重开，明确不伪造一条远端detail unavailable响应。

## Tests/builds 与 Web gate

初始full Vitest 1047 PASS+1既有SKIP；ESLint、root/Web TS、contracts/workflow、Next build、package audit、九包SHA/allowlist PASS。report/projector/security/public-read定向4文件29项PASS（Vitest）；错误使用node --test造成TS模块解析失败已纠正，不作为产品缺陷或PASS证据。A修订先红两项锁定旧行为，修复后定向4文件94项PASS、全量1047 PASS+1既有SKIP、Lint/TS/contracts/Next PASS。微信preview修复版1011934 bytes（wechat-preview-repair.log），devOrFixtureCount0。

既有prize-grid单case连续3/3 PASS；Web full两轮26/26+26/26 PASS；客户端修订后额外Web full26/26 PASS。无本轮V1 product runtime修改（结束时按初始文件hash再比对）；不使用ACCEPTED_EXISTING_FLAKE掩盖本轮失败。

## Defects / V1_DIFF / safe stop / Git / gaps / gate

P0=0；P1=1：正式微信调用report被自动附带userInfo字段触发INVALID_REQUEST，独立修复已验证但未批准/未部署，真实举报取消链未通过；P2=1：本轮设备版本/网络信息缺口；P3=0。A/C/刷新UI真实验收均已通过。V1_DIFF=0 / VERIFIED在preflight和Phase A后完整回读；最终safe stop后50个只读查询复核：13集合/43索引/13ACL/19函数runtime/codeSize/modTime/env/triggers/函数规则/Storage两根项+规则全部match，V1_DIFF=0 / VERIFIED；Storage hash和rule hash见v1-final-after-safe-stop.json；本轮services/cloudbase与apps/web/src全文件hash0变化。环境PackageId仍baas_personal；全局envQps是动态配额指标，不纳入结构diff。最终要求全部9函数关闭/caller空、capability/authority失效、read-stop=true/HA pause=true、epoch再加、PUBLIC0、合成rows HIDDEN/RETIRED且audit保留。最终13个独立回读通过：9函数Active、全部flags=false、caller空/无ENROLL；read-stop=true/HA pause=true/epoch30；3组row均HIDDEN并retiredAt，PUBLIC0；12 authority accountActive=false且过期，report capability无法使用；24 ledger/audit行保留。SAFE_STOP=PASS。停机后report请求立即REPORT_DISABLED，无新增写入。Git继承大量既有dirty文件，不revert、不commit/push。四份报告共享证据目录artifacts/task21/final-cloud-rehearsal-20260930。

当前总门UPLOAD_ONLY_AND_REPORTING_PRE_PILOT_CLOSURE=NOT_PASS / REPORT_REPAIR_APPROVAL_REQUIRED。A/D/C/刷新UI已通过，剩余独立report修复包批准更新、B真实举报取消/重复/审计回读和普通hidden/retired额外用例。下一Founder决定是批准docs/delivery/v2-e-task-21-report-envelope-repair-exact-diff.md的单一函数更新，再续既有受控B窗口；本轮全通过后仍只能TASK21 IN_PROGRESS / PRE_PILOT_CLOSURE_PASS / PILOT_PROTOCOL_APPROVAL_REQUIRED，TASK22保持LOCKED。

## 最终追加验证与准确 Gate

本地report-envelope修复新增测试先红后绿：trusted WXContext+userInfo GET_STATE/REPORT/CANCEL，忽略伪造envelope身份、非allowlisted拒绝、其它身份字段拒绝；定向30项、最终全量1048 PASS+1既有SKIP、Lint/root/Web TS/contracts/workflow/Next PASS。独立九包候选manifest的原validator9包PASS；原九包ZIP SHA 9/9未改变，原validator对当前源码会报唯一report runtime differs from local source，原因是已准备但未批准的修复，不把它记成冻结源码一致。修复包SHA cd4c6366c4a659a978452a91a0b88b391f24e4bbc09f3db1baba49a7d9dada25，仅runtime.mjs变更，其余15文件相同；新云端写入为0。

Founder刷新状态条新增要求已完成，四动作复核全部通过：准确文本“正在刷新，保留已有线索”，右侧#e014a0旋转加载环，刷新结束消失，保留A/B且C不返回。最终微信preview1012206 bytes、package source1323549 bytes/devOrFixtureCount0；无测试UI注入。未commit/push/PR/merge/tag/production publish。

| Gate | 本轮结论 |
| --- | --- |
| EXACT_CLOUD_APPLY_READBACK | PASS 原冻结四包 |
| UPLOAD_ONLY_DEVICE | PASS Founder修复版确认 |
| UPLOAD_ONLY_FILTER_DEVICE | PASS mandatory gate |
| REAL_REPORT_CANCEL | NOT_PASS，P1原云包拒绝真实请求 |
| REPORT_IDEMPOTENCY | local+remote synthetic PASS；真实重复链待B复测 |
| REMOTE_REPORT_THRESHOLD_9_10 | PASS |
| AUTO_HIDE | PASS count10/HIDDEN/epoch29 |
| CANCEL_AFTER_HIDE_NO_RESURRECTION | PASS count9仍HIDDEN+late projector |
| THRESHOLD_HIDE_DEVICE_CONSUMPTION | PASS Founder四动作 |
| REFRESH_STATUS_DEVICE | PASS Founder四动作 |
| PRIVATE_LEAKAGE | 0，14条公开响应字段审计 |
| V1_DIFF | 0 / VERIFIED final live + local runtime hash |
| SAFE_STOP | PASS epoch30/PUBLIC0/9closed/authority失效 |
| P0 / P1 / P2 / P3 | 0 / 1 / 1 / 0 |
| UPLOAD_ONLY_AND_REPORTING_PRE_PILOT_CLOSURE | NOT_PASS |

TASK21仍IN_PROGRESS / PRE_PILOT_CLOSURE / REPORT_REPAIR_APPROVAL_REQUIRED；TASK22 LOCKED / NOT_STARTED。不是TASK21 HUMAN_APPROVED/FROZEN/RC，不是Pilot启动。
