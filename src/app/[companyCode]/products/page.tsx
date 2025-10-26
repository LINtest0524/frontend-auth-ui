'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import '@/styles/pages/products.css'

type Product = {
  id: number
  name: string
  description: string
  price: number
  image_url?: string
  category: string
  is_active: boolean
}

export default function ProductsPage() {
  const params = useParams()
  const router = useRouter()
  const companyCode = params.companyCode as string
  
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  // 載入產品
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE
        let url = `${apiBase}/portal/products?company=${companyCode}`
        
        if (selectedCategory !== 'all') {
          url += `&category=${selectedCategory}`
        }

        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          const productsData = Array.isArray(data) ? data : (data.products || [])
          setProducts(productsData)
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    if (companyCode) {
      fetchProducts()
    }
  }, [companyCode, selectedCategory])

  // 載入分類
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE
        const response = await fetch(`${apiBase}/portal/products/categories?company=${companyCode}`)
        if (response.ok) {
          const data = await response.json()
          setCategories(data)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    if (companyCode) {
      fetchCategories()
    }
  }, [companyCode])

  const handleProductClick = (productId: number) => {
    router.push(`/${companyCode}/products/${productId}`)
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 頁面標題 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">產品服務</h1>
          <p className="text-xl text-gray-600">探索我們的產品與服務</p>
        </div>

        {/* 分類篩選 */}
        {categories.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap justify-center gap-4">
              <button
                className={`px-6 py-2 rounded-full transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setSelectedCategory('all')}
              >
                全部
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  className={`px-6 py-2 rounded-full transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 產品列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform hover:scale-105 transition-transform duration-200"
              onClick={() => handleProductClick(product.id)}
            >
              {product.image_url && (
                <div className="h-48 overflow-hidden">
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_BASE}${product.image_url}`}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
              <div className="p-4">
                <div className="mb-2">
                  <span className="text-sm text-blue-600 font-medium">{product.category}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-blue-600">
                    ${product.price.toLocaleString()}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    product.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.is_active ? '可訂購' : '暫停'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">目前沒有可用的產品</p>
          </div>
        )}
      </div>
    </div>
  )
}