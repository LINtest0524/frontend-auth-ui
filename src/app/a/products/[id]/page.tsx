'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useCartStore } from '@/hooks/use-cart-store-new'
import { useFavoritesStore } from '@/hooks/use-favorites-store'
import PortalHeaderBar from '@/components/PortalHeaderBar'
import './product-detail.css'

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
  const companyCode = 'a'
  
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

  // 處理規格資料，將陣列格式轉換為分組格式（用於非變體商品）
  const getSpecificationOptions = () => {
    if (!product?.specifications) return {}
    
    if (Array.isArray(product.specifications)) {
      // 新格式：陣列格式
      const grouped: Record<string, string[]> = {}
      product.specifications.forEach(spec => {
        if (!grouped[spec.key]) {
          grouped[spec.key] = []
        }
        if (!grouped[spec.key].includes(spec.value)) {
          grouped[spec.key].push(spec.value)
        }
      })
      return grouped
    } else {
      // 舊格式：物件格式
      const grouped: Record<string, string[]> = {}
      Object.entries(product.specifications).forEach(([key, value]) => {
        grouped[key] = [String(value)]
      })
      return grouped
    }
  }

  // 處理加入購物車
  const handleAddToCart = () => {
    if (!product) return
    
    const hasVariants = product.variants && product.variants.length > 0
    
    if (hasVariants) {
      // 有變體的商品
      const variantOptions = getVariantOptions()
      const variantKeys = Object.keys(variantOptions)
      
      // 檢查是否都已選擇變體規格
      if (variantKeys.length > 0) {
        const missingSpecs = variantKeys.filter(key => !selectedSpecs[key])
        if (missingSpecs.length > 0) {
          alert(`請選擇 ${missingSpecs.join('、')} 規格`)
          return
        }
      }
      
      if (!selectedVariant) {
        alert('請選擇商品規格')
        return
      }
      
      // 檢查變體庫存
      const currentCartQuantity = useCartStore.getState().getItemQuantity(product.id)
      const totalQuantity = currentCartQuantity + quantity
      
      if (totalQuantity > selectedVariant.stock_quantity) {
        alert(`庫存不足！目前庫存：${selectedVariant.stock_quantity} 件，購物車中已有：${currentCartQuantity} 件`)
        return
      }
      
      // 建立變體商品名稱
      const specText = Object.entries(selectedSpecs)
        .map(([key, value]) => `${key}:${value}`)
        .join(' ')
      const productName = `${product.name} (${specText})`
      
      for (let i = 0; i < quantity; i++) {
        addItem({
          id: product.id,
          name: productName,
          sku: selectedVariant.sku,
          price: selectedVariant.price,
          original_price: selectedVariant.original_price,
          thumbnail: selectedVariant.images && selectedVariant.images.length > 0 
            ? selectedVariant.images[0] 
            : product.thumbnail || (product.images && product.images.length > 0 ? product.images[0] : undefined),
          stock_quantity: selectedVariant.stock_quantity,
          category: product.category,
          selectedSpecs: selectedSpecs,
          variantId: selectedVariant?.id
        })
      }
      
      alert(`已將 ${quantity} 件 ${productName} 加入購物車！`)
    } else {
      // 沒有變體的商品（原有邏輯）
      const specOptions = getSpecificationOptions()
      const specKeys = Object.keys(specOptions)
      
      // 如果有規格選項，檢查是否都已選擇
      if (specKeys.length > 0) {
        const missingSpecs = specKeys.filter(key => !selectedSpecs[key])
        if (missingSpecs.length > 0) {
          alert(`請選擇 ${missingSpecs.join('、')} 規格`)
          return
        }
      }
      
      // 檢查庫存是否足夠
      const currentCartQuantity = useCartStore.getState().getItemQuantity(product.id)
      const totalQuantity = currentCartQuantity + quantity
      
      if (totalQuantity > (product.stock_quantity || 0)) {
        alert(`庫存不足！目前庫存：${product.stock_quantity} 件，購物車中已有：${currentCartQuantity} 件`)
        return
      }
      
      // 建立商品名稱（包含規格）
      const specText = Object.entries(selectedSpecs)
        .map(([key, value]) => `${key}:${value}`)
        .join(' ')
      const productName = specText ? `${product.name} (${specText})` : product.name
      
      for (let i = 0; i < quantity; i++) {
        addItem({
          id: product.id,
          name: productName,
          sku: product.sku,
          price: product.price,
          original_price: product.original_price,
          thumbnail: product.thumbnail,
          stock_quantity: product.stock_quantity,
          category: product.category,
          selectedSpecs: selectedSpecs
        })
      }
      
      alert(`已將 ${quantity} 件 ${productName} 加入購物車！`)
    }
  }

  // 處理收藏功能
  const handleToggleFavorite = () => {
    if (!product) return
    
    const isCurrentlyFavorite = isFavorite(product.id)
    
    if (isCurrentlyFavorite) {
      removeFromFavorites(product.id)
      alert('已從收藏中移除')
    } else {
      // 獲取變體資訊 - 與 ProductCard 邏輯保持一致
      const hasVariants = product.variants && product.variants.length > 0
      let displayThumbnail = product.thumbnail
      
      if (hasVariants && product.variants) {
        // 使用預設變體或第一個變體的第一張圖片
        const defaultVariant = product.variants.find(v => v.is_default) || product.variants[0]
        if (defaultVariant && defaultVariant.images && defaultVariant.images.length > 0) {
          displayThumbnail = defaultVariant.images[0]
        }
      }
      
      // 計算當前價格：如果有選中的變體則使用變體價格，否則使用產品價格
      const currentPrice = hasVariants && selectedVariant ? selectedVariant.price : product.price;
      
      const favoriteItem: Omit<FavoriteItem, 'addedAt'> = {
        id: product.id,
        name: product.name,
        price: currentPrice,
        original_price: product.original_price,
        thumbnail: displayThumbnail,
        sku: product.sku,
        hasVariants,
        ...(hasVariants && displayThumbnail && displayThumbnail !== product.thumbnail 
          ? { variantImages: [displayThumbnail] } 
          : {})
      }
      addToFavorites(favoriteItem)
      alert('已加入收藏')
    }
  }

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/portal/product/${productId}?company=${companyCode}`
        )
        
        if (response.ok) {
          const data = await response.json()
          setProduct(data)
          
          // 如果有變體，設定預設變體
          if (data.variants && data.variants.length > 0) {
            const defaultVariant = data.variants.find((v: ProductVariant) => v.is_default) || data.variants[0]
            if (defaultVariant) {
              setSelectedVariant(defaultVariant as ProductVariant)
              setSelectedSpecs(defaultVariant.variant_options)
            }
          }
        } else {
          console.error('產品不存在')
          router.push('/a/products')
        }
      } catch (error) {
        console.error('載入產品失敗:', error)
        router.push('/a/products')
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId, router])

  // 當選擇的規格改變時，更新對應的變體
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const variant = findMatchingVariant(selectedSpecs)
      setSelectedVariant(variant as ProductVariant | null)
      
      // 重置數量為1，避免超過新變體的庫存
      setQuantity(1)
      
      // 重置圖片選擇為第一張
      setSelectedImage(0)
    }
  }, [selectedSpecs, product])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="error-container">
        <div className="error-content">
          <div className="error-icon">❌</div>
          <h2 className="error-title">產品不存在</h2>
          <p className="error-message">找不到指定的產品</p>
          <button
            onClick={() => router.push('/a/products')}
            className="error-button"
          >
            返回產品列表
          </button>
        </div>
      </div>
    )
  }

  const hasDiscount = product.original_price && product.original_price > product.price
  const discountPercent = hasDiscount 
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
    : 0

  // 獲取當前顯示的圖片（優先顯示選中變體的圖片）
  const getCurrentImages = () => {
    if (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
      return selectedVariant.images
    }
    
    // 如果沒有選中變體或變體沒有圖片，使用主商品圖片
    if (product.images && product.images.length > 0) {
      return product.images
    }
    
    // 如果主商品也沒有圖片，使用縮圖
    if (product.thumbnail) {
      return [product.thumbnail]
    }
    
    // 如果有變體但當前沒有選中，顯示第一個變體的圖片
    if (product.variants && product.variants.length > 0) {
      const firstVariantWithImages = product.variants.find(v => v.images && v.images.length > 0)
      if (firstVariantWithImages) {
        return firstVariantWithImages.images!
      }
    }
    
    return []
  }

  const images = getCurrentImages()

  // 獲取所有變體的縮圖用於底部滑動展示
  const getAllVariantThumbnails = () => {
    if (!product?.variants || product.variants.length === 0) return []
    
    const thumbnails: Array<{
      variant: ProductVariant,
      image: string,
      variantName: string
    }> = []
    
    product.variants.forEach(variant => {
      if (variant.images && variant.images.length > 0) {
        thumbnails.push({
          variant,
          image: variant.images[0], // 使用第一張圖片作為縮圖
          variantName: variant.variant_name
        })
      }
    })
    
    return thumbnails
  }

  const variantThumbnails = getAllVariantThumbnails()
  const thumbnailsPerPage = 4 // 每頁顯示4個縮圖
  const maxThumbnailIndex = Math.max(0, variantThumbnails.length - thumbnailsPerPage)

  // 處理變體縮圖點擊
  const handleVariantThumbnailClick = (variant: ProductVariant) => {
    // 設定選中的規格
    setSelectedSpecs(variant.variant_options)
    setSelectedVariant(variant as ProductVariant)
    setSelectedImage(0) // 重置主圖為第一張
  }

  return (
    <>
      <PortalHeaderBar />
      <div className="product-detail-container">
        {/* 購物車圖標 */}
      <div className="cart-icon-container">
        <a href="/a/cart" className="cart-icon-link">
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
            <a href="/a" className="breadcrumb-link">首頁</a>
            <span>›</span>
            <a href="/a/products" className="breadcrumb-link">所有商品</a>
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
                {images.length > 0 ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_BASE}${images[selectedImage]}`}
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
              {images.length > 1 && (
                <div className="thumbnail-list">
                  {images.map((image, index) => (
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
              
              {/* 變體縮圖滑動區域 */}
              {variantThumbnails.length > 0 && (
                <div style={{ marginTop: '15px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    padding: '10px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}>
                    {/* 左箭頭 */}
                    <button
                      onClick={() => setVariantThumbnailIndex(Math.max(0, variantThumbnailIndex - 1))}
                      disabled={variantThumbnailIndex === 0}
                      style={{
                        background: variantThumbnailIndex === 0 ? '#e9ecef' : '#007bff',
                        color: variantThumbnailIndex === 0 ? '#6c757d' : 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: variantThumbnailIndex === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      ‹
                    </button>
                    
                    {/* 縮圖容器 */}
                    <div style={{ 
                      flex: 1, 
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        transform: `translateX(-${variantThumbnailIndex * (100 / thumbnailsPerPage)}%)`,
                        transition: 'transform 0.3s ease-in-out',
                        width: `${(variantThumbnails.length / thumbnailsPerPage) * 100}%`
                      }}>
                        {variantThumbnails.map((thumbnail, index) => {
                          const isSelected = selectedVariant?.id === thumbnail.variant.id
                          return (
                            <div
                              key={thumbnail.variant.id}
                              onClick={() => handleVariantThumbnailClick(thumbnail.variant)}
                              style={{
                                flex: `0 0 ${100 / variantThumbnails.length}%`,
                                cursor: 'pointer',
                                border: isSelected ? '2px solid #007bff' : '2px solid transparent',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <img
                                src={`http://localhost:3001${thumbnail.image}`}
                                alt={thumbnail.variantName}
                                style={{
                                  width: '100%',
                                  height: '60px',
                                  objectFit: 'cover',
                                  display: 'block'
                                }}
                              />
                              <div style={{
                                padding: '4px',
                                background: isSelected ? '#007bff' : '#fff',
                                color: isSelected ? 'white' : '#333',
                                fontSize: '10px',
                                textAlign: 'center',
                                fontWeight: isSelected ? 'bold' : 'normal'
                              }}>
                                {thumbnail.variantName}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    
                    {/* 右箭頭 */}
                    <button
                      onClick={() => setVariantThumbnailIndex(Math.min(maxThumbnailIndex, variantThumbnailIndex + 1))}
                      disabled={variantThumbnailIndex >= maxThumbnailIndex}
                      style={{
                        background: variantThumbnailIndex >= maxThumbnailIndex ? '#e9ecef' : '#007bff',
                        color: variantThumbnailIndex >= maxThumbnailIndex ? '#6c757d' : 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: variantThumbnailIndex >= maxThumbnailIndex ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      ›
                    </button>
                  </div>
                  
                  {/* 提示文字 */}
                  <div style={{ 
                    textAlign: 'center', 
                    marginTop: '8px', 
                    fontSize: '12px', 
                    color: '#666' 
                  }}>
                    點擊縮圖查看不同規格
                  </div>
                </div>
              )}
            </div>

            {/* 產品基本資訊 - 中間 */}
            <div className="info-section">
              {/* 商品標題 */}
              <div>
                <h1 className="product-title">
                  {product.name}
                </h1>
                <div className="product-meta">
                  <span>商品編號: {product.sku}</span>
                  {product.category && (
                    <span className="category-badge">
                      {product.category.name}
                    </span>
                  )}
                </div>
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
                    const currentDiscountPercent = hasCurrentDiscount ? Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100) : 0
                    
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


                {/* 用戶自定義標籤 */}
                {product.tags && product.tags.length > 0 && product.tags.map((tag, index) => (
                  <span key={index} className="tag tag-custom">
                    🏷️ {tag}
                  </span>
                ))}
              </div>

            </div>

            {/* 購買區域 - 右側 */}
            <div className="purchase-section">
          
                
                {/* 商品規格選擇 */}
                {(() => {
                  const hasVariants = product.variants && product.variants.length > 0
                  
                  if (hasVariants) {
                    // 有變體的商品
                    const variantOptions = getVariantOptions()
                    const variantKeys = Object.keys(variantOptions)
                    
                    if (variantKeys.length > 0) {
                      return (
                        <div className="specs-selection-section">
                          <h4 className="specs-title">選擇規格</h4>
                          {variantKeys.map(specKey => (
                            <div key={specKey} className="spec-group">
                              <label className="spec-label">{specKey}</label>
                              <div className="spec-options">
                                {variantOptions[specKey].map(option => {
                                  const isAvailable = isOptionAvailable(specKey, option)
                                  return (
                                    <button
                                      key={option}
                                      onClick={() => {
                                        if (isAvailable) {
                                          setSelectedSpecs(prev => ({
                                            ...prev,
                                            [specKey]: option
                                          }))
                                        }
                                      }}
                                      className={`spec-option ${selectedSpecs[specKey] === option ? 'selected' : ''} ${!isAvailable ? 'out-of-stock' : ''}`}
                                      disabled={!isAvailable}
                                      style={{
                                        backgroundColor: !isAvailable ? '#f5f5f5' : selectedSpecs[specKey] === option ? '#007bff' : 'white',
                                        color: !isAvailable ? '#999' : selectedSpecs[specKey] === option ? 'white' : '#333',
                                        cursor: !isAvailable ? 'not-allowed' : 'pointer',
                                        opacity: !isAvailable ? 0.6 : 1
                                      }}
                                    >
                                      {option}
                                      {!isAvailable && <span style={{ fontSize: '10px', display: 'block' }}>(無庫存)</span>}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                          
                          {/* 庫存顯示 */}
                          <div style={{ marginTop: '10px', fontSize: '12px', color: '#e74c3c' }}>
                            庫存 {getCurrentStock()} 台
                          </div>
                        </div>
                      )
                    }
                  } else {
                    // 沒有變體的商品（原有邏輯）
                    const specOptions = getSpecificationOptions()
                    const specKeys = Object.keys(specOptions)
                    
                    if (specKeys.length > 0) {
                      return (
                        <div className="specs-selection-section">
                          <h4 className="specs-title">選擇規格</h4>
                          {specKeys.map(specKey => (
                            <div key={specKey} className="spec-group">
                              <label className="spec-label">{specKey}</label>
                              <div className="spec-options">
                                {specOptions[specKey].map(option => (
                                  <button
                                    key={option}
                                    onClick={() => setSelectedSpecs(prev => ({
                                      ...prev,
                                      [specKey]: option
                                    }))}
                                    className={`spec-option ${selectedSpecs[specKey] === option ? 'selected' : ''}`}
                                  >
                                    {option}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                          
                          {/* 庫存顯示 */}
                          <div style={{ marginTop: '10px', fontSize: '12px', color: '#e74c3c' }}>
                            庫存 {getCurrentStock()} 台
                          </div>
                        </div>
                      )
                    } else {
                      // 沒有規格選項，只顯示庫存
                      return (
                        <div style={{ marginBottom: '15px', fontSize: '12px', color: '#e74c3c' }}>
                          庫存 {getCurrentStock()} 台
                        </div>
                      )
                    }
                  }
                  return null
                })()}
                
                {/* 數量選擇 */}
                <div className="quantity-section">
                  <label className="quantity-label">
                    購買數量
                  </label>
                  <div className="quantity-controls">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="quantity-button"
                      disabled={quantity <= 1}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const newQuantity = Math.max(1, parseInt(e.target.value) || 1)
                        const maxQuantity = getCurrentStock()
                        setQuantity(Math.min(newQuantity, maxQuantity))
                      }}
                      className="quantity-input"
                      min="1"
                      max={getCurrentStock()}
                    />
                    <button
                      onClick={() => {
                        const maxQuantity = getCurrentStock()
                        setQuantity(Math.min(quantity + 1, maxQuantity))
                      }}
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
                    dangerouslySetInnerHTML={{ __html: product.description }}
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
                    dangerouslySetInnerHTML={{ __html: product.specifications_description }}
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
                    dangerouslySetInnerHTML={{ __html: product.shipping_description }}
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