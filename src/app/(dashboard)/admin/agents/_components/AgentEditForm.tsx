'use client';
import React, { useEffect, useMemo, useState } from 'react';
import '@/styles/pages/agent-create-form.css';
import { fetchAgentOptions, fetchParentAgents, fetchAgentById, updateAgent, UpdateAgentPayload } from '../_lib/agent-api';
import { useRouter } from 'next/navigation';
import { handleApiError } from '@/lib/errorHandler';
import { getUser } from '@/lib/useAuth';
import { useUserStore } from '@/hooks/use-user-store';

type Option<T extends string | number> = { label: string; value: T };

interface AgentEditFormProps {
  agentId: number;
}

export default function AgentEditForm({ agentId }: AgentEditFormProps) {
  const router = useRouter();
  const user = getUser();
  const currentUser = useUserStore((state) => state.user);

  // 權限檢查：只有超級管理員和全域管理員可以編輯所有欄位
  // 優先使用 useUserStore，如果沒有則使用 getUser
  const activeUser = currentUser || user;
  const canEditAllFields = activeUser?.role === 'SUPER_ADMIN' || activeUser?.role === 'GLOBAL_ADMIN';
  const isRestrictedUser = !canEditAllFields; // 代理商只能編輯聯絡資訊


  const [levels, setLevels] = useState<Option<number>[]>([]);
  const [statuses, setStatuses] = useState<Option<any>[]>([]);
  const [companies, setCompanies] = useState<Option<number>[]>([]);
  const [parents, setParents] = useState<Option<number>[]>([]);
  const [commissionConditions, setCommissionConditions] = useState<Option<string>[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<UpdateAgentPayload & { id: number }>({
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
  });

  useEffect(() => {
    (async () => {
      try {
        // 獲取選項數據和代理商資料
        const [optionsRes, agentData] = await Promise.all([
          fetchAgentOptions(),
          fetchAgentById(agentId)
        ]);

        setLevels(optionsRes.levels.map(v => ({ label: `Level ${v}`, value: v })));
        const statusLabels = {
          'active': '啟用',
          'inactive': '停用', 
          'pending': '待審核'
        };
        setStatuses(optionsRes.statuses.map(s => ({ 
          label: statusLabels[s] || s, 
          value: s 
        })));
        setCompanies(optionsRes.companies.map(c => ({ label: `${c.name} (${c.code})`, value: c.id })));

        // 載入占成條件
        try {
          const { commissionConditionsApi } = await import('@/lib/api/commissionConditions');
          const conditions = await commissionConditionsApi.list({ page: 1, limit: 100 });
          
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

        // 設置表單數據
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
          password: '', // 編輯時密碼留空
          note: agentData.note || '',
        });
      } catch (e) {
        handleApiError(e, 'AgentEditForm-fetchData');
      } finally {
        setLoading(false);
      }
    })();
  }, [agentId]);

  useEffect(() => {
    if (!form.companyId || form.companyId === 0) { setParents([]); return; }
    
    const companyId = form.companyId; // 確保 TypeScript 知道這是有效的 companyId
    (async () => {
      try {
        const list = await fetchParentAgents(companyId);
        // 排除自己作為上級選項
        const filteredList = list.filter(p => p.id !== agentId);
        setParents(filteredList.map(p => ({ label: `L${p.agentLevel} - ${p.displayName} (#${p.id})`, value: p.id })));
      } catch (e) {
        handleApiError(e, 'AgentEditForm-fetchParents');
      }
    })();
  }, [form.companyId, agentId]);

  const canSubmit = useMemo(() => {
    return !!form.companyId && !!form.displayName && !!form.agentLevel;
  }, [form]);

  function update<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const { id, ...payload } = form;
      // 只有超級管理員和全域管理員可以更改密碼
      if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'GLOBAL_ADMIN') {
        delete payload.password;
      } else if (!payload.password) {
        // 如果是高權限用戶但密碼為空，則不更新密碼
        delete payload.password;
      }
      await updateAgent(agentId, payload);
      alert('代理商資料更新成功！');
      router.push('/admin/agents');
    } catch (e) {
      handleApiError(e, 'AgentEditForm-submit');
    } finally {
      setSubmitting(false);
    }
  }

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
    <form className="agent-form-content" onSubmit={onSubmit}>
      <div className="agent-form-grid">
        {/* 基本資料區塊 */}
        <div className="form-section">
          <div className="form-section-title">🏢 基本資料</div>
          
          <div className="form-field">
            <label className="required">所屬公司</label>
            <select 
              value={form.companyId} 
              onChange={canEditAllFields ? (e => update('companyId', Number(e.target.value))) : undefined}
              disabled={!canEditAllFields}
              style={!canEditAllFields ? { backgroundColor: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' } : {}}
            >
              <option value={0}>請選擇公司</option>
              {companies.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {!canEditAllFields && <div className="form-hint">🔒 此欄位僅管理員可修改</div>}
          </div>

          <div className="form-field">
            <label className="required">代理層級</label>
            <select 
              value={form.agentLevel} 
              onChange={canEditAllFields ? (e => update('agentLevel', Number(e.target.value))) : undefined}
              disabled={!canEditAllFields}
              style={!canEditAllFields ? { backgroundColor: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' } : {}}
            >
              {levels.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div className="form-hint">
              {canEditAllFields ? '層級決定代理商在組織中的位置' : '🔒 此欄位僅管理員可修改'}
            </div>
          </div>

          <div className="form-field">
            <label>上級代理</label>
            <select 
              value={form.parentAgentId ?? ''} 
              onChange={canEditAllFields ? (e => update('parentAgentId', e.target.value ? Number(e.target.value) : null)) : undefined}
              disabled={!canEditAllFields}
              style={!canEditAllFields ? { backgroundColor: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' } : {}}
            >
              <option value="">（無上級代理）</option>
              {parents.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div className="form-hint">
              {canEditAllFields ? '選擇上級代理建立層級關係（可選）' : '🔒 此欄位僅管理員可修改'}
            </div>
          </div>

          <div className="form-field">
            <label className="required">顯示名稱</label>
            <input 
              value={form.displayName} 
              onChange={canEditAllFields ? (e => update('displayName', e.target.value)) : undefined}
              placeholder="代理商顯示名稱"
              readOnly={!canEditAllFields}
              disabled={!canEditAllFields}
              style={!canEditAllFields ? { backgroundColor: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' } : {}}
            />
            {!canEditAllFields && <div className="form-hint">🔒 此欄位僅管理員可修改</div>}
          </div>

          <div className="form-field">
            <label>占成條件</label>
            <select 
              value={form.commissionConditionId ?? ''} 
              onChange={canEditAllFields ? (e => update('commissionConditionId', e.target.value ? e.target.value : null)) : undefined}
              disabled={!canEditAllFields}
              style={!canEditAllFields ? { backgroundColor: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' } : {}}
            >
              {commissionConditions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div className="form-hint">
              {canEditAllFields ? '選擇適用的占成條件方案（可選）' : '🔒 此欄位僅管理員可修改'}
            </div>
          </div>

          <div className="form-field">
            <label>狀態</label>
            <select 
              value={form.status} 
              onChange={canEditAllFields ? (e => update('status', e.target.value as any)) : undefined}
              disabled={!canEditAllFields}
              style={!canEditAllFields ? { backgroundColor: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' } : {}}
            >
              {statuses.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {!canEditAllFields && <div className="form-hint">🔒 此欄位僅管理員可修改</div>}
          </div>

          <div className="form-field">
            <label>備註</label>
            <textarea 
              rows={3} 
              value={form.note} 
              onChange={canEditAllFields ? (e => update('note', e.target.value)) : undefined}
              placeholder="代理商相關備註資訊（選填）"
              readOnly={!canEditAllFields}
              disabled={!canEditAllFields}
              style={!canEditAllFields ? { backgroundColor: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed', resize: 'none' } : {}}
            />
            {!canEditAllFields && <div className="form-hint">🔒 此欄位僅管理員可修改</div>}
          </div>
        </div>


        {/* 聯絡資訊區塊 */}
        <div className="form-section">
          <div className="form-section-title">📞 聯絡資訊</div>
          
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

        {/* 登入資訊區塊 */}
        <div className="login-info-section">
          <div className="form-section-title">🔐 登入資訊</div>
          <div className="login-info-grid">
            <div className="form-field">
              <label>登入帳號</label>
              <input 
                value={form.loginAccount} 
                readOnly
                disabled
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  cursor: 'not-allowed'
                }}
              />
              <div className="form-hint">帳號一旦創建後無法修改</div>
            </div>
            
            {/* 密碼欄位 - 僅管理員可見 */}
            {canEditAllFields && (
              <div className="form-field">
                <label>登入密碼</label>
                <input 
                  type="password" 
                  value={form.password} 
                  onChange={e => update('password', e.target.value)}
                  placeholder="留空表示不更改密碼"
                />
                <div className="form-hint">
                  🔐 僅超級管理員和全域管理員可修改密碼。留空表示不更改現有密碼
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
          取消
        </button>
        <button type="submit" className="btn btn-primary" disabled={!canSubmit || submitting}>
          {submitting ? '⏳ 更新中...' : '✅ 更新代理商'}
        </button>
      </div>
    </form>
  );
}