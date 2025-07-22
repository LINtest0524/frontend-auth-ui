'use client'

import React, { useRef, useState } from 'react'

const API_BASE = 'http://localhost:3001'
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

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

    // ✅ 回傳相對路徑就好，不要加 API_BASE
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

      // 清空表單
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
      if (desktopInputRef.current) desktopInputRef.current.value = ''
      if (mobileInputRef.current) mobileInputRef.current.value = ''
    } catch (err: any) {
      alert(`❌ 新增失敗：${err.message}`)
    }
  }

  return (
    <div className="b-ibox">
      <h1>新增 Banner</h1>


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
          <div className="b-form-group-2 fl4 w100 mb10">
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
            className="w70"
            onChange={handleChange}
          />
        </div>


        <div className="b-form-group-2 w50 fl4 mb10">
          <label htmlFor="img-pc">桌機圖片</label>
          <input
            type="file"
            id="img-pc"
            className="pt3 w70"
            ref={desktopInputRef}
            accept="image/jpeg,image/png,image/webp"
            onChange={e => {
              const file = e.target.files?.[0] || null
              if (file && !ACCEPTED_TYPES.includes(file.type)) {
                alert('只接受 JPG / PNG / WEBP 圖片')
                return
              }
              setDesktopImage(file)
              setPreview(prev => ({
                ...prev,
                desktop: file ? URL.createObjectURL(file) : '',
              }))
            }}
          />
        </div>

        <div className="b-form-group-2 w50 fl4 mb25 ml132">
          {preview.desktop && (
            <img
              src={preview.desktop}
              alt="桌機預覽"
              className="b-banner-img"
            />
          )}
        </div>



        <div className="b-form-group-2 w50 fl4 mb10">
          <label htmlFor="img-m">手機圖片</label>
          <input
            type="file"
            id="img-m"
            className="pt3 w70"
            ref={mobileInputRef}
            accept="image/jpeg,image/png,image/webp"
            onChange={e => {
              const file = e.target.files?.[0] || null
              if (file && !ACCEPTED_TYPES.includes(file.type)) {
                alert('只接受 JPG / PNG / WEBP 圖片')
                return
              }
              setMobileImage(file)
              setPreview(prev => ({
                ...prev,
                mobile: file ? URL.createObjectURL(file) : '',
              }))
            }}
          />
        </div>

        <div className="b-form-group-2 w50 fl4 mb25 ml132">
          {preview.mobile && (
            <img
              src={preview.mobile}
              alt="手機預覽"
              className="b-banner-img"
            />
          )}
        </div>
        
        <div className="fl4 w100 b-btnbox">
          <button
            onClick={handleSubmit}
            className="b-btn-s2 b-btn-c4 mr20"
          >
            送出
          </button>
        </div>


      </div>
    </div>
  )
}
