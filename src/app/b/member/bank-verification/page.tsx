'use client'

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_BASE

type StatusType = 'PENDING' | 'APPROVED' | 'REJECTED' | null

export default function BankVerificationPage() {
  const [file, setFile] = useState<File | string | null>(null)
  const [status, setStatus] = useState<StatusType>(null)
  const [note, setNote] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [previewKey, setPreviewKey] = useState(0)

  const token = typeof window !== 'undefined' ? localStorage.getItem('portalToken') : null

  // ✅ 共用查詢函式
  const fetchStatus = async () => {
    if (!token) return

    try {
      const res = await axios.get(`${API_URL}/api/id-verification/me?type=BANK_ACCOUNT`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = res.data
      if (data) {
        setStatus(data.status)
        setNote(data.note ?? null)
        if (data.images && Array.isArray(data.images)) {
          setFile(data.images[0] || null)
        } else {
          console.warn("⚠️ 無法取得圖片資料")
        }

      }
    } catch (err) {
      console.error('❌ 查詢銀行驗證狀態失敗', err)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [token])

  const handleSubmit = async () => {
    if (!file) {
      alert('請選擇存摺封面照片')
      return
    }

    const formData = new FormData()
    formData.append('files', file as File)
    formData.append('type', 'BANK_ACCOUNT')

    try {
      const res = await axios.post(`${API_URL}/api/id-verification`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      })

      const msg = res.data.message || '上傳成功，等待審核中'
      alert(msg)

      // ✅ 成功後重新查詢
      await fetchStatus()

      if (fileRef.current) fileRef.current.value = ''
      setPreviewKey(prev => prev + 1)
    } catch (err) {
      console.error('❌ 上傳失敗', err)
      alert('上傳失敗，請稍後再試')
    }
  }

  const handleReset = async () => {
    try {
      await axios.delete(`${API_URL}/api/id-verification?type=BANK_ACCOUNT`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setFile(null)
      setStatus(null)
      setNote(null)
      setMessage('')
      setPreviewKey(prev => prev + 1)

      if (fileRef.current) fileRef.current.value = ''
      alert('資料已清除，請重新上傳')
    } catch (err) {
      console.error('❌ 清除失敗', err)
      alert('清除失敗，請稍後再試')
    }
  }

  const renderPreview = (file: File | string | null) => {
    if (!file) return null
    const url = typeof file === 'string' ? file : URL.createObjectURL(file)
    return (
      <img
        key={`${previewKey}-${url}`}
        src={url}
        alt="preview"
        className="w-40 h-auto border rounded mb-2"
      />
    )
  }

  const isDisabled = status === 'PENDING' || status === 'APPROVED'

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">銀行帳戶驗證</h1>

      {status === 'PENDING' && (
        <p className="text-blue-600 font-semibold mb-4">已送出審核，請耐心等待客服審核</p>
      )}
      {status === 'APPROVED' && (
        <p className="text-green-600 font-semibold mb-4">✅ 已通過銀行驗證</p>
      )}
      {status === 'REJECTED' && (
        <div className="mb-4">
          <p className="text-red-600 font-semibold">
            ❌ 驗證未通過：{note || '資料有誤，請重新上傳'}
          </p>
          <button
            onClick={handleReset}
            className="mt-2 bg-blue-500 text-white px-3 py-1 rounded"
          >
            重新驗證
          </button>
        </div>
      )}

      {status !== 'REJECTED' && (
        <>
          <div className="mb-4">
            <label className="block mb-1 font-medium">上傳存摺封面照片</label>
            {renderPreview(file)}
            {!isDisabled && (
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
            )}
          </div>

          {!isDisabled && (
            <button
              onClick={handleSubmit}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              送出審核
            </button>
          )}
        </>
      )}
    </div>
  )
}
