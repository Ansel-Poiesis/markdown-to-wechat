import { ref, onMounted, onUnmounted } from 'vue'

export function useBreakpoint() {
  const isMobile = ref(false)
  const isTablet = ref(false)

  function update() {
    const w = window.innerWidth
    isMobile.value = w < 768
    isTablet.value = w >= 768 && w < 1024
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
