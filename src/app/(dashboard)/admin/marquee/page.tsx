"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

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
    <div className="b-ibox">
   
      <h1>跑馬燈列表</h1>

      <div className="b-ibox-s">

      
        <button onClick={() => router.push("/admin/marquee/new")} className="b-btn-s2 b-btn-c4 mb25">
            新增跑馬燈
        </button>
    

      {loading ? (
        <p>載入中...</p>
      ) : error ? (
        <p className="ps-err mb15">{error}</p>
      ) : (
        <table className="b-table-box admin-table mb15">
          <thead>
            <tr>
              <th>標題（後台參考用）</th>
              <th>內容（實際顯示）</th>
              <th>連結</th>
              <th>啟用</th>
              <th>建立時間</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.title || "-"}</td>
                <td>{item.content || "-"}</td>
                <td>
                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      className="b-btn-s3 b-btn-c2 mlr10"
                    >
                      查看
                    </a>
                  ) : (
                    "-"
                  )}
                </td>

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
                  <button onClick={() => router.push(`/admin/marquee/${item.id}/edit`)} className="b-btn-s3 b-btn-c1 mlr10">
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
