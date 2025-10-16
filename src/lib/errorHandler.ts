// 統一錯誤處理機制

export interface ErrorInfo {
  message: string;
  code?: string;
  context?: string;
  originalError?: any;
  timestamp?: string;
}

export interface ErrorHandlerOptions {
  showAlert?: boolean;
  logToConsole?: boolean;
  logToServer?: boolean;
  fallbackMessage?: string;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  
  // 獲取單例實例
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // 處理 API 錯誤
  handleApiError(
    error: any, 
    context: string, 
    options: ErrorHandlerOptions = {}
  ): ErrorInfo {
    const {
      showAlert = true,
      logToConsole = true,
      logToServer = false,
      fallbackMessage = '操作失敗，請稍後重試'
    } = options;

    let errorInfo: ErrorInfo;

    // 解析不同類型的錯誤
    if (error?.response) {
      // HTTP 錯誤回應
      errorInfo = {
        message: error.response.data?.message || error.message || fallbackMessage,
        code: error.response.status?.toString(),
        context,
        originalError: error,
        timestamp: new Date().toISOString()
      };
    } else if (error?.message) {
      // JavaScript 錯誤
      errorInfo = {
        message: error.message,
        context,
        originalError: error,
        timestamp: new Date().toISOString()
      };
    } else if (typeof error === 'string') {
      // 字符串錯誤
      errorInfo = {
        message: error,
        context,
        timestamp: new Date().toISOString()
      };
    } else {
      // 未知錯誤
      errorInfo = {
        message: fallbackMessage,
        context,
        originalError: error,
        timestamp: new Date().toISOString()
      };
    }

    // 控制台日誌
    if (logToConsole) {
      console.group(`🚨 Error in ${context}`);
      console.error('Message:', errorInfo.message);
      console.error('Code:', errorInfo.code);
      console.error('Original Error:', errorInfo.originalError);
      console.error('Timestamp:', errorInfo.timestamp);
      console.groupEnd();
    }

    // 顯示用戶提示
    if (showAlert) {
      this.showUserFriendlyError(errorInfo);
    }

    // 發送到服務器（可選）
    if (logToServer) {
      this.logToServer(errorInfo);
    }

    return errorInfo;
  }

  // 處理網路錯誤
  handleNetworkError(context: string, options: ErrorHandlerOptions = {}): ErrorInfo {
    return this.handleApiError(
      new Error('網路連線異常，請檢查網路狀態'),
      context,
      { ...options, fallbackMessage: '網路連線異常，請檢查網路狀態' }
    );
  }

  // 處理超時錯誤
  handleTimeoutError(context: string, options: ErrorHandlerOptions = {}): ErrorInfo {
    return this.handleApiError(
      new Error('請求超時，請稍後重試'),
      context,
      { ...options, fallbackMessage: '請求超時，請稍後重試' }
    );
  }

  // 顯示用戶友好的錯誤信息
  private showUserFriendlyError(errorInfo: ErrorInfo): void {
    // 根據錯誤類型顯示不同的訊息
    let userMessage = errorInfo.message;

    // 針對常見錯誤進行友好化處理
    if (errorInfo.code === '401') {
      userMessage = '登入已過期，請重新登入';
    } else if (errorInfo.code === '403') {
      userMessage = '權限不足，無法執行此操作';
    } else if (errorInfo.code === '404') {
      userMessage = '找不到相關資料';
    } else if (errorInfo.code === '500') {
      userMessage = '服務器異常，請稍後重試';
    } else if (errorInfo.message.includes('Network Error') || errorInfo.message.includes('fetch')) {
      userMessage = '網路連線異常，請檢查網路狀態';
    }

    // 使用 alert（後續可以替換為更好的 UI 組件）
    alert(userMessage);
  }

  // 發送錯誤到服務器（可選實現）
  private async logToServer(errorInfo: ErrorInfo): Promise<void> {
    try {
      // 這裡可以實現發送錯誤到服務器的邏輯
      // 例如發送到錯誤追蹤服務
      console.log('Would send to server:', errorInfo);
    } catch (e) {
      console.warn('Failed to log error to server:', e);
    }
  }

  // 創建錯誤邊界處理器
  createErrorBoundaryHandler(componentName: string) {
    return (error: Error, errorInfo: any) => {
      this.handleApiError(error, `ErrorBoundary-${componentName}`, {
        showAlert: false,
        logToConsole: true,
        logToServer: true
      });
    };
  }
}

// 導出單例實例和便捷方法
export const errorHandler = ErrorHandler.getInstance();

// 便捷的錯誤處理函數
export const handleApiError = (error: any, context: string, options?: ErrorHandlerOptions) => 
  errorHandler.handleApiError(error, context, options);

export const handleNetworkError = (context: string, options?: ErrorHandlerOptions) => 
  errorHandler.handleNetworkError(context, options);

export const handleTimeoutError = (context: string, options?: ErrorHandlerOptions) => 
  errorHandler.handleTimeoutError(context, options);