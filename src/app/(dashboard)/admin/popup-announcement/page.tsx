'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toTaiwanDisplayTime } from '@/lib/timeUtils'
import '@/styles/pages/popup-announcement.css'

type PopupAnnouncement = {
  id: number
  title: string
  desktop_image_url?: string
  mobile_image_url?: string
  button_text?: string
  button_url?: string
  sort_order: number
  status: string
  start_date?: string
  end_date?: string
  company_code: string
  created_at: string
  updated_at: string
}

export default function PopupAnnouncementPage() {
  const [announcements, setAnnouncements] = useState<PopupAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // 檢查用戶信息
      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (userResponse.ok) {
        const response = await userResponse.json()
        const userInfo = response.user
        
        // 使用用戶的實際公司代碼
        const userCompanyCode = userInfo.company?.code
        const apiUrl = userCompanyCode 
          ? `${process.env.NEXT_PUBLIC_API_BASE}/popup-announcements?company=${userCompanyCode}`
          : `${process.env.NEXT_PUBLIC_API_BASE}/popup-announcements`
        
        const apiResponse = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (apiResponse.ok) {
          const data = await apiResponse.json()
          setAnnouncements(data)
        } else {
          console.error('獲取彈窗公告失敗')
        }
      } else {
        console.error('無法獲取用戶資料')
      }
    } catch (error) {
      console.error('獲取彈窗公告錯誤:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除這個彈窗公告嗎？')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/popup-announcements/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setAnnouncements(announcements.filter(item => item.id !== id))
      } else {
        alert('刪除失敗')
      }
    } catch (error) {
      console.error('刪除錯誤:', error)
      alert('刪除失敗')
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return toTaiwanDisplayTime(dateString)
  }

  return (
    <div className="popup-announcement-container">
      {/* 頁面標題區域 */}
      <div className="popup-announcement-header">
        <h1>📢 彈窗公告管理</h1>
        <div className="popup-announcement-header-actions">
          <Link
            href="/admin/popup-announcement/new"
            className="btn-primary"
          >
            <span>✨</span>
            新增彈窗公告
          </Link>
        </div>
      </div>

      {/* 內容區域 */}
      <div className="content-section">
        {/* 表格控制區域 */}
        <div className="table-controls">
          <div className="table-info">
            共 {announcements.length} 個彈窗公告
          </div>
        </div>

        {/* 載入狀態 */}
        {loading && (
          <div className="loading-spinner">
            <div>⏳ 載入中...</div>
          </div>
        )}

        {/* 現代化表格 */}
        {!loading && (
          <table className="modern-table">
            <thead>
              <tr>
                <th>📢 公告資訊</th>
                <th>🖼️ 圖片</th>
                <th>📝 按鈕文字</th>
                <th>🔗 按鈕連結</th>
                <th>📊 排序</th>
                <th>⚡ 狀態</th>
                <th>📅 生效時間</th>
                <th>📅 結束時間</th>
                <th>⚙️ 操作</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="announcement-info">
                      <div className="announcement-title">{item.title}</div>
                      <div className="announcement-id">ID: #{item.id}</div>
                    </div>
                  </td>
                  <td>
                    <div className="image-cell">
                      {item.desktop_image_url ? (
                        <div className="image-preview-container">
                          <img
                            src={`${process.env.NEXT_PUBLIC_API_BASE}${item.desktop_image_url}`}
                            alt={item.title}
                            className="announcement-thumbnail"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <button 
                            onClick={() => setPreviewImage(`${process.env.NEXT_PUBLIC_API_BASE}${item.desktop_image_url}`)}
                            className="image-preview-btn"
                          >
                            <span>🔍</span>
                            預覽
                          </button>
                        </div>
                      ) : (
                        <div className="no-image">
                          <span>📷</span>
                          <span>無圖片</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="button-text-cell">
                      {item.button_text ? (
                        <span className="button-text-badge">
                          {item.button_text}
                        </span>
                      ) : (
                        <span className="no-text">無按鈕文字</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="button-url-cell">
                      {item.button_url ? (
                        <a 
                          href={item.button_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="url-link"
                        >
                          🔗 查看連結
                        </a>
                      ) : (
                        <span className="no-url">無連結</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="sort-cell">
                      <span className="sort-badge">
                        📊 {item.sort_order}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="status-cell">
                      <span className={`status-badge ${item.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                        {item.status === 'active' ? '✅ 啟用' : '❌ 停用'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      {formatDate(item.start_date)}
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      {formatDate(item.end_date)}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link
                        href={`/admin/popup-announcement/${item.id}/edit`}
                        className="btn-edit"
                      >
                        <span>✏️</span>
                        編輯
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="btn-delete"
                      >
                        <span>🗑️</span>
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* 無資料顯示 */}
        {!loading && announcements.length === 0 && (
          <div className="no-data">
            <img src="/no-information.webp" alt="無資料" />
            <p>目前沒有彈窗公告</p>
          </div>
        )}
      </div>

      {/* 圖片預覽彈窗 */}
      {previewImage && (
        <div className="image-preview-modal" onClick={() => setPreviewImage(null)}>
          <div className="image-preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="image-preview-header">
              <h2 className="image-preview-title">🖼️ 彈窗公告圖片預覽</h2>
              <button 
                onClick={() => setPreviewImage(null)} 
                className="image-preview-close"
              >
                ✕
              </button>
            </div>
            <Image 
              src={previewImage} 
              alt="預覽圖片" 
              width={800} 
              height={600} 
              className="image-preview-img" 
            />
          </div>
        </div>
      )}
    </div>
  )
}