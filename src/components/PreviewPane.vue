<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useSettingsStore } from '@/stores/settings'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  html: string
  error?: string
  scrollRatio?: number
}>()

const themeStore = useThemeStore()
const settingsStore = useSettingsStore()
const scrollHost = ref<HTMLElement>()
const hostWidth = ref(0)
let resizeObserver: ResizeObserver | null = null
let resizeFrame: number | null = null

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
  const fitZoom = Math.max(0.1, (availableWidth - basePadding) / previewWidth.value)
  return Math.max(0.1, Math.min(desiredZoom, fitZoom))
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
    const width = entries[0]?.contentRect.width ?? 0
    if (resizeFrame !== null) cancelAnimationFrame(resizeFrame)
    // The fitted preview can change scrollbars. Defer its reactive layout write
    // beyond observer delivery to avoid ResizeObserver feedback-loop errors.
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = null
      if (hostWidth.value !== width) hostWidth.value = width
    })
  })
  if (scrollHost.value) {
    hostWidth.value = scrollHost.value.clientWidth
    resizeObserver.observe(scrollHost.value)
  }
  centerPreview()
})

onUnmounted(() => {
  if (resizeFrame !== null) cancelAnimationFrame(resizeFrame)
  resizeObserver?.disconnect()
  resizeObserver = null
})

defineExpose({ scrollHost })
</script>

<template>
  <section class="workspace-panel animate-panel-2" aria-label="预览区">
    <div class="panel-toolbar">
      <div class="panel-heading">
        <span class="panel-heading__icon"><AppIcon name="eye" :size="14" /></span>
        <strong class="panel-heading__label">输出预览</strong>
      </div>
      <div class="flex items-center gap-2">
        <!-- Device toggle -->
        <div class="preview-device-switch" aria-label="预览设备">
          <button
            type="button"
            class="preview-device-button"
            :class="{ 'preview-device-button--active': previewDevice === 'mobile' }"
            title="移动端预览 (375px)"
            :aria-pressed="previewDevice === 'mobile'"
            @click="setPreviewDevice('mobile')"
          >
            <AppIcon name="smartphone" :size="12" />
            <span>手机</span>
          </button>
          <button
            type="button"
            class="preview-device-button"
            :class="{ 'preview-device-button--active': previewDevice === 'desktop' }"
            title="网页端预览"
            :aria-pressed="previewDevice === 'desktop'"
            @click="setPreviewDevice('desktop')"
          >
            <AppIcon name="monitor" :size="12" />
            <span>网页</span>
          </button>
        </div>
      </div>
    </div>
    <div ref="scrollHost" class="preview-scroll">
      <p
        v-if="error"
        role="alert"
        class="m-5 self-start rounded-md border border-border bg-surface p-4 text-sm leading-relaxed text-danger"
      >
        {{ error }}
      </p>
      <div v-else class="preview-canvas" :style="previewCanvasStyle">
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
  margin: 0 12px 12px;
  border-radius: 14px;
  box-shadow: var(--shadow-inset);
}

.preview-canvas {
  width: max-content;
  min-width: max(100%, var(--preview-canvas-min, 100%));
  min-height: 100%;
  padding: 22px var(--preview-canvas-x-padding, 24px) 22px;
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
  border-radius: 3px;
  box-shadow: var(--shadow-canvas);
  transition:
    width 0.2s ease,
    box-shadow 0.2s ease;
}
.preview-device-switch {
  display: flex;
  gap: 2px;
  padding: 3px;
  border-radius: 11px;
  background: var(--color-bg);
}

.preview-device-button {
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0 9px;
  border-radius: 8px;
  color: var(--color-text-tertiary);
  font-size: 11px;
  font-weight: 500;
  transition:
    color 160ms ease,
    background 160ms ease,
    box-shadow 160ms ease;
}

.preview-device-button:hover {
  color: var(--color-text);
}

.preview-device-button--active {
  color: var(--color-text);
  background: var(--color-surface-pressed);
  box-shadow: var(--shadow-inset-soft);
  font-weight: 600;
}

@media (max-width: 639px) {
  .preview-scroll {
    margin: 0 10px 10px;
  }
  .preview-device-button {
    min-height: 34px;
  }
}
</style>
