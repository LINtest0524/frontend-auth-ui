'use client';
import React from 'react';
import AuditLogTable from '@/components/AuditLogTable';

export default function AgentOperationsPage() {
  return (
    <AuditLogTable 
      title="代理商操作紀錄"
      targetFilter="Agent"
      actions={[
        { value: '新增代理商', label: '新增代理商' },
        { value: '編輯代理商資料', label: '編輯代理商資料' },
        { value: '刪除代理商', label: '刪除代理商' },
        { value: '啟用代理商', label: '啟用代理商' },
        { value: '停用代理商', label: '停用代理商' },
      ]}
    />
  );
}
