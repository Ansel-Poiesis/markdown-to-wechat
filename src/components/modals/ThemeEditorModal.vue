<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useThemeStore } from '@/stores/theme'

const ui = useUiStore()
const themeStore = useThemeStore()

const isOpen = computed(() => ui.activeModals.themeEditor)

const accent = ref('#137565')
const color = ref('#1f2429')
const bg = ref('#ffffff')
const quoteBg = ref('#f5faf8')
const codeBg = ref('#f8fafc')
const borderColor = ref('#e4e8ee')
const headingMode = ref('bar')
const fontSize = ref(16)
const lineHeight = ref(180)
const width = ref(480)

function close() {
  ui.closeModal('themeEditor')
}

function save() {
  themeStore.setCustomTheme({
    fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif",
    color: color.value,
    accent: accent.value,
    muted: '#68717d',
    border: borderColor.value,
    bgSoft: quoteBg.value,
    quoteBg: quoteBg.value,
    canvas: bg.value !== '#ffffff' ? bg.value : undefined,
    h1Mode: 'panel',
    headingMode: headingMode.value,
    quoteMode: 'soft',
    fontSize: fontSize.value,
    lineHeight: lineHeight.value / 100,
    width: width.value,
  })
  themeStore.currentThemeKey = 'custom'
  close()
}

function reset() {
  themeStore.resetCustomTheme()
}

const previewHtml = computed(() => {
  return `<h1 style="margin:0 0 16px;color:${color.value};font-size:${fontSize.value + 8}px;font-weight:700;line-height:1.36;">标题示例</h1>
<p style="margin:0 0 12px;line-height:${lineHeight.value / 100};color:${color.value};font-size:${fontSize.value}px;">这是正文内容示例，支持自定义字体大小和行高设置。你可以通过左侧的控件实时调整样式。</p>
<blockquote style="margin:16px 0;padding:12px 16px;background:${quoteBg.value};border-left:4px solid ${accent.value};color:${color.value};border-radius:0 6px 6px 0;">
  这是引用块示例，使用主色作为左侧边框。
</blockquote>
<pre style="margin:16px 0;padding:16px;background:${codeBg.value};border-radius:8px;overflow-x:auto;border:1px solid ${borderColor.value};"><code style="font-family:Menlo,Monaco,Consolas,monospace;font-size:13px;line-height:1.7;color:${color.value};">function hello() {
  console.log('Hello World!')
}</code></pre>`
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-backdrop" @click.self="close">
        <section class="modal" role="dialog" aria-modal="true" style="min-width: 720px;">
          <div class="flex items-start justify-between gap-4 shrink-0 px-5 pt-5 pb-4">
            <div>
              <p class="text-[11px] font-semibold tracking-widest uppercase text-text-tertiary mb-0.5">Theme Builder</p>
              <h2 class="text-lg font-semibold tracking-tight leading-tight">自定义主题</h2>
            </div>
            <button
              type="button"
              class="w-8 h-8 flex items-center justify-center rounded-md text-text-tertiary hover:text-text hover:bg-surface-hover text-xl border border-border-subtle hover:border-border bg-transparent transition-all"
              aria-label="关闭"
              @click="close"
            >
              ×
            </button>
          </div>
          <div class="p-5 grid grid-cols-[320px_1fr] gap-6 overflow-y-auto">
            <!-- Left: Controls -->
            <div class="space-y-6">
              <div>
                <h3 class="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                  <span class="w-1 h-4 rounded-full bg-text" />
                  颜色配置
                </h3>
                <div class="grid grid-cols-2 gap-3">
                  <label class="grid gap-1.5">
                    <span class="text-xs font-medium text-text-secondary">主色</span>
                    <div class="flex items-center gap-2">
                      <input v-model="accent" type="color" class="w-8 h-8 rounded-md border border-border-subtle p-0.5" />
                      <span class="text-xs font-mono text-text-tertiary">{{ accent }}</span>
                    </div>
                  </label>
                  <label class="grid gap-1.5">
                    <span class="text-xs font-medium text-text-secondary">正文色</span>
                    <div class="flex items-center gap-2">
                      <input v-model="color" type="color" class="w-8 h-8 rounded-md border border-border-subtle p-0.5" />
                      <span class="text-xs font-mono text-text-tertiary">{{ color }}</span>
                    </div>
                  </label>
                  <label class="grid gap-1.5">
                    <span class="text-xs font-medium text-text-secondary">背景色</span>
                    <div class="flex items-center gap-2">
                      <input v-model="bg" type="color" class="w-8 h-8 rounded-md border border-border-subtle p-0.5" />
                      <span class="text-xs font-mono text-text-tertiary">{{ bg }}</span>
                    </div>
                  </label>
                  <label class="grid gap-1.5">
                    <span class="text-xs font-medium text-text-secondary">引用色</span>
                    <div class="flex items-center gap-2">
                      <input v-model="quoteBg" type="color" class="w-8 h-8 rounded-md border border-border-subtle p-0.5" />
                      <span class="text-xs font-mono text-text-tertiary">{{ quoteBg }}</span>
                    </div>
                  </label>
                  <label class="grid gap-1.5">
                    <span class="text-xs font-medium text-text-secondary">代码块背景</span>
                    <div class="flex items-center gap-2">
                      <input v-model="codeBg" type="color" class="w-8 h-8 rounded-md border border-border-subtle p-0.5" />
                      <span class="text-xs font-mono text-text-tertiary">{{ codeBg }}</span>
                    </div>
                  </label>
                  <label class="grid gap-1.5">
                    <span class="text-xs font-medium text-text-secondary">边框色</span>
                    <div class="flex items-center gap-2">
                      <input v-model="borderColor" type="color" class="w-8 h-8 rounded-md border border-border-subtle p-0.5" />
                      <span class="text-xs font-mono text-text-tertiary">{{ borderColor }}</span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <h3 class="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                  <span class="w-1 h-4 rounded-full bg-text" />
                  样式配置
                </h3>
                <div class="space-y-3">
                  <label class="grid gap-1.5">
                    <span class="text-xs font-medium text-text-secondary">标题样式</span>
                    <select v-model="headingMode">
                      <option value="bar">侧边线</option>
                      <option value="chip">标签</option>
                      <option value="plain">下划线</option>
                      <option value="none">无样式</option>
                    </select>
                  </label>
                  <label class="grid gap-1.5">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-medium text-text-secondary">正文字号</span>
                      <span class="text-xs font-mono text-text-tertiary">{{ fontSize }}px</span>
                    </div>
                    <input v-model="fontSize" type="range" min="14" max="20" />
                  </label>
                  <label class="grid gap-1.5">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-medium text-text-secondary">行高</span>
                      <span class="text-xs font-mono text-text-tertiary">{{ (lineHeight / 100).toFixed(2) }}</span>
                    </div>
                    <input v-model="lineHeight" type="range" min="150" max="220" />
                  </label>
                  <label class="grid gap-1.5">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-medium text-text-secondary">内容宽度</span>
                      <span class="text-xs font-mono text-text-tertiary">{{ width }}px</span>
                    </div>
                    <input v-model="width" type="range" min="360" max="600" />
                  </label>
                </div>
              </div>
            </div>

            <!-- Right: Preview -->
            <div>
              <h3 class="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                <span class="w-1 h-4 rounded-full bg-text" />
                实时预览
              </h3>
              <div
                class="border border-border rounded-xl p-6 overflow-y-auto"
                :style="{ background: bg, height: '480px' }"
              >
                <div v-html="previewHtml" />
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-2.5 shrink-0 px-5 pt-4 pb-5 border-t border-border-subtle dark:border-border">
            <button type="button" class="h-9 px-3.5 rounded-md text-[13px] font-medium bg-transparent text-text border border-border-subtle hover:border-border hover:bg-surface-hover transition-all" @click="reset">重置</button>
            <button type="button" class="h-9 px-3.5 rounded-md text-[13px] font-medium bg-[#18181b] text-white border border-[#18181b] hover:bg-[#27272a] hover:border-[#27272a] transition-all" @click="save">保存并使用</button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
