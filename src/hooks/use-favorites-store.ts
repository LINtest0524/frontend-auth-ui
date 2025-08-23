'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useUserStore } from './use-user-store'

interface FavoriteItem {
  id: number
  name: string
  price: number
  original_price?: number
  thumbnail?: string
  sku: string
  addedAt: string
  // 支援變體資訊
  hasVariants?: boolean
  variantImages?: string[]
}

// 全域儲存所有會員的收藏資料
interface GlobalFavoritesStore {
  userFavorites: Record<number, FavoriteItem[]> // userId -> favorites
  setUserFavorites: (userId: number, favorites: FavoriteItem[]) => void
  getUserFavorites: (userId: number) => FavoriteItem[]
}

const useGlobalFavoritesStore = create<GlobalFavoritesStore>()(
  persist(
    (set, get) => ({
      userFavorites: {},
      
      setUserFavorites: (userId, favorites) => {
        const { userFavorites } = get()
        set({ 
          userFavorites: { 
            ...userFavorites, 
            [userId]: favorites 
          } 
        })
      },
      
      getUserFavorites: (userId) => {
        const { userFavorites } = get()
        return userFavorites[userId] || []
      }
    }),
    {
      name: 'all-users-favorites-storage',
      partialize: (state) => ({ userFavorites: state.userFavorites })
    }
  )
)

// 當前會員的收藏 hook
interface FavoritesStore {
  favorites: FavoriteItem[]
  addToFavorites: (product: Omit<FavoriteItem, 'addedAt'>) => void
  removeFromFavorites: (productId: number) => void
  isFavorite: (productId: number) => boolean
  clearFavorites: () => void
  getFavoritesCount: () => number
}

export const useFavoritesStore = (): FavoritesStore => {
  const user = useUserStore((state) => state.user)
  const { userFavorites, setUserFavorites, getUserFavorites } = useGlobalFavoritesStore()
  
  const userId = user?.id || 0 // 如果沒有登入，使用 0 作為預設值
  const favorites = getUserFavorites(userId)
  
  const addToFavorites = (product: Omit<FavoriteItem, 'addedAt'>) => {
    const existingItem = favorites.find(item => item.id === product.id)
    
    if (!existingItem) {
      const newItem: FavoriteItem = {
        ...product,
        addedAt: new Date().toISOString()
      }
      const updatedFavorites = [...favorites, newItem]
      setUserFavorites(userId, updatedFavorites)
    }
  }
  
  const removeFromFavorites = (productId: number) => {
    const updatedFavorites = favorites.filter(item => item.id !== productId)
    setUserFavorites(userId, updatedFavorites)
  }
  
  const isFavorite = (productId: number) => {
    return favorites.some(item => item.id === productId)
  }
  
  const clearFavorites = () => {
    setUserFavorites(userId, [])
  }
  
  const getFavoritesCount = () => {
    return favorites.length
  }
  
  return {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    clearFavorites,
    getFavoritesCount
  }
}