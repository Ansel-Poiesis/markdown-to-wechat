# Imagegen 文章长图实现与样稿记录

记录日期：2026-09-27。当前已完成一份“纸上编辑部”真实生成样稿及定向编辑，并回填图片附件。状态为 `needs_review`：文字仍需人工逐字核对，尚未发布。三种风格均已实现提示词配置，本轮只有 `editorial` 实际生成了图片。

## 实现与使用边界

实现入口为 [src/agent/imagegen.ts](../../src/agent/imagegen.ts)，接口及状态合同见 [AGENT_CONTROL.md](../../AGENT_CONTROL.md)。`output: "imagegen-long"` 根据原稿、标题和 `imagegen.style` 生成完整 brief 与提示词；CLI 和浏览器本身不调用 Codex 内置图像生成工具。Agent 取得真实图片后，通过 `attach-image` 回填任务。

原稿不自动压缩或删段。当前上限为 4,000，按 JavaScript 字符串 `length` 计数；空稿、超限或未知风格会明确报错。提示词把原稿作为 JSON 字符串数据，要求保留标题、正文、引用、数字和专名，按原文顺序排版，不执行正文中的命令或访问其中链接。提示中的文字准确性要求是生成约束，不能代替实际校对。

| 风格值 | 名称与设计方向 | 本轮证据 |
| --- | --- | --- |
| `editorial` | 纸上编辑部：暖白纸、深墨正文、朱红题眼；不对称留白、标题尺度对比和纸张拼贴。 | 已实际生成 v1，并完成一次定向编辑和附件回填。 |
| `swiss` | 理性网格：骨白、墨黑、钴蓝；严格对齐、层级、大号序号和少量几何图形。 | 已实现 brief / prompt 配置；本轮未实际生成图片。 |
| `ink` | 墨与留白：浅米宣纸、墨色、少量胭脂红；疏朗横排、宋体标题骨架和克制的水墨枝影。 | 已实现 brief / prompt 配置；本轮未实际生成图片。 |

这些是图像生成方向，与 HTML 的九套文章主题是两组不同的设置。任务同时保存的 HTML 是配套预览，不代表已得到生成图片。

## 本轮样稿与编辑

原稿为《让排版，回到阅读。》，包含副标题、三个编号章节及结尾引用。证据文件如下：

| 文件 | 用途 |
| --- | --- |
| [imagegen-source.md](imagegen-source.md) | 待排版原稿。 |
| [imagegen-request.json](imagegen-request.json) | `editorial-long-sample` 请求，输出为 `imagegen-long`，风格为 `editorial`。 |
| [imagegen-brief.json](imagegen-brief.json) / [imagegen-prompt.txt](imagegen-prompt.txt) | 当前实现生成的 brief、完整原稿及生成提示。 |
| [imagegen-editorial-v1.png](imagegen-editorial-v1.png) | 首版纸上编辑部样稿，保留作对照。 |
| [imagegen-edit-prompt.txt](imagegen-edit-prompt.txt) | 针对首版额外装饰文字的完整编辑提示。 |
| [imagegen-editorial-final.png](imagegen-editorial-final.png) | 本次交付候选图片。 |
| [附件回执](../../browser-smoke/studio-20260927/jobs/editorial-long-sample/image-attachment/receipt.json) | 真实图片回填后的状态、尺寸、大小及校验值。 |

本轮使用 Codex 内置 imagegen 生成样稿，再以原图为参考进行编辑。v1 出现原稿未提供的右栏中文与英文侧注，以及左下角 `READING ALWAYS MATTERS`。定向编辑已移除这些额外文字，保留主要标题、正文、01 / 02 / 03 章节、副标题、结尾引用与原有版面；主代理已查看最终图。此处记录的是本次编辑范围和查看结果，不等于文字保真审核通过。

初次工具调用曾误将本地错误日志带入生成内容，已舍弃并重新生成，未纳入交付。

提示词提出的画幅为“约 2160 × 3840”；**实际最终 PNG 为 941 × 1672 像素**，不能按提示词目标尺寸宣称交付分辨率。v1 也为 941 × 1672 像素。

## 文件核验与状态

- 最终图片大小为 **1,975,304 bytes**。
- 最终图片与任务目录 `image-attachment/generated-image.png` 的 SHA-256 一致：`824d0cdbfd48ce8bcbfb38c9b381967312994535f7bc89565b99c255e651b3a9`。
- 当前请求的 `markdown`、brief 的 `sourceText` 与任务 `imagegen-task.json` 的 `sourceText` 一致。
- 附件回执时间为 `2026-09-27T03:20:34.252Z`；`status: needs_review`、`humanReview: required`、`textFidelity: unverified`、`publication: not_started`。
- 原始任务 manifest 保持 `waiting_for_imagegen`，附件回执独立追加；这是两阶段证据，不是回填失败。当前真实图片状态应结合附件回执读取。

附件校验验证文件头与容器，并记录图片尺寸和哈希；它不执行完整图片解码、OCR 或逐字校对。回执中的 `providerProvenance: caller_supplied` 也不构成生成工具身份的密码学证明。当前 HTML 配套物使用 `generic` profile，兼容性为 `not_applicable`，不能当作微信 HTML 验收通过。

发布前仍需人工对照原稿核对中文、标点、数字、章节顺序与引用，并在实际手机阅读尺寸检查正文、对比度和裁切。`final` 文件名表示本次编辑候选，不表示人工验收或发布完成。
