import { ref, readonly } from 'vue'
import { useReducedMotion } from '~/composables/useReducedMotion'

export interface FlyingHeart {
  id: number
  x: number
  y: number
  dx: number
  rise: number
  rotate: number
  scale: number
  delay: number
  hue: number
}

const HEART_COUNT = 6
const HEART_LIFETIME_MS = 1300

const hearts = ref<FlyingHeart[]>([])
let seq = 0

export function useHearts() {
  const reduced = useReducedMotion()

  function burst(x: number, y: number, count = HEART_COUNT): void {
    if (!import.meta.client || reduced.value) return
    for (let i = 0; i < count; i++) {
      const id = ++seq
      const delay = i * 45
      hearts.value = [
        ...hearts.value,
        {
          id,
          x,
          y,
          dx: (Math.random() - 0.5) * 70,
          rise: 130 + Math.random() * 80,
          rotate: (Math.random() - 0.5) * 50,
          scale: 0.75 + Math.random() * 0.6,
          delay,
          hue: 330 + Math.random() * 30,
        },
      ]
      window.setTimeout(() => {
        hearts.value = hearts.value.filter((h) => h.id !== id)
      }, HEART_LIFETIME_MS + delay)
    }
  }

  return { hearts: readonly(hearts), burst }
}
