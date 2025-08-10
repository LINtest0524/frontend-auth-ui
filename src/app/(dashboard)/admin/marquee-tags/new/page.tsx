"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MarqueeTagCreatePage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;

  const [name, setName] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#FF4444");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const userJson =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const companyId = userJson ? JSON.parse(userJson)?.company?.id : null;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("請輸入標籤名稱");
    if (!companyId) return alert("找不到公司 ID，請重新登入");
    if (!token) return alert("未登入或 token 遺失，請重新登入");

    try {
      setLoading(true);

      const res = await fetch(`${apiBase}/admin/marquee-tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          backgroundColor,
          textColor,
          isActive,
          companyId,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`伺服器錯誤：${res.status} - ${errText}`);
      }

      alert("新增成功！");
      router.push("/admin/marquee-tags");
    } catch (err: any) {
      alert("新增失敗：" + err.message);
      console.error("新增失敗", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="b-ibox">
      <h1>新增跑馬燈標籤</h1>

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
              {loading ? "儲存中..." : "儲存送出"}
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