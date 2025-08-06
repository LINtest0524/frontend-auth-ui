"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="b-ibox">
      <h1>新增抽獎活動</h1>

      <div className="b-ibox-s">
        <form onSubmit={handleSubmit} className="w100">
          
          <div className="b-form-group-1 w100 fl4">
            <label>活動名稱</label>
            <input
              type="text"
              className="w70"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="請輸入活動名稱"
              required
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>開始時間</label>
            <input
              type="datetime-local"
              className="w70"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              required
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>結束時間</label>
            <input
              type="datetime-local"
              className="w70"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              required
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label htmlFor="active">立即啟用</label>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              id="active"
              className="new-checkbox"
            />
          </div>

          <div className="fl4 w100 b-btnbox">
            <button
              type="submit"
              disabled={loading}
              className="b-btn-s2 b-btn-c4 mr20"
            >
              {loading ? "創建中..." : "創建活動"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/lucky-draw/events")}
              className="b-btn-s2 b-btn-c2"
            >
              取消
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}