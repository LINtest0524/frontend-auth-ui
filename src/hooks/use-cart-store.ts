import { create } from 'zustand'

// 購物車商品介面
export interface CartItem {
  id: number
  name: string
  sku: string
  price: number
  original_price?: number
  thumbnail?: string
  quantity: number
  category?: {
    id: number
    name: string
  }
}

// 購物車狀態介面
interface CartStore {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  
  // 動作方法
  addItem: (product: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  
  // 計算方法
  getItemQuantity: (productId: number) => number
  isInCart: (productId: number) => boolean
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  totalItems: 0,
  totalPrice: 0,

  // 加入商品到購物車
  addItem: (product) => {
    set((state) => {
      const existingItem = state.items.find(item => item.id === product.id)
      let newItems

      if (existingItem) {
        // 如果商品已存在，增加數量
        newItems = state.items.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        // 如果商品不存在，新增到購物車
        newItems = [...state.items, { ...product, quantity: 1 }]
      }

      // 計算新的總計
      const newTotalItems = newItems.reduce((sum, item) => sum + item.quantity, 0)
      const newTotalPrice = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      return {
        items: newItems,
        totalItems: newTotalItems,
        totalPrice: newTotalPrice
      }
    })
  },

  // 從購物車移除商品
  removeItem: (productId) => {
    set((state) => {
      const newItems = state.items.filter(item => item.id !== productId)
      const newTotalItems = newItems.reduce((sum, item) => sum + item.quantity, 0)
      const newTotalPrice = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      return {
        items: newItems,
        totalItems: newTotalItems,
        totalPrice: newTotalPrice
      }
    })
  },

  // 更新商品數量
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      // 如果數量為0或負數，移除商品
      get().removeItem(productId)
      return
    }

    set((state) => {
      const newItems = state.items.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      )
      const newTotalItems = newItems.reduce((sum, item) => sum + item.quantity, 0)
      const newTotalPrice = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      return {
        items: newItems,
        totalItems: newTotalItems,
        totalPrice: newTotalPrice
      }
    })
  },

  // 清空購物車
  clearCart: () => {
    set({
      items: [],
      totalItems: 0,
      totalPrice: 0
    })
  },

  // 取得特定商品的數量
  getItemQuantity: (productId) => {
    const item = get().items.find(item => item.id === productId)
    return item ? item.quantity : 0
  },

  // 檢查商品是否在購物車中
  isInCart: (productId) => {
    return get().items.some(item => item.id === productId)
  }
}))