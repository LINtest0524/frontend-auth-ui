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

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [inputLimit, setInputLimit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [username, setUsername] = useState("")
  const [type, setType] = useState("")
  const [status, setStatus] = useState("")
  const [createdFrom, setCreatedFrom] = useState("")
  const [createdTo, setCreatedTo] = useState("")

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const params = new URLSearchParams()
      params.append("page", page.toString())
      params.append("limit", limit.toString())
      if (username) params.append("username", username)
      if (type) params.append("type", type)
      if (status) params.append("status", status)
      if (createdFrom) params.append("createdFrom", createdFrom + ' 00:00:00')
      if (createdTo) params.append("createdTo", createdTo + ' 23:59:59')

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/id-verification/admin`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          params: {
            page,
            limit,
            username,      // <- ✅ 來自 useState 的帳號搜尋
            type,          // <- ✅ 類型篩選
            status,        // <- ✅ 狀態篩選
            createdFrom,   // <- ✅ 建立起
            createdTo,     // <- ✅ 建立迄
          },
        }
      )


      const data = res.data
      setRecords(Array.isArray(data.data) ? data.data : [])
      setTotalPages(data.totalPages || 1)
      setTotalCount(data.totalCount || 0)
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
        `${process.env.NEXT_PUBLIC_API_BASE}/api/id-verification/admin/${id}/review`,
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
  }, [limit, page])

  const renderPagination = () => {
    if (totalPages <= 1 || totalCount === 0) return null

    const pages: (number | string)[] = []
    if (totalPages <= 10) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      const start = Math.max(2, page - 2)
      const end = Math.min(totalPages - 1, page + 2)
      if (start > 2) pages.push('...')
      for (let i = start; i <= end; i++) pages.push(i)
      if (end < totalPages - 1) pages.push('...')
      pages.push(totalPages)
    }

    return (
      <div className="fo5 w100 b-data-tables_munber mb15 mt-4">
        <p>目前第 {page} 頁，共 {totalPages} 頁（共 {totalCount} 筆資料）</p>
        <div className="tables_munber">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>上一頁</button>
          {pages.map((p, idx) =>
            p === '...'
              ? <span key={`ellipsis-${idx}`}>...</span>
              : <button key={`page-${p}`} onClick={() => setPage(p as number)} className={page === p ? 'pagehover' : ''}>{p}</button>
          )}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>下一頁</button>
        </div>
      </div>
    )
  }


  const handleSearch = () => {
    setPage(1)  
    fetchRecords()  
  }


  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">身分驗證審核</h1>

      <div className="mb-4 flex flex-wrap gap-4">
        <input type="text" placeholder="帳號" value={username} onChange={(e) => setUsername(e.target.value)} className="border px-2 py-1 rounded" />
        <select value={type} onChange={(e) => setType(e.target.value)} className="border px-2 py-1 rounded">
          <option value="">全部類型</option>
          <option value="ID_CARD">身分證驗證</option>
          <option value="BANK_ACCOUNT">銀行帳戶驗證</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border px-2 py-1 rounded">
          <option value="">全部狀態</option>
          <option value="PENDING">未處理</option>
          <option value="APPROVED">已處理</option>
          <option value="REJECTED">資料有誤</option>
        </select>
        <input type="date" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} className="border px-2 py-1 rounded" />
        <input type="date" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} className="border px-2 py-1 rounded" />

        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          查詢
        </button>

      </div>

      <div className="w-full mb-4">
        <label htmlFor="limitInput">每頁顯示筆數：</label>
        <input type="number" id="limitInput" value={inputLimit} onChange={(e) => setInputLimit(Number(e.target.value))} min={1} className="border px-2 py-1 rounded w-20 mx-2" />
        <button onClick={() => setLimit(Math.max(1, inputLimit))} className="bg-blue-600 text-white px-3 py-1 rounded">顯示筆數</button>
      </div>

      {loading && <p>載入中...</p>}
      {!loading && records.length === 0 && <p>目前沒有待審紀錄</p>}

      {!loading && records.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border text-sm">
            <thead>
              <tr className="bg-gray-200 text-center">
                <th className="border p-2">ID</th>
                <th className="border p-2">帳號</th>
                <th className="border p-2">類型</th>
                <th className="border p-2">建立時間</th>
                <th className="border p-2">圖片</th>
                <th className="border p-2">狀態</th>
                <th className="border p-2">備註</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => (
                <tr key={rec.id} className="text-center bg-white even:bg-gray-50">
                  <td className="border p-2">{rec.id}</td>
                  <td className="border p-2">{rec.username}</td>
                  <td className="border p-2">{rec.type === 'ID_CARD' ? '身分證驗證' : '銀行帳戶驗證'}</td>
                  <td className="border p-2">{format(new Date(rec.createdAt), 'yyyy-MM-dd HH:mm:ss')}</td>
                  <td className="border p-2">
                    <button className="text-blue-600 underline text-sm" onClick={() => setPreviewImages(rec.images)}>🔍 預覽圖片</button>
                  </td>
                  <td className="border p-2">
                    <select defaultValue={rec.status} onChange={(e) => handleReview(rec.id, e.target.value as 'APPROVED' | 'REJECTED', rec.note ?? '')} className="border px-2 py-1 rounded">
                      <option value="PENDING">未處理</option>
                      <option value="APPROVED">已處理</option>
                      <option value="REJECTED">資料有誤</option>
                    </select>
                  </td>
                  <td className="border p-2">
                    <input defaultValue={rec.note ?? ''} placeholder="備註..." className="border px-2 py-1 rounded w-60" onBlur={(e) => {
                      if (rec.status !== 'PENDING') handleReview(rec.id, rec.status as 'APPROVED' | 'REJECTED', e.target.value)
                    }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && renderPagination()}

      {previewImages && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-2xl">
            <h2 className="text-lg font-bold mb-4">圖片預覽</h2>
            <div className="flex space-x-4 mb-4 overflow-x-auto">
              {previewImages.map((url, i) => (
                <Image key={i} src={url} alt={`preview-${i}`} width={300} height={400} className="rounded border" />
              ))}
            </div>
            <button onClick={() => setPreviewImages(null)} className="bg-gray-500 text-white px-4 py-2 rounded">關閉</button>
          </div>
        </div>
      )}
    </div>
  )
}