# TASK22 Phase1-D4｜官方 Manager 高层创建执行与回查报告

执行日期：2026-10-03，Asia/Shanghai。状态：**STOP_PROBE_FAILED / FIRST_HIGH_LEVEL_CREATE_REJECTED**。

## 执行结果

首函数 query-public-map-leads 通过当前官方 Manager 高层创建路径发送一次请求，被拒绝。底层具体错误为 **MissingParameter：缺少 EipConfig**。立即 STOP，其余8个未部署；不补参重试、不改冻结合同、不删除或覆盖资源。

9个生产目标在postflight仍全ABSENT，functions=0/9、accepted bindings=0/20、远端源码read-back=NOT_RUN、disabled smoke=NOT_RUN。拒绝请求中内存注入的3个逻辑值不等于完成3项binding。因CREATE未通过，首函数门未通过，自动串行继续条件未触发。

## 授权与边界

Founder本轮停止D2/D3字段恢复，明确授权当前官方 @cloudbase/manager-node 的 functions.createFunction({func,base64Code,force:false})；仅在首函数 CREATE/3bindings/源码read-back/disabled smoke/安全不变量均PASS后，自动串行其余8。旧D3“先HIGH根因门”由本次路线授权承接；不将D2/D3具体MissingParameter标为已定位。

本轮不调用commonService/scfService CreateFunction，也不从Namespace创建。旧Manager仅用于只读完整结构回查、现有identity的内存读取及只读认证桥接。新SDK隔离安装于/private/tmp/ichi-task22-manager-current.3ypZvr，不改项目package或lockfile，版本5.9.0。CREATE由官方高层方法实际发起，经其TCB接口2018-06-08/EnvId路径，SDK原payload不修改。

安全监测护栏只验证SDK输出并限制一次CREATE，不自建参数；禁止SCF CREATE、SDK自动删除、覆盖更新和重复CREATE。空trigger路径保留官方无操作行为。新高层结构、9frozen ZIP、5种合成编码脱敏和上述护栏的离线验证PASS，network0；一个初次本地VM跨realm对象比较断言修正后通过，与云端失败或重试无关。

SDK对diskSize不透传到DiskSize；本轮仍提供合同diskSize=512，未注入低层参数，成功门要求实际read-back=512。CREATE被拒绝，不能宣称该值已在远端验证。

## 完整脱敏错误与请求编号

外层TCB Error.Code：`FailedOperation`。

```text
[CreateFunction] [code=MissingParameter,msg=请求缺少必要参数：EipConfig。,reqId=09fcb6a8-d0d0-4d76-80de-8318ca2b79c0]
```

原始内层message（脱敏后完整保留）：

```text
[code=MissingParameter,msg=请求缺少必要参数：EipConfig。,reqId=09fcb6a8-d0d0-4d76-80de-8318ca2b79c0]
```

外层RequestId：`c8b395fe-ca1a-46ba-afa5-6297ca555ebc`；内层SCF RequestId：`09fcb6a8-d0d0-4d76-80de-8318ca2b79c0`。创建时间：2026-10-03T14:27:13+08:00。

specific parameterNames=[EipConfig]。这确证本轮D4高层请求的拒绝字段；未追查或回填D2/D3具体字段，也不声称问题已修复。执行器failures.stage沿用末次只读ListFunctions标签，实际失败API由CREATE dispatch receipt与完整message确认是CreateFunction；此标签不用于根因判定。

安全证据：[execution.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d4/execution.json>)、[result-summary.json](</Users/cunfu/Documents/ichi 2/artifacts/task22/phase1d4/result-summary.json>)。字段类型、EnvId存在/Namespace缺席、ZIP精确SHA、Environment key names均记录；没有完整请求正文、secret值或新secret hash。

## Frozen输入与顺序

proposal SHA：0940d1b322566c11df46898994a87c8effea5b1fa79a261711a44eec2a345f41。

manifest SHA：e36b4caff11aa2886c1150d17c2250926049f779945f94286e55302a7d6c41da。

batch SHA：ccc61b45a42a54f137ae599b682c37fa9300bc3f70a5d219255365d3619dbb08。

| Function（冻结顺序） | ZIP SHA-256 | 本轮结果 |
|---|---|---|
| query-public-map-leads | a7ca4714578fedaef5533e85f55772fd96f95f48fc2540cfbdec3edf1b88f8d4 | CREATE拒绝 / ABSENT |
| get-public-map-lead-detail | e0bfac1f1615d6990281c3b7f95e50e1c0b524ed64b5829eaed9da4ef0327aeb | NOT_RUN / ABSENT |
| get-my-map-assistance | a166ebc1a7b880d638b96c0777476d176bb99fb9208e2319db79670f1f49f66e | NOT_RUN / ABSENT |
| manage-map-contribution-consent | 71b78cdb1c2b2a79d4bd32441d746fb5ff76af9d0ba57b5c188abf6087cb89a1 | NOT_RUN / ABSENT |
| manage-map-contribution | b36a4d9b2af5f4e19ab4ba2ae71a2a16172e6ef0720a9c3ae560f1b082123450 | NOT_RUN / ABSENT |
| report-public-map-lead | ece369e73dd6778f497954710876aea2290109da675dcfe2f2258aedd5dffafb | NOT_RUN / ABSENT |
| answer-map-assistance | 22082e1fd47e8fef52a4b4efcb4768c1287e520f715169930192839d2107dc14 | NOT_RUN / ABSENT |
| resolve-board-observation | 192300bd89c159e36d6a84ab146a9e05d9601e81131242f1da1b0a526279e2b2 | NOT_RUN / ABSENT |
| reconcile-map-projection | f1d4adbba248d665e86c29a0eb1fe1caff6c915da52c3f1e5508471dbd3a5a6f | NOT_RUN / ABSENT |

每次调用前重算ZIP SHA，source/manifest/proposal/batch均精确。runtime Nodejs20.19、entry index.main、memory256、前6timeout10/后3timeout20、InstallDependency true、role TCB_QcsRole、publicNetwork ENABLE、initTimeout65、disk512、trigger/layer空、MODE production、ENABLED=false合同未修改。

## Secret合同与内存通道

IDENTITY_HMAC_KEY复用既有13V1消费者一致的旧值；authority新key一次32bytes随机生成，cursor另一次32bytes随机生成，互不相同、不复用identity/shadow。计划矩阵为identity9/authority9/cursor2，共20；实际accept/binding=0。没有输出值/hash、写文件、写shell参数或绑定既有V1/shadow。Founder RISK_ACCEPTED_BY_FOUNDER / SECRET_UNCHANGED / ROTATION_WAIVED保持，暴露不标为已修复。

CREATE拒绝后扫描tracked source、untracked task artifacts、docs/delivery、memory-bank、artifacts/task22及完整Git diff：SECRET_VALUE_PERSISTED_IN_PROJECT_FILES=0 / gitDiffMatches0。收口报告生成后再次扫描998个文件与Git diff，匹配0；执行进程已结束并释放secret引用。最终回执保存secret-leakage-scan.json与verification.json，不保留值。

## Preflight / Postflight

preflight：2026-10-03T14:26:36+08:00；postflight：2026-10-03T14:27:54+08:00。各118项只读回执，结构比较均PASS，structuralDiffs=[]。

| 检查 | Pre / Post |
|---|---|
| production collections / explicit nonTTL indexes / ADMINONLY | 14 / 23 / 14，完整不变 |
| 13业务集合 / PUBLIC | Count均0 / 0 |
| 4 frozen controls | 完整一致；read-stop true/features false/HA pause true/epoch1 |
| V1 | 13collections/43历史index口径/13ACL/19完整stable configs；STRUCTURAL_DIFF0 |
| 所有既有函数 | 28完整config/trigger/layer读取；19V1旧稳定hash、9shadow历史非secret结构与既有环境摘要比对、shadow本轮pre/post完整稳定比较PASS |
| Shadow | read-stop true/HA paused true/epoch41/PUBLIC0；flags false/callers empty |
| Storage / rules / environment资源结构 | 不变 |
| production target functions | 9全ABSENT |

V1正常live Count/Size变化只记录：accounts/auditEvents/ichiIds/profiles/wechatIdentities相对历史基线增长；本轮pre/post相同。没有把增长视为hard stop，没有由本执行器写业务数据。

## 精确动作与验证

Cloud CREATE请求=1、接受=0、拒绝=1；Invoke=0；secret binding接受=0；其它云端修改=0；自动cleanup/update=0；业务写入=0。failure1/retries0。没有远端源码read-back或disabled smoke PASS，均因CREATE拒绝NOT_RUN。

748个受保护文件drift0，包含frozen source/9ZIP与所有既有task artifacts/历史报告；本轮只新增D4操作产物/报告并更新四份正式事实源。平台适配验证为新SDK离线9包参数/错误脱敏/护栏验证与实际创建拒绝后的完整pre/postflight；未修改产品源码，因此未重复此前通过的应用构建/浏览器回归。workflow/diff-check PASS，未Git提交/推送/PR/merge/tag、微信发布或解锁Phase2。

当前 TASK22=IN_PROGRESS / PHASE1_D_STOP_PROBE_FAILED / PRODUCTION_NOT_ACTIVE；Phase2/NETWORK/50/300保持LOCKED。下一最小决策仅是审阅是否授权隔离执行脚本补齐本次EipConfig必需结构后重试首函数；本轮没有实施或发起该动作。
