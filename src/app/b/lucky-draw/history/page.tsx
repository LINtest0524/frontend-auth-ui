'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <p className="mt-4 text-gray-600">載入中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold mb-2">    {error}</p>
          <Link 
            href="/a/login" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            前往登入
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 頁面標題 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-purple-800 mb-2">我的抽獎記錄</h1>
              <p className="text-gray-600">
                會員：{user?.username} | 
                公司：{user?.company?.name || user?.company?.code}
              </p>
            </div>
            <Link 
              href="/a/lucky-draw"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              回到抽獎
            </Link>
          </div>
        </div>

        {/* 統計資訊 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{records.length}</div>
            <div className="text-gray-600">總抽獎次數</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {new Set(records.map(r => r.prizeId)).size}
            </div>
            <div className="text-gray-600">不同獎品種類</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {records.length > 0 ? formatDate(records[0].createdAt).split(' ')[0] : '-'}
            </div>
            <div className="text-gray-600">最近抽獎日期</div>
          </div>
        </div>

        {/* 抽獎記錄列表 */}
        {records.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">抽獎</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">還沒有抽獎記錄</h3>
            <p className="text-gray-500 mb-4">快去試試手氣吧！</p>
            <Link 
              href="/a/lucky-draw"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors inline-block"
            >
              開始抽獎
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record, index) => (
              <div key={record.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* 序號 */}
                    <div className="bg-purple-100 text-purple-800 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    
                    {/* 獎品圖片 */}
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-yellow-400">
                      <img
                        src={`http://localhost:3001${record.prize?.imageUrl}`}
                        alt={record.prizeName || record.prize?.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/no-information.webp';
                        }}
                      />
                    </div>
                    
                    {/* 獎品資訊 */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {record.prizeName || record.prize?.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        中獎機率：{record.prize?.probability}%
                      </p>
                    </div>
                  </div>
                  
                  {/* 抽獎資訊 */}
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">
                      {formatDate(record.createdAt)}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center justify-end space-x-2">
                      <span>{getDeviceInfo(record.userAgent)}</span>
                      <span>•</span>
                      <span>IP: {record.userIp}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 返回按鈕 */}
        <div className="mt-8 text-center">
          <Link 
            href="/a"
            className="text-purple-600 hover:text-purple-800 underline"
          >
            ← 返回首頁
          </Link>
        </div>
      </div>
    </div>
  );
}