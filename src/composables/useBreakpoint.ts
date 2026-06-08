import { onMounted, onUnmounted, ref } from 'vue'

export function useBreakpoint() {
  const isMobile = ref(false)
  const isTablet = ref(false)

  function update() {
    const w = window.innerWidth
    isMobile.value = w < 640
    isTablet.value = w >= 640 && w < 1024
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', update)
  })

  return { isMobile, isTablet }
}
