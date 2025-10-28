'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useCartStore } from '@/hooks/use-cart-store-new'
import { useFavoritesStore } from '@/hooks/use-favorites-store'
import './product-detail.css'
import { sanitizeHtml } from '@/lib/sanitize'

interface FavoriteItem {
  id: number
  name: string
  price: number
  original_price?: number
  thumbnail?: string
  sku: string
  addedAt: string
  hasVariants?: boolean
  variantImages?: string[]
}

interface ProductVariant {
  id: number
  variant_name: string
  sku: string
  price: number
  original_price?: number
  stock_quantity: number
  variant_options: Record<string, string>
  images?: string[]
  is_default: boolean
}

interface Product {
  id: number
  name: string
  sku: string
  price: number
  original_price?: number
  short_description?: string
  description?: string
  specifications_description?: string
  shipping_description?: string
  thumbnail?: string
  images?: string[]
  is_featured: boolean
  stock_quantity?: number
  category?: {
    id: number
    name: string
  }
  specifications?: Array<{key: string, value: string}> | Record<string, any>
  shipping_rules?: Array<{
    method: string
    base_fee: number
    free_shipping_threshold: number
  }>
  tags?: string[]
  variants?: ProductVariant[]
  created_at: string
  updated_at: string
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string
  const companyCode = params.companyCode as string
  
  // 購物車狀態
  const { addItem, getTotalItems } = useCartStore()
  const totalItems = getTotalItems()
  
  // 收藏功能狀態
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavoritesStore()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({})
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [variantThumbnailIndex, setVariantThumbnailIndex] = useState(0)

  // 獲取變體選項（從變體中提取）
  const getVariantOptions = () => {
    if (!product?.variants || product.variants.length === 0) return {}
    
    const options: Record<string, string[]> = {}
    product.variants.forEach(variant => {
      Object.entries(variant.variant_options).forEach(([key, value]) => {
        if (!options[key]) {
          options[key] = []
        }
        if (!options[key].includes(value)) {
          options[key].push(value)
        }
      })
    })
    return options
  }

  // 根據選擇的規格找到對應的變體
  const findMatchingVariant = (specs: Record<string, string>) => {
    if (!product?.variants) return null
    
    return product.variants.find(variant => {
      return Object.entries(specs).every(([key, value]) => 
        variant.variant_options[key] === value
      )
    })
  }

  // 檢查某個規格選項是否有庫存
  const isOptionAvailable = (optionKey: string, optionValue: string) => {
    if (!product?.variants) return true
    
    const tempSpecs = { ...selectedSpecs, [optionKey]: optionValue }
    const variant = findMatchingVariant(tempSpecs)
    return variant ? variant.stock_quantity > 0 : false
  }

  // 獲取當前選擇的庫存數量
  const getCurrentStock = () => {
    if (selectedVariant) {
      return selectedVariant.stock_quantity
    }
    return product?.stock_quantity || 0
  }

  // 獲取當前價格
  const getCurrentPrice = () => {
    if (selectedVariant) {
      return selectedVariant.price
    }
    return product?.price || 0
  }

  // 獲取當前原價
  const getCurrentOriginalPrice = () => {
    if (selectedVariant) {
      return selectedVariant.original_price
    }
    return product?.original_price
  }

  // 載入產品資料
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/product/${productId}?company=${companyCode}`)
        if (response.ok) {
          const data = await response.json()
          setProduct(data)
          
          // 如果有變體，設置默認變體
          if (data.variants && data.variants.length > 0) {
            const defaultVariant = data.variants.find((v: ProductVariant) => v.is_default) || data.variants[0]
            setSelectedVariant(defaultVariant)
            setSelectedSpecs(defaultVariant.variant_options)
          }
        }
      } catch (error) {
        console.error('載入產品失敗:', error)
      } finally {
        setLoading(false)
      }
    }

    if (productId && companyCode) {
      fetchProduct()
    }
  }, [productId, companyCode])

  // 處理加入購物車
  const handleAddToCart = () => {
    if (!product) return
    
    const hasVariants = product.variants && product.variants.length > 0
    
    if (hasVariants && !selectedVariant) {
      alert('請選擇商品規格')
      return
    }
    
    // 檢查庫存
    const stock = getCurrentStock()
    if (stock < quantity) {
      alert('庫存不足')
      return
    }
    
    const cartItem = {
      id: selectedVariant ? selectedVariant.id : product.id,
      productId: product.id,
      name: product.name,
      price: getCurrentPrice(),
      quantity: quantity,
      thumbnail: product.thumbnail,
      sku: selectedVariant ? selectedVariant.sku : product.sku,
      variant: selectedVariant ? {
        id: selectedVariant.id,
        name: selectedVariant.variant_name,
        options: selectedVariant.variant_options
      } : undefined
    }
    
    addItem(cartItem)
    alert('已加入購物車')
  }

  // 處理收藏
  const handleToggleFavorite = () => {
    if (!product) return
    
    const favoriteItem: FavoriteItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      original_price: product.original_price,
      thumbnail: product.thumbnail,
      sku: product.sku,
      addedAt: new Date().toISOString(),
      hasVariants: product.variants && product.variants.length > 0,
      variantImages: product.variants?.flatMap(v => v.images || [])
    }
    
    if (isFavorite(product.id)) {
      removeFromFavorites(product.id)
    } else {
      addToFavorites(favoriteItem)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>載入中...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="error-container">
        <h2>找不到商品</h2>
        <button onClick={() => router.push(`/${companyCode}/products`)}>
          返回商品列表
        </button>
      </div>
    )
  }

  const allImages = [
    ...(product.images || []),
    ...(selectedVariant?.images || [])
  ].filter(Boolean)

  const displayImages = allImages.length > 0 ? allImages : (product.thumbnail ? [product.thumbnail] : [])

  return (
    <>
      <div className="product-detail-container">
        {/* 購物車圖標 */}
      <div className="cart-icon-container">
        <a href={`/${companyCode}/cart`} className="cart-icon-link">
          <div className="cart-icon">
            🛒
            {totalItems > 0 && (
              <span className="cart-badge">{totalItems}</span>
            )}
          </div>
          <span className="cart-text">購物車</span>
        </a>
      </div>

      {/* 麵包屑導航 */}
      <div className="breadcrumb-container">
        <div className="breadcrumb-wrapper">
          <nav className="breadcrumb-nav">
            <a href={`/${companyCode}`} className="breadcrumb-link">首頁</a>
            <span>›</span>
            <a href={`/${companyCode}/products`} className="breadcrumb-link">所有商品</a>
            <span>›</span>
            {product.category && (
              <>
                <span className="breadcrumb-link">{product.category.name}</span>
                <span>›</span>
              </>
            )}
            <span className="breadcrumb-current">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="main-container">
        {/* 主要產品資訊區域 */}
        <div className="product-card-1">
          <div className="product-grid">
            {/* 產品圖片區域 - 左側 */}
            <div className="image-section">
              {/* 主圖 */}
              <div className="main-image-container">
                {displayImages.length > 0 ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_BASE}${displayImages[selectedImage]}`}
                    alt={product.name}
                    className="main-image"
                  />
                ) : (
                  <div className="no-image-placeholder">
                    <span>📦</span>
                  </div>
                )}
                
                {/* 圖片放大鏡效果提示 */}
                <div className="zoom-hint">
                  🔍 點擊放大
                </div>
              </div>

              {/* 縮圖列表 */}
              {displayImages.length > 1 && (
                <div className="thumbnail-list">
                  {displayImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`thumbnail-button ${selectedImage === index ? 'active' : ''}`}
                    >
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_BASE}${image}`}
                        alt={`${product.name} ${index + 1}`}
                        className="thumbnail-image"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 產品基本資訊 - 中間 */}
            <div className="info-section">
              <h1 className="product-title">{product.name}</h1>
              
              <div className="product-meta">
                {product.category && (
                  <span className="category-badge">{product.category.name}</span>
                )}
                <span>商品編號: {product.sku}</span>
              </div>

              {/* 價格區域 */}
              <div className="price-section">
                <div className="price-container">
                  <span className="current-price">
                    NT$ {getCurrentPrice().toLocaleString()}
                  </span>
                  {(() => {
                    const currentOriginalPrice = getCurrentOriginalPrice()
                    const currentPrice = getCurrentPrice()
                    const hasCurrentDiscount = currentOriginalPrice && currentOriginalPrice > currentPrice
                    const currentDiscountPercent = hasCurrentDiscount 
                      ? Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100)
                      : 0
                    
                    return hasCurrentDiscount ? (
                      <>
                        <span className="original-price">
                          NT$ {currentOriginalPrice.toLocaleString()}
                        </span>
                        <span className="discount-badge">
                          省 {currentDiscountPercent}%
                        </span>
                      </>
                    ) : null
                  })()}
                </div>
                
                {(() => {
                  const currentOriginalPrice = getCurrentOriginalPrice()
                  const currentPrice = getCurrentPrice()
                  const hasCurrentDiscount = currentOriginalPrice && currentOriginalPrice > currentPrice
                  
                  return hasCurrentDiscount ? (
                    <div className="savings-text">
                      您節省了 NT$ {(currentOriginalPrice - currentPrice).toLocaleString()}
                    </div>
                  ) : null
                })()}
              </div>

              {/* 商品特色 */}
              {product.short_description && (
                <div className="features-section">
                  <h3 className="features-title">🌟 商品特色</h3>
                  <div 
                    className="features-text"
                    dangerouslySetInnerHTML={{ 
                      __html: product.short_description.replace(/\n/g, '<br>') 
                    }}
                  />
                </div>
              )}

              {/* 標籤 */}
              <div className="tags-container">
                {product.is_featured && (
                  <span className="tag tag-featured">
                    ⭐ 精選商品
                  </span>
                )}

                {/* 庫存狀態標籤 */}
                <span className="tag tag-in-stock">
                  📦 現貨供應
                </span>

                {/* 用戶自定義標籤 */}
                {product.tags && product.tags.length > 0 && product.tags.map((tag, index) => (
                  <span key={index} className="tag tag-custom">
                    {tag}
                  </span>
                ))}
              </div>

              {/* 庫存狀態 */}
              <div className="stock-status">
                <span className="stock-label">庫存狀態:</span>
                {getCurrentStock() > 0 ? (
                  <span className="stock-available">
                    ✅ 現貨 {getCurrentStock()} 件
                  </span>
                ) : (
                  <span className="stock-unavailable">
                    ❌ 暫時缺貨
                  </span>
                )}
              </div>

              {/* 變體選擇 */}
              {product.variants && product.variants.length > 0 && (
                <div className="specs-selection-section">
                  <h3 className="specs-title">📝 選擇規格</h3>
                  {Object.entries(getVariantOptions()).map(([optionKey, optionValues]) => (
                    <div key={optionKey} className="spec-group">
                      <label className="spec-label">{optionKey}</label>
                      <div className="spec-options">
                        {optionValues.map(optionValue => (
                          <button
                            key={optionValue}
                            onClick={() => {
                              const newSpecs = { ...selectedSpecs, [optionKey]: optionValue }
                              setSelectedSpecs(newSpecs)
                              const variant = findMatchingVariant(newSpecs)
                              setSelectedVariant(variant)
                            }}
                            className={`spec-option ${
                              selectedSpecs[optionKey] === optionValue ? 'selected' : ''
                            }`}
                            disabled={!isOptionAvailable(optionKey, optionValue)}
                          >
                            {optionValue}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 購買區域 - 右側 */}
            <div className="purchase-section">
              <h3 className="purchase-title">💰 立即購買</h3>
              
              {/* 數量選擇 */}
              <div className="quantity-section">
                <label className="quantity-label">數量</label>
                <div className="quantity-controls">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="quantity-button"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="quantity-input"
                    min="1"
                    max={getCurrentStock()}
                  />
                  <button
                    onClick={() => setQuantity(Math.min(getCurrentStock(), quantity + 1))}
                    className="quantity-button"
                    disabled={quantity >= getCurrentStock()}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 小計 */}
              <div className="subtotal-section">
                <div className="subtotal-row">
                  <span className="subtotal-label">小計:</span>
                  <span className="subtotal-price">
                    NT$ {(getCurrentPrice() * quantity).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 購買按鈕 */}
              <div className="button-group">
                <button 
                  className="btn btn-primary"
                  disabled={getCurrentStock() === 0 || quantity > getCurrentStock()}
                  onClick={handleAddToCart}
                >
                  🛒 加入購物車
                </button>
                <button 
                  className="btn btn-tertiary"
                  onClick={handleToggleFavorite}
                >
                  {isFavorite(product.id) ? '💖 已收藏' : '❤️ 加入收藏'}
                </button>
              </div>

              {/* 運費規則 */}
              {product.shipping_rules && product.shipping_rules.length > 0 ? (
                <div className="shipping-rules-section">
                  <h4 className="shipping-rules-title">🚚 運費說明</h4>
                  <div className="shipping-rules-list">
                    {product.shipping_rules.map((rule, index) => (
                      <div key={index} className="shipping-rule-item">
                        <div className="shipping-method">
                          <span className="method-name">{rule.method}</span>
                        </div>
                        <div className="shipping-fee-info">
                          <span className="base-fee">運費 NT$ {rule.base_fee}</span>
                          <span className="free-threshold">滿 NT$ {rule.free_shipping_threshold.toLocaleString()} 免運</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="shipping-rules-section">
                  <h4 className="shipping-rules-title">🚚 運費說明</h4>
                  <div className="shipping-rules-list">
                    <div className="shipping-rule-item">
                      <div className="shipping-method">
                        <span className="method-name">測試運送方式</span>
                      </div>
                      <div className="shipping-fee-info">
                        <span className="base-fee">運費 NT$ 60</span>
                        <span className="free-threshold">滿 NT$ 1,000 免運</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* 詳細資訊區域 - 分頁式設計 */}
        <div className="details-card">
          {/* 分頁標籤 */}
          <div className="tabs-container">
            <nav className="tabs-nav">
              {[
                { id: 'description', label: '商品描述', icon: '📝' },
                { id: 'specifications', label: '規格說明', icon: '📋' },
                { id: 'shipping', label: '配送說明', icon: '🚚' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* 分頁內容 */}
          <div className="tab-content">
            {activeTab === 'description' && (
              <div>
                <h3 className="tab-title">商品詳細說明</h3>
                {product.description ? (
                  <div 
                    className="tab-text"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }}
                  />
                ) : (
                  <p className="tab-empty">暫無詳細說明</p>
                )}
              </div>
            )}

            {activeTab === 'specifications' && (
              <div>
                <h3 className="tab-title">規格說明</h3>
                
                {/* 顯示富文本規格說明 */}
                {product.specifications_description ? (
                  <div 
                    className="tab-text"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.specifications_description) }}
                  />
                ) : (
                  <p className="tab-empty">暫無規格說明</p>
                )}
              </div>
            )}

            {activeTab === 'shipping' && (
              <div>
                <h3 className="tab-title">配送與退換貨說明</h3>
                
                {/* 配送說明內容 */}
                {product.shipping_description ? (
                  <div 
                    className="tab-text"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.shipping_description) }}
                  />
                ) : (
                  <p className="tab-empty">暫無配送說明</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}