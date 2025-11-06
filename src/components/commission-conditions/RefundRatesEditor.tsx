'use client';

import React from 'react';
import { PlatformRefundRate } from '@/types/commission-condition';
import { usePlatformDictionary } from '@/hooks/use-dictionary';

interface RefundRatesEditorProps {
  rates: PlatformRefundRate[];
  onChange: (rates: PlatformRefundRate[]) => void;
  error?: string;
}

export function RefundRatesEditor({ rates, onChange, error }: RefundRatesEditorProps) {
  const { platforms, loading: platformsLoading, error: platformsError } = usePlatformDictionary();
  
  const addRate = () => {
    const newRate: PlatformRefundRate = {
      platformCode: '',
      refundPercent: 0,
    };
    onChange([...rates, newRate]);
  };

  const updateRate = (index: number, field: keyof PlatformRefundRate, value: string | number) => {
    const updatedRates = rates.map((rate, i) => 
      i === index ? { ...rate, [field]: value } : rate
    );
    onChange(updatedRates);
  };

  const removeRate = (index: number) => {
    const updatedRates = rates.filter((_, i) => i !== index);
    onChange(updatedRates);
  };

  const getAvailablePlatforms = (currentIndex: number) => {
    const usedPlatforms = rates
      .map((rate, index) => index !== currentIndex ? rate.platformCode : null)
      .filter(Boolean);
    
    return platforms
      .filter(platform => platform.isActive)
      .filter(platform => !usedPlatforms.includes(platform.code));
  };

  const validatePercent = (value: string): boolean => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= 100;
  };

  // 載入或錯誤狀態
  if (platformsLoading) {
    return (
      <div className="refund-rates-editor">
        <div className="editor-header">
          <h4>平台退水費率</h4>
          <div className="loading-notice">⏳ 載入平台清單中...</div>
        </div>
      </div>
    );
  }

  if (platformsError) {
    return (
      <div className="refund-rates-editor">
        <div className="editor-header">
          <h4>平台退水費率</h4>
          <div className="error-notice">⚠️ {platformsError}</div>
        </div>
      </div>
    );
  }

  if (platforms.length === 0) {
    return (
      <div className="refund-rates-editor">
        <div className="editor-header">
          <h4>平台退水費率</h4>
          <div className="no-data-notice">
            📝 尚無平台字典，請聯繫管理員設定
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="refund-rates-editor">
      <div className="editor-header">
        <h4>平台退水費率</h4>
        <button
          type="button"
          onClick={addRate}
          className="btn btn-sm btn-outline add-btn"
        >
          ➕ 新增平台退水
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="rates-list">
        {rates.length === 0 ? (
          <div className="empty-state">
            <p>尚未設定平台退水費率</p>
            <p className="hint">點擊「新增平台退水」開始設定</p>
          </div>
        ) : (
          rates.map((rate, index) => {
            const availablePlatforms = getAvailablePlatforms(index);
            const hasError = !rate.platformCode || !validatePercent(rate.refundPercent.toString());
            
            return (
              <div key={index} className={`rate-item ${hasError ? 'error' : ''}`}>
                <div className="rate-fields">
                  <div className="field-group">
                    <label>平台</label>
                    <select
                      value={rate.platformCode}
                      onChange={(e) => updateRate(index, 'platformCode', e.target.value)}
                      className="platform-select"
                    >
                      <option value="">請選擇平台</option>
                      {availablePlatforms.map(platform => (
                        <option key={platform.code} value={platform.code}>
                          {platform.name} ({platform.code})
                        </option>
                      ))}
                      {rate.platformCode && !availablePlatforms.find(p => p.code === rate.platformCode) && (
                        <option value={rate.platformCode}>
                          {platforms.find(p => p.code === rate.platformCode)?.name || rate.platformCode} (已選用)
                        </option>
                      )}
                    </select>
                  </div>

                  <div className="field-group">
                    <label>退水比例 (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={rate.refundPercent}
                      onChange={(e) => updateRate(index, 'refundPercent', parseFloat(e.target.value) || 0)}
                      className="percent-input"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeRate(index)}
                  className="btn btn-sm btn-danger remove-btn"
                >
                  🗑️
                </button>
              </div>
            );
          })
        )}
      </div>

      <style jsx>{`
        .refund-rates-editor {
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

        .rates-list {
          space-y: 12px;
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

        .rate-item {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          padding: 12px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          margin-bottom: 8px;
        }

        .rate-item.error {
          border-color: #ef4444;
          background: #fef2f2;
        }

        .rate-fields {
          display: flex;
          gap: 12px;
          flex: 1;
        }

        .field-group {
          flex: 1;
        }

        .field-group label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 4px;
        }

        .platform-select, .percent-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
        }

        .platform-select:focus, .percent-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 1px #3b82f6;
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

        .remove-btn {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}