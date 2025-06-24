"use client";

import { useState } from "react";
import axios from "axios";

export default function IDVerificationPage() {
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!front || !back || !selfie) {
      alert("請選擇所有圖片");
      return;
    }

    const token = localStorage.getItem("portalToken");
    if (!token) {
      alert("尚未登入，請先登入再上傳");
      return;
    }

    const formData = new FormData();
    formData.append("files", front);
    formData.append("files", back);
    formData.append("files", selfie);

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
        alert(res.data.message); // 彈窗
        }
    } catch (err) {
      console.error(err);
      alert("上傳失敗，請稍後再試");
    }
  };

  const renderPreview = (file: File | null) => {
    return file ? (
      <img
        src={URL.createObjectURL(file)}
        alt="preview"
        className="w-40 h-auto border rounded mb-2"
        onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
      />
    ) : null;
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">身份證驗證</h1>

      {submitted ? (
        <div className="text-green-600 font-semibold mb-6">{message}</div>
      ) : (
        <>
          {[
            { label: "正面", file: front, setter: setFront },
            { label: "反面", file: back, setter: setBack },
            { label: "手持身分證", file: selfie, setter: setSelfie },
          ].map((item, index) => (
            <div className="mb-4" key={index}>
              <label className="block mb-1 font-medium">{item.label}</label>
              {renderPreview(item.file)}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => item.setter(e.target.files?.[0] ?? null)}
                disabled={submitted}
              />
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={submitted}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            送出審核
          </button>
        </>
      )}
    </div>
  );
}
