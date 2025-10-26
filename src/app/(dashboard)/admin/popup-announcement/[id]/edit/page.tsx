'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { toTaiwanDatetimeString, fromDatetimeLocalToTaiwan } from '@/lib/timeUtils'
import '@/styles/pages/popup-announcement-create.css'

type PopupAnnouncement = {
  id: number
  title: string
  desktop_image_url?: string
  mobile_image_url?: string
  button_text?: string
  button_url?: string
  sort_order: number
  status: string
  start_date?: string
  end_date?: string
  company_code: string
}

// 使用統一的時間工具模組
const formatDateTimeLocal = (dateString: string): string => {
  return toTaiwanDatetimeString(dateString)
}

export default function EditPopupAnnouncementPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [formData, setFormData] = useState({
    title: '',
    desktop_image_url: '',
    mobile_image_url: '',
    button_text: '',
    button_url: '',
    sort_order: 0,
    status: 'active',
    start_date: '',
    end_date: '',
    company_code: 'a'
  })
  const [desktopImageFile, setDesktopImageFile] = useState<File | null>(null)
  const [mobileImageFile, setMobileImageFile] = useState<File | null>(null)
  const [desktopPreview, setDesktopPreview] = useState<string>('')
  const [mobilePreview, setMobilePreview] = useState<string>('')
  const [desktopSelectedFile, setDesktopSelectedFile] = useState<File | null>(null)
  const [mobileSelectedFile, setMobileSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const desktopInputRef = useRef<HTMLInputElement | null>(null)
  const mobileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (id) {
      fetchAnnouncement()
    }
  }, [id])

  const fetchAnnouncement = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/popup-announcements/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data: PopupAnnouncement = await response.json()
        setFormData({
          title: data.title,
          desktop_image_url: data.desktop_image_url || '',
          mobile_image_url: data.mobile_image_url || '',
          button_text: data.button_text || '',
          button_url: data.button_url || '',
          sort_order: data.sort_order,
          status: data.status,
          start_date: data.start_date ? formatDateTimeLocal(data.start_date) : '',
          end_date: data.end_date ? formatDateTimeLocal(data.end_date) : '',
          company_code: data.company_code
        })

        // 設置現有圖片預覽
        if (data.desktop_image_url) {
          setDesktopPreview(`${process.env.NEXT_PUBLIC_API_BASE}${data.desktop_image_url}`)
        }
        if (data.mobile_image_url) {
          setMobilePreview(`${process.env.NEXT_PUBLIC_API_BASE}${data.mobile_image_url}`)
        }
      } else {
        alert('獲取彈窗公告失敗')
        router.push('/admin/popup-announcement')
      }
    } catch (error) {
      console.error('獲取彈窗公告錯誤:', error)
      router.push('/admin/popup-announcement')
    } finally {
      setInitialLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sort_order' ? parseInt(value) || 0 : value
    }))
  }

  const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

  const handleDesktopFileSelect = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('只接受 JPG / PNG / WEBP 圖片')
      return
    }
    setDesktopSelectedFile(file)
    setDesktopImageFile(file)
    setDesktopPreview(URL.createObjectURL(file))
  }

  const handleMobileFileSelect = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('只接受 JPG / PNG / WEBP 圖片')
      return
    }
    setMobileSelectedFile(file)
    setMobileImageFile(file)
    setMobilePreview(URL.createObjectURL(file))
  }

  const handleRemoveDesktopImage = () => {
    setDesktopSelectedFile(null)
    setDesktopImageFile(null)
    setDesktopPreview('')
    setUploading(false)
    if (desktopInputRef.current) {
      desktopInputRef.current.value = ''
    }
  }

  const handleRemoveMobileImage = () => {
    setMobileSelectedFile(null)
    setMobileImageFile(null)
    setMobilePreview('')
    setUploading(false)
    if (mobileInputRef.current) {
      mobileInputRef.current.value = ''
    }
  }

  const handleDesktopImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setDesktopImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setDesktopPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleMobileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setMobileImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setMobilePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (file: File, type: 'desktop' | 'mobile'): Promise<string> => {
    const token = localStorage.getItem('token')
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/popup-announcements/upload/${type}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: uploadFormData
    })

    if (!response.ok) {
      throw new Error(`${type === 'desktop' ? '桌面版' : '手機版'}圖片上傳失敗`)
    }

    const result = await response.json()
    return result.path
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      let submitData = { ...formData }

      // 上傳新圖片
      if (desktopImageFile) {
        submitData.desktop_image_url = await uploadImage(desktopImageFile, 'desktop')
      }
      if (mobileImageFile) {
        submitData.mobile_image_url = await uploadImage(mobileImageFile, 'mobile')
      }

      // 轉換時間格式給後端
      if (submitData.start_date) {
        submitData.start_date = fromDatetimeLocalToTaiwan(submitData.start_date, false)
      }
      if (submitData.end_date) {
        submitData.end_date = fromDatetimeLocalToTaiwan(submitData.end_date, true)
      }

      // 更新彈窗公告
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/popup-announcements/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        router.push('/admin/popup-announcement')
      } else {
        alert('更新失敗')
      }
    } catch (error) {
      console.error('更新錯誤:', error)
      alert('更新失敗')
    } finally {
      setLoading(false)
    }
  }

  const PreviewModal = () => {
    if (!showPreview) return null

    const isMobile = window.innerWidth <= 768
    const imageUrl = isMobile && mobilePreview ? mobilePreview : desktopPreview

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold">{formData.title || '彈窗公告預覽'}</h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {imageUrl && (
            <div className="relative">
              <img
                src={imageUrl}
                alt="預覽"
                className="w-full h-auto object-cover"
                style={{ maxHeight: '400px' }}
              />
            </div>
          )}

          <div className="p-4 space-y-4">
            <div className="text-center text-sm text-gray-500">
              1 / 1
            </div>

            {formData.button_text && formData.button_url && (
              <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium">
                {formData.button_text}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (initialLoading) {
    return <div className="p-6">載入中...</div>
  }

  return (
    <div className="popup-announcement-create-container">
      {/* 頁面標題區域 */}
      <div className="popup-announcement-create-header">
        <h1>📝 編輯彈窗公告</h1>
        <div className="popup-announcement-create-breadcrumb">
          <span onClick={() => router.push("/admin/popup-announcement")} className="breadcrumb-link">
            📢 彈窗公告管理
          </span>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">編輯公告</span>
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
                    公告標題
                    <span className="required">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    name="title"
                    className="form-input"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="請輸入公告標題"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="button_text" className="form-label">
                    <span className="label-icon">📝</span>
                    按鈕文字
                  </label>
                  <input
                    id="button_text"
                    type="text"
                    name="button_text"
                    className="form-input"
                    value={formData.button_text}
                    onChange={handleInputChange}
                    placeholder="例如：前往優惠、我要參加"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="button_url" className="form-label">
                    <span className="label-icon">🔗</span>
                    按鈕連結
                  </label>
                  <input
                    id="button_url"
                    type="url"
                    name="button_url"
                    className="form-input"
                    value={formData.button_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 圖片上傳卡片 */}
          <div className="form-card">
            <div className="form-card-header">
              <span className="form-card-icon">🖼️</span>
              <h3>彈窗圖片</h3>
            </div>
            <div className="form-card-content">
              <div className="image-upload-section">
                {/* 桌面版圖片上傳 */}
                <div className="image-upload-group">
                  <div className="form-group po-r">
                    <label className="form-label">💻 桌面版圖片</label>
                    
                    {!desktopPreview ? (
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
                          if (file) handleDesktopFileSelect(file)
                        }}
                      >
                        <div className="file-upload-icon">📁</div>
                        <div className="file-upload-text">點擊選擇桌面版圖片或拖拽到此處</div>
                        <div className="file-upload-hint">支援 JPG、PNG、WebP 格式，建議尺寸 1200x800 像素</div>
                      </div>
                    ) : (
                      <div className="image-preview-container">
                        <div className="image-preview">
                          <img src={desktopPreview} alt="桌面版預覽" />
                          <div className="image-info">
                            📄 {desktopSelectedFile?.name || '現有圖片'} {desktopSelectedFile && `(${((desktopSelectedFile.size || 0) / 1024).toFixed(1)} KB)`}
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
                              onClick={handleRemoveDesktopImage}
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
                        if (file) handleDesktopFileSelect(file)
                      }}
                    />
                    
                    <div className="form-hint">
                      建議上傳高品質的桌面版圖片，檔案大小不超過 5MB
                    </div>
                  </div>
                </div>

                {/* 手機版圖片上傳 */}
                <div className="image-upload-group">
                  <div className="form-group po-r">
                    <label className="form-label">📱 手機版圖片</label>
                    
                    {!mobilePreview ? (
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
                          if (file) handleMobileFileSelect(file)
                        }}
                      >
                        <div className="file-upload-icon">📁</div>
                        <div className="file-upload-text">點擊選擇手機版圖片或拖拽到此處</div>
                        <div className="file-upload-hint">支援 JPG、PNG、WebP 格式，建議尺寸 600x800 像素</div>
                      </div>
                    ) : (
                      <div className="image-preview-container">
                        <div className="image-preview">
                          <img src={mobilePreview} alt="手機版預覽" />
                          <div className="image-info">
                            📄 {mobileSelectedFile?.name || '現有圖片'} {mobileSelectedFile && `(${((mobileSelectedFile.size || 0) / 1024).toFixed(1)} KB)`}
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
                              onClick={handleRemoveMobileImage}
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
                        if (file) handleMobileFileSelect(file)
                      }}
                    />
                    
                    <div className="form-hint">
                      建議上傳高品質的手機版圖片，檔案大小不超過 5MB
                    </div>
                  </div>
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
                    <option value="active">啟用</option>
                    <option value="inactive">停用</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="sort_order" className="form-label">
                    <span className="label-icon">🔢</span>
                    排序順序
                  </label>
                  <input
                    id="sort_order"
                    type="number"
                    name="sort_order"
                    className="form-input"
                    value={formData.sort_order}
                    onChange={handleInputChange}
                    placeholder="數字越大越前面"
                    min="0"
                  />
                  <div className="form-hint">
                    💡 設定公告顯示的優先順序
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 時間設定卡片 */}
          <div className="form-card">
            <div className="form-card-header">
              <span className="form-card-icon">📅</span>
              <h3>時間設定</h3>
            </div>
            <div className="form-card-content">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="start_date" className="form-label">
                    <span className="label-icon">🟢</span>
                    開始時間
                  </label>
                  <DateTimePicker
                    id="start_date"
                    value={formData.start_date}
                    onChange={(value) => setFormData(prev => ({ ...prev, start_date: value }))}
                    className="form-input"
                  />
                  <div className="form-hint">
                    💡 不設定則立即生效
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="end_date" className="form-label">
                    <span className="label-icon">🔴</span>
                    結束時間
                  </label>
                  <DateTimePicker
                    id="end_date"
                    value={formData.end_date}
                    onChange={(value) => setFormData(prev => ({ ...prev, end_date: value }))}
                    className="form-input"
                  />
                  <div className="form-hint">
                    💡 不設定則永久有效
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              disabled={!desktopPreview}
              className="btn-preview"
            >
              <span>👁️</span>
              預覽效果
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="btn-submit"
            >
              {loading ? (
                <>
                  <span className="loading-spinner">⏳</span>
                  更新中...
                </>
              ) : (
                <>
                  <span>💾</span>
                  更新公告
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/popup-announcement")}
              className="popup-announcement-cancel-btn"
            >
              <span>❌</span>
              取消
            </button>
          </div>

        </div>
      </div>

      <PreviewModal />
    </div>
  )
}