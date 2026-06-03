import { storeToRefs } from 'pinia'
import { useThemeStore, type ThemeName } from '~/stores/theme'

export function useTheme() {
  const store = useThemeStore()
  const { theme } = storeToRefs(store)
  return {
    theme,
    setTheme: (t: ThemeName) => store.setTheme(t),
    cycle: () => store.cycle(),
  }
}
