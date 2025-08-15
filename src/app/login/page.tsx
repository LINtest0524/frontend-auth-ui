'use client'

import { useState, useRef, useEffect } from 'react'
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
  const [audioEnabled, setAudioEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('audioEnabled') === 'true'
    }
    return false
  })
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 啟用音效功能
  const enableAudio = async () => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/sounds/verification.mp3')
      audioRef.current.preload = 'auto'
    }

    if (!audioEnabled) {
      try {
        console.log('嘗試啟用音效...')
        // 嘗試播放靜音音效來啟用音頻上下文
        audioRef.current.volume = 0
        await audioRef.current.play()
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current.volume = 0.5
        
        setAudioEnabled(true)
        localStorage.setItem('audioEnabled', 'true')
        console.log('音效已靜默啟用')
        
        // 不播放測試音效，只是靜默啟用
      } catch (err) {
        console.log('音效啟用失敗:', err)
      }
    }
  }

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

  // 添加點擊事件監聽器來啟用音效（和後台一樣的機制）
  useEffect(() => {
    const handleUserInteraction = () => {
      enableAudio()
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('keydown', handleUserInteraction)
    }

    if (!audioEnabled) {
      document.addEventListener('click', handleUserInteraction)
      document.addEventListener('keydown', handleUserInteraction)
    }

    return () => {
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('keydown', handleUserInteraction)
    }
  }, [audioEnabled])

  return (
    <div className="bigbox">
      <div className="conbox-back-login">

            <form onSubmit={handleSubmit} className="login-box1">
              <h2 className="txt-h2">登入管理後台</h2>

                <label htmlFor="username1" className="dn-1">帳號</label>
                <input
                  type="text"
                  id="username1"
                  className="mb15 w100"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="請輸入帳號"
                />

                <label htmlFor="userpw" className="dn-1">密碼</label>
                <input
                  type="password"
                  id="userpw"
                  className="mb15 w100"
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
