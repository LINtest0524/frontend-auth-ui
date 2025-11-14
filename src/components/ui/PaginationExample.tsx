"use client";

import React, { useState } from 'react';
import Pagination from './Pagination';

/**
 * 分頁元件使用範例
 * 展示如何在頁面中整合通用分頁元件
 */
const PaginationExample: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);

  // 模擬資料
  const totalCount = 1250; // 總資料筆數
  const totalPages = Math.ceil(totalCount / pageSize);

  // 處理頁碼變更
  const handlePageChange = (page: number) => {
    setLoading(true);
    console.log(`切換到第 ${page} 頁`);
    
    // 模擬API調用
    setTimeout(() => {
      setCurrentPage(page);
      setLoading(false);
      // 在這裡調用你的API，例如：
      // fetchData(page, pageSize);
    }, 500);
  };

  // 處理每頁筆數變更
  const handlePageSizeChange = (newPageSize: number) => {
    setLoading(true);
    console.log(`每頁顯示筆數改為 ${newPageSize}`);
    
    // 重新計算當前頁碼，確保不超過總頁數
    const newTotalPages = Math.ceil(totalCount / newPageSize);
    const newCurrentPage = Math.min(currentPage, newTotalPages);
    
    setTimeout(() => {
      setPageSize(newPageSize);
      setCurrentPage(newCurrentPage);
      setLoading(false);
      // 在這裡調用你的API，例如：
      // fetchData(newCurrentPage, newPageSize);
    }, 500);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>分頁元件使用範例</h2>
      
      {/* 模擬資料表格 */}
      <div style={{ 
        background: 'white', 
        border: '1px solid #e5e7eb', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
          {loading ? (
            <div>載入中...</div>
          ) : (
            <div>
              <p>這裡是第 {currentPage} 頁的資料</p>
              <p>每頁顯示 {pageSize} 筆，共 {totalCount} 筆資料</p>
            </div>
          )}
        </div>
      </div>

      {/* 分頁元件 - 基本使用 */}
      <div style={{ marginBottom: '40px' }}>
        <h3>基本分頁（不含每頁筆數選擇器）</h3>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          loading={loading}
        />
      </div>

      {/* 分頁元件 - 完整功能 */}
      <div style={{ marginBottom: '40px' }}>
        <h3>完整分頁（含每頁筆數選擇器）</h3>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          showPageSizeSelector={true}
          pageSizeOptions={[10, 20, 50, 100]}
          loading={loading}
        />
      </div>

      {/* 使用說明 */}
      <div style={{ 
        background: '#f8fafc', 
        border: '1px solid #e5e7eb', 
        borderRadius: '8px',
        padding: '20px',
        marginTop: '40px'
      }}>
        <h3>使用說明</h3>
        <pre style={{ 
          background: 'white', 
          padding: '15px', 
          borderRadius: '6px',
          overflow: 'auto',
          fontSize: '14px'
        }}>
{`// 基本使用
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalCount={totalCount}
  onPageChange={handlePageChange}
/>

// 完整功能
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalCount={totalCount}
  pageSize={pageSize}
  onPageChange={handlePageChange}
  onPageSizeChange={handlePageSizeChange}
  showPageSizeSelector={true}
  pageSizeOptions={[10, 20, 50, 100]}
  loading={loading}
/>`}
        </pre>
      </div>
    </div>
  );
};

export default PaginationExample;