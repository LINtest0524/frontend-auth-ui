// frontend/src/app/(dashboard)/admin/admin-user/[id]/reset-password/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import "@/styles/pages/admin-user-form.css";

export default function AdminUserResetPasswordPage() {
  const router = useRouter();
  const { id } = useParams();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [userInfo, setUserInfo] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // 密碼強度檢查
  const getPasswordStrength = (password: string) => {
    if (password.length < 6) return { level: 'weak', text: '密碼太短（至少6個字符）', score: 1 };
    if (password.length < 8) return { level: 'medium', text: '密碼強度：中等', score: 2 };
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return { level: 'medium', text: '密碼強度：中等', score: 2 };
    return { level: 'strong', text: '密碼強度：強', score: 3 };
  };

  // 表單驗證
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!password.trim()) {
      errors.password = '請輸入新密碼';
    } else if (password.length < 6) {
      errors.password = '密碼至少需要6個字符';
    }
    
    if (!confirm.trim()) {
      errors.confirm = '請確認新密碼';
    } else if (password !== confirm) {
      errors.confirm = '密碼確認不一致';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 載入用戶資訊
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:3001/user/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserInfo(data);
        }
      } catch (err) {
        console.error("載入用戶資訊失敗:", err);
      }
    };
    
    if (id) {
      fetchUserInfo();
    }
  }, [id]);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    // 清除密碼欄位的錯誤訊息
    if (fieldErrors.password) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.password;
        return newErrors;
      });
    }
  };

  const handleConfirmChange = (value: string) => {
    setConfirm(value);
    // 清除確認密碼欄位的錯誤訊息
    if (fieldErrors.confirm) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.confirm;
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
    setSuccess(false);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3001/user/${id}/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword: password }), 
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "重設失敗");
      }
      
      setSuccess(true);
      setPassword("");
      setConfirm("");
      
      // 3秒後自動跳轉
      setTimeout(() => {
        router.push("/admin/admin-user");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "發生錯誤");
    } finally {
      setLoading(false);
    }
  };


  const passwordStrength = password ? getPasswordStrength(password) : null;
  const isPasswordMatch = password && confirm && password === confirm;

  return (
    <div className="admin-user-form-container">
      {/* 載入遮罩 */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">正在重設密碼...</div>
          </div>
        </div>
      )}

      {/* 頁面標題區域 */}
      <div className="admin-user-form-header">
        <h1>🔑 重設密碼</h1>
      </div>

      {/* 表單內容 */}
      <div className="admin-user-form-content">
        <form onSubmit={handleSubmit}>
          {/* 用戶資訊區塊 */}
          {userInfo && (
            <div className="form-section">
              <div className="section-title">
                <span>👤</span>
                用戶資訊
              </div>
              
              <div className="role-info">
                <div className="role-info-title">即將重設密碼的用戶</div>
                <div className="role-info-desc">
                  <strong>帳號：</strong>{userInfo.username}<br />
                  <strong>角色：</strong>{
                    userInfo.role === "SUPER_ADMIN" ? "🔱 超級管理員" :
                    userInfo.role === "GLOBAL_ADMIN" ? "🌐 全域管理員" :
                    userInfo.role === "AGENT_OWNER" ? "👑 代理商老闆" :
                    userInfo.role === "AGENT_SUPPORT" ? "🎧 客服" : userInfo.role
                  }
                </div>
              </div>
            </div>
          )}

          {/* 密碼設定區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>🔐</span>
              新密碼設定
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="password" className="form-label required">
                  新密碼
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className={`form-input ${fieldErrors.password ? 'error' : password && password.length >= 6 ? 'success' : ''}`}
                    placeholder="請輸入新密碼（至少6個字符）"
                    style={{ paddingRight: '50px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
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

              <div className="form-group">
                <label htmlFor="confirm" className="form-label required">
                  確認新密碼
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="confirm"
                    name="confirm"
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => handleConfirmChange(e.target.value)}
                    className={`form-input ${fieldErrors.confirm ? 'error' : isPasswordMatch ? 'success' : ''}`}
                    placeholder="請再次輸入新密碼"
                    style={{ paddingRight: '50px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                </div>
                {fieldErrors.confirm && (
                  <div className="field-error">
                    ❌ {fieldErrors.confirm}
                  </div>
                )}
                {!fieldErrors.confirm && isPasswordMatch && (
                  <div className="field-success">
                    ✅ 密碼確認一致
                  </div>
                )}
                <div className="form-help">
                  請再次輸入相同的密碼以確認
                </div>
              </div>
            </div>
          </div>

          {/* 安全提醒區塊 */}
          <div className="form-section">
            <div className="role-info">
              <div className="role-info-title">🛡️ 安全提醒</div>
              <div className="role-info-desc">
                • 密碼重設後，該用戶需要使用新密碼重新登入<br />
                • 建議通知用戶密碼已變更，並提醒其妥善保管<br />
                • 強烈建議用戶首次登入後立即修改為個人密碼
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
                ✅ 密碼重設成功！系統將在3秒後自動跳轉回管理員列表
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
              disabled={loading || !password || !confirm || password !== confirm}
              className="btn-primary"
            >
              <span>🔑</span>
              {loading ? '重設中...' : '確認重設密碼'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
