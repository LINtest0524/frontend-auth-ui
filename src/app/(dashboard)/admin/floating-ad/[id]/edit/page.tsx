'use client'

import React, { useRef, useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import '@/styles/pages/floating-ad-create.css'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'

type FloatingAd = {
  id: number
  title: string
  link_url: string
  image_url?: string
  target_blank: boolean
  position: string
  status: string
  sort: number
}

export default function FloatingAdEditPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    link_url: '',
    image_url: '',
    target_blank: true,
    position: 'bottom-right',
    status: 'ACTIVE',
    sort: 0,
  })

  const imageInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (id) {
      fetchFloatingAd()
    }
  }, [id])

  const fetchFloatingAd = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/floating-ads/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data: FloatingAd = await response.json()
        setFormData({
          title: data.title,
          link_url: data.link_url,
          image_url: data.image_url || '',
          target_blank: data.target_blank,
          position: data.position,
          status: data.status,
          sort: data.sort,
        })
        
        // 設定現有圖片預覽
        if (data.image_url) {
          setPreview(`${API_BASE}${data.image_url}`)
        }
      } else {
        alert('獲取廣告資料失敗')
        router.push('/admin/floating-ad')
      }
    } catch (error) {
      console.error('獲取廣告錯誤:', error)
      alert('獲取廣告資料失敗')
      router.push('/admin/floating-ad')
    } finally {
      setFetching(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
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

  const handleSubmit = async () => {
    if (!formData.title || !formData.link_url) {
      alert('請填寫必填欄位')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      
      // 先上傳圖片（如果有新圖片）
      let imageUrl = formData.image_url // 保持原有圖片
      if (image) {
        const imageFormData = new FormData()
        imageFormData.append('file', image)

        const uploadResponse = await fetch(`${API_BASE}/floating-ads/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: imageFormData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          imageUrl = uploadData.url
        } else {
          alert('圖片上傳失敗')
          setLoading(false)
          return
        }
      }

      // 更新廣告
      const adData = {
        ...formData,
        image_url: imageUrl,
      }

      const response = await fetch(`${API_BASE}/floating-ads/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adData),
      })

      if (response.ok) {
        alert('修改成功')
        router.push('/admin/floating-ad')
      } else {
        const errorData = await response.json()
        alert(`修改失敗: ${errorData.message || '未知錯誤'}`)
      }
    } catch (error) {
      console.error('修改錯誤:', error)
      alert('    修改失敗')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="floating-ad-create-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <span>載入廣告資料中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="floating-ad-create-container">
      {/* 頁面標題區域 */}
      <div className="floating-ad-create-header">
        <h1>🎯 編輯浮動廣告</h1>
        <div className="floating-ad-create-breadcrumb">
          <span onClick={() => router.push("/admin/floating-ad")} className="breadcrumb-link">
            🎯 浮動廣告管理
          </span>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">編輯廣告</span>
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
                    value={formData.title}
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
                    type="url"
                    name="link_url"
                    className="form-input"
                    value={formData.link_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                    required
                  />
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
              <div className="image-upload-section">
                <div className="image-upload-area">
                  <input
                    type="file"
                    id="img"
                    className="image-input"
                    ref={imageInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                  />
                  <label htmlFor="img" className="image-upload-label">
                    {preview ? (
                      <div className="image-preview-container">
                        <img
                          src={preview}
                          alt="廣告圖片預覽"
                          className="image-preview"
                        />
                        <div className="image-overlay">
                          <span className="change-image-text">
                            🔄 點擊更換圖片
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="image-upload-placeholder">
                        <div className="upload-icon">📷</div>
                        <div className="upload-text">
                          <div className="upload-title">點擊上傳廣告圖片</div>
                          <div className="upload-subtitle">支援 JPG、PNG、WEBP 格式</div>
                        </div>
                      </div>
                    )}
                  </label>
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
                    value={formData.position}
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
                    value={formData.status}
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
                      checked={formData.target_blank}
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
                    value={formData.sort}
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
                  修改中...
                </>
              ) : (
                <>
                  <span>💾</span>
                  儲存修改
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