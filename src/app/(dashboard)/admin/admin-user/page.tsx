// frontend/src/app/(dashboard)/admin/admin-user/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/hooks/use-user-store";
import { useRouter } from "next/navigation";
import { User } from "@/types/user";

const roleMap: Record<string, string> = {
  SUPER_ADMIN: "超級管理員",
  GLOBAL_ADMIN: "全域管理員",
  AGENT_OWNER: "代理商老闆",
  AGENT_SUPPORT: "客服",
  USER: "會員",
};

const statusMap: Record<string, string> = {
  ACTIVE: "啟用",
  INACTIVE: "停用",
  BANNED: "封鎖",
};



export default function AdminUserListPage() {
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const currentUser = useUserStore((state) => state.user);

  const setUser = useUserStore((state) => state.setUser);

  const router = useRouter();

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      const params = new URLSearchParams();
      if (username) params.append("username", username);
      params.append("limit", limit.toString());
      params.append("page", page.toString());

      params.append("excludeUserRole", "true");
      

      const res = await fetch(`http://localhost:3001/user?${params.toString()}`, {

        headers: { Authorization: `Bearer ${token}` },


      });
      const result = await res.json();

      setAdminUsers(result.data);


      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const rawUser = localStorage.getItem("user");
    if (token && rawUser) {
      const parsed = JSON.parse(rawUser);
      setUser(parsed); 
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchAdmins();
    }
  }, [page, limit, currentUser]);



  const handleSearch = () => {
    setPage(1);
    fetchAdmins();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("確定要刪除這個管理員？")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:3001/user/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("刪除失敗");
      fetchAdmins();
    } catch (err) {
      alert("刪除失敗");
    }
  };

  const canSeeActions =
  currentUser?.role !== undefined &&
  ["SUPER_ADMIN", "GLOBAL_ADMIN", "AGENT_OWNER"].includes(currentUser.role);



  const canModify = currentUser?.role === "AGENT_OWNER" || currentUser?.role === "SUPER_ADMIN";


  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">🛡️ 管理員列表</h1>

      {canModify && (
        <div className="mb-4 text-right">
          <button
            onClick={() => router.push("/admin/admin-user/new")}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            ➕ 新增管理員
          </button>
        </div>
      )}

      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="帳號"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          查詢
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <label>每頁顯示筆數：</label>
        <input
          type="number"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="border rounded px-2 py-1 w-20"
        />
      </div>

      {loading ? (
        <p>載入中...</p>
      ) : (
        <table className="w-full border-collapse border text-sm">
          <thead>
            <tr className="bg-gray-200 text-center">
              <th className="border p-2">ID</th>
              <th className="border p-2">帳號</th>
              <th className="border p-2">角色</th>
              <th className="border p-2">狀態</th>
              <th className="border p-2">上次登入時間</th>
              <th className="border p-2">上次登入IP</th>
              <th className="border p-2">創建人</th>
              {canSeeActions && <th className="border p-2">操作</th>}
            </tr>
          </thead>
          <tbody>
            {adminUsers.map((admin) => (
              <tr key={admin.id} className="text-center">
                <td className="border p-2">{admin.id}</td>
                <td className="border p-2">{admin.username}</td>
                <td className="border p-2">{roleMap[admin.role || ""] ?? admin.role ?? "-"}</td>
                <td className="border p-2">{statusMap[admin.status]}</td>
                <td className="border p-2">{admin.last_login_at ? new Date(admin.last_login_at).toLocaleString() : "-"}</td>
                <td className="border p-2">{admin.last_login_ip || "-"}</td>

                <td className="border p-2">{admin.created_by?.username || "-"}</td>

                {canSeeActions && (
                  <td className="border p-2">
                    {canModify ? (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => router.push(`/admin/admin-user/${admin.id}/edit`)}
                          className="text-blue-600 hover:underline"
                        >編輯</button>
                        <button
                          onClick={() => router.push(`/admin/admin-user/${admin.id}/reset-password`)}
                          className="text-yellow-600 hover:underline"
                        >重設密碼</button>
                        <button
                          onClick={() => handleDelete(admin.id)}
                          className="text-red-600 hover:underline"
                        >刪除</button>
                      </div>
                    ) : (
                      <span className="text-gray-400">僅限代理商與超級管理員</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="mt-4 flex justify-center items-center gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 rounded border disabled:opacity-50"
        >
          上一頁
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`px-3 py-1 rounded border ${
              page === p ? "bg-blue-600 text-white" : "hover:bg-gray-200"
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-3 py-1 rounded border disabled:opacity-50"
        >
          下一頁
        </button>

        <p className="text-sm text-gray-500">
          目前第 {page} 頁，共 {totalPages} 頁（共 {totalCount} 筆資料）
        </p>
      </div>
    </div>
  );
}