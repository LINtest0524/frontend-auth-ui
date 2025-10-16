'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import './modern-history.css';

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
      const token = localStorage.getItem(`portalToken_${companyCode}`);
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
    <div className="modern-history-page">
      {/* 背景動畫 */}
      <div className="bg-animation">
        <div className="floating-shapes">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`shape shape-${i + 1}`} />
          ))}
        </div>
      </div>

      <div className="content-wrapper">
        {/* 頂部導航區 */}
        <div className="top-section">
          <div className="header-container">
            <div className="title-section">
              <h1 className="main-title">
                <span className="title-icon">📋</span>
                <span className="title-text">抽獎記錄</span>
                <span className="title-icon">📋</span>
              </h1>
              <p className="subtitle">追蹤您的幸運時刻</p>
            </div>
            
            <div className="nav-actions">
              <Link href="/a/lucky-draw" className="action-button primary">
                <svg className="button-icon" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>開始抽獎</span>
              </Link>
              <Link href="/a" className="action-button secondary">
                <svg className="button-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>返回首頁</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 用戶資訊卡片 */}
        <div className="user-info-card">
          <div className="user-avatar">
            <div className="avatar-circle">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
          </div>
          <div className="user-details">
            <h3 className="user-name">{user?.username}</h3>
            <p className="user-company">{user?.company?.name || user?.company?.code}</p>
          </div>
          <div className="user-stats">
            <div className="stat-item">
              <span className="stat-value">{records.length}</span>
              <span className="stat-label">總抽獎次數</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">{new Set(records.map(r => r.prizeId)).size}</span>
              <span className="stat-label">獲得獎品</span>
            </div>
          </div>
        </div>

        {/* 統計概覽 */}
        <div className="stats-overview">
          <div className="overview-header">
            <h2 className="overview-title">
              <span className="overview-icon">📊</span>
              統計概覽
            </h2>
          </div>
          <div className="stats-grid">
            <div className="stat-card modern-card">
              <div className="card-inner">
                <div className="stat-icon">🎲</div>
                <div className="stat-content">
                  <div className="stat-number">{records.length}</div>
                  <div className="stat-label">總抽獎次數</div>
                </div>
              </div>
            </div>
            <div className="stat-card modern-card">
              <div className="card-inner">
                <div className="stat-icon">🏆</div>
                <div className="stat-content">
                  <div className="stat-number">{new Set(records.map(r => r.prizeId)).size}</div>
                  <div className="stat-label">不同獎品</div>
                </div>
              </div>
            </div>
            <div className="stat-card modern-card">
              <div className="card-inner">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <div className="stat-number">{records.length > 0 ? formatDate(records[0].createdAt).split(' ')[0] : '-'}</div>
                  <div className="stat-label">最近抽獎</div>
                </div>
              </div>
            </div>
            <div className="stat-card modern-card">
              <div className="card-inner">
                <div className="stat-icon">⭐</div>
                <div className="stat-content">
                  <div className="stat-number">{records.length > 0 ? Math.round((new Set(records.map(r => r.prizeId)).size / records.length) * 100) : 0}%</div>
                  <div className="stat-label">中獎率</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 抽獎記錄列表 */}
        <div className="records-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-icon">🎯</span>
              抽獎記錄
            </h2>
            {records.length > 0 && (
              <div className="records-count">
                共 <span className="count-number">{records.length}</span> 筆記錄
              </div>
            )}
          </div>

          {records.length === 0 ? (
            <div className="modern-empty-state">
              <div className="empty-animation">
                <div className="empty-circle">
                  <div className="empty-icon">🎰</div>
                </div>
                <div className="empty-particles">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className={`particle particle-${i + 1}`} />
                  ))}
                </div>
              </div>
              <div className="empty-content">
                <h3 className="empty-title">尚無抽獎記錄</h3>
                <p className="empty-description">開始您的幸運之旅，創造第一個中獎記錄！</p>
                <Link href="/a/lucky-draw" className="start-draw-button">
                  <svg className="button-icon" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>立即抽獎</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="modern-records-grid">
              {records.map((record, index) => (
                <div key={record.id} className="modern-record-card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="record-card-inner">
                    {/* 記錄序號徽章 */}
                    <div className="record-badge">
                      <span className="badge-number">#{index + 1}</span>
                    </div>
                    
                    {/* 獎品圖片區域 */}
                    <div className="prize-image-section">
                      <div className="image-frame">
                        <img
                          src={`http://localhost:3001${record.prize?.imageUrl}`}
                          alt={record.prizeName || record.prize?.name}
                          className="prize-image"
                          onError={(e) => {
                            e.currentTarget.src = '/no-information.webp';
                          }}
                        />
                        <div className="image-overlay">
                          <div className="probability-tag">
                            {record.prize?.probability}%
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 獎品資訊區域 */}
                    <div className="prize-info-section">
                      <h3 className="prize-title">
                        {record.prizeName || record.prize?.name}
                      </h3>
                      <div className="prize-meta">
                        <span className="probability-badge">
                          <svg className="badge-icon" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"/>
                          </svg>
                          中獎率 {record.prize?.probability}%
                        </span>
                      </div>
                    </div>
                    
                    {/* 時間和設備資訊 */}
                    <div className="record-footer">
                      <div className="datetime-info">
                        <div className="date-part">
                          <svg className="info-icon" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                          </svg>
                          <span>{formatDate(record.createdAt)}</span>
                        </div>
                      </div>
                      
                      <div className="device-info">
                        <div className="device-tag">
                          <span>{getDeviceInfo(record.userAgent)}</span>
                        </div>
                        <div className="ip-info">
                          <svg className="info-icon" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd"/>
                          </svg>
                          <span>{formatIpAddress(record.userIp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}