'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCompanySlug } from '@/hooks/useCompanySlug'
import '@/styles/pages/promotions-frontend.css'

interface PromotionCategory {
  id: number
  name: string
}

interface Promotion {
  id: number
  title: string
  summary: string
  imageUrl: string
  startDate: string
  endDate: string
  viewCount: number
  createdAt: string
  category: PromotionCategory
  isActive: boolean
}

export default function PromotionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const companySlug = useCompanySlug()
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [categories, setCategories] = useState<PromotionCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

  useEffect(() => {
    if (companySlug) {
      fetchPromotions()
      fetchCategories()
    }
  }, [companySlug, selectedCategory])

  const fetchPromotions = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
      let url = `${apiBase}/portal/promotions?company=${companySlug}`
      if (selectedCategory) {
        url += `&categoryId=${selectedCategory}`
      }
      
      const token = localStorage.getItem(`portalToken_${companySlug}`)
      const response = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (response.ok) {
        const data = await response.json()
        // 檢查回應格式，確保是陣列
        const promotionsData = Array.isArray(data) ? data : (data.promotions || [])
        setPromotions(promotionsData)
      } else {
        // API 回應錯誤，靜默處理
        setPromotions([])
      }
    } catch (error) {
      // 獲取優惠活動失敗，靜默處理
      setPromotions([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${apiBase}/portal/promotions/categories?company=${companySlug}`)

      if (response.ok) {
        const data = await response.json()
        setCategories(Array.isArray(data) ? data : [])
      } else {
        // 獲取活動類型失敗，靜默處理
        setCategories([])
      }
    } catch (error) {
      // 獲取活動類型失敗，靜默處理
      setCategories([])
    }
  }

  const getPromotionStatus = (promotion: Promotion): 'upcoming' | 'active' | 'expired' => {
    const now = new Date();
    
    if (promotion.startDate && now < new Date(promotion.startDate)) {
      return 'upcoming';
    }
    
    if (promotion.endDate && now > new Date(promotion.endDate)) {
      return 'expired';
    }
    
    return 'active';
  };

  const getStatusBadge = (promotion: Promotion) => {
    if (!promotion.isActive) {
      return <span className="status-badge inactive">停用</span>
    }

    const status = getPromotionStatus(promotion);
    switch (status) {
      case 'upcoming':
        return <span className="status-badge upcoming">即將開始</span>
      case 'active':
        return <span className="status-badge active">進行中</span>
      case 'expired':
        return <span className="status-badge expired">已結束</span>
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('zh-TW')
  }

  const handlePromotionClick = (promotionId: number) => {
    // 保持原有的查詢參數（如 agent 參數）
    const currentParams = new URLSearchParams(searchParams.toString())
    const queryString = currentParams.toString()
    const promotionUrl = `/a/promotions/${promotionId}${queryString ? `?${queryString}` : ''}`
    router.push(promotionUrl)
  }

  if (loading) {
    return (
      <div className="promotions-page">
        <div className="promotions-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">載入中...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="promotions-page">
        <div className="promotions-container">
          {/* 頁面標題 */}
          <div className="promotions-header">
            <h1 className="promotions-title">優惠活動</h1>
            <p className="promotions-subtitle">探索最新的優惠活動與特別企劃</p>
          </div>
          
          {/* 分類篩選 */}
          {categories.length > 0 && (
            <div className="category-filters">
              <button
                className={`category-btn ${selectedCategory === null ? 'active' : ''}`}
                onClick={() => setSelectedCategory(null)}
              >
                全部
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}

          {/* 活動列表 */}
          <div className="promotions-grid">
            {promotions.map((promotion, index) => (
              <div 
                key={promotion.id} 
                className="promotion-card"
                onClick={() => handlePromotionClick(promotion.id)}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* 圖片 */}
                <div className="promotion-image">
                  {promotion.imageUrl ? (
                    <img
                      src={promotion.imageUrl.startsWith('http') ? promotion.imageUrl : `http://localhost:3001${promotion.imageUrl}`}
                      alt={promotion.title}
                    />
                  ) : (
                    <div className="promotion-image-placeholder">
                      🎁
                    </div>
                  )}
                  
                  {/* 分類標籤 - 右上角 */}
                  {promotion.category && (
                    <div className="category-tag">
                      {promotion.category.name}
                    </div>
                  )}
                </div>
                
                {/* 內容 */}
                <div className="promotion-content">
                  <div className="promotion-header">
                    <h3 className="promotion-title">
                      {promotion.title}
                    </h3>
                    <div className="promotion-status">
                      {getStatusBadge(promotion)}
                    </div>
                  </div>
                  
                  <div className="promotion-info">
                    {(promotion.startDate || promotion.endDate) && (
                      <div className="promotion-period">
                        {formatDate(promotion.startDate)} 
                        {promotion.endDate && ` ~ ${formatDate(promotion.endDate)}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {promotions.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🎪</div>
              <div className="empty-title">
                {selectedCategory ? '此分類目前沒有優惠活動' : '目前沒有優惠活動'}
              </div>
              <div className="empty-description">
                請稍後再來查看，或選擇其他分類瀏覽
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}