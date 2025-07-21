// frontend\src\app\(dashboard)\users\page.tsx
"use client";

import { useEffect, useState } from "react";
import { User } from "@/types/user";

type SortKey = "id" | "created_at" | "last_login_at" | null;
type SortDirection = "asc" | "desc" | null;

const statusMap: Record<string, string> = {
  ACTIVE: "啟用",
  INACTIVE: "停用",
  BANNED: "封鎖",
};

export default function UserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("");
  const [blacklist, setBlacklist] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [loginFrom, setLoginFrom] = useState("");
  const [loginTo, setLoginTo] = useState("");

  const [exportFormat, setExportFormat] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleExport = (format: "csv" | "xlsx") => {
    const token = localStorage.getItem("token");
    const params = new URLSearchParams();
    if (username) params.append("username", username);
    if (status) params.append("status", status);
    if (blacklist) params.append("blacklist", blacklist);
    if (createdFrom) params.append("createdFrom", createdFrom);
    if (createdTo) params.append("createdTo", createdTo);
    if (loginFrom) params.append("loginFrom", loginFrom);
    if (loginTo) params.append("loginTo", loginTo);
    params.append("excludeUserRole", "false");
    params.append("format", format);
    params.append("token", token || "");
    const url = `http://localhost:3001/user/export?${params.toString()}`;
    window.open(url);
  };

  const sortUsers = (data: User[]) => {
    if (!sortKey || !sortDirection) return data;
    return [...data].sort((a, b) => {
      const getValue = (user: User) => {
        if (sortKey === "created_at" || sortKey === "last_login_at") {
          return user[sortKey] ? new Date(user[sortKey]!).getTime() : 0;
        }
        return (user[sortKey] as number) ?? 0;
      };
      const aVal = getValue(a);
      const bVal = getValue(b);
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });
  };

  const fetchUsers = async () => {
    if (!Number.isFinite(limit) || !Number.isFinite(page)) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (username) params.append("username", username);
      if (status) params.append("status", status);
      if (blacklist) params.append("blacklist", blacklist);
      if (createdFrom) params.append("createdFrom", createdFrom);
      if (createdTo) params.append("createdTo", createdTo);
      if (loginFrom) params.append("loginFrom", loginFrom);
      if (loginTo) params.append("loginTo", loginTo);
      params.append("limit", limit.toString());
      params.append("page", page.toString());
      params.append("excludeUserRole", "false");

      const res = await fetch(`http://localhost:3001/user?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();

      setUsers(sortUsers(result.data));
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasSearched) fetchUsers();
  }, [limit, page]);

  useEffect(() => {
    setUsers((prev) => sortUsers(prev));
  }, [sortKey, sortDirection]);

  const handleSearch = () => {
    setHasSearched(true);
    setPage(1);
    fetchUsers();
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection("desc");
    } else {
      if (sortDirection === "desc") setSortDirection("asc");
      else if (sortDirection === "asc") {
        setSortDirection(null);
        setSortKey(null);
      } else setSortDirection("desc");
    }
  };

  const getArrow = (key: SortKey) => {
    const isActive = sortKey === key;
    const dir = isActive ? sortDirection : null;
    return (
      <span className={`ml-1 text-xs ${isActive ? "text-black" : "text-gray-400"}`}>
        {dir === "asc" && "↑"}
        {dir === "desc" && "↓"}
        {!dir && "⇅"}
      </span>
    );
  };

  const handleToggleStatus = async (userId: number, currentStatus: string) => {
    const token = localStorage.getItem("token");
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await fetch(`http://localhost:3001/user/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, status: newStatus } : user
        )
      );
    } catch (err) {
      console.error("切換狀態失敗", err);
    }
  };

  const handleToggleBlacklist = async (userId: number, current: boolean) => {
    const token = localStorage.getItem("token");
    try {
      await fetch(`http://localhost:3001/user/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_blacklisted: !current }),
      });

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, is_blacklisted: !current } : user
        )
      );
    } catch (err) {
      console.error("切換黑名單失敗", err);
    }
  };

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setPage(i)}
          className={`px-3 py-1 rounded border ${page === i ? "bg-blue-600 text-white" : "hover:bg-gray-200"}`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="mt-4 flex justify-center items-center gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 rounded border disabled:opacity-50"
        >
          上一頁
        </button>
        {pages}
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
    );
  };

  return (
    <div className="b-ibox">
      <h1>使用者列表</h1>





      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <input type="text" placeholder="帳號" value={username} onChange={(e) => setUsername(e.target.value)} className="border rounded px-3 py-2 w-full" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded px-3 py-2 w-full">
          <option value="">狀態（全部）</option>
          <option value="ACTIVE">啟用</option>
          <option value="INACTIVE">停用</option>
          <option value="BANNED">封鎖</option>
        </select>
        <select value={blacklist} onChange={(e) => setBlacklist(e.target.value)} className="border rounded px-3 py-2 w-full">
          <option value="">黑名單（全部）</option>
          <option value="true">是</option>
          <option value="false">否</option>
        </select>
        <div className="flex gap-2">
          <input type="date" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} className="border rounded px-2 py-1 w-full" />
          <input type="date" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} className="border rounded px-2 py-1 w-full" />
        </div>
        <div className="flex gap-2">
          <input type="date" value={loginFrom} onChange={(e) => setLoginFrom(e.target.value)} className="border rounded px-2 py-1 w-full" />
          <input type="date" value={loginTo} onChange={(e) => setLoginTo(e.target.value)} className="border rounded px-2 py-1 w-full" />
        </div>
        <button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
          查詢
        </button>
      </div>










      <div className="mb-4 flex justify-between items-center">
        <div>
          <label>每頁顯示筆數：</label>
          <input type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="border rounded px-2 py-1 w-20" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">資料匯出：</label>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option value="">選擇格式</option>
            <option value="csv">CSV 匯出</option>
            <option value="xlsx">Excel 匯出</option>
          </select>
          <button
            onClick={() => {
              if (!exportFormat) {
                alert("請先選擇匯出格式");
                return;
              }
              handleExport(exportFormat as "csv" | "xlsx");
            }}
            className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            匯出
          </button>
        </div>
      </div>

      {loading && <p>載入中...</p>}
      {!loading && hasSearched && (
        <>
          <table className="w-full border-collapse border text-sm">
            <thead>
              <tr className="bg-gray-200 text-center">
                <th className="border p-2 cursor-pointer" onClick={() => toggleSort("id")}>ID{getArrow("id")}</th>
                <th className="border p-2">帳號</th>
                <th className="border p-2">Email</th>
                <th className="border p-2 cursor-pointer" onClick={() => toggleSort("created_at")}>註冊時間{getArrow("created_at")}</th>
                <th className="border p-2">登入 IP</th>
                <th className="border p-2">登入平台</th>
                <th className="border p-2 cursor-pointer" onClick={() => toggleSort("last_login_at")}>登入時間{getArrow("last_login_at")}</th>
                <th className="border p-2">狀態</th>
                <th className="border p-2">黑名單</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="text-center">
                  <td className="border p-2">{user.id}</td>
                  <td className="border p-2">{user.username}</td>
                  <td className="border p-2">{user.email || "-"}</td>
                  <td className="border p-2">{user.created_at ? new Date(user.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false }) : "-"}</td>
                  <td className="border p-2">{user.last_login_ip || "-"}</td>
                  <td className="border p-2">{user.last_login_platform || "-"}</td>
                  <td className="border p-2">{user.last_login_at ? new Date(user.last_login_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false }) : "-"}</td>
                  <td className="border p-2">
                    <button onClick={() => handleToggleStatus(user.id, user.status)} className={`px-2 py-1 rounded text-white ${user.status === "ACTIVE" ? "bg-green-600 hover:bg-green-700" : "bg-blue-500 hover:bg-blue-600"}`}>
                      {user.status === "ACTIVE" ? "啟用" : "停用"}
                    </button>
                  </td>
                  <td className="border p-2">
                    <button onClick={() => handleToggleBlacklist(user.id, user.is_blacklisted)} className={`px-2 py-1 rounded text-white ${user.is_blacklisted ? "bg-red-600 hover:bg-red-700" : "bg-gray-500 hover:bg-gray-600"}`}>
                      {user.is_blacklisted ? "是" : "否"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {renderPagination()}
        </>
      )}
    </div>
  );
}
