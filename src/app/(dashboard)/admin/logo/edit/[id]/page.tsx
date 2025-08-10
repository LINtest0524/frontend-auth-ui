'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

type Logo = {
  id: number
  title: string
  image_url: string
  is_active: boolean
  company: {
    id: number
    name: string
    code: string
  }
  createdAt: string
}

export default function LogoEditPage() {
  const router = useRouter()
  const params = useParams()
  const logoId = params.id as string
  
  const [title, setTitle] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [preview, setPreview] = useState('')

  const imageInputRef = useRef<HTMLInputElement | null>(null)

  const fetchLogo = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/logo/${logoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const logo: Logo = await response.json()
        setTitle(logo.title)
        setCurrentImageUrl(logo.image_url)
        setIsActive(logo.is_active)
      } else {
        alert('無法載入 LOGO 資料')
        router.push('/admin/logo')
      }
    } catch (error) {
      console.error('Failed to fetch logo:', error)
      alert('載入失敗')
      router.push('/admin/logo')
    } finally {
      setFetchLoading(false)
    }
  }

  useEffect(() => {
    if (logoId) {
      fetchLogo()
    }
  }, [logoId])

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

    try {
      setLoading(true)

      let imageUrl = currentImageUrl
      
      // 如果有新圖片，先上傳
      if (image) {
        imageUrl = await handleUpload(image)
      }

      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/logo/${logoId}`, {
        method: 'PATCH',
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

      alert('更新成功！')
      router.push('/admin/logo')
    } catch (err: any) {
      alert('更新失敗：' + err.message)
      console.error('更新失敗', err)
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="b-ibox">
        <h1>編輯 LOGO</h1>
        <div className="b-ibox-s">載入中...</div>
      </div>
    )
  }

  return (
    <div className="b-ibox">
      <h1>編輯 LOGO</h1>

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
            />
            <div className="mt5 text-sm text-gray-600">
              如不選擇新圖片，將保持原有圖片
            </div>
          </div>

          <div className="b-form-group-2 w50 fl4 mb25 ml132">
            {preview ? (
              <img
                src={preview}
                alt="新 LOGO 預覽"
                className="b-banner-img"
                style={{ maxWidth: '200px', maxHeight: '100px', objectFit: 'contain' }}
              />
            ) : currentImageUrl ? (
              <div>
                <div className="mb5 text-sm">目前的 LOGO：</div>
                <img
                  src={`${API_BASE}${currentImageUrl}`}
                  alt="目前 LOGO"
                  className="b-banner-img"
                  style={{ maxWidth: '200px', maxHeight: '100px', objectFit: 'contain' }}
                />
              </div>
            ) : null}
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
              {loading ? '更新中...' : '更新送出'}
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