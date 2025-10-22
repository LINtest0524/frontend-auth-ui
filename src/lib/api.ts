const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

// 前台正確的 token key：portalToken_a
function getPortalTokenA(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('portalToken_a');
}

export async function apiGet(path: string) {
  const token = getPortalTokenA();
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
  const token = getPortalTokenA();
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