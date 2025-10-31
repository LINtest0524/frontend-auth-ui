// 統一公司首頁 - 使用原有的動態路由頁面內容

import { notFound } from 'next/navigation'

interface Props {
  params: {
    companyCode: string
  }
}

export default function UnifiedCompanyHomePage({ params }: Props) {
  const { companyCode } = params
  

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-green-100 border border-green-400 rounded-lg p-4 mb-6">
        <h2 className="text-green-800 font-bold">✅ 路由統一成功！</h2>
        <p className="text-green-700">
          你正在訪問 <code>/{companyCode}</code>，但內部使用統一配置系統
        </p>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">
        歡迎來到 {companyCode.toUpperCase()} 娛樂城
      </h1>
      <p className="text-gray-600 mb-8">
        🚀 正在使用統一配置系統載入...
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-3">🎮 遊戲大廳</h3>
          <p className="text-gray-600 mb-4">探索各種精彩遊戲</p>
          <a href={`/${companyCode}/games`} className="text-blue-500 hover:underline">
            前往遊戲 →
          </a>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-3">🎁 優惠活動</h3>
          <p className="text-gray-600 mb-4">查看最新優惠</p>
          <a href={`/${companyCode}/promotions`} className="text-blue-500 hover:underline">
            查看優惠 →
          </a>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-3">📰 最新消息</h3>
          <p className="text-gray-600 mb-4">掌握最新資訊</p>
          <a href={`/${companyCode}/news`} className="text-blue-500 hover:underline">
            閱讀新聞 →
          </a>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">🔧 技術資訊</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• URL: /{companyCode}</li>
          <li>• 內部路由: /_company/{companyCode}</li>
          <li>• 配置系統: 已整合</li>
          <li>• 狀態: 路由統一成功</li>
        </ul>
      </div>
    </div>
  )
}