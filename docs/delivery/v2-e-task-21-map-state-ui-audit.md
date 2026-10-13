# TASK-V2-21｜Map State UI 源码状态审计

2026-09-30 Founder确认当前全部截图无误，最新截图视觉门HUMAN_APPROVED；本报告中的截图视觉待审描述已由此覆盖，历史before/旧版本不恢复。该确认不替代端上交互或云端/性能/全回归/资源审批等其他门。完整范围见[视觉验收汇总](v2-e-task-21-founder-visual-acceptance.md)。

2026-09-30 最新：Founder要求全部非首次loading状态统一为44px横条、右侧粉底白字按钮、短单行文案；搜索只显示全部且清关键词。已实现并取20组新图，几何/真实按钮tap与自动门通过，仍待Founder视觉确认。最新图集/矩阵见 [状态条统一报告](v2-e-task-21-map-state-bar-unification.md)。以下旧12组/旧分层规范是历史，不能作为当前样式。


## 2026-09-30 最新实施矩阵（以下历史审计保留）

状态：IMPLEMENTED / AWAITING_FOUNDER_VISUAL_REVIEW。Opportunity规则门已通过；目前源代码、正式微信preview及十二组当前DevTools状态截图齐备，详情性能本地优化完成但真实分段采样待执行。历史源码审计中的“仅文档/未截图/规则待答”不再是当前状态。截图通过setData注入，仅核对视觉结构；不是故障触发、真实网络、设备或Pilot取证。截图与完整图集见 [UI polish](v2-e-task-21-map-state-ui-polish.md)。

| 状态/触发 | 当前截图 | 覆盖地图/已有Marker | 标题与解释 | Primary/Secondary action | 恢复条件/语义检查 |
| --- | --- | --- | --- | --- | --- |
| Initial Loading：无数据首屏请求 | 07 | 有界主卡，外围可拖动；无Marker | 正在寻找公开线索；首次载入需要时间，仍可拖图 | 等待 / 手动浏览 | 请求成功或明确错误；不宣称附近无库存，不用于每次刷新 |
| Empty viewport：query成功空且无搜索筛选错误 | 04 | 小型non-blocking提示；无Marker，定位/刷新可用 | 此视野暂无公开线索；拖缩查看其他区域，公开记录非实时库存 | 拖缩地图 / 定位、刷新 | 视野或公开结果改变；不泛化为真实无版面 |
| Search no result：搜索无匹配 | 02 | 搜索相关底部小卡；保留地图手势；显示匹配结果0 | 没有匹配的线索；限定当前视野搜索，试其他词或全部 | 清空搜索 / 显示全部 | 清词、变词、变视野；与服务错误/空视野分开 |
| Filter no result：OR状态筛选无匹配 | 03 | 同底部小卡；保留地图手势；匹配结果0 | 当前筛选没有匹配；限定所选状态 | 显示全部 / 换筛选、手动浏览 | 状态/视野变化；不声称附近无版面。全取消为显式无状态选择提示 |
| Service unavailable：无保留数据且error | 01 | 有界主卡；外围手势保留；无Marker | 公开线索暂时无法载入；失败不表示此区域没有版面 | 重新载入 / 手动浏览 | 服务恢复；unauthorized恢复身份、rate limited保留各自error语义 |
| Offline：明确network none/isConnected=false且有数据 | 05 | 顶部banner；Marker保留 | 当前离线；保留上次公开线索，连网可刷新 | 重试连接 / 手动浏览 | 连网和请求成功；仅明确网络信号触发，不由服务失败推断离线 |
| Retry/recovering：cursor失效自动恢复首屏 | 11 | banner；已有Marker保留 | 分页位置已失效，正在重新载入首屏 | 自动等待 / 手动浏览 | fresh root成功或独立error；不复用失效cursor |
| Location denied：PERMISSION_NEEDED | 06 | 定位小提示；Marker和地图保留 | 定位未授权，仍可手动浏览地图 | 手动浏览 / 用户再次主动定位 | 用户主动授权后定位；不强迫权限，不改公开位置精度 |
| Stale/refreshing：缓存年龄或显式刷新 | 09/08 | banner；已有Marker保留 | 客户端缓存已过期/正在刷新；单条发布时间仍独立显示 | 刷新缓存 / 手动浏览 | fresh query成功；客户端cache age不替代server Freshness/Opportunity |
| Pagination error：next请求失败 | 10 | banner；已有Marker保留 | 下一页暂时无法载入，已有结果保持可见 | 重试下一页 / 手动浏览 | retryPagination成功或cursor恢复；不清已取数据，不写全域无结果 |
| Refresh failed with retained data | 12 | banner；已有Marker保留 | 刷新暂时失败，保留上次公开线索 | 重试 / 手动浏览 | fresh root成功；不覆盖全地图，不以旧结果伪装fresh |

UI本轮发现并修复status slot缺定位，十二组取图均已查看；这一轮没有Founder真机视觉或实际网络故障验证。无新品牌资产/Marker结构重设计。正式preview1002158 bytes，production dev/fixture=0。最终自动验证与只读安全回读见 artifacts/task21/local-prepilot-verification-20260930.json；新云端写入0，完整V1 cloud diff仍未重跑。Founder视觉门未自动通过，TASK21仍Pre-Pilot、TASK22锁定。

## 初始审计历史


日期：2026-09-30（Asia/Shanghai）。阶段：Pre-Pilot Closure B。状态：`SOURCE_AUDIT_COMPLETE / CURRENT_SCREENSHOT_EVIDENCE_PENDING`，不是 UI implemented 或 Founder visual PASS。

Pre-state：TASK20 已完成空视野拦截修复；状态视觉仍为 TASK21 输入。当前 TASK21 停在 Opportunity 规则门，本阶段仅做源码审计，不修改页面或打开浏览器／设备界面。

## 当前状态矩阵

下表“覆盖／保留”来自 `pages/home/index.{ts,wxml,wxss}` 与 `platform/public-map-client.ts` 的源码条件；**每行当前截图均为 NOT_CAPTURED_THIS_PHASE**。不能用 TASK20 用户文字回报或历史二维码代替当前截图。状态标题缺失处直接标“无独立标题”。

| 状态与触发 | 地图覆盖／已有 Marker | 当前标题／解释 | Primary／Secondary | 恢复条件与语义风险 |
| --- | --- | --- | --- | --- |
| Initial Loading：无 retained 数据发起 root | map-stage 整面半透明 overlay；暂无 Marker；浮动按钮卸载 | 无独立标题；“正在载入公开线索”＋loading dot | 自动等待／无 | root 成功或明确 error；不能因 viewport 每次刷新重回整屏 loading |
| Empty viewport：成功 query 空、无 error／search filter mismatch | 当前不覆盖，地图可拖缩；浮动定位／刷新可用；无 Marker | 无专属 empty 提示 | 既有地图刷新／手动拖缩定位 | 新区域或新 query；保留 TASK20 修复，不能重新引入遮罩拦截 |
| Search no result：已有 state.items，本地搜索 visibleItems=0 | discovery 整面 overlay；原 state 数据仍在，实际 Marker 隐藏；浮动按钮卸载 | 无独立标题；“没有匹配此 IP / 关键词的公开线索” | 清空搜索／无 | 清空或改关键词；词义正确但盖图。若服务器原始 items=0，当前不产生 search no-result 文案，必须处理该组合 |
| Filter no result：items 存在，少选后无匹配 | 同一 discovery 整面 overlay；浮动按钮卸载；当前 chips=false，普通用户路径无法操作少选 | 无独立标题；“当前筛选组合暂无公开线索” | 搜索非空时清空搜索，否则没有按钮／无 | 改筛选；恢复后不能让“筛选没匹配”变成附近没有 |
| Filter 0 selected | 根层独立 light-capsule 弹窗；普通 candidate chips=false，正式 UI 当前不可到达 | “未选择筛选条件”（历史零选路径） | 显示全部／关闭行为沿既有 handler | 重置全部；不把 dormant 测试路径记正式可达 PASS |
| Service unavailable／首次读失败：error 且 rendered markers=0 | map-stage 整面 overlay；无可用 Marker；浮动按钮卸载 | 无独立标题；通常“地图服务暂时不可用。” | 重试／无 | 成功重读；不能暗示真实地理范围无供给 |
| Service unavailable／刷新失败已有数据 | 不整屏；error banner；保留 allowlisted Marker | 同一通用错误文案 | 重试／仍可浏览 | 重试成功；retained 数据不是重新核验 current，需保留年龄／缓存说明 |
| Offline：candidate call Promise 失败 | 当前没有独立 OFFLINE state；归并 SERVICE_UNAVAILABLE；有数据则 banner 保留，无数据则整面 | 同一服务不可用文案，不能辨“离线” | 重试／无 | 网络恢复后请求成功；TASK20 飞行模式文字回报仅为历史设备证据；未来按可信网络信号区分离线，不能根据任何服务失败就猜离线 |
| Retry／recovering：refresh、viewport refresh、cursor recovery | 有 retained 时 status banner 保留；无数据 root 则 initial loading；无错误的 EMPTY viewport refresh 不再触发恢复遮罩 | “正在刷新／正在加载此区域，已有结果保持可见”；cursor 另提示重载首屏 | 等待／地图可继续浏览 | latest generation 成功；不能继承 T20-P1-02 的手势后全屏误报 |
| Location denied／manual browse：getLocation/auth 失败 | 不覆盖、不改变公开 eligibility，Marker 不因拒绝定位清空；按钮状态 PERMISSION_NEEDED 或 UNAVAILABLE | toast：“定位不可用，仍可手动浏览地图” | 手动浏览／既有定位按钮主动重试 | 用户主动恢复系统权限后回当前位置；toast 短暂，无持续区域说明；不强迫授权、不误提示相机权限 |
| Stale cache／refreshing | status banner，不整面；缓存存在则保留 allowlisted Marker | “客户端缓存已过期；每条线索仍直接显示相对发布时间。” | 刷新缓存／继续浏览 | root 成功；现有措辞“发布时间”与 trusted observedAt 需统一，不改变 Freshness 阈值 |
| Pagination error：下一页读失败 | status banner，保留 root 已有 Marker；WXML 对应正式分支，50/页可达 | 无独立标题；mapErrorMessage | 重试下一页／继续浏览 | retryPagination 成功；不能当完整区域无结果或 root 全失效 |
| Native render failure：mapNativeRenderError | 独立整面 overlay；已有服务数据不代表图片可渲染；浮动按钮卸载 | “地图渲染暂时不可用” | 重试（onMapRefresh）／无 | 正常 binding/render；需与网络／服务故障分辨 |
| Unauthorized / schema unsupported / rate limited | 公共稳定 error code 映射，是否整面取决于可保留 Marker | 账号状态恢复／版本不支持／请求较多 | 当前同一重试壳，handler 对 unauthorized recoverIdentity、rate 等行为各异／无 | 不合并错误意义；schema 不可恢复时不能提供假有效重试 |

## 结构实施要求与复用边界

用现有黑白／青绿／玫红、真实 V1 mascot／light-capsule、已批准间距／圆角／typography 实现状态层级，不修改 Marker、Picker、单卡布局。全局首次失败可以有明确主区域；搜索／筛选无结果放在搜索相关的有界区域并保留地图操作；离线／刷新失败保留旧公开 Marker 和 non-blocking 提示；定位拒绝明确手动浏览。

已存在 asset 可先复用，不生成新最终姿态。若确需新增吉祥物姿态且无资产，标 `FOUNDER_VISUAL_ASSET_DECISION_REQUIRED`、结构占位和 handoff；不因此伪造资产或阻塞已有结构。

完成结构、相关回归和正式微信 preview 后，必须收集 Service unavailable、Search no result、Empty／Filter no result、Offline retained-data、Location denied 至少五组当前截图／真机预览。Founder 确认前仅 `IMPLEMENTED / AWAITING_FOUNDER_VISUAL_REVIEW`；此源审计没有达到该状态。实际 polish 阶段再生成 `v2-e-task-21-map-state-ui-polish.md`。

## 执行记录

Files changed：仅本审计及本次准备报告／current status 文档。Product decisions：沿用本次命令状态语义，不新增已冻结阈值／视觉批准。Backend/frontend/data-contract changes=0。External actions=0；cloud resources/config=0；未 UI 自动化、微信 preview 或本轮设备采集。

Tests/builds：本轮文档检查见 Opportunity 决策表；无本阶段实现回归。Founder evidence：TASK20 历史空视野／离线／定位回报保留；本阶段五组当前视觉 evidence=PENDING。Failures/fixes：只定位结构缺口，无本轮修复；T20 三项 P1 的历史通过不撤销，也不替代新视觉 gate。P2 详情延迟开放，未发现新增已确认 P0/P1/P3。

Privacy/security：不采集位置／身份、不读 V1 private。V1_DIFF：TASK20 历史最终 0 / VERIFIED，本轮不冒充 cloud read-back。Rollback：只本地文档；cost：无云动作／账单；Git：dirty `feature/v2-board-map` 保留，无 commit/push/发布。Current gate：Opportunity rule Founder decision；本阶段截图／UI 实施未完成；next：规则决策后继续结构实现与 Founder 视觉门。