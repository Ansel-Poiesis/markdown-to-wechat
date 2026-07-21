# Markdown to WeChat

微信公众号排版渲染工具。写 Markdown，实时预览，调整正文、标题、引用、分割线、代码块等样式，一键复制到公众号编辑器。

## 使用

**在线版**：https://ansel-poiesis.github.io/markdown-to-wechat/

**本地启动**：

```powershell
cd docs
python -m http.server 5173
# 打开 http://127.0.0.1:5173/
```

左侧写 Markdown，中间调整排版设置，右侧实时预览微信效果。满意后点"复制到公众号"。

## 功能

- 组件化主题：秋河、朱简、松烟、月白、青黛、竹青纸本、海棠、薯片纸袋、流金。每套主题拥有独立的封面、目录、章节、引用、列表、表格、图片和结尾表达。
- 独立组件控制：封面、目录、章节、引用、无序列表、有序列表、表格和结尾可以脱离主题单独选择，也可以恢复为跟随主题。
- 正文样式：字体、字号、行高、页边距、段距、字距、缩进、两端对齐。
- 组件样式：背景色、H1-H4、加粗、分割线、引用、代码块、公众号尾部。
- 预览模式：网页预览和手机预览，支持 75% / 100% / 125% 缩放。
- 颜色配置：常用色、自选色、历史色和恢复默认。
- 输出方式：复制 inline-style HTML，适配微信公众号编辑器。
- 质量门禁：最终 HTML 自动补齐 `span leaf`，并检查公众号不支持的标签、属性和 CSS。
- 辅助排版：发送前明确确认，完整返回后才替换正文，并支持一次安全撤销。

## 语义组件

常规 Markdown 会自动生成封面、目录和章节组件。需要显式表达时，可以使用轻量指令：

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

这些指令只负责标注语义，最终外观由当前主题决定。

## 打包

```powershell
npm run build
npm run build:web
npm test
npm run verify
```

`build:web` 会生成 GitHub Pages 使用的 `docs/` 目录。

## 辅助排版配置

Electron 从当前进程或 Windows User 环境读取 MiMo 配置：

```text
MIMO_API_KEY=your-key
MIMO_API_URL=https://api.xiaomimimo.com/v1/chat/completions
```

网页版不会携带项目密钥。点击辅助排版后，需要在确认窗口输入用户自己的 Key；该值只保留在当前页面会话。禁止使用 `VITE_*` 保存任何 secret，因为 Vite 会把它编译进浏览器产物。

项目包含 `npm run check:secrets`，网页构建和 CI 都会扫描源码与构建产物中的长格式凭据。

## 技术栈

Vue 3 + TypeScript + Vite + Tailwind CSS v4 + CodeMirror 6 + Electron
