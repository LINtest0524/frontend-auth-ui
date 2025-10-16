'use client'

import { useEffect } from 'react'

interface OldFavoriteItem {
  id: number
  name: string
  price: number
  original_price?: number
  thumbnail?: string
  sku: string
  addedAt: string
  hasVariants?: boolean
  variantImages?: string[]
}

interface OldFavoritesStorage {
  userFavorites: Record<number, OldFavoriteItem[]>
}

/**
 * 我的最愛資料遷移 Hook
 * 將舊的 all-users-favorites-storage 資料遷移到新系統
 */
export const useFavoritesMigration = () => {
  useEffect(() => {
    migrateOldFavorites()
  }, [])

  const migrateOldFavorites = () => {
    try {
      // 1. 讀取舊的儲存資料
      const oldDataString = localStorage.getItem('all-users-favorites-storage')
      if (!oldDataString) {
        console.log('No old favorites data found, skipping migration')
        return
      }

      const oldData: { state: OldFavoritesStorage } = JSON.parse(oldDataString)
      if (!oldData.state?.userFavorites) {
        console.log('No valid old favorites data found')
        return
      }

      // 2. 讀取新的儲存資料
      const newDataString = localStorage.getItem('enhanced-favorites-storage')
      const newData = newDataString ? JSON.parse(newDataString) : { state: { userFavorites: {}, syncQueue: {}, lastSyncTime: {} } }

      let migrated = false

      // 3. 遷移每個用戶的資料
      Object.entries(oldData.state.userFavorites).forEach(([userIdStr, oldFavorites]) => {
        const userId = parseInt(userIdStr)
        
        // 檢查新系統是否已有此用戶的資料
        if (!newData.state.userFavorites[userId] || newData.state.userFavorites[userId].length === 0) {
          // 轉換資料格式
          const migratedFavorites = oldFavorites.map(item => ({
            ...item,
            itemType: 'product', // 舊資料都是商品
            itemId: item.id
          }))

          // 保存到新系統
          newData.state.userFavorites[userId] = migratedFavorites
          
          // 標記為待同步（如果用戶登入的話會自動同步到伺服器）
          if (!newData.state.syncQueue[userId]) {
            newData.state.syncQueue[userId] = { toAdd: [], toRemove: [] }
          }
          
          // 將所有遷移的項目加入同步隊列
          newData.state.syncQueue[userId].toAdd = migratedFavorites.map(item => ({
            itemType: 'product',
            itemId: item.id,
            addedAt: item.addedAt
          }))

          migrated = true
          console.log(`Migrated ${migratedFavorites.length} favorites for user ${userId}`)
        }
      })

      // 4. 保存新資料
      if (migrated) {
        localStorage.setItem('enhanced-favorites-storage', JSON.stringify(newData))
        console.log('Favorites migration completed successfully')
        
        // 5. 顯示遷移通知（可選）
        showMigrationNotification()
      }

      // 6. 移除舊資料（延遲執行，確保遷移成功）
      setTimeout(() => {
        localStorage.removeItem('all-users-favorites-storage')
        console.log('Old favorites storage cleaned up')
      }, 5000)

    } catch (error) {
      console.error('Failed to migrate favorites:', error)
      // 如果遷移失敗，不要刪除舊資料
    }
  }

  const showMigrationNotification = () => {
    // 可以顯示一個友善的通知
    const notification = document.createElement('div')
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-size: 14px;
        max-width: 300px;
      ">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span>✅</span>
          <span>我的最愛已升級至新版本！現在支援跨設備同步。</span>
        </div>
      </div>
    `
    
    document.body.appendChild(notification)
    
    // 3秒後自動消失
    setTimeout(() => {
      notification.remove()
    }, 3000)
  }

  // 檢查是否需要遷移
  const needsMigration = () => {
    const oldData = localStorage.getItem('all-users-favorites-storage')
    const newData = localStorage.getItem('enhanced-favorites-storage')
    
    return oldData && (!newData || JSON.parse(newData).state?.userFavorites === undefined)
  }

  return {
    needsMigration: needsMigration(),
    migrateOldFavorites
  }
}