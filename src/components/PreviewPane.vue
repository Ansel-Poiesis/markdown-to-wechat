<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps<{
  html: string
  scrollRatio?: number
}>()

const themeStore = useThemeStore()
const settingsStore = useSettingsStore()
const scrollHost = ref<HTMLElement>()

const previewStyle = computed(() => ({
  transform: `scale(${settingsStore.previewZoom})`,
  maxWidth: `${themeStore.themeBase.width || 420}px`,
}))

// Accept scroll ratio from parent (0-1)
watch(() => props.scrollRatio, (ratio) => {
  if (ratio === undefined || !scrollHost.value) return
  const el = scrollHost.value
  const maxScroll = el.scrollHeight - el.clientHeight
  if (maxScroll <= 0) return
  el.scrollTop = ratio * maxScroll
})

defineExpose({ scrollHost })
</script>

<template>
  <section
    class="animate-panel-2 flex flex-col min-h-0 rounded-2xl bg-surface shadow-sm overflow-hidden border border-border-subtle dark:border dark:border-border"
    aria-label="微信公众号预览区"
  >
    <div class="flex items-center justify-between gap-3 h-11 px-4 shrink-0 text-[11px] font-semibold tracking-widest uppercase text-text-tertiary border-b border-border-subtle dark:border-border">
      <strong class="text-text-secondary font-semibold">微信预览</strong>
      <span class="text-[10px] text-text-tertiary hidden sm:inline">复制时会包含内联样式</span>
    </div>
    <div ref="scrollHost" class="flex-1 min-h-0 overflow-auto flex items-start justify-center">
      <article
        class="w-full min-h-full p-8 pb-10 break-words origin-top"
        :style="previewStyle"
        v-html="html"
      />
    </div>
  </section>
</template>
