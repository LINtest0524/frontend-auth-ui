import { adminApiGet, adminApiPost, adminApiPut, adminApiDelete } from '@/lib/admin-api';

export type AgentOptionCompany = { id: number; name: string; code: string };
export type AgentOptionParent = { id: number; displayName: string; agentLevel: number };

export type AgentOptionsResponse = {
  levels: number[];
  statuses: ('active' | 'inactive' | 'pending')[];
  companies: AgentOptionCompany[];
};

export async function fetchAgentOptions(): Promise<AgentOptionsResponse> {
  const [levels, statuses, companies] = await Promise.all([
    adminApiGet<number[]>('/agents/options/levels'),
    adminApiGet<('active' | 'inactive' | 'pending')[]>('/agents/options/statuses'),
    adminApiGet<AgentOptionCompany[]>('/agents/options/companies'),
  ]);
  return { levels, statuses, companies };
}

export async function fetchParentAgents(companyId: number): Promise<AgentOptionParent[]> {
  return adminApiGet<AgentOptionParent[]>(`/agents/options/parents?companyId=${companyId}`);
}

export type CreateAgentPayload = {
  companyId: number;
  agentLevel: number;
  parentAgentId?: number | null;
  displayName: string;
  commissionConditionId?: string | null;
  phone?: string;
  email?: string;
  telegram?: string;
  line?: string;
  qq?: string;
  status: 'active' | 'inactive' | 'pending';
  loginAccount: string;
  password: string;
  confirmPassword?: string;
  frontendUrl?: string;
  defaultVipLevel?: string;
  defaultRebateSettlement?: string;
  defaultPaymentGroup?: string;
  accountStatus?: string[];
  note?: string;
  // 代理資料
  agentName?: string;
  gender?: 'MALE' | 'FEMALE';
  idNumber?: string;
  bankCards?: Array<{
    bankCode?: string;
    accountNumber?: string;
    passbookCoverUrl?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    note?: string;
  }>;
  // 禁止遊戲廠商
  bannedGameProviders?: {
    live?: { enabled: boolean; providers: string[] };
    slot?: { enabled: boolean; providers: string[] };
    sports?: { enabled: boolean; providers: string[] };
    lottery?: { enabled: boolean; providers: string[] };
    card?: { enabled: boolean; providers: string[] };
    fishing?: { enabled: boolean; providers: string[] };
  };
  // 預留
  revenueShare?: string;
  rebateLevel?: string;
};

export async function createAgent(payload: CreateAgentPayload) {
  return adminApiPost('/agents', payload);
}

export async function fetchAgents(companyId?: number) {
  const url = companyId ? `/agents?companyId=${companyId}` : '/agents';
  return adminApiGet(url);
}

export async function fetchAgentById(id: number) {
  return adminApiGet(`/agents/${id}`);
}

export type UpdateAgentPayload = {
  companyId?: number;
  agentLevel?: number;
  parentAgentId?: number | null;
  displayName?: string;
  commissionConditionId?: string | null;
  phone?: string;
  email?: string;
  telegram?: string;
  line?: string;
  qq?: string;
  status?: 'active' | 'inactive' | 'pending';
  loginAccount?: string;
  password?: string;
  note?: string;
  // 新增欄位
  frontendUrl?: string;
  defaultVipLevel?: string;
  defaultRebateSettlement?: string;
  defaultPaymentGroup?: string;
  accountStatus?: string[];
  agentName?: string;
  gender?: 'MALE' | 'FEMALE';
  idNumber?: string;
  bankCards?: Array<{
    bankCode?: string;
    accountNumber?: string;
    passbookCoverUrl?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    note?: string;
  }>;
  bannedGameProviders?: {
    live?: { enabled: boolean; providers: string[] };
    slot?: { enabled: boolean; providers: string[] };
    sports?: { enabled: boolean; providers: string[] };
    lottery?: { enabled: boolean; providers: string[] };
    card?: { enabled: boolean; providers: string[] };
    fishing?: { enabled: boolean; providers: string[] };
  };
  // 預留
  revenueShare?: string;
  rebateLevel?: string;
};

export async function updateAgent(id: number, payload: UpdateAgentPayload) {
  return adminApiPut(`/agents/${id}`, payload);
}

export async function deleteAgent(id: number) {
  return adminApiDelete(`/agents/${id}`);
}

// 上傳存摺封面圖片
export async function uploadBankCardImage(file: File): Promise<{ url: string; filename: string; originalName: string; size: number }> {
  const formData = new FormData();
  formData.append('file', file);
  
  const token = localStorage.getItem('token');
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/agents/upload/bankcard`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Upload failed');
  }
  
  return res.json();
}

// 遊戲廠商相關類型
export interface GameProvider {
  code: string;
  name: string;
  category: string;
  isActive: boolean;
  logoUrl?: string;
  description?: string;
}

// 獲取所有啟用的遊戲廠商
export async function fetchGameProviders(): Promise<GameProvider[]> {
  return adminApiGet('/api/admin/game-providers');
}