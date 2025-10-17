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

  const companyCode = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : 'a'
  const token = typeof window !== 'undefined' ? localStorage.getItem(`portalToken_${companyCode}`) : null

  //   共用查詢函式
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
          console.warn("   無法取得圖片資料")
        }

      }
    } catch (err) {
      // 查詢銀行驗證狀態失敗，靜默處理
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

      //   成功後重新查詢
      await fetchStatus()

      if (fileRef.current) fileRef.current.value = ''
      setPreviewKey(prev => prev + 1)
    } catch (err) {
      console.error('    上傳失敗', err)
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
      console.error('    清除失敗', err)
      alert('清除失敗，請稍後再試')
    }
  }

  const renderPreview = (file: File | string | null) => {
    if (!file) return null
    const url = typeof file === 'string' ? file : URL.createObjectURL(file)
    return (
      <div className="bank-upload-preview">
        <img
          key={`${previewKey}-${url}`}
          src={url}
          alt="存摺封面預覽"
        />
      </div>
    )
  }

  const isDisabled = status === 'PENDING' || status === 'APPROVED'

  return (
    <div className="bank-verification-container">
      <div className="bank-verification-header">
        <h1 className="bank-verification-title">
          <div className="bank-verification-icon">🏦</div>
          銀行帳戶驗證
        </h1>
      </div>

      <div className="bank-verification-content">
        {/* 使用說明 */}
        <div className="bank-verification-instructions">
          <h3>📋 驗證說明</h3>
          <ul>
            <li>請上傳清晰的存摺封面照片</li>
            <li>確保帳戶資訊（銀行名稱、帳號、戶名）清楚可見</li>
            <li>照片格式支援 JPG、PNG 等常見圖片格式</li>
            <li>請確認存摺戶名與註冊資料一致</li>
            <li>審核時間約 2 個小時，請耐心等待</li>
          </ul>
        </div>

        {/* 狀態顯示 */}
        {status === 'PENDING' && (
          <div className="bank-verification-status pending">
            <div className="bank-verification-status-icon">⏳</div>
            已送出審核，請耐心等待客服審核
          </div>
        )}
        {status === 'APPROVED' && (
          <div className="bank-verification-status approved">
            <div className="bank-verification-status-icon">✅</div>
            已通過銀行帳戶驗證
          </div>
        )}
        {status === 'REJECTED' && (
          <div className="bank-verification-status rejected">
            <div className="bank-verification-status-icon">❌</div>
            驗證未通過：{note || '資料有誤，請重新上傳'}
          </div>
        )}

        {status !== 'REJECTED' && (
          <>
            <div className={`bank-upload-section ${file ? 'has-file' : ''} ${isDisabled ? 'disabled' : ''}`}>
              <div className="bank-upload-label">
                <span className="bank-upload-icon">📄</span>
                上傳存摺封面照片
              </div>
              
              {renderPreview(file)}
              
              {!isDisabled && (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={e => setFile(e.target.files?.[0] ?? null)}
                    className="bank-upload-input"
                  />
                  <div className="bank-upload-hint">
                    請選擇清晰的存摺封面照片，確保銀行名稱、帳號及戶名清楚可見
                  </div>
                </>
              )}
            </div>

            <div className="bank-verification-actions">
              {!isDisabled && (
                <button
                  onClick={handleSubmit}
                  className="bank-verification-btn primary"
                >
                  📤 送出審核
                </button>
              )}
            </div>
          </>
        )}

        {status === 'REJECTED' && (
          <div className="bank-verification-actions">
            <button
              onClick={handleReset}
              className="bank-verification-btn danger"
            >
              🔄 重新驗證
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
