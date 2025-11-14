"use client";

import React from 'react';
import './Pagination.css';

export interface PaginationProps {
  /** 當前頁碼 */
  currentPage: number;
  /** 總頁數 */
  totalPages: number;
  /** 總資料筆數 */
  totalCount: number;
  /** 每頁顯示筆數 */
  pageSize?: number;
  /** 頁碼改變回調 */
  onPageChange: (page: number) => void;
  /** 每頁筆數改變回調（可選） */
  onPageSizeChange?: (pageSize: number) => void;
  /** 是否顯示每頁筆數選擇器 */
  showPageSizeSelector?: boolean;
  /** 每頁筆數選項 */
  pageSizeOptions?: number[];
  /** 載入中狀態 */
  loading?: boolean;
  /** 自定義類名 */
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = false,
  pageSizeOptions = [10, 20, 50, 100],
  loading = false,
  className = ''
}) => {
  // 如果只有一頁或沒有資料，不顯示分頁
  if (totalPages <= 1 || totalCount === 0) return null;

  // 生成頁碼陣列
  const generatePageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];

    if (totalPages <= 10) {
      // 總頁數少於10頁時，顯示所有頁碼
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 總頁數大於10頁時，使用省略號
      pages.push(1);

      const start = Math.max(2, currentPage - 2);
      const end = Math.min(totalPages - 1, currentPage + 2);

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

    return pages;
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage || loading) {
      return;
    }
    onPageChange(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    if (onPageSizeChange && newPageSize !== pageSize) {
      onPageSizeChange(newPageSize);
    }
  };

  const pages = generatePageNumbers();

  return (
    <div className={`pagination-container ${className}`}>
      {/* 每頁筆數選擇器 */}
      {showPageSizeSelector && onPageSizeChange && (
        <div className="pagination-control">
          <label htmlFor="page-limit">每頁顯示：</label>
          <select
            id="page-limit"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="pagination-input"
            disabled={loading}
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      )}

      {/* 分頁資訊和按鈕 */}
      <div className="pagination">
        <div className="pagination-info">
          第 {currentPage} 頁，共 {totalPages} 頁（總計 {totalCount.toLocaleString()} 筆資料）
        </div>

        <div className="pagination-buttons">
          {/* 上一頁按鈕 */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="pagination-btn"
            aria-label="上一頁"
          >
            ⬅️ 上一頁
          </button>

          {/* 頁碼按鈕 */}
          {pages.map((page, idx) =>
            page === "..." ? (
              <span 
                key={`ellipsis-${idx}`} 
                className="pagination-btn pagination-ellipsis"
                aria-hidden="true"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => handlePageChange(page as number)}
                disabled={loading}
                className={`pagination-btn ${currentPage === page ? "active" : ""}`}
                aria-label={`第 ${page} 頁`}
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page}
              </button>
            )
          )}

          {/* 下一頁按鈕 */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="pagination-btn"
            aria-label="下一頁"
          >
            下一頁 ➡️
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;