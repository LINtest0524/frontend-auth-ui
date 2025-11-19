'use client';
import React, { useEffect, useMemo, useState } from 'react';
import '@/styles/pages/agent-create-form.css';
import { createAgent, fetchAgentOptions, fetchParentAgents, CreateAgentPayload } from '../_lib/agent-api';
import { useRouter } from 'next/navigation';
import { handleApiError } from '@/lib/errorHandler';
import { useCommissionConditionsStore } from '@/stores/useCommissionConditionsStore';
import { CommissionMethod, CommissionConditionListItem } from '@/types/commission-condition';

type Option<T extends string | number> = { label: string; value: T };

export default function AgentCreateForm() {
  const router = useRouter();

  const [levels, setLevels] = useState<Option<number>[]>([]);
  const [statuses, setStatuses] = useState<Option<any>[]>([]);
  const [companies, setCompanies] = useState<Option<number>[]>([]);
  const [parents, setParents] = useState<Option<number>[]>([]);
  const [commissionConditions, setCommissionConditions] = useState<Option<string>[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 分潤條件設定相關狀態
  const [commissionSystem, setCommissionSystem] = useState<CommissionMethod | ''>('');
  const [selectedCondition, setSelectedCondition] = useState<CommissionConditionListItem | null>(null);
  const [filteredConditions, setFilteredConditions] = useState<CommissionConditionListItem[]>([]);

  // 使用 commission conditions store
  const { items: allCommissionConditions, fetchList: fetchCommissionConditions } = useCommissionConditionsStore();

  const [form, setForm] = useState<CreateAgentPayload>({
    companyId: 0,
    agentLevel: 2,
    parentAgentId: null,
    displayName: '',
    commissionConditionId: null,
    phone: '',
    email: '',
    telegram: '',
    line: '',
    qq: '',
    status: 'active',
    loginAccount: '',
    password: '',
    confirmPassword: '',
    frontendUrl: '',
    defaultVipLevel: 'VIP0',
    defaultRebateSettlement: 'daily',
    defaultPaymentGroup: 'regular',
    accountStatus: ['normal'],
    note: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchAgentOptions();
        setLevels([
          { label: '1級總代理', value: 1 },
          ...Array.from({ length: 11 }, (_, i) => ({ 
            label: `${i + 2}級代理`, 
            value: i + 2 
          }))
        ]);
        
        const statusLabels: Record<string, string> = {
          'active': '啟用',
          'inactive': '停用', 
          'pending': '待審核'
        };
        setStatuses(res.statuses.map(s => ({ 
          label: statusLabels[s] || s, 
          value: s 
        })));
        
        setCompanies(res.companies.map(c => ({ label: `${c.name} (${c.code})`, value: c.id })));
        
        // 載入占成條件
        if (res.companies.length > 0) {
          try {
            // 使用 commissionConditionsApi 直接調用
            const commissionConditionsModule = await import('@/lib/api/commissionConditions');
            const conditions = await commissionConditionsModule.commissionConditionsApi.list({ page: 1, limit: 100 });
            
            setCommissionConditions([
              { label: '不指定占成條件', value: '' },
              ...conditions.items.map(c => ({ 
                label: `${c.name} (${c.agentName})`, 
                value: c.id 
              }))
            ]);
          } catch (error) {
            console.error('Failed to load commission conditions:', error);
            setCommissionConditions([{ label: '不指定占成條件', value: '' }]);
          }
        }
      } catch (e) {
        handleApiError(e, 'AgentCreateForm-fetchOptions');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 新增狀態來存儲上級代理級別
  const [parentLevel, setParentLevel] = useState<number>(1);

  // 當上級代理級別改變時，自動設定新代理商等級為上級+1
  useEffect(() => {
    update('agentLevel', parentLevel + 1);
    // 清除已選擇的上級代理
    update('parentAgentId', null);
  }, [parentLevel]);

  useEffect(() => {
    if (!form.companyId || !parentLevel) { setParents([]); return; }
    (async () => {
      try {
        const list = await fetchParentAgents(form.companyId);
        // 根據選擇的上級代理級別過濾
        const filteredList = list.filter(p => p.agentLevel === parentLevel);
        setParents(filteredList.map(p => ({ label: `${p.displayName} (#${p.id})`, value: p.id })));
      } catch (e) {
        handleApiError(e, 'AgentCreateForm-fetchParents');
      }
    })();
  }, [form.companyId, parentLevel]);

  // 載入分潤條件數據
  useEffect(() => {
    const loadConditions = async () => {
      try {
        // 載入所有啟用的分潤條件
        await fetchCommissionConditions({ 
          limit: 1000, // 載入大量資料以確保包含所有條件
          page: 1 
        });
      } catch (error) {
        console.error('Failed to load commission conditions:', error);
      }
    };
    loadConditions();
  }, [fetchCommissionConditions]);

  // 根據代理制度篩選分潤條件
  useEffect(() => {
    console.log('🔍 篩選分潤條件:', {
      commissionSystem,
      allConditionsCount: allCommissionConditions.length,
      allConditions: allCommissionConditions.map(c => ({ 
        id: c.id, 
        name: c.name, 
        method: c.method, 
        systemType: c.systemType,
        isActive: c.isActive 
      }))
    });

    if (commissionSystem) {
      // 將代理制度值轉換為 systemType 格式
      let targetSystemType = '';
      switch (commissionSystem) {
        case 'SETTLEMENT_ACTIVE_MEMBERS':
          targetSystemType = 'COMMISSION'; // 占成制
          break;
        case 'SETTLEMENT_ECPAY_PERSON': 
          targetSystemType = 'REBATE'; // 返水制
          break;
        default:
          targetSystemType = commissionSystem;
      }

      const filtered = allCommissionConditions.filter(item => {
        const matches = item.systemType === targetSystemType && item.isActive;
        console.log(`條件 ${item.name}: method=${item.method}, systemType=${item.systemType}, targetSystemType=${targetSystemType}, isActive=${item.isActive}, matches=${matches}`);
        return matches;
      });
      
      console.log('✅ 篩選結果:', filtered.map(c => ({ 
        id: c.id, 
        name: c.name, 
        method: c.method,
        systemType: c.systemType
      })));
      
      setFilteredConditions(filtered);
    } else {
      setFilteredConditions([]);
    }
    setSelectedCondition(null);
    update('commissionConditionId', null);
  }, [commissionSystem, allCommissionConditions]);

  // 當選擇分潤條件時，更新選中的條件數據
  useEffect(() => {
    if (form.commissionConditionId) {
      const condition = filteredConditions.find(item => item.id === form.commissionConditionId);
      setSelectedCondition(condition || null);
    } else {
      setSelectedCondition(null);
    }
  }, [form.commissionConditionId, filteredConditions]);

  const canSubmit = useMemo(() => {
    return !!form.companyId && !!form.displayName && !!form.loginAccount && !!form.password && !!form.agentLevel && form.password === form.confirmPassword;
  }, [form]);

  function update<K extends keyof CreateAgentPayload>(k: K, v: CreateAgentPayload[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await createAgent(form);
      alert('代理商建立成功！');
      router.push('/admin/agents');
    } catch (e) {
      handleApiError(e, 'AgentCreateForm-submit');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="form-section">
        <div className="form-loading">
          <div>⏳ 載入中...</div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>

      <div className="form-section-big01">
        {/* 代理設定區塊 */}
        <div className="form-section">
          <div className="section-title">
            代理設定
          </div>

          {/* 1. 所屬公司 */}
          <div className="form-field">
            <label className="required">所屬公司</label>
            <select value={form.companyId} onChange={e => update('companyId', Number(e.target.value))}>
              <option value={0}>請選擇公司</option>
              {companies.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* 2. 上級代理級別選擇 */}
          <div className="form-field">
            <label className="required">上級代理級別選擇</label>
            <select value={parentLevel} onChange={e => setParentLevel(Number(e.target.value))}>
              <option value={1}>1級總代理</option>
              {Array.from({ length: 11 }, (_, i) => (
                <option key={i + 2} value={i + 2}>{i + 2}級代理</option>
              ))}
            </select>
          </div>

          {/* 3. 上級代理選擇 */}
          <div className="form-field">
            <label>上級代理選擇</label>
            <select value={form.parentAgentId ?? ''} onChange={e => update('parentAgentId', e.target.value ? Number(e.target.value) : null)}>
              <option value="">請選擇上級代理</option>
              {parents.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* 4. 新代理商等級（自動計算） */}
          <div className="form-field">
            <label>新代理商等級</label>
            <div style={{ 
              padding: '8px 12px', 
              backgroundColor: '#f8f9fa', 
              border: '1px solid #dee2e6', 
              borderRadius: '4px',
              color: '#495057',
              fontWeight: 'bold'
            }}>
              {form.agentLevel}級代理 (自動設定為上級+1)
            </div>
          </div>

          {/* 5. 代理名稱 */}
          <div className="form-field">
            <label className="required">代理名稱</label>
            <input 
              value={form.displayName} 
              onChange={e => update('displayName', e.target.value)} 
              placeholder="請輸入代理名稱" 
            />
          </div>

          {/* 6. 代理帳號 */}
          <div className="form-field">
            <label className="required">代理帳號</label>
            <input 
              value={form.loginAccount} 
              onChange={e => update('loginAccount', e.target.value)} 
              placeholder="請輸入唯一代理帳號" 
            />
            <div className="form-hint">帳號必須唯一，建議使用英文字母和數字</div>
          </div>

          {/* 7. 代理前台網址 */}
          <div className="form-field">
            <label>代理前台網址</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>http://localhost:3000/</span>
              <span style={{ color: '#007bff', fontWeight: 'bold' }}>
                {form.companyId ? 
                  companies.find(c => c.value === form.companyId)?.label?.match(/\(([^)]+)\)$/)?.[1]?.toLowerCase() || '?' 
                  : '?'}
              </span>
              <span>/</span>
              <input 
                value={form.frontendUrl || ''} 
                onChange={e => update('frontendUrl', e.target.value)} 
                placeholder="輸入代理子域名" 
                style={{ flex: 1 }}
                disabled={!form.companyId}
              />
            </div>
            {!form.companyId && (
              <div className="form-hint" style={{ color: '#f56565' }}>請先選擇所屬公司</div>
            )}
            {form.companyId && form.frontendUrl && (
              <div className="form-hint" style={{ color: '#48bb78' }}>
                完整網址：http://localhost:3000/{companies.find(c => c.value === form.companyId)?.label?.match(/\(([^)]+)\)$/)?.[1]?.toLowerCase()}/{form.frontendUrl}
              </div>
            )}
          </div>

          {/* 8. 登入密碼 */}
          <div className="form-field">
            <label className="required">登入密碼</label>
            <input 
              type="password" 
              value={form.password} 
              onChange={e => update('password', e.target.value)} 
              placeholder="至少 8 個字元" 
            />
          </div>

          {/* 9. 再次輸入登入密碼 */}
          <div className="form-field">
            <label className="required">再次輸入登入密碼</label>
            <input 
              type="password" 
              value={form.confirmPassword || ''} 
              onChange={e => update('confirmPassword', e.target.value)} 
              placeholder="請再次輸入密碼" 
            />
            {form.password && form.confirmPassword && form.password !== form.confirmPassword && (
              <div className="form-hint" style={{ color: 'red' }}>密碼不一致</div>
            )}
          </div>

          {/* 10. 預設會員VIP等級 */}
          <div className="form-field">
            <label>預設會員VIP等級</label>
            <select value={form.defaultVipLevel || 'VIP0'} onChange={e => update('defaultVipLevel', e.target.value)}>
              <option value="VIP0">VIP0-遊客</option>
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i + 1} value={`VIP${i + 1}`}>VIP{i + 1}</option>
              ))}
            </select>
          </div>

          {/* 11. 預設會員返水結算條件 */}
          <div className="form-field">
            <label>預設會員返水結算條件</label>
            <select value={form.defaultRebateSettlement || 'daily'} onChange={e => update('defaultRebateSettlement', e.target.value)}>
              <option value="daily">日結</option>
              <option value="weekly">週結</option>
            </select>
          </div>

          {/* 12. 預設金流群組 */}
          <div className="form-field">
            <label>預設金流群組</label>
            <select value={form.defaultPaymentGroup || 'regular'} onChange={e => update('defaultPaymentGroup', e.target.value)}>
              <option value="regular">常規會員</option>
              <option value="old_member">老會員</option>
              <option value="credit_agent">信用代理</option>
              <option value="usdt_channel">USDT通道</option>
            </select>
          </div>

          {/* 13. 預設帳號狀態 */}
          <div className="form-field a_radiobox01">
            <label>預設帳號狀態</label>
            <div>
              <div style={{ marginBottom: '10px' }}>
                <label>
                  <input 
                    className="a_radio01"
                    type="radio" 
                    name="accountStatus" 
                    value="active"
                    checked={!(form.accountStatus || []).includes('inactive') && !(form.accountStatus || []).includes('banned')}
                    onChange={e => {
                      if (e.target.checked) {
                        // 選擇啟用，移除停用和停權狀態，保留功能限制
                        const current = form.accountStatus || [];
                        const filtered = current.filter(s => s !== 'inactive' && s !== 'banned');
                        update('accountStatus', filtered.length > 0 ? filtered : ['normal']);
                      }
                    }}
                  />
                  啟用
                </label>
                <div className="a_checkbig_box">
                  <label style={{ fontWeight: 'normal', marginRight: '15px' }}>
                    <input 
                      className="a_checkbox01"
                      type="checkbox" 
                      checked={(form.accountStatus || []).includes('normal')}
                      onChange={e => {
                        const current = form.accountStatus || [];
                        if (e.target.checked) {
                          // 選擇正常啟用，移除所有限制
                          update('accountStatus', ['normal']);
                        } else {
                          // 取消正常啟用
                          update('accountStatus', current.filter(s => s !== 'normal'));
                        }
                      }}
                    />
                    正常啟用
                  </label>
                  <label style={{ fontWeight: 'normal', marginRight: '15px' }}>
                    <input 
                      className="a_checkbox01"
                      type="checkbox" 
                      checked={(form.accountStatus || []).includes('frozen')}
                      onChange={e => {
                        const current = form.accountStatus || [];
                        if (e.target.checked) {
                          // 新增凍結錢包，移除正常啟用，保持啟用狀態
                          update('accountStatus', [...current.filter(s => s !== 'normal' && s !== 'inactive' && s !== 'banned'), 'frozen']);
                        } else {
                          // 移除凍結錢包
                          update('accountStatus', current.filter(s => s !== 'frozen'));
                        }
                      }}
                    />
                    凍結錢包
                  </label>
                  <label style={{ fontWeight: 'normal', marginRight: '15px' }}>
                    <input 
                      className="a_checkbox01"
                      type="checkbox" 
                      checked={(form.accountStatus || []).includes('deposit_disabled')}
                      onChange={e => {
                        const current = form.accountStatus || [];
                        if (e.target.checked) {
                          // 新增停用儲值，移除正常啟用，保持啟用狀態
                          update('accountStatus', [...current.filter(s => s !== 'normal' && s !== 'inactive' && s !== 'banned'), 'deposit_disabled']);
                        } else {
                          // 移除停用儲值
                          update('accountStatus', current.filter(s => s !== 'deposit_disabled'));
                        }
                      }}
                    />
                    停用儲值
                  </label>
                  <label style={{ fontWeight: 'normal' }}>
                    <input 
                      className="a_checkbox01"
                      type="checkbox" 
                      checked={(form.accountStatus || []).includes('consign_disabled')}
                      onChange={e => {
                        const current = form.accountStatus || [];
                        if (e.target.checked) {
                          // 新增停止託售，移除正常啟用，保持啟用狀態
                          update('accountStatus', [...current.filter(s => s !== 'normal' && s !== 'inactive' && s !== 'banned'), 'consign_disabled']);
                        } else {
                          // 移除停止託售
                          update('accountStatus', current.filter(s => s !== 'consign_disabled'));
                        }
                      }}
                    />
                    停止託售
                  </label>
                </div>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>
                  <input 
                    className="a_radio01"
                    type="radio" 
                    name="accountStatus" 
                    value="inactive"
                    checked={(form.accountStatus || []).includes('inactive')}
                    onChange={e => {
                      if (e.target.checked) {
                        update('accountStatus', ['inactive']);
                      }
                    }}
                  />
                  停用
                </label>
              </div>
              <div>
                <label>
                  <input 
                    className="a_radio01"
                    type="radio" 
                    name="accountStatus" 
                    value="banned"
                    checked={(form.accountStatus || []).includes('banned')}
                    onChange={e => {
                      if (e.target.checked) {
                        update('accountStatus', ['banned']);
                      }
                    }}
                  />
                  終身停權
                </label>
              </div>
            </div>
          </div>

          {/* 14. 備註 */}
          <div className="form-field">
            <label>備註</label>
            <textarea 
              rows={3} 
              value={form.note} 
              onChange={e => update('note', e.target.value)} 
              placeholder="代理商相關備註資訊（選填）" 
            />
          </div>
        </div>




        <div className="fd1-w100">
          {/* 聯絡資訊區塊 */}
          <div className="form-section">
            <div className="section-title">
              聯絡資訊
            </div>
                
            <div className="form-field">
              <label>手機號碼</label>
              <input 
                type="tel"
                value={form.phone} 
                onChange={e => update('phone', e.target.value)} 
                placeholder="09xx-xxx-xxx" 
              />
            </div>

            <div className="form-field">
              <label>電子郵件</label>
              <input 
                type="email" 
                value={form.email} 
                onChange={e => update('email', e.target.value)} 
                placeholder="agent@example.com" 
              />
            </div>

            <div className="form-field">
              <label>Telegram</label>
              <input 
                value={form.telegram} 
                onChange={e => update('telegram', e.target.value)} 
                placeholder="@telegram_account" 
              />
            </div>

            <div className="form-field">
              <label>LINE ID</label>
              <input 
                value={form.line} 
                onChange={e => update('line', e.target.value)} 
                placeholder="LINE ID" 
              />
            </div>

            <div className="form-field">
              <label>QQ</label>
              <input 
                value={form.qq} 
                onChange={e => update('qq', e.target.value)} 
                placeholder="QQ 號碼" 
              />
            </div>
          </div>

          {/* 分潤條件設定 */}
          <div className="form-section">
            <div className="section-title">
              分潤條件設定
            </div>

            {/* 1. 代理制度 */}
            <div className="form-field">
              <label className="required">代理制度</label>
              <select 
                value={commissionSystem} 
                onChange={e => setCommissionSystem(e.target.value as CommissionMethod | '')}
              >
                <option value="">請選擇代理制度</option>
                <option value={CommissionMethod.SETTLEMENT_ACTIVE_MEMBERS}>占成制</option>
                <option value={CommissionMethod.SETTLEMENT_ECPAY_PERSON}>返水制(總投注額回饋)</option>
              </select>
            </div>

            {/* 2. 分潤選擇 */}
            <div className="form-field">
              <label className="required">分潤選擇</label>
              <select 
                value={form.commissionConditionId || ''} 
                onChange={e => update('commissionConditionId', e.target.value || null)}
                disabled={!commissionSystem}
              >
                <option value="">請選擇分潤方案</option>
                {filteredConditions.map(condition => (
                  <option key={condition.id} value={condition.id}>
                    {condition.name} ({condition.agentName})
                  </option>
                ))}
              </select>
              {!commissionSystem && (
                <div className="form-hint" style={{ color: '#f56565' }}>請先選擇代理制度</div>
              )}
            </div>

            {/* 3. 分潤比例(%) */}
            <div className="form-field">
              <label>分潤比例(%)</label>
              <div style={{ 
                padding: '8px 12px', 
                backgroundColor: '#f8f9fa', 
                border: '1px solid #dee2e6', 
                borderRadius: '4px',
                color: '#495057'
              }}>
                {selectedCondition?.commissionPercent || '未設定'}%
              </div>
            </div>

            {/* 4. 代理返水條件 */}
            <div className="form-field">
              <label>代理返水條件</label>
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#f8f9fa', 
                border: '1px solid #dee2e6', 
                borderRadius: '4px'
              }}>
                {selectedCondition?.gameRebateRates ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    <div><strong>真人:</strong> {selectedCondition.gameRebateRates.live || 0}%</div>
                    <div><strong>電子:</strong> {selectedCondition.gameRebateRates.slot || 0}%</div>
                    <div><strong>體育:</strong> {selectedCondition.gameRebateRates.sport || 0}%</div>
                    <div><strong>彩票:</strong> {selectedCondition.gameRebateRates.lottery || 0}%</div>
                    <div><strong>棋牌:</strong> {selectedCondition.gameRebateRates.card || 0}%</div>
                    <div><strong>捕魚:</strong> {selectedCondition.gameRebateRates.fishing || 0}%</div>
                  </div>
                ) : (
                  <div style={{ color: '#6c757d' }}>未設定返水條件</div>
                )}
              </div>
            </div>

            {/* 5. 分潤結算時機 */}
            <div className="form-field">
              <label>分潤結算時機</label>
              <div style={{ 
                padding: '8px 12px', 
                backgroundColor: '#f8f9fa', 
                border: '1px solid #dee2e6', 
                borderRadius: '4px',
                color: '#495057'
              }}>
                {selectedCondition?.settlementCycle 
                  ? (selectedCondition.settlementCycle === 'WEEKLY' 
                    ? '週結(每週日 23:59:59)' 
                    : selectedCondition.settlementCycle === 'MONTHLY'
                    ? '月結(每月最後一天 23:59:59)'
                    : selectedCondition.settlementCycle)
                  : '未設定'}
              </div>
            </div>
          </div>
        </div>

      </div>


      {/* 操作按鈕 */}
      <div className="form-section">
        <div className="form-actions">
          <button
            type="button"
            onClick={() => router.push('/admin/agents')}
            className="btn-secondary"
            disabled={submitting}
          >
            <span>↩️</span>
            返回
          </button>
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="btn-primary"
          >
            <span>➕</span>
            {submitting ? '建立中...' : '建立代理商'}
          </button>
        </div>
      </div>
    </form>
  );
}