# Markdown 核心正确性与有界压力审计

结论：需要补丁。原有门禁测试能证明已选样例的 HTML 合规，不能证明解析器正确；基线 `1182575` 的 7 项独立缺陷样例全部复现失败，本轮修复后全部通过。仍不能宣称完整 CommonMark/GFM 支持或任意输入绝无错误。

本轮仅改核心解析、结构扫描、组件合法嵌套、测试与复验脚本；未发布、未改正式版本号。前端预算错误接收与安全门禁由同轮其他 Agent 集成。

## 已复现并修复

| 优先级 | 原问题和影响 | 本轮处理 |
| --- | --- | --- |
| P1 | 行内先转义再解析，URL `&` 变成 `&amp;amp;`，图片 alt 重复转义；强调正则会改写已生成的 src/alt 属性 | 原子化保护代码、链接、图片、转义符；内容/属性只在 HTML 边界编码一次 |
| P1 | 行内代码中的 Markdown 链接、图片、粗体仍被解析，代码示例不可信 | 等长 backtick 配对、代码原子 token；支持代码内单 backtick 的双 backtick 写法 |
| P1 | 代码块内 `[^id]: text` 被脚注预扫描删走；四 backtick 内三 backtick 提前闭合；tilde 围栏不识别 | 结构分析、脚注预扫描和渲染共用长度/marker 匹配的 fence API |
| P1 | 极密 inline code 输入在 384 MiB heap 限制下触发 OOM | 增加输入、行数、格式 token、结构 token 和 HTML 膨胀预算；解析 HTML 前有界拒绝，抛出 `MarkdownRenderLimitError` |
| P1 | 宽表头与大量短行先做笛卡尔式补齐，可能在预算前分配巨量单元格；标题清理正则对未闭合方括号平方扫描 | 表格在补齐分配前预扣全部单元格预算；标题文本提取改为线性配对扫描 |
| P2 | 每次外链引用 filter/find 全量列表，复杂度随外链数平方增长；嵌套列表子项先编号 | Map 索引去重，列表捕获时分配编号；链接只在脚注内出现时也进入附录 |
| P2 | escaped/code pipe 被拆成额外表格列；单列表格不识别；缺列/多列结构不一致 | 对 pipe 按转义/代码边界扫描；以表头列数补齐/截断 |
| P2 | 有序列表忽略原始起始号；子列表放入 p/span 导致浏览器重排 | 保留起始号，兼容 `7)` 标记；嵌套列表使用合法 block 容器 |
| P2 | 嵌套引用被压扁；callout 内标题进入目录但正文并未作为标题渲染 | 保留引用层次，深度 32 后剩余 `>` 按字面保留；目录忽略 callout 内伪章节 |
| P2 | 高亮只识别短语言名、跨行注释断裂、未闭合注释正则可能反复扫描；重复空格被 HTML 折叠 | 常见语言别名、线性 token 扫描、跨行注释按行保持同色；代码所有文本空格转 NBSP，tab 按四空格显示；未知语言保持原文 |
| P2 | 主题样式属性未 HTML 编码，含双引号的值可突破属性边界 | renderer 和 themeComponents 的 style 属性统一编码；CSS 合法性由安全门禁另行检查 |

## 证据和复验

- `renderer-baseline-fixtures.json`：从 `git show 1182575:src/utils/markdownRenderer.ts` 动态载入基线核心，7/7 样例失败。**这是核心差分，主题组件和 gate 依赖来自当前工作区，不是完整旧版应用快照。**
- `renderer-fixed-fixtures.json`：相同 7/7 样例通过。
- `src/utils/markdownRenderer.regression.test.ts`：新增 23 项回归，articleStructure 另增 1 项；与原有 renderer/article/service 测试共 **58 项通过（4 文件）**。
- 定向 `oxlint` 0 warning/0 error；`vue-tsc` 已通过。最终整仓 verify 由根 Agent 统一执行，不能用本报告替代。
- `renderer-stress-before-limits.json`：本轮加入预算前压力原始记录，保留 `backticks_200k` 的子进程 OOM，不能误当原始版本的全量 benchmark。
- `renderer-stress.json`：预算后的 22 种场景全部符合预期，其中 14 种成功输出、8 种明确拒绝超限；没有把拒绝计作成功渲染。

```powershell
npm test -- src/utils/markdownRenderer.regression.test.ts src/utils/markdownRenderer.test.ts src/utils/articleStructure.test.ts src/services/wechatRenderer.test.ts
npx tsx --tsconfig tsconfig.node.json scripts/render-core-fixtures.ts --baseline 1182575 --output audit/2026-09-27/renderer-baseline-fixtures.json
npx tsx --tsconfig tsconfig.node.json scripts/render-core-fixtures.ts --output audit/2026-09-27/renderer-fixed-fixtures.json
npx tsx --tsconfig tsconfig.node.json scripts/render-stress.ts --output audit/2026-09-27/renderer-stress.json
```

## 压力结果与预算合同

环境、Node 版本和测量时间详见 JSON。每个场景独立 Node 子进程、15 秒超时、`--max-old-space-size=384`。预热极小输入后测一次核心渲染及微信验证；以下是同机单次观察值，并非 p95，也不包含浏览器布局/滚动、剪贴板或微信公众号后台处理。

| 场景 | 输入规模 | 结果 | 时延 ms | 结束 heap MiB | 结束 RSS MiB |
| --- | --- | --- | ---: | ---: | ---: |
| 中文长段落 | 1,000,008 字符，约 3 MB UTF-8 | 合规输出 | 90.78 | 77.12 | 177.07 |
| 不同外链 | 5,000 条 / 227,779 字符 | 合规输出 | 183.46 | 87.21 | 165.00 |
| 无法闭合的链接标记 | 200,000 字符 | 字面文本合规输出 | 18.11 | 26.38 | 86.17 |
| 未闭合方括号标题 | 200,002 字符 | 合规输出 | 20.81 | 31.91 | 87.66 |
| 未闭合注释 | 200,011 字符 | 合规输出 | 12.47 | 26.56 | 85.83 |
| 嵌套列表 | 深度 512 / 265,215 字符 | 合规输出 | 33.15 | 27.83 | 85.96 |
| 嵌套引用 | 20,000 个 `>` | 深度 32，余下字面保留 | 9.86 | 25.01 | 81.39 |
| 复杂表格 | 4,000 行 / 68,028 字符 | 合规输出，约 1.95 MB HTML | 218.27 | 111.89 | 183.42 |
| 密集行内代码 | 200,000 字符 | 预算拒绝（此前 OOM） | 50.89 | 32.47 | 100.54 |
| 复杂表格 | 5,000 行 / 85,028 字符 | 结构预算拒绝 | 75.74 | 33.04 | 103.69 |
| 表格补齐膨胀 | 2,000 列 × 10,000 短行 / 60,002 字符 | 在补齐前拒绝 | 5.45 | 21.22 | 80.37 |

预算以 JS 字符串的 UTF-16 code unit 计数，不等于 UTF-8 字节或中文词数：原稿最多 2 Mi 字符、50,000 行；行内格式最多 10,000 token；累计结构最多 20,000 token；最终待 leafify 的 HTML 最多 4 Mi 字符。结构预算含行内 token、段落、列表项、代码行、表格单元等，不能把它理解为 DOM 节点的精确数量。预算在构造期间计数，最终 HTML 在 parse5 前复核；它是可维护的保护阈值，不是任意输入的内存上界证明。Heap/RSS 是结束快照，未测峰值。

## 尚未解决和优化次序

1. **P1：浏览器隔离与反馈。** 根/前端本轮应确认预算异常保留原稿、有明确提示、不能复制空/残留结果。后续把核心搬到 Web Worker，做取消/过期结果淘汰；主线程同步 200 ms 渲染仍会阻塞交互。
2. **P1：明确语法合同，再引入成熟 parser 的 token/AST。** 当前是针对文章排版的子集，不符合完整 CommonMark：`__...__` 有意表示下划线；复杂嵌套 emphasis、reference links、list continuation、hard breaks 等尚无完备合同/测试。不要宣称全语法正确。保留现有主题组件作为输出层，先对同类开源项目支持的 parser 做差分样例，再逐步替换解析层，避免一次重写主题视觉。
3. **P2：真实公众号 round-trip。** 新增测试和 gate 无法证明微信粘贴后空格、代码换行、图片、超宽表格、所有 9 主题完全保真。用同一篇带代码/图/嵌套列表/脚注的文章在微信后台粘贴，保留原 HTML、粘贴后 HTML、手机预览截图作版本门禁。
4. **P2：可访问性和语义。** 当前列表为内联样式 section 加可见序号，引用同样是 section；可视层正确不等于屏幕阅读器语义完善。generic profile 可以后续使用真实 ol/ul/li/blockquote/pre/code，同时与微信 profile 分开验证。
5. **P2：测量长期化。** 把这里固定场景加入手动/夜间 CI，有界子进程运行，保存时间和输出规模趋势；扩展浏览器长文输入/切主题/复制的 p50/p95 与峰值内存。阈值需按可支持设备实测，不凭一次 Node 成功扩大。

本报告未使用外部付费 API、未发布、未修改长期记忆。测试和静态分析只缩小已知风险，不能替代对任意输入的数学证明或人工视觉验收。
