'use client';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import '@/styles/pages/agent-create-form.css';
import { fetchAgentOptions, fetchParentAgents, fetchAgentById, updateAgent, UpdateAgentPayload, uploadBankCardImage, fetchGameProviders, GameProvider } from '../_lib/agent-api';
import { useRouter } from 'next/navigation';
import { handleApiError } from '@/lib/errorHandler';
import { getUser } from '@/lib/useAuth';
import { useUserStore } from '@/hooks/use-user-store';
import { useCommissionConditionsStore } from '@/stores/useCommissionConditionsStore';
import { CommissionMethod, CommissionConditionListItem } from '@/types/commission-condition';

// 銀行卡資料類型
interface BankCard {
  bankCode?: string;
  accountNumber?: string;
  passbookCover?: File | null;
  passbookCoverPreview?: string;
  passbookCoverUrl?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  note?: string;
  uploading?: boolean;
}

type Option<T extends string | number> = { label: string; value: T };

interface AgentEditFormProps {
  agentId: number;
}

export default function AgentEditForm({ agentId }: AgentEditFormProps) {
  const router = useRouter();
  const user = getUser();
  const currentUser = useUserStore((state) => state.user);
  const activeUser = currentUser || user;
  const canEditAllFields = activeUser?.role === 'SUPER_ADMIN' || activeUser?.role === 'GLOBAL_ADMIN';

  // 基礎狀態
  const [levels, setLevels] = useState<Option<number>[]>([]);
  const [statuses, setStatuses] = useState<Option<any>[]>([]);
  const [companies, setCompanies] = useState<Option<number>[]>([]);
  const [parents, setParents] = useState<Option<number>[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [parentLevel, setParentLevel] = useState(1);

  // 分潤條件相關
  const [commissionSystem, setCommissionSystem] = useState<CommissionMethod | ''>('');
  const [selectedCondition, setSelectedCondition] = useState<CommissionConditionListItem | null>(null);
  const [filteredConditions, setFilteredConditions] = useState<CommissionConditionListItem[]>([]);
  const { items: allCommissionConditions, fetchList: fetchCommissionConditions } = useCommissionConditionsStore();

  // 遊戲廠商相關
  const [gameProviders, setGameProviders] = useState<GameProvider[]>([]);
  const [bannedGames, setBannedGames] = useState({
    live: { enabled: false, providers: [] as string[] },
    slot: { enabled: false, providers: [] as string[] },
    sports: { enabled: false, providers: [] as string[] },
    lottery: { enabled: false, providers: [] as string[] },
    card: { enabled: false, providers: [] as string[] },
    fishing: { enabled: false, providers: [] as string[] },
  });

  // 銀行卡上傳參考
  const bankCardFileRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 表單狀態
  const [form, setForm] = useState<UpdateAgentPayload & { 
    id: number;
    agentName?: string;
    gender?: 'MALE' | 'FEMALE';
    idNumber?: string;
    bankCards?: BankCard[];
    frontendUrl?: string;
    defaultVipLevel?: string;
    defaultRebateSettlement?: string;
    defaultPaymentGroup?: string;
    accountStatus?: string[];
  }>({
    id: agentId,
    companyId: 0,
    agentLevel: 1,
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
    note: '',
    frontendUrl: '',
    defaultVipLevel: 'VIP0',
    defaultRebateSettlement: 'daily',
    defaultPaymentGroup: 'regular',
    accountStatus: ['normal'],
    agentName: '',
    gender: undefined,
    idNumber: '',
    bankCards: [],
  });

  // 載入數據
  useEffect(() => {
    let mounted = true;
    
    (async () => {
      try {
        setLoading(true);
        
        // 1. 先載入分潤條件到 store（必須等待完成）
        await fetchCommissionConditions({ limit: 1000 });
        
        // 2. 再載入其他數據
        const [optionsRes, agentData, providersData] = await Promise.all([
          fetchAgentOptions(),
          fetchAgentById(agentId),
          fetchGameProviders()
        ]);
        
        if (!mounted) return;

        // 設定選項數據
        setLevels([
          { label: '1級總代理', value: 1 },
          ...Array.from({ length: 11 }, (_, i) => ({ label: `${i + 2}級代理`, value: i + 2 }))
        ]);
        
        const statusLabels = { 'active': '啟用', 'inactive': '停用', 'pending': '待審核' };
        setStatuses(optionsRes.statuses.map(s => ({ label: statusLabels[s] || s, value: s })));
        setCompanies(optionsRes.companies.map(c => ({ label: `${c.name} (${c.code})`, value: c.id })));
        setGameProviders(providersData);

        // 填充表單數據
        setForm({
          id: agentId,
          companyId: agentData.company_id || 0,
          agentLevel: agentData.agent_level || 1,
          parentAgentId: agentData.parent_agent_id || null,
          displayName: agentData.agent_name || agentData.display_name || '',
          commissionConditionId: agentData.commission_condition_id || null,
          phone: agentData.phone || '',
          email: agentData.email || '',
          telegram: agentData.telegram || '',
          line: agentData.line || '',
          qq: agentData.qq || '',
          status: agentData.status || 'active',
          loginAccount: agentData.username || agentData.login_account || '',
          password: '',
          note: agentData.note || '',
          frontendUrl: agentData.frontend_url || agentData.frontendUrl || '',
          defaultVipLevel: agentData.default_vip_level || agentData.defaultVipLevel || 'VIP0',
          defaultRebateSettlement: agentData.default_rebate_settlement || agentData.defaultRebateSettlement || 'daily',
          defaultPaymentGroup: agentData.default_payment_group || agentData.defaultPaymentGroup || 'regular',
          accountStatus: agentData.account_status || agentData.accountStatus || ['normal'],
          agentName: agentData.agent_name || '',
          gender: agentData.gender || undefined,
          idNumber: agentData.id_number || agentData.idNumber || '',
          bankCards: agentData.bank_cards || agentData.bankCards || [],
        });

        // 設定分潤條件 - 使用 setTimeout 確保 store 已更新
        if (agentData.commission_condition_id) {
          const conditionId = agentData.commission_condition_id;
          
          // 延遲一下，讓 zustand store 有時間更新
          setTimeout(() => {
            if (!mounted) return;
            
            // 從 store 中查找分潤條件
            const condition = allCommissionConditions.find(c => c.id === conditionId);
            
            if (condition) {
              // 屬性名稱可能是 method 或 commissionMethod
              const method = condition.commissionMethod || condition.method;
              setCommissionSystem(method);
              setSelectedCondition(condition);
            }
          }, 300);
        }

        // 設定限制遊戲廠商
        if (agentData.banned_game_providers || agentData.bannedGameProviders) {
          const banned = agentData.banned_game_providers || agentData.bannedGameProviders;
          if (typeof banned === 'object') {
            setBannedGames(banned);
          }
        }

        // 設定上級層級
        if (agentData.parent_agent_id) {
          setParentLevel(agentData.agent_level - 1);
        }

        // 載入上級代理列表
        if (agentData.company_id) {
          const list = await fetchParentAgents(agentData.company_id);
          const filteredList = list.filter(p => p.id !== agentId);
          setParents(filteredList.map(p => ({ label: `L${p.agentLevel} - ${p.displayName} (#${p.id})`, value: p.id })));
        }
      } catch (e) {
        if (mounted) {
          handleApiError(e, router);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();
    
    return () => {
      mounted = false;
    };
  }, [agentId]); // 只依賴 agentId

  // 當公司或上級層級改變時，更新上級代理列表
  useEffect(() => {
    if (!form.companyId || form.companyId === 0 || loading) {
      return;
    }
    
    let mounted = true;
    
    (async () => {
      try {
        const list = await fetchParentAgents(form.companyId, parentLevel);
        if (mounted) {
          const filteredList = list.filter(p => p.id !== agentId);
          setParents(filteredList.map(p => ({ label: `L${p.agentLevel} - ${p.displayName} (#${p.id})`, value: p.id })));
        }
      } catch (e) {
        if (mounted) {
          handleApiError(e, router);
        }
      }
    })();
    
    return () => {
      mounted = false;
    };
  }, [form.companyId, parentLevel, agentId, loading]);

  // 自動計算代理等級 - 只在手動修改 parentLevel 時觸發
  useEffect(() => {
    if (loading) return; // 載入期間不自動更新
    
    const newLevel = parentLevel + 1;
    if (newLevel <= 12 && newLevel !== form.agentLevel) {
      setForm(prev => ({ ...prev, agentLevel: newLevel }));
    }
  }, [parentLevel]); // 移除 loading 和 form.agentLevel 依賴

  // 篩選分潤條件 - 與新增頁面邏輯一致
  useEffect(() => {
    if (commissionSystem) {
      // 將代理制度值轉換為 systemType 格式（與新增頁面相同邏輯）
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
      
      const filtered = allCommissionConditions.filter(item => 
        item.systemType === targetSystemType && item.isActive
      );
      
      setFilteredConditions(filtered);
    } else {
      setFilteredConditions([]);
    }
  }, [commissionSystem, allCommissionConditions]);

  // 更新選中的分潤條件
  useEffect(() => {
    if (form.commissionConditionId) {
      const condition = filteredConditions.find(item => item.id === form.commissionConditionId);
      setSelectedCondition(condition || null);
    } else {
      setSelectedCondition(null);
    }
  }, [form.commissionConditionId, filteredConditions]);

  // 更新函數
  function update<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  // 銀行卡相關函數
  const addBankCard = () => {
    const newCard: BankCard = {
      bankCode: '',
      accountNumber: '',
      passbookCover: null,
      passbookCoverPreview: '',
      status: 'ACTIVE',
      note: ''
    };
    setForm(prev => ({ ...prev, bankCards: [...(prev.bankCards || []), newCard] }));
  };

  const removeBankCard = (index: number) => {
    setForm(prev => ({ ...prev, bankCards: (prev.bankCards || []).filter((_, i) => i !== index) }));
  };

  const updateBankCard = (index: number, field: keyof BankCard, value: any) => {
    setForm(prev => ({
      ...prev,
      bankCards: (prev.bankCards || []).map((card, i) => i === index ? { ...card, [field]: value } : card)
    }));
  };

  const triggerBankCardFileUpload = (index: number) => {
    bankCardFileRefs.current[index]?.click();
  };

  const handleBankCardFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('請選擇圖片檔案');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('檔案大小不能超過 5MB');
      return;
    }

    const preview = URL.createObjectURL(file);
    updateBankCard(index, 'passbookCover', file);
    updateBankCard(index, 'passbookCoverPreview', preview);
    updateBankCard(index, 'uploading', true);

    try {
      const uploadedUrl = await uploadBankCardImage(file);
      updateBankCard(index, 'passbookCoverUrl', uploadedUrl);
      updateBankCard(index, 'uploading', false);
    } catch (error) {
      console.error('上傳失敗:', error);
      alert('圖片上傳失敗，請重試');
      updateBankCard(index, 'passbookCover', null);
      updateBankCard(index, 'passbookCoverPreview', '');
      updateBankCard(index, 'uploading', false);
    }
  };

  const removeBankCardImage = (index: number) => {
    updateBankCard(index, 'passbookCover', null);
    updateBankCard(index, 'passbookCoverPreview', '');
    updateBankCard(index, 'passbookCoverUrl', '');
  };

  // 遊戲廠商相關函數
  const getProvidersByCategory = (category: string) => {
    return gameProviders.filter(p => p.category === category);
  };

  const toggleCategoryBan = (category: keyof typeof bannedGames) => {
    setBannedGames(prev => {
      const currentEnabled = prev[category].enabled;
      const categoryProviders = getProvidersByCategory(category);
      return {
        ...prev,
        [category]: {
          enabled: !currentEnabled,
          providers: !currentEnabled ? categoryProviders.map(p => p.code) : []
        }
      };
    });
  };

  const toggleProviderBan = (category: keyof typeof bannedGames, providerCode: string) => {
    setBannedGames(prev => {
      const currentProviders = prev[category].providers;
      const newProviders = currentProviders.includes(providerCode)
        ? currentProviders.filter(code => code !== providerCode)
        : [...currentProviders, providerCode];
      
      const categoryProviders = getProvidersByCategory(category);
      const allSelected = newProviders.length === categoryProviders.length;
      
      return {
        ...prev,
        [category]: {
          enabled: allSelected,
          providers: newProviders
        }
      };
    });
  };

  // 提交表單
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    
    setSubmitting(true);
    try {
      const { id, bankCards, ...formData } = form;
      
      // 準備 payload
      const payload: any = {
        ...formData,
        commissionConditionId: form.commissionConditionId || null,
        parentAgentId: form.parentAgentId || null,
      };
      
      // 處理密碼
      if (!canEditAllFields) {
        delete payload.password;
      } else if (!payload.password) {
        delete payload.password;
      }
      
      // 處理銀行卡資料
      if (bankCards && bankCards.length > 0) {
        payload.bankCards = bankCards.map(card => ({
          bankCode: card.bankCode,
          accountNumber: card.accountNumber,
          passbookCoverUrl: card.passbookCoverUrl || card.passbookCoverPreview,
          status: card.status || 'ACTIVE',
          note: card.note || ''
        }));
      }
      
      // 處理禁止遊戲廠商
      payload.bannedGameProviders = {
        live: bannedGames.live,
        slot: bannedGames.slot,
        sports: bannedGames.sports,
        lottery: bannedGames.lottery,
        card: bannedGames.card,
        fishing: bannedGames.fishing,
      };

      await updateAgent(agentId, payload);
      alert('代理商資料更新成功！');
      router.push('/admin/agents');
    } catch (e) {
      handleApiError(e, router);
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = useMemo(() => {
    return !!form.companyId && !!form.displayName && !!form.agentLevel;
  }, [form]);
  
  if (loading) {
    return (
      <div className="agent-form-content">
        <div className="form-loading">
          <div>⏳ 載入代理商資料中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="agent-form-content agent-01">
      <form onSubmit={onSubmit}>
        <div className="form-section-big01">
        {/* 代理設定區塊 */}
        <div className="form-section">
          <div className="section-title">代理設定</div>

          {/* 1. 所屬公司 */}
          <div className="form-field">
            <label className="required">所屬公司</label>
            <select 
              value={form.companyId} 
              onChange={canEditAllFields ? (e => update('companyId', Number(e.target.value))) : undefined}
              disabled={!canEditAllFields}
            >
              <option value={0}>請選擇公司</option>
              {companies.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {!canEditAllFields && <div className="form-hint">🔒 此欄位僅管理員可修改</div>}
          </div>

          {/* 2. 上級代理級別選擇 */}
          <div className="form-field">
            <label className="required">上級代理級別選擇</label>
            <select 
              value={parentLevel} 
              onChange={canEditAllFields ? (e => setParentLevel(Number(e.target.value))) : undefined}
              disabled={!canEditAllFields}
            >
              <option value={1}>1級總代理</option>
              {Array.from({ length: 11 }, (_, i) => (
                <option key={i + 2} value={i + 2}>{i + 2}級代理</option>
              ))}
            </select>
            {!canEditAllFields && <div className="form-hint">🔒 此欄位僅管理員可修改</div>}
          </div>

          {/* 3. 上級代理選擇 */}
          <div className="form-field">
            <label>上級代理選擇</label>
            <select 
              value={form.parentAgentId ?? ''} 
              onChange={canEditAllFields ? (e => update('parentAgentId', e.target.value ? Number(e.target.value) : null)) : undefined}
              disabled={!canEditAllFields}
            >
              <option value="">請選擇上級代理</option>
              {parents.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {!canEditAllFields && <div className="form-hint">🔒 此欄位僅管理員可修改</div>}
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
              onChange={canEditAllFields ? (e => update('displayName', e.target.value)) : undefined}
              placeholder="請輸入代理名稱"
              disabled={!canEditAllFields}
            />
            {!canEditAllFields && <div className="form-hint">🔒 此欄位僅管理員可修改</div>}
          </div>

          {/* 6. 代理帳號 */}
          <div className="form-field">
            <label className="required">代理帳號</label>
            <input 
              value={form.loginAccount} 
              readOnly
              disabled
              style={{ backgroundColor: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' }}
            />
            <div className="form-hint">帳號一旦創建後無法修改</div>
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
                disabled={!canEditAllFields}
              />
            </div>
            <div className="form-hint">
              完整網址範例: http://localhost:3000/companyA/agent123
              {!canEditAllFields && <span style={{color: 'red'}}> 🔒 僅管理員可修改</span>}
            </div>
          </div>

          {/* 8. 登入密碼 - 僅管理員可見 */}
          {canEditAllFields && (
            <div className="form-field">
              <label>登入密碼</label>
              <input 
                type="password" 
                value={form.password || ''} 
                onChange={e => update('password', e.target.value)}
                placeholder="留空表示不更改密碼"
              />
              <div className="form-hint">留空表示不更改現有密碼</div>
            </div>
          )}

          {/* 9. 預設VIP等級 */}
          <div className="form-field">
            <label>預設VIP等級</label>
            <select 
              value={form.defaultVipLevel || 'VIP0'} 
              onChange={e => update('defaultVipLevel', e.target.value)}
              disabled={!canEditAllFields}
            >
              {Array.from({ length: 11 }, (_, i) => (
                <option key={i} value={`VIP${i}`}>VIP{i}</option>
              ))}
            </select>
            {!canEditAllFields && <div className="form-hint">🔒 此欄位僅管理員可修改</div>}
          </div>

          {/* 10. 預設會員返水結算條件 */}
          <div className="form-field">
            <label>預設會員返水結算條件</label>
            <select 
              value={form.defaultRebateSettlement || 'daily'} 
              onChange={e => update('defaultRebateSettlement', e.target.value)}
              disabled={!canEditAllFields}
            >
              <option value="daily">日結</option>
              <option value="weekly">週結</option>
            </select>
            {!canEditAllFields && <div className="form-hint">🔒 此欄位僅管理員可修改</div>}
          </div>

          {/* 11. 預設金流群組 */}
          <div className="form-field">
            <label>預設金流群組</label>
            <select 
              value={form.defaultPaymentGroup || 'regular'} 
              onChange={e => update('defaultPaymentGroup', e.target.value)}
              disabled={!canEditAllFields}
            >
              <option value="regular">常規會員</option>
              <option value="old_member">老會員</option>
              <option value="credit_agent">信用代理</option>
              <option value="usdt_channel">USDT通道</option>
            </select>
            {!canEditAllFields && <div className="form-hint">🔒 此欄位僅管理員可修改</div>}
          </div>

          {/* 12. 狀態 */}
          <div className="form-field">
            <label>狀態</label>
            <select 
              value={form.status} 
              onChange={canEditAllFields ? (e => update('status', e.target.value as any)) : undefined}
              disabled={!canEditAllFields}
            >
              {statuses.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {!canEditAllFields && <div className="form-hint">🔒 此欄位僅管理員可修改</div>}
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
                    disabled={!canEditAllFields}
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
                      disabled={!canEditAllFields}
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
                      disabled={!canEditAllFields}
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
                      disabled={!canEditAllFields}
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
                      disabled={!canEditAllFields}
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
                    disabled={!canEditAllFields}
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
                    disabled={!canEditAllFields}
                  />
                  終身停權
                </label>
              </div>
            </div>
            {!canEditAllFields && <div className="form-hint">🔒 此欄位僅管理員可修改</div>}
          </div>

          {/* 14. 備註 */}
          <div className="form-field">
            <label>備註</label>
            <textarea 
              rows={3} 
              value={form.note} 
              onChange={e => update('note', e.target.value)} 
              placeholder="代理商相關備註資訊（選填）"
              disabled={!canEditAllFields}
            />
            {!canEditAllFields && <div className="form-hint">🔒 此欄位僅管理員可修改</div>}
          </div>
        </div>

        {/* 代理資料區塊 */}
        <div className="fd1-w100">
          <div className="form-section">
            <div className="section-title">代理資料</div>
                
            <div className="form-field">
              <label>代理姓名</label>
              <input 
                type="text"
                value={form.agentName || ''} 
                onChange={e => update('agentName', e.target.value)} 
                placeholder="請輸入代理姓名" 
              />
            </div>

            <div className="form-field">
              <label>性別</label>
              <select 
                value={form.gender || ''} 
                onChange={e => update('gender', e.target.value as 'MALE' | 'FEMALE' | '')}
              >
                <option value="">請選擇性別</option>
                <option value="MALE">男</option>
                <option value="FEMALE">女</option>
              </select>
            </div>

            <div className="form-field">
              <label>身分證字號</label>
              <input 
                type="text"
                value={form.idNumber || ''} 
                onChange={e => {
                  const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                  update('idNumber', value.toUpperCase());
                }} 
                placeholder="A123456789" 
                maxLength={10}
              />
              <div className="form-hint">只能填寫英文數字，格式：A123456789</div>
            </div>

            <div className="form-field">
              <label>信箱</label>
              <input 
                type="email" 
                value={form.email} 
                onChange={e => update('email', e.target.value)} 
                placeholder="agent@example.com" 
              />
            </div>

            <div className="form-field">
              <label>手機</label>
              <input 
                type="tel"
                value={form.phone} 
                onChange={e => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  update('phone', value);
                }} 
                placeholder="0912345678" 
              />
              <div className="form-hint">只能填寫數字</div>
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

            {/* 銀行卡資料區塊 */}
            <div className="form-field">
              <label>銀行卡資料</label>
              <div className="bank-cards-container">
                <table className="bank-cards-table" style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginBottom: '10px'
                }}>
                  <thead>
                    <tr>
                      <th style={{border: '1px solid #ddd', padding: '8px', backgroundColor: '#f5f5f5'}}>銀行名稱</th>
                      <th style={{border: '1px solid #ddd', padding: '8px', backgroundColor: '#f5f5f5'}}>銀行帳號</th>
                      <th style={{border: '1px solid #ddd', padding: '8px', backgroundColor: '#f5f5f5'}}>存摺封面</th>
                      <th style={{border: '1px solid #ddd', padding: '8px', backgroundColor: '#f5f5f5'}}>狀態</th>
                      <th style={{border: '1px solid #ddd', padding: '8px', backgroundColor: '#f5f5f5'}}>備註</th>
                      <th style={{border: '1px solid #ddd', padding: '8px', backgroundColor: '#f5f5f5'}}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(form.bankCards || []).map((card, index) => (
                      <tr key={index}>
                        <td style={{border: '1px solid #ddd', padding: '8px'}}>
                          <select 
                            value={card.bankCode || ''} 
                            onChange={e => updateBankCard(index, 'bankCode', e.target.value)}
                            style={{width: '100%', padding: '4px'}}
                          >
                            <option value="">請選擇銀行</option>
                            <option value="004_臺灣銀行">004 臺灣銀行</option>
                            <option value="005_臺灣土地銀行">005 臺灣土地銀行</option>
                            <option value="006_合作金庫商業銀行">006 合作金庫商業銀行</option>
                            <option value="007_第一商業銀行">007 第一商業銀行</option>
                            <option value="008_華南商業銀行">008 華南商業銀行</option>
                            <option value="009_彰化商業銀行">009 彰化商業銀行</option>
                            <option value="011_上海商業儲蓄銀行">011 上海商業儲蓄銀行</option>
                            <option value="012_台北富邦商業銀行">012 台北富邦商業銀行</option>
                            <option value="013_國泰世華商業銀行">013 國泰世華商業銀行</option>
                            <option value="016_高雄銀行">016 高雄銀行</option>
                            <option value="017_兆豐國際商業銀行">017 兆豐國際商業銀行</option>
                            <option value="021_花旗(台灣)商業銀行">021 花旗(台灣)商業銀行</option>
                            <option value="048_王道商業銀行">048 王道商業銀行</option>
                            <option value="050_臺灣中小企業銀行">050 臺灣中小企業銀行</option>
                            <option value="052_渣打國際商業銀行">052 渣打國際商業銀行</option>
                            <option value="053_台中商業銀行">053 台中商業銀行</option>
                            <option value="054_京城商業銀行">054 京城商業銀行</option>
                            <option value="081_滙豐(台灣)商業銀行">081 滙豐(台灣)商業銀行</option>
                            <option value="101_瑞興商業銀行">101 瑞興商業銀行</option>
                            <option value="102_華泰商業銀行">102 華泰商業銀行</option>
                            <option value="103_臺灣新光商業銀行">103 臺灣新光商業銀行</option>
                            <option value="108_陽信商業銀行">108 陽信商業銀行</option>
                            <option value="118_板信商業銀行">118 板信商業銀行</option>
                            <option value="147_三信商業銀行">147 三信商業銀行</option>
                            <option value="700_中華郵政 (郵局)">700 中華郵政 (郵局)</option>
                            <option value="803_聯邦商業銀行">803 聯邦商業銀行</option>
                            <option value="805_遠東國際商業銀行">805 遠東國際商業銀行</option>
                            <option value="806_元大商業銀行">806 元大商業銀行</option>
                            <option value="807_永豐商業銀行">807 永豐商業銀行</option>
                            <option value="808_玉山商業銀行">808 玉山商業銀行</option>
                            <option value="809_凱基商業銀行">809 凱基商業銀行</option>
                            <option value="810_星展(台灣)商業銀行">810 星展(台灣)商業銀行</option>
                            <option value="812_台新國際商業銀行">812 台新國際商業銀行</option>
                            <option value="816_安泰商業銀行">816 安泰商業銀行</option>
                            <option value="822_中國信託商業銀行">822 中國信託商業銀行</option>
                            <option value="823_將來銀行">823 將來銀行</option>
                            <option value="824_連線商業銀行 (LINE Bank)">824 連線商業銀行 (LINE Bank)</option>
                            <option value="826_樂天國際商業銀行">826 樂天國際商業銀行</option>
                          </select>
                        </td>
                        <td style={{border: '1px solid #ddd', padding: '8px'}}>
                          <input 
                            type="text"
                            value={card.accountNumber || ''} 
                            onChange={e => {
                              const value = e.target.value.replace(/[^0-9]/g, '');
                              updateBankCard(index, 'accountNumber', value);
                            }}
                            placeholder="銀行帳號"
                            style={{width: '100%', padding: '4px'}}
                          />
                        </td>
                        <td style={{border: '1px solid #ddd', padding: '8px', textAlign: 'center'}}>
                          <div className="file-upload-wrapper">
                            {(card.passbookCover || card.passbookCoverUrl) ? (
                              <div className="file-preview" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'}}>
                                <div style={{position: 'relative'}}>
                                  <img 
                                    src={
                                      card.passbookCoverPreview || 
                                      (card.passbookCoverUrl?.startsWith('http') 
                                        ? card.passbookCoverUrl 
                                        : `${process.env.NEXT_PUBLIC_API_BASE}${card.passbookCoverUrl}`)
                                    } 
                                    alt="存摺封面" 
                                    onClick={() => {
                                      const imageUrl = card.passbookCoverPreview || 
                                        (card.passbookCoverUrl?.startsWith('http') 
                                          ? card.passbookCoverUrl 
                                          : `${process.env.NEXT_PUBLIC_API_BASE}${card.passbookCoverUrl}`);
                                      window.open(imageUrl, '_blank');
                                    }}
                                    style={{
                                      width: '60px', 
                                      height: '60px', 
                                      objectFit: 'cover', 
                                      border: '2px solid #e0e0e0',
                                      borderRadius: '6px',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                      opacity: card.uploading ? 0.6 : 1,
                                      cursor: card.uploading ? 'default' : 'pointer',
                                      transition: 'transform 0.2s, box-shadow 0.2s'
                                    }}
                                    onMouseOver={(e) => {
                                      if (!card.uploading) {
                                        (e.target as HTMLImageElement).style.transform = 'scale(1.1)';
                                        (e.target as HTMLImageElement).style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                                      }
                                    }}
                                    onMouseOut={(e) => {
                                      if (!card.uploading) {
                                        (e.target as HTMLImageElement).style.transform = 'scale(1)';
                                        (e.target as HTMLImageElement).style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                      }
                                    }}
                                    title="點擊查看大圖"
                                  />
                                  {card.uploading && (
                                    <div style={{
                                      position: 'absolute',
                                      top: '50%',
                                      left: '50%',
                                      transform: 'translate(-50%, -50%)',
                                      fontSize: '16px'
                                    }}>
                                      ⏳
                                    </div>
                                  )}
                                </div>
                                {card.uploading ? (
                                  <div style={{
                                    fontSize: '10px',
                                    color: '#007bff',
                                    fontWeight: 'bold'
                                  }}>
                                    上傳中...
                                  </div>
                                ) : (card.passbookCoverUrl || card.passbookCover) ? (
                                  <div style={{
                                    fontSize: '10px',
                                    color: '#28a745',
                                    fontWeight: 'bold'
                                  }}>
                                    ✅ 已上傳
                                  </div>
                                ) : null}
                                <button 
                                  type="button" 
                                  onClick={() => removeBankCardImage(index)} 
                                  disabled={card.uploading}
                                  style={{
                                    padding: '4px 8px', 
                                    fontSize: '11px',
                                    backgroundColor: card.uploading ? '#6c757d' : '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: card.uploading ? 'not-allowed' : 'pointer',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseOver={(e) => !card.uploading && ((e.target as HTMLButtonElement).style.backgroundColor = '#c82333')}
                                  onMouseOut={(e) => !card.uploading && ((e.target as HTMLButtonElement).style.backgroundColor = '#dc3545')}
                                >
                                  🗑️ 移除
                                </button>
                              </div>
                            ) : (
                              <button 
                                type="button" 
                                onClick={() => triggerBankCardFileUpload(index)} 
                                style={{
                                  padding: '8px 12px', 
                                  fontSize: '12px',
                                  backgroundColor: '#28a745',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#218838'}
                                onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#28a745'}
                              >
                                上傳
                              </button>
                            )}
                            <input 
                              type="file" 
                              ref={(el) => {
                                if (bankCardFileRefs.current) {
                                  bankCardFileRefs.current[index] = el;
                                }
                              }}
                              style={{display: 'none'}}
                              accept="image/*"
                              onChange={(e) => handleBankCardFileSelect(e, index)}
                            />
                          </div>
                        </td>
                        <td style={{border: '1px solid #ddd', padding: '8px'}}>
                          <select 
                            value={card.status || 'ACTIVE'} 
                            onChange={e => updateBankCard(index, 'status', e.target.value)}
                            style={{width: '100%', padding: '4px'}}
                          >
                            <option value="ACTIVE">啟用</option>
                            <option value="INACTIVE">停用</option>
                          </select>
                        </td>
                        <td style={{border: '1px solid #ddd', padding: '8px'}}>
                          <input 
                            type="text"
                            value={card.note || ''} 
                            onChange={e => updateBankCard(index, 'note', e.target.value)}
                            placeholder="備註"
                            style={{width: '100%', padding: '4px'}}
                          />
                        </td>
                        <td style={{border: '1px solid #ddd', padding: '8px', textAlign: 'center'}}>
                          <button 
                            type="button" 
                            onClick={() => removeBankCard(index)} 
                            style={{
                              padding: '6px 12px', 
                              fontSize: '12px',
                              backgroundColor: '#fd7e14',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              margin: '0 auto',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#e8590c'}
                            onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#fd7e14'}
                          >
                            刪除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button 
                  type="button" 
                  onClick={addBankCard} 
                  className="btn-add-bank-card"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ➕ 新增銀行卡
                </button>
              </div>
            </div>
          </div>

          {/* 分潤條件設定 */}
          <div className="form-section">
            <div className="section-title">分潤條件設定</div>

            <div className="form-field">
              <label className="required">代理制度</label>
              <select 
                value={commissionSystem} 
                onChange={canEditAllFields ? (e => setCommissionSystem(e.target.value as CommissionMethod | '')) : undefined}
                disabled={!canEditAllFields}
              >
                <option value="">請選擇代理制度</option>
                <option value={CommissionMethod.SETTLEMENT_ACTIVE_MEMBERS}>占成制</option>
                <option value={CommissionMethod.SETTLEMENT_ECPAY_PERSON}>返水制(總投注額回饋)</option>
              </select>
              {!canEditAllFields && <div className="form-hint">🔒 此欄位僅管理員可修改</div>}
            </div>

            <div className="form-field">
              <label className="required">分潤選擇</label>
              <select 
                value={form.commissionConditionId || ''} 
                onChange={canEditAllFields ? (e => update('commissionConditionId', e.target.value || null)) : undefined}
                disabled={!commissionSystem || !canEditAllFields}
              >
                <option value="">請選擇分潤方案</option>
                {filteredConditions.map(condition => (
                  <option key={condition.id} value={condition.id}>
                    {condition.name} ({condition.agentName})
                  </option>
                ))}
              </select>
              {!commissionSystem && <div className="form-hint">請先選擇代理制度</div>}
              {!canEditAllFields && <div className="form-hint">🔒 此欄位僅管理員可修改</div>}
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

          {/* 禁止遊戲 */}
          <div className="form-section banned-games-section">
            <div className="section-title">禁止遊戲</div>

            {/* 真人 */}
            <div className="form-field">
              <label className="game-category-header">
                <input 
                  type="checkbox" 
                  className="category-checkbox"
                  checked={bannedGames.live.enabled}
                  onChange={() => toggleCategoryBan('live')}
                  disabled={!canEditAllFields}
                />
                <span className="game-category-title">真人</span>
              </label>
              <div className="game-providers-grid">
                {getProvidersByCategory('live').map(provider => (
                  <label key={provider.code} className="provider-checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={bannedGames.live.providers.includes(provider.code)}
                      onChange={() => toggleProviderBan('live', provider.code)}
                      disabled={!canEditAllFields}
                    />
                    <span>{provider.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 電子 */}
            <div className="form-field">
              <label className="game-category-header">
                <input 
                  type="checkbox" 
                  className="category-checkbox"
                  checked={bannedGames.slot.enabled}
                  onChange={() => toggleCategoryBan('slot')}
                  disabled={!canEditAllFields}
                />
                <span className="game-category-title">電子</span>
              </label>
              <div className="game-providers-grid">
                {getProvidersByCategory('slot').map(provider => (
                  <label key={provider.code} className="provider-checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={bannedGames.slot.providers.includes(provider.code)}
                      onChange={() => toggleProviderBan('slot', provider.code)}
                      disabled={!canEditAllFields}
                    />
                    <span>{provider.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 體育 */}
            <div className="form-field">
              <label className="game-category-header">
                <input 
                  type="checkbox" 
                  className="category-checkbox"
                  checked={bannedGames.sports.enabled}
                  onChange={() => toggleCategoryBan('sports')}
                  disabled={!canEditAllFields}
                />
                <span className="game-category-title">體育</span>
              </label>
              <div className="game-providers-grid">
                {getProvidersByCategory('sports').map(provider => (
                  <label key={provider.code} className="provider-checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={bannedGames.sports.providers.includes(provider.code)}
                      onChange={() => toggleProviderBan('sports', provider.code)}
                      disabled={!canEditAllFields}
                    />
                    <span>{provider.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 彩票 */}
            <div className="form-field">
              <label className="game-category-header">
                <input 
                  type="checkbox" 
                  className="category-checkbox"
                  checked={bannedGames.lottery.enabled}
                  onChange={() => toggleCategoryBan('lottery')}
                  disabled={!canEditAllFields}
                />
                <span className="game-category-title">彩票</span>
              </label>
              <div className="game-providers-grid">
                {getProvidersByCategory('lottery').map(provider => (
                  <label key={provider.code} className="provider-checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={bannedGames.lottery.providers.includes(provider.code)}
                      onChange={() => toggleProviderBan('lottery', provider.code)}
                      disabled={!canEditAllFields}
                    />
                    <span>{provider.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 棋牌 */}
            <div className="form-field">
              <label className="game-category-header">
                <input 
                  type="checkbox" 
                  className="category-checkbox"
                  checked={bannedGames.card.enabled}
                  onChange={() => toggleCategoryBan('card')}
                  disabled={!canEditAllFields}
                />
                <span className="game-category-title">棋牌</span>
              </label>
              <div className="game-providers-grid">
                {getProvidersByCategory('card').map(provider => (
                  <label key={provider.code} className="provider-checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={bannedGames.card.providers.includes(provider.code)}
                      onChange={() => toggleProviderBan('card', provider.code)}
                      disabled={!canEditAllFields}
                    />
                    <span>{provider.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 捕魚 */}
            <div className="form-field">
              <label className="game-category-header">
                <input 
                  type="checkbox" 
                  className="category-checkbox"
                  checked={bannedGames.fishing.enabled}
                  onChange={() => toggleCategoryBan('fishing')}
                  disabled={!canEditAllFields}
                />
                <span className="game-category-title">捕魚</span>
              </label>
              <div className="game-providers-grid">
                {getProvidersByCategory('fishing').map(provider => (
                  <label key={provider.code} className="provider-checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={bannedGames.fishing.providers.includes(provider.code)}
                      onChange={() => toggleProviderBan('fishing', provider.code)}
                      disabled={!canEditAllFields}
                    />
                    <span>{provider.name}</span>
                  </label>
                ))}
              </div>
            </div>
            {!canEditAllFields && (
              <div className="form-hint" style={{color: 'red', marginTop: '10px'}}>
                🔒 遊戲廠商限制設定僅管理員可修改
              </div>
            )}
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
            <span>✅</span>
            {submitting ? '更新中...' : '更新代理商'}
          </button>
        </div>
      </div>
      </form>
    </div>
  );
}
