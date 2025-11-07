'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAgents, fetchAgentOptions, deleteAgent } from '../_lib/agent-api';
import { handleApiError } from '@/lib/errorHandler';
import { useUserStore } from '@/hooks/use-user-store';
import '@/styles/pages/agent-form.css';

interface Agent {
  id: number;
  agent_name: string;
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
}

export default function AgentList() {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.user);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<number>(0);
  const [loading, setLoading] = useState(true);

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
    } catch (e) {
      handleApiError(e, 'AgentList-loadAgents');
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

  // 渲染代理商項目
  const renderAgentItem = (agent: Agent, level: number = 0) => {
    const rows = [];
    
    
    // 主項目行
    rows.push(
      <tr key={agent.id} className={`agent-level-${Math.min(level + 1, 4)}`}>
        <td className={level > 0 ? `agent-indent-${Math.min(level, 3)}` : ''}>
          <div className="agent-title">
            {level > 0 && <span className="agent-level-indicator"></span>}
            <span style={{color: level > 0 ? '#ef4444' : '#000'}}>
              [樹狀層級:{level}]
            </span>
            <span className="agent-name">{agent.agent_name || agent.username}</span>
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
            {agent.phone && <div>📱 {agent.phone}</div>}
            {agent.email && <div>✉️ {agent.email}</div>}
            {agent.telegram && <div>📞 {agent.telegram}</div>}
            {agent.line && <div>💬 {agent.line}</div>}
          </div>
        </td>
        <td>
          <span className={`status-badge status-${agent.status.toLowerCase()}`}>
            {['active', 'ACTIVE'].includes(agent.status) ? '✅ 啟用' : 
             ['inactive', 'INACTIVE'].includes(agent.status) ? '❌ 停用' : '⏳ 待審核'}
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
                  ✏️ 編輯
                </button>
                {canDeleteAgent() && (
                  <button
                    onClick={() => handleDelete(agent.id, agent.agent_name || agent.username)}
                    className="btn-delete"
                    title="刪除代理商（僅超級管理員和全域管理員）"
                  >
                    🗑️ 刪除
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
      agent.children.forEach(child => {
        rows.push(...renderAgentItem(child, level + 1));
      });
    }
    
    return rows;
  };

  if (loading) {
    return (
      <div className="content-section">
        <div className="loading-spinner">
          <div>⏳ 載入中...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 表格控制區域 */}
      <div className="content-section">
        <div className="table-controls">
          <div className="table-info">
            📊 共 {agents.length} 位代理商
          </div>
          <div className="table-actions">
            <div className="company-selector">
              <label htmlFor="companyFilter">🏢 篩選公司</label>
              <select 
                id="companyFilter"
                value={selectedCompany} 
                onChange={e => setSelectedCompany(Number(e.target.value))}
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
            <img src="/no-information.webp" alt="無資料" />
            <p>尚未建立任何代理商</p>
            {canCreateAgent() && (
              <button
                onClick={() => router.push('/admin/agents/create')}
                className="btn-primary"
              >
                🚀 建立第一個代理商
              </button>
            )}
          </div>
        ) : (
          <table className="modern-table">
            <thead>
              <tr>
                <th>👤 代理商資訊</th>
                <th>📊 層級</th>
                <th>🏢 所屬公司</th>
                <th>📞 聯絡方式</th>
                <th>📈 狀態</th>
                <th>📅 建立時間</th>
                <th>⚙️ 操作</th>
              </tr>
            </thead>
            <tbody>
              {buildAgentTree(agents).map(agent => renderAgentItem(agent)).flat()}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}