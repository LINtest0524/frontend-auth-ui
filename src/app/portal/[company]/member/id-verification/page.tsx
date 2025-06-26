"use client";

import { useState, useEffect } from "react";
import axios from "axios";
const API_URL = process.env.NEXT_PUBLIC_API_BASE;

export default function IDVerificationPage() {
  const [front, setFront] = useState<File | string | null>(null);
  const [back, setBack] = useState<File | string | null>(null);
  const [selfie, setSelfie] = useState<File | string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("portalToken") : null;

  // ✅ 一進來查詢是否上傳過
  useEffect(() => {
    const fetchStatus = async () => {
      if (!token) return;

      try {
        const res = await axios.get("http://localhost:3001/api/id-verification/me", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        const data = res.data;
        if (data && data.status === "PENDING") {
          setSubmitted(true);
          setMessage("已送出審核，請耐心等待客服審核");

          setFront(data.frontImage ? `${API_URL}/uploads/identity/${data.frontImage}` : null);
          setBack(data.backImage ? `${API_URL}/uploads/identity/${data.backImage}` : null);
          setSelfie(data.selfieImage ? `${API_URL}/uploads/identity/${data.selfieImage}` : null);
        }
      } catch (err) {
        console.error("❌ 查詢身份驗證狀態失敗", err);
      }
    };

    fetchStatus();
  }, [token]);

  const handleSubmit = async () => {
    if (!front || !back || !selfie) {
      alert("請選擇所有圖片");
      return;
    }

    const formData = new FormData();
    formData.append("files", front as File);
    formData.append("files", back as File);
    formData.append("files", selfie as File);

    try {
      const res = await axios.post("http://localhost:3001/api/id-verification", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      if (res.data.status === "pending") {
        setSubmitted(true);
        setMessage(res.data.message || "已送出審核，請耐心等待客服審核");
        alert(res.data.message || "上傳成功，等待審核中");
      }
    } catch (err) {
      console.error(err);
      alert("上傳失敗，請稍後再試");
    }
  };

  const renderPreview = (file: File | string | null) => {
    if (!file) return null;

    const url = typeof file === "string" ? file : URL.createObjectURL(file);
    return <img src={url} alt="preview" className="w-40 h-auto border rounded mb-2" />;
  };

  return (
    <div>
    
      <div className="p-6 max-w-xl mx-auto">
        <h1 className="text-xl font-bold mb-4">身份證驗證</h1>

        {message && <div className="text-green-600 font-semibold mb-6">{message}</div>}

        <div className="mb-4">
          <label className="block mb-1 font-medium">正面</label>
          {renderPreview(front)}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFront(e.target.files?.[0] ?? null)}
            disabled={submitted}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">反面</label>
          {renderPreview(back)}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setBack(e.target.files?.[0] ?? null)}
            disabled={submitted}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">手持身分證</label>
          {renderPreview(selfie)}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSelfie(e.target.files?.[0] ?? null)}
            disabled={submitted}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitted}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          送出審核
        </button>
      </div>
    </div>
  );
}
