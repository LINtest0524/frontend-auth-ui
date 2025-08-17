import { create } from 'zustand'

// 獲取當前用戶和公司代碼的函數
const getCurrentUserKey = (): string => {
  if (typeof window === 'undefined') return 'guest'
  
  // 從URL獲取公司代碼
  const pathname = window.location.pathname
  const companyCode = pathname.split('/')[1] || 'a'
  
  // 嘗試獲取當前登入用戶
  const userData = localStorage.getItem(`portalUser_${companyCode}`)
  if (userData) {
    try {
      const user = JSON.parse(userData)
      return `${companyCode}_user_${user.id}`
    } catch {
      // 如果解析失敗，使用訪客模式
    }
  }
  
  // 未登入用戶使用公司代碼 + guest
  return `${companyCode}_guest`
}

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
  
  // 動作方法
  addItem: (product: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  refreshCart: () => void // 新增：刷新購物車（用於登入/登出時）
  
  // 計算方法
  getTotalItems: () => number
  getTotalPrice: () => number
  getItemQuantity: (productId: number) => number
  isInCart: (productId: number) => boolean
}

// 手動 localStorage 支援
const loadFromStorage = (): CartItem[] => {
  if (typeof window === 'undefined') return []
  try {
    const userKey = getCurrentUserKey()
    const stored = localStorage.getItem(`cart-items_${userKey}`)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveToStorage = (items: CartItem[]) => {
  if (typeof window === 'undefined') return
  try {
    const userKey = getCurrentUserKey()
    localStorage.setItem(`cart-items_${userKey}`, JSON.stringify(items))
  } catch {
    // 忽略儲存錯誤
  }
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: loadFromStorage(),

  // 加入商品到購物車
  addItem: (product) => {
    set((state) => {
      console.log('Adding item to cart:', product)
      console.log('Current items before adding:', state.items)
      
      const existingItemIndex = state.items.findIndex(item => item.id === product.id)
      let newItems: CartItem[]
      
      if (existingItemIndex >= 0) {
        // 商品已存在，增加數量
        newItems = [...state.items]
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + 1
        }
        console.log('Updated existing item, new items:', newItems)
      } else {
        // 新商品，加入到購物車
        newItems = [...state.items, { ...product, quantity: 1 }]
        console.log('Added new item, new items:', newItems)
      }
      
      saveToStorage(newItems)
      return { items: newItems }
    })
  },

  // 從購物車移除商品
  removeItem: (productId) => {
    set((state) => {
      const newItems = state.items.filter(item => item.id !== productId)
      saveToStorage(newItems)
      return { items: newItems }
    })
  },

  // 更新商品數量
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }

    set((state) => {
      const newItems = state.items.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      )
      saveToStorage(newItems)
      return { items: newItems }
    })
  },

  // 清空購物車
  clearCart: () => {
    const newItems: CartItem[] = []
    saveToStorage(newItems)
    set({ items: newItems })
  },

  // 刷新購物車（用於登入/登出時）
  refreshCart: () => {
    const newItems = loadFromStorage()
    set({ items: newItems })
  },

  // 計算總商品數量
  getTotalItems: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0)
  },

  // 計算總價格
  getTotalPrice: () => {
    return get().items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0)
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