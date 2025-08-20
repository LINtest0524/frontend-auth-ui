'use client';

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useUserStore } from "@/hooks/use-user-store";
import SunEditor from '@/components/SunEditor'

type ProductCategory = {
  id: number
  name: string
  slug: string
  is_active: boolean
}

type ProductVariant = {
  id?: number
  variant_name: string
  sku: string
  price: string
  original_price: string
  stock_quantity: string
  variant_options: Record<string, string>
  images: string[]
  is_default: boolean
}

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
  category_id?: number
  specifications?: Record<string, any> | Array<{key: string, value: string}>
  tags?: string[]
  status: string
  is_featured: boolean
  is_visible: boolean
  images?: string[]
  thumbnail?: string
  variants?: ProductVariant[]
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const [loading, setLoading] = useState(false)
  const [loadingProduct, setLoadingProduct] = useState(true)
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
  
  const [shippingRules, setShippingRules] = useState<{method: string, base_fee: string, free_shipping_threshold: string}[]>([
    { method: '', base_fee: '', free_shipping_threshold: '' }
  ])

  // 商品變體管理
  const [variants, setVariants] = useState<ProductVariant[]>([])
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
      fetch('http://localhost:3001/admin/product-category', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.ok ? res.json() : [])
        .then(setCategories)
        .catch(() => setCategories([]))
    }
  }, [companyId])

  // 載入產品資料
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
        .then((product: Product) => {
          setFormData({
            name: product.name,
            sku: product.sku,
            description: product.description || '',
            short_description: product.short_description || '',
            specifications_description: product.specifications_description || '',
            shipping_description: product.shipping_description || '',
            price: product.price.toString(),
            original_price: product.original_price?.toString() || '',
            stock_quantity: product.stock_quantity.toString(),
            min_stock: product.min_stock.toString(),
            category_id: product.category_id?.toString() || '',
            tags: product.tags ? product.tags.join(', ') : '',
            status: product.status,
            is_featured: product.is_featured,
            is_visible: product.is_visible,
          })
          setImages(product.images || [])
          setThumbnail(product.thumbnail || '')
          
          // 處理規格數據
          if (product.specifications) {
            // 檢查是否為陣列格式（新格式）
            if (Array.isArray(product.specifications)) {
              setSpecifications(product.specifications.map(spec => ({
                key: spec.key || '',
                value: spec.value || ''
              })))
            } 
            // 檢查是否為物件格式（舊格式）
            else if (typeof product.specifications === 'object' && Object.keys(product.specifications).length > 0) {
              const specsArray = Object.entries(product.specifications).map(([key, value]) => ({
                key,
                value: String(value)
              }))
              setSpecifications(specsArray)
            } else {
              setSpecifications([{ key: '', value: '' }])
            }
          } else {
            setSpecifications([{ key: '', value: '' }])
          }
          
          // 處理運費規則數據
          if (product.shipping_rules && Array.isArray(product.shipping_rules) && product.shipping_rules.length > 0) {
            setShippingRules(product.shipping_rules.map(rule => ({
              method: rule.method || '',
              base_fee: rule.base_fee?.toString() || '',
              free_shipping_threshold: rule.free_shipping_threshold?.toString() || ''
            })))
          } else {
            setShippingRules([{ method: '', base_fee: '', free_shipping_threshold: '' }])
          }

          // 處理變體數據
          if (product.variants && product.variants.length > 0) {
            setUseVariants(true)
            setVariants(product.variants.map(variant => ({
              id: variant.id,
              variant_name: variant.variant_name,
              sku: variant.sku,
              price: variant.price.toString(),
              original_price: variant.original_price?.toString() || '',
              stock_quantity: variant.stock_quantity.toString(),
              variant_options: variant.variant_options,
              images: variant.images || [],
              is_default: variant.is_default
            })))

            // 從變體中提取規格選項
            const optionsMap: Record<string, Set<string>> = {}
            product.variants.forEach(variant => {
              Object.entries(variant.variant_options).forEach(([key, value]) => {
                if (!optionsMap[key]) {
                  optionsMap[key] = new Set()
                }
                optionsMap[key].add(value)
              })
            })

            const extractedOptions = Object.entries(optionsMap).map(([name, values]) => ({
              name,
              values: Array.from(values)
            }))
            setVariantOptions(extractedOptions)
          } else {
            setUseVariants(false)
            setVariants([])
            setVariantOptions([])
          }
        })
        .catch(error => {
          console.error('載入產品失敗:', error)
          alert('載入產品失敗')
          router.push('/admin/products')
        })
        .finally(() => setLoadingProduct(false))
    }
  }, [productId, router])

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

  const handleSpecificationChange = (index: number, field: 'key' | 'value', value: string) => {
    setSpecifications(prev => {
      const newSpecs = [...prev]
      newSpecs[index][field] = value
      return newSpecs
    })
  }

  const addSpecification = () => {
    setSpecifications(prev => [...prev, { key: '', value: '' }])
  }

  const removeSpecification = (index: number) => {
    if (specifications.length > 1) {
      setSpecifications(prev => prev.filter((_, i) => i !== index))
    }
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
    if (useVariants && !loadingProduct) {
      generateVariants()
    }
  }, [variantOptions, useVariants, loadingProduct])

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

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      
      // 處理標籤
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      // 處理規格 - 保持陣列格式，允許重複的規格名稱
      const specificationsArray = specifications
        .filter(spec => spec.key.trim() && spec.value.trim())
        .map(spec => ({
          key: spec.key.trim(),
          value: spec.value.trim()
        }))

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
        id: variant.id, // 保留ID用於更新
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
        specifications: specificationsArray.length > 0 ? specificationsArray : undefined,
        shipping_rules: shippingRulesArray.length > 0 ? shippingRulesArray : undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        images: useVariants ? undefined : (images.length > 0 ? images : undefined), // 如果使用變體，主商品不設圖片
        thumbnail: useVariants ? undefined : (thumbnail || undefined),
        variants: variantsArray
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/admin/product/${productId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        alert('商品更新成功')
        router.push('/admin/products')
      } else {
        const errorData = await response.json()
        alert(`更新失敗: ${errorData.message || '未知錯誤'}`)
      }
    } catch (error) {
      console.error('更新商品錯誤:', error)
      alert('更新失敗')
    } finally {
      setLoading(false)
    }
  }

  if (loadingProduct) {
    return (
      <div className="b-ibox">
        <h1>載入中...</h1>
        <div className="b-ibox-s">
          <p>正在載入產品資料...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx>{`
        .se-wrapper-inner.se-wrapper-wysiwyg.sun-editor-editable {
          min-height: 300px;
        }
      `}</style>
      <div className="b-ibox">
        <h1>編輯商品</h1>

      <div className="b-ibox-s">
        <form onSubmit={handleSubmit} className="w100">
          <div className="b-form-group-1 w100 fl4">
            <label>商品名稱</label>
            <input
              type="text"
              name="name"
              className="w70"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="請輸入商品名稱"
              required
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>商品編號 (SKU)</label>
            <input
              type="text"
              name="sku"
              className="w70"
              value={formData.sku}
              onChange={handleInputChange}
              placeholder="請輸入商品編號"
              required
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>商品分類</label>
            <select
              name="category_id"
              className="w70"
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

          <div className="b-form-group-1 w100 fl4">
            <label>商品狀態</label>
            <select
              name="status"
              className="w70"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="ACTIVE">上架</option>
              <option value="INACTIVE">下架</option>
              <option value="OUT_OF_STOCK">缺貨</option>
            </select>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>簡短描述 (支援換行)</label>
            <textarea
              name="short_description"
              className="w70"
              rows={3}
              value={formData.short_description}
              onChange={handleInputChange}
              placeholder="請輸入商品簡短描述，可以使用 Enter 換行"
            />
            <small style={{ color: '#666', marginLeft: '132px', display: 'block', marginTop: '5px' }}>
              提示：直接按 Enter 鍵可換行
            </small>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>詳細描述</label>
            <div style={{ width: '70%' }}>
              <div className="suneditor-wrapper txtbox-9" >
                <SunEditor
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  placeholder="請輸入商品詳細描述..."
                  height="350px"
                />
              </div>
              <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                提示：SunEditor 專業級富文本編輯器，支援豐富的格式化功能、圖片上傳、表格、程式碼等
              </small>
            </div>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>規格說明</label>
            <div style={{ width: '70%' }}>
              <div className="suneditor-wrapper txtbox-9" >
                <SunEditor
                  value={formData.specifications_description}
                  onChange={handleSpecificationsDescriptionChange}
                  placeholder="請輸入商品規格說明..."
                  height="350px"
                />
              </div>
              <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                提示：用於前台「規格說明」分頁顯示的內容
              </small>
            </div>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>配送說明</label>
            <div style={{ width: '70%' }}>
              <div className="suneditor-wrapper txtbox-9" >
                <SunEditor
                  value={formData.shipping_description}
                  onChange={handleShippingDescriptionChange}
                  placeholder="請輸入配送與退換貨說明..."
                  height="350px"
                />
              </div>
              <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                提示：用於前台「配送說明」分頁顯示的內容
              </small>
            </div>
          </div>

          {!useVariants && (
            <>
              <div className="b-form-group-1 w100 fl4">
                <label>售價</label>
                <input
                  type="number"
                  name="price"
                  className="w70"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="請輸入售價"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="b-form-group-1 w100 fl4">
                <label>原價</label>
                <input
                  type="number"
                  name="original_price"
                  className="w70"
                  value={formData.original_price}
                  onChange={handleInputChange}
                  placeholder="請輸入原價（選填）"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="b-form-group-1 w100 fl4">
                <label>庫存數量</label>
                <input
                  type="number"
                  name="stock_quantity"
                  className="w70"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  placeholder="請輸入庫存數量"
                  min="0"
                />
              </div>
            </>
          )}

          {useVariants && (
            <div className="b-form-group-1 w100 fl4">
              <div style={{ 
                padding: '15px', 
                background: '#e3f2fd', 
                border: '1px solid #2196f3', 
                borderRadius: '6px',
                color: '#1565c0'
              }}>
                <strong>📦 使用變體模式</strong>
                <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
                  當啟用商品變體時，價格和庫存將由各個變體單獨管理，主商品的價格和庫存設定將被忽略。
                </p>
              </div>
            </div>
          )}

          <div className="b-form-group-1 w100 fl4">
            <label>最低庫存警告</label>
            <input
              type="number"
              name="min_stock"
              className="w70"
              value={formData.min_stock}
              onChange={handleInputChange}
              placeholder="請輸入最低庫存警告數量"
              min="0"
            />
          </div>

          {!useVariants && (
            <>
              <div className="b-form-group-2 w50 fl4 mb10">
                <label htmlFor="product-images">商品圖片</label>
                <input
                  type="file"
                  id="product-images"
                  className="pt3 w70"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  disabled={uploadingImages}
                />
                {uploadingImages && <small style={{ color: '#666', marginLeft: '132px', display: 'block', marginTop: '5px' }}>上傳中...</small>}
              </div>

              {images.length > 0 && (
                <div className="b-form-group-2 w100 fl4 mb25 ml132">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
                    {images.map((imageUrl, index) => (
                      <div key={index} style={{ position: 'relative' }}>
                        <img
                          src={`http://localhost:3001${imageUrl}`}
                          alt={`商品圖片 ${index + 1}`}
                          className="b-banner-img"
                          style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(imageUrl)}
                          style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            background: '#ff4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          ×
                        </button>
                        <button
                          type="button"
                          onClick={() => setThumbnail(imageUrl)}
                          style={{
                            position: 'absolute',
                            bottom: '2px',
                            left: '2px',
                            background: thumbnail === imageUrl ? '#007bff' : '#666',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            padding: '2px 6px',
                            fontSize: '10px',
                            cursor: 'pointer'
                          }}
                        >
                          {thumbnail === imageUrl ? '主圖' : '設為主圖'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {useVariants && (
            <div className="b-form-group-1 w100 fl4">
              <div style={{ 
                padding: '15px', 
                background: '#fff3cd', 
                border: '1px solid #ffc107', 
                borderRadius: '6px',
                color: '#856404'
              }}>
                <strong>🖼️ 圖片管理</strong>
                <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
                  當使用變體模式時，請在下方的各個變體中分別上傳圖片。主商品圖片將不會顯示。
                </p>
              </div>
            </div>
          )}

          <div className="b-form-group-1 w100 fl4">
            <label>商品規格</label>
            <div style={{ width: '70%' }}>
              {specifications.map((spec, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="規格名稱 (例：重量、顏色、尺寸)"
                    value={spec.key}
                    onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                    style={{ flex: '1', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                  <input
                    type="text"
                    placeholder="規格值 (例：1.5kg、紅色、30x20x10cm)"
                    value={spec.value}
                    onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                    style={{ flex: '1', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeSpecification(index)}
                    disabled={specifications.length === 1}
                    style={{
                      padding: '8px 12px',
                      background: specifications.length === 1 ? '#ccc' : '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: specifications.length === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    刪除
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addSpecification}
                style={{
                  padding: '8px 16px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '5px'
                }}
              >
                + 新增規格
              </button>
              <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                提示：可以新增多個規格項目，例如重量、顏色、尺寸等。空白的規格項目不會被儲存。
              </small>
            </div>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>運費管理</label>
            <div style={{ width: '70%' }}>
              <h4 style={{ marginBottom: '10px', color: '#333' }}>配送方式與運費設定</h4>
              {shippingRules.map((rule, index) => (
                <div key={index} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '2fr 1fr 1fr auto', 
                  gap: '10px', 
                  marginBottom: '10px', 
                  alignItems: 'center',
                  padding: '10px',
                  border: '1px solid #e9ecef',
                  borderRadius: '6px',
                  background: '#f8f9fa'
                }}>
                  <input
                    type="text"
                    placeholder="配送方式 (例：7-11超商取貨、宅配)"
                    value={rule.method}
                    onChange={(e) => handleShippingRuleChange(index, 'method', e.target.value)}
                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '12px', color: '#666' }}>運費</span>
                    <input
                      type="number"
                      placeholder="60"
                      value={rule.base_fee}
                      onChange={(e) => handleShippingRuleChange(index, 'base_fee', e.target.value)}
                      style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', width: '80px' }}
                      min="0"
                      step="1"
                    />
                    <span style={{ fontSize: '12px', color: '#666' }}>元</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '12px', color: '#666' }}>滿</span>
                    <input
                      type="number"
                      placeholder="399"
                      value={rule.free_shipping_threshold}
                      onChange={(e) => handleShippingRuleChange(index, 'free_shipping_threshold', e.target.value)}
                      style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', width: '80px' }}
                      min="0"
                      step="1"
                    />
                    <span style={{ fontSize: '12px', color: '#666' }}>元免運</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeShippingRule(index)}
                    disabled={shippingRules.length === 1}
                    style={{
                      padding: '8px 12px',
                      background: shippingRules.length === 1 ? '#ccc' : '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: shippingRules.length === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    刪除
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addShippingRule}
                style={{
                  padding: '8px 16px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '5px'
                }}
              >
                + 新增配送方式
              </button>
              <small style={{ color: '#666', display: 'block', marginTop: '10px' }}>
                提示：可以新增多個配送方式，例如7-11超商取貨、宅配等。空白的運費規則不會被儲存。
              </small>
            </div>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>標籤 (用逗號分隔)</label>
            <input
              type="text"
              name="tags"
              className="w70"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="例：熱銷,新品,限量"
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label htmlFor="featured">設為精選商品</label>
            <input
              type="checkbox"
              name="is_featured"
              checked={formData.is_featured}
              onChange={handleInputChange}
              id="featured"
              className="new-checkbox"
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label htmlFor="visible">在前台顯示</label>
            <input
              type="checkbox"
              name="is_visible"
              checked={formData.is_visible}
              onChange={handleInputChange}
              id="visible"
              className="new-checkbox"
            />
          </div>

          {/* 商品變體管理 */}
          <div className="b-form-group-1 w100 fl4">
            <label htmlFor="use-variants">使用商品變體</label>
            <input
              type="checkbox"
              name="use_variants"
              checked={useVariants}
              onChange={(e) => setUseVariants(e.target.checked)}
              id="use-variants"
              className="new-checkbox"
            />
            <small style={{ color: '#666', marginLeft: '10px' }}>
              啟用後可以為商品設定不同的規格選項（如顏色、尺寸等）
            </small>
          </div>

          {useVariants && (
            <>
              {/* 變體選項設定 */}
              <div className="b-form-group-1 w100 fl4">
                <label>變體選項設定</label>
                <div style={{ width: '70%' }}>
                  <h4 style={{ marginBottom: '10px', color: '#333' }}>規格選項 (例：顏色、尺寸)</h4>
                  {variantOptions.map((option, index) => (
                    <div key={index} style={{ 
                      marginBottom: '20px', 
                      padding: '15px',
                      border: '1px solid #e9ecef',
                      borderRadius: '6px',
                      background: '#f8f9fa'
                    }}>
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="選項名稱 (例：顏色、尺寸)"
                          value={option.name}
                          onChange={(e) => updateVariantOption(index, 'name', e.target.value)}
                          style={{ flex: '1', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeVariantOption(index)}
                          style={{
                            padding: '8px 12px',
                            background: '#ff4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          刪除選項
                        </button>
                      </div>
                      
                      <div style={{ marginBottom: '10px' }}>
                        <strong style={{ fontSize: '14px', color: '#555' }}>選項值：</strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                          {option.values.map((value, valueIndex) => (
                            <span
                              key={valueIndex}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '4px 8px',
                                background: '#007bff',
                                color: 'white',
                                borderRadius: '15px',
                                fontSize: '12px'
                              }}
                            >
                              {value}
                              <button
                                type="button"
                                onClick={() => removeVariantValue(index, valueIndex)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'white',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  padding: '0',
                                  marginLeft: '2px'
                                }}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                          type="text"
                          placeholder="輸入選項值 (例：紅色、藍色)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              const value = (e.target as HTMLInputElement).value.trim()
                              if (value) {
                                addVariantValue(index, value)
                                ;(e.target as HTMLInputElement).value = ''
                              }
                            }
                          }}
                          style={{ flex: '1', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement
                            const value = input.value.trim()
                            if (value) {
                              addVariantValue(index, value)
                              input.value = ''
                            }
                          }}
                          style={{
                            padding: '8px 12px',
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          新增值
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={addVariantOption}
                    style={{
                      padding: '10px 20px',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginTop: '10px'
                    }}
                  >
                    + 新增規格選項
                  </button>
                  
                  <small style={{ color: '#666', display: 'block', marginTop: '10px' }}>
                    提示：先設定規格選項（如顏色、尺寸），再為每個選項新增具體的值。系統會自動生成所有可能的變體組合。
                  </small>
                </div>
              </div>

              {/* 變體列表 */}
              {variants.length > 0 && (
                <div className="b-form-group-1 w100 fl4">
                  <label>商品變體管理</label>
                  <div style={{ width: '100%' }}>
                    <h4 style={{ marginBottom: '15px', color: '#333' }}>
                      變體列表 ({variants.length} 個變體)
                    </h4>
                    
                    <div style={{ 
                      display: 'grid', 
                      gap: '15px',
                      maxHeight: '600px',
                      overflowY: 'auto',
                      padding: '10px',
                      border: '1px solid #e9ecef',
                      borderRadius: '6px',
                      background: '#fafafa'
                    }}>
                      {variants.map((variant, index) => (
                        <div key={index} style={{
                          padding: '15px',
                          background: 'white',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr 1fr 1fr',
                            gap: '10px',
                            marginBottom: '15px'
                          }}>
                            <div>
                              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '5px' }}>
                                變體名稱
                              </label>
                              <input
                                type="text"
                                value={variant.variant_name}
                                onChange={(e) => updateVariant(index, 'variant_name', e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                              />
                            </div>
                            
                            <div>
                              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '5px' }}>
                                SKU
                              </label>
                              <input
                                type="text"
                                value={variant.sku}
                                onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                              />
                            </div>
                            
                            <div>
                              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '5px' }}>
                                售價
                              </label>
                              <input
                                type="number"
                                value={variant.price}
                                onChange={(e) => updateVariant(index, 'price', e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                min="0"
                                step="0.01"
                              />
                            </div>
                            
                            <div>
                              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '5px' }}>
                                原價
                              </label>
                              <input
                                type="number"
                                value={variant.original_price}
                                onChange={(e) => updateVariant(index, 'original_price', e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                          
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr 2fr',
                            gap: '10px',
                            marginBottom: '15px'
                          }}>
                            <div>
                              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '5px' }}>
                                庫存數量
                              </label>
                              <input
                                type="number"
                                value={variant.stock_quantity}
                                onChange={(e) => updateVariant(index, 'stock_quantity', e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                min="0"
                              />
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'end', gap: '10px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                                <input
                                  type="checkbox"
                                  checked={variant.is_default}
                                  onChange={(e) => {
                                    // 如果設為預設，取消其他變體的預設狀態
                                    if (e.target.checked) {
                                      setVariants(prev => prev.map((v, i) => ({
                                        ...v,
                                        is_default: i === index
                                      })))
                                    } else {
                                      updateVariant(index, 'is_default', false)
                                    }
                                  }}
                                />
                                預設變體
                              </label>
                            </div>
                            
                            <div>
                              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '5px' }}>
                                規格組合
                              </label>
                              <div style={{ 
                                display: 'flex', 
                                flexWrap: 'wrap', 
                                gap: '5px',
                                padding: '8px',
                                background: '#f8f9fa',
                                border: '1px solid #e9ecef',
                                borderRadius: '4px',
                                minHeight: '36px'
                              }}>
                                {Object.entries(variant.variant_options).map(([key, value]) => (
                                  <span
                                    key={key}
                                    style={{
                                      padding: '2px 8px',
                                      background: '#e9ecef',
                                      borderRadius: '12px',
                                      fontSize: '11px',
                                      color: '#495057'
                                    }}
                                  >
                                    {key}: {value}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          {/* 變體圖片 */}
                          <div>
                            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '5px' }}>
                              變體圖片
                            </label>
                            <input
                              type="file"
                              multiple
                              accept="image/jpeg,image/png,image/webp"
                              onChange={(e) => handleVariantImageUpload(index, e)}
                              style={{ marginBottom: '10px', fontSize: '12px' }}
                              disabled={uploadingImages}
                            />
                            
                            {variant.images.length > 0 && (
                              <div style={{ 
                                display: 'flex', 
                                gap: '10px', 
                                flexWrap: 'wrap',
                                marginTop: '10px'
                              }}>
                                {variant.images.map((imageUrl, imgIndex) => (
                                  <div key={imgIndex} style={{ position: 'relative' }}>
                                    <img
                                      src={`http://localhost:3001${imageUrl}`}
                                      alt={`變體圖片 ${imgIndex + 1}`}
                                      style={{ 
                                        width: '80px', 
                                        height: '80px', 
                                        objectFit: 'cover',
                                        borderRadius: '4px',
                                        border: '1px solid #dee2e6'
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeVariantImage(index, imageUrl)}
                                      style={{
                                        position: 'absolute',
                                        top: '-5px',
                                        right: '-5px',
                                        background: '#ff4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '18px',
                                        height: '18px',
                                        fontSize: '10px',
                                        cursor: 'pointer'
                                      }}
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
                    
                    <small style={{ color: '#666', display: 'block', marginTop: '10px' }}>
                      提示：每個變體都可以有獨立的價格、庫存和圖片。請確保至少有一個變體設為預設變體。
                    </small>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="fl4 w100 b-btnbox">
            <button
              type="submit"
              disabled={loading}
              className="b-btn-s2 b-btn-c4 mr20"
            >
              {loading ? "更新中..." : "儲存更新"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="b-btn-s2 b-btn-c1"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}