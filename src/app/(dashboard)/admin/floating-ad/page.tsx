'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type FloatingAd = {
  id: number
  title: string
  link_url: string
  image_url?: string
  target_blank: boolean
  position: string
  status: string
  sort: number
  created_at: string
  updated_at: string
}

export default function FloatingAdListPage() {
  const [items, setItems] = useState<FloatingAd[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFloatingAds()
  }, [])

  const fetchFloatingAds = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/floating-ads`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setItems(data)
      } else {
        console.error('獲取浮動廣告失敗')
      }
    } catch (error) {
      console.error('獲取浮動廣告錯誤:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`確定要刪除「${title}」嗎？`)) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/floating-ads/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        alert('刪除成功')
        fetchFloatingAds() // 重新載入列表
      } else {
        alert('刪除失敗')
      }
    } catch (error) {
      console.error('刪除錯誤:', error)
      alert('刪除失敗')
    }
  }

  const getPositionText = (position: string) => {
    const positionMap: Record<string, string> = {
      'top-right': '右上角',
      'bottom-right': '右下角',
      'top-left': '左上角',
      'bottom-left': '左下角',
    }
    return positionMap[position] || position
  }

  const getStatusText = (status: string) => {
    return status === 'ACTIVE' ? '啟用' : '停用'
  }


  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">載入中...</div>
      </div>
    )
  }

  return (
    <div className="b-ibox">
      <h1>浮動廣告管理</h1>

      <div className="b-ibox-s">
        <Link
          href="/admin/floating-ad/new"
          className="b-btn-s2 b-btn-c4 h32 mb25"
        >
          新增廣告
        </Link>

        {loading ? (
          <p>載入中...</p>
        ) : items.length === 0 ? (
          <p className="ps-err mb15">目前沒有浮動廣告</p>
        ) : (
          <table className="b-table-box admin-table mb15">
            <thead>
              <tr>
                <th>圖片</th>
                <th>標題</th>
                <th>連結</th>
                <th>位置</th>
                <th>狀態</th>
                <th>排序</th>
                <th>建立時間</th>
                <th className="th-last">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.image_url ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_BASE}${item.image_url}`}
                        alt={item.title}
                        height={40}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      '無圖片'
                    )}
                  </td>
                  <td>{item.title}</td>
                  <td>
                    <div className="max-w-xs truncate">
                      {item.link_url}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.target_blank ? '新視窗' : '同視窗'}
                    </div>
                  </td>
                  <td>{getPositionText(item.position)}</td>
                  <td>
                    <span className={`b-btn-s3 ${item.status === 'ACTIVE' ? 'b-btn-c4' : 'b-btn-c3'} w50px`}>
                      {item.status === 'ACTIVE' ? 'ON' : 'OFF'}
                    </span>
                  </td>
                  <td>{item.sort}</td>
                  <td>
                    {new Date(item.created_at).toLocaleDateString('zh-TW')}
                  </td>
                  <td>
                    <div className="fl4">
                      <Link
                        href={`/admin/floating-ad/${item.id}/edit`}
                        className="b-btn-s3 b-btn-c1 mlr10"
                      >
                        編輯
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        className="b-btn-s3 b-btn-c3 h30 mlr10"
                      >
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}