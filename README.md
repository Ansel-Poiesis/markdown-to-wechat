# Markdown to WeChat

微信公众号排版渲染工具。写 Markdown，实时预览，调整正文、标题、引用、分割线、代码块等样式，一键复制到公众号编辑器。

## 使用

**在线版**：https://mingchuan-53.github.io/markdown-to-wechat/

**本地启动**：

```powershell
cd docs
python -m http.server 5173
# 打开 http://127.0.0.1:5173/
```

左侧写 Markdown，中间调整排版设置，右侧实时预览微信效果。满意后点"复制到公众号"。

## 功能

- 正文样式：字体、字号、行高、页边距、段距、字距、缩进、两端对齐。
- 组件样式：背景色、H1-H4、加粗、分割线、引用、代码块、公众号尾部。
- 预览模式：网页预览和手机预览，支持 75% / 100% / 125% 缩放。
- 颜色配置：常用色、自选色、历史色和恢复默认。
- 输出方式：复制 inline-style HTML，适配微信公众号编辑器。

## 打包

```powershell
npm run build
npm run build:web
```

`build:web` 会生成 GitHub Pages 使用的 `docs/` 目录。

## 技术栈

Vue 3 + TypeScript + Vite + Tailwind CSS v4 + CodeMirror 6 + Electron
