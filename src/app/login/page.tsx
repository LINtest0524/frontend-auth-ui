'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
// import { Input } from '@/components/ui/input'
// import { Button } from '@/components/ui/button'
// import { Card, CardContent } from '@/components/ui/card'
// import { Label } from '@/components/ui/label'

import '@/styles/pages/back-login.css'

export default function Login() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setError('')
    try {
      const res = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || '登入失敗')
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || '發生錯誤')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleLogin()
  }

  return (
    <div className="bigbox">
      <div className="conbox-back-login">

            <form onSubmit={handleSubmit} className="login-box1">
              <h2 className="txt-h2">登入管理後台</h2>

                <label htmlFor="username1" className="dn-1">帳號</label>
                <input
                  type="text"
                  id="username1"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="請輸入帳號"
                />

                <label htmlFor="userpw" className="dn-1">密碼</label>
                <input
                  type="password"
                  id="userpw"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="請輸入密碼"
                />
          

              {error && <div className="ps-err mb15">{error}</div>}

              <button className="btn-primary w100" type="submit">
                登入
              </button>
            </form>

      </div>
    </div>
  )
}
