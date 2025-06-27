"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_BASE;

type StatusType = "PENDING" | "APPROVED" | "REJECTED" | null;

export default function IDVerificationPage() {
  const [front, setFront] = useState<File | string | null>(null);
  const [back, setBack] = useState<File | string | null>(null);
  const [selfie, setSelfie] = useState<File | string | null>(null);

  const frontRef = useRef<HTMLInputElement | null>(null);
  const backRef = useRef<HTMLInputElement | null>(null);
  const selfieRef = useRef<HTMLInputElement | null>(null);

  const [status, setStatus] = useState<StatusType>(null);
  const [note, setNote] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [previewKey, setPreviewKey] = useState(0); // 🔑 用來強制刷新圖片

  const token =
    typeof window !== "undefined" ? localStorage.getItem("portalToken") : null;

  useEffect(() => {
    const fetchStatus = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${API_URL}/api/id-verification/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;
        if (data) {
          setStatus(data.status);
          setNote(data.note ?? null);
          setFront(
            data.frontImage ? `${API_URL}/uploads/identity/${data.frontImage}` : null
          );
          setBack(
            data.backImage ? `${API_URL}/uploads/identity/${data.backImage}` : null
          );
          setSelfie(
            data.selfieImage ? `${API_URL}/uploads/identity/${data.selfieImage}` : null
          );
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
      const res = await axios.post(`${API_URL}/api/id-verification`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}` },
      });

      if (res.data.status === "PENDING") {
        setStatus("PENDING");
        setMessage(res.data.message || "已送出審核，請耐心等待客服審核");
        alert(res.data.message || "上傳成功，等待審核中");
      }
    } catch (err) {
      console.error("❌ 上傳失敗", err);
      alert("上傳失敗，請稍後再試");
    }
  };

  const handleReset = async () => {
    try {
      await axios.delete(`${API_URL}/api/id-verification`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFront(null);
      setBack(null);
      setSelfie(null);
      setStatus(null);
      setNote(null);
      setMessage("");
      setPreviewKey(prev => prev + 1); // ✅ 刷新圖片用

      if (frontRef.current) frontRef.current.value = "";
      if (backRef.current) backRef.current.value = "";
      if (selfieRef.current) selfieRef.current.value = "";

      alert("資料已清除，請重新上傳");
    } catch (err) {
      console.error("❌ 清除失敗", err);
      alert("清除失敗，請稍後再試");
    }
  };

  const renderPreview = (file: File | string | null) => {
    if (!file) return null;

    const url = typeof file === "string" ? file : URL.createObjectURL(file);

    return (
      <img
        key={`${previewKey}-${url}`} // ✅ 強制圖片重新載入
        src={url}
        alt="preview"
        className="w-40 h-auto border rounded mb-2"
      />
    );
  };

  const isDisabled = status === "PENDING" || status === "APPROVED";

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">身份證驗證</h1>

      {status === "PENDING" && (
        <p className="text-blue-600 font-semibold mb-4">已送出審核，請耐心等待客服審核</p>
      )}
      {status === "APPROVED" && (
        <p className="text-green-600 font-semibold mb-4">✅ 已通過身份驗證</p>
      )}
      {status === "REJECTED" && (
        <div className="mb-4">
          <p className="text-red-600 font-semibold">
            ❌ 驗證未通過：{note || "資料有誤，請重新上傳"}
          </p>
          <button
            onClick={handleReset}
            className="mt-2 bg-blue-500 text-white px-3 py-1 rounded"
          >
            重新驗證
          </button>
        </div>
      )}

      {status !== "REJECTED" && (
  <>
    {/* 正面 */}
    <div className="mb-4">
      <label className="block mb-1 font-medium">正面</label>
      {renderPreview(front)}
      {!isDisabled && (
        <input
          ref={frontRef}
          type="file"
          accept="image/*"
          onChange={(e) => setFront(e.target.files?.[0] ?? null)}
        />
      )}
    </div>

    {/* 反面 */}
    <div className="mb-4">
      <label className="block mb-1 font-medium">反面</label>
      {renderPreview(back)}
      {!isDisabled && (
        <input
          ref={backRef}
          type="file"
          accept="image/*"
          onChange={(e) => setBack(e.target.files?.[0] ?? null)}
        />
      )}
    </div>

    {/* 手持 */}
    <div className="mb-4">
      <label className="block mb-1 font-medium">手持身分證</label>
      {renderPreview(selfie)}
      {!isDisabled && (
        <input
          ref={selfieRef}
          type="file"
          accept="image/*"
          onChange={(e) => setSelfie(e.target.files?.[0] ?? null)}
        />
      )}
    </div>

    {/* 送出按鈕 */}
    {!isDisabled && (
      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        送出審核
      </button>
    )}
  </>
)}
    </div>
  );
}
