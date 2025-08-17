'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProductCard from '@/components/ProductCard'

interface Product {
  id: number
  name: string
  sku: string
  price: number
  original_price?: number
  short_description?: string
  thumbnail?: string
  is_featured: boolean
  category?: {
    id: number
    name: string
  }
}

interface Category {
  id: number
  name: string
}

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const companyCode = 'a'
  
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  
  // 從 URL 參數獲取篩選條件
  const categoryId = searchParams.get('category')
  const searchTerm = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')

  // 載入分類
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/product/categories?company=${companyCode}`)
        if (response.ok) {
          const data = await response.json()
          setCategories(data)
        }
      } catch (error) {
        console.error('載入分類失敗:', error)
      }
    }
    
    fetchCategories()
  }, [])

  // 載入產品
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          company: companyCode,
          page: page.toString(),
          limit: '12'
        })
        
        if (categoryId) params.append('category_id', categoryId)
        if (searchTerm) params.append('search', searchTerm)
        
        const url = `${process.env.NEXT_PUBLIC_API_BASE}/portal/product?${params}`
        const response = await fetch(url)
        
        if (response.ok) {
          const data = await response.json()
          setProducts(data.data || [])
          setTotalPages(data.totalPages || 1)
          setCurrentPage(data.currentPage || 1)
        }
      } catch (error) {
        console.error('載入產品失敗:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [categoryId, searchTerm, page])

  // 更新 URL 參數
  const updateURL = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    
    // 重置頁碼
    if ('category' in newParams || 'search' in newParams) {
      params.delete('page')
    }
    
    const newURL = `/a/products${params.toString() ? '?' + params.toString() : ''}`
    router.push(newURL)
  }

  // 處理分類篩選
  const handleCategoryFilter = (catId: string | null) => {
    updateURL({ category: catId })
  }

  // 處理搜尋
  const handleSearch = (term: string) => {
    updateURL({ search: term || null })
  }

  // 處理分頁
  const handlePageChange = (newPage: number) => {
    updateURL({ page: newPage.toString() })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 頁面標題 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">產品中心</h1>
          <p className="text-gray-600">探索我們的優質產品</p>
        </div>

        {/* 搜尋和篩選 */}
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 搜尋框 */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜尋產品..."
                defaultValue={searchTerm || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch((e.target as HTMLInputElement).value)
                  }
                }}
              />
            </div>
            
            {/* 分類篩選 */}
            <div className="md:w-48">
              <select
                value={categoryId || ''}
                onChange={(e) => handleCategoryFilter(e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">所有分類</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 產品網格 */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  companySlug={companyCode}
                />
              ))}
            </div>

            {/* 分頁 */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <div className="flex space-x-2">
                  {/* 上一頁 */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    上一頁
                  </button>
                  
                  {/* 頁碼 */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 border rounded-lg ${
                        pageNum === currentPage
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  
                  {/* 下一頁 */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    下一頁
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">暫無產品</h3>
            <p className="text-gray-500">目前沒有符合條件的產品</p>
          </div>
        )}
      </div>
    </div>
  )
}