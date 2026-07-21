import type {
  CoverVariant,
  DesignThemeKey,
  ListVariant,
  QuoteVariant,
  SectionVariant,
  TableVariant,
} from '@/types'

export interface DesignTheme {
  key: DesignThemeKey
  label: string
  eyebrow: string
  cover: CoverVariant
  section: SectionVariant
  quote: QuoteVariant
  unorderedList: ListVariant
  orderedList: ListVariant
  table: TableVariant
  endMark: string
  radius: number
  showToc: boolean
}

export const designThemes: Record<DesignThemeKey, DesignTheme> = {
  qiuhe: {
    key: 'qiuhe',
    label: '秋河',
    eyebrow: 'AUTUMN NOTES',
    cover: 'editorial',
    section: 'numbered',
    quote: 'pull',
    unorderedList: 'plain',
    orderedList: 'steps',
    table: 'striped',
    endMark: '秋水有声',
    radius: 4,
    showToc: true,
  },
  zhujian: {
    key: 'zhujian',
    label: '朱简',
    eyebrow: 'HUMAN STUDIES',
    cover: 'cinnabar',
    section: 'label',
    quote: 'panel',
    unorderedList: 'cards',
    orderedList: 'steps',
    table: 'grid',
    endMark: '完',
    radius: 2,
    showToc: true,
  },
  songyan: {
    key: 'songyan',
    label: '松烟',
    eyebrow: 'CRITICAL ANALYSIS',
    cover: 'minimal',
    section: 'rule',
    quote: 'bar',
    unorderedList: 'ledger',
    orderedList: 'ledger',
    table: 'ledger',
    endMark: 'END',
    radius: 0,
    showToc: true,
  },
  yuebai: {
    key: 'yuebai',
    label: '月白',
    eyebrow: 'MODERN EXPLAINER',
    cover: 'index',
    section: 'numbered',
    quote: 'outline',
    unorderedList: 'cards',
    orderedList: 'steps',
    table: 'grid',
    endMark: '以上',
    radius: 6,
    showToc: true,
  },
  qingdai: {
    key: 'qingdai',
    label: '青黛',
    eyebrow: 'LIVING OBSERVATION',
    cover: 'botanical',
    section: 'marker',
    quote: 'note',
    unorderedList: 'plain',
    orderedList: 'steps',
    table: 'striped',
    endMark: '留白',
    radius: 6,
    showToc: false,
  },
  zhuzhi: {
    key: 'zhuzhi',
    label: '竹青纸本',
    eyebrow: 'PAPER ARCHIVE',
    cover: 'paper',
    section: 'stamp',
    quote: 'pull',
    unorderedList: 'ledger',
    orderedList: 'ledger',
    table: 'ledger',
    endMark: '止',
    radius: 0,
    showToc: true,
  },
  haitang: {
    key: 'haitang',
    label: '海棠',
    eyebrow: 'PERSONAL ESSAY',
    cover: 'soft',
    section: 'label',
    quote: 'pull',
    unorderedList: 'plain',
    orderedList: 'steps',
    table: 'striped',
    endMark: '愿有回响',
    radius: 8,
    showToc: false,
  },
  shupian: {
    key: 'shupian',
    label: '薯片纸袋',
    eyebrow: 'CULTURE REVIEW',
    cover: 'ticket',
    section: 'stamp',
    quote: 'bar',
    unorderedList: 'ledger',
    orderedList: 'steps',
    table: 'ledger',
    endMark: '拆袋完毕',
    radius: 0,
    showToc: true,
  },
  liujin: {
    key: 'liujin',
    label: '流金',
    eyebrow: 'ACTION GUIDE',
    cover: 'guide',
    section: 'numbered',
    quote: 'note',
    unorderedList: 'cards',
    orderedList: 'steps',
    table: 'grid',
    endMark: '完成',
    radius: 6,
    showToc: true,
  },
}

export function getDesignTheme(key?: DesignThemeKey): DesignTheme {
  return designThemes[key || 'qiuhe'] || designThemes.qiuhe
}
