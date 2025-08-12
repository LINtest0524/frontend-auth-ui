'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

type ArticleCategory = {
  id: number
  name: string
  slug: string
  description: string
  status: string
  sort: number
  companyId: number
}

export default function EditArticleCategoryPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [category, setCategory] = useState<ArticleCategory | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    status: 'ACTIVE',
    sort: 0,
  })

  useEffect(() => {
    if (params.id) {
      fetchCategory()
    }
  }, [params.id])

  const fetchCategory = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/article-categories/${params.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setCategory(data)
        setFormData({
          name: data.name,
          slug: data.slug,
          description: data.description || '',
          status: data.status,
          sort: data.sort,
        })
      } else {
        alert('獲取分類資料失敗')
        router.push('/admin/article-categories')
      }
    } catch (error) {
      console.error('獲取分類錯誤:', error)
      alert('獲取分類資料失敗')
      router.push('/admin/article-categories')
    } finally {
      setFetching(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sort' ? parseInt(value) || 0 : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.slug.trim()) {
      alert('請填寫必要欄位')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/article-categories/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        alert('分類更新成功')
        router.push('/admin/article-categories')
      } else {
        const errorData = await response.json()
        alert(`更新失敗: ${errorData.message || '未知錯誤'}`)
      }
    } catch (error) {
      console.error('更新分類錯誤:', error)
      alert('更新失敗')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return <div className="p-6">載入中...</div>
  }

  if (!category) {
    return <div className="p-6">分類不存在</div>
  }

  return (
    <div className="b-ibox">
      <h1>編輯文章分類</h1>

      <div className="b-ibox-s">
        <form onSubmit={handleSubmit} className="w100">
          
          <div className="b-form-group-1 w100 fl4">
            <label>分類名稱 <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="name"
              className="w70"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="請輸入分類名稱"
              required
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>分類代碼 <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="slug"
              className="w70"
              value={formData.slug}
              onChange={handleInputChange}
              placeholder="請輸入分類代碼（用於 URL）"
              required
            />
            <small style={{ color: '#666', marginLeft: '132px', display: 'block', marginTop: '5px' }}>
              將用於 URL 路徑，建議使用英文或數字
            </small>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>分類描述</label>
            <textarea
              name="description"
              className="w70"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              placeholder="請輸入分類描述"
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>狀態</label>
            <select
              name="status"
              className="w70"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="ACTIVE">啟用</option>
              <option value="INACTIVE">停用</option>
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
            <div className="w100 fl4 text-right">
              <button
                type="button"
                onClick={() => router.push('/admin/article-categories')}
                className="b-btn-s2 b-btn-c1 mr20"
              >
                返回列表
              </button>
              <button
                type="submit"
                disabled={loading}
                className="b-btn-s2 b-btn-c4"
              >
                {loading ? '更新中...' : '更新分類'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  )
}