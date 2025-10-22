'use client';

import { useEffect, useState } from 'react';
import '@/styles/pages/audit-log.css';

interface WalletTransaction {
  id: number;
  userId: number;
  companyId: number;
  transactionType: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceId?: string;
  referenceType?: string;
  ipAddress?: string;
  createdBy?: number;
  createdAt: string;
  user?: {
    id: number;
    username: string;
  };
  operator?: {
    id: number;
    username: string;
  };
}

export default function BalanceOperationsPage() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    search: '',
    operator: '',
    targetUser: '',
    transactionType: '',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchTransactions = async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        // 只查詢管理員操作的記錄
        type: 'admin_operations',
        ...Object.fromEntries(Object.entries(filters).filter(([key, value]) => value))
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/wallet-transactions?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`API 錯誤: ${res.status}`);
      }

      const result = await res.json();
      setTransactions(result.data || []);
      setTotalPages(result.totalPages || 1);
      setTotalCount(result.totalCount || 0);
      setCurrentPage(page);
    } catch (err) {
      setTransactions([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchTransactions(1);
  };

  const clearFilters = () => {
    setFilters({
      from: '',
      to: '',
      search: '',
      operator: '',
      targetUser: '',
      transactionType: '',
    });
    setCurrentPage(1);
    setTransactions([]);
    setTotalPages(1);
    setTotalCount(0);
  };

  const quickSetDate = (type: string) => {
    const today = new Date();
    // 使用本地時區的日期格式化，避免時區偏移問題
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    switch (type) {
      case 'today':
        setFilters(prev => ({ ...prev, from: formatDate(today), to: formatDate(today) }));
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        setFilters(prev => ({ ...prev, from: formatDate(yesterday), to: formatDate(yesterday) }));
        break;
      case '3days':
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(today.getDate() - 2);
        setFilters(prev => ({ ...prev, from: formatDate(threeDaysAgo), to: formatDate(today) }));
        break;
      case 'thisMonth':
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setFilters(prev => ({ ...prev, from: formatDate(firstDay), to: formatDate(lastDay) }));
        break;
      case 'lastMonth':
        const lastMonthFirst = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthLast = new Date(today.getFullYear(), today.getMonth(), 0);
        setFilters(prev => ({ ...prev, from: formatDate(lastMonthFirst), to: formatDate(lastMonthLast) }));
        break;
    }
  };

  const formatBalance = (balance: number) => {
    return balance.toLocaleString('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    });
  };

  const getOperationType = (transactionType: string, amount: number) => {
    if (transactionType === 'admin_deposit' || amount > 0) {
      return { type: '管理員存款', class: 'operation-deposit' };
    } else if (transactionType === 'admin_deduction' || amount < 0) {
      return { type: '管理員扣款', class: 'operation-withdraw' };
    } else {
      return { type: '管理員調整', class: 'operation-adjust' };
    }
  };

  const formatAmount = (amount: number) => {
    const isPositive = amount > 0;
    return {
      amount: Math.abs(amount),
      isPositive,
      formatted: `${isPositive ? '+' : '-'}${Math.abs(amount).toLocaleString('zh-TW')}`
    };
  };

  // 移除自動載入，需要手動搜尋
  // useEffect(() => {
  //   fetchTransactions();
  // }, []);

  return (
    <div className="audit-log-container">
      <div className="audit-log-header">
        <h1 className="audit-log-title">
          <span className="audit-log-icon">💰</span>
          存扣款紀錄
        </h1>
        <p className="audit-log-subtitle">
          追蹤後台管理者對會員餘額的手動調整記錄（不包含簽到獎勵、優惠券兌換等自動操作）
        </p>
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
                <label className="form-label">操作類型</label>
                <select
                  className="form-input"
                  value={filters.transactionType}
                  onChange={(e) => setFilters(prev => ({ ...prev, transactionType: e.target.value }))}
                >
                  <option value="">全部類型</option>
                  <option value="admin_deposit">管理員存款</option>
                  <option value="admin_deduction">管理員扣款</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">操作者</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="輸入管理員帳號"
                  value={filters.operator}
                  onChange={(e) => setFilters(prev => ({ ...prev, operator: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">目標會員</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="輸入會員帳號"
                  value={filters.targetUser}
                  onChange={(e) => setFilters(prev => ({ ...prev, targetUser: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">描述關鍵字</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="搜尋操作描述"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="filter-row">
              <div className="form-group date-range-group">
                <label className="form-label">時間範圍</label>
                <div className="date-inputs">
                  <input
                    type="date"
                    value={filters.from}
                    onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}
                    className="form-input"
                  />
                  <span className="date-separator">至</span>
                  <input
                    type="date"
                    value={filters.to}
                    onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}
                    className="form-input"
                  />
                </div>
                <div className="quick-date-buttons">
                  <button onClick={() => quickSetDate("today")} className="btn-quick-date">今日</button>
                  <button onClick={() => quickSetDate("yesterday")} className="btn-quick-date">昨日</button>
                  <button onClick={() => quickSetDate("3days")} className="btn-quick-date">近三日</button>
                  <button onClick={() => quickSetDate("thisMonth")} className="btn-quick-date">本月</button>
                  <button onClick={() => quickSetDate("lastMonth")} className="btn-quick-date">上月</button>
                </div>
              </div>
            </div>

            <div className="filter-actions">
              <button onClick={handleSearch} className="btn-search">🔍 查詢</button>
              <button onClick={clearFilters} className="btn-clear">🗑️ 清除</button>
            </div>
          </div>
        )}
      </div>

      {/* 紀錄表格 */}
      <div className="content-section">
        <div className="table-controls">
          <div className="records-info">
            <span>共 {totalCount} 筆紀錄</span>
          </div>
          <div className="page-info">
            <span>第 {currentPage} 頁，共 {totalPages} 頁</span>
          </div>
        </div>

        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>載入中...</p>
          </div>
        )}

        {!loading && transactions.length === 0 && (
          <div className="no-data">
            <img src="/no-information.webp" alt="無資料" />
            <p>請使用上方篩選條件進行查詢</p>
          </div>
        )}

        {!loading && transactions.length > 0 && (
          <div className="table-container">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>時間</th>
                  <th>操作者</th>
                  <th>操作類型</th>
                  <th>目標會員</th>
                  <th>操作前餘額</th>
                  <th>操作後餘額</th>
                  <th>變動金額</th>
                  <th>操作描述</th>
                  <th>IP 位址</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => {
                    const operation = getOperationType(transaction.transactionType, transaction.amount);
                    const amountFormat = formatAmount(transaction.amount);
                    
                    return (
                      <tr key={transaction.id}>
                        <td className="time-cell">
                          {new Date(transaction.createdAt).toLocaleString('zh-TW', {
                            timeZone: 'Asia/Taipei',
                            hour12: false,
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </td>
                        <td className="admin-cell">
                          <div className="admin-info">
                            <span className="admin-name">{transaction.operator?.username || '系統'}</span>
                            <span className="admin-id">ID: {transaction.createdBy || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="operation-cell">
                          <span className={`operation-badge ${operation.class}`}>
                            {operation.type}
                          </span>
                        </td>
                        <td className="target-cell">
                          <div className="target-info">
                            <span className="target-name">
                              {transaction.user?.username || '未知會員'}
                            </span>
                            <span className="target-id">
                              ID: {transaction.userId}
                            </span>
                          </div>
                        </td>
                        <td className="balance-cell">
                          <span className="balance-amount">
                            {formatBalance(transaction.balanceBefore)}
                          </span>
                        </td>
                        <td className="balance-cell">
                          <span className="balance-amount">
                            {formatBalance(transaction.balanceAfter)}
                          </span>
                        </td>
                        <td className="change-cell">
                          <span className={`change-amount ${amountFormat.isPositive ? 'positive' : 'negative'}`}>
                            {amountFormat.formatted}
                          </span>
                        </td>
                        <td className="description-cell">
                          <span className="description-text" title={transaction.description}>
                            {transaction.description}
                          </span>
                        </td>
                        <td className="ip-cell">{transaction.ipAddress || '-'}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* 分頁控制 */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => fetchTransactions(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              上一頁
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return (
                <button
                  key={page}
                  onClick={() => fetchTransactions(page)}
                  className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => fetchTransactions(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              下一頁
            </button>
          </div>
        )}
      </div>
    </div>
  );
}