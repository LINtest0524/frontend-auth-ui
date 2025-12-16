'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAgents, fetchAgentOptions, deleteAgent } from '../_lib/agent-api';
import { handleApiError } from '@/lib/errorHandler';
import { useUserStore } from '@/hooks/use-user-store';
// import { useCommissionConditionsStore } from '@/stores/useCommissionConditionsStore';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import '@/styles/pages/agent-form.css';
import '@/styles/pages/commission-conditions.css';
import '@/styles/pages/users.css';

interface Agent {
  id: number;
  agent_name: string;
  display_name?: string;
  username: string;
  agent_level: number;
  parent_agent_id?: number;
  status: string;
  phone?: string;
  email?: string;
  telegram?: string;
  line?: string;
  agent_code?: string;
  created_at: string;
  last_login_at?: string;
  member_count?: number;
  max_agent_level?: number;
  next_level_count?: number;
  default_payment_group?: string;
  default_rebate_settlement?: string;
  company: {
    name: string;
    code: string;
  };
  children?: Agent[];
  parent_agent?: {
    id: number;
    agent_name: string;
    username: string;
  };
  commission_condition?: {
    id: number;
    name: string;
    systemType?: string;
    commissionPercent?: number;
    gameRebateRates?: Record<string, number>;
  };
}

export default function AgentList() {
  // 動態計算並更新第2欄的 left 位置
  React.useEffect(() => {
    // 添加固定欄位的 CSS
    const style = document.createElement('style');
    style.id = 'agent-sticky-columns-style';
    style.innerHTML = `
      .sticky-col-1 {
        white-space: nowrap !important;
        position: sticky !important;
        left: 0 !important;
        z-index: 10 !important;
        border-right: 0px solid #d3d3d3 !important;
        border-bottom: 0px solid #d3d3d3 !important;
        background-color: white !important;
        box-shadow: inset -1px 0 0 #ddd, inset 0 -1px 0 #ddd, 2px 0 4px rgba(0,0,0,0.1) !important;
      }
      
      .sticky-col-2 {
        white-space: nowrap !important;
        position: sticky !important;
        z-index: 10 !important;
        border-right: 0px solid #d3d3d3 !important;
        border-bottom: 0px solid #d3d3d3 !important;
        background-color: white !important;
        box-shadow: inset -1px 0 0 #ddd, inset 0 -1px 0 #ddd, 2px 0 4px rgba(0,0,0,0.1) !important;
      }
      
      thead .sticky-col-1,
      thead .sticky-col-2 {
        z-index: 11 !important;
      }
      
      tbody tr:nth-child(even) .sticky-col-1,
      tbody tr:nth-child(even) .sticky-col-2 {
        background-color: #efefef !important;
      }
    `;
    document.head.appendChild(style);

    const updateSecondColumnPosition = () => {
      const table = document.getElementById('agent-table-view');
      if (!table) return;

      // 獲取第一欄的實際寬度
      const firstCol = table.querySelector('th:nth-child(1)') as HTMLElement;
      if (!firstCol) return;
      
      const firstColWidth = firstCol.offsetWidth;
      
      // 更新所有第2欄的 left 位置
      const secondHeaders = table.querySelectorAll('th:nth-child(2)');
      const secondCells = table.querySelectorAll('td:nth-child(2)');
      
      [...secondHeaders, ...secondCells].forEach((el: any) => {
        if (el) {
          el.style.left = `${firstColWidth}px`;
        }
      });
    };

    // 初始化
    const timer = setTimeout(updateSecondColumnPosition, 100);

    // 監聽視窗大小變化
    window.addEventListener('resize', updateSecondColumnPosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSecondColumnPosition);
      const styleEl = document.getElementById('agent-sticky-columns-style');
      if (styleEl) document.head.removeChild(styleEl);
    };
  }, []); // 空依賴,避免循環依賴

  const router = useRouter();
  const currentUser = useUserStore((state) => state.user);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('table'); // 新增：視圖模式狀態，預設為表格
  
  // 層級導航狀態
  interface BreadcrumbItem {
    agentId: number | null; // null 表示第一級
    agentName: string;
    level: number;
  }
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { agentId: null, agentName: '1級代理', level: 1 }
  ]);
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);

  // 篩選條件狀態（暫存，未套用）
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterAgentLevel, setFilterAgentLevel] = useState('');
  const [filterAgentName, setFilterAgentName] = useState('');
  const [filterUsername, setFilterUsername] = useState('');
  const [filterDisplayName, setFilterDisplayName] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPaymentGroup, setFilterPaymentGroup] = useState('');
  const [filterCreatedFrom, setFilterCreatedFrom] = useState('');
  const [filterCreatedTo, setFilterCreatedTo] = useState('');
  const [filterLoginFrom, setFilterLoginFrom] = useState('');
  const [filterLoginTo, setFilterLoginTo] = useState('');
  const [filterCommissionSystem, setFilterCommissionSystem] = useState('');
  
  // 已套用的篩選條件（點擊查詢後才更新）
  const [appliedFilterAgentLevel, setAppliedFilterAgentLevel] = useState('');
  const [appliedFilterAgentName, setAppliedFilterAgentName] = useState('');
  const [appliedFilterUsername, setAppliedFilterUsername] = useState('');
  const [appliedFilterDisplayName, setAppliedFilterDisplayName] = useState('');
  const [appliedFilterStatus, setAppliedFilterStatus] = useState('');
  const [appliedFilterPaymentGroup, setAppliedFilterPaymentGroup] = useState('');
  const [appliedFilterCreatedFrom, setAppliedFilterCreatedFrom] = useState('');
  const [appliedFilterCreatedTo, setAppliedFilterCreatedTo] = useState('');
  const [appliedFilterLoginFrom, setAppliedFilterLoginFrom] = useState('');
  const [appliedFilterLoginTo, setAppliedFilterLoginTo] = useState('');
  const [appliedFilterCommissionSystem, setAppliedFilterCommissionSystem] = useState('');
  
  const isNavigatingRef = React.useRef(false); // 標記是否正在使用麵包屑導航
  
  // 分潤條件和金流群組選項 (不使用，僅用於未來擴展)
  // const commissionConditionsStore = useCommissionConditionsStore();
  // const [commissionConditions, setCommissionConditions] = useState<any[]>([]);

  // 權限檢查函數
  const canDeleteAgent = () => {
    return currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'GLOBAL_ADMIN';
  };

  const canCreateAgent = () => {
    return currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'GLOBAL_ADMIN';
  };

  useEffect(() => {
    loadData();
    // 暫時註解掉分潤條件載入，避免影響頁面載入速度
    // loadCommissionConditions();
  }, []);

  useEffect(() => {
    loadAgents();
  }, [selectedCompany]);

  // 載入分潤條件選項 (暫時註解，避免影響載入速度)
  // const loadCommissionConditions = async () => {
  //   try {
  //     await commissionConditionsStore.fetchList({ page: 1, limit: 100 });
  //     setCommissionConditions(commissionConditionsStore.items);
  //   } catch (e) {
  //     // 靜默失敗，不影響主要功能
  //     console.error('載入分潤條件失敗:', e);
  //   }
  // };

  // 快速日期設定
  const quickSetDate = (type: string, target: "created" | "login") => {
    const today = new Date();
    let fromDate = "";
    let toDate = "";

    switch (type) {
      case "today":
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0);
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59);
        fromDate = `${todayStart.getFullYear()}-${String(todayStart.getMonth() + 1).padStart(2, '0')}-${String(todayStart.getDate()).padStart(2, '0')}T${String(todayStart.getHours()).padStart(2, '0')}:${String(todayStart.getMinutes()).padStart(2, '0')}`;
        toDate = `${todayEnd.getFullYear()}-${String(todayEnd.getMonth() + 1).padStart(2, '0')}-${String(todayEnd.getDate()).padStart(2, '0')}T${String(todayEnd.getHours()).padStart(2, '0')}:${String(todayEnd.getMinutes()).padStart(2, '0')}`;
        break;
      case "yesterday":
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0);
        const yesterdayEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59);
        fromDate = `${yesterdayStart.getFullYear()}-${String(yesterdayStart.getMonth() + 1).padStart(2, '0')}-${String(yesterdayStart.getDate()).padStart(2, '0')}T${String(yesterdayStart.getHours()).padStart(2, '0')}:${String(yesterdayStart.getMinutes()).padStart(2, '0')}`;
        toDate = `${yesterdayEnd.getFullYear()}-${String(yesterdayEnd.getMonth() + 1).padStart(2, '0')}-${String(yesterdayEnd.getDate()).padStart(2, '0')}T${String(yesterdayEnd.getHours()).padStart(2, '0')}:${String(yesterdayEnd.getMinutes()).padStart(2, '0')}`;
        break;
      case "3days":
        const threeDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
        const threeDaysStart = new Date(threeDaysAgo.getFullYear(), threeDaysAgo.getMonth(), threeDaysAgo.getDate(), 0, 0);
        const todayEnd3 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59);
        fromDate = `${threeDaysStart.getFullYear()}-${String(threeDaysStart.getMonth() + 1).padStart(2, '0')}-${String(threeDaysStart.getDate()).padStart(2, '0')}T${String(threeDaysStart.getHours()).padStart(2, '0')}:${String(threeDaysStart.getMinutes()).padStart(2, '0')}`;
        toDate = `${todayEnd3.getFullYear()}-${String(todayEnd3.getMonth() + 1).padStart(2, '0')}-${String(todayEnd3.getDate()).padStart(2, '0')}T${String(todayEnd3.getHours()).padStart(2, '0')}:${String(todayEnd3.getMinutes()).padStart(2, '0')}`;
        break;
      case "thisMonth":
        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0);
        const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59);
        fromDate = `${thisMonthStart.getFullYear()}-${String(thisMonthStart.getMonth() + 1).padStart(2, '0')}-${String(thisMonthStart.getDate()).padStart(2, '0')}T${String(thisMonthStart.getHours()).padStart(2, '0')}:${String(thisMonthStart.getMinutes()).padStart(2, '0')}`;
        toDate = `${thisMonthEnd.getFullYear()}-${String(thisMonthEnd.getMonth() + 1).padStart(2, '0')}-${String(thisMonthEnd.getDate()).padStart(2, '0')}T${String(thisMonthEnd.getHours()).padStart(2, '0')}:${String(thisMonthEnd.getMinutes()).padStart(2, '0')}`;
        break;
      case "lastMonth":
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1, 0, 0);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59);
        fromDate = `${lastMonthStart.getFullYear()}-${String(lastMonthStart.getMonth() + 1).padStart(2, '0')}-${String(lastMonthStart.getDate()).padStart(2, '0')}T${String(lastMonthStart.getHours()).padStart(2, '0')}:${String(lastMonthStart.getMinutes()).padStart(2, '0')}`;
        toDate = `${lastMonthEnd.getFullYear()}-${String(lastMonthEnd.getMonth() + 1).padStart(2, '0')}-${String(lastMonthEnd.getDate()).padStart(2, '0')}T${String(lastMonthEnd.getHours()).padStart(2, '0')}:${String(lastMonthEnd.getMinutes()).padStart(2, '0')}`;
        break;
    }

    if (target === "created") {
      setFilterCreatedFrom(fromDate);
      setFilterCreatedTo(toDate);
    } else {
      setFilterLoginFrom(fromDate);
      setFilterLoginTo(toDate);
    }
  };

  // 執行查詢（套用篩選條件）
  const handleSearch = () => {
    setAppliedFilterAgentLevel(filterAgentLevel);
    setAppliedFilterAgentName(filterAgentName);
    setAppliedFilterUsername(filterUsername);
    setAppliedFilterDisplayName(filterDisplayName);
    setAppliedFilterStatus(filterStatus);
    setAppliedFilterPaymentGroup(filterPaymentGroup);
    setAppliedFilterCreatedFrom(filterCreatedFrom);
    setAppliedFilterCreatedTo(filterCreatedTo);
    setAppliedFilterLoginFrom(filterLoginFrom);
    setAppliedFilterLoginTo(filterLoginTo);
    setAppliedFilterCommissionSystem(filterCommissionSystem);
    
    // 如果有任何篩選條件，清除層級導航狀態
    const hasAnyFilter = filterAgentLevel || filterAgentName || filterUsername || 
      filterDisplayName || filterStatus || filterPaymentGroup || filterCommissionSystem ||
      filterCreatedFrom || filterCreatedTo || filterLoginFrom || filterLoginTo;
    
    if (hasAnyFilter) {
      // 清除層級導航，讓篩選可以搜尋所有代理
      setCurrentParentId(null);
      
      // 如果有代理級別篩選，更新麵包屑
      if (filterAgentLevel) {
        const level = parseInt(filterAgentLevel);
        setBreadcrumbs([{ 
          agentId: null, 
          agentName: `${level}級代理`, 
          level: level 
        }]);
      } else {
        // 其他篩選條件，麵包屑顯示「篩選結果」
        setBreadcrumbs([{ 
          agentId: null, 
          agentName: '篩選結果', 
          level: 0 
        }]);
      }
    }
    
    // 關閉篩選區域
    setIsFilterOpen(false);
  };

  // 清除篩選
  const clearFilter = () => {
    // 清除輸入欄位
    setFilterAgentLevel('');
    setFilterAgentName('');
    setFilterUsername('');
    setFilterDisplayName('');
    setFilterStatus('');
    setFilterPaymentGroup('');
    setFilterCreatedFrom('');
    setFilterCreatedTo('');
    setFilterLoginFrom('');
    setFilterLoginTo('');
    setFilterCommissionSystem('');
    
    // 清除已套用的篩選
    setAppliedFilterAgentLevel('');
    setAppliedFilterAgentName('');
    setAppliedFilterUsername('');
    setAppliedFilterDisplayName('');
    setAppliedFilterStatus('');
    setAppliedFilterPaymentGroup('');
    setAppliedFilterCreatedFrom('');
    setAppliedFilterCreatedTo('');
    setAppliedFilterLoginFrom('');
    setAppliedFilterLoginTo('');
    setAppliedFilterCommissionSystem('');
    
    // 重置麵包屑到初始狀態
    setBreadcrumbs([{ agentId: null, agentName: '1級代理', level: 1 }]);
    setCurrentParentId(null);
  };


  const loadData = async () => {
    try {
      const options = await fetchAgentOptions();
      setCompanies(options.companies);
      await loadAgents();
    } catch (e) {
      handleApiError(e, 'AgentList-loadData');
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    try {
      const data = await fetchAgents(selectedCompany || undefined);
      setAgents(data);
      // 數據更新後重新計算第2欄位置
      setTimeout(() => {
        const table = document.getElementById('agent-table-view');
        if (!table) return;
        const firstCol = table.querySelector('th:nth-child(1)') as HTMLElement;
        if (!firstCol) return;
        const firstColWidth = firstCol.offsetWidth;
        const secondHeaders = table.querySelectorAll('th:nth-child(2)');
        const secondCells = table.querySelectorAll('td:nth-child(2)');
        [...secondHeaders, ...secondCells].forEach((el: any) => {
          if (el) el.style.left = `${firstColWidth}px`;
        });
      }, 200);
    } catch (e) {
      handleApiError(e, 'AgentList-loadAgents');
    }
  };

  // 建立完整的麵包屑路徑（追溯到根節點）
  const buildBreadcrumbPath = (agent: Agent): BreadcrumbItem[] => {
    const path: BreadcrumbItem[] = [];
    let currentAgent: Agent | undefined = agent;
    
    // 從當前代理向上追溯到根節點
    while (currentAgent) {
      path.unshift({
        agentId: currentAgent.id,
        agentName: currentAgent.display_name || currentAgent.username,
        level: currentAgent.agent_level
      });
      
      // 查找父代理
      if (currentAgent.parent_agent_id) {
        currentAgent = agents.find(a => a.id === currentAgent!.parent_agent_id);
      } else {
        break;
      }
    }
    
    // 不要在最前面加上"1級代理"，直接返回完整路徑
    return path;
  };

  // 處理層級導航點擊
  const handleLevelClick = (agent: Agent) => {
    if (agent.next_level_count && agent.next_level_count > 0) {
      // 檢查是否有任何篩選條件被設置（使用已套用的篩選）
      const hasActiveFilters = appliedFilterAgentLevel || appliedFilterAgentName || appliedFilterUsername || 
        appliedFilterDisplayName || appliedFilterStatus || appliedFilterPaymentGroup || appliedFilterCommissionSystem ||
        appliedFilterCreatedFrom || appliedFilterCreatedTo || appliedFilterLoginFrom || appliedFilterLoginTo;
      
      if (hasActiveFilters) {
        // 如果有篩選條件，建立完整的父級路徑
        const fullPath = buildBreadcrumbPath(agent);
        // 添加下一層標籤（格式：第2代暗影 > 豐穎 > 蠍 > 4級代理）
        fullPath.push({
          agentId: agent.id,
          agentName: `${agent.agent_level + 1}級代理`,
          level: agent.agent_level + 1
        });
        setBreadcrumbs(fullPath);
      } else {
        // 如果沒有篩選條件，累加麵包屑
        // 移除最後一個「X級代理」項目（如果存在）
        let currentBreadcrumbs = [...breadcrumbs];
        if (currentBreadcrumbs.length > 0 && currentBreadcrumbs[currentBreadcrumbs.length - 1].agentName.includes('級代理')) {
          currentBreadcrumbs.pop();
        }
        
        // 添加當前代理和下一級
        const newBreadcrumbs = [
          ...currentBreadcrumbs,
          {
            agentId: agent.id,
            agentName: agent.display_name || agent.username,
            level: agent.agent_level
          },
          {
            agentId: agent.id,
            agentName: `${agent.agent_level + 1}級代理`,
            level: agent.agent_level + 1
          }
        ];
        setBreadcrumbs(newBreadcrumbs);
      }
      
      setCurrentParentId(agent.id);
    }
  };

  // 處理麵包屑點擊
  const handleBreadcrumbClick = (index: number) => {
    const clickedCrumb = breadcrumbs[index];
    
    // 設置導航標記，防止 useEffect 干擾
    isNavigatingRef.current = true;
    
    // 清除暫存的篩選條件
    setFilterAgentLevel('');
    setFilterAgentName('');
    setFilterUsername('');
    setFilterDisplayName('');
    setFilterStatus('');
    setFilterPaymentGroup('');
    setFilterCreatedFrom('');
    setFilterCreatedTo('');
    setFilterLoginFrom('');
    setFilterLoginTo('');
    setFilterCommissionSystem('');
    
    // 清除已套用的篩選條件（進入純層級導航模式）
    setAppliedFilterAgentLevel('');
    setAppliedFilterAgentName('');
    setAppliedFilterUsername('');
    setAppliedFilterDisplayName('');
    setAppliedFilterStatus('');
    setAppliedFilterPaymentGroup('');
    setAppliedFilterCreatedFrom('');
    setAppliedFilterCreatedTo('');
    setAppliedFilterLoginFrom('');
    setAppliedFilterLoginTo('');
    setAppliedFilterCommissionSystem('');
    
    // 如果點擊的是「X級代理」標籤
    if (clickedCrumb.agentName.includes('級代理')) {
      // 截斷到這個位置
      const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
      setBreadcrumbs(newBreadcrumbs);
      setCurrentParentId(clickedCrumb.agentId);
    } else {
      // 如果點擊的是代理名稱，需要顯示該代理所在層級的所有代理
      // 找到這個代理的父級
      const clickedAgent = agents.find(a => a.id === clickedCrumb.agentId);
      if (clickedAgent) {
        // 截斷麵包屑到該代理的前一項，並加上對應的「X級代理」標籤
        // 例如：點擊「豐穎」(2級) → 麵包屑變成「第2代暗影 > 2級代理」
        const newBreadcrumbs = breadcrumbs.slice(0, index); // 不包含當前點擊的代理
        newBreadcrumbs.push({
          agentId: clickedAgent.parent_agent_id || null,
          agentName: `${clickedAgent.agent_level}級代理`,
          level: clickedAgent.agent_level
        });
        setBreadcrumbs(newBreadcrumbs);
        // 設置 parentId 為該代理的父級，這樣會顯示同層級的所有代理
        setCurrentParentId(clickedAgent.parent_agent_id || null);
      }
    }
    
    // 延遲重置導航標記，確保所有狀態更新完成
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 100);
  };

  // 過濾代理商：只顯示當前層級的代理商 + 套用篩選條件
  const getFilteredAgents = () => {
    let filtered = agents;
    
    // 檢查是否有任何篩選條件被設置（使用已套用的篩選）
    const hasActiveFilters = appliedFilterAgentLevel || appliedFilterAgentName || appliedFilterUsername || 
      appliedFilterDisplayName || appliedFilterStatus || appliedFilterPaymentGroup || appliedFilterCommissionSystem ||
      appliedFilterCreatedFrom || appliedFilterCreatedTo || appliedFilterLoginFrom || appliedFilterLoginTo;
    
    // 優先處理層級導航（當 currentParentId 被設置時）
    if (currentParentId !== null) {
      // 如果已經點擊進入某個代理的下一層，顯示該代理的子代理
      filtered = agents.filter(agent => agent.parent_agent_id === currentParentId);
    } else if (!hasActiveFilters) {
      // 如果沒有篩選條件且在根層級，顯示第一級代理
      filtered = agents.filter(agent => !agent.parent_agent_id);
    }
    // 如果有篩選條件且 currentParentId 為 null，則顯示所有符合條件的代理

    // 套用篩選條件（只在沒有進入層級導航時，使用已套用的篩選）
    if (currentParentId === null) {
      if (appliedFilterAgentLevel) {
        filtered = filtered.filter(agent => agent.agent_level === parseInt(appliedFilterAgentLevel));
      }
      if (appliedFilterAgentName) {
        filtered = filtered.filter(agent => 
          agent.agent_name?.toLowerCase().includes(appliedFilterAgentName.toLowerCase())
        );
      }
      if (appliedFilterUsername) {
        filtered = filtered.filter(agent => 
          agent.username?.toLowerCase().includes(appliedFilterUsername.toLowerCase())
        );
      }
      if (appliedFilterDisplayName) {
        filtered = filtered.filter(agent => {
          // 搜尋 agent_name, display_name 和 username 三個欄位
          const agentName = (agent.agent_name || '').toLowerCase();
          const displayName = (agent.display_name || '').toLowerCase();
          const username = (agent.username || '').toLowerCase();
          const searchTerm = appliedFilterDisplayName.toLowerCase();
          return agentName.includes(searchTerm) || 
                 displayName.includes(searchTerm) || 
                 username.includes(searchTerm);
        });
      }
      if (appliedFilterStatus) {
        filtered = filtered.filter(agent => agent.status === appliedFilterStatus);
      }
      if (appliedFilterPaymentGroup) {
        filtered = filtered.filter(agent => agent.default_payment_group === appliedFilterPaymentGroup);
      }
      if (appliedFilterCommissionSystem) {
        filtered = filtered.filter(agent => 
          agent.commission_condition?.systemType === appliedFilterCommissionSystem
        );
      }
      if (appliedFilterCreatedFrom) {
        const fromDate = new Date(appliedFilterCreatedFrom);
        filtered = filtered.filter(agent => new Date(agent.created_at) >= fromDate);
      }
      if (appliedFilterCreatedTo) {
        const toDate = new Date(appliedFilterCreatedTo);
        filtered = filtered.filter(agent => new Date(agent.created_at) <= toDate);
      }
      if (appliedFilterLoginFrom) {
        const fromDate = new Date(appliedFilterLoginFrom);
        filtered = filtered.filter(agent => 
          agent.last_login_at && new Date(agent.last_login_at) >= fromDate
        );
      }
      if (appliedFilterLoginTo) {
        const toDate = new Date(appliedFilterLoginTo);
        filtered = filtered.filter(agent => 
          agent.last_login_at && new Date(agent.last_login_at) <= toDate
        );
      }
    }

    return filtered;
  };

  // 建立代理商樹狀結構
  const buildAgentTree = (flatAgents: Agent[]): Agent[] => {
    const agentMap = new Map<number, Agent>();
    const rootAgents: Agent[] = [];

    // 先建立所有代理商的映射，並設定父級資訊
    flatAgents.forEach(agent => {
      const agentWithParentInfo = { 
        ...agent, 
        children: [],
        parentAgent: agent.parent_agent_id 
          ? flatAgents.find(a => a.id === agent.parent_agent_id)
            ? {
                id: agent.parent_agent_id,
                agent_name: flatAgents.find(a => a.id === agent.parent_agent_id)!.agent_name,
                username: flatAgents.find(a => a.id === agent.parent_agent_id)!.username
              }
            : undefined
          : undefined
      };
      agentMap.set(agent.id, agentWithParentInfo);
    });

    // 建立父子關係
    flatAgents.forEach(agent => {
      const agentItem = agentMap.get(agent.id)!;
      if (agent.parent_agent_id) {
        const parent = agentMap.get(agent.parent_agent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(agentItem);
        } else {
          // 如果找不到父級，放到根層級但標示為有父級
          rootAgents.push(agentItem);
        }
      } else {
        rootAgents.push(agentItem);
      }
    });

    // 排序
    const sortAgents = (agents: Agent[]) => {
      agents.sort((a, b) => a.agent_level - b.agent_level || a.id - b.id);
      agents.forEach(agent => {
        if (agent.children && agent.children.length > 0) {
          sortAgents(agent.children);
        }
      });
    };

    sortAgents(rootAgents);
    return rootAgents;
  };


  // 刪除代理商
  const handleDelete = async (id: number, agentName: string) => {
    if (!confirm(`確定要刪除代理商「${agentName}」嗎？此操作無法復原。`)) return;

    try {
      await deleteAgent(id);
      alert('代理商刪除成功！');
      await loadAgents(); // 重新載入
    } catch (error) {
      handleApiError(error, 'AgentList-delete');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 渲染樹狀視圖的代理商項目
  const renderAgentItemTree = (agent: Agent, level: number = 0) => {
    const rows = [];
    
    
    // 主項目行
    rows.push(
      <tr key={agent.id} className={`agent-level-${Math.min(level + 1, 4)}`}>
        <td className={level > 0 ? `agent-indent-${Math.min(level, 12)}` : ''}>
          <div className="agent-title">
            {level > 0 && <span className="agent-level-indicator"></span>}
            <span style={{color: level > 0 ? '#ef4444' : '#000'}}>
              [層級:{level + 1}]
            </span>
            <span className="agent-name">{agent.display_name || agent.username}</span>
            <span className="agent-account">@{agent.username}</span>
            {agent.parent_agent_id && (
              <span className="parent-info">
                ↑ 父級ID:{agent.parent_agent_id}
              </span>
            )}
          </div>
        </td>
        <td>
          <span className={`level-badge level-${agent.agent_level}`}>Level {agent.agent_level}</span>
        </td>
        <td>{agent.company.name} ({agent.company.code})</td>
        <td>
          <div className="contact-info">
            {agent.phone && <div>{agent.phone}</div>}
            {agent.email && <div>{agent.email}</div>}
            {agent.telegram && <div>{agent.telegram}</div>}
            {agent.line && <div>{agent.line}</div>}
          </div>
        </td>
        <td>
          <span className={`status-badge status-${agent.status.toLowerCase()}`}>
            {['active', 'ACTIVE'].includes(agent.status) ? '啟用' : 
             ['inactive', 'INACTIVE'].includes(agent.status) ? '停用' : '待審核'}
          </span>
        </td>
        <td style={{ fontSize: '12px', color: '#6b7280' }}>
          {formatDate(agent.created_at)}
        </td>
        <td>
          <div className="action-buttons">
            {/* 如果是當前用戶自己，則不顯示操作按鈕 */}
            {currentUser?.id !== agent.id ? (
              <>
                <button
                  onClick={() => router.push(`/admin/agents/edit/${agent.id}`)}
                  className="btn-edit"
                  title={canDeleteAgent() ? "編輯代理商" : "編輯聯絡資訊"}
                >
                  編輯
                </button>
                {canDeleteAgent() && (
                  <button
                    onClick={() => handleDelete(agent.id, agent.display_name || agent.username)}
                    className="btn-delete"
                    title="刪除代理商（僅超級管理員和全域管理員）"
                  >
                    刪除
                  </button>
                )}
              </>
            ) : (
              <span className="self-indicator" style={{ color: '#999', fontSize: '14px' }}>
                —
              </span>
            )}
          </div>
        </td>
      </tr>
    );
    
    // 遞歸渲染子代理商
    if (agent.children && agent.children.length > 0) {
      // 按照代理商等級排序子代理商
      const sortedChildren = [...agent.children].sort((a, b) => a.agent_level - b.agent_level || a.id - b.id);
      
      sortedChildren.forEach(child => {
        rows.push(...renderAgentItemTree(child, level + 1));
      });
    }
    
    return rows;
  };

  // 渲染表格視圖的代理商項目（扁平化顯示）
  const renderAgentItemTable = (agent: Agent) => {
    return (
      <tr key={agent.id}>
        {/* 1. 代理級別 */}
        <td className="sticky-col-1">
          {agent.next_level_count && agent.next_level_count > 0 ? (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleLevelClick(agent);
              }}
              style={{
                color: '#2563eb',
                textDecoration: 'none',
                cursor: 'pointer',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              {agent.agent_level}/{agent.max_agent_level || 0}({agent.next_level_count})
            </a>
          ) : (
            <span style={{ fontWeight: '500', color: '#6b7280' }}>
              {agent.agent_level}/{agent.max_agent_level || 0}({agent.next_level_count || 0})
            </span>
          )}
        </td>
        
        {/* 2. 代理名稱 */}
        <td className="sticky-col-2">
          <div>
            <div style={{ fontWeight: '500', color: '#333' }}>{agent.display_name || agent.username}</div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
              {agent.commission_condition?.name || '未設定方案'}
            </div>
          </div>
        </td>
        
        {/* 3. 會員數量 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div>{agent.member_count || 0}</div>
        </td>
        
        {/* 4. 代理帳號 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div>{agent.username}</div>
        </td>
        
        {/* 5. 代理姓名 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div>{agent.agent_name || '-'}</div>
        </td>
        
        {/* 6. 帳號狀態 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <span className={`status-badge status-${agent.status.toLowerCase()}`}>
            {['active', 'ACTIVE'].includes(agent.status) ? '啟用' : 
             ['inactive', 'INACTIVE'].includes(agent.status) ? '停用' : '待審核'}
          </span>
        </td>
        
        {/* 7. 金流群組 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div>{agent.default_payment_group ? 
            (agent.default_payment_group === 'regular' ? '常規會員' :
             agent.default_payment_group === 'old_member' ? '老會員' :
             agent.default_payment_group === 'credit_agent' ? '信用代理' :
             agent.default_payment_group === 'usdt_channel' ? 'USDT通道' :
             agent.default_payment_group) : '-'}</div>
        </td>
        
        {/* 8. 註冊/登入時間 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div style={{ fontSize: '11px' }}>
            <div>註冊: {new Date(agent.created_at).toLocaleString('zh-TW', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            })}</div>
            <div style={{ color: '#999' }}>登入: {agent.last_login_at ? new Date(agent.last_login_at).toLocaleString('zh-TW', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            }) : '未登入'}</div>
          </div>
        </td>
        
        {/* 9. 分潤制度 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div>{agent.commission_condition?.systemType ? 
            (agent.commission_condition.systemType === 'COMMISSION' ? '占成制' :
             agent.commission_condition.systemType === 'REBATE' ? '返水制' :
             agent.commission_condition.systemType) : '-'}</div>
        </td>
        
        {/* 10. 分潤比例(%) */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div>{agent.commission_condition?.commissionPercent ? 
            `${agent.commission_condition.commissionPercent}%` : '-'}</div>
        </td>
        
        {/* 11. 真人 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div>{agent.commission_condition?.gameRebateRates?.['live'] ? 
            `${agent.commission_condition.gameRebateRates['live']}%` : '-'}</div>
        </td>
        
        {/* 12. 電子 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div>{agent.commission_condition?.gameRebateRates?.['slot'] ? 
            `${agent.commission_condition.gameRebateRates['slot']}%` : '-'}</div>
        </td>
        
        {/* 13. 體育 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div>{agent.commission_condition?.gameRebateRates?.['sport'] ? 
            `${agent.commission_condition.gameRebateRates['sport']}%` : '-'}</div>
        </td>
        
        {/* 14. 彩票 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div>{agent.commission_condition?.gameRebateRates?.['lottery'] ? 
            `${agent.commission_condition.gameRebateRates['lottery']}%` : '-'}</div>
        </td>
        
        {/* 15. 棋牌 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div>{agent.commission_condition?.gameRebateRates?.['card'] ? 
            `${agent.commission_condition.gameRebateRates['card']}%` : '-'}</div>
        </td>
        
        {/* 16. 捕魚 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div>{agent.commission_condition?.gameRebateRates?.['fishing'] ? 
            `${agent.commission_condition.gameRebateRates['fishing']}%` : '-'}</div>
        </td>
        
        {/* 17. 代理分潤結算 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div>{agent.default_rebate_settlement ? 
            (agent.default_rebate_settlement === 'daily' ? '日結' :
             agent.default_rebate_settlement === 'weekly' ? '週結' :
             agent.default_rebate_settlement) : '-'}</div>
        </td>
        
        {/* 18. 管理 */}
        <td style={{ whiteSpace: 'nowrap' }}>
          <div className="action-buttons" style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
            {currentUser?.id !== agent.id ? (
              <>
                <button
                  onClick={() => router.push(`/admin/agents/edit/${agent.id}`)}
                  className="btn-edit"
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                  title={canDeleteAgent() ? "編輯代理商" : "編輯聯絡資訊"}
                >
                  編輯
                </button>
                {canDeleteAgent() && (
                  <button
                    onClick={() => handleDelete(agent.id, agent.display_name || agent.username)}
                    className="btn-delete"
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                    title="刪除代理商（僅超級管理員和全域管理員）"
                  >
                    刪除
                  </button>
                )}
              </>
            ) : (
              <span style={{ color: '#999', fontSize: '12px' }}>—</span>
            )}
          </div>
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div>載入中...</div>
      </div>
    );
  }

  return (
    <div className="content-section">
      {/* 篩選條件區域 */}
      <div className="filter-section">
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)} 
          className="filter-toggle"
        >
          🔍 篩選條件
          <span className={`filter-arrow ${isFilterOpen ? "rotate" : ""}`}>▼</span>
        </button>

        {isFilterOpen && (
          <div className="filter-content">
            <div className="filter-grid">
              {/* 1. 代理級別 */}
              <div className="form-group">
                <label htmlFor="agent-level-select" className="form-label">代理級別</label>
                <select 
                  id="agent-level-select"
                  value={filterAgentLevel} 
                  onChange={(e) => setFilterAgentLevel(e.target.value)} 
                  className="form-select"
                >
                  <option value="">請選擇</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(level => (
                    <option key={level} value={level}>{level}級{level === 1 ? '總' : ''}代理</option>
                  ))}
                </select>
              </div>

              {/* 2. 代理名稱 */}
              <div className="form-group">
                <label htmlFor="agent-name-search" className="form-label">代理名稱</label>
                <input 
                  type="text" 
                  id="agent-name-search"
                  placeholder="請輸入代理名稱" 
                  value={filterAgentName} 
                  onChange={(e) => setFilterAgentName(e.target.value)} 
                  className="form-input" 
                />
              </div>

              {/* 3. 代理帳號 */}
              <div className="form-group">
                <label htmlFor="username-search" className="form-label">代理帳號</label>
                <input 
                  type="text" 
                  id="username-search"
                  placeholder="請輸入代理帳號" 
                  value={filterUsername} 
                  onChange={(e) => setFilterUsername(e.target.value)} 
                  className="form-input" 
                />
              </div>

              {/* 4. 代理姓名 */}
              <div className="form-group">
                <label htmlFor="display-name-search" className="form-label">代理姓名</label>
                <input 
                  type="text" 
                  id="display-name-search"
                  placeholder="請輸入代理姓名" 
                  value={filterDisplayName} 
                  onChange={(e) => setFilterDisplayName(e.target.value)} 
                  className="form-input" 
                />
              </div>

              {/* 5. 帳號狀態 */}
              <div className="form-group">
                <label htmlFor="status-select" className="form-label">帳號狀態</label>
                <select 
                  id="status-select" 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)} 
                  className="form-select"
                >
                  <option value="">全部</option>
                  <option value="ACTIVE">✅ 啟用</option>
                  <option value="INACTIVE">⏸️ 停用</option>
                </select>
              </div>

              {/* 6. 金流群組 */}
              <div className="form-group">
                <label htmlFor="payment-group-select" className="form-label">金流群組</label>
                <select 
                  id="payment-group-select" 
                  value={filterPaymentGroup} 
                  onChange={(e) => setFilterPaymentGroup(e.target.value)} 
                  className="form-select"
                >
                  <option value="">全部</option>
                  <option value="regular">常規會員</option>
                  <option value="old_member">老會員</option>
                  <option value="credit_agent">信用代理</option>
                  <option value="usdt_channel">USDT通道</option>
                </select>
              </div>

              {/* 9. 分潤制度 */}
              <div className="form-group">
                <label htmlFor="commission-system-select" className="form-label">分潤制度</label>
                <select 
                  id="commission-system-select" 
                  value={filterCommissionSystem} 
                  onChange={(e) => setFilterCommissionSystem(e.target.value)} 
                  className="form-select"
                >
                  <option value="">全部</option>
                  <option value="COMMISSION">占成制</option>
                  <option value="REBATE">返水制</option>
                </select>
              </div>
            </div>

            {/* 7. 註冊時間 */}
            <div className="filter-row">
              <div className="form-group date-range-group">
                <label htmlFor="created-date-from" className="form-label">註冊時間範圍</label>
                <div className="date-inputs">
                  <DateTimePicker
                    id="created-date-from"
                    value={filterCreatedFrom} 
                    onChange={(value) => setFilterCreatedFrom(value)} 
                    className="form-input" 
                    placeholder="選擇開始時間"
                  />
                  <span className="date-separator">至</span>
                  <DateTimePicker
                    value={filterCreatedTo} 
                    onChange={(value) => setFilterCreatedTo(value)} 
                    className="form-input" 
                    placeholder="選擇結束時間"
                  />
                </div>
                <div className="quick-date-buttons">
                  <button onClick={() => quickSetDate("today", "created")} className="btn-quick-date">今日</button>
                  <button onClick={() => quickSetDate("yesterday", "created")} className="btn-quick-date">昨日</button>
                  <button onClick={() => quickSetDate("3days", "created")} className="btn-quick-date">近三日</button>
                  <button onClick={() => quickSetDate("thisMonth", "created")} className="btn-quick-date">本月</button>
                  <button onClick={() => quickSetDate("lastMonth", "created")} className="btn-quick-date">上月</button>
                </div>
              </div>

              {/* 8. 最後登入時間 */}
              <div className="form-group date-range-group">
                <label htmlFor="login-date-from" className="form-label">最後登入時間</label>
                <div className="date-inputs">
                  <DateTimePicker
                    id="login-date-from"
                    value={filterLoginFrom} 
                    onChange={(value) => setFilterLoginFrom(value)} 
                    className="form-input" 
                    placeholder="選擇開始時間"
                  />
                  <span className="date-separator">至</span>
                  <DateTimePicker
                    value={filterLoginTo} 
                    onChange={(value) => setFilterLoginTo(value)} 
                    className="form-input" 
                    placeholder="選擇結束時間"
                  />
                </div>
                <div className="quick-date-buttons">
                  <button onClick={() => quickSetDate("today", "login")} className="btn-quick-date">今日</button>
                  <button onClick={() => quickSetDate("yesterday", "login")} className="btn-quick-date">昨日</button>
                  <button onClick={() => quickSetDate("3days", "login")} className="btn-quick-date">近三日</button>
                  <button onClick={() => quickSetDate("thisMonth", "login")} className="btn-quick-date">本月</button>
                  <button onClick={() => quickSetDate("lastMonth", "login")} className="btn-quick-date">上月</button>
                </div>
              </div>
            </div>

            {/* 10. 查詢和清除按鈕 */}
            <div className="filter-actions">
              <button onClick={handleSearch} className="btn-search">🔍 查詢</button>
              <button onClick={clearFilter} className="btn-clear">🗑️ 清除</button>
            </div>
          </div>
        )}
      </div>

      {/* 麵包屑導航 - 只在表格視圖顯示 */}
      {viewMode === 'table' && (
        <div style={{
          padding: '12px 16px',
          background: '#f9fafb',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px'
        }}>
          <span style={{ fontWeight: '600', color: '#6b7280' }}>當前位置:</span>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span style={{ color: '#9ca3af' }}>&gt;</span>}
              {index === breadcrumbs.length - 1 ? (
                // 最後一個麵包屑 - 黑色文字，不可點擊
                <span style={{ fontWeight: '600', color: '#111827' }}>
                  {crumb.agentName}
                </span>
              ) : (
                // 其他麵包屑 - 藍色連結，可點擊
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleBreadcrumbClick(index);
                  }}
                  style={{
                    color: '#2563eb',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  {crumb.agentName}
                </a>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
      
      {/* 表格控制區域 */}
      <div className="table-controls">
        <div className="result-info">
          共找到 {viewMode === 'table' ? getFilteredAgents().length : agents.length} 位代理商
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* 視圖模式切換按鈕 */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setViewMode('tree')}
              className={viewMode === 'tree' ? 'btn-view-active' : 'btn-view'}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: viewMode === 'tree' ? '2px solid #667eea' : '1px solid #ddd',
                background: viewMode === 'tree' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                color: viewMode === 'tree' ? 'white' : '#333',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
              title="樹狀視圖 - 顯示代理商層級關係"
            >
              樹狀
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={viewMode === 'table' ? 'btn-view-active' : 'btn-view'}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: viewMode === 'table' ? '2px solid #667eea' : '1px solid #ddd',
                background: viewMode === 'table' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                color: viewMode === 'table' ? 'white' : '#333',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
              title="表格視圖 - 以列表方式顯示所有代理商"
            >
              表格
            </button>
          </div>
          <div className="company-selector" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="companyFilter" style={{ fontWeight: '600', color: '#374151', fontSize: '14px' }}>篩選公司</label>
            <select 
              id="companyFilter"
              value={selectedCompany} 
              onChange={e => setSelectedCompany(Number(e.target.value))}
              className="form-select"
              style={{ padding: '8px 12px' }}
            >
              <option value={0}>所有公司</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 代理商列表 */}
      {agents.length === 0 ? (
        <div className="no-data">
          <div className="no-data-content">
            <div className="no-data-icon">👥</div>
            <div>尚未建立任何代理商</div>
            {canCreateAgent() && (
              <div className="no-data-hint">請點擊「新增代理商」開始建立</div>
            )}
          </div>
        </div>
      ) : (
        <div className="table-wrapper" style={{ position: 'relative', overflow: 'auto' }}>
          {viewMode === 'tree' ? (
            // 樹狀視圖
            <table className="data-table">
              <thead>
                <tr>
                  <th>代理商資訊</th>
                  <th>層級</th>
                  <th>所屬公司</th>
                  <th>聯絡方式</th>
                  <th>狀態</th>
                  <th>建立時間</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {buildAgentTree(agents).map(agent => renderAgentItemTree(agent)).flat()}
              </tbody>
            </table>
          ) : (
            // 表格視圖
            <table className="data-table" style={{ fontSize: '12px', position: 'relative' }} id="agent-table-view">
              <thead>
                <tr>
                  <th className="sticky-col-1">代理級別</th>
                  <th className="sticky-col-2">代理名稱</th>
                  <th>會員數量</th>
                  <th>代理帳號</th>
                  <th>代理姓名</th>
                  <th>帳號狀態</th>
                  <th>金流群組</th>
                  <th>註冊/登入時間</th>
                  <th>分潤制度</th>
                  <th>分潤比例(%)</th>
                  <th>真人</th>
                  <th>電子</th>
                  <th>體育</th>
                  <th>彩票</th>
                  <th>棋牌</th>
                  <th>捕魚</th>
                  <th>代理分潤結算</th>
                  <th>管理</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredAgents()
                  .sort((a, b) => a.agent_level - b.agent_level || a.id - b.id)
                  .map(agent => renderAgentItemTable(agent))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}