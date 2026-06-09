import { defineStore } from 'pinia'

const STORAGE_KEY = 'yuexing_auth'

function safeJsonParse(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function nowIso() {
  return new Date().toISOString()
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    hydrated: false,
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token && state.user),
  },
  actions: {
    hydrate() {
      if (this.hydrated) return
      const raw = localStorage.getItem(STORAGE_KEY)
      const parsed = raw ? safeJsonParse(raw) : null
      if (parsed?.token && parsed?.user) {
        this.user = parsed.user
        this.token = parsed.token
      }
      this.hydrated = true
    },
    login({ username }) {
      this.user = { username, loginAt: nowIso() }
      this.token = `demo_${Math.random().toString(16).slice(2)}`
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: this.user, token: this.token }))
    },
    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem(STORAGE_KEY)
    },
  },
})

