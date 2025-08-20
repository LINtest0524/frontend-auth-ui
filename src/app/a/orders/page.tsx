'use client'

import { useEffect, useState } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import PortalHeaderBar from '@/components/PortalHeaderBar'

interface OrderItem {
  id: number
  product_name: string
  product_sku: string
  quantity: number
  price: number
  original_price?: number
  specifications?: string
  product_thumbnail?: string
}

interface Order {
  id: number
  order_number: string
  customer_name: string
  customer_phone: string
  customer_email: string
  shipping_address: string
  payment_method: string
  total_amount: number
  status: string
  created_at: string
  updated_at: string
  notes?: string
  items: OrderItem[]
}

export default function OrdersPage() {
  const { user } = useUserStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set())

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          console.log('未找到登入 token')
          setLoading(false)
          return
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/orders?company=a`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const orders = await response.json()
        setOrders(orders || [])
      } catch (error) {
        console.error('載入訂單失敗:', error)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [])

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': '待付款',
      'paid': '已付款',
      'processing': '處理中',
      'shipped': '已出貨',
      'delivered': '已送達',
      'cancelled': '已取消'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'pending': '#f59e0b',
      'paid': '#10b981',
      'processing': '#3b82f6',
      'shipped': '#8b5cf6',
      'delivered': '#059669',
      'cancelled': '#ef4444'
    }
    return colorMap[status] || '#6b7280'
  }

  const toggleOrderExpansion = (orderId: number) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <>
        <PortalHeaderBar />
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginTop: '120px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <div>載入訂單中...</div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <PortalHeaderBar />
      <div style={{
        maxWidth: '1200px',
        margin: '140px auto 40px',
        padding: '0 20px'
      }}>
        {/* 頁面標題 */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          padding: '30px',
          marginBottom: '30px'
        }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#333',
            margin: '0 0 10px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '28px' }}>📋</span>
            我的訂單
          </h1>
          <div style={{
            fontSize: '14px',
            color: '#6c757d'
          }}>
            <a href="/a" style={{ color: '#007bff', textDecoration: 'none' }}>首頁</a>
            <span style={{ margin: '0 8px' }}>›</span>
            <span>我的訂單</span>
          </div>
        </div>

        {/* 訂單列表 */}
        {orders.length === 0 ? (
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            padding: '60px 30px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📦</div>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#333',
              marginBottom: '10px'
            }}>
              還沒有任何訂單
            </h3>
            <p style={{ 
              color: '#6c757d', 
              marginBottom: '30px',
              lineHeight: '1.6'
            }}>
              您還沒有建立任何訂單，快去挑選您喜歡的商品吧！
            </p>
            <a 
              href="/a/products"
              style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              開始購物
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {orders.map((order) => (
              <div
                key={order.id}
                style={{
                  background: '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  padding: '25px',
                  border: '1px solid #e9ecef'
                }}
              >
                {/* 訂單標題 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                  paddingBottom: '15px',
                  borderBottom: '1px solid #f1f3f4'
                }}>
                  <div>
                    <h3 style={{ 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      color: '#333',
                      margin: '0 0 5px 0'
                    }}>
                      訂單編號: {order.order_number}
                    </h3>
                    <div style={{ fontSize: '14px', color: '#6c757d' }}>
                      訂購時間: {new Date(order.created_at).toLocaleString('zh-TW')}
                    </div>
                  </div>
                  <div style={{
                    background: getStatusColor(order.status),
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {getStatusText(order.status)}
                  </div>
                </div>

                {/* 訂單商品 - 新排版 */}
                <div style={{ marginBottom: '20px' }}>
                  {/* 第一個商品 - 主要顯示 */}
                  {order.items.length > 0 && (
                    <div style={{
                      display: 'flex',
                      gap: '15px',
                      padding: '15px',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      marginBottom: '10px'
                    }}>
                      {/* 商品圖片 */}
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#e9ecef',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {order.items[0].product_thumbnail ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_API_BASE}${order.items[0].product_thumbnail}`}
                            alt={order.items[0].product_name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: '24px' }}>📦</span>
                        )}
                      </div>

                      {/* 商品資訊 */}
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontWeight: '600', 
                          color: '#333',
                          fontSize: '16px',
                          marginBottom: '4px'
                        }}>
                          {order.items[0].product_name}
                        </div>
                        {order.items[0].specifications && (
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#6c757d',
                            marginBottom: '8px'
                          }}>
                            {order.items[0].specifications}
                          </div>
                        )}
                        <div style={{ 
                          fontSize: '14px', 
                          color: '#6c757d',
                          marginBottom: '8px'
                        }}>
                          數量: {order.items[0].quantity}
                        </div>
                      </div>

                      {/* 價格 */}
                      <div style={{ 
                        textAlign: 'right',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}>
                        {order.items[0].original_price && order.items[0].original_price > order.items[0].price && (
                          <div style={{ 
                            fontSize: '14px', 
                            color: '#6c757d',
                            textDecoration: 'line-through',
                            marginBottom: '2px'
                          }}>
                            NT$ {(order.items[0].original_price * order.items[0].quantity).toLocaleString()}
                          </div>
                        )}
                        <div style={{ 
                          fontWeight: '600', 
                          color: '#007bff',
                          fontSize: '16px'
                        }}>
                          NT$ {(order.items[0].price * order.items[0].quantity).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 檢視其他商品按鈕 */}
                  {order.items.length > 1 && (
                    <div style={{ marginBottom: '10px' }}>
                      <button
                        onClick={() => toggleOrderExpansion(order.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#007bff',
                          fontSize: '12px',
                          cursor: 'pointer',
                          padding: '5px 0',
                          textDecoration: 'underline'
                        }}
                      >
                        {expandedOrders.has(order.id) 
                          ? `收合其他商品 ▲` 
                          : `檢視其他商品 (${order.items.length - 1}項) ▼`
                        }
                      </button>
                    </div>
                  )}

                  {/* 展開的其他商品 */}
                  {expandedOrders.has(order.id) && order.items.length > 1 && (
                    <div style={{
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      padding: '10px',
                      marginBottom: '10px'
                    }}>
                      {order.items.slice(1).map((item, index) => (
                        <div
                          key={index + 1}
                          style={{
                            display: 'flex',
                            gap: '15px',
                            padding: '10px 0',
                            borderBottom: index < order.items.length - 2 ? '1px solid #e9ecef' : 'none'
                          }}
                        >
                          {/* 商品圖片 */}
                          <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            background: '#e9ecef',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {item.product_thumbnail ? (
                              <img
                                src={`${process.env.NEXT_PUBLIC_API_BASE}${item.product_thumbnail}`}
                                alt={item.product_name}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              <span style={{ fontSize: '20px' }}>📦</span>
                            )}
                          </div>

                          {/* 商品資訊 */}
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: '600', 
                              color: '#333',
                              fontSize: '14px',
                              marginBottom: '2px'
                            }}>
                              {item.product_name}
                            </div>
                            {item.specifications && (
                              <div style={{ 
                                fontSize: '11px', 
                                color: '#6c757d',
                                marginBottom: '4px'
                              }}>
                                {item.specifications}
                              </div>
                            )}
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#6c757d'
                            }}>
                              數量: {item.quantity}
                            </div>
                          </div>

                          {/* 價格 */}
                          <div style={{ 
                            textAlign: 'right',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}>
                            {item.original_price && item.original_price > item.price && (
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#6c757d',
                                textDecoration: 'line-through',
                                marginBottom: '2px'
                              }}>
                                NT$ {(item.original_price * item.quantity).toLocaleString()}
                              </div>
                            )}
                            <div style={{ 
                              fontWeight: '600', 
                              color: '#007bff',
                              fontSize: '14px'
                            }}>
                              NT$ {(item.price * item.quantity).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 訂單總計 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '15px',
                  borderTop: '2px solid #f1f3f4',
                  marginBottom: '15px'
                }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                    訂單總計
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#dc2626' }}>
                    NT$ {order.total_amount.toLocaleString()}
                  </div>
                </div>

                {/* 操作按鈕 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px'
                }}>
                  <button
                    onClick={() => {
                      alert('退貨/退款功能開發中，請聯繫客服處理')
                    }}
                    style={{
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#c82333'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#dc3545'
                    }}
                  >
                    🔄 退貨/退款
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}