'use client';

import { useState, useEffect } from 'react';

export default function RouteTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testRoute = async (path: string) => {
    addResult(`測試路由: ${path}`);
    
    try {
      const response = await fetch(path, { method: 'HEAD' });
      const status = response.status;
      
      if (status === 200) {
        addResult(`✅ ${path} - 正常 (${status})`);
      } else if (status === 307 || status === 308) {
        addResult(`🔄 ${path} - 重導向 (${status})`);
      } else {
        addResult(`❌ ${path} - 錯誤 (${status})`);
      }
    } catch (error) {
      addResult(`💥 ${path} - 請求失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  const runRouteTests = async () => {
    setTestResults([]);
    addResult('開始路由測試...');
    
    // 測試舊路由 (應該被 middleware 重寫)
    const oldRoutes = [
      '/a',
      '/a/games', 
      '/a/login',
      '/a/member',
      '/b',
      '/b/games',
      '/b/login',
      '/b/member'
    ];

    // 測試新路由 (原有的動態路由)
    const newRoutes = [
      '/a/games',  // 這個會被重寫
      '/[companyCode]/games'  // 這個是原始動態路由
    ];

    for (const route of oldRoutes) {
      await testRoute(route);
      // 短暫延遲避免過快請求
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    addResult('路由測試完成！');
  };

  const openTestUrls = () => {
    const testUrls = [
      { name: 'A 公司首頁 (舊路由)', url: '/a' },
      { name: 'A 公司遊戲 (舊路由)', url: '/a/games' },
      { name: 'B 公司首頁 (舊路由)', url: '/b' },
      { name: 'B 公司遊戲 (舊路由)', url: '/b/games' },
      { name: 'A 公司 (新路由)', url: '/a' },
      { name: '配置測試頁面', url: '/tmp_rovodev_config-test' }
    ];

    addResult('準備開啟測試頁面...');
    
    testUrls.forEach((item, index) => {
      setTimeout(() => {
        addResult(`開啟: ${item.name} - ${item.url}`);
        window.open(item.url, `test_${index}`);
      }, index * 1000); // 每秒開啟一個
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">路由統一測試頁面</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">🚀 路由統一說明</h2>
        <div className="space-y-2 text-sm">
          <p><strong>目標</strong>: 讓舊路由 (/a/, /b/) 無縫使用新的配置系統</p>
          <p><strong>方法</strong>: 透過 middleware 將舊路由重寫到新架構</p>
          <p><strong>效果</strong>: 用戶看到的網址不變，但內部使用統一的配置驅動系統</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 測試控制 */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">測試控制</h3>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded">
              <p><strong>當前頁面:</strong></p>
              <code className="text-sm text-blue-600">{currentUrl}</code>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={runRouteTests}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                執行路由測試
              </button>
              
              <button 
                onClick={openTestUrls}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                開啟測試頁面
              </button>
              
              <button 
                onClick={() => setTestResults([])}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                清除結果
              </button>
            </div>
          </div>
        </div>

        {/* 預期行為 */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">預期行為</h3>
          
          <div className="space-y-3 text-sm">
            <div className="border-l-4 border-green-400 pl-3">
              <p><strong>✅ 成功情況:</strong></p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>/a/ 和 /b/ 能正常訪問</li>
                <li>內部使用配置系統</li>
                <li>A、B 公司顯示不同樣式</li>
                <li>功能根據配置啟用/停用</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-yellow-400 pl-3">
              <p><strong>⚠️ 可能問題:</strong></p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>CSS 樣式衝突</li>
                <li>路由重寫失敗</li>
                <li>配置載入錯誤</li>
                <li>元件渲染問題</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 測試結果 */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">測試結果</h3>
        <div className="bg-gray-50 p-4 rounded border min-h-[300px] max-h-[400px] overflow-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500">點擊「執行路由測試」開始測試...</p>
          ) : (
            <pre className="text-sm whitespace-pre-wrap">
              {testResults.join('\n')}
            </pre>
          )}
        </div>
      </div>

      {/* 手動測試連結 */}
      <div className="bg-white border rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">手動測試連結</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'A 首頁', path: '/a' },
            { name: 'A 遊戲', path: '/a/games' },
            { name: 'A 登入', path: '/a/login' },
            { name: 'A 會員', path: '/a/member' },
            { name: 'B 首頁', path: '/b' },
            { name: 'B 遊戲', path: '/b/games' },
            { name: 'B 登入', path: '/b/login' },
            { name: 'B 會員', path: '/b/member' }
          ].map((link) => (
            <a
              key={link.path}
              href={link.path}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 text-center bg-gray-100 hover:bg-gray-200 rounded-md transition-colors text-sm"
            >
              {link.name}
              <br />
              <code className="text-xs text-gray-600">{link.path}</code>
            </a>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-yellow-800 font-semibold mb-2">⚠️ 注意事項</h4>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>• 這是臨時測試頁面，實作完成後會被移除</li>
          <li>• 如果路由重寫失敗，檢查 middleware 是否正確載入</li>
          <li>• 如果配置載入失敗，檢查配置檔案是否存在</li>
          <li>• 訪問路徑: /tmp_rovodev_route-test</li>
        </ul>
      </div>
    </div>
  );
}