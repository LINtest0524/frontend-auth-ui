'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import '@/styles/pages/commission-condition-audit-logs.css';
import { 
  commissionConditionAuditLogsApi,
  CommissionConditionAuditLog,
  CommissionConditionAuditLogQuery
} from '@/lib/api/commission-condition-audit-logs';

export default function CommissionConditionAuditLogsPage() {
  const searchParams = useSearchParams();
  const targetId = searchParams.get('targetId'); // 從URL獲取分潤方案ID
  
  const [auditLogs, setAuditLogs] = useState<CommissionConditionAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<CommissionConditionAuditLogQuery>({
    page: 1,
    limit: 20,
    targetId: targetId || undefined, // 設置特定分潤方案ID
  });

  // 載入操作記錄
  const loadAuditLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await commissionConditionAuditLogsApi.list(filters);
      
      setAuditLogs(response.items);
      setTotal(response.total);
      setHasSearched(true);
    } catch (error) {
      console.error('載入操作記錄失敗:', error);
      setError('載入操作記錄失敗，請稍後再試');
      setAuditLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // 初始載入
  useEffect(() => {
    loadAuditLogs();
  }, [filters]);

  // 格式化操作類型樣式
  const getActionClass = (action: string) => {
    switch (action) {
      case 'CREATE': return 'action-create';
      case 'UPDATE': return 'action-update';
      case 'DELETE': return 'action-delete';
      default: return 'action-default';
    }
  };

  // 格式化時間 - 24小時制
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false // 使用24小時制
    });
  };

  // 換頁處理
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // 每頁顯示筆數變更
  const handleLimitChange = (newLimit: number) => {
    setFilters(prev => ({ ...prev, page: 1, limit: newLimit }));
  };

  const totalPages = Math.ceil(total / filters.limit);

  return (
    <div className="audit-logs-page">
      {/* 頁面標題 */}
      <div className="page-header">
        <h1>經手人</h1>
      </div>


      {/* 資料表格 */}
      <div className="table-section">
        <div className="table-card">
          <div className="table-header">
            <div className="table-info">
              <h2>操作記錄列表</h2>
              <span className="result-count">
                {hasSearched ? `共 ${total} 筆記錄` : ''}
              </span>
            </div>
            <div className="table-controls">
              <div className="per-page-selector">
                <label>每頁顯示：</label>
                <select 
                  value={filters.limit} 
                  onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                  className="per-page-select"
                >
                  <option value={10}>10 筆</option>
                  <option value={20}>20 筆</option>
                  <option value={50}>50 筆</option>
                  <option value={100}>100 筆</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>載入中...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>❌ {error}</p>
              <button onClick={loadAuditLogs} className="retry-button">
                重新載入
              </button>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>修改時間</th>
                      <th>經手人</th>
                      <th>狀態</th>
                      <th>異動資料</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="datetime-cell">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="operator-cell">
                          <div className="operator-info">
                            <span className="operator-name">{log.operator}</span>
                            <span className="operator-role">({log.operatorRole})</span>
                          </div>
                        </td>
                        <td className="action-cell">
                          <span className={`action-badge ${getActionClass(log.action)}`}>
                            {commissionConditionAuditLogsApi.formatAction(log.action)}
                          </span>
                        </td>
                        <td className="changes-cell">
                          <div className="changes-content">
                            {!targetId && (
                              <div className="target-name">{log.targetName}</div>
                            )}
                            <div className="changes-detail">
                              {commissionConditionAuditLogsApi.formatChanges(log.changes)}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 分頁元件 */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={filters.page === 1}
                    className="pagination-button"
                  >
                    第一頁
                  </button>
                  <button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1}
                    className="pagination-button"
                  >
                    上一頁
                  </button>
                  
                  <div className="pagination-info">
                    第 {filters.page} 頁，共 {totalPages} 頁
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page === totalPages}
                    className="pagination-button"
                  >
                    下一頁
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={filters.page === totalPages}
                    className="pagination-button"
                  >
                    最後一頁
                  </button>
                </div>
              )}

              {!loading && auditLogs.length === 0 && (
                <div className="empty-state">
                  <p>📋 尚無操作記錄</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 返回按鈕 */}
      <div className="return-section">
        <button
          onClick={() => window.location.href = '/admin/agents/commission-condition'}
          className="return-button"
        >
          ← 返回分潤管理
        </button>
      </div>
    </div>
  );
}