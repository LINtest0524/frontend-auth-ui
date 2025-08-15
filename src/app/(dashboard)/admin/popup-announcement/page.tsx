'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type PopupAnnouncement = {
  id: number
  title: string
  desktop_image_url?: string
  mobile_image_url?: string
  button_text?: string
  button_url?: string
  sort_order: number
  status: string
  start_date?: string
  end_date?: string
  company_code: string
  created_at: string
  updated_at: string
}

export default function PopupAnnouncementPage() {
  const [announcements, setAnnouncements] = useState<PopupAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/popup-announcements?company=a`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data)
      } else {
        console.error('獲取彈窗公告失敗')
      }
    } catch (error) {
      console.error('獲取彈窗公告錯誤:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除這個彈窗公告嗎？')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/popup-announcements/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setAnnouncements(announcements.filter(item => item.id !== id))
      } else {
        alert('刪除失敗')
      }
    } catch (error) {
      console.error('刪除錯誤:', error)
      alert('刪除失敗')
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('zh-TW')
  }

  if (loading) {
    return <div className="p-6">載入中...</div>
  }

  return (
    <div className="b-ibox">
      <h1>彈窗公告管理</h1>

      <div className="b-ibox-s">
        <div className="fl4 w100 mb15">
          <Link
            href="/admin/popup-announcement/new"
            className="b-btn-s2 b-btn-c4 h32 mb25"
          >
            新增彈窗公告
          </Link>
        </div>

        {loading && <p>載入中...</p>}

        {!loading && announcements.length === 0 ? (
          <p className="ps-err mb15">目前沒有彈窗公告</p>
        ) : (
          !loading && (
            <table className="b-table-box admin-table mb15">
              <thead>
                <tr>
                  <th>標題</th>
                  <th>圖片</th>
                  <th>排序</th>
                  <th>狀態</th>
                  <th>生效時間</th>
                  <th>結束時間</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((item) => (
                  <tr key={item.id} className="text-center">
                    <td>{item.title}</td>
                    <td className="b-td-center">
                      {item.desktop_image_url ? (
                        <div className="fo5p">
                          <img
                            src={`${process.env.NEXT_PUBLIC_API_BASE}${item.desktop_image_url}`}
                            alt={item.title}
                            height={40}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <button 
                            onClick={() => setPreviewImage(`${process.env.NEXT_PUBLIC_API_BASE}${item.desktop_image_url}`)}
                          >
                            預覽
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400">無圖</span>
                      )}
                    </td>
                    <td>{item.sort_order}</td>
                    <td>
                      <span className={`b-status ${item.status === 'active' ? 'b-status-active' : 'b-status-inactive'}`}>
                        {item.status === 'active' ? '啟用' : '停用'}
                      </span>
                    </td>
                    <td>{formatDate(item.start_date)}</td>
                    <td>{formatDate(item.end_date)}</td>
                    <td>
                      <div className="fl4">
                        <Link
                          href={`/admin/popup-announcement/${item.id}/edit`}
                          className="b-btn-s3 b-btn-c1 mr10"
                        >
                          編輯
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="b-btn-s3 b-btn-c3"
                        >
                          刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {previewImage && (
          <div className="b-lightbox-1">
            <h2 className="mb15">圖片預覽</h2>
            <div className="b-id-imgbox mb25">
              <Image 
                src={previewImage} 
                alt="預覽圖片" 
                width={800}
                height={600}
                className="b-id-img" 
              />
            </div>
            <button onClick={() => setPreviewImage(null)} className="b-id-imgbox-X">X</button>
          </div>
        )}
      </div>
    </div>
  )
}