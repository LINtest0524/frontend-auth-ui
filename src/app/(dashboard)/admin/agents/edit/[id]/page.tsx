'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AgentEditForm from '../../_components/AgentEditForm';
import '@/styles/pages/agent-create-form.css';

export default function EditAgentPage() {
  const params = useParams();
  const agentId = Number(params.id);

  return (
    <div className="agent-form-container">
      {/* 頁面標題區域 */}
      <div className="agent-form-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Link 
            href="/admin/agents"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 12px',
              background: '#f3f4f6',
              color: '#374151',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
          >
            ← 返回列表
          </Link>
          <h1>✏️ 編輯代理商</h1>
        </div>
        <p>
          編輯代理商資料，修改基本資料、聯絡方式和登入資訊
        </p>
      </div>

      {/* 表單內容 */}
      <AgentEditForm agentId={agentId} />
    </div>
  );
}