import { ref, computed, onMounted, onUnmounted } from 'vue'

export const BREAKPOINTS = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const

export function useBreakpoint() {
  const width = ref(import.meta.client ? window.innerWidth : 1280)

  function onResize(): void {
    width.value = window.innerWidth
  }

  onMounted(() => {
    width.value = window.innerWidth
    window.addEventListener('resize', onResize, { passive: true })
  })
  onUnmounted(() => {
    if (import.meta.client) window.removeEventListener('resize', onResize)
  })

  return {
    width,
    isMobile: computed(() => width.value < BREAKPOINTS.md),
    isTablet: computed(() => width.value >= BREAKPOINTS.md && width.value < BREAKPOINTS.lg),
    isDesktop: computed(() => width.value >= BREAKPOINTS.lg),
    smaller: (bp: keyof typeof BREAKPOINTS) => computed(() => width.value < BREAKPOINTS[bp]),
    greater: (bp: keyof typeof BREAKPOINTS) => computed(() => width.value >= BREAKPOINTS[bp]),
  }
}
