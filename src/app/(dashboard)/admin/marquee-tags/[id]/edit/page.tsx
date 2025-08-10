"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditMarqueeTagPage() {
  const { id } = useParams();
  const router = useRouter();

  const [name, setName] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#FF4444");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchData = async () => {
    if (!token) {
      setError("未登入或 token 遺失，請重新登入");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/admin/marquee-tags/item/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setName(data.name || "");
      setBackgroundColor(data.backgroundColor || "#FF4444");
      setTextColor(data.textColor || "#FFFFFF");
      setIsActive(data.isActive);
    } catch (err: any) {
      setError("資料載入失敗");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!token) {
      setError("未登入或 token 遺失，請重新登入");
      return;
    }

    try {
      const res = await fetch(`${apiBase}/admin/marquee-tags/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, backgroundColor, textColor, isActive }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      router.push("/admin/marquee-tags");
    } catch (err) {
      setError("儲存失敗");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  return (
    <div className="b-ibox">
      <h1>編輯跑馬燈標籤</h1>

      {error && <p className="text-red-600 mb-2">{error}</p>}

      <div className="b-ibox-s">
        <form onSubmit={handleSubmit} className="w100">
          <div className="b-form-group-1 w100 fl4">
            <label>標籤名稱</label>
            <input
              type="text"
              className="w70"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>背景顏色</label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                style={{ width: "50px", height: "40px" }}
              />
              <input
                type="text"
                className="w30"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
              />
            </div>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>文字顏色</label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                style={{ width: "50px", height: "40px" }}
              />
              <input
                type="text"
                className="w30"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
              />
            </div>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>預覽</label>
            <span
              style={{
                backgroundColor: backgroundColor,
                color: textColor,
                padding: "8px 16px",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "bold",
                display: "inline-block"
              }}
            >
              {name || "標籤預覽"}
            </span>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label htmlFor="active">啟用</label>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
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
              儲存修改
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/marquee-tags")}
              className="b-btn-s2 b-btn-c1"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}