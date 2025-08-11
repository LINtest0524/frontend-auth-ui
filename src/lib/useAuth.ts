export function getToken(companyCode?: string) {
  if (typeof window === 'undefined') return null
  const key = companyCode ? `portalToken_${companyCode}` : 'portalToken'
  return localStorage.getItem(key)
}

export function getUser(companyCode?: string) {
  if (typeof window === 'undefined') return null
  const key = companyCode ? `portalUser_${companyCode}` : 'portalUser'
  const raw = localStorage.getItem(key)
  return raw ? JSON.parse(raw) : null
}

export function setToken(token: string, companyCode?: string) {
  if (typeof window === 'undefined') return
  const key = companyCode ? `portalToken_${companyCode}` : 'portalToken'
  localStorage.setItem(key, token)
  
  // 記錄 token 創建時間，用於避免立即驗證
  const timeKey = companyCode ? `tokenCreatedTime_${companyCode}` : 'tokenCreatedTime'
  localStorage.setItem(timeKey, Date.now().toString())
}

export function setUser(user: any, companyCode?: string) {
  if (typeof window === 'undefined') return
  const key = companyCode ? `portalUser_${companyCode}` : 'portalUser'
  localStorage.setItem(key, JSON.stringify(user))
}

export function setEnabledModules(modules: any, companyCode?: string) {
  if (typeof window === 'undefined') return
  const key = companyCode ? `enabledModules_${companyCode}` : 'enabledModules'
  localStorage.setItem(key, JSON.stringify(modules))
}

export function getEnabledModules(companyCode?: string) {
  if (typeof window === 'undefined') return null
  const key = companyCode ? `enabledModules_${companyCode}` : 'enabledModules'
  const raw = localStorage.getItem(key)
  return raw ? JSON.parse(raw) : null
}

export function logout(companyCode?: string) {
  if (typeof window === 'undefined') return
  const tokenKey = companyCode ? `portalToken_${companyCode}` : 'portalToken'
  const userKey = companyCode ? `portalUser_${companyCode}` : 'portalUser'
  const modulesKey = companyCode ? `enabledModules_${companyCode}` : 'enabledModules'
  
  localStorage.removeItem(tokenKey)
  localStorage.removeItem(userKey)
  localStorage.removeItem(modulesKey)
}
