'use client'

import { useFavoritesStore } from '@/hooks/use-favorites-store'
import { useRouter } from 'next/navigation'

interface MemberFavoritesProps {
  companyCode: string
}

export default function MemberFavorites({ companyCode }: MemberFavoritesProps) {
  const { favorites, removeFromFavorites, clearFavorites } = useFavoritesStore()
  const router = useRouter()

  const handleRemoveItem = (productId: number, productName: string) => {
    if (confirm(`確定要從收藏中移除「${productName}」嗎？`)) {
      removeFromFavorites(productId)
    }
  }

  const handleClearAll = () => {
    if (favorites.length === 0) return
    if (confirm('確定要清空所有收藏嗎？')) {
      clearFavorites()
    }
  }

  const handleGoToProduct = (productId: number) => {
    router.push(`/${companyCode}/products/${productId}`)
  }

  if (favorites.length === 0) {
    return (
      <div className="member-form-container">
        <div className="member-form-header">
          <h3 className="member-form-title">
            <div className="member-form-icon">❤️</div>
            我的最愛
          </h3>
        </div>
        <div className="member-form-content">
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#718096' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💝</div>
            <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>還沒有收藏任何商品</div>
            <div style={{ fontSize: '14px', marginBottom: '20px' }}>快去逛逛商品，加入您喜歡的商品吧！</div>
            <button
              onClick={() => router.push(`/${companyCode}/products`)}
              className="member-form-button"
              style={{ maxWidth: '200px' }}
            >
              🛍️ 去逛逛
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="member-form-container">
      <div className="member-form-header">
        <h3 className="member-form-title">
          <div className="member-form-icon">❤️</div>
          我的最愛 ({favorites.length})
        </h3>
      </div>
      <div className="member-form-content">
        {/* 操作按鈕 */}
        <div style={{ marginBottom: '24px', textAlign: 'right' }}>
          <button
            onClick={handleClearAll}
            className="member-verification-btn danger"
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            🗑️ 清空收藏
          </button>
        </div>

        {/* 收藏商品列表 */}
        <div className="favorites-simple-grid">
          {favorites.map((item) => (
            <div key={item.id} className="favorite-simple-card">
              {/* 商品圖片 */}
              <div className="favorite-simple-image">
                {item.thumbnail ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_BASE}${item.thumbnail}`}
                    alt={item.name}
                    onClick={() => handleGoToProduct(item.id)}
                  />
                ) : (
                  <div className="favorite-simple-no-image" onClick={() => handleGoToProduct(item.id)}>
                    📦
                  </div>
                )}
              </div>

              {/* 商品資訊 */}
              <div className="favorite-simple-info">
                <h4 className="favorite-simple-name" onClick={() => handleGoToProduct(item.id)}>
                  {item.name}
                </h4>
              </div>

              {/* 操作按鈕 */}
              <div className="favorite-simple-actions">
                <button
                  onClick={() => handleGoToProduct(item.id)}
                  className="favorite-simple-btn primary"
                >
                  查看
                </button>
                <button
                  onClick={() => handleRemoveItem(item.id, item.name)}
                  className="favorite-simple-btn secondary"
                >
                  移除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}