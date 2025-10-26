"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/hooks/use-user-store";
import "@/styles/pages/admin-user.css";

interface PromotionCategory {
  id: number;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PromotionCategoriesPage() {
  const [categories, setCategories] = useState<PromotionCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const currentUser = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  // 載入用戶資料
  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const parsedUser = JSON.parse(rawUser);
      setUser(parsedUser);
    }
  }, [setUser]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3001/promotion-categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("取得活動類型資料失敗");
      
      const result = await response.json();
      setCategories(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("確定要刪除這個活動類型嗎？")) return;

    setDeletingId(id);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:3001/promotion-categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error("刪除失敗");

      setTimeout(() => {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        setDeletingId(null);
        fetchCategories();
      }, 500);
    } catch (err) {
      alert("刪除失敗");
      setDeletingId(null);
    }
  };

  // 臨時移除權限限制，顯示所有按鈕
  const canModify = true;
  const canDelete = true;

  return (
    <div className="admin-user-container">
      {/* 頁面標題區域 */}
      <div className="admin-user-header">
        <h1>🏷️ 促銷分類管理</h1>
        <div className="admin-user-header-actions">
          {canModify && (
            <button 
              onClick={() => router.push("/admin/promotion-categories/new")} 
              className="btn-primary"
            >
              ✨ 新增促銷分類
            </button>
          )}
        </div>
      </div>

      {/* 載入狀態 */}
      {loading && (
        <div className="loading-spinner">
          <div>⏳ 載入中...</div>
        </div>
      )}

      {/* 錯誤訊息 */}
      {error && (
        <div className="filter-section">
          <div style={{ color: "#ef4444", padding: "16px", textAlign: "center" }}>
            ❌ {error}
          </div>
        </div>
      )}

      {!loading && (
        <div className="content-section">
          {/* 現代化表格 */}
          <table className="modern-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>分類資訊</th>
                <th>描述</th>
                <th>排序</th>
                <th>狀態</th>
                <th>建立時間</th>
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
                      <div className="user-id">ID: {category.id}</div>
                    </div>
                  </td>
                  <td>
                    <div className="login-info">
                      {category.description ? (
                        category.description.length > 50 
                          ? `${category.description.substring(0, 50)}...` 
                          : category.description
                      ) : (
                        <span style={{ color: "#9ca3af" }}>無描述</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ textAlign: "center", fontWeight: "600", color: "#374151" }}>
                      {category.sortOrder}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      category.isActive ? "status-active" : "status-inactive"
                    }`}>
                      {category.isActive ? "✅ 啟用" : "❌ 停用"}
                    </span>
                  </td>
                  <td>
                    <div className="login-info">
                      <div>🕒 {category.createdAt ? new Date(category.createdAt).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false }) : "無記錄"}</div>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {canModify && (
                        <button 
                          onClick={() => router.push(`/admin/promotion-categories/${category.id}/edit`)} 
                          className="btn-edit"
                        >
                          ✏️ 編輯
                        </button>
                      )}
                      {canDelete && (
                        <button 
                          onClick={() => handleDelete(category.id)} 
                          className="btn-delete"
                          disabled={deletingId === category.id}
                        >
                          {deletingId === category.id ? "⏳ 刪除中..." : "🗑️ 刪除"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 無資料顯示 */}
          {!loading && categories.length === 0 && (
            <div className="no-data">
              <img src="/no-information.webp" alt="無資料" />
              <p>查無促銷分類資料</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}