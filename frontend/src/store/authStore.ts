import { create } from 'zustand'
import { api, ContributorOut } from '../api/client'

interface AuthState {
  apiKey: string | null
  contributor: ContributorOut | null
  login: (key: string) => Promise<void>
  loginWithPassword: (identifier: string, password: string) => Promise<void>
  logout: () => void
  refreshMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  apiKey: localStorage.getItem('l2sc_api_key'),
  contributor: null,

  login: async (key: string) => {
    localStorage.setItem('l2sc_api_key', key)
    set({ apiKey: key })
    const me = await api.getMe()
    set({ contributor: me })
  },

  loginWithPassword: async (identifier: string, password: string) => {
    const res = await api.login({ identifier, password })
    localStorage.setItem('l2sc_api_key', res.api_key)
    set({ apiKey: res.api_key, contributor: res.contributor })
  },

  logout: () => {
    localStorage.removeItem('l2sc_api_key')
    set({ apiKey: null, contributor: null })
  },

  refreshMe: async () => {
    try {
      const me = await api.getMe()
      set({ contributor: me })
    } catch {
      localStorage.removeItem('l2sc_api_key')
      set({ apiKey: null, contributor: null })
    }
  },
}))
