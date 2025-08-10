'use client'

import { useState, useEffect } from 'react'
import DesktopMenu from './DesktopMenu'
import MobileMenu from './MobileMenu'

export interface MenuItem {
  id: number
  title: string
  url?: string
  target_blank: boolean
  icon?: string
  sort_order: number
  device_type: 'desktop' | 'mobile' | 'both'
  status: 'active' | 'inactive'
  children?: MenuItem[]
}

interface MenuRendererProps {
  companyId: number
  className?: string
}

export default function MenuRenderer({ companyId, className = '' }: MenuRendererProps) {
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // 檢測是否為手機版
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 載入選單資料
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        // 不在這裡過濾，讓後端返回所有選單，前端再過濾
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/portal/menu?company=${companyId}`
        )
        
        if (response.ok) {
          const data = await response.json()
          // 前端過濾適合當前裝置的選單
          const filteredMenus = filterMenusByDevice(data, isMobile ? 'mobile' : 'desktop')
          setMenus(filteredMenus)
        } else {
          console.error('載入選單失敗:', response.statusText)
          setMenus([])
        }
      } catch (error) {
        console.error('載入選單錯誤:', error)
        setMenus([])
      } finally {
        setLoading(false)
      }
    }

    fetchMenus()
  }, [companyId, isMobile])

  // 過濾選單根據裝置類型
  const filterMenusByDevice = (menus: MenuItem[], currentDevice: 'desktop' | 'mobile'): MenuItem[] => {
    return menus.filter(menu => {
      // 檢查當前選單是否適合當前裝置
      const isDeviceMatch = menu.device_type === 'both' || menu.device_type === currentDevice
      
      if (!isDeviceMatch) {
        return false
      }
      
      // 遞歸過濾子選單
      if (menu.children && menu.children.length > 0) {
        menu.children = filterMenusByDevice(menu.children, currentDevice)
      }
      
      return true
    })
  }

  if (loading) {
    return (
      <div className={`menu-loading ${className}`}>
        <div className="loading-spinner">載入中...</div>
      </div>
    )
  }

  if (menus.length === 0) {
    return null
  }

  return (
    <div className={`menu-renderer ${className}`}>
      {isMobile ? (
        <MobileMenu menus={menus} />
      ) : (
        <DesktopMenu menus={menus} />
      )}
    </div>
  )
}