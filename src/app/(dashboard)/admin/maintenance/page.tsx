'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { toTaiwanDatetimeString, fromDatetimeLocalToTaiwan, toTaiwanDisplayTime } from '@/lib/timeUtils'
import './maintenance.css'

const API_URL = process.env.NEXT_PUBLIC_API_BASE

interface MaintenanceConfig {
  id?: number
  companyId: number
  isEnabled: boolean
  title: string
  message: string
  estimatedEndTime?: string
  contactInfo?: string
  backgroundColor: string
  textColor: string
}

export default function MaintenancePage() {
  const [config, setConfig] = useState<MaintenanceConfig>({
    companyId: 1,
    isEnabled: false,
    title: '系統維護中',
    message: '系統正在進行維護升級，請稍後再試。如有急事請聯繫客服。',
    backgroundColor: '#1f2937',
    textColor: '#ffffff'
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const getToken = () => {
    return localStorage.getItem('token')
  }

  // 載入維護設定
  const loadMaintenanceConfig = async () => {
    setLoading(true)
    try {
      const token = getToken()
      const response = await axios.get(`${API_URL}/maintenance/admin/1`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setConfig(response.data)
    } catch (error) {
      console.error('載入維護設定失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  // 儲存維護設定
  const saveMaintenanceConfig = async () => {
    setSaving(true)
    try {
      const token = getToken()
      const response = await axios.put(`${API_URL}/maintenance/admin/1`, config, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setConfig(response.data)
      alert('維護設定已儲存')
    } catch (error) {
      console.error('儲存維護設定失敗:', error)
      alert('儲存失敗，請稍後再試')
    } finally {
      setSaving(false)
    }
  }

  // 快速切換維護模式
  const toggleMaintenance = async () => {
    try {
      const token = getToken()
      const response = await axios.post(`${API_URL}/maintenance/admin/1/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setConfig(prev => ({ ...prev, isEnabled: response.data.isEnabled }))
      alert(`維護模式已${response.data.isEnabled ? '開啟' : '關閉'}`)
    } catch (error) {
      console.error('切換維護模式失敗:', error)
      alert('操作失敗，請稍後再試')
    }
  }

  useEffect(() => {
    loadMaintenanceConfig()
  }, [])

  const handleInputChange = (field: keyof MaintenanceConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }


  return (
    <div className="maintenance-container">
      <div className="maintenance-header">
        <h1 className="maintenance-title">
          <span className="maintenance-icon">🔧</span>
          維護管理
        </h1>
        <p className="maintenance-subtitle">
          管理系統維護模式，控制前台用戶訪問
        </p>
      </div>

      {loading ? (
        <div className="maintenance-loading">
          <div className="loading-spinner"></div>
          <p>載入中...</p>
        </div>
      ) : (
        <div className="maintenance-content">
          {/* 快速控制區域 */}
          <div className="maintenance-quick-control">
            <div className="quick-control-header">
              <h2>
                <span className="quick-control-icon">⚡</span>
                快速控制
              </h2>
            </div>
            <div className="quick-control-body">
              <div className="status-display">
                <span className="status-label">目前狀態：</span>
                <span className={`status-badge ${config.isEnabled ? 'status-enabled' : 'status-disabled'}`}>
                  {config.isEnabled ? '🔧 維護中' : '✅ 正常運行'}
                </span>
              </div>
              <button
                onClick={toggleMaintenance}
                className={`toggle-btn ${config.isEnabled ? 'btn-disable' : 'btn-enable'}`}
              >
                {config.isEnabled ? '🟢 關閉維護模式' : '🔴 開啟維護模式'}
              </button>
            </div>
          </div>

          {/* 詳細設定區域 */}
          <div className="maintenance-settings">
            <div className="settings-header">
              <h2>
                <span className="settings-icon">⚙️</span>
                維護頁面設定
              </h2>
            </div>
            <div className="settings-body">
              <div className="form-group">
                <label className="form-label">維護標題</label>
                <input
                  type="text"
                  className="form-input"
                  value={config.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="輸入維護頁面標題"
                />
              </div>

              <div className="form-group">
                <label className="form-label">維護訊息</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={config.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="輸入維護頁面顯示的詳細訊息"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">預計結束時間（可選）</label>
                  <DateTimePicker
                    className="form-input"
                    value={toTaiwanDatetimeString(config.estimatedEndTime || '')}
                    onChange={(value) => handleInputChange('estimatedEndTime', value ? fromDatetimeLocalToTaiwan(value, true) : '')}
                    placeholder="請選擇預計結束時間"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">聯絡資訊（可選）</label>
                  <input
                    type="text"
                    className="form-input"
                    value={config.contactInfo || ''}
                    onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                    placeholder="客服電話或 Email"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">背景顏色</label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      className="color-picker"
                      value={config.backgroundColor}
                      onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                    />
                    <input
                      type="text"
                      className="color-text"
                      value={config.backgroundColor}
                      onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                      placeholder="#1f2937"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">文字顏色</label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      className="color-picker"
                      value={config.textColor}
                      onChange={(e) => handleInputChange('textColor', e.target.value)}
                    />
                    <input
                      type="text"
                      className="color-text"
                      value={config.textColor}
                      onChange={(e) => handleInputChange('textColor', e.target.value)}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 預覽區域 */}
          <div className="maintenance-preview">
            <div className="preview-header">
              <h2>
                <span className="preview-icon">👁️</span>
                預覽效果
              </h2>
            </div>
            <div className="preview-body">
              <div 
                className="preview-maintenance-page"
                style={{ 
                  backgroundColor: config.backgroundColor,
                  color: config.textColor
                }}
              >
                <div className="preview-content">
                  <div className="preview-icon">🔧</div>
                  <h1 className="preview-title">{config.title}</h1>
                  <p className="preview-message">{config.message}</p>
                  {config.estimatedEndTime && (
                    <p className="preview-time">
                      預計完成時間：{toTaiwanDisplayTime(config.estimatedEndTime)}
                    </p>
                  )}
                  {config.contactInfo && (
                    <p className="preview-contact">
                      聯絡我們：{config.contactInfo}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="maintenance-actions">
            <button
              onClick={saveMaintenanceConfig}
              disabled={saving}
              className="btn-save"
            >
              {saving ? '儲存中...' : '💾 儲存設定'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}