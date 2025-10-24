"use client";

import React, { useState, useEffect } from 'react';
import { toTaiwanDisplayDate, toTaiwanDisplayOnlyTime } from '@/lib/timeUtils';

interface CustomTimePickerProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
}

function CustomTimePicker({ value, onChange, disabled, required, className, id }: CustomTimePickerProps) {
  const [hour, setHour] = useState('00');
  const [minute, setMinute] = useState('00');
  const [second, setSecond] = useState('00');

  // 解析時間值
  useEffect(() => {
    if (value) {
      const [h, m, s] = value.split(':');
      setHour(h || '00');
      setMinute(m || '00');
      setSecond(s || '00');
    } else {
      setHour('00');
      setMinute('00');
      setSecond('00');
    }
  }, [value]);

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHour = e.target.value;
    setHour(newHour);
    const newTime = `${newHour}:${minute}:${second}`;
    // 創建一個模擬的 event 對象
    const mockEvent = {
      target: { value: newTime }
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(mockEvent as any);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinute = e.target.value;
    setMinute(newMinute);
    const newTime = `${hour}:${newMinute}:${second}`;
    // 創建一個模擬的 event 對象
    const mockEvent = {
      target: { value: newTime }
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(mockEvent as any);
  };

  const handleSecondChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSecond = e.target.value;
    setSecond(newSecond);
    const newTime = `${hour}:${minute}:${newSecond}`;
    // 創建一個模擬的 event 對象
    const mockEvent = {
      target: { value: newTime }
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(mockEvent as any);
  };

  // 生成小時選項 (00-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const h = i.toString().padStart(2, '0');
    return <option key={h} value={h}>{h}</option>;
  });

  // 生成分鐘選項 (00-59)
  const minuteOptions = Array.from({ length: 60 }, (_, i) => {
    const m = i.toString().padStart(2, '0');
    return <option key={m} value={m}>{m}</option>;
  });

  // 生成秒數選項 (00-59)
  const secondOptions = Array.from({ length: 60 }, (_, i) => {
    const s = i.toString().padStart(2, '0');
    return <option key={s} value={s}>{s}</option>;
  });

  return (
    <div className="custom-time-picker">
      <select
        value={hour}
        onChange={handleHourChange}
        disabled={disabled}
        required={required}
        className="time-select hour-select"
        id={id ? `${id}-hour` : undefined}
      >
        {hourOptions}
      </select>
      <span className="time-separator">:</span>
      <select
        value={minute}
        onChange={handleMinuteChange}
        disabled={disabled}
        required={required}
        className="time-select minute-select"
        id={id ? `${id}-minute` : undefined}
      >
        {minuteOptions}
      </select>
      <span className="time-separator">:</span>
      <select
        value={second}
        onChange={handleSecondChange}
        disabled={disabled}
        required={required}
        className="time-select second-select"
        id={id ? `${id}-second` : undefined}
      >
        {secondOptions}
      </select>
    </div>
  );
}

interface DateTimePickerProps {
  value?: string; // datetime-local 格式: "2025-10-15T14:30"
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
}

export function DateTimePicker({
  value = '',
  onChange,
  placeholder = '請選擇日期時間',
  disabled = false,
  required = false,
  className = '',
  id
}: DateTimePickerProps) {
  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('');

  // 當外部 value 改變時，分離日期和時間
  useEffect(() => {
    if (value) {
      const [date, time] = value.split('T');
      setDateValue(date || '');
      setTimeValue(time || '');
    } else {
      setDateValue('');
      setTimeValue('');
    }
  }, [value]);

  // 當日期或時間改變時，組合並回傳完整的 datetime-local 值
  const handleDateTimeChange = (newDate: string, newTime: string) => {
    if (newDate && newTime) {
      // 確保時間格式為 HH:mm（去除秒數）
      const normalizedTime = newTime.length > 5 ? newTime.substring(0, 5) : newTime;
      const combinedValue = `${newDate}T${normalizedTime}`;
      onChange(combinedValue);
    } else if (newDate && !newTime) {
      // 如果只選擇了日期但沒有時間，根據 placeholder 決定預設時間
      let defaultTime = '00:00';
      if (placeholder && (placeholder.includes('結束') || placeholder.includes('end') || placeholder.includes('End'))) {
        defaultTime = '23:59';
      }
      const combinedValue = `${newDate}T${defaultTime}`;
      onChange(combinedValue);
    } else if (!newDate && !newTime) {
      onChange('');
    } else {
      // 如果只有部分數據，不要清空整個值
      // 保持原有的值或使用預設值
      return;
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDateValue(newDate);
    handleDateTimeChange(newDate, timeValue);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimeValue(newTime);
    handleDateTimeChange(dateValue, newTime);
  };

  return (
    <div className={`datetime-picker ${className}`}>
      <div className="datetime-picker-container">
        <div className="datetime-picker-date">
          <input
            type="date"
            value={dateValue}
            onChange={handleDateChange}
            disabled={disabled}
            required={required}
            className="datetime-picker-input date-input"
            id={id ? `${id}-date` : undefined}
          />
        </div>
        <div className="datetime-picker-time">
          <CustomTimePicker
            value={timeValue}
            onChange={handleTimeChange}
            disabled={disabled}
            required={required}
            className="datetime-picker-input time-input"
            id={id ? `${id}-time` : undefined}
          />
        </div>
      </div>
      
      <style jsx>{`
        .datetime-picker {
          width: 100%;
        }
        
        .datetime-picker-container {
          display: flex;
          gap: 12px;
          width: 100%;
          align-items: stretch;
        }
        
        .datetime-picker-date {
          flex: 1.5;
          min-width: 140px;
        }
        
        .datetime-picker-time {
          flex: 1.8;
          min-width: 180px;
        }
        
        .datetime-picker-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s ease;
          background-color: white;
        }
        
        .datetime-picker-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .datetime-picker-input:disabled {
          background-color: #f9fafb;
          cursor: not-allowed;
        }
        
        .date-input {
          min-width: 140px;
        }
        
        .time-input {
          min-width: 180px;
        }
        
        /* 自定義時間選擇器樣式 */
        .custom-time-picker {
          display: flex;
          align-items: center;
          gap: 4px;
          width: 100%;
        }
        
        .time-select {
          padding: 8px 6px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 13px;
          background-color: white;
          transition: border-color 0.2s ease;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 6px center;
          background-size: 14px;
          padding-right: 26px;
          min-width: 52px;
        }
        
        .time-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .time-select:disabled {
          background-color: #f9fafb;
          cursor: not-allowed;
        }
        
        .hour-select {
          flex: 1;
        }
        
        .minute-select {
          flex: 1;
        }
        
        .second-select {
          flex: 1;
        }
        
        .time-separator {
          font-weight: bold;
          color: #6b7280;
          font-size: 14px;
          user-select: none;
          line-height: 38px;
          padding: 0 2px;
        }
        
        /* 響應式設計 */
        @media (max-width: 640px) {
          .datetime-picker-container {
            flex-direction: column;
            gap: 6px;
          }
          
          .datetime-picker-date,
          .datetime-picker-time {
            flex: none;
          }
        }
      `}</style>
    </div>
  );
}

// 預設的 CSS 類別（可以在全域 CSS 中使用）
export const dateTimePickerStyles = `
  .form-input.datetime-picker {
    padding: 0;
    border: none;
  }
  
  .form-input.datetime-picker .datetime-picker-input {
    border-color: inherit;
  }
  
  .form-input.datetime-picker.error .datetime-picker-input {
    border-color: #ef4444;
  }
  
  .form-input.datetime-picker:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;