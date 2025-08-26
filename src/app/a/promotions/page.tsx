'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCompanySlug } from '@/hooks/useCompanySlug'

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
      let url = `http://localhost:3001/promotions/active`
      if (selectedCategory) {
        url += `?categoryId=${selectedCategory}`
      }
      
      const token = localStorage.getItem('token')
      const response = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (response.ok) {
        const data = await response.json()
        // 檢查回應格式，確保是陣列
        const promotionsData = Array.isArray(data) ? data : (data.promotions || [])
        setPromotions(promotionsData)
      } else {
        console.error('API 回應錯誤:', response.status)
        setPromotions([])
      }
    } catch (error) {
      console.error('獲取優惠活動失敗:', error)
      setPromotions([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/promotion-categories/active`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (response.ok) {
        const data = await response.json()
        setCategories(Array.isArray(data) ? data : [])
      } else {
        console.error('獲取活動類型失敗:', response.status)
        setCategories([])
      }
    } catch (error) {
      console.error('獲取活動類型失敗:', error)
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
      return <Badge variant="destructive">停用</Badge>
    }

    const status = getPromotionStatus(promotion);
    switch (status) {
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
    return new Date(dateString).toLocaleDateString('zh-TW')
  }

  const handlePromotionClick = (promotionId: number) => {
    router.push(`/a/promotions/${promotionId}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">載入中...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">優惠活動</h1>
        
        {/* 分類篩選 */}
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-6">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              全部
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* 活動列表 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {promotions.map((promotion) => (
          <Card 
            key={promotion.id} 
            className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handlePromotionClick(promotion.id)}
          >
            {/* 圖片 */}
            {promotion.imageUrl && (
              <div className="aspect-video overflow-hidden">
                <img
                  src={promotion.imageUrl.startsWith('http') ? promotion.imageUrl : `http://localhost:3001${promotion.imageUrl}`}
                  alt={promotion.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            
            {/* 內容 */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold line-clamp-2 flex-1">
                  {promotion.title}
                </h3>
                <div className="ml-2 flex-shrink-0">
                  {getStatusBadge(promotion)}
                </div>
              </div>
              
              {promotion.category && (
                <div className="mb-2">
                  <Badge variant="outline" className="text-xs">
                    {promotion.category.name}
                  </Badge>
                </div>
              )}
              
              {promotion.summary && (
                <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                  {promotion.summary}
                </p>
              )}
              
              <div className="text-xs text-gray-500 space-y-1">
                {(promotion.startDate || promotion.endDate) && (
                  <div>
                    活動期間: {formatDate(promotion.startDate)} 
                    {promotion.endDate && ` ~ ${formatDate(promotion.endDate)}`}
                  </div>
                )}
                <div className="flex justify-between">
                  <span>瀏覽 {promotion.viewCount} 次</span>
                  <span>{formatDate(promotion.createdAt)}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {promotions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            {selectedCategory ? '此分類目前沒有優惠活動' : '目前沒有優惠活動'}
          </div>
        </div>
      )}
    </div>
  )
}