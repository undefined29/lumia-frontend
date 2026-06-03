import { defineStore } from 'pinia'
import type { UserResponseDto } from '~/types'

const TOKEN_KEY = 'lumia_token'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: null as string | null,
    currentUser: null as UserResponseDto | null,
    initialized: false,
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.token,
  },

  actions: {
    init() {
      if (this.initialized || !import.meta.client) return
      this.token = localStorage.getItem(TOKEN_KEY)
      this.initialized = true
    },

    setToken(token: string | null) {
      this.token = token
      if (import.meta.client) {
        if (token) localStorage.setItem(TOKEN_KEY, token)
        else localStorage.removeItem(TOKEN_KEY)
      }
    },

    setCurrentUser(user: UserResponseDto | null) {
      this.currentUser = user
    },

    clear() {
      this.setToken(null)
      this.currentUser = null
    },
  },
})
