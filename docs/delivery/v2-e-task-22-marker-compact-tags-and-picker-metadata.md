# TASK22 Marker紧凑标签与重叠列表信息

日期：2026-10-05。工作集 `MAP_MARKER_COMPACT_TAGS_AND_PICKER_METADATA_V1` 已 CLIENT IMPLEMENTED + NATIVE VERIFIED / AWAITING_REVIEW。V2-E/TASK22仍唯一活动区块、整体IN_PROGRESS。

地图单点、聚合Marker及重叠选择列表的标签框已按实际显示文字收紧，只保留必要内边距。原来PICKER使用固定64px，普通Marker则占满整个文字区，所以“仅上传”会有大量多余背景。共同Canvas绘制现测量文字宽度，长标签受当前Marker档位约束；外壳、数字、圆角、状态色、坐标/anchor和聚合判定不变。

重叠列表第一行在IP/主题后绘制已有分析标签，与标题共用基线。标题或标签装不下时显示省略号，避免静默丢失溢出标记；各标签保持自然宽度。第二行左侧展示安全公开备注，右侧展示可信首次上传时间，长备注截断时仍保留时间。uploadedAt缺失显示“上传时间未知”，不用观察或桥接更新时间替代。加载/失败/无公开备注分别明示；WXML失败占位也沿用这两行信息。

## 接点与生命周期

- 已有PublicMarker列表不含备注及uploadedAt，使用当前生产公开详情函数读取；未改服务器DTO或部署生产函数，未扩大到私有数据。
- `PublicMapClient.readLeadForPicker`只读，并重检公开ID、requestId、generation、servedVersion、当前查询成员和隐藏状态。它不改变选中详情、不写持久缓存；正式点击仍走原`selectLead`新读取。
- 初始只请求8行，滚动时请求相应8行窗口；同次列表ID去重、最多2个请求并发。列表概要先显示，图片逐行提交，备注和时间到达后更新对应行。关闭、离开、后台或卸载取消排队与提交，迟到结果不复活列表。
- 渲染缓存版本更新为v8/picker-v2，备注及时间纳入PICKER key；旧图不会让新文字继续显示旧标签。没有JS转置赏级或改动原按列详情布局。

## 验证

- 现行源码及夹具共107文件通过、1文件既有skip；1269项PASS、0FAIL、1项既有skip。新增17项验证涵盖单点/聚合文字宽度、列表同基线/第二行、溢出边界、缓存失效、真实上传时间和缺失、错记录/错请求/错版本/旧generation、隐藏不复活、2并发/去重/失败/取消。
- 最终小修改后4个相关文件、75项重新通过；类型检查、Lint、Next.js生产构建、上传分享合同、工作流和本轮差异检查通过。
- 原生开发者工具实际读到1条正式公开记录，备注“测试”、uploadedAt为2026-10-03T09:55:25.907Z；单行隔离展示壳的公开详情接点返回“上传10/03 17:55”，没有伪造或重写该记录。
- 同位置3条隔离transport fixture经实际聚合点击进入列表，308×60行高、行距62px；主题/标签/备注/时间正确归属，第三行6个标签的数据保持完整、空间不足以省略号呈现。实际Element.tap第二行后仍打开对应20抽、备注2的详情，metadata读取不会预先打开卡片。
- 隔离20条长列表初始读取8次，滚至末行后共14次，并发峰2；最后备注对应第20行。真实原生scroll触发可视窗口补齐，关闭后500ms迟到结果未复活列表，rows=0/pending=0。
- 已查看真实地图紧凑标签、隔离聚合Marker、3行重叠列表截图；单点和聚合标签框均随文字收紧。没有使用浏览器控制工具。
- 初次平台QA的选择断言误将“剩余20抽”文案字段当成纯数字；改验证原有数值展示字段后通过，初次停止回执留存，没有因此改产品行为。
- 全部临时transport恢复、fixture清除、真实公开结果恢复1条、原tab恢复。生产fixture写入、真实举报、部署/配置更新和历史迁移均0。
- 官方小程序新版预览通过，包1038468字节；修改已在正式开发工作区及预览搭载。未正式微信发布、未提交/推送Git，不解锁后续Phase。

现行设计、技术栈、架构、实施计划、进度及AGENTS已同步。旧64px等宽和列表第二行标签仅可作为历史追溯，不用于恢复当前布局。整区块仍保留原人工验收门。

## 截图与证据

- [真实地图Marker紧凑标签](../../artifacts/task22/phase2-marker-picker-20261005/native-real-map-compact-tag.png)
- [隔离聚合Marker紧凑标签](../../artifacts/task22/phase2-marker-picker-20261005/native-cluster-map-compact-tag.png)
- [3行重叠列表：同高标签、备注和上传时间（隔离样例）](../../artifacts/task22/phase2-marker-picker-20261005/native-overlap-two-line-picker.png)
- [原生回执](../../artifacts/task22/phase2-marker-picker-20261005/native-marker-picker-qa.json)
- [新版预览二维码](../../artifacts/task22/phase2-marker-picker-20261005/native-preview-qr.png)

全部证据集中于 `artifacts/task22/phase2-marker-picker-20261005/`。
