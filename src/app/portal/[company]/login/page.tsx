'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function CompanyLoginPage() {
  const router = useRouter();
  const { company } = useParams();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/portal/auth/login?company=${company}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || '登入失敗');
      }

      // ✅ 儲存基本資訊
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // ✅ 模組請求
      const modulesRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/portal/module/my-modules`,
        {
          headers: { Authorization: `Bearer ${data.token}` },
        }
      );

      const modulesArray = await modulesRes.json();
      console.log('🧩 取得模組清單:', modulesArray);

      if (!Array.isArray(modulesArray)) {
        throw new Error('模組資料格式錯誤');
      }

      const moduleMap = Object.fromEntries(
        modulesArray.map((key: string) => [key, true])
      );

      localStorage.setItem('enabledModules', JSON.stringify(moduleMap));

      router.push(`/portal/${company}`);
    } catch (err: any) {
      console.error('❌ 登入錯誤:', err);
      setError(err.message || '發生錯誤');
    }
  };

  return (
    <div className="flex h-screen justify-center items-center bg-gray-100">
      <Card className="w-[400px] shadow-2xl">
        <CardContent className="space-y-6 pt-10">
          <h2 className="text-center text-xl font-bold">
            {decodeURIComponent(company as string)} 登入 Login
          </h2>

          <div className="space-y-2">
            <Label>帳號 Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="請輸入帳號"
            />
          </div>

          <div className="space-y-2">
            <Label>密碼 Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入密碼"
            />
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <Button className="w-full" onClick={handleLogin}>
            登入
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
