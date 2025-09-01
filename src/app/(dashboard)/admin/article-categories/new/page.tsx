'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/hooks/use-user-store'
import '@/styles/pages/news-form.css'

export default function NewArticleCategoryPage() {
  const router = useRouter()
  const { user } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    status: 'ACTIVE',
    sort: 0,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sort' ? parseInt(value) || 0 : value
    }))

    // 自動生成 slug
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.companyId) {
      alert('無法獲取公司資訊')
      return
    }

    if (!formData.name.trim() || !formData.slug.trim()) {
      alert('請填寫必要欄位')
      return
    }

    // 防止重複提交
    if (loading) return

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/article-categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          companyId: user.companyId,
        }),
      })

      if (response.ok) {
        router.push('/admin/article-categories')
      } else {
        const errorData = await response.json()
        alert(`新增失敗: ${errorData.message || '未知錯誤'}`)
      }
    } catch (error) {
      console.error('新增分類錯誤:', error)
      alert('新增失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="news-form-container">
      {/* 載入遮罩 */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">正在建立分類...</div>
          </div>
        </div>
      )}

      {/* 頁面標題區域 */}
      <div className="news-form-header">
        <h1>📂 新增文章分類</h1>
      </div>

      {/* 表單內容 */}
      <div className="news-form-content">
        <form onSubmit={handleSubmit}>
          {/* 基本資訊區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>📋</span>
              基本資訊
            </div>
            
            <div className="form-grid single-column">
              <div className="form-group">
                <label htmlFor="name" className="form-label required">📂 分類名稱</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="請輸入分類名稱"
                />
                <div className="form-hint">
                  分類名稱將顯示在文章管理和前台頁面中
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="slug" className="form-label required">🔗 分類代碼</label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  className="form-input"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                  placeholder="請輸入分類代碼（用於 URL）"
                />
                <div className="form-hint">
                  將用於 URL 路徑，建議使用英文或數字，會自動根據分類名稱生成
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description" className="form-label">📝 分類描述</label>
                <textarea
                  id="description"
                  name="description"
                  className="form-textarea"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="請輸入分類描述（選填）"
                />
                <div className="form-hint">
                  描述會顯示在分類頁面中，幫助用戶了解此分類的內容
                </div>
              </div>
            </div>
          </div>

          {/* 設定區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>⚙️</span>
              分類設定
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="status" className="form-label">📊 分類狀態</label>
                <div className="enhanced-select">
                  <select
                    id="status"
                    name="status"
                    className="form-select"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="ACTIVE">✅ 啟用</option>
                    <option value="INACTIVE">❌ 停用</option>
                  </select>
                </div>
                <div className="status-preview">
                  <span className={`status-badge status-${formData.status.toLowerCase()}`}>
                    {formData.status === 'ACTIVE' ? '✅ 啟用' : '❌ 停用'}
                  </span>
                </div>
                <div className="form-hint">
                  停用的分類將不會顯示在前台頁面中
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="sort" className="form-label">🔢 排序順序</label>
                <input
                  type="number"
                  id="sort"
                  name="sort"
                  className="form-input"
                  value={formData.sort}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                />
                <div className="form-hint">
                  數字越小排序越前面，相同數字按建立時間排序
                </div>
              </div>
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="form-section">
            <div className="form-actions">
              <button
                type="button"
                onClick={() => router.push('/admin/article-categories')}
                className="btn-secondary"
                disabled={loading}
              >
                <span>↩️</span>
                返回列表
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                <span>✨</span>
                {loading ? '建立中...' : '建立分類'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}