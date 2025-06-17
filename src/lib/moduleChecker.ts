type ModuleConfig = Record<string, boolean>

export function getEnabledModules(): ModuleConfig {
  if (typeof window === 'undefined') return {}
  const raw = localStorage.getItem('enabledModules')
  return raw ? JSON.parse(raw) : {}
}

export function isModuleEnabled(key: string): boolean {
  return getEnabledModules()[key] === true
}
