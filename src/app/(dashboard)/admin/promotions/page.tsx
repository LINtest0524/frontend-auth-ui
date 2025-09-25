'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/hooks/use-user-store';
import dayjs from 'dayjs';
import '@/styles/pages/promotions-admin.css';

interface PromotionCategory {
  id: number;
  name: string;
}

interface Promotion {
  id: number;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  sortOrder: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  category: PromotionCategory;
}

type SortKey = "id" | "title" | "sortOrder" | "viewCount" | "createdAt" | null;
type SortDirection = "asc" | "desc" | null;

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [categories, setCategories] = useState<PromotionCategory[]>([]);
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
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [isActive, setIsActive] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  
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

  // 載入活動類型
  useEffect(() => {
    fetchCategories();
  }, []);

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
      case "3days":
        fromDate = today.subtract(2, "day").format("YYYY-MM-DD");
        toDate = today.format("YYYY-MM-DD");
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
    setTitle("");
    setCategoryId("");
    setStatus("");
    setIsActive("");
    setCreatedFrom("");
    setCreatedTo("");
    setPage(1);
    setPromotions([]);
    setTotalPages(1);
    setTotalCount(0);
    setHasSearched(true);
    // 清除後立即搜尋
    setTimeout(() => {
      fetchPromotions();
    }, 0);
  };

  const sortPromotions = (data: Promotion[]) => {
    if (!sortKey || !sortDirection) return data;
    return [...data].sort((a, b) => {
      const getValue = (promotion: Promotion) => {
        if (sortKey === "createdAt") {
          return promotion[sortKey] ? new Date(promotion[sortKey]).getTime() : 0;
        }
        if (sortKey === "title") {
          return promotion[sortKey] || "";
        }
        return (promotion[sortKey] as number) ?? 0;
      };
      const aVal = getValue(a);
      const bVal = getValue(b);
      
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  };

  const fetchPromotions = async (useInitialFilter = false) => {
    if (!Number.isFinite(limit) || !Number.isFinite(page)) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // 建構查詢參數
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      if (title.trim()) {
        queryParams.append('title', title.trim());
      }
      if (categoryId) {
        queryParams.append('categoryId', categoryId.toString());
      }
      if (status) {
        queryParams.append('status', status);
      }
      if (isActive !== "") {
        queryParams.append('isActive', isActive);
      }
      
      // 如果是初始載入，使用預設的近3天時間範圍，否則使用篩選條件中的時間
      if (useInitialFilter) {
        const today = dayjs();
        const threeDaysAgo = today.subtract(2, "day").format("YYYY-MM-DD");
        const todayStr = today.format("YYYY-MM-DD");
        queryParams.append('createdFrom', threeDaysAgo);
        queryParams.append('createdTo', todayStr);
      } else {
        if (createdFrom) {
          queryParams.append('createdFrom', createdFrom);
        }
        if (createdTo) {
          queryParams.append('createdTo', createdTo);
        }
      }
      
      const url = `http://localhost:3001/promotions?${queryParams.toString()}`;
      console.log('請求URL:', url);
      console.log('篩選條件:', { title, categoryId, status, isActive, createdFrom, createdTo });
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("取得優惠活動資料失敗");
      
      const result = await response.json();
      console.log('後端回應:', result);
      
      // 檢查回傳格式
      if (result && typeof result === 'object' && result.promotions) {
        // 後端已經處理分頁，直接使用回傳的資料
        setPromotions(result.promotions || []);
        setTotalPages(result.totalPages || 1);
        setTotalCount(result.total || 0);
      } else {
        // 如果是陣列格式，進行客戶端分頁和排序
        const promotionsData = Array.isArray(result) ? result : [];
        const allData = sortPromotions(promotionsData);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = allData.slice(startIndex, endIndex);
        
        setPromotions(paginatedData);
        setTotalPages(Math.ceil(allData.length / limit));
        setTotalCount(allData.length);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3001/promotion-categories/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('獲取活動類型失敗:', error);
    }
  };

  useEffect(() => {
    if (hasSearched) fetchPromotions();
  }, [limit, page]);

  useEffect(() => {
    setPromotions((prev) => sortPromotions(prev));
  }, [sortKey, sortDirection]);

  // 頁面載入時自動搜尋近3天資料
  useEffect(() => {
    if (!hasSearched) {
      setHasSearched(true);
      fetchPromotions(true); // 使用初始篩選條件
    }
  }, []);

  const handleSearch = () => {
    setPage(1);
    setHasSearched(true);
    fetchPromotions();
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
    if (!confirm("確定要刪除這個優惠活動嗎？")) return;

    setDeletingId(id);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:3001/promotions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error("刪除失敗");

      setTimeout(() => {
        setPromotions((prev) => prev.filter((p) => p.id !== id));
        setDeletingId(null);
        fetchPromotions();
      }, 500);
    } catch (err) {
      alert("刪除失敗");
      setDeletingId(null);
    }
  };

  const getPromotionStatus = (promotion: Promotion): 'upcoming' | 'active' | 'expired' => {
    const now = new Date();
    
    if (promotion.startDate && now < new Date(promotion.startDate)) {
      return 'upcoming';
    }
    
    if (promotion.endDate && now > new Date(promotion.endDate)) {
      return 'expired';
    }
    
    return 'active';
  };

  const getStatusText = (promotion: Promotion) => {
    if (!promotion.isActive) return "停用";
    
    const status = getPromotionStatus(promotion);
    switch (status) {
      case 'upcoming': return "即將開始";
      case 'active': return "進行中";
      case 'expired': return "已結束";
      default: return "未知";
    }
  };

  const getStatusColor = (promotion: Promotion) => {
    if (!promotion.isActive) return "#dc3545";
    
    const status = getPromotionStatus(promotion);
    switch (status) {
      case 'upcoming': return "#6c757d";
      case 'active': return "#28a745";
      case 'expired': return "#dc3545";
      default: return "#6c757d";
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1 || totalCount === 0) return null;

    const pages = [];

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
      <div className="pagination">
        <div className="pagination-info">
          第 {page} 頁，共 {totalPages} 頁（總計 {totalCount} 筆資料）
        </div>

        <div className="pagination-buttons">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="pagination-btn"
          >
            ⬅️ 上一頁
          </button>

          {pages.map((p, idx) =>
            p === "..." ? (
              <span key={`ellipsis-${idx}`} className="pagination-btn" style={{cursor: "default"}}>
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p as number)}
                className={`pagination-btn ${page === p ? "active" : ""}`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="pagination-btn"
          >
            下一頁 ➡️
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="promotions-admin-container">
      {/* 頁面標題區域 */}
      <div className="promotions-header">
        <h1>優惠活動管理</h1>
        <div className="promotions-header-actions">
          {(currentUser?.role === "SUPER_ADMIN" || 
            currentUser?.role === "GLOBAL_ADMIN" || 
            currentUser?.role === "AGENT_OWNER") && (
            <button
              onClick={() => router.push("/admin/promotions/new")}
              className="btn-primary"
            >
              ✨ 新增優惠活動
            </button>
          )}
        </div>
      </div>

      {/* 篩選區域 */}
      <div className="filter-section">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="filter-toggle"
        >
          <span>🔍 篩選條件</span>
          <span className={`filter-arrow ${isFilterOpen ? "rotate" : ""}`}>▼</span>
        </button>

        {isFilterOpen && (
          <div className="filter-content">
            <div className="filter-grid">
              <div className="form-group">
                <label htmlFor="promotion-title" className="form-label">活動標題</label>
                <input 
                  type="text" 
                  placeholder="請輸入活動標題" 
                  id="promotion-title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="form-input" 
                />
              </div>

              <div className="form-group">
                <label htmlFor="category-select" className="form-label">活動類型</label>
                <select 
                  id="category-select" 
                  value={categoryId} 
                  onChange={(e) => setCategoryId(e.target.value)} 
                  className="form-select"
                >
                  <option value="">全部類型</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="status-select" className="form-label">活動狀態</label>
                <select 
                  id="status-select" 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)} 
                  className="form-select"
                >
                  <option value="">全部狀態</option>
                  <option value="upcoming">即將開始</option>
                  <option value="active">進行中</option>
                  <option value="expired">已結束</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="active-select" className="form-label">啟用狀態</label>
                <select 
                  id="active-select" 
                  value={isActive} 
                  onChange={(e) => setIsActive(e.target.value)} 
                  className="form-select"
                >
                  <option value="">全部狀態</option>
                  <option value="true">已啟用</option>
                  <option value="false">已停用</option>
                </select>
              </div>

              <div className="form-group date-range-group">
                <label htmlFor="date-select-1" className="form-label">建立時間範圍</label>
                <div className="date-inputs">
                  <input 
                    type="date" 
                    id="date-select-1" 
                    value={createdFrom} 
                    onChange={(e) => setCreatedFrom(e.target.value)} 
                    className="form-input" 
                  />
                  <span className="date-separator">至</span>
                  <input 
                    type="date" 
                    value={createdTo} 
                    onChange={(e) => setCreatedTo(e.target.value)} 
                    className="form-input" 
                  />
                </div>
                <div className="quick-date-buttons">
                  <button onClick={() => quickSetDate("today")} className="btn-quick-date">今日</button>
                  <button onClick={() => quickSetDate("yesterday")} className="btn-quick-date">昨日</button>
                  <button onClick={() => quickSetDate("3days")} className="btn-quick-date">近三日</button>
                  <button onClick={() => quickSetDate("7days")} className="btn-quick-date">近七日</button>
                  <button onClick={() => quickSetDate("thisMonth")} className="btn-quick-date">本月</button>
                  <button onClick={() => quickSetDate("lastMonth")} className="btn-quick-date">上月</button>
                </div>
              </div>
            </div>

            <div className="filter-actions">
              <button onClick={handleSearch} className="btn-search">🔍 查詢</button>
              <button onClick={clearFilter} className="btn-clear">🗑️ 清除</button>
            </div>
          </div>
        )}
      </div>

      {/* 載入狀態和錯誤訊息 */}
      {loading && (
        <div className="loading-spinner">
          <div>⏳ 載入中...</div>
        </div>
      )}
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {!loading && hasSearched && (
        <div className="content-section">
          {/* 表格控制區域 */}
          <div className="table-controls">
            <div className="pagination-control">
              <label htmlFor="page-limit">每頁顯示：</label>
              <input
                type="number"
                id="page-limit"
                value={inputLimit}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val)) setInputLimit(val);
                }}
                min={1}
                className="pagination-input"
              />
              <button
                onClick={() => {
                  const validLimit = Math.max(1, inputLimit);
                  setLimit(validLimit);
                }}
                className="btn-search"
              >
                套用
              </button>
            </div>
            <div className="pagination-info">
              共 {totalCount} 筆資料
            </div>
          </div>

          {/* 現代化表格 */}
          <table className="modern-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort("id")}>
                  <div className="fl4">
                    ID <span className={`sort-icon ${sortKey === "id" ? "active" : ""}`}>{getArrow("id")}</span>
                  </div>
                </th>
                <th onClick={() => toggleSort("title")} className="w30">
                  <div className="fl4">
                    活動標題<span className={`sort-icon ${sortKey === "title" ? "active" : ""}`}>{getArrow("title")}</span>
                  </div>
                </th>
                <th>活動類型</th>
                <th>活動期間</th>
                <th>狀態</th>
                <th onClick={() => toggleSort("viewCount")}>
                  <div className="fl4">
                    瀏覽次數 <span className={`sort-icon ${sortKey === "viewCount" ? "active" : ""}`}>{getArrow("viewCount")}</span>
                  </div>
                </th>
                <th onClick={() => toggleSort("sortOrder")}>
                  <div className="fl4">
                    排序 <span className={`sort-icon ${sortKey === "sortOrder" ? "active" : ""}`}>{getArrow("sortOrder")}</span>
                  </div>
                </th>
                <th onClick={() => toggleSort("createdAt")}>
                  <div className="fl4">
                    建立時間 <span className={`sort-icon ${sortKey === "createdAt" ? "active" : ""}`}>{getArrow("createdAt")}</span>
                  </div>
                </th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((promotion) => (
                <tr key={promotion.id}>
                  <td>#{promotion.id}</td>
                  <td>
                    <div className="promotion-title">{promotion.title}</div>
                  </td>
                  <td>
                    <span style={{
                      background: "#f3f4f6",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "500"
                    }}>
                      {promotion.category ? promotion.category.name : "未分類"}
                    </span>
                  </td>
                  <td style={{fontSize: "12px", lineHeight: "1.4"}}>
                    <div>📅 {promotion.startDate ? new Date(promotion.startDate).toLocaleDateString("zh-TW") : "-"}</div>
                    <div style={{color: "#9ca3af", margin: "2px 0"}}>至</div>
                    <div>📅 {promotion.endDate ? new Date(promotion.endDate).toLocaleDateString("zh-TW") : "-"}</div>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      !promotion.isActive ? "status-disabled" :
                      getPromotionStatus(promotion) === "active" ? "status-active" :
                      getPromotionStatus(promotion) === "upcoming" ? "status-upcoming" :
                      "status-expired"
                    }`}>
                      {getStatusText(promotion)}
                    </span>
                  </td>
                  <td style={{textAlign: "center", fontWeight: "600"}}>
                    👁️ {promotion.viewCount || 0}
                  </td>
                  <td style={{textAlign: "center", fontWeight: "600"}}>
                    {promotion.sortOrder}
                  </td>
                  <td style={{fontSize: "12px"}}>
                    {promotion.createdAt ? new Date(promotion.createdAt).toLocaleString("zh-TW", { 
                      timeZone: "Asia/Taipei", 
                      hour12: false,
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : "-"}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {(currentUser?.role === "SUPER_ADMIN" || 
                        currentUser?.role === "GLOBAL_ADMIN" || 
                        currentUser?.role === "AGENT_OWNER") && (
                        <button
                          onClick={() => router.push(`/admin/promotions/edit/${promotion.id}`)}
                          className="btn-edit"
                        >
                          ✏️ 編輯
                        </button>
                      )}

                      {(currentUser?.role === "SUPER_ADMIN" || 
                        currentUser?.role === "GLOBAL_ADMIN" || 
                        currentUser?.role === "AGENT_OWNER" || 
                        currentUser?.role === "AGENT_SUPPORT") && (
                        <button
                          onClick={() => handleDelete(promotion.id)}
                          className="btn-delete"
                          disabled={deletingId === promotion.id}
                        >
                          {deletingId === promotion.id ? "⏳ 刪除中..." : "🗑️ 刪除"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 無資料顯示 */}
          {!loading && hasSearched && promotions.length === 0 && (
            <div className="no-data">
              <img src="/no-information.webp" alt="無資料" />
              <p>查無符合條件的優惠活動</p>
            </div>
          )}

          {/* 分頁控制 */}
          {renderPagination()}
        </div>
      )}
    </div>
  );
}