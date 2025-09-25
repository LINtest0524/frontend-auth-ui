"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import '@/styles/pages/lucky-draw-create.css';

const API_BASE = 'http://localhost:3001'
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function LuckyDrawEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [probability, setProbability] = useState(0);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState("");

  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const userJson = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const companyId = userJson ? JSON.parse(userJson)?.company?.id : null;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // 載入現有獎品資料
  useEffect(() => {
    const fetchPrize = async () => {
      try {
        const res = await fetch(`${API_BASE}/lucky-prize/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const prize = await res.json();
        
        setName(prize.name);
        setQuantity(prize.quantity);
        setProbability(prize.probability);
        setCurrentImageUrl(prize.imageUrl);
      } catch (err) {
        console.error("載入獎品失敗", err);
        alert("載入獎品失敗");
      }
    };

    if (id && token) {
      fetchPrize();
    }
  }, [id, token]);

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
    if (!token) return alert("未登入或 token 遺失，請重新登入");

    try {
      setLoading(true);

      let imageUrl = currentImageUrl;
      
      // 如果有選擇新圖片，先上傳
      if (image) {
        imageUrl = await handleUpload(image);
      }

      const res = await fetch(`${API_BASE}/lucky-prize/${id}`, {
        method: "PUT",
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
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`伺服器錯誤：${res.status} - ${errText}`);
      }

      alert("更新成功！");
      router.push("/lucky-draw");
    } catch (err: any) {
      alert("更新失敗：" + err.message);
      console.error("更新失敗", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lucky-draw-create-container">
      {/* 頁面標題區域 */}
      <div className="lucky-draw-create-header">
        <h1>✏️ 編輯抽獎獎品</h1>
        <div className="lucky-draw-create-breadcrumb">
          <span onClick={() => router.push("/lucky-draw")} className="breadcrumb-link">
            🎁 獎品管理
          </span>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">編輯獎品</span>
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
              <div className="image-upload-section">
                <div className="image-upload-area">
                  <input
                    type="file"
                    id="prize-img"
                    className="image-input"
                    ref={imageInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={e => {
                      const file = e.target.files?.[0] || null
                      if (file && !ACCEPTED_TYPES.includes(file.type)) {
                        alert('只接受 JPG / PNG / WEBP 圖片')
                        return
                      }
                      setImage(file)
                      setPreview(file ? URL.createObjectURL(file) : '')
                    }}
                  />
                  <label htmlFor="prize-img" className="image-upload-label">
                    {preview ? (
                      <div className="image-preview-container">
                        <img
                          src={preview}
                          alt="新圖片預覽"
                          className="image-preview"
                        />
                        <div className="image-overlay">
                          <span className="change-image-text">
                            🔄 點擊更換圖片
                          </span>
                        </div>
                      </div>
                    ) : currentImageUrl ? (
                      <div className="image-preview-container">
                        <img
                          src={`${API_BASE}${currentImageUrl}`}
                          alt="目前圖片"
                          className="image-preview"
                        />
                        <div className="image-overlay">
                          <span className="change-image-text">
                            🔄 點擊更換圖片
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="image-upload-placeholder">
                        <div className="upload-icon">📷</div>
                        <div className="upload-text">
                          <div className="upload-title">點擊上傳獎品圖片</div>
                          <div className="upload-subtitle">支援 JPG、PNG、WEBP 格式</div>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
                <div className="form-hint">
                  💡 不選擇新檔案則保持原圖片
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
                  更新中...
                </>
              ) : (
                <>
                  <span>💾</span>
                  更新獎品
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push("/lucky-draw")}
              className="btn-cancel"
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