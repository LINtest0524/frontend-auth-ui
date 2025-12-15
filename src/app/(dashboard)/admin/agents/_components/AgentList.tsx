'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAgents, fetchAgentOptions, deleteAgent } from '../_lib/agent-api';
import { handleApiError } from '@/lib/errorHandler';
import { useUserStore } from '@/hooks/use-user-store';
import '@/styles/pages/agent-form.css';
import '@/styles/pages/commission-conditions.css';

interface Agent {
  id: number;
  agent_name: string;
  display_name?: string;
  username: string;
  agent_level: number;
  parent_agent_id?: number;
  status: string;
  phone?: string;
  email?: string;
  telegram?: string;
  line?: string;
  agent_code?: string;
  created_at: string;
  last_login_at?: string;
  member_count?: number;
  max_agent_level?: number;
  next_level_count?: number;
  default_payment_group?: string;
  default_rebate_settlement?: string;
  company: {
    name: string;
    code: string;
  };
  children?: Agent[];
  parent_agent?: {
    id: number;
    agent_name: string;
    username: string;
  };
  commission_condition?: {
    id: number;
    name: string;
    systemType?: string;
    commissionPercent?: number;
    gameRebateRates?: Record<string, number>;
  };
}

export default function AgentList() {
  // 動態計算並更新第2欄的 left 位置
  React.useEffect(() => {
    // 添加固定欄位的 CSS
    const style = document.createElement('style');
    style.id = 'agent-sticky-columns-style';
    style.innerHTML = `
      .sticky-col-1 {
        white-space: nowrap !important;
        position: sticky !important;
        left: 0 !important;
        z-index: 10 !important;
        border-right: 0px solid #d3d3d3 !important;
        border-bottom: 0px solid #d3d3d3 !important;
        background-color: white !important;
        box-shadow: inset -1px 0 0 #ddd, inset 0 -1px 0 #ddd, 2px 0 4px rgba(0,0,0,0.1) !important;
      }
      
      .sticky-col-2 {
        white-space: nowrap !important;
        position: sticky !important;
        z-index: 10 !important;
        border-right: 0px solid #d3d3d3 !important;
        border-bottom: 0px solid #d3d3d3 !important;
        background-color: white !important;
        box-shadow: inset -1px 0 0 #ddd, inset 0 -1px 0 #ddd, 2px 0 4px rgba(0,0,0,0.1) !important;
      }
      
      thead .sticky-col-1,
      thead .sticky-col-2 {
        z-index: 11 !important;
      }
      
      tbody tr:nth-child(even) .sticky-col-1,
      tbody tr:nth-child(even) .sticky-col-2 {
        background-color: #efefef !important;
      }
    `;
    document.head.appendChild(style);

    const updateSecondColumnPosition = () => {
      const table = document.getElementById('agent-table-view');
      if (!table) return;

      // 獲取第一欄的實際寬度
      const firstCol = table.querySelector('th:nth-child(1)') as HTMLElement;
      if (!firstCol) return;
      
      const firstColWidth = firstCol.offsetWidth;
      
      // 更新所有第2欄的 left 位置
      const secondHeaders = table.querySelectorAll('th:nth-child(2)');
      const secondCells = table.querySelectorAll('td:nth-child(2)');
      
      [...secondHeaders, ...secondCells].forEach((el: any) => {
        if (el) {
          el.style.left = `${firstColWidth}px`;
        }
      });
    };

    // 初始化
    const timer = setTimeout(updateSecondColumnPosition, 100);

    // 監聽視窗大小變化
    window.addEventListener('resize', updateSecondColumnPosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSecondColumnPosition);
      const styleEl = document.getElementById('agent-sticky-columns-style');
      if (styleEl) document.head.removeChild(styleEl);
    };
  }, []); // 空依賴,避免循環依賴

  const router = useRouter();
  const currentUser = useUserStore((state) => state.user);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('table'); // 新增：視圖模式狀態，預設為表格
  
  // 層級導航狀態
  interface BreadcrumbItem {
    agentId: number | null; // null 表示第一級
    agentName: string;
    level: number;
  }
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { agentId: null, agentName: '1級代理', level: 1 }
  ]);
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);

  // 權限檢查函數
  const canDeleteAgent = () => {
    return currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'GLOBAL_ADMIN';
  };

  const canCreateAgent = () => {
    return currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'GLOBAL_ADMIN';
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadAgents();
  }, [selectedCompany]);

  const loadData = async () => {
    try {
      const options = await fetchAgentOptions();
      setCompanies(options.companies);
      await loadAgents();
    } catch (e) {
      handleApiError(e, 'AgentList-loadData');
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    try {
      const data = await fetchAgents(selectedCompany || undefined);
      setAgents(data);
      // 數據更新後重新計算第2欄位置
      setTimeout(() => {
        const table = document.getElementById('agent-table-view');
        if (!table) return;
        const firstCol = table.querySelector('th:nth-child(1)') as HTMLElement;
        if (!firstCol) return;
        const firstColWidth = firstCol.offsetWidth;
        const secondHeaders = table.querySelectorAll('th:nth-child(2)');
        const secondCells = table.querySelectorAll('td:nth-child(2)');
        [...secondHeaders, ...secondCells].forEach((el: any) => {
          if (el) el.style.left = `${firstColWidth}px`;
        });
      }, 200);
    } catch (e) {
      handleApiError(e, 'AgentList-loadAgents');
    }
  };

  // 處理層級導航點擊
  const handleLevelClick = (agent: Agent) => {
    if (agent.next_level_count && agent.next_level_count > 0) {
      // 添加到麵包屑
      setBreadcrumbs([...breadcrumbs, {
        agentId: agent.id,
        agentName: agent.display_name || agent.username,
        level: agent.agent_level + 1
      }]);
      setCurrentParentId(agent.id);
    }
  };

  // 處理麵包屑點擊
  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    setCurrentParentId(newBreadcrumbs[newBreadcrumbs.length - 1].agentId);
  };

  // 過濾代理商：只顯示當前層級的代理商
  const getFilteredAgents = () => {
    if (currentParentId === null) {
      // 顯示第一級代理商（沒有父級的）
      return agents.filter(agent => !agent.parent_agent_id);
    } else {
      // 顯示指定父級的下級代理商
      return agents.filter(agent => agent.parent_agent_id === currentParentId);
    }
  };

  // 建立代理商樹狀結構
  const buildAgentTree = (flatAgents: Agent[]): Agent[] => {
    const agentMap = new Map<number, Agent>();
    const rootAgents: Agent[] = [];

    // 先建立所有代理商的映射，並設定父級資訊
    flatAgents.forEach(agent => {
      const agentWithParentInfo = { 
        ...agent, 
        children: [],
        parentAgent: agent.parent_agent_id 
          ? flatAgents.find(a => a.id === agent.parent_agent_id)
            ? {
                id: agent.parent_agent_id,
                agent_name: flatAgents.find(a => a.id === agent.parent_agent_id)!.agent_name,
                username: flatAgents.find(a => a.id === agent.parent_agent_id)!.username
              }
            : undefined
          : undefined
      };
      agentMap.set(agent.id, agentWithParentInfo);
    });

    // 建立父子關係
    flatAgents.forEach(agent => {
      const agentItem = agentMap.get(agent.id)!;
      if (agent.parent_agent_id) {
        const parent = agentMap.get(agent.parent_agent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(agentItem);
        } else {
          // 如果找不到父級，放到根層級但標示為有父級
          rootAgents.push(agentItem);
        }
      } else {
        rootAgents.push(agentItem);
      }
    });

    // 排序
    const sortAgents = (agents: Agent[]) => {
      agents.sort((a, b) => a.agent_level - b.agent_level || a.id - b.id);
      agents.forEach(agent => {
        if (agent.children && agent.children.length > 0) {
          sortAgents(agent.children);
        }
      });
    };

    sortAgents(rootAgents);
    return rootAgents;
  };


  // 刪除代理商
  const handleDelete = async (id: number, agentName: string) => {
    if (!confirm(`確定要刪除代理商「${agentName}」嗎？此操作無法復原。`)) return;

    try {
      await deleteAgent(id);
      alert('代理商刪除成功！');
      await loadAgents(); // 重新載入
    } catch (error) {
      handleApiError(error, 'AgentList-delete');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 渲染樹狀視圖的代理商項目
  const renderAgentItemTree = (agent: Agent, level: number = 0) => {
    const rows = [];
    
    
    // 主項目行
    rows.push(
      <tr key={agent.id} className={`agent-level-${Math.min(level + 1, 4)}`}>
        <td className={level > 0 ? `agent-indent-${Math.min(level, 12)}` : ''}>
          <div className="agent-title">
            {level > 0 && <span className="agent-level-indicator"></span>}
            <span style={{color: level > 0 ? '#ef4444' : '#000'}}>
              [層級:{level + 1}]
            </span>
            <span className="agent-name">{agent.display_name || agent.username}</span>
            <span className="agent-account">@{agent.username}</span>
            {agent.parent_agent_id && (
              <span className="parent-info">
                ↑ 父級ID:{agent.parent_agent_id}
              </span>
            )}
          </div>
        </td>
        <td>
          <span className={`level-badge level-${agent.agent_level}`}>Level {agent.agent_level}</span>
        </td>
        <td>{agent.company.name} ({agent.company.code})</td>
        <td>
          <div className="contact-info">
            {agent.phone && <div>{agent.phone}</div>}
            {agent.email && <div>{agent.email}</div>}
            {agent.telegram && <div>{agent.telegram}</div>}
            {agent.line && <div>{agent.line}</div>}
          </div>
        </td>
        <td>
          <span className={`status-badge status-${agent.status.toLowerCase()}`}>
            {['active', 'ACTIVE'].includes(agent.status) ? '啟用' : 
             ['inactive', 'INACTIVE'].includes(agent.status) ? '停用' : '待審核'}
          </span>
        </td>
        <td style={{ fontSize: '12px', color: '#6b7280' }}>
          {formatDate(agent.created_at)}
        </td>
        <td>
          <div className="action-buttons">
            {/* 如果是當前用戶自己，則不顯示操作按鈕 */}
            {currentUser?.id !== agent.id ? (
              <>
                <button
                  onClick={() => router.push(`/admin/agents/edit/${agent.id}`)}
                  className="btn-edit"
                  title={canDeleteAgent() ? "編輯代理商" : "編輯聯絡資訊"}
                >
                  編輯
                </button>
                {canDeleteAgent() && (
                  <button
                    onClick={() => handleDelete(agent.id, agent.display_name || agent.username)}
                    className="btn-delete"
                    title="刪除代理商（僅超級管理員和全域管理員）"
                  >
                    刪除
                  </button>
                )}
              </>
            ) : (
              <span className="self-indicator" style={{ color: '#999', fontSize: '14px' }}>
                —
              </span>
            )}
          </div>
        </td>
      </tr>
    );
    
    // 遞歸渲染子代理商
    if (agent.children && agent.children.length > 0) {
      // 按照代理商等級排序子代理商
      const sortedChildren = [...agent.children].sort((a, b) => a.agent_level - b.agent_level || a.id - b.id);
      
      sortedChildren.forEach(child => {
        rows.push(...renderAgentItemTree(child, level + 1));
      });
    }
    
    return rows;
  };

  // 渲染表格視圖的代理商項目（扁平化顯示）
  const renderAgentItemTable = (agent: Agent) => {
    return (
      <tr key={agent.id}>
        {/* 1. 代理級別 */}
        <td className="sticky-col-1">
          {agent.next_level_count && agent.next_level_count > 0 ? (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleLevelClick(agent);
              }}
              style={{
                color: '#2563eb',
                textDecoration: 'none',
                cursor: 'pointer',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              {agent.agent_level}/{agent.max_agent_level || 0}({agent.next_level_count})
            </a>
          ) : (
            <span style={{ fontWeight: '500', color: '#6b7280' }}>
              {agent.agent_level}/{agent.max_agent_level || 0}({agent.next_level_count || 0})
            </span>
          )}
        </td>
        
        {/* 2. 代理名稱 */}
        <td className="sticky-col-2">
          <div>
            <div style={{ fontWeight: '500', color: '#333' }}>{agent.display_name || agent.username}</div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
              {agent.commission_condition?.name || '未設定方案'}
            </div>
          </div>
        </td>
        
        {/* 3. 會員數量 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div>{agent.member_count || 0}</div>
        </td>
        
        {/* 4. 代理帳號 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div>{agent.username}</div>
        </td>
        
        {/* 5. 代理姓名 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div>{agent.agent_name || '-'}</div>
        </td>
        
        {/* 6. 帳號狀態 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <span className={`status-badge status-${agent.status.toLowerCase()}`}>
            {['active', 'ACTIVE'].includes(agent.status) ? '啟用' : 
             ['inactive', 'INACTIVE'].includes(agent.status) ? '停用' : '待審核'}
          </span>
        </td>
        
        {/* 7. 金流群組 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div>{agent.default_payment_group ? 
            (agent.default_payment_group === 'regular' ? '常規會員' :
             agent.default_payment_group === 'old_member' ? '老會員' :
             agent.default_payment_group === 'credit_agent' ? '信用代理' :
             agent.default_payment_group === 'usdt_channel' ? 'USDT通道' :
             agent.default_payment_group) : '-'}</div>
        </td>
        
        {/* 8. 註冊/登入時間 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div style={{ fontSize: '11px' }}>
            <div>註冊: {new Date(agent.created_at).toLocaleString('zh-TW', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            })}</div>
            <div style={{ color: '#999' }}>登入: {agent.last_login_at ? new Date(agent.last_login_at).toLocaleString('zh-TW', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            }) : '未登入'}</div>
          </div>
        </td>
        
        {/* 9. 分潤制度 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div>{agent.commission_condition?.systemType ? 
            (agent.commission_condition.systemType === 'COMMISSION' ? '占成制' :
             agent.commission_condition.systemType === 'REBATE' ? '返水制' :
             agent.commission_condition.systemType) : '-'}</div>
        </td>
        
        {/* 10. 分潤比例(%) */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div>{agent.commission_condition?.commissionPercent ? 
            `${agent.commission_condition.commissionPercent}%` : '-'}</div>
        </td>
        
        {/* 11. 真人 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div>{agent.commission_condition?.gameRebateRates?.['live'] ? 
            `${agent.commission_condition.gameRebateRates['live']}%` : '-'}</div>
        </td>
        
        {/* 12. 電子 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div>{agent.commission_condition?.gameRebateRates?.['slot'] ? 
            `${agent.commission_condition.gameRebateRates['slot']}%` : '-'}</div>
        </td>
        
        {/* 13. 體育 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div>{agent.commission_condition?.gameRebateRates?.['sport'] ? 
            `${agent.commission_condition.gameRebateRates['sport']}%` : '-'}</div>
        </td>
        
        {/* 14. 彩票 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div>{agent.commission_condition?.gameRebateRates?.['lottery'] ? 
            `${agent.commission_condition.gameRebateRates['lottery']}%` : '-'}</div>
        </td>
        
        {/* 15. 棋牌 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div>{agent.commission_condition?.gameRebateRates?.['card'] ? 
            `${agent.commission_condition.gameRebateRates['card']}%` : '-'}</div>
        </td>
        
        {/* 16. 捕魚 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div>{agent.commission_condition?.gameRebateRates?.['fishing'] ? 
            `${agent.commission_condition.gameRebateRates['fishing']}%` : '-'}</div>
        </td>
        
        {/* 17. 代理分潤結算 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div>{agent.default_rebate_settlement ? 
            (agent.default_rebate_settlement === 'daily' ? '日結' :
             agent.default_rebate_settlement === 'weekly' ? '週結' :
             agent.default_rebate_settlement) : '-'}</div>
        </td>
        
        {/* 18. 管理 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div className="action-buttons" style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
            {currentUser?.id !== agent.id ? (
              <>
                <button
                  onClick={() => router.push(`/admin/agents/edit/${agent.id}`)}
                  className="btn-edit"
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                  title={canDeleteAgent() ? "編輯代理商" : "編輯聯絡資訊"}
                >
                  編輯
                </button>
                {canDeleteAgent() && (
                  <button
                    onClick={() => handleDelete(agent.id, agent.display_name || agent.username)}
                    className="btn-delete"
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                    title="刪除代理商（僅超級管理員和全域管理員）"
                  >
                    刪除
                  </button>
                )}
              </>
            ) : (
              <span style={{ color: '#999', fontSize: '12px' }}>—</span>
            )}
          </div>
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div>載入中...</div>
      </div>
    );
  }

  return (
    <div className="content-section">
      {/* 麵包屑導航 - 只在表格視圖顯示 */}
      {viewMode === 'table' && (
        <div style={{
          padding: '12px 16px',
          background: '#f9fafb',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px'
        }}>
          <span style={{ fontWeight: '600', color: '#6b7280' }}>當前位置:</span>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span style={{ color: '#9ca3af' }}>&gt;</span>}
              {index === breadcrumbs.length - 1 ? (
                // 最後一個麵包屑 - 黑色文字，不可點擊
                <span style={{ fontWeight: '600', color: '#111827' }}>
                  {crumb.agentName}
                </span>
              ) : (
                // 其他麵包屑 - 藍色連結，可點擊
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleBreadcrumbClick(index);
                  }}
                  style={{
                    color: '#2563eb',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  {crumb.agentName}
                </a>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
      
      {/* 表格控制區域 */}
      <div className="table-controls">
        <div className="result-info">
          共找到 {viewMode === 'table' ? getFilteredAgents().length : agents.length} 位代理商
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* 視圖模式切換按鈕 */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setViewMode('tree')}
              className={viewMode === 'tree' ? 'btn-view-active' : 'btn-view'}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: viewMode === 'tree' ? '2px solid #667eea' : '1px solid #ddd',
                background: viewMode === 'tree' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                color: viewMode === 'tree' ? 'white' : '#333',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
              title="樹狀視圖 - 顯示代理商層級關係"
            >
              樹狀
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={viewMode === 'table' ? 'btn-view-active' : 'btn-view'}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: viewMode === 'table' ? '2px solid #667eea' : '1px solid #ddd',
                background: viewMode === 'table' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                color: viewMode === 'table' ? 'white' : '#333',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
              title="表格視圖 - 以列表方式顯示所有代理商"
            >
              表格
            </button>
          </div>
          <div className="company-selector" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="companyFilter" style={{ fontWeight: '600', color: '#374151', fontSize: '14px' }}>篩選公司</label>
            <select 
              id="companyFilter"
              value={selectedCompany} 
              onChange={e => setSelectedCompany(Number(e.target.value))}
              className="form-select"
              style={{ padding: '8px 12px' }}
            >
              <option value={0}>所有公司</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 代理商列表 */}
      {agents.length === 0 ? (
        <div className="no-data">
          <div className="no-data-content">
            <div className="no-data-icon">👥</div>
            <div>尚未建立任何代理商</div>
            {canCreateAgent() && (
              <div className="no-data-hint">請點擊「新增代理商」開始建立</div>
            )}
          </div>
        </div>
      ) : (
        <div className="table-wrapper" style={{ position: 'relative', overflow: 'auto' }}>
          {viewMode === 'tree' ? (
            // 樹狀視圖
            <table className="data-table">
              <thead>
                <tr>
                  <th>代理商資訊</th>
                  <th>層級</th>
                  <th>所屬公司</th>
                  <th>聯絡方式</th>
                  <th>狀態</th>
                  <th>建立時間</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {buildAgentTree(agents).map(agent => renderAgentItemTree(agent)).flat()}
              </tbody>
            </table>
          ) : (
            // 表格視圖
            <table className="data-table" style={{ fontSize: '12px', position: 'relative' }} id="agent-table-view">
              <thead>
                <tr>
                  <th className="sticky-col-1">代理級別</th>
                  <th className="sticky-col-2">代理名稱</th>
                  <th>會員數量</th>
                  <th>代理帳號</th>
                  <th>代理姓名</th>
                  <th>帳號狀態</th>
                  <th>金流群組</th>
                  <th>註冊/登入時間</th>
                  <th>分潤制度</th>
                  <th>分潤比例(%)</th>
                  <th>真人</th>
                  <th>電子</th>
                  <th>體育</th>
                  <th>彩票</th>
                  <th>棋牌</th>
                  <th>捕魚</th>
                  <th>代理分潤結算</th>
                  <th>管理</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredAgents()
                  .sort((a, b) => a.agent_level - b.agent_level || a.id - b.id)
                  .map(agent => renderAgentItemTable(agent))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}