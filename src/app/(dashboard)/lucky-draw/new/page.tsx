"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = 'http://localhost:3001'
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function LuckyDrawCreatePage() {
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [probability, setProbability] = useState(0);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState("");

  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const userJson = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const companyId = userJson ? JSON.parse(userJson)?.company?.id : null;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const handleUpload = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${API_BASE}/lucky-prize/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    })
    const data = await res.json()
    return data.url
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("請輸入獎品名稱");
    if (!image) return alert("請選擇獎品圖片");
    if (!companyId) return alert("找不到公司 ID，請重新登入");
    if (!token) return alert("未登入或 token 遺失，請重新登入");

    try {
      setLoading(true);

      // 先上傳圖片
      const imageUrl = await handleUpload(image);

      // 取得選擇的活動ID
      const urlParams = new URLSearchParams(window.location.search);
      const eventId = urlParams.get('eventId');
      
      if (!eventId) {
        alert('請先選擇活動再新增獎品');
        return;
      }

      const res = await fetch("http://localhost:3001/lucky-prize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          imageUrl,
          quantity: Number(quantity),
          probability: Number(probability),
          companyId,
          eventId: parseInt(eventId), // 關聯到活動
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`伺服器錯誤：${res.status} - ${errText}`);
      }

      alert("新增成功！");
      router.push("/lucky-draw/prizes");
    } catch (err: any) {
      alert("新增失敗：" + err.message);
      console.error("新增失敗", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="b-ibox">
      <h1>新增獎品</h1>

      <div className="b-ibox-s">
        <form onSubmit={handleSubmit} className="w100">
          
          <div className="b-form-group-1 w100 fl4">
            <label>獎品名稱</label>
            <input
              type="text"
              className="w70"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="b-form-group-2 w50 fl4 mb10">
            <label htmlFor="prize-img">獎品圖片</label>
            <input
              type="file"
              id="prize-img"
              className="pt3 w70"
              ref={imageInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={e => {
                const file = e.target.files?.[0] || null
                if (file && !ACCEPTED_TYPES.includes(file.type)) {
                  alert('只接受 JPG / PNG / WEBP 圖片')
                  return
                }
                setImage(file)
                setPreview(file ? URL.createObjectURL(file) : '')
              }}
              required
            />
          </div>

          <div className="b-form-group-2 w50 fl4 mb25 ml132">
            {preview && (
              <img
                src={preview}
                alt="獎品預覽"
                className="b-banner-img"
              />
            )}
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>數量</label>
            <input
              type="number"
              className="w70"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min="1"
              required
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>中獎機率 (%)</label>
            <input
              type="number"
              className="w70"
              value={probability}
              onChange={(e) => setProbability(Number(e.target.value))}
              min="0"
              max="100"
              step="0.01"
              required
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
              onClick={() => router.push("/lucky-draw/prizes")}
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