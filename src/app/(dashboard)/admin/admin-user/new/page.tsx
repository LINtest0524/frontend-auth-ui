// frontend/src/app/(dashboard)/admin/admin-user/new/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminUserCreatePage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [companies, setCompanies] = useState<{ id: number; name: string }[]>([]);

  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "AGENT_SUPPORT",
    companyId: undefined as number | undefined,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const rawUser = localStorage.getItem("user");
    if (token && rawUser) {
      const parsed = JSON.parse(rawUser);
      setCurrentUser(parsed);

      if (parsed.role === "SUPER_ADMIN") {
        fetch("http://localhost:3001/company", {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) {
              setCompanies(data);
            } else if (Array.isArray(data.data)) {
              setCompanies(data.data);
            } else {
              setCompanies([]); // fallback 空陣列
              console.warn("公司資料格式錯誤", data);
            }
          });

      }
    }
  }, []);

  const getAvailableRoles = () => {
    if (!currentUser) return [];
    if (currentUser.role === "SUPER_ADMIN") {
      return [
        { value: "AGENT_OWNER", label: "代理商老闆" },
        { value: "AGENT_SUPPORT", label: "客服" },
        { value: "GLOBAL_ADMIN", label: "全域管理員" },
      ];
    }
    if (currentUser.role === "AGENT_OWNER") {
      return [{ value: "AGENT_SUPPORT", label: "客服" }];
    }
    return [];
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "companyId" ? Number(value) : value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");

    const payload = {
      ...form,
      companyId:
        currentUser.role === "SUPER_ADMIN"
          ? form.companyId
          : currentUser.companyId,
    };

    try {
      const res = await fetch("http://localhost:3001/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("建立失敗");
      router.push("/admin/admin-user");
    } catch (err: any) {
      setError(err.message || "發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">➕ 新增管理員</h1>

      <div className="space-y-4">
        <div>
          <label className="block font-medium mb-1">帳號</label>
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">密碼</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">角色</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          >
            {getAvailableRoles().map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {currentUser?.role === "SUPER_ADMIN" && (
          <div>
            <label className="block font-medium mb-1">所屬公司</label>
            <select
              name="companyId"
              value={form.companyId || ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="">請選擇公司</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && <p className="text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            建立
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
