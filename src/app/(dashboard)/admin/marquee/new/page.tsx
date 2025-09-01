"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "@/styles/pages/marquee-form.css";

export default function MarqueeCreatePage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;

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

  const userJson =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const companyId = userJson ? JSON.parse(userJson)?.company?.id : null;
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
    } finally {
      setInitializing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'tagId') {
      setFormData(prev => ({ ...prev, [name]: value ? Number(value) : null }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return alert("請輸入標題");
    if (!companyId) return alert("找不到公司 ID，請重新登入");
    if (!token) return alert("未登入或 token 遺失，請重新登入");

    try {
      setLoading(true);

      const res = await fetch(`${apiBase}/admin/marquee`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          link: formData.link,
          isActive: formData.isActive,
          companyId,
          tagId: formData.tagId,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`伺服器錯誤：${res.status} - ${errText}`);
      }

      alert("新增成功！");
      router.push("/admin/marquee");
    } catch (err: any) {
      alert("新增失敗：" + err.message);
      console.error("新增失敗", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const selectedTag = tags.find(t => t.id === formData.tagId);

  if (initializing) {
    return (
      <div className="marquee-form-container">
        <div className="loading-spinner">
          <div>⏳ 載入中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="marquee-form-container">
      {/* 頁面標題區域 */}
      <div className="marquee-form-header">
        <h1>✨ 新增跑馬燈</h1>
      </div>

      {/* 表單內容 */}
      <div className="marquee-form-content">
        <form onSubmit={handleSubmit}>
          {/* 基本設定區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>📋</span>
              基本設定
            </div>
            
            <div className="form-grid single-column">
              <div className="form-group">
                <label htmlFor="title" className="form-label required">📝 標題</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className="form-input"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="請輸入跑馬燈標題（後台參考用）"
                />
                <div className="form-hint">
                  此標題僅供後台管理參考，不會在前台顯示
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="content" className="form-label">📢 顯示內容</label>
                <textarea
                  id="content"
                  name="content"
                  className="form-textarea"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="請輸入要在跑馬燈中顯示的內容"
                  rows={4}
                />
                <div className="form-hint">
                  此內容將會在前台跑馬燈中滾動顯示
                </div>
                {formData.content && (
                  <div className="content-preview">
                    <div className="content-preview-label">📱 內容預覽：</div>
                    <div className="content-preview-text">"{formData.content}"</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 連結設定區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>🔗</span>
              連結設定
            </div>
            
            <div className="form-grid single-column">
              <div className="form-group">
                <label htmlFor="link" className="form-label">🔗 連結網址</label>
                <input
                  type="url"
                  id="link"
                  name="link"
                  className="form-input"
                  value={formData.link}
                  onChange={handleChange}
                  placeholder="https://example.com 或 /page"
                />
                <div className="form-hint">
                  可以輸入完整網址 (https://...) 或站內路徑 (/page)，留空則無連結功能
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
                <span>✨</span>
                {loading ? "建立中..." : "建立跑馬燈"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
