'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';
import { getUser } from '@/lib/useAuth';
import '@/styles/pages/games.css';

type Game = { gameId: string; gameName: string; category: string; status: 'ONLINE'|'OFFLINE' };

export default function GamesPage() {
  const params = useParams();
  const companyCode = params.companyCode as string;
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState<Game[]>([]);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        // 檢查用戶登入狀態
        const user = getUser(companyCode);
        if (!user) {
          setErr('請先登入才能使用遊戲功能');
          setLoading(false);
          return;
        }
        
        setCurrentUser(user);
        
        // 獲取用戶真實餘額
        try {
          const userProfile = await apiGet('/user/profile');
          setUserBalance(userProfile.balance || 0);
        } catch (e) {
          setUserBalance(0);
        }
        
        // 遊戲列表
        const g = await apiGet('/mock-games/games');
        setGames(g.items || []);
        
        // 建立 session（使用真實用戶 ID）
        const playerId = user.username || user.id.toString();
        const s = await apiPost('/mock-games/session', { playerId, currency: 'TWD' });
        setSessionToken(s.sessionToken);
        
        // 查模擬遊戲餘額（保留作為備用）
        const b = await apiGet(`/mock-games/balance?sessionToken=${encodeURIComponent(s.sessionToken)}`);
        setBalance(b.balance);
      } catch (e: any) {
        setErr(e.message || '載入失敗');
      } finally {
        setLoading(false);
      }
    })();
  }, [companyCode]);

  const refreshBalance = async () => {
    try {
      // 更新用戶真實餘額
      const userProfile = await apiGet('/user/profile');
      setUserBalance(userProfile.balance || 0);
      
      // 更新模擬遊戲餘額（如果有 session）
      if (sessionToken) {
        const b = await apiGet(`/mock-games/balance?sessionToken=${encodeURIComponent(sessionToken)}`);
        setBalance(b.balance);
      }
    } catch (e: any) {
      // 靜默處理錯誤
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <div className="loading-text">載入中...</div>
      </div>
    </div>
  );

  if (err) return (
    <div className="error-container">
      <div className="error-content">
        <div className="error-icon">⚠️ 連線錯誤</div>
        <div className="error-message">{err}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="error-btn"
        >
          重新載入
        </button>
      </div>
    </div>
  );

  return (
    <div className="games-container">
      {/* Header */}
      <div className="games-header">
        <div className="games-content">
          <h1 className="games-title">🎮 娛樂城遊戲大廳</h1>
          <p className="games-subtitle">體驗最刺激的線上遊戲</p>
        </div>
      </div>

      <div className="games-content">
        {/* Balance Card */}
        <div className="balance-card">
          <div className="balance-info">
            <h3>當前餘額</h3>
            <div className="balance-amount">
              {userBalance !== null ? userBalance.toLocaleString() : '-'}
            </div>
          </div>
          <div>
            <button onClick={refreshBalance} className="refresh-btn">
              🔄 重新整理
            </button>
            <div style={{fontSize: '0.75rem', color: '#93c5fd', marginTop: '0.5rem'}}>
              玩家: {currentUser?.username || currentUser?.id || '-'}
            </div>
          </div>
        </div>

        {/* Games Grid */}
        <div className="games-grid">
          {games.map(g => (
            <div key={g.gameId} className="game-card">
              {/* Game Icon */}
              <div className="game-icon">
                <span>{g.gameId === 'HI_LO' ? '🎯' : '🎲'}</span>
              </div>
              <h3 className="game-title">{g.gameName}</h3>
              <p className="game-category">{g.category} 遊戲</p>

              {/* Status Badge */}
              <div className={`game-status ${g.status === 'ONLINE' ? 'status-online' : 'status-offline'}`}>
                {g.status === 'ONLINE' ? '🟢 線上' : '🔴 維護中'}
              </div>

              {/* Action Button */}
              {g.gameId === 'HI_LO' ? (
                <a href={`/${companyCode}/games/hi-lo`} className="game-btn">
                  🚀 立即遊戲
                </a>
              ) : g.gameId === 'DICE' ? (
                <a href={`/${companyCode}/games/dice`} className="game-btn">
                  🚀 立即遊戲
                </a>
              ) : (
                <button disabled className="game-btn">
                  🔒 即將開放
                </button>
              )}

              {/* Game Description */}
              <p className="game-description">
                {g.gameId === 'HI_LO' 
                  ? '經典猜大小遊戲，1：2 賠率' 
                  : g.gameId === 'DICE'
                  ? '三顆骰子遊戲，多種玩法'
                  : '更多遊戲，敬請期待'
                }
              </p>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="footer-info">
          <div className="footer-features">
            🛡️ 安全保障 | 🎯 公平遊戲 | 💰 即時出金
          </div>
          <div className="footer-disclaimer">
            * 此為測試環境，所有資料僅供展示使用
          </div>
        </div>
      </div>
    </div>
  );
}