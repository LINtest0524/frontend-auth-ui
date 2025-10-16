"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/hooks/use-user-store";
import "@/styles/pages/admin-user.css";

interface ContactInfo {
  id: number;
  title: string;
  icon?: string;
  link?: string;
  targetBlank: boolean;
  qrCode?: string;
  sortOrder: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function ContactInfoPage() {
  const [contactInfos, setContactInfos] = useState<ContactInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ContactInfo | null>(null);

  // 表單狀態
  const [formData, setFormData] = useState({
    title: "",
    icon: null as File | null,
    link: "",
    targetBlank: false,
    qrCode: null as File | null,
    sortOrder: 0,
    status: "active",
  });

  const currentUser = useUserStore((state) => state.user);

  const fetchContactInfos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3001/contact-info", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setContactInfos(data);
      } else {
        console.error("Failed to fetch contact infos");
      }
    } catch (err) {
      console.error("Fetch contact infos failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert("請輸入標題");
      return;
    }

    const token = localStorage.getItem("token");
    const formDataToSend = new FormData();
    
    formDataToSend.append("title", formData.title);
    formDataToSend.append("link", formData.link);
    formDataToSend.append("targetBlank", formData.targetBlank.toString());
    formDataToSend.append("sortOrder", formData.sortOrder.toString());
    formDataToSend.append("status", formData.status);
    
    if (formData.icon) {
      formDataToSend.append("icon", formData.icon);
    }
    
    if (formData.qrCode) {
      formDataToSend.append("qrCode", formData.qrCode);
    }

    try {
      const url = editingItem 
        ? `http://localhost:3001/contact-info/${editingItem.id}`
        : "http://localhost:3001/contact-info";
      
      const method = editingItem ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend,
      });

      if (res.ok) {
        alert(editingItem ? "聯絡資訊已更新" : "聯絡資訊已新增");
        resetForm();
        fetchContactInfos();
      } else {
        const errorData = await res.json();
        alert(`${editingItem ? "更新" : "新增"}失敗: ${errorData.message || "未知錯誤"}`);
      }
    } catch (err) {
      console.error("Submit failed", err);
      alert(`${editingItem ? "更新" : "新增"}失敗，請稍後再試`);
    }
  };

  const handleEdit = (item: ContactInfo) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      icon: null,
      link: item.link || "",
      targetBlank: item.targetBlank,
      qrCode: null,
      sortOrder: item.sortOrder,
      status: item.status,
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("確定要刪除此聯絡資訊嗎？")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3001/contact-info/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        alert("聯絡資訊已刪除");
        fetchContactInfos();
      } else {
        alert("刪除失敗");
      }
    } catch (err) {
      console.error("Delete failed", err);
      alert("刪除失敗，請稍後再試");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      icon: null,
      link: "",
      targetBlank: false,
      qrCode: null,
      sortOrder: 0,
      status: "active",
    });
    setEditingItem(null);
    setShowCreateModal(false);
  };

  useEffect(() => {
    if (currentUser) {
      fetchContactInfos();
      setUserLoading(false);
    } else {
      const token = localStorage.getItem("token");
      if (!token) {
        setUserLoading(false);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUserLoading(false);
    }
  }, []);

  // 權限檢查
  const canModify = currentUser?.role && ["SUPER_ADMIN", "GLOBAL_ADMIN", "AGENT_OWNER"].includes(currentUser.role);

  if (userLoading) {
    return (
      <div className="admin-user-container">
        <div className="admin-user-header">
          <h1>📞 聯絡資訊管理</h1>
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
          <h1>📞 聯絡資訊管理</h1>
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
          <p style={{ margin: 0 }}>只有超級管理員、全域管理員和代理商老闆可以管理聯絡資訊</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-user-container">
      {/* 頁面標題區域 */}
      <div className="admin-user-header">
        <h1>📞 聯絡資訊管理</h1>
        <p style={{ margin: "8px 0 0 0", opacity: 0.9, fontSize: "16px" }}>
          管理客服浮動按鈕的聯絡方式
        </p>
      </div>

      {/* 操作按鈕區域 */}
      <div className="filter-section">
        <div className="filter-actions">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-search"
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            }}
          >
            ➕ 新增聯絡方式
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
              📋 聯絡方式列表
            </div>
            <div className="pagination-info">
              共 {contactInfos.length} 筆聯絡方式
            </div>
          </div>

          {/* 現代化表格 */}
          <table className="modern-table">
            <thead>
              <tr>
                <th>排序</th>
                <th>ICON</th>
                <th>標題</th>
                <th>連結</th>
                <th>另開頁面</th>
                <th>QR Code</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {contactInfos.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span style={{ 
                      background: "#f3f4f6", 
                      padding: "4px 8px", 
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600"
                    }}>
                      #{item.sortOrder}
                    </span>
                  </td>
                  <td>
                    {item.icon ? (
                      <img 
                        src={`http://localhost:3001${item.icon}`} 
                        alt="icon" 
                        style={{ width: "32px", height: "32px", borderRadius: "6px" }}
                      />
                    ) : (
                      <div style={{ 
                        width: "32px", 
                        height: "32px", 
                        background: "#f3f4f6", 
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        color: "#9ca3af"
                      }}>
                        📷
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: "600", color: "#374151" }}>
                      {item.title}
                    </div>
                  </td>
                  <td>
                    {item.link ? (
                      <div style={{ 
                        fontSize: "12px", 
                        color: "#6b7280",
                        maxWidth: "200px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {item.link}
                      </div>
                    ) : (
                      <span style={{ color: "#9ca3af" }}>無</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${item.targetBlank ? "status-active" : "status-inactive"}`}>
                      {item.targetBlank ? "是" : "否"}
                    </span>
                  </td>
                  <td>
                    {item.qrCode ? (
                      <img 
                        src={`http://localhost:3001${item.qrCode}`} 
                        alt="QR Code" 
                        style={{ width: "32px", height: "32px", borderRadius: "6px" }}
                      />
                    ) : (
                      <div style={{ 
                        width: "32px", 
                        height: "32px", 
                        background: "#f3f4f6", 
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        color: "#9ca3af"
                      }}>
                        🔲
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${item.status === "active" ? "status-active" : "status-inactive"}`}>
                      {item.status === "active" ? "啟用" : "停用"}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleEdit(item)}
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
          {contactInfos.length === 0 && (
            <div className="no-data">
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📞</div>
              <p>尚未設定任何聯絡方式</p>
              <p style={{ fontSize: "14px", color: "#9ca3af", margin: "8px 0 0 0" }}>
                點擊上方按鈕新增第一個聯絡方式
              </p>
            </div>
          )}
        </div>
      )}

      {/* 新增/編輯表單 Modal */}
      {showCreateModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "white",
            borderRadius: "20px",
            padding: "0",
            maxWidth: "600px",
            width: "95%",
            maxHeight: "90vh",
            overflow: "hidden",
            boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)",
            border: "1px solid #e5e7eb"
          }}>
            {/* 彈窗標題 */}
            <div style={{
              background: editingItem 
                ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "white",
              padding: "24px 32px",
              borderRadius: "20px 20px 0 0"
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: "24px", 
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}>
                {editingItem ? "✏️ 編輯聯絡方式" : "➕ 新增聯絡方式"}
              </h2>
              <p style={{ 
                margin: "8px 0 0 0", 
                opacity: 0.9, 
                fontSize: "16px",
                fontWeight: "400"
              }}>
                設定客服浮動按鈕的聯絡方式
              </p>
            </div>

            {/* 表單內容 */}
            <div style={{ padding: "32px", maxHeight: "70vh", overflow: "auto" }}>
              <form onSubmit={handleSubmit}>
                {/* 基本資訊區塊 */}
                <div style={{
                  background: "#f8fafc",
                  borderRadius: "12px",
                  padding: "24px",
                  marginBottom: "24px",
                  border: "1px solid #e2e8f0"
                }}>
                  <h3 style={{
                    margin: "0 0 20px 0",
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#1e293b",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    📝 基本資訊
                  </h3>
                  
                  <div style={{ marginBottom: "20px" }}>
                    <label className="form-label" style={{ 
                      fontWeight: "600", 
                      color: "#374151", 
                      marginBottom: "8px",
                      display: "block"
                    }}>
                      聯絡方式標題 *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="例如: LINE 官方帳號、Facebook 粉絲團、客服電話"
                      className="form-input"
                      style={{
                        padding: "14px 16px",
                        fontSize: "16px",
                        borderRadius: "10px",
                        border: "2px solid #e2e8f0",
                        transition: "all 0.2s ease"
                      }}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <label className="form-label" style={{ 
                      fontWeight: "600", 
                      color: "#374151", 
                      marginBottom: "8px",
                      display: "block"
                    }}>
                      連結網址
                    </label>
                    <input
                      type="url"
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      placeholder="例如: https://line.me/ti/p/@example 或 tel:+886-2-1234-5678"
                      className="form-input"
                      style={{
                        padding: "14px 16px",
                        fontSize: "16px",
                        borderRadius: "10px",
                        border: "2px solid #e2e8f0",
                        transition: "all 0.2s ease"
                      }}
                    />
                  </div>

                  <div style={{ 
                    background: "white",
                    borderRadius: "10px",
                    padding: "16px",
                    border: "2px solid #e2e8f0"
                  }}>
                    <label style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "12px", 
                      cursor: "pointer",
                      fontSize: "16px",
                      fontWeight: "500"
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.targetBlank}
                        onChange={(e) => setFormData({ ...formData, targetBlank: e.target.checked })}
                        style={{
                          width: "20px",
                          height: "20px",
                          accentColor: "#10b981"
                        }}
                      />
                      <span style={{ color: "#374151" }}>🔗 在新頁面開啟連結</span>
                    </label>
                    <p style={{ 
                      fontSize: "14px", 
                      color: "#6b7280", 
                      margin: "8px 0 0 32px" 
                    }}>
                      勾選後點擊會開啟新分頁，不勾選則在當前頁面跳轉
                    </p>
                  </div>
                </div>

                {/* 圖片上傳區塊 */}
                <div style={{
                  background: "#fefce8",
                  borderRadius: "12px",
                  padding: "24px",
                  marginBottom: "24px",
                  border: "1px solid #fde047"
                }}>
                  <h3 style={{
                    margin: "0 0 20px 0",
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#1e293b",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    🖼️ 圖片設定
                  </h3>

                  <div>
                    <div style={{ marginBottom: "20px" }}>
                      <label className="form-label" style={{ 
                        fontWeight: "600", 
                        color: "#374151", 
                        marginBottom: "8px",
                        display: "block"
                      }}>
                        📱 ICON 圖示
                      </label>
                      <input
                        type="file"
                        accept="image/*,.svg"
                        onChange={(e) => setFormData({ ...formData, icon: e.target.files?.[0] || null })}
                        className="form-input"
                        style={{
                          padding: "14px 16px",
                          fontSize: "14px",
                          borderRadius: "10px",
                          border: "2px dashed #fbbf24",
                          background: "white",
                          width: "100%"
                        }}
                      />
                      <p style={{ 
                        fontSize: "12px", 
                        color: "#92400e", 
                        margin: "8px 0 0 0",
                        lineHeight: "1.4"
                      }}>
                        建議尺寸: 64x64px，支援: JPG, PNG, WEBP, SVG
                      </p>
                    </div>

                    <div>
                      <label className="form-label" style={{ 
                        fontWeight: "600", 
                        color: "#374151", 
                        marginBottom: "8px",
                        display: "block"
                      }}>
                        📱 QR Code (可選)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFormData({ ...formData, qrCode: e.target.files?.[0] || null })}
                        className="form-input"
                        style={{
                          padding: "14px 16px",
                          fontSize: "14px",
                          borderRadius: "10px",
                          border: "2px dashed #fbbf24",
                          background: "white",
                          width: "100%"
                        }}
                      />
                      <p style={{ 
                        fontSize: "12px", 
                        color: "#92400e", 
                        margin: "8px 0 0 0",
                        lineHeight: "1.4"
                      }}>
                        用於顯示掃碼聯絡，建議尺寸: 200x200px
                      </p>
                    </div>
                  </div>
                </div>

                {/* 進階設定區塊 */}
                <div style={{
                  background: "#f1f5f9",
                  borderRadius: "12px",
                  padding: "24px",
                  marginBottom: "24px",
                  border: "1px solid #cbd5e1"
                }}>
                  <h3 style={{
                    margin: "0 0 20px 0",
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#1e293b",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    ⚙️ 進階設定
                  </h3>

                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "1fr 1fr", 
                    gap: "20px" 
                  }}>
                    <div>
                      <label className="form-label" style={{ 
                        fontWeight: "600", 
                        color: "#374151", 
                        marginBottom: "8px",
                        display: "block"
                      }}>
                        🔢 顯示順序
                      </label>
                      <input
                        type="number"
                        value={formData.sortOrder}
                        onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                        className="form-input"
                        style={{
                          padding: "14px 16px",
                          fontSize: "16px",
                          borderRadius: "10px",
                          border: "2px solid #cbd5e1",
                          background: "white"
                        }}
                        min="0"
                        placeholder="0"
                      />
                      <p style={{ 
                        fontSize: "12px", 
                        color: "#64748b", 
                        margin: "4px 0 0 0" 
                      }}>
                        數字越小越靠前顯示
                      </p>
                    </div>

                    <div>
                      <label className="form-label" style={{ 
                        fontWeight: "600", 
                        color: "#374151", 
                        marginBottom: "8px",
                        display: "block"
                      }}>
                        🎯 啟用狀態
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="form-input"
                        style={{
                          padding: "14px 16px",
                          fontSize: "16px",
                          borderRadius: "10px",
                          border: "2px solid #cbd5e1",
                          background: "white"
                        }}
                      >
                        <option value="active">✅ 啟用</option>
                        <option value="inactive">❌ 停用</option>
                      </select>
                      <p style={{ 
                        fontSize: "12px", 
                        color: "#64748b", 
                        margin: "4px 0 0 0" 
                      }}>
                        只有啟用的才會顯示
                      </p>
                    </div>
                  </div>
                </div>

                {/* 按鈕區域 */}
                <div style={{ 
                  display: "flex", 
                  gap: "16px", 
                  justifyContent: "flex-end",
                  paddingTop: "20px",
                  borderTop: "1px solid #e2e8f0"
                }}>
                  <button
                    type="button"
                    onClick={resetForm}
                    style={{
                      padding: "14px 24px",
                      border: "2px solid #d1d5db",
                      background: "white",
                      borderRadius: "12px",
                      cursor: "pointer",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#6b7280",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f9fafb";
                      e.currentTarget.style.borderColor = "#9ca3af";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.borderColor = "#d1d5db";
                    }}
                  >
                    ❌ 取消
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "14px 24px",
                      border: "none",
                      borderRadius: "12px",
                      cursor: "pointer",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "white",
                      background: editingItem 
                        ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                        : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                    }}
                  >
                    {editingItem ? "✏️ 更新聯絡方式" : "✨ 新增聯絡方式"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}