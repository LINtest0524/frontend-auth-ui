'use client'
import { useParams } from 'next/navigation'

export function useCompanySlug(): string | null {
  const params = useParams()

  if (typeof params === 'object') {
    if ('company' in params) return params.company as string
    const keys = Object.keys(params)
    if (keys.length === 1) return params[keys[0]] as string
  }

  if (typeof window !== 'undefined') {
    const match = window.location.pathname.match(/^\/([^\/]+)/)
    return match ? match[1] : null
  }

  return null
}