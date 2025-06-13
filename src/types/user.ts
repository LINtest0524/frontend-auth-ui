export interface User {
  id: number
  username: string
  email: string
  created_at: string
  status: string
  last_login_ip?: string
  last_login_platform?: string
  last_login_at?: string
}
