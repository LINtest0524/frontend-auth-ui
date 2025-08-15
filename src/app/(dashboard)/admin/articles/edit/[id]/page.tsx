'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import SunEditor from '@/components/SunEditor'

type Article = {
  id: number
  title: string
  summary: string
  content: string
  image_url: string
  categoryId: number
  status: string
  is_featured: boolean
  sort: number
  publish_date: string
  companyId: number
}

type ArticleCategory = {
  id: number
  name: string
  slug: string
  status: string
}

export default function EditArticlePage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [article, setArticle] = useState<Article | null>(null)
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
    publish_date: '',
  })

  useEffect(() => {
    if (params.id) {
      fetchArticle()
      fetchCategories()
    }
  }, [params.id])

  const fetchCategories = async () => {
    try {
      // 從 localStorage 獲取用戶資訊
      const userData = localStorage.getItem('user')
      if (!userData) return
      
      const user = JSON.parse(userData)
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/article-categories/company/${user.companyId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setCategories(data.filter((cat: ArticleCategory) => cat.status === 'ACTIVE'))
      }
    } catch (error) {
      console.error('獲取分類失敗:', error)
    }
  }

  const fetchArticle = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/articles/${params.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setArticle(data)
        setFormData({
          title: data.title,
          summary: data.summary,
          content: data.content,
          image_url: data.image_url || '',
          categoryId: data.categoryId.toString(),
          status: data.status,
          is_featured: data.is_featured,
          sort: data.sort,
          publish_date: (() => {
            // 正確處理時間轉換
            const serverDate = new Date(data.publish_date);
            console.log('原始伺服器時間:', data.publish_date);
            console.log('解析後的時間:', serverDate);
            
            // 使用 toLocaleString 轉換為台灣時間，然後格式化為 datetime-local 格式
            const taiwanTimeString = serverDate.toLocaleString('sv-SE', {
              timeZone: 'Asia/Taipei'
            });
            console.log('台灣時間字串:', taiwanTimeString);
            
            // 轉換為 datetime-local 需要的格式 (YYYY-MM-DDTHH:mm)
            return taiwanTimeString.slice(0, 16);
          })(),
        })
      } else {
        alert('獲取文章資料失敗')
        router.push('/admin/articles')
      }
    } catch (error) {
      console.error('獲取文章錯誤:', error)
      alert('獲取文章資料失敗')
      router.push('/admin/articles')
    } finally {
      setFetching(false)
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
    
    if (!formData.title.trim() || !formData.summary.trim() || !formData.content.trim() || !formData.categoryId) {
      alert('請填寫必要欄位')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/articles/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          categoryId: parseInt(formData.categoryId.toString()),
          publish_date: (() => {
            // 正確處理提交時間
            console.log('用戶輸入的時間:', formData.publish_date);
            
            // 檢查是否有輸入發布時間
            if (!formData.publish_date || formData.publish_date.trim() === '') {
              console.log('沒有輸入發布時間，使用當前時間');
              return new Date().toISOString();
            }
            
            // 檢查時間格式是否正確 (應該包含 'T' 分隔符)
            if (!formData.publish_date.includes('T')) {
              console.log('時間格式不正確，使用當前時間');
              return new Date().toISOString();
            }
            
            try {
              // 用戶輸入的是台灣時間，需要轉換為 UTC 時間給伺服器
              // 創建一個 Date 物件，但指定為台灣時區
              const [datePart, timePart] = formData.publish_date.split('T');
              
              // 檢查是否有時間部分
              if (!datePart || !timePart) {
                console.log('日期或時間部分缺失，使用當前時間');
                return new Date().toISOString();
              }
              
              const [year, month, day] = datePart.split('-');
              const [hour, minute] = timePart.split(':');
              
              // 檢查所有部分是否存在
              if (!year || !month || !day || !hour || !minute) {
                console.log('日期時間格式不完整，使用當前時間');
                return new Date().toISOString();
              }
              
              // 創建台灣時間的 Date 物件
              const taiwanDate = new Date();
              taiwanDate.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day));
              taiwanDate.setHours(parseInt(hour), parseInt(minute), 0, 0);
              
              // 轉換為 UTC 時間 (台灣時間 - 8小時)
              const utcTime = new Date(taiwanDate.getTime() - 8 * 60 * 60 * 1000);
              console.log('轉換後的 UTC 時間:', utcTime.toISOString());
              
              return utcTime.toISOString();
            } catch (error) {
              console.error('時間轉換錯誤:', error);
              console.log('使用當前時間作為備用');
              return new Date().toISOString();
            }
          })(),
        }),
      })

      if (response.ok) {
        alert('文章更新成功')
        router.push('/admin/articles')
      } else {
        const errorData = await response.json()
        alert(`更新失敗: ${errorData.message || '未知錯誤'}`)
      }
    } catch (error) {
      console.error('更新文章錯誤:', error)
      alert('更新失敗')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return <div className="b-ibox"><p>載入中...</p></div>
  }

  if (!article) {
    return <div className="b-ibox"><p>文章不存在</p></div>
  }

  return (
    <div className="b-ibox">
      <h1>編輯文章</h1>

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
              {loading ? "更新中..." : "儲存送出"}
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