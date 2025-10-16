"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/hooks/use-user-store";
import { useRouter } from "next/navigation";
import { User } from "@/types/user";
import "@/styles/pages/admin-user.css";

const roleMap: Record<string, string> = {
  SUPER_ADMIN: "超級管理員",
  GLOBAL_ADMIN: "全域管理員",
  AGENT_OWNER: "代理商老闆",
  AGENT_SUPPORT: "客服",
  USER: "會員",
};

const statusMap: Record<string, string> = {
  ACTIVE: "啟用",
  INACTIVE: "停用",
  BANNED: "封鎖",
};

export default function AdminUserListPage() {
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [inputLimit, setInputLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const currentUser = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const router = useRouter();

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (username) params.append("username", username);
      params.append("limit", limit.toString());
      params.append("page", page.toString());
      params.append("excludeUserRole", "true");

      const res = await fetch(`http://localhost:3001/user?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();
      console.log('Admin users API response:', result);
      
      // 確保 data 是陣列
      if (result && Array.isArray(result.data)) {
        setAdminUsers(result.data);
        setTotalPages(result.totalPages || 1);
        setTotalCount(result.totalCount || 0);
      } else {
        console.error('API 返回的資料格式不正確:', result);
        setAdminUsers([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (err) {
      console.error("Fetch failed", err);
      setAdminUsers([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const rawUser = localStorage.getItem("user");
    if (token && rawUser) {
      const parsed = JSON.parse(rawUser);
      setUser(parsed);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchAdmins();
    }
  }, [limit, page, currentUser]);

  const handleSearch = () => {
    setHasSearched(true);
    setPage(1);
    fetchAdmins();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("確定要刪除這個管理員？")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:3001/user/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("刪除失敗");
      fetchAdmins();
    } catch (err) {
      alert("刪除失敗");
    }
  };

  const canSeeActions =
    currentUser?.role !== undefined &&
    ["SUPER_ADMIN", "GLOBAL_ADMIN", "AGENT_OWNER"].includes(currentUser.role);

  const canModify =
    currentUser?.role === "AGENT_OWNER" ||
    currentUser?.role === "SUPER_ADMIN" ||
    currentUser?.role === "GLOBAL_ADMIN";

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

      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
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
    <div className="admin-user-container">
      {/* 頁面標題區域 */}
      <div className="admin-user-header">
        <h1>👥 管理員列表</h1>
        <div className="admin-user-header-actions">
          {canModify && (
            <button 
              onClick={() => router.push("/admin/admin-user/new")} 
              className="btn-primary"
            >
              ✨ 新增管理員
            </button>
          )}
        </div>
      </div>

      {/* 篩選區域 */}
      <div className="filter-section">
        <div className="filter-grid">
          <div className="form-group">
            <label htmlFor="username-search" className="form-label">帳號搜尋</label>
            <input
              type="text"
              id="username-search"
              placeholder="請輸入帳號"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <div className="filter-actions">
          <button onClick={handleSearch} className="btn-search">
            🔍 查詢
          </button>
        </div>
      </div>

      {/* 載入狀態 */}
      {loading && (
        <div className="loading-spinner">
          <div>⏳ 載入中...</div>
        </div>
      )}

      {!loading && (
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
              共 {totalCount} 筆資料
            </div>
          </div>

          {/* 現代化表格 */}
          <table className="modern-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>部門</th>
                <th>帳號資訊</th>
                <th>角色</th>
                <th>狀態</th>
                <th>登入資訊</th>
                <th>創建人</th>
                {canSeeActions && <th>操作</th>}
              </tr>
            </thead>
            <tbody>
              {adminUsers.map((admin) => (
                <tr key={admin.id}>
                  <td>#{admin.id}</td>
                  <td>
                    <div className="department-info">
                      🏢 {admin.department_type || "未設定"}
                    </div>
                  </td>
                  <td>
                    <div className="user-info">
                      <div className="user-username">{admin.username}</div>
                      <div className="user-id">ID: {admin.id}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${
                      admin.role === "SUPER_ADMIN" ? "role-super-admin" :
                      admin.role === "GLOBAL_ADMIN" ? "role-global-admin" :
                      admin.role === "AGENT_OWNER" ? "role-agent-owner" :
                      admin.role === "AGENT_SUPPORT" ? "role-agent-support" :
                      "role-user"
                    }`}>
                      {roleMap[admin.role || ""] ?? admin.role ?? "-"}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      admin.status === "ACTIVE" ? "status-active" :
                      admin.status === "INACTIVE" ? "status-inactive" :
                      "status-banned"
                    }`}>
                      {statusMap[admin.status]}
                    </span>
                  </td>
                  <td>
                    <div className="login-info">
                      <div>🕒 {admin.last_login_at ? new Date(admin.last_login_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false }) : "未曾登入"}</div>
                      <div>🌐 {admin.last_login_ip || "無記錄"}</div>
                    </div>
                  </td>
                  <td>
                    <div className="created-by">
                      👤 {admin.created_by?.username || "系統"}
                    </div>
                  </td>
                  {canSeeActions && (
                    <td>
                      {canModify ? (
                        <div className="action-buttons">
                          <button 
                            onClick={() => router.push(`/admin/admin-user/${admin.id}/edit`)} 
                            className="btn-edit"
                          >
                            ✏️ 編輯
                          </button>
                          <button 
                            onClick={() => router.push(`/admin/admin-user/${admin.id}/reset-password`)} 
                            className="btn-reset"
                          >
                            🔑 重設密碼
                          </button>
                          <button 
                            onClick={() => handleDelete(admin.id)} 
                            className="btn-delete"
                          >
                            🗑️ 刪除
                          </button>
                        </div>
                      ) : (
                        <div className="no-permission">
                          僅限代理商與超級管理員
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* 無資料顯示 */}
          {!loading && hasSearched && adminUsers.length === 0 && (
            <div className="no-data">
              <img src="/no-information.webp" alt="無資料" />
              <p>查無符合條件的管理員</p>
            </div>
          )}

          {/* 分頁控制 */}
          {renderPagination()}
        </div>
      )}
    </div>
  );
}
