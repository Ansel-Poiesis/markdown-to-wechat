<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useSettingsStore } from '@/stores/settings'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  html: string
  scrollRatio?: number
}>()

const themeStore = useThemeStore()
const settingsStore = useSettingsStore()
const scrollHost = ref<HTMLElement>()

// Desktop / Mobile preview toggle
const previewDevice = ref<'desktop' | 'mobile'>('desktop')

const WECHAT_DESKTOP_ARTICLE_WIDTH = 677
const WECHAT_MOBILE_ARTICLE_WIDTH = 375

const previewStyle = computed(() => ({
  transform: `scale(${settingsStore.previewZoom})`,
  width:
    previewDevice.value === 'mobile'
      ? `${WECHAT_MOBILE_ARTICLE_WIDTH}px`
      : `${WECHAT_DESKTOP_ARTICLE_WIDTH}px`,
  maxWidth:
    previewDevice.value === 'mobile'
      ? `${WECHAT_MOBILE_ARTICLE_WIDTH}px`
      : `${WECHAT_DESKTOP_ARTICLE_WIDTH}px`,
}))

const contentStyle = computed(() => ({
  width: '100%',
}))

// Accept scroll ratio from parent (0-1)
watch(
  () => props.scrollRatio,
  (ratio) => {
    if (ratio === undefined || !scrollHost.value) return
    const el = scrollHost.value
    const maxScroll = el.scrollHeight - el.clientHeight
    if (maxScroll <= 0) return
    el.scrollTop = ratio * maxScroll
  },
)

defineExpose({ scrollHost })
</script>

<template>
  <section
    class="animate-panel-2 flex flex-col min-h-0 rounded-2xl bg-surface shadow-sm overflow-hidden border border-border-subtle dark:border dark:border-border"
    aria-label="预览区"
  >
    <div
      class="flex items-center justify-between gap-3 h-11 px-4 shrink-0 text-[11px] font-semibold tracking-widest uppercase text-text-tertiary border-b border-border-subtle dark:border-border"
    >
      <strong class="text-text-secondary font-semibold">预览</strong>
      <div class="flex items-center gap-2">
        <!-- Device toggle -->
        <div class="flex gap-0.5 bg-bg rounded-lg p-0.5">
          <button
            type="button"
            class="flex items-center gap-1 h-6 px-2 rounded-md text-[10px] font-medium transition-all active:scale-95"
            :class="
              previewDevice === 'desktop'
                ? 'bg-surface text-text shadow-sm font-semibold'
                : 'text-text-tertiary hover:text-text'
            "
            title="网页端预览"
            @click="previewDevice = 'desktop'"
          >
            <AppIcon name="monitor" :size="12" />
            <span>网页</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-1 h-6 px-2 rounded-md text-[10px] font-medium transition-all active:scale-95"
            :class="
              previewDevice === 'mobile'
                ? 'bg-surface text-text shadow-sm font-semibold'
                : 'text-text-tertiary hover:text-text'
            "
            title="移动端预览 (375px)"
            @click="previewDevice = 'mobile'"
          >
            <AppIcon name="smartphone" :size="12" />
            <span>手机</span>
          </button>
        </div>
      </div>
    </div>
    <div ref="scrollHost" class="flex-1 min-h-0 overflow-auto bg-[#ececec] dark:bg-[#2a2a2a]">
      <article
        class="min-h-full mx-auto py-8 pb-10 break-words origin-top transition-all duration-300"
        :style="{ ...previewStyle, background: themeStore.themeBase.canvas || '#ffffff' }"
      >
        <div :style="contentStyle" v-html="html" />
      </article>
    </div>
  </section>
</template>
