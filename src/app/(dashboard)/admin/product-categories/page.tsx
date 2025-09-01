"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/hooks/use-user-store";
import dayjs from "dayjs";
import "@/styles/pages/admin-user.css";

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  sort_order: number;
  is_active: boolean;
  is_visible: boolean;
  parent?: {
    id: number;
    name: string;
  };
  company?: {
    id: number;
    name: string;
  };
  created_at: string;
}

type SortKey = "id" | "name" | "sort_order" | "created_at" | null;
type SortDirection = "asc" | "desc" | null;

export default function ProductCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const currentUser = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // 排序狀態
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [hasSearched, setHasSearched] = useState(false);
  
  // 篩選條件
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [visible, setVisible] = useState("");

  // 載入用戶資料
  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const parsedUser = JSON.parse(rawUser);
      setUser(parsedUser);
    }
  }, [setUser]);

  const clearFilter = () => {
    setName("");
    setStatus("");
    setVisible("");
    fetchCategories();
  };

  const sortCategories = (data: Category[]) => {
    if (!sortKey || !sortDirection) return data;
    return [...data].sort((a, b) => {
      const getValue = (category: Category) => {
        if (sortKey === "created_at") {
          return category[sortKey] ? new Date(category[sortKey]).getTime() : 0;
        }
        if (sortKey === "name") {
          return category[sortKey] || "";
        }
        return (category[sortKey] as number) ?? 0;
      };
      const aVal = getValue(a);
      const bVal = getValue(b);
      
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  };

  const fetchCategories = async (searchTerm = "") => {
    if (!token) {
      setError("未登入或 token 遺失，請重新登入");
      return;
    }

    setLoading(true);
    setError("");
    try {
      let url = `http://localhost:3001/admin/product-category`;
      const params = new URLSearchParams();
      
      if (searchTerm || name) params.append("name", searchTerm || name);
      if (status) params.append("is_active", status);
      if (visible) params.append("is_visible", visible);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error("取得分類資料失敗");
      
      const result = await res.json();
      
      // 如果 API 返回分頁資料
      if (result.data) {
        setCategories(result.data);
      } else {
        setCategories(result);
      }
      setHasSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    setCategories((prev) => sortCategories(prev));
  }, [sortKey, sortDirection]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSearch = () => {
    fetchCategories(name);
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
      <span className={`${isActive}`}>
        {getIcon()}
      </span>
    );
  };

  const handleDelete = async (id: number) => {
    if (!confirm("確定要刪除這個分類嗎？")) return;

    setDeletingId(id);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:3001/admin/product-category/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error("刪除失敗");

      setTimeout(() => {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        setDeletingId(null);
        // 重新載入資料以更新總數
        fetchCategories();
      }, 500);
    } catch (err) {
      alert("刪除失敗");
      setDeletingId(null);
    }
  };


  return (
    <div className="admin-user-container">
      {/* 頁面標題區域 */}
      <div className="admin-user-header">
        <h1>🏷️ 商品分類管理</h1>
        <div className="admin-user-header-actions">
          {(currentUser?.role === "SUPER_ADMIN" || 
            currentUser?.role === "GLOBAL_ADMIN" || 
            currentUser?.role === "AGENT_OWNER") && (
            <button
              onClick={() => router.push("/admin/product-categories/new")}
              className="btn-primary"
            >
              ✨ 新增分類
            </button>
          )}
        </div>
      </div>

      {/* 搜尋區域 */}
      <div className="filter-section">
        <div className="filter-grid">
          <div className="form-group">
            <label htmlFor="category-name" className="form-label">分類名稱搜尋</label>
            <input 
              type="text" 
              id="category-name"
              placeholder="請輸入分類名稱" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="form-input"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <div className="form-group">
            <label htmlFor="status-select" className="form-label">啟用狀態</label>
            <select 
              id="status-select" 
              value={status} 
              onChange={(e) => setStatus(e.target.value)} 
              className="form-select"
            >
              <option value="">全部狀態</option>
              <option value="true">✅ 啟用</option>
              <option value="false">❌ 停用</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="visible-select" className="form-label">顯示狀態</label>
            <select 
              id="visible-select" 
              value={visible} 
              onChange={(e) => setVisible(e.target.value)} 
              className="form-select"
            >
              <option value="">全部狀態</option>
              <option value="true">👁️ 顯示</option>
              <option value="false">🙈 隱藏</option>
            </select>
          </div>
        </div>

        <div className="filter-actions">
          <button onClick={handleSearch} className="btn-search">
            🔍 查詢
          </button>
          <button onClick={clearFilter} className="btn-clear">
            🗑️ 清除
          </button>
        </div>
      </div>

      {/* 載入狀態 */}
      {loading && (
        <div className="loading-spinner">
          <div>⏳ 載入中...</div>
        </div>
      )}

      {error && (
        <div style={{ padding: '20px', backgroundColor: '#fee', color: '#c33', borderRadius: '8px', margin: '20px 0' }}>
          ❌ {error}
        </div>
      )}

      {!loading && hasSearched && (
        <div className="content-section">
          {/* 表格控制區域 */}
          <div className="table-controls">
            <div className="pagination-info">
              共 {categories.length} 個分類
            </div>
          </div>

          {/* 現代化表格 */}
          <table className="modern-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort("id")}>
                  ID <span className={`sort-icon ${sortKey === "id" ? "active" : ""}`}>{getArrow("id")}</span>
                </th>
                <th onClick={() => toggleSort("name")}>
                  分類資訊 <span className={`sort-icon ${sortKey === "name" ? "active" : ""}`}>{getArrow("name")}</span>
                </th>
                <th>代碼</th>
                <th>父分類</th>
                <th onClick={() => toggleSort("sort_order")}>
                  排序 <span className={`sort-icon ${sortKey === "sort_order" ? "active" : ""}`}>{getArrow("sort_order")}</span>
                </th>
                <th>狀態</th>
                <th>顯示</th>
                <th onClick={() => toggleSort("created_at")}>
                  建立時間 <span className={`sort-icon ${sortKey === "created_at" ? "active" : ""}`}>{getArrow("created_at")}</span>
                </th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>#{category.id}</td>
                  <td>
                    <div className="user-info">
                      <div className="user-username">{category.name}</div>
                      {category.description && (
                        <div className="user-id">
                          {category.description.length > 40 
                            ? `${category.description.substring(0, 40)}...` 
                            : category.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="login-info" style={{ fontFamily: "monospace", fontSize: "12px", color: "#6366f1" }}>
                      {category.slug}
                    </div>
                  </td>
                  <td>
                    <div className="login-info">
                      {category.parent?.name || (
                        <span style={{ color: "#9ca3af", fontStyle: "italic" }}>無父分類</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ textAlign: "center" }}>
                      <span className="status-badge" style={{ 
                        background: "#f3f4f6", 
                        color: "#374151",
                        fontFamily: "monospace"
                      }}>
                        {category.sort_order}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${category.is_active ? "status-active" : "status-inactive"}`}>
                      {category.is_active ? "✅ 啟用" : "❌ 停用"}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${category.is_visible ? "status-active" : "status-inactive"}`}>
                      {category.is_visible ? "👁️ 顯示" : "🙈 隱藏"}
                    </span>
                  </td>
                  <td>
                    <div className="login-info">
                      <div>🕒 {category.created_at ? dayjs(category.created_at).format('YYYY/MM/DD') : "-"}</div>
                      {category.created_at && (
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                          {dayjs(category.created_at).format('HH:mm')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {(currentUser?.role === "SUPER_ADMIN" || 
                        currentUser?.role === "GLOBAL_ADMIN" || 
                        currentUser?.role === "AGENT_OWNER") && (
                        <button
                          onClick={() => router.push(`/admin/product-categories/${category.id}/edit`)}
                          className="btn-edit"
                        >
                          ✏️ 編輯
                        </button>
                      )}

                      {(currentUser?.role === "SUPER_ADMIN" || 
                        currentUser?.role === "GLOBAL_ADMIN") && (
                        <button
                          onClick={() => handleDelete(category.id)}
                          className={`btn-delete ${
                            deletingId === category.id ? "opacity-50 pointer-events-none" : ""
                          }`}
                          disabled={deletingId === category.id}
                        >
                          {deletingId === category.id ? "🔄 刪除中..." : "🗑️ 刪除"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 無資料顯示 */}
          {!loading && hasSearched && categories.length === 0 && (
            <div className="no-data">
              <img src="/no-information.webp" alt="無資料" />
              <p>查無符合條件的商品分類</p>
              {name && (
                <button 
                  onClick={() => {
                    setName("");
                    fetchCategories();
                  }}
                  className="btn-search"
                  style={{ marginTop: '16px' }}
                >
                  🔄 顯示全部分類
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}