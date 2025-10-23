"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toTaiwanDisplayTime } from "@/lib/timeUtils";
import "@/styles/pages/checkin-activities.css";

interface Activity {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  publishAt?: string;
  isEnabled: boolean;
  createdAt: string;
}

export default function StrictStreakPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        activityType: "STRICT_STREAK_7",
        page: page.toString(),
        pageSize: "20",
      });

      if (searchQuery) {
        params.append("q", searchQuery);
      }

      const response = await fetch(`/api/checkin/activities?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data.data);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('獲取活動列表失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [page, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchActivities();
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/checkin/activities/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ isEnabled: !currentStatus }),
      });

      if (response.ok) {
        fetchActivities();
      }
    } catch (error) {
      console.error('更新狀態失敗:', error);
    }
  };

  const deleteActivity = async (id: number, title: string) => {
    if (!confirm(`確定要刪除活動「${title}」嗎？\n\n此操作無法復原，將會永久刪除活動及相關的獎勵設定。`)) {
      return;
    }

    try {
      const response = await fetch(`/api/checkin/activities/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        alert('活動已成功刪除');
        fetchActivities();
      } else {
        const errorData = await response.json();
        alert(`刪除失敗：${errorData.message || '未知錯誤'}`);
      }
    } catch (error) {
      console.error('刪除活動失敗:', error);
      alert('刪除失敗，請稍後再試');
    }
  };

  return (
    <div className="checkin-container fade-in">
      <div className="checkin-header">
        <div className="checkin-header-content">
          <h1>
            連續簽到活動
            <span className="activity-type-badge strict-streak">嚴格連續</span>
          </h1>
          <p>管理嚴格連續簽到活動，用戶必須連續簽到才能獲得獎勵，漏簽將重新開始計算</p>
        </div>
        <Link href="/checkin/strict-streak/new" className="checkin-add-btn">
          新增連續簽到活動
        </Link>
      </div>

      <div className="checkin-search-section">
        <form onSubmit={handleSearch} className="checkin-search-form">
          <input
            type="text"
            placeholder="搜尋活動標題..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="checkin-search-input"
          />
          <button type="submit" className="checkin-search-btn">
            🔍 搜尋
          </button>
        </form>
      </div>

      {/* 前台連結提醒 */}
      <div className="frontend-links-notice">
        <div className="frontend-links-header">
          <span className="frontend-links-icon">🔗</span>
          <span className="frontend-links-title">前台用戶參與網址</span>
        </div>
        <div className="frontend-links-content">
          <div className="frontend-link-item">
            <span className="link-label">簽到頁面：</span>
            <code className="frontend-link">/daily-checkin</code>
          </div>
        </div>
        <div className="frontend-links-hint">
          💡 用戶在您的代理商前台可通過此路徑參與連續簽到活動
        </div>
      </div>

      <div className="checkin-list-container">

        <div className="checkin-table-container">
          <table className="checkin-table">
            <thead className="checkin-table-header">
              <tr>
                <th>活動資訊</th>
                <th>活動期間</th>
                <th>預約上架</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>載入活動列表中...</p>
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <h3>尚無連續簽到活動</h3>
                    <p>開始建立您的第一個連續簽到活動，提升用戶黏性</p>
                  </td>
                </tr>
              ) : (
                activities.map((activity, index) => (
                  <tr key={activity.id} className="table-row-enter" style={{ animationDelay: `${index * 0.1}s` }}>
                    <td>
                      <div className="activity-title">{activity.title}</div>
                      <div className="activity-subtitle">連續簽到活動 • 用戶需連續簽到獲得獎勵</div>
                    </td>
                    <td>
                      <div className="date-range">
                        <div className="date-item">
                          <span className="date-icon">📅</span>
                          開始：{toTaiwanDisplayTime(activity.startDate)}
                        </div>
                        <div className="date-item">
                          <span className="date-icon">🏁</span>
                          結束：{toTaiwanDisplayTime(activity.endDate)}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`publish-schedule ${activity.publishAt ? 'scheduled' : 'none'}`}>
                        {activity.publishAt 
                          ? `⏰ ${new Date(activity.publishAt).toLocaleString('zh-TW')}`
                          : '立即上架'
                        }
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${activity.isEnabled ? 'active' : 'inactive'}`}>
                        {activity.isEnabled ? '🟢 啟用中' : '⚪ 已停用'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link href={`/checkin/activities/${activity.id}/edit`} className="action-btn action-btn-edit">
                          ✏️ 編輯
                        </Link>
                        <Link href={`/checkin/activities/${activity.id}/preview`} className="action-btn action-btn-preview">
                          👁️ 預覽
                        </Link>
                        <button
                          className={`action-btn action-btn-toggle ${activity.isEnabled ? 'disable' : 'enable'}`}
                          onClick={() => toggleStatus(activity.id, activity.isEnabled)}
                        >
                          {activity.isEnabled ? '⏸️ 停用' : '▶️ 啟用'}
                        </button>
                        <button
                          className="action-btn action-btn-delete"
                          onClick={() => deleteActivity(activity.id, activity.title)}
                        >
                          🗑️ 刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > 20 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← 上一頁
            </button>
            <div className="pagination-info">
              第 {page} 頁，共 {Math.ceil(total / 20)} 頁 • 總計 {total} 個活動
            </div>
            <button
              className="pagination-btn"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / 20)}
            >
              下一頁 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}