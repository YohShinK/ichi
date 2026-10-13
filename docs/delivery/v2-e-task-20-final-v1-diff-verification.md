# TASK-V2-20｜最终 V1 同形差异核验

日期：2026-09-30（Asia/Shanghai）。阶段：preflight、M1窗口结束与全部补测最终停机回读。三次均 `V1_DIFF=0 / VERIFIED`，覆盖TASK19冻结结构基线保存的全部资源字段。最新停机epoch=25；最终证据为 `artifacts/task20/final-v1-diff-and-stop-state-20260930.json`。

## 最新最终回读

完成定位、synthetic失败重试与真实单贡献删除后，再次重新取回全部13集合、43索引、13 ACL、19 V1函数详情／环境值哈希／runtime／4 trigger、environment function security rules、2个Storage根对象及CUSTOM bucket rule。所有历史同形比较字段／hash精确匹配，索引复合字段顺序保留，未使用上一窗口结果代替。QPS／EnableOverrun为命令明确排除的动态字段。

8 shadow函数Active／Available、0 trigger、全部ENABLED=false、TEST_CALLER_DIGESTS空、unused ALLOWLIST键不存在；完整environment键值与preflight相同（secret值只在内存比较）。read-stop=true、epoch25、HA pause=true、lifecycleState=PUBLIC count=0、7条UI行HIDDEN／HIDDEN。b2r4 source整个文档恢复到原值；新upload／STATE仍DELETED且noResurrection=true，旧outbox处理及重放未复活，原b2r5上传ACTIVE。保存audit/tombstone，未新增云资源或V1 mutation。

结论：V1_DIFF=0 / VERIFIED，SAFE_STOP_VERIFIED=true。其余设备与身份缺口按Founder最终命令记录，不改变本次资源零差异结论。

## 基线与方法

- 基线：`/tmp/ichi-task19-v1-readonly-baseline.json`，生成于 2026-09-25T08:12:50.901Z；生成命令可追溯至 TASK19 session 的第 2799 行。基线本次未修改。
- 环境：`cloud1-d7gxqfwv783a1f131 / ap-shanghai`；当前通过 CloudBase MCP 只读读取，不访问 V1 私有业务记录。
- 可审计结果：`artifacts/task20/final-v1-diff-preflight-20260930.json`。环境变量仅在内存计算哈希，不写值、身份 digest 或密钥。
- 13 集合按名称比较；43 索引将 BSON `$numberInt` 与 API 数字同形化，保留复合索引字段顺序、方向、unique 和 expiry；13 ACL 精确比较。
- 19 函数比较 ModTime、CodeSize、runtime、environment hash 和 4 trigger；trigger 投影到历史保存的字段，不把新 API 附加字段误作 mutation。`release-recognition` 空环境变量 `Variables:[]` 归一到历史 `Variables:null` 后精确匹配。
- 基线只保存哈希的 Storage 字段按原 CLI 的输出代码重建同形 bytes；对象字段顺序为 key、lastModified、eTag、size，逐对象 JSON 字符串排序后再次 JSON 序列化。规则字段顺序为 acl、aclDesc、rule；旧 CLI 的英文 `aclDesc` 为 `Custom security rules`。本轮哈希全部精确匹配，无需重新登录 CLI。
- 环境 QPS、EnableOverrun 等套餐／动态字段按本轮命令排除；不把它们列为 V1 frozen structural resource。当前套餐 ID 仍为 baas_personal。未将基线未保存的配置字段宣称为逐字节历史比对证据。

## 结果

| 资源 | 数量／比较字段 | 结果 |
| --- | --- | --- |
| V1 collection | 13 个名称 | 0 diff |
| V1 index | 43 个，复合字段顺序／方向／unique／expiry | 0 diff |
| V1 ACL | 13 条，均 ADMINONLY | 0 diff |
| V1 function | 19 个，代码元数据／runtime／环境变量 | 0 diff |
| V1 trigger | 4 个历史字段 | 0 diff |
| Environment function security rule | ACL 与规则原文 | 0 diff |
| Storage root | 2 对象，完整基线输出 hash | 0 diff |
| Storage bucket rule | CUSTOM，完整基线输出 hash | 0 diff |

Storage root SHA-256：`6aa0e2235df18bf4339c2c0add94efd6050e665237aea5a3de3449eb5b58b3ce`。

Storage rule SHA-256：`feb942c460002a5ac607789dc2acc1b2e487d9ceb92ad5d093046dbd87d076a4`。

Preflight 停机态：8 shadow 函数 Active／Available、0 trigger，所有临时 flags=false、caller allowlist 空；read-stop=true、read epoch=20、HA pause=true、PUBLIC=0。没有云资源新增、V1 写入、Storage 内容下载或业务记录读取。此为历史preflight；最终epoch25重新回读已见首节，不以preflight代替。

## M1 窗口结束后的完整回读（历史epoch23）

证据：`artifacts/task20/final-v1-diff-after-m1-20260930.json`。重新获取 13 V1 集合／43 索引／13 ACL／19 函数详情，19 个函数环境哈希、ModTime、CodeSize、Runtime 和历史 trigger 全部相同。环境函数权限原文、2 个 Storage 根对象和 Storage CUSTOM 规则重新取回，按上文同形方法再次精确匹配历史 hash。未使用 preflight 缓存冒充新回读。

8 个 shadow 函数 Active／Available、0 trigger，全部 ENABLED=false、实际 TEST_CALLER_DIGESTS 空。首轮误加的未使用 TEST_CALLER_ALLOWLIST 键已物理移除，query/detail 的环境变量完整恢复到 preflight 配置；使用腾讯云官方已定义的 [UpdateFunctionConfiguration](https://cloud.tencent.com/document/api/876/137946) 配置接口，未部署代码。read-stop=true、epoch=23、HA pause=true、可服务 PUBLIC=0。7 条本轮 synthetic UI 行保持 HIDDEN／HIDDEN，历史证据行保留。

此时 `V1_DIFF=0 / VERIFIED / SAFE_STOP_VERIFIED`。定位关闭／恢复与 F3 单贡献删除尚未完成，不能用 V1 成功替代整 TASK20 gates。
