'use client'

import { useState, useEffect } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import Pagination from '@/components/ui/Pagination'
import '@/styles/pages/coupons-admin.css'

interface CouponTemplate {
  id: number
  name: string
  type: 'PUBLIC' | 'BATCH' | 'CASH'
  discountType: 'PERCENTAGE' | 'FIXED' | 'CASH'
  discountValue: number
  minAmount: number
  maxDiscount?: number
  validFrom: string
  validTo: string
  usageLimit?: number
  description?: string
  isActive: boolean
  createdAt: string
}

export default function CouponsPage() {
  const { user, setUser } = useUserStore()
  const [templates, setTemplates] = useState<CouponTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'distribute'>('list')
  const [userLoaded, setUserLoaded] = useState(false)
  
  // 分頁狀態
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [inputLimit, setInputLimit] = useState(20)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // 新增模板表單狀態
  const [formData, setFormData] = useState({
    name: '',
    type: 'PUBLIC' as 'PUBLIC' | 'BATCH' | 'CASH',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED' | 'CASH',
    discountValue: 0,
    minAmount: 0,
    maxDiscount: '',
    validFrom: '',
    validTo: '',
    usageLimit: '',
    description: ''
  })

  const [createLoading, setCreateLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)

  // 分頁處理函數
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

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

  // 檢查權限 - 臨時移除權限限制
  const hasPermission = () => {
    return true // 允許所有用戶訪問
  }

  // 獲取模板列表 - 支援分頁
  const fetchTemplates = async () => {
    if (!userLoaded || !hasPermission()) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/coupons/templates?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // 檢查後端是否返回分頁格式
        if (data && typeof data === 'object' && 'items' in data) {
          // 後端返回分頁格式 { items: [], total: number, page: number, totalPages: number }
          setTemplates(data.items || [])
          setTotalCount(data.total || 0)
          setTotalPages(data.totalPages || 1)
        } else {
          // 後端返回簡單陣列，進行前端分頁
          const allTemplates = Array.isArray(data) ? data : []
          setTotalCount(allTemplates.length)
          setTotalPages(Math.ceil(allTemplates.length / limit))
          
          const startIndex = (page - 1) * limit
          const endIndex = startIndex + limit
          setTemplates(allTemplates.slice(startIndex, endIndex))
        }
      } else {
        console.error('獲取模板列表失敗:', response.status)
        setTemplates([])
        setTotalCount(0)
        setTotalPages(1)
      }
    } catch (error) {
      console.error('獲取模板列表失敗:', error)
      setTemplates([])
      setTotalCount(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userLoaded) {
      fetchTemplates()
    }
  }, [userLoaded, page, limit])

  // 刪除模板
  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('確定要刪除此優惠碼模板嗎？此操作無法復原。')) {
      return
    }

    setDeleteLoading(templateId)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/coupons/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        // 刪除成功，從列表中移除該項目
        setTemplates(prev => prev.filter(template => template.id !== templateId))
        alert('優惠碼模板刪除成功！')
      } else {
        // 嘗試解析後端錯誤訊息
        try {
          const errorData = await response.json()
          const errorMessage = errorData.message || '刪除失敗，請稍後再試'
          console.error('刪除模板失敗:', response.status, errorMessage)
          alert(errorMessage)
        } catch (parseError) {
          console.error('刪除模板失敗:', response.status)
          alert('刪除失敗，請稍後再試')
        }
      }
    } catch (error) {
      console.error('刪除模板失敗:', error)
      alert('刪除失敗，請稍後再試')
    } finally {
      setDeleteLoading(null)
    }
  }


  // 統一派發處理：根據優惠碼類型跳轉到不同頁面
  const handleDispatch = (template: CouponTemplate) => {
    if (template.type === 'PUBLIC') {
      // 公共優惠碼：跳轉到 distribute 頁面
      window.location.href = `/admin/coupons/distribute?templateId=${template.id}&type=public`
    } else {
      // 批量優惠碼：跳轉到 distribute 頁面的批量發放頁籤
      window.location.href = `/admin/coupons/distribute?templateId=${template.id}&type=batch&tab=batch`
    }
  }

  // 管理現金優惠券優惠碼
  const handleManageCashCoupon = (template: CouponTemplate) => {
    // 跳轉到現金券管理頁面
    window.location.href = `/admin/coupons/cash-management?templateId=${template.id}`
  }


  // 創建模板
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.validFrom || !formData.validTo) {
      alert('請填寫必填欄位')
      return
    }

    if (new Date(formData.validFrom) >= new Date(formData.validTo)) {
      alert('有效期開始時間必須早於結束時間')
      return
    }

    if (formData.discountType === 'PERCENTAGE' && (formData.discountValue < 1 || formData.discountValue > 99)) {
      alert('百分比折扣必須在1-99之間')
      return
    }

    setCreateLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/coupons/templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
          usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
          validFrom: new Date(formData.validFrom),
          validTo: new Date(formData.validTo)
        })
      })

      if (response.ok) {
        alert('模板創建成功！')
        setFormData({
          name: '',
          type: 'PUBLIC',
          discountType: 'PERCENTAGE',
          discountValue: 0,
          minAmount: 0,
          maxDiscount: '',
          validFrom: '',
          validTo: '',
          usageLimit: '',
          description: ''
        })
        setActiveTab('list')
        fetchTemplates()
      } else {
        const error = await response.json()
        alert(`創建失敗: ${error.message || '未知錯誤'}`)
      }
    } catch (error) {
      console.error('創建模板失敗:', error)
      alert('創建模板失敗，請稍後再試')
    } finally {
      setCreateLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', { 
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDiscountText = (template: CouponTemplate) => {
    if (template.type === 'CASH') {
      return `現金 ${Math.floor(template.discountValue)} 元`
    } else if (template.discountType === 'PERCENTAGE') {
      return `${Math.floor(template.discountValue)}% 折扣`
    } else {
      return `減 ${Math.floor(template.discountValue)} 元`
    }
  }

  // 檢查優惠碼狀態（根據有效期）
  const getTemplateStatus = (template: CouponTemplate) => {
    const now = new Date()
    const validTo = new Date(template.validTo)
    
    if (now > validTo) {
      return { text: '已結束', class: 'status-expired' }
    } else {
      return { text: '啟用中', class: 'status-active' }
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
            <p>優惠碼管理功能僅限管理員使用</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="lucky-draw-events-container">
      {/* 頁面標題區域 */}
      <div className="lucky-draw-events-header">
        <h1>🎫 優惠碼管理</h1>
        <div className="lucky-draw-events-header-actions">
          <button
            onClick={() => setActiveTab('list')}
            className={`btn-primary ${activeTab === 'list' ? 'active' : ''}`}
          >
            <span>📋</span>
            模板列表
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`btn-primary ${activeTab === 'create' ? 'active' : ''}`}
          >
            <span>➕</span>
            新增模板
          </button>
        </div>
      </div>

      {/* 模板列表 */}
      {activeTab === 'list' && (
        <div className="content-section">
          {/* 表格控制區域 */}
          <div className="table-controls">
            <div className="pagination-control">
              <label htmlFor="page-limit">每頁顯示：</label>
              <input
                type="number"
                id="page-limit"
                value={inputLimit}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val)) setInputLimit(val);
                }}
                min={1}
                className="pagination-input"
              />
              <button
                onClick={() => {
                  const validLimit = Math.max(1, inputLimit);
                  setLimit(validLimit);
                  setPage(1);
                }}
                className="btn-search"
              >
                套用
              </button>
            </div>
            <div className="table-info">
              共 {totalCount} 個優惠碼模板
            </div>
          </div>
          
          {loading ? (
            <div className="loading-spinner">
              <div>⏳ 載入中...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>🎫 標題</th>
                    <th>🏷️ 類型</th>
                    <th>💰 折扣內容</th>
                    <th>📋 使用條件</th>
                    <th>⏰ 有效期</th>
                    <th>📊 狀態</th>
                    <th>⚙️ 操作</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template) => (
                    <tr key={template.id}>
                      <td>
                        <div className="coupon-info">
                          <div className="coupon-name">{template.name}</div>
                          {template.description && (
                            <div className="coupon-description">{template.description}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`type-badge ${template.type === 'PUBLIC' ? 'public' : template.type === 'CASH' ? 'cash' : 'batch'}`}>
                          {template.type === 'PUBLIC' ? '🌐 公共優惠碼' : 
                           template.type === 'CASH' ? '💰 現金優惠券' : 
                           '📦 批量優惠碼'}
                        </span>
                      </td>
                      <td>
                        <div className="discount-info">
                          <div className="discount-value">{getDiscountText(template)}</div>
                          {template.maxDiscount && (
                            <div className="max-discount">最高減 {Math.floor(template.maxDiscount)} 元</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="condition-info">
                          {template.type === 'CASH' ? (
                            <>
                              <div className="min-amount">直接兌換</div>
                              {template.usageLimit && (
                                <div className="usage-limit">限兌 {Math.floor(template.usageLimit)} 次</div>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="min-amount">
                                {template.minAmount > 0 ? `消費滿 ${Math.floor(template.minAmount)} 元` : '無限制'}
                              </div>
                              {template.usageLimit && (
                                <div className="usage-limit">限用 {Math.floor(template.usageLimit)} 次</div>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="time-info">
                          <div className="time-start">
                            🟢 {formatDate(template.validFrom)}
                          </div>
                          <div className="time-end">
                            🔴 {formatDate(template.validTo)}
                          </div>
                        </div>
                      </td>
                      <td>
                        {(() => {
                          const status = getTemplateStatus(template)
                          return (
                            <button className={`status-toggle ${status.class}`}>
                              {status.text === '已結束' ? '🔴 已結束' : '✅ 啟用中'}
                            </button>
                          )
                        })()}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {template.type !== 'CASH' && (
                            <button 
                              className="btn-distribute"
                              onClick={() => handleDispatch(template)}
                            >
                              <span>🚀</span>
                              派發
                            </button>
                          )}
                          {template.type === 'CASH' && (
                            <button 
                              className="btn-distribute"
                              onClick={() => handleManageCashCoupon(template)}
                            >
                              <span>💰</span>
                              管理優惠碼
                            </button>
                          )}
                          <button 
                            className="btn-delete"
                            onClick={() => handleDeleteTemplate(template.id)}
                            disabled={deleteLoading === template.id}
                          >
                            {deleteLoading === template.id ? (
                              <>
                                <span>⏳</span>
                                刪除中...
                              </>
                            ) : (
                              <>
                                <span>🗑️</span>
                                刪除
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {templates.length === 0 && !loading && (
                <div className="no-data">
                  <img src="/no-information.webp" alt="無資料" />
                  <p>尚無優惠碼模板</p>
                  <button 
                    onClick={() => setActiveTab('create')}
                    className="btn-submit"
                    style={{ marginTop: '16px' }}
                  >
                    <span>✨</span>
                    立即新增模板
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 通用分頁元件 */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={limit}
            onPageChange={handlePageChange}
            showPageSizeSelector={false}
            loading={loading}
          />
        </div>
      )}

      {/* 新增模板表單 */}
      {activeTab === 'create' && (
        <div className="content-section">
          <div className="form-section">
            <h3>新增優惠碼模板</h3>
            
            <form onSubmit={handleCreateTemplate}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label required">
                    🎫 模板名稱
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-input"
                    placeholder="例如：新用戶專屬優惠"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">
                    🏷️ 優惠碼類型
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'PUBLIC' | 'BATCH' })}
                    className="form-select"
                  >
                    <option value="PUBLIC">🌐 公共優惠碼 (一組代碼多人使用)</option>
                    <option value="BATCH">📦 批量優惠碼 (批量生成唯一代碼)</option>
                    <option value="CASH">💰 現金優惠券 (直接加到錢包)</option>
                  </select>
                </div>

                {formData.type !== 'CASH' && (
                  <div className="form-group">
                    <label className="form-label required">
                      💰 折扣類型
                    </label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'PERCENTAGE' | 'FIXED' })}
                      className="form-select"
                    >
                      <option value="PERCENTAGE">📊 百分比折扣</option>
                      <option value="FIXED">💵 固定金額折扣</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label required">
                    {formData.type === 'CASH' ? '💰 現金金額' : '🔢 折扣值'}
                  </label>
                  <div className="input-with-icon">
                    <input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        discountValue: Number(e.target.value),
                        discountType: formData.type === 'CASH' ? 'CASH' : formData.discountType
                      })}
                      className="form-input"
                      placeholder={formData.type === 'CASH' ? '100' : (formData.discountType === 'PERCENTAGE' ? '10' : '100')}
                      min="0"
                      required
                    />
                    <span className="input-icon">
                      {formData.type === 'CASH' ? '元' : (formData.discountType === 'PERCENTAGE' ? '%' : '元')}
                    </span>
                  </div>
                  {formData.type === 'CASH' ? (
                    <p className="form-help">💡 會員兌換後，此金額將直接加到錢包</p>
                  ) : formData.discountType === 'PERCENTAGE' ? (
                    <p className="form-help">輸入 10 表示 10% 折扣</p>
                  ) : null}
                </div>

                {formData.type !== 'CASH' && (
                  <div className="form-group">
                    <label className="form-label">
                      💳 最低消費金額
                    </label>
                    <input
                      type="number"
                      value={formData.minAmount}
                      onChange={(e) => setFormData({ ...formData, minAmount: Number(e.target.value) })}
                      className="form-input"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                )}

                {formData.discountType === 'PERCENTAGE' && formData.type !== 'CASH' && (
                  <div className="form-group">
                    <label className="form-label">
                      🏆 最大折扣金額
                    </label>
                    <input
                      type="number"
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                      className="form-input"
                      placeholder="1000"
                      min="0"
                    />
                    <p className="form-help">限制百分比折扣的最大金額</p>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label required">
                    📅 有效期開始
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">
                    📅 有效期結束
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.validTo}
                    onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                {(formData.type === 'PUBLIC' || formData.type === 'CASH') && (
                  <div className="form-group">
                    <label className="form-label">
                      🔄 使用次數限制
                    </label>
                    <input
                      type="number"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                      className="form-input"
                      placeholder="100"
                      min="1"
                    />
                    <p className="form-help">
                      {formData.type === 'CASH' ? '現金優惠券的總兌換次數限制' : '公共優惠碼的總使用次數限制'}
                    </p>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  📝 描述說明
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="form-textarea"
                  placeholder="優惠碼的詳細說明..."
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="btn-cancel"
                >
                  ❌ 取消
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="btn-submit"
                >
                  {createLoading ? '⏳ 創建中...' : '✨ 創建模板'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  )
}