'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUserStore } from '@/hooks/use-user-store';

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
      <div className="b-ibox">
        <h1>編輯商品分類</h1>
        <div className="b-ibox-s">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            載入中...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="b-ibox">
      <h1>編輯商品分類</h1>

      <div className="b-ibox-s">
        <form onSubmit={handleSubmit} className="w100">
          
          {/* 基本資訊 */}
          <div className="b-form-group-1 w100 fl4">
            <label>分類名稱</label>
            <input
              type="text"
              name="name"
              className="w70"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="請輸入分類名稱"
              required
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>URL 別名 (Slug)</label>
            <input
              type="text"
              name="slug"
              className="w70"
              value={formData.slug}
              onChange={handleInputChange}
              placeholder="URL 友善的名稱"
              required
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>父分類</label>
            <select
              name="parent_id"
              className="w70"
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

          <div className="b-form-group-1 w100 fl4">
            <label>描述</label>
            <textarea
              name="description"
              className="w70"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              placeholder="請輸入分類描述"
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>排序</label>
            <input
              type="number"
              name="sort_order"
              className="w70"
              value={formData.sort_order}
              onChange={handleInputChange}
              min="0"
              placeholder="數字越小排序越前面"
            />
          </div>

          {/* 狀態設定 */}
          <div className="b-form-group-1 w100 fl4">
            <label>狀態設定</label>
            <div className="w70" style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  style={{marginRight: '8px'}}
                />
                啟用狀態
              </label>
              <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                <input
                  type="checkbox"
                  name="is_visible"
                  checked={formData.is_visible}
                  onChange={handleInputChange}
                  style={{marginRight: '8px'}}
                />
                前台顯示
              </label>
            </div>
          </div>

          {error && (
            <div className="b-form-group-1 w100 fl4">
              <label></label>
              <div className="w70" style={{
                backgroundColor: '#f8d7da',
                color: '#721c24',
                padding: '12px',
                borderRadius: '4px',
                border: '1px solid #f5c6cb'
              }}>
                {error}
              </div>
            </div>
          )}

          {/* 按鈕區域 */}
          <div className="b-form-group-1 w100 fl4">
            <label></label>
            <div className="w70">
              <button
                type="submit"
                disabled={loading}
                className="b-btn-s2 b-btn-c4 mr20"
              >
                {loading ? '更新中...' : '更新分類'}
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/admin/product-categories')}
                className="b-btn-s2 b-btn-c1"
              >
                取消
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}