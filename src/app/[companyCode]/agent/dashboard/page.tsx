'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import '@/styles/pages/agent-dashboard.css';

export default function AgentDashboardPage() {
  const params = useParams();
  const companyCode = params.companyCode as string;

  return (
    <div className="agent-dashboard-container">
      <div className="agent-header">
        <h1>👥 代理商</h1>
        <p style={{ 
          color: '#6b7280', 
          fontSize: '14px',
          margin: '8px 0 0 0'
        }}>
          代理商管理與查看
        </p>
      </div>

      <div className="agent-content">
        {/* 這裡將放置代理商相關功能 */}
        <p>代理商功能開發中...</p>
      </div>
    </div>
  );
}