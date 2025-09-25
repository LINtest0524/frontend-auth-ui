'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUserStore } from '@/hooks/use-user-store';
import '@/styles/pages/news-form.css';

interface PromotionCategory {
  id: number;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

export default function EditPromotionCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const currentUser = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sort_order: 0,
    is_active: false,
  });

  // 載入用戶資料
  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      const parsedUser = JSON.parse(rawUser);
      setUser(parsedUser);
      // 設定用戶所屬的公司ID
      if (parsedUser.company_id) {
        setCompanyId(parsedUser.company_id);
      }
    }
  }, [setUser]);

  useEffect(() => {
    fetchCategory();
  }, [id]);

  const fetchCategory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/promotion-categories/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: PromotionCategory = await response.json();
        setFormData({
          name: data.name,
          description: data.description || '',
          sort_order: data.sortOrder,
          is_active: data.isActive,
        });
      } else {
        alert('獲取活動類型失敗');
        router.push('/admin/promotion-categories');
      }
    } catch (error) {
      console.error('獲取活動類型失敗:', error);
      alert('獲取活動類型失敗');
      router.push('/admin/promotion-categories');
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // 準備提交資料
      const submitData = {
        name: formData.name,
        description: formData.description,
        sortOrder: Number(formData.sort_order),
        isActive: formData.is_active,
        company_id: companyId, // 自動使用當前用戶的公司ID
      };

      const res = await fetch(`http://localhost:3001/promotion-categories/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '更新活動類型失敗');
      }

      alert('活動類型更新成功！');
      router.push('/admin/promotion-categories');
    } catch (err: any) {
      setError(err.message || '更新活動類型失敗');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="news-form-container">
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">正在載入分類資料...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="news-form-container">
      {/* 載入遮罩 */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">正在更新促銷分類...</div>
          </div>
        </div>
      )}

      {/* 頁面標題區域 */}
      <div className="news-form-header">
        <h1>✏️ 編輯促銷分類</h1>
      </div>

      {/* 表單內容 */}
      <div className="news-form-content">
        <form onSubmit={handleSubmit}>
          {/* 基本資訊區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>📋</span>
              基本資訊
            </div>
            
            <div className="form-grid single-column">
              <div className="form-group">
                <label htmlFor="name" className="form-label required">🏷️ 分類名稱</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="請輸入促銷分類名稱"
                  required
                />
                <div className="form-hint">
                  建議使用簡潔明瞭的名稱，方便管理和識別
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description" className="form-label">📝 分類描述</label>
                <textarea
                  id="description"
                  name="description"
                  className="form-textarea"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="請輸入分類描述（選填）"
                />
                <div className="form-hint">
                  描述有助於說明此分類的用途和適用範圍
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="sort_order" className="form-label">🔢 排序順序</label>
                <input
                  type="number"
                  id="sort_order"
                  name="sort_order"
                  className="form-input"
                  value={formData.sort_order}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="0"
                />
                <div className="form-hint">
                  數字越小排序越前面，相同數字按建立時間排序
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
            
            <div className="form-grid single-column">
              <div className="form-group">
                <label className="form-label">🔄 啟用狀態</label>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={Boolean(formData.is_active)}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="is_active">✅ 啟用此分類</label>
                </div>
                <div className="form-hint">
                  停用的分類將不會顯示在前台選項中
                </div>
              </div>
            </div>
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="form-section">
              <div className="error-message">
                ❌ {error}
              </div>
            </div>
          )}

          {/* 操作按鈕區塊 */}
          <div className="form-section">
            <div className="form-actions">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? '⏳ 更新中...' : '💾 更新分類'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin/promotion-categories')}
                className="btn-secondary"
              >
                ❌ 取消
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}