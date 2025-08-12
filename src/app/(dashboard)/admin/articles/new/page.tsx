'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SunEditor from '@/components/SunEditor'

type ArticleCategory = {
  id: number
  name: string
  slug: string
  status: string
}

export default function NewArticlePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [companyId, setCompanyId] = useState<number | null>(null)
  const [categories, setCategories] = useState<ArticleCategory[]>([])
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    image_url: '',
    categoryId: '',
    status: 'DRAFT',
    is_featured: false,
    sort: 0,
    publish_date: (() => {
      const now = new Date();
      // 加8小時轉換為台灣時間
      const taiwanTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      return taiwanTime.toISOString().slice(0, 16);
    })(),
  })

  useEffect(() => {
    // 從 localStorage 獲取用戶資訊
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setCompanyId(user.companyId)
      console.log('獲取到的用戶資訊:', user)
      console.log('Company ID:', user.companyId)
    } else {
      console.log('未找到用戶資訊')
    }
  }, [])

  useEffect(() => {
    if (companyId) {
      fetchCategories()
    }
  }, [companyId])

  const fetchCategories = async () => {
    console.log('開始獲取分類，Company ID:', companyId)
    try {
      const token = localStorage.getItem('token')
      console.log('獲取到的 token:', token ? '存在' : '不存在')
      const url = `${process.env.NEXT_PUBLIC_API_BASE}/article-categories/company/${companyId}`
      console.log('請求 URL:', url)
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('API 回應狀態:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('獲取到的原始分類資料:', data)
        const activeCategories = data.filter((cat: ArticleCategory) => cat.status === 'ACTIVE')
        console.log('過濾後的啟用分類:', activeCategories)
        setCategories(activeCategories)
      } else {
        console.error('API 回應錯誤:', response.status, response.statusText)
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formDataUpload = new FormData()
    formDataUpload.append('file', file)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/articles/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataUpload,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({ ...prev, image_url: data.url }))
        alert('圖片上傳成功')
      } else {
        alert('圖片上傳失敗')
      }
    } catch (error) {
      console.error('圖片上傳錯誤:', error)
      alert('圖片上傳失敗')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!companyId) {
      alert('無法獲取公司資訊')
      return
    }

    if (!formData.title.trim() || !formData.summary.trim() || !formData.content.trim() || !formData.categoryId) {
      alert('請填寫必要欄位')
      return
    }

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
          companyId,
          categoryId: parseInt(formData.categoryId.toString()),
        }),
      })

      if (response.ok) {
        alert('文章新增成功')
        router.push('/admin/articles')
      } else {
        const errorData = await response.json()
        alert(`新增失敗: ${errorData.message || '未知錯誤'}`)
      }
    } catch (error) {
      console.error('新增文章錯誤:', error)
      alert('新增失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="b-ibox">
      <h1>新增文章</h1>

      <div className="b-ibox-s">
        <form onSubmit={handleSubmit} className="w100">
          <div className="b-form-group-1 w100 fl4">
            <label>文章標題</label>
            <input
              type="text"
              name="title"
              className="w70"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="請輸入文章標題"
              required
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>文章分類</label>
            <select
              name="categoryId"
              className="w70"
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

          <div className="b-form-group-1 w100 fl4">
            <label>文章摘要 (支援換行)</label>
            <textarea
              name="summary"
              className="w70"
              rows={3}
              value={formData.summary}
              onChange={handleInputChange}
              placeholder="請輸入文章摘要，可以使用 Enter 換行"
              required
            />
            <small style={{ color: '#666', marginLeft: '132px', display: 'block', marginTop: '5px' }}>
              提示：直接按 Enter 鍵可換行
            </small>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>文章內容 (富文本編輯器)</label>
            <div style={{ width: '70%' }}>
              <SunEditor
                value={formData.content}
                onChange={handleContentChange}
                placeholder="請輸入文章內容..."
                height="400px"
              />
              <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                提示：SunEditor 專業級富文本編輯器，支援豐富的格式化功能、圖片上傳、表格、程式碼等
              </small>
            </div>
          </div>

          <div className="b-form-group-2 w50 fl4 mb10">
            <label htmlFor="article-img">文章圖片</label>
            <input
              type="file"
              id="article-img"
              className="pt3 w70"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
            />
          </div>

          <div className="b-form-group-2 w50 fl4 mb25 ml132">
            {formData.image_url && (
              <img
                src={`${process.env.NEXT_PUBLIC_API_BASE}${formData.image_url}`}
                alt="文章預覽"
                className="b-banner-img"
              />
            )}
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>發布狀態</label>
            <select
              name="status"
              className="w70"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="DRAFT">草稿</option>
              <option value="ACTIVE">已發布</option>
              <option value="INACTIVE">已下架</option>
            </select>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>排序</label>
            <input
              type="number"
              name="sort"
              className="w70"
              value={formData.sort}
              onChange={handleInputChange}
              placeholder="數字越小排序越前面"
              min="0"
            />
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
              onClick={() => router.push("/admin/articles")}
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