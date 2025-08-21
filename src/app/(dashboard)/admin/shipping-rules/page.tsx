'use client'

import { useState, useEffect } from 'react'

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
    <div className="b-bigbox-all w100">
      <div className="b-ibox mb30">
        <h1>運費規則管理</h1>
        
        <div className="b-ibox-s">
          <div className="fl4 w100 b-btnbox mb15">
            <button 
              onClick={() => {
                setEditingTemplate(initTemplate())
                setIsEditing(true)
              }}
              className="b-btn-s2 b-btn-c4"
            >
              新增運費規則
            </button>
          </div>
        </div>
      </div>

      {/* 運費規則列表 */}
      {!isEditing && (
        <div className="b-ibox">
          <div className="b-ibox-s">
            <table className="b-table-box admin-table mb15">
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
                      {template.name}
                      {template.is_default && (
                        <span style={{color: '#dc3545', fontWeight: 'bold'}}>(預設)</span>
                      )}
                    </td>
                    <td>{template.description || '-'}</td>
                    <td>
                      <div style={{ fontSize: '14px' }}>
                        {template.items?.map((item, index) => (
                          <div key={index} style={{ 
                            marginBottom: '8px', 
                            padding: '8px', 
                            backgroundColor: '#f8f9fa', 
                            borderRadius: '4px',
                            border: '1px solid #e9ecef'
                          }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{item.method}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              運費: ${item.base_fee} | 免運門檻: ${item.free_shipping_threshold}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        background: template.is_active ? '#10b981' : '#ef4444',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {template.is_active ? '啟用' : '停用'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        {!template.is_default && (
                          <button
                            onClick={() => setAsDefault(template.id!)}
                            className="b-btn-s3 b-btn-c1"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            設為預設
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingTemplate(template)
                            setIsEditing(true)
                          }}
                          className="b-btn-s3 b-btn-c4"
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => {
                            if (template.is_default) {
                              alert('無法刪除預設運費規則，請先設定其他規則為預設')
                              return
                            }
                            deleteTemplate(template.id!)
                          }}
                          className={`b-btn-s3 ${template.is_default ? 'b-btn-c1' : 'b-btn-c3'}`}
                          style={{ 
                            fontSize: '12px', 
                            padding: '4px 8px',
                            opacity: template.is_default ? '0.5' : '1',
                            cursor: template.is_default ? 'not-allowed' : 'pointer'
                          }}
                          disabled={template.is_default}
                        >
                          刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {templates.length === 0 && (
              <div className="b-no-information w100 fd5">
                <img src="/no-information.webp" alt="無資料" className="mb25" />
                <p>尚未建立任何運費規則</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 編輯表單 */}
      {isEditing && editingTemplate && (
        <div className="b-ibox">
          <h1>{editingTemplate.id ? '編輯運費規則' : '新增運費規則'}</h1>
          
          <div className="b-ibox-s">
            <div className="b-form-group-1 w100 fl4">
              <label htmlFor="name">規則名稱</label>
              <input
                type="text"
                id="name"
                className="w70"
                value={editingTemplate.name}
                onChange={(e) => setEditingTemplate({
                  ...editingTemplate,
                  name: e.target.value
                })}
                placeholder="例：運送規則1"
                required
              />
            </div>

            <div className="b-form-group-1 w100 fl4">
              <label htmlFor="description">描述</label>
              <textarea
                id="description"
                className="w70"
                rows={3}
                value={editingTemplate.description}
                onChange={(e) => setEditingTemplate({
                  ...editingTemplate,
                  description: e.target.value
                })}
                placeholder="例：一般商品運送方案"
              />
            </div>

            <div className="b-form-group-1 w100 fl4">
              <label htmlFor="is_default">設為預設規則</label>
              <input
                type="checkbox"
                id="is_default"
                className="new-checkbox"
                checked={editingTemplate.is_default}
                onChange={(e) => setEditingTemplate({
                  ...editingTemplate,
                  is_default: e.target.checked
                })}
              />
            </div>

            <div className="b-form-group-1 w100 fl4">
              <label htmlFor="is_active">啟用此規則</label>
              <input
                type="checkbox"
                id="is_active"
                className="new-checkbox"
                checked={editingTemplate.is_active}
                onChange={(e) => setEditingTemplate({
                  ...editingTemplate,
                  is_active: e.target.checked
                })}
              />
            </div>

            <div className="b-form-group-1 w100 fl4">
              <label>運送方式設定</label>
              <div style={{ width: '70%' }}>
                <div className="mb15">
                  <button
                    type="button"
                    onClick={addShippingItem}
                    className="b-btn-s2 b-btn-c4 mr10"
                  >
                    新增運送方式
                  </button>
                </div>
                
                <div>
                  {editingTemplate.items.map((item, index) => (
                    <div key={index} style={{ 
                      border: '1px solid #e9ecef', 
                      padding: '15px', 
                      borderRadius: '6px',
                      background: '#f8f9fa',
                      marginBottom: '15px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h4 style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>運送方式 {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeShippingItem(index)}
                          className="b-btn-s3 b-btn-c3"
                        >
                          移除
                        </button>
                      </div>
                      
                      <div className="b-form-group-2 w100 fl4 mb15">
                        <label>運送方式名稱</label>
                        <input
                          type="text"
                          className="w100"
                          value={item.method}
                          onChange={(e) => updateShippingItem(index, 'method', e.target.value)}
                          placeholder="例：7-11超商取貨"
                        />
                      </div>
                      
                      <div className="b-form-group-2 w50 fl4 mb15">
                        <label>基本運費</label>
                        <input
                          type="number"
                          className="w80"
                          value={item.base_fee}
                          onChange={(e) => updateShippingItem(index, 'base_fee', Number(e.target.value))}
                          placeholder="60"
                          min="0"
                        />
                      </div>
                      
                      <div className="b-form-group-2 w50 fl4 mb15">
                        <label>免運門檻</label>
                        <input
                          type="number"
                          className="w80"
                          value={item.free_shipping_threshold}
                          onChange={(e) => updateShippingItem(index, 'free_shipping_threshold', Number(e.target.value))}
                          placeholder="399"
                          min="0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="fl4 w100 b-btnbox">
              <button
                onClick={() => saveTemplate(editingTemplate)}
                disabled={loading}
                className="b-btn-s2 b-btn-c4 mr20"
              >
                {loading ? '儲存中...' : '儲存'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setEditingTemplate(null)
                }}
                className="b-btn-s2 b-btn-c1"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}