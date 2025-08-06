"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LuckyDrawRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // 重定向到活動管理頁面
    router.replace('/lucky-draw/events');
  }, [router]);

  return (
    <div className="b-ibox">
      <div className="text-center p-8">
        <h2>正在跳轉到輪盤管理...</h2>
        <p className="text-gray-600 mt-2">如果沒有自動跳轉，請點擊下方連結：</p>
        <div className="mt-4 space-x-4">
          <button 
            onClick={() => router.push('/lucky-draw/events')}
            className="b-btn-s2 b-btn-c4"
          >
            活動管理
          </button>
          <button 
            onClick={() => router.push('/lucky-draw/prizes')}
            className="b-btn-s2 b-btn-c1"
          >
            獎項列表
          </button>
          <button 
            onClick={() => router.push('/lucky-draw/records')}
            className="b-btn-s2 b-btn-c2"
          >
            抽獎記錄
          </button>
        </div>
      </div>
    </div>
  );
}