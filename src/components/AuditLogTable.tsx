"use client";

import { useEffect, useState } from "react";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      if (!res.ok) {
        throw new Error(`API 錯誤: ${res.status}`);
      }

      const result = await res.json();

      if (!Array.isArray(result)) {
        throw new Error("API 回傳不是陣列");
      }

      const filtered = result.filter((log: AuditLog) =>
        log.action.includes(keyword)
      );

      setLogs(filtered);
    } catch (err: any) {
      console.error("API 錯誤:", err);
      setError(err.message || "API 讀取失敗");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">{title}</h1>

      {loading && <p>載入中...</p>}
      {error && <p className="text-red-500">錯誤：{error}</p>}
      {!loading && !error && logs.length === 0 && (
        <p className="text-gray-500">目前沒有資料</p>
      )}

      {!loading && !error && logs.length > 0 && (
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
            {logs.map((log) => (
              <tr key={log.id} className="text-center">
                <td className="border p-2">{log.id}</td>
                <td className="border p-2">
                  {log.user?.username || "未知使用者"}
                </td>
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
      )}
    </div>
  );
}
