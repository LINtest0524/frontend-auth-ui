'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import './wheel.css';

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
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<DrawResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [winningClass, setWinningClass] = useState('');

  const fetchPrizes = async () => {
    // 動態獲取公司代碼
    const companyCode = window.location.pathname.split('/')[1];
    // 前台使用 portalToken_[company]，後台使用 token
    const token = localStorage.getItem(`portalToken_${companyCode}`) || localStorage.getItem('token');
    
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
    
    console.log('A代理商 - 獲取獎品，使用 companyId:', companyId);
    
    const res = await fetch(`http://localhost:3001/lucky-prize/active-event?companyId=${companyId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    
    console.log('前台取得的獎品資料:', data);
    
    // 確保前台也按 ID 排序
    let prizes = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
    prizes = prizes.sort((a: Prize, b: Prize) => a.id - b.id);
    
    console.log('排序後的獎品:', prizes);
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
      const token = localStorage.getItem(`portalToken_${companyCode}`) || localStorage.getItem('token');
      const portalUser = localStorage.getItem(`portalUser_${companyCode}`);
      const adminUser = localStorage.getItem('user');
      
      let user: User = {};
      if (portalUser) {
        user = JSON.parse(portalUser) as User;
        console.log('使用前台用戶資料 (portalUser)');
      } else if (adminUser) {
        user = JSON.parse(adminUser) as User;
        console.log('使用管理後台用戶資料 (user)');
      }
      
      console.log('=== 抽獎用戶資料檢查 ===');
      console.log('localStorage portalUser:', portalUser);
      console.log('localStorage user (admin):', adminUser);
      console.log('最終使用的用戶資料:', user);
      console.log('使用的 token:', token);
      
      // 檢查是否為前台用戶登入
      const isPortalUser = user?.id && user?.company && !user?.userId;
      console.log('是否為前台用戶:', isPortalUser);
      
      // 前台用戶優先使用 id 欄位（portal登入），管理後台使用 userId 欄位
      const userId = user?.id || user?.userId;
      const companyId = user?.company?.id || user?.companyId;
      
      console.log('前台用戶資料檢查:');
      console.log('- user.id:', user?.id, typeof user?.id);
      console.log('- user.userId:', user?.userId, typeof user?.userId);
      console.log('- user.company:', user?.company);
      console.log('- 最終使用的 userId:', userId);
      console.log('- 最終使用的 companyId:', companyId);
      
      console.log('解析出的 userId:', userId);
      console.log('用戶角色:', user?.role);
      console.log('公司ID:', companyId);
      console.log('公司資料:', user?.company);
      
      if (!userId) {
        alert('請先登入才能參與抽獎');
        setIsSpinning(false);
        return;
      }

      const res = await fetch('http://localhost:3001/lucky-prize/draw', {
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
        
        console.log('生成的 CSS:', style.textContent);
        
        console.log('中獎獎品索引:', drawResult.winningIndex);
        console.log('獎品總數:', prizes.length);
        console.log('每個獎品角度:', anglePerItem);
        console.log('目標角度:', targetAngle);
        console.log('最終旋轉角度:', finalRotation);
        console.log('使用動畫類別:', animationName);
        
        // 直接應用動畫類別
        setWinningClass(animationName);
        
        // 也直接操作 DOM 確保動畫應用
        setTimeout(() => {
          const wheelElement = document.querySelector('.wheel-container');
          if (wheelElement) {
            wheelElement.classList.add(animationName);
            console.log('應用的類別:', wheelElement.className);
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
      console.error('抽獎失敗:', error);
      setIsSpinning(false);
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
    <div className="lucky-draw-page flex flex-col items-center p-8">
      <div className="lucky-header flex items-center justify-between w-full max-w-4xl">
        <h1 className="lucky-title">🎰 幸運大轉盤 🎰</h1>
        <Link 
          href="/a/lucky-draw/history"
          className="history-btn"
        >
          📋 抽獎記錄
        </Link>
      </div>
      
      <div className="luck-relative">
        {/* 輪盤容器 */}
        <div
          className={`wheel-container ${winningClass}`}
          style={{
            width: radius * 2,
            height: radius * 2,
            borderRadius: '50%',
            border: '8px solid #4a5568',
            position: 'relative',
            margin: '0 auto',
            background: '#f7fafc',
            overflow: 'hidden',
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

        {/* 指針 */}
        <div className="wheel-pointer" />

        {/* 中心按鈕 */}
        <button
          onClick={drawPrize}
          disabled={isSpinning}
          className="center-button"
        >
          {isSpinning ? '🎲 抽獎中...' : '🎯 開始抽獎'}
        </button>
      </div>

      {/* 結果顯示 */}
      {showResult && result && (
        <div className="result-modal mt-8">
          <h2 className="result-title">🎉 恭喜中獎！🎉</h2>
          <img
            src={`http://localhost:3001${result.winningPrize.imageUrl}`}
            alt={result.winningPrize.name}
            className="result-prize-image"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <p className="result-message">🏆 {result.message} 🏆</p>
          <div className="result-buttons">
            <button
              onClick={() => setShowResult(false)}
              className="result-btn result-btn-primary"
            >
              🎮 繼續遊戲
            </button>
            <button
              onClick={() => {
                setShowResult(false);
                setWinningClass('');
                setResult(null);
                // 重置輪盤到初始位置
                const wheelElement = document.querySelector('.wheel-container');
                if (wheelElement) {
                  (wheelElement as HTMLElement).style.transform = 'rotate(0deg)';
                  (wheelElement as HTMLElement).style.animation = 'none';
                }
              }}
              className="result-btn result-btn-secondary"
            >
              🔄 重置輪盤
            </button>
          </div>
        </div>
      )}

      {/* 獎品列表 */}
      <div className="prizes-grid">
        {prizes.map((prize) => (
          <div key={prize.id} className="prize-card">
            <img
              src={`http://localhost:3001${prize.imageUrl}`}
              alt={prize.name}
              className="prize-card-image"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <p className="prize-card-name">🎁 {prize.name}</p>
            <p className="prize-card-probability">🎯 中獎機率: {prize.probability}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
