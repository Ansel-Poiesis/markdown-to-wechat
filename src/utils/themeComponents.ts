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
  const styleAttr = Object.keys(style).length ? ` style="${css(style)}"` : ''
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

  if (mode === 'underline' || (mode === 'plain' && level > 1)) {
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
      overrides?.endMarkMode === 'hide' ? '' : overrides?.endMarkText?.trim() || base.endMark,
  }
  return { theme, design, article }
}

export function renderCover(content: string, context: ThemeRenderContext): string {
  const { theme, design, article } = context
  const accent = theme.headingAccent || theme.accent
  const decoratedTitle = decorateHeading(content, 1, theme)
  const title = tag('p', decoratedTitle.content, {
    margin: '0',
    color: headingColor(theme, 1),
    fontSize: `${(theme.fontSize || 16) + 9}px`,
    lineHeight: '1.35',
    fontWeight: '800',
    textAlign: design.cover === 'minimal' || design.cover === 'ticket' ? 'left' : 'center',
    ...decoratedTitle.style,
  })
  const eyebrow = tag('p', design.eyebrow, {
    margin: '0 0 14px',
    color: accent,
    fontSize: '10px',
    lineHeight: '1.4',
    fontWeight: '700',
    letterSpacing: '2px',
    textAlign: design.cover === 'minimal' || design.cover === 'ticket' ? 'left' : 'center',
  })
  const meta = tag('p', `${padNumber(article.sectionCount)} SECTIONS`, {
    margin: '14px 0 0',
    color: theme.muted,
    fontSize: '10px',
    lineHeight: '1.4',
    letterSpacing: '1px',
    textAlign: design.cover === 'minimal' || design.cover === 'ticket' ? 'left' : 'center',
  })

  if (design.cover === 'cinnabar') {
    return tag('section', eyebrow + title + meta, {
      margin: '0 0 30px',
      padding: '26px 22px 22px',
      borderTop: `4px solid ${accent}`,
      borderBottom: `1px solid ${theme.border}`,
      background: theme.canvas,
    })
  }
  if (design.cover === 'minimal') {
    return tag('section', eyebrow + title + meta, {
      margin: '0 0 32px',
      padding: '24px 0 20px',
      borderTop: `1px solid ${theme.color}`,
      borderBottom: `4px solid ${theme.color}`,
    })
  }
  if (design.cover === 'index') {
    return tag(
      'section',
      tag('p', '01', {
        margin: '0 0 16px',
        color: accent,
        fontSize: '36px',
        lineHeight: '1',
        fontWeight: '300',
      }) +
        eyebrow +
        title +
        meta,
      {
        margin: '0 0 30px',
        padding: '24px 22px',
        borderLeft: `4px solid ${accent}`,
        background: theme.bgSoft,
      },
    )
  }
  if (design.cover === 'botanical') {
    return tag('section', eyebrow + title + meta, {
      margin: '0 0 34px',
      padding: '30px 18px',
      borderTop: `1px solid ${alpha(accent, 0.35)}`,
      borderBottom: `1px solid ${alpha(accent, 0.35)}`,
      background: theme.bgSoft,
    })
  }
  if (design.cover === 'paper') {
    return tag('section', eyebrow + title + meta, {
      margin: '0 0 34px',
      padding: '28px 20px',
      border: `1px solid ${theme.border}`,
      borderTop: `5px solid ${accent}`,
      background: theme.bgSoft,
    })
  }
  if (design.cover === 'soft') {
    return tag('section', eyebrow + title + meta, {
      margin: '0 0 30px',
      padding: '28px 22px',
      borderRadius: `${design.radius}px`,
      background: theme.bgSoft,
      boxShadow: `inset 0 0 0 1px ${alpha(accent, 0.12)}`,
    })
  }
  if (design.cover === 'ticket') {
    return tag(
      'section',
      tag('p', design.eyebrow, {
        margin: '0 0 16px',
        color: accent,
        fontSize: '10px',
        fontWeight: '700',
        letterSpacing: '2px',
      }) +
        title +
        meta,
      {
        margin: '0 0 30px',
        padding: '24px 20px',
        border: `2px solid ${theme.color}`,
        borderLeft: `10px solid ${accent}`,
        background: theme.bgSoft,
      },
    )
  }
  if (design.cover === 'guide') {
    return tag('section', eyebrow + title + meta, {
      margin: '0 0 30px',
      padding: '26px 22px',
      borderRadius: `${design.radius}px`,
      border: `1px solid ${theme.border}`,
      borderBottom: `5px solid ${accent}`,
      background: theme.bgSoft,
    })
  }
  return tag('section', eyebrow + title + meta, {
    margin: '0 0 32px',
    padding: '28px 18px 24px',
    borderTop: `1px solid ${theme.border}`,
    borderBottom: `1px solid ${theme.border}`,
  })
}

export function renderToc(context: ThemeRenderContext): string {
  const { design, article, theme } = context
  const sections = article.headings.filter((heading) => heading.level === 2)
  if (!design.showToc || sections.length < 2) return ''
  const accent = theme.headingAccent || theme.accent
  const items = sections
    .map((heading, index) =>
      tag(
        'p',
        tag('span', padNumber(index + 1), {
          display: 'inline-block',
          width: '30px',
          color: accent,
          fontSize: '11px',
          fontWeight: '700',
        }) + escapeText(heading.text),
        {
          margin: index === sections.length - 1 ? '0' : '0 0 9px',
          color: theme.color,
          fontSize: '13px',
          lineHeight: '1.6',
        },
      ),
    )
    .join('')
  const containerStyle: Style = {
    margin: '0 0 30px',
    padding: '18px 20px',
    borderLeft: `3px solid ${accent}`,
    background: theme.bgSoft,
  }
  if (design.cover === 'minimal') {
    Object.assign(containerStyle, {
      padding: '18px 0',
      borderLeft: undefined,
      borderTop: `1px solid ${theme.color}`,
      borderBottom: `1px solid ${theme.color}`,
      background: 'transparent',
    })
  } else if (design.cover === 'ticket') {
    Object.assign(containerStyle, {
      border: `1px dashed ${accent}`,
      borderLeft: `7px solid ${accent}`,
      background: theme.canvas,
    })
  } else if (design.cover === 'paper') {
    Object.assign(containerStyle, {
      borderLeft: `1px solid ${theme.border}`,
      borderRight: `1px solid ${theme.border}`,
      background: theme.bgSoft,
    })
  }
  return tag(
    'section',
    tag('p', 'CONTENTS', {
      margin: '0 0 14px',
      color: theme.muted,
      fontSize: '10px',
      fontWeight: '700',
      letterSpacing: '2px',
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
  const size = `${(theme.fontSize || 16) + (level === 2 ? 4 : level === 3 ? 2 : 0)}px`
  const base: Style = {
    margin: level === 2 ? '34px 0 18px' : '26px 0 12px',
    color: headingColor(theme, level),
    fontSize: size,
    lineHeight: '1.5',
    fontWeight: '750',
  }
  if (level > 2) return tag('p', decoratedTitle.content, { ...base, ...decoratedTitle.style })
  if (design.section === 'numbered') {
    return tag(
      'section',
      tag('span', padNumber(sectionIndex), {
        display: 'inline-block',
        marginRight: '12px',
        color: accent,
        fontSize: '28px',
        lineHeight: '1',
        fontWeight: '300',
        verticalAlign: 'middle',
      }) +
        tag('span', decoratedTitle.content, { verticalAlign: 'middle', ...decoratedTitle.style }),
      base,
    )
  }
  if (design.section === 'label') {
    return tag(
      'p',
      tag('span', `${padNumber(sectionIndex)} · `, { color: accent }) +
        tag('span', decoratedTitle.content, decoratedTitle.style),
      {
        ...base,
        padding: '8px 12px',
        borderLeft: `5px solid ${accent}`,
        background: theme.bgSoft,
      },
    )
  }
  if (design.section === 'marker') {
    return tag('p', decoratedTitle.content, {
      ...base,
      display: 'inline-block',
      padding: '2px 6px',
      background: `linear-gradient(transparent 55%,${alpha(accent, 0.22)} 0)`,
      ...decoratedTitle.style,
    })
  }
  if (design.section === 'stamp') {
    return tag(
      'section',
      tag('span', padNumber(sectionIndex), {
        display: 'inline-block',
        marginRight: '10px',
        padding: '2px 6px',
        color: accent,
        border: `1px solid ${accent}`,
        fontSize: '11px',
        lineHeight: '1.4',
        verticalAlign: 'middle',
      }) +
        tag('span', decoratedTitle.content, { verticalAlign: 'middle', ...decoratedTitle.style }),
      base,
    )
  }
  return tag('p', decoratedTitle.content, {
    ...base,
    paddingBottom: '8px',
    borderBottom: `2px solid ${accent}`,
    ...decoratedTitle.style,
  })
}

export function renderQuote(content: string, context: ThemeRenderContext): string {
  const { design, theme } = context
  const accent = theme.quoteAccent || theme.accent
  const base: Style = {
    margin: '22px 0',
    color: theme.color,
    fontSize: `${Math.max((theme.fontSize || 16) - 1, 13)}px`,
    lineHeight: '1.85',
  }
  if (design.quote === 'pull') {
    return tag(
      'section',
      tag('p', '“', { margin: '0 0 -12px', color: accent, fontSize: '40px', lineHeight: '1' }) +
        content,
      {
        ...base,
        padding: '18px 20px',
        borderTop: `1px solid ${accent}`,
        borderBottom: `1px solid ${accent}`,
        textAlign: 'center',
      },
    )
  }
  if (design.quote === 'panel')
    return tag('section', content, {
      ...base,
      padding: '18px 20px',
      background: theme.quoteBg,
      border: `1px solid ${theme.border}`,
    })
  if (design.quote === 'note')
    return tag('section', content, {
      ...base,
      padding: '16px 18px',
      background: theme.quoteBg,
      borderLeft: `4px solid ${accent}`,
      borderRadius: `${design.radius}px`,
    })
  if (design.quote === 'outline')
    return tag('section', content, {
      ...base,
      padding: '17px 19px',
      border: `1px dashed ${accent}`,
    })
  return tag('section', content, {
    ...base,
    paddingLeft: '16px',
    borderLeft: `3px solid ${accent}`,
  })
}

export function renderList(items: string[], ordered: boolean, context: ThemeRenderContext): string {
  const { design, theme } = context
  const variant = ordered ? design.orderedList : design.unorderedList
  const accent = theme.accent
  const rendered = items
    .map((content, index) => {
      const marker = ordered ? padNumber(index + 1) : '•'
      if (variant === 'cards' || variant === 'steps') {
        return tag(
          'section',
          tag('span', marker, {
            display: 'inline-block',
            minWidth: ordered ? '30px' : '20px',
            marginRight: '10px',
            color: accent,
            fontSize: ordered ? '13px' : '18px',
            fontWeight: '800',
            verticalAlign: 'top',
          }) +
            tag('span', content, {
              display: 'inline-block',
              maxWidth: '88%',
              verticalAlign: 'top',
            }),
          {
            margin: '0 0 9px',
            padding: '11px 13px',
            color: theme.color,
            fontSize: `${theme.fontSize || 16}px`,
            lineHeight: '1.7',
            border: `1px solid ${theme.border}`,
            borderRadius: `${design.radius}px`,
            background: variant === 'cards' ? theme.bgSoft : theme.canvas,
          },
        )
      }
      if (variant === 'ledger') {
        return tag(
          'p',
          tag('span', marker, {
            display: 'inline-block',
            width: '34px',
            color: accent,
            fontWeight: '700',
          }) + content,
          {
            margin: '0',
            padding: '10px 0',
            color: theme.color,
            fontSize: `${theme.fontSize || 16}px`,
            lineHeight: '1.7',
            borderBottom: `1px solid ${theme.border}`,
          },
        )
      }
      return tag(
        'p',
        tag('span', marker, {
          display: 'inline-block',
          width: ordered ? '32px' : '22px',
          color: accent,
          fontWeight: '700',
        }) + content,
        {
          margin: '0 0 8px',
          color: theme.color,
          fontSize: `${theme.fontSize || 16}px`,
          lineHeight: '1.75',
        },
      )
    })
    .join('')
  return tag('section', rendered, { margin: '0 0 20px' })
}

export function renderTable(tableHtml: string, context: ThemeRenderContext): string {
  const { design, theme } = context
  return tag('section', tableHtml, {
    margin: '22px 0',
    padding: design.table === 'ledger' ? '0' : '4px',
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
            fontSize: '12px',
            lineHeight: '1.6',
            textAlign: 'center',
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
  return tag(
    'section',
    tag('span', '', {
      display: 'inline-block',
      width: '34px',
      height: '1px',
      marginRight: '12px',
      background: theme.border,
      verticalAlign: 'middle',
    }) +
      tag('span', escapeText(design.endMark), {
        color: theme.muted,
        fontSize: '10px',
        fontWeight: '700',
        letterSpacing: '2px',
        verticalAlign: 'middle',
      }) +
      tag('span', '', {
        display: 'inline-block',
        width: '34px',
        height: '1px',
        marginLeft: '12px',
        background: theme.border,
        verticalAlign: 'middle',
      }),
    { margin: '36px 0 10px', textAlign: 'center' },
  )
}

export function renderCallout(
  kind: string,
  title: string,
  content: string,
  context: ThemeRenderContext,
): string {
  const { theme, design } = context
  const accent = theme.accent
  if (kind === 'signature') {
    return tag(
      'section',
      tag('p', title || '作者', {
        margin: '0 0 8px',
        color: accent,
        fontSize: '12px',
        fontWeight: '700',
      }) + content,
      {
        margin: '28px 0 0',
        padding: '18px 0 0',
        borderTop: `1px solid ${theme.border}`,
        color: theme.muted,
        fontSize: '13px',
        lineHeight: '1.7',
      },
    )
  }
  if (kind === 'lead') {
    return tag('section', content, {
      margin: '0 0 26px',
      padding: '18px 20px',
      color: theme.color,
      fontSize: `${(theme.fontSize || 16) + 1}px`,
      lineHeight: '1.85',
      borderLeft: `4px solid ${accent}`,
      background: theme.bgSoft,
    })
  }
  return tag(
    'section',
    (title
      ? tag('p', title, { margin: '0 0 8px', color: accent, fontSize: '13px', fontWeight: '800' })
      : '') + content,
    {
      margin: '20px 0',
      padding: '16px 18px',
      border: `1px solid ${theme.border}`,
      borderRadius: `${design.radius}px`,
      background: theme.bgSoft,
    },
  )
}
