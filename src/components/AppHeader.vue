<script setup lang="ts">
import { computed } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useClipboard } from '@/composables/useClipboard'
import AppIcon from '@/components/ui/AppIcon.vue'
import type { WarningItem, MarkdownStats } from '@/types'

const props = defineProps<{
  renderedHtml: string
  warnings: WarningItem[]
  stats: MarkdownStats
}>()

const emit = defineEmits<{ exportHtml: [] }>()

const ui = useUiStore()
const { copyRenderedHtml } = useClipboard()

const hasBlockingWarnings = computed(() => props.warnings.some((w) => w.level === 'danger'))
const hasWarnings = computed(() => props.warnings.length > 0)

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
    class="flex items-center justify-between gap-2 sm:gap-4 h-16 w-full max-w-[100vw] overflow-hidden px-3 sm:px-5 sticky top-0 z-50 backdrop-blur-xl bg-white/85 border-b border-border-subtle shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
  >
    <div class="min-w-0">
      <h1 class="text-base sm:text-lg font-semibold tracking-tight leading-tight truncate">
        公众号排版渲染
      </h1>
    </div>
    <!-- Stats -->
    <div
      class="hidden md:flex items-center gap-1 text-[11px] text-text-tertiary bg-bg/60 border border-border-subtle rounded-xl px-3.5 py-2"
    >
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

    <div class="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
      <button
        type="button"
        class="h-9 w-9 sm:w-auto sm:px-3 rounded-xl text-[13px] font-medium bg-surface text-text border border-border hover:bg-surface-hover active:scale-[0.96] transition-all inline-flex items-center justify-center gap-1.5"
        title="打开聊天助手"
        @click="ui.toggleChat()"
      >
        <AppIcon name="sparkles" :size="14" />
        <span class="hidden sm:inline">聊天</span>
      </button>
      <button
        type="button"
        class="h-9 w-9 sm:w-auto sm:px-3 rounded-xl text-[13px] font-medium bg-surface text-text border border-border hover:bg-surface-hover active:scale-[0.96] transition-all inline-flex items-center justify-center gap-1.5"
        title="导出 HTML"
        @click="handleExport"
      >
        <AppIcon name="download" :size="14" />
        <span class="hidden sm:inline">导出</span>
      </button>
      <button
        type="button"
        class="h-9 w-10 sm:w-auto sm:px-4 rounded-xl text-[13px] font-semibold bg-[#18181b] !text-white border border-[#18181b] hover:bg-[#27272a] hover:border-[#27272a] active:scale-[0.96] transition-all inline-flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
        style="color: #ffffff"
        title="复制到公众号"
        @click="handleCopy"
      >
        <AppIcon name="copy" :size="14" />
        <span class="hidden sm:inline">复制到公众号</span>
      </button>
    </div>
  </header>
</template>
