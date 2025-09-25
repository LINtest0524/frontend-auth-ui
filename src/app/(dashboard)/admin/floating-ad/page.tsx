'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import '@/styles/pages/floating-ad-admin.css'

type FloatingAd = {
  id: number
  title: string
  link_url: string
  image_url?: string
  target_blank: boolean
  position: string
  status: string
  sort: number
  created_at: string
  updated_at: string
}

export default function FloatingAdListPage() {
  const router = useRouter()
  const [items, setItems] = useState<FloatingAd[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFloatingAds()
  }, [])

  const fetchFloatingAds = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/floating-ads`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setItems(data)
      } else {
        console.error('獲取浮動廣告失敗')
      }
    } catch (error) {
      console.error('獲取浮動廣告錯誤:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`確定要刪除「${title}」嗎？`)) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/floating-ads/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        alert('刪除成功')
        fetchFloatingAds() // 重新載入列表
      } else {
        alert('刪除失敗')
      }
    } catch (error) {
      console.error('刪除錯誤:', error)
      alert('刪除失敗')
    }
  }

  const getPositionText = (position: string) => {
    const positionMap: Record<string, string> = {
      'top-right': '右上角',
      'bottom-right': '右下角',
      'top-left': '左上角',
      'bottom-left': '左下角',
    }
    return positionMap[position] || position
  }

  const getStatusText = (status: string) => {
    return status === 'ACTIVE' ? '啟用' : '停用'
  }


  if (loading) {
    return (
      <div className="floating-ad-admin-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <span>載入浮動廣告資料中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="floating-ad-admin-container">
      {/* 頁面標題區域 */}
      <div className="floating-ad-admin-header">
        <h1>🎯 浮動廣告管理</h1>

        <div className="floating-ad-admin-header-actions">
          <Link href="/admin/floating-ad/new" className="floating-ad-add-btn">
            新增廣告
          </Link>
        </div>
      </div>


      {/* 內容區域 */}
      <div className="content-section">
        <div className="content-header">
          <h2 className="content-title">
            <span>📋</span>
            廣告列表
          </h2>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3 className="empty-title">還沒有浮動廣告</h3>
            <p className="empty-description">
              開始創建您的第一個浮動廣告，提升網站的宣傳效果
            </p>
            <Link href="/admin/floating-ad/new" className="floating-ad-add-btn">
              <span>✨</span>
              立即新增
            </Link>
          </div>
        ) : (
          <table className="modern-table">
            <thead>
              <tr>
                <th>🖼️ 圖片</th>
                <th>📝 標題</th>
                <th>🔗 連結</th>
                <th>📍 位置</th>
                <th>⚡ 狀態</th>
                <th>🔢 排序</th>
                <th>📅 建立時間</th>
                <th>⚙️ 操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.image_url ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_BASE}${item.image_url}`}
                        alt={item.title}
                        className="ad-image"
                      />
                    ) : (
                      <div className="no-image">
                        📷<br />無圖片
                      </div>
                    )}
                  </td>
                  <td>
                    <strong>{item.title}</strong>
                  </td>
                  <td>
                    <div className="link-info">
                      <a 
                        href={item.link_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="link-url"
                      >
                        {item.link_url}
                      </a>
                      <span className="link-target">
                        {item.target_blank ? '🔗 新視窗' : '📄 同視窗'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="position-badge">
                      {getPositionText(item.position)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${item.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}>
                      {item.status === 'ACTIVE' ? '✅ 啟用' : '⏸️ 停用'}
                    </span>
                  </td>
                  <td>
                    <strong>{item.sort}</strong>
                  </td>
                  <td>
                    {new Date(item.created_at).toLocaleDateString('zh-TW', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    })}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => router.push(`/admin/floating-ad/${item.id}/edit`)}
                        className="btn-edit"
                      >
                        ✏️ 編輯
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        className="btn-delete"
                      >
                        🗑️ 刪除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}