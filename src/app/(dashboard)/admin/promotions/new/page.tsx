'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/hooks/use-user-store';
import SunEditor from '@/components/SunEditor';

interface PromotionCategory {
  id: number;
  name: string;
}

export default function NewPromotionPage() {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [categories, setCategories] = useState<PromotionCategory[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    categoryId: '',
    imageUrl: '',
    startDate: '',
    endDate: '',
    sortOrder: 0,
    isActive: true,
  });

  // 分別儲存相對路徑和完整 URL
  const [imageRelativePath, setImageRelativePath] = useState('');

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
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/promotion-categories/active`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('獲取活動類型失敗:', error);
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

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      // 使用 banners 模組的上傳端點
      const response = await fetch(`http://localhost:3001/banners/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      if (response.ok) {
        const data = await response.json();
        // 儲存相對路徑用於提交
        setImageRelativePath(data.url);
        // 將相對路徑轉換為完整的 URL 用於預覽
        const fullImageUrl = `http://localhost:3001${data.url}`;
        setFormData(prev => ({ ...prev, imageUrl: fullImageUrl }));
      } else {
        const errorText = await response.text();
        console.error('上傳失敗:', errorText);
        alert('圖片上傳失敗');
      }
    } catch (error) {
      console.error('圖片上傳失敗:', error);
      alert('圖片上傳失敗');
    } finally {
      setUploadingImage(false);
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
        ...formData,
        imageUrl: imageRelativePath || formData.imageUrl, // 使用相對路徑提交
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        company_id: companyId, // 自動使用當前用戶的公司ID
      };

      const res = await fetch('http://localhost:3001/promotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '新增優惠活動失敗');
      }

      alert('優惠活動新增成功！');
      router.push('/admin/promotions');
    } catch (err: any) {
      setError(err.message || '新增優惠活動失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="b-ibox">
      <h1>新增優惠活動</h1>

      <div className="b-ibox-s">
        <form onSubmit={handleSubmit} className="w100">
          
          {/* 基本資訊 */}
          <div className="b-form-group-1 w100 fl4">
            <label>活動標題</label>
            <input
              type="text"
              name="title"
              className="w70"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="請輸入活動標題"
              required
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>活動類型</label>
            <select
              name="categoryId"
              className="w70"
              value={formData.categoryId}
              onChange={handleInputChange}
            >
              <option value="">請選擇活動類型</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>活動摘要</label>
            <textarea
              name="summary"
              className="w70"
              rows={3}
              value={formData.summary}
              onChange={handleInputChange}
              placeholder="請輸入活動摘要"
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>活動內容</label>
            <div className="w70">
              <SunEditor
                value={formData.content}
                onChange={handleContentChange}
                placeholder="請輸入活動詳細內容"
              />
            </div>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>活動圖片</label>
            <div className="w70">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="mb10"
              />
              {uploadingImage && <p>上傳中...</p>}
              {formData.imageUrl && (
                <div className="mt10">
                  <img
                    src={formData.imageUrl}
                    alt="預覽"
                    style={{ height: '150px', objectFit: 'cover', borderRadius: '4px'}}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>活動期間</label>
            <div className="w70 fl4">
              <input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="flex1 mr10"
                placeholder="開始時間"
              />
              <span className="dateto">到</span>
              <input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="flex1 ml10"
                placeholder="結束時間"
              />
            </div>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>排序</label>
            <input
              type="number"
              name="sortOrder"
              className="w70"
              value={formData.sortOrder}
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
                  name="isActive"
                  checked={formData.isActive}
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
                {loading ? '新增中...' : '新增優惠活動'}
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/admin/promotions')}
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