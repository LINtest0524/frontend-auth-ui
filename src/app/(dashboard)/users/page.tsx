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

  // 標籤管理相關狀態
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [userTags, setUserTags] = useState<any[]>([]);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);

  // 存款管理相關狀態
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceType, setBalanceType] = useState<'add' | 'subtract'>('add');
  const [balanceRemark, setBalanceRemark] = useState('');

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

  // 標籤管理功能
  const fetchAvailableTags = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3001/admin/marquee-tags`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const tags = await response.json();
        setAvailableTags(tags.filter((tag: any) => tag.isActive));
      }
    } catch (err) {
      console.error("獲取標籤列表失敗", err);
    }
  };

  const fetchUserTags = async (userId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3001/user/${userId}/tags`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const tags = await response.json();
        setUserTags(tags);
      }
    } catch (err) {
      console.error("獲取使用者標籤失敗", err);
      setUserTags([]);
    }
  };

  const handleOpenTagModal = async (user: User) => {
    setSelectedUser(user);
    setIsTagModalOpen(true);
    await fetchAvailableTags();
    await fetchUserTags(user.id);
  };

  const handleToggleUserTag = async (tagId: number, isAdding: boolean) => {
    if (!selectedUser) return;
    
    try {
      const token = localStorage.getItem("token");
      const method = isAdding ? "POST" : "DELETE";
      const response = await fetch(`http://localhost:3001/user/${selectedUser.id}/tags/${tagId}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        await fetchUserTags(selectedUser.id);
        // 更新使用者列表中的標籤顯示
        fetchUsers();
      } else {
        // 處理特定的錯誤狀態
        if (response.status === 404) {
          console.warn("標籤關聯不存在，可能已被移除");
          // 刷新標籤狀態
          await fetchUserTags(selectedUser.id);
        } else if (response.status === 409) {
          console.warn("使用者已擁有此標籤");
          // 刷新標籤狀態
          await fetchUserTags(selectedUser.id);
        } else {
          console.error("更新使用者標籤失敗", response.statusText);
        }
      }
    } catch (err) {
      console.error("更新使用者標籤失敗", err);
    }
  };

  const closeTagModal = () => {
    setIsTagModalOpen(false);
    setSelectedUser(null);
    setUserTags([]);
  };

  // 存款相關功能
  const handleOpenBalanceModal = (user: User) => {
    setSelectedUser(user);
    setIsBalanceModalOpen(true);
    setBalanceAmount('');
    setBalanceType('add');
    setBalanceRemark('');
  };

  const closeBalanceModal = () => {
    setIsBalanceModalOpen(false);
    setSelectedUser(null);
    setBalanceAmount('');
    setBalanceRemark('');
  };

  const handleBalanceUpdate = async () => {
    if (!selectedUser || !balanceAmount) {
      alert('請填寫金額');
      return;
    }

    const amount = parseInt(balanceAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('請輸入有效的整數金額');
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const finalAmount = balanceType === 'subtract' ? -amount : amount;
      
      const response = await fetch(`http://localhost:3001/user/${selectedUser.id}/balance`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          amount: finalAmount,
          remark: balanceRemark || '' 
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // 更新使用者列表中的餘額
        setUsers(prev => 
          prev.map(user => 
            user.id === selectedUser.id 
              ? { ...user, balance: result.newBalance }
              : user
          )
        );
        alert(`${balanceType === 'add' ? '存款' : '扣款'}成功！新餘額：$ ${result.newBalance.toLocaleString()}`);
        closeBalanceModal();
      } else {
        const error = await response.json();
        alert(`操作失敗：${error.message || '未知錯誤'}`);
      }
    } catch (err) {
      console.error('餘額更新失敗', err);
      alert('網路錯誤，請稍後再試');
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
                <th>帳戶餘額</th>
                <th onClick={() => toggleSort("created_at")}>
                  註冊時間 <span className={`sort-icon ${sortKey === "created_at" ? "active" : ""}`}>{getArrow("created_at")}</span>
                </th>
                <th>登入資訊</th>
                <th onClick={() => toggleSort("last_login_at")}>
                  最後登入 <span className={`sort-icon ${sortKey === "last_login_at" ? "active" : ""}`}>{getArrow("last_login_at")}</span>
                </th>
                <th>狀態</th>
                <th>黑名單</th>
                <th>標籤</th>
                <th>操作</th>
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
                    <div 
                      className="balance-info" 
                      style={{ 
                        color: '#991b1b', 
                        fontWeight: 'bold', 
                        fontSize: '16px',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => handleOpenBalanceModal(user)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      title="點擊進行存款/扣款操作"
                    >
                      $ {user.balance?.toLocaleString() || '0'}
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
                  <td>
                    <div className="user-tags">
                      {/* 身分證驗證標籤 */}
                      {user.id_verified && (
                        <span 
                          className="user-tag tag-shape-oval verification-tag"
                          style={{ 
                            backgroundColor: '#10B981', 
                            color: '#FFFFFF' 
                          }}
                        >
                          身
                        </span>
                      )}
                      
                      {/* 銀行帳戶驗證標籤 */}
                      {user.bank_verified && (
                        <span 
                          className="user-tag tag-shape-oval verification-tag"
                          style={{ 
                            backgroundColor: '#3B82F6', 
                            color: '#FFFFFF' 
                          }}
                        >
                          銀
                        </span>
                      )}
                      
                      {/* 使用者自定義標籤 */}
                      {(user as any).tags?.slice(0, 2).map((tag: any) => (
                        <span 
                          key={tag.id} 
                          className={`user-tag tag-shape-${tag.shape || 'oval'}`}
                          style={{ 
                            backgroundColor: tag.backgroundColor, 
                            color: tag.textColor 
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                      {(user as any).tags?.length > 2 && (
                        <span className="tag-more">+{(user as any).tags.length - 2}</span>
                      )}
                      
                      {/* 當沒有任何標籤時顯示 */}
                      {!user.id_verified && !user.bank_verified && !(user as any).tags?.length && (
                        <span className="no-tags">無標籤</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => handleOpenTagModal(user)} 
                        className="btn-tag"
                      >
                        🏷️ 標籤
                      </button>
                    </div>
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

      {/* 存款管理彈窗 */}
      {isBalanceModalOpen && selectedUser && (
        <div className="tag-modal-overlay" onClick={closeBalanceModal}>
          <div className="tag-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tag-modal-header">
              <h3>💰 帳戶餘額管理 - {selectedUser.username}</h3>
              <button onClick={closeBalanceModal} className="tag-modal-close">✕</button>
            </div>
            
            <div className="tag-modal-body">
              <div className="balance-current">
                <h4>📊 目前餘額</h4>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: '#991b1b',
                  textAlign: 'center',
                  padding: '10px',
                  backgroundColor: '#fef2f2',
                  borderRadius: '8px',
                  margin: '10px 0'
                }}>
                  $ {selectedUser.balance?.toLocaleString() || '0'}
                </div>
              </div>
              
              <div className="balance-operation">
                <h4>💳 操作類型</h4>
                <div style={{ display: 'flex', gap: '10px', margin: '10px 0' }}>
                  <button
                    onClick={() => setBalanceType('add')}
                    className={`btn ${balanceType === 'add' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: balanceType === 'add' ? '#059669' : '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    ➕ 存款
                  </button>
                  <button
                    onClick={() => setBalanceType('subtract')}
                    className={`btn ${balanceType === 'subtract' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: balanceType === 'subtract' ? '#dc2626' : '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    ➖ 扣款
                  </button>
                </div>
              </div>

              <div className="balance-amount">
                <h4>💰 金額</h4>
                <input
                  type="number"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="請輸入整數金額"
                  min="0"
                  step="1"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '16px',
                    margin: '10px 0'
                  }}
                />
              </div>

              <div className="balance-remark">
                <h4>📝 備註說明（選填）</h4>
                <textarea
                  value={balanceRemark}
                  onChange={(e) => setBalanceRemark(e.target.value)}
                  placeholder="請輸入操作備註（選填）"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    margin: '10px 0',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            <div className="tag-modal-footer">
              <button onClick={closeBalanceModal} className="btn-secondary">
                取消
              </button>
              <button 
                onClick={handleBalanceUpdate} 
                className="btn-primary"
                style={{
                  marginLeft: '10px',
                  backgroundColor: balanceType === 'add' ? '#059669' : '#dc2626',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {balanceType === 'add' ? '💰 確認存款' : '💸 確認扣款'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 標籤管理彈窗 */}
      {isTagModalOpen && selectedUser && (
        <div className="tag-modal-overlay" onClick={closeTagModal}>
          <div className="tag-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tag-modal-header">
              <h3>🏷️ 管理標籤 - {selectedUser.username}</h3>
              <button onClick={closeTagModal} className="tag-modal-close">✕</button>
            </div>
            
            <div className="tag-modal-body">
              <div className="tag-section">
                <h4>📋 可用標籤</h4>
                <div className="available-tags">
                  {availableTags.map((tag) => {
                    const isUserHasTag = userTags.some(userTag => userTag.tagId === tag.id);
                    return (
                      <div key={tag.id} className="tag-item">
                        <span 
                          className={`tag-preview tag-shape-${tag.shape || 'oval'}`}
                          style={{ 
                            backgroundColor: tag.backgroundColor, 
                            color: tag.textColor 
                          }}
                        >
                          {tag.name}
                        </span>
                        <button
                          onClick={() => handleToggleUserTag(tag.id, !isUserHasTag)}
                          className={`tag-toggle-btn ${isUserHasTag ? 'tag-remove' : 'tag-add'}`}
                        >
                          {isUserHasTag ? '➖ 移除' : '➕ 添加'}
                        </button>
                      </div>
                    );
                  })}
                </div>
                
                {availableTags.length === 0 && (
                  <div className="no-tags-available">
                    <p>目前沒有可用的標籤</p>
                    <p>請先到 <a href="/admin/marquee-tags" target="_blank">標籤管理</a> 建立標籤</p>
                  </div>
                )}
              </div>

              <div className="tag-section">
                <h4>🏷️ 使用者已有標籤</h4>
                <div className="user-current-tags">
                  {userTags.length > 0 ? (
                    userTags.map((tag) => (
                      <span 
                        key={tag.id} 
                        className={`current-tag tag-shape-${tag.shape || 'oval'}`}
                        style={{ 
                          backgroundColor: tag.backgroundColor, 
                          color: tag.textColor 
                        }}
                      >
                        {tag.name}
                        <button
                          onClick={() => handleToggleUserTag(tag.tagId, false)}
                          className="tag-remove-btn"
                        >
                          ✕
                        </button>
                      </span>
                    ))
                  ) : (
                    <p className="no-user-tags">此使用者尚未設定任何標籤</p>
                  )}
                </div>
              </div>
            </div>

            <div className="tag-modal-footer">
              <button onClick={closeTagModal} className="btn-secondary">
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}