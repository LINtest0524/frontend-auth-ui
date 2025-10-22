'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toCsv, downloadCsv, formatDateTime } from '@/lib/csv';
import "@/styles/pages/users.css";
import "@/styles/pages/winloss-report.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

// 遊戲類別配置
const GAME_CATEGORIES = {
  live: {
    name: '真人',
    icon: '🎰',
    providers: [
      { id: 'DICE', name: 'WM真人 - 骰子遊戲', vendor: 'WM' }
    ]
  },
  slot: {
    name: '電子',
    icon: '🎮',
    providers: [
      { id: 'HI_LO', name: 'RG電子 - 猜大小', vendor: 'RG' }
    ]
  }
};

type MemberDetail = {
  id: string;
  roundId: string;
  gameProvider: string;
  gameName: string;
  betTime: string;
  betAmount: number;
  validBetAmount: number;
  payoutAmount: number;
  winLossAmount: number;
  odds: string;
  status: string;
};

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<MemberDetail[]>([]);
  const [allDetails, setAllDetails] = useState<MemberDetail[]>([]); // 存儲所有資料用於統計
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  
  // 篩選條件
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(Object.keys(GAME_CATEGORIES));
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 初始化選中的遊戲供應商
  useEffect(() => {
    const allProviders = selectedCategories.flatMap(catKey => 
      GAME_CATEGORIES[catKey as keyof typeof GAME_CATEGORIES]?.providers.map(p => p.id) || []
    );
    setSelectedProviders(allProviders);
  }, [selectedCategories]);

  // 頁面載入時設定預設日期範圍（30天）
  useEffect(() => {
    if (!dateFrom && !dateTo) {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      setDateFrom(formatDate(thirtyDaysAgo));
      setDateTo(formatDate(today));
    }
  }, []);

  // 載入會員明細數據
  const loadMemberDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 構建查詢參數
      const baseParams = new URLSearchParams();
      baseParams.append('playerId', username);
      
      if (dateFrom) baseParams.append('dateFrom', dateFrom + ' 00:00:00');
      if (dateTo) baseParams.append('dateTo', dateTo + ' 23:59:59');
      baseParams.append('limit', '1000'); // 先取大量資料，前端分頁

      let allRounds: any[] = [];
      
      if (selectedProviders.length > 0) {
        // 為每個選中的遊戲分別查詢該會員的記錄
        for (const provider of selectedProviders) {
          const queryParams = new URLSearchParams(baseParams);
          queryParams.append('gameId', provider);
          
          const response = await fetch(`${API_BASE}/mock-games/history/rounds?${queryParams.toString()}`, {
            cache: 'no-store'
          });
          
          if (response.ok) {
            const data = await response.json();
            const rounds = Array.isArray(data) ? data : (data.items || []);
            allRounds = allRounds.concat(rounds);
          }
        }
      } else {
        // 查詢該會員的所有記錄
        const response = await fetch(`${API_BASE}/mock-games/history/rounds?${baseParams.toString()}`, {
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error(`API 錯誤: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        allRounds = Array.isArray(data) ? data : (data.items || []);
      }

      // 按投注時間排序 - 最新的在前
      allRounds.sort((a, b) => {
        const timeA = new Date(a.settledAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.settledAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      // 轉換為會員明細格式
      const formattedDetails: MemberDetail[] = allRounds.map((round, index) => {
        const betAmount = Number(round.betAmount || 0);
        const winAmount = Number(round.winAmount || 0);
        const payoutAmount = winAmount;
        const winLossAmount = payoutAmount - betAmount;
        
        // 獲取下注時的賠率（根據遊戲類型）
        let odds = '1';
        switch (round.gameId) {
          case 'DICE':
            // 骰子遊戲：大小 1賠1，指定點數 1賠10
            if (round.betPayload && typeof round.betPayload === 'object') {
              const payload = round.betPayload as any;
              if (payload.betType === 'number') {
                odds = '10'; // 指定點數 1賠10
              } else {
                odds = '1'; // 大小 1賠1
              }
            } else {
              odds = '1'; // 預設 1賠1
            }
            break;
          case 'HI_LO':
            // 猜大小固定 1賠1
            odds = '1';
            break;
          default:
            odds = '1';
        }
        
        return {
          id: round.id || `detail_${index}`,
          roundId: round.roundId,
          gameProvider: getGameProviderName(round.gameId),
          gameName: getGameName(round.gameId),
          betTime: round.settledAt || round.createdAt,
          betAmount,
          validBetAmount: betAmount,
          payoutAmount,
          winLossAmount,
          odds,
          status: round.finished ? '已結算' : '待結算'
        };
      });

      // 存儲所有資料用於統計計算
      setAllDetails(formattedDetails);
      
      // 前端分頁
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedDetails = formattedDetails.slice(startIndex, endIndex);

      setDetails(paginatedDetails);
      setTotalCount(formattedDetails.length);
      
    } catch (e: any) {
      setError(e.message || '載入失敗');
      setDetails([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // 初次載入和條件變更時重新載入
  useEffect(() => {
    if (username && dateFrom && dateTo) {
      loadMemberDetails();
    }
  }, [username, dateFrom, dateTo, selectedProviders, page, limit]);

  // 快速設定日期
  const quickSetDate = (type: string) => {
    const today = new Date();
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    switch (type) {
      case 'today':
        setDateFrom(formatDate(today));
        setDateTo(formatDate(today));
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        setDateFrom(formatDate(yesterday));
        setDateTo(formatDate(yesterday));
        break;
      case '7days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        setDateFrom(formatDate(sevenDaysAgo));
        setDateTo(formatDate(today));
        break;
      case '30days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        setDateFrom(formatDate(thirtyDaysAgo));
        setDateTo(formatDate(today));
        break;
    }
    setPage(1); // 重置頁碼
  };

  // 處理遊戲類別選擇
  const handleCategoryChange = (categoryKey: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, categoryKey]);
    } else {
      setSelectedCategories(prev => prev.filter(key => key !== categoryKey));
    }
    setPage(1);
  };

  // 處理遊戲供應商選擇
  const handleProviderChange = (providerId: string, checked: boolean) => {
    if (checked) {
      setSelectedProviders(prev => [...prev, providerId]);
    } else {
      setSelectedProviders(prev => prev.filter(id => id !== providerId));
    }
    setPage(1);
  };

  // 匯出 CSV - 匯出所有資料
  const handleExport = () => {
    if (!allDetails.length) {
      alert('沒有資料可以匯出');
      return;
    }
    
    const csvData = allDetails.map(detail => ({
      '遊戲商': detail.gameProvider,
      '遊戲名稱': detail.gameName,
      '投注時間': formatDateTime(detail.betTime),
      '投注金額': detail.betAmount,
      '有效投注': detail.validBetAmount,
      '派彩金額': detail.payoutAmount,
      '輸贏結果': detail.winLossAmount,
      '賠率': detail.odds,
      '狀態': detail.status
    }));
    
    const csv = toCsv(csvData);
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '_');
    const filename = `${username}_遊戲明細_${timestamp}.csv`;
    downloadCsv(filename, csv);
  };

  // 統計數據 - 基於所有資料計算
  const stats = React.useMemo(() => {
    // 使用所有資料計算統計，而不只是當前頁面
    const totalBetAmount = allDetails.reduce((sum, d) => sum + d.betAmount, 0);
    const totalValidBetAmount = allDetails.reduce((sum, d) => sum + d.validBetAmount, 0);
    const totalWinLossAmount = allDetails.reduce((sum, d) => sum + d.winLossAmount, 0);
    const totalPayoutAmount = allDetails.reduce((sum, d) => sum + d.payoutAmount, 0);
    
    return {
      totalBetAmount,
      totalValidBetAmount,
      totalWinLossAmount,
      totalPayoutAmount,
      betCount: allDetails.length
    };
  }, [allDetails]);

  // 分頁渲染函數（參考 users 頁面的設計）
  const renderPagination = () => {
    const totalPages = Math.ceil(totalCount / limit);
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
          第 {page} 頁，共 {totalPages} 頁（總計 {totalCount} 筆明細）
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
        <h1>👤 會員遊戲明細 - {username}</h1>
        <div className="users-header-actions">
          <button 
            onClick={() => router.back()}
            className="btn-search"
          >
            ← 返回輸贏報表
          </button>
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
            {/* 日期範圍 */}
            <div className="filter-row">
              <div className="form-group date-range-group">
                <label className="form-label">遊戲時間範圍</label>
                <div className="date-inputs">
                  <input 
                    type="date" 
                    value={dateFrom} 
                    onChange={e => {setDateFrom(e.target.value); setPage(1);}}
                    className="form-input" 
                  />
                  <span className="date-separator">至</span>
                  <input 
                    type="date" 
                    value={dateTo} 
                    onChange={e => {setDateTo(e.target.value); setPage(1);}}
                    className="form-input" 
                  />
                </div>
                <div className="quick-date-buttons">
                  <button onClick={() => quickSetDate("today")} className="btn-quick-date">今日</button>
                  <button onClick={() => quickSetDate("yesterday")} className="btn-quick-date">昨日</button>
                  <button onClick={() => quickSetDate("7days")} className="btn-quick-date">近7日</button>
                  <button onClick={() => quickSetDate("30days")} className="btn-quick-date">近30日</button>
                </div>
              </div>
            </div>

            {/* 遊戲類別篩選 */}
            <div className="form-group game-category-group">
              <label className="form-label">遊戲類別選擇</label>
              
              <div className="category-checkboxes">
                {Object.entries(GAME_CATEGORIES).map(([key, category]) => (
                  <div 
                    key={key} 
                    className={`category-item ${selectedCategories.includes(key) ? 'selected' : ''}`}
                  >
                    <div className="category-header">
                      <label className="checkbox-wrapper">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(key)}
                          onChange={e => handleCategoryChange(key, e.target.checked)}
                        />
                        <span className="checkbox-label">
                          {category.icon} {category.name}
                        </span>
                      </label>
                    </div>
                    
                    {selectedCategories.includes(key) && (
                      <div className="provider-checkboxes">
                        {category.providers.map(provider => (
                          <label 
                            key={provider.id} 
                            className={`provider-checkbox-wrapper ${selectedProviders.includes(provider.id) ? 'checked' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedProviders.includes(provider.id)}
                              onChange={e => handleProviderChange(provider.id, e.target.checked)}
                            />
                            <span className="provider-checkbox-label">{provider.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 載入狀態 */}
      {loading && (
        <div className="loading-spinner">
          <div>⏳ 載入明細中...</div>
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

      {!loading && (
        <div className="content-section">
          {/* 統計資訊 */}
          <div className="stats-summary">
            <div className="stats-cards">
              <div className="stats-card">
                <div className="stats-label">總投注次數</div>
                <div className="stats-value">{stats.betCount.toLocaleString()}</div>
              </div>
              <div className="stats-card">
                <div className="stats-label">總投注金額</div>
                <div className="stats-value">{stats.totalBetAmount.toLocaleString()}</div>
              </div>
              <div className="stats-card">
                <div className="stats-label">總派彩金額</div>
                <div className="stats-value">{stats.totalPayoutAmount.toLocaleString()}</div>
              </div>
              <div className="stats-card">
                <div className="stats-label">總輸贏結果</div>
                <div className={`stats-value ${stats.totalWinLossAmount >= 0 ? 'profit' : 'loss'}`}>
                  {stats.totalWinLossAmount >= 0 ? '+' : ''}{stats.totalWinLossAmount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* 表格控制區域 */}
          <div className="table-controls">
            <div className="pagination-control">
              <label>每頁顯示：</label>
              <select
                value={limit}
                onChange={(e) => {setLimit(Number(e.target.value)); setPage(1);}}
                className="pagination-select"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>

            <div className="export-control">
              <button
                onClick={handleExport}
                disabled={!allDetails.length}
                className="btn-search"
              >
                📥 匯出明細 CSV ({allDetails.length} 筆)
              </button>
            </div>

            <div className="pagination-info">
              第 {page} 頁，共 {Math.ceil(totalCount / limit)} 頁，總計 {totalCount} 筆明細
            </div>
          </div>

          {/* 明細表格 */}
          <table className="modern-table">
            <thead>
              <tr>
                <th>遊戲商</th>
                <th>遊戲名稱</th>
                <th>投注時間</th>
                <th>投注金額</th>
                <th>有效投注</th>
                <th>派彩金額</th>
                <th>輸贏結果</th>
                <th>賠率</th>
                <th>狀態</th>
              </tr>
            </thead>
            <tbody>
              {details.length === 0 ? (
                <tr>
                  <td colSpan={9} className="no-data">
                    📭 沒有找到該會員的遊戲記錄
                  </td>
                </tr>
              ) : (
                details.map(detail => (
                  <tr key={detail.id}>
                    <td>{detail.gameProvider}</td>
                    <td>{detail.gameName}</td>
                    <td>{formatDateTime(detail.betTime)}</td>
                    <td className="amount-cell">{detail.betAmount.toLocaleString()}</td>
                    <td className="amount-cell">{detail.validBetAmount.toLocaleString()}</td>
                    <td className={`amount-cell ${detail.payoutAmount > 0 ? 'profit' : ''}`}>{detail.payoutAmount.toLocaleString()}</td>
                    <td className={`amount-cell ${detail.winLossAmount > 0 ? 'profit' : detail.winLossAmount < 0 ? 'loss' : 'break-even'}`}>
                      {detail.winLossAmount > 0 ? '+' : ''}{detail.winLossAmount.toLocaleString()}
                    </td>
                    <td className="odds-cell">{detail.odds}</td>
                    <td>
                      <span className={`status-badge status-${detail.status.toLowerCase()}`}>
                        {detail.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* 分頁控制 */}
          {renderPagination()}
        </div>
      )}
    </div>
  );
}

// 獲取遊戲供應商名稱
function getGameProviderName(gameId: string): string {
  switch (gameId) {
    case 'DICE':
      return 'WM真人';
    case 'HI_LO':
      return 'RG電子';
    default:
      return gameId || '未知';
  }
}

// 獲取遊戲名稱
function getGameName(gameId: string): string {
  switch (gameId) {
    case 'DICE':
      return '骰子遊戲';
    case 'HI_LO':
      return '猜大小';
    default:
      return gameId || '未知遊戲';
  }
}