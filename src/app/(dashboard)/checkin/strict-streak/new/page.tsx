"use client";

import { ActivityForm } from "@/components/checkin/ActivityForm";
import "@/styles/pages/checkin-form.css";

export default function NewStrictStreakPage() {
  return (
    <div className="checkin-form-container fade-slide-in">
      <div className="checkin-form-header">
        <div className="checkin-form-header-content">
          <h1>
            <div className="activity-type-icon">🎯</div>
            新增連續簽到活動
          </h1>
          <p>建立新的嚴格連續簽到活動，用戶必須連續簽到才能獲得獎勵，漏簽將重新開始計算</p>
        </div>
      </div>

      <div className="checkin-form-wrapper">
        <div className="checkin-form-content">
          <ActivityForm 
            fixedActivityType="STRICT_STREAK_7"
            mode="create"
          />
        </div>
      </div>
    </div>
  );
}