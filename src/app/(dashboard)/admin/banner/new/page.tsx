'use client'

import React, { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import '@/styles/pages/banner-form.css'

// 使用環境變數 API 端點
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

  // 快速設定活動時間
  const quickSetTime = (type: string) => {
    const now = new Date();
    let startTime = '';
    let endTime = '';

    switch (type) {
      case 'now':
        // 從現在開始，持續一週
        const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
        const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(weekLater.getFullYear(), weekLater.getMonth(), weekLater.getDate(), 23, 59);
        startTime = `${nowStart.getFullYear()}-${String(nowStart.getMonth() + 1).padStart(2, '0')}-${String(nowStart.getDate()).padStart(2, '0')}T${String(nowStart.getHours()).padStart(2, '0')}:${String(nowStart.getMinutes()).padStart(2, '0')}`;
        endTime = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}T${String(weekEnd.getHours()).padStart(2, '0')}:${String(weekEnd.getMinutes()).padStart(2, '0')}`;
        break;
      case 'today':
        // 今日整天
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0);
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59);
        startTime = `${todayStart.getFullYear()}-${String(todayStart.getMonth() + 1).padStart(2, '0')}-${String(todayStart.getDate()).padStart(2, '0')}T${String(todayStart.getHours()).padStart(2, '0')}:${String(todayStart.getMinutes()).padStart(2, '0')}`;
        endTime = `${todayEnd.getFullYear()}-${String(todayEnd.getMonth() + 1).padStart(2, '0')}-${String(todayEnd.getDate()).padStart(2, '0')}T${String(todayEnd.getHours()).padStart(2, '0')}:${String(todayEnd.getMinutes()).padStart(2, '0')}`;
        break;
      case 'week':
        // 本週整週
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0);
        const weekEndDate = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
        const weekEndTime = new Date(weekEndDate.getFullYear(), weekEndDate.getMonth(), weekEndDate.getDate(), 23, 59);
        startTime = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}T${String(weekStart.getHours()).padStart(2, '0')}:${String(weekStart.getMinutes()).padStart(2, '0')}`;
        endTime = `${weekEndTime.getFullYear()}-${String(weekEndTime.getMonth() + 1).padStart(2, '0')}-${String(weekEndTime.getDate()).padStart(2, '0')}T${String(weekEndTime.getHours()).padStart(2, '0')}:${String(weekEndTime.getMinutes()).padStart(2, '0')}`;
        break;
      case 'month':
        // 本月整月
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59);
        startTime = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}-${String(monthStart.getDate()).padStart(2, '0')}T${String(monthStart.getHours()).padStart(2, '0')}:${String(monthStart.getMinutes()).padStart(2, '0')}`;
        endTime = `${monthEnd.getFullYear()}-${String(monthEnd.getMonth() + 1).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}T${String(monthEnd.getHours()).padStart(2, '0')}:${String(monthEnd.getMinutes()).padStart(2, '0')}`;
        break;
    }

    setForm(prev => ({
      ...prev,
      start_time: startTime,
      end_time: endTime
    }));
  }

  const handleUpload = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const token = localStorage.getItem('token')
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/banners/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
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

      // 統一時間格式處理 - 使用台灣時間
      let processedStartTime = '';
      let processedEndTime = '';
      
      if (form.start_time) {
        // 處理可能的格式差異
        let normalizedStart = form.start_time;
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(form.start_time)) {
          normalizedStart = form.start_time.substring(0, 16);
        }
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalizedStart)) {
          processedStartTime = normalizedStart + ':00';
        }
      }
      
      if (form.end_time) {
        // 處理可能的格式差異
        let normalizedEnd = form.end_time;
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(form.end_time)) {
          normalizedEnd = form.end_time.substring(0, 16);
        }
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalizedEnd)) {
          processedEndTime = normalizedEnd + ':59';
        }
      }

      const payload = {
        ...form,
        sort: Number(form.sort),
        desktop_image_url: desktopUrl,
        mobile_image_url: mobileUrl,
        start_time: processedStartTime,
        end_time: processedEndTime,
        company: { id: 1 },
      }

      const token = localStorage.getItem('token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/banners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
                  <DateTimePicker
                    value={form.start_time}
                    onChange={(value) => setForm(prev => ({...prev, start_time: value}))}
                    placeholder="選擇開始時間"
                    className="form-input datetime-input"
                  />
                  <span className="datetime-separator">到</span>
                  <DateTimePicker
                    value={form.end_time}
                    onChange={(value) => setForm(prev => ({...prev, end_time: value}))}
                    placeholder="選擇結束時間"
                    className="form-input datetime-input"
                  />
                </div>
                <div className="quick-time-buttons" style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                  marginTop: '8px'
                }}>
                  <button 
                    type="button" 
                    onClick={() => quickSetTime("now")} 
                    className="btn-quick-time"
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      backgroundColor: '#f0f9ff',
                      border: '1px solid #0284c7',
                      borderRadius: '4px',
                      color: '#0284c7',
                      cursor: 'pointer'
                    }}
                  >
                    📅 從現在開始一週
                  </button>
                  <button 
                    type="button" 
                    onClick={() => quickSetTime("today")} 
                    className="btn-quick-time"
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      backgroundColor: '#f0f9ff',
                      border: '1px solid #0284c7',
                      borderRadius: '4px',
                      color: '#0284c7',
                      cursor: 'pointer'
                    }}
                  >
                    📅 今日整天
                  </button>
                  <button 
                    type="button" 
                    onClick={() => quickSetTime("week")} 
                    className="btn-quick-time"
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      backgroundColor: '#f0f9ff',
                      border: '1px solid #0284c7',
                      borderRadius: '4px',
                      color: '#0284c7',
                      cursor: 'pointer'
                    }}
                  >
                    📅 本週
                  </button>
                  <button 
                    type="button" 
                    onClick={() => quickSetTime("month")} 
                    className="btn-quick-time"
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      backgroundColor: '#f0f9ff',
                      border: '1px solid #0284c7',
                      borderRadius: '4px',
                      color: '#0284c7',
                      cursor: 'pointer'
                    }}
                  >
                    📅 本月
                  </button>
                </div>
                <div className="form-hint">
                  設定 Banner 的顯示時間範圍，超出時間範圍將不會顯示。開始時間預設為 00 秒，結束時間預設為 59 秒。
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