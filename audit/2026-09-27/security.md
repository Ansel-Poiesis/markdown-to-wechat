# 安全与事务完整性审计

日期：2026-09-27。基线：`origin/main@1182575`，工作分支：`codex/audit-20260927`。结论：**patch candidate**；本报告记录离线证据，不代表正式发布、真实服务验收或绝对安全保证。

## 范围与授权

检查并修改 Electron 主进程、微信 HTML 门禁、MiMo SSE/编辑事务、反馈传输边界；不调用真实 MiMo、不发送反馈/邮件、不读取实际 API Key、不发布产物。测试中的 `fetch`、Electron 生命周期、IPC 和 `shell.openExternal` 均由 mock 代替。

资产包括：文章与草稿、人工编辑、撤销历史、会话或系统 API 凭据、付费请求额度、反馈隐私、宿主系统外部程序入口。输入边界包括：Markdown/生成 HTML、样式字符串、第三方 SSE 响应、IPC 调用方与参数、反馈端点响应。攻击模型包括恶意文章/样式、损坏或停滞的远端响应、非主 frame IPC、用户操作与异步返回竞争。

## 已证实问题与修复

| 等级 | 缺陷与复现证据 | 修复 |
| --- | --- | --- |
| P1 | AI 请求后继续编辑，晚返回结果直接覆盖新正文；重复确认发出多个请求；取消后不遵守 signal 的调用仍写回 | 同步内容 revision、单请求锁、应用前取消/版本检查、卸载时取消；文档 ID 切换使请求与撤销失效。前端协作 agent 将 `activeDraftId` 注入 EditorPane |
| P1 | 主进程接受任意 webContents/子 frame 的 `mimo:format` 与状态查询；未限制超大 tokens/model 参数 | sender 对象、主 frame 对象和精确应用 URL 三重检查；固定模型集合、1..8000 tokens、温度与 reasoning 范围、请求 ID/输入长度检查；仅一个活动请求，取消也校验来源 |
| P1 | 固定收件人邮件链接仍可携带 `?bcc=...` 或 CRLF subject，突破接收方限制 | mailto 仅允许唯一 `subject`、`body`；拒绝额外头、重复字段、片段和主题换行 |
| P1 | API key 请求默认跟随重定向；主进程 endpoint 允许非标准端口和额外路径 | 浏览器/主进程都设置 `redirect: error`、`credentials: omit`；主进程 HTTPS + 两个配置域名 + 固定 completions 路径，禁凭据、端口、query/hash |
| P1 | 损坏 JSON、对象型 token、`content_filter` 等截断后跟 `[DONE]` 被当成成功，可能将部分正文写回 | 严格解析 JSON/类型，明确拒绝非 stop 结束原因；遇到有效 stop/DONE 即结束，取消 reader；HTTP 错误不再回显第三方原始正文 |
| P2 | 请求与流没有 timeout/体积限制；终止标志后仍等连接关闭 | 120 秒总超时；输入 500,000 字符、输出 1,000,000 字符、单事件 256,000 字符、传输总量 8,000,000 字节；timeout/cancel/failure 清理 reader、controller、listener 与活动请求。默认模型输出上限仍为 4,000/8,000 tokens |
| P1 | CSS `u\\72l(...)`、注释、`image-set(...)` 等通过旧门禁 | 拒绝 escape/comment/at-rule/control；样式函数只接受排版所需白名单。属于门禁策略绕过复现，未声称已证明完整原生代码执行攻击链 |
| P2 | leafify 将属性内 `>` 当成标签结束，破坏 HTML；12,000 层 HTML 导致递归遍历栈溢出 | 引号感知线性扫描；AST 使用显式栈；CSS 仅检查 style 属性，避免正文代码示例误报；仅检查实际中文文本节点，避免图片 alt 误报缺少 leaf |
| P1 | 反馈诊断原样携带页面 query/hash/本机文件路径；自定义 endpoint JSON 展开整个对象可捎带正文/Key 等额外属性 | URL 移除 userinfo/query/hash，file 地址用本地应用占位；传输数据按固定字段投影，校验长度/类型；诊断额外属性不进入传输 |
| P2 | 自定义反馈端点 HTTP 200 + `accepted:false` 仍显示发送成功；`ftp://localhost` 被当作允许协议 | 自定义端点要求 `accepted:true`；FormSubmit 保持 `success:true`；只允许 HTTPS 或 loopback HTTP，拒绝 endpoint userinfo/hash，禁重定向 |
| P2 | 桌面没配系统 Key 时 UI 要求输入会话 Key，但流函数仍强制调用缺 Key 的主进程 | 显式会话 Key 使用同一有界浏览器路径；未提供 Key 时使用 Electron 凭据代理。离线 mock 已验证路由，真实供应商 CORS 尚未验收 |

## 证据与覆盖

先构造回归再修改：第一批 AI/CSS/SSE 为 **15 失败**；Electron 为 **7 失败 / 1 通过**；反馈为 **4 失败**。追加用例又确认了 progress 回调内取消、图片 alt leaf 误报、桌面会话 Key 路由三个失败。它们已在修复后通过；这些是失败用例数量，不等于独立漏洞数量。

最终定向命令（2026-09-27）：

```powershell
npx vitest run src/composables/useAiFormatting src/composables/useMimoStream src/utils/wechatHtml src/services/feedback electron/main.security.test.mjs --reporter=dot
```

结果：**9 个测试文件、69 个测试通过**。其中新增安全文件 5 个，新增 46 个用例，其余为原有回归。还通过 `npm run type-check`、本次 11 个文件的 ESLint 与 Oxlint；完整工程验证由主审计执行并记录。

新增测试：

- `src/composables/useAiFormatting.security.test.ts`：编辑竞争、编辑后还原、重复请求、取消晚结果、同内容跨草稿、撤销历史隔离。
- `src/composables/useMimoStream.security.test.ts`：预取消、桌面会话 Key、损坏/过滤/非文本响应、请求重定向选项、已结束但不关连接、进度回调取消、120 秒假时钟超时与清理、逐字节中文/emoji UTF-8、超大事件/输出/传输。
- `src/utils/wechatHtml.security.test.ts`：CSS 混淆与另类资源函数、属性引号、12,000 层树、正文代码误报、图片 alt 误报。
- `electron/main.security.test.mjs`：无关 webContents/子 frame、固定邮件地址/头、额度与端点检查、重定向选项、损坏流、超时重试、并发与受限取消、导航/重定向拦截。
- `src/services/feedback.security.test.ts`：URL 敏感片段、未知字段外发、显式回执、协议限制。

## 剩余风险与后续门槛

1. **HTML gate 是兼容性预检，不是安全隔离边界。** 预览先插入生成的 HTML；gate 问题进入预检警告，用户仍可选择“仍然复制”，HTML 导出也不以 gate issues 阻断。只有渲染/验证过程抛出异常形成 `renderError` 时，UI 才硬性禁用复制和导出。生成层必须独立安全；本轮已修复属性编码与样式值规范化，并由主审计汇总回归。通用 profile 的 HTML 同样须独立保持安全。
2. **模型“零删改”只是提示词约束。** 完整 SSE 仅证明传输完整，不证明语义完整、措辞不变。建议下一轮增加差异预览/人工应用确认，验证关键数字、段落与链接；不能用本轮 mock 报告保证模型保真。
3. **真实桌面进程尚未验证。** VM 验证 IPC 逻辑与导航处理；正式候选需要实际 Electron 启动、主 frame 状态、取消、应用重载、邮件草稿边界 smoke。不得据此声称真实邮件送达或真实 API 成功。主 frame 校验不能使已经遭到脚本注入的主页面重新可信，因此仍依赖渲染层防注入。SSE 消费器按供应商的一行 JSON `data:` 事件合同实现，不声称支持任意多行 SSE 数据格式。
4. **外链图片依然会联系其 URL。** 这是现有产品能力，协议允许 HTTP(S) 和受限 raster data URL；本轮不增加远端图片隐私代理/离线模式。导入不可信内容时仍可能触发图片服务的访问记录；应在产品隐私说明或后续离线预览设计中明确。
5. **门禁的 parse5 仍需按输入大小分配内存。** 已消除递归栈溢出与 SSE 无界分配；不是任意大小输入的拒绝服务证明。全工程长文压力由 renderer agent 另测；正式支持上限应依据真实浏览器内存/响应性确定。
6. 浏览器与 Electron 的流协议实现保留两处实现，当前回归分别覆盖；未来可提取运行时无关协议模块减少漂移。自定义反馈端点现在必须返回 JSON `{ "accepted": true }`，私有集成若仅返回空 200 需更新合同。

没有执行付费调用、真实发信、Release/Pages 发布、Products 晋级或长期记忆修改。
