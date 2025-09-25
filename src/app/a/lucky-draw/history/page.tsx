'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import './history.css';

interface DrawRecord {
  id: number;
  userId: number;
  prizeId: number;
  prizeName: string;
  userIp: string;
  userAgent: string;
  createdAt: string;
  prize: {
    id: number;
    name: string;
    imageUrl: string;
    quantity: number;
    probability: number;
  };
}

interface User {
  id?: number;
  userId?: number;
  username?: string;
  email?: string;
  role?: string;
  company?: {
    id: number;
    code?: string;
    name?: string;
  };
  companyId?: number;
  enabledModules?: string[] | { [key: string]: boolean };
}

export default function LuckyDrawHistoryPage() {
  const [records, setRecords] = useState<DrawRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUserAndHistory();
  }, []);

  const fetchUserAndHistory = async () => {
    try {
      // 取得用戶資料
      const companyCode = window.location.pathname.split('/')[1];
      const portalUser = localStorage.getItem(`portalUser_${companyCode}`);
      const adminUser = localStorage.getItem('user');
      
      let currentUser: User = {};
      if (portalUser) {
        currentUser = JSON.parse(portalUser) as User;
      } else if (adminUser) {
        currentUser = JSON.parse(adminUser) as User;
      } else {
        setError('請先登入');
        setLoading(false);
        return;
      }

      setUser(currentUser);
      
      const userId = currentUser?.id || currentUser?.userId;
      const companyId = currentUser?.company?.id || currentUser?.companyId;
      
      if (!userId) {
        setError('無法取得用戶資訊');
        setLoading(false);
        return;
      }

      // 取得抽獎歷史
      const token = localStorage.getItem(`portalToken_${companyCode}`) || localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/lucky-prize/history/${userId}?companyId=${companyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('無法取得抽獎歷史');
      }

      const data = await res.json();
      setRecords(data);
    } catch (err: any) {
      setError(err.message || '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getDeviceInfo = (userAgent: string) => {
    if (!userAgent) return '未知裝置';
    
    if (userAgent.includes('Mobile')) return '📱 手機';
    if (userAgent.includes('Tablet')) return '📱 平板';
    return '💻 電腦';
  };

  const formatIpAddress = (ip: string) => {
    if (!ip) return '未知IP';
    
    // 特殊處理：IPv6 localhost (::1) 轉換為 IPv4 localhost (127.0.0.1)
    if (ip === '::1') {
      return '127.0.0.1';
    }
    
    // 如果是IPv6格式，嘗試提取IPv4部分
    if (ip.includes('::ffff:')) {
      // IPv4-mapped IPv6 address (::ffff:192.168.1.1)
      return ip.replace('::ffff:', '');
    }
    
    // 如果是其他IPv6地址，嘗試轉換為IPv4格式
    if (ip.includes(':')) {
      // 對於其他IPv6地址，我們可以生成一個對應的IPv4地址
      // 這裡使用簡單的映射方式
      const parts = ip.split(':').filter(part => part !== '');
      if (parts.length > 0) {
        // 取最後幾個部分來生成IPv4
        const lastPart = parts[parts.length - 1];
        if (lastPart) {
          try {
            // 將16進制轉換為IPv4格式
            const hex = lastPart.padStart(8, '0');
            const a = parseInt(hex.substr(0, 2), 16);
            const b = parseInt(hex.substr(2, 2), 16);
            const c = parseInt(hex.substr(4, 2), 16);
            const d = parseInt(hex.substr(6, 2), 16);
            return `${a}.${b}.${c}.${d}`;
          } catch (e) {
            // 如果轉換失敗，返回一個默認的本地IP
            return '192.168.1.1';
          }
        }
      }
      // 如果無法解析，返回默認本地IP
      return '192.168.1.1';
    }
    
    // 如果已經是IPv4格式，直接返回
    return ip;
  };

  if (loading) {
    return (
      <div className="history-page">
        <div className="history-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">🎲 載入抽獎記錄中...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-page">
        <div className="history-container">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <div className="error-message">{error}</div>
            <Link href="/a/login" className="login-link">
              🔑 前往登入
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-container">
        {/* 頁面標題 */}
        <div className="history-header">
          <h1 className="history-title">🎰 我的抽獎記錄 🎰</h1>
          <div className="user-info">
            👤 會員：{user?.username} | 🏢 公司：{user?.company?.name || user?.company?.code}
          </div>
          <Link href="/a/lucky-draw" className="back-to-draw-btn">
            🎯 回到抽獎
          </Link>
        </div>

        {/* 統計資訊 */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">🎲 {records.length}</div>
            <div className="stat-label">總抽獎次數</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">🏆 {new Set(records.map(r => r.prizeId)).size}</div>
            <div className="stat-label">不同獎品種類</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">📅 {records.length > 0 ? formatDate(records[0].createdAt).split(' ')[0] : '-'}</div>
            <div className="stat-label">最近抽獎日期</div>
          </div>
        </div>

        {/* 抽獎記錄列表 */}
        {records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎰</div>
            <h3 className="empty-title">還沒有抽獎記錄</h3>
            <p className="empty-description">快去試試手氣，開始您的幸運之旅吧！</p>
            <Link href="/a/lucky-draw" className="start-draw-btn">
              🎯 開始抽獎
            </Link>
          </div>
        ) : (
          <div className="records-list">
            {records.map((record, index) => (
              <div key={record.id} className="record-card">
                <div className="record-content">
                  {/* 序號 */}
                  <div className="record-index">
                    {index + 1}
                  </div>
                  
                  {/* 獎品圖片 */}
                  <div className="prize-image-container">
                    <img
                      src={`http://localhost:3001${record.prize?.imageUrl}`}
                      alt={record.prizeName || record.prize?.name}
                      className="prize-image"
                      onError={(e) => {
                        e.currentTarget.src = '/no-information.webp';
                      }}
                    />
                  </div>
                  
                  {/* 獎品資訊 */}
                  <div className="prize-info">
                    <h3 className="prize-name">
                      🎁 {record.prizeName || record.prize?.name}
                    </h3>
                    <div className="prize-probability">
                      🎯 中獎機率：{record.prize?.probability}%
                    </div>
                  </div>
                  
                  {/* 抽獎資訊 */}
                  <div className="record-meta">
                    <div className="record-date">
                      {formatDate(record.createdAt)}
                    </div>
                    <div className="record-details">
                      <div className="device-info">
                        <span>{getDeviceInfo(record.userAgent)}</span>
                      </div>
                      <span>•</span>
                      <span>🌐 {formatIpAddress(record.userIp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 返回按鈕 */}
        <div className="back-home">
          <Link href="/a" className="back-home-link">
            ← 返回首頁
          </Link>
        </div>
      </div>
    </div>
  );
}