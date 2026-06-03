import { ref, readonly, onUnmounted, type Ref } from 'vue'

const reduced = ref(false)
let initialized = false
let media: MediaQueryList | null = null

function handleChange(e: MediaQueryListEvent | MediaQueryList): void {
  reduced.value = e.matches
}

export function useReducedMotion(): Readonly<Ref<boolean>> {
  if (import.meta.client && !initialized) {
    media = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduced.value = media.matches
    media.addEventListener('change', handleChange)
    initialized = true
  }

  onUnmounted(() => {})

  return readonly(reduced)
}

export function useMotionSafeTransition(name: string): Ref<string | false> {
  const reducedRef = useReducedMotion()
  return computed(() => (reducedRef.value ? false : name))
}
