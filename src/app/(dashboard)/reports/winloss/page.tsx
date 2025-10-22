'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toCsv, downloadCsv, formatDateTime } from '@/lib/csv';
import { getUser } from '@/lib/useAuth';
import { useCompanySlug } from '@/hooks/useCompanySlug';
import "@/styles/pages/users.css";
import "@/styles/pages/winloss-report.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

// 遊戲類別配置 - 真實遊戲 + 遊戲商
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

type WinLossRow = {
  id: string;
  rank: number;
  username: string;
  cacheBalance: number;
  betCount: number;
  betAmount: number;
  validBetAmount: number;
  winLossAmount: number;
  lastBetTime?: string;
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

export default function WinLossReportPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [rows, setRows] = useState<WinLossRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const companySlug = useCompanySlug();

  // 篩選條件
  const [timezone, setTimezone] = useState('GMT+8');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [usernameFilter, setUsernameFilter] = useState('');
  
  // 遊戲類別篩選
  const [selectedCategories, setSelectedCategories] = useState<string[]>(Object.keys(GAME_CATEGORIES));
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 會員明細
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [memberDetails, setMemberDetails] = useState<MemberDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // 初始化選中的遊戲供應商
  useEffect(() => {
    const allProviders = selectedCategories.flatMap(catKey => 
      GAME_CATEGORIES[catKey as keyof typeof GAME_CATEGORIES]?.providers.map(p => p.id) || []
    );
    setSelectedProviders(allProviders);
  }, [selectedCategories]);

  // 快速設定日期
  const quickSetDate = (type: string) => {
    // 確保使用本地時區的日期
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

  // 處理遊戲類別選擇
  const handleCategoryChange = (categoryKey: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, categoryKey]);
    } else {
      setSelectedCategories(prev => prev.filter(key => key !== categoryKey));
    }
  };

  // 處理全選/取消全選
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCategories(Object.keys(GAME_CATEGORIES));
    } else {
      setSelectedCategories([]);
    }
  };

  // 處理遊戲供應商選擇
  const handleProviderChange = (providerId: string, checked: boolean) => {
    if (checked) {
      setSelectedProviders(prev => [...prev, providerId]);
    } else {
      setSelectedProviders(prev => prev.filter(id => id !== providerId));
    }
  };

  // 載入報表資料
  const loadData = async () => {
    // 檢查是否至少有一個搜尋條件
    if (!usernameFilter.trim() && !dateFrom && !dateTo && selectedProviders.length === 0) {
      setError('請至少設定一個搜尋條件（玩家帳號、日期範圍或遊戲類型）');
      return;
    }
    
    // 如果沒有指定玩家但也沒有日期範圍，需要設定日期範圍
    if (!usernameFilter.trim() && !dateFrom && !dateTo) {
      setError('查詢所有玩家時請設定日期範圍，避免資料量過大');
      return;
    }

    // 如果只有玩家帳號而沒有日期，允許搜尋（但設定合理的預設日期範圍）
    let effectiveDateFrom = dateFrom;
    let effectiveDateTo = dateTo;
    
    if (usernameFilter && !dateFrom && !dateTo) {
      // 為特定玩家搜尋設定預設的30天範圍
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      effectiveDateFrom = thirtyDaysAgo.toISOString().split('T')[0];
      effectiveDateTo = today.toISOString().split('T')[0];
      
      console.log(`為玩家 ${usernameFilter} 自動設定日期範圍: ${effectiveDateFrom} 到 ${effectiveDateTo}`);
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      let allRounds: any[] = [];
      
      if (usernameFilter) {
        // 如果指定了特定玩家，只查詢該玩家
        const baseParams = new URLSearchParams();
        baseParams.append('playerId', usernameFilter);
        if (effectiveDateFrom) baseParams.append('dateFrom', effectiveDateFrom + ' 00:00:00');
        if (effectiveDateTo) baseParams.append('dateTo', effectiveDateTo + ' 23:59:59');
        baseParams.append('limit', '500');
        
        if (selectedProviders.length > 0) {
          // 為每個選中的遊戲分別查詢
          for (const provider of selectedProviders) {
            const gameQueryParams = new URLSearchParams(baseParams);
            gameQueryParams.append('gameId', provider);
            
            try {
              const gameResponse = await fetch(`${API_BASE}/mock-games/history/rounds?${gameQueryParams.toString()}`, {
                cache: 'no-store'
              });
              
              if (gameResponse.ok) {
                const gameData = await gameResponse.json();
                const gameRounds = Array.isArray(gameData) ? gameData : (gameData.items || []);
                allRounds = allRounds.concat(gameRounds);
              }
            } catch (e) {
              console.warn(`查詢失敗 - 玩家: ${usernameFilter}, 遊戲: ${provider}`, e);
            }
          }
        } else {
          // 查詢該玩家的所有遊戲
          try {
            const response = await fetch(`${API_BASE}/mock-games/history/rounds?${baseParams.toString()}`, {
              cache: 'no-store'
            });
            
            if (response.ok) {
              const data = await response.json();
              const rounds = Array.isArray(data) ? data : (data.items || []);
              allRounds = allRounds.concat(rounds);
            }
          } catch (e) {
            console.warn(`查詢失敗 - 玩家: ${usernameFilter}`, e);
          }
        }
      } else {
        // 如果沒有指定玩家，通過日期範圍和遊戲類型查詢所有資料
        const baseParams = new URLSearchParams();
        if (effectiveDateFrom) baseParams.append('dateFrom', effectiveDateFrom + ' 00:00:00');
        if (effectiveDateTo) baseParams.append('dateTo', effectiveDateTo + ' 23:59:59');
        baseParams.append('limit', '1000'); // 增加限制以獲取更多資料
        
        if (selectedProviders.length > 0) {
          // 為每個選中的遊戲查詢
          for (const provider of selectedProviders) {
            const gameQueryParams = new URLSearchParams(baseParams);
            gameQueryParams.append('gameId', provider);
            
            try {
              const gameResponse = await fetch(`${API_BASE}/mock-games/history/rounds?${gameQueryParams.toString()}`, {
                cache: 'no-store'
              });
              
              if (gameResponse.ok) {
                const gameData = await gameResponse.json();
                const gameRounds = Array.isArray(gameData) ? gameData : (gameData.items || []);
                allRounds = allRounds.concat(gameRounds);
                console.log(`${provider} 遊戲找到 ${gameRounds.length} 筆記錄`);
              }
            } catch (e) {
              console.warn(`查詢失敗 - 遊戲: ${provider}`, e);
            }
          }
        } else {
          // 查詢所有遊戲的資料
          try {
            const response = await fetch(`${API_BASE}/mock-games/history/rounds?${baseParams.toString()}`, {
              cache: 'no-store'
            });
            
            if (response.ok) {
              const data = await response.json();
              const rounds = Array.isArray(data) ? data : (data.items || []);
              allRounds = allRounds.concat(rounds);
              console.log(`找到 ${rounds.length} 筆所有遊戲記錄`);
            }
          } catch (e) {
            console.warn('查詢所有遊戲失敗:', e);
          }
        }
        
        console.log(`總共找到 ${allRounds.length} 筆記錄`);
      }

      console.log('選中的遊戲供應商:', selectedProviders);
      console.log('獲取到的結算數據:', allRounds);

      // 按玩家 ID 分組並計算統計
      const playerStats = await processPlayerStats(allRounds, usernameFilter);
      
      // 分頁處理
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedRows = playerStats.slice(startIndex, endIndex);

      setRows(paginatedRows);
      setTotalCount(playerStats.length);
      
    } catch (e: any) {
      console.error('載入輸贏報表失敗:', e);
      setError(e.message || '載入失敗');
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // 載入會員明細
  const loadMemberDetails = async (username: string) => {
    setLoadingDetails(true);
    try {
      console.log('載入會員明細:', username);
      
      // 構建查詢參數
      const baseParams = new URLSearchParams();
      baseParams.append('playerId', username);
      
      // 使用與主搜尋相同的日期邏輯
      let detailDateFrom = dateFrom;
      let detailDateTo = dateTo;
      
      if (!dateFrom && !dateTo) {
        // 如果沒有設定日期，使用30天範圍
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        detailDateFrom = thirtyDaysAgo.toISOString().split('T')[0];
        detailDateTo = today.toISOString().split('T')[0];
      }
      
      if (detailDateFrom) baseParams.append('dateFrom', detailDateFrom + ' 00:00:00');
      if (detailDateTo) baseParams.append('dateTo', detailDateTo + ' 23:59:59');
      baseParams.append('limit', '500'); // 會員明細設定較大限制

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
        // 如果沒有選擇特定遊戲，查詢該會員的所有記錄
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
        return timeB - timeA; // 降序排列，最新的在前
      });

      // 轉換為會員明細格式
      const details: MemberDetail[] = allRounds.map((round, index) => {
        // 直接使用 API 回傳的數據
        const betAmount = Number(round.betAmount || 0);
        const winAmount = Number(round.winAmount || 0);
        
        // 修正後的派彩計算邏輯：
        // 我們的後端現在保存的 winAmount 就是派彩金額
        // - 贏了：winAmount = 本金 + 獎金（例如 8）
        // - 輸了：winAmount = 0（沒有派彩）
        const payoutAmount = winAmount;
        
        // 輸贏結果 = 派彩金額 - 下注金額
        const winLossAmount = payoutAmount - betAmount;
        
        // 計算賠率 - 只顯示後面的數字
        let odds = '1';
        if (betAmount > 0) {
          if (winLossAmount > 0) {
            // 有贏錢，計算賠率 
            const ratio = winLossAmount / betAmount;
            // 如果是整數就不顯示小數點，否則顯示一位小數
            odds = ratio % 1 === 0 ? ratio.toString() : ratio.toFixed(1);
          } else if (winLossAmount === 0) {
            // 平手
            odds = '0';
          } else {
            // 輸錢
            odds = '0';
          }
        }
        
        console.log('Round數據:', {
          roundId: round.roundId,
          betAmount,
          winAmount,
          payoutAmount,
          winLossAmount
        });
        
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

      setMemberDetails(details);
      
    } catch (e: any) {
      console.error('載入會員明細失敗:', e);
      setMemberDetails([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  // 處理會員明細展開/收合
  const handleMemberExpand = (username: string) => {
    if (expandedMember === username) {
      setExpandedMember(null);
      setMemberDetails([]);
    } else {
      setExpandedMember(username);
      loadMemberDetails(username);
    }
  };

  // 重置篩選
  const clearFilter = () => {
    setDateFrom('');
    setDateTo('');
    setUsernameFilter('');
    setSelectedCategories(Object.keys(GAME_CATEGORIES));
    setRows([]);
    setError(null);
    setHasSearched(false);
    setPage(1);
  };

  // 匯出 CSV
  const handleExport = () => {
    if (!rows.length) {
      alert('沒有資料可以匯出');
      return;
    }
    
    const csvData = rows.map(row => ({
      '排序': row.rank,
      '帳號': row.username,
      '快取餘額': row.cacheBalance,
      '投注次數': row.betCount,
      '投注金額': row.betAmount,
      '有效投注': row.validBetAmount,
      '輸贏結果': row.winLossAmount,
      '最後投注時間': formatDateTime(row.lastBetTime)
    }));
    
    const csv = toCsv(csvData);
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '_');
    const filename = `輸贏報表_${timestamp}.csv`;
    downloadCsv(filename, csv);
  };

  // 計算統計資料
  const stats = useMemo(() => {
    const totalBetAmount = rows.reduce((sum, r) => sum + Number(r.betAmount || 0), 0);
    const totalValidBetAmount = rows.reduce((sum, r) => sum + Number(r.validBetAmount || 0), 0);
    const totalWinLossAmount = rows.reduce((sum, r) => sum + Number(r.winLossAmount || 0), 0);
    const totalBetCount = rows.reduce((sum, r) => sum + Number(r.betCount || 0), 0);
    
    return {
      totalBetAmount,
      totalValidBetAmount,
      totalWinLossAmount,
      totalBetCount,
      avgWinLoss: rows.length > 0 ? totalWinLossAmount / rows.length : 0
    };
  }, [rows]);

  return (
    <div className="users-container">
      {/* 頁面標題區域 */}
      <div className="users-header">
        <h1>💰 輸贏報表</h1>
        <div className="users-header-actions">
          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
            📊 查看會員投注輸贏統計報表
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
            {/* 基本篩選 */}
            <div className="filter-grid">
              <div className="form-group">
                <label className="form-label">時區</label>
                <select 
                  value={timezone} 
                  onChange={e => setTimezone(e.target.value)}
                  className="form-select"
                >
                  <option value="GMT+8">GMT+8 台北時間</option>
                  <option value="GMT+0">GMT+0 格林威治時間</option>
                  <option value="GMT-5">GMT-5 美東時間</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">帳號</label>
                <input 
                  type="text"
                  placeholder="請輸入會員帳號" 
                  value={usernameFilter} 
                  onChange={e => setUsernameFilter(e.target.value)}
                  className="form-input" 
                />
              </div>
            </div>

            {/* 日期範圍 */}
            <div className="filter-row">
              <div className="form-group date-range-group">
                <label className="form-label">下注時間範圍</label>
                <div className="date-inputs">
                  <input 
                    type="date" 
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
                  <button onClick={() => quickSetDate("7days")} className="btn-quick-date">近7日</button>
                  <button onClick={() => quickSetDate("thisMonth")} className="btn-quick-date">本月</button>
                  <button onClick={() => quickSetDate("lastMonth")} className="btn-quick-date">上月</button>
                </div>
              </div>
            </div>

            {/* 遊戲類別篩選 - 100% 寬度 */}
            <div className="form-group game-category-group">
              <label className="form-label">遊戲類別選擇</label>
              
              {/* 全選控制 */}
              <div className="category-select-all">
                <label className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={selectedCategories.length === Object.keys(GAME_CATEGORIES).length}
                    onChange={e => handleSelectAll(e.target.checked)}
                  />
                  <span className="checkbox-label">🎯 全選所有遊戲類別</span>
                </label>
              </div>

              {/* 遊戲類別選擇 - 垂直排列 */}
              <div className="category-checkboxes">
                {Object.entries(GAME_CATEGORIES).map(([key, category]) => (
                  <div 
                    key={key} 
                    className={`category-item ${selectedCategories.includes(key) ? 'selected' : ''}`}
                  >
                    {/* 大類別標題區域 */}
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
                      
                      {/* 顯示該類別選中的供應商數量 */}
                      <div className="category-count">
                        {selectedCategories.includes(key) && (
                          <span className="count-badge">
                            {category.providers.filter(p => selectedProviders.includes(p.id)).length} / {category.providers.length}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* 該類別的遊戲供應商 */}
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

            <div className="filter-actions">
              <button onClick={loadData} className="btn-search">🔍 查詢</button>
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
          {/* 統計資訊 */}
          <div className="stats-summary">
            <div className="stats-cards">
              <div className="stats-card">
                <div className="stats-label">總投注次數</div>
                <div className="stats-value">{stats.totalBetCount.toLocaleString()}</div>
              </div>
              <div className="stats-card">
                <div className="stats-label">總投注金額</div>
                <div className="stats-value">{stats.totalBetAmount.toLocaleString()}</div>
              </div>
              <div className="stats-card">
                <div className="stats-label">總有效投注</div>
                <div className="stats-value">{stats.totalValidBetAmount.toLocaleString()}</div>
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
                onChange={(e) => setLimit(Number(e.target.value))}
                className="pagination-select"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
              <button onClick={loadData} className="btn-search">套用</button>
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
              第 {page} 頁，共 {Math.ceil(totalCount / limit)} 頁，總計 {totalCount} 筆資料
            </div>
          </div>

          {/* 輸贏報表 */}
          <table className="modern-table winloss-table">
            <thead>
              <tr>
                <th>排序</th>
                <th>帳號</th>
                <th>快取餘額</th>
                <th>投注次數</th>
                <th>投注金額</th>
                <th>有效投注</th>
                <th>輸贏結果</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="no-data">
                    📭 沒有找到符合條件的資料
                  </td>
                </tr>
              ) : (
                <>
                  {rows.map((row, index) => (
                    <React.Fragment key={row.id}>
                      <tr className={expandedMember === row.username ? 'expanded-row' : ''}>
                        <td className="rank-cell">{row.rank}</td>
                        <td className="username-cell">
                          <button
                            onClick={() => handleMemberExpand(row.username)}
                            className="username-button-blue"
                          >
                            {row.username}
                          </button>
                        </td>
                        <td className="cache-balance-cell">{row.cacheBalance.toLocaleString()}</td>
                        <td className="count-cell">{row.betCount.toLocaleString()}</td>
                        <td className="amount-cell">{row.betAmount.toLocaleString()}</td>
                        <td className="amount-cell">{row.validBetAmount.toLocaleString()}</td>
                        <td className={`winloss-cell ${row.winLossAmount >= 0 ? 'profit' : 'loss'}`}>
                          {row.winLossAmount >= 0 ? '+' : ''}{row.winLossAmount.toLocaleString()}
                        </td>
                      </tr>
                      
                      {/* 會員明細行 */}
                      {expandedMember === row.username && (
                        <tr className="member-detail-row">
                          <td colSpan={7}>
                            <div className="member-detail-container">
                              {loadingDetails ? (
                                <div className="detail-loading">載入明細中...</div>
                              ) : (
                                <table className="detail-table">
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
                                    {memberDetails.map(detail => (
                                      <tr key={detail.id}>
                                        <td>{detail.gameProvider}</td>
                                        <td>{detail.gameName}</td>
                                        <td>{formatDateTime(detail.betTime)}</td>
                                        <td className="amount-cell">{detail.betAmount.toLocaleString()}</td>
                                        <td className="amount-cell">{detail.validBetAmount.toLocaleString()}</td>
                                        <td className="amount-cell">{detail.payoutAmount.toLocaleString()}</td>
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
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </>
              )}
            </tbody>
          </table>

          {/* 分頁控制 */}
          {totalCount > limit && (
            <div className="pagination-controls">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-pagination"
              >
                上一頁
              </button>
              <span className="pagination-current">
                第 {page} 頁 / 共 {Math.ceil(totalCount / limit)} 頁
              </span>
              <button
                onClick={() => setPage(p => Math.min(Math.ceil(totalCount / limit), p + 1))}
                disabled={page >= Math.ceil(totalCount / limit)}
                className="btn-pagination"
              >
                下一頁
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 處理玩家統計數據
async function processPlayerStats(rounds: any[], usernameFilter?: string): Promise<WinLossRow[]> {
  // 按玩家 ID 分組
  const playerGroups: { [key: string]: any[] } = {};
  
  rounds.forEach(round => {
    const playerId = round.playerId;
    if (!playerId) return;
    
    // 不需要在這裡再次篩選，因為 API 已經根據 playerId 篩選過了
    if (!playerGroups[playerId]) {
      playerGroups[playerId] = [];
    }
    playerGroups[playerId].push(round);
  });

  // 計算每個玩家的統計
  const playerStats: WinLossRow[] = [];
  
  for (const [playerId, playerRounds] of Object.entries(playerGroups)) {
    const betCount = playerRounds.length;
    
    // 使用 API 回傳的實際數據
    const totalBetAmount = playerRounds.reduce((sum, round) => sum + Number(round.betAmount || 0), 0);
    // 計算真正的輸贏結果：派彩金額 - 下注金額
    const totalWinLoss = playerRounds.reduce((sum, round) => {
      const betAmount = Number(round.betAmount || 0);
      const winAmount = Number(round.winAmount || 0);
      // 輸贏結果 = 派彩金額 - 下注金額
      return sum + (winAmount - betAmount);
    }, 0);
    const validBetAmount = totalBetAmount; // 假設有效投注等於投注金額
    
    // 計算快取餘額：下注後結果最後錢包的錢
    let cacheBalance = 0;
    try {
      // 獲取用戶當前餘額
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/user?username=${playerId}&limit=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log(`用戶 ${playerId} 餘額資料:`, userData);
        if (userData && userData.data && userData.data.length > 0) {
          // 後端回傳格式: { data: [], totalPages: number, totalCount: number }
          cacheBalance = userData.data[0].balance || 0;
        } else if (userData && userData.balance !== undefined) {
          // 如果直接返回用戶對象而不是列表
          cacheBalance = userData.balance || 0;
        }
      } else {
        console.warn(`API 回應錯誤 ${playerId}:`, response.status, response.statusText);
      }
    } catch (e) {
      console.warn(`無法獲取用戶 ${playerId} 的餘額:`, e);
      // 如果無法獲取餘額，使用計算值
      cacheBalance = totalWinLoss;
    }
    
    // 最後投注時間
    const lastBetTime = playerRounds
      .map(r => r.settledAt || r.createdAt)
      .filter(Boolean)
      .sort()
      .pop();

    playerStats.push({
      id: `player_${playerId}`,
      rank: 0, // 後面會重新排序
      username: playerId,
      cacheBalance,
      betCount,
      betAmount: totalBetAmount,
      validBetAmount,
      winLossAmount: totalWinLoss,
      lastBetTime
    });
  }

  // 按輸贏金額排序（由高到低）
  playerStats.sort((a, b) => b.winLossAmount - a.winLossAmount);
  
  // 重新編號排序
  playerStats.forEach((player, index) => {
    player.rank = index + 1;
  });

  return playerStats;
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

// 計算下注金額（從結算記錄估算）
function calculateBetAmount(round: any): number {
  // 優先使用 API 回傳的 betAmount
  if (round.betAmount && Number(round.betAmount) > 0) {
    return Number(round.betAmount);
  }
  
  // 如果沒有 betAmount，從 winAmount 推算
  const winAmount = Number(round.winAmount || 0);
  
  // 假設是1:1賠率的遊戲
  if (winAmount !== 0) {
    return Math.abs(winAmount); // 輸贏金額的絕對值就是下注金額
  }
  
  // 預設值
  return 100;
}

// 計算派彩金額
function calculatePayoutAmount(round: any, betAmount: number): number {
  const winAmount = Number(round.winAmount || 0);
  
  // 派彩邏輯：
  // winAmount > 0：玩家贏錢，派彩 = 本金 + 贏錢
  // winAmount < 0：玩家輸錢，派彩 = 0
  // winAmount = 0：平手，派彩 = 本金
  
  if (winAmount > 0) {
    // 贏錢：派彩 = 下注金額 + 贏錢金額
    return betAmount + winAmount;
  } else if (winAmount < 0) {
    // 輸錢：派彩 = 0（完全沒有返還）
    return 0;
  } else {
    // 平手：派彩 = 下注金額（本金退還）
    return betAmount;
  }
}