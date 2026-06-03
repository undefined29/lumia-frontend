import { ErrorCode } from '~/types/api'

export default defineNuxtPlugin(async () => {
  const themeStore = useThemeStore()
  themeStore.init()

  const accentStore = useAccentStore()
  accentStore.init()

  const userStore = useUserStore()
  userStore.init()

  if (!userStore.token) {
    const { bootstrapSession } = useAuth()
    await bootstrapSession()
  }

  if (userStore.token && !userStore.currentUser) {
    try {
      const { api } = useApi()
      userStore.setCurrentUser(await api.me())
    } catch (error) {
      const status = (error as { status?: number }).status
      const code = (error as { code?: number }).code
      if (
        status === 401 ||
        code === ErrorCode.UserNotFound ||
        code === ErrorCode.NotEnoughPermissions
      ) {
        userStore.clear()
      }
    }
  }
})
