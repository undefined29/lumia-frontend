import { defineStore } from 'pinia'

export type LocaleCode = 'en' | 'ru' | 'de'

export const LOCALES: ReadonlyArray<{ code: LocaleCode; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'de', label: 'Deutsch' },
] as const

export const useLocaleStore = defineStore('locale', {
  state: () => ({
    current: 'en' as LocaleCode,
  }),

  actions: {
    setCurrent(code: LocaleCode) {
      this.current = code
    },
  },
})
