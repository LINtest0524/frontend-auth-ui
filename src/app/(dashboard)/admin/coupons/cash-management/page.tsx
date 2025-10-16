'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useUserStore } from '@/hooks/use-user-store'
import '@/styles/pages/coupons-admin.css'

interface CouponTemplate {
  id: number
  name: string
  type: string
  discountValue: number
  usageLimit?: number
  validFrom: string
  validTo: string
}

interface CashCoupon {
  id: number
  code: string
  isUsed: boolean
  usageCount: number
  createdAt: string
}

export default function CashCouponManagementPage() {
  const { user } = useUserStore()
  const searchParams = useSearchParams()
  const templateId = searchParams.get('templateId')

  const [template, setTemplate] = useState<CouponTemplate | null>(null)
  const [coupons, setCoupons] = useState<CashCoupon[]>([])
  const [loading, setLoading] = useState(false)
  const [newCouponCode, setNewCouponCode] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  // 獲取模板資訊
  const fetchTemplate = async () => {
    if (!templateId) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/coupons/templates/${templateId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTemplate(data)
      }
    } catch (error) {
      console.error('獲取模板失敗:', error)
    }
  }

  // 獲取現金優惠券列表
  const fetchCashCoupons = async () => {
    if (!templateId) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/coupons/cash-coupons/${templateId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCoupons(data)
      }
    } catch (error) {
      console.error('獲取現金優惠券失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  // 創建現金優惠券
  const handleCreateCashCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newCouponCode.trim()) {
      alert('請輸入優惠碼')
      return
    }

    setCreateLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/coupons/create-cash-coupon`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: Number(templateId),
          code: newCouponCode.trim().toUpperCase()
        })
      })

      if (response.ok) {
        alert('現金優惠券創建成功！')
        setNewCouponCode('')
        fetchCashCoupons()
      } else {
        const error = await response.json()
        alert(`創建失敗: ${error.message || '未知錯誤'}`)
      }
    } catch (error) {
      console.error('創建現金優惠券失敗:', error)
      alert('創建失敗，請稍後再試')
    } finally {
      setCreateLoading(false)
    }
  }

  // 刪除現金優惠券
  const handleDeleteCashCoupon = async (couponId: number) => {
    if (!confirm('確定要刪除此現金優惠券嗎？')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/coupons/cash-coupons/${couponId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        alert('刪除成功！')
        fetchCashCoupons()
      } else {
        const error = await response.json()
        alert(`刪除失敗: ${error.message || '未知錯誤'}`)
      }
    } catch (error) {
      console.error('刪除失敗:', error)
      alert('刪除失敗，請稍後再試')
    }
  }

  useEffect(() => {
    if (templateId) {
      fetchTemplate()
      fetchCashCoupons()
    }
  }, [templateId])

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

  if (!templateId) {
    return (
      <div className="lucky-draw-events-container">
        <div className="content-section">
          <div className="permission-denied">
            <h3>參數錯誤</h3>
            <p>缺少模板ID參數</p>
            <button onClick={() => window.history.back()} className="btn-primary">
              返回上一頁
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="lucky-draw-events-container">
      {/* 頁面標題區域 */}
      <div className="lucky-draw-events-header">
        <h1>💰 現金優惠券管理</h1>
        <div className="lucky-draw-events-header-actions">
          <button
            onClick={() => window.location.href = '/admin/coupons'}
            className="btn-primary"
          >
            <span>← 返回模板列表</span>
          </button>
        </div>
      </div>

      {/* 模板資訊 */}
      {template && (
        <div className="content-section">
          <div className="template-info-card">
            <h3>📋 模板資訊</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>🎫 模板名稱:</label>
                <span>{template.name}</span>
              </div>
              <div className="info-item">
                <label>💰 現金金額:</label>
                <span>{Math.floor(template.discountValue)} 元</span>
              </div>
              <div className="info-item">
                <label>🔄 使用限制:</label>
                <span>{template.usageLimit ? `限制 ${template.usageLimit} 次` : '無限制'}</span>
              </div>
              <div className="info-item">
                <label>⏰ 有效期:</label>
                <span>{formatDate(template.validFrom)} ~ {formatDate(template.validTo)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 創建新優惠碼 */}
      <div className="content-section">
        <div className="form-section">
          <h3>➕ 創建新的現金優惠券</h3>
          <form onSubmit={handleCreateCashCoupon} className="create-coupon-form">
            <div className="form-group">
              <label className="form-label required">
                🎫 優惠碼 (如: NEWYEAR2026)
              </label>
              <div className="input-group">
                <input
                  type="text"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  className="form-input"
                  placeholder="輸入優惠碼，如: NEWYEAR2026"
                  maxLength={20}
                  pattern="[A-Z0-9]+"
                  title="只能包含大寫字母和數字"
                  required
                />
                <button
                  type="submit"
                  disabled={createLoading || !newCouponCode.trim()}
                  className="btn-submit"
                >
                  {createLoading ? '⏳ 創建中...' : '✨ 創建優惠券'}
                </button>
              </div>
              <p className="form-help">
                💡 優惠碼將自動轉為大寫，建議使用容易記憶的英文+數字組合
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* 現金優惠券列表 */}
      <div className="content-section">
        <div className="table-controls">
          <div className="table-info">
            共 {coupons.length} 個現金優惠券
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
                  <th>🎫 優惠碼</th>
                  <th>💰 現金金額</th>
                  <th>📊 使用狀態</th>
                  <th>📈 使用次數</th>
                  <th>⏰ 創建時間</th>
                  <th>⚙️ 操作</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td>
                      <div className="coupon-code">
                        <span className="code-text">{coupon.code}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cash-amount">
                        💰 {Math.floor(template?.discountValue || 0)} 元
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${coupon.isUsed ? 'used' : 'available'}`}>
                        {coupon.isUsed ? '🔴 已使用' : '🟢 可使用'}
                      </span>
                    </td>
                    <td>
                      <div className="usage-count">
                        {coupon.usageCount} / {template?.usageLimit || '∞'}
                      </div>
                    </td>
                    <td>
                      <div className="time-info">
                        {formatDate(coupon.createdAt)}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => navigator.clipboard.writeText(coupon.code)}
                          className="btn-copy"
                          title="複製優惠碼"
                        >
                          📋 複製
                        </button>
                        <button
                          onClick={() => handleDeleteCashCoupon(coupon.id)}
                          className="btn-delete"
                          disabled={coupon.usageCount > 0}
                          title={coupon.usageCount > 0 ? '已有使用記錄，無法刪除' : '刪除優惠券'}
                        >
                          🗑️ 刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {coupons.length === 0 && !loading && (
              <div className="no-data">
                <img src="/no-information.webp" alt="無資料" />
                <p>尚未創建現金優惠券</p>
                <p className="help-text">請在上方輸入優惠碼來創建第一個現金優惠券</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}