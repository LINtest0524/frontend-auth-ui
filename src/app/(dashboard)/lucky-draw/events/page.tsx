"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    startTime: "",
    endTime: "",
    isActive: false,
  });

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

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const companyId = user?.companyId || 1;

      const res = await fetch("http://localhost:3001/lucky-draw-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          companyId,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "創建失敗");
      }

      alert("活動創建成功！");
      setShowCreateForm(false);
      setFormData({ name: "", startTime: "", endTime: "", isActive: false });
      fetchEvents();
    } catch (err: any) {
      alert("創建失敗：" + err.message);
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
    return new Date(dateString).toLocaleString("zh-TW");
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="b-ibox">
      <h1>活動管理</h1>

      <div className="fl4 w100 b-btnbox mb20">
        <button 
          onClick={() => setShowCreateForm(true)}
          className="b-btn-s2 b-btn-c4"
        >
          新增活動
        </button>
      </div>

      {/* 創建活動表單 */}
      {showCreateForm && (
        <div className="b-lightbox-1">
          <h2 className="mb15">新增抽獎活動</h2>
          <div className="b-form-box">
            <div className="b-form-item">
              <label>活動名稱：</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="b-input"
                placeholder="請輸入活動名稱"
              />
            </div>
            <div className="b-form-item">
              <label>開始時間：</label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="b-input"
              />
            </div>
            <div className="b-form-item">
              <label>結束時間：</label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="b-input"
              />
            </div>
            <div className="b-form-item">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                立即啟用此活動
              </label>
            </div>
            <div className="b-form-actions">
              <button onClick={handleCreate} className="b-btn-s2 b-btn-c4 mr10">
                創建活動
              </button>
              <button 
                onClick={() => setShowCreateForm(false)} 
                className="b-btn-s2 b-btn-c2"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="b-ibox-s">
        {loading && <p>載入中...</p>}
        
        {!loading && (
          <table className="b-table-box admin-table mb15">
            <thead>
              <tr>
                <th>活動名稱</th>
                <th>開始時間</th>
                <th>結束時間</th>
                <th>獎品數量</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="text-center">
                  <td>{event.name}</td>
                  <td>{formatDateTime(event.startTime)}</td>
                  <td>{formatDateTime(event.endTime)}</td>
                  <td>{event.prizes?.length || 0} 個</td>
                  <td>
                    <span className={`badge ${event.isActive ? 'badge-success' : 'badge-secondary'}`}>
                      {event.isActive ? '啟用中' : '未啟用'}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleToggleActive(event.id)}
                      className={`b-btn-s3 mr10 ${event.isActive ? 'b-btn-c2' : 'b-btn-c4'}`}
                    >
                      {event.isActive ? '停用' : '啟用'}
                    </button>
                    <button 
                      onClick={() => router.push(`/lucky-draw/prizes?eventId=${event.id}`)}
                      className="b-btn-s3 b-btn-c1 mr10"
                    >
                      管理獎品
                    </button>
                    <button 
                      onClick={() => handleDelete(event.id, event.name)}
                      className="b-btn-s3 b-btn-c3"
                    >
                      刪除
                    </button>
                  </td>
                </tr>
              ))}
              {events.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500">
                    暫無活動資料
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}