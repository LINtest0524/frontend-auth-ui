"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";

type MarqueeItem = {
  id: number;
  title: string;
  content: string;
  link?: string;
  isActive: boolean;
  createdAt: string;
};

export default function MarqueeListPage() {
  const [items, setItems] = useState<MarqueeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apiBase = process.env.NEXT_PUBLIC_API_BASE;

  const userJson =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const companyId = userJson ? JSON.parse(userJson)?.company?.id : null;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchData = async () => {
    if (!token) {
      setError("未登入或 token 遺失，請重新登入");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/admin/marquee`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError("資料載入失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("確定要刪除這筆跑馬燈嗎？")) return;
    if (!token) {
      alert("無法取得 token，請重新登入");
      return;
    }

    await fetch(`${apiBase}/admin/marquee/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">📋 跑馬燈列表</h1>
        <Link
          href="/admin/marquee/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          ➕ 新增內容
        </Link>
      </div>

      {loading ? (
        <p>載入中...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <table className="w-full table-auto border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2">標題（後台參考用）</th>
              <th className="border px-3 py-2">內容（實際顯示）</th>
              <th className="border px-3 py-2">連結</th>
              <th className="border px-3 py-2">啟用</th>
              <th className="border px-3 py-2">建立時間</th>
              <th className="border px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="text-center">
                <td className="border px-3 py-2">{item.title || "-"}</td>
                <td className="border px-3 py-2">{item.content || "-"}</td>
                <td className="border px-3 py-2">
                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      className="text-blue-500 underline"
                    >
                      查看
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="border px-3 py-2">
                  {item.isActive ? "✅" : "❌"}
                </td>
                <td className="border px-3 py-2">
                  {format(new Date(item.createdAt), "yyyy-MM-dd HH:mm")}
                </td>
                <td className="border px-3 py-2">
                  <Link
                    href={`/admin/marquee/${item.id}/edit`}
                    className="text-blue-600 hover:underline mr-3"
                  >
                    編輯
                  </Link>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:underline"
                  >
                    刪除
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="border px-3 py-4 text-center text-gray-500">
                  尚無資料
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
