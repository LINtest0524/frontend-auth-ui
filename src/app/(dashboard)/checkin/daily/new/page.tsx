"use client";

import { ActivityForm } from "@/components/checkin/ActivityForm";
import "@/styles/pages/checkin-form.css";

export default function NewDailyPage() {
  return (
    <div className="checkin-form-container fade-slide-in">
      <div className="checkin-form-header">
        <div className="checkin-form-header-content">
          <h1>
            <div className="activity-type-icon">📅</div>
            新增每日簽到活動
          </h1>
          <p>建立新的每日日曆簽到活動，按照日曆格式展示，用戶可選擇任意日期簽到領取獎勵</p>
        </div>
      </div>

      <div className="checkin-form-wrapper">
        <div className="checkin-form-content">
          <ActivityForm 
            fixedActivityType="DAILY_CALENDAR"
            mode="create"
          />
        </div>
      </div>
    </div>
  );
}