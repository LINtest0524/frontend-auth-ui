'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import '@/styles/pages/companies-admin.css';

interface Company {
  id: number;
  name: string;
  code: string;
  description?: string;
  status: 'active' | 'inactive';
  domain?: string;
  loginMethods: string[];
  created_at: string;
  updated_at: string;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/company', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('獲取公司列表失敗');
      }

      const data = await response.json();
      setCompanies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  const toggleCompanyStatus = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/company/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('更新公司狀態失敗');
      }

      // 重新載入列表
      fetchCompanies();
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新失敗');
    }
  };

  const deleteCompany = async (id: number, name: string) => {
    if (!confirm(`確定要刪除公司「${name}」嗎？此操作無法復原。`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/company/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('刪除公司失敗');
      }

      // 重新載入列表
      fetchCompanies();
    } catch (err) {
      alert(err instanceof Error ? err.message : '刪除失敗');
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  if (loading) {
    return (
      <div className="companies-container">
        <div className="loading-spinner">
          <div>⏳ 載入中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="companies-container">
        <div className="error-message">
          <div>❌ 錯誤: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="companies-container">
      {/* 頁面標題區域 */}
      <div className="companies-header">
        <h1>🏢 公司管理</h1>
        <div className="companies-header-actions">
          <Link href="/admin/companies/create" className="btn-primary">
            ✨ 新增公司
          </Link>
        </div>
      </div>

      {/* 內容區域 */}
      <div className="content-section">
        {/* 現代化表格 */}
        <table className="modern-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>公司資訊</th>
              <th>狀態</th>
              <th>登入方式</th>
              <th>時間資訊</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id}>
                <td>#{company.id}</td>
                <td>
                  <div className="company-info">
                    <div className="company-name">
                      🏢 {company.name}
                    </div>
                    <div className="company-code">
                      代碼: {company.code}
                    </div>
                    {company.description && (
                      <div className="company-description">
                        {company.description}
                      </div>
                    )}
                    {company.domain && (
                      <div className="company-domain">
                        🌐 {company.domain}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${
                    company.status === 'active' ? 'status-active' : 'status-inactive'
                  }`}>
                    {company.status === 'active' ? '✅ 啟用' : '⏸️ 停用'}
                  </span>
                </td>
                <td>
                  <div className="login-methods">
                    {company.loginMethods.map((method) => (
                      <span key={method} className="login-method-tag">
                        {method === 'USERNAME_PASSWORD' ? '🔑 帳密' :
                         method === 'FACEBOOK' ? '📘 FB' :
                         method === 'GOOGLE' ? '🔍 Google' :
                         method === 'LINE' ? '💬 LINE' : method}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="time-info">
                    <div className="created-time">
                      🕒 {new Date(company.created_at).toLocaleString('zh-TW', { 
                        timeZone: 'Asia/Taipei', 
                        hour12: false 
                      })}
                    </div>
                    <div className="updated-time">
                      🔄 {new Date(company.updated_at).toLocaleString('zh-TW', { 
                        timeZone: 'Asia/Taipei', 
                        hour12: false 
                      })}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <Link 
                      href={`/admin/companies/${company.id}/edit`}
                      className="btn-edit"
                    >
                      ✏️ 編輯
                    </Link>
                    
                    <button
                      className={`btn-toggle ${company.status === 'inactive' ? 'activate' : ''}`}
                      onClick={() => toggleCompanyStatus(company.id, company.status)}
                    >
                      {company.status === 'active' ? '⏸️ 停用' : '▶️ 啟用'}
                    </button>
                    
                    <button
                      className="btn-delete"
                      onClick={() => deleteCompany(company.id, company.name)}
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
        {companies.length === 0 && (
          <div className="no-data">
            <img src="/no-information.webp" alt="無資料" />
            <p>尚無公司資料</p>
            <Link href="/admin/companies/create" className="btn-primary">
              新增第一個公司
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}