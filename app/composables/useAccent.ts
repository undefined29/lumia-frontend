import { storeToRefs } from 'pinia'
import { useAccentStore, ACCENT_PRESETS, DEFAULT_ACCENT } from '~/stores/accent'

export function useAccent() {
  const store = useAccentStore()
  const { color, isCustom } = storeToRefs(store)
  return {
    color,
    isCustom,
    presets: ACCENT_PRESETS,
    defaultAccent: DEFAULT_ACCENT,
    setAccent: (c: string) => store.setAccent(c),
    reset: () => store.reset(),
  }
}
