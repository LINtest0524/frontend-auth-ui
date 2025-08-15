'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

type PopupAnnouncement = {
  id: number
  title: string
  desktop_image_url?: string
  mobile_image_url?: string
  button_text?: string
  button_url?: string
  sort_order: number
  status: string
  start_date?: string
  end_date?: string
  company_code: string
}

// 格式化日期時間為本地時間格式 (台灣時區)
const formatDateTimeLocal = (dateString: string): string => {
  const date = new Date(dateString)
  // 調整為台灣時區 (UTC+8)
  const taiwanDate = new Date(date.getTime() + (8 * 60 * 60 * 1000))
  return taiwanDate.toISOString().slice(0, 16)
}

export default function EditPopupAnnouncementPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [formData, setFormData] = useState({
    title: '',
    desktop_image_url: '',
    mobile_image_url: '',
    button_text: '',
    button_url: '',
    sort_order: 0,
    status: 'active',
    start_date: '',
    end_date: '',
    company_code: 'a'
  })
  const [desktopImageFile, setDesktopImageFile] = useState<File | null>(null)
  const [mobileImageFile, setMobileImageFile] = useState<File | null>(null)
  const [desktopPreview, setDesktopPreview] = useState<string>('')
  const [mobilePreview, setMobilePreview] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchAnnouncement()
    }
  }, [id])

  const fetchAnnouncement = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/popup-announcements/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data: PopupAnnouncement = await response.json()
        setFormData({
          title: data.title,
          desktop_image_url: data.desktop_image_url || '',
          mobile_image_url: data.mobile_image_url || '',
          button_text: data.button_text || '',
          button_url: data.button_url || '',
          sort_order: data.sort_order,
          status: data.status,
          start_date: data.start_date ? formatDateTimeLocal(data.start_date) : '',
          end_date: data.end_date ? formatDateTimeLocal(data.end_date) : '',
          company_code: data.company_code
        })

        // 設置現有圖片預覽
        if (data.desktop_image_url) {
          setDesktopPreview(`${process.env.NEXT_PUBLIC_API_BASE}${data.desktop_image_url}`)
        }
        if (data.mobile_image_url) {
          setMobilePreview(`${process.env.NEXT_PUBLIC_API_BASE}${data.mobile_image_url}`)
        }
      } else {
        alert('獲取彈窗公告失敗')
        router.push('/admin/popup-announcement')
      }
    } catch (error) {
      console.error('獲取彈窗公告錯誤:', error)
      router.push('/admin/popup-announcement')
    } finally {
      setInitialLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sort_order' ? parseInt(value) || 0 : value
    }))
  }

  const handleDesktopImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setDesktopImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setDesktopPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleMobileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setMobileImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setMobilePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (file: File, type: 'desktop' | 'mobile'): Promise<string> => {
    const token = localStorage.getItem('token')
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/popup-announcements/upload/${type}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: uploadFormData
    })

    if (!response.ok) {
      throw new Error(`${type === 'desktop' ? '桌面版' : '手機版'}圖片上傳失敗`)
    }

    const result = await response.json()
    return result.path
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      let submitData = { ...formData }

      // 上傳新圖片
      if (desktopImageFile) {
        submitData.desktop_image_url = await uploadImage(desktopImageFile, 'desktop')
      }
      if (mobileImageFile) {
        submitData.mobile_image_url = await uploadImage(mobileImageFile, 'mobile')
      }

      // 更新彈窗公告
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/popup-announcements/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        router.push('/admin/popup-announcement')
      } else {
        alert('更新失敗')
      }
    } catch (error) {
      console.error('更新錯誤:', error)
      alert('更新失敗')
    } finally {
      setLoading(false)
    }
  }

  const PreviewModal = () => {
    if (!showPreview) return null

    const isMobile = window.innerWidth <= 768
    const imageUrl = isMobile && mobilePreview ? mobilePreview : desktopPreview

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold">{formData.title || '彈窗公告預覽'}</h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {imageUrl && (
            <div className="relative">
              <img
                src={imageUrl}
                alt="預覽"
                className="w-full h-auto object-cover"
                style={{ maxHeight: '400px' }}
              />
            </div>
          )}

          <div className="p-4 space-y-4">
            <div className="text-center text-sm text-gray-500">
              1 / 1
            </div>

            {formData.button_text && formData.button_url && (
              <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium">
                {formData.button_text}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (initialLoading) {
    return <div className="p-6">載入中...</div>
  }

  return (
    <div className="b-ibox">
      <div className="flex justify-between items-center mb-4">
        <h1>編輯彈窗公告</h1>
        <div className="space-x-2">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="b-btn-s2 b-btn-c3"
            disabled={!desktopPreview}
          >
            預覽效果
          </button>
          <Link
            href="/admin/popup-announcement"
            className="b-btn-s2 b-btn-c2"
          >
            返回列表
          </Link>
        </div>
      </div>

      <div className="b-ibox-s">
        <form onSubmit={handleSubmit} className="w100">
          <div className="b-form-group-1 w100 fl4">
            <label>公告標題 *</label>
            <input
              type="text"
              name="title"
              className="w70"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="請輸入公告標題"
              required
            />
          </div>

          <div className="b-form-group-2 w50 fl4 mb10">
            <label htmlFor="desktop-img">桌面版圖片</label>
            <input
              type="file"
              id="desktop-img"
              className="pt3 w70"
              accept="image/*"
              onChange={handleDesktopImageChange}
            />
          </div>

          <div className="b-form-group-2 w50 fl4 mb25 ml132">
            {desktopPreview && (
              <img
                src={desktopPreview}
                alt="桌面版預覽"
                className="b-banner-img"
              />
            )}
          </div>

          <div className="b-form-group-2 w50 fl4 mb10">
            <label htmlFor="mobile-img">手機版圖片</label>
            <input
              type="file"
              id="mobile-img"
              className="pt3 w70"
              accept="image/*"
              onChange={handleMobileImageChange}
            />
          </div>

          <div className="b-form-group-2 w50 fl4 mb25 ml132">
            {mobilePreview && (
              <img
                src={mobilePreview}
                alt="手機版預覽"
                className="b-banner-img"
              />
            )}
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>按鈕文字</label>
            <input
              type="text"
              name="button_text"
              className="w70"
              value={formData.button_text}
              onChange={handleInputChange}
              placeholder="例如：前往優惠、我要參加"
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>按鈕連結</label>
            <input
              type="url"
              name="button_url"
              className="w70"
              value={formData.button_url}
              onChange={handleInputChange}
              placeholder="https://example.com"
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>排序順序</label>
            <input
              type="number"
              name="sort_order"
              className="w70"
              value={formData.sort_order}
              onChange={handleInputChange}
              placeholder="數字越大越前面"
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>狀態</label>
            <select
              name="status"
              className="w70"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="active">啟用</option>
              <option value="inactive">停用</option>
            </select>
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>開始時間</label>
            <input
              type="datetime-local"
              name="start_date"
              className="w70"
              value={formData.start_date}
              onChange={handleInputChange}
            />
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>結束時間</label>
            <input
              type="datetime-local"
              name="end_date"
              className="w70"
              value={formData.end_date}
              onChange={handleInputChange}
            />
          </div>

          <div className="fl4 w100 b-btnbox">
            <button
              type="submit"
              disabled={loading}
              className="b-btn-s2 b-btn-c4 mr20"
            >
              {loading ? "更新中..." : "儲存送出"}
            </button>
            <button
              type="button"
              onClick={() => window.location.href = '/admin/popup-announcement'}
              className="b-btn-s2 b-btn-c1"
            >
              取消
            </button>
          </div>
        </form>
      </div>

      <PreviewModal />
    </div>
  )
}