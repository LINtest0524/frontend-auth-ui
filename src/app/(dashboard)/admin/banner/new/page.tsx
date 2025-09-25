'use client'

import React, { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import '@/styles/pages/banner-form.css'

const API_BASE = 'http://localhost:3001'
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function BannerPage() {
  const router = useRouter()
  const [desktopImage, setDesktopImage] = useState<File | null>(null)
  const [mobileImage, setMobileImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    start_time: '',
    end_time: '',
    sort: 0,
    status: 'ACTIVE',
  })

  const desktopInputRef = useRef<HTMLInputElement | null>(null)
  const mobileInputRef = useRef<HTMLInputElement | null>(null)

  const [preview, setPreview] = useState({
    desktop: '',
    mobile: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleUpload = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${API_BASE}/banners/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    })
    const data = await res.json()

    //   回傳相對路徑就好，不要加 API_BASE
    return data.url
  }

  const handleFileSelect = (file: File, type: 'desktop' | 'mobile') => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('只接受 JPG / PNG / WEBP 圖片')
      return
    }
    
    if (type === 'desktop') {
      setDesktopImage(file)
      setPreview(prev => ({ ...prev, desktop: URL.createObjectURL(file) }))
    } else {
      setMobileImage(file)
      setPreview(prev => ({ ...prev, mobile: URL.createObjectURL(file) }))
    }
  }

  const handleRemoveImage = (type: 'desktop' | 'mobile') => {
    if (type === 'desktop') {
      setDesktopImage(null)
      setPreview(prev => ({ ...prev, desktop: '' }))
      if (desktopInputRef.current) desktopInputRef.current.value = ''
    } else {
      setMobileImage(null)
      setPreview(prev => ({ ...prev, mobile: '' }))
      if (mobileInputRef.current) mobileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!desktopImage || !mobileImage) {
      alert('請選擇桌機與手機圖片')
      return
    }

    setLoading(true)
    try {
      const desktopUrl = await handleUpload(desktopImage)
      const mobileUrl = await handleUpload(mobileImage)

      const payload = {
        ...form,
        sort: Number(form.sort),
        desktop_image_url: desktopUrl,
        mobile_image_url: mobileUrl,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        company: { id: 1 },
      }

      const res = await fetch(`${API_BASE}/banners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(err || '送出失敗')
      }

      alert('新增成功！')
      router.push('/admin/banner')
    } catch (err: any) {
      alert(`新增失敗：${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="banner-form-container">
      {/* 頁面標題區域 */}
      <div className="banner-form-header">
        <h1>🖼️ 新增 Banner</h1>
      </div>

      {/* 表單內容 */}
      <div className="banner-form-content">
        <form onSubmit={handleSubmit}>
          {/* 基本設定區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>📋</span>
              基本設定
            </div>
            
            <div className="form-grid single-column">
              <div className="form-group">
                <label htmlFor="title" className="form-label required">📋 Banner 標題</label>
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
                  為您的 Banner 設定一個容易識別的標題
                </div>
              </div>
            </div>

            <div className="form-grid two-column">
              <div className="form-group">
                <label className="form-label required">📊 狀態</label>
                <select
                  name="status"
                  className="form-select"
                  value={form.status}
                  onChange={handleChange}
                  required
                >
                  <option value="ACTIVE">啟用</option>
                  <option value="INACTIVE">停用</option>
                </select>
                <div className="status-preview">
                  <span className={`status-badge ${form.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}>
                    {form.status === 'ACTIVE' ? '✅ 啟用' : '❌ 停用'}
                  </span>
                </div>
                <div className="form-hint">
                  停用的 Banner 不會在前台顯示
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="sort" className="form-label">🔢 排序</label>
                <input
                  type="number"
                  id="sort"
                  name="sort"
                  className="form-input"
                  value={form.sort === 0 ? '' : form.sort}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                />
                <div className="sort-preview">
                  💡 數字越大排序越前面，相同位置的 Banner 會依此排序
                </div>
              </div>
            </div>
          </div>

          {/* 時間設定區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>⏰</span>
              時間設定
            </div>
            
            <div className="form-grid single-column">
              <div className="form-group">
                <label className="form-label required">⏰ 活動時間</label>
                <div className="datetime-range">
                  <input
                    type="datetime-local"
                    name="start_time"
                    className="form-input datetime-input"
                    value={form.start_time}
                    onChange={handleChange}
                    required
                  />
                  <span className="datetime-separator">到</span>
                  <input
                    type="datetime-local"
                    name="end_time"
                    className="form-input datetime-input"
                    value={form.end_time}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-hint">
                  設定 Banner 的顯示時間範圍，超出時間範圍將不會顯示
                </div>
              </div>
            </div>
          </div>

          {/* 桌面圖片區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>🖥️</span>
              桌面圖片
            </div>
            
            <div className="form-grid single-column">
              <div className="form-group po-r">
                <label className="form-label required">🖥️ 桌面版圖片</label>
                
                {!preview.desktop ? (
                  <div 
                    className="file-upload-area"
                    onClick={() => desktopInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.add('dragover')
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('dragover')
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.remove('dragover')
                      const file = e.dataTransfer.files[0]
                      if (file) handleFileSelect(file, 'desktop')
                    }}
                  >
                    <div className="file-upload-icon">📁</div>
                    <div className="file-upload-text">點擊選擇桌面圖片或拖拽到此處</div>
                    <div className="file-upload-hint">支援 JPG、PNG、WEBP 格式，建議尺寸 1920x600 像素</div>
                  </div>
                ) : (
                  <div className="image-preview-container">
                    <div className="image-preview">
                      <img src={preview.desktop} alt="桌面預覽" />
                      <div className="image-info">
                        📄 {desktopImage?.name} ({((desktopImage?.size || 0) / 1024).toFixed(1)} KB)
                      </div>
                      {uploading && (
                        <div className="upload-status">
                          ⏳ 上傳中...
                        </div>
                      )}
                      <div className="image-actions">
                        <button
                          type="button"
                          className="btn-change-image"
                          onClick={() => desktopInputRef.current?.click()}
                          disabled={uploading}
                        >
                          🔄 更換圖片
                        </button>
                        <button
                          type="button"
                          className="btn-remove-image"
                          onClick={() => handleRemoveImage('desktop')}
                          disabled={uploading}
                        >
                          🗑️ 移除圖片
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <input
                  type="file"
                  ref={desktopInputRef}
                  className="file-input-hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file, 'desktop')
                  }}
                  required
                />
                
                <div className="form-hint">
                  建議尺寸：1920x600px，檔案大小不超過 5MB
                </div>
              </div>
            </div>
          </div>

          {/* 手機圖片區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>📱</span>
              手機圖片
            </div>
            
            <div className="form-grid single-column">
              <div className="form-group po-r">
                <label className="form-label required">📱 手機版圖片</label>
                
                {!preview.mobile ? (
                  <div 
                    className="file-upload-area"
                    onClick={() => mobileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.add('dragover')
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('dragover')
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.remove('dragover')
                      const file = e.dataTransfer.files[0]
                      if (file) handleFileSelect(file, 'mobile')
                    }}
                  >
                    <div className="file-upload-icon">📁</div>
                    <div className="file-upload-text">點擊選擇手機圖片或拖拽到此處</div>
                    <div className="file-upload-hint">支援 JPG、PNG、WEBP 格式，建議尺寸 750x400 像素</div>
                  </div>
                ) : (
                  <div className="image-preview-container">
                    <div className="image-preview">
                      <img src={preview.mobile} alt="手機預覽" />
                      <div className="image-info">
                        📄 {mobileImage?.name} ({((mobileImage?.size || 0) / 1024).toFixed(1)} KB)
                      </div>
                      {uploading && (
                        <div className="upload-status">
                          ⏳ 上傳中...
                        </div>
                      )}
                      <div className="image-actions">
                        <button
                          type="button"
                          className="btn-change-image"
                          onClick={() => mobileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          🔄 更換圖片
                        </button>
                        <button
                          type="button"
                          className="btn-remove-image"
                          onClick={() => handleRemoveImage('mobile')}
                          disabled={uploading}
                        >
                          🗑️ 移除圖片
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <input
                  type="file"
                  ref={mobileInputRef}
                  className="file-input-hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file, 'mobile')
                  }}
                  required
                />
                
                <div className="form-hint">
                  建議尺寸：750x400px，檔案大小不超過 5MB
                </div>
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
                disabled={loading || uploading}
              >
                <span>↩️</span>
                返回
              </button>
              <button
                type="submit"
                disabled={loading || uploading}
                className="btn-primary"
              >
                <span>💾</span>
                {loading ? '建立中...' : uploading ? '上傳中...' : '建立 Banner'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}