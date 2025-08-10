"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

type MarqueeTag = {
  id: number;
  name: string;
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
  createdAt: string;
};

export default function MarqueeTagListPage() {
  const [items, setItems] = useState<MarqueeTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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
      const res = await fetch(`${apiBase}/admin/marquee-tags`, {
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
    if (!confirm("確定要刪除這個標籤嗎？")) return;
    if (!token) {
      alert("無法取得 token，請重新登入");
      return;
    }

    await fetch(`${apiBase}/admin/marquee-tags/${id}`, {
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
    <div className="b-ibox">
      <h1>跑馬燈標籤管理</h1>

      <div className="b-ibox-s">
        <button onClick={() => router.push("/admin/marquee-tags/new")} className="b-btn-s2 b-btn-c4 mb25">
          新增標籤
        </button>

        {loading ? (
          <p>載入中...</p>
        ) : error ? (
          <p className="ps-err mb15">{error}</p>
        ) : (
          <table className="b-table-box admin-table mb15">
            <thead>
              <tr>
                <th>標籤名稱</th>
                <th>預覽</th>
                <th>背景顏色</th>
                <th>啟用</th>
                <th>建立時間</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>
                    <span
                      style={{
                        backgroundColor: item.backgroundColor,
                        color: item.textColor,
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                    >
                      {item.name}
                    </span>
                  </td>
                  <td>{item.backgroundColor}</td>
                  <td>
                    <span
                      className={`${
                        item.isActive ? "b-btn-s3 b-btn-c4 w50px" : "b-btn-s3 b-btn-c3 w50px"
                      }`}
                    >
                      {item.isActive ? "ON" : "OFF"}
                    </span>
                  </td>
                  <td>
                    {format(new Date(item.createdAt), "yyyy-MM-dd HH:mm")}
                  </td>
                  <td className="fl4">
                    <button onClick={() => router.push(`/admin/marquee-tags/${item.id}/edit`)} className="b-btn-s3 b-btn-c1 mlr10">
                      編輯
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="b-btn-s3 b-btn-c3 mlr10"
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
    </div>
  );
}