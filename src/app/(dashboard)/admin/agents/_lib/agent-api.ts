import { adminApiGet, adminApiPost, adminApiPut, adminApiDelete } from '@/lib/admin-api';

export type AgentOptionCompany = { id: number; name: string; code: string };
export type AgentOptionParent = { id: number; displayName: string; agentLevel: number };

export async function fetchAgentOptions() {
  const [levels, statuses, companies] = await Promise.all([
    adminApiGet('/agents/options/levels'),
    adminApiGet('/agents/options/statuses'),
    adminApiGet('/agents/options/companies'),
  ]);
  return { levels, statuses, companies };
}

export async function fetchParentAgents(companyId: number) {
  return adminApiGet(`/agents/options/parents?companyId=${companyId}`);
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
  note?: string;
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
  revenueShare?: string;
  rebateLevel?: string;
};

export async function updateAgent(id: number, payload: UpdateAgentPayload) {
  return adminApiPut(`/agents/${id}`, payload);
}

export async function deleteAgent(id: number) {
  return adminApiDelete(`/agents/${id}`);
}