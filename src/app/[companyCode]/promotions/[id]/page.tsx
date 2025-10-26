'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

type Promotion = {
  id: number
  title: string
  description: string
  content: string
  image_url?: string
  start_date: string
  end_date: string
  is_active: boolean
  category: string
  view_count: number
}

export default function PromotionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const companyCode = params.companyCode as string
  const promotionId = params.id as string
  
  const [promotion, setPromotion] = useState<Promotion | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPromotion = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/promotions/${promotionId}?company=${companyCode}`)
        
        if (response.ok) {
          const data = await response.json()
          setPromotion(data)
          
          // 增加瀏覽次數
          incrementViewCount()
        } else {
          console.error('Promotion not found')
          router.push(`/${companyCode}/promotions`)
        }
      } catch (error) {
        console.error('Error fetching promotion:', error)
        router.push(`/${companyCode}/promotions`)
      } finally {
        setLoading(false)
      }
    }

    const incrementViewCount = async () => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/promotions/${promotionId}/view?company=${companyCode}`, {
          method: 'POST'
        })
      } catch (error) {
        console.error('Error incrementing view count:', error)
      }
    }

    if (promotionId && companyCode) {
      fetchPromotion()
    }
  }, [promotionId, companyCode, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  if (!promotion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">促銷活動不存在</h1>
          <Button onClick={() => router.push(`/${companyCode}/promotions`)}>
            返回促銷活動列表
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 返回按鈕 */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push(`/${companyCode}/promotions`)}
            className="mb-4"
          >
            ← 返回促銷活動列表
          </Button>
        </div>

        {/* 促銷活動詳細內容 */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* 促銷活動圖片 */}
          {promotion.image_url && (
            <div className="w-full h-64 md:h-96">
              <img
                src={`${process.env.NEXT_PUBLIC_API_BASE}${promotion.image_url}`}
                alt={promotion.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}

          {/* 促銷活動資訊 */}
          <div className="p-6 md:p-8">
            {/* 標題和基本資訊 */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {promotion.category}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  promotion.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {promotion.is_active ? '進行中' : '已結束'}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {promotion.title}
              </h1>

              <div className="text-gray-600 mb-4">
                <p className="text-lg mb-2">{promotion.description}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span>開始時間: {new Date(promotion.start_date).toLocaleString()}</span>
                  <span>結束時間: {new Date(promotion.end_date).toLocaleString()}</span>
                  <span>瀏覽次數: {promotion.view_count}</span>
                </div>
              </div>
            </div>

            {/* 促銷活動內容 */}
            <div className="prose prose-lg max-w-none">
              <div
                dangerouslySetInnerHTML={{ __html: promotion.content }}
                className="promotion-content"
              />
            </div>
          </div>
        </div>

        {/* 底部操作按鈕 */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => router.push(`/${companyCode}/promotions`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
          >
            瀏覽更多促銷活動
          </Button>
        </div>
      </div>
    </div>
  )
}