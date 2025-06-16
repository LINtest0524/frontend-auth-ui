'use client'

import React, { useRef, useState } from 'react'

const API_BASE = 'http://localhost:3001'

export default function BannerPage() {
  const [desktopImage, setDesktopImage] = useState<File | null>(null)
  const [mobileImage, setMobileImage] = useState<File | null>(null)
  const [form, setForm] = useState({
    title: '',
    start_time: '',
    end_time: '',
    sort: 0,
    status: 'ACTIVE',
  })

  const desktopInputRef = useRef<HTMLInputElement | null>(null)
  const mobileInputRef = useRef<HTMLInputElement | null>(null)

  const [preview, setPreview] = useState({
    desktop: '',
    mobile: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleUpload = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${API_BASE}/banners/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    })
    const data = await res.json()
    return data.url
  }

  const handleSubmit = async () => {
    if (!desktopImage || !mobileImage) {
      alert('請選擇桌機與手機圖片')
      return
    }

    try {
      const desktopUrl = await handleUpload(desktopImage)
      const mobileUrl = await handleUpload(mobileImage)

      const payload = {
        ...form,
        sort: Number(form.sort),
        desktop_image_url: desktopUrl,
        mobile_image_url: mobileUrl,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        company: { id: 1 },
      }

      const res = await fetch(`${API_BASE}/banners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(err || '送出失敗')
      }

      alert('✅ 新增成功！')

      // ✅ 清空狀態
      setForm({
        title: '',
        start_time: '',
        end_time: '',
        sort: 0,
        status: 'ACTIVE',
      })
      setDesktopImage(null)
      setMobileImage(null)
      setPreview({ desktop: '', mobile: '' })

      // ✅ 清空 <input type="file">
      if (desktopInputRef.current) desktopInputRef.current.value = ''
      if (mobileInputRef.current) mobileInputRef.current.value = ''

    } catch (err: any) {
      alert(`❌ 新增失敗：${err.message}`)
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">新增 Banner</h2>
      <div className="space-y-4">
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

        <div className="flex flex-col gap-2">
        <label htmlFor="sort">排序（數字越大越前面）</label>
        <input
            type="number"
            id="sort"
            name="sort"
            value={form.sort === 0 ? '' : form.sort}
            placeholder="請輸入排序數字"
            className="border p-2 w-full"
            onChange={handleChange}
        />
        </div>


        <div className="flex flex-col gap-2">
          <label>桌機圖片</label>
          <input
            type="file"
            ref={desktopInputRef}
            accept="image/*"
            onChange={e => {
              const file = e.target.files?.[0] || null
              setDesktopImage(file)
              setPreview(prev => ({
                ...prev,
                desktop: file ? URL.createObjectURL(file) : '',
              }))
            }}
          />
          {preview.desktop && <img src={preview.desktop} alt="桌機預覽" className="w-1/2 mt-2" />}
        </div>

        <div className="flex flex-col gap-2">
          <label>手機圖片</label>
          <input
            type="file"
            ref={mobileInputRef}
            accept="image/*"
            onChange={e => {
              const file = e.target.files?.[0] || null
              setMobileImage(file)
              setPreview(prev => ({
                ...prev,
                mobile: file ? URL.createObjectURL(file) : '',
              }))
            }}
          />
          {preview.mobile && <img src={preview.mobile} alt="手機預覽" className="w-1/2 mt-2" />}
        </div>

        <button
          type="button"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handleSubmit}
        >
          送出
        </button>
      </div>
    </div>
  )
}
