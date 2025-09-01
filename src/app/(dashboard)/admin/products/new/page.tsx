'use client';

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from "@/hooks/use-user-store";
import SunEditor from '@/components/SunEditor'
import '@/styles/pages/product-form.css'

type ProductCategory = {
  id: number
  name: string
  slug: string
  is_active: boolean
}

export default function NewProductPage() {
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
  
  // 運費規則模板相關狀態
  const [shippingTemplates, setShippingTemplates] = useState<any[]>([])
  const [selectedShippingTemplate, setSelectedShippingTemplate] = useState<string>('')
  const [useCustomShipping, setUseCustomShipping] = useState(false)
  
  const [shippingRules, setShippingRules] = useState<{method: string, base_fee: string, free_shipping_threshold: string}[]>([
    { method: '', base_fee: '', free_shipping_threshold: '' }
  ])
  
  // 商品變體管理
  const [variants, setVariants] = useState<{
    variant_name: string
    sku: string
    price: string
    original_price: string
    stock_quantity: string
    variant_options: Record<string, string>
    images: string[]
    is_default: boolean
  }[]>([])
  
  const [variantOptions, setVariantOptions] = useState<{
    name: string
    values: string[]
  }[]>([])
  
  const [useVariants, setUseVariants] = useState(false)

  useEffect(() => {
    // 從 localStorage 獲取用戶資訊
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setCompanyId(user.companyId)
    }
  }, [])

  useEffect(() => {
    if (companyId) {
      const token = localStorage.getItem('token')
      
      // 載入商品分類
      fetch('http://localhost:3001/admin/product-category', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.ok ? res.json() : [])
        .then(setCategories)
        .catch(() => setCategories([]))
      
      // 載入運費規則模板
      fetch('http://localhost:3001/admin/shipping-rule-templates', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.ok ? res.json() : [])
        .then((templates) => {
          setShippingTemplates(templates)
          // 自動選擇預設模板
          const defaultTemplate = templates.find((t: any) => t.is_default)
          if (defaultTemplate) {
            setSelectedShippingTemplate(defaultTemplate.id.toString())
          }
        })
        .catch(() => setShippingTemplates([]))
    }
  }, [companyId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDescriptionChange = (content: string) => {
    setFormData(prev => ({ ...prev, description: content }))
  }

  const handleSpecificationsDescriptionChange = (content: string) => {
    setFormData(prev => ({ ...prev, specifications_description: content }))
  }

  const handleShippingDescriptionChange = (content: string) => {
    setFormData(prev => ({ ...prev, shipping_description: content }))
  }


  const handleShippingRuleChange = (index: number, field: 'method' | 'base_fee' | 'free_shipping_threshold', value: string) => {
    setShippingRules(prev => {
      const newRules = [...prev]
      newRules[index][field] = value
      return newRules
    })
  }

  const addShippingRule = () => {
    setShippingRules(prev => [...prev, { method: '', base_fee: '', free_shipping_threshold: '' }])
  }

  const removeShippingRule = (index: number) => {
    if (shippingRules.length > 1) {
      setShippingRules(prev => prev.filter((_, i) => i !== index))
    }
  }

  // 商品變體管理函數
  const addVariantOption = () => {
    setVariantOptions(prev => [...prev, { name: '', values: [] }])
  }

  const removeVariantOption = (index: number) => {
    setVariantOptions(prev => prev.filter((_, i) => i !== index))
    // 重新生成變體
    generateVariants()
  }

  const updateVariantOption = (index: number, field: 'name' | 'values', value: string | string[]) => {
    setVariantOptions(prev => {
      const newOptions = [...prev]
      if (field === 'values') {
        newOptions[index][field] = value as string[]
      } else {
        newOptions[index][field] = value as string
      }
      return newOptions
    })
  }

  const addVariantValue = (optionIndex: number, value: string) => {
    if (!value.trim()) return
    setVariantOptions(prev => {
      const newOptions = [...prev]
      if (!newOptions[optionIndex].values.includes(value.trim())) {
        newOptions[optionIndex].values.push(value.trim())
      }
      return newOptions
    })
  }

  const removeVariantValue = (optionIndex: number, valueIndex: number) => {
    setVariantOptions(prev => {
      const newOptions = [...prev]
      newOptions[optionIndex].values.splice(valueIndex, 1)
      return newOptions
    })
    // 重新生成變體
    generateVariants()
  }

  // 生成所有可能的變體組合
  const generateVariants = () => {
    const validOptions = variantOptions.filter(opt => opt.name.trim() && opt.values.length > 0)
    
    if (validOptions.length === 0) {
      setVariants([])
      return
    }

    // 生成笛卡爾積
    const combinations = validOptions.reduce((acc, option) => {
      if (acc.length === 0) {
        return option.values.map(value => ({ [option.name]: value }))
      }
      
      const newCombinations: Record<string, string>[] = []
      acc.forEach(combination => {
        option.values.forEach(value => {
          newCombinations.push({ ...combination, [option.name]: value })
        })
      })
      return newCombinations
    }, [] as Record<string, string>[])

    // 保留現有變體的數據
    const existingVariants = new Map(
      variants.map(v => [JSON.stringify(v.variant_options), v])
    )

    const newVariants = combinations.map((combination, index) => {
      const variantKey = JSON.stringify(combination)
      const existing = existingVariants.get(variantKey)
      
      if (existing) {
        return existing
      }

      // 生成變體名稱和SKU
      const variantName = Object.entries(combination)
        .map(([key, value]) => `${value}`)
        .join('-')
      
      const variantSku = `${formData.sku}-${Object.values(combination).join('-').toUpperCase()}`

      return {
        variant_name: variantName,
        sku: variantSku,
        price: formData.price,
        original_price: formData.original_price,
        stock_quantity: '0',
        variant_options: combination,
        images: [],
        is_default: index === 0
      }
    })

    setVariants(newVariants)
  }

  const updateVariant = (index: number, field: string, value: string | number | boolean | string[]) => {
    setVariants(prev => {
      const newVariants = [...prev]
      newVariants[index] = { ...newVariants[index], [field]: value }
      return newVariants
    })
  }

  const handleVariantImageUpload = async (variantIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const token = localStorage.getItem("token");
    const uploadFormData = new FormData();
    
    Array.from(files).forEach(file => {
      uploadFormData.append("images", file);
    });

    try {
      const res = await fetch("http://localhost:3001/admin/product/upload-images", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: uploadFormData,
      });

      if (!res.ok) throw new Error("圖片上傳失敗");
      
      const data = await res.json();
      updateVariant(variantIndex, 'images', [...variants[variantIndex].images, ...data.images]);
    } catch (err) {
      alert("圖片上傳失敗");
    } finally {
      setUploadingImages(false);
    }
  }

  const removeVariantImage = (variantIndex: number, imageUrl: string) => {
    const newImages = variants[variantIndex].images.filter(img => img !== imageUrl)
    updateVariant(variantIndex, 'images', newImages)
  }

  // 當變體選項改變時重新生成變體
  useEffect(() => {
    if (useVariants) {
      generateVariants()
    }
  }, [variantOptions, useVariants])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const token = localStorage.getItem("token");
    const uploadFormData = new FormData();
    
    Array.from(files).forEach(file => {
      uploadFormData.append("images", file);
    });

    try {
      const res = await fetch("http://localhost:3001/admin/product/upload-images", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: uploadFormData,
      });

      if (!res.ok) throw new Error("圖片上傳失敗");
      
      const data = await res.json();
      setImages(prev => [...prev, ...data.images]);
      
      // 如果還沒有縮圖，設定第一張為縮圖
      if (!thumbnail && data.images.length > 0) {
        setThumbnail(data.images[0]);
      }
    } catch (err) {
      alert("圖片上傳失敗");
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (imageUrl: string) => {
    setImages(prev => prev.filter(img => img !== imageUrl));
    if (thumbnail === imageUrl) {
      setThumbnail(images.find(img => img !== imageUrl) || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🚀 表單提交開始')
    
    if (!companyId) {
      alert('無法獲取公司資訊')
      return
    }

    if (!formData.name.trim() || !formData.sku.trim()) {
      alert('請填寫商品名稱和商品編號')
      return
    }

    if (!useVariants && !formData.price) {
      alert('請填寫商品售價')
      return
    }

    if (useVariants && variants.length === 0) {
      alert('請設定商品變體')
      return
    }

    if (useVariants) {
      // 檢查變體是否都有必要資訊
      const invalidVariants = variants.filter(v => 
        !v.variant_name || !v.sku || !v.price || v.stock_quantity === ''
      )
      if (invalidVariants.length > 0) {
        alert('請完整填寫所有變體的資訊（名稱、SKU、價格、庫存）')
        return
      }
    }

    console.log('✅ 基本驗證通過，開始處理資料')
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      
      // 處理標籤
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)


      // 處理運費規則
      const shippingRulesArray = shippingRules
        .filter(rule => rule.method.trim() && rule.base_fee.trim() && rule.free_shipping_threshold.trim())
        .map(rule => ({
          method: rule.method.trim(),
          base_fee: parseFloat(rule.base_fee),
          free_shipping_threshold: parseFloat(rule.free_shipping_threshold)
        }))

      // 處理變體數據
      const variantsArray = useVariants && variants.length > 0 ? variants.map(variant => ({
        variant_name: variant.variant_name,
        sku: variant.sku,
        price: parseFloat(variant.price),
        original_price: variant.original_price ? parseFloat(variant.original_price) : undefined,
        stock_quantity: parseInt(variant.stock_quantity),
        variant_options: variant.variant_options,
        images: variant.images.length > 0 ? variant.images : undefined,
        is_default: variant.is_default
      })) : undefined

      const submitData = {
        ...formData,
        price: useVariants ? 0 : parseFloat(formData.price), // 如果使用變體，主商品價格設為0
        original_price: useVariants ? undefined : (formData.original_price ? parseFloat(formData.original_price) : undefined),
        stock_quantity: useVariants ? 0 : parseInt(formData.stock_quantity), // 如果使用變體，主商品庫存設為0
        min_stock: parseInt(formData.min_stock),
        category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
        shipping_rule_template_id: selectedShippingTemplate && !useCustomShipping ? parseInt(selectedShippingTemplate) : undefined,
        shipping_rules: useCustomShipping && shippingRulesArray.length > 0 ? shippingRulesArray : undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        images: useVariants ? undefined : (images.length > 0 ? images : undefined), // 如果使用變體，主商品不設圖片
        thumbnail: useVariants ? undefined : (thumbnail || undefined),
        variants: variantsArray
      }

      // Debug: 檢查提交資料
      console.log('完整 submitData:', JSON.stringify(submitData, null, 2))

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/admin/product`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        alert('商品新增成功')
        router.push('/admin/products')
      } else {
        const errorData = await response.json()
        alert(`新增失敗: ${errorData.message || '未知錯誤'}`)
      }
    } catch (error) {
      console.error('新增商品錯誤:', error)
      alert('新增失敗')
    } finally {
      setLoading(false)
    }
  }

  // 移除所有變體相關函數，改用基本規格方式

  return (
    <div className="product-form-container">
      {/* 載入遮罩 */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">正在建立商品...</div>
          </div>
        </div>
      )}

      {/* 頁面標題區域 */}
      <div className="product-form-header">
        <h1>🛍️ 新增商品</h1>
      </div>

      {/* 表單內容 */}
      <div className="product-form-content">
        <form onSubmit={handleSubmit}>
          {/* 基本資訊區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>📋</span>
              基本資訊
            </div>
            
            <div className="form-grid two-column">
              <div className="form-group">
                <label htmlFor="name" className="form-label required">🏷️ 商品名稱</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="請輸入商品名稱"
                  required
                />
                <div className="form-hint">
                  建議使用簡潔明瞭的商品名稱，有助於搜尋和識別
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="sku" className="form-label required">🔢 商品編號 (SKU)</label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  className="form-input"
                  value={formData.sku}
                  onChange={handleInputChange}
                  placeholder="請輸入商品編號"
                  required
                />
                <div className="form-hint">
                  唯一的商品識別碼，建議使用英數字組合
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="category_id" className="form-label">📂 商品分類</label>
                <div className="enhanced-select">
                  <select
                    id="category_id"
                    name="category_id"
                    className="form-select"
                    value={formData.category_id}
                    onChange={handleInputChange}
                  >
                    <option value="">請選擇分類</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-hint">
                  選擇適合的分類有助於用戶快速找到商品
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="status" className="form-label">📊 商品狀態</label>
                <div className="enhanced-select">
                  <select
                    id="status"
                    name="status"
                    className="form-select"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="ACTIVE">✅ 上架</option>
                    <option value="INACTIVE">❌ 下架</option>
                    <option value="OUT_OF_STOCK">⚠️ 缺貨</option>
                  </select>
                </div>
                <div className="form-hint">
                  設定商品在前台的顯示狀態
                </div>
              </div>
            </div>

            <div className="form-grid single-column">
              <div className="form-group">
                <label htmlFor="short_description" className="form-label">📝 簡短描述</label>
                <textarea
                  id="short_description"
                  name="short_description"
                  className="form-textarea"
                  rows={3}
                  value={formData.short_description}
                  onChange={handleInputChange}
                  placeholder="請輸入商品簡短描述，可以使用 Enter 換行"
                />
                <div className="form-hint">
                  簡短描述會顯示在商品列表中，建議控制在 100-200 字內
                </div>
              </div>
            </div>
          </div>

          {/* 內容編輯區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>✏️</span>
              內容編輯
            </div>
            
            <div className="form-grid single-column">
              <div className="form-group">
                <label className="form-label required">📄 詳細描述</label>
                <div className="editor-container">
                  <SunEditor
                    value={formData.description}
                    onChange={handleDescriptionChange}
                    placeholder="請輸入商品詳細描述..."
                    height="350px"
                  />
                </div>
                <div className="form-hint">
                  支援豐富的格式化功能、圖片上傳、表格、程式碼等，用於商品詳情頁面顯示
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">📋 規格說明</label>
                <div className="editor-container">
                  <SunEditor
                    value={formData.specifications_description}
                    onChange={handleSpecificationsDescriptionChange}
                    placeholder="請輸入商品規格說明..."
                    height="300px"
                  />
                </div>
                <div className="form-hint">
                  用於前台「規格說明」分頁顯示的內容，可包含尺寸、材質、功能等詳細規格
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">🚚 配送說明</label>
                <div className="editor-container">
                  <SunEditor
                    value={formData.shipping_description}
                    onChange={handleShippingDescriptionChange}
                    placeholder="請輸入配送與退換貨說明..."
                    height="300px"
                  />
                </div>
                <div className="form-hint">
                  用於前台「配送說明」分頁顯示的內容，包含配送方式、退換貨政策等
                </div>
              </div>
            </div>
          </div>

          {/* 價格與庫存設定區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>💰</span>
              價格與庫存設定
            </div>

            {!useVariants && (
              <div className="form-grid two-column">
                <div className="form-group">
                  <label htmlFor="price" className="form-label required">💰 售價</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    className="form-input"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="請輸入售價"
                    min="0"
                    step="0.01"
                    required
                  />
                  <div className="form-hint">
                    商品的銷售價格，支援小數點
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="original_price" className="form-label">🏷️ 原價</label>
                  <input
                    type="number"
                    id="original_price"
                    name="original_price"
                    className="form-input"
                    value={formData.original_price}
                    onChange={handleInputChange}
                    placeholder="請輸入原價（選填）"
                    min="0"
                    step="0.01"
                  />
                  <div className="form-hint">
                    原價用於顯示折扣效果，可不填寫
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="stock_quantity" className="form-label">📦 庫存數量</label>
                  <input
                    type="number"
                    id="stock_quantity"
                    name="stock_quantity"
                    className="form-input"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    placeholder="請輸入庫存數量"
                    min="0"
                  />
                  <div className="form-hint">
                    當前可銷售的商品數量
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="min_stock" className="form-label">⚠️ 最低庫存警告</label>
                  <input
                    type="number"
                    id="min_stock"
                    name="min_stock"
                    className="form-input"
                    value={formData.min_stock}
                    onChange={handleInputChange}
                    placeholder="請輸入最低庫存警告數量"
                    min="0"
                  />
                  <div className="form-hint">
                    當庫存低於此數量時會顯示警告
                  </div>
                </div>
              </div>
            )}

            {useVariants && (
              <div className="info-box info">
                <div className="info-box-icon">ℹ️</div>
                <div className="info-box-content">
                  <div className="info-box-title">已啟用變體管理</div>
                  <div className="info-box-text">
                    價格、庫存和圖片將在下方的變體設定中管理，每個變體可以設定不同的價格和庫存數量。
                  </div>
                </div>
              </div>
            )}

            {useVariants && (
              <div className="form-grid single-column">
                <div className="form-group">
                  <label htmlFor="min_stock" className="form-label">⚠️ 最低庫存警告</label>
                  <input
                    type="number"
                    id="min_stock"
                    name="min_stock"
                    className="form-input"
                    value={formData.min_stock}
                    onChange={handleInputChange}
                    placeholder="請輸入最低庫存警告數量"
                    min="0"
                  />
                  <div className="form-hint">
                    當任一變體庫存低於此數量時會顯示警告
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 圖片設定區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>🖼️</span>
              圖片設定
            </div>

            {!useVariants && (
              <div className="form-grid single-column">
                <div className="form-group">
                  <label className="form-label">🖼️ 商品圖片</label>
                  
                  <div className="image-upload-section">
                    <div 
                      className="image-upload-area"
                      onClick={() => document.getElementById('product-images')?.click()}
                    >
                      <div className="image-upload-icon">📁</div>
                      <div className="image-upload-text">
                        {uploadingImages ? '上傳中...' : '點擊選擇圖片或拖拽到此處'}
                      </div>
                      <div className="image-upload-hint">
                        支援 JPG、PNG、WebP 格式，建議尺寸 800x800 像素
                      </div>
                    </div>
                    
                    <input
                      type="file"
                      id="product-images"
                      style={{ display: 'none' }}
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      disabled={uploadingImages}
                    />

                    {images.length > 0 && (
                      <div className="image-grid">
                        {images.map((imageUrl, index) => (
                          <div key={index} className="image-item">
                            <img
                              src={`http://localhost:3001${imageUrl}`}
                              alt={`商品圖片 ${index + 1}`}
                            />
                            <button
                              type="button"
                              className="image-remove"
                              onClick={() => removeImage(imageUrl)}
                            >
                              ×
                            </button>
                            <button
                              type="button"
                              className={`image-set-thumbnail ${thumbnail === imageUrl ? 'active' : ''}`}
                              onClick={() => setThumbnail(imageUrl)}
                            >
                              {thumbnail === imageUrl ? '主圖' : '設為主圖'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="form-hint">
                    建議上傳高品質的商品圖片，第一張圖片將作為預設主圖顯示
                  </div>
                </div>
              </div>
            )}

            {useVariants && (
              <div className="info-box warning">
                <div className="info-box-icon">📷</div>
                <div className="info-box-content">
                  <div className="info-box-title">商品圖片管理</div>
                  <div className="info-box-text">
                    啟用變體管理後，每個變體可以設定專屬圖片。請在下方的變體設定中上傳圖片，這樣可以為不同規格展示不同的商品圖片。
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 商品變體管理 */}
          <div className="form-section">
            <div className="section-title">
              <span>🎯</span>
              商品變體管理（多規格銷售）
            </div>
            
            <div className="info-box success">
              <div className="info-box-icon">🎯</div>
              <div className="info-box-content">
                <div className="info-box-title">變體管理說明</div>
                <div className="info-box-text">
                  用於管理同一商品的不同規格版本（如顏色、尺寸），每個變體可設定獨立的價格、庫存和圖片。<br/>
                  <strong>範例：</strong>咖啡機有黑色（7台）和白色（2台），價格可能不同。
                </div>
              </div>
            </div>
            
            <div className="form-grid single-column">
              <div className="form-group">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="useVariants"
                    checked={useVariants}
                    onChange={(e) => setUseVariants(e.target.checked)}
                  />
                  <label htmlFor="useVariants" className="form-label">
                    <strong>啟用商品變體（多規格管理）</strong>
                  </label>
                </div>
                <div className="form-hint">
                  啟用後可為不同規格設定獨立的價格、庫存和圖片（如：黑色7台、白色2台）
                </div>
              </div>
            </div>

            {useVariants && (
              <div className="variant-section">
                <h4 style={{ marginBottom: '16px', color: '#1f2937', fontSize: '18px' }}>規格選項設定</h4>
                
                {variantOptions.map((option, optionIndex) => (
                  <div key={optionIndex} className="variant-option-item">
                    <div className="variant-option-header">
                      <input
                        type="text"
                        className="variant-option-input"
                        placeholder="規格名稱 (例：顏色、尺寸)"
                        value={option.name}
                        onChange={(e) => updateVariantOption(optionIndex, 'name', e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => removeVariantOption(optionIndex)}
                      >
                        🗑️ 刪除規格
                      </button>
                    </div>
                    
                    <div className="variant-value-input-group">
                      <input
                        type="text"
                        className="variant-option-input"
                        placeholder="新增選項值 (例：黑色、白色)"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addVariantValue(optionIndex, e.currentTarget.value)
                            e.currentTarget.value = ''
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement
                          addVariantValue(optionIndex, input.value)
                          input.value = ''
                        }}
                      >
                        ➕ 新增
                      </button>
                    </div>
                    
                    <div className="variant-values-display">
                      {option.values.map((value, valueIndex) => (
                        <span key={valueIndex} className="variant-value-tag">
                          {value}
                          <button
                            type="button"
                            className="variant-value-remove"
                            onClick={() => removeVariantValue(optionIndex, valueIndex)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={addVariantOption}
                >
                  ➕ 新增規格選項
                </button>
              </div>
            )}

            {/* 變體列表 */}
            {useVariants && variants.length > 0 && (
              <div className="variant-section">
                <h4 style={{ marginBottom: '16px', color: '#1f2937', fontSize: '18px' }}>商品變體列表</h4>
                <div className="form-hint" style={{ marginBottom: '16px' }}>
                  系統已自動生成 {variants.length} 個變體組合，請為每個變體設定價格、庫存和圖片
                </div>
                
                {variants.map((variant, variantIndex) => (
                  <div key={variantIndex} className={`variant-item ${variant.is_default ? 'default' : ''}`}>
                    <div className="variant-header">
                      <h5 className="variant-name">
                        {variant.variant_name}
                        {variant.is_default && <span className="variant-default-badge">(預設變體)</span>}
                      </h5>
                      <div className="checkbox-group">
                        <input
                          type="checkbox"
                          id={`default-${variantIndex}`}
                          checked={variant.is_default}
                          onChange={(e) => {
                            if (e.target.checked) {
                              // 設為預設時，取消其他變體的預設狀態
                              setVariants(prev => prev.map((v, i) => ({
                                ...v,
                                is_default: i === variantIndex
                              })))
                            }
                          }}
                        />
                        <label htmlFor={`default-${variantIndex}`}>設為預設</label>
                      </div>
                    </div>
                    
                    <div className="variant-fields">
                      <div className="variant-field">
                        <label className="variant-field-label">SKU</label>
                        <input
                          type="text"
                          className="variant-field-input"
                          value={variant.sku}
                          onChange={(e) => updateVariant(variantIndex, 'sku', e.target.value)}
                        />
                      </div>
                      <div className="variant-field">
                        <label className="variant-field-label">售價</label>
                        <input
                          type="number"
                          className="variant-field-input"
                          value={variant.price}
                          onChange={(e) => updateVariant(variantIndex, 'price', e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="variant-field">
                        <label className="variant-field-label">原價</label>
                        <input
                          type="number"
                          className="variant-field-input"
                          value={variant.original_price}
                          onChange={(e) => updateVariant(variantIndex, 'original_price', e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="variant-field">
                        <label className="variant-field-label">庫存</label>
                        <input
                          type="number"
                          className="variant-field-input"
                          value={variant.stock_quantity}
                          onChange={(e) => updateVariant(variantIndex, 'stock_quantity', e.target.value)}
                          min="0"
                        />
                      </div>
                    </div>
                    
                    {/* 變體圖片上傳 */}
                    <div className="image-upload-section">
                      <label className="variant-field-label">變體專屬圖片</label>
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => handleVariantImageUpload(variantIndex, e)}
                        disabled={uploadingImages}
                        style={{ fontSize: '12px', marginBottom: '8px' }}
                      />
                      
                      {variant.images.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {variant.images.map((imageUrl, imageIndex) => (
                            <div key={imageIndex} className="image-item" style={{ width: '60px', height: '60px' }}>
                              <img
                                src={`http://localhost:3001${imageUrl}`}
                                alt={`變體圖片 ${imageIndex + 1}`}
                                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                              />
                              <button
                                type="button"
                                className="image-remove"
                                onClick={() => removeVariantImage(variantIndex, imageUrl)}
                                style={{ width: '16px', height: '16px', fontSize: '10px' }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 運費管理區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>🚚</span>
              運費管理
            </div>
            
            <div className="info-box success">
              <div className="info-box-icon">🚚</div>
              <div className="info-box-content">
                <div className="info-box-title">運費設定說明</div>
                <div className="info-box-text">
                  您可以選擇使用預設的運費規則模板，或自訂此商品的專屬運費規則。<br/>
                  <strong>建議：</strong>使用運費規則模板可以統一管理，方便日後調整。
                </div>
              </div>
            </div>
            
            <div className="shipping-section">
              <div className="shipping-method-selector">
                <h4 style={{ marginBottom: '16px', color: '#1f2937' }}>運費設定方式</h4>
                
                {/* 運費規則模板選擇 */}
                <div className="shipping-method-option">
                  <input
                    type="radio"
                    id="useTemplate"
                    name="shippingMethod"
                    checked={!useCustomShipping}
                    onChange={() => setUseCustomShipping(false)}
                  />
                  <label htmlFor="useTemplate">
                    <strong>使用運費規則模板</strong>
                  </label>
                </div>
                
                {!useCustomShipping && (
                  <div className="shipping-template-select">
                    <div className="enhanced-select">
                      <select
                        className="form-select"
                        value={selectedShippingTemplate}
                        onChange={(e) => setSelectedShippingTemplate(e.target.value)}
                        style={{ maxWidth: '400px' }}
                      >
                        <option value="">請選擇運費規則模板</option>
                        {shippingTemplates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name} {template.is_default ? '(預設)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {selectedShippingTemplate && (
                      <div className="shipping-template-info">
                        {(() => {
                          const template = shippingTemplates.find(t => t.id.toString() === selectedShippingTemplate)
                          return template ? (
                            <div>
                              <div className="shipping-template-name">{template.name}</div>
                              <div className="shipping-template-description">{template.description}</div>
                              <div className="shipping-template-items">
                                <strong>包含的運送方式：</strong>
                                {template.items?.map((item: any, index: number) => (
                                  <div key={index} style={{ marginLeft: '16px', marginTop: '4px' }}>
                                    • {item.method}: 運費 ${item.base_fee}, 滿 ${item.free_shipping_threshold} 免運
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null
                        })()}
                      </div>
                    )}
                  </div>
                )}
                
                {/* 自訂運費規則 */}
                <div className="shipping-method-option">
                  <input
                    type="radio"
                    id="useCustom"
                    name="shippingMethod"
                    checked={useCustomShipping}
                    onChange={() => setUseCustomShipping(true)}
                  />
                  <label htmlFor="useCustom">
                    <strong>自訂此商品的運費規則</strong>
                  </label>
                </div>
                <div className="form-hint" style={{ marginLeft: '30px' }}>
                  為此商品設定專屬的運費規則，不使用模板
                </div>
              </div>
              
              {useCustomShipping && (
                <div>
                  <h4 style={{ marginBottom: '16px', color: '#1f2937' }}>自訂配送方式與運費設定</h4>
                  {shippingRules.map((rule, index) => (
                    <div key={index} className="shipping-rule-item">
                      <input
                        type="text"
                        className="shipping-rule-input"
                        placeholder="配送方式 (例：7-11超商取貨、宅配)"
                        value={rule.method}
                        onChange={(e) => handleShippingRuleChange(index, 'method', e.target.value)}
                      />
                      <div className="shipping-rule-fee-group">
                        <span className="shipping-rule-label">運費</span>
                        <input
                          type="number"
                          className="shipping-rule-fee-input"
                          placeholder="60"
                          value={rule.base_fee}
                          onChange={(e) => handleShippingRuleChange(index, 'base_fee', e.target.value)}
                          min="0"
                          step="1"
                        />
                        <span className="shipping-rule-label">元</span>
                      </div>
                      <div className="shipping-rule-fee-group">
                        <span className="shipping-rule-label">滿</span>
                        <input
                          type="number"
                          className="shipping-rule-fee-input"
                          placeholder="399"
                          value={rule.free_shipping_threshold}
                          onChange={(e) => handleShippingRuleChange(index, 'free_shipping_threshold', e.target.value)}
                          min="0"
                          step="1"
                        />
                        <span className="shipping-rule-label">元免運</span>
                      </div>
                      <button
                        type="button"
                        className={`btn btn-sm ${shippingRules.length === 1 ? 'btn-secondary' : 'btn-danger'}`}
                        onClick={() => removeShippingRule(index)}
                        disabled={shippingRules.length === 1}
                      >
                        🗑️ 刪除
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={addShippingRule}
                  >
                    ➕ 新增配送方式
                  </button>
                  <div className="form-hint" style={{ marginTop: '12px' }}>
                    設定不同配送方式的運費和免運門檻。例如：7-11超商取貨運費60元，滿399元免運；宅配運費210元，滿999元免運。空白的運費規則不會被儲存。
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 其他設定區塊 */}
          <div className="form-section">
            <div className="section-title">
              <span>⚙️</span>
              其他設定
            </div>
            
            <div className="form-grid two-column">
              <div className="form-group">
                <label htmlFor="tags" className="form-label">🏷️ 標籤</label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  className="form-input"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="例：熱銷,新品,限量"
                />
                <div className="form-hint">
                  用逗號分隔多個標籤，有助於商品分類和搜尋
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">📌 特殊設定</label>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="is_featured"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="is_featured">設為精選商品</label>
                </div>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="is_visible"
                    name="is_visible"
                    checked={formData.is_visible}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="is_visible">在前台顯示</label>
                </div>
                <div className="form-hint">
                  精選商品會優先顯示，取消前台顯示可隱藏商品
                </div>
              </div>
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="form-section">
            <div className="form-actions">
              <button
                type="button"
                onClick={() => router.push("/admin/products")}
                className="btn-form-secondary"
                disabled={loading}
              >
                <span>↩️</span>
                返回
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-form-primary"
              >
                <span>✨</span>
                {loading ? "建立中..." : "建立商品"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}