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

    <div className="b-ibox">

      <h1>Banner 管理列表</h1>

      <div className="b-ibox-s">


        <table className="b-table-box admin-table mb15">
          <thead>
            <tr>
              <th>標題</th>
              <th>排序</th>
              <th>開放時間</th>
              <th>圖片(網站)</th>
              <th>圖片(手機)</th>
              <th>是否顯示</th>
              <th className="th-last">管理</th>
            </tr>
          </thead>
          <tbody>
            {banners.map((banner) => (
              <tr key={banner.id}>
                <td>{banner.title}</td>
                <td>{banner.sort}</td>
                <td>
                  {formatDateTime(banner.start_time)} ~<br />
                  {formatDateTime(banner.end_time)}
                </td>
                <td>
                  <button
                    onClick={() => window.open(`${API_BASE}${banner.desktop_image_url}`, '_blank')}
                  >
                    🔍
                  </button>
                </td>
                <td>
                  <button
                    onClick={() => window.open(`${API_BASE}${banner.mobile_image_url}`, '_blank')}
                  >
                    🔍
                  </button>
                </td>

                <td>
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
                        ? 'b-btn-s3 b-btn-c4'
                        : 'b-btn-s3 b-btn-c3'
                    }`}
                  >
                    {banner.status === 'ACTIVE' ? 'ON' : 'OFF'}
                  </button>
                </td>



                <td className="border px-2 py-1 text-center">
                  <div className="inline-flex gap-2 fl4">
                    <Link href={`/admin/banner/edit/${banner.id}`}>
                      <button className="b-btn-s3 b-btn-c1 mlr10">編輯</button>
                    </Link>
                    <button
                      className="b-btn-s3 b-btn-c3"
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
