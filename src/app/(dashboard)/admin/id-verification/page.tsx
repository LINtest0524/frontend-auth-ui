'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import Image from 'next/image'
import { format } from 'date-fns'

interface VerificationRecord {
  id: number
  username: string
  type: 'ID_CARD' | 'BANK_ACCOUNT'
  createdAt: string
  images: string[]
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  note: string | null
}

export default function IdVerificationAdminPage() {
  const [records, setRecords] = useState<VerificationRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[] | null>(null)

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE}/api/id-verification/admin`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      setRecords(res.data)
    } catch (err) {
      console.error('讀取失敗：', err)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (
    id: number,
    status: 'APPROVED' | 'REJECTED',
    note: string
  ) => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/id-verification/admin`,
        {
          identity_verification_id: id,
          status,
          note,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )
      fetchRecords()
    } catch (err) {
      console.error('送出審核失敗', err)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">身分驗證審核</h1>
      {loading && <p>載入中...</p>}
      {!loading && records.length === 0 && <p>目前沒有待審紀錄</p>}
      <div className="space-y-4">
        {records.map((rec) => (
          <div
            key={rec.id}
            className="border rounded shadow p-4 bg-white space-y-2"
          >
            <div className="flex justify-between">
              <span>帳號：<strong>{rec.username}</strong></span>
              <span>時間：{format(new Date(rec.createdAt), 'yyyy-MM-dd HH:mm:ss')}</span>
            </div>
            <div>類型：{rec.type === 'ID_CARD' ? '身分證驗證' : '銀行帳戶驗證'}</div>

            {/* 🔍 放大圖示 */}
            <div className="flex items-center space-x-2">
              <button
                className="text-blue-600 underline text-sm"
                onClick={() => setPreviewImages(rec.images)}
              >
                🔍 預覽圖片
              </button>
            </div>

            {/* 處理下拉和備註 */}
            <div className="space-x-2">
              <select
                defaultValue={rec.status}
                onChange={(e) =>
                  handleReview(rec.id, e.target.value as 'APPROVED' | 'REJECTED', rec.note ?? '')
                }
                className="border px-2 py-1 rounded"
              >
                <option value="PENDING">未處理</option>
                <option value="APPROVED">已處理</option>
                <option value="REJECTED">資料有誤</option>
              </select>
              <input
                defaultValue={rec.note ?? ''}
                placeholder="備註..."
                className="border px-2 py-1 rounded w-60"
                onBlur={(e) => {
                  if (rec.status !== 'PENDING') {
                    handleReview(rec.id, rec.status as 'APPROVED' | 'REJECTED', e.target.value)
                  }
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 🔍 彈出圖片預覽 */}
      {previewImages && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-2xl">
            <h2 className="text-lg font-bold mb-4">圖片預覽</h2>
            <div className="flex space-x-4 mb-4">
              {previewImages.map((url, i) => (
                <Image
                  key={i}
                  src={url}
                  alt={`preview-${i}`}
                  width={300}
                  height={400}
                  className="rounded border"
                />
              ))}
            </div>
            <button
              onClick={() => setPreviewImages(null)}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
