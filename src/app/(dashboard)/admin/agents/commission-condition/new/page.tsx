'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCommissionConditionsStore } from '@/stores/useCommissionConditionsStore';
import { ConditionForm } from '@/components/commission-conditions/ConditionForm';
import { CreateCommissionConditionDto } from '@/types/commission-condition';
import '@/styles/pages/commission-condition-form.css';

export default function NewCommissionConditionPage() {
  const router = useRouter();
  const { createOne, loading } = useCommissionConditionsStore();

  const handleSubmit = async (data: CreateCommissionConditionDto) => {
    try {
      await createOne(data);
      // TODO: 顯示成功 Toast
      router.push('/admin/agents/commission-condition');
    } catch (error) {
      // 錯誤已在 store 中處理
    }
  };

  const handleCancel = () => {
    router.push('/admin/agents/commission-condition');
  };

  return (
    <div className="commission-condition-form-container">
      {/* 頁面標題 */}
      <div className="commission-condition-form-header">
        <h1>
          <span>➕</span>
          新增占成條件
        </h1>
      </div>

      {/* 表單內容 */}
      <div className="commission-condition-form-content">
        <ConditionForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
        {/* 確認檔案位置 - 這是 new/page.tsx */}
      </div>
    </div>
  );
}