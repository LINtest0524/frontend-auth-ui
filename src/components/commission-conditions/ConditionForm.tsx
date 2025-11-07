'use client';

import React, { useState, useEffect } from 'react';
import { 
  CommissionCondition, 
  CommissionMethod, 
  CreateCommissionConditionDto,
  UpdateCommissionConditionDto,
  ConditionGroup 
} from '@/types/commission-condition';
import { ConditionGroupCard } from './ConditionGroupCard';
import { useAgentsList } from '@/hooks/use-dictionary';
import { PreviewCalculator } from './PreviewCalculator';
import { useCompanySlug } from '@/hooks/useCompanySlug';
import '@/styles/components/preview-calculator.css';

interface ConditionFormProps {
  mode: 'create' | 'edit';
  initialData?: CommissionCondition;
  onSubmit: (data: any) => Promise<void> | void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConditionForm({ mode, initialData, onSubmit, onCancel, loading }: ConditionFormProps) {
  const { agents, loading: agentsLoading, error: agentsError } = useAgentsList({ 
    active: true, 
    autoLoad: true 
  });
  
  const [formData, setFormData] = useState({
    name: '',
    agentId: '' as any, // 初始為空值，選擇後會變為數字
    method: CommissionMethod.SETTLEMENT_ACTIVE_MEMBERS,
    isActive: true,
    effectiveFrom: '',
    effectiveTo: '',
    groups: [] as ConditionGroup[],
  });

  const [errors, setErrors] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const companySlug = useCompanySlug();

  // 初始化表單資料
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        name: initialData.name,
        agentId: initialData.agentId,
        method: initialData.method,
        isActive: initialData.isActive,
        effectiveFrom: initialData.effectiveFrom || '',
        effectiveTo: initialData.effectiveTo || '',
        groups: initialData.groups || [],
      });
    } else if (mode === 'create') {
      // 新增模式預設一個群組
      setFormData(prev => ({
        ...prev,
        groups: [{
          minRegistrations: 0,
          minActiveMembers: 0,
          minValidBets: 0,
          minNetRevenue: 0,
          requireNegativeProfit: false,
          sharePercent: 0,
          agentRemitPercent: 0,
          order: 1,
          platformRefundRates: [],
          fixedCost: undefined,
        } as ConditionGroup],
      }));
    }
  }, [mode, initialData]);

  // 表單驗證
  const validateForm = () => {
    const newErrors: Record<string, any> = {};

    if (!formData.name.trim()) {
      newErrors.name = '條件名稱為必填';
    }

    if (formData.agentId === '' || formData.agentId === null || formData.agentId === undefined) {
      newErrors.agentId = '請選擇代理商';
    }

    if (formData.groups.length === 0) {
      newErrors.groups = '至少需要一個條件群組';
    }

    // 驗證群組
    formData.groups.forEach((group, index) => {
      const sharePercent = Number(group.sharePercent);
      const agentRemitPercent = Number(group.agentRemitPercent);
      
      if (sharePercent < 0 || sharePercent > 100) {
        newErrors[`group_${index}_share`] = '分潤比例必須在 0-100 之間';
      }
      if (agentRemitPercent < 0 || agentRemitPercent > 100) {
        newErrors[`group_${index}_remit`] = '代理抽成必須在 0-100 之間';
      }
    });

    // 基本日期驗證
    if (formData.effectiveFrom && formData.effectiveTo) {
      const fromDate = new Date(formData.effectiveFrom);
      const toDate = new Date(formData.effectiveTo);
      if (fromDate > toDate) {
        newErrors.effectiveTo = '結束日期必須晚於開始日期';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 日期變更處理 (移除重疊檢查)
  const handleDateChange = (field: 'effectiveFrom' | 'effectiveTo', value: string) => {
    updateFormData(field, value);
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除該欄位的錯誤
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const addGroup = () => {
    const newGroup: ConditionGroup = {
      minRegistrations: 0,
      minActiveMembers: 0,
      minValidBets: 0,
      minNetRevenue: 0,
      requireNegativeProfit: false,
      sharePercent: 0,
      agentRemitPercent: 0,
      order: formData.groups.length + 1,
      platformRefundRates: [],
      fixedCost: undefined,
    } as ConditionGroup;
    
    setFormData(prev => ({
      ...prev,
      groups: [...prev.groups, newGroup],
    }));
  };

  const updateGroup = (index: number, group: ConditionGroup) => {
    const updatedGroups = formData.groups.map((g, i) => 
      i === index ? { ...group, order: i + 1 } : g
    );
    setFormData(prev => ({ ...prev, groups: updatedGroups }));
  };

  const moveGroup = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.groups.length) return;

    const updatedGroups = [...formData.groups];
    [updatedGroups[index], updatedGroups[newIndex]] = [updatedGroups[newIndex], updatedGroups[index]];
    
    // 重新設定 order
    updatedGroups.forEach((group, i) => {
      group.order = i + 1;
    });

    setFormData(prev => ({ ...prev, groups: updatedGroups }));
  };

  const removeGroup = (index: number) => {
    if (formData.groups.length <= 1) return;
    
    const updatedGroups = formData.groups.filter((_, i) => i !== index);
    // 重新設定 order
    updatedGroups.forEach((group, i) => {
      group.order = i + 1;
    });
    
    setFormData(prev => ({ ...prev, groups: updatedGroups }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // 佣金條件是方案池概念，移除重疊檢查

    setIsSubmitting(true);
    
    try {
      const submitData = {
        name: formData.name.trim(),
        agentId: Number(formData.agentId), // 確保是數字
        method: formData.method,
        isActive: formData.isActive,
        effectiveFrom: formData.effectiveFrom || undefined,
        effectiveTo: formData.effectiveTo || undefined,
        groups: formData.groups.map((group, index) => ({
          minRegistrations: group.minRegistrations || 0,
          minActiveMembers: group.minActiveMembers || 0,
          minValidBets: group.minValidBets || 0,
          minNetRevenue: group.minNetRevenue || 0,
          requireNegativeProfit: group.requireNegativeProfit || false,
          sharePercent: group.sharePercent,
          agentRemitPercent: group.agentRemitPercent,
          platformRefundRates: group.platformRefundRates?.filter(rate => 
            rate.platformCode && rate.refundPercent !== undefined
          ) || [],
          fixedCost: group.fixedCost || undefined,
        })),
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('❌ 提交失敗:', error);
      
      // 顯示一般錯誤訊息
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMethodDisplay = (method: CommissionMethod) => {
    switch (method) {
      case CommissionMethod.SETTLEMENT_ACTIVE_MEMBERS:
        return '活躍會員占成';
      case CommissionMethod.SETTLEMENT_ECPAY_PERSON:
        return '綠界個人占成';
      default:
        return method;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="condition-form">
      {/* 基本資訊 */}
      <div className="form-section">
        <h3>基本資訊</h3>
        <div className="form-grid">
          <div className="field-group">
            <label className="required">占成名稱</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              className="text-input"
              placeholder="請輸入占成名稱"
              maxLength={100}
            />
            {errors.name && <span className="error">{errors.name}</span>}
          </div>

          <div className="field-group">
            <label className="required">代理商</label>
            <select
              value={formData.agentId}
              onChange={(e) => updateFormData('agentId', parseInt(e.target.value))}
              className="select-input"
              disabled={agentsLoading}
            >
              <option value="">
                {agentsLoading ? '⏳ 載入代理清單中...' : 
                 agentsError ? '❌ 載入失敗' : 
                 '請選擇代理商'}
              </option>
              {!agentsLoading && !agentsError && (
                <>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} (Level {agent.level})
                    </option>
                  ))}
                </>
              )}
            </select>
            {errors.agentId && <span className="error">{errors.agentId}</span>}
            {agentsError && (
              <span className="error">
                代理清單載入失敗: {agentsError}
              </span>
            )}
          </div>

          <div className="field-group">
            <label className="required">計算方式</label>
            <select
              value={formData.method}
              onChange={(e) => updateFormData('method', e.target.value as CommissionMethod)}
              className="select-input"
            >
              {Object.values(CommissionMethod).map(method => (
                <option key={method} value={method}>
                  {getMethodDisplay(method)}
                </option>
              ))}
            </select>
            {errors.method && <span className="error">{errors.method}</span>}
          </div>

          <div className="field-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => updateFormData('isActive', e.target.checked)}
              />
              啟用狀態
            </label>
          </div>
        </div>
      </div>

      {/* 有效期間 */}
      <div className="form-section">
        <h3>有效期間（可選）</h3>
        <div className="form-grid">
          <div className="field-group">
            <label>開始日期</label>
            <input
              type="date"
              value={formData.effectiveFrom}
              onChange={(e) => handleDateChange('effectiveFrom', e.target.value)}
              className="date-input"
            />
          </div>

          <div className="field-group">
            <label>結束日期</label>
            <input
              type="date"
              value={formData.effectiveTo}
              onChange={(e) => handleDateChange('effectiveTo', e.target.value)}
              className="date-input"
            />
            {errors.effectiveTo && <span className="error">{errors.effectiveTo}</span>}
          </div>

        </div>
      </div>

      {/* 條件組 */}
      <div className="form-section">
        <div className="section-header">
          <h3>條件組</h3>
          <button
            type="button"
            onClick={addGroup}
            className="btn btn-outline add-group-btn"
          >
            ➕ 新增一段
          </button>
        </div>

        {errors.groups && <div className="error">{errors.groups}</div>}

        <div className="groups-container">
          {formData.groups.map((group, index) => (
            <ConditionGroupCard
              key={index}
              group={group}
              index={index}
              totalGroups={formData.groups.length}
              onChange={(updatedGroup) => updateGroup(index, updatedGroup)}
              onMoveUp={() => moveGroup(index, 'up')}
              onMoveDown={() => moveGroup(index, 'down')}
              onRemove={() => removeGroup(index)}
              errors={errors.groupErrors?.[index] || {}}
            />
          ))}
        </div>
      </div>

      {/* 試算預覽區塊 */}
      <PreviewCalculator 
        conditionId={mode === 'edit' && initialData ? initialData.id : undefined}
        conditionData={formData}
        className="preview-section"
      />

      {/* 按鈕區 */}
      <div className="form-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={isSubmitting}
        >
          取消
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? '儲存中...' : (mode === 'create' ? '建立' : '更新')}
        </button>
      </div>

      <style jsx>{`
        .condition-form {
          max-width: 1200px;
          margin: 0 auto;
        }

        .form-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .form-section h3 {
          margin: 0 0 20px 0;
          font-size: 18px;
          font-weight: 600;
          color: #374151;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .section-header h3 {
          margin: 0;
        }

        .add-group-btn {
          background: #10b981;
          color: white;
          border: none;
        }

        .add-group-btn:hover {
          background: #059669;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .field-group {
          display: flex;
          flex-direction: column;
        }

        .field-group label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
        }

        .field-group label.required::after {
          content: ' *';
          color: #ef4444;
        }

        .text-input, .select-input, .date-input {
          padding: 0px 12px;
          height: 40px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .text-input:focus, .select-input:focus, .date-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 1px #3b82f6;
        }

        .checkbox-group {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          margin: 0;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
        }

        .error {
          color: #ef4444;
          font-size: 12px;
          margin-top: 4px;
        }

        .groups-container {
          margin-top: 20px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 24px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          margin-top: 24px;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .btn-outline {
          background: white;
          border: 1px solid #d1d5db;
          color: #374151;
        }

        .btn-outline:hover {
          background: #f9fafb;
        }

        /* 重疊檢查樣式 */
        .overlap-check-btn {
          font-size: 13px;
          padding: 8px 16px;
          margin-top: 20px;
        }

        .overlap-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px;
          border-radius: 6px;
          margin-top: 16px;
          font-size: 14px;
        }

        .overlap-result {
          margin-top: 16px;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid;
        }

        .overlap-result.has-conflict {
          background: #fef2f2;
          border-color: #fecaca;
        }

        .overlap-result.no-conflict {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }

        .conflict-details h4 {
          margin: 0 0 12px 0;
          color: #dc2626;
          font-size: 16px;
        }

        .conflict-list {
          margin: 12px 0;
        }

        .conflict-item {
          background: white;
          padding: 12px;
          border: 1px solid #f3f4f6;
          border-radius: 6px;
          margin-bottom: 8px;
        }

        .conflict-item strong {
          color: #374151;
        }

        .conflict-item small {
          color: #6b7280;
        }

        .suggestions {
          margin-top: 16px;
          padding: 12px;
          background: #fffbeb;
          border: 1px solid #fed7aa;
          border-radius: 6px;
        }

        .suggestions h5 {
          margin: 0 0 8px 0;
          color: #92400e;
          font-size: 14px;
        }

        .suggestions ul {
          margin: 0;
          padding-left: 16px;
        }

        .suggestions li {
          color: #b45309;
          font-size: 13px;
          margin-bottom: 4px;
        }

        .no-conflict-message {
          color: #166534;
          font-weight: 500;
          text-align: center;
        }
      `}</style>
    </form>
  );
}