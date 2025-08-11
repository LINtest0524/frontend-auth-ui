import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '頁面不存在 | 404',
  description: '您要查看的頁面不存在或已被移除',
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            頁面不存在
          </h2>
          <p className="text-gray-600 mb-8">
            抱歉，您要查看的頁面不存在或已被移除。
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            返回首頁
          </Link>
          
          <div className="flex justify-center space-x-4 text-sm">
            <Link
              href="/a"
              className="text-blue-500 hover:text-blue-600"
            >
              代理商公司A
            </Link>
            <span className="text-gray-400">|</span>
            <Link
              href="/b"
              className="text-blue-500 hover:text-blue-600"
            >
              代理商公司B
            </Link>
          </div>
        </div>
        
        <div className="mt-12 text-xs text-gray-400">
          如果您認為這是一個錯誤，請聯繫我們的技術支援團隊。
        </div>
      </div>
    </div>
  )
}