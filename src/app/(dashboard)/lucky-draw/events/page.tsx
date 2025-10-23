"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toTaiwanDisplayTime } from "@/lib/timeUtils";
import '@/styles/pages/lucky-draw-events.css';

interface LuckyDrawEvent {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  companyId: number;
  createdAt: string;
  updatedAt: string;
  prizes: any[];
}

export default function LuckyDrawEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<LuckyDrawEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const companyId = user?.companyId;

      const res = await fetch(`http://localhost:3001/lucky-draw-events?companyId=${companyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();

      if (Array.isArray(result)) {
        setEvents(result);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error("活動載入失敗", err);
    } finally {
      setLoading(false);
    }
  };


  const handleToggleActive = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3001/lucky-draw-events/${id}/toggle-active`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("切換狀態失敗");

      alert("狀態切換成功！");
      fetchEvents();
    } catch (err: any) {
      alert("操作失敗：" + err.message);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    const confirmed = window.confirm(`確定要刪除活動「${name}」嗎？`);
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3001/lucky-draw-events/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "刪除失敗");
      }

      alert("刪除成功！");
      fetchEvents();
    } catch (err: any) {
      alert("刪除失敗：" + err.message);
    }
  };

  const formatDateTime = (dateString: string) => {
    return toTaiwanDisplayTime(dateString);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="lucky-draw-events-container">
      {/* 頁面標題區域 */}
      <div className="lucky-draw-events-header">
        <h1>🎯 抽獎活動管理</h1>
        <div className="lucky-draw-events-header-actions">
          <button 
            onClick={() => router.push("/lucky-draw/events/new")}
            className="btn-primary"
          >
            <span>✨</span>
            新增活動
          </button>
        </div>
      </div>

      {/* 內容區域 */}
      <div className="content-section">
        {/* 表格控制區域 */}
        <div className="table-controls">
          <div className="table-info">
            共 {events.length} 個抽獎活動
          </div>
        </div>

        {/* 載入狀態 */}
        {loading && (
          <div className="loading-spinner">
            <div>⏳ 載入中...</div>
          </div>
        )}

        {/* 現代化表格 */}
        {!loading && (
          <table className="modern-table">
            <thead>
              <tr>
                <th>🎯 活動資訊</th>
                <th>⏰ 活動時間</th>
                <th>🎁 獎品數量</th>
                <th>📊 狀態</th>
                <th>⚙️ 操作</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>
                    <div className="event-info">
                      <div className="event-name">{event.name}</div>
                      <div className="event-id">ID: #{event.id}</div>
                    </div>
                  </td>
                  <td>
                    <div className="time-info">
                      <div className="time-start">
                        🟢 {formatDateTime(event.startTime)}
                      </div>
                      <div className="time-end">
                        🔴 {formatDateTime(event.endTime)}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="prize-count">
                      <span className="prize-badge">
                        🎁 {event.prizes?.length || 0} 個
                      </span>
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleActive(event.id)}
                      className={`status-toggle ${
                        event.isActive ? 'status-active' : 'status-inactive'
                      }`}
                    >
                      {event.isActive ? '✅ 啟用中' : '❌ 未啟用'}
                    </button>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => router.push(`/lucky-draw/prizes?eventId=${event.id}`)}
                        className="btn-manage"
                      >
                        <span>🎁</span>
                        管理獎品
                      </button>
                      <button 
                        onClick={() => handleDelete(event.id, event.name)}
                        className="btn-delete"
                      >
                        <span>🗑️</span>
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {/* 無資料顯示 */}
        {!loading && events.length === 0 && (
          <div className="no-data">
            <img src="/no-information.webp" alt="無資料" />
            <p>目前沒有抽獎活動</p>
            <button 
              onClick={() => router.push("/lucky-draw/events/new")}
              className="btn-primary"
              style={{ marginTop: '16px' }}
            >
              <span>✨</span>
              立即新增活動
            </button>
          </div>
        )}
      </div>
    </div>
  );
}