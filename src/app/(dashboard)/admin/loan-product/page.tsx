"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/hooks/use-user-store";
import { User } from "@/types/user";





export default function LoanProductListPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const currentUser = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  const [deletingId, setDeletingId] = useState<number | null>(null);



  const handleDelete = async (id: number) => {
    if (!confirm("確定要刪除這個產品嗎？")) return;

    setDeletingId(id);
    await Promise.resolve(); //   強制觸發 re-render，顯示 "刪除中..."

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:3001/admin/loan-product/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("刪除失敗");

      setTimeout(() => {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setDeletingId(null);
      }, 500);
    } catch (err) {
      alert("刪除失敗");
      setDeletingId(null);
    }
  };





  //   把 localStorage 的 user 設進 store
  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const parsedUser = JSON.parse(rawUser);
      setUser(parsedUser);
    }
  }, []);


  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("http://localhost:3001/admin/loan-product", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

      .then(async (res) => {
        if (!res.ok) throw new Error("取得產品資料失敗");
        return res.json();
      })
      .then((data) => {
        setProducts(data);
      })
      .catch((err) => {
        setError(err.message || "發生錯誤");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold mb-4">📦 產品列表</h1>

      {loading && <p>載入中...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && products.length === 0 && <p>目前尚無產品</p>}

      <table className="w-full table-auto border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-3 py-2">商戶產品ID</th>
            <th className="border px-3 py-2">所屬公司</th>
            <th className="border px-3 py-2">產品編號</th>
            <th className="border px-3 py-2">產品名稱</th>

            <th className="border px-3 py-2">首放額度</th>
            <th className="border px-3 py-2">周期 : 天</th>
            <th className="border px-3 py-2">狀態</th>
            <th className="border px-3 py-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td className="border px-3 py-2 text-center">{p.id}</td>

              <td className="border px-3 py-2">{p.company?.name || "-"}</td>


              <td className="border px-3 py-2 text-center">{p.product_code || "-"}</td>
              <td className="border px-3 py-2">{p.product_name}</td>

              <td className="border px-3 py-2 text-center">
                {p.first_amount !== undefined && p.first_amount !== null
                  ? Math.round(p.first_amount)
                  : "-"}
              </td>

              <td className="border px-3 py-2 text-center">
                {p.credit_period !== undefined && p.credit_period !== null
                  ? Math.round(p.credit_period)
                  : "-"}
              </td>

              <td className="border px-3 py-2 text-center">
                {p.status === "ACTIVE" ? "啟用" : p.status === "INACTIVE" ? "停用" : "-"}
              </td>



              <td className="border px-3 py-2">
                {/* 只有 SUPER_ADMIN 和 GLOBAL_ADMIN 才能編輯 */}
                {(currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "GLOBAL_ADMIN") && (
                  <button
                    onClick={() => router.push(`/admin/loan-product/${p.id}/edit`)}
                    className="text-blue-600 hover:underline mr-2"
                  >
                    編輯
                  </button>
                )}

                {currentUser?.role && ["SUPER_ADMIN", "GLOBAL_ADMIN", "AGENT_OWNER", "AGENT_SUPPORT"].includes(currentUser.role) && (
                  <button
                    onClick={() => router.push(`/admin/loan-product/${p.id}`)}
                    className="text-gray-600 hover:underline"
                  >
                    詳細資料
                  </button>
                )}

                {(currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "GLOBAL_ADMIN") && (
                  <button
                    onClick={() => handleDelete(p.id)}
                    className={`text-red-600 hover:underline ml-2 ${deletingId === p.id ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    {deletingId === p.id ? "刪除中..." : "刪除"}
                  </button>
                )}

              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
