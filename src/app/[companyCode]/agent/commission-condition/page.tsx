'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import '@/styles/pages/agent-dashboard.css';

export default function CommissionConditionPage() {
  const params = useParams();
  const companyCode = params.companyCode as string;

  return (
    <div className="commission-condition-container">
      <div className="commission-header">
        <h1>💰 占成條件</h1>
        <p style={{ 
          color: '#6b7280', 
          fontSize: '14px',
          margin: '8px 0 0 0'
        }}>
          設定和管理代理商占成條件
        </p>
      </div>

      <div className="commission-content">
        {/* 這裡將放置占成條件相關功能 */}
        <p>占成條件功能開發中...</p>
        <p>公司代碼: {companyCode}</p>
      </div>
    </div>
  );
}