import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '~/stores/user'

export type AuthMethod = 'passkey' | 'discord'

interface BetterAuthSignIn {
  token?: string
  user?: { id: string; name?: string; email?: string }
}

export function useAuth() {
  const userStore = useUserStore()
  const { api } = useApi()
  const config = useRuntimeConfig()
  const { currentUser, token } = storeToRefs(userStore)

  const authBaseUrl = config.public.authBaseUrl as string

  async function loadMe(): Promise<void> {
    const me = await api.me()
    userStore.setCurrentUser(me)
  }

  async function authPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${authBaseUrl}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = (await res.json().catch(() => null)) as (T & BetterAuthSignIn) | null
    if (!res.ok) {
      const message =
        (data as { message?: string } | null)?.message ?? `Sign-in failed (${res.status})`
      throw new Error(message)
    }
    const headerToken = res.headers.get('set-auth-token')
    const bodyToken = (data as BetterAuthSignIn | null)?.token
    const t = headerToken || bodyToken
    if (t) userStore.setToken(t)
    return data as T
  }

  async function signInWithDiscord(): Promise<void> {
    const callbackURL = `${window.location.origin}/`
    const res = await authPost<{ url?: string; redirect?: boolean }>('/sign-in/social', {
      provider: 'discord',
      callbackURL,
    })
    if (res.url) window.location.href = res.url
    else throw new Error('Discord sign-in did not return a redirect URL')
  }

  async function bootstrapSession(): Promise<boolean> {
    if (!import.meta.client) return false

    const url = new URL(window.location.href)
    const urlToken = url.searchParams.get('token')
    if (urlToken) {
      userStore.setToken(urlToken)
      url.searchParams.delete('token')
      window.history.replaceState({}, '', url.toString())
      return true
    }

    try {
      const res = await fetch(`${authBaseUrl}/get-session`, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) return false
      const data = (await res.json().catch(() => null)) as {
        session?: { token?: string }
      } | null
      const bodyToken = data?.session?.token
      const headerToken = res.headers.get('set-auth-token')
      const t = bodyToken || headerToken
      if (!t) return false
      userStore.setToken(t)
      return true
    } catch {
      return false
    }
  }

  async function signInWithPasskey(): Promise<void> {
    throw new Error('Passkey sign-in is not available yet')
  }

  async function logout(): Promise<void> {
    try {
      await fetch(`${authBaseUrl}/sign-out`, {
        method: 'POST',
        credentials: 'include',
        headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
      })
    } catch {}
    userStore.clear()
  }

  return {
    isAuthenticated: computed(() => userStore.isAuthenticated),
    currentUser,
    token,
    signInWithPasskey,
    signInWithDiscord,
    bootstrapSession,
    loadMe,
    logout,
  }
}
