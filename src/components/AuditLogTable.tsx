// frontend\src\components\AuditLogTable.tsx
"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import Pagination from "@/components/ui/Pagination";
import "@/styles/pages/users.css";

// 角色中文化映射
const roleMap: Record<string, string> = {
  SUPER_ADMIN: "超級管理員",
  GLOBAL_ADMIN: "全域管理員", 
  AGENT_OWNER: "代理商老闆",
  AGENT_SUPPORT: "客服",
  USER: "會員",
};

// 狀態中文化映射
const statusMap: Record<string, string> = {
  active: "啟用",
  inactive: "停用", 
  banned: "封鎖",
  ACTIVE: "啟用",
  INACTIVE: "停用",
  BANNED: "封鎖",
};

// 格式化操作文字，將英文角色和狀態轉換為中文
const formatActionText = (action: string): string => {
  let formattedAction = action;
  
  // 替換所有角色英文為中文
  Object.entries(roleMap).forEach(([englishRole, chineseRole]) => {
    const regex = new RegExp(`角色：${englishRole}`, 'g');
    formattedAction = formattedAction.replace(regex, `角色：${chineseRole}`);
  });
  
  // 替換狀態變更中的英文狀態為中文
  Object.entries(statusMap).forEach(([englishStatus, chineseStatus]) => {
    // 處理 "status - username（oldStatus → newStatus）" 格式
    const statusRegex = new RegExp(`（([^→]+)\\s*→\\s*${englishStatus}\\s*）`, 'g');
    formattedAction = formattedAction.replace(statusRegex, (match, beforeArrow) => {
      const translatedBefore = statusMap[beforeArrow.trim()] || beforeArrow.trim();
      return `（${translatedBefore} → ${chineseStatus}）`;
    });
    
    // 處理 "status - username（englishStatus → otherStatus）" 格式  
    const statusRegex2 = new RegExp(`（${englishStatus}\\s*→\\s*([^）]+)）`, 'g');
    formattedAction = formattedAction.replace(statusRegex2, (match, afterArrow) => {
      const translatedAfter = statusMap[afterArrow.trim()] || afterArrow.trim();
      return `（${chineseStatus} → ${translatedAfter}）`;
    });
  });
  
  return formattedAction;
};

// 格式化 IP 地址，確保顯示為標準 IPv4 格式
const formatIpAddress = (ip: string): string => {
  // 如果是 IPv6 映射的 IPv4 地址（如 ::ffff:127.0.0.1），提取 IPv4 部分
  if (ip.startsWith('::ffff:')) {
    return ip.replace('::ffff:', '');
  }
  
  // 如果是 IPv6 loopback（::1），轉換為 IPv4 loopback
  if (ip === '::1') {
    return '127.0.0.1';
  }
  
  // 其他情況直接返回原始 IP
  return ip;
};

interface AuditLog {
  id: number;
  ip: string;
  platform: string;
  action: string;
  created_at: string;
  user: {
    id: number;
    username: string;
  } | null;
}

export default function AuditLogTable({
  keyword,
  title,
  target,
}: {
  keyword: string;
  title: string;
  target?: string;
}) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // const [target, setTarget] = useState("")

  const [search, setSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [ipSearch, setIpSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [inputLimit, setInputLimit] = useState(20); // 用於輸入框的值
  
  // 篩選展開狀態
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      if (target) params.append("target", target);
      if (search) params.append("search", search);
      if (userSearch) params.append("user", userSearch);
      if (ipSearch) params.append("ip", ipSearch);
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/audit-log?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`API 錯誤: ${res.status}`);

      const result = await res.json();
      if (!Array.isArray(result.data)) throw new Error("API 回傳格式錯誤");

      setLogs(result.data);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch (err: any) {
      // API 錯誤，靜默處理
      setError(err.message || "API 讀取失敗");
    } finally {
      setLoading(false);
    }
  };

  // 當分頁或每頁筆數改變時重新載入資料
  useEffect(() => {
    if (logs.length > 0 || totalCount > 0) { // 只有在已經有資料的情況下才自動重新載入
      fetchLogs();
    }
  }, [page, limit]);

  const clearFilter = () => {
    setSearch("");
    setUserSearch("");
    setIpSearch("");
    setFrom("");
    setTo("");
    setLogs([]);
    setTotalPages(1);
    setTotalCount(0);
  };

  const quickSetDate = (type: string) => {
    const today = dayjs();
    switch (type) {
      case "today":
        setFrom(today.format("YYYY-MM-DD"));
        setTo(today.format("YYYY-MM-DD"));
        break;
      case "yesterday":
        setFrom(today.subtract(1, "day").format("YYYY-MM-DD"));
        setTo(today.subtract(1, "day").format("YYYY-MM-DD"));
        break;
      case "3days":
        setFrom(today.subtract(2, "day").format("YYYY-MM-DD"));
        setTo(today.format("YYYY-MM-DD"));
        break;
      case "thisMonth":
        setFrom(today.startOf("month").format("YYYY-MM-DD"));
        setTo(today.endOf("month").format("YYYY-MM-DD"));
        break;
      case "lastMonth":
        const last = today.subtract(1, "month");
        setFrom(last.startOf("month").format("YYYY-MM-DD"));
        setTo(last.endOf("month").format("YYYY-MM-DD"));
        break;
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="users-container">
      <div className="users-header">
        <h1>{title}</h1>
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
                <label htmlFor="search-input" className="form-label">操作關鍵字</label>
                <input
                  type="text"
                  id="search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="例如：新增、刪除"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="user-search" className="form-label">使用者帳號</label>
                <input
                  type="text"
                  id="user-search"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="使用者帳號"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="ip-search" className="form-label">IP 位址</label>
                <input
                  type="text"
                  id="ip-search"
                  value={ipSearch}
                  onChange={(e) => setIpSearch(e.target.value)}
                  placeholder="IP 位址"
                  className="form-input"
                />
              </div>
            </div>
            
            <div className="filter-row">
              <div className="form-group date-range-group">
                <label htmlFor="date-from" className="form-label">時間範圍</label>
                <div className="date-inputs">
                  <input
                    type="date"
                    id="date-from"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="form-input"
                  />
                  <span className="date-separator">至</span>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
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
              <button onClick={() => { setPage(1); fetchLogs(); }} className="btn-search">🔍 查詢</button>
              <button onClick={clearFilter} className="btn-clear">🗑️ 清除</button>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="loading">
          <div className="loading-text">載入中...</div>
        </div>
      )}
      
      {error && (
        <div className="error">
          <p>錯誤：{error}</p>
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="no-data">
          <img src="/no-information.webp" alt="無資料" />
          <p>查無資料</p>
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
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
                  setPage(1);
                }}
                className="btn-search"
              >
                套用
              </button>
            </div>
            <div className="pagination-info">
              共 {totalCount} 筆資料
            </div>
          </div>

          {/* 現代化表格 */}
          <table className="modern-table">
            <thead>
              <tr>
                <th>
                  <div className="fl4">ID</div>
                </th>
                <th>
                  <div className="fl4">使用者</div>
                </th>
                <th>
                  <div className="fl4">IP位址</div>
                </th>
                <th>
                  <div className="fl4">裝置平台</div>
                </th>
                <th>
                  <div className="fl4">操作內容</div>
                </th>
                <th>
                  <div className="fl4">操作時間</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>#{log.id}</td>
                  <td>
                    <div className="user-info">
                      <div className="user-name">{log.user?.username || "未知使用者"}</div>
                    </div>
                  </td>
                  <td>
                    <div className="ip-address">{formatIpAddress(log.ip)}</div>
                  </td>
                  <td>
                    <div className="platform-info">{log.platform}</div>
                  </td>
                  <td>
                    <div className="action-info">
                      <span className="action-badge">{formatActionText(log.action)}</span>
                    </div>
                  </td>
                  <td style={{fontSize: "12px", lineHeight: "1.4"}}>
                    {new Date(log.created_at).toLocaleString("zh-TW", {
                      timeZone: "Asia/Taipei",
                      hour12: false,
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 無資料顯示 */}
          {!loading && logs.length === 0 && (
            <div className="no-data">
              <img src="/no-information.webp" alt="無資料" />
              <p>查無符合條件的審計記錄</p>
            </div>
          )}

          {/* 通用分頁元件 */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={limit}
            onPageChange={handlePageChange}
            showPageSizeSelector={false}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}
