// frontend\src\app\(dashboard)\users\page.tsx
"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
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
  const [sortKey, setSortKey] = useState<"id" | "created_at" | "last_login_at" | null>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>("asc");
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("");
  const [blacklist, setBlacklist] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [loginFrom, setLoginFrom] = useState("");
  const [loginTo, setLoginTo] = useState("");
  const [exportFormat, setExportFormat] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // 篩選展開
  const [isFilterOpen, setIsFilterOpen] = useState(false);


  const quickSetDate = (type: string, target: "created" | "login") => {
    const today = dayjs();
    let fromDate = "";
    let toDate = "";

    switch (type) {
      case "today":
        fromDate = today.format("YYYY-MM-DD");
        toDate = today.format("YYYY-MM-DD");
        break;
      case "yesterday":
        const y = today.subtract(1, "day");
        fromDate = y.format("YYYY-MM-DD");
        toDate = y.format("YYYY-MM-DD");
        break;
      case "3days":
        fromDate = today.subtract(2, "day").format("YYYY-MM-DD");
        toDate = today.format("YYYY-MM-DD");
        break;
      case "thisMonth":
        fromDate = today.startOf("month").format("YYYY-MM-DD");
        toDate = today.endOf("month").format("YYYY-MM-DD");
        break;
      case "lastMonth":
        const last = today.subtract(1, "month");
        fromDate = last.startOf("month").format("YYYY-MM-DD");
        toDate = last.endOf("month").format("YYYY-MM-DD");
        break;
    }

    if (target === "created") {
      setCreatedFrom(fromDate);
      setCreatedTo(toDate);
    } else {
      setLoginFrom(fromDate);
      setLoginTo(toDate);
    }
  };


  const clearFilter = () => {
    setUsername("");
    setStatus("");
    setBlacklist("");
    setCreatedFrom("");
    setCreatedTo("");
    setLoginFrom("");
    setLoginTo("");
    setUsers([]);
    setTotalPages(1);
    setTotalCount(0);
    setHasSearched(false);
  };

  const handleExport = (format: "csv" | "xlsx") => {
    const token = localStorage.getItem("token");
    const params = new URLSearchParams();
    if (username) params.append("username", username);
    if (status) params.append("status", status);
    if (blacklist) params.append("blacklist", blacklist);

    if (createdFrom) params.append("createdFrom", createdFrom + " 00:00:00");
    if (createdTo) params.append("createdTo", createdTo + " 23:59:59");

    if (loginFrom) params.append("loginFrom", loginFrom + " 00:00:00");
    if (loginTo) params.append("loginTo", loginTo + " 23:59:59");
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

      if (createdFrom) params.append("createdFrom", createdFrom + " 00:00:00");
      if (createdTo) params.append("createdTo", createdTo + " 23:59:59");

      if (loginFrom) params.append("loginFrom", loginFrom + " 00:00:00");
      if (loginTo) params.append("loginTo", loginTo + " 23:59:59");


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

    const getIcon = () => {
      if (dir === "asc") return <img src="/icon/i-sort-2.svg" alt="升冪" className="i-sort" />;
      if (dir === "desc") return <img src="/icon/i-sort-1.svg" alt="降冪" className="i-sort" />;
      return <img src="/icon/i-sort-0.svg" alt="未排序" className="i-sort" />;
    };

    return (
      <span className={`${isActive }`}>
        {getIcon()}
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
                onClick={() => setPage(p)}
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
        <h1>會員列表</h1>

        <div className="b-ibox-s">

          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="b-search-btn w100"
          >
            篩選
            <span className={`i-arrow ${isFilterOpen ? "rotate" : ""}`}></span>
          </button>
        


          {isFilterOpen && (
            <>
              <div className="b-search-box fl1 w100 mt15">

                <div className="b-form-group-2 fl4 w33 mb25">
                  <label htmlFor="username20">帳號</label>
                  <input type="text" placeholder="帳號" id="username20" value={username} onChange={(e) => setUsername(e.target.value)} className="w60" />
                </div>


                <div className="b-form-group-2 fl4 w33 mb25">
                  <label htmlFor="status-select-1">狀態</label>
                  <select id="status-select-1" value={status} onChange={(e) => setStatus(e.target.value)} className="w60">
                    <option value="">狀態（全部）</option>
                    <option value="ACTIVE">啟用</option>
                    <option value="INACTIVE">停用</option>
                    <option value="BANNED">封鎖</option>
                  </select>
                </div>
                
                <div className="b-form-group-2 fl4 w33 mb25">
                  <label htmlFor="status-select-2">黑名單</label>
                  <select id="status-select-2" value={blacklist} onChange={(e) => setBlacklist(e.target.value)} className="w60">
                    <option value="">黑名單（全部）</option>
                    <option value="true">是</option>
                    <option value="false">否</option>
                  </select>
                </div>

                <div className="w50 fd1 mb25">

                  <div className="b-form-group-2 fl4 w100 mb10">
                    <label htmlFor="date-select-1">註冊時間</label>
                    <div className="w70 fl4">
                      <input type="date" id="date-select-1" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} className="date-select" />
                      <span className="dateto">到</span>
                      <input type="date" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} className="date-select" />
                    </div>
                  </div>

                  <div className="b-form-group-2 w100 fl4">
                    <label></label>
                    <div className="b-date-fast fl4 w70">
                      <button onClick={() => quickSetDate("today", "created")}>今日</button>
                      <button onClick={() => quickSetDate("yesterday", "created")}>昨日</button>
                      <button onClick={() => quickSetDate("3days", "created")}>近三日</button>
                      <button onClick={() => quickSetDate("thisMonth", "created")}>本月</button>
                      <button onClick={() => quickSetDate("lastMonth", "created")}>上月</button>
                    </div>
                  </div>

                </div>


                <div className="w50 fd1 mb25">
                  <div className="b-form-group-2 fl4 w100 mb10">
                    <label htmlFor="date-select-2">登入時間</label>
                    <div className="w70 fl4">
                      <input type="date" id="date-select-2" value={loginFrom} onChange={(e) => setLoginFrom(e.target.value)} className="date-select" />
                      <span className="dateto">到</span>
                      <input type="date" value={loginTo} onChange={(e) => setLoginTo(e.target.value)} className="date-select" />
                    </div>
                  </div>

                  <div className="b-form-group-2 w100 fl4">
                    <label></label>
                    <div className="b-date-fast fl4 w70">
                      <button onClick={() => quickSetDate("today", "login")}>今日</button>
                      <button onClick={() => quickSetDate("yesterday", "login")}>昨日</button>
                      <button onClick={() => quickSetDate("3days", "login")}>近三日</button>
                      <button onClick={() => quickSetDate("thisMonth", "login")}>本月</button>
                      <button onClick={() => quickSetDate("lastMonth", "login")}>上月</button>
                    </div>
                  </div>

                </div>



                <div className="fl4 w100 b-btnbox">
                  <button onClick={handleSearch} className="b-btn-s2 b-btn-c4 mr20">查詢</button>
                  <button onClick={clearFilter} className="b-btn-s2 b-btn-c1">清除</button>
                </div>


              </div>
              
            </>
          )}
        
        </div>
      
      </div>

          








      <div className="b-ibox">

        <div className="b-ibox-s">


          <div className="w100 fo5 mb15">

            <div className="w50 fl4">
              <label htmlFor="page11">每頁&nbsp;</label>
              <input
                type="number"
                id="page11"
                value={limit}
                onChange={(e) => {
                  const val = Math.max(1, Number(e.target.value)); 
                  setLimit(val);
                }}
                min={1}
                className="txtbox1"
              />
              <p>&nbsp;顯示筆數</p>
            </div>



            <div className="w50 fl6">
              <label>資料匯出：</label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="mr10"
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
                className="b-btn-s2 b-btn-c4"
              >
                匯出
              </button>
            </div>
          </div>



          {loading && <p>載入中...</p>}

          {!loading && hasSearched && (
            <>
              <table className="b-table-box admin-table mb15">
                <thead>
                  <tr>
                    <th onClick={() => toggleSort("id")}>ID{getArrow("id")}</th>
                    <th>帳號</th>
                    <th>Email</th>
                    <th onClick={() => toggleSort("created_at")}>註冊時間{getArrow("created_at")}</th>
                    <th>登入 IP</th>
                    <th>登入平台</th>
                    <th onClick={() => toggleSort("last_login_at")}>登入時間{getArrow("last_login_at")}</th>
                    <th>狀態</th>
                    <th>黑名單</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.email || "-"}</td>
                      <td>{user.created_at ? new Date(user.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false }) : "-"}</td>
                      <td>{user.last_login_ip || "-"}</td>
                      <td>{user.last_login_platform || "-"}</td>
                      <td>{user.last_login_at ? new Date(user.last_login_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false }) : "-"}</td>
                      <td>
                        <button onClick={() => handleToggleStatus(user.id, user.status)} className={`${user.status === "ACTIVE" ? "b-btn-s3 b-btn-c4" : "b-btn-s3 b-btn-c3"}`}>
                          {user.status === "ACTIVE" ? "啟用" : "停用"}
                        </button>
                      </td>
                      <td>
                        <button onClick={() => handleToggleBlacklist(user.id, user.is_blacklisted)} className={`${user.is_blacklisted ? "b-btn-s3 b-btn-c3" : "b-btn-s3 b-btn-c1"}`}>
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

      </div>
    </div>




   

  );
}
