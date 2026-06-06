<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useUiStore } from '@/stores/ui'
import { useClipboard } from '@/composables/useClipboard'
import { codeThemes } from '@/config/themes'
import AppIcon from '@/components/ui/AppIcon.vue'
import type { WarningItem, MarkdownStats } from '@/types'

const props = defineProps<{
  renderedHtml: string
  warnings: WarningItem[]
  stats: MarkdownStats
}>()

const emit = defineEmits<{ 'exportHtml': [] }>()

const themeStore = useThemeStore()
const ui = useUiStore()
const { copyRenderedHtml } = useClipboard()

const hasBlockingWarnings = computed(() => props.warnings.some(w => w.level === 'danger'))
const hasWarnings = computed(() => props.warnings.length > 0)

const themeList = computed(() => Object.entries(themeStore.allThemes))
const codeThemeList = computed(() => Object.entries(codeThemes))

function selectTheme(key: string) {
  themeStore.currentThemeKey = key
}

function selectCodeTheme(key: string) {
  themeStore.currentCodeThemeKey = key
}

async function handleCopy() {
  if (hasBlockingWarnings.value) {
    ui.openModal('preflight')
    return
  }
  if (hasWarnings.value) {
    await copyRenderedHtml(props.renderedHtml)
    ui.showToast('已复制（存在提醒项，可在创作助手查看）', 'error')
    return
  }
  await copyRenderedHtml(props.renderedHtml)
}

function handleExport() {
  emit('exportHtml')
}
</script>

<template>
  <header
    class="flex items-center justify-between gap-4 h-16 px-5 sticky top-0 z-50 backdrop-blur-xl bg-white/85 border-b border-border-subtle shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
  >
    <div>
      <p class="text-[11px] font-semibold tracking-widest uppercase text-text-tertiary mb-0.5">
        Markdown to WeChat
      </p>
      <h1 class="text-lg font-semibold tracking-tight leading-tight">
        微信公众号排版渲染工具
      </h1>
    </div>
    <!-- Stats -->
    <div class="hidden md:flex items-center gap-1 text-[11px] text-text-tertiary bg-bg/60 border border-border-subtle rounded-xl px-3.5 py-2">
      <span class="flex items-center gap-1.5 tabular-nums">
        <strong class="text-text font-bold text-sm">{{ stats.wordCount }}</strong>
        <span>字</span>
      </span>
      <span class="w-px h-3 bg-border mx-2" />
      <span class="flex items-center gap-1.5 tabular-nums">
        <strong class="text-text font-bold text-sm">{{ stats.readingMinutes }}</strong>
        <span>分钟</span>
      </span>
      <span class="w-px h-3 bg-border mx-2" />
      <span class="flex items-center gap-1.5 tabular-nums">
        <strong class="text-text font-bold text-sm">{{ stats.headings }}</strong>
        <span>标题</span>
      </span>
      <span class="w-px h-3 bg-border mx-2" />
      <span class="flex items-center gap-1.5 tabular-nums">
        <strong class="text-text font-bold text-sm">{{ stats.images }}</strong>
        <span>图片</span>
      </span>
    </div>

    <div class="flex items-center gap-2.5">
      <div class="flex items-center gap-1.5">
        <span class="text-[10px] text-text-tertiary font-medium tracking-wider">主题</span>
        <div class="flex items-center gap-0.5 bg-bg/60 border border-border-subtle rounded-xl p-1">
          <button
            v-for="[key, theme] in themeList"
            :key="key"
            type="button"
            :title="theme.name"
            class="w-7 h-7 rounded-lg border-2 transition-all active:scale-90 relative overflow-hidden"
            :class="themeStore.currentThemeKey === key
              ? 'border-white shadow-md scale-110'
              : 'border-white/40 hover:border-white hover:scale-105 shadow-sm'
            "
            :style="{ background: theme.base.accent }"
            @click="selectTheme(key)"
          >
            <span
              v-if="themeStore.currentThemeKey === key"
              class="absolute inset-0 flex items-center justify-center bg-black/20"
            >
              <AppIcon name="check" :size="12" class="text-white" />
            </span>
          </button>
        </div>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-[10px] text-text-tertiary font-medium tracking-wider">代码</span>
        <div class="flex items-center gap-0.5 bg-bg/60 border border-border-subtle rounded-xl p-1">
          <button
            v-for="[key, theme] in codeThemeList"
            :key="key"
            type="button"
            :title="theme.name"
            class="w-7 h-7 rounded-lg border-2 transition-all active:scale-90 relative overflow-hidden"
            :class="themeStore.currentCodeThemeKey === key
              ? 'border-white shadow-md scale-110'
              : 'border-white/40 hover:border-white hover:scale-105 shadow-sm'
            "
            :style="{ background: theme.background }"
            @click="selectCodeTheme(key)"
          >
            <span
              v-if="themeStore.currentCodeThemeKey === key"
              class="absolute inset-0 flex items-center justify-center"
              :style="{ background: theme.keyword, opacity: '0.18' }"
            />
            <span
              v-if="themeStore.currentCodeThemeKey === key"
              class="absolute inset-0 flex items-center justify-center"
            >
              <AppIcon name="check" :size="12" :style="{ color: theme.color }" />
            </span>
          </button>
        </div>
      </div>
      <button
        type="button"
        class="w-9 h-9 flex items-center justify-center rounded-xl text-text-tertiary hover:text-text hover:bg-surface-hover border border-border-subtle hover:border-border bg-transparent transition-all relative active:scale-95"
        :class="{ 'text-accent bg-accent/10 border-accent/30': ui.showSettings }"
        @click="ui.toggleSettings"
      >
        <AppIcon name="settings" :size="16" />
        <span
          v-if="hasWarnings"
          class="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center shadow-sm"
        >
          {{ warnings.length }}
        </span>
      </button>
      <button
        type="button"
        class="h-9 px-3 rounded-xl text-[13px] font-medium bg-surface text-text border border-border hover:bg-surface-hover active:scale-[0.96] transition-all inline-flex items-center gap-1.5"
        @click="handleExport"
      >
        <AppIcon name="download" :size="14" />
        导出
      </button>
      <button
        type="button"
        class="h-9 px-4 rounded-xl text-[13px] font-semibold bg-[#18181b] !text-white border border-[#18181b] hover:bg-[#27272a] hover:border-[#27272a] active:scale-[0.96] transition-all inline-flex items-center gap-2 shadow-sm hover:shadow-md"
        style="color: #ffffff;"
        @click="handleCopy"
      >
        <AppIcon name="copy" :size="14" />
        复制到公众号
      </button>
    </div>
  </header>
</template>
