'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProductCard from '@/components/ProductCard'
import { useCartStore } from '@/hooks/use-cart-store-new'
import PortalHeaderBar from '@/components/PortalHeaderBar'
import '@/styles/pages/products.css'

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
  
  // 購物車狀態
  const { addItem, getTotalItems } = useCartStore()
  const totalItems = getTotalItems()
  
  // 處理加入購物車
  const handleAddToCart = (product: Product) => {
    console.log('Adding product to cart:', product)
    
    addItem({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      original_price: product.original_price,
      thumbnail: product.thumbnail,
      category: product.category
    })
    
    // 檢查加入後的狀態
    setTimeout(() => {
      console.log('Cart state after adding:', useCartStore.getState())
    }, 100)
    
    // 可以加入成功提示
    alert(`${product.name} 已加入購物車！`)
  }
  
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
    <>
      <PortalHeaderBar />
      <div className="products-page">
        <div className="products-container">
        {/* 頁面標題 */}
        <div className="products-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
            <div>
              <h1 className="products-title">產品中心</h1>
              <p className="products-subtitle">探索我們的優質產品，發現生活的美好</p>
            </div>
            
            {/* 購物車狀態 */}
            <div className="cart-status" onClick={() => router.push('/a/cart')} style={{ cursor: 'pointer' }}>
              <div className="cart-icon">🛒</div>
              <div className="cart-info">
                <h3>我的購物車</h3>
                <div className="cart-count">{totalItems} 件商品</div>
              </div>
            </div>
          </div>
        </div>

        {/* 搜尋和篩選 */}
        <div className="filters-section">
          <div className="filters-grid">
            {/* 搜尋框 */}
            <div className="search-group">
              <label className="search-label">搜尋產品</label>
              <input
                type="text"
                placeholder="輸入產品名稱或關鍵字..."
                defaultValue={searchTerm || ''}
                className="search-input"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch((e.target as HTMLInputElement).value)
                  }
                }}
              />
            </div>
            
            {/* 分類篩選 */}
            <div className="search-group">
              <label className="search-label">產品分類</label>
              <select
                value={categoryId || ''}
                onChange={(e) => handleCategoryFilter(e.target.value || null)}
                className="category-select"
              >
                <option value="">所有分類</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 操作按鈕 */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  const searchInput = document.querySelector('.search-input') as HTMLInputElement
                  handleSearch(searchInput?.value || '')
                }}
                className="search-button"
              >
                🔍 搜尋
              </button>
              <button
                onClick={() => {
                  const searchInput = document.querySelector('.search-input') as HTMLInputElement
                  if (searchInput) searchInput.value = ''
                  updateURL({ search: null, category: null })
                }}
                className="clear-button"
              >
                ✨ 清除
              </button>
            </div>
          </div>
        </div>

        {/* 產品列表 */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  companySlug={companyCode}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>

            {/* 分頁 */}
            {totalPages > 1 && (
              <div className="pagination">
                <div className="pagination-container">
                  {/* 上一頁 */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="pagination-button"
                  >
                    ← 上一頁
                  </button>
                  
                  {/* 頁碼 */}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum = currentPage - 2 + i
                    if (pageNum < 1) pageNum = i + 1
                    if (pageNum > totalPages) pageNum = totalPages - 4 + i
                    if (pageNum < 1 || pageNum > totalPages) return null
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`pagination-button ${pageNum === currentPage ? 'active' : ''}`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  
                  {/* 下一頁 */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="pagination-button"
                  >
                    下一頁 →
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3 className="empty-title">找不到相關產品</h3>
            <p className="empty-description">試試調整搜尋條件或瀏覽其他分類</p>
          </div>
        )}
        </div>
      </div>
    </>
  )
}