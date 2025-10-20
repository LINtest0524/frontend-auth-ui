"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "@/styles/pages/admin-user.css";

type MarqueeTag = {
  id: number;
  name: string;
  backgroundColor: string;
  textColor: string;
  shape: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
};

export default function MarqueeTagListPage() {
  const [items, setItems] = useState<MarqueeTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchName, setSearchName] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const router = useRouter();

  const apiBase = process.env.NEXT_PUBLIC_API_BASE;

  const userJson =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const companyId = userJson ? JSON.parse(userJson)?.company?.id : null;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchData = async (searchTerm = "") => {
    if (!token) {
      setError("未登入或 token 遺失，請重新登入");
      return;
    }

    setLoading(true);
    setError("");
    try {
      let url = `${apiBase}/admin/marquee-tags`;
      if (searchTerm) {
        url += `?search=${encodeURIComponent(searchTerm)}`;
      }
      
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data);
      setHasSearched(true);
    } catch (err: any) {
      // 安全錯誤處理：不輸出敏感資訊到控制台
      setError("資料載入失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchData(searchName);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`確定要刪除標籤「${name}」嗎？此操作無法復原。`)) return;
    if (!token) {
      setError("無法取得 token，請重新登入");
      return;
    }

    try {
      const res = await fetch(`${apiBase}/admin/marquee-tags/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("刪除失敗");
      }

      // 重新載入資料
      fetchData(searchName);
    } catch (err: any) {
      // 安全錯誤處理：不直接顯示後端錯誤訊息
      setError("刪除失敗，請稍後再試");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="admin-user-container">
      {/* 頁面標題區域 */}
      <div className="admin-user-header">
        <h1>🏷️ 標籤管理</h1>
        <div className="admin-user-header-actions">
          <button 
            onClick={() => router.push("/admin/marquee-tags/new")} 
            className="btn-primary"
          >
            ➕ 新增標籤
          </button>
        </div>
      </div>

      {/* 搜尋區域 */}
      <div className="filter-section">
        <div className="filter-grid">
          <div className="form-group">
            <label htmlFor="name-search" className="form-label">標籤名稱搜尋</label>
            <input
              type="text"
              id="name-search"
              placeholder="請輸入標籤名稱"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="form-input"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>

        <div className="filter-actions">
          <button onClick={handleSearch} className="btn-search">
            🔍 查詢
          </button>
        </div>
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

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
            <div className="pagination-info">
              共 {items.length} 個標籤
            </div>
          </div>

          {/* 現代化表格 */}
          <table className="modern-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>標籤資訊</th>
                <th>預覽效果</th>
                <th>顏色設定</th>
                <th>狀態</th>
                <th>建立時間</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td>
                    <div className="user-info">
                      <div className="user-username">{item.name}</div>
                      <div className="user-id">標籤 ID: {item.id}</div>
                    </div>
                  </td>
                  <td>
                    <div style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          backgroundColor: item.backgroundColor,
                          color: item.textColor,
                          padding: item.shape === 'pentagon' ? "6px 5px 10px" : "8px 16px",
                          borderRadius: (item.shape === 'oval' || !item.shape) ? "20px" : "0px",
                          clipPath: item.shape === 'pentagon' ? 'polygon(0% 0%, 100% 0%, 100% 80%, 50% 100%, 0% 80%)' : 'none',
                          fontSize: "12px",
                          fontWeight: item.shape === 'pentagon' ? 'normal' : "600",
                          display: "inline-block",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                          minWidth: item.shape === 'pentagon' ? 'auto' : "80px"
                        }}
                      >
                        {item.name}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="color-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div 
                          style={{ 
                            width: '20px', 
                            height: '20px', 
                            backgroundColor: item.backgroundColor,
                            borderRadius: '4px',
                            border: '1px solid #e5e7eb'
                          }}
                        ></div>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                          {item.backgroundColor}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div 
                          style={{ 
                            width: '20px', 
                            height: '20px', 
                            backgroundColor: item.textColor,
                            borderRadius: '4px',
                            border: '1px solid #e5e7eb'
                          }}
                        ></div>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                          {item.textColor}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      item.isActive ? "status-active" : "status-inactive"
                    }`}>
                      {item.isActive ? "✅ 啟用" : "❌ 停用"}
                    </span>
                  </td>
                  <td>
                    <div className="login-info">
                      <div>🕒 {new Date(item.createdAt).toLocaleString("zh-TW", { 
                        timeZone: "Asia/Taipei", 
                        hour12: false,
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</div>
                      {item.updatedAt && item.updatedAt !== item.createdAt && (
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          📝 {new Date(item.updatedAt).toLocaleString("zh-TW", { 
                            timeZone: "Asia/Taipei", 
                            hour12: false,
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => router.push(`/admin/marquee-tags/${item.id}/edit`)} 
                        className="btn-edit"
                      >
                        ✏️ 編輯
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id, item.name)} 
                        className="btn-delete"
                      >
                        🗑️ 刪除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 無資料顯示 */}
          {!loading && hasSearched && items.length === 0 && (
            <div className="no-data">
              <img src="/no-information.webp" alt="無資料" />
              <p>查無符合條件的標籤</p>
              {searchName && (
                <button 
                  onClick={() => {
                    setSearchName("");
                    fetchData();
                  }}
                  className="btn-search"
                  style={{ marginTop: '16px' }}
                >
                  🔄 顯示全部標籤
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}