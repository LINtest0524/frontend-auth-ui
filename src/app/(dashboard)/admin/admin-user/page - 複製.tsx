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
  const [users] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const currentUser = useUserStore((state) => state.user);
  const [inputLimit, setInputLimit] = useState(limit);
  const [hasSearched, setHasSearched] = useState(false);

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



  const canModify = currentUser?.role === "AGENT_OWNER" || currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "GLOBAL_ADMIN";







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
    <div className="b-ibox">

      <h1>管理員列表</h1>

      <div className="b-ibox-s">

        {canModify && (
            <button
              onClick={() => router.push("/admin/admin-user/new")}
              className="b-btn-s2 b-btn-c4 mb15"
            >
              新增管理員
            </button>
        )}



      
        <div className="w100 fo5 mb15">

          <div className="w50 fl4">
            <label htmlFor="page11">每頁&nbsp;</label>
            <input
              type="number"
              id="page11"
              value={inputLimit}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (!isNaN(val)) setInputLimit(val);
              }}
              min={1}
              className="txtbox1 mr20"
            />
            <button
              onClick={() => {
                const validLimit = Math.max(1, inputLimit);
                setLimit(validLimit);
              }}
              className="ml10 b-btn-s2 b-btn-c4"
            >
              顯示筆數
            </button>
          </div>



          <div className="w50 fl6">
            <input
              type="text"
              placeholder="帳號"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="max150 mr20"
            />
            <button
              onClick={handleSearch}
              className="b-btn-s2 b-btn-c4"
            >
              查詢
            </button>
          </div>

        </div>




      {loading ? (
        <p>載入中...</p>
      ) : (
        <table className="b-table-box admin-table mb15">
          <thead>
            <tr>
              <th>ID</th>
              <th>帳號</th>
              <th>角色</th>
              <th>狀態</th>
              <th>上次登入時間</th>
              <th>上次登入IP</th>
              <th>創建人</th>
              {canSeeActions && <th className="th-last">操作</th>}
            </tr>
          </thead>
          <tbody>
            {adminUsers.map((admin) => (
              <tr key={admin.id}>
                <td>{admin.id}</td>
                <td>{admin.username}</td>
                <td>{roleMap[admin.role || ""] ?? admin.role ?? "-"}</td>
                <td>{statusMap[admin.status]}</td>
                <td>{admin.last_login_at ? new Date(admin.last_login_at).toLocaleString() : "-"}</td>
                <td>{admin.last_login_ip || "-"}</td>

                <td className="">{admin.created_by?.username || "-"}</td>

                {canSeeActions && (
                  <td>
                    {canModify ? (
                      <div>
                        <button
                          onClick={() => router.push(`/admin/admin-user/${admin.id}/edit`)}
                          className="b-btn-s3 b-btn-c1 mlr10"
                        >編輯</button>
                        <button
                          onClick={() => router.push(`/admin/admin-user/${admin.id}/reset-password`)}
                          className="b-btn-s3 b-btn-c2 mlr10"
                        >重設密碼</button>
                        <button
                          onClick={() => handleDelete(admin.id)}
                          className="b-btn-s3 b-btn-c3 mlr10"
                        >刪除</button>
                      </div>
                    ) : (
                      <span>僅限代理商與超級管理員</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && hasSearched && users.length === 0 && (
          <div className="b-no-information w100 fd5">
            <img src="/no-information.webp" alt="無資料" className="mb25" />
            <p>查無資料</p>
          </div>
        )}



        {renderPagination()}



      </div>

    </div>
  );
}