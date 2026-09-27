# TASK-40.3：Agent 合同、任务包与发布交接

日期：2026-09-27。基于本轮 `codex/studio-agent-20260927` 工作分支；本分项不提交、不推送、不发布。实现归属：Agent 合同/CLI/技能；UI、主题和真实 imagegen 样稿由主代理与其他分项负责。

## 已实现

- `src/agent/contract.ts`：浏览器安全的严格 schemaVersion 1 JSON 请求校验与能力发现。taskId、正文来源、主题、profile、输出形态、排版选项、imagegen 风格显式约束；未知/原型/访问器字段拒绝；浏览器拒绝 inputPath。
- `src/agent/render.ts`：网页与 CLI 共用 `renderAgentArticle`，调用现有 `renderWechatMarkdown`，返回 HTML、文档、兼容性和阶段状态。generic 的兼容性为 not_applicable；微信 gate 失败为 compatibility_failed。
- `scripts/agent-render.ts`、`npm run --silent agent -- ...`：discover、validate、render、attach-image。JSON stdout 与错误退出码；有界 UTF-8 文件读取；目录原子新建；固定制品路径、SHA-256 和字节数；禁止覆盖已存在任务/图片目录。
- `AGENT_CONTROL.md`：schema、参数、命令、状态机、错误码、路径和图片检查边界。
- 共享技能 `C:\Users\mingc\.agents\skills\markdown-renderer-agent\SKILL.md`：整包任务与回执工作流，复用既有单文件技能职责；现行 yxer validate → dry-run → 独立授权 publish 交接，不猜发布参数。

## 验证证据

执行 `npm test -- src/agent/contract.test.ts scripts/agent-render.test.ts`：**43 tests，2 files，通过**。覆盖：

1. 核心默认值、9 主题能力发现、normalized 请求幂等、真实共用核心 HTML 一致。
2. taskId 遍历/系统保留名、未知字段/原型字段/访问器、枚举/null/颜色/数字/字号与字数边界。
3. 浏览器本地路径拒绝；CLI 相对 UTF-8 路径；网络/设备/ADS/非文本正文路径拒绝；无效 UTF-8 与 16 MiB 请求文件预分配前拒绝。
4. 渲染 token 扩张拒绝且无任务目录；既有任务冲突 exit 3；完整 manifest 的每项哈希与长度核验。
5. 注入核心 HTML gate 失败：结果 exit 2、compatibility_failed、保留失败证据。此项是故障注入，不是声称目前内置模板会自然产生该错误。
6. imagegen 仅准备、超长原稿拒绝；真实 PNG 文件接回；原 manifest 不修改；重复附件拒绝；源制品/路径篡改拒绝。
7. 图片头/容器检查：PNG 截断与尺寸炸弹、JPEG/WebP 结构性尺寸样例、畸形容器长度。JPEG/WebP 小样例只验证扫描逻辑，不宣称其可完整解码。

`npm run type-check` 通过；新增合同/渲染器/CLI/测试文件定向 ESLint 与 Oxlint 通过。系统 skill-creator 的 `quick_validate.py` 对共享技能返回 **Skill is valid!**。已请主代理按新技能独立做 forward test；该独立流程和实际生成图不计入上述 43 项测试。

只读确认本机 yxer `--help` 返回版本 3.2.21 和命令入口；未调用 accounts、validate、dry-run、publish 或网络发布。发布参数以实际接续时帮助/schema 为准。

## 状态及剩余边界

- validate 只验证合同与读取，不能代替 render 或微信 gate。
- 微信 passed 是静态 HTML 检查；网页粘贴与视觉需另验，generic 没有微信 gate。
- imagegen-long 为 waiting_for_imagegen；CLI 不能调用 Codex 内置 imagegen。实际图接回 receipt 固定 needs_review、textFidelity unverified、humanReview required、publication not_started。
- 图像检查仅头部/尺寸/基础容器，没有完整解码、CRC、OCR 或生成来源鉴定。SHA-256 清单是本地一致性证据，不是签名，也不证明图片来自某个模型。
- 原 manifest 不改写，image-attachment/receipt.json 追加表达图片阶段。部分磁盘写入失败可能保留未完成目录，自动重试不能覆盖它。
- 路径限制不是操作系统沙箱；不宣称可抵御持有同一工作目录写权限的并发恶意文件置换。没有启动监听端口、访问凭据、付费或外发。
- 共享技能位于用户技能主根，属于工程 Git 之外的本地交付；主代理需在最终交付中明确其路径和独立验证结果。

## 主代理接续

完成 UI 合同导入/预览/新建草稿应用与技能独立 forward test；以全工程 verify 结果为整体结论，再将 TASK-40.3 验收写回。不要把本分项的定向通过替代整轮全套验证或人工审美验收。

主代理最终核验：上述接续已完成，实际 JSON 下载正文与共同试稿逐字一致，CLI validate 通过；网页新建草稿保留旧稿，连续排版参数刷新保持不变，改 JSON 清掉旧预览，Escape 归还焦点。独立 forward test 与完整 verify 通过，详见本目录 README。微信 gate 的 exit 2 返回 manifest.compatibility，不含通用 error 字段，根接口文档已经明确该区别。
