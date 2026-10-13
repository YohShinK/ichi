# TASK22 网络版面余量与列表备注时间纠正

当前10条已全部显示确定余量，猎人“E 升 LAST”已保存。列表第二行与详情展开备注栏复用同一份安全地点、公开备注及分析理由；网络版面展示的上传时间按用户要求使用原观察时间。状态PRODUCTION_CORRECTED / REAL_PUBLIC_VERIFIED / NATIVE_TEXT_AND_CANVAS_VERIFIED / PREVIEW_READY。

## 原图与用户确认后的事实

| 版面及地点 | 剩余抽数 | 依据／变更 |
| --- | ---: | --- |
| 哀鸿 · 百联ZX | 78 | 原图完整未贴票，保持 |
| 鬼灭上弦之贰 · 静安大悦城 | 70 | 原图完整未贴票，保持 |
| 火影睡衣派对 · 番茄口袋 | 55 | G第5–24张未贴，共20；原值19漏算1 |
| 鬼灭上弦之贰 · 番茄口袋 | 23 | 原每赏级票位复核，保持 |
| 宝可梦30周年 · 番茄口袋 | 68 | 原每赏级票位复核，保持 |
| 火影睡衣派对 · 暴蒙 | 68 | 原图未贴票，保持 |
| 鬼灭上弦之贰 · 暴蒙 | 69 | F第1张已贴票，余第2–12张，共11；原12错算1 |
| 猎人CHIMERA ANT · 徐汇百脑汇 | 80 | 用户确认全版未抽；印刷A2/B1/C2/D2/E1/F2/G20/H24/I26，合计80；备注E升LAST |
| 龙珠DAIMA第2弹 · 番茄口袋 | 41 | 用户确认C0；A1/B1/C0/D1/E0/F2/G10/H5/I10/J11 |
| 龙珠Fantastic Adventure · 番茄口袋 | 50 | 用户确认A0；G第6–21张共16；A0/B1/C1/D2/E7/F11/G16/H12 |

前三个待确认版面的空值均已补齐。“E 升 LAST”作为活动备注，不将E计为额外抽数或改写普通赏级。以上是各原观察时间的版面事实，不以本次纠正时间当作新观察。

## 记录与显示

5条事实修订经内部可信运维库correction.mjs执行，每条新sourceVersion绑定最终contentDigest、Founder纠正指令、独立结构化事实rights及必要的备注安全hash。原source/lineage/BoardInstance/publicLeadId保持，servedVersion从1递增到2，旧revision及observation保留。复用既有验证、共享link/project、暂存读写集和事务最终CAS；同来源同物理版面的事实纠正单独记录依据，不重新运行ADMIT或自动resolver去合并其他版面。

原源图、fetchedAt、地点、observedAt和30天publicUntil未修改。其余5条NETWORK及原2条PLAYER不写。正常准入／维护／smoke／timer全程关闭，环境和features／bridge保持；policy只推进已批准的5个来源版本绑定，allowlist仍为10，不新增资源、端口或云函数部署。短备注“E 升 LAST”由用户提供并经过可信curator内容核验，回执明确不宣称新增微信msgSecCheck。

客户端用networkExpandedNoteLines驱动详情展开栏与列表第二行，移除原来的“暂无公开备注”错误空提示。NETWORK列表及详情展示“上传 MM/DD HH:mm”和“上传于…”，时间值始终是原observedAt。后端没有伪造uploadedAt；PLAYER仍用真实首次上传时间和安全备注。列表继续单行省略和既有可视8行、最多2并发／生命周期取消。

## 验证与预览

- 源回归1415通过、0失败、1既有跳过；后增回滚及并发CAS拒绝测试在最终NETWORK专项通过。错误curator、缺rights、未绑定决定、时间／位置改变、撤回及不安全备注均拒绝，原记录保持。
- 类型、Lint、Next构建及Playwright26项通过；工作流和上传分享流通过。
- 真实公开query/detail读取10条，每个赏级和总抽数、原观察时间／期限、备注及无私有字段泄漏验证通过。原2条PLAYER的10个公开字段一致。
- 微信模拟器逐条验证10条精确抽数与展开文字；同源列表备注和时间一致，10个Canvas信息条准备完成。10条总列表只用于绑定实际公开数据的有界元数据验证，未声称这10条形成同一物理地点聚合，也不声称新增真机或人工视觉验收。
- 数据修订后的首次验证脚本误读内部board.totalRemaining字段、第二次受到SDK Geo.Point类与JSON序列化形态差异影响而停止；原失败回执保留。后续只读按tiers求和并规范化比较，通过全部检查，5条未重复写入。

证据目录artifacts/task22/phase4/remaining-correction-20261007/，最终回执final-validation.json。新官方预览1053453字节，native-preview-qr.jpg可扫码使用；未微信正式发布、Git提交或解锁后续Phase。
