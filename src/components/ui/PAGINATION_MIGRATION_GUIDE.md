# 分頁元件遷移指南

## 📋 概述

我們已經創建了一個通用的分頁元件 `Pagination`，用來統一所有頁面的分頁UI和行為，提供一致的使用者體驗。

## 🎯 元件特點

### ✅ **功能特色**
- **一致的UI設計** - 基於 users 頁面的最佳實作
- **響應式設計** - 支援手機和桌面版
- **無障礙支援** - 符合 ARIA 標準
- **載入狀態** - 支援載入中的視覺回饋
- **靈活配置** - 可選的每頁筆數選擇器
- **深色模式** - 自動支援深色主題

### 🔧 **Props 說明**
```typescript
interface PaginationProps {
  currentPage: number;           // 當前頁碼 (必須)
  totalPages: number;           // 總頁數 (必須)  
  totalCount: number;           // 總資料筆數 (必須)
  pageSize?: number;            // 每頁顯示筆數 (預設: 20)
  onPageChange: (page: number) => void;  // 頁碼改變回調 (必須)
  onPageSizeChange?: (pageSize: number) => void;  // 每頁筆數改變回調
  showPageSizeSelector?: boolean;  // 是否顯示每頁筆數選擇器 (預設: false)
  pageSizeOptions?: number[];      // 每頁筆數選項 (預設: [10,20,50,100])
  loading?: boolean;              // 載入中狀態 (預設: false)
  className?: string;             // 自定義類名
}
```

## 🚀 **使用方式**

### 1. **基本使用**
```tsx
import Pagination from '@/components/ui/Pagination';

<Pagination
  currentPage={page}
  totalPages={totalPages}
  totalCount={totalCount}
  onPageChange={setPage}
/>
```

### 2. **完整功能**
```tsx
<Pagination
  currentPage={page}
  totalPages={totalPages}
  totalCount={totalCount}
  pageSize={pageSize}
  onPageChange={setPage}
  onPageSizeChange={setPageSize}
  showPageSizeSelector={true}
  loading={loading}
/>
```

## 📝 **遷移步驟**

### Step 1: 引入分頁元件
```tsx
import Pagination from '@/components/ui/Pagination';
```

### Step 2: 移除原有分頁程式碼
找到並移除頁面中的：
- `renderPagination()` 函式
- 分頁相關的 JSX
- 頁面特定的分頁樣式

### Step 3: 添加新的分頁元件
在資料表格下方添加：
```tsx
<Pagination
  currentPage={page}
  totalPages={totalPages}
  totalCount={totalCount}
  onPageChange={setPage}
  // 根據需求添加其他 props
/>
```

### Step 4: 清理不需要的CSS
移除頁面專屬的分頁樣式，保留業務邏輯相關樣式。

## 🔄 **遷移範例**

### **遷移前** (原有分頁實作)
```tsx
// ❌ 原有的分頁實作
const renderPagination = () => {
  if (totalPages <= 1) return null;
  
  return (
    <div className="pagination">
      <div className="pagination-info">
        第 {page} 頁，共 {totalPages} 頁（總計 {totalCount} 筆）
      </div>
      <div className="pagination-buttons">
        <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
          上一頁
        </button>
        {/* 頁碼按鈕 */}
        <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
          下一頁
        </button>
      </div>
    </div>
  );
};

return (
  <div>
    {/* 資料表格 */}
    <table>...</table>
    
    {/* 原有分頁 */}
    {renderPagination()}
  </div>
);
```

### **遷移後** (使用通用元件)
```tsx
// ✅ 使用通用分頁元件
import Pagination from '@/components/ui/Pagination';

return (
  <div>
    {/* 資料表格 */}
    <table>...</table>
    
    {/* 通用分頁元件 */}
    <Pagination
      currentPage={page}
      totalPages={totalPages}
      totalCount={totalCount}
      onPageChange={setPage}
      showPageSizeSelector={true}
      onPageSizeChange={setPageSize}
      loading={loading}
    />
  </div>
);
```

## 📊 **需要遷移的頁面清單**

以下頁面建議優先遷移：

### 🔥 **高優先級**
- [ ] `/admin/agents` - 代理商管理
- [ ] `/admin/orders` - 訂單管理  
- [ ] `/admin/products` - 產品管理
- [ ] `/admin/news` - 新聞管理

### ⚡ **中優先級**
- [ ] `/admin/banners` - 橫幅管理
- [ ] `/admin/promotions` - 促銷管理
- [ ] `/admin/coupons` - 優惠券管理
- [ ] `/admin/blacklists` - 黑名單管理

### 📋 **低優先級**
- [ ] `/admin/audit-logs` - 審計日誌
- [ ] `/admin/game-providers` - 遊戲供應商
- [ ] 其他管理頁面...

## ⚠️ **注意事項**

### 1. **狀態管理**
確保頁面狀態包含必要的分頁資料：
```tsx
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [totalCount, setTotalCount] = useState(0);
const [pageSize, setPageSize] = useState(20);
const [loading, setLoading] = useState(false);
```

### 2. **API 調用**
在 `onPageChange` 和 `onPageSizeChange` 中調用資料載入：
```tsx
const handlePageChange = (newPage: number) => {
  setPage(newPage);
  fetchData(newPage, pageSize);  // 重新載入資料
};

const handlePageSizeChange = (newPageSize: number) => {
  setPageSize(newPageSize);
  setPage(1);  // 重設到第一頁
  fetchData(1, newPageSize);  // 重新載入資料
};
```

### 3. **CSS 衝突**
移除頁面專屬的分頁樣式，避免與通用元件衝突：
```css
/* ❌ 移除這些樣式 */
.pagination { ... }
.pagination-btn { ... }
.pagination-info { ... }
```

## 🎨 **自定義樣式**

如果需要特殊樣式，可以透過 `className` prop：

```tsx
<Pagination
  className="custom-pagination"
  // ... 其他 props
/>
```

```css
.custom-pagination .pagination {
  background: #your-color;
  /* 你的自定義樣式 */
}
```

## 🧪 **測試建議**

遷移後請測試：
1. ✅ 分頁按鈕功能正常
2. ✅ 每頁筆數變更功能
3. ✅ 載入狀態顯示
4. ✅ 響應式設計
5. ✅ 無障礙支援
6. ✅ 邊界情況（第一頁、最後一頁、只有一頁）

## 🆘 **獲取幫助**

如果遷移過程中遇到問題，可以：
1. 參考 `users` 頁面的實作
2. 查看 `PaginationExample.tsx` 範例
3. 檢查 `Pagination.tsx` 元件原始碼
4. 向開發團隊尋求協助

---

**建議**: 一次遷移一個頁面，確保功能正常後再進行下一個頁面的遷移。