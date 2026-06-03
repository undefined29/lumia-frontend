import { computed } from 'vue'
import { useLocaleStore, LOCALES, type LocaleCode } from '~/stores/locale'

export function useAppLocale() {
  const { locale, locales, setLocale } = useI18n()
  const switchLocalePath = useSwitchLocalePath()
  const router = useRouter()
  const store = useLocaleStore()

  const current = computed<LocaleCode>(() => locale.value as LocaleCode)

  async function change(code: LocaleCode): Promise<void> {
    store.setCurrent(code)
    await setLocale(code)
    const path = switchLocalePath(code)
    if (path) await router.push(path)
  }

  return {
    current,
    available: LOCALES,
    locales,
    change,
  }
}
