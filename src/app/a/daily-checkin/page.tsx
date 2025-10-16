"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useUserStore } from "@/hooks/use-user-store";
import { apiClient } from "@/lib/api/apiClient";
import { useDebounce } from "@/hooks/use-debounce";
import { handleApiError } from "@/lib/errorHandler";
import "./daily-checkin.css";

interface CheckinStatus {
  can_checkin: boolean;
  consecutive_days: number;
  total_checkins: number;
  last_checkin_date: Date | null;
  today_checked: boolean;
  activity_title?: string;
  activity_type?: string;
  next_reward?: {
    day_number: number;
    reward_type: string;
    reward_value: number;
    reward_description: string;
  };
  checkin_configs: Array<{
    day_number: number;
    reward_type: string;
    reward_value: number;
    reward_description: string;
    is_completed: boolean;
  }>;
}

export default function DailyCheckinPage() {
  const [status, setStatus] = useState<CheckinStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [rewardData, setRewardData] = useState<any>(null);
  const [pageState, setPageState] = useState<'loading' | 'no-activity' | 'ready'>('loading');
  const initializationRef = useRef(false);
  const userIdRef = useRef<number | null>(null);
  const rewardTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useUserStore();
  const [activityId, setActivityId] = useState<number | null>(null);


  // 重複登入檢查
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('portalToken_a')
      if (!token && !user) {
        window.location.href = '/a/duplicate-login'
        return
      }
    }
  }, [user])

  const loadAvailableActivity = useCallback(async (isMounted = true) => {
    try {
      if (!isMounted) return;
      setPageState('loading');
      
      const data = await apiClient.dailyCheckin.getAvailableActivities();
      if (!isMounted) return; // 避免在組件卸載後設置狀態
      
      if (data.data && data.data.length > 0) {
        // 使用第一個啟用的活動，保持loading狀態直到所有數據載入完成
        const firstActivity = data.data[0];
        setActivityId(firstActivity.id);
        // 保持 loading 狀態，等 loadStatus 完成後再設置為 ready
      } else {
        // 沒有啟用的簽到活動，這是正常情況
        setStatus(null);
        setPageState('no-activity');
      }
    } catch (error) {
      handleApiError(error, 'loadAvailableActivity', {
        showAlert: false, // 不顯示彈窗，只設置頁面狀態
        fallbackMessage: '載入簽到活動失敗'
      });
      setPageState('no-activity');
    }
  }, []); // 移除對 initialized 的依賴

  const loadStatus = useCallback(async (isMounted = true) => {
    try {
      if (!isMounted) return;
      const userId = user?.id || user?.userId;
      if (!userId || !activityId) {
        handleApiError(
          new Error('缺少用戶ID或活動ID'), 
          'loadStatus', 
          { 
            showAlert: false,
            fallbackMessage: '載入簽到狀態失敗：缺少必要參數'
          }
        );
        return;
      }
      
      // 使用新的合併 API，一次性獲取狀態和獎勵配置
      const data = await apiClient.dailyCheckin.getUserStatusWithRewards(activityId, userId);
      
      if (!isMounted) return; // 避免在組件卸載後設置狀態
      
      // 轉換新系統的回應格式為舊格式，保持相容性
      const convertedData = {
        can_checkin: data.can_checkin,
        consecutive_days: data.consecutive_days,
        total_checkins: data.total_checkins,
        last_checkin_date: data.last_checkin_date,
        today_checked: data.today_checked,
        activity_title: data.activity_title,
        activity_type: data.activity_type,
        next_reward: data.next_reward,
        checkin_configs: data.checkin_configs || [] // 直接從合併 API 獲取獎勵配置
      };
      setStatus(convertedData);
      
      // 不再需要額外調用 loadActivityRewards，直接設置為 ready
      setPageState('ready');
    } catch (error) {
      handleApiError(error, 'loadStatus', {
        showAlert: false, // 不顯示彈窗，只設置頁面狀態
        fallbackMessage: '載入簽到狀態失敗'
      });
      setPageState('no-activity'); // 失敗時顯示無活動狀態
    }
  }, [activityId, user?.id]); // 依賴 activityId 和 user.id


  // 原始簽到函數
  const performCheckin = useCallback(async () => {
    const userId = user?.id || user?.userId;
    if (!status?.can_checkin || isChecking || !userId || !activityId) return;

    setIsChecking(true);
    try {
      const result = await apiClient.dailyCheckin.performCheckin(activityId, userId);
      if (result.success) {
        // 轉換新系統回應格式為舊格式
        const convertedReward = {
          reward_type: result.data.reward?.rewardType?.toLowerCase() || 'cash',
          reward_value: result.data.reward?.amount || 0,
          reward_description: `第${result.data.dayIndex || result.data.totalChecked}天簽到獎勵`,
          consecutive_days: result.data.currentStreak || result.data.totalChecked || 1
        };
        setRewardData(convertedReward);
        setShowReward(true);
        // 清理之前的 timer
        if (rewardTimerRef.current) {
          clearTimeout(rewardTimerRef.current);
        }
        // 延遲重新載入狀態，讓用戶看到獎勵動畫
        rewardTimerRef.current = setTimeout(() => {
          loadStatus(); // 現在 loadStatus 會使用合併的 API
          setShowReward(false);
          rewardTimerRef.current = null; // 清理 ref
        }, 3000);
      } else {
        // 使用統一錯誤處理，但自定義訊息
        handleApiError(
          new Error(result.message || '簽到失敗'), 
          'performCheckin', 
          { 
            showAlert: true,
            fallbackMessage: '簽到失敗，請重試'
          }
        );
      }
    } catch (error) {
      handleApiError(error, 'performCheckin', {
        showAlert: true,
        fallbackMessage: '簽到失敗，請重試'
      });
    } finally {
      setIsChecking(false);
    }
  }, [status?.can_checkin, isChecking, user?.id, user?.userId, activityId, loadStatus]);

  // 添加防抖保護的簽到函數 (300ms 防抖)
  const handleCheckin = useDebounce(performCheckin, 300);

  // 添加防抖保護的重新檢查函數 (500ms 防抖)
  const handleRefresh = useDebounce(() => loadAvailableActivity(), 500);

  // 統一的初始化狀態管理
  useEffect(() => {
    let isMounted = true;
    
    // 支援兩種用戶ID格式：帳號登入使用 user.id，Facebook 登入使用 user.userId
    const currentUserId = user?.id || user?.userId;
    
    // 狀態重置：如果沒有用戶
    if (!user) {
      setPageState('loading');
      setStatus(null);
      setActivityId(null);
      initializationRef.current = false;
      userIdRef.current = null;
      return;
    }
    
    // 如果有用戶但沒有用戶ID
    if (!currentUserId) {
      setPageState('no-activity');
      return;
    }
    
    // 用戶變更時重新初始化
    if (currentUserId !== userIdRef.current) {
      userIdRef.current = currentUserId;
      initializationRef.current = false;
      setActivityId(null);
      setStatus(null);
      loadAvailableActivity(isMounted);
    }
    
    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.userId, user, loadAvailableActivity]);

  // 當有活動ID和用戶時載入狀態
  useEffect(() => {
    let isMounted = true;
    
    if (user && activityId && !initializationRef.current) {
      initializationRef.current = true;
      loadStatus(isMounted);
    }
    
    return () => {
      isMounted = false;
    };
  }, [user, activityId, loadStatus]);

  // 組件卸載時清理所有 timer
  useEffect(() => {
    return () => {
      // 清理獎勵顯示 timer
      if (rewardTimerRef.current) {
        clearTimeout(rewardTimerRef.current);
        rewardTimerRef.current = null;
      }
      // 清理防抖函數的 timer
      if (handleCheckin && typeof (handleCheckin as any).cancel === 'function') {
        (handleCheckin as any).cancel();
      }
      if (handleRefresh && typeof (handleRefresh as any).cancel === 'function') {
        (handleRefresh as any).cancel();
      }
    };
  }, []); // 空依賴，只在組件卸載時執行

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'points': return '💰';
      case 'cash': return '💵';
      case 'coupon': return '🎫';
      default: return '🎁';
    }
  };

  const getRewardText = (type: string) => {
    switch (type) {
      case 'points': return '點數';
      case 'cash': return '現金';
      case 'coupon': return '優惠券';
      default: return '獎勵';
    }
  };

  // 根據活動類型獲取顯示文字
  const getActivityDisplayInfo = (activityType?: string, activityTitle?: string) => {
    const defaultTitle = activityTitle || '簽到活動';
    
    switch (activityType) {
      case 'STRICT_STREAK_7':
        return {
          title: activityTitle || '連續簽到',
          subtitle: '連續簽到不中斷，漏簽重新開始',
          streakLabel: '連續天數'
        };
      case 'FLEX_CUMULATIVE':
        return {
          title: activityTitle || '累積簽到',
          subtitle: '活動期間累積簽到，不需連續',
          streakLabel: '累積天數'
        };
      case 'DAILY_CALENDAR':
        return {
          title: activityTitle || '每日簽到',
          subtitle: '每天簽到領取豐富獎勵',
          streakLabel: '簽到天數'
        };
      default:
        return {
          title: defaultTitle,
          subtitle: '每天簽到領取豐富獎勵',
          streakLabel: '簽到天數'
        };
    }
  };

  // 使用 useMemo 來穩定化渲染內容
  const renderContent = useMemo(() => {
    // 如果沒有用戶，顯示登入提示
    if (!user) {
      return (
        <div className="checkin-container">
          <div className="checkin-card">
            <div className="login-prompt">
              <h2>請先登入</h2>
              <p>登入後即可參與每日簽到活動</p>
              <a href="/a/login" className="login-btn">前往登入</a>
            </div>
          </div>
        </div>
      );
    }

    // 統一的狀態渲染控制
    if (pageState === 'loading') {
      return (
      <div className="checkin-container">
        <div className="checkin-card">
          <div className="loading-state">
            <div className="loading-spinner">⏳</div>
            <h2>載入簽到活動中...</h2>
            <p>請稍候片刻</p>
          </div>
        </div>
      </div>
      );
    }

    if (pageState === 'no-activity') {
      return (
      <div className="checkin-container">
        <div className="checkin-card">
          <div className="no-activity-state">
            <div className="no-activity-icon">📅</div>
            <h2>暫無簽到活動</h2>
            <p>目前沒有進行中的簽到活動</p>
            <div className="no-activity-tips">
              <p>💡 簽到活動將會不定期舉辦，請持續關注！</p>
              <p>🎁 參與簽到活動可獲得豐富獎勵</p>
            </div>
            <button 
              className="refresh-btn"
              onClick={handleRefresh}
            >
              🔄 重新檢查
            </button>
          </div>
        </div>
      </div>
      );
    }

    // 只有在 pageState === 'ready' 且有 status 時才顯示主要內容
    if (pageState !== 'ready' || !status) {
      return (
      <div className="checkin-container">
        <div className="checkin-card">
          <div className="loading-state">
            <div className="loading-spinner">⏳</div>
            <h2>載入簽到狀態中...</h2>
            <p>正在取得您的簽到資訊</p>
          </div>
        </div>
      </div>
      );
    }

    return (
    <div className="checkin-container">
      {/* 獎勵彈窗 */}
      {showReward && rewardData && (
        <div className="reward-modal">
          <div className="reward-content">
            <div className="reward-icon">🎉</div>
            <h2>簽到成功！</h2>
            <div className="reward-info">
              <div className="reward-type-icon">
                {getRewardIcon(rewardData.reward_type)}
              </div>
              <div className="reward-text">
                獲得 {getRewardText(rewardData.reward_type)} {rewardData.reward_value}
              </div>
            </div>
            <div className="reward-description">
              {rewardData.reward_description}
            </div>
            <div className="consecutive-info">
              連續簽到 {rewardData.consecutive_days} 天
            </div>
          </div>
        </div>
      )}

      <div className="checkin-card">
        {/* 標題區域 */}
        <div className="checkin-header">
          <h1 className="checkin-title">{getActivityDisplayInfo(status.activity_type, status.activity_title).title}</h1>
          <p className="checkin-subtitle">{getActivityDisplayInfo(status.activity_type, status.activity_title).subtitle}</p>
        </div>

        {/* 統計信息 */}
        <div className="checkin-stats">
          <div className="stat-item">
            <div className="stat-value">{status.consecutive_days || 0}</div>
            <div className="stat-label">{getActivityDisplayInfo(status.activity_type, status.activity_title).streakLabel}</div>
          </div>
        </div>

        {/* 簽到按鈕 */}
        <div className="checkin-action">
          {status.today_checked ? (
            <div className="checked-status">
              <div className="check-icon">✅</div>
              <div className="check-text">今日已簽到</div>
              <div className="check-time">
                明天再來簽到吧！
              </div>
            </div>
          ) : (
            <button 
              className={`checkin-btn ${isChecking ? 'checking' : ''}`}
              onClick={handleCheckin}
              disabled={isChecking}
            >
              {isChecking ? (
                <>
                  <div className="loading-spinner"></div>
                  簽到中...
                </>
              ) : (
                <>
                  <div className="checkin-icon">📅</div>
                  立即簽到
                </>
              )}
            </button>
          )}
        </div>

        {/* 下一個獎勵預覽 */}
        {status.next_reward && !status.today_checked && (
          <div className="next-reward">
            <div className="next-reward-title">簽到可獲得</div>
            <div className="next-reward-content">
              <span className="reward-icon">
                {getRewardIcon(status.next_reward.reward_type)}
              </span>
              <span className="reward-text">
                {getRewardText(status.next_reward.reward_type)} {status.next_reward.reward_value}
              </span>
            </div>
          </div>
        )}

        {/* 簽到日曆 */}
        <div className="checkin-calendar">
          <h3 className="calendar-title">簽到獎勵</h3>
          <div className="calendar-grid">
            {status.checkin_configs.map((config) => (
              <div 
                key={config.day_number} 
                className={`calendar-day ${config.is_completed ? 'completed' : ''} ${
                  status.consecutive_days + 1 === config.day_number && !status.today_checked ? 'current' : ''
                }`}
              >
                <div className="day-number">第{config.day_number}天</div>
                <div className="day-reward">
                  <span className="reward-icon">
                    {getRewardIcon(config.reward_type)}
                  </span>
                  <span className="reward-amount">{config.reward_value}</span>
                </div>
                {config.is_completed && (
                  <div className="completed-mark">✅</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    );
  }, [user, pageState, status, showReward, rewardData, isChecking, handleRefresh, handleCheckin, getRewardIcon, getRewardText, getActivityDisplayInfo]); // useMemo 依賴項

  return renderContent;
}