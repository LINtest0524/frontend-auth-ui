'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/hooks/use-user-store'
import { CKEditor } from '@ckeditor/ckeditor5-react'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'

export default function NewNewsPage() {
  const router = useRouter()
  const { user } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    image_url: '',
    category: 'GENERAL',
    status: 'DRAFT',
    is_featured: false,
    publish_date: (() => {
      const now = new Date();
      // 加8小時轉換為台灣時間
      const taiwanTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      return taiwanTime.toISOString().slice(0, 16);
    })(),
  })

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

  // 使用 useCallback 來穩定 onChange 函數 (CKEditor 格式)
  const handleEditorChangeStable = useCallback((event: any, editor: any) => {
    const data = editor.getData()
    setFormData(prev => ({ ...prev, content: data }))
  }, [])


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.companyId) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/news`, {
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
        router.push('/admin/news')
      } else {
        alert('新增失敗')
      }
    } catch (error) {
      console.error('Failed to create news:', error)
      alert('新增失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="b-ibox">
      <h1>新增最新消息</h1>

      <div className="b-ibox-s">
        <form onSubmit={handleSubmit} className="w100">
          
          <div className="b-form-group-1 w100 fl4">
            <label>標題</label>
            <input
              type="text"
              name="title"
              className="w70"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>摘要 (支援換行)</label>
            <textarea
              name="summary"
              className="w70"
              rows={3}
              value={formData.summary}
              onChange={handleSummaryChange}
              placeholder="輸入新聞摘要，可以使用 Enter 換行"
              required
            />
            <small style={{ color: '#666', marginLeft: '132px', display: 'block', marginTop: '5px' }}>
              提示：直接按 Enter 鍵可換行
            </small>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>內容 (富文本編輯器)</label>
            <div style={{ width: '70%' }}>
              <CKEditor
                editor={ClassicEditor}
                data={formData.content}
                onChange={handleEditorChangeStable}
                config={{
                  toolbar: [
                    'heading', '|',
                    'bold', 'italic', 'underline', 'strikethrough', '|',
                    'fontSize', 'fontColor', 'fontBackgroundColor', '|',
                    'bulletedList', 'numberedList', '|',
                    'outdent', 'indent', '|',
                    'alignment', '|',
                    'link', 'imageUpload', 'insertTable', '|',
                    'blockQuote', 'codeBlock', '|',
                    'undo', 'redo', '|',
                    'sourceEditing'
                  ],
                  heading: {
                    options: [
                      { model: 'paragraph', title: '段落', class: 'ck-heading_paragraph' },
                      { model: 'heading1', view: 'h1', title: '標題 1', class: 'ck-heading_heading1' },
                      { model: 'heading2', view: 'h2', title: '標題 2', class: 'ck-heading_heading2' },
                      { model: 'heading3', view: 'h3', title: '標題 3', class: 'ck-heading_heading3' }
                    ]
                  },
                  fontSize: {
                    options: [9, 11, 13, 'default', 17, 19, 21]
                  },
                  fontColor: {
                    colors: [
                      { color: 'hsl(0, 0%, 0%)', label: '黑色' },
                      { color: 'hsl(0, 0%, 30%)', label: '深灰' },
                      { color: 'hsl(0, 0%, 60%)', label: '淺灰' },
                      { color: 'hsl(0, 0%, 90%)', label: '白色' },
                      { color: 'hsl(0, 75%, 60%)', label: '紅色' },
                      { color: 'hsl(30, 75%, 60%)', label: '橙色' },
                      { color: 'hsl(60, 75%, 60%)', label: '黃色' },
                      { color: 'hsl(90, 75%, 60%)', label: '淺綠' },
                      { color: 'hsl(120, 75%, 60%)', label: '綠色' },
                      { color: 'hsl(150, 75%, 60%)', label: '青綠' },
                      { color: 'hsl(180, 75%, 60%)', label: '青色' },
                      { color: 'hsl(210, 75%, 60%)', label: '淺藍' },
                      { color: 'hsl(240, 75%, 60%)', label: '藍色' },
                      { color: 'hsl(270, 75%, 60%)', label: '紫色' }
                    ]
                  },
                  language: 'zh',
                  placeholder: '請輸入新聞內容...'
                }}
              />
              <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                提示：專業級富文本編輯器，支援文字顏色、字體大小、圖片上傳、表格等功能
              </small>
            </div>
          </div>

          <div className="b-form-group-2 w50 fl4 mb10">
            <label htmlFor="news-img">圖片</label>
            <input
              type="file"
              id="news-img"
              className="pt3 w70"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              disabled={uploading}
            />
            {uploading && <p className="text-sm text-blue-600 mt-1">上傳中...</p>}
          </div>

          <div className="b-form-group-2 w50 fl4 mb25 ml132">
            {formData.image_url && (
              <img
                src={`${process.env.NEXT_PUBLIC_API_BASE}${formData.image_url}`}
                alt="新聞預覽"
                className="b-banner-img"
              />
            )}
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>分類</label>
            <select
              name="category"
              className="w70"
              value={formData.category}
              onChange={handleInputChange}
            >
              <option value="GENERAL">一般消息</option>
              <option value="ANNOUNCEMENT">重要公告</option>
              <option value="PROMOTION">優惠活動</option>
              <option value="UPDATE">系統更新</option>
            </select>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>狀態</label>
            <select
              name="status"
              className="w70"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="DRAFT">草稿</option>
              <option value="ACTIVE">已發布</option>
              <option value="INACTIVE">未發布</option>
            </select>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>發布時間</label>
            <input
              type="datetime-local"
              name="publish_date"
              className="w70"
              value={formData.publish_date}
              onChange={handleInputChange}
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label htmlFor="featured">設為置頂</label>
            <input
              type="checkbox"
              name="is_featured"
              checked={formData.is_featured}
              onChange={handleInputChange}
              id="featured"
              className="new-checkbox"
            />
          </div>

          <div className="fl4 w100 b-btnbox">
            <button
              type="submit"
              disabled={loading}
              className="b-btn-s2 b-btn-c4 mr20"
            >
              {loading ? "新增中..." : "儲存送出"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/news")}
              className="b-btn-s2 b-btn-c1"
            >
              取消
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}