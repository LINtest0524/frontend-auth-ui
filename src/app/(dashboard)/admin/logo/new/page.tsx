'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export default function LogoCreatePage() {
  const router = useRouter()
  
  const [title, setTitle] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState('')

  const imageInputRef = useRef<HTMLInputElement | null>(null)

  const handleUpload = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const token = localStorage.getItem('token')
    
    const res = await fetch(`${API_BASE}/logo/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
    
    if (!res.ok) {
      throw new Error('圖片上傳失敗')
    }
    
    const data = await res.json()
    return data.path
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return alert('請輸入 LOGO 標題')
    if (!image) return alert('請選擇 LOGO 圖片')

    try {
      setLoading(true)

      // 先上傳圖片
      const imageUrl = await handleUpload(image)

      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/logo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          image_url: imageUrl,
          is_active: isActive,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`伺服器錯誤：${res.status} - ${errText}`)
      }

      alert('新增成功！')
      router.push('/admin/logo')
    } catch (err: any) {
      alert('新增失敗：' + err.message)
      console.error('新增失敗', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="b-ibox">
      <h1>新增 LOGO</h1>

      <div className="b-ibox-s">
        <form onSubmit={handleSubmit} className="w100">
          
          <div className="b-form-group-1 w100 fl4">
            <label>LOGO 標題</label>
            <input
              type="text"
              className="w70"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="請輸入 LOGO 標題"
              required
            />
          </div>

          <div className="b-form-group-2 w50 fl4 mb10">
            <label htmlFor="logo-img">LOGO 圖片</label>
            <input
              type="file"
              id="logo-img"
              className="pt3 w70"
              ref={imageInputRef}
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={e => {
                const file = e.target.files?.[0] || null
                if (file && !ACCEPTED_TYPES.includes(file.type)) {
                  alert('只接受 JPG / PNG / WEBP / GIF 圖片')
                  return
                }
                setImage(file)
                setPreview(file ? URL.createObjectURL(file) : '')
              }}
              required
            />
          </div>

          <div className="b-form-group-2 w50 fl4 mb25 ml132">
            {preview && (
              <img
                src={preview}
                alt="LOGO 預覽"
                className="b-banner-img"
                style={{ maxWidth: '200px', maxHeight: '100px', objectFit: 'contain' }}
              />
            )}
          </div>

          <div className="b-form-group-1 w100 fl4">
            <label>狀態</label>
            <div className="w70">
              <label className="b-checkbox">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                啟用 LOGO
              </label>
            </div>
          </div>

          <div className="fl4 w100 b-btnbox">
            <button
              type="submit"
              disabled={loading}
              className="b-btn-s2 b-btn-c4 mr20"
            >
              {loading ? '儲存中...' : '儲存送出'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/logo')}
              className="b-btn-s2 b-btn-c1"
            >
              取消
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}