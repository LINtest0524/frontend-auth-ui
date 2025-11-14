// frontend/src/app/(dashboard)/admin/admin-user/new/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "@/styles/pages/admin-user-form.css";

export default function AdminUserCreatePage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [companies, setCompanies] = useState<{ id: number; name: string }[]>([]);

  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "AGENT_SUPPORT",
    companyId: undefined as number | undefined,
    department_type: "",
    ip_whitelist: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // 密碼強度檢查
  const getPasswordStrength = (password: string) => {
    if (password.length < 6) return { level: 'weak', text: '密碼太短（至少6個字符）' };
    if (password.length < 8) return { level: 'medium', text: '密碼強度：中等' };
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return { level: 'medium', text: '密碼強度：中等' };
    return { level: 'strong', text: '密碼強度：強' };
  };

  // 表單驗證
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!form.username.trim()) {
      errors.username = '請輸入帳號';
    } else if (form.username.length < 3) {
      errors.username = '帳號至少需要3個字符';
    }
    
    if (!form.password) {
      errors.password = '請輸入密碼';
    } else if (form.password.length < 6) {
      errors.password = '密碼至少需要6個字符';
    }
    
    if (!form.role) {
      errors.role = '請選擇角色';
    }
    
    if (["SUPER_ADMIN", "GLOBAL_ADMIN"].includes(currentUser?.role) && !form.companyId) {
      errors.companyId = '請選擇所屬公司';
    }

    // IP白名單驗證
    if (form.ip_whitelist.trim()) {
      const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipPattern.test(form.ip_whitelist.trim())) {
        errors.ip_whitelist = '請輸入有效的IP地址格式 (例：192.168.1.100)';
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const rawUser = localStorage.getItem("user");
    if (token && rawUser) {
      const parsed = JSON.parse(rawUser);
      setCurrentUser(parsed);

      if (["SUPER_ADMIN", "GLOBAL_ADMIN"].includes(parsed.role)) {
        fetch(`${process.env.NEXT_PUBLIC_API_BASE}/company`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) {
              setCompanies(data);
            } else if (Array.isArray(data.data)) {
              setCompanies(data.data);
            } else {
              setCompanies([]); // fallback 空陣列
              // 公司資料格式錯誤，靜默處理
            }
          });

      }
    }
  }, []);

  const getAvailableRoles = () => {
    if (!currentUser) return [];
    
    // 管理員頁面允許創建管理員和客服角色
    if (currentUser.role === "SUPER_ADMIN") {
      return [
        { value: "GLOBAL_ADMIN", label: "全域管理員" },
        { value: "AGENT_SUPPORT", label: "客服人員" },
      ];
    }
    
    if (currentUser.role === "GLOBAL_ADMIN") {
      return [
        { value: "GLOBAL_ADMIN", label: "全域管理員" },
        { value: "AGENT_SUPPORT", label: "客服人員" },
      ];
    }
    
    // 其他角色在管理員頁面無權限創建用戶
    return [];
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "companyId" ? Number(value) : value,
    }));
    
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

    const token = localStorage.getItem("token");

    const payload = {
      ...form,
      ip_whitelist: form.ip_whitelist.trim() || null,
      companyId:
        currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "GLOBAL_ADMIN"
          ? form.companyId
          : currentUser?.companyId,
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "建立失敗");
      }
      
      setSuccess("管理員建立成功！即將跳轉...");
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
        return "系統最高權限管理員，擁有所有功能的完全控制權，可管理所有系統設定";
      case "GLOBAL_ADMIN":
        return "全域管理員，可管理整個系統的運營，負責日常管理工作";
      case "AGENT_SUPPORT":
        return "客服人員，負責處理客戶服務、用戶支援和問題解決";
      default:
        return "請選擇管理員角色";
    }
  };

  const passwordStrength = form.password ? getPasswordStrength(form.password) : null;

  return (
    <div className="admin-user-form-container">
      {/* 載入遮罩 */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">正在建立管理員...</div>
          </div>
        </div>
      )}

      {/* 頁面標題區域 */}
      <div className="admin-user-form-header">
        <h1>✨ 新增管理員</h1>
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
                <label htmlFor="username" className="form-label required">
                  帳號
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={form.username}
                  onChange={handleChange}
                  className={`form-input ${fieldErrors.username ? 'error' : form.username ? 'success' : ''}`}
                  placeholder="請輸入帳號（至少3個字符）"
                />
                {fieldErrors.username && (
                  <div className="field-error">
                    ❌ {fieldErrors.username}
                  </div>
                )}
                {!fieldErrors.username && form.username && form.username.length >= 3 && (
                  <div className="field-success">
                    ✅ 帳號格式正確
                  </div>
                )}
                <div className="form-help">
                  帳號將用於登入系統，建議使用英文字母和數字組合
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label required">
                  密碼
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className={`form-input ${fieldErrors.password ? 'error' : form.password && form.password.length >= 6 ? 'success' : ''}`}
                  placeholder="請輸入密碼（至少6個字符）"
                />
                {fieldErrors.password && (
                  <div className="field-error">
                    ❌ {fieldErrors.password}
                  </div>
                )}
                {passwordStrength && (
                  <div className={`password-strength password-${passwordStrength.level}`}>
                    {passwordStrength.text}
                  </div>
                )}
                <div className="form-help">
                  建議使用包含大小寫字母、數字的組合以提高安全性
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

          {/* 權限設定區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>🔐</span>
              權限設定
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="role" className="form-label required">
                  角色
                </label>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className={`form-select ${fieldErrors.role ? 'error' : form.role ? 'success' : ''}`}
                >
                  <option value="">請選擇角色</option>
                  {getAvailableRoles().map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
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

              {["SUPER_ADMIN", "GLOBAL_ADMIN"].includes(currentUser?.role) && (
                <div className="form-group">
                  <label htmlFor="companyId" className="form-label required">
                    所屬公司
                  </label>
                  <select
                    id="companyId"
                    name="companyId"
                    value={form.companyId || ""}
                    onChange={handleChange}
                    className={`form-select ${fieldErrors.companyId ? 'error' : form.companyId ? 'success' : ''}`}
                  >
                    <option value="">請選擇公司</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.companyId && (
                    <div className="field-error">
                      ❌ {fieldErrors.companyId}
                    </div>
                  )}
                  <div className="company-info">
                    💼 管理員將隸屬於所選公司，並只能管理該公司相關的資料
                  </div>
                </div>
              )}

              {!["SUPER_ADMIN", "GLOBAL_ADMIN"].includes(currentUser?.role) && currentUser?.company && (
                <div className="form-group">
                  <label className="form-label">所屬公司</label>
                  <div className="company-info">
                    💼 自動設定為：{currentUser.company.name}
                  </div>
                </div>
              )}
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
            </div>
          </div>

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
              disabled={loading}
              className="btn-primary"
            >
              <span>✨</span>
              {loading ? '建立中...' : '建立管理員'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
