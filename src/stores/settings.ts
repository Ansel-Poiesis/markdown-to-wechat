import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

const PREVIEW_ZOOM_KEY = 'wechat-md-preview-zoom'
const WECHAT_ELEMENTS_KEY = 'wechat-md-wechat-elements'

export const useSettingsStore = defineStore('settings', () => {
  const previewZoom = useStorage(PREVIEW_ZOOM_KEY, '1')
  const wechatElements = useStorage<{
    followEnabled: boolean
    followName: string
    followSlogan: string
  }>(WECHAT_ELEMENTS_KEY, {
    followEnabled: false,
    followName: '',
    followSlogan: '',
  })

  const previewZoomComputed = computed({
    get: () => previewZoom.value,
    set: (v) => { previewZoom.value = v },
  })

  const updateWechatElements = (patch: Partial<typeof wechatElements.value>) => {
    wechatElements.value = { ...wechatElements.value, ...patch }
  }

  return {
    previewZoom: previewZoomComputed,
    wechatElements: computed(() => wechatElements.value),
    updateWechatElements,
  }
})
