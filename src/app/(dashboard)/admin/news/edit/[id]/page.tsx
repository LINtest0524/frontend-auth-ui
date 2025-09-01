'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUserStore } from '@/hooks/use-user-store'
import SunEditor from '@/components/SunEditor'
import '@/styles/pages/news-form.css'

type NewsDetail = {
  id: number
  title: string
  summary: string
  content: string
  image_url?: string
  category: string
  status: string
  is_featured: boolean
  publish_date: string
}

export default function EditNewsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [preview, setPreview] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const newsId = params.id
  
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    image_url: '',
    category: 'GENERAL',
    status: 'DRAFT',
    is_featured: false,
    publish_date: '',
  })

  useEffect(() => {
    if (!newsId) return

    const fetchNews = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/news/${newsId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const news: NewsDetail = await response.json()
          setFormData({
            title: news.title,
            summary: news.summary,
            content: news.content,
            image_url: news.image_url || '',
            category: news.category,
            status: news.status,
            is_featured: news.is_featured,
            publish_date: (() => {
              const date = new Date(news.publish_date);
              // 加8小時轉換為台灣時間
              const taiwanTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
              return taiwanTime.toISOString().slice(0, 16);
            })(),
          })
          
          // 如果有現有圖片，設定預覽
          if (news.image_url) {
            setPreview(`${process.env.NEXT_PUBLIC_API_BASE}${news.image_url}`)
          }
        } else {
          alert('無法載入新聞資料')
          router.push('/admin/news')
        }
      } catch (error) {
        console.error('Failed to fetch news:', error)
        alert('載入失敗')
        router.push('/admin/news')
      } finally {
        setFetchLoading(false)
      }
    }

    fetchNews()
  }, [newsId, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, summary: e.target.value }))
  }

  const handleEditorChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }))
  }

  const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

  const handleFileSelect = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('只接受 JPG / PNG / WEBP 圖片')
      return
    }
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
    
    // 自動上傳
    handleImageUpload(file)
  }

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    try {
      const token = localStorage.getItem('token')
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/news/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: uploadFormData,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({ ...prev, image_url: data.url }))
      } else {
        alert('圖片上傳失敗')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('圖片上傳失敗')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setPreview('')
    setFormData(prev => ({ ...prev, image_url: '' }))
    setUploading(false)
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 防止重複提交
    if (loading) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/news/${newsId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/admin/news')
      } else {
        alert('更新失敗')
      }
    } catch (error) {
      console.error('Failed to update news:', error)
      alert('更新失敗')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="news-form-container">
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">載入新聞資料中...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="news-form-container">
      {/* 載入遮罩 */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">正在更新新聞...</div>
          </div>
        </div>
      )}

      {/* 頁面標題區域 */}
      <div className="news-form-header">
        <h1>✏️ 編輯最新消息</h1>
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
                <label htmlFor="title" className="form-label required">📰 新聞標題</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className="form-input"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="請輸入新聞標題"
                />
                <div className="form-hint">
                  建議標題簡潔明瞭，能夠吸引讀者注意
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="summary" className="form-label required">📝 新聞摘要</label>
                <textarea
                  id="summary"
                  name="summary"
                  className="form-textarea"
                  rows={3}
                  value={formData.summary}
                  onChange={handleSummaryChange}
                  placeholder="請輸入新聞摘要，可以使用 Enter 換行"
                  required
                />
                <div className="form-hint">
                  摘要會顯示在新聞列表中，建議控制在 100-200 字內
                </div>
              </div>
            </div>
          </div>

          {/* 內容編輯區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>✏️</span>
              內容編輯
            </div>
            
            <div className="form-grid single-column">
              <div className="form-group">
                <label className="form-label required">📄 新聞內容</label>
                <div className="editor-container">
                  <SunEditor
                    value={formData.content}
                    onChange={handleEditorChange}
                    placeholder="請輸入新聞內容..."
                    height="400px"
                  />
                </div>
                <div className="form-hint">
                  支援豐富的格式化功能、圖片上傳、表格、程式碼等
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
            
            <div className="form-grid single-column">
              <div className="form-group po-r">
                <label className="form-label">🖼️ 新聞圖片</label>
                
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
                    <div className="file-upload-hint">支援 JPG、PNG、WebP 格式，建議尺寸 1200x630 像素</div>
                  </div>
                ) : (
                  <div className="image-preview-container">
                    <div className="image-preview">
                      <img src={preview} alt="新聞預覽" />
                      <div className="image-info">
                        📄 {selectedFile?.name || '現有圖片'} {selectedFile && `(${((selectedFile?.size || 0) / 1024).toFixed(1)} KB)`}
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
                  建議上傳高品質的新聞圖片，檔案大小不超過 5MB
                </div>
              </div>
            </div>
          </div>

          {/* 分類與狀態區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>📊</span>
              分類與狀態
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="category" className="form-label">📂 新聞分類</label>
                <div className="enhanced-select">
                  <select
                    id="category"
                    name="category"
                    className="form-select"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="GENERAL">📰 一般消息</option>
                    <option value="ANNOUNCEMENT">📢 重要公告</option>
                    <option value="PROMOTION">🎉 優惠活動</option>
                    <option value="UPDATE">🔄 系統更新</option>
                  </select>
                </div>
                <div className="form-hint">
                  選擇適合的分類有助於用戶快速找到相關內容
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="status" className="form-label">📊 發布狀態</label>
                <div className="enhanced-select">
                  <select
                    id="status"
                    name="status"
                    className="form-select"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="DRAFT">📝 草稿</option>
                    <option value="ACTIVE">✅ 已發布</option>
                    <option value="INACTIVE">❌ 未發布</option>
                  </select>
                </div>
                <div className="status-preview">
                  <span className={`status-badge status-${formData.status.toLowerCase()}`}>
                    {formData.status === 'DRAFT' ? '📝 草稿' : 
                     formData.status === 'ACTIVE' ? '✅ 已發布' : '❌ 未發布'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 發布設定區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>⏰</span>
              發布設定
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="publish_date" className="form-label">⏰ 發布時間</label>
                <input
                  type="datetime-local"
                  id="publish_date"
                  name="publish_date"
                  className="form-input"
                  value={formData.publish_date}
                  onChange={handleInputChange}
                />
                <div className="form-hint">
                  設定新聞的發布時間，可以預約未來發布
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">📌 特殊設定</label>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="is_featured"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="is_featured">設為置頂新聞</label>
                </div>
                <div className="form-hint">
                  置頂新聞會優先顯示在新聞列表頂部
                </div>
              </div>
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="form-section">
            <div className="form-actions">
              <button
                type="button"
                onClick={() => router.push('/admin/news')}
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
                {loading ? '更新中...' : '更新新聞'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}