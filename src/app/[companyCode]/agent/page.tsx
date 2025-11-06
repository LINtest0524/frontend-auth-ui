'use client';
import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import '@/styles/pages/agent-dashboard.css';

export default function AgentDashboardPage() {
  const params = useParams();
  const companyCode = params.companyCode as string;

  return (
    <div className="agent-dashboard-container">
      <div className="agent-header">
        <h1>🏢 代理管理</h1>
        <p style={{ 
          color: '#6b7280', 
          fontSize: '14px',
          margin: '8px 0 0 0'
        }}>
          代理商管理中心
        </p>
      </div>

      <div className="agent-menu-grid">
        <Link 
          href={`/${companyCode}/agent/dashboard`}
          className="agent-menu-card"
        >
          <div className="agent-menu-icon">👥</div>
          <h3>代理商</h3>
          <p>管理代理商資訊</p>
        </Link>

        <Link 
          href={`/${companyCode}/agent/commission-condition`}
          className="agent-menu-card"
        >
          <div className="agent-menu-icon">💰</div>
          <h3>占成條件</h3>
          <p>設定代理商占成條件</p>
        </Link>
      </div>
    </div>
  );
}