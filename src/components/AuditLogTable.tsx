"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";

interface AuditLog {
  id: number;
  ip: string;
  platform: string;
  action: string;
  created_at: string;
  user: {
    id: number;
    username: string;
  } | null;
}

export default function AuditLogTable({
  keyword,
  title,
}: {
  keyword: string;
  title: string;
}) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filtered, setFiltered] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [ipSearch, setIpSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const totalPages = Math.ceil(filtered.length / limit);
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3001/audit-log", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`API 錯誤: ${res.status}`);

      const result = await res.json();
      if (!Array.isArray(result)) throw new Error("API 回傳不是陣列");

      const keywordFiltered = result.filter((log: AuditLog) =>
        log.action.includes(keyword)
      );

      setLogs(keywordFiltered);
      setFiltered([]); // 不自動顯示，等查詢
      setPage(1);
    } catch (err: any) {
      console.error("API 錯誤:", err);
      setError(err.message || "API 讀取失敗");
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    const q = search.trim().toLowerCase();
    const userQ = userSearch.trim().toLowerCase();
    const ipQ = ipSearch.trim();
    const fromDate = from ? dayjs(from).startOf("day") : null;
    const toDate = to ? dayjs(to).endOf("day") : null;

    const result = logs.filter((log) => {
      const time = dayjs(log.created_at);
      const inDateRange = (!fromDate || time.isAfter(fromDate)) && (!toDate || time.isBefore(toDate));
      const matchSearch = q === "" || log.action.toLowerCase().includes(q);
      const matchUser = userQ === "" || (log.user?.username?.toLowerCase().includes(userQ));
      const matchIp = ipQ === "" || log.ip.includes(ipQ);
      return inDateRange && matchSearch && matchUser && matchIp;
    });

    setFiltered(result);
    setPage(1);
  };

  const clearFilter = () => {
    setSearch("");
    setUserSearch("");
    setIpSearch("");
    setFrom("");
    setTo("");
    setFiltered([]);
  };

  const quickSetDate = (type: string) => {
    const today = dayjs();
    switch (type) {
      case "today":
        setFrom(today.format("YYYY-MM-DD"));
        setTo(today.format("YYYY-MM-DD"));
        break;
      case "yesterday":
        setFrom(today.subtract(1, "day").format("YYYY-MM-DD"));
        setTo(today.subtract(1, "day").format("YYYY-MM-DD"));
        break;
      case "3days":
        setFrom(today.subtract(2, "day").format("YYYY-MM-DD"));
        setTo(today.format("YYYY-MM-DD"));
        break;
      case "thisMonth":
        setFrom(today.startOf("month").format("YYYY-MM-DD"));
        setTo(today.endOf("month").format("YYYY-MM-DD"));
        break;
      case "lastMonth":
        const last = today.subtract(1, "month");
        setFrom(last.startOf("month").format("YYYY-MM-DD"));
        setTo(last.endOf("month").format("YYYY-MM-DD"));
        break;
    }
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setPage(i)}
          className={`px-3 py-1 border rounded ${
            i === page ? "bg-blue-600 text-white" : "hover:bg-gray-100"
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="mt-4 flex flex-wrap justify-center items-center gap-2 text-sm">
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
        <p className="text-gray-500 ml-4 whitespace-nowrap">
          第 {page} / {totalPages} 頁（共 {filtered.length} 筆）
        </p>
      </div>
    );
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">{title}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="操作關鍵字（例如：新增、刪除）"
          className="border rounded px-3 py-2 w-full"
        />
        <input
          type="text"
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          placeholder="使用者帳號"
          className="border rounded px-3 py-2 w-full"
        />
        <input
          type="text"
          value={ipSearch}
          onChange={(e) => setIpSearch(e.target.value)}
          placeholder="IP 位址"
          className="border rounded px-3 py-2 w-full"
        />
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <button onClick={() => quickSetDate("today")} className="px-2 py-1 bg-gray-100 rounded">今日</button>
        <button onClick={() => quickSetDate("yesterday")} className="px-2 py-1 bg-gray-100 rounded">昨日</button>
        <button onClick={() => quickSetDate("3days")} className="px-2 py-1 bg-gray-100 rounded">近三日</button>
        <button onClick={() => quickSetDate("thisMonth")} className="px-2 py-1 bg-gray-100 rounded">本月</button>
        <button onClick={() => quickSetDate("lastMonth")} className="px-2 py-1 bg-gray-100 rounded">上月</button>
        <div className="ml-auto flex gap-2">
          <button onClick={applyFilter} className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">查詢</button>
          <button onClick={clearFilter} className="px-4 py-1 bg-gray-300 text-black rounded hover:bg-gray-400">清除</button>
        </div>
      </div>

      {loading && <p>載入中...</p>}
      {error && <p className="text-red-500">錯誤：{error}</p>}
      {!loading && !error && filtered.length === 0 && <p className="text-gray-500">尚無紀錄</p>}

      {!loading && !error && filtered.length > 0 && (
        <>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-200 text-center">
                <th className="border p-2">ID</th>
                <th className="border p-2">使用者</th>
                <th className="border p-2">IP</th>
                <th className="border p-2">裝置平台</th>
                <th className="border p-2">操作內容</th>
                <th className="border p-2">時間</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((log) => (
                <tr key={log.id} className="text-center">
                  <td className="border p-2">{log.id}</td>
                  <td className="border p-2">{log.user?.username || "未知使用者"}</td>
                  <td className="border p-2">{log.ip}</td>
                  <td className="border p-2">{log.platform}</td>
                  <td className="border p-2">{log.action}</td>
                  <td className="border p-2">
                    {new Date(log.created_at).toLocaleString("zh-TW", {
                      timeZone: "Asia/Taipei",
                      hour12: false,
                    })}
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