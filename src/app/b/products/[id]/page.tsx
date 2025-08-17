'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'

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
  specifications?: Record<string, any>
  tags?: string[]
  created_at: string
  updated_at: string
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string
  const companyCode = 'b'
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

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
          router.push('/b/products')
        }
      } catch (error) {
        console.error('載入產品失敗:', error)
        router.push('/b/products')
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
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">產品不存在</h2>
          <p className="text-gray-500 mb-4">找不到指定的產品</p>
          <button
            onClick={() => router.push('/b/products')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 返回按鈕 */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/b/products')}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            ← 返回產品列表
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* 產品圖片 */}
            <div className="space-y-4">
              {/* 主圖 */}
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {images.length > 0 ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_BASE}${images[selectedImage]}`}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl">📦</span>
                  </div>
                )}
              </div>

              {/* 縮圖 */}
              {images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                        selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_BASE}${image}`}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 產品資訊 */}
            <div className="space-y-6">
              {/* 標題和分類 */}
              <div>
                {product.category && (
                  <span className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm mb-2">
                    {product.category.name}
                  </span>
                )}
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <p className="text-gray-600 font-mono text-sm">SKU: {product.sku}</p>
              </div>

              {/* 價格 */}
              <div className="flex items-baseline space-x-3">
                <span className="text-3xl font-bold text-red-600">${product.price}</span>
                {hasDiscount && (
                  <>
                    <span className="text-xl text-gray-500 line-through">${product.original_price}</span>
                    <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
                      -{discountPercent}%
                    </span>
                  </>
                )}
              </div>

              {/* 標籤 */}
              <div className="flex space-x-2">
                {product.is_featured && (
                  <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    精選商品
                  </span>
                )}
                {product.stock_quantity !== undefined && product.stock_quantity > 0 && (
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    現貨供應
                  </span>
                )}
              </div>

              {/* 簡短描述 */}
              {product.short_description && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">產品特色</h3>
                  <p className="text-gray-600">{product.short_description}</p>
                </div>
              )}

              {/* 數量選擇和購買按鈕 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">數量:</span>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-lg hover:bg-orange-600 font-medium">
                    立即購買
                  </button>
                  <button className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 font-medium">
                    加入購物車
                  </button>
                </div>
              </div>

              {/* 庫存資訊 */}
              {product.stock_quantity !== undefined && (
                <div className="text-sm text-gray-600">
                  庫存: {product.stock_quantity > 0 ? `${product.stock_quantity} 件` : '缺貨'}
                </div>
              )}
            </div>
          </div>

          {/* 詳細描述 */}
          {product.description && (
            <div className="border-t border-gray-200 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">產品詳情</h3>
              <div 
                className="prose max-w-none text-gray-600"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}

          {/* 規格資訊 */}
          {(product.specifications_description || (product.specifications && Object.keys(product.specifications).length > 0)) && (
            <div className="border-t border-gray-200 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">產品規格</h3>
              
              {/* 顯示富文本規格說明 */}
              {product.specifications_description && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-800 mb-3">規格說明</h4>
                  <div 
                    className="prose max-w-none text-gray-600"
                    dangerouslySetInnerHTML={{ __html: product.specifications_description }}
                  />
                </div>
              )}
              
              {/* 顯示結構化規格表格 */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-800 mb-3">規格參數</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700">{key}:</span>
                        <span className="text-gray-600">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}