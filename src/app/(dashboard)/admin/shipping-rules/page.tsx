'use client'

import { useState, useEffect } from 'react'
import '@/styles/pages/shipping-rules.css'

interface ShippingRuleItem {
  id?: number
  method: string
  base_fee: number
  free_shipping_threshold: number
  sort_order: number
}

interface ShippingRuleTemplate {
  id?: number
  name: string
  description: string
  is_default: boolean
  is_active: boolean
  company_id?: number
  items: ShippingRuleItem[]
}

export default function ShippingRulesPage() {
  const [templates, setTemplates] = useState<ShippingRuleTemplate[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ShippingRuleTemplate | null>(null)
  const [loading, setLoading] = useState(false)

  // 初始化空的運費規則模板
  const initTemplate = (): ShippingRuleTemplate => ({
    name: '',
    description: '',
    is_default: false,
    is_active: true,
    items: [
      { method: '7-11超商取貨', base_fee: 60, free_shipping_threshold: 399, sort_order: 1 },
      { method: '宅配', base_fee: 210, free_shipping_threshold: 5000, sort_order: 2 }
    ]
  })

  // 載入運費規則模板
  const loadTemplates = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/admin/shipping-rule-templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('載入運費規則失敗:', error)
    }
  }

  // 儲存運費規則模板
  const saveTemplate = async (template: ShippingRuleTemplate) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const url = template.id 
        ? `http://localhost:3001/admin/shipping-rule-templates/${template.id}`
        : 'http://localhost:3001/admin/shipping-rule-templates'
      
      const method = template.id ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(template)
      })

      if (response.ok) {
        await loadTemplates()
        setIsEditing(false)
        setEditingTemplate(null)
        alert('運費規則儲存成功！')
      } else {
        const error = await response.json()
        alert(`儲存失敗: ${error.message}`)
      }
    } catch (error) {
      console.error('儲存運費規則失敗:', error)
      alert('儲存失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  // 刪除運費規則模板
  const deleteTemplate = async (id: number) => {
    if (!confirm('確定要刪除此運費規則嗎？')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/admin/shipping-rule-templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await loadTemplates()
        alert('運費規則刪除成功！')
      } else {
        const error = await response.json()
        alert(`刪除失敗: ${error.message}`)
      }
    } catch (error) {
      console.error('刪除運費規則失敗:', error)
      alert('刪除失敗，請稍後再試')
    }
  }

  // 設為預設
  const setAsDefault = async (id: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/admin/shipping-rule-templates/${id}/set-default`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await loadTemplates()
        alert('已設為預設運費規則！')
      }
    } catch (error) {
      console.error('設定預設失敗:', error)
      alert('設定失敗，請稍後再試')
    }
  }

  // 新增運費項目
  const addShippingItem = () => {
    if (!editingTemplate) return
    
    const newItem: ShippingRuleItem = {
      method: '',
      base_fee: 0,
      free_shipping_threshold: 0,
      sort_order: editingTemplate.items.length + 1
    }
    
    setEditingTemplate({
      ...editingTemplate,
      items: [...editingTemplate.items, newItem]
    })
  }

  // 移除運費項目
  const removeShippingItem = (index: number) => {
    if (!editingTemplate) return
    
    const newItems = editingTemplate.items.filter((_, i) => i !== index)
    setEditingTemplate({
      ...editingTemplate,
      items: newItems
    })
  }

  // 更新運費項目
  const updateShippingItem = (index: number, field: keyof ShippingRuleItem, value: any) => {
    if (!editingTemplate) return
    
    const newItems = [...editingTemplate.items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    setEditingTemplate({
      ...editingTemplate,
      items: newItems
    })
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  return (
    <div className="shipping-rules-container">
      {/* 載入遮罩 */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">處理中...</div>
          </div>
        </div>
      )}

      {/* 頁面標題區域 */}
      <div className="shipping-rules-header">
        <h1>🚚 運費規則管理</h1>
        <div className="shipping-rules-header-actions">
          <button
            onClick={() => {
              setEditingTemplate(initTemplate())
              setIsEditing(true)
            }}
            className="btn-primary"
          >
            ✨ 新增運費規則
          </button>
        </div>
      </div>

      {/* 運費規則列表 */}
      {!isEditing && (
        <div className="content-section">
          <table className="modern-table">
            <thead>
              <tr>
                <th>規則名稱</th>
                <th>描述</th>
                <th>運送方式</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id}>
                  <td>
                    <div className="rule-name">
                      {template.name}
                      {template.is_default && (
                        <span className="default-badge">預設</span>
                      )}
                    </div>
                  </td>
                  <td>{template.description || '-'}</td>
                  <td>
                    <div className="shipping-methods">
                      {template.items?.map((item, index) => (
                        <div key={index} className="method-card">
                          <div className="method-name">
                            📦 {item.method}
                          </div>
                          <div className="method-details">
                            <div className="fee-info">
                              運費：<span className="fee-amount">NT$ {Math.floor(item.base_fee)}</span>
                            </div>
                            <div className="fee-info">
                              滿 <span className="threshold-amount">NT$ {Math.floor(item.free_shipping_threshold).toLocaleString()}</span> 免運
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${template.is_active ? 'active' : 'inactive'}`}>
                      {template.is_active ? '✅ 啟用' : '❌ 停用'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {!template.is_default && (
                        <button
                          onClick={() => setAsDefault(template.id!)}
                          className="btn-action success"
                        >
                          ⭐ 設為預設
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingTemplate(template)
                          setIsEditing(true)
                        }}
                        className="btn-action primary"
                      >
                        ✏️ 編輯
                      </button>
                      <button
                        onClick={() => {
                          if (template.is_default) {
                            alert('無法刪除預設運費規則，請先設定其他規則為預設')
                            return
                          }
                          deleteTemplate(template.id!)
                        }}
                        className="btn-action danger"
                        disabled={template.is_default}
                      >
                        🗑️ 刪除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {templates.length === 0 && (
            <div className="empty-state">
              <img src="/no-information.webp" alt="無資料" />
              <h3>尚未建立任何運費規則</h3>
              <p>點擊上方「新增運費規則」按鈕開始建立您的第一個運費規則</p>
            </div>
          )}
        </div>
      )}

      {/* 編輯表單 */}
      {isEditing && editingTemplate && (
        <div className="form-section">
          <div className="section-title">
            <span>✏️</span>
            {editingTemplate.id ? '編輯運費規則' : '新增運費規則'}
          </div>
          
          {/* 基本資訊區塊 */}
          <div className="form-block">
            <h3 className="block-title">📋 基本資訊</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name" className="form-label required">🏷️ 規則名稱</label>
                <input
                  type="text"
                  id="name"
                  className="form-input"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    name: e.target.value
                  })}
                  placeholder="例：運送規則1"
                  required
                />
                <div className="form-hint">
                  為此運費規則設定一個容易識別的名稱
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description" className="form-label">📝 描述</label>
                <textarea
                  id="description"
                  className="form-textarea"
                  rows={3}
                  value={editingTemplate.description}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    description: e.target.value
                  })}
                  placeholder="例：一般商品運送方案"
                />
              </div>
            </div>
          </div>

          {/* 規則設定區塊 */}
          <div className="form-block">
            <h3 className="block-title">⚙️ 規則設定</h3>
            <div className="checkbox-grid">
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={editingTemplate.is_default}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    is_default: e.target.checked
                  })}
                />
                <label htmlFor="is_default">⭐ 設為預設規則</label>
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingTemplate.is_active}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    is_active: e.target.checked
                  })}
                />
                <label htmlFor="is_active">✅ 啟用此規則</label>
              </div>
            </div>
          </div>

          {/* 運送方式設定區塊 */}
          <div className="form-block">
            <div className="shipping-methods-header">
              <h3 className="block-title">🚚 運送方式設定</h3>
              <button
                type="button"
                onClick={addShippingItem}
                className="add-method-btn"
              >
                ➕ 新增運送方式
              </button>
            </div>
            
            <div className="shipping-methods-list">
              {editingTemplate.items.map((item, index) => (
                <div key={index} className="shipping-method-card">
                  <div className="method-card-header">
                    <h4 className="method-title">📦 運送方式 {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeShippingItem(index)}
                      className="remove-method-btn"
                    >
                      🗑️ 移除
                    </button>
                  </div>
                  
                  <div className="method-fields">
                    <div className="form-group">
                      <label className="form-label required">運送方式名稱</label>
                      <input
                        type="text"
                        className="form-input"
                        value={item.method}
                        onChange={(e) => updateShippingItem(index, 'method', e.target.value)}
                        placeholder="例：7-11超商取貨"
                      />
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label required">基本運費 (NT$)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={Math.floor(item.base_fee)}
                          onChange={(e) => updateShippingItem(index, 'base_fee', Math.floor(Number(e.target.value)))}
                          placeholder="60"
                          min="0"
                          step="1"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label required">免運門檻 (NT$)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={Math.floor(item.free_shipping_threshold)}
                          onChange={(e) => updateShippingItem(index, 'free_shipping_threshold', Math.floor(Number(e.target.value)))}
                          placeholder="399"
                          min="0"
                          step="1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 操作按鈕區塊 */}
          <div className="form-actions">
            <button
              onClick={() => saveTemplate(editingTemplate)}
              disabled={loading}
              className="btn-form-primary"
            >
              {loading ? '⏳ 儲存中...' : '💾 儲存'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
                setEditingTemplate(null)
              }}
              className="btn-form-secondary"
            >
              ❌ 取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}