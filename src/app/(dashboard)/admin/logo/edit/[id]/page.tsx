'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import '@/styles/pages/logo-form.css'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

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

export default function LogoEditPage() {
  const router = useRouter()
  const params = useParams()
  const logoId = params.id as string
  
  const [title, setTitle] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [preview, setPreview] = useState('')

  const imageInputRef = useRef<HTMLInputElement | null>(null)

  const fetchLogo = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/logo/${logoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const logo: Logo = await response.json()
        setTitle(logo.title)
        setCurrentImageUrl(logo.image_url)
        setIsActive(logo.is_active)
      } else {
        alert('無法載入 LOGO 資料')
        router.push('/admin/logo')
      }
    } catch (error) {
      // 載入LOGO資料失敗，靜默處理
      alert('載入LOGO資料失敗，請稍後再試')
      alert('載入失敗')
      router.push('/admin/logo')
    } finally {
      setFetchLoading(false)
    }
  }

  useEffect(() => {
    if (logoId) {
      fetchLogo()
    }
  }, [logoId])

  const handleUpload = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const token = localStorage.getItem('token')
    
    const res = await fetch(`${API_BASE}/logo/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
    
    if (!res.ok) {
      throw new Error('圖片上傳失敗')
    }
    
    const data = await res.json()
    return data.path
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return alert('請輸入 LOGO 標題')

    try {
      setLoading(true)

      let imageUrl = currentImageUrl
      
      // 如果有新圖片，先上傳
      if (image) {
        imageUrl = await handleUpload(image)
      }

      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/logo/${logoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          image_url: imageUrl,
          is_active: isActive,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`伺服器錯誤：${res.status} - ${errText}`)
      }

      alert('更新成功！')
      router.push('/admin/logo')
    } catch (err: any) {
      alert('更新失敗：' + err.message)
      // 更新LOGO失敗，靜默處理
      alert('更新LOGO失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('只接受 JPG / PNG / WEBP / GIF 圖片')
      return
    }
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleRemoveImage = () => {
    setImage(null)
    setPreview('')
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  const handleKeepCurrentImage = () => {
    setImage(null)
    setPreview('')
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  if (fetchLoading) {
    return (
      <div className="logo-form-container">
        <div className="loading-spinner">
          <div>⏳ 載入中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="logo-form-container">
      {/* 頁面標題區域 */}
      <div className="logo-form-header">
        <h1>✏️ 編輯 LOGO</h1>
      </div>

      {/* 表單內容 */}
      <div className="logo-form-content">
        <form onSubmit={handleSubmit}>
          {/* 基本設定區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>📋</span>
              基本設定
            </div>
            
            <div className="form-grid single-column">
              <div className="form-group">
                <label htmlFor="title" className="form-label required">📋 LOGO 標題</label>
                <input
                  type="text"
                  id="title"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="請輸入 LOGO 標題"
                  required
                />
                <div className="form-hint">
                  為您的 LOGO 設定一個容易識別的標題
                </div>
              </div>
            </div>
          </div>

          {/* 圖片管理區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>🖼️</span>
              圖片管理
            </div>
            
            <div className="form-grid single-column">
              <div className="form-group po-r">
                <label className="form-label">🖼️ LOGO 圖片</label>
                
                {/* 目前圖片顯示 */}
                {currentImageUrl && !preview && (
                  <div className="image-preview-container">
                    <div className="image-preview">
                      <div style={{ marginBottom: '12px', color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                        📷 目前的 LOGO
                      </div>
                      <img 
                        src={`${API_BASE}${currentImageUrl}`} 
                        alt="目前 LOGO" 
                      />
                      <div className="image-actions">
                        <button
                          type="button"
                          className="btn-change-image"
                          onClick={() => imageInputRef.current?.click()}
                        >
                          🔄 更換圖片
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 新圖片預覽 */}
                {preview && (
                  <div className="image-preview-container">
                    <div className="image-preview">
                      <div style={{ marginBottom: '12px', color: '#059669', fontSize: '14px', fontWeight: '500' }}>
                        ✨ 新的 LOGO 預覽
                      </div>
                      <img src={preview} alt="新 LOGO 預覽" />
                      <div className="image-info">
                        📄 {image?.name} ({((image?.size || 0) / 1024).toFixed(1)} KB)
                      </div>
                      <div className="image-actions">
                        <button
                          type="button"
                          className="btn-change-image"
                          onClick={() => imageInputRef.current?.click()}
                        >
                          🔄 更換圖片
                        </button>
                        <button
                          type="button"
                          className="btn-remove-image"
                          onClick={handleKeepCurrentImage}
                        >
                          ↩️ 保持原圖
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 上傳區域 (當沒有目前圖片時) */}
                {!currentImageUrl && !preview && (
                  <div 
                    className="file-upload-area"
                    onClick={() => imageInputRef.current?.click()}
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
                      if (file) handleFileSelect(file)
                    }}
                  >
                    <div className="file-upload-icon">📁</div>
                    <div className="file-upload-text">點擊選擇圖片或拖拽到此處</div>
                    <div className="file-upload-hint">支援 JPG、PNG、WEBP、GIF 格式</div>
                  </div>
                )}

                <input
                  type="file"
                  ref={imageInputRef}
                  className="file-input-hidden"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file)
                  }}
                />
                
                <div className="form-hint">
                  {currentImageUrl 
                    ? '如不選擇新圖片，將保持原有圖片。建議上傳高品質的 LOGO 圖片，檔案大小不超過 5MB'
                    : '建議上傳高品質的 LOGO 圖片，檔案大小不超過 5MB'
                  }
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
            
            <div className="form-grid single-column">
              <div className="form-group">
                <label className="form-label">📊 LOGO 狀態</label>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <label htmlFor="isActive">啟用 LOGO</label>
                </div>
                <div className="status-preview">
                  <span className={`status-badge ${isActive ? 'status-active' : 'status-inactive'}`}>
                    {isActive ? '✅ 啟用' : '❌ 停用'}
                  </span>
                </div>
                <div className="form-hint">
                  停用的 LOGO 不會在前台顯示
                </div>
              </div>
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="form-section">
            <div className="form-actions">
              <button
                type="button"
                onClick={() => router.push('/admin/logo')}
                className="btn-secondary"
                disabled={loading}
              >
                <span>↩️</span>
                返回
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                <span>💾</span>
                {loading ? '更新中...' : '更新 LOGO'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}