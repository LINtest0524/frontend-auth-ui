// 統一遊戲頁面 - 重新導向到原有實作

import { redirect } from 'next/navigation'

interface Props {
  params: {
    companyCode: string
  }
}

export default function UnifiedGamesPage({ params }: Props) {
  // 重導向到原有的動態路由實作
  redirect(`/${params.companyCode}/games`)
}