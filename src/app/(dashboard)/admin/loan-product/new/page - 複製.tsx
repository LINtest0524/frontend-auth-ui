// frontend/src/app/(dashboard)/admin/loan-product/new/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoanProductCreatePage() {
  const router = useRouter()

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [companies, setCompanies] = useState<{ id: number; name: string }[]>([])

  const [form, setForm] = useState({
    name: '',
    companyId: undefined as number | undefined,
    principal: '',
    periodDays: '',
    term: '',
    interestRate: '',
    processingFeeRate: '',
    reviewFeeRate: '',
    extensionFeeRate: '',
    overdueDailyRate: '',
    overdueMaxAmount: '',
    allowExtension: false,
    allowRenewal: false,
    enabled: true,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const rawUser = localStorage.getItem('user')
    if (token && rawUser) {
      const parsed = JSON.parse(rawUser)
      setCurrentUser(parsed)

      if (parsed.role === 'SUPER_ADMIN') {
        fetch('http://localhost:3001/company', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) {
              setCompanies(data)
            } else if (Array.isArray(data.data)) {
              setCompanies(data.data)
            } else {
              setCompanies([])
              console.warn('公司資料格式錯誤', data)
            }
          })
      }
    }
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    const isCheckbox = type === 'checkbox'
    setForm((prev) => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : name === 'companyId' ? Number(value) : value,
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const token = localStorage.getItem('token')

    const payload = {
      ...form,
      companyId:
        currentUser.role === 'SUPER_ADMIN'
          ? form.companyId
          : currentUser.companyId,
    }

    try {
      const res = await fetch('http://localhost:3001/admin/loan-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('建立失敗')
      router.push('/admin/loan-product')
    } catch (err: any) {
      setError(err.message || '發生錯誤')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">➕ 新增貸款產品</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">產品名稱</label>
          <input name="name" value={form.name} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        </div>
        {currentUser?.role === 'SUPER_ADMIN' && (
          <div>
            <label className="block font-medium mb-1">所屬公司</label>
            <select
              name="companyId"
              value={form.companyId || ''}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="">請選擇公司</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block font-medium mb-1">借款本金</label>
          <input name="principal" value={form.principal} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block font-medium mb-1">期數</label>
          <input name="term" value={form.term} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block font-medium mb-1">週期（天）</label>
          <input name="periodDays" value={form.periodDays} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block font-medium mb-1">利率 (%)</label>
          <input name="interestRate" value={form.interestRate} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block font-medium mb-1">手續費 (%)</label>
          <input name="processingFeeRate" value={form.processingFeeRate} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block font-medium mb-1">審查費 (%)</label>
          <input name="reviewFeeRate" value={form.reviewFeeRate} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block font-medium mb-1">展期費 (%)</label>
          <input name="extensionFeeRate" value={form.extensionFeeRate} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block font-medium mb-1">逾期日利率 (%)</label>
          <input name="overdueDailyRate" value={form.overdueDailyRate} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block font-medium mb-1">逾期金額上限</label>
          <input name="overdueMaxAmount" value={form.overdueMaxAmount} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" name="allowExtension" checked={form.allowExtension} onChange={handleChange} />
          <label>允許展期</label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" name="allowRenewal" checked={form.allowRenewal} onChange={handleChange} />
          <label>允許續借</label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" name="enabled" checked={form.enabled} onChange={handleChange} />
          <label>啟用</label>
        </div>
      </div>
      {error && <p className="text-red-600 mt-4">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        儲存產品
      </button>
    </div>
  )
}
