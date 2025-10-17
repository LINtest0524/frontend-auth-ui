'use client'

import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import dayjs from "dayjs";
import Image from 'next/image'
import { format } from 'date-fns'
import '@/styles/pages/users.css'

interface VerificationRecord {
  id: number
  username: string
  type: 'ID_CARD' | 'BANK_ACCOUNT'
  createdAt: string
  images: string[]
  status: 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED'
  note: string | null
}

export default function IdVerificationAdminPage() {
  const [records, setRecords] = useState<VerificationRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[] | null>(null)
  const [notes, setNotes] = useState<{[key: number]: string}>({})

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


  // 篩選展開
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 初始化時載入近3天資料，但不設定日期欄位的值
  useEffect(() => {
    fetchRecords();
  }, []);

  const clearFilter = () => {
    setUsername("");
    setStatus("");
    setCreatedFrom("");
    setType("");
    setCreatedTo("");
    setPage(1);
    setTotalPages(1);
    setTotalCount(0);
    setRecords([]);
    setIsInitialLoad(true);
  };


  const quickSetDate = (type: string, target: "created" | "login") => {
      const today = dayjs();
      let fromDate = "";
      let toDate = "";
  
      switch (type) {
        case "today":
          fromDate = today.format("YYYY-MM-DD");
          toDate = today.format("YYYY-MM-DD");
          break;
        case "yesterday":
          const y = today.subtract(1, "day");
          fromDate = y.format("YYYY-MM-DD");
          toDate = y.format("YYYY-MM-DD");
          break;
        case "3days":
          fromDate = today.subtract(2, "day").format("YYYY-MM-DD");
          toDate = today.format("YYYY-MM-DD");
          break;
        case "thisMonth":
          fromDate = today.startOf("month").format("YYYY-MM-DD");
          toDate = today.endOf("month").format("YYYY-MM-DD");
          break;
        case "lastMonth":
          const last = today.subtract(1, "month");
          fromDate = last.startOf("month").format("YYYY-MM-DD");
          toDate = last.endOf("month").format("YYYY-MM-DD");
          break;
      }
  
      if (target === "created") {
        setCreatedFrom(fromDate);
        setCreatedTo(toDate);
      }
    };


  const fetchRecords = useCallback(async (forceUserSearch = false) => {
    const actualIsInitialLoad = forceUserSearch ? false : isInitialLoad;
    
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (username) params.append("username", username);
      if (type) params.append("type", type);
      if (status) params.append("status", status);
      
      // 處理日期條件
      if (actualIsInitialLoad) {
        // 初始載入時使用近3日條件，但不影響日期欄位顯示
        const today = dayjs();
        const threeDaysAgo = today.subtract(2, "day").format("YYYY-MM-DD");
        const todayStr = today.format("YYYY-MM-DD");
        params.append("createdFrom", threeDaysAgo + " 00:00:00");
        params.append("createdTo", todayStr + " 23:59:59");
      } else {
        // 用戶查詢時，只有設定日期時才加入日期篩選
        if (createdFrom) {
          params.append("createdFrom", createdFrom + " 00:00:00");
        }
        
        if (createdTo) {
          params.append("createdTo", createdTo + " 23:59:59");
        }
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE}/api/id-verification/admin?${params.toString()}`;

      const res = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setRecords(Array.isArray(data.data) ? data.data : []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
      
      // 初始化備註狀態
      const initialNotes: {[key: number]: string} = {};
      if (Array.isArray(data.data)) {
        data.data.forEach((rec: VerificationRecord) => {
          initialNotes[rec.id] = rec.note || '';
        });
      }
      setNotes(initialNotes);
    } catch (err) {
      // 資料載入失敗，靜默處理
    } finally {
      setLoading(false);
    }
  }, [page, limit, isInitialLoad, username, type, status, createdFrom, createdTo]);


  const handleReview = async (
    id: number,
    status: 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED',
    note: string
  ) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/id-verification/admin/${id}/review`,
        {
          identity_verification_id: id,
          status,
          note,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      fetchRecords()
    } catch (err) {
      // 審核操作失敗，靜默處理
      alert('審核操作失敗，請稍後再試');
    }
  }

  const handleNoteChange = (id: number, value: string) => {
    setNotes(prev => ({
      ...prev,
      [id]: value
    }));
  }

  const saveNote = async (id: number) => {
    const record = records.find(r => r.id === id);
    if (record) {
      await handleReview(id, record.status as 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED', notes[id] || '');
    }
  }

  // 當分頁或每頁顯示數量改變時重新載入
  useEffect(() => {
    fetchRecords()
  }, [page, limit])

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
      <div className="pagination">
        <div className="pagination-info">
          第 {page} 頁，共 {totalPages} 頁（總計 {totalCount} 筆資料）
        </div>

        <div className="pagination-buttons">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="pagination-btn"
          >
            ⬅️ 上一頁
          </button>

          {pages.map((p, idx) =>
            p === "..." ? (
              <span key={`ellipsis-${idx}`} className="pagination-btn" style={{cursor: "default"}}>
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p as number)}
                className={`pagination-btn ${page === p ? "active" : ""}`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="pagination-btn"
          >
            下一頁 ➡️
          </button>
        </div>
      </div>
    )
  }


  const handleSearch = () => {
    setIsInitialLoad(false);
    setPage(1);
    fetchRecords(true);
  }


  return (
    <div className="users-container">
      {/* 頁面標題區域 */}
      <div className="users-header">
        <h1>🔍 驗證審核</h1>
        <div className="users-header-actions">
          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
            📊 管理用戶驗證申請與審核狀態
          </div>
        </div>
      </div>

      {/* 篩選區域 */}
      <div className="filter-section">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="filter-toggle"
        >
          <span>🔍 篩選條件</span>
          <span className={`filter-arrow ${isFilterOpen ? "rotate" : ""}`}>▼</span>
        </button>

        {isFilterOpen && (
          <div className="filter-content">
            <div className="filter-grid">
              <div className="form-group">
                <label htmlFor="username-search" className="form-label">帳號</label>
                <input 
                  type="text" 
                  id="username-search"
                  placeholder="請輸入帳號" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  className="form-input" 
                />
              </div>

              <div className="form-group">
                <label htmlFor="type-select" className="form-label">驗證類型</label>
                <select 
                  id="type-select" 
                  value={type} 
                  onChange={(e) => setType(e.target.value)} 
                  className="form-select"
                >
                  <option value="">全部類型</option>
                  <option value="ID_CARD">🆔 身分證驗證</option>
                  <option value="BANK_ACCOUNT">🏦 銀行帳戶驗證</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="status-select" className="form-label">審核狀態</label>
                <select 
                  id="status-select" 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)} 
                  className="form-select"
                >
                  <option value="">全部狀態</option>
                  <option value="PENDING">⏳ 未處理</option>
                  <option value="PROCESSING">🔄 待處理</option>
                  <option value="APPROVED">✅ 已通過</option>
                  <option value="REJECTED">❌ 資料有誤</option>
                </select>
              </div>
            </div>

            <div className="filter-row">
              <div className="form-group date-range-group">
                <label htmlFor="created-date-from" className="form-label">申請時間範圍</label>
                <div className="date-inputs">
                  <input 
                    type="date" 
                    id="created-date-from"
                    value={createdFrom} 
                    onChange={(e) => setCreatedFrom(e.target.value)} 
                    className="form-input" 
                  />
                  <span className="date-separator">至</span>
                  <input 
                    type="date" 
                    value={createdTo} 
                    onChange={(e) => setCreatedTo(e.target.value)} 
                    className="form-input" 
                  />
                </div>
                <div className="quick-date-buttons">
                  <button onClick={() => quickSetDate("today", "created")} className="btn-quick-date">今日</button>
                  <button onClick={() => quickSetDate("yesterday", "created")} className="btn-quick-date">昨日</button>
                  <button onClick={() => quickSetDate("3days", "created")} className="btn-quick-date">近三日</button>
                  <button onClick={() => quickSetDate("thisMonth", "created")} className="btn-quick-date">本月</button>
                  <button onClick={() => quickSetDate("lastMonth", "created")} className="btn-quick-date">上月</button>
                </div>
              </div>
            </div>

            <div className="filter-actions">
              <button onClick={handleSearch} className="btn-search">🔍 查詢</button>
              <button onClick={clearFilter} className="btn-clear">🗑️ 清除</button>
            </div>
          </div>
        )}
      </div>

      {/* 載入狀態 */}
      {loading && (
        <div className="loading-spinner">
          <div>⏳ 載入中...</div>
        </div>
      )}

      {!loading && (
        <div className="content-section">
          {/* 表格控制區域 */}
          <div className="table-controls">
            <div className="pagination-control">
              <label htmlFor="page-limit">每頁顯示：</label>
              <input
                type="number"
                id="page-limit"
                value={inputLimit}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val)) setInputLimit(val);
                }}
                min={1}
                className="pagination-input"
              />
              <button
                onClick={() => {
                  const validLimit = Math.max(1, inputLimit);
                  setLimit(validLimit);
                  setPage(1);
                }}
                className="btn-search"
              >
                套用
              </button>
            </div>

            <div className="export-control">
              <div style={{ color: '#666', fontSize: '14px' }}>
                📋 身份驗證管理系統
              </div>
            </div>

            <div className="pagination-info">
              共 {totalCount} 筆申請
            </div>
          </div>

          {/* 現代化表格 */}
          <table className="modern-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>申請人</th>
                <th>驗證類型</th>
                <th>申請時間</th>
                <th>證件圖片</th>
                <th>審核狀態</th>
                <th>備註</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => (
                <tr key={rec.id}>
                  <td>#{rec.id}</td>
                  <td>
                    <div className="user-info">
                      <div className="user-username">{rec.username}</div>
                    </div>
                  </td>
                  <td>
                    <div className="login-info">
                      {rec.type === 'ID_CARD' ? '🆔 身分證驗證' : '🏦 銀行帳戶驗證'}
                    </div>
                  </td>
                  <td>
                    <div className="login-info">
                      📅 {format(new Date(rec.createdAt), 'yyyy/MM/dd HH:mm')}
                    </div>
                  </td>
                  <td>
                    <button 
                      onClick={() => setPreviewImages(rec.images)}
                      className="status-toggle status-active"
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    >
                      🖼️ 預覽圖片
                    </button>
                  </td>
                  <td>
                    <select 
                      defaultValue={rec.status} 
                      onChange={(e) => handleReview(rec.id, e.target.value as 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED', notes[rec.id] || '')} 
                      className={`status-toggle ${
                        rec.status === "APPROVED" ? "status-active" : 
                        rec.status === "PENDING" ? "status-inactive" : 
                        rec.status === "PROCESSING" ? "status-inactive" : "blacklist-yes"
                      }`}
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    >
                      <option value="PENDING">⏳ 未處理</option>
                      <option value="PROCESSING">🔄 待處理</option>
                      <option value="APPROVED">✅ 已通過</option>
                      <option value="REJECTED">❌ 資料有誤</option>
                    </select>
                  </td>
                  <td>
                    <input 
                      value={notes[rec.id] || ''} 
                      placeholder="輸入備註..." 
                      className="form-input"
                      style={{ fontSize: '12px', padding: '4px 8px', width: '150px' }}
                      onChange={(e) => handleNoteChange(rec.id, e.target.value)}
                      onBlur={() => saveNote(rec.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 無資料顯示 */}
          {!loading && records.length === 0 && (
            <div className="no-data">
              <img src="/no-information.webp" alt="無資料" />
              <p>查無符合條件的身份驗證申請</p>
            </div>
          )}

          {/* 分頁控制 */}
          {renderPagination()}
        </div>
      )}

      {/* 圖片預覽彈窗 */}
      {previewImages && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setPreviewImages(null)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px',
              borderBottom: '1px solid #eee',
              paddingBottom: '15px'
            }}>
              <h2 style={{ margin: 0, color: '#333', fontSize: '18px' }}>🖼️ 證件圖片預覽</h2>
              <button 
                onClick={() => setPreviewImages(null)}
                style={{
                  background: '#ff4757',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '15px', 
              justifyContent: 'center',
              minWidth: '300px'
            }}>
              {previewImages.map((url, i) => (
                <div 
                  key={i} 
                  style={{ 
                    border: '2px solid #ddd', 
                    borderRadius: '8px', 
                    overflow: 'hidden',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <Image 
                    src={url} 
                    alt={`證件圖片-${i + 1}`} 
                    width={300} 
                    height={400} 
                    style={{ objectFit: 'contain', display: 'block' }}
                  />
                  <div style={{
                    padding: '8px',
                    backgroundColor: '#f8f9fa',
                    textAlign: 'center',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    證件圖片 {i + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}