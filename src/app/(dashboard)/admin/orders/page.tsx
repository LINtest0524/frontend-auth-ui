'use client'

import { useState, useEffect } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import dayjs from 'dayjs'
import '@/styles/order-detail-modal.css'

interface OrderItem {
  id: number
  product_name: string
  product_sku: string
  quantity: number
  price: number
  product_thumbnail?: string
}

interface Order {
  id: number
  order_number: string
  customer_name: string
  customer_phone: string
  customer_email: string
  shipping_address: string
  shipping_method_id?: string
  shipping_method_name?: string
  shipping_fee?: number
  payment_method: string
  total_amount: number
  status: string
  payment_status?: string
  shipping_status?: string
  created_at: string
  updated_at: string
  items: OrderItem[]
  notes?: string
  admin_notes?: string
  user_id?: number
  user?: {
    username: string
    email: string
  }
}

export default function OrdersManagePage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('')
  const [startDate, setStartDate] = useState(() => {
    const today = dayjs()
    return today.subtract(2, "day").format("YYYY-MM-DD")
  })
  const [endDate, setEndDate] = useState(() => {
    const today = dayjs()
    return today.format("YYYY-MM-DD")
  })
  const [productNameFilter, setProductNameFilter] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)
  const [limit, setLimit] = useState(20)
  const [inputLimit, setInputLimit] = useState(20)

  const currentUser = useUserStore((state) => state.user)

  // 快速設定日期
  const quickSetDate = (type: string) => {
    const today = dayjs()
    let fromDate = ""
    let toDate = ""

    switch (type) {
      case "today":
        fromDate = today.format("YYYY-MM-DD")
        toDate = today.format("YYYY-MM-DD")
        break
      case "yesterday":
        const y = today.subtract(1, "day")
        fromDate = y.format("YYYY-MM-DD")
        toDate = y.format("YYYY-MM-DD")
        break
      case "3days":
        fromDate = today.subtract(2, "day").format("YYYY-MM-DD")
        toDate = today.format("YYYY-MM-DD")
        break
      case "thisMonth":
        fromDate = today.startOf("month").format("YYYY-MM-DD")
        toDate = today.endOf("month").format("YYYY-MM-DD")
        break
      case "lastMonth":
        const last = today.subtract(1, "month")
        fromDate = last.startOf("month").format("YYYY-MM-DD")
        toDate = last.endOf("month").format("YYYY-MM-DD")
        break
    }

    setStartDate(fromDate)
    setEndDate(toDate)
  }

  // 清除篩選條件
  const clearFilter = () => {
    setStatusFilter('')
    setSearchTerm('')
    setPaymentMethodFilter('')
    setStartDate('')
    setEndDate('')
    setProductNameFilter('')
    setOrders([])
    setTotalPages(1)
    setTotalOrders(0)
    setHasSearched(false)
  }

  // 處理搜尋
  const handleSearch = () => {
    setHasSearched(true)
    setCurrentPage(1)
    loadOrders()
  }

  // 載入訂單資料 - 只在分頁和筆數變化時自動載入
  useEffect(() => {
    if (hasSearched) {
      loadOrders()
    }
  }, [currentPage, limit])

  // 頁面載入時自動搜尋3日內資料
  useEffect(() => {
    if (!hasSearched) {
      setHasSearched(true)
      loadOrders()
    }
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      
      // 獲取登入 token
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('未找到登入 token')
        setLoading(false)
        return
      }

      // 建構查詢參數
      const params = new URLSearchParams({
        company: 'a', // 或根據需要動態設定
        page: currentPage.toString(),
        limit: limit.toString()
      })

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim())
      }

      if (paymentMethodFilter && paymentMethodFilter !== 'all') {
        params.append('payment_method', paymentMethodFilter)
      }

      if (startDate) {
        params.append('start_date', startDate)
      }

      if (endDate) {
        params.append('end_date', endDate)
      }

      if (productNameFilter.trim()) {
        params.append('product_name', productNameFilter.trim())
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/admin/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      setOrders(data.data || [])
      setTotalOrders(data.total || 0)
      setTotalPages(Math.ceil((data.total || 0) / limit))
      
    } catch (error) {
      console.error('載入訂單失敗:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const getPaymentStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': '未付款',
      'paid': '已付款',
      'processing': '處理中',
      'cancelled': '已取消',
      'refunded': '退款中'
    }
    return statusMap[status] || '未知狀態'
  }

  const getShippingStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': '未出貨',
      'paid': '未出貨',
      'processing': '準備中',
      'shipped': '已出貨',
      'delivered': '完成',
      'cancelled': '已取消'
    }
    return statusMap[status] || '未知狀態'
  }

  const getProductSummary = (items: OrderItem[]) => {
    if (!items || items.length === 0) return '無商品'
    
    const firstItem = items[0]
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    
    if (items.length === 1) {
      return `${firstItem.product_name} × ${firstItem.quantity}`
    } else {
      return `${firstItem.product_name} 等 ${totalItems} 件`
    }
  }

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'pending': '#f59e0b',
      'paid': '#10b981',
      'processing': '#3b82f6',
      'shipped': '#8b5cf6',
      'delivered': '#059669',
      'cancelled': '#ef4444',
      'refunded': '#6b7280'
    }
    return colorMap[status] || '#6b7280'
  }

  const getPaymentMethodText = (method: string) => {
    const methodMap: { [key: string]: string } = {
      'credit_card': '信用卡',
      'bank_transfer': '銀行轉帳',
      'cash_on_delivery': '貨到付款',
      'line_pay': 'LINE Pay'
    }
    return methodMap[method] || method
  }

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      // 獲取登入 token
      const token = localStorage.getItem('token')
      if (!token) {
        alert('未找到登入 token，請重新登入')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const updatedOrder = await response.json()

      // 更新本地狀態
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
          : order
      ))

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null)
      }

      alert('訂單狀態更新成功')
    } catch (error) {
      console.error('更新訂單狀態失敗:', error)
      alert('更新失敗，請稍後再試')
    }
  }

  const updatePaymentStatus = async (orderId: number, paymentStatus: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('未找到登入 token，請重新登入')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/admin/orders/${orderId}/payment-status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ payment_status: paymentStatus })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // 更新本地狀態
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, payment_status: paymentStatus }
          : order
      ))

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, payment_status: paymentStatus } : null)
      }

      alert('付款狀態更新成功')
    } catch (error) {
      console.error('更新付款狀態失敗:', error)
      alert('更新失敗，請稍後再試')
    }
  }

  const updateShippingStatus = async (orderId: number, shippingStatus: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('未找到登入 token，請重新登入')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/admin/orders/${orderId}/shipping-status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ shipping_status: shippingStatus })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // 更新本地狀態
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, shipping_status: shippingStatus }
          : order
      ))

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, shipping_status: shippingStatus } : null)
      }

      alert('出貨狀態更新成功')
    } catch (error) {
      console.error('更新出貨狀態失敗:', error)
      alert('更新失敗，請稍後再試')
    }
  }

  const updateAdminNotes = async (orderId: number, notes: string) => {
    try {
      // 獲取登入 token
      const token = localStorage.getItem('token')
      if (!token) {
        alert('未找到登入 token，請重新登入')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/admin/orders/${orderId}/notes`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ admin_notes: notes })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // 更新本地狀態
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, admin_notes: notes }
          : order
      ))

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, admin_notes: notes } : null)
      }

      alert('備註更新成功')
    } catch (error) {
      console.error('更新備註失敗:', error)
      alert('更新失敗，請稍後再試')
    }
  }

  const renderPagination = () => {
    if (totalPages <= 1 || totalOrders === 0) return null

    const pages = []
    const maxVisible = 5

    if (totalPages <= 10) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      const start = Math.max(2, currentPage - 2)
      const end = Math.min(totalPages - 1, currentPage + 2)

      if (start > 2) {
        pages.push("...")
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (end < totalPages - 1) {
        pages.push("...")
      }

      pages.push(totalPages)
    }

    return (
      <div className="fo5 w100 b-data-tables_munber mb15">
        <p>
          目前第 {currentPage} 頁，共 {totalPages} 頁（共 {totalOrders} 筆資料）
        </p>

        <div className="tables_munber">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className=""
          >
            上一頁
          </button>

          {pages.map((p, idx) =>
            p === "..." ? (
              <span key={`ellipsis-${idx}`}>
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setCurrentPage(p as number)}
                className={`${
                  currentPage === p ? "pagehover" : ""
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className=""
          >
            下一頁
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="b-bigbox-all w100">
      <div className="b-ibox mb30">
        <div className="b-ibox-s">
          <div className="w100 mb15">
            <h1 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
              訂單管理
            </h1>
          </div>

          <button
            className="b-search-btn w100"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            篩選條件
            <span className={`i-arrow ${isFilterOpen ? "rotate" : ""}`}></span>
          </button>

          {isFilterOpen && (
            <div className="b-search-box fl1 w100 mt15">
              <div className="b-form-group-2 fl4 w33 mb25">
                <label>訂單狀態</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w60"
                >
                  <option value="">狀態（全部）</option>
                  <option value="pending">待付款</option>
                  <option value="paid">已付款</option>
                  <option value="processing">處理中</option>
                  <option value="shipped">已出貨</option>
                  <option value="delivered">已送達</option>
                  <option value="cancelled">已取消</option>
                  <option value="refunded">已退款</option>
                </select>
              </div>

              <div className="b-form-group-2 fl4 w33 mb25">
                <label>付款方式</label>
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="w60"
                >
                  <option value="">付款方式（全部）</option>
                  <option value="credit_card">信用卡</option>
                  <option value="bank_transfer">銀行轉帳</option>
                  <option value="cash_on_delivery">貨到付款</option>
                  <option value="line_pay">LINE Pay</option>
                </select>
              </div>

              <div className="b-form-group-2 fl4 w33 mb25">
                <label>搜尋訂單</label>
                <input
                  type="text"
                  placeholder="訂單編號、客戶姓名或電話"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w60"
                />
              </div>

              <div className="w50 fd1 mb25">
                <div className="b-form-group-2 fl4 w100 mb10">
                  <label>訂購日期</label>
                  <div className="w70 fl4">
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)} 
                      className="date-select flex1" 
                    />
                    <span className="dateto">到</span>
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)} 
                      className="date-select flex1" 
                    />
                  </div>
                </div>

                <div className="b-form-group-2 w100 fl4">
                  <div className="b-date-fast fl4 w70 ml132">
                    <button onClick={() => quickSetDate("today")}>今日</button>
                    <button onClick={() => quickSetDate("yesterday")}>昨日</button>
                    <button onClick={() => quickSetDate("3days")}>近三日</button>
                    <button onClick={() => quickSetDate("thisMonth")}>本月</button>
                    <button onClick={() => quickSetDate("lastMonth")}>上月</button>
                  </div>
                </div>
              </div>

              <div className="w50 fd1 mb25">
                <div className="b-form-group-2 fl4 w100 mb25">
                  <label>商品名稱</label>
                  <input
                    type="text"
                    placeholder="搜尋商品名稱"
                    value={productNameFilter}
                    onChange={(e) => setProductNameFilter(e.target.value)}
                    className="w60"
                  />
                </div>
              </div>

              <div className="fl4 w100 b-btnbox">
                <button onClick={handleSearch} className="b-btn-s2 b-btn-c4 mr20">查詢</button>
                <button onClick={clearFilter} className="b-btn-s2 b-btn-c1">清除</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {loading && <p>載入中...</p>}

      {!loading && hasSearched && (
        <div className="b-ibox">
          <div className="b-ibox-s">
            <div className="w100 fo5 mb15">
              <div className="w50 fl4">
                <label htmlFor="page11">每頁&nbsp;</label>
                <input
                  type="number"
                  id="page11"
                  value={inputLimit}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val)) setInputLimit(val);
                  }}
                  min={1}
                  className="txtbox1 mr20"
                />
                <button
                  onClick={() => {
                    const validLimit = Math.max(1, inputLimit);
                    setLimit(validLimit);
                  }}
                  className="ml10 b-btn-s2 b-btn-c4"
                >
                  顯示筆數
                </button>
              </div>

              <div className="w50 fl6">
                <div className="fo5 w100 b-data-tables_munber mb15">
                  <div className="tables_munber">
                    共 {totalOrders} 筆訂單
                  </div>
                </div>
              </div>
            </div>

            <table className="b-table-box admin-table mb15">
            <thead>
              <tr>
                <th>訂單編號</th>
                <th>訂購時間</th>
                <th>買家帳號</th>
                <th>商品摘要</th>
                <th>總金額</th>
                <th>付款狀態</th>
                <th>出貨狀態</th>
                <th>備註</th>
                <th className="th-last">操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <div style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>
                      {order.order_number}
                    </div>
                  </td>
                  <td style={{ fontSize: '13px', color: '#555' }}>
                    {new Date(order.created_at).toLocaleString('zh-TW', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td>
                    <div style={{ fontWeight: '500', fontSize: '14px' }}>
                      {order.user?.username || '訪客'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: '#555', maxWidth: '200px' }}>
                      {getProductSummary(order.items)}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600', color: '#dc2626', fontSize: '14px' }}>
                      {Math.round(order.total_amount).toLocaleString()}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      background: getStatusColor(order.payment_status || order.status),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {getPaymentStatusText(order.payment_status || order.status)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      background: getStatusColor(order.shipping_status || order.status),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {getShippingStatusText(order.shipping_status || order.status)}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', color: '#6c757d', maxWidth: '120px' }}>
                      {order.admin_notes || '-'}
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="b-btn-s3 b-btn-c2"
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    >
                      查看詳情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>

            {orders.length === 0 && (
              <div className="b-no-information w100 fd5">
                <img src="/no-information.webp" alt="無資料" className="mb25" />
                <p>查無資料</p>
              </div>
            )}

            {renderPagination()}
          </div>
        </div>
      )}

      {/* 訂單詳情彈窗 */}
      {selectedOrder && (
        <div className="order-detail-overlay">
          <div className="order-detail-modal">
            <div className="order-detail-content">
              {/* 彈窗標題 */}
              <div className="order-detail-header">
                <h2 className="order-detail-title">
                  訂單詳情 - {selectedOrder.order_number}
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="order-detail-close"
                >
                  ✕
                </button>
              </div>

              <div className="order-detail-body">

                {/* 客戶資訊 */}
                <div className="order-section">
                  <div className="order-section-header">
                    <span className="order-section-icon">👤</span>
                    <h3 className="order-section-title">客戶資訊</h3>
                  </div>
                  <div className="order-section-content">
                    <div className="customer-info-grid">
                      <div className="customer-info-item">
                        <span className="customer-info-label">姓名</span>
                        <span className="customer-info-value">{selectedOrder.customer_name}</span>
                      </div>
                      <div className="customer-info-item">
                        <span className="customer-info-label">電話</span>
                        <span className="customer-info-value">{selectedOrder.customer_phone}</span>
                      </div>
                      <div className="customer-info-item">
                        <span className="customer-info-label">信箱</span>
                        <span className="customer-info-value">{selectedOrder.customer_email}</span>
                      </div>
                      <div className="customer-info-item">
                        <span className="customer-info-label">地址</span>
                        <span className="customer-info-value">{selectedOrder.shipping_address}</span>
                      </div>
                      <div className="customer-info-item">
                        <span className="customer-info-label">運送方式</span>
                        <span className="customer-info-value">
                          {selectedOrder.shipping_method_name || '未指定'}
                          {selectedOrder.shipping_fee !== undefined && (
                            <span className="shipping-fee">
                              {selectedOrder.shipping_fee === 0 
                                ? ' (免運費)' 
                                : ` (運費: NT$ ${selectedOrder.shipping_fee.toLocaleString()})`
                              }
                            </span>
                          )}
                        </span>
                      </div>
                      {selectedOrder.notes && (
                        <div className="customer-info-item">
                          <span className="customer-info-label">備註</span>
                          <span className="customer-info-value">{selectedOrder.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 訂單商品 */}
                <div className="order-section">
                  <div className="order-section-header">
                    <span className="order-section-icon">🛍️</span>
                    <h3 className="order-section-title">訂單商品</h3>
                  </div>
                  <div className="order-section-content">
                    <div className="order-items-container">
                      <table className="order-items-table">
                        <thead>
                          <tr>
                            <th>商品名稱</th>
                            <th>SKU</th>
                            <th style={{ textAlign: 'center' }}>數量</th>
                            <th style={{ textAlign: 'right' }}>金額</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <div className="product-name">{item.product_name}</div>
                              </td>
                              <td>
                                <span className="product-sku">{item.product_sku}</span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span className="product-quantity">{item.quantity}</span>
                              </td>
                              <td className="product-price">
                                NT$ {(item.price * item.quantity).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* 訂單資訊 */}
                <div className="order-section">
                  <div className="order-section-header">
                    <span className="order-section-icon">📋</span>
                    <h3 className="order-section-title">訂單資訊</h3>
                  </div>
                  <div className="order-section-content">
                    <div className="order-info-grid">
                      <div className="order-info-item">
                        <span className="order-info-label">付款方式</span>
                        <span className="order-info-value">{getPaymentMethodText(selectedOrder.payment_method)}</span>
                      </div>
                      <div className="order-info-item">
                        <span className="order-info-label">付款狀態</span>
                        <span className="status-badge" style={{
                          background: getStatusColor(selectedOrder.payment_status || selectedOrder.status),
                          color: 'white'
                        }}>
                          {getPaymentStatusText(selectedOrder.payment_status || selectedOrder.status)}
                        </span>
                      </div>
                      <div className="order-info-item">
                        <span className="order-info-label">出貨狀態</span>
                        <span className="status-badge" style={{
                          background: getStatusColor(selectedOrder.shipping_status || selectedOrder.status),
                          color: 'white'
                        }}>
                          {getShippingStatusText(selectedOrder.shipping_status || selectedOrder.status)}
                        </span>
                      </div>
                      <div className="order-info-item">
                        <span className="order-info-label">訂購時間</span>
                        <span className="order-info-value">{new Date(selectedOrder.created_at).toLocaleString('zh-TW')}</span>
                      </div>
                      <div className="order-info-item order-total">
                        <span className="order-info-label">訂單總額</span>
                        <span className="order-info-value">
                          NT$ {selectedOrder.total_amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 付款狀態更新 */}
                <div className="order-section">
                  <div className="order-section-header">
                    <span className="order-section-icon">💳</span>
                    <h3 className="order-section-title">更新付款狀態</h3>
                  </div>
                  <div className="order-section-content">
                    <div className="status-update-section">
                      <div className="status-buttons">
                        {['pending', 'paid', 'refunded', 'cancelled'].map((status) => (
                          <button
                            key={status}
                            onClick={() => updatePaymentStatus(selectedOrder.id, status)}
                            disabled={(selectedOrder.payment_status || selectedOrder.status) === status}
                            className={`status-button payment ${
                              (selectedOrder.payment_status || selectedOrder.status) === status ? 'active' : ''
                            }`}
                          >
                            {getPaymentStatusText(status)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 出貨狀態更新 */}
                <div className="order-section">
                  <div className="order-section-header">
                    <span className="order-section-icon">🚚</span>
                    <h3 className="order-section-title">更新出貨狀態</h3>
                  </div>
                  <div className="order-section-content">
                    <div className="status-update-section">
                      <div className="status-buttons">
                        {['pending', 'processing', 'shipped', 'delivered'].map((status) => (
                          <button
                            key={status}
                            onClick={() => updateShippingStatus(selectedOrder.id, status)}
                            disabled={(selectedOrder.shipping_status || selectedOrder.status) === status}
                            className={`status-button shipping ${
                              (selectedOrder.shipping_status || selectedOrder.status) === status ? 'active' : ''
                            }`}
                          >
                            {getShippingStatusText(status)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 管理員備註 */}
                <div className="order-section">
                  <div className="order-section-header">
                    <span className="order-section-icon">📝</span>
                    <h3 className="order-section-title">客服備註</h3>
                  </div>
                  <div className="order-section-content">
                    <div className="notes-section">
                      <textarea
                        value={selectedOrder.admin_notes || ''}
                        onChange={(e) => setSelectedOrder(prev => prev ? {...prev, admin_notes: e.target.value} : null)}
                        placeholder="請輸入客服備註..."
                        rows={4}
                        className="notes-textarea"
                      />
                      <button
                        onClick={() => updateAdminNotes(selectedOrder.id, selectedOrder.admin_notes || '')}
                        className="notes-save-button"
                      >
                        儲存備註
                      </button>
                    </div>
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