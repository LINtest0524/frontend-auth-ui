'use client';

import { useEffect, useState } from 'react';
import '@/styles/pages/audit-log.css';

interface WalletTransactionLog {
  id: number;
  userId: number;
  companyId: number;
  transactionType: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
  user: {
    id: number;
    username: string;
  } | null;
}

export default function WalletTransactionsPage() {
  const [logs, setLogs] = useState<WalletTransactionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    search: '',
    user: '',
    transactionType: '',
    minAmount: '',
    maxAmount: '',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...Object.fromEntries(Object.entries(filters).filter(([key, value]) => value))
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/wallet-transactions/admin/all?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`API 錯誤: ${res.status}`);
      }

      const result = await res.json();
      setLogs(result.data || []);
      setTotalPages(result.totalPages || 1);
      setCurrentPage(page);
    } catch (err) {
      // 後端回傳錯誤，靜默處理
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLogs(1);
  };

  const clearFilters = () => {
    setFilters({
      from: '',
      to: '',
      search: '',
      user: '',
      transactionType: '',
      minAmount: '',
      maxAmount: '',
    });
    setCurrentPage(1);
    setLogs([]);
    setTotalPages(1);
  };

  const quickSetDate = (type: string) => {
    const today = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    
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

  const formatAmount = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '$0';
    }
    // 金額已經是正確的整數，不需要轉換
    return amount.toLocaleString('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    });
  };

  const getTransactionType = (type: string) => {
    const typeMap: Record<string, { name: string; class: string }> = {
      'coupon_redeem': { name: '優惠券兌換', class: 'type-coupon' },
      'checkin_reward': { name: '簽到獎勵', class: 'type-checkin' },
      'manual_recharge': { name: '手動充值', class: 'type-recharge' },
      'admin_adjustment': { name: '管理員調整', class: 'type-admin' },
      'admin_deposit': { name: '管理員存款', class: 'type-admin' },
      'admin_deduct': { name: '管理員扣款', class: 'type-admin' },
      'admin_deduction': { name: '管理員扣款', class: 'type-admin' },
      'purchase': { name: '商品購買', class: 'type-purchase' },
      'withdrawal': { name: '提現', class: 'type-withdrawal' },
      'refund': { name: '退款', class: 'type-refund' },
      'system_bonus': { name: '系統獎勵', class: 'type-bonus' },
      'promotion_reward': { name: '活動獎勵', class: 'type-promotion' },
    };
    
    return typeMap[type] || { name: type, class: 'type-unknown' };
  };

  const getAmountChange = (amount: number | null | undefined) => {
    const safeAmount = amount || 0;
    const isPositive = safeAmount > 0;
    return {
      isPositive,
      formatted: `${isPositive ? '+' : ''}${formatAmount(safeAmount)}`
    };
  };

  const getReferenceInfo = (referenceType: string | null, referenceId: string | null) => {
    // 關聯類型中文化映射
    const referenceTypeMap: Record<string, string> = {
      'checkin_system': '簽到系統',
      'admin_operation': '管理員操作',
      'coupon': '優惠券',
      'purchase': '商品購買',
      'withdrawal': '提現申請',
      'refund': '退款處理',
      'manual': '手動調整',
      'system': '系統操作',
    };

    if (referenceType && referenceId) {
      const typeName = referenceTypeMap[referenceType] || referenceType;
      return (
        <>
          <span className="reference-type">{typeName}</span>
          <span className="reference-id"> ID: {referenceId}</span>
        </>
      );
    } else if (referenceType) {
      const typeName = referenceTypeMap[referenceType] || referenceType;
      return <span className="reference-type">{typeName}</span>;
    } else {
      return <span className="reference-none">-</span>;
    }
  };

  return (
    <div className="audit-log-container">
      <div className="audit-log-header">
        <h1 className="audit-log-title">
          <span className="audit-log-icon">💰</span>
          會員錢包記錄
        </h1>
        <p className="audit-log-subtitle">
          追蹤所有會員錢包交易記錄：簽到獎勵、優惠券兌換、商品購買、充值提現等
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
                <label className="form-label">描述搜尋</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="搜尋交易描述"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">會員帳號</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="輸入會員帳號"
                  value={filters.user}
                  onChange={(e) => setFilters(prev => ({ ...prev, user: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">交易類型</label>
                <select
                  className="form-input"
                  value={filters.transactionType}
                  onChange={(e) => setFilters(prev => ({ ...prev, transactionType: e.target.value }))}
                >
                  <option value="">全部類型</option>
                  <option value="coupon_redeem">優惠券兌換</option>
                  <option value="checkin_reward">簽到獎勵</option>
                  <option value="manual_recharge">手動充值</option>
                  <option value="admin_adjustment">管理員調整</option>
                  <option value="purchase">商品購買</option>
                  <option value="withdrawal">提現</option>
                  <option value="refund">退款</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">金額範圍</label>
                <div className="amount-range">
                  <input
                    type="number"
                    className="form-input"
                    placeholder="最小金額"
                    value={filters.minAmount}
                    onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                  />
                  <span>至</span>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="最大金額"
                    value={filters.maxAmount}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                  />
                </div>
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
            <span>共 {logs.length} 筆紀錄</span>
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

        {!loading && logs.length === 0 && (
          <div className="no-data">
            <img src="/no-information.webp" alt="無資料" />
            <p>請使用上方篩選條件進行查詢</p>
          </div>
        )}

        {!loading && logs.length > 0 && (
          <div className="table-container">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>時間</th>
                  <th>會員</th>
                  <th>交易類型</th>
                  <th>交易描述</th>
                  <th>交易前餘額</th>
                  <th>交易後餘額</th>
                  <th>變動金額</th>
                  <th>關聯資訊</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                    const transactionType = getTransactionType(log.transactionType || '');
                    const amountChange = getAmountChange(log.amount);
                    
                    return (
                      <tr key={log.id}>
                        <td className="time-cell">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString('zh-TW', {
                            timeZone: 'Asia/Taipei',
                            hour12: false,
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          }) : '無效時間'}
                        </td>
                        <td className="user-cell">
                          <div className="user-info">
                            <span className="user-name">{log.user?.username || '未知用戶'}</span>
                            <span className="user-id"> ID: {log.userId}</span>
                          </div>
                        </td>
                        <td className="type-cell">
                          <span className={`type-badge ${transactionType.class}`}>
                            {transactionType.name}
                          </span>
                        </td>
                        <td className="description-cell">
                          <span className="description-text">{log.description}</span>
                        </td>
                        <td className="balance-cell">
                          <span className="balance-amount">
                            {formatAmount(log.balanceBefore || 0)}
                          </span>
                        </td>
                        <td className="balance-cell">
                          <span className="balance-amount">
                            {formatAmount(log.balanceAfter || 0)}
                          </span>
                        </td>
                        <td className="change-cell">
                          <span className={`change-amount ${amountChange.isPositive ? 'positive' : 'negative'}`}>
                            {amountChange.formatted}
                          </span>
                        </td>
                        <td className="reference-cell">
                          <div className="reference-info">
                            {getReferenceInfo(log.referenceType, log.referenceId)}
                          </div>
                        </td>
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
              onClick={() => fetchLogs(Math.max(1, currentPage - 1))}
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
                  onClick={() => fetchLogs(page)}
                  className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => fetchLogs(Math.min(totalPages, currentPage + 1))}
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