'use client'

import React, { useRef, useState } from 'react'
import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'

export default function FloatingAdCreatePage() {
  const [image, setImage] = useState<File | null>(null)
  const [form, setForm] = useState({
    title: '',
    link_url: '',
    target_blank: true,
    position: 'bottom-right',
    status: 'ACTIVE',
    sort: 0,
  })

  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
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

  const triggerImageUpload = () => {
    imageInputRef.current?.click()
  }

  const handleSubmit = async () => {
    if (!form.title || !form.link_url) {
      alert('請填寫必填欄位')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      console.log(' Token:', token ? 'exists' : 'missing')
      
      // 先上傳圖片（如果有）
      let imageUrl = ''
      if (image) {
        console.log('開始上傳圖片...')
        const imageFormData = new FormData()
        imageFormData.append('file', image)

        const uploadResponse = await fetch(`${API_BASE}/floating-ads/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: imageFormData,
        })

        console.log(' 圖片上傳回應:', uploadResponse.status)

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          imageUrl = uploadData.url
          console.log('  圖片上傳成功:', imageUrl)
        } else {
          const errorText = await uploadResponse.text()
          console.error('    圖片上傳失敗:', uploadResponse.status, errorText)
          alert(`圖片上傳失敗: ${uploadResponse.status}`)
          setLoading(false)
          return
        }
      }

      // 建立廣告
      const adData = {
        ...form,
        image_url: imageUrl,
      }

      const response = await fetch(`${API_BASE}/floating-ads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adData),
      })

      if (response.ok) {
        alert('  新增成功')
        window.location.href = '/admin/floating-ad'
      } else {
        const errorData = await response.json()
        alert(`    新增失敗: ${errorData.message || '未知錯誤'}`)
      }
    } catch (error) {
      console.error('新增錯誤:', error)
      alert('    新增失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="b-ibox">
      <h1>新增浮動廣告</h1>

      <div className="b-ibox-s">
        {/* 標題 */}
        <div className="b-form-group-2 w50 fl4 mb10">
          <label htmlFor="title">標題 *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={form.title}
            onChange={handleInputChange}
            className="pt3 w70"
            placeholder="請輸入廣告標題"
            required
          />
        </div>

        {/* 連結網址 */}
        <div className="b-form-group-2 w50 fl4 mb10">
          <label htmlFor="link_url">連結網址 *</label>
          <input
            type="url"
            id="link_url"
            name="link_url"
            value={form.link_url}
            onChange={handleInputChange}
            className="pt3 w70"
            placeholder="https://example.com"
            required
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
            checked={form.target_blank}
            onChange={handleInputChange}
            className="new-checkbox mr10"
          />
          在新視窗開啟連結
        </div>

        {/* 位置 */}
        <div className="b-form-group-2 w50 fl4 mb10">
          <label htmlFor="position">顯示位置</label>
          <select
            id="position"
            name="position"
            value={form.position}
            onChange={handleInputChange}
            className="pt3 w70"
          >
            <option value="top-right">右上角</option>
            <option value="bottom-right">右下角</option>
            <option value="top-left">左上角</option>
            <option value="bottom-left">左下角</option>
          </select>
        </div>

        {/* 狀態 */}
        <div className="b-form-group-2 w50 fl4 mb10">
          <label htmlFor="status">狀態</label>
          <select
            id="status"
            name="status"
            value={form.status}
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
            value={form.sort}
            onChange={handleInputChange}
            className="pt3 w70"
            placeholder="數字越小越前面"
            min="0"
          />
        </div>

        {/* 按鈕 */}
        <div className="fl4 w100 b-btnbox">
          <button
            onClick={handleSubmit}
            className="b-btn-s2 b-btn-c4 mr20"
            disabled={loading}
          >
            {loading ? '新增中...' : '送出'}
          </button>
          <Link href="/admin/floating-ad" className="b-btn-s2 b-btn-c2 h32">
            取消
          </Link>
        </div>
      </div>
    </div>
  )
}