'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCommissionConditionsStore } from '@/stores/useCommissionConditionsStore';
import { CommissionCondition, CommissionMethod } from '@/types/commission-condition';
import '@/styles/pages/commission-condition-form.css';

export default function ViewCommissionConditionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const { getOne } = useCommissionConditionsStore();
  const [data, setData] = useState<CommissionCondition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getOne(id);
        setData(result);
      } catch (error) {
        console.error('Failed to load commission condition:', error);
        // TODO: 顯示錯誤 Toast
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id, getOne]);

  const handleBack = () => {
    router.push('/admin/agents/commission-condition');
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

  if (loading) {
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

  if (!data) {
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
              <button onClick={handleBack} className="btn-primary">
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
          <span>👁️</span>
          查看占成條件
        </h1>
      </div>

      {/* 表單內容 */}
      <div className="commission-condition-form-content">
        <form className="condition-form">
          {/* 基本資訊 */}
          <div className="form-section">
            <div className="section-title">
              <span>📋</span>
              基本資訊
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">占成名稱</label>
                <div className="readonly-input">{data.name}</div>
              </div>

              <div className="form-group">
                <label className="form-label">代理商</label>
                <div className="readonly-input">
                  {data.agentId === 0 
                    ? '任意代理商' 
                    : (data.agent?.agent_name || data.agent?.username || `ID: ${data.agentId}`)
                  }
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">計算方式</label>
                <div className="readonly-input">{getMethodDisplay(data.method)}</div>
              </div>

              <div className="form-group">
                <div className="checkbox-group readonly-checkbox">
                  <input
                    type="checkbox"
                    checked={data.isActive}
                    disabled
                    readOnly
                  />
                  <label>啟用狀態</label>
                </div>
              </div>
            </div>
          </div>

          {/* 有效期間 */}
          <div className="form-section">
            <div className="section-title">
              <span>📅</span>
              有效期間（可選）
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">開始日期</label>
                <div className="readonly-input">
                  {data.effectiveFrom 
                    ? new Date(data.effectiveFrom).toLocaleDateString('zh-TW') 
                    : '未設定'
                  }
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">結束日期</label>
                <div className="readonly-input">
                  {data.effectiveTo 
                    ? new Date(data.effectiveTo).toLocaleDateString('zh-TW') 
                    : '未設定'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* 條件組 */}
          <div className="form-section">
            <div className="section-title">
              <span>🎯</span>
              條件組
            </div>

            <div className="groups-container">
              {data.groups && data.groups.map((group, index) => (
                <div key={group.id} className="condition-group-card readonly-group">
                  <div className="card-header">
                    <h3>
                      <span>{index + 1}</span>
                      條件組 {index + 1}
                    </h3>
                  </div>

                  <div className="card-content">
                    {/* 基本門檻 */}
                    <div className="section thresholds-section">
                      <h4>📊 基本門檻</h4>
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">最低註冊人數</label>
                          <div className="readonly-input">{group.minRegistrations}</div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">最低活躍會員</label>
                          <div className="readonly-input">{group.minActiveMembers}</div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">最低有效投注</label>
                          <div className="readonly-input">{group.minValidBets}</div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">最低淨營收</label>
                          <div className="readonly-input">NT$ {parseFloat(group.minNetRevenue).toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="form-group">
                        <div className="checkbox-group readonly-checkbox">
                          <input
                            type="checkbox"
                            checked={group.requireNegativeProfit}
                            disabled
                            readOnly
                          />
                          <label>需要負盈利</label>
                        </div>
                      </div>
                    </div>

                    {/* 分潤設定 */}
                    <div className="section results-section">
                      <h4>💰 分潤設定</h4>
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">分潤比例 (%)</label>
                          <div className="readonly-input">{group.sharePercent}</div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">代理商匯款比例 (%)</label>
                          <div className="readonly-input">{group.agentRemitPercent}</div>
                        </div>
                      </div>
                    </div>

                    {/* 平台退水費率 */}
                    {group.platformRefundRates && group.platformRefundRates.length > 0 && (
                      <div className="section refund-section">
                        <h4>🎮 平台退水費率</h4>
                        <div className="platform-rates-container">
                          {group.platformRefundRates.map((rate, rateIndex) => (
                            <div key={rateIndex} className="form-grid">
                              <div className="form-group">
                                <label className="form-label">平台代碼</label>
                                <div className="readonly-input">{rate.platformCode}</div>
                              </div>
                              <div className="form-group">
                                <label className="form-label">退水比例 (%)</label>
                                <div className="readonly-input">{rate.refundPercent}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 固定費用 */}
                    {group.fixedCost && (
                      <div className="section fixed-cost-section">
                        <h4>💸 固定費用</h4>
                        <div className="form-grid">
                          <div className="form-group">
                            <label className="form-label">存款手續費</label>
                            <div className="readonly-input">NT$ {parseFloat(group.fixedCost.feeDeposit).toLocaleString()}</div>
                          </div>
                          <div className="form-group">
                            <label className="form-label">提款手續費</label>
                            <div className="readonly-input">NT$ {parseFloat(group.fixedCost.feeWithdraw).toLocaleString()}</div>
                          </div>
                          <div className="form-group">
                            <label className="form-label">退水預算比例 (%)</label>
                            <div className="readonly-input">{group.fixedCost.refundBudgetPercent}</div>
                          </div>
                          <div className="form-group">
                            <label className="form-label">優惠預算比例 (%)</label>
                            <div className="readonly-input">{group.fixedCost.promoBudgetPercent}</div>
                          </div>
                          <div className="form-group">
                            <label className="form-label">紅利預算比例 (%)</label>
                            <div className="readonly-input">{group.fixedCost.bonusBudgetPercent}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 按鈕區 */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleBack}
              className="btn-secondary"
            >
              🔙 返回列表
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}