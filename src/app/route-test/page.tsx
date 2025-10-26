'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function RouteTestPage() {
  const [testCode, setTestCode] = useState('')

  const handleTest = () => {
    if (testCode) {
      window.open(`/${testCode}`, '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            🚀 動態路由測試頁面
          </h1>

          <div className="mb-8 p-6 bg-green-50 rounded-lg border border-green-200">
            <h2 className="text-xl font-semibold text-green-800 mb-4">✅ 完成的功能</h2>
            <ul className="space-y-2 text-green-700">
              <li>• 動態公司路由 <code className="bg-green-100 px-2 py-1 rounded">/[companyCode]</code></li>
              <li>• 動態登入頁面 <code className="bg-green-100 px-2 py-1 rounded">/[companyCode]/login</code></li>
              <li>• 重複登入檢測 <code className="bg-green-100 px-2 py-1 rounded">/[companyCode]/duplicate-login</code></li>
              <li>• 自動認證攔截器 <code className="bg-green-100 px-2 py-1 rounded">setupCompanyDynamicAuthInterceptor</code></li>
              <li>• 公司資訊自動獲取</li>
            </ul>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🧪 測試現有路由</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link 
                href="/a" 
                className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                target="_blank"
              >
                <div className="font-semibold text-blue-800">/a (舊版路由)</div>
                <div className="text-blue-600 text-sm">代理商公司A - 原有硬編碼路由</div>
              </Link>
              
              <Link 
                href="/b" 
                className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                target="_blank"
              >
                <div className="font-semibold text-blue-800">/b (舊版路由)</div>
                <div className="text-blue-600 text-sm">代理商公司B - 原有硬編碼路由</div>
              </Link>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="font-semibold text-green-800">✅ 測試現有公司</div>
                <div className="text-green-600 text-sm mb-2">先用現有的公司代碼測試動態路由</div>
                <div className="flex gap-2">
                  <Link href="/a" target="_blank" className="text-xs bg-green-100 hover:bg-green-200 px-2 py-1 rounded">
                    動態 /a
                  </Link>
                  <Link href="/b" target="_blank" className="text-xs bg-green-100 hover:bg-green-200 px-2 py-1 rounded">
                    動態 /b
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🆕 測試動態路由</h2>
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                value={testCode}
                onChange={(e) => setTestCode(e.target.value)}
                placeholder="輸入公司代碼 (例如: test, c, demo)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleTest}
                disabled={!testCode}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                測試路由
              </button>
            </div>
            <p className="text-gray-600 text-sm">
              輸入任何公司代碼來測試動態路由功能。如果公司存在於資料庫中，將顯示公司資訊；如果不存在，將顯示錯誤訊息。
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🔧 管理功能</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link 
                href="/admin/companies" 
                className="block p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
              >
                <div className="font-semibold text-purple-800">公司管理</div>
                <div className="text-purple-600 text-sm">修改公司代碼，測試動態路由</div>
              </Link>
              
              <Link 
                href="/admin/companies/1/edit" 
                className="block p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
              >
                <div className="font-semibold text-purple-800">編輯公司 A</div>
                <div className="text-purple-600 text-sm">直接編輯公司 A 的設定</div>
              </Link>
            </div>
          </div>

          <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">📝 使用說明</h3>
            <ol className="space-y-1 text-yellow-700 text-sm">
              <li>1. 在公司管理中修改公司代碼（例如改為 "test"）</li>
              <li>2. 在上方測試框中輸入新的代碼</li>
              <li>3. 點擊「測試路由」開啟新分頁</li>
              <li>4. 確認動態路由正常工作</li>
            </ol>
            <p className="text-yellow-800 font-medium mt-3">
              注意：原有的 /a 和 /b 路由仍然保持運作，確保向後兼容性。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}