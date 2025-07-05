"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MarqueeCreatePage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const userJson =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const companyId = userJson ? JSON.parse(userJson)?.company?.id : null;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert("請輸入標題");
    if (!companyId) return alert("找不到公司 ID，請重新登入");
    if (!token) return alert("未登入或 token 遺失，請重新登入");

    try {
      setLoading(true);

      const res = await fetch(`${apiBase}/admin/marquee`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
          link,
          isActive,
          companyId,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`伺服器錯誤：${res.status} - ${errText}`);
      }

      alert("新增成功！");
      router.push("/admin/marquee");
    } catch (err: any) {
      alert("新增失敗：" + err.message);
      console.error("新增失敗", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-bold mb-4">➕ 新增跑馬燈內容</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">標題 *</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1">內容</label>
          <textarea
            className="w-full border px-3 py-2 rounded"
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">連結網址</label>
          <input
            type="url"
            className="w-full border px-3 py-2 rounded"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            id="active"
          />
          <label htmlFor="active">啟用</label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "儲存中..." : "儲存"}
        </button>
      </form>
    </div>
  );
}
