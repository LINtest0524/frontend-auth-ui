"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import "@/styles/pages/marquee-admin.css";

type MarqueeItem = {
  id: number;
  title: string;
  content: string;
  link?: string;
  isActive: boolean;
  createdAt: string;
  tag?: {
    id: number;
    name: string;
    backgroundColor: string;
    textColor: string;
  };
};

export default function MarqueeListPage() {
  const [items, setItems] = useState<MarqueeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const apiBase = process.env.NEXT_PUBLIC_API_BASE;

  const userJson =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const companyId = userJson ? JSON.parse(userJson)?.company?.id : null;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchData = async () => {
    if (!token) {
      setError("未登入或 token 遺失，請重新登入");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/admin/marquee`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError("資料載入失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("確定要刪除這筆跑馬燈嗎？")) return;
    if (!token) {
      alert("無法取得 token，請重新登入");
      return;
    }

    try {
      const res = await fetch(`${apiBase}/admin/marquee/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (res.ok) {
        fetchData();
      } else {
        alert("刪除失敗，請稍後再試");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("刪除失敗，請稍後再試");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 統計數據
  const activeCount = items.filter(item => item.isActive).length;
  const inactiveCount = items.filter(item => !item.isActive).length;

  return (
    <div className="marquee-admin-container">
      {/* 頁面標題區域 */}
      <div className="marquee-admin-header">
        <h1>🎯 跑馬燈管理</h1>
        <div className="marquee-admin-header-actions">
          <button 
            onClick={() => router.push("/admin/marquee/new")} 
            className="btn-primary"
          >
            ✨ 新增跑馬燈
          </button>
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
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {/* 內容區域 */}
      {!loading && !error && (
        <div className="content-section">
          {/* 統計信息 */}
          <div className="table-stats">
            <div className="stats-info">
              <div className="stats-item">
                <span>📊 總計：</span>
                <span className="stats-number">{items.length}</span>
              </div>
              <div className="stats-item">
                <span>✅ 啟用：</span>
                <span className="stats-number">{activeCount}</span>
              </div>
              <div className="stats-item">
                <span>❌ 停用：</span>
                <span className="stats-number">{inactiveCount}</span>
              </div>
            </div>
          </div>

          {/* 現代化表格 */}
          <table className="modern-table">
            <thead>
              <tr>
                <th>📋 標題</th>
                <th>📝 內容</th>
                <th>🏷️ 標籤</th>
                <th>🔗 連結</th>
                <th>📊 狀態</th>
                <th>📅 建立時間</th>
                <th>⚙️ 操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="marquee-title" title={item.title}>
                      {item.title || "-"}
                    </div>
                  </td>
                  <td>
                    <div className="marquee-content" title={item.content}>
                      {item.content || "-"}
                    </div>
                  </td>
                  <td>
                    {item.tag ? (
                      <span
                        className="marquee-tag"
                        style={{
                          backgroundColor: item.tag.backgroundColor,
                          color: item.tag.textColor,
                        }}
                      >
                        {item.tag.name}
                      </span>
                    ) : (
                      <span style={{ color: "#9ca3af" }}>無標籤</span>
                    )}
                  </td>
                  <td>
                    {item.link ? (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="marquee-link"
                      >
                        🔗 查看
                      </a>
                    ) : (
                      <span style={{ color: "#9ca3af" }}>無連結</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        item.isActive ? "status-active" : "status-inactive"
                      }`}
                    >
                      {item.isActive ? "✅ 啟用" : "❌ 停用"}
                    </span>
                  </td>
                  <td>
                    <div className="date-info">
                      {format(new Date(item.createdAt), "yyyy-MM-dd HH:mm")}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => router.push(`/admin/marquee/${item.id}/edit`)} 
                        className="btn-edit"
                      >
                        ✏️ 編輯
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
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
          {items.length === 0 && (
            <div className="no-data">
              <div className="no-data-icon">🎯</div>
              <div className="no-data-text">尚無跑馬燈資料</div>
              <div className="no-data-hint">點擊上方「新增跑馬燈」按鈕開始建立您的第一個跑馬燈</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
