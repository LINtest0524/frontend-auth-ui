'use client'

import { useState, useEffect } from 'react'

interface ShippingRule {
  id: string
  name: string
  fee: number
  freeThreshold: number
  description?: string
  enabled: boolean
}

export default function ShippingRulesPage() {
  const [shippingRules, setShippingRules] = useState<ShippingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // 獲取當前運送規則
  const fetchShippingRules = async () => {
    try {
      const response = await fetch('/api/admin/company/shipping-rules', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setShippingRules(result.data)
        }
      } else {
        console.error('獲取運送規則失敗')
      }
    } catch (error) {
      console.error('獲取運送規則失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  // 儲存運送規則
  const saveShippingRules = async () => {
    setSaving(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/admin/company/shipping-rules', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ shipping_rules: shippingRules })
      })
      
      if (response.ok) {
        setMessage({ type: 'success', text: '運送規則已成功更新！' })
      } else {
        setMessage({ type: 'error', text: '更新失敗，請稍後再試' })
      }
    } catch (error) {
      console.error('儲存運送規則失敗:', error)
      setMessage({ type: 'error', text: '更新失敗，請稍後再試' })
    } finally {
      setSaving(false)
    }
  }

  // 更新運送規則
  const updateRule = (index: number, field: keyof ShippingRule, value: any) => {
    const newRules = [...shippingRules]
    newRules[index] = { ...newRules[index], [field]: value }
    setShippingRules(newRules)
  }

  // 新增運送規則
  const addRule = () => {
    const newRule: ShippingRule = {
      id: `custom_${Date.now()}`,
      name: '',
      fee: 0,
      freeThreshold: 0,
      description: '',
      enabled: true
    }
    setShippingRules([...shippingRules, newRule])
  }

  // 刪除運送規則
  const removeRule = (index: number) => {
    const newRules = shippingRules.filter((_, i) => i !== index)
    setShippingRules(newRules)
  }

  useEffect(() => {
    fetchShippingRules()
  }, [])

  if (loading) {
    return (
      <div className="b-ibox">
        <h1>運送規則管理</h1>
        <div className="b-ibox-s">
          <p>載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="b-ibox">
      <h1>運送規則管理</h1>

      <div className="b-ibox-s">
        <div className="fl4 w100 mb15">
          <button 
            onClick={addRule}
            className="b-btn-s2 b-btn-c4 mr10"
          >
            新增運送方式
          </button>
          <button 
            onClick={saveShippingRules}
            disabled={saving}
            className="b-btn-s2 b-btn-c1"
          >
            {saving ? '儲存中...' : '儲存設定'}
          </button>
        </div>

        {message && (
          <div className={`mb15 p15 ${
            message.type === 'success' 
              ? 'bg-success text-success' 
              : 'bg-error text-error'
          }`}>
            {message.text}
          </div>
        )}

        {shippingRules.length > 0 && (
          <table className="b-table-box admin-table mb15">
            <thead>
              <tr>
                <th>運送方式名稱</th>
                <th>基本運費 (NT$)</th>
                <th>免運門檻 (NT$)</th>
                <th>說明</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {shippingRules.map((rule, index) => (
                <tr key={rule.id}>
                  <td>
                    <input
                      type="text"
                      value={rule.name}
                      onChange={(e) => updateRule(index, 'name', e.target.value)}
                      placeholder="例：7-11超商取貨"
                      className="form-control"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={rule.fee}
                      onChange={(e) => updateRule(index, 'fee', parseInt(e.target.value) || 0)}
                      placeholder="60"
                      className="form-control"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={rule.freeThreshold}
                      onChange={(e) => updateRule(index, 'freeThreshold', parseInt(e.target.value) || 0)}
                      placeholder="399"
                      className="form-control"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={rule.description || ''}
                      onChange={(e) => updateRule(index, 'description', e.target.value)}
                      placeholder="例：3-5個工作天到店"
                      className="form-control"
                    />
                  </td>
                  <td>
                    <span className={`badge ${rule.enabled ? 'badge-success' : 'badge-secondary'}`}>
                      {rule.enabled ? '啟用中' : '未啟用'}
                    </span>
                  </td>
                  <td>
                    <div className="fl4">
                      <button 
                        onClick={() => updateRule(index, 'enabled', !rule.enabled)}
                        className={`b-btn-s3 mr10 ${rule.enabled ? 'b-btn-c2' : 'b-btn-c4'}`}
                      >
                        {rule.enabled ? '停用' : '啟用'}
                      </button>
                      <button 
                        onClick={() => removeRule(index)}
                        className="b-btn-s3 b-btn-c3"
                      >
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {shippingRules.length === 0 && (
          <div className="text-center p30">
            <p className="mb15">尚未設定任何運送方式</p>
            <button 
              onClick={addRule}
              className="b-btn-s2 b-btn-c4"
            >
              新增第一個運送方式
            </button>
          </div>
        )}

        <div className="info-box mt30">
          <h3 className="mb15">使用說明：</h3>
          <ul className="info-list">
            <li>• 運送方式名稱：顯示給客戶看的運送方式名稱</li>
            <li>• 基本運費：未達免運門檻時收取的運費</li>
            <li>• 免運門檻：購物金額達到此金額時免收運費</li>
            <li>• 說明：運送時間或其他說明文字</li>
            <li>• 啟用：只有啟用的運送方式會顯示在前台</li>
          </ul>
        </div>
      </div>
    </div>
  )
}