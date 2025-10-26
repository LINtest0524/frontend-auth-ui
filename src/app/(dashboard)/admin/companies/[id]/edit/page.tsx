'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import '../../../../../../styles/pages/company-edit.css';

const LOGIN_METHODS = [
  { value: 'USERNAME_PASSWORD', label: '帳號密碼登入' },
  { value: 'FACEBOOK', label: 'Facebook 登入' },
];

interface Company {
  id: number;
  name: string;
  code: string;
  description?: string;
  domain?: string;
  status: string;
  loginMethods: string[];
  passwordModes: string[];
  settings?: {
    theme?: string;
    features?: string[];
    branding?: {
      primaryColor?: string;
      secondaryColor?: string;
      logo?: string;
    };
  };
}

export default function EditCompanyPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
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

  const fetchCompany = async () => {
    try {
      setFetchLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/company/${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('獲取公司資料失敗');
      }

      const data = await response.json();
      setCompany(data);
      
      // 設定表單資料
      setFormData({
        name: data.name || '',
        code: data.code || '',
        description: data.description || '',
        domain: data.domain || '',
        status: data.status || 'active',
        loginMethods: data.loginMethods || ['USERNAME_PASSWORD', 'FACEBOOK'],
        passwordModes: data.passwordModes || ['OLD_PASSWORD'],
        settings: {
          theme: data.settings?.theme || '',
          features: data.settings?.features || [],
          branding: {
            primaryColor: data.settings?.branding?.primaryColor || '',
            secondaryColor: data.settings?.branding?.secondaryColor || '',
            logo: data.settings?.branding?.logo || ''
          }
        }
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : '載入失敗');
      router.push('/admin/companies');
    } finally {
      setFetchLoading(false);
    }
  };

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
      
      const response = await fetch(`/api/admin/company/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '更新公司失敗');
      }

      alert('公司資料更新成功！');
      router.push('/admin/companies');
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, [companyId]);

  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">載入中...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">公司不存在</div>
      </div>
    );
  }

  return (
    <div className="company-edit-container">
      {/* Header */}
      <div className="company-edit-header">
        <div className="breadcrumb">
          <Link href="/admin/companies">公司管理</Link>
          <span className="separator">›</span>
          <span>編輯公司</span>
        </div>
        <h1>
          <span>🏢</span>
          編輯公司資料 - {company.name}
        </h1>
      </div>

      <div className="company-edit-content">
        {/* 主要表單區 */}
        <div>
          <form onSubmit={handleSubmit} className={`${loading ? 'form-loading' : ''}`}>
            {/* 基本資訊 */}
            <div className="company-form-card">
              <h2>基本資訊</h2>
              
              <div className="form-section">
                <div className="section-title">公司基本資料</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label required">公司名稱</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="請輸入公司名稱"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label required">公司代碼</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.code}
                      onChange={(e) => handleInputChange('code', e.target.value)}
                      placeholder="例如: a, b, company1"
                      required
                    />
                    <div className="text-hint">
                      修改代碼會影響前台路徑，新的路徑為 /{formData.code}。系統支援動態路由，修改後立即生效。
                    </div>
                  </div>
                  
                  <div className="form-group full-width">
                    <label className="form-label">公司描述</label>
                    <textarea
                      className="form-input form-textarea"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="請輸入公司描述"
                      rows={3}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">專屬網域</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.domain}
                      onChange={(e) => handleInputChange('domain', e.target.value)}
                      placeholder="例如: company.example.com"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">狀態</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                    >
                      <option value="active">啟用</option>
                      <option value="inactive">停用</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 登入設定 */}
            <div className="company-form-card">
              <h2>登入設定</h2>
              
              <div className="form-section">
                <div className="section-title">支援的登入方式</div>
                <div className="text-hint" style={{ marginBottom: '16px' }}>
                  選擇此公司前台支援的登入方式。至少需要選擇一種登入方式。
                </div>
                <div className="checkbox-group">
                  {LOGIN_METHODS.map((method) => (
                    <div key={method.value} className="checkbox-item">
                      <input
                        type="checkbox"
                        id={`login-${method.value}`}
                        checked={formData.loginMethods.includes(method.value)}
                        onChange={(e) => handleLoginMethodChange(method.value, e.target.checked)}
                      />
                      <label htmlFor={`login-${method.value}`}>{method.label}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 品牌設定 */}
            <div className="company-form-card">
              <h2>品牌設定</h2>
              
              <div className="form-section">
                <div className="section-title">Logo 管理</div>
                <div className="text-hint" style={{ marginBottom: '16px' }}>
                  Logo 請至 <a href="/admin/logo" className="text-blue-600 hover:text-blue-800 underline">全域 Logo 管理</a> 進行設定，統一管理所有公司的 Logo 顯示。
                </div>
              </div>
              
              <div className="form-section">
                <div className="section-title">主題顏色（實驗性功能）</div>
                <div className="text-hint" style={{ marginBottom: '16px' }}>
                  以下設定可能在前台尚未完全生效，僅供未來功能使用。
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">主要顏色</label>
                    <div className="color-picker-group">
                      <input
                        type="color"
                        className="color-input"
                        value={formData.settings.branding.primaryColor || '#3b82f6'}
                        onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                      />
                      <span className="color-value">
                        {formData.settings.branding.primaryColor || '#3b82f6'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">次要顏色</label>
                    <div className="color-picker-group">
                      <input
                        type="color"
                        className="color-input"
                        value={formData.settings.branding.secondaryColor || '#64748b'}
                        onChange={(e) => handleBrandingChange('secondaryColor', e.target.value)}
                      />
                      <span className="color-value">
                        {formData.settings.branding.secondaryColor || '#64748b'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 提交按鈕 */}
            <div className="form-actions">
              <div className="left">
                <Link href="/admin/companies" className="btn btn-secondary">
                  ← 返回列表
                </Link>
              </div>
              <div className="right">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading && <div className="loading-spinner"></div>}
                  {loading ? '更新中...' : '💾 更新公司'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}