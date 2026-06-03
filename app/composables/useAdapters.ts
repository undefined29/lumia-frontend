import { useUserStore } from '~/stores/user'
import type { AdapterContext } from '~/utils/adapters'
import {
  toAnimeView,
  toSeasonView,
  toEpisodeView,
  toCharacterView,
  toImageView,
  toUserView,
} from '~/utils/adapters'

export function useAdapters() {
  const config = useRuntimeConfig()
  const userStore = useUserStore()
  const { locale } = useI18n()

  const ctx = (): AdapterContext => ({
    baseCdnUrl: config.public.baseCdnUrl as string,
    useThumb: true,
    currentUserId: userStore.currentUser?.id ?? null,
    locale: locale.value,
  })

  return {
    toAnimeView: (...[series]: Parameters<typeof toAnimeView>) => toAnimeView(series, ctx()),
    toSeasonView,
    toEpisodeView,
    toCharacterView: (...[char, tag]: Parameters<typeof toCharacterView>) =>
      toCharacterView(char, tag ?? null, ctx()),
    toImageView: (...[img]: Parameters<typeof toImageView>) => toImageView(img, ctx()),
    toUserView: (...[user]: Parameters<typeof toUserView>) => toUserView(user, ctx()),
  }
}
