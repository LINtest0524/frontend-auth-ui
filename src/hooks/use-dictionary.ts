import { useState, useEffect, useCallback } from 'react';
import { dictionaryApi, PlatformDictionary, AgentListItem } from '@/lib/api/dictionary-api';
import { useCompanySlug } from '@/hooks/useCompanySlug';

/**
 * 平台字典 Hook
 */
export function usePlatformDictionary() {
  const companySlug = useCompanySlug();
  const [platforms, setPlatforms] = useState<PlatformDictionary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlatforms = useCallback(async () => {
    if (!companySlug) return;

    try {
      setLoading(true);
      setError(null);
      console.log(`🎮 正在載入平台字典...`);
      
      const data = await dictionaryApi.getPlatforms(companySlug);
      setPlatforms(data);
      
      console.log(`✅ 平台字典載入完成: ${data.length} 個平台`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入平台字典失敗';
      setError(errorMessage);
      console.error('❌ 平台字典載入失敗:', err);
      
      // 設定 fallback 預設平台
      setPlatforms([
        { code: 'AFB88', name: 'AFB體育', isActive: true },
        { code: 'DBG', name: 'DBG電子', isActive: true },
        { code: 'MT', name: 'MT棋牌', isActive: true },
        { code: 'SUPER', name: 'SUPER彩票', isActive: true },
      ]);
    } finally {
      setLoading(false);
    }
  }, [companySlug]);

  useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  return {
    platforms,
    loading,
    error,
    refresh: fetchPlatforms,
    // 便利方法
    activePlatforms: platforms.filter(p => p.isActive),
    getPlatformByCode: (code: string) => platforms.find(p => p.code === code),
  };
}

/**
 * 代理清單 Hook
 */
export function useAgentsList(options?: {
  active?: boolean;
  keyword?: string;
  autoLoad?: boolean;
}) {
  const companySlug = useCompanySlug();
  const [agents, setAgents] = useState<AgentListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { active, keyword, autoLoad = true } = options || {};

  const fetchAgents = useCallback(async (searchOptions?: {
    active?: boolean;
    keyword?: string;
  }) => {
    if (!companySlug) return;

    try {
      setLoading(true);
      setError(null);
      console.log(`👥 正在載入代理清單...`);
      
      const searchParams = {
        active: searchOptions?.active ?? active,
        keyword: searchOptions?.keyword ?? keyword,
      };
      
      const data = await dictionaryApi.getAgents(companySlug, searchParams);
      setAgents(data);
      
      console.log(`✅ 代理清單載入完成: ${data.length} 個代理`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入代理清單失敗';
      setError(errorMessage);
      console.error('❌ 代理清單載入失敗:', err);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, [companySlug, active, keyword]);

  useEffect(() => {
    if (autoLoad) {
      fetchAgents();
    }
  }, [fetchAgents, autoLoad]);

  return {
    agents,
    loading,
    error,
    fetch: fetchAgents,
    refresh: () => fetchAgents(),
    // 便利方法
    activeAgents: agents.filter(a => a.isActive),
    getAgentById: (id: number) => agents.find(a => a.id === id),
    getAgentsByLevel: (level: number) => agents.filter(a => a.level === level),
  };
}