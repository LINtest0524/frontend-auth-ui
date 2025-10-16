'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useUserStore } from './use-user-store'
import { useEffect } from 'react'
import { useFavoritesMigration } from './use-favorites-migration'

interface FavoriteItem {
  id: number
  name: string
  price?: number
  original_price?: number
  thumbnail?: string
  sku: string
  addedAt: string
  hasVariants?: boolean
  variantImages?: string[]
  itemType: string
  itemId: number
}

interface FavoriteResponse {
  success: boolean
  message: string
  synced?: number
}

interface FavoriteStats {
  total: number
  byType: Record<string, number>
  recentCount: number
}

// 全域儲存（用於離線模式和快取）
interface GlobalFavoritesStore {
  userFavorites: Record<number, FavoriteItem[]>
  syncQueue: Record<number, {
    toAdd: { itemType: string; itemId: number; addedAt: string }[]
    toRemove: { itemType: string; itemId: number }[]
  }>
  lastSyncTime: Record<number, string>
  isOnline: boolean
  
  setUserFavorites: (userId: number, favorites: FavoriteItem[]) => void
  getUserFavorites: (userId: number) => FavoriteItem[]
  addToSyncQueue: (userId: number, action: 'add' | 'remove', item: any) => void
  clearSyncQueue: (userId: number) => void
  setOnlineStatus: (online: boolean) => void
  setLastSyncTime: (userId: number, time: string) => void
}

const useGlobalFavoritesStore = create<GlobalFavoritesStore>()(
  persist(
    (set, get) => ({
      userFavorites: {},
      syncQueue: {},
      lastSyncTime: {},
      isOnline: navigator?.onLine ?? true,
      
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
      },

      addToSyncQueue: (userId, action, item) => {
        const { syncQueue } = get()
        const userQueue = syncQueue[userId] || { toAdd: [], toRemove: [] }
        
        if (action === 'add') {
          // 移除重複項目
          userQueue.toAdd = userQueue.toAdd.filter(
            existing => !(existing.itemType === item.itemType && existing.itemId === item.itemId)
          )
          userQueue.toAdd.push(item)
          
          // 如果在刪除隊列中，移除它
          userQueue.toRemove = userQueue.toRemove.filter(
            existing => !(existing.itemType === item.itemType && existing.itemId === item.itemId)
          )
        } else {
          // 移除重複項目
          userQueue.toRemove = userQueue.toRemove.filter(
            existing => !(existing.itemType === item.itemType && existing.itemId === item.itemId)
          )
          userQueue.toRemove.push(item)
          
          // 如果在新增隊列中，移除它
          userQueue.toAdd = userQueue.toAdd.filter(
            existing => !(existing.itemType === item.itemType && existing.itemId === item.itemId)
          )
        }

        set({
          syncQueue: {
            ...syncQueue,
            [userId]: userQueue
          }
        })
      },

      clearSyncQueue: (userId) => {
        const { syncQueue } = get()
        const newQueue = { ...syncQueue }
        delete newQueue[userId]
        set({ syncQueue: newQueue })
      },

      setOnlineStatus: (online) => {
        set({ isOnline: online })
      },

      setLastSyncTime: (userId, time) => {
        const { lastSyncTime } = get()
        set({
          lastSyncTime: {
            ...lastSyncTime,
            [userId]: time
          }
        })
      }
    }),
    {
      name: 'enhanced-favorites-storage',
      partialize: (state) => ({
        userFavorites: state.userFavorites,
        syncQueue: state.syncQueue,
        lastSyncTime: state.lastSyncTime
      })
    }
  )
)

// API 服務
class FavoriteAPI {
  private baseURL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'

  private async getAuthHeaders() {
    const companyCode = window.location.pathname.split('/')[1]
    const token = localStorage.getItem(`portalToken_${companyCode}`) || localStorage.getItem('token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  async getUserFavorites(): Promise<FavoriteItem[]> {
    const response = await fetch(`${this.baseURL}/user-favorites`, {
      headers: await this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch favorites')
    return response.json()
  }

  async addFavorite(itemType: string, itemId: number): Promise<FavoriteResponse> {
    const response = await fetch(`${this.baseURL}/user-favorites`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ itemType, itemId })
    })
    if (!response.ok) throw new Error('Failed to add favorite')
    return response.json()
  }

  async removeFavorite(itemType: string, itemId: number): Promise<FavoriteResponse> {
    const response = await fetch(`${this.baseURL}/user-favorites/${itemType}/${itemId}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to remove favorite')
    return response.json()
  }

  async syncFavorites(favorites: { itemType: string; itemId: number; addedAt: string }[]): Promise<FavoriteResponse> {
    const response = await fetch(`${this.baseURL}/user-favorites/sync`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ favorites })
    })
    if (!response.ok) throw new Error('Failed to sync favorites')
    return response.json()
  }

  async clearAllFavorites(): Promise<FavoriteResponse> {
    const response = await fetch(`${this.baseURL}/user-favorites`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to clear favorites')
    return response.json()
  }

  async getFavoriteStats(): Promise<FavoriteStats> {
    const response = await fetch(`${this.baseURL}/user-favorites/stats`, {
      headers: await this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch stats')
    return response.json()
  }

  async isFavorite(itemType: string, itemId: number): Promise<boolean> {
    const response = await fetch(`${this.baseURL}/user-favorites/check/${itemType}/${itemId}`, {
      headers: await this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to check favorite')
    const result = await response.json()
    return result.isFavorite
  }
}

const favoriteAPI = new FavoriteAPI()

// 增強版我的最愛 Hook
interface EnhancedFavoritesStore {
  favorites: FavoriteItem[]
  isLoading: boolean
  isOnline: boolean
  stats: FavoriteStats | null
  
  // 基本操作
  addToFavorites: (product: Omit<FavoriteItem, 'addedAt' | 'itemType' | 'itemId'>) => Promise<void>
  removeFromFavorites: (productId: number) => Promise<void>
  isFavorite: (productId: number) => boolean
  clearFavorites: () => Promise<void>
  getFavoritesCount: () => number
  
  // 同步操作
  syncWithServer: () => Promise<void>
  loadFromServer: () => Promise<void>
  getStats: () => Promise<void>
  
  // 離線模式
  getPendingSyncCount: () => number
  getLastSyncTime: () => string | null
}

export const useEnhancedFavoritesStore = (): EnhancedFavoritesStore => {
  const user = useUserStore((state) => state.user)
  const {
    userFavorites,
    setUserFavorites,
    getUserFavorites,
    syncQueue,
    addToSyncQueue,
    clearSyncQueue,
    isOnline,
    setOnlineStatus,
    lastSyncTime,
    setLastSyncTime
  } = useGlobalFavoritesStore()
  
  // 自動遷移舊資料
  const { needsMigration } = useFavoritesMigration()
  
  const userId = user?.id || 0
  const favorites = getUserFavorites(userId)

  // 監聽網路狀態
  useEffect(() => {
    const handleOnline = () => {
      setOnlineStatus(true)
      // 網路恢復時自動同步
      syncWithServer()
    }
    const handleOffline = () => setOnlineStatus(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [userId])

  // 樂觀更新本地狀態
  const updateLocalFavorites = (newFavorites: FavoriteItem[]) => {
    setUserFavorites(userId, newFavorites)
  }

  const addToFavorites = async (product: Omit<FavoriteItem, 'addedAt' | 'itemType' | 'itemId'>) => {
    const existingItem = favorites.find(item => item.id === product.id)
    if (existingItem) return

    const newItem: FavoriteItem = {
      ...product,
      addedAt: new Date().toISOString(),
      itemType: 'product',
      itemId: product.id
    }

    // 1. 立即更新本地狀態
    const updatedFavorites = [...favorites, newItem]
    updateLocalFavorites(updatedFavorites)

    // 2. 嘗試同步到伺服器
    if (isOnline && user?.id) {
      try {
        await favoriteAPI.addFavorite('product', product.id)
      } catch (error) {
        console.warn('Failed to sync add favorite to server:', error)
        // 添加到同步隊列
        addToSyncQueue(userId, 'add', {
          itemType: 'product',
          itemId: product.id,
          addedAt: newItem.addedAt
        })
      }
    } else {
      // 離線模式：添加到同步隊列
      addToSyncQueue(userId, 'add', {
        itemType: 'product',
        itemId: product.id,
        addedAt: newItem.addedAt
      })
    }
  }

  const removeFromFavorites = async (productId: number) => {
    const updatedFavorites = favorites.filter(item => item.id !== productId)
    updateLocalFavorites(updatedFavorites)

    if (isOnline && user?.id) {
      try {
        await favoriteAPI.removeFavorite('product', productId)
      } catch (error) {
        console.warn('Failed to sync remove favorite to server:', error)
        addToSyncQueue(userId, 'remove', {
          itemType: 'product',
          itemId: productId
        })
      }
    } else {
      addToSyncQueue(userId, 'remove', {
        itemType: 'product',
        itemId: productId
      })
    }
  }

  const isFavorite = (productId: number) => {
    return favorites.some(item => item.id === productId)
  }

  const clearFavorites = async () => {
    updateLocalFavorites([])

    if (isOnline && user?.id) {
      try {
        await favoriteAPI.clearAllFavorites()
        clearSyncQueue(userId)
      } catch (error) {
        console.warn('Failed to clear favorites on server:', error)
      }
    }
  }

  const getFavoritesCount = () => {
    return favorites.length
  }

  // 從伺服器載入資料
  const loadFromServer = async () => {
    if (!isOnline || !user?.id) return

    try {
      const serverFavorites = await favoriteAPI.getUserFavorites()
      updateLocalFavorites(serverFavorites)
      setLastSyncTime(userId, new Date().toISOString())
    } catch (error) {
      console.warn('Failed to load favorites from server:', error)
    }
  }

  // 同步到伺服器
  const syncWithServer = async () => {
    if (!isOnline || !user?.id) return

    const userQueue = syncQueue[userId]
    if (!userQueue || (userQueue.toAdd.length === 0 && userQueue.toRemove.length === 0)) {
      return
    }

    try {
      // 處理新增隊列
      for (const item of userQueue.toAdd) {
        await favoriteAPI.addFavorite(item.itemType, item.itemId)
      }

      // 處理刪除隊列
      for (const item of userQueue.toRemove) {
        await favoriteAPI.removeFavorite(item.itemType, item.itemId)
      }

      // 清空同步隊列
      clearSyncQueue(userId)
      
      // 重新從伺服器載入最新數據
      await loadFromServer()
      
      console.log('Favorites synced successfully')
    } catch (error) {
      console.warn('Failed to sync favorites:', error)
    }
  }

  const getStats = async () => {
    if (!isOnline || !user?.id) return null

    try {
      return await favoriteAPI.getFavoriteStats()
    } catch (error) {
      console.warn('Failed to get favorite stats:', error)
      return null
    }
  }

  const getPendingSyncCount = () => {
    const userQueue = syncQueue[userId]
    if (!userQueue) return 0
    return userQueue.toAdd.length + userQueue.toRemove.length
  }

  const getLastSyncTime = () => {
    return lastSyncTime[userId] || null
  }

  return {
    favorites,
    isLoading: false,
    isOnline,
    stats: null,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    clearFavorites,
    getFavoritesCount,
    syncWithServer,
    loadFromServer,
    getStats,
    getPendingSyncCount,
    getLastSyncTime
  }
}