import { watch, onUnmounted, type Ref } from 'vue'

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

export interface FocusTrapOptions {
  active: Ref<boolean>
  onEscape?: () => void
}

export function useFocusTrap(container: Ref<HTMLElement | null>, options: FocusTrapOptions) {
  let previouslyFocused: HTMLElement | null = null

  function focusables(): HTMLElement[] {
    if (!container.value) return []
    return Array.from(container.value.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    )
  }

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.stopPropagation()
      options.onEscape?.()
      return
    }
    if (e.key !== 'Tab') return
    const items = focusables()
    if (!items.length) return
    const first = items[0]!
    const last = items[items.length - 1]!
    const active = document.activeElement as HTMLElement | null
    if (e.shiftKey && active === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }

  function activate(): void {
    if (!import.meta.client) return
    previouslyFocused = document.activeElement as HTMLElement | null
    document.addEventListener('keydown', onKeydown, true)
    requestAnimationFrame(() => {
      const items = focusables()
      ;(items[0] ?? container.value)?.focus()
    })
  }

  function deactivate(): void {
    if (!import.meta.client) return
    document.removeEventListener('keydown', onKeydown, true)
    previouslyFocused?.focus?.()
    previouslyFocused = null
  }

  watch(
    () => options.active.value,
    (active) => (active ? activate() : deactivate()),
    { immediate: true },
  )

  onUnmounted(deactivate)
}
