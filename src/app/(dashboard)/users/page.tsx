// frontend\src\app\(dashboard)\users\page.tsx
"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { User } from "@/types/user";
import "@/styles/pages/users.css";

type SortKey = "id" | "created_at" | "last_login_at" | null;
type SortDirection = "asc" | "desc" | null;

const statusMap: Record<string, string> = {
  ACTIVE: "啟用",
  INACTIVE: "停用",
  BANNED: "封鎖",
};

export default function UserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState<"id" | "created_at" | "last_login_at" | null>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>("asc");
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("");
  const [blacklist, setBlacklist] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [loginFrom, setLoginFrom] = useState("");
  const [loginTo, setLoginTo] = useState("");
  const [exportFormat, setExportFormat] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [inputLimit, setInputLimit] = useState(limit);

  // 篩選展開
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const quickSetDate = (type: string, target: "created" | "login") => {
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
        fromDate = today.subtract(2, "day").format("YYYY-MM-DD");
        toDate = today.format("YYYY-MM-DD");
        break;
      case "thisMonth":
        fromDate = today.startOf("month").format("YYYY-MM-DD");
        toDate = today.endOf("month").format("YYYY-MM-DD");
        break;
      case "lastMonth":
        const last = today.subtract(1, "month");
        fromDate = last.startOf("month").format("YYYY-MM-DD");
        toDate = last.endOf("month").format("YYYY-MM-DD");
        break;
    }

    if (target === "created") {
      setCreatedFrom(fromDate);
      setCreatedTo(toDate);
    } else {
      setLoginFrom(fromDate);
      setLoginTo(toDate);
    }
  };

  const clearFilter = () => {
    setUsername("");
    setStatus("");
    setBlacklist("");
    setCreatedFrom("");
    setCreatedTo("");
    setLoginFrom("");
    setLoginTo("");
    setUsers([]);
    setTotalPages(1);
    setTotalCount(0);
    setHasSearched(false);
  };

  const handleExport = (format: "csv" | "xlsx") => {
    const token = localStorage.getItem("token");
    const params = new URLSearchParams();
    if (username) params.append("username", username);
    if (status) params.append("status", status);
    if (blacklist) params.append("blacklist", blacklist);

    if (createdFrom) params.append("createdFrom", createdFrom + " 00:00:00");
    if (createdTo) params.append("createdTo", createdTo + " 23:59:59");

    if (loginFrom) params.append("loginFrom", loginFrom + " 00:00:00");
    if (loginTo) params.append("loginTo", loginTo + " 23:59:59");
    params.append("excludeUserRole", "false");
    params.append("format", format);
    params.append("token", token || "");
    const url = `http://localhost:3001/user/export?${params.toString()}`;
    window.open(url);
  };

  const sortUsers = (data: User[]) => {
    if (!sortKey || !sortDirection) return data;
    return [...data].sort((a, b) => {
      const getValue = (user: User) => {
        if (sortKey === "created_at" || sortKey === "last_login_at") {
          return user[sortKey] ? new Date(user[sortKey]!).getTime() : 0;
        }
        return (user[sortKey] as number) ?? 0;
      };
      const aVal = getValue(a);
      const bVal = getValue(b);
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });
  };

  const fetchUsers = async (useInitialFilter = false) => {
    if (!Number.isFinite(limit) || !Number.isFinite(page)) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (username) params.append("username", username);
      if (status) params.append("status", status);
      if (blacklist) params.append("blacklist", blacklist);

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

      if (loginFrom) params.append("loginFrom", loginFrom + " 00:00:00");
      if (loginTo) params.append("loginTo", loginTo + " 23:59:59");

      params.append("limit", limit.toString());
      params.append("page", page.toString());
      params.append("excludeUserRole", "false");

      const res = await fetch(`http://localhost:3001/user?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();

      setUsers(sortUsers(result.data));
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasSearched) fetchUsers();
  }, [limit, page]);

  useEffect(() => {
    setUsers((prev) => sortUsers(prev));
  }, [sortKey, sortDirection]);

  // 頁面載入時自動搜尋3日內資料
  useEffect(() => {
    if (!hasSearched) {
      setHasSearched(true);
      fetchUsers(true); // 使用初始篩選條件
    }
  }, []);

  const handleSearch = () => {
    setHasSearched(true);
    setPage(1);
    fetchUsers();
  };

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
      <span className={`${isActive }`}>
        {getIcon()}
      </span>
    );
  };

  const handleToggleStatus = async (userId: number, currentStatus: string) => {
    const token = localStorage.getItem("token");
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await fetch(`http://localhost:3001/user/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, status: newStatus } : user
        )
      );
    } catch (err) {
      console.error("切換狀態失敗", err);
    }
  };

  const handleToggleBlacklist = async (userId: number, current: boolean) => {
    const token = localStorage.getItem("token");
    try {
      await fetch(`http://localhost:3001/user/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_blacklisted: !current }),
      });

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, is_blacklisted: !current } : user
        )
      );
    } catch (err) {
      console.error("切換黑名單失敗", err);
    }
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
          第 {page} 頁，共 {totalPages} 頁（總計 {totalCount} 筆資料）
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

  return (
    <div className="users-container">
      {/* 頁面標題區域 */}
      <div className="users-header">
        <h1>👥 會員列表</h1>
        <div className="users-header-actions">
          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
            📊 管理系統會員資料與狀態
          </div>
        </div>
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
                <label htmlFor="username-search" className="form-label">帳號</label>
                <input 
                  type="text" 
                  id="username-search"
                  placeholder="請輸入帳號" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  className="form-input" 
                />
              </div>

              <div className="form-group">
                <label htmlFor="status-select" className="form-label">帳號狀態</label>
                <select 
                  id="status-select" 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)} 
                  className="form-select"
                >
                  <option value="">全部狀態</option>
                  <option value="ACTIVE">✅ 啟用</option>
                  <option value="INACTIVE">⏸️ 停用</option>
                  <option value="BANNED">🚫 封鎖</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="blacklist-select" className="form-label">黑名單狀態</label>
                <select 
                  id="blacklist-select" 
                  value={blacklist} 
                  onChange={(e) => setBlacklist(e.target.value)} 
                  className="form-select"
                >
                  <option value="">全部狀態</option>
                  <option value="true">🚫 是</option>
                  <option value="false">✅ 否</option>
                </select>
              </div>
            </div>

            <div className="filter-row">
              <div className="form-group date-range-group">
                <label htmlFor="created-date-from" className="form-label">註冊時間範圍</label>
                <div className="date-inputs">
                  <input 
                    type="date" 
                    id="created-date-from"
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
                  <button onClick={() => quickSetDate("today", "created")} className="btn-quick-date">今日</button>
                  <button onClick={() => quickSetDate("yesterday", "created")} className="btn-quick-date">昨日</button>
                  <button onClick={() => quickSetDate("3days", "created")} className="btn-quick-date">近三日</button>
                  <button onClick={() => quickSetDate("thisMonth", "created")} className="btn-quick-date">本月</button>
                  <button onClick={() => quickSetDate("lastMonth", "created")} className="btn-quick-date">上月</button>
                </div>
              </div>

              <div className="form-group date-range-group">
                <label htmlFor="login-date-from" className="form-label">登入時間範圍</label>
                <div className="date-inputs">
                  <input 
                    type="date" 
                    id="login-date-from"
                    value={loginFrom} 
                    onChange={(e) => setLoginFrom(e.target.value)} 
                    className="form-input" 
                  />
                  <span className="date-separator">至</span>
                  <input 
                    type="date" 
                    value={loginTo} 
                    onChange={(e) => setLoginTo(e.target.value)} 
                    className="form-input" 
                  />
                </div>
                <div className="quick-date-buttons">
                  <button onClick={() => quickSetDate("today", "login")} className="btn-quick-date">今日</button>
                  <button onClick={() => quickSetDate("yesterday", "login")} className="btn-quick-date">昨日</button>
                  <button onClick={() => quickSetDate("3days", "login")} className="btn-quick-date">近三日</button>
                  <button onClick={() => quickSetDate("thisMonth", "login")} className="btn-quick-date">本月</button>
                  <button onClick={() => quickSetDate("lastMonth", "login")} className="btn-quick-date">上月</button>
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

      {/* 載入狀態 */}
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
                  setPage(1); // 重置到第一頁
                }}
                className="btn-search"
              >
                套用
              </button>
            </div>

            <div className="export-control">
              <label>資料匯出：</label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="form-select"
                style={{ width: 'auto', minWidth: '120px' }}
              >
                <option value="">選擇格式</option>
                <option value="csv">📄 CSV</option>
                <option value="xlsx">📊 Excel</option>
              </select>
              <button
                onClick={() => {
                  if (!exportFormat) {
                    alert("請先選擇匯出格式");
                    return;
                  }
                  handleExport(exportFormat as "csv" | "xlsx");
                }}
                className="btn-search"
              >
                📥 匯出
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
                <th onClick={() => toggleSort("id")}>
                  ID <span className={`sort-icon ${sortKey === "id" ? "active" : ""}`}>{getArrow("id")}</span>
                </th>
                <th>會員資訊</th>
                <th onClick={() => toggleSort("created_at")}>
                  註冊時間 <span className={`sort-icon ${sortKey === "created_at" ? "active" : ""}`}>{getArrow("created_at")}</span>
                </th>
                <th>登入資訊</th>
                <th onClick={() => toggleSort("last_login_at")}>
                  最後登入 <span className={`sort-icon ${sortKey === "last_login_at" ? "active" : ""}`}>{getArrow("last_login_at")}</span>
                </th>
                <th>狀態</th>
                <th>黑名單</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>#{user.id}</td>
                  <td>
                    <div className="user-info">
                      <div className="user-username">{user.username}</div>
                      <div className="user-email">{user.email || "未設定信箱"}</div>
                    </div>
                  </td>
                  <td>
                    <div className="login-info">
                      📅 {user.created_at ? new Date(user.created_at).toLocaleString("zh-TW", { 
                        timeZone: "Asia/Taipei", 
                        hour12: false,
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : "未知"}
                    </div>
                  </td>
                  <td>
                    <div className="login-info">
                      <div>🌐 {user.last_login_ip || "無記錄"}</div>
                      <div>📱 {user.last_login_platform || "未知平台"}</div>
                    </div>
                  </td>
                  <td>
                    <div className="login-info">
                      🕒 {user.last_login_at ? new Date(user.last_login_at).toLocaleString("zh-TW", { 
                        timeZone: "Asia/Taipei", 
                        hour12: false,
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : "未曾登入"}
                    </div>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleToggleStatus(user.id, user.status)} 
                      className={`status-toggle ${user.status === "ACTIVE" ? "status-active" : "status-inactive"}`}
                    >
                      {user.status === "ACTIVE" ? "✅ 啟用" : "⏸️ 停用"}
                    </button>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleToggleBlacklist(user.id, user.is_blacklisted)} 
                      className={`blacklist-toggle ${user.is_blacklisted ? "blacklist-yes" : "blacklist-no"}`}
                    >
                      {user.is_blacklisted ? "🚫 是" : "✅ 否"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 無資料顯示 */}
          {!loading && hasSearched && users.length === 0 && (
            <div className="no-data">
              <img src="/no-information.webp" alt="無資料" />
              <p>查無符合條件的會員資料</p>
            </div>
          )}

          {/* 分頁控制 */}
          {renderPagination()}
        </div>
      )}
    </div>
  );
}