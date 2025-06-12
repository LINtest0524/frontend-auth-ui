export function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export function getUser() {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('user')
  return raw ? JSON.parse(raw) : null
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}
