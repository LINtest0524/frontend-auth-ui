'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCartStore } from '@/hooks/use-cart-store'
import { useUserStore } from '@/hooks/use-user-store'
import Image from 'next/image'

interface ProductVariant {
  id: number
  variant_name: string
  sku: string
  price: number
  original_price?: number
  stock_quantity: number
  variant_options: Record<string, string>
  images: string[]
  is_default: boolean
  status: string
}

interface Product {
  id: number
  name: string
  sku: string
  description: string
  short_description: string
  price: number
  original_price?: number
  stock_quantity: number
  images: string[]
  thumbnail: string
  specifications: Record<string, any>
  specifications_description: string
  shipping_description: string
  tags: string[]
  status: string
  is_featured: boolean
  category?: {
    id: number
    name: string
  }
  variants: ProductVariant[]
}

export default function ProductDetailWithVariants() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  
  const addItem = useCartStore((state) => state.addItem)
  const user = useUserStore((state) => state.user)

  useEffect(() => {
    if (params.id) {
      fetchProduct()
    }
  }, [params.id])

  const fetchProduct = async () => {
    try {
      const companySlug = window.location.pathname.split('/')[1] // 從 URL 獲取公司代碼
      const response = await fetch(`/api/portal/${companySlug}/products/${params.id}`)
      
      if (response.ok) {
        const productData = await response.json()
        setProduct(productData)
        
        // 設定預設變體
        const defaultVariant = productData.variants?.find((v: ProductVariant) => v.is_default) || productData.variants?.[0]
        if (defaultVariant) {
          setSelectedVariant(defaultVariant)
          setSelectedOptions(defaultVariant.variant_options || {})
        }
      } else {
        // 獲取產品失敗，靜默處理
      }
    } catch (error) {
      // 獲取產品失敗，靜默處理
    } finally {
      setLoading(false)
    }
  }

  // 獲取所有可用的規格選項類型
  const getAvailableOptionTypes = () => {
    if (!product?.variants) return []
    
    const optionTypes = new Set<string>()
    product.variants.forEach(variant => {
      Object.keys(variant.variant_options || {}).forEach(key => {
        optionTypes.add(key)
      })
    })
    
    return Array.from(optionTypes)
  }

  // 獲取特定規格類型的所有可用值
  const getAvailableOptionValues = (optionType: string) => {
    if (!product?.variants) return []
    
    const values = new Set<string>()
    product.variants.forEach(variant => {
      const value = variant.variant_options?.[optionType]
      if (value) {
        values.add(value)
      }
    })
    
    return Array.from(values)
  }

  // 檢查特定選項組合是否可用
  const isOptionCombinationAvailable = (optionType: string, value: string) => {
    if (!product?.variants) return false
    
    const testOptions = { ...selectedOptions, [optionType]: value }
    
    return product.variants.some(variant => {
      return Object.entries(testOptions).every(([key, val]) => 
        variant.variant_options?.[key] === val
      ) && variant.status === 'ACTIVE' && variant.stock_quantity > 0
    })
  }

  // 選擇規格選項
  const selectOption = (optionType: string, value: string) => {
    const newSelectedOptions = { ...selectedOptions, [optionType]: value }
    setSelectedOptions(newSelectedOptions)
    
    // 尋找匹配的變體
    const matchingVariant = product?.variants?.find(variant => {
      return Object.entries(newSelectedOptions).every(([key, val]) => 
        variant.variant_options?.[key] === val
      )
    })
    
    if (matchingVariant) {
      setSelectedVariant(matchingVariant)
      setSelectedImageIndex(0) // 重置圖片索引
    }
  }

  // 獲取當前顯示的圖片
  const getCurrentImages = () => {
    if (selectedVariant?.images && selectedVariant.images.length > 0) {
      return selectedVariant.images
    }
    return product?.images || []
  }

  // 獲取當前價格
  const getCurrentPrice = () => {
    return selectedVariant?.price || product?.price || 0
  }

  // 獲取當前原價
  const getCurrentOriginalPrice = () => {
    return selectedVariant?.original_price || product?.original_price
  }

  // 獲取當前庫存
  const getCurrentStock = () => {
    return selectedVariant?.stock_quantity || product?.stock_quantity || 0
  }

  // 檢查是否可以加入購物車
  const canAddToCart = () => {
    if (!product?.variants || product.variants.length === 0) {
      return getCurrentStock() > 0
    }
    
    // 檢查是否已選擇所有必要的規格選項
    const requiredOptionTypes = getAvailableOptionTypes()
    const hasAllRequiredOptions = requiredOptionTypes.every(type => 
      selectedOptions[type]
    )
    
    return hasAllRequiredOptions && selectedVariant && selectedVariant.stock_quantity > 0
  }

  // 加入購物車
  const handleAddToCart = async () => {
    if (!canAddToCart()) return
    
    setAddingToCart(true)
    
    try {
      const cartItem = {
        id: product!.id,
        name: product!.name,
        sku: selectedVariant?.sku || product!.sku,
        price: getCurrentPrice(),
        original_price: getCurrentOriginalPrice(),
        thumbnail: getCurrentImages()[0] || product!.thumbnail,
        stock_quantity: getCurrentStock(),
        category: product!.category,
        // 變體相關資訊
        variant_id: selectedVariant?.id,
        variant_name: selectedVariant?.variant_name,
        variant_options: selectedVariant?.variant_options || {}
      }
      
      addItem(cartItem)
      
      // 顯示成功訊息
      alert('已加入購物車！')
      
    } catch (error) {
      // 加入購物車失敗，靜默處理
      alert('加入購物車失敗，請稍後再試')
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">載入中...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">產品不存在</div>
      </div>
    )
  }

  const currentImages = getCurrentImages()
  const optionTypes = getAvailableOptionTypes()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 產品圖片 */}
        <div className="space-y-4">
          {/* 主圖片 */}
          <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
            {currentImages.length > 0 ? (
              <Image
                src={currentImages[selectedImageIndex]}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                暫無圖片
              </div>
            )}
          </div>
          
          {/* 縮圖列表 */}
          {currentImages.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {currentImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 產品資訊 */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            {product.category && (
              <p className="text-gray-600 mt-2">分類：{product.category.name}</p>
            )}
          </div>

          {/* 價格 */}
          <div className="space-y-2">
            <div className="flex items-center space-x-4">
              <span className="text-3xl font-bold text-red-600">
                NT$ {getCurrentPrice().toLocaleString()}
              </span>
              {(() => {
                const currentOriginalPrice = getCurrentOriginalPrice()
                return currentOriginalPrice && currentOriginalPrice > getCurrentPrice() && (
                  <span className="text-xl text-gray-500 line-through">
                    NT$ {currentOriginalPrice.toLocaleString()}
                  </span>
                )
              })()}
            </div>
            
            {selectedVariant && (
              <p className="text-sm text-gray-600">
                規格：{selectedVariant.variant_name}
              </p>
            )}
          </div>

          {/* 規格選項 */}
          {optionTypes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">選擇規格</h3>
              
              {optionTypes.map(optionType => (
                <div key={optionType}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {optionType}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {getAvailableOptionValues(optionType).map(value => {
                      const isSelected = selectedOptions[optionType] === value
                      const isAvailable = isOptionCombinationAvailable(optionType, value)
                      
                      return (
                        <button
                          key={value}
                          onClick={() => selectOption(optionType, value)}
                          disabled={!isAvailable}
                          className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600'
                              : isAvailable
                              ? 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          }`}
                        >
                          {value}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 庫存狀態 */}
          <div>
            <p className="text-sm text-gray-600">
              庫存：{getCurrentStock() > 0 ? `${getCurrentStock()} 件` : '缺貨'}
            </p>
          </div>

          {/* 數量選擇 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">數量</label>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50"
              >
                -
              </button>
              <span className="w-16 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(getCurrentStock(), quantity + 1))}
                disabled={quantity >= getCurrentStock()}
                className="w-10 h-10 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>

          {/* 加入購物車按鈕 */}
          <div className="space-y-3">
            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart() || addingToCart}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {addingToCart ? '加入中...' : '加入購物車'}
            </button>
            
            {!canAddToCart() && getCurrentStock() > 0 && (
              <p className="text-sm text-red-600 text-center">
                請選擇所有規格選項
              </p>
            )}
            
            {getCurrentStock() === 0 && (
              <p className="text-sm text-red-600 text-center">
                此商品目前缺貨
              </p>
            )}
          </div>

          {/* 產品描述 */}
          {product.short_description && (
            <div>
              <h3 className="text-lg font-medium mb-2">產品簡介</h3>
              <p className="text-gray-700">{product.short_description}</p>
            </div>
          )}

          {/* 規格說明 */}
          {product.specifications_description && (
            <div>
              <h3 className="text-lg font-medium mb-2">規格說明</h3>
              <div 
                className="text-gray-700 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.specifications_description }}
              />
            </div>
          )}

          {/* 配送說明 */}
          {product.shipping_description && (
            <div>
              <h3 className="text-lg font-medium mb-2">配送說明</h3>
              <div 
                className="text-gray-700 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.shipping_description }}
              />
            </div>
          )}
        </div>
      </div>

      {/* 詳細描述 */}
      {product.description && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">產品詳情</h2>
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}
    </div>
  )
}