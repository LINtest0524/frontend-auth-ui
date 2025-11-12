'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCommissionConditionsStore } from '@/stores/useCommissionConditionsStore';
import { ConditionForm } from '@/components/commission-conditions/ConditionForm';
import { CommissionCondition, UpdateCommissionConditionDto } from '@/types/commission-condition';
import '@/styles/pages/commission-condition-form.css';

export default function EditCommissionConditionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const { getOne, updateOne, loading } = useCommissionConditionsStore();
  const [initialData, setInitialData] = useState<CommissionCondition | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getOne(id);
        setInitialData(data);
      } catch (error) {
        // TODO: 顯示錯誤 Toast
      } finally {
        setLoadingData(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id, getOne]);

  const handleSubmit = async (data: UpdateCommissionConditionDto) => {
    try {
      await updateOne(id, data);
      // TODO: 顯示成功 Toast
      router.push('/admin/agents/commission-condition');
    } catch (error) {
      // 錯誤已在 store 中處理
    }
  };

  const handleCancel = () => {
    router.push('/admin/agents/commission-condition');
  };

  if (loadingData) {
    return (
      <div className="commission-condition-form-container">
        <div className="commission-condition-form-header">
          <h1>
            <span>⏳</span>
            載入占成條件資料
          </h1>
        </div>
        <div className="commission-condition-form-content">
          <div className="loading-spinner">
            載入中...
          </div>
        </div>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="commission-condition-form-container">
        <div className="commission-condition-form-header">
          <h1>
            <span>❌</span>
            找不到占成條件
          </h1>
        </div>
        <div className="commission-condition-form-content">
          <div className="form-section">
            <p>找不到占成條件資料</p>
            <div className="form-actions">
              <button onClick={handleCancel} className="btn-primary">
                返回列表
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="commission-condition-form-container">
      {/* 頁面標題 */}
      <div className="commission-condition-form-header">
        <h1>
          <span>✏️</span>
          編輯占成條件
        </h1>
      </div>

      {/* 表單內容 */}
      <div className="commission-condition-form-content">
        <ConditionForm
          mode="edit"
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </div>
  );
}