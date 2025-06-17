// frontend/src/app/(admin)/module/page.tsx
'use client'

import { useEffect, useState } from 'react'

interface CompanyModuleSetting {
  companyId: number
  companyName: string
  enabled: boolean
}

export default function ModuleAdminPage() {
  const [settings, setSettings] = useState<CompanyModuleSetting[]>([])

  useEffect(() => {
  fetch(`${process.env.NEXT_PUBLIC_API_BASE}/admin/module/marquee`)
    .then(res => res.json())
    .then(data => {
      console.log('🔥 回傳資料:', data) // 新增這行
      setSettings(data)
    })
}, [])

  const toggleEnabled = (index: number) => {
    const updated = [...settings]
    updated[index].enabled = !updated[index].enabled
    setSettings(updated)
  }

  const saveChanges = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/admin/module/marquee`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    alert('設定已儲存')
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-bold">模組管理：跑馬燈 Marquee</h2>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left p-2">公司名稱</th>
            <th className="text-center">啟用</th>
          </tr>
        </thead>
        <tbody>
          {settings.map((s, i) => (
            <tr key={s.companyId} className="border-t">
              <td className="p-2">{s.companyName}</td>
              <td className="text-center">
                <input
                  type="checkbox"
                  checked={s.enabled}
                  onChange={() => toggleEnabled(i)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={saveChanges}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        儲存設定
      </button>
    </div>
  )
}
