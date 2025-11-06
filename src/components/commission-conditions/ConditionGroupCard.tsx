'use client';

import React from 'react';
import { ConditionGroup } from '@/types/commission-condition';
import { RefundRatesEditor } from './RefundRatesEditor';
import { FixedCostEditor } from './FixedCostEditor';

interface ConditionGroupCardProps {
  group: ConditionGroup;
  index: number;
  totalGroups: number;
  onChange: (group: ConditionGroup) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  errors?: Record<string, string>;
}

export function ConditionGroupCard({
  group,
  index,
  totalGroups,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  errors = {},
}: ConditionGroupCardProps) {

  const updateGroup = (field: keyof ConditionGroup, value: any) => {
    onChange({ ...group, [field]: value });
  };

  const focusSection = (sectionType: string) => {
    // 根據點擊的功能按鈕聚焦對應區塊
    switch (sectionType) {
      case 'refund':
        if (!group.platformRefundRates || group.platformRefundRates.length === 0) {
          updateGroup('platformRefundRates', [{ platformCode: '', refundPercent: 0 }]);
        }
        break;
      case 'negativePprofit':
        updateGroup('requireNegativeProfit', true);
        break;
      case 'agentRemit':
        // 聚焦到代理繳款上繳比例欄位
        break;
      case 'share':
        // 聚焦到占成欄位
        break;
      case 'operatingCost':
        if (!group.fixedCost) {
          updateGroup('fixedCost', {
            feeDeposit: 0,
            feeWithdraw: 0,
            refundBudgetPercent: 0,
            promoBudgetPercent: 0,
            bonusBudgetPercent: 0,
          });
        }
        break;
    }
  };

  return (
    <div className="condition-group-card">
      <div className="card-header">
        <h3>第 {index + 1} 段</h3>
        <div className="card-actions">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="btn btn-sm action-btn"
            title="上移"
          >
            ⬆️
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === totalGroups - 1}
            className="btn btn-sm action-btn"
            title="下移"
          >
            ⬇️
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={totalGroups <= 1}
            className="btn btn-sm btn-danger"
            title="刪除"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="card-content">
        {/* 功能按鈕區 */}
        <div className="function-buttons">
          <button
            type="button"
            onClick={() => focusSection('refund')}
            className="function-btn"
          >
            +退水
          </button>
          <button
            type="button"
            onClick={() => focusSection('negativePprofit')}
            className="function-btn"
          >
            +負盈利
          </button>
          <button
            type="button"
            onClick={() => focusSection('agentRemit')}
            className="function-btn"
          >
            +代理繳款上繳比例
          </button>
          <button
            type="button"
            onClick={() => focusSection('share')}
            className="function-btn"
          >
            +占成
          </button>
          <button
            type="button"
            onClick={() => focusSection('operatingCost')}
            className="function-btn"
          >
            +運營成本
          </button>
        </div>

        {/* 門檻條件區 */}
        <div className="section thresholds-section">
          <h4>門檻條件</h4>
          <div className="form-grid">
            <div className="field-group">
              <label>註冊人數 ≥</label>
              <input
                type="number"
                min="0"
                value={group.minRegistrations || 0}
                onChange={(e) => updateGroup('minRegistrations', parseInt(e.target.value) || 0)}
                className="number-input"
              />
              {errors.minRegistrations && <span className="error">{errors.minRegistrations}</span>}
            </div>

            <div className="field-group">
              <label>活躍會員 ≥</label>
              <input
                type="number"
                min="0"
                value={group.minActiveMembers || 0}
                onChange={(e) => updateGroup('minActiveMembers', parseInt(e.target.value) || 0)}
                className="number-input"
              />
              {errors.minActiveMembers && <span className="error">{errors.minActiveMembers}</span>}
            </div>

            <div className="field-group">
              <label>有效下注 ≥</label>
              <input
                type="number"
                min="0"
                value={group.minValidBets || 0}
                onChange={(e) => updateGroup('minValidBets', parseInt(e.target.value) || 0)}
                className="number-input"
              />
              {errors.minValidBets && <span className="error">{errors.minValidBets}</span>}
            </div>

            <div className="field-group">
              <label>淨輸贏 ≥</label>
              <input
                type="number"
                step="0.01"
                value={group.minNetRevenue || 0}
                onChange={(e) => updateGroup('minNetRevenue', parseFloat(e.target.value) || 0)}
                className="number-input"
              />
              {errors.minNetRevenue && <span className="error">{errors.minNetRevenue}</span>}
            </div>

            <div className="field-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={group.requireNegativeProfit || false}
                  onChange={(e) => updateGroup('requireNegativeProfit', e.target.checked)}
                />
                是否需負盈利
              </label>
              {errors.requireNegativeProfit && <span className="error">{errors.requireNegativeProfit}</span>}
            </div>
          </div>
        </div>

        {/* 結果設定區 */}
        <div className="section results-section">
          <h4>結果設定</h4>
          <div className="form-grid">
            <div className="field-group">
              <label>占成 (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={group.sharePercent || 0}
                onChange={(e) => updateGroup('sharePercent', parseFloat(e.target.value) || 0)}
                className="percent-input"
                placeholder="0.00"
              />
              {errors.sharePercent && <span className="error">{errors.sharePercent}</span>}
            </div>

            <div className="field-group">
              <label>代理上繳比例 (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={group.agentRemitPercent || 0}
                onChange={(e) => updateGroup('agentRemitPercent', parseFloat(e.target.value) || 0)}
                className="percent-input"
                placeholder="0.00"
              />
              {errors.agentRemitPercent && <span className="error">{errors.agentRemitPercent}</span>}
            </div>
          </div>
        </div>

        {/* 平台退水區 */}
        <div className="section refund-section">
          <RefundRatesEditor
            rates={group.platformRefundRates || []}
            onChange={(rates) => updateGroup('platformRefundRates', rates)}
            error={errors.platformRefundRates}
          />
        </div>

        {/* 固定費用區 */}
        <div className="section fixed-cost-section">
          <FixedCostEditor
            cost={group.fixedCost || null}
            onChange={(cost) => updateGroup('fixedCost', cost)}
            error={errors.fixedCost}
          />
        </div>
      </div>

      <style jsx>{`
        .condition-group-card {
          border: 1px solid #d1d5db;
          border-radius: 12px;
          background: white;
          margin-bottom: 20px;
          overflow: hidden;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #f3f4f6;
          border-bottom: 1px solid #d1d5db;
        }

        .card-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #374151;
        }

        .card-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          padding: 4px 8px;
          background: #f9fafb;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .action-btn:hover:not(:disabled) {
          background: #f3f4f6;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-danger {
          background: #fef2f2;
          border-color: #fecaca;
          color: #dc2626;
        }

        .btn-danger:hover:not(:disabled) {
          background: #fee2e2;
        }

        .card-content {
          padding: 20px;
        }

        .function-buttons {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .function-btn {
          padding: 6px 12px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .function-btn:hover {
          background: #059669;
        }

        .section {
          margin-bottom: 24px;
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #fafafa;
        }

        .section h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .field-group label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 4px;
        }

        .number-input, .percent-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
        }

        .number-input:focus, .percent-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 1px #3b82f6;
        }

        .checkbox-group {
          display: flex;
          align-items: center;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          margin: 0;
        }

        .checkbox-label input[type="checkbox"] {
          width: 16px;
          height: 16px;
        }

        .error {
          color: #dc2626;
          font-size: 12px;
          margin-top: 4px;
          display: block;
        }

        .thresholds-section {
          background: #f0f9ff;
          border-color: #bae6fd;
        }

        .results-section {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }

        .refund-section, .fixed-cost-section {
          background: #fffbeb;
          border-color: #fed7aa;
        }
      `}</style>
    </div>
  );
}