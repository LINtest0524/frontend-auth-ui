'use client';

import { useEffect, useState } from 'react';
import '@/styles/pages/audit-log.css';

interface BalanceOperationLog {
  id: number;
  ip: string;
  platform: string;
  action: string;
  target: string;
  before: {
    balance: number;
    username: string;
    userId: number;
  };
  after: {
    balance: number;
    username: string;
    userId: number;
  };
  created_at: string;
  user: {
    id: number;
    username: string;
  } | null;
}

export default function BalanceOperationsPage() {
  const [logs, setLogs] = useState<BalanceOperationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    search: '',
    user: '',
    targetUser: '',
    ip: '',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search: filters.search || '餘額', // 搜尋包含「餘額」的操作
        exclude: '簽到', // 排除簽到活動
        ...Object.fromEntries(Object.entries(filters).filter(([key, value]) => value && key !== 'search'))
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/audit-log?${params}`, {
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
      targetUser: '',
      ip: '',
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

  const formatBalance = (balance: number) => {
    return balance.toLocaleString('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    });
  };

  const getOperationType = (action: string) => {
    // 這裡應該不會再出現簽到活動了，但如果出現就歸類為其他
    if (action.includes('簽到') || action.includes('checkin')) return { type: '其他操作', class: 'operation-other' };
    
    // 檢查具體的操作類型
    if (action.includes('購買') || action.includes('消費')) return { type: '購買商品', class: 'operation-purchase' };
    if (action.includes('提現') || action.includes('withdraw')) return { type: '提現', class: 'operation-withdraw' };
    if (action.includes('充值') || action.includes('deposit')) return { type: '充值', class: 'operation-deposit' };
    
    // 管理員直接操作
    if (action.includes('存款') || action.includes('ADD')) return { type: '管理員存款', class: 'operation-deposit' };
    if (action.includes('扣款') || action.includes('DEDUCT')) return { type: '管理員扣款', class: 'operation-withdraw' };
    if (action.includes('調整') || action.includes('ADJUST')) return { type: '管理員調整', class: 'operation-adjust' };
    if (action.includes('餘額')) return { type: '餘額調整', class: 'operation-adjust' };
    
    return { type: '未知', class: 'operation-unknown' };
  };

  const getBalanceChange = (before: number, after: number) => {
    const change = after - before;
    const isPositive = change > 0;
    return {
      amount: Math.abs(change),
      isPositive,
      formatted: `${isPositive ? '+' : '-'}${Math.abs(change).toLocaleString('zh-TW')}`
    };
  };

  const formatPlatform = (platform: string) => {
    // 平台/裝置中文化映射
    const platformMap: Record<string, string> = {
      'Checkin System': '簽到系統',
      'Web Browser': '網頁瀏覽器',
      'Mobile App': '手機應用',
      'Admin Panel': '管理後台',
      'API': 'API介面',
      'System': '系統',
      'Backend': '後台系統'
    };
    
    return platformMap[platform] || platform;
  };

  // 移除自動載入，需要手動搜尋
  // useEffect(() => {
  //   fetchLogs();
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
                <label className="form-label">操作描述</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="搜尋操作內容，例如：存款、扣款、調整"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">操作管理員</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="輸入管理員帳號"
                  value={filters.user}
                  onChange={(e) => setFilters(prev => ({ ...prev, user: e.target.value }))}
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
                <label className="form-label">IP 位址</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="輸入 IP"
                  value={filters.ip}
                  onChange={(e) => setFilters(prev => ({ ...prev, ip: e.target.value }))}
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
                  <th>操作管理員</th>
                  <th>操作類型</th>
                  <th>目標會員</th>
                  <th>操作前餘額</th>
                  <th>操作後餘額</th>
                  <th>變動金額</th>
                  <th>IP 位址</th>
                  <th>裝置</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                    const operation = getOperationType(log.action);
                    const balanceChange = getBalanceChange(log.before?.balance || 0, log.after?.balance || 0);
                    
                    return (
                      <tr key={log.id}>
                        <td className="time-cell">
                          {new Date(log.created_at).toLocaleString('zh-TW', {
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
                            <span className="admin-name">{log.user?.username || '未知管理員'}</span>
                            <span className="admin-id">ID: {log.user?.id || 'N/A'}</span>
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
                              {log.before?.username || log.after?.username || '未知帳號'}
                            </span>
                            <span className="target-id">
                              ID: {log.before?.userId || log.after?.userId || 
                                   (log.target && log.target.includes(':') ? log.target.split(':')[1] : 'N/A')}
                            </span>
                          </div>
                        </td>
                        <td className="balance-cell">
                          <span className="balance-amount">
                            {formatBalance(log.before?.balance || 0)}
                          </span>
                        </td>
                        <td className="balance-cell">
                          <span className="balance-amount">
                            {formatBalance(log.after?.balance || 0)}
                          </span>
                        </td>
                        <td className="change-cell">
                          <span className={`change-amount ${balanceChange.isPositive ? 'positive' : 'negative'}`}>
                            {balanceChange.formatted}
                          </span>
                        </td>
                        <td className="ip-cell">{log.ip}</td>
                        <td className="platform-cell">{formatPlatform(log.platform)}</td>
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