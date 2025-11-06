'use client'

import React, { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import '@/styles/pages/floating-ad-create.css'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'

export default function FloatingAdCreatePage() {
  const router = useRouter()
  const [image, setImage] = useState<File | null>(null)
  const [form, setForm] = useState({
    title: '',
    link_url: '',
    target_blank: true,
    position: 'bottom-right',
    status: 'ACTIVE',
    sort: 0,
  })

  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const [preview, setPreview] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

  const handleFileSelect = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('只接受 JPG / PNG / WEBP 圖片')
      return
    }
    setSelectedFile(file)
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setImage(null)
    setPreview('')
    setUploading(false)
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImage(file)
    
    // 建立預覽
    const reader = new FileReader()
    reader.onload = (event) => {
      setPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const triggerImageUpload = () => {
    imageInputRef.current?.click()
  }

  const handleSubmit = async () => {
    if (!form.title || !form.link_url) {
      alert('請填寫必填欄位')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      console.log(' Token:', token ? 'exists' : 'missing')
      
      // 先上傳圖片（如果有）
      let imageUrl = ''
      if (image) {
        console.log('開始上傳圖片...')
        const imageFormData = new FormData()
        imageFormData.append('file', image)

        const uploadResponse = await fetch(`${API_BASE}/floating-ads/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: imageFormData,
        })

        console.log(' 圖片上傳回應:', uploadResponse.status)

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          imageUrl = uploadData.url
          console.log('  圖片上傳成功:', imageUrl)
        } else {
          const errorText = await uploadResponse.text()
          console.error('    圖片上傳失敗:', uploadResponse.status, errorText)
          alert(`圖片上傳失敗: ${uploadResponse.status}`)
          setLoading(false)
          return
        }
      }

      // 建立廣告
      const adData = {
        ...form,
        image_url: imageUrl,
      }

      const response = await fetch(`${API_BASE}/floating-ads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adData),
      })

      if (response.ok) {
        alert('新增成功')
        router.push('/admin/floating-ad')
      } else {
        const errorData = await response.json()
        alert(`新增失敗: ${errorData.message || '未知錯誤'}`)
      }
    } catch (error) {
      console.error('新增錯誤:', error)
      alert('    新增失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="floating-ad-create-container">
      {/* 頁面標題區域 */}
      <div className="floating-ad-create-header">
        <h1>🎯 新增浮動廣告</h1>
        <div className="floating-ad-create-breadcrumb">
          <span onClick={() => router.push("/admin/floating-ad")} className="breadcrumb-link">
            🎯 浮動廣告管理
          </span>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">新增廣告</span>
        </div>
      </div>

      {/* 表單區域 */}
      <div className="form-section">
        <div className="modern-form">
          
          {/* 基本資訊卡片 */}
          <div className="form-card">
            <div className="form-card-header">
              <span className="form-card-icon">📝</span>
              <h3>基本資訊</h3>
            </div>
            <div className="form-card-content">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="title" className="form-label">
                    <span className="label-icon">🏷️</span>
                    廣告標題
                    <span className="required">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    name="title"
                    className="form-input"
                    value={form.title}
                    onChange={handleInputChange}
                    placeholder="請輸入廣告標題"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="link_url" className="form-label">
                    <span className="label-icon">🔗</span>
                    連結網址
                    <span className="required">*</span>
                  </label>
                  <input
                    id="link_url"
                    type="text"
                    name="link_url"
                    className="form-input"
                    value={form.link_url}
                    onChange={handleInputChange}
                    placeholder="/daily-checkin"
                    required
                  />
                  <div className="form-hint">
                    <div className="hint-section">
                      <strong>🚀 動態路由支援：</strong>
                      <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                        <li><code>/daily-checkin</code> → 系統自動轉為 <code>/{'{companyCode}'}/daily-checkin</code></li>
                        <li><code>/products</code> → 系統自動轉為 <code>/{'{companyCode}'}/products</code></li>
                        <li><code>https://external.com</code> → 外部網址保持不變</li>
                      </ul>
                      <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f0f9ff', borderRadius: '4px', fontSize: '12px', color: '#1e40af' }}>
                        💡 建議使用相對路徑（如 <code>/daily-checkin</code>），系統會自動適配所有公司代碼
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 圖片上傳卡片 */}
          <div className="form-card">
            <div className="form-card-header">
              <span className="form-card-icon">🖼️</span>
              <h3>廣告圖片</h3>
            </div>
            <div className="form-card-content">
              <div className="form-group po-r">
                <label className="form-label">🖼️ 廣告圖片</label>
                
                {!preview ? (
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
                    <div className="file-upload-hint">支援 JPG、PNG、WebP 格式，建議尺寸 300x300 像素</div>
                  </div>
                ) : (
                  <div className="image-preview-container">
                    <div className="image-preview">
                      <img src={preview} alt="廣告圖片預覽" />
                      <div className="image-info">
                        📄 {selectedFile?.name} ({((selectedFile?.size || 0) / 1024).toFixed(1)} KB)
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
                          onClick={() => imageInputRef.current?.click()}
                          disabled={uploading}
                        >
                          🔄 更換圖片
                        </button>
                        <button
                          type="button"
                          className="btn-remove-image"
                          onClick={handleRemoveImage}
                          disabled={uploading}
                        >
                          🗑️ 移除圖片
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 隱藏的檔案輸入元素 */}
                <input
                  type="file"
                  ref={imageInputRef}
                  className="file-input-hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file)
                  }}
                />
                
                <div className="form-hint">
                  建議上傳高品質的廣告圖片，檔案大小不超過 5MB
                </div>
              </div>
            </div>
          </div>

          {/* 顯示設定卡片 */}
          <div className="form-card">
            <div className="form-card-header">
              <span className="form-card-icon">⚙️</span>
              <h3>顯示設定</h3>
            </div>
            <div className="form-card-content">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="position" className="form-label">
                    <span className="label-icon">📍</span>
                    顯示位置
                  </label>
                  <select
                    id="position"
                    name="position"
                    className="form-select"
                    value={form.position}
                    onChange={handleInputChange}
                  >
                    <option value="top-right">右上角</option>
                    <option value="bottom-right">右下角</option>
                    <option value="top-left">左上角</option>
                    <option value="bottom-left">左下角</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="status" className="form-label">
                    <span className="label-icon">⚡</span>
                    狀態
                  </label>
                  <select
                    id="status"
                    name="status"
                    className="form-select"
                    value={form.status}
                    onChange={handleInputChange}
                  >
                    <option value="ACTIVE">啟用</option>
                    <option value="INACTIVE">停用</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">🚀</span>
                    開啟方式
                  </label>
                  <div className="form-checkbox-group">
                    <input
                      type="checkbox"
                      id="target_blank"
                      name="target_blank"
                      className="form-checkbox"
                      checked={form.target_blank}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="target_blank" className="checkbox-label">
                      在新視窗開啟連結
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="sort" className="form-label">
                    <span className="label-icon">🔢</span>
                    排序
                  </label>
                  <input
                    id="sort"
                    type="number"
                    name="sort"
                    className="form-input"
                    value={form.sort}
                    onChange={handleInputChange}
                    placeholder="數字越小越前面"
                    min="0"
                  />
                  <div className="form-hint">
                    💡 設定廣告顯示的優先順序
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="btn-submit"
            >
              {loading ? (
                <>
                  <span className="loading-spinner">⏳</span>
                  新增中...
                </>
              ) : (
                <>
                  <span>💾</span>
                  儲存廣告
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/floating-ad")}
              className="floating-ad-cancel-btn"
            >
              <span>❌</span>
              取消
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}