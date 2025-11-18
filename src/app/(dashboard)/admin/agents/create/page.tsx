'use client';
import React from 'react';
import Link from 'next/link';
import AgentCreateForm from '../_components/AgentCreateForm';
import '@/styles/pages/agent-create-form.css';

export default function CreateAgentPage() {
  return (
    <div className="agent-form-container">
      {/* 頁面標題區域 */}
      <div className="agent-form-header">
        <h1>新增代理商</h1>
        <p>建立新的代理商帳號，設定基本資訊和權限</p>
      </div>

      {/* 表單內容 */}
      <div className="agent-form-content agent-01">
        <AgentCreateForm />
      </div>
    </div>
  );
}