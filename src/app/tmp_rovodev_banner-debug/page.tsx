'use client';

import { useState, useEffect } from 'react';
import { useEnabledModules } from '@/lib/useEnabledModules';
import BannerCarousel from '@/components/BannerCarousel';

export default function BannerDebugPage() {
  const [bannerDataA, setBannerDataA] = useState<any[]>([]);
  const [bannerDataB, setBannerDataB] = useState<any[]>([]);
  const [enabledModulesA, setEnabledModulesA] = useState<string[]>([]);
  const [enabledModulesB, setEnabledModulesB] = useState<string[]>([]);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  const modules = useEnabledModules();

  useEffect(() => {
    const debugBanners = async () => {
      setDebugInfo('開始診斷 Banner 問題...\n');
      
      try {
        // 測試 A 公司
        const responseA = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/banner?company=a`);
        const bannersA = responseA.ok ? await responseA.json() : [];
        setBannerDataA(bannersA);
        
        // 測試 B 公司  
        const responseB = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/banner?company=b`);
        const bannersB = responseB.ok ? await responseB.json() : [];
        setBannerDataB(bannersB);

        // 測試啟用模組
        const moduleResponseA = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/module/public/module?company=a`);
        const modulesA = moduleResponseA.ok ? await moduleResponseA.json() : [];
        setEnabledModulesA(modulesA);

        const moduleResponseB = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/portal/module/public/module?company=b`);
        const modulesB = moduleResponseB.ok ? await moduleResponseB.json() : [];
        setEnabledModulesB(modulesB);

        // 一次性更新所有診斷資訊
        let diagnostic = '診斷完成！\n\n';
        diagnostic += `A 公司 Banner API: ${responseA.status} - ${bannersA.length} 筆資料\n`;
        diagnostic += `B 公司 Banner API: ${responseB.status} - ${bannersB.length} 筆資料\n`;
        diagnostic += `A 公司啟用模組: ${modulesA.join(', ')}\n`;
        diagnostic += `B 公司啟用模組: ${modulesB.join(', ')}\n`;
        diagnostic += `\n模組系統載入狀況:\n`;
        diagnostic += `- 可用模組數量: ${modules.length}\n`;
        diagnostic += `- 模組清單: ${modules.map(m => m.key).join(', ')}\n`;
        
        const bannerModule = modules.find(m => m.key === 'banner');
        diagnostic += `- Banner 模組: ${bannerModule ? '✅ 找到' : '❌ 未找到'}\n`;

        setDebugInfo(diagnostic);

      } catch (error) {
        setDebugInfo(`❌ 錯誤: ${error instanceof Error ? error.message : '未知錯誤'}\n`);
      }
    };

    // 只在載入時執行一次
    if (modules.length >= 0) {
      debugBanners();
    }
  }, []); // 移除 modules 依賴避免無限循環

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Banner 顯示問題診斷</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 診斷結果 */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">🔍 診斷結果</h3>
          <pre className="text-sm bg-gray-50 p-4 rounded border max-h-96 overflow-auto">
            {debugInfo || '載入中...'}
          </pre>
        </div>

        {/* 資料摘要 */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📊 資料摘要</h3>
          
          <div className="space-y-4">
            <div className="border rounded p-3">
              <h4 className="font-medium">A 公司</h4>
              <p className="text-sm text-gray-600">Banner 數量: {bannerDataA.length}</p>
              <p className="text-sm text-gray-600">啟用模組: {enabledModulesA.length}</p>
              <p className="text-sm text-gray-600">包含 banner: {enabledModulesA.includes('banner') ? '✅' : '❌'}</p>
            </div>
            
            <div className="border rounded p-3">
              <h4 className="font-medium">B 公司</h4>
              <p className="text-sm text-gray-600">Banner 數量: {bannerDataB.length}</p>
              <p className="text-sm text-gray-600">啟用模組: {enabledModulesB.length}</p>
              <p className="text-sm text-gray-600">包含 banner: {enabledModulesB.includes('banner') ? '✅' : '❌'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 強制測試 Banner 元件 */}
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">🧪 強制測試 BannerCarousel</h3>
          <p className="text-sm text-blue-700 mb-4">
            無論模組狀態如何，直接測試 BannerCarousel 元件
          </p>
          
          {/* A 公司強制測試 */}
          <div className="mb-6">
            <h4 className="font-medium mb-2">A 公司 Banner (強制顯示)</h4>
            {bannerDataA.length > 0 ? (
              <BannerCarousel banners={bannerDataA} companyCode="a" />
            ) : (
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-500">A 公司沒有 Banner 資料</p>
              </div>
            )}
          </div>

          {/* B 公司強制測試 */}
          <div className="mb-6">
            <h4 className="font-medium mb-2">B 公司 Banner (強制顯示)</h4>
            {bannerDataB.length > 0 ? (
              <BannerCarousel banners={bannerDataB} companyCode="b" />
            ) : (
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-500">B 公司沒有 Banner 資料</p>
              </div>
            )}
          </div>
        </div>

        {/* 模擬 Banner 測試 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">🎭 模擬 Banner 測試</h3>
          <p className="text-sm text-green-700 mb-4">
            使用假資料測試 BannerCarousel 的配置化效果
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">A 公司主題 (classic)</h4>
              <BannerCarousel 
                banners={[{
                  id: 1,
                  title: "A 公司測試 Banner",
                  desktop_image_url: "https://via.placeholder.com/800x300/1a1a2e/ffffff?text=A+Company+Banner",
                  mobile_image_url: "https://via.placeholder.com/400x200/1a1a2e/ffffff?text=A+Mobile",
                  start_time: "2020-01-01T00:00:00Z",
                  end_time: "2030-12-31T23:59:59Z",
                  status: "ACTIVE"
                }]}
                companyCode="a"
              />
            </div>
            
            <div>
              <h4 className="font-medium mb-2">B 公司主題 (modern)</h4>
              <BannerCarousel 
                banners={[{
                  id: 2,
                  title: "B 公司測試 Banner",
                  desktop_image_url: "https://via.placeholder.com/800x300/2563eb/ffffff?text=B+Company+Banner",
                  mobile_image_url: "https://via.placeholder.com/400x200/2563eb/ffffff?text=B+Mobile",
                  start_time: "2020-01-01T00:00:00Z",
                  end_time: "2030-12-31T23:59:59Z",
                  status: "ACTIVE"
                }]}
                companyCode="b"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-yellow-800 font-semibold mb-2">⚠️ 注意事項</h4>
        <p className="text-yellow-700 text-sm">
          這是臨時診斷頁面，實作完成後會被移除。
          訪問路徑: /tmp_rovodev_banner-debug
        </p>
      </div>
    </div>
  );
}