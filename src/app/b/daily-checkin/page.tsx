"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "@/hooks/use-user-store";
import "../../a/daily-checkin/daily-checkin.css";

interface CheckinStatus {
  can_checkin: boolean;
  consecutive_days: number;
  total_checkins: number;
  last_checkin_date: Date | null;
  today_checked: boolean;
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

export default function DailyCheckinPageB() {
  const [status, setStatus] = useState<CheckinStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [rewardData, setRewardData] = useState<any>(null);
  const { user } = useUserStore();

  const companyId = 2; // B 公司使用 ID 2

  // 重複登入檢查
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('portalToken_b')
      if (!token && !user) {
        window.location.href = '/b/duplicate-login'
        return
      }
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadStatus();
    }
  }, [user]);

  const loadStatus = async () => {
    try {
      const token = localStorage.getItem('portalToken_b');
      if (!token) {
        console.error('No token found');
        return;
      }
      const response = await fetch(`/api/daily-checkin/status?company_id=${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('載入簽到狀態失敗:', error);
    }
  };

  const handleCheckin = async () => {
    if (!status?.can_checkin || isChecking) return;

    setIsChecking(true);
    try {
      const token = localStorage.getItem('portalToken_b');
      const response = await fetch('/api/daily-checkin/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ company_id: companyId }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setRewardData(result.data);
          setShowReward(true);
          setTimeout(() => {
            loadStatus();
            setShowReward(false);
          }, 3000);
        } else {
          alert(result.message);
        }
      } else {
        alert('簽到失敗，請重試');
      }
    } catch (error) {
      console.error('簽到失敗:', error);
      alert('簽到失敗，請重試');
    } finally {
      setIsChecking(false);
    }
  };

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

  if (!user) {
    return (
      <div className="checkin-container">
        <div className="checkin-card">
          <div className="login-prompt">
            <h2>請先登入</h2>
            <p>登入後即可參與每日簽到活動</p>
            <a href="/b/login" className="login-btn">前往登入</a>
          </div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="checkin-container">
        <div className="loading">載入中...</div>
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
          <h1 className="checkin-title">每日簽到</h1>
          <p className="checkin-subtitle">每天簽到領取豐富獎勵</p>
        </div>

        {/* 統計信息 */}
        <div className="checkin-stats">
          <div className="stat-item">
            <div className="stat-value">{status.consecutive_days}</div>
            <div className="stat-label">連續天數</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{status.total_checkins}</div>
            <div className="stat-label">總簽到數</div>
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
}