'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import '@/styles/pages/logo-admin.css'

type Logo = {
  id: number
  title: string
  image_url: string
  is_active: boolean
  company: {
    id: number
    name: string
    code: string
  }
  createdAt: string
}

export default function LogoManagePage() {
  const router = useRouter()
  const [logos, setLogos] = useState<Logo[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogos = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/logo`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setLogos(data)
      }
    } catch (error) {
      // 載入LOGO失敗，靜默處理
      alert('載入LOGO列表失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogos()
  }, [])

  const handleEdit = (logo: Logo) => {
    router.push(`/admin/logo/edit/${logo.id}`)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除這個 LOGO 嗎？')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/logo/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        await fetchLogos()
      } else {
        alert('刪除失敗')
      }
    } catch (error) {
      // 刪除LOGO失敗，靜默處理
      alert('刪除LOGO失敗，請稍後再試')
      alert('刪除失敗')
    }
  }

  if (loading) {
    return (
      <div className="logo-admin-container">
        <div className="loading-spinner">
          <div>⏳ 載入中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="logo-admin-container">
      {/* 頁面標題區域 */}
      <div className="logo-admin-header">
        <h1>🎨 LOGO 管理</h1>
        <div className="logo-admin-header-actions">
          <button
            onClick={() => router.push('/admin/logo/new')}
            className="btn-primary"
          >
            <span>✨</span>
            新增 LOGO
          </button>
        </div>
      </div>

      {/* 內容區域 */}
      <div className="content-section">
        {/* 表格控制區域 */}
        <div className="table-controls">
          <div className="table-info">
            共 {logos.length} 個 LOGO
          </div>
        </div>

        {/* 現代化表格 */}
        <table className="modern-table">
          <thead>
            <tr>
              <th>🖼️ 預覽</th>
              <th>📋 LOGO 資訊</th>
              <th>🏢 公司</th>
              <th>📊 狀態</th>
              <th>📅 建立時間</th>
              <th>⚙️ 操作</th>
            </tr>
          </thead>
          <tbody>
            {logos.map((logo) => (
              <tr key={logo.id}>
                <td>
                  <div className="logo-preview">
                    {logo.image_url ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_BASE}${logo.image_url}`}
                        alt={logo.title}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<div class="logo-preview-placeholder">圖片載入失敗</div>';
                        }}
                      />
                    ) : (
                      <div className="logo-preview-placeholder">
                        無圖片
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="logo-info">
                    <div className="logo-title">{logo.title}</div>
                    <div className="logo-id">ID: #{logo.id}</div>
                  </div>
                </td>
                <td>
                  <div className="company-info">
                    <div className="company-name">{logo.company?.name || '未知公司'}</div>
                    {logo.company?.code && (
                      <div className="company-code">{logo.company.code}</div>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${logo.is_active ? 'status-active' : 'status-inactive'}`}>
                    {logo.is_active ? '✅ 啟用' : '❌ 停用'}
                  </span>
                </td>
                <td>
                  <div className="date-info">
                    <span>📅</span>
                    {new Date(logo.createdAt).toLocaleDateString('zh-TW', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    })}
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => handleEdit(logo)}
                      className="btn-edit"
                    >
                      <span>✏️</span>
                      編輯
                    </button>
                    <button
                      onClick={() => handleDelete(logo.id)}
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
        
        {/* 無資料顯示 */}
        {logos.length === 0 && (
          <div className="no-data">
            <img src="/no-information.webp" alt="無資料" />
            <p>目前沒有 LOGO 資料</p>
          </div>
        )}
      </div>
    </div>
  )
}