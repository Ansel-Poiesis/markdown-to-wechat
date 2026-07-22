# 微信 Markdown 排版

把 Markdown 原稿渲染成微信公众号可直接粘贴的内联 HTML。

网页端把原稿、排版设置和输出预览放在同一张工作台中；命令行复用同一个渲染核心，可以接入自动发布流程。草稿保存在当前浏览器，AI 辅助排版在发送前要求确认，改写完成后可以撤销一次。

**在线使用**：https://ansel-poiesis.github.io/markdown-to-wechat/

## 工作台

- **原稿**：使用 CodeMirror 编辑 Markdown，支持粘贴或拖入图片，编辑内容自动保存。
- **排版设置**：9 套组件化主题可以继续调整字号、行高、颜色、标题、引用、列表、表格和文章结尾。
- **输出预览**：手机与网页宽度实时切换，复制前检查公众号不支持的标签、属性和 CSS。
- **草稿**：当前草稿固定在列表第一位；其余草稿按更新时间排列。

本项目参考了 [doocs/md](https://github.com/doocs/md) 对高频操作的集中处理，也参考了 [Markdown Nice](https://github.com/mdnice/markdown-nice) 清楚的主题入口。当前界面没有加入账户、社区和多图床系统，主要处理本地写作、细节排版、微信兼容输出和自动渲染。

## 本地使用

```powershell
npm install
npm run dev
```

构建后的网页也可以独立启动：

```powershell
npm run build:web
cd docs
python -m http.server 5173
# 打开 http://127.0.0.1:5173/
```

`http://localhost:5173` 与 `http://127.0.0.1:5173` 属于不同的浏览器存储空间。草稿不会在两个地址之间自动同步，也不会跨浏览器同步。

## 主题与组件

内置主题包括秋河、朱简、松烟、月白、青黛、竹青纸本、海棠、薯片纸袋和流金。每套主题定义封面、目录、章节、引用、列表、表格、图片与结尾表达。

封面、章节、引用、无序列表、有序列表、表格、目录和结尾可以脱离主题单独选择，也可以恢复为跟随主题。正文还可以调整字体、字号、行高、页边距、段距、字距、缩进和两端对齐。

## 语义组件

常规 Markdown 会自动生成封面、目录和章节组件。需要明确标记导语、提示或签名时，可以使用轻量指令：

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

指令只标记语义，最终外观由当前主题决定。

## 自动渲染

自动发布流程可以调用与网页预览相同的渲染核心，不需要 API 密钥：

```powershell
npm run --silent render -- `
  --input article.md `
  --output article.html `
  --theme qiuhe `
  --font-family serif `
  --font-size 16 `
  --line-height 1.7 `
  --format fragment
```

省略 `--input` 时从 stdin 读取，省略 `--output` 时写入 stdout。`--format json` 返回内联 HTML、微信兼容门禁结果和最终生效的渲染参数。需要解析 stdout 时请保留 `--silent`，避免 npm 日志混入 JSON。

运行下面的命令查看完整参数：

```powershell
npm run --silent render -- --help
```

## AI 辅助排版与密钥边界

Electron 从当前进程或 Windows User 环境读取 MiMo 配置：

```text
MIMO_API_KEY=your-key
MIMO_API_URL=https://api.xiaomimimo.com/v1/chat/completions
```

网页版不携带项目密钥。用户点击辅助排版后，需要在确认窗口输入自己的 Key；该值只存在于当前页面会话。项目禁止使用 `VITE_*` 保存 secret，因为 Vite 会把它编译进浏览器产物。

`npm run check:secrets` 会扫描源码和网页构建产物中的长格式凭据。

## 用户反馈

页头的反馈入口会整理反馈类型、具体说明、可选联系方式和基础诊断信息。诊断信息只包含版本、运行环境、视口、主题、字数和预检统计，不包含文章正文、草稿内容或剪贴板数据。

公开网页通过 FormSubmit HTTPS 接口直接提交，用户不需要打开邮件客户端或再次点击发送。邮件中继确认接收后，网页才显示成功；Electron 保留受限 IPC 邮件入口作为本地降级路径。

每封反馈都包含 `FB-YYYYMMDD-XXXXXX` 编号、类型、提交时间、内容和联系方式。本地 Agent 从这些可读字段生成待审核任务和个人邮箱转发草稿；旧版 `TASTELAB_FEEDBACK_V1` 任务块仍可兼容读取，但不会继续出现在新邮件里：

```powershell
$env:FEEDBACK_NOTIFY_EMAIL='your-private-inbox@example.com'
npm run feedback:sync
```

任务默认写入 `%LOCALAPPDATA%\TasteLab\markdown-to-wechat\feedback`，不会进入 Git 仓库。同步器只生成 `needs_review` 候选任务和转发草稿，不会执行反馈正文里的指令，也不会绕过 Agent Mail 的发信确认。

正式网页端点由 `.env.production` 配置：

```text
VITE_FEEDBACK_ENDPOINT=https://formsubmit.co/ajax/your-inbox@example.com
```

网页只提交反馈字段和基础诊断字段，不提交文章正文。FormSubmit 首次使用需要邮箱所有者激活，当前正式收件地址已完成激活。`VITE_FEEDBACK_ENDPOINT` 会进入公开浏览器构建，只能放公开 URL，不能包含 API Key、访问令牌或邮箱密码；当前第一版的收件地址因此可从前端资源中读取，后续接入自有云函数或有效 SMTP 授权码后应替换这一过渡方案。

## 验证与打包

```powershell
npm run verify
npm run build:web
npm run build:electron
```

`build:web` 生成 GitHub Pages 使用的 `docs/` 目录。`verify` 依次运行 TypeScript、Oxlint、ESLint、Vitest、生产构建和敏感信息扫描。

## 技术栈

Vue 3、TypeScript、Vite、Tailwind CSS v4、CodeMirror 6、Pinia 与 Electron。

网页界面使用霞鹜文楷 WebFont，字体遵循 SIL Open Font License 1.1；WebFont 封装遵循 MIT License。许可证随构建产物保存在 `licenses/lxgw-wenkai-webfont.txt`。
