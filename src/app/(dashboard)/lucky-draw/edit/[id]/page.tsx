"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

const API_BASE = 'http://localhost:3001'
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function LuckyDrawEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [probability, setProbability] = useState(0);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState("");

  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const userJson = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const companyId = userJson ? JSON.parse(userJson)?.company?.id : null;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // 載入現有獎品資料
  useEffect(() => {
    const fetchPrize = async () => {
      try {
        const res = await fetch(`${API_BASE}/lucky-prize/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const prize = await res.json();
        
        setName(prize.name);
        setQuantity(prize.quantity);
        setProbability(prize.probability);
        setCurrentImageUrl(prize.imageUrl);
      } catch (err) {
        console.error("載入獎品失敗", err);
        alert("載入獎品失敗");
      }
    };

    if (id && token) {
      fetchPrize();
    }
  }, [id, token]);

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
    if (!token) return alert("未登入或 token 遺失，請重新登入");

    try {
      setLoading(true);

      let imageUrl = currentImageUrl;
      
      // 如果有選擇新圖片，先上傳
      if (image) {
        imageUrl = await handleUpload(image);
      }

      const res = await fetch(`${API_BASE}/lucky-prize/${id}`, {
        method: "PUT",
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
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`伺服器錯誤：${res.status} - ${errText}`);
      }

      alert("更新成功！");
      router.push("/lucky-draw");
    } catch (err: any) {
      alert("更新失敗：" + err.message);
      console.error("更新失敗", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="b-ibox">
      <h1>編輯獎品</h1>

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
            />
            <small className="text-gray-500">不選擇檔案則保持原圖片</small>
          </div>

          <div className="b-form-group-2 w50 fl4 mb25 ml132">
            {preview ? (
              <img
                src={preview}
                alt="新圖片預覽"
                className="b-banner-img"
              />
            ) : currentImageUrl ? (
              <img
                src={`${API_BASE}${currentImageUrl}`}
                alt="目前圖片"
                className="b-banner-img"
              />
            ) : null}
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
              {loading ? "更新中..." : "更新獎品"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/lucky-draw")}
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