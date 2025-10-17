'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/hooks/use-user-store'
import '@/styles/pages/menu-form.css'

interface MenuItem {
  id: number
  title: string
  parent_id?: number
}

export default function NewMenuPage() {
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    target_blank: false,
    icon: '',
    sort_order: 0,
    device_type: 'both' as 'desktop' | 'mobile' | 'both',
    status: 'active' as 'active' | 'inactive',
    parent_id: '',
    company_id: 0, // 初始為 0，等待用戶信息載入
  })
  
  const [parentMenus, setParentMenus] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const router = useRouter()
  
  const currentUser = useUserStore((state) => state.user)
  const role = currentUser?.role ?? ""
  const userCompanyId = currentUser?.company?.id || currentUser?.companyId
  
  // 根據角色決定是否顯示公司選擇器
  const canSelectCompany = ["SUPER_ADMIN", "GLOBAL_ADMIN"].includes(role)

  // 初始化用戶信息和公司設定
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
        // 無法解析用戶資料，靜默處理
      }
    }
  }, [])

  useEffect(() => {
    if (!currentUser) return // 等待用戶信息載入
    
    // 根據角色設定預設公司
    if (role === "AGENT_OWNER" && userCompanyId) {
      setFormData(prev => ({ ...prev, company_id: userCompanyId }))
    } else if (canSelectCompany) {
      setFormData(prev => ({ ...prev, company_id: 1 })) // 超級管理員和全域管理員預設選擇公司A
    }
    setInitializing(false)
  }, [role, userCompanyId, currentUser, canSelectCompany])

  // 載入可選的父選單
  useEffect(() => {
    const fetchParentMenus = async () => {
      // 如果還沒有設定公司 ID，不發送請求
      if (formData.company_id === 0) {
        return
      }
      
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

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
          // 只顯示最多2級的選單作為父選單選項
          const availableParents = data.filter((menu: any) => {
            return !menu.parent_id || !menu.parent?.parent_id
          })
          setParentMenus(availableParents)
        }
      } catch (error) {
        // 載入父選單失敗，靜默處理
      }
    }

    if (!initializing) {
      fetchParentMenus()
    }
  }, [formData.company_id, initializing])

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
        `${process.env.NEXT_PUBLIC_API_BASE}/menu`,
        {
          method: 'POST',
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
        alert(`建立失敗: ${error.message || '未知錯誤'}`)
      }
    } catch (error) {
      // 建立選單錯誤，靜默處理
      alert('建立選單失敗，請稍後再試')
      alert('建立失敗')
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

  if (initializing) {
    return (
      <div className="menu-form-container">
        <div className="loading-spinner">
          <div>⏳ 載入中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="menu-form-container">
      {/* 頁面標題區域 */}
      <div className="menu-form-header">
        <h1>➕ 新增選單</h1>
      </div>

      {/* 表單內容 */}
      <div className="menu-form-content">
        <form onSubmit={handleSubmit}>
          {/* 基本設定區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>📋</span>
              基本設定
            </div>
            
            <div className="form-grid">
              {/* 公司選擇 - 根據角色顯示不同界面 */}
              {canSelectCompany ? (
                <div className="form-group">
                  <label htmlFor="company_id" className="form-label">🏢 公司</label>
                  <div className="enhanced-select">
                    <select
                      id="company_id"
                      name="company_id"
                      className="form-select"
                      value={formData.company_id}
                      onChange={handleChange}
                      required
                    >
                      <option value={1}>公司 A</option>
                      <option value={2}>公司 B</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">🏢 公司</label>
                  <div className="company-display">
                    🏢 {currentUser?.company?.name || `公司 ${userCompanyId}`}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="parent_id" className="form-label">📁 父選單</label>
                <div className="enhanced-select">
                  <select
                    id="parent_id"
                    name="parent_id"
                    className="form-select"
                    value={formData.parent_id}
                    onChange={handleChange}
                  >
                    <option value="">無 (頂級選單)</option>
                    {parentMenus.map(menu => (
                      <option key={menu.id} value={menu.id} className={menu.parent_id ? 'parent-menu-option level-2' : 'parent-menu-option level-1'}>
                        {menu.parent_id ? `　└ ${menu.title}` : menu.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-hint">
                  選擇此選單的父級選單，留空則為頂級選單
                </div>
              </div>
            </div>

            <div className="form-grid single-column">
              <div className="form-group">
                <label htmlFor="title" className="form-label required">📋 選單標題</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className="form-input"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="請輸入選單標題"
                />
                <div className="form-hint">
                  顯示在選單中的文字，建議簡潔明瞭
                </div>
              </div>
            </div>
          </div>

          {/* 連結設定區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>🔗</span>
              連結設定
            </div>
            
            <div className="form-grid single-column">
              <div className="form-group">
                <label htmlFor="url" className="form-label">🔗 連結網址</label>
                <input
                  type="text"
                  id="url"
                  name="url"
                  className="form-input"
                  value={formData.url}
                  onChange={handleChange}
                  placeholder="https://example.com 或 /page 或 /products/loans"
                />
                <div className="form-hint">
                  可以輸入完整網址 (https://...) 或站內路徑 (/page)，留空則為純分類選單
                </div>
                {formData.url && (
                  <div className="url-preview">
                    🔗 預覽：{formData.url}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">🪟 開啟方式</label>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="target_blank"
                    name="target_blank"
                    checked={formData.target_blank}
                    onChange={handleChange}
                  />
                  <label htmlFor="target_blank">在新視窗開啟</label>
                </div>
                <div className="form-hint">
                  勾選後點擊選單會在新分頁開啟，適用於外部連結
                </div>
              </div>
            </div>
          </div>

          {/* 外觀設定區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>🎨</span>
              外觀設定
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="icon" className="form-label">🎨 圖示 CSS 類別</label>
                <input
                  type="text"
                  id="icon"
                  name="icon"
                  className="form-input"
                  value={formData.icon}
                  onChange={handleChange}
                  placeholder="例如: fas fa-home, bi bi-house"
                />
                <div className="form-hint">
                  支援 Font Awesome、Bootstrap Icons 等圖示庫
                </div>
                {formData.icon && (
                  <div className="icon-preview">
                    <i className={formData.icon}></i>
                    圖示預覽：{formData.icon}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="sort_order" className="form-label">🔢 排序</label>
                <div className="number-input-group">
                  <input
                    type="number"
                    id="sort_order"
                    name="sort_order"
                    className="form-input"
                    value={formData.sort_order}
                    onChange={handleChange}
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div className="sort-order-preview">
                  💡 數字越小排序越前面，相同層級的選單會依此排序
                </div>
              </div>
            </div>
          </div>

          {/* 顯示設定區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>📱</span>
              顯示設定
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="device_type" className="form-label">📱 顯示裝置</label>
                <div className="enhanced-select">
                  <select
                    id="device_type"
                    name="device_type"
                    className="form-select"
                    value={formData.device_type}
                    onChange={handleChange}
                  >
                    <option value="both">桌面 + 手機</option>
                    <option value="desktop">僅桌面</option>
                    <option value="mobile">僅手機</option>
                  </select>
                </div>
                <div className="device-type-preview">
                  <span className={`device-badge device-${formData.device_type}`}>
                    {formData.device_type === 'desktop' ? '🖥️ 桌面' : 
                     formData.device_type === 'mobile' ? '📱 手機' : '📱🖥️ 全部'}
                  </span>
                </div>
                <div className="form-hint">
                  選擇此選單在哪些裝置上顯示
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="status" className="form-label">📊 狀態</label>
                <div className="enhanced-select">
                  <select
                    id="status"
                    name="status"
                    className="form-select"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="active">啟用</option>
                    <option value="inactive">停用</option>
                  </select>
                </div>
                <div className="status-preview">
                  <span className={`status-badge status-${formData.status}`}>
                    {formData.status === 'active' ? '✅ 啟用' : '❌ 停用'}
                  </span>
                </div>
                <div className="form-hint">
                  停用的選單不會在前台顯示
                </div>
              </div>
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="form-section">
            <div className="form-actions">
              <button
                type="button"
                onClick={() => router.push('/admin/menu')}
                className="btn-secondary"
                disabled={loading}
              >
                <span>↩️</span>
                返回
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                <span>✨</span>
                {loading ? '建立中...' : '建立選單'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}