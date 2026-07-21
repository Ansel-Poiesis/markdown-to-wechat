<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
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
const hostWidth = ref(0)
let resizeObserver: ResizeObserver | null = null

// Desktop / Mobile preview toggle
const previewDevice = ref<'desktop' | 'mobile'>('mobile')

const WECHAT_DESKTOP_ARTICLE_WIDTH = 677
const WECHAT_MOBILE_ARTICLE_WIDTH = 375

const previewWidth = computed(() =>
  previewDevice.value === 'mobile' ? WECHAT_MOBILE_ARTICLE_WIDTH : WECHAT_DESKTOP_ARTICLE_WIDTH,
)

const previewZoom = computed(() => Number(settingsStore.previewZoom) || 1)
const effectiveZoom = computed(() => {
  const desiredZoom = previewZoom.value
  const availableWidth = hostWidth.value
  if (!availableWidth) return desiredZoom
  const basePadding = previewDevice.value === 'desktop' ? 0 : 48
  const availableForBase = Math.max(0, availableWidth - basePadding)
  const fitZoom = Math.min(1, availableForBase / previewWidth.value)
  return Math.max(0.45, fitZoom * desiredZoom)
})
const previewSidePadding = computed(() => {
  if (previewDevice.value === 'desktop') return 0
  const availableWidth = hostWidth.value
  const scaledWidth = previewWidth.value * effectiveZoom.value
  if (!availableWidth) return 24
  return Math.max(0, Math.min(24, (availableWidth - scaledWidth) / 2))
})

const previewCanvasStyle = computed(() => ({
  '--preview-canvas-min': `${Math.round(
    previewWidth.value * effectiveZoom.value + previewSidePadding.value * 2,
  )}px`,
  '--preview-canvas-x-padding': `${previewSidePadding.value}px`,
}))

const previewStyle = computed(() => ({
  width: `${previewWidth.value}px`,
  maxWidth: `${previewWidth.value}px`,
  zoom: String(effectiveZoom.value),
}))

const contentStyle = computed(() => ({
  width: '100%',
}))

function centerPreview() {
  void nextTick(() => {
    const el = scrollHost.value
    if (!el) return
    const maxLeft = el.scrollWidth - el.clientWidth
    el.scrollLeft = maxLeft > 0 ? maxLeft / 2 : 0
  })
}

function setPreviewDevice(device: 'desktop' | 'mobile') {
  previewDevice.value = device
  settingsStore.previewZoom = device === 'mobile' ? '1.25' : '1'
  centerPreview()
}

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

watch(
  [previewDevice, () => settingsStore.previewZoom, () => props.html, effectiveZoom],
  centerPreview,
  {
    flush: 'post',
  },
)

onMounted(() => {
  resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0]
    hostWidth.value = entry?.contentRect.width ?? 0
  })
  if (scrollHost.value) {
    hostWidth.value = scrollHost.value.clientWidth
    resizeObserver.observe(scrollHost.value)
  }
  centerPreview()
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

defineExpose({ scrollHost })
</script>

<template>
  <section
    class="animate-panel-2 flex flex-col min-h-0 rounded-lg bg-surface shadow-sm overflow-hidden border border-border"
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
              previewDevice === 'mobile'
                ? 'bg-surface text-text shadow-sm font-semibold'
                : 'text-text-tertiary hover:text-text'
            "
            title="移动端预览 (375px)"
            @click="setPreviewDevice('mobile')"
          >
            <AppIcon name="smartphone" :size="12" />
            <span>手机</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-1 h-6 px-2 rounded-md text-[10px] font-medium transition-all active:scale-95"
            :class="
              previewDevice === 'desktop'
                ? 'bg-surface text-text shadow-sm font-semibold'
                : 'text-text-tertiary hover:text-text'
            "
            title="网页端预览"
            @click="setPreviewDevice('desktop')"
          >
            <AppIcon name="monitor" :size="12" />
            <span>网页</span>
          </button>
        </div>
      </div>
    </div>
    <div ref="scrollHost" class="preview-scroll">
      <div class="preview-canvas" :style="previewCanvasStyle">
        <article
          class="preview-page"
          :style="{ ...previewStyle, background: themeStore.themeBase.canvas || '#ffffff' }"
        >
          <div :style="contentStyle" v-html="html" />
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.preview-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: var(--color-workspace);
  display: grid;
}

.preview-canvas {
  width: max-content;
  min-width: max(100%, var(--preview-canvas-min, 100%));
  min-height: 100%;
  padding: 32px var(--preview-canvas-x-padding, 24px) 8px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  box-sizing: border-box;
}

.preview-page {
  min-height: calc(100dvh - 170px);
  flex: 0 0 auto;
  overflow: hidden;
  overflow-wrap: break-word;
  border-radius: 2px;
  box-shadow: var(--shadow-canvas);
  transition:
    width 0.2s ease,
    box-shadow 0.2s ease;
}

</style>
