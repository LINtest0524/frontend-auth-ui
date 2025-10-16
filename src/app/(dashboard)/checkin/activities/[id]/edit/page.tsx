"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ActivityForm } from "@/components/checkin/ActivityForm";
import "@/styles/pages/checkin-form.css";

interface Activity {
  id: number;
  title: string;
  activityType: string;
  days?: number;
  startDate: string;
  endDate: string;
  publishAt?: string;
  isEnabled: boolean;
  companyId?: number;
  configJson: any;
  dayRewards?: any[];
  thresholds?: any[];
}

export default function EditActivityPage() {
  const params = useParams();
  const id = params.id as string;
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);

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
      default: return '⚙️';
    }
  };

  return (
    <div className="checkin-form-container fade-slide-in">
      <div className="checkin-form-header">
        <div className="checkin-form-header-content">
          <h1>
            <div className="activity-type-icon">{getActivityTypeIcon(activity.activityType)}</div>
            編輯{getActivityTypeName(activity.activityType)}活動
          </h1>
          <p>正在編輯活動：{activity.title}</p>
        </div>
      </div>

      <div className="checkin-form-wrapper">
        <div className="checkin-form-content">
          <ActivityForm 
            fixedActivityType={activity.activityType}
            mode="edit"
            initialData={activity}
            activityId={parseInt(id)}
          />
        </div>
      </div>
    </div>
  );
}