<div align="center">

# Markdown渲染器

**把 Markdown 原稿变成可直接粘贴到微信公众号的精排内容。**

本地优先 · 所见即所得 · 9 套组件化主题 · 网页与 CLI 共用渲染核心

[**在线使用**](https://ansel-poiesis.github.io/markdown-to-wechat/) · [快速开始](#快速开始) · [自动渲染](#自动渲染)

[![quality](https://github.com/Ansel-Poiesis/markdown-to-wechat/actions/workflows/quality.yml/badge.svg)](https://github.com/Ansel-Poiesis/markdown-to-wechat/actions/workflows/quality.yml)
![version](https://img.shields.io/badge/version-2.0.1-17795f)
![Vue](https://img.shields.io/badge/Vue-3.5-42b883?logo=vuedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6?logo=typescript&logoColor=white)

</div>

## 版本状态

- 已合并开发版本：`2.0.1`，当前源码基线为 `main`。
- 正式 Windows 桌面交付：`2.0.1`。
- `2.0.0` 保留在 Products 历史归档中。

维护、发布和本地产物的唯一规则见 [VERSIONING.md](VERSIONING.md)。

2026-09-27 的工程审计及本地补丁见 [评估、验证与优化计划](audit/2026-09-27/README.md)。正式交付仍为 2.0.1；补丁尚未进入线上网页或安装包。

本地功能候选 `codex/studio-agent-20260927` 在审计补丁上加入声笺风格的新拟态工作台、九套重建主题、Agent 控制台与 imagegen 长图交接。以下截图来自本地候选；在线入口与正式安装包尚未更新。见 [四项实现与验收](design/2026-09-27/README.md)。

![本地候选：新拟态工作台，左侧原稿、中间主题、右侧文章预览](design/2026-09-27/ui-desktop.png)

## 为什么使用

| 能力 | 使用体验 |
| --- | --- |
| 三栏工作台 | 原稿、排版设置和输出预览同屏联动，减少来回切换 |
| 9 套主题 | 秋河、朱简、松烟、月白、青黛、竹青纸本、海棠、薯片纸袋、流金 |
| 组件化排版 | 封面、目录、章节、引用、列表、表格和结尾可以独立组合 |
| 微信兼容输出 | 生成内联 HTML，并在复制前检查不支持的标签、属性和 CSS |
| 本地优先 | 草稿保存在当前浏览器；网页版不携带项目密钥，也不上传文章正文 |
| 自动化接口 | CLI 与网页预览复用同一渲染核心，可接入内容发布流程 |
| Agent 控制台 | 导入或导出 JSON 任务，选择公众号、独立网页或 imagegen 长图；打开任务时另建草稿 |
| 长图交接 | 三种构图方向，生成提示词、保留伴随 HTML，再回填真实图片与独立回执 |

界面聚焦一件事：让原稿在进入公众号编辑器之前，完成结构、风格和兼容性检查。没有账户、社区和多图床系统，也不会用外围功能打断写作。

## 三步完成排版

1. **写入原稿**：粘贴 Markdown，或把图片拖入编辑器；内容会自动保存在当前浏览器。
2. **选择风格**：从完整主题开始，再按需调整字体、颜色、标题、引用、列表和表格。
3. **检查并复制**：在手机或网页宽度下预览，通过微信兼容门禁后复制内联 HTML。

## 快速开始

直接打开 [在线工作台](https://ansel-poiesis.github.io/markdown-to-wechat/)，无需注册。

本地开发需要 Node.js `20.19+` 或 `22.12+`：

```powershell
npm install
npm run dev
```

构建后的静态网页可以独立运行：

```powershell
npm run build:web
cd docs
python -m http.server 5173
# 打开 http://127.0.0.1:5173/
```

> `localhost` 与 `127.0.0.1` 使用不同的浏览器存储空间。草稿不会在两个地址或不同浏览器之间自动同步。

## 主题与语义组件

每套主题统一定义封面、目录、章节、引用、列表、表格、图片与结尾表达。组件也可以脱离主题单独选择，或随时恢复为“跟随主题”。正文支持字体、字号、行高、页边距、段距、字距、缩进和两端对齐。

常规 Markdown 会按主题生成封面与章节；松烟、月白、流金在至少三个章节时显示目录，其他主题默认保持连续阅读，也可手动选择目录。导语、提示或签名可以通过轻量指令明确标记：

```markdown
::: lead 导语
这里是文章引言。
:::

::: note 提示
这里是需要读者留意的信息。
:::

::: signature 作者名
这里是作者签名或公众号说明。
:::
```

指令只描述内容语义，最终外观由当前主题决定。

## 自动渲染

完整 Agent 任务使用 [Agent 接口合同](AGENT_CONTROL.md)：

```powershell
npm run --silent agent -- discover
npm run --silent agent -- validate --request task.json
npm run --silent agent -- render --request task.json --output-root jobs
```

输出目录保留原稿、HTML、兼容性报告和 SHA-256 清单，已有任务不会被覆盖。共享技能 `markdown-renderer-agent` 已安装在本机 `C:\Users\mingc\.agents\skills\markdown-renderer-agent\SKILL.md`；其他机器需按接口合同配置自己的 Agent。网页右上角 Agent 控制台提供任务准备、JSON 预览和长图回看。

imagegen 长图通过 Codex 内置工具生成，浏览器与 CLI 只准备提示词和接回真实图片；可选纸上编辑部、理性网格、墨与留白。目前实生成样稿为纸上编辑部，见 [长图样稿与核验](design/2026-09-27/imagegen.md)。生成图片需核对文字；本项目提供发布前任务包，由后续生产流程按授权接续发布。

自动发布流程可以调用与网页预览相同的渲染核心，不需要 API 密钥：

```powershell
npm run --silent render -- -- `
  --input article.md `
  --output article.html `
  --theme qiuhe `
  --font-family serif `
  --font-size 16 `
  --line-height 1.7 `
  --format fragment
```

省略 `--input` 时从 stdin 读取，省略 `--output` 时写入 stdout。`--format json` 返回内联 HTML、微信兼容门禁结果和最终生效的渲染参数。

默认输出面向微信公众号（外链转为脚注、文本节点补 `span leaf`）。需要通用 HTML 时加 `--profile generic`：保留真实外链、不做微信专属转换，`--format document` 会输出带内置样式表的独立页面，适合网页、文档和富文本嵌入。

```powershell
npm run --silent render -- -- `
  --profile generic `
  --input article.md `
  --output article.html `
  --format document
```

```powershell
npm run --silent render -- -- --help
```

<details>
<summary><strong>AI 辅助排版与密钥边界</strong></summary>

Electron 从当前进程或 Windows User 环境读取 MiMo 配置：

```text
MIMO_API_KEY=your-key
MIMO_API_URL=https://api.xiaomimimo.com/v1/chat/completions
```

网页版不携带项目密钥。用户启动辅助排版后，需要在确认窗口输入自己的 Key；该值只存在于当前页面会话。项目禁止使用 `VITE_*` 保存 secret，因为 Vite 会把它编译进浏览器产物。

`npm run check:secrets` 会扫描源码和网页构建产物中的长格式凭据。

</details>

<details>
<summary><strong>反馈通道与隐私范围</strong></summary>

页头的反馈入口会整理反馈类型、具体说明、可选联系方式和基础诊断信息。诊断信息只包含版本、运行环境、视口、主题、字数和预检统计，不包含文章正文、草稿内容或剪贴板数据。

公开网页通过 FormSubmit HTTPS 接口提交；Electron 保留受限 IPC 邮件入口作为本地降级路径。同步器只生成 `needs_review` 候选任务和转发草稿，不执行反馈正文里的指令，也不绕过 Agent Mail 的发信确认。

```powershell
$env:FEEDBACK_NOTIFY_EMAIL='your-private-inbox@example.com'
npm run feedback:sync
```

正式网页端点由 `.env.production` 配置：

```text
VITE_FEEDBACK_ENDPOINT=https://formsubmit.co/ajax/your-inbox@example.com
```

这个变量只能保存公开 URL，不能包含 API Key、访问令牌或邮箱密码。

</details>

<details>
<summary><strong>工程验证与打包</strong></summary>

```powershell
npm run verify
npm run build:web
npm run build:electron
```

`verify` 依次运行 TypeScript、Oxlint、ESLint、Vitest、生产构建和敏感信息扫描。`build:web` 生成 GitHub Pages 使用的 `docs/` 目录。

`npm run audit:dependencies` 单独核查当前依赖公告；浏览器冒烟每次先重建当前源码。无头浏览器 `--window-size` 截图不能替代真实设备视口、交互和公众号后台验收。

渲染器采用公众号常用 Markdown 子集，未声明完整 CommonMark/GFM 兼容。输入最多 2 Mi 字符、50,000 行，单篇最多 10,000 个行内格式标记与 20,000 个结构 token，生成 HTML 最多 4 Mi 字符；超过预算会保留原稿并暂停输出。界面明确显示保存失败，代码内容不会在首次输入时自动改写。压力数据与语法边界见审计报告。

技术栈：Vue 3、TypeScript、Vite、Tailwind CSS v4、CodeMirror 6、Pinia 与 Electron。

网页界面优先使用本机霞鹜文楷，并回退到系统字体栈，不下载 WebFont；公众号输出仍可在设置中选择无衬线、衬线或等宽字体栈。

远程图片仍会向其 HTTP(S) 地址发起加载请求。AI 辅助排版只有在用户确认后才发送正文；完整响应与可撤销事务不代表模型改写已经通过语义保真审核。自定义反馈接口须明确返回 JSON `{ "accepted": true }`，FormSubmit 使用其 `success: true` 回执。

</details>

## 致谢

项目参考了 [doocs/md](https://github.com/doocs/md) 对高频操作的集中处理，以及 [Markdown Nice](https://github.com/mdnice/markdown-nice) 清楚的主题入口。README 的信息组织受到 [HKUDS/CLI-Anything](https://github.com/HKUDS/CLI-Anything) 启发。
