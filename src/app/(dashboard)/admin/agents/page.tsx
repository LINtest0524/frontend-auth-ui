'use client';
import React from 'react';
import Link from 'next/link';
import AgentList from './_components/AgentList';
import { useUserStore } from '@/hooks/use-user-store';
import '@/styles/pages/commission-conditions.css';

export default function AgentsPage() {
  const currentUser = useUserStore((state) => state.user);
  
  // 權限檢查：只有超級管理員和全域管理員可以新增代理商
  const canCreateAgent = () => {
    return currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'GLOBAL_ADMIN';
  };

  return (
    <div className="commission-conditions-container">
      {/* 頁面標題區域 */}
      <div className="commission-conditions-header">
        <h1>🏢 代理商管理</h1>
        <div className="commission-conditions-header-actions">
          {canCreateAgent() && (
            <Link 
              href="/admin/agents/create"
              className="btn-add"
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