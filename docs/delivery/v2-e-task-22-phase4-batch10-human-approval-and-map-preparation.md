# TASK22 当前10条：已全部审核通过并入图

Founder通过对话批准当前10条，并明确允许仅本批NETWORK使用有公开依据的门店／商场近似位置。当前结果 **BATCH10_COMPLETE / HUMAN_APPROVED / TEN_PRODUCTION_ADMITTED / PUBLIC_READ_VERIFIED / SAFE_STOP**：10个真实来源、10个独立BoardInstance、10个公开ID，全部通过正常签名准入端口；未将不同文章合并。

| 入图地点依据                                             | 条数 | 公开位置表达                                       |
| -------------------------------------------------------- | ---: | -------------------------------------------------- |
| 上海荟聚番茄口袋：中国旗舰店，金钟路788号二层            |    5 | 门店近似位置，误差未知                             |
| 暴蒙BOOMCOMIC：南京东路340–372号百联ZX                   |    2 | 门店近似位置，误差未知                             |
| AKIBAGO原帖明确的百联ZX：使用同商场内已核对POI作范围参考 |    1 | 商场范围，误差未知；不确认异常分类的AKIBAGO专属POI |
| 静安大悦城：西藏北路166号                                |    1 | 商场范围，误差未知；不确认潮趣店具体楼层点         |
| 徐汇百脑汇：漕溪北路339号                                |    1 | 商场范围，误差未知；不冒充花の一番具体店铺点       |

高德命名地点的公开分享链接及坐标已保存。7条APPROXIMATE、3条AREA，全部按0.001°公开网格。accuracyMeters保留null；详情收起预览及展开信息明确显示“大致位置 · 位置误差未知”。本批例外绑定sourceId/sourceVersion/locationDigest，最多10条；PLAYER的≤100米公开准入保持。本人定位、登录资料、临时小红书导航token不保存。

原帖10个真实平台发布时间全部保留，observedAt使用SOURCE_PUBLISHED_AT_FALLBACK，publicUntil=原发布时间+30天；不以补证、审核、入库时间续期。4条在当前已超过采集时7天窗，保留原采集与原日期，不伪称现在仍是7天内。当前Freshness独立按原时间计算。公开地图仅呈现结构化版面事实；rights登记为PERMITTED_STRUCTURED_FACTS，保留独立exact版本决定，不宣称作者／门店授权，也不公开原图、原文或后台证据。

真实微信SDK query包含10/10，detail逐条通过，票数／null／价格／大赏集合／原时间／期限／地点范围一致；公开字段扫描0私有字段。原有两条PLAYER的公开ID、servedVersion、版面、位置、备注、首次上传时间、贡献资料保持。原生开发工具10条可读及位置提示实际文本通过；此为模拟器／非视觉自动检查，不冒充新增真机或人工视觉验收。

从新鲜远端生成最小差异，七个相关函数各只改phase3/network.mjs及shared/domain.mjs，186源码和原配置回读通过；没有新资源、索引apply、旧Phase3构造smoke或PLAYER bridge重放。先处理8条，再处理剩余2条，前8条版本与ID保持。首次调用返回准入未启用；最后两条遇到配置Updating及一次环境恢复请求拒绝，均留原失败回执。后续等待Active、恢复双门，再正常准入成功。最终准入环境／数据库、维护／smoke及timer全部关闭；真实再次ADMIT返回NETWORK_SERVICE_DISABLED，现有公开记录仍可读。

验证：现行源码范围1406通过／1既有跳过；七个实际包373通过／5不适用的非读取函数公开smoke入口断言跳过（初轮5失败回执保留，未改旧入口）；类型、Lint、Next构建、workflow、分享防回退通过。Playwright首轮25/1票区元素未可见，单项及全组重跑26通过。官方预览1053042字节，二维码为同目录native-preview-qr.png；客户端未正式微信发布。

证据：artifacts/task22/phase4/map-admission-20261007/中的admission-final.json、public-after.json、native-label-check.json、final-gates.json、exact-diff-manifest.json及final-validation.json。人工批准及地点／时间原证据在artifacts/task22/phase4/review/。原50条冻结目标未伪造达成，本批10条的对话批准已在审核页注明，无需逐条重审。完整Phase5—8、50/300扩大采集、常规NETWORK continuous、Git提交／推送及微信正式发布未整体解锁。
