'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import '@/styles/pages/banner-admin.css'

type Banner = {
  id: number
  title: string
  sort: number
  start_time: string
  end_time: string
  status: string
  desktop_image_url: string
  mobile_image_url: string
}
// 使用環境變數 API 端點

export default function BannerListPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/banners`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setBanners(data)
      } catch (err) {
        // 載入 Banner 失敗，靜默處理
        alert('載入橫幅列表失敗，請稍後再試')
      }
    }

    fetchData()
  }, [])


  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('確定要刪除這筆 Banner 嗎？')
    if (!confirmed) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/banners/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error('刪除失敗')

      // 更新畫面
      setBanners(prev => prev.filter(b => b.id !== id))
      alert('  刪除成功')
    } catch (err: any) {
      // 刪除失敗，靜默處理
      alert('刪除橫幅失敗，請稍後再試')
      alert(`    刪除失敗：${err.message}`)
    }
  }

  const formatDateTime = (iso: string) => {
    const date = new Date(iso)
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  return (
    <div className="banner-admin-container">
      {/* 頁面標題區域 */}
      <div className="banner-admin-header">
        <h1>🖼️ Banner 管理</h1>
        <div className="banner-admin-header-actions">
          <Link href="/admin/banner/new" className="btn-primary">
            <span>✨</span>
            新增 Banner
          </Link>
        </div>
      </div>

      {/* 內容區域 */}
      <div className="content-section">
        {/* 表格控制區域 */}
        <div className="table-controls">
          <div className="table-info">
            共 {banners.length} 個 Banner
          </div>
        </div>

        {/* 現代化表格 */}
        <table className="modern-table">
          <thead>
            <tr>
              <th>📋 Banner 資訊</th>
              <th>🔢 排序</th>
              <th>⏰ 開放時間</th>
              <th>🖥️ 桌面圖片</th>
              <th>📱 手機圖片</th>
              <th>📊 狀態</th>
              <th>⚙️ 操作</th>
            </tr>
          </thead>
          <tbody>
            {banners.map((banner) => (
              <tr key={banner.id}>
                <td>
                  <div className="banner-info">
                    <div className="banner-title">{banner.title}</div>
                    <div className="banner-id">ID: #{banner.id}</div>
                  </div>
                </td>
                <td>
                  <span className="sort-badge">{banner.sort}</span>
                </td>
                <td>
                  <div className="time-info">
                    <div className="time-start">
                      🟢 {formatDateTime(banner.start_time)}
                    </div>
                    <div className="time-end">
                      🔴 {formatDateTime(banner.end_time)}
                    </div>
                  </div>
                </td>
                <td>
                  <button
                    className="image-preview-btn"
                    onClick={() => setPreviewImage(`${process.env.NEXT_PUBLIC_API_BASE}${banner.desktop_image_url}`)}
                  >
                    <span>🖥️</span>
                    預覽
                  </button>
                </td>
                <td>
                  <button
                    className="image-preview-btn"
                    onClick={() => setPreviewImage(`${process.env.NEXT_PUBLIC_API_BASE}${banner.mobile_image_url}`)}
                  >
                    <span>📱</span>
                    預覽
                  </button>
                </td>
                <td>
                  <button
                    onClick={async () => {
                      const newStatus = banner.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
                      try {
                        const token = localStorage.getItem('token')
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/banners/${banner.id}`, {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({ status: newStatus }),
                        })
                        if (!res.ok) throw new Error('切換失敗')

                        setBanners(prev =>
                          prev.map(b =>
                            b.id === banner.id ? { ...b, status: newStatus } : b
                          )
                        )
                      } catch (err) {
                        alert('無法切換狀態')
                        // 圖片上傳失敗，靜默處理
                        alert('圖片上傳失敗，請稍後再試')
                      }
                    }}
                    className={`status-toggle ${
                      banner.status === 'ACTIVE' ? 'status-active' : 'status-inactive'
                    }`}
                  >
                    {banner.status === 'ACTIVE' ? '✅ 啟用' : '❌ 停用'}
                  </button>
                </td>
                <td>
                  <div className="action-buttons">
                    <Link href={`/admin/banner/edit/${banner.id}`} className="btn-edit">
                      <span>✏️</span>
                      編輯
                    </Link>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(banner.id)}
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
        
        {/* 無資料顯示 */}
        {banners.length === 0 && (
          <div className="no-data">
            <img src="/no-information.webp" alt="無資料" />
            <p>目前沒有 Banner 資料</p>
          </div>
        )}
      </div>

      {/* 圖片預覽彈窗 */}
      {previewImage && (
        <div className="image-preview-modal" onClick={() => setPreviewImage(null)}>
          <div className="image-preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="image-preview-header">
              <h2 className="image-preview-title">🖼️ 圖片預覽</h2>
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
