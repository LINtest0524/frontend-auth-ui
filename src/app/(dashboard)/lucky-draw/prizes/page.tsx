// frontend/src/app/(dashboard)/lucky-draw/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
    <div className="b-ibox">
      <h1>轉盤獎項列表</h1>

      <div className="b-ibox-s">

      <div className="fl4 w100 mb15">
        <div className="mr10">
          <label className="mr-2">選擇活動：</label>
          <select 
            value={selectedEventId || ""} 
            onChange={(e) => setSelectedEventId(e.target.value ? Number(e.target.value) : null)}
            className="b-input"
          >
            <option value="">請選擇活動</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {event.name} {event.isActive ? '(啟用中)' : ''}
              </option>
            ))}
          </select>
        </div>
        <button 
          onClick={() => router.push(`/lucky-draw/new?eventId=${selectedEventId}`)}
          className="b-btn-s2 b-btn-c4"
          disabled={!selectedEventId}
        >
          新增獎品
        </button>
      
      </div>



      

      {loading && <p>載入中...</p>}
      

      {!loading && (
        <table className="prizes b-table-box admin-table mb15">
          <thead>
            <tr>
              <th>名稱</th>
              <th>圖片</th>
              <th>數量</th>
              <th>機率 (%)</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>

                {Array.isArray(prizes) && prizes.map((prize) => (
                <tr key={prize.id} className="text-center">
                    <td>{prize.name}</td>
                    <td className="b-td-center">
                      {(() => {
                        const imagePath = prize.imageUrl || prize.image_url;
                        
                        if (imagePath && imagePath.trim()) {
                          const fullImageUrl = `http://localhost:3001${imagePath}`;
                          
                          return (
                            <div className="fo5p">
                              <img
                                src={fullImageUrl}
                                alt={prize.name}
                                height={40}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                           
                              <button onClick={() => setPreviewImage(fullImageUrl)}
                              >
                                 預覽
                              </button>
                            </div>
                          );
                        } else {
                          return <span className="text-gray-400">無圖</span>;
                        }
                      })()}
                    </td>


                    <td>{prize.quantity}</td>
                    <td>{prize.probability}</td>
                
                <td>
                  <div className="fl4">
                    <button 
                      onClick={() => router.push(`/lucky-draw/edit/${prize.id}`)}
                      className="b-btn-s3 b-btn-c1 mr10"
                    >
                      編輯
                    </button>
                    <button 
                      onClick={() => handleDelete(prize.id, prize.name)}
                      className="b-btn-s3 b-btn-c3"
                    >
                      刪除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {previewImage && (
        <div className="b-lightbox-1">
          <h2 className="mb15">圖片預覽</h2>
          <div className="b-id-imgbox mb25">
            <Image 
              src={previewImage} 
              alt="預覽圖片" 
              width={800}
              height={600}
              className="b-id-img" 
            />
          </div>
          <button onClick={() => setPreviewImage(null)} className="b-id-imgbox-X">X</button>
        </div>
      )}

      </div>
    </div>
  );
}
