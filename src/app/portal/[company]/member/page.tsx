'use client'

import { useState } from 'react'
import MemberProfile from '@/components/member/MemberProfile'
import PortalHeaderBar from '@/components/PortalHeaderBar'

import MemberPasswordForm from '@/components/member/MemberPasswordForm'
import MemberEditForm from '@/components/member/MemberEditForm'


export default function MemberPage() {
  const [tab, setTab] = useState<'profile' | 'password' | 'edit'>('profile')

  return (
    <div>
      {/* 上方登入 / 登出列 */}
      <PortalHeaderBar />

      {/* 主體 */}
      <div className="flex">
        {/* 左側選單 */}
        <aside className="w-48 bg-gray-100 p-4 space-y-2 border-r">
          <button
            onClick={() => setTab('profile')}
            className={`block w-full text-left px-3 py-2 rounded ${
              tab === 'profile' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'
            }`}
          >
            個人資料
          </button>
          <button
            onClick={() => setTab('password')}
            className={`block w-full text-left px-3 py-2 rounded ${
              tab === 'password' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'
            }`}
          >
            修改密碼
          </button>
          <button
            onClick={() => setTab('edit')}
            className={`block w-full text-left px-3 py-2 rounded ${
              tab === 'edit' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'
            }`}
          >
            修改個人資料
          </button>
        </aside>

        {/* 右側內容 */}
        <main className="flex-1 p-6">
          <h1 className="text-xl font-bold mb-4">會員中心</h1>

          {tab === 'profile' && <MemberProfile />}
          {tab === 'password' && <MemberPasswordForm />}
          {tab === 'edit' && <MemberEditForm />}

        </main>
      </div>
    </div>
  )
}
