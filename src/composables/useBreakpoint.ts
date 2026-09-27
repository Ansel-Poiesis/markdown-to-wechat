import { onMounted, onUnmounted, ref } from 'vue'

export function useBreakpoint() {
  // Three columns need 1,108px plus gutters; narrower windows use the tabbed workspace.
  const isMobile = ref(typeof window !== 'undefined' && window.innerWidth < 1180)
  const isTablet = ref(
    typeof window !== 'undefined' && window.innerWidth >= 640 && window.innerWidth < 1180,
  )

  function update() {
    const w = window.innerWidth
    isMobile.value = w < 1180
    isTablet.value = w >= 640 && w < 1180
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
