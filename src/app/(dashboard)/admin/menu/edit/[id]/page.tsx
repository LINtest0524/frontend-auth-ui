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
    return <div className="b-ibox"><p>載入中...</p></div>
  }

  return (
    <div className="b-ibox">
      <h1>編輯選單</h1>

      <div className="b-ibox-s">
        <form onSubmit={handleSubmit} className="w100">
          {/* 公司信息 - 僅顯示，不可編輯 */}
          <div className="b-form-group-1 w100 fl4">
            <label>所屬公司</label>
            <div className="w70" style={{ padding: '8px 12px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px' }}>
              {formData.company_id === 1 ? '公司 A' : formData.company_id === 2 ? '公司 B' : `公司 ${formData.company_id}`}
            </div>
            <small style={{ color: '#666', marginLeft: '132px', display: 'block', marginTop: '5px' }}>
              選單的公司歸屬無法修改
            </small>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label htmlFor="parent_id">父選單</label>
            <select
              id="parent_id"
              name="parent_id"
              className="w70"
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

          <div className="b-form-group-1 w100 fl4">
            <label htmlFor="title">選單標題 *</label>
            <input
              type="text"
              id="title"
              name="title"
              className="w70"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="請輸入選單標題"
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label htmlFor="url">連結網址</label>
            <input
              type="text"
              id="url"
              name="url"
              className="w70"
              value={formData.url}
              onChange={handleChange}
              placeholder="https://example.com 或 /page 或 /products/loans"
            />
            <small style={{ color: '#666', marginLeft: '132px', display: 'block', marginTop: '5px' }}>
              可以輸入完整網址 (https://...) 或站內路徑 (/page)
            </small>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label htmlFor="target_blank">在新視窗開啟</label>
            <input
              type="checkbox"
              id="target_blank"
              name="target_blank"
              checked={formData.target_blank}
              onChange={handleChange}
              className="new-checkbox"
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label htmlFor="icon">圖示 CSS 類別</label>
            <input
              type="text"
              id="icon"
              name="icon"
              className="w70"
              value={formData.icon}
              onChange={handleChange}
              placeholder="例如: fas fa-home"
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label htmlFor="sort_order">排序</label>
            <input
              type="number"
              id="sort_order"
              name="sort_order"
              className="w70"
              value={formData.sort_order}
              onChange={handleChange}
              min="0"
              placeholder="數字越小排序越前面"
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label htmlFor="device_type">顯示裝置</label>
            <select
              id="device_type"
              name="device_type"
              className="w70"
              value={formData.device_type}
              onChange={handleChange}
            >
              <option value="both">桌面 + 手機</option>
              <option value="desktop">僅桌面</option>
              <option value="mobile">僅手機</option>
            </select>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label htmlFor="status">狀態</label>
            <select
              id="status"
              name="status"
              className="w70"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="active">啟用</option>
              <option value="inactive">停用</option>
            </select>
          </div>

          <div className="fl4 w100 b-btnbox">
            <button
              type="submit"
              disabled={loading}
              className="b-btn-s2 b-btn-c4 mr20"
            >
              {loading ? '更新中...' : '更新選單'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/menu')}
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