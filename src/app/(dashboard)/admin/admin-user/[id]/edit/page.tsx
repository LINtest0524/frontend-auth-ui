"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUserStore } from "@/hooks/use-user-store";

export default function AdminUserEditPage() {
  const router = useRouter();
  const { id } = useParams();
  const currentUser = useUserStore((state) => state.user);

  const [form, setForm] = useState({
    email: "",
    status: "ACTIVE",
    role: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3001/user/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("讀取使用者資料失敗");

      const data = await res.json();
      setForm({
        email: data.email || "",
        status: data.status || "ACTIVE",
        role: data.role || "",
      });
    } catch (err: any) {
      setError(err.message || "讀取錯誤");
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3001/user/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("更新失敗");
      router.push("/admin/admin-user");
    } catch (err: any) {
      setError(err.message || "發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  const canEditRole = currentUser?.role === "SUPER_ADMIN";

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">✏️ 編輯管理員</h1>

      <div className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">狀態</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="ACTIVE">啟用</option>
            <option value="INACTIVE">停用</option>
            <option value="BANNED">封鎖</option>
          </select>
        </div>

        {canEditRole && (
          <div>
            <label className="block font-medium mb-1">角色</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="SUPER_ADMIN">超級管理員</option>
              <option value="GLOBAL_ADMIN">全域管理員</option>
              <option value="AGENT_OWNER">代理商老闆</option>
              <option value="AGENT_SUPPORT">客服</option>
            </select>
          </div>
        )}

        {error && <p className="text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            儲存
          </button>
          <button
            onClick={() => router.back()}
            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
          >
            返回
          </button>
        </div>
      </div>
    </div>
  );
}
