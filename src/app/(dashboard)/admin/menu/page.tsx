'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/hooks/use-user-store'
import '@/styles/pages/menu-admin.css'

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
    const rows = []
    
    // 主項目行
    rows.push(
      <tr key={item.id} className={`menu-level-${level + 1}`}>
        <td className={level > 0 ? `menu-indent-${level}` : ''}>
          <div className="menu-title">
            {level > 0 && <span className="menu-level-indicator"></span>}
            {item.title}
          </div>
        </td>
        <td>
          {item.url ? (
            <div className="menu-url" title={item.url}>
              {item.url}
            </div>
          ) : (
            <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>無連結</span>
          )}
        </td>
        <td>
          <span className={`status-badge ${item.status === 'active' ? 'status-active' : 'status-inactive'}`}>
            {item.status === 'active' ? '✅ 啟用' : '❌ 停用'}
          </span>
        </td>
        <td>
          <span className={`device-type-badge device-${item.device_type}`}>
            {item.device_type === 'desktop' ? '🖥️ 桌面' : 
             item.device_type === 'mobile' ? '📱 手機' : '📱🖥️ 全部'}
          </span>
        </td>
        <td>
          <span className="sort-order">{item.sort_order}</span>
        </td>
        <td>
          <span className="level-badge">第 {level + 1} 層</span>
        </td>
        <td>
          <div className="action-buttons">
            <button
              onClick={() => router.push(`/admin/menu/edit/${item.id}`)}
              className="btn-edit"
              title="編輯選單"
            >
              ✏️ 編輯
            </button>
            <button
              onClick={() => handleToggleStatus(item.id, item.status)}
              className={`btn-toggle ${item.status === 'active' ? 'deactivate' : 'activate'}`}
              title={item.status === 'active' ? '停用選單' : '啟用選單'}
            >
              {item.status === 'active' ? '⏸️ 停用' : '▶️ 啟用'}
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              className="btn-delete"
              title="刪除選單"
            >
              🗑️ 刪除
            </button>
          </div>
        </td>
      </tr>
    )
    
    // 遞歸渲染子選單
    if (item.children && item.children.length > 0) {
      item.children.forEach(child => {
        rows.push(...renderMenuItem(child, level + 1))
      })
    }
    
    return rows
  }

  if (loading || selectedCompany === null) {
    return (
      <div className="menu-admin-container">
        <div className="loading-spinner">
          <div>⏳ 載入中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="menu-admin-container">
      {/* 頁面標題區域 */}
      <div className="menu-header">
        <h1>選單管理</h1>
        
        <div className="menu-header-actions">
          {/* 只有超級管理員和全域管理員可以選擇公司 */}
          {canSelectCompany && (
            <div className="company-selector">
              <label htmlFor="companySelect">🏢 管理公司</label>
              <select
                id="companySelect"
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(Number(e.target.value))}
              >
                <option value={1}>公司 A</option>
                <option value={2}>公司 B</option>
              </select>
            </div>
          )}
          
          {/* 代理商老闆顯示自己的公司名稱 */}
          {role === "AGENT_OWNER" && (
            <div className="company-info">
              🏢 管理公司：{currentUser?.company?.name || `公司 ${userCompanyId}`}
            </div>
          )}
          
          <button
            onClick={() => router.push('/admin/menu/new')}
            className="btn-primary"
          >
            ➕ 新增選單
          </button>
        </div>
      </div>

      {/* 內容區域 */}
      {menus.length === 0 ? (
        <div className="content-section">
          <div className="no-data">
            <img src="/no-information.webp" alt="無資料" />
            <p>尚未建立任何選單</p>
            <button
              onClick={() => router.push('/admin/menu/new')}
              className="btn-primary"
            >
              🚀 建立第一個選單
            </button>
          </div>
        </div>
      ) : (
        <div className="content-section">
          <table className="modern-table">
            <thead>
              <tr>
                <th>📋 選單標題</th>
                <th>🔗 連結</th>
                <th>📊 狀態</th>
                <th>📱 裝置類型</th>
                <th>🔢 排序</th>
                <th>📶 層級</th>
                <th>⚙️ 操作</th>
              </tr>
            </thead>
            <tbody>
              {buildMenuTree(menus).map(item => renderMenuItem(item)).flat()}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}