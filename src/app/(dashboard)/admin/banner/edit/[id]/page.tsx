'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

const API_BASE = 'http://localhost:3001'

export default function EditBannerPage() {
  const { id } = useParams()
  const router = useRouter()

  const [form, setForm] = useState({
    title: '',
    sort: 0,
    start_time: '',
    end_time: '',
    status: 'ACTIVE',
    desktop_image_url: '',
    mobile_image_url: '',
  })

  const [loading, setLoading] = useState(true)
  const [desktopFile, setDesktopFile] = useState<File | null>(null)
  const [mobileFile, setMobileFile] = useState<File | null>(null)

  const getImageUrl = (url: string) => {
    if (!url) return ''
    return url.startsWith('http') ? url : `${API_BASE}${url}`
  }

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_BASE}/banners/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setForm({
          ...data,
          sort: Number(data.sort),
          start_time: data.start_time.slice(0, 16),
          end_time: data.end_time.slice(0, 16),
        })
      } catch (err) {
        alert('載入失敗')
      } finally {
        setLoading(false)
      }
    }

    fetchBanner()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token')

      // 如果有圖片要上傳，先處理
      const upload = async (file: File) => {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch(`${API_BASE}/banners/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        })
        const result = await res.json()
        return result.url
      }

      let desktopUrl = form.desktop_image_url
      let mobileUrl = form.mobile_image_url

      if (desktopFile) desktopUrl = await upload(desktopFile)
      if (mobileFile) mobileUrl = await upload(mobileFile)

      const res = await fetch(`${API_BASE}/banners/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          sort: Number(form.sort),
          desktop_image_url: desktopUrl,
          mobile_image_url: mobileUrl,
          start_time: new Date(form.start_time).toISOString(),
          end_time: new Date(form.end_time).toISOString(),
        }),
      })

      if (!res.ok) throw new Error('更新失敗')

      alert('✅ 更新成功')
      router.push('/admin/banner')
    } catch (err: any) {
      alert(`❌ ${err.message}`)
    }
  }

  if (loading) return <div className="p-4">讀取中...</div>

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">編輯 Banner</h2>

      <div className="space-y-4 max-w-md">
        <input
          name="title"
          value={form.title}
          placeholder="標題"
          className="border p-2 w-full"
          onChange={handleChange}
        />

        <input
          type="datetime-local"
          name="start_time"
          value={form.start_time}
          className="border p-2 w-full"
          onChange={handleChange}
        />

        <input
          type="datetime-local"
          name="end_time"
          value={form.end_time}
          className="border p-2 w-full"
          onChange={handleChange}
        />

        <select
          name="status"
          value={form.status}
          className="border p-2 w-full"
          onChange={handleChange}
        >
          <option value="ACTIVE">啟用</option>
          <option value="INACTIVE">停用</option>
        </select>

        <input
          type="number"
          name="sort"
          value={form.sort}
          placeholder="排序"
          className="border p-2 w-full"
          onChange={handleChange}
        />

        <div>
          <p className="text-sm text-gray-600 mb-1">桌機圖片</p>
          <img
            src={getImageUrl(form.desktop_image_url)}
            className="max-w-[200px] rounded mb-2"
          />
          <input type="file" accept="image/*" onChange={(e) => setDesktopFile(e.target.files?.[0] || null)} />
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-1">手機圖片</p>
          <img
            src={getImageUrl(form.mobile_image_url)}
            className="max-w-[200px] rounded mb-2"
          />
          <input type="file" accept="image/*" onChange={(e) => setMobileFile(e.target.files?.[0] || null)} />
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={handleSubmit}
          >
            更新
          </button>
          <button
            type="button"
            className="bg-gray-400 text-white px-4 py-2 rounded"
            onClick={() => router.push('/admin/banner')}
          >
            返回
          </button>
        </div>
      </div>
    </div>
  )
}
