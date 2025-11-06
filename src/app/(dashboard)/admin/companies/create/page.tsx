'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import "@/styles/pages/company-form.css";

const LOGIN_METHODS = [
  { value: 'USERNAME_PASSWORD', label: '帳號密碼' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'GOOGLE', label: 'Google' },
  { value: 'LINE', label: 'LINE' }
];

const PASSWORD_MODES = [
  { value: 'OLD_PASSWORD', label: '舊密碼模式' },
  { value: 'NEW_PASSWORD', label: '新密碼模式' }
];

export default function CreateCompanyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    domain: '',
    status: 'active',
    loginMethods: ['USERNAME_PASSWORD', 'FACEBOOK'],
    passwordModes: ['OLD_PASSWORD'],
    settings: {
      theme: '',
      features: [] as string[],
      branding: {
        primaryColor: '',
        secondaryColor: '',
        logo: ''
      }
    }
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSettingsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
  };

  const handleBrandingChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        branding: {
          ...prev.settings.branding,
          [field]: value
        }
      }
    }));
  };

  const handleLoginMethodChange = (method: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      loginMethods: checked 
        ? [...prev.loginMethods, method]
        : prev.loginMethods.filter(m => m !== method)
    }));
  };

  const handlePasswordModeChange = (mode: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      passwordModes: checked 
        ? [...prev.passwordModes, mode]
        : prev.passwordModes.filter(m => m !== mode)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.code.trim()) {
      alert('請填寫公司名稱和代碼');
      return;
    }

    if (formData.loginMethods.length === 0) {
      alert('請至少選擇一種登入方式');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '新增公司失敗');
      }

      const result = await response.json();
      alert('公司新增成功！');
      router.push('/admin/companies');
    } catch (err) {
      alert(err instanceof Error ? err.message : '新增失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="company-form-container">
      {/* 載入遮罩 */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">正在創建公司...</div>
          </div>
        </div>
      )}

      {/* 頁面標題區域 */}
      <div className="company-form-header">
        <h1>🏢 新增公司</h1>
      </div>

      {/* 表單內容 */}
      <div className="company-form-content">
        <form onSubmit={handleSubmit}>
          {/* 基本資訊區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>📋</span>
              基本資訊
            </div>
            
            <div className="form-grid">
              <div className="form-grid-two">
                <div className="form-group">
                  <label htmlFor="name" className="form-label required">
                    公司名稱
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`form-input ${formData.name ? 'success' : ''}`}
                    placeholder="請輸入公司名稱"
                    required
                  />
                  {formData.name && (
                    <div className="field-success">
                      ✅ 公司名稱已輸入
                    </div>
                  )}
                  <div className="form-help">
                    這將作為公司的顯示名稱
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="code" className="form-label required">
                    公司代碼
                  </label>
                  <input
                    id="code"
                    name="code"
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    className={`form-input ${formData.code ? 'success' : ''}`}
                    placeholder="例如: a, b, company1"
                    required
                  />
                  {formData.code && (
                    <div className="field-success">
                      ✅ 公司代碼已輸入
                    </div>
                  )}
                  <div className="form-help">
                    🔗 用於 URL 路徑和系統識別，只能包含英文字母和數字
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  公司描述
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`form-textarea ${formData.description ? 'success' : ''}`}
                  placeholder="請輸入公司描述（選填）"
                  rows={3}
                />
                <div className="form-help">
                  📝 簡短描述公司業務或特色
                </div>
              </div>
              
              <div className="form-grid-two">
                <div className="form-group">
                  <label htmlFor="domain" className="form-label">
                    專屬網域
                  </label>
                  <input
                    id="domain"
                    name="domain"
                    type="text"
                    value={formData.domain}
                    onChange={(e) => handleInputChange('domain', e.target.value)}
                    className={`form-input ${formData.domain ? 'success' : ''}`}
                    placeholder="例如: company.example.com"
                  />
                  <div className="form-help">
                    🌐 自定義網域名稱（選填）
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="status" className="form-label">
                    狀態
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="form-select success"
                  >
                    <option value="active">🟢 啟用</option>
                    <option value="inactive">🔴 停用</option>
                  </select>
                  <div className="status-info">
                    {formData.status === 'active' ? '✅ 公司將立即可用' : '⚠️ 公司將暫停服務'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 登入設定區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>🔐</span>
              登入設定
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label required">登入方式</label>
                <div className="checkbox-group">
                  {LOGIN_METHODS.map((method) => (
                    <div 
                      key={method.value} 
                      className={`checkbox-item ${formData.loginMethods.includes(method.value) ? 'checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        id={`login-${method.value}`}
                        checked={formData.loginMethods.includes(method.value)}
                        onChange={(e) => 
                          handleLoginMethodChange(method.value, e.target.checked)
                        }
                      />
                      <label htmlFor={`login-${method.value}`}>{method.label}</label>
                    </div>
                  ))}
                </div>
                <div className="form-help">
                  🔑 至少選擇一種登入方式，用戶可使用選定的方式登入系統
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">密碼模式</label>
                <div className="checkbox-group">
                  {PASSWORD_MODES.map((mode) => (
                    <div 
                      key={mode.value} 
                      className={`checkbox-item ${formData.passwordModes.includes(mode.value) ? 'checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        id={`password-${mode.value}`}
                        checked={formData.passwordModes.includes(mode.value)}
                        onChange={(e) => 
                          handlePasswordModeChange(mode.value, e.target.checked)
                        }
                      />
                      <label htmlFor={`password-${mode.value}`}>{mode.label}</label>
                    </div>
                  ))}
                </div>
                <div className="form-help">
                  🔒 選擇密碼驗證模式，影響用戶登入時的驗證方式
                </div>
              </div>
            </div>
          </div>

          {/* 品牌設定區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>🎨</span>
              品牌設定（可選）
            </div>
            
            <div className="form-grid">
              <div className="form-grid-two">
                <div className="form-group">
                  <label htmlFor="theme" className="form-label">
                    主題
                  </label>
                  <input
                    id="theme"
                    name="theme"
                    type="text"
                    value={formData.settings.theme}
                    onChange={(e) => handleSettingsChange('theme', e.target.value)}
                    className={`form-input ${formData.settings.theme ? 'success' : ''}`}
                    placeholder="例如: blue, red, custom"
                  />
                  <div className="form-help">
                    🎭 設定主題風格，影響整體視覺呈現
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="logo" className="form-label">
                    Logo URL
                  </label>
                  <input
                    id="logo"
                    name="logo"
                    type="url"
                    value={formData.settings.branding.logo}
                    onChange={(e) => handleBrandingChange('logo', e.target.value)}
                    className={`form-input ${formData.settings.branding.logo ? 'success' : ''}`}
                    placeholder="https://example.com/logo.png"
                  />
                  <div className="form-help">
                    🖼️ 公司 Logo 圖片網址
                  </div>
                </div>
              </div>
              
              <div className="form-grid-two">
                <div className="form-group">
                  <label htmlFor="primaryColor" className="form-label">
                    主要顏色
                  </label>
                  <input
                    id="primaryColor"
                    name="primaryColor"
                    type="color"
                    value={formData.settings.branding.primaryColor}
                    onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                    className="color-input"
                  />
                  <div className="form-help">
                    🎨 主要品牌顏色，用於按鈕和重點元素
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="secondaryColor" className="form-label">
                    次要顏色
                  </label>
                  <input
                    id="secondaryColor"
                    name="secondaryColor"
                    type="color"
                    value={formData.settings.branding.secondaryColor}
                    onChange={(e) => handleBrandingChange('secondaryColor', e.target.value)}
                    className="color-input"
                  />
                  <div className="form-help">
                    🎨 次要品牌顏色，用於輔助元素和背景
                  </div>
                </div>
              </div>
              
              {(formData.settings.branding.primaryColor || formData.settings.branding.secondaryColor) && (
                <div className="branding-preview">
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>顏色預覽：</span>
                  {formData.settings.branding.primaryColor && (
                    <div className="color-preview" style={{ backgroundColor: formData.settings.branding.primaryColor }}></div>
                  )}
                  {formData.settings.branding.secondaryColor && (
                    <div className="color-preview" style={{ backgroundColor: formData.settings.branding.secondaryColor }}></div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="form-actions">
            <Link href="/admin/companies" className="btn-secondary">
              <span>↩️</span>
              返回
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              <span>🏢</span>
              {loading ? '新增中...' : '新增公司'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}