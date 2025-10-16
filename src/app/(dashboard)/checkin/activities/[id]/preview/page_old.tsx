"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    if (!userId || !testDate) return;

    try {
      setSimulating(true);
      const response = await fetch(`/api/checkin/activities/${id}/simulate/next-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          userId: parseInt(userId),
          today: testDate,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSimulationResult(result);
      }
    } catch (error) {
      console.error('模擬失敗:', error);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="checkin-form-container">
        <div className="checkin-form-wrapper">
          <div className="checkin-form-content">
            <div className="text-center py-12">
              <div className="loading-spinner mx-auto mb-4"></div>
              <p className="text-gray-600">載入活動資料中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="checkin-form-container">
        <div className="checkin-form-wrapper">
          <div className="checkin-form-content">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-red-600 mb-2">活動不存在</h3>
              <p className="text-gray-600">活動不存在或您沒有權限訪問此活動</p>
            </div>
          </div>
        </div>
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
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          margin: '0 0 8px 0'
        }}>
          <span style={{ fontSize: '2rem' }}>{getActivityTypeIcon(activity.activityType)}</span>
          活動預覽 - {activity.title}
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          預覽 {getActivityTypeName(activity.activityType)} 活動的設定內容和模擬測試
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '24px' 
      }}>
        {/* 活動資訊 */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'linear-gradient(to right, #dbeafe, #e0e7ff)',
            padding: '16px 24px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h2 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📋 活動資訊
            </h2>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '500', color: '#6b7280' }}>📝 活動標題</span>
                <span style={{ color: '#111827', fontWeight: '500' }}>{activity.title}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '500', color: '#6b7280' }}>🎯 活動類型</span>
                <span style={{ color: '#111827' }}>{getActivityTypeName(activity.activityType)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '500', color: '#6b7280' }}>📅 活動期間</span>
                <span style={{ color: '#111827' }}>{activity.startDate} ~ {activity.endDate}</span>
              </div>
              {activity.days && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '500', color: '#6b7280' }}>📊 活動天數</span>
                  <span style={{ color: '#111827' }}>{activity.days} 天</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '500', color: '#6b7280' }}>🚀 狀態</span>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  background: activity.isEnabled ? '#dcfce7' : '#f3f4f6',
                  color: activity.isEnabled ? '#166534' : '#6b7280',
                  border: `1px solid ${activity.isEnabled ? '#bbf7d0' : '#d1d5db'}`
                }}>
                  {activity.isEnabled ? '🟢 已上架' : '⚪ 已下架'}
                </span>
              </div>
            </div>
            </div>

            {/* 獎勵設定 */}
            {activity.dayRewards && activity.dayRewards.length > 0 && (
              <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
                <h3 className="font-semibold mb-3 text-yellow-800 flex items-center gap-2">
                  🏆 日次獎勵
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white/60">
                        <th className="px-3 py-2 text-left text-yellow-700 font-medium">天數</th>
                        <th className="px-3 py-2 text-left text-yellow-700 font-medium">類型</th>
                        <th className="px-3 py-2 text-left text-yellow-700 font-medium">金額</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activity.dayRewards.map((reward, index) => (
                        <tr key={index} className="border-b border-yellow-100 hover:bg-white/40">
                          <td className="px-3 py-2 font-medium">第 {reward.dayIndex} 天</td>
                          <td className="px-3 py-2">{reward.rewardType}</td>
                          <td className="px-3 py-2 font-semibold text-green-600">{reward.amount || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activity.thresholds && activity.thresholds.length > 0 && (
              <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                <h3 className="font-semibold mb-3 text-purple-800 flex items-center gap-2">
                  🎯 門檻獎勵
                </h3>
                <div className="space-y-2">
                  {activity.thresholds.map((threshold: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-white/60 rounded-lg border border-purple-100">
                      <span className="text-purple-700 font-medium">累積 {threshold.daysRequired} 天</span>
                      <span className="text-green-600 font-semibold">
                        {threshold.reward.rewardType} {threshold.reward.amount || ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>

        {/* 模擬測試 */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'linear-gradient(to right, #ecfdf5, #d1fae5)',
            padding: '16px 24px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h2 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🧪 模擬測試
            </h2>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <Label htmlFor="userId" className="text-gray-700 font-medium">👤 測試用戶 ID</Label>
                    <Input
                      id="userId"
                      type="number"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      placeholder="輸入測試用戶 ID"
                      className="mt-1 border-2 border-gray-200 focus:border-green-400"
                    />
                  </div>

                  <div>
                    <Label htmlFor="testDate" className="text-gray-700 font-medium">📅 測試日期</Label>
                    <Input
                      id="testDate"
                      type="date"
                      value={testDate}
                      onChange={(e) => setTestDate(e.target.value)}
                      className="mt-1 border-2 border-gray-200 focus:border-green-400"
                    />
                  </div>

                  <Button 
                    onClick={handleSimulate}
                    disabled={simulating || !userId || !testDate}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
                  >
                    {simulating ? (
                      <>
                        <div className="loading-spinner mr-2"></div>
                        模擬中...
                      </>
                    ) : (
                      '🚀 開始模擬簽到'
                    )}
                  </Button>
                </div>

              {simulationResult && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                  <h3 className="font-semibold mb-4 text-blue-800 flex items-center gap-2">
                    📊 模擬結果
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                      <span className="font-medium text-gray-700">📅 測試日期</span>
                      <span className="font-semibold text-gray-900">{simulationResult.today}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                      <span className="font-medium text-gray-700">✅ 可簽到</span>
                      <span className={`font-semibold px-2 py-1 rounded-full text-xs ${
                        simulationResult.checkedIn 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {simulationResult.checkedIn ? '✅ 可以簽到' : '❌ 不可簽到'}
                      </span>
                    </div>

                    {simulationResult.currentStreak !== undefined && (
                      <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                        <span className="font-medium text-gray-700">🔥 連續天數</span>
                        <span className="font-semibold text-orange-600">{simulationResult.currentStreak} 天</span>
                      </div>
                    )}

                    {simulationResult.totalChecked !== undefined && (
                      <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                        <span className="font-medium text-gray-700">📈 累積天數</span>
                        <span className="font-semibold text-purple-600">{simulationResult.totalChecked} 天</span>
                      </div>
                    )}

                    {simulationResult.dayIndex && (
                      <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                        <span className="font-medium text-gray-700">🎯 獎勵天數</span>
                        <span className="font-semibold text-indigo-600">第 {simulationResult.dayIndex} 天</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                      <span className="font-medium text-gray-700">🎁 可領獎勵</span>
                      <span className={`font-semibold px-2 py-1 rounded-full text-xs ${
                        simulationResult.rewardAvailable 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {simulationResult.rewardAvailable ? '🎁 有獎勵' : '⭕ 無獎勵'}
                      </span>
                    </div>

                    {simulationResult.reward && (
                      <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-200">
                        <span className="font-medium text-green-800">🏆 獎勵內容：</span>
                        <span className="font-bold text-green-900 ml-2">
                          {simulationResult.reward.rewardType} {simulationResult.reward.amount || ''}
                        </span>
                      </div>
                    )}

                    {simulationResult.nextHint && (
                      <div className="p-4 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-lg border border-yellow-200">
                        <span className="font-medium text-yellow-800">💡 提示：</span>
                        <span className="text-yellow-900 ml-1">{simulationResult.nextHint}</span>
                      </div>
                    )}

                    {simulationResult.message && (
                      <div className="p-4 bg-gradient-to-r from-gray-100 to-slate-100 rounded-lg border border-gray-200">
                        <span className="font-medium text-gray-800">📝 訊息：</span>
                        <span className="text-gray-900 ml-1">{simulationResult.message}</span>
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