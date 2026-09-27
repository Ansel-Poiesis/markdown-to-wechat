# 四项升级检查点

用户授权：新拟态 UI、重建预设主题、Agent 自动化中间步骤与 skill、考虑并验证 imagegen 长图。日期 2026-09-27，任务 TASK-40 / 40.1–40.4。

分支 `codex/studio-agent-20260927`，继承已验证审计补丁 `d0b1b42`；正式产品仍为 2.0.1，本轮不合并、不发布，不改声笺工程。

分工：frontend_reliability 负责工作台外观；renderer_correctness 负责九主题与预设参数；security_redteam 负责 Agent 合同/CLI/skill；root 负责 Agent UI、imagegen brief 与真实样稿、集成验证和交付。

声笺实际参照：`C:\Ansel_Work\10_Projects\10_Products\video-to-article-desktop\app\webview_ui\css\product.css`。灰绿新拟态用于工作台，文章主题独立定义。Agent 通过显式 JSON 请求和产物回执接入，图像生成经内置 imagegen，浏览器不伪装工具直连。正式外发属于现有 yxer 流程。

证据与完成结果写同目录报告；大量运行产物使用忽略入 Git 的本地输出目录。内置 imagegen 样稿作为本轮展示产物入工程，其生成不等于文字审核或发布通过。`docs/` 是正式 Pages 构建物，保持不变。

完成检查点：四项实现及全套 verify（29 文件 / 256 tests）通过；六个屏宽、深浅界面、九主题同稿、Agent 新草稿/刷新/JSON下载/旧预览失效、真实图片回看与CLI回填已核验。最终说明与使用入口见 [README.md](README.md)。技能已安装在用户共享技能根，独立 forward test 通过。

本轮补修预览横溢、连续参数持久化/一次性迁移、旧结果串稿、CSP下图片回看、Windows成果目录文件监听问题。正式版本和发布门保持原状态。下一动作是按候选源码记录版本，待后续发布任务进行真实公众号与桌面候选验收；不把本轮技术结果提升为上线或人审通过。
