<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useThemeStore } from '@/stores/theme'
import AppIcon from '@/components/ui/AppIcon.vue'

const ui = useUiStore()
const themeStore = useThemeStore()

const isOpen = computed(() => ui.activeModals.themeEditor)

const accent = ref('#07c160')
const fontSize = ref(16)
const lineHeight = ref(1.8)
const width = ref(420)
const h1Mode = ref<'underline' | 'center' | 'panel' | 'plain'>('underline')
const headingMode = ref<'bar' | 'chip' | 'plain'>('bar')
const quoteMode = ref<'bar' | 'panel' | 'soft'>('bar')
const fontFamily = ref("-apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif")
const colorInputRef = ref<HTMLInputElement | null>(null)

const presetColors = ['#07c160', '#111111', '#006d77', '#2468a2', '#b14f2a', '#8ab4a6', '#dc2626', '#7c3aed']

const fontOptions = [
  { label: '系统默认', value: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif" },
  { label: '宋体/衬线', value: "'Songti SC', 'STSong', 'Noto Serif CJK SC', 'SimSun', serif" },
  { label: '优雅西文', value: "'Optima', 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif" },
]

const h1Modes = [
  { label: '下划线', value: 'underline' },
  { label: '居中', value: 'center' },
  { label: '卡片', value: 'panel' },
  { label: '朴素', value: 'plain' },
]

const headingModes = [
  { label: '竖线', value: 'bar' },
  { label: '标签', value: 'chip' },
  { label: '朴素', value: 'plain' },
]

const quoteModes = [
  { label: '竖线', value: 'bar' },
  { label: '卡片', value: 'panel' },
  { label: '柔和', value: 'soft' },
]

function close() {
  ui.closeModal('themeEditor')
}

function applyToStore() {
  themeStore.setCustomTheme({
    fontFamily: fontFamily.value,
    color: '#2f3033',
    accent: accent.value,
    muted: '#7d858c',
    border: '#e7e7e7',
    bgSoft: '#f7fbf8',
    quoteBg: '#f5f7f6',
    h1Mode: h1Mode.value,
    headingMode: headingMode.value,
    quoteMode: quoteMode.value,
    fontSize: fontSize.value,
    lineHeight: lineHeight.value,
    width: width.value,
  })
  themeStore.currentThemeKey = 'custom'
}

function finish() {
  close()
}

function reset() {
  accent.value = '#07c160'
  fontSize.value = 16
  lineHeight.value = 1.8
  width.value = 420
  h1Mode.value = 'underline'
  headingMode.value = 'bar'
  quoteMode.value = 'bar'
  fontFamily.value = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif"
  applyToStore()
}

function loadFromCurrentTheme() {
  const base = themeStore.currentTheme.base
  accent.value = base.accent || '#07c160'
  fontSize.value = base.fontSize || 16
  lineHeight.value = base.lineHeight || 1.8
  width.value = base.width || 420
  h1Mode.value = (base.h1Mode as typeof h1Mode.value) || 'underline'
  headingMode.value = (base.headingMode as typeof headingMode.value) || 'bar'
  quoteMode.value = (base.quoteMode as typeof quoteMode.value) || 'bar'
  fontFamily.value = base.fontFamily || "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif"
}

// Snapshot to support cancel
let snapshot: {
  accent: string
  fontSize: number
  lineHeight: number
  width: number
  h1Mode: string
  headingMode: string
  quoteMode: string
  fontFamily: string
  prevThemeKey: string
} | null = null

watch(isOpen, (open) => {
  if (open) {
    loadFromCurrentTheme()
    snapshot = {
      accent: accent.value,
      fontSize: fontSize.value,
      lineHeight: lineHeight.value,
      width: width.value,
      h1Mode: h1Mode.value,
      headingMode: headingMode.value,
      quoteMode: quoteMode.value,
      fontFamily: fontFamily.value,
      prevThemeKey: themeStore.currentThemeKey,
    }
  }
})

watch(
  [accent, fontSize, lineHeight, width, h1Mode, headingMode, quoteMode, fontFamily],
  () => {
    applyToStore()
  },
  { deep: true },
)

function cancel() {
  if (snapshot) {
    accent.value = snapshot.accent
    fontSize.value = snapshot.fontSize
    lineHeight.value = snapshot.lineHeight
    width.value = snapshot.width
    h1Mode.value = snapshot.h1Mode as 'underline' | 'center' | 'panel' | 'plain'
    headingMode.value = snapshot.headingMode as 'bar' | 'chip' | 'plain'
    quoteMode.value = snapshot.quoteMode as 'bar' | 'panel' | 'soft'
    fontFamily.value = snapshot.fontFamily
    themeStore.currentThemeKey = snapshot.prevThemeKey
    applyToStore()
  }
  close()
}

function setH1Mode(v: string) { h1Mode.value = v as typeof h1Mode.value }
function setHeadingMode(v: string) { headingMode.value = v as typeof headingMode.value }
function setQuoteMode(v: string) { quoteMode.value = v as typeof quoteMode.value }

const previewHtml = computed(() => {
  const lh = lineHeight.value
  const fs = fontSize.value
  const w = width.value
  const ac = accent.value

  // H1 style based on mode (matching markdownRenderer.ts h1Style)
  let h1Style = ''
  const h1Size = fs + 8
  if (h1Mode.value === 'center') {
    h1Style = `margin:0 0 24px;color:#2f3033;font-size:${h1Size}px;font-weight:700;line-height:1.36;text-align:center;padding:8px 0 18px;border-bottom:1px solid #e7e7e7;`
  } else if (h1Mode.value === 'panel') {
    h1Style = `margin:0 0 24px;color:#2f3033;font-size:${h1Size}px;font-weight:700;line-height:1.36;padding:18px;border:1px solid #e7e7e7;border-radius:8px;background:#f7fbf8;`
  } else if (h1Mode.value === 'plain') {
    h1Style = `margin:0 0 24px;color:#2f3033;font-size:${h1Size}px;font-weight:700;line-height:1.36;padding:0 0 4px;`
  } else {
    h1Style = `margin:0 0 24px;color:#2f3033;font-size:${h1Size}px;font-weight:700;line-height:1.36;padding:0 0 12px;border-bottom:2px solid ${ac};`
  }

  // Heading content span (matching markdownRenderer.ts headingContent)
  let headingSpanStyle = ''
  if (headingMode.value === 'chip') {
    headingSpanStyle = `display:inline-block;padding:5px 10px;border-radius:6px;background:#f7fbf8;color:${ac};`
  } else if (headingMode.value === 'plain') {
    headingSpanStyle = `display:inline-block;padding-bottom:3px;border-bottom:1px solid ${ac};`
  } else {
    headingSpanStyle = `display:inline-block;padding-left:10px;border-left:4px solid ${ac};`
  }

  // Quote style (matching markdownRenderer.ts quoteStyle)
  let quoteStyle = ''
  const quoteFontSize = Math.max(13, fs - 1)
  if (quoteMode.value === 'panel') {
    quoteStyle = `margin:18px 0;padding:14px 15px;border:1px solid #e7e7e7;border-radius:8px;background:#f5f7f6;color:#7d858c;font-size:${quoteFontSize}px;line-height:${lh};`
  } else if (quoteMode.value === 'soft') {
    quoteStyle = `margin:18px 0;padding:13px 15px;border-radius:8px;background:#f5f7f6;color:#7d858c;font-size:${quoteFontSize}px;line-height:${lh};`
  } else {
    quoteStyle = `margin:18px 0;padding:12px 14px;border-left:4px solid ${ac};background:#f5f7f6;color:#7d858c;font-size:${quoteFontSize}px;line-height:${lh};`
  }

  return `<div style="max-width:${w}px;margin:0 auto;font-family:${fontFamily.value};">
<h1 style="${h1Style}">标题示例</h1>
<h2 style="margin:28px 0 14px;color:#2f3033;font-size:${fs + 4}px;font-weight:700;line-height:1.45;"><span style="${headingSpanStyle}">二级标题示例</span></h2>
<p style="margin:0 0 14px;line-height:${lh};color:#2f3033;font-size:${fs}px;">这是正文内容示例，支持自定义字体大小、行高和行宽设置。你可以通过左侧的控件实时调整样式，右侧预览会同步反映变更。</p>
<p style="margin:0 0 14px;line-height:${lh};color:#2f3033;font-size:${fs}px;">第二段文字用于展示段落间距与行高效果。合适的行高能显著提升长文阅读体验。</p>
<blockquote style="${quoteStyle}">
  这是引用块示例，使用主色作为左侧边框。
</blockquote>
<pre style="margin:18px 0;padding:16px;background:#f8fafc;border-radius:8px;overflow-x:auto;border:1px solid #e4e8ee;"><code style="font-family:Menlo,Monaco,Consolas,monospace;font-size:13px;line-height:1.7;color:#2f3033;">// 优雅的排版，从细节开始
function renderArticle(content, theme) {
  const { fontSize, lineHeight, accent } = theme;

  // 标题层级清晰，阅读更有节奏
  const headings = content.match(/^#{1,4}\s+.+$/gm) || [];

  // 中文字符与西文/数字之间自动添加间隙
  const spaced = content
    .replace(/([一-鿿])([a-zA-Z0-9])/g, '$1 $2')
    .replace(/([a-zA-Z0-9])([一-鿿])/g, '$1 $2');

  return {
    wordCount: spaced.length,
    headings: headings.length,
    styled: '<article style="line-height:' + lineHeight + ';">' + spaced + '</article>',
  };
}</code></pre>
</div>`
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-backdrop" @click.self="close">
        <section class="modal max-h-[85vh] flex flex-col" role="dialog" aria-modal="true" style="min-width: 720px; max-width: 960px; width: 85vw;">
          <div class="flex items-start justify-between gap-4 shrink-0 px-6 pt-5 pb-4">
            <div>
              <p class="text-[11px] font-semibold tracking-widest uppercase text-text-tertiary mb-0.5">Theme Builder</p>
              <h2 class="text-lg font-semibold tracking-tight leading-tight">自定义主题</h2>
            </div>
            <button
              type="button"
              class="w-8 h-8 flex items-center justify-center rounded-xl text-text-tertiary hover:text-text hover:bg-surface-hover border border-border bg-transparent transition-all"
              aria-label="关闭"
              @click="close"
            >
              <AppIcon name="x" :size="16" />
            </button>
          </div>

          <div class="grid grid-cols-[280px_1fr] gap-6 px-6 pb-6 flex-1 min-h-0 overflow-hidden">
            <!-- Controls -->
            <div class="space-y-6 h-full overflow-y-auto pr-1">
              <!-- Color -->
              <div class="space-y-2.5">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-text-secondary">主色</span>
                  <span class="text-[11px] font-mono text-text-tertiary">{{ accent }}</span>
                </div>
                <div class="flex gap-2 items-center">
                  <button
                    v-for="c in presetColors"
                    :key="c"
                    type="button"
                    class="w-6 h-6 rounded-full border-2 transition-all active:scale-90"
                    :class="accent === c ? 'border-text scale-110 shadow-sm' : 'border-transparent hover:scale-105'"
                    :style="{ background: c }"
                    @click="accent = c"
                  />
                  <button
                    type="button"
                    class="w-6 h-6 rounded-full border-2 border-border-subtle hover:border-border transition-all relative overflow-hidden"
                    :style="{ background: accent }"
                    @click="colorInputRef?.click()"
                  >
                    <span class="absolute inset-0 flex items-center justify-center">
                      <AppIcon name="palette" :size="10" class="text-white mix-blend-difference" />
                    </span>
                  </button>
                </div>
                <input ref="colorInputRef" v-model="accent" type="color" class="absolute opacity-0 w-0 h-0 pointer-events-none" tabindex="-1" />
              </div>

              <!-- Typography -->
              <div class="space-y-2.5">
                <span class="text-xs font-semibold text-text-secondary">字体</span>
                <div class="flex gap-0.5 bg-bg rounded-xl p-1">
                  <button
                    v-for="opt in fontOptions"
                    :key="opt.value"
                    type="button"
                    class="flex-1 h-8 rounded-lg text-[12px] font-medium transition-all active:scale-95"
                    :class="fontFamily === opt.value
                      ? 'bg-surface text-text shadow-sm font-semibold'
                      : 'text-text-tertiary hover:text-text'"
                    @click="fontFamily = opt.value"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>

              <!-- Sliders -->
              <div class="space-y-4">
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold text-text-secondary">正文字号</span>
                    <span class="text-xs font-mono text-text-tertiary bg-bg px-1.5 py-0.5 rounded">{{ fontSize }}px</span>
                  </div>
                  <input
                    :value="fontSize"
                    type="range"
                    min="14"
                    max="20"
                    class="w-full accent-slider"
                    @input="fontSize = Number(($event.target as HTMLInputElement).value)"
                  />
                  <div class="flex justify-between text-[10px] text-text-tertiary px-0.5">
                    <span>14</span>
                    <span>20</span>
                  </div>
                </div>

                <div class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold text-text-secondary">行高</span>
                    <span class="text-xs font-mono text-text-tertiary bg-bg px-1.5 py-0.5 rounded">{{ lineHeight }}</span>
                  </div>
                  <input
                    :value="lineHeight"
                    type="range"
                    min="1.5"
                    max="2.2"
                    step="0.05"
                    class="w-full accent-slider"
                    @input="lineHeight = Number(($event.target as HTMLInputElement).value)"
                  />
                  <div class="flex justify-between text-[10px] text-text-tertiary px-0.5">
                    <span>1.5</span>
                    <span>2.2</span>
                  </div>
                </div>

                <div class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold text-text-secondary">内容宽度</span>
                    <span class="text-xs font-mono text-text-tertiary bg-bg px-1.5 py-0.5 rounded">{{ width }}px</span>
                  </div>
                  <input
                    :value="width"
                    type="range"
                    min="360"
                    max="600"
                    class="w-full accent-slider"
                    @input="width = Number(($event.target as HTMLInputElement).value)"
                  />
                  <div class="flex justify-between text-[10px] text-text-tertiary px-0.5">
                    <span>360</span>
                    <span>600</span>
                  </div>
                </div>
              </div>

              <!-- Modes -->
              <div class="space-y-3.5">
                <div class="space-y-2">
                  <span class="text-xs font-semibold text-text-secondary">一级标题样式</span>
                  <div class="flex gap-0.5 bg-bg rounded-xl p-1">
                    <button
                      v-for="m in h1Modes"
                      :key="m.value"
                      type="button"
                      class="flex-1 h-8 rounded-lg text-[12px] font-medium transition-all active:scale-95"
                      :class="h1Mode === m.value
                        ? 'bg-surface text-text shadow-sm font-semibold'
                        : 'text-text-tertiary hover:text-text'"
                      @click="setH1Mode(m.value)"
                    >
                      {{ m.label }}
                    </button>
                  </div>
                </div>

                <div class="space-y-2">
                  <span class="text-xs font-semibold text-text-secondary">二级以上标题样式</span>
                  <div class="flex gap-0.5 bg-bg rounded-xl p-1">
                    <button
                      v-for="m in headingModes"
                      :key="m.value"
                      type="button"
                      class="flex-1 h-8 rounded-lg text-[12px] font-medium transition-all active:scale-95"
                      :class="headingMode === m.value
                        ? 'bg-surface text-text shadow-sm font-semibold'
                        : 'text-text-tertiary hover:text-text'"
                      @click="setHeadingMode(m.value)"
                    >
                      {{ m.label }}
                    </button>
                  </div>
                </div>

                <div class="space-y-2">
                  <span class="text-xs font-semibold text-text-secondary">引用块样式</span>
                  <div class="flex gap-0.5 bg-bg rounded-xl p-1">
                    <button
                      v-for="m in quoteModes"
                      :key="m.value"
                      type="button"
                      class="flex-1 h-8 rounded-lg text-[12px] font-medium transition-all active:scale-95"
                      :class="quoteMode === m.value
                        ? 'bg-surface text-text shadow-sm font-semibold'
                        : 'text-text-tertiary hover:text-text'"
                      @click="setQuoteMode(m.value)"
                    >
                      {{ m.label }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Preview -->
            <div class="border border-border rounded-2xl overflow-hidden flex flex-col bg-white shadow-sm h-full">
              <div class="shrink-0 px-5 py-3 border-b border-border-subtle flex items-center gap-2.5 bg-bg/40">
                <span class="w-2 h-2 rounded-full bg-success" />
                <span class="text-[11px] font-semibold tracking-widest uppercase text-text-tertiary">实时预览</span>
              </div>
              <div class="flex-1 overflow-y-auto p-6 bg-white">
                <div v-html="previewHtml" />
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2.5 shrink-0 px-6 pt-4 pb-6 border-t border-border-subtle dark:border-border">
            <button type="button" class="h-9 px-4 rounded-xl text-[13px] font-medium bg-surface text-text border border-border hover:bg-surface-hover active:scale-[0.96] transition-all inline-flex items-center justify-center gap-2" @click="cancel">取消</button>
            <button type="button" class="h-9 px-4 rounded-xl text-[13px] font-medium bg-surface text-text border border-border hover:bg-surface-hover active:scale-[0.96] transition-all inline-flex items-center justify-center gap-2" @click="reset">重置</button>
            <button type="button" class="h-9 px-4 rounded-xl text-[13px] font-semibold bg-[#18181b] !text-white border border-[#18181b] hover:bg-[#27272a] hover:border-[#27272a] active:scale-[0.96] transition-all inline-flex items-center justify-center gap-2 shadow-sm" @click="finish">完成</button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.accent-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: var(--color-border);
  outline: none;
  cursor: pointer;
}

.accent-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-accent);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  border: 2px solid var(--color-surface);
  transition: transform 0.15s ease;
}

.accent-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.accent-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-accent);
  cursor: pointer;
  border: 2px solid var(--color-surface);
  box-shadow: var(--shadow-sm);
}
</style>
