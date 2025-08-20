'use client';

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from "@/hooks/use-user-store";
import SunEditor from '@/components/SunEditor'

type ProductCategory = {
  id: number
  name: string
  slug: string
  is_active: boolean
}

type ProductVariant = {
  variant_name: string
  sku: string
  price: string
  original_price: string
  stock_quantity: string
  min_stock: string
  variant_options: Record<string, string>
  images: string[]
  is_default: boolean
  status: string
}

export default function NewProductWithVariantsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [companyId, setCompanyId] = useState<number | null>(null)
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const currentUser = useUserStore((state) => state.user)

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    short_description: '',
    specifications_description: '',
    shipping_description: '',
    price: '',
    original_price: '',
    stock_quantity: '0',
    min_stock: '0',
    category_id: '',
    tags: '',
    status: 'ACTIVE',
    is_featured: false,
    is_visible: true,
  })

  const [images, setImages] = useState<string[]>([])
  const [thumbnail, setThumbnail] = useState('')
  const [specifications, setSpecifications] = useState<{key: string, value: string}[]>([
    { key: '', value: '' }
  ])

  // 新增變體相關狀態
  const [hasVariants, setHasVariants] = useState(false)
  const [variants, setVariants] = useState<ProductVariant[]>([
    {
      variant_name: '預設規格',
      sku: '',
      price: '',
      original_price: '',
      stock_quantity: '0',
      min_stock: '0',
      variant_options: {},
      images: [],
      is_default: true,
      status: 'ACTIVE'
    }
  ])

  // 規格選項配置
  const [optionTypes, setOptionTypes] = useState<string[]>(['顏色']) // 預設有顏色選項
  const [optionValues, setOptionValues] = useState<Record<string, string[]>>({
    '顏色': ['紅色', '藍色', '綠色']
  })

  useEffect(() => {
    // 從 localStorage 獲取用戶資訊
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setCompanyId(user.company_id)
      fetchCategories(user.company_id)
    }
  }, [])

  const fetchCategories = async (companyId: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/product-category?company_id=${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const result = await response.json()
        setCategories(result.data || [])
      }
    } catch (error) {
      console.error('獲取分類失敗:', error)
    }
  }

  // 生成變體組合
  const generateVariants = () => {
    if (!hasVariants || optionTypes.length === 0) {
      setVariants([{
        variant_name: '預設規格',
        sku: formData.sku ? `${formData.sku}-DEFAULT` : '',
        price: formData.price,
        original_price: formData.original_price,
        stock_quantity: formData.stock_quantity,
        min_stock: formData.min_stock,
        variant_options: {},
        images: [],
        is_default: true,
        status: 'ACTIVE'
      }])
      return
    }

    // 生成所有可能的組合
    const combinations: Record<string, string>[] = []
    
    const generateCombinations = (index: number, current: Record<string, string>) => {
      if (index === optionTypes.length) {
        combinations.push({ ...current })
        return
      }
      
      const optionType = optionTypes[index]
      const values = optionValues[optionType] || []
      
      for (const value of values) {
        current[optionType] = value
        generateCombinations(index + 1, current)
      }
    }
    
    generateCombinations(0, {})

    const newVariants: ProductVariant[] = combinations.map((options, index) => {
      const variantName = Object.entries(options).map(([key, value]) => value).join('-')
      const variantSku = formData.sku ? `${formData.sku}-${Object.values(options).join('-').toUpperCase()}` : ''
      
      return {
        variant_name: variantName,
        sku: variantSku,
        price: formData.price,
        original_price: formData.original_price,
        stock_quantity: formData.stock_quantity,
        min_stock: formData.min_stock,
        variant_options: options,
        images: [],
        is_default: index === 0,
        status: 'ACTIVE'
      }
    })

    setVariants(newVariants)
  }

  // 添加規格選項類型
  const addOptionType = () => {
    const newType = prompt('請輸入規格類型名稱（如：尺寸、材質等）：')
    if (newType && !optionTypes.includes(newType)) {
      setOptionTypes([...optionTypes, newType])
      setOptionValues({ ...optionValues, [newType]: ['選項1'] })
    }
  }

  // 添加規格選項值
  const addOptionValue = (optionType: string) => {
    const newValue = prompt(`請輸入 ${optionType} 的新選項：`)
    if (newValue && !optionValues[optionType]?.includes(newValue)) {
      setOptionValues({
        ...optionValues,
        [optionType]: [...(optionValues[optionType] || []), newValue]
      })
    }
  }

  // 刪除規格選項值
  const removeOptionValue = (optionType: string, value: string) => {
    setOptionValues({
      ...optionValues,
      [optionType]: optionValues[optionType]?.filter(v => v !== value) || []
    })
  }

  // 更新變體
  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const newVariants = [...variants]
    newVariants[index] = { ...newVariants[index], [field]: value }
    setVariants(newVariants)
  }

  // 上傳圖片
  const handleImageUpload = async (files: FileList | null, variantIndex?: number) => {
    if (!files || files.length === 0) return

    setUploadingImages(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach(file => {
        formData.append('images', file)
      })

      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/product/upload-images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        const newImages = result.images || []

        if (typeof variantIndex === 'number') {
          // 為特定變體添加圖片
          updateVariant(variantIndex, 'images', [...variants[variantIndex].images, ...newImages])
        } else {
          // 為主產品添加圖片
          setImages(prev => [...prev, ...newImages])
        }
      }
    } catch (error) {
      console.error('上傳圖片失敗:', error)
      alert('上傳圖片失敗')
    } finally {
      setUploadingImages(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      
      // 準備提交數據
      const submitData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        min_stock: parseInt(formData.min_stock) || 0,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        images,
        thumbnail,
        specifications: specifications.reduce((acc, spec) => {
          if (spec.key && spec.value) {
            acc[spec.key] = spec.value
          }
          return acc
        }, {} as Record<string, string>),
        // 添加變體數據
        variants: hasVariants ? variants.map(variant => ({
          ...variant,
          price: parseFloat(variant.price) || 0,
          original_price: variant.original_price ? parseFloat(variant.original_price) : null,
          stock_quantity: parseInt(variant.stock_quantity) || 0,
          min_stock: parseInt(variant.min_stock) || 0,
        })) : undefined
      }

      const response = await fetch('/api/admin/product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        alert('產品創建成功！')
        router.push('/admin/products')
      } else {
        const error = await response.json()
        alert(`創建失敗: ${error.message || '未知錯誤'}`)
      }
    } catch (error) {
      console.error('提交失敗:', error)
      alert('提交失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">新增產品</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本資訊 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">產品名稱 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">商品編號 (SKU) *</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
          </div>

          {/* 變體設定 */}
          <div className="border-t pt-6">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="hasVariants"
                checked={hasVariants}
                onChange={(e) => {
                  setHasVariants(e.target.checked)
                  if (!e.target.checked) {
                    setVariants([{
                      variant_name: '預設規格',
                      sku: formData.sku ? `${formData.sku}-DEFAULT` : '',
                      price: formData.price,
                      original_price: formData.original_price,
                      stock_quantity: formData.stock_quantity,
                      min_stock: formData.min_stock,
                      variant_options: {},
                      images: [],
                      is_default: true,
                      status: 'ACTIVE'
                    }])
                  }
                }}
                className="mr-2"
              />
              <label htmlFor="hasVariants" className="text-lg font-medium">
                此產品有多種規格選項（如顏色、尺寸等）
              </label>
            </div>

            {hasVariants && (
              <div className="space-y-4">
                {/* 規格選項配置 */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium mb-3">規格選項配置</h3>
                  
                  {optionTypes.map((optionType) => (
                    <div key={optionType} className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-medium">{optionType}</label>
                        <button
                          type="button"
                          onClick={() => addOptionValue(optionType)}
                          className="text-blue-600 text-sm"
                        >
                          + 添加選項
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {optionValues[optionType]?.map((value) => (
                          <span
                            key={value}
                            className="bg-white px-3 py-1 rounded-full border flex items-center"
                          >
                            {value}
                            <button
                              type="button"
                              onClick={() => removeOptionValue(optionType, value)}
                              className="ml-2 text-red-500 text-sm"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={addOptionType}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
                    >
                      + 添加規格類型
                    </button>
                    
                    <button
                      type="button"
                      onClick={generateVariants}
                      className="bg-green-600 text-white px-4 py-2 rounded-md text-sm"
                    >
                      生成變體組合
                    </button>
                  </div>
                </div>

                {/* 變體列表 */}
                <div className="space-y-4">
                  <h3 className="font-medium">產品變體 ({variants.length})</h3>
                  
                  {variants.map((variant, index) => (
                    <div key={index} className="border p-4 rounded-md">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">變體名稱</label>
                          <input
                            type="text"
                            value={variant.variant_name}
                            onChange={(e) => updateVariant(index, 'variant_name', e.target.value)}
                            className="w-full p-2 border rounded-md text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">SKU</label>
                          <input
                            type="text"
                            value={variant.sku}
                            onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                            className="w-full p-2 border rounded-md text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">價格</label>
                          <input
                            type="number"
                            step="0.01"
                            value={variant.price}
                            onChange={(e) => updateVariant(index, 'price', e.target.value)}
                            className="w-full p-2 border rounded-md text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">庫存</label>
                          <input
                            type="number"
                            value={variant.stock_quantity}
                            onChange={(e) => updateVariant(index, 'stock_quantity', e.target.value)}
                            className="w-full p-2 border rounded-md text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">規格選項</label>
                          <div className="text-sm text-gray-600">
                            {Object.entries(variant.variant_options).map(([key, value]) => (
                              <span key={key} className="mr-2">{key}: {value}</span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">變體圖片</label>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e.target.files, index)}
                            className="w-full text-sm"
                          />
                          {variant.images.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {variant.images.map((img, imgIndex) => (
                                <img
                                  key={imgIndex}
                                  src={img}
                                  alt={`變體圖片 ${imgIndex + 1}`}
                                  className="w-12 h-12 object-cover rounded border"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center">
                        <input
                          type="checkbox"
                          checked={variant.is_default}
                          onChange={(e) => {
                            if (e.target.checked) {
                              // 設為預設時，取消其他變體的預設狀態
                              const newVariants = variants.map((v, i) => ({
                                ...v,
                                is_default: i === index
                              }))
                              setVariants(newVariants)
                            }
                          }}
                          className="mr-2"
                        />
                        <label className="text-sm">設為預設變體</label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 如果沒有變體，顯示原本的價格和庫存欄位 */}
          {!hasVariants && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">價格 *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">庫存數量</label>
                <input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
          )}

          {/* 其他欄位保持原樣... */}
          <div>
            <label className="block text-sm font-medium mb-2">產品分類</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({...formData, category_id: e.target.value})}
              className="w-full p-2 border rounded-md"
            >
              <option value="">請選擇分類</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* 提交按鈕 */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '創建中...' : '創建產品'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}