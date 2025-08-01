// frontend/src/app/(dashboard)/lucky-draw/page.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Prize {
  id: number;
  name: string;
  image_url: string;
  quantity: number;
  probability: number;
}

export default function LuckyDrawAdminPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPrizes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3001/lucky-prize", {

        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();

      // ✅ 看 console 確認格式長什麼樣
      console.log("prize API result", result);

      // ⛔ 確保這裡的 data 是陣列才 set
      if (Array.isArray(result)) {
        setPrizes(result);
      } else if (Array.isArray(result.data)) {
        setPrizes(result.data);
      } else {
        console.warn("⚠️ API 回傳格式非陣列：", result);
        setPrizes([]);
      }
    } catch (err) {
      console.error("獎項載入失敗", err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchPrizes();
  }, []);

  return (
    <div className="b-ibox">
      <h1>轉盤獎項管理</h1>

      <div className="b-ibox-s">

      {loading && <p>載入中...</p>}
      

      {!loading && (
        <table className="b-table-box admin-table mb15">
          <thead>
            <tr>
              <th>名稱</th>
              <th>圖片</th>
              <th>數量</th>
              <th>機率 (%)</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>

                {Array.isArray(prizes) && prizes.map((prize) => (
                <tr key={prize.id} className="text-center">
                    <td>{prize.name}</td>
                    <td>
                      {prize.image_url ? (
                        <Image
                          src={prize.image_url}
                          alt={prize.name}
                          width={50}
                          height={50}
                          className="object-contain mx-auto"
                        />
                      ) : (
                        <span className="text-gray-400">無圖</span>
                      )}
                    </td>


                    <td>{prize.quantity}</td>
                    <td>{prize.probability}</td>
                
                <td>
                  <button className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                    編輯
                  </button>
                  <button className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                    刪除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      </div>
    </div>
  );
}
