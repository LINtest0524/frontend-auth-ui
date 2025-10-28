'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import './orders.css'

interface OrderItem {
  id: number
  product_id: number
  product_name: string
  product_sku: string
  quantity: number
  price: number
  selected_specs: Record<string, any>
}

interface Order {
  id: number
  order_number: string
  status: string
  payment_status: string
  payment_method: string
  total_amount: number
  shipping_fee: number
  customer_name: string
  customer_phone: string
  customer_email: string
  shipping_address: string
  shipping_method_name: string
  notes: string
  created_at: string
  updated_at: string
  items: OrderItem[]
}

export default function OrdersPage() {
  const params = useParams()
  const router = useRouter()
  const companyCode = params.companyCode as string
  
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showModal, setShowModal] = useState(false)

  // 重複登入檢查
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(`portalToken_${companyCode}`)
      if (!token) {
        window.location.href = `/${companyCode}/duplicate-login`
        return
      }
    }
  }, [companyCode])

  useEffect(() => {
    fetchOrders()
  }, [companyCode])

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem(`portalToken_${companyCode}`)
      if (!token) {
        window.location.href = `/${companyCode}/login`
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/orders?company=${companyCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || data || [])
      } else if (response.status === 401) {
        localStorage.removeItem(`portalToken_${companyCode}`)
        window.location.href = `/${companyCode}/login`
      } else {
        console.error('獲取訂單失敗')
      }
    } catch (error) {
      console.error('獲取訂單錯誤:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': '待處理',
      'processing': '處理中',
      'shipped': '已出貨',
      'delivered': '已送達',
      'cancelled': '已取消',
      'paid': '已付款',
      'unpaid': '未付款'
    }
    return statusMap[status] || status
  }

  const getStatusClass = (status: string) => {
    const statusClasses: Record<string, string> = {
      'pending': 'status-pending',
      'processing': 'status-processing',
      'shipped': 'status-shipped',
      'delivered': 'status-delivered',
      'cancelled': 'status-cancelled',
      'paid': 'status-paid',
      'unpaid': 'status-unpaid'
    }
    return statusClasses[status] || 'status-default'
  }

  const getPaymentStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'paid': '已付款',
      'unpaid': '未付款',
      'failed': '付款失敗',
      'refunded': '已退款'
    }
    return statusMap[status] || status
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const openOrderModal = (order: Order) => {
    setSelectedOrder(order)
    setShowModal(true)
  }

  const closeOrderModal = () => {
    setSelectedOrder(null)
    setShowModal(false)
  }

  if (loading) {
    return (
      <div className="orders-loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>載入訂單中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="orders-container">
      {/* 頁面頭部 */}
      <div className="orders-header">
        <div className="orders-header-content">
          <h1 className="orders-title">
            <span className="orders-title-icon">📋</span>
            我的訂單
          </h1>
          <div className="orders-breadcrumb">
            <a href={`/${companyCode}`}>首頁</a>
            <span>›</span>
            <span>我的訂單</span>
          </div>
        </div>
      </div>

      <div className="orders-content">
        {orders.length === 0 ? (
          <div className="orders-empty">
            <div className="orders-empty-content">
              <div className="orders-empty-icon">📦</div>
              <h3 className="orders-empty-title">尚無訂單</h3>
              <p className="orders-empty-message">您還沒有任何訂單，快去挑選您喜歡的商品吧！</p>
              <a href={`/${companyCode}/products`} className="orders-empty-btn">
                開始購物
              </a>
            </div>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h3 className="order-number">訂單編號：{order.order_number}</h3>
                    <div className="order-date">{formatDate(order.created_at)}</div>
                  </div>
                  <div className="order-status">
                    <span className={`status-badge ${getStatusClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    <span className={`payment-badge ${getStatusClass(order.payment_status)}`}>
                      {getPaymentStatusText(order.payment_status)}
                    </span>
                  </div>
                </div>

                <div className="order-body">
                  <div className="order-items">
                    {order.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="order-item">
                        <div className="item-info">
                          <div className="item-name">{item.product_name}</div>
                          <div className="item-specs">
                            {Object.entries(item.selected_specs || {}).map(([key, value]) => (
                              <span key={key} className="spec-tag">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                          <div className="item-quantity">數量: {item.quantity}</div>
                        </div>
                        <div className="item-price">
                          NT$ {item.price.toLocaleString()}
                        </div>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="more-items">
                        還有 {order.items.length - 3} 個商品...
                      </div>
                    )}
                  </div>
                </div>

                <div className="order-footer">
                  <div className="order-total">
                    <div className="shipping-info">
                      運費: NT$ {order.shipping_fee.toLocaleString()}
                    </div>
                    <div className="total-amount">
                      總計: NT$ {order.total_amount.toLocaleString()}
                    </div>
                  </div>
                  <div className="order-actions">
                    <button 
                      onClick={() => openOrderModal(order)}
                      className="view-detail-btn"
                    >
                      查看詳情
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 訂單詳情彈窗 */}
      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={closeOrderModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>訂單詳情</h2>
              <button onClick={closeOrderModal} className="modal-close">
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* 訂單基本資訊 */}
              <div className="detail-section">
                <h3>訂單資訊</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">訂單編號:</span>
                    <span className="detail-value">{selectedOrder.order_number}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">訂單狀態:</span>
                    <span className={`detail-value ${getStatusClass(selectedOrder.status)}`}>
                      {getStatusText(selectedOrder.status)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">付款狀態:</span>
                    <span className={`detail-value ${getStatusClass(selectedOrder.payment_status)}`}>
                      {getPaymentStatusText(selectedOrder.payment_status)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">付款方式:</span>
                    <span className="detail-value">{selectedOrder.payment_method}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">下單時間:</span>
                    <span className="detail-value">{formatDate(selectedOrder.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* 收貨資訊 */}
              <div className="detail-section">
                <h3>收貨資訊</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">收件人:</span>
                    <span className="detail-value">{selectedOrder.customer_name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">聯絡電話:</span>
                    <span className="detail-value">{selectedOrder.customer_phone}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">電子信箱:</span>
                    <span className="detail-value">{selectedOrder.customer_email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">運送方式:</span>
                    <span className="detail-value">{selectedOrder.shipping_method_name}</span>
                  </div>
                  <div className="detail-item full-width">
                    <span className="detail-label">收貨地址:</span>
                    <span className="detail-value">{selectedOrder.shipping_address}</span>
                  </div>
                  {selectedOrder.notes && (
                    <div className="detail-item full-width">
                      <span className="detail-label">備註:</span>
                      <span className="detail-value">{selectedOrder.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 訂單商品 */}
              <div className="detail-section">
                <h3>訂單商品</h3>
                <div className="detail-items">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="detail-order-item">
                      <div className="detail-item-info">
                        <div className="detail-item-name">{item.product_name}</div>
                        <div className="detail-item-sku">SKU: {item.product_sku}</div>
                        <div className="detail-item-specs">
                          {Object.entries(item.selected_specs || {}).map(([key, value]) => (
                            <span key={key} className="detail-spec-tag">
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="detail-item-quantity">x{item.quantity}</div>
                      <div className="detail-item-price">
                        NT$ {item.price.toLocaleString()}
                      </div>
                      <div className="detail-item-subtotal">
                        NT$ {(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 費用明細 */}
              <div className="detail-section">
                <h3>費用明細</h3>
                <div className="price-breakdown">
                  <div className="price-row">
                    <span>商品小計:</span>
                    <span>NT$ {(selectedOrder.total_amount - selectedOrder.shipping_fee).toLocaleString()}</span>
                  </div>
                  <div className="price-row">
                    <span>運費:</span>
                    <span>NT$ {selectedOrder.shipping_fee.toLocaleString()}</span>
                  </div>
                  <div className="price-row total">
                    <span>總計:</span>
                    <span>NT$ {selectedOrder.total_amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}