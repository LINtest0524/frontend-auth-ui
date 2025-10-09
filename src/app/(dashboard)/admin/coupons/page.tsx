'use client'

import { useState, useEffect } from 'react'
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
  createdAt: string
}

export default function CouponsPage() {
  const { user, setUser } = useUserStore()
  const [templates, setTemplates] = useState<CouponTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'distribute'>('list')
  const [userLoaded, setUserLoaded] = useState(false)

  // 新增模板表單狀態
  const [formData, setFormData] = useState({
    name: '',
    type: 'PUBLIC' as 'PUBLIC' | 'BATCH',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
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
  const [showDistributeModal, setShowDistributeModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<CouponTemplate | null>(null)
  const [distributeType, setDistributeType] = useState<'ALL' | 'TAG_GROUP'>('ALL')
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [availableTags, setAvailableTags] = useState<any[]>([])
  const [distributeLoading, setDistributeLoading] = useState(false)

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
    return ['SUPER_ADMIN', 'GLOBAL_ADMIN', 'AGENT_OWNER', 'AGENT_SUPPORT'].includes(user.role)
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
        setTemplates(data)
      } else {
        console.error('獲取模板列表失敗:', response.status)
      }
    } catch (error) {
      console.error('獲取模板列表失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userLoaded) {
      fetchTemplates()
    }
  }, [userLoaded])

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
        console.error('刪除模板失敗:', response.status)
        alert('刪除失敗，請稍後再試')
      }
    } catch (error) {
      console.error('刪除模板失敗:', error)
      alert('刪除失敗，請稍後再試')
    } finally {
      setDeleteLoading(null)
    }
  }

  // 獲取標籤列表
  const fetchTags = async () => {
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
        console.log('🏷️ 優惠券發放 - 收到標籤數據:', data)
        setAvailableTags(data.tags || [])
      } else {
        console.error('獲取標籤列表失敗:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('獲取標籤列表失敗:', error)
    }
  }

  // 打開發放彈窗
  const handleDistribute = (template: CouponTemplate) => {
    setSelectedTemplate(template)
    setShowDistributeModal(true)
    fetchTags()
  }

  // 執行發放
  const handleExecuteDistribute = async () => {
    if (!selectedTemplate) return

    setDistributeLoading(true)
    try {
      const token = localStorage.getItem('token')
      const payload = {
        templateId: selectedTemplate.id,
        targetType: distributeType === 'ALL' ? 'ALL_USERS' : 'TAG_GROUP',
        tagIds: distributeType === 'TAG_GROUP' ? selectedTags : undefined
      }

      console.log('🎁 發放優惠券請求:', payload)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/coupons/distribute/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      console.log('📡 後端響應狀態:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('✅ 發放成功結果:', result)
        alert(`優惠券發放成功！共發放給 ${result.distributedCount} 位用戶`)
        setShowDistributeModal(false)
        setSelectedTemplate(null)
        setSelectedTags([])
      } else {
        const error = await response.json()
        console.error('❌ 發放失敗錯誤:', error)
        alert(`發放失敗：${error.message}`)
      }
    } catch (error) {
      console.error('發放失敗:', error)
      alert('發放失敗，請稍後再試')
    } finally {
      setDistributeLoading(false)
    }
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
            <div className="table-info">
              共 {templates.length} 個優惠碼模板
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
                        <span className={`type-badge ${template.type === 'PUBLIC' ? 'public' : 'batch'}`}>
                          {template.type === 'PUBLIC' ? '🌐 公共優惠碼' : '📦 批量優惠碼'}
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
                          <div className="min-amount">
                            {template.minAmount > 0 ? `消費滿 ${Math.floor(template.minAmount)} 元` : '無限制'}
                          </div>
                          {template.usageLimit && (
                            <div className="usage-limit">限用 {Math.floor(template.usageLimit)} 次</div>
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
                        <button className={`status-toggle ${template.isActive ? 'status-active' : 'status-inactive'}`}>
                          {template.isActive ? '✅ 啟用中' : '❌ 未啟用'}
                        </button>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {template.type === 'PUBLIC' ? (
                            <button 
                              className="btn-distribute"
                              onClick={() => window.location.href = '/admin/coupons/distribute'}
                            >
                              <span>🌐</span>
                              建立公共碼
                            </button>
                          ) : (
                            <button 
                              className="btn-distribute"
                              onClick={() => handleDistribute(template)}
                            >
                              <span>📦</span>
                              批量發放
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
                  </select>
                </div>

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

                <div className="form-group">
                  <label className="form-label required">
                    🔢 折扣值
                  </label>
                  <div className="input-with-icon">
                    <input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                      className="form-input"
                      placeholder={formData.discountType === 'PERCENTAGE' ? '10' : '100'}
                      min="0"
                      required
                    />
                    <span className="input-icon">
                      {formData.discountType === 'PERCENTAGE' ? '%' : '元'}
                    </span>
                  </div>
                  {formData.discountType === 'PERCENTAGE' && (
                    <p className="form-help">輸入 10 表示 10% 折扣</p>
                  )}
                </div>

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

                {formData.discountType === 'PERCENTAGE' && (
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

                {formData.type === 'PUBLIC' && (
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
                    <p className="form-help">公共優惠碼的總使用次數限制</p>
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


      {/* 發放優惠券彈窗 */}
      {showDistributeModal && (
        <div className="modal-overlay">
          <div className="modal-content distribute-modal">
            <div className="modal-header">
              <h3>🎁 發放優惠券</h3>
              <button 
                className="close-btn"
                onClick={() => setShowDistributeModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="template-info">
                <h4>📋 模板資訊</h4>
                <p><strong>標題：</strong>{selectedTemplate?.name}</p>
                <p><strong>類型：</strong>{selectedTemplate?.discountType === 'PERCENTAGE' ? '百分比折扣' : '固定金額折扣'}</p>
                <p><strong>折扣：</strong>
                  {selectedTemplate?.discountType === 'PERCENTAGE' 
                    ? `${Math.floor(selectedTemplate?.discountValue || 0)}% 折扣` 
                    : `減 $${Math.floor(selectedTemplate?.discountValue || 0)} 元`
                  }
                </p>
              </div>

              <div className="distribute-options">
                <h4>🎯 發放對象</h4>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="distributeType"
                      value="ALL"
                      checked={distributeType === 'ALL'}
                      onChange={(e) => setDistributeType(e.target.value as 'ALL' | 'TAG_GROUP')}
                    />
                    <span>🌐 全部用戶</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="distributeType"
                      value="TAG_GROUP"
                      checked={distributeType === 'TAG_GROUP'}
                      onChange={(e) => setDistributeType(e.target.value as 'ALL' | 'TAG_GROUP')}
                    />
                    <span>🏷️ 標籤群組</span>
                  </label>
                </div>

                {distributeType === 'TAG_GROUP' && (
                  <div className="tag-selection">
                    <h5>選擇標籤群組</h5>
                    <div className="tags-list">
                      {availableTags.map(tag => (
                        <label key={tag.id} className="tag-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedTags.includes(tag.id)}
                            disabled={!tag.isActive}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTags([...selectedTags, tag.id])
                              } else {
                                setSelectedTags(selectedTags.filter(id => id !== tag.id))
                              }
                            }}
                          />
                          <span 
                            className={`tag-name ${tag.shape || ''} ${!tag.isActive ? 'inactive' : ''}`}
                            style={{
                              backgroundColor: tag.backgroundColor || '#f3f4f6',
                              color: tag.textColor || '#374151',
                              opacity: tag.isActive ? 1 : 0.5,
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                          >
                            {tag.name}
                            {!tag.isActive && <span style={{ fontSize: '10px' }}> (停用)</span>}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="preview-section">
                <h4>👥 預覽發放對象</h4>
                <div className="preview-info">
                  {distributeType === 'ALL' ? (
                    <p>將發放給 <strong>所有用戶</strong></p>
                  ) : (
                    <p>將發放給標籤群組：
                      <strong>
                        {selectedTags.map(tagId => {
                          const tag = availableTags.find(t => t.id === tagId)
                          return tag?.name
                        }).filter(Boolean).join('、')}
                      </strong>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={() => setShowDistributeModal(false)}
                disabled={distributeLoading}
              >
                取消
              </button>
              <button 
                className="btn-confirm"
                onClick={handleExecuteDistribute}
                disabled={distributeLoading || (distributeType === 'TAG_GROUP' && selectedTags.length === 0)}
              >
                {distributeLoading ? (
                  <>⏳ 發放中...</>
                ) : (
                  <>🎁 確認發放</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}