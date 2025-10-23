"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { RewardPlanGrid } from "./RewardPlanGrid";
import { ThresholdEditor } from "./ThresholdEditor";
import { toTaiwanDatetimeString, fromDatetimeLocalToUTC } from "@/lib/timeUtils";

interface ActivityFormProps {
  fixedActivityType: string;
  mode: 'create' | 'edit';
  initialData?: any;
  activityId?: number;
}

export function ActivityForm({ fixedActivityType, mode, initialData, activityId }: ActivityFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    days: '',
    startDate: '',
    endDate: '',
    publishAt: '',
    isEnabled: false,
  });
  const [dayRewards, setDayRewards] = useState<any[]>([]);
  const [thresholds, setThresholds] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});


  // 初始化表單數據
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      
      setFormData({
        title: initialData.title || '',
        days: initialData.days?.toString() || '',
        startDate: toTaiwanDatetimeString(initialData.startDate || ''),
        endDate: toTaiwanDatetimeString(initialData.endDate || ''),
        publishAt: initialData.publishAt ? initialData.publishAt.split('T')[0] : '',
        isEnabled: initialData.isEnabled || false,
      });
      
      if (initialData.dayRewards) {
        setDayRewards(initialData.dayRewards);
      }
      
      if (initialData.thresholds) {
        setThresholds(initialData.thresholds);
      }
    }
  }, [mode, initialData]);

  // 當天數改變時，更新日次獎勵 (新增模式或編輯模式下獎勵為空時)
  useEffect(() => {
    if (needsDayRewards() && formData.days) {
      const days = parseInt(formData.days);
      if (days > 0) {
        // 新增模式或編輯模式下獎勵為空時，生成新的獎勵結構
        if (mode === 'create' || (mode === 'edit' && dayRewards.length === 0)) {
          const newRewards = Array.from({ length: days }, (_, index) => ({
            dayIndex: index + 1,
            rewardType: 'CASH',
            amount: 0,
            metaJson: {},
          }));
          setDayRewards(newRewards);
        }
        // 編輯模式下如果天數改變，調整獎勵陣列長度
        else if (mode === 'edit' && dayRewards.length !== days) {
          const currentRewards = [...dayRewards];
          if (days > currentRewards.length) {
            // 增加天數：添加新獎勵
            for (let i = currentRewards.length; i < days; i++) {
              currentRewards.push({
                dayIndex: i + 1,
                rewardType: 'CASH',
                amount: 0,
                metaJson: {},
              });
            }
          } else {
            // 減少天數：截斷獎勵陣列
            currentRewards.splice(days);
          }
          setDayRewards(currentRewards);
        }
      }
    }
  }, [formData.days, fixedActivityType, mode, dayRewards.length]);

  const needsDayRewards = () => {
    return ['STRICT_STREAK_7', 'DAILY_CALENDAR', 'FLEX_CUMULATIVE'].includes(fixedActivityType);
  };

  const needsThresholds = () => {
    return false; // 暫時移除門檻系統，改用日次獎勵
  };

  const getActivityTypeName = () => {
    switch (fixedActivityType) {
      case 'STRICT_STREAK_7': return '連續簽到';
      case 'FLEX_CUMULATIVE': return '累積簽到';
      case 'DAILY_CALENDAR': return '每日簽到';
      default: return fixedActivityType;
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '請輸入活動標題';
    }

    if (!formData.startDate) {
      newErrors.startDate = '請選擇開始日期';
    }

    if (!formData.endDate) {
      newErrors.endDate = '請選擇結束日期';
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = '結束日期不能早於開始日期';
    }

    if (formData.publishAt && formData.endDate && formData.publishAt > formData.endDate) {
      newErrors.publishAt = '預約上架時間不能晚於結束日期';
    }

    if (needsDayRewards() && !formData.days) {
      newErrors.days = '此活動類型需要設定天數';
    }

    if (formData.days && parseInt(formData.days) <= 0) {
      newErrors.days = '天數必須大於 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // 1. 建立/更新活動基本資料
      const activityPayload = {
        title: formData.title,
        activityType: fixedActivityType,
        days: formData.days ? parseInt(formData.days) : undefined,
        startDate: fromDatetimeLocalToUTC(formData.startDate),
        endDate: fromDatetimeLocalToUTC(formData.endDate),
        publishAt: formData.publishAt ? fromDatetimeLocalToUTC(formData.publishAt) : undefined,
        isEnabled: formData.isEnabled,
        configJson: {},
      };

      let currentActivityId = mode === 'edit' ? activityId : null;

      if (mode === 'create') {
        const response = await fetch('/api/checkin/activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(activityPayload),
        });

        if (!response.ok) {
          throw new Error('建立活動失敗');
        }

        const result = await response.json();
        currentActivityId = result.id;
      } else {
        const response = await fetch(`/api/checkin/activities/${currentActivityId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(activityPayload),
        });

        if (!response.ok) {
          throw new Error('更新活動失敗');
        }
      }

      // 2. 更新日次獎勵 (如果需要)
      if (needsDayRewards() && formData.days && parseInt(formData.days) > 0) {
        
        const response = await fetch(`/api/checkin/activities/${currentActivityId}/day-rewards`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ dayRewards }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('日次獎勵儲存失敗:', errorText);
          throw new Error('更新日次獎勵失敗');
        }
        
      }

      // 3. 更新門檻獎勵 (如果需要)
      if (needsThresholds() && thresholds.length > 0) {
        const response = await fetch(`/api/checkin/activities/${currentActivityId}/thresholds`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ thresholds }),
        });

        if (!response.ok) {
          throw new Error('更新門檻獎勵失敗');
        }
      }

      // 成功後返回列表頁
      const redirectMap = {
        'STRICT_STREAK_7': '/checkin/strict-streak',
        'FLEX_CUMULATIVE': '/checkin/flex-cumulative',
        'DAILY_CALENDAR': '/checkin/daily',
      };

      router.push(redirectMap[fixedActivityType as keyof typeof redirectMap] || '/checkin/strict-streak');

    } catch (error) {
      console.error('儲存失敗:', error);
      alert('儲存失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    const redirectMap = {
      'STRICT_STREAK_7': '/checkin/strict-streak',
      'FLEX_CUMULATIVE': '/checkin/flex-cumulative',
      'DAILY_CALENDAR': '/checkin/daily',
    };

    router.push(redirectMap[fixedActivityType as keyof typeof redirectMap] || '/checkin/strict-streak');
  };

  return (
    <form onSubmit={handleSubmit} className="checkin-form">
      {/* 基本資訊 */}
      <div className="form-section">
        <h3 className="form-section-title">基本資訊</h3>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="title" className="form-label required">
              📝 活動標題
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="請輸入活動標題"
              className={`form-input ${errors.title ? 'error' : ''}`}
            />
            {errors.title && <div className="form-error">{errors.title}</div>}
          </div>

          <div className="form-field">
            <label className="form-label">🎯 活動類型</label>
            <div className="activity-type-display">
              {getActivityTypeName()}
            </div>
          </div>

          {needsDayRewards() && (
            <div className="form-field">
              <label htmlFor="days" className="form-label required">
                📊 活動天數
              </label>
              <input
                id="days"
                type="number"
                min="1"
                max="31"
                value={formData.days}
                onChange={(e) => setFormData(prev => ({ ...prev, days: e.target.value }))}
                placeholder="請輸入天數"
                className={`form-input ${errors.days ? 'error' : ''}`}
              />
              {errors.days && <div className="form-error">{errors.days}</div>}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="startDate" className="form-label required">
              📅 開始時間
            </label>
            <DateTimePicker
              id="startDate"
              value={formData.startDate}
              onChange={(value) => setFormData(prev => ({ ...prev, startDate: value }))}
              className={`form-input ${errors.startDate ? 'error' : ''}`}
              required
            />
            {errors.startDate && <div className="form-error">{errors.startDate}</div>}
          </div>

          <div className="form-field">
            <label htmlFor="endDate" className="form-label required">
              🏁 結束時間
            </label>
            <DateTimePicker
              id="endDate"
              value={formData.endDate}
              onChange={(value) => setFormData(prev => ({ ...prev, endDate: value }))}
              className={`form-input ${errors.endDate ? 'error' : ''}`}
              required
            />
            {errors.endDate && <div className="form-error">{errors.endDate}</div>}
          </div>

          <div className="form-field">
            <label htmlFor="publishAt" className="form-label">
              ⏰ 預約上架時間
            </label>
            <DateTimePicker
              id="publishAt"
              value={formData.publishAt}
              onChange={(value) => setFormData(prev => ({ ...prev, publishAt: value }))}
              className={`form-input ${errors.publishAt ? 'error' : ''}`}
              placeholder="選擇預約上架時間（可選）"
            />
            {errors.publishAt && <div className="form-error">{errors.publishAt}</div>}
          </div>

        </div>
      </div>

      <div className="form-switch-container">
        <div className="form-switch-wrapper">
          <Switch
            id="isEnabled"
            checked={formData.isEnabled}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isEnabled: checked }))}
          />
          <label htmlFor="isEnabled" className="form-switch-label">
            {formData.isEnabled ? '🟢 活動已上架' : '⚪ 活動已下架'}
          </label>
        </div>
        <div className="form-hint">
          <span className="form-hint-icon">💡</span>
          <div>
            {formData.publishAt ? (
              formData.isEnabled ? 
                '活動已上架，將忽略預約時間設定' : 
                `活動將在 ${new Date(formData.publishAt).toLocaleString('zh-TW')} 自動上架`
            ) : (
              formData.isEnabled ? 
                '活動已立即上架，用戶可以開始參與' : 
                '活動已下架，用戶暫時無法參與'
            )}
          </div>
        </div>
      </div>


      {/* 獎勵設定 */}
      {needsDayRewards() && formData.days && parseInt(formData.days) > 0 && (
        <div className={`rewards-section ${dayRewards.length > 0 ? 'has-content' : ''}`}>
          <div className="rewards-section-header">
            <div className="rewards-section-icon">🏆</div>
            <div>
              <h3 className="rewards-section-title">日次獎勵設定</h3>
              <p className="rewards-section-subtitle">設定每日簽到可獲得的獎勵內容</p>
            </div>
          </div>
          <RewardPlanGrid
            days={parseInt(formData.days)}
            rewards={dayRewards}
            onChange={setDayRewards}
          />
        </div>
      )}

      {needsThresholds() && (
        <div className={`rewards-section ${thresholds.length > 0 ? 'has-content' : ''}`}>
          <div className="rewards-section-header">
            <div className="rewards-section-icon">🎯</div>
            <div>
              <h3 className="rewards-section-title">門檻獎勵設定</h3>
              <p className="rewards-section-subtitle">設定累積簽到達到指定天數的獎勵</p>
            </div>
          </div>
          <ThresholdEditor
            thresholds={thresholds}
            onChange={setThresholds}
          />
        </div>
      )}

      {/* 操作按鈕 */}
      <div className="form-actions">
        <button
          type="button"
          className="form-btn form-btn-cancel"
          onClick={handleCancel}
          disabled={loading}
        >
          ❌ 取消
        </button>
        <button
          type="submit"
          className="form-btn form-btn-submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              儲存中...
            </>
          ) : (
            <>
              {mode === 'create' ? '✨ 建立活動' : '💾 更新活動'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}