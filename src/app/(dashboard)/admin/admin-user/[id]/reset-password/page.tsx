// frontend/src/app/(dashboard)/admin/admin-user/[id]/reset-password/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function AdminUserResetPasswordPage() {
  const router = useRouter();
  const { id } = useParams();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!password.trim() || !confirm.trim()) {
      setError("密碼不得為空");
      return;
    }

    if (password !== confirm) {
      setError("密碼不一致");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3001/user/${id}/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword: password }), 
      });
      if (!res.ok) throw new Error("重設失敗");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "發生錯誤");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="b-ibox">
      <h1>重設密碼</h1>

      <div className="b-ibox-s">

        <div className="b-form-group-1 w100 fl4">
          <label>新密碼</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w70"
          />
        </div>

        <div className="b-form-group-1 w100 fl4">
          <label>確認新密碼</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w70"
          />
        </div>

        <div className="ps-err-box">
          {error && <p className="ps-err mb15">{error}</p>}
          {success && <p className="ps-err-ok mb15">密碼已成功更新</p>}
        </div>

        

        <div className="fl4 w100 b-btnbox">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="b-btn-s2 b-btn-c4 mr20"
          >
            確認修改
          </button>
          <button
            onClick={() => router.back()}
            className="b-btn-s2 b-btn-c1"
          >
            返回
          </button>
        </div>
      </div>
    </div>
  );
}
