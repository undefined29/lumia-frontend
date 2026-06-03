import { isAdministrator } from '~/utils/bitmask'

export default defineNuxtRouteMiddleware(async () => {
  const userStore = useUserStore()
  const localePath = useLocalePath()

  if (!userStore.currentUser && userStore.token) {
    try {
      const me = await useApi().api.me()
      userStore.setCurrentUser(me)
    } catch {}
  }

  if (!isAdministrator(userStore.currentUser?.permissions ?? 0)) {
    return navigateTo(localePath('/settings/tags'))
  }
})
