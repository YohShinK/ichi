# TASK22 Phase8 上线前回归、备案展示与代码归档

当前状态：**LOCAL_REGRESSION_PASS / NATIVE_LAYOUT_PASS / PRODUCTION_PUBLIC_SMOKE_PASS / WECHAT_UPLOAD_PENDING / GITHUB_ARCHIVE_PENDING / ACTUAL_PUBLICATION_NOT_CONFIRMED**。当前唯一工作集为V2-E/TASK22 Phase8；不解锁V3。

## 本轮实现

- 备案号按本人最后更正原样配置为“浙ICP备2026084653号-1”，置于“我的”底部：12px、灰色、居中、无新增卡片，完整编号不省略。短屏可滚动，资料与菜单不挤压裁切。微信查询按钮明确复制https://beian.miit.gov.cn/，复制失败显示恢复说明；网页为直接官方链接。
- 依据[腾讯云悬挂说明](https://cloud.tencent.com/document/product/243/61412)和[工信部通知](https://www.gov.cn/zhengce/zhengceku/202308/content_6897341.htm)，设置/介绍等可找到位置应展示备案信息并提供查询。本轮不把用户提供的编号冒称已通过后台有效性/小程序完整编号核验，也不把网址复制冒称web-view直达或全部备案展示合规。微信后台当前完整编号与主体/类目/隐私声明需在提审前核对。
- 本人资料与编辑说明改为当前用途：本人资料；同意现行地图贡献条例后的合格公开版面可展示安全昵称与头像。上传分享流程与公开准入不变，分享防回退门通过。
- 原网页预览依赖本人Downloads中的HTML及两幅公开UI图。三个原文件逐字节归档至apps/web/source，三个API改读仓库文件，原SHA和素材保持；该网页仍是历史V1基线，不冒称V2生产地图。
- Vitest排除历史artifacts/部署复制品/导出，当前源码及根测试仍执行；CI显式配置绝对Python解码运行时与Pillow12.3.0（官方PyPI存在、支持Python>=3.10），解决归档后的测试依赖。

## 敏感信息与归档边界

Gitleaks8.30.1官方发行包校验SHA后，分别扫描项目目录、全部Git历史和提交候选。目录原346项主要是开关名、fingerprint、内部来源链接/取证；源码2项均为既有secret binding的说明文字，不含值。Git历史6项实际是生成SDK中的LANG_HEADER_KEY/apiFailMsg表达式，不是凭据。两处确切说明文字通过受限文件/匹配规则登记，候选扫描实际返回no leaks found。辅助个人信息模式检查只命中合成测试身份、构建缓存数字及依赖作者邮箱，不能据此声称所有二进制照片/视频语义均已核看。

artifacts、exports、.cloudbase、tmp、真实环境/私钥、增量构建缓存及私人协议文件忽略但保留本机；apps/web/tsconfig.tsbuildinfo已解除跟踪。内部照片、审核、私有账号/定位及含来源查询令牌的证据不进入Git。拟归档约950个源码/事实源文件；实际提交树为最终依据。

本轮一次云端只读trigger工具返回了内部NETWORK operations HMAC值，被误原样转发到聊天；没有把原返回写入源码、报告或Git。后续改为脱敏摘要并清除工具结果缓存，NETWORK数据库/环境双门仍false、maintenance timer0。此事件不等于项目源码发现API密钥。该运维密钥的轮换是新的外部配置动作，尚未执行；应在再次开放NETWORK写操作前处理，不自动重放已消费部署或影响PLAYER桥接。

## 实际验证

| 检查 | 本轮结果与范围 |
| --- | --- |
| 当前完整测试 | 1520 PASS / 1既有SKIP / 0 FAIL；真实文本日志保留。JSON参数位于分隔符后未生成JSON，用真实日志生成摘要，不补造报告 |
| 最后菜单/短屏样式定向 | 146 PASS，2文件；菜单不缩小、根容器纵向滚动 |
| ESLint、双TypeScript | PASS；编号最后修正后的类型检查另存 |
| contracts / workflow / 上传分享门 | PASS，8必需事实源及当前分享合同保持 |
| Prettier | 首轮6项格式问题保留；2可编辑JSON修正，4冻结生成部署记录保留原字节并定点排除；复查PASS |
| Next生产构建 | PASS；编号最后修正后构建另存 |
| 网页Playwright | 26/26 PASS；历史V1网页回归，不代替微信或新V2网页 |
| 微信编译/预览 | 原生最终编译PASS；前一预览1056174字节；最后编号预览上传曾code10超时，原失败保留并串行重试；未上传时不能称正式版本 |
| 原生备案布局 | 最后本人更正的-1编号完整回读、12px/358×92区域、root overflow auto/菜单shrink0及截图PASS；模拟器不是手机 |
| 复制成功/失败恢复 | mocked wx PASS，不改真实剪贴板；非真机复制PASS |
| 生产公开SDK smoke | 3页50/50/33=133，132NETWORK/1PLAYER，与Phase7 ID集合一致；杭州/上海/北京3详情原事实/观察/30天/隐私通过；已删PLAYER和撤回NETWORK均LEAD_UNAVAILABLE |
| 生产控制只读 | 5当前函数Active/Nodejs20.19；NETWORK admission/maintenance环境和数据库门false、smoke false、timer0；PLAYER producer/processor true；不冒称远端全包源码SHA本轮重验 |

第一次公开检查使用了错误的harness分页字段，第二次automator第三页超时，原失败回执保留；第三次使用nextCursor和既有50行/zoom12协议，3页与详情全部成功、未触发重试。没有因这些检查重新部署或改业务数据，SDK query仅自身读计数/快照存在必要运行副作用。

## 发布与剩余门

本人授权V2分支和微信上传、之后GitHub归档。新分支为codex/v2-release-2.0.0，微信版本拟2.0.0。上传开发版本、提审、审核通过和实际PUBLISHED分别记录；不自动merge main或建立immutable tag。

没有新手机smoke、后台备案/主体/类目/隐私声明核验或实际发布证据。Phase6既有已接受未测范围与成本限制保留，不补手机性能/零成本PASS。必要手机和平台待办为提审/正式发布的后续门；本轮开发包可供本人验收。

本机证据：artifacts/task22/phase8-release-20261013/；只将本脱敏报告与可复现源码归档。敏感扫描、测试摘要、原生日志/截图、预览回执、生产只读摘要、公开smoke失败/成功、客户端源码清单均独立保留。
