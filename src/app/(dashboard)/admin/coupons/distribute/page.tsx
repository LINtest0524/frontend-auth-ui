'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useUserStore } from '@/hooks/use-user-store'
import '@/styles/pages/coupons-admin.css'

interface CouponTemplate {
  id: number
  name: string
  type: 'PUBLIC' | 'BATCH'
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  minAmount: number
  maxDiscount?: number
  validFrom: string
  validTo: string
  usageLimit?: number
  description?: string
  isActive: boolean
}

interface Tag {
  id: number
  name: string
  backgroundColor: string
  textColor: string
  shape: string
  isActive: boolean
}

export default function CouponDistributePage() {
  const { user, setUser } = useUserStore()
  const searchParams = useSearchParams()
  const [templates, setTemplates] = useState<CouponTemplate[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [distributing, setDistributing] = useState(false)
  const [userLoaded, setUserLoaded] = useState(false)
  
  // 公共優惠碼表單
  const [publicForm, setPublicForm] = useState({
    templateId: '',
    code: '',
    usageLimit: ''
  })

  // 批量優惠碼表單
  const [batchForm, setBatchForm] = useState({
    templateId: '',
    targetType: 'TAG_GROUP' as 'TAG_GROUP' | 'ALL_USERS' | 'SPECIFIC_USERS',
    tagIds: [] as number[],
    userIds: [] as number[],
    quantity: ''
  })

  // 根據 URL 參數設置初始頁籤
  const getInitialTab = (): 'public' | 'batch' => {
    const tabParam = searchParams.get('tab')
    const typeParam = searchParams.get('type')
    
    if (tabParam === 'batch' || typeParam === 'batch') {
      return 'batch'
    }
    if (typeParam === 'public') {
      return 'public'
    }
    return 'public' // 預設為公共優惠碼
  }

  const [activeTab, setActiveTab] = useState<'public' | 'batch'>(getInitialTab())

  // 監聽 URL 參數變化，動態切換頁籤和預填模板
  useEffect(() => {
    const newTab = getInitialTab()
    if (newTab !== activeTab) {
      setActiveTab(newTab)
    }
    
    // 如果有 templateId 參數，預填到對應表單
    const templateId = searchParams.get('templateId')
    if (templateId) {
      if (newTab === 'public') {
        setPublicForm(prev => ({ ...prev, templateId }))
      } else if (newTab === 'batch') {
        setBatchForm(prev => ({ ...prev, templateId }))
      }
    }
  }, [searchParams])

  // 從 localStorage 恢復用戶狀態
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser && !user) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
      } catch (error) {
        console.error('解析用戶資料失敗:', error)
      }
    }
    setUserLoaded(true)
  }, [user, setUser])

  // 檢查權限
  const hasPermission = () => {
    if (!user?.role) return false
    return ['SUPER_ADMIN', 'GLOBAL_ADMIN', 'AGENT_OWNER', 'AGENT_SUPPORT', 'AGENT_LEVEL_1'].includes(user.role)
  }

  // 獲取模板列表
  const fetchTemplates = async () => {
    if (!userLoaded || !hasPermission()) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/coupons/templates`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.filter((t: CouponTemplate) => t.isActive))
      } else {
        console.error('獲取模板列表失敗:', response.status)
      }
    } catch (error) {
      console.error('獲取模板列表失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  // 獲取標籤列表
  const fetchTags = async () => {
    if (!hasPermission()) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/messages/tags`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTags(data.tags || [])
      }
    } catch (error) {
      console.error('獲取標籤列表失敗:', error)
    }
  }

  useEffect(() => {
    if (userLoaded) {
      fetchTemplates()
      fetchTags()
    }
  }, [userLoaded])

  // 發放公共優惠碼
  const handleDistributePublic = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!publicForm.templateId || !publicForm.code || !publicForm.usageLimit) {
      alert('請填寫所有必填欄位')
      return
    }

    setDistributing(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/coupons/distribute/public`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: Number(publicForm.templateId),
          code: publicForm.code.toUpperCase(),
          usageLimit: Number(publicForm.usageLimit)
        })
      })

      if (response.ok) {
        alert('公共優惠碼發放成功！')
        setPublicForm({
          templateId: '',
          code: '',
          usageLimit: ''
        })
      } else {
        const error = await response.json()
        alert(`發放失敗: ${error.message || '未知錯誤'}`)
      }
    } catch (error) {
      console.error('發放公共優惠碼失敗:', error)
      alert('發放失敗，請稍後再試')
    } finally {
      setDistributing(false)
    }
  }

  // 發放批量優惠碼
  const handleDistributeBatch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!batchForm.templateId) {
      alert('請選擇優惠碼模板')
      return
    }

    if (batchForm.targetType === 'TAG_GROUP' && batchForm.tagIds.length === 0) {
      alert('請選擇標籤群組')
      return
    }

    if (batchForm.targetType === 'ALL_USERS' && !batchForm.quantity) {
      alert('請輸入生成數量')
      return
    }

    if (batchForm.targetType === 'SPECIFIC_USERS' && batchForm.userIds.length === 0) {
      alert('請選擇指定用戶')
      return
    }

    setDistributing(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/coupons/distribute/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: Number(batchForm.templateId),
          targetType: batchForm.targetType,
          tagIds: batchForm.tagIds,
          userIds: batchForm.userIds,
          quantity: batchForm.quantity ? Number(batchForm.quantity) : undefined
        })
      })

      if (response.ok) {
        const result = await response.json()
        const distributedCount = result.distributedCount || result.count || 0
        alert(`批量優惠碼發放成功！共發放 ${distributedCount} 張優惠碼`)
        setBatchForm({
          templateId: '',
          targetType: 'TAG_GROUP',
          tagIds: [],
          userIds: [],
          quantity: ''
        })
      } else {
        const error = await response.json()
        alert(`發放失敗: ${error.message || '未知錯誤'}`)
      }
    } catch (error) {
      console.error('發放批量優惠碼失敗:', error)
      alert('發放失敗，請稍後再試')
    } finally {
      setDistributing(false)
    }
  }

  const getDiscountText = (template: CouponTemplate) => {
    if (template.discountType === 'PERCENTAGE') {
      return `${Math.floor(template.discountValue)}% 折扣`
    } else {
      return `減 ${Math.floor(template.discountValue)} 元`
    }
  }

  // 如果用戶狀態還在載入中，顯示載入狀態
  if (!userLoaded) {
    return (
      <div className="lucky-draw-events-container">
        <div className="content-section">
          <div className="loading-message">
            <h3>⏳ 載入中...</h3>
            <p>正在驗證用戶權限...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!hasPermission()) {
    return (
      <div className="lucky-draw-events-container">
        <div className="content-section">
          <div className="permission-denied">
            <h3>權限不足</h3>
            <p>優惠碼發放功能僅限管理員使用</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="lucky-draw-events-container">
      {/* 頁面標題區域 */}
      <div className="lucky-draw-events-header">
        <h1>🎁 發放優惠碼</h1>
        <div className="lucky-draw-events-header-actions">
          <button
            onClick={() => setActiveTab('public')}
            className={`btn-primary ${activeTab === 'public' ? 'active' : ''}`}
          >
            <span>🎫</span>
            公共優惠碼
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`btn-primary ${activeTab === 'batch' ? 'active' : ''}`}
          >
            <span>🏷️</span>
            批量優惠碼
          </button>
        </div>
      </div>

      {/* 公共優惠碼發放 */}
      {activeTab === 'public' && (
        <div className="content-section">
          <div className="form-section">
            <h3>🎫 發放公共優惠碼</h3>
            <p className="form-description">
              📢 公共優惠碼是一組固定代碼，所有人都可以使用，但每個帳號只能使用一次。
            </p>
            
            {loading ? (
              <div className="loading-spinner">
                <div>⏳ 載入模板中...</div>
              </div>
            ) : (
              <form onSubmit={handleDistributePublic}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label required">
                      🎯 選擇模板
                    </label>
                    <select
                      value={publicForm.templateId}
                      onChange={(e) => setPublicForm({ ...publicForm, templateId: e.target.value })}
                      className="form-select"
                      required
                    >
                      <option value="">請選擇公共優惠碼模板</option>
                      {templates
                        .filter(t => t.type === 'PUBLIC')
                        .map(template => (
                          <option key={template.id} value={template.id}>
                            {template.name} - {getDiscountText(template)}
                          </option>
                        ))
                      }
                    </select>
                    {templates.filter(t => t.type === 'PUBLIC').length === 0 && (
                      <p className="form-help text-orange-600">
                        ⚠️ 沒有可用的公共優惠碼模板，請先創建模板
                      </p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label required">
                      🏷️ 自定義優惠碼
                    </label>
                    <input
                      type="text"
                      value={publicForm.code}
                      onChange={(e) => setPublicForm({ ...publicForm, code: e.target.value.toUpperCase() })}
                      className="form-input"
                      placeholder="例如：WELCOME2024、SAVE50"
                      maxLength={20}
                      pattern="[A-Z0-9]+"
                      required
                      style={{ fontFamily: 'monospace', fontWeight: 'bold' }}
                    />
                    <p className="form-help">
                      ✨ 建議使用易記的英文字母和數字組合，系統會自動轉為大寫
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="form-label required">
                      🔢 使用次數限制
                    </label>
                    <input
                      type="number"
                      value={publicForm.usageLimit}
                      onChange={(e) => setPublicForm({ ...publicForm, usageLimit: e.target.value })}
                      className="form-input"
                      placeholder="100"
                      min="1"
                      max="99999"
                      required
                    />
                    <p className="form-help">
                      📊 此優惠碼總共可以被使用的次數（所有用戶共享）
                    </p>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => window.location.href = '/admin/coupons'}
                    className="btn-cancel"
                  >
                    ❌ 返回列表
                  </button>
                  <button
                    type="submit"
                    disabled={distributing || templates.filter(t => t.type === 'PUBLIC').length === 0}
                    className="btn-submit"
                  >
                    {distributing ? '⏳ 發放中...' : '🎁 發放公共優惠碼'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 批量優惠碼發放 */}
      {activeTab === 'batch' && (
        <div className="content-section">
          <div className="form-section">
            <h3>🏷️ 發放批量優惠碼</h3>
            <p className="form-description">
              📦 批量優惠碼會為每個目標用戶生成唯一的專屬代碼，每個代碼只能使用一次。
            </p>
            
            {loading ? (
              <div className="loading-spinner">
                <div>⏳ 載入模板中...</div>
              </div>
            ) : (
              <form onSubmit={handleDistributeBatch}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label required">
                      🎯 選擇模板
                    </label>
                    <select
                      value={batchForm.templateId}
                      onChange={(e) => setBatchForm({ ...batchForm, templateId: e.target.value })}
                      className="form-select"
                      required
                    >
                      <option value="">請選擇批量優惠碼模板</option>
                      {templates
                        .filter(t => t.type === 'BATCH')
                        .map(template => (
                          <option key={template.id} value={template.id}>
                            {template.name} - {getDiscountText(template)}
                          </option>
                        ))
                      }
                    </select>
                    {templates.filter(t => t.type === 'BATCH').length === 0 && (
                      <p className="form-help text-orange-600">
                        ⚠️ 沒有可用的批量優惠碼模板，請先創建模板
                      </p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label required">
                      👥 發放對象
                    </label>
                    <select
                      value={batchForm.targetType}
                      onChange={(e) => setBatchForm({ 
                        ...batchForm, 
                        targetType: e.target.value as any,
                        tagIds: [],
                        userIds: [],
                        quantity: ''
                      })}
                      className="form-select"
                    >
                      <option value="TAG_GROUP">🏷️ 標籤群組</option>
                      <option value="ALL_USERS">🌐 所有用戶</option>
                      <option value="SPECIFIC_USERS">👤 指定用戶</option>
                    </select>
                  </div>

                  {/* 標籤群組選擇 */}
                  {batchForm.targetType === 'TAG_GROUP' && (
                    <div className="form-group">
                      <label className="form-label required">
                        🏷️ 選擇標籤群組
                      </label>
                      <div className="tags-selection">
                        {tags.length === 0 ? (
                          <p className="form-help text-orange-600">
                            ⚠️ 沒有可用的標籤群組
                          </p>
                        ) : (
                          tags.map(tag => (
                            <label key={tag.id} className="tag-checkbox">
                              <input
                                type="checkbox"
                                checked={batchForm.tagIds.includes(tag.id)}
                                disabled={!tag.isActive}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setBatchForm({
                                      ...batchForm,
                                      tagIds: [...batchForm.tagIds, tag.id]
                                    })
                                  } else {
                                    setBatchForm({
                                      ...batchForm,
                                      tagIds: batchForm.tagIds.filter(id => id !== tag.id)
                                    })
                                  }
                                }}
                              />
                              <span 
                                className={`tag-name ${tag.shape || ''} ${!tag.isActive ? 'inactive' : ''}`}
                                style={{
                                  backgroundColor: tag.backgroundColor || '#f3f4f6',
                                  color: tag.textColor || '#374151',
                                  opacity: tag.isActive ? 1 : 0.5
                                }}
                              >
                                {tag.name}
                                {!tag.isActive && <span style={{ fontSize: '10px' }}> (停用)</span>}
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                      {batchForm.tagIds.length > 0 && (
                        <p className="form-help">
                          ✅ 已選擇 {batchForm.tagIds.length} 個標籤群組
                        </p>
                      )}
                    </div>
                  )}

                  {/* 所有用戶數量設定 */}
                  {batchForm.targetType === 'ALL_USERS' && (
                    <div className="form-group">
                      <label className="form-label required">
                        🔢 生成數量
                      </label>
                      <input
                        type="number"
                        value={batchForm.quantity}
                        onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })}
                        className="form-input"
                        placeholder="100"
                        min="1"
                        max="1000"
                        required
                      />
                      <p className="form-help">
                        📊 將隨機發放給指定數量的用戶（最多1000張）
                      </p>
                    </div>
                  )}

                  {/* 指定用戶選擇 */}
                  {batchForm.targetType === 'SPECIFIC_USERS' && (
                    <div className="form-group">
                      <label className="form-label required">
                        👤 指定用戶 ID
                      </label>
                      <textarea
                        value={batchForm.userIds.join(', ')}
                        onChange={(e) => {
                          const ids = e.target.value
                            .split(',')
                            .map(id => parseInt(id.trim()))
                            .filter(id => !isNaN(id))
                          setBatchForm({ ...batchForm, userIds: ids })
                        }}
                        className="form-textarea"
                        rows={3}
                        placeholder="請輸入用戶ID，用逗號分隔，例如：1, 2, 3, 4"
                      />
                      <p className="form-help">
                        📝 輸入用戶ID，用逗號分隔（例如：1, 2, 3, 4）
                      </p>
                      {batchForm.userIds.length > 0 && (
                        <p className="form-help">
                          ✅ 將發放給 {batchForm.userIds.length} 位指定用戶
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => window.location.href = '/admin/coupons'}
                    className="btn-cancel"
                  >
                    ❌ 返回列表
                  </button>
                  <button
                    type="submit"
                    disabled={distributing || templates.filter(t => t.type === 'BATCH').length === 0}
                    className="btn-submit"
                  >
                    {distributing ? '⏳ 發放中...' : '📦 發放批量優惠碼'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}