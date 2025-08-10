'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface MenuItem {
  id: number
  title: string
  url?: string
  target_blank: boolean
  icon?: string
  sort_order: number
  device_type: 'desktop' | 'mobile' | 'both'
  status: 'active' | 'inactive'
  parent_id?: number
  company_id: number
}

export default function EditMenuPage() {
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    target_blank: false,
    icon: '',
    sort_order: 0,
    device_type: 'both' as 'desktop' | 'mobile' | 'both',
    status: 'active' as 'active' | 'inactive',
    parent_id: '',
    company_id: 1,
  })
  
  const [parentMenus, setParentMenus] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const menuId = params.id as string
  

  // 載入選單資料
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/menu/${menuId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        )

        if (response.ok) {
          const menu = await response.json()
          setFormData({
            title: menu.title,
            url: menu.url || '',
            target_blank: menu.target_blank,
            icon: menu.icon || '',
            sort_order: menu.sort_order,
            device_type: menu.device_type,
            status: menu.status,
            parent_id: menu.parent_id ? menu.parent_id.toString() : '',
            company_id: menu.company_id,
          })
        } else {
          alert('載入選單失敗')
          router.push('/admin/menu')
        }
      } catch (error) {
        console.error('載入選單錯誤:', error)
        alert('載入選單失敗')
        router.push('/admin/menu')
      } finally {
        setInitialLoading(false)
      }
    }

    if (menuId) {
      fetchMenu()
    }
  }, [menuId])

  // 載入可選的父選單
  useEffect(() => {
    const fetchParentMenus = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/menu/admin/company/${formData.company_id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        )

        if (response.ok) {
          const data = await response.json()
          // 排除自己和自己的子選單
          const availableParents = data.filter((menu: any) => {
            return menu.id !== Number(menuId) && 
                   (!menu.parent_id || !menu.parent?.parent_id) &&
                   menu.parent_id !== Number(menuId)
          })
          setParentMenus(availableParents)
        }
      } catch (error) {
        console.error('載入父選單失敗:', error)
      }
    }

    if (formData.company_id && !initialLoading) {
      fetchParentMenus()
    }
  }, [formData.company_id, menuId, initialLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const submitData = {
        ...formData,
        parent_id: formData.parent_id ? Number(formData.parent_id) : undefined,
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/menu/${menuId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData),
        }
      )

      if (response.ok) {
        router.push('/admin/menu')
      } else {
        const error = await response.json()
        alert(`更新失敗: ${error.message || '未知錯誤'}`)
      }
    } catch (error) {
      console.error('更新選單錯誤:', error)
      alert('更新失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  if (initialLoading) {
    return <div className="loading">載入中...</div>
  }

  return (
    <div className="edit-menu-page">
      <div className="page-header">
        <h1>編輯選單</h1>
        <button
          onClick={() => router.push('/admin/menu')}
          className="btn-back"
        >
          返回列表
        </button>
      </div>

      <form onSubmit={handleSubmit} className="menu-form">
        {/* 公司信息 - 僅顯示，不可編輯 */}
        <div className="form-group">
          <label>所屬公司</label>
          <div className="company-display">
            {formData.company_id === 1 ? '公司 A' : formData.company_id === 2 ? '公司 B' : `公司 ${formData.company_id}`}
          </div>
          <small className="form-help">
            選單的公司歸屬無法修改
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="parent_id">父選單</label>
          <select
            id="parent_id"
            name="parent_id"
            value={formData.parent_id}
            onChange={handleChange}
          >
            <option value="">無 (頂級選單)</option>
            {parentMenus.map(menu => (
              <option key={menu.id} value={menu.id}>
                {menu.parent_id ? `　└ ${menu.title}` : menu.title}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="title">選單標題 *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="請輸入選單標題"
          />
        </div>

        <div className="form-group">
          <label htmlFor="url">連結網址</label>
          <input
            type="text"
            id="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            placeholder="https://example.com 或 /page 或 /products/loans"
          />
          <small className="form-help">
            可以輸入完整網址 (https://...) 或站內路徑 (/page)
          </small>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="target_blank"
              checked={formData.target_blank}
              onChange={handleChange}
            />
            在新視窗開啟
          </label>
        </div>

        <div className="form-group">
          <label htmlFor="icon">圖示 CSS 類別</label>
          <input
            type="text"
            id="icon"
            name="icon"
            value={formData.icon}
            onChange={handleChange}
            placeholder="例如: fas fa-home"
          />
        </div>

        <div className="form-group">
          <label htmlFor="sort_order">排序</label>
          <input
            type="number"
            id="sort_order"
            name="sort_order"
            value={formData.sort_order}
            onChange={handleChange}
            min="0"
          />
        </div>

        <div className="form-group">
          <label htmlFor="device_type">顯示裝置</label>
          <select
            id="device_type"
            name="device_type"
            value={formData.device_type}
            onChange={handleChange}
          >
            <option value="both">桌面 + 手機</option>
            <option value="desktop">僅桌面</option>
            <option value="mobile">僅手機</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="status">狀態</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="active">啟用</option>
            <option value="inactive">停用</option>
          </select>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => router.push('/admin/menu')}
            className="btn-cancel"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-submit"
          >
            {loading ? '更新中...' : '更新選單'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .edit-menu-page {
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e9ecef;
        }

        .btn-back {
          padding: 0.5rem 1rem;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          text-decoration: none;
        }

        .btn-back:hover {
          background: #5a6268;
        }

        .menu-form {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #333;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: normal;
        }

        .checkbox-group input[type="checkbox"] {
          width: auto;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #e9ecef;
        }

        .btn-cancel,
        .btn-submit {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          transition: background-color 0.2s;
        }

        .btn-cancel {
          background: #6c757d;
          color: white;
        }

        .btn-cancel:hover {
          background: #5a6268;
        }

        .btn-submit {
          background: #007bff;
          color: white;
        }

        .btn-submit:hover:not(:disabled) {
          background: #0056b3;
        }

        .btn-submit:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          color: #666;
        }

        .form-help {
          display: block;
          margin-top: 0.25rem;
          font-size: 0.875rem;
          color: #6c757d;
        }

        .company-display {
          padding: 0.75rem;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          color: #495057;
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}