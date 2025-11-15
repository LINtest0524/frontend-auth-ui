'use client';

import React, { useState, useEffect } from 'react';
import { 
  CommissionCondition, 
  CommissionMethod
} from '@/types/commission-condition';
import { useAgentsList } from '@/hooks/use-dictionary';
import { useCompanySlug } from '@/hooks/useCompanySlug';

// 新增代理制度類型
enum AgentSystemType {
  COMMISSION = 'COMMISSION', // 占成制
  REBATE = 'REBATE' // 返水制
}

// 新增代理級別類型
enum AgentLevelType {
  ANY = 'ANY', // 任一層級
  LEVEL_1 = 'LEVEL_1', // 1級代理
  LEVEL_2 = 'LEVEL_2', // 2級代理
  LEVEL_3 = 'LEVEL_3', // 3級代理
  LEVEL_4 = 'LEVEL_4', // 4級代理
  LEVEL_5 = 'LEVEL_5', // 5級代理
  LEVEL_6 = 'LEVEL_6', // 6級代理
  LEVEL_7 = 'LEVEL_7', // 7級代理
  LEVEL_8 = 'LEVEL_8', // 8級代理
  LEVEL_9 = 'LEVEL_9', // 9級代理
  LEVEL_10 = 'LEVEL_10', // 10級代理
  LEVEL_11 = 'LEVEL_11', // 11級代理
  LEVEL_12 = 'LEVEL_12' // 12級代理
}

// 新增結算週期類型
enum SettlementCycle {
  WEEKLY = 'WEEKLY', // 週結
  MONTHLY = 'MONTHLY' // 月結
}

// 遊戲類型
interface GameRebateRates {
  live: number; // 真人
  slot: number; // 電子
  sport: number; // 體育
  lottery: number; // 彩票
  card: number; // 棋牌
  fishing: number; // 捕魚
}

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
    systemType: AgentSystemType.COMMISSION, // 1. 代理制度
    name: '', // 2. 分潤名稱
    agentLevel: AgentLevelType.ANY, // 3. 代理級別選擇
    agentId: '' as any, // 4. 代理名稱選擇
    commissionPercent: '', // 5. 代理占成比例(%)
    gameRebateRates: { // 6. 代理返水條件(%)
      live: '',
      slot: '',
      sport: '',
      lottery: '',
      card: '',
      fishing: ''
    } as Record<string, string>,
    settlementCycle: SettlementCycle.WEEKLY // 7. 代理分潤結算
  });

  const [errors, setErrors] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const companySlug = useCompanySlug();

  // 初始化表單資料
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      // 編輯模式暫時保持原有結構
      setFormData({
        systemType: (initialData.systemType as AgentSystemType) || AgentSystemType.COMMISSION,
        name: initialData.name || '',
        agentLevel: (initialData.agentLevel as AgentLevelType) || AgentLevelType.ANY,
        agentId: initialData.agentId !== undefined ? initialData.agentId.toString() : '',
        commissionPercent: initialData.commissionPercent ? initialData.commissionPercent.toString() : '',
        gameRebateRates: {
          live: initialData.gameRebateRates?.live ? initialData.gameRebateRates.live.toString() : '',
          slot: initialData.gameRebateRates?.slot ? initialData.gameRebateRates.slot.toString() : '',
          sport: initialData.gameRebateRates?.sport ? initialData.gameRebateRates.sport.toString() : '',
          lottery: initialData.gameRebateRates?.lottery ? initialData.gameRebateRates.lottery.toString() : '',
          card: initialData.gameRebateRates?.card ? initialData.gameRebateRates.card.toString() : '',
          fishing: initialData.gameRebateRates?.fishing ? initialData.gameRebateRates.fishing.toString() : ''
        },
        settlementCycle: (initialData.settlementCycle as SettlementCycle) || SettlementCycle.WEEKLY
      });
    }
  }, [mode, initialData]);

  // 表單驗證
  const validateForm = () => {
    const newErrors: Record<string, any> = {};

    // 1. 代理制度 (必填)
    if (!formData.systemType) {
      newErrors.systemType = '請選擇代理制度';
    }

    // 2. 分潤名稱 (必填)
    if (!formData.name.trim()) {
      newErrors.name = '分潤名稱為必填';
    }

    // 3. 代理級別選擇 (必填)
    if (!formData.agentLevel) {
      newErrors.agentLevel = '請選擇代理級別';
    }

    // 4. 代理名稱選擇 (必填)
    if (formData.agentId === '' || formData.agentId === null || formData.agentId === undefined) {
      newErrors.agentId = '請選擇代理名稱';
    }

    // 5. 代理占成比例 (必填且為數字)
    if (!formData.commissionPercent.trim()) {
      newErrors.commissionPercent = '代理占成比例為必填';
    } else {
      const percent = parseFloat(formData.commissionPercent);
      if (isNaN(percent) || percent < 0 || percent > 100) {
        newErrors.commissionPercent = '代理占成比例必須為0-100之間的數字';
      }
    }

    // 6. 遊戲返水條件驗證
    const gameTypes = ['live', 'slot', 'sport', 'lottery', 'card', 'fishing'];
    gameTypes.forEach(gameType => {
      const value = formData.gameRebateRates[gameType];
      if (value && value.trim()) {
        const percent = parseFloat(value);
        if (isNaN(percent) || percent < 0 || percent > 100) {
          newErrors[`gameRebate_${gameType}`] = `${getGameTypeName(gameType)}返水比例必須為0-100之間的數字`;
        }
      }
    });

    // 7. 代理分潤結算 (必填)
    if (!formData.settlementCycle) {
      newErrors.settlementCycle = '請選擇結算週期';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 遊戲類型名稱轉換
  const getGameTypeName = (gameType: string): string => {
    const typeMap: Record<string, string> = {
      live: '真人',
      slot: '電子',
      sport: '體育',
      lottery: '彩票',
      card: '棋牌',
      fishing: '捕魚'
    };
    return typeMap[gameType] || gameType;
  };

  // 代理級別顯示名稱
  const getAgentLevelDisplay = (level: AgentLevelType): string => {
    if (level === AgentLevelType.ANY) return '任一層級';
    const levelNum = level.split('_')[1];
    return `${levelNum}級代理`;
  };

  // 結算週期顯示名稱
  const getSettlementCycleDisplay = (cycle: SettlementCycle): string => {
    switch (cycle) {
      case SettlementCycle.WEEKLY:
        return '週結(每週日 23:59:59)';
      case SettlementCycle.MONTHLY:
        return '月結(每月最後一天 23:59:59)';
      default:
        return cycle;
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除該欄位的錯誤
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // 佣金條件是方案池概念，移除重疊檢查

    setIsSubmitting(true);
    
    try {
      // 轉換遊戲返水比例到數字格式
      const gameRebateRatesConverted: Record<string, number> = {};
      Object.keys(formData.gameRebateRates).forEach(key => {
        const value = formData.gameRebateRates[key];
        if (value && value.trim()) {
          gameRebateRatesConverted[key] = parseFloat(value);
        }
      });

      const submitData = {
        systemType: formData.systemType,
        name: formData.name.trim(),
        agentLevel: formData.agentLevel,
        agentId: Number(formData.agentId),
        commissionPercent: parseFloat(formData.commissionPercent),
        gameRebateRates: gameRebateRatesConverted,
        settlementCycle: formData.settlementCycle,
        // 暫時保留舊格式兼容性
        method: CommissionMethod.SETTLEMENT_ACTIVE_MEMBERS,
        isActive: true,
        groups: []
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('❌ 提交失敗:', error);
      
      // 顯示一般錯誤訊息
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="condition-form">
      {/* 分潤條件設定 */}
      <div className="form-section">
        <h3>分潤條件設定</h3>
        <div className="form-grid">
          {/* 1. 代理制度 */}
          <div className="field-group">
            <label className="required">代理制度</label>
            <select
              value={formData.systemType}
              onChange={(e) => updateFormData('systemType', e.target.value as AgentSystemType)}
              className="select-input"
            >
              <option value={AgentSystemType.COMMISSION}>占成制</option>
              <option value={AgentSystemType.REBATE}>返水制</option>
            </select>
            {errors.systemType && <span className="error">{errors.systemType}</span>}
          </div>

          {/* 2. 分潤名稱 */}
          <div className="field-group">
            <label className="required">分潤名稱</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              className="text-input"
              placeholder="請輸入分潤名稱"
              maxLength={100}
            />
            {errors.name && <span className="error">{errors.name}</span>}
          </div>

          {/* 3. 代理級別選擇 */}
          <div className="field-group">
            <label className="required">代理級別選擇</label>
            <select
              value={formData.agentLevel}
              onChange={(e) => updateFormData('agentLevel', e.target.value as AgentLevelType)}
              className="select-input"
            >
              <option value={AgentLevelType.ANY}>任一層級</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(level => (
                <option key={level} value={`LEVEL_${level}` as AgentLevelType}>
                  {level}級代理
                </option>
              ))}
            </select>
            {errors.agentLevel && <span className="error">{errors.agentLevel}</span>}
          </div>

          {/* 4. 代理名稱選擇 */}
          <div className="field-group">
            <label className="required">代理名稱選擇</label>
            <select
              value={formData.agentId}
              onChange={(e) => updateFormData('agentId', e.target.value)}
              className="select-input"
              disabled={agentsLoading}
            >
              <option value="">
                {agentsLoading ? '⏳ 載入代理清單中...' : 
                 agentsError ? '❌ 載入失敗' : 
                 '請選擇代理名稱'}
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

          {/* 5. 代理占成比例(%) */}
          <div className="field-group">
            <label className="required">代理占成比例(%)</label>
            <input
              type="text"
              value={formData.commissionPercent}
              onChange={(e) => {
                const value = e.target.value;
                // 只允許數字和小數點
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  updateFormData('commissionPercent', value);
                }
              }}
              className="text-input"
              placeholder="請輸入0-100之間的數字"
              maxLength={6}
            />
            {errors.commissionPercent && <span className="error">{errors.commissionPercent}</span>}
          </div>
        </div>
      </div>

      {/* 6. 代理返水條件(%) */}
      <div className="form-section">
        <h3>代理返水條件(%)</h3>
        <div className="game-rebate-grid">
          {[
            { key: 'live', name: '真人' },
            { key: 'slot', name: '電子' },
            { key: 'sport', name: '體育' },
            { key: 'lottery', name: '彩票' },
            { key: 'card', name: '棋牌' },
            { key: 'fishing', name: '捕魚' }
          ].map(gameType => (
            <div key={gameType.key} className="field-group">
              <label>{gameType.name}</label>
              <input
                type="text"
                value={formData.gameRebateRates[gameType.key]}
                onChange={(e) => {
                  const value = e.target.value;
                  // 只允許數字和小數點
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    updateFormData('gameRebateRates', {
                      ...formData.gameRebateRates,
                      [gameType.key]: value
                    });
                  }
                }}
                className="text-input"
                placeholder="0-100"
                maxLength={6}
              />
              {errors[`gameRebate_${gameType.key}`] && (
                <span className="error">{errors[`gameRebate_${gameType.key}`]}</span>
              )}
            </div>
          ))}
        </div>
        
        {/* 7. 代理分潤結算 */}
        <div className="form-grid settlement-section">
          <div className="field-group">
            <label className="required">代理分潤結算</label>
            <select
              value={formData.settlementCycle}
              onChange={(e) => updateFormData('settlementCycle', e.target.value as SettlementCycle)}
              className="select-input"
            >
              <option value={SettlementCycle.WEEKLY}>週結(每週日 23:59:59)</option>
              <option value={SettlementCycle.MONTHLY}>月結(每月最後一天 23:59:59)</option>
            </select>
            {errors.settlementCycle && <span className="error">{errors.settlementCycle}</span>}
          </div>
        </div>
      </div>

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

    </form>
  );
}