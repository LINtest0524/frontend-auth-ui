'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/hooks/use-user-store'
import SunEditor from '@/components/SunEditor'
import '@/styles/pages/news-form.css'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { toTaiwanDatetimeString } from '@/lib/timeUtils'

type ArticleCategory = {
  id: number
  name: string
  slug: string
  status: string
}

export default function NewArticlePage() {
  const router = useRouter()
  const { user } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [categories, setCategories] = useState<ArticleCategory[]>([])
  
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    image_url: '',
    categoryId: '',
    status: 'DRAFT',
    is_featured: false,
    sort: 0,
    publish_date: toTaiwanDatetimeString(new Date()),
  })

  useEffect(() => {
    if (user?.companyId) {
      fetchCategories()
    }
  }, [user?.companyId])

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token')
      const url = `${process.env.NEXT_PUBLIC_API_BASE}/article-categories/company/${user?.companyId}`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        const activeCategories = data.filter((cat: ArticleCategory) => cat.status === 'ACTIVE')
        setCategories(activeCategories)
      }
    } catch (error) {
      console.error('獲取分類失敗:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              name === 'sort' || name === 'categoryId' ? parseInt(value) || 0 : value
    }))
  }

  const handleContentChange = (content: string) => {
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/articles/upload`, {
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
    if (!user?.companyId) return
    
    // 防止重複提交
    if (loading) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/articles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          companyId: user.companyId,
          categoryId: parseInt(formData.categoryId.toString()),
        }),
      })

      if (response.ok) {
        router.push('/admin/articles')
      } else {
        alert('新增失敗')
      }
    } catch (error) {
      console.error('Failed to create article:', error)
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
            <div className="loading-text">正在建立文章...</div>
          </div>
        </div>
      )}

      {/* 頁面標題區域 */}
      <div className="news-form-header">
        <h1>📝 新增文章</h1>
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
                <label htmlFor="title" className="form-label required">📝 文章標題</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className="form-input"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="請輸入文章標題"
                />
                <div className="form-hint">
                  建議標題簡潔明瞭，能夠吸引讀者注意
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="categoryId" className="form-label required">📂 文章分類</label>
                <div className="enhanced-select">
                  <select
                    id="categoryId"
                    name="categoryId"
                    className="form-select"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">請選擇分類</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-hint">
                  選擇適合的分類有助於用戶快速找到相關內容
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="summary" className="form-label required">📝 文章摘要</label>
                <textarea
                  id="summary"
                  name="summary"
                  className="form-textarea"
                  rows={3}
                  value={formData.summary}
                  onChange={handleInputChange}
                  placeholder="請輸入文章摘要，可以使用 Enter 換行"
                  required
                />
                <div className="form-hint">
                  摘要會顯示在文章列表中，建議控制在 100-200 字內
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
                <label className="form-label required">📄 文章內容</label>
                <div className="editor-container">
                  <SunEditor
                    value={formData.content}
                    onChange={handleContentChange}
                    placeholder="請輸入文章內容..."
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
                <label className="form-label">🖼️ 文章圖片</label>
                
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
                      <img src={preview} alt="文章預覽" />
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
                  建議上傳高品質的文章圖片，檔案大小不超過 5MB
                </div>
              </div>
            </div>
          </div>

          {/* 發布設定區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>📊</span>
              發布設定
            </div>
            
            <div className="form-grid">
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
                    <option value="INACTIVE">❌ 已下架</option>
                  </select>
                </div>
                <div className="status-preview">
                  <span className={`status-badge status-${formData.status.toLowerCase()}`}>
                    {formData.status === 'DRAFT' ? '📝 草稿' : 
                     formData.status === 'ACTIVE' ? '✅ 已發布' : '❌ 已下架'}
                  </span>
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

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">⏰ 發布時間</label>
                <DateTimePicker
                  value={formData.publish_date}
                  onChange={(value) => setFormData(prev => ({ ...prev, publish_date: value }))}
                  placeholder="選擇發布時間"
                  className="form-input"
                />
                <div className="form-hint">
                  設定文章的發布時間，可以預約未來發布<br />
                  <strong>⚠️ 預約發布延遲：系統每15分鐘檢查一次，實際發布時間可能延遲最多15分鐘</strong>
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
                  <label htmlFor="is_featured">設為置頂文章</label>
                </div>
                <div className="form-hint">
                  置頂文章會優先顯示在文章列表頂部
                </div>
              </div>
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="form-section">
            <div className="form-actions">
              <button
                type="button"
                onClick={() => router.push('/admin/articles')}
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
                <span>✨</span>
                {loading ? '建立中...' : '建立文章'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}