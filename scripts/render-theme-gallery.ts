import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { STYLE_PRESETS } from '../src/stores/settings'
import { renderWechatMarkdown } from '../src/services/wechatRenderer'
import { escapeHtml } from '../src/utils/markdownRenderer'

const directory = resolve('design/2026-09-27')
const markdown = readFileSync(resolve(directory, 'specimen.md'), 'utf8')
const results = STYLE_PRESETS.map((preset) => {
  const result = renderWechatMarkdown(markdown, { theme: preset.key })
  if (!result.valid) throw new Error(`${preset.key}: ${JSON.stringify(result.issues)}`)
  writeFileSync(resolve(directory, `${preset.key}.html`), result.html + '\n', 'utf8')
  return {
    key: preset.key,
    label: preset.label,
    description: preset.description,
    html: result.html,
    options: result.options,
  }
})
const navigation = results
  .map(({ key, label }) => `<a href="#${key}">${escapeHtml(label)}</a>`)
  .join('')
const articles = results
  .map(
    (result) =>
      `<article id="${result.key}"><header><h2>${escapeHtml(result.label)}</h2><p>${escapeHtml(result.description)}</p><small>${result.options.lineHeight} 倍行高 · ${result.options.fontFamily === 'serif' ? '宋体正文' : '无衬线正文'} · ${result.options.pageMargin}px 页边距</small></header><div class="paper">${result.html}</div></article>`,
  )
  .join('\n')
writeFileSync(
  resolve(directory, 'theme-gallery.html'),
  `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>九套中文编辑主题 · 同稿试排</title>
<style>*{box-sizing:border-box}body{margin:0;background:#eae9e5;color:#252723;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}.intro{max-width:1460px;margin:auto;padding:40px 28px 24px}.intro h1{font-size:28px;margin:0 0 12px}.intro p{margin:0;max-width:760px;line-height:1.8;color:#5f645c}nav{display:flex;gap:8px;flex-wrap:wrap;margin-top:20px}nav a{padding:8px 12px;border:1px solid #c9ccc5;border-radius:5px;text-decoration:none;color:#3d5148;background:#f5f5f1}main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:28px;max-width:1460px;margin:auto;padding:0 28px 48px}article{min-width:0;scroll-margin-top:20px}article>header{min-height:120px;padding:16px 4px}article>header h2{font-size:19px;margin:0 0 8px}article>header p{font-size:13px;color:#596157;line-height:1.65;margin:0 0 8px}small{font-size:12px;color:#66715f}.paper{background:white;border:1px solid #d7d9d1;box-shadow:0 4px 24px #22222206}.paper>section{border-radius:0!important}@media(max-width:1080px){main{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:680px){.intro{padding:24px 16px}main{display:block;padding:0 12px 32px}article{margin-bottom:28px}article>header{min-height:0;padding:20px 4px}}</style></head>
<body><section class="intro"><h1>九套中文编辑主题</h1><p>同一篇试稿，比较标题、正文、章节、引用与列表的阅读节奏。页面外框只用于对照；每张纸内为可复制的微信内联 HTML。此页是本地视觉试稿，尚未通过真实公众号粘贴验收。</p><nav>${navigation}</nav></section><main>${articles}</main></body></html>`,
  'utf8',
)
writeFileSync(
  resolve(directory, 'theme-validation.json'),
  JSON.stringify(
    {
      specimen: 'specimen.md',
      themes: results.map(({ key, options }) => ({ key, valid: true, options })),
    },
    null,
    2,
  ) + '\n',
  'utf8',
)
console.log(`Rendered ${results.length} themes to ${directory}`)
