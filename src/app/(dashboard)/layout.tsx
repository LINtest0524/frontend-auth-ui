// frontend/src/app/(dashboard)/layout.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import VerificationNotificationSimple from '@/components/VerificationNotificationSimple'
import DynamicTabs from '@/components/DynamicTabs'
import '@/styles/components/dynamic-tabs.css'

// 權限檢查函數  
const hasPermission = (userRole: string): boolean => {
  const allowedRoles = ['SUPER_ADMIN', 'GLOBAL_ADMIN', 'AGENT_LEVEL_1', 'AGENT_LEVEL_2', 'AGENT_LEVEL_3', 'AGENT_LEVEL_4', 'AGENT_LEVEL_5', 'AGENT_LEVEL_6', 'AGENT_LEVEL_7', 'AGENT_LEVEL_8', 'AGENT_LEVEL_9', 'AGENT_LEVEL_10', 'AGENT_LEVEL_11', 'AGENT_LEVEL_12', 'AGENT_SUPPORT'];
  return allowedRoles.includes(userRole);
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [username, setUsername] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(() => {
    // 從 localStorage 讀取音效設定
    if (typeof window !== 'undefined') {
      return localStorage.getItem('audioEnabled') === 'true'
    }
    return false
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    const stored = localStorage.getItem('user')
    
    // 檢查是否有token和用戶資料
    if (!token || !stored) {
      router.push('/login')
      return
    }
    
    try {
      const user = JSON.parse(stored)
      
      // 檢查權限
      if (!user.role || !hasPermission(user.role)) {
        alert('您沒有權限存取後台管理系統')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
        return
      }
      
      setUsername(user?.username || null)
      setAuthChecked(true)
    } catch (e) {
      console.error('解析登入者失敗', e)
      router.push('/login')
    }
  }, [router])

  const toggleAudio = () => {
    const newState = !audioEnabled
    setAudioEnabled(newState)
    localStorage.setItem('audioEnabled', newState.toString())
    // 驗證通知音效狀態已更新
    
    // 觸發自定義事件通知其他組件
    window.dispatchEvent(new CustomEvent('audioToggle', { 
      detail: { enabled: newState } 
    }))
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  // 如果還在檢查權限，顯示載入中
  if (!authChecked) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>檢查權限中...</div>;
  }

  return (
    <div className="bigbox">

      <Sidebar />


      <div className="b-right-box">


          {username ? (
            <div className="content-tabs">
              {/* 音效開關 */}
              <div style={{ display: 'flex', alignItems: 'center', marginRight: '16px' }}>
                <span style={{ fontSize: '14px', color: '#666', marginRight: '8px' }}>提示音效</span>
                <button
                  onClick={toggleAudio}
                  style={{
                    position: 'relative',
                    display: 'inline-flex',
                    height: '20px',
                    width: '36px',
                    alignItems: 'center',
                    borderRadius: '10px',
                    backgroundColor: audioEnabled ? '#3b82f6' : '#d1d5db',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    outline: 'none'
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      height: '16px',
                      width: '16px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      transform: audioEnabled ? 'translateX(18px)' : 'translateX(2px)',
                      transition: 'transform 0.2s',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                    }}
                  />
                </button>
                <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                  {audioEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
              
              <span className="b-username">{username}</span>
              <button
                onClick={handleLogout}
              >
                登出
              </button>
            </div>
          ) : (
            <span className="">未登入</span>
          )}
      
        {/* 動態頁籤區域 */}
        <DynamicTabs />

        {/* 下方區域：頁面內容 */}
        <div className="b-right-bottom-box">
          {children}
        </div>

      </div>

      {/* 驗證通知組件 */}
      <VerificationNotificationSimple />

    </div>
  )
}
