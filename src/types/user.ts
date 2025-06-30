export interface User {
  id: number;
  username: string;
  email: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;

  last_login_ip?: string | null;
  last_login_platform?: string | null;
  last_login_at?: string | null;

  is_blacklisted: boolean;

  role?: 'USER' | 'AGENT_SUPPORT' | 'AGENT_OWNER' | 'GLOBAL_ADMIN' | 'SUPER_ADMIN';

  companyId?: number;
  company?: {
    id: number;
    name: string;
  };

  phone?: string | null;
  agent_name?: string | null;
  user_code?: string | null;

  modules?: string[];
}
