"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUserStore } from "@/hooks/use-user-store";

export default function LoanProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currentUser = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      setUser(JSON.parse(rawUser));
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`http://localhost:3001/admin/loan-product/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("讀取失敗");
        return res.json();
      })
      .then((data) => setProduct(data))
      .catch((err) => setError(err.message || "發生錯誤"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6">載入中...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!product) return <div className="p-6">找不到資料</div>;

  const formatNumber = (val: any) => {
    const num = Number(val);
    if (isNaN(num)) return "-";
    return Math.round(num);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4"> 產品詳細資料</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Info label="產品編號" value={product.product_code} />
        <Info label="產品名稱" value={product.product_name} />
        <Info label="所屬公司" value={product.company?.name || "-"} />
        <Info label="首放額度" value={formatNumber(product.first_amount)} />
        <Info label="借款週期" value={formatNumber(product.credit_period)} />
        <Info label="利率" value={formatNumber(product.open_rate)} />
        <Info label="開辦費率" value={formatNumber(product.setup_fee)} />
        <Info label="審查費率" value={formatNumber(product.charge_rate)} />
        <Info label="逾期日利率" value={formatNumber(product.weekly_profit)} />
        <Info label="展期費率" value={formatNumber(product.morning_rate)} />
        <Info label="展期天數" value={formatNumber(product.extension_days)} />
        <Info label="最高逾期倍數" value={formatNumber(product.max_advance_count)} />
        <Info label="提額規則" value={product.advance_rule || "-"} />
        <Info label="分期周期" value={formatNumber(product.installment_period)} />
        <Info label="最小分期" value={formatNumber(product.min_period)} />
        <Info label="最大分期" value={formatNumber(product.max_period)} />
        <Info label="分期日利率" value={formatNumber(product.daily_profit)} />
        <Info label="利息規則" value={product.interest_rule} />
        <Info label="狀態" value={product.status === "ACTIVE" ? "啟用" : product.status === "INACTIVE" ? "停用" : "-"} />
      </div>

      <div className="mt-6">
        <button
          onClick={() => router.back()}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          返回
        </button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="font-medium">{value ?? "-"}</div>
    </div>
  );
}
