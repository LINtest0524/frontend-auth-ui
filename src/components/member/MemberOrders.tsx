'use client'

import { useEffect, useState } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import { usePathname } from 'next/navigation'

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

export default function MemberOrders() {
  const { user } = useUserStore()
  const pathname = usePathname()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set())

  // 從路徑獲取公司代碼
  const getCompanyCode = () => {
    const segments = pathname.split('/')
    return segments[1] // /a/member -> 'a', /b/member -> 'b'
  }

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const companyCode = getCompanyCode()
        const token = localStorage.getItem(`portalToken_${companyCode}`)
        if (!token) {
          console.log('未找到登入 token')
          setLoading(false)
          return
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/orders?company=${companyCode}`, {
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
  }, [pathname])

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
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '60px 0'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <div>載入訂單中...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">我的訂單</h2>
      
      {orders.length === 0 ? (
        <div style={{
          background: '#f8f9fa',
          borderRadius: '12px',
          padding: '40px 20px',
          textAlign: 'center',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📦</div>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#333',
            marginBottom: '8px'
          }}>
            還沒有任何訂單
          </h3>
          <p style={{ 
            color: '#6c757d', 
            marginBottom: '20px',
            lineHeight: '1.5'
          }}>
            您還沒有建立任何訂單，快去挑選您喜歡的商品吧！
          </p>
          <a 
            href={`/${getCompanyCode()}/products`}
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            開始購物
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                background: '#fff',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                padding: '20px'
              }}
            >
              {/* 訂單標題 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
                paddingBottom: '12px',
                borderBottom: '1px solid #f1f3f4'
              }}>
                <div>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#333',
                    margin: '0 0 4px 0'
                  }}>
                    訂單編號: {order.order_number}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#6c757d' }}>
                    {new Date(order.created_at).toLocaleString('zh-TW')}
                  </div>
                </div>
                <div style={{
                  background: getStatusColor(order.status),
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {getStatusText(order.status)}
                </div>
              </div>

              {/* 訂單商品 - 新排版 */}
              <div style={{ marginBottom: '15px' }}>
                {/* 第一個商品 - 主要顯示 */}
                {order.items.length > 0 && (
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px',
                    background: '#f8f9fa',
                    borderRadius: '6px',
                    marginBottom: '8px'
                  }}>
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
                        {order.items[0].product_name}
                      </div>
                      {order.items[0].specifications && (
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#6c757d',
                          marginBottom: '4px'
                        }}>
                          {order.items[0].specifications}
                        </div>
                      )}
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6c757d'
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
                          fontSize: '11px', 
                          color: '#6c757d',
                          textDecoration: 'line-through',
                          marginBottom: '1px'
                        }}>
                          NT$ {(order.items[0].original_price * order.items[0].quantity).toLocaleString()}
                        </div>
                      )}
                      <div style={{ 
                        fontWeight: '600', 
                        color: '#007bff',
                        fontSize: '14px'
                      }}>
                        NT$ {(order.items[0].price * order.items[0].quantity).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                {/* 檢視其他商品按鈕 */}
                {order.items.length > 1 && (
                  <div style={{ marginBottom: '8px' }}>
                    <button
                      onClick={() => toggleOrderExpansion(order.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#007bff',
                        fontSize: '11px',
                        cursor: 'pointer',
                        padding: '4px 0',
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
                    borderRadius: '6px',
                    padding: '8px',
                    marginBottom: '8px'
                  }}>
                    {order.items.slice(1).map((item, index) => (
                      <div
                        key={index + 1}
                        style={{
                          display: 'flex',
                          gap: '10px',
                          padding: '6px 0',
                          borderBottom: index < order.items.length - 2 ? '1px solid #e9ecef' : 'none'
                        }}
                      >
                        {/* 商品圖片 */}
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '4px',
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
                            <span style={{ fontSize: '16px' }}>📦</span>
                          )}
                        </div>

                        {/* 商品資訊 */}
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontWeight: '500', 
                            color: '#333',
                            fontSize: '12px',
                            marginBottom: '1px'
                          }}>
                            {item.product_name}
                          </div>
                          {item.specifications && (
                            <div style={{ 
                              fontSize: '10px', 
                              color: '#6c757d',
                              marginBottom: '2px'
                            }}>
                              {item.specifications}
                            </div>
                          )}
                          <div style={{ 
                            fontSize: '10px', 
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
                              fontSize: '10px', 
                              color: '#6c757d',
                              textDecoration: 'line-through',
                              marginBottom: '1px'
                            }}>
                              NT$ {(item.original_price * item.quantity).toLocaleString()}
                            </div>
                          )}
                          <div style={{ 
                            fontWeight: '600', 
                            color: '#007bff',
                            fontSize: '12px'
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
                paddingTop: '12px',
                borderTop: '2px solid #f1f3f4',
                marginBottom: '12px'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                  訂單總計
                </div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#dc2626' }}>
                  NT$ {order.total_amount.toLocaleString()}
                </div>
              </div>

              {/* 操作按鈕 */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px'
              }}>
                <button
                  onClick={() => {
                    alert('退貨/退款功能開發中，請聯繫客服處理')
                  }}
                  style={{
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
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
  )
}