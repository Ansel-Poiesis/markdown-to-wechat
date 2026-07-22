---
project: markdown-to-wechat
type: agent-entry
status: active
created: 2026-06-12
updated: 2026-07-22
poiesis_todo: C:\Ansel_Work\10_Projects\00_Core\Poiesis\05-任务栏\10-TODO\任务单\TODO-markdown渲染器.md
---

# AGENTS.md — 公众号渲染器

这是 Markdown 转微信公众号排版工具的源码仓库入口。

新对话或新 Agent 继续迭代本项目时，先不要直接改代码。先把项目状态对齐，再进入实现。

## 必读入口

按顺序读取：

1. `C:\Ansel_Work\10_Projects\00_Core\Poiesis\40-Projects\12-markdown渲染器\README.md`
2. `C:\Ansel_Work\10_Projects\00_Core\Poiesis\40-Projects\12-markdown渲染器\00-项目文件.md`
3. `C:\Ansel_Work\10_Projects\00_Core\Poiesis\40-Projects\12-markdown渲染器\09-构建测试发布与运维.md`
4. `C:\Ansel_Work\10_Projects\00_Core\Poiesis\05-任务栏\10-TODO\任务单\TODO-markdown渲染器.md`
5. 本仓库的 `README.md` 与 `package.json`。

如果只是修一个很小的代码问题，也至少读取第 1、3、4 项，确认本轮是否属于低频维护、补丁还是下一版本候选。

## 当前项目状态

- 当前开发版本：`2.0.1`
- 当前公开版本：`2.0.0`
- 源码仓库：`C:\Ansel_Work\10_Projects\20_ContentTools\markdown-to-wechat`
- 本地产品目录：`C:\Ansel_Work\10_Projects\10_Products\markdown-to-wechat`
- GitHub：<https://github.com/Ansel-Poiesis/markdown-to-wechat>
- 网页预览：<https://ansel-poiesis.github.io/markdown-to-wechat/>
- 下一次维护检查：`2026-08-07`

维护节奏是低频节奏：每月体检，每季度判断是否发布小版本，不做连续产品冲刺。

## 继续迭代时先做

1. 运行 `git status --short`，确认已有改动。
2. 保护用户或上一轮 Agent 留下的未提交改动，不要回滚不属于本轮的文件。
3. 对照 Poiesis 的项目行动清单，判断本轮需求属于月度体检、季度发布判断，还是临时补丁。
4. 如果涉及预览宽度、复制到公众号、主题样式、颜色系统，优先用真实公众号呈现或浏览器截图验证。
5. 实现完成后，把下一步、未决问题或发布判断写回 Poiesis 项目档案和行动清单。

## 发布边界

未经先生确认，不做这些动作：

- 创建 GitHub Release。
- 修改对外发布说明。
- 发布 GitHub Pages 或桌面安装包。
- 改变长期维护策略。
- 删除、覆盖或重置已有源码、构建产物和 Products 目录。

## 代码注意

- 微信公众号复制内容必须尽量使用内联样式，不能依赖外部 CSS。
- 预览和复制相关逻辑要同时关注网页预览、手机预览和公众号后台真实呈现。
- 主题系统不要失控。新增主题应该来自真实文章风格或稳定的复用需求。
- 构建输出在 `docs/`，用于 GitHub Pages；不要把旧构建文件当成可以随意清理的临时文件。
- 项目现有说明仍保留在 `CLAUDE.md`，其中包含技术架构、命令和核心约束。

## 交接格式

每次结束时，给出：

- 本轮结论：no-op / patch / release candidate / blocked。
- 改了哪些文件。
- 验证了什么。
- 下一步写回到了哪里。
- 是否需要明川确认。
