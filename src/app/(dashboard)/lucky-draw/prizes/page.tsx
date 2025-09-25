// frontend/src/app/(dashboard)/lucky-draw/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import '@/styles/pages/lucky-draw-prizes.css';

interface Prize {
  id: number;
  name: string;
  imageUrl: string;
  image_url?: string; // 添加可選的 image_url 欄位
  quantity: number;
  probability: number;
}

export default function LuckyDrawPrizesPage() {
  const router = useRouter();
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const companyId = user?.companyId;

      const res = await fetch(`http://localhost:3001/lucky-draw-events?companyId=${companyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();

      if (Array.isArray(result)) {
        setEvents(result);
        // 預設選擇啟用的活動
        const activeEvent = result.find(e => e.isActive);
        if (activeEvent) {
          setSelectedEventId(activeEvent.id);
        }
      }
    } catch (err) {
      console.error("活動載入失敗", err);
    }
  };

  const fetchPrizes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const url = selectedEventId 
        ? `http://localhost:3001/lucky-prize?eventId=${selectedEventId}`
        : "http://localhost:3001/lucky-prize";
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();

      if (Array.isArray(result)) {
        setPrizes(result);
      } else if (Array.isArray(result.data)) {
        setPrizes(result.data);
      } else {
        setPrizes([]);
      }
    } catch (err) {
      console.error("獎項載入失敗", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    const confirmed = window.confirm(`確定要刪除獎品「${name}」嗎？`);
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3001/lucky-prize/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("刪除失敗");

      alert("刪除成功！");
      fetchPrizes(); // 重新載入列表
    } catch (err: any) {
      alert("刪除失敗：" + err.message);
      console.error("刪除失敗", err);
    }
  };


  useEffect(() => {
    fetchEvents();
    
    // 檢查 URL 參數中是否有 eventId
    const urlParams = new URLSearchParams(window.location.search);
    const eventIdFromUrl = urlParams.get('eventId');
    if (eventIdFromUrl) {
      setSelectedEventId(parseInt(eventIdFromUrl));
    }
  }, []);

  useEffect(() => {
    if (selectedEventId !== null) {
      fetchPrizes();
    }
  }, [selectedEventId]);

  return (
    <div className="lucky-draw-prizes-container">
      {/* 頁面標題區域 */}
      <div className="lucky-draw-prizes-header">
        <h1>🎁 抽獎獎品管理</h1>
        <div className="lucky-draw-prizes-header-actions">
          <button 
            onClick={() => router.push(`/lucky-draw/new?eventId=${selectedEventId}`)}
            className="btn-primary"
            disabled={!selectedEventId}
          >
            <span>✨</span>
            新增獎品
          </button>
        </div>
      </div>

      {/* 篩選控制區域 */}
      <div className="filter-section">
        <div className="filter-card">
          <div className="filter-header">
            <span className="filter-icon">🎯</span>
            <h3>選擇活動</h3>
          </div>
          <div className="filter-content">
            <select 
              value={selectedEventId || ""} 
              onChange={(e) => setSelectedEventId(e.target.value ? Number(e.target.value) : null)}
              className="modern-select"
            >
              <option value="">請選擇活動</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name} {event.isActive ? '(啟用中)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 內容區域 */}
      <div className="content-section">
        {/* 表格控制區域 */}
        <div className="table-controls">
          <div className="table-info">
            {selectedEventId ? `共 ${prizes.length} 個獎品` : '請先選擇活動'}
          </div>
          {selectedEventId && (
            <div className="table-actions">
              <span className="selected-event">
                🎯 {events.find(e => e.id === selectedEventId)?.name}
              </span>
            </div>
          )}
        </div>

        {/* 載入狀態 */}
        {loading && (
          <div className="loading-spinner">
            <div>⏳ 載入中...</div>
          </div>
        )}

        {/* 現代化表格 */}
        {!loading && selectedEventId && (
          <table className="modern-table">
            <thead>
              <tr>
                <th>🎁 獎品資訊</th>
                <th>🖼️ 獎品圖片</th>
                <th>📦 數量</th>
                <th>🎲 中獎機率</th>
                <th>⚙️ 操作</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(prizes) && prizes.map((prize) => (
                <tr key={prize.id}>
                  <td>
                    <div className="prize-info">
                      <div className="prize-name">{prize.name}</div>
                      <div className="prize-id">ID: #{prize.id}</div>
                    </div>
                  </td>
                  <td>
                    <div className="image-cell">
                      {(() => {
                        const imagePath = prize.imageUrl || prize.image_url;
                        
                        if (imagePath && imagePath.trim()) {
                          const fullImageUrl = `http://localhost:3001${imagePath}`;
                          
                          return (
                            <div className="image-preview-container">
                              <img
                                src={fullImageUrl}
                                alt={prize.name}
                                className="prize-thumbnail"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <button 
                                onClick={() => setPreviewImage(fullImageUrl)}
                                className="image-preview-btn"
                              >
                                <span>🔍</span>
                                預覽
                              </button>
                            </div>
                          );
                        } else {
                          return (
                            <div className="no-image">
                              <span>📷</span>
                              <span>無圖片</span>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </td>
                  <td>
                    <div className="quantity-cell">
                      <span className="quantity-badge">
                        📦 {prize.quantity} 個
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="probability-cell">
                      <span className="probability-badge">
                        🎲 {prize.probability}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => router.push(`/lucky-draw/edit/${prize.id}`)}
                        className="btn-edit"
                      >
                        <span>✏️</span>
                        編輯
                      </button>
                      <button 
                        onClick={() => handleDelete(prize.id, prize.name)}
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
        
        {/* 無活動選擇提示 */}
        {!loading && !selectedEventId && (
          <div className="no-selection">
            <div className="no-selection-icon">🎯</div>
            <h3>請選擇活動</h3>
            <p>請先在上方選擇一個活動，才能查看和管理該活動的獎品</p>
          </div>
        )}

        {/* 無資料顯示 */}
        {!loading && selectedEventId && prizes.length === 0 && (
          <div className="no-data">
            <img src="/no-information.webp" alt="無資料" />
            <p>此活動目前沒有獎品</p>
            <button 
              onClick={() => router.push(`/lucky-draw/new?eventId=${selectedEventId}`)}
              className="btn-primary"
              style={{ marginTop: '16px' }}
            >
              <span>✨</span>
              立即新增獎品
            </button>
          </div>
        )}
      </div>

      {/* 圖片預覽彈窗 */}
      {previewImage && (
        <div className="image-preview-modal" onClick={() => setPreviewImage(null)}>
          <div className="image-preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="image-preview-header">
              <h2 className="image-preview-title">🖼️ 獎品圖片預覽</h2>
              <button 
                onClick={() => setPreviewImage(null)} 
                className="image-preview-close"
              >
                ✕
              </button>
            </div>
            <Image 
              src={previewImage} 
              alt="預覽圖片" 
              width={800} 
              height={600} 
              className="image-preview-img" 
            />
          </div>
        </div>
      )}
    </div>
  );
}
