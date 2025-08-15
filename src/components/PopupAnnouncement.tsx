'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type PopupAnnouncement = {
  id: number
  title: string
  desktop_image_url?: string
  mobile_image_url?: string
  button_text?: string
  button_url?: string
  sort_order: number
  status: string
  start_date?: string
  end_date?: string
  company_code: string
}

interface PopupAnnouncementProps {
  companyCode: string
}

export default function PopupAnnouncement({ companyCode }: PopupAnnouncementProps) {
  const [announcements, setAnnouncements] = useState<PopupAnnouncement[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [hideToday, setHideToday] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const pathname = usePathname()

  // 檢查是否為登入或註冊頁面
  const isLoginOrRegisterPage = pathname?.includes('/login') || pathname?.includes('/register')

  useEffect(() => {
    // 檢測設備類型
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    // 如果是登入或註冊頁面，不顯示彈窗
    if (isLoginOrRegisterPage) {
      return
    }

    // 只在首頁顯示彈窗公告
    const isHomePage = pathname === `/${companyCode}` || pathname === `/portal/${companyCode}` || pathname === `/portal/${companyCode}/home`
    
    if (!isHomePage) {
      return
    }

    // 檢查今日是否已隱藏彈窗
    const today = new Date().toISOString().split('T')[0]
    const hiddenKey = `hiddenPopups_${companyCode}_${today}`
    const isHiddenToday = localStorage.getItem(hiddenKey) === 'true'
    
    if (isHiddenToday) {
      return // 今日已隱藏，不顯示彈窗
    }

    // 獲取彈窗公告資料
    const params = new URLSearchParams()
    params.append('company', companyCode)

    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/popup-announcements?${params.toString()}`)
      .then(res => res.ok ? res.json() : [])
      .then((data: PopupAnnouncement[]) => {
        if (data.length > 0) {
          setAnnouncements(data)
          setCurrentIndex(0)
          setIsVisible(true)
        }
      })
      .catch(() => setAnnouncements([]))
  }, [companyCode, isLoginOrRegisterPage, pathname])

  const handleClose = () => {
    // 如果還有下一則公告，顯示下一則
    if (currentIndex < announcements.length - 1) {
      // 開始淡出動畫
      setIsTransitioning(true)
      
      // 300ms 後切換到下一則並淡入
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1)
        setHideToday(false) // 重置隱藏選項
        setIsTransitioning(false)
      }, 300)
    } else {
      // 最後一則，關閉彈窗
      setIsVisible(false)
    }
  }

  const handleHideToday = () => {
    // 記錄到 localStorage 今日不再顯示
    const today = new Date().toISOString().split('T')[0]
    const hiddenKey = `hiddenPopups_${companyCode}_${today}`
    localStorage.setItem(hiddenKey, 'true')
    
    // 關閉彈窗
    setIsVisible(false)
  }

  const handleButtonClick = () => {
    const currentAnnouncement = announcements[currentIndex]
    if (currentAnnouncement.button_url) {
      window.open(currentAnnouncement.button_url, '_blank')
    }
  }

  if (!isVisible || announcements.length === 0 || isLoginOrRegisterPage) {
    return null
  }

  const currentAnnouncement = announcements[currentIndex]
  const isLastAnnouncement = currentIndex === announcements.length - 1
  const imageUrl = isMobile && currentAnnouncement.mobile_image_url 
    ? currentAnnouncement.mobile_image_url 
    : currentAnnouncement.desktop_image_url

  return (
    <>
      {/* 背景遮罩 - 覆蓋全畫面，固定位置 */}
      <div className="popup-overlay">
        {/* 彈窗內容 */}
        <div className={`popup-container ${isTransitioning ? 'transitioning' : ''}`}>
          
          {/* 圖片 */}
          {imageUrl && (
            <div className="popup-image-container">
              <img
                src={`${process.env.NEXT_PUBLIC_API_BASE}${imageUrl}`}
                alt={currentAnnouncement.title}
                className="popup-image"
              />
            </div>
          )}

           {/* 關閉按鈕 */}
          <div className="popup-header">
            <button
              onClick={handleClose}
              className="popup-close-btn"
            >
              ×
            </button>
          </div>

          {/* 按鈕和選項 */}
          <div className="popup-content">
            {/* 進度指示器 */}
            {announcements.length > 1 && (
              <div className="popup-progress">
                {currentIndex + 1} / {announcements.length}
              </div>
            )}

            {/* 行動按鈕 */}
            {currentAnnouncement.button_text && currentAnnouncement.button_url && (
              <button
                onClick={handleButtonClick}
                className="popup-action-btn"
              >
                {currentAnnouncement.button_text}
              </button>
            )}

            

            {/* 今日不再顯示選項（只在最後一則顯示） */}
            {isLastAnnouncement && (
              <div className="popup-hide-option">
                <input
                  type="checkbox"
                  id="hideToday"
                  checked={hideToday}
                  onChange={(e) => setHideToday(e.target.checked)}
                  className="popup-checkbox"
                />
                <label htmlFor="hideToday" className="popup-checkbox-label">
                  今日不再顯示
                </label>
              </div>
            )}

            {/* 確認按鈕（最後一則且勾選今日不再顯示時） */}
            {isLastAnnouncement && hideToday && (
              <button
                onClick={handleHideToday}
                className="popup-confirm-btn"
              >
                確認
              </button>
            )}




          </div>
        </div>
      </div>

      <style jsx>{`
        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(2px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeInOverlay 0.3s ease-out;
        }

        .popup-container {
          
          border-radius: 16px;
          max-width: 480px;
          width: 100%;
          height: 90vh;
          overflow: hidden;
          position: relative;
          animation: fadeInPopup 0.4s ease-out;
          transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
        }

        .popup-container.transitioning {
          opacity: 0;
          transform: scale(0.95);
        }

        .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          display: flex;
          justify-content: center;
          align-items: center;
          position: absolute;
          top: 0;
          right: 0;
          z-index: 6;
        }

        .popup-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .popup-close-btn {
          background: #ffdb0b;
          width:50px;
          height:50px;
          border: none;
          font-size: 50px;
          color: #1a1a1a;
          cursor: pointer;
          padding: 4px;
          border-radius: 100px;
          transition: all 0.2s ease;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .popup-close-btn:hover {
          color: #252525;
          background-color: #f3f4f6;
        }

        .popup-image-container {
          position: relative;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .popup-image {
          max-height: 65vh;
          object-fit: cover;
          display: block;
        }

        .popup-content {
          padding: 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .popup-progress {
          text-align: center;
          font-size: 14px;
          color: #e0e0e0;
          font-weight: 500;
        }

        .popup-action-btn {
          margin-top: 16px;
          box-shadow: rgba(251, 195, 35, 0.48) 0px 8px 16px 0px, rgba(251, 195, 35, 0.72) 0px -3px 0px 0px inset, rgba(250, 250, 250, 0.32) 0px 2px 4px 0px inset;
          background-color: #ffdb0b;
          color: #333;
          border: none;
          padding: 14px 25px;
          border-radius: 100px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          justify-content: center;
          align-items: center;
          width: fit-content;
          min-width: 150px;
        }

        .popup-action-btn:hover {
          background: linear-gradient(135deg, #fcff2eff 0%, #ccbe01ff 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px 0 rgba(211, 137, 0, 0.4);
        }

        .popup-hide-option {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 20px 0;
          padding: 12px;
          background: #fff;
          border-radius: 8px;
        }

        .popup-checkbox {
          width: 25px;
          height: 25px;
          accent-color: #3b82f6;
          cursor: pointer;
          margin-right: 20px;
        }

        .popup-checkbox-label {
          font-size: 14px;
          color: #374151;
          cursor: pointer;
          user-select: none;
        }

        .popup-confirm-btn {
          width: 100%;
          background: #6b7280;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .popup-confirm-btn:hover {
          background: #4b5563;
        }

        @keyframes fadeInOverlay {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeInPopup {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* 響應式設計 */
        @media (max-width: 640px) {
          .popup-overlay {
            padding: 16px;
          }
          
          .popup-container {
            max-width: 100%;
            border-radius: 12px;
          }
          
          .popup-header {
            padding: 16px 20px;
          }
          
          .popup-title {
            font-size: 16px;
          }
          
          .popup-content {
            padding: 20px;
          }
        }
      `}</style>
    </>
  )
}