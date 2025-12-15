"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/hooks/use-user-store";
import "@/styles/pages/admin-user.css";

interface BlacklistRecord {
  id: number;
  userId?: number;
  email?: string;
  ip?: string;
  reason?: string;
  created_at: string;
}

export default function IPBlacklistPage() {
  const [blacklistRecords, setBlacklistRecords] = useState<BlacklistRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [newIP, setNewIP] = useState("");
  const [newReason, setNewReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userLoading, setUserLoading] = useState(true);

  const currentUser = useUserStore((state) => state.user);

  const fetchBlacklist = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/blacklist`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setBlacklistRecords(data);
      } else {
        // 載入黑名單失敗，靜默處理
      }
    } catch (err) {
      // 載入黑名單錯誤，靜默處理
      alert('載入IP黑名單失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIP = async () => {
    if (!newIP.trim()) {
      alert("請輸入IP地址");
      return;
    }

    // 簡單的IP格式驗證
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$|^(\d{1,3}\.){3}\*$|^\*$/;
    if (!ipRegex.test(newIP.trim())) {
      alert("請輸入正確的IP格式 (例如: 192.168.1.1 或 192.168.1.* 或 *)");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/blacklist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ip: newIP.trim(),
          reason: newReason.trim() || "IP封鎖",
        }),
      });

      if (res.ok) {
        alert("IP已成功加入封鎖名單");
        setNewIP("");
        setNewReason("");
        fetchBlacklist();
      } else {
        const errorData = await res.json();
        alert(`新增失敗: ${errorData.message || "未知錯誤"}`);
      }
    } catch (err) {
      // 新增IP黑名單失敗，靜默處理
      alert("新增失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveIP = async (id: number) => {
    if (!confirm("確定要移除此IP封鎖嗎？")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/blacklist/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        alert("IP封鎖已移除");
        fetchBlacklist();
      } else {
        alert("移除失敗");
      }
    } catch (err) {
      // 移除IP黑名單失敗，靜默處理
      alert("移除失敗，請稍後再試");
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchBlacklist();
      setUserLoading(false);
    } else {
      // 檢查是否有token，如果有token但沒有用戶信息，等待載入
      const token = localStorage.getItem("token");
      if (!token) {
        setUserLoading(false);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    // 初始檢查，如果沒有token直接設為載入完成
    const token = localStorage.getItem("token");
    if (!token) {
      setUserLoading(false);
    }
  }, []);

  // 權限檢查
  const canModify = currentUser?.role && [
    "SUPER_ADMIN", 
    "GLOBAL_ADMIN", 
    "AGENT_LEVEL_1", 
    "AGENT_LEVEL_2", 
    "AGENT_LEVEL_3", 
    "AGENT_LEVEL_4", 
    "AGENT_LEVEL_5", 
    "AGENT_LEVEL_6", 
    "AGENT_LEVEL_7", 
    "AGENT_LEVEL_8", 
    "AGENT_LEVEL_9", 
    "AGENT_LEVEL_10", 
    "AGENT_LEVEL_11", 
    "AGENT_LEVEL_12", 
    "AGENT_SUPPORT"
  ].includes(currentUser.role);

  // 如果用戶信息還在載入中，顯示載入畫面
  if (userLoading) {
    return (
      <div className="admin-user-container">
        <div className="admin-user-header">
          <h1>🚫 IP封鎖管理</h1>
        </div>
        <div className="loading-spinner">
          <div>⏳ 載入中...</div>
        </div>
      </div>
    );
  }

  if (!canModify) {
    return (
      <div className="admin-user-container">
        <div className="admin-user-header">
          <h1>🚫 IP封鎖管理</h1>
        </div>
        <div style={{
          background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
          color: "#991b1b",
          padding: "24px",
          borderRadius: "16px",
          textAlign: "center",
          border: "2px solid #fca5a5"
        }}>
          <h2 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "700" }}>⚠️ 權限不足</h2>
          <p style={{ margin: 0 }}>只有超級管理員、全域管理員、各級代理商和客服人員可以管理IP封鎖</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-user-container">
      {/* 頁面標題區域 */}
      <div className="admin-user-header">
        <h1>🚫 IP封鎖管理</h1>
        <p style={{ margin: "8px 0 0 0", opacity: 0.9, fontSize: "16px" }}>
          管理被封鎖的IP地址，保護系統安全
        </p>
      </div>

      {/* 新增IP封鎖區域 */}
      <div className="filter-section">
        <h2 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: "600", color: "#374151" }}>
          🔒 新增IP封鎖
        </h2>
        <div className="filter-grid">
          <div className="form-group">
            <label className="form-label">IP地址 *</label>
            <input
              type="text"
              value={newIP}
              onChange={(e) => setNewIP(e.target.value)}
              placeholder="例如: 192.168.1.1 或 192.168.1.* 或 *"
              className="form-input"
              style={{ padding: "12px 16px" }}
            />
            <p style={{ fontSize: "12px", color: "#6b7280", margin: "4px 0 0 0" }}>
              支援完整IP或通配符 (* 代表任意)
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">封鎖原因</label>
            <input
              type="text"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="例如: 惡意攻擊、濫用系統等"
              className="form-input"
              style={{ padding: "12px 16px" }}
            />
          </div>
        </div>
        <div className="filter-actions">
          <button
            onClick={handleAddIP}
            disabled={submitting}
            className="btn-search"
            style={{
              background: submitting 
                ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" 
                : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              opacity: submitting ? 0.7 : 1,
              cursor: submitting ? "not-allowed" : "pointer"
            }}
          >
            {submitting ? "🔄 新增中..." : "🔒 封鎖IP"}
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
            <div style={{ fontSize: "16px", fontWeight: "600", color: "#374151" }}>
              📋 封鎖IP列表
            </div>
            <div className="pagination-info">
              共 {blacklistRecords.filter((record) => record.ip).length} 筆封鎖記錄
            </div>
          </div>

          {/* 現代化表格 */}
          <table className="modern-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>IP地址</th>
                <th>封鎖原因</th>
                <th>建立時間</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {blacklistRecords
                .filter((record) => record.ip) // 只顯示IP封鎖記錄
                .map((record) => (
                  <tr key={record.id}>
                    <td>#{record.id}</td>
                    <td>
                      <span className="status-badge status-banned">
                        🚫 {record.ip}
                      </span>
                    </td>
                    <td>
                      <div style={{ color: "#374151", fontSize: "14px" }}>
                        {record.reason || "無"}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>
                        🕒 {new Date(record.created_at).toLocaleString("zh-TW", {
                          timeZone: "Asia/Taipei",
                          hour12: false,
                        })}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleRemoveIP(record.id)}
                          className="btn-delete"
                        >
                          🗑️ 移除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {/* 無資料顯示 */}
          {blacklistRecords.filter((record) => record.ip).length === 0 && (
            <div className="no-data">
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔓</div>
              <p>目前沒有被封鎖的IP地址</p>
              <p style={{ fontSize: "14px", color: "#9ca3af", margin: "8px 0 0 0" }}>
                系統目前允許所有IP地址訪問
              </p>
            </div>
          )}
        </div>
      )}

      {/* 說明區域 */}
      <div style={{
        background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
        border: "2px solid #93c5fd",
        borderRadius: "16px",
        padding: "24px",
        marginTop: "24px"
      }}>
        <h3 style={{ 
          fontSize: "16px", 
          fontWeight: "600", 
          color: "#1e40af", 
          margin: "0 0 16px 0" 
        }}>
          💡 使用說明
        </h3>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
          gap: "12px", 
          fontSize: "14px", 
          color: "#1e40af" 
        }}>
          <div>• <strong>完整IP：</strong> 192.168.1.100 - 封鎖特定IP地址</div>
          <div>• <strong>IP範圍：</strong> 192.168.1.* - 封鎖整個C段IP</div>
          <div>• <strong>全部封鎖：</strong> * - 封鎖所有IP（請謹慎使用）</div>
          <div>• 被封鎖的IP嘗試登入時會收到錯誤訊息</div>
          <div>• 移除封鎖後該IP即可正常登入</div>
          <div>• 變更會立即生效，無需重啟系統</div>
        </div>
      </div>
    </div>
  );
}