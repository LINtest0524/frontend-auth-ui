'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useUserStore } from "@/hooks/use-user-store"
import SunEditor from '@/components/SunEditor'

interface PromotionCategory {
  id: number
  name: string
}

interface Promotion {
  id: number
  title: string
  summary: string
  content: string
  categoryId: number
  imageUrl: string
  startDate: string
  endDate: string
  sortOrder: number
  isActive: boolean
}

export default function EditPromotionPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const currentUser = useUserStore((state) => state.user)
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [categories, setCategories] = useState<PromotionCategory[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    categoryId: '',
    imageUrl: '',
    startDate: '',
    endDate: '',
    sortOrder: 0,
    isActive: true,
  })

  useEffect(() => {
    // 從 localStorage 獲取用戶資訊
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      useUserStore.getState().setUser(user)
    }
    
    fetchPromotion()
    fetchCategories()
  }, [id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleContentChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      content
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    const formDataUpload = new FormData()
    formDataUpload.append('file', file)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataUpload,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({
          ...prev,
          imageUrl: data.url
        }))
      } else {
        alert('圖片上傳失敗')
      }
    } catch (error) {
      console.error('圖片上傳錯誤:', error)
      alert('圖片上傳失敗')
    } finally {
      setUploadingImage(false)
    }
  }

  const fetchPromotion = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/promotions/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data: Promotion = await response.json()
        setFormData({
          title: data.title,
          summary: data.summary || '',
          content: data.content,
          categoryId: data.categoryId?.toString() || '',
          imageUrl: data.imageUrl || '',
          startDate: data.startDate ? new Date(data.startDate).toISOString().slice(0, 16) : '',
          endDate: data.endDate ? new Date(data.endDate).toISOString().slice(0, 16) : '',
          sortOrder: data.sortOrder,
          isActive: data.isActive,
        })
      } else {
        alert('獲取優惠活動失敗')
        router.back()
      }
    } catch (error) {
      console.error('獲取優惠活動失敗:', error)
      alert('獲取優惠活動失敗')
      router.back()
    } finally {
      setFetching(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/promotion-categories/active`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('獲取活動類型失敗:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const submitData = {
        ...formData,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      }

      const response = await fetch(`http://localhost:3001/promotions/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        alert('優惠活動更新成功')
        router.push('/admin/promotions')
      } else {
        const error = await response.json()
        alert(error.message || '更新失敗')
      }
    } catch (error) {
      console.error('更新優惠活動失敗:', error)
      alert('更新失敗')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="b-ibox">
        <h1>載入中...</h1>
        <div className="b-ibox-s">
          <p>正在載入優惠活動資料...</p>
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
        <h1>編輯優惠活動</h1>

        <div className="b-ibox-s">
          <form onSubmit={handleSubmit} className="w100">
            <div className="b-form-group-1 w100 fl4">
              <label>活動標題</label>
              <input
                type="text"
                name="title"
                className="w70"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="請輸入活動標題"
                required
              />
            </div>

            <div className="b-form-group-1 w100 fl4">
              <label>活動類型</label>
              <select
                name="categoryId"
                className="w70"
                value={formData.categoryId}
                onChange={handleInputChange}
              >
                <option value="">請選擇活動類型</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="b-form-group-1 w100 fl4">
              <label>活動摘要</label>
              <textarea
                name="summary"
                className="w70"
                rows={3}
                value={formData.summary}
                onChange={handleInputChange}
                placeholder="請輸入活動摘要"
              />
              <small style={{ color: '#666', marginLeft: '132px', display: 'block', marginTop: '5px' }}>
                提示：活動摘要會顯示在列表頁面
              </small>
            </div>

            <div className="b-form-group-1 w100 fl4">
              <label>活動內容</label>
              <div style={{ width: '70%' }}>
                <div className="suneditor-wrapper txtbox-9">
                  <SunEditor
                    value={formData.content}
                    onChange={handleContentChange}
                    placeholder="請輸入活動詳細內容..."
                    height="400px"
                  />
                </div>
                <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                  提示：SunEditor 專業級富文本編輯器，支援豐富的格式化功能、圖片上傳、表格、程式碼等
                </small>
              </div>
            </div>

            <div className="b-form-group-1 w100 fl4">
              <label>活動圖片</label>
              <div style={{ width: '70%' }}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  style={{ marginBottom: '10px' }}
                />
                {uploadingImage && <p style={{ color: '#666', fontSize: '12px' }}>上傳中...</p>}
                
                <input
                  type="text"
                  name="imageUrl"
                  className="w100"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="或直接輸入圖片網址（選填）"
                  style={{ marginTop: '10px' }}
                />
                
                {formData.imageUrl && (
                  <div style={{ marginTop: '10px' }}>
                    <img
                      src={formData.imageUrl.startsWith('http') ? formData.imageUrl : `http://localhost:3001${formData.imageUrl}`}
                      alt="活動圖片預覽"
                      style={{ 
                        maxWidth: '300px', 
                        height: 'auto', 
                        borderRadius: '4px',
                        border: '1px solid #dee2e6'
                      }}
                    />
                  </div>
                )}
                <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                  提示：可以上傳檔案或輸入圖片網址。建議圖片尺寸 800x400 像素，支援 JPG、PNG、WebP 格式。相對路徑如 /uploads/banner/xxx.jpg 也可以使用。
                </small>
              </div>
            </div>

            <div className="b-form-group-1 w100 fl4">
              <label>開始時間</label>
              <input
                type="datetime-local"
                name="startDate"
                className="w70"
                value={formData.startDate}
                onChange={handleInputChange}
              />
            </div>

            <div className="b-form-group-1 w100 fl4">
              <label>結束時間</label>
              <input
                type="datetime-local"
                name="endDate"
                className="w70"
                value={formData.endDate}
                onChange={handleInputChange}
              />
            </div>

            <div className="b-form-group-1 w100 fl4">
              <label>排序順序</label>
              <input
                type="number"
                name="sortOrder"
                className="w70"
                value={formData.sortOrder}
                onChange={handleInputChange}
                placeholder="數字越小排序越前面"
              />
              <small style={{ color: '#666', marginLeft: '132px', display: 'block', marginTop: '5px' }}>
                提示：數字越小排序越前面，相同數字按建立時間排序
              </small>
            </div>

            <div className="b-form-group-1 w100 fl4">
              <label>啟用狀態</label>
              <div style={{ width: '70%', paddingTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    style={{ marginRight: '8px' }}
                  />
                  <span>啟用活動</span>
                </label>
                <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                  提示：停用的活動不會在前台顯示
                </small>
              </div>
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
                onClick={() => router.push("/admin/promotions")}
                className="b-btn-s2 b-btn-c1"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}