'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/hooks/use-user-store';
import '@/styles/pages/news-form.css';


interface Category {
  id: number;
  name: string;
}

export default function NewProductCategoryPage() {
  const router = useRouter();
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
          setCategories(Array.isArray(data) ? data : data.data || []);
        }
      } catch (err) {
        console.error('載入分類列表失敗:', err);
      }
    };

    fetchCategories();
  }, []);

  // 自動生成 slug
  useEffect(() => {
    if (formData.name) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sort_order' ? parseInt(value) || 0 : value
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // 準備提交資料
      const submitData = {
        ...formData,
        sort_order: Number(formData.sort_order),
        parent_id: formData.parent_id ? Number(formData.parent_id) : undefined,
        company_id: companyId, // 自動使用當前用戶的公司ID
      };

      const res = await fetch('http://localhost:3001/admin/product-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '新增分類失敗');
      }

      alert('分類新增成功！');
      router.push('/admin/product-categories');
    } catch (err: any) {
      setError(err.message || '新增分類失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="news-form-container">
      {/* 載入遮罩 */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">正在建立分類...</div>
          </div>
        </div>
      )}

      {/* 頁面標題區域 */}
      <div className="news-form-header">
        <h1>🏷️ 新增商品分類</h1>
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
                  將用於 URL 路徑，建議使用英文或數字，會自動根據分類名稱生成
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
              <div className="error-message">
                {error}
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
                <span>✨</span>
                {loading ? '建立中...' : '建立分類'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}