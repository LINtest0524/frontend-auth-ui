'use client';

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useUserStore } from "@/hooks/use-user-store";

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
      <div className="b-ibox">
        <h1>載入中...</h1>
        <div className="b-ibox-s">
          <p>正在載入產品資料...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="b-ibox">
        <h1>產品不存在</h1>
        <div className="b-ibox-s">
          <p>找不到指定的產品</p>
          <button
            onClick={() => router.push('/admin/products')}
            className="b-btn-s2 b-btn-c1"
          >
            返回產品列表
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="b-ibox">
      <h1>查看商品</h1>

      <div className="b-ibox-s">
        <div className="w100">
          {/* 基本資訊 */}
          <div className="b-form-group-1 w100 fl4">
            <label>商品 ID</label>
            <div className="w70 pt10">{product.id}</div>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>商品名稱</label>
            <div className="w70 pt10" style={{fontWeight: "500"}}>{product.name}</div>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>商品編號 (SKU)</label>
            <div className="w70 pt10" style={{fontFamily: "monospace"}}>{product.sku}</div>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>商品分類</label>
            <div className="w70 pt10">{product.category?.name || "未分類"}</div>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>商品狀態</label>
            <div className="w70 pt10">
              <span style={{color: getStatusColor(product.status), fontWeight: "500"}}>
                {getStatusText(product.status)}
              </span>
            </div>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>所屬公司</label>
            <div className="w70 pt10">{product.company?.name || "-"}</div>
          </div>

          {/* 描述 */}
          {product.short_description && (
            <div className="b-form-group-1 w100 fl4">
              <label>簡短描述</label>
              <div className="w70 pt10">{product.short_description}</div>
            </div>
          )}

          {product.description && (
            <div className="b-form-group-1 w100 fl4">
              <label>詳細描述</label>
              <div 
                className="w70 pt10" 
                style={{lineHeight: "1.5"}}
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}

          {product.specifications_description && (
            <div className="b-form-group-1 w100 fl4">
              <label>規格說明</label>
              <div 
                className="w70 pt10" 
                style={{lineHeight: "1.5"}}
                dangerouslySetInnerHTML={{ __html: product.specifications_description }}
              />
            </div>
          )}

          {product.shipping_description && (
            <div className="b-form-group-1 w100 fl4">
              <label>配送說明</label>
              <div 
                className="w70 pt10" 
                style={{lineHeight: "1.5"}}
                dangerouslySetInnerHTML={{ __html: product.shipping_description }}
              />
            </div>
          )}

          {/* 價格資訊 */}
          <div className="b-form-group-1 w100 fl4">
            <label>售價</label>
            <div className="w70 pt10" style={{fontSize: "18px", fontWeight: "500", color: "#dc3545"}}>
              NT$ {product.price.toLocaleString()}
            </div>
          </div>

          {product.original_price && (
            <div className="b-form-group-1 w100 fl4">
              <label>原價</label>
              <div className="w70 pt10" style={{textDecoration: "line-through", color: "#6c757d"}}>
                NT$ {product.original_price.toLocaleString()}
              </div>
            </div>
          )}

          {/* 庫存資訊 */}
          <div className="b-form-group-1 w100 fl4">
            <label>庫存數量</label>
            <div className="w70 pt10">
              <span style={{color: product.stock_quantity <= 0 ? "#dc3545" : "inherit", fontWeight: "500"}}>
                {product.stock_quantity} 件
              </span>
            </div>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>最低庫存警告</label>
            <div className="w70 pt10">{product.min_stock} 件</div>
          </div>

          {/* 商品圖片 */}
          {product.images && product.images.length > 0 && (
            <div className="b-form-group-1 w100 fl4">
              <label>商品圖片</label>
              <div className="w70 pt10">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
                  {product.images.map((imageUrl, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                      <img
                        src={`http://localhost:3001${imageUrl}`}
                        alt={`商品圖片 ${index + 1}`}
                        style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                      {product.thumbnail === imageUrl && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '2px',
                            left: '2px',
                            background: '#007bff',
                            color: 'white',
                            borderRadius: '3px',
                            padding: '2px 6px',
                            fontSize: '10px',
                          }}
                        >
                          主圖
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 其他資訊 */}
          {product.weight && (
            <div className="b-form-group-1 w100 fl4">
              <label>重量</label>
              <div className="w70 pt10">{product.weight} 公斤</div>
            </div>
          )}

          {product.dimensions && (
            <div className="b-form-group-1 w100 fl4">
              <label>尺寸</label>
              <div className="w70 pt10">{product.dimensions}</div>
            </div>
          )}

          {product.tags && product.tags.length > 0 && (
            <div className="b-form-group-1 w100 fl4">
              <label>標籤</label>
              <div className="w70 pt10">
                {product.tags.map((tag, index) => (
                  <span 
                    key={index} 
                    style={{
                      display: "inline-block",
                      background: "#e9ecef",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      marginRight: "6px",
                      marginBottom: "4px"
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 設定 */}
          <div className="b-form-group-1 w100 fl4">
            <label>精選商品</label>
            <div className="w70 pt10">
              <span style={{color: product.is_featured ? "#28a745" : "#6c757d"}}>
                {product.is_featured ? "⭐ 是" : "否"}
              </span>
            </div>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>前台顯示</label>
            <div className="w70 pt10">
              <span style={{color: product.is_visible ? "#28a745" : "#6c757d"}}>
                {product.is_visible ? "✅ 顯示" : "❌ 隱藏"}
              </span>
            </div>
          </div>

          {/* 時間資訊 */}
          <div className="b-form-group-1 w100 fl4">
            <label>建立時間</label>
            <div className="w70 pt10">
              {new Date(product.created_at).toLocaleString("zh-TW", { 
                timeZone: "Asia/Taipei", 
                hour12: false 
              })}
            </div>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>更新時間</label>
            <div className="w70 pt10">
              {new Date(product.updated_at).toLocaleString("zh-TW", { 
                timeZone: "Asia/Taipei", 
                hour12: false 
              })}
            </div>
          </div>

          {product.created_by && (
            <div className="b-form-group-1 w100 fl4">
              <label>建立者</label>
              <div className="w70 pt10">
                {product.created_by.display_name || product.created_by.username}
              </div>
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="fl4 w100 b-btnbox">
            {(currentUser?.role === "SUPER_ADMIN" || 
              currentUser?.role === "GLOBAL_ADMIN" || 
              currentUser?.role === "AGENT_OWNER") && (
              <button
                onClick={() => router.push(`/admin/products/edit/${product.id}`)}
                className="b-btn-s2 b-btn-c4 mr20"
              >
                編輯商品
              </button>
            )}
            <button
              onClick={() => router.push("/admin/products")}
              className="b-btn-s2 b-btn-c1"
            >
              返回列表
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}