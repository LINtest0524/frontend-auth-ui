export interface User {
  id: number;
  username: string;
  email: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;

  created_by?: {
    username: string;
  } | null;

  last_login_ip?: string | null;
  last_login_platform?: string | null;
  last_login_at?: string | null;

  is_blacklisted: boolean;

  role?: 'USER' | 'AGENT_SUPPORT' | 'AGENT_OWNER' | 'AGENT_LEVEL_1' | 'AGENT_LEVEL_2' | 'AGENT_LEVEL_3' | 'AGENT_LEVEL_4' | 'GLOBAL_ADMIN' | 'SUPER_ADMIN';

  companyId?: number;
  company?: {
    id: number;
    name: string;
  };

  phone?: string | null;
  agent_name?: string | null;
  user_code?: string | null;

  // 代理商階層關係
  parent_agent_id?: number | null;
  parent_agent?: {
    id: number;
    username: string;
    agent_code?: string | null;
  } | null;

  modules?: string[];

  // 部門資訊
  department_type?: string | null;

  // 驗證相關欄位
  id_verified?: boolean;
  id_verified_at?: string | null;
  bank_verified?: boolean;
  bank_verified_at?: string | null;
  vip_level?: number;
  balance?: number;
}
