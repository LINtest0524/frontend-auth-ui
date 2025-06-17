export function isModuleEnabled(moduleName: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const raw = localStorage.getItem('enabledModules');
    if (!raw) return false;

    const modules: string[] = JSON.parse(raw);
    return modules.includes(moduleName);
  } catch {
    return false;
  }
}
