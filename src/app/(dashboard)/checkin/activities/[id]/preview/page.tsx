"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// 時間格式化函數
const formatDateTime = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-').replace(',', '');
};

interface Activity {
  id: number;
  title: string;
  activityType: string;
  days?: number;
  startDate: string;
  endDate: string;
  publishAt?: string;
  isEnabled: boolean;
  dayRewards?: any[];
  thresholds?: any[];
}

interface SimulationResult {
  today: string;
  checkedIn: boolean;
  currentStreak?: number;
  totalChecked?: number;
  dayIndex?: number;
  rewardAvailable: boolean;
  reward?: any;
  nextHint?: string;
  message?: string;
}

export default function PreviewActivityPage() {
  const params = useParams();
  const id = params.id as string;
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("1001");
  const [testDate, setTestDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [simulationHistory, setSimulationHistory] = useState<any[]>([]);
  const [currentProgress, setCurrentProgress] = useState<{
    currentStreak: number;
    totalChecked: number;
    lastCheckinDate: string | null;
    claimedDaysJson: Record<string, boolean>;
  }>({
    currentStreak: 0,
    totalChecked: 0,
    lastCheckinDate: null,
    claimedDaysJson: {}
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch(`/api/checkin/activities/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setActivity(data);
        }
      } catch (error) {
        console.error('獲取活動失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchActivity();
    }
  }, [id]);

  const handleSimulate = async () => {
    if (!userId || !testDate || !activity) return;

    try {
      setSimulating(true);
      
      // 使用當前進度狀態進行本地模擬
      const result = simulateWithCurrentProgress(activity, testDate, currentProgress);
      
      
      setSimulationResult(result);
      
      // 如果可以簽到，更新進度狀態和歷史記錄
      if (result.checkedIn && result.rewardAvailable !== false) {
        const newProgress = updateProgress(currentProgress, result, testDate);
        setCurrentProgress(newProgress);
        
        // 添加到歷史記錄
        setSimulationHistory(prev => [...prev, {
          date: testDate,
          result: result,
          progress: newProgress
        }]);
        
        // 自動設定下一天的日期
        const nextDate = new Date(testDate);
        nextDate.setDate(nextDate.getDate() + 1);
        setTestDate(nextDate.toISOString().split('T')[0]);
      }
    } catch (error) {
      console.error('模擬失敗:', error);
    } finally {
      setSimulating(false);
    }
  };

  const simulateWithCurrentProgress = (activity: Activity, testDate: string, progress: any) => {
    const todayDate = new Date(testDate);
    const lastCheckinDate = progress.lastCheckinDate ? new Date(progress.lastCheckinDate) : null;

    switch (activity.activityType) {
      case 'STRICT_STREAK_7':
        return simulateStrictStreakLocal(progress, todayDate, lastCheckinDate, activity);
      case 'FLEX_CUMULATIVE':
        return simulateFlexCumulativeLocal(progress, activity);
      case 'DAILY_CALENDAR':
        return simulateDailyCalendarLocal(progress, todayDate, activity);
      default:
        return { today: testDate, checkedIn: false, message: '不支援的活動類型' };
    }
  };

  const simulateStrictStreakLocal = (progress: any, todayDate: Date, lastCheckinDate: Date | null, activity: Activity) => {
    let newStreak = progress.currentStreak;

    // 🔧 修復: 加強時間處理和邊界檢查
    if (!lastCheckinDate) {
      newStreak = 1; // 首次簽到
    } else {
      const dayDiff = getDaysDifference(lastCheckinDate, todayDate);
      if (dayDiff > 1) {
        newStreak = 1; // 中斷重新開始
      } else if (dayDiff === 1) {
        newStreak = progress.currentStreak + 1; // 連續簽到
      } else if (dayDiff === 0) {
        return {
          today: todayDate.toISOString().split('T')[0],
          checkedIn: false,
          message: '今日已簽到',
          currentStreak: progress.currentStreak,
          rewardAvailable: false
        };
      } else {
        // dayDiff < 0 表示日期異常
        return {
          today: todayDate.toISOString().split('T')[0],
          checkedIn: false,
          message: '系統時間異常',
          currentStreak: progress.currentStreak,
          rewardAvailable: false
        };
      }
    }

    const maxDays = activity.days || 7;
    const dayIndex = Math.min(newStreak, maxDays);
    
    // 查找對應的日次獎勵
    const dayReward = activity.dayRewards?.find(reward => reward.dayIndex === dayIndex);
    
    return {
      today: todayDate.toISOString().split('T')[0],
      checkedIn: true,
      currentStreak: newStreak,
      dayIndex,
      rewardAvailable: !!dayReward,
      reward: dayReward ? {
        rewardType: dayReward.rewardType,
        amount: dayReward.amount
      } : null,
      nextHint: dayIndex < maxDays ? `明日繼續簽到可領第${dayIndex + 1}天獎勵` : '已達最高連續天數獎勵',
    };
  };

  const simulateFlexCumulativeLocal = (progress: any, activity: Activity) => {
    const newTotal = progress.totalChecked + 1;
    const dayIndex = Math.min(newTotal, activity.days || 7);
    
    // 查找對應的日次獎勵
    const dayReward = activity.dayRewards?.find(reward => reward.dayIndex === dayIndex);

    return {
      checkedIn: true,
      totalChecked: newTotal,
      dayIndex,
      rewardAvailable: !!dayReward,
      reward: dayReward ? {
        rewardType: dayReward.rewardType,
        amount: dayReward.amount
      } : null,
      nextHint: dayIndex < (activity.days || 7) ? `再簽到可領累積第${dayIndex + 1}天獎勵` : '已達最高累積天數獎勵',
    };
  };

  const simulateDailyCalendarLocal = (progress: any, todayDate: Date, activity: Activity) => {
    const startDate = new Date(activity.startDate);
    const dayIndex = getDaysDifference(startDate, todayDate) + 1;

    if (dayIndex < 1 || dayIndex > (activity.days || 31)) {
      return {
        today: todayDate.toISOString().split('T')[0],
        checkedIn: false,
        message: '不在活動期間內',
        rewardAvailable: false
      };
    }

    const claimed = progress.claimedDaysJson?.[dayIndex] || false;
    const dayReward = activity.dayRewards?.find(reward => reward.dayIndex === dayIndex);

    return {
      today: todayDate.toISOString().split('T')[0],
      checkedIn: !claimed,
      dayIndex,
      rewardAvailable: !claimed && !!dayReward,
      reward: dayReward && !claimed ? {
        rewardType: dayReward.rewardType,
        amount: dayReward.amount
      } : null,
      message: claimed ? '今日已領取' : '可以領取今日獎勵',
    };
  };

  const updateProgress = (currentProgress: any, result: any, testDate: string) => {
    const newProgress = { ...currentProgress };
    
    if (result.checkedIn) {
      newProgress.lastCheckinDate = testDate;
      
      if (result.currentStreak !== undefined) {
        newProgress.currentStreak = result.currentStreak;
      }
      
      if (result.totalChecked !== undefined) {
        newProgress.totalChecked = result.totalChecked;
      }
      
      if (result.dayIndex !== undefined) {
        newProgress.claimedDaysJson = {
          ...newProgress.claimedDaysJson,
          [result.dayIndex]: true
        };
      }
    }
    
    return newProgress;
  };

  const getDaysDifference = (date1: Date, date2: Date): number => {
    // 🔧 修復: 使用UTC時間避免時區問題
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
    const diffTime = utc2 - utc1;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };


  const resetSimulation = () => {
    setSimulationResult(null);
    setSimulationHistory([]);
    setCurrentProgress({
      currentStreak: 0,
      totalChecked: 0,
      lastCheckinDate: null,
      claimedDaysJson: {}
    });
    setTestDate(new Date().toISOString().split('T')[0]);
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
        <p>載入活動資料中...</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>⚠️</div>
        <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>活動不存在</h3>
        <p style={{ color: '#6b7280' }}>活動不存在或您沒有權限訪問此活動</p>
      </div>
    );
  }

  const getActivityTypeName = (type: string) => {
    switch (type) {
      case 'STRICT_STREAK_7': return '連續簽到';
      case 'FLEX_CUMULATIVE': return '累積簽到';
      case 'DAILY_CALENDAR': return '每日簽到';
      default: return type;
    }
  };

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'STRICT_STREAK_7': return '🎯';
      case 'FLEX_CUMULATIVE': return '📈';
      case 'DAILY_CALENDAR': return '📅';
      default: return '👁️';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* 頁面標題 */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          margin: '0 0 12px 0',
          color: '#1f2937'
        }}>
          <span style={{ fontSize: '2.5rem' }}>{getActivityTypeIcon(activity.activityType)}</span>
          活動預覽 - {activity.title}
        </h1>
        <p style={{ color: '#6b7280', margin: 0, fontSize: '1.1rem' }}>
          預覽 {getActivityTypeName(activity.activityType)} 活動的設定內容和模擬測試
        </p>
      </div>

      {/* 主要內容 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
        gap: '30px'
      }}>
        {/* 左側：活動資訊 */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e5e7eb',
          minHeight: '600px'
        }}>
          {/* 標題區 */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px 30px',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#ffffff',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              📋 活動資訊
            </h2>
          </div>

          {/* 基本資訊 */}
          <div style={{ padding: '30px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: '600', color: '#64748b', fontSize: '0.95rem' }}>📝 活動標題</span>
                <span style={{ color: '#1e293b', fontWeight: '600', fontSize: '1rem' }}>{activity.title}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: '600', color: '#64748b', fontSize: '0.95rem' }}>🎯 活動類型</span>
                <span style={{ color: '#1e293b', fontWeight: '600', fontSize: '1rem' }}>{getActivityTypeName(activity.activityType)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: '600', color: '#64748b', fontSize: '0.95rem' }}>📅 活動期間</span>
                <span style={{ color: '#1e293b', fontWeight: '600', fontSize: '1rem' }}>{formatDateTime(activity.startDate)} ~ {formatDateTime(activity.endDate)}</span>
              </div>
              {activity.days && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontWeight: '600', color: '#64748b', fontSize: '0.95rem' }}>📊 活動天數</span>
                  <span style={{ color: '#1e293b', fontWeight: '600', fontSize: '1rem' }}>{activity.days} 天</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: '600', color: '#64748b', fontSize: '0.95rem' }}>🚀 狀態</span>
                <span style={{
                  padding: '8px 16px',
                  borderRadius: '25px',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  background: activity.isEnabled ? '#dcfce7' : '#f3f4f6',
                  color: activity.isEnabled ? '#166534' : '#6b7280',
                  border: `2px solid ${activity.isEnabled ? '#22c55e' : '#d1d5db'}`
                }}>
                  {activity.isEnabled ? '🟢 已上架' : '⚪ 已下架'}
                </span>
              </div>
            </div>

            {/* 獎勵設定 */}
            {activity.dayRewards && activity.dayRewards.length > 0 && (
              <div style={{
                marginTop: '24px',
                background: 'linear-gradient(to right, #fefce8, #fed7aa)',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #fbbf24'
              }}>
                <h3 style={{
                  fontWeight: '600',
                  marginBottom: '12px',
                  color: '#92400e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🏆 日次獎勵
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: '#b45309', fontWeight: '500' }}>天數</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: '#b45309', fontWeight: '500' }}>類型</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: '#b45309', fontWeight: '500' }}>金額</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activity.dayRewards.map((reward, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #fde68a' }}>
                          <td style={{ padding: '8px 12px', fontWeight: '500' }}>第 {reward.dayIndex} 天</td>
                          <td style={{ padding: '8px 12px' }}>
                            {reward.rewardType === 'CASH' ? '現金' : 
                             reward.rewardType === 'POINTS' ? '點數' :
                             reward.rewardType === 'COUPON' ? '優惠券' :
                             reward.rewardType === 'ITEM' ? '道具' :
                             reward.rewardType}
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: '600', color: '#059669' }}>{reward.amount || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activity.thresholds && activity.thresholds.length > 0 && (
              <div style={{
                marginTop: '24px',
                background: 'linear-gradient(to right, #fdf2f8, #fce7f3)',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #d946ef'
              }}>
                <h3 style={{
                  fontWeight: '600',
                  marginBottom: '12px',
                  color: '#86198f',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🎯 門檻獎勵
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activity.thresholds.map((threshold: any, index: number) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.6)',
                      borderRadius: '8px'
                    }}>
                      <span style={{ color: '#7c2d92', fontWeight: '500' }}>累積 {threshold.daysRequired} 天</span>
                      <span style={{ color: '#059669', fontWeight: '600' }}>
                        {threshold.reward.rewardType === 'CASH' ? '現金' : 
                         threshold.reward.rewardType === 'POINTS' ? '點數' :
                         threshold.reward.rewardType === 'COUPON' ? '優惠券' :
                         threshold.reward.rewardType === 'ITEM' ? '道具' :
                         threshold.reward.rewardType} {threshold.reward.amount || ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右側：模擬測試 */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e5e7eb',
          minHeight: '600px'
        }}>
          {/* 標題區 */}
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            padding: '20px 30px',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#ffffff',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🧪 模擬測試
            </h2>
          </div>

          <div style={{ padding: '30px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <Label htmlFor="userId" style={{ color: '#374151', fontWeight: '600', fontSize: '1rem', marginBottom: '8px', display: 'block' }}>👤 測試用戶 ID</Label>
                <Input
                  id="userId"
                  type="number"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="輸入測試用戶 ID"
                  style={{ 
                    marginTop: '8px',
                    padding: '12px 16px',
                    fontSize: '1rem',
                    borderRadius: '8px',
                    border: '2px solid #e2e8f0',
                    width: '100%'
                  }}
                />
              </div>

              <div>
                <Label htmlFor="testDate" style={{ color: '#374151', fontWeight: '600', fontSize: '1rem', marginBottom: '8px', display: 'block' }}>📅 測試日期</Label>
                <Input
                  id="testDate"
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  style={{ 
                    marginTop: '8px',
                    padding: '12px 16px',
                    fontSize: '1rem',
                    borderRadius: '8px',
                    border: '2px solid #e2e8f0',
                    width: '100%'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <Button 
                  onClick={handleSimulate}
                  disabled={simulating || !userId || !testDate}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    fontWeight: '700',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: simulating || !userId || !testDate ? 'not-allowed' : 'pointer',
                    opacity: simulating || !userId || !testDate ? 0.5 : 1,
                    fontSize: '1.1rem',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {simulating ? '🔄 模擬中...' : '🚀 模擬簽到'}
                </Button>
                
                <Button 
                  onClick={resetSimulation}
                  disabled={simulating}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: 'white',
                    fontWeight: '700',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: simulating ? 'not-allowed' : 'pointer',
                    opacity: simulating ? 0.5 : 1,
                    fontSize: '1.1rem',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🔄 重置
                </Button>
              </div>
            </div>

            {/* 模擬結果 */}
            {simulationResult && (
              <div style={{
                marginTop: '24px',
                background: 'linear-gradient(to right, #eff6ff, #dbeafe)',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #3b82f6'
              }}>
                <h3 style={{
                  fontWeight: '600',
                  marginBottom: '16px',
                  color: '#1e40af',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  📊 模擬結果
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontWeight: '500', color: '#374151' }}>📅 測試日期</span>
                    <span style={{ fontWeight: '600', color: '#111827' }}>{simulationResult.today}</span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontWeight: '500', color: '#374151' }}>✅ 可簽到</span>
                    <span style={{
                      fontWeight: '600',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      background: simulationResult.checkedIn ? '#dcfce7' : '#fee2e2',
                      color: simulationResult.checkedIn ? '#166534' : '#dc2626'
                    }}>
                      {simulationResult.checkedIn ? '✅ 可以簽到' : '❌ 不可簽到'}
                    </span>
                  </div>

                  {simulationResult.currentStreak !== undefined && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.6)',
                      borderRadius: '8px'
                    }}>
                      <span style={{ fontWeight: '500', color: '#374151' }}>🔥 連續天數</span>
                      <span style={{ fontWeight: '600', color: '#ea580c' }}>{simulationResult.currentStreak} 天</span>
                    </div>
                  )}

                  {simulationResult.totalChecked !== undefined && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.6)',
                      borderRadius: '8px'
                    }}>
                      <span style={{ fontWeight: '500', color: '#374151' }}>📈 累積天數</span>
                      <span style={{ fontWeight: '600', color: '#7c3aed' }}>{simulationResult.totalChecked} 天</span>
                    </div>
                  )}

                  {simulationResult.dayIndex && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.6)',
                      borderRadius: '8px'
                    }}>
                      <span style={{ fontWeight: '500', color: '#374151' }}>🎯 獎勵天數</span>
                      <span style={{ fontWeight: '600', color: '#4f46e5' }}>第 {simulationResult.dayIndex} 天</span>
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontWeight: '500', color: '#374151' }}>🎁 可領獎勵</span>
                    <span style={{
                      fontWeight: '600',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      background: simulationResult.rewardAvailable ? '#dcfce7' : '#f3f4f6',
                      color: simulationResult.rewardAvailable ? '#166534' : '#6b7280'
                    }}>
                      {simulationResult.rewardAvailable && simulationResult.reward ? 
                        `🎁 ${simulationResult.reward.rewardType === 'CASH' ? '現金' : 
                              simulationResult.reward.rewardType === 'POINTS' ? '點數' :
                              simulationResult.reward.rewardType === 'COUPON' ? '優惠券' :
                              simulationResult.reward.rewardType === 'ITEM' ? '道具' :
                              simulationResult.reward.rewardType}${simulationResult.reward.amount ? ` ${simulationResult.reward.amount}元` : ''}` 
                        : simulationResult.rewardAvailable ? '🎁 有獎勵' : '⭕ 無獎勵'}
                    </span>
                  </div>

                  {simulationResult.rewardAvailable && simulationResult.reward && (
                    <div style={{
                      padding: '20px',
                      background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                      borderRadius: '12px',
                      border: '2px solid #22c55e',
                      boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '1.5rem' }}>🏆</span>
                        <div>
                          <div style={{ fontWeight: '700', color: '#166534', fontSize: '1.1rem' }}>
                            獎勵內容
                          </div>
                          <div style={{ fontWeight: '800', color: '#14532d', fontSize: '1.2rem', marginTop: '4px' }}>
                            {simulationResult.reward.rewardType === 'CASH' ? '現金' : 
                             simulationResult.reward.rewardType === 'POINTS' ? '點數' :
                             simulationResult.reward.rewardType === 'COUPON' ? '優惠券' :
                             simulationResult.reward.rewardType === 'ITEM' ? '道具' :
                             simulationResult.reward.rewardType} 
                            {simulationResult.reward.amount ? ` ${simulationResult.reward.amount} 元` : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {simulationResult.nextHint && (
                    <div style={{
                      padding: '16px',
                      background: 'linear-gradient(to right, #fef3c7, #fde68a)',
                      borderRadius: '8px',
                      border: '1px solid #f59e0b'
                    }}>
                      <span style={{ fontWeight: '500', color: '#92400e' }}>💡 提示：</span>
                      <span style={{ color: '#78350f', marginLeft: '4px' }}>{simulationResult.nextHint}</span>
                    </div>
                  )}

                  {simulationResult.message && (
                    <div style={{
                      padding: '16px',
                      background: 'linear-gradient(to right, #f1f5f9, #e2e8f0)',
                      borderRadius: '8px',
                      border: '1px solid #94a3b8'
                    }}>
                      <span style={{ fontWeight: '500', color: '#475569' }}>📝 訊息：</span>
                      <span style={{ color: '#334155', marginLeft: '4px' }}>{simulationResult.message}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 簽到歷史記錄 */}
            {simulationHistory.length > 0 && (
              <div style={{
                marginTop: '24px',
                background: 'linear-gradient(to right, #f0f9ff, #e0f2fe)',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #0ea5e9'
              }}>
                <h3 style={{
                  fontWeight: '600',
                  marginBottom: '16px',
                  color: '#0c4a6e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  📋 簽到歷史記錄 ({simulationHistory.length} 天)
                </h3>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {simulationHistory.map((record, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '8px',
                      border: '1px solid #bae6fd'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: '600', color: '#0369a1' }}>
                          第 {index + 1} 天
                        </span>
                        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                          {record.date}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {record.result.currentStreak && (
                          <span style={{ 
                            fontSize: '0.8rem', 
                            padding: '4px 8px', 
                            borderRadius: '12px',
                            background: '#fef3c7',
                            color: '#92400e'
                          }}>
                            連續 {record.result.currentStreak} 天
                          </span>
                        )}
                        {record.result.totalChecked && (
                          <span style={{ 
                            fontSize: '0.8rem', 
                            padding: '4px 8px', 
                            borderRadius: '12px',
                            background: '#ede9fe',
                            color: '#6b46c1'
                          }}>
                            累積 {record.result.totalChecked} 天
                          </span>
                        )}
                        {record.result.rewardAvailable && record.result.reward ? (
                          <span style={{ 
                            fontSize: '0.8rem', 
                            padding: '4px 8px', 
                            borderRadius: '12px',
                            background: '#dcfce7',
                            color: '#166534',
                            fontWeight: '600'
                          }}>
                            🎁 {record.result.reward.rewardType === 'CASH' ? '現金' : 
                                 record.result.reward.rewardType === 'POINTS' ? '點數' :
                                 record.result.reward.rewardType === 'COUPON' ? '優惠券' :
                                 record.result.reward.rewardType === 'ITEM' ? '道具' :
                                 record.result.reward.rewardType} 
                            {record.result.reward.amount ? ` ${record.result.reward.amount}元` : ''}
                          </span>
                        ) : (
                          <span style={{ 
                            fontSize: '0.8rem', 
                            padding: '4px 8px', 
                            borderRadius: '12px',
                            background: '#f3f4f6',
                            color: '#6b7280'
                          }}>
                            無獎勵
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 當前進度狀態 */}
            {(currentProgress.currentStreak > 0 || currentProgress.totalChecked > 0) && (
              <div style={{
                marginTop: '24px',
                background: 'linear-gradient(to right, #fefce8, #fef3c7)',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #f59e0b'
              }}>
                <h3 style={{
                  fontWeight: '600',
                  marginBottom: '12px',
                  color: '#92400e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  📊 當前進度狀態
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {currentProgress.currentStreak > 0 && (
                    <div style={{
                      padding: '8px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}>
                      <span style={{ fontWeight: '500', color: '#92400e' }}>🔥 連續簽到：</span>
                      <span style={{ fontWeight: '700', color: '#ea580c' }}>{currentProgress.currentStreak} 天</span>
                    </div>
                  )}
                  {currentProgress.totalChecked > 0 && (
                    <div style={{
                      padding: '8px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}>
                      <span style={{ fontWeight: '500', color: '#92400e' }}>📈 累積簽到：</span>
                      <span style={{ fontWeight: '700', color: '#7c3aed' }}>{currentProgress.totalChecked} 天</span>
                    </div>
                  )}
                  {currentProgress.lastCheckinDate && (
                    <div style={{
                      padding: '8px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}>
                      <span style={{ fontWeight: '500', color: '#92400e' }}>📅 最後簽到：</span>
                      <span style={{ fontWeight: '700', color: '#059669' }}>{currentProgress.lastCheckinDate}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}