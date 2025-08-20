'use client'

import { useUserStore } from '@/hooks/use-user-store'
import { useCompanySlug } from '@/hooks/useCompanySlug'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getUser, getToken, logout } from '@/lib/useAuth'
import { logoutWithRecord } from '@/lib/logout'
import MenuRenderer from './menu/MenuRenderer'
import '../../src/app/a/styles/index.css'
import '../../src/styles/components/menu.css'


export default function PortalHeaderBar() {
  const { user, setUser } = useUserStore()
  const company = useCompanySlug() //   這行取得公司代碼
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [companyId, setCompanyId] = useState<number | null>(null)
  const [logo, setLogo] = useState<any>(null)

  const fetchLogo = async (companyCode: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/logo?company=${companyCode}`)
      if (response.ok) {
        const logoData = await response.json()
        setLogo(logoData)
      }
    } catch (error) {
      console.error('獲取 LOGO 失敗:', error)
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  // 取得公司 ID
  useEffect(() => {
    const fetchCompanyId = async () => {
      if (company) {
        try {
          // 根據公司代碼取得公司 ID
          // 這裡假設 'a' 對應 ID 1, 'b' 對應 ID 2，你可以根據實際情況調整
          const companyMap: { [key: string]: number } = {
            'a': 1,
            'b': 2,
          }
          
          const id = companyMap[company]
          if (id) {
            setCompanyId(id)
            // 獲取公司 LOGO
            fetchLogo(company)
          }
        } catch (error) {
          console.error('取得公司 ID 失敗:', error)
        }
      }
    }

    fetchCompanyId()
  }, [company])

  useEffect(() => {
    // 從 localStorage 恢復用戶狀態，使用公司代碼
    if (typeof window !== 'undefined' && company && !user) {
      const savedUser = getUser(company)
      if (savedUser) {
        try {
          setUser(savedUser)
        } catch (error) {
          console.error('解析用戶資料失敗:', error)
          logout(company)
        }
      }
    }
  }, [company, user, setUser])

  const handleLogout = async () => {
    if (company) {
      // 使用新的登出功能，會記錄登出紀錄
      await logoutWithRecord(company)
      setUser(null)
      router.push(`/${company}`) //   登出後回到首頁
    }
  }

  const handleGoToMember = () => {
    router.push(`/${company}/member`) //   點會員去會員中心
  }

  if (!mounted) return null

  return (
    <>
      {/* LOGO 區塊 */}
      {logo && (
        <div className="f-logo" style={{
          position: 'fixed',
          top: '25px',
          left: '45px',
          zIndex: 1000,
        }}>
          <img
            src={`${process.env.NEXT_PUBLIC_API_BASE}${logo.image_url}`}
            alt={logo.title}
            style={{
              maxWidth: '120px',
              maxHeight: '60px',
              objectFit: 'contain'
            }}
          />
        </div>
      )}

      <div className="header-box fo5">
        <div className="header-left">
          <h1></h1>
          {companyId && <MenuRenderer companyId={companyId} />}
        </div>
        {!user ? (
          <div className="fl6">
            <a href={`/${company}/register`} className="f-btn-2">註冊</a>
            <a href={`/${company}/login`} className="f-btn-1">登入</a>
          </div>
        ) : (
          <div className="fl6">
            <button onClick={handleGoToMember} className="usernamebox" title="查看會員中心">
              {user.username}
            </button>
            <button onClick={handleLogout} className="f-btn-2">登出</button>
          </div>
        )}
      </div>
    </>
  )
}
