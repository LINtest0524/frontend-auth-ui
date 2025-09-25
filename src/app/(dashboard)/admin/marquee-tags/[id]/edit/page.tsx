"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import "@/styles/pages/admin-user-form.css";

export default function EditMarqueeTagPage() {
  const { id } = useParams();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    backgroundColor: "#3b82f6",
    textColor: "#ffffff",
    shape: "oval",
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // 表單驗證
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!form.name.trim()) {
      errors.name = '請輸入標籤名稱';
    }
    
    if (!form.backgroundColor || !/^#[0-9A-Fa-f]{6}$/.test(form.backgroundColor)) {
      errors.backgroundColor = '請輸入有效的背景顏色代碼';
    }
    
    if (!form.textColor || !/^#[0-9A-Fa-f]{6}$/.test(form.textColor)) {
      errors.textColor = '請輸入有效的文字顏色代碼';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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

  const fetchData = async () => {
    if (!token) {
      setError("未登入或 token 遺失，請重新登入");
      setInitialLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiBase}/admin/marquee-tags/item/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      setForm({
        name: data.name || "",
        backgroundColor: data.backgroundColor || "#3b82f6",
        textColor: data.textColor || "#ffffff",
        shape: data.shape || "oval",
        isActive: data.isActive ?? true,
      });
    } catch (err: any) {
      setError("資料載入失敗");
      console.error(err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError("請檢查表單內容");
      return;
    }

    if (!token) {
      setError("未登入或 token 遺失，請重新登入");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${apiBase}/admin/marquee-tags/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          backgroundColor: form.backgroundColor,
          textColor: form.textColor,
          shape: form.shape,
          isActive: form.isActive,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "更新失敗");
      }

      setSuccess("跑馬燈標籤更新成功！即將跳轉...");
      setTimeout(() => {
        router.push("/admin/marquee-tags");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  // 如果正在載入初始資料，顯示載入畫面
  if (initialLoading) {
    return (
      <div className="admin-user-form-container">
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">正在載入標籤資料...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-user-form-container">
      {/* 載入遮罩 */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">正在更新跑馬燈標籤...</div>
          </div>
        </div>
      )}

      {/* 頁面標題區域 */}
      <div className="admin-user-form-header">
        <h1>✏️ 編輯跑馬燈標籤</h1>
      </div>

      {/* 表單內容 */}
      <div className="admin-user-form-content">
        <form onSubmit={handleSubmit}>
          {/* 基本資訊區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>📝</span>
              基本資訊
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name" className="form-label required">
                  標籤名稱
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  className={`form-input ${fieldErrors.name ? 'error' : form.name ? 'success' : ''}`}
                  placeholder="請輸入標籤名稱"
                />
                {fieldErrors.name && (
                  <div className="field-error">
                    ❌ {fieldErrors.name}
                  </div>
                )}
                {!fieldErrors.name && form.name && (
                  <div className="field-success">
                    ✅ 標籤名稱格式正確
                  </div>
                )}
                <div className="form-help">
                  標籤名稱將顯示在跑馬燈中，建議簡潔明瞭
                </div>
              </div>
            </div>
          </div>

          {/* 外觀設定區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>🎨</span>
              外觀設定
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="backgroundColor" className="form-label required">
                  背景顏色
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={form.backgroundColor}
                    onChange={handleChange}
                    name="backgroundColor"
                    style={{ 
                      width: '60px', 
                      height: '40px', 
                      border: '2px solid #e5e7eb', 
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    id="backgroundColor"
                    name="backgroundColor"
                    type="text"
                    value={form.backgroundColor}
                    onChange={handleChange}
                    className={`form-input ${fieldErrors.backgroundColor ? 'error' : form.backgroundColor ? 'success' : ''}`}
                    placeholder="#3b82f6"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    style={{ flex: 1, fontFamily: 'monospace' }}
                  />
                </div>
                {fieldErrors.backgroundColor && (
                  <div className="field-error">
                    ❌ {fieldErrors.backgroundColor}
                  </div>
                )}
                <div className="form-help">
                  選擇標籤的背景顏色，建議使用對比度較高的顏色
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="textColor" className="form-label required">
                  文字顏色
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={form.textColor}
                    onChange={handleChange}
                    name="textColor"
                    style={{ 
                      width: '60px', 
                      height: '40px', 
                      border: '2px solid #e5e7eb', 
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    id="textColor"
                    name="textColor"
                    type="text"
                    value={form.textColor}
                    onChange={handleChange}
                    className={`form-input ${fieldErrors.textColor ? 'error' : form.textColor ? 'success' : ''}`}
                    placeholder="#ffffff"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    style={{ flex: 1, fontFamily: 'monospace' }}
                  />
                </div>
                {fieldErrors.textColor && (
                  <div className="field-error">
                    ❌ {fieldErrors.textColor}
                  </div>
                )}
                <div className="form-help">
                  選擇標籤的文字顏色，確保與背景顏色有良好對比
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="shape" className="form-label required">
                  標籤形狀
                </label>
                <select
                  id="shape"
                  name="shape"
                  value={form.shape}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="oval">🥚 橢圓形</option>
                  <option value="pentagon">🏠 五邊形</option>
                </select>
                <div className="form-help">
                  選擇標籤的外觀形狀，橢圓形較為圓潤，五邊形較有特色
                </div>
              </div>
            </div>
          </div>

          {/* 預覽區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>👁️</span>
              即時預覽
            </div>
            
            <div style={{ 
              padding: '2rem', 
              background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', 
              borderRadius: '12px',
              textAlign: 'center',
              border: '2px dashed #cbd5e1'
            }}>
              <div style={{ 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#64748b', 
                marginBottom: '1rem' 
              }}>
                標籤預覽效果
              </div>
              <div
                style={{
                  display: 'inline-block',
                  padding: form.shape === 'pentagon' ? '6px 5px 10px' : '0.75rem 1.5rem',
                  borderRadius: form.shape === 'oval' ? '20px' : '0px',
                  clipPath: form.shape === 'pentagon' ? 'polygon(0% 0%, 100% 0%, 100% 80%, 50% 100%, 0% 80%)' : 'none',
                  fontSize: '12px',
                  fontWeight: form.shape === 'pentagon' ? 'normal' : '600',
                  backgroundColor: form.backgroundColor,
                  color: form.textColor,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  minWidth: form.shape === 'pentagon' ? 'auto' : '120px',
                  transition: 'all 0.3s ease'
                }}
              >
                {form.name || "標籤預覽"}
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
                <label className="form-label">啟用狀態</label>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  padding: '1rem',
                  background: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px'
                }}>
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    style={{ 
                      width: '18px', 
                      height: '18px', 
                      accentColor: '#3b82f6',
                      cursor: 'pointer'
                    }}
                  />
                  <label 
                    htmlFor="isActive" 
                    style={{ 
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      cursor: 'pointer'
                    }}
                  >
                    啟用標籤
                  </label>
                </div>
                <div className="form-help">
                  啟用後，此標籤將可在跑馬燈設定中使用
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
              <span>💾</span>
              {loading ? '更新中...' : '儲存修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}