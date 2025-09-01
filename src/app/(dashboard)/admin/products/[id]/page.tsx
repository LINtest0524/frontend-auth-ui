'use client';

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useUserStore } from "@/hooks/use-user-store";
import '@/styles/pages/product-detail.css';

type Product = {
  id: number
  name: string
  sku: string
  description?: string
  short_description?: string
  specifications_description?: string
  shipping_description?: string
  price: number
  original_price?: number
  stock_quantity: number
  min_stock: number
  category?: {
    id: number
    name: string
  }
  company?: {
    id: number
    name: string
  }
  weight?: number
  dimensions?: string
  tags?: string[]
  status: string
  is_featured: boolean
  is_visible: boolean
  images?: string[]
  thumbnail?: string
  created_at: string
  updated_at: string
  created_by?: {
    id: number
    username: string
    display_name?: string
  }
  shipping_rules?: Array<{
    method: string
    base_fee: number
    free_shipping_threshold: number
  }>
  shipping_rule_template?: {
    id: number
    name: string
    description?: string
    is_default: boolean
    items?: Array<{
      method: string
      base_fee: number
      free_shipping_threshold: number
    }>
  }
}

export default function ViewProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState<Product | null>(null)
  const currentUser = useUserStore((state) => state.user)

  useEffect(() => {
    if (productId) {
      const token = localStorage.getItem('token')
      fetch(`http://localhost:3001/admin/product/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          if (!res.ok) throw new Error('產品不存在')
          return res.json()
        })
        .then((data: Product) => {
          setProduct(data)
        })
        .catch(error => {
          console.error('載入產品失敗:', error)
          alert('載入產品失敗')
          router.push('/admin/products')
        })
        .finally(() => setLoading(false))
    }
  }, [productId, router])

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '上架';
      case 'INACTIVE': return '下架';
      case 'OUT_OF_STOCK': return '缺貨';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#28a745';
      case 'INACTIVE': return '#6c757d';
      case 'OUT_OF_STOCK': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="product-detail-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>載入中...</h2>
          <p>正在載入產品資料...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="product-detail-container">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2 className="error-title">產品不存在</h2>
          <p className="error-message">找不到指定的產品</p>
          <button
            onClick={() => router.push('/admin/products')}
            className="btn-primary"
          >
            返回產品列表
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="product-detail-container">
      {/* 頁面標題 */}
      <div className="product-detail-header">
        <h1 className="product-detail-title">
          📦 {product.name}
        </h1>
        <p className="product-detail-subtitle">商品詳細資訊 • ID: {product.id}</p>
      </div>

      <div className="product-detail-content">
        {/* 主要資訊區域 */}
        <div className="product-main-info">
          {/* 基本資訊區塊 */}
          <div className="info-section">
            <h3 className="section-header">
              ℹ️ 基本資訊
            </h3>
            <div className="section-content">
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">🆔 商品 ID</div>
                  <div className="info-value">{product.id}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">📝 商品名稱</div>
                  <div className="info-value highlight">{product.name}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">🏷️ 商品編號</div>
                  <div className="info-value" style={{fontFamily: "monospace"}}>{product.sku}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">📂 商品分類</div>
                  <div className="info-value">{product.category?.name || "未分類"}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">📊 商品狀態</div>
                  <div className="info-value">
                    <span className={`status-badge ${product.status.toLowerCase().replace('_', '-')}`}>
                      {getStatusText(product.status)}
                    </span>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-label">🏢 所屬公司</div>
                  <div className="info-value">{product.company?.name || "-"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 描述資訊區塊 */}
          {(product.short_description || product.description || product.specifications_description || product.shipping_description) && (
            <div className="info-section">
              <h3 className="section-header">
                📄 商品描述
              </h3>
              <div className="section-content">
                <div className="info-grid">
                  {product.short_description && (
                    <div className="info-item">
                      <div className="info-label">📝 簡短描述</div>
                      <div className="info-value">{product.short_description}</div>
                    </div>
                  )}
                  {product.description && (
                    <div className="info-item">
                      <div className="info-label">📋 詳細描述</div>
                      <div className="info-value description-content" dangerouslySetInnerHTML={{ __html: product.description }} />
                    </div>
                  )}
                  {product.specifications_description && (
                    <div className="info-item">
                      <div className="info-label">⚙️ 規格說明</div>
                      <div className="info-value description-content" dangerouslySetInnerHTML={{ __html: product.specifications_description }} />
                    </div>
                  )}
                  {product.shipping_description && (
                    <div className="info-item">
                      <div className="info-label">🚚 配送說明</div>
                      <div className="info-value description-content" dangerouslySetInnerHTML={{ __html: product.shipping_description }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 價格資訊區塊 */}
          <div className="info-section">
            <h3 className="section-header">
              💰 價格資訊
            </h3>
            <div className="section-content">
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">💵 售價</div>
                  <div className="info-value price">
                    NT$ {product.price.toLocaleString()}
                  </div>
                </div>
                {product.original_price && (
                  <div className="info-item">
                    <div className="info-label">🏷️ 原價</div>
                    <div className="info-value original-price">
                      NT$ {product.original_price.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 庫存資訊區塊 */}
          <div className="info-section">
            <h3 className="section-header">
              📦 庫存資訊
            </h3>
            <div className="section-content">
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">📊 庫存數量</div>
                  <div className={`info-value stock ${product.stock_quantity <= 0 ? 'low' : 'normal'}`}>
                    {product.stock_quantity} 件
                    {product.stock_quantity <= 0 && " ⚠️"}
                    {product.stock_quantity <= product.min_stock && product.stock_quantity > 0 && " ⚠️ 庫存不足"}
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-label">⚠️ 最低庫存警告</div>
                  <div className="info-value">{product.min_stock} 件</div>
                </div>
              </div>
            </div>
          </div>

          {/* 商品圖片區塊 */}
          {product.images && product.images.length > 0 && (
            <div className="info-section">
              <h3 className="section-header">
                🖼️ 商品圖片
              </h3>
              <div className="section-content">
                <div className="images-grid">
                  {product.images.map((imageUrl, index) => (
                    <div key={index} className="image-item">
                      <img
                        src={`http://localhost:3001${imageUrl}`}
                        alt={`商品圖片 ${index + 1}`}
                      />
                      {product.thumbnail === imageUrl && (
                        <div className="image-badge">
                          主圖
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 運送方式區塊 */}
          {(product.shipping_rules && product.shipping_rules.length > 0) || product.shipping_rule_template ? (
            <div className="info-section">
              <h3 className="section-header">
                🚚 運送方式
              </h3>
              <div className="section-content">
                {product.shipping_rule_template && (
                  <div className="info-item">
                    <div className="info-label">📋 運費規則模板</div>
                    <div className="info-value">
                      <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                        {product.shipping_rule_template.name}
                        {product.shipping_rule_template.is_default && (
                          <span style={{ 
                            marginLeft: '8px', 
                            fontSize: '12px', 
                            background: '#e3f2fd', 
                            color: '#1976d2', 
                            padding: '2px 6px', 
                            borderRadius: '4px' 
                          }}>
                            預設
                          </span>
                        )}
                      </div>
                      {product.shipping_rule_template.description && (
                        <div style={{ color: '#6c757d', fontSize: '14px', marginBottom: '12px' }}>
                          {product.shipping_rule_template.description}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {(product.shipping_rules && product.shipping_rules.length > 0) && (
                  <div className="info-item">
                    <div className="info-label">🚛 配送方式與運費</div>
                    <div className="info-value">
                      <div className="shipping-rules-grid">
                        {product.shipping_rules.map((rule, index) => (
                          <div key={index} className="shipping-rule-card">
                            <div className="shipping-method-name">
                              📦 {rule.method}
                            </div>
                            <div className="shipping-fee-info">
                              <div className="shipping-fee">
                                運費：<span className="fee-amount">NT$ {rule.base_fee}</span>
                              </div>
                              <div className="free-shipping">
                                滿 <span className="threshold-amount">NT$ {rule.free_shipping_threshold.toLocaleString()}</span> 免運
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {(!product.shipping_rules || product.shipping_rules.length === 0) && !product.shipping_rule_template && (
                  <div className="info-item">
                    <div className="info-label">🚚 運送方式</div>
                    <div className="info-value" style={{ color: '#6c757d', fontStyle: 'italic' }}>
                      未設定運送方式
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* 其他資訊區塊 */}
          {(product.weight || product.dimensions || (product.tags && product.tags.length > 0)) && (
            <div className="info-section">
              <h3 className="section-header">
                📏 其他資訊
              </h3>
              <div className="section-content">
                <div className="info-grid">
                  {product.weight && (
                    <div className="info-item">
                      <div className="info-label">⚖️ 重量</div>
                      <div className="info-value">{product.weight} 公斤</div>
                    </div>
                  )}
                  {product.dimensions && (
                    <div className="info-item">
                      <div className="info-label">📐 尺寸</div>
                      <div className="info-value">{product.dimensions}</div>
                    </div>
                  )}
                  {product.tags && product.tags.length > 0 && (
                    <div className="info-item">
                      <div className="info-label">🏷️ 標籤</div>
                      <div className="info-value">
                        <div className="tags-container">
                          {product.tags.map((tag, index) => (
                            <span key={index} className="tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="action-buttons">
            {(currentUser?.role === "SUPER_ADMIN" || 
              currentUser?.role === "GLOBAL_ADMIN" || 
              currentUser?.role === "AGENT_OWNER") && (
              <button
                onClick={() => router.push(`/admin/products/edit/${product.id}`)}
                className="btn-primary"
              >
                ✏️ 編輯商品
              </button>
            )}
            <button
              onClick={() => router.push("/admin/products")}
              className="btn-secondary"
            >
              ← 返回列表
            </button>
          </div>
        </div>

        {/* 側邊欄 */}
        <div className="product-sidebar">
          {/* 商品設定 */}
          <div className="info-section">
            <h3 className="section-header">
              ⚙️ 商品設定
            </h3>
            <div className="section-content">
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">⭐ 精選商品</div>
                  <div className="info-value">
                    <span className={`feature-badge ${product.is_featured ? 'featured' : ''}`}>
                      {product.is_featured ? "⭐ 是" : "否"}
                    </span>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-label">👁️ 前台顯示</div>
                  <div className="info-value">
                    <span className={`feature-badge ${product.is_visible ? 'visible' : 'hidden'}`}>
                      {product.is_visible ? "✅ 顯示" : "❌ 隱藏"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 時間資訊 */}
          <div className="info-section">
            <h3 className="section-header">
              🕒 時間資訊
            </h3>
            <div className="section-content">
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">📅 建立時間</div>
                  <div className="info-value">
                    {new Date(product.created_at).toLocaleString("zh-TW", { 
                      timeZone: "Asia/Taipei", 
                      hour12: false 
                    })}
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-label">🔄 更新時間</div>
                  <div className="info-value">
                    {new Date(product.updated_at).toLocaleString("zh-TW", { 
                      timeZone: "Asia/Taipei", 
                      hour12: false 
                    })}
                  </div>
                </div>
                {product.created_by && (
                  <div className="info-item">
                    <div className="info-label">👤 建立者</div>
                    <div className="info-value">
                      {product.created_by.display_name || product.created_by.username}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}