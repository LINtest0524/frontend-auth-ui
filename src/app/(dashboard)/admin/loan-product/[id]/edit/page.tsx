"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LoanProductEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`http://localhost:3001/admin/loan-product/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("載入資料失敗");
        return res.json();
      })
      .then((data) => {
        setForm(data);
      })
      .catch((err) => {
        setError(err.message || "發生錯誤");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const numberFields = [
    "first_amount", "credit_period", "open_rate", "setup_fee", "charge_rate",
    "weekly_profit", "morning_rate", "extension_days", "max_advance_count",
    "installment_period", "min_period", "max_period", "daily_profit"
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({
      ...prev,
      [name]: numberFields.includes(name) ? Number(value) : value,
    }));
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:3001/admin/loan-product/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("更新失敗");
      router.push("/admin/loan-product");
    } catch (err: any) {
      setError(err.message || "發生錯誤");
    }
  };

  if (loading) return <div className="p-6">載入中...</div>;
  if (!form) return <div className="p-6 text-red-600">{error || "資料不存在"}</div>;

  const input = (name: string, label: string, type = "text") => (
    <div>
      <label className="block mb-1 font-medium">{label}</label>
      <input
        name={name}
        type={type}
        value={
          numberFields.includes(name)
            ? form[name] !== undefined && form[name] !== null
              ? Math.floor(form[name])
              : ""
            : form[name] ?? ""
        }
        onChange={handleChange}
        className="w-full border px-3 py-2 rounded"
      />
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4">✏️ 編輯產品</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div>
          <label className="block mb-1 font-medium">產品編號</label>
          <input
            name="product_code"
            value={form.product_code || ""}
            readOnly
            className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-500"
          />
        </div>

        {input("product_name", "產品名稱")}
        {input("first_amount", "首放額度")}
        {input("credit_period", "借款週期")}
        {input("open_rate", "利率")}
        {input("setup_fee", "開辦費率")}
        {input("charge_rate", "審查費率")}
        {input("weekly_profit", "逾期日利率")}
        {input("morning_rate", "展期費率")}
        {input("extension_days", "展期天數")}
        {input("max_advance_count", "最高逾期倍數")}
        {input("advance_rule", "提額規則")}
        {input("installment_period", "分期周期")}
        {input("min_period", "最小分期")}
        {input("max_period", "最大分期")}
        {input("daily_profit", "分期日利率")}

        {/* 利息規則 */}
        <div>
          <label className="block mb-1 font-medium">利息規則</label>
          <select
            name="interest_rule"
            value={form.interest_rule}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="先扣">先扣</option>
            <option value="後扣">後扣</option>
            <option value="按比例扣">按比例扣</option>
          </select>
        </div>

        {/* 狀態 */}
        <div>
          <label className="block mb-1 font-medium">狀態</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="ACTIVE">啟用</option>
            <option value="INACTIVE">停用</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          儲存變更
        </button>
        <button
          onClick={() => router.back()}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          返回
        </button>
      </div>

      {error && <p className="text-red-600 mt-4">{error}</p>}
    </div>
  );
}
