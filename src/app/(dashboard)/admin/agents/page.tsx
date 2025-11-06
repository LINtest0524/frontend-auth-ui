'use client';
import React from 'react';
import Link from 'next/link';
import AgentList from './_components/AgentList';
import { useUserStore } from '@/hooks/use-user-store';
import '@/styles/pages/users.css';

export default function AgentsPage() {
  const currentUser = useUserStore((state) => state.user);
  
  // 權限檢查：只有超級管理員和全域管理員可以新增代理商
  const canCreateAgent = () => {
    return currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'GLOBAL_ADMIN';
  };

  return (
    <div className="users-container">
      {/* 頁面標題區域 */}
      <div className="users-header">
        <h1>🏢 代理商管理</h1>
        <div className="users-header-actions">
          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
            {canCreateAgent() 
              ? '📊 管理所有代理商帳號，查看代理商層級結構和詳細資訊'
              : '📊 查看代理商層級結構和詳細資訊'
            }
          </div>
          {canCreateAgent() && (
            <Link 
              href="/admin/agents/create"
              className="btn-primary"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
              }}
              title="僅超級管理員和全域管理員可新增代理商"
            >
              ➕ 新增代理商
            </Link>
          )}
        </div>
      </div>

      {/* 代理商列表內容 */}
      <AgentList />
    </div>
  );
}