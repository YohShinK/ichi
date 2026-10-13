# TASK22 Phase6 跨城市缩放列表修复与收口

## 修复版人工验收及最终集成（最新）

用户在修复版二维码提供后明确回复“人工验收完毕”，按直接本人反馈记录本次跨城市列表修复PHONE_REPAIR_USER_CONFIRMED_PASS，设备沿用已确认iPhone16Pro/一个账号，系统/微信版本仍未知。Phase6=COMPLETE / HUMAN_APPROVED / CROSS_CITY_FIX_PHONE_ACCEPTED / CURRENT_INTEGRATION_PASS / PREVIEW_READY / SAFE_STOP，未测边界保持本人已接受范围，不扩充新上传/辅助抽赏/全记录生命周期或P95。

收口时独立Phase7正在修改四份采集工具文件，Phase5三份后端源码保持冻结SHA，地图182文件与修复预览SHA保持。新增媒体测试首次因未提供其所需ICHI_IMAGE_DECODER_PYTHON失败5项，保留full-tests-final.json；使用已存在并实际验证Pillow的项目解码Python后全量1481 PASS/1既有SKIP/0 FAIL，types/Lint通过，前述Next/26 Playwright及原生/SDK地图验证保持。Phase7工具变更不伪装成原28文件当前全部无差异，也不阻塞已经完成的Phase6地图收口。

直接人工回执phone-repair-human-acceptance.json、最终自动回执viewport-picker-fix/qa-receipt.json与final-state.json绑定当前结论。以下“尚无新手机反馈”只代表生成预览时快照，已由本条直接回复补齐。



状态：COMPLETE / HUMAN_APPROVED_ACCEPTED_GAPS / CROSS_CITY_FIX_VERIFIED / PREVIEW_READY / SAFE_STOP。用户先接受未测边界，随后要求解决上海缩小至杭州时列表显示0的问题，修复后收口；本报告兑现该限定授权。

## 根因与影响

缩放切换视口时，地图为减少闪烁保留已呈现Marker；PublicMapClient的新查询可能暂时items为空，也可能只含50条快照的当前页。旧readLeadForPicker在概要没有对应ID时不发公开detail请求，直接返回null；首页又用“null且概要缺席”作为不可用依据删行。因此两个真实重叠成员可被误删为0，而放大杭州重新取得概要后又能读到2。此错误适用于任意跨城市或视口切换，不依赖越南、VPN或simulator launch failed。修复前四项页面回归实际失败，证据regression-before.log。

## 修复规则

MAP_PICKER_RENDERED_LEAD_REVALIDATION_V1区分“当前概要没有”与“已确认不可用”。已呈现列表ID在加载中/当前页缺席时，继续通过现有安全公开详情端核验；查询概要不会被追加污染，准备区也不扩大到视口外。存在概要时继续检查版本/政策/投影；所有回复检查请求、generation、schema、ID、公开期限及当前生命周期。

列表仍仅可视8行、2并发，瞬时错误保留有效行/资料；只有明确LEAD_UNAVAILABLE、本人删除或已知到期才移除。最后一行明确失效时关闭空列表并恢复定位/刷新，稳定Marker复用也排除明确失效ID。新查询、关闭、后台、删除后的迟到回复不得复活旧记录。2分钟/16项准备区、50/页与500快照、原触摸边界和分享合同保持。

运行时只变更apps/client/miniprogram/platform/public-map-client.ts与pages/home/index.ts，另两份相关测试新增12例；没有WXML、后端协议/部署或生产来源写入。

## 验证与真实删除

- 定向204项通过；当前源码1474 PASS、1既有SKIP、0 FAIL；类型/Lint/Next构建通过，Playwright26通过。
- 真实微信SDK当前杭州query仅女神异闻录（f92f62061d1b5d6287b514877a5b1306），雪未来（3725de26d945a500ca83bef7331a1ae2）明确LEAD_UNAVAILABLE。用户删除得到公开端确认；未恢复、重新准入或创建记录。
- 上海/杭州大范围同快照两页50+1、51去重ID，包含杭州剩余记录且排除已删除记录。50/页分页行为保持，未把第一页数当区域总数。
- 当前真实客户端在视口加载items为空、或已加载上海50概要且不含杭州ID时，都能经安全detail读取并选中剩余杭州记录。
- 原生已编译首页以旧真实两行paint状态进行受控回放：只移除已删行、剩余行资料LOADED、行选择打开对应详情；全失效时关闭空壳并实际恢复控件。此为模拟器状态接点验证，不称为物理触摸/新手机PASS。
- 官方修复预览成功1054089字节，二维码生成后立即提供；CLI成功、PNG、info和客户端182文件SHA分别绑定。只有四份本轮源码/测试文件较旧手机快照变化，项目配置保持。

证据目录artifacts/task22/phase6-shanghai50-20261009/viewport-picker-fix/。full-tests.json、source-sha.json、client-snapshot-sha.json、native-public-regression.json、native-page-regression.json与phone-preview-fixed-receipt.json保存实际结果；初次本地加载器/SDK旧路径错误与自动化超时另档保留，官方auto恢复后通过。没有更改用户网络或代理设置。

## 收口依据与边界

本人已明确“接受这些未测边界，收口 Phase6”，随后“找到根因并修复问题即可收口”；scope-human-acceptance.json绑定两条直接指令。六项原手机检查按当时本人“全部通过”保留，iPhone16Pro/一个账号，系统和微信版本未知。修复版本轮有自动/原生/真实公开SDK验证，未补造新物理手机PASS。

新V1拍照上传、辅助抽赏、完整新记录生命周期、第二账号/设备、弱网、真机P95、50用户pilot与隔离批次成本等接受为未测边界。此次用户删除及服务端不可用已单独补证，不能延伸为全上传—删除路径验收。原50、Phase5最终集成及生产安全门证据保留；此轮不重放生产部署、准入、索引/bridge/smoke，没有Git提交或正式微信发布。

Phase6及本轮产品合同按接受范围收口，TASK22/V2-E整体仍IN_PROGRESS。Phase7独立聊天已另获授权，沿其当前工作集推进；本修复只交付跨城市安全读门，不授予额外采集/生产动作或Phase8/正式发布。
