'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUserStore } from '@/hooks/use-user-store';
import '@/styles/pages/news-form.css';

interface Category {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
  is_visible?: boolean;
  parent?: Category;
}

export default function EditProductCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id;
  const currentUser = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    sort_order: 0,
    is_active: true,
    is_visible: true,
    parent_id: ''
  });

  const [companyId, setCompanyId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);

  // 載入用戶資料
  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      const parsedUser = JSON.parse(rawUser);
      setUser(parsedUser);
      if (parsedUser.company_id) {
        setCompanyId(parsedUser.company_id);
      }
    }
  }, [setUser]);

  // 載入分類資料
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:3001/admin/product-category/${categoryId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const category = await res.json();
          setFormData({
            name: category.name || '',
            slug: category.slug || '',
            description: category.description || '',
            sort_order: category.sort_order || 0,
            is_active: category.is_active ?? true,
            is_visible: category.is_visible ?? true,
            parent_id: category.parent?.id ? String(category.parent.id) : ''
          });
        } else {
          setError('載入分類資料失敗');
        }
      } catch (err) {
        console.error('載入分類資料失敗:', err);
        setError('載入分類資料失敗');
      } finally {
        setInitialLoading(false);
      }
    };

    if (categoryId) {
      fetchCategory();
    }
  }, [categoryId]);

  // 載入父分類列表
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3001/admin/product-category', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const allCategories = Array.isArray(data) ? data : data.data || [];
          // 過濾掉當前編輯的分類，避免設定自己為父分類
          const filteredCategories = allCategories.filter((cat: Category) => cat.id !== Number(categoryId));
          setCategories(filteredCategories);
        }
      } catch (err) {
        console.error('載入分類列表失敗:', err);
      }
    };

    fetchCategories();
  }, [categoryId]);

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
      
      const submitData = {
        ...formData,
        sort_order: Number(formData.sort_order),
        parent_id: formData.parent_id ? Number(formData.parent_id) : undefined,
        company_id: companyId,
      };

      const res = await fetch(`http://localhost:3001/admin/product-category/${categoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '更新分類失敗');
      }

      alert('分類更新成功！');
      router.push('/admin/product-categories');
    } catch (err: any) {
      setError(err.message || '更新分類失敗');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="news-form-container">
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">載入中...</div>
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
            <div className="loading-text">正在更新分類...</div>
          </div>
        </div>
      )}

      {/* 頁面標題區域 */}
      <div className="news-form-header">
        <h1>✏️ 編輯商品分類</h1>
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
                  placeholder="請輸入分類名稱"
                  required
                />
                <div className="form-hint">
                  分類名稱將顯示在商品管理和前台頁面中
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="slug" className="form-label required">🔗 分類代碼</label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  className="form-input"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="請輸入分類代碼（用於 URL）"
                  required
                />
                <div className="form-hint">
                  將用於 URL 路徑，建議使用英文或數字
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="parent_id" className="form-label">📁 父分類</label>
                <div className="enhanced-select">
                  <select
                    id="parent_id"
                    name="parent_id"
                    className="form-select"
                    value={formData.parent_id}
                    onChange={handleInputChange}
                  >
                    <option value="">無 (頂層分類)</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-hint">
                  選擇父分類可建立階層式分類結構
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
                  描述會顯示在分類頁面中，幫助用戶了解此分類的內容
                </div>
              </div>
            </div>
          </div>

          {/* 設定區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>⚙️</span>
              分類設定
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="status" className="form-label">📊 分類狀態</label>
                <div className="enhanced-select">
                  <select
                    id="status"
                    name="status"
                    className="form-select"
                    value={formData.is_active ? 'ACTIVE' : 'INACTIVE'}
                    onChange={(e) => {
                      const isActive = e.target.value === 'ACTIVE';
                      setFormData(prev => ({ ...prev, is_active: isActive }));
                    }}
                  >
                    <option value="ACTIVE">✅ 啟用</option>
                    <option value="INACTIVE">❌ 停用</option>
                  </select>
                </div>
                <div className="status-preview">
                  <span className={`status-badge status-${formData.is_active ? 'active' : 'inactive'}`}>
                    {formData.is_active ? '✅ 啟用' : '❌ 停用'}
                  </span>
                </div>
                <div className="form-hint">
                  停用的分類將不會顯示在前台頁面中
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="visibility" className="form-label">👁️ 前台顯示</label>
                <div className="enhanced-select">
                  <select
                    id="visibility"
                    name="visibility"
                    className="form-select"
                    value={formData.is_visible ? 'VISIBLE' : 'HIDDEN'}
                    onChange={(e) => {
                      const isVisible = e.target.value === 'VISIBLE';
                      setFormData(prev => ({ ...prev, is_visible: isVisible }));
                    }}
                  >
                    <option value="VISIBLE">👁️ 顯示</option>
                    <option value="HIDDEN">🙈 隱藏</option>
                  </select>
                </div>
                <div className="status-preview">
                  <span className={`status-badge status-${formData.is_visible ? 'active' : 'inactive'}`}>
                    {formData.is_visible ? '👁️ 顯示' : '🙈 隱藏'}
                  </span>
                </div>
                <div className="form-hint">
                  控制此分類是否在前台頁面中顯示
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
                  placeholder="0"
                  min="0"
                />
                <div className="form-hint">
                  數字越小排序越前面，相同數字按建立時間排序
                </div>
              </div>
            </div>
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="form-section">
              <div className="error-message" style={{
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #fecaca',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                ❌ {error}
              </div>
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="form-section">
            <div className="form-actions">
              <button
                type="button"
                onClick={() => router.push('/admin/product-categories')}
                className="btn-secondary"
                disabled={loading}
              >
                <span>↩️</span>
                返回列表
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                <span>💾</span>
                {loading ? '更新中...' : '更新分類'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}