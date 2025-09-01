'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import '@/styles/pages/banner-form.css'

const API_BASE = 'http://localhost:3001'

export default function EditBannerPage() {
  const { id } = useParams()
  const router = useRouter()

  const [form, setForm] = useState({
    title: '',
    sort: 0,
    start_time: '',
    end_time: '',
    status: 'ACTIVE',
    desktop_image_url: '',
    mobile_image_url: '',
  })

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [desktopFile, setDesktopFile] = useState<File | null>(null)
  const [mobileFile, setMobileFile] = useState<File | null>(null)

  const getImageUrl = (url: string) => {
    if (!url) return ''
    return url.startsWith('http') ? url : `${API_BASE}${url}`
  }

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_BASE}/banners/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setForm({
          ...data,
          sort: Number(data.sort),
          start_time: data.start_time.slice(0, 16),
          end_time: data.end_time.slice(0, 16),
        })
      } catch (err) {
        alert('載入失敗')
      } finally {
        setLoading(false)
      }
    }

    fetchBanner()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      alert('請輸入標題')
      return
    }

    try {
      setSubmitting(true)
      const token = localStorage.getItem('token')

      // 如果有圖片要上傳，先處理
      const upload = async (file: File) => {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch(`${API_BASE}/banners/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        })
        const result = await res.json()
        return result.url
      }

      let desktopUrl = form.desktop_image_url
      let mobileUrl = form.mobile_image_url

      if (desktopFile) desktopUrl = await upload(desktopFile)
      if (mobileFile) mobileUrl = await upload(mobileFile)

      const res = await fetch(`${API_BASE}/banners/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          sort: Number(form.sort),
          desktop_image_url: desktopUrl,
          mobile_image_url: mobileUrl,
          start_time: new Date(form.start_time).toISOString(),
          end_time: new Date(form.end_time).toISOString(),
        }),
      })

      if (!res.ok) throw new Error('更新失敗')

      alert('更新成功')
      router.push('/admin/banner')
    } catch (err: any) {
      alert(`更新失敗：${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="banner-form-container">
        <div className="loading-spinner">
          <div>⏳ 載入中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="banner-form-container">
      {/* 頁面標題區域 */}
      <div className="banner-form-header">
        <h1>✏️ 編輯 Banner</h1>
      </div>

      {/* 表單內容 */}
      <div className="banner-form-content">
        {/* 基本設定區塊 */}
        <div className="form-section">
          <div className="section-title">
            <span>📋</span>
            基本設定
          </div>
          
          <div className="form-grid single-column">
            <div className="form-group">
              <label htmlFor="title" className="form-label required">📝 Banner 標題</label>
              <input
                type="text"
                id="title"
                name="title"
                className="form-input"
                value={form.title}
                onChange={handleChange}
                placeholder="請輸入 Banner 標題"
                required
              />
              <div className="form-hint">
                此標題用於後台管理識別，不會在前台顯示
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="sort" className="form-label">🔢 顯示排序</label>
              <div className="sort-input-group">
                <input
                  type="number"
                  id="sort"
                  name="sort"
                  className="form-input"
                  value={form.sort === 0 ? '' : form.sort}
                  onChange={handleChange}
                  placeholder="請輸入排序數字"
                  min="0"
                />
                <div className="form-hint">
                  數字越大排序越前面，相同數字按建立時間排序
                </div>
                {form.sort > 0 && (
                  <div className="sort-preview">
                    📊 排序權重：{form.sort}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 時間設定區塊 */}
        <div className="form-section">
          <div className="section-title">
            <span>⏰</span>
            顯示時間設定
          </div>
          
          <div className="form-grid single-column">
            <div className="form-group">
              <label className="form-label">📅 顯示時間範圍</label>
              <div className="datetime-range">
                <input
                  type="datetime-local"
                  name="start_time"
                  value={form.start_time}
                  onChange={handleChange}
                  className="form-input datetime-input"
                />
                <span className="datetime-separator">至</span>
                <input
                  type="datetime-local"
                  name="end_time"
                  value={form.end_time}
                  onChange={handleChange}
                  className="form-input datetime-input"
                />
              </div>
              <div className="form-hint">
                設定 Banner 的顯示時間範圍，超出時間範圍將自動隱藏
              </div>
            </div>
          </div>
        </div>

        {/* 狀態設定區塊 */}
        <div className="form-section">
          <div className="section-title">
            <span>📊</span>
            狀態設定
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="status" className="form-label">📊 顯示狀態</label>
              <div className="enhanced-select">
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="ACTIVE">啟用</option>
                  <option value="INACTIVE">停用</option>
                </select>
              </div>
              <div className="form-hint">
                停用的 Banner 不會在前台顯示
              </div>
              <div className="status-selector">
                <div className={`status-option ${form.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                  {form.status === 'ACTIVE' ? '✅ 啟用狀態' : '❌ 停用狀態'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 圖片設定區塊 */}
        <div className="form-section">
          <div className="section-title">
            <span>🖼️</span>
            圖片設定
          </div>
          
          <div className="file-upload-group">
            {/* 桌面版圖片 */}
            <div className={`file-upload-section ${desktopFile ? 'has-file' : ''}`}>
              <div className="form-group">
                <label className="form-label">🖥️ 桌面版圖片</label>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setDesktopFile(e.target.files?.[0] || null)}
                    className="file-input"
                  />
                  <button type="button" className="file-input-button">
                    📁 選擇桌面版圖片
                  </button>
                </div>
                {desktopFile && (
                  <div className="file-info">
                    📄 已選擇：{desktopFile.name} ({(desktopFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
                <div className="form-hint">
                  建議尺寸：1920x600px，支援 JPG、PNG、WebP 格式
                </div>
              </div>
              
              {form.desktop_image_url && (
                <div className="image-preview">
                  <div className="image-preview-label">🖥️ 當前桌面版圖片預覽</div>
                  <img
                    src={getImageUrl(form.desktop_image_url)}
                    alt="桌面版 Banner"
                    className="preview-image"
                  />
                  <div className="image-info">點擊圖片可放大查看</div>
                </div>
              )}
            </div>

            {/* 手機版圖片 */}
            <div className={`file-upload-section ${mobileFile ? 'has-file' : ''}`}>
              <div className="form-group">
                <label className="form-label">📱 手機版圖片</label>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setMobileFile(e.target.files?.[0] || null)}
                    className="file-input"
                  />
                  <button type="button" className="file-input-button">
                    📁 選擇手機版圖片
                  </button>
                </div>
                {mobileFile && (
                  <div className="file-info">
                    📄 已選擇：{mobileFile.name} ({(mobileFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
                <div className="form-hint">
                  建議尺寸：750x400px，支援 JPG、PNG、WebP 格式
                </div>
              </div>
              
              {form.mobile_image_url && (
                <div className="image-preview">
                  <div className="image-preview-label">📱 當前手機版圖片預覽</div>
                  <img
                    src={getImageUrl(form.mobile_image_url)}
                    alt="手機版 Banner"
                    className="preview-image"
                  />
                  <div className="image-info">點擊圖片可放大查看</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="form-section">
          <div className="form-actions">
            <button
              type="button"
              onClick={() => router.push('/admin/banner')}
              className="btn-secondary"
              disabled={submitting}
            >
              <span>↩️</span>
              返回列表
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary"
            >
              <span>💾</span>
              {submitting ? '更新中...' : '更新 Banner'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}