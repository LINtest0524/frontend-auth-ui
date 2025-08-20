'use client'

import { useEffect, useRef } from 'react'

interface EcpayFormProps {
  action: string
  params: Record<string, string>
}

export default function EcpayForm({ action, params }: EcpayFormProps) {
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    // 當組件掛載後自動提交表單
    if (formRef.current) {
      formRef.current.submit()
    }
  }, [])

  return (
    <form ref={formRef} method="POST" action={action} style={{ display: 'none' }}>
      {Object.entries(params).map(([key, value]) => (
        <input
          key={key}
          type="hidden"
          name={key}
          value={value}
        />
      ))}
    </form>
  )
}