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
    <div className="b-ibox">

      <h1>編輯管理員</h1>

      <div className="b-ibox-s">

        <div className="b-form-group-1 w100 fl4">
          <label>Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div className="b-form-group-1 w100 fl4">
          <label>狀態</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w100"
          >
            <option value="ACTIVE">啟用</option>
            <option value="INACTIVE">停用</option>
            <option value="BANNED">封鎖</option>
          </select>
        </div>

        {canEditRole && (
          <div className="b-form-group-1 w100 fl4">
            <label>角色</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w100"
            >
              <option value="SUPER_ADMIN">超級管理員</option>
              <option value="GLOBAL_ADMIN">全域管理員</option>
              <option value="AGENT_OWNER">代理商老闆</option>
              <option value="AGENT_SUPPORT">客服</option>
            </select>
          </div>
        )}

        {error && <p>{error}</p>}

        <div className="fl4 w100 b-btnbox">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="b-btn-s2 b-btn-c4 mr20"
          >
            保存內容
          </button>
          <button
            onClick={() => router.back()}
            className="b-btn-s2 b-btn-c1"
          >
            返回
          </button>
        </div>
      </div>
    </div>
  );
}
