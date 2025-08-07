export function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('portalToken')
}

export function getUser() {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('portalUser')
  return raw ? JSON.parse(raw) : null
}

export function logout() {
  localStorage.removeItem('portalToken')
  localStorage.removeItem('portalUser')
  localStorage.removeItem('enabledModules')
}
