'use client'

import { useUserStore } from '@/hooks/use-user-store'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_BASE

interface WalletTransaction {
  id: number
  transactionType: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  description: string
  createdAt: string
}

interface WalletStats {
  totalIncome: string
  totalExpense: string
  totalTransactions: string
}

export default function MemberWalletHistory() {
  const { user } = useUserStore()
  const pathname = usePathname()
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [stats, setStats] = useState<WalletStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 從路徑獲取公司代碼
  const getCompanyCode = () => {
    const segments = pathname.split('/')
    return segments[1] // /a/member -> 'a', /b/member -> 'b'
  }

  const getToken = () => {
    const companyCode = getCompanyCode()
    return localStorage.getItem(`portalToken_${companyCode}`)
  }

  // 獲取錢包交易記錄
  const fetchTransactions = async () => {
    const token = getToken()
    if (!token) {
      setError('請先登入')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // 獲取交易記錄 (最近30天)
      const transactionsRes = await axios.get(`${API_URL}/wallet-transactions/my-transactions?days=30&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // 獲取統計資料
      const statsRes = await axios.get(`${API_URL}/wallet-transactions/my-stats?days=30`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setTransactions(transactionsRes.data.transactions || [])
      setStats(statsRes.data || null)
    } catch (err: any) {
      console.error('獲取錢包記錄失敗:', err)
      setError(err.response?.data?.message || '獲取錢包記錄失敗')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchTransactions()
    }
  }, [user])

  // 格式化金額
  const formatAmount = (amount: number) => {
    return amount.toString()
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 獲取交易類型顯示名稱
  const getTransactionTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      'coupon_redeem': '優惠券兌換',
      'manual_recharge': '手動充值',
      'admin_adjustment': '管理員調整',
      'admin_deposit': '管理員存款',
      'admin_deduction': '管理員扣款',
      'order_payment': '訂單付款',
      'refund': '退款',
      'bonus': '獎勵',
      'checkin_reward': '簽到獎勵',
    }
    return typeMap[type] || type
  }

  // 獲取交易類型圖示
  const getTransactionTypeIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      'coupon_redeem': '🎫',
      'manual_recharge': '💰',
      'admin_adjustment': '⚙️',
      'admin_deposit': '💰',
      'admin_deduction': '💸',
      'order_payment': '🛒',
      'refund': '↩️',
      'bonus': '🎁',
      'checkin_reward': '📅',
    }
    return iconMap[type] || '💳'
  }

  if (!user) {
    return (
      <div className="wallet-history-not-logged-in">
        <div className="wallet-history-not-logged-in-icon">🔒</div>
        <div className="wallet-history-not-logged-in-text">請先登入查看錢包記錄</div>
      </div>
    )
  }

  return (
    <div className="wallet-history-card">
      <div className="wallet-history-header">
        <h3 className="wallet-history-title">
          <div className="wallet-history-icon">💰</div>
          錢包交易記錄
          <span className="wallet-history-subtitle">（最近30天）</span>
        </h3>
        {stats && (parseInt(stats.totalIncome || '0') > 0 || parseInt(stats.totalExpense || '0') > 0 || parseInt(stats.totalTransactions || '0') > 0) && (
          <div className="wallet-history-stats">
            {parseInt(stats.totalIncome || '0') > 0 && (
              <div className="wallet-history-stat-item income">
                <span className="wallet-history-stat-label">總收入</span>
                <span className="wallet-history-stat-value">+{formatAmount(parseInt(stats.totalIncome || '0'))}</span>
              </div>
            )}
            {parseInt(stats.totalExpense || '0') > 0 && (
              <div className="wallet-history-stat-item expense">
                <span className="wallet-history-stat-label">總支出</span>
                <span className="wallet-history-stat-value">-{formatAmount(parseInt(stats.totalExpense || '0'))}</span>
              </div>
            )}
            {parseInt(stats.totalTransactions || '0') > 0 && (
              <div className="wallet-history-stat-item total">
                <span className="wallet-history-stat-label">交易筆數</span>
                <span className="wallet-history-stat-value">{stats.totalTransactions}筆</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="wallet-history-content">
        {loading && (
          <div className="wallet-history-loading">
            <div className="wallet-history-loading-icon">⏳</div>
            <div className="wallet-history-loading-text">載入中...</div>
          </div>
        )}

        {error && (
          <div className="wallet-history-error">
            <div className="wallet-history-error-icon">❌</div>
            <div className="wallet-history-error-text">{error}</div>
            <button 
              className="wallet-history-retry-btn"
              onClick={fetchTransactions}
            >
              重新載入
            </button>
          </div>
        )}

        {!loading && !error && transactions.length === 0 && (
          <div className="wallet-history-empty">
            <div className="wallet-history-empty-icon">📭</div>
            <div className="wallet-history-empty-text">最近30天內沒有交易記錄</div>
          </div>
        )}

        {!loading && !error && transactions.length > 0 && (
          <div className="wallet-history-list">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="wallet-history-item">
                <div className="wallet-history-item-left">
                  <div className="wallet-history-item-icon">
                    {getTransactionTypeIcon(transaction.transactionType)}
                  </div>
                  <div className="wallet-history-item-info">
                    <div className="wallet-history-item-type">
                      {getTransactionTypeName(transaction.transactionType)}
                    </div>
                    <div className="wallet-history-item-description">
                      {transaction.description}
                    </div>
                    <div className="wallet-history-item-date">
                      {formatDate(transaction.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="wallet-history-item-right">
                  <div className={`wallet-history-item-amount ${transaction.amount >= 0 ? 'positive' : 'negative'}`}>
                    {transaction.amount >= 0 ? '+' : ''}{formatAmount(transaction.amount)}
                  </div>
                  <div className="wallet-history-item-balance">
                    餘額: {formatAmount(transaction.balanceAfter)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}