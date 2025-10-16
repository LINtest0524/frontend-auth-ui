"use client";

import { ActivityForm } from "@/components/checkin/ActivityForm";
import "@/styles/pages/checkin-form.css";

export default function NewFlexCumulativePage() {
  return (
    <div className="checkin-form-container fade-slide-in">
      <div className="checkin-form-header">
        <div className="checkin-form-header-content">
          <h1>
            <div className="activity-type-icon">📈</div>
            新增累積簽到活動
          </h1>
          <p>建立新的期間累積簽到活動，用戶在活動期間內累積簽到天數即可，無需連續簽到</p>
        </div>
      </div>

      <div className="checkin-form-wrapper">
        <div className="checkin-form-content">
          <ActivityForm 
            fixedActivityType="FLEX_CUMULATIVE"
            mode="create"
          />
        </div>
      </div>
    </div>
  );
}