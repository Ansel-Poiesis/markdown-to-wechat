# 新拟态工作台、主题与 Agent 交付

2026-09-27 · TASK-40 / 40.1–40.4 · 本地功能候选 `codex/studio-agent-20260927`，继承审计补丁 `d0b1b42`。四项实现与集成验收完成，正式版本仍为 2.0.1；未合并、推送、发布网页或安装包。

## 四项成果

| 分项 | 本轮实现 | 查看入口 |
| --- | --- | --- |
| 工作台 UI | 参照声笺真实 product.css 的灰绿表面、柔和双向阴影、内凹选中态；统一深浅模式、主题卡、编辑器与草稿操作 | [设计说明](ui.md) · [桌面](ui-desktop.png) · [手机](ui-mobile.png) · [深色](ui-dark.png) |
| 文章主题 | 九个原 ID 保留，重建封面、章节、引用、列表与阅读节奏；移除未经原稿提供的英文标语、统计和结束语 | [九主题同稿比较](theme-gallery.html) · [参数与设计](themes.md) · [第一组](themes-row1.png) / [第二组](themes-row2.png) / [第三组](themes-row3.png) |
| Agent 控制 | 严格 JSON 合同、能力发现、独立任务包、原稿保留、产物 SHA-256；控制台支持导入/预览/新草稿/导出；共享技能独立实跑 | [接口合同](../../AGENT_CONTROL.md) · [分项报告](agent.md) · [控制台](agent-panel.png) · [手机控制台](agent-mobile.png) |
| imagegen 长图 | 纸上编辑部、理性网格、墨与留白三种提示词方向；已实生成并回填纸上编辑部样稿，浏览器实际解码可回看 | [最终长图](imagegen-editorial-final.png) · [生成与核验](imagegen.md) · [回看界面](agent-image-preview.png) |

![新拟态工作台](ui-desktop.png)

## 如何使用

在工程根运行 `npm run dev`，点击右上角 **Agent**。准备交接选择稿件形态和主题；任务 JSON 可输入准确参数；“作为新草稿打开”先保存旧稿再创建新稿。生成图片通过“长图回看”选择真实文件核对，正式任务绑定由 CLI 的 attach-image 完成。

Agent 使用本机已安装的 `C:\Users\mingc\.agents\skills\markdown-renderer-agent\SKILL.md`。该文件在共享技能主根，独立于工程 Git；安装内容 SHA-256 为 `d3af706b20abf155e5320d3bc52209901882cc67dd5c8c288fcc3373b5823513`。系统技能校验通过，另一个执行链已依文档独立完成 discover → validate → render，并核验六份制品与重复任务拒绝。

```powershell
npm run --silent agent -- discover
npm run --silent agent -- validate --request task.json
npm run --silent agent -- render --request task.json --output-root jobs
npm run --silent agent -- attach-image --job-dir jobs/article-001 --image actual.png
```

`wechat` 是公众号内联文章，`html` 是独立网页，`imagegen-long` 会准备提示词与伴随 HTML。内置 imagegen 由 Agent 调用，网页没有虚构图像 API。任务目录不能覆盖；图片回执保留待核对状态。后续依现行 yxer 流程执行 validate、dry-run，再按发布授权接续，不在渲染步骤中伪造发布成功。

## 最终验证

- `npm run verify` **exit 0，29 文件 / 256 测试通过**，包括类型、ESLint、Oxlint、生产构建和密钥扫描。[完整日志](verify-final.log)。现有 CodeMirror 大分块提示仍在，不能据此声称包体已完成优化。
- 合同/CLI 43 项测试覆盖未知字段、原型/访问器、参数与正文预算、路径限制、UTF-8、任务冲突、兼容失败和回执/图片篡改。主题新增 23 项行为测试，九主题共同试稿微信静态 gate 全部通过：[主题结果](theme-validation.json)。
- 实际 IAB 浏览器检查 390、768、1024、1180、1280、1536、1600 七个 CSS 屏宽；页面不横溢，预览 scrollWidth 与 clientWidth 相等：[测量](responsive.json)。深色/浅色桌面和手机界面均已目视检查；390px Agent 抽屉横向恰好适配。
- Agent JSON 修改后旧 iframe 消失；未知字段被拒绝；独立新草稿创建，旧测试稿仍能打开；字号 17、行高 1.23、页边距 19 刷新后实际输出不变。存储测试另覆盖页边距 24 的旧迁移冲突及范围边界。
- 实际公众号复制产生 text/html 和 text/plain 两种剪贴板内容，均含试稿标题；恢复测试前空剪贴板。任务下载得到 2940-byte JSON，其 markdown 与共同试稿逐字一致，CLI validate exit 0。浏览器下载事件监听超时，但实际下载文件已落盘并独立验证，未将监听超时误判成下载失败。
- 最终 PNG 已由浏览器解码，识别为 **941 × 1672 / 1,975,304 bytes**；CLI attach-image 校验并接回同一文件。[附件回执](image-attachment-receipt.json)。原稿、生成提示和定向编辑提示随报告保存。

## 在验收中修掉的问题

1. 预览先适配再放大导致横向溢出：缩放上限改为实际可用宽度；1600px 大屏断点的三栏最小宽度也补做预算与实测。
2. Agent 新输入仍能操作旧预览：在字段、JSON、原稿或工作区变化时使旧结果失效。
3. 连续排版数值被存储白名单重置，以及新导入的 24px 页边距误触旧迁移：范围校验与一次性迁移版本修复，并先复现失败再补回归。
4. 长图使用 blob URL 被现有 CSP 拒绝：改为有体积限制的 data URL 读取，保持现有安全策略，实际回填复测通过。
5. Windows 生成图片的文件锁使 Vite watcher 报 EBUSY 退出：只排除工程根级成果树的监听；源码监听与成果 HTTP 查看继续可用。修后九主题画廊仍可打开。

## 审美判断与验收边界

工作台已形成与声笺一致的材质层级，文章纸面保持清楚；九主题在字族、标题结构、索引密度与段落节奏上可区分。这是本轮 Agent 的设计判断与浏览器观察，不替代先生的审美认可。

imagegen 更适合少量文案的编辑式构图。本轮只有 editorial 实生成，另两种为可调用方向；实际分辨率不是提示词期望的 2160 × 3840。最终图目视抽查主标题、三节正文及引语未见裁切或明显错字，但未做 OCR 或人类逐字验收，回执仍为 needs_review。

本轮没有更新 `docs/`、Products 或正式安装包，也没有调用 yxer 发布、访问账号或另接付费 API。真实公众号粘贴、Electron 候选包和物理手机继续是发布前的独立验收项；前轮审计计划中的解析器演进、Worker 与多标签页冲突治理仍在 [审计计划](../../audit/2026-09-27/README.md)。
