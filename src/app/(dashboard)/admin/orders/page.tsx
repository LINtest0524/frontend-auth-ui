'use client'

import { useState, useEffect } from 'react'
import { useUserStore } from '@/hooks/use-user-store'
import dayjs from 'dayjs'
import '@/styles/order-detail-modal.css'
import '@/styles/pages/promotions-admin.css'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { toTaiwanDisplayTime, fromDatetimeLocalToTaiwan } from '@/lib/timeUtils'
import Pagination from '@/components/ui/Pagination'

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
  coupon_code?: string
  coupon_discount?: number
  subtotal?: number
  user?: {
    username: string
    email: string
  }
}

type SortKey = "id" | "order_number" | "total_amount" | "created_at" | null;
type SortDirection = "asc" | "desc" | null;

export default function OrdersManagePage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [productNameFilter, setProductNameFilter] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)
  const [limit, setLimit] = useState(20)
  const [inputLimit, setInputLimit] = useState(20)
  const [sortKey, setSortKey] = useState<SortKey>("id")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const currentUser = useUserStore((state) => state.user)
  const setUser = useUserStore((state) => state.setUser)

  // 初始化用戶資料
  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored && !currentUser) {
      try {
        const user = JSON.parse(stored)
        setUser(user)
      } catch (e) {
        console.error('解析用戶資料失敗', e)
      }
    }
  }, [])

  // 排序處理函數
  const sortOrders = (data: Order[]) => {
    if (!sortKey || !sortDirection) return data;
    return [...data].sort((a, b) => {
      const getValue = (order: Order) => {
        if (sortKey === "created_at") {
          return order[sortKey] ? new Date(order[sortKey]).getTime() : 0;
        }
        if (sortKey === "order_number") {
          return order[sortKey] || "";
        }
        if (sortKey === "total_amount") {
          // 確保轉換為數字並處理可能的字串格式
          const amount = order[sortKey];
          if (typeof amount === 'string') {
            return parseFloat((amount as string).replace(/[^\d.-]/g, '')) || 0;
          }
          return Number(amount) || 0;
        }
        return (order[sortKey] as number) ?? 0;
      };
      const aVal = getValue(a);
      const bVal = getValue(b);
      
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  };

  // 排序功能
  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection("desc");
    } else {
      if (sortDirection === "desc") setSortDirection("asc");
      else if (sortDirection === "asc") {
        setSortDirection(null);
        setSortKey(null);
      } else setSortDirection("desc");
    }
  };

  const getArrow = (key: SortKey) => {
    const isActive = sortKey === key;
    const dir = isActive ? sortDirection : null;

    const getIcon = () => {
      if (dir === "asc") return <img src="/icon/i-sort-2.svg" alt="升冪" className="i-sort" />;
      if (dir === "desc") return <img src="/icon/i-sort-1.svg" alt="降冪" className="i-sort" />;
      return <img src="/icon/i-sort-0.svg" alt="未排序" className="i-sort" />;
    };

    return (
      <span className={`${isActive}`}>
        {getIcon()}
      </span>
    );
  };

  // 快速設定日期 (datetime-local 格式)
  const quickSetDate = (type: string) => {
    const today = dayjs()
    let fromDate = ""
    let toDate = ""

    switch (type) {
      case "today":
        fromDate = today.startOf('day').format('YYYY-MM-DDTHH:mm')
        toDate = today.endOf('day').format('YYYY-MM-DDTHH:mm')
        break
      case "yesterday":
        const y = today.subtract(1, "day")
        fromDate = y.startOf('day').format('YYYY-MM-DDTHH:mm')
        toDate = y.endOf('day').format('YYYY-MM-DDTHH:mm')
        break
      case "3days":
        fromDate = today.subtract(2, "day").startOf('day').format('YYYY-MM-DDTHH:mm')
        toDate = today.endOf('day').format('YYYY-MM-DDTHH:mm')
        break
      case "thisMonth":
        fromDate = today.startOf("month").format('YYYY-MM-DDTHH:mm')
        toDate = today.endOf("month").format('YYYY-MM-DDTHH:mm')
        break
      case "lastMonth":
        const last = today.subtract(1, "month")
        fromDate = last.startOf("month").format('YYYY-MM-DDTHH:mm')
        toDate = last.endOf("month").format('YYYY-MM-DDTHH:mm')
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

  // 排序變化時重新排序現有資料
  useEffect(() => {
    setOrders((prev) => sortOrders(prev));
  }, [sortKey, sortDirection]);

  // 頁面載入時自動搜尋一次
  useEffect(() => {
    if (currentUser && !hasSearched) {
      setHasSearched(true)
      loadOrders()
    }
  }, [currentUser])

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
        page: currentPage.toString(),
        limit: limit.toString()
      })

      // 只有超級管理員或全域管理員才需要指定公司參數
      if (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'GLOBAL_ADMIN') {
        // 超級管理員可以查看所有公司的訂單，這裡可以根據需要添加公司選擇功能
        // 暫時預設查看公司 'a' 的訂單
        params.append('company', 'a')
      }
      // 代理商會由後端根據 JWT token 自動限制只能查看自己公司的訂單

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim())
      }

      if (paymentMethodFilter && paymentMethodFilter !== 'all') {
        params.append('payment_method', paymentMethodFilter)
      }

      // 訂購日期範圍篩選 - 使用 datetime-local 格式
      if (startDate && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(startDate)) {
        const fromTime = fromDatetimeLocalToTaiwan(startDate, false)
        params.append('start_date', fromTime)
      }

      if (endDate && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(endDate)) {
        const toTime = fromDatetimeLocalToTaiwan(endDate, true)
        params.append('end_date', toTime)
      }

      if (productNameFilter.trim()) {
        params.append('product_name', productNameFilter.trim())
      }

      const response = await fetch(`http://localhost:3001/admin/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          // 未授權，清除 token 並重定向到登入頁面
          console.error('認證失效，重定向到登入頁面')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/login'
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // 應用排序到載入的資料
      const sortedOrders = sortOrders(data.data || [])
      setOrders(sortedOrders)
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
      'line_pay': 'LINE Pay',
      'ecpay_credit': '綠界信用卡',
      'ecpay_atm': '綠界ATM轉帳',
      'ecpay_cvs': '綠界超商代碼',
      'ecpay_barcode': '綠界超商條碼',
      'ecpay_all': '綠界金流'
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

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="promotions-admin-container">
      {/* 頁面標題區域 */}
      <div className="promotions-header">
        <h1>訂單管理</h1>
      </div>

      {/* 篩選區域 */}
      <div className="filter-section">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="filter-toggle"
        >
          <span>🔍 篩選條件</span>
          <span className={`filter-arrow ${isFilterOpen ? "rotate" : ""}`}>▼</span>
        </button>

        {isFilterOpen && (
          <div className="filter-content">
            <div className="filter-grid">
              <div className="form-group">
                <label htmlFor="status-filter" className="form-label">訂單狀態</label>
                <select 
                  id="status-filter" 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)} 
                  className="form-select"
                >
                  <option value="">全部狀態</option>
                  <option value="pending">待付款</option>
                  <option value="paid">已付款</option>
                  <option value="processing">處理中</option>
                  <option value="shipped">已出貨</option>
                  <option value="delivered">已送達</option>
                  <option value="cancelled">已取消</option>
                  <option value="refunded">已退款</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="payment-filter" className="form-label">付款方式</label>
                <select 
                  id="payment-filter" 
                  value={paymentMethodFilter} 
                  onChange={(e) => setPaymentMethodFilter(e.target.value)} 
                  className="form-select"
                >
                  <option value="">全部付款方式</option>
                  <option value="credit_card">信用卡</option>
                  <option value="bank_transfer">銀行轉帳</option>
                  <option value="cash_on_delivery">貨到付款</option>
                  <option value="line_pay">LINE Pay</option>
                  <option value="ecpay_credit">綠界信用卡</option>
                  <option value="ecpay_atm">綠界ATM轉帳</option>
                  <option value="ecpay_cvs">綠界超商代碼</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="search-term" className="form-label">搜尋訂單</label>
                <input 
                  type="text" 
                  id="search-term"
                  placeholder="訂單編號、客戶姓名或電話" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="form-input" 
                />
              </div>

              <div className="form-group">
                <label htmlFor="product-filter" className="form-label">商品名稱</label>
                <input 
                  type="text" 
                  id="product-filter"
                  placeholder="搜尋商品名稱" 
                  value={productNameFilter} 
                  onChange={(e) => setProductNameFilter(e.target.value)} 
                  className="form-input" 
                />
              </div>

              <div className="form-group date-range-group">
                <label className="form-label">訂購日期範圍</label>
                <div className="date-inputs">
                  <DateTimePicker
                    value={startDate}
                    onChange={(value) => setStartDate(value)}
                    placeholder="開始時間"
                    className="form-input"
                  />
                  <span className="date-separator">至</span>
                  <DateTimePicker
                    value={endDate}
                    onChange={(value) => setEndDate(value)}
                    placeholder="結束時間"
                    className="form-input"
                  />
                </div>
                <div className="quick-date-buttons">
                  <button onClick={() => quickSetDate("today")} className="btn-quick-date">今日</button>
                  <button onClick={() => quickSetDate("yesterday")} className="btn-quick-date">昨日</button>
                  <button onClick={() => quickSetDate("3days")} className="btn-quick-date">近三日</button>
                  <button onClick={() => quickSetDate("thisMonth")} className="btn-quick-date">本月</button>
                  <button onClick={() => quickSetDate("lastMonth")} className="btn-quick-date">上月</button>
                </div>
              </div>
            </div>

            <div className="filter-actions">
              <button onClick={handleSearch} className="btn-search">🔍 查詢</button>
              <button onClick={clearFilter} className="btn-clear">🗑️ 清除</button>
            </div>
          </div>
        )}
      </div>

      {/* 載入狀態和錯誤訊息 */}
      {loading && (
        <div className="loading-spinner">
          <div>⏳ 載入中...</div>
        </div>
      )}

      {!loading && hasSearched && (
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
                }}
                className="btn-search"
              >
                套用
              </button>
            </div>
            <div className="pagination-info">
              共 {totalOrders} 筆資料
            </div>
          </div>

          {/* 現代化表格 */}
          <table className="modern-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort("id")}>
                  <div className="fl4">
                    ID <span className={`sort-icon ${sortKey === "id" ? "active" : ""}`}>{getArrow("id")}</span>
                  </div>
                </th>
                <th onClick={() => toggleSort("order_number")}>
                  <div className="fl4">
                    訂單編號 <span className={`sort-icon ${sortKey === "order_number" ? "active" : ""}`}>{getArrow("order_number")}</span>
                  </div>
                </th>
                <th onClick={() => toggleSort("created_at")}>
                  <div className="fl4">
                    訂購時間 <span className={`sort-icon ${sortKey === "created_at" ? "active" : ""}`}>{getArrow("created_at")}</span>
                  </div>
                </th>
                <th>買家帳號</th>
                <th className="w30">商品摘要</th>
                <th onClick={() => toggleSort("total_amount")}>
                  <div className="fl4">
                    總金額 <span className={`sort-icon ${sortKey === "total_amount" ? "active" : ""}`}>{getArrow("total_amount")}</span>
                  </div>
                </th>
                <th>付款狀態</th>
                <th>出貨狀態</th>
                <th>備註</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>
                    <div className="order-number">{order.order_number}</div>
                  </td>
                  <td style={{fontSize: "12px", lineHeight: "1.4"}}>
                    {toTaiwanDisplayTime(order.created_at)}
                  </td>
                  <td>
                    <div className="customer-name">
                      {order.user?.username || '訪客'}
                    </div>
                  </td>
                  <td>
                    <div className="product-summary">
                      {getProductSummary(order.items)}
                    </div>
                  </td>
                  <td style={{textAlign: "right", fontWeight: "600"}}>
                    {Math.round(order.total_amount).toLocaleString()}
                  </td>
                  <td>
                    <span className={`status-badge ${
                      (order.payment_status || order.status) === "paid" ? "status-active" :
                      (order.payment_status || order.status) === "pending" ? "status-upcoming" :
                      "status-expired"
                    }`}>
                      {getPaymentStatusText(order.payment_status || order.status)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      (order.shipping_status || order.status) === "delivered" ? "status-active" :
                      (order.shipping_status || order.status) === "shipped" ? "status-upcoming" :
                      "status-expired"
                    }`}>
                      {getShippingStatusText(order.shipping_status || order.status)}
                    </span>
                  </td>
                  <td>
                    <div className="admin-notes">
                      {order.admin_notes || '-'}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="btn-edit"
                      >
                        👁️ 查看
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 無資料顯示 */}
          {!loading && hasSearched && orders.length === 0 && (
            <div className="no-data">
              <img src="/no-information.webp" alt="無資料" />
              <p>查無符合條件的訂單</p>
            </div>
          )}

          {/* 通用分頁元件 */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalOrders}
            pageSize={limit}
            onPageChange={handlePageChange}
            showPageSizeSelector={false}
            loading={loading}
          />
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
                    
                    {/* 價格明細 */}
                    <div className="order-pricing-summary">
                      <div className="pricing-row">
                        <span className="pricing-label">商品小計</span>
                        <span className="pricing-value">
                          NT$ {(selectedOrder.subtotal || 
                            selectedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                          ).toLocaleString()}
                        </span>
                      </div>
                      
                      {selectedOrder.coupon_code && selectedOrder.coupon_discount && (
                        <div className="pricing-row discount-row">
                          <span className="pricing-label">
                            🎫 優惠券折扣 ({selectedOrder.coupon_code})
                          </span>
                          <span className="pricing-discount">
                            -NT$ {selectedOrder.coupon_discount.toLocaleString()}
                          </span>
                        </div>
                      )}
                      
                      {selectedOrder.shipping_fee && selectedOrder.shipping_fee > 0 && (
                        <div className="pricing-row">
                          <span className="pricing-label">運費</span>
                          <span className="pricing-value">
                            NT$ {selectedOrder.shipping_fee.toLocaleString()}
                          </span>
                        </div>
                      )}
                      
                      <div className="pricing-divider"></div>
                      
                      <div className="pricing-row total-row">
                        <span className="pricing-label">訂單總額</span>
                        <span className="pricing-total">
                          NT$ {selectedOrder.total_amount.toLocaleString()}
                        </span>
                      </div>
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