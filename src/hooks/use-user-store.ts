import { create } from 'zustand'

type User = {
  userId: number
  username: string
  role: string
  companyId: number | null
}

type Store = {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
}

export const useUserStore = create<Store>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}))
