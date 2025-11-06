'use client';
import React from 'react';
import Link from 'next/link';
import AgentCreateForm from '../_components/AgentCreateForm';
import '@/styles/pages/banner-form.css';

export default function CreateAgentPage() {
  return (
    <div className="banner-form-container">
      {/* 頁面標題區域 */}
      <div className="banner-form-header">
        <h1>➕ 新增代理商</h1>
      </div>

      {/* 表單內容 */}
      <div className="banner-form-content">
        <AgentCreateForm />
      </div>
    </div>
  );
}