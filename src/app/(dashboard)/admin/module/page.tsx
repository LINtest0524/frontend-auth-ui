'use client'

import { useEffect, useState } from 'react'

interface CompanyModuleSetting {
  companyId: number
  companyName: string
  enabled: boolean
}

const availableModules = ['marquee', 'banner'] // ✅ 可選的模組

export default function ModuleAdminPage() {
  const [moduleKey, setModuleKey] = useState('marquee')
  const [settings, setSettings] = useState<CompanyModuleSetting[]>([])

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/admin/module/${moduleKey}`)
      .then(res => res.json())
      .then(data => {
        console.log(`🔥 ${moduleKey} 回傳資料:`, data)
        setSettings(data)
      })
  }, [moduleKey])

  const toggleEnabled = (index: number) => {
    const updated = [...settings]
    updated[index].enabled = !updated[index].enabled
    setSettings(updated)
  }

  const saveChanges = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/admin/module/${moduleKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })

    // ✅ 派發事件通知全站：模組更新了
    window.dispatchEvent(new Event('enabled-modules-updated'))

    alert('設定已儲存')
  }


  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold">模組管理</h2>
        <select
          value={moduleKey}
          onChange={(e) => setModuleKey(e.target.value)}
          className="border rounded px-2 py-1"
        >
          {availableModules.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </div>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left p-2">公司名稱</th>
            <th className="text-center">啟用</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(settings) && settings.map((s, i) => (
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
