'use client'

import { useState, useEffect } from 'react'

interface StorageInfo {
  key: string
  size: number
  sizeFormatted: string
  itemCount?: number
  lastModified?: string
  canCleanup: boolean
  description: string
}

export default function StorageCleanupTool() {
  const [storageItems, setStorageItems] = useState<StorageInfo[]>([])
  const [totalSize, setTotalSize] = useState(0)

  useEffect(() => {
    scanLocalStorage()
  }, [])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const scanLocalStorage = () => {
    const items: StorageInfo[] = []
    let total = 0

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue

      const value = localStorage.getItem(key)
      if (!value) continue

      const size = new Blob([value]).size
      total += size

      let itemCount: number | undefined
      let lastModified: string | undefined
      let canCleanup = false
      let description = ''

      // 分析不同類型的儲存資料
      try {
        const parsedValue = JSON.parse(value)
        
        if (key === 'all-users-favorites-storage') {
          canCleanup = true
          description = '舊版我的最愛資料（可安全清理）'
          if (parsedValue.state?.userFavorites) {
            itemCount = Object.values(parsedValue.state.userFavorites).reduce(
              (acc: number, userFavs: any) => acc + (Array.isArray(userFavs) ? userFavs.length : 0), 0
            )
          }
        } else if (key === 'enhanced-favorites-storage') {
          description = '新版我的最愛資料（建議保留）'
          if (parsedValue.state?.userFavorites) {
            itemCount = Object.values(parsedValue.state.userFavorites).reduce(
              (acc: number, userFavs: any) => acc + (Array.isArray(userFavs) ? userFavs.length : 0), 0
            )
          }
        } else if (key.includes('cart-storage')) {
          description = '購物車資料'
          if (Array.isArray(parsedValue.state?.items)) {
            itemCount = parsedValue.state.items.length
          }
        } else if (key.includes('user-storage')) {
          description = '用戶登入資料'
        } else if (key.startsWith('portalToken_')) {
          description = `前台登入 Token (${key.replace('portalToken_', '')})`
        } else if (key.startsWith('portalUser_')) {
          description = `前台用戶資料 (${key.replace('portalUser_', '')})`
        } else if (key === 'token') {
          description = '後台登入 Token'
        } else if (key === 'user') {
          description = '後台用戶資料'
        } else {
          description = '其他應用資料'
        }

        // 嘗試獲取時間戳
        if (parsedValue.state?.lastUpdated) {
          lastModified = new Date(parsedValue.state.lastUpdated).toLocaleString()
        }
      } catch (e) {
        description = '非 JSON 格式資料'
      }

      items.push({
        key,
        size,
        sizeFormatted: formatBytes(size),
        itemCount,
        lastModified,
        canCleanup,
        description
      })
    }

    // 按大小排序
    items.sort((a, b) => b.size - a.size)
    
    setStorageItems(items)
    setTotalSize(total)
  }

  const cleanupItem = (key: string) => {
    if (confirm(`確定要清除 "${key}" 嗎？\n\n此操作無法復原。`)) {
      localStorage.removeItem(key)
      scanLocalStorage() // 重新掃描
      
      // 顯示成功訊息
      alert('清理完成！')
    }
  }

  const cleanupOldFavorites = () => {
    const oldItem = storageItems.find(item => item.key === 'all-users-favorites-storage')
    if (!oldItem) {
      alert('未找到舊版我的最愛資料')
      return
    }

    if (confirm(
      '確定要清除舊版我的最愛資料嗎？\n\n' +
      '請確保已經使用新版本功能，且資料已成功遷移。\n' +
      '此操作無法復原。'
    )) {
      localStorage.removeItem('all-users-favorites-storage')
      scanLocalStorage()
      alert('舊版我的最愛資料已清理完成！')
    }
  }

  const exportData = (key: string) => {
    const value = localStorage.getItem(key)
    if (!value) return

    const blob = new Blob([value], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${key}-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="storage-cleanup-tool">
      <div className="cleanup-header">
        <h2>🗃️ 瀏覽器儲存空間管理</h2>
        <div className="total-info">
          <span>總使用空間: <strong>{formatBytes(totalSize)}</strong></span>
          <span>項目數量: <strong>{storageItems.length}</strong></span>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="quick-actions">
        <button 
          onClick={cleanupOldFavorites}
          className="action-btn danger"
          disabled={!storageItems.some(item => item.key === 'all-users-favorites-storage')}
        >
          🗑️ 清理舊版我的最愛
        </button>
        <button 
          onClick={() => window.location.reload()}
          className="action-btn secondary"
        >
          🔄 重新掃描
        </button>
      </div>

      {/* 儲存項目列表 */}
      <div className="storage-list">
        {storageItems.map((item) => (
          <div key={item.key} className={`storage-item ${item.canCleanup ? 'can-cleanup' : ''}`}>
            <div className="item-header">
              <div className="item-info">
                <h3 className="item-key">{item.key}</h3>
                <p className="item-description">{item.description}</p>
              </div>
              <div className="item-size">
                <span className="size-badge">{item.sizeFormatted}</span>
              </div>
            </div>

            <div className="item-details">
              {item.itemCount !== undefined && (
                <span className="detail-item">📊 項目數: {item.itemCount}</span>
              )}
              {item.lastModified && (
                <span className="detail-item">🕒 最後修改: {item.lastModified}</span>
              )}
              {item.canCleanup && (
                <span className="cleanup-badge">🟡 可安全清理</span>
              )}
            </div>

            <div className="item-actions">
              <button 
                onClick={() => exportData(item.key)}
                className="action-btn small secondary"
              >
                📥 備份
              </button>
              <button 
                onClick={() => cleanupItem(item.key)}
                className={`action-btn small ${item.canCleanup ? 'danger' : 'warning'}`}
              >
                🗑️ 清除
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 說明 */}
      <div className="cleanup-info">
        <h3>📖 說明</h3>
        <ul>
          <li><strong>舊版我的最愛資料：</strong>已升級為新版本，可安全清理</li>
          <li><strong>Token 資料：</strong>登入憑證，清除後需重新登入</li>
          <li><strong>購物車資料：</strong>清除後購物車將被清空</li>
          <li><strong>備份功能：</strong>清除前建議先備份重要資料</li>
        </ul>
      </div>

      <style jsx>{`
        .storage-cleanup-tool {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

        .cleanup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e5e7eb;
        }

        .cleanup-header h2 {
          margin: 0;
          color: #1f2937;
        }

        .total-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          text-align: right;
          font-size: 0.9rem;
          color: #6b7280;
        }

        .quick-actions {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .action-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn.small {
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
        }

        .action-btn.danger {
          background: #ef4444;
          color: white;
        }

        .action-btn.danger:hover {
          background: #dc2626;
        }

        .action-btn.warning {
          background: #f59e0b;
          color: white;
        }

        .action-btn.warning:hover {
          background: #d97706;
        }

        .action-btn.secondary {
          background: #6b7280;
          color: white;
        }

        .action-btn.secondary:hover {
          background: #4b5563;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .storage-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .storage-item {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.5rem;
          background: white;
          transition: all 0.2s ease;
        }

        .storage-item:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .storage-item.can-cleanup {
          border-left: 4px solid #f59e0b;
          background: #fffbeb;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .item-key {
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
          word-break: break-all;
        }

        .item-description {
          margin: 0;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .size-badge {
          background: #3b82f6;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 16px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .item-details {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .detail-item {
          background: #f3f4f6;
          padding: 0.25rem 0.75rem;
          border-radius: 16px;
          font-size: 0.8rem;
          color: #4b5563;
        }

        .cleanup-badge {
          background: #fbbf24;
          color: #92400e;
          padding: 0.25rem 0.75rem;
          border-radius: 16px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .item-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        .cleanup-info {
          margin-top: 3rem;
          padding: 1.5rem;
          background: #f8fafc;
          border-radius: 12px;
          border-left: 4px solid #3b82f6;
        }

        .cleanup-info h3 {
          margin: 0 0 1rem 0;
          color: #1f2937;
        }

        .cleanup-info ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .cleanup-info li {
          margin-bottom: 0.5rem;
          color: #4b5563;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .storage-cleanup-tool {
            padding: 1rem;
          }

          .cleanup-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .quick-actions {
            flex-direction: column;
          }

          .item-header {
            flex-direction: column;
            gap: 1rem;
          }

          .item-actions {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}