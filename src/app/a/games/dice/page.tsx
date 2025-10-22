'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { getUser } from '@/lib/useAuth';
import { useCompanySlug } from '@/hooks/useCompanySlug';
import '@/styles/pages/dice.css';

type DiceResult = {
  dice: [number, number, number];
  sum: number;
};

type SettleResponse = {
  roundId: string;
  result: DiceResult;
  winAmount: number;
  balanceAfter: number;
  finished: boolean;
};

type BetType = 'size' | 'sum';
type SizeChoice = 'BIG' | 'SMALL';

export default function DicePage() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState<number>(100);
  const [betType, setBetType] = useState<BetType>('size');
  const [sizeChoice, setSizeChoice] = useState<SizeChoice>('BIG');
  const [sumChoice, setSumChoice] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('');
  const [result, setResult] = useState<DiceResult | null>(null);
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
        console.error('Dice init error:', e);
        setErr(e.message || '初始化失敗');
      }
    })();
  }, [companySlug]);

  const resetGame = () => {
    setResult(null);
    setMessage('');
    setErr(null);
  };

  const getSumRange = (sum: number): string => {
    if (sum <= 3) return '極小（莊贏）';
    if (sum >= 18) return '極大（莊贏）';
    if (sum >= 11) return '大';
    return '小';
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

    if (betType === 'sum' && sumChoice === null) {
      setErr('請選擇要下注的點數總和');
      return;
    }

    try {
      setIsPlaying(true);
      setMessage('下注中…');
      setResult(null);
      setErr(null);
      
      const roundId = `round_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const betPayload = betType === 'size' 
        ? { choice: sizeChoice }
        : { sum: sumChoice };

      const betResp = await apiPost('/mock-games/bet', {
        sessionToken,
        gameId: 'DICE',
        roundId,
        betAmount,
        betPayload,
      });

      if (betResp.status !== 'ACCEPTED') {
        throw new Error(betResp.reason || '下注失敗');
      }

      setMessage('擲骰中…');
      
      // 延遲效果
      await new Promise(resolve => setTimeout(resolve, 1500));

      const settle: SettleResponse = await apiPost(`/mock-games/settle?roundId=${encodeURIComponent(roundId)}`);
      
      setResult(settle.result);
      setBalance(settle.balanceAfter);
      // 更新用戶真實餘額顯示
      setUserBalance(settle.balanceAfter);
      // 記錄遊戲結果，包含下注金額以便計算損益
      const gameRecord = { ...settle, betAmount };
      setGameHistory(prev => [gameRecord, ...prev.slice(0, 9)]);
      
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
    <div className="dice-container">
      {/* Header */}
      <div className="dice-header">
        <div className="dice-nav">
          <a href="/a/games" className="back-link">
            ← 返回遊戲大廳
          </a>
          <button onClick={resetGame} className="reset-btn">
            🔄 重置遊戲
          </button>
        </div>
      </div>

      <div className="dice-content">
        {/* Game Title */}
        <div className="game-title-section">
          <h1 className="game-title">🎲 骰子遊戲</h1>
          <p className="game-subtitle">三顆骰子，多種玩法，刺激好玩！</p>
        </div>

        {/* Balance Display */}
        <div className="balance-display">
          <div className="balance-label">當前餘額</div>
          <div className="balance-value">
            {userBalance !== null ? userBalance.toLocaleString() : '-'}
          </div>
        </div>

        <div className="game-layout">
          {/* Sidebar */}
          <div className="sidebar">
            {/* Game Rules */}
            <div className="rules-card">
              <h3 className="card-title">📖 遊戲規則</h3>
              <div className="rules-list">
                <div className="rule-item">
                  <span className="rule-icon">🔺</span>
                  <span className="rule-text"><strong>大（BIG）</strong>：總和 11-17</span>
                </div>
                <div className="rule-item">
                  <span className="rule-icon">🔻</span>
                  <span className="rule-text blue"><strong>小（SMALL）</strong>：總和 4-10</span>
                </div>
                <div className="rule-item">
                  <span className="rule-icon">🎯</span>
                  <span className="rule-text yellow"><strong>莊贏</strong>：總和 3 或 18</span>
                </div>
                <div className="rule-item">
                  <span className="rule-icon">💰</span>
                  <span className="rule-text green">大小賠率：<strong>1 賠 1</strong></span>
                </div>
                <div className="rule-item">
                  <span className="rule-icon">🎰</span>
                  <span className="rule-text purple">指定點數：<strong>1 賠 10</strong></span>
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
                        <span className="history-dice">
                          {game.result.dice.join('-')} (總和: {game.result.sum})
                        </span>
                        <span className={`win-amount ${game.winAmount > 0 ? 'positive' : 'negative'}`}>
                          {game.winAmount > 0 ? `+${game.winAmount}` : `-${(game as any).betAmount || 0}`}
                        </span>
                      </div>
                      <div className="history-result">
                        {getSumRange(game.result.sum)}
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

            {/* Bet Type Selection */}
            <div className="bet-type-section">
              <label className="section-label">🎯 下注類型</label>
              <div className="bet-type-tabs">
                <button 
                  className={`bet-type-tab ${betType === 'size' ? 'active' : ''}`}
                  onClick={() => setBetType('size')}
                  disabled={isPlaying}
                >
                  大小
                </button>
                <button 
                  className={`bet-type-tab ${betType === 'sum' ? 'active' : ''}`}
                  onClick={() => setBetType('sum')}
                  disabled={isPlaying}
                >
                  指定點數
                </button>
              </div>

              {/* Size Betting Options */}
              {betType === 'size' && (
                <div className="bet-options size-bet-options">
                  <label className="bet-option">
                    <input 
                      type="radio" 
                      name="sizeChoice" 
                      checked={sizeChoice === 'BIG'} 
                      onChange={() => setSizeChoice('BIG')}
                      disabled={isPlaying}
                      className="bet-option-input"
                    />
                    <div className={`bet-option-card ${sizeChoice === 'BIG' ? 'selected big' : ''} ${isPlaying ? 'disabled' : ''}`}>
                      <div className="bet-option-icon">🔺</div>
                      <div className="bet-option-title">大（BIG）</div>
                      <div className="bet-option-description">總和 11-17</div>
                      <div className="bet-option-odds">賠率 1:1</div>
                    </div>
                  </label>
                  
                  <label className="bet-option">
                    <input 
                      type="radio" 
                      name="sizeChoice" 
                      checked={sizeChoice === 'SMALL'} 
                      onChange={() => setSizeChoice('SMALL')}
                      disabled={isPlaying}
                      className="bet-option-input"
                    />
                    <div className={`bet-option-card ${sizeChoice === 'SMALL' ? 'selected small' : ''} ${isPlaying ? 'disabled' : ''}`}>
                      <div className="bet-option-icon">🔻</div>
                      <div className="bet-option-title">小（SMALL）</div>
                      <div className="bet-option-description">總和 4-10</div>
                      <div className="bet-option-odds">賠率 1:1</div>
                    </div>
                  </label>
                </div>
              )}

              {/* Sum Betting Options */}
              {betType === 'sum' && (
                <div className="bet-options sum-bet-options">
                  {Array.from({length: 16}, (_, i) => i + 3).map(sum => (
                    <label key={sum} className="bet-option">
                      <input 
                        type="radio" 
                        name="sumChoice" 
                        checked={sumChoice === sum} 
                        onChange={() => setSumChoice(sum)}
                        disabled={isPlaying}
                        className="bet-option-input"
                      />
                      <div className={`bet-option-card ${sumChoice === sum ? 'selected sum' : ''} ${isPlaying ? 'disabled' : ''}`}>
                        <div className="sum-option">{sum}</div>
                        <div className="bet-option-odds">1:10</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
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
                  <div className="dice-result">
                    <div className="dice-display">
                      {result.dice.map((die, index) => (
                        <div key={index} className="dice-item">
                          {die}
                        </div>
                      ))}
                    </div>
                    <div className="dice-sum">
                      總和：<span className="dice-sum-highlight">{result.sum}</span>
                    </div>
                    <div className="dice-sum">
                      結果：<span className="dice-sum-highlight">{getSumRange(result.sum)}</span>
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