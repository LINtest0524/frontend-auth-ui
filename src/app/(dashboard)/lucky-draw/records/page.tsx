"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";

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
  const [createdFrom, setCreatedFrom] = useState(() => {
    const today = dayjs();
    return today.subtract(7, "day").format("YYYY-MM-DD");
  });
  const [createdTo, setCreatedTo] = useState(() => {
    const today = dayjs();
    return today.format("YYYY-MM-DD");
  });
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

  const fetchRecordsWithParams = async (customLimit?: number, customPage?: number) => {
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
      if (createdFrom) params.append("createdFrom", createdFrom + " 00:00:00");
      if (createdTo) params.append("createdTo", createdTo + " 23:59:59");
      
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

  const handleSearch = async () => {
    setHasSearched(true);
    setPage(1);
    // 確保使用最新的狀態值
    await new Promise(resolve => setTimeout(resolve, 50));
    fetchRecords();
  };

  const clearFilter = () => {
    setSelectedEventId(null);
    setUsername("");
    setPrizeName("");
    setCreatedFrom(dayjs().subtract(7, "day").format("YYYY-MM-DD"));
    setCreatedTo(dayjs().format("YYYY-MM-DD"));
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
      <div className="fo5 w100 b-data-tables_munber mb15">
        <p>
          目前第 {page} 頁，共 {totalPages} 頁（共 {totalCount} 筆資料）
        </p>

        <div className="tables_munber">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
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
                onClick={() => setPage(p as number)}
                className={`${
                  page === p ? "pagehover" : ""
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className=""
          >
            下一頁
          </button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (hasSearched) fetchRecords();
  }, [limit, page]);

  // 頁面載入時自動搜尋近7日資料
  useEffect(() => {
    if (!hasSearched) {
      setHasSearched(true);
      fetchRecords();
    }
  }, []);

  return (
    <div className="b-bigbox-all w100">
      <div className="b-ibox mb30">
        <h1>抽獎記錄</h1>

        <div className="b-ibox-s">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="b-search-btn w100"
          >
            篩選
            <span className={`i-arrow ${isFilterOpen ? "rotate" : ""}`}></span>
          </button>

          {isFilterOpen && (
            <>
              <div className="b-search-box fl1 w100 mt15">
                <div className="b-form-group-2 fl4 w33 mb25">
                  <label htmlFor="username">用戶帳號</label>
                  <input 
                    type="text" 
                    placeholder="用戶帳號" 
                    id="username" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    className="w60" 
                  />
                </div>

                <div className="b-form-group-2 fl4 w33 mb25">
                  <label htmlFor="prizeName">獎品名稱</label>
                  <input 
                    type="text" 
                    placeholder="獎品名稱" 
                    id="prizeName" 
                    value={prizeName} 
                    onChange={(e) => setPrizeName(e.target.value)} 
                    className="w60" 
                  />
                </div>

                <div className="b-form-group-2 fl4 w33 mb25">
                  <label htmlFor="eventSelect">抽獎活動</label>
                  <select 
                    id="eventSelect"
                    value={selectedEventId || ""} 
                    onChange={(e) => setSelectedEventId(e.target.value ? Number(e.target.value) : null)}
                    className="w60"
                  >
                    <option value="">所有活動</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.name} {event.isActive ? '(啟用中)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w100 fd1 mb25">
                  <div className="b-form-group-2 fl4 w100 mb10">
                    <label htmlFor="date-select-1">抽獎時間</label>
                    <div className="w70 fl4">
                      <input 
                        type="date" 
                        id="date-select-1" 
                        value={createdFrom} 
                        onChange={(e) => setCreatedFrom(e.target.value)} 
                        className="date-select flex1" 
                      />
                      <span className="dateto">到</span>
                      <input 
                        type="date" 
                        value={createdTo} 
                        onChange={(e) => setCreatedTo(e.target.value)} 
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

                <div className="fl4 w100 b-btnbox">
                  <button onClick={handleSearch} className="b-btn-s2 b-btn-c4 mr20">查詢</button>
                  <button onClick={clearFilter} className="b-btn-s2 b-btn-c1">清除</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {loading && <p>載入中...</p>}

      {!loading && hasSearched && (
        <>
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
                      // 直接使用 inputLimit 值進行搜尋，避免狀態更新延遲
                      const newLimit = inputLimit;
                      setLimit(newLimit);
                      setPage(1);
                      setHasSearched(true);
                      
                      // 使用新的 limit 值立即搜尋
                      setTimeout(() => {
                        fetchRecordsWithParams(newLimit, 1);
                      }, 100);
                    }}
                    className="b-btn-s3 b-btn-c4"
                  >
                    套用
                  </button>
                </div>

                <div className="w50 fl6">
                  <label>資料匯出：</label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="mr10"
                  >
                    <option value="">選擇格式</option>
                    <option value="csv">CSV 匯出</option>
                    <option value="xlsx">Excel 匯出</option>
                  </select>
                  <button
                    onClick={() => {
                      if (!exportFormat) {
                        alert("請先選擇匯出格式");
                        return;
                      }
                      handleExport(exportFormat as "csv" | "xlsx");
                    }}
                    className="b-btn-s2 b-btn-c4"
                  >
                    匯出
                  </button>
                </div>
              </div>

              <table className="b-table-box admin-table mb15">
                <thead>
                  <tr>
                    <th>用戶</th>
                    <th>活動名稱</th>
                    <th>獎品</th>
                    <th>獎品圖片</th>
                    <th>中獎機率</th>
                    <th>抽獎時間</th>
                    <th>裝置</th>
                    <th>IP地址</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="text-center">
                      <td>
                        <div>
                          <div className="font-semibold">{record.user?.username || "未知用戶"}</div>
                          <div className="text-sm text-gray-500">{record.user?.email}</div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="font-semibold text-blue-600">
                            {record.event?.name || record.prize?.event?.name || "未知活動"}
                          </div>
                          {(record.event?.isActive || record.prize?.event?.isActive) && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              進行中
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold">
                          {record.prizeName || record.prize?.name}
                        </div>
                      </td>
                      <td>
                        {record.prize?.imageUrl && (
                          <img
                            src={`http://localhost:3001${record.prize.imageUrl}`}
                            alt={record.prizeName}
                            width={50}
                            height={50}
                            style={{ objectFit: 'contain', margin: '0 auto' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                      </td>
                      <td>{record.prize?.probability}%</td>
                      <td>{formatDateTime(record.createdAt)}</td>
                      <td>{getDeviceInfo(record.userAgent)}</td>
                      <td>
                        <span className="text-sm font-mono">
                          {record.userIp}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {records.length === 0 && !loading && (
                    <tr>
                      <td colSpan={8} className="text-center text-gray-500">
                        暫無抽獎記錄
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {renderPagination()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}