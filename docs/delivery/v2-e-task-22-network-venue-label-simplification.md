# TASK22 网络版面地点文案简化

用户要求“去除大致、未知等描述”。当前网络版面的折叠摘要和展开地点行已移除“大致位置 · 位置误差未知 · ”前缀，直接显示门店／商场名称。例如暴蒙条目显示“暴蒙BOOMCOMIC(上海百联zx创趣场店)”。本次用户要求取代此前本批次必须显示该前缀的旧文案规定；实际店名、分店名及商场范围保留。

变更限于public-map-presentation.ts的显示转换，现有两处WXML继续共用locationLabel。公开回执与缓存中的原areaLabel、precisionMode，以及后台未知米级误差、地点证据、坐标、原观察时间和30天期限均未改。PLAYER及本人模糊定位提示保持；未知票数、价格等其他业务字段也保持。10条已准入记录无需重审或重新入库，本轮生产写入、函数部署和准入重放均为0。

验证结果：

- 源回归1406通过、0失败、1既有跳过；最终NETWORK14项复跑通过。测试同时确认传输地点元数据不变，网络显示仅地点名，PLAYER保留原显示。
- 类型检查、Lint和Next构建通过。初次类型检查中的测试fixture图标null已修正为PLAYER既有undefined后复验。
- 微信原生模拟器真实公开读取10条；逐条验证折叠摘要和展开地点行都等于原地点证据的venueName，原公开地点元数据保留。这是平台文本／状态验证，不代表新增真机人验或人工视觉验收。
- 工作流治理与上传分享流验证通过，最终回执见artifacts/task22/phase4/network-venue-label-20261007/final-validation.json。

状态CLIENT_IMPLEMENTED / NATIVE_TEXT_VERIFIED / PREVIEW_READY。新版官方预览1053152字节，二维码artifacts/task22/phase4/network-venue-label-20261007/native-preview-qr.jpg；未微信正式发布或Git提交。当前活动区块继续为V2-E/TASK22，后续Phase不自动解锁。
