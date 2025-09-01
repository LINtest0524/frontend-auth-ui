"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import "@/styles/pages/marquee-form.css";

export default function EditMarqueePage() {
  const { id } = useParams();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    link: "",
    isActive: true,
    tagId: null as number | null,
  });
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchTags = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/admin/marquee-tags`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTags(data.filter((tag: any) => tag.isActive));
      }
    } catch (err) {
      console.error("載入標籤失敗:", err);
    }
  };

  const fetchData = async () => {
    if (!token) {
      setError("未登入或 token 遺失，請重新登入");
      setInitializing(false);
      return;
    }

    try {
      const res = await fetch(`${apiBase}/admin/marquee/item/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      setFormData({
        title: data.title || "",
        content: data.content || "",
        link: data.link || "",
        isActive: data.isActive ?? true,
        tagId: data.tag?.id || null,
      });
    } catch (err: any) {
      setError("資料載入失敗");
      console.error(err);
    } finally {
      setInitializing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'tagId') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? Number(value) : null
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError("請輸入跑馬燈標題");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    if (!token) {
      setError("未登入或 token 遺失，請重新登入");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiBase}/admin/marquee/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          link: formData.link,
          isActive: formData.isActive,
          tagId: formData.tagId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "更新失敗");
      }

      setSuccess("跑馬燈更新成功！即將跳轉...");
      setTimeout(() => {
        router.push("/admin/marquee");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      Promise.all([fetchData(), fetchTags()]);
    }
  }, [id]);

  const selectedTag = formData.tagId ? tags.find(tag => tag.id === formData.tagId) : null;

  // 如果正在載入初始資料，顯示載入畫面
  if (initializing) {
    return (
      <div className="marquee-form-container">
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">正在載入跑馬燈資料...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="marquee-form-container">
      {/* 載入遮罩 */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">正在更新跑馬燈...</div>
          </div>
        </div>
      )}

      {/* 頁面標題區域 */}
      <div className="marquee-form-header">
        <h1>✏️ 編輯跑馬燈</h1>
        <div className="header-subtitle">
          修改跑馬燈內容和設定
        </div>
      </div>

      {/* 表單內容 */}
      <div className="marquee-form-content">
        <form onSubmit={handleSubmit}>
          {/* 基本資訊區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>📝</span>
              基本資訊
            </div>
            
            <div className="form-grid single-column">
              <div className="form-group">
                <label htmlFor="title" className="form-label required">📢 跑馬燈標題</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className="form-input"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="請輸入跑馬燈標題"
                />
                <div className="form-hint">
                  標題是跑馬燈的主要內容，會在前台顯示
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="content" className="form-label">📄 詳細內容</label>
                <textarea
                  id="content"
                  name="content"
                  className="form-textarea"
                  value={formData.content}
                  onChange={handleChange}
                  rows={4}
                  placeholder="請輸入詳細內容（選填）"
                />
                <div className="form-hint">
                  可以添加更詳細的說明內容
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="link" className="form-label">🔗 連結網址</label>
                <input
                  type="url"
                  id="link"
                  name="link"
                  className="form-input"
                  value={formData.link}
                  onChange={handleChange}
                  placeholder="https://example.com（選填）"
                />
                <div className="form-hint">
                  點擊跑馬燈時要跳轉的網址，留空則無連結
                </div>
                {formData.link && (
                  <div className="url-preview">
                    🔗 預覽：{formData.link}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 外觀設定區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>🎨</span>
              外觀設定
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="tagId" className="form-label">🏷️ 標籤</label>
                <div className="enhanced-select">
                  <select
                    id="tagId"
                    name="tagId"
                    className="form-select"
                    value={formData.tagId || ""}
                    onChange={handleChange}
                  >
                    <option value="">無標籤</option>
                    {tags.map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-hint">
                  選擇標籤可以為跑馬燈添加視覺分類標識
                </div>
                {selectedTag && (
                  <div className="tag-preview">
                    <div className="tag-preview-label">🎨 標籤預覽：</div>
                    <span
                      className="tag-badge"
                      style={{
                        backgroundColor: selectedTag.backgroundColor,
                        color: selectedTag.textColor,
                      }}
                    >
                      {selectedTag.name}
                    </span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">📊 狀態設定</label>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                  <label htmlFor="isActive">啟用跑馬燈</label>
                </div>
                <div className="form-hint">
                  停用的跑馬燈不會在前台顯示
                </div>
                <div className={`status-indicator ${formData.isActive ? 'status-active' : 'status-inactive'}`}>
                  {formData.isActive ? '✅ 啟用狀態 - 將會在前台顯示' : '❌ 停用狀態 - 不會在前台顯示'}
                </div>
              </div>
            </div>
          </div>

          {/* 錯誤和成功訊息 */}
          {error && (
            <div className="form-section">
              <div className="error-message">
                ❌ {error}
              </div>
            </div>
          )}

          {success && (
            <div className="form-section">
              <div className="success-message">
                ✅ {success}
              </div>
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="form-section">
            <div className="form-actions">
              <button
                type="button"
                onClick={() => router.push("/admin/marquee")}
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
                {loading ? "更新中..." : "儲存修改"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}