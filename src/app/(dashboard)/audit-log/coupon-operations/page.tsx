'use client';

import { useEffect, useState } from 'react';
import '@/styles/pages/audit-log.css';

interface CouponOperationLog {
  id: number;
  ip: string;
  platform: string;
  action: string;
  target: string;
  before: {
    templateName?: string;
    templateId?: number;
    couponCode?: string;
    couponId?: number;
    targetUser?: string;
    status?: string;
  };
  after: {
    templateName?: string;
    templateId?: number;
    couponCode?: string;
    couponId?: number;
    targetUser?: string;
    status?: string;
  };
  created_at: string;
  user: {
    id: number;
    username: string;
  } | null;
}

export default function CouponOperationsPage() {
  const [logs, setLogs] = useState<CouponOperationLog[]>([]);
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
        search: filters.search || '優惠券', // 搜尋包含「優惠券」的操作
        ...Object.fromEntries(Object.entries(filters).filter(([key, value]) => value && key !== 'search'))
      });

      const res = await fetch(`http://localhost:3001/audit-log?${params}`, {
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
      console.error('後端回傳錯誤:', err);
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

  const getOperationType = (action: string) => {
    // 優先檢查刪除操作（避免被其他關鍵字覆蓋）
    if (action.includes('刪除') || action.includes('DELETE')) return { type: '刪除', class: 'operation-delete' };
    if (action.includes('新增') || action.includes('創建') || action.includes('CREATE')) return { type: '新增', class: 'operation-create' };
    if (action.includes('發放') || action.includes('分發') || action.includes('DISTRIBUTE')) return { type: '發放', class: 'operation-distribute' };
    if (action.includes('兌換') || action.includes('USE')) return { type: '兌換', class: 'operation-use' };
    if (action.includes('優惠券')) return { type: '優惠券操作', class: 'operation-coupon' };
    return { type: '未知', class: 'operation-unknown' };
  };

  const getCouponInfo = (log: CouponOperationLog) => {
    const templateName = log.before?.templateName || log.after?.templateName;
    const couponCode = log.before?.couponCode || log.after?.couponCode;
    const templateId = log.before?.templateId || log.after?.templateId;
    const couponId = log.before?.couponId || log.after?.couponId;

    return {
      name: templateName || couponCode || `模板ID: ${templateId}` || `優惠券ID: ${couponId}` || '未知優惠券',
      id: templateId || couponId || (log.target && log.target.includes(':') ? log.target.split(':')[1] : 'N/A')
    };
  };

  const getTargetUser = (log: CouponOperationLog) => {
    const targetUser = log.before?.targetUser || log.after?.targetUser;
    return targetUser || '系統操作';
  };

  const parseUserAgent = (userAgent: string) => {
    if (!userAgent) return '未知裝置';

    // 解析設備類型
    let deviceType = '電腦';
    if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
      deviceType = /iPad/i.test(userAgent) ? '平板' : '手機';
    }

    // 解析操作系統
    let os = '未知系統';
    if (/Windows NT 10\.0/i.test(userAgent)) {
      os = 'Windows 10';
    } else if (/Windows NT 6\.3/i.test(userAgent)) {
      os = 'Windows 8.1';
    } else if (/Windows NT 6\.1/i.test(userAgent)) {
      os = 'Windows 7';
    } else if (/Macintosh|Mac OS X/i.test(userAgent)) {
      const macMatch = userAgent.match(/Mac OS X ([\d_]+)/);
      if (macMatch) {
        const version = macMatch[1].replace(/_/g, '.');
        os = `macOS ${version}`;
      } else {
        os = 'macOS';
      }
    } else if (/Android ([\d\.]+)/i.test(userAgent)) {
      const androidMatch = userAgent.match(/Android ([\d\.]+)/);
      os = androidMatch ? `Android ${androidMatch[1]}` : 'Android';
    } else if (/iPhone OS ([\d_]+)/i.test(userAgent)) {
      const iosMatch = userAgent.match(/iPhone OS ([\d_]+)/);
      if (iosMatch) {
        const version = iosMatch[1].replace(/_/g, '.');
        os = `iOS ${version}`;
      } else {
        os = 'iOS';
      }
    }

    // 解析瀏覽器
    let browser = '未知瀏覽器';
    if (/Chrome\/([\d\.]+)/i.test(userAgent) && !/Edg/i.test(userAgent)) {
      const chromeMatch = userAgent.match(/Chrome\/([\d\.]+)/);
      browser = chromeMatch ? `Chrome ${chromeMatch[1]}` : 'Chrome';
    } else if (/Firefox\/([\d\.]+)/i.test(userAgent)) {
      const firefoxMatch = userAgent.match(/Firefox\/([\d\.]+)/);
      browser = firefoxMatch ? `Firefox ${firefoxMatch[1]}` : 'Firefox';
    } else if (/Safari\/([\d\.]+)/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
      const safariMatch = userAgent.match(/Version\/([\d\.]+)/);
      browser = safariMatch ? `Safari ${safariMatch[1]}` : 'Safari';
    } else if (/Edg\/([\d\.]+)/i.test(userAgent)) {
      const edgeMatch = userAgent.match(/Edg\/([\d\.]+)/);
      browser = edgeMatch ? `Edge ${edgeMatch[1]}` : 'Edge';
    }

    return `${deviceType} / ${os} / ${browser}`;
  };


  // 移除自動載入，需要手動搜尋
  // useEffect(() => {
  //   fetchLogs();
  // }, []);

  return (
    <div className="audit-log-container">
      <div className="audit-log-header">
        <h1 className="audit-log-title">
          <span className="audit-log-icon">🎫</span>
          優惠券紀錄
        </h1>
        <p className="audit-log-subtitle">
          追蹤後台管理者對優惠券的新增、發放、刪除等操作記錄
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
                  placeholder="搜尋操作內容，例如：新增、發放、刪除"
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
                <label className="form-label">目標用戶</label>
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
                  <th>優惠券資訊</th>
                  <th>目標用戶</th>
                  <th>狀態變化</th>
                  <th>IP 位址</th>
                  <th>裝置</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                    const operation = getOperationType(log.action);
                    const couponInfo = getCouponInfo(log);
                    const targetUser = getTargetUser(log);
                    
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
                        <td className="coupon-cell">
                          <div className="coupon-info">
                            <span className="coupon-name">{couponInfo.name}</span>
                            <span className="coupon-id">ID: {couponInfo.id}</span>
                          </div>
                        </td>
                        <td className="target-user-cell">
                          <span className="target-user">{targetUser}</span>
                        </td>
                        <td className="status-cell">
                          <div className="status-change">
                            {log.before?.status && (
                              <span className="status-before">
                                {log.before.status}
                              </span>
                            )}
                            {log.before?.status && log.after?.status && (
                              <span className="status-arrow">→</span>
                            )}
                            {log.after?.status && (
                              <span className="status-after">
                                {log.after.status}
                              </span>
                            )}
                            {!log.before?.status && !log.after?.status && (
                              <span className="status-none">-</span>
                            )}
                          </div>
                        </td>
                        <td className="ip-cell">{log.ip}</td>
                        <td className="platform-cell">{parseUserAgent(log.platform)}</td>
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