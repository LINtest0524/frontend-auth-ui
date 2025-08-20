'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useCartStore } from '@/hooks/use-cart-store-new'
import PortalHeaderBar from '@/components/PortalHeaderBar'
import './product-detail.css'

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
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({})

  // 處理規格資料，將陣列格式轉換為分組格式
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
    
    // 檢查是否有規格需要選擇
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

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/portal/product/${productId}?company=${companyCode}`
        )
        
        if (response.ok) {
          const data = await response.json()
          setProduct(data)
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

  const images = product.images && product.images.length > 0 
    ? product.images 
    : product.thumbnail 
    ? [product.thumbnail] 
    : []

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
                    NT$ {product.price.toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="original-price">
                        NT$ {product.original_price?.toLocaleString()}
                      </span>
                      <span className="discount-badge">
                        省 {discountPercent}%
                      </span>
                    </>
                  )}
                </div>
                
                {hasDiscount && (
                  <div className="savings-text">
                    您節省了 NT$ {((product.original_price || 0) - product.price).toLocaleString()}
                  </div>
                )}
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

              {/* 運費規則 */}
              {product.shipping_rules && product.shipping_rules.length > 0 && (
                <div className="shipping-rules">
                  <span className="shipping-label">運費規則:</span>
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
              )}
            </div>

            {/* 購買區域 - 右側 */}
            <div className="purchase-section">
              <h3 className="purchase-title">立即購買</h3>
                
                {/* 商品規格選擇 */}
                {(() => {
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
                      </div>
                    )
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
                        const maxQuantity = product.stock_quantity || 1
                        setQuantity(Math.min(newQuantity, maxQuantity))
                      }}
                      className="quantity-input"
                      min="1"
                      max={product.stock_quantity || 1}
                    />
                    <button
                      onClick={() => {
                        const maxQuantity = product.stock_quantity || 1
                        setQuantity(Math.min(quantity + 1, maxQuantity))
                      }}
                      className="quantity-button"
                      disabled={quantity >= (product.stock_quantity || 1)}
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
                      NT$ {(product.price * quantity).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 購買按鈕 */}
                <div className="button-group">
                  <button 
                    className="btn btn-primary"
                    disabled={product.stock_quantity === 0 || quantity > (product.stock_quantity || 0)}
                    onClick={handleAddToCart}
                  >
                    🛒 加入購物車
                  </button>
                  <button className="btn btn-tertiary">
                    ❤️ 加入收藏
                  </button>
                </div>


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