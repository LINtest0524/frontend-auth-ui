'use client';

import React from 'react';
import { FixedCost } from '@/types/commission-condition';

interface FixedCostEditorProps {
  cost: FixedCost | null;
  onChange: (cost: FixedCost | null) => void;
  error?: string;
}

export function FixedCostEditor({ cost, onChange, error }: FixedCostEditorProps) {
  const initializeCost = () => {
    const newCost: FixedCost = {
      feeDeposit: 0,
      feeWithdraw: 0,
      refundBudgetPercent: 0,
      promoBudgetPercent: 0,
      bonusBudgetPercent: 0,
    };
    onChange(newCost);
  };

  const updateCost = (field: keyof FixedCost, value: string | number) => {
    if (!cost) return;
    
    const updatedCost = { ...cost, [field]: value };
    onChange(updatedCost);
  };

  const removeCost = () => {
    onChange(null);
  };

  const validateNumber = (value: string, isPercent = false): boolean => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return false;
    if (isPercent && num > 100) return false;
    return true;
  };

  return (
    <div className="fixed-cost-editor">
      <div className="editor-header">
        <h4>固定費用</h4>
        {cost ? (
          <button
            type="button"
            onClick={removeCost}
            className="btn btn-sm btn-danger"
          >
            🗑️ 移除
          </button>
        ) : (
          <button
            type="button"
            onClick={initializeCost}
            className="btn btn-sm btn-outline add-btn"
          >
            ➕ 新增固定費用
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {cost ? (
        <div className="cost-form">
          <div className="form-grid">
            <div className="field-group">
              <label>存款手續費</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cost.feeDeposit}
                onChange={(e) => updateCost('feeDeposit', parseFloat(e.target.value) || 0)}
                className="number-input"
                placeholder="0.00"
              />
            </div>

            <div className="field-group">
              <label>提款手續費</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cost.feeWithdraw}
                onChange={(e) => updateCost('feeWithdraw', parseFloat(e.target.value) || 0)}
                className="number-input"
                placeholder="0.00"
              />
            </div>

            <div className="field-group">
              <label>退水預算 (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={cost.refundBudgetPercent}
                onChange={(e) => updateCost('refundBudgetPercent', parseFloat(e.target.value) || 0)}
                className="percent-input"
                placeholder="0.00"
              />
            </div>

            <div className="field-group">
              <label>優惠預算 (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={cost.promoBudgetPercent}
                onChange={(e) => updateCost('promoBudgetPercent', parseFloat(e.target.value) || 0)}
                className="percent-input"
                placeholder="0.00"
              />
            </div>

            <div className="field-group">
              <label>紅包預算 (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={cost.bonusBudgetPercent}
                onChange={(e) => updateCost('bonusBudgetPercent', parseFloat(e.target.value) || 0)}
                className="percent-input"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <p>尚未設定固定費用</p>
          <p className="hint">點擊「新增固定費用」開始設定</p>
        </div>
      )}

      <style jsx>{`
        .fixed-cost-editor {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          background: #f9fafb;
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .editor-header h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        .add-btn {
          background: #10b981;
          color: white;
          border: none;
        }

        .add-btn:hover {
          background: #059669;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .cost-form {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 16px;
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

        .empty-state {
          text-align: center;
          padding: 24px;
          color: #6b7280;
        }

        .empty-state p {
          margin: 0;
        }

        .hint {
          font-size: 12px;
          margin-top: 4px;
        }

        .btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-sm {
          padding: 4px 8px;
        }

        .btn-outline {
          background: white;
          border: 1px solid #d1d5db;
          color: #374151;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover {
          background: #dc2626;
        }
      `}</style>
    </div>
  );
}