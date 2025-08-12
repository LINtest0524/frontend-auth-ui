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
    const indent = '　'.repeat(level) // 使用全形空格來表示層級
    const rows = []
    
    // 主項目行
    rows.push(
      <tr key={item.id}>
        <td>{indent}{item.title}</td>
        <td>{item.url || '-'}</td>
        <td>
          <span className={item.status === 'active' ? 'status-active' : 'status-inactive'}>
            {item.status === 'active' ? '啟用' : '停用'}
          </span>
        </td>
        <td>{item.device_type}</td>
        <td>{item.sort_order}</td>
        <td>第 {level + 1} 層</td>
        <td className="fl4">
          <button
            onClick={() => router.push(`/admin/menu/edit/${item.id}`)}
            className="b-btn-s3 b-btn-c1 mlr10"
          >
            編輯
          </button>
          <button
            onClick={() => handleToggleStatus(item.id, item.status)}
            className={`b-btn-s3 ${item.status === 'active' ? 'b-btn-c2' : 'b-btn-c4'} mlr10`}
          >
            {item.status === 'active' ? '停用' : '啟用'}
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="b-btn-s3 b-btn-c3 mlr10"
          >
            刪除
          </button>
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
    return <div className="b-ibox"><p>載入中...</p></div>
  }

  return (
    <div className="b-ibox">
      <h1>選單管理</h1>
      
      <div className="b-ibox-s">
        <div className="w100 fo5 mb15">
          <div className="w50 fl4">
            {/* 只有超級管理員和全域管理員可以選擇公司 */}
            {canSelectCompany && (
              <>
                <label htmlFor="companySelect">管理公司&nbsp;</label>
                <select
                  id="companySelect"
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(Number(e.target.value))}
                  className="txtbox1 mr20"
                >
                  <option value={1}>公司 A</option>
                  <option value={2}>公司 B</option>
                </select>
              </>
            )}
            
            {/* 代理商老闆顯示自己的公司名稱 */}
            {role === "AGENT_OWNER" && (
              <span className="mr20">
                管理公司：{currentUser?.company?.name || `公司 ${userCompanyId}`}
              </span>
            )}
          </div>
          
          <div className="w50 fl6">
            <button
              onClick={() => router.push('/admin/menu/new')}
              className="b-btn-s2 b-btn-c4"
            >
              新增選單
            </button>
          </div>
        </div>

        {menus.length === 0 ? (
          <div className="b-no-information w100 fd5">
            <img src="/no-information.webp" alt="無資料" className="mb25" />
            <p>尚未建立任何選單</p>
            <button
              onClick={() => router.push('/admin/menu/new')}
              className="b-btn-s2 b-btn-c4 mt15"
            >
              建立第一個選單
            </button>
          </div>
        ) : (
          <table className="b-table-box admin-table mb15">
            <thead>
              <tr>
                <th>選單標題</th>
                <th>連結</th>
                <th>狀態</th>
                <th>裝置類型</th>
                <th>排序</th>
                <th>層級</th>
                <th className="th-last">操作</th>
              </tr>
            </thead>
            <tbody>
              {buildMenuTree(menus).map(item => renderMenuItem(item)).flat()}
            </tbody>
          </table>
        )}
      </div>
      
      <style jsx>{`
        .status-active {
          background: #d4edda;
          color: #155724;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .status-inactive {
          background: #f8d7da;
          color: #721c24;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}