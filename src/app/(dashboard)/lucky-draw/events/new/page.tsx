"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { fromDatetimeLocalToUTC } from "@/lib/timeUtils";
import '@/styles/pages/lucky-draw-event-create.css';

export default function LuckyDrawEventCreatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    startTime: "",
    endTime: "",
    isActive: false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert("請輸入活動名稱");
      return;
    }
    
    if (!formData.startTime) {
      alert("請選擇開始時間");
      return;
    }
    
    if (!formData.endTime) {
      alert("請選擇結束時間");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const companyId = user?.companyId || 1;

      if (!token) {
        alert("未登入或 token 遺失，請重新登入");
        return;
      }

      const res = await fetch("http://localhost:3001/lucky-draw-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          startTime: fromDatetimeLocalToUTC(formData.startTime),
          endTime: fromDatetimeLocalToUTC(formData.endTime),
          companyId,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "創建失敗");
      }

      alert("活動創建成功！");
      router.push("/lucky-draw/events");
    } catch (err: any) {
      alert("創建失敗：" + err.message);
      console.error("創建失敗", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lucky-draw-event-create-container">
      {/* 頁面標題區域 */}
      <div className="lucky-draw-event-create-header">
        <h1>🎯 新增抽獎活動</h1>
        <div className="lucky-draw-event-create-breadcrumb">
          <span onClick={() => router.push("/lucky-draw/events")} className="breadcrumb-link">
            🎯 活動管理
          </span>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">新增活動</span>
        </div>
      </div>

      {/* 表單區域 */}
      <div className="form-section">
        <form onSubmit={handleSubmit} className="modern-form">
          
          {/* 基本資訊卡片 */}
          <div className="form-card">
            <div className="form-card-header">
              <span className="form-card-icon">📝</span>
              <h3>基本資訊</h3>
            </div>
            <div className="form-card-content">
              <div className="form-group">
                <label htmlFor="event-name" className="form-label">
                  <span className="label-icon">🎯</span>
                  活動名稱
                  <span className="required">*</span>
                </label>
                <input
                  id="event-name"
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="請輸入抽獎活動名稱"
                  required
                />
                <div className="form-hint">
                  💡 建議使用具有吸引力的活動名稱
                </div>
              </div>
            </div>
          </div>

          {/* 時間設定卡片 */}
          <div className="form-card">
            <div className="form-card-header">
              <span className="form-card-icon">⏰</span>
              <h3>活動時間</h3>
            </div>
            <div className="form-card-content">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="start-time" className="form-label">
                    <span className="label-icon">🟢</span>
                    開始時間
                    <span className="required">*</span>
                  </label>
                  <DateTimePicker
                    id="start-time"
                    value={formData.startTime}
                    onChange={(value) => setFormData({ ...formData, startTime: value })}
                    className="form-input"
                    required
                  />
                  <div className="form-hint">
                    💡 設定活動開始的日期和時間
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="end-time" className="form-label">
                    <span className="label-icon">🔴</span>
                    結束時間
                    <span className="required">*</span>
                  </label>
                  <DateTimePicker
                    id="end-time"
                    value={formData.endTime}
                    onChange={(value) => setFormData({ ...formData, endTime: value })}
                    className="form-input"
                    required
                  />
                  <div className="form-hint">
                    💡 設定活動結束的日期和時間
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 活動設定卡片 */}
          <div className="form-card">
            <div className="form-card-header">
              <span className="form-card-icon">⚙️</span>
              <h3>活動設定</h3>
            </div>
            <div className="form-card-content">
              <div className="form-group">
                <div className="checkbox-group">
                  <label htmlFor="active" className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      id="active"
                      className="modern-checkbox"
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-text">
                      <span className="checkbox-icon">✅</span>
                      立即啟用活動
                    </span>
                  </label>
                  <div className="form-hint">
                    💡 勾選後活動將立即生效，用戶可以開始參與抽獎
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
                  創建中...
                </>
              ) : (
                <>
                  <span>🎯</span>
                  創建活動
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push("/lucky-draw/events")}
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