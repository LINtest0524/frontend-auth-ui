'use client';

import { useState, useEffect } from 'react';
import Marquee from '@/components/Marquee';

export default function DebugMarqueePage() {
  const [marqueeDataA, setMarqueeDataA] = useState<any[]>([]);
  const [marqueeDataB, setMarqueeDataB] = useState<any[]>([]);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    const debugMarquee = async () => {
      setDebugInfo('診斷 Marquee 問題...\n');
      
      try {
        const token = localStorage.getItem('portalToken_a');
        
        // 測試 A 公司認證端點
        if (token) {
          const authResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/marquee?company=a`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setDebugInfo(prev => prev + `A 公司認證端點: ${authResponse.status}\n`);
          
          if (authResponse.ok) {
            const data = await authResponse.json();
            setMarqueeDataA(data);
            setDebugInfo(prev => prev + `A 公司認證資料: ${data.length} 筆\n`);
          }
        }
        
        // 測試 A 公司公開端點
        const publicResponseA = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/module/public/marquee?company=a`);
        setDebugInfo(prev => prev + `A 公司公開端點: ${publicResponseA.status}\n`);
        
        if (publicResponseA.ok) {
          const publicDataA = await publicResponseA.json();
          setDebugInfo(prev => prev + `A 公司公開資料: ${publicDataA.length} 筆\n`);
          if (!token) setMarqueeDataA(publicDataA);
        }

        // 測試 B 公司公開端點
        const publicResponseB = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/module/public/marquee?company=b`);
        setDebugInfo(prev => prev + `B 公司公開端點: ${publicResponseB.status}\n`);
        
        if (publicResponseB.ok) {
          const publicDataB = await publicResponseB.json();
          setMarqueeDataB(publicDataB);
          setDebugInfo(prev => prev + `B 公司公開資料: ${publicDataB.length} 筆\n`);
        }

        setDebugInfo(prev => prev + `\n登入狀態檢查:\n`);
        setDebugInfo(prev => prev + `A 公司 Token: ${token ? '有' : '無'}\n`);
        setDebugInfo(prev => prev + `Token 長度: ${token ? token.length : 0}\n`);

      } catch (error) {
        setDebugInfo(prev => prev + `💥 錯誤: ${error instanceof Error ? error.message : '未知錯誤'}\n`);
      }
    };

    debugMarquee();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Marquee 資料診斷</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 診斷結果 */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">🔍 API 測試結果</h3>
          <pre className="text-sm bg-gray-50 p-4 rounded border max-h-96 overflow-auto whitespace-pre-wrap">
            {debugInfo || '載入中...'}
          </pre>
        </div>

        {/* 資料摘要 */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📊 資料摘要</h3>
          
          <div className="space-y-4">
            <div className="border rounded p-3">
              <h4 className="font-medium">A 公司 Marquee</h4>
              <p className="text-sm text-gray-600">資料數量: {marqueeDataA.length}</p>
              <p className="text-sm text-gray-600">狀態: {marqueeDataA.length > 0 ? '✅ 有資料' : '❌ 無資料'}</p>
              {marqueeDataA.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500">第一筆:</p>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                    {JSON.stringify(marqueeDataA[0], null, 2)}
                  </pre>
                </div>
              )}
            </div>
            
            <div className="border rounded p-3">
              <h4 className="font-medium">B 公司 Marquee</h4>
              <p className="text-sm text-gray-600">資料數量: {marqueeDataB.length}</p>
              <p className="text-sm text-gray-600">狀態: {marqueeDataB.length > 0 ? '✅ 有資料' : '❌ 無資料'}</p>
              {marqueeDataB.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500">第一筆:</p>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                    {JSON.stringify(marqueeDataB[0], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 強制測試 Marquee */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">🧪 強制顯示 Marquee 測試</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">A 公司 Marquee</h4>
            {marqueeDataA.length > 0 ? (
              <Marquee marquees={marqueeDataA} />
            ) : (
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-500">A 公司沒有 Marquee 資料</p>
              </div>
            )}
          </div>
          
          <div>
            <h4 className="font-medium mb-2">B 公司 Marquee</h4>
            {marqueeDataB.length > 0 ? (
              <Marquee marquees={marqueeDataB} />
            ) : (
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-500">B 公司沒有 Marquee 資料</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 建議 SQL 檢查 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">💡 建議檢查資料庫</h3>
        
        <div className="space-y-3 text-sm">
          <div className="border-l-4 border-blue-400 pl-3">
            <p><strong>檢查 Marquee 資料：</strong></p>
            <code className="block mt-1 text-xs bg-gray-100 p-2 rounded">
              SELECT m.*, c.code as company_code <br/>
              FROM marquees m <br/>
              JOIN company c ON m."companyId" = c.id <br/>
              WHERE c.code IN ('a', 'b') AND m.status = 'ACTIVE';
            </code>
          </div>
          
          <div className="border-l-4 border-yellow-400 pl-3">
            <p><strong>檢查是否有任何 Marquee：</strong></p>
            <code className="block mt-1 text-xs bg-gray-100 p-2 rounded">
              SELECT * FROM marquees;
            </code>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-yellow-800 font-semibold mb-2">⚠️ 注意事項</h4>
        <p className="text-yellow-700 text-sm">
          訪問路徑: /tmp_rovodev_debug-marquee
        </p>
      </div>
    </div>
  );
}