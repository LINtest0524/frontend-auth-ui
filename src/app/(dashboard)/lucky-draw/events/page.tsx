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
    return new Date(dateString).toLocaleString("zh-TW");
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="b-ibox">
      <h1>活動管理</h1>

      <div className="b-ibox-s">

      <div className="fl4 w100 mb15">
        <button 
          onClick={() => router.push("/lucky-draw/events/new")}
          className="b-btn-s2 b-btn-c4"
        >
          新增活動
        </button>
      </div>


      
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
                <tr key={event.id}>
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
                    <div className="fl4">
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
                    </div>
                  </td>
                </tr>
              ))}
              {events.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} >
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