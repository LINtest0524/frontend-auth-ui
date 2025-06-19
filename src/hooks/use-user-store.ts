import { create } from 'zustand'
import { User } from '@/types/user'

type Store = {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
}

export const useUserStore = create<Store>((set) => ({
  user: null,

  setUser: (user) => {
    set({ user })
  },

  logout: () => {
    // 可擴充清除行為（如 localStorage）
    set({ user: null })
  }
}))
