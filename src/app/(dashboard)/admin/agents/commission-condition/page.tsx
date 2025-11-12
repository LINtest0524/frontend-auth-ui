'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCommissionConditionsStore } from '@/stores/useCommissionConditionsStore';
import { CommissionMethod } from '@/types/commission-condition';
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
      keyword: '',
      agentId: undefined,
      isActive: undefined,
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

    if (!confirm(`確定要刪除占成條件「${name}」嗎？\n\n此操作無法復原！`)) {
      return;
    }

    try {
      setDeletingId(id);
      await removeOne(id);
      // TODO: 顯示成功 Toast
      console.log('✅ 占成條件刪除成功');
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

  const getMethodDisplay = (method: CommissionMethod) => {
    switch (method) {
      case CommissionMethod.SETTLEMENT_ACTIVE_MEMBERS:
        return '活躍會員占成';
      case CommissionMethod.SETTLEMENT_ECPAY_PERSON:
        return '綠界個人占成';
      default:
        return method;
    }
  };

  const totalPages = Math.ceil(total / filters.limit);

  return (
    <div className="commission-conditions-container">
      {/* 頁面標題 */}
      <div className="commission-conditions-header">
        <h1>💰 占成條件管理</h1>
        <div className="commission-conditions-header-actions">
          {canCreate() && (
            <Link
              href="/admin/agents/commission-condition/new"
              className="btn-add"
              title="僅超級管理員和全域管理員可新增"
            >
              ➕ 新增占成條件
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
            <div className="filter-grid">
              <div className="form-group">
                <label className="form-label">占成名稱</label>
                <input
                  type="text"
                  placeholder="搜尋占成名稱..."
                  value={filters.keyword}
                  onChange={(e) => setFilters({ keyword: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">代理商</label>
                <select
                  value={filters.agentId || ''}
                  onChange={(e) => setFilters({ agentId: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="form-select"
                >
                  <option value="">全部代理商</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">狀態</label>
                <select
                  value={filters.isActive === undefined ? '' : filters.isActive.toString()}
                  onChange={(e) => setFilters({ 
                    isActive: e.target.value === '' ? undefined : e.target.value === 'true' 
                  })}
                  className="form-select"
                >
                  <option value="">全部狀態</option>
                  <option value="true">✅ 啟用</option>
                  <option value="false">❌ 停用</option>
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
              <label>每頁顯示：</label>
              <select
                value={filters.limit}
                onChange={(e) => {
                  setFilters({ limit: parseInt(e.target.value), page: 1 });
                  // 每頁顯示數量改變時立即查詢
                  setTimeout(() => handleSearch(), 0);
                }}
                className="pagination-input"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            
            <div className="result-info">
              共找到 {total} 筆占成條件
            </div>
          </div>

          {/* 資料表格 */}
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>代理商名稱</th>
                  <th>占成名稱</th>
                  <th>計算方式</th>
                  <th>狀態</th>
                  <th>條件組數</th>
                  <th>更新時間</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="no-data">
                      <div className="no-data-content">
                        <div className="no-data-icon">📝</div>
                        <div>尚無占成條件資料</div>
                        <div className="no-data-hint">請點擊「新增占成條件」開始設定</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="table-row">
                      <td>
                        <div className="agent-cell">
                          <span className="agent-name">{item.agentName}</span>
                        </div>
                      </td>
                      <td>
                        <div className="condition-name">{item.name}</div>
                      </td>
                      <td>
                        <span className="method-badge">
                          {getMethodDisplay(item.method)}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleStatus(item.id, item.isActive)}
                          className={`status-toggle ${item.isActive ? 'active' : 'inactive'}`}
                          disabled={loading}
                        >
                          {item.isActive ? '✅ 啟用' : '❌ 停用'}
                        </button>
                      </td>
                      <td>
                        <span className="group-count">{item.groupCount} 組</span>
                      </td>
                      <td className="update-time">
                        {new Date(item.updatedAt).toLocaleDateString('zh-TW')}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {canEdit() ? (
                            <Link
                              href={`/admin/agents/commission-condition/${item.id}`}
                              className="btn-edit"
                              title="編輯占成條件"
                            >
                              ✏️ 編輯
                            </Link>
                          ) : (
                            <Link
                              href={`/admin/agents/commission-condition/${item.id}/view`}
                              className="btn-view"
                              title="查看占成條件詳情"
                            >
                              👁️ 查看
                            </Link>
                          )}
                          {canDelete() && (
                            <button
                              onClick={() => handleDelete(item.id, item.name)}
                              className="btn-delete"
                              disabled={deletingId === item.id || loading}
                              title="僅超級管理員和全域管理員可刪除"
                            >
                              {deletingId === item.id ? '⏳ 刪除中...' : '🗑️ 刪除'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 分頁控制 */}
          {totalPages > 1 && (
            <div className="pagination-section">
              <div className="pagination-info">
                第 {filters.page} 頁，共 {totalPages} 頁
              </div>
              <div className="pagination-buttons">
                <button
                  onClick={() => {
                    setFilters({ page: 1 });
                    setTimeout(() => handleSearch(), 0);
                  }}
                  disabled={filters.page <= 1}
                  className="pagination-btn"
                >
                  首頁
                </button>
                <button
                  onClick={() => {
                    setFilters({ page: filters.page - 1 });
                    setTimeout(() => handleSearch(), 0);
                  }}
                  disabled={filters.page <= 1}
                  className="pagination-btn"
                >
                  上一頁
                </button>
                <span className="page-current">
                  {filters.page} / {totalPages}
                </span>
                <button
                  onClick={() => {
                    setFilters({ page: filters.page + 1 });
                    setTimeout(() => handleSearch(), 0);
                  }}
                  disabled={filters.page >= totalPages}
                  className="pagination-btn"
                >
                  下一頁
                </button>
                <button
                  onClick={() => {
                    setFilters({ page: totalPages });
                    setTimeout(() => handleSearch(), 0);
                  }}
                  disabled={filters.page >= totalPages}
                  className="pagination-btn"
                >
                  末頁
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}