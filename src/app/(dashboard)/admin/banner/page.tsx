'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Banner = {
  id: number
  title: string
  sort: number
  start_time: string
  end_time: string
  status: string
  desktop_image_url: string
  mobile_image_url: string
}
// 這是測試 Git 分支流程
const API_BASE = 'http://localhost:3001'

export default function BannerListPage() {
  const [banners, setBanners] = useState<Banner[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_BASE}/banners`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        console.log('🧾 撈到 banners:', data) // ✅ 印出來比對
        setBanners(data)
      } catch (err) {
        console.error('載入 Banner 失敗', err)
      }
    }

    fetchData()
  }, [])


  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('確定要刪除這筆 Banner 嗎？')
    if (!confirmed) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/banners/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error('刪除失敗')

      // 更新畫面
      setBanners(prev => prev.filter(b => b.id !== id))
      alert('✅ 刪除成功')
    } catch (err: any) {
      console.error('❌ 刪除失敗', err)
      alert(`❌ 刪除失敗：${err.message}`)
    }
  }

  const formatDateTime = (iso: string) => {
    const date = new Date(iso)
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Banner 管理列表</h2>

      <div className="overflow-auto">
        <table className="table-auto w-full border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">標題</th>
              <th className="border px-2 py-1">排序</th>
              <th className="border px-2 py-1">開放時間</th>
              <th className="border px-2 py-1">圖片(網站)</th>
              <th className="border px-2 py-1">圖片(手機)</th>
              <th className="border px-2 py-1">是否顯示</th>
              <th className="border px-2 py-1">管理</th>
            </tr>
          </thead>
          <tbody>
            {banners.map((banner) => (
              <tr key={banner.id}>
                <td className="border px-2 py-1">{banner.title}</td>
                <td className="border px-2 py-1 text-center">{banner.sort}</td>
                <td className="border px-2 py-1 whitespace-nowrap">
                  {formatDateTime(banner.start_time)} ~<br />
                  {formatDateTime(banner.end_time)}
                </td>
                <td className="border px-2 py-1 text-center">
                  <button
                    className="bg-blue-500 text-white px-2 py-1 text-sm rounded"
                    onClick={() => window.open(`${API_BASE}${banner.desktop_image_url}`, '_blank')}
                  >
                    🔍
                  </button>
                </td>
                <td className="border px-2 py-1 text-center">
                  <button
                    className="bg-blue-500 text-white px-2 py-1 text-sm rounded"
                    onClick={() => window.open(`${API_BASE}${banner.mobile_image_url}`, '_blank')}
                  >
                    🔍
                  </button>
                </td>

                <td className="border px-2 py-1 text-center">
                  <button
                    onClick={async () => {
                      const newStatus = banner.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
                      try {
                        const res = await fetch(`${API_BASE}/banners/${banner.id}`, {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                          },
                          body: JSON.stringify({ status: newStatus }),
                        })
                        if (!res.ok) throw new Error('切換失敗')

                        setBanners(prev =>
                          prev.map(b =>
                            b.id === banner.id ? { ...b, status: newStatus } : b
                          )
                        )
                      } catch (err) {
                        alert('❌ 無法切換狀態')
                        console.error(err)
                      }
                    }}
                    className={`text-xs px-2 py-0.5 rounded font-bold ${
                      banner.status === 'ACTIVE'
                        ? 'bg-green-200 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {banner.status === 'ACTIVE' ? 'ON' : 'OFF'}
                  </button>
                </td>



                <td className="border px-2 py-1 text-center">
                  <div className="inline-flex gap-2">
                    <Link href={`/admin/banner/edit/${banner.id}`}>
                      <button className="text-blue-600 underline text-sm">編輯</button>
                    </Link>
                    <button
                      className="text-red-600 underline text-sm"
                      onClick={() => handleDelete(banner.id)}
                    >
                      刪除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
