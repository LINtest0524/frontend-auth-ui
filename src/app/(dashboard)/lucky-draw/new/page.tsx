"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import '@/styles/pages/lucky-draw-create.css';

const API_BASE = 'http://localhost:3001'
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function LuckyDrawCreatePage() {
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [probability, setProbability] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const userJson = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const companyId = userJson ? JSON.parse(userJson)?.company?.id : null;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const handleFileSelect = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('只接受 JPG / PNG / WEBP 圖片')
      return
    }
    setSelectedFile(file)
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setImage(null)
    setPreview('')
    setUploading(false)
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  const handleUpload = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${API_BASE}/lucky-prize/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    })
    const data = await res.json()
    return data.url
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("請輸入獎品名稱");
    if (!image) return alert("請選擇獎品圖片");
    if (!companyId) return alert("找不到公司 ID，請重新登入");
    if (!token) return alert("未登入或 token 遺失，請重新登入");

    try {
      setLoading(true);

      // 先上傳圖片
      const imageUrl = await handleUpload(image);

      // 取得選擇的活動ID
      const urlParams = new URLSearchParams(window.location.search);
      const eventId = urlParams.get('eventId');
      
      if (!eventId) {
        alert('請先選擇活動再新增獎品');
        return;
      }

      const res = await fetch("http://localhost:3001/lucky-prize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          imageUrl,
          quantity: Number(quantity),
          probability: Number(probability),
          companyId,
          eventId: parseInt(eventId), // 關聯到活動
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`伺服器錯誤：${res.status} - ${errText}`);
      }

      alert("新增成功！");
      router.push("/lucky-draw/prizes");
    } catch (err: any) {
      alert("新增失敗：" + err.message);
      console.error("新增失敗", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lucky-draw-create-container">
      {/* 頁面標題區域 */}
      <div className="lucky-draw-create-header">
        <h1>✨ 新增抽獎獎品</h1>
        <div className="lucky-draw-create-breadcrumb">
          <span onClick={() => router.push("/lucky-draw/prizes")} className="breadcrumb-link">
            🎁 獎品管理
          </span>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">新增獎品</span>
        </div>
      </div>

      {/* 表單區域 */}
      <div className="form-section">
        <form onSubmit={handleSubmit} className="modern-form">
          
          {/* 基本資訊卡片 */}
          <div className="form-card">
            <div className="form-card-header">
              <span className="form-card-icon">🎁</span>
              <h3>基本資訊</h3>
            </div>
            <div className="form-card-content">
              <div className="form-group">
                <label htmlFor="prize-name" className="form-label">
                  <span className="label-icon">📝</span>
                  獎品名稱
                  <span className="required">*</span>
                </label>
                <input
                  id="prize-name"
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="請輸入獎品名稱"
                  required
                />
              </div>
            </div>
          </div>

          {/* 圖片上傳卡片 */}
          <div className="form-card">
            <div className="form-card-header">
              <span className="form-card-icon">🖼️</span>
              <h3>獎品圖片</h3>
            </div>
            <div className="form-card-content">
              <div className="form-group po-r">
                <label className="form-label">🖼️ 獎品圖片</label>
                
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
                    <div className="file-upload-hint">支援 JPG、PNG、WebP 格式，建議尺寸 400x400 像素</div>
                  </div>
                ) : (
                  <div className="image-preview-container">
                    <div className="image-preview">
                      <img src={preview} alt="獎品預覽" />
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
                  建議上傳高品質的獎品圖片，檔案大小不超過 5MB
                </div>
              </div>
            </div>
          </div>

          {/* 獎品設定卡片 */}
          <div className="form-card">
            <div className="form-card-header">
              <span className="form-card-icon">⚙️</span>
              <h3>獎品設定</h3>
            </div>
            <div className="form-card-content">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="prize-quantity" className="form-label">
                    <span className="label-icon">📦</span>
                    獎品數量
                    <span className="required">*</span>
                  </label>
                  <input
                    id="prize-quantity"
                    type="number"
                    className="form-input"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    min="1"
                    placeholder="請輸入獎品數量"
                    required
                  />
                  <div className="form-hint">
                    💡 設定此獎品的總數量
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="prize-probability" className="form-label">
                    <span className="label-icon">🎲</span>
                    中獎機率 (%)
                    <span className="required">*</span>
                  </label>
                  <input
                    id="prize-probability"
                    type="number"
                    className="form-input"
                    value={probability}
                    onChange={(e) => setProbability(Number(e.target.value))}
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="請輸入中獎機率"
                    required
                  />
                  <div className="form-hint">
                    💡 設定此獎品的中獎機率 (0-100%)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="form-actions">
            <button
              type="submit"
              disabled={loading}
              className="btn-submit"
            >
              {loading ? (
                <>
                  <span className="loading-spinner">⏳</span>
                  儲存中...
                </>
              ) : (
                <>
                  <span>💾</span>
                  儲存獎品
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push("/lucky-draw/prizes")}
              className="lucky-draw-cancel-btn"
            >
              <span>❌</span>
              取消
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}