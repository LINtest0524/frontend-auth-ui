'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUserStore } from '@/hooks/use-user-store'
import SunEditor from '@/components/SunEditor'

type NewsDetail = {
  id: number
  title: string
  summary: string
  content: string
  image_url?: string
  category: string
  status: string
  is_featured: boolean
  publish_date: string
}

export default function EditNewsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  
  const newsId = params.id
  
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    image_url: '',
    category: 'GENERAL',
    status: 'DRAFT',
    is_featured: false,
    publish_date: '',
  })

  useEffect(() => {
    if (!newsId) return

    const fetchNews = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/news/${newsId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const news: NewsDetail = await response.json()
          setFormData({
            title: news.title,
            summary: news.summary,
            content: news.content,
            image_url: news.image_url || '',
            category: news.category,
            status: news.status,
            is_featured: news.is_featured,
            publish_date: new Date(news.publish_date).toISOString().slice(0, 16),
          })
        } else {
          alert('無法載入新聞資料')
          router.push('/admin/news')
        }
      } catch (error) {
        console.error('Failed to fetch news:', error)
        alert('載入失敗')
        router.push('/admin/news')
      } finally {
        setFetchLoading(false)
      }
    }

    fetchNews()
  }, [newsId, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleEditorChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const token = localStorage.getItem('token')
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/news/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: uploadFormData,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({ ...prev, image_url: data.url }))
      } else {
        alert('圖片上傳失敗')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('圖片上傳失敗')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/news/${newsId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/admin/news')
      } else {
        alert('更新失敗')
      }
    } catch (error) {
      console.error('Failed to update news:', error)
      alert('更新失敗')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">編輯最新消息</h1>
        <button
          onClick={() => router.push('/admin/news')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          返回列表
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 標題 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              標題 *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 摘要 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              摘要 *
            </label>
            <textarea
              name="summary"
              value={formData.summary}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 內容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              內容 (富文本編輯器) *
            </label>
            <div className="border border-gray-300 rounded-md">
              <SunEditor
                value={formData.content}
                onChange={handleEditorChange}
                placeholder="請輸入新聞內容..."
                height="400px"
              />
            </div>
            <small className="text-gray-500 text-sm mt-1 block">
              提示：SunEditor 專業級富文本編輯器，支援豐富的格式化功能、圖片上傳、表格、程式碼等
            </small>
          </div>

          {/* 圖片上傳 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              圖片
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {uploading && <p className="text-sm text-blue-600 mt-1">上傳中...</p>}
            {formData.image_url && (
              <div className="mt-2">
                <img
                  src={`${process.env.NEXT_PUBLIC_API_BASE}${formData.image_url}`}
                  alt="預覽"
                  className="max-w-xs h-auto rounded"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  移除圖片
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 分類 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分類
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="GENERAL">一般消息</option>
                <option value="ANNOUNCEMENT">重要公告</option>
                <option value="PROMOTION">優惠活動</option>
                <option value="UPDATE">系統更新</option>
              </select>
            </div>

            {/* 狀態 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                狀態
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="DRAFT">草稿</option>
                <option value="ACTIVE">已發布</option>
                <option value="INACTIVE">未發布</option>
              </select>
            </div>
          </div>

          {/* 發布時間 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              發布時間
            </label>
            <input
              type="datetime-local"
              name="publish_date"
              value={formData.publish_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 置頂 */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_featured"
              checked={formData.is_featured}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              設為置頂
            </label>
          </div>

          {/* 提交按鈕 */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/admin/news')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '更新中...' : '更新'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}