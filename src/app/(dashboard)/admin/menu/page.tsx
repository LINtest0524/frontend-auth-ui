'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/hooks/use-user-store'

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
  level: number
  children?: MenuItem[]
  created_at: string
  updated_at: string
}

export default function MenuManagePage() {
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null) // 初始為 null，等待用戶信息載入
  const router = useRouter()
  
  const currentUser = useUserStore((state) => state.user)
  const role = currentUser?.role ?? ""
  const userCompanyId = currentUser?.company?.id || currentUser?.companyId
  
  // 根據角色決定是否顯示公司選擇器和預設公司
  const canSelectCompany = ["SUPER_ADMIN", "GLOBAL_ADMIN"].includes(role)
  
  useEffect(() => {
    // 從 localStorage 載入用戶信息
    const raw = localStorage.getItem("user")
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        const userStore = useUserStore.getState()
        if (!userStore.user) {
          userStore.setUser(parsed)
        }
      } catch (e) {
        console.error("無法解析 user JSON", e)
      }
    }
  }, [])
  
  useEffect(() => {
    if (!currentUser) return // 等待用戶信息載入
    
    // 根據角色設定預設公司
    if (role === "AGENT_OWNER" && userCompanyId) {
      setSelectedCompany(userCompanyId)
    } else if (canSelectCompany) {
      setSelectedCompany(1) // 超級管理員和全域管理員預設選擇公司A
    }
  }, [role, userCompanyId, currentUser, canSelectCompany])

  // 載入選單資料
  const fetchMenus = async () => {
    // 如果還沒有選擇公司，不發送請求
    if (selectedCompany === null) {
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/menu/admin/company/${selectedCompany}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setMenus(data)
      } else {
        console.error('載入選單失敗:', response.statusText)
      }
    } catch (error) {
      console.error('載入選單錯誤:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedCompany !== null) {
      fetchMenus()
    }
  }, [selectedCompany])

  // 建立選單樹狀結構
  const buildMenuTree = (flatMenus: MenuItem[]): MenuItem[] => {
    const menuMap = new Map<number, MenuItem>()
    const rootMenus: MenuItem[] = []

    // 先建立所有選單的映射
    flatMenus.forEach(menu => {
      menuMap.set(menu.id, { ...menu, children: [] })
    })

    // 建立父子關係
    flatMenus.forEach(menu => {
      const menuItem = menuMap.get(menu.id)!
      if (menu.parent_id) {
        const parent = menuMap.get(menu.parent_id)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(menuItem)
        }
      } else {
        rootMenus.push(menuItem)
      }
    })

    // 排序
    const sortMenus = (menus: MenuItem[]) => {
      menus.sort((a, b) => a.sort_order - b.sort_order)
      menus.forEach(menu => {
        if (menu.children && menu.children.length > 0) {
          sortMenus(menu.children)
        }
      })
    }

    sortMenus(rootMenus)
    return rootMenus
  }

  // 刪除選單
  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除這個選單項目嗎？')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/menu/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        await fetchMenus() // 重新載入
      } else {
        alert('刪除失敗')
      }
    } catch (error) {
      console.error('刪除錯誤:', error)
      alert('刪除失敗')
    }
  }

  // 切換狀態
  const handleToggleStatus = async (id: number, currentStatus: string) => {
    try {
      const token = localStorage.getItem('token')
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/menu/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        }
      )

      if (response.ok) {
        await fetchMenus() // 重新載入
      } else {
        alert('更新狀態失敗')
      }
    } catch (error) {
      console.error('更新狀態錯誤:', error)
      alert('更新狀態失敗')
    }
  }

  // 渲染選單項目
  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const indent = level * 20
    
    return (
      <div key={item.id} className="menu-item-row" style={{ paddingLeft: `${indent}px` }}>
        <div className="menu-item-content">
          <div className="menu-info">
            <span className="menu-title">{item.title}</span>
            {item.url && <span className="menu-url">({item.url})</span>}
            <span className={`menu-status ${item.status}`}>
              {item.status === 'active' ? '啟用' : '停用'}
            </span>
            <span className="menu-device">{item.device_type}</span>
            <span className="menu-sort">排序: {item.sort_order}</span>
          </div>
          
          <div className="menu-actions">
            <button
              onClick={() => router.push(`/admin/menu/edit/${item.id}`)}
              className="btn-edit"
            >
              編輯
            </button>
            <button
              onClick={() => handleToggleStatus(item.id, item.status)}
              className={`btn-toggle ${item.status}`}
            >
              {item.status === 'active' ? '停用' : '啟用'}
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              className="btn-delete"
            >
              刪除
            </button>
          </div>
        </div>
        
        {/* 遞歸渲染子選單 */}
        {item.children && item.children.map(child => renderMenuItem(child, level + 1))}
      </div>
    )
  }

  if (loading || selectedCompany === null) {
    return <div className="loading">載入中...</div>
  }

  return (
    <div className="menu-manage-page">
      <div className="page-header">
        <h1>選單管理</h1>
        
        <div className="header-controls">
          {/* 只有超級管理員和全域管理員可以選擇公司 */}
          {canSelectCompany && (
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(Number(e.target.value))}
              className="company-select"
            >
              <option value={1}>公司 A</option>
              <option value={2}>公司 B</option>
            </select>
          )}
          
          {/* 代理商老闆顯示自己的公司名稱 */}
          {role === "AGENT_OWNER" && (
            <div className="current-company">
              管理公司：{currentUser?.company?.name || `公司 ${userCompanyId}`}
            </div>
          )}
          
          <button
            onClick={() => router.push('/admin/menu/new')}
            className="btn-primary"
          >
            新增選單
          </button>
        </div>
      </div>

      <div className="menu-list">
        {menus.length === 0 ? (
          <div className="empty-state">
            <p>尚未建立任何選單</p>
            <button
              onClick={() => router.push('/admin/menu/new')}
              className="btn-primary"
            >
              建立第一個選單
            </button>
          </div>
        ) : (
          <div className="menu-items">
            {buildMenuTree(menus).map(item => renderMenuItem(item))}
          </div>
        )}
      </div>

      <style jsx>{`
        .menu-manage-page {
          padding: 2rem;
          max-width: 1200px;
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

        .header-controls {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .company-select {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
        }

        .current-company {
          padding: 0.5rem 1rem;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          color: #495057;
          font-weight: 500;
        }

        .menu-item-row {
          border: 1px solid #e9ecef;
          border-radius: 6px;
          margin-bottom: 0.5rem;
          background: white;
        }

        .menu-item-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
        }

        .menu-info {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex: 1;
        }

        .menu-title {
          font-weight: 600;
          color: #333;
        }

        .menu-url {
          color: #666;
          font-size: 0.9rem;
        }

        .menu-status {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .menu-status.active {
          background: #d4edda;
          color: #155724;
        }

        .menu-status.inactive {
          background: #f8d7da;
          color: #721c24;
        }

        .menu-device {
          background: #e9ecef;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
        }

        .menu-sort {
          color: #666;
          font-size: 0.9rem;
        }

        .menu-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-edit, .btn-toggle, .btn-delete, .btn-primary {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background-color 0.2s;
        }

        .btn-edit {
          background: #007bff;
          color: white;
        }

        .btn-edit:hover {
          background: #0056b3;
        }

        .btn-toggle.active {
          background: #ffc107;
          color: #212529;
        }

        .btn-toggle.inactive {
          background: #28a745;
          color: white;
        }

        .btn-delete {
          background: #dc3545;
          color: white;
        }

        .btn-delete:hover {
          background: #c82333;
        }

        .btn-primary {
          background: #28a745;
          color: white;
        }

        .btn-primary:hover {
          background: #218838;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #666;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          color: #666;
        }
      `}</style>
    </div>
  )
}