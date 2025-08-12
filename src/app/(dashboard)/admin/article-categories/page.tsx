'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type ArticleCategory = {
  id: number
  name: string
  slug: string
  description: string
  status: string
  sort: number
  companyId: number
  createdAt: string
  updatedAt: string
}

export default function ArticleCategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<ArticleCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [companyId, setCompanyId] = useState<number | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  useEffect(() => {
    // 從 localStorage 獲取用戶資訊
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setCompanyId(user.companyId)
    }
  }, [])

  useEffect(() => {
    if (companyId && hasSearched) {
      fetchCategories()
    }
  }, [companyId])

  // 頁面載入時自動搜尋
  useEffect(() => {
    if (!hasSearched && companyId) {
      setHasSearched(true)
      fetchCategories()
    }
  }, [companyId])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      
      if (searchTerm.trim()) params.append('search', searchTerm.trim())
      if (selectedStatus) params.append('status', selectedStatus)
      
      const url = `${process.env.NEXT_PUBLIC_API_BASE}/article-categories/company/${companyId}${params.toString() ? `?${params}` : ''}`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      } else {
        console.error('獲取分類失敗')
        setCategories([])
      }
    } catch (error) {
      console.error('獲取分類錯誤:', error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    setHasSearched(true)
    await new Promise(resolve => setTimeout(resolve, 50))
    fetchCategories()
  }

  const clearFilter = () => {
    setSearchTerm('')
    setSelectedStatus('')
  }

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除這個分類嗎？')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/article-categories/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        alert('分類刪除成功')
        fetchCategories()
      } else {
        alert('分類刪除失敗')
      }
    } catch (error) {
      console.error('刪除分類錯誤:', error)
      alert('分類刪除失敗')
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '啟用'
      case 'INACTIVE': return '停用'
      default: return status
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'INACTIVE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="b-bigbox-all w100">
      <div className="b-ibox mb30">
        <h1>文章分類管理</h1>

        <div className="b-ibox-s">
          <div className="w100 fo5 mb15">
            <div className="w50 fl4">
              <button
                onClick={() => router.push('/admin/article-categories/new')}
                className="b-btn-s2 b-btn-c4"
              >
                新增分類
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="b-search-btn w100"
          >
            篩選
            <span className={`i-arrow ${isFilterOpen ? "rotate" : ""}`}></span>
          </button>

          {isFilterOpen && (
            <>
              <div className="b-search-box fl1 w100 mt15">
                <div className="b-form-group-2 fl4 w33 mb25">
                  <label htmlFor="searchTerm">分類名稱</label>
                  <input 
                    type="text" 
                    placeholder="搜尋分類名稱..." 
                    id="searchTerm" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w60" 
                  />
                </div>

                <div className="b-form-group-2 fl4 w33 mb25">
                  <label htmlFor="statusSelect">狀態</label>
                  <select 
                    id="statusSelect"
                    value={selectedStatus} 
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w60"
                  >
                    <option value="">所有狀態</option>
                    <option value="ACTIVE">啟用</option>
                    <option value="INACTIVE">停用</option>
                  </select>
                </div>

                <div className="fl4 w100 b-btnbox">
                  <button onClick={handleSearch} className="b-btn-s2 b-btn-c4 mr20">查詢</button>
                  <button onClick={clearFilter} className="b-btn-s2 b-btn-c1">清除</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {loading && <p>載入中...</p>}

      {!loading && hasSearched && (
        <>
          <div className="b-ibox">
            <div className="b-ibox-s">
              <table className="b-table-box admin-table mb15">
            <thead>
              <tr>
                <th>分類名稱</th>
                <th>代碼</th>
                <th>描述</th>
                <th>狀態</th>
                <th>排序</th>
                <th>建立時間</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="text-center">
                  <td>
                    <div className="text-left">
                      <div className="font-semibold">{category.name}</div>
                    </div>
                  </td>
                  <td>{category.slug}</td>
                  <td>
                    <div className="text-left max-w-xs truncate">
                      {category.description || '-'}
                    </div>
                  </td>
                  <td>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(category.status)}`}>
                      {getStatusText(category.status)}
                    </span>
                  </td>
                  <td>{category.sort}</td>
                  <td>{new Date(category.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => router.push(`/admin/article-categories/${category.id}/edit`)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      刪除
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500">
                    尚無分類資料
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  )
}