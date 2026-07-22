#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import type { DesignThemeKey, EndMarkMode, FontFamilyKey, TocMode } from '@/types'
import {
  renderWechatMarkdown,
  toHtmlDocument,
  type RenderWechatOptions,
} from '@/services/wechatRenderer'

type OutputFormat = 'fragment' | 'document' | 'json'

const HELP = `公众号 Markdown 渲染器

用法：
  npm run --silent render -- -- --input article.md --output article.html [参数]
  Get-Content -Raw article.md | npm run --silent render -- -- --format json

参数：
  -i, --input <path>          Markdown 文件；省略时读取 stdin
  -o, --output <path>         输出文件；省略时写入 stdout
      --theme <name>          qiuhe|zhujian|songyan|yuebai|qingdai|zhuzhi|haitang|shupian|liujin
      --code-theme <name>     paper|light|dark
      --font-family <name>    sans|serif|mono
      --font-size <number>    10-32
      --line-height <number>  1-3
      --page-margin <number>  0-48
      --accent <#RRGGBB>      强调色
      --text-color <#RRGGBB>  正文色
      --canvas <#RRGGBB>      画布色
      --toc <mode>            theme|show|hide
      --end-mark <mode>       theme|show|hide
      --end-mark-text <text>  自定义结尾标记
      --format <format>       fragment|document|json，默认 fragment
      --title <text>          document 格式的网页标题
  -h, --help                  显示帮助
`

async function main() {
  const args = process.argv.slice(2)
  if (args[0] === '--') args.shift()
  const { values } = parseArgs({
    args,
    options: {
      input: { type: 'string', short: 'i' },
      output: { type: 'string', short: 'o' },
      theme: { type: 'string' },
      'code-theme': { type: 'string' },
      'font-family': { type: 'string' },
      'font-size': { type: 'string' },
      'line-height': { type: 'string' },
      'page-margin': { type: 'string' },
      accent: { type: 'string' },
      'text-color': { type: 'string' },
      canvas: { type: 'string' },
      toc: { type: 'string' },
      'end-mark': { type: 'string' },
      'end-mark-text': { type: 'string' },
      format: { type: 'string' },
      title: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
    strict: true,
  })

  if (values.help) {
    process.stdout.write(HELP)
    return
  }

  const markdown = values.input
    ? await readFile(resolve(values.input), 'utf8')
    : await readStandardInput()
  const options: RenderWechatOptions = {
    theme: values.theme as DesignThemeKey | undefined,
    codeTheme: values['code-theme'],
    fontFamily: values['font-family'] as FontFamilyKey | undefined,
    fontSize: optionalNumber('font-size', values['font-size']),
    lineHeight: optionalNumber('line-height', values['line-height']),
    pageMargin: optionalNumber('page-margin', values['page-margin']),
    accent: values.accent,
    textColor: values['text-color'],
    canvas: values.canvas,
    toc: values.toc as TocMode | undefined,
    endMark: values['end-mark'] as EndMarkMode | undefined,
    endMarkText: values['end-mark-text'],
  }
  const result = renderWechatMarkdown(markdown, options)
  const format = parseFormat(values.format)
  const output =
    format === 'json'
      ? `${JSON.stringify(result, null, 2)}\n`
      : format === 'document'
        ? toHtmlDocument(result.html, values.title)
        : result.html

  if (values.output) {
    const outputPath = resolve(values.output)
    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, output, 'utf8')
  } else {
    process.stdout.write(output)
  }

  if (!result.valid) process.exitCode = 2
}

async function readStandardInput(): Promise<string> {
  if (process.stdin.isTTY)
    throw new Error('请使用 --input 指定 Markdown 文件，或通过 stdin 输入内容')
  process.stdin.setEncoding('utf8')
  let markdown = ''
  for await (const chunk of process.stdin) markdown += chunk
  return markdown
}

function optionalNumber(name: string, value: string | undefined): number | undefined {
  if (value === undefined) return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) throw new Error(`${name} 必须是数字`)
  return parsed
}

function parseFormat(value: string | undefined): OutputFormat {
  const format = value ?? 'fragment'
  if (format === 'fragment' || format === 'document' || format === 'json') return format
  throw new Error('format 必须是 fragment、document 或 json')
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`渲染失败：${message}\n`)
  process.exitCode = 1
})
