"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import '@/styles/pages/lucky-draw-records.css';

interface DrawRecord {
  id: number;
  userId: number;
  prizeId: number;
  prizeName: string;
  userIp: string;
  userAgent: string;
  createdAt: string;
  eventId?: number;
  user: {
    id: number;
    username: string;
    email: string;
  };
  prize: {
    id: number;
    name: string;
    imageUrl: string;
    quantity: number;
    probability: number;
    event?: {
      id: number;
      name: string;
      isActive: boolean;
    };
  };
  event?: {
    id: number;
    name: string;
    isActive: boolean;
  };
}

export default function LuckyDrawRecordsPage() {
  const [records, setRecords] = useState<DrawRecord[]>([]);

  const formatIpAddress = (ip: string) => {
    if (!ip) return '未知IP';
    
    // 特殊處理：IPv6 localhost (::1) 轉換為 IPv4 localhost (127.0.0.1)
    if (ip === '::1') {
      return '127.0.0.1';
    }
    
    // 如果是IPv6格式，嘗試提取IPv4部分
    if (ip.includes('::ffff:')) {
      // IPv4-mapped IPv6 address (::ffff:192.168.1.1)
      return ip.replace('::ffff:', '');
    }
    
    // 如果是其他IPv6地址，嘗試轉換為IPv4格式
    if (ip.includes(':')) {
      // 對於其他IPv6地址，我們可以生成一個對應的IPv4地址
      // 這裡使用簡單的映射方式
      const parts = ip.split(':').filter(part => part !== '');
      if (parts.length > 0) {
        // 取最後幾個部分來生成IPv4
        const lastPart = parts[parts.length - 1];
        if (lastPart) {
          try {
            // 將16進制轉換為IPv4格式
            const hex = lastPart.padStart(8, '0');
            const a = parseInt(hex.substr(0, 2), 16);
            const b = parseInt(hex.substr(2, 2), 16);
            const c = parseInt(hex.substr(4, 2), 16);
            const d = parseInt(hex.substr(6, 2), 16);
            return `${a}.${b}.${c}.${d}`;
          } catch (e) {
            // 如果轉換失敗，返回一個默認的本地IP
            return '192.168.1.1';
          }
        }
      }
      // 如果無法解析，返回默認本地IP
      return '192.168.1.1';
    }
    
    // 如果已經是IPv4格式，直接返回
    return ip;
  };
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 分頁相關
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [inputLimit, setInputLimit] = useState(20);
  
  // 搜尋篩選相關
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [username, setUsername] = useState("");
  const [prizeName, setPrizeName] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("");

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const companyId = user?.companyId;

      const res = await fetch(`http://localhost:3001/lucky-draw-events?companyId=${companyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();

      if (Array.isArray(result)) {
        setEvents(result);
      }
    } catch (err) {
      console.error("活動載入失敗", err);
    }
  };

  const fetchRecordsWithParams = async (customLimit?: number, customPage?: number, useInitialFilter = false) => {
    const currentLimit = customLimit || limit;
    const currentPage = customPage || page;
    
    if (!Number.isFinite(currentLimit) || !Number.isFinite(currentPage)) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const companyId = user?.companyId;

      const params = new URLSearchParams();
      if (companyId) params.append("companyId", companyId.toString());
      if (selectedEventId) params.append("eventId", selectedEventId.toString());
      if (username.trim()) params.append("username", username.trim());
      if (prizeName.trim()) params.append("prizeName", prizeName.trim());
      
      // 如果是初始載入，使用近3天的時間範圍，否則使用篩選條件中的時間
      if (useInitialFilter) {
        const today = dayjs();
        const threeDaysAgo = today.subtract(2, "day").format("YYYY-MM-DD");
        const todayStr = today.format("YYYY-MM-DD");
        params.append("createdFrom", threeDaysAgo + " 00:00:00");
        params.append("createdTo", todayStr + " 23:59:59");
      } else {
        if (createdFrom) params.append("createdFrom", createdFrom + " 00:00:00");
        if (createdTo) params.append("createdTo", createdTo + " 23:59:59");
      }
      
      params.append("limit", currentLimit.toString());
      params.append("page", currentPage.toString());

      console.log('發送搜尋請求:', params.toString());

      const res = await fetch(`http://localhost:3001/lucky-prize/records?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const result = await res.json();
      console.log('API 回應:', result);

      if (result.data && Array.isArray(result.data)) {
        setRecords(result.data);
        setTotalPages(result.totalPages || 1);
        setTotalCount(result.totalCount || 0);
      } else if (Array.isArray(result)) {
        // 向後兼容舊的 API 格式
        setRecords(result);
        setTotalPages(1);
        setTotalCount(result.length);
      } else {
        setRecords([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (err) {
      console.error("記錄載入失敗", err);
      setRecords([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    return fetchRecordsWithParams();
  };

  const quickSetDate = (type: string) => {
    const today = dayjs();
    let fromDate = "";
    let toDate = "";

    switch (type) {
      case "today":
        fromDate = today.format("YYYY-MM-DD");
        toDate = today.format("YYYY-MM-DD");
        break;
      case "yesterday":
        const y = today.subtract(1, "day");
        fromDate = y.format("YYYY-MM-DD");
        toDate = y.format("YYYY-MM-DD");
        break;
      case "3days":
        fromDate = today.subtract(3, "day").format("YYYY-MM-DD");
        toDate = today.format("YYYY-MM-DD");
        break;
      case "thisMonth":
        fromDate = today.startOf("month").format("YYYY-MM-DD");
        toDate = today.format("YYYY-MM-DD");
        break;
      case "lastMonth":
        const lastMonth = today.subtract(1, "month");
        fromDate = lastMonth.startOf("month").format("YYYY-MM-DD");
        toDate = lastMonth.endOf("month").format("YYYY-MM-DD");
        break;
    }

    setCreatedFrom(fromDate);
    setCreatedTo(toDate);
  };

  const handleSearch = () => {
    setHasSearched(true);
    setPage(1);
    fetchRecordsWithParams();
  };

  const clearFilter = () => {
    setSelectedEventId(null);
    setUsername("");
    setPrizeName("");
    setCreatedFrom(""); //   清空日期，不設預設值
    setCreatedTo(""); //   清空日期，不設預設值
    setPage(1);
    // 清除後需要手動點擊查詢按鈕
  };

  const handleExport = (format: "csv" | "xlsx") => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const companyId = user?.companyId;

    const params = new URLSearchParams();
    if (companyId) params.append("companyId", companyId.toString());
    if (selectedEventId) params.append("eventId", selectedEventId.toString());
    if (username.trim()) params.append("username", username.trim());
    if (prizeName.trim()) params.append("prizeName", prizeName.trim());
    if (createdFrom) params.append("createdFrom", createdFrom + " 00:00:00");
    if (createdTo) params.append("createdTo", createdTo + " 23:59:59");
    
    params.append("format", format);
    params.append("token", token || "");
    
    const url = `http://localhost:3001/lucky-prize/export?${params.toString()}`;
    window.open(url);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-TW");
  };

  const getDeviceInfo = (userAgent: string) => {
    if (!userAgent) return "未知裝置";
    
    if (userAgent.includes("Mobile")) return "📱 手機";
    if (userAgent.includes("Tablet")) return "📱 平板";
    return "💻 電腦";
  };

  const renderPagination = () => {
    if (totalPages <= 1 || totalCount === 0) return null;

    const pages = [];

    if (totalPages <= 10) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      const start = Math.max(2, page - 2);
      const end = Math.min(totalPages - 1, page + 2);

      if (start > 2) {
        pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return (
      <div className="pagination">
        <div className="pagination-info">
          第 {page} 頁，共 {totalPages} 頁（總計 {totalCount.toLocaleString()} 筆資料）
        </div>

        <div className="pagination-buttons">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="pagination-btn"
          >
            ⬅️ 上一頁
          </button>

          {pages.map((p, idx) =>
            p === "..." ? (
              <span key={`ellipsis-${idx}`} className="pagination-btn" style={{cursor: "default"}}>
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p as number)}
                className={`pagination-btn ${page === p ? "active" : ""}`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="pagination-btn"
          >
            下一頁 ➡️
          </button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (hasSearched) fetchRecordsWithParams();
  }, [limit, page]);

  // 頁面載入時自動搜尋3日內資料
  useEffect(() => {
    if (!hasSearched) {
      setHasSearched(true);
      fetchRecordsWithParams(undefined, undefined, true); // 使用初始篩選條件
    }
  }, []);


  return (
    <div className="lucky-draw-records-container">
      {/* 頁面標題區域 */}
      <div className="lucky-draw-records-header">
        <h1>📊 抽獎記錄查詢</h1>
        <div className="lucky-draw-records-stats">
          {hasSearched && (
            <div className="stats-item">
              <span className="stats-label">總記錄數</span>
              <span className="stats-value">{totalCount.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* 篩選區域 */}
      <div className="filter-section">
        <div className="filter-card">
          <div className="filter-header" onClick={() => setIsFilterOpen(!isFilterOpen)}>
            <div className="filter-title">
              <span className="filter-icon">🔍</span>
              <h3>搜尋篩選</h3>
            </div>
            <span className={`filter-arrow ${isFilterOpen ? "rotate" : ""}`}>▼</span>
          </div>
          
          {isFilterOpen && (
            <div className="filter-content">
              <div className="filter-grid">
                <div className="form-group">
                  <label htmlFor="username" className="form-label">
                    <span className="label-icon">👤</span>
                    用戶帳號
                  </label>
                  <input 
                    type="text" 
                    placeholder="請輸入用戶帳號" 
                    id="username" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    className="form-input" 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="prizeName" className="form-label">
                    <span className="label-icon">🎁</span>
                    獎品名稱
                  </label>
                  <input 
                    type="text" 
                    placeholder="請輸入獎品名稱" 
                    id="prizeName" 
                    value={prizeName} 
                    onChange={(e) => setPrizeName(e.target.value)} 
                    className="form-input" 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="eventSelect" className="form-label">
                    <span className="label-icon">🎯</span>
                    抽獎活動
                  </label>
                  <select 
                    id="eventSelect"
                    value={selectedEventId || ""} 
                    onChange={(e) => setSelectedEventId(e.target.value ? Number(e.target.value) : null)}
                    className="form-select"
                  >
                    <option value="">所有活動</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.name} {event.isActive ? '(啟用中)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group date-range-group">
                  <label className="form-label">
                    <span className="label-icon">📅</span>
                    抽獎時間範圍
                  </label>
                  <div className="date-inputs">
                    <input 
                      type="date" 
                      value={createdFrom} 
                      onChange={(e) => setCreatedFrom(e.target.value)} 
                      className="form-input" 
                    />
                    <span className="date-separator">至</span>
                    <input 
                      type="date" 
                      value={createdTo} 
                      onChange={(e) => setCreatedTo(e.target.value)} 
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
      </div>

      {/* 載入狀態 */}
      {loading && (
        <div className="loading-spinner">
          <div>⏳ 載入中...</div>
        </div>
      )}

      {/* 內容區域 */}
      {!loading && hasSearched && (
        <div className="content-section">
          {/* 表格控制區域 */}
          <div className="table-controls">
            <div className="table-info">
              共 {totalCount.toLocaleString()} 筆記錄
            </div>
            <div className="table-actions">
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
                    const newLimit = inputLimit;
                    setLimit(newLimit);
                    setPage(1);
                    setHasSearched(true);
                    setTimeout(() => {
                      fetchRecordsWithParams(newLimit, 1);
                    }, 100);
                  }}
                  className="btn-apply"
                >
                  套用
                </button>
              </div>
              
              <div className="export-control">
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="export-select"
                >
                  <option value="">選擇匯出格式</option>
                  <option value="csv">📄 CSV 匯出</option>
                  <option value="xlsx">📊 Excel 匯出</option>
                </select>
                <button
                  onClick={() => {
                    if (!exportFormat) {
                      alert("請先選擇匯出格式");
                      return;
                    }
                    handleExport(exportFormat as "csv" | "xlsx");
                  }}
                  className="btn-export"
                  disabled={!exportFormat}
                >
                  📥 匯出
                </button>
              </div>
            </div>
          </div>

          {/* 現代化表格 */}
          <table className="modern-table">
            <thead>
              <tr>
                <th>👤 用戶資訊</th>
                <th>🎯 活動名稱</th>
                <th>🎁 獎品資訊</th>
                <th>🖼️ 獎品圖片</th>
                <th>🎲 中獎機率</th>
                <th>⏰ 抽獎時間</th>
                <th>📱 裝置類型</th>
                <th>🌐 IP地址</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>
                    <div className="user-info">
                      <div className="user-name">{record.user?.username || "未知用戶"}</div>
                      <div className="user-email">{record.user?.email}</div>
                    </div>
                  </td>
                  <td>
                    <div className="event-info">
                      <div className="event-name">
                        {record.event?.name || record.prize?.event?.name || "未知活動"}
                      </div>
                      {(record.event?.isActive || record.prize?.event?.isActive) && (
                        <span className="event-status active">
                          ✅ 進行中
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="prize-info">
                      <div className="prize-name">
                        {record.prizeName || record.prize?.name}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="prize-image">
                      {record.prize?.imageUrl ? (
                        <img
                          src={`http://localhost:3001${record.prize.imageUrl}`}
                          alt={record.prizeName}
                          className="prize-thumbnail"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="no-image">
                          <span>📷</span>
                          <span>無圖片</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="probability-cell">
                      <span className="probability-badge">
                        🎲 {record.prize?.probability}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="time-info">
                      {formatDateTime(record.createdAt)}
                    </div>
                  </td>
                  <td>
                    <div className="device-info">
                      {getDeviceInfo(record.userAgent)}
                    </div>
                  </td>
                  <td>
                    <div className="ip-info">
                      {formatIpAddress(record.userIp)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 無資料顯示 */}
          {records.length === 0 && (
            <div className="no-data">
              <img src="/no-information.webp" alt="無資料" />
              <p>查無符合條件的抽獎記錄</p>
            </div>
          )}

          {/* 分頁控制 */}
          {renderPagination()}
        </div>
      )}
    </div>
  );
}