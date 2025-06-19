import { create } from 'zustand'

export type User = {
  userId: number
  username: string
  role: string
  companyId: number | null
  enabledModules?: string[]
}

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
    // 可以做額外清除動作（如果未來需要）
    set({ user: null })
  }
}))
