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

// 運送方式介面
export interface ShippingMethod {
  id: string
  name: string
  fee: number
  freeThreshold: number
  description?: string
  enabled?: boolean
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
  stock_quantity?: number
  category?: {
    id: number
    name: string
  }
  selectedSpecs?: Record<string, string>
  variantId?: number
}

// 購物車狀態介面
interface CartStore {
  items: CartItem[]
  selectedShipping: string | null
  shippingMethods: ShippingMethod[]
  
  // 動作方法
  addItem: (product: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  refreshCart: () => void // 新增：刷新購物車（用於登入/登出時）
  
  // 運送方式方法
  setSelectedShipping: (shippingId: string) => void
  setShippingMethods: (methods: ShippingMethod[]) => void
  getSelectedShippingMethod: () => ShippingMethod | null
  getShippingFee: () => number
  
  // 計算方法
  getTotalItems: () => number
  getTotalPrice: () => number
  getItemQuantity: (productId: number) => number
  isInCart: (productId: number) => boolean
}

// 手動 localStorage 支援
const loadFromStorage = (): { items: CartItem[], selectedShipping: string | null, shippingMethods: ShippingMethod[] } => {
  if (typeof window === 'undefined') return { items: [], selectedShipping: null, shippingMethods: [] }
  try {
    const userKey = getCurrentUserKey()
    const storedItems = localStorage.getItem(`cart-items_${userKey}`)
    const storedShipping = localStorage.getItem(`cart-shipping_${userKey}`)
    const storedMethods = localStorage.getItem(`cart-shipping-methods_${userKey}`)
    
    return {
      items: storedItems ? JSON.parse(storedItems) : [],
      selectedShipping: storedShipping ? JSON.parse(storedShipping) : null,
      shippingMethods: storedMethods ? JSON.parse(storedMethods) : []
    }
  } catch {
    return { items: [], selectedShipping: null, shippingMethods: [] }
  }
}

const saveToStorage = (items: CartItem[], selectedShipping: string | null, shippingMethods: ShippingMethod[]) => {
  if (typeof window === 'undefined') return
  try {
    const userKey = getCurrentUserKey()
    localStorage.setItem(`cart-items_${userKey}`, JSON.stringify(items))
    localStorage.setItem(`cart-shipping_${userKey}`, JSON.stringify(selectedShipping))
    localStorage.setItem(`cart-shipping-methods_${userKey}`, JSON.stringify(shippingMethods))
  } catch {
    // 忽略儲存錯誤
  }
}

export const useCartStore = create<CartStore>((set, get) => {
  const initialData = loadFromStorage()
  
  return {
    items: initialData.items,
    selectedShipping: initialData.selectedShipping,
    shippingMethods: initialData.shippingMethods,

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
        
        saveToStorage(newItems, state.selectedShipping, state.shippingMethods)
        return { items: newItems }
      })
    },

    // 從購物車移除商品
    removeItem: (productId) => {
      set((state) => {
        const newItems = state.items.filter(item => item.id !== productId)
        saveToStorage(newItems, state.selectedShipping, state.shippingMethods)
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
        saveToStorage(newItems, state.selectedShipping, state.shippingMethods)
        return { items: newItems }
      })
    },

    // 清空購物車
    clearCart: () => {
      const newItems: CartItem[] = []
      saveToStorage(newItems, null, [])
      set({ items: newItems, selectedShipping: null, shippingMethods: [] })
    },

    // 刷新購物車（用於登入/登出時）
    refreshCart: () => {
      const data = loadFromStorage()
      set({ items: data.items, selectedShipping: data.selectedShipping, shippingMethods: data.shippingMethods })
    },

    // 設定選擇的運送方式
    setSelectedShipping: (shippingId) => {
      set((state) => {
        saveToStorage(state.items, shippingId, state.shippingMethods)
        return { selectedShipping: shippingId }
      })
    },

    // 設定運送方式列表
    setShippingMethods: (methods) => {
      set((state) => {
        saveToStorage(state.items, state.selectedShipping, methods)
        return { shippingMethods: methods }
      })
    },

    // 獲取選擇的運送方式
    getSelectedShippingMethod: () => {
      const state = get()
      if (!state.selectedShipping) return null
      return state.shippingMethods.find(method => method.id === state.selectedShipping) || null
    },

    // 計算運費
    getShippingFee: () => {
      const state = get()
      const selectedMethod = state.getSelectedShippingMethod()
      if (!selectedMethod) return 0
      
      const totalPrice = state.getTotalPrice()
      // 如果達到免運門檻，運費為0
      if (totalPrice >= selectedMethod.freeThreshold) return 0
      
      return selectedMethod.fee
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
  }
})