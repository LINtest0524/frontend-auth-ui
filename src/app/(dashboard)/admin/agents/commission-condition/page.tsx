'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCommissionConditionsStore } from '@/stores/useCommissionConditionsStore';
import { CommissionMethod } from '@/types/commission-condition';
import Pagination from '@/components/ui/Pagination';
import '@/styles/pages/commission-conditions.css';

export default function CommissionConditionListPage() {
  const {
    items,
    total,
    loading,
    error,
    filters,
    setFilters,
    fetchList,
    toggleStatus,
    removeOne,
    clearError,
  } = useCommissionConditionsStore();

  const [agents, setAgents] = useState<Array<{ id: number; name: string }>>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inputLimit, setInputLimit] = useState(20);

  useEffect(() => {
    // 初始載入
    handleSearch();
    // 載入用戶角色
    loadUserRole();
    // TODO: 載入代理商列表
    // loadAgents();
  }, []);

  useEffect(() => {
    if (error) {
      // TODO: 顯示 Toast 錯誤訊息
      console.error('Commission Condition Error:', error);
    }
  }, [error]);

  const handleSearch = () => {
    setHasSearched(true);
    fetchList();
  };

  const clearFilter = () => {
    setFilters({
      page: 1,
      limit: 50,
      commissionPercentMin: 0,
      commissionPercentMax: 100,
      settlementCycle: undefined,
      systemType: undefined,
    });
    setHasSearched(false);
    // 清除後自動執行查詢
    setTimeout(() => handleSearch(), 0);
  };

  const loadUserRole = () => {
    try {
      // 從 localStorage 讀取用戶角色
      const token = localStorage.getItem('token') || localStorage.getItem('portalToken');
      if (token) {
        // 解析 JWT token 取得用戶角色（簡化版本）
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role || '');
      }
    } catch (error) {
      console.error('❌ 無法取得用戶角色:', error);
      setUserRole('');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleStatus(id, !currentStatus);
      // TODO: 顯示成功 Toast
    } catch (error) {
      // 錯誤已在 store 中處理
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!canDelete()) {
      console.warn('❌ 用戶無刪除權限');
      return;
    }

    if (!confirm(`確定要刪除分潤方案「${name}」嗎？\n\n此操作無法復原！`)) {
      return;
    }

    try {
      setDeletingId(id);
      await removeOne(id);
      // TODO: 顯示成功 Toast
      console.log('✅ 分潤方案刪除成功');
    } catch (error) {
      console.error('❌ 刪除失敗:', error);
      // 錯誤已在 store 中處理
    } finally {
      setDeletingId(null);
    }
  };

  const canDelete = (): boolean => {
    // 只有超級管理員和全域管理員可以刪除
    return userRole === 'SUPER_ADMIN' || userRole === 'GLOBAL_ADMIN';
  };

  const canEdit = (): boolean => {
    // 只有超級管理員和全域管理員可以編輯
    return userRole === 'SUPER_ADMIN' || userRole === 'GLOBAL_ADMIN';
  };

  const canCreate = (): boolean => {
    // 只有超級管理員和全域管理員可以創建
    return userRole === 'SUPER_ADMIN' || userRole === 'GLOBAL_ADMIN';
  };

  // 新增輔助函數
  const getSystemTypeDisplay = (systemType: string) => {
    switch (systemType) {
      case 'COMMISSION':
        return '占成制';
      case 'REBATE':
        return '返水制';
      default:
        return systemType || '占成制';
    }
  };

  const getAgentLevelDisplay = (agentLevel: string) => {
    if (agentLevel === 'ANY') return '任一層級';
    const levelNum = agentLevel?.split('_')[1];
    return levelNum ? `${levelNum}級代理` : '任一層級';
  };

  const getSettlementCycleDisplay = (cycle: string) => {
    switch (cycle) {
      case 'WEEKLY':
        return '週結';
      case 'MONTHLY':
        return '月結';
      default:
        return cycle || '週結';
    }
  };

  const handleManagement = (itemId: string, action: string, itemName?: string) => {
    switch (action) {
      case 'edit':
        window.location.href = `/admin/agents/commission-condition/${itemId}`;
        break;
      case 'handler':
        // 跳轉到特定分潤方案的經手人操作記錄頁面
        window.location.href = `/admin/agents/commission-condition/audit-logs?targetId=${itemId}`;
        break;
      case 'delete':
        handleDelete(itemId, itemName || '');
        break;
    }
  };

  const totalPages = Math.ceil(total / filters.limit);

  const handlePageChange = (newPage: number) => {
    setFilters({ page: newPage });
    setTimeout(() => handleSearch(), 0);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setFilters({ limit: newPageSize, page: 1 });
    setTimeout(() => handleSearch(), 0);
  };

  return (
    <div className="commission-conditions-container">
      {/* 頁面標題 */}
      <div className="commission-conditions-header">
        <h1>💰 分潤管理</h1>
        <div className="commission-conditions-header-actions">
          {canCreate() && (
            <Link
              href="/admin/agents/commission-condition/new"
              className="btn-add"
              title="僅超級管理員和全域管理員可新增"
            >
              ➕ 新增分潤方案
            </Link>
          )}
        </div>
      </div>

      {/* 篩選區域 */}
      <div className="filter-section">
        <button 
          className="filter-toggle"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          <span>🔍 篩選條件</span>
          <span className={`filter-arrow ${isFilterOpen ? 'rotate' : ''}`}>▼</span>
        </button>
        
        {isFilterOpen && (
          <div className="filter-content">
            <div className="commission-condition-filter-grid">
              {/* 1. 分潤比例(%) 數值區間 */}
              <div className="form-group">
                <label className="form-label">分潤比例(%)</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    placeholder="最小值"
                    min="0"
                    max="100"
                    value={filters.commissionPercentMin || 0}
                    onChange={(e) => setFilters({ 
                      commissionPercentMin: e.target.value ? parseInt(e.target.value) : 0 
                    })}
                    className="form-input range-input"
                  />
                  <span className="range-separator">~</span>
                  <input
                    type="number"
                    placeholder="最大值"
                    min="0"
                    max="100"
                    value={filters.commissionPercentMax || 100}
                    onChange={(e) => setFilters({ 
                      commissionPercentMax: e.target.value ? parseInt(e.target.value) : 100 
                    })}
                    className="form-input range-input"
                  />
                </div>
              </div>

              {/* 2. 代理分潤結算 */}
              <div className="form-group">
                <label className="form-label">代理分潤結算</label>
                <select
                  value={filters.settlementCycle || ''}
                  onChange={(e) => setFilters({ settlementCycle: e.target.value || undefined })}
                  className="form-select"
                >
                  <option value="">全部結算方式</option>
                  <option value="WEEKLY">週結(每週日 23:59:59)</option>
                  <option value="MONTHLY">月結(每月最後一天 23:59:59)</option>
                </select>
              </div>

              {/* 3. 分潤制度 */}
              <div className="form-group">
                <label className="form-label">分潤制度</label>
                <select
                  value={filters.systemType || ''}
                  onChange={(e) => setFilters({ systemType: e.target.value || undefined })}
                  className="form-select"
                >
                  <option value="">全部制度</option>
                  <option value="COMMISSION">占成制</option>
                  <option value="REBATE">返水制</option>
                </select>
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
      {error && (
        <div className="error-banner">
          <span>❌ {error}</span>
          <button onClick={clearError} className="error-close">✕</button>
        </div>
      )}

      {!loading && hasSearched && (
        <div className="content-section">
          {/* 表格控制 */}
          <div className="table-controls">
            <div className="pagination-control">
              <label htmlFor="page-limit">每頁顯示：</label>
              <input
                type="number"
                id="page-limit"
                value={inputLimit}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val)) setInputLimit(val);
                }}
                min={1}
                className="pagination-input"
              />
              <button
                onClick={() => {
                  const validLimit = Math.max(1, inputLimit);
                  setFilters({ limit: validLimit, page: 1 });
                  setTimeout(() => handleSearch(), 0);
                }}
                className="btn-search"
              >
                套用
              </button>
            </div>
            
            <div className="result-info">
              共找到 {total} 筆分潤方案
            </div>
          </div>

          {/* 資料表格 */}
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>分潤制度</th>
                  <th>分潤名稱</th>
                  <th>代理層級</th>
                  <th>代理名稱</th>
                  <th>代理占成比例(%)</th>
                  <th>
                    <div className="rebate-header">
                      <div className="rebate-title">代理返水比例(%)</div>
                      <div className="rebate-game-types">
                        <div>真人</div>
                        <div>電子</div>
                        <div>體育</div>
                        <div>彩票</div>
                        <div>棋牌</div>
                        <div>捕魚</div>
                      </div>
                    </div>
                  </th>
                  <th>代理分潤結算</th>
                  <th>管理</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="no-data">
                      <div className="no-data-content">
                        <div className="no-data-icon">📝</div>
                        <div>尚無分潤方案資料</div>
                        <div className="no-data-hint">請點擊「新增分潤方案」開始設定</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="table-row">
                      {/* 1. 分潤制度 */}
                      <td>
                        <span className="system-type-badge">
                          {getSystemTypeDisplay(item.systemType)}
                        </span>
                      </td>
                      {/* 2. 分潤名稱 */}
                      <td>
                        <div className="condition-name">{item.name}</div>
                      </td>
                      {/* 3. 代理層級 */}
                      <td>
                        <span className="agent-level-badge">
                          {getAgentLevelDisplay(item.agentLevel)}
                        </span>
                      </td>
                      {/* 4. 代理名稱 */}
                      <td>
                        <div className="agent-cell">
                          <span className="agent-name">{item.agentName}</span>
                        </div>
                      </td>
                      {/* 5. 代理占成比例(%) */}
                      <td>
                        <span className="commission-percent">
                          {item.commissionPercent !== undefined ? `${item.commissionPercent}%` : '-'}
                        </span>
                      </td>
                      {/* 6. 代理返水比例(%) */}
                      <td>
                        <div className="rebate-grid">
                          {[
                            { key: 'live' },
                            { key: 'slot' },
                            { key: 'sport' },
                            { key: 'lottery' },
                            { key: 'card' },
                            { key: 'fishing' }
                          ].map(gameType => (
                            <div key={gameType.key} className="rebate-cell">
                              {item.gameRebateRates?.[gameType.key] !== undefined 
                                ? `${item.gameRebateRates[gameType.key]}%` 
                                : '-'}
                            </div>
                          ))}
                        </div>
                      </td>
                      {/* 7. 代理分潤結算 */}
                      <td>
                        <span className="settlement-cycle-badge">
                          {getSettlementCycleDisplay(item.settlementCycle)}
                        </span>
                      </td>
                      {/* 8. 管理 */}
                      <td>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleManagement(item.id, e.target.value, item.name);
                              e.target.value = ''; // 重置選項
                            }
                          }}
                          className="management-select"
                          defaultValue=""
                        >
                          <option value="">選擇操作</option>
                          <option value="edit">編輯</option>
                          <option value="handler">經手人</option>
                          {canDelete() && (
                            <option value="delete">刪除</option>
                          )}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 通用分頁元件 */}
          <Pagination
            currentPage={filters.page}
            totalPages={totalPages}
            totalCount={total}
            pageSize={filters.limit}
            onPageChange={handlePageChange}
            showPageSizeSelector={false}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}