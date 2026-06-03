export default defineNuxtRouteMiddleware((to) => {
  const userStore = useUserStore()
  userStore.init()

  const localePath = useLocalePath()
  const loginPath = localePath('/login')

  const isLoginRoute = to.path === loginPath || /\/login$/.test(to.path)

  if (!userStore.isAuthenticated && !isLoginRoute) {
    return navigateTo(loginPath)
  }

  if (userStore.isAuthenticated && isLoginRoute) {
    return navigateTo(localePath('/'))
  }
})
