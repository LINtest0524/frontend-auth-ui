"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/hooks/use-user-store";

interface PromotionCategory {
  id: number;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PromotionCategoriesPage() {
  const [categories, setCategories] = useState<PromotionCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const currentUser = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  // 載入用戶資料
  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const parsedUser = JSON.parse(rawUser);
      setUser(parsedUser);
    }
  }, [setUser]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3001/promotion-categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("取得活動類型資料失敗");
      
      const result = await response.json();
      setCategories(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("確定要刪除這個活動類型嗎？")) return;

    setDeletingId(id);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:3001/promotion-categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error("刪除失敗");

      setTimeout(() => {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        setDeletingId(null);
        fetchCategories();
      }, 500);
    } catch (err) {
      alert("刪除失敗");
      setDeletingId(null);
    }
  };

  return (
    <div className="b-bigbox-all w100">
      <div className="b-ibox mb30">
        <h1>活動類型管理</h1>

        <div className="b-ibox-s">
          {(currentUser?.role === "SUPER_ADMIN" || 
            currentUser?.role === "GLOBAL_ADMIN" || 
            currentUser?.role === "AGENT_OWNER") && (
            <div className="w100 mb15">
              <button
                onClick={() => router.push("/admin/promotion-categories/new")}
                className="b-btn-s2 b-btn-c4"
              >
                新增活動類型
              </button>
            </div>
          )}
        </div>
      </div>

      {loading && <p>載入中...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && (
        <div className="b-ibox">
          <div className="b-ibox-s">
            <table className="b-table-box admin-table mb15">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>類型名稱</th>
                  <th>描述</th>
                  <th>排序</th>
                  <th>狀態</th>
                  <th>建立時間</th>
                  <th className="th-last">操作</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.id}</td>
                    <td>
                      <div style={{fontWeight: "500"}}>{category.name}</div>
                    </td>
                    <td>
                      {category.description && (
                        <div style={{fontSize: "12px", color: "#666"}}>
                          {category.description.length > 30 
                            ? `${category.description.substring(0, 30)}...` 
                            : category.description}
                        </div>
                      )}
                    </td>
                    <td style={{textAlign: "center"}}>{category.sortOrder}</td>
                    <td>
                      <span style={{color: category.isActive ? "#28a745" : "#dc3545"}}>
                        {category.isActive ? "啟用" : "停用"}
                      </span>
                    </td>
                    <td>{category.createdAt ? new Date(category.createdAt).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false }) : "-"}</td>
                    <td>
                      <div style={{display: "flex", gap: "8px", flexWrap: "wrap"}}>
                        {(currentUser?.role === "SUPER_ADMIN" || 
                          currentUser?.role === "GLOBAL_ADMIN" || 
                          currentUser?.role === "AGENT_OWNER") && (
                          <button
                            onClick={() => router.push(`/admin/promotion-categories/${category.id}/edit`)}
                            className="b-btn-s3 b-btn-c4"
                          >
                            編輯
                          </button>
                        )}

                        {(currentUser?.role === "SUPER_ADMIN" || 
                          currentUser?.role === "GLOBAL_ADMIN" || 
                          currentUser?.role === "AGENT_OWNER" || 
                          currentUser?.role === "AGENT_SUPPORT") && (
                          <button
                            onClick={() => handleDelete(category.id)}
                            className={`b-btn-s3 b-btn-c3 ${
                              deletingId === category.id ? "opacity-50 pointer-events-none" : ""
                            }`}
                          >
                            {deletingId === category.id ? "刪除中..." : "刪除"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!loading && categories.length === 0 && (
              <div className="b-no-information w100 fd5">
                <img src="/no-information.webp" alt="無資料" className="mb25" />
                <p>查無資料</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}