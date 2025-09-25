'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/hooks/use-user-store';
import SunEditor from '@/components/SunEditor';
import '@/styles/pages/news-form.css';

interface PromotionCategory {
  id: number;
  name: string;
}

export default function NewPromotionPage() {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [categories, setCategories] = useState<PromotionCategory[]>([]);
  const [preview, setPreview] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const imageInputRef = useRef<HTMLInputElement | null>(null);

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

  const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  const handleFileSelect = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('只接受 JPG / PNG / WEBP 圖片');
      return;
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    
    // 自動上傳
    handleImageUpload(file);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch(`http://localhost:3001/banners/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      if (response.ok) {
        const data = await response.json();
        setImageRelativePath(data.url);
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
      } else {
        alert('圖片上傳失敗');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('圖片上傳失敗');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreview('');
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    setImageRelativePath('');
    setUploading(false);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
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
    <div className="news-form-container">
      {/* 載入遮罩 */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">正在建立優惠活動...</div>
          </div>
        </div>
      )}

      {/* 頁面標題區域 */}
      <div className="news-form-header">
        <h1>🎉 新增優惠活動</h1>
      </div>

      {/* 表單內容 */}
      <div className="news-form-content">
        <form onSubmit={handleSubmit}>
          {/* 基本設定區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>📋</span>
              基本設定
            </div>
            
            <div className="form-grid single-column">
              <div className="form-group">
                <label htmlFor="title" className="form-label required">🎯 活動標題</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className="form-input"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="請輸入活動標題"
                  required
                />
                <div className="form-hint">
                  為您的優惠活動設定一個吸引人的標題
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="categoryId" className="form-label">📂 活動類型</label>
                <select
                  id="categoryId"
                  name="categoryId"
                  className="form-select"
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
                <div className="form-hint">
                  選擇適合的活動類型有助於分類管理
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="summary" className="form-label required">📝 活動摘要</label>
                <textarea
                  id="summary"
                  name="summary"
                  className="form-textarea"
                  rows={3}
                  value={formData.summary}
                  onChange={handleInputChange}
                  placeholder="請輸入活動摘要，可以使用 Enter 換行"
                  required
                />
                <div className="form-hint">
                  摘要會顯示在活動列表中，建議控制在 100-200 字內
                </div>
              </div>
            </div>
          </div>

          {/* 內容編輯區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>✏️</span>
              內容編輯
            </div>
            
            <div className="form-grid single-column">
              <div className="form-group">
                <label className="form-label required">📄 活動內容</label>
                <div className="editor-container">
                  <SunEditor
                    value={formData.content}
                    onChange={handleContentChange}
                    placeholder="請輸入活動詳細內容..."
                    height="400px"
                  />
                </div>
                <div className="form-hint">
                  支援豐富的格式化功能、圖片上傳、表格、程式碼等
                </div>
              </div>
            </div>
          </div>

          {/* 圖片設定區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>🖼️</span>
              圖片設定
            </div>
            
            <div className="form-grid single-column">
              <div className="form-group po-r">
                <label className="form-label">🖼️ 活動圖片</label>
                
                {!preview ? (
                  <div 
                    className="file-upload-area"
                    onClick={() => imageInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.add('dragover')
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('dragover')
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.remove('dragover')
                      const file = e.dataTransfer.files[0]
                      if (file) handleFileSelect(file)
                    }}
                  >
                    <div className="file-upload-icon">📁</div>
                    <div className="file-upload-text">點擊選擇圖片或拖拽到此處</div>
                    <div className="file-upload-hint">支援 JPG、PNG、WebP 格式，建議尺寸 1200x630 像素</div>
                  </div>
                ) : (
                  <div className="image-preview-container">
                    <div className="image-preview">
                      <img src={preview} alt="活動預覽" />
                      <div className="image-info">
                        📄 {selectedFile?.name} ({((selectedFile?.size || 0) / 1024).toFixed(1)} KB)
                      </div>
                      {uploading && (
                        <div className="upload-status">
                          ⏳ 上傳中...
                        </div>
                      )}
                      <div className="image-actions">
                        <button
                          type="button"
                          className="btn-change-image"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={uploading}
                        >
                          🔄 更換圖片
                        </button>
                        <button
                          type="button"
                          className="btn-remove-image"
                          onClick={handleRemoveImage}
                          disabled={uploading}
                        >
                          🗑️ 移除圖片
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 隱藏的檔案輸入元素 */}
                <input
                  type="file"
                  ref={imageInputRef}
                  className="file-input-hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file)
                  }}
                />
                
                <div className="form-hint">
                  建議上傳高品質的活動圖片，檔案大小不超過 5MB
                </div>
              </div>
            </div>
          </div>

          {/* 發布設定區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>📊</span>
              發布設定
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="status" className="form-label">📊 發布狀態</label>
                <div className="enhanced-select">
                  <select
                    id="status"
                    name="isActive"
                    className="form-select"
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                  >
                    <option value="true">✅ 已啟用</option>
                    <option value="false">❌ 已停用</option>
                  </select>
                </div>
                <div className="status-preview">
                  <span className={`status-badge status-${formData.isActive ? 'active' : 'inactive'}`}>
                    {formData.isActive ? '✅ 已啟用' : '❌ 已停用'}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="sortOrder" className="form-label">🔢 排序順序</label>
                <input
                  type="number"
                  id="sortOrder"
                  name="sortOrder"
                  className="form-input"
                  value={formData.sortOrder}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                />
                <div className="form-hint">
                  數字越小排序越前面，相同數字按建立時間排序
                </div>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="startDate" className="form-label">⏰ 開始時間</label>
                <input
                  type="datetime-local"
                  id="startDate"
                  name="startDate"
                  className="form-input"
                  value={formData.startDate}
                  onChange={handleInputChange}
                />
                <div className="form-hint">
                  設定活動的開始時間，可以留空表示立即開始
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="endDate" className="form-label">⏰ 結束時間</label>
                <input
                  type="datetime-local"
                  id="endDate"
                  name="endDate"
                  className="form-input"
                  value={formData.endDate}
                  onChange={handleInputChange}
                />
                <div className="form-hint">
                  設定活動的結束時間，可以留空表示不限時間
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

          {/* 操作按鈕 */}
          <div className="form-section">
            <div className="form-actions">
              <button
                type="button"
                onClick={() => router.push('/admin/promotions')}
                className="btn-secondary"
                disabled={loading || uploading}
              >
                <span>↩️</span>
                返回
              </button>
              <button
                type="submit"
                disabled={loading || uploading}
                className="btn-primary"
              >
                <span>🎉</span>
                {loading ? '建立中...' : uploading ? '上傳中...' : '建立優惠活動'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}