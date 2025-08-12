'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NewArticleCategoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [companyId, setCompanyId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    status: 'ACTIVE',
    sort: 0,
  })

  useEffect(() => {
    // 從 localStorage 獲取用戶資訊
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setCompanyId(user.companyId)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sort' ? parseInt(value) || 0 : value
    }))

    // 自動生成 slug
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!companyId) {
      alert('無法獲取公司資訊')
      return
    }

    if (!formData.name.trim() || !formData.slug.trim()) {
      alert('請填寫必要欄位')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/article-categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          companyId,
        }),
      })

      if (response.ok) {
        alert('分類新增成功')
        router.push('/admin/article-categories')
      } else {
        const errorData = await response.json()
        alert(`新增失敗: ${errorData.message || '未知錯誤'}`)
      }
    } catch (error) {
      console.error('新增分類錯誤:', error)
      alert('新增失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="b-ibox">
      <h1>新增文章分類</h1>

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
              將用於 URL 路徑，建議使用英文或數字，會自動根據分類名稱生成
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
                {loading ? '新增中...' : '新增分類'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  )
}