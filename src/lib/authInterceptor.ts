/**
 * Authentication Interceptor for handling token invalidation and refresh
 * Automatically redirects to duplicate-login page when session is invalidated
 */

import { getToken, logout } from './useAuth';

interface AuthInterceptorConfig {
  companyCode: string;
  duplicateLoginPath: string;
}

// Global flag to prevent multiple redirections
let isRedirecting = false;

// Track consecutive 500 errors for session invalidation detection
let consecutive500Errors = 0;
let last500ErrorTime = 0;

/**
 * Intercept fetch requests and handle authentication errors
 */
export function createAuthInterceptor(config: AuthInterceptorConfig) {
  const originalFetch = window.fetch;

  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    // Get current token
    const token = getToken(config.companyCode);
    
    // Add Authorization header if token exists and not already present
    if (token && init?.headers) {
      const headers = new Headers(init.headers);
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      init.headers = headers;
    } else if (token && !init?.headers) {
      init = {
        ...init,
        headers: {
          'Authorization': `Bearer ${token}`,
          ...init?.headers,
        }
      };
    }

    try {
      const response = await originalFetch(input, init);
      
      // Check for authentication errors (401, 403, 500 with session errors)
      if (response.status === 401 || response.status === 403 || response.status === 500) {
        
        // Handle 500 errors with consecutive error tracking
        if (response.status === 500) {
          const now = Date.now();
          const url = input.toString();
          
          // Reset counter if it's been more than 10 seconds since last error
          if (now - last500ErrorTime > 10000) {
            consecutive500Errors = 0;
          }
          
          consecutive500Errors++;
          last500ErrorTime = now;
          
          // If we have 2 or more consecutive 500 errors on portal APIs, try to validate token first
          if (consecutive500Errors >= 2 && url.includes('/portal/')) {
            // Try to validate token before assuming session invalidation
            validateTokenAndHandle(config);
            return response;
          }
        } else {
          // Reset 500 error counter for non-500 errors
          consecutive500Errors = 0;
        }
        
        try {
          const responseData = await response.clone().json();
          
          // Check if it's a session invalidation error
          if (responseData.message?.includes('Session invalid') || 
              responseData.message?.includes('被踢下線') ||
              responseData.message?.includes('會話已失效') ||
              responseData.message?.includes('user may have been logged out') ||
              responseData.message?.includes('Token 無效') ||
              responseData.message?.includes('Token 已過期')) {
            
            handleSessionInvalidation(config);
            return response; // Return the original response
          }
          
          // For 500 errors, also check for JWT strategy validation errors
          if (response.status === 500 && responseData.message?.includes('Error: Session invalid')) {
            handleSessionInvalidation(config);
            return response;
          }
          
        } catch (parseError) {
          // If response is not JSON, check if it's likely an auth error
          if (response.status === 401 || response.status === 403) {
            handleSessionInvalidation(config);
          }
        }
      } else {
        // Reset 500 error counter for successful responses
        consecutive500Errors = 0;
      }
      
      return response;
    } catch (error) {
      // Check if the error message contains session invalidation keywords
      const errorMessage = error?.message || '';
      if (errorMessage.includes('Session invalid') || 
          errorMessage.includes('被踢下線') ||
          errorMessage.includes('會話已失效')) {
        handleSessionInvalidation(config);
      }
      throw error;
    }
  };
}

/**
 * Validate token before handling session invalidation
 */
async function validateTokenAndHandle(config: AuthInterceptorConfig) {
  if (isRedirecting) return;
  
  try {
    const token = getToken(config.companyCode);
    if (!token) {
      handleSessionInvalidation(config);
      return;
    }
    
    const response = await fetch('/api/portal/validate-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      // Token 確實無效，清除並重定向到登入頁面
      handleTokenInvalidation(config);
    } else {
      // Token 有效，可能是暫時的伺服器問題，重置錯誤計數器
      consecutive500Errors = 0;
    }
  } catch (error) {
    // 網路錯誤或其他問題，也重定向到登入頁面
    handleTokenInvalidation(config);
  }
}

/**
 * Handle token invalidation by clearing local data and redirecting to login
 */
function handleTokenInvalidation(config: AuthInterceptorConfig) {
  if (isRedirecting) return;
  
  isRedirecting = true;
  
  // Clear local storage for this company
  logout(config.companyCode);
  
  // Also clear additional session-related data
  localStorage.removeItem(`sessionId_${config.companyCode}`);
  localStorage.removeItem(`tokenCreatedTime_${config.companyCode}`);
  
  // Reset consecutive error counter
  consecutive500Errors = 0;
  
  // Redirect to login page instead of duplicate-login page
  setTimeout(() => {
    window.location.href = `/${config.companyCode}/login`;
  }, 100);
}

/**
 * Handle session invalidation by clearing local data and redirecting
 */
function handleSessionInvalidation(config: AuthInterceptorConfig) {
  if (isRedirecting) return;
  
  isRedirecting = true;
  
  // Clear local storage for this company
  logout(config.companyCode);
  
  // Also clear additional session-related data
  localStorage.removeItem(`sessionId_${config.companyCode}`);
  localStorage.removeItem(`tokenCreatedTime_${config.companyCode}`);
  
  // Reset consecutive error counter
  consecutive500Errors = 0;
  
  // Redirect after a short delay to ensure cleanup completes
  setTimeout(() => {
    window.location.href = config.duplicateLoginPath;
  }, 100);
}

/**
 * Setup auth interceptor for company A
 */
export function setupCompanyAAuthInterceptor() {
  createAuthInterceptor({
    companyCode: 'a',
    duplicateLoginPath: '/a/duplicate-login'
  });
}

/**
 * Setup auth interceptor for company B
 */
export function setupCompanyBAuthInterceptor() {
  createAuthInterceptor({
    companyCode: 'b',
    duplicateLoginPath: '/b/duplicate-login'
  });
}

/**
 * Restore original fetch (for cleanup)
 */
export function removeAuthInterceptor() {
  // Note: This is a simplified cleanup. In a real implementation,
  // you might want to store the original fetch in a variable
  isRedirecting = false;
}