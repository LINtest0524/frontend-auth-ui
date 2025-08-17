'use client'

import { useCartStore } from '@/hooks/use-cart-store'

export default function CartPage() {
  const { 
    items, 
    totalItems, 
    totalPrice, 
    updateQuantity, 
    removeItem, 
    clearCart 
  } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">購物車是空的</h3>
            <p className="text-gray-500 mb-6">還沒有加入任何商品</p>
            <a 
              href="/b/products" 
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              去購物
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 頁面標題 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">購物車</h1>
          <p className="text-gray-600">共 {totalItems} 件商品</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 購物車商品列表 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">商品清單</h2>
                  <button
                    onClick={clearCart}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    清空購物車
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      {/* 商品圖片 */}
                      <div className="w-16 h-16 flex-shrink-0">
                        {item.thumbnail ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_API_BASE}${item.thumbnail}`}
                            alt={item.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                            📦
                          </div>
                        )}
                      </div>

                      {/* 商品資訊 */}
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                        {item.category && (
                          <p className="text-sm text-gray-500">分類: {item.category.name}</p>
                        )}
                      </div>

                      {/* 數量控制 */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>

                      {/* 價格 */}
                      <div className="text-right">
                        <div className="font-bold text-lg">${item.price * item.quantity}</div>
                        <div className="text-sm text-gray-500">單價: ${item.price}</div>
                      </div>

                      {/* 移除按鈕 */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-2"
                        title="移除商品"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 訂單摘要 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-4">訂單摘要</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>商品數量</span>
                  <span>{totalItems} 件</span>
                </div>
                <div className="flex justify-between">
                  <span>小計</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>總計</span>
                    <span className="text-red-600">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium">
                前往結帳
              </button>
              
              <a 
                href="/b/products" 
                className="block w-full text-center mt-3 text-blue-500 hover:text-blue-700"
              >
                繼續購物
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}