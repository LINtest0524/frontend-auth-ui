'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCompanySlug } from '@/hooks/useCompanySlug'
import '@/styles/pages/promotion-detail-luxury.css'

interface PromotionCategory {
  id: number
  name: string
}

interface Promotion {
  id: number
  title: string
  summary: string
  content: string
  imageUrl: string
  startDate: string
  endDate: string
  viewCount: number
  createdAt: string
  updatedAt: string
  category: PromotionCategory
  status: 'upcoming' | 'active' | 'expired'
}

export default function PromotionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const companySlug = useCompanySlug()
  const id = params.id as string
  
  const [promotion, setPromotion] = useState<Promotion | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (companySlug && id) {
      fetchPromotion()
    }
  }, [companySlug, id])

  const fetchPromotion = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/${companySlug}/promotions/${id}`)

      if (response.ok) {
        const data = await response.json()
        setPromotion(data)
        
        // 增加瀏覽次數
        incrementViewCount()
      } else {
        router.push('/a/promotions')
      }
    } catch (error) {
      console.error('獲取優惠活動失敗:', error)
      router.push('/a/promotions')
    } finally {
      setLoading(false)
    }
  }

  const incrementViewCount = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/${companySlug}/promotions/${id}/view`, {
        method: 'POST'
      })
    } catch (error) {
      console.error('更新瀏覽次數失敗:', error)
    }
  }

  const getStatusBadge = (promotion: Promotion) => {
    switch (promotion.status) {
      case 'upcoming':
        return <Badge variant="outline">即將開始</Badge>
      case 'active':
        return <Badge variant="default">進行中</Badge>
      case 'expired':
        return <Badge variant="destructive">已結束</Badge>
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">載入中...</div>
      </div>
    )
  }

  if (!promotion) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">找不到此優惠活動</h1>
          <Button onClick={() => router.push('/a/promotions')}>
            返回優惠活動列表
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="promotion-detail-luxury">
      {/* 精緻背景 */}
      <div className="luxury-bg-pattern"></div>
      
      {/* 返回按鈕 - 浮動設計 */}
      <div className="luxury-back-btn">
        <button
          onClick={() => router.back()}
          className="back-btn-elegant"
        >
          <svg className="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>返回</span>
        </button>
      </div>

      {/* 主要內容容器 */}
      <div className="luxury-container">
        {/* 英雄區域 */}
        <div className="luxury-hero">
          {/* 活動圖片 */}
          {promotion.imageUrl && (
            <div className="luxury-image-container">
              <div className="luxury-image-overlay"></div>
              <img
                src={promotion.imageUrl.startsWith('http') ? promotion.imageUrl : `http://localhost:3001${promotion.imageUrl}`}
                alt={promotion.title}
                className="luxury-hero-image"
              />
              
              {/* 浮動狀態標籤 */}
              <div className="luxury-status-float">
                {getStatusBadge(promotion)}
              </div>
            </div>
          )}

          {/* 標題區域 */}
          <div className="luxury-title-section">
            <div className="luxury-title-container">
              {promotion.category && (
                <div className="luxury-category">
                  <span className="luxury-category-badge">
                    {promotion.category.name}
                  </span>
                </div>
              )}
              
              <h1 className="luxury-title">
                {promotion.title}
              </h1>
              
              {promotion.summary && (
                <p className="luxury-subtitle">
                  {promotion.summary}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 內容區域 */}
        <div className="luxury-content-wrapper">
          {/* 活動期間卡片 */}
          {(promotion.startDate || promotion.endDate) && (
            <div className="luxury-period-card">
              <div className="luxury-period-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div className="luxury-period-content">
                <h3 className="luxury-period-title">活動期間</h3>
                <div className="luxury-period-dates">
                  {promotion.startDate && (
                    <div className="luxury-date-item">
                      <span className="date-label">開始</span>
                      <span className="date-value">{formatDate(promotion.startDate)}</span>
                    </div>
                  )}
                  {promotion.endDate && (
                    <div className="luxury-date-item">
                      <span className="date-label">結束</span>
                      <span className="date-value">{formatDate(promotion.endDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 活動詳情 */}
          <div className="luxury-content-card">
            <div className="luxury-content-header">
              <div className="luxury-content-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
              </div>
              <h2 className="luxury-content-title">活動詳情</h2>
            </div>
            
            <div className="luxury-content-body">
              <div 
                className="luxury-prose"
                dangerouslySetInnerHTML={{ __html: promotion.content }}
              />
            </div>
          </div>

          {/* 活動資訊卡片 */}
          <div className="luxury-info-card">
            <div className="luxury-info-grid">
              <div className="luxury-info-item">
                <div className="info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
                <div className="info-content">
                  <span className="info-label">瀏覽次數</span>
                  <span className="info-value">{promotion.viewCount.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="luxury-info-item">
                <div className="info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                </div>
                <div className="info-content">
                  <span className="info-label">發布時間</span>
                  <span className="info-value">{formatDate(promotion.createdAt)}</span>
                </div>
              </div>
              
              {promotion.updatedAt !== promotion.createdAt && (
                <div className="luxury-info-item">
                  <div className="info-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="23 4 23 10 17 10"/>
                      <polyline points="1 20 1 14 7 14"/>
                      <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                    </svg>
                  </div>
                  <div className="info-content">
                    <span className="info-label">更新時間</span>
                    <span className="info-value">{formatDate(promotion.updatedAt)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 底部行動按鈕 */}
        <div className="luxury-action-section">
          <button 
            onClick={() => router.push('/a/promotions')}
            className="luxury-action-btn"
          >
            <span>探索更多優惠</span>
            <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}