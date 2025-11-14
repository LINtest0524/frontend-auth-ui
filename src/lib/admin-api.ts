const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

// 專門給後台管理使用的 API 函數
function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // 嘗試多種可能的 token 存儲方式
  const possibleKeys = [
    'portalToken',
    'portalToken_admin',
    'adminToken',
    'token'
  ];
  
  for (const key of possibleKeys) {
    const token = localStorage.getItem(key);
    if (token) {
      return token;
    }
  }
  
  return null;
}

// 清除所有可能的 token
function clearAllTokens(): void {
  if (typeof window === 'undefined') return;
  
  const possibleKeys = [
    'portalToken',
    'portalToken_admin',
    'adminToken',
    'token'
  ];
  
  possibleKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('🧹 已清除所有 token，請重新登入');
}

export async function adminApiGet<T = any>(path: string): Promise<T> {
  const token = getAdminToken();
  
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });
  
  if (!res.ok) {
    // 401 錯誤自動清除無效 token
    if (res.status === 401) {
      clearAllTokens();
    }
    
    const errorText = await res.text().catch(() => '');
    throw new Error(`GET ${path} failed: ${res.status} ${errorText}`);
  }
  
  return res.json();
}

export async function adminApiPost<T = any>(path: string, body?: any): Promise<T> {
  const token = getAdminToken();
  
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  
  if (!res.ok) {
    // 401 錯誤自動清除無效 token
    if (res.status === 401) {
      clearAllTokens();
    }
    
    const text = await res.text().catch(() => '');
    throw new Error(`POST ${path} failed: ${res.status} ${text}`);
  }
  
  return res.json();
}

export async function adminApiPut<T = any>(path: string, body?: any): Promise<T> {
  const token = getAdminToken();
  
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  
  if (!res.ok) {
    // 401 錯誤自動清除無效 token
    if (res.status === 401) {
      clearAllTokens();
    }
    
    const text = await res.text().catch(() => '');
    throw new Error(`PUT ${path} failed: ${res.status} ${text}`);
  }
  
  return res.json();
}

export async function adminApiDelete<T = any>(path: string): Promise<T> {
  const token = getAdminToken();
  
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  
  if (!res.ok) {
    // 401 錯誤自動清除無效 token
    if (res.status === 401) {
      clearAllTokens();
    }
    
    const text = await res.text().catch(() => '');
    throw new Error(`DELETE ${path} failed: ${res.status} ${text}`);
  }
  
  return res.json();
}