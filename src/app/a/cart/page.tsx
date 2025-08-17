'use client'

import { useCartStore } from '@/hooks/use-cart-store-new'
import { useEffect } from 'react'
import PortalHeaderBar from '@/components/PortalHeaderBar'
import './cart.css'

export default function CartPage() {
  const { 
    items, 
    getTotalItems,
    getTotalPrice,
    updateQuantity, 
    removeItem, 
    clearCart 
  } = useCartStore()

  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()

  // 除錯：監控購物車狀態變化
  useEffect(() => {
    console.log('Cart page - Current state:', { items, totalItems, totalPrice })
  }, [items, totalItems, totalPrice])

  if (items.length === 0) {
    return (
      <>
        <PortalHeaderBar />
        <div className="cart-empty">
        <div className="cart-empty-content">
          <div className="cart-empty-icon">🛒</div>
          <h3 className="cart-empty-title">購物車是空的</h3>
          <p className="cart-empty-message">還沒有加入任何商品，快去挑選您喜歡的商品吧！</p>
          <a href="/a/products" className="cart-empty-btn">
            開始購物
          </a>
        </div>
      </div>
      </>
    )
  }

  return (
    <>
      <PortalHeaderBar />
      <div className="cart-container">
      {/* 頁面頭部 */}
      <div className="cart-header">
        <div className="cart-header-content">
          <h1 className="cart-title">
            <span className="cart-title-icon">🛒</span>
            購物車
          </h1>
          <div className="cart-breadcrumb">
            <a href="/a">首頁</a>
            <span>›</span>
            <a href="/a/products">商品</a>
            <span>›</span>
            <span>購物車 ({totalItems} 件商品)</span>
          </div>
        </div>
      </div>

      <div className="cart-main">
        {/* 購物車商品列表 */}
        <div className="cart-items-section">
          <div className="cart-items-header">
            <h2 className="cart-items-title">商品清單</h2>
            <button onClick={clearCart} className="cart-clear-btn">
              清空購物車
            </button>
          </div>

          <div>
            {items.map((item) => (
              <div key={item.id} className="cart-item">
                {/* 商品圖片 */}
                <div className="cart-item-image">
                  {item.thumbnail ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_BASE}${item.thumbnail}`}
                      alt={item.name}
                    />
                  ) : (
                    <div className="cart-item-placeholder">📦</div>
                  )}
                </div>

                {/* 商品資訊 */}
                <div className="cart-item-info">
                  <h3 className="cart-item-name">{item.name}</h3>
                  <div className="cart-item-meta">
                    <div className="cart-item-sku">SKU: {item.sku}</div>
                    {item.category && (
                      <div className="cart-item-category">
                        {item.category.name}
                      </div>
                    )}
                  </div>
                </div>

                {/* 數量控制 */}
                <div className="cart-quantity-control">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="cart-quantity-btn"
                    disabled={item.quantity <= 1}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                    className="cart-quantity-display"
                    min="1"
                  />
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="cart-quantity-btn"
                  >
                    +
                  </button>
                </div>

                {/* 價格 */}
                <div className="cart-item-price">
                  <div className="cart-item-total">
                    NT$ {(item.price * item.quantity).toLocaleString()}
                  </div>
                  <div className="cart-item-unit-price">
                    單價: NT$ {item.price.toLocaleString()}
                  </div>
                </div>

                {/* 移除按鈕 */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="cart-remove-btn"
                  title="移除商品"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 訂單摘要 */}
        <div className="cart-summary">
          <div className="cart-summary-header">
            <h2 className="cart-summary-title">訂單摘要</h2>
          </div>
          
          <div className="cart-summary-content">
            <div className="cart-summary-row">
              <span className="cart-summary-label">商品數量</span>
              <span className="cart-summary-value">{totalItems} 件</span>
            </div>
            
            <div className="cart-summary-row">
              <span className="cart-summary-label">商品小計</span>
              <span className="cart-summary-value">NT$ {totalPrice.toLocaleString()}</span>
            </div>
            
            <div className="cart-summary-row">
              <span className="cart-summary-label">運費</span>
              <span className="cart-summary-value">免運費</span>
            </div>
            
            <div className="cart-summary-row">
              <span className="cart-summary-label">總計</span>
              <span className="cart-summary-total">NT$ {totalPrice.toLocaleString()}</span>
            </div>

            <button className="cart-checkout-btn">
              立即結帳
            </button>
            
            <a href="/a/products" className="cart-continue-shopping">
              繼續購物
            </a>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}