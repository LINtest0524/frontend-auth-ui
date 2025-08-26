'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
    <div className="container mx-auto px-4 py-8">
      {/* 返回按鈕 */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          ← 返回
        </Button>
      </div>

      {/* 活動內容 */}
      <Card className="overflow-hidden">
        {/* 活動圖片 */}
        {promotion.imageUrl && (
          <div className="aspect-video md:aspect-[2/1] overflow-hidden">
            <img
              src={promotion.imageUrl.startsWith('http') ? promotion.imageUrl : `http://localhost:3001${promotion.imageUrl}`}
              alt={promotion.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 md:p-8">
          {/* 標題和狀態 */}
          <div className="mb-4">
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-2xl md:text-3xl font-bold flex-1">
                {promotion.title}
              </h1>
              <div className="ml-4 flex-shrink-0">
                {getStatusBadge(promotion)}
              </div>
            </div>
            
            {promotion.category && (
              <div className="mb-3">
                <Badge variant="outline">
                  {promotion.category.name}
                </Badge>
              </div>
            )}
          </div>

          {/* 活動摘要 */}
          {promotion.summary && (
            <div className="mb-6">
              <div className="text-lg text-gray-700 bg-gray-50 p-4 rounded-lg">
                {promotion.summary}
              </div>
            </div>
          )}

          {/* 活動期間 */}
          {(promotion.startDate || promotion.endDate) && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">活動期間</h3>
              <div className="text-blue-800">
                {promotion.startDate && (
                  <div>開始時間: {formatDate(promotion.startDate)}</div>
                )}
                {promotion.endDate && (
                  <div>結束時間: {formatDate(promotion.endDate)}</div>
                )}
              </div>
            </div>
          )}

          {/* 活動內容 */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">活動詳情</h3>
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: promotion.content }}
            />
          </div>

          {/* 活動資訊 */}
          <div className="border-t pt-6 text-sm text-gray-500">
            <div className="flex flex-wrap gap-4">
              <span>瀏覽次數: {promotion.viewCount}</span>
              <span>發布時間: {formatDate(promotion.createdAt)}</span>
              {promotion.updatedAt !== promotion.createdAt && (
                <span>更新時間: {formatDate(promotion.updatedAt)}</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 返回按鈕 */}
      <div className="mt-8 text-center">
        <Button onClick={() => router.push('/a/promotions')}>
          查看更多優惠活動
        </Button>
      </div>
    </div>
  )
}