import { defineStore } from 'pinia'

export type ThemeName = 'dark' | 'light' | 'oled'

export const THEME_ORDER: readonly ThemeName[] = ['dark', 'light', 'oled'] as const

const STORAGE_KEY = 'lumia_theme'

function systemDefault(): ThemeName {
  if (!import.meta.client) return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: 'dark' as ThemeName,
    initialized: false,
  }),

  actions: {
    init() {
      if (this.initialized || !import.meta.client) return
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeName | null
      this.theme = stored && THEME_ORDER.includes(stored) ? stored : systemDefault()
      this.apply()
      this.initialized = true
    },

    apply() {
      if (import.meta.client) {
        document.documentElement.setAttribute('data-theme', this.theme)
      }
    },

    setTheme(theme: ThemeName) {
      this.theme = theme
      if (import.meta.client) localStorage.setItem(STORAGE_KEY, theme)
      this.apply()
    },

    cycle() {
      const idx = THEME_ORDER.indexOf(this.theme)
      this.setTheme(THEME_ORDER[(idx + 1) % THEME_ORDER.length]!)
    },
  },
})
