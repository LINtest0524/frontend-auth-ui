// frontend\src\components\AuditLogTable.tsx
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
  target,
}: {
  keyword: string;
  title: string;
  target?: string;
}) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // const [target, setTarget] = useState("")

  const [search, setSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [ipSearch, setIpSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();



      if (target) params.append("target", target);
      if (search) params.append("search", search);
      if (userSearch) params.append("user", userSearch);
      if (ipSearch) params.append("ip", ipSearch);
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const res = await fetch(`http://localhost:3001/audit-log?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`API 錯誤: ${res.status}`);

      const result = await res.json();
      if (!Array.isArray(result.data)) throw new Error("API 回傳格式錯誤");

      setLogs(result.data);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch (err: any) {
      console.error("API 錯誤:", err);
      setError(err.message || "API 讀取失敗");
    } finally {
      setLoading(false);
    }
  };

  const clearFilter = () => {
    setSearch("");
    setUserSearch("");
    setIpSearch("");
    setFrom("");
    setTo("");
    setLogs([]);
    setTotalPages(1);
    setTotalCount(0);
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
    if (totalPages <= 1 || totalCount === 0) return null;

    const pages = [];
    const maxVisible = 5;

    if (totalPages <= 10) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      const start = Math.max(2, page - 2);
      const end = Math.min(totalPages - 1, page + 2);

      if (start > 2) {
        pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return (
      <div className="fo5 w100 b-data-tables_munber mb15">
        <p>
          目前第 {page} 頁，共 {totalPages} 頁（共 {totalCount} 筆資料）
        </p>

        <div className="tables_munber">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className=""
          >
            上一頁
          </button>

          {pages.map((p, idx) =>
            p === "..." ? (
              <span key={`ellipsis-${idx}`}>
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p as number)}
                className={`${
                  page === p ? "pagehover" : ""
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className=""
          >
            下一頁
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="b-bigbox-all w100">
      <div className="b-ibox mb30">
        <h1>{title}</h1>

        <div className="b-ibox-s">
          <div className="b-search-box fl1 w100">
            <div className="b-form-group-2 fl4 w33 mb25">
              <label>操作關鍵字</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="例如：新增、刪除"
                className="w60"
              />
            </div>

            <div className="b-form-group-2 fl4 w33 mb25">
              <label>使用者帳號</label>
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="使用者帳號"
                className="w60"
              />
            </div>

            <div className="b-form-group-2 fl4 w33 mb25">
              <label>IP 位址</label>
              <input
                type="text"
                value={ipSearch}
                onChange={(e) => setIpSearch(e.target.value)}
                placeholder="IP 位址"
                className="w60"
              />
            </div>

            <div className="b-form-group-2 fl4 w100 mb10">
              <label>時間範圍</label>
              <div className="w70 fl4">
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="date-select flex1"
                />
                <span className="dateto">到</span>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="date-select flex1"
                />
              </div>
            </div>

            <div className="b-form-group-2 w100 fl4 mb25">
              <div className="b-date-fast fl4 w70 ml132">
                <button onClick={() => quickSetDate("today")}>今日</button>
                <button onClick={() => quickSetDate("yesterday")}>昨日</button>
                <button onClick={() => quickSetDate("3days")}>近三日</button>
                <button onClick={() => quickSetDate("thisMonth")}>本月</button>
                <button onClick={() => quickSetDate("lastMonth")}>上月</button>
              </div>
            </div>

            <div className="fl4 w100 b-btnbox">
              <button onClick={() => { setPage(1); fetchLogs(); }} className="b-btn-s2 b-btn-c4 mr20">查詢</button>
              <button onClick={clearFilter} className="b-btn-s2 b-btn-c1">清除</button>
            </div>
          </div>
        </div>
      </div>

      {loading && <p>載入中...</p>}
      {error && <p style={{color: 'red'}}>錯誤：{error}</p>}

      {!loading && !error && logs.length === 0 && (
        <div className="b-no-information w100 fd5">
          <img src="/no-information.webp" alt="無資料" className="mb25" />
          <p>查無資料</p>
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
        <div className="b-ibox">
          <div className="b-ibox-s">
            <table className="b-table-box admin-table mb15">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>使用者</th>
                  <th>IP</th>
                  <th>裝置平台</th>
                  <th>操作內容</th>
                  <th>時間</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.id}</td>
                    <td>{log.user?.username || "未知使用者"}</td>
                    <td>{log.ip}</td>
                    <td>{log.platform}</td>
                    <td>{log.action}</td>
                    <td>
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
          </div>
        </div>
      )}
    </div>
  );
}
