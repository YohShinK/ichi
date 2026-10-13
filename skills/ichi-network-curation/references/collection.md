# 采集和真实证据

搜索结合商圈、店铺/IP与版面词：版面、一番赏、磁力赏、余量、残票、赏况、现板、新开、补板。轮换最新/综合及一周内，记录实际过滤和每次滚动覆盖；无结果、部分滚动、不可访问分别保留，不称饱和，不把搜索缩略图当逐赏证明。

`skills/ichi-network-curation/scripts/{search,capture}.mjs` 是在 Ego `nodejs` 环境执行的公开页面 helper。先按 Ego skill 用已授权 TaskSpace观察当前网页和过滤控件，确认目标与页面结构；配置JSON通过 `ICHI_COLLECTION_CONFIG` 指定。配置需root、taskSpaceId、pageLabel；search额外queries（number/query/sort）和maxScroll，capture额外queue（id/href）。helper不创建新TaskSpace，不恢复已finish的旧采集窗口。控制交给用户、定位/登录提示或页面变化时停止并遵循Ego恢复规则；不读取cookie/storage或隐藏接口。

helper保留原始公开capture，使用绝对源发布时间与fetchedAt，全部公开图片下载SHA；图片失败单列。可保存截图补页面上下文，截图超时保留失败，不冒充成功。video封面不是余量证据：需要实际播放并解码帧，sidecar保存articleId、captureSha256、sourcePublishedAt、帧SHA/宽高/actualMediaTime，再将VIDEO_FRAME与VIDEO_METADATA绑定导入。

地点先核对原帖与公开作者主页的门店/商场指向，再核对实际POI及GCJ02。地点证据保留源帖子、主页/POI依据及位置对象的exact摘要；没有米级精度时accuracy=null，并通过独立workflow venue登记，不编造0或100。未能确认哪一分店就交Founder。

capture配置还必须提供现有Pillow运行时的绝对路径decoderPython。下载后必须实际解码并记录尺寸，HTTP200不等于图片。一次正常下载失败后依次打开完整版面大图、重新打开原帖核对图序/fileId/源发布时间并刷新显示URL、正常下载或page.fetch、可见浏览器下载、完整大图截图；各方法有界一次。截图必须包含完整图片且清晰，不能从缩略图猜票数；保持CAPTURE内articleId/图序/SHA/完整图几何绑定。视频封面明确为VIDEO_COVER并保存video-pending.jsonl，只有实际播放帧可作为票数依据。

既有capture默认保留。retryPending=true以旧capture的SHA、原fetchedAt和源发布时间为基线，另存capture-supplement及独立retrieval目录；来源、时间或图片身份变化停止待复核。失败保留文件/原因与media-pending.jsonl，成功解码仍需逐赏核验。浏览器交给用户或执行停止时立即退出，不继续后备动作。Ego每次执行为独立Node进程，配置应在该进程中设置：ego-browser nodejs -e 'process.env.ICHI_COLLECTION_CONFIG="绝对配置路径"; await import("file:///绝对项目路径/skills/ichi-network-curation/scripts/capture.mjs");'。

已有50条用于只读保持检查或本地复用演练；通过resume核对已有公开回执，不能重新ADMIT。原capture/photo/hash及时间不可为了新批次改写。
