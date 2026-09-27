import { getDesignTheme, type DesignTheme } from '@/config/designThemes'
import type { ArticleDocument, ThemeBase } from '@/types'

type Style = Record<string, string | number | undefined>

function css(style: Style): string {
  return Object.entries(style)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(
      ([key, value]) => `${key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}:${value}`,
    )
    .join(';')
}

function tag(name: string, content: string, style: Style = {}): string {
  const styleAttr = Object.keys(style).length ? ` style="${escapeText(css(style))}"` : ''
  return `<${name}${styleAttr}>${content}</${name}>`
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function alpha(hex: string, opacity: number): string {
  const normalized = /^#[0-9a-f]{6}$/i.test(hex) ? hex : '#52525b'
  const red = Number.parseInt(normalized.slice(1, 3), 16)
  const green = Number.parseInt(normalized.slice(3, 5), 16)
  const blue = Number.parseInt(normalized.slice(5, 7), 16)
  return `rgba(${red},${green},${blue},${opacity})`
}

function padNumber(value: number): string {
  return String(value).padStart(2, '0')
}

function headingMode(theme: ThemeBase, level: number): string {
  if (level === 1) return theme.h1Mode
  if (level === 2) return theme.h2Mode || theme.headingMode
  if (level === 3) return theme.h3Mode || theme.headingMode
  return theme.h4Mode || theme.headingMode
}

function headingColor(theme: ThemeBase, level: number): string {
  if (level === 1) return theme.h1Color || theme.color
  if (level === 2) return theme.h2Color || theme.color
  if (level === 3) return theme.h3Color || theme.color
  return theme.h4Color || theme.color
}

function decorateHeading(
  content: string,
  level: number,
  theme: ThemeBase,
): { content: string; style: Style } {
  const mode = headingMode(theme, level)
  const accent = theme.headingAccent || theme.accent

  if (mode === 'marker') {
    return {
      content: tag('span', content, {
        display: 'inline',
        padding: '0 2px',
        background: `linear-gradient(transparent 58%,${alpha(accent, 0.22)} 0)`,
      }),
      style: {},
    }
  }

  if (mode === 'chip') {
    return {
      content: tag('span', content, {
        display: 'inline-block',
        padding: '3px 9px',
        color: theme.canvas || '#ffffff',
        background: accent,
        borderRadius: '3px',
      }),
      style: {},
    }
  }

  if (mode === 'bar') {
    return { content, style: { paddingLeft: '10px', borderLeft: `4px solid ${accent}` } }
  }

  if (mode === 'dash') {
    return {
      content,
      style: {
        paddingBottom: level === 1 ? '10px' : '7px',
        borderBottom: `1.5px dashed ${accent}`,
      },
    }
  }

  if (mode === 'underline') {
    return {
      content,
      style: {
        paddingBottom: level === 1 ? '10px' : '7px',
        borderBottom: `${level === 1 ? 2 : 1}px solid ${level === 1 ? accent : theme.border}`,
      },
    }
  }

  if (mode === 'center') return { content, style: { textAlign: 'center' } }

  if (mode === 'panel') {
    return {
      content,
      style: {
        padding: '12px 14px',
        border: `1px solid ${theme.border}`,
        borderRadius: '6px',
        background: theme.bgSoft,
      },
    }
  }

  return { content, style: {} }
}

export interface ThemeRenderContext {
  theme: ThemeBase
  design: DesignTheme
  article: ArticleDocument
}

export function createThemeRenderContext(
  theme: ThemeBase,
  article: ArticleDocument,
): ThemeRenderContext {
  const base = getDesignTheme(theme.designKey)
  const overrides = theme.componentOverrides
  const design: DesignTheme = {
    ...base,
    cover: overrides?.cover || base.cover,
    section: overrides?.section || base.section,
    quote: overrides?.quote || base.quote,
    unorderedList: overrides?.unorderedList || base.unorderedList,
    orderedList: overrides?.orderedList || base.orderedList,
    table: overrides?.table || base.table,
    showToc:
      overrides?.tocMode === 'show' ? true : overrides?.tocMode === 'hide' ? false : base.showToc,
    endMark:
      overrides?.endMarkMode === 'hide'
        ? ''
        : overrides?.endMarkText?.trim() ||
          (overrides?.endMarkMode === 'show' ? base.endMark || '完' : base.endMark),
  }
  return { theme, design, article }
}

const EDITORIAL_SERIF = "'Songti SC', 'STSong', 'Noto Serif CJK SC', 'SimSun', serif"

export function renderCover(content: string, context: ThemeRenderContext): string {
  const { theme, design } = context
  const accent = theme.headingAccent || theme.accent
  const decoratedTitle = decorateHeading(content, 1, theme)
  const title = tag('p', decoratedTitle.content, {
    margin: '0',
    color: headingColor(theme, 1),
    fontFamily: design.titleSerif ? EDITORIAL_SERIF : theme.fontFamily,
    fontSize: `${(theme.fontSize || 16) + design.titleOffset}px`,
    lineHeight: '1.4',
    fontWeight: '700',
    textAlign: design.cover === 'paper' ? 'center' : 'left',
    wordBreak: 'break-word',
    ...decoratedTitle.style,
  })
  const rule = (width: string, color = accent, height = '2px') =>
    tag('section', '', {
      width,
      height,
      background: color,
      margin: '0 0 14px',
    })
  const coverStyle: Style = { margin: '0 0 24px' }
  if (design.cover === 'editorial') {
    return tag('section', rule('32px') + title, {
      ...coverStyle,
      padding: '8px 0 20px',
      borderBottom: `1px solid ${theme.border}`,
    })
  }
  if (design.cover === 'cinnabar') {
    return tag('section', title, {
      ...coverStyle,
      padding: '4px 0 4px 16px',
      borderLeft: `4px solid ${accent}`,
    })
  }
  if (design.cover === 'minimal') {
    return tag('section', title, {
      ...coverStyle,
      padding: '4px 0 18px',
      borderBottom: `2px solid ${theme.color}`,
    })
  }
  if (design.cover === 'index') {
    return tag(
      'section',
      title +
        tag('section', '', {
          height: '4px',
          width: '48px',
          margin: '18px 0 0',
          background: accent,
        }),
      { ...coverStyle, padding: '4px 0 0' },
    )
  }
  if (design.cover === 'botanical') {
    return tag('section', title, {
      ...coverStyle,
      padding: '14px 16px',
      background: theme.bgSoft,
      borderRadius: '0 16px 0 0',
      borderBottom: `1px solid ${theme.border}`,
    })
  }
  if (design.cover === 'paper') {
    return tag('section', title, {
      ...coverStyle,
      padding: '16px 4px',
      borderTop: `1px solid ${accent}`,
      borderBottom: `1px solid ${accent}`,
    })
  }
  if (design.cover === 'soft') {
    return tag(
      'section',
      title +
        tag('section', '', {
          width: '24px',
          height: '3px',
          margin: '18px 0 0',
          background: accent,
        }),
      { ...coverStyle, padding: '8px 0 4px' },
    )
  }
  if (design.cover === 'ticket') {
    return tag('section', title, {
      ...coverStyle,
      padding: '16px 14px',
      border: `1px solid ${theme.border}`,
      borderTop: `4px solid ${theme.color}`,
      borderBottom: `2px solid ${accent}`,
      background: theme.bgSoft,
    })
  }
  return tag('section', title, {
    ...coverStyle,
    padding: '14px 16px',
    borderLeft: `4px solid ${accent}`,
    background: theme.bgSoft,
  })
}

export function renderToc(context: ThemeRenderContext): string {
  const { design, article, theme } = context
  const sections = article.headings.filter((heading) => heading.level === 2)
  const explicitlyShown = theme.componentOverrides?.tocMode === 'show'
  if (!design.showToc || sections.length < (explicitlyShown ? 2 : design.tocMinSections)) return ''
  const accent = theme.headingAccent || theme.accent
  const items = sections
    .map((heading, index) =>
      tag(
        'p',
        tag('span', padNumber(index + 1), {
          display: 'inline-block',
          width: '28px',
          color: accent,
          fontSize: '12px',
          fontWeight: '600',
        }) + escapeText(heading.text),
        {
          margin: index === sections.length - 1 ? '0' : '0 0 8px',
          color: theme.color,
          fontSize: '14px',
          lineHeight: '1.6',
        },
      ),
    )
    .join('')
  const containerStyle: Style = {
    margin: '0 0 28px',
    padding: '16px 18px',
    background: theme.bgSoft,
    borderTop: `1px solid ${theme.border}`,
    borderBottom: `1px solid ${theme.border}`,
  }
  if (design.cover === 'minimal' || design.cover === 'paper') {
    Object.assign(containerStyle, { padding: '16px 0', background: 'transparent' })
  } else if (design.cover === 'guide') {
    Object.assign(containerStyle, {
      borderLeft: `2px solid ${accent}`,
      borderTop: undefined,
      borderBottom: undefined,
    })
  }
  return tag(
    'section',
    tag('p', '本文目录', {
      margin: '0 0 12px',
      color: theme.muted,
      fontSize: '12px',
      fontWeight: '600',
    }) + items,
    containerStyle,
  )
}

export function renderSectionHeading(
  content: string,
  level: number,
  sectionIndex: number,
  context: ThemeRenderContext,
): string {
  const { design, theme } = context
  const accent = theme.headingAccent || theme.accent
  const decoratedTitle = decorateHeading(content, level, theme)
  const base: Style = {
    margin: level === 2 ? `${design.sectionGap}px 0 16px` : '24px 0 12px',
    color: headingColor(theme, level),
    fontFamily: level === 2 && design.titleSerif ? EDITORIAL_SERIF : theme.fontFamily,
    fontSize: `${(theme.fontSize || 16) + (level === 2 ? 5 : level === 3 ? 2 : 0)}px`,
    lineHeight: '1.5',
    fontWeight: level === 2 ? '700' : '600',
  }
  if (level > 2) return tag('p', decoratedTitle.content, { ...base, ...decoratedTitle.style })
  if (design.section === 'numbered') {
    const numberStyle: Style = {
      display: 'inline-block',
      marginRight: '12px',
      color: accent,
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      lineHeight: '1.5',
      fontWeight: '600',
      verticalAlign: 'middle',
    }
    if (design.cover === 'index') {
      Object.assign(numberStyle, {
        padding: '2px 6px',
        color: theme.canvas || '#ffffff',
        background: accent,
      })
    } else if (design.cover === 'guide') {
      Object.assign(numberStyle, {
        padding: '3px 7px',
        background: theme.bgSoft,
        border: `1px solid ${theme.border}`,
        borderRadius: '3px',
      })
    }
    return tag(
      'section',
      tag('span', padNumber(sectionIndex), numberStyle) +
        tag('span', decoratedTitle.content, decoratedTitle.style),
      { ...base, paddingBottom: '10px', borderBottom: `1px solid ${theme.border}` },
    )
  }
  if (design.section === 'label') {
    const clipping = design.cover === 'ticket'
    return tag(
      'section',
      tag('span', padNumber(sectionIndex), {
        display: 'inline-block',
        marginRight: '10px',
        padding: clipping ? '2px 5px' : undefined,
        color: clipping ? theme.canvas || '#ffffff' : accent,
        background: clipping ? theme.color : undefined,
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fontWeight: '600',
        verticalAlign: 'middle',
      }) + tag('span', decoratedTitle.content, decoratedTitle.style),
      {
        ...base,
        paddingBottom: clipping ? '10px' : undefined,
        borderBottom: clipping ? `1px dashed ${theme.border}` : undefined,
      },
    )
  }
  if (design.section === 'marker') {
    return tag(
      'section',
      tag('span', decoratedTitle.content, {
        padding: '0 0 5px',
        borderBottom: `3px solid ${alpha(accent, 0.25)}`,
        ...decoratedTitle.style,
      }),
      base,
    )
  }
  if (design.section === 'stamp') {
    return tag(
      'section',
      tag('span', padNumber(sectionIndex), {
        display: 'inline-block',
        marginRight: '10px',
        padding: '2px 5px',
        color: accent,
        border: `1px solid ${accent}`,
        fontSize: '12px',
        fontWeight: '400',
        lineHeight: '1.4',
        verticalAlign: 'middle',
      }) + tag('span', decoratedTitle.content, decoratedTitle.style),
      base,
    )
  }
  return tag(
    'section',
    tag('section', '', {
      width: design.cover === 'soft' ? '16px' : '24px',
      height: '1px',
      background: accent,
      margin: '0 0 12px',
    }) + tag('p', decoratedTitle.content, { margin: '0', ...decoratedTitle.style }),
    base,
  )
}

export function renderQuote(content: string, context: ThemeRenderContext): string {
  const { design, theme } = context
  const accent = theme.quoteAccent || theme.accent
  const base: Style = {
    margin: '24px 0',
    color: theme.color,
    fontSize: `${theme.fontSize || 16}px`,
    lineHeight: '1.85',
  }
  if (design.quote === 'pull') {
    const portrait = design.cover === 'soft'
    return tag('section', content, {
      ...base,
      margin: '28px 8px',
      padding: portrait ? '8px 0 8px 16px' : '16px 0 8px',
      fontFamily: EDITORIAL_SERIF,
      fontSize: `${(theme.fontSize || 16) + 1}px`,
      borderLeft: portrait ? `2px solid ${accent}` : undefined,
      borderTop: portrait ? undefined : `1px solid ${theme.border}`,
      borderBottom: portrait ? undefined : `1px solid ${theme.border}`,
    })
  }
  if (design.quote === 'panel') {
    return tag('section', content, {
      ...base,
      padding: '16px 16px 8px',
      background: theme.quoteBg,
      borderTop: design.cover === 'ticket' ? `2px solid ${accent}` : undefined,
      borderRadius: design.cover === 'index' ? '4px' : undefined,
    })
  }
  if (design.quote === 'note') {
    return tag('section', content, {
      ...base,
      padding: '14px 16px 6px',
      background: theme.quoteBg,
      borderLeft: `2px solid ${accent}`,
    })
  }
  if (design.quote === 'outline') {
    return tag('section', content, {
      ...base,
      padding: '16px 16px 8px',
      border: `1px solid ${theme.border}`,
      fontFamily: EDITORIAL_SERIF,
    })
  }
  return tag('section', content, {
    ...base,
    padding: '4px 0 0 16px',
    borderLeft: `2px solid ${accent}`,
  })
}

export function renderList(
  items: string[],
  ordered: boolean,
  context: ThemeRenderContext,
  start = 1,
): string {
  const { design, theme } = context
  const variant = ordered ? design.orderedList : design.unorderedList
  const rendered = items
    .map((content, index) => {
      const marker = ordered ? padNumber(index + start) : '•'
      const markerStyle: Style = {
        display: 'inline-block',
        width: ordered ? '30px' : '22px',
        color: theme.accent,
        fontSize: ordered ? '13px' : '16px',
        lineHeight: '1.8',
        fontWeight: '600',
        verticalAlign: 'top',
      }
      const rowStyle: Style = {
        margin: '0 0 8px',
        color: theme.color,
        fontSize: `${theme.fontSize || 16}px`,
        lineHeight: '1.8',
      }
      if (variant === 'steps') {
        Object.assign(markerStyle, { width: '32px', fontWeight: '700' })
        Object.assign(rowStyle, { padding: '10px 0', borderBottom: `1px solid ${theme.border}` })
      } else if (variant === 'cards') {
        Object.assign(rowStyle, {
          padding: '12px 14px',
          background: theme.bgSoft,
          borderRadius: '4px',
        })
      } else if (variant === 'ledger') {
        Object.assign(rowStyle, {
          margin: '0',
          padding: '10px 0',
          borderBottom: `1px solid ${theme.border}`,
        })
      }
      return tag(
        'section',
        tag('span', marker, markerStyle) +
          tag('section', content, {
            display: 'inline-block',
            width: `calc(100% - ${ordered ? 34 : 24}px)`,
            verticalAlign: 'top',
          }),
        rowStyle,
      )
    })
    .join('')
  return tag('section', rendered, { margin: '0 0 24px' })
}

export function renderTable(tableHtml: string, context: ThemeRenderContext): string {
  const { design, theme } = context
  return tag('section', tableHtml, {
    margin: '24px 0',
    padding: '0',
    overflowX: 'auto',
    border: design.table === 'grid' ? `1px solid ${theme.border}` : undefined,
    background: design.table === 'striped' ? theme.bgSoft : theme.canvas,
  })
}

export function renderImage(image: string, caption: string, context: ThemeRenderContext): string {
  const { design, theme } = context
  return tag(
    'section',
    image +
      (caption
        ? tag('p', caption, {
            margin: '9px 0 0',
            color: theme.muted,
            fontSize: '13px',
            lineHeight: '1.6',
            textAlign: design.cover === 'paper' ? 'left' : 'center',
          })
        : ''),
    {
      margin: '22px 0',
      padding: design.cover === 'ticket' || design.cover === 'paper' ? '5px' : '0',
      border:
        design.cover === 'ticket' || design.cover === 'paper'
          ? `1px solid ${theme.border}`
          : undefined,
    },
  )
}

export function renderDivider(context: ThemeRenderContext): string {
  const { theme, design } = context
  const accent = theme.underlineColor || theme.accent
  if (design.section === 'stamp') {
    return tag('p', '◆', {
      margin: '28px 0',
      color: accent,
      fontSize: '10px',
      textAlign: 'center',
      letterSpacing: '8px',
    })
  }
  return tag('section', '', { height: '1px', margin: '28px 0', background: alpha(accent, 0.45) })
}

export function renderEndMark(context: ThemeRenderContext): string {
  const { design, theme } = context
  if (!design.endMark) return ''
  return tag('section', escapeText(design.endMark), {
    margin: '32px 0 8px',
    paddingTop: '12px',
    borderTop: `1px solid ${theme.border}`,
    color: theme.muted,
    fontSize: '13px',
    lineHeight: '1.6',
    textAlign: 'center',
  })
}

export function renderCallout(
  kind: string,
  title: string,
  content: string,
  context: ThemeRenderContext,
): string {
  const { theme, design } = context
  const label = title
    ? tag('p', title, {
        margin: '0 0 10px',
        color: theme.accent,
        fontSize: '13px',
        fontWeight: '600',
        lineHeight: '1.5',
      })
    : ''
  if (kind === 'signature') {
    return tag('section', label + content, {
      margin: '32px 0 0',
      padding: '16px 0 0',
      borderTop: `1px solid ${theme.border}`,
      color: theme.muted,
      fontSize: '14px',
      lineHeight: '1.8',
    })
  }
  if (kind === 'lead') {
    const isNarrative = ['editorial', 'cinnabar', 'soft', 'botanical', 'paper'].includes(
      design.cover,
    )
    return tag('section', label + content, {
      margin: '0 0 28px',
      padding: isNarrative ? '0 0 4px' : '16px 16px 0',
      color: theme.color,
      lineHeight: '1.85',
      borderBottom: isNarrative ? `1px solid ${theme.border}` : undefined,
      borderLeft: !isNarrative ? `2px solid ${theme.accent}` : undefined,
      background: isNarrative ? undefined : theme.bgSoft,
    })
  }
  return tag('section', label + content, {
    margin: '24px 0',
    padding: '16px 16px 0',
    border: `1px solid ${theme.border}`,
    borderRadius: `${Math.min(design.radius, 4)}px`,
    background: theme.bgSoft,
  })
}
