'use client'

import { useUserStore } from '@/hooks/use-user-store'

export default function MemberProfile() {
  const { user } = useUserStore()

  if (!user) return <div className="text-gray-500">尚未登入</div>

  return (
    <div className="bg-white rounded-xl shadow p-4 w-full max-w-md">
      <h2 className="text-lg font-semibold mb-4">個人基本資料</h2>
      <div className="space-y-2">
        <div>
          <span className="font-medium">帳號：</span>
          <span>{user.username || '（無）'}</span>
        </div>
        <div>
          <span className="font-medium">信箱：</span>
          <span>{user.email || '（無）'}</span>
        </div>
        <div>
          <span className="font-medium">角色：</span>
          <span>{user.role || '（無）'}</span>
        </div>
      </div>
    </div>
  )
}
