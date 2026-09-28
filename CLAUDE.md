# CLAUDE.md

This file is a secondary engineering reference for Claude Code (and other coding agents) working in this repository. The authoritative entry point is `AGENTS.md`; the authoritative project archive lives in the Poiesis project directory (`50-阿莱是台珍妮机/10-Project/02-markdown渲染器`).

## Project Overview

Markdown-to-WeChat converts Markdown into inline-styled HTML that can be pasted into the WeChat Official Account (微信公众号) editor. The WeChat editor strips external CSS, so **every generated style must be inline** — this is the core constraint driving the architecture.

The same rendering core powers three surfaces:

- Web workbench (Vue 3 SPA, deployed to GitHub Pages from `docs/`).
- Windows desktop app (Electron shell around the same renderer).
- Headless CLI (`npm run render`) for automated publishing pipelines.

## Tech Stack

- Vue 3 (Composition API, `<script setup>`), Pinia, CodeMirror 6
- Tailwind CSS v4 with custom `@theme` tokens
- Vite (`build:web` writes `docs/` for GitHub Pages; the default build writes `dist/` for Electron)
- Electron (context-isolated main/preload with a narrow IPC surface)
- TypeScript via `vue-tsc`; tests via Vitest; lint via Oxlint + ESLint
- `parse5` is used by the WeChat HTML gate to parse and validate generated HTML
- `tsx` runs the TypeScript CLI scripts directly

## Common Commands

```powershell
npm run dev              # development server
npm run verify           # full quality gate: type-check + lint + test + build + secret scan
npm run build:web        # build GitHub Pages output into docs/
npm run build:electron   # verify + electron-builder (NSIS + portable, x64)
npm test                 # Vitest unit & regression tests
npm run type-check       # vue-tsc
npm run lint             # oxlint + eslint
npm run format           # prettier (src/)
npm run render -- -- --input article.md --output article.html   # headless render CLI
npm run feedback:sync    # sync feedback candidates (does not send automatically)
```

## Architecture

### Render pipeline

```text
Markdown source
-> src/utils/markdownRenderer.ts   (hand-written parser, no markdown library)
-> src/utils/themeComponents.ts    (componentized cover/TOC/heading/quote/list/table/image/end-mark)
-> src/utils/wechatHtml.ts         (leafify + compliance gate)
-> fragment HTML / full document / JSON
```

`src/services/wechatRenderer.ts` is the shared entry used by both the web workbench and the CLI. It resolves a `RenderWechatOptions` against the 9 style presets and returns HTML, gate issues, and the resolved options.

Key renderer behaviors:

- Links become superscript footnote references; a `参考链接` appendix is appended with real URLs.
- Images are wrapped in `<figure>` with optional `<figcaption>`; unsafe sources (e.g. `javascript:`) stay literal.
- Code blocks use manual regex-based highlighting with per-language keyword lists and optional Mac-style chrome / line numbers.
- Tables, H1–H4 headings, blockquotes (with nesting), lists, task lists, horizontal rules, callouts (`::: lead/note/signature`) and footnotes are supported.
- The final HTML is converted to `span leaf` spans and validated by `wechatHtml.ts`: allowed tags/attributes only, inline styles only, safe image sources (`http(s)` or restricted `data:image`), no script/event handlers.

### Theme system

- `src/config/designThemes.ts` defines 9 design languages (cover/section/quote/list/table/toc/end-mark variants).
- `src/stores/settings.ts` defines `STYLE_PRESETS` (the 9 named themes) plus full typography, color, heading/quote/bold/underline mode, and component-override settings.
- `src/config/themes.ts` holds the base magazine theme and code themes (`paper` / `light` / `dark`).
- The web UI lets users override components independently of the selected theme; the CLI exposes only the stable subset (theme, code theme, typography, core colors, TOC/end-mark toggles) — full visual customization is a web/UI concern.

### State management (Pinia)

- `editor.ts` — active Markdown content and save-state label (persisted to `localStorage`).
- `drafts.ts` — multi-draft list, restore, sorting, and legacy migration.
- `settings.ts` — typography, colors, modes, and component overrides (all persisted).
- `theme.ts` — merges the magazine base + settings into the `ThemeBase` consumed by the renderer.
- `ui.ts` — modals, toasts, settings panel, breakpoint.

### AI formatting

- Browser builds require a user-provided MiMo key for the current session; Electron reads `MIMO_API_KEY` from the main process and proxies requests over a narrow IPC bridge.
- Formatting is transactional: the editor changes only after a complete response, and the last result can be undone while the document is unchanged.
- Never introduce a `VITE_*` secret: Vite variables are public bundle data. `npm run check:secrets` scans source and web build output for long-form credentials.

### Feedback

- The public web app submits a structured feedback form through FormSubmit HTTPS; Electron keeps a restricted Agent Mail fallback.
- `scripts/feedback-inbox.ts` only generates `needs_review` candidates and forwarding drafts — it never executes feedback content.

### CLI

- Entry: `scripts/render-wechat.ts`; formats `fragment` / `document` / `json`.
- Exit codes: `0` compliant success, `1` input/run error, `2` output failed the WeChat gate.
- Parameter contract lives in `--help` and the `render-wechat-markdown` skill (`C:\Users\mingc\.agents\skills\render-wechat-markdown`).

## Styling conventions

- App UI uses Tailwind CSS v4 utility classes; design tokens live in `src/styles/main.css` under `@theme`.
- Rendered preview HTML must use inline styles only — never add class names or `id` to `renderMarkdown` output.
- The rendered output may not use `<div>`, classes, or ids; `wechatHtml.ts` is the enforcement point.

## Important notes

- `vite.config.ts` sets `base: './'`; `build:web` writes to `docs/` for GitHub Pages. `docs/` is a committed deliverable, not disposable build junk.
- `tsconfig.app.json` enables `noUncheckedIndexedAccess` for extra safety.
- All `localStorage` keys are prefixed with `wechat-md-`.
- `AGENTS.md`, the Poiesis TODO, and the project archive are the source of truth for project state and release decisions; do not treat `CLAUDE.md` as a project status document.
