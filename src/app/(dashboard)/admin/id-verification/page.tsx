'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import dayjs from "dayjs";
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


  const [hasSearched, setHasSearched] = useState(false);

  // 篩選展開
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 初始化時設定最近3天的日期範圍
  useEffect(() => {
    const today = dayjs();
    const threeDaysAgo = today.subtract(2, "day").format("YYYY-MM-DD");
    const todayStr = today.format("YYYY-MM-DD");
    
    setCreatedFrom(threeDaysAgo);
    setCreatedTo(todayStr);
    setHasSearched(true);
  }, []);

  const clearFilter = () => {
    setUsername("");
    setStatus("");
    setCreatedFrom("");
    setType("");
    setCreatedTo("");
    setTotalPages(1);
    setTotalCount(0);
    setHasSearched(false);
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


  const fetchRecords = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (username) params.append("username", username);
      if (type) params.append("type", type);
      if (status) params.append("status", status);
      if (createdFrom) params.append("createdFrom", createdFrom + " 00:00:00");
      if (createdTo) params.append("createdTo", createdTo + " 23:59:59");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/id-verification/admin?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
      console.error("讀取失敗：", err);
    } finally {
      setLoading(false);
    }
  };


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

  const handleNoteChange = (id: number, value: string) => {
    setNotes(prev => ({
      ...prev,
      [id]: value
    }));
  }

  const saveNote = async (id: number) => {
    const record = records.find(r => r.id === id);
    if (record && record.status !== 'PENDING') {
      await handleReview(id, record.status as 'APPROVED' | 'REJECTED', notes[id] || '');
    }
  }

  useEffect(() => {
    if (hasSearched) {
      fetchRecords()
    }
  }, [limit, page, hasSearched])

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
    setHasSearched(true);
    setPage(1)  
    fetchRecords()  
  }


  return (
    <div className="b-bigbox-all w100">

      <div className="b-ibox mb30">

        <h1>身分驗證審核</h1>

        <div className="b-ibox-s">


          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="b-search-btn w100"
          >
            篩選
            <span className={`i-arrow ${isFilterOpen ? "rotate" : ""}`}></span>
          </button>



          {isFilterOpen && (
            <>

              <div className="b-search-box fl1 w100 mt15">

                <div className="b-form-group-2 fl4 w33 mb25">
                  <label htmlFor="username28">帳號</label>
                  <input type="text" placeholder="帳號" id="username28" value={username} onChange={(e) => setUsername(e.target.value)} className="w60" />
                </div>


                <div className="b-form-group-2 fl4 w33 mb25">
                  <label htmlFor="status-select-28">類型</label>
                  <select id="status-select-28" value={type} onChange={(e) => setType(e.target.value)} className="w60">
                    <option value="">全部類型</option>
                    <option value="ID_CARD">身分證驗證</option>
                    <option value="BANK_ACCOUNT">銀行帳戶驗證</option>
                  </select>
                </div>

                <div className="b-form-group-2 fl4 w33 mb25">
                  <label htmlFor="status-select-29">狀態</label>
                  <select id="status-select-29" value={status} onChange={(e) => setStatus(e.target.value)} className="w60">
                  <option value="">全部狀態</option>
                  <option value="PENDING">未處理</option>
                  <option value="APPROVED">已處理</option>
                  <option value="REJECTED">資料有誤</option>
                  </select>
                </div>


                <div className="w50 fd1 mb25">

                  <div className="b-form-group-2 fl4 w100 mb10">
                    <label htmlFor="date-select-29">申請時間</label>
                    <div className="w70 fl4">
                      <input type="date" id="date-select-29" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} className="date-select flex1" />
                      <span className="dateto">到</span>
                      <input type="date" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} className="date-select flex1" />
                    </div>
                  </div>

                  <div className="b-form-group-2 w100 fl4">
                    <div className="b-date-fast fl4 w70 ml132">
                      <button onClick={() => quickSetDate("today", "created")}>今日</button>
                      <button onClick={() => quickSetDate("yesterday", "created")}>昨日</button>
                      <button onClick={() => quickSetDate("3days", "created")}>近三日</button>
                      <button onClick={() => quickSetDate("thisMonth", "created")}>本月</button>
                      <button onClick={() => quickSetDate("lastMonth", "created")}>上月</button>
                    </div>
                  </div>

                </div>



                <div className="fl4 w100 b-btnbox">
                  <button onClick={handleSearch} className="b-btn-s2 b-btn-c4 mr20">查詢</button>
                  <button onClick={clearFilter} className="b-btn-s2 b-btn-c1">清除</button>
                </div>


              </div>

            </>
          )}

        </div>
      </div>






        {loading && <p>載入中...</p>}

        

        {!loading && hasSearched && (
          <>


            <div className="b-ibox">

              <div className="b-ibox-s">

                <div className="w100 fo5 mb15">


                  <div className="w50 fl4">
                    <label htmlFor="page11">每頁&nbsp;</label>
                    <input
                      type="number"
                      id="page11"
                      value={inputLimit}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!isNaN(val)) setInputLimit(val);
                      }}
                      min={1}
                      className="txtbox1 mr20"
                    />
                    <button
                      onClick={() => {
                        const validLimit = Math.max(1, inputLimit);
                        setLimit(validLimit);
                      }}
                      className="ml10 b-btn-s2 b-btn-c4"
                    >
                      顯示筆數
                    </button>
                  </div>
                
                </div>

            

             


                    <table className="b-table-box admin-table mb15">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>帳號</th>
                          <th>類型</th>
                          <th>申請時間</th>
                          <th>圖片</th>
                          <th>狀態</th>
                          <th>備註</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((rec) => (
                          <tr key={rec.id} className="text-center bg-white even:bg-gray-50">
                            <td>{rec.id}</td>
                            <td>{rec.username}</td>
                            <td>{rec.type === 'ID_CARD' ? '身分證驗證' : '銀行帳戶驗證'}</td>
                            <td>{format(new Date(rec.createdAt), 'yyyy-MM-dd HH:mm:ss')}</td>
                            <td>
                              <button className="text-blue-600 underline text-sm" onClick={() => setPreviewImages(rec.images)}>🔍</button>
                            </td>
                            <td>
                              <select defaultValue={rec.status} onChange={(e) => handleReview(rec.id, e.target.value as 'APPROVED' | 'REJECTED', notes[rec.id] || '')} className="border px-2 py-1 rounded">
                                <option value="PENDING">未處理</option>
                                <option value="APPROVED">已處理</option>
                                <option value="REJECTED">資料有誤</option>
                              </select>
                            </td>
                            <td>
                              <input 
                                value={notes[rec.id] || ''} 
                                placeholder="備註..." 
                                className="border px-2 py-1 rounded w-60" 
                                onChange={(e) => handleNoteChange(rec.id, e.target.value)}
                                onBlur={() => saveNote(rec.id)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                      
             
                    
             

                  {!loading && hasSearched && records.length === 0 && (
                    <div className="b-no-information w100 fd5">
                      <img src="/no-information.webp" alt="無資料" className="mb25" />
                      <p>查無資料</p>
                    </div>
                  )}

            {!loading && renderPagination()}

            {previewImages && (
 
                <div className="b-lightbox-1">
                  <h2 className="mb15">圖片預覽</h2>
                  <div className="b-id-imgbox mb25">
                    {previewImages.map((url, i) => (
                      <Image key={i} src={url} alt={`preview-${i}`} width={300} height={400} className="b-id-img" />
                    ))}
                  </div>
                  <button onClick={() => setPreviewImages(null)} className="b-id-imgbox-X">X</button>
                </div>
      
            )}

            </div>
          </div>

        </>
      )}

    </div>

  )
}