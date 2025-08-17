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
  specifications?: Record<string, any>
  tags?: string[]
  status: string
  is_featured: boolean
  is_visible: boolean
  images?: string[]
  thumbnail?: string
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
          if (product.specifications && Object.keys(product.specifications).length > 0) {
            const specsArray = Object.entries(product.specifications).map(([key, value]) => ({
              key,
              value: String(value)
            }))
            setSpecifications(specsArray)
          } else {
            setSpecifications([{ key: '', value: '' }])
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

    if (!formData.name.trim() || !formData.sku.trim() || !formData.price) {
      alert('請填寫必要欄位')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      
      // 處理標籤
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      // 處理規格
      const specificationsObj = specifications
        .filter(spec => spec.key.trim() && spec.value.trim())
        .reduce((acc, spec) => {
          acc[spec.key.trim()] = spec.value.trim()
          return acc
        }, {} as Record<string, string>)

      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : undefined,
        stock_quantity: parseInt(formData.stock_quantity),
        min_stock: parseInt(formData.min_stock),
        category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
        specifications: Object.keys(specificationsObj).length > 0 ? specificationsObj : undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        images: images.length > 0 ? images : undefined,
        thumbnail: thumbnail || undefined,
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