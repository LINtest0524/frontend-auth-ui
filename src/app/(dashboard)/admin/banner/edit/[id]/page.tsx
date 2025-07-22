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

  if (loading) return <div>讀取中...</div>

  return (
    <div className="b-ibox">
      <h1>編輯 Banner</h1>

      <div className="b-ibox-s">

        <div className="b-form-group-2 w100 fl4 mb25">
          <label>標題</label>
          <input
            name="title"
            value={form.title}
            placeholder="標題"
            onChange={handleChange}
            className="w70"
          />
        </div>

        <div className="w50 fd1 mb25">
          <div className="b-form-group-2 fl4 w100">
            <label htmlFor="date-select-10">活動時間</label>
            <div className="w70 fl4">
              <input
                type="datetime-local"
                id="date-select-10"
                name="start_time"
                value={form.start_time}
                className="date-select flex1"
                onChange={handleChange}
              />
              <span className="dateto">到</span>
              <input
                type="datetime-local"
                name="end_time"
                value={form.end_time}
                className="date-select flex1"
                onChange={handleChange}
              />
            </div>
          </div>
        </div>



        <div className="b-form-group-2 fl4 w50 mb25">
          <label htmlFor="status-select-22">狀態</label>

          <select
            name="status"
            id="status-select-22"
            value={form.status}
            className="w70"
            onChange={handleChange}
          >
            <option value="ACTIVE">啟用</option>
            <option value="INACTIVE">停用</option>
          </select>
        </div>


        <div className="b-form-group-2 w50 fl4 mb25">
          <label htmlFor="sort">排序</label>
          <input
            type="number"
            id="sort"
            name="sort"
            value={form.sort === 0 ? '' : form.sort}
            placeholder="請輸入排序數字 - 數字越大越前面"
            className="border p-2 w-full w70"
            onChange={handleChange}
          />
        </div>



        <div className="b-form-group-2 w50 fl4 mb10">
          <label htmlFor="img-pc">桌機圖片</label>
          <input type="file" className="pt3 w70" accept="image/*" onChange={(e) => setDesktopFile(e.target.files?.[0] || null)} />
        </div>

        <div className="b-form-group-2 w50 fl4 mb25 ml132">
          <img
            src={getImageUrl(form.desktop_image_url)}
            className="b-banner-img"
          />
        </div>



        <div className="b-form-group-2 w50 fl4 mb10">
          <label htmlFor="img-pc">手機圖片</label>
          <input type="file" className="pt3 w70" accept="image/*" onChange={(e) => setMobileFile(e.target.files?.[0] || null)} />
        </div>

        <div className="b-form-group-2 w50 fl4 mb25 ml132">
          <img
            src={getImageUrl(form.mobile_image_url)}
            className="b-banner-img"
          />
        </div>



        <div className="fl4 w100 b-btnbox">
          <button
            onClick={handleSubmit}
            className="b-btn-s2 b-btn-c4 mr20"
          >
            更新
          </button>

          <button
          type="button"
            onClick={() => router.push('/admin/banner')}
            className="b-btn-s2 b-btn-c1 mr20"
          >
            返回
          </button>
        </div>






      </div>
    </div>
  )
}
