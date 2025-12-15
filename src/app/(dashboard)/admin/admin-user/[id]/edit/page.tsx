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
    ip_whitelist: "",
    department_type: "",
    agent_code: "",
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/user/${id}`, {
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
        ip_whitelist: data.ip_whitelist || "",
        department_type: data.department_type || "",
        agent_code: data.agent_code || "",
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

  const canEditRole = ["SUPER_ADMIN", "GLOBAL_ADMIN"].includes(currentUser?.role || "");

  // 檢查是否有變更
  const hasChanges = () => {
    if (!originalData) return false;
    
    return (
      form.email !== (originalData.email || "") ||
      form.status !== (originalData.status || "ACTIVE") ||
      (canEditRole && form.role !== (originalData.role || "")) ||
      form.ip_whitelist !== (originalData.ip_whitelist || "") ||
      form.department_type !== (originalData.department_type || "") ||
      form.agent_code !== (originalData.agent_code || "")
    );
  };

  // 表單驗證
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = '請輸入有效的電子郵件格式';
    }
    
    if (!form.status) {
      errors.status = '請選擇狀態';
    }
    
    if (canEditRole && !form.role) {
      errors.role = '請選擇角色';
    }

    // IP白名單驗證
    if (form.ip_whitelist.trim()) {
      const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipPattern.test(form.ip_whitelist.trim())) {
        errors.ip_whitelist = '請輸入有效的IP地址格式 (例：192.168.1.100)';
      }
    }

    // 代理商推廣代碼驗證
    if (form.agent_code.trim()) {
      if (form.agent_code.length < 4) {
        errors.agent_code = '代理商推廣代碼至少需要4個字元';
      } else if (!/^[A-Za-z0-9_]+$/.test(form.agent_code)) {
        errors.agent_code = '代理商推廣代碼只能包含字母、數字和底線';
      }
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
      if (form.ip_whitelist !== (originalData?.ip_whitelist || "")) {
        changedFields.ip_whitelist = form.ip_whitelist.trim() || null;
      }
      if (form.department_type !== (originalData?.department_type || "")) {
        changedFields.department_type = form.department_type.trim() || null;
      }
      if (form.agent_code !== (originalData?.agent_code || "")) {
        changedFields.agent_code = form.agent_code.trim() || null;
      }
      
      // 如果沒有任何變更
      if (Object.keys(changedFields).length === 0) {
        setError("沒有任何變更需要保存");
        setLoading(false);
        return;
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/user/${id}`, {
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

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "擁有系統最高權限，可管理所有功能和用戶";
      case "GLOBAL_ADMIN":
        return "可管理多個公司的代理商和客服人員";
      case "AGENT_LEVEL_1":
        return "一級代理商，可管理下級代理商和客服人員";
      case "AGENT_LEVEL_2":
        return "二級代理商，可管理下級代理商和客服人員";
      case "AGENT_LEVEL_3":
        return "三級代理商，可管理下級代理商和客服人員";
      case "AGENT_LEVEL_4":
        return "四級代理商，可管理下級代理商和客服人員";
      case "AGENT_LEVEL_5":
        return "五級代理商，可管理下級代理商和客服人員";
      case "AGENT_LEVEL_6":
        return "六級代理商，可管理下級代理商和客服人員";
      case "AGENT_LEVEL_7":
        return "七級代理商，可管理下級代理商和客服人員";
      case "AGENT_LEVEL_8":
        return "八級代理商，可管理下級代理商和客服人員";
      case "AGENT_LEVEL_9":
        return "九級代理商，可管理下級代理商和客服人員";
      case "AGENT_LEVEL_10":
        return "十級代理商，可管理下級代理商和客服人員";
      case "AGENT_LEVEL_11":
        return "十一級代理商，可管理下級代理商和客服人員";
      case "AGENT_LEVEL_12":
        return "十二級代理商，可管理客服人員";
      case "AGENT_SUPPORT":
        return "客服人員，負責處理會員問題和支援服務";
      default:
        return "未知角色";
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "帳號正常運作，可以登入系統";
      case "INACTIVE":
        return "帳號暫時停用，無法登入系統";
      case "BANNED":
        return "帳號被永久封鎖，無法登入系統";
      default:
        return "未知狀態";
    }
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
                <label htmlFor="email" className="form-label">
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

          {/* 安全設定區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>🔒</span>
              安全設定
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="ip_whitelist" className="form-label">
                  IP 白名單
                </label>
                <input
                  id="ip_whitelist"
                  name="ip_whitelist"
                  type="text"
                  value={form.ip_whitelist}
                  onChange={handleChange}
                  className={`form-input ${fieldErrors.ip_whitelist ? 'error' : form.ip_whitelist && /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(form.ip_whitelist) ? 'success' : ''}`}
                  placeholder="例：192.168.1.100 (留空表示不限制IP)"
                />
                {fieldErrors.ip_whitelist && (
                  <div className="field-error">
                    ❌ {fieldErrors.ip_whitelist}
                  </div>
                )}
                {!fieldErrors.ip_whitelist && form.ip_whitelist && /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(form.ip_whitelist) && (
                  <div className="field-success">
                    ✅ IP地址格式正確
                  </div>
                )}
                <div className="form-help">
                  🛡️ 如果設定IP白名單，該帳號只能從指定的IP地址登入。留空表示不限制登入IP地址。
                </div>
              </div>
            </div>
          </div>

          {/* 部門資訊區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>🏢</span>
              部門資訊
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="department_type" className="form-label">
                  部門類型
                </label>
                <input
                  id="department_type"
                  name="department_type"
                  type="text"
                  value={form.department_type}
                  onChange={handleChange}
                  className={`form-input ${form.department_type ? 'success' : ''}`}
                  placeholder="例：行銷、後台、客服、財務..."
                />
                {form.department_type && (
                  <div className="field-success">
                    ✅ 部門類型：{form.department_type}
                  </div>
                )}
                <div className="form-help">
                  🏢 用於標示該管理員所屬的部門單位，方便後續管理和識別（選填）
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="agent_code" className="form-label">
                  代理商推廣代碼
                </label>
                <input
                  id="agent_code"
                  name="agent_code"
                  type="text"
                  value={form.agent_code}
                  onChange={handleChange}
                  className={`form-input ${fieldErrors.agent_code ? 'error' : form.agent_code && /^[A-Za-z0-9_]+$/.test(form.agent_code) && form.agent_code.length >= 4 ? 'success' : ''}`}
                  placeholder="例：AGENT_2_1761199476"
                />
                {fieldErrors.agent_code && (
                  <div className="field-error">
                    ❌ {fieldErrors.agent_code}
                  </div>
                )}
                {!fieldErrors.agent_code && form.agent_code && /^[A-Za-z0-9_]+$/.test(form.agent_code) && form.agent_code.length >= 4 && (
                  <div className="field-success">
                    ✅ 代理商推廣代碼：{form.agent_code}
                  </div>
                )}
                <div className="form-help">
                  🎯 設定後，會員註冊時輸入此代碼將自動歸屬到該代理商底下。只能包含字母、數字和底線，至少4個字元（選填）
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
                    <option value="AGENT_LEVEL_1">🥇 一級代理商</option>
                    <option value="AGENT_LEVEL_2">🥈 二級代理商</option>
                    <option value="AGENT_LEVEL_3">🥉 三級代理商</option>
                    <option value="AGENT_LEVEL_4">4️⃣ 四級代理商</option>
                    <option value="AGENT_LEVEL_5">5️⃣ 五級代理商</option>
                    <option value="AGENT_LEVEL_6">6️⃣ 六級代理商</option>
                    <option value="AGENT_LEVEL_7">7️⃣ 七級代理商</option>
                    <option value="AGENT_LEVEL_8">8️⃣ 八級代理商</option>
                    <option value="AGENT_LEVEL_9">9️⃣ 九級代理商</option>
                    <option value="AGENT_LEVEL_10">🔟 十級代理商</option>
                    <option value="AGENT_LEVEL_11">1️⃣1️⃣ 十一級代理商</option>
                    <option value="AGENT_LEVEL_12">1️⃣2️⃣ 十二級代理商</option>
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

              {!canEditRole && form.role && (
                <div className="form-group">
                  <div className="role-info">
                    <div className="role-info-title">目前角色</div>
                    <div className="role-info-desc">
                      {form.role === "SUPER_ADMIN" ? "🔱 超級管理員" :
                       form.role === "GLOBAL_ADMIN" ? "🌐 全域管理員" :
                       form.role === "AGENT_LEVEL_1" ? "🥇 一級代理商" :
                       form.role === "AGENT_LEVEL_2" ? "🥈 二級代理商" :
                       form.role === "AGENT_LEVEL_3" ? "🥉 三級代理商" :
                       form.role === "AGENT_LEVEL_4" ? "4️⃣ 四級代理商" :
                       form.role === "AGENT_LEVEL_5" ? "5️⃣ 五級代理商" :
                       form.role === "AGENT_LEVEL_6" ? "6️⃣ 六級代理商" :
                       form.role === "AGENT_LEVEL_7" ? "7️⃣ 七級代理商" :
                       form.role === "AGENT_LEVEL_8" ? "8️⃣ 八級代理商" :
                       form.role === "AGENT_LEVEL_9" ? "9️⃣ 九級代理商" :
                       form.role === "AGENT_LEVEL_10" ? "🔟 十級代理商" :
                       form.role === "AGENT_LEVEL_11" ? "1️⃣1️⃣ 十一級代理商" :
                       form.role === "AGENT_LEVEL_12" ? "1️⃣2️⃣ 十二級代理商" :
                       form.role === "AGENT_SUPPORT" ? "🎧 客服" : form.role}
                    </div>
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