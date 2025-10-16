'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEnhancedFavoritesStore } from '@/hooks/use-favorites-store-v2'

export default function MemberFavoritesV2() {
  const {
    favorites,
    isLoading,
    isOnline,
    removeFromFavorites,
    clearFavorites,
    syncWithServer,
    loadFromServer,
    getStats,
    getPendingSyncCount,
    getLastSyncTime
  } = useEnhancedFavoritesStore()
  
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    // 組件載入時從伺服器同步資料
    loadFromServer()
    
    // 載入統計資料
    const loadStats = async () => {
      const statsData = await getStats()
      setStats(statsData)
    }
    loadStats()
  }, [])

  const handleRemoveItem = async (productId: number, productName: string) => {
    if (confirm(`確定要從收藏中移除「${productName}」嗎？`)) {
      await removeFromFavorites(productId)
    }
  }

  const handleClearAll = async () => {
    if (favorites.length === 0) return
    if (confirm('確定要清空所有收藏嗎？')) {
      await clearFavorites()
    }
  }

  const handleManualSync = async () => {
    setIsSyncing(true)
    try {
      await syncWithServer()
      // 重新載入統計
      const statsData = await getStats()
      setStats(statsData)
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleGoToProduct = (productId: number) => {
    router.push(`/a/products/${productId}`)
  }

  const pendingCount = getPendingSyncCount()
  const lastSync = getLastSyncTime()

  if (isLoading) {
    return (
      <div className="member-form-container">
        <div className="member-form-content" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="loading-spinner"></div>
          <div>載入中...</div>
        </div>
      </div>
    )
  }

  if (favorites.length === 0) {
    return (
      <div className="member-form-container">
        <div className="member-form-header">
          <h3 className="member-form-title">
            <div className="member-form-icon">❤️</div>
            我的最愛
          </h3>
        </div>
        
        {/* 同步狀態 */}
        <div className="sync-status-bar">
          <div className="sync-info">
            <span className={`online-status ${isOnline ? 'online' : 'offline'}`}>
              {isOnline ? '🟢 線上' : '🔴 離線'}
            </span>
            {pendingCount > 0 && (
              <span className="pending-sync">
                📝 待同步: {pendingCount} 項
              </span>
            )}
            {lastSync && (
              <span className="last-sync">
                🕒 上次同步: {new Date(lastSync).toLocaleString()}
              </span>
            )}
          </div>
          {(pendingCount > 0 || !lastSync) && isOnline && (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="sync-button"
            >
              {isSyncing ? '同步中...' : '🔄 立即同步'}
            </button>
          )}
        </div>

        <div className="member-form-content">
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#718096' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💝</div>
            <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>還沒有收藏任何商品</div>
            <div style={{ fontSize: '14px', marginBottom: '20px' }}>快去逛逛商品，加入您喜歡的商品吧！</div>
            <button
              onClick={() => router.push('/a/products')}
              className="member-form-button"
              style={{ maxWidth: '200px' }}
            >
              🛍️ 去逛逛
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="member-form-container">
      <div className="member-form-header">
        <h3 className="member-form-title">
          <div className="member-form-icon">❤️</div>
          我的最愛 ({favorites.length})
        </h3>
      </div>

      {/* 統計資訊 */}
      {stats && (
        <div className="favorites-stats">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">總收藏</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.recentCount}</span>
              <span className="stat-label">本週新增</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{Object.keys(stats.byType).length}</span>
              <span className="stat-label">收藏類型</span>
            </div>
          </div>
        </div>
      )}

      {/* 同步狀態欄 */}
      <div className="sync-status-bar">
        <div className="sync-info">
          <span className={`online-status ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? '🟢 線上' : '🔴 離線模式'}
          </span>
          {pendingCount > 0 && (
            <span className="pending-sync">
              📝 待同步: {pendingCount} 項
            </span>
          )}
          {lastSync && (
            <span className="last-sync">
              🕒 上次同步: {new Date(lastSync).toLocaleString()}
            </span>
          )}
        </div>
        <div className="sync-actions">
          {(pendingCount > 0 || !lastSync) && isOnline && (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="sync-button"
            >
              {isSyncing ? '同步中...' : '🔄 同步'}
            </button>
          )}
          <button
            onClick={handleClearAll}
            className="member-verification-btn danger"
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            🗑️ 清空收藏
          </button>
        </div>
      </div>

      <div className="member-form-content">
        {/* 收藏商品列表 */}
        <div className="favorites-enhanced-grid">
          {favorites.map((item) => (
            <div key={`${item.itemType}-${item.id}`} className="favorite-enhanced-card">
              {/* 商品圖片 */}
              <div className="favorite-image-container">
                {item.thumbnail ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_BASE}${item.thumbnail}`}
                    alt={item.name}
                    onClick={() => handleGoToProduct(item.id)}
                    className="favorite-image"
                  />
                ) : (
                  <div className="favorite-no-image" onClick={() => handleGoToProduct(item.id)}>
                    📦
                  </div>
                )}
                
                {/* 類型標籤 */}
                <div className="item-type-badge">
                  {item.itemType === 'product' ? '🛍️' : 
                   item.itemType === 'article' ? '📰' : '🎉'}
                </div>
              </div>

              {/* 商品資訊 */}
              <div className="favorite-info">
                <h4 className="favorite-name" onClick={() => handleGoToProduct(item.id)}>
                  {item.name}
                </h4>
                
                {/* 價格資訊 */}
                {item.price && (
                  <div className="favorite-price">
                    <span className="current-price">NT$ {item.price}</span>
                    {item.original_price && item.original_price > item.price && (
                      <span className="original-price">NT$ {item.original_price}</span>
                    )}
                  </div>
                )}

                {/* 收藏時間 */}
                <div className="favorite-date">
                  收藏於 {new Date(item.addedAt).toLocaleDateString()}
                </div>
              </div>

              {/* 操作按鈕 */}
              <div className="favorite-actions">
                <button
                  onClick={() => handleGoToProduct(item.id)}
                  className="favorite-btn primary"
                >
                  查看詳情
                </button>
                <button
                  onClick={() => handleRemoveItem(item.id, item.name)}
                  className="favorite-btn secondary"
                >
                  移除收藏
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 樣式 */}
      <style jsx>{`
        .sync-status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .sync-info {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .sync-actions {
          display: flex;
          gap: 0.5rem;
        }

        .online-status.online {
          color: #10b981;
          font-weight: 600;
        }

        .online-status.offline {
          color: #ef4444;
          font-weight: 600;
        }

        .pending-sync {
          color: #f59e0b;
          font-weight: 500;
        }

        .last-sync {
          color: #6b7280;
        }

        .sync-button {
          padding: 0.5rem 1rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .sync-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .favorites-stats {
          margin-bottom: 1rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 8px;
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
        }

        .stat-label {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .favorites-enhanced-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .favorite-enhanced-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .favorite-enhanced-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }

        .favorite-image-container {
          position: relative;
          height: 180px;
          overflow: hidden;
        }

        .favorite-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          cursor: pointer;
        }

        .favorite-no-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          font-size: 2rem;
          cursor: pointer;
        }

        .item-type-badge {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: rgba(255, 255, 255, 0.9);
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
        }

        .favorite-info {
          padding: 1rem;
        }

        .favorite-name {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
          cursor: pointer;
          color: #1f2937;
        }

        .favorite-name:hover {
          color: #3b82f6;
        }

        .favorite-price {
          margin-bottom: 0.5rem;
        }

        .current-price {
          font-weight: 600;
          color: #ef4444;
          margin-right: 0.5rem;
        }

        .original-price {
          text-decoration: line-through;
          color: #9ca3af;
          font-size: 0.9rem;
        }

        .favorite-date {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .favorite-actions {
          display: flex;
          gap: 0.5rem;
          padding: 1rem;
          border-top: 1px solid #f3f4f6;
        }

        .favorite-btn {
          flex: 1;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .favorite-btn.primary {
          background: #3b82f6;
          color: white;
        }

        .favorite-btn.primary:hover {
          background: #2563eb;
        }

        .favorite-btn.secondary {
          background: #f3f4f6;
          color: #6b7280;
        }

        .favorite-btn.secondary:hover {
          background: #e5e7eb;
        }

        @media (max-width: 768px) {
          .sync-status-bar {
            flex-direction: column;
            gap: 1rem;
          }

          .sync-info {
            flex-direction: column;
            gap: 0.5rem;
          }

          .favorites-enhanced-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}