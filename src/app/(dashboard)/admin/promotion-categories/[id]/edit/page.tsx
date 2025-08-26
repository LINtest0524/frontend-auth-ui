'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUserStore } from '@/hooks/use-user-store';

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
      <div className="b-ibox">
        <h1>編輯活動類型</h1>
        <div className="b-ibox-s">
          <p>載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="b-ibox">
      <h1>編輯活動類型</h1>

      <div className="b-ibox-s">
        <form onSubmit={handleSubmit} className="w100">
          
          {/* 基本資訊 */}
          <div className="b-form-group-1 w100 fl4">
            <label>類型名稱</label>
            <input
              type="text"
              name="name"
              className="w70"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="請輸入活動類型名稱"
              required
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>描述</label>
            <textarea
              name="description"
              className="w70"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              placeholder="請輸入活動類型描述"
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
                  checked={Boolean(formData.is_active)}
                  onChange={handleInputChange}
                  style={{marginRight: '8px'}}
                />
                啟用狀態
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
                {loading ? '更新中...' : '更新活動類型'}
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/admin/promotion-categories')}
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