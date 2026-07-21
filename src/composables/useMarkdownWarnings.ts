import { computed } from 'vue'
import type { WarningItem } from '@/types'

export function useMarkdownWarnings(markdownRef: { value: string }) {
  const warnings = computed<WarningItem[]>(() => {
    const markdown = markdownRef.value || ''
    const result: WarningItem[] = []
    const localImages = markdown.match(/!\[[^\]]*]\((?!https?:\/\/|data:image\/)[^)]+\)/gi) || []
    const embeddedImages = markdown.match(/!\[[^\]]*]\(data:image\/[^)]+\)/gi) || []
    const links = markdown.match(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/gi) || []
    const tables = markdown.match(/^\s*\|.+\|\s*$/gm) || []
    const longLines = markdown.split('\n').filter((line) => line.length > 120)
    const emptyLinks = markdown.match(/\[[^\]]*]\(\s*\)/g) || []
    const headings = markdown.match(/^#{1,6}\s+.*$/gm) || []
    const h1Count = markdown.match(/^#\s+.+$/gm)?.length || 0
    const h5Plus = markdown.match(/^#{5,6}\s+.+$/gm) || []
    const codeBlocks = markdown.match(/```[\s\S]*?```/g) || []
    const unclosedCodeFenceCount = (markdown.match(/```/g) || []).length
    const veryLongCodeBlocks = codeBlocks.filter((block) => block.split('\n').length > 28)

    const text = markdown
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
      .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
      .replace(/[#>*_`~\-|[\]()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const chinese = text.match(/[一-鿿]/g) || []
    const latin = text.replace(/[一-鿿]/g, ' ').match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g) || []
    const wordCount = chinese.length + latin.length

    if (localImages.length) {
      result.push({
        level: 'danger',
        text: '检测到本地或相对路径图片。公众号后台通常需要可访问的线上图片地址。',
        type: 'localImage',
      })
    }
    if (embeddedImages.length) {
      result.push({
        level: 'warn',
        text: '检测到内嵌图片。复制到公众号后请检查图片是否保留，正式发布建议使用线上图片。',
        type: 'embeddedImage',
      })
    }
    if (emptyLinks.length) {
      result.push({
        level: 'danger',
        text: '存在空链接，请补全 URL 或删除链接标记。',
        type: 'emptyLink',
      })
    }
    if (unclosedCodeFenceCount % 2 !== 0) {
      result.push({
        level: 'danger',
        text: '代码块围栏数量不成对，后续内容可能都会被当成代码。',
        type: 'unclosedCode',
      })
    }
    if (h1Count > 1) {
      result.push({
        level: 'warn',
        text: '检测到多个一级标题。公众号正文通常保留一个主标题更稳。',
        type: 'multiH1',
      })
    }
    if (h5Plus.length) {
      result.push({
        level: 'warn',
        text: '检测到五级或六级标题，微信正文里层级可能不明显，建议合并到四级以内。',
        type: 'deepHeading',
      })
    }
    if (links.length) {
      result.push({
        level: 'info',
        text: `检测到 ${links.length} 个外链，复制时会自动转成文末脚注。`,
        type: 'externalLink',
      })
    }
    if (tables.length > 4) {
      result.push({
        level: 'warn',
        text: '表格内容较多，粘贴到公众号后建议检查手机端宽度。',
        type: 'manyTables',
      })
    }
    if (longLines.length) {
      result.push({
        level: 'warn',
        text: '存在较长单行内容，代码块或表格可能在微信里换行。',
        type: 'longLine',
      })
    }
    if (veryLongCodeBlocks.length) {
      result.push({
        level: 'warn',
        text: '存在较长代码块，公众号阅读体验可能偏重，建议拆分或折叙。',
        type: 'longCode',
      })
    }
    if (wordCount > 2800 && headings.length < 3) {
      result.push({
        level: 'info',
        text: '文章较长但标题层级较少，可以增加小标题帮助读者扫读。',
        type: 'fewHeadings',
      })
    }
    if (!headings.length && wordCount > 600) {
      result.push({
        level: 'info',
        text: '正文超过 600 字但没有标题，建议增加小标题提升结构感。',
        type: 'noHeading',
      })
    }
    return result
  })

  const preflightCounts = computed(() => ({
    danger: warnings.value.filter((w) => w.level === 'danger').length,
    warn: warnings.value.filter((w) => w.level === 'warn').length,
    info: warnings.value.filter((w) => w.level === 'info').length,
  }))

  return { warnings, preflightCounts }
}
