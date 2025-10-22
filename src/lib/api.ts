const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

// 動態獲取當前公司的 token
function getPortalToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // 從當前路徑獲取公司代碼
  const pathname = window.location.pathname;
  const companyCode = pathname.split('/')[1] || 'a'; // 預設為 'a'
  
  return localStorage.getItem(`portalToken_${companyCode}`);
}

export async function apiGet(path: string) {
  const token = getPortalToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`GET ${path} failed: ${res.status} ${errorText}`);
  }
  return res.json();
}

export async function apiPost(path: string, body?: any) {
  const token = getPortalToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`POST ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}