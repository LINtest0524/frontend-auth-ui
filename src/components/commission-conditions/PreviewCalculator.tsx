'use client';

import React, { useState } from 'react';
import { commissionPreviewApi, PreviewCommissionRequest, PreviewResult } from '@/lib/api/commission-preview-api';
import { useCompanySlug } from '@/hooks/useCompanySlug';

interface PreviewCalculatorProps {
  conditionId?: string; // 現有條件ID (編輯時使用)
  conditionData?: any;  // 表單數據 (新建時使用)
  className?: string;
}

export function PreviewCalculator({ conditionId, conditionData, className }: PreviewCalculatorProps) {
  const companySlug = useCompanySlug();
  
  const [isVisible, setIsVisible] = useState(false);
  const [inputData, setInputData] = useState<PreviewCommissionRequest>({
    registrations: 10,
    activeMembers: 5,
    validBets: 1000,
    netRevenue: -5000,
  });
  
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof PreviewCommissionRequest, value: number) => {
    setInputData(prev => ({ ...prev, [field]: value }));
    setResult(null); // 清除舊結果
    setError(null);
  };

  const handlePreview = async () => {
    if (!companySlug) {
      setError('無法取得公司資訊');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🧮 開始試算:', { conditionId, hasConditionData: !!conditionData, inputData });
      
      let previewResult: PreviewResult;
      
      if (conditionId) {
        // 試算現有條件
        previewResult = await commissionPreviewApi.previewExisting(companySlug, conditionId, inputData);
      } else if (conditionData) {
        // 試算表單條件
        previewResult = await commissionPreviewApi.previewForm(companySlug, conditionData, inputData);
      } else {
        throw new Error('缺少條件數據或條件ID');
      }
      
      setResult(previewResult);
      console.log('✅ 試算完成:', previewResult);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '試算失敗';
      setError(errorMessage);
      console.error('❌ 試算失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) {
    return (
      <div className={`preview-calculator-toggle ${className || ''}`}>
        <button
          type="button"
          onClick={() => setIsVisible(true)}
          className="preview-toggle-btn"
        >
          🧮 試算預覽
        </button>
      </div>
    );
  }

  return (
    <div className={`preview-calculator ${className || ''}`}>
      <div className="preview-header">
        <h4>🧮 佣金條件試算</h4>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="close-btn"
        >
          ✕
        </button>
      </div>

      <div className="preview-inputs">
        <div className="input-group">
          <label>註冊人數</label>
          <input
            type="number"
            value={inputData.registrations}
            onChange={(e) => handleInputChange('registrations', parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>

        <div className="input-group">
          <label>活躍會員數</label>
          <input
            type="number"
            value={inputData.activeMembers}
            onChange={(e) => handleInputChange('activeMembers', parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>

        <div className="input-group">
          <label>有效投注</label>
          <input
            type="number"
            value={inputData.validBets}
            onChange={(e) => handleInputChange('validBets', parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>

        <div className="input-group">
          <label>淨輸贏</label>
          <input
            type="number"
            value={inputData.netRevenue}
            onChange={(e) => handleInputChange('netRevenue', parseInt(e.target.value) || 0)}
          />
          <small>負數表示玩家獲利，正數表示平台獲利</small>
        </div>

        <button
          type="button"
          onClick={handlePreview}
          disabled={loading}
          className="preview-btn"
        >
          {loading ? '⏳ 試算中...' : '🧮 開始試算'}
        </button>
      </div>

      {error && (
        <div className="preview-error">
          <div className="error-message">❌ {error}</div>
        </div>
      )}

      {result && (
        <div className="preview-result">
          {result.success ? (
            <div className="success-result">
              <div className="result-header">
                <h5>✅ 試算成功</h5>
                <div className="preview-text">{result.preview}</div>
              </div>

              {result.matchedGroup && (
                <div className="matched-group">
                  <h6>📋 匹配條件組: {result.matchedGroup.groupName}</h6>
                  <div className="conditions">
                    <div>最低註冊: {result.matchedGroup.conditions.minRegistrations} 人</div>
                    <div>最低活躍: {result.matchedGroup.conditions.minActiveMembers} 人</div>
                    <div>最低投注: {result.matchedGroup.conditions.minValidBets.toLocaleString()}</div>
                    <div>最低淨輸贏: {result.matchedGroup.conditions.minNetRevenue.toLocaleString()}</div>
                    {result.matchedGroup.conditions.requireNegativeProfit && (
                      <div className="negative-profit">🔻 需要負利潤</div>
                    )}
                  </div>
                </div>
              )}

              {result.calculation && (
                <div className="calculation-detail">
                  <h6>💰 計算詳情</h6>
                  <div className="calc-row">
                    <span>佣金比例:</span>
                    <span>{result.calculation.sharePercent || 0}%</span>
                  </div>
                  <div className="calc-row">
                    <span>代理上繳:</span>
                    <span>{result.calculation.agentRemitPercent || 0}%</span>
                  </div>
                  <div className="calc-row highlight">
                    <span>總佣金:</span>
                    <span>{(result.calculation.totalCommission || 0).toLocaleString()}</span>
                  </div>
                  <div className="calc-row highlight">
                    <span>實得金額:</span>
                    <span>{(result.calculation.netAmount || 0).toLocaleString()}</span>
                  </div>
                  
                  {result.calculation.platformRefunds.length > 0 && (
                    <div className="platform-refunds">
                      <h6>🎮 平台退水</h6>
                      {result.calculation.platformRefunds.map((refund, index) => (
                        <div key={index} className="refund-item">
                          <span>{refund.platformName || refund.platformCode}</span>
                          <span>{refund.refundRate || 0}% = {(refund.refundAmount || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="error-result">
              <div className="error-header">
                <h5>❌ 無法匹配</h5>
                <div className="error-message">{result.message}</div>
              </div>

              {result.suggestions && result.suggestions.length > 0 && (
                <div className="suggestions">
                  <h6>💡 建議調整</h6>
                  <ul>
                    {result.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}