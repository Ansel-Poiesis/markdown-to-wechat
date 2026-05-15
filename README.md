# Markdown to WeChat

微信公众号排版渲染工具。写 Markdown，实时预览，一键复制到公众号编辑器。

## 使用

**在线版**：https://mingchuan-53.github.io/markdown-to-wechat/

**本地启动**：

```powershell
cd docs
python -m http.server 5173
# 打开 http://127.0.0.1:5173/
```

左侧写 Markdown，中间调整主题，右侧实时预览微信效果。满意后点"复制到公众号"。

## 内置主题

| 主题 | 强调色 | 气质 |
|------|--------|------|
| 陶瓦 | `#b75c3d` 陶土红 | 温暖人文，深度长文 |
| 森林 | `#3a5a40` 深绿 | 沉静哲思，技术随笔 |
| 墨玉 | `#1a4a34` 墨玉绿 | 高级质感，精密排版 |

支持自定义主题：编辑中间面板可调所有颜色、字号、边距，可保存为新主题。

## 技术栈

Vue 3 + TypeScript + Vite + Tailwind CSS v4 + CodeMirror 6

Markdown 渲染为 100% inline-style HTML，适配微信公众号编辑器（会剥离外部 CSS）。
