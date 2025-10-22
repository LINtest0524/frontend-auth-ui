'use client';

import { useEffect, useMemo, useState } from 'react';
import { toCsv, downloadCsv, formatDateTime } from '@/lib/csv';
import { getUser } from '@/lib/useAuth';
import { useCompanySlug } from '@/hooks/useCompanySlug';
import "@/styles/pages/users.css"; // 沿用現有的樣式

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

type BetRow = {
  id?: string;
  createdAt?: string;
  playerId: string;
  roundId: string;
  gameId: string;
  betAmount: number;
  betPayload: any;
  clientTxnId?: string | null;
  sessionToken?: string;
  status?: string;
};

export default function BetsReportPage() {
  const [playerId, setPlayerId] = useState('');
  const [limit, setLimit] = useState(50);
  const companySlug = useCompanySlug();
  const [rows, setRows] = useState<BetRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // 日期篩選
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [gameIdFilter, setGameIdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  async function loadData() {
    // 檢查是否至少有一個搜尋條件
    if (!playerId.trim() && !gameIdFilter && !statusFilter && !dateFrom && !dateTo) {
      setError('請至少設定一個搜尋條件');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      const params = new URLSearchParams();
      if (playerId.trim()) {
        params.append('playerId', playerId.trim());
      }
      params.append('limit', limit.toString());
      
      if (dateFrom) params.append('dateFrom', dateFrom + ' 00:00:00');
      if (dateTo) params.append('dateTo', dateTo + ' 23:59:59');
      if (gameIdFilter) params.append('gameId', gameIdFilter);
      if (statusFilter) params.append('status', statusFilter);

      const url = `${API_BASE}/mock-games/history/bets?${params.toString()}`;
      console.log('API 請求:', url);
      
      const res = await fetch(url, { cache: 'no-store' });
      
      if (!res.ok) {
        throw new Error(`API 錯誤: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('API 回應:', data);
      
      if (Array.isArray(data)) {
        setRows(data);
      } else if (data.items && Array.isArray(data.items)) {
        setRows(data.items);
      } else {
        setRows([]);
      }
    } catch (e: any) {
      console.error('載入下注歷史失敗:', e);
      setError(e.message || '載入失敗');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  // 處理搜尋
  const handleSearch = () => {
    loadData();
  };

  // 重置篩選
  const clearFilter = () => {
    // 重置時，如果有登入用戶，預設使用該用戶 ID
    const user = getUser(companySlug);
    const defaultPlayerId = user ? (user.username || user.id.toString()) : '';
    setPlayerId(defaultPlayerId);
    setDateFrom('');
    setDateTo('');
    setGameIdFilter('');
    setStatusFilter('');
    setRows([]);
    setError(null);
    setHasSearched(false);
  };

  // 快速設定日期
  const quickSetDate = (type: string) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    
    switch (type) {
      case 'today':
        setDateFrom(formatDate(today));
        setDateTo(formatDate(today));
        break;
      case 'yesterday':
        setDateFrom(formatDate(yesterday));
        setDateTo(formatDate(yesterday));
        break;
      case '3days':
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        setDateFrom(formatDate(threeDaysAgo));
        setDateTo(formatDate(today));
        break;
      case 'thisMonth':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        setDateFrom(formatDate(monthStart));
        setDateTo(formatDate(today));
        break;
      case 'lastMonth':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        setDateFrom(formatDate(lastMonthStart));
        setDateTo(formatDate(lastMonthEnd));
        break;
    }
  };

  // 生成 CSV 資料
  const csv = useMemo(() => {
    const normalized = rows.map(r => ({
      '建立時間': formatDateTime(r.createdAt),
      '玩家ID': r.playerId,
      '回合ID': r.roundId,
      '遊戲ID': r.gameId,
      '下注金額': r.betAmount,
      '交易ID': r.clientTxnId || '',
      '狀態': r.status || '',
      '下注內容': JSON.stringify(r.betPayload || {}),
      'Session Token': r.sessionToken || '',
    }));
    return toCsv(normalized);
  }, [rows]);

  // 匯出 CSV
  const handleExport = () => {
    if (!rows.length) {
      alert('沒有資料可以匯出');
      return;
    }
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '_');
    const playerPart = playerId ? `_${playerId}` : '_all';
    const filename = `下注歷史${playerPart}_${timestamp}.csv`;
    downloadCsv(filename, csv);
  };

  // 篩選狀態
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="users-container">
      {/* 頁面標題區域 */}
      <div className="users-header">
        <h1>🎲 下注歷史報表</h1>
        <div className="users-header-actions">
          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
            📊 查看和匯出玩家的下注記錄
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
                <label htmlFor="player-id" className="form-label">玩家 ID</label>
                <input 
                  type="text"
                  id="player-id"
                  placeholder="請輸入玩家 ID" 
                  value={playerId} 
                  onChange={e => setPlayerId(e.target.value)}
                  className="form-input" 
                />
              </div>

              <div className="form-group">
                <label htmlFor="game-filter" className="form-label">遊戲類型</label>
                <select 
                  id="game-filter"
                  value={gameIdFilter} 
                  onChange={e => setGameIdFilter(e.target.value)}
                  className="form-select"
                >
                  <option value="">全部遊戲</option>
                  <option value="DICE">🎰 WM真人 - 骰子遊戲</option>
                  <option value="HI_LO">🎮 RG電子 - 猜大小</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="status-filter" className="form-label">下注狀態</label>
                <select 
                  id="status-filter"
                  value={statusFilter} 
                  onChange={e => setStatusFilter(e.target.value)}
                  className="form-select"
                >
                  <option value="">全部狀態</option>
                  <option value="ACCEPTED">✅ 已接受</option>
                  <option value="CONFIRMED">🎯 已確認</option>
                  <option value="PENDING">⏳ 處理中</option>
                  <option value="FAILED">❌ 失敗</option>
                  <option value="REJECTED">🚫 已拒絕</option>
                </select>
              </div>
            </div>

            <div className="filter-row">
              <div className="form-group date-range-group">
                <label htmlFor="date-from" className="form-label">下注時間範圍</label>
                <div className="date-inputs">
                  <input 
                    type="date" 
                    id="date-from"
                    value={dateFrom} 
                    onChange={e => setDateFrom(e.target.value)}
                    className="form-input" 
                  />
                  <span className="date-separator">至</span>
                  <input 
                    type="date" 
                    value={dateTo} 
                    onChange={e => setDateTo(e.target.value)}
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

      {/* 錯誤訊息 */}
      {error && !loading && (
        <div className="error-section">
          <div className="error-content">
            <span>❌ {error}</span>
          </div>
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
                value={limit}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val) && val > 0) setLimit(val);
                }}
                min={1}
                max={500}
                className="pagination-input"
              />
              <button
                onClick={handleSearch}
                className="btn-search"
              >
                套用
              </button>
            </div>

            <div className="export-control">
              <button
                onClick={handleExport}
                disabled={!rows.length}
                className="btn-search"
              >
                📥 匯出 CSV ({rows.length} 筆)
              </button>
            </div>

            <div className="pagination-info">
              共 {rows.length} 筆資料
              {rows.length > 0 && (
                <span className="summary-info">
                  | 總下注: {rows.reduce((sum, r) => sum + Number(r.betAmount || 0), 0).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* 現代化表格 */}
          <table className="modern-table">
            <thead>
              <tr>
                <th>建立時間</th>
                <th>玩家 ID</th>
                <th>回合 ID</th>
                <th>遊戲 ID</th>
                <th>下注金額</th>
                <th>遊戲回合</th>
                <th>狀態</th>
                <th>下注內容</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="no-data">
                    📭 沒有找到符合條件的資料
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={row.id || row.roundId || index}>
                    <td className="datetime-cell">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="highlight-cell">{row.playerId}</td>
                    <td className="code-cell">{row.roundId}</td>
                    <td className="highlight-cell">{row.gameId}</td>
                    <td className="amount-cell">
                      {row.betAmount.toLocaleString()}
                    </td>
                    <td className="code-cell">{row.sessionToken ? row.sessionToken.slice(-8) : '-'}</td>
                    <td className="status-cell">
                      <span className={`status-badge ${
                        row.status === 'ACCEPTED' ? 'status-active' :
                        row.status === 'CONFIRMED' ? 'status-active' :
                        row.status === 'PENDING' ? 'status-pending' :
                        row.status === 'FAILED' ? 'status-banned' :
                        row.status === 'REJECTED' ? 'status-banned' : 'status-inactive'
                      }`}>
                        {row.status === 'ACCEPTED' ? '已接受' :
                         row.status === 'CONFIRMED' ? '已確認' :
                         row.status === 'PENDING' ? '處理中' :
                         row.status === 'FAILED' ? '失敗' :
                         row.status === 'REJECTED' ? '已拒絕' : row.status || '-'}
                      </span>
                    </td>
                    <td className="payload-cell">
                      <details>
                        <summary className="payload-summary">查看內容</summary>
                        <div className="payload-content">
                          {row.betPayload ? (
                            <div>
                              {row.gameId === 'DICE' && row.betPayload.sum && (
                                <div>🎲 猜骰子點數: <strong>{row.betPayload.sum}</strong></div>
                              )}
                              {row.gameId === 'HI_LO' && row.betPayload.choice && (
                                <div>📈 猜大小: <strong>{
                                  row.betPayload.choice === 'HIGH' ? '大' :
                                  row.betPayload.choice === 'LOW' ? '小' : row.betPayload.choice
                                }</strong></div>
                              )}
                              {(!row.betPayload.sum && !row.betPayload.choice) && (
                                <pre>{JSON.stringify(row.betPayload, null, 2)}</pre>
                              )}
                            </div>
                          ) : (
                            <span>無資料</span>
                          )}
                        </div>
                      </details>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}