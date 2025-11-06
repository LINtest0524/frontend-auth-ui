import { useCompanySlug } from '@/hooks/useCompanySlug';

// 平台字典介面
export interface PlatformDictionary {
  code: string;
  name: string;
  category?: string;
  isActive: boolean;
}

// 代理簡化介面
export interface AgentListItem {
  id: number;
  name: string;
  username: string;
  level: number;
  isActive: boolean;
}

// 取得 API Token
function getApiToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  const possibleKeys = [
    'portalToken',
    'portalToken_admin', 
    'adminToken',
    'token'
  ];
  
  for (const key of possibleKeys) {
    const token = localStorage.getItem(key);
    if (token) {
      return token;
    }
  }
  return null;
}

// 基礎 API 請求
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const token = getApiToken();
  if (!token) {
    throw new Error('未找到授權令牌，請重新登入');
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
  const url = `${baseUrl}/api${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || `請求失敗 (${response.status})`;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

/**
 * 字典 API
 */
export const dictionaryApi = {
  /**
   * 取得平台字典清單
   */
  async getPlatforms(companySlug: string): Promise<PlatformDictionary[]> {
    // 處理 admin 路由的特殊情況
    if (companySlug === 'admin' || !companySlug) {
      console.log('🔧 Admin路由檢測到，使用預設平台清單');
      return [
        { code: 'AFB88', name: 'AFB體育', category: 'sports', isActive: true },
        { code: 'DBG', name: 'DBG電子', category: 'slot', isActive: true },
        { code: 'MT', name: 'MT棋牌', category: 'card', isActive: true },
        { code: 'SUPER', name: 'SUPER彩票', category: 'lottery', isActive: true },
        { code: 'DB539', name: 'DB539彩票', category: 'lottery', isActive: true },
        { code: 'R10', name: 'R10電子', category: 'slot', isActive: true },
        { code: 'wgwin', name: 'WG真人', category: 'live', isActive: true },
        { code: 'wgwin539', name: 'WG539', category: 'lottery', isActive: true },
      ];
    }
    
    return apiRequest<PlatformDictionary[]>(`/portal/${companySlug}/dictionary/platforms`);
  },

  /**
   * 取得代理清單（用於下拉選單）
   */
  async getAgents(companySlug: string, options?: {
    active?: boolean;
    keyword?: string;
  }): Promise<AgentListItem[]> {
    // 處理 admin 路由的特殊情況，使用現有的代理API
    if (companySlug === 'admin' || !companySlug) {
      console.log('🔧 Admin路由檢測到，使用現有代理API');
      try {
        const token = getApiToken();
        if (!token) {
          throw new Error('未找到授權令牌');
        }

        const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
        
        // 先取得公司列表
        const companiesResponse = await fetch(`${baseUrl}/agents/options/companies`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!companiesResponse.ok) {
          throw new Error('取得公司列表失敗');
        }

        const companies = await companiesResponse.json();
        if (!companies || companies.length === 0) {
          return [{ id: 0, name: '任意代理商', username: 'any', level: 0, isActive: true }];
        }

        // 取得所有公司的代理商（超級管理員應該看到所有代理商）
        const allAgents = [];
        
        for (const company of companies) {
          try {
            const agentsResponse = await fetch(`${baseUrl}/agents/options/parents?companyId=${company.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (agentsResponse.ok) {
              const companyAgents = await agentsResponse.json();
              // 標記每個代理商所屬的公司
              companyAgents.forEach((agent: any) => {
                if (agent.id !== 0) { // 不重複添加任意代理商選項
                  agent.companyName = company.name;
                  agent.companyCode = company.code;
                  allAgents.push(agent);
                }
              });
              
              console.log(`📋 Company ${company.name}: ${companyAgents.length} agents`);
            }
          } catch (error) {
            console.warn(`⚠️ Failed to load agents for company ${company.name}:`, error);
          }
        }
        
        // 手動添加任意代理商選項到開頭
        const agentData = [
          { id: 0, displayName: '任意代理商', username: 'any', agentLevel: 0 },
          ...allAgents
        ];
        
        console.log(`📊 Total agents from all companies: ${agentData.length}`);
        
        // 格式化為標準格式，包含公司資訊
        const formattedAgents = agentData.map((agent: any) => ({
          id: agent.id,
          name: agent.id === 0 
            ? '🌟 任意代理商' 
            : `${agent.displayName || agent.agentName || agent.username || `Agent ${agent.id}`}${agent.companyName ? ` (${agent.companyName})` : ''}`,
          username: agent.username || `agent_${agent.id}`,
          level: agent.agentLevel || 0,
          isActive: true,
          companyName: agent.companyName,
          companyCode: agent.companyCode,
        }));

        console.log(`✅ Admin代理清單載入成功: ${formattedAgents.length} 個代理`);
        console.log(`📋 代理商詳情:`, formattedAgents.map(a => `${a.name} (Level ${a.level})`));
        return formattedAgents;
        
      } catch (error) {
        console.error('❌ Admin代理清單載入失敗:', error);
        return [{ id: 0, name: '任意代理商', username: 'any', level: 0, isActive: true }];
      }
    }
    
    const params = new URLSearchParams();
    
    if (options?.active !== undefined) {
      params.set('active', options.active.toString());
    }
    if (options?.keyword) {
      params.set('keyword', options.keyword);
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<AgentListItem[]>(`/portal/${companySlug}/dictionary/agents${query}`);
  },
};