'use client'

import React, { useRef, useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'

type FloatingAd = {
  id: number
  title: string
  link_url: string
  image_url?: string
  target_blank: boolean
  position: string
  status: string
  sort: number
}

export default function FloatingAdEditPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    link_url: '',
    image_url: '',
    target_blank: true,
    position: 'bottom-right',
    status: 'ACTIVE',
    sort: 0,
  })

  const imageInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (id) {
      fetchFloatingAd()
    }
  }, [id])

  const fetchFloatingAd = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/floating-ads/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data: FloatingAd = await response.json()
        setFormData({
          title: data.title,
          link_url: data.link_url,
          image_url: data.image_url || '',
          target_blank: data.target_blank,
          position: data.position,
          status: data.status,
          sort: data.sort,
        })
        
        // 設定現有圖片預覽
        if (data.image_url) {
          setPreview(`${API_BASE}${data.image_url}`)
        }
      } else {
        alert('獲取廣告資料失敗')
        router.push('/admin/floating-ad')
      }
    } catch (error) {
      console.error('獲取廣告錯誤:', error)
      alert('獲取廣告資料失敗')
      router.push('/admin/floating-ad')
    } finally {
      setFetching(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImage(file)
    
    // 建立預覽
    const reader = new FileReader()
    reader.onload = (event) => {
      setPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.link_url) {
      alert('請填寫必填欄位')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      
      // 先上傳圖片（如果有新圖片）
      let imageUrl = formData.image_url // 保持原有圖片
      if (image) {
        const imageFormData = new FormData()
        imageFormData.append('file', image)

        const uploadResponse = await fetch(`${API_BASE}/floating-ads/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: imageFormData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          imageUrl = uploadData.url
        } else {
          alert('圖片上傳失敗')
          setLoading(false)
          return
        }
      }

      // 更新廣告
      const adData = {
        ...formData,
        image_url: imageUrl,
      }

      const response = await fetch(`${API_BASE}/floating-ads/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adData),
      })

      if (response.ok) {
        alert('  修改成功')
        window.location.href = '/admin/floating-ad'
      } else {
        const errorData = await response.json()
        alert(`    修改失敗: ${errorData.message || '未知錯誤'}`)
      }
    } catch (error) {
      console.error('修改錯誤:', error)
      alert('    修改失敗')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">載入中...</div>
      </div>
    )
  }

  return (
    <div className="b-ibox">
      <h1>編輯浮動廣告</h1>

      <div className="b-ibox-s">
        {/* 標題 */}
        <div className="b-form-group-2 w50 fl4 mb10">
          <label htmlFor="title">標題 *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            className="pt3 w70"
            placeholder="請輸入廣告標題"
          />
        </div>

        {/* 連結網址 */}
        <div className="b-form-group-2 w50 fl4 mb10">
          <label htmlFor="link_url">連結網址 *</label>
          <input
            type="url"
            id="link_url"
            name="link_url"
            value={formData.link_url}
            onChange={handleInputChange}
            required
            className="pt3 w70"
            placeholder="https://example.com"
          />
        </div>

        {/* 圖片上傳 */}
        <div className="b-form-group-2 w50 fl4 mb10">
          <label htmlFor="img">廣告圖片</label>
          <input
            type="file"
            id="img"
            className="pt3 w70"
            ref={imageInputRef}
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
          />
        </div>

        <div className="b-form-group-2 w50 fl4 mb25 ml132">
          {preview && (
            <img
              src={preview}
              alt="圖片預覽"
              className="b-banner-img"
            />
          )}
        </div>

        {/* 開啟方式 */}
        <div className="b-form-group-2 w50 fl4 mb10">
          <label>開啟方式</label>
          <input
            type="checkbox"
            name="target_blank"
            checked={formData.target_blank}
            onChange={handleInputChange}
            className="new-checkbox mr10"
          />
          <p>在新視窗開啟連結</p>
        </div>

        {/* 位置 */}
        <div className="b-form-group-2 w50 fl4 mb10">
          <label htmlFor="position">顯示位置</label>
          <select
            id="position"
            name="position"
            value={formData.position}
            onChange={handleInputChange}
            className="pt3 w70"
          >
            <option value="bottom-right">右下角</option>
            <option value="bottom-left">左下角</option>
            <option value="top-right">右上角</option>
            <option value="top-left">左上角</option>
          </select>
        </div>

        {/* 狀態 */}
        <div className="b-form-group-2 w50 fl4 mb10">
          <label htmlFor="status">狀態</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="pt3 w70"
          >
            <option value="ACTIVE">啟用</option>
            <option value="INACTIVE">停用</option>
          </select>
        </div>

        {/* 排序 */}
        <div className="b-form-group-2 w50 fl4 mb10">
          <label htmlFor="sort">排序</label>
          <input
            type="number"
            id="sort"
            name="sort"
            value={formData.sort}
            onChange={handleInputChange}
            min="0"
            className="pt3 w70"
            placeholder="數字越小越前面"
          />
        </div>

        {/* 按鈕 */}
        <div className="fl4 w100 b-btnbox">
          <button
            onClick={handleSubmit}
            className="b-btn-s2 b-btn-c4 mr20"
            disabled={loading}
          >
            {loading ? '修改中...' : '送出'}
          </button>
          <Link href="/admin/floating-ad" className="b-btn-s2 b-btn-c2 h32">
            取消
          </Link>
        </div>
      </div>
    </div>
  )
}