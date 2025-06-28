'use client'

import { useState } from 'react'
import MemberProfile from '@/components/member/MemberProfile'
import PortalHeaderBar from '@/components/PortalHeaderBar'

import MemberPasswordForm from '@/components/member/MemberPasswordForm'
import MemberEditForm from '@/components/member/MemberEditForm'
import IdVerification from '@/app/portal/[company]/member/id-verification/page'
import BankVerification from '@/app/portal/[company]/member/bank-verification/page'




export default function MemberPage() {
  const [tab, setTab] = useState<'profile' | 'password' | 'edit' | 'id-verification' | 'bank-verification' >('profile')

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
          <button
            onClick={() => setTab('id-verification')}
            className={`block w-full text-left px-3 py-2 rounded ${
              tab === 'id-verification' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'
            }`}
          >
            身分證驗證
          </button>

          <button
            onClick={() => setTab('bank-verification')}
            className={`block w-full text-left px-3 py-2 rounded ${
              tab === 'bank-verification' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'
            }`}
          >
            銀行帳戶驗證
          </button>

  


        </aside>

        {/* 右側內容 */}
        <main className="flex-1 p-6">
          <h1 className="text-xl font-bold mb-4">會員中心</h1>

          {tab === 'profile' && (
            <MemberProfile
              onGoToIdVerification={() => setTab('id-verification')}
              onGoToBankVerification={() => setTab('bank-verification')}
            />
          )}


          {tab === 'password' && <MemberPasswordForm />}
          {tab === 'edit' && <MemberEditForm />}
          {tab === 'id-verification' && <IdVerification />}
          {tab === 'bank-verification' && <BankVerification />}

        </main>
      </div>
    </div>
  )
}
