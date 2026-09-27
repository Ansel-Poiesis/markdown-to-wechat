# TASK-40.1 工作台 UI 实施与复核

日期：2026-09-27。状态：本地候选，未提交、未发布；真实浏览器综合验证由主任务记录。本报告负责工作台外观，不代替文章主题、微信实际粘贴或人工审美验收。

## 设计依据

按 `redesign-existing-projects` 技能先读当前工程，再只读声笺 `app/webview_ui/css/product.css` 与 `app.css`。沿用其真实材质和字体，不引入组件库，也不修改声笺工程。

| 项目 | 浅色 | 深色 |
| --- | --- | --- |
| 工作台底 | `#eaece6` | `#171c19` |
| 面板表面 | `#eff1ec` | `#202622` |
| 正文 | `#26352b` | `#e7eee5` |
| 次级文字 | `#536151` | `#b8c4b9` |
| 辅助文字 | `#5f6d60` | `#a5b3a9` |
| 主动作 | `#346447` | `#b5d5ae` |
| 主动作文字 | `#ffffff` | `#202d21` |

字体从 Segoe UI Variable、Microsoft YaHei UI 起，保留中文及系统回退。双向阴影使用同色系明暗值：浅色暗影 `rgb(139 153 133 / .20)`、高光 `rgb(255 255 255 / .95)`；深色暗影 `rgb(4 9 5 / .32)`、高光 `rgb(200 224 204 / .045)`。

材质分三个层次：外层面板轻浮起，编辑区与选中控件凹入，文章本身保留纸页。设置项、标题图标和未选中主题卡尽量安静；不为每段文字套卡片或阴影。主操作通过实色深绿区分，次要操作保留表面材质。

## 实现范围

- `src/styles/main.css`：全局浅深色、字体、圆角、阴影、焦点与减弱动效，公共 `.neu-panel`、`.neu-button`、`.neu-button--primary`、`.neu-icon-button`、`.neu-field`。
- `src/components/AppHeader.vue`：64px 页头、原稿统计层次、主次操作。新增 `agent-control` 事件及可选 `agentControlOpen` 属性；窄屏保留 Agent 可访问按钮，缩短品牌文本。
- `src/components/SettingsPanel.vue`：内凹页签、主题卡、细调区。保留原主题 ID 与数据来源；行高选择准确覆盖 `1 / 1.6 / 1.75 / 1.8 / 1.85 / 1.9 / 2 / 2.6 / 3`，不四舍五入显示当前值。
- `src/components/EditorPane.vue`：内凹编辑区、透明 CodeMirror 底、清晰行号和工具操作，沿用已修复的编辑、保存、恢复和异步事务行为。
- `src/components/PreviewPane.vue`：设备切换凹陷态、预览槽和独立文章纸页。截图发现旧缩放算法在已适配后再乘用户倍率，造成手机预览横向溢出；现以可用栏宽限制最终倍率，宽面板仍可放大，不更改用户存储值。
- `src/components/DraftPanel.vue`：本地草稿层次、清楚的当前态和可见操作，移除多余内层定高滚动。
- `src/components/settings/ColorPresetControl.vue`：颜色预设凹陷控件、可见选择态与 `aria-pressed`。
- `src/components/ui/AppIcon.vue`：新增本地 SVG Agent 图标，无新增依赖。

App 布局与 Agent 抽屉由主任务接入，文章主题由 TASK-40.2 管理。本子任务没有修改存储行为、文章渲染样式、复制/导出协议或渲染安全边界。

## 定向验证

2026-09-27 实跑结果：

- 8 个所改文件 `prettier --check` 通过。
- 7 个所改 Vue 文件 ESLint、Oxlint 通过；`git diff --check` 通过。
- `npm run type-check` 通过。过程中主题测试 Node 类型与 Agent 测试 warning level 错误已由对应负责人修复后重跑成功。
- 不为纯外观声明写镜像单元测试；缩放修复交由主任务在真实浏览器的多个视口核验。

常用文字/背景的 sRGB 对比计算如下。数字是颜色 token 的静态比值，不代表所有半透明派生色或整页可访问性已审完。

| 文字及背景 | 浅色 | 深色 |
| --- | ---: | ---: |
| 正文 / 表面 | 11.35 | 13.04 |
| 次级文字 / 表面 | 5.78 | 8.54 |
| 辅助文字 / 表面 | 4.80 | 7.06 |
| 主动作文字 / 主动作 | 6.86 | 8.98 |

浅色辅助文字在工作台底上为 4.59；浅色语义色在表面上的最小值为 4.82，深色最小值为 7.02。关键焦点使用明确外框，状态同时有文字/图标，减弱动效偏好已覆盖动画和滚动。

## 截图复核与剩余边界

已只读复核主任务生成的 `ui-desktop.png`（1536×1000）和 `agent-panel.png`。浅灰绿材质、白色文章纸页、深绿主动作有清楚分工；未见正文低对比或所有元素重复凸起。Agent 抽屉复用了同一材质，信息层次与工作台一致。此为实施者判断，非先生审美批准。

初次桌面截图可见预览横向条；上述倍率修复已完成，修后视口结果由主任务补充。深色、320/390/768/1180/1280/1536、实际面板边界、复制/导出/草稿/modal完整回归，以及微信后台粘贴效果，需要分别读主任务浏览器证据；不能仅凭文档宽度或静态截图认定通过。

## 独立技能前向试验

本子任务另按新技能 `C:/Users/mingc/.agents/skills/markdown-renderer-agent/SKILL.md` 独立执行中文试稿到朱简微信公众号交接包，不向技能作者询问预期，不修改技能，不外发。命令、原稿、JSON 回执和 SHA-256 核验位于 `browser-smoke/studio-20260927/skill-forward/`；结果记录在该目录 `README.md`。

`discover → validate → render` 均 exit 0；6 项制品哈希和字节数全符，原稿逐字保存。最终为 `rendered_needs_review`，微信静态 gate 为 `passed`，`humanReview: required`，`publication: not_started`。再次使用相同 taskId 返回 exit 3 / `JOB_EXISTS`，原 manifest 哈希不变。流程按文档即可完成，未发现阻断性文档缺陷；该试验不涉及 imagegen 或真实平台发布。

## 主代理最终浏览器验收

实际测量 390/768/1024/1180/1280/1536/1600px，页面无横向溢出，预览 scrollWidth = clientWidth；深浅色与手机截图见本目录 ui-desktop/ui-dark/ui-mobile.png，390px Agent 界面见 agent-mobile.png。新旧草稿切换、连续参数刷新、任务下载、富文本复制和 Escape 焦点返回已实测。320px 未纳入本轮最终测量，真实微信和物理手机仍另验。完整证据索引以本目录 README 为准。

另修复 Windows 成果文件锁导致开发服务器 watcher EBUSY：vite.config.ts 只排除根级 audit/browser-smoke/design/docs 的监听。未改变 HTTP 服务权限，修后仍能访问主题画廊与图片；类型和22项路径匹配边界断言通过。
