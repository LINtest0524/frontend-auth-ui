'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { getUser } from '@/lib/useAuth';
import { useCompanySlug } from '@/hooks/useCompanySlug';
import '@/styles/pages/hi-lo.css';

type GameResult = {
  card: number;
  outcome: 'HIGH' | 'LOW' | 'MID';
};

type SettleResponse = {
  roundId: string;
  result: GameResult;
  winAmount: number;
  balanceAfter: number;
  finished: boolean;
};

export default function HiLoPage() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState<number>(100);
  const [choice, setChoice] = useState<'HIGH'|'LOW'>('HIGH');
  const [message, setMessage] = useState<string>('');
  const [result, setResult] = useState<GameResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [gameHistory, setGameHistory] = useState<SettleResponse[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const companySlug = useCompanySlug();

  useEffect(() => {
    (async () => {
      try {
        // 檢查用戶登入狀態
        const user = getUser(companySlug);
        if (!user) {
          setErr('請先登入才能使用遊戲功能');
          return;
        }
        
        setCurrentUser(user);
        
        // 獲取用戶真實餘額
        try {
          const userProfile = await apiGet('/user/profile');
          setUserBalance(userProfile.balance || 0);
        } catch (e) {
          console.warn('無法獲取用戶錢包餘額:', e);
          setUserBalance(0);
        }
        
        // 建立 session（使用真實用戶 ID）
        const playerId = user.username || user.id.toString();
        const s = await apiPost('/mock-games/session', { playerId, currency: 'TWD' });
        setSessionToken(s.sessionToken);
        
        const b = await apiGet(`/mock-games/balance?sessionToken=${encodeURIComponent(s.sessionToken)}`);
        setBalance(b.balance);
      } catch (e: any) {
        console.error('HiLo init error:', e);
        setErr(e.message || '初始化失敗');
      }
    })();
  }, [companySlug]);

  const getCardName = (card: number): string => {
    if (card === 1) return 'A';
    if (card === 11) return 'J';
    if (card === 12) return 'Q';
    if (card === 13) return 'K';
    return card.toString();
  };

  const getOutcomeText = (outcome: string): string => {
    switch (outcome) {
      case 'HIGH': return '大';
      case 'LOW': return '小';
      case 'MID': return '中（莊贏）';
      default: return outcome;
    }
  };

  async function doBet() {
    if (!sessionToken || isPlaying) return;
    
    if (betAmount <= 0) {
      setErr('下注金額必須大於 0');
      return;
    }
    
    if (userBalance !== null && betAmount > userBalance) {
      setErr('餘額不足');
      // 3秒後自動清除錯誤訊息
      setTimeout(() => setErr(null), 3000);
      return;
    }

    try {
      setIsPlaying(true);
      setMessage('下注中…');
      setResult(null);
      setErr(null);
      
      const roundId = `round_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const betResp = await apiPost('/mock-games/bet', {
        sessionToken,
        gameId: 'HI_LO',
        roundId,
        betAmount,
        betPayload: { choice },
      });

      if (betResp.status !== 'ACCEPTED') {
        throw new Error(betResp.reason || '下注失敗');
      }

      setMessage('開牌中…');
      
      // 簡單的延遲效果
      await new Promise(resolve => setTimeout(resolve, 1000));

      const settle: SettleResponse = await apiPost(`/mock-games/settle?roundId=${encodeURIComponent(roundId)}`);
      
      setResult(settle.result);
      setBalance(settle.balanceAfter);
      // 更新用戶真實餘額顯示
      setUserBalance(settle.balanceAfter);
      // 記錄遊戲結果，包含下注金額以便計算損益
      const gameRecord = { ...settle, betAmount };
      setGameHistory(prev => [gameRecord, ...prev.slice(0, 9)]); // 保留最近 10 筆
      
      const isWin = settle.winAmount > 0;
      if (isWin) {
        setMessage(`🎉 恭喜中獎！派彩：${settle.winAmount} TWD`);
      } else {
        setMessage(`😔 很遺憾，本局未中獎`);
      }
      
    } catch (e: any) {
      console.error('Bet error:', e);
      setMessage('');
      setErr(e.message ?? '下注失敗');
    } finally {
      setIsPlaying(false);
    }
  }

  const resetGame = () => {
    setResult(null);
    setMessage('');
    setErr(null);
  };

  // 只有在初始化失敗時才顯示完整錯誤頁面，餘額不足等遊戲內錯誤不應該讓整個遊戲消失
  if (err && !balance && !currentUser) return (
    <div className="error-container">
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <div className="error-message">錯誤：{err}</div>
        <a href="/a/games" style={{color: '#60a5fa', textDecoration: 'underline'}}>← 返回遊戲列表</a>
      </div>
    </div>
  );

  return (
    <div className="hilo-container">
      {/* Header */}
      <div className="hilo-header">
        <div className="hilo-nav">
          <a href="/a/games" className="back-link">
            ← 返回遊戲大廳
          </a>
          <button onClick={resetGame} className="reset-btn">
            🔄 重置遊戲
          </button>
        </div>
      </div>

      <div className="hilo-content">
        {/* Game Title */}
        <div className="game-title-section">
          <h1 className="game-title">🎯 猜大小</h1>
          <p className="game-subtitle">經典 Hi-Lo 遊戲，考驗你的運氣！</p>
        </div>

        {/* Balance Display */}
        <div className="balance-display">
          <div className="balance-label">當前餘額</div>
          <div className="balance-value">
            {userBalance !== null ? userBalance.toLocaleString() : '-'}
          </div>
        </div>

        <div className="game-layout">
          {/* Game Rules */}
          <div className="sidebar">
            <div className="rules-card">
              <h3 className="card-title">
                📖 遊戲規則
              </h3>
              <div className="rules-list">
                <div className="rule-item">
                  <span className="rule-icon">🔺</span>
                  <span className="rule-text"><strong>大（HIGH）</strong>：8、9、10、J、Q、K</span>
                </div>
                <div className="rule-item">
                  <span className="rule-icon">🔻</span>
                  <span className="rule-text blue"><strong>小（LOW）</strong>：A、2、3、4、5、6</span>
                </div>
                <div className="rule-item">
                  <span className="rule-icon">🎯</span>
                  <span className="rule-text yellow"><strong>7 為莊家贏</strong></span>
                </div>
                <div className="rule-item">
                  <span className="rule-icon">💰</span>
                  <span className="rule-text green">猜中賠率：<strong>1 賠 1</strong></span>
                </div>
              </div>
            </div>

            {/* Game History */}
            {gameHistory.length > 0 && (
              <div className="history-card">
                <h3 className="card-title">📊 遊戲記錄</h3>
                <div className="history-list">
                  {gameHistory.map((game, index) => (
                    <div key={game.roundId} className="history-item">
                      <div className="history-header">
                        <span className="history-number">#{index + 1}</span>
                        <span className="history-card-value">{getCardName(game.result.card)}</span>
                        <span className={`win-amount ${game.winAmount > 0 ? 'positive' : 'negative'}`}>
                          {game.winAmount > 0 ? `+${game.winAmount}` : `-${(game as any).betAmount || 0}`}
                        </span>
                      </div>
                      <div className="history-result">
                        {getOutcomeText(game.result.outcome)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Game Area */}
          <div className="main-game">
            
            {/* Bet Amount */}
            <div className="bet-section">
              <label className="section-label">💰 下注金額</label>
              <div className="bet-input-group">
                <input 
                  type="number" 
                  value={betAmount} 
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  min="1"
                  max={userBalance || 1000}
                  disabled={isPlaying}
                  className="bet-input"
                  placeholder="100"
                />
                <span className="bet-currency">TWD</span>
                <div className="quick-bet-buttons">
                  {[100, 500, 1000].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setBetAmount(amount)}
                      disabled={isPlaying || (userBalance !== null && amount > userBalance)}
                      className="quick-bet-btn"
                    >
                      {amount}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Choice Selection */}
            <div className="choice-section">
              <label className="section-label">🎯 選擇大小</label>
              <div className="choice-grid">
                <label className="choice-label">
                  <input 
                    type="radio" 
                    name="choice" 
                    checked={choice === 'HIGH'} 
                    onChange={() => setChoice('HIGH')}
                    disabled={isPlaying}
                    className="choice-input"
                  />
                  <div className={`choice-card ${choice === 'HIGH' ? 'selected high' : ''} ${isPlaying ? 'disabled' : ''}`}>
                    <div className="choice-icon">🔺</div>
                    <div className="choice-title">大（HIGH）</div>
                    <div className="choice-description high">8, 9, 10, J, Q, K</div>
                  </div>
                </label>
                
                <label className="choice-label">
                  <input 
                    type="radio" 
                    name="choice" 
                    checked={choice === 'LOW'} 
                    onChange={() => setChoice('LOW')}
                    disabled={isPlaying}
                    className="choice-input"
                  />
                  <div className={`choice-card ${choice === 'LOW' ? 'selected low' : ''} ${isPlaying ? 'disabled' : ''}`}>
                    <div className="choice-icon">🔻</div>
                    <div className="choice-title">小（LOW）</div>
                    <div className="choice-description low">A, 2, 3, 4, 5, 6</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Bet Button */}
            <button 
              onClick={doBet} 
              disabled={isPlaying || !sessionToken || betAmount <= 0 || (userBalance !== null && betAmount > userBalance)}
              className="bet-button"
            >
              {isPlaying ? (
                <span className="loading-text">
                  <div className="loading-spinner-small"></div>
                  遊戲進行中...
                </span>
              ) : userBalance !== null && userBalance === 0 ? (
                '💰 餘額不足，請聯繫客服充值'
              ) : userBalance !== null && betAmount > userBalance ? (
                '💰 下注金額超過餘額'
              ) : (
                '🚀 立即下注'
              )}
            </button>

            {/* Error Message */}
            {err && (
              <div className="error-message">
                <div className="error-text">
                  ⚠️ {err}
                </div>
              </div>
            )}

            {/* Game Result */}
            {(message || result) && (
              <div className="result-display">
                {result && (
                  <div className="result-card">
                    <div className="result-card-display">
                      {getCardName(result.card)}
                    </div>
                    <div className="result-details">
                      開牌：<span className="result-highlight">{getCardName(result.card)}</span>
                    </div>
                    <div className="result-outcome">
                      結果：<span className="result-highlight">{getOutcomeText(result.outcome)}</span>
                    </div>
                  </div>
                )}
                {message && (
                  <div className="result-message">
                    <div className="result-message-text">
                      {message}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="footer-message">
          <div className="footer-text">
            🎲 祝您遊戲愉快，理性娛樂！
          </div>
        </div>
      </div>
    </div>
  );
}