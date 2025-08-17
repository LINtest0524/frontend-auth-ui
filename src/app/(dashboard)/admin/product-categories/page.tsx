"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/hooks/use-user-store";
import dayjs from "dayjs";

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  sort_order: number;
  is_active: boolean;
  is_visible: boolean;
  parent?: {
    id: number;
    name: string;
  };
  company?: {
    id: number;
    name: string;
  };
  created_at: string;
}

type SortKey = "id" | "name" | "sort_order" | "created_at" | null;
type SortDirection = "asc" | "desc" | null;

export default function ProductCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const currentUser = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // 篩選和分頁狀態
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [hasSearched, setHasSearched] = useState(false);
  const [inputLimit, setInputLimit] = useState(limit);
  
  // 篩選條件
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [visible, setVisible] = useState("");
  const [createdFrom, setCreatedFrom] = useState(() => {
    const today = dayjs();
    return today.subtract(30, "day").format("YYYY-MM-DD");
  });
  const [createdTo, setCreatedTo] = useState(() => {
    const today = dayjs();
    return today.format("YYYY-MM-DD");
  });
  
  // 篩選展開
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 載入用戶資料
  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const parsedUser = JSON.parse(rawUser);
      setUser(parsedUser);
    }
  }, [setUser]);

  const quickSetDate = (type: string) => {
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
      case "7days":
        fromDate = today.subtract(6, "day").format("YYYY-MM-DD");
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

    setCreatedFrom(fromDate);
    setCreatedTo(toDate);
  };

  const clearFilter = () => {
    setName("");
    setStatus("");
    setVisible("");
    setCreatedFrom("");
    setCreatedTo("");
    setCategories([]);
    setTotalPages(1);
    setTotalCount(0);
    setHasSearched(false);
  };

  const sortCategories = (data: Category[]) => {
    if (!sortKey || !sortDirection) return data;
    return [...data].sort((a, b) => {
      const getValue = (category: Category) => {
        if (sortKey === "created_at") {
          return category[sortKey] ? new Date(category[sortKey]).getTime() : 0;
        }
        if (sortKey === "name") {
          return category[sortKey] || "";
        }
        return (category[sortKey] as number) ?? 0;
      };
      const aVal = getValue(a);
      const bVal = getValue(b);
      
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  };

  const fetchCategories = async () => {
    if (!Number.isFinite(limit) || !Number.isFinite(page)) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (name) params.append("name", name);
      if (status) params.append("is_active", status);
      if (visible) params.append("is_visible", visible);

      if (createdFrom) params.append("createdFrom", createdFrom + " 00:00:00");
      if (createdTo) params.append("createdTo", createdTo + " 23:59:59");

      params.append("limit", limit.toString());
      params.append("page", page.toString());

      const res = await fetch(`http://localhost:3001/admin/product-category?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error("取得分類資料失敗");
      
      const result = await res.json();
      
      // 如果 API 返回分頁資料
      if (result.data) {
        setCategories(sortCategories(result.data));
        setTotalPages(result.totalPages || 1);
        setTotalCount(result.totalCount || result.data.length);
      } else {
        // 如果 API 返回簡單陣列，進行客戶端分頁
        const allData = sortCategories(result);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = allData.slice(startIndex, endIndex);
        
        setCategories(paginatedData);
        setTotalPages(Math.ceil(allData.length / limit));
        setTotalCount(allData.length);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasSearched) fetchCategories();
  }, [limit, page]);

  useEffect(() => {
    setCategories((prev) => sortCategories(prev));
  }, [sortKey, sortDirection]);

  // 頁面載入時自動搜尋
  useEffect(() => {
    if (!hasSearched) {
      setHasSearched(true);
      fetchCategories();
    }
  }, []);

  const handleSearch = () => {
    setHasSearched(true);
    setPage(1);
    fetchCategories();
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
      <span className={`${isActive}`}>
        {getIcon()}
      </span>
    );
  };

  const handleDelete = async (id: number) => {
    if (!confirm("確定要刪除這個分類嗎？")) return;

    setDeletingId(id);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:3001/admin/product-category/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error("刪除失敗");

      setTimeout(() => {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        setDeletingId(null);
        // 重新載入資料以更新總數
        fetchCategories();
      }, 500);
    } catch (err) {
      alert("刪除失敗");
      setDeletingId(null);
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
        <h1>商品分類管理</h1>

        <div className="b-ibox-s">
          {(currentUser?.role === "SUPER_ADMIN" || 
            currentUser?.role === "GLOBAL_ADMIN" || 
            currentUser?.role === "AGENT_OWNER") && (
            <div className="w100 mb15">
              <button
                onClick={() => router.push("/admin/product-categories/new")}
                className="b-btn-s2 b-btn-c4"
              >
                新增分類
              </button>
            </div>
          )}

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
                  <label htmlFor="category-name">分類名稱</label>
                  <input 
                    type="text" 
                    placeholder="分類名稱" 
                    id="category-name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="w60" 
                  />
                </div>

                <div className="b-form-group-2 fl4 w33 mb25">
                  <label htmlFor="status-select">狀態</label>
                  <select 
                    id="status-select" 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)} 
                    className="w60"
                  >
                    <option value="">狀態（全部）</option>
                    <option value="true">啟用</option>
                    <option value="false">停用</option>
                  </select>
                </div>
                
                <div className="b-form-group-2 fl4 w33 mb25">
                  <label htmlFor="visible-select">顯示</label>
                  <select 
                    id="visible-select" 
                    value={visible} 
                    onChange={(e) => setVisible(e.target.value)} 
                    className="w60"
                  >
                    <option value="">顯示（全部）</option>
                    <option value="true">顯示</option>
                    <option value="false">隱藏</option>
                  </select>
                </div>

                <div className="w50 fd1 mb25">
                  <div className="b-form-group-2 fl4 w100 mb10">
                    <label htmlFor="date-select-1">建立時間</label>
                    <div className="w70 fl4">
                      <input 
                        type="date" 
                        id="date-select-1" 
                        value={createdFrom} 
                        onChange={(e) => setCreatedFrom(e.target.value)} 
                        className="date-select flex1" 
                      />
                      <span className="dateto">到</span>
                      <input 
                        type="date" 
                        value={createdTo} 
                        onChange={(e) => setCreatedTo(e.target.value)} 
                        className="date-select flex1" 
                      />
                    </div>
                  </div>

                  <div className="b-form-group-2 w100 fl4">
                    <div className="b-date-fast fl4 w70 ml132">
                      <button onClick={() => quickSetDate("today")}>今日</button>
                      <button onClick={() => quickSetDate("yesterday")}>昨日</button>
                      <button onClick={() => quickSetDate("7days")}>近七日</button>
                      <button onClick={() => quickSetDate("thisMonth")}>本月</button>
                      <button onClick={() => quickSetDate("lastMonth")}>上月</button>
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

      {loading && <p>載入中...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && hasSearched && (
        <>
          <div className="b-ibox">
            <div className="b-ibox-s">
              <div className="w100 fo5 mb15">
                <div className="w50 fl4">
                  <label htmlFor="page-limit">每頁&nbsp;</label>
                  <input
                    type="number"
                    id="page-limit"
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
              </div>

              <table className="b-table-box admin-table mb15">
                <thead>
                  <tr>
                    <th onClick={() => toggleSort("id")}>ID{getArrow("id")}</th>
                    <th onClick={() => toggleSort("name")}>分類名稱{getArrow("name")}</th>
                    <th>Slug</th>
                    <th>父分類</th>
                    <th onClick={() => toggleSort("sort_order")}>排序{getArrow("sort_order")}</th>
                    <th>狀態</th>
                    <th>顯示</th>
                    <th>所屬公司</th>
                    <th onClick={() => toggleSort("created_at")}>建立時間{getArrow("created_at")}</th>
                    <th className="th-last">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td>{category.id}</td>
                      <td>
                        <div style={{fontWeight: "500"}}>{category.name}</div>
                        {category.description && (
                          <div style={{fontSize: "12px", color: "#666", marginTop: "4px"}}>
                            {category.description.length > 30 
                              ? `${category.description.substring(0, 30)}...` 
                              : category.description}
                          </div>
                        )}
                      </td>
                      <td style={{fontFamily: "monospace", fontSize: "12px"}}>{category.slug}</td>
                      <td>{category.parent?.name || "-"}</td>
                      <td style={{textAlign: "center"}}>{category.sort_order}</td>
                      <td>
                        <span style={{color: category.is_active ? "#28a745" : "#dc3545"}}>
                          {category.is_active ? "啟用" : "停用"}
                        </span>
                      </td>
                      <td>
                        <span style={{color: category.is_visible ? "#28a745" : "#6c757d"}}>
                          {category.is_visible ? "顯示" : "隱藏"}
                        </span>
                      </td>
                      <td>{category.company?.name || "-"}</td>
                      <td>{category.created_at ? new Date(category.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false }) : "-"}</td>
                      <td>
                        <div style={{display: "flex", gap: "8px", flexWrap: "wrap"}}>
                          <button
                            onClick={() => router.push(`/admin/product-categories/${category.id}`)}
                            className="b-btn-s3 b-btn-c2"
                          >
                            查看
                          </button>
                          
                          {(currentUser?.role === "SUPER_ADMIN" || 
                            currentUser?.role === "GLOBAL_ADMIN" || 
                            currentUser?.role === "AGENT_OWNER") && (
                            <button
                              onClick={() => router.push(`/admin/product-categories/${category.id}/edit`)}
                              className="b-btn-s3 b-btn-c4"
                            >
                              編輯
                            </button>
                          )}

                          {(currentUser?.role === "SUPER_ADMIN" || 
                            currentUser?.role === "GLOBAL_ADMIN") && (
                            <button
                              onClick={() => handleDelete(category.id)}
                              className={`b-btn-s3 b-btn-c3 ${
                                deletingId === category.id ? "opacity-50 pointer-events-none" : ""
                              }`}
                            >
                              {deletingId === category.id ? "刪除中..." : "刪除"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!loading && hasSearched && categories.length === 0 && (
                <div className="b-no-information w100 fd5">
                  <img src="/no-information.webp" alt="無資料" className="mb25" />
                  <p>查無資料</p>
                </div>
              )}

              {renderPagination()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}