"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUserStore } from "@/hooks/use-user-store";
import "@/styles/pages/admin-user-form.css";

export default function AdminUserEditPage() {
  const router = useRouter();
  const { id } = useParams();
  const currentUser = useUserStore((state) => state.user);

  const [form, setForm] = useState({
    username: "",
    email: "",
    status: "ACTIVE",
    role: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [originalData, setOriginalData] = useState<any>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3001/user/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("讀取使用者資料失敗");

      const data = await res.json();
      const userData = {
        username: data.username || "",
        email: data.email || "",
        status: data.status || "ACTIVE",
        role: data.role || "",
      };
      
      setForm(userData);
      setOriginalData(data);
      setIsDataLoaded(true);
    } catch (err: any) {
      setError(err.message || "讀取錯誤");
    } finally {
      setLoading(false);
    }
  };

  // 表單驗證
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!form.email.trim()) {
      errors.email = '請輸入電子郵件';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = '請輸入有效的電子郵件格式';
    }
    
    if (!form.status) {
      errors.status = '請選擇狀態';
    }
    
    if (canEditRole && !form.role) {
      errors.role = '請選擇角色';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // 清除該欄位的錯誤訊息
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError("請檢查表單內容");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      
      // 只提交有變更的欄位
      const changedFields: any = {};
      if (form.email !== originalData?.email) changedFields.email = form.email;
      if (form.status !== originalData?.status) changedFields.status = form.status;
      if (canEditRole && form.role !== originalData?.role) changedFields.role = form.role;
      
      // 如果沒有任何變更
      if (Object.keys(changedFields).length === 0) {
        setError("沒有任何變更需要保存");
        setLoading(false);
        return;
      }
      
      const res = await fetch(`http://localhost:3001/user/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(changedFields),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "更新失敗");
      }
      
      setSuccess("管理員資料更新成功！即將跳轉...");
      setTimeout(() => {
        router.push("/admin/admin-user");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  const canEditRole = currentUser?.role === "SUPER_ADMIN";













  const getRoleDescription = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "擁有系統最高權限，可管理所有功能和用戶";
      case "GLOBAL_ADMIN":
        return "可管理多個公司的代理商和客服人員";
      case "AGENT_OWNER":
        return "代理商負責人，可管理該公司的客服人員";
      case "AGENT_SUPPORT":
        return "客服人員，負責處理客戶服務相關事務";
      default:
        return "";
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "用戶可以正常登入和使用系統";
      case "INACTIVE":
        return "用戶暫時無法登入，但資料保留";
      case "BANNED":
        return "用戶被永久禁止使用系統";
      default:
        return "";
    }
  };

  const hasChanges = () => {
    if (!originalData) return false;
    return (
      form.email !== originalData.email ||
      form.status !== originalData.status ||
      (canEditRole && form.role !== originalData.role)
    );
  };

  if (!isDataLoaded && loading) {
    return (
      <div className="admin-user-form-container">
        <div className="loading-spinner">
          <div>⏳ 載入用戶資料中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-user-form-container">
      {/* 載入遮罩 */}
      {loading && isDataLoaded && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">正在更新管理員資料...</div>
          </div>
        </div>
      )}

      {/* 頁面標題區域 */}
      <div className="admin-user-form-header">
        <h1>✏️ 編輯管理員</h1>
      </div>

      {/* 表單內容 */}
      <div className="admin-user-form-content">
        <form onSubmit={handleSubmit}>
          {/* 基本資訊區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>👤</span>
              基本資訊
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  帳號
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={form.username}
                  className="form-input"
                  disabled
                />
                <div className="form-help">
                  🔒 帳號無法修改，如需變更請聯繫系統管理員
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label required">
                  電子郵件
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className={`form-input ${fieldErrors.email ? 'error' : form.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? 'success' : ''}`}
                  placeholder="請輸入電子郵件地址"
                />
                {fieldErrors.email && (
                  <div className="field-error">
                    ❌ {fieldErrors.email}
                  </div>
                )}
                {!fieldErrors.email && form.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && (
                  <div className="field-success">
                    ✅ 電子郵件格式正確
                  </div>
                )}
                <div className="form-help">
                  用於接收系統通知和密碼重設郵件
                </div>
              </div>
            </div>
          </div>

          {/* 狀態設定區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>⚙️</span>
              狀態設定
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="status" className="form-label required">
                  帳號狀態
                </label>
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className={`form-select ${fieldErrors.status ? 'error' : form.status ? 'success' : ''}`}
                >
                  <option value="ACTIVE">✅ 啟用</option>
                  <option value="INACTIVE">⏸️ 停用</option>
                  <option value="BANNED">🚫 封鎖</option>
                </select>
                {fieldErrors.status && (
                  <div className="field-error">
                    ❌ {fieldErrors.status}
                  </div>
                )}
                {form.status && (
                  <div className="role-info">
                    <div className="role-info-title">狀態說明</div>
                    <div className="role-info-desc">
                      {getStatusDescription(form.status)}
                    </div>
                  </div>
                )}
              </div>

              {canEditRole && (
                <div className="form-group">
                  <label htmlFor="role" className="form-label required">
                    角色權限
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className={`form-select ${fieldErrors.role ? 'error' : form.role ? 'success' : ''}`}
                  >
                    <option value="">請選擇角色</option>
                    <option value="SUPER_ADMIN">🔱 超級管理員</option>
                    <option value="GLOBAL_ADMIN">🌐 全域管理員</option>
                    <option value="AGENT_OWNER">👑 代理商老闆</option>
                    <option value="AGENT_SUPPORT">🎧 客服</option>
                  </select>
                  {fieldErrors.role && (
                    <div className="field-error">
                      ❌ {fieldErrors.role}
                    </div>
                  )}
                  {form.role && (
                    <div className="role-info">
                      <div className="role-info-title">角色說明</div>
                      <div className="role-info-desc">
                        {getRoleDescription(form.role)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!canEditRole && (
                <div className="form-group">
                  <label className="form-label">角色權限</label>
                  <div className="company-info">
                    🔒 只有超級管理員可以修改用戶角色
                    <br />
                    目前角色：{form.role === "SUPER_ADMIN" ? "🔱 超級管理員" :
                              form.role === "GLOBAL_ADMIN" ? "🌐 全域管理員" :
                              form.role === "AGENT_OWNER" ? "👑 代理商老闆" :
                              form.role === "AGENT_SUPPORT" ? "🎧 客服" : form.role}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 變更提示 */}
          {hasChanges() && (
            <div className="form-section">
              <div className="role-info">
                <div className="role-info-title">⚠️ 偵測到變更</div>
                <div className="role-info-desc">
                  您已修改了部分資料，請記得點擊「保存變更」按鈕來儲存修改
                </div>
              </div>
            </div>
          )}

          {/* 錯誤和成功訊息 */}
          {error && (
            <div className="error-section">
              <div className="error-message">
                ❌ {error}
              </div>
            </div>
          )}

          {success && (
            <div className="error-section">
              <div className="success-message">
                ✅ {success}
              </div>
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
              disabled={loading}
            >
              <span>↩️</span>
              返回
            </button>
            <button
              type="submit"
              disabled={loading || !hasChanges()}
              className="btn-primary"
            >
              <span>💾</span>
              {loading ? '保存中...' : '保存變更'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
