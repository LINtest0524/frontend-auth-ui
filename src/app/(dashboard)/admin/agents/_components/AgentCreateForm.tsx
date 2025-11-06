'use client';
import React, { useEffect, useMemo, useState } from 'react';
import '@/styles/pages/agent-create-form.css';
import { createAgent, fetchAgentOptions, fetchParentAgents, CreateAgentPayload } from '../_lib/agent-api';
import { useRouter } from 'next/navigation';
import { handleApiError } from '@/lib/errorHandler';

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

  const [form, setForm] = useState<CreateAgentPayload>({
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
        const res = await fetchAgentOptions();
        setLevels(res.levels.map(v => ({ label: `Level ${v}`, value: v })));
        
        const statusLabels = {
          'active': '啟用',
          'inactive': '停用', 
          'pending': '待審核'
        };
        setStatuses(res.statuses.map(s => ({ 
          label: statusLabels[s] || s, 
          value: s 
        })));
        
        setCompanies(res.companies.map(c => ({ label: `${c.name} (${c.code})`, value: c.id })));
        
        // 載入佣金條件
        if (res.companies.length > 0) {
          try {
            // 使用 commissionConditionsApi 直接調用
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
        }
      } catch (e) {
        handleApiError(e, 'AgentCreateForm-fetchOptions');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!form.companyId) { setParents([]); return; }
    (async () => {
      try {
        const list = await fetchParentAgents(form.companyId);
        setParents(list.map(p => ({ label: `L${p.agentLevel} - ${p.displayName} (#${p.id})`, value: p.id })));
      } catch (e) {
        handleApiError(e, 'AgentCreateForm-fetchParents');
      }
    })();
  }, [form.companyId]);

  const canSubmit = useMemo(() => {
    return !!form.companyId && !!form.displayName && !!form.loginAccount && !!form.password && !!form.agentLevel;
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
      {/* 基本資料和聯絡資訊 - 左右排列 */}
      <div className="form-row">
        {/* 基本資料區塊 */}
        <div className="form-section form-half">
          <div className="section-title">
            <span>🏢</span>
            基本資料
          </div>
          
          <div className="form-field">
            <label className="required">所屬公司</label>
            <select value={form.companyId} onChange={e => update('companyId', Number(e.target.value))}>
              <option value={0}>請選擇公司</option>
              {companies.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="form-field">
            <label className="required">代理層級</label>
            <select value={form.agentLevel} onChange={e => update('agentLevel', Number(e.target.value))}>
              {levels.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div className="form-hint">層級決定代理商在組織中的位置</div>
          </div>

          <div className="form-field">
            <label>上級代理</label>
            <select value={form.parentAgentId ?? ''} onChange={e => update('parentAgentId', e.target.value ? Number(e.target.value) : null)}>
              <option value="">（無上級代理）</option>
              {parents.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div className="form-hint">選擇上級代理建立層級關係（可選）</div>
          </div>

          <div className="form-field">
            <label className="required">顯示名稱</label>
            <input 
              value={form.displayName} 
              onChange={e => update('displayName', e.target.value)} 
              placeholder="代理商顯示名稱" 
            />
          </div>

          <div className="form-field">
            <label>占成條件</label>
            <select 
              value={form.commissionConditionId ?? ''} 
              onChange={e => update('commissionConditionId', e.target.value ? e.target.value : null)}
            >
              {commissionConditions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div className="form-hint">選擇適用的占成條件方案（可選）</div>
          </div>

          <div className="form-field">
            <label>狀態</label>
            <select value={form.status} onChange={e => update('status', e.target.value as any)}>
              {statuses.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

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

        {/* 聯絡資訊區塊 */}
        <div className="form-section form-half">
          <div className="section-title">
            <span>📞</span>
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
      </div>

      {/* 登入資訊區塊 */}
      <div className="form-section">
        <div className="section-title">
          <span>🔐</span>
          登入資訊
        </div>
          <div className="form-field">
            <label className="required">登入帳號</label>
            <input 
              value={form.loginAccount} 
              onChange={e => update('loginAccount', e.target.value)} 
              placeholder="請輸入唯一帳號" 
            />
            <div className="form-hint">帳號必須唯一，建議使用英文字母和數字</div>
          </div>
          <div className="form-field">
            <label className="required">登入密碼</label>
            <input 
              type="password" 
              value={form.password} 
              onChange={e => update('password', e.target.value)} 
              placeholder="至少 8 個字元" 
            />
            <div className="form-hint">建議使用英文、數字和特殊符號組合</div>
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