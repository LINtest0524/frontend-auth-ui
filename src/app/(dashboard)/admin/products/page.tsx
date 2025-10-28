"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/hooks/use-user-store";
import dayjs from "dayjs";
import "@/styles/pages/users.css";
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { toTaiwanDisplayTime, fromDatetimeLocalToTaiwan } from '@/lib/timeUtils';

interface ProductVariant {
  id: number;
  variant_name: string;
  sku: string;
  price: number;
  original_price?: number;
  stock_quantity: number;
  variant_options: Record<string, string>;
  images?: string[];
  is_default: boolean;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  original_price?: number;
  stock_quantity: number;
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
  is_featured: boolean;
  is_visible: boolean;
  category?: {
    id: number;
    name: string;
  };
  company?: {
    id: number;
    name: string;
  };
  thumbnail?: string;
  images?: string[];
  variants?: ProductVariant[];
  created_at: string;
}

interface ProductResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type SortKey = "id" | "name" | "price" | "stock_quantity" | "created_at" | null;
type SortDirection = "asc" | "desc" | null;

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
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
  const [sku, setSku] = useState("");
  const [status, setStatus] = useState("");
  const [featured, setFeatured] = useState("");
  const [visible, setVisible] = useState("");
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

  const quickSetDate = (type: string) => {
    const today = dayjs();
    let fromDate = "";
    let toDate = "";

    switch (type) {
      case "today":
        fromDate = today.startOf('day').format('YYYY-MM-DDTHH:mm');
        toDate = today.endOf('day').format('YYYY-MM-DDTHH:mm');
        break;
      case "yesterday":
        const y = today.subtract(1, "day");
        fromDate = y.startOf('day').format('YYYY-MM-DDTHH:mm');
        toDate = y.endOf('day').format('YYYY-MM-DDTHH:mm');
        break;
      case "3days":
        fromDate = today.subtract(2, "day").startOf('day').format('YYYY-MM-DDTHH:mm');
        toDate = today.endOf('day').format('YYYY-MM-DDTHH:mm');
        break;
      case "7days":
        fromDate = today.subtract(6, "day").startOf('day').format('YYYY-MM-DDTHH:mm');
        toDate = today.endOf('day').format('YYYY-MM-DDTHH:mm');
        break;
      case "thisMonth":
        fromDate = today.startOf("month").format('YYYY-MM-DDTHH:mm');
        toDate = today.endOf("month").format('YYYY-MM-DDTHH:mm');
        break;
      case "lastMonth":
        const last = today.subtract(1, "month");
        fromDate = last.startOf("month").format('YYYY-MM-DDTHH:mm');
        toDate = last.endOf("month").format('YYYY-MM-DDTHH:mm');
        break;
    }

    setCreatedFrom(fromDate);
    setCreatedTo(toDate);
  };

  const clearFilter = () => {
    setName("");
    setSku("");
    setStatus("");
    setFeatured("");
    setVisible("");
    setCreatedFrom("");
    setCreatedTo("");
    setProducts([]);
    setTotalPages(1);
    setTotalCount(0);
    setHasSearched(false);
  };

  const sortProducts = (data: Product[]) => {
    if (!sortKey || !sortDirection) return data;
    return [...data].sort((a, b) => {
      const getValue = (product: Product) => {
        if (sortKey === "created_at") {
          return product[sortKey] ? new Date(product[sortKey]).getTime() : 0;
        }
        if (sortKey === "name") {
          return product[sortKey] || "";
        }
        return (product[sortKey] as number) ?? 0;
      };
      const aVal = getValue(a);
      const bVal = getValue(b);
      
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  };

  const fetchProducts = async (useInitialFilter = false) => {
    if (!Number.isFinite(limit) || !Number.isFinite(page)) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (name) params.append("name", name);
      if (sku) params.append("sku", sku);
      if (status) params.append("status", status);
      if (featured) params.append("is_featured", featured);
      if (visible) params.append("is_visible", visible);

      // 如果是初始載入，使用預設的近3天時間範圍，否則使用篩選條件中的時間
      if (useInitialFilter) {
        const today = dayjs();
        const threeDaysAgo = today.subtract(2, "day").format("YYYY-MM-DD");
        const todayStr = today.format("YYYY-MM-DD");
        params.append("createdFrom", threeDaysAgo + " 00:00:00");
        params.append("createdTo", todayStr + " 23:59:59");
      } else {
        // 使用 datetime-local 格式處理時間
        if (createdFrom && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(createdFrom)) {
          const fromTime = fromDatetimeLocalToTaiwan(createdFrom, false);
          params.append('createdFrom', fromTime);
        }
        
        if (createdTo && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(createdTo)) {
          const toTime = fromDatetimeLocalToTaiwan(createdTo, true);
          params.append('createdTo', toTime);
        }
      }

      params.append("limit", limit.toString());
      params.append("page", page.toString());

      const res = await fetch(`http://localhost:3001/admin/product?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error("取得商品資料失敗");
      
      const result: ProductResponse = await res.json();
      
      // 如果 API 返回分頁資料
      if (result.data) {
        setProducts(sortProducts(result.data));
        setTotalPages(result.totalPages || 1);
        setTotalCount(result.total || result.data.length);
      } else {
        // 如果 API 返回簡單陣列，進行客戶端分頁
        const allData = sortProducts(result as any);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = allData.slice(startIndex, endIndex);
        
        setProducts(paginatedData);
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
    if (hasSearched) fetchProducts();
  }, [limit, page]);

  useEffect(() => {
    setProducts((prev) => sortProducts(prev));
  }, [sortKey, sortDirection]);

  // 頁面載入時自動搜尋近3天資料
  useEffect(() => {
    if (!hasSearched) {
      setHasSearched(true);
      fetchProducts(true); // 使用初始篩選條件
    }
  }, []);

  const handleSearch = () => {
    setHasSearched(true);
    setPage(1);
    fetchProducts();
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
    if (!confirm("確定要刪除這個商品嗎？")) return;

    setDeletingId(id);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:3001/admin/product/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error("刪除失敗");

      setTimeout(() => {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setDeletingId(null);
        // 重新載入資料以更新總數
        fetchProducts();
      }, 500);
    } catch (err) {
      alert("刪除失敗");
      setDeletingId(null);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '上架';
      case 'INACTIVE': return '下架';
      case 'OUT_OF_STOCK': return '缺貨';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#28a745';
      case 'INACTIVE': return '#6c757d';
      case 'OUT_OF_STOCK': return '#dc3545';
      default: return '#6c757d';
    }
  };

  // 獲取商品顯示圖片（優先顯示變體圖片）
  const getProductDisplayImage = (product: Product) => {
    // 如果有變體，優先顯示第一個有圖片的變體的第一張圖片
    if (product.variants && product.variants.length > 0) {
      const variantWithImage = product.variants.find(variant => 
        variant.images && variant.images.length > 0
      );
      if (variantWithImage && variantWithImage.images) {
        return variantWithImage.images[0];
      }
    }
    
    // 如果沒有變體圖片，使用主商品圖片
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    
    // 最後使用縮圖
    return product.thumbnail;
  };

  // 獲取商品庫存顯示
  const getStockDisplay = (product: Product) => {
    // 如果有變體，顯示變體庫存詳情
    if (product.variants && product.variants.length > 0) {
      return (
        <div style={{ fontSize: "12px", lineHeight: "1.4" }}>
          {product.variants.map((variant, index) => {
            const optionsText = Object.entries(variant.variant_options)
              .map(([key, value]) => `${value}`)
              .join(' ');
            
            return (
              <div 
                key={variant.id} 
                style={{ 
                  color: variant.stock_quantity <= 0 ? "#dc3545" : "inherit",
                  marginBottom: index < product.variants!.length - 1 ? "2px" : "0"
                }}
              >
                {optionsText} x {variant.stock_quantity}
              </div>
            );
          })}
        </div>
      );
    }
    
    // 沒有變體時顯示主商品庫存
    return (
      <span style={{ color: product.stock_quantity <= 0 ? "#dc3545" : "inherit" }}>
        {product.stock_quantity}
      </span>
    );
  };

  // 獲取商品價格顯示
  const getPriceDisplay = (product: Product) => {
    // 如果有變體，顯示價格範圍
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants.map(v => v.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      if (minPrice === maxPrice) {
        return (
          <div style={{ fontWeight: "500" }}>${Number(minPrice).toFixed(0)}</div>
        );
      } else {
        return (
          <div style={{ fontWeight: "500" }}>${Number(minPrice).toFixed(0)} - ${Number(maxPrice).toFixed(0)}</div>
        );
      }
    }
    
    // 沒有變體時顯示主商品價格
    return (
      <div>
        <div style={{ fontWeight: "500" }}>${Number(product.price).toFixed(0)}</div>
        {product.original_price && product.original_price > product.price && (
          <div style={{ fontSize: "12px", color: "#6c757d", textDecoration: "line-through" }}>
            ${Number(product.original_price).toFixed(0)}
          </div>
        )}
      </div>
    );
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
          第 {page} 頁，共 {totalPages} 頁（總計 {totalCount} 筆商品）
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
    <div className="users-container">
      {/* 頁面標題區域 */}
      <div className="users-header">
        <h1>🛍️ 商品管理</h1>
        <div className="users-header-actions">
          {(currentUser?.role === "SUPER_ADMIN" || 
            currentUser?.role === "GLOBAL_ADMIN" || 
            currentUser?.role === "AGENT_OWNER" ||
            currentUser?.role === "AGENT_LEVEL_1") && (
            <button
              onClick={() => router.push("/admin/products/new")}
              className="btn-search"
              style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}
            >
              ➕ 新增商品
            </button>
          )}
          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
            📦 管理商品資料、庫存與狀態
          </div>
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
                <label htmlFor="product-name" className="form-label">商品名稱</label>
                <input 
                  type="text" 
                  id="product-name"
                  placeholder="請輸入商品名稱" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="form-input" 
                />
              </div>

              <div className="form-group">
                <label htmlFor="product-sku" className="form-label">SKU</label>
                <input 
                  type="text" 
                  id="product-sku"
                  placeholder="請輸入 SKU" 
                  value={sku} 
                  onChange={(e) => setSku(e.target.value)} 
                  className="form-input" 
                />
              </div>

              <div className="form-group">
                <label htmlFor="status-select" className="form-label">商品狀態</label>
                <select 
                  id="status-select" 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)} 
                  className="form-select"
                >
                  <option value="">全部狀態</option>
                  <option value="ACTIVE">🟢 上架</option>
                  <option value="INACTIVE">🔴 下架</option>
                  <option value="OUT_OF_STOCK">⚠️ 缺貨</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="featured-select" className="form-label">精選商品</label>
                <select 
                  id="featured-select" 
                  value={featured} 
                  onChange={(e) => setFeatured(e.target.value)} 
                  className="form-select"
                >
                  <option value="">全部</option>
                  <option value="true">⭐ 是</option>
                  <option value="false">➖ 否</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="visible-select" className="form-label">前台顯示</label>
                <select 
                  id="visible-select" 
                  value={visible} 
                  onChange={(e) => setVisible(e.target.value)} 
                  className="form-select"
                >
                  <option value="">全部</option>
                  <option value="true">👁️ 顯示</option>
                  <option value="false">🙈 隱藏</option>
                </select>
              </div>
            </div>

            <div className="filter-row">
              <div className="form-group date-range-group">
                <label className="form-label">建立時間範圍</label>
                <div className="date-inputs">
                  <DateTimePicker
                    value={createdFrom}
                    onChange={(value) => setCreatedFrom(value)}
                    placeholder="開始時間"
                    className="form-input"
                  />
                  <span className="date-separator">至</span>
                  <DateTimePicker
                    value={createdTo}
                    onChange={(value) => setCreatedTo(value)}
                    placeholder="結束時間"
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

      {/* 載入狀態 */}
      {loading && (
        <div className="loading-spinner">
          <div>⏳ 載入中...</div>
        </div>
      )}

      {error && (
        <div className="content-section" style={{ padding: '20px', textAlign: 'center', color: '#dc2626' }}>
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
                  setPage(1);
                }}
                className="btn-search"
              >
                套用
              </button>
            </div>

            <div className="pagination-info">
              共 {totalCount} 筆商品
            </div>
          </div>

          {/* 現代化表格 */}
          <table className="modern-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort("id")}>
                  ID <span className={`sort-icon ${sortKey === "id" ? "active" : ""}`}>{getArrow("id")}</span>
                </th>
                <th className="w30">商品資訊</th>
                <th>分類</th>
                <th onClick={() => toggleSort("price")}>
                  價格 <span className={`sort-icon ${sortKey === "price" ? "active" : ""}`}>{getArrow("price")}</span>
                </th>
                <th onClick={() => toggleSort("stock_quantity")}>
                  庫存 <span className={`sort-icon ${sortKey === "stock_quantity" ? "active" : ""}`}>{getArrow("stock_quantity")}</span>
                </th>
                <th>狀態</th>
                <th>設定</th>
                <th onClick={() => toggleSort("created_at")}>
                  建立時間 <span className={`sort-icon ${sortKey === "created_at" ? "active" : ""}`}>{getArrow("created_at")}</span>
                </th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>#{product.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {(() => {
                        const displayImage = getProductDisplayImage(product);
                        return displayImage ? (
                          <img 
                            src={`http://localhost:3001${displayImage}`} 
                            alt={product.name}
                            style={{width: "56px", height: "56px", objectFit: "cover", borderRadius: "8px", flexShrink: 0}}
                          />
                        ) : (
                          <div style={{width: "56px", height: "56px", backgroundColor: "#f3f4f6", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0}}>
                            📦
                          </div>
                        );
                      })()}
                      <div>
                        <div style={{fontWeight: "600", color: "#1f2937", marginBottom: "4px"}}>{product.name}</div>
                        <div style={{fontFamily: "monospace", fontSize: "12px", color: "#6b7280", marginBottom: "2px"}}>SKU: {product.sku}</div>
                        {product.variants && product.variants.length > 0 && (
                          <div style={{fontSize: "11px", color: "#8b5cf6", fontWeight: "500"}}>
                            🔄 {product.variants.length} 個變體
                          </div>
                        )}
                        {product.company && (
                          <div style={{fontSize: "11px", color: "#6b7280"}}>
                            🏢 {product.company.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="status-badge" style={{
                      background: product.category ? '#e0f2fe' : '#f3f4f6',
                      color: product.category ? '#0277bd' : '#6b7280'
                    }}>
                      {product.category?.name || "未分類"}
                    </span>
                  </td>
                  <td style={{textAlign: "right"}}>
                    {getPriceDisplay(product)}
                  </td>
                  <td style={{textAlign: "center"}}>
                    {getStockDisplay(product)}
                  </td>
                  <td>
                    <span className={`status-badge ${
                      product.status === 'ACTIVE' ? 'status-active' : 
                      product.status === 'OUT_OF_STOCK' ? 'status-banned' : 'status-inactive'
                    }`}>
                      {product.status === 'ACTIVE' ? '🟢 上架' : 
                       product.status === 'OUT_OF_STOCK' ? '⚠️ 缺貨' : '🔴 下架'}
                    </span>
                  </td>
                  <td>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                      {product.is_featured && (
                        <span className="featured-badge">⭐ 精選</span>
                      )}
                      <span style={{fontSize: '11px', color: product.is_visible ? '#059669' : '#6b7280'}}>
                        {product.is_visible ? '👁️ 顯示' : '🙈 隱藏'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{fontSize: "12px", color: "#6b7280"}}>
                      📅 {product.created_at ? toTaiwanDisplayTime(product.created_at) : "未知"}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => router.push(`/admin/products/${product.id}`)}
                        className="btn-view"
                      >
                        👁️ 查看
                      </button>
                      
                      {(currentUser?.role === "SUPER_ADMIN" || 
                        currentUser?.role === "GLOBAL_ADMIN" || 
                        currentUser?.role === "AGENT_OWNER" ||
                        currentUser?.role === "AGENT_LEVEL_1") && (
                        <button
                          onClick={() => router.push(`/admin/products/edit/${product.id}`)}
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
                          onClick={() => handleDelete(product.id)}
                          className={`btn-delete ${
                            deletingId === product.id ? "opacity-50 pointer-events-none" : ""
                          }`}
                          disabled={deletingId === product.id}
                        >
                          {deletingId === product.id ? "🗑️ 刪除中..." : "🗑️ 刪除"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 無資料顯示 */}
          {!loading && hasSearched && products.length === 0 && (
            <div className="no-data">
              <img src="/no-information.webp" alt="無資料" />
              <p>查無符合條件的商品資料</p>
            </div>
          )}

          {/* 分頁控制 */}
          {renderPagination()}
        </div>
      )}
    </div>
  );
}