'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import './modern-wheel.css';

interface Prize {
  id: number;
  name: string;
  imageUrl: string;
  quantity: number;
  probability: number;
}

interface DrawResult {
  success: boolean;
  winningPrize: Prize;
  winningIndex: number;
  totalPrizes: number;
  message: string;
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

export default function Wheel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<DrawResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [winningClass, setWinningClass] = useState('');

  // 獲取公司代碼（從路徑中獲取）
  const getCompanyCode = (): string => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const companyCode = pathname.split('/')[1]; // 取得路徑中的第一個部分
      return companyCode || 'a'; // 預設為 'a'
    }
    return 'a'; // SSR 時的預設值
  };

  const companyCode = getCompanyCode();

  // 重複登入檢查
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const companyCode = window.location.pathname.split('/')[1]
      const token = localStorage.getItem(`portalToken_${companyCode}`)
      if (!token) {
        window.location.href = '/a/duplicate-login'
        return
      }
    }
  }, [])

  const fetchPrizes = async () => {
    // 動態獲取公司代碼
    const companyCode = window.location.pathname.split('/')[1];
    // 前台只使用 portalToken_[company]
    const token = localStorage.getItem(`portalToken_${companyCode}`);
    
    // 獲取當前代理商 ID
    const portalUser = localStorage.getItem(`portalUser_${companyCode}`);
    const adminUser = localStorage.getItem('user');
    let companyId = 1; // 預設值
    
    if (portalUser) {
      const user = JSON.parse(portalUser);
      companyId = user?.company?.id || user?.companyId || 1;
    } else if (adminUser) {
      const user = JSON.parse(adminUser);
      companyId = user?.company?.id || user?.companyId || 1;
    }
    
    
    const res = await fetch(`http://localhost:3001/api/portal/${companyCode}/lucky-draw/active-event?companyId=${companyId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    
    // 確保前台也按 ID 排序
    let prizes = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
    prizes = prizes.sort((a: Prize, b: Prize) => a.id - b.id);
    setPrizes(prizes);
  };

  const drawPrize = async () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setShowResult(false);
    setResult(null);
    setWinningClass('');
    
    // 重置輪盤位置
    const wheelElement = document.querySelector('.wheel-container');
    if (wheelElement) {
      (wheelElement as HTMLElement).style.transform = 'rotate(0deg)';
      (wheelElement as HTMLElement).style.animation = 'none';
    }

    try {
      // 前台使用 portalToken 和 portalUser，後台使用 token 和 user
      const companyCode = window.location.pathname.split('/')[1];
      const token = localStorage.getItem(`portalToken_${companyCode}`);
      const portalUser = localStorage.getItem(`portalUser_${companyCode}`);
      const adminUser = localStorage.getItem('user');
      
      let user: User = {};
      if (portalUser) {
        user = JSON.parse(portalUser) as User;
      } else if (adminUser) {
        user = JSON.parse(adminUser) as User;
      }
      
      
      // 檢查是否為前台用戶登入
      const isPortalUser = user?.id && user?.company && !user?.userId;
      
      // 前台用戶優先使用 id 欄位（portal登入），管理後台使用 userId 欄位
      const userId = user?.id || user?.userId;
      const companyId = user?.company?.id || user?.companyId;
      
      
      
      if (!userId) {
        alert('請先登入才能參與抽獎');
        setIsSpinning(false);
        return;
      }

      const res = await fetch(`http://localhost:3001/api/portal/${companyCode}/lucky-draw/draw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          userId: userId,
          companyId: companyId || 1 
        }),
      });

      const drawResult: DrawResult = await res.json();
      
      if (drawResult.success) {
        // 動態生成 CSS 動畫
        const anglePerItem = 360 / prizes.length;
        // 獎品區域的中心角度 = 起始角度 + 半個獎品角度
        const targetAngle = anglePerItem * drawResult.winningIndex + (anglePerItem / 2);
        const finalRotation = 1800 - targetAngle; // 5圈(1800度) - 目標角度
        
        // 動態創建 CSS 動畫
        const animationName = `spin-to-result-${drawResult.winningIndex}-${prizes.length}`;
        const keyframes = `
          @keyframes ${animationName} {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(${finalRotation}deg); }
          }
        `;
        
        // 移除舊的動畫樣式
        const oldStyle = document.getElementById('dynamic-wheel-animation');
        if (oldStyle) oldStyle.remove();
        
        // 添加新的動畫樣式
        const style = document.createElement('style');
        style.id = 'dynamic-wheel-animation';
        style.textContent = keyframes + `
          .wheel-container.${animationName} {
            animation: ${animationName} 3s cubic-bezier(0.23, 1, 0.32, 1) forwards !important;
          }
        `;
        document.head.appendChild(style);
        
        
        // 直接應用動畫類別
        setWinningClass(animationName);
        
        // 也直接操作 DOM 確保動畫應用
        setTimeout(() => {
          const wheelElement = document.querySelector('.wheel-container');
          if (wheelElement) {
            wheelElement.classList.add(animationName);
          }
        }, 100);
        
        setResult(drawResult);
        
        // 3秒後顯示結果並保持最終位置
        setTimeout(() => {
          setIsSpinning(false);
          setShowResult(true);
          
          // 確保輪盤停在最終位置
          const wheelElement = document.querySelector('.wheel-container');
          if (wheelElement) {
            (wheelElement as HTMLElement).style.transform = `rotate(${finalRotation}deg)`;
            (wheelElement as HTMLElement).style.animation = 'none';
          }
        }, 3000);
      }
    } catch (error) {
      setIsSpinning(false);
      alert('抽獎失敗，請重試');
    }
  };

  useEffect(() => {
    fetchPrizes();
  }, []);

  const radius = 200;
  const center = radius;
  const itemCount = prizes.length;
  const anglePerItem = 360 / itemCount;

  // 預定義顏色陣列，確保每個獎品有不同顏色
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD',
    '#00D2D3', '#FF9F43', '#EE5A52', '#0ABDE3',
    '#10AC84', '#F79F1F', '#A3CB38', '#FDA7DF'
  ];

  return (
    <div className="modern-lucky-draw">
      {/* 背景動畫 */}
      <div className="bg-animation">
        <div className="floating-shapes">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`shape shape-${i + 1}`} />
          ))}
        </div>
      </div>

      {/* 主要內容容器 */}
      <div className="content-wrapper">
        {/* 頂部導航區 */}
        <div className="top-section">
          <div className="header-container">
            <div className="title-section">
              <h1 className="main-title">
                <span className="title-icon">🎯</span>
                <span className="title-text">幸運大轉盤</span>
                <span className="title-icon">🎯</span>
              </h1>
              <p className="subtitle">轉動命運之輪，贏取豐富獎品</p>
            </div>
            
            <button 
              onClick={() => {
                // 保持原有的查詢參數（如 agent 參數）
                const currentParams = new URLSearchParams(searchParams.toString());
                const queryString = currentParams.toString();
                const historyUrl = `/${companyCode}/lucky-draw/history${queryString ? `?${queryString}` : ''}`;
                router.push(historyUrl);
              }}
              className="history-button"
            >
              <svg className="history-icon" viewBox="0 0 24 24" fill="none">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 7v5l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>抽獎記錄</span>
            </button>
          </div>
        </div>

        {/* 轉盤主體區域 */}
        <div className="wheel-main-section">
          <div className="wheel-outer-ring">
            <div className="wheel-inner-ring">
              <div
                className={`wheel-container ${winningClass}`}
                style={{
                  width: radius * 2,
                  height: radius * 2,
                }}
              >
                {/* 色塊扇形區域 */}
                {prizes.map((_, index) => {
                  const startAngle = anglePerItem * index;
                  const endAngle = anglePerItem * (index + 1);
                  const color = colors[index % colors.length];
                  
                  // 使用 clip-path 創建扇形（從12點鐘方向開始）
                  const clipPath = `polygon(50% 50%, 
                    ${50 + 50 * Math.cos((startAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((startAngle - 90) * Math.PI / 180)}%, 
                    ${50 + 50 * Math.cos((endAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((endAngle - 90) * Math.PI / 180)}%)`;
                  
                  return (
                    <div
                      key={`sector-${index}`}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: color,
                        clipPath: clipPath,
                      }}
                    />
                  );
                })}

                {/* 輪盤分割線 */}
                {prizes.map((_, index) => {
                  const angle = anglePerItem * index;
                  return (
                    <div
                      key={`line-${index}`}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '3px',
                        height: `${radius}px`,
                        background: '#2d3748',
                        transformOrigin: 'top center',
                        transform: `translate(-50%, -100%) rotate(${angle}deg)`,
                        zIndex: 10,
                      }}
                    />
                  );
                })}

                {/* 獎品項目 */}
                {prizes.map((prize, index) => {
                  // 獎品放在每個扇形區域的中心（從12點鐘方向開始）
                  const angle = anglePerItem * index + (anglePerItem / 2) - 90;
                  const rad = (angle * Math.PI) / 180;
                  const x = center + radius * 0.7 * Math.cos(rad);
                  const y = center + radius * 0.7 * Math.sin(rad);

                  return (
                    <div
                      key={prize.id}
                      style={{
                        position: 'absolute',
                        top: y,
                        left: x,
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        width: 80,
                        zIndex: 20,
                      }}
                    >
                      <img
                        src={`http://localhost:3001${prize.imageUrl}`}
                        alt={prize.name}
                        className="prize-image"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="prize-text">
                        {prize.name}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* 轉盤指針 */}
              <div className="modern-pointer">
                <div className="pointer-triangle"></div>
                <div className="pointer-circle"></div>
              </div>
              
              {/* 中心抽獎按鈕 */}
              <button
                onClick={drawPrize}
                disabled={isSpinning}
                className="modern-center-button"
              >
                <div className="button-content">
                  {isSpinning ? (
                    <>
                      <div className="spinner"></div>
                      <span>抽獎中</span>
                    </>
                  ) : (
                    <>
                      <svg className="button-icon" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>開始抽獎</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* 獎品展示區域 */}
        <div className="prizes-showcase">
          <div className="showcase-header">
            <h2 className="showcase-title">
              <span className="showcase-icon">🎁</span>
              豐富獎品等你來拿
            </h2>
            <p className="showcase-subtitle">每次轉動都有機會獲得精美獎品</p>
          </div>
          
          <div className="prizes-grid">
            {prizes.map((prize, index) => (
              <div key={prize.id} className="modern-prize-card" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="prize-card-inner">
                  <div className="prize-image-container">
                    <img
                      src={`http://localhost:3001${prize.imageUrl}`}
                      alt={prize.name}
                      className="prize-image"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="prize-overlay">
                      <div className="prize-probability">{prize.probability}%</div>
                    </div>
                  </div>
                  <div className="prize-info">
                    <h3 className="prize-name">{prize.name}</h3>
                    <div className="prize-details">
                      <span className="probability-badge">
                        <svg className="badge-icon" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"/>
                        </svg>
                        中獎率 {prize.probability}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 現代化結果彈窗 */}
      {showResult && result && (
        <div className="modern-result-modal">
          <div className="modal-backdrop" onClick={() => setShowResult(false)} />
          <div className="modal-content">
            <div className="confetti-animation">
              {[...Array(20)].map((_, i) => (
                <div key={i} className={`confetti confetti-${i + 1}`} />
              ))}
            </div>
            
            <div className="result-header">
              <div className="celebration-icon">🎉</div>
              <h2 className="result-title">恭喜中獎！</h2>
              <p className="result-subtitle">您獲得了超棒的獎品</p>
            </div>
            
            <div className="winning-prize-display">
              <div className="prize-image-frame">
                <img
                  src={`http://localhost:3001${result.winningPrize.imageUrl}`}
                  alt={result.winningPrize.name}
                  className="winning-prize-image"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="prize-glow"></div>
              </div>
              <div className="winning-prize-info">
                <h3 className="winning-prize-name">{result.winningPrize.name}</h3>
                <p className="winning-message">{result.message}</p>
              </div>
            </div>
            
            <div className="result-actions">
              <button
                onClick={() => setShowResult(false)}
                className="action-btn primary-action"
              >
                <svg className="btn-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"/>
                </svg>
                再試一次
              </button>
              <button
                onClick={() => {
                  setShowResult(false);
                  setWinningClass('');
                  setResult(null);
                  const wheelElement = document.querySelector('.wheel-container');
                  if (wheelElement) {
                    (wheelElement as HTMLElement).style.transform = 'rotate(0deg)';
                    (wheelElement as HTMLElement).style.animation = 'none';
                  }
                }}
                className="action-btn secondary-action"
              >
                <svg className="btn-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                </svg>
                重置轉盤
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}