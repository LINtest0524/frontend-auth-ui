"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductDetailCreatePage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [companies, setCompanies] = useState<{ id: number; name: string }[]>([]);

  const [form, setForm] = useState({
    productType: "A",
    productName: "",
    firstAmount: "",
    creditPeriod: "",
    openRate: "",
    setupFee: "",
    chargeRate: "",
    weeklyProfit: "",
    morningRate: "",
    extensionDays: "",
    maxAdvanceCount: "",
    advanceRule: "",
    installmentPeriod: "",
    minPeriod: "",
    maxPeriod: "",
    dailyProfit: "",
    interestRule: "先扣",
    companyId: undefined as number | undefined,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const rawUser = localStorage.getItem("user");
    if (token && rawUser) {
      const parsed = JSON.parse(rawUser);
      setCurrentUser(parsed);

      if (parsed.role === "SUPER_ADMIN") {
        fetch("http://localhost:3001/company", {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) {
              setCompanies(data);
            } else if (Array.isArray(data.data)) {
              setCompanies(data.data);
            } else {
              setCompanies([]);
              console.warn("公司資料格式錯誤", data);
            }
          });
      }
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "companyId" ? Number(value) : value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    const payload = {
      ...form,
      companyId:
        currentUser.role === "SUPER_ADMIN"
          ? form.companyId
          : currentUser.companyId,
    };

    try {
      const res = await fetch("http://localhost:3001/admin/product-detail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("建立失敗");
      router.push("/admin/product-detail");
    } catch (err: any) {
      setError(err.message || "發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold mb-4">➕ 新增產品詳情</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 欄位群組 */}
        {[
          ["productName", "產品名稱", "請輸入產品名稱"],
          ["firstAmount", "首放額度", "請輸入首放額度"],
          ["creditPeriod", "借款周期", "請輸入借款天數"],
          ["openRate", "利率", "單位為 %"],
          ["setupFee", "開辦費率", "單位為 %"],
          ["chargeRate", "審查費率", "單位為 %"],
          ["weeklyProfit", "逾期日利率", "單位為 %"],
          ["morningRate", "展期費率", "單位為 %"],
          ["extensionDays", "展期天數", "請輸入天數"],
          ["maxAdvanceCount", "最高逾期為訂金的倍數", "請輸入倍數"],
          ["advanceRule", "提額規則", "請輸入規則數值"],
          ["installmentPeriod", "分期周期", ""],
          ["minPeriod", "最小分期", "請輸入期數"],
          ["maxPeriod", "最高分期", "請輸入期數"],
          ["dailyProfit", "分期日利率", "單位為 %"],
        ].map(([name, label, placeholder]) => (
          <div key={name as string}>
            <label htmlFor={name as string} className="block font-medium mb-1">
              {label}
            </label>
            <input
              id={name as string}
              name={name as string}
              value={(form as any)[name as string]}
              onChange={handleChange}
              placeholder={placeholder as string}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
        ))}

        <div>
          <label className="block font-medium mb-1">利息規則</label>
          <select
            name="interestRule"
            value={form.interestRule}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="先扣">先扣</option>
            <option value="後扣">後扣</option>
            <option value="按比例扣">按比例扣</option>
          </select>
        </div>

        {currentUser?.role === "SUPER_ADMIN" && (
          <div>
            <label className="block font-medium mb-1">所屬公司</label>
            <select
              name="companyId"
              value={form.companyId || ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="">請選擇公司</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        {loading ? "儲存中..." : "儲存產品"}
      </button>
    </div>
  );
}