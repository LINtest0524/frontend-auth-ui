'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Logo = {
  id: number
  title: string
  image_url: string
  is_active: boolean
  company: {
    id: number
    name: string
    code: string
  }
  createdAt: string
}

export default function LogoManagePage() {
  const router = useRouter()
  const [logos, setLogos] = useState<Logo[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogos = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/logo`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setLogos(data)
      }
    } catch (error) {
      console.error('Failed to fetch logos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogos()
  }, [])

  const handleEdit = (logo: Logo) => {
    router.push(`/admin/logo/edit/${logo.id}`)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除這個 LOGO 嗎？')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/logo/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        await fetchLogos()
      } else {
        alert('刪除失敗')
      }
    } catch (error) {
      console.error('Delete failed:', error)
      alert('刪除失敗')
    }
  }

  if (loading) {
    return <div className="b-ibox">載入中...</div>
  }

  return (
    <div className="b-ibox">
      <h1>LOGO 管理</h1>
      
      <div className="b-ibox-s">
        <div className="fl4 w100 mb15">
          <button
            onClick={() => router.push('/admin/logo/new')}
            className="b-btn-s2 b-btn-c4"
          >
            新增 LOGO
          </button>
        </div>


        <table className="b-table-box admin-table mb15">
          <thead>
            <tr>
              <th>預覽</th>
              <th>標題</th>
              <th>公司</th>
              <th>狀態</th>
              <th>建立時間</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {logos.map((logo) => (
              <tr key={logo.id} className="text-center">
                <td className="b-td-center">
                  <div className="fo5p">
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_BASE}${logo.image_url}`}
                      alt={logo.title}
                      height={40}
                      style={{ maxHeight: '40px', objectFit: 'contain' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </td>
                <td>{logo.title}</td>
                <td>{logo.company?.name || '未知'}</td>
                <td>
                  <span className={logo.is_active ? 'text-green-600' : 'text-red-600'}>
                    {logo.is_active ? '啟用' : '停用'}
                  </span>
                </td>
                <td>{new Date(logo.createdAt).toLocaleDateString('zh-TW')}</td>
                <td>
                  <div className="fl4">
                    <button
                      onClick={() => handleEdit(logo)}
                      className="b-btn-s3 b-btn-c1 mr10"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => handleDelete(logo.id)}
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
        
        {logos.length === 0 && (
          <div className="text-center py-8">
            目前沒有 LOGO 資料
          </div>
        )}
      </div>
    </div>
  )
}